import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoServizi } from "@/lib/demo";
import type { Servizio } from "@/lib/types/gestionale";

/** Listino servizi. `pronto=false` se la tabella `servizi` (migrazione 0008) non esiste ancora. */
export async function getServizi(): Promise<{ pronto: boolean; servizi: Servizio[] }> {
  try {
    if (await isDemo()) return demoServizi();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { pronto: true, servizi: [] };

    const { data, error } = await supabase
      .from("servizi")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("nome");
    if (error) {
      logServerError("getServizi", error);
      return { pronto: false, servizi: [] };
    }
    return {
      pronto: true,
      servizi: (data ?? []).map((s) => ({ ...(s as Servizio), prezzo: Number(s.prezzo) })),
    };
  } catch (e) {
    logServerError("getServizi", e);
    return { pronto: false, servizi: [] };
  }
}
