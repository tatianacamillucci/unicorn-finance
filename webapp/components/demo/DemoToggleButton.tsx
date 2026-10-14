"use client";

import * as React from "react";
import { attivaDemo, disattivaDemo } from "@/app/actions/demo";
import { cn } from "@/lib/utils";

interface Props {
  /** "attiva" imposta il cookie demo=1; "disattiva" lo toglie. */
  azione: "attiva" | "disattiva";
  children: React.ReactNode;
  className?: string;
}

export function DemoToggleButton({ azione, children, className }: Props) {
  const [pending, start] = React.useTransition();
  const [errore, setErrore] = React.useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await (azione === "attiva" ? attivaDemo() : disattivaDemo());
            setErrore(res.error ?? null);
          })
        }
        className={cn(
          "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60",
          className,
        )}
      >
        {pending ? "Un attimo..." : children}
      </button>
      {errore && <span className="text-xs text-destructive">{errore}</span>}
    </span>
  );
}
