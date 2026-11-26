import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Unpublished designs in the real content: they must never appear on a page. */
export const unpublishedDesigns = (
  JSON.parse(readFileSync(join(process.cwd(), 'src/content/designs.json'), 'utf8')) as {
    slug: string;
    isPublished: boolean;
    title: { ar: string; en: string };
  }[]
).filter((d) => !d.isPublished);

/** Nothing private, unpublished or internal in what a page renders. */
export function expectNothingPrivate(container: HTMLElement) {
  const html = container.innerHTML;
  expect(html).not.toMatch(/private-assets|review\/|isActive|isPublished|sourceAssetId/);
  for (const d of unpublishedDesigns) {
    expect(html).not.toContain(`/our-work/${d.slug}`);
    expect(html).not.toContain(`design=${d.slug}`);
    expect(container).not.toHaveTextContent(d.title.ar);
    expect(container).not.toHaveTextContent(d.title.en);
  }
  for (const img of container.querySelectorAll('img')) {
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toMatch(
      /\/images\/(products|designs|site)\//,
    );
  }
}
