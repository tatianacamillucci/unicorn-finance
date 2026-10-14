import { createClient } from "@/lib/supabase/server";
import { cookieDemoAttivo, dbPronto, isDemo } from "@/lib/demo/mode";
import { DemoToggleButton } from "@/components/demo/DemoToggleButton";

/** Striscia sottile in cima al contenuto quando si vedono dati di esempio. Server Component: montarlo dentro <Suspense>. */
export async function DemoBanner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;
  if (!(await isDemo())) return null;

  const pronto = await dbPronto();
  const cookieAttivo = await cookieDemoAttivo();

  return (
    <div
      role="status"
      className="demo-banner flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[var(--pastel-giallo)] bg-[color-mix(in_srgb,var(--pastel-giallo)_22%,transparent)] px-4 py-1.5 text-sm"
    >
      <span>
        {pronto || cookieAttivo
          ? "Stai guardando dati di esempio"
          : "Stai guardando dati di esempio (il database non è ancora pronto)"}
      </span>
      {pronto && cookieAttivo && (
        <DemoToggleButton azione="disattiva" className="px-2 py-0.5 text-xs">
          Esci dagli esempi
        </DemoToggleButton>
      )}
    </div>
  );
}
