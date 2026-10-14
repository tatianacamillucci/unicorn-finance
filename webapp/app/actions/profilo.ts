"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export async function updateProfilo(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { error: "Non autenticato" };
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  const obiettivoRaw = String(formData.get("obiettivo_risparmio") ?? "").trim();

  let obiettivo_risparmio: number | null = null;
  if (obiettivoRaw) {
    const parsed = Number(obiettivoRaw);
    if (Number.isNaN(parsed) || parsed < 0) {
      return { error: "Inserisci un obiettivo di risparmio valido" };
    }
    obiettivo_risparmio = parsed;
  }

  const { error } = await supabase.from("stato_utente").upsert(
    {
      user_id: userData.user.id,
      nickname: nickname || null,
      obiettivo_risparmio,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logServerError("updateProfilo", error);
    return { error: "Impossibile salvare il profilo. Riprova." };
  }

  revalidatePath("/personale");
  revalidatePath("/impostazioni/profilo");
  return {};
}
