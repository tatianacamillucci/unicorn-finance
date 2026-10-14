"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function addExpense(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  const userId = userData.user.id;

  const importo = Number(formData.get("importo"));
  const categoria_id = String(formData.get("categoria_id"));
  const conto_id = String(formData.get("conto_id"));
  const luogo = String(formData.get("luogo") ?? "");
  const data = String(formData.get("data"));

  if (!importo || !categoria_id || !conto_id || !data) {
    return { error: "Compila tutti i campi obbligatori" };
  }

  const { error: insertError } = await supabase.from("movimenti").insert({
    user_id: userId,
    importo,
    categoria_id,
    conto_id,
    luogo,
    data,
    stato: "effettuato",
  });
  if (insertError) {
    logServerError("addExpense/insert-movimento", insertError);
    return { error: "Impossibile registrare la spesa. Riprova." };
  }

  revalidatePath("/personale");
  return {};
}
