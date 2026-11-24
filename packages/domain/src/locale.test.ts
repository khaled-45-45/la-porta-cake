import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES, directionFor, isLocale } from './locale';

describe('locale', () => {
  it('supports Arabic and English, with Arabic as the default', () => {
    expect(LOCALES).toEqual(['ar', 'en']);
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  it('gives Arabic a right-to-left direction and English left-to-right', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });

  it('recognises only supported locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
