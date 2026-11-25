import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { productSearchFields } from './product-search';

const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('productSearchFields', () => {
  const product = { name: { ar: 'كيكة لوتس', en: 'Lotus cake' } };
  const category = { name: { ar: 'كيك بالنكهات', en: 'Flavour cakes' } };

  it("finds a product by its names and its category's names, in both languages", () => {
    expect(productSearchFields(product, category)).toEqual([
      'كيكة لوتس',
      'Lotus cake',
      'كيك بالنكهات',
      'Flavour cakes',
    ]);
  });

  it('uses only the product names when the category is unknown', () => {
    expect(productSearchFields(product, undefined)).toEqual(['كيكة لوتس', 'Lotus cake']);
  });
});

describe('the "@la-porta/domain/search" entry stays free of run-time dependencies', () => {
  it('product-search.ts imports types only', () => {
    const imports = source('./product-search.ts').match(/^\s*import\s.*$/gm) ?? [];
    expect(imports.every((line) => /^\s*import type\s/.test(line))).toBe(true);
  });

  it('search.ts only re-exports the two search modules', () => {
    const lines = source('./search.ts')
      .split('\n')
      .filter((line) => /^\s*(import|export)\s/.test(line));
    expect(lines).toEqual([
      "export { productSearchFields } from './product-search';",
      "export { matchesSearch, normalizeSearchText } from './text-search';",
    ]);
  });
});
