import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { DesignCard, OccasionTags } from '@/components/designs';
import { Breadcrumbs, CardGrid } from '@/components/shared';
import { Button, Container, Section, SectionHeading, TextLink } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { routes } from '@/lib/routes';
import type { DesignPageData } from '@/lib/storefront';

/**
 * A design from the work gallery: its photo, decoration type, the occasions it suits,
 * and "I want one like this", which opens the custom-order form with the design chosen.
 * Only what the data records is shown: no price, size or flavour is attached to a design,
 * so none is stated (decision 0005). The loader (loadDesignPage) has checked that the
 * design is published and its photo public; related designs are published ones too.
 */
export function DesignView({ data }: { data: DesignPageData }) {
  const t = useTranslations('Design');
  const gallery = useTranslations('Gallery');
  const nav = useTranslations('Nav');
  const locale = useSiteLocale();
  const { design, occasions, allOccasions, related } = data;
  const title = design.title[locale];

  return (
    <main id="main" className="flex-1">
      <Container>
        <Breadcrumbs
          items={[
            { label: nav('home'), href: routes.home },
            { label: nav('ourWork'), href: routes.ourWork },
            { label: title },
          ]}
        />
        <div className="grid grid-cols-1 items-start gap-10 pt-8 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-18">
          <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-sand">
            <Image
              src={design.image.src}
              alt={design.image.alt[locale]}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              loading="eager"
              className="object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-7">
            <div className="flex flex-col items-start gap-3.5">
              <h1 className="m-0 text-display-l">{title}</h1>
              <dl className="m-0 flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-small text-muted">{t('decorationLabel')}</dt>
                  <dd className="m-0 font-semibold text-rose-ink">
                    {gallery(`decoration.${design.decoration}`)}
                    <span className="block text-small font-normal text-muted">
                      {gallery(`decorationNote.${design.decoration}`)}
                    </span>
                  </dd>
                </div>
                {occasions.length > 0 || design.isMini ? (
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-small text-muted">{t('occasionsLabel')}</dt>
                    <dd className="m-0">
                      <OccasionTags
                        occasions={occasions.map((o) => o.name[locale])}
                        isMini={design.isMini}
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <section
              aria-labelledby="order-title"
              className="flex flex-col gap-3 rounded-card border border-line bg-paper px-5.5 py-5"
            >
              <h2 id="order-title" className="m-0 text-display-s">
                {t('orderTitle')}
              </h2>
              <p className="m-0 text-muted">{t('orderBody')}</p>
              <Button
                href={routes.customOrderFor(design.slug)}
                block
                className="mt-1 min-h-14 text-[1.0625rem]"
              >
                {t('orderCta')}
              </Button>
            </section>
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <Section tone="paper" spacing="tight" aria-labelledby="related-title">
          <Container>
            <SectionHeading
              id="related-title"
              title={t('relatedTitle')}
              className="mb-8"
              action={<TextLink href={routes.ourWork}>{t('relatedAll')}</TextLink>}
            />
            <CardGrid variant="designs">
              {related.map((item) => (
                <li key={item.id} className="flex">
                  <DesignCard
                    design={item}
                    occasions={allOccasions}
                    headingLevel={3}
                    className="w-full"
                  />
                </li>
              ))}
            </CardGrid>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
