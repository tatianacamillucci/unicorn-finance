import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoProfiloFiscale } from "@/lib/demo";
import { PROFILO_DEFAULT } from "@/lib/fiscale";
import type { ProfiloFiscale } from "@/lib/types/gestionale";

export const PROFILO_FISCALE_DEFAULT: ProfiloFiscale = {
  ateco: null,
  ...PROFILO_DEFAULT,
  dataApertura: null,
  commercialistaNome: null,
  commercialistaTelefono: null,
  commercialistaEmail: null,
  contoTasseId: null,
};

/**
 * Profilo fiscale dell'utente corrente. Ritorna i default se la riga non esiste,
 * se non c'e' utente, o se la tabella non esiste ancora (migrazione 0006 non applicata).
 */
export async function getProfiloFiscale(): Promise<ProfiloFiscale> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return PROFILO_FISCALE_DEFAULT;
    if (await isDemo()) return demoProfiloFiscale();

    const { data, error } = await supabase
      .from("profilo_fiscale")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (error) {
      logServerError("getProfiloFiscale", error);
      return PROFILO_FISCALE_DEFAULT;
    }
    if (!data) return PROFILO_FISCALE_DEFAULT;

    return {
      ateco: data.ateco ?? null,
      coefficiente: Number(data.coefficiente),
      aliquotaImposta: Number(data.aliquota_imposta),
      aliquotaInps: Number(data.aliquota_inps),
      dataApertura: data.data_apertura ?? null,
      commercialistaNome: data.commercialista_nome ?? null,
      commercialistaTelefono: data.commercialista_telefono ?? null,
      commercialistaEmail: data.commercialista_email ?? null,
      contoTasseId: data.conto_tasse_id ?? null,
    };
  } catch (e) {
    logServerError("getProfiloFiscale", e);
    return PROFILO_FISCALE_DEFAULT;
  }
}
