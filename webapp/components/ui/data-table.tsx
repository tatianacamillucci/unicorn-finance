"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

export interface Colonna {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Colonna "titolo": su mobile è il titolo della scheda (di default la prima colonna). */
  primaria?: boolean;
  /** Nascondi su mobile (nelle schede). */
  nascondiMobile?: boolean;
}

export interface RigaTabella {
  id: string;
  /** Se presente la riga è cliccabile. */
  href?: string;
  /** Valori già pronti da mostrare (testo o elementi, es. <StatusBadge/>), per chiave di colonna. */
  celle: Record<string, React.ReactNode>;
  /** Testo su cui cerca la barra di ricerca (es. "Panificio Del Porto 3/2026 incassata"). */
  ricerca?: string;
}

interface DataTableProps {
  colonne: Colonna[];
  righe: RigaTabella[];
  /** Mostra la barra di ricerca (default true se ci sono righe con `ricerca`). */
  ricercabile?: boolean;
  segnapostoRicerca?: string;
  /** Riga di totale in fondo: celle per chiave di colonna. */
  totale?: Record<string, React.ReactNode>;
  vuoto?: React.ReactNode;
  titolo?: React.ReactNode;
  /** Azioni nell'intestazione del Panel (es. pulsante "Nuova fattura"). */
  azioni?: React.ReactNode;
  /** Elementi extra accanto alla ricerca (es. filtri). */
  toolbar?: React.ReactNode;
  color?: React.ComponentProps<typeof Panel>["color"];
  index?: number;
}

/**
 * Tabella responsive: su desktop tabella, su mobile lista a schede.
 * Contenitore Panel con bordo pastello. Client Component: i dati arrivano già come ReactNode (serializzabili
 * dai Server Component, niente funzioni nelle props).
 */
export function DataTable({
  colonne,
  righe,
  ricercabile,
  segnapostoRicerca = "Cerca...",
  totale,
  vuoto = "Non c'è ancora niente qui.",
  titolo,
  azioni,
  toolbar,
  color,
  index,
}: DataTableProps) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const mostraRicerca = ricercabile ?? righe.some((r) => r.ricerca);
  const filtro = q.trim().toLowerCase();
  const visibili = filtro ? righe.filter((r) => (r.ricerca ?? "").toLowerCase().includes(filtro)) : righe;
  const primaria = colonne.find((c) => c.primaria) ?? colonne[0];
  const altre = colonne.filter((c) => c !== primaria && !c.nascondiMobile);

  return (
    <Panel title={titolo} actions={azioni} color={color} index={index} className="flex flex-col gap-3">
      {(mostraRicerca || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {mostraRicerca && (
            <label className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={segnapostoRicerca}
                aria-label="Cerca"
                className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              />
            </label>
          )}
          {toolbar}
        </div>
      )}

      {visibili.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{filtro ? "Nessun risultato." : vuoto}</p>
      ) : (
        <>
          {/* Desktop: tabella */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {colonne.map((c) => (
                    <th key={c.key} className={cn("px-3 py-2 font-medium", c.align === "right" && "text-right")}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibili.map((r) => (
                  <tr
                    key={r.id}
                    onClick={r.href ? () => router.push(r.href as string) : undefined}
                    className={cn(r.href && "cursor-pointer hover:bg-accent/50")}
                  >
                    {colonne.map((c, i) => (
                      <td
                        key={c.key}
                        className={cn("px-3 py-2.5 align-middle", c.align === "right" && "text-right tabular-nums")}
                      >
                        {r.href && i === 0 ? (
                          <Link
                            href={r.href}
                            className="font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.celle[c.key]}
                          </Link>
                        ) : (
                          r.celle[c.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {totale && (
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    {colonne.map((c) => (
                      <td key={c.key} className={cn("px-3 py-2.5", c.align === "right" && "text-right tabular-nums")}>
                        {totale[c.key]}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Mobile: schede */}
          <ul className="flex flex-col gap-2 md:hidden">
            {visibili.map((r) => {
              const corpo = (
                <>
                  <span className="block font-medium">{r.celle[primaria.key]}</span>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 text-sm">
                    {altre.map((c) => (
                      <React.Fragment key={c.key}>
                        <dt className="text-muted-foreground">{c.header}</dt>
                        <dd className="text-right tabular-nums">{r.celle[c.key]}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </>
              );
              return (
                <li key={r.id} className="rounded-xl border p-3">
                  {r.href ? (
                    <Link href={r.href} className="block">
                      {corpo}
                    </Link>
                  ) : (
                    corpo
                  )}
                </li>
              );
            })}
            {totale && (
              <li className="rounded-xl border-2 p-3">
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm font-semibold">
                  {colonne
                    .filter((c) => totale[c.key] !== undefined && totale[c.key] !== null)
                    .map((c) => (
                      <React.Fragment key={c.key}>
                        <dt>{c.key === primaria.key ? "" : c.header}</dt>
                        <dd className="text-right tabular-nums">{totale[c.key]}</dd>
                      </React.Fragment>
                    ))}
                </dl>
              </li>
            )}
          </ul>
        </>
      )}
    </Panel>
  );
}
