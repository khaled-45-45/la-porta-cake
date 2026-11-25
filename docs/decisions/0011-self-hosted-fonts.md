# 0011. Self-hosted fonts

- **Status:** Approved by the owner, 2026-11-25 (Phase 3 scope, decision 1)
- **Supersedes:** none

## Context

The design uses three Google Fonts: Reem Kufi (Arabic headings), IBM Plex Sans Arabic (body text in both languages) and Marcellus (English headings). Loading them from Google Fonts at build time needs internet access for every build, and the development connection has been very slow. It would also break the offline clean-copy check used to verify each phase.

## Decision

- The font files are stored in the repository under `apps/storefront/src/fonts/` and loaded with `next/font/local`.
- Source: the official Google Fonts repository (`github.com/google/fonts`, folder `ofl/`), unmodified.
- Each font's SIL Open Font License 1.1 text is stored next to its files.
- Files: Reem Kufi (variable, weights 400–700), IBM Plex Sans Arabic (Regular, Medium, SemiBold), Marcellus (Regular).

## Consequences

- Builds are reproducible offline and do not contact Google at build time or at runtime.
- Font updates are manual: replace the files and record the source.
- The files are TrueType as published; `next/font` serves them with long-term caching.
