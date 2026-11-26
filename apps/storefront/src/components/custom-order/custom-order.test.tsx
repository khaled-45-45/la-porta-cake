import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CustomOrderValues } from '@la-porta/domain';

import type { CustomOrderState } from '@/lib/custom-order-state';
import { setPathname } from '@/test/mock-navigation';
import { renderWithLocale } from '@/test/render';

import type { CustomOrderFormProps } from './CustomOrderForm';
import { CustomOrderForm } from './CustomOrderForm';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

beforeEach(() => setPathname('/custom-order'));

const EMPTY: CustomOrderValues = {
  occasion: '',
  decoration: '',
  mini: '',
  description: '',
  flavour: '',
  writing: '',
  date: '',
  name: '',
  notes: '',
};

function setup(
  action: CustomOrderFormProps['action'],
  overrides: Partial<CustomOrderFormProps> = {},
  locale: 'ar' | 'en' = 'en',
) {
  const props: CustomOrderFormProps = {
    action,
    designSlug: null,
    defaults: { occasion: '', decoration: '', mini: '' },
    occasions: [
      { id: 'birthday', name: 'Birthday' },
      { id: 'graduation', name: 'Graduation' },
    ],
    decorations: [
      { value: 'sugar', label: 'Sugar paste' },
      { value: 'print', label: 'Printed photo' },
      { value: 'cream', label: 'Cream and writing' },
    ],
    limits: { name: 60, description: 500, flavour: 80, writing: 40, notes: 500 },
    earliestDate: '2026-11-27',
    latestDate: '2027-11-26',
    leadDays: 1,
    ...overrides,
  };
  return { user: userEvent.setup(), ...renderWithLocale(<CustomOrderForm {...props} />, locale) };
}

const ready = (message: string): CustomOrderState => ({
  status: 'ready',
  whatsappUrl: `https://wa.me/962788890049?text=${encodeURIComponent(message)}`,
  message,
  values: EMPTY,
  designUnavailable: false,
});

describe('CustomOrderForm', () => {
  it('labels every control and ties hints and counters to it', () => {
    setup(vi.fn());
    for (const name of [
      /Occasion/,
      /What cake do you have in mind\?/,
      'Filling or flavour (Optional)',
      'Writing on the cake (Optional)',
      'Requested pick-up date (Optional)',
      'Name (Optional)',
      'Notes (Optional)',
    ]) {
      expect(screen.getAllByLabelText(name).length).toBeGreaterThan(0);
    }
    const writing = screen.getByRole('textbox', { name: 'Writing on the cake (Optional)' });
    expect(writing).toHaveAccessibleDescription('Keep it short so it reads clearly. 0 of 40');
    const date = screen.getByLabelText('Requested pick-up date (Optional)');
    expect(date).toHaveAttribute('min', '2026-11-27');
    expect(date).toHaveAttribute('max', '2027-11-26');
    expect(screen.getByRole('group', { name: /Decoration/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Mini cake' })).not.toBeChecked();
  });

  it('counts characters, not UTF-16 units', async () => {
    const { user } = setup(vi.fn());
    await user.type(
      screen.getByRole('textbox', { name: 'Writing on the cake (Optional)' }),
      '🎂🎂 كل',
    );
    expect(screen.getByText('5 of 40')).toBeInTheDocument();
  });

  it('posts the form fields and shows errors with a focused summary, keeping the values', async () => {
    const action = vi.fn(
      async (_state: CustomOrderState, form: FormData): Promise<CustomOrderState> => ({
        status: 'invalid',
        errors: {
          description: 'Tell us about the cake you have in mind.',
          writing: 'Keep it to 40 characters.',
        },
        values: { ...EMPTY, writing: String(form.get('writing')) },
        designUnavailable: false,
      }),
    );
    const { user } = setup(action);
    const writing = screen.getByRole('textbox', { name: 'Writing on the cake (Optional)' });
    await user.type(writing, 'x'.repeat(41));
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));

    // Focus moves to the summary; it is a labelled region, not a live alert, so screen
    // readers announce it once.
    const summary = await screen.findByRole('region', {
      name: 'Please fix the following before we prepare the message:',
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(summary).toHaveFocus();
    expect(
      within(summary)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['#order-description', '#order-writing']);
    expect(writing).toHaveValue('x'.repeat(41));
    expect(writing).toHaveAttribute('aria-invalid', 'true');
    expect(writing).toHaveAccessibleDescription(/Keep it to 40 characters\./);
    const posted = action.mock.calls[0]?.[1];
    expect(posted?.get('writing')).toBe('x'.repeat(41));
    expect(posted?.get('design')).toBeNull();
  });

  it('carries the chosen design as its slug only', async () => {
    const action = vi.fn(async () => ready('Hello'));
    const { user, container } = setup(action, {
      designSlug: 'rose-cake',
      defaults: { occasion: 'birthday', decoration: 'sugar', mini: 'on' },
    });
    expect(container.querySelector('input[name=design]')).toHaveValue('rose-cake');
    expect(screen.getByRole('radio', { name: 'Sugar paste' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mini cake' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: /Occasion/ })).toHaveValue('birthday');
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));
    await waitFor(() => expect(action).toHaveBeenCalled());
    const posted = action.mock.calls[0] as unknown as [CustomOrderState, FormData];
    expect(posted[1].get('design')).toBe('rose-cake');
    expect(posted[1].get('decoration')).toBe('sugar');
    expect(posted[1].get('mini')).toBe('on');
  });

  it('shows the prepared message as text and a WhatsApp link, without claiming it was sent', async () => {
    const message = 'Hello La Porta\n<img src=x onerror=alert(1)>';
    const { user, container } = setup(vi.fn(async () => ready(message)));
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));

    const panel = await screen.findByRole('region', {
      name: 'Your message is ready, but not sent yet',
    });
    expect(panel).toHaveFocus();
    expect(within(panel).getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(
      within(panel).getByRole('link', { name: 'Open WhatsApp and send the message' }),
    ).toHaveAttribute('href', `https://wa.me/962788890049?text=${encodeURIComponent(message)}`);
    expect(panel).toHaveTextContent(/only confirmed when we reply/);
    expect(container).not.toHaveTextContent(/order (is|has been) (confirmed|placed|sent)/i);
  });

  it('hides a prepared message once the details change', async () => {
    const { user } = setup(vi.fn(async () => ready('Hello')));
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));
    await screen.findByRole('region', { name: /Your message is ready/ });
    await user.type(screen.getByRole('textbox', { name: 'Name (Optional)' }), 'S');
    expect(screen.queryByRole('region', { name: /Your message is ready/ })).toBeNull();
  });

  it('asks for a description again when the chosen design was dropped', async () => {
    const action = vi.fn(async (): Promise<CustomOrderState> => ({
      status: 'invalid',
      errors: { description: 'Tell us about the cake you have in mind.' },
      values: EMPTY,
      designUnavailable: true,
    }));
    const { user, container } = setup(action, { designSlug: 'gone' });
    expect(
      screen.getByRole('textbox', { name: 'What cake do you have in mind? (Optional)' }),
    ).not.toBeRequired();
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));
    const description = await screen.findByRole('textbox', {
      name: 'What cake do you have in mind?',
    });
    expect(description).toBeRequired();
    expect(container.querySelector('input[name=design]')).toBeNull();
  });

  it('remembers a dropped design on later attempts and hides it', async () => {
    const invalid = (designUnavailable: boolean): CustomOrderState => ({
      status: 'invalid',
      errors: { description: 'Tell us about the cake you have in mind.' },
      values: EMPTY,
      designUnavailable,
    });
    // First attempt: the server drops the design. Second: no design was posted, so the
    // server has nothing to report; the form must not bring the design back.
    const action = vi
      .fn<CustomOrderFormProps['action']>()
      .mockResolvedValueOnce(invalid(true))
      .mockResolvedValueOnce(invalid(false));
    const { user, container } = setup(action, {
      designSlug: 'gone',
      chosenDesign: <aside aria-label="Chosen design">Gone cake</aside>,
    });
    expect(screen.getByRole('complementary', { name: 'Chosen design' })).toBeInTheDocument();

    for (const attempt of [1, 2]) {
      await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));
      await waitFor(() => expect(action).toHaveBeenCalledTimes(attempt));
      expect(
        await screen.findByRole('textbox', { name: 'What cake do you have in mind?' }),
      ).toBeRequired();
      expect(screen.getByRole('status')).toHaveTextContent('no longer in our gallery');
      expect(screen.queryByRole('complementary')).toBeNull();
      expect(container.querySelector('input[name=design]')).toBeNull();
    }
    const second = action.mock.calls[1]?.[1];
    expect(second?.get('design')).toBeNull();
  });

  it('says when the chosen design is no longer available', async () => {
    const { user } = setup(
      vi.fn(async () => ({ ...ready('Hello'), designUnavailable: true })),
      { designSlug: 'gone' },
    );
    await user.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'The design you chose is no longer in our gallery',
    );
  });

  it('works in Arabic, with Western digits', () => {
    setup(vi.fn(), {}, 'ar');
    expect(screen.getByRole('button', { name: 'جهّز رسالة واتساب' })).toBeInTheDocument();
    expect(screen.getAllByText('0 من 500')).toHaveLength(2);
    expect(screen.getByText('0 من 40')).toBeInTheDocument();
  });
});
