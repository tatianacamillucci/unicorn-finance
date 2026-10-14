import { createClient } from "@/lib/supabase/server";

export async function shouldShowMonthlyPopup(month: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { data, error } = await supabase
    .from("stato_utente")
    .select("ultimo_mese_popup_entrate")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;

  return data?.ultimo_mese_popup_entrate !== month;
}
