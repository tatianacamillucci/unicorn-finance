"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import {
  DOVE_CONTROLLARE,
  REGOLE_NORMATIVA,
  ULTIMO_CONTROLLO,
} from "@/lib/normativa";

export function NormativaLista() {
  const [aperta, setAperta] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setAperta(true)}
        className="w-full rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground"
      >
        Aggiornami sulla normativa
      </button>
      <p className="text-sm text-muted-foreground">
        In futuro questo pulsante cercherà da solo le novità.
      </p>

      {aperta && (
        <>
          <div className="flex flex-col gap-3">
            {REGOLE_NORMATIVA.map((r, i) => (
              <Panel key={r.id} index={i} title={r.titolo}>
                <p className="text-sm">{r.spiegazione}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ultimo controllo: {ULTIMO_CONTROLLO}
                  {r.daVerificare && " · da verificare con la commercialista"}
                </p>
                <a
                  href={r.fonteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-semibold underline"
                >
                  Fonte: {r.fonteNome}
                </a>
              </Panel>
            ))}
          </div>

          <Panel title="Dove controllare le novità">
            <ul className="flex flex-col gap-2">
              {DOVE_CONTROLLARE.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold underline"
                  >
                    {l.nome}
                  </a>
                  <span className="block text-xs text-muted-foreground">{l.descrizione}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
