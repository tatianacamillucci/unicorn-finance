import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoSpese } from "@/lib/demo";
import type { Spesa } from "@/lib/types/gestionale";

/** Spese dell'utente. `pronto=false` se la tabella `spese` (migrazione 0008) non esiste ancora. */
export async function getSpese(): Promise<{ pronto: boolean; spese: Spesa[] }> {
  try {
    if (await isDemo()) return demoSpese();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, spese: [] };

    const { data, error } = await supabase
      .from("spese")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("data", { ascending: false });
    if (error) {
      logServerError("getSpese", error);
      return { pronto: false, spese: [] };
    }
    return {
      pronto: true,
      spese: (data ?? []).map((s) => ({ ...(s as Spesa), importo: Number(s.importo) })),
    };
  } catch (e) {
    logServerError("getSpese", e);
    return { pronto: false, spese: [] };
  }
}
