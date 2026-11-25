// What a product can be found by, shared by the repositories (server) and the shop
// filters (browser), so both find the same products. Type-only imports: nothing from
// the schemas (or zod) is loaded at run time.
import type { Category, Product } from './schemas/catalog';

/**
 * The texts a product is found by: its own names and its category's names, in both
 * languages, so "lotus", "لوتس" and "flavour cakes" all find the Lotus cake.
 */
export function productSearchFields(
  product: Pick<Product, 'name'>,
  category: Pick<Category, 'name'> | undefined,
): string[] {
  const fields = [product.name.ar, product.name.en];
  if (category) fields.push(category.name.ar, category.name.en);
  return fields;
}
