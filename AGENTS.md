# Live Tape — Agent Operating Instructions

## 1. Repository Authority

The repository is the canonical source of truth for Live Tape.

Do not treat previous chats, model memory, brainstorming sessions,
or unstored conclusions as authoritative project state.

Before substantial work, consult:

1. `docs/00_PROJECT_CHARTER.md`
2. `docs/01_CURRENT_STATE.md`
3. `docs/02_DECISION_LOG.md`
4. `docs/03_OPEN_QUESTIONS.md`
5. `docs/04_ROADMAP.md`
6. relevant domain documentation for the task

If repository documentation conflicts with conversational assumptions,
surface the conflict before proceeding.

---

## 2. Project Stage

Live Tape is currently in:

RESEARCH / VALIDATION / DATA-INFRASTRUCTURE DEVELOPMENT.

The current technical priority is historical event and market-data
collection.

Do not prematurely build production exchange infrastructure that
depends on unvalidated marketplace assumptions.

Examples of work that is NOT currently the primary implementation
priority:

- production matching infrastructure;
- production payment settlement;
- native ticket custody;
- broker APIs;
- sports-market infrastructure;
- high-performance exchange optimization;
- automated ticket purchasing.

Research prototypes and simulations may be appropriate when explicitly
scoped as experiments.

---

## 3. Knowledge Classification

Always distinguish between:

### VERIFIED FACT
Supported by primary evidence, direct observation, source material,
or reproducible system behavior.

### PROJECT DECISION
An explicit choice recorded in the Decision Log or an accepted ADR.

### HYPOTHESIS
Something Live Tape intends to test but has not established.

### INFERENCE
A reasoned conclusion from available information that is not directly
verified.

### UNKNOWN
Information we do not currently know.

Never silently convert one category into another.

---

## 4. Documentation Discipline

Chats are temporary working environments.

Durable project knowledge must be incorporated into canonical
repository documentation.

When project knowledge changes:

- update the relevant domain document;
- update `01_CURRENT_STATE.md` if current understanding changed;
- update `02_DECISION_LOG.md` when a decision is accepted;
- update `03_OPEN_QUESTIONS.md` when uncertainty changes;
- update `04_ROADMAP.md` when sequencing materially changes.

Prefer updating an existing canonical document over creating a new
competing document.

Do not create files such as:

- `architecture-final.md`
- `architecture-v2.md`
- `new-market-model.md`
- `final-final.md`

unless versioned historical artifacts are explicitly required.

---

## 5. Decision Discipline

Do not silently overturn accepted project decisions.

If new evidence challenges an accepted decision:

1. identify the existing decision;
2. explain the conflicting evidence;
3. recommend whether the decision should be reopened;
4. wait for acceptance before treating the new position as canonical.

---

## 6. Research Discipline

Research must preserve provenance.

For important external claims record, where appropriate:

- source;
- retrieval/observation date;
- what was directly observed;
- confidence;
- interpretation;
- unresolved uncertainty.

Do not present inference as source-derived fact.

Time-sensitive information should be considered stale when appropriate
and revalidated before being used for consequential decisions.

---

## 7. Engineering Priorities

Prefer, in order:

1. correctness;
2. determinism;
3. data provenance;
4. testability;
5. observability;
6. recoverability;
7. simplicity;
8. maintainability;
9. performance.

Do not optimize for hypothetical scale before measurement demonstrates
a need.

---

## 8. Implementation Workflow

Before substantial implementation:

1. read relevant documentation;
2. inspect existing code and patterns;
3. identify affected invariants;
4. identify unresolved requirements;
5. propose a bounded implementation plan;
6. implement the smallest coherent change;
7. run relevant validation;
8. independently inspect the result;
9. update documentation if project knowledge changed.

Do not claim completion merely because code was written.

A task is complete only when relevant verification has been performed.

---

## 9. Architecture Boundaries

The browser/data collection system and future exchange engine are
different domains.

Current likely responsibilities:

### TypeScript / application infrastructure

- browser orchestration;
- source adapters;
- data ingestion;
- normalization;
- operational APIs;
- administration;
- scheduling.

### PostgreSQL

- canonical operational entities;
- observations;
- provenance;
- capture metadata.

### Object storage

- immutable raw HTML;
- screenshots;
- raw artifacts.

### Parquet / DuckDB

- analytical historical datasets;
- research queries;
- financial analysis.

### C++

Reserved primarily for future:

- order books;
- matching;
- auctions;
- simulation;
- historical replay;
- deterministic market infrastructure.

Do not place ordinary SaaS/business logic in the C++ matching domain.

---

## 10. Safety and Source Access

Do not bypass:

- CAPTCHAs;
- access controls;
- authentication restrictions;
- rate limits through evasion;
- anti-bot mechanisms.

Automated collection must respect the project's source-policy decisions.

If automated collection permission is unknown, classify the source as
unresolved rather than assuming permission.

---

## 11. Communication

When finishing substantial work, report:

1. what changed;
2. files changed;
3. validation performed;
4. assumptions made;
5. unresolved risks;
6. documentation affected.
