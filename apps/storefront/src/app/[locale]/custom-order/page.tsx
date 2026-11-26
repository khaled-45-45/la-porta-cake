import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CUSTOM_ORDER_LIMITS } from '@la-porta/domain';

import { CustomOrderView } from '@/components/pages';
import { loadCustomOrderPage } from '@/lib/custom-order';
import { getRepositories } from '@/lib/data';

import { submitCustomOrder } from './actions';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [meta, nav] = await Promise.all([
    getTranslations({ locale, namespace: 'Metadata' }),
    getTranslations({ locale, namespace: 'Nav' }),
  ]);
  return { title: meta('pageTitle', { page: nav('customOrder'), site: meta('siteName') }) };
}

/**
 * The custom-order inquiry: /ar/custom-order and /en/custom-order, optionally with
 * ?design=<slug> from the gallery. Rendered per request because it reads the query and
 * today's date; the design is looked up again and ignored unless it is published.
 */
export default async function CustomOrderPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { design } = await searchParams;
  const data = await loadCustomOrderPage(getRepositories(), design);
  return (
    <CustomOrderView
      data={data}
      action={submitCustomOrder.bind(null, locale)}
      limits={CUSTOM_ORDER_LIMITS}
    />
  );
}
