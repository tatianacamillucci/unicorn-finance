// Tipi per le tabelle della migrazione 0006_gestionale_piva.sql.
// Gli importi numeric(12,2) possono arrivare da Supabase come number o string: convertire con Number().

export type RuoloConto = "personale" | "attivita" | "tasse";

export type StatoPreventivo = "bozza" | "inviato" | "accettato" | "rifiutato";
export type StatoFattura = "da_emettere" | "emessa" | "incassata";

export type UnitaServizio = "una tantum" | "mese" | "ora" | "giorno";

/** Riga di un documento (fattura/preventivo), salvata in `righe jsonb` (migrazione 0008). */
export interface Riga {
  descrizione: string;
  quantita: number;
  prezzo: number; // prezzo unitario
}

export interface Servizio {
  id: string;
  user_id: string;
  nome: string;
  descrizione: string | null;
  prezzo: number;
  unita: UnitaServizio;
  attivo: boolean;
  created_at: string;
}

export interface Spesa {
  id: string;
  user_id: string;
  data: string;
  fornitore: string;
  descrizione: string | null;
  categoria: string | null;
  importo: number;
  pagata: boolean;
  created_at: string;
}

export interface ProfiloFiscale {
  ateco: string | null;
  coefficiente: number;
  aliquotaImposta: number;
  aliquotaInps: number;
  dataApertura: string | null; // YYYY-MM-DD
  commercialistaNome: string | null;
  commercialistaTelefono: string | null;
  commercialistaEmail: string | null;
  contoTasseId: string | null;
  // Intestazione documenti (migrazione 0008)
  ragioneSociale?: string | null;
  indirizzo?: string | null;
  piva?: string | null;
  iban?: string | null;
}

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  piva_cf: string | null;
  email: string | null;
  telefono: string | null;
  note: string | null;
  created_at: string;
}

export interface Preventivo {
  id: string;
  user_id: string;
  cliente_id: string;
  numero: string | null;
  data: string;
  descrizione: string;
  importo: number;
  stato: StatoPreventivo;
  righe?: Riga[]; // migrazione 0008
  validita?: string | null; // migrazione 0008
  created_at: string;
}

export interface Fattura {
  id: string;
  user_id: string;
  cliente_id: string;
  preventivo_id: string | null;
  numero: string | null;
  data_emissione: string | null;
  descrizione: string;
  importo: number;
  bollo: number;
  stato: StatoFattura;
  righe?: Riga[]; // migrazione 0008
  scadenza_pagamento?: string | null; // migrazione 0008
  created_at: string;
}

export interface Incasso {
  id: string;
  user_id: string;
  fattura_id: string | null;
  cliente_id: string;
  data: string;
  importo: number;
  accantonamento_imposta: number;
  accantonamento_inps: number;
  conto_destinazione_id: string | null;
  spostato: boolean;
  created_at: string;
}
