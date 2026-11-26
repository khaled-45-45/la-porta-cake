import 'server-only';

import type {
  CustomOrderErrorCode,
  CustomOrderField,
  CustomOrderRequest,
  Design,
  Occasion,
  Repositories,
  StoreSettings,
} from '@la-porta/domain';
import {
  CUSTOM_ORDER_LIMITS,
  earliestOrderDate,
  latestOrderDate,
  parseCustomOrder,
  parseDesignReference,
} from '@la-porta/domain';
import type { Locale } from '@la-porta/domain/locale';

import { isPublicDesign } from './catalog';
import type { CustomOrderFieldErrors, CustomOrderState } from './custom-order-state';
import { CUSTOM_ORDER_FORM_FIELDS } from './custom-order-state';
import { formatDate, formatNumber } from './format';
import { whatsappOrderUrl } from './whatsapp';

/**
 * Custom-order inquiries (Phase 6), on the server only.
 *
 * Nothing is stored and nothing is sent: the customer's details are checked with the
 * domain rules (parseCustomOrder), the referenced design is looked up again, and the
 * result is a WhatsApp link with a prepared message that the customer sends themselves.
 * The shop confirms price and date in that chat; the site never confirms an order.
 *
 * Trust boundary: everything posted by the browser is untrusted. The design slug is
 * re-resolved through the repositories and dropped unless it is published; the WhatsApp
 * number comes from the store settings, never from the request; occasion and decoration
 * names in the message come from the data and messages, not from the posted values.
 */

/** The shop is in Russeifa, Jordan: "today" and the earliest date follow Amman time. */
export const SHOP_TIME_ZONE = 'Asia/Amman';

/** Today's date in the shop's time zone, YYYY-MM-DD. */
export function shopToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Message lookup for one language (next-intl's translator from the root namespace). */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

/** A published design, or null for anything else (unknown, unpublished, malformed). */
export async function resolvePublicDesign(
  repositories: Repositories,
  reference: unknown,
): Promise<Design | null> {
  const slug = parseDesignReference(reference);
  if (!slug) return null;
  const design = await repositories.designs.getDesignBySlug(slug);
  return design && isPublicDesign(design) && design.slug === slug ? design : null;
}

export interface CustomOrderPageData {
  /** The design the customer came from, re-checked as published, or null. */
  design: Design | null;
  occasions: Occasion[];
  settings: StoreSettings;
  /** Earliest and latest dates the form accepts, YYYY-MM-DD. */
  earliestDate: string;
  latestDate: string;
}

/**
 * The custom-order page. `designParam` is the raw `?design=` value: anything but one
 * slug of a published design (a list, an unknown or unpublished slug, a path, markup)
 * is ignored, and the page opens without a design.
 */
export async function loadCustomOrderPage(
  repositories: Repositories,
  designParam: unknown,
  now: Date = new Date(),
): Promise<CustomOrderPageData> {
  const [design, occasions, settings] = await Promise.all([
    resolvePublicDesign(repositories, designParam),
    repositories.designs.listOccasions(),
    repositories.site.getSettings(),
  ]);
  const today = shopToday(now);
  return {
    design,
    occasions,
    settings,
    earliestDate: earliestOrderDate(today, settings.defaultLeadHours),
    latestDate: latestOrderDate(today),
  };
}

/**
 * Posted form data as plain values: only the form's own fields, each as a single string.
 * A field sent twice (or as a file) becomes an empty list, which the rules treat as empty.
 * Anything but form data (a hand-made call to the action) gives no values at all, so it
 * is answered like an empty form instead of failing.
 */
export function readCustomOrderForm(form: unknown): Record<string, unknown> {
  if (!(form instanceof FormData)) return {};
  return Object.fromEntries(
    CUSTOM_ORDER_FORM_FIELDS.map((field) => {
      const values = form.getAll(field);
      const [value] = values;
      return [field, values.length === 1 && typeof value === 'string' ? value : []];
    }),
  );
}

function errorMessage(
  field: CustomOrderField,
  code: CustomOrderErrorCode,
  t: Translate,
  locale: Locale,
  dates: { earliest: string; latest: string },
): string {
  switch (code) {
    case 'required':
      return t('CustomOrder.errors.descriptionRequired');
    case 'tooLong':
      return t('CustomOrder.errors.tooLong', {
        max: formatNumber(CUSTOM_ORDER_LIMITS[field as keyof typeof CUSTOM_ORDER_LIMITS], locale),
      });
    case 'tooSoon':
      return t('CustomOrder.errors.tooSoon', { date: formatDate(dates.earliest, locale) });
    case 'tooFar':
      return t('CustomOrder.errors.tooFar', { date: formatDate(dates.latest, locale) });
    case 'invalid':
      return field === 'date'
        ? t('CustomOrder.errors.invalidDate')
        : t('CustomOrder.errors.invalidChoice');
  }
}

/** The inquiry as the customer will send it, in their language. */
export function customOrderMessage(
  request: CustomOrderRequest,
  design: Design | null,
  occasions: readonly Occasion[],
  locale: Locale,
  t: Translate,
): string {
  const line = (key: string, value: string) =>
    value ? `${t(`CustomOrder.message.${key}`)}: ${value}` : null;
  const block = (key: string, value: string) =>
    value ? `${t(`CustomOrder.message.${key}`)}:\n${value}` : null;
  const occasion = occasions.find((o) => o.id === request.occasionId);

  return [
    design
      ? t('CustomOrder.message.introDesign', { title: design.title[locale] })
      : t('CustomOrder.message.intro'),
    '',
    line('occasion', occasion ? occasion.name[locale] : ''),
    line('decoration', request.decoration ? t(`Gallery.decoration.${request.decoration}`) : ''),
    request.mini ? t('CustomOrder.message.mini') : null,
    line('flavour', request.flavour),
    line('writing', request.writing),
    line('date', request.date ? formatDate(request.date, locale) : ''),
    line('name', request.name),
    block('description', request.description),
    block('notes', request.notes),
  ]
    .filter((part) => part !== null)
    .join('\n');
}

interface PrepareOptions {
  locale: Locale;
  t: Translate;
  now?: Date;
}

/**
 * Checks a posted inquiry and prepares the WhatsApp message. Returns localized errors
 * with the cleaned values when something needs fixing, or the link and the message.
 */
export async function prepareCustomOrder(
  repositories: Repositories,
  input: Readonly<Record<string, unknown>>,
  { locale, t, now = new Date() }: PrepareOptions,
): Promise<CustomOrderState> {
  const [design, occasions, settings] = await Promise.all([
    resolvePublicDesign(repositories, input.design),
    repositories.designs.listOccasions(),
    repositories.site.getSettings(),
  ]);
  // A reference that does not resolve to a published design is dropped here, so the
  // rules (description required without a design) apply to what will really be sent.
  const designUnavailable = parseDesignReference(input.design) !== null && design === null;
  const today = shopToday(now);
  const result = parseCustomOrder(
    { ...input, design: design?.slug },
    { today, leadHours: settings.defaultLeadHours, occasionIds: occasions.map((o) => o.id) },
  );

  if (!result.ok) {
    const dates = {
      earliest: earliestOrderDate(today, settings.defaultLeadHours),
      latest: latestOrderDate(today),
    };
    const errors: CustomOrderFieldErrors = {};
    for (const [field, code] of Object.entries(result.errors) as [
      CustomOrderField,
      CustomOrderErrorCode,
    ][]) {
      errors[field] = errorMessage(field, code, t, locale, dates);
    }
    return { status: 'invalid', errors, values: result.values, designUnavailable };
  }

  const message = customOrderMessage(result.request, design, occasions, locale, t);
  return {
    status: 'ready',
    whatsappUrl: whatsappOrderUrl(settings.whatsapp.number, message, { multiline: true }),
    message,
    values: result.values,
    designUnavailable,
  };
}
