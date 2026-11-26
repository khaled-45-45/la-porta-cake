import { setRequestLocale } from 'next-intl/server';

import { HomeView } from '@/components/pages';
import { getRepositories } from '@/lib/data';
import { loadHome } from '@/lib/storefront';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** The home page: /ar and /en. */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await loadHome(getRepositories());
  return <HomeView data={data} />;
}
