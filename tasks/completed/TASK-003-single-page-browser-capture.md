# Task: Single-Page Browser Capture

**ID:** TASK-003
**Status:** DONE
**Created:** 2026-09-27
**Updated:** 2026-09-27
**Owner:**
**Related Decisions:** D-003, D-004, D-005, D-006, D-007
**Related Open Questions:** Q-004, Q-005, Q-006, Q-007, Q-008, Q-009, Q-010

---

## 1. Goal

Implement the smallest browser-capture boundary capable of loading one
controlled page, capturing raw HTML and a screenshot, storing those
artifacts through the existing ArtifactStore, and returning explicit
capture metadata and artifact references.

This task establishes browser capture mechanics.

It does not yet implement a marketplace-specific source adapter.

---

## 2. Why This Exists

TASK-001 established the canonical RawSnapshot contract.

TASK-002 established immutable artifact storage.

The next Phase 1 capability is browser capture:

```text
page
  ↓
browser capture
  ↓
HTML bytes + screenshot bytes
  ↓
ArtifactStore
  ↓
artifact references + integrity metadata
```

Before Live Tape observes a real marketplace, the project must prove
that one page can be captured reproducibly and preserved as immutable
evidence.

---

## 3. Context

Implemented capabilities:

- canonical RawSnapshot schema;
- immutable filesystem artifact storage;
- TypeScript typechecking and tests;
- canonical verification through `./scripts/verify.sh`.

Not implemented:

- browser capture;
- source adapters;
- source-specific parsing;
- normalization;
- PostgreSQL persistence;
- scheduling;
- historical export.

Important unresolved issue:

`RawSnapshot.contentHash` exists, but the project has not defined which
bytes that field commits to.

TASK-003 must not silently define that preimage.

---

## 4. In Scope

TASK-003 includes:

- introducing Playwright for browser automation;
- defining a narrow browser-capture boundary;
- loading one explicitly supplied URL;
- obtaining the page HTML as bytes;
- obtaining a screenshot as bytes;
- storing both through the existing ArtifactStore;
- returning the resulting ArtifactReferences;
- preserving the requested source URL;
- recording an explicit capture timestamp;
- exposing enough structured capture output for later snapshot assembly;
- using a controlled local test page or equivalent deterministic test
  fixture;
- structured browser/capture failures;
- tests for the capture boundary;
- integrating the new tests into canonical validation.

---

## 5. Out of Scope

TASK-003 must not implement:

- CrowdVolt;
- DICE;
- Resident Advisor;
- Shotgun;
- any real marketplace adapter;
- event discovery;
- selectors for ticket-market data;
- parsing;
- normalization;
- bids;
- asks;
- depth;
- ticket classes;
- event identity;
- PostgreSQL;
- scheduling;
- recurring capture;
- login automation;
- CAPTCHA handling;
- proxy rotation;
- anti-bot circumvention;
- replay;
- C++;
- matching;
- payments.

Do not resolve Q-004 through Q-010.

---

## 6. Requirements

### Browser Capture

- [x] A narrow capture service/function exists.
- [x] It accepts an explicit absolute page URL.
- [x] It loads that page using Playwright.
- [x] It captures raw page HTML.
- [x] It captures a screenshot.
- [x] HTML and screenshot are converted to raw bytes before storage.
- [x] Both artifacts are stored through ArtifactStore.
- [x] The browser-capture layer does not write artifact files directly.

### Capture Output

- [x] Capture output includes the source URL.
- [x] Capture output includes one explicit capture timestamp.
- [x] Capture output includes the HTML ArtifactReference.
- [x] Capture output includes the screenshot ArtifactReference.
- [x] Capture output preserves artifact integrity metadata returned by
      the ArtifactStore where needed.
- [x] Capture output does not contain parsed event or market fields.

### RawSnapshot Boundary

- [x] TASK-003 must explicitly determine whether a complete
      `RawSnapshot` can be constructed without inventing the preimage of
      `RawSnapshot.contentHash`.
- [x] If not, return an intermediate capture result rather than
      manufacturing a RawSnapshot.
- [x] Do not assign the HTML artifact hash, screenshot hash, or an
      arbitrary combined hash to `RawSnapshot.contentHash` without an
      accepted definition.
- [x] Do not modify RawSnapshot semantics merely to make this task
      convenient.

### Source Access

- [x] Tests use a controlled local page or another source whose use does
      not require resolving Q-004.
- [x] No access-control circumvention is introduced.
- [x] The task must not imply that any commercial ticket source has been
      approved for automation.

### Failure Behavior

Structured failures should distinguish where practical:

- invalid URL;
- browser launch failure;
- navigation failure;
- page capture failure;
- screenshot failure;
- artifact persistence failure.

Do not convert failed capture attempts into successful RawSnapshot
records.

---

## 7. Invariants

The implementation must preserve:

- raw evidence is captured before interpretation;
- HTML and screenshot bytes are preserved through ArtifactStore;
- browser capture does not parse market state;
- browser capture does not infer event identity;
- capture time is not source event time;
- failed capture attempts are not successful snapshots;
- no missing value is fabricated;
- no access-control circumvention is implemented;
- artifact storage remains the owner of artifact persistence;
- browser code does not mutate previously persisted evidence;
- RawSnapshot.contentHash semantics remain unresolved unless explicitly
  accepted elsewhere.

---

## 8. Expected Architecture

```text
controlled page
      ↓
Playwright
      ↓
BrowserCapture
      │
      ├── HTML bytes
      └── screenshot bytes
              ↓
         ArtifactStore
              ↓
     ArtifactReferences
              ↓
       Capture Result
```

Potential later flow:

```text
Capture Result
      ↓
RawSnapshot assembly
      ↓
Source Adapter / Parser
```

TASK-003 owns only the first section.

Do not introduce dependencies on:

```text
packages/source-adapters
packages/normalization
packages/diff-engine
replay
cpp/matching-engine
```

---

## 9. Acceptance Criteria

TASK-003 is complete when:

- [x] Playwright is integrated with the TypeScript project.
- [x] A controlled page can be loaded.
- [x] Its HTML is captured and stored through ArtifactStore.
- [x] Its screenshot is captured and stored through ArtifactStore.
- [x] Retrieved HTML bytes match the captured HTML bytes.
- [x] Retrieved screenshot bytes match the captured screenshot bytes.
- [x] Capture output contains source URL and capture time.
- [x] Capture output contains storage-agnostic references.
- [x] No source-specific parsing exists.
- [x] No real ticket marketplace integration exists.
- [x] No access-control circumvention exists.
- [x] Failed navigation does not produce a successful capture result.
- [x] RawSnapshot.contentHash preimage is not silently defined.
- [x] Q-004 through Q-010 remain unresolved.
- [x] TypeScript typechecking succeeds.
- [x] Browser-capture tests succeed.
- [x] `./scripts/verify.sh` succeeds with zero failures.
- [x] Independent verifier result is PASS.

---

## 10. Validation Plan

Run:

```bash
npm run typecheck
npm test
./scripts/verify.sh
```

Tests should cover at minimum:

### Successful Capture

- controlled page loads;
- HTML bytes are captured;
- screenshot bytes are captured;
- both are persisted through ArtifactStore;
- both can be retrieved byte-for-byte.

### Capture Metadata

- requested URL is preserved;
- capture time exists and has capture-time semantics.

### Failure

- invalid URL;
- unreachable page or navigation failure;
- artifact-storage failure.

### Boundary

Verify no dependency is introduced on:

- real ticket sources;
- source adapters;
- normalization;
- PostgreSQL;
- replay;
- C++.

---

## 11. Documentation Impact

Expected initially:

- [x] none during implementation
- [x] `docs/01_CURRENT_STATE.md` — closeout: single-page browser capture exists
- [ ] `docs/02_DECISION_LOG.md` — reviewed; no new decision
- [ ] `docs/03_OPEN_QUESTIONS.md` — reviewed; Q-004 through Q-010 remain
      open
- [x] `docs/04_ROADMAP.md` — closeout: Phase 1 progress notes single-page
      capture; Phase 1 remains in progress
- [ ] `docs/architecture/`

At closeout, reassess Current State because browser capture will then be
implemented.

Closeout updated current state and the Phase 1 progress note because
single-page browser capture now exists. It did not add a decision,
resolve an open question, or define `RawSnapshot.contentHash`. Phase 1
remains in progress.

Do not create a new D-xxx decision merely because this task selects:

- Playwright;
- a particular browser;
- screenshot format;
- test server implementation;
- navigation timeout;
- browser-launch flags.

---

## 12. Risks / Unknowns

### Blocking Design Question

`RawSnapshot.contentHash` has no accepted preimage definition.

The researcher must determine whether TASK-003 can produce a complete
RawSnapshot without resolving that semantic.

If not, implementation should produce an intermediate capture result
and leave RawSnapshot assembly for a later task.

Do not invent a definition solely to satisfy the type.

### Intentionally Deferred

- real source selection;
- source automation permission;
- requested URL versus final redirected URL semantics;
- page readiness semantics for marketplace pages;
- authentication;
- scheduling;
- retry strategy;
- capture frequency;
- canonical event identity;
- ticket normalization.

---

## 13. Implementation Notes

Research on 2026-09-27 determined that TASK-003 cannot construct a valid
`RawSnapshot`. `contentHash` is required, `parseRawSnapshot` rejects a
missing value, and `packages/schemas/src/raw-snapshot.ts` does not define
which bytes that field hashes. Assigning the HTML hash, the screenshot
hash, or any combined hash would define that preimage. This task returns
an intermediate browser-capture result and does not assemble
`RawSnapshot`.

`apps/collector/` owns no TypeScript. Implemented modules live under
`packages/*`, and `tsconfig.json` has `rootDir: "packages"`. Own this
boundary in `packages/browser-capture`. That package name is a local
layout choice, not a new decision.

### Local choices

These are local implementation choices. They are not new D-xxx decisions
and they do not resolve Q-004 through Q-010.

- Playwright is a root devDependency, used as a library from `node:test`.
  Do not adopt the Playwright test runner.
- Browser: headless Chromium, Playwright defaults. No stealth, proxy,
  custom user-agent, or access-control circumvention.
- HTML bytes: UTF-8 encoding of `page.content()` after `load`. This is
  the serialized document Playwright returns, not the raw network body.
- Screenshot bytes: PNG from `page.screenshot({ type: "png" })`, default
  viewport, not `fullPage`.
- `capturedAt`: one UTC instant from an injectable clock, formatted with
  `Date.toISOString()`, stamped only after both byte captures succeed and
  before persistence. Capture time only. No `sourceEventAt`.
- `sourceUrl`: the requested absolute `http:` or `https:` URL string,
  unchanged. Do not record the post-redirect URL. Do not change
  `SourceUrl`'s schema, which still accepts any absolute URL.
- Navigation timeout defaults to 15 seconds and may be overridden per
  call. `waitUntil` is `"load"`.
- Browser binaries are installed with an explicit
  `npm run install-browsers` (`playwright install chromium`). `verify.sh`
  and `npm test` must not download browsers.

### Capture API

One function, `capturePage`, accepts the requested URL, an injected
`ArtifactStore`, an optional clock, an optional navigation timeout, and
an optional page opener used by tests. The default opener launches
Playwright. No dependency-injection framework.

Success result fields:

- `sourceUrl`
- `capturedAt`
- `html` — `ArtifactReference` from `ArtifactStore.put`
- `screenshot` — `ArtifactReference` from `ArtifactStore.put`
- `htmlContentHash` — per-artifact hash returned by `put`
- `screenshotContentHash` — per-artifact hash returned by `put`

Do not include `snapshotId`, `sourceId`, `RawSnapshot`,
`RawSnapshot.contentHash`, parsed market fields, or `sourceEventAt`.

Failure result: `{ ok: false, code, message }` with these codes where
the failure is distinguishable:

- `invalid_url`
- `browser_launch_failure`
- `navigation_failure`
- `html_capture_failure`
- `screenshot_failure`
- `artifact_persistence_failure`

A failed attempt must not be returned as `ok: true`.

### Persistence order

1. Validate the URL before launching a browser.
2. Open the page.
3. Read HTML bytes, then screenshot bytes.
4. Stamp `capturedAt`.
5. `put` the HTML bytes as `"html"`.
6. `put` the screenshot bytes as `"screenshot"`.

The browser-capture module must not write artifact files and must not
import the filesystem store's layout. If HTML `put` succeeds and a later
step fails, leave the stored HTML in place. Do not delete immutable
evidence. Still return a failure, not a success result. If screenshot
byte capture fails before any `put`, nothing is stored.

Close the browser on both success and failure.

### Tests

Use `node:test` and a `node:http` fixture on `127.0.0.1` with an
ephemeral port. The fixture HTML includes a stable marker,
`data-live-tape-fixture="task-003"`. Use a temp
`FilesystemArtifactStore` for the success path.

Assert:

- stored HTML bytes contain the fixture marker and round-trip through
  `get` equal to the bytes passed to `put`;
- stored screenshot bytes round-trip through `get` and begin with the
  PNG signature;
- `sourceUrl` equals the requested URL string;
- `capturedAt` equals the injected clock's UTC instant;
- invalid URLs, launch failure, navigation failure, HTML capture
  failure, screenshot failure, and artifact persistence failure each
  return the matching code and `ok: false`;
- when HTML persistence succeeds and screenshot persistence fails, the
  HTML artifact remains readable and the capture result is not
  successful.

Do not assert a golden screenshot hash across machines.

Wire the new compiled test into the root `npm test` script and include
the package in `tsconfig.json`. Add `packages/browser-capture/**` to the
data-integrity Cursor rule glob so that rule attaches to this package.

Do not modify `RawSnapshot`, `parseRawSnapshot`, or `ArtifactStore`
semantics. Do not modify canonical docs during implementation. Do not
mark this task DONE. After implementation, set status to VERIFYING and
leave Section 14 as NOT RUN.

### Implemented

Built `packages/browser-capture` with `capturePage`, injectable
`PageOpener`, and `node:test` coverage against a local `node:http`
fixture. Playwright is a root `devDependency`; Chromium is installed
only via `npm run install-browsers` (`playwright install chromium`).
`npm test` and `./scripts/verify.sh` do not download browsers. Status
set to VERIFYING; Section 14 left as NOT RUN.

Independent verification result is PASS. See Section 14.

Closeout updated `docs/01_CURRENT_STATE.md` and the Phase 1 progress
note in `docs/04_ROADMAP.md`. It did not add a decision or resolve an
open question. Phase 1 remains in progress. Browser capture does not
construct `RawSnapshot`. `RawSnapshot.contentHash` preimage remains
unresolved.

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-27  

### Evidence

Independent verification returned PASS. No required implementation
changes remain.

The capture boundary loads one explicitly supplied absolute http or
https URL, captures serialized HTML and a PNG screenshot, and persists
both through ArtifactStore. A successful result includes `sourceUrl`,
`capturedAt`, the HTML artifact reference and hash, and the screenshot
artifact reference and hash. Retrieved bytes match the stored bytes.
Failed capture attempts are not successful results. The result does
not construct `RawSnapshot` and does not define
`RawSnapshot.contentHash`. Q-004 through Q-010 remain unresolved. No
real ticket-source adapter, parser, normalization, PostgreSQL,
scheduling, or historical export was added.

Playwright, Chromium, `page.content()`, PNG, package location, timeout
behavior, and browser flags remain local choices recorded in Section
13. They were not promoted to architecture decisions.

Closeout revalidation on 2026-09-27: inside Cursor's default sandbox,
the two tests that launch Chromium failed. The local-fixture capture
returned a failed result, and the unreachable-port test returned
`browser_launch_failure` rather than `navigation_failure`. Outside
that sandbox, `./scripts/verify.sh` passed (`passed: 48`, `failed: 0`,
`warnings: 0`) and `npm test` passed (37 tests, 0 failures).
Implementation was not changed.

### Findings

No correctness or architecture findings require changes.

Non-blocking environment notes:

- Browser tests require an environment in which Chromium is permitted
  to launch.
- Cursor's default sandbox blocked Chromium during verification.
- The same browser tests passed unsandboxed.
- Chromium installation remains explicit through the repository's
  browser-install command (`npm run install-browsers`).
- `npm test` and `./scripts/verify.sh` must not download browsers
  automatically.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-27  
**Final Commit / PR:** none  

### Summary

TASK-003 delivered a single-page browser capture boundary in
`packages/browser-capture`. It loads an explicitly supplied absolute
http or https URL, captures serialized HTML and a PNG screenshot, and
persists both artifacts through ArtifactStore. The success result
includes `sourceUrl`, `capturedAt`, the HTML artifact reference and
hash, and the screenshot artifact reference and hash.

The result is intermediate. It does not construct `RawSnapshot` and
does not define the preimage of `RawSnapshot.contentHash`. It does not
parse market state or integrate a real ticket source.

### Follow-Up Tasks

Browser tests require an environment in which Chromium is permitted to
launch. Cursor's default sandbox blocked Chromium during verification.
The same browser tests passed unsandboxed. Chromium installation
remains explicit through `npm run install-browsers`. `npm test` and
`./scripts/verify.sh` must not download browsers automatically.

Expected later work:

- RawSnapshot assembly once a content-hash preimage is accepted;
- first approved source adapter;
- normalized market observations;
- diff/change detection;
- scheduling and unattended collection.

These are not part of TASK-003. Q-004 through Q-010 remain open.
