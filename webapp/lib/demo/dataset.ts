// Dataset di esempio realistico e coerente per la "modalità esempio".
// Tutti i dati sono FITTIZI.
// Le date sono calcolate rispetto a oggi, nell'anno corrente: da gennaio a oggi + qualche fattura futura.
import { bolloDovuto, calcolaAccantonamento } from "@/lib/fiscale";
import { PROFILO_FISCALE_DEFAULT } from "@/lib/profilo-fiscale";
import type {
  Cliente,
  Fattura,
  Incasso,
  Preventivo,
  ProfiloFiscale,
  Riga,
  Servizio,
  Spesa,
  StatoFattura,
  StatoPreventivo,
} from "@/lib/types/gestionale";

export const DEMO_USER_ID = "demo-user";

export interface ContoDemo {
  id: string;
  nome: string;
  ruolo: "attivita" | "tasse" | "personale";
  saldo: number;
}

/** Intestazione dell'attività (finta) usata nei documenti di esempio. */
export const AZIENDA_DEMO = {
  ragioneSociale: "Studio Esempio di Mario Rossi",
  descrizione: "Consulenza informatica",
  indirizzo: "Via Esempio 1, 61032 Fano (PU)",
  piva: "in arrivo",
  iban: "IT00X0000000000000000000000",
  email: "info@studio-esempio.example",
};

export interface DemoDataset {
  oggi: string; // YYYY-MM-DD
  anno: number;
  azienda: typeof AZIENDA_DEMO;
  profilo: ProfiloFiscale;
  clienti: Cliente[];
  servizi: Servizio[];
  preventivi: Preventivo[];
  fatture: Fattura[];
  incassi: Incasso[];
  spese: Spesa[];
  conti: ContoDemo[];
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
/** Se cade di sabato/domenica, torna al venerdì. */
const feriale = (s: string) => {
  const d = parse(s);
  const g = d.getDay();
  if (g === 6) d.setDate(d.getDate() - 1);
  if (g === 0) d.setDate(d.getDate() - 2);
  return iso(d);
};
const minDate = (a: string, b: string) => (a < b ? a : b);

let cache: { chiave: string; dati: DemoDataset } | null = null;

export function getDemoDataset(now: Date = new Date()): DemoDataset {
  const chiave = iso(now);
  if (cache?.chiave === chiave) return cache.dati;
  const dati = costruisci(now);
  cache = { chiave, dati };
  return dati;
}

function costruisci(now: Date): DemoDataset {
  const oggi = iso(now);
  const anno = now.getFullYear();
  const inizio = `${anno}-01-01`;
  const span = Math.max(
    90,
    Math.round((parse(oggi).getTime() - parse(inizio).getTime()) / 86400000),
  );
  /** Frazione 0..1 dell'intervallo gennaio -> oggi (mai oltre oggi). */
  const alFrazione = (f: number) => minDate(feriale(addDays(inizio, Math.round(f * span))), oggi);
  const creato = (data: string) => `${data}T09:00:00.000Z`;

  // ---- Listino
  const SERVIZI_DEF: [string, string, number, Servizio["unita"]][] = [
    ["Check-up dei processi", "Analisi di come lavori oggi e cosa si può semplificare.", 450, "una tantum"],
    ["Progetto su misura (automazioni)", "Automazioni e strumenti costruiti sul tuo modo di lavorare.", 1900, "una tantum"],
    ["Sito / strumento digitale", "Sito vetrina o piccolo strumento web su misura.", 1200, "una tantum"],
    ["Assistenza mensile", "Supporto continuativo e piccole modifiche.", 200, "mese"],
    ["Formazione (1 giornata)", "Giornata di formazione per te o per il tuo team.", 350, "giorno"],
  ];
  const servizi: Servizio[] = SERVIZI_DEF.map(([nome, descrizione, prezzo, unita], i) => ({
    id: `demo-srv-${i + 1}`,
    user_id: DEMO_USER_ID,
    nome,
    descrizione,
    prezzo,
    unita,
    attivo: true,
    created_at: creato(inizio),
  }));
  const S = { check: 0, progetto: 1, sito: 2, assistenza: 3, formazione: 4 };
  const riga = (s: number, quantita = 1, descrizione?: string): Riga => ({
    descrizione: descrizione ?? servizi[s].nome,
    quantita,
    prezzo: servizi[s].prezzo,
  });
  const somma = (righe: Riga[]) => r2(righe.reduce((t, r) => t + r.quantita * r.prezzo, 0));

  // ---- Clienti (fittizi, P.IVA chiaramente finte)
  const CLIENTI_DEF: [string, string, string, string, string][] = [
    ["Panificio Del Porto", "IT00000000001", "info@panificiodelporto.example", "0721 000001", "Fano. Titolare: Marco."],
    ["Studio Dentistico Sorriso", "IT00000000002", "segreteria@studiosorriso.example", "0721 000002", "Pesaro. Vuole meno carta e più promemoria automatici."],
    ["Associazione Culturale Esempio", "IT00000000003", "info@associazione.example", "0721 000003", "Associazione, sito e iscrizioni."],
    ["Officina Meccanica Bartolucci", "IT00000000004", "officina@bartolucci.example", "071 000004", "Senigallia."],
    ["Trattoria Da Gigi", "IT00000000005", "prenotazioni@dagigi.example", "0721 000005", "Fano. Prenotazioni online."],
    ["Boutique Marè", "IT00000000006", "info@boutiquemare.example", "0721 000006", "Pesaro. Negozio con shop online."],
    ["Cantina Colli del Metauro", "IT00000000007", "cantina@collimetauro.example", "0721 000007", "Fano (colline). Vendita diretta."],
    ["Studio Geometri Ferri & Associati", "IT00000000008", "studio@geometriferri.example", "071 000008", "Senigallia."],
  ];
  const clienti: Cliente[] = CLIENTI_DEF.map(([nome, piva_cf, email, telefono, note], i) => ({
    id: `demo-cli-${i + 1}`,
    user_id: DEMO_USER_ID,
    nome,
    piva_cf,
    email,
    telefono,
    note,
    created_at: creato(alFrazione(i * 0.04)),
  }));
  const cid = (n: number) => `demo-cli-${n}`;

  // ---- Fatture
  type FDef = {
    c: number;
    f?: number; // frazione gennaio->oggi (emesse/incassate)
    fra?: number; // giorni da oggi (da emettere)
    stato: StatoFattura;
    righe: Riga[];
    prev?: number; // indice preventivo (1-based)
  };
  const FATTURE_DEF: FDef[] = [
    { c: 1, f: 0.02, stato: "incassata", righe: [riga(S.check)] },
    { c: 2, f: 0.05, stato: "incassata", righe: [riga(S.check)] },
    { c: 3, f: 0.08, stato: "incassata", righe: [riga(S.sito)], prev: 2 },
    { c: 4, f: 0.12, stato: "incassata", righe: [riga(S.check)] },
    { c: 2, f: 0.15, stato: "incassata", righe: [riga(S.assistenza)] },
    { c: 1, f: 0.2, stato: "incassata", righe: [riga(S.progetto)], prev: 1 },
    { c: 5, f: 0.24, stato: "incassata", righe: [riga(S.check)] },
    { c: 6, f: 0.28, stato: "incassata", righe: [riga(S.formazione)] },
    { c: 2, f: 0.32, stato: "incassata", righe: [riga(S.assistenza)] },
    { c: 7, f: 0.36, stato: "incassata", righe: [riga(S.check)] },
    { c: 3, f: 0.4, stato: "incassata", righe: [riga(S.formazione, 2, "Formazione (2 giornate)")] },
    { c: 4, f: 0.46, stato: "incassata", righe: [riga(S.progetto)], prev: 3 },
    { c: 2, f: 0.5, stato: "incassata", righe: [riga(S.assistenza)] },
    { c: 8, f: 0.54, stato: "incassata", righe: [riga(S.check)] },
    { c: 5, f: 0.58, stato: "incassata", righe: [riga(S.sito)], prev: 8 },
    { c: 6, f: 0.64, stato: "incassata", righe: [riga(S.assistenza)] },
    { c: 7, f: 0.7, stato: "incassata", righe: [riga(S.progetto)], prev: 4 },
    { c: 8, f: 0.74, stato: "emessa", righe: [riga(S.progetto)], prev: 5 },
    { c: 2, f: 0.8, stato: "emessa", righe: [riga(S.assistenza)] },
    { c: 3, f: 0.87, stato: "emessa", righe: [riga(S.formazione), riga(S.assistenza)] },
    { c: 5, f: 0.93, stato: "emessa", righe: [riga(S.check)] },
    { c: 1, f: 0.97, stato: "emessa", righe: [riga(S.sito)], prev: 6 },
    { c: 4, fra: 3, stato: "da_emettere", righe: [riga(S.assistenza)] },
    { c: 6, fra: 10, stato: "da_emettere", righe: [riga(S.sito)], prev: 7 },
    { c: 8, fra: 20, stato: "da_emettere", righe: [riga(S.formazione)] },
  ];

  const fatture: Fattura[] = [];
  let progressivo = 0;
  FATTURE_DEF.forEach((d, i) => {
    const importo = somma(d.righe);
    const emessa = d.stato !== "da_emettere";
    const data = emessa ? alFrazione(d.f ?? 0) : addDays(oggi, d.fra ?? 7);
    if (emessa) progressivo += 1;
    fatture.push({
      id: `demo-fat-${i + 1}`,
      user_id: DEMO_USER_ID,
      cliente_id: cid(d.c),
      preventivo_id: d.prev ? `demo-prev-${d.prev}` : null,
      numero: emessa ? `${progressivo}/${anno}` : null,
      data_emissione: emessa ? data : null,
      descrizione: d.righe.map((r) => r.descrizione).join(" + "),
      importo,
      bollo: bolloDovuto(importo),
      stato: d.stato,
      righe: d.righe,
      scadenza_pagamento: addDays(data, 30),
      created_at: creato(data),
    });
  });

  // ---- Preventivi
  type PDef = { c: number; stato: StatoPreventivo; righe: Riga[]; f?: number };
  const PREV_DEF: PDef[] = [
    { c: 1, stato: "accettato", righe: [riga(S.progetto)] },
    { c: 3, stato: "accettato", righe: [riga(S.sito)] },
    { c: 4, stato: "accettato", righe: [riga(S.progetto)] },
    { c: 7, stato: "accettato", righe: [riga(S.progetto)] },
    { c: 8, stato: "accettato", righe: [riga(S.progetto)] },
    { c: 1, stato: "accettato", righe: [riga(S.sito)] },
    { c: 6, stato: "accettato", righe: [riga(S.sito)], f: 0.9 },
    { c: 5, stato: "accettato", righe: [riga(S.sito)] },
    { c: 3, stato: "inviato", righe: [riga(S.assistenza, 6, "Assistenza mensile (6 mesi)")], f: 0.88 },
    { c: 2, stato: "inviato", righe: [riga(S.progetto)], f: 0.95 },
    { c: 6, stato: "bozza", righe: [riga(S.formazione, 2, "Formazione (2 giornate)")], f: 0.99 },
    { c: 5, stato: "rifiutato", righe: [riga(S.progetto)], f: 0.3 },
  ];
  const preventivi: Preventivo[] = PREV_DEF.map((d, i) => {
    const fatt = fatture.find((x) => x.preventivo_id === `demo-prev-${i + 1}`);
    const grezza = fatt
      ? addDays(fatt.data_emissione ?? oggi, fatt.data_emissione ? -21 : -25)
      : alFrazione(d.f ?? 0.1);
    const data = minDate(grezza, oggi);
    return {
      id: `demo-prev-${i + 1}`,
      user_id: DEMO_USER_ID,
      cliente_id: cid(d.c),
      numero: `P${i + 1}/${anno}`,
      data,
      descrizione: d.righe.map((r) => r.descrizione).join(" + "),
      importo: somma(d.righe),
      stato: d.stato,
      righe: d.righe,
      validita: addDays(data, 30),
      created_at: creato(data),
    };
  });

  // ---- Incassi (uno per fattura incassata) con accantonamenti
  const incassi: Incasso[] = fatture
    .filter((f) => f.stato === "incassata")
    .map((f, i) => {
      const data = minDate(feriale(addDays(f.data_emissione as string, 12 + ((i * 7) % 22))), oggi);
      const acc = calcolaAccantonamento(f.importo, PROFILO_FISCALE_DEFAULT);
      return {
        id: `demo-inc-${i + 1}`,
        user_id: DEMO_USER_ID,
        fattura_id: f.id,
        cliente_id: f.cliente_id,
        data,
        importo: f.importo,
        accantonamento_imposta: acc.imposta,
        accantonamento_inps: acc.inps,
        conto_destinazione_id: "demo-conto-tasse",
        spostato: true,
        created_at: creato(data),
      };
    })
    .sort((a, b) => a.data.localeCompare(b.data));
  // Gli ultimi 3 incassi (per data) sono ancora da spostare sul conto Tasse.
  incassi.slice(-3).forEach((inc) => {
    inc.spostato = false;
  });

  // ---- Spese: [frazione, fornitore, descrizione, categoria, importo, pagata]
  const SPESE_DEF: [number, string, string, string, number, boolean][] = [
    [0.01, "Studio Bianchi", "Consulenza apertura partita IVA", "Commercialista", 250, true],
    [0.03, "Microsoft", "Microsoft 365 Business (annuale)", "Software", 126, true],
    [0.06, "Aruba", "Dominio e posta (annuale)", "Hosting e domini", 38.99, true],
    [0.1, "Ho. Mobile", "Ricarica telefono professionale", "Telefono", 7.99, true],
    [0.14, "Cartoleria Il Foglio", "Quaderni, penne, cartelline", "Cancelleria", 23.4, true],
    [0.2, "Vercel", "Piano hosting siti clienti", "Hosting e domini", 20, true],
    [0.27, "Udemy", "Corso avanzato di automazioni", "Formazione", 54.99, true],
    [0.33, "Canva", "Canva Pro (annuale)", "Software", 109, true],
    [0.4, "Ho. Mobile", "Ricarica telefono professionale", "Telefono", 7.99, true],
    [0.47, "Notion Labs", "Notion Plus (annuale)", "Software", 96, true],
    [0.55, "Digital Academy", "Corso sicurezza dei dati", "Formazione", 180, true],
    [0.62, "Vercel", "Piano hosting siti clienti", "Hosting e domini", 20, true],
    [0.75, "Ho. Mobile", "Ricarica telefono professionale", "Telefono", 7.99, true],
    [0.9, "Studio Bianchi", "Consulenza fiscale e avvio contabilità", "Commercialista", 150, false],
    [0.97, "Cartoleria Il Foglio", "Toner e carta per stampante", "Cancelleria", 41.5, false],
  ];
  const spese: Spesa[] = SPESE_DEF.map(([f, fornitore, descrizione, categoria, importo, pagata], i) => {
    const data = alFrazione(f);
    return {
      id: `demo-spe-${i + 1}`,
      user_id: DEMO_USER_ID,
      data,
      fornitore,
      descrizione,
      categoria,
      importo,
      pagata,
      created_at: creato(data),
    };
  });

  // ---- Conti (saldi indicativi)
  const sommaAcc = (spostato: boolean) =>
    r2(
      incassi
        .filter((i) => i.spostato === spostato)
        .reduce((t, i) => t + i.accantonamento_imposta + i.accantonamento_inps, 0),
    );
  const incassato = r2(incassi.reduce((t, i) => t + i.importo, 0));
  const speseTot = r2(spese.filter((s) => s.pagata).reduce((t, s) => t + s.importo, 0));
  const conti: ContoDemo[] = [
    {
      id: "demo-conto-attivita",
      nome: "Conto corrente attività",
      ruolo: "attivita",
      saldo: r2(Math.max(0, incassato - sommaAcc(true) - speseTot - 6000)),
    },
    { id: "demo-conto-tasse", nome: "Conto Tasse", ruolo: "tasse", saldo: sommaAcc(true) },
    { id: "demo-conto-personale", nome: "Conto personale", ruolo: "personale", saldo: 3250.4 },
  ];

  const profilo: ProfiloFiscale = {
    ...PROFILO_FISCALE_DEFAULT,
    ateco: "62.20.20",
    // In demo si simula una P.IVA aperta l'anno scorso, così compaiono saldo e acconti.
    dataApertura: `${anno - 1}-03-01`,
    commercialistaNome: "Laura Bianchi",
    commercialistaTelefono: "0721 000000",
    commercialistaEmail: "studio@bianchi.example",
    contoTasseId: "demo-conto-tasse",
    ragioneSociale: AZIENDA_DEMO.ragioneSociale,
    indirizzo: AZIENDA_DEMO.indirizzo,
    piva: AZIENDA_DEMO.piva,
    iban: AZIENDA_DEMO.iban,
  };

  return {
    oggi,
    anno,
    azienda: AZIENDA_DEMO,
    profilo,
    clienti,
    servizi,
    preventivi,
    fatture,
    incassi,
    spese,
    conti,
  };
}
