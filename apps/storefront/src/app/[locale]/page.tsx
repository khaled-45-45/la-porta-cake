import { getTranslations, setRequestLocale } from 'next-intl/server';

import { isLocale } from '@la-porta/domain/locale';

import { Container, LanguageSwitcher } from '@/components/ui';
import { getRepositories } from '@/lib/data';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Temporary page so /ar and /en can be tested (Phase 3).
 * Replaced by the real home page in Phase 5. Not indexed.
 */
export default async function PlaceholderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Placeholder');

  // The shop name comes through the data layer, proving it works end to end.
  const settings = await getRepositories().site.getSettings();
  const name = isLocale(locale) ? settings.name[locale] : settings.name.ar;

  return (
    <main id="main">
      <Container className="flex min-h-screen flex-col items-center justify-center gap-5 text-center">
        <h1 className="m-0 text-display-xl">{name}</h1>
        <p className="m-0 max-w-[34em] text-lede text-muted">{t('body')}</p>
        <LanguageSwitcher />
      </Container>
    </main>
  );
}
