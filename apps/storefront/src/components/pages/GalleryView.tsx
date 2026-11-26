import { useTranslations } from 'next-intl';

import { WorkGallery } from '@/components/designs';
import { Breadcrumbs, CtaBand } from '@/components/shared';
import { Container } from '@/components/ui';
import { DECORATION_TYPES } from '@/lib/filters';
import { routes } from '@/lib/routes';
import type { GalleryData } from '@/lib/storefront';

/**
 * The work gallery (prototype Decorations): what each kind of decoration is, then every
 * published design with the decoration, occasion and "Mini" filters. Each card opens the
 * design's page or the custom-order form with that design. The loader (loadGallery) has
 * kept published designs with public photos only.
 */
export function GalleryView({ data }: { data: GalleryData }) {
  const t = useTranslations('OurWork');
  const gallery = useTranslations('Gallery');
  const nav = useTranslations('Nav');

  return (
    <main id="main" className="flex-1">
      <Container className="pb-24">
        <Breadcrumbs items={[{ label: nav('home'), href: routes.home }, { label: t('title') }]} />
        <header className="grid grid-cols-1 items-end gap-8 pt-6 pb-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="flex flex-col gap-4">
            <h1 className="m-0 text-display-xl">{t('title')}</h1>
            <p className="m-0 max-w-[34em] text-lede text-muted">{t('lede')}</p>
          </div>
          <section aria-labelledby="kinds-title">
            <h2 id="kinds-title" className="sr-only">
              {t('kindsTitle')}
            </h2>
            <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DECORATION_TYPES.map((type) => (
                <div
                  key={type}
                  className="flex flex-col gap-1 rounded-card border border-line bg-paper px-4 py-3.5"
                >
                  <dt className="font-semibold">{gallery(`decoration.${type}`)}</dt>
                  <dd className="m-0 text-small text-muted">{gallery(`decorationNote.${type}`)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </header>

        <WorkGallery designs={data.designs} occasions={data.occasions} />

        <CtaBand
          title={t('ctaTitle')}
          body={t('ctaBody')}
          actionLabel={t('ctaAction')}
          href={routes.customOrder}
          className="mt-16"
        />
      </Container>
    </main>
  );
}
