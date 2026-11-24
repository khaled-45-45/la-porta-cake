# 0010. Pending images stay outside the public folder and outside Git

- **Status:** Approved by the owner, 2026-11-24 (Phase 2 image publication safety, option B)
- **Supersedes:** none. Extends 0006.

## Context

Decision 0006 keeps images that need review unpublished. During Phase 2 all 48 prototype images were first placed in the storefront's public folder, which the website serves directly, so an image awaiting approval could be reached by its URL even when no page linked to it.

## Decision

- Only approved images are stored in `apps/storefront/public/images/`.
- Images awaiting approval are stored in `private-assets/review/`, which the website does not serve.
- The image files in `private-assets/review/` are excluded from Git. Only `private-assets/README.md` and `private-assets/review/manifest.json` are tracked.
- The manifest records, for each pending image: prototype asset id, local path, SHA-256 checksum, size, alt text in both languages, the product or design it belongs to, review level (`review` or `hold`) and the reasons. It contains no customer names or contact details.
- An active product never uses a pending image; it shows the placeholder until the image is approved. An unpublished design may refer to its private file.
- The schemas enforce the folders: approved images must be public, pending images must be private.

## Consequences

- A fresh clone or CI has the manifest but not the pending files. Content tests that need the files run only where the files exist; `pnpm verify:review-assets` performs the strict check on the machine that holds them.
- The pending files must be backed up outside Git by the owner.
- Approving an image means moving it into the public folder (where it becomes tracked) and updating its content record, as described in `private-assets/README.md`.
