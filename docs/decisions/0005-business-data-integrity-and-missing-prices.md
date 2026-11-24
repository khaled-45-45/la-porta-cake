# 0005. No invented business data; "Price on request"

- **Status:** Approved by the owner, 2026-11-24 (decision D7 and corrections 5 and 6)
- **Supersedes:** none

## Decision

- Prices, serving sizes, product options, preparation times, delivery areas and fees, and policies are **never invented or estimated**. Unknown values are stored as `null`.
- A product without a confirmed price shows:
  - Arabic: **السعر عند الطلب**
  - English: **Price on request**
- Structured data for search engines omits the price while it is `null`.
- All verified business information from the prototype is preserved exactly. Anything unconfirmed is listed in `docs/content-gaps.md`.
- Arabic and English content must stay consistent: every text field exists in both languages with the same meaning.

## Consequences

- Content tests fail when a price, serving size or option has a value without a recorded source, or when a text field is missing in either language.
- Product pages remain correct before the owner supplies prices.
