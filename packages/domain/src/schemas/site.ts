import { z } from 'zod';

import { idSchema, imageRefSchema, localizedTextSchema } from './common';

const approvedImageRefSchema = imageRefSchema.refine(
  (image) => image.review.status === 'approved',
  { message: 'Site photos must be approved.' },
);

const httpsUrl = z.url({ protocol: /^https$/ });
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM.');

export const openingHoursSchema = z.strictObject({
  days: z.enum(['daily', 'sat-thu', 'fri']),
  opens: timeOfDay,
  closes: timeOfDay,
});
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const storeSettingsSchema = z.strictObject({
  name: localizedTextSchema,
  phone: z.strictObject({
    /** International format, e.g. +962788890049. */
    e164: z.string().regex(/^\+[1-9]\d{7,14}$/),
    /** As written locally, in Western digits (decision 0003). */
    display: z.string().regex(/^0\d{8,9}$/),
  }),
  whatsapp: z.strictObject({
    /** Digits only, as used by wa.me links. */
    number: z.string().regex(/^[1-9]\d{7,14}$/),
    url: httpsUrl,
  }),
  instagram: z.strictObject({ handle: z.string().regex(/^[a-z0-9._]+$/), url: httpsUrl }),
  facebook: z.strictObject({ url: httpsUrl }),
  /** Direct Messenger link. Null until the Facebook page username is known. */
  messenger: z.strictObject({ url: httpsUrl.nullable() }),
  address: localizedTextSchema,
  /** Link only; no embedded map (decision 0007). */
  mapsUrl: httpsUrl,
  hours: z.array(openingHoursSchema).min(1),
  delivery: z.strictObject({
    available: z.boolean(),
    areas: localizedTextSchema.nullable(),
    fees: localizedTextSchema.nullable(),
  }),
  /** Default notice, in hours, for items that are not ready in the shop. */
  defaultLeadHours: z.int().positive(),
  currency: z.literal('JOD'),
  onlinePayment: z.literal(false),
  /** Site photos are always public, so they must be approved (decision 0006). */
  images: z.strictObject({
    shopWindow: approvedImageRefSchema,
    shopInterior: approvedImageRefSchema,
  }),
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const faqItemSchema = z.strictObject({
  id: idSchema,
  question: localizedTextSchema,
  /** Null while the owner has not confirmed the answer. */
  answer: localizedTextSchema.nullable(),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

export const faqGroupSchema = z.strictObject({
  id: idSchema,
  title: localizedTextSchema,
  items: z.array(faqItemSchema).min(1),
});
export type FaqGroup = z.infer<typeof faqGroupSchema>;
