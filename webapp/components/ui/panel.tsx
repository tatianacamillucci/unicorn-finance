import * as React from "react";
import { cn } from "@/lib/utils";

export const PASTEL_COLORS = [
  "rosa",
  "pesca",
  "giallo",
  "menta",
  "azzurro",
  "lilla",
] as const;
export type PastelColor = (typeof PASTEL_COLORS)[number];

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title" | "color"> {
  /** Colore del bordo. Se omesso: ruota in automatico (per `index`, altrimenti per posizione tra i fratelli). */
  color?: PastelColor;
  /** Posizione nella lista, per ruotare i colori a mano. */
  index?: number;
  title?: React.ReactNode;
  /** Pulsanti/azioni a destra del titolo. */
  actions?: React.ReactNode;
}

/** "Finestra" con bordo pastello. Server Component compatibile. */
export function Panel({
  color,
  index,
  title,
  actions,
  className,
  children,
  ...props
}: PanelProps) {
  const resolved =
    color ?? (index !== undefined ? PASTEL_COLORS[Math.abs(index) % PASTEL_COLORS.length] : undefined);

  return (
    <section
      data-color={resolved}
      className={cn("pastel-box rounded-2xl bg-card p-4 text-card-foreground lg:p-5", className)}
      {...props}
    >
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : <span />}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
