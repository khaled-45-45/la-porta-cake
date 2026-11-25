import { describe, expect, it } from 'vitest';

import { createInMemoryRepositories } from './in-memory-repositories';
import type { ImageRef } from './schemas/common';
import type { Product } from './schemas/catalog';
import type { ContentBundle } from './schemas/content';
import type { Design } from './schemas/designs';
import { describeRepositoryContract } from './testing';

const text = (ar: string, en: string) => ({ ar, en });

const approved = (src: string): ImageRef => ({
  src,
  width: 100,
  height: 100,
  alt: text('صورة', 'Photo'),
  sourceAssetId: null,
  review: { status: 'approved', reasons: [] },
});
const pending = (src: string): ImageRef => ({
  ...approved(src),
  review: { status: 'pending', reasons: ['Check'] },
});

const product = (
  id: string,
  categoryId: string,
  sort: number,
  overrides: Partial<Product> = {},
): Product => ({
  id,
  slug: id,
  categoryId,
  name: text(`كيكة ${id}`, `Cake ${id}`),
  description: null,
  availability: 'ready',
  prepLeadHours: null,
  variants: [],
  images: [approved(`/images/products/${id}.jpg`)],
  sort,
  isActive: true,
  ...overrides,
});

const design = (id: string, sort: number, overrides: Partial<Design> = {}): Design => ({
  id,
  slug: id,
  title: text(`تصميم ${id}`, `Design ${id}`),
  decoration: 'sugar',
  occasionIds: ['birthday'],
  isMini: false,
  image: approved(`/images/designs/${id}.jpg`),
  sort,
  isPublished: true,
  ...overrides,
});

/** Small content set with hidden records, to prove visibility rules. */
const fixture: ContentBundle = {
  categories: [
    {
      id: 'sweets',
      slug: 'sweets',
      name: text('حلويات', 'Sweets'),
      description: null,
      layout: 'menu-list',
      sort: 1,
    },
    {
      id: 'cakes',
      slug: 'cakes',
      name: text('كيك', 'Cakes'),
      description: null,
      layout: 'flavour-wall',
      sort: 0,
    },
  ],
  products: [
    product('lotus', 'cakes', 1),
    product('kitkat', 'cakes', 0),
    product('revani', 'sweets', 2, { availability: 'preorder' }),
    product('hidden', 'cakes', 3, {
      isActive: false,
      images: [pending('private-assets/review/products/hidden.jpg')],
    }),
    product('no-photo', 'sweets', 4, { images: [] }),
  ],
  occasions: [
    { id: 'birthday', slug: 'birthday', name: text('عيد ميلاد', 'Birthday'), sort: 0 },
    { id: 'wedding', slug: 'wedding', name: text('عرس', 'Wedding'), sort: 1 },
  ],
  designs: [
    design('space', 1),
    design('heart', 0, { occasionIds: ['wedding'], decoration: 'cream', isMini: true }),
    design('batman', 2, {
      isPublished: false,
      image: pending('private-assets/review/designs/batman.jpg'),
    }),
  ],
  faq: [
    {
      id: 'pay',
      title: text('الدفع', 'Payment'),
      items: [{ id: 'online', question: text('سؤال', 'Question'), answer: null }],
    },
  ],
  settings: {
    name: text('لابورتا كيك', 'La Porta Cake'),
    phone: { e164: '+962788890049', display: '0788890049' },
    whatsapp: { number: '962788890049', url: 'https://wa.me/962788890049' },
    instagram: { handle: 'laportacake', url: 'https://www.instagram.com/laportacake/' },
    facebook: { url: 'https://www.facebook.com/share/19r78WtxnX/' },
    messenger: { url: null },
    address: text('الرصيفة', 'Russeifa'),
    mapsUrl: 'https://maps.app.goo.gl/MRRZ49LmJsrivkUa6',
    hours: [{ days: 'daily', opens: '11:00', closes: '23:00' }],
    delivery: { available: true, areas: null, fees: null },
    defaultLeadHours: 24,
    currency: 'JOD',
    onlinePayment: false,
    images: {
      shopWindow: approved('/images/site/window.jpg'),
      shopInterior: approved('/images/site/inside.jpg'),
    },
  },
};

describeRepositoryContract('in-memory (fixture)', () => createInMemoryRepositories(fixture));

describe('in-memory repositories: visibility', () => {
  const repos = createInMemoryRepositories(fixture);

  it('hides inactive products and their pending images', async () => {
    const ids = (await repos.catalog.listProducts()).map((p) => p.id);
    expect(ids).toEqual(['kitkat', 'lotus', 'revani', 'no-photo']);
    expect(await repos.catalog.getProductBySlug('hidden')).toBeNull();
  });

  it('hides unpublished designs', async () => {
    expect((await repos.designs.listDesigns()).map((d) => d.id)).toEqual(['heart', 'space']);
    expect(await repos.designs.getDesignBySlug('batman')).toBeNull();
  });

  it('sorts categories by their sort value', async () => {
    expect((await repos.catalog.listCategories()).map((c) => c.id)).toEqual(['cakes', 'sweets']);
  });
});
