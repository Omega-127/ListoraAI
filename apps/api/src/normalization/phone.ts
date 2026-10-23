/**
 * Phone number normalization.
 * Converts any phone string to E.164 format for comparison.
 * Returns null if the string cannot be parsed as a valid phone number.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalizes a phone string to E.164.
 * Uses 'IN' as default country code, falling back to 'US' or 'GB'.
 */
export function normalizePhone(raw: string, defaultCountry: 'IN' | 'US' | 'GB' = 'US'): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  if (trimmed.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(trimmed);
    if (parsed && parsed.isPossible()) return parsed.format('E.164');
  }

  if (trimmed.startsWith('0')) {
    const parsedIn = parsePhoneNumberFromString(trimmed, 'IN');
    if (parsedIn && parsedIn.isPossible()) return parsedIn.format('E.164');
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (parsed && parsed.isPossible()) return parsed.format('E.164');

  const fallbackCountry = defaultCountry === 'US' ? 'IN' : 'US';
  const fallback = parsePhoneNumberFromString(trimmed, fallbackCountry);
  if (fallback && fallback.isPossible()) return fallback.format('E.164');

  return null;
}

/**
 * Returns true if two phone strings refer to the same number after E.164 normalization.
 */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb;
}
