import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSpese } from "@/lib/spese-data";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { Torta } from "@/components/ui/charts";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { formatEuro } from "@/components/clienti/format";
import { SpeseTabella } from "@/components/spese/SpeseTabella";
import { NuovaSpesaForm } from "@/components/spese/NuovaSpesaForm";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { pronto, spese } = await getSpese();
  const oggi = new Date().toISOString().slice(0, 10);
  const anno = oggi.slice(0, 4);

  const dellAnno = spese.filter((s) => s.data.startsWith(anno));
  const speseAnno = dellAnno.reduce((t, s) => t + s.importo, 0);
  const daPagare = spese.filter((s) => !s.pagata).reduce((t, s) => t + s.importo, 0);
  const mesiTrascorsi = Math.max(1, Number(oggi.slice(5, 7)));
  const mediaMensile = speseAnno / mesiTrascorsi;

  const perCategoria = new Map<string, number>();
  for (const s of dellAnno) {
    const c = s.categoria ?? "Altro";
    perCategoria.set(c, (perCategoria.get(c) ?? 0) + s.importo);
  }
  const fette = [...perCategoria.entries()]
    .map(([nome, valore]) => ({ nome, valore: Math.round(valore * 100) / 100 }))
    .sort((a, b) => b.valore - a.valore);
  const categorie = [...new Set(spese.map((s) => s.categoria ?? "Altro"))].sort();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Acquisti" subtitle="Le spese dell'attività e i fornitori." />
      {!pronto ? (
        <DbNonPronto />
      ) : (
        <>
          <Panel color="giallo">
            <p className="text-sm">
              Nel regime forfettario le spese non abbassano le tasse: le registri per sapere quanto guadagni davvero.
            </p>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
            <Kpi label="Spese dell'anno" value={formatEuro(speseAnno)} sub={`Nel ${anno}`} index={0} />
            <Kpi label="Da pagare" value={formatEuro(daPagare)} sub="Fatture di fornitori aperte" index={1} />
            <Kpi label="Media mensile" value={formatEuro(mediaMensile)} sub="Da inizio anno" index={2} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <SpeseTabella spese={spese} categorie={categorie} />
            </div>
            <div className="flex flex-col gap-4 lg:gap-6">
              <Panel title="Per categoria">
                {fette.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna spesa quest&apos;anno.</p>
                ) : (
                  <Torta data={fette} />
                )}
              </Panel>
              <Panel title="Nuova spesa">
                <NuovaSpesaForm categorieEsistenti={categorie} oggi={oggi} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function SpesePage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
