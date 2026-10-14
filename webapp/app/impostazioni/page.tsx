import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cookieDemoAttivo, dbPronto } from "@/lib/demo/mode";
import { DemoToggleButton } from "@/components/demo/DemoToggleButton";

const SECTIONS = [
  { href: "/impostazioni/fiscale", emoji: "🧾", label: "Profilo fiscale", desc: "Aliquote, ATECO, data di apertura e conto per le tasse." },
  { href: "/impostazioni/conti", emoji: "🏦", label: "Conti", desc: "I tuoi conti e a cosa serve ciascuno." },
  { href: "/impostazioni/categorie", emoji: "🏷️", label: "Categorie", desc: "Come raggruppi entrate e spese." },
  { href: "/impostazioni/budget", emoji: "📊", label: "Budget", desc: "Quanto vuoi spendere al massimo per categoria." },
  { href: "/impostazioni/ricorrenze", emoji: "🔁", label: "Ricorrenze", desc: "Spese ed entrate che si ripetono ogni mese." },
  { href: "/impostazioni/profilo", emoji: "🙋", label: "Profilo", desc: "Il tuo nome e l'obiettivo di risparmio." },
];

async function ImpostazioniContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const demoAttivo = await cookieDemoAttivo();
  const pronto = await dbPronto();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-3xl lg:gap-6 lg:p-8">
      <PageHeader title="Impostazioni" subtitle="Qui sistemi i dati su cui si basa tutto il resto." />

      <div className="flex flex-col gap-3">
        {SECTIONS.map((section, i) => (
          <Link key={section.href} href={section.href}>
            <Panel index={i} className="flex items-center gap-3 transition-colors hover:bg-accent">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                {section.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{section.label}</span>
                <span className="block text-sm text-muted-foreground">{section.desc}</span>
              </span>
            </Panel>
          </Link>
        ))}

        <Panel index={SECTIONS.length} className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-semibold">Tema</span>
            <span className="block text-sm text-muted-foreground">Chiaro o scuro.</span>
          </span>
          <ThemeToggle withLabel />
        </Panel>

        <Panel index={SECTIONS.length + 1} title="Dati di esempio">
          <p className="mb-3 text-sm text-muted-foreground">
            {pronto
              ? "Mostra clienti, fatture e incassi inventati per vedere come funziona il gestionale. Non tocca i tuoi dati veri e non si può modificare nulla."
              : "Il database non è ancora pronto, quindi stai già vedendo i dati di esempio."}
          </p>
          {pronto &&
            (demoAttivo ? (
              <DemoToggleButton azione="disattiva">Disattiva i dati di esempio</DemoToggleButton>
            ) : (
              <DemoToggleButton azione="attiva">Attiva i dati di esempio</DemoToggleButton>
            ))}
        </Panel>
      </div>
    </main>
  );
}

export default function ImpostazioniPage() {
  return (
    <Suspense>
      <ImpostazioniContent />
    </Suspense>
  );
}
