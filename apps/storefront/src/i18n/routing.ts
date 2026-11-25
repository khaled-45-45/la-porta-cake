import { defineRouting } from 'next-intl/routing';

import { DEFAULT_LOCALE, LOCALES } from '@la-porta/domain/locale';

/**
 * Locale routing (decisions 0003 and 0012).
 * - Every page lives under /ar/... or /en/...; `/` redirects (307) to /ar.
 * - No language detection and no locale cookie: the URL alone decides the language.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
});
