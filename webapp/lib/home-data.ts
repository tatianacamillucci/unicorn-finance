import { createClient } from "@/lib/supabase/server";
import { monthDateRange } from "@/lib/month-range";

export interface HomeCategorySummary {
  id: string;
  nome: string;
  emoji: string;
  colore_hex: string;
  speso: number;
  budget: number;
}

export interface HomeSummary {
  month: string;
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  categories: HomeCategorySummary[];
}

export async function getHomeSummary(month: string): Promise<HomeSummary> {
  const supabase = await createClient();

  const { startDate, endDate } = monthDateRange(month);

  const { data: budgets, error: budgetsError } = await supabase
    .from("budget_categorie")
    .select("categoria_id, importo, categorie(id, nome, emoji, colore_hex)");
  if (budgetsError) throw budgetsError;

  const { data: movimenti, error: movimentiError } = await supabase
    .from("movimenti")
    .select("categoria_id, importo")
    .gte("data", startDate)
    .lte("data", endDate);
  if (movimentiError) throw movimentiError;

  const spentByCategory = new Map<string, number>();
  for (const m of movimenti ?? []) {
    const prev = spentByCategory.get(m.categoria_id) ?? 0;
    spentByCategory.set(m.categoria_id, prev + Math.abs(Number(m.importo)));
  }

  const categories: HomeCategorySummary[] = (budgets ?? []).map((b) => {
    const cat = (b as unknown as { categorie: { id: string; nome: string; emoji: string; colore_hex: string } }).categorie;
    return {
      id: cat.id,
      nome: cat.nome,
      emoji: cat.emoji,
      colore_hex: cat.colore_hex,
      speso: spentByCategory.get(b.categoria_id) ?? 0,
      budget: Number(b.importo),
    };
  });

  const totalSpent = categories.reduce((sum, c) => sum + c.speso, 0);
  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);

  return {
    month,
    totalSpent,
    totalBudget,
    remaining: totalBudget - totalSpent,
    categories,
  };
}
