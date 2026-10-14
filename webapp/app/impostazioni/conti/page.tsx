import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ContoForm } from "@/components/settings/ContoForm";
import { DeleteContoButton } from "@/components/settings/DeleteContoButton";

async function ContiContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { data: conti, error } = await supabase
    .from("conti")
    .select("id, nome, tipo, saldo_iniziale, colore_hex, icona_emoji")
    .order("nome");
  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="font-black text-xl">Conti</h1>

      <div className="flex flex-col gap-3">
        {(conti ?? []).map((conto) => (
          <div
            key={conto.id}
            className="flex items-center justify-between gap-3 rounded-2xl pastel-box bg-card text-card-foreground p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: conto.colore_hex }}
              >
                {conto.icona_emoji}
              </span>
              <div>
                <p className="font-black">{conto.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {conto.tipo} · {conto.saldo_iniziale}
                </p>
              </div>
            </div>
            <DeleteContoButton contoId={conto.id} />
          </div>
        ))}
        {(conti ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun conto ancora creato.</p>
        )}
      </div>

      <ContoForm />
    </main>
  );
}

export default function ContiPage() {
  return (
    <Suspense>
      <ContiContent />
    </Suspense>
  );
}
