# Task: Capture Attempt Timing Semantics

**ID:** TASK-009  
**Status:** DONE  
**Created:** 2026-09-30  
**Updated:** 2026-10-03  
**Owner:**  
**Related Decisions:** D-008, D-009  
**Related Open Questions:** Q-004, Q-006  

This task does not answer Q-004 for other sources and does not answer
Q-006. It does not change sampling semantics. The committed 3600-second
value remains CrowdVolt written-permission configuration, not a Q-006
decision. Implementation did not create D-009. Closeout on 2026-10-03
accepted D-009 after independent verification.

---

## 1. Goal

Correct the source-access timing API so the CrowdVolt 60-minute
authorization interval is based on the previous automated capture
attempt, not on a successful capture or a market observation.

`lastSuccessfulCaptureAt` is replaced by `lastCaptureAttemptAt`. The
old name is not kept as an alias. This is an intentional breaking
TypeScript change.

`lastCaptureAttemptAt` means the UTC instant at which the previous
automated browser-capture attempt for the same source target was
durably claimed before that attempt could send a request.

This task defines that API contract. It does not implement the durable
store or the orchestrator that will own those claims later.

---

## 2. Why This Exists

TASK-006 taught `canCollectAt` to enforce CrowdVolt's written
60-minute limit using a caller-supplied previous success time.
A failed or blocked attempt can still have sent a source request.
Anchoring the next eligible instant on success alone would allow
another automated attempt immediately after a request that may already
have occurred.

The authorization interval has to count from the attempt claim, made
before the request, so a possible source request cannot be followed
immediately by another automated attempt.

---

## 3. Context

- D-008: collection is allowed only when status is ALLOWED and the mode
  is granted. D-008 does not decide snapshot frequency (Q-006).
  `canCollect` remains static source/mode authorization.
- CrowdVolt evidence:
  `docs/source-access/crowdvolt-approval-2026-09-28.md` (one automated
  capture per event every 60 minutes). The committed registry value
  remains `constraints.minimumIntervalSeconds: 3600`.
- TASK-006 added the pure timing gate. TASK-007 recorded one manual
  CrowdVolt capture. TASK-008 classified captured pages. This task does
  not rewrite those completed records.
- Q-004 remains source-specific. Q-006 remains open. This task does not
  answer either question.
- No separate TASK-009 research file exists. The task specification
  given to the implementer is the research contract.

### Timestamp meanings

These instants stay separate. This task does not redefine
BrowserCapture `capturedAt`.

| Field | Meaning |
|---|---|
| `lastCaptureAttemptAt` | Authorization / rate-limit attempt claim, recorded before the request |
| `capturedAt` | Evidence time on a successful BrowserCapture result |
| classification | `ACCESS_BLOCKED`, `NOT_CONFIRMED_EVENT_PAGE`, or a future classification |
| `observedAt` | Future normalized observation time |
| `retryAt` | Next authorization-eligible instant |

`canCollectAt` must not use `capturedAt` as the timing-history field.
It must not import or inspect `ACCESS_BLOCKED`,
`NOT_CONFIRMED_EVENT_PAGE`, `BrowserCaptureResult`, or parser results.
It must not take page classification as input. A supplied
`lastCaptureAttemptAt` inside the interval denies with
`minimum_interval_not_elapsed` regardless of any page outcome.

### Null semantics

`lastCaptureAttemptAt: null` means a successful history read
established that no prior capture-attempt claim exists for this same
target.

`null` does not mean the history lookup failed. The source-access
package cannot verify that distinction. The future orchestrator owns
it. This package does not try to detect lookup failure.

### Historical TASK-007 bound

The recorded next eligible instant for the completed TASK-007 manual
run remains `2026-09-30T19:31:01.194Z`. That historical manual run used
its `capturedAt` (`2026-09-30T18:31:01.194Z`) as the conservative
interval anchor. This task does not invent a synthetic earlier claim
timestamp for that already completed run. Current API documentation
uses `lastCaptureAttemptAt` going forward. TASK-007 is not rewritten.

---

## 4. In Scope

- Rename `CollectAtContext.lastSuccessfulCaptureAt` to
  `lastCaptureAttemptAt` in `packages/source-access`.
- Document the attempt-claim meaning, null semantics, and the future
  orchestrator contract on `canCollectAt` and in this task file.
- Fail closed with `invalid_timing_context` when a constrained source
  is given a missing `lastCaptureAttemptAt` property, or an object that
  contains only `lastSuccessfulCaptureAt`.
- Update source-access timing tests to the new field, including the
  boundary and fail-closed cases in section 6.
- Create this task file from `tasks/TEMPLATE.md`.

---

## 5. Out of Scope

- Scheduler, orchestrator, or durable capture-attempt history.
- Live CrowdVolt request.
- Market parser.
- BrowserCapture changes, including `capturedAt` and `invalid_url`
  behavior.
- Retries, Cloudflare circumvention, or any access-control bypass.
- Creating D-009.
- Changing Q-006 sampling semantics.
- Changing the committed CrowdVolt interval (`3600`) or editing
  `config/source-access.json`.
- Rewriting TASK-006, TASK-007, or TASK-008.
- Updating canonical docs (`docs/01_CURRENT_STATE.md`,
  `docs/02_DECISION_LOG.md`, `docs/03_OPEN_QUESTIONS.md`,
  `docs/04_ROADMAP.md`) or the CrowdVolt approval file.
- Editing `packages/source-adapters`, `packages/browser-capture`,
  `packages/artifact-storage`, or `packages/schemas`.

---

## 6. Requirements

### Functional

- [x] `CollectAtContext` is `{ now, lastCaptureAttemptAt }`.
  `lastSuccessfulCaptureAt` is not an alias and is not on the type.
- [x] `null` `lastCaptureAttemptAt` allows when static authorization
  allows (CrowdVolt `browser_capture`).
- [x] Previous attempt 59 minutes ago denies
  `minimum_interval_not_elapsed`.
- [x] 59 minutes 59 seconds denies.
- [x] Elapsed 3,599,999 ms denies.
- [x] Exactly 3,600,000 ms allows.
- [x] Exactly 60 minutes (`60 * 60 * 1000`) allows.
- [x] More than 60 minutes allows.
- [x] `retryAt` stays deterministic:
  anchor `2026-09-28T12:00:00.000Z` plus 3600 seconds is
  `2026-09-28T13:00:00.000Z`, and `minimumIntervalSeconds` is 3600.
- [x] Malformed `lastCaptureAttemptAt` and a future
  `lastCaptureAttemptAt` deny `invalid_timing_context`.
- [x] A missing `lastCaptureAttemptAt` property denies
  `invalid_timing_context` for CrowdVolt.
- [x] An object that contains only `lastSuccessfulCaptureAt` denies
  `invalid_timing_context` for CrowdVolt.
- [x] Static UNKNOWN, RESTRICTED, unknown-source, and ungranted-mode
  denials happen before timing validation, including when the timing
  object is missing or invalid.
- [x] Sources without `minimumIntervalSeconds` stay unthrottled even
  when `lastCaptureAttemptAt` is recent.
- [x] `canCollectAt` length stays 4. It does not accept page
  classification as an argument.
- [x] Existing `minimumIntervalSeconds` config validation behavior is
  unchanged.

### Data / Domain

- [x] Interval arithmetic is unchanged: deny while elapsed milliseconds
  are strictly less than `minimumIntervalSeconds * 1000`; allow at
  exact equality and after.
- [x] `retryAt` remains `lastCaptureAttemptAt + minimumIntervalSeconds`,
  formatted with `new Date(retryAtMs).toISOString()`.
- [x] The committed CrowdVolt interval remains 3600 seconds.
- [x] `lastCaptureAttemptAt`, `capturedAt`, page classification,
  `observedAt`, and `retryAt` are documented as distinct meanings.

### Failure Behavior

- [x] Preserve deny reasons `minimum_interval_not_elapsed` and
  `invalid_timing_context`.
- [x] Bad caller timing input does not throw.
- [x] A future attempt instant (`lastMs > nowMs`) is
  `invalid_timing_context`.
- [x] The package does not treat lookup failure as `null` and does not
  try to detect lookup failure.

---

## 7. Invariants

- `canCollect` remains static source/mode authorization only.
- BrowserCapture remains permission-agnostic and rate-limit-agnostic.
  `packages/browser-capture` is not modified.
- `canCollectAt` stays pure: no file writes, no timers, no
  `capturePage`, no Playwright, no history storage.
- `loadSourceAccessRegistry` may still read config.
- Timing history belongs to a future orchestrator, not this package.
- Page classification does not change a timing denial.
- The TASK-007 next eligible instant
  `2026-09-30T19:31:01.194Z` remains the historical bound for that
  completed manual run.
- Q-006 is not answered. D-009 was accepted at closeout and does not
  change this implementation.

---

## 8. Expected Architecture

```text
config/source-access.json
        ↓
packages/source-access (load + validate + canCollect / canCollectAt)
        ↓
future orchestrator (owns durable per-target capture-attempt claims)
        ↓
BrowserCapture.capturePage
        ↓
classification (ACCESS_BLOCKED | NOT_CONFIRMED_EVENT_PAGE | future)
```

`canCollectAt` is a pure decision helper. It answers whether the
supplied previous attempt claim is outside the configured minimum
interval. It does not read or write claim history.

### Future orchestrator contract

A future orchestrator must:

1. load the source-access registry;
2. durably read the previous attempt claim for the same source target;
3. fail closed if history cannot be read;
4. call `canCollectAt` using the previous claim instant, or `null` only
   after a successful read establishes no prior claim;
5. if denied, do not capture;
6. if allowed, durably write a new capture-attempt claim BEFORE calling
   `capturePage`;
7. if the claim write fails, do not call `capturePage`;
8. only after the claim is durable may `capturePage` run;
9. do not clear the claim because the capture later produces
   `ACCESS_BLOCKED`, `NOT_CONFIRMED_EVENT_PAGE`, navigation failure,
   HTML capture failure, screenshot failure, invalid clock, artifact
   persistence failure, parser failure, no market observation, or
   process crash after the claim became durable.

Purpose: a source request which may have occurred cannot be followed
immediately by another automated attempt.

### `invalid_url` rollback limitation

BrowserCapture rejects `invalid_url` in `capturePage` BEFORE
`openPage` (`isAllowedCaptureUrl` in
`packages/browser-capture/src/browser-capture.ts`). That is different
from navigation or browser failures.

This task does not build claim storage. A future orchestrator MAY
restore or clear the new claim for a definitively pre-request
`invalid_url` outcome. That rollback must not be generalized to
navigation or browser failures whose request status may be unknown.

---

## 9. Acceptance Criteria

- [x] `CollectAtContext` uses `lastCaptureAttemptAt` and does not
  retain `lastSuccessfulCaptureAt`.
- [x] CrowdVolt timing cases at fixed anchor
  `2026-09-28T12:00:00.000Z` pass: null allow; 59m deny; 59m59s deny;
  3,599,999 ms deny; exactly 3,600,000 ms allow; exactly 60 minutes
  allow; later allow; deterministic `retryAt`
  `2026-09-28T13:00:00.000Z`.
- [x] Missing `lastCaptureAttemptAt`, legacy
  `lastSuccessfulCaptureAt` only, malformed timestamps, and a future
  attempt instant fail closed with `invalid_timing_context` for
  CrowdVolt.
- [x] Static denials precede timing validation even when the timing
  object is missing or invalid.
- [x] Unconstrained sources are not throttled. Existing
  `minimumIntervalSeconds` validation behavior is unchanged.
- [x] `packages/source-access/src/source-access.ts` does not contain
  `ACCESS_BLOCKED`, `NOT_CONFIRMED_EVENT_PAGE`, or
  `BrowserCaptureResult`; does not import browser-capture or
  source-adapters; and does not contain `writeFile`, `setTimeout`,
  `setInterval`, `capturePage`, `playwright`, or `sleep`.
- [x] `npm run typecheck`, `npm test`, and `./scripts/verify.sh` pass.
- [x] Independent verification returned PASS. No required
  implementation changes remain.

---

## 10. Validation Plan

```bash
npm run typecheck
npm test
./scripts/verify.sh
```

Fixed timestamps only. No real timers, network, Playwright, or sleep.
No live CrowdVolt request.

Independent verification is a separate step and is not part of the
implementer pass.

---

## 11. Documentation Impact

Canonical documentation stays unchanged until independent verification.

- [ ] none
- [x] `docs/01_CURRENT_STATE.md`
- [x] `docs/02_DECISION_LOG.md` (D-009 accepted at closeout)
- [x] `docs/03_OPEN_QUESTIONS.md` (Q-006 remains open)
- [x] `docs/04_ROADMAP.md`
- [ ] `docs/product/`
- [ ] `docs/architecture/`
- [ ] `docs/research/`
- [ ] `docs/legal/`
- [ ] `docs/experiments/`
- [x] other: `.cursor/rules/30-typescript.mdc`

Implementation left canonical docs unchanged. Closeout on 2026-10-03
accepted D-009 and recorded the attempt-claim meaning of
`canCollectAt`. Q-004 and Q-005 remain open. Q-006 remains open. The
3600-second CrowdVolt configuration is not a Q-006 decision. D-007
and D-008 were not modified. Completed TASK-006 and TASK-007 records
were not rewritten.

---

## 12. Risks / Unknowns

- Durable per-target attempt history and the orchestrator that must
  claim before `capturePage` are not implemented. Non-blocking for this
  API contract. Intentionally deferred.
- Whether a future orchestrator should roll back a claim on
  `invalid_url` is permitted, not required. Navigation and browser
  failures must not use that rollback. Non-blocking. Intentionally
  deferred with the orchestrator.
- The TASK-007 run has no stored attempt-claim instant earlier than
  its `capturedAt`. Inventing one would falsify that completed run.
  The historical next eligible instant stays
  `2026-09-30T19:31:01.194Z`. Non-blocking.
- Canonical documentation drift was resolved at closeout on
  2026-10-03. Current state, D-009, Q-006, and the roadmap now use
  the attempt-claim meaning. Historical TASK-006 and TASK-007 records
  were left unchanged.
- Resident Advisor, DICE, and Shotgun referenced approval files remain
  absent. Unchanged by this task. Non-blocking.

---

## 13. Implementation Notes

- `CollectAtContext.lastSuccessfulCaptureAt` was removed.
  `lastCaptureAttemptAt` replaced it. `packages/source-access/src/index.ts`
  still exports `CollectAtContext` by the same type name and was not
  modified.
- `isValidTimingContext` and `canCollectAt` read
  `lastCaptureAttemptAt` with `Object.hasOwn`. A missing property, or
  an object that only has `lastSuccessfulCaptureAt`, is
  `invalid_timing_context` for a constrained source such as CrowdVolt.
- Interval comparison is unchanged: `elapsedMs < requiredMs` denies;
  `elapsedMs >= requiredMs` allows, including exact equality.
  `retryAt` is still `new Date(retryAtMs).toISOString()`.
- Static authorization still returns before timing validation.
- `canCollectAt` does not import browser-capture or source-adapters
  and does not name `ACCESS_BLOCKED`, `NOT_CONFIRMED_EVENT_PAGE`, or
  `BrowserCaptureResult`. Those identifiers are recorded in this task
  file. The function comment states that the decision does not take
  page classification, capture results, or parser results as input.
- No claim store, scheduler, retry, or live request was added.
- `config/source-access.json` was not edited. The CrowdVolt interval
  remains 3600.
- Implementer commands on 2026-09-30, after the change: `npm run
  typecheck` passed; `npm test` passed (77 tests, 0 failed); 
  `./scripts/verify.sh` passed (48 checks, 0 failed, 0 warnings).
  Those are implementer checks. They are not an independent verifier
  result.

---

## 14. Verification Result

**Verifier:** independent verifier  
**Result:** PASS  
**Date:** 2026-10-03  

### Evidence

Independent verification returned PASS. No required implementation
changes remain.

Closeout did not modify source-access behavior.

Closeout validation on 2026-10-03: `npm run typecheck` passed. The
expected Playwright Chromium build was absent, so `npm run
install-browsers` installed it. No code was changed for that missing
binary. `npm test` then passed (77 tests, 0 failed), and
`./scripts/verify.sh` passed (48 checks, 0 failed, 0 warnings).

The same three commands were run again after this file moved to
`tasks/completed/`. Typecheck passed, `npm test` passed (77 tests, 0
failed), and `./scripts/verify.sh` passed (48 checks, 0 failed, 0
warnings).

### Findings

`canCollectAt` consumes `lastCaptureAttemptAt`.
`lastSuccessfulCaptureAt` is not part of the live API.
`lastCaptureAttemptAt` is the prior durable pre-request
browser-capture attempt claim for the same source target. The
CrowdVolt interval remains 3600 seconds. Exact interval equality
allows. Malformed, missing, and future attempt timestamps fail closed
for a constrained source. Source-access remains pure and stores no
history.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-10-03  
**Final Commit / PR:** none  

### Summary

`canCollectAt` now uses `lastCaptureAttemptAt`.
`lastSuccessfulCaptureAt` is no longer part of the live API.
`lastCaptureAttemptAt` represents the prior durable pre-request
browser-capture attempt claim for the same source target. The
3600-second CrowdVolt interval is unchanged. Exact interval equality
allows. Malformed, missing, and future attempt timestamps fail closed
for a constrained source. Source-access remains pure and stores no
history.

No required implementation changes remain.

### Follow-Up Tasks

- Durable per-target capture-attempt history and an orchestrator that
  claims before `capturePage`, using the contract in section 8 and
  D-009.
- Q-006 remains open. The 3600-second value is an authorization
  constraint, not a snapshot-cadence decision.
