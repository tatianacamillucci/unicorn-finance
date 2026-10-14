"use client";

import { useRouter } from "next/navigation";
import type { FilterOption } from "@/lib/transazioni-data";

interface TransazioniFiltersProps {
  categorie: FilterOption[];
  conti: FilterOption[];
  categoriaId?: string;
  contoId?: string;
  month: string;
}

export function TransazioniFilters({ categorie, conti, categoriaId, contoId, month }: TransazioniFiltersProps) {
  const router = useRouter();

  function buildParams(overrides: { categoria?: string; conto?: string; mese?: string }) {
    const params = new URLSearchParams();
    const nextMese = overrides.mese ?? month;
    const nextCategoria = "categoria" in overrides ? overrides.categoria : categoriaId;
    const nextConto = "conto" in overrides ? overrides.conto : contoId;
    params.set("mese", nextMese);
    if (nextCategoria) params.set("categoria", nextCategoria);
    if (nextConto) params.set("conto", nextConto);
    return params.toString();
  }

  function updateParam(key: "categoria" | "conto", value: string) {
    router.push(`/transazioni?${buildParams({ [key]: value })}`);
  }

  function shiftMonth(delta: number) {
    const [year, monthNum] = month.split("-").map(Number);
    const d = new Date(year, monthNum - 1 + delta, 1);
    const nextMese = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/transazioni?${buildParams({ mese: nextMese })}`);
  }

  const [labelYear, labelMonthNum] = month.split("-").map(Number);
  const monthLabel = new Date(labelYear, labelMonthNum - 1, 1).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-full bg-muted px-4 py-2">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mese precedente">
          ‹
        </button>
        <span className="text-sm font-black uppercase">{monthLabel}</span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Mese successivo">
          ›
        </button>
      </div>
      <div className="flex gap-2">
        <select
          className="flex-1 rounded-full border border-input bg-background text-foreground px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
          value={categoriaId ?? ""}
          onChange={(e) => updateParam("categoria", e.target.value)}
        >
          <option value="">Tutte le categorie</option>
          {categorie.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji ? `${c.emoji} ` : ""}
              {c.nome}
            </option>
          ))}
        </select>
        <select
          className="flex-1 rounded-full border border-input bg-background text-foreground px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
          value={contoId ?? ""}
          onChange={(e) => updateParam("conto", e.target.value)}
        >
          <option value="">Tutti i conti</option>
          {conti.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
