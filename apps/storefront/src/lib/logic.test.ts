// @vitest-environment node
import { design, flavourCakes, image, product } from '@/test/fixtures';

import {
  categoriesById,
  displayPriceJod,
  isPublicDesign,
  isPublicImage,
  isPublicProduct,
  primaryPublicImage,
} from './catalog';
import {
  designFacets,
  INITIAL_DESIGN_FILTER,
  INITIAL_PRODUCT_FILTER,
  isDesignFilterActive,
  isProductFilterActive,
  matchesDesignFilter,
  matchesProductFilter,
  productFacets,
} from './filters';
import { formatTimeOfDay } from './format';
import { MAIN_NAV, routes, sectionForPath } from './routes';

describe('routes', () => {
  it('follow the blueprint route plan', () => {
    expect(routes.category('sweets')).toBe('/shop/sweets');
    expect(routes.product('lotus-cake')).toBe('/products/lotus-cake');
    expect(routes.design('rose-cake')).toBe('/our-work/rose-cake');
    expect(MAIN_NAV.map((i) => i.key)).toEqual([
      'shop',
      'customOrder',
      'ourWork',
      'about',
      'faq',
      'contact',
    ]);
  });

  it('find the section a path belongs to', () => {
    expect(sectionForPath('/')).toBeNull();
    expect(sectionForPath('/shop')).toBe('shop');
    expect(sectionForPath('/shop/sweets')).toBe('shop');
    expect(sectionForPath('/products/lotus-cake')).toBe('shop');
    expect(sectionForPath('/our-work/rose-cake')).toBe('ourWork');
    expect(sectionForPath('/faq')).toBe('faq');
    expect(sectionForPath('/shopping')).toBeNull();
    expect(sectionForPath('/design-system')).toBeNull();
  });
});

describe('visibility rules', () => {
  it('only treat approved images under /images as public', () => {
    expect(isPublicImage(image('/images/products/a.jpg'))).toBe(true);
    expect(isPublicImage(image('/images/products/a.jpg', 'pending'))).toBe(false);
    expect(isPublicImage(image('private-assets/review/products/a.jpg', 'pending'))).toBe(false);
    expect(isPublicImage(image('private-assets/review/products/a.jpg'))).toBe(false);
  });

  it('skip pending photos and fall back to the placeholder', () => {
    const pendingFirst = product({
      images: [
        image('private-assets/review/products/x.jpg', 'pending'),
        image('/images/products/y.jpg'),
      ],
    });
    expect(primaryPublicImage(pendingFirst)?.src).toBe('/images/products/y.jpg');
    expect(primaryPublicImage(product({ images: [] }))).toBeUndefined();
  });

  it('only show active products', () => {
    expect(isPublicProduct(product())).toBe(true);
    expect(isPublicProduct(product({ isActive: false }))).toBe(false);
  });

  it('only show published designs with a public photo', () => {
    expect(isPublicDesign(design())).toBe(true);
    expect(isPublicDesign(design({ isPublished: false }))).toBe(false);
    expect(
      isPublicDesign(design({ image: image('private-assets/review/designs/x.jpg', 'pending') })),
    ).toBe(false);
  });
});

describe('displayed price (decision 0005)', () => {
  const variant = (priceJod: number | null, isDefault: boolean) => ({
    id: `v${priceJod}`,
    label: { ar: 'حجم', en: 'Size' },
    servings: null,
    priceJod,
    source: priceJod === null ? null : 'owner, 2026-11-24',
    isDefault,
  });

  it('is "on request" without a confirmed price', () => {
    expect(displayPriceJod(product())).toBeNull();
    expect(displayPriceJod(product({ variants: [variant(null, true)] }))).toBeNull();
    expect(
      displayPriceJod(product({ variants: [variant(10, false), variant(14, false)] })),
    ).toBeNull();
  });

  it("uses the default size's price, or the only size's price", () => {
    expect(displayPriceJod(product({ variants: [variant(10, false), variant(14, true)] }))).toBe(
      14,
    );
    expect(displayPriceJod(product({ variants: [variant(9.5, false)] }))).toBe(9.5);
  });

  it('indexes categories by id', () => {
    expect(categoriesById([flavourCakes]).get('flavour-cakes')).toBe(flavourCakes);
  });
});

describe('product filter', () => {
  const lotus = productFacets(product(), flavourCakes);
  const cheesecake = productFacets(
    product({
      id: 'cheesecake',
      categoryId: 'sweets',
      name: { ar: 'تشيز كيك', en: 'Cheesecake' },
      availability: 'preorder',
    }),
    undefined,
  );

  it('keeps only facets, not the full record', () => {
    expect(Object.keys(lotus).sort()).toEqual(['availability', 'categoryId', 'id', 'searchText']);
  });

  it('matches everything by default', () => {
    expect(matchesProductFilter(lotus, INITIAL_PRODUCT_FILTER)).toBe(true);
    expect(isProductFilterActive(INITIAL_PRODUCT_FILTER)).toBe(false);
  });

  it('filters by category and "ready only"', () => {
    const state = { ...INITIAL_PRODUCT_FILTER, categoryId: 'sweets' };
    expect(matchesProductFilter(lotus, state)).toBe(false);
    expect(matchesProductFilter(cheesecake, state)).toBe(true);
    const ready = { ...INITIAL_PRODUCT_FILTER, readyOnly: true };
    expect(matchesProductFilter(lotus, ready)).toBe(true);
    expect(matchesProductFilter(cheesecake, ready)).toBe(false);
    expect(isProductFilterActive(ready)).toBe(true);
  });

  it('searches names and category names in both languages', () => {
    const search = (query: string) => ({ ...INITIAL_PRODUCT_FILTER, query });
    expect(matchesProductFilter(lotus, search('LOTUS'))).toBe(true);
    expect(matchesProductFilter(lotus, search('لوتس'))).toBe(true);
    expect(matchesProductFilter(lotus, search('كيكه'))).toBe(true);
    expect(matchesProductFilter(lotus, search('نكهات'))).toBe(true);
    expect(matchesProductFilter(lotus, search('flavour'))).toBe(true);
    expect(matchesProductFilter(lotus, search('oreo'))).toBe(false);
    expect(isProductFilterActive(search('  '))).toBe(false);
  });
});

describe('design filter', () => {
  const rose = designFacets(design({ occasionIds: ['birthday', 'kids'], isMini: true }));
  const printed = designFacets(
    design({ id: 'photo', decoration: 'print', occasionIds: ['graduation'] }),
  );

  it('keeps only public facet data, not the full record', () => {
    expect(Object.keys(rose).sort()).toEqual(['decoration', 'id', 'isMini', 'occasionIds']);
    expect(rose).toEqual({
      id: 'rose-cake',
      decoration: 'sugar',
      occasionIds: ['birthday', 'kids'],
      isMini: true,
    });
  });

  it('matches everything by default', () => {
    expect(matchesDesignFilter(rose, INITIAL_DESIGN_FILTER)).toBe(true);
    expect(isDesignFilterActive(INITIAL_DESIGN_FILTER)).toBe(false);
  });

  it('filters by decoration, occasion and mini cakes', () => {
    expect(matchesDesignFilter(printed, { ...INITIAL_DESIGN_FILTER, decoration: 'sugar' })).toBe(
      false,
    );
    expect(matchesDesignFilter(rose, { ...INITIAL_DESIGN_FILTER, occasionId: 'kids' })).toBe(true);
    expect(matchesDesignFilter(printed, { ...INITIAL_DESIGN_FILTER, occasionId: 'kids' })).toBe(
      false,
    );
    expect(matchesDesignFilter(printed, { ...INITIAL_DESIGN_FILTER, miniOnly: true })).toBe(false);
    expect(isDesignFilterActive({ ...INITIAL_DESIGN_FILTER, miniOnly: true })).toBe(true);
  });
});

describe('formatTimeOfDay', () => {
  it('writes the opening hours with Western digits', () => {
    expect(formatTimeOfDay('11:00', 'en')).toBe('11 AM');
    expect(formatTimeOfDay('23:00', 'en')).toBe('11 PM');
    expect(formatTimeOfDay('09:30', 'en')).toBe('9:30 AM');
    expect(formatTimeOfDay('11:00', 'ar')).toBe('11 ص');
    expect(formatTimeOfDay('23:00', 'ar')).toBe('11 م');
    expect(formatTimeOfDay('23:00', 'ar')).not.toMatch(/[٠-٩]/);
  });

  it('rejects malformed times', () => {
    expect(() => formatTimeOfDay('noon', 'en')).toThrow(/HH:MM/);
  });
});
