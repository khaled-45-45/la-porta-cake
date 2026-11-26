'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  ChoiceChips,
  FilterPanel,
  ResultCount,
  SearchField,
  ToggleField,
} from '@/components/filters/FilterControls';
import { CardGrid, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { cn } from '@/lib/cn';
import type { ProductFacets, ProductFilterState } from '@/lib/filters';
import { ALL, INITIAL_PRODUCT_FILTER, matchesProductFilter } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

export interface CatalogEntry {
  facets: ProductFacets;
  /** The card, rendered on the server (ProductCard). */
  card: ReactNode;
}

interface CatalogBrowserProps {
  /**
   * Category chips, in order. Names in the page's language. With a single category
   * (a category page) the chips are left out.
   */
  categories: readonly { id: string; name: string }[];
  entries: readonly CatalogEntry[];
  /** Page title and introduction, shown at the start of the row that holds the search. */
  intro?: ReactNode;
  initialFilter?: Partial<ProductFilterState>;
  className?: string;
}

/**
 * Search and filters over a list of products (prototype Shop): search box, category
 * chips, "Ready only", a live count, and the cards or an empty state.
 *
 * The cards are rendered on the server and passed in; only their small facet records are
 * used here, so the browser never receives full product records or the visibility rules.
 */
export function CatalogBrowser({
  categories,
  entries,
  intro,
  initialFilter,
  className,
}: CatalogBrowserProps) {
  const t = useTranslations('Catalog');
  const locale = useSiteLocale();
  const start: ProductFilterState = { ...INITIAL_PRODUCT_FILTER, ...initialFilter };
  const [filter, setFilter] = useState(start);
  const update = (patch: Partial<ProductFilterState>) => setFilter((f) => ({ ...f, ...patch }));

  const visible = entries.filter((entry) => matchesProductFilter(entry.facets, filter));
  const count = visible.length;

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 pt-10 pb-8">
        {intro ? <div className="flex min-w-0 flex-col gap-2.5">{intro}</div> : null}
        <SearchField
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={filter.query}
          onValueChange={(query) => update({ query })}
        />
      </div>

      <FilterPanel className="flex-row flex-wrap items-center gap-2.5">
        {categories.length > 1 ? (
          <ChoiceChips
            label={t('filterLabel')}
            className="gap-2.5"
            options={[
              { value: ALL, label: t('all') },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={filter.categoryId}
            onChange={(categoryId) => update({ categoryId })}
          />
        ) : null}
        <ToggleField
          label={t('readyOnly')}
          checked={filter.readyOnly}
          onCheckedChange={(readyOnly) => update({ readyOnly })}
          className="ms-auto"
        />
      </FilterPanel>

      <ResultCount className="pt-5 pb-7">
        {t('count', { count, n: formatNumber(count, locale) })}
      </ResultCount>

      {count > 0 ? (
        <CardGrid variant="products">
          {visible.map((entry) => (
            <li key={entry.facets.id}>{entry.card}</li>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title={t('emptyTitle')}
          body={t('emptyBody')}
          actions={
            <>
              <Button variant="dark" onClick={() => setFilter(INITIAL_PRODUCT_FILTER)}>
                {t('showAll')}
              </Button>
              <Button variant="line" href={routes.customOrder}>
                {t('customOrder')}
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
