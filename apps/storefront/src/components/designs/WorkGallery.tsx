import type { Design, Occasion } from '@la-porta/domain';

import { useSiteLocale } from '@/i18n/use-site-locale';
import { isPublicDesign } from '@/lib/catalog';
import type { DesignFilterState } from '@/lib/filters';
import { designFacets } from '@/lib/filters';

import { DesignCard } from './DesignCard';
import type { GalleryEntry } from './DesignGallery';
import { DesignGallery } from './DesignGallery';

interface WorkGalleryProps {
  /** Designs from the design repository (published only). */
  designs: readonly Design[];
  occasions: readonly Occasion[];
  initialFilter?: Partial<DesignFilterState>;
  /** How many cards load their photo straight away: the first row. The rest load lazily. */
  eagerCount?: number;
  className?: string;
}

/**
 * Server entry point for the work gallery: keeps only public designs, renders each
 * DesignCard on the server and hands the cards to the interactive DesignGallery.
 * Occasions without any public design are left out of the filter.
 */
export function WorkGallery({
  designs,
  occasions,
  initialFilter,
  eagerCount = 4,
  className,
}: WorkGalleryProps) {
  const locale = useSiteLocale();
  const visible = designs.filter(isPublicDesign);
  const used = new Set(visible.flatMap((d) => d.occasionIds));

  const entries: GalleryEntry[] = visible.map((design, index) => ({
    facets: designFacets(design),
    card: (
      <DesignCard
        design={design}
        occasions={occasions}
        eager={index < eagerCount}
        className="w-full"
      />
    ),
  }));

  return (
    <DesignGallery
      occasions={occasions
        .filter((o) => used.has(o.id))
        .map((o) => ({ id: o.id, name: o.name[locale] }))}
      entries={entries}
      initialFilter={initialFilter}
      className={className}
    />
  );
}
