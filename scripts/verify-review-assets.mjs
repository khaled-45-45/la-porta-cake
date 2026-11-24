// Strict local check of the images awaiting approval (decision 0006).
// The files are kept out of Git, so this check is run on the machine that holds them:
//   pnpm verify:review-assets
// It fails when any file listed in the manifest is missing, changed, or present in the public folder.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(
  readFileSync(join(root, 'private-assets/review/manifest.json'), 'utf8'),
);

const problems = [];
for (const entry of manifest.entries) {
  const file = join(root, entry.file);
  if (!existsSync(file)) {
    problems.push(`Missing: ${entry.file} (asset ${entry.assetId})`);
    continue;
  }
  const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (sha256 !== entry.sha256) problems.push(`Changed: ${entry.file}`);
  const publicTwin = join(
    root,
    'apps/storefront/public/images',
    entry.file.replace(/^private-assets\/review\//, ''),
  );
  if (existsSync(publicTwin)) problems.push(`Pending image is in the public folder: ${publicTwin}`);
}

if (problems.length > 0) {
  console.error(`Review assets: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Review assets: all ${manifest.entries.length} pending images present, unchanged and private.`,
);
