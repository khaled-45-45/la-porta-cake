/**
 * Site paths without the language prefix; the i18n Link adds /ar or /en.
 * Route plan from the V1 blueprint (section 8). About, FAQ and contact arrive in a later phase,
 * so until then those links answer with the localized "page not found".
 */
export const routes = {
  home: '/',
  shop: '/shop',
  category: (slug: string) => `/shop/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  ourWork: '/our-work',
  design: (slug: string) => `/our-work/${slug}`,
  customOrder: '/custom-order',
  /** The custom-order form for a gallery design. The page checks the design again. */
  customOrderFor: (designSlug: string) => `/custom-order?design=${encodeURIComponent(designSlug)}`,
  about: '/about',
  faq: '/faq',
  contact: '/contact',
} as const;

export type NavKey = 'shop' | 'customOrder' | 'ourWork' | 'about' | 'faq' | 'contact';

/** The main navigation, in the prototype's order. Labels live in messages (Nav.*). */
export const MAIN_NAV: readonly { key: NavKey; href: string }[] = [
  { key: 'shop', href: routes.shop },
  { key: 'customOrder', href: routes.customOrder },
  { key: 'ourWork', href: routes.ourWork },
  { key: 'about', href: routes.about },
  { key: 'faq', href: routes.faq },
  { key: 'contact', href: routes.contact },
];

const within = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * The main section a path belongs to, for `aria-current` in the navigation.
 * Category and product pages belong to the shop; design pages to "our work".
 */
export function sectionForPath(pathname: string): NavKey | null {
  if (within(pathname, routes.shop) || within(pathname, '/products')) return 'shop';
  return MAIN_NAV.find((item) => item.key !== 'shop' && within(pathname, item.href))?.key ?? null;
}
