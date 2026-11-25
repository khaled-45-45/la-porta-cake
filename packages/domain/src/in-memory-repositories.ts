import type {
  CatalogRepository,
  DesignFilter,
  DesignRepository,
  ProductFilter,
  Repositories,
  SiteRepository,
} from './repositories';
import { isPublishable } from './schemas/common';
import type { ContentBundle } from './schemas/content';
import type { Product } from './schemas/catalog';
import type { Design } from './schemas/designs';

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

/** Public view of a product: active only, approved images only (decisions 0006, 0010). */
function publicProduct(product: Product): Product | null {
  if (!product.isActive) return null;
  return { ...product, images: product.images.filter(isPublishable) };
}

/** Public view of a design: published with an approved photo only. */
function publicDesign(design: Design): Design | null {
  return design.isPublished && isPublishable(design.image) ? design : null;
}

const isPresent = <T>(value: T | null): value is T => value !== null;

function matchesSearch(product: Product, search: string | undefined): boolean {
  const needle = search?.trim().toLocaleLowerCase();
  if (!needle) return true;
  return (
    product.name.ar.toLocaleLowerCase().includes(needle) ||
    product.name.en.toLocaleLowerCase().includes(needle)
  );
}

/**
 * Repositories over already-validated content held in memory.
 * Every result is a deep copy, so callers cannot change the underlying content.
 */
export function createInMemoryRepositories(content: ContentBundle): Repositories {
  const categories = [...content.categories].sort(bySort);
  const products = content.products.map(publicProduct).filter(isPresent).sort(bySort);
  const occasions = [...content.occasions].sort(bySort);
  const designs = content.designs.map(publicDesign).filter(isPresent).sort(bySort);
  const copy = <T>(value: T): T => structuredClone(value);

  const catalog: CatalogRepository = {
    async listCategories() {
      return copy(categories);
    },
    async getCategoryBySlug(slug) {
      return copy(categories.find((c) => c.slug === slug) ?? null);
    },
    async listProducts(filter: ProductFilter = {}) {
      const category = filter.categorySlug
        ? categories.find((c) => c.slug === filter.categorySlug)
        : undefined;
      if (filter.categorySlug && !category) return [];
      return copy(
        products.filter(
          (p) =>
            (!category || p.categoryId === category.id) &&
            (!filter.availability || filter.availability.includes(p.availability)) &&
            matchesSearch(p, filter.search),
        ),
      );
    },
    async getProductBySlug(slug) {
      return copy(products.find((p) => p.slug === slug) ?? null);
    },
  };

  const designRepository: DesignRepository = {
    async listOccasions() {
      return copy(occasions);
    },
    async listDesigns(filter: DesignFilter = {}) {
      const occasion = filter.occasionSlug
        ? occasions.find((o) => o.slug === filter.occasionSlug)
        : undefined;
      if (filter.occasionSlug && !occasion) return [];
      return copy(
        designs.filter(
          (d) =>
            (!filter.decoration || d.decoration === filter.decoration) &&
            (!occasion || d.occasionIds.includes(occasion.id)) &&
            (!filter.miniOnly || d.isMini),
        ),
      );
    },
    async getDesignBySlug(slug) {
      return copy(designs.find((d) => d.slug === slug) ?? null);
    },
  };

  const site: SiteRepository = {
    async getSettings() {
      return copy(content.settings);
    },
    async listFaq() {
      return copy(content.faq);
    },
  };

  return { catalog, designs: designRepository, site };
}
