import { z } from 'zod';

import { categorySchema, productSchema } from './catalog';
import { designSchema, occasionSchema } from './designs';
import { faqGroupSchema, storeSettingsSchema } from './site';

/** All structured content of the storefront, as stored in V1 (decision 0004). */
export const contentBundleSchema = z.strictObject({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  occasions: z.array(occasionSchema),
  designs: z.array(designSchema),
  faq: z.array(faqGroupSchema),
  settings: storeSettingsSchema,
});
export type ContentBundle = z.infer<typeof contentBundleSchema>;

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/**
 * Checks that schemas cannot express on their own: unique ids and slugs,
 * references between records, and that no photo is used for two different items.
 * Returns a list of human-readable problems; an empty list means the content is consistent.
 */
export function findContentIssues(content: ContentBundle): string[] {
  const issues: string[] = [];
  const report = (label: string, values: readonly string[]) => {
    for (const value of duplicates(values)) issues.push(`Duplicate ${label}: ${value}`);
  };

  report(
    'category id',
    content.categories.map((c) => c.id),
  );
  report(
    'category slug',
    content.categories.map((c) => c.slug),
  );
  report(
    'product id',
    content.products.map((p) => p.id),
  );
  report(
    'product slug',
    content.products.map((p) => p.slug),
  );
  report(
    'occasion id',
    content.occasions.map((o) => o.id),
  );
  report(
    'occasion slug',
    content.occasions.map((o) => o.slug),
  );
  report(
    'design id',
    content.designs.map((d) => d.id),
  );
  report(
    'design slug',
    content.designs.map((d) => d.slug),
  );
  report(
    'FAQ group id',
    content.faq.map((g) => g.id),
  );
  report(
    'FAQ item id',
    content.faq.flatMap((g) => g.items.map((i) => i.id)),
  );
  for (const product of content.products) {
    report(
      `variant id in ${product.id}`,
      product.variants.map((v) => v.id),
    );
  }

  const categoryIds = new Set(content.categories.map((c) => c.id));
  for (const product of content.products) {
    if (!categoryIds.has(product.categoryId)) {
      issues.push(`Product ${product.id} refers to unknown category ${product.categoryId}`);
    }
  }

  const occasionIds = new Set(content.occasions.map((o) => o.id));
  for (const design of content.designs) {
    for (const occasionId of design.occasionIds) {
      if (!occasionIds.has(occasionId)) {
        issues.push(`Design ${design.id} refers to unknown occasion ${occasionId}`);
      }
    }
  }

  // A photo belongs to exactly one item: no reuse for missing products (decision 0006).
  const imageSources = [
    ...content.products.flatMap((p) => p.images.map((i) => i.src)),
    ...content.designs.map((d) => d.image.src),
    content.settings.images.shopWindow.src,
    content.settings.images.shopInterior.src,
  ];
  report('image used more than once', imageSources);

  return issues;
}
