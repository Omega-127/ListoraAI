/**
 * Unit tests for text normalization.
 */
import { describe, it, expect } from 'vitest';
import { normalizeText, textsMatch } from '../../src/normalization/text';

describe('normalizeText', () => {
  it('lowercases input', () => {
    expect(normalizeText('MAIN STREET')).toBe('main street');
  });

  it('trims whitespace', () => {
    expect(normalizeText('  Main Street  ')).toBe('main street');
  });

  it('expands St. to street', () => {
    expect(normalizeText('42 Maple St.')).toContain('street');
  });

  it('expands & to and', () => {
    expect(normalizeText('Brew & Bloom')).toContain('and');
  });

  it('normalizes café to cafe', () => {
    expect(normalizeText('Brew & Bloom Café')).toContain('cafe');
  });
});

describe('textsMatch', () => {
  it('matches addresses with abbreviations expanded', () => {
    expect(textsMatch('42 Maple Street, Springfield, IL 62701', '42 Maple St., Springfield, IL 62701')).toBe(true);
  });

  it('matches names with & vs and', () => {
    expect(textsMatch('Brew & Bloom Café', 'Brew and Bloom Cafe')).toBe(true);
  });

  it('returns false for genuinely different values', () => {
    expect(textsMatch('123 Main Street', '456 Oak Avenue')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(textsMatch('BREW AND BLOOM', 'brew and bloom')).toBe(true);
  });
});
