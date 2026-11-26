import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { isLocale } from '@la-porta/domain/locale';

import { DesignView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { designSlugs, loadDesignPage } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Every published design is built ahead of time; any other slug, including an
 * unpublished design's, answers "page not found".
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await designSlugs(getRepositories())).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await loadDesignPage(getRepositories(), slug);
  if (!data || !isLocale(locale)) return {};
  const meta = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: meta('pageTitle', { page: data.design.title[locale], site: meta('siteName') }) };
}

/** A design from the gallery: /ar/our-work/[slug] and /en/our-work/[slug]. */
export default async function DesignPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await loadDesignPage(getRepositories(), slug);
  if (!data) notFound();
  return <DesignView data={data} />;
}
