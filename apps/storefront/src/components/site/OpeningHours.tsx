import { useTranslations } from 'next-intl';

import type { OpeningHours } from '@la-porta/domain';

import { useSiteLocale } from '@/i18n/use-site-locale';
import { formatTimeOfDay } from '@/lib/format';

const DAY_KEYS = { daily: 'daily', 'sat-thu': 'satThu', fri: 'fri' } as const;

/**
 * The store's opening hours as sentences, one per entry, with Western digits:
 * "ساعات العمل: يوميًا من 11 ص إلى 11 م" / "Hours: every day, 11 AM to 11 PM".
 * Shared by the footer and the home page, so the wording stays the same.
 */
export function useOpeningHoursLines(hours: readonly OpeningHours[]): string[] {
  const t = useTranslations('Footer');
  const locale = useSiteLocale();
  return hours.map((h) =>
    t('hours', {
      days: t(`days.${DAY_KEYS[h.days]}`),
      opens: formatTimeOfDay(h.opens, locale),
      closes: formatTimeOfDay(h.closes, locale),
    }),
  );
}
