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