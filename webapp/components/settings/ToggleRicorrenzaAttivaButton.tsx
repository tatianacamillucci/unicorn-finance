"use client";

import { useState, useTransition } from "react";
import { toggleRicorrenzaAttiva } from "@/app/actions/ricorrenze";

export function ToggleRicorrenzaAttivaButton({
  ricorrenzaId,
  attivo,
}: {
  ricorrenzaId: string;
  attivo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = confirm(
      attivo
        ? "Disattivare questa ricorrenza? Non verranno più generati nuovi movimenti automatici, ma quelli già registrati restano."
        : "Riattivare questa ricorrenza?",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", ricorrenzaId);
      formData.set("attivo", String(!attivo));
      const result = await toggleRicorrenzaAttiva(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          attivo
            ? "rounded-xl bg-destructive px-3 py-2 font-bold text-white disabled:opacity-50"
            : "rounded-xl bg-amber-400 px-3 py-2 font-bold text-foreground disabled:opacity-50"
        }
      >
        {isPending ? "..." : attivo ? "Disattiva" : "Riattiva"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
