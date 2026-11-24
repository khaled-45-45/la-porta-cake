import { z } from 'zod';

import {
  PRIVATE_REVIEW_IMAGE_PATTERN,
  assetIdSchema,
  idSchema,
  localizedTextSchema,
} from './common';

/**
 * Images awaiting the owner's approval (decision 0006).
 * They live in private-assets/review/, outside anything the website serves.
 * - review: publishable once the owner confirms the listed points.
 * - hold: not published unless rights or consent are confirmed.
 */
export const reviewEntrySchema = z.strictObject({
  assetId: assetIdSchema,
  /** Local path. The image files are not in Git; only this manifest is (decision 0006). */
  file: z.string().regex(PRIVATE_REVIEW_IMAGE_PATTERN),
  /** SHA-256 of the file, to detect a missing or swapped image. */
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  width: z.int().positive(),
  height: z.int().positive(),
  alt: localizedTextSchema,
  /** The content record that will use this image once approved. */
  target: z.strictObject({
    kind: z.enum(['product', 'design']),
    id: idSchema,
  }),
  level: z.enum(['review', 'hold']),
  reasons: z.array(z.string().trim().min(1)).min(1),
});
export type ReviewEntry = z.infer<typeof reviewEntrySchema>;

export const reviewManifestSchema = z.strictObject({
  description: z.string(),
  entries: z.array(reviewEntrySchema),
});
export type ReviewManifest = z.infer<typeof reviewManifestSchema>;
