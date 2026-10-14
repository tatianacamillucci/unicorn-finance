"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ActionForm, Campo } from "@/components/clienti/action-form";
import { creaSpesa } from "@/app/actions/spese";

export const CATEGORIE_SPESA = [
  "Software",
  "Hosting e domini",
  "Telefono",
  "Formazione",
  "Commercialista",
  "Cancelleria",
  "Altro",
];

export function NuovaSpesaForm({ categorieEsistenti, oggi }: { categorieEsistenti: string[]; oggi: string }) {
  const router = useRouter();
  const categorie = Array.from(new Set([...CATEGORIE_SPESA, ...categorieEsistenti]));
  return (
    <ActionForm action={creaSpesa} submitLabel="Aggiungi spesa" onSuccess={() => router.refresh()}>
      <Campo label="Data">
        <Input name="data" type="date" required defaultValue={oggi} />
      </Campo>
      <Campo label="Fornitore (obbligatorio)">
        <Input name="fornitore" required maxLength={120} />
      </Campo>
      <Campo label="Descrizione">
        <Input name="descrizione" maxLength={300} />
      </Campo>
      <Campo label="Categoria">
        <Input name="categoria" list="categorie-spesa" maxLength={60} placeholder="Altro" />
        <datalist id="categorie-spesa">
          {categorie.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>
      <Campo label="Importo in euro">
        <Input name="importo" inputMode="decimal" required placeholder="es. 49,90" />
      </Campo>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="pagata" defaultChecked className="h-4 w-4" />
        Già pagata
      </label>
    </ActionForm>
  );
}
