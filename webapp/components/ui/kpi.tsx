import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Panel, type PastelColor } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  /** Già formattato (es. "12.450,00 €"). */
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** Variazione in percentuale rispetto al periodo prima (es. 12.5 = +12,5%). */
  variazione?: number;
  /** Testo dopo la variazione (default "rispetto a prima"). */
  variazioneEtichetta?: string;
  /** true = salire è un male (es. spese). */
  invertita?: boolean;
  color?: PastelColor;
  index?: number;
  className?: string;
}

/** Riquadro numero grande + etichetta + sottotesto + variazione opzionale. Server Component compatibile. */
export function Kpi({
  label,
  value,
  sub,
  variazione,
  variazioneEtichetta = "rispetto a prima",
  invertita,
  color,
  index,
  className,
}: KpiProps) {
  const su = (variazione ?? 0) >= 0;
  const buono = invertita ? !su : su;
  return (
    <Panel color={color} index={index} className={cn("flex flex-col gap-1", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      {variazione !== undefined && (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            buono ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          )}
        >
          {su ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {su ? "+" : ""}
          {variazione.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%
          <span className="font-normal text-muted-foreground">{variazioneEtichetta}</span>
        </p>
      )}
    </Panel>
  );
}
