import type { Availability, Category, Product } from './schemas/catalog';
import type { DecorationType, Design, Occasion } from './schemas/designs';
import type { FaqGroup, StoreSettings } from './schemas/site';

/**
 * Data access contracts for the storefront (decision 0004).
 *
 * - Every method is asynchronous, so a local implementation and a future API
 *   implementation (V2) are interchangeable without changing components.
 * - Filters are plain, serialisable objects that map directly to API query parameters.
 * - Implementations return public data only: active products, published designs and
 *   approved images (decisions 0006 and 0010). Callers never filter for visibility.
 * - Results are sorted by each record's `sort` value and are safe to modify:
 *   changing a returned object never changes later results.
 */

export interface ProductFilter {
  /** Only products in this category. Unknown slugs give an empty list. */
  categorySlug?: string;
  /** Only products with one of these availability states. */
  availability?: readonly Availability[];
  /**
   * Every word must appear in the product's or its category's name, in Arabic or English
   * (productSearchFields); ignores case, accents, Arabic diacritics and spelling variants.
   */
  search?: string;
}

export interface DesignFilter {
  decoration?: DecorationType;
  /** Only designs for this occasion. Unknown slugs give an empty list. */
  occasionSlug?: string;
  /** Only mini cakes. */
  miniOnly?: boolean;
}

export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  listProducts(filter?: ProductFilter): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
}

export interface DesignRepository {
  listOccasions(): Promise<Occasion[]>;
  listDesigns(filter?: DesignFilter): Promise<Design[]>;
  getDesignBySlug(slug: string): Promise<Design | null>;
}

export interface SiteRepository {
  getSettings(): Promise<StoreSettings>;
  listFaq(): Promise<FaqGroup[]>;
}

export interface Repositories {
  catalog: CatalogRepository;
  designs: DesignRepository;
  site: SiteRepository;
}
