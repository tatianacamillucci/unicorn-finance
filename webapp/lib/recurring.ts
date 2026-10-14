import { createClient } from "@/lib/supabase/server";

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function addMonths(yearMonth: string, n: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * For every active monthly ricorrenza, creates any missing "movimenti" rows
 * whose scheduled date has already passed (today included), up to a 36-month
 * catch-up cap per ricorrenza. Runs on Home page load — this app has no
 * scheduled/cron infrastructure, so "auto-post on next view" is the
 * practical trigger. Idempotent: re-running never creates duplicates,
 * since each occurrence is checked against `ricorrente_id` + `data` first.
 */
export async function reconcileRicorrenzeMensili(): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  const userId = userData.user.id;

  const today = new Date().toISOString().slice(0, 10);

  const { data: ricorrenze, error: ricorrenzeError } = await supabase
    .from("ricorrenti")
    .select(
      "id, nome, conto_id, categoria_id, importo, giorno_del_mese, data_inizio, data_fine",
    )
    .eq("attivo", true)
    .eq("frequenza", "mensile");
  if (ricorrenzeError) throw ricorrenzeError;
  if (!ricorrenze || ricorrenze.length === 0) return;

  for (const r of ricorrenze) {
    const giorno = r.giorno_del_mese ?? 1;
    let cursorMonth = r.data_inizio.slice(0, 7);
    const todayMonth = today.slice(0, 7);
    const endMonth = r.data_fine ? r.data_fine.slice(0, 7) : todayMonth;
    const lastMonth = endMonth < todayMonth ? endMonth : todayMonth;

    let iterations = 0;
    while (cursorMonth <= lastMonth && iterations < 36) {
      iterations++;
      const [y, m] = cursorMonth.split("-").map(Number);
      const day = Math.min(giorno, lastDayOfMonth(y, m));
      const occurrenceDate = `${cursorMonth}-${String(day).padStart(2, "0")}`;

      if (occurrenceDate <= today) {
        const { data: existing, error: existingError } = await supabase
          .from("movimenti")
          .select("id")
          .eq("ricorrente_id", r.id)
          .eq("data", occurrenceDate)
          .maybeSingle();
        if (existingError) throw existingError;

        if (!existing) {
          const { error: insertError } = await supabase
            .from("movimenti")
            .insert({
              user_id: userId,
              data: occurrenceDate,
              conto_id: r.conto_id,
              categoria_id: r.categoria_id,
              descrizione: r.nome,
              importo: r.importo,
              stato: "effettuato",
              ricorrente_id: r.id,
            });
          if (insertError) throw insertError;
        }
      }

      cursorMonth = addMonths(cursorMonth, 1);
    }
  }
}
