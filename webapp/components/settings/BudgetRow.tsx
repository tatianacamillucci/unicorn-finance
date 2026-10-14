"use client";

import { useRef, useState, useTransition } from "react";
import { deleteBudget, upsertBudget } from "@/app/actions/budget";

export function BudgetRow({
  categoriaId,
  nome,
  emoji,
  currentBudget,
}: {
  categoriaId: string;
  nome: string;
  emoji: string;
  currentBudget: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertBudget(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoria_id", categoriaId);
      const result = await deleteBudget(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 rounded-2xl pastel-box bg-card text-card-foreground p-4">
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
            {emoji}
          </span>
          <p className="font-black">{nome}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="hidden" name="categoria_id" value={categoriaId} />
          <input
            name="importo"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            defaultValue={currentBudget ?? ""}
            className="w-24 border border-input bg-background text-foreground rounded-xl p-2 text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-primary px-3 py-2 font-bold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "..." : "Salva"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-between">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {currentBudget != null && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="ml-auto text-xs font-bold text-destructive underline disabled:opacity-50"
          >
            Rimuovi budget
          </button>
        )}
      </div>
    </div>
  );
}
