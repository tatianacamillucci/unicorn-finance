"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatEuro, selectClass } from "@/components/clienti/format";
import { bolloDovuto } from "@/lib/fiscale";
import type { Servizio } from "@/lib/types/gestionale";

interface RigaForm {
  descrizione: string;
  quantita: string;
  prezzo: string;
}

const vuota = (): RigaForm => ({ descrizione: "", quantita: "1", prezzo: "" });
const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Righe di un documento: aggiungi/rimuovi, scelta rapida dal listino, totale (e bollo) in diretta.
 * Invia al form un campo nascosto `righe` (JSON). Importo e bollo veri li ricalcola il server.
 */
export function RigheEditor({ servizi, conBollo }: { servizi: Servizio[]; conBollo: boolean }) {
  const [righe, setRighe] = React.useState<RigaForm[]>([vuota()]);

  const pulite = righe
    .filter((r) => r.descrizione.trim() !== "" || num(r.prezzo) > 0)
    .map((r) => ({ descrizione: r.descrizione.trim(), quantita: num(r.quantita), prezzo: num(r.prezzo) }));
  const imponibile = pulite.reduce((t, r) => t + r.quantita * r.prezzo, 0);
  const bollo = conBollo ? bolloDovuto(imponibile) : 0;

  const cambia = (i: number, campo: keyof RigaForm, v: string) =>
    setRighe((rs) => rs.map((r, k) => (k === i ? { ...r, [campo]: v } : r)));

  function daListino(id: string) {
    const s = servizi.find((x) => x.id === id);
    if (!s) return;
    const nuova: RigaForm = { descrizione: s.nome, quantita: "1", prezzo: String(s.prezzo).replace(".", ",") };
    setRighe((rs) => {
      const ultimaVuota = rs.length === 1 && rs[0].descrizione === "" && rs[0].prezzo === "";
      return ultimaVuota ? [nuova] : [...rs, nuova];
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="righe" value={JSON.stringify(pulite)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Righe</p>
        {servizi.length > 0 && (
          <select
            aria-label="Aggiungi dal listino servizi"
            className={`${selectClass} max-w-xs`}
            value=""
            onChange={(e) => daListino(e.target.value)}
          >
            <option value="">Aggiungi dal listino...</option>
            {servizi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({formatEuro(s.prezzo)})
              </option>
            ))}
          </select>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {righe.map((r, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_5rem_7rem_6rem_auto] sm:items-center">
            <Input
              aria-label="Descrizione"
              placeholder="Descrizione"
              maxLength={200}
              value={r.descrizione}
              onChange={(e) => cambia(i, "descrizione", e.target.value)}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              aria-label="Quantità"
              inputMode="decimal"
              placeholder="Q.tà"
              value={r.quantita}
              onChange={(e) => cambia(i, "quantita", e.target.value)}
            />
            <Input
              aria-label="Prezzo unitario in euro"
              inputMode="decimal"
              placeholder="Prezzo €"
              value={r.prezzo}
              onChange={(e) => cambia(i, "prezzo", e.target.value)}
            />
            <p className="text-right text-sm tabular-nums">{formatEuro(num(r.quantita) * num(r.prezzo))}</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Rimuovi riga"
              disabled={righe.length === 1}
              onClick={() => setRighe((rs) => rs.filter((_, k) => k !== i))}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>

      <div>
        <Button type="button" size="sm" variant="outline" onClick={() => setRighe((rs) => [...rs, vuota()])}>
          <Plus /> Aggiungi riga
        </Button>
      </div>

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Imponibile</dt>
          <dd className="tabular-nums">{formatEuro(imponibile)}</dd>
        </div>
        {conBollo && (
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">Bollo (lo calcola il sistema)</dt>
            <dd className="tabular-nums">{formatEuro(bollo)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-6 border-t pt-1 font-bold">
          <dt>Totale</dt>
          <dd className="tabular-nums">{formatEuro(imponibile + bollo)}</dd>
        </div>
      </dl>
    </div>
  );
}
