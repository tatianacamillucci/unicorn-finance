"use client";

import { useRef, useState } from "react";
import { createRicorrenza } from "@/app/actions/ricorrenze";

interface Option {
  id: string;
  nome: string;
  emoji?: string;
}

export function RicorrenzaForm({
  conti,
  categorie,
}: {
  conti: Option[];
  categorie: Option[];
}) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createRicorrenza(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-2xl pastel-box bg-card text-card-foreground p-4 flex flex-col gap-3"
    >
      <h2 className="font-black text-lg">Nuova ricorrenza</h2>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <input
        name="nome"
        type="text"
        placeholder="Nome (es. Abbonamento Netflix)"
        required
        className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        name="importo"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Importo"
        required
        className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        name="categoria_id"
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
          placeholder="es. 5"
          required
          className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Attiva da
        <input
          name="data_inizio"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <button
        type="submit"
        className="rounded-xl bg-primary p-2 font-bold text-primary-foreground"
      >
        Aggiungi ricorrenza
      </button>
    </form>
  );
}
