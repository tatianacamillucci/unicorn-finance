"use server";

import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { calcolaAccantonamento } from "@/lib/fiscale";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import { trovaContoTasse } from "@/lib/incassi-data";

const idSchema = z.string().uuid();

const nuovoIncassoSchema = z.object({
  cliente_id: z.string().uuid(),
  importo: z.coerce.number().positive().max(10_000_000),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function revalida() {
  revalidatePath("/incassi");
  revalidatePath("/tasse");
  revalidatePath("/");
}

export async function segnaIncassoSpostato(incassoId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = idSchema.safeParse(incassoId);
  if (!parsed.success) return { error: "Incasso non valido." };

  // Il filtro su user_id garantisce che l'incasso sia dell'utente.
  const { data, error } = await supabase
    .from("incassi")
    .update({ spostato: true })
    .eq("id", parsed.data)
    .eq("user_id", userData.user.id)
    .select("id");
  if (error) {
    logServerError("segnaIncassoSpostato", error);
    return { error: "Non sono riuscito a salvare. Riprova." };
  }
  if (!data || data.length === 0) return { error: "Incasso non trovato." };

  revalida();
  return {};
}

export async function registraIncassoSenzaFattura(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const parsed = nuovoIncassoSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    importo: String(formData.get("importo") ?? "").replace(",", "."),
    data: formData.get("data"),
  });
  if (!parsed.success) return { error: "Controlla cliente, importo e data." };
  const { cliente_id, importo, data } = parsed.data;
  if (Number.isNaN(new Date(data).getTime())) return { error: "La data non è valida." };

  try {
    const { data: cliente, error: cErr } = await supabase
      .from("clienti")
      .select("id")
      .eq("id", cliente_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!cliente) return { error: "Cliente non trovato." };

    const profilo = await getProfiloFiscale();
    const acc = calcolaAccantonamento(importo, profilo);
    const conto = await trovaContoTasse(userId, profilo.contoTasseId);

    const { error } = await supabase.from("incassi").insert({
      user_id: userId,
      cliente_id,
      data,
      importo,
      accantonamento_imposta: acc.imposta,
      accantonamento_inps: acc.inps,
      conto_destinazione_id: conto?.id ?? null,
      spostato: false,
    });
    if (error) throw error;
  } catch (e) {
    logServerError("registraIncassoSenzaFattura", e);
    return { error: "Non sono riuscito a salvare. Riprova." };
  }

  revalida();
  return {};
}
