# Live Tape — Decision Log

Decisions recorded here are authoritative until explicitly reopened.

---

## D-001 — NYC Nightlife Is the Initial Validation Wedge

**Status:** Accepted

### Decision

Initial market research and validation will focus on NYC nightlife.

### Reasoning

NYC nightlife provides comparatively simple GA inventory, dense
communities, frequent events, informal resale behavior, and potentially
accessible independent promoters.

### Revisit When

Initial validation is complete or evidence materially challenges the
wedge.

---

## D-002 — Bid/Ask UI Alone Is Not Sufficient Differentiation

**Status:** Accepted

### Decision

Live Tape will not treat merely presenting bids and asks as its primary
competitive differentiation.

### Reasoning

Existing competitors already provide bid/ask-style resale mechanics.

### Consequence

Differentiation research will focus on market quality, standardization,
settlement, liquidity, data, and infrastructure.

---

## D-003 — Historical Market Data Infrastructure Precedes Production Exchange

**Status:** Accepted

### Decision

Build event/market-data collection infrastructure before committing to
production exchange development.

### Reasoning

The dataset serves:

- market validation;
- financial analysis;
- competitor observation;
- market-structure research;
- future engine simulation.

---

## D-004 — Raw Snapshots Are Immutable Evidence

**Status:** Accepted

### Decision

Raw page captures are preserved separately from normalized data.

### Consequence

Parser improvements should produce new normalized interpretations
without destroying original observations.

---

## D-005 — Observations Are Append-Only

**Status:** Accepted

### Decision

Historical market observations are not overwritten with newer values.

New observations create new records.

---

## D-006 — C++ Is Reserved for Market Infrastructure

**Status:** Accepted

### Decision

C++ is the preferred language for future:

- matching;
- order books;
- auctions;
- market simulation;
- replay.

Browser/data collection does not require C++.

---

## D-007 — No Automated Access-Control Circumvention

**Status:** Accepted

### Decision

Live Tape will not build mechanisms whose purpose is defeating
CAPTCHAs, authentication restrictions, anti-bot controls, or similar
access protections.