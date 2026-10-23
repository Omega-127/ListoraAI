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
export function normalizePhone(raw: string, defaultCountry: 'IN' | 'US' | 'GB' = 'IN'): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const parsed = parsePhoneNumberFromString(raw.trim(), defaultCountry);
  if (!parsed || !parsed.isPossible()) return null;
  return parsed.format('E.164');
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
