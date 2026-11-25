// Filtering for the shop and the work gallery, in the browser.
// Pure functions over small, serialisable "facet" records prepared on the server, so the
// browser never receives full content records. Types only from the domain package; the
// search itself comes from the zod-free "@la-porta/domain/search" entry.

import type { Availability, Category, DecorationType, Design, Product } from '@la-porta/domain';
import { matchesSearch, normalizeSearchText, productSearchFields } from '@la-porta/domain/search';

export const ALL = 'all';
export type All = typeof ALL;

// ---------------------------------------------------------------- products

export interface ProductFacets {
  id: string;
  categoryId: string;
  availability: Availability;
  /** Both languages' product and category names, normalized for search. */
  searchText: string;
}

export interface ProductFilterState {
  categoryId: string | All;
  query: string;
  readyOnly: boolean;
}

export const INITIAL_PRODUCT_FILTER: ProductFilterState = {
  categoryId: ALL,
  query: '',
  readyOnly: false,
};

/**
 * Facets for one product. The search text uses the same fields (productSearchFields) and
 * normalization as the repository search, so the browser and server find the same products.
 */
export function productFacets(product: Product, category: Category | undefined): ProductFacets {
  return {
    id: product.id,
    categoryId: product.categoryId,
    availability: product.availability,
    searchText: normalizeSearchText(productSearchFields(product, category).join(' ')),
  };
}

export function matchesProductFilter(item: ProductFacets, state: ProductFilterState): boolean {
  return (
    (state.categoryId === ALL || item.categoryId === state.categoryId) &&
    (!state.readyOnly || item.availability === 'ready') &&
    matchesSearch([item.searchText], state.query)
  );
}

export function isProductFilterActive(state: ProductFilterState): boolean {
  return (
    state.categoryId !== INITIAL_PRODUCT_FILTER.categoryId ||
    state.readyOnly !== INITIAL_PRODUCT_FILTER.readyOnly ||
    state.query.trim() !== ''
  );
}

// ----------------------------------------------------------------- designs

export interface DesignFacets {
  id: string;
  decoration: DecorationType;
  occasionIds: readonly string[];
  isMini: boolean;
}

export interface DesignFilterState {
  decoration: DecorationType | All;
  occasionId: string | All;
  miniOnly: boolean;
}

export const INITIAL_DESIGN_FILTER: DesignFilterState = {
  decoration: ALL,
  occasionId: ALL,
  miniOnly: false,
};

export function designFacets(design: Design): DesignFacets {
  return {
    id: design.id,
    decoration: design.decoration,
    occasionIds: design.occasionIds,
    isMini: design.isMini,
  };
}

export function matchesDesignFilter(item: DesignFacets, state: DesignFilterState): boolean {
  return (
    (state.decoration === ALL || item.decoration === state.decoration) &&
    (state.occasionId === ALL || item.occasionIds.includes(state.occasionId)) &&
    (!state.miniOnly || item.isMini)
  );
}

export function isDesignFilterActive(state: DesignFilterState): boolean {
  return (
    state.decoration !== INITIAL_DESIGN_FILTER.decoration ||
    state.occasionId !== INITIAL_DESIGN_FILTER.occasionId ||
    state.miniOnly !== INITIAL_DESIGN_FILTER.miniOnly
  );
}
