"use server";

import { isDemo, MESSAGGIO_DEMO } from "@/lib/demo/mode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { bolloDovuto, calcolaAccantonamento } from "@/lib/fiscale";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import {
  dataSchema,
  descrizioneDaRighe,
  importoSchema,
  leggiRighe,
  primoErrore,
  totaleRighe,
  uuid,
  type EsitoAzione,
  type EsitoConId,
} from "@/components/clienti/format";

/** true se l'errore indica una colonna mancante (migrazione 0008 non ancora applicata). */
function colonnaMancante(e: { code?: string; message?: string }): boolean {
  return e.code === "42703" || e.code === "PGRST204" || /righe|scadenza_pagamento|column/i.test(e.message ?? "");
}

export async function creaFattura(fd: FormData): Promise<EsitoConId> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const cliente_id = uuid.safeParse(String(fd.get("cliente_id") ?? ""));
  if (!cliente_id.success) return { error: "Scegli un cliente" };
  const lette = leggiRighe(String(fd.get("righe") ?? ""));
  const righeOk = lette.righe;
  if (!righeOk) return { error: lette.error ?? "Righe non valide" };
  const scadRaw = String(fd.get("scadenza") ?? "").trim();
  const scadenza = scadRaw ? dataSchema.safeParse(scadRaw) : null;
  if (scadenza && !scadenza.success) return { error: "Scadenza non valida" };

  const { data: cliente, error: errC } = await supabase
    .from("clienti")
    .select("id")
    .eq("id", cliente_id.data)
    .eq("user_id", userId)
    .maybeSingle();
  if (errC) {
    logServerError("creaFattura/cliente", errC);
    return { error: "Impossibile salvare la fattura. Riprova." };
  }
  if (!cliente) return { error: "Cliente non trovato" };

  // Importo e bollo si ricalcolano qui: i valori del browser non contano.
  const importo = totaleRighe(righeOk);
  const base = {
    user_id: userId,
    cliente_id: cliente_id.data,
    descrizione: descrizioneDaRighe(righeOk),
    importo,
    bollo: bolloDovuto(importo),
    stato: "da_emettere",
  };
  let res = await supabase
    .from("fatture")
    .insert({ ...base, righe: righeOk, scadenza_pagamento: scadenza?.data ?? null })
    .select("id")
    .single();
  if (res.error && colonnaMancante(res.error)) {
    // La migrazione 0008 potrebbe mancare: salvo senza righe (la descrizione le contiene già).
    res = await supabase.from("fatture").insert(base).select("id").single();
  }
  if (res.error) {
    logServerError("creaFattura", res.error);
    return { error: "Impossibile salvare la fattura. Riprova." };
  }
  revalidatePath("/fatture");
  revalidatePath(`/clienti/${cliente_id.data}`);
  return { id: res.data.id as string };
}

export async function duplicaFattura(fd: FormData): Promise<EsitoConId> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const id = uuid.safeParse(String(fd.get("id") ?? ""));
  if (!id.success) return { error: "Fattura non valida" };

  const { data: orig, error: errO } = await supabase
    .from("fatture")
    .select("*")
    .eq("id", id.data)
    .eq("user_id", userId)
    .maybeSingle();
  if (errO) {
    logServerError("duplicaFattura/originale", errO);
    return { error: "Impossibile duplicare la fattura. Riprova." };
  }
  if (!orig) return { error: "Fattura non trovata" };

  const importo = Number(orig.importo);
  const base = {
    user_id: userId,
    cliente_id: orig.cliente_id,
    descrizione: orig.descrizione,
    importo,
    bollo: bolloDovuto(importo),
    stato: "da_emettere",
  };
  const righe = Array.isArray(orig.righe) && orig.righe.length > 0 ? orig.righe : null;
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
    logServerError("duplicaFattura", res.error);
    return { error: "Impossibile duplicare la fattura. Riprova." };
  }
  revalidatePath("/fatture");
  revalidatePath(`/clienti/${orig.cliente_id}`);
  return { id: res.data.id as string };
}

export async function segnaEmessa(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };

  const parsed = z
    .object({
      id: uuid,
      numero: z
        .string()
        .trim()
        .min(1, "Scrivi il numero della fattura")
        .max(40, "Numero troppo lungo"),
      data: dataSchema,
      scadenza: z.union([dataSchema, z.literal("")]),
    })
    .safeParse({
      id: String(fd.get("id") ?? ""),
      numero: String(fd.get("numero") ?? ""),
      data: String(fd.get("data") ?? ""),
      scadenza: String(fd.get("scadenza") ?? "").trim(),
    });
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const aggiorna = (campi: Record<string, unknown>) =>
    supabase
      .from("fatture")
      .update(campi)
      .eq("id", parsed.data.id)
      .eq("user_id", userData.user.id)
      .eq("stato", "da_emettere")
      .select("id, cliente_id");
  const campiBase = { stato: "emessa", numero: parsed.data.numero, data_emissione: parsed.data.data };
  let { data, error } = parsed.data.scadenza
    ? await aggiorna({ ...campiBase, scadenza_pagamento: parsed.data.scadenza })
    : await aggiorna(campiBase);
  if (error && parsed.data.scadenza && colonnaMancante(error)) {
    ({ data, error } = await aggiorna(campiBase));
  }
  if (error) {
    logServerError("segnaEmessa", error);
    return { error: "Impossibile aggiornare la fattura. Riprova." };
  }
  if (!data?.length) return { error: "Fattura non trovata o già emessa" };
  revalidatePath("/fatture");
  revalidatePath(`/fatture/${parsed.data.id}`);
  revalidatePath(`/clienti/${data[0].cliente_id}`);
  return {};
}

export async function segnaIncassata(fd: FormData): Promise<EsitoAzione> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };
  if (await isDemo()) return { error: MESSAGGIO_DEMO };
  const userId = userData.user.id;

  const parsed = z
    .object({ id: uuid, data: dataSchema, importo: importoSchema })
    .safeParse({
      id: String(fd.get("id") ?? ""),
      data: String(fd.get("data") ?? ""),
      importo: String(fd.get("importo") ?? ""),
    });
  if (!parsed.success) return { error: primoErrore(parsed.error) };

  const profilo = await getProfiloFiscale();
  const acc = calcolaAccantonamento(parsed.data.importo, profilo);

  // 1) segna la fattura (solo se è emessa e dell'utente): evita doppi incassi
  const { data: fatt, error: errF } = await supabase
    .from("fatture")
    .update({ stato: "incassata" })
    .eq("id", parsed.data.id)
    .eq("user_id", userId)
    .eq("stato", "emessa")
    .select("id, cliente_id");
  if (errF) {
    logServerError("segnaIncassata/fattura", errF);
    return { error: "Impossibile segnare l'incasso. Riprova." };
  }
  if (!fatt?.length) return { error: "Fattura non trovata o non ancora emessa" };

  // 2) crea l'incasso
  const { error: errI } = await supabase.from("incassi").insert({
    user_id: userId,
    fattura_id: fatt[0].id,
    cliente_id: fatt[0].cliente_id,
    data: parsed.data.data,
    importo: parsed.data.importo,
    accantonamento_imposta: acc.imposta,
    accantonamento_inps: acc.inps,
    conto_destinazione_id: profilo.contoTasseId,
    spostato: false,
  });
  if (errI) {
    logServerError("segnaIncassata/incasso", errI);
    const { error: errR } = await supabase
      .from("fatture")
      .update({ stato: "emessa" })
      .eq("id", fatt[0].id)
      .eq("user_id", userId);
    if (errR) logServerError("segnaIncassata/rollback", errR);
    return { error: "Impossibile segnare l'incasso. Riprova." };
  }

  revalidatePath("/fatture");
  revalidatePath(`/fatture/${parsed.data.id}`);
  revalidatePath("/incassi");
  revalidatePath("/");
  revalidatePath(`/clienti/${fatt[0].cliente_id}`);
  return {};
}
