# 0006. Photo and content policy

- **Status:** Approved by the owner, 2026-11-24 (decision D5 and image corrections 1–4)
- **Supersedes:** none

## Decision

- **Copyrighted characters** (for example Batman, Sonic): not published unless usage rights are confirmed.
- **Identifiable customers:** photos are published only with the customer's explicit consent.
- **Watermarks:** La Porta Cake's own watermark is acceptable. Third-party watermarked images are not used without authorisation.
- **AI-edited photos:** used only when they still represent the actual product accurately.
- **Missing product photos:** never replaced with invented photographs or with photos of other products. Products without a photo get an intentional, visually consistent placeholder.
- **Migration:** all accessible prototype assets are exported; any failure is reported. The 48 prototype assets and the 5 products without photos are tracked separately.

## Consequences

- Each image carries review flags in the content data; flagged images stay unpublished until the owner clears them.
- The review list is kept in `docs/content-gaps.md`.
