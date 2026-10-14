"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { importoSchema, primoErrore, testoOpz, uuid, type EsitoAzione } from "@/components/clienti/format";

const servizioSchema = z.object({
  nome: z.string().trim().min(1, "Scrivi il nome del servizio").max(120, "Nome troppo lungo"),
  descrizione: testoOpz(500),
  prezzo: importoSchema,
  unita: z.enum(["una tantum", "mese", "ora", "giorno"], "Scegli l'unità"),
});

function leggi(fd: FormData) {
  return servizioSchema.safeParse({
    nome: String(fd.get("nome") ?? ""),
    descrizione: String(fd.get("descrizione") ?? ""),
    prezzo: String(fd.get("prezzo") ?? ""),
    unita: String(fd.get("unita") ?? ""),
  });
}

export async function creaServizio(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = leggi(fd);
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const { error } = await supabase.from("servizi").insert({ ...parsed.data, user_id: userData.user.id });
  if (error) {
    logServerError("creaServizio", error);
    return { error: "Impossibile salvare il servizio. Riprova." };
  }
  revalidatePath("/servizi");
  return {};
}

export async function aggiornaServizio(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Servizio non valido" };
  const parsed = leggi(fd);
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const { data, error } = await supabase
    .from("servizi")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", userData.user.id)
    .select("id");
  if (error) {
    logServerError("aggiornaServizio", error);
    return { error: "Impossibile salvare il servizio. Riprova." };
  }
  if (!data?.length) return { error: "Servizio non trovato" };
  revalidatePath("/servizi");
  return {};
}

export async function impostaServizioAttivo(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Servizio non valido" };
  const attivo = String(fd.get("attivo") ?? "") === "true";

  const { data, error } = await supabase
    .from("servizi")
    .update({ attivo })
    .eq("id", id.data)
    .eq("user_id", userData.user.id)
    .select("id");
  if (error) {
    logServerError("impostaServizioAttivo", error);
    return { error: "Impossibile aggiornare il servizio. Riprova." };
  }
  if (!data?.length) return { error: "Servizio non trovato" };
  revalidatePath("/servizi");
  return {};
}
