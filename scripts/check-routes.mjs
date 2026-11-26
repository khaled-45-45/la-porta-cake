// Checks the routing rules of the production build (decision 0012) against a real server.
// Run after `pnpm build`: `pnpm test:routes`. It starts `next start`, requests each route,
// checks status codes, redirects, <html lang/dir>, localized "not found" pages and the
// language switcher links, then stops the server. Exits with code 1 on any failure.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { request } from 'node:http';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const app = join(root, 'apps/storefront');
const PORT = 3107;
const BASE = `http://127.0.0.1:${PORT}`;

const messages = {
  ar: JSON.parse(readFileSync(join(app, 'messages/ar.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(app, 'messages/en.json'), 'utf8')),
};

const failures = [];
let passed = 0;

function check(ok, label) {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL  ${label}`);
  }
}

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

/** A GET sent exactly as written (no URL tidying), returning the raw body bytes. */
function rawGet(path) {
  return new Promise((resolvePromise, reject) => {
    const req = request({ host: '127.0.0.1', port: PORT, path, method: 'GET' }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolvePromise({
          status: res.statusCode ?? 0,
          contentType: String(res.headers['content-type'] ?? ''),
          headers: res.headers,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}

function htmlTag(body) {
  return body.match(/<html\b[^>]*>/i)?.[0] ?? '';
}

function noCookie(res, path) {
  check(res.headers.get('set-cookie') === null, `${path} sets no cookie`);
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

async function waitForServer(server) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('next start exited early');
    try {
      await fetch(`${BASE}/ar`, { redirect: 'manual' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not answer on port ${PORT} within 60 s`);
}

function stop(server) {
  if (server.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
}

// ---------------------------------------------------------------- storefront pages (Phase 5)

const content = (file) => JSON.parse(readFileSync(join(app, 'src/content', file), 'utf8'));
// Facet fields the shop and gallery filters may receive (docs/components.md).
const ALLOWED_FACET_KEYS = new Set([
  'id',
  'categoryId',
  'availability',
  'searchText',
  'decoration',
  'occasionIds',
  'isMini',
]);
// Internal field names and private markers that must never reach a page.
const FORBIDDEN_IN_PAGES = [
  'private-assets',
  'review/',
  'isPublished',
  'isActive',
  'sourceAssetId',
  'prepLeadHours',
  'defaultLeadHours',
  'onlinePayment',
  '"pending"',
  '"reasons"',
];

/** The React Server Components payload embedded in a page (self.__next_f), decoded. */
function flightPayload(html) {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)]
    .map((m) => JSON.parse(`"${m[1]}"`))
    .join('');
}

/** Everything a page exposes that it should not: returns a list of problems. */
function exposureProblems(html, unpublished) {
  const problems = [];
  const payload = flightPayload(html);
  if (payload.length === 0) problems.push('no RSC payload found to inspect');
  for (const marker of FORBIDDEN_IN_PAGES) {
    if (html.includes(marker) || payload.includes(marker)) problems.push(`contains ${marker}`);
  }
  for (const design of unpublished) {
    for (const text of [
      `/our-work/${design.slug}`,
      `"${design.slug}"`,
      design.title.ar,
      design.title.en,
    ]) {
      if (html.includes(text) || payload.includes(text))
        problems.push(`unpublished design ${design.slug}`);
    }
  }
  for (const match of payload.matchAll(/"facets":\{([^{}]*)\}/g)) {
    for (const key of match[1].matchAll(/"([A-Za-z]+)":/g)) {
      if (!ALLOWED_FACET_KEYS.has(key[1])) problems.push(`facet field ${key[1]}`);
    }
  }
  // Every image URL a browser could fetch: src, srcset/imageSrcSet candidates (images and
  // their preload hints).
  const urls = [
    ...[...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\s(?:srcset|srcSet|imageSrcSet|imagesrcset)="([^"]+)"/g)].flatMap((m) =>
      m[1].split(',').map((candidate) => candidate.trim().split(/\s+/)[0]),
    ),
  ];
  for (const url of urls) {
    const decoded = decodeURIComponent(url.replaceAll('&amp;', '&'));
    if (!/(^|url=)\/images\/(products|designs|site)\//.test(decoded))
      problems.push(`image ${decoded}`);
  }
  return [...new Set(problems)];
}

/** Security headers from next.config.ts that every page must carry; returns what is missing. */
const SECURITY_HEADERS = {
  'content-security-policy': "frame-ancestors 'none'",
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=()',
};
function missingSecurityHeaders(headers) {
  return Object.entries(SECURITY_HEADERS)
    .filter(([name, expected]) => !(headers.get(name) ?? '').includes(expected))
    .map(([name]) => name);
}

const h1Text = (html) =>
  (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '').replace(/<[^>]+>/g, '').trim();

async function checkStorefrontPages() {
  console.log('Storefront pages');
  const categories = content('categories.json');
  const products = content('products.json').filter((p) => p.isActive);
  const unpublished = content('designs.json').filter((d) => !d.isPublished);

  // Self-test: the scan must catch leaks planted in a fake page, or its "ok" means nothing.
  const planted = [
    '<img src="/_next/image?url=%2Fprivate-assets%2Freview%2Fdesigns%2Fx.jpg&amp;w=640">',
    '<img src="/images/products/ok.jpg" srcSet="/images/products/ok.jpg 1x, /_next/image?url=%2Fsecret%2Fy.jpg&amp;w=640 2x">',
    `<script>self.__next_f.push([1,${JSON.stringify(
      JSON.stringify({ facets: { id: 'x', isActive: true }, slug: unpublished[0]?.slug ?? 'x' }),
    )}])</script>`,
  ].join('');
  const caught = exposureProblems(planted, unpublished).join(' | ');
  check(
    [
      'private-assets',
      'isActive',
      'facet field isActive',
      'unpublished design',
      'image ',
      'image /_next/image?url=/secret/y.jpg',
    ].every((needle) => caught.includes(needle)),
    `exposure scan catches planted leaks (self-test): ${caught}`,
  );

  for (const [locale, dir] of [
    ['ar', 'rtl'],
    ['en', 'ltr'],
  ]) {
    const pages = [
      { path: '', h1: messages[locale].Home.heroTitle },
      { path: '/shop', h1: messages[locale].Shop.title },
      ...categories.map((c) => ({ path: `/shop/${c.slug}`, h1: c.name[locale] })),
      ...products.map((p) => ({ path: `/products/${p.slug}`, h1: p.name[locale] })),
    ];
    const issues = [];
    for (const page of pages) {
      const path = `/${locale}${page.path}`;
      const res = await get(path);
      const tag = htmlTag(res.body);
      if (res.status !== 200) issues.push(`${path}: status ${res.status}`);
      if (!tag.includes(`lang="${locale}"`) || !tag.includes(`dir="${dir}"`)) {
        issues.push(`${path}: <html> is not lang="${locale}" dir="${dir}"`);
      }
      if ((res.body.match(/<h1\b/g) ?? []).length !== 1)
        issues.push(`${path}: not exactly one <h1>`);
      if (h1Text(res.body) !== page.h1) issues.push(`${path}: <h1> is "${h1Text(res.body)}"`);
      if (!res.body.includes('<main id="main"')) issues.push(`${path}: no <main id="main">`);
      if (res.headers.get('set-cookie') !== null) issues.push(`${path}: sets a cookie`);
      const missing = missingSecurityHeaders(res.headers);
      if (missing.length) issues.push(`${path}: missing ${missing.join(', ')}`);
      for (const problem of exposureProblems(res.body, unpublished))
        issues.push(`${path}: ${problem}`);
    }
    check(
      issues.length === 0,
      `${pages.length} ${locale} storefront pages: 200, lang/dir, one <h1>, security headers, no private or unpublished data in HTML or RSC payload` +
        (issues.length ? `\n        ${issues.slice(0, 12).join('\n        ')}` : ''),
    );

    // The product page's WhatsApp link carries the localized, encoded product name.
    const kitkat = products.find((p) => p.slug === 'kitkat-cake');
    if (kitkat) {
      const page = await get(`/${locale}/products/kitkat-cake`);
      const text = messages[locale].Product.whatsappMessage.replace('{name}', kitkat.name[locale]);
      const expected = `https://wa.me/962788890049?text=${encodeURIComponent(text)}`;
      check(
        page.body.includes(`href="${expected}"`),
        `/${locale}/products/kitkat-cake orders on WhatsApp with its name`,
      );
    }

    // Unknown categories and products, and unpublished design slugs, answer "not found".
    const title = messages[locale].NotFound.title;
    for (const path of [
      `/${locale}/shop/no-such-category`,
      `/${locale}/products/no-such-product`,
      `/${locale}/products/${unpublished[0]?.slug ?? 'space-cake'}`,
      `/${locale}/shop/${products[0]?.slug ?? 'kitkat-cake'}`,
    ]) {
      const res = await get(path);
      check(
        res.status === 404 && res.body.includes(title),
        `${path} answers 404 with "${title}" (got ${res.status})`,
      );
    }

    // Malformed and unexpected paths, sent exactly as written: no lookup bypass, no
    // reflected markup, and the security headers on the 404 page too.
    for (const path of [
      `/${locale}/products`,
      `/${locale}/products/KITKAT-CAKE`,
      `/${locale}/products/kitkat-cake/extra`,
      `/${locale}/shop/flavour-cakes/extra`,
      `/${locale}/products/kitkat-cake%2F..%2F..%2Fprivate-assets`,
      `/${locale}/products/..%2F..%2Fprivate-assets%2Freview%2Fproducts%2Fdespacito.jpg`,
      `/${locale}/shop/%3Cscript%3Ealert(1)%3C%2Fscript%3E`,
      `/${locale}/products/%00`,
    ]) {
      const res = await rawGet(path);
      const body = res.body.toString('utf8');
      const missing = missingSecurityHeaders(new Map(Object.entries(res.headers)));
      check(
        res.status === 404 && !body.includes('<script>alert(1)') && missing.length === 0,
        `${path} answers 404, reflects no markup, has security headers (got ${res.status}${missing.length ? `, missing ${missing.join(', ')}` : ''})`,
      );
    }
  }

  // The locale redirect and its target are covered too.
  const home = await rawGet('/');
  const missing = missingSecurityHeaders(new Map(Object.entries(home.headers)));
  check(
    home.status === 307 && missing.length === 0,
    `/ redirect carries the security headers${missing.length ? ` (missing ${missing.join(', ')})` : ''}`,
  );
}

async function run() {
  console.log('Static output');
  const staticDir = join(app, '.next/static');
  if (!existsSync(staticDir)) {
    throw new Error('No production build found. Run `pnpm build` first.');
  }
  const bundles = listFiles(staticDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: f, text: readFileSync(f, 'utf8') }));
  const containing = (needle) =>
    bundles.filter((b) => b.text.includes(needle)).map((b) => b.file.slice(staticDir.length + 1));

  check(containing('DATA_SOURCE').length === 0, 'browser bundles do not mention DATA_SOURCE');

  // The content schemas validate data on the server. In the browser they would only add
  // weight (zod) and describe where private review images are kept.
  const schemaLeaks = [...containing('ZodError'), ...containing('private-assets')];
  check(
    schemaLeaks.length === 0,
    `browser bundles contain no zod or content schemas${schemaLeaks.length ? ` (${[...new Set(schemaLeaks)].join(', ')})` : ''}`,
  );

  console.log('Routes');

  const home = await get('/');
  check(home.status === 307, `/ answers 307 (got ${home.status})`);
  check(home.headers.get('location')?.endsWith('/ar') === true, `/ redirects to /ar`);
  noCookie(home, '/');

  for (const [locale, dir, other] of [
    ['ar', 'rtl', 'en'],
    ['en', 'ltr', 'ar'],
  ]) {
    const res = await get(`/${locale}`);
    const tag = htmlTag(res.body);
    check(res.status === 200, `/${locale} answers 200 (got ${res.status})`);
    check(tag.includes(`lang="${locale}"`), `/${locale} has <html lang="${locale}">`);
    check(tag.includes(`dir="${dir}"`), `/${locale} has <html dir="${dir}">`);
    check(res.body.includes(`href="/${other}"`), `/${locale} links to /${other} in the switcher`);
    noCookie(res, `/${locale}`);

    // Site shell (Phase 4): header navigation and the footer's verified contact links.
    const nav = messages[locale].Nav;
    check(
      res.body.includes(`href="/${locale}/shop"`) && res.body.includes(`>${nav.shop}</a>`),
      `/${locale} has the header navigation`,
    );
    check(
      ['https://wa.me/962788890049', 'https://maps.app.goo.gl/MRRZ49LmJsrivkUa6'].every((url) =>
        res.body.includes(url),
      ),
      `/${locale} has the footer's WhatsApp and map links`,
    );

    const missing = await get(`/${locale}/missing`);
    const title = messages[locale].NotFound.title;
    check(missing.status === 404, `/${locale}/missing answers 404 (got ${missing.status})`);
    check(missing.body.includes(title), `/${locale}/missing shows "${title}"`);
    // Next.js 16 answers notFound() with a minimal HTML shell and renders the page in the
    // browser, so <html lang/dir> is only set after JavaScript runs (decision 0012).
    // The status and the localized text are what the server guarantees.
    noCookie(missing, `/${locale}/missing`);
  }

  const fr = await get('/fr');
  check(fr.status === 307, `/fr answers 307 (got ${fr.status})`);
  check(fr.headers.get('location')?.endsWith('/ar/fr') === true, '/fr redirects to /ar/fr');
  const arFr = await get('/ar/fr');
  check(arFr.status === 404, `/ar/fr answers 404 (got ${arFr.status})`);

  await checkStorefrontPages();

  // Product and design cards use next/image: approved photos are optimized, while private
  // review files are never served, through the optimizer or directly.
  const optimized = await get('/_next/image?url=%2Fimages%2Fproducts%2Fkitkat-cake.jpg&w=640&q=75');
  check(
    optimized.status === 200 &&
      optimized.headers.get('content-type')?.startsWith('image/') === true,
    `the image optimizer serves an approved photo (got ${optimized.status})`,
  );
  // Private review files and attempts to reach them through the optimizer or the static
  // file server: path traversal (plain and encoded), relative and absolute paths, Windows
  // backslashes, remote URLs. Each must be refused (4xx, or a 5xx from the optimizer for
  // backslashes, where Next.js redirects its own internal request) and must never return
  // image bytes. When the private files exist locally, the responses are also compared
  // with them byte for byte. Requests are sent raw, so "../" is not tidied away first.
  const privateFiles = [
    'private-assets/review/products/despacito.jpg',
    'private-assets/review/designs/space-cake.jpg',
  ]
    .map((file) => join(root, file))
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file));
  const opt = (url) => `/_next/image?url=${url}&w=640&q=75`;
  for (const path of [
    opt('%2Fprivate-assets%2Freview%2Fproducts%2Fdespacito.jpg'),
    opt('%2Fimages%2F..%2F..%2F..%2F..%2Fprivate-assets%2Freview%2Fproducts%2Fdespacito.jpg'),
    opt(
      '%2Fimages%2F%2E%2E%2F%2E%2E%2F%2E%2E%2F%2E%2E%2Fprivate-assets%2Freview%2Fdesigns%2Fspace-cake.jpg',
    ),
    opt('..%2F..%2Fprivate-assets%2Freview%2Fdesigns%2Fspace-cake.jpg'),
    opt('%2F..%5C..%5Cprivate-assets%5Creview%5Cdesigns%5Cspace-cake.jpg'),
    opt('%2Fimages%5C..%5C..%5C..%5C..%5Cprivate-assets%5Creview%5Cdesigns%5Cspace-cake.jpg'),
    opt(encodeURIComponent(join(root, 'private-assets/review/designs/space-cake.jpg'))),
    opt('%2F%2Fexample.com%2Fa.jpg'),
    opt('https%3A%2F%2Fexample.com%2Fa.jpg'),
    '/private-assets/review/products/despacito.jpg',
    '/private-assets/review/manifest.json',
    '/images/../private-assets/review/designs/space-cake.jpg',
    '/images/%2e%2e/%2e%2e/private-assets/review/designs/space-cake.jpg',
    '/images/..%2f..%2fprivate-assets%2freview%2fdesigns%2fspace-cake.jpg',
  ]) {
    const res = await rawGet(path);
    const leaked = privateFiles.some((file) => res.body.length > 0 && res.body.equals(file));
    check(
      res.status >= 400 && !res.contentType.startsWith('image/') && !leaked,
      `refused, no private bytes: ${path} (got ${res.status} ${res.contentType || '-'})`,
    );
  }
  console.log(
    `  info  byte comparison with ${privateFiles.length} private file(s) present locally` +
      (privateFiles.length === 0 ? ' (fresh clone: status and type checks only)' : ''),
  );

  for (const path of ['/ar/design-system', '/en/design-system/composites']) {
    const preview = await get(path);
    check(preview.status === 404, `${path} answers 404 in production (got ${preview.status})`);
  }
}

const server = spawn(
  process.execPath,
  [join(app, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT)],
  {
    cwd: app,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  },
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

try {
  await waitForServer(server);
  await run();
} catch (error) {
  failures.push(error.message);
  console.error(`\n${error.message}\n${serverLog}`);
} finally {
  stop(server);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
