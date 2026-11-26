import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { isLocale } from '@la-porta/domain/locale';

import { ProductView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { loadProductPage, productSlugs } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Every public product is built ahead of time; any other slug, including an inactive
 * product's, answers "page not found".
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await productSlugs(getRepositories())).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await loadProductPage(getRepositories(), slug);
  if (!data || !isLocale(locale)) return {};
  const meta = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: meta('pageTitle', { page: data.product.name[locale], site: meta('siteName') }) };
}

/** A product: /ar/products/[slug] and /en/products/[slug]. */
export default async function ProductPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await loadProductPage(getRepositories(), slug);
  if (!data) notFound();
  return <ProductView data={data} />;
}
