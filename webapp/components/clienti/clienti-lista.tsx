"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { NuovoClienteForm } from "@/components/clienti/forms";
import { formatEuro } from "@/components/clienti/format";
import type { ClienteElenco } from "@/lib/clienti-data";

const COLONNE: Colonna[] = [
  { key: "nome", header: "Nome", primaria: true },
  { key: "note", header: "Città / Note", nascondiMobile: true },
  { key: "fatturatoAnno", header: "Fatturato anno", align: "right" },
  { key: "daIncassare", header: "Da incassare", align: "right" },
  { key: "documenti", header: "N. documenti", align: "right" },
];

export function ClientiLista({ clienti }: { clienti: ClienteElenco[] }) {
  const [nuovo, setNuovo] = React.useState(false);

  const righe: RigaTabella[] = clienti.map((c) => ({
    id: c.id,
    href: `/clienti/${c.id}`,
    ricerca: `${c.nome} ${c.note ?? ""} ${c.email ?? ""} ${c.piva_cf ?? ""}`,
    celle: {
      nome: c.nome,
      note: <span className="line-clamp-1 max-w-[18rem] text-muted-foreground">{c.note || "—"}</span>,
      fatturatoAnno: formatEuro(c.fatturatoAnno),
      daIncassare: c.daIncassare > 0 ? <strong>{formatEuro(c.daIncassare)}</strong> : "—",
      documenti: c.nDocumenti,
    },
  }));

  const totale = {
    nome: `${clienti.length} clienti`,
    fatturatoAnno: formatEuro(clienti.reduce((t, c) => t + c.fatturatoAnno, 0)),
    daIncassare: formatEuro(clienti.reduce((t, c) => t + c.daIncassare, 0)),
    documenti: clienti.reduce((t, c) => t + c.nDocumenti, 0),
  };

  return (
    <div className="flex flex-col gap-4">
      {nuovo && (
        <Panel title="Nuovo cliente">
          <NuovoClienteForm />
        </Panel>
      )}
      <DataTable
        titolo="I tuoi clienti"
        colonne={COLONNE}
        righe={righe}
        totale={righe.length > 0 ? totale : undefined}
        segnapostoRicerca="Cerca un cliente..."
        vuoto="Non hai ancora clienti. Premi «Nuovo cliente» per aggiungere il primo."
        azioni={
          <Button type="button" size="sm" onClick={() => setNuovo((v) => !v)}>
            {nuovo ? "Chiudi" : "Nuovo cliente"}
          </Button>
        }
      />
    </div>
  );
}
