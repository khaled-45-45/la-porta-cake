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

/**
 * A time of day ("23:00") as people say it, with Western digits:
 * "11 PM" in English, "11 م" in Arabic. Minutes appear only when not on the hour.
 */
export function formatTimeOfDay(time: string, locale: Locale): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (hours === undefined || minutes === undefined || Number.isNaN(hours + minutes)) {
    throw new Error(`Invalid time of day "${time}", expected HH:MM.`);
  }
  return new Intl.DateTimeFormat(numberLocale(locale), {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
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

/**
 * A calendar date ("2026-12-05") with its weekday and Western digits:
 * "Saturday 5 December 2026" in English, "السبت 5/12/2026" in Arabic (day/month/year,
 * as written in Jordan; a numeric month avoids choosing between month-name traditions).
 */
export function formatDate(date: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date "${date}", expected YYYY-MM-DD.`);
  const value = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const [year, month, day] = [match[1], Number(match[2]), Number(match[3])];
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
    value,
  );
  if (locale === 'ar') return `${weekday} ${day}/${month}/${year}`;
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
    value,
  );
  return `${weekday} ${day} ${monthName} ${year}`;
}
