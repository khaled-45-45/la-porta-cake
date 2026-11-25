import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import type { Availability } from '@la-porta/domain';

import { allClassNames, PHYSICAL_DIRECTION_CLASS, renderWithLocale } from '@/test/render';

import {
  ArchFrame,
  AvailabilityBadge,
  Button,
  Chip,
  Container,
  Field,
  ImagePlaceholder,
  Input,
  LanguageSwitcher,
  PriceTag,
  Section,
  SectionHeading,
  SkipLink,
  Textarea,
  VisuallyHidden,
} from './index';

// The real locale-aware Link needs the Next.js router; this stand-in builds the same URLs.
let currentPath = '/';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => currentPath,
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: { href: string; locale?: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={`/${locale ?? 'current'}${href === '/' ? '' : href}`} {...rest}>
      {children}
    </a>
  ),
}));

describe('Button', () => {
  it('renders a button of type "button" by default', () => {
    renderWithLocale(<Button>تصفّح الكيك</Button>);
    expect(screen.getByRole('button', { name: 'تصفّح الكيك' })).toHaveAttribute('type', 'button');
  });

  it('has the four prototype styles and the small size', () => {
    const { container } = renderWithLocale(
      <>
        <Button variant="dark">a</Button>
        <Button variant="line">b</Button>
        <Button variant="rose">c</Button>
        <Button variant="light" size="sm" block>
          d
        </Button>
      </>,
    );
    const [dark, line, rose, light] = [...container.querySelectorAll('button')];
    expect(dark).toHaveClass('bg-ink', 'text-paper');
    expect(line).toHaveClass('bg-transparent', 'text-ink');
    expect(rose).toHaveClass('bg-rose', 'text-ink');
    expect(light).toHaveClass('bg-paper', 'min-h-11', 'w-full');
  });

  it('renders an internal link that keeps the language, and plain links for full URLs', () => {
    renderWithLocale(
      <>
        <Button href="/shop">Shop</Button>
        <Button href="https://wa.me/962788890049">WhatsApp</Button>
      </>,
      'en',
    );
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/current/shop');
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/962788890049',
    );
  });

  it('works with the keyboard', async () => {
    const onClick = vi.fn();
    renderWithLocale(<Button onClick={onClick}>Go</Button>, 'en');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Go' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('cannot be used while disabled', async () => {
    const onClick = vi.fn();
    renderWithLocale(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
      'en',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('announces whether it is selected', () => {
    renderWithLocale(
      <>
        <Chip selected>عيد ميلاد</Chip>
        <Chip>تخرّج</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'عيد ميلاد' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'تخرّج' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'عيد ميلاد' })).toHaveClass('bg-ink');
  });

  it('toggles from the keyboard', async () => {
    const onClick = vi.fn();
    renderWithLocale(<Chip onClick={onClick}>Birthday</Chip>, 'en');
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('AvailabilityBadge', () => {
  const cases: [Availability, string, string][] = [
    ['ready', 'جاهز', 'Ready'],
    ['preorder', 'طلب مسبق', 'Preorder'],
    ['unavailable', 'غير متوفر', 'Unavailable'],
    ['seasonal', 'موسمي', 'Seasonal'],
  ];

  it.each(cases)('shows "%s" with its word in both languages', (availability, ar, en) => {
    const { unmount } = renderWithLocale(<AvailabilityBadge availability={availability} />, 'ar');
    expect(screen.getByText(ar)).toBeInTheDocument();
    unmount();
    renderWithLocale(<AvailabilityBadge availability={availability} />, 'en');
    expect(screen.getByText(en)).toBeInTheDocument();
  });

  it('uses a different shape for each state, hidden from screen readers', () => {
    const { container } = renderWithLocale(
      <>
        {cases.map(([a]) => (
          <AvailabilityBadge key={a} availability={a} />
        ))}
      </>,
    );
    const markers = [...container.querySelectorAll('[data-availability] > [aria-hidden="true"]')];
    expect(markers).toHaveLength(4);
    expect(new Set(markers.map((m) => m.className)).size).toBe(4);
  });
});

describe('PriceTag (decision 0005)', () => {
  it('shows the agreed text when there is no confirmed price', () => {
    const { unmount } = renderWithLocale(<PriceTag priceJod={null} />, 'ar');
    expect(screen.getByText('السعر عند الطلب')).toBeInTheDocument();
    unmount();
    renderWithLocale(<PriceTag priceJod={null} />, 'en');
    expect(screen.getByText('Price on request')).toBeInTheDocument();
  });

  it('shows a confirmed price with Western digits in Arabic', () => {
    const { container } = renderWithLocale(<PriceTag priceJod={12.5} />, 'ar');
    expect(container.textContent).toContain('12.5');
    expect(container.textContent).not.toMatch(/[٠-٩]/);
  });
});

describe('ArchFrame', () => {
  it('rounds the top into an arch and can draw the doorway outline', () => {
    const { container } = renderWithLocale(
      <ArchFrame outlined>
        <span>photo</span>
      </ArchFrame>,
    );
    expect(container.querySelector('.rounded-t-full')).toContainHTML('<span>photo</span>');
    expect(container.querySelector('[data-outlined]')).toHaveClass('before:border-rose');
  });
});

describe('ImagePlaceholder (decision 0006)', () => {
  it('describes the missing photo for screen readers in both languages', () => {
    const { unmount } = renderWithLocale(<ImagePlaceholder name="تشيز كيك" />, 'ar');
    expect(screen.getByRole('img', { name: 'تشيز كيك: لا توجد صورة بعد' })).toBeInTheDocument();
    unmount();
    renderWithLocale(<ImagePlaceholder name="Cheesecake" />, 'en');
    expect(screen.getByRole('img', { name: 'Cheesecake: No photo yet' })).toBeInTheDocument();
  });

  it('contains no image file', () => {
    const { container } = renderWithLocale(<ImagePlaceholder name="Muffins" />, 'en');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('Field', () => {
  it('ties the label, hint and error to the control', async () => {
    renderWithLocale(
      <Field id="name" label="الاسم" hint="الاسم اللي بنكتبه على الطلب." error="اكتب اسمك.">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'الاسم' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('الاسم اللي بنكتبه على الطلب. اكتب اسمك.');
    await userEvent.click(screen.getByText('الاسم'));
    expect(input).toHaveFocus();
  });

  it('is not marked invalid without an error', () => {
    renderWithLocale(
      <Field id="notes" label="Notes">
        {(control) => <Textarea {...control} />}
      </Field>,
      'en',
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).not.toHaveAttribute('aria-invalid');
    expect(textarea).not.toHaveAttribute('aria-describedby');
  });
});

describe('layout primitives', () => {
  it('render a section with heading levels and tones', () => {
    renderWithLocale(
      <Section tone="sand" aria-labelledby="h">
        <Container>
          <SectionHeading id="h" level={2} title="مختارات" lede="أصناف نحبها" />
        </Container>
      </Section>,
    );
    expect(screen.getByRole('region', { name: 'مختارات' })).toHaveClass('bg-sand');
    expect(screen.getByRole('heading', { level: 2, name: 'مختارات' })).toHaveClass(
      'text-display-l',
    );
  });
});

describe('accessibility helpers', () => {
  it('SkipLink jumps to the main content and is the first stop for the keyboard', async () => {
    renderWithLocale(
      <>
        <SkipLink />
        <button type="button">Menu</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'تخطَّ إلى المحتوى' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'تخطَّ إلى المحتوى' })).toHaveAttribute('href', '#main');
  });

  it('VisuallyHidden keeps text available to screen readers', () => {
    renderWithLocale(<VisuallyHidden>hidden note</VisuallyHidden>, 'en');
    expect(screen.getByText('hidden note')).toHaveClass('sr-only');
  });
});

describe('LanguageSwitcher', () => {
  it('links from an Arabic page to the same page in English', () => {
    currentPath = '/shop';
    renderWithLocale(<LanguageSwitcher />, 'ar');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/en/shop');
    expect(link).toHaveAttribute('hreflang', 'en');
    expect(link).toHaveTextContent('EN');
    expect(link).toHaveAccessibleName('EN – اعرض هذه الصفحة بالإنجليزية');
  });

  it('links from an English page to the same page in Arabic', () => {
    currentPath = '/';
    renderWithLocale(<LanguageSwitcher />, 'en');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ar');
    expect(link.querySelector('[lang="ar"]')).toHaveTextContent('ع');
  });
});

describe('right-to-left and left-to-right', () => {
  const everything = (
    <>
      <SkipLink />
      <Button>a</Button>
      <Button href="/shop" variant="line" size="sm">
        b
      </Button>
      <Chip selected>c</Chip>
      <AvailabilityBadge availability="seasonal" />
      <PriceTag priceJod={null} />
      <ArchFrame outlined>
        <span />
      </ArchFrame>
      <ImagePlaceholder name="x" />
      <Field id="f" label="f" hint="h" error="e">
        {(c) => <Input {...c} />}
      </Field>
      <Section tone="ink">
        <Container>
          <SectionHeading title="t" lede="l" />
        </Container>
      </Section>
      <LanguageSwitcher />
    </>
  );

  it.each(['ar', 'en'] as const)(
    'use no left- or right-specific classes (%s), so both directions mirror correctly',
    (locale) => {
      const { container } = renderWithLocale(everything, locale);
      const offenders = allClassNames(container).filter((c) => PHYSICAL_DIRECTION_CLASS.test(c));
      expect(offenders).toEqual([]);
    },
  );

  it('renders inside the page direction', () => {
    const { container: rtl } = renderWithLocale(<Button>a</Button>, 'ar');
    expect(rtl.querySelector('[dir="rtl"] button')).not.toBeNull();
    const { container: ltr } = renderWithLocale(<Button>a</Button>, 'en');
    expect(ltr.querySelector('[dir="ltr"] button')).not.toBeNull();
  });
});
