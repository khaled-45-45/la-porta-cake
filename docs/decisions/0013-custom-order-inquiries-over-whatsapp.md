# 0013. Custom-order inquiries prepared on the server, sent by the customer over WhatsApp

- **Status:** Proposed in Phase 6, 2026-11-26. Awaiting the owner's review.
- **Supersedes:** none. Builds on 0004, 0005 and 0006.

## Decision

- The custom-order page (`/[locale]/custom-order`) is an inquiry form, not an order system. The site stores nothing, sends nothing and confirms nothing. It prepares a WhatsApp message to the verified store number; the customer reads it, opens WhatsApp and sends it, and the shop confirms the price and date in that chat.
- The form posts to a **server action** (`app/[locale]/custom-order/actions.ts`). The action validates the input with the domain rules (`parseCustomOrder` in `@la-porta/domain`), looks the design up again, and returns either localized errors with the cleaned values or the WhatsApp link and the message. Validation code and zod stay on the server; the form in the browser imports types only.
- Only fields the shop's data supports are asked for: occasion, decoration type, "Mini", a description, flavour (free text), writing on the cake, a requested date, a name and notes. Sizes and a flavour list are not offered because none are confirmed (0005). A reference photo cannot travel in a link, so the page asks the customer to send it in the chat.
- A design from the gallery arrives as `?design=<slug>`. It is accepted only as a single slug of a **published** design with a public photo, both when the page loads and again when the form is posted; anything else is ignored. The browser receives the slug only, never the design record.
- Text is normalized before any rule is checked: NFC, control characters, bidirectional-override characters and invisible characters (zero-width space, word joiner, soft hyphen, byte-order mark) removed, unpaired UTF-16 halves replaced, spaces collapsed, at most one empty line in a row. Limits are counted in characters (code points). The whole message is encoded with `encodeURIComponent`, and the number comes from the store settings only.
- "Today" and the earliest date follow the shop's time zone (Asia/Amman), with the store's default notice (`defaultLeadHours`, 24 hours); dates up to a year ahead are accepted.

## Why

- Orders are already confirmed over WhatsApp or Instagram (as the site's footer and product pages say). A message the customer sends themselves needs no database, accounts, payment or back-end API, and cannot be mistaken for a confirmed order.
- Validating on the server keeps one source of truth for the rules, keeps zod out of the browser bundle, and means a tampered browser cannot change what is checked.
- A server action works without JavaScript (an ordinary form post), and Next.js only accepts it from the site's own pages (it compares the `Origin` and `Host` headers). The request body is limited to 32 KB (`next.config.ts`).

## Consequences

- The custom-order page is rendered per request (it reads the query and today's date) and is not cached (`Cache-Control: no-store`).
- If the site is hosted on more than one server instance, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be set so all instances accept the same action IDs (deployment checklist, Phase 7).
- Open business questions, to be answered by the owner before they are added: confirmed sizes and servings, a list of flavours or fillings, whether a name should be required, the furthest date the shop accepts, and whether Instagram or Messenger should get the same prepared message.
