import { createClient } from "@/lib/supabase/server";
import { monthDateRange } from "@/lib/month-range";

export async function getEntratePrevisteMese(month: string): Promise<number> {
  const supabase = await createClient();
  const { startDate, endDate } = monthDateRange(month);

  const { data, error } = await supabase
    .from("ricorrenti")
    .select("importo, data_inizio, data_fine, categorie(tipo)")
    .eq("attivo", true)
    .eq("frequenza", "mensile")
    .lte("data_inizio", endDate);
  if (error) throw error;

  return (data ?? [])
    .filter((r) => {
      const tipo = (r as unknown as { categorie: { tipo: string } | null })
        .categorie?.tipo;
      if (tipo !== "entrata") return false;
      if (r.data_fine && r.data_fine < startDate) return false;
      return true;
    })
    .reduce((sum, r) => sum + Number(r.importo), 0);
}
