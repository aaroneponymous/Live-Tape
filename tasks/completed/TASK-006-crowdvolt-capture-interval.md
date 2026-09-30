# Task: CrowdVolt Capture Interval Gate

**ID:** TASK-006  
**Status:** DONE  
**Created:** 2026-09-30  
**Updated:** 2026-09-30  
**Owner:**  
**Related Decisions:** D-008  
**Related Open Questions:** Q-004, Q-006  

This task does not answer Q-004 for other sources and does not decide
Q-006 (sampling / snapshot frequency as a Live Tape product choice).
The 60-minute value is CrowdVolt's written permission limit, not a
Q-006 decision.

---

## 1. Goal

1. Replace obsolete committed-registry tests that still assume every
   source is fail-closed (zero ALLOWED, CrowdVolt RESTRICTED, Shotgun
   UNKNOWN on the committed file).
2. Represent CrowdVolt's written authorization limit — at most one
   automated capture per event every 60 minutes — as registry data,
   validate it, and expose a pure timing gate a future orchestrator
   can call.

This does NOT enable unattended CrowdVolt collection. There is no
scheduler and no durable capture history. BrowserCapture stays
permission-agnostic and rate-limit-agnostic.

---

## 2. Why This Exists

CrowdVolt written authorization evidence exists at
`docs/source-access/crowdvolt-approval-2026-09-28.md` (section 7):
one automated capture per event every 60 minutes.

The committed registry already marks CrowdVolt ALLOWED for
`browser_capture`, but obsolete tests still assume RESTRICTED /
UNKNOWN rows, and no registry field or pure function encodes the
interval limit for a future orchestrator.

---

## 3. Context

- D-008: collection allowed only when status is ALLOWED and the mode
  is granted. D-008 does not decide snapshot frequency (Q-006).
  `canCollect` remains static source/mode authorization only.
- CrowdVolt evidence: `docs/source-access/crowdvolt-approval-2026-09-28.md`.
- Resident Advisor, DICE, and Shotgun config rows are already ALLOWED
  with `browser_capture`, `WRITTEN_PERMISSION`, and evidence paths
  pointing at approval files that are absent from the repository.
  Those three rows are left unchanged by this task.
- TASK-005 (source-access registry) is completed.

---

## 4. In Scope

- Add CrowdVolt `constraints.minimumIntervalSeconds: 3600` to
  `config/source-access.json`.
- Extend `packages/source-access` parsing to validate optional
  `constraints` with exact key `minimumIntervalSeconds` (positive safe
  integer).
- Add pure `canCollectAt(registry, sourceId, mode, { now,
  lastSuccessfulCaptureAt })`.
- Update `packages/source-access` tests for committed rows and timing
  semantics using deterministic fixed timestamps.
- Create this task file from `tasks/TEMPLATE.md`.

---

## 5. Out of Scope

- No scheduler, orchestrator, adapter, Playwright, network, sleep,
  retry, or file/database writes.
- No global in-memory capture history.
- Do not change `canCollect`'s meaning.
- Do not change Resident Advisor, DICE, or Shotgun registry entries.
- Do not edit `docs/research/sources/crowdvolt.md`, Q-004,
  `docs/01_CURRENT_STATE.md`, `docs/04_ROADMAP.md`, or D-008.
- Do not create a D-xxx decision.
- Do not rewrite TASK-005.
- Do not add dependencies.
- Do not add a policy DSL or generic rate-limit language.
- Do not modify BrowserCapture or `capturePage`.
- Do not start collection.

---

## 6. Requirements

### Functional

- [x] CrowdVolt entry includes `constraints.minimumIntervalSeconds`
  equal to 3600; other CrowdVolt fields unchanged.
- [x] `constraints` is optional; when present requires exact key
  `minimumIntervalSeconds` as a positive safe integer; unknown keys
  and empty objects are rejected.
- [x] `canCollectAt` shares static authorization with `canCollect`,
  then applies timing only when a minimum interval exists.
- [x] First capture (`lastSuccessfulCaptureAt === null`) allows when
  statically allowed.
- [x] Elapsed &lt; interval denies with
  `minimum_interval_not_elapsed` and deterministic `retryAt`.
- [x] Elapsed &gt;= interval allows.
- [x] Invalid timing context fails closed with
  `invalid_timing_context` when a constraint exists.
- [x] Sources without a minimum interval are not throttled.

### Data / Domain

- [x] Timestamp contract: UTC forms
  `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss.sssZ` (1–3 fractional
  digits); compare via integer milliseconds.
- [x] Parsed constraints are frozen; optional property omitted when
  absent (`exactOptionalPropertyTypes`).

### Failure Behavior

- [x] Existing fail-closed config and static authorization rules remain.
- [x] Bad caller timing input does not throw; returns
  `allowed: false` with `invalid_timing_context`.
- [x] Static denials do not inspect timestamps.

---

## 7. Invariants

- `canCollect` remains static source/mode authorization only.
- BrowserCapture remains permission-agnostic and rate-limit-agnostic.
- No module-level capture history; no side effects from
  `canCollectAt`.
- Authorization constraint is represented and the timing rule is
  testable; unattended CrowdVolt collection is not enabled.
- Resident Advisor, DICE, and Shotgun rows remain unchanged.

---

## 8. Expected Architecture

```text
config/source-access.json
        ↓
packages/source-access (load + validate + canCollect / canCollectAt)
        ↓
future orchestrator (owns durable per-event capture history)
```

`canCollectAt` is a pure decision helper. The caller must supply the
previous successful capture time for the same event/target.

---

## 9. Acceptance Criteria

- [x] Committed CrowdVolt entry matches ALLOWED /
  `browser_capture` / `WRITTEN_PERMISSION` / evidence path /
  `minimumIntervalSeconds === 3600`.
- [x] Other three committed entries match the current config exactly
  and have no minimum interval.
- [x] Timing cases at fixed anchor `2026-09-28T12:00:00.000Z` pass
  (null allow; 59m deny; 59m59s deny; exactly 60m allow; later allow;
  deterministic `retryAt`).
- [x] Static denials precede timing; unconstrained sources not
  throttled; invalid constraints and timing fail closed.
- [x] `npm run typecheck`, `npm test`, and `./scripts/verify.sh` pass.
- [x] Direct committed-registry exercise of `canCollect` /
  `canCollectAt` matches expected allow/deny/`retryAt` results.

---

## 10. Validation Plan

```bash
npm run typecheck
npm test
./scripts/verify.sh
```

Plus a direct Node exercise of the loaded committed registry for
CrowdVolt `canCollect` / `canCollectAt` cases.

No real waiting or timers.

---

## 11. Documentation Impact

- [x] none (canonical docs intentionally unchanged in this
  implementation pass)

Follow-up (later project-state update, not this task): Current State,
Roadmap, Q-004, and possibly D-008 evidence-field revisit.

Do not update those documents in this task.

---

## 12. Risks / Unknowns

- Resident Advisor, DICE, and Shotgun referenced approval files
  (`docs/source-access/resident-advisor-approval-2026-10-16.md`,
  `docs/source-access/dice-approval-2026-10-17.md`,
  `docs/source-access/shotgun-approval-2026-10-18.md`) are absent from
  the repository. Committed-config tests lock the current rows exactly
  and do not claim those missing files were verified. Non-blocking for
  this task; recorded as a remaining issue.
- Unattended CrowdVolt collection still requires a future orchestrator
  with durable per-event history. Intentionally deferred.
- Documentation follow-up for project state / Q-004 / possibly D-008
  evidence fields is intentionally deferred.

---

## 13. Implementation Notes

- Share one internal static-authorization helper so `canCollect` and
  `canCollectAt` stay identical on static checks.
- Do not change existing static denial reason strings.
- UTC-only parsing/formatting; no `Date.now`, no `setTimeout`.
- Fixed test anchor: `2026-09-28T12:00:00.000Z`.

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-30  

### Evidence

Independent verification returned PASS. No required implementation
changes remain.

Inspected the source-access diff, committed registry, timing gate,
TASK-006, CrowdVolt approval section 7, and BrowserCapture.
`npm run typecheck` passed. `npm test` passed (59 tests) when Chromium
could launch. `./scripts/verify.sh` passed.

Direct committed-registry checks: `canCollect` allows CrowdVolt
`browser_capture`. `canCollectAt` allows a first capture, denies 30
minutes after `2026-09-28T12:00:00.000Z` with
`minimum_interval_not_elapsed` and `retryAt`
`2026-09-28T13:00:00.000Z`, and allows exactly 60 minutes after that
timestamp.

### Findings

The 3600-second CrowdVolt path does not throw. A positive safe integer
whose millisecond product exceeds the safe date range can throw when
formatting `retryAt`. That value is not the committed CrowdVolt
constraint. No acceptance change is required.

Resident Advisor, DICE, and Shotgun rows were unchanged. Their
referenced approval files are still absent.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-30  
**Final Commit / PR:** none  

### Summary

CrowdVolt's written 60-minute capture limit is represented as
`constraints.minimumIntervalSeconds: 3600` and enforced by pure
`canCollectAt`. `canCollect` remains static source/mode authorization.
Unattended CrowdVolt collection is not enabled.

### Follow-Up Tasks

- Later project-state documentation update (Current State, Roadmap,
  Q-004, possibly D-008 evidence-field revisit).
- Future orchestrator with durable per-event capture history before
  unattended CrowdVolt collection.
- Resolve absent Resident Advisor / DICE / Shotgun approval evidence
  files referenced by committed config rows.

---

## Post-Closeout Correction — 2026-09-30

A later evidence audit found that the referenced approval documents for
Resident Advisor, DICE, and Shotgun did not exist in the repository.

The production registry was therefore restored to the last
evidence-supported fail-closed states:

- resident-advisor: RESTRICTED
- dice: RESTRICTED
- shotgun: UNKNOWN

CrowdVolt remains ALLOWED for browser_capture under the written
authorization at:
docs/source-access/crowdvolt-approval-2026-09-28.md

This addendum does not alter the historical TASK-006 implementation or
verification result. It records the later correction to production
source state.
