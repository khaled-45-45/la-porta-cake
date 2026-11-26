import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getRepositories } from '@/lib/data';
import { loadCategoryPage, loadHome, loadProductPage, loadShop } from '@/lib/storefront';
import { product } from '@/test/fixtures';
import { setPathname } from '@/test/mock-navigation';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { CategoryView, HomeView, ProductView, ShopView } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const repositories = getRepositories();
const [home, shop, flavourCakes, sweets, kitkat, cheesecake, despacito] = await Promise.all([
  loadHome(repositories),
  loadShop(repositories),
  loadCategoryPage(repositories, 'flavour-cakes'),
  loadCategoryPage(repositories, 'sweets'),
  loadProductPage(repositories, 'kitkat-cake'),
  loadProductPage(repositories, 'cheesecake'),
  loadProductPage(repositories, 'despacito'),
]);
if (!flavourCakes || !sweets || !kitkat || !cheesecake || !despacito) {
  throw new Error('Real content is missing an expected page.');
}

const unpublished = (
  JSON.parse(readFileSync(join(process.cwd(), 'src/content/designs.json'), 'utf8')) as {
    slug: string;
    isPublished: boolean;
    title: { ar: string; en: string };
  }[]
).filter((d) => !d.isPublished);

/** Nothing private, unpublished or internal in what a page renders. */
function expectNothingPrivate(container: HTMLElement) {
  const html = container.innerHTML;
  expect(html).not.toMatch(/private-assets|review\/|isActive|isPublished|sourceAssetId/);
  for (const d of unpublished) {
    expect(html).not.toContain(`/our-work/${d.slug}`);
    expect(container).not.toHaveTextContent(d.title.ar);
    expect(container).not.toHaveTextContent(d.title.en);
  }
  for (const img of container.querySelectorAll('img')) {
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toMatch(
      /\/images\/(products|designs|site)\//,
    );
  }
}

const headings = (level: number) =>
  screen.getAllByRole('heading', { level }).map((h) => h.textContent);

beforeEach(() => setPathname('/'));

describe('HomeView', () => {
  it('has one h1, the hero, and the sections in prototype order (Arabic)', () => {
    renderWithLocale(<HomeView data={home} />, 'ar');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(headings(1)).toEqual(['كيك يومي بالفاترينة، وتصاميم بتنعمل لمناسبتك']);
    expect(headings(2)).toEqual([
      'من الفاترينة',
      'كيك العزايم والأعراس',
      'اختار حسب مناسبتك',
      'قوالب سكر أو قوالب صور',
      'من وين تبدأ',
      'زورونا بالرصيفة',
    ]);
  });

  it('leads to the shop and to WhatsApp, in English', () => {
    renderWithLocale(<HomeView data={home} />, 'en');
    expect(headings(1)).toEqual([
      'Fresh cakes in the shop every day, and designs made for your occasion',
    ]);
    expect(screen.getByRole('link', { name: 'Browse cakes' })).toHaveAttribute(
      'href',
      '/current/shop',
    );
    const whatsapp = screen.getAllByRole('link', { name: /Order on WhatsApp/ });
    expect(whatsapp[0]).toHaveAttribute('href', 'https://wa.me/962788890049');
    const occasion = screen.getByRole('link', { name: 'Order a cake for your occasion' });
    expect(new URL(occasion.getAttribute('href')!).searchParams.get('text')).toBe(
      'Hello La Porta, I’d like to order a cake for an occasion.',
    );
  });

  it('features four ready flavour cakes as product cards', () => {
    const { container } = renderWithLocale(<HomeView data={home} />, 'en');
    const featured = screen
      .getByRole('heading', { name: 'From the shop window' })
      .closest('section')!;
    const cards = within(featured)
      .getAllByRole('link')
      .filter((a) => a.hasAttribute('data-product'));
    expect(cards).toHaveLength(4);
    for (const card of cards) expect(card).toHaveAccessibleDescription(/Flavour cakes Ready/);
    expect(within(featured).getByRole('link', { name: 'All flavour cakes' })).toHaveAttribute(
      'href',
      '/current/shop/flavour-cakes',
    );
    expectNothingPrivate(container);
  });

  it('features published designs only', () => {
    const { container } = renderWithLocale(<HomeView data={home} />, 'ar');
    expect(container.querySelectorAll('[data-design]')).toHaveLength(4);
    expectNothingPrivate(container);
  });

  it('links each category door to its page', () => {
    renderWithLocale(<HomeView data={home} />, 'ar');
    const doors = screen.getByRole('heading', { name: 'من وين تبدأ' }).closest('section')!;
    expect(
      within(doors)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/current/shop/flavour-cakes', '/current/shop/sweets']);
  });

  it('shows the verified visit details, with Western digits', () => {
    renderWithLocale(<HomeView data={home} />, 'ar');
    const visit = screen.getByRole('heading', { name: 'زورونا بالرصيفة' }).closest('section')!;
    expect(visit).toHaveTextContent(home.settings.address.ar);
    expect(visit).toHaveTextContent('ساعات العمل: يوميًا من 11 ص إلى 11 م');
    expect(
      within(visit).getByRole('link', { name: 'افتح الموقع في خرائط Google' }),
    ).toHaveAttribute('href', home.settings.mapsUrl);
    expect(visit.textContent).not.toMatch(/[٠-٩]/);
    // The number calls the shop; WhatsApp has its own link.
    expect(within(visit).getByRole('link', { name: '0788890049' })).toHaveAttribute(
      'href',
      'tel:+962788890049',
    );
    expect(within(visit).getByRole('link', { name: 'اطلب عبر واتساب' })).toHaveAttribute(
      'href',
      'https://wa.me/962788890049',
    );
  });

  it('keeps the small hero photo inside the page below 1280px (no horizontal scroll)', () => {
    renderWithLocale(<HomeView data={home} />, 'en');
    const small = screen.getByRole('img', { name: home.hero[1]!.image.alt.en }).parentElement!;
    // The prototype's -72px offset only fits once there is room beside the container.
    expect(small).toHaveClass('-end-6', 'xl:-end-18', 'max-sm:hidden');
    expect(small).not.toHaveClass('lg:-end-18');
  });

  it('describes every photo with its approved alt text, or hides decorative ones', () => {
    const { container } = renderWithLocale(<HomeView data={home} />, 'en');
    for (const img of container.querySelectorAll('img')) {
      expect(img.hasAttribute('alt')).toBe(true);
    }
    expect(screen.getByRole('img', { name: home.hero[0]!.image.alt.en })).toBeInTheDocument();
  });
});

describe('ShopView', () => {
  it('lists all 21 public products, with search and filters', async () => {
    const user = userEvent.setup();
    const { container } = renderWithLocale(<ShopView data={shop} />, 'ar');
    expect(headings(1)).toEqual(['المتجر']);
    expect(container.querySelectorAll('[data-product]')).toHaveLength(21);
    await user.type(screen.getByRole('searchbox', { name: 'ابحث في الأصناف' }), 'لوتس');
    expect(
      [...container.querySelectorAll('[data-product]')].map((el) =>
        el.getAttribute('data-product'),
      ),
    ).toEqual(['lotus-cake']);
    expect(screen.getByRole('radiogroup', { name: 'تصفية حسب القسم' })).toBeInTheDocument();
    expectNothingPrivate(container);
  });

  it('shows the availability legend', () => {
    renderWithLocale(<ShopView data={shop} />, 'en');
    expect(
      screen.getByRole('group', { name: 'What the availability labels mean' }),
    ).toBeInTheDocument();
  });
});

describe('CategoryView', () => {
  it('shows only this category, with breadcrumbs and section links (flavour cakes)', () => {
    setPathname('/shop/flavour-cakes');
    const { container } = renderWithLocale(<CategoryView data={flavourCakes} />, 'en');
    expect(headings(1)).toEqual(['Flavour cakes']);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/current', '/current/shop']);
    expect(within(crumbs).getByText('Flavour cakes')).toHaveAttribute('aria-current', 'page');
    const sections = screen.getByRole('navigation', { name: 'Shop sections' });
    expect(within(sections).getByRole('link', { current: 'page' })).toHaveTextContent(
      'Flavour cakes',
    );
    expect(container.querySelectorAll('[data-product]')).toHaveLength(12);
    // One category: the section chips are left out, search stays.
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expectNothingPrivate(container);
  });

  it('groups sweets by availability (menu layout)', () => {
    const { container } = renderWithLocale(<CategoryView data={sweets} />, 'ar');
    expect(headings(2)).toEqual(['بالفاترينة', 'على الطلب', 'موسمي']);
    expect(container.querySelectorAll('[data-product]')).toHaveLength(9);
    const preorder = screen.getByRole('heading', { name: 'على الطلب' }).closest('section')!;
    expect(
      within(preorder)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['تشيز كيك', 'كيك موس', 'مافن']);
    // The whole page is one category: the cards don't repeat its name.
    for (const card of container.querySelectorAll('[data-product]')) {
      expect(card).not.toHaveTextContent('حلويات');
    }
    expectNothingPrivate(container);
  });

  it('does not repeat the category name on cards in the grid layout either', () => {
    const { container } = renderWithLocale(<CategoryView data={flavourCakes} />, 'en');
    for (const card of container.querySelectorAll('[data-product]')) {
      expect(card).not.toHaveTextContent('Flavour cakes');
      expect(card).toHaveAccessibleDescription(/^Ready Price on request$/);
    }
  });

  it('asks about the category on WhatsApp with an encoded message', () => {
    renderWithLocale(<CategoryView data={sweets} />, 'en');
    const ask = screen.getByRole('link', { name: 'Ask us on WhatsApp' });
    const url = new URL(ask.getAttribute('href')!);
    expect(url.host).toBe('wa.me');
    expect(url.searchParams.get('text')).toBe('Hello La Porta, I’d like to ask about Sweets.');
  });
});

describe('ProductView', () => {
  it('shows the name, category, availability, description and price on request', () => {
    const { container } = renderWithLocale(<ProductView data={kitkat} />, 'ar');
    expect(headings(1)).toEqual(['كيكة كيت كات']);
    const crumbs = screen.getByRole('navigation', { name: 'مسار الصفحة' });
    expect(
      within(crumbs)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.replace('/', '')),
    ).toEqual(['الرئيسية', 'المتجر', 'كيك بالنكهات', 'كيكة كيت كات']);
    expect(container).toHaveTextContent(kitkat.product.description!.ar);
    expect(container).toHaveTextContent('جاهز');
    expect(container).toHaveTextContent('السعر عند الطلب');
    expect(container).toHaveTextContent('يظهر السعر هنا بعد تأكيده من المحل');
    expect(screen.getByRole('img', { name: kitkat.product.images[0]!.alt.ar })).toBeInTheDocument();
    expectNothingPrivate(container);
  });

  it('orders on WhatsApp with the localized product name, safely encoded', () => {
    for (const locale of ['ar', 'en'] as const) {
      const { unmount } = renderWithLocale(<ProductView data={kitkat} />, locale);
      const order = screen
        .getAllByRole('link')
        .find((a) => a.getAttribute('href')?.startsWith('https://wa.me/'))!;
      const url = new URL(order.getAttribute('href')!);
      expect(url.pathname).toBe('/962788890049');
      expect(url.searchParams.get('text')).toBe(
        locale === 'ar'
          ? 'مرحبا لابورتا، بدي أطلب: كيكة كيت كات'
          : 'Hello La Porta, I’d like to order: KitKat cake',
      );
      unmount();
    }
  });

  it('shows the lead time for items made to order, and not for ready ones', () => {
    const { unmount } = renderWithLocale(<ProductView data={cheesecake} />, 'ar');
    expect(screen.getByText('احجزه قبل يوم على الأقل.')).toBeInTheDocument();
    // Said once: the general preorder note is left out when the lead time is shown.
    expect(screen.queryByText('يحتاج حجز قبل موعد الاستلام بيوم على الأقل')).toBeNull();
    expect(screen.getByText('طلب مسبق')).toBeInTheDocument();
    unmount();
    renderWithLocale(<ProductView data={kitkat} />, 'en');
    expect(screen.queryByText(/Order at least/)).toBeNull();
  });

  it('shows the placeholder for a product without an approved photo', () => {
    const { container } = renderWithLocale(<ProductView data={despacito} />, 'en');
    expect(screen.getByRole('img', { name: 'Despacito: No photo yet' })).toBeInTheDocument();
    // Its own gallery has no photo; the related products below may have theirs.
    const related = screen
      .getByRole('heading', { name: 'You might also like' })
      .closest('section')!;
    const ownImages = [...container.querySelectorAll('main img')].filter(
      (img) => !related.contains(img),
    );
    expect(ownImages).toEqual([]);
  });

  it('lists related products from the same category', () => {
    renderWithLocale(<ProductView data={kitkat} />, 'en');
    const related = screen
      .getByRole('heading', { name: 'You might also like' })
      .closest('section')!;
    const cards = within(related)
      .getAllByRole('link')
      .filter((a) => a.hasAttribute('data-product'));
    expect(cards).toHaveLength(4);
    expect(cards.map((c) => c.getAttribute('data-product'))).not.toContain('kitkat-cake');
  });

  it('shows sizes, servings and confirmed prices only when recorded', () => {
    const withSizes = {
      ...kitkat,
      product: product({
        variants: [
          {
            id: 's',
            label: { ar: 'صغير', en: 'Small' },
            servings: 6,
            priceJod: 12.5,
            source: 'owner',
            isDefault: true,
          },
          {
            id: 'l',
            label: { ar: 'كبير', en: 'Large' },
            servings: null,
            priceJod: null,
            source: null,
            isDefault: false,
          },
        ],
      }),
    };
    renderWithLocale(<ProductView data={withSizes} />, 'en');
    const table = screen.getByRole('table', { name: 'Sizes' });
    expect(
      within(table)
        .getAllByRole('row')
        // Intl separates "JOD" and the amount with a no-break space.
        .map((r) => r.textContent?.replace(/\s+/g, ' ')),
    ).toEqual(['SizeServesPrice', 'Small6 peopleJOD 12.5', 'Large–Price on request']);
    // The table carries the prices: no separate price box that could contradict it,
    // and the note explains the size still on request.
    expect(screen.queryByText('Price', { selector: 'span' })).toBeNull();
    expect(screen.getAllByText(/The price shows here once/)).toHaveLength(1);
  });

  it('shows one price box when there are no sizes', () => {
    renderWithLocale(<ProductView data={kitkat} />, 'en');
    expect(screen.queryByRole('table')).toBeNull();
    const box = screen.getByText('Price', { selector: 'span' }).parentElement!;
    expect(box).toHaveTextContent('Price on request');
    expect(box).toHaveTextContent('The price shows here once the shop confirms it');
  });

  it('shows the hours when the lead time is not whole days', () => {
    // The loader prepares the lead time (see storefront.test.ts); the view only shows it.
    const custom = { ...cheesecake, leadTime: { hours: 36 } };
    renderWithLocale(<ProductView data={custom} />, 'en');
    expect(screen.getByText('Order at least 36 hours ahead.')).toBeInTheDocument();
  });
});

describe('page views and direction', () => {
  it.each(['ar', 'en'] as const)('use only logical direction classes (%s)', (locale) => {
    for (const view of [
      <HomeView key="h" data={home} />,
      <ShopView key="s" data={shop} />,
      <CategoryView key="c" data={sweets} />,
      <ProductView key="p" data={kitkat} />,
    ]) {
      const { container, unmount } = renderWithLocale(view, locale);
      expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
      unmount();
    }
  });
});
