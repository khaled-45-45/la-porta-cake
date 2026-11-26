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

// ------------------------------------------------- gallery and custom orders (Phase 6)

/** Checks shared by every page: returns a list of problems. */
function pageProblems(path, res, { locale, dir, h1 }, unpublished) {
  const problems = [];
  const tag = htmlTag(res.body);
  if (res.status !== 200) problems.push(`${path}: status ${res.status}`);
  if (!tag.includes(`lang="${locale}"`) || !tag.includes(`dir="${dir}"`))
    problems.push(`${path}: <html> is not lang="${locale}" dir="${dir}"`);
  if ((res.body.match(/<h1\b/g) ?? []).length !== 1) problems.push(`${path}: not one <h1>`);
  if (h1 && h1Text(res.body) !== h1) problems.push(`${path}: <h1> is "${h1Text(res.body)}"`);
  if (!res.body.includes('<main id="main"')) problems.push(`${path}: no <main id="main">`);
  if (res.headers.get('set-cookie') !== null) problems.push(`${path}: sets a cookie`);
  const missing = missingSecurityHeaders(res.headers);
  if (missing.length) problems.push(`${path}: missing ${missing.join(', ')}`);
  for (const problem of exposureProblems(res.body, unpublished))
    problems.push(`${path}: ${problem}`);
  return problems;
}

const report = (problems) =>
  problems.length ? `\n        ${problems.slice(0, 12).join('\n        ')}` : '';

/** The hidden fields React renders for a server-action form, as name/value pairs. */
function actionFields(html) {
  const unescape = (value) =>
    value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&');
  return [
    ...html.matchAll(/<input type="hidden" name="(\$ACTION[^"]*)"(?: value="([^"]*)")?\/>/g),
  ].map(([, name, value = '']) => [name, unescape(value)]);
}

/** Posts the custom-order form as a browser without JavaScript would. */
async function postOrder(path, fields, { origin = BASE, hidden } = {}) {
  const form = new FormData();
  for (const [name, value] of hidden) form.append(name, value);
  for (const [name, value] of fields) form.append(name, value);
  const headers = origin === null ? {} : { Origin: origin };
  const res = await fetch(BASE + path, { method: 'POST', body: form, headers, redirect: 'manual' });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

/** The prepared message in a response: the text of the ready panel's WhatsApp link. */
function preparedMessage(html) {
  const panel = html.split('id="order-ready-title"')[1] ?? '';
  const href = panel.match(/href="(https:\/\/wa\.me\/[^"]+)"/)?.[1];
  if (!href) return null;
  const url = new URL(href.replaceAll('&amp;', '&'));
  return { url, text: url.searchParams.get('text') };
}

async function checkGalleryAndCustomOrder() {
  console.log('Gallery and custom orders');
  const designs = content('designs.json');
  const published = designs.filter((d) => d.isPublished);
  const unpublished = designs.filter((d) => !d.isPublished);
  const [first] = published;

  for (const [locale, dir] of [
    ['ar', 'rtl'],
    ['en', 'ltr'],
  ]) {
    const m = messages[locale];
    const expect = { locale, dir };

    // Every page: the gallery, each published design, the custom-order form.
    const pages = [
      { path: '/our-work', h1: m.OurWork.title },
      ...published.map((d) => ({ path: `/our-work/${d.slug}`, h1: d.title[locale] })),
      { path: '/custom-order', h1: m.CustomOrder.title },
      { path: `/custom-order?design=${first.slug}`, h1: m.CustomOrder.title },
    ];
    const problems = [];
    for (const page of pages) {
      const path = `/${locale}${page.path}`;
      problems.push(
        ...pageProblems(path, await get(path), { ...expect, h1: page.h1 }, unpublished),
      );
    }
    check(
      problems.length === 0,
      `${pages.length} ${locale} gallery and order pages: 200, lang/dir, one <h1>, security headers, no private or unpublished data in HTML or RSC payload${report(problems)}`,
    );

    // The gallery lists every published design; each card links to its page and the form.
    const gallery = await get(`/${locale}/our-work`);
    const cards = [...gallery.body.matchAll(/data-design="([^"]+)"/g)].map((x) => x[1]);
    check(
      cards.length === published.length &&
        published.every(
          (d) =>
            gallery.body.includes(`href="/${locale}/our-work/${d.slug}"`) &&
            gallery.body.includes(`href="/${locale}/custom-order?design=${d.slug}"`),
        ),
      `/${locale}/our-work shows all ${published.length} published designs, each linking to its page and the order form (got ${cards.length})`,
    );

    // The form page: rendered per request, never cached; the design arrives as its slug.
    const chosen = await get(`/${locale}/custom-order?design=${first.slug}`);
    check(
      /no-store/.test(chosen.headers.get('cache-control') ?? ''),
      `/${locale}/custom-order is not cached (Cache-Control: ${chosen.headers.get('cache-control')})`,
    );
    check(
      chosen.body.includes(`name="design" value="${first.slug}"`) &&
        chosen.body.includes(first.title[locale]),
      `/${locale}/custom-order?design=${first.slug} shows the design and carries its slug`,
    );

    // Tampered references: the page opens without a design and reflects nothing.
    for (const query of [
      `design=${unpublished[0]?.slug ?? 'space-cake'}`,
      'design=no-such-design',
      `design=${first.slug}&design=${first.slug}`,
      `design=${first.slug.toUpperCase()}`,
      'design=..%2F..%2Fprivate-assets%2Freview',
      'design=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
      'design=https%3A%2F%2Fevil.example',
      'design[]=x',
    ]) {
      const path = `/${locale}/custom-order?${query}`;
      const res = await rawGet(path);
      // Next.js keeps the request URL, still percent-encoded, in its router state
      // ("c" and "q" in the RSC payload). That echo is removed first, so the scan still
      // catches any decoded or rendered reflection of the value.
      const body = res.body.toString('utf8').split(query).join('[query]');
      const issues = pageProblems(
        path,
        { status: res.status, headers: new Map(Object.entries(res.headers)), body },
        { ...expect, h1: m.CustomOrder.title },
        unpublished,
      ).filter((p) => !p.includes('sets a cookie'));
      if (body.includes('name="design"')) issues.push('carries a design');
      if (/<script>alert|evil\.example|private-assets/.test(body))
        issues.push('reflects the query');
      check(
        issues.length === 0,
        `${path} opens without a design and reflects nothing${report(issues)}`,
      );
    }

    // Unknown and unpublished designs answer "not found", with the security headers.
    for (const path of [
      `/${locale}/our-work/${unpublished[0]?.slug ?? 'space-cake'}`,
      `/${locale}/our-work/no-such-design`,
      `/${locale}/our-work/${first.slug.toUpperCase()}`,
      `/${locale}/our-work/${first.slug}/extra`,
      `/${locale}/our-work/..%2F..%2Fprivate-assets`,
    ]) {
      const res = await rawGet(path);
      const missing = missingSecurityHeaders(new Map(Object.entries(res.headers)));
      check(
        res.status === 404 && missing.length === 0,
        `${path} answers 404 with the security headers (got ${res.status})`,
      );
    }
  }

  // The form posts without JavaScript (a server action): valid, invalid and hostile posts.
  const path = `/ar/custom-order?design=${first.slug}`;
  const hidden = actionFields((await get(path)).body);
  check(hidden.length >= 2, `${path} renders a form that posts without JavaScript`);

  const valid = await postOrder(
    path,
    [
      ['design', first.slug],
      ['writing', 'كل عام وأنت بخير'],
    ],
    {
      hidden,
    },
  );
  const prepared = preparedMessage(valid.body);
  check(
    valid.status === 200 &&
      missingSecurityHeaders(valid.headers).length === 0 &&
      prepared?.url.origin === 'https://wa.me' &&
      prepared.url.pathname === '/962788890049' &&
      [...prepared.url.searchParams.keys()].join() === 'text' &&
      prepared.text.includes(first.title.ar) &&
      prepared.text.includes('كل عام وأنت بخير'),
    `a valid post returns the WhatsApp link to the verified number with the design and details (got ${valid.status})`,
  );
  // Only the result panel: the footer rightly says orders are confirmed over WhatsApp.
  const panel = valid.body.split('id="order-ready-title"')[1]?.split('</form>')[0] ?? '';
  check(
    panel.includes(messages.ar.CustomOrder.readyTitle) &&
      !/تم تأكيد|تم إرسال|تم الطلب|order (is|has been) (confirmed|placed|sent)/.test(panel),
    'the result says the message is ready but not sent, and confirms no order',
  );

  const invalid = await postOrder(
    path,
    [
      ['design', first.slug],
      ['writing', 'ك'.repeat(41)],
    ],
    {
      hidden,
    },
  );
  check(
    invalid.status === 200 &&
      invalid.body.includes('id="order-error-summary"') &&
      invalid.body.includes(`value="${'ك'.repeat(41)}"`) &&
      preparedMessage(invalid.body) === null,
    'an invalid post returns the errors and keeps the entered text, with no link',
  );

  const hiddenDesign = await postOrder(
    path,
    [
      ['design', unpublished[0]?.slug ?? 'space-cake'],
      ['description', 'كيكة'],
    ],
    { hidden },
  );
  const withoutDesign = preparedMessage(hiddenDesign.body);
  check(
    withoutDesign !== null &&
      !unpublished.some((d) => withoutDesign.text.includes(d.title.ar)) &&
      hiddenDesign.body.includes(messages.ar.CustomOrder.designUnavailable),
    'a post naming an unpublished design leaves it out of the message and says so',
  );

  const markup = await postOrder(
    path,
    [
      ['design', first.slug],
      ['notes', '<img src=x onerror=alert(1)>'],
      ['name', 'A&text=B#C'],
    ],
    { hidden },
  );
  const escaped = preparedMessage(markup.body);
  check(
    !markup.body.includes('<img src=x onerror') &&
      escaped !== null &&
      [...escaped.url.searchParams.keys()].join() === 'text' &&
      escaped.text.includes('<img src=x onerror=alert(1)>') &&
      escaped.text.includes('A&text=B#C'),
    'posted markup and link characters stay text: escaped on the page, encoded in the link',
  );

  const tamperedLocale = hidden.map(([name, value]) => [
    name,
    value.replace('["ar",', '["<script>",'),
  ]);
  const fallback = await postOrder(path, [['design', first.slug]], { hidden: tamperedLocale });
  check(
    fallback.status === 200 &&
      preparedMessage(fallback.body)?.text.startsWith('مرحبا لابورتا') === true &&
      !fallback.body.includes('<script>",'),
    'a tampered language argument falls back to Arabic',
  );

  for (const [label, options, fields] of [
    ['another site', { origin: 'https://evil.example', hidden }, [['design', first.slug]]],
    ['a body over 32 KB', { hidden }, [['notes', 'x'.repeat(40_000)]]],
  ]) {
    const res = await postOrder(path, fields, options);
    check(
      res.status !== 200 && preparedMessage(res.body) === null && !res.body.includes('wa.me'),
      `a post from ${label} is refused (got ${res.status})`,
    );
  }

  // Browsers always send Origin with a POST, so a post without one is not a cross-site
  // request from a page; Next.js answers it. It gets the same checks as any other post,
  // and the action stores and sends nothing, so there is nothing for it to abuse.
  const noOrigin = await postOrder(
    path,
    [
      ['design', first.slug],
      ['writing', 'ك'.repeat(41)],
    ],
    {
      origin: null,
      hidden,
    },
  );
  check(
    noOrigin.status === 200 &&
      noOrigin.body.includes('id="order-error-summary"') &&
      preparedMessage(noOrigin.body) === null,
    'a post without an Origin header (not a browser) gets the same validation',
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
  await checkGalleryAndCustomOrder();

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
