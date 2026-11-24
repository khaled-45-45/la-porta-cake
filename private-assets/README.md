# Private assets

Files here are **not** served by the website. Nothing under this folder may be referenced from `apps/storefront/public/` or from any published content.

## review/

Images awaiting the owner's approval under the photo policy ([decision 0006](../docs/decisions/0006-photo-and-content-policy.md)).

- **The image files are not in Git.** `.gitignore` excludes everything in `review/` except `manifest.json`. The files exist only on the machine that holds them; keep a backup there. A fresh clone has the manifest but no images.
- `manifest.json` lists each image: its prototype asset id, local file path, SHA-256 checksum, size, alt text in both languages, the product or design it belongs to (`target`), its level and the reasons for review. It contains no customer names or contact details.
  - `review`: publishable once the owner confirms the listed points.
  - `hold`: not published unless usage rights or consent are confirmed.
- `pnpm verify:review-assets` checks that all listed files are present, unchanged (by checksum) and not in the public folder.
- See also [docs/content-gaps.md](../docs/content-gaps.md), section 3.

## Approving an image

1. Move the file to `apps/storefront/public/images/<same folder>/<same name>`. From then on it is public and tracked in Git.
2. In the content record named in `target`, set the image `src` to the public path and `review` to `{ "status": "approved", "reasons": [] }`. For a design, also set `isPublished` to `true`; for a product, add the image to `images`.
3. Remove the entry from `manifest.json`.
4. Run `pnpm check`. The content tests verify that the public folder, the content and this manifest still agree.
