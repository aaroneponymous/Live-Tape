# Live Tape — Current State

**Status:** Active  
**Last Updated:** 2026-09-30  
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

A central source-access registry is active and fail-closed (D-008).
`config/source-access.json` is the human-reviewable source record.
`packages/source-access` validates that record and exposes static
authorization (`canCollect`) and timing authorization
(`canCollectAt`). Collection fails closed unless a source and the
requested mode are explicitly `ALLOWED`.

CrowdVolt is `ALLOWED` for `browser_capture` based on written
permission dated 2026-09-28. Evidence is
`docs/source-access/crowdvolt-approval-2026-09-28.md`. The registry
records a 3600-second minimum interval per event
(`minimumIntervalSeconds: 3600`). Resident Advisor and DICE remain
`RESTRICTED`. Shotgun remains `UNKNOWN`.

BrowserCapture remains source- and permission-agnostic. It does not
consult the registry. BrowserCapture success does not imply a usable
CrowdVolt page.

A CrowdVolt-specific captured-page classification gate now exists in
`packages/source-adapters`. The known Cloudflare block shape is
classified `ACCESS_BLOCKED`. Every other currently unproven document
is `NOT_CONFIRMED_EVENT_PAGE`. Both states fail closed before market
parsing. No valid CrowdVolt event-page HTML has yet been captured
through the authorized BrowserCapture path. No CrowdVolt market
parser exists yet.

No scheduler or orchestrator exists. Unattended CrowdVolt collection
is not enabled. One manually initiated CrowdVolt `browser_capture`
was stored on 2026-09-30 (`capturedAt`
`2026-09-30T18:31:01.194Z`). The artifacts are a Cloudflare block
page, not the event market. Captured block evidence remains
preserved. The capture time is recorded in
`docs/research/sources/crowdvolt-adapter-reconnaissance.md`. There is
still no orchestrator-owned per-event history enforcing the timing
decision before each run.

Market parsing, normalization, PostgreSQL persistence, and historical
export are not implemented. Q-004 and Q-005 remain open. First-source
public-policy research is recorded under `docs/research/sources/`
(retrieval date 2026-09-27). CrowdVolt `browser_capture` does not
answer other sources, other CrowdVolt modes, or field reliability.

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