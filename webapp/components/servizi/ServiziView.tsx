"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Colonna, type RigaTabella } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionForm, Campo } from "@/components/clienti/action-form";
import { formatEuro, selectClass } from "@/components/clienti/format";
import { aggiornaServizio, creaServizio, impostaServizioAttivo } from "@/app/actions/servizi";
import type { Servizio } from "@/lib/types/gestionale";

const UNITA = ["una tantum", "mese", "ora", "giorno"] as const;

const COLONNE: Colonna[] = [
  { key: "nome", header: "Nome", primaria: true },
  { key: "descrizione", header: "Descrizione", nascondiMobile: true },
  { key: "prezzo", header: "Prezzo", align: "right" },
  { key: "unita", header: "Unità" },
  { key: "attivo", header: "Attivo" },
  { key: "azioni", header: "" },
];

function CampiServizio({ s }: { s?: Servizio }) {
  return (
    <>
      <Campo label="Nome (obbligatorio)">
        <Input name="nome" required maxLength={120} defaultValue={s?.nome ?? ""} />
      </Campo>
      <Campo label="Descrizione">
        <textarea
          name="descrizione"
          rows={3}
          maxLength={500}
          defaultValue={s?.descrizione ?? ""}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </Campo>
      <Campo label="Prezzo in euro">
        <Input
          name="prezzo"
          inputMode="decimal"
          required
          placeholder="es. 450"
          defaultValue={s ? String(s.prezzo).replace(".", ",") : ""}
        />
      </Campo>
      <Campo label="Unità">
        <select name="unita" defaultValue={s?.unita ?? "una tantum"} className={selectClass}>
          {UNITA.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Campo>
    </>
  );
}

function AttivaDisattiva({ s }: { s: Servizio }) {
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
            fd.set("id", s.id);
            fd.set("attivo", String(!s.attivo));
            const res = await impostaServizioAttivo(fd);
            if (res?.error) setErrore(res.error);
            else {
              setErrore(null);
              router.refresh();
            }
          })
        }
      >
        {s.attivo ? "Disattiva" : "Attiva"}
      </Button>
      {errore && (
        <span role="alert" className="max-w-48 text-right text-xs text-destructive">
          {errore}
        </span>
      )}
    </span>
  );
}

export function ServiziView({ servizi }: { servizi: Servizio[] }) {
  const router = useRouter();
  const [inModifica, setInModifica] = React.useState<Servizio | null>(null);

  const righe: RigaTabella[] = servizi.map((s) => ({
    id: s.id,
    celle: {
      nome: s.nome,
      descrizione: s.descrizione ?? "",
      prezzo: formatEuro(s.prezzo),
      unita: s.unita,
      attivo: s.attivo ? "Sì" : "No",
      azioni: (
        <span className="inline-flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setInModifica(s)}>
            Modifica
          </Button>
          <AttivaDisattiva s={s} />
        </span>
      ),
    },
    ricerca: `${s.nome} ${s.descrizione ?? ""}`,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="lg:col-span-2">
        <DataTable
          titolo="Il tuo listino"
          colonne={COLONNE}
          righe={righe}
          segnapostoRicerca="Cerca un servizio..."
          vuoto="Non hai ancora servizi nel listino. Aggiungi il primo."
        />
      </div>
      <Panel title={inModifica ? `Modifica: ${inModifica.nome}` : "Nuovo servizio"}>
        {inModifica ? (
          <ActionForm
            key={inModifica.id}
            action={async (fd) => {
              fd.set("id", inModifica.id);
              return aggiornaServizio(fd);
            }}
            onSuccess={() => {
              setInModifica(null);
              router.refresh();
            }}
            resetOnSuccess={false}
            submitLabel="Salva modifiche"
          >
            <CampiServizio s={inModifica} />
            <Button type="button" variant="outline" size="sm" onClick={() => setInModifica(null)}>
              Annulla
            </Button>
          </ActionForm>
        ) : (
          <ActionForm action={creaServizio} submitLabel="Aggiungi servizio" onSuccess={() => router.refresh()}>
            <CampiServizio />
          </ActionForm>
        )}
      </Panel>
    </div>
  );
}
