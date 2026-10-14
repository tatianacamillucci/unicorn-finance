// Helper puri di formattazione e validazione (usabili sia server che client).
import { z } from "zod";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
export const formatEuro = (n: number) => euro.format(n);

export function formatData(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export const STATI_PREVENTIVO = ["bozza", "inviato", "accettato", "rifiutato"] as const;
export const ETICHETTE_PREVENTIVO: Record<(typeof STATI_PREVENTIVO)[number], string> = {
  bozza: "Bozza",
  inviato: "Inviato",
  accettato: "Accettato",
  rifiutato: "Rifiutato",
};

export const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

// ---- zod ----
export const uuid = z.string().uuid("Dato non valido");

export const importoSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(",", "."))
  .refine((s) => /^\d{1,10}(\.\d{1,2})?$/.test(s), "Importo non valido (es. 150 o 150,50)")
  .transform((s) => Number(s));

export const dataSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Data non valida");

export const testoOpz = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Testo troppo lungo")
    .transform((s) => (s === "" ? null : s));

export const descrizioneSchema = z
  .string()
  .trim()
  .min(1, "Scrivi una descrizione")
  .max(300, "Descrizione troppo lunga");

export function primoErrore(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Dati non validi";
}

export type EsitoAzione = { error?: string };

// ---- Righe documento, scadenze e stati (usati da clienti, preventivi, fatture) ----
import type { Riga } from "@/lib/types/gestionale";

export type EsitoConId = EsitoAzione & { id?: string };

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function totaleRighe(righe: Riga[]): number {
  return r2(righe.reduce((t, r) => t + r.quantita * r.prezzo, 0));
}

const rigaSchema = z.object({
  descrizione: z.string().trim().min(1, "Scrivi la descrizione di ogni riga").max(200, "Descrizione troppo lunga"),
  quantita: z.number().positive("La quantità deve essere maggiore di zero").max(100000, "Quantità troppo alta"),
  prezzo: z.number().min(0, "Il prezzo non può essere negativo").max(10000000, "Prezzo troppo alto"),
});

/** Legge le righe inviate dal form (JSON) e le valida. Ritorna le righe pulite o un errore in italiano. */
export function leggiRighe(raw: string): { righe?: Riga[]; error?: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Righe non valide" };
  }
  const parsed = z.array(rigaSchema).min(1, "Aggiungi almeno una riga").max(30, "Troppe righe").safeParse(json);
  if (!parsed.success) return { error: primoErrore(parsed.error) };
  const righe = parsed.data.map((r) => ({
    descrizione: r.descrizione,
    quantita: r2(r.quantita),
    prezzo: r2(r.prezzo),
  }));
  if (totaleRighe(righe) <= 0) return { error: "Il totale deve essere maggiore di zero" };
  return { righe };
}

/** Descrizione breve del documento = descrizioni delle righe unite (colonna `descrizione`, max 300). */
export function descrizioneDaRighe(righe: Riga[]): string {
  return righe.map((r) => r.descrizione).join("; ").slice(0, 300);
}

/** Righe da mostrare: quelle salvate oppure una riga sola ricavata da descrizione e importo. */
export function righeDi(doc: { righe?: Riga[] | null; descrizione: string; importo: number }): Riga[] {
  if (Array.isArray(doc.righe) && doc.righe.length > 0) return doc.righe;
  return [{ descrizione: doc.descrizione, quantita: 1, prezzo: doc.importo }];
}

export function aggiungiGiorni(iso: string, giorni: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + giorni));
  return dt.toISOString().slice(0, 10);
}

/** Scadenza del pagamento: quella salvata, altrimenti 30 giorni dall'emissione. */
export function scadenzaFattura(f: {
  data_emissione: string | null;
  scadenza_pagamento?: string | null;
  stato: string;
}): string | null {
  if (f.scadenza_pagamento) return f.scadenza_pagamento;
  if (f.data_emissione && f.stato !== "da_emettere") return aggiungiGiorni(f.data_emissione, 30);
  return null;
}

/** Stato mostrato: "scaduta" se emessa e la scadenza è passata. */
export function statoFatturaMostrato(
  f: { data_emissione: string | null; scadenza_pagamento?: string | null; stato: string },
  oggi: string,
): string {
  if (f.stato !== "emessa") return f.stato;
  const s = scadenzaFattura(f);
  return s && s < oggi ? "scaduta" : "emessa";
}

export function oggiIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
