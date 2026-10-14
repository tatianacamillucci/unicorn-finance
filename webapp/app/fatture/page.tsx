import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFatture, getServiziListino } from "@/lib/fatture-data";
import { PageHeader } from "@/components/ui/page-header";
import { Kpi } from "@/components/ui/kpi";
import { FattureLista } from "@/components/fatture/fatture-lista";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatEuro, oggiIso, statoFatturaMostrato, uuid } from "@/components/clienti/format";

type SP = Promise<{ cliente?: string; nuova?: string }>;

async function Content({ searchParams }: { searchParams: SP }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const clienteId = uuid.safeParse(sp.cliente).success || /^demo-cli-\d+$/.test(sp.cliente ?? "") ? sp.cliente : undefined;

  const [{ pronto, fatture, clienti }, servizi] = await Promise.all([getFatture(), getServiziListino()]);
  const oggi = oggiIso();
  const anno = oggi.slice(0, 4);

  const emesseAnno = fatture.filter(
    (f) => (f.stato === "emessa" || f.stato === "incassata") && f.data_emissione?.startsWith(`${anno}-`),
  );
  const fatturato = emesseAnno.reduce((t, f) => t + f.importo, 0);
  const incassato = emesseAnno.filter((f) => f.stato === "incassata").reduce((t, f) => t + f.importo, 0);
  const daIncassare = fatture.filter((f) => f.stato === "emessa");
  const scadute = fatture.filter((f) => statoFatturaMostrato(f, oggi) === "scaduta");
  const somma = (xs: { importo: number }[]) => xs.reduce((t, f) => t + f.importo, 0);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8">
      <PageHeader title="Fatture" subtitle="Cosa devi fare, cosa hai fatto, cosa hai incassato." />
      {!pronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Kpi label={`Fatturato ${anno}`} value={formatEuro(fatturato)} sub={`${emesseAnno.length} fatture emesse`} color="azzurro" />
            <Kpi label="Incassato" value={formatEuro(incassato)} sub="Fatture già pagate" color="menta" />
            <Kpi label="Da incassare" value={formatEuro(somma(daIncassare))} sub={`${daIncassare.length} fatture emesse`} color="giallo" />
            <Kpi
              label="Scadute non pagate"
              value={formatEuro(somma(scadute))}
              sub={scadute.length === 0 ? "Nessuna, bene così" : `${scadute.length} da sollecitare`}
              color="rosa"
            />
          </div>
          <FattureLista
            fatture={fatture}
            clienti={clienti}
            servizi={servizi}
            oggi={oggi}
            apriNuova={sp.nuova === "1"}
            clienteIniziale={clienteId}
          />
        </>
      )}
    </main>
  );
}

export default function FatturePage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
