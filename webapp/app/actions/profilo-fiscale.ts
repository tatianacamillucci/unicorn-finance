"use server";

import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

const percentuale = z.coerce.number().min(0).max(100);

const fiscaleSchema = z.object({
  ateco: z.string().trim().max(20),
  coefficiente: percentuale,
  aliquotaImposta: percentuale,
  aliquotaInps: percentuale,
  dataApertura: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  contoTasseId: z.string().uuid().or(z.literal("")),
  ragioneSociale: z.string().trim().max(160),
  indirizzo: z.string().trim().max(240),
  piva: z.string().trim().max(32),
  iban: z.string().trim().max(40),
});

/** Arrotonda a 4 decimali (colonne numeric(5,4)). */
function toFraction(pct: number): number {
  return Math.round((pct / 100) * 10000) / 10000;
}

export async function saveProfiloFiscale(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const parsed = fiscaleSchema.safeParse({
    ateco: String(formData.get("ateco") ?? ""),
    coefficiente: String(formData.get("coefficiente") ?? "").replace(",", "."),
    aliquotaImposta: String(formData.get("aliquota_imposta") ?? "").replace(",", "."),
    aliquotaInps: String(formData.get("aliquota_inps") ?? "").replace(",", "."),
    dataApertura: String(formData.get("data_apertura") ?? ""),
    contoTasseId: String(formData.get("conto_tasse_id") ?? ""),
    ragioneSociale: String(formData.get("ragione_sociale") ?? ""),
    indirizzo: String(formData.get("indirizzo") ?? ""),
    piva: String(formData.get("piva") ?? ""),
    iban: String(formData.get("iban") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Controlla i valori inseriti: le percentuali devono essere tra 0 e 100." };
  }
  const v = parsed.data;

  if (v.dataApertura && Number.isNaN(Date.parse(v.dataApertura))) {
    return { error: "La data di apertura non è valida." };
  }

  try {
    // Il conto per le tasse deve essere dell'utente.
    if (v.contoTasseId) {
      const { data: conto, error: contoError } = await supabase
        .from("conti")
        .select("id")
        .eq("id", v.contoTasseId)
        .eq("user_id", userId)
        .maybeSingle();
      if (contoError) {
        logServerError("saveProfiloFiscale.conto", contoError);
        return { error: "Impossibile salvare il profilo. Riprova." };
      }
      if (!conto) {
        return { error: "Il conto scelto non è valido." };
      }
    }

    const { error } = await supabase.from("profilo_fiscale").upsert(
      {
        user_id: userId,
        ateco: v.ateco || null,
        coefficiente: toFraction(v.coefficiente),
        aliquota_imposta: toFraction(v.aliquotaImposta),
        aliquota_inps: toFraction(v.aliquotaInps),
        data_apertura: v.dataApertura || null,
        conto_tasse_id: v.contoTasseId || null,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      logServerError("saveProfiloFiscale", error);
      return { error: "Impossibile salvare il profilo. Riprova." };
    }

    // Intestazione documenti (colonne della migrazione 0008): solo se il form le invia.
    // Salvate a parte, cosi' il profilo fiscale si salva anche se la 0008 non e' applicata.
    if (formData.has("ragione_sociale")) {
      const { error: intError } = await supabase.from("profilo_fiscale").upsert(
        {
          user_id: userId,
          ragione_sociale: v.ragioneSociale || null,
          indirizzo: v.indirizzo || null,
          piva: v.piva || null,
          iban: v.iban ? v.iban.replace(/\s+/g, "").toUpperCase() : null,
        },
        { onConflict: "user_id" },
      );
      if (intError) {
        logServerError("saveProfiloFiscale.intestazione", intError);
        return { error: "Profilo salvato, ma non i dati dei documenti: il database non è ancora aggiornato." };
      }
    }
  } catch (e) {
    logServerError("saveProfiloFiscale", e);
    return { error: "Impossibile salvare il profilo. Riprova." };
  }

  revalidatePath("/impostazioni/fiscale");
  revalidatePath("/impostazioni");
  return {};
}

const commercialistaSchema = z.object({
  nome: z.string().trim().max(100),
  telefono: z.string().trim().max(30).regex(/^[0-9+\s().-]*$/),
  email: z.string().trim().max(200).email().or(z.literal("")),
});

export async function saveCommercialista(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = commercialistaSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Controlla i dati: telefono o email non sembrano validi." };
  }
  const v = parsed.data;

  try {
    const { error } = await supabase.from("profilo_fiscale").upsert(
      {
        user_id: userData.user.id,
        commercialista_nome: v.nome || null,
        commercialista_telefono: v.telefono || null,
        commercialista_email: v.email || null,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      logServerError("saveCommercialista", error);
      return { error: "Impossibile salvare i contatti. Riprova." };
    }
  } catch (e) {
    logServerError("saveCommercialista", e);
    return { error: "Impossibile salvare i contatti. Riprova." };
  }

  revalidatePath("/commercialista");
  return {};
}
