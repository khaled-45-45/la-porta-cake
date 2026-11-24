# 0002. Node.js 26, pnpm workspaces, no Turborepo in V1

- **Status:** Approved by the owner, 2026-11-24 (decisions D2 and D3)
- **Supersedes:** none

## Context

Node.js 26 is installed on the development machine. Corepack is not available with this Node.js release, so pnpm cannot be enabled through it.

## Decision

- **Node.js:** major version 26, pinned in `.nvmrc` (`26`) and in `package.json` `engines` (`>=26.0.0 <27.0.0`).
- **pnpm:** installed globally with npm (`npm install -g pnpm@12.23.0`), authorised by the owner. The version is recorded in `package.json` `packageManager` and `engines` (`>=12.23.0 <13.0.0`).
- **Engine enforcement:** `pnpm-workspace.yaml` sets `engineStrict: true`, so pnpm refuses to install on a wrong Node.js or pnpm version. (pnpm 12 does not read this setting from `.npmrc`; `.npmrc` keeps `engine-strict=true` only for accidental npm use.)
- **Lockfile:** pnpm records its own pinned version in `pnpm-lock.yaml` (`packageManagerDependencies`); the file is committed.
- **Task running:** plain pnpm workspace scripts (`pnpm -r`, `pnpm --filter`). Turborepo is not included in V1.

## Consequences

- Every contributor and CI job must use Node.js 26 and pnpm 12.
- Turborepo is re-evaluated when the admin and API applications are added in V2.
- **To verify before deployment:** that the hosting platform supports Node.js 26 at that time (see 0008).
