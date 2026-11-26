import { useTranslations } from 'next-intl';

import { AvailabilityLegend, ProductCatalog } from '@/components/catalog';
import { Container } from '@/components/ui';
import type { ShopData } from '@/lib/storefront';

/**
 * The shop (prototype Shop): every public product, with search, section chips and
 * "Ready only". The cards are rendered on the server, so the list is readable without
 * JavaScript; search and filters need it.
 */
export function ShopView({ data }: { data: ShopData }) {
  const t = useTranslations('Shop');

  return (
    <main id="main" className="flex-1">
      <Container className="pb-28">
        <ProductCatalog
          products={data.products}
          categories={data.categories}
          intro={
            <>
              <h1 className="m-0 text-display-l">{t('title')}</h1>
              <p className="m-0 max-w-[36em] text-muted">{t('lede')}</p>
            </>
          }
        />
        <AvailabilityLegend className="pt-12" />
      </Container>
    </main>
  );
}
