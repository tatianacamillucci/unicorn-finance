"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm, Campo } from "./action-form";
import { aggiornaCliente, creaCliente, eliminaCliente } from "@/app/actions/clienti";
import type { Cliente } from "@/lib/types/gestionale";

function CampiCliente({ cliente }: { cliente?: Cliente }) {
  return (
    <>
      <Campo label="Nome (obbligatorio)">
        <Input name="nome" required maxLength={120} defaultValue={cliente?.nome ?? ""} />
      </Campo>
      <Campo label="Partita IVA o codice fiscale">
        <Input name="piva_cf" maxLength={32} defaultValue={cliente?.piva_cf ?? ""} />
      </Campo>
      <Campo label="Email">
        <Input name="email" type="email" maxLength={160} defaultValue={cliente?.email ?? ""} />
      </Campo>
      <Campo label="Telefono">
        <Input name="telefono" type="tel" maxLength={40} defaultValue={cliente?.telefono ?? ""} />
      </Campo>
      <Campo label="Note">
        <textarea
          name="note"
          maxLength={1000}
          rows={3}
          defaultValue={cliente?.note ?? ""}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </Campo>
    </>
  );
}

export function NuovoClienteForm() {
  return (
    <ActionForm action={creaCliente} submitLabel="Aggiungi cliente">
      <CampiCliente />
    </ActionForm>
  );
}

export function ModificaClienteForm({ cliente }: { cliente: Cliente }) {
  const [salvato, setSalvato] = React.useState(false);
  return (
    <ActionForm
      action={async (fd) => {
        setSalvato(false);
        fd.set("id", cliente.id);
        return aggiornaCliente(fd);
      }}
      onSuccess={() => setSalvato(true)}
      resetOnSuccess={false}
      submitLabel="Salva"
    >
      <CampiCliente cliente={cliente} />
      {salvato && <p className="text-sm text-muted-foreground">Salvato.</p>}
    </ActionForm>
  );
}

export function EliminaCliente({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [chiedi, setChiedi] = React.useState(false);

  if (!chiedi) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setChiedi(true)}>
        Elimina cliente
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-md border border-destructive/50 p-3">
      <p className="text-sm">
        Vuoi eliminare <strong>{nome}</strong>? Spariscono anche i suoi preventivi, le sue fatture e
        i suoi incassi. Non si può tornare indietro.
      </p>
      <div className="flex gap-2">
        <ActionForm
          action={async (fd) => {
            fd.set("id", id);
            return eliminaCliente(fd);
          }}
          onSuccess={() => router.push("/clienti")}
          submitLabel="Sì, elimina"
          variant="destructive"
          className="flex"
        />
        <Button type="button" variant="outline" onClick={() => setChiedi(false)}>
          No, annulla
        </Button>
      </div>
    </div>
  );
}
