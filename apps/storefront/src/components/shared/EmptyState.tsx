import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  title: string;
  body?: string;
  /** Buttons that lead somewhere useful, e.g. "Show everything" and "Order a custom cake". */
  actions?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * Shown when a list has nothing to show (prototype .empty): says what happened and offers
 * a way forward, in a dashed panel.
 */
export function EmptyState({ title, body, actions, headingLevel = 2, className }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-panel border-[1.5px] border-dashed border-line px-5 py-20 text-center sm:py-24',
        className,
      )}
    >
      <Heading className="m-0 text-display-m">{title}</Heading>
      {body ? <p className="m-0 max-w-[36em] text-muted">{body}</p> : null}
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
}
