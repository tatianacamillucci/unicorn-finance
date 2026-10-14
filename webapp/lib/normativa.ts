/** Regole fiscali chiave del regime forfettario (bozza, senza IA). */

export const ULTIMO_CONTROLLO = "08/10/2026";

export interface RegolaNormativa {
  id: string;
  titolo: string;
  spiegazione: string;
  fonteNome: string;
  fonteUrl: string;
  /** true se la fonte e' il nostro report interno, non un sito ufficiale. */
  daVerificare: boolean;
}

export const REGOLE_NORMATIVA: RegolaNormativa[] = [
  {
    id: "soglia",
    titolo: "Soglia di 85.000 € di ricavi",
    spiegazione:
      "Puoi stare nel regime forfettario finche' incassi al massimo 85.000 € in un anno. Se superi 100.000 € esci subito, gia' dall'anno in corso.",
    fonteNome: "Agenzia delle Entrate - Regime forfettario",
    fonteUrl:
      "https://www.agenziaentrate.gov.it/portale/regime-forfetario-le-regole-2020-/infogen-regime-forfetario-le-regole-2020-",
    daVerificare: false,
  },
  {
    id: "imposta",
    titolo: "Imposta sostitutiva: 5% per 5 anni, poi 15%",
    spiegazione:
      "Se sei una nuova attivita' (requisiti da controllare) paghi il 5% per i primi 5 anni, poi il 15%. Si calcola sul reddito forfettario, non sull'incasso intero.",
    fonteNome: "Agenzia delle Entrate - Regime forfettario",
    fonteUrl:
      "https://www.agenziaentrate.gov.it/portale/regime-forfetario-le-regole-2020-/infogen-regime-forfetario-le-regole-2020-",
    daVerificare: false,
  },
  {
    id: "coefficiente",
    titolo: "Coefficiente di redditivita' 67% (ATECO 62.20.10)",
    spiegazione:
      "Solo il 67% di quello che incassi e' considerato guadagno su cui pagare le tasse. I coefficienti con i nuovi codici ATECO 2025 non sono ancora pubblicati.",
    fonteNome: "Report interno del progetto (da verificare con la commercialista)",
    fonteUrl: "https://www.informazionefiscale.it/Regime-forfettario-codici-ATECO-2025-coefficienti-redditivita",
    daVerificare: true,
  },
  {
    id: "inps",
    titolo: "INPS Gestione Separata: 26,07% nel 2026",
    spiegazione:
      "Per chi non ha altra previdenza i contributi sono il 26,07% del reddito forfettario (non dei ricavi). Non c'e' un contributo fisso minimo.",
    fonteNome: "INPS - Gestione Separata (circolare n. 8 del 3/2/2026)",
    fonteUrl: "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.iscrizione-liberi-professionisti-50169.iscrizione-liberi-professionisti.html",
    daVerificare: false,
  },
  {
    id: "bollo",
    titolo: "Bollo da 2 € sulle fatture sopra 77,47 €",
    spiegazione:
      "Sulle fatture senza IVA di importo superiore a 77,47 € si paga una marca da bollo da 2 €, di solito scritta in fattura e versata ogni trimestre.",
    fonteNome: "Report interno (fonti: Fiscozen, Fiscal Focus)",
    fonteUrl: "https://www.fiscozen.it/guide/pagare-marca-da-bollo-fattura-forfettaria/",
    daVerificare: true,
  },
  {
    id: "fattura-elettronica",
    titolo: "Fattura elettronica obbligatoria",
    spiegazione:
      "Dal 2024 anche i forfettari devono emettere fattura elettronica tramite il Sistema di Interscambio, non basta un PDF.",
    fonteNome: "Agenzia delle Entrate - Fatturazione elettronica",
    fonteUrl: "https://www.agenziaentrate.gov.it/portale/web/guest/schede/comunicazioni/fatture-e-corrispettivi",
    daVerificare: false,
  },
  {
    id: "acconti",
    titolo: "Acconti di giugno e novembre",
    spiegazione:
      "Dal secondo anno si pagano due acconti (30 giugno e 30 novembre) su tasse e INPS, calcolati sull'anno prima. Nel primo anno non ci sono acconti, ma a giugno dopo arriva tutto insieme: conviene mettere da parte ogni mese.",
    fonteNome: "Report interno (fonti: Fiscozen, Flextax; ripartizione da verificare)",
    fonteUrl: "https://www.fiscozen.it/guide/anticipo-inps-anno-successivo/",
    daVerificare: true,
  },
];

export interface LinkNovita {
  nome: string;
  url: string;
  descrizione: string;
}

export const DOVE_CONTROLLARE: LinkNovita[] = [
  {
    nome: "Agenzia delle Entrate - Regime forfettario",
    url: "https://www.agenziaentrate.gov.it/portale/regime-forfetario-le-regole-2020-/infogen-regime-forfetario-le-regole-2020-",
    descrizione: "La scheda ufficiale sul forfettario.",
  },
  {
    nome: "INPS - Gestione Separata",
    url: "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.iscrizione-liberi-professionisti-50169.iscrizione-liberi-professionisti.html",
    descrizione: "Aliquote e scadenze dei contributi.",
  },
  {
    nome: "Normattiva",
    url: "https://www.normattiva.it",
    descrizione: "Il testo delle leggi, ad esempio la L. 190/2014.",
  },
];
