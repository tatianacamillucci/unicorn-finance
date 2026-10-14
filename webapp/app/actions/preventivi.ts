"use server";

import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { bolloDovuto } from "@/lib/fiscale";
import {
  STATI_PREVENTIVO,
  dataSchema,
  descrizioneDaRighe,
  leggiRighe,
  primoErrore,
  testoOpz,
  totaleRighe,
  uuid,
  type EsitoAzione,
  type EsitoConId,
} from "@/components/clienti/format";

const nuovoSchema = z.object({
  cliente_id: uuid,
  data: dataSchema,
  numero: testoOpz(40),
  validita: z.union([dataSchema, z.literal("")]),
});

/** true se l'errore indica una colonna mancante (migrazione 0008 non ancora applicata). */
function colonnaMancante(e: { code?: string; message?: string }): boolean {
  return e.code === "42703" || e.code === "PGRST204" || /righe|validita|column/i.test(e.message ?? "");
}

export async function creaPreventivo(fd: FormData): Promise<EsitoConId> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const parsed = nuovoSchema.safeParse({
    cliente_id: String(fd.get("cliente_id") ?? ""),
    data: String(fd.get("data") ?? ""),
    numero: String(fd.get("numero") ?? ""),
    validita: String(fd.get("validita") ?? "").trim(),
  });
  if (!parsed.success) return { error: primoErrore(parsed.error) };
  const lette = leggiRighe(String(fd.get("righe") ?? ""));
  const righeOk = lette.righe;
  if (!righeOk) return { error: lette.error ?? "Righe non valide" };

  const { data: cliente, error: errC } = await supabase
    .from("clienti")
    .select("id")
    .eq("id", parsed.data.cliente_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (errC) {
    logServerError("creaPreventivo/cliente", errC);
    return { error: "Impossibile salvare il preventivo. Riprova." };
  }
  if (!cliente) return { error: "Cliente non trovato" };

  const base = {
    user_id: userId,
    cliente_id: parsed.data.cliente_id,
    data: parsed.data.data,
    numero: parsed.data.numero,
    descrizione: descrizioneDaRighe(righeOk),
    importo: totaleRighe(righeOk),
    stato: "bozza",
  };
  let res = await supabase
    .from("preventivi")
    .insert({ ...base, righe: righeOk, validita: parsed.data.validita || null })
    .select("id")
    .single();
  if (res.error && colonnaMancante(res.error)) {
    res = await supabase.from("preventivi").insert(base).select("id").single();
  }
  if (res.error) {
    logServerError("creaPreventivo", res.error);
    return { error: "Impossibile salvare il preventivo. Riprova." };
  }
  revalidatePath("/preventivi");
  revalidatePath(`/clienti/${parsed.data.cliente_id}`);
  return { id: res.data.id as string };
}

export async function cambiaStatoPreventivo(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  const stato = z.enum(STATI_PREVENTIVO).safeParse(String(fd.get("stato") ?? ""));
  if (!id.success || !stato.success) return { error: "Dati non validi" };

  const { data, error } = await supabase
    .from("preventivi")
    .update({ stato: stato.data })
    .eq("id", id.data)
    .eq("user_id", userData.user.id)
    .select("id, cliente_id");
  if (error) {
    logServerError("cambiaStatoPreventivo", error);
    return { error: "Impossibile cambiare lo stato. Riprova." };
  }
  if (!data?.length) return { error: "Preventivo non trovato" };
  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${id.data}`);
  revalidatePath(`/clienti/${data[0].cliente_id}`);
  return {};
}

export async function creaFatturaDaPreventivo(fd: FormData): Promise<EsitoConId> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Preventivo non valido" };

  const { data: prev, error: errP } = await supabase
    .from("preventivi")
    .select("*")
    .eq("id", id.data)
    .eq("user_id", userId)
    .maybeSingle();
  if (errP) {
    logServerError("creaFatturaDaPreventivo/preventivo", errP);
    return { error: "Impossibile creare la fattura. Riprova." };
  }
  if (!prev) return { error: "Preventivo non trovato" };
  if (prev.stato !== "accettato") return { error: "Il preventivo non è ancora accettato" };

  const { data: esistente, error: errE } = await supabase
    .from("fatture")
    .select("id")
    .eq("preventivo_id", prev.id)
    .eq("user_id", userId)
    .limit(1);
  if (errE) {
    logServerError("creaFatturaDaPreventivo/esistente", errE);
    return { error: "Impossibile creare la fattura. Riprova." };
  }
  if (esistente?.length) return { error: "Hai già creato la fattura per questo preventivo" };

  const importo = Number(prev.importo);
  const base = {
    user_id: userId,
    cliente_id: prev.cliente_id,
    preventivo_id: prev.id,
    descrizione: prev.descrizione,
    importo,
    bollo: bolloDovuto(importo),
    stato: "da_emettere",
  };
  const righe = Array.isArray(prev.righe) && prev.righe.length > 0 ? prev.righe : null;
  const dati: Record<string, unknown> = righe ? { ...base, righe } : base;
  let res = await supabase
    .from("fatture")
    .insert(dati)
    .select("id")
    .single();
  if (res.error && righe && colonnaMancante(res.error)) {
    res = await supabase.from("fatture").insert(base).select("id").single();
  }
  if (res.error) {
    logServerError("creaFatturaDaPreventivo", res.error);
    return { error: "Impossibile creare la fattura. Riprova." };
  }
  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${prev.id}`);
  revalidatePath("/fatture");
  revalidatePath(`/clienti/${prev.cliente_id}`);
  return { id: res.data.id as string };
}
