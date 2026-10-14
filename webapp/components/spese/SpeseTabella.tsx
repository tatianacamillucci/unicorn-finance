"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatData, formatEuro, selectClass } from "@/components/clienti/format";
import { segnaSpesaPagata } from "@/app/actions/spese";
import type { Spesa } from "@/lib/types/gestionale";

const COLONNE: Colonna[] = [
  { key: "data", header: "Data" },
  { key: "fornitore", header: "Fornitore", primaria: true },
  { key: "descrizione", header: "Descrizione", nascondiMobile: true },
  { key: "categoria", header: "Categoria" },
  { key: "importo", header: "Importo", align: "right" },
  { key: "stato", header: "Stato" },
  { key: "azioni", header: "" },
];

function SegnaPagata({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [errore, setErrore] = React.useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("id", id);
            const res = await segnaSpesaPagata(fd);
            if (res?.error) setErrore(res.error);
            else {
              setErrore(null);
              router.refresh();
            }
          })
        }
      >
        {pending ? "Un attimo..." : "Segna pagata"}
      </Button>
      {errore && (
        <span role="alert" className="max-w-48 text-right text-xs text-destructive">
          {errore}
        </span>
      )}
    </span>
  );
}

export function SpeseTabella({ spese, categorie }: { spese: Spesa[]; categorie: string[] }) {
  const [categoria, setCategoria] = React.useState("");
  const [stato, setStato] = React.useState("");

  const filtrate = spese.filter(
    (s) =>
      (!categoria || (s.categoria ?? "Altro") === categoria) &&
      (!stato || (stato === "pagata" ? s.pagata : !s.pagata)),
  );

  const righe: RigaTabella[] = filtrate.map((s) => ({
    id: s.id,
    celle: {
      data: formatData(s.data),
      fornitore: s.fornitore,
      descrizione: s.descrizione ?? "",
      categoria: s.categoria ?? "Altro",
      importo: formatEuro(s.importo),
      stato: <StatusBadge tipo="spesa" stato={s.pagata ? "pagata" : "da_pagare"} />,
      azioni: s.pagata ? "" : <SegnaPagata id={s.id} />,
    },
    ricerca: `${s.fornitore} ${s.descrizione ?? ""} ${s.categoria ?? ""}`,
  }));

  const totale = filtrate.reduce((t, s) => t + s.importo, 0);

  const toolbar = (
    <>
      <select
        aria-label="Filtra per categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className={`${selectClass} w-auto`}
      >
        <option value="">Tutte le categorie</option>
        {categorie.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtra per stato"
        value={stato}
        onChange={(e) => setStato(e.target.value)}
        className={`${selectClass} w-auto`}
      >
        <option value="">Tutti gli stati</option>
        <option value="pagata">Pagate</option>
        <option value="da_pagare">Da pagare</option>
      </select>
    </>
  );

  return (
    <DataTable
      titolo="Le tue spese"
      colonne={COLONNE}
      righe={righe}
      toolbar={toolbar}
      segnapostoRicerca="Cerca fornitore o descrizione..."
      totale={{ fornitore: "Totale", importo: formatEuro(totale) }}
      vuoto="Non hai ancora registrato spese."
    />
  );
}
