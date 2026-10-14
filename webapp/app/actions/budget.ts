"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function upsertBudget(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  const userId = userData.user.id;

  const categoria_id = String(formData.get("categoria_id") ?? "");
  const importoRaw = String(formData.get("importo") ?? "");
  const importo = Number(importoRaw);

  if (!categoria_id) {
    return { error: "Categoria non specificata" };
  }
  if (!importoRaw || Number.isNaN(importo) || importo <= 0) {
    return { error: "Inserisci un importo valido" };
  }

  const { error: upsertError } = await supabase
    .from("budget_categorie")
    .upsert(
      { user_id: userId, categoria_id, importo },
      { onConflict: "user_id,categoria_id" }
    );
  if (upsertError) {
    logServerError("upsertBudget", upsertError);
    return { error: "Impossibile salvare il budget. Riprova." };
  }

  revalidatePath("/impostazioni/budget");
  return {};
}

export async function deleteBudget(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const categoria_id = String(formData.get("categoria_id") ?? "");
  if (!categoria_id) {
    return { error: "Categoria non specificata" };
  }

  const { error: deleteError } = await supabase
    .from("budget_categorie")
    .delete()
    .eq("categoria_id", categoria_id);
  if (deleteError) {
    logServerError("deleteBudget", deleteError);
    return { error: "Impossibile rimuovere il budget. Riprova." };
  }

  revalidatePath("/impostazioni/budget");
  return {};
}
