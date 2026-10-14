"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm, Campo } from "@/components/clienti/action-form";
import {
  ETICHETTE_PREVENTIVO,
  STATI_PREVENTIVO,
  aggiungiGiorni,
  selectClass,
  type EsitoConId,
} from "@/components/clienti/format";
import { RigheEditor } from "@/components/fatture/righe-editor";
import type { Servizio } from "@/lib/types/gestionale";
import {
  cambiaStatoPreventivo,
  creaFatturaDaPreventivo,
  creaPreventivo,
} from "@/app/actions/preventivi";

export function oggiLocale(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function NuovoPreventivoForm({
  clienti,
  servizi,
  clienteId,
  onFatto,
}: {
  clienti: { id: string; nome: string }[];
  servizi: Servizio[];
  clienteId?: string;
  onFatto?: () => void;
}) {
  const router = useRouter();
  const nuovoId = React.useRef<string | null>(null);
  const [oggi, setOggi] = React.useState("");
  React.useEffect(() => setOggi(oggiLocale()), []);

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
        const r: EsitoConId = await creaPreventivo(fd);
        nuovoId.current = r.id ?? null;
        return r;
      }}
      submitLabel="Crea preventivo"
      onSuccess={() => {
        onFatto?.();
        if (nuovoId.current) router.push(`/preventivi/${nuovoId.current}`);
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
        <Campo label="Numero (se vuoi)">
          <Input name="numero" maxLength={40} />
        </Campo>
        <Campo label="Data">
          <Input name="data" type="date" required key={oggi} defaultValue={oggi} />
        </Campo>
        <Campo label="Valido fino al">
          <Input name="validita" type="date" key={`v${oggi}`} defaultValue={oggi ? aggiungiGiorni(oggi, 30) : ""} />
        </Campo>
      </div>
      <RigheEditor servizi={servizi} conBollo={false} />
    </ActionForm>
  );
}

export function PreventivoAzioni({
  id,
  stato,
  fatturaId,
}: {
  id: string;
  stato: (typeof STATI_PREVENTIVO)[number];
  /** Fattura già creata da questo preventivo (se c'è). */
  fatturaId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function cambia(nuovo: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("stato", nuovo);
    setError(null);
    start(async () => {
      const r = await cambiaStatoPreventivo(fd);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }
  function creaFattura() {
    const fd = new FormData();
    fd.set("id", id);
    setError(null);
    start(async () => {
      const r = await creaFatturaDaPreventivo(fd);
      if (r.error) setError(r.error);
      else if (r.id) router.push(`/fatture/${r.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {STATI_PREVENTIVO.filter((s) => s !== stato).map((s) => (
          <Button key={s} type="button" size="sm" variant="outline" disabled={pending} onClick={() => cambia(s)}>
            Segna come {ETICHETTE_PREVENTIVO[s].toLowerCase()}
          </Button>
        ))}
      </div>
      {stato === "accettato" &&
        (fatturaId ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/fatture/${fatturaId}`}>Vai alla fattura creata</Link>
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={pending} onClick={creaFattura}>
            Trasforma in fattura
          </Button>
        ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
