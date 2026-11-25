// Locale constants and helpers, with no dependencies, so browser code can import them
// from "@la-porta/domain/locale" without pulling zod and the content schemas into the
// browser bundle. The zod schema for a locale lives in ./schemas/locale.ts.

/** Supported site languages. Arabic is the default (decision 0003). */
export const LOCALES = ['ar', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ar';

/** Text direction for a locale: Arabic is right-to-left, English left-to-right. */
export function directionFor(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
