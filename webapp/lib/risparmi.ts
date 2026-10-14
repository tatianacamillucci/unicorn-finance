import { createClient } from "@/lib/supabase/server";

export async function getRisparmioNetto(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("movimenti")
    .select("importo, categorie(tipo)")
    .eq("stato", "effettuato");
  if (error) throw error;

  return (data ?? []).reduce((sum, m) => {
    const tipo = (m as unknown as { categorie: { tipo: string } | null })
      .categorie?.tipo;
    const importo = Math.abs(Number(m.importo));
    return sum + (tipo === "entrata" ? importo : -importo);
  }, 0);
}
