# Resident Advisor

**Retrieval date:** 2026-09-27  
**Approval status:** Not approved for automated collection  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-001, D-007 remain accepted. This note does not add a decision.

Browser-visible public listings do not constitute permission. Resident Advisor is not approved for automated historical collection.

---

## Source Role

**VERIFIED FACT.** The New York index rendered as an events calendar: event discovery and listings, with ticket entry points.

**UNKNOWN.** Whether RA Tickets or RA Resale exposes prices. An event-detail page was not re-checked in this pass. Resale fields were not separately retrieved.

---

## NYC Nightlife Relevance

**VERIFIED FACT.** A normal browser view of `https://ra.co/events/us/newyork` on 2026-09-27 rendered a New York events index for Sunday, September 27, with rooms including Nowadays, public records, Basement, and Knockdown Center.

Prices were not on that index view.

**INFERENCE.** The index is relevant to the NYC nightlife wedge in D-001.

---

## Pages Examined

Retrieved or viewed on 2026-09-27:

- `https://ra.co/robots.txt`
- `https://ra.co/terms`
- `https://ra.co/events/us/newyork` — WebFetch returned a Cloudflare block (Ray ID `a41f8193bdb8f286`). A browser view rendered the calendar. The accessibility snapshot for that tab contained no element refs.

An independent verifier re-fetched `https://ra.co/terms` and `https://ra.co/robots.txt` on 2026-09-27.

---

## Authentication Observations

**VERIFIED FACT.** The index was visible without completing a login.

**UNKNOWN.** Account-only ticket fields were not tested.

---

## Automation and Access-Policy Evidence

**VERIFIED FACT.** `https://ra.co/terms`, retrieved 2026-09-27, states:

> you are not permitted to use, or cause others to use, any automated system or software to extract content or data from our Website for commercial purposes except where you or any applicable third party has entered into a written agreement with us that permits such activity

and that users must not access the site through unauthorized means, including:

> automated devices, scripts, bots, spiders, crawlers or scrapers (except for standard search engine technologies)

The independent verifier identified these as §4.4(a) and §4.4(f) on the live terms page retrieved 2026-09-27.

**INFERENCE.** Live Tape’s commercial research use would need a written agreement under that wording.

**UNKNOWN.** Whether Resident Advisor would grant one.

Browser-visible public listings do not constitute permission.

---

## Robots.txt Evidence

**VERIFIED FACT.** `https://ra.co/robots.txt`, retrieved 2026-09-27. For `User-agent: *`, disallowed paths include `/pro/`, `/user/`, `/api/`, `/my-tickets`, and `/widget`. Many named commercial and AI bots are `Disallow: /`. Event HTML paths are not given a blanket `Disallow: /` for `*`.

The independent verifier confirmed that this is not a blanket HTML ban for `*`.

That robots file is separate from contractual permission. It does not authorize automated collection.

---

## Technical-Access Observations

**VERIFIED FACT.** Cloudflare blocked a non-browser fetch of the New York index and a browser render of that index succeeded. The accessibility snapshot contained no element refs while the calendar was visible on screen.

**UNKNOWN.** Whether a later headless capture would keep clearing Cloudflare, and whether saved HTML would contain the listings visible in a screenshot. No attempt was made to pass Cloudflare. D-007 forbids circumvention.

Technical blocking is an observation. It is not itself a legal permission or prohibition.

---

## Event Fields Observed

**VERIFIED FACT.** The index showed dates and venues once.

**UNKNOWN.** Promoter, lineup, and ticket price on an event detail page were not re-verified here.

---

## Market Fields Observed

**VERIFIED FACT.** Face price, bid, ask, depth, and last trade were absent from the index view examined on 2026-09-27.

**UNKNOWN.** Resale fields.

One observation does not establish reliable observability over time.

---

## Historical-Data Usefulness

**INFERENCE.** Repeated calendars could support event existence and scheduling, if observation were permitted.

**UNKNOWN.** Spread and order-book history. Those fields were not observed.

---

## Q-004 Implications

The terms restrict commercial automated extraction without a written agreement, and they restrict unauthorized bots, crawlers, and scrapers. No written agreement is on file. Resident Advisor is not approved for automated observation.

A public index that renders in a browser is not authorization.

---

## Q-005 Implications

Market prices were not observed. Event dates and venues on the index were observed once. Reliability across time is unknown.

---

## Remaining Unknowns

- Whether Resident Advisor would grant written research access.
- RA Tickets and RA Resale fields and any separate terms for those products.
- Event-detail prices.
- Whether browser capture would keep clearing Cloudflare.
- Whether a screenshot of the calendar can be treated as structured data when the accessibility tree is empty. In this session it could not.
- Legal effect beyond the quoted clauses.
