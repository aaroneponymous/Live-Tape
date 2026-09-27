---
name: implement-feature
description: Plan, implement, verify, and document a bounded Live Tape engineering feature.
---

# Implement Feature

Use this workflow for substantive Live Tape engineering changes.

This skill does not override repository rules, accepted decisions,
architecture boundaries, or active task requirements.

## 1. Establish Context

Before editing code:

1. read `AGENTS.md`;
2. consult the canonical project documents:
   - `docs/00_PROJECT_CHARTER.md`
   - `docs/01_CURRENT_STATE.md`
   - `docs/02_DECISION_LOG.md`
   - `docs/03_OPEN_QUESTIONS.md`
   - `docs/04_ROADMAP.md`;
3. read the active task specification if one exists;
4. read relevant domain documentation;
5. inspect applicable existing code and tests;
6. identify applicable `.cursor/rules/`.

Do not rely on prior chat history as project authority.

---

## 2. Check Scope

Determine whether the requested work is consistent with:

- the current project phase;
- the roadmap;
- accepted decisions;
- architecture boundaries;
- active task acceptance criteria.

If the work conflicts with an accepted decision or current project
scope, surface the conflict before implementing.

Do not silently expand scope.

---

## 3. Resolve Knowledge Status

Identify what is:

- VERIFIED FACT;
- PROJECT DECISION;
- HYPOTHESIS;
- INFERENCE;
- UNKNOWN.

Do not implement an unresolved product assumption as though it were
settled architecture unless the task explicitly defines an experimental
implementation.

---

## 4. Inspect Before Designing

Before proposing new code:

- search for an existing implementation;
- inspect neighboring packages;
- inspect relevant types and interfaces;
- inspect existing tests;
- inspect naming conventions;
- identify established patterns.

Prefer extending coherent existing patterns over introducing parallel
abstractions.

---

## 5. Produce a Plan

For a substantive change, produce a short implementation plan before
editing.

The plan should include:

### Goal

What behavior is being added or changed.

### Scope

What is included.

### Non-Goals

What is intentionally excluded.

### Files

Likely files to create or modify.

### Data / Domain Effects

Schemas, states, invariants, or persistence affected.

### Failure Modes

Important error cases.

### Validation

Tests or commands that will demonstrate correctness.

### Documentation Impact

Canonical documentation that may need to change.

Do not begin a large implementation while material requirements remain
ambiguous.

---

## 6. Implement the Smallest Coherent Change

Prefer the smallest implementation that satisfies the acceptance
criteria.

Do not introduce infrastructure merely because it may eventually be
useful.

Avoid unrelated:

- refactors;
- dependency changes;
- abstractions;
- architectural redesign;
- performance optimization.

If unrelated problems are discovered, record them separately rather
than silently expanding the task.

---

## 7. Preserve Live Tape Invariants

For historical data work, preserve:

- immutable raw snapshots;
- append-only observations;
- provenance;
- explicit timestamp semantics;
- source identity;
- uncertainty.

For TypeScript work, preserve:

- source-adapter boundaries;
- canonical schema boundaries;
- deterministic parser behavior where practical;
- explicit monetary units;
- structured failures.

For C++ work, preserve:

- determinism;
- explicit state ownership;
- replay semantics;
- market invariants;
- command/event boundaries.

---

## 8. Test the Change

Add or update tests appropriate to the behavior.

A bug fix should include a regression test when practical.

Run the repository's canonical validation command if available:

```bash
./scripts/verify.sh
```

Also run any narrower validation required by the active task.

Do not claim completion because code compiles or one happy-path example
worked.

---

## 9. Independent Verification

For substantive changes, use the Live Tape verifier agent after
implementation.

The verifier should inspect:

- the actual diff;
- acceptance criteria;
- architecture boundaries;
- applicable invariants;
- tests;
- documentation drift.

A verifier result of `FAIL` means the task is not complete.

A `PARTIAL` result requires explicit review of the remaining issues.

---

## 10. Update Durable Knowledge

If implementation reveals durable project knowledge, update the
relevant canonical documentation.

Examples include:

- source behavior differs from expectations;
- a schema assumption was wrong;
- an architectural constraint was discovered;
- an open question gained evidence;
- an accepted decision may need reconsideration.

Do not place ordinary implementation details into high-level canonical
documentation unnecessarily.

---

## 11. Final Report

Report:

### Implemented

What changed.

### Files Changed

Files created or modified.

### Validation

Commands and tests executed, including result.

### Verifier Result

PASS / PARTIAL / FAIL where applicable.

### Assumptions

Any assumptions required.

### Remaining Issues

Known limitations or follow-up work.

### Documentation

Canonical documentation changed or explicitly determined to require no
change.