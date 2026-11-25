import { useTranslations } from 'next-intl';

import type { Availability } from '@la-porta/domain';

import { cn } from '@/lib/cn';

// Prototype .av: told apart by shape and word, colour only supports them.
const styles: Record<Availability, { text: string; marker: string }> = {
  ready: { text: 'text-ok', marker: 'size-2 rounded-full bg-current' },
  preorder: { text: 'text-pre', marker: 'size-[9px] rounded-full border-2 border-current' },
  unavailable: { text: 'text-off', marker: 'h-0.5 w-2.5 rounded-[1px] bg-current' },
  seasonal: { text: 'text-off', marker: 'size-[7px] rotate-45 border-[1.5px] border-current' },
};

interface AvailabilityBadgeProps {
  availability: Availability;
  className?: string;
}

/** Availability set by hand by the shop. It never claims live stock. */
export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  const t = useTranslations('Availability');
  const style = styles[availability];

  return (
    <span
      data-availability={availability}
      className={cn(
        'inline-flex items-center gap-2 rounded-pill border border-line bg-paper px-3 py-[7px] text-[0.8125rem] leading-none font-semibold whitespace-nowrap',
        style.text,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('inline-block shrink-0', style.marker)} />
      {t(availability)}
    </span>
  );
}
