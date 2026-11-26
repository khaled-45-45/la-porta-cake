// @vitest-environment node
import { createTranslator } from 'next-intl';

import type { ContentBundle, Repositories } from '@la-porta/domain';
import { createInMemoryRepositories } from '@la-porta/domain';
import type { Locale } from '@la-porta/domain/locale';

import ar from '../../messages/ar.json';
import en from '../../messages/en.json';
import { getRepositories } from '@/lib/data';
import { birthday, design, graduation, image, settings } from '@/test/fixtures';

import type { Translate } from './custom-order';
import {
  loadCustomOrderPage,
  prepareCustomOrder,
  readCustomOrderForm,
  resolvePublicDesign,
  shopToday,
} from './custom-order';

const bundle: ContentBundle = {
  categories: [],
  products: [],
  occasions: [birthday, graduation],
  designs: [
    design({ id: 'rose', slug: 'rose', title: { ar: 'كيكة الورد', en: 'Rose cake' } }),
    design({ id: 'hidden', slug: 'hidden', isPublished: false }),
    design({ id: 'pending', slug: 'pending', image: image('/images/designs/p.jpg', 'pending') }),
  ],
  faq: [],
  settings,
};
const repositories = createInMemoryRepositories(bundle);
/** Returns every stored record, unpublished designs included. */
const raw: Repositories = {
  ...repositories,
  designs: {
    listOccasions: async () => bundle.occasions,
    listDesigns: async () => bundle.designs,
    getDesignBySlug: async (slug) => bundle.designs.find((d) => d.slug === slug) ?? null,
  },
};

const translators: Record<Locale, Translate> = {
  ar: createTranslator({ locale: 'ar', messages: ar }) as unknown as Translate,
  en: createTranslator({ locale: 'en', messages: en }) as unknown as Translate,
};
// 26 November 2026, 10:00 in Amman.
const now = new Date('2026-11-26T08:00:00Z');
const prepare = (input: Record<string, unknown>, locale: Locale = 'ar', source = repositories) =>
  prepareCustomOrder(source, input, { locale, t: translators[locale], now });

describe('shopToday', () => {
  it('follows Amman time, not the server clock', () => {
    // 22:30 UTC on the 26th is already the 27th in Amman (UTC+3).
    expect(shopToday(new Date('2026-11-26T22:30:00Z'))).toBe('2026-11-27');
    expect(shopToday(new Date('2026-11-26T20:30:00Z'))).toBe('2026-11-26');
  });
});

describe('resolvePublicDesign', () => {
  it('returns a published design and nothing else, even from a faulty source', async () => {
    for (const source of [repositories, raw]) {
      expect((await resolvePublicDesign(source, 'rose'))?.slug).toBe('rose');
      for (const bad of ['hidden', 'pending', 'nope', '../rose', 'ROSE', ['rose'], undefined, '']) {
        expect(await resolvePublicDesign(source, bad)).toBeNull();
      }
    }
  });
});

describe('loadCustomOrderPage', () => {
  it('opens with the published design from the query', async () => {
    const data = await loadCustomOrderPage(repositories, 'rose', now);
    expect(data.design?.slug).toBe('rose');
    expect(data.earliestDate).toBe('2026-11-27');
    expect(data.latestDate).toBe('2027-11-26');
    expect(data.occasions).toEqual([birthday, graduation]);
  });

  it('ignores tampered, unknown and unpublished references', async () => {
    for (const param of [
      'hidden',
      'pending',
      'nope',
      ['rose', 'rose'],
      'rose/../hidden',
      '<script>alert(1)</script>',
      'https://evil.example',
    ]) {
      expect((await loadCustomOrderPage(raw, param, now)).design).toBeNull();
    }
  });
});

describe('readCustomOrderForm', () => {
  it('keeps only the form fields, each as one string', () => {
    const form = new FormData();
    form.append('name', 'سارة');
    form.append('design', 'rose');
    form.append('design', 'hidden');
    form.append('notes', new Blob(['x']), 'x.txt');
    form.append('isPublished', 'true');
    form.append('$ACTION_ID_x', '');
    const input = readCustomOrderForm(form);
    expect(input.name).toBe('سارة');
    expect(input.design).toEqual([]);
    expect(input.notes).toEqual([]);
    expect(Object.keys(input)).not.toContain('isPublished');
    expect(Object.keys(input).some((key) => key.startsWith('$'))).toBe(false);
  });

  it('gives no values for anything but form data (a hand-made action call)', () => {
    for (const bad of [null, undefined, 'design=rose', { design: 'rose' }, ['rose'], 42]) {
      expect(readCustomOrderForm(bad)).toEqual({});
    }
  });
});

describe('prepareCustomOrder', () => {
  it('prepares the Arabic message and a link to the store number', async () => {
    const state = await prepare({
      design: 'rose',
      occasion: 'birthday',
      decoration: 'print',
      mini: 'on',
      writing: 'كل عام وأنت بخير',
      date: '2026-12-05',
      name: 'سارة',
      description: 'نفس الفكرة\nبس باللون الأزرق',
    });
    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.message).toBe(
      [
        'مرحبا لابورتا، بدي كيكة زي هاد التصميم من معرض أعمالكم: كيكة الورد',
        '',
        'المناسبة: عيد ميلاد',
        'الزينة: قوالب صور',
        'ميني كيك',
        'الكتابة على الكيكة: كل عام وأنت بخير',
        'الموعد المطلوب: السبت 5/12/2026',
        'الاسم: سارة',
        'التفاصيل:',
        'نفس الفكرة',
        'بس باللون الأزرق',
      ].join('\n'),
    );
    const url = new URL(state.whatsappUrl);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${settings.whatsapp.number}`);
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toBe(state.message);
  });

  it('prepares the English message without a design', async () => {
    const state = await prepare({ description: 'A blue cake', flavour: 'Vanilla' }, 'en');
    expect(state.status === 'ready' && state.message).toBe(
      [
        'Hello La Porta, I’d like to ask about a custom cake.',
        '',
        'Flavour: Vanilla',
        'Details:',
        'A blue cake',
      ].join('\n'),
    );
  });

  it('needs a description when there is no design', async () => {
    const state = await prepare({ name: 'Sara' }, 'en');
    expect(state).toEqual({
      status: 'invalid',
      errors: {
        description: 'Tell us about the cake you have in mind, or choose a design from our work.',
      },
      values: expect.objectContaining({ name: 'Sara' }),
      designUnavailable: false,
    });
  });

  it('drops an unpublished or unknown design and says so', async () => {
    for (const slug of ['hidden', 'pending', 'nope']) {
      const withText = await prepare({ design: slug, description: 'كيكة' }, 'ar', raw);
      expect(withText.status).toBe('ready');
      if (withText.status !== 'ready') continue;
      expect(withText.designUnavailable).toBe(true);
      expect(withText.message.startsWith('مرحبا لابورتا، بدي أستفسر')).toBe(true);
      expect(withText.message).not.toContain('كيكة الورد');
      // Without the design, a description is needed again.
      const empty = await prepare({ design: slug }, 'ar', raw);
      expect(empty.status === 'invalid' && Object.keys(empty.errors)).toEqual(['description']);
    }
  });

  it('gives localized errors with no internal details, and keeps the values', async () => {
    const state = await prepare(
      {
        design: 'rose',
        occasion: 'graduation-party',
        decoration: 'gold',
        writing: 'ك'.repeat(41),
        date: '2026-11-26',
        name: `  سارة${String.fromCharCode(0x202e)}  `,
      },
      'ar',
    );
    expect(state.status).toBe('invalid');
    if (state.status !== 'invalid') return;
    expect(state.errors).toEqual({
      occasion: 'اختار من القائمة.',
      decoration: 'اختار من القائمة.',
      writing: 'خلّيها لحد 40 حرف.',
      date: 'أقرب موعد منقدر عليه الجمعة 27/11/2026.',
    });
    expect(state.values.name).toBe('سارة');
    expect(state.values.writing).toHaveLength(41);
    // The status is a word the form reads; the errors themselves are sentences only.
    const text = JSON.stringify(state.errors);
    for (const internal of ['tooLong', 'tooSoon', 'invalid', 'zod', 'path', 'isPublished']) {
      expect(text).not.toContain(internal);
    }
  });

  it('answers a call without form data like an empty form', async () => {
    const state = await prepare(readCustomOrderForm({ design: 'rose' }), 'en');
    expect(state.status === 'invalid' && Object.keys(state.errors)).toEqual(['description']);
  });

  it('writes the length limit with Western digits', async () => {
    const state = await prepare({ design: 'rose', notes: 'x'.repeat(501) }, 'ar');
    expect(state.status === 'invalid' && state.errors.notes).toBe('خلّيها لحد 500 حرف.');
  });

  it('treats a description of invisible characters as empty', async () => {
    const state = await prepare({ description: '\u200B\u2060\uFEFF' }, 'en');
    expect(state.status === 'invalid' && Object.keys(state.errors)).toEqual(['description']);
  });

  it('names dates too far ahead', async () => {
    const state = await prepare({ design: 'rose', date: '2027-12-01' }, 'en');
    expect(state.status === 'invalid' && state.errors.date).toBe(
      'Choose a date up to Friday 26 November 2027.',
    );
  });

  it('builds the link from the settings only, whatever is posted', async () => {
    const state = await prepare({
      design: 'rose',
      number: '15551234567',
      whatsapp: 'https://evil.example',
      notes: 'https://evil.example/?x=1&text=2',
    });
    expect(state.status === 'ready' && new URL(state.whatsappUrl).host).toBe('wa.me');
    expect(state.status === 'ready' && new URL(state.whatsappUrl).pathname).toBe(
      `/${settings.whatsapp.number}`,
    );
  });

  it('never says an order is confirmed or sent', async () => {
    for (const locale of ['ar', 'en'] as const) {
      const state = await prepare({ design: 'rose' }, locale);
      const text = JSON.stringify(state);
      expect(text).not.toMatch(/confirmed|تم تأكيد|تم إرسال|has been sent|order number/i);
    }
  });

  it('works with the real content and settings', async () => {
    const real = getRepositories();
    const [first] = (await real.designs.listDesigns()).filter((d) => d.isPublished);
    const state = await prepare({ design: first?.slug }, 'ar', real);
    expect(state.status).toBe('ready');
    expect(state.status === 'ready' && state.whatsappUrl).toMatch(
      /^https:\/\/wa\.me\/962788890049\?text=/,
    );
  });
});
