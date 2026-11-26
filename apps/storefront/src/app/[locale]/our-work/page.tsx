import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { GalleryView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { loadGallery } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [meta, page] = await Promise.all([
    getTranslations({ locale, namespace: 'Metadata' }),
    getTranslations({ locale, namespace: 'OurWork' }),
  ]);
  return { title: meta('pageTitle', { page: page('title'), site: meta('siteName') }) };
}

/** The work gallery: /ar/our-work and /en/our-work. */
export default async function OurWorkPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await loadGallery(getRepositories());
  return <GalleryView data={data} />;
}
