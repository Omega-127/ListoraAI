/**
 * Opening-hours normalization and comparison.
 *
 * Supports formats:
 *   "07:00-18:00", "7:00-18:00"
 *   "7am-6pm", "07:00 AM - 06:00 PM"
 *   "closed"
 *   "open 24 hours"
 *
 * Normalizes each time string to HH:MM-HH:MM (24-hour) or "closed" / "open24".
 */

type NormalizedDay = string; // "HH:MM-HH:MM" | "closed" | "open24" | "unknown"

function normalizeTimeToken(token: string): number | null {
  token = token.trim().toLowerCase();

  // Handle am/pm
  const ampm = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/.exec(token);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2] ?? '0', 10);
    const period = ampm[3];
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Handle HH:MM or H:MM
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(token);
  if (hhmm) {
    return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  }

  return null;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Normalizes a single day's hours string to a canonical form.
 */
export function normalizeDayHours(raw: string): NormalizedDay {
  if (!raw || typeof raw !== 'string') return 'unknown';
  const s = raw.trim().toLowerCase();
  if (s === 'closed' || s === 'close') return 'closed';
  if (s.includes('open 24') || s === '24hrs' || s === '24/7') return 'open24';

  // Split on "-" or "–" or " to "
  const parts = s.split(/\s*[-–]\s*|\bto\b/);
  if (parts.length !== 2) return 'unknown';

  const open = normalizeTimeToken(parts[0]);
  const close = normalizeTimeToken(parts[1]);
  if (open === null || close === null) return 'unknown';

  return `${minutesToHHMM(open)}-${minutesToHHMM(close)}`;
}

/**
 * Normalizes a week's worth of hours (record of day→string) to canonical form.
 */
export function normalizeHoursRecord(raw: Record<string, string>): Record<string, NormalizedDay> {
  const result: Record<string, NormalizedDay> = {};
  for (const [day, value] of Object.entries(raw)) {
    result[day.toLowerCase()] = normalizeDayHours(value);
  }
  return result;
}

/**
 * Returns true if two hours records are equivalent after normalization.
 * Only compares days that appear in BOTH records.
 */
export function hoursMatch(a: Record<string, string>, b: Record<string, string>): boolean {
  const na = normalizeHoursRecord(a);
  const nb = normalizeHoursRecord(b);

  const sharedDays = Object.keys(na).filter((d) => d in nb);
  if (sharedDays.length === 0) return true; // nothing to compare

  return sharedDays.every((day) => na[day] === nb[day]);
}

/**
 * Returns the set of days that differ between two hours records (after normalization).
 */
export function hoursDiff(
  a: Record<string, string>,
  b: Record<string, string>,
): Array<{ day: string; profileValue: string; listingValue: string }> {
  const na = normalizeHoursRecord(a);
  const nb = normalizeHoursRecord(b);

  const allDays = new Set([...Object.keys(na), ...Object.keys(nb)]);
  const diffs: Array<{ day: string; profileValue: string; listingValue: string }> = [];

  for (const day of allDays) {
    const va = na[day] ?? 'unknown';
    const vb = nb[day] ?? 'unknown';
    if (va !== vb) {
      diffs.push({ day, profileValue: va, listingValue: vb });
    }
  }

  return diffs;
}
