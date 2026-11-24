# La Porta Cake: V1 Implementation Blueprint

- **Status:** Approved by the owner on 2026-11-24, with the decisions and corrections below.
- **Scope of V1:** the public storefront in Arabic and English, built on structured local data, ready for an API in V2.
- **Decisions:** see [docs/decisions](decisions/README.md).

## 1. Folder structure

```
la-porta-cake/  (local folder: "La Porta Web")
├─ apps/
│  └─ storefront/
│     ├─ src/
│     │  ├─ app/[locale]/           pages (see route map)
│     │  ├─ app/sitemap.ts, robots.ts, globals.css
│     │  ├─ components/             ui, layout, catalog, designs, order, home, contact
│     │  ├─ content/                structured JSON data
│     │  ├─ i18n/                   routing, request config, navigation helpers
│     │  ├─ lib/repositories/       factory and mock implementations
│     │  ├─ lib/seo/, lib/utils/
│     │  └─ middleware.ts
│     ├─ messages/                  ar.json, en.json (interface text)
│     ├─ public/images/             site/, products/, designs/
│     └─ e2e/                       Playwright tests
├─ packages/
│  ├─ domain/                       zod schemas, repository interfaces, order message builder
│  └─ config/                       shared tsconfig, ESLint, Prettier
├─ docs/                            blueprint, decisions, content gaps, design parity
├─ .github/workflows/ci.yml
└─ package.json, pnpm-workspace.yaml, .nvmrc, .npmrc, .editorconfig, .gitignore, .env.example
```

No Turborepo in V1; tasks run as pnpm workspace scripts.

## 2. Dependencies

| Package | Where | Purpose |
|---|---|---|
| next, react, react-dom | storefront | App Router, server components, static generation |
| next-intl | storefront | `/ar` and `/en` routing, interface text |
| tailwindcss, @tailwindcss/postcss | storefront | Styling with the prototype's design tokens |
| zod | domain | Schemas and validation; types inferred from schemas |
| clsx, tailwind-merge | storefront | Class composition |
| server-only | storefront | Keeps repository code on the server |
| typescript (strict) | all | Type safety |
| eslint, eslint-config-next, typescript-eslint | config | Linting, including a ban on physical left/right classes |
| prettier, prettier-plugin-tailwindcss | config | Formatting |
| vitest, @testing-library/react, @testing-library/jest-dom, jsdom | dev | Unit and component tests |
| @playwright/test, @axe-core/playwright | dev | End-to-end and accessibility tests |
| @lhci/cli (optional) | dev | Lighthouse checks |

Not in V1: state libraries, UI kits, CMS, analytics, Turborepo. Exact versions are chosen at scaffold time and locked in `pnpm-lock.yaml`.

## 3. Domain models

```ts
Locale          = 'ar' | 'en'
LocalizedText   = { ar: string; en: string }
Availability    = 'ready' | 'preorder' | 'unavailable' | 'seasonal'
DecorationType  = 'sugar' | 'print' | 'cream'

ImageRef        { src; width; height; alt: LocalizedText; blurDataURL?;
                  review: { status: 'approved' | 'pending'; reasons: string[] } }
Category        { id; slug; name; description?; layout: 'flavour-wall' | 'menu-list'; sort }
ProductVariant  { id; label: LocalizedText; servings: number | null; priceJod: number | null; isDefault }
Product         { id; slug; categoryId; name; description?; availability;
                  prepLeadHours: number | null; variants: ProductVariant[];
                  images: ImageRef[];            // empty = intentional placeholder
                  sort; isActive }
Occasion        { id; slug; name }
Design          { id; slug; title; decoration; occasionIds; isMini; image: ImageRef; sort; isPublished }
StoreSettings   { phoneE164; whatsappNumber; instagramUrl; facebookUrl; messengerUrl: string | null;
                  address: LocalizedText; mapsUrl; hours; delivery; defaultLeadHours; currency: 'JOD' }
FaqGroup        { id; title; items: { q: LocalizedText; a: LocalizedText | null }[] }
OrderDraft      { kind: 'product' | 'design' | 'custom'; refSlug?; size?; flavour?;
                  decoration?; writing?; date?; name?; notes? }
```

- Unknown prices, servings, options and preparation times are `null`. A product without a price shows **السعر عند الطلب** / **Price on request**.
- `buildOrderMessage(draft, locale, settings)` and the channel links are written once, in `packages/domain`.

## 4. Repositories and mock data

```ts
CatalogRepository  listCategories, getCategory(slug), listProducts(filter), getProduct(slug)
DesignRepository   listOccasions, listDesigns(filter), getDesign(slug)
SiteRepository     getSettings, listFaq
```

Mock repositories read and validate `src/content/*.json`: 2 categories, 21 products, 6 occasions, 30 designs, 4 FAQ groups, store settings. A factory selects the source from `DATA_SOURCE` (`mock` in V1). Repositories run on the server only; components receive plain props.

## 5. Route map

| Route | From artboard | Notes |
|---|---|---|
| `/` | none | Redirects to `/ar` |
| `/[locale]` | Main, Home-en | Home |
| `/[locale]/shop` | Shop | Filters in the URL |
| `/[locale]/shop/flavour-cakes` | Cat-Celebration | Flavour wall layout |
| `/[locale]/shop/sweets` | Cat-Treats | Menu list layout |
| `/[locale]/products/[slug]` | Product | One page per product |
| `/[locale]/our-work` | Decorations | Filters in the URL |
| `/[locale]/our-work/[slug]` | Decorations detail view | Design page with the order form |
| `/[locale]/custom-order` | Custom | Accepts `?design=` |
| `/[locale]/about`, `/contact`, `/faq` | About, Contact, FAQ | Contact uses a Google Maps link only |
| `/sitemap.xml`, `/robots.txt` | none | Both locales with hreflang |

## 6. Components

Server components by default; client components (◐) only where users interact.

- **ui:** Button, Chip ◐, AvailabilityBadge, PriceTag, ArchFrame, ImagePlaceholder, Section, SectionHeader, Breadcrumbs, Accordion ◐, Field, Input, Textarea
- **layout:** SiteHeader, MobileMenu ◐, LanguageSwitcher, SiteFooter
- **catalog:** ProductCard, ProductGrid, CatalogFilters ◐, SizePicker ◐, FlavourMosaic, FlavourWall, SweetsMenu, ProductGallery ◐
- **designs:** DesignCard, DesignGrid, DesignFilters ◐, DesignOrderPanel ◐
- **order:** OrderForm ◐, OrderSummary, SendOrderButtons, CopySummaryButton ◐
- **home:** Hero, ShopWindow, WideFeature, OccasionPicker, DecorationCompare, StartHere, CustomSteps, VisitUs
- **contact:** HoursTable, MapLinkCard

## 7. Localization

- `next-intl`, locale prefix always, `/` → `/ar`.
- Interface text in `messages/ar.json` and `messages/en.json`; business content as `{ ar, en }` in data.
- `<html lang dir>` from the locale; Tailwind logical utilities only; arrows flipped with `rtl:` variants.
- Fonts through `next/font`: Reem Kufi (Arabic display), IBM Plex Sans Arabic (body), Marcellus (English display).
- Western digits on both languages (`Intl` with `latn`).
- Language switch keeps the same page (shared English slugs).
- CI fails when any key or content field is missing in either language, or when the two languages diverge in structure.

## 8. Migration of the prototype

### Artboards (42)

| Prototype | Becomes |
|---|---|
| Main, Home-en | Home route and home sections |
| Shop(-en) | `/shop` |
| Cat-Celebration(-en) | `/shop/flavour-cakes` |
| Cat-Treats(-en) | `/shop/sweets` |
| Product(-en) | `/products/[slug]` |
| Decorations(-en) | `/our-work` and `/our-work/[slug]` |
| Custom(-en) | `/custom-order` |
| About, Contact, FAQ (×2) | Their routes |
| Nav, Footer | SiteHeader, SiteFooter |
| 20 Mobile-* wrappers | Not migrated as files; become the 390×844 test viewport |
| canvas.json | Not migrated |
| lp.css | Tailwind theme tokens and a few component classes |

Copy is extracted word for word from each Arabic artboard and its English twin.

### Images

Two separate tracks, each with its own acceptance criteria.

**Track A: the 48 existing prototype assets**
- Export every asset from the canvas asset store by its id. Backup source: the 1200 px copies from the earlier session, if still present.
- Rename descriptively, attach Arabic and English alt text from the prototype, place under `public/images/{site,products,designs}/`.
- Apply the photo policy (decision 0006). Flagged images are kept in the repository but marked `review.status = 'pending'` and not published until cleared.
- Report any asset that fails to export.

**Track B: the 5 products without photos**
- Petit four, cheesecake, mousse cake, muffins, maamoul.
- No invented photographs and no reused photos of other products.
- An intentional placeholder component (ImagePlaceholder), consistent with the design system, in both languages.

### Not exportable or not available

See [content-gaps.md](content-gaps.md).

## 9. SEO and performance

- Static generation for all locales, products and designs.
- Per-page metadata in both languages, canonical URLs, hreflang (ar, en, x-default), Open Graph images.
- JSON-LD: Bakery (address, phone, hours), BreadcrumbList, Product without price while the price is `null`.
- `next/image` with AVIF/WebP and `sizes`; fixed aspect ratios; priority only on the hero image.
- Targets on mobile: LCP < 2.5 s, CLS < 0.1, INP < 200 ms; Lighthouse ≥ 90 performance, ≥ 95 accessibility and SEO.

## 10. Testing

| Layer | Tool | Covers |
|---|---|---|
| Static checks | tsc (strict), ESLint, Prettier | Types, RTL-safe classes, formatting |
| Domain | Vitest | Schemas, order message in both languages (Arabic text, line breaks, empty fields), WhatsApp URL encoding, filters |
| Content | Vitest | Valid JSON, unique slugs, images exist, both languages present and consistent, no unsourced prices |
| Components | Testing Library | Filters, size picker, order form, copy button, accordion |
| End-to-end | Playwright (390, 768, 1280, 1440) | Both locales, language switch, gallery → design → WhatsApp message, RTL/LTR |
| Accessibility | axe | No serious or critical issues |
| CI | GitHub Actions | All of the above (after the GitHub repository is approved) |

## 11. Phases and acceptance criteria

| Phase | Work | Acceptance criteria |
|---|---|---|
| 0. Setup | pnpm installed, local Git, decision records, environment files | pnpm and Node 26 verified; engines enforced; decision records present; local Git initialised with no remote |
| 1. Scaffold | Workspace, config package, domain package, Next.js app, Tailwind, CI definition | `pnpm install`, `typecheck`, `lint`, `test`, `build` pass on a clean clone |
| 2. Domain and content | Schemas; 6 content files; image Tracks A and B | Content tests pass; all prices `null`; **Track A:** 48 of 48 assets exported or each failure reported, every exported image referenced, flagged images marked pending; **Track B:** 5 products use the placeholder, none uses another product's photo; content-gaps report updated |
| 3. Locales and data access | next-intl routing, middleware, fonts, mock repositories | `/` redirects to `/ar`; `/ar` RTL, `/en` LTR; switcher keeps the page; repository tests pass |
| 4. Design system | Tokens and components | Side-by-side parity with the prototype recorded; no axe critical issues |
| 5. Pages | Home, shop, categories, product, about, contact, FAQ | Parity in both languages at 4 widths; all links work; map is a link only |
| 6. Ordering | Gallery, design pages, custom order, product ordering, send buttons, copy summary | WhatsApp message decodes to the expected text in both languages; Instagram and Messenger open; copy works |
| 7. Quality | SEO, structured data, sitemap, e2e, accessibility, performance; Vercel readiness | Targets met; structured data valid; all tests green locally; no deployment without approval |
| 8. Content and launch | Owner data, domain, hosting | Owner sign-off; no placeholder text visible except approved "Price on request" and product photo placeholders |
