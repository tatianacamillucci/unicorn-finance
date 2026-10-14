"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm, Campo } from "@/components/clienti/action-form";
import { aggiungiGiorni, oggiIso, selectClass, type EsitoConId } from "@/components/clienti/format";
import { RigheEditor } from "@/components/fatture/righe-editor";
import { oggiLocale } from "@/components/preventivi/forms";
import { creaFattura, duplicaFattura, segnaEmessa, segnaIncassata } from "@/app/actions/fatture";
import type { Servizio } from "@/lib/types/gestionale";

export function NuovaFatturaForm({
  clienti,
  servizi,
  clienteId,
  onFatto,
}: {
  clienti: { id: string; nome: string }[];
  servizi: Servizio[];
  clienteId?: string;
  /** Chiamata dopo il salvataggio, prima di aprire la fattura. */
  onFatto?: () => void;
}) {
  const router = useRouter();
  const nuovoId = React.useRef<string | null>(null);
  const [scadenza, setScadenza] = React.useState("");
  React.useEffect(() => setScadenza(aggiungiGiorni(oggiIso(), 30)), []);

  if (clienti.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Prima aggiungi un cliente nella pagina Clienti. Poi torna qui.
      </p>
    );
  }
  return (
    <ActionForm
      action={async (fd: FormData) => {
        const r: EsitoConId = await creaFattura(fd);
        nuovoId.current = r.id ?? null;
        return r;
      }}
      submitLabel="Salva la fattura da emettere"
      onSuccess={() => {
        onFatto?.();
        if (nuovoId.current) router.push(`/fatture/${nuovoId.current}`);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Cliente">
          <select name="cliente_id" required defaultValue={clienteId ?? ""} className={selectClass}>
            <option value="" disabled>
              Scegli un cliente
            </option>
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Scadenza pagamento">
          <Input name="scadenza" type="date" key={scadenza} defaultValue={scadenza} />
        </Campo>
      </div>
      <RigheEditor servizi={servizi} conBollo />
    </ActionForm>
  );
}

type Modo = null | "emessa" | "incassata";

export function FatturaAzioni({
  id,
  stato,
  importo,
}: {
  id: string;
  stato: "da_emettere" | "emessa" | "incassata";
  importo: number;
}) {
  const router = useRouter();
  const [modo, setModo] = React.useState<Modo>(null);
  const [oggi, setOggi] = React.useState("");
  React.useEffect(() => setOggi(oggiLocale()), []);

  if (stato === "incassata") return null;
  const target: Modo = stato === "da_emettere" ? "emessa" : "incassata";

  if (modo === null) {
    return (
      <Button type="button" size="sm" onClick={() => setModo(target)}>
        {target === "emessa" ? "Segna come emessa" : "Segna come incassata"}
      </Button>
    );
  }

  if (modo === "emessa") {
    return (
      <ActionForm
        action={async (fd) => {
          fd.set("id", id);
          return segnaEmessa(fd);
        }}
        onSuccess={() => {
          setModo(null);
          router.refresh();
        }}
        submitLabel="Fatto, è emessa"
        className="flex flex-col gap-3 rounded-md border border-input p-3"
      >
        <p className="text-sm text-muted-foreground">
          La fattura vera la emetti su Aruba: qui segni solo che l&apos;hai fatta.{" "}
          <a
            href="https://fatturazioneelettronica.aruba.it/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Apri Aruba
          </a>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Numero fattura">
            <Input name="numero" required maxLength={40} placeholder="1/2026" />
          </Campo>
          <Campo label="Data emissione">
            <Input name="data" type="date" required key={oggi} defaultValue={oggi} />
          </Campo>
          <Campo label="Scadenza pagamento">
            <Input name="scadenza" type="date" key={oggi} defaultValue={oggi ? aggiungiGiorni(oggi, 30) : ""} />
          </Campo>
        </div>
      </ActionForm>
    );
  }

  return (
    <ActionForm
      action={async (fd) => {
        fd.set("id", id);
        return segnaIncassata(fd);
      }}
      onSuccess={() => {
        setModo(null);
        router.refresh();
      }}
      submitLabel="Fatto, è incassata"
      className="flex flex-col gap-3 rounded-md border border-input p-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data incasso">
          <Input name="data" type="date" required key={oggi} defaultValue={oggi} />
        </Campo>
        <Campo label="Importo incassato (€)">
          <Input
            name="importo"
            required
            inputMode="decimal"
            defaultValue={String(importo).replace(".", ",")}
          />
        </Campo>
      </div>
    </ActionForm>
  );
}

export function DuplicaFatturaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", id);
          setError(null);
          start(async () => {
            const r = await duplicaFattura(fd);
            if (r.error) setError(r.error);
            else if (r.id) router.push(`/fatture/${r.id}`);
          });
        }}
      >
        {pending ? "Un attimo..." : "Duplica"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
