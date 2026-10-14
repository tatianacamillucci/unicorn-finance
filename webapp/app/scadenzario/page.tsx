import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Kpi } from "@/components/ui/kpi";
import { DbNonPronto } from "@/components/oggi/DbNonPronto";
import { ScadenzarioLista } from "@/components/scadenzario/ScadenzarioLista";
import { getScadenzario } from "@/lib/scadenzario-data";
import { formatEuro } from "@/lib/incassi-data";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const d = await getScadenzario();
  const inRitardo = d.voci.filter((v) => v.scaduta && v.tipo === "incasso");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Scadenzario" subtitle="Quando entrano soldi e quando ne devono uscire, mese per mese." />
      {!d.dbPronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
            <Kpi
              label="Da incassare nei prossimi 30 giorni"
              value={formatEuro(d.daIncassare30)}
              sub={
                inRitardo.length > 0
                  ? `${inRitardo.length} ${inRitardo.length === 1 ? "cliente è" : "clienti sono"} in ritardo`
                  : "Soldi che i clienti ti devono"
              }
              color="menta"
            />
            <Kpi
              label="Da pagare nei prossimi 30 giorni"
              value={formatEuro(d.daPagare30)}
              sub="Spese e bolli in arrivo"
              color="pesca"
            />
          </div>
          <ScadenzarioLista voci={d.voci} oggi={d.oggi} />
        </>
      )}
    </main>
  );
}

export default function ScadenzarioPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
