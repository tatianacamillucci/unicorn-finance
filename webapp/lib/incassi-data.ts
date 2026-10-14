import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import { isDemo } from "@/lib/demo/mode";
import { demoIncassi } from "@/lib/demo";

const EUR = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEuro(n: number): string {
  return EUR.format(n);
}

export { annoAperturaDa } from "@/lib/profilo-utils";

export interface IncassoView {
  id: string;
  clienteNome: string;
  data: string;
  importo: number;
  imposta: number;
  inps: number;
  resto: number;
  spostato: boolean;
}

export interface IncassiData {
  dbPronto: boolean;
  incassi: IncassoView[];
  contoTasse: { id: string; nome: string } | null;
  clienti: { id: string; nome: string }[];
  daMettereDaParte: number;
  messoDaParte: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Conto con ruolo "tasse" dell'utente (preferisce quello scelto nel profilo). */
export async function trovaContoTasse(
  userId: string,
  preferitoId: string | null,
): Promise<{ id: string; nome: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conti")
    .select("id, nome")
    .eq("user_id", userId)
    .eq("ruolo", "tasse");
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data.find((c) => c.id === preferitoId) ?? data[0];
}

export async function getIncassiData(): Promise<IncassiData> {
  const vuoto: IncassiData = {
    dbPronto: false,
    incassi: [],
    contoTasse: null,
    clienti: [],
    daMettereDaParte: 0,
    messoDaParte: 0,
  };
  try {
    if (await isDemo()) return demoIncassi();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return vuoto;
    const userId = userData.user.id;

    const profilo = await getProfiloFiscale();
    const [incRes, cliRes, contoTasse] = await Promise.all([
      supabase
        .from("incassi")
        .select(
          "id, data, importo, accantonamento_imposta, accantonamento_inps, spostato, clienti(nome)",
        )
        .eq("user_id", userId)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("clienti").select("id, nome").eq("user_id", userId).order("nome"),
      trovaContoTasse(userId, profilo.contoTasseId),
    ]);
    if (incRes.error) throw incRes.error;
    if (cliRes.error) throw cliRes.error;

    const incassi: IncassoView[] = (incRes.data ?? []).map((r) => {
      const cl = r.clienti as unknown as { nome: string } | { nome: string }[] | null;
      const nome = Array.isArray(cl) ? cl[0]?.nome : cl?.nome;
      const importo = Number(r.importo);
      const imposta = Number(r.accantonamento_imposta);
      const inps = Number(r.accantonamento_inps);
      return {
        id: r.id,
        clienteNome: nome ?? "un cliente",
        data: r.data,
        importo,
        imposta,
        inps,
        resto: r2(importo - imposta - inps),
        spostato: !!r.spostato,
      };
    });

    let tot = 0;
    let fatto = 0;
    for (const i of incassi) {
      tot += i.imposta + i.inps;
      if (i.spostato) fatto += i.imposta + i.inps;
    }
    return {
      dbPronto: true,
      incassi,
      contoTasse,
      clienti: cliRes.data ?? [],
      daMettereDaParte: r2(tot),
      messoDaParte: r2(fatto),
    };
  } catch (e) {
    logServerError("getIncassiData", e);
    return vuoto;
  }
}
