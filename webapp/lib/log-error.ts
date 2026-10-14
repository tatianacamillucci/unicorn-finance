/**
 * Logs the full error server-side (captured by Vercel's function logs) and
 * never reaches the client. Server Actions must return a generic message to
 * the caller instead of `error.message` — raw Postgres/Supabase errors can
 * leak schema/implementation details to the browser.
 */
export function logServerError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message);
}
