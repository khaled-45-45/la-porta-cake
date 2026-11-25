import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

interface ChipProps extends ComponentProps<'button'> {
  /** Whether this option is currently chosen. Announced to screen readers. */
  selected?: boolean;
}

// Prototype .chip and .chip.sel
const base =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] px-4.5 font-body text-[0.9375rem] font-medium transition-colors';
const unselected = 'border-line bg-paper text-ink hover:border-rose';
const selectedStyle = 'border-ink bg-ink text-paper';

/** A selectable filter option. */
export function Chip({ selected = false, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(base, selected ? selectedStyle : unselected, className)}
      {...props}
    />
  );
}
