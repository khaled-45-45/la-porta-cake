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
