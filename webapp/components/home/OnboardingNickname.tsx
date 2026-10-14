"use client";

import { useState } from "react";
import { updateProfilo } from "@/app/actions/profilo";

export function OnboardingNickname() {
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  if (!visible) return null;

  async function handleSubmit(formData: FormData) {
    const result = await updateProfilo(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setVisible(false);
  }

  async function handleSkip() {
    const formData = new FormData();
    formData.set("nickname", "Utente");
    await updateProfilo(formData);
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        action={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-background text-foreground p-6 flex flex-col gap-3"
      >
        <h2 className="font-black text-lg">Benvenuta/o su Gestionale</h2>
        <p className="text-sm text-muted-foreground">
          Indica il nome con cui vuoi essere identificata/o nell'app.
        </p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <input
          name="nickname"
          type="text"
          placeholder="Il tuo nickname"
          maxLength={40}
          autoFocus
          className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 rounded-xl border border-input bg-background text-foreground p-2 font-bold"
          >
            Salta
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary p-2 font-bold text-primary-foreground"
          >
            Continua
          </button>
        </div>
      </form>
    </div>
  );
}
