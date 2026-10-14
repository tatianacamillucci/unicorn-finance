import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHomeSummary } from "@/lib/home-data";
import { reconcileRicorrenzeMensili } from "@/lib/recurring";
import { assicuraSetupIniziale } from "@/lib/setup-iniziale";
import { shouldShowMonthlyPopup } from "@/lib/popup-state";
import { getEntratePrevisteMese } from "@/lib/monthly-income";
import { getSaldiConti } from "@/lib/conto-balance";
import { getProfilo } from "@/lib/profilo";
import { getRisparmioNetto } from "@/lib/risparmi";
import { SavingsBar } from "@/components/home/SavingsBar";
import { OnboardingNickname } from "@/components/home/OnboardingNickname";
import { MonthSelector } from "@/components/home/MonthSelector";
import { DonutSummary } from "@/components/home/DonutSummary";
import { CategoryBudgetList } from "@/components/home/CategoryBudgetList";
import { AddExpenseSheet } from "@/components/home/AddExpenseSheet";
import { MonthlyIncomePopup } from "@/components/home/MonthlyIncomePopup";

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  await assicuraSetupIniziale();
  await reconcileRicorrenzeMensili();

  const { month } = await searchParams;
  const currentMonth = month ?? new Date().toISOString().slice(0, 7);
  const summary = await getHomeSummary(currentMonth);
  const monthLabel = new Date(`${currentMonth}-01`).toLocaleDateString("it-IT", {
    month: "long",
  });

  const { data: categorieRows } = await supabase
    .from("categorie")
    .select("id, nome, emoji, tipo");
  const { data: contiRows } = await supabase.from("conti").select("id, nome");

  const profilo = await getProfilo();
  const risparmioNetto = await getRisparmioNetto();
  const avatarUrl =
    (data.user.user_metadata?.avatar_url as string | undefined) ??
    (data.user.user_metadata?.picture as string | undefined) ??
    null;
  const nomeVisualizzato =
    profilo.nickname ??
    (data.user.user_metadata?.full_name as string | undefined) ??
    "Utente";

  const realMonth = new Date().toISOString().slice(0, 7);
  const showPopup = await shouldShowMonthlyPopup(realMonth);
  const entratePreviste = showPopup ? await getEntratePrevisteMese(realMonth) : 0;
  const { totale: saldoConti } = showPopup
    ? await getSaldiConti()
    : { totale: 0 };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-black">
              {nomeVisualizzato.slice(0, 1).toUpperCase()}
            </div>
          )}
          <p className="font-black text-foreground">{nomeVisualizzato}</p>
        </div>
        <Link
          href="/impostazioni"
          aria-label="Impostazioni"
          className="flex h-9 w-9 items-center justify-center rounded-full pastel-box bg-card text-card-foreground"
        >
          <Settings className="h-4 w-4 text-foreground" />
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {[
          { href: "/transazioni", label: "Movimenti" },
          { href: "/budget", label: "Budget" },
          { href: "/impostazioni/conti", label: "Conti" },
          { href: "/impostazioni/ricorrenze", label: "Ricorrenze" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border px-3 py-1 font-medium text-muted-foreground hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <MonthSelector month={currentMonth} />
      {/* Single column on phones; on desktop the same blocks spread over two
          columns so the page stops being a narrow strip on a wide screen. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <DonutSummary
            categories={summary.categories}
            totalSpent={summary.totalSpent}
            remaining={summary.remaining}
            monthLabel={monthLabel}
          />
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          <SavingsBar
            risparmioNetto={risparmioNetto}
            obiettivoRisparmio={profilo.obiettivoRisparmio}
          />
          <CategoryBudgetList categories={summary.categories} />
        </div>
      </div>
      <AddExpenseSheet categorie={categorieRows ?? []} conti={contiRows ?? []} />
      {showPopup && profilo.nickname && (
        <MonthlyIncomePopup
          month={realMonth}
          entratePreviste={entratePreviste}
          saldoConti={saldoConti}
        />
      )}
      {!profilo.nickname && <OnboardingNickname />}
    </main>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  return (
    <Suspense>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
