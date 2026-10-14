"use client";

import { PieChart, Pie, Cell } from "recharts";
import type { HomeCategorySummary } from "@/lib/home-data";

interface DonutSummaryProps {
  categories: HomeCategorySummary[];
  totalSpent: number;
  remaining: number;
  monthLabel: string;
}

export function DonutSummary({ categories, totalSpent, remaining, monthLabel }: DonutSummaryProps) {
  const data = categories
    .filter((c) => c.speso > 0)
    .map((c) => ({ name: c.nome, value: c.speso, color: c.colore_hex }));

  return (
    <div className="relative flex items-center justify-center">
      <PieChart width={220} height={220}>
        <Pie data={data} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">Progresso mese</span>
        <span className="text-lg font-black">{monthLabel}</span>
        <span className="text-xs">SPESO: €{totalSpent.toFixed(0)}</span>
        <span className="text-xs">RIMANENTE: €{remaining.toFixed(0)}</span>
      </div>
    </div>
  );
}
