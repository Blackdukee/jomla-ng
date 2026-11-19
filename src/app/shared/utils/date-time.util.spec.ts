import { describe, it, expect } from 'vitest';
import {
  normalizeUtc,
  parseUtcDate,
  formatCairoDate,
  formatCairoDateTime
} from './date-time.util';

describe('date-time.util', () => {
  describe('normalizeUtc', () => {
    it('preserves timestamps that already end with Z or an explicit timezone offset', () => {
      expect(normalizeUtc('2026-05-01T14:30:00Z')).toBe('2026-05-01T14:30:00Z');
      expect(normalizeUtc('2026-05-01T14:30:00+02:00')).toBe('2026-05-01T14:30:00+02:00');
      expect(normalizeUtc('2026-05-01T14:30:00-05:00')).toBe('2026-05-01T14:30:00-05:00');
    });

    it('normalizes naive space-separated and fractional timestamps to ISO UTC', () => {
      expect(normalizeUtc('2026-05-01 14:30:00.123456')).toBe('2026-05-01T14:30:00Z');
      expect(normalizeUtc('2026-05-01T14:30:00')).toBe('2026-05-01T14:30:00Z');
    });
  });

  describe('parseUtcDate', () => {
    it('returns null for null, undefined, empty, or invalid strings', () => {
      expect(parseUtcDate(null)).toBeNull();
      expect(parseUtcDate(undefined)).toBeNull();
      expect(parseUtcDate('')).toBeNull();
      expect(parseUtcDate('not-a-date')).toBeNull();
    });

    it('parses valid UTC timestamps into Date instances', () => {
      const parsed = parseUtcDate('2026-05-01 14:30:00');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe('2026-05-01T14:30:00.000Z');
    });
  });

  describe('formatCairoDate', () => {
    it('returns empty string for null, undefined, or invalid input', () => {
      expect(formatCairoDate(null)).toBe('');
      expect(formatCairoDate(undefined)).toBe('');
      expect(formatCairoDate('invalid')).toBe('');
    });

    it('formats UTC timestamp in Africa/Cairo timezone across midnight boundary', () => {
      // 2026-01-15T22:30:00Z is 2026-01-16 00:30 in Africa/Cairo (UTC+2)
      const formatted = formatCairoDate('2026-01-15T22:30:00Z');
      expect(formatted).toBe('Jan 16, 2026');
    });

    it('respects custom Intl.DateTimeFormatOptions overrides', () => {
      const formatted = formatCairoDate('2026-01-15T12:00:00Z', { month: 'long' });
      expect(formatted).toContain('January');
      expect(formatted).toContain('2026');
    });
  });

  describe('formatCairoDateTime', () => {
    it('returns empty string for null or invalid input', () => {
      expect(formatCairoDateTime(null)).toBe('');
      expect(formatCairoDateTime('bad-date')).toBe('');
    });

    it('formats time in Africa/Cairo without mislabeling as UTC', () => {
      const result = formatCairoDateTime('2026-01-15T22:30:00Z');
      expect(result).toContain('Jan 16');
      expect(result).toContain('12:30 AM');
      expect(result).not.toContain('UTC');
    });

    it('includes year when includeYear is true', () => {
      const withYear = formatCairoDateTime('2026-01-15T12:00:00Z', true);
      expect(withYear).toContain('2026');
    });
  });
});
