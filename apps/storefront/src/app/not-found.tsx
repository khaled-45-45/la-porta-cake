import '@/app/globals.css';

import Link from 'next/link';

import { fontVariables } from '@/fonts';

// Only reached for requests outside the locale routes (the proxy sends everything else
// to /ar/... or /en/...). Arabic, as the default language.
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>
        <main className="mx-auto flex min-h-screen max-w-site flex-col items-center justify-center gap-4 px-5 text-center">
          <h1 className="m-0 text-display-l">الصفحة غير موجودة</h1>
          <Link href="/ar" className="font-semibold underline underline-offset-4">
            ارجع للرئيسية
          </Link>
        </main>
      </body>
    </html>
  );
}
