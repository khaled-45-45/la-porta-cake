# 0008. Local development first, Vercel-ready

- **Status:** Approved by the owner, 2026-11-24 (decision D4)
- **Supersedes:** none

## Decision

- Development runs locally.
- The project is prepared for Vercel deployment: the storefront builds as a standard Next.js app from `apps/storefront`, and configuration comes from environment variables documented in `.env.example`.
- No deployment, no domain purchase and no domain connection until the owner approves them before launch.

## Consequences

- **To verify before deployment:** that Vercel supports Node.js 26 at that time. If not, the owner decides between waiting and changing the pinned Node.js version (see 0002).
- Production domain and hosting details are decided before launch.
