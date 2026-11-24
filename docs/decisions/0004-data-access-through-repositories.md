# 0004. Data access through repositories with structured local data

- **Status:** Approved by the owner, 2026-11-24
- **Supersedes:** none

## Decision

- Products, categories, gallery designs, occasions, FAQ and store settings are stored as structured JSON in the storefront, validated against the zod schemas in `packages/domain`.
- Pages read data only through repository interfaces (`CatalogRepository`, `DesignRepository`, `SiteRepository`). Components never import data files.
- V1 implements mock repositories over the local JSON. All methods are asynchronous.
- A factory selects the implementation from `DATA_SOURCE` (`mock` in V1, `api` in V2).
- Repositories run on the server only.

## Consequences

- V2 adds API repositories that map API responses to the same domain types; components do not change.
- The PostgreSQL database in V2 can be seeded from the V1 JSON files.
