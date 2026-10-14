import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoPreventivi, demoPreventivoById, getDemoDataset } from "@/lib/demo";
import { uuid } from "@/components/clienti/format";
import { getIntestazione, type Intestazione } from "@/lib/fatture-data";
import type { Cliente, Preventivo } from "@/lib/types/gestionale";

export interface PreventivoRiga extends Preventivo {
  cliente_nome: string;
  fatturaCreata: boolean;
}

export interface ClienteOpzione {
  id: string;
  nome: string;
}

/** Preventivi + opzioni clienti. `pronto=false` se il DB non ha ancora le tabelle. */
export async function getPreventivi(): Promise<{
  pronto: boolean;
  preventivi: PreventivoRiga[];
  clienti: ClienteOpzione[];
}> {
  try {
    if (await isDemo()) return demoPreventivi();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, preventivi: [], clienti: [] };
    const uid = userData.user.id;

    const [cl, pv, fa] = await Promise.all([
      supabase.from("clienti").select("id, nome").eq("user_id", uid).order("nome"),
      supabase.from("preventivi").select("*").eq("user_id", uid).order("data", { ascending: false }),
      supabase.from("fatture").select("preventivo_id").eq("user_id", uid).not("preventivo_id", "is", null),
    ]);
    if (cl.error || pv.error || fa.error) {
      logServerError("getPreventivi", cl.error ?? pv.error ?? fa.error);
      return { pronto: false, preventivi: [], clienti: [] };
    }

    const nomi = new Map((cl.data ?? []).map((c) => [c.id, c.nome as string]));
    const conFattura = new Set((fa.data ?? []).map((f) => f.preventivo_id as string));

    return {
      pronto: true,
      clienti: (cl.data ?? []) as ClienteOpzione[],
      preventivi: (pv.data ?? []).map((p) => ({
        ...(p as Preventivo),
        importo: Number(p.importo),
        cliente_nome: nomi.get(p.cliente_id) ?? "Cliente",
        fatturaCreata: conFattura.has(p.id),
      })),
    };
  } catch (e) {
    logServerError("getPreventivi", e);
    return { pronto: false, preventivi: [], clienti: [] };
  }
}

export interface DettaglioPreventivo {
  preventivo: Preventivo;
  cliente: Cliente | null;
  azienda: Intestazione;
  /** Fattura già creata da questo preventivo (se c'è). */
  fatturaId: string | null;
}

const ID_DEMO = /^[A-Za-z0-9-]{1,64}$/;

export async function getPreventivoDettaglio(
  id: string,
): Promise<{ pronto: boolean; dettaglio: DettaglioPreventivo | null }> {
  try {
    if (await isDemo()) {
      if (!ID_DEMO.test(id)) return { pronto: true, dettaglio: null };
      const r = demoPreventivoById(id);
      if (!r) return { pronto: true, dettaglio: null };
      const fat = getDemoDataset().fatture.find((f) => f.preventivo_id === id);
      return {
        pronto: true,
        dettaglio: { preventivo: r.preventivo, cliente: r.cliente, azienda: r.azienda, fatturaId: fat?.id ?? null },
      };
    }
    if (!uuid.safeParse(id).success) return { pronto: true, dettaglio: null };
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, dettaglio: null };
    const uid = userData.user.id;

    const { data: p, error } = await supabase
      .from("preventivi")
      .select("*")
      .eq("id", id)
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      logServerError("getPreventivoDettaglio", error);
      return { pronto: false, dettaglio: null };
    }
    if (!p) return { pronto: true, dettaglio: null };

    const [cl, fa, azienda] = await Promise.all([
      supabase.from("clienti").select("*").eq("id", p.cliente_id).eq("user_id", uid).maybeSingle(),
      supabase.from("fatture").select("id").eq("preventivo_id", id).eq("user_id", uid).limit(1),
      getIntestazione(supabase, uid),
    ]);
    if (cl.error || fa.error) logServerError("getPreventivoDettaglio/figli", cl.error ?? fa.error);
    return {
      pronto: true,
      dettaglio: {
        preventivo: { ...(p as Preventivo), importo: Number(p.importo) },
        cliente: (cl.data as Cliente | null) ?? null,
        azienda,
        fatturaId: fa.data?.[0]?.id ?? null,
      },
    };
  } catch (e) {
    logServerError("getPreventivoDettaglio", e);
    return { pronto: false, dettaglio: null };
  }
}
