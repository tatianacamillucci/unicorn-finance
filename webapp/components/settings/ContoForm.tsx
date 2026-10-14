"use client";

import { useRef, useState } from "react";
import { createConto } from "@/app/actions/conti";

const TIPI = ["corrente", "risparmio", "contanti", "carta"];
const RUOLI = [
  { value: "personale", label: "Personale (spese di tutti i giorni)" },
  { value: "attivita", label: "Attività (incassi del lavoro)" },
  { value: "tasse", label: "Tasse (soldi messi da parte per le tasse)" },
];

export function ContoForm() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createConto(formData);
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
      <h2 className="font-black text-lg">Nuovo conto</h2>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <input
        name="nome"
        type="text"
        placeholder="Nome"
        required
        className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select name="tipo" required defaultValue="" className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="" disabled>
          Tipo
        </option>
        {TIPI.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <label className="flex flex-col gap-1 text-sm font-bold">
        A cosa serve questo conto?
        <select
          name="ruolo"
          defaultValue="personale"
          className="border border-input bg-background text-foreground rounded-xl p-2 font-normal focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {RUOLI.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <input
        name="saldo_iniziale"
        type="number"
        step="0.01"
        placeholder="Saldo iniziale"
        defaultValue={0}
        className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          Colore
          <input
            name="colore_hex"
            type="color"
            defaultValue="#51BBFE"
            className="h-10 w-14 border border-input bg-background text-foreground rounded-xl"
          />
        </label>
        <input
          name="icona_emoji"
          type="text"
          defaultValue="💳"
          maxLength={4}
          className="w-16 border border-input bg-background text-foreground rounded-xl p-2 text-center"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-primary p-2 font-bold text-primary-foreground"
      >
        Aggiungi conto
      </button>
    </form>
  );
}
