"use client";

import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { calcolaAccantonamento, SOGLIA_FORFETTARIO } from "@/lib/fiscale";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

interface Props {
  incassato: number;
  coefficiente: number;
  aliquotaInps: number;
  aliquotaImposta: number;
  anno: number;
}

/** Solo una simulazione per mostrare i numeri: il calcolo vero si rifà sempre sul server. */
export function SimulatoreTasse({ incassato, coefficiente, aliquotaInps, aliquotaImposta, anno }: Props) {
  const [testo, setTesto] = React.useState("5000");
  const extra = Math.max(0, Number(testo.replace(",", ".")) || 0);
  const p = { coefficiente, aliquotaInps, aliquotaImposta };
  const ora = calcolaAccantonamento(incassato, p);
  const poi = calcolaAccantonamento(incassato + extra, p);
  const inPiu = Math.round((poi.totale - ora.totale) * 100) / 100;
  const totale = incassato + extra;

  return (
    <Panel title={`E se incasso ancora qualcosa nel ${anno}?`}>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Se incasso ancora (in euro) entro dicembre
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={100}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          className="w-full max-w-xs rounded-lg border-2 border-foreground/30 bg-background px-3 py-2 text-lg"
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Pagherai in tutto</p>
          <p className="text-2xl font-bold tabular-nums">{euro.format(poi.totale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Di cui INPS</p>
          <p className="text-2xl font-bold tabular-nums">{euro.format(poi.inps)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Di cui imposta</p>
          <p className="text-2xl font-bold tabular-nums">{euro.format(poi.imposta)}</p>
        </div>
      </div>
      <p className="mt-3 text-base">
        Con questi {euro.format(extra)} in più pagherai circa <strong>{euro.format(inPiu)}</strong> di tasse in più. Il
        resto è tuo.
      </p>
      {totale > SOGLIA_FORFETTARIO && (
        <p role="alert" className="mt-2 text-sm font-semibold">
          Attenzione: così superi gli 85.000 €. Parlane con la commercialista prima.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">È solo una stima. Da verificare con la commercialista.</p>
    </Panel>
  );
}
