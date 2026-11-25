import type { ReactNode } from 'react';

import type { Category, Product } from '@la-porta/domain';

import { useSiteLocale } from '@/i18n/use-site-locale';
import { categoriesById, isPublicProduct } from '@/lib/catalog';
import type { ProductFilterState } from '@/lib/filters';
import { productFacets } from '@/lib/filters';

import type { CatalogEntry } from './CatalogBrowser';
import { CatalogBrowser } from './CatalogBrowser';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  /** Products from the catalog repository (public data only). */
  products: readonly Product[];
  categories: readonly Category[];
  intro?: ReactNode;
  initialFilter?: Partial<ProductFilterState>;
  /** How many cards load their photo straight away: the first row. The rest load lazily. */
  eagerCount?: number;
  className?: string;
}

/**
 * Server entry point for a searchable product list: keeps only public (active) products,
 * renders each ProductCard on the server and hands the cards, with their facets, to the
 * interactive CatalogBrowser.
 */
export function ProductCatalog({
  products,
  categories,
  intro,
  initialFilter,
  eagerCount = 4,
  className,
}: ProductCatalogProps) {
  const locale = useSiteLocale();
  const byId = categoriesById(categories);

  const entries: CatalogEntry[] = products.filter(isPublicProduct).map((product, index) => {
    const category = byId.get(product.categoryId);
    return {
      facets: productFacets(product, category),
      card: <ProductCard product={product} category={category} eager={index < eagerCount} />,
    };
  });

  return (
    <CatalogBrowser
      categories={categories.map((c) => ({ id: c.id, name: c.name[locale] }))}
      entries={entries}
      intro={intro}
      initialFilter={initialFilter}
      className={className}
    />
  );
}
