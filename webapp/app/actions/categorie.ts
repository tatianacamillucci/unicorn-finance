"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function createCategoria(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  const userId = userData.user.id;

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const colore_hex = String(formData.get("colore_hex") ?? "#4ABA94");
  const emoji = String(formData.get("emoji") ?? "💰");

  if (!nome || !tipo) {
    return { error: "Compila tutti i campi obbligatori" };
  }

  const { error: insertError } = await supabase.from("categorie").insert({
    user_id: userId,
    nome,
    tipo,
    colore_hex,
    emoji,
  });
  if (insertError) {
    logServerError("createCategoria", insertError);
    return { error: "Impossibile salvare la categoria. Riprova." };
  }

  revalidatePath("/impostazioni/categorie");
  return {};
}

export async function updateCategoria(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const colore_hex = String(formData.get("colore_hex") ?? "#4ABA94");
  const emoji = String(formData.get("emoji") ?? "💰");

  if (!id || !nome || !tipo) {
    return { error: "Compila tutti i campi obbligatori" };
  }

  const { error: updateError } = await supabase
    .from("categorie")
    .update({
      nome,
      tipo,
      colore_hex,
      emoji,
    })
    .eq("id", id);
  if (updateError) {
    logServerError("updateCategoria", updateError);
    return { error: "Impossibile aggiornare la categoria. Riprova." };
  }

  revalidatePath("/impostazioni/categorie");
  return {};
}

export async function deleteCategoria(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Categoria non specificata" };
  }

  const { error: deleteError } = await supabase.from("categorie").delete().eq("id", id);
  if (deleteError) {
    logServerError("deleteCategoria", deleteError);
    return { error: "Impossibile eliminare la categoria. Riprova." };
  }

  revalidatePath("/impostazioni/categorie");
  return {};
}
