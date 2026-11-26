import { formatDate, formatNumber, formatPriceJod } from './format';

const EASTERN_DIGITS = /[٠-٩۰-۹]/;

describe('formatNumber (decision 0003: Western digits)', () => {
  it('uses Western digits on Arabic pages', () => {
    const value = formatNumber(1234567, 'ar');
    expect(value).not.toMatch(EASTERN_DIGITS);
    expect(value.replace(/\D/g, '')).toBe('1234567');
  });

  it('uses Western digits on English pages', () => {
    expect(formatNumber(24, 'en')).toBe('24');
  });
});

describe('formatPriceJod', () => {
  it('formats prices with Western digits in both languages', () => {
    for (const locale of ['ar', 'en'] as const) {
      const value = formatPriceJod(12.5, locale);
      expect(value).not.toMatch(EASTERN_DIGITS);
      expect(value).toContain('12.5');
    }
  });

  it('labels the currency in the page language', () => {
    expect(formatPriceJod(7, 'en')).toContain('JOD');
    expect(formatPriceJod(7, 'ar')).toContain('د.أ');
  });

  it('keeps up to three decimal places (fils)', () => {
    expect(formatPriceJod(0.125, 'en')).toContain('0.125');
  });
});

describe('formatDate', () => {
  it('writes the weekday and the date with Western digits, without direction marks', () => {
    expect(formatDate('2026-12-05', 'ar')).toBe('السبت 5/12/2026');
    expect(formatDate('2026-12-05', 'en')).toBe('Saturday 5 December 2026');
    expect(formatDate('2027-01-01', 'ar')).not.toMatch(EASTERN_DIGITS);
    expect(formatDate('2027-01-01', 'ar')).not.toMatch(new RegExp('[\u200E\u200F\u061C]'));
  });

  it('rejects anything but YYYY-MM-DD', () => {
    expect(() => formatDate('5/12/2026', 'en')).toThrow();
  });
});
