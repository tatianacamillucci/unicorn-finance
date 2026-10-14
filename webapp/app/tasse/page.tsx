import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { DbNonPronto } from "@/components/oggi/DbNonPronto";
import { SogliaBar } from "@/components/tasse/SogliaBar";
import { getTasseData, trimestreDaTitolo } from "@/lib/tasse-data";
import { SimulatoreTasse } from "@/components/tasse/SimulatoreTasse";
import { DataTable } from "@/components/ui/data-table";
import { getSnapshot, trimestri } from "@/lib/report-data";
import { formatEuro } from "@/lib/incassi-data";
import { percentualeSoglia, SOGLIA_FORFETTARIO } from "@/lib/fiscale";

const dataIt = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

async function Content({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const { anno: annoParam } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const corrente = new Date().getFullYear();
  const richiesto = Number(annoParam);
  const anno =
    Number.isInteger(richiesto) && richiesto >= corrente - 5 && richiesto <= corrente + 2
      ? richiesto
      : corrente;
  const anni = [anno - 1, anno, anno + 1];

  const d = await getTasseData(anno);
  const snap = await getSnapshot();
  const trim = trimestri(snap, anno);
  const perc = percentualeSoglia(d.incassato);
  const annoGrande = d.annoApertura + 1;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Tasse" subtitle="Quanto hai incassato e quando devi pagare." />

      <nav aria-label="Scegli l'anno" className="flex gap-2">
        {anni.map((a) => (
          <Link
            key={a}
            href={`/tasse?anno=${a}`}
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

      {!d.dbPronto ? (
        <DbNonPronto />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Panel title={`Quanto hai incassato nel ${anno}`}>
              <p className="text-4xl font-bold">{formatEuro(d.incassato)}</p>
            </Panel>
            <Panel title="Quanto dovrai pagare (stima)">
              <p className="text-4xl font-bold">{formatEuro(d.stima)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                È la somma di quello che hai messo da parte per INPS e tasse.
              </p>
            </Panel>
          </div>

          <Panel title="Fino a 85.000 € puoi restare in questo regime">
            <SogliaBar percentuale={perc} />
            <p className="mt-2 text-sm">
              Hai incassato {formatEuro(d.incassato)} su {formatEuro(SOGLIA_FORFETTARIO)} (
              {perc.toFixed(1).replace(".", ",")}%). Se superi il limite, il regime cambia.
            </p>
          </Panel>

          {(anno === d.annoApertura || anno === annoGrande) && (
            <Panel color="giallo" title={`Attenzione: giugno ${annoGrande}`}>
              <p className="text-base">
                A giugno {annoGrande} arriva il pagamento più grande: saldo del {d.annoApertura} +
                primo acconto del {annoGrande}. Tienili da parte.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Saldo = quello che manca per le tasse dell&apos;anno scorso. Acconto = un anticipo
                sulle tasse di quest&apos;anno. Da verificare con la commercialista.
              </p>
            </Panel>
          )}

          <SimulatoreTasse
            incassato={d.incassato}
            coefficiente={snap.profilo.coefficiente}
            aliquotaInps={snap.profilo.aliquotaInps}
            aliquotaImposta={snap.profilo.aliquotaImposta}
            anno={anno}
          />

          <DataTable
            titolo={`Trimestre per trimestre, ${anno}`}
            ricercabile={false}
            colonne={[
              { key: "t", header: "Trimestre", primaria: true },
              { key: "inc", header: "Incassato", align: "right" },
              { key: "acc", header: "Da mettere da parte", align: "right" },
              { key: "bol", header: "Bollo", align: "right" },
            ]}
            righe={trim.map((r) => ({
              id: `q${r.trimestre}`,
              celle: {
                t: `${r.trimestre}° trimestre`,
                inc: formatEuro(r.incassato),
                acc: formatEuro(r.accantonato),
                bol: formatEuro(d.bollo[r.trimestre - 1]?.totale ?? r.bolli),
              },
            }))}
            totale={{
              t: "Totale",
              inc: formatEuro(trim.reduce((t, r) => t + r.incassato, 0)),
              acc: formatEuro(trim.reduce((t, r) => t + r.accantonato, 0)),
              bol: formatEuro(d.bollo.reduce((t, b) => t + b.totale, 0)),
            }}
          />

          <Panel title="Le date da ricordare">
            {d.scadenze.length === 0 ? (
              <p className="text-sm">Nel {anno} non ci sono pagamenti da fare.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {d.scadenze.map((s) => {
                  const q = trimestreDaTitolo(s.titolo);
                  const b = q ? d.bollo[q - 1] : null;
                  return (
                    <li key={s.data + s.titolo} className="border-b border-foreground/10 pb-3 last:border-0 last:pb-0">
                      <p className="text-lg font-bold">{dataIt(s.data)}</p>
                      <p className="font-semibold">{s.titolo}</p>
                      <p className="text-sm">{s.descrizione}</p>
                      {b && (
                        <p className="mt-1 text-base">
                          Da pagare:{" "}
                          <strong>{formatEuro(b.totale)}</strong>{" "}
                          <span className="text-sm text-muted-foreground">
                            ({b.fattureConBollo} {b.fattureConBollo === 1 ? "fattura" : "fatture"} con bollo)
                          </span>
                        </p>
                      )}
                      {!b && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          L&apos;importo preciso si calcola con la commercialista.
                        </p>
                      )}
                      {s.daVerificare && (
                        <span className="mt-1 inline-block rounded-full border border-foreground/30 px-2 py-0.5 text-xs">
                          da verificare con la commercialista
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </>
      )}
    </main>
  );
}

export default async function TassePage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string }>;
}) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
