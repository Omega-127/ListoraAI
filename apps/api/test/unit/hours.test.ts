/**
 * Unit tests for hours normalization.
 */
import { describe, it, expect } from 'vitest';
import { normalizeDayHours, hoursMatch, hoursDiff } from '../../src/normalization/hours';

describe('normalizeDayHours', () => {
  it('normalizes 24-hour range', () => {
    expect(normalizeDayHours('07:00-18:00')).toBe('07:00-18:00');
  });

  it('normalizes 12-hour am/pm range', () => {
    expect(normalizeDayHours('7am-6pm')).toBe('07:00-18:00');
  });

  it('normalizes mixed formats', () => {
    expect(normalizeDayHours('9:00 AM - 04:00 PM')).toBe('09:00-16:00');
  });

  it('handles closed', () => {
    expect(normalizeDayHours('closed')).toBe('closed');
  });

  it('handles open 24 hours', () => {
    expect(normalizeDayHours('open 24 hours')).toBe('open24');
  });
});

describe('hoursMatch', () => {
  it('matches equivalent hour formats', () => {
    const a = { monday: '07:00-18:00', tuesday: '07:00-18:00' };
    const b = { monday: '7am-6pm', tuesday: '7am-6pm' };
    expect(hoursMatch(a, b)).toBe(true);
  });

  it('returns false when hours differ', () => {
    const a = { monday: '07:00-18:00' };
    const b = { monday: '08:00-18:00' };
    expect(hoursMatch(a, b)).toBe(false);
  });

  it('only compares shared days', () => {
    const a = { monday: '07:00-18:00', sunday: '09:00-16:00' };
    const b = { monday: '7am-6pm' };
    expect(hoursMatch(a, b)).toBe(true); // only monday is shared
  });
});

describe('hoursDiff', () => {
  it('returns diffs for mismatched days', () => {
    const a = { monday: '07:00-18:00', friday: '07:00-20:00' };
    const b = { monday: '7am-6pm', friday: '7am-6pm' };
    const diffs = hoursDiff(a, b);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].day).toBe('friday');
  });

  it('returns empty array when all days match', () => {
    const hours = { monday: '07:00-18:00' };
    expect(hoursDiff(hours, hours)).toHaveLength(0);
  });
});
