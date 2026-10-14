"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import type { Riga } from "@/lib/types/gestionale";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const dataIt = (iso?: string | null) => {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

// da verificare con la commercialista: dicitura del regime forfettario.
const DICITURA_FORFETTARIO =
  "Operazione in franchigia da IVA ai sensi dell'art. 1, commi 54-89, Legge n. 190/2014. " +
  "Si richiede la non applicazione della ritenuta alla fonte a titolo d'acconto ai sensi dell'art. 1 comma 67 L. 190/2014.";

export interface DocumentoPreviewProps {
  tipo: "fattura" | "preventivo";
  /** Es. "3/2026" (fatture da emettere: null -> "bozza"). */
  numero: string | null;
  /** Data emissione (fattura) o data del preventivo, YYYY-MM-DD. */
  data: string | null;
  /** Scadenza pagamento (fattura) o validità (preventivo), YYYY-MM-DD. */
  scadenza?: string | null;
  emittente: {
    ragioneSociale: string;
    descrizione?: string;
    indirizzo?: string | null;
    piva?: string | null;
    iban?: string | null;
  };
  cliente: { nome: string; pivaCf?: string | null; email?: string | null };
  righe: Riga[];
  /** Bollo in euro (di solito 2 o 0). */
  bollo: number;
  /** Note libere in fondo. */
  note?: string | null;
  /** Nasconde il pulsante "Stampa / PDF". */
  senzaStampa?: boolean;
}

/** Anteprima stile foglio A4 di fattura/preventivo, con pulsante Stampa / PDF (window.print). */
export function DocumentoPreview({
  tipo,
  numero,
  data,
  scadenza,
  emittente,
  cliente,
  righe,
  bollo,
  note,
  senzaStampa,
}: DocumentoPreviewProps) {
  const imponibile = righe.reduce((t, r) => t + r.quantita * r.prezzo, 0);
  const totale = imponibile + bollo;
  const titolo = tipo === "fattura" ? "Fattura" : "Preventivo";

  return (
    <div className="flex flex-col gap-3">
      {!senzaStampa && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> Stampa / PDF
          </button>
        </div>
      )}

      <article
        className="documento-a4 mx-auto w-full max-w-[794px] rounded-sm border bg-white p-6 text-[13px] leading-relaxed text-neutral-900 shadow-md sm:p-10"
        style={{ colorScheme: "light" }}
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-4">
          <div>
            <p className="text-base font-bold">{emittente.ragioneSociale}</p>
            {emittente.descrizione && <p>{emittente.descrizione}</p>}
            {emittente.indirizzo && <p>{emittente.indirizzo}</p>}
            {emittente.piva && <p>P.IVA: {emittente.piva}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wide">{titolo}</p>
            <p>N. {numero ?? "bozza"}</p>
            {data && <p>Data: {dataIt(data)}</p>}
            {scadenza && (
              <p>
                {tipo === "fattura" ? "Scadenza pagamento" : "Valido fino al"}: {dataIt(scadenza)}
              </p>
            )}
          </div>
        </header>

        <section className="mt-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Cliente</p>
          <p className="font-semibold">{cliente.nome}</p>
          {cliente.pivaCf && <p>P.IVA / C.F.: {cliente.pivaCf}</p>}
          {cliente.email && <p>{cliente.email}</p>}
        </section>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b-2 border-neutral-800 text-left text-xs uppercase tracking-wide">
                <th className="py-2 pr-2">Descrizione</th>
                <th className="px-2 py-2 text-right">Q.tà</th>
                <th className="px-2 py-2 text-right">Prezzo</th>
                <th className="py-2 pl-2 text-right">Importo</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="py-2 pr-2">{r.descrizione}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.quantita}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{euro.format(r.prezzo)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{euro.format(r.quantita * r.prezzo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1">
          <div className="flex justify-between gap-6">
            <dt>Imponibile</dt>
            <dd className="tabular-nums">{euro.format(imponibile)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt>Bollo virtuale</dt>
            <dd className="tabular-nums">{euro.format(bollo)}</dd>
          </div>
          <div className="flex justify-between gap-6 border-t-2 border-neutral-800 pt-1 text-base font-bold">
            <dt>Totale</dt>
            <dd className="tabular-nums">{euro.format(totale)}</dd>
          </div>
        </dl>

        <footer className="mt-8 space-y-2 border-t border-neutral-300 pt-4 text-xs text-neutral-600">
          {/* da verificare con la commercialista */}
          <p>{DICITURA_FORFETTARIO}</p>
          {bollo > 0 && <p>Imposta di bollo di 2,00 € assolta in modo virtuale.</p>}
          {tipo === "fattura" && emittente.iban && <p>Pagamento tramite bonifico. IBAN: {emittente.iban}</p>}
          {note && <p>{note}</p>}
        </footer>
      </article>
    </div>
  );
}
