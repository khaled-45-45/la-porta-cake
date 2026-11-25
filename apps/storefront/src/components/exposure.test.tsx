import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getRepositories } from '@/lib/data';
import { renderWithLocale } from '@/test/render';
import { settings as fixtureSettings } from '@/test/fixtures';

import { ProductCatalog } from './catalog';
import { WorkGallery } from './designs';
import { SiteFooter } from './site';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

// The Phase 4 components rendered with the real content, through the same repositories
// the pages use: nothing private may appear in the output (decisions 0006, 0010).

const repositories = getRepositories();
const [categories, products, designs, occasions, settings] = await Promise.all([
  repositories.catalog.listCategories(),
  repositories.catalog.listProducts(),
  repositories.designs.listDesigns(),
  repositories.designs.listOccasions(),
  repositories.site.getSettings(),
]);

// Read as data (not imported), like an outside check would; tests run from apps/storefront.
const rawDesigns = JSON.parse(
  readFileSync(join(process.cwd(), 'src/content/designs.json'), 'utf8'),
) as {
  slug: string;
  isPublished: boolean;
  title: { ar: string; en: string };
}[];
const unpublished = rawDesigns.filter((d) => !d.isPublished);

describe.each(['ar', 'en'] as const)('real content on %s pages', (locale) => {
  it('the shop browser shows all 21 products and no private image', () => {
    const { container } = renderWithLocale(
      <ProductCatalog products={products} categories={categories} />,
      locale,
    );
    expect(container.querySelectorAll('[data-product]')).toHaveLength(21);
    expect(container.innerHTML).not.toMatch(/private-assets|review\//);
    for (const img of container.querySelectorAll('img')) {
      expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('/images/products/');
    }
    // Despacito's photo is still in review: it shows the placeholder.
    const despacito = container.querySelector('[data-product="despacito"]')!;
    expect(despacito.querySelector('img')).toBeNull();
    expect(despacito.querySelector('[data-placeholder="no-photo"]')).not.toBeNull();
  });

  it('the gallery shows the 16 published designs and none of the unpublished ones', () => {
    const { container } = renderWithLocale(
      <WorkGallery designs={designs} occasions={occasions} />,
      locale,
    );
    const shown = [...container.querySelectorAll('[data-design]')].map((el) =>
      el.getAttribute('data-design'),
    );
    expect(shown).toHaveLength(16);
    expect(unpublished.length).toBeGreaterThan(0);
    for (const hidden of unpublished) {
      expect(shown).not.toContain(hidden.slug);
      expect(container).not.toHaveTextContent(hidden.title[locale]);
    }
    expect(container.innerHTML).not.toMatch(/private-assets|review\//);
    for (const img of container.querySelectorAll('img')) {
      expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('/images/designs/');
    }
  });

  it('the footer uses the verified store settings', () => {
    const { container } = renderWithLocale(
      <SiteFooter settings={settings} categories={categories} />,
      locale,
    );
    // The fixture copies the verified Phase 2 settings; the real ones must match it.
    expect(settings.whatsapp.url).toBe(fixtureSettings.whatsapp.url);
    expect(settings.mapsUrl).toBe(fixtureSettings.mapsUrl);
    expect(container.innerHTML).toContain(settings.facebook.url);
    expect(container).toHaveTextContent(settings.address[locale]);
  });
});
