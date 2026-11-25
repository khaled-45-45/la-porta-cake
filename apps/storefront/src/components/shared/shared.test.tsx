import { screen, within } from '@testing-library/react';

import { Section, SectionHeading } from '@/components/ui';
import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { Breadcrumbs, CardGrid, CardGridSkeleton, CtaBand, EmptyState } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

describe('Breadcrumbs', () => {
  const items = [
    { label: 'الرئيسية', href: '/' },
    { label: 'المتجر', href: '/shop' },
    { label: 'حلويات' },
  ];

  it('is a named navigation with an ordered list ending on the current page', () => {
    renderWithLocale(<Breadcrumbs items={items} />, 'ar');
    const nav = screen.getByRole('navigation', { name: 'مسار الصفحة' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/current', '/current/shop']);
    const current = within(nav).getByText('حلويات');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
  });

  it('hides the separators from screen readers', () => {
    const { container } = renderWithLocale(<Breadcrumbs items={items} />, 'en');
    const separators = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(separators.map((s) => s.textContent)).toEqual(['/', '/']);
  });
});

describe('EmptyState', () => {
  it('says what happened and offers actions', () => {
    renderWithLocale(
      <EmptyState title="Nothing here" body="Try again" actions={<button>Reset</button>} />,
      'en',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});

describe('CardGridSkeleton', () => {
  it('announces loading once and hides the placeholder shapes', () => {
    renderWithLocale(<CardGridSkeleton count={3} />, 'ar');
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('جاري التحميل…');
    expect(within(status).queryByRole('listitem')).toBeNull(); // hidden from the tree
    expect(status.querySelectorAll('li')).toHaveLength(3);
    expect(status.querySelector('.animate-pulse')).toHaveClass('motion-reduce:animate-none');
  });
});

describe('CardGrid', () => {
  it('uses two columns on phones and four from the nav breakpoint', () => {
    renderWithLocale(
      <CardGrid>
        <li>a</li>
      </CardGrid>,
      'en',
    );
    expect(screen.getByRole('list')).toHaveClass('grid-cols-2', 'nav:grid-cols-4');
  });

  it('has a three-column tablet step for designs', () => {
    renderWithLocale(
      <CardGrid variant="designs">
        <li>a</li>
      </CardGrid>,
      'en',
    );
    expect(screen.getByRole('list')).toHaveClass(
      'grid-cols-2',
      'sm:grid-cols-3',
      'nav:grid-cols-4',
    );
  });
});

describe('focus rings on dark areas', () => {
  it('keeps the default ring on the CTA band, because it is drawn on the page around it', () => {
    renderWithLocale(<CtaBand title="t" body="b" actionLabel="a" href="/x" />, 'en');
    // The ring sits 3px outside the band, on the page background (rose-ink on cream 6:1).
    expect(screen.getByRole('link')).not.toHaveClass('focus-ring-on-dark');
  });

  it('switches to the light ring inside ink sections', () => {
    const { container } = renderWithLocale(
      <Section tone="ink">
        <a href="#x">x</a>
      </Section>,
      'en',
    );
    expect(container.querySelector('section')).toHaveClass('focus-ring-on-dark');
  });
});

describe('CtaBand', () => {
  it('is one link carrying the title, text and action', () => {
    renderWithLocale(
      <CtaBand
        title="Want a custom design?"
        body="Made to order."
        actionLabel="Our work"
        href="/our-work"
      />,
      'en',
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/current/our-work');
    expect(link).toHaveTextContent('Want a custom design?Made to order.Our work');
  });
});

describe('SectionHeading with an action', () => {
  it('places the action after the title, keeping the plain form unchanged', () => {
    const { container, rerender } = renderWithLocale(<SectionHeading title="T" lede="L" />, 'en');
    expect(container.firstElementChild?.firstElementChild).toHaveClass('flex', 'flex-col', 'gap-3');
    rerender(<SectionHeading title="T" action={<button type="button">See all</button>} />);
    expect(screen.getByRole('heading', { name: 'T' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See all' })).toBeInTheDocument();
  });
});

describe('shared components and direction', () => {
  it.each(['ar', 'en'] as const)('use only logical direction classes (%s)', (locale) => {
    const { container } = renderWithLocale(
      <>
        <Breadcrumbs items={[{ label: 'a', href: '/' }, { label: 'b' }]} />
        <EmptyState title="t" body="b" />
        <CardGridSkeleton count={2} />
        <CtaBand title="t" body="b" actionLabel="a" href="/x" />
      </>,
      locale,
    );
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});
