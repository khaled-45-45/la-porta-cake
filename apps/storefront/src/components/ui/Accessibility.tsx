import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

/** Text for screen readers only. */
export function VisuallyHidden({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('sr-only', className)} {...props} />;
}

/** First focusable element: jumps keyboard users past the header to <main id="main">. */
export function SkipLink() {
  const t = useTranslations('Shell');
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-5 focus:py-3 focus:text-paper"
    >
      {t('skipToContent')}
    </a>
  );
}
