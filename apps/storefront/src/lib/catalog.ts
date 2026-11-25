import 'server-only';

import type { Category, Design, ImageRef, Product } from '@la-porta/domain';
import { isPublishable, PUBLIC_IMAGE_PATTERN } from '@la-porta/domain';

/**
 * Presentation rules for products and designs, kept out of the components.
 *
 * The repositories already return public data only (decisions 0006, 0010). These checks
 * repeat that rule at the last step before anything is drawn, so a mistake in a future
 * data source still cannot put a pending image or an unpublished design on a page.
 */

/** An approved image served from public/images. */
export function isPublicImage(image: ImageRef): boolean {
  return isPublishable(image) && PUBLIC_IMAGE_PATTERN.test(image.src);
}

/** A product the shop shows: active (decision 0006). Inactive products are hidden. */
export function isPublicProduct(product: Product): boolean {
  return product.isActive;
}

/** The photo to show for a product, or undefined for the "no photo yet" placeholder. */
export function primaryPublicImage(product: Product): ImageRef | undefined {
  return product.images.find(isPublicImage);
}

/** A published design whose photo is public. */
export function isPublicDesign(design: Design): boolean {
  return design.isPublished && isPublicImage(design.image);
}

/**
 * The price to show on a product card: the default size's confirmed price, or the only
 * size's price. Null means "Price on request" (decision 0005); nothing is estimated.
 */
export function displayPriceJod(product: Product): number | null {
  const variant =
    product.variants.find((v) => v.isDefault) ??
    (product.variants.length === 1 ? product.variants[0] : undefined);
  return variant?.priceJod ?? null;
}

/** Categories by id, to label products. */
export function categoriesById(categories: readonly Category[]): Map<string, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}
