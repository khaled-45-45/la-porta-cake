import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { isLocale } from '@la-porta/domain/locale';

import { CategoryView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { categorySlugs, loadCategoryPage } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
}

/** Every category is built ahead of time; any other slug answers "page not found". */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await categorySlugs(getRepositories())).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const data = await loadCategoryPage(getRepositories(), slug);
  if (!data || !isLocale(locale)) return {};
  const meta = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: meta('pageTitle', { page: data.category.name[locale], site: meta('siteName') }) };
}

/** A shop category: /ar/shop/[category] and /en/shop/[category]. */
export default async function CategoryPage({ params }: PageProps) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);
  const data = await loadCategoryPage(getRepositories(), slug);
  if (!data) notFound();
  return <CategoryView data={data} />;
}
