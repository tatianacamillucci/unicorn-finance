import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getBudgetDetail } from "@/lib/budget-data";
import { BudgetMonthSelector } from "@/components/budget/BudgetMonthSelector";
import { CategoryPieCard } from "@/components/budget/CategoryPieCard";

async function BudgetContent({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { month } = await searchParams;
  const currentMonth = month ?? new Date().toISOString().slice(0, 7);
  const details = await getBudgetDetail(currentMonth);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="text-lg font-black uppercase text-foreground">Budget</h1>
      <BudgetMonthSelector month={currentMonth} />
      {details.length === 0 ? (
        <p className="rounded-2xl pastel-box bg-card text-card-foreground p-4 text-center text-sm font-bold text-muted-foreground">
          Nessun budget configurato per questo mese.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {details.map((d) => (
            <li key={d.categoria_id}>
              <CategoryPieCard detail={d} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  return (
    <Suspense>
      <BudgetContent searchParams={searchParams} />
    </Suspense>
  );
}
