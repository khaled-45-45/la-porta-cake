import 'server-only';

import {
  contentBundleSchema,
  createInMemoryRepositories,
  findContentIssues,
} from '@la-porta/domain';
import type { Repositories } from '@la-porta/domain';

import categories from '@/content/categories.json';
import designs from '@/content/designs.json';
import faq from '@/content/faq.json';
import occasions from '@/content/occasions.json';
import products from '@/content/products.json';
import settings from '@/content/settings.json';

/**
 * Repositories over the local JSON content (decision 0004).
 * The JSON is bundled at build time, so nothing is read from disk at runtime.
 * Invalid content stops the build with the list of problems.
 */
export function createLocalRepositories(): Repositories {
  const parsed = contentBundleSchema.safeParse({
    categories,
    products,
    occasions,
    designs,
    faq,
    settings,
  });
  if (!parsed.success) {
    throw new Error(`Local content does not match the schemas:\n${parsed.error.message}`);
  }

  const issues = findContentIssues(parsed.data);
  if (issues.length > 0) {
    throw new Error(`Local content is inconsistent:\n- ${issues.join('\n- ')}`);
  }

  return createInMemoryRepositories(parsed.data);
}
