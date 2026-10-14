/** Modelli di email per la commercialista. Nessun invio automatico: si apre solo Gmail. */

export interface ModelloEmail {
  id: string;
  titolo: string;
  oggetto: string;
  corpo: string;
}

export const COMMERCIALISTA_SUGGERITA = {
  nome: "Laura Bianchi",
  telefono: "328 414 8941",
  whatsapp: "393284148941",
} as const;

export function modelliEmail(nomeCommercialista?: string | null): ModelloEmail[] {
  const first = (nomeCommercialista ?? "").trim().split(/\s+/)[0];
  const saluto = first ? `Ciao ${first},` : "Buongiorno,";
  const chiusura = "Grazie mille e buona giornata.";
  return [
    {
      id: "fattura-mese",
      titolo: "Invio fattura del mese",
      oggetto: "Fattura del mese",
      corpo: `${saluto}\n\nti allego la fattura emessa questo mese.\nDimmi se serve altro.\n\n${chiusura}`,
    },
    {
      id: "domanda",
      titolo: "Domanda generica",
      oggetto: "Una domanda",
      corpo: `${saluto}\n\nvorrei chiederti un chiarimento:\n\n[scrivi qui la domanda]\n\n${chiusura}`,
    },
    {
      id: "documenti-f24",
      titolo: "Invio documenti per F24",
      oggetto: "Documenti per F24",
      corpo: `${saluto}\n\nti invio i documenti per preparare l'F24.\nMi confermi importi e scadenza da pagare?\n\n${chiusura}`,
    },
    {
      id: "appuntamento",
      titolo: "Richiesta appuntamento",
      oggetto: "Richiesta appuntamento",
      corpo: `${saluto}\n\nvorrei fissare un appuntamento (di persona o in videochiamata).\nQuali giorni e orari hai disponibili nelle prossime settimane?\n\n${chiusura}`,
    },
    {
      id: "domande-piva",
      titolo: "Domande aperte sulla P.IVA",
      oggetto: "Domande sulla mia partita IVA",
      corpo: `${saluto}\n\nho alcune domande aperte sulla mia partita IVA:\n\n1. [domanda]\n2. [domanda]\n\n${chiusura}`,
    },
  ];
}

export function gmailComposeUrl(to: string, subject: string, body: string): string {
  return (
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

export function whatsappEmailRequestUrl(): string {
  const testo = "Ciao Francesca, mi puoi dare il tuo indirizzo email? Vorrei mandarti i documenti. Grazie!";
  return `https://wa.me/${COMMERCIALISTA_SUGGERITA.whatsapp}?text=${encodeURIComponent(testo)}`;
}
