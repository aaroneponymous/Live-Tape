# Live Tape — Roadmap

**Last Updated:** 2026-09-30

---

# Phase 0 — Project Operating System

Status: COMPLETE

Completed: 2026-09-27

Goals:

- canonical project documentation;
- agent rules;
- repeatable development workflow;
- validation tooling.

Exit Criteria:

- new AI session can reconstruct project state from repository;
- decisions and unknowns are clearly separated;
- Cursor reliably follows project instructions.

The repository contains canonical docs, Cursor rules, researcher /
implementer / verifier agents, the implement-feature and
update-project-state skills, task contracts, and `scripts/verify.sh`.
Decisions D-001 through D-007 are separate from open questions Q-001
through Q-010. TASK-001 completed that workflow through independent
verification.

---

# Phase 1 — Historical Data Collector

Status: IN PROGRESS

Goals:

- browser orchestrator;
- immutable snapshots;
- first source adapter;
- normalized observations;
- provenance.

Exit Criteria:

- one approved source;
- five events;
- 72 hours unattended;
- captures traceable to raw evidence.

Progress:

- RawSnapshot foundation complete.
- Immutable artifact storage complete.
- Single-page browser capture complete. Capture returns an
  intermediate result and does not construct `RawSnapshot`.
- First-source research complete.
- Central source-access registry complete. Automated commercial-source
  collection fails closed unless a source and the requested mode are
  explicitly `ALLOWED` (D-008).
- CrowdVolt `browser_capture` authorization recorded (`ALLOWED`,
  `WRITTEN_PERMISSION`; evidence
  `docs/source-access/crowdvolt-approval-2026-09-28.md`).
- CrowdVolt 60-minute per-event authorization constraint represented
  (`minimumIntervalSeconds: 3600`).
- Timing eligibility logic exists (`canCollectAt`).
- One manual CrowdVolt `browser_capture` was stored (TASK-007). The
  artifacts are a Cloudflare block page, not an event market. See
  `docs/research/sources/crowdvolt-adapter-reconnaissance.md`.

Still outstanding:

- CrowdVolt source adapter. Extraction strategy is undecided until an
  authorized capture returns the event page. A Cloudflare block must
  fail closed, without access-control circumvention (D-007).
- Durable per-event capture history.
- Scheduler / orchestrator.
- Enforcement of `canCollect` / `canCollectAt` before unattended
  capture.
- Normalized observations.
- Repeated authorized field-reliability testing (Q-005).
- Five-event experiment.
- 72-hour unattended collection.

Unattended CrowdVolt collection is not enabled. Resident Advisor and
DICE remain `RESTRICTED`. Shotgun remains `UNKNOWN`. Phase 1 is not
complete.

PostgreSQL persistence and historical export are not implemented. No
production object-storage provider has been selected.

---

# Phase 2 — Historical Dataset

Goals:

- canonical event model;
- instrument model;
- observation history;
- Parquet export;
- DuckDB analysis;
- initial charts.

---

# Phase 3 — Market Research and Validation

Goals:

- analyze spreads;
- time-to-event behavior;
- sellout effects;
- secondary premiums;
- source differences;
- event-market liquidity.

Manual marketplace pilot may run in parallel.

---

# Phase 4 — Replay and Market Simulation

Goals:

- stable replay format;
- C++ replay reader;
- continuous order-book simulator;
- auction simulator;
- comparative market-mechanism analysis.

---

# Phase 5 — Product V1 Decision

Only after sufficient evidence.

Possible outcomes:

- proceed with exchange;
- narrow scope;
- change market structure;
- pivot;
- stop.

Production marketplace infrastructure should not be assumed before this
decision.