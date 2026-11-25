import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  /** Path inside the site. Leave out for the current page, which must come last. */
  href?: string;
}

interface BreadcrumbsProps {
  items: readonly Crumb[];
  className?: string;
}

/**
 * Where the page sits in the site (prototype .crumb): an ordered list of links ending
 * with the current page, marked aria-current="page". The separators are hidden from
 * screen readers.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const t = useTranslations('Breadcrumbs');

  return (
    <nav aria-label={t('label')} className={cn('pt-7', className)}>
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="no-underline hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
              {last ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
