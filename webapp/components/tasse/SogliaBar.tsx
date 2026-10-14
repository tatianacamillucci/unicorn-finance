export function SogliaBar({ percentuale }: { percentuale: number }) {
  const p = Math.max(0, Math.min(100, percentuale));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      className="h-6 w-full overflow-hidden rounded-full border-2 border-foreground/30"
    >
      <div className="h-full bg-foreground transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}
