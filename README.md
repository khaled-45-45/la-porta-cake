# La Porta Cake

Website for La Porta Cake, a cake shop in Al-Tatweer Al-Hadari, Russeifa, Zarqa, Jordan.

**Status:** Phase 1 (scaffold). The workspace, shared config, domain package and an empty Next.js storefront are in place. Pages and content arrive in later phases.

## Workspace

| Package | Path | Purpose |
|---|---|---|
| `@la-porta/storefront` | `apps/storefront` | Next.js public website |
| `@la-porta/domain` | `packages/domain` | Schemas, types and pure business functions |
| `@la-porta/config` | `packages/config` | Shared TypeScript, ESLint and Prettier settings |

## Commands

```sh
pnpm install          # install dependencies
pnpm dev              # run the storefront at http://localhost:3000
pnpm format:check     # formatting
pnpm lint             # ESLint, including the RTL-safe class rule
pnpm typecheck        # TypeScript (strict)
pnpm test             # Vitest
pnpm build            # production build
pnpm check            # all of the above in order
```

## Requirements

- Node.js 26 (see `.nvmrc`)
- pnpm 12 (see `packageManager` in `package.json`)

Installs are refused when Node.js or pnpm do not match `engines` (`engineStrict: true` in `pnpm-workspace.yaml`).

## Documentation

- [V1 implementation blueprint](docs/v1-blueprint.md)
- [Architectural decision records](docs/decisions/README.md)
- [Content gaps and image review](docs/content-gaps.md)

## Design reference

The approved design is the La Porta Cake prototype on the Claude Design canvas. The prototype itself is not part of this repository.
