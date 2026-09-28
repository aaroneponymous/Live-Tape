# Live Tape — Current State

**Status:** Active  
**Last Updated:** 2026-09-28  
**Project Phase:** Research / Validation / Data Infrastructure  
**Roadmap Phase:** Phase 1 — Historical Data Collector (in progress)

---

## 1. Current Strategic Position

Live Tape is not currently building the production ticket exchange.

The immediate focus is:

1. market research;
2. event-market observation;
3. historical data collection;
4. validation of ticket-market behavior;
5. groundwork for future market simulation.

---

## 2. Current Technical Priority

Build an automated historical event and market-data collection system.

The implemented collection boundary is the canonical `RawSnapshot`
contract in `packages/schemas`: one successfully persisted immutable
capture, with snapshot identity, source identity, source URL, capture
time, content-hash metadata, and references to raw HTML and screenshot
artifacts.

A local filesystem-backed artifact store in `packages/artifact-storage`
persists raw HTML and screenshot bytes and returns storage-agnostic
artifact references compatible with `RawSnapshot`. Retrieval verifies
integrity before returning bytes. This store is a local development
and test implementation. No production object-storage provider has
been selected.

`./scripts/verify.sh` typechecks and tests the contract, the local
store, and single-page capture.

A Playwright-based single-page capture boundary in
`packages/browser-capture` loads an explicitly supplied absolute http
or https URL, captures serialized HTML and a PNG screenshot, and
persists both artifacts through ArtifactStore. The result is
intermediate: `sourceUrl`, `capturedAt`, the HTML artifact reference
and hash, and the screenshot artifact reference and hash. Browser
capture does not construct `RawSnapshot`. The preimage of
`RawSnapshot.contentHash` remains unresolved.

A central source-access registry now exists (D-008).
`config/source-access.json` is the human-reviewable source record.
`packages/source-access` validates that record and exposes
`canCollect`. Collection fails closed unless a source and the
requested mode are explicitly `ALLOWED`. The committed registry has
zero `ALLOWED` sources. CrowdVolt, Resident Advisor, and DICE are
`RESTRICTED`. Shotgun is `UNKNOWN`.

Browser capture remains permission-agnostic. It does not consult the
registry.

No source adapter or scheduler exists yet. Parsing, normalization,
PostgreSQL persistence, and historical export are not implemented.
The first approved-source adapter remains blocked until a source is
`ALLOWED`.

First-source research for CrowdVolt, Shotgun, Resident Advisor, and
DICE is recorded under `docs/research/sources/` (retrieval date
2026-09-27). Q-004 and Q-005 remain open. The registry does not
resolve whether any particular source permits automation.

The collector should eventually:

- discover or receive target event pages;
- visit supported sources using browser automation;
- capture immutable source evidence;
- normalize event data;
- normalize market observations;
- preserve timestamps and provenance;
- build historical time-series datasets;
- support financial analysis;
- eventually export historical replay data for the C++ engine.

---

## 3. Intended Data Flow

The raw-snapshot contract, a local immutable artifact store, and
single-page browser capture exist. Capture does not yet assemble
`RawSnapshot`. Later stages remain future work.

```text
Source
  ↓
Browser Capture
  ↓
Raw Snapshot
  ├── HTML
  ├── Screenshot
  └── Capture Metadata
  ↓
Source Adapter / Parser
  ↓
Normalization
  ↓
Canonical Event
  +
Instrument
  +
Market Observation
  ↓
PostgreSQL
  ↓
Historical Export
  ├── Parquet / DuckDB
  └── Replay Dataset