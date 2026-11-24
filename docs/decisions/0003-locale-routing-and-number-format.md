# 0003. Locale routing (`/` → `/ar`) and Western digits

- **Status:** Approved by the owner, 2026-11-24 (decisions D1 and D6)
- **Supersedes:** none

## Decision

- Every page lives under a locale prefix: `/ar/...` and `/en/...`.
- `/` redirects to `/ar`. Arabic is the default locale.
- Slugs are English and shared by both locales (for example `/ar/products/kitkat-cake` and `/en/products/kitkat-cake`), so the language switcher keeps the visitor on the same page.
- `<html lang>` and `dir` come from the locale: `ar` is RTL, `en` is LTR. Layout uses logical CSS utilities only.
- Numbers, prices, dates and phone numbers use **Western digits** (0–9) on both Arabic and English pages, for example `0788890049`.

## Consequences

- Number and date formatting uses `Intl` with the `latn` numbering system on Arabic pages.
- Every page needs Arabic and English text. A test fails when either language is missing (see 0005).
