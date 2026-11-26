import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ShopView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { loadShop } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [meta, shop] = await Promise.all([
    getTranslations({ locale, namespace: 'Metadata' }),
    getTranslations({ locale, namespace: 'Shop' }),
  ]);
  return { title: meta('pageTitle', { page: shop('title'), site: meta('siteName') }) };
}

/** The shop: /ar/shop and /en/shop. */
export default async function ShopPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await loadShop(getRepositories());
  return <ShopView data={data} />;
}
