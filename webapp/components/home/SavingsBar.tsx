import Link from "next/link";

export function SavingsBar({
  risparmioNetto,
  obiettivoRisparmio,
}: {
  risparmioNetto: number;
  obiettivoRisparmio: number | null;
}) {
  if (!obiettivoRisparmio || obiettivoRisparmio <= 0) {
    return (
      <Link
        href="/impostazioni/profilo"
        className="rounded-2xl pastel-box bg-card text-card-foreground p-4 text-sm font-bold text-muted-foreground"
      >
        Imposta un obiettivo di risparmio nel tuo Profilo →
      </Link>
    );
  }

  const percentualeReale = (risparmioNetto / obiettivoRisparmio) * 100;
  const percentualeBarra = Math.min(Math.max(percentualeReale, 0), 100);

  return (
    <div className="rounded-2xl pastel-box bg-card text-card-foreground p-4">
      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
        I tuoi risparmi
      </p>
      <div className="mt-2 h-6 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentualeBarra}%` }}
        />
      </div>
      <p className="mt-1 text-right text-sm font-black text-foreground">
        {Math.round(percentualeReale)}%
      </p>
    </div>
  );
}
