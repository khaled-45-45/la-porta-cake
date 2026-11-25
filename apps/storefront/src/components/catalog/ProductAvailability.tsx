import { useTranslations } from 'next-intl';

import type { Availability } from '@la-porta/domain';

import { AvailabilityBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

export const AVAILABILITY_STATES: readonly Availability[] = [
  'ready',
  'preorder',
  'unavailable',
  'seasonal',
];

interface ProductAvailabilityProps {
  availability: Availability;
  /** Add the short explanation after the badge, e.g. "Order at least a day before pickup". */
  withNote?: boolean;
  className?: string;
}

/**
 * A product's availability: the shared badge, optionally with what it means.
 * Availability is updated by hand in the shop; the wording never claims live stock.
 */
export function ProductAvailability({
  availability,
  withNote = false,
  className,
}: ProductAvailabilityProps) {
  const t = useTranslations('Catalog.legend');
  if (!withNote) return <AvailabilityBadge availability={availability} className={className} />;

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2.5', className)}>
      <AvailabilityBadge availability={availability} />
      <span className="text-small text-muted">{t(availability)}</span>
    </span>
  );
}

interface AvailabilityLegendProps {
  states?: readonly Availability[];
  className?: string;
}

/** What each availability label means (prototype .legend), as a labelled description list. */
export function AvailabilityLegend({
  states = AVAILABILITY_STATES,
  className,
}: AvailabilityLegendProps) {
  const t = useTranslations('Catalog');

  return (
    <div role="group" aria-label={t('legendLabel')} className={className}>
      <dl className="m-0 flex flex-wrap items-center gap-x-4.5 gap-y-2.5">
        {states.map((state) => (
          <div key={state} className="flex items-center gap-2.5">
            <dt>
              <AvailabilityBadge availability={state} />
            </dt>
            <dd className="m-0 text-small text-muted">{t(`legend.${state}`)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
