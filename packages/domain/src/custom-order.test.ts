import { describe, expect, it } from 'vitest';

import {
  CUSTOM_ORDER_LIMITS,
  earliestOrderDate,
  latestOrderDate,
  normalizeLine,
  normalizeText,
  parseCustomOrder,
  parseDesignReference,
} from './custom-order';

const options = { today: '2026-11-26', leadHours: 24, occasionIds: ['birthday', 'wedding'] };
const char = (code: number) => String.fromCharCode(code);

describe('normalizeLine', () => {
  it('keeps Arabic and English text and trims single spaces', () => {
    expect(normalizeLine('  عيد   ميلاد  سعيد ')).toBe('عيد ميلاد سعيد');
    expect(normalizeLine('Happy\tbirthday\r\nSara')).toBe('Happy birthday Sara');
  });

  it('removes control and direction characters', () => {
    const typed = `a${char(0)}b${char(0x1b)}c${char(0x7f)}d${char(0x202e)}e${char(0x2066)}f${char(0x200f)}g${char(0x61c)}h`;
    expect(normalizeLine(typed)).toBe('abcdefgh');
  });

  it('removes invisible characters but keeps the joiners emoji need', () => {
    const invisible = [0xad, 0x180e, 0x200b, 0x2060, 0x2063, 0xfeff].map(char).join('');
    expect(normalizeLine(`a${invisible}b`)).toBe('ab');
    expect(normalizeLine(invisible)).toBe('');
    const family = '👩‍👧';
    expect(normalizeLine(family)).toBe(family);
    expect(normalizeLine(`می${char(0x200c)}خواهم`)).toContain(char(0x200c));
  });

  it('replaces a lone surrogate, so the text can always be encoded in a link', () => {
    const broken = normalizeLine(`a${char(0xd800)}b${char(0xdc00)}`);
    expect(broken).toBe('a�b�');
    expect(() => encodeURIComponent(broken)).not.toThrow();
    expect(normalizeLine('🎂')).toBe('🎂');
  });

  it('composes text to NFC', () => {
    expect(normalizeLine('é')).toBe('é');
  });

  it('turns anything but a string into an empty value', () => {
    expect(normalizeLine(undefined)).toBe('');
    expect(normalizeLine(['a'])).toBe('');
    expect(normalizeLine(42)).toBe('');
  });
});

describe('normalizeText', () => {
  it('keeps line breaks but no more than one empty line in a row', () => {
    expect(normalizeText(' first \r\n\r\n\r\n\r\n second third ')).toBe('first\n\nsecond\nthird');
  });

  it('cleans each line like normalizeLine', () => {
    expect(normalizeText(`a${char(0x202e)}  b\n${char(7)}c`)).toBe('a b\nc');
  });
});

describe('parseDesignReference', () => {
  it('accepts a single slug and nothing else', () => {
    expect(parseDesignReference('pink-roses')).toBe('pink-roses');
    for (const bad of [
      '',
      'Pink-Roses',
      '../x',
      'a/b',
      'a b',
      '-a',
      'a--b',
      'https://evil.example',
      '<script>',
      'x'.repeat(101),
      ['pink-roses'],
      undefined,
    ]) {
      expect(parseDesignReference(bad)).toBeNull();
    }
  });
});

describe('order dates', () => {
  it('puts the earliest date whole days of notice ahead', () => {
    expect(earliestOrderDate('2026-11-26', 24)).toBe('2026-11-27');
    expect(earliestOrderDate('2026-11-26', 25)).toBe('2026-11-28');
    expect(earliestOrderDate('2026-11-26', 0)).toBe('2026-11-26');
    expect(earliestOrderDate('2026-12-31', 24)).toBe('2027-01-01');
  });

  it('allows a year ahead at most', () => {
    expect(latestOrderDate('2026-11-26')).toBe('2027-11-26');
  });

  it('refuses an invalid "today"', () => {
    expect(() => earliestOrderDate('26/11/2026', 24)).toThrow();
  });
});

describe('parseCustomOrder', () => {
  it('accepts a full inquiry and normalizes every field', () => {
    const result = parseCustomOrder(
      {
        design: 'pink-roses',
        occasion: 'birthday',
        decoration: 'sugar',
        mini: 'on',
        description: ' كيكة  وردية \n\n\n\nطابقين ',
        flavour: ' فانيلا ',
        writing: 'كل عام وأنت بخير',
        date: '2026-12-05',
        name: ' سارة ',
        notes: 'بدون مكسرات',
      },
      options,
    );
    expect(result).toEqual({
      ok: true,
      values: expect.any(Object),
      request: {
        designSlug: 'pink-roses',
        occasionId: 'birthday',
        decoration: 'sugar',
        mini: true,
        description: 'كيكة وردية\n\nطابقين',
        flavour: 'فانيلا',
        writing: 'كل عام وأنت بخير',
        date: '2026-12-05',
        name: 'سارة',
        notes: 'بدون مكسرات',
      },
    });
  });

  it('needs a description only when no design is referenced', () => {
    expect(parseCustomOrder({ design: 'pink-roses' }, options).ok).toBe(true);
    for (const empty of [' \n ', `${char(0x200b)}${char(0x2060)}\n${char(0xfeff)}`]) {
      const result = parseCustomOrder({ description: empty }, options);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors).toEqual({ description: 'required' });
    }
  });

  it('counts characters, not bytes or UTF-16 units', () => {
    const arabic = 'ك'.repeat(CUSTOM_ORDER_LIMITS.writing);
    const emoji = '🎂'.repeat(CUSTOM_ORDER_LIMITS.writing);
    expect(parseCustomOrder({ design: 'a', writing: arabic }, options).ok).toBe(true);
    expect(parseCustomOrder({ design: 'a', writing: emoji }, options).ok).toBe(true);
    const long = parseCustomOrder({ design: 'a', writing: `${arabic}ك` }, options);
    expect(!long.ok && long.errors.writing).toBe('tooLong');
  });

  it('checks limits after cleaning, so invisible characters do not count', () => {
    const padded = `${'a'.repeat(CUSTOM_ORDER_LIMITS.name)}${char(0x202e).repeat(50)}   `;
    expect(parseCustomOrder({ design: 'a', name: padded }, options).ok).toBe(true);
  });

  it('flags every too-long field', () => {
    const result = parseCustomOrder(
      Object.fromEntries(
        Object.entries(CUSTOM_ORDER_LIMITS).map(([field, max]) => [field, 'x'.repeat(max + 1)]),
      ),
      options,
    );
    expect(!result.ok && result.errors).toEqual({
      name: 'tooLong',
      description: 'tooLong',
      flavour: 'tooLong',
      writing: 'tooLong',
      notes: 'tooLong',
    });
  });

  it('refuses unknown occasions and decorations', () => {
    const result = parseCustomOrder(
      { design: 'a', occasion: 'graduation', decoration: 'gold' },
      options,
    );
    expect(!result.ok && result.errors).toEqual({ occasion: 'invalid', decoration: 'invalid' });
  });

  it('checks the date: real, with enough notice, within a year', () => {
    const date = (value: string) => {
      const result = parseCustomOrder({ design: 'a', date: value }, options);
      return result.ok ? 'ok' : result.errors.date;
    };
    expect(date('2026-11-27')).toBe('ok');
    expect(date('2027-11-26')).toBe('ok');
    expect(date('2026-11-26')).toBe('tooSoon');
    expect(date('2020-01-01')).toBe('tooSoon');
    expect(date('2027-11-27')).toBe('tooFar');
    expect(date('2026-02-30')).toBe('invalid');
    expect(date('27/11/2026')).toBe('invalid');
    expect(date('2026-11-27T00:00')).toBe('invalid');
  });

  it('returns the cleaned values and the design so the form can be shown again', () => {
    const result = parseCustomOrder(
      { design: 'pink-roses', name: ` سارة${char(0)} `, date: 'tomorrow', mini: 'yes' },
      options,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.designSlug).toBe('pink-roses');
      expect(result.values.name).toBe('سارة');
      expect(result.values.date).toBe('tomorrow');
      expect(result.values.mini).toBe('');
    }
  });

  it('ignores fields it does not know and non-string values', () => {
    const result = parseCustomOrder(
      { design: ['a', 'b'], description: { toString: () => 'x' }, price: '1', isPublished: true },
      options,
    );
    expect(!result.ok && result.errors).toEqual({ description: 'required' });
    expect(!result.ok && result.designSlug).toBeNull();
  });
});
