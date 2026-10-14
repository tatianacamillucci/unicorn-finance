import { createClient } from "@/lib/supabase/server";
import { monthDateRange } from "@/lib/month-range";

export interface TransazioneRow {
  id: string;
  data: string;
  luogo: string | null;
  importo: number;
  categoria: { nome: string; emoji: string; colore_hex: string };
}

export interface TransazioneFilters {
  categoriaId?: string;
  contoId?: string;
  month?: string; // "YYYY-MM"
}

export async function getTransazioni(filters: TransazioneFilters = {}): Promise<TransazioneRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("movimenti")
    .select("id, data, luogo, importo, categorie(nome, emoji, colore_hex)")
    .order("data", { ascending: false });

  if (filters.categoriaId) {
    query = query.eq("categoria_id", filters.categoriaId);
  }
  if (filters.contoId) {
    query = query.eq("conto_id", filters.contoId);
  }
  if (filters.month) {
    const { startDate, endDate } = monthDateRange(filters.month);
    query = query.gte("data", startDate).lte("data", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      data: string;
      luogo: string | null;
      importo: number;
      categorie: { nome: string; emoji: string; colore_hex: string };
    };
    return {
      id: r.id,
      data: r.data,
      luogo: r.luogo,
      importo: Number(r.importo),
      categoria: r.categorie,
    };
  });
}

export interface FilterOption {
  id: string;
  nome: string;
  emoji?: string;
}

export async function getCategorieOptions(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categorie").select("id, nome, emoji").order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function getContiOptions(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("conti").select("id, nome").order("nome");
  if (error) throw error;
  return data ?? [];
}
