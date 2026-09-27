# Task: Immutable Artifact Storage

**ID:** TASK-002  
**Status:** DONE  
**Created:** 2026-09-27  
**Updated:** 2026-09-27  
**Owner:**  
**Related Decisions:** D-003, D-004, D-005, D-006, D-007  
**Related Open Questions:** Q-004, Q-005, Q-006, Q-007, Q-008, Q-009, Q-010  

---

## 1. Goal

Implement the smallest storage boundary capable of persisting raw capture
artifacts immutably and returning storage-agnostic references that can
be retained by the existing `RawSnapshot` contract.

TASK-002 must establish the semantics of artifact persistence before
browser collection is introduced.

The initial implementation should be suitable for local development and
testing without committing Live Tape to a particular cloud object-store
provider.

---

## 2. Why This Exists

TASK-001 established the canonical `RawSnapshot` metadata contract.

That contract references immutable raw artifacts such as:

- HTML;
- screenshots.

Those artifacts need an actual persistence mechanism before a browser
collector can safely produce `RawSnapshot` records.

D-004 requires raw source captures to remain immutable evidence.

TASK-002 provides the storage boundary needed to enforce that behavior.

The intended progression is:

```text
raw artifact bytes
        ↓
ArtifactStore
        ↓
immutable persisted artifact
        ↓
ArtifactReference
        ↓
RawSnapshot
```

This task does not capture pages or interpret their contents.

---

## 3. Context

Relevant existing capability:

- TASK-001 is complete.
- `packages/schemas` contains the canonical `RawSnapshot` contract.
- `RawSnapshot` references raw HTML and screenshot artifacts through
  storage-agnostic locators.
- TypeScript typechecking and tests are executed by
  `./scripts/verify.sh`.

Relevant project constraints:

- D-003 — historical collection precedes production exchange work.
- D-004 — raw page captures are immutable evidence.
- D-005 — historical observations are append-only.
- D-006 — collection infrastructure does not belong in the C++ engine.
- D-007 — no access-control circumvention.

Applicable operating rules include:

- `.cursor/rules/20-data-integrity.mdc`
- `.cursor/rules/30-typescript.mdc`

Storage roles currently describe object storage as the eventual home
for immutable raw HTML, screenshots, and raw artifacts.

That role does not require selecting a cloud provider in this task.

---

## 4. In Scope

TASK-002 includes:

- defining a narrow artifact-storage abstraction;
- persisting immutable artifact bytes;
- returning a storage-agnostic artifact reference;
- retrieving artifact bytes using that reference;
- preserving artifact kind where needed;
- computing or verifying content integrity;
- detecting attempts to overwrite an existing artifact with different
  bytes;
- ensuring successful writes are immutable from the perspective of the
  storage API;
- implementing a local filesystem-backed artifact store for development
  and tests;
- deterministic storage behavior where practical;
- structured error behavior;
- tests for storage and retrieval semantics;
- extending canonical verification only as needed for this task.

The local implementation may store artifacts on disk under a
repository-external or ignored runtime directory.

---

## 5. Out of Scope

TASK-002 must not implement:

- Playwright;
- browser navigation;
- page capture;
- source adapters;
- source-specific parsing;
- normalization;
- market observations;
- PostgreSQL;
- S3;
- Cloudflare R2;
- AWS SDKs;
- cloud credentials;
- remote object storage;
- upload APIs;
- scheduling;
- snapshot frequency;
- replay;
- Parquet;
- DuckDB;
- C++;
- matching;
- auctions;
- settlement;
- payment infrastructure.

TASK-002 must not resolve:

- which sources may be automatically observed;
- what market fields sources expose;
- snapshot frequency;
- event identity;
- ticket-class equivalence;
- replay semantics;
- market mechanism.

Q-004 through Q-010 remain open.

---

## 6. Requirements

### Functional

- [x] A canonical artifact-storage interface exists.
- [x] The interface can persist raw bytes.
- [x] The interface can retrieve previously persisted bytes.
- [x] Persistence returns an artifact reference compatible with the
      existing `RawSnapshot` contract.
- [x] Artifact references remain storage-provider agnostic.
- [x] Artifact kind can distinguish at least:
      - HTML;
      - screenshot.
- [x] A filesystem-backed implementation exists for local development
      and tests.
- [x] Successful persisted artifacts cannot be overwritten with
      different bytes through the storage API.
- [x] Storing the same artifact content repeatedly behaves
      deterministically according to the chosen local implementation
      semantics.
- [x] Missing artifacts produce structured errors rather than fabricated
      empty content.

### Integrity

- [x] Stored bytes have explicit content-integrity metadata.
- [x] Integrity verification uses the existing content-hash semantics
      where appropriate.
- [x] Retrieval can detect corrupted or mismatched persisted content.
- [x] Hash values are computed from the artifact bytes themselves.
- [x] The implementation does not trust caller-supplied hashes without
      validation when the store itself can compute them.

### Immutability

- [x] The storage API exposes no normal operation for mutating a
      successfully persisted artifact in place.
- [x] A locator must not silently change what bytes it refers to.
- [x] If a write would cause an existing locator to refer to different
      bytes, the operation must fail explicitly.

### Filesystem Safety

- [x] Caller-controlled locators cannot escape the configured storage
      root.
- [x] Path traversal such as `../` cannot be used to access files outside
      the artifact store.
- [x] Artifact retrieval is restricted to artifacts owned by the store.
- [x] The implementation does not depend on the process working
      directory for correctness.

### Failure Behavior

Structured failures must distinguish where practical:

- invalid input;
- unsupported artifact kind;
- artifact not found;
- conflicting immutable write;
- storage I/O failure;
- integrity mismatch.

Do not silently return empty bytes for failure cases.

---

## 7. Invariants

The implementation must preserve:

- persisted raw evidence is immutable;
- a stable artifact reference identifies stable bytes;
- raw evidence remains separate from parsed or normalized
  interpretation;
- artifact storage does not know about bids, asks, events, instruments,
  or market mechanisms;
- missing artifacts remain missing;
- content integrity is based on stored bytes;
- storage paths cannot escape the configured artifact root;
- source-specific DOM semantics are not introduced into storage;
- artifact storage does not infer source event time;
- artifact storage does not create historical market observations.

The artifact layer stores bytes.

It does not interpret them.

---

## 8. Expected Architecture

The intended boundary is:

```text
caller
  │
  │ raw bytes + artifact kind
  ▼
ArtifactStore
  │
  ├── put(...)
  └── get(...)
  │
  ▼
FilesystemArtifactStore
  │
  ▼
local immutable artifact files
```

The result of persistence is a storage-agnostic reference suitable for
use by:

```text
RawSnapshot.html
RawSnapshot.screenshot
```

Conceptually:

```text
HTML bytes ───────┐
                  │
Screenshot bytes ─┼──> ArtifactStore
                  │         │
                  │         ▼
                  │   immutable artifact
                  │         │
                  │         ▼
                  └── ArtifactReference
                            │
                            ▼
                       RawSnapshot
```

TASK-002 must not introduce dependencies from artifact storage to:

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

TASK-002 is complete when:

- [x] A narrow artifact-storage interface exists in an appropriate
      TypeScript package.
- [x] A filesystem-backed implementation exists.
- [x] HTML bytes can be stored and retrieved byte-for-byte.
- [x] Screenshot bytes can be stored and retrieved byte-for-byte.
- [x] Storage returns a reference compatible with `RawSnapshot`.
- [x] References do not encode a required cloud provider.
- [x] Content integrity is computed from artifact bytes.
- [x] Corrupted persisted content is detected during verification or
      retrieval.
- [x] Existing immutable artifacts cannot be silently replaced by
      different content.
- [x] Missing artifacts fail explicitly.
- [x] Path traversal attempts are rejected.
- [x] Storage behavior does not depend on the caller's current working
      directory.
- [x] No browser, source adapter, normalization, database, cloud-storage
      SDK, replay, or C++ implementation is introduced.
- [x] Q-004 through Q-010 remain unresolved.
- [x] TypeScript typechecking succeeds.
- [x] Artifact-storage tests succeed.
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

### Successful Persistence

- store HTML bytes;
- store screenshot bytes;
- retrieve identical bytes;
- obtain an artifact reference.

### Immutability

- repeated storage of identical content behaves safely;
- attempting to make an existing locator refer to different bytes
  fails.

### Integrity

- expected hash matches stored bytes;
- corrupted stored bytes are detected.

### Missing Data

- retrieving a nonexistent artifact produces a structured failure.

### Filesystem Safety

- `../` traversal is rejected;
- absolute paths supplied as artifact locators cannot escape the root;
- unusual but valid filenames or identifiers do not escape the root.

### Boundary

Verify no dependency is introduced on:

- Playwright;
- source adapters;
- PostgreSQL;
- S3/R2 SDKs;
- replay;
- C++.

---

## 11. Documentation Impact

Expected documentation effects:

- [x] none during implementation
- [x] `docs/01_CURRENT_STATE.md` — closeout: local artifact store exists
- [ ] `docs/02_DECISION_LOG.md` — reviewed; no new decision
- [ ] `docs/03_OPEN_QUESTIONS.md` — reviewed; Q-004 through Q-010 remain
      open
- [x] `docs/04_ROADMAP.md` — closeout: Phase 1 progress notes the local
      store; Phase 1 remains in progress
- [ ] `docs/architecture/`
- [ ] other:

The existence of a local filesystem implementation does not mean local
filesystem storage is the permanent production architecture.

Closeout updated current state and the Phase 1 progress note because a
local immutable artifact store now exists. It did not record filesystem
storage, locator grammar, or content-derived identity as decisions.

Do not create a new D-xxx decision solely because this task chooses:

- directory layout;
- filename format;
- hash-derived keys;
- filesystem APIs;
- error classes;
- artifact package location.

If TASK-002 reveals durable architecture knowledge, reassess this
section before completion.

---

## 12. Risks / Unknowns

### Intentionally Deferred

- production object-store provider;
- S3 versus R2 versus another provider;
- bucket naming;
- production retention rules;
- replication;
- lifecycle policies;
- remote storage authentication;
- database metadata persistence;
- browser integration;
- legal retention constraints.

### Design Risks

#### Locator Becomes Provider-Specific

A locator such as:

```text
s3://bucket/key
```

would unnecessarily couple the canonical contract to a provider.

Prefer an opaque or project-owned locator representation.

#### Path Traversal

Filesystem locators must not permit:

```text
../../outside-store
```

to escape the configured root.

#### Mutable Locator

A locator must not later resolve to different bytes without an explicit
failure.

#### Content Hash Used as the Wrong Identity

Content addressing may be useful internally, but TASK-002 must not
silently redefine RawSnapshot identity or collapse distinct captures.

Artifacts and snapshots have different identity semantics.

#### Accidental Interpretation

Artifact storage must not parse HTML, inspect ticket prices, derive
events, or classify marketplace state.

---

## 13. Implementation Notes

The Researcher completed the pre-implementation review.

For TASK-002, use the following local implementation semantics.

These are implementation choices for this task and are not new project
decisions.

### Package Boundary

Create:

```text
packages/artifact-storage/
```

This package owns:

- the `ArtifactStore` behavior boundary;
- the local filesystem implementation;
- artifact-storage result and error types.

Keep canonical value types such as:

- `ArtifactReference`;
- `ArtifactLocator`;
- `ContentHash`;
- `Sha256Hex`

in `packages/schemas`.

Do not place filesystem I/O inside `packages/schemas`.

### Artifact Kinds

Supported kinds for this task are:

- `html`
- `screenshot`

Artifact kind is an input to storage operations.

Do not add kind to `ArtifactReference`.

The existing canonical reference remains:

```text
{ locator }
```

The caller already knows whether the returned reference belongs in:

```text
RawSnapshot.html
```

or:

```text
RawSnapshot.screenshot
```

### Storage Operations

The minimum public behavior is:

```text
put(bytes, kind)
get(locator)
```

`put` accepts raw bytes.

Do not accept HTML strings as a separate storage semantic.

The storage layer stores bytes and does not interpret them.

Do not add:

- update;
- replace;
- delete;
- list;
- parsing;
- browser behavior.

### Local Filesystem Store

Implement a synchronous filesystem-backed store suitable for local
development and tests.

Use Node standard-library filesystem and crypto functionality.

Do not introduce a new runtime dependency solely for artifact storage.

The store is constructed with an absolute storage root.

A relative root must be rejected.

The resolved root must remain stable even if the process working
directory later changes.

### Locator Semantics

Locators produced by the filesystem store are opaque Live Tape
identifiers.

They are not:

- raw filesystem paths;
- `file://` URLs;
- `s3://` URLs;
- `r2://` URLs.

The canonical `ArtifactReference` schema remains permissive so future
storage implementations may use another compatible opaque locator.

The filesystem store itself should only resolve locators belonging to
its own grammar.

Never join an arbitrary caller-provided locator directly onto the
storage root.

### Content Identity

For the local implementation, artifact storage identity may be derived
from:

```text
artifact kind + SHA-256(raw artifact bytes)
```

This does not redefine `RawSnapshot.snapshotId`.

Two distinct `RawSnapshot`s may refer to the same immutable artifact.

The same bytes stored under different artifact kinds may remain
distinct storage identities.

### Repeated Writes

Calling `put` multiple times with:

- the same artifact kind;
- byte-for-byte identical content

should succeed and return the same artifact reference and content hash.

This is not an immutable-write conflict.

### Immutable-Write Conflict

An immutable-write conflict occurs when the storage identity already
exists but the bytes at that identity differ from the bytes that would
be stored.

The operation must:

- fail explicitly;
- leave the existing bytes unchanged.

With content-derived identity, ordinary different content naturally
produces a different locator.

Tests may create an occupied or tampered store identity to exercise the
conflict path.

### Integrity

Compute SHA-256 from the artifact bytes themselves.

Represent the computed digest using the existing `ContentHash`
representation.

Do not trust a caller-supplied digest as authoritative.

Retrieval must verify stored integrity before returning bytes.

Corrupt bytes or missing/mismatched integrity metadata must produce an
integrity failure.

This task does not define what `RawSnapshot.contentHash` commits to.

Do not write the artifact hash into `RawSnapshot.contentHash` merely
because the representation is compatible.

That preimage remains unresolved.

### Structured Results

Prefer structured result objects rather than normal exceptions for
expected storage failures.

Support these failure categories:

```text
invalid_input
unsupported_artifact_kind
artifact_not_found
immutable_write_conflict
storage_io_failure
integrity_mismatch
```

Unexpected programmer errors may remain exceptional.

Do not return empty bytes as a failure sentinel.

A genuinely stored zero-length artifact is distinct from a missing
artifact.

### Filesystem Safety

The filesystem implementation must:

- reject relative storage roots;
- reject traversal locators;
- reject absolute-path locators;
- reject malformed locators;
- never treat the raw locator as a filesystem path;
- build internal paths only from validated store-owned components;
- ensure resolved artifact paths remain inside the configured root;
- protect against symlink escape where applicable.

Retrieval must not access files outside the artifact store.

### Testing

Tests should use temporary directories outside the repository working
tree where practical.

Tests must cover:

- HTML byte round-trip;
- screenshot byte round-trip;
- reference compatibility with `RawSnapshot`;
- deterministic identical writes;
- immutable-write conflict;
- corrupted bytes;
- corrupted or missing digest metadata;
- missing artifact;
- traversal locator;
- absolute-path locator;
- working-directory changes.

### Tooling

Adding `packages/artifact-storage` requires the TypeScript configuration
and test command to include both schema and artifact-storage sources.

Keep:

```bash
./scripts/verify.sh
```

as the canonical repository validation entry point.

If the npm scripts execute the new typechecking and tests correctly,
`scripts/verify.sh` does not need additional artifact-specific logic.

### Rule Coverage

Extend the globs in:

```text
.cursor/rules/20-data-integrity.mdc
```

to include:

```text
packages/artifact-storage/**
```

so artifact-storage work receives the existing data-integrity rules.

This is rule-scope maintenance, not a new architectural decision.

### Documentation

Do not update canonical project documentation during implementation
unless new durable knowledge is discovered.

At TASK-002 closeout, reassess `docs/01_CURRENT_STATE.md` because the
current statement that persistence is not implemented will no longer
be fully accurate.

Do not create a new D-xxx decision for:

- filesystem storage;
- package location;
- SHA-256;
- locator grammar;
- synchronous filesystem APIs;
- content-derived local identity.

### Implementation Record

2026-09-27. Status is VERIFYING. Section 14 remains NOT RUN.

`packages/artifact-storage` provides a synchronous filesystem
`ArtifactStore`. `openFilesystemArtifactStore` rejects a relative root
and keeps the absolute real path of an absolute root. `put(bytes, kind)`
and `get(locator)` return structured results for expected failures.
Supported kinds are `html` and `screenshot`. Kind is an operation input.
It is not a field on `ArtifactReference`.

`RawSnapshot` and `ArtifactReference` were not changed. The store does
not create snapshot records and does not interpret artifact bytes.

Local choices, which are not project decisions:

- Locator grammar is `ltart1:<kind>:<64 lowercase hex>`.
- On-disk layout under the real root is `<kind>/<digest>/bytes` and
  `<kind>/<digest>/sha256`. The sidecar is exactly 64 lowercase hex
  characters and no newline.
- Storage identity is artifact kind plus SHA-256 of the raw bytes.
  `put` returns that digest as `ContentHash`. It is not
  `RawSnapshot.snapshotId`, and it is not written into
  `RawSnapshot.contentHash`.
- The same kind and byte-for-byte identical content return the same
  reference and content hash and do not modify existing files.
- If that identity already holds different bytes, `put` returns
  `immutable_write_conflict` and leaves those bytes unchanged.
- Different bytes for the same kind receive a different locator. Both
  artifacts remain retrievable.
- The same bytes under `html` and `screenshot` are different identities.
- A relative caller locator is never joined onto the storage root.
  Internal paths are built only from a validated kind and digest.
- TypeScript `rootDir` is `packages` so the schema and artifact-storage
  tests compile together. `scripts/verify.sh` has no artifact-specific
  logic.
- `.cursor/rules/20-data-integrity.mdc` includes
  `packages/artifact-storage/**`.

No runtime dependency was added.

Independent verification result is PASS. See Section 14.

Closeout updated `docs/01_CURRENT_STATE.md` and the Phase 1 progress
note in `docs/04_ROADMAP.md`. It did not add a decision or resolve an
open question. Phase 1 remains in progress.

Known limitation, non-blocking: when stored bytes already match, `put`
does not repair a missing or incorrect digest sidecar. `get` still
detects this and returns `integrity_mismatch`.

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-27  

### Evidence

The verifier inspected the uncommitted implementation read-only against
TASK-002 Sections 6, 7, 9, and 13, `packages/schemas/src/raw-snapshot.ts`,
`packages/artifact-storage/src/`, `package.json`, `tsconfig.json`,
`scripts/verify.sh`, the data-integrity and TypeScript rules, the
decision log, the open questions, and the AGENTS.md boundaries.

`RawSnapshot` is unchanged. `ArtifactReference` remains `{ locator }`
only. The decision log still ends at D-007. Q-004 through Q-010 remain
open. No browser, source-adapter, normalization, PostgreSQL, S3/R2,
replay, or C++ implementation was added. Locator grammar, on-disk
layout, and content-derived local identity remain local choices.

From the repository root:

- `npm run typecheck` passed.
- `npm test` passed (29 tests, 0 failures).
- `./scripts/verify.sh` passed (`passed: 48`, `failed: 0`,
  `warnings: 0`).

HTML and screenshot bytes round-trip. Retrieval verifies integrity.
Identical puts return the same reference. Conflicting bytes fail with
`immutable_write_conflict` and leave existing bytes unchanged. Path
traversal, absolute locators, and escapes outside the storage root are
rejected. Temporary probes covered symlink and hard-link cases and were
removed afterward.

### Findings

No correctness or architecture findings require changes.

Same-length conflicts and a symlinked digest sidecar were probed and
behaved correctly. They are not separate unit tests. That gap does not
block completion.

When stored bytes already match, `put` does not repair a missing or
incorrect digest sidecar. `get` still returns `integrity_mismatch`.
That limitation is non-blocking.

### Required Changes

None.

---

## 15. Completion

**Completed:** 2026-09-27  
**Final Commit / PR:** none  

### Summary

TASK-002 delivered a synchronous local filesystem artifact store in
`packages/artifact-storage`. `put` persists raw HTML or screenshot
bytes and returns a storage-agnostic `{ locator }` reference compatible
with the existing `RawSnapshot` contract, plus a SHA-256 content hash
of those bytes. `get` returns the stored bytes only after integrity
verification.

The store is a local development and test implementation. It does not
select a production object-storage provider, create `RawSnapshot`
records, or interpret artifact bytes. `RawSnapshot.contentHash`
preimage remains undefined.

### Follow-Up Tasks

Non-blocking limitation: when stored bytes already match, `put` does
not repair a missing or incorrect digest sidecar. `get` still detects
this and returns `integrity_mismatch`.

Expected later tasks include:

- single-page browser capture;
- first source adapter;
- normalized market observation;
- diff/change detection;
- scheduled unattended collection.

These are not part of TASK-002.