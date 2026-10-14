import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoOggi } from "@/lib/demo";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import { getProfilo } from "@/lib/profilo";
import { scadenzeFiscali, type ScadenzaFiscale } from "@/lib/fiscale";
import { annoAperturaDa } from "@/lib/incassi-data";

export interface OggiData {
  dbPronto: boolean;
  nickname: string | null;
  incassiDaSmistare: number;
  fattureDaEmettere: number;
  preventiviInAttesa: number;
  prossimaScadenza: (ScadenzaFiscale & { giorni: number }) | null;
  incassato: number;
  messoDaParte: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function getOggiData(): Promise<OggiData> {
  const vuoto: OggiData = {
    dbPronto: false,
    nickname: null,
    incassiDaSmistare: 0,
    fattureDaEmettere: 0,
    preventiviInAttesa: 0,
    prossimaScadenza: null,
    incassato: 0,
    messoDaParte: 0,
  };
  try {
    if (await isDemo()) return demoOggi();
    let nickname: string | null = null;
    try {
      nickname = (await getProfilo()).nickname;
    } catch (e) {
      logServerError("getOggiData.nickname", e);
    }
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return vuoto;
    const userId = userData.user.id;

    const oggi = new Date();
    const anno = oggi.getFullYear();
    const quattordiciFa = new Date(oggi.getTime() - 14 * 86400000);

    const profilo = await getProfiloFiscale();
    const annoApertura = annoAperturaDa(profilo);

    const [incRes, fatRes, prevRes] = await Promise.all([
      supabase
        .from("incassi")
        .select("importo, accantonamento_imposta, accantonamento_inps, spostato, data")
        .eq("user_id", userId)
        .or(`spostato.eq.false,and(data.gte.${anno}-01-01,data.lte.${anno}-12-31)`),
      supabase
        .from("fatture")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("stato", "da_emettere"),
      supabase
        .from("preventivi")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("stato", "inviato")
        .lte("data", isoDate(quattordiciFa)),
    ]);
    if (incRes.error) throw incRes.error;
    if (fatRes.error) throw fatRes.error;
    if (prevRes.error) throw prevRes.error;

    let daSmistare = 0;
    let incassato = 0;
    let messo = 0;
    for (const r of incRes.data ?? []) {
      if (!r.spostato) daSmistare += 1;
      if (r.data >= `${anno}-01-01` && r.data <= `${anno}-12-31`) {
        incassato += Number(r.importo);
        if (r.spostato) messo += Number(r.accantonamento_imposta) + Number(r.accantonamento_inps);
      }
    }

    const oggiStr = isoDate(oggi);
    const tra30 = isoDate(new Date(oggi.getTime() + 30 * 86400000));
    const prossima =
      [...scadenzeFiscali(anno, annoApertura), ...scadenzeFiscali(anno + 1, annoApertura)]
        .filter((s) => s.data >= oggiStr && s.data <= tra30)
        .sort((a, b) => a.data.localeCompare(b.data))[0] ?? null;
    const giorni = prossima
      ? Math.round((new Date(prossima.data).getTime() - new Date(oggiStr).getTime()) / 86400000)
      : 0;

    return {
      dbPronto: true,
      nickname,
      incassiDaSmistare: daSmistare,
      fattureDaEmettere: fatRes.count ?? 0,
      preventiviInAttesa: prevRes.count ?? 0,
      prossimaScadenza: prossima ? { ...prossima, giorni } : null,
      incassato: r2(incassato),
      messoDaParte: r2(messo),
    };
  } catch (e) {
    logServerError("getOggiData", e);
    return vuoto;
  }
}

// ---- Dashboard "Oggi" piena (Giro 2) ---------------------------------------------------

import {
  getSnapshot,
  giorniTra,
  kpiAnno,
  mensile,
  nomeCliente,
  emessa,
  scadenzaFattura,
  type Snapshot,
} from "@/lib/report-data";
import { costruisciVoci, type VoceScadenzario } from "@/lib/scadenzario-data";

export interface UltimaFattura {
  id: string;
  numero: string | null;
  cliente: string;
  data: string | null;
  totale: number;
  stato: "da_emettere" | "emessa" | "incassata" | "scaduta";
}

export interface AzioneOggi {
  urgenza: number;
  testo: string;
  href: string;
  vai: string;
}

export interface OggiPieno {
  dbPronto: boolean;
  oggi: string;
  anno: number;
  nickname: string | null;
  azioni: AzioneOggi[];
  kpi: ReturnType<typeof kpiAnno>;
  mensile: ReturnType<typeof mensile>;
  ultimeFatture: UltimaFattura[];
  prossime: VoceScadenzario[];
  soglia: { incassato: number };
  conto: { messo: number; daMettere: number };
}

function costruisciAzioni(s: Snapshot, voci: VoceScadenzario[]): AzioneOggi[] {
  const az: AzioneOggi[] = [];
  const sc = voci.find((v) => v.tipo === "fisco");
  if (sc) {
    const g = giorniTra(s.oggi, sc.data);
    if (g <= 30) {
      const quando = g === 0 ? "oggi" : g === 1 ? "domani" : `tra ${g} giorni`;
      az.push({ urgenza: g <= 7 ? 0 : 3, testo: `Scadenza ${quando}: ${sc.titolo}.`, href: "/tasse", vai: "Vedi le tasse" });
    }
  }
  const inRitardo = s.fatture.filter((f) => f.stato === "emessa" && (scadenzaFattura(f) ?? "9999") < s.oggi);
  if (inRitardo.length > 0)
    az.push({
      urgenza: 1,
      testo:
        inRitardo.length === 1
          ? "1 cliente non ti ha ancora pagato e il tempo è scaduto: ricordaglielo."
          : `${inRitardo.length} clienti non ti hanno ancora pagato e il tempo è scaduto: ricordaglielo.`,
      href: "/scadenzario",
      vai: "Vedi chi è in ritardo",
    });
  const daSmistare = s.incassi.filter((i) => !i.spostato).length;
  if (daSmistare > 0)
    az.push({
      urgenza: 1,
      testo:
        daSmistare === 1
          ? "C'è 1 incasso da smistare: metti da parte i soldi per le tasse."
          : `Ci sono ${daSmistare} incassi da smistare: metti da parte i soldi per le tasse.`,
      href: "/incassi",
      vai: "Vai agli incassi",
    });
  const daEmettere = s.fatture.filter((f) => f.stato === "da_emettere").length;
  if (daEmettere > 0)
    az.push({
      urgenza: 2,
      testo: daEmettere === 1 ? "C'è 1 fattura da emettere." : `Ci sono ${daEmettere} fatture da emettere.`,
      href: "/fatture",
      vai: "Vai alle fatture",
    });
  const limite = new Date(new Date(s.oggi + "T00:00:00").getTime() - 14 * 86400000);
  const lim = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(limite.getDate()).padStart(2, "0")}`;
  const prev = s.preventivi.filter((p) => p.stato === "inviato" && p.data <= lim).length;
  if (prev > 0)
    az.push({
      urgenza: 4,
      testo:
        prev === 1
          ? "1 preventivo aspetta una risposta da più di 14 giorni: chiedi al cliente."
          : `${prev} preventivi aspettano una risposta da più di 14 giorni: chiedi ai clienti.`,
      href: "/preventivi",
      vai: "Vai ai preventivi",
    });
  return az.sort((a, b) => a.urgenza - b.urgenza).slice(0, 5);
}

export async function getOggiPieno(): Promise<OggiPieno> {
  const s = await getSnapshot();
  const voci = costruisciVoci(s);
  const kpi = kpiAnno(s, s.anno);
  const ultime = s.fatture
    .filter(emessa)
    .sort((a, b) => (b.data_emissione ?? "").localeCompare(a.data_emissione ?? ""))
    .slice(0, 5)
    .map((f): UltimaFattura => {
      const sc = scadenzaFattura(f);
      return {
        id: f.id,
        numero: f.numero,
        cliente: nomeCliente(s, f.cliente_id),
        data: f.data_emissione,
        totale: Math.round((f.importo + f.bollo) * 100) / 100,
        stato: f.stato === "emessa" && sc && sc < s.oggi ? "scaduta" : f.stato,
      };
    });
  return {
    dbPronto: s.dbPronto,
    oggi: s.oggi,
    anno: s.anno,
    nickname: s.nickname,
    azioni: s.dbPronto ? costruisciAzioni(s, voci) : [],
    kpi,
    mensile: mensile(s, s.anno),
    ultimeFatture: ultime,
    prossime: voci.filter((v) => v.tipo !== "pagamento").slice(0, 5),
    soglia: { incassato: kpi.incassato },
    conto: { messo: kpi.messo, daMettere: kpi.accantonare },
  };
}
