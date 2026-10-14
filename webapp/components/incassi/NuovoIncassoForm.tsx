"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registraIncassoSenzaFattura } from "@/app/actions/incassi";

export function NuovoIncassoForm({ clienti }: { clienti: { id: string; nome: string }[] }) {
  const [pending, startTransition] = React.useTransition();
  const [errore, setErrore] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const oggi = new Date().toISOString().slice(0, 10);

  if (clienti.length === 0) {
    return (
      <p className="text-sm">
        Prima aggiungi un cliente.{" "}
        <Link href="/clienti" className="font-semibold underline">
          Vai ai clienti
        </Link>
      </p>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrore(null);
    setOk(false);
    startTransition(async () => {
      const res = await registraIncassoSenzaFattura(fd);
      if (res.error) {
        setErrore(res.error);
      } else {
        setOk(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="cliente_id">Chi ti ha pagato?</Label>
        <select
          id="cliente_id"
          name="cliente_id"
          required
          defaultValue=""
          className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-base"
        >
          <option value="" disabled>
            Scegli un cliente
          </option>
          {clienti.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="importo">Quanti soldi sono arrivati? (in euro)</Label>
        <Input id="importo" name="importo" inputMode="decimal" placeholder="1000,00" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="data">Quando sono arrivati?</Label>
        <Input id="data" name="data" type="date" defaultValue={oggi} required />
      </div>
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Salvo..." : "Salva incasso"}
      </Button>
      {errore && (
        <p role="alert" className="text-sm text-destructive">
          {errore}
        </p>
      )}
      {ok && <p className="text-sm">Fatto ✓ Trovi l&apos;incasso qui sopra.</p>}
    </form>
  );
}
