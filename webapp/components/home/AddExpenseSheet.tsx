"use client";

import { useEffect, useState } from "react";
import { addExpense } from "@/app/actions/add-expense";

interface Option {
  id: string;
  nome: string;
  emoji?: string;
  tipo: "entrata" | "uscita";
}

interface ContoOption {
  id: string;
  nome: string;
}

interface AddExpenseSheetProps {
  categorie: Option[];
  conti: ContoOption[];
}

export function AddExpenseSheet({ categorie, conti }: AddExpenseSheetProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"entrata" | "uscita">("uscita");

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleSubmit(formData: FormData) {
    const result = await addExpense(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setOpen(false);
  }

  const categorieFiltrate = categorie.filter((c) => c.tipo === tipo);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground text-2xl font-black"
        aria-label="Aggiungi movimento"
      >
        +
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
              <h2 className="font-black text-lg">Nuovo movimento</h2>
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

            <div className="flex rounded-xl overflow-hidden border border-input bg-background text-foreground">
              <button
                type="button"
                onClick={() => setTipo("uscita")}
                className={`flex-1 p-2 font-bold ${
                  tipo === "uscita" ? "bg-destructive text-white" : "bg-background text-foreground"
                }`}
              >
                Spesa
              </button>
              <button
                type="button"
                onClick={() => setTipo("entrata")}
                className={`flex-1 p-2 font-bold ${
                  tipo === "entrata" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                }`}
              >
                Entrata
              </button>
            </div>

            <input name="importo" type="number" step="0.01" placeholder="Importo" required className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            <select key={tipo} name="categoria_id" required className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Categoria</option>
              {categorieFiltrate.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>
              ))}
            </select>
            <select name="conto_id" required className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Conto</option>
              {conti.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <input name="luogo" type="text" placeholder="Luogo (opzionale)" className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            <input name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="border border-input bg-background text-foreground rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-input bg-background text-foreground p-2 font-bold">Annulla</button>
              <button type="submit" className="flex-1 rounded-xl bg-primary p-2 font-bold text-primary-foreground">Salva</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
