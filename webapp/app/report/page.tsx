import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { BarMensile, Torta, MESI_BREVI } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { DbNonPronto } from "@/components/oggi/DbNonPronto";
import { formatEuro } from "@/lib/incassi-data";
import {
  anniDisponibili,
  fatturatoPerCliente,
  fatturatoPerServizio,
  getSnapshot,
  kpiAnno,
  mensile,
  spesePerCategoria,
  trimestri,
} from "@/lib/report-data";

async function Content({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const { anno: annoParam } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const s = await getSnapshot();
  const anni = anniDisponibili(s);
  const richiesto = Number(annoParam);
  const anno = anni.includes(richiesto) ? richiesto : s.anno;

  const k = kpiAnno(s, anno);
  const m = mensile(s, anno);
  const punti = MESI_BREVI.map((mese, i) => ({ mese, a: m.fatturato[i], b: m.incassato[i] }));
  const perCliente = fatturatoPerCliente(s, anno);
  const perServizio = fatturatoPerServizio(s, anno);
  const perCategoria = spesePerCategoria(s, anno);
  const trim = trimestri(s, anno);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Report" subtitle="Come sta andando l'anno, in grafici semplici." />

      <nav aria-label="Scegli l'anno" className="flex flex-wrap gap-2">
        {anni.map((a) => (
          <Link
            key={a}
            href={`/report?anno=${a}`}
            aria-current={a === anno ? "page" : undefined}
            className={
              a === anno
                ? "rounded-full border-2 border-foreground bg-foreground px-4 py-1 text-sm font-semibold text-background"
                : "rounded-full border-2 border-foreground/30 px-4 py-1 text-sm hover:border-foreground"
            }
          >
            {a}
          </Link>
        ))}
      </nav>

      {!s.dbPronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Kpi index={0} label="Fatturato" value={formatEuro(k.fatturato)} sub={`${k.nFatture} fatture emesse`} />
            <Kpi index={1} label="Incassato" value={formatEuro(k.incassato)} sub="Soldi già arrivati" />
            <Kpi index={2} label="Da mettere da parte" value={formatEuro(k.accantonare)} sub="Per INPS e tasse" />
            <Kpi index={3} label="Spese" value={formatEuro(k.spese)} sub="Costi dell'attività" />
          </div>

          <Panel title="Fatturato e incassato mese per mese">
            <BarMensile data={punti} serieA="Fatturato" serieB="Incassato" />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Panel title="Chi ti ha fatto guadagnare di più">
              {perCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ancora nessuna fattura in questo anno.</p>
              ) : (
                <Torta data={perCliente} />
              )}
            </Panel>
            <Panel title="Quali servizi vendi di più">
              {perServizio.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ancora nessuna fattura in questo anno.</p>
              ) : (
                <Torta data={perServizio} />
              )}
            </Panel>
          </div>

          <Panel title="Dove spendi i soldi">
            {perCategoria.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna spesa registrata in questo anno.</p>
            ) : (
              <Torta data={perCategoria} />
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Nel regime forfettario le spese non fanno pagare meno tasse (si tolgono solo i contributi INPS). Le
              segniamo solo per tenerle sotto controllo.
            </p>
          </Panel>

          <DataTable
            titolo={`Anno ${anno}, trimestre per trimestre`}
            ricercabile={false}
            colonne={[
              { key: "t", header: "Trimestre", primaria: true },
              { key: "fatt", header: "Fatturato", align: "right" },
              { key: "inc", header: "Incassato", align: "right" },
              { key: "bol", header: "Bolli", align: "right" },
              { key: "acc", header: "Da mettere da parte", align: "right" },
            ]}
            righe={trim.map((r) => ({
              id: `q${r.trimestre}`,
              celle: {
                t: `${r.trimestre}° trimestre`,
                fatt: formatEuro(r.fatturato),
                inc: formatEuro(r.incassato),
                bol: formatEuro(r.bolli),
                acc: formatEuro(r.accantonato),
              },
            }))}
            totale={{
              t: "Totale",
              fatt: formatEuro(k.fatturato),
              inc: formatEuro(k.incassato),
              bol: formatEuro(k.bolli),
              acc: formatEuro(k.accantonare),
            }}
          />
        </>
      )}
    </main>
  );
}

export default function ReportPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
