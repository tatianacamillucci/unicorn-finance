// Calcoli fiscali del regime forfettario. Funzioni pure, nessun accesso al DB.

export interface ParametriFiscali {
  coefficiente: number;
  aliquotaInps: number;
  aliquotaImposta: number;
}

export const PROFILO_DEFAULT: ParametriFiscali = {
  coefficiente: 0.67,
  aliquotaInps: 0.2607,
  aliquotaImposta: 0.05,
};

export const SOGLIA_FORFETTARIO = 85000;
export const SOGLIA_BOLLO = 77.47;
export const IMPORTO_BOLLO = 2;

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcolaAccantonamento(
  importo: number,
  profilo: ParametriFiscali = PROFILO_DEFAULT,
): { inps: number; imposta: number; totale: number } {
  const imponibile = importo * profilo.coefficiente;
  const inpsGrezzo = imponibile * profilo.aliquotaInps;
  const inps = r2(inpsGrezzo);
  const imposta = r2(Math.max(0, imponibile - inpsGrezzo) * profilo.aliquotaImposta);
  return { inps, imposta, totale: r2(inps + imposta) };
}

export function bolloDovuto(importo: number): number {
  return importo > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
}

export interface ScadenzaFiscale {
  data: string; // YYYY-MM-DD
  titolo: string;
  descrizione: string;
  daVerificare: true; // da confermare con la commercialista
}

export function scadenzeFiscali(anno: number, annoApertura: number): ScadenzaFiscale[] {
  const out: ScadenzaFiscale[] = [];
  const v = (data: string, titolo: string, descrizione: string) =>
    out.push({ data, titolo, descrizione, daVerificare: true });

  if (anno >= annoApertura) {
    v(`${anno}-05-31`, "Bollo 1° trimestre", "Paga i 2 € di bollo delle fatture di gennaio, febbraio e marzo.");
    v(`${anno}-09-30`, "Bollo 2° trimestre", "Paga i 2 € di bollo delle fatture di aprile, maggio e giugno.");
    v(`${anno}-11-30`, "Bollo 3° trimestre", "Paga i 2 € di bollo delle fatture di luglio, agosto e settembre.");
    v(`${anno + 1}-02-28`, "Bollo 4° trimestre", "Paga i 2 € di bollo delle fatture di ottobre, novembre e dicembre.");
  }
  if (anno > annoApertura) {
    v(`${anno}-06-30`, "Saldo e primo acconto", "Paga le tasse dell'anno scorso (saldo) e la prima parte di quelle di quest'anno (primo acconto).");
    v(`${anno}-11-30`, "Secondo acconto", "Paga la seconda parte delle tasse di quest'anno.");
  }
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

export function percentualeSoglia(ricaviAnno: number): number {
  return (ricaviAnno / SOGLIA_FORFETTARIO) * 100;
}
