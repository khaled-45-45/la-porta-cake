import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Availability } from '@la-porta/domain';

import { flavourCakes, image, product, sweets } from '@/test/fixtures';
import { setPathname } from '@/test/mock-navigation';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import {
  AvailabilityLegend,
  CategoryNav,
  ProductAvailability,
  ProductCard,
  ProductCatalog,
  ProductImage,
} from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

beforeEach(() => setPathname('/'));

const imgSrc = (img: HTMLElement) => decodeURIComponent(img.getAttribute('src') ?? '');

describe('ProductCard', () => {
  it('links to the product page and shows category, name, availability and price', () => {
    renderWithLocale(<ProductCard product={product()} category={flavourCakes} />, 'ar');
    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/current/products/lotus-cake');
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent('كيكة لوتس');
    expect(card).toHaveTextContent('كيك بالنكهات');
    expect(card).toHaveTextContent('جاهز');
    expect(card).toHaveTextContent('السعر عند الطلب');
  });

  it('shows the photo without repeating the name to screen readers', () => {
    const { container } = renderWithLocale(<ProductCard product={product()} />, 'en');
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(imgSrc(img)).toContain('/images/products/lotus-cake.jpg');
  });

  it('shows the placeholder, with its label, for a product without a photo', () => {
    const { container } = renderWithLocale(<ProductCard product={product({ images: [] })} />, 'en');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Lotus cake: No photo yet' })).toBeInTheDocument();
  });

  it('never shows a pending photo, even if one is passed in', () => {
    const pending = product({
      images: [image('private-assets/review/products/lotus-cake.jpg', 'pending')],
    });
    const { container } = renderWithLocale(<ProductCard product={pending} />, 'en');
    expect(container.innerHTML).not.toContain('private-assets');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: /No photo yet/ })).toBeInTheDocument();
  });

  it('shows a confirmed price with Western digits', () => {
    const priced = product({
      variants: [
        {
          id: 'small',
          label: { ar: 'صغير', en: 'Small' },
          servings: null,
          priceJod: 12.5,
          source: 'owner, 2026-11-24',
          isDefault: true,
        },
      ],
    });
    renderWithLocale(<ProductCard product={priced} />, 'ar');
    expect(screen.getByRole('link')).toHaveTextContent('12.5');
    expect(screen.getByRole('link').textContent).not.toMatch(/[٠-٩]/);
  });

  it.each<Availability>(['ready', 'preorder', 'unavailable', 'seasonal'])(
    'shows the "%s" state',
    (availability) => {
      const { container } = renderWithLocale(
        <ProductCard product={product({ availability })} />,
        'en',
      );
      expect(container.querySelector(`[data-availability="${availability}"]`)).not.toBeNull();
    },
  );

  it('is announced by the product name, with category, availability and price as its description', () => {
    renderWithLocale(<ProductCard product={product()} category={flavourCakes} />, 'ar');
    const card = screen.getByRole('link', { name: 'كيكة لوتس' });
    expect(card).toHaveAccessibleName('كيكة لوتس');
    expect(card).toHaveAccessibleDescription('كيك بالنكهات جاهز السعر عند الطلب');
  });

  it('keeps the name first for a product without a photo, in English too', () => {
    renderWithLocale(
      <ProductCard product={product({ images: [], availability: 'preorder' })} />,
      'en',
    );
    const card = screen.getByRole('link', { name: 'Lotus cake' });
    expect(card).toHaveAccessibleDescription('Preorder Price on request');
  });

  it('draws nothing for an inactive product, and draws an active one', () => {
    const { container, rerender } = renderWithLocale(
      <ProductCard product={product({ isActive: false })} />,
      'en',
    );
    expect(container.querySelector('[data-product]')).toBeNull();
    rerender(<ProductCard product={product({ isActive: true })} />);
    expect(container.querySelector('[data-product="lotus-cake"]')).not.toBeNull();
  });

  it('can use a lower heading level inside a titled section', () => {
    renderWithLocale(<ProductCard product={product()} headingLevel={3} />, 'en');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Lotus cake');
  });
});

describe('ProductImage', () => {
  it('describes the photo with its approved alt text outside cards', () => {
    renderWithLocale(
      <ProductImage image={image('/images/products/a.jpg')} name="Lotus cake" />,
      'en',
    );
    expect(screen.getByRole('img', { name: 'Photo' })).toBeInTheDocument();
  });
});

describe('availability', () => {
  it('explains every state in the legend', () => {
    renderWithLocale(<AvailabilityLegend />, 'en');
    const legend = screen.getByRole('group', { name: 'What the availability labels mean' });
    expect(legend.querySelector('dl')).not.toBeNull();
    expect(legend).toHaveTextContent('ReadyIn the shop today, as of our last update');
    expect(legend).toHaveTextContent('PreorderOrder at least a day before pickup');
    expect(legend).toHaveTextContent('Unavailable');
    expect(legend).toHaveTextContent('SeasonalBack in its season');
  });

  it('shows a badge alone or with its note', () => {
    const { container, rerender } = renderWithLocale(
      <ProductAvailability availability="preorder" />,
      'ar',
    );
    expect(container).toHaveTextContent('طلب مسبق');
    expect(container).not.toHaveTextContent('يحتاج حجز');
    rerender(<ProductAvailability availability="preorder" withNote />);
    expect(container).toHaveTextContent('يحتاج حجز قبل موعد الاستلام بيوم على الأقل');
  });
});

describe('CategoryNav', () => {
  it('links the shop and each category, marking the current one', () => {
    renderWithLocale(<CategoryNav categories={[flavourCakes, sweets]} current="sweets" />, 'ar');
    const nav = screen.getByRole('navigation', { name: 'أقسام المتجر' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['الكل', '/current/shop'],
      ['كيك بالنكهات', '/current/shop/flavour-cakes'],
      ['حلويات', '/current/shop/sweets'],
    ]);
    expect(within(nav).getByRole('link', { current: 'page' })).toHaveTextContent('حلويات');
  });
});

describe('ProductCatalog (search and filters)', () => {
  const products = [
    product(),
    product({
      id: 'kitkat-cake',
      slug: 'kitkat-cake',
      name: { ar: 'كيكة كيت كات', en: 'KitKat cake' },
    }),
    product({
      id: 'cheesecake',
      slug: 'cheesecake',
      categoryId: 'sweets',
      name: { ar: 'تشيز كيك', en: 'Cheesecake' },
      availability: 'preorder',
      images: [],
    }),
  ];

  function setup(locale: 'ar' | 'en' = 'en') {
    const user = userEvent.setup();
    const view = renderWithLocale(
      <ProductCatalog products={products} categories={[flavourCakes, sweets]} />,
      locale,
    );
    const cards = () =>
      [...view.container.querySelectorAll('[data-product] h2')].map((h) => h.textContent ?? '');
    return { user, cards, ...view };
  }

  it('shows every product and the count', () => {
    const { cards } = setup();
    expect(cards()).toEqual(['Lotus cake', 'KitKat cake', 'Cheesecake']);
    expect(screen.getByText('3 items')).toHaveAttribute('aria-live', 'polite');
  });

  it('filters by section with a single-choice radio group', async () => {
    const { user, cards } = setup();
    const group = screen.getByRole('radiogroup', { name: 'Filter by section' });
    const sweetsChip = within(group).getByRole('radio', { name: 'Sweets' });
    await user.click(sweetsChip);
    expect(sweetsChip).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'All' })).not.toBeChecked();
    expect(cards()).toEqual(['Cheesecake']);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('keeps only ready items when asked', async () => {
    const { user, cards } = setup();
    await user.click(screen.getByRole('checkbox', { name: 'Ready only' }));
    expect(cards()).toEqual(['Lotus cake', 'KitKat cake']);
  });

  it('searches as you type, in either language', async () => {
    const { user, cards } = setup('ar');
    const search = screen.getByRole('searchbox', { name: 'ابحث في الأصناف' });
    await user.type(search, 'kitkat');
    expect(cards()).toEqual(['كيكة كيت كات']);
    await user.clear(search);
    await user.type(search, 'كيكه لوتس');
    expect(cards()).toEqual(['كيكة لوتس']);
  });

  it('counts in Arabic with the right plural form and Western digits', async () => {
    const { user } = setup('ar');
    expect(screen.getByText('3 أصناف')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'حلويات' }));
    expect(screen.getByText('صنف واحد')).toBeInTheDocument();
  });

  it('offers a way out when nothing matches, and resets every filter', async () => {
    const { user, cards } = setup();
    await user.click(screen.getByRole('checkbox', { name: 'Ready only' }));
    await user.type(screen.getByRole('searchbox'), 'cheese');
    expect(cards()).toEqual([]);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nothing matches that search' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Order a custom cake' })).toHaveAttribute(
      'href',
      '/current/custom-order',
    );
    await user.click(screen.getByRole('button', { name: 'Show everything' }));
    expect(cards()).toHaveLength(3);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Ready only' })).not.toBeChecked();
  });

  it('leaves inactive products out and keeps the active ones', () => {
    const { container } = renderWithLocale(
      <ProductCatalog
        products={[...products, product({ id: 'hidden', slug: 'hidden', isActive: false })]}
        categories={[flavourCakes, sweets]}
      />,
      'en',
    );
    expect(
      [...container.querySelectorAll('[data-product]')].map((el) =>
        el.getAttribute('data-product'),
      ),
    ).toEqual(['lotus-cake', 'kitkat-cake', 'cheesecake']);
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('loads only the first row of photos straight away, without preloading or high priority', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      product({ id: `p${i}`, slug: `p${i}`, name: { ar: `صنف ${i}`, en: `Item ${i}` } }),
    );
    const { container } = renderWithLocale(
      <ProductCatalog products={many} categories={[flavourCakes]} />,
      'en',
    );
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs.map((img) => img.getAttribute('loading'))).toEqual([
      'eager',
      'eager',
      'eager',
      'eager',
      'lazy',
      'lazy',
    ]);
    expect(imgs.some((img) => img.getAttribute('fetchpriority') === 'high')).toBe(false);
  });

  it('can start with a section chosen', () => {
    renderWithLocale(
      <ProductCatalog
        products={products}
        categories={[flavourCakes, sweets]}
        initialFilter={{ categoryId: 'sweets' }}
      />,
      'en',
    );
    expect(screen.getByRole('radio', { name: 'Sweets' })).toBeChecked();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  it.each(['ar', 'en'] as const)('uses only logical direction classes (%s)', (locale) => {
    const { container } = setup(locale);
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});
