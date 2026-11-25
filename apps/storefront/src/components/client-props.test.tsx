import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ReactElement } from 'react';

import { getRepositories } from '@/lib/data';
import { INITIAL_PRODUCT_FILTER, matchesProductFilter, productFacets } from '@/lib/filters';
import {
  design,
  flavourCakes,
  birthday,
  graduation,
  image,
  product,
  sweets,
} from '@/test/fixtures';
import { renderWithLocale } from '@/test/render';

import { ProductCard, ProductCatalog } from './catalog';
import { DesignCard, WorkGallery } from './designs';

// What crosses the server/browser boundary. CatalogBrowser and DesignGallery are client
// components: everything passed to them is serialized into the page. These tests capture
// the exact props, replacing the two components with recorders.

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const captured: { catalog: Record<string, unknown>[]; gallery: Record<string, unknown>[] } = {
  catalog: [],
  gallery: [],
};
vi.mock('@/components/catalog/CatalogBrowser', () => ({
  CatalogBrowser: (props: Record<string, unknown>) => {
    captured.catalog.push(props);
    return null;
  },
}));
vi.mock('@/components/designs/DesignGallery', () => ({
  DECORATION_TYPES: ['sugar', 'print', 'cream'],
  DesignGallery: (props: Record<string, unknown>) => {
    captured.gallery.push(props);
    return null;
  },
}));

beforeEach(() => {
  captured.catalog = [];
  captured.gallery = [];
});

interface Entry {
  facets: Record<string, unknown>;
  card: ReactElement<Record<string, unknown>>;
}

const PRODUCT_FACET_KEYS = ['availability', 'categoryId', 'id', 'searchText'];
const DESIGN_FACET_KEYS = ['decoration', 'id', 'isMini', 'occasionIds'];
// Internal or private data that must never be serialized for the browser.
const FORBIDDEN =
  /private-assets|review\/|"pending"|isActive|isPublished|sourceAssetId|"review"|variants|prepLeadHours|"description"|"sort"/;

/** Prop names that carry a value (undefined props are not serialized). */
const definedKeys = (props: Record<string, unknown>) =>
  Object.keys(props)
    .filter((key) => props[key] !== undefined)
    .sort();

/** The props as they would be serialized, minus the server-rendered cards. */
function serializedWithoutCards(props: Record<string, unknown>): string {
  return JSON.stringify(props, (key, value: unknown) => (key === 'card' ? undefined : value));
}

/** Source file of a component, to check it stays a server component. */
const source = (relative: string) =>
  readFileSync(join(process.cwd(), 'src/components', relative), 'utf8');

describe('props passed to CatalogBrowser (client)', () => {
  const visible = product();
  const hidden = product({
    id: 'secret-recipe',
    slug: 'secret-recipe',
    name: { ar: 'وصفة سرية', en: 'Secret recipe' },
    isActive: false,
  });
  const withPendingPhoto = product({
    id: 'despacito',
    slug: 'despacito',
    categoryId: 'sweets',
    name: { ar: 'ديسباسيتو', en: 'Despacito' },
    description: { ar: 'وصف', en: 'Description' },
    images: [image('private-assets/review/products/despacito.jpg', 'pending')],
  });

  function capture() {
    renderWithLocale(
      <ProductCatalog
        products={[visible, hidden, withPendingPhoto]}
        categories={[flavourCakes, sweets]}
      />,
      'en',
    );
    expect(captured.catalog).toHaveLength(1);
    return captured.catalog[0]!;
  }

  it('has only the expected top-level props', () => {
    expect(definedKeys(capture())).toEqual(['categories', 'entries']);
  });

  it('passes categories as id and name only', () => {
    expect(capture().categories).toEqual([
      { id: 'flavour-cakes', name: 'Flavour cakes' },
      { id: 'sweets', name: 'Sweets' },
    ]);
  });

  it('passes each product as public filter fields only', () => {
    const entries = capture().entries as Entry[];
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual(['card', 'facets']);
      expect(Object.keys(entry.facets).sort()).toEqual(PRODUCT_FACET_KEYS);
    }
    expect(entries[0]!.facets).toEqual({
      id: 'lotus-cake',
      categoryId: 'flavour-cakes',
      availability: 'ready',
      searchText: 'كيكه لوتس lotus cake كيك بالنكهات flavour cakes',
    });
  });

  it('leaves inactive products out entirely', () => {
    const props = capture();
    expect((props.entries as Entry[]).map((e) => e.facets.id)).toEqual(['lotus-cake', 'despacito']);
    expect(serializedWithoutCards(props)).not.toMatch(/secret|سرية/i);
  });

  it('serializes nothing internal or private', () => {
    expect(serializedWithoutCards(capture())).not.toMatch(FORBIDDEN);
  });

  it('hands over cards as server-rendered ProductCard elements', () => {
    // A server component's props are resolved on the server: only its rendered output
    // (links, text, public image URLs) is serialized, never the product record.
    for (const entry of capture().entries as Entry[]) expect(entry.card.type).toBe(ProductCard);
    expect(source('catalog/ProductCard.tsx')).not.toMatch(/['"]use client['"]/);
    expect(source('catalog/ProductImage.tsx')).not.toMatch(/['"]use client['"]/);
  });
});

describe('props passed to DesignGallery (client)', () => {
  const published = design({ occasionIds: ['birthday'] });
  const unpublished = design({
    id: 'space-cake',
    slug: 'space-cake',
    title: { ar: 'كيكة الفضاء', en: 'Space cake' },
    occasionIds: ['graduation'],
    isPublished: false,
  });
  const pending = design({
    id: 'batman',
    slug: 'batman',
    title: { ar: 'باتمان', en: 'Batman' },
    image: image('private-assets/review/designs/batman.jpg', 'pending'),
  });

  function capture() {
    renderWithLocale(
      <WorkGallery
        designs={[published, unpublished, pending]}
        occasions={[birthday, graduation]}
      />,
      'en',
    );
    expect(captured.gallery).toHaveLength(1);
    return captured.gallery[0]!;
  }

  it('has only the expected top-level props', () => {
    expect(definedKeys(capture())).toEqual(['entries', 'occasions']);
  });

  it('passes only occasions that have a public design, as id and name', () => {
    expect(capture().occasions).toEqual([{ id: 'birthday', name: 'Birthday' }]);
  });

  it('passes each design as public filter fields only, and only public designs', () => {
    const props = capture();
    const entries = props.entries as Entry[];
    expect(entries.map((e) => e.facets.id)).toEqual(['rose-cake']);
    for (const entry of entries) {
      expect(Object.keys(entry.facets).sort()).toEqual(DESIGN_FACET_KEYS);
      expect(entry.card.type).toBe(DesignCard);
    }
    const serialized = serializedWithoutCards(props);
    expect(serialized).not.toMatch(FORBIDDEN);
    expect(serialized).not.toMatch(/space-cake|batman|Space cake|Batman/);
    expect(source('designs/DesignCard.tsx')).not.toMatch(/['"]use client['"]/);
  });
});

describe('with the real content', () => {
  const repositories = getRepositories();

  it.each(['ar', 'en'] as const)(
    'passes only public fields for all products and designs (%s)',
    async (locale) => {
      const [categories, products, designs, occasions] = await Promise.all([
        repositories.catalog.listCategories(),
        repositories.catalog.listProducts(),
        repositories.designs.listDesigns(),
        repositories.designs.listOccasions(),
      ]);
      renderWithLocale(<ProductCatalog products={products} categories={categories} />, locale);
      renderWithLocale(<WorkGallery designs={designs} occasions={occasions} />, locale);
      const [catalog, gallery] = [captured.catalog[0]!, captured.gallery[0]!];

      expect((catalog.entries as Entry[]).length).toBe(21);
      expect((gallery.entries as Entry[]).length).toBe(16);
      for (const entry of catalog.entries as Entry[]) {
        expect(Object.keys(entry.facets).sort()).toEqual(PRODUCT_FACET_KEYS);
      }
      for (const entry of gallery.entries as Entry[]) {
        expect(Object.keys(entry.facets).sort()).toEqual(DESIGN_FACET_KEYS);
      }
      expect(serializedWithoutCards(catalog)).not.toMatch(FORBIDDEN);
      expect(serializedWithoutCards(gallery)).not.toMatch(FORBIDDEN);

      // None of the unpublished designs' slugs reach the browser.
      const raw = JSON.parse(
        readFileSync(join(process.cwd(), 'src/content/designs.json'), 'utf8'),
      ) as { slug: string; isPublished: boolean }[];
      const shown = new Set((gallery.entries as Entry[]).map((e) => e.facets.id));
      for (const hidden of raw.filter((d) => !d.isPublished)) {
        expect(shown.has(hidden.slug)).toBe(false);
        expect(serializedWithoutCards(gallery)).not.toContain(hidden.slug);
      }
    },
  );
});

describe('search: server (repository) and browser (filters) find the same products', () => {
  const repositories = getRepositories();
  const c = String.fromCharCode;
  const queries = [
    '',
    'نكهات',
    'كيك بالنكهات',
    'flavour cakes',
    'SWEETS',
    'حلويات',
    'كيكه',
    'lotus كيكه',
    'kitkat',
    'ريد فيلفيت',
    `لوتس${c(0x200f)}`,
    `${c(0x06a9)}${c(0x06cc)}كه`,
    'no-such-thing',
  ];

  it.each(queries)('query %j', async (query) => {
    const [categories, products] = await Promise.all([
      repositories.catalog.listCategories(),
      repositories.catalog.listProducts(),
    ]);
    const byId = new Map(categories.map((category) => [category.id, category]));
    const server = (await repositories.catalog.listProducts({ search: query })).map((p) => p.id);
    const browser = products
      .filter((p) =>
        matchesProductFilter(productFacets(p, byId.get(p.categoryId)), {
          ...INITIAL_PRODUCT_FILTER,
          query,
        }),
      )
      .map((p) => p.id);
    expect(browser).toEqual(server);
  });

  it('finds every product of a category by the category name on both sides', async () => {
    const sweetsIds = (await repositories.catalog.listProducts({ categorySlug: 'sweets' })).map(
      (p) => p.id,
    );
    const found = (await repositories.catalog.listProducts({ search: 'حلويات' })).map((p) => p.id);
    expect(found).toEqual(expect.arrayContaining(sweetsIds));
    expect(sweetsIds.length).toBeGreaterThan(0);
  });
});
