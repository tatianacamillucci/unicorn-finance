import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { getFatture } from "@/lib/fatture-data";
import { getIncassiData } from "@/lib/incassi-data";
import { getTasseData } from "@/lib/tasse-data";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ContattoForm } from "@/components/commercialista/ContattoForm";
import { EmailModelli } from "@/components/commercialista/EmailModelli";
import {
  intervalloTrimestre,
  modelloRiepilogoTrimestre,
  trimestreDi,
} from "@/components/commercialista/riepilogo";
import {
  COMMERCIALISTA_SUGGERITA,
  modelliEmail,
  whatsappEmailRequestUrl,
} from "@/lib/email-commercialista";

const MAIN = "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 lg:max-w-3xl lg:gap-6 lg:p-8";

/** Contatto precompilato mostrato in modalità esempio (email volutamente vuota). */
const CONTATTO_DEMO = {
  nome: "Laura Bianchi",
  telefono: "328 414 8941",
  email: "",
  studio: "Studio a Pesaro",
};

async function numeriTrimestre(oggi: string) {
  const anno = Number(oggi.slice(0, 4));
  const t = trimestreDi(oggi);
  const { da, a } = intervalloTrimestre(anno, t);
  const [fat, inc, tasse] = await Promise.all([getFatture(), getIncassiData(), getTasseData(anno)]);
  const fatturato = fat.fatture
    .filter(
      (f) =>
        (f.stato === "emessa" || f.stato === "incassata") &&
        f.data_emissione !== null &&
        f.data_emissione >= da &&
        f.data_emissione <= a,
    )
    .reduce((s, f) => s + f.importo, 0);
  const incassato = inc.incassi.filter((i) => i.data >= da && i.data <= a).reduce((s, i) => s + i.importo, 0);
  const bolli = tasse.bollo.find((b) => b.trimestre === t)?.totale ?? 0;
  return { trimestre: t, anno, fatturato, incassato, bolli };
}

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/auth/login");
  }

  const demo = await isDemo();
  let nome = "";
  let telefono = "";
  let email = "";

  if (demo) {
    ({ nome, telefono, email } = CONTATTO_DEMO);
  } else {
    const { data: riga, error } = await supabase
      .from("profilo_fiscale")
      .select("commercialista_nome, commercialista_telefono, commercialista_email")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (error) {
      logServerError("CommercialistaContent", error);
      return (
        <main className={MAIN}>
          <PageHeader title="Commercialista" subtitle="Contatti e modelli di email." />
          <Panel title="Il database non è ancora pronto">
            <p className="text-sm text-muted-foreground">
              Manca un aggiornamento del database. Quando sarà applicato, potrai salvare qui i contatti.
            </p>
          </Panel>
        </main>
      );
    }
    nome = riga?.commercialista_nome ?? "";
    telefono = riga?.commercialista_telefono ?? "";
    email = riga?.commercialista_email ?? "";
  }

  const telHref = `tel:${(telefono || COMMERCIALISTA_SUGGERITA.telefono).replace(/[^0-9+]/g, "")}`;

  const oggi = new Date().toISOString().slice(0, 10);
  const modelli = modelliEmail(nome);
  try {
    modelli.unshift(modelloRiepilogoTrimestre(await numeriTrimestre(oggi), nome));
  } catch (e) {
    logServerError("CommercialistaContent.riepilogo", e);
  }

  return (
    <main className={MAIN}>
      <PageHeader title="Commercialista" subtitle="Contatti e modelli di email." />

      {!email && (
        <Panel color="giallo" title="Chiedi l'email alla commercialista">
          <p className="text-sm text-muted-foreground">
            Non hai ancora salvato la sua email. Puoi chiamarla o scriverle su WhatsApp per chiederla.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={telHref}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Chiama
            </a>
            <a
              href={whatsappEmailRequestUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold"
            >
              Scrivi su WhatsApp
            </a>
          </div>
        </Panel>
      )}

      <Panel title="Contatto">
        {demo && (
          <p className="mb-3 text-sm text-muted-foreground">
            {CONTATTO_DEMO.studio}. Per salvare i tuoi contatti esci dagli esempi.
          </p>
        )}
        <ContattoForm nome={nome} telefono={telefono} email={email} />
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Scrivile una mail</h2>
        <EmailModelli email={email} modelli={modelli} />
      </section>
    </main>
  );
}

export default function CommercialistaPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
