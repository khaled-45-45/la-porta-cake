import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { directionFor } from '@la-porta/domain/locale';

import { SkipLink } from '@/components/ui';
import { fontVariables } from '@/fonts';
import { routing } from '@/i18n/routing';

import '../globals.css';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** Build both languages ahead of time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('siteName'),
    description: t('description'),
    // Not indexed until launch (Phase 7 adds full SEO).
    robots: { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Lets server components read the locale during static rendering.
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={directionFor(locale)} className={fontVariables}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <NextIntlClientProvider>
          <SkipLink />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
