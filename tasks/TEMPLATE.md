# Task: <Short Descriptive Name>

**ID:** TASK-XXX  
**Status:** PROPOSED  
**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Owner:**  
**Related Decisions:**  
**Related Open Questions:**  

---

## 1. Goal

Describe the observable outcome this task must produce.

Focus on behavior and project value rather than implementation detail.

---

## 2. Why This Exists

Explain which current project need, experiment, milestone, or problem
this task addresses.

Reference relevant canonical project state where appropriate.

---

## 3. Context

Relevant repository state.

Reference:

- canonical documentation;
- accepted decisions;
- open questions;
- architecture documents;
- research;
- previous experiment results.

Do not copy large canonical documents into the task.

---

## 4. In Scope

Explicitly define what this task includes.

- ...
- ...
- ...

---

## 5. Out of Scope

Explicitly define what this task must not expand into.

- ...
- ...
- ...

This section is important for preventing agent scope creep.

---

## 6. Requirements

### Functional

- [ ] ...
- [ ] ...
- [ ] ...

### Data / Domain

- [ ] ...
- [ ] ...
- [ ] ...

### Failure Behavior

- [ ] ...
- [ ] ...
- [ ] ...

Requirements should describe observable behavior where practical.

---

## 7. Invariants

List project or domain constraints that must remain true.

Examples for historical-data work:

- raw snapshots remain immutable;
- historical observations remain append-only;
- normalized data retains provenance;
- source identity is preserved;
- missing source data is not guessed;
- observation time is not silently treated as source event time.

Include only invariants relevant to the task.

---

## 8. Expected Architecture

Describe responsibility boundaries relevant to this task.

Example:

```text
collector
    ↓
source adapter
    ↓
raw snapshot
    ↓
normalization
```

This constrains ownership and data flow.

Do not prescribe implementation details unnecessarily when they are not
already project decisions.

---

## 9. Acceptance Criteria

The task is complete only when these conditions are demonstrably true.

- [ ] ...
- [ ] ...
- [ ] ...
- [ ] ...

Avoid vague criteria such as:

```text
works correctly
```

Prefer measurable outcomes.

Example:

```text
Given a stored HTML fixture, the parser produces the expected structured
result without launching a browser.
```

---

## 10. Validation Plan

Specify how completion will be verified.

Canonical validation:

```bash
./scripts/verify.sh
```

Additional validation may include:

- unit tests;
- parser fixture tests;
- integration tests;
- manual inspection;
- failure-path testing;
- deterministic replay;
- database constraint verification.

State what is actually required for this task.

---

## 11. Documentation Impact

Check all expected documentation effects:

- [ ] none
- [ ] `docs/01_CURRENT_STATE.md`
- [ ] `docs/02_DECISION_LOG.md`
- [ ] `docs/03_OPEN_QUESTIONS.md`
- [ ] `docs/04_ROADMAP.md`
- [ ] `docs/product/`
- [ ] `docs/architecture/`
- [ ] `docs/research/`
- [ ] `docs/legal/`
- [ ] `docs/experiments/`
- [ ] other:

Implementation does not automatically create a project decision.

---

## 12. Risks / Unknowns

List unresolved issues that could affect implementation.

For each important unknown, distinguish whether it is:

- blocking;
- non-blocking;
- intentionally deferred.

---

## 13. Implementation Notes

Use during implementation for information specific to this task.

Do not use this section as a substitute for canonical architecture or
research documentation.

---

## 14. Verification Result

**Verifier:**  
**Result:** NOT RUN / PASS / PARTIAL / FAIL  
**Date:**  

### Evidence

Commands, tests, and files inspected.

### Findings

...

### Required Changes

...

---

## 15. Completion

**Completed:**  
**Final Commit / PR:**  

### Summary

Describe what was actually delivered.

### Follow-Up Tasks

- ...
- ...
```

Use only these task states initially:

```text
PROPOSED
READY
IN_PROGRESS
VERIFYING
DONE

BLOCKED
CANCELLED
```

When work begins:

```text
tasks/active/TASK-001-example.md
```

When fully verified:

```text
tasks/completed/TASK-001-example.md
```

Don't move a task to `completed/` merely because the Implementer finished coding. It should have passed verification.

### After this

The next thing is `scripts/verify.sh`.

Then your execution system will be:

```text
Task Specification
       ↓
Researcher
       ↓
Implementation Plan
       ↓
Implementer
       ↓
scripts/verify.sh
       ↓
Verifier
       ↓
update-project-state
       ↓
DONE