"use client";

import { useState } from "react";
import { gmailComposeUrl, type ModelloEmail } from "@/lib/email-commercialista";
import { Panel } from "@/components/ui/panel";

interface Props {
  email: string;
  modelli: ModelloEmail[];
}

export function EmailModelli({ email, modelli }: Props) {
  const [testi, setTesti] = useState<Record<string, string>>(() =>
    Object.fromEntries(modelli.map((m) => [m.id, m.corpo])),
  );

  function apri(m: ModelloEmail) {
    const url = gmailComposeUrl(email, m.oggetto, testi[m.id] ?? m.corpo);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">La mail parte solo quando premi Invia in Gmail.</p>
      {!email && (
        <p className="text-sm text-muted-foreground">
          Senza l&apos;email salvata, Gmail si apre con il destinatario vuoto.
        </p>
      )}
      {modelli.map((m, i) => (
        <Panel key={m.id} index={i} title={m.titolo}>
          <textarea
            value={testi[m.id] ?? ""}
            onChange={(e) => setTesti((t) => ({ ...t, [m.id]: e.target.value }))}
            rows={6}
            aria-label={`Testo: ${m.titolo}`}
            className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => apri(m)}
            className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Apri in Gmail
          </button>
        </Panel>
      ))}
    </div>
  );
}
