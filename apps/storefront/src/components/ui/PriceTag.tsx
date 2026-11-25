import { useLocale, useTranslations } from 'next-intl';

import { DEFAULT_LOCALE, isLocale } from '@la-porta/domain/locale';

import { cn } from '@/lib/cn';
import { formatPriceJod } from '@/lib/format';

interface PriceTagProps {
  /** Confirmed price in JOD, or null when the price is not confirmed (decision 0005). */
  priceJod: number | null;
  className?: string;
}

/** A price with Western digits, or "السعر عند الطلب" / "Price on request". */
export function PriceTag({ priceJod, className }: PriceTagProps) {
  const t = useTranslations('Price');
  const current = useLocale();
  const locale = isLocale(current) ? current : DEFAULT_LOCALE;

  return (
    <span
      data-price={priceJod === null ? 'on-request' : 'confirmed'}
      className={cn('text-small text-muted', className)}
    >
      {priceJod === null ? t('onRequest') : formatPriceJod(priceJod, locale)}
    </span>
  );
}
