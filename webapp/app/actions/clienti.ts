"use server";

import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { primoErrore, testoOpz, uuid, type EsitoAzione } from "@/components/clienti/format";

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio").max(120, "Nome troppo lungo"),
  piva_cf: testoOpz(32),
  email: testoOpz(160),
  telefono: testoOpz(40),
  note: testoOpz(1000),
});

function leggiCliente(fd: FormData) {
  return clienteSchema.safeParse({
    nome: String(fd.get("nome") ?? ""),
    piva_cf: String(fd.get("piva_cf") ?? ""),
    email: String(fd.get("email") ?? ""),
    telefono: String(fd.get("telefono") ?? ""),
    note: String(fd.get("note") ?? ""),
  });
}

export async function creaCliente(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = leggiCliente(fd);
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const { error } = await supabase
    .from("clienti")
    .insert({ ...parsed.data, user_id: userData.user.id });
  if (error) {
    logServerError("creaCliente", error);
    return { error: "Impossibile salvare il cliente. Riprova." };
  }
  revalidatePath("/clienti");
  return {};
}

export async function aggiornaCliente(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Cliente non valido" };
  const parsed = leggiCliente(fd);
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const { data, error } = await supabase
    .from("clienti")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", userData.user.id)
    .select("id");
  if (error) {
    logServerError("aggiornaCliente", error);
    return { error: "Impossibile salvare il cliente. Riprova." };
  }
  if (!data?.length) return { error: "Cliente non trovato" };
  revalidatePath("/clienti");
  revalidatePath(`/clienti/${id.data}`);
  return {};
}

export async function eliminaCliente(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Cliente non valido" };

  const { error } = await supabase
    .from("clienti")
    .delete()
    .eq("id", id.data)
    .eq("user_id", userData.user.id);
  if (error) {
    logServerError("eliminaCliente", error);
    return { error: "Impossibile eliminare il cliente. Riprova." };
  }
  revalidatePath("/clienti");
  revalidatePath("/preventivi");
  revalidatePath("/fatture");
  return {};
}
