import { describe, expect, it } from 'vitest';

import { imageRefSchema, localizedTextSchema, slugSchema } from './common';
import type { ImageRef } from './common';
import { productSchema, productVariantSchema } from './catalog';
import type { Product } from './catalog';
import { designSchema } from './designs';
import type { Design } from './designs';
import { findContentIssues } from './content';
import type { ContentBundle } from './content';

const text = (ar: string, en: string) => ({ ar, en });

const image = (src: string, status: 'approved' | 'pending' = 'approved'): ImageRef => ({
  src,
  width: 1200,
  height: 900,
  alt: text('صورة', 'Photo'),
  sourceAssetId: null,
  review: status === 'approved' ? { status, reasons: [] } : { status, reasons: ['Check'] },
});

describe('localized text', () => {
  it('requires both Arabic and English', () => {
    expect(localizedTextSchema.safeParse(text('كيك', 'Cake')).success).toBe(true);
    expect(localizedTextSchema.safeParse({ ar: 'كيك' }).success).toBe(false);
    expect(localizedTextSchema.safeParse(text('  ', 'Cake')).success).toBe(false);
  });
});

describe('slug', () => {
  it('accepts lowercase words joined by single hyphens', () => {
    expect(slugSchema.safeParse('kitkat-cake').success).toBe(true);
    expect(slugSchema.safeParse('KitKat').success).toBe(false);
    expect(slugSchema.safeParse('kitkat--cake').success).toBe(false);
    expect(slugSchema.safeParse('كيك').success).toBe(false);
  });
});

describe('image review', () => {
  const PRIVATE = 'private-assets/review/designs/a.jpg';

  it('requires a reason when an image is pending', () => {
    const pendingWithoutReason = { ...image(PRIVATE), review: { status: 'pending', reasons: [] } };
    expect(imageRefSchema.safeParse(pendingWithoutReason).success).toBe(false);
    expect(imageRefSchema.safeParse(image(PRIVATE, 'pending')).success).toBe(true);
  });

  it('only accepts images under the agreed folders', () => {
    expect(imageRefSchema.safeParse(image('/images/products/kitkat-cake.jpg')).success).toBe(true);
    expect(imageRefSchema.safeParse(image('/photos/kitkat.jpg')).success).toBe(false);
  });

  it('keeps pending images out of the public folder (decision 0006)', () => {
    expect(imageRefSchema.safeParse(image('/images/designs/a.jpg', 'pending')).success).toBe(false);
  });

  it('keeps approved images in the public folder', () => {
    expect(imageRefSchema.safeParse(image(PRIVATE, 'approved')).success).toBe(false);
  });
});

describe('product images (decision 0006)', () => {
  const product = (isActive: boolean, images: ImageRef[]) => ({
    id: 'despacito',
    slug: 'despacito',
    categoryId: 'sweets',
    name: text('ديسباسيتو', 'Despacito'),
    description: null,
    availability: 'ready',
    prepLeadHours: null,
    variants: [],
    images,
    sort: 0,
    isActive,
  });
  const pending = image('private-assets/review/products/despacito.jpg', 'pending');

  it('does not let an active product use a pending image', () => {
    expect(productSchema.safeParse(product(true, [pending])).success).toBe(false);
  });

  it('lets an active product show a placeholder (no images)', () => {
    expect(productSchema.safeParse(product(true, [])).success).toBe(true);
  });
});

describe('product variant (decision 0005: no invented prices)', () => {
  const variant = { id: 'small', label: text('صغير', 'Small'), isDefault: true };

  it('allows unknown price and servings', () => {
    expect(
      productVariantSchema.safeParse({ ...variant, servings: null, priceJod: null, source: null })
        .success,
    ).toBe(true);
  });

  it('rejects a price without a recorded source', () => {
    expect(
      productVariantSchema.safeParse({ ...variant, servings: null, priceJod: 12, source: null })
        .success,
    ).toBe(false);
    expect(
      productVariantSchema.safeParse({
        ...variant,
        servings: null,
        priceJod: 12,
        source: 'Owner, 2026-12-01',
      }).success,
    ).toBe(true);
  });

  it('rejects serving sizes without a recorded source', () => {
    expect(
      productVariantSchema.safeParse({ ...variant, servings: 8, priceJod: null, source: null })
        .success,
    ).toBe(false);
  });

  it('allows at most three decimal places in JOD', () => {
    const withPrice = (priceJod: number) => ({
      ...variant,
      servings: null,
      priceJod,
      source: 'Owner',
    });
    expect(productVariantSchema.safeParse(withPrice(12.5)).success).toBe(true);
    expect(productVariantSchema.safeParse(withPrice(0.35)).success).toBe(true);
    expect(productVariantSchema.safeParse(withPrice(1.2345)).success).toBe(false);
  });
});

describe('design (decision 0006: photo policy)', () => {
  const design = (isPublished: boolean, status: 'approved' | 'pending'): Design => ({
    id: 'space-cake',
    slug: 'space-cake',
    title: text('كيكة الفضاء', 'Space cake'),
    decoration: 'sugar',
    occasionIds: ['kids'],
    isMini: false,
    image:
      status === 'approved'
        ? image('/images/designs/space-cake.jpg')
        : image('private-assets/review/designs/space-cake.jpg', 'pending'),
    sort: 0,
    isPublished,
  });

  it('cannot be published while its photo is pending review', () => {
    expect(designSchema.safeParse(design(true, 'pending')).success).toBe(false);
    expect(designSchema.safeParse(design(false, 'pending')).success).toBe(true);
    expect(designSchema.safeParse(design(true, 'approved')).success).toBe(true);
  });
});

describe('findContentIssues', () => {
  const product = (id: string, categoryId: string, images: ImageRef[]): Product => ({
    id,
    slug: id,
    categoryId,
    name: text('اسم', 'Name'),
    description: null,
    availability: 'ready',
    prepLeadHours: null,
    variants: [],
    images,
    sort: 0,
    isActive: true,
  });

  const bundle = (overrides: Partial<ContentBundle> = {}): ContentBundle => ({
    categories: [
      {
        id: 'cakes',
        slug: 'cakes',
        name: text('كيك', 'Cakes'),
        description: null,
        layout: 'flavour-wall',
        sort: 0,
      },
    ],
    products: [product('a', 'cakes', [image('/images/products/a.jpg')])],
    occasions: [{ id: 'kids', slug: 'kids', name: text('أطفال', 'Kids'), sort: 0 }],
    designs: [],
    faq: [],
    settings: {
      images: {
        shopWindow: image('/images/site/window.jpg'),
        shopInterior: image('/images/site/inside.jpg'),
      },
    } as ContentBundle['settings'],
    ...overrides,
  });

  it('finds no issues in consistent content', () => {
    expect(findContentIssues(bundle())).toEqual([]);
  });

  it('reports duplicate slugs and unknown categories', () => {
    const issues = findContentIssues(
      bundle({ products: [product('a', 'cakes', []), product('a', 'missing', [])] }),
    );
    expect(issues).toContain('Duplicate product id: a');
    expect(issues).toContain('Duplicate product slug: a');
    expect(issues).toContain('Product a refers to unknown category missing');
  });

  it('reports a photo reused for another product', () => {
    const shared = image('/images/products/a.jpg');
    const issues = findContentIssues(
      bundle({ products: [product('a', 'cakes', [shared]), product('b', 'cakes', [shared])] }),
    );
    expect(issues).toContain('Duplicate image used more than once: /images/products/a.jpg');
  });
});
