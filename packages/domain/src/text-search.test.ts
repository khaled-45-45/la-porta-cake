import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { matchesSearch, normalizeSearchText } from './text-search';

describe('normalizeSearchText', () => {
  it('folds Arabic letter variants and removes diacritics and tatweel', () => {
    expect(normalizeSearchText('كيكة')).toBe(normalizeSearchText('كيكه'));
    expect(normalizeSearchText('أوريو')).toBe('اوريو');
    expect(normalizeSearchText('إآٱ')).toBe('ااا');
    expect(normalizeSearchText('حلوى')).toBe('حلوي');
    expect(normalizeSearchText('تخرّج')).toBe('تخرج');
    expect(normalizeSearchText('كـــيك')).toBe('كيك');
  });

  it('lower-cases Latin text, removes accents and tidies spaces', () => {
    expect(normalizeSearchText('  Crème   BRÛLÉE ')).toBe('creme brulee');
  });

  it('removes invisible format characters that copied text carries', () => {
    const c = String.fromCharCode;
    expect(normalizeSearchText(`لوتس${c(0x200f)}`)).toBe('لوتس'); // RLM, e.g. from Instagram
    expect(normalizeSearchText(`لو${c(0x200c)}تس`)).toBe('لوتس'); // ZWNJ inside a word
    expect(normalizeSearchText(`${c(0x200e)}Lotus${c(0x2069)}`)).toBe('lotus'); // LRM, isolate
    expect(normalizeSearchText(`a${c(0x200b)}b${c(0xfeff)}`)).toBe('ab'); // ZWSP, BOM
  });

  it('folds Persian kaf and yeh into the Arabic letters', () => {
    const c = String.fromCharCode;
    expect(normalizeSearchText(c(0x06a9))).toBe('ك'); // Persian kaf ک
    expect(normalizeSearchText(c(0x06cc))).toBe('ي'); // Persian yeh ی
    expect(normalizeSearchText(`${c(0x06a9)}${c(0x06cc)}كه`)).toBe(normalizeSearchText('كيكة'));
  });

  it('does not over-normalize: letters that change the word stay apart', () => {
    for (const [a, b] of [
      ['ح', 'خ'],
      ['ت', 'ث'],
      ['د', 'ذ'],
      ['س', 'ش'],
      ['ه', 'ح'],
      ['ك', 'ق'],
    ]) {
      expect(normalizeSearchText(a!)).not.toBe(normalizeSearchText(b!));
    }
    expect(normalizeSearchText('كيكة لوتس 2026')).toBe('كيكه لوتس 2026');
  });

  it('is stable when applied twice', () => {
    const once = normalizeSearchText('ريفانيّ بالبرتقال  KitKat');
    expect(normalizeSearchText(once)).toBe(once);
  });
});

describe('matchesSearch', () => {
  const texts = ['كيكة لوتس', 'Lotus cake', 'كيك بالنكهات'];

  it('matches an empty or blank query', () => {
    expect(matchesSearch(texts, undefined)).toBe(true);
    expect(matchesSearch(texts, '   ')).toBe(true);
  });

  it('finds words in either language and ignores spelling variants', () => {
    expect(matchesSearch(texts, 'lotus')).toBe(true);
    expect(matchesSearch(texts, 'كيكه')).toBe(true);
    expect(matchesSearch(texts, 'LOTUS نكهات')).toBe(true);
  });

  it('needs every word of the query', () => {
    expect(matchesSearch(texts, 'lotus oreo')).toBe(false);
  });

  it('matches pasted queries with invisible marks or Persian letters', () => {
    const c = String.fromCharCode;
    expect(matchesSearch(texts, `لوتس${c(0x200f)}`)).toBe(true);
    expect(matchesSearch(texts, `لو${c(0x200c)}تس`)).toBe(true);
    expect(matchesSearch(texts, `${c(0x06a9)}${c(0x06cc)}كه`)).toBe(true);
  });

  it('has no imports, so it stays small in the browser bundle', () => {
    const source = readFileSync(new URL('./text-search.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
