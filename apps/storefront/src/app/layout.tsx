import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DEFAULT_LOCALE, directionFor } from '@la-porta/domain';

import './globals.css';

export const metadata: Metadata = {
  title: 'La Porta Cake',
  description: 'La Porta Cake, Russeifa, Zarqa.',
  robots: { index: false, follow: false },
};

// Phase 1 scaffold: a single Arabic page. Locale routing (/ar, /en) arrives in Phase 3.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} dir={directionFor(DEFAULT_LOCALE)}>
      <body>{children}</body>
    </html>
  );
}
