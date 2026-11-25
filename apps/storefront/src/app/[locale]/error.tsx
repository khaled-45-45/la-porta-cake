'use client';

import { useTranslations } from 'next-intl';

import { Button, Container } from '@/components/ui';

/** Localized error page with a retry button. */
export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Error');

  return (
    <main id="main">
      <Container className="flex min-h-screen flex-col items-center justify-center gap-5 text-center">
        <h1 className="m-0 text-display-l">{t('title')}</h1>
        <p className="m-0 max-w-[34em] text-lede text-muted">{t('body')}</p>
        <Button onClick={reset} variant="dark">
          {t('retry')}
        </Button>
      </Container>
    </main>
  );
}
