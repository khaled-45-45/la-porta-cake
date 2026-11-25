# 0012. Temporary root redirect and no language detection

- **Status:** Approved by the owner, 2026-11-25 (Phase 3 scope, decision 2)
- **Supersedes:** none. Refines 0003.

## Decision

- `/` redirects to `/ar` with a **temporary** redirect (HTTP 307), so browsers and search engines do not cache it permanently and language detection can be added later without stale redirects.
- No automatic language detection: every visitor to `/` goes to Arabic, regardless of browser language or cookies.
- A path without a supported language prefix is treated as an Arabic path (for example `/fr` → `/ar/fr`), which shows the Arabic "page not found" page.
- Locale handling runs in Next.js 16's `proxy.ts` (formerly `middleware.ts`).

## Consequences

- The language switcher is the only way to change language; the choice is reflected in the URL (`/ar/...` or `/en/...`).
- If language detection is wanted later, it can be enabled without changing URLs.

## Note: how "page not found" is rendered (found in Phase 3, 2026-11-25)

Next.js 16.4.6 answers `notFound()` with HTTP 404 and a minimal HTML shell (`<html id="__next_error__">`). The localized "page not found" page, including `<html lang dir>`, is rendered in the browser from the data sent with that response. This was confirmed with a minimal Next.js app that has no next-intl or project code, so it is how the framework works, not a project bug.

What this means:

- The 404 status and the localized text are correct in the server response. The route check (`pnpm test:routes`) asserts both.
- With JavaScript on, visitors see the correct page in the correct language and direction (checked in a browser).
- Without JavaScript, the page is blank. Search engines do not index 404 pages, so there is no SEO cost.
- Re-check this when Next.js is upgraded; if server-rendered 404 pages return, the route check should assert `lang` and `dir` on them again.
