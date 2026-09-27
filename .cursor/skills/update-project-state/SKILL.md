---
name: update-project-state
description: Consolidate durable Live Tape findings, decisions, uncertainties, and architecture changes into canonical repository documentation.
---

# Update Project State

Use this skill when work produces information that should survive the
current conversation, implementation session, experiment, or research
task.

The goal is to keep repository knowledge authoritative without turning
canonical documentation into a transcript of everything that happened.

This skill does not override repository rules, accepted decisions, or
evidence requirements.

## 1. Determine Whether the Information Is Durable

Update project documentation only when the information is useful beyond
the current task.

Examples of durable knowledge include:

- an accepted project decision;
- a newly discovered source capability;
- a source limitation;
- an architectural boundary;
- a validated or invalidated hypothesis;
- meaningful evidence affecting an open question;
- a new open question;
- a changed project priority;
- a changed normalization rule;
- a changed replay semantic;
- a material experiment result;
- a material implementation constraint that future work must know.

Examples that usually do not belong in canonical project state:

- temporary debugging notes;
- raw command output;
- stack traces after the issue is resolved;
- trivial refactor details;
- implementation-specific variable names;
- temporary workarounds;
- speculative brainstorming that was not accepted;
- conversational summaries with no durable consequence.

Do not update canonical documentation merely because work occurred.

Update it because project knowledge changed.

---

## 2. Classify the Knowledge

Every durable conclusion must be classified as one of:

### VERIFIED FACT

Supported by:

- primary evidence;
- direct observation;
- raw captured evidence;
- reproducible system behavior;
- accepted experiment results.

### PROJECT DECISION

An explicit choice accepted by the project.

A technical implementation choice is not automatically a project
decision merely because code currently uses it.

### HYPOTHESIS

Something Live Tape intends to test but has not established.

### INFERENCE

A reasoned conclusion from available evidence that is not directly
verified.

### UNKNOWN

An unresolved issue or missing fact.

Never silently promote:

```text
HYPOTHESIS
    ↓
VERIFIED FACT
```

or:

```text
INFERENCE
    ↓
PROJECT DECISION
```

or:

```text
CURRENT IMPLEMENTATION
    ↓
PERMANENT ARCHITECTURE DECISION
```

without appropriate evidence or explicit acceptance.

---

## 3. Identify What Actually Changed

Before editing documentation, state internally:

1. what was believed before;
2. what new evidence or decision appeared;
3. what is now believed;
4. confidence in the new understanding;
5. which canonical documents are affected.

If nothing materially changed, do not edit project state unnecessarily.

---

## 4. Choose the Canonical Destination

### `docs/00_PROJECT_CHARTER.md`

Use only for durable changes to:

- mission;
- fundamental product thesis;
- long-term direction;
- non-goals;
- foundational operating principles.

This file should change rarely.

Do not use it for current implementation status.

---

### `docs/01_CURRENT_STATE.md`

Use when the answer to:

> "Where is Live Tape right now?"

has materially changed.

Examples:

- project phase changed;
- current engineering priority changed;
- implemented system capability changed materially;
- current architecture changed;
- an important current assumption was replaced;
- a major milestone was completed.

Do not use Current State as:

- a daily progress log;
- a changelog;
- a task tracker;
- a dump of implementation details.

Keep it concise and high-signal.

---

### `docs/02_DECISION_LOG.md`

Use when an explicit project choice has been accepted.

A decision entry should include where useful:

- decision ID;
- status;
- decision;
- context;
- reasoning;
- consequences;
- alternatives considered;
- revisit condition.

Do not record:

- unresolved hypotheses;
- speculative recommendations;
- temporary implementation choices

as accepted decisions unless explicitly approved.

---

### `docs/03_OPEN_QUESTIONS.md`

Use when:

- a new material uncertainty appears;
- evidence changes the status of an existing question;
- a question is partially resolved;
- a question is fully resolved;
- priority changes;
- the question itself needs refinement.

Do not delete a resolved question as though it never existed.

Instead preserve its history and mark the resolution clearly where the
document convention allows it.

If resolution creates an accepted decision, update the Decision Log
separately.

---

### `docs/04_ROADMAP.md`

Use only when:

- project sequencing materially changes;
- a phase begins or ends;
- exit criteria materially change;
- priorities move between phases;
- evidence changes what should happen next.

Do not edit the roadmap for every completed coding task.

---

### `docs/product/`

Use for durable product knowledge such as:

- product behavior;
- user flows;
- market mechanics;
- instrument semantics;
- feature boundaries;
- product differentiation.

---

### `docs/architecture/`

Use for durable technical architecture such as:

- subsystem responsibilities;
- data flow;
- storage architecture;
- schema semantics;
- replay architecture;
- capture architecture;
- invariants;
- integration boundaries.

Do not place transient implementation notes here.

---

### `docs/research/`

Use for structured research such as:

- competitors;
- platforms;
- market observations;
- source capabilities;
- market structure;
- historical findings.

Preserve evidence and uncertainty.

---

### `docs/legal/`

Use for:

- regulations;
- platform terms;
- compliance research;
- jurisdictional requirements.

Time-sensitive legal or policy information should preserve verification
date and source.

Do not present legal interpretation as settled project fact without
appropriate support.

---

### `docs/experiments/`

Use for:

- experiment design;
- methodology;
- inputs;
- results;
- limitations;
- conclusions;
- follow-up questions.

Experiment findings must preserve the distinction between observed
result and interpretation.

---

## 5. Prefer Domain Documents Over Top-Level Bloat

The five top-level canonical files should remain concise.

Prefer:

```text
CURRENT_STATE
    ↓
short current conclusion
    ↓
reference to detailed domain document
```

instead of copying a full research report into
`docs/01_CURRENT_STATE.md`.

Detailed evidence belongs in the relevant domain documentation.

---

## 6. Preserve Provenance

For externally derived or observational facts, preserve where
appropriate:

- source;
- source URL or identifier;
- retrieval date;
- observation date;
- raw snapshot or evidence reference;
- parser version;
- experiment reference;
- confidence;
- unresolved uncertainty.

Do not present interpretation as though the source stated it.

Do not rewrite:

```text
Observed:
"The page displayed a best ask of $82 at 21:05."
```

as:

```text
"The market price was definitively $82 at 21:05."
```

unless that stronger claim is actually supported.

---

## 7. Preserve Observation Semantics

For historical-data findings, distinguish:

- what the source displayed;
- when Live Tape observed it;
- whether the source supplied its own event timestamp;
- what Live Tape inferred;
- what was generated synthetically.

Do not convert snapshot observations into fictional event history.

If uncertainty exists, preserve it explicitly.

---

## 8. Avoid Duplication

Before creating a new document:

1. search for an existing canonical document;
2. determine which document already owns the subject;
3. update that document when appropriate.

Do not create:

```text
topic-v2.md
topic-new.md
topic-final.md
topic-final-final.md
topic-updated.md
```

as a substitute for maintaining canonical documentation.

Use Git history for historical versions unless a separate archival
artifact is explicitly required.

---

## 9. Handle Conflicts With Existing Decisions

If new evidence conflicts with an accepted decision:

1. do not silently replace the decision;
2. identify the affected decision ID;
3. describe the conflicting evidence;
4. update supporting research or experiment documentation;
5. recommend whether the decision should be reopened;
6. wait for explicit acceptance before treating a replacement position
   as canonical.

Until reopened, the existing decision remains authoritative.

---

## 10. Maintain Stable IDs

Do not reuse or silently rename:

- decision IDs;
- open-question IDs;
- experiment IDs;
- ADR IDs;
- task IDs.

If a new item is needed, assign the next appropriate identifier.

Do not change identifiers merely to improve visual ordering.

References in other documentation may depend on them.

---

## 11. Do Not Overstate Experiment Results

An experiment result may support, weaken, or leave a hypothesis
unresolved.

Avoid automatic language such as:

```text
proved
disproved
confirmed
guaranteed
```

unless the evidence genuinely supports that strength of conclusion.

Prefer precise statements such as:

```text
The pilot produced evidence consistent with H-X under these conditions.
```

or:

```text
The result weakened H-X but did not resolve it.
```

---

## 12. Do Not Convert Implementation Into Product Truth

Examples:

If the collector currently samples every 15 minutes, that does not mean:

```text
15 minutes is the correct production sampling interval.
```

If PostgreSQL is currently used, that does not necessarily mean:

```text
PostgreSQL is permanently required for every future architecture.
```

If a prototype uses one parsing technique, that does not make it an
accepted architectural standard.

Only promote implementation behavior into canonical architecture when
the project has actually accepted it.

---

## 13. Update Multiple Documents Only When Necessary

One discovery may affect several canonical documents.

Example:

A source is found not to expose depth.

Potential effects:

```text
docs/research/<source>.md
    ↓
record verified limitation

docs/03_OPEN_QUESTIONS.md
    ↓
update Q-005 evidence/status

docs/01_CURRENT_STATE.md
    ↓
only if this materially changes the current collector capability
```

Do not mechanically update every top-level file after every finding.

---

## 14. Keep Documentation Internally Consistent

After making updates, check for contradictions.

Examples:

If `CURRENT_STATE` says:

```text
Phase 1 is active
```

but `ROADMAP` still says:

```text
Phase 1 is NEXT
```

resolve the inconsistency.

If an Open Question is marked resolved but another document still calls
it unresolved, reconcile the documentation.

Do not leave two canonical files asserting incompatible project states.

---

## 15. Documentation Change Quality

Canonical documentation should be:

- concise;
- explicit;
- current;
- evidence-aware;
- easy for a new agent to reconstruct;
- free of conversational filler.

Avoid vague statements such as:

```text
We figured this out.
```

Prefer:

```text
Direct observation across five captures showed that Source X exposes
best bid and best ask but not visible depth.
```

when supported.

---

## 16. Final Review

Before finishing, verify:

- the knowledge classification is correct;
- the destination document is correct;
- no speculative claim was promoted improperly;
- provenance is preserved;
- IDs remain stable;
- no accepted decision was silently overturned;
- no open question was silently resolved;
- no duplicate canonical document was created;
- top-level docs remain concise;
- affected canonical documents remain internally consistent.

---

## 17. Final Report

Report:

### Durable Knowledge Identified

What project knowledge changed.

### Classification

For each meaningful item:

- VERIFIED FACT;
- PROJECT DECISION;
- HYPOTHESIS;
- INFERENCE;
- UNKNOWN.

### Documentation Updated

List files changed and why.

### Decisions Affected

Decision IDs affected, if any.

### Open Questions Affected

Question IDs affected, if any.

### Conflicts

Any conflicts with existing canonical state.

### Remaining Uncertainty

What still must not be treated as settled.
