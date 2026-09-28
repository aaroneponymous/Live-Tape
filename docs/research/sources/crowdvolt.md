# CrowdVolt

**Retrieval date:** 2026-09-27  
**Approval status:** Not approved for automated collection  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-001, D-007 remain accepted. This note does not add a decision.

CrowdVolt is a strong permission-review candidate. It is unapproved for automated historical collection.

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

**UNKNOWN.** Whether CrowdVolt would grant a written exception.

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

The published terms do not grant that permission. Usefulness is conditional on a later access decision that has not been made.

---

## Q-004 Implications

Evidence of a restriction, recorded 2026-09-27. CrowdVolt is not approved for automated observation.

Public reachability of the event page is separate from authorization to automate.

---

## Q-005 Implications

Ask, the bid-button price, ticket class, and quantity were visible once. Reliability across time is unknown. The full bid ladder was not confirmed in this pass.

---

## Remaining Unknowns

- Whether CrowdVolt would grant written research access.
- Whether repeated browser capture keeps returning the live book.
- Whether saved HTML contains the prices shown on the Buy button. This session already showed fetched prose and the button disagreeing ($53 versus $55).
- Individual bid-row detail.
- Face price and last transaction.
- Legal effect beyond the quoted clauses.
