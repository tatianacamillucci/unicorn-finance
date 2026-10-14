import type { ProfiloFiscale } from "@/lib/types/gestionale";

/** Anno di apertura della P.IVA (default 2027). */
export function annoAperturaDa(profilo: ProfiloFiscale): number {
  const y = profilo.dataApertura ? parseInt(profilo.dataApertura.slice(0, 4), 10) : NaN;
  return Number.isFinite(y) ? y : 2027;
}
