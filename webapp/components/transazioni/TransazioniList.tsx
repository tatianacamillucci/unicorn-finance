import type { TransazioneRow } from "@/lib/transazioni-data";

function formatData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function formatImporto(importo: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(importo);
}

export function TransazioniList({ transazioni }: { transazioni: TransazioneRow[] }) {
  if (transazioni.length === 0) {
    return (
      <p className="rounded-2xl pastel-box bg-card text-card-foreground p-4 text-center text-sm font-bold text-muted-foreground">
        Nessuna transazione trovata.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {transazioni.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-2xl pastel-box bg-card text-card-foreground px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: t.categoria.colore_hex }}
            >
              {t.categoria.emoji}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">{t.categoria.nome}</span>
              <span className="text-xs text-muted-foreground">
                {t.luogo ? t.luogo : "—"} · {formatData(t.data)}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-sm font-black text-foreground">{formatImporto(t.importo)}</span>
        </li>
      ))}
    </ul>
  );
}
