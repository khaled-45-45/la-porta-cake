import { useTranslations } from 'next-intl';

import { Button, Container } from '@/components/ui';

/** Localized "page not found", e.g. /ar/missing or /en/missing. */
export default function LocaleNotFound() {
  const t = useTranslations('NotFound');

  return (
    <main id="main" className="flex flex-1">
      <Container className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <h1 className="m-0 text-display-l">{t('title')}</h1>
        <p className="m-0 max-w-[34em] text-lede text-muted">{t('body')}</p>
        <Button href="/" variant="dark">
          {t('backHome')}
        </Button>
      </Container>
    </main>
  );
}
