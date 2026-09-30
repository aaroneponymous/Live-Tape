# Task: CrowdVolt Capture Classification

**ID:** TASK-008  
**Status:** DONE  
**Created:** 2026-09-30  
**Updated:** 2026-09-30  
**Owner:**  
**Related Decisions:** D-007, D-008  
**Related Open Questions:** Q-005 (remains open; this task does not close it)

---

## 1. Goal

Provide a pure CrowdVolt-specific classifier that distinguishes a captured
Cloudflare block page from an unconfirmed document, so a blocked or
unconfirmed capture cannot be treated as a market observation.

BrowserCapture success remains distinct from source-page validity. Both
`ACCESS_BLOCKED` and `NOT_CONFIRMED_EVENT_PAGE` stop downstream market
parsing. This task does not create observations.

---

## 2. Why This Exists

TASK-007 showed that `capturePage` can return `ok: true` while storing a
Cloudflare block page rather than a CrowdVolt event page. Without a
source-specific classification step, a successful capture could be
misread as usable market evidence.

This classifier is the smallest gate that keeps blocked and unconfirmed
HTML out of market parsing while Q-005 remains open.

---

## 3. Context

Relevant repository state:

- TASK-007 completed one authorized manual browser capture of a CrowdVolt
  event URL and stored a Cloudflare block page.
- `docs/research/sources/crowdvolt-adapter-reconnaissance.md` records
  that BrowserCapture success does not imply event-page validity.
- D-007 forbids CAPTCHA solving, access-control bypass, and anti-bot
  circumvention.
- D-008 gates automated commercial-source collection through the central
  source-access registry.
- Q-005 remains open: which CrowdVolt market fields are reliably
  observable is still unresolved.
- Neighboring packages already own capture (`browser-capture`),
  artifacts (`artifact-storage`), and authorization (`source-access`).
  Classification belongs in `packages/source-adapters`.

---

## 4. In Scope

- Pure function `classifyCrowdVoltCapturedHtml(html: string)`.
- Result types `CrowdVoltCaptureClassification` and
  `CrowdVoltCaptureClassificationResult`.
- Package export from `packages/source-adapters/src/index.ts`.
- Redacted local Cloudflare-block fixture with structural signals only.
- Deterministic unit tests with no live network and no Playwright.
- Root `tsconfig.json` and `package.json` test wiring for the new package.

---

## 5. Out of Scope

- Live CrowdVolt requests, URL fetches, or Playwright usage.
- Cloudflare bypass, stealth, CAPTCHA solving, proxies, or fingerprint
  evasion.
- CrowdVolt market parsing, scheduling, or orchestration.
- `RawSnapshot` construction or `contentHash` resolution.
- Changes to `packages/artifact-storage`, `packages/browser-capture`,
  `packages/source-access`, `config/source-access.json`, or the CrowdVolt
  authorization record.
- Closing Q-005.
- Canonical documentation updates
  (`docs/01_CURRENT_STATE.md`, `docs/02_DECISION_LOG.md`,
  `docs/03_OPEN_QUESTIONS.md`, `docs/04_ROADMAP.md`) until a later
  verification pass.
- `EXPECTED_EVENT_PAGE` or `UNRECOGNIZED_PAGE` classifications.
- Observation creation or normalization.
- New dependencies (no DOM parser).

This section is important for preventing agent scope creep.

---

## 6. Requirements

### Functional

- [x] `classifyCrowdVoltCapturedHtml` is a pure function with zero imports.
- [x] It returns a frozen result for ordinary input, including empty string,
      and does not throw.
- [x] Classification is `ACCESS_BLOCKED` only when all three Cloudflare
      block groups match; otherwise `NOT_CONFIRMED_EVENT_PAGE`.
- [x] `matchedSignals` uses the fixed semantic names in fixed order and
      reports markers even when classification is
      `NOT_CONFIRMED_EVENT_PAGE`.
- [x] Signals 8–11 may appear in `matchedSignals` but are never sufficient
      alone for `ACCESS_BLOCKED`.

### Data / Domain

- [x] Fixture is a short redacted Cloudflare-block document with no client
      IP, Ray ID value, challenge timestamp token, or other identifying
      tokens.
- [x] No fixture claims to be a valid CrowdVolt event page.
- [x] No Ray ID value or client IP is used as a classification signal.

### Failure Behavior

- [x] Unconfirmed or incomplete HTML returns
      `NOT_CONFIRMED_EVENT_PAGE` rather than throwing.
- [x] Both classifications are intended to stop downstream market parsing;
      this task does not implement that gating.

Requirements should describe observable behavior where practical.

---

## 7. Invariants

- BrowserCapture success is not treated as CrowdVolt event-page validity.
- Classification does not mutate inputs.
- Classification is deterministic for the same HTML string.
- No CAPTCHA solving, access-control bypass, or anti-bot circumvention
  (D-007).
- Q-005 remains open.
- No live network or Playwright in this package path.
- Raw snapshots and observation creation remain out of this task.

---

## 8. Expected Architecture

```text
BrowserCapture / stored HTML fixture
        ↓
classifyCrowdVoltCapturedHtml  (packages/source-adapters)
        ↓
ACCESS_BLOCKED | NOT_CONFIRMED_EVENT_PAGE
        ↓
(future) market parser only after confirmed event page — not this task
```

Ownership:

- `source-adapters` owns CrowdVolt-specific capture classification.
- `browser-capture` remains source-agnostic.
- `source-access` remains authorization-only.
- Classification does not construct `RawSnapshot` or observations.

---

## 9. Acceptance Criteria

- [x] Public API matches the specified types and function signature.
- [x] Redacted fixture classifies as `ACCESS_BLOCKED` with the full ordered
      `matchedSignals` list.
- [x] Empty / minimal / partial-signal HTML classifies as
      `NOT_CONFIRMED_EVENT_PAGE` per the test matrix.
- [x] Result and `matchedSignals` are frozen; repeated calls are deeply equal.
- [x] Classifier source has no import statements and no IO / Playwright /
      ArtifactStore / BrowserCapture / source-access references.
- [x] `EXPECTED_EVENT_PAGE` and `UNRECOGNIZED_PAGE` do not appear in the
      public API or classifier implementation.
- [x] `npm run typecheck`, `npm test`, and `./scripts/verify.sh` pass.
- [x] No live CrowdVolt request was made during implementation.

---

## 10. Validation Plan

```bash
npm run typecheck
npm test
./scripts/verify.sh
```

Additional validation:

- Unit tests against the redacted fixture and synthetic HTML strings.
- Source-text checks that the classifier has no imports and forbidden
  identifiers.
- Fixture-directory check that no file claims to be a valid CrowdVolt
  event page.
- No Playwright and no network in the classifier path.

---

## 11. Documentation Impact

- [ ] none
- [x] `docs/01_CURRENT_STATE.md`
- [ ] `docs/02_DECISION_LOG.md`
- [x] `docs/03_OPEN_QUESTIONS.md` (Q-005 remains open)
- [x] `docs/04_ROADMAP.md`
- [ ] `docs/product/`
- [ ] `docs/architecture/`
- [ ] `docs/research/`
- [ ] `docs/legal/`
- [ ] `docs/experiments/`
- [ ] other:

Implementation does not automatically create a project decision.

Closeout updated Current State, Roadmap, and Q-005 after independent
verification. No new decision was recorded. D-007 and D-008 were not
modified.

---

## 12. Risks / Unknowns

- Cloudflare block markup may change over time (non-blocking; fixture and
  string markers can be updated later).
- A future true CrowdVolt event-page confirmation rule is still UNKNOWN and
  intentionally deferred; this task only rejects blocked / unconfirmed HTML.
- Q-005 remains open (intentionally deferred).
- Whether intermittent non-block failures produce different HTML shapes is
  UNKNOWN (non-blocking for this classifier).

---

## 13. Implementation Notes

Signal names (fixed report order):

1. `cf_wrapper`
2. `cf_error_details`
3. `cf_error_stylesheet`
4. `cf_block_headline`
5. `cf_attention_required_title`
6. `cf_blocked_copy`
7. `cf_unable_to_access`
8. `cf_challenge_script`
9. `cf_ray_id_label`
10. `cf_robots_noindex_nofollow`
11. `cf_captcha_container`

Three-group rule for `ACCESS_BLOCKED` (all required):

- Group 1 — Cloudflare error chrome: `id="cf-wrapper"` and
  `id="cf-error-details"`, plus stylesheet marker
  `id="cf_styles-css"` or `/cdn-cgi/styles/cf.errors.css`.
- Group 2 — block intent: `data-translate="block_headline"` or title text
  exactly `Attention Required! | Cloudflare`.
- Group 3 — block copy: exact `Sorry, you have been blocked` or
  `data-translate="unable_to_access"`.

Otherwise classification is `NOT_CONFIRMED_EVENT_PAGE`.

Fixture redaction: the committed fixture is a short structural document
derived from the TASK-007 Cloudflare block shape. It must not contain a
client IP, Ray ID hex value, challenge `r`/`t` tokens, cookie/IP reveal
scripts, or other identifying tokens. `crowdvolt.com` as the public host
in block copy is allowed.

No live request was made during this task. No Playwright. Classification
uses only string / exact-attribute checks; no DOM parser dependency.

---

## 14. Verification Result

**Verifier:** independent verifier  
**Result:** PASS  
**Date:** 2026-09-30  

### Evidence

Independent verification returned PASS. No required implementation
changes remain.

Closeout inspected `packages/source-adapters` only to confirm the
recorded result. Classifier behavior was not modified.

Closeout validation on 2026-09-30: `npm run typecheck` passed,
`npm test` passed (77 tests), and `./scripts/verify.sh` passed
(48 checks, 0 failures).

### Findings

`packages/source-adapters` contains a pure CrowdVolt captured-HTML
classifier. `ACCESS_BLOCKED` identifies the known Cloudflare block
shape. `NOT_CONFIRMED_EVENT_PAGE` covers every other document. Neither
classification permits market parsing. There is no
`EXPECTED_EVENT_PAGE` classification. No CrowdVolt event-page parser
exists. No positive event-page detector exists. BrowserCapture remains
source-agnostic. Captured block evidence remains preserved.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-30  
**Final Commit / PR:** none  

### Summary

Delivered a pure CrowdVolt captured-HTML classifier in
`packages/source-adapters`. `ACCESS_BLOCKED` identifies the known
Cloudflare block shape. `NOT_CONFIRMED_EVENT_PAGE` covers every other
document. Neither classification permits market parsing. There is no
`EXPECTED_EVENT_PAGE` classification yet. No CrowdVolt event-page
parser exists. No positive event-page detector exists. BrowserCapture
remains source-agnostic. Captured block evidence remains preserved.

No required implementation changes remain.

### Follow-Up Tasks

- Positive CrowdVolt event-page classification and market parsing
  remain blocked until an approved technical access path exists, or a
  later authorized capture actually contains the event page.
- Q-005 remains open. Field reliability is unresolved.
