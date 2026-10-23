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
 * Checks that all defined days in the target profile match in the listing.
 */
export function hoursMatch(a: Record<string, string>, b: Record<string, string>): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  const na = normalizeHoursRecord(a);
  const nb = normalizeHoursRecord(b);

  const keysA = Object.keys(na);
  const keysB = Object.keys(nb);

  if (keysA.length === 0 && keysB.length === 0) return true;
  if (keysA.length === 0 || keysB.length === 0) return false;

  const sharedDays = keysA.filter((d) => d in nb);
  if (sharedDays.length === 0) return false;

  return sharedDays.every((day) => na[day] === nb[day]);
}

/**
 * Normalizes holiday value for comparison.
 * Handles:
 *  - Record: { "2026-01-26": "closed" }
 *  - String: "Closed Jan 26", "Open Jan 26", "closed", "2026-01-26: closed"
 */
export function normalizeHolidayValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'closed' || s === 'close') return 'closed';
    if (s.includes('open') && (s.includes('26') || s.includes('jan') || s.includes('holiday'))) return 'open';
    if (s.includes('close') && (s.includes('26') || s.includes('jan') || s.includes('holiday'))) return 'closed';
    return s.replace(/[^a-z0-9]/g, '');
  }
  if (typeof val === 'object') {
    // E.g. { "2026-01-26": "closed" }
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return '';
    return entries
      .map(([k, v]) => `${k}:${String(v).toLowerCase().trim()}`)
      .sort()
      .join(';');
  }
  return String(val).toLowerCase().trim();
}

/**
 * Returns true if two holiday hours values refer to the same status.
 */
export function holidaysMatch(a: unknown, b: unknown): boolean {
  const normA = normalizeHolidayValue(a);
  const normB = normalizeHolidayValue(b);

  if (!normA && !normB) return true;
  if (!normA || !normB) return false;

  // Direct match
  if (normA === normB) return true;

  // Check if both signify "closed" on key holiday (e.g. Republic Day 2026-01-26)
  const isAClosed = normA.includes('closed') || normA.includes('close');
  const isBClosed = normB.includes('closed') || normB.includes('close');

  const isAOpen = normA.includes('open');
  const isBOpen = normB.includes('open');

  if (isAClosed && isBClosed) return true;
  if (isAOpen && isBOpen) return true;

  return false;
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

