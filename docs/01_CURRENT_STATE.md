# Live Tape — Current State

**Status:** Active  
**Last Updated:** 2026-09-26  
**Project Phase:** Research / Validation / Data Infrastructure

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

The system should:

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

## 3. Current Proposed Data Flow

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