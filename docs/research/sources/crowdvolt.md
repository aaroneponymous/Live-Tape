# CrowdVolt

## Current State — 2026-09-28 onward

**Status:** `ALLOWED` for `browser_capture`  
**Authorization basis:** `WRITTEN_PERMISSION`  
**Evidence:** `docs/source-access/crowdvolt-approval-2026-09-28.md`  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-007, D-008

**VERIFIED FACT.** Written authorization was received on 2026-09-28. The source-access registry records CrowdVolt as `ALLOWED` for `browser_capture`, with `authorizationBasis` `WRITTEN_PERMISSION`.

**VERIFIED FACT.** CrowdVolt permits at most one automated capture per event every 60 minutes. The registry represents that limit as `constraints.minimumIntervalSeconds: 3600`.

The written authorization is separate from the 2026-09-27 public-terms research below. D-007 still prohibits access-control circumvention. Authorization does not resolve Q-005 field reliability.

This permission does not cover authenticated browser automation, purchasing, private APIs, other collection modes, or access-control circumvention.

---

## Historical State — 2026-09-27

**Status on this date:** `RESTRICTED`, based on public-policy research. CrowdVolt was not approved for automated collection.

**Retrieval date:** 2026-09-27  
**Approval status on 2026-09-27:** Not approved for automated collection  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-001, D-007 remain accepted. This note does not add a decision.

The findings below are the 2026-09-27 research record. They remain historical evidence.

CrowdVolt is a strong permission-review candidate. On 2026-09-27 it was unapproved for automated historical collection.

---

## Source Role

**VERIFIED FACT.** CrowdVolt presents a secondary marketplace. The examined event page showed a visible bid/ask-style book. The User Agreement describes the platform in terms consistent with that role.

---

## NYC Nightlife Relevance

**VERIFIED FACT.** On 2026-09-27 a logged-out event page was Jamie Jones at Pacha, 140 Stewart Ave, New York, NY 11237, Friday, October 9, 10:00 PM.

**INFERENCE.** That event fits the NYC nightlife wedge in D-001.

---

## Pages Examined

Retrieved or viewed on 2026-09-27:

- `https://www.crowdvolt.com/robots.txt`
- `https://www.crowdvolt.com/terms_of_service/user_agreement`
- `https://www.crowdvolt.com/event/jamie-jones-pacha-new-york-brooklyn-new-york-october-10-2026` — loaded logged out in a browser

A non-browser HTTP GET of that event URL returned 403.

---

## Authentication Observations

**VERIFIED FACT.** The market view loaded without completing login. A Log In button was visible.

**UNKNOWN.** Whether every field, or the purchase path, requires authentication. The purchase path was not tested.

---

## Automation and Access-Policy Evidence

**VERIFIED FACT.** User Agreement §6.1, “Unauthorized Use or Access,” retrieved 2026-09-27 from `https://www.crowdvolt.com/terms_of_service/user_agreement`, says the user agrees not to:

> Systematically retrieve data or other content from the Platform to create or compile, directly or indirectly, in single or multiple downloads, a collection, compilation, database, directory or the like, whether by manual methods, through the use of bots, crawlers, spiders, or otherwise

and not to:

> Make any automated use of the Platform

and not to:

> Bypass any robot exclusion headers or other measures CrowdVolt takes to restrict access to the Platform, or use any software, technology or device to send content or messages, scrape, spider or crawl the Platform, or harvest or manipulate data

An independent verifier re-fetched that page on 2026-09-27 and found those §6.1 clauses present.

**INFERENCE.** That wording covers the systematic historical collection Live Tape is considering. This note is not a legal opinion on enforceability.

**UNKNOWN (as of 2026-09-27).** Whether CrowdVolt would grant a written exception. Later written permission for `browser_capture` is recorded in Current State. It does not cover other modes.

---

## Robots.txt Evidence

**VERIFIED FACT.** `https://www.crowdvolt.com/robots.txt`, retrieved 2026-09-27, allows `/` for named search, AI, and link-preview bots. The catch-all is:

```text
# Block every other crawler (generic scrapers)
User-agent: *
Disallow: /
```

The independent verifier re-fetched this file on 2026-09-27 and confirmed `User-agent: *` / `Disallow: /`.

A robots directive is separate from contractual permission. The User Agreement also tells users not to bypass robot-exclusion headers.

---

## Technical-Access Observations

**VERIFIED FACT.** A plain HTTP GET of the examined event URL returned 403. A normal browser view of the same URL loaded. WebFetch of the event page also loaded in the research session.

**UNKNOWN.** Whether a repeated Playwright capture would receive the live book or a challenge page. No attempt was made to pass a wall. D-007 forbids circumvention.

---

## Event Fields Observed

**VERIFIED FACT.** On the examined event page, once: name, date and time, venue, address, and lineup.

**UNKNOWN.** Promoter was not identified on that page.

---

## Market Fields Observed

**VERIFIED FACT.** Logged out, one session showed:

- a Buy control at $55
- a Sell control at $40
- ticket classes GA (Before 12AM) and General Admission
- quantity ranges such as “1 Ticket” and “1–3 Tickets”
- an ask ladder from $55 to $78
- seller display names

A “Set price alert” control was also visible.

A promotional app card contained separate sample events and prices. Those samples are not observations of this event.

**VERIFIED FACT.** A text fetch of the same URL included a sentence that the floor was “$53 right now,” while the live Buy button read $55. Serialized text and the rendered button disagreed in this session.

**UNKNOWN.** Whether $53 was stale copy.

**UNKNOWN.** The “Interested buyers” tab was selected, and a promotional overlay kept covering it. Individual bid rows were not confirmed in this pass. The Sell $40 button was visible.

**UNKNOWN.** Face price and last trade were not shown.

One observation does not establish reliable observability over time.

---

## Historical-Data Usefulness

**HYPOTHESIS.** If repeated snapshots were permitted, this page could support ask history, bid history, spread, visible depth, and time-to-event work.

The published terms, as retrieved on 2026-09-27, do not grant that permission. On that date, usefulness was conditional on a later access decision that had not been made. The later `browser_capture` authorization is recorded in Current State. It does not establish that those fields are reliably observable.

---

## Q-004 Implications

Evidence of a restriction, recorded 2026-09-27. On that date, CrowdVolt was not approved for automated observation.

Public reachability of the event page is separate from authorization to automate.

The later `browser_capture` authorization is recorded in Current State. It does not rewrite this public-policy finding, and it does not authorize other collection modes.

---

## Q-005 Implications

Ask, the bid-button price, ticket class, and quantity were visible once. Reliability across time is unknown. The full bid ladder was not confirmed in this pass.

---

## Remaining Unknowns

Recorded on 2026-09-27. Written permission for `browser_capture` was received on 2026-09-28 and is recorded in Current State. The other items below remain open.

- Whether CrowdVolt would grant written research access. Answered only for `browser_capture`, and only within the scope in `docs/source-access/crowdvolt-approval-2026-09-28.md`. Other modes remain unauthorized.
- Whether repeated browser capture keeps returning the live book.
- Whether saved HTML contains the prices shown on the Buy button. This session already showed fetched prose and the button disagreeing ($53 versus $55).
- Individual bid-row detail.
- Face price and last transaction.
- Legal effect beyond the quoted clauses.
