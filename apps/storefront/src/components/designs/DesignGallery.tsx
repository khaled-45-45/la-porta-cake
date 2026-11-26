'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { DecorationType } from '@la-porta/domain';

import {
  ChoiceChips,
  FilterPanel,
  ResultCount,
  ToggleField,
} from '@/components/filters/FilterControls';
import { CardGrid, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { cn } from '@/lib/cn';
import type { All, DesignFacets, DesignFilterState } from '@/lib/filters';
import { ALL, DECORATION_TYPES, INITIAL_DESIGN_FILTER, matchesDesignFilter } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

const DECORATION_CHOICES: readonly (DecorationType | All)[] = [ALL, ...DECORATION_TYPES];

export interface GalleryEntry {
  facets: DesignFacets;
  /** The card, rendered on the server (DesignCard). */
  card: ReactNode;
}

interface DesignGalleryProps {
  /** Occasion chips, in order. Names in the page's language. */
  occasions: readonly { id: string; name: string }[];
  entries: readonly GalleryEntry[];
  initialFilter?: Partial<DesignFilterState>;
  className?: string;
}

/**
 * The work gallery with its filters (prototype Decorations): decoration type, occasion,
 * "Mini cakes only", a live count, and the design cards or an empty state.
 * The filter bar stays at the top of the screen while the cards scroll, as in the
 * prototype. Entries come from the repository, which returns published designs only.
 */
export function DesignGallery({
  occasions,
  entries,
  initialFilter,
  className,
}: DesignGalleryProps) {
  const t = useTranslations('Gallery');
  const locale = useSiteLocale();
  const [filter, setFilter] = useState<DesignFilterState>({
    ...INITIAL_DESIGN_FILTER,
    ...initialFilter,
  });
  const update = (patch: Partial<DesignFilterState>) => setFilter((f) => ({ ...f, ...patch }));

  const visible = entries.filter((entry) => matchesDesignFilter(entry.facets, filter));
  const count = visible.length;

  return (
    <div className={cn('flex flex-col', className)}>
      <FilterPanel sticky>
        <ChoiceChips
          label={t('decorationLabel')}
          showLabel
          options={DECORATION_CHOICES.map((type) => ({
            value: type,
            label: type === ALL ? t('allTypes') : t(`decoration.${type}`),
          }))}
          value={filter.decoration}
          onChange={(decoration) => update({ decoration })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <ChoiceChips
            label={t('occasionLabel')}
            showLabel
            options={[
              { value: ALL, label: t('allOccasions') },
              ...occasions.map((o) => ({ value: o.id, label: o.name })),
            ]}
            value={filter.occasionId}
            onChange={(occasionId) => update({ occasionId })}
          />
          <ToggleField
            label={t('miniOnly')}
            checked={filter.miniOnly}
            onCheckedChange={(miniOnly) => update({ miniOnly })}
            className="sm:ms-auto"
          />
        </div>
      </FilterPanel>

      <ResultCount className="pt-4.5">
        {t('count', { count, n: formatNumber(count, locale) })}
      </ResultCount>

      {count > 0 ? (
        <CardGrid variant="designs" className="pt-7">
          {visible.map((entry) => (
            <li key={entry.facets.id} className="flex">
              {entry.card}
            </li>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          className="mt-7"
          title={t('emptyTitle')}
          body={t('emptyBody')}
          actions={
            <>
              <Button variant="line" onClick={() => setFilter(INITIAL_DESIGN_FILTER)}>
                {t('showAll')}
              </Button>
              <Button variant="dark" href={routes.customOrder}>
                {t('orderYours')}
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
