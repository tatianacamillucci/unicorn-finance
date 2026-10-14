"use client";

import { useState, useTransition } from "react";
import { saveProfiloFiscale } from "@/app/actions/profilo-fiscale";

interface Props {
  ateco: string;
  coefficientePct: number;
  aliquotaImpostaPct: number;
  aliquotaInpsPct: number;
  dataApertura: string;
  contoTasseId: string;
  conti: { id: string; nome: string }[];
  /** null = colonne della migrazione 0008 non ancora presenti: i campi dei documenti non si mostrano. */
  intestazione?: { ragioneSociale: string; indirizzo: string; piva: string; iban: string } | null;
}

const inputCls =
  "w-full rounded-xl border border-input bg-background p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Campo({ label, aiuto, children }: { label: string; aiuto: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      <span className="text-xs text-muted-foreground">{aiuto}</span>
    </label>
  );
}

export function ProfiloFiscaleForm(p: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProfiloFiscale(formData);
      if (result.error) {
        setError(result.error);
        setSaved(false);
        return;
      }
      setError(null);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm font-semibold text-primary">Salvato!</p>}

      <Campo label="Codice ATECO" aiuto="Il codice che descrive il tuo lavoro (si trova nella visura o nella lettera di apertura P.IVA).">
        <input name="ateco" type="text" defaultValue={p.ateco} maxLength={20} className={inputCls} />
      </Campo>
      <Campo label="Coefficiente di redditività (%)" aiuto="La parte dell'incasso che conta come guadagno. Per il tuo codice è il 67.">
        <input name="coefficiente" type="number" step="0.01" min={0} max={100} defaultValue={p.coefficientePct} required className={inputCls} />
      </Campo>
      <Campo label="Aliquota imposta (%)" aiuto="La percentuale di tasse sul guadagno: 5 nei primi 5 anni di attività, poi 15.">
        <input name="aliquota_imposta" type="number" step="0.01" min={0} max={100} defaultValue={p.aliquotaImpostaPct} required className={inputCls} />
      </Campo>
      <Campo label="Aliquota INPS (%)" aiuto="I contributi per la pensione, calcolati sul guadagno. Nel 2026 sono il 26,07.">
        <input name="aliquota_inps" type="number" step="0.01" min={0} max={100} defaultValue={p.aliquotaInpsPct} required className={inputCls} />
      </Campo>
      <Campo label="Data apertura P.IVA" aiuto="Serve per sapere in quale anno di attività sei e quali scadenze ti riguardano.">
        <input name="data_apertura" type="date" defaultValue={p.dataApertura} className={inputCls} />
      </Campo>
      <Campo label="Conto per le tasse" aiuto="Il conto dove metti da parte i soldi delle tasse, separato da quelli che puoi spendere.">
        <select name="conto_tasse_id" defaultValue={p.contoTasseId} className={inputCls}>
          <option value="">Nessuno per ora</option>
          {p.conti.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>

      {p.intestazione ? (
        <>
          <h2 className="mt-2 text-base font-semibold">Dati per i documenti</h2>
          <p className="-mt-2 text-xs text-muted-foreground">
            Compaiono in alto su preventivi e fatture.
          </p>
          <Campo label="Ragione sociale" aiuto="Il nome con cui emetti i documenti.">
            <input name="ragione_sociale" type="text" defaultValue={p.intestazione.ragioneSociale} maxLength={160} className={inputCls} />
          </Campo>
          <Campo label="Indirizzo" aiuto="Via, CAP e città della sede.">
            <input name="indirizzo" type="text" defaultValue={p.intestazione.indirizzo} maxLength={240} className={inputCls} />
          </Campo>
          <Campo label="Partita IVA" aiuto="Se non ce l'hai ancora, lascia vuoto.">
            <input name="piva" type="text" defaultValue={p.intestazione.piva} maxLength={32} className={inputCls} />
          </Campo>
          <Campo label="IBAN" aiuto="Dove vuoi ricevere i bonifici.">
            <input name="iban" type="text" defaultValue={p.intestazione.iban} maxLength={40} className={inputCls} />
          </Campo>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          I dati per i documenti (ragione sociale, indirizzo, P.IVA, IBAN) si potranno compilare dopo un aggiornamento del database.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary p-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Salvo..." : "Salva"}
      </button>
    </form>
  );
}
