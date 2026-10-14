import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPreventivoDettaglio } from "@/lib/preventivi-data";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentoPreview } from "@/components/ui/documento-preview";
import { PreventivoAzioni } from "@/components/preventivi/forms";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatData, formatEuro, righeDi } from "@/components/clienti/format";

const MAIN = "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const { pronto, dettaglio } = await getPreventivoDettaglio(id);
  if (!pronto) {
    return (
      <main className={MAIN}>
        <PageHeader title="Preventivo" />
        <DbNonPronto />
      </main>
    );
  }
  if (!dettaglio) notFound();

  const { preventivo: p, cliente, azienda, fatturaId } = dettaglio;

  return (
    <main className={MAIN}>
      <PageHeader
        title={`Preventivo ${p.numero ?? "(senza numero)"}`}
        subtitle={cliente ? `Per ${cliente.nome}` : undefined}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/preventivi">Tutti i preventivi</Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <DocumentoPreview
            tipo="preventivo"
            numero={p.numero}
            data={p.data}
            scadenza={p.validita ?? null}
            emittente={azienda}
            cliente={{ nome: cliente?.nome ?? "Cliente", pivaCf: cliente?.piva_cf, email: cliente?.email }}
            righe={righeDi(p)}
            bollo={0}
          />
        </div>

        <aside className="no-print flex flex-col gap-4">
          <Panel title="Stato" color="azzurro">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tipo="preventivo" stato={p.stato} />
                <span className="text-lg font-bold tabular-nums">{formatEuro(p.importo)}</span>
              </div>
              <PreventivoAzioni id={p.id} stato={p.stato} fatturaId={fatturaId} />
              {p.stato !== "accettato" && !fatturaId && (
                <p className="text-sm text-muted-foreground">
                  Quando il cliente accetta, segna il preventivo come accettato: potrai trasformarlo in fattura.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Azioni" color="menta">
            <div className="flex flex-col gap-3">
              {cliente && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/clienti/${cliente.id}`}>Apri il cliente</Link>
                </Button>
              )}
              {fatturaId && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/fatture/${fatturaId}`}>Vedi la fattura</Link>
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Storico" color="lilla">
            <ol className="flex flex-col gap-2 text-sm">
              <li className="flex justify-between gap-3">
                <span>Preventivo creato</span>
                <span className="text-muted-foreground">{formatData(p.data)}</span>
              </li>
              {p.validita && (
                <li className="flex justify-between gap-3">
                  <span>Valido fino al</span>
                  <span className="text-muted-foreground">{formatData(p.validita)}</span>
                </li>
              )}
              {fatturaId && (
                <li className="flex justify-between gap-3">
                  <span>Trasformato in fattura</span>
                  <span className="text-muted-foreground">sì</span>
                </li>
              )}
            </ol>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

export default function PreventivoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
