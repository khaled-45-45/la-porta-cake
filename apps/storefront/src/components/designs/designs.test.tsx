import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { birthday, design, graduation, image } from '@/test/fixtures';
import { setPathname } from '@/test/mock-navigation';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { DesignCard, OccasionTags, WorkGallery } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

beforeEach(() => setPathname('/'));

const occasions = [birthday, graduation];

describe('DesignCard', () => {
  it('shows the photo, decoration type, title, occasions and the order button', () => {
    renderWithLocale(<DesignCard design={design()} occasions={occasions} />, 'ar');
    const card = screen.getByRole('article');
    expect(within(card).getByRole('img', { name: 'صورة' })).toBeInTheDocument();
    expect(card).toHaveTextContent('قوالب سكر');
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent('كيكة الورد');
    expect(within(card).getByRole('listitem')).toHaveTextContent('عيد ميلاد');
    const order = within(card).getByRole('link', { name: 'بدي زيه: كيكة الورد' });
    expect(order).toHaveTextContent('بدي زيه');
    expect(order).toHaveAttribute('href', '/current/our-work/rose-cake');
  });

  it('adds the "Mini" tag to mini cakes', () => {
    renderWithLocale(<DesignCard design={design({ isMini: true })} occasions={occasions} />, 'en');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Birthday',
      'Mini',
    ]);
  });

  it('draws nothing for an unpublished design', () => {
    const { container } = renderWithLocale(
      <DesignCard design={design({ isPublished: false })} occasions={occasions} />,
      'en',
    );
    expect(container.querySelector('article')).toBeNull();
  });

  it('draws nothing for a design whose photo is still pending', () => {
    const pending = design({
      image: image('private-assets/review/designs/rose-cake.jpg', 'pending'),
    });
    const { container } = renderWithLocale(
      <DesignCard design={pending} occasions={occasions} />,
      'en',
    );
    expect(container.innerHTML).toBe('<div dir="ltr" lang="en"></div>');
  });
});

describe('OccasionTags', () => {
  it('renders nothing without tags', () => {
    const { container } = renderWithLocale(<OccasionTags occasions={[]} />, 'en');
    expect(container.querySelector('ul')).toBeNull();
  });
});

describe('WorkGallery (filters)', () => {
  const designs = [
    design(),
    design({
      id: 'grad-photo',
      slug: 'grad-photo',
      title: { ar: 'تخرّج بالصورة', en: 'Graduation photo cake' },
      decoration: 'print',
      occasionIds: ['graduation'],
    }),
    design({
      id: 'mini-rose',
      slug: 'mini-rose',
      title: { ar: 'ميني ورد', en: 'Mini rose cake' },
      isMini: true,
    }),
    design({
      id: 'hidden',
      slug: 'hidden',
      title: { ar: 'مخفي', en: 'Hidden design' },
      isPublished: false,
    }),
    design({
      id: 'pending',
      slug: 'pending',
      title: { ar: 'قيد المراجعة', en: 'Pending design' },
      image: image('private-assets/review/designs/pending.jpg', 'pending'),
    }),
  ];

  function setup(locale: 'ar' | 'en' = 'en') {
    const user = userEvent.setup();
    const view = renderWithLocale(<WorkGallery designs={designs} occasions={occasions} />, locale);
    const titles = () =>
      [...view.container.querySelectorAll('[data-design] h2')].map((h) => h.textContent);
    return { user, titles, ...view };
  }

  it('shows published designs only, never unpublished or pending ones', () => {
    const { titles, container } = setup();
    expect(titles()).toEqual(['Rose cake', 'Graduation photo cake', 'Mini rose cake']);
    expect(container.innerHTML).not.toContain('private-assets');
    expect(container).not.toHaveTextContent('Hidden design');
    expect(container).not.toHaveTextContent('Pending design');
    expect(screen.getByText('3 designs')).toHaveAttribute('aria-live', 'polite');
  });

  it('filters by decoration type', async () => {
    const { user, titles } = setup();
    const group = screen.getByRole('radiogroup', { name: 'Decoration' });
    await user.click(within(group).getByRole('radio', { name: 'Printed photo' }));
    expect(titles()).toEqual(['Graduation photo cake']);
    expect(within(group).getByRole('radio', { name: 'Printed photo' })).toBeChecked();
  });

  it('filters by occasion and mini cakes', async () => {
    const { user, titles } = setup();
    const group = screen.getByRole('radiogroup', { name: 'Occasion' });
    await user.click(within(group).getByRole('radio', { name: 'Birthday' }));
    expect(titles()).toEqual(['Rose cake', 'Mini rose cake']);
    await user.click(screen.getByRole('checkbox', { name: 'Mini cakes only' }));
    expect(titles()).toEqual(['Mini rose cake']);
  });

  it('shows the empty state and resets the filters', async () => {
    const { user, titles } = setup('ar');
    await user.click(screen.getByRole('radio', { name: 'كريمة وكتابة' }));
    expect(titles()).toEqual([]);
    expect(screen.getByText('ما في تصاميم')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'اطلب تصميمك' })).toHaveAttribute(
      'href',
      '/current/custom-order',
    );
    await user.click(screen.getByRole('button', { name: 'اعرض كل التصاميم' }));
    expect(titles()).toHaveLength(3);
  });

  it('labels its filter rows visibly and keeps the bar at the top from 640px only', () => {
    setup('ar');
    expect(screen.getByRole('radiogroup', { name: 'نوع الزينة' })).toHaveTextContent('نوع الزينة');
    const bar = screen
      .getByRole('radiogroup', { name: 'المناسبة' })
      .closest('[data-sticky-filters]');
    expect(bar).toHaveClass('sm:sticky', 'sm:top-0');
    // Phones: the bar is too tall to stay on screen (M3), so it is not sticky there.
    expect(bar).not.toHaveClass('sticky');
  });

  it('loads only the first row of photos straight away, without high priority', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      design({ id: `d${i}`, slug: `d${i}`, title: { ar: `تصميم ${i}`, en: `Design ${i}` } }),
    );
    const { container } = renderWithLocale(
      <WorkGallery designs={many} occasions={occasions} />,
      'en',
    );
    const loading = [...container.querySelectorAll('img')].map((img) =>
      img.getAttribute('loading'),
    );
    expect(loading).toEqual(['eager', 'eager', 'eager', 'eager', 'lazy', 'lazy']);
    expect(container.querySelector('img[fetchpriority="high"]')).toBeNull();
  });

  it('offers only occasions that have designs', () => {
    renderWithLocale(<WorkGallery designs={[design()]} occasions={occasions} />, 'en');
    const group = screen.getByRole('radiogroup', { name: 'Occasion' });
    expect(within(group).queryByRole('radio', { name: 'Graduation' })).toBeNull();
  });

  it.each(['ar', 'en'] as const)('uses only logical direction classes (%s)', (locale) => {
    const { container } = setup(locale);
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});
