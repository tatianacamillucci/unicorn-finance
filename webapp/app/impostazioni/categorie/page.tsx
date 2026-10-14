import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CategoriaForm } from "@/components/settings/CategoriaForm";
import { DeleteCategoriaButton } from "@/components/settings/DeleteCategoriaButton";

async function CategorieContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { data: categorie, error } = await supabase
    .from("categorie")
    .select("id, nome, tipo, colore_hex, emoji")
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="font-black text-xl">Categorie</h1>

      <div className="flex flex-col gap-3">
        {(categorie ?? []).map((categoria) => (
          <div
            key={categoria.id}
            className="flex items-center justify-between gap-3 rounded-2xl pastel-box bg-card text-card-foreground p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: categoria.colore_hex }}
              >
                {categoria.emoji}
              </span>
              <div>
                <p className="font-black">{categoria.nome}</p>
                <p className="text-sm text-muted-foreground">{categoria.tipo}</p>
              </div>
            </div>
            <DeleteCategoriaButton categoriaId={categoria.id} />
          </div>
        ))}
        {(categorie ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nessuna categoria ancora creata.</p>
        )}
      </div>

      <CategoriaForm />
    </main>
  );
}

export default function CategoriePage() {
  return (
    <Suspense>
      <CategorieContent />
    </Suspense>
  );
}
