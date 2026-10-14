import type { ModelloEmail } from "@/lib/email-commercialista";

export interface NumeriTrimestre {
  trimestre: 1 | 2 | 3 | 4;
  anno: number;
  fatturato: number;
  incassato: number;
  bolli: number;
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

/** Date di inizio/fine (YYYY-MM-DD) del trimestre. */
export function intervalloTrimestre(anno: number, t: 1 | 2 | 3 | 4): { da: string; a: string } {
  const mi = (t - 1) * 3 + 1;
  const mf = mi + 2;
  const ultimo = new Date(Date.UTC(anno, mf, 0)).getUTCDate();
  const p = (n: number) => String(n).padStart(2, "0");
  return { da: `${anno}-${p(mi)}-01`, a: `${anno}-${p(mf)}-${p(ultimo)}` };
}

export function trimestreDi(isoOggi: string): 1 | 2 | 3 | 4 {
  return (Math.floor((Number(isoOggi.slice(5, 7)) - 1) / 3) + 1) as 1 | 2 | 3 | 4;
}

/** Modello "Ti mando il riepilogo del trimestre" con i numeri già nel testo. */
export function modelloRiepilogoTrimestre(n: NumeriTrimestre, nomeCommercialista?: string | null): ModelloEmail {
  const first = (nomeCommercialista ?? "").trim().split(/\s+/)[0];
  const saluto = first ? `Ciao ${first},` : "Buongiorno,";
  return {
    id: "riepilogo-trimestre",
    titolo: "Ti mando il riepilogo del trimestre",
    oggetto: `Riepilogo ${n.trimestre}° trimestre ${n.anno}`,
    corpo:
      `${saluto}\n\nti mando il riepilogo del ${n.trimestre}° trimestre ${n.anno}:\n\n` +
      `- Fatturato: ${euro.format(n.fatturato)}\n` +
      `- Incassato: ${euro.format(n.incassato)}\n` +
      `- Bolli da versare: ${euro.format(n.bolli)}\n\n` +
      `Dimmi se ti serve altro o se c'è qualcosa da controllare.\n\nGrazie mille e buona giornata.`,
  };
}
