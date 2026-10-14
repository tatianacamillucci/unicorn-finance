import type { HomeCategorySummary } from "@/lib/home-data";

export function CategoryBudgetList({ categories }: { categories: HomeCategorySummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {categories.map((c) => {
        const pct = c.budget > 0 ? Math.min((c.speso / c.budget) * 100, 100) : 0;
        return (
          <li key={c.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{c.emoji} {c.nome.toUpperCase()}</span>
              <span>€{c.speso.toFixed(0)}/€{c.budget.toFixed(0)}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.colore_hex }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
