import type { Locale } from '@la-porta/domain/locale';

/**
 * Number formatting with Western digits (0–9) in both languages (decision 0003).
 * `-u-nu-latn` stops Arabic pages from using Arabic-Indic digits (٠–٩).
 */
function numberLocale(locale: Locale): string {
  return `${locale}-u-nu-latn`;
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(numberLocale(locale), options).format(value);
}

/** A price in Jordanian dinars, e.g. "12.5 JOD" or "12.5 د.أ.". Up to 3 decimals (fils). */
export function formatPriceJod(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency: 'JOD',
    currencyDisplay: locale === 'ar' ? 'symbol' : 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}
