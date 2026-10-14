"use client";

import { useState } from "react";
import { updateProfilo } from "@/app/actions/profilo";

export function ProfiloForm({
  nickname,
  obiettivoRisparmio,
}: {
  nickname: string | null;
  obiettivoRisparmio: number | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaved(false);
    const result = await updateProfilo(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaved(true);
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl pastel-box bg-card text-card-foreground p-4 flex flex-col gap-3"
    >
      <h2 className="font-black text-lg">Il tuo profilo</h2>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {saved && <p className="text-primary text-sm font-bold">Salvato!</p>}
      <label className="flex flex-col gap-1 text-sm">
        Nickname
        <input
          name="nickname"
          type="text"
          placeholder="Come vuoi essere chiamata/o"
          defaultValue={nickname ?? ""}
          maxLength={40}
          className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Obiettivo di risparmio (€)
        <input
          name="obiettivo_risparmio"
          type="number"
          step="0.01"
          min="0"
          placeholder="es. 5000"
          defaultValue={obiettivoRisparmio ?? ""}
          className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <button
        type="submit"
        className="rounded-xl bg-primary p-2 font-bold text-primary-foreground"
      >
        Salva
      </button>
    </form>
  );
}
