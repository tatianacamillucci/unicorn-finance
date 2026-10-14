import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BudgetRow } from "@/components/settings/BudgetRow";

async function BudgetContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { data: categorie, error: categorieError } = await supabase
    .from("categorie")
    .select("id, nome, emoji")
    .eq("tipo", "uscita")
    .order("nome", { ascending: true });
  if (categorieError) {
    throw new Error(categorieError.message);
  }

  const { data: budget, error: budgetError } = await supabase
    .from("budget_categorie")
    .select("categoria_id, importo");
  if (budgetError) {
    throw new Error(budgetError.message);
  }

  const budgetByCategoria = new Map(
    (budget ?? []).map((b) => [b.categoria_id, b.importo])
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="font-black text-xl">Budget per categoria</h1>

      <div className="flex flex-col gap-3">
        {(categorie ?? []).map((categoria) => (
          <BudgetRow
            key={categoria.id}
            categoriaId={categoria.id}
            nome={categoria.nome}
            emoji={categoria.emoji}
            currentBudget={budgetByCategoria.get(categoria.id) ?? null}
          />
        ))}
        {(categorie ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nessuna categoria di spesa ancora creata.</p>
        )}
      </div>
    </main>
  );
}

export default function BudgetPage() {
  return (
    <Suspense>
      <BudgetContent />
    </Suspense>
  );
}
