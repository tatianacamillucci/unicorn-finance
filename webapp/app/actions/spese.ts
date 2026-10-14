"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import {
  dataSchema,
  importoSchema,
  primoErrore,
  testoOpz,
  uuid,
  type EsitoAzione,
} from "@/components/clienti/format";

const spesaSchema = z.object({
  data: dataSchema,
  fornitore: z.string().trim().min(1, "Scrivi il fornitore").max(120, "Nome troppo lungo"),
  descrizione: testoOpz(300),
  categoria: testoOpz(60),
  importo: importoSchema,
  pagata: z.boolean(),
});

export async function creaSpesa(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = spesaSchema.safeParse({
    data: String(fd.get("data") ?? ""),
    fornitore: String(fd.get("fornitore") ?? ""),
    descrizione: String(fd.get("descrizione") ?? ""),
    categoria: String(fd.get("categoria") ?? ""),
    importo: String(fd.get("importo") ?? ""),
    pagata: fd.get("pagata") === "on",
  });
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const { error } = await supabase.from("spese").insert({ ...parsed.data, user_id: userData.user.id });
  if (error) {
    logServerError("creaSpesa", error);
    return { error: "Impossibile salvare la spesa. Riprova." };
  }
  revalidatePath("/spese");
  return {};
}

export async function segnaSpesaPagata(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Spesa non valida" };

  const { data, error } = await supabase
    .from("spese")
    .update({ pagata: true })
    .eq("id", id.data)
    .eq("user_id", userData.user.id)
    .select("id");
  if (error) {
    logServerError("segnaSpesaPagata", error);
    return { error: "Impossibile aggiornare la spesa. Riprova." };
  }
  if (!data?.length) return { error: "Spesa non trovata" };
  revalidatePath("/spese");
  return {};
}
