import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getClientiConTotali } from "@/lib/clienti-data";
import { PageHeader } from "@/components/ui/page-header";
import { Kpi } from "@/components/ui/kpi";
import { ClientiLista } from "@/components/clienti/clienti-lista";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatEuro } from "@/components/clienti/format";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { pronto, clienti } = await getClientiConTotali();
  const attivi = clienti.filter((c) => c.fatturatoAnno > 0).length;
  const fatturatoAnno = clienti.reduce((t, c) => t + c.fatturatoAnno, 0);
  const daIncassare = clienti.reduce((t, c) => t + c.daIncassare, 0);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-6xl lg:gap-6 lg:p-8">
      <PageHeader title="Clienti" subtitle="Le persone e le aziende per cui lavori." />
      {!pronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <Kpi label="Clienti" value={String(clienti.length)} sub={`${attivi} con fatture quest'anno`} color="lilla" />
            <Kpi label="Fatturato dell'anno" value={formatEuro(fatturatoAnno)} sub="Fatture emesse e incassate" color="azzurro" />
            <Kpi label="Da incassare" value={formatEuro(daIncassare)} sub="Fatture emesse non ancora pagate" color="giallo" />
          </div>
          <ClientiLista clienti={clienti} />
        </>
      )}
    </main>
  );
}

export default function ClientiPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
