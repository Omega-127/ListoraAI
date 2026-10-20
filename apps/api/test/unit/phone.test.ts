/**
 * Unit tests for phone normalization.
 */
import { describe, it, expect } from 'vitest';
import { normalizePhone, phonesMatch } from '../../src/normalization/phone';

describe('normalizePhone', () => {
  it('normalizes US phone to E.164', () => {
    expect(normalizePhone('(555) 010-2234')).toBe('+15550102234');
  });

  it('accepts E.164 input unchanged', () => {
    expect(normalizePhone('+15550102234')).toBe('+15550102234');
  });

  it('normalizes dashes format', () => {
    expect(normalizePhone('555-010-2234')).toBe('+15550102234');
  });

  it('returns null for clearly invalid input', () => {
    expect(normalizePhone('not-a-phone')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizePhone('')).toBeNull();
  });
});

describe('phonesMatch', () => {
  it('matches equivalent phone formats', () => {
    expect(phonesMatch('(555) 010-2234', '+1 555 010 2234')).toBe(true);
  });

  it('matches E.164 against formatted', () => {
    expect(phonesMatch('+15550102234', '555-010-2234')).toBe(true);
  });

  it('returns false for different numbers', () => {
    expect(phonesMatch('+15550102234', '+15550102235')).toBe(false);
  });

  it('returns false when either is invalid', () => {
    expect(phonesMatch('not-a-phone', '+15550102234')).toBe(false);
  });
});
