import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoTasse } from "@/lib/demo";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import { scadenzeFiscali, type ScadenzaFiscale } from "@/lib/fiscale";
import { annoAperturaDa } from "@/lib/incassi-data";

export interface BolloTrimestre {
  trimestre: 1 | 2 | 3 | 4;
  fattureConBollo: number;
  totale: number;
}

export interface TasseData {
  dbPronto: boolean;
  anno: number;
  annoApertura: number;
  incassato: number;
  stima: number;
  scadenze: ScadenzaFiscale[];
  bollo: BolloTrimestre[];
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function trimestreDaTitolo(titolo: string): 1 | 2 | 3 | 4 | null {
  const m = /^Bollo (\d)/.exec(titolo);
  return m ? (Number(m[1]) as 1 | 2 | 3 | 4) : null;
}

export async function getTasseData(anno: number): Promise<TasseData> {
  const base: TasseData = {
    dbPronto: false,
    anno,
    annoApertura: 2027,
    incassato: 0,
    stima: 0,
    scadenze: [],
    bollo: [1, 2, 3, 4].map((t) => ({
      trimestre: t as 1 | 2 | 3 | 4,
      fattureConBollo: 0,
      totale: 0,
    })),
  };
  try {
    if (await isDemo()) return demoTasse(anno);
    const profilo = await getProfiloFiscale();
    const annoApertura = annoAperturaDa(profilo);
    base.annoApertura = annoApertura;
    base.scadenze = scadenzeFiscali(anno, annoApertura);

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return base;
    const userId = userData.user.id;

    const [incRes, fatRes] = await Promise.all([
      supabase
        .from("incassi")
        .select("importo, accantonamento_imposta, accantonamento_inps")
        .eq("user_id", userId)
        .gte("data", `${anno}-01-01`)
        .lte("data", `${anno}-12-31`),
      supabase
        .from("fatture")
        .select("bollo, data_emissione")
        .eq("user_id", userId)
        .in("stato", ["emessa", "incassata"])
        .gt("bollo", 0)
        .gte("data_emissione", `${anno}-01-01`)
        .lte("data_emissione", `${anno}-12-31`),
    ]);
    if (incRes.error) throw incRes.error;
    if (fatRes.error) throw fatRes.error;

    let incassato = 0;
    let stima = 0;
    for (const r of incRes.data ?? []) {
      incassato += Number(r.importo);
      stima += Number(r.accantonamento_imposta) + Number(r.accantonamento_inps);
    }
    const bollo = base.bollo.map((b) => ({ ...b }));
    for (const f of fatRes.data ?? []) {
      if (!f.data_emissione) continue;
      const mese = Number(String(f.data_emissione).slice(5, 7));
      const q = Math.min(4, Math.max(1, Math.ceil(mese / 3))) - 1;
      bollo[q].fattureConBollo += 1;
      bollo[q].totale = r2(bollo[q].totale + Number(f.bollo));
    }
    return { ...base, dbPronto: true, incassato: r2(incassato), stima: r2(stima), bollo };
  } catch (e) {
    logServerError("getTasseData", e);
    return base;
  }
}
