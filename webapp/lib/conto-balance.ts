import { createClient } from "@/lib/supabase/server";

export interface ContoSaldo {
  id: string;
  nome: string;
  saldo: number;
}

export async function getSaldiConti(): Promise<{
  conti: ContoSaldo[];
  totale: number;
}> {
  const supabase = await createClient();

  const { data: conti, error: contiError } = await supabase
    .from("conti")
    .select("id, nome, saldo_iniziale")
    .order("nome");
  if (contiError) throw contiError;

  const { data: movimenti, error: movimentiError } = await supabase
    .from("movimenti")
    .select("conto_id, importo, categorie(tipo)")
    .eq("stato", "effettuato");
  if (movimentiError) throw movimentiError;

  const deltaByConto = new Map<string, number>();
  for (const m of movimenti ?? []) {
    const tipo = (m as unknown as { categorie: { tipo: string } | null })
      .categorie?.tipo;
    const importo = Math.abs(Number(m.importo));
    const delta = tipo === "entrata" ? importo : -importo;
    deltaByConto.set(m.conto_id, (deltaByConto.get(m.conto_id) ?? 0) + delta);
  }

  const result: ContoSaldo[] = (conti ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    saldo: Number(c.saldo_iniziale) + (deltaByConto.get(c.id) ?? 0),
  }));

  return {
    conti: result,
    totale: result.reduce((sum, c) => sum + c.saldo, 0),
  };
}
