'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { NavKey } from '@/lib/routes';
import { sectionForPath } from '@/lib/routes';

export interface NavItem {
  key: NavKey;
  href: string;
  label: string;
}

interface MainNavProps {
  items: readonly NavItem[];
  /** Accessible name of the navigation landmark. */
  label: string;
  className?: string;
}

/**
 * Desktop navigation (prototype .nav-links). The current section is underlined in rose
 * and announced with aria-current="page". Hidden below the nav breakpoint, where the
 * mobile menu takes over.
 */
export function MainNav({ items, label, className }: MainNavProps) {
  const current = sectionForPath(usePathname());

  return (
    <nav aria-label={label} className={cn('max-nav:hidden', className)}>
      <ul className="m-0 flex list-none gap-6.5 p-0 text-[0.9375rem] font-medium">
        {items.map((item) => {
          const active = item.key === current;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-[1.5px] py-1.5 no-underline transition-colors',
                  active ? 'border-rose-dark' : 'border-transparent hover:border-line',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
