"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

const RUOLI = ["personale", "attivita", "tasse"] as const;
type Ruolo = (typeof RUOLI)[number];

function parseRuolo(raw: FormDataEntryValue | null): Ruolo {
  const v = String(raw ?? "personale");
  return (RUOLI as readonly string[]).includes(v) ? (v as Ruolo) : "personale";
}

export async function createConto(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  const userId = userData.user.id;

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const saldo_iniziale = Number(formData.get("saldo_iniziale") ?? 0);
  const colore_hex = String(formData.get("colore_hex") ?? "#51BBFE");
  const icona_emoji = String(formData.get("icona_emoji") ?? "💳");
  const ruolo = parseRuolo(formData.get("ruolo"));

  if (!nome || !tipo) {
    return { error: "Compila tutti i campi obbligatori" };
  }

  const { error: insertError } = await supabase.from("conti").insert({
    user_id: userId,
    nome,
    tipo,
    saldo_iniziale,
    data_saldo_iniziale: new Date().toISOString().slice(0, 10),
    colore_hex,
    icona_emoji,
    // Se la migrazione non e' applicata la colonna non esiste: non la mandiamo per il default.
    ...(ruolo !== "personale" ? { ruolo } : {}),
  });
  if (insertError) {
    logServerError("createConto", insertError);
    return { error: "Impossibile salvare il conto. Riprova." };
  }

  revalidatePath("/impostazioni/conti");
  return {};
}

export async function updateConto(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const saldo_iniziale = Number(formData.get("saldo_iniziale") ?? 0);
  const colore_hex = String(formData.get("colore_hex") ?? "#51BBFE");
  const icona_emoji = String(formData.get("icona_emoji") ?? "💳");
  const ruolo = parseRuolo(formData.get("ruolo"));

  if (!id || !nome || !tipo) {
    return { error: "Compila tutti i campi obbligatori" };
  }

  const { error: updateError } = await supabase
    .from("conti")
    .update({
      nome,
      tipo,
      saldo_iniziale,
      colore_hex,
      icona_emoji,
      ruolo,
    })
    .eq("id", id)
    .eq("user_id", userData.user.id);
  if (updateError) {
    logServerError("updateConto", updateError);
    return { error: "Impossibile aggiornare il conto. Riprova." };
  }

  revalidatePath("/impostazioni/conti");
  return {};
}

export async function deleteConto(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Conto non specificato" };
  }

  const { error: deleteError } = await supabase.from("conti").delete().eq("id", id);
  if (deleteError) {
    logServerError("deleteConto", deleteError);
    return { error: "Impossibile eliminare il conto. Riprova." };
  }

  revalidatePath("/impostazioni/conti");
  return {};
}
