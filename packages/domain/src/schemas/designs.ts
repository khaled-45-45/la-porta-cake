import { z } from 'zod';

import { idSchema, imageRefSchema, localizedTextSchema, slugSchema } from './common';

/** How a made-to-order design is decorated. */
export const decorationTypeSchema = z.enum(['sugar', 'print', 'cream']);
export type DecorationType = z.infer<typeof decorationTypeSchema>;

export const occasionSchema = z.strictObject({
  id: idSchema,
  slug: slugSchema,
  name: localizedTextSchema,
  sort: z.int().nonnegative(),
});
export type Occasion = z.infer<typeof occasionSchema>;

/** A cake from the work gallery that customers can order "like this". */
export const designSchema = z
  .strictObject({
    id: idSchema,
    slug: slugSchema,
    title: localizedTextSchema,
    decoration: decorationTypeSchema,
    occasionIds: z.array(idSchema).min(1),
    isMini: z.boolean(),
    image: imageRefSchema,
    sort: z.int().nonnegative(),
    isPublished: z.boolean(),
  })
  .refine((d) => !d.isPublished || d.image.review.status === 'approved', {
    message: 'A design can only be published when its photo is approved (decision 0006).',
    path: ['isPublished'],
  });
export type Design = z.infer<typeof designSchema>;
