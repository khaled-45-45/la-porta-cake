import 'server-only';

import type {
  Category,
  DecorationType,
  Design,
  ImageRef,
  Occasion,
  Product,
  Repositories,
  StoreSettings,
} from '@la-porta/domain';

import {
  displayPriceJod,
  isPublicDesign,
  isPublicImage,
  isPublicProduct,
  primaryPublicImage,
} from './catalog';

/**
 * Data for the storefront pages, loaded through the repositories (decision 0004).
 *
 * Each loader takes the repositories as an argument, so tests can pass in-memory or
 * deliberately faulty repositories. Every result passes the visibility guards again:
 * inactive products and unpublished designs are dropped, and products keep only their
 * public photos, so a mistake in a data source cannot put a hidden record or a private
 * image path into page data.
 * Selection rules here are presentation choices, documented where they are made;
 * nothing is invented when data is missing (decision 0005).
 */

/** Hero photos, as in the prototype: the Lotus cake, with the chocolate and strawberry cake. */
export const HERO_PRODUCT_SLUGS = ['lotus-cake', 'chocolate-and-strawberry'] as const;
const FEATURED_PRODUCT_COUNT = 4;
const FEATURED_DESIGN_COUNT = 4;
const RELATED_PRODUCT_COUNT = 4;
/** The category whose ready cakes are featured ("from the shop window"). */
export const FEATURED_CATEGORY_SLUG = 'flavour-cakes';

export interface HeroImage {
  image: ImageRef;
  productName: Product['name'];
}

export interface CategoryDoor {
  category: Category;
  /** A public photo from the category's products, if any. */
  image: ImageRef | undefined;
}

export interface DecorationExample {
  decoration: Exclude<DecorationType, 'cream'>;
  design: Design;
}

export interface HomeData {
  settings: StoreSettings;
  hero: HeroImage[];
  featuredCategory: Category | undefined;
  featuredProducts: Product[];
  categories: Category[];
  featuredDesigns: Design[];
  occasions: Occasion[];
  decorationExamples: DecorationExample[];
  categoryDoors: CategoryDoor[];
}

/** A product with only its public photos. */
const toPublicProduct = (product: Product): Product => ({
  ...product,
  images: product.images.filter(isPublicImage),
});
/** Active products, each with only its public photos. */
const publicProducts = (products: Product[]) =>
  products.filter(isPublicProduct).map(toPublicProduct);
const publicDesigns = (designs: Design[]) => designs.filter(isPublicDesign);

export async function loadHome(repositories: Repositories): Promise<HomeData> {
  const { catalog, designs, site } = repositories;
  const [settings, categories, allProducts, allDesigns, occasions] = await Promise.all([
    site.getSettings(),
    catalog.listCategories(),
    catalog.listProducts(),
    designs.listDesigns(),
    designs.listOccasions(),
  ]);
  const products = publicProducts(allProducts);
  const visibleDesigns = publicDesigns(allDesigns);

  const hero = HERO_PRODUCT_SLUGS.flatMap((slug) => {
    const product = products.find((p) => p.slug === slug);
    const image = product ? primaryPublicImage(product) : undefined;
    return product && image ? [{ image, productName: product.name }] : [];
  });

  // Featured: ready cakes from the shop window, with a photo, in the shop's own order,
  // leaving out the cakes already shown in the hero.
  const featuredCategory = categories.find((c) => c.slug === FEATURED_CATEGORY_SLUG);
  const featuredProducts = products
    .filter(
      (p) =>
        p.categoryId === featuredCategory?.id &&
        p.availability === 'ready' &&
        primaryPublicImage(p) !== undefined &&
        !(HERO_PRODUCT_SLUGS as readonly string[]).includes(p.slug),
    )
    .slice(0, FEATURED_PRODUCT_COUNT);

  const decorationExamples = (['sugar', 'print'] as const).flatMap((decoration) => {
    const design = visibleDesigns.find((d) => d.decoration === decoration);
    return design ? [{ decoration, design }] : [];
  });

  const categoryDoors = categories.map((category) => ({
    category,
    image: products
      .filter((p) => p.categoryId === category.id)
      .map(primaryPublicImage)
      .find((image) => image !== undefined),
  }));

  return {
    settings,
    hero,
    featuredCategory,
    featuredProducts,
    categories,
    featuredDesigns: visibleDesigns.slice(0, FEATURED_DESIGN_COUNT),
    occasions,
    decorationExamples,
    categoryDoors,
  };
}

export interface ShopData {
  categories: Category[];
  products: Product[];
}

export async function loadShop(repositories: Repositories): Promise<ShopData> {
  const [categories, products] = await Promise.all([
    repositories.catalog.listCategories(),
    repositories.catalog.listProducts(),
  ]);
  return { categories, products: publicProducts(products) };
}

export interface CategoryPageData {
  category: Category;
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
}

/** Null for an unknown category: the page answers "not found". */
export async function loadCategoryPage(
  repositories: Repositories,
  slug: string,
): Promise<CategoryPageData | null> {
  const { catalog, site } = repositories;
  const [category, categories, settings] = await Promise.all([
    catalog.getCategoryBySlug(slug),
    catalog.listCategories(),
    site.getSettings(),
  ]);
  if (!category) return null;
  const products = await catalog.listProducts({ categorySlug: category.slug });
  return {
    category,
    categories,
    products: publicProducts(products).filter((p) => p.categoryId === category.id),
    settings,
  };
}

/** Notice needed for an item made to order, in whole days when it divides evenly. */
export type LeadTime = { days: number } | { hours: number };

export interface ProductPageData {
  /** The product, with only its public photos. */
  product: Product;
  category: Category | undefined;
  /** Public photos, main photo first. Empty means the page shows the placeholder. */
  images: ImageRef[];
  /** The confirmed price to show, or null for "Price on request" (decision 0005). */
  priceJod: number | null;
  /** Notice for an item made to order; null for any other availability. */
  leadTime: LeadTime | null;
  related: Product[];
  settings: StoreSettings;
}

/** Null for an unknown or inactive product: the page answers "not found". */
export async function loadProductPage(
  repositories: Repositories,
  slug: string,
): Promise<ProductPageData | null> {
  const { catalog, site } = repositories;
  const found = await catalog.getProductBySlug(slug);
  if (!found || !isPublicProduct(found)) return null;
  const product = toPublicProduct(found);

  const [categories, settings] = await Promise.all([catalog.listCategories(), site.getSettings()]);
  const category = categories.find((c) => c.id === product.categoryId);
  const related = category
    ? publicProducts(await catalog.listProducts({ categorySlug: category.slug }))
        .filter((p) => p.id !== product.id)
        .slice(0, RELATED_PRODUCT_COUNT)
    : [];

  return {
    product,
    category,
    images: product.images,
    priceJod: displayPriceJod(product),
    leadTime: leadTimeFor(product, settings),
    related,
    settings,
  };
}

/** Hours of notice for a product made to order: its own, or the store default. */
export function leadHours(product: Product, settings: StoreSettings): number {
  return product.prepLeadHours ?? settings.defaultLeadHours;
}

/** The notice to show for an item made to order; null for any other availability. */
export function leadTimeFor(product: Product, settings: StoreSettings): LeadTime | null {
  if (product.availability !== 'preorder') return null;
  const hours = leadHours(product, settings);
  return hours % 24 === 0 ? { days: hours / 24 } : { hours };
}

/** Slugs for static generation. */
export async function productSlugs(repositories: Repositories): Promise<string[]> {
  return publicProducts(await repositories.catalog.listProducts()).map((p) => p.slug);
}

export async function categorySlugs(repositories: Repositories): Promise<string[]> {
  return (await repositories.catalog.listCategories()).map((c) => c.slug);
}
