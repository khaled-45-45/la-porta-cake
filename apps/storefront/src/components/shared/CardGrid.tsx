import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export type CardGridVariant = 'products' | 'designs';

// Mobile first. Products: 2 columns, 4 from 1100px (prototype .g4).
// Designs: 2 columns, 3 from 640px, 4 from 1100px (prototype .gal).
const variants: Record<CardGridVariant, string> = {
  products: 'grid-cols-2 gap-4 sm:gap-7 nav:grid-cols-4',
  designs: 'grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 nav:grid-cols-4',
};

interface CardGridProps extends ComponentProps<'ul'> {
  variant?: CardGridVariant;
}

/** A responsive list of cards. Each child should be an <li>. */
export function CardGrid({ variant = 'products', className, ...props }: CardGridProps) {
  return <ul className={cn('m-0 grid list-none p-0', variants[variant], className)} {...props} />;
}
