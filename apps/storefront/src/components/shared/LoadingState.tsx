import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';

import type { CardGridVariant } from './CardGrid';
import { CardGrid } from './CardGrid';

interface CardGridSkeletonProps {
  variant?: CardGridVariant;
  count?: number;
  className?: string;
}

/**
 * Placeholder cards while a list loads, for use as a Suspense fallback. Announced once as
 * "Loading…"; the shapes themselves are hidden from screen readers. The pulse stops when
 * the visitor prefers reduced motion.
 */
export function CardGridSkeleton({
  variant = 'products',
  count = 8,
  className,
}: CardGridSkeletonProps) {
  const t = useTranslations('States');

  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t('loading')}</span>
      <CardGrid variant={variant} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="flex flex-col gap-3.5">
            <div
              className={cn(
                'aspect-[4/5] animate-pulse rounded-card bg-sand motion-reduce:animate-none',
              )}
            />
            <div className="h-3.5 w-1/3 animate-pulse rounded-pill bg-sand motion-reduce:animate-none" />
            <div className="h-5 w-2/3 animate-pulse rounded-pill bg-sand motion-reduce:animate-none" />
          </li>
        ))}
      </CardGrid>
    </div>
  );
}
