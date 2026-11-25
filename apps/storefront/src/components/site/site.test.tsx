import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { flavourCakes, settings, sweets } from '@/test/fixtures';
import { setPathname } from '@/test/mock-navigation';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { SiteFooter, SiteHeader } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const WA = 'https://wa.me/962788890049';

beforeEach(() => setPathname('/'));

function desktopNav() {
  // Two navigation landmarks share the menu's name only on small screens; the desktop
  // one is named "القائمة الرئيسية" / "Main".
  return screen.getByRole('navigation', { name: 'القائمة الرئيسية' });
}

describe('SiteHeader', () => {
  it('links the logo home and lists the main sections in order', () => {
    renderWithLocale(<SiteHeader whatsappUrl={WA} />);
    expect(screen.getByRole('link', { name: /La Porta/ })).toHaveAttribute('href', '/current');
    const links = within(desktopNav()).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'المتجر',
      'كيك حسب الطلب',
      'معرض أعمالنا',
      'من نحن',
      'الطلب والأسئلة',
      'تواصل معنا',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/current/shop',
      '/current/custom-order',
      '/current/our-work',
      '/current/about',
      '/current/faq',
      '/current/contact',
    ]);
  });

  it('marks the current section, including pages inside it', () => {
    setPathname('/products/lotus-cake');
    renderWithLocale(<SiteHeader whatsappUrl={WA} />);
    const current = within(desktopNav()).getByRole('link', { current: 'page' });
    expect(current).toHaveTextContent('المتجر');
    expect(within(desktopNav()).getAllByRole('link', { current: 'page' })).toHaveLength(1);
  });

  it('marks nothing on the home page', () => {
    renderWithLocale(<SiteHeader whatsappUrl={WA} />);
    expect(within(desktopNav()).queryByRole('link', { current: 'page' })).toBeNull();
  });

  it('offers the language switch on the same page', () => {
    setPathname('/faq');
    renderWithLocale(<SiteHeader whatsappUrl={WA} />, 'en');
    const switcher = screen.getByRole('link', { name: /^ع – / });
    expect(switcher).toHaveAttribute('href', '/ar/faq');
    expect(switcher).toHaveAttribute('hreflang', 'ar');
  });

  it('has the WhatsApp order button with the store link', () => {
    renderWithLocale(<SiteHeader whatsappUrl={WA} />, 'en');
    const buttons = screen.getAllByRole('link', { name: 'Order on WhatsApp' });
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toHaveAttribute('href', WA);
  });

  it('shows the desktop links and button only from the nav breakpoint (1100px)', () => {
    renderWithLocale(<SiteHeader whatsappUrl={WA} />, 'en');
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveClass('max-nav:hidden');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveClass('nav:hidden');
  });

  it.each(['ar', 'en'] as const)('uses only logical direction classes (%s)', (locale) => {
    const { container } = renderWithLocale(<SiteHeader whatsappUrl={WA} />, locale);
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});

describe('MobileMenu', () => {
  function setup(locale: 'ar' | 'en' = 'en') {
    const user = userEvent.setup();
    const view = renderWithLocale(<SiteHeader whatsappUrl={WA} />, locale);
    const button = screen.getByRole('button', { name: locale === 'en' ? 'Menu' : 'القائمة' });
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '')!;
    return { user, button, panel, ...view };
  }

  it('starts closed, with the button pointing at its panel', () => {
    const { button, panel } = setup();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeNull();
    expect(panel).not.toBeVisible();
  });

  it('opens and closes with the keyboard', async () => {
    const { user, button, panel } = setup();
    await user.tab(); // skip link is not rendered here; the logo comes first
    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('lists home, every section and WhatsApp, in reading order after the button', async () => {
    const { user, button, panel } = setup();
    await user.click(button);
    const links = within(panel).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'Home',
      'Shop',
      'Custom cakes',
      'Our work',
      'About',
      'Ordering & FAQ',
      'Contact',
      'Order on WhatsApp',
    ]);
    expect(button.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Tab moves from the button straight into the panel.
    button.focus();
    await user.tab();
    expect(links[0]).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the button', async () => {
    const { user, button, panel } = setup();
    await user.click(button);
    within(panel).getAllByRole('link')[2]!.focus();
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();
    expect(button).toHaveFocus();
  });

  it('closes on Escape when focus is on the button', async () => {
    const { user, button, panel } = setup();
    await user.click(button);
    expect(button).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();
    expect(button).toHaveFocus();
  });

  it('ignores Escape in unrelated controls, such as the shop search', async () => {
    const user = userEvent.setup();
    renderWithLocale(
      <>
        <SiteHeader whatsappUrl={WA} />
        <input type="search" aria-label="Search the shop" />
      </>,
      'en',
    );
    const button = screen.getByRole('button', { name: 'Menu' });
    await user.click(button);
    const search = screen.getByRole('searchbox', { name: 'Search the shop' });
    await user.click(search);
    await user.keyboard('lotus{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(search).toHaveFocus();
    expect(button).not.toHaveFocus();
  });

  it('closes when a link is followed', async () => {
    const { user, button, panel } = setup();
    await user.click(button);
    await user.click(within(panel).getByRole('link', { name: 'Shop' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the page changes', async () => {
    const { user, button, rerender } = setup();
    await user.click(button);
    setPathname('/faq');
    rerender(<SiteHeader whatsappUrl={WA} />);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the current section inside the panel', async () => {
    setPathname('/our-work');
    const { user, button, panel } = setup('ar');
    await user.click(button);
    expect(within(panel).getByRole('link', { current: 'page' })).toHaveTextContent('معرض أعمالنا');
  });
});

describe('SiteFooter', () => {
  const categories = [flavourCakes, sweets];

  it('links WhatsApp, Instagram, Facebook and the map from the store settings', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'en');
    const footer = screen.getByRole('contentinfo');
    const hrefs = within(footer)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        settings.whatsapp.url,
        settings.instagram.url,
        settings.facebook.url,
        settings.mapsUrl,
      ]),
    );
    expect(within(footer).getByRole('link', { name: 'See it on the map' })).toHaveAttribute(
      'href',
      settings.mapsUrl,
    );
    expect(within(footer).getByRole('link', { name: 'WhatsApp: 0788890049' })).toHaveAttribute(
      'href',
      settings.whatsapp.url,
    );
    expect(within(footer).getByRole('link', { name: 'Instagram: @laportacake' })).toHaveAttribute(
      'href',
      settings.instagram.url,
    );
  });

  it('shows the address and opening hours with Western digits', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'ar');
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(settings.address.ar);
    expect(footer).toHaveTextContent('ساعات العمل: يوميًا من 11 ص إلى 11 م');
    expect(footer.textContent).not.toMatch(/[٠-٩]/);
  });

  it('writes the phone number left to right inside Arabic text', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'ar');
    const number = screen.getByText('0788890049');
    expect(number.tagName).toBe('BDI');
    expect(number).toHaveAttribute('dir', 'ltr');
  });

  it('leaves Messenger out until its link is known, and shows it once it is', () => {
    const { unmount } = renderWithLocale(
      <SiteFooter settings={settings} categories={categories} />,
      'en',
    );
    expect(screen.queryByRole('link', { name: 'Messenger' })).toBeNull();
    unmount();
    const withMessenger = { ...settings, messenger: { url: 'https://m.me/laportacake' } };
    renderWithLocale(<SiteFooter settings={withMessenger} categories={categories} />, 'en');
    expect(screen.getByRole('link', { name: 'Messenger' })).toHaveAttribute(
      'href',
      'https://m.me/laportacake',
    );
  });

  it('shows delivery only when the store offers it', () => {
    const noDelivery = { ...settings, delivery: { ...settings.delivery, available: false } };
    renderWithLocale(<SiteFooter settings={noDelivery} categories={categories} />, 'en');
    expect(screen.queryByText('Delivery available')).toBeNull();
  });

  it('links the site pages, with category names from the content', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'ar');
    const pages = screen.getByRole('heading', { name: 'صفحات' }).parentElement!;
    expect(within(pages).getByRole('link', { name: 'حلويات' })).toHaveAttribute(
      'href',
      '/current/shop/sweets',
    );
    expect(within(pages).getAllByRole('link')).toHaveLength(7);
  });

  it('switches focus rings to the light colour on its dark background (WCAG 1.4.11)', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'en');
    expect(screen.getByRole('contentinfo')).toHaveClass('focus-ring-on-dark');
  });

  it('states there is no online payment, in both languages alike', () => {
    renderWithLocale(<SiteFooter settings={settings} categories={categories} />, 'en');
    expect(screen.getByText(/There is no online payment/)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp or Instagram/)).toBeInTheDocument();
  });

  it.each(['ar', 'en'] as const)('uses only logical direction classes (%s)', (locale) => {
    const { container } = renderWithLocale(
      <SiteFooter settings={settings} categories={categories} />,
      locale,
    );
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});
