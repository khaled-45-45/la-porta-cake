import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { Design, Occasion } from '@la-porta/domain';

import { Button } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { isPublicDesign } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

import { OccasionTags } from './OccasionTags';

/** Card widths: four columns on wide screens, three on tablets, two on phones (prototype .gal). */
export const DESIGN_CARD_SIZES = '(min-width: 1100px) 290px, (min-width: 640px) 33vw, 50vw';

interface DesignCardProps {
  design: Design;
  /** All occasions; the card shows the ones this design is tagged with. */
  occasions: readonly Occasion[];
  headingLevel?: 2 | 3;
  /** Load the photo straight away, for cards in the first row (no preload). */
  eager?: boolean;
  className?: string;
}

/**
 * A cake from the work gallery (prototype .card): photo, decoration type, title, occasion
 * tags and the "I want one like this" button, which opens the design's page.
 *
 * Draws nothing for an unpublished design or one whose photo is not public, so a pending
 * image can never reach a page even if a data source passes one by mistake.
 */
export function DesignCard({
  design,
  occasions,
  headingLevel = 2,
  eager = false,
  className,
}: DesignCardProps) {
  const t = useTranslations('Gallery');
  const locale = useSiteLocale();
  if (!isPublicDesign(design)) return null;

  const title = design.title[locale];
  const Heading = `h${headingLevel}` as const;
  const tags = occasions
    .filter((o) => design.occasionIds.includes(o.id))
    .map((o) => o.name[locale]);

  return (
    <article
      data-design={design.slug}
      className={cn(
        'flex flex-col overflow-hidden rounded-card border border-line bg-paper',
        className,
      )}
    >
      <div className="relative aspect-[4/5] bg-sand">
        <Image
          src={design.image.src}
          alt={design.image.alt[locale]}
          fill
          sizes={DESIGN_CARD_SIZES}
          loading={eager ? 'eager' : 'lazy'}
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:px-4 sm:pt-3.5 sm:pb-4">
        <span className="text-[0.8125rem] font-semibold text-rose-ink">
          {t(`decoration.${design.decoration}`)}
        </span>
        <Heading className="m-0 font-display text-lg leading-[1.4]">{title}</Heading>
        <OccasionTags occasions={tags} isMini={design.isMini} />
        <Button
          href={routes.design(design.slug)}
          size="sm"
          block
          aria-label={t('orderLikeThisLabel', { title })}
          className="mt-auto"
        >
          {t('orderLikeThis')}
        </Button>
      </div>
    </article>
  );
}
