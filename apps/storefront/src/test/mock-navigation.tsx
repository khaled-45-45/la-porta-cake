import type { ReactNode } from 'react';

// Stand-in for '@/i18n/navigation' in tests: the real locale-aware Link needs the
// Next.js router. Use with:
//   vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));
// Links are built like the real ones: /{locale}{path}. "current" stands for the page's
// language when no locale is given.

let pathname = '/';

/** Sets the path (without language prefix) that usePathname() returns. */
export function setPathname(path: string) {
  pathname = path;
}

export function usePathname() {
  return pathname;
}

export function Link({
  href,
  locale,
  children,
  ...rest
}: { href: string; locale?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <a href={`/${locale ?? 'current'}${href === '/' ? '' : href}`} {...rest}>
      {children}
    </a>
  );
}
