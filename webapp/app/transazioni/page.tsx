import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTransazioni, getCategorieOptions, getContiOptions } from "@/lib/transazioni-data";
import { TransazioniFilters } from "@/components/transazioni/TransazioniFilters";
import { TransazioniList } from "@/components/transazioni/TransazioniList";

async function TransazioniContent({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; conto?: string; mese?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { categoria, conto, mese } = await searchParams;
  const currentMonth = mese ?? new Date().toISOString().slice(0, 7);

  const [transazioni, categorie, conti] = await Promise.all([
    getTransazioni({ categoriaId: categoria, contoId: conto, month: currentMonth }),
    getCategorieOptions(),
    getContiOptions(),
  ]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="text-lg font-black uppercase text-foreground">Transazioni</h1>
      <TransazioniFilters
        categorie={categorie}
        conti={conti}
        categoriaId={categoria}
        contoId={conto}
        month={currentMonth}
      />
      <TransazioniList transazioni={transazioni} />
    </main>
  );
}

export default function TransazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; conto?: string; mese?: string }>;
}) {
  return (
    <Suspense>
      <TransazioniContent searchParams={searchParams} />
    </Suspense>
  );
}
