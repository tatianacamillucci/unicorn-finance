"use client";

import { useRef, useState } from "react";
import { createCategoria } from "@/app/actions/categorie";

const TIPI = ["entrata", "uscita"];

export function CategoriaForm() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createCategoria(formData);
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
      <h2 className="font-black text-lg">Nuova categoria</h2>
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
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          Colore
          <input
            name="colore_hex"
            type="color"
            defaultValue="#4ABA94"
            className="h-10 w-14 border border-input bg-background text-foreground rounded-xl"
          />
        </label>
        <input
          name="emoji"
          type="text"
          defaultValue="💰"
          maxLength={4}
          className="w-16 border border-input bg-background text-foreground rounded-xl p-2 text-center"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-primary p-2 font-bold text-primary-foreground"
      >
        Aggiungi categoria
      </button>
    </form>
  );
}
