import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

export const DEMO_COOKIE = "demo";

let giaLoggato = false;

/** true se le tabelle della migrazione 0006 esistono (query leggera su `clienti`). Una sola query per richiesta. */
export const dbPronto = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clienti").select("id", { head: true, count: "exact" }).limit(1);
    if (error) {
      if (!giaLoggato) {
        giaLoggato = true;
        logServerError("demo/dbPronto (tabelle mancanti: uso i dati di esempio)", error);
      }
      return false;
    }
    return true;
  } catch (e) {
    if (!giaLoggato) {
      giaLoggato = true;
      logServerError("demo/dbPronto", e);
    }
    return false;
  }
});

/** true se il cookie `demo=1` è presente. Va chiamata dentro un <Suspense> (usa cookies()). */
export const cookieDemoAttivo = cache(async (): Promise<boolean> => {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === "1";
});

/**
 * true se i dati vanno letti dal dataset di esempio: cookie `demo=1`
 * OPPURE tabelle 0006 non ancora presenti. Usa cookies(): chiamala solo dentro <Suspense>.
 */
export const isDemo = cache(async (): Promise<boolean> => {
  if (await cookieDemoAttivo()) return true;
  return !(await dbPronto());
});

export const MESSAGGIO_DEMO =
  "Questi sono dati di esempio: non si possono modificare. Disattiva la modalità esempio in Impostazioni.";
