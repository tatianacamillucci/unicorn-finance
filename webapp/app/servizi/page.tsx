import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getServizi } from "@/lib/servizi-data";
import { PageHeader } from "@/components/ui/page-header";
import { DbNonPronto } from "@/components/clienti/db-non-pronto";
import { ServiziView } from "@/components/servizi/ServiziView";

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const { pronto, servizi } = await getServizi();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-5xl lg:gap-6 lg:p-8">
      <PageHeader title="Servizi" subtitle="Il listino: cosa vendi e a che prezzo." />
      {!pronto ? <DbNonPronto /> : <ServiziView servizi={servizi} />}
    </main>
  );
}

export default function ServiziPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
