"use client";

import { PieChart, Pie, Cell } from "recharts";
import type { CategoryBudgetDetail } from "@/lib/budget-data";

function formatData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function formatImporto(importo: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(importo);
}

export function CategoryPieCard({ detail }: { detail: CategoryBudgetDetail }) {
  const rimanenteClamped = Math.max(detail.rimanente, 0);
  const speso = Math.max(detail.speso, 0);
  const data =
    speso === 0 && rimanenteClamped === 0
      ? [{ name: "vuoto", value: 1, color: "hsl(var(--muted))" }]
      : [
          { name: "speso", value: speso, color: detail.colore_hex },
          { name: "rimanente", value: rimanenteClamped, color: "hsl(var(--muted))" },
        ];

  const isOverBudget = detail.rimanente < 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl pastel-box bg-card text-card-foreground p-4">
      <div className="flex items-center gap-4">
        <div className="relative flex shrink-0 items-center justify-center">
          <PieChart width={90} height={90}>
            <Pie data={data} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={1.5} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-base leading-none">{detail.emoji}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-black uppercase text-foreground">{detail.nome}</span>
          <span className="text-xs font-bold text-muted-foreground">
            €{detail.speso.toFixed(0)} / €{detail.budget.toFixed(0)}
          </span>
          <span
            className={`text-xs font-bold ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}
          >
            {isOverBudget
              ? `Sforato di €${Math.abs(detail.rimanente).toFixed(0)}`
              : `Rimangono €${detail.rimanente.toFixed(0)}`}
          </span>
        </div>
      </div>

      {detail.movimenti.length === 0 ? (
        <p className="text-xs font-bold text-muted-foreground">Nessuna spesa questo mese.</p>
      ) : (
        <ul className="flex flex-col gap-2 border-t border-border pt-2">
          {detail.movimenti.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {m.luogo ? m.luogo : "—"} · {formatData(m.data)}
              </span>
              <span className="font-bold text-foreground">{formatImporto(m.importo)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
