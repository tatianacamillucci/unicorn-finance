"use client";

import * as React from "react";
import { selectClass } from "@/components/clienti/format";

export interface TabFiltro {
  id: string;
  label: string;
  count: number;
}

/** Schede di filtro (pillole) con contatore. */
export function TabsFiltro({
  tabs,
  attivo,
  onChange,
  etichetta,
}: {
  tabs: TabFiltro[];
  attivo: string;
  onChange: (id: string) => void;
  etichetta: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={etichetta}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={attivo === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full border px-3 py-1 text-sm ${
            attivo === t.id ? "border-foreground font-semibold" : "border-border text-muted-foreground"
          }`}
        >
          {t.label} ({t.count})
        </button>
      ))}
    </div>
  );
}

export function SelectCliente({
  clienti,
  valore,
  onChange,
}: {
  clienti: { id: string; nome: string }[];
  valore: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      aria-label="Filtra per cliente"
      value={valore}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClass} max-w-[14rem]`}
    >
      <option value="">Tutti i clienti</option>
      {clienti.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nome}
        </option>
      ))}
    </select>
  );
}
