import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { RicorrenzaForm } from "@/components/settings/RicorrenzaForm";
import { ToggleRicorrenzaAttivaButton } from "@/components/settings/ToggleRicorrenzaAttivaButton";
import { EditRicorrenzaSheet } from "@/components/settings/EditRicorrenzaSheet";

async function RicorrenzeContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { data: ricorrenze, error } = await supabase
    .from("ricorrenti")
    .select(
      "id, nome, importo, giorno_del_mese, data_inizio, attivo, conto_id, categoria_id, conti(nome), categorie(nome, emoji)",
    )
    .order("attivo", { ascending: false })
    .order("nome", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  const { data: contiRows, error: contiError } = await supabase
    .from("conti")
    .select("id, nome")
    .order("nome");
  if (contiError) {
    throw new Error(contiError.message);
  }

  const { data: categorieRows, error: categorieError } = await supabase
    .from("categorie")
    .select("id, nome, emoji")
    .order("nome");
  if (categorieError) {
    throw new Error(categorieError.message);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="font-black text-xl">Ricorrenze</h1>
      <p className="text-sm text-muted-foreground">
        Spese o entrate mensili (es. abbonamenti, stipendio) che si registrano
        da sole al giorno indicato.
      </p>

      <div className="flex flex-col gap-3">
        {(ricorrenze ?? []).map((r) => {
          const conto = (r as unknown as { conti: { nome: string } | null })
            .conti;
          const categoria = (
            r as unknown as {
              categorie: { nome: string; emoji: string } | null;
            }
          ).categorie;
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-3 rounded-2xl pastel-box bg-card text-card-foreground p-4 ${
                r.attivo ? "" : "opacity-60"
              }`}
            >
              <div>
                <p className="font-black">
                  {categoria?.emoji} {r.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  € {Number(r.importo).toFixed(2)} · giorno {r.giorno_del_mese}
                  {conto ? ` · ${conto.nome}` : ""}
                </p>
                {!r.attivo && (
                  <p className="text-xs font-bold text-destructive">
                    Disattivata
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <EditRicorrenzaSheet
                  ricorrenza={{
                    id: r.id,
                    nome: r.nome,
                    importo: Number(r.importo),
                    conto_id: r.conto_id,
                    categoria_id: r.categoria_id,
                    giorno_del_mese: r.giorno_del_mese,
                    data_inizio: r.data_inizio,
                  }}
                  conti={contiRows ?? []}
                  categorie={categorieRows ?? []}
                />
                <ToggleRicorrenzaAttivaButton
                  ricorrenzaId={r.id}
                  attivo={r.attivo}
                />
              </div>
            </div>
          );
        })}
        {(ricorrenze ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nessuna ricorrenza ancora creata.
          </p>
        )}
      </div>

      <RicorrenzaForm conti={contiRows ?? []} categorie={categorieRows ?? []} />
    </main>
  );
}

export default function RicorrenzePage() {
  return (
    <Suspense>
      <RicorrenzeContent />
    </Suspense>
  );
}
