import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFatturaDettaglio } from "@/lib/fatture-data";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentoPreview } from "@/components/ui/documento-preview";
import { DuplicaFatturaButton, FatturaAzioni } from "@/components/fatture/forms";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import {
  formatData,
  formatEuro,
  oggiIso,
  righeDi,
  scadenzaFattura,
  statoFatturaMostrato,
} from "@/components/clienti/format";

const MAIN = "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const { pronto, dettaglio } = await getFatturaDettaglio(id);
  if (!pronto) {
    return (
      <main className={MAIN}>
        <PageHeader title="Fattura" />
        <DbNonPronto />
      </main>
    );
  }
  if (!dettaglio) notFound();

  const { fattura: f, cliente, azienda, incasso, preventivoNumero } = dettaglio;
  const oggi = oggiIso();
  const stato = statoFatturaMostrato(f, oggi);
  const scadenza = scadenzaFattura(f);

  const storico: { quando: string; cosa: string }[] = [
    { quando: f.created_at.slice(0, 10), cosa: "Fattura creata" },
  ];
  if (f.data_emissione && f.stato !== "da_emettere") {
    storico.push({ quando: f.data_emissione, cosa: `Emessa${f.numero ? ` con numero ${f.numero}` : ""}` });
  }
  if (incasso) storico.push({ quando: incasso.data, cosa: `Incassata (${formatEuro(incasso.importo)})` });

  return (
    <main className={MAIN}>
      <PageHeader
        title={`Fattura ${f.numero ?? "(bozza)"}`}
        subtitle={cliente ? `Per ${cliente.nome}` : undefined}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/fatture">Tutte le fatture</Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <DocumentoPreview
            tipo="fattura"
            numero={f.numero}
            data={f.data_emissione}
            scadenza={scadenza}
            emittente={azienda}
            cliente={{ nome: cliente?.nome ?? "Cliente", pivaCf: cliente?.piva_cf, email: cliente?.email }}
            righe={righeDi(f)}
            bollo={f.bollo}
          />
        </div>

        <aside className="no-print flex flex-col gap-4">
          <Panel title="Stato" color="azzurro">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tipo="fattura" stato={stato} />
                <span className="text-lg font-bold tabular-nums">{formatEuro(f.importo + f.bollo)}</span>
              </div>
              {stato === "scaduta" && scadenza && (
                <p className="text-sm text-muted-foreground">
                  Era da pagare entro il {formatData(scadenza)}. Puoi sollecitare il cliente.
                </p>
              )}
              <FatturaAzioni id={f.id} stato={f.stato} importo={f.importo} />
            </div>
          </Panel>

          <Panel title="Azioni" color="menta">
            <div className="flex flex-col gap-3">
              <DuplicaFatturaButton id={f.id} />
              {cliente && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/clienti/${cliente.id}`}>Apri il cliente</Link>
                </Button>
              )}
              {f.preventivo_id && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/preventivi/${f.preventivo_id}`}>
                    Preventivo di origine{preventivoNumero ? ` (${preventivoNumero})` : ""}
                  </Link>
                </Button>
              )}
              {incasso && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/incassi">Vedi l&apos;incasso</Link>
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Storico" color="lilla">
            <ol className="flex flex-col gap-2 text-sm">
              {storico.map((s, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{s.cosa}</span>
                  <span className="shrink-0 text-muted-foreground">{formatData(s.quando)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

export default function FatturaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
