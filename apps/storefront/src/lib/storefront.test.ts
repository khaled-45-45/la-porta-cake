// @vitest-environment node
import type { ContentBundle, Repositories } from '@la-porta/domain';
import { createInMemoryRepositories } from '@la-porta/domain';

import { getRepositories } from '@/lib/data';
import {
  birthday,
  design,
  flavourCakes,
  graduation,
  image,
  product,
  settings,
  sweets,
} from '@/test/fixtures';

import {
  categorySlugs,
  designSlugs,
  leadHours,
  loadCategoryPage,
  loadDesignPage,
  loadGallery,
  loadHome,
  loadProductPage,
  loadShop,
  productSlugs,
} from './storefront';
import { whatsappOrderUrl } from './whatsapp';

// Fixture content with hidden records: an inactive product, an unpublished design and
// pending photos. The loaders must never return them.
const flavour = (slug: string, extra: Parameters<typeof product>[0] = {}) =>
  product({
    id: slug,
    slug,
    name: { ar: `كيكة ${slug}`, en: `${slug} cake` },
    images: [image(`/images/products/${slug}.jpg`)],
    ...extra,
  });

const bundle: ContentBundle = {
  categories: [flavourCakes, sweets],
  products: [
    flavour('lotus-cake', { sort: 0 }),
    flavour('chocolate-and-strawberry', { sort: 1 }),
    flavour('kitkat-cake', { sort: 2 }),
    flavour('oreo-cake', { sort: 3, availability: 'preorder' }),
    flavour('no-photo-cake', { sort: 4, images: [] }),
    flavour('fruit-cake', { sort: 5 }),
    flavour('berry-cake', { sort: 6 }),
    flavour('caramel-cake', { sort: 7 }),
    flavour('hidden-cake', { sort: 8, isActive: false }),
    flavour('cheesecake', {
      sort: 9,
      categoryId: 'sweets',
      availability: 'preorder',
      images: [image('private-assets/review/products/cheesecake.jpg', 'pending')],
      isActive: true,
    }),
  ],
  occasions: [birthday, graduation],
  designs: [
    design({ id: 'rose', slug: 'rose', sort: 0, decoration: 'cream' }),
    design({ id: 'grad', slug: 'grad', sort: 1, decoration: 'print', occasionIds: ['graduation'] }),
    design({ id: 'hidden-design', slug: 'hidden-design', sort: 2, isPublished: false }),
    design({ id: 'sugar', slug: 'sugar', sort: 3, decoration: 'sugar' }),
  ],
  faq: [],
  settings,
};

// The in-memory repository applies the visibility rules itself (it drops the inactive
// product and the unpublished design, and strips the pending photo), so these tests
// show the loaders work with a correct source.
const repositories = createInMemoryRepositories(bundle);

/**
 * A faulty data source that returns every record as stored: inactive products,
 * unpublished designs and pending photos included. Only the loaders' own checks stand
 * between it and the pages.
 */
const raw: Repositories = {
  catalog: {
    listCategories: async () => bundle.categories,
    getCategoryBySlug: async (slug) => bundle.categories.find((c) => c.slug === slug) ?? null,
    listProducts: async (filter = {}) => {
      const category = bundle.categories.find((c) => c.slug === filter.categorySlug);
      return bundle.products.filter((p) => !filter.categorySlug || p.categoryId === category?.id);
    },
    getProductBySlug: async (slug) => bundle.products.find((p) => p.slug === slug) ?? null,
  },
  designs: {
    listOccasions: async () => bundle.occasions,
    listDesigns: async () => bundle.designs,
    getDesignBySlug: async (slug) => bundle.designs.find((d) => d.slug === slug) ?? null,
  },
  site: { getSettings: async () => settings, listFaq: async () => [] },
};

describe('loadHome', () => {
  it('uses the prototype hero cakes, with their public photos', async () => {
    const home = await loadHome(repositories);
    expect(home.hero.map((h) => h.image.src)).toEqual([
      '/images/products/lotus-cake.jpg',
      '/images/products/chocolate-and-strawberry.jpg',
    ]);
  });

  it('features ready flavour cakes with a photo, in order, without the hero cakes', async () => {
    const home = await loadHome(repositories);
    expect(home.featuredProducts.map((p) => p.slug)).toEqual([
      'kitkat-cake',
      'fruit-cake',
      'berry-cake',
      'caramel-cake',
    ]);
    expect(home.featuredCategory?.slug).toBe('flavour-cakes');
  });

  it('features published designs only', async () => {
    const home = await loadHome(repositories);
    expect(home.featuredDesigns.map((d) => d.slug)).toEqual(['rose', 'grad', 'sugar']);
    expect(home.decorationExamples.map((e) => [e.decoration, e.design.slug])).toEqual([
      ['sugar', 'sugar'],
      ['print', 'grad'],
    ]);
  });

  it('gives every category a door, with a public photo when one exists', async () => {
    const home = await loadHome(repositories);
    expect(home.categoryDoors.map((d) => [d.category.slug, d.image?.src])).toEqual([
      ['flavour-cakes', '/images/products/lotus-cake.jpg'],
      ['sweets', undefined],
    ]);
  });

  it('never returns hidden records anywhere', async () => {
    const text = JSON.stringify(await loadHome(repositories));
    expect(text).not.toMatch(/hidden-cake|hidden-design|private-assets/);
  });
});

describe('loadShop and loadCategoryPage', () => {
  it('lists active products only', async () => {
    const shop = await loadShop(repositories);
    expect(shop.products.map((p) => p.slug)).not.toContain('hidden-cake');
    expect(shop.products).toHaveLength(9);
  });

  it("shows only the category's own active products", async () => {
    const page = await loadCategoryPage(repositories, 'sweets');
    expect(page?.category.slug).toBe('sweets');
    expect(page?.products.map((p) => p.slug)).toEqual(['cheesecake']);
    // The pending photo never reaches the page data.
    expect(page?.products[0]?.images).toEqual([]);
  });

  it('answers null for an unknown category', async () => {
    expect(await loadCategoryPage(repositories, 'no-such-category')).toBeNull();
  });
});

describe('loadProductPage', () => {
  it('loads a product with its category, settings and related products', async () => {
    const page = await loadProductPage(repositories, 'kitkat-cake');
    expect(page?.product.slug).toBe('kitkat-cake');
    expect(page?.category?.slug).toBe('flavour-cakes');
    expect(page?.related.map((p) => p.slug)).not.toContain('kitkat-cake');
    expect(page?.related.map((p) => p.slug)).not.toContain('hidden-cake');
    expect(page?.related).toHaveLength(4);
    expect(page?.settings.whatsapp.number).toBe('962788890049');
  });

  it('answers null for an unknown slug and for an inactive product', async () => {
    expect(await loadProductPage(repositories, 'no-such-product')).toBeNull();
    expect(await loadProductPage(repositories, 'hidden-cake')).toBeNull();
  });

  it('answers null for an inactive product even if a data source returns it', async () => {
    const leaky = {
      ...repositories,
      catalog: {
        ...repositories.catalog,
        getProductBySlug: async () => flavour('hidden-cake', { isActive: false }),
      },
    };
    expect(await loadProductPage(leaky, 'hidden-cake')).toBeNull();
  });

  it('uses the store default lead time unless the product has its own', async () => {
    expect(leadHours(product(), settings)).toBe(24);
    expect(leadHours(product({ prepLeadHours: 48 }), settings)).toBe(48);
  });
});

describe('with a faulty data source that returns hidden records', () => {
  const hidden = /hidden-cake|hidden-design|private-assets|"pending"/;

  it('loadHome keeps out inactive products, unpublished designs and pending photos', async () => {
    const home = await loadHome(raw);
    expect(JSON.stringify(home)).not.toMatch(hidden);
    expect(home.featuredDesigns.map((d) => d.slug)).toEqual(['rose', 'grad', 'sugar']);
  });

  it('loadShop keeps out inactive products and strips pending photos', async () => {
    const shop = await loadShop(raw);
    expect(shop.products.map((p) => p.slug)).not.toContain('hidden-cake');
    expect(shop.products.find((p) => p.slug === 'cheesecake')?.images).toEqual([]);
    expect(JSON.stringify(shop)).not.toMatch(hidden);
  });

  it('loadCategoryPage does the same for one category', async () => {
    const flavour = await loadCategoryPage(raw, 'flavour-cakes');
    const sweetsPage = await loadCategoryPage(raw, 'sweets');
    expect(flavour?.products.map((p) => p.slug)).not.toContain('hidden-cake');
    expect(sweetsPage?.products[0]?.images).toEqual([]);
    expect(JSON.stringify([flavour, sweetsPage])).not.toMatch(hidden);
  });

  it('loadProductPage refuses an inactive product and strips pending photos', async () => {
    expect(await loadProductPage(raw, 'hidden-cake')).toBeNull();
    const page = await loadProductPage(raw, 'cheesecake');
    expect(page?.images).toEqual([]);
    expect(page?.product.images).toEqual([]);
    expect(JSON.stringify(page)).not.toMatch(hidden);
    const related = await loadProductPage(raw, 'kitkat-cake');
    expect(related?.related.map((p) => p.slug)).not.toContain('hidden-cake');
  });

  it('builds no page for an inactive product', async () => {
    expect(await productSlugs(raw)).not.toContain('hidden-cake');
  });
});

describe('product page details prepared by the loader', () => {
  it('gives the public photos, the price to show and no lead time for ready items', async () => {
    const page = await loadProductPage(repositories, 'kitkat-cake');
    expect(page?.images.map((i) => i.src)).toEqual(['/images/products/kitkat-cake.jpg']);
    expect(page?.priceJod).toBeNull();
    expect(page?.leadTime).toBeNull();
  });

  it('gives the lead time for items made to order, in days or hours', async () => {
    expect((await loadProductPage(repositories, 'oreo-cake'))?.leadTime).toEqual({ days: 1 });
    const custom: Repositories = {
      ...raw,
      catalog: {
        ...raw.catalog,
        getProductBySlug: async () =>
          flavour('slow-cake', { availability: 'preorder', prepLeadHours: 36 }),
      },
    };
    expect((await loadProductPage(custom, 'slow-cake'))?.leadTime).toEqual({ hours: 36 });
  });
});

describe('static generation', () => {
  it('builds pages for public products and every category only', async () => {
    expect(await productSlugs(repositories)).not.toContain('hidden-cake');
    expect(await categorySlugs(repositories)).toEqual(['flavour-cakes', 'sweets']);
  });
});

describe('with the real content', () => {
  const real = getRepositories();

  it('loads every page', async () => {
    const home = await loadHome(real);
    expect(home.hero).toHaveLength(2);
    expect(home.featuredProducts).toHaveLength(4);
    expect(home.featuredProducts.every((p) => p.availability === 'ready')).toBe(true);
    expect(home.featuredDesigns).toHaveLength(4);
    expect((await loadShop(real)).products).toHaveLength(21);
    expect((await loadCategoryPage(real, 'sweets'))?.products).toHaveLength(9);
    expect((await loadCategoryPage(real, 'flavour-cakes'))?.products).toHaveLength(12);
    expect(await productSlugs(real)).toHaveLength(21);
  });

  it('keeps Despacito without a photo until it is approved', async () => {
    expect((await loadProductPage(real, 'despacito'))?.product.images).toEqual([]);
  });
});

describe('whatsappOrderUrl', () => {
  it('opens a chat with the store number and an encoded message', () => {
    expect(whatsappOrderUrl('962788890049', 'مرحبا لابورتا، بدي أطلب: كيكة لوتس')).toBe(
      `https://wa.me/962788890049?text=${encodeURIComponent('مرحبا لابورتا، بدي أطلب: كيكة لوتس')}`,
    );
  });

  it('encodes characters that would break the link or add parameters', () => {
    const url = new URL(whatsappOrderUrl('962788890049', 'Cake & co? #1 / 50% <b>'));
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/962788890049');
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toBe('Cake & co? #1 / 50% <b>');
    expect(url.href).not.toMatch(/[<>\s]/);
  });

  it('keeps the message on one line and encodes spaces as %20', () => {
    expect(whatsappOrderUrl('962788890049', ' Hello\n\nLa   Porta ')).toBe(
      'https://wa.me/962788890049?text=Hello%20La%20Porta',
    );
  });

  it('leaves out an empty message', () => {
    expect(whatsappOrderUrl('962788890049', '   ')).toBe('https://wa.me/962788890049');
  });

  it('rejects anything that is not a plain international number', () => {
    for (const bad of ['0788890049', '+962788890049', '962-788', 'evil.com/x', '']) {
      expect(() => whatsappOrderUrl(bad, 'x')).toThrow(/digits only/);
    }
  });
});

describe('gallery loaders', () => {
  it('lists published designs with public photos, with every occasion', async () => {
    for (const source of [repositories, raw]) {
      const data = await loadGallery(source);
      expect(data.designs.map((d) => d.slug)).toEqual(['rose', 'grad', 'sugar']);
      expect(data.occasions).toEqual([birthday, graduation]);
    }
  });

  it('drops a published design whose photo is not public', async () => {
    const leaky: Repositories = {
      ...raw,
      designs: {
        ...raw.designs,
        listDesigns: async () => [
          design({ slug: 'pending-photo', image: image('/images/designs/x.jpg', 'pending') }),
          design({ slug: 'private-path', image: image('private-assets/review/designs/x.jpg') }),
        ],
      },
    };
    expect((await loadGallery(leaky)).designs).toEqual([]);
    expect(await designSlugs(leaky)).toEqual([]);
  });

  it('loads a design with its occasions and related published designs', async () => {
    const data = await loadDesignPage(repositories, 'rose');
    expect(data?.design.slug).toBe('rose');
    expect(data?.occasions).toEqual([birthday]);
    // No other cream design: designs sharing the birthday occasion follow.
    expect(data?.related.map((d) => d.slug)).toEqual(['sugar']);
  });

  it('puts designs with the same decoration first among related ones', async () => {
    const source = createInMemoryRepositories({
      ...bundle,
      designs: [
        design({ id: 'a', slug: 'a', sort: 0, decoration: 'sugar' }),
        design({ id: 'b', slug: 'b', sort: 1, decoration: 'cream' }),
        design({ id: 'c', slug: 'c', sort: 2, decoration: 'sugar', occasionIds: ['graduation'] }),
        design({ id: 'd', slug: 'd', sort: 3, decoration: 'print', occasionIds: ['graduation'] }),
      ],
    });
    expect((await loadDesignPage(source, 'a'))?.related.map((d) => d.slug)).toEqual(['c', 'b']);
  });

  it('answers null for unknown and unpublished designs, even from a faulty source', async () => {
    for (const source of [repositories, raw]) {
      expect(await loadDesignPage(source, 'hidden-design')).toBeNull();
      expect(await loadDesignPage(source, 'nope')).toBeNull();
      const related = (await loadDesignPage(source, 'sugar'))?.related ?? [];
      expect(related.map((d) => d.slug)).not.toContain('hidden-design');
    }
  });

  it('builds design pages for published designs only', async () => {
    expect(await designSlugs(raw)).toEqual(['rose', 'grad', 'sugar']);
  });

  it('works with the real content', async () => {
    const real = getRepositories();
    const gallery = await loadGallery(real);
    expect(gallery.designs).toHaveLength(16);
    expect(gallery.designs.every((d) => d.isPublished)).toBe(true);
    expect(await designSlugs(real)).toHaveLength(16);
    for (const slug of await designSlugs(real)) {
      const page = await loadDesignPage(real, slug);
      expect(page?.related.length).toBeGreaterThan(0);
      expect(page?.related.every((d) => d.isPublished && d.slug !== slug)).toBe(true);
    }
  });
});

describe('whatsappOrderUrl with several lines', () => {
  it('keeps line breaks, at most one empty line in a row', () => {
    const url = whatsappOrderUrl('962788890049', ' Hello \r\n\r\n\r\n\r\nLa   Porta\nCake ', {
      multiline: true,
    });
    expect(url).toBe('https://wa.me/962788890049?text=Hello%0A%0ALa%20Porta%0ACake');
    expect(new URL(url).searchParams.get('text')).toBe('Hello\n\nLa Porta\nCake');
  });

  it('removes control characters and keeps the link to one parameter', () => {
    const url = new URL(
      whatsappOrderUrl('962788890049', `a${String.fromCharCode(0)}b\n&text=x#y`, {
        multiline: true,
      }),
    );
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toBe('a b\n&text=x#y');
    expect(url.hash).toBe('');
  });
});
