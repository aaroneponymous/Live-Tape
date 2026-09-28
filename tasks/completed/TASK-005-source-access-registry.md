# Task: Source Access Registry

**ID:** TASK-005  
**Status:** DONE  
**Created:** 2026-09-28  
**Updated:** 2026-09-28  
**Owner:**  
**Related Decisions:** D-007, D-008  
**Related Open Questions:** Q-004, Q-005

---

## 1. Goal

Live Tape can centrally determine whether automated collection from a
named source is permitted for a named collection mode.

A future orchestrator can ask the equivalent of
`canCollect(sourceId, "browser_capture")` and receive an explicit
allowed or denied result with a reason.

No existing source is approved.

---

## 2. Why This Exists

Phase 1 has a raw-snapshot contract, a local artifact store, and
single-page browser capture. TASK-004 recorded that no commercial
source is approved for automated historical collection, and that an
adapter must not start from that research.

Q-004 remains open and is source-specific. D-007 forbids access-control
circumvention. Current state says a source adapter should not begin
until source-access feasibility is resolved for that source.

The missing piece is a fail-closed gate. Without it, a later adapter
or scheduler could embed its own permission assumption.

---

## 3. Context

Canonical state:

- `docs/01_CURRENT_STATE.md` — no commercial source is approved.
- `docs/02_DECISION_LOG.md` — D-007. Next id is D-008.
- `docs/03_OPEN_QUESTIONS.md` — Q-004 and Q-005 stay open.
- `docs/04_ROADMAP.md` — Phase 1 in progress; no approved source.
- `docs/research/sources/` — CrowdVolt, Shotgun, Resident Advisor, and
  DICE, retrieval date 2026-09-27.

Existing collection code:

- `packages/schemas` owns `RawSnapshot`. `SourceId` is documented as
  not an approved-source registry.
- `packages/artifact-storage` persists immutable artifacts.
- `packages/browser-capture` `capturePage` takes an absolute http or
  https URL and an `ArtifactStore`. It does not take a source id and
  does not check collection permission.
- `apps/collector/` has no orchestrator.

Tooling is a single root `package.json`. `tsconfig.json` compiles
`packages/*/src/**/*.ts` with `rootDir: "packages"`. Tests use
`node:test` on the compiled `dist/` output. `./scripts/verify.sh` runs
typecheck and tests. There is no `config/` directory and no schema
validation library.

TASK-004's in-scope line once said to recommend one source for a
following adapter task. Its completion note says no adapter may start
and that a later source approval requires an explicit recorded choice.
This task is that gate. It does not select or approve a source.

Do not perform new external collection to populate the registry.

---

## 4. In Scope

- `config/source-access.json` as the single committed registry.
- `packages/source-access`: load, validate, and `canCollect`.
- Statuses `UNKNOWN`, `RESTRICTED`, and `ALLOWED`.
- Collection mode `browser_capture` only.
- Fail-closed decisions with explicit reason codes.
- Evidence required on every entry. `ALLOWED` also requires
  `authorizationBasis` and is invalid without it. `UNKNOWN` and
  `RESTRICTED` omit `authorizationBasis`.
- Initial entries for the four researched sources. None are `ALLOWED`.
- Unit tests, including a guard that the committed file has zero
  `ALLOWED` entries.
- Wire the package into `tsconfig.json` and the root `test` script.
- On verified completion, record proposed D-008 and the short current
  state, open-question, and roadmap notes in section 11.

---

## 5. Out of Scope

- Source adapters.
- Scheduler.
- Repeated collection.
- CrowdVolt, Shotgun, Resident Advisor, or DICE collection.
- CAPTCHA handling, authentication automation, proxy handling, and any
  access-control circumvention (D-007).
- Normalization, PostgreSQL, replay, and C++.
- A general policy engine, robots.txt interpreter, or terms fetcher.
- Resolving Q-004 or Q-005.
- Marking any existing source `ALLOWED`.
- Changes to `packages/browser-capture`, `packages/artifact-storage`,
  or `packages/schemas` behavior.
- New runtime dependencies.

---

## 6. Requirements

### Functional

- [x] Source access is read from one central config file.
- [x] Status is `UNKNOWN`, `RESTRICTED`, or `ALLOWED`.
- [x] `canCollect(registry, sourceId, mode)` returns an explicit
      allowed or denied result with a reason.
- [x] Unknown source, `UNKNOWN`, and `RESTRICTED` deny automated
      collection.
- [x] `ALLOWED` without the requested mode denies that call.
- [x] An `ALLOWED` grant for `browser_capture` does not grant any
      other mode.
- [x] A later `RESTRICTED` to `ALLOWED` change is a config edit with
      evidence and an `authorizationBasis`. It does not require a
      BrowserCapture, adapter, or scheduler rewrite.
- [x] `capturePage` stays source-agnostic and permission-agnostic.

### Data / Domain

- [x] Every entry has human-readable evidence: summary, retrieval
      date, and at least one reference (`url` and/or `repoPath`).
- [x] Evidence is provenance for the human-set status. The loader
      checks that it is present. It does not interpret terms or
      robots rules, and it does not decide whether a referenced
      document actually grants permission.
- [x] `authorizationBasis` is `PUBLIC_TERMS`, `WRITTEN_PERMISSION`,
      or `CONTRACT`. It records why the human configuration says
      collection is authorized.
- [x] `authorizationBasis` is required when status is `ALLOWED`.
- [x] `authorizationBasis` is absent when status is `UNKNOWN` or
      `RESTRICTED`.
- [x] `UNKNOWN` and `RESTRICTED` entries have an empty mode list.
- [x] `ALLOWED` entries have a non-empty mode list drawn only from
      known modes, complete evidence, and an `authorizationBasis`.
- [x] Committed config contains `crowdvolt`, `shotgun`,
      `resident-advisor`, and `dice`, and no `ALLOWED` status.
- [x] Registry source ids are plain strings. They are not
      `packages/schemas` `SourceId` values, and this package does not
      import schemas.

### Failure Behavior

- [x] Malformed config, unsupported version, `ALLOWED` without
      evidence, `ALLOWED` without `authorizationBasis`, `ALLOWED`
      with an unknown `authorizationBasis`, `ALLOWED` with no modes,
      and non-`ALLOWED` entries that list modes or include
      `authorizationBasis` fail at load time.
- [x] Load failure returns `{ ok: false, code, message }` and does
      not produce a registry.
- [x] Call-time denial returns `{ allowed: false, reason, message }`
      and does not throw.
- [x] A missing source is `unknown_source` with `status: null`. It is
      not silently stored as `UNKNOWN` or `ALLOWED`.
- [x] An unrecognized mode string on an `ALLOWED` source denies with
      `mode_not_allowed`.

---

## 7. Invariants

- D-007 remains in force. This registry does not bypass access
  controls.
- Q-004 stays source-specific. One source's status is not copied onto
  another.
- `SourceId` in `packages/schemas` remains an identity brand, not an
  approval registry.
- Raw snapshots and artifact bytes are unchanged by this task.
- Browser capture of an explicitly supplied local or fixture URL
  continues to work without consulting the registry.
- No commercial source in the committed registry is `ALLOWED`.

---

## 8. Expected Architecture

```text
config/source-access.json
        ↓
packages/source-access
  loadSourceAccessRegistry(path)
  canCollect(registry, sourceId, mode)
        ↓
future orchestrator
  if allowed for "browser_capture"
        ↓
packages/browser-capture
  capturePage({ url, store })
```

`packages/source-access` owns the gate.

`packages/browser-capture` continues to turn one absolute URL into
stored HTML and screenshot artifacts.

Future adapters and a future scheduler call the registry. They do not
embed status tables.

This is one JSON document plus a loader and one predicate. It is not
a rules engine.

### Config shape

`UNKNOWN` and `RESTRICTED` omit `authorizationBasis`:

```json
{
  "version": 1,
  "sources": {
    "crowdvolt": {
      "status": "RESTRICTED",
      "allowedModes": [],
      "evidence": {
        "summary": "User Agreement §6.1 restricts systematic retrieval and automated use. Retrieved 2026-09-27. See docs/research/sources/crowdvolt.md.",
        "retrievedAt": "2026-09-27",
        "references": [
          {
            "url": "https://www.crowdvolt.com/terms_of_service/user_agreement",
            "repoPath": "docs/research/sources/crowdvolt.md"
          }
        ]
      }
    }
  }
}
```

`ALLOWED` adds `authorizationBasis`. Evidence remains provenance.
`authorizationBasis` records why the human configuration says
collection is authorized. The loader does not decide whether the
referenced document actually grants permission.

```json
{
  "status": "ALLOWED",
  "authorizationBasis": "WRITTEN_PERMISSION",
  "allowedModes": ["browser_capture"],
  "evidence": {
    "summary": "Written permission on file for browser capture.",
    "retrievedAt": "2026-09-28",
    "references": [
      {
        "url": "",
        "repoPath": "docs/research/sources/example.md"
      }
    ]
  }
}
```

That `ALLOWED` object is the field shape only. It is not a committed
source. No current source is `ALLOWED`, so no current source has
`authorizationBasis`.

```typescript
type AuthorizationBasis =
  | "PUBLIC_TERMS"
  | "WRITTEN_PERMISSION"
  | "CONTRACT";
```

Known collection mode in v1: `browser_capture`.

Source ids match the research filenames: `crowdvolt`, `shotgun`,
`resident-advisor`, `dice`. Keys match `^[a-z][a-z0-9-]*$`.

### Initial states

Use only the 2026-09-27 repository research. Do not fetch live pages.

| sourceId | status | allowedModes | authorizationBasis | Research basis |
|---|---|---|---|---|
| `crowdvolt` | `RESTRICTED` | `[]` | absent | **VERIFIED FACT.** User Agreement §6.1 restricts systematic retrieval, automated use, and scraping. `robots.txt` `Disallow: /` for `User-agent: *` is separate. Written exception is **UNKNOWN**. |
| `resident-advisor` | `RESTRICTED` | `[]` | absent | **VERIFIED FACT.** Terms restrict commercial automated extraction without a written agreement, and restrict unauthorized bots, crawlers, and scrapers. No written agreement is on file. |
| `dice` | `RESTRICTED` | `[]` | absent | **VERIFIED FACT.** Researcher retrieval on 2026-09-27 recorded US Terms §8.4 crawl restriction. **UNKNOWN** whether the live page has changed; the verifier re-fetch was Cloudflare-blocked. Record that limitation in the evidence summary. Fail closed as `RESTRICTED`. |
| `shotgun` | `UNKNOWN` | `[]` | absent | **UNKNOWN.** US General Terms were not retrieved. Europe English terms must not be generalized. `robots.txt` `Allow: /` is not contractual permission. |

### API

```typescript
type SourceAccessStatus = "UNKNOWN" | "RESTRICTED" | "ALLOWED";
type CollectionMode = "browser_capture";
type AuthorizationBasis =
  | "PUBLIC_TERMS"
  | "WRITTEN_PERMISSION"
  | "CONTRACT";

type DenyReason =
  | "unknown_source"
  | "status_unknown"
  | "status_restricted"
  | "mode_not_allowed";

type CollectDecision =
  | {
      readonly allowed: true;
      readonly sourceId: string;
      readonly mode: CollectionMode;
      readonly status: "ALLOWED";
    }
  | {
      readonly allowed: false;
      readonly sourceId: string;
      readonly mode: string;
      readonly status: SourceAccessStatus | null;
      readonly reason: DenyReason;
      readonly message: string;
    };

function loadSourceAccessRegistry(
  configPath: string,
): LoadSourceAccessRegistryResult;

function canCollect(
  registry: SourceAccessRegistry,
  sourceId: string,
  mode: string,
): CollectDecision;
```

`loadSourceAccessRegistry` takes an explicit path. It does not search
upward for a repository root.

Load result matches the existing `{ ok: true } | { ok: false, code,
message }` pattern. Load codes: `invalid_config`, `config_io_failure`,
`unsupported_version`. Invalid config includes path-scoped issues, in
the same spirit as `RawSnapshotIssue`.

`canCollect` check order:

1. Missing source → `unknown_source`, `status: null`.
2. `UNKNOWN` → `status_unknown`.
3. `RESTRICTED` → `status_restricted`.
4. Requested mode absent from `allowedModes` → `mode_not_allowed`.
   This includes mode strings outside the known set.
5. Otherwise → allow.

Returned registries and decisions are frozen, consistent with the
artifact store and raw-snapshot parsers.

Reject unknown object keys, consistent with `hasExactKeys` in
`packages/schemas/src/raw-snapshot.ts`.

### Load-time validation

- Root object with exact keys `version` and `sources`.
- `version` is `1`.
- `sources` is an object. An empty object is valid.
- Each source key matches `^[a-z][a-z0-9-]*$`.
- An `UNKNOWN` or `RESTRICTED` entry has exact keys `status`,
  `allowedModes`, and `evidence`. `authorizationBasis` is absent.
- An `ALLOWED` entry has exact keys `status`, `authorizationBasis`,
  `allowedModes`, and `evidence`.
- `status` is one of the three statuses.
- `authorizationBasis` is `PUBLIC_TERMS`, `WRITTEN_PERMISSION`, or
  `CONTRACT`.
- `allowedModes` contains only `browser_capture`, with no duplicates.
- Status other than `ALLOWED` requires `allowedModes: []`.
- `ALLOWED` requires a non-empty `allowedModes`, complete evidence,
  and `authorizationBasis`.
- `evidence` has exact keys `summary`, `retrievedAt`, and
  `references`.
- `summary` is non-blank.
- `retrievedAt` is `YYYY-MM-DD`.
- `references` has at least one item.
- Each reference has exact keys `url` and `repoPath`, and at least
  one of them is a non-blank string. The other may be an empty string
  or omitted only if the exact-key rule is implemented as both
  required strings with at least one non-blank. Prefer both fields
  present as strings, at least one non-blank, so the key set stays
  exact.

`ALLOWED` without evidence, without `authorizationBasis`, or without
the requested mode, never becomes a callable registry. Evidence does
not substitute for `authorizationBasis`.

---

## 9. Acceptance Criteria

- [x] `config/source-access.json` and `packages/source-access` exist.
- [x] `canCollect` denies unknown sources, `UNKNOWN`, `RESTRICTED`,
      and modes that were not granted.
- [x] A test-only `ALLOWED` fixture with evidence,
      `authorizationBasis: "WRITTEN_PERMISSION"`, and
      `browser_capture` loads and allows that mode.
- [x] The same fixture denies a different mode string.
- [x] `ALLOWED` without evidence fails load.
- [x] `ALLOWED` without `authorizationBasis`, and `ALLOWED` with an
      unknown `authorizationBasis`, fail load with `invalid_config`.
- [x] `RESTRICTED` or `UNKNOWN` with `authorizationBasis` fails load
      with `invalid_config`.
- [x] The committed config has no `ALLOWED` entry.
- [x] `packages/browser-capture` does not import `source-access`.
- [x] `./scripts/verify.sh` passes.
- [x] D-008 is recorded as accepted only after verification. Q-004
      remains Open. No existing source is approved.

---

## 10. Validation Plan

Canonical validation:

```bash
./scripts/verify.sh
```

Tests live in `packages/source-access/src/source-access.test.ts` and
use `node:test` plus `node:assert/strict`, following
`packages/schemas/src/raw-snapshot.test.ts`.

Use temporary JSON files for invalid and `ALLOWED` fixtures. Also load
the committed `config/source-access.json` via a path derived from
`import.meta.url`.

Required cases:

1. Committed registry loads. Four source ids. Statuses match section 8.
   No entry is `ALLOWED`.
2. Unknown source id denies with `unknown_source`.
3. `shotgun` plus `browser_capture` denies with `status_unknown`.
4. `crowdvolt` plus `browser_capture` denies with `status_restricted`.
5. `ALLOWED` with blank summary, missing references, or empty
   `allowedModes` fails load with `invalid_config`.
6. `RESTRICTED` with a non-empty `allowedModes` fails load.
7. `ALLOWED` without `authorizationBasis` fails load with
   `invalid_config`.
8. `ALLOWED` with an unknown `authorizationBasis` fails load with
   `invalid_config`.
9. `RESTRICTED` with `authorizationBasis`, and `UNKNOWN` with
   `authorizationBasis`, fail load with `invalid_config`.
10. Temp-file source `fixture-allowed`, `ALLOWED`, complete evidence,
    `authorizationBasis: "WRITTEN_PERMISSION"`,
    `allowedModes: ["browser_capture"]`: the file loads;
    `browser_capture` allows; `"http_fetch"` denies with
    `mode_not_allowed`.
11. Bad version, non-object root, unknown status, and unknown keys fail
    load.
12. Missing config path fails load with `config_io_failure`.

No Playwright. No live URLs. No new dependencies.

---

## 11. Documentation Impact

- [x] `docs/01_CURRENT_STATE.md` — registry exists; still no approved
      source; capture remains permission-agnostic.
- [x] `docs/02_DECISION_LOG.md` — add D-008 after verification, using
      the draft in section 13.
- [x] `docs/03_OPEN_QUESTIONS.md` — Q-004 stays Open. Note that the
      registry enforces the current answer and does not close the
      question. Do not generalize source findings.
- [x] `docs/04_ROADMAP.md` — Phase 1 progress: central source-access
      registry; still no approved source.
- [x] `.cursor/rules/30-typescript.mdc` — add `packages/source-access`
      to the package-boundary list as the collection-permission gate.
- [x] other: none for product, architecture, research, legal, or
      experiments. Do not rewrite the 2026-09-27 source notes.

D-008 was recorded as accepted at closeout, after independent
verification returned PASS. Q-004 remains Open. No existing source is
approved.

---

## 12. Risks / Unknowns

- **TASK-004 approval wording (non-blocking).** The completion note
  says a later source approval requires an explicit recorded choice.
  D-008 should make an `ALLOWED` registry entry, with evidence and an
  `authorizationBasis`, the recorded choice. A separate Decision Log
  entry per source is not required. Until D-008 is accepted, no source
  is approved.
- **DICE live text (non-blocking).** Whether the live US Terms page
  still matches the 2026-09-27 retrieval is **UNKNOWN**. Initial
  status stays `RESTRICTED` from the recorded clause. Do not invent a
  new fetch.
- **Shotgun US terms (non-blocking, intentionally deferred).** US
  automation permission stays `UNKNOWN`.
- **Stale evidence (non-blocking).** The registry does not expire
  `retrievedAt`. A later flip to `ALLOWED` needs fresh human review.
- **Fail-open implementation (blocking if present).** Missing sources
  must not default to `ALLOWED`. `robots.txt` `Allow` must not be
  treated as permission.
- **Scope creep (intentionally deferred).** Policy engines, adapters,
  schedulers, and live collection are out of scope.
- **Future orchestrator path (non-blocking).** `apps/collector/` is
  empty. This task does not choose that package layout beyond the
  call shape in section 8.

---

## 13. Implementation Notes

Smallest boundary: `config/source-access.json` plus
`packages/source-access`.

`packages/schemas` stays the capture contract. `SourceId` already says
it is not an approval registry. `packages/browser-capture` stays a
URL-to-artifact function. Permission must sit above both so a later
status change is config-only.

Do not add Zod or another validation dependency. Parse JSON with the
explicit checks already used for `RawSnapshot`.

`canCollect` accepts `mode: string` so an unknown mode denies at run
time. The config allowlist remains `browser_capture` only. Do not add
a reserved production mode solely to unit-test denial.

Test-only `ALLOWED` data belongs in temporary files inside the test,
never in `config/source-access.json`.

`authorizationBasis` is required on `ALLOWED` and absent on `UNKNOWN`
and `RESTRICTED`. Evidence stays provenance: summary, retrieval date,
and references. `authorizationBasis` is the human-recorded reason
collection is authorized: `PUBLIC_TERMS`, `WRITTEN_PERMISSION`, or
`CONTRACT`. The loader checks that the value is one of those three
strings. It does not read the referenced document and does not decide
whether that document grants permission.

No committed source is `ALLOWED`, so no committed entry includes
`authorizationBasis`. The valid `ALLOWED` test fixture uses
`WRITTEN_PERMISSION`.

Load tests must reject:

- `ALLOWED` without `authorizationBasis`;
- `ALLOWED` with an unknown `authorizationBasis`;
- `RESTRICTED` or `UNKNOWN` with `authorizationBasis`.

A valid temp-file `ALLOWED` entry with complete evidence,
`authorizationBasis: "WRITTEN_PERMISSION"`, and `browser_capture`
loads, and `canCollect` allows `browser_capture`.

Suggested module split, matching current packages:

- `packages/source-access/src/source-access.ts` — types, parse, load,
  `canCollect`
- `packages/source-access/src/index.ts` — public exports
- `packages/source-access/src/source-access.test.ts`

`tsconfig.json` `include` gains `packages/source-access/src/**/*.ts`.
The root `test` script gains
`dist/source-access/src/source-access.test.js`.

### Implemented

Added `config/source-access.json` with four fail-closed entries
(`crowdvolt`, `resident-advisor`, and `dice` as `RESTRICTED`;
`shotgun` as `UNKNOWN`; none `ALLOWED`). Added
`packages/source-access` with `loadSourceAccessRegistry` and
`canCollect`, exact-key validation, frozen results, and unit tests.
Wired the package into root `tsconfig.json` and the `test` script.

### Closeout

Independent verification returned PASS. No required implementation
changes remain. D-008 is accepted in `docs/02_DECISION_LOG.md`.
Current state, Q-004, the Phase 1 roadmap note, and the TypeScript
package-boundary rule were updated. No source was marked `ALLOWED`.

### Proposed D-008

Recorded as accepted D-008 at closeout. The Decision Log entry is
authoritative. Individual source approvals are registry edits, not
separate Decision Log entries.

```text
## D-008 — Automated Collection Uses a Central Source-Access Registry

**Status:** Accepted

### Decision

Automated collection for a named source and collection mode is
permitted only when the central source-access registry entry for that
source is ALLOWED for that mode, carries documented evidence, and
records an authorization basis of PUBLIC_TERMS, WRITTEN_PERMISSION,
or CONTRACT. UNKNOWN and RESTRICTED fail closed and do not carry an
authorization basis. An unknown source fails closed.

The loader checks that an authorization basis is present and is one
of those three values. It does not independently decide whether the
referenced document grants permission.

Browser capture stays source-agnostic and does not perform this check.
Future orchestrators call the registry before automated collection.

An ALLOWED entry with evidence and an authorization basis is the
approval record for that source and mode. Individual source approvals
are not separate Decision Log entries. Changing RESTRICTED or UNKNOWN
to ALLOWED is a registry edit that adds evidence and an authorization
basis.

### Reasoning

Q-004 requires per-source review. D-007 forbids circumvention.
TASK-004 found no approved commercial source. A central registry keeps
permission out of BrowserCapture, future adapters, and a future
scheduler.

### Consequence

Collection jobs start only from a registry that loads successfully.
Q-004 remains open until a specific source is ALLOWED, and allowing
one source does not answer Q-004 for any other source.

### Does not decide

- That CrowdVolt, Shotgun, Resident Advisor, or DICE is allowed
- Written-agreement outcomes
- Snapshot frequency (Q-006), field reliability (Q-005), or adapter
  design

### Revisit When

The evidence fields are insufficient, or a lawful partner API needs
a different gate.
```

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-28  

### Evidence

Independent verification returned PASS. No required implementation
changes remain.

The delivered capability is a central source-access registry.
`config/source-access.json` is the human-reviewable source record.
`packages/source-access` loads and validates that record and exposes
`canCollect`. Collection is allowed only when a source is `ALLOWED`
and the requested mode is explicitly granted. Missing sources,
`UNKNOWN` sources, `RESTRICTED` sources, and ungranted modes fail
closed. `ALLOWED` requires evidence and a recognized
`authorizationBasis`. The loader records that human decision; it does
not interpret legal documents.

The committed registry has zero `ALLOWED` entries. `crowdvolt`,
`resident-advisor`, and `dice` are `RESTRICTED`. `shotgun` is
`UNKNOWN`. BrowserCapture remains source- and permission-agnostic.
No source adapter, scheduler, or orchestrator was added. Q-004 and
Q-005 remain Open. D-008 does not approve any source.

Closeout revalidation on 2026-09-28, outside the Cursor sandbox so
Chromium could launch: `npm run typecheck` passed, `npm test` passed
(51 tests, 0 failures), and `./scripts/verify.sh` passed (`passed:
48`, `failed: 0`, `warnings: 0`). Implementation and registry
statuses were not changed.

### Findings

No correctness or architecture findings require implementation
changes.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-28  
**Final Commit / PR:** none  

### Summary

TASK-005 delivered a fail-closed source-access registry.
`config/source-access.json` records the human-reviewed status of each
named source. `packages/source-access` validates that file and answers
`canCollect(registry, sourceId, mode)`.

Automated commercial-source collection is permitted only for an
`ALLOWED` source and an explicitly granted mode, with evidence and an
`authorizationBasis` of `PUBLIC_TERMS`, `WRITTEN_PERMISSION`, or
`CONTRACT`. The committed registry approves nothing: CrowdVolt,
Resident Advisor, and DICE are `RESTRICTED`; Shotgun is `UNKNOWN`.

BrowserCapture stays permission-agnostic. No adapter, scheduler, or
orchestrator was implemented. D-008 records the registry as the
collection gate. Q-004 remains Open.

### Follow-Up Tasks

- A future orchestrator calls `canCollect` before `capturePage` for
  marketplace collection.
- Shotgun US General Terms remain unretrieved.
- A later non-circumventing re-fetch of the DICE US Terms page, only
  if the page is reachable.
- Any flip to `ALLOWED` is a separate registry change with evidence
  and an `authorizationBasis`. It is not a new D-xxx decision.
- Zero sources are `ALLOWED`, so the first approved-source adapter
  and unattended collection remain blocked.
