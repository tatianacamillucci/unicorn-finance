import * as React from "react";
import { cn } from "@/lib/utils";
import type { PastelColor } from "@/components/ui/panel";

export type TipoBadge = "fattura" | "preventivo" | "incasso" | "spesa";

const CONFIG: Record<TipoBadge, Record<string, { label: string; color: PastelColor }>> = {
  fattura: {
    da_emettere: { label: "Da emettere", color: "giallo" },
    emessa: { label: "Emessa", color: "azzurro" },
    incassata: { label: "Incassata", color: "menta" },
    scaduta: { label: "Scaduta", color: "rosa" },
  },
  preventivo: {
    bozza: { label: "Bozza", color: "lilla" },
    inviato: { label: "Inviato", color: "azzurro" },
    accettato: { label: "Accettato", color: "menta" },
    rifiutato: { label: "Rifiutato", color: "rosa" },
  },
  incasso: {
    da_spostare: { label: "Da spostare", color: "pesca" },
    spostato: { label: "Spostato", color: "menta" },
  },
  spesa: {
    pagata: { label: "Pagata", color: "menta" },
    da_pagare: { label: "Da pagare", color: "pesca" },
  },
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tipo: TipoBadge;
  /** fattura: da_emettere | emessa | incassata | scaduta; preventivo: bozza | inviato | accettato | rifiutato;
   *  incasso: da_spostare | spostato; spesa: pagata | da_pagare. */
  stato: string;
}

/** Badge pastello per gli stati. Server Component compatibile; leggibile in light e dark. */
export function StatusBadge({ tipo, stato, className, ...props }: StatusBadgeProps) {
  const c = CONFIG[tipo][stato] ?? { label: stato, color: "lilla" as PastelColor };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground",
        className,
      )}
      style={{
        borderColor: `var(--pastel-${c.color})`,
        backgroundColor: `color-mix(in srgb, var(--pastel-${c.color}) 28%, transparent)`,
      }}
      {...props}
    >
      {c.label}
    </span>
  );
}
