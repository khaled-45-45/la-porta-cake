import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import { ChoiceChips, FilterPanel } from './index';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'sugar', label: 'Sugar paste' },
  { value: 'print', label: 'Printed photo' },
  { value: 'cream', label: 'Cream and writing' },
];

function Chips({ initial = 'all' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">Before</button>
      <ChoiceChips label="Decoration" options={OPTIONS} value={value} onChange={setValue} />
      <button type="button">After</button>
    </>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('ChoiceChips (single choice, radio group)', () => {
  it('is a named radio group with exactly one checked option', () => {
    renderWithLocale(<Chips />, 'en');
    expect(screen.getByRole('radiogroup', { name: 'Decoration' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'),
    ).toHaveLength(1);
    expect(radio('All')).toBeChecked();
  });

  it('is a single Tab stop, on the checked option', async () => {
    const user = userEvent.setup();
    renderWithLocale(<Chips initial="print" />, 'en');
    screen.getByRole('button', { name: 'Before' }).focus();
    await user.tab();
    expect(radio('Printed photo')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('moves and selects with the arrow keys, wrapping at the ends (left to right)', async () => {
    const user = userEvent.setup();
    renderWithLocale(<Chips />, 'en');
    radio('All').focus();
    await user.keyboard('{ArrowRight}');
    expect(radio('Sugar paste')).toHaveFocus();
    expect(radio('Sugar paste')).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(radio('Printed photo')).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(radio('All')).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(radio('Cream and writing')).toBeChecked();
  });

  it('mirrors the arrow keys on right-to-left pages', async () => {
    const user = userEvent.setup();
    renderWithLocale(<Chips />, 'ar');
    radio('All').focus();
    await user.keyboard('{ArrowLeft}');
    expect(radio('Sugar paste')).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(radio('All')).toBeChecked();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    renderWithLocale(<Chips initial="sugar" />, 'en');
    radio('Sugar paste').focus();
    await user.keyboard('{End}');
    expect(radio('Cream and writing')).toBeChecked();
    await user.keyboard('{Home}');
    expect(radio('All')).toBeChecked();
  });

  it('selects with a click or Space', async () => {
    const user = userEvent.setup();
    renderWithLocale(<Chips />, 'en');
    await user.click(radio('Printed photo'));
    expect(radio('Printed photo')).toBeChecked();
    radio('Cream and writing').focus();
    await user.keyboard(' ');
    expect(radio('Cream and writing')).toBeChecked();
  });

  it.each(['ar', 'en'] as const)('uses only logical direction classes (%s)', (locale) => {
    const { container } = renderWithLocale(<Chips />, locale);
    expect(allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c))).toEqual([]);
  });
});

describe('FilterPanel', () => {
  const root = document.documentElement;
  afterEach(() => {
    vi.restoreAllMocks();
    root.style.scrollPaddingTop = '';
  });

  it('is sticky from 640px only, never on phones', () => {
    const { container } = renderWithLocale(<FilterPanel sticky>x</FilterPanel>, 'en');
    const panel = container.querySelector('[data-sticky-filters]')!;
    expect(panel).toHaveClass('sm:sticky', 'sm:top-0', 'sm:z-10');
    expect(panel).not.toHaveClass('sticky');
  });

  it('is never sticky without the option', () => {
    const { container } = renderWithLocale(<FilterPanel>x</FilterPanel>, 'en');
    expect(container.querySelector('[data-sticky-filters]')).toBeNull();
    expect(allClassNames(container).some((c) => /\bsticky\b/.test(c))).toBe(false);
  });

  it('reserves its height as scroll padding while sticky, so focus lands below it', () => {
    const realStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      (element as HTMLElement).dataset?.stickyFilters
        ? ({ position: 'sticky' } as CSSStyleDeclaration)
        : realStyle(element),
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 248,
    } as DOMRect);
    const { unmount } = renderWithLocale(<FilterPanel sticky>x</FilterPanel>, 'en');
    expect(root.style.scrollPaddingTop).toBe('264px');
    unmount();
    expect(root.style.scrollPaddingTop).toBe('');
  });

  it('follows the whole bar (border box) as it changes size, and stops when removed', () => {
    const observed: { box?: string }[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(_element: Element, options?: { box?: string }) {
          observed.push(options ?? {});
        }
        disconnect = disconnect;
      },
    );
    const { unmount } = renderWithLocale(<FilterPanel sticky>x</FilterPanel>, 'en');
    expect(observed.at(-1)).toEqual({ box: 'border-box' });
    unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('reserves nothing when the bar is not sticky (below 640px)', () => {
    const realStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      (element as HTMLElement).dataset?.stickyFilters
        ? ({ position: 'static' } as CSSStyleDeclaration)
        : realStyle(element),
    );
    renderWithLocale(<FilterPanel sticky>x</FilterPanel>, 'en');
    expect(root.style.scrollPaddingTop).toBe('');
  });
});
