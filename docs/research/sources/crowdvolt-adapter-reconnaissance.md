# CrowdVolt Adapter Reconnaissance

**Task:** TASK-007  
**Observation date:** 2026-09-30  
**Source:** CrowdVolt  
**Source ID:** `crowdvolt`  
**Collection mode:** `browser_capture`  
**Related questions:** Q-005  
**Related decisions:** D-007, D-008

This note records one manually initiated capture. It does not implement a source adapter, a scheduler, or `RawSnapshot`.

Q-005 remains open. One blocked capture does not establish which market fields are reliably observable.

---

## Capture

**VERIFIED FACT.** One `capturePage` call completed against the existing BrowserCapture and ArtifactStore boundaries. No second browser-capture implementation was added. No navigation retry was required.

| Item | Value |
|---|---|
| Requested URL | `https://www.crowdvolt.com/event/jamie-jones-pacha-new-york-brooklyn-new-york-october-10-2026` |
| Manual run started | `2026-09-30T18:30:59.385Z` |
| Timing check instant | `2026-09-30T18:30:59.390Z` |
| Capture time (`capturedAt`) | `2026-09-30T18:31:01.194Z` |
| Run kind | Manual one-off. No prior Live Tape stack capture of this URL was on record, so `lastSuccessfulCaptureAt` was `null`. |
| Next eligible capture of this URL | `2026-09-30T19:31:01.194Z` or later |

The local run record is `var/recon/crowdvolt-task-007/manual-run.json`. That directory is gitignored. The timestamp in this note is the durable record that another capture of this URL inside the 3600-second interval would violate the authorization.

`capturePage` returned `ok: true`. That result means the navigation finished and both artifacts were stored. It does not mean the CrowdVolt event page was observed.

The stored document is a Cloudflare block page. The title is `Attention Required! | Cloudflare`. The visible headline is `Sorry, you have been blocked`. The subheadline says the client is unable to access `crowdvolt.com`.

Per D-007 and the CrowdVolt authorization, the run stopped on that page. No retry, authentication, purchase, bid, private API, proxy, stealth, CAPTCHA, or fingerprint behavior was added.

---

## Authorization Check

**VERIFIED FACT.** Immediately before the page load, the committed registry at `config/source-access.json` was loaded with `loadSourceAccessRegistry`.

`canCollect(registry, "crowdvolt", "browser_capture")` returned:

- `allowed: true`
- `status: ALLOWED`
- `mode: browser_capture`

The CrowdVolt entry's `constraints.minimumIntervalSeconds` was `3600`.

`canCollectAt` was called for this same URL with `lastSuccessfulCaptureAt: null` and `now: 2026-09-30T18:30:59.390Z`. It returned `allowed: true`.

The 2026-09-27 examination of this URL in `docs/research/sources/crowdvolt.md` was a manual browser view, not a BrowserCapture artifact, and was not treated as capture history.

The authorization evidence file was not modified.

---

## Event Observed

**VERIFIED FACT.** The captured document does not display the event. The URL path is the previously examined Jamie Jones at Pacha page. The page body does not contain that event's name, date, venue, or market.

No event name was observed on the captured page.

---

## Artifact References

Bytes are in the local gitignored store `var/recon/crowdvolt-task-007/`. `RawSnapshot` was not constructed. `RawSnapshot.contentHash` remains undefined.

| Artifact | Locator | SHA-256 |
|---|---|---|
| Serialized HTML (`page.content()`) | `ltart1:html:3e0f790259d835910083a8e643fdf962dbf9a1737db98d38a158c27bd9ae9b0f` | `3e0f790259d835910083a8e643fdf962dbf9a1737db98d38a158c27bd9ae9b0f` |
| Viewport screenshot (1280×720 PNG) | `ltart1:screenshot:ee883910fbae51122dbfdfd50e7d5133c1c18f70f0743a325644d1b29ca35740` | `ee883910fbae51122dbfdfd50e7d5133c1c18f70f0743a325644d1b29ca35740` |

The HTML artifact is 5,327 bytes. The screenshot artifact is a viewport capture from `page.screenshot({ type: "png" })`, not a full-page capture. Existing BrowserCapture does not pass `fullPage: true`.

A hidden element in the HTML contains a client network address. That address is omitted here. It was not visible in the screenshot.

The HTML footer includes Cloudflare Ray ID `a4354d521e2d57d4`. That identifier was not confirmed as visible in the viewport screenshot.

---

## Event Fields

Classifications describe this capture only.

| Field | Classification |
|---|---|
| Event name | `NOT_OBSERVED` |
| Date | `NOT_OBSERVED` |
| Time | `NOT_OBSERVED` |
| Venue | `NOT_OBSERVED` |
| Address | `NOT_OBSERVED` |
| Lineup | `NOT_OBSERVED` |

The serialized HTML contains none of the strings `Jamie`, `Pacha`, or a ticket or price token from the 2026-09-27 examination.

---

## Ticket-Class Fields

| Field | Classification |
|---|---|
| Ticket-class name | `NOT_OBSERVED` |
| Admission restrictions such as "Before 12AM" | `NOT_OBSERVED` |
| Quantity or quantity range | `NOT_OBSERVED` |

---

## Market Fields

| Field | Classification |
|---|---|
| Displayed Buy price | `NOT_OBSERVED` |
| Displayed Sell price | `NOT_OBSERVED` |
| Best ask | `NOT_OBSERVED` |
| Best bid | `NOT_OBSERVED` |
| Individual ask rows | `NOT_OBSERVED` |
| Individual bid rows | `NOT_OBSERVED` |
| Quantities associated with levels | `NOT_OBSERVED` |
| Seller or buyer labels | `NOT_OBSERVED` |
| Face price | `NOT_OBSERVED` |
| Last transaction | `NOT_OBSERVED` |
| Sold-out / availability state | `NOT_OBSERVED` |

No dollar amounts are present in the serialized HTML. The screenshot shows the block headline, the subheadline, and a red X graphic. It does not show a price.

---

## Serialized HTML vs Rendered UI

**VERIFIED FACT.** On this capture, `page.content()` and the viewport screenshot describe the same Cloudflare block. Both show `Sorry, you have been blocked` and that access to `crowdvolt.com` was refused.

The 2026-09-27 discrepancy, fetched prose at `$53` versus a rendered Buy control at `$55`, was not present in either artifact. This run does not confirm it, refute it, or choose either value.

Differences that were observed on the block document:

- The screenshot is the 1280×720 viewport. The serialized HTML also contains footer markup, including the Ray ID, below the headline region that the screenshot inspection showed.
- A client network address is present in the serialized HTML inside a hidden element. It was not visible in the screenshot. The address is omitted from this note.
- An HTML comment names a `captcha-container`. The associated element is an empty error span (`cf-no-screenshot error`). No interactive CAPTCHA widget was visible in the screenshot, and none was solved.

`capturePage` waits for Playwright's `load` event and then reads `page.content()`. On this run the loaded document was already the block page. There is no evidence in these artifacts of a later event-page DOM that the screenshot missed.

Naive text extraction of this HTML would collect Cloudflare block copy. It would not collect a CrowdVolt book. Treating `capturePage` success, or the absence of prices, as an empty market would be unsafe.

---

## Promotional / False-Positive Content

The event page's promotional cards, other-event prices, price alerts, and marketing copy were `NOT_OBSERVED`. This document never reached that page.

False-positive content that a future parser must reject:

- A document whose title is `Attention Required! | Cloudflare`.
- The headline `Sorry, you have been blocked`.
- Cloudflare footer, Ray ID, and `data-translate` attributes.
- The script reference `/cdn-cgi/challenge-platform/scripts/jsd/main.js`.
- Any price-like token that appears only inside that block document. None appeared in this capture.

Exclusion rule that follows from this page: if the captured HTML is a Cloudflare block document, fail the observation. Do not emit ticket classes, bids, asks, or availability from it.

---

## Candidate Extraction Strategy

The observed page does not support choosing a market-extraction strategy.

Options considered for a future adapter:

- A. Parse serialized HTML after BrowserCapture.
- B. Extract structured fields from the live Playwright page.
- C. Store browser evidence and also extract from the live DOM.

**INFERENCE.** A and B would see the same document on this run. `page.content()` is the serialized DOM after `load`, and the screenshot shows that DOM's block headline. Live-DOM queries would have read the Cloudflare block, not a hidden book.

**UNKNOWN.** Whether a later authorized capture, still without circumvention, would receive the event page. That was not tested again. This URL is inside the 3600-second interval until `2026-09-30T19:31:01.194Z`.

No private network or API traffic was used, and none is recommended.

The strategy this page does support is a fail-closed gate in front of any parser: recognize this block document and stop. That check can be done from the saved HTML. It is not a CrowdVolt market adapter.

---

## Stable Identifiers

**VERIFIED FACT.** The public DOM of this capture has no CrowdVolt ticket-class identifier. There is no General Admission, GA Before 12AM, VIP, or backstage node.

Element ids on the page are Cloudflare block ids (`cf-wrapper`, `cf-error-details`, `cookie-alert`, and related footer ids). The only `data-*` attribute is `data-translate`. Those are not ticket-class identities.

The Ray ID identifies this Cloudflare response. It is not an event id or a ticket-class id.

Whether CrowdVolt's event page exposes a stable ticket-class id remains unknown. This capture cannot answer it.

---

## Q-005 Implications

Q-005 stays open.

The 2026-09-27 logged-out view remains a separate observation: event metadata, a Buy price, a Sell price, an ask ladder, ticket class, and a quantity range were seen once in a normal browser. This `browser_capture` did not reproduce those fields.

This run adds a different verified observation: at `2026-09-30T18:31:01.194Z`, headless Chromium through existing BrowserCapture received a Cloudflare block for this URL, and both artifacts agree on that block.

Reliability of bid, ask, depth, last transaction, ticket type, face price, and availability is still unproven. Agreement between `page.content()` and a rendered CrowdVolt book is still unproven.

---

## Unknowns

- Whether a later headless BrowserCapture of an authorized CrowdVolt event page receives the event DOM or another block.
- Whether the 2026-09-27 `$53` / `$55` disagreement still occurs when the event page is actually captured.
- Which event, ticket-class, and market fields are present in `page.content()` for this event.
- Whether ticket classes have a stable public DOM id, or only labels.
- Which promotional regions a parser must ignore on the real event page.
- Whether the block is specific to this client, this headless launch, or CrowdVolt's current edge configuration. No circumvention was attempted, so those causes were not separated.

---

## TASK-008 Recommendations

Do not implement a production CrowdVolt adapter from this artifact.

A follow-on task should treat these as the contract:

1. Do not schedule unattended collection.
2. Do not capture this URL again before `2026-09-30T19:31:01.194Z`.
3. Do not add proxy, stealth, CAPTCHA solving, fingerprint evasion, authentication, or transactional interaction to get past the block.
4. If CrowdVolt's written `browser_capture` permission and this Cloudflare block remain in conflict, ask CrowdVolt for clarification before changing capture behavior. That is the path in the authorization record, section 11.
5. Any future parser must fail closed on a Cloudflare block document and must not invent an empty book from `capturePage` success.
6. Choose among serialized HTML, live DOM, or both only after an authorized capture actually contains the event page. This run does not provide that evidence.
7. Leave Q-005 open until repeated observations of the event page exist.
8. Leave `RawSnapshot.contentHash` unresolved.
