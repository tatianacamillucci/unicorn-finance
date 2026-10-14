"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { NuovoPreventivoForm } from "@/components/preventivi/forms";
import { SelectCliente, TabsFiltro } from "@/components/clienti/filtri";
import { ETICHETTE_PREVENTIVO, STATI_PREVENTIVO, formatData, formatEuro } from "@/components/clienti/format";
import type { PreventivoRiga } from "@/lib/preventivi-data";
import type { Servizio } from "@/lib/types/gestionale";

const COLONNE: Colonna[] = [
  { key: "numero", header: "Numero", primaria: true },
  { key: "data", header: "Data" },
  { key: "cliente", header: "Cliente" },
  { key: "importo", header: "Importo", align: "right" },
  { key: "validita", header: "Validità" },
  { key: "stato", header: "Stato" },
];

export function PreventiviLista({
  preventivi,
  clienti,
  servizi,
  apriNuovo,
  clienteIniziale,
}: {
  preventivi: PreventivoRiga[];
  clienti: { id: string; nome: string }[];
  servizi: Servizio[];
  apriNuovo?: boolean;
  clienteIniziale?: string;
}) {
  const [tab, setTab] = React.useState("tutti");
  const [cliente, setCliente] = React.useState("");
  const [nuovo, setNuovo] = React.useState(!!apriNuovo);

  const perCliente = cliente ? preventivi.filter((p) => p.cliente_id === cliente) : preventivi;
  const visibili = tab === "tutti" ? perCliente : perCliente.filter((p) => p.stato === tab);

  const righe: RigaTabella[] = visibili.map((p) => ({
    id: p.id,
    href: `/preventivi/${p.id}`,
    ricerca: `${p.numero ?? ""} ${p.cliente_nome} ${p.descrizione} ${ETICHETTE_PREVENTIVO[p.stato]}`,
    celle: {
      numero: p.numero ?? "—",
      data: formatData(p.data),
      cliente: p.cliente_nome,
      importo: <strong>{formatEuro(p.importo)}</strong>,
      validita: p.validita ? formatData(p.validita) : "—",
      stato: <StatusBadge tipo="preventivo" stato={p.stato} />,
    },
  }));

  return (
    <div className="flex flex-col gap-4">
      {nuovo && (
        <Panel title="Nuovo preventivo">
          <NuovoPreventivoForm
            clienti={clienti}
            servizi={servizi}
            clienteId={clienteIniziale}
            onFatto={() => setNuovo(false)}
          />
        </Panel>
      )}
      <TabsFiltro
        etichetta="Stato preventivi"
        attivo={tab}
        onChange={setTab}
        tabs={[
          { id: "tutti", label: "Tutti", count: perCliente.length },
          ...STATI_PREVENTIVO.map((s) => ({
            id: s,
            label: ETICHETTE_PREVENTIVO[s],
            count: perCliente.filter((p) => p.stato === s).length,
          })),
        ]}
      />
      <DataTable
        titolo="Preventivi"
        colonne={COLONNE}
        righe={righe}
        segnapostoRicerca="Cerca numero, cliente, descrizione..."
        vuoto="Nessun preventivo qui. Premi «Nuovo preventivo» per crearne uno."
        toolbar={<SelectCliente clienti={clienti} valore={cliente} onChange={setCliente} />}
        azioni={
          <Button type="button" size="sm" onClick={() => setNuovo((v) => !v)}>
            {nuovo ? "Chiudi" : "Nuovo preventivo"}
          </Button>
        }
      />
    </div>
  );
}
