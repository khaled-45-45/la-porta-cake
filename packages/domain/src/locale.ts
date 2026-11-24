import { z } from 'zod';

/** Supported site languages. Arabic is the default (decision 0003). */
export const LOCALES = ['ar', 'en'] as const;

export const localeSchema = z.enum(LOCALES);

export type Locale = z.infer<typeof localeSchema>;

export const DEFAULT_LOCALE: Locale = 'ar';

/** Text direction for a locale: Arabic is right-to-left, English left-to-right. */
export function directionFor(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isLocale(value: unknown): value is Locale {
  return localeSchema.safeParse(value).success;
}
