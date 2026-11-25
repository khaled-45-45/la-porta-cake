'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/** Switches to the other language on the same page: /ar/x ↔ /en/x. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('LanguageSwitcher');
  const pathname = usePathname();
  const target = useLocale() === 'ar' ? 'en' : 'ar';

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      // Starts with the visible label, so voice-control users can say "EN" or "ع".
      aria-label={`${t('label')} – ${t('description')}`}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill text-base no-underline hover:bg-paper',
        className,
      )}
    >
      {/* The visible label is the other language's name, so it carries that language. */}
      <span lang={target} className={target === 'en' ? 'font-latin' : 'font-body'}>
        {t('label')}
      </span>
    </Link>
  );
}
