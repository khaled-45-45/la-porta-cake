import { describe, expect, it } from 'vitest';

import type { Repositories } from '../repositories';
import { PUBLIC_IMAGE_PATTERN } from '../schemas/common';
import { categorySchema, productSchema } from '../schemas/catalog';
import { designSchema, occasionSchema } from '../schemas/designs';
import { faqGroupSchema, storeSettingsSchema } from '../schemas/site';

/**
 * Behaviour every repository implementation must have (decision 0004).
 * The local implementation runs it in V1; the API implementation in V2 must pass
 * the same suite before it can replace the local one.
 * The checks rely only on the data the repositories return, not on specific content.
 */
export function describeRepositoryContract(
  name: string,
  createRepositories: () => Repositories | Promise<Repositories>,
): void {
  describe(`repository contract: ${name}`, () => {
    const sortedBySort = (items: { sort: number }[]) =>
      items.every((item, i) => i === 0 || items[i - 1]!.sort <= item.sort);

    describe('catalog', () => {
      it('returns valid categories in sort order, findable by slug', async () => {
        const { catalog } = await createRepositories();
        const categories = await catalog.listCategories();
        expect(categories.length).toBeGreaterThan(0);
        categories.forEach((c) => categorySchema.parse(c));
        expect(sortedBySort(categories)).toBe(true);
        for (const category of categories) {
          expect(await catalog.getCategoryBySlug(category.slug)).toEqual(category);
        }
        expect(await catalog.getCategoryBySlug('no-such-category')).toBeNull();
      });

      it('returns only active products with approved, public images', async () => {
        const { catalog } = await createRepositories();
        const products = await catalog.listProducts();
        expect(products.length).toBeGreaterThan(0);
        expect(sortedBySort(products)).toBe(true);
        for (const product of products) {
          productSchema.parse(product);
          expect(product.isActive).toBe(true);
          for (const image of product.images) {
            expect(image.review.status).toBe('approved');
            expect(PUBLIC_IMAGE_PATTERN.test(image.src)).toBe(true);
          }
        }
      });

      it('finds each listed product by slug and returns null for unknown slugs', async () => {
        const { catalog } = await createRepositories();
        for (const product of await catalog.listProducts()) {
          expect(await catalog.getProductBySlug(product.slug)).toEqual(product);
        }
        expect(await catalog.getProductBySlug('no-such-product')).toBeNull();
      });

      it('filters products by category, availability and search', async () => {
        const { catalog } = await createRepositories();
        const all = await catalog.listProducts();
        const categories = await catalog.listCategories();

        let total = 0;
        for (const category of categories) {
          const inCategory = await catalog.listProducts({ categorySlug: category.slug });
          expect(inCategory.every((p) => p.categoryId === category.id)).toBe(true);
          total += inCategory.length;
        }
        expect(total).toBe(all.length);
        expect(await catalog.listProducts({ categorySlug: 'no-such-category' })).toEqual([]);

        const ready = await catalog.listProducts({ availability: ['ready'] });
        expect(ready.every((p) => p.availability === 'ready')).toBe(true);
        expect(ready).toEqual(all.filter((p) => p.availability === 'ready'));

        const sample = all[0]!;
        const byArabic = await catalog.listProducts({ search: sample.name.ar });
        const byEnglish = await catalog.listProducts({ search: sample.name.en.toUpperCase() });
        expect(byArabic.map((p) => p.id)).toContain(sample.id);
        expect(byEnglish.map((p) => p.id)).toContain(sample.id);
        expect(await catalog.listProducts({ search: 'zzz-no-such-name' })).toEqual([]);
        expect(await catalog.listProducts({ search: '   ' })).toEqual(all);
      });
    });

    describe('designs', () => {
      it('returns valid occasions and only published designs with approved photos', async () => {
        const { designs } = await createRepositories();
        const occasions = await designs.listOccasions();
        occasions.forEach((o) => occasionSchema.parse(o));
        expect(sortedBySort(occasions)).toBe(true);

        const list = await designs.listDesigns();
        expect(list.length).toBeGreaterThan(0);
        expect(sortedBySort(list)).toBe(true);
        for (const design of list) {
          designSchema.parse(design);
          expect(design.isPublished).toBe(true);
          expect(design.image.review.status).toBe('approved');
          expect(PUBLIC_IMAGE_PATTERN.test(design.image.src)).toBe(true);
          expect(await designs.getDesignBySlug(design.slug)).toEqual(design);
        }
        expect(await designs.getDesignBySlug('no-such-design')).toBeNull();
      });

      it('filters designs by decoration, occasion and mini', async () => {
        const { designs } = await createRepositories();
        const all = await designs.listDesigns();

        for (const decoration of ['sugar', 'print', 'cream'] as const) {
          const list = await designs.listDesigns({ decoration });
          expect(list).toEqual(all.filter((d) => d.decoration === decoration));
        }
        for (const occasion of await designs.listOccasions()) {
          const list = await designs.listDesigns({ occasionSlug: occasion.slug });
          expect(list).toEqual(all.filter((d) => d.occasionIds.includes(occasion.id)));
        }
        expect(await designs.listDesigns({ occasionSlug: 'no-such-occasion' })).toEqual([]);
        expect(await designs.listDesigns({ miniOnly: true })).toEqual(all.filter((d) => d.isMini));
      });
    });

    describe('site', () => {
      it('returns valid store settings and FAQ', async () => {
        const { site } = await createRepositories();
        storeSettingsSchema.parse(await site.getSettings());
        (await site.listFaq()).forEach((g) => faqGroupSchema.parse(g));
      });
    });

    it('returns copies: changing a result never changes later results', async () => {
      const { catalog, designs, site } = await createRepositories();
      const products = await catalog.listProducts();
      products[0]!.name.en = 'changed';
      products.pop();
      expect((await catalog.listProducts())[0]!.name.en).not.toBe('changed');
      expect(await catalog.listProducts()).toHaveLength(products.length + 1);

      const settings = await site.getSettings();
      settings.phone.display = 'changed';
      expect((await site.getSettings()).phone.display).not.toBe('changed');

      const list = await designs.listDesigns();
      list[0]!.title.ar = 'changed';
      expect((await designs.listDesigns())[0]!.title.ar).not.toBe('changed');
    });
  });
}
