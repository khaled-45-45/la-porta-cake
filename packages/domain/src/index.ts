export { DEFAULT_LOCALE, LOCALES, directionFor, isLocale } from './locale';
export type { Locale } from './locale';
export { localeSchema } from './schemas/locale';
export { productSearchFields } from './product-search';
export { matchesSearch, normalizeSearchText } from './text-search';

export {
  PRIVATE_REVIEW_IMAGE_PATTERN,
  PUBLIC_IMAGE_PATTERN,
  assetIdSchema,
  idSchema,
  imageRefSchema,
  imageReviewSchema,
  isPublishable,
  localizedTextSchema,
  slugSchema,
} from './schemas/common';
export type { ImageRef, ImageReview, LocalizedText } from './schemas/common';

export {
  availabilitySchema,
  categoryLayoutSchema,
  categorySchema,
  productSchema,
  productVariantSchema,
} from './schemas/catalog';
export type {
  Availability,
  Category,
  CategoryLayout,
  Product,
  ProductVariant,
} from './schemas/catalog';

export { decorationTypeSchema, designSchema, occasionSchema } from './schemas/designs';
export type { DecorationType, Design, Occasion } from './schemas/designs';

export {
  faqGroupSchema,
  faqItemSchema,
  openingHoursSchema,
  storeSettingsSchema,
} from './schemas/site';
export type { FaqGroup, FaqItem, OpeningHours, StoreSettings } from './schemas/site';

export { contentBundleSchema, findContentIssues } from './schemas/content';
export type { ContentBundle } from './schemas/content';

export { reviewEntrySchema, reviewManifestSchema } from './schemas/review';
export type { ReviewEntry, ReviewManifest } from './schemas/review';

export type {
  CatalogRepository,
  DesignFilter,
  DesignRepository,
  ProductFilter,
  Repositories,
  SiteRepository,
} from './repositories';
export { createInMemoryRepositories } from './in-memory-repositories';

export {
  CUSTOM_ORDER_LIMITS,
  MAX_DAYS_AHEAD,
  earliestOrderDate,
  latestOrderDate,
  normalizeLine,
  normalizeText,
  parseCustomOrder,
  parseDesignReference,
} from './custom-order';
export type {
  CustomOrderErrorCode,
  CustomOrderField,
  CustomOrderParseResult,
  CustomOrderRequest,
  CustomOrderValues,
} from './custom-order';
