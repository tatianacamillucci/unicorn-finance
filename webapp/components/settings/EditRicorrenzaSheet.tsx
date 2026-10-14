"use client";

import { useState } from "react";
import { updateRicorrenza } from "@/app/actions/ricorrenze";

interface Option {
  id: string;
  nome: string;
  emoji?: string;
}

interface RicorrenzaValues {
  id: string;
  nome: string;
  importo: number;
  conto_id: string;
  categoria_id: string;
  giorno_del_mese: number;
  data_inizio: string;
}

export function EditRicorrenzaSheet({
  ricorrenza,
  conti,
  categorie,
}: {
  ricorrenza: RicorrenzaValues;
  conti: Option[];
  categorie: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await updateRicorrenza(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl pastel-box bg-card text-card-foreground px-3 py-2 font-bold text-foreground"
      >
        Modifica
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <form
            action={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background text-foreground p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Modifica ricorrenza</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-muted font-black"
              >
                ×
              </button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <input type="hidden" name="id" value={ricorrenza.id} />
            <input
              name="nome"
              type="text"
              defaultValue={ricorrenza.nome}
              required
              className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="importo"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={ricorrenza.importo}
              required
              className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              name="categoria_id"
              defaultValue={ricorrenza.categoria_id}
              required
              className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Categoria</option>
              {categorie.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nome}
                </option>
              ))}
            </select>
            <select
              name="conto_id"
              defaultValue={ricorrenza.conto_id}
              required
              className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Conto</option>
              {conti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-sm">
              Giorno del mese
              <input
                name="giorno_del_mese"
                type="number"
                min="1"
                max="31"
                defaultValue={ricorrenza.giorno_del_mese}
                required
                className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Attiva da
              <input
                name="data_inizio"
                type="date"
                defaultValue={ricorrenza.data_inizio}
                required
                className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-input bg-background text-foreground p-2 font-bold"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary p-2 font-bold text-primary-foreground"
              >
                Salva
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
