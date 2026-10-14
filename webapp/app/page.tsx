import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { BarMensile, MESI_BREVI } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DbNonPronto } from "@/components/oggi/DbNonPronto";
import { SogliaBar } from "@/components/tasse/SogliaBar";
import { getOggiPieno } from "@/lib/oggi-data";
import { formatEuro } from "@/lib/incassi-data";
import { dataIt, giorniTra, r2 } from "@/lib/report-data";
import { percentualeSoglia, SOGLIA_FORFETTARIO } from "@/lib/fiscale";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const d = await getOggiPieno();
  const perc = percentualeSoglia(d.soglia.incassato);
  const resto = Math.max(0, r2(d.conto.daMettere - d.conto.messo));
  const punti = MESI_BREVI.map((mese, i) => ({ mese, a: d.mensile.fatturato[i], b: d.mensile.incassato[i] }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader
        title={d.nickname ? `Ciao ${d.nickname}!` : "Ciao!"}
        subtitle="Ecco come va la tua attività, in parole semplici."
      />

      {!d.dbPronto ? (
        <DbNonPronto />
      ) : (
        <>
          <Panel title="Cosa devo fare adesso">
            {d.azioni.length === 0 ? (
              <p className="text-xl font-semibold">Tutto in ordine. Oggi non devi fare niente.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {d.azioni.map((a, i) => (
                  <li key={a.href + i} className="flex items-start gap-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground/30 text-xl font-bold"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-base">{a.testo}</p>
                      <Link href={a.href} className="text-sm font-semibold underline">
                        {a.vai}
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Kpi index={0} label={`Fatturato ${d.anno}`} value={formatEuro(d.kpi.fatturato)} sub="Fatture che hai fatto" />
            <Kpi index={1} label="Incassato" value={formatEuro(d.kpi.incassato)} sub="Soldi già arrivati" />
            <Kpi index={2} label="Da incassare" value={formatEuro(d.kpi.daIncassare)} sub="Soldi che aspetti dai clienti" />
            <Kpi
              index={3}
              label="Da mettere da parte"
              value={formatEuro(resto)}
              sub="Per INPS e tasse, sul conto tasse"
            />
          </div>

          <Panel title="Fatturato e incassato mese per mese">
            <BarMensile data={punti} serieA="Fatturato" serieB="Incassato" height={240} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <DataTable
              titolo="Ultime fatture"
              ricercabile={false}
              vuoto="Non hai ancora fatto fatture."
              colonne={[
                { key: "num", header: "Fattura", primaria: true },
                { key: "cli", header: "Cliente" },
                { key: "imp", header: "Totale", align: "right" },
                { key: "sta", header: "Stato" },
              ]}
              righe={d.ultimeFatture.map((f) => ({
                id: f.id,
                href: `/fatture/${f.id}`,
                celle: {
                  num: f.numero ?? "-",
                  cli: f.cliente,
                  imp: formatEuro(f.totale),
                  sta: <StatusBadge tipo="fattura" stato={f.stato} />,
                },
              }))}
            />

            <Panel title="Prossime scadenze">
              {d.prossime.length === 0 ? (
                <p className="text-sm">Niente in arrivo.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-foreground/10">
                  {d.prossime.map((v) => {
                    const g = giorniTra(d.oggi, v.data);
                    const quando = v.scaduta
                      ? "in ritardo"
                      : g === 0
                        ? "oggi"
                        : g === 1
                          ? "domani"
                          : `tra ${g} giorni`;
                    return (
                      <li key={v.id} className="flex items-start justify-between gap-3 py-2">
                        <div>
                          <p className="font-semibold">{v.titolo}</p>
                          <p className={v.scaduta ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>
                            {dataIt(v.data)} ({quando})
                          </p>
                        </div>
                        <strong className="shrink-0 tabular-nums">
                          {v.importo === null ? "" : (v.tipo === "incasso" ? "+" : "-") + formatEuro(v.importo)}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/scadenzario" className="mt-3 inline-block text-sm font-semibold underline">
                Vedi tutto lo scadenzario
              </Link>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Panel title="Limite di 85.000 €">
              <SogliaBar percentuale={perc} />
              <p className="mt-2 text-sm">
                Hai incassato {formatEuro(d.soglia.incassato)} su {formatEuro(SOGLIA_FORFETTARIO)} (
                {perc.toFixed(1).replace(".", ",")}%). Oltre il limite il regime cambia.
              </p>
            </Panel>
            <Panel title="Conto Tasse">
              <p className="text-lg">
                Hai messo da parte <strong className="text-2xl">{formatEuro(d.conto.messo)}</strong> su{" "}
                <strong className="text-2xl">{formatEuro(d.conto.daMettere)}</strong>.
              </p>
              <Link href="/incassi" className="mt-2 inline-block text-sm font-semibold underline">
                Vai agli incassi
              </Link>
            </Panel>
          </div>
        </>
      )}

      <p className="text-center text-sm">
        <Link href="/personale" className="text-muted-foreground underline">
          Finanze personali
        </Link>
      </p>
    </main>
  );
}

export default function OggiPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
