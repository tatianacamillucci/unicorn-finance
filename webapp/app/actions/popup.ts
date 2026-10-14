"use server";

import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function markMonthlyPopupSeen(
  month: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const { error } = await supabase
    .from("stato_utente")
    .upsert(
      { user_id: userData.user.id, ultimo_mese_popup_entrate: month },
      { onConflict: "user_id" },
    );
  if (error) {
    logServerError("markMonthlyPopupSeen", error);
    return { error: "Impossibile salvare. Riprova." };
  }

  return {};
}
