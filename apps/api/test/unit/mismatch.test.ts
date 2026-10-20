/**
 * Unit tests for mismatch detection logic.
 */
import { describe, it, expect } from 'vitest';
import { detectFieldMismatches } from '../../src/services/mismatch.service';

const BASE_PROFILE = {
  name: 'Brew & Bloom Café',
  address: '42 Maple Street, Springfield, IL 62701',
  phone: '+15550102234',
  regularHours: { monday: '07:00-18:00', friday: '07:00-20:00' },
  holidayHours: { '2026-12-25': 'closed' },
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const RECENT_FETCH = new Date('2026-06-01T00:00:00Z');
const OLD_FETCH = new Date('2025-12-01T00:00:00Z'); // before profile was updated

describe('detectFieldMismatches', () => {
  it('returns OK when all fields match', () => {
    const values = {
      name: 'Brew & Bloom Café',
      address: '42 Maple Street, Springfield, IL 62701',
      phone: '+15550102234',
      regularHours: { monday: '07:00-18:00', friday: '07:00-20:00' },
      holidayHours: { '2026-12-25': 'closed' },
    };
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    expect(results.every((r) => r.kind === 'OK')).toBe(true);
  });

  it('detects MISSING when field value is empty', () => {
    const values = { name: 'Brew & Bloom Café', phone: '' };
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    const phoneMismatch = results.find((r) => r.field === 'phone');
    expect(phoneMismatch?.kind).toBe('MISSING');
  });

  it('detects CONFLICTING when values differ and listing is recent', () => {
    const values = { name: 'Different Café Name' };
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    const nameMismatch = results.find((r) => r.field === 'name');
    expect(nameMismatch?.kind).toBe('CONFLICTING');
  });

  it('detects OUTDATED when listing is older than profile update', () => {
    const values = { name: 'Old Name' };
    const results = detectFieldMismatches(BASE_PROFILE, values, OLD_FETCH);
    const nameMismatch = results.find((r) => r.field === 'name');
    expect(nameMismatch?.kind).toBe('OUTDATED');
  });

  it('only checks fields present in listing values', () => {
    const values = { name: 'Brew & Bloom Café' }; // only name present
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    expect(results).toHaveLength(1);
    expect(results[0].field).toBe('name');
  });

  it('matches phone numbers in different formats', () => {
    const values = { phone: '(555) 010-2234' };
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    expect(results[0].kind).toBe('OK');
  });

  it('matches addresses with abbreviated St.', () => {
    const values = { address: '42 Maple St., Springfield, IL 62701' };
    const results = detectFieldMismatches(BASE_PROFILE, values, RECENT_FETCH);
    expect(results[0].kind).toBe('OK');
  });
});
