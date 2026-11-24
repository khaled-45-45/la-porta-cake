# 0001. V1 architecture and technology stack

- **Status:** Approved by the owner, 2026-11-24
- **Supersedes:** none

## Context

The only existing implementation is a design prototype on the Claude Design canvas: 42 artboards in a canvas-specific format plus 48 image assets. It cannot be deployed and has no data layer. The long-term plan is a public storefront, a separate admin application and a shared Node.js + TypeScript API with PostgreSQL.

## Decision

- **Storefront:** Next.js (App Router), React, TypeScript in strict mode, Tailwind CSS.
- **Repository layout:** pnpm workspace monorepo.
  - `apps/storefront`: the public website.
  - `packages/domain`: zod schemas (types are inferred from them), repository interfaces and pure functions such as the order message builder. No React and no file access.
  - `packages/config`: shared TypeScript, ESLint and Prettier configuration.
- **Not in V1:** `apps/admin` and `apps/api`. They are added in V2 and reuse `packages/domain`.
- **Localization:** Arabic and English with `next-intl`.
- The prototype's design, content, images and ordering experience are preserved and ported, not exported.

## Consequences

- V1 ships a static, data-driven storefront that can switch to an API in V2 without changing components.
- The canvas runtime and `.dc.html` logic are rewritten as React components.
- Exact package versions are chosen at scaffold time (Phase 1) and locked in `pnpm-lock.yaml`.
