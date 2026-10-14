import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

const OPZIONI = [
  { nome: "Conto deposito", testo: "Blocchi i soldi per un periodo e la banca ti paga un interesse fisso.", rischio: "Basso" },
  { nome: "Buoni fruttiferi / BTP", testo: "Presti soldi allo Stato o a Poste e ricevi un interesse a scadenza.", rischio: "Basso" },
  { nome: "PAC su ETF", testo: "Ogni mese compri un pezzettino di un fondo che segue il mercato: il valore sale e scende.", rischio: "Medio" },
  { nome: "Fondo pensione con deduzione", testo: "Metti soldi per la pensione e parte può essere dedotta, ma si sbloccano solo più avanti.", rischio: "Medio" },
];

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-3xl lg:gap-6 lg:p-8">
      <PageHeader title="Investimenti" subtitle="Far lavorare i soldi che metti da parte." />

      <Panel color="lilla" title="In arrivo">
        <p className="text-sm text-muted-foreground">
          Questa pagina è ancora in preparazione. Intanto, un&apos;idea: prova a mettere da parte anche solo 50 € al mese.
        </p>
      </Panel>

      <div className="flex flex-col gap-3">
        {OPZIONI.map((o, i) => (
          <Panel key={o.nome} index={i} title={o.nome} actions={<span className="text-xs text-muted-foreground">Rischio {o.rischio.toLowerCase()}</span>}>
            <p className="text-sm">{o.testo}</p>
          </Panel>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">Non è un consiglio finanziario: è un primo orientamento.</p>
    </main>
  );
}

export default function InvestimentiPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
