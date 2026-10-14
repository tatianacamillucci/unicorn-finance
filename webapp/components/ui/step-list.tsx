"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  /** Una sola frase, semplice. */
  testo: string;
  /** Importo da evidenziare in grassetto, gia' formattato (es. "199,44 €"). */
  importo?: string;
  fatto?: boolean;
}

interface StepListProps {
  steps: Step[];
  /**
   * Chiamata quando si preme "Fatto". Puo' essere una Server Action
   * (che deve fare getUser() e ricontrollare tutto lato server).
   * Se ritorna { error } lo step torna "da fare" e l'errore e' mostrato.
   */
  onDone?: (id: string) => void | { error?: string } | Promise<void | { error?: string }>;
  className?: string;
}

export function StepList({ steps, onDone, className }: StepListProps) {
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const [errore, setErrore] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleDone(id: string) {
    setErrore(null);
    setPending(id);
    setDone((d) => ({ ...d, [id]: true }));
    try {
      const res = await onDone?.(id);
      if (res && typeof res === "object" && res.error) {
        setDone((d) => ({ ...d, [id]: false }));
        setErrore(res.error);
      }
    } catch {
      setDone((d) => ({ ...d, [id]: false }));
      setErrore("Qualcosa non ha funzionato. Riprova.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={className}>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const isDone = step.fatto || done[step.id];
          return (
            <li key={step.id} className="flex items-center gap-4">
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold",
                  isDone ? "border-transparent bg-foreground text-background" : "border-foreground/30",
                )}
                aria-hidden
              >
                {isDone ? <Check className="h-6 w-6" /> : i + 1}
              </span>
              <p className={cn("flex-1 text-base", isDone && "text-muted-foreground line-through")}>
                {step.testo}
                {step.importo && <> <strong className="font-bold text-foreground">{step.importo}</strong></>}
              </p>
              {!isDone && (
                <button
                  type="button"
                  onClick={() => handleDone(step.id)}
                  disabled={pending === step.id}
                  className="shrink-0 rounded-full border-2 border-foreground/80 px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  Fatto ✓
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {errore && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {errore}
        </p>
      )}
    </div>
  );
}
