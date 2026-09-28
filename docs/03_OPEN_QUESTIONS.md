# Live Tape — Open Questions

---

## Q-001 — Can Visible Bids Create Seller Supply?

**Priority:** Critical  
**Status:** Open

### Hypothesis

Ticket holders who were not actively planning to sell may sell when
shown real executable demand.

### Evidence Needed

Manual pilot data and eventual marketplace behavior.

---

## Q-002 — Can Live Tape Concentrate Liquidity?

**Priority:** Critical  
**Status:** Open

### Question

Can enough buyers and sellers be concentrated into individual event
markets to produce useful spreads and fills?

---

## Q-003 — Can External Ticket Settlement Be Reliable Enough?

**Priority:** Critical  
**Status:** Open

### Question

What failure rate can be achieved without native issuer custody?

---

## Q-004 — Which Sources Permit Automated Observation?

**Priority:** Critical  
**Status:** Open

Each source requires independent review.

Do not generalize one source's policy to another.

No source is currently approved for automated historical collection.

Source-access enforcement is implemented through D-008 and the
source-access registry. The registry records the current fail-closed
answer for a named source and mode. It does not resolve whether any
particular source permits automation.

A robots.txt directive is separate from contractual permission. A page that loads in a browser is separate from authorization to automate collection.

Evidence below was recorded on 2026-09-27. Detail is in `docs/research/sources/`.

### CrowdVolt

**VERIFIED FACT.** User Agreement §6.1, retrieved 2026-09-27 from `https://www.crowdvolt.com/terms_of_service/user_agreement`, restricts systematic retrieval, automated use, crawling and scraping, and bypassing robot-exclusion headers. See `docs/research/sources/crowdvolt.md`.

**VERIFIED FACT.** `https://www.crowdvolt.com/robots.txt`, retrieved 2026-09-27, disallows `/` for User-agent `*`. That directive is not itself the contractual finding.

**INFERENCE.** CrowdVolt is a strong permission-review candidate because one logged-out NYC nightlife market displayed bid/ask-style information. It is unapproved for automated collection.

**UNKNOWN.** Whether CrowdVolt would grant a written exception.

### Shotgun

**UNKNOWN.** US automation permission. The US General Terms were not retrieved on 2026-09-27. See `docs/research/sources/shotgun.md`.

**VERIFIED FACT.** `https://shotgun.live/robots.txt` allows `/` for User-agent `*`. That allow rule is not contractual permission.

**VERIFIED FACT.** The Europe English General Terms retrieved the same day must not be generalized into a US policy. In that Europe English text, the automation language found concerns social bots and automated ticket purchase. It is not a US finding.

### Resident Advisor

**VERIFIED FACT.** Terms retrieved 2026-09-27 from `https://ra.co/terms` restrict commercial automated extraction without a written agreement, and restrict unauthorized bots, crawlers, and scrapers. See `docs/research/sources/resident-advisor.md`.

**VERIFIED FACT.** Browser-visible public listings do not constitute permission.

**UNKNOWN.** Whether Resident Advisor would grant a written agreement.

### DICE

**VERIFIED FACT.** The researcher retrieved the US Terms of Use on 2026-09-27 and recorded a clause restricting crawling with scripts or web crawlers. See `docs/research/sources/dice.md`.

**VERIFIED FACT.** The independent verifier's later live re-fetch of that page was blocked by Cloudflare. The live page was not independently reconfirmed during verification.

**UNKNOWN.** Whether the currently served live page has changed since the researcher's same-day retrieval.

**VERIFIED FACT.** `https://dice.fm/robots.txt` disallows `/api/` for User-agent `*`. That directive is separate from the terms.

---

## Q-005 — Which Market Fields Are Reliably Observable?

**Priority:** High  
**Status:** Open

Potential fields include:

- bid;
- ask;
- depth;
- last transaction;
- ticket type;
- face price;
- availability;
- event status.

Actual availability is source dependent.

Seeing a field does not authorize automated collection. Permission
remains Q-004 and D-008.

One observation does not establish reliable observability over time. The fields below were seen once on 2026-09-27. Repeated observability remains unknown. Detail is in `docs/research/sources/`.

### CrowdVolt

Seen once, logged out, on one NYC event page: event name, time, venue, address, lineup, a Buy price of $55, a Sell price of $40, an ask ladder, ticket class, and a quantity range.

Not established: face price, last trade, the full bid ladder in that session, agreement between fetched prose and the rendered button price, and stability over time.

### Shotgun

Seen once on the New York city page: event name, venue, time, and some displayed dollar prices.

Not established: an order book, whether event-detail HTML contains the live price, and stability over time.

### Resident Advisor

Seen once on the New York events index in a browser: dates and venues.

Not established on that view: face price, bid, ask, depth, last trade, and resale fields. Stability over time is unknown.

### DICE

Seen once on the New York browse page: event name, venue, date, a “From $” or free label, and at least one sold-out label.

Not established: bid, ask, depth, last trade, and stability over time.

---

## Q-006 — What Snapshot Frequency Is Necessary?

**Priority:** Medium  
**Status:** Open

Need evidence regarding:

- market-change frequency;
- storage cost;
- time-to-event;
- usefulness for analysis.

---

## Q-007 — How Should Cross-Source Event Identity Be Resolved?

**Priority:** High  
**Status:** Open

Need canonical event identity across sources using combinations of:

- event name;
- venue;
- promoter;
- start time;
- artist;
- source identifier.

---

## Q-008 — How Should Equivalent Ticket Classes Be Normalized?

**Priority:** High  
**Status:** Open

Example:

Are Presale GA, Tier 1 GA, and Tier 2 GA one instrument if their
admission rights are identical?

---

## Q-009 — What Historical Replay Semantics Are Appropriate?

**Priority:** Medium  
**Status:** Open

Browser snapshots reveal observed market state, not necessarily every
underlying order event.

The replay model must not manufacture event-time precision that was not
observed.

---

## Q-010 — What Market Mechanism Performs Best for Thin Ticket Markets?

**Priority:** Medium  
**Status:** Open

Potential mechanisms:

- continuous price-time order book;
- periodic call auction;
- frequent batch auction.

Requires future simulation using collected data.