import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { NormativaLista } from "@/components/normativa/NormativaLista";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-3xl lg:gap-6 lg:p-8">
      <PageHeader title="Normativa" subtitle="Le regole del forfettario, spiegate in modo semplice." />
      <NormativaLista />
    </main>
  );
}

export default function NormativaPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
