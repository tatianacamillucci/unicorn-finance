import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoSchedaCliente, getDemoDataset } from "@/lib/demo";
import { uuid } from "@/components/clienti/format";
import type { Cliente, Fattura, Incasso, Preventivo } from "@/lib/types/gestionale";

export interface ClienteConTotali extends Cliente {
  fatturato: number;
  daIncassare: number;
}

export interface ClienteElenco extends ClienteConTotali {
  /** Fatturato (emesse + incassate) con data di emissione nell'anno corrente. */
  fatturatoAnno: number;
  /** Numero di preventivi + fatture. */
  nDocumenti: number;
}

const num = (v: unknown) => Number(v ?? 0);
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type FatturaMin = Pick<Fattura, "cliente_id" | "importo" | "stato" | "data_emissione">;

function conTotali(
  clienti: Cliente[],
  fatture: FatturaMin[],
  preventivi: { cliente_id: string }[],
  anno: number,
): ClienteElenco[] {
  const tot = new Map<string, { fatturato: number; daIncassare: number; anno: number; n: number }>();
  const get = (id: string) => tot.get(id) ?? { fatturato: 0, daIncassare: 0, anno: 0, n: 0 };
  for (const f of fatture) {
    const t = get(f.cliente_id);
    t.n += 1;
    if (f.stato === "emessa" || f.stato === "incassata") {
      t.fatturato += num(f.importo);
      if (f.data_emissione?.startsWith(`${anno}-`)) t.anno += num(f.importo);
    }
    if (f.stato === "emessa") t.daIncassare += num(f.importo);
    tot.set(f.cliente_id, t);
  }
  for (const p of preventivi) {
    const t = get(p.cliente_id);
    t.n += 1;
    tot.set(p.cliente_id, t);
  }
  return clienti.map((c) => ({
    ...c,
    fatturato: r2(tot.get(c.id)?.fatturato ?? 0),
    daIncassare: r2(tot.get(c.id)?.daIncassare ?? 0),
    fatturatoAnno: r2(tot.get(c.id)?.anno ?? 0),
    nDocumenti: tot.get(c.id)?.n ?? 0,
  }));
}

/** Elenco clienti con totali. `pronto=false` se il DB non ha ancora le tabelle. */
export async function getClientiConTotali(): Promise<{
  pronto: boolean;
  clienti: ClienteElenco[];
}> {
  try {
    if (await isDemo()) {
      const d = getDemoDataset();
      const ordinati = [...d.clienti].sort((a, b) => a.nome.localeCompare(b.nome));
      return { pronto: true, clienti: conTotali(ordinati, d.fatture, d.preventivi, d.anno) };
    }
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, clienti: [] };
    const uid = userData.user.id;

    const [cl, fa, pv] = await Promise.all([
      supabase.from("clienti").select("*").eq("user_id", uid).order("nome"),
      supabase.from("fatture").select("cliente_id, importo, stato, data_emissione").eq("user_id", uid),
      supabase.from("preventivi").select("cliente_id").eq("user_id", uid),
    ]);
    if (cl.error || fa.error || pv.error) {
      logServerError("getClientiConTotali", cl.error ?? fa.error ?? pv.error);
      return { pronto: false, clienti: [] };
    }

    return {
      pronto: true,
      clienti: conTotali((cl.data ?? []) as Cliente[], (fa.data ?? []) as FatturaMin[], pv.data ?? [], new Date().getFullYear()),
    };
  } catch (e) {
    logServerError("getClientiConTotali", e);
    return { pronto: false, clienti: [] };
  }
}

export interface SchedaCliente {
  cliente: Cliente;
  preventivi: Preventivo[];
  fatture: Fattura[];
  incassi: Incasso[];
}

/** Scheda di un cliente. `pronto=false` se errore DB; `scheda=null` se non esiste. */
export async function getSchedaCliente(
  id: string,
): Promise<{ pronto: boolean; scheda: SchedaCliente | null }> {
  try {
    if (await isDemo()) return demoSchedaCliente(id);
    if (!uuid.safeParse(id).success) return { pronto: true, scheda: null };
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, scheda: null };
    const uid = userData.user.id;

    const { data: cliente, error } = await supabase
      .from("clienti")
      .select("*")
      .eq("id", id)
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      logServerError("getSchedaCliente", error);
      return { pronto: false, scheda: null };
    }
    if (!cliente) return { pronto: true, scheda: null };

    const [pv, fa, inc] = await Promise.all([
      supabase.from("preventivi").select("*").eq("cliente_id", id).eq("user_id", uid).order("data", { ascending: false }),
      supabase.from("fatture").select("*").eq("cliente_id", id).eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("incassi").select("*").eq("cliente_id", id).eq("user_id", uid).order("data", { ascending: false }),
    ]);
    if (pv.error || fa.error || inc.error) {
      logServerError("getSchedaCliente/figli", pv.error ?? fa.error ?? inc.error);
      return { pronto: false, scheda: null };
    }

    return {
      pronto: true,
      scheda: {
        cliente: cliente as Cliente,
        preventivi: (pv.data ?? []).map((p) => ({ ...p, importo: num(p.importo) })) as Preventivo[],
        fatture: (fa.data ?? []).map((f) => ({ ...f, importo: num(f.importo), bollo: num(f.bollo) })) as Fattura[],
        incassi: (inc.data ?? []).map((i) => ({
          ...i,
          importo: num(i.importo),
          accantonamento_imposta: num(i.accantonamento_imposta),
          accantonamento_inps: num(i.accantonamento_inps),
        })) as Incasso[],
      },
    };
  } catch (e) {
    logServerError("getSchedaCliente", e);
    return { pronto: false, scheda: null };
  }
}
