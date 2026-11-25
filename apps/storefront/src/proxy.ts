import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

// Next.js 16 runs this file (formerly middleware.ts) before each matching request.
// It adds the locale prefix: `/` → `/ar` (307), `/fr` → `/ar/fr` (decision 0012).
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next.js internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
