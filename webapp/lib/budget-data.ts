import { createClient } from "@/lib/supabase/server";
import { monthDateRange } from "@/lib/month-range";

export interface BudgetMovimento {
  id: string;
  data: string;
  luogo: string | null;
  importo: number;
}

export interface CategoryBudgetDetail {
  categoria_id: string;
  nome: string;
  emoji: string;
  colore_hex: string;
  budget: number;
  speso: number;
  rimanente: number;
  movimenti: BudgetMovimento[];
}

export async function getBudgetDetail(month: string): Promise<CategoryBudgetDetail[]> {
  const supabase = await createClient();

  const { startDate, endDate } = monthDateRange(month);

  const { data: budgets, error: budgetsError } = await supabase
    .from("budget_categorie")
    .select("categoria_id, importo, categorie(id, nome, emoji, colore_hex)");
  if (budgetsError) throw budgetsError;

  const categoriaIds = (budgets ?? []).map((b) => b.categoria_id);

  if (categoriaIds.length === 0) {
    return [];
  }

  const { data: movimenti, error: movimentiError } = await supabase
    .from("movimenti")
    .select("id, data, luogo, importo, categoria_id")
    .in("categoria_id", categoriaIds)
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: false });
  if (movimentiError) throw movimentiError;

  const movimentiByCategory = new Map<string, BudgetMovimento[]>();
  for (const m of movimenti ?? []) {
    const list = movimentiByCategory.get(m.categoria_id) ?? [];
    list.push({
      id: m.id,
      data: m.data,
      luogo: m.luogo,
      importo: Number(m.importo),
    });
    movimentiByCategory.set(m.categoria_id, list);
  }

  return (budgets ?? []).map((b) => {
    const cat = (b as unknown as { categorie: { id: string; nome: string; emoji: string; colore_hex: string } })
      .categorie;
    const catMovimenti = movimentiByCategory.get(b.categoria_id) ?? [];
    const speso = catMovimenti.reduce((sum, m) => sum + Math.abs(m.importo), 0);
    const budget = Number(b.importo);

    return {
      categoria_id: cat.id,
      nome: cat.nome,
      emoji: cat.emoji,
      colore_hex: cat.colore_hex,
      budget,
      speso,
      rimanente: budget - speso,
      movimenti: catMovimenti,
    };
  });
}
