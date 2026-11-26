# Storefront components

Inventory of the storefront's reusable components (Phases 3 and 4). Each component's file starts with a comment describing its purpose, accessibility behaviour and prototype source. Dev-only previews of all of them, with real data, are at `/ar/design-system` and `/ar/design-system/composites` (both answer 404 in production).

Rules that apply to all of them:

- Server components by default. The only client components are those that hold state: `LanguageSwitcher`, `MainNav`, `MobileMenu`, `CatalogBrowser`, `DesignGallery`.
- No component reads content files. Data comes from the repositories (`getRepositories()` in `@/lib/data`) and is passed in as props. A lint rule enforces this.
- Presentation rules live in `src/lib`, not in components: visibility and price (`lib/catalog.ts`, server only), filtering (`lib/filters.ts`), routes (`lib/routes.ts`), formatting (`lib/format.ts`).
- Browser code imports only types from `@la-porta/domain`, plus the zod-free entries `@la-porta/domain/locale` and `@la-porta/domain/search`. A lint rule and the bundle check in `pnpm test:routes` enforce this.
- Logical direction classes only (`ms-`, `ps-`, `start-`), so Arabic and English share one layout. Tests check every component in both directions.
- Focus rings are rose-ink on light backgrounds; dark areas (the footer, ink sections) add `focus-ring-on-dark` for rose-soft, so every ring reaches 3:1 (WCAG 1.4.11). `tokens.test.ts` checks each ring colour against its background.

## Primitives (`components/ui`, Phase 3)

| Component | Purpose |
|---|---|
| `Button`, `buttonClassName` | Dark, line, rose and light buttons; renders a link when given `href` |
| `Chip`, `chipClassName` | Selectable filter option (`aria-pressed`); chip-styled links |
| `AvailabilityBadge` | Ready, preorder, unavailable, seasonal: told apart by shape and word |
| `PriceTag` | Confirmed price with Western digits, or "Price on request" |
| `ImagePlaceholder` | Labelled "no photo yet" frame |
| `ArchFrame` | The doorway arch, optionally outlined |
| `Container`, `Section`, `SectionHeading` | Page width, bands, section titles (with an optional action) |
| `Field`, `Label`, `Input`, `Textarea` | Form controls with linked hints and errors |
| `SkipLink`, `VisuallyHidden` | Accessibility helpers |
| `LanguageSwitcher` | Same page in the other language |
| `TextLink`, `textLinkClassName` | Inline link with the rose underline (prototype `.tlink`); internal paths keep the language (Phase 5) |

## Site shell (`components/site`, Phase 4)

| Component | Purpose |
|---|---|
| `SiteHeader` | Logo, main navigation, language switch, WhatsApp button. Not sticky, as in the prototype |
| `BrandLink` | Doorway mark and "La Porta", linking home |
| `MainNav` | Desktop links from 1100px; `aria-current` on the current section |
| `MobileMenu` | Menu button and panel below 1100px: a disclosure with `aria-expanded`, Escape to close, closes on navigation |
| `SiteFooter` | Brand, visit details and hours, contact links, page links, payment note; all from the store settings |
| `useOpeningHoursLines` | The opening hours as sentences, shared by the footer and the home page (Phase 5) |

## Products (`components/catalog`)

| Component | Purpose |
|---|---|
| `ProductCard` | Photo or placeholder, availability, category, name, price; links to the product page. The link is named by the product name, with category, availability and price as its description. Draws nothing for an inactive product |
| `ProductImage` | Photo in a fixed-ratio frame via `next/image`, or the placeholder |
| `ProductPrice` | The confirmed price of the default size, or "Price on request" |
| `ProductAvailability` | Badge, optionally with what it means |
| `AvailabilityLegend` | All states and their meaning |
| `CategoryNav` | Chip-styled links between the shop and its categories |
| `CatalogBrowser` | Client: search, category chips, "Ready only", live count, empty state |
| `ProductCatalog` | Server entry point: renders the cards and hands them to `CatalogBrowser`. With a single category (a category page) the section chips are left out |
| `ProductMenu` | A category grouped by availability: in the shop, made to order, seasonal (category layout `menu-list`, Phase 5) |

## Designs (`components/designs`)

| Component | Purpose |
|---|---|
| `DesignCard` | Photo, decoration type, title, occasion tags, "I want one like this". Draws nothing for unpublished designs or non-public photos |
| `OccasionTags` | Occasion and "Mini" tags |
| `DesignGallery` | Client: decoration and occasion filters, "Mini cakes only", live count, empty state. The filter bar is sticky from 640px only |
| `WorkGallery` | Server entry point: keeps public designs, renders the cards, hands them to `DesignGallery` |

## Filters (`components/filters`) and shared (`components/shared`)

| Component | Purpose |
|---|---|
| `SearchField` | Rounded search box with a hidden label |
| `ChoiceChips` | Single-choice chips with radio-group semantics: one Tab stop, arrow keys (mirrored in Arabic), Home and End |
| `ToggleField` | Checkbox with label, 44px tall |
| `FilterPanel` | The bar holding the filters; optionally sticky from 640px, reserving its height as scroll padding so focused items are not hidden behind it |
| `ResultCount` | Count announced politely when it changes |
| `Breadcrumbs` | Ordered list ending on the current page |
| `EmptyState` | What happened and what to do next |
| `CardGrid` | Responsive card list (products: 2/4 columns, designs: 2/3/4) |
| `CardGridSkeleton` | Loading placeholder for Suspense fallbacks |
| `CtaBand` | Dark band linking to the next step |

## Data exposure checks

Pending images, unpublished designs, inactive products and internal fields must never reach the browser (decisions 0006, 0010). What guards this today:

- `components/client-props.test.tsx`: the exact props passed to the two client components (`CatalogBrowser`, `DesignGallery`), with fixtures that include hidden records and with the real content. Only the filter fields (`id`, `categoryId`, `availability`, `searchText`; `id`, `decoration`, `occasionIds`, `isMini`) and category or occasion names may cross; the cards are server-rendered elements.
- `components/exposure.test.tsx`: the rendered output of the real content has no private paths and none of the unpublished designs.
- `pnpm test:routes`: browser bundles contain no zod, schemas or `DATA_SOURCE`; the image optimizer and the static file server refuse private files, including traversal and malformed paths.
- `pnpm test:routes` (Phase 5): every storefront page in both languages (home, shop, each category, each product) is fetched from the production build. The HTML and the decoded React Server Components payload (`self.__next_f`) are searched for private paths, internal field names (`isPublished`, `isActive`, `sourceAssetId`, `prepLeadHours`, …), the slugs and titles of every unpublished design, facet fields outside the lists above, and image URLs (`src`, `srcset`, preload hints) outside `/images/`. A self-test plants leaks in a fake page first, so a passing scan means something. Malformed paths (wrong case, extra segments, encoded traversal, script in the path, null byte) must answer 404 without reflecting markup, and every page, 404 and the root redirect must carry the security headers.
- `lib/storefront.test.ts`: the page loaders never return inactive products, unpublished designs or pending photos, both with a correct repository and with a deliberately faulty one that returns every stored record unfiltered.

## Pages (`components/pages`, `app/[locale]`, Phase 5)

Each route is a thin server component: it loads data through a loader in `lib/storefront.ts` (repositories in, plain data out, visibility checked again, products reduced to their public photos) and renders a view from `components/pages`. Views only present: the product loader prepares the photos, the price to show and the lead time. Unknown categories and products, inactive products included, answer the localized "page not found"; all of them are built ahead of time (`dynamicParams = false`).

| Route | View | Contents |
|---|---|---|
| `/ar`, `/en` | `HomeView` | Hero (prototype cakes), four ready flavour cakes, shop-window band, four published designs, sugar paste or printed photo, category doors, visit details |
| `/[locale]/shop` | `ShopView` | Every public product with search, section chips and "Ready only"; availability legend |
| `/[locale]/shop/[category]` | `CategoryView` | Breadcrumbs, description, WhatsApp question, section links; `flavour-wall` categories use the searchable grid, `menu-list` categories the availability menu |
| `/[locale]/products/[slug]` | `ProductView` | Breadcrumbs, photo or placeholder, category, availability, description, lead time (made-to-order items), sizes table (only when sizes are recorded), price or "Price on request", WhatsApp and Instagram, related products |

Content decisions, made from the data only (decision 0005):

- Featured products: no "featured" flag exists, so the home page shows the first ready flavour cakes with a photo, in the shop's order, leaving out the two hero cakes (as the prototype does).
- Featured designs: the first published designs, in order.
- Lead time: shown for made-to-order items only, from the product's own value or the store default (24 hours, verified).
- Sizes, servings, prices, ingredients and storage: none are recorded yet, so the prototype's sizes table and accordions are left out and prices read "Price on request".
- The WhatsApp order message is localized and carries the product name: "مرحبا لابورتا، بدي أطلب: {name}" / "Hello La Porta, I’d like to order: {name}".

Left out until their target pages exist (Phase 6): the prototype's custom-order steps, occasion circles and "see all our work" links, the flavour page's "custom design" band and the shop's gallery banner. The design cards' own "I want one like this" buttons and the header's links to pages not built yet still lead to "page not found" until then.

## Security headers

`next.config.ts` sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns off camera, microphone, location, payment, USB and topics, and a Content-Security-Policy limited to `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. The CSP does not restrict scripts or styles, so it works with static pages; a script policy needs per-request nonces and is planned for Phase 7.

## Routes

Links use the route plan in `lib/routes.ts` (blueprint section 8): `/shop`, `/shop/[category]`, `/products/[slug]`, `/our-work`, `/our-work/[slug]`, `/custom-order`, `/about`, `/faq`, `/contact`. Phase 5 built the shop, category and product pages; the others arrive in Phase 6 and show the localized "page not found" until then.
