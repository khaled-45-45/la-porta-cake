'use server';

import { getTranslations } from 'next-intl/server';

import { DEFAULT_LOCALE, isLocale } from '@la-porta/domain/locale';

import { prepareCustomOrder, readCustomOrderForm } from '@/lib/custom-order';
import type { CustomOrderState } from '@/lib/custom-order-state';
import { getRepositories } from '@/lib/data';

/**
 * Server action for the custom-order form. It stores nothing and sends nothing: it
 * checks the posted inquiry and returns either localized errors or the WhatsApp link
 * with the prepared message (lib/custom-order.ts).
 *
 * Every argument comes from the browser and is treated as untrusted, the bound
 * language included. Next.js accepts the call only from this site's own pages (it
 * compares the Origin and Host headers) and limits the request body (next.config.ts).
 */
export async function submitCustomOrder(
  locale: string,
  _previous: CustomOrderState,
  // Typed as unknown on purpose: a hand-made call can send anything here.
  form: unknown,
): Promise<CustomOrderState> {
  const language = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = await getTranslations({ locale: language });
  return prepareCustomOrder(getRepositories(), readCustomOrderForm(form), {
    locale: language,
    t: (key, values) => t(key, values),
  });
}
