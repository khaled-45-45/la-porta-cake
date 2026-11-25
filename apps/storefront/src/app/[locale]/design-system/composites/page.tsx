import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { isLocale } from '@la-porta/domain/locale';

import {
  AvailabilityLegend,
  CategoryNav,
  ProductAvailability,
  ProductCard,
  ProductCatalog,
} from '@/components/catalog';
import { WorkGallery } from '@/components/designs';
import { Breadcrumbs, CardGrid, CardGridSkeleton, CtaBand, EmptyState } from '@/components/shared';
import { Button, Container } from '@/components/ui';
import { categoriesById } from '@/lib/catalog';
import { getRepositories } from '@/lib/data';
import { routes } from '@/lib/routes';

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ locale: string }>;
}

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-line pt-8">
      <h2 id={id} className="m-0 text-display-s">
        {title}
      </h2>
      {children}
    </section>
  );
}

// A ready product with a photo, one whose photo awaits review, a preorder item and a
// seasonal one: every card state from real content.
const SAMPLE_PRODUCTS = ['kitkat-cake', 'despacito', 'cheesecake', 'maamoul'];

/**
 * Internal preview of the Phase 4 composite components with real repository data.
 * Development only, like the design-system page: a production build answers "not found".
 * The header and footer around it are the live site shell.
 */
export default async function CompositesPage({ params }: PageProps) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('DesignSystem');
  const nav = await getTranslations('Nav');
  const catalogText = await getTranslations('Catalog');

  const { catalog, designs } = getRepositories();
  const [categories, products, allDesigns, occasions] = await Promise.all([
    catalog.listCategories(),
    catalog.listProducts(),
    designs.listDesigns(),
    designs.listOccasions(),
  ]);
  const byId = categoriesById(categories);
  const samples = SAMPLE_PRODUCTS.map((slug) => products.find((p) => p.slug === slug)).filter(
    (p) => p !== undefined,
  );
  const flavourCakes = categories.find((c) => c.slug === 'flavour-cakes');

  return (
    <main id="main" className="flex-1">
      <Container className="flex flex-col gap-14 py-12">
        <header className="flex flex-col gap-3">
          <h1 className="m-0 text-display-l">{t('compositesTitle')}</h1>
          <p className="m-0 max-w-[40em] text-muted">{t('compositesNote')}</p>
        </header>

        <Group id="g-crumbs" title={t('breadcrumbs')}>
          <Breadcrumbs
            className="pt-0"
            items={[
              { label: nav('home'), href: routes.home },
              { label: nav('shop'), href: routes.shop },
              ...(flavourCakes
                ? [{ label: flavourCakes.name[locale], href: routes.category(flavourCakes.slug) }]
                : []),
              { label: t('sampleCrumbProduct') },
            ]}
          />
        </Group>

        <Group id="g-sections" title={t('categoryNav')}>
          <CategoryNav categories={categories} current="flavour-cakes" />
        </Group>

        <Group id="g-cards" title={t('productCards')}>
          <CardGrid variant="products">
            {samples.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  category={byId.get(product.categoryId)}
                  headingLevel={3}
                />
              </li>
            ))}
          </CardGrid>
        </Group>

        <Group id="g-legend" title={t('legend')}>
          <AvailabilityLegend />
          <ProductAvailability availability="preorder" withNote />
        </Group>

        <Group id="g-catalog" title={t('catalog')}>
          <ProductCatalog
            products={products}
            categories={categories}
            intro={<p className="m-0 max-w-[36em] text-muted">{t('sampleLede')}</p>}
          />
        </Group>

        <Group id="g-cta" title={t('ctaBand')}>
          <CtaBand
            title={t('ctaTitle')}
            body={t('ctaBody')}
            actionLabel={nav('ourWork')}
            href={routes.ourWork}
          />
        </Group>

        <Group id="g-gallery" title={t('gallery')}>
          <WorkGallery designs={allDesigns} occasions={occasions} />
        </Group>

        <Group id="g-empty" title={t('emptyState')}>
          <EmptyState
            headingLevel={3}
            title={catalogText('emptyTitle')}
            body={catalogText('emptyBody')}
            actions={
              <Button variant="line" href={routes.customOrder}>
                {catalogText('customOrder')}
              </Button>
            }
          />
        </Group>

        <Group id="g-loading" title={t('loading')}>
          <CardGridSkeleton count={4} />
        </Group>
      </Container>
    </main>
  );
}
