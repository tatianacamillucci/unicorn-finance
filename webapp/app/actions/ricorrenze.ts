"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function createRicorrenza(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  const userId = userData.user.id;

  const nome = String(formData.get("nome") ?? "").trim();
  const conto_id = String(formData.get("conto_id") ?? "");
  const categoria_id = String(formData.get("categoria_id") ?? "");
  const importoRaw = String(formData.get("importo") ?? "");
  const importo = Number(importoRaw);
  const giorno_del_mese_raw = String(formData.get("giorno_del_mese") ?? "");
  const giorno_del_mese = Number(giorno_del_mese_raw);
  const data_inizio = String(formData.get("data_inizio") ?? "");

  if (!nome || !conto_id || !categoria_id || !data_inizio) {
    return { error: "Compila tutti i campi obbligatori" };
  }
  if (!importoRaw || Number.isNaN(importo) || importo <= 0) {
    return { error: "Inserisci un importo valido" };
  }
  if (
    !giorno_del_mese_raw ||
    !Number.isInteger(giorno_del_mese) ||
    giorno_del_mese < 1 ||
    giorno_del_mese > 31
  ) {
    return { error: "Il giorno del mese deve essere tra 1 e 31" };
  }

  const { error: insertError } = await supabase.from("ricorrenti").insert({
    user_id: userId,
    nome,
    conto_id,
    categoria_id,
    importo,
    frequenza: "mensile",
    giorno_del_mese,
    data_inizio,
    attivo: true,
  });
  if (insertError) {
    logServerError("createRicorrenza", insertError);
    return { error: "Impossibile salvare la ricorrenza. Riprova." };
  }

  revalidatePath("/impostazioni/ricorrenze");
  return {};
}

export async function updateRicorrenza(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const conto_id = String(formData.get("conto_id") ?? "");
  const categoria_id = String(formData.get("categoria_id") ?? "");
  const importoRaw = String(formData.get("importo") ?? "");
  const importo = Number(importoRaw);
  const giorno_del_mese_raw = String(formData.get("giorno_del_mese") ?? "");
  const giorno_del_mese = Number(giorno_del_mese_raw);
  const data_inizio = String(formData.get("data_inizio") ?? "");

  if (!id || !nome || !conto_id || !categoria_id || !data_inizio) {
    return { error: "Compila tutti i campi obbligatori" };
  }
  if (!importoRaw || Number.isNaN(importo) || importo <= 0) {
    return { error: "Inserisci un importo valido" };
  }
  if (
    !giorno_del_mese_raw ||
    !Number.isInteger(giorno_del_mese) ||
    giorno_del_mese < 1 ||
    giorno_del_mese > 31
  ) {
    return { error: "Il giorno del mese deve essere tra 1 e 31" };
  }

  const { error: updateError } = await supabase
    .from("ricorrenti")
    .update({
      nome,
      conto_id,
      categoria_id,
      importo,
      giorno_del_mese,
      data_inizio,
    })
    .eq("id", id);
  if (updateError) {
    logServerError("updateRicorrenza", updateError);
    return { error: "Impossibile aggiornare la ricorrenza. Riprova." };
  }

  revalidatePath("/impostazioni/ricorrenze");
  return {};
}

export async function toggleRicorrenzaAttiva(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  const attivo = String(formData.get("attivo") ?? "") === "true";
  if (!id) {
    return { error: "Ricorrenza non specificata" };
  }

  const { error: updateError } = await supabase
    .from("ricorrenti")
    .update({ attivo })
    .eq("id", id);
  if (updateError) {
    logServerError("toggleRicorrenzaAttiva", updateError);
    return { error: "Impossibile aggiornare la ricorrenza. Riprova." };
  }

  revalidatePath("/impostazioni/ricorrenze");
  return {};
}
