# Task: Raw Snapshot Foundation

**ID:** TASK-001  
**Status:** DONE  
**Created:** 2026-09-27  
**Updated:** 2026-09-27  
**Owner:**  
**Related Decisions:** D-003, D-004, D-005, D-006, D-007  
**Related Open Questions:** Q-004, Q-005, Q-006, Q-007, Q-008, Q-009, Q-010  

---

## 1. Goal

Define the minimum canonical TypeScript contract for a successfully
persisted immutable browser capture.

The contract must allow Live Tape to preserve raw source evidence now
and interpret that evidence later without tying the capture itself to a
specific parser, normalized event, market observation, storage backend,
or market mechanism.

---

## 2. Why This Exists

Live Tape's current engineering priority is historical event and
market-data collection.

Before implementing browser orchestration, source adapters,
normalization, persistence, or replay, the project needs an explicit
contract describing what a raw capture is.

D-004 requires raw page captures to remain immutable evidence separate
from normalized data.

D-005 requires later historical observations to be append-only rather
than overwriting prior state.

TASK-001 establishes the evidence boundary those later systems will
depend on.

---

## 3. Context

Relevant project constraints:

- D-003 — historical collection precedes production exchange work.
- D-004 — raw captures are immutable evidence.
- D-005 — historical market observations are append-only.
- D-006 — collection infrastructure belongs outside the C++ market
  engine.
- D-007 — collection must not include access-control circumvention.

Relevant operating rules:

- `.cursor/rules/20-data-integrity.mdc`
- `.cursor/rules/30-typescript.mdc`
- `.cursor/rules/40-cpp-engine.mdc`

The repository currently has no TypeScript implementation, package
manifest, database schema, persistence implementation, or browser
collector.

---

## 4. In Scope

TASK-001 includes:

- defining a canonical raw-capture contract in `packages/schemas`;
- defining a stable snapshot identity type;
- defining source identity;
- defining source URL;
- defining capture time with explicit capture-time semantics;
- defining content-hash representation with an explicit algorithm;
- defining references to immutable raw artifacts;
- supporting references to raw HTML and screenshot artifacts where
  applicable;
- making optionality explicit;
- adding tests or type-level validation appropriate to the contract;
- adding only the minimum TypeScript tooling necessary to typecheck and
  test this contract;
- extending `scripts/verify.sh` only as necessary to run the canonical
  TypeScript validation introduced by this task.

---

## 5. Out of Scope

TASK-001 must not implement:

- Playwright or browser automation;
- a real source integration;
- source adapters;
- parsing;
- normalization;
- diffing;
- PostgreSQL persistence;
- object-storage clients;
- scheduling;
- snapshot frequency;
- Parquet or DuckDB export;
- replay export;
- C++ integration;
- matching or auction logic;
- payment or settlement infrastructure.

TASK-001 must not define:

- canonical Event identity;
- canonical Instrument identity;
- bid or ask fields;
- market depth;
- last-trade fields;
- ticket-class equivalence;
- event availability;
- event status;
- replay order events;
- source event-time inferred from capture time;
- a specific market mechanism.

It must not resolve Q-004 through Q-010.

---

## 6. Requirements

### Functional

- [x] A canonical `RawSnapshot` contract exists under
      `packages/schemas`.
- [x] A raw snapshot has a stable identity independent of its content
      hash.
- [x] A raw snapshot identifies its source.
- [x] A raw snapshot preserves the source URL.
- [x] A raw snapshot records capture time with one explicit meaning.
- [x] A raw snapshot can describe content integrity using an explicit
      hash algorithm and hash value.
- [x] A raw snapshot can reference separately stored immutable raw
      artifacts.
- [x] Artifact representation can distinguish at least HTML and
      screenshot evidence without embedding source-specific DOM
      structure into the canonical schema.
- [x] The contract can represent legitimately absent optional evidence
      without inventing placeholder values.

### Data / Domain

- [x] `capturedAt` or its equivalent means only the time Live Tape
      captured the source.
- [x] Capture time is not represented as `sourceEventAt`.
- [x] Content hash is not used as the sole snapshot identity.
- [x] Raw artifact bytes are not required to be embedded directly in
      the canonical metadata object.
- [x] Parser version is not part of the immutable raw capture contract.
- [x] Normalization version is not part of the immutable raw capture
      contract.
- [x] Canonical event or instrument identity is not required by the raw
      capture contract.
- [x] No market observation fields are included in `RawSnapshot`.

### Failure Behavior

This task defines the contract for successfully persisted raw capture
evidence.

Behavior for:

- failed browser navigation;
- blocked access;
- CAPTCHA encounters;
- HTTP failures;
- partially completed capture attempts

is intentionally deferred.

TASK-001 must not silently define those attempts as `RawSnapshot`
records.

---

## 7. Invariants

The implementation must preserve these invariants:

- successfully persisted raw snapshots are immutable evidence;
- raw evidence remains separate from normalized interpretation;
- historical observations are not represented by mutating a raw
  snapshot;
- source identity is preserved;
- capture timestamp semantics are explicit;
- missing values remain missing;
- capture time is never substituted for source event time;
- identical content captured at different times must be representable
  as distinct captures;
- the contract must not manufacture order-by-order historical events;
- no source-specific DOM representation belongs in canonical schemas.

---

## 8. Expected Architecture

TASK-001 owns only the schema boundary:

```text
packages/schemas
    │
    └── raw capture contract
```

Future architecture may consume that contract:

```text
Browser Collector
      ↓
RawSnapshot metadata
      +
Immutable raw artifacts
      ↓
Parser
      ↓
Normalization
      ↓
Market observations
```

The latter stages are not implemented in TASK-001.

The contract must not depend on:

```text
apps/collector
packages/source-adapters
packages/normalization
packages/diff-engine
replay
cpp/matching-engine
```

---

## 9. Acceptance Criteria

TASK-001 is complete when:

- [x] `RawSnapshot` and supporting canonical types exist under
      `packages/schemas`.
- [x] The contract contains stable snapshot identity, source identity,
      source URL, capture timestamp, explicit content-hash metadata,
      and immutable artifact references.
- [x] Content hash and snapshot identity are distinct concepts.
- [x] HTML and screenshot artifacts can be represented where present.
- [x] Missing optional evidence can remain absent.
- [x] No bid, ask, depth, trade, ticket, event, instrument, or market
      mechanism fields exist on the raw capture contract.
- [x] No parser or normalization version is attached to the immutable
      evidence record.
- [x] No browser, database, object-store client, replay, or C++ code is
      introduced.
- [x] TypeScript validation succeeds.
- [x] Tests appropriate to the contract succeed.
- [x] `./scripts/verify.sh` succeeds with zero failures.
- [x] Independent verifier result is PASS.

---

## 10. Validation Plan

Run:

```bash
./scripts/verify.sh
```

TASK-001 should also introduce the minimum canonical command necessary
to verify the TypeScript schema implementation.

Validation must demonstrate:

- the schema/type definitions compile;
- snapshot identity and content hash are distinct;
- timestamp semantics are explicit;
- artifact optionality is represented intentionally;
- normalized market fields are not part of this contract.

Do not add unrelated application tooling solely for validation.

---

## 11. Documentation Impact

Expected documentation effects:

- [x] none during implementation
- [x] `docs/01_CURRENT_STATE.md` — closeout: implemented capability and
      roadmap phase
- [ ] `docs/02_DECISION_LOG.md` — reviewed; no new decision
- [ ] `docs/03_OPEN_QUESTIONS.md` — reviewed; Q-004 through Q-010 remain
      open
- [x] `docs/04_ROADMAP.md` — closeout: Phase 0 complete; Phase 1 in
      progress
- [ ] `docs/architecture/`
- [ ] other:

Implementation choices made only to complete TASK-001 must not be
promoted into project decisions automatically.

Closeout updated current state and the roadmap because the repository
now has an implemented raw-snapshot contract and Phase 0 exit
conditions are met. It did not record local representation choices as
decisions.

---

## 12. Risks / Unknowns

### Intentionally Deferred

- exact persistence backend;
- object-storage provider;
- PostgreSQL schema;
- requested URL versus final URL modeling;
- redirect-chain representation;
- HTTP response metadata;
- browser viewport metadata;
- user-agent metadata;
- retention policy;
- capture scheduling;
- source-specific access policy;
- failed-capture representation;
- replay semantics.

### Local Implementation Choices

The implementation may choose minimal technical details needed to make
the contract executable and testable, such as:

- TypeScript configuration;
- package layout;
- test framework;
- identifier representation;
- initial supported hash algorithm representation.

These choices must not be recorded as permanent project decisions
unless explicitly accepted.

---

## 13. Implementation Notes

The canonical `RawSnapshot` contract and the minimum TypeScript tooling
to typecheck and test it are implemented.

Local choices, which are not project decisions:

- `CapturedAt` is a UTC ISO-8601 instant matching
  `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$` that `Date.parse`
  accepts and whose UTC calendar fields match the original text, so
  overflow dates are rejected. The caller's string is preserved.
- Content hashes are represented only as SHA-256 lowercase hex digests.
  The contract does not define which bytes are hashed.
- Snapshot, source, URL, capture-time, hash, and artifact-locator values
  are branded strings. Artifact absence is `null`.
- Validation is a hand-written parser. Tests use `node:test` on
  JavaScript emitted by `tsc`. Node 18.19.1 does not run TypeScript
  directly.
- Artifact locators are storage-agnostic non-empty strings.

Implementation did not change `docs/00` through `docs/04`.

Independent verification result is PASS. See Section 14.

Closeout updated `docs/01_CURRENT_STATE.md` and `docs/04_ROADMAP.md`.
It did not add a decision or resolve an open question.

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-27  

### Evidence

The verifier inspected the repository read-only, including `AGENTS.md`,
this task, `docs/00_PROJECT_CHARTER.md` through `docs/04_ROADMAP.md`,
the data-integrity and TypeScript rules, `packages/schemas/src/`,
`package.json`, `tsconfig.json`, and `scripts/verify.sh`.

On Node v18.19.1, from the repository root:

- `npm run typecheck` exited 0.
- `npm test` exited 0 (5 passed, 0 failed).
- `./scripts/verify.sh` exited 0 (`passed: 48`, `failed: 0`,
  `warnings: 0`).

Every Section 9 acceptance criterion passed. `RawSnapshot` is only
immutable successful-capture evidence. Snapshot identity is distinct
from content hash. `capturedAt` is capture time only. Absent artifacts
stay absent. Market, event, instrument, parser, and normalization
fields are not part of the contract. No browser, database, object-store,
replay, or C++ implementation was added.

D-001 through D-007 were not extended. Q-004 through Q-010 remain open.
SHA-256, branded strings, `null` absence, `node:test`, and timestamp
encoding remain local choices recorded in Section 13.

### Findings

No correctness or architecture findings. No test gap blocks completion.

Some behaviors passed an external probe and are not locked in
`raw-snapshot.test.ts`: issue paths, one artifact absent while the
other is present, URL text that `URL.href` would rewrite, offset
timestamps, and a one-digit fractional second. Those gaps do not
require changes.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-27  
**Final Commit / PR:** none  

### Summary

TASK-001 delivered the canonical `RawSnapshot` contract in
`packages/schemas` and the minimum TypeScript tooling required to
typecheck and test it. `./scripts/verify.sh` runs that validation.

The contract describes one successfully persisted immutable capture:
stable snapshot identity distinct from content hash, source identity,
source URL, capture time only, explicit content-hash metadata, and
optional references to separately stored raw HTML and screenshot
artifacts. It does not embed artifact bytes, market observations,
parser or normalization versions, or a market mechanism.

### Follow-Up Tasks

Expected future work may include:

- artifact-storage implementation;
- single-page browser capture;
- first source adapter;
- normalized market observation;
- scheduled historical collection.

These are not part of TASK-001.