import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface ArchFrameProps {
  /** Draw the rose doorway outline around the arch (prototype .door). */
  outlined?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The doorway arch, La Porta's signature shape (prototype .arch and .door).
 * The shape is symmetric, so it is the same in Arabic and English.
 */
export function ArchFrame({ outlined = false, className, children }: ArchFrameProps) {
  return (
    <div
      data-outlined={outlined || undefined}
      className={cn(
        'relative',
        outlined &&
          "before:pointer-events-none before:absolute before:-inset-x-4 before:-top-4 before:bottom-0 before:rounded-t-full before:border-[1.5px] before:border-b-0 before:border-rose before:content-[''] max-sm:before:-inset-x-2.5 max-sm:before:-top-2.5",
        className,
      )}
    >
      <div className="overflow-hidden rounded-t-full">{children}</div>
    </div>
  );
}
