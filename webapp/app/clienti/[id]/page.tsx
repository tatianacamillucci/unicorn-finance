import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSchedaCliente } from "@/lib/clienti-data";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/ui/kpi";
import { BarMensile } from "@/components/ui/charts";
import { ClienteTabs } from "@/components/clienti/cliente-tabs";
import { EliminaCliente, ModificaClienteForm } from "@/components/clienti/forms";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatEuro, oggiIso } from "@/components/clienti/format";

// Copia locale: charts.tsx è un Client Component, i suoi valori non si possono usare dal server.
const MESI_BREVI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const MAIN = "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  // In modalità esempio gli id sono tipo "demo-cli-1": il loader li gestisce, qui basta un controllo di forma.
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) notFound();

  const { pronto, scheda } = await getSchedaCliente(id);
  if (!pronto) {
    return (
      <main className={MAIN}>
        <PageHeader title="Cliente" />
        <DbNonPronto />
      </main>
    );
  }
  if (!scheda) notFound();

  const { cliente, preventivi, fatture, incassi } = scheda;
  const oggi = oggiIso();
  const anno = oggi.slice(0, 4);

  const emesse = fatture.filter((f) => f.stato === "emessa" || f.stato === "incassata");
  const fatturatoAnno = emesse
    .filter((f) => f.data_emissione?.startsWith(`${anno}-`))
    .reduce((s, f) => s + f.importo, 0);
  const daIncassare = fatture.filter((f) => f.stato === "emessa").reduce((s, f) => s + f.importo, 0);
  const incassato = incassi.reduce((s, i) => s + i.importo, 0);

  const mensile = MESI_BREVI.map((mese) => ({ mese, a: 0 }));
  for (const f of emesse) {
    if (!f.data_emissione?.startsWith(`${anno}-`)) continue;
    mensile[Number(f.data_emissione.slice(5, 7)) - 1].a += f.importo;
  }

  const dati = [
    cliente.piva_cf && `P.IVA / C.F. ${cliente.piva_cf}`,
    cliente.email,
    cliente.telefono,
  ].filter(Boolean) as string[];

  return (
    <main className={MAIN}>
      <PageHeader
        title={cliente.nome}
        subtitle={dati.length > 0 ? dati.join(" · ") : "La scheda di questo cliente."}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href={`/preventivi?nuovo=1&cliente=${cliente.id}`}>Nuovo preventivo</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/fatture?nuova=1&cliente=${cliente.id}`}>Nuova fattura</Link>
            </Button>
          </>
        }
      />

      {cliente.note && (
        <Panel color="lilla">
          <p className="whitespace-pre-line text-sm">{cliente.note}</p>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi label={`Fatturato ${anno}`} value={formatEuro(fatturatoAnno)} sub="Fatture emesse e incassate" color="azzurro" />
        <Kpi label="Da incassare" value={formatEuro(daIncassare)} sub="Fatture emesse non pagate" color="giallo" />
        <Kpi label="Incassato in tutto" value={formatEuro(incassato)} sub={`${incassi.length} incassi`} color="menta" />
        <Kpi label="Documenti" value={String(preventivi.length + fatture.length)} sub={`${preventivi.length} preventivi · ${fatture.length} fatture`} color="lilla" />
      </div>

      <Panel title={`Fatturato di ${anno} mese per mese`}>
        <BarMensile data={mensile} serieA="Fatturato" height={220} />
      </Panel>

      <Panel title="Documenti">
        <ClienteTabs preventivi={preventivi} fatture={fatture} incassi={incassi} oggi={oggi} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="Modifica i dati del cliente">
          <ModificaClienteForm cliente={cliente} />
        </Panel>
        <Panel title="Elimina cliente">
          <EliminaCliente id={cliente.id} nome={cliente.nome} />
        </Panel>
      </div>
    </main>
  );
}

export default function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
