import { z } from 'zod';

import { idSchema, imageRefSchema, localizedTextSchema, slugSchema } from './common';

/** Availability is set by hand by the shop; nothing on the site claims live stock. */
export const availabilitySchema = z.enum(['ready', 'preorder', 'unavailable', 'seasonal']);
export type Availability = z.infer<typeof availabilitySchema>;

export const categoryLayoutSchema = z.enum(['flavour-wall', 'menu-list']);
export type CategoryLayout = z.infer<typeof categoryLayoutSchema>;

export const categorySchema = z.strictObject({
  id: idSchema,
  slug: slugSchema,
  name: localizedTextSchema,
  description: localizedTextSchema.nullable(),
  layout: categoryLayoutSchema,
  sort: z.int().nonnegative(),
});
export type Category = z.infer<typeof categorySchema>;

/** JOD has three decimal places (fils). */
const jodAmount = z
  .number()
  .positive()
  .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6, {
    message: 'JOD amounts have at most three decimal places.',
  });

/**
 * A size or option of a product.
 * Prices and servings are never invented (decision 0005): unknown values are null,
 * and any non-null value must record where it came from.
 */
export const productVariantSchema = z
  .strictObject({
    id: idSchema,
    label: localizedTextSchema,
    servings: z.int().positive().nullable(),
    priceJod: jodAmount.nullable(),
    /** Who confirmed the price or servings, and when. Required when either is set. */
    source: z.string().trim().min(1).nullable(),
    isDefault: z.boolean(),
  })
  .refine((v) => (v.priceJod === null && v.servings === null) || v.source !== null, {
    message: 'A price or serving size needs a recorded source.',
    path: ['source'],
  });
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productSchema = z
  .strictObject({
    id: idSchema,
    slug: slugSchema,
    categoryId: idSchema,
    name: localizedTextSchema,
    description: localizedTextSchema.nullable(),
    availability: availabilitySchema,
    /** Hours of notice needed. Null means the store default (StoreSettings.defaultLeadHours). */
    prepLeadHours: z.int().positive().nullable(),
    variants: z.array(productVariantSchema),
    /**
     * Empty means the product shows a placeholder (decision 0006): either it has no photo,
     * or its photo is still in private-assets/review/ awaiting approval.
     */
    images: z.array(imageRefSchema),
    sort: z.int().nonnegative(),
    isActive: z.boolean(),
  })
  .refine((p) => p.variants.filter((v) => v.isDefault).length <= 1, {
    message: 'A product has at most one default variant.',
    path: ['variants'],
  })
  .refine((p) => !p.isActive || p.images.every((image) => image.review.status === 'approved'), {
    message: 'An active product may only use approved images (decision 0006).',
    path: ['images'],
  });
export type Product = z.infer<typeof productSchema>;
