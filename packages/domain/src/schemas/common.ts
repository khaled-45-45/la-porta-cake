import { z } from 'zod';

/** Text in both site languages. Both must be present and non-empty (decision 0005). */
export const localizedTextSchema = z.strictObject({
  ar: z.string().trim().min(1),
  en: z.string().trim().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** URL-safe identifier shared by both locales, e.g. "kitkat-cake" (decision 0003). */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and single hyphens.');

/** Stable record id. Same format as a slug. */
export const idSchema = slugSchema;

/**
 * Photo policy review (decision 0006).
 * - approved: may be published.
 * - pending: kept in the repository, not published until the owner clears it.
 */
export const imageReviewSchema = z
  .strictObject({
    status: z.enum(['approved', 'pending']),
    reasons: z.array(z.string().trim().min(1)),
  })
  .refine((review) => review.status === 'approved' || review.reasons.length > 0, {
    message: 'A pending image must list at least one review reason.',
  });
export type ImageReview = z.infer<typeof imageReviewSchema>;

/**
 * Where an image file lives.
 * - Approved images are served by the website from `apps/storefront/public`: `/images/...`.
 * - Pending images are kept outside anything the website serves, in the repository-level
 *   folder `private-assets/review/...` (decision 0006).
 */
export const PUBLIC_IMAGE_PATTERN =
  /^\/images\/(site|products|designs)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(jpg|jpeg|png|webp|avif)$/;
export const PRIVATE_REVIEW_IMAGE_PATTERN =
  /^private-assets\/review\/(site|products|designs)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(jpg|jpeg|png|webp|avif)$/;

export const assetIdSchema = z.string().regex(/^[0-9a-f]{32}$/);

export const imageRefSchema = z
  .strictObject({
    src: z
      .string()
      .refine((src) => PUBLIC_IMAGE_PATTERN.test(src) || PRIVATE_REVIEW_IMAGE_PATTERN.test(src), {
        message:
          'Images live under /images/{site,products,designs}/ (approved) or private-assets/review/{site,products,designs}/ (pending), with a slug file name.',
      }),
    width: z.int().positive(),
    height: z.int().positive(),
    alt: localizedTextSchema,
    /** Id of the asset in the design prototype, for traceability. */
    sourceAssetId: assetIdSchema.nullable(),
    review: imageReviewSchema,
  })
  .refine(
    (image) =>
      image.review.status === 'approved'
        ? PUBLIC_IMAGE_PATTERN.test(image.src)
        : PRIVATE_REVIEW_IMAGE_PATTERN.test(image.src),
    {
      message:
        'Approved images must be in the public folder; pending images must be in private-assets/review/.',
      path: ['src'],
    },
  );
export type ImageRef = z.infer<typeof imageRefSchema>;

/** True when an image may be shown on the public site. */
export function isPublishable(image: ImageRef): boolean {
  return image.review.status === 'approved';
}
