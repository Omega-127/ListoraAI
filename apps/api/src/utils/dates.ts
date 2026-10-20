/** Date/time utilities */

/** Returns today's date as YYYY-MM-DD in UTC */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns whether a given YYYY-MM-DD string is today (UTC) */
export function isToday(dateStr: string): boolean {
  return dateStr === todayISO();
}

/** Formats an ISO timestamp for display */
export function formatTs(ts: string | Date): string {
  return new Date(ts).toISOString();
}
