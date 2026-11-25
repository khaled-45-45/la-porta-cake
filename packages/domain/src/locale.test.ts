import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES, directionFor, isLocale } from './locale';
import { localeSchema } from './schemas/locale';

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
    expect(isLocale('AR')).toBe(false);
    expect(isLocale(42)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('agrees with the locale schema', () => {
    for (const value of ['ar', 'en', 'fr', 'AR', '', 42, null, undefined]) {
      expect(isLocale(value)).toBe(localeSchema.safeParse(value).success);
    }
  });

  // Browser code imports this file through "@la-porta/domain/locale". Any import here
  // (zod in particular) would be shipped to every page.
  it('has no imports, so it stays small in the browser bundle', () => {
    const source = readFileSync(new URL('./locale.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
