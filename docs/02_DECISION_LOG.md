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

---

## D-008 — Automated Collection Uses a Central Source-Access Registry

**Status:** Accepted

### Decision

Automated commercial-source collection must be gated through the
central source-access registry.

Collection is allowed only when the source has status `ALLOWED` and
the requested collection mode is explicitly allowed.

Missing sources, `UNKNOWN` sources, `RESTRICTED` sources, and
ungranted modes fail closed.

`ALLOWED` entries require evidence plus an explicit recognized
`authorizationBasis`. The recognized values are:

- `PUBLIC_TERMS`
- `WRITTEN_PERMISSION`
- `CONTRACT`

The registry records a human-reviewed authorization decision and
provenance. The loader does not independently interpret legal
documents.

BrowserCapture remains source- and permission-agnostic.

Individual source approvals are configuration and evidence changes.
They are not separate architectural D-xxx decisions.

### Reasoning

Q-004 requires per-source review. D-007 forbids access-control
circumvention. TASK-004 found no approved commercial source. A central
registry keeps that permission decision out of BrowserCapture and out
of future adapters and schedulers.

### Consequence

A future orchestrator consults the registry before automated
commercial-source collection. Collection starts only from a registry
that loads successfully.

Allowing one source does not answer Q-004 for any other source.

### Does not decide

This decision does not approve CrowdVolt, Shotgun, Resident Advisor,
DICE, or any other source.

It does not decide written-agreement outcomes, snapshot frequency
(Q-006), field reliability (Q-005), or adapter design.

### Revisit When

The evidence fields are insufficient, or a lawful partner API needs a
different gate.