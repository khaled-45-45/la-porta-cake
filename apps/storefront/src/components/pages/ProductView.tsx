import { useTranslations } from 'next-intl';

import {
  PRODUCT_CARD_SIZES,
  ProductAvailability,
  ProductCard,
  ProductImage,
} from '@/components/catalog';
import { InstagramIcon, WhatsAppIcon } from '@/components/icons';
import { Breadcrumbs, CardGrid } from '@/components/shared';
import { Button, Container, PriceTag, Section, SectionHeading, TextLink } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { ProductPageData } from '@/lib/storefront';
import { whatsappOrderUrl } from '@/lib/whatsapp';

/**
 * A product page (prototype Product). Shows only what the content supports: the
 * description, sizes, servings and prices appear when they are recorded; otherwise the
 * price reads "Price on request" (decision 0005). Lead time is shown for items made to
 * order. Ordering opens WhatsApp with the product's name; there is no online payment.
 *
 * Presentation only: the loader (loadProductPage) has already chosen the public photos,
 * the price to show and the lead time.
 */
export function ProductView({ data }: { data: ProductPageData }) {
  const t = useTranslations('Product');
  const nav = useTranslations('Nav');
  const locale = useSiteLocale();
  const { product, category, images, priceJod, leadTime, related, settings } = data;
  const name = product.name[locale];
  const [mainImage, ...moreImages] = images;
  const variants = product.variants;
  const showServings = variants.some((v) => v.servings !== null);
  const orderUrl = whatsappOrderUrl(settings.whatsapp.number, t('whatsappMessage', { name }));

  return (
    <main id="main" className="flex-1">
      <Container>
        <Breadcrumbs
          items={[
            { label: nav('home'), href: routes.home },
            { label: nav('shop'), href: routes.shop },
            ...(category
              ? [{ label: category.name[locale], href: routes.category(category.slug) }]
              : []),
            { label: name },
          ]}
        />
        <div className="grid grid-cols-1 items-start gap-10 pt-8 pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-18">
          <div className="flex flex-col gap-4">
            <ProductImage
              image={mainImage}
              name={name}
              eager
              sizes="(min-width: 1024px) 640px, 100vw"
              className="aspect-[4/4.8] rounded-panel"
            />
            {moreImages.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0">
                {moreImages.map((image) => (
                  <li key={image.src}>
                    <ProductImage
                      image={image}
                      name={name}
                      sizes={PRODUCT_CARD_SIZES}
                      className="aspect-square rounded-card"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-7">
            <div className="flex flex-col items-start gap-3.5">
              {category ? (
                <TextLink
                  href={routes.category(category.slug)}
                  className="text-sm font-medium text-rose-ink no-underline"
                >
                  {category.name[locale]}
                </TextLink>
              ) : null}
              <h1 className="m-0 text-display-l">{name}</h1>
              {/* Made to order: the product's own lead time below says more than the general note. */}
              <ProductAvailability
                availability={product.availability}
                withNote={product.availability !== 'preorder'}
              />
              {product.description ? (
                <p className="m-0 max-w-[34em] text-lg leading-[1.85] text-muted">
                  {product.description[locale]}
                </p>
              ) : null}
              {leadTime ? (
                <p className="m-0 font-medium">
                  {'days' in leadTime
                    ? t('leadDays', { days: leadTime.days, n: formatNumber(leadTime.days, locale) })
                    : t('leadHours', {
                        hours: leadTime.hours,
                        n: formatNumber(leadTime.hours, locale),
                      })}
                </p>
              ) : null}
            </div>

            {variants.length > 0 ? (
              <table className="w-full border-collapse overflow-hidden rounded-card bg-paper text-start tabular-nums">
                <caption className="pb-2.5 text-start font-semibold">{t('sizesTitle')}</caption>
                <thead>
                  <tr className="bg-sand">
                    <th scope="col" className="px-4.5 py-3.5 text-start font-semibold">
                      {t('sizeColumn')}
                    </th>
                    {showServings ? (
                      <th scope="col" className="px-4.5 py-3.5 text-start font-semibold">
                        {t('servingsColumn')}
                      </th>
                    ) : null}
                    <th scope="col" className="px-4.5 py-3.5 text-start font-semibold">
                      {t('priceLabel')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="border-t border-line">
                      <th scope="row" className="px-4.5 py-3.5 text-start font-medium">
                        {variant.label[locale]}
                      </th>
                      {showServings ? (
                        <td className="px-4.5 py-3.5">
                          {variant.servings === null
                            ? '–'
                            : t('servings', { n: formatNumber(variant.servings, locale) })}
                        </td>
                      ) : null}
                      <td className="px-4.5 py-3.5">
                        <PriceTag priceJod={variant.priceJod} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // One price for the product. With sizes, the table above carries the prices.
              <div className="flex flex-col gap-1.5 rounded-card border border-line bg-paper px-5.5 py-5">
                <span className="text-small text-muted">{t('priceLabel')}</span>
                <PriceTag priceJod={priceJod} className="text-display-m text-ink" />
                {priceJod === null ? (
                  <span className="text-small text-muted">{t('priceOnRequestNote')}</span>
                ) : null}
              </div>
            )}
            {variants.length > 0 && variants.some((v) => v.priceJod === null) ? (
              <p className="m-0 text-small text-muted">{t('priceOnRequestNote')}</p>
            ) : null}

            <div className="flex flex-col gap-3">
              <Button href={orderUrl} block className="min-h-14 text-[1.0625rem]">
                <WhatsAppIcon />
                {nav('orderWhatsApp')}
              </Button>
              <Button href={settings.instagram.url} variant="line" block>
                <InstagramIcon />
                {t('instagram')}
              </Button>
              <p className="m-0 text-small text-muted">{t('orderNote')}</p>
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && category ? (
        <Section tone="paper" spacing="tight" aria-labelledby="related-title">
          <Container>
            <SectionHeading
              id="related-title"
              title={t('relatedTitle')}
              className="mb-8"
              action={<TextLink href={routes.category(category.slug)}>{t('relatedAll')}</TextLink>}
            />
            <CardGrid variant="products">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} category={category} headingLevel={3} />
                </li>
              ))}
            </CardGrid>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
