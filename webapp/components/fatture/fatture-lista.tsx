"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { NuovaFatturaForm } from "@/components/fatture/forms";
import { SelectCliente, TabsFiltro } from "@/components/clienti/filtri";
import {
  formatData,
  formatEuro,
  scadenzaFattura,
  statoFatturaMostrato,
} from "@/components/clienti/format";
import type { FatturaRiga } from "@/lib/fatture-data";
import type { Servizio } from "@/lib/types/gestionale";

const COLONNE: Colonna[] = [
  { key: "numero", header: "Numero", primaria: true },
  { key: "data", header: "Data" },
  { key: "cliente", header: "Cliente" },
  { key: "descrizione", header: "Descrizione", nascondiMobile: true },
  { key: "importo", header: "Importo", align: "right", nascondiMobile: true },
  { key: "bollo", header: "Bollo", align: "right", nascondiMobile: true },
  { key: "totale", header: "Totale", align: "right" },
  { key: "scadenza", header: "Scadenza" },
  { key: "stato", header: "Stato" },
];

const TABS = [
  { id: "tutte", label: "Tutte" },
  { id: "da_emettere", label: "Da emettere" },
  { id: "emessa", label: "Emesse" },
  { id: "scaduta", label: "Scadute" },
  { id: "incassata", label: "Incassate" },
];

export function FattureLista({
  fatture,
  clienti,
  servizi,
  oggi,
  apriNuova,
  clienteIniziale,
}: {
  fatture: FatturaRiga[];
  clienti: { id: string; nome: string }[];
  servizi: Servizio[];
  oggi: string;
  apriNuova?: boolean;
  clienteIniziale?: string;
}) {
  const [tab, setTab] = React.useState("tutte");
  const [cliente, setCliente] = React.useState("");
  const [nuova, setNuova] = React.useState(!!apriNuova);

  const conStato = fatture.map((f) => ({ f, stato: statoFatturaMostrato(f, oggi) }));
  const perCliente = cliente ? conStato.filter((x) => x.f.cliente_id === cliente) : conStato;
  const visibili = tab === "tutte" ? perCliente : perCliente.filter((x) => x.stato === tab);

  const righe: RigaTabella[] = visibili.map(({ f, stato }) => {
    const scad = scadenzaFattura(f);
    return {
      id: f.id,
      href: `/fatture/${f.id}`,
      ricerca: `${f.numero ?? ""} ${f.cliente_nome} ${f.descrizione} ${stato}`,
      celle: {
        numero: f.numero ?? "Bozza",
        data: f.data_emissione ? formatData(f.data_emissione) : "—",
        cliente: f.cliente_nome,
        descrizione: <span className="line-clamp-1 max-w-[16rem]">{f.descrizione}</span>,
        importo: formatEuro(f.importo),
        bollo: f.bollo > 0 ? formatEuro(f.bollo) : "—",
        totale: <strong>{formatEuro(f.importo + f.bollo)}</strong>,
        scadenza: scad ? formatData(scad) : "—",
        stato: <StatusBadge tipo="fattura" stato={stato} />,
      },
    };
  });

  const somma = (k: "importo" | "bollo") => visibili.reduce((t, x) => t + x.f[k], 0);
  const totale = {
    numero: `${visibili.length} fatture`,
    importo: formatEuro(somma("importo")),
    bollo: formatEuro(somma("bollo")),
    totale: formatEuro(somma("importo") + somma("bollo")),
  };

  return (
    <div className="flex flex-col gap-4">
      {nuova && (
        <Panel title="Nuova fattura">
          <NuovaFatturaForm
            clienti={clienti}
            servizi={servizi}
            clienteId={clienteIniziale}
            onFatto={() => setNuova(false)}
          />
        </Panel>
      )}
      <TabsFiltro
        etichetta="Stato fatture"
        attivo={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({
          ...t,
          count: (t.id === "tutte" ? perCliente : perCliente.filter((x) => x.stato === t.id)).length,
        }))}
      />
      <DataTable
        titolo="Fatture"
        colonne={COLONNE}
        righe={righe}
        totale={righe.length > 0 ? totale : undefined}
        segnapostoRicerca="Cerca numero, cliente, descrizione..."
        vuoto="Nessuna fattura qui. Premi “Nuova fattura” per crearne una."
        toolbar={<SelectCliente clienti={clienti} valore={cliente} onChange={setCliente} />}
        azioni={
          <Button type="button" size="sm" onClick={() => setNuova((v) => !v)}>
            {nuova ? "Chiudi" : "Nuova fattura"}
          </Button>
        }
      />
    </div>
  );
}
