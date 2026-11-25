import { formatNumber, formatPriceJod } from './format';

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
