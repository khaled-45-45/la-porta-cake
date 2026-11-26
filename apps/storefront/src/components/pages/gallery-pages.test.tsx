import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// A test runs in Node, not in the browser bundle the rule protects.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CUSTOM_ORDER_LIMITS } from '@la-porta/domain';

import { loadCustomOrderPage } from '@/lib/custom-order';
import type { CustomOrderState } from '@/lib/custom-order-state';
import { getRepositories } from '@/lib/data';
import { loadDesignPage, loadGallery } from '@/lib/storefront';
import { expectNothingPrivate, unpublishedDesigns } from '@/test/exposure';
import { setPathname } from '@/test/mock-navigation';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { CustomOrderView, DesignView, GalleryView } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const repositories = getRepositories();
const now = new Date('2026-11-26T08:00:00Z');
const [gallery, heart, withDesign, withoutDesign, tampered] = await Promise.all([
  loadGallery(repositories),
  loadDesignPage(repositories, 'heart-with-sugar-roses'),
  loadCustomOrderPage(repositories, 'heart-with-sugar-roses', now),
  loadCustomOrderPage(repositories, undefined, now),
  loadCustomOrderPage(repositories, unpublishedDesigns[0]?.slug, now),
]);
if (!heart) throw new Error('Real content is missing the heart design.');

const idle = vi.fn(async (): Promise<CustomOrderState> => ({ status: 'idle' }));
const orderView = (data: typeof withDesign) => (
  <CustomOrderView data={data} action={idle} limits={CUSTOM_ORDER_LIMITS} />
);

beforeEach(() => setPathname('/'));

describe('GalleryView', () => {
  it('shows every published design with filters, breadcrumbs and one h1 (Arabic)', () => {
    const { container } = renderWithLocale(<GalleryView data={gallery} />, 'ar');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('معرض أعمالنا');
    expect(
      within(screen.getByRole('navigation', { name: 'مسار الصفحة' })).getAllByRole('listitem'),
    ).toHaveLength(2);
    expect(container.querySelectorAll('article[data-design]')).toHaveLength(16);
    expect(screen.getByRole('radiogroup', { name: 'نوع الزينة' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'المناسبة' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'ميني كيك بس' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /اطلب كيكة حسب الطلب/ })).toHaveAttribute(
      'href',
      '/current/custom-order',
    );
    expectNothingPrivate(container);
  });

  it('explains the three kinds of decoration, in English', () => {
    renderWithLocale(<GalleryView data={gallery} />, 'en');
    const kinds = screen.getByRole('region', { name: 'Kinds of decoration' });
    expect(
      within(kinds)
        .getAllByRole('term')
        .map((t) => t.textContent),
    ).toEqual(['Sugar paste', 'Printed photo', 'Cream and writing']);
  });

  it('filters mini cakes and shows an empty state with a way out', async () => {
    const user = userEvent.setup();
    const { container } = renderWithLocale(<GalleryView data={gallery} />, 'en');
    await user.click(screen.getByRole('checkbox', { name: 'Mini cakes only' }));
    expect(container.querySelectorAll('article[data-design]')).toHaveLength(2);
    await user.click(screen.getByRole('radio', { name: 'Printed photo' }));
    expect(container.querySelectorAll('article[data-design]')).toHaveLength(0);
    expect(screen.getByText('No designs match these filters yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Order your design' })).toHaveAttribute(
      'href',
      '/current/custom-order',
    );
  });
});

describe('DesignView', () => {
  it('shows the photo, title, decoration, occasions and the order button', () => {
    const { container } = renderWithLocale(<DesignView data={heart} />, 'ar');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heart.design.title.ar);
    const photo = screen.getAllByRole('img')[0];
    expect(photo).toHaveAccessibleName(heart.design.image.alt.ar);
    expect(container).toHaveTextContent('قوالب سكر');
    expect(screen.getByRole('link', { name: 'بدي زيه' })).toHaveAttribute(
      'href',
      '/current/custom-order?design=heart-with-sugar-roses',
    );
    const crumbs = within(screen.getByRole('navigation', { name: 'مسار الصفحة' }));
    expect(crumbs.getByRole('link', { name: 'معرض أعمالنا' })).toHaveAttribute(
      'href',
      '/current/our-work',
    );
    expectNothingPrivate(container);
  });

  it('states no price, size or flavour, which designs do not record', () => {
    const { container } = renderWithLocale(<DesignView data={heart} />, 'en');
    expect(container).not.toHaveTextContent(/JOD|serves|Price on request/);
  });

  it('lists related published designs', () => {
    renderWithLocale(<DesignView data={heart} />, 'en');
    const related = screen.getByRole('region', { name: 'Similar designs' });
    const cards = within(related).getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(4);
    expect(cards.map((c) => c.dataset.design)).not.toContain('heart-with-sugar-roses');
  });
});

describe('CustomOrderView', () => {
  it('shows the chosen design, checked on the server, beside the form', () => {
    const { container } = renderWithLocale(orderView(withDesign), 'ar');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('صمّم كيكتك');
    const chosen = screen.getByRole('complementary', { name: 'التصميم اللي اخترته' });
    expect(within(chosen).getByRole('link', { name: heart.design.title.ar })).toHaveAttribute(
      'href',
      '/current/our-work/heart-with-sugar-roses',
    );
    expect(container.querySelector('input[type=hidden][name=design]')).toHaveValue(
      'heart-with-sugar-roses',
    );
    // The design's decoration is preselected; the description becomes optional.
    expect(screen.getByRole('radio', { name: 'قوالب سكر' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: /شو الكيكة اللي ببالك؟/ })).not.toBeRequired();
    expectNothingPrivate(container);
  });

  it('opens without a design when the reference is unpublished or missing', () => {
    for (const data of [withoutDesign, tampered]) {
      const { container, unmount } = renderWithLocale(orderView(data), 'en');
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      expect(container.querySelector('input[name=design]')).toBeNull();
      expect(
        screen.getByRole('textbox', { name: 'What cake do you have in mind?' }),
      ).toBeRequired();
      expectNothingPrivate(container);
      unmount();
    }
  });

  it('says that the site prepares a message and takes no payment', () => {
    renderWithLocale(orderView(withoutDesign), 'en');
    expect(screen.getAllByText(/no payment on the site/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Prepare WhatsApp message' })).toBeInTheDocument();
  });
});

describe('Phase 6 views and direction', () => {
  it.each(['ar', 'en'] as const)('use only logical direction classes (%s)', (locale) => {
    for (const view of [
      <GalleryView key="g" data={gallery} />,
      <DesignView key="d" data={heart} />,
      <CustomOrderView key="o" data={withDesign} action={idle} limits={CUSTOM_ORDER_LIMITS} />,
    ]) {
      const { container, unmount } = renderWithLocale(view, locale);
      expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
      unmount();
    }
  });
});
