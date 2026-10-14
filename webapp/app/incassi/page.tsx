import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import type { Step } from "@/components/ui/step-list";
import { IncassoSteps } from "@/components/incassi/IncassoSteps";
import { NuovoIncassoForm } from "@/components/incassi/NuovoIncassoForm";
import { DbNonPronto } from "@/components/oggi/DbNonPronto";
import { Kpi } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getIncassiData, formatEuro } from "@/lib/incassi-data";
import { getSnapshot, kpiAnno, nomeCliente, r2 } from "@/lib/report-data";

const dataIt = (iso: string) => new Date(iso).toLocaleDateString("it-IT");

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const d = await getIncassiData();
  const snap = await getSnapshot();
  const k = kpiAnno(snap, snap.anno);
  const numeri = new Map(snap.fatture.map((f) => [f.id, f.numero ?? "-"]));
  const storico = [...snap.incassi].sort((a, b) => b.data.localeCompare(a.data));
  const nettoAnno = r2(k.incassato - k.accantonare);
  const daSpostare = d.incassi.filter((i) => !i.spostato);
  const nomeConto = d.contoTasse ? `«${d.contoTasse.nome}»` : "delle tasse";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Incassi" subtitle="I soldi arrivati e cosa metterne da parte." />

      {!d.dbPronto ? (
        <DbNonPronto />
      ) : (
        <>
          <Panel>
            <p className="text-lg">
              Hai messo da parte <strong className="text-3xl">{formatEuro(d.messoDaParte)}</strong>{" "}
              su <strong className="text-3xl">{formatEuro(d.daMettereDaParte)}</strong> da mettere da
              parte.
            </p>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Kpi index={0} label={`Incassato ${snap.anno}`} value={formatEuro(k.incassato)} sub="Soldi arrivati quest'anno" />
            <Kpi
              index={1}
              label="Da spostare"
              value={String(daSpostare.length)}
              sub={daSpostare.length === 1 ? "incasso da smistare" : "incassi da smistare"}
            />
            <Kpi index={2} label="Messo da parte" value={formatEuro(k.messo)} sub="Per INPS e tasse" />
            <Kpi index={3} label="Netto per te" value={formatEuro(nettoAnno)} sub="Quello che puoi usare" />
          </div>

          {!d.contoTasse && (
            <Panel title="Manca il conto per le tasse">
              <p className="text-sm">
                Prima crea un conto per le tasse.{" "}
                <Link href="/impostazioni" className="font-semibold underline">
                  Vai alle impostazioni
                </Link>
              </p>
            </Panel>
          )}

          {daSpostare.length === 0 ? (
            <Panel title="Da smistare">
              <p className="text-base">Nessun incasso da smistare. Tutto a posto.</p>
            </Panel>
          ) : (
            daSpostare.map((i, idx) => {
              const steps: Step[] = [
                { id: "arrivati", testo: `Da ${i.clienteNome} sono arrivati`, importo: formatEuro(i.importo) },
                { id: "banca", testo: "Apri l'app della banca." },
                {
                  id: "inps",
                  testo: `Sposta sul conto ${nomeConto}: servono per l'INPS (la tua pensione).`,
                  importo: formatEuro(i.inps),
                },
                {
                  id: "imposta",
                  testo: "Sposta sullo stesso conto: servono per le tasse (imposta 5%).",
                  importo: formatEuro(i.imposta),
                },
                { id: "resto", testo: "Il resto è tuo: puoi usarlo.", importo: formatEuro(i.resto) },
                { id: "fine", testo: "Hai spostato tutto? Premi Fatto." },
              ];
              return (
                <Panel key={i.id} index={idx} title={`Incasso del ${dataIt(i.data)}`}>
                  <IncassoSteps incassoId={i.id} steps={steps} />
                </Panel>
              );
            })
          )}

          <Panel title="Registra un incasso senza fattura">
            <NuovoIncassoForm clienti={d.clienti} />
          </Panel>

          <DataTable
            titolo="Storico incassi"
            segnapostoRicerca="Cerca cliente o fattura..."
            vuoto="Non hai ancora incassato niente."
            colonne={[
              { key: "data", header: "Data", primaria: true },
              { key: "cli", header: "Cliente" },
              { key: "fat", header: "Fattura", nascondiMobile: true },
              { key: "imp", header: "Importo", align: "right" },
              { key: "inps", header: "INPS", align: "right", nascondiMobile: true },
              { key: "tax", header: "Imposta", align: "right", nascondiMobile: true },
              { key: "net", header: "Netto per te", align: "right" },
              { key: "sta", header: "Stato" },
            ]}
            righe={storico.map((i) => {
              const cli = nomeCliente(snap, i.cliente_id);
              const fat = i.fattura_id ? (numeri.get(i.fattura_id) ?? "-") : "senza fattura";
              return {
                id: i.id,
                ricerca: `${cli} ${fat}`,
                celle: {
                  data: dataIt(i.data),
                  cli,
                  fat,
                  imp: formatEuro(i.importo),
                  inps: formatEuro(i.accantonamento_inps),
                  tax: formatEuro(i.accantonamento_imposta),
                  net: formatEuro(r2(i.importo - i.accantonamento_inps - i.accantonamento_imposta)),
                  sta: <StatusBadge tipo="incasso" stato={i.spostato ? "spostato" : "da_spostare"} />,
                },
              };
            })}
          />
        </>
      )}
    </main>
  );
}

export default function IncassiPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
