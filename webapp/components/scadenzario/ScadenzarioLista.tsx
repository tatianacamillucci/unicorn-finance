"use client";

import * as React from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

export interface VoceLista {
  id: string;
  data: string;
  tipo: "incasso" | "pagamento" | "fisco";
  titolo: string;
  sotto: string;
  importo: number | null;
  scaduta: boolean;
  href?: string;
}

type Filtro = "tutto" | "incasso" | "pagamento" | "fisco";
const FILTRI: { id: Filtro; label: string }[] = [
  { id: "tutto", label: "Tutto" },
  { id: "incasso", label: "Da incassare" },
  { id: "pagamento", label: "Da pagare" },
  { id: "fisco", label: "Fisco" },
];
const ETICHETTA = { incasso: "Entra", pagamento: "Esce", fisco: "Fisco" } as const;
const COLORE = { incasso: "menta", pagamento: "pesca", fisco: "azzurro" } as const;

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const mese = (iso: string) => {
  const t = new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const giorno = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });

export function ScadenzarioLista({ voci, oggi }: { voci: VoceLista[]; oggi: string }) {
  const [filtro, setFiltro] = React.useState<Filtro>("tutto");
  const visibili = voci.filter((v) => filtro === "tutto" || v.tipo === filtro);
  const gruppi = new Map<string, VoceLista[]>();
  for (const v of visibili) {
    const k = v.data.slice(0, 7);
    gruppi.set(k, [...(gruppi.get(k) ?? []), v]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filtra" className="flex flex-wrap gap-2">
        {FILTRI.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={cn(
              "rounded-full border-2 px-4 py-1 text-sm",
              filtro === f.id
                ? "border-foreground bg-foreground font-semibold text-background"
                : "border-foreground/30 hover:border-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibili.length === 0 ? (
        <Panel>
          <p className="text-base">Niente da mostrare qui. Tutto a posto!</p>
        </Panel>
      ) : (
        [...gruppi.entries()].map(([k, lista], idx) => (
          <Panel key={k} index={idx} title={mese(lista[0].data)}>
            <ul className="flex flex-col divide-y divide-foreground/10">
              {lista.map((v) => {
                const corpo = (
                  <div className="flex items-start gap-3 py-3">
                    <div className="w-14 shrink-0 text-sm font-semibold capitalize">{giorno(v.data)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{v.titolo}</p>
                      <p className="text-sm text-muted-foreground">{v.sotto}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span
                          className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            borderColor: `var(--pastel-${COLORE[v.tipo]})`,
                            backgroundColor: `color-mix(in srgb, var(--pastel-${COLORE[v.tipo]}) 28%, transparent)`,
                          }}
                        >
                          {ETICHETTA[v.tipo]}
                        </span>
                        {v.scaduta && (
                          <span
                            className="rounded-full border px-2 py-0.5 text-xs font-bold"
                            style={{
                              borderColor: "var(--pastel-rosa)",
                              backgroundColor: "color-mix(in srgb, var(--pastel-rosa) 45%, transparent)",
                            }}
                          >
                            In ritardo
                          </span>
                        )}
                        {v.data === oggi && (
                          <span className="rounded-full border border-foreground/40 px-2 py-0.5 text-xs">Oggi</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-bold tabular-nums">
                      {v.importo === null ? (
                        <span className="text-xs font-normal text-muted-foreground">da calcolare</span>
                      ) : (
                        <>
                          {v.tipo === "incasso" ? "+" : "-"}
                          {euro.format(v.importo)}
                        </>
                      )}
                    </div>
                  </div>
                );
                return (
                  <li key={v.id} className={v.scaduta ? "bg-[color-mix(in_srgb,var(--pastel-rosa)_12%,transparent)]" : undefined}>
                    {v.href ? (
                      <Link href={v.href} className="block hover:opacity-80">
                        {corpo}
                      </Link>
                    ) : (
                      corpo
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))
      )}
    </div>
  );
}
