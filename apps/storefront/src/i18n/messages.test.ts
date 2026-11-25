// @vitest-environment node
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );
}

const arabic = flatten(ar);
const english = flatten(en);

// The language switcher shows the *other* language's name, so its label is in that language.
const OTHER_LANGUAGE_KEYS = new Set(['LanguageSwitcher.label']);
const ARABIC_LETTERS = /[؀-ۿ]/;

describe('interface messages', () => {
  it('have identical keys in Arabic and English', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(arabic).sort());
  });

  it('have no empty values', () => {
    for (const [key, value] of [...Object.entries(arabic), ...Object.entries(english)]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('have no Arabic letters in English text', () => {
    const offenders = Object.entries(english).filter(
      ([key, value]) => !OTHER_LANGUAGE_KEYS.has(key) && ARABIC_LETTERS.test(value),
    );
    expect(offenders).toEqual([]);
  });

  it('use the agreed wording for a missing price (decision 0005)', () => {
    expect(arabic['Price.onRequest']).toBe('السعر عند الطلب');
    expect(english['Price.onRequest']).toBe('Price on request');
  });
});
