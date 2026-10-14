"use client";

import * as React from "react";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabsFiltro } from "@/components/clienti/filtri";
import { formatData, formatEuro, statoFatturaMostrato } from "@/components/clienti/format";
import type { Fattura, Incasso, Preventivo } from "@/lib/types/gestionale";

const COL_PREV: Colonna[] = [
  { key: "numero", header: "Numero", primaria: true },
  { key: "data", header: "Data" },
  { key: "descrizione", header: "Descrizione", nascondiMobile: true },
  { key: "importo", header: "Importo", align: "right" },
  { key: "stato", header: "Stato" },
];

const COL_FATT: Colonna[] = [
  { key: "numero", header: "Numero", primaria: true },
  { key: "data", header: "Data" },
  { key: "descrizione", header: "Descrizione", nascondiMobile: true },
  { key: "totale", header: "Totale", align: "right" },
  { key: "stato", header: "Stato" },
];

const COL_INC: Colonna[] = [
  { key: "data", header: "Data", primaria: true },
  { key: "fattura", header: "Fattura" },
  { key: "importo", header: "Importo", align: "right" },
  { key: "tasse", header: "Tasse da mettere da parte", align: "right", nascondiMobile: true },
  { key: "stato", header: "Stato" },
];

/** Schede Preventivi / Fatture / Incassi di un cliente. */
export function ClienteTabs({
  preventivi,
  fatture,
  incassi,
  oggi,
}: {
  preventivi: Preventivo[];
  fatture: Fattura[];
  incassi: Incasso[];
  oggi: string;
}) {
  const [tab, setTab] = React.useState("fatture");

  const righePrev: RigaTabella[] = preventivi.map((p) => ({
    id: p.id,
    href: `/preventivi/${p.id}`,
    celle: {
      numero: p.numero ?? "—",
      data: formatData(p.data),
      descrizione: <span className="line-clamp-1 max-w-[18rem]">{p.descrizione}</span>,
      importo: formatEuro(p.importo),
      stato: <StatusBadge tipo="preventivo" stato={p.stato} />,
    },
  }));

  const righeFatt: RigaTabella[] = fatture.map((f) => ({
    id: f.id,
    href: `/fatture/${f.id}`,
    celle: {
      numero: f.numero ?? "Bozza",
      data: f.data_emissione ? formatData(f.data_emissione) : "—",
      descrizione: <span className="line-clamp-1 max-w-[18rem]">{f.descrizione}</span>,
      totale: <strong>{formatEuro(f.importo + f.bollo)}</strong>,
      stato: <StatusBadge tipo="fattura" stato={statoFatturaMostrato(f, oggi)} />,
    },
  }));

  const numeroFattura = new Map(fatture.map((f) => [f.id, f.numero ?? "Bozza"]));
  const righeInc: RigaTabella[] = incassi.map((i) => ({
    id: i.id,
    href: i.fattura_id ? `/fatture/${i.fattura_id}` : undefined,
    celle: {
      data: formatData(i.data),
      fattura: i.fattura_id ? (numeroFattura.get(i.fattura_id) ?? "—") : "—",
      importo: <strong>{formatEuro(i.importo)}</strong>,
      tasse: formatEuro(i.accantonamento_imposta + i.accantonamento_inps),
      stato: <StatusBadge tipo="incasso" stato={i.spostato ? "spostato" : "da_spostare"} />,
    },
  }));

  return (
    <div className="flex flex-col gap-3">
      <TabsFiltro
        etichetta="Documenti del cliente"
        attivo={tab}
        onChange={setTab}
        tabs={[
          { id: "preventivi", label: "Preventivi", count: preventivi.length },
          { id: "fatture", label: "Fatture", count: fatture.length },
          { id: "incassi", label: "Incassi", count: incassi.length },
        ]}
      />
      {tab === "preventivi" && (
        <DataTable colonne={COL_PREV} righe={righePrev} ricercabile={false} vuoto="Nessun preventivo per questo cliente." />
      )}
      {tab === "fatture" && (
        <DataTable colonne={COL_FATT} righe={righeFatt} ricercabile={false} vuoto="Nessuna fattura per questo cliente." />
      )}
      {tab === "incassi" && (
        <DataTable colonne={COL_INC} righe={righeInc} ricercabile={false} vuoto="Nessun incasso da questo cliente." />
      )}
    </div>
  );
}
