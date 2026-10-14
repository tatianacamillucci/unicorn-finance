import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfilo } from "@/lib/profilo";
import { ProfiloForm } from "@/components/settings/ProfiloForm";

async function ProfiloContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const profilo = await getProfilo();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="font-black text-xl">Profilo</h1>
      <ProfiloForm
        nickname={profilo.nickname}
        obiettivoRisparmio={profilo.obiettivoRisparmio}
      />
    </main>
  );
}

export default function ProfiloPage() {
  return (
    <Suspense>
      <ProfiloContent />
    </Suspense>
  );
}
