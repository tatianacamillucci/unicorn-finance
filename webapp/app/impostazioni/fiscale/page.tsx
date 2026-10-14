import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { demoAzienda, demoProfiloFiscale } from "@/lib/demo";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProfiloFiscaleForm } from "@/components/settings/ProfiloFiscaleForm";

const pct = (x: number) => Math.round(x * 10000) / 100;
const MAIN = "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-3xl lg:gap-6 lg:p-8";

function Riga({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-sm text-muted-foreground sm:w-48">{label}</dt>
      <dd className="text-sm font-medium">{valore || "-"}</dd>
    </div>
  );
}

async function FiscaleContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  if (await isDemo()) {
    const p = demoProfiloFiscale();
    const a = demoAzienda();
    return (
      <main className={MAIN}>
        <PageHeader title="Profilo fiscale" subtitle="I numeri con cui calcoliamo le tue tasse." />
        <Panel color="giallo">
          <p className="text-sm">Questi sono dati di esempio: li vedi solo in lettura.</p>
        </Panel>
        <Panel title="Dati fiscali">
          <dl className="flex flex-col gap-2">
            <Riga label="Codice ATECO" valore={p.ateco ?? ""} />
            <Riga label="Coefficiente di redditività" valore={`${pct(p.coefficiente)}%`} />
            <Riga label="Aliquota imposta" valore={`${pct(p.aliquotaImposta)}%`} />
            <Riga label="Aliquota INPS" valore={`${pct(p.aliquotaInps)}%`} />
            <Riga label="Data apertura P.IVA" valore={p.dataApertura ?? ""} />
          </dl>
        </Panel>
        <Panel title="Dati per i documenti">
          <dl className="flex flex-col gap-2">
            <Riga label="Ragione sociale" valore={p.ragioneSociale ?? a.ragioneSociale} />
            <Riga label="Indirizzo" valore={p.indirizzo ?? a.indirizzo} />
            <Riga label="Partita IVA" valore={p.piva ?? a.piva} />
            <Riga label="IBAN" valore={p.iban ?? a.iban} />
          </dl>
        </Panel>
      </main>
    );
  }

  const { data: riga, error } = await supabase
    .from("profilo_fiscale")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (error) {
    logServerError("FiscaleContent", error);
    return (
      <main className={MAIN}>
        <PageHeader title="Profilo fiscale" subtitle="I numeri con cui calcoliamo le tue tasse." />
        <Panel title="Il database non è ancora pronto">
          <p className="text-sm text-muted-foreground">
            Manca un aggiornamento del database. Quando sarà applicato, potrai compilare questa pagina.
          </p>
        </Panel>
      </main>
    );
  }

  const { data: conti, error: contiError } = await supabase
    .from("conti")
    .select("id, nome")
    .order("nome");
  if (contiError) logServerError("FiscaleContent.conti", contiError);

  // Colonne della migrazione 0008: se mancano, la form non mostra i campi dei documenti.
  const { data: intest, error: intError } = await supabase
    .from("profilo_fiscale")
    .select("ragione_sociale, indirizzo, piva, iban")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (intError) logServerError("FiscaleContent.intestazione", intError);

  return (
    <main className={MAIN}>
      <PageHeader title="Profilo fiscale" subtitle="I numeri con cui calcoliamo le tue tasse." />
      <Panel>
        <ProfiloFiscaleForm
          ateco={riga?.ateco ?? "62.20.10"}
          coefficientePct={pct(Number(riga?.coefficiente ?? 0.67))}
          aliquotaImpostaPct={pct(Number(riga?.aliquota_imposta ?? 0.05))}
          aliquotaInpsPct={pct(Number(riga?.aliquota_inps ?? 0.2607))}
          dataApertura={riga?.data_apertura ?? ""}
          contoTasseId={riga?.conto_tasse_id ?? ""}
          conti={conti ?? []}
          intestazione={
            intError
              ? null
              : {
                  ragioneSociale: intest?.ragione_sociale ?? "",
                  indirizzo: intest?.indirizzo ?? "",
                  piva: intest?.piva ?? "",
                  iban: intest?.iban ?? "",
                }
          }
        />
      </Panel>
    </main>
  );
}

export default function FiscalePage() {
  return (
    <Suspense>
      <FiscaleContent />
    </Suspense>
  );
}
