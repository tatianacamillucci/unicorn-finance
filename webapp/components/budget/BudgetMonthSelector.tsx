"use client";

import Link from "next/link";

interface BudgetMonthSelectorProps {
  month: string; // "2026-07"
}

export function BudgetMonthSelector({ month }: BudgetMonthSelectorProps) {
  const [year, monthNum] = month.split("-").map(Number);
  const label = new Date(year, monthNum - 1, 1).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  function shiftedMonth(delta: number) {
    const d = new Date(year, monthNum - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="flex items-center justify-between rounded-full bg-muted px-4 py-2">
      <Link href={`/budget?month=${shiftedMonth(-1)}`} aria-label="Mese precedente">
        ‹
      </Link>
      <span className="font-black uppercase text-sm">{label}</span>
      <Link href={`/budget?month=${shiftedMonth(1)}`} aria-label="Mese successivo">
        ›
      </Link>
    </div>
  );
}
