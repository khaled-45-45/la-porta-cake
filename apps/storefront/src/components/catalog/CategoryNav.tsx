import { useTranslations } from 'next-intl';

import type { Category } from '@la-porta/domain';

import { chipClassName } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

interface CategoryNavProps {
  categories: readonly Category[];
  /** Slug of the category page being shown, or "all" on the shop page. */
  current: string;
  className?: string;
}

/**
 * Links between the shop and its category pages, styled as chips. The current one is
 * filled and marked aria-current="page". Unlike the filter chips, these change the page.
 */
export function CategoryNav({ categories, current, className }: CategoryNavProps) {
  const t = useTranslations('Catalog');
  const locale = useSiteLocale();
  const links = [
    { key: 'all', href: routes.shop, label: t('all') },
    ...categories.map((c) => ({
      key: c.slug,
      href: routes.category(c.slug),
      label: c.name[locale],
    })),
  ];

  return (
    <nav aria-label={t('sectionsLabel')} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
        {links.map((link) => {
          const active = link.key === current;
          return (
            <li key={link.key}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(chipClassName(active), 'no-underline')}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
