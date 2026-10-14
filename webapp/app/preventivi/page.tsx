import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPreventivi } from "@/lib/preventivi-data";
import { getServiziListino } from "@/lib/fatture-data";
import { PageHeader } from "@/components/ui/page-header";
import { Kpi } from "@/components/ui/kpi";
import { PreventiviLista } from "@/components/preventivi/preventivi-lista";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatEuro, uuid } from "@/components/clienti/format";

type SP = Promise<{ cliente?: string; nuovo?: string }>;

async function Content({ searchParams }: { searchParams: SP }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const clienteId =
    uuid.safeParse(sp.cliente).success || /^demo-cli-\d+$/.test(sp.cliente ?? "") ? sp.cliente : undefined;

  const [{ pronto, preventivi, clienti }, servizi] = await Promise.all([getPreventivi(), getServiziListino()]);

  const somma = (xs: { importo: number }[]) => xs.reduce((t, p) => t + p.importo, 0);
  const attivi = preventivi.filter((p) => p.stato !== "bozza");
  const accettati = preventivi.filter((p) => p.stato === "accettato");
  const inAttesa = preventivi.filter((p) => p.stato === "inviato");
  const percAccettati = attivi.length > 0 ? Math.round((accettati.length / attivi.length) * 100) : 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8">
      <PageHeader title="Preventivi" subtitle="Le offerte che mandi ai tuoi clienti." />
      {!pronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <Kpi
              label="Totale preventivato"
              value={formatEuro(somma(preventivi))}
              sub={`${preventivi.length} preventivi`}
              color="azzurro"
            />
            <Kpi
              label="Accettati"
              value={`${percAccettati}%`}
              sub={`${accettati.length} su ${attivi.length} mandati (${formatEuro(somma(accettati))})`}
              color="menta"
            />
            <Kpi
              label="In attesa di risposta"
              value={formatEuro(somma(inAttesa))}
              sub={`${inAttesa.length} preventivi inviati`}
              color="giallo"
            />
          </div>
          <PreventiviLista
            preventivi={preventivi}
            clienti={clienti}
            servizi={servizi}
            apriNuovo={sp.nuovo === "1"}
            clienteIniziale={clienteId}
          />
        </>
      )}
    </main>
  );
}

export default function PreventiviPage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
