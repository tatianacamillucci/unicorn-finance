"use client";

import { useState, useTransition } from "react";
import { deleteCategoria } from "@/app/actions/categorie";

export function DeleteCategoriaButton({ categoriaId }: { categoriaId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = confirm(
      "Eliminare questa categoria cancellerà anche tutti i movimenti collegati. Continuare?"
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", categoriaId);
      const result = await deleteCategoria(formData);
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
        className="rounded-xl bg-destructive px-3 py-2 font-bold text-white disabled:opacity-50"
      >
        {isPending ? "Eliminazione..." : "Elimina"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
