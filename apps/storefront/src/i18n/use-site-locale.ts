import { useLocale } from 'next-intl';

import type { Locale } from '@la-porta/domain/locale';
import { DEFAULT_LOCALE, isLocale } from '@la-porta/domain/locale';

/** The page's language as a site Locale ("ar" | "en"). Works in server and client components. */
export function useSiteLocale(): Locale {
  const locale = useLocale();
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
