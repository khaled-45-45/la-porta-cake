import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { ProductCard } from '@/components/catalog';
import { DesignCard } from '@/components/designs';
import { WhatsAppIcon } from '@/components/icons';
import { CardGrid } from '@/components/shared';
import { useOpeningHoursLines } from '@/components/site';
import { ArchFrame, Button, Container, Section, SectionHeading, TextLink } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { routes } from '@/lib/routes';
import type { HomeData } from '@/lib/storefront';
import { whatsappOrderUrl } from '@/lib/whatsapp';

/**
 * The home page (prototype Main / Home-en), built only from repository data.
 *
 * Sections from the prototype that would link to pages not built yet (custom order,
 * gallery, FAQ) are left out until those pages exist; see docs/components.md.
 */
export function HomeView({ data }: { data: HomeData }) {
  const t = useTranslations('Home');
  const nav = useTranslations('Nav');
  const gallery = useTranslations('Gallery');
  const locale = useSiteLocale();
  const { settings } = data;
  const hourLines = useOpeningHoursLines(settings.hours);
  const [mainHero, smallHero] = data.hero;
  const phone = <bdi dir="ltr">{settings.phone.display}</bdi>;

  return (
    <main id="main" className="flex-1">
      {/* Hero */}
      <Container>
        <section
          aria-labelledby="hero-title"
          className="grid grid-cols-1 items-center gap-14 pt-12 pb-22 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-18 lg:pt-18 lg:pb-28"
        >
          <div className="flex min-w-0 flex-col gap-7">
            <p className="m-0 text-sm font-medium text-rose-ink">{t('heroMeta')}</p>
            <h1 id="hero-title" className="m-0 text-display-xl">
              {t('heroTitle')}
            </h1>
            <p className="m-0 max-w-[34em] text-lede text-muted">{t('heroLede')}</p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Button href={routes.shop}>{t('browseCakes')}</Button>
              <Button href={settings.whatsapp.url} variant="line">
                <WhatsAppIcon />
                {nav('orderWhatsApp')}
              </Button>
            </div>
            <p className="m-0 text-small text-muted">
              {t.rich('availabilityNote', {
                number: settings.phone.display,
                phone: () => phone,
              })}
            </p>
          </div>
          {mainHero ? (
            <div className="relative mt-6 w-full max-w-[290px] justify-self-center sm:max-w-[380px] lg:max-w-[460px]">
              <ArchFrame outlined>
                <div className="relative aspect-[4/5.4] bg-sand">
                  <Image
                    src={mainHero.image.src}
                    alt={mainHero.image.alt[locale]}
                    fill
                    preload
                    sizes="(min-width: 1024px) 460px, (min-width: 640px) 380px, 290px"
                    className="object-cover"
                  />
                </div>
              </ArchFrame>
              {smallHero ? (
                <div className="absolute -end-6 -bottom-8 aspect-[4/5] w-[140px] overflow-hidden rounded-[16px] border-8 border-cream bg-sand max-sm:hidden lg:-bottom-10 lg:w-[190px] xl:-end-18">
                  <Image
                    src={smallHero.image.src}
                    alt={smallHero.image.alt[locale]}
                    fill
                    sizes="190px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </Container>

      {/* From the shop window: featured products */}
      {data.featuredProducts.length > 0 ? (
        <Section tone="paper" aria-labelledby="featured-title">
          <Container>
            <SectionHeading
              id="featured-title"
              title={t('featuredTitle')}
              lede={t('featuredLede')}
              className="mb-8 sm:mb-12"
              action={
                data.featuredCategory ? (
                  <TextLink href={routes.category(data.featuredCategory.slug)}>
                    {t('featuredAll')}
                  </TextLink>
                ) : null
              }
            />
            <CardGrid variant="products">
              {data.featuredProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    category={data.featuredCategory}
                    headingLevel={3}
                  />
                </li>
              ))}
            </CardGrid>
          </Container>
        </Section>
      ) : null}

      {/* Celebration cakes, with the shop-window photo */}
      <Section aria-labelledby="occasion-title">
        <Container>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-sand sm:aspect-[4/3] lg:aspect-[21/8]">
            <Image
              src={settings.images.shopWindow.src}
              alt={settings.images.shopWindow.alt[locale]}
              fill
              sizes="(min-width: 1240px) 1200px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 flex max-w-[28em] flex-col gap-2.5 rounded-card bg-paper p-4 sm:inset-x-auto sm:start-7 sm:bottom-7 sm:px-6 sm:py-5">
              <h2 id="occasion-title" className="m-0 text-display-m">
                {t('occasionTitle')}
              </h2>
              <p className="m-0 text-small text-muted">{t('occasionBody')}</p>
              <TextLink
                href={whatsappOrderUrl(settings.whatsapp.number, t('occasionMessage'))}
                className="self-start"
              >
                {t('occasionCta')}
              </TextLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Choose by occasion: published designs */}
      {data.featuredDesigns.length > 0 ? (
        <Section aria-labelledby="designs-title" className="pt-0 max-md:pt-0">
          <Container>
            <SectionHeading
              id="designs-title"
              title={t('designsTitle')}
              lede={t('designsLede')}
              className="mb-8 sm:mb-12"
            />
            <CardGrid variant="designs">
              {data.featuredDesigns.map((design) => (
                <li key={design.id} className="flex">
                  <DesignCard
                    design={design}
                    occasions={data.occasions}
                    headingLevel={3}
                    className="w-full"
                  />
                </li>
              ))}
            </CardGrid>
          </Container>
        </Section>
      ) : null}

      {/* Sugar paste or printed photo */}
      {data.decorationExamples.length > 0 ? (
        <Section tone="sand" aria-labelledby="decor-title">
          <Container>
            <SectionHeading
              id="decor-title"
              title={t('decorTitle')}
              lede={t('decorLede')}
              className="mb-8 sm:mb-12"
            />
            <ul className="m-0 grid list-none grid-cols-1 gap-7 p-0 lg:grid-cols-2">
              {data.decorationExamples.map(({ decoration, design }) => (
                <li
                  key={decoration}
                  className="grid grid-cols-1 items-center gap-6 rounded-panel border border-line bg-paper p-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-sand">
                    <Image
                      src={design.image.src}
                      alt={design.image.alt[locale]}
                      fill
                      sizes="(min-width: 1024px) 260px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h3 className="m-0 text-display-s">{gallery(`decoration.${decoration}`)}</h3>
                    <p className="m-0 text-muted">{t(`decorBody.${decoration}`)}</p>
                    <p className="m-0 text-small text-muted">{t(`decorNote.${decoration}`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Where to start: the shop's categories */}
      <Section aria-labelledby="doors-title">
        <Container>
          <SectionHeading id="doors-title" title={t('doorsTitle')} className="mb-8 sm:mb-12" />
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:gap-7 nav:grid-cols-4">
            {data.categoryDoors.map(({ category, image }) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.slug)}
                  className="group flex flex-col items-center gap-3.5 text-center no-underline"
                >
                  <ArchFrame className="w-full">
                    <div className="relative aspect-[2/3] bg-sand">
                      {image ? (
                        <Image
                          src={image.src}
                          alt=""
                          fill
                          sizes="(min-width: 1100px) 290px, 50vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </ArchFrame>
                  <h3 className="m-0 font-display text-[1.0625rem] leading-[1.4] decoration-rose underline-offset-[5px] group-hover:underline sm:text-xl">
                    {category.name[locale]}
                  </h3>
                  {t.has(`doorNote.${category.slug}`) ? (
                    <p className="m-0 text-small text-muted">{t(`doorNote.${category.slug}`)}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Visit us */}
      <Section aria-labelledby="visit-title" className="pt-0 max-md:pt-0">
        <Container>
          <SectionHeading id="visit-title" title={t('visitTitle')} className="mb-8 sm:mb-12" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
            <div className="flex flex-col gap-2 border-t-[1.5px] border-ink pt-5">
              <h3 className="m-0 text-display-s">{t('visitAddress')}</h3>
              <p className="m-0 text-muted">{settings.address[locale]}</p>
              <TextLink href={settings.mapsUrl} className="self-start">
                {t('visitMap')}
              </TextLink>
            </div>
            <div className="flex flex-col gap-2 border-t-[1.5px] border-ink pt-5">
              <h3 className="m-0 text-display-s">{t('visitContact')}</h3>
              <p className="m-0 tabular-nums">
                <TextLink href={`tel:${settings.phone.e164}`}>{phone}</TextLink>
              </p>
              <TextLink href={settings.whatsapp.url} className="self-start">
                {nav('orderWhatsApp')}
              </TextLink>
              {hourLines.map((line) => (
                <p key={line} className="m-0 text-small text-muted">
                  {line}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t-[1.5px] border-ink pt-5">
              <h3 className="m-0 text-display-s">{t('visitFollow')}</h3>
              <p className="m-0 text-muted">{t('visitFollowBody')}</p>
              <TextLink href={settings.instagram.url} className="self-start">
                <bdi dir="ltr">@{settings.instagram.handle}</bdi>
              </TextLink>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
