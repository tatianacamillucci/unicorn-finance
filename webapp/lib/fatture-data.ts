import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoFatture, demoFatturaById, demoServizi, getDemoDataset } from "@/lib/demo";
import { uuid } from "@/components/clienti/format";
import type { Cliente, Fattura, Incasso, Servizio } from "@/lib/types/gestionale";
import type { ClienteOpzione } from "@/lib/preventivi-data";

export interface FatturaRiga extends Fattura {
  cliente_nome: string;
}

/** Fatture + opzioni clienti. `pronto=false` se il DB non ha ancora le tabelle. */
export async function getFatture(): Promise<{
  pronto: boolean;
  fatture: FatturaRiga[];
  clienti: ClienteOpzione[];
}> {
  try {
    if (await isDemo()) return demoFatture();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, fatture: [], clienti: [] };
    const uid = userData.user.id;

    const [cl, fa] = await Promise.all([
      supabase.from("clienti").select("id, nome").eq("user_id", uid).order("nome"),
      supabase.from("fatture").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    if (cl.error || fa.error) {
      logServerError("getFatture", cl.error ?? fa.error);
      return { pronto: false, fatture: [], clienti: [] };
    }

    const nomi = new Map((cl.data ?? []).map((c) => [c.id, c.nome as string]));
    return {
      pronto: true,
      clienti: (cl.data ?? []) as ClienteOpzione[],
      fatture: (fa.data ?? []).map((f) => ({
        ...(f as Fattura),
        importo: Number(f.importo),
        bollo: Number(f.bollo),
        cliente_nome: nomi.get(f.cliente_id) ?? "Cliente",
      })),
    };
  } catch (e) {
    logServerError("getFatture", e);
    return { pronto: false, fatture: [], clienti: [] };
  }
}

// ---- Dettaglio fattura, listino servizi, intestazione documenti ----

export interface Intestazione {
  ragioneSociale: string;
  descrizione?: string;
  indirizzo?: string | null;
  piva?: string | null;
  iban?: string | null;
}

const INTESTAZIONE_DEFAULT: Intestazione = {
  ragioneSociale: "La tua attività",
  descrizione: "Consulenza informatica",
};

/** Intestazione dei documenti (profilo_fiscale, migrazione 0008). Se mancano le colonne: valori di base. */
export async function getIntestazione(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uid: string,
): Promise<Intestazione> {
  const { data, error } = await supabase
    .from("profilo_fiscale")
    .select("ragione_sociale, indirizzo, piva, iban")
    .eq("user_id", uid)
    .maybeSingle();
  if (error || !data) return INTESTAZIONE_DEFAULT;
  return {
    ragioneSociale: data.ragione_sociale || INTESTAZIONE_DEFAULT.ragioneSociale,
    descrizione: INTESTAZIONE_DEFAULT.descrizione,
    indirizzo: data.indirizzo ?? null,
    piva: data.piva ?? null,
    iban: data.iban ?? null,
  };
}

/** Listino servizi attivi (per la scelta rapida nelle righe). Vuoto se la tabella non c'è. */
export async function getServiziListino(): Promise<Servizio[]> {
  try {
    if (await isDemo()) return demoServizi().servizi.filter((s) => s.attivo);
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    const { data, error } = await supabase
      .from("servizi")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("attivo", true)
      .order("nome");
    if (error) return [];
    return (data ?? []).map((s) => ({ ...(s as Servizio), prezzo: Number(s.prezzo) }));
  } catch (e) {
    logServerError("getServiziListino", e);
    return [];
  }
}

export interface DettaglioFattura {
  fattura: Fattura;
  cliente: Cliente | null;
  azienda: Intestazione;
  incasso: Incasso | null;
  /** Numero del preventivo da cui nasce (se c'è). */
  preventivoNumero: string | null;
}

const ID_DEMO = /^[A-Za-z0-9-]{1,64}$/;

export async function getFatturaDettaglio(
  id: string,
): Promise<{ pronto: boolean; dettaglio: DettaglioFattura | null }> {
  try {
    if (await isDemo()) {
      if (!ID_DEMO.test(id)) return { pronto: true, dettaglio: null };
      const r = demoFatturaById(id);
      if (!r) return { pronto: true, dettaglio: null };
      const d = getDemoDataset();
      const prev = r.fattura.preventivo_id
        ? (d.preventivi.find((p) => p.id === r.fattura.preventivo_id)?.numero ?? null)
        : null;
      return {
        pronto: true,
        dettaglio: {
          fattura: r.fattura,
          cliente: r.cliente,
          azienda: r.azienda,
          incasso: d.incassi.find((i) => i.fattura_id === id) ?? null,
          preventivoNumero: prev,
        },
      };
    }
    if (!uuid.safeParse(id).success) return { pronto: true, dettaglio: null };
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, dettaglio: null };
    const uid = userData.user.id;

    const { data: f, error } = await supabase
      .from("fatture")
      .select("*")
      .eq("id", id)
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      logServerError("getFatturaDettaglio", error);
      return { pronto: false, dettaglio: null };
    }
    if (!f) return { pronto: true, dettaglio: null };

    const [cl, inc, prev, azienda] = await Promise.all([
      supabase.from("clienti").select("*").eq("id", f.cliente_id).eq("user_id", uid).maybeSingle(),
      supabase.from("incassi").select("*").eq("fattura_id", id).eq("user_id", uid).limit(1),
      f.preventivo_id
        ? supabase.from("preventivi").select("numero").eq("id", f.preventivo_id).eq("user_id", uid).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      getIntestazione(supabase, uid),
    ]);
    if (cl.error || inc.error) logServerError("getFatturaDettaglio/figli", cl.error ?? inc.error);
    const i = inc.data?.[0];
    return {
      pronto: true,
      dettaglio: {
        fattura: { ...(f as Fattura), importo: Number(f.importo), bollo: Number(f.bollo) },
        cliente: (cl.data as Cliente | null) ?? null,
        azienda,
        incasso: i
          ? ({
              ...i,
              importo: Number(i.importo),
              accantonamento_imposta: Number(i.accantonamento_imposta),
              accantonamento_inps: Number(i.accantonamento_inps),
            } as Incasso)
          : null,
        preventivoNumero: (prev.data as { numero: string | null } | null)?.numero ?? null,
      },
    };
  } catch (e) {
    logServerError("getFatturaDettaglio", e);
    return { pronto: false, dettaglio: null };
  }
}
