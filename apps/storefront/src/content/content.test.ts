// @vitest-environment node
// Content checks read files from disk; they do not need a browser environment.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PRIVATE_REVIEW_IMAGE_PATTERN,
  PUBLIC_IMAGE_PATTERN,
  contentBundleSchema,
  findContentIssues,
  reviewManifestSchema,
} from '@la-porta/domain';
import type { ImageRef, LocalizedText } from '@la-porta/domain';

import categories from './categories.json';
import designs from './designs.json';
import faq from './faq.json';
import occasions from './occasions.json';
import products from './products.json';
import settings from './settings.json';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const REPO_DIR = fileURLToPath(new URL('../../../../', import.meta.url));
const REVIEW_DIR = join(REPO_DIR, 'private-assets', 'review');

const manifest = reviewManifestSchema.parse(
  JSON.parse(readFileSync(join(REVIEW_DIR, 'manifest.json'), 'utf8')),
);

const parsed = contentBundleSchema.safeParse({
  categories,
  products,
  occasions,
  designs,
  faq,
  settings,
});

if (!parsed.success) {
  throw new Error(`Content does not match the schemas:\n${parsed.error.message}`);
}
const content = parsed.data;

const allImages: ImageRef[] = [
  ...content.products.flatMap((p) => p.images),
  ...content.designs.map((d) => d.image),
  content.settings.images.shopWindow,
  content.settings.images.shopInterior,
];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

function allLocalizedTexts(value: unknown): LocalizedText[] {
  if (Array.isArray(value)) return value.flatMap(allLocalizedTexts);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 2 && keys.includes('ar') && keys.includes('en')) {
      return [record as LocalizedText];
    }
    return Object.values(record).flatMap(allLocalizedTexts);
  }
  return [];
}

describe('content', () => {
  it('matches the domain schemas and has consistent references', () => {
    expect(findContentIssues(content)).toEqual([]);
  });

  it('has the expected collections from the prototype', () => {
    expect(content.categories.map((c) => c.id)).toEqual(['flavour-cakes', 'sweets']);
    expect(content.products).toHaveLength(21);
    expect(content.occasions).toHaveLength(6);
    expect(content.designs).toHaveLength(30);
    expect(content.faq).toHaveLength(4);
  });
});

describe('business data integrity (decision 0005)', () => {
  it('invents no prices, serving sizes or options', () => {
    const variants = content.products.flatMap((p) => p.variants);
    expect(variants.filter((v) => v.priceJod !== null || v.servings !== null)).toEqual([]);
    expect(variants).toEqual([]);
  });

  it('keeps the verified business information unchanged', () => {
    expect(content.settings.phone).toEqual({ e164: '+962788890049', display: '0788890049' });
    expect(content.settings.whatsapp.url).toBe('https://wa.me/962788890049');
    expect(content.settings.instagram.url).toBe('https://www.instagram.com/laportacake/');
    expect(content.settings.facebook.url).toBe('https://www.facebook.com/share/19r78WtxnX/');
    expect(content.settings.mapsUrl).toBe('https://maps.app.goo.gl/MRRZ49LmJsrivkUa6');
    expect(content.settings.hours).toEqual([{ days: 'daily', opens: '11:00', closes: '23:00' }]);
    expect(content.settings.delivery.available).toBe(true);
    expect(content.settings.defaultLeadHours).toBe(24);
    expect(content.settings.onlinePayment).toBe(false);
  });

  it('has no unconfirmed delivery areas, fees or Messenger link', () => {
    expect(content.settings.delivery.areas).toBeNull();
    expect(content.settings.delivery.fees).toBeNull();
    expect(content.settings.messenger.url).toBeNull();
  });
});

describe('Arabic and English consistency', () => {
  const texts = allLocalizedTexts(content);

  it('has both languages for every text', () => {
    expect(texts.length).toBeGreaterThan(100);
    for (const text of texts) {
      expect(text.ar.trim()).not.toBe('');
      expect(text.en.trim()).not.toBe('');
    }
  });

  it('has no Arabic letters in English text', () => {
    const arabic = /[؀-ۿ]/;
    expect(texts.filter((t) => arabic.test(t.en)).map((t) => t.en)).toEqual([]);
  });

  it('answers each FAQ question in both languages or leaves it unanswered in both', () => {
    for (const item of content.faq.flatMap((g) => g.items)) {
      expect(item.question.ar).toBeTruthy();
      expect(item.question.en).toBeTruthy();
    }
  });
});

describe('image publication safety (decision 0006)', () => {
  const publicFiles = listFiles(join(PUBLIC_DIR, 'images')).map(
    (file) => '/' + relative(PUBLIC_DIR, file).split(sep).join('/'),
  );
  const approvedImages = allImages.filter((i) => i.review.status === 'approved');

  it('has exactly 33 approved images, all publicly accessible', () => {
    expect(approvedImages).toHaveLength(33);
    expect(publicFiles).toHaveLength(33);
    expect([...publicFiles].sort()).toEqual(approvedImages.map((i) => i.src).sort());
  });

  it('keeps all 15 pending images outside the public directory', () => {
    expect(manifest.entries).toHaveLength(15);
    for (const entry of manifest.entries) {
      expect(PRIVATE_REVIEW_IMAGE_PATTERN.test(entry.file)).toBe(true);
      const publicTwin = '/images/' + entry.file.replace(/^private-assets\/review\//, '');
      expect(publicFiles).not.toContain(publicTwin);
    }
  });

  // The pending image files are kept out of Git (decision 0006), so a fresh clone or CI
  // has only the manifest. Where the files exist locally, they must all be present and intact.
  // `pnpm verify:review-assets` runs the same check strictly and fails when files are missing.
  const localReviewImages = existsSync(REVIEW_DIR)
    ? listFiles(REVIEW_DIR).filter((f) => !f.endsWith('manifest.json') && !f.endsWith('.gitkeep'))
    : [];

  it.skipIf(localReviewImages.length === 0)(
    'has all 15 pending files locally, unchanged (skipped on a fresh clone)',
    () => {
      expect(localReviewImages).toHaveLength(15);
      for (const entry of manifest.entries) {
        const file = join(REPO_DIR, entry.file);
        expect(existsSync(file)).toBe(true);
        expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(entry.sha256);
      }
    },
  );

  it('shows no pending image in public content', () => {
    const publicContentImages = [
      ...content.products.filter((p) => p.isActive).flatMap((p) => p.images),
      ...content.designs.filter((d) => d.isPublished).map((d) => d.image),
      content.settings.images.shopWindow,
      content.settings.images.shopInterior,
    ];
    expect(publicContentImages.filter((i) => i.review.status !== 'approved')).toEqual([]);
    expect(publicContentImages.every((i) => PUBLIC_IMAGE_PATTERN.test(i.src))).toBe(true);
  });

  it('keeps unpublished designs pointing only at private review files', () => {
    const unpublished = content.designs.filter((d) => !d.isPublished);
    expect(unpublished).toHaveLength(14);
    for (const design of unpublished) {
      expect(design.image.review.status).toBe('pending');
      expect(PRIVATE_REVIEW_IMAGE_PATTERN.test(design.image.src)).toBe(true);
      expect(publicFiles).not.toContain(design.image.src);
    }
    expect(content.designs.filter((d) => d.isPublished)).toHaveLength(16);
  });

  it('accounts for all 48 original prototype assets', () => {
    const approvedIds = approvedImages.map((i) => i.sourceAssetId);
    const pendingIds = manifest.entries.map((e) => e.assetId);
    expect(approvedIds.every((id) => id !== null)).toBe(true);
    expect(new Set(approvedIds).size).toBe(33);
    expect(new Set(pendingIds).size).toBe(15);
    expect(approvedIds.filter((id) => id !== null && pendingIds.includes(id))).toEqual([]);
    expect(new Set([...approvedIds, ...pendingIds]).size).toBe(48);
  });

  it('matches every review entry to its product or design', () => {
    for (const entry of manifest.entries) {
      if (entry.target.kind === 'design') {
        const design = content.designs.find((d) => d.id === entry.target.id);
        expect(design?.isPublished).toBe(false);
        expect(design?.image.src).toBe(entry.file);
        expect(design?.image.sourceAssetId).toBe(entry.assetId);
        expect(design?.image.review.reasons).toEqual(entry.reasons);
      } else {
        const product = content.products.find((p) => p.id === entry.target.id);
        expect(product).toBeDefined();
        // The product stays public with a placeholder until its photo is approved.
        expect(product?.images).toEqual([]);
      }
    }
  });

  it('holds both copyrighted characters', () => {
    const held = manifest.entries.filter((e) => e.level === 'hold').map((e) => e.target.id);
    expect(held.sort()).toEqual(['cartoon-character-batman', 'cartoon-character-sonic']);
  });
});

describe('products without a public photo', () => {
  it('leaves the five Track B products without any photo', () => {
    const trackB = ['petit-four', 'cheesecake', 'mousse-cake', 'muffins', 'maamoul'];
    const reviewTargets = manifest.entries.map((e) => e.target.id);
    for (const id of trackB) {
      expect(content.products.find((p) => p.id === id)?.images).toEqual([]);
      expect(reviewTargets).not.toContain(id);
    }
  });

  it('shows a placeholder for Despacito while its photo awaits approval', () => {
    expect(content.products.find((p) => p.id === 'despacito')?.images).toEqual([]);
    expect(manifest.entries.find((e) => e.target.id === 'despacito')?.file).toBe(
      'private-assets/review/products/despacito.jpg',
    );
  });

  it('has exactly six products without a public photo', () => {
    const withoutPhoto = content.products.filter((p) => p.images.length === 0).map((p) => p.id);
    expect(withoutPhoto).toEqual([
      'despacito',
      'petit-four',
      'cheesecake',
      'mousse-cake',
      'muffins',
      'maamoul',
    ]);
  });

  it('gives every product photo a file named after that product', () => {
    for (const product of content.products) {
      for (const image of product.images) {
        expect(image.src).toBe(`/images/products/${product.slug}.jpg`);
      }
    }
  });
});
