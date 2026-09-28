# Task: First Source Selection and Capture Feasibility

**ID:** TASK-004
**Status:** DONE
**Created:** 2026-09-27
**Updated:** 2026-09-27
**Owner:**
**Related Decisions:** D-001, D-003, D-004, D-005, D-007
**Related Open Questions:** Q-004, Q-005, Q-006

---

## 1. Goal

Select the first real event-market source for Live Tape's historical
collection experiment.

The selected source must be evaluated for:

- automated observation feasibility;
- source-access constraints;
- observable event and market fields;
- browser-capture compatibility;
- usefulness for the NYC nightlife research wedge.

TASK-004 is a research and source-selection task.

It does not implement a source adapter.

---

## 2. Why This Exists

Live Tape now has:

- an immutable RawSnapshot contract;
- immutable artifact storage;
- a single-page Playwright capture boundary.

The project should not connect that machinery to a commercial source
until Q-004 is investigated for that source.

The next step is therefore to determine:

1. which candidate sources are relevant;
2. which appear usable for automated observation;
3. which expose useful historical market data;
4. which one should be used for the first adapter.

---

## 3. Candidate Sources

Initial candidates may include:

- CrowdVolt;
- Shotgun;
- Resident Advisor;
- DICE;
- other relevant NYC nightlife or ticket-market sources discovered
  during research.

This list is not an approval list.

Additional candidates may be added if evidence supports their relevance.

---

## 4. In Scope

For each serious candidate:

- identify the source and its role in the ticket market;
- identify relevant public pages;
- review publicly available terms, policies, robots directives, and
  automation restrictions where applicable;
- distinguish normal public browser access from prohibited
  circumvention;
- identify whether authentication is required;
- identify whether CAPTCHA or anti-bot controls are encountered;
- identify observable event fields;
- identify observable market fields;
- determine whether market state can be captured without purchasing;
- assess page stability for browser observation;
- assess usefulness for NYC nightlife;
- record evidence and retrieval dates;
- compare candidates;
- recommend one source for TASK-005.

---

## 5. Out of Scope

TASK-004 must not:

- implement a source adapter;
- automate login;
- solve CAPTCHA;
- rotate proxies to evade restrictions;
- spoof browser fingerprints;
- defeat rate limits;
- automate ticket purchasing;
- scrape sources before access feasibility is reviewed;
- normalize event identity;
- normalize ticket classes;
- implement scheduling;
- create market observations;
- modify the C++ engine;
- resolve unrelated product hypotheses.

---

## 6. Research Classification

Every conclusion must be classified as:

- VERIFIED FACT;
- PROJECT DECISION;
- HYPOTHESIS;
- INFERENCE;
- UNKNOWN.

Source permission must not be inferred merely because a page is
publicly reachable in a browser.

If automated observation remains unclear, classify it as UNKNOWN.

---

## 7. Source Evaluation

For each candidate, evaluate:

### Relevance

- Does it contain NYC nightlife inventory?
- Are the events relevant to the initial wedge?
- Does it expose primary sales, resale, or both?

### Access

- Can relevant pages be viewed without authentication?
- Are automation restrictions stated?
- Is a robots policy present and relevant?
- Are there terms restricting automated collection?
- Are technical access controls encountered?

### Observable Data

Potential fields include:

- event name;
- venue;
- event time;
- promoter;
- ticket class;
- face price;
- current ask;
- current bid;
- visible depth;
- last transaction;
- availability;
- sold-out state;
- resale state.

Do not assume all fields exist.

### Historical Value

Determine whether repeated snapshots could meaningfully support:

- price history;
- spread history;
- availability history;
- time-to-event analysis;
- later replay/simulation research.

### Capture Feasibility

Determine whether the existing BrowserCapture boundary can preserve the
page evidence without requiring source-specific circumvention.

---

## 8. Evidence Requirements

For material claims preserve:

- source URL;
- retrieval date;
- relevant policy or page;
- direct observation;
- confidence;
- uncertainty.

Prefer primary sources for access-policy claims.

Third-party commentary may supplement but must not replace primary
evidence where primary evidence exists.

---

## 9. Selection Criteria

TASK-004 should identify the strongest first source based on the
combination of:

- access feasibility;
- relevance to NYC nightlife;
- useful observable fields;
- market-data value;
- implementation simplicity;
- ability to run repeated lawful observations without circumvention.

Do not rank sources based purely on feature richness if access
feasibility is unresolved.

---

## 10. Acceptance Criteria

TASK-004 is complete when:

- [x] At least three plausible sources have been investigated, unless
      evidence shows fewer relevant candidates exist.
- [x] Q-004 evidence exists for each serious candidate.
- [x] Observable fields are documented per source.
- [x] Access uncertainty is explicitly preserved.
- [x] No source is labeled permitted solely because it is publicly
      viewable.
- [x] No circumvention mechanism is proposed.
- [x] One source is recommended for the first adapter, or the task
      explicitly concludes that no source is currently suitable.
- [x] The recommendation is supported by documented evidence.
- [x] Q-004 and Q-005 are updated only to the extent supported by the
      evidence.
- [x] No source adapter is implemented.
- [x] Canonical documentation remains internally consistent.
- [x] Independent verifier result is PASS.

---

## 11. Documentation Impact

Expected:

- [x] `docs/research/`
- [x] `docs/03_OPEN_QUESTIONS.md`
- [x] `docs/01_CURRENT_STATE.md` if source selection materially changes
      current state
- [x] `docs/04_ROADMAP.md` Phase 1 progress only; Phase 1 remains in
      progress
- [ ] `docs/02_DECISION_LOG.md` only if a source choice is explicitly
      accepted as a project decision

Research findings should primarily live under:

```text
docs/research/sources/
```

No source has been accepted as a project decision. The Decision Log
was not updated.

---

## 12. Risks / Unknowns

Nothing remains blocking for TASK-004. The second independent
verification returned PASS on 2026-09-27. The missing durable-research
issue from the earlier PARTIAL result is resolved. See Section 14.

Still unresolved, and not closed by this task:

- DICE live US Terms were not reconfirmed after Cloudflare blocked the
  verifier. Whether that page has changed since the 2026-09-27
  researcher retrieval remains UNKNOWN.
- Shotgun US General Terms were not retrieved. US automation permission
  remains UNKNOWN.
- No source is approved for automated collection.
- Q-004 and Q-005 remain Open.
- One observation does not establish Q-005 reliability.
- Repeated capture behavior was not tested, and must not be tested by
  evading a wall. D-007 remains accepted.

---

## 13. Implementation Notes

This task is research. No application code was changed. No source
adapter was implemented. Automated collection was not started.

### Research

On 2026-09-27, CrowdVolt, Shotgun, Resident Advisor, and DICE were
investigated from public pages, terms, and robots files. The research
conclusion, an inference, is that no source is currently suitable for
a first adapter. CrowdVolt is the strongest later permission-review
candidate because one logged-out NYC nightlife page showed bid/ask-style
information. That is not an approval.

### Documentation correction

An independent verifier returned PARTIAL because those findings existed
only in chat. This pass persists them:

- `docs/research/sources/crowdvolt.md`
- `docs/research/sources/shotgun.md`
- `docs/research/sources/resident-advisor.md`
- `docs/research/sources/dice.md`
- dated per-source evidence on Q-004 and Q-005, both left Open
- a short status statement in `docs/01_CURRENT_STATE.md`

`docs/02_DECISION_LOG.md` was not changed. No D-xxx entry was added.

The DICE note records the researcher's same-day terms retrieval, the
verifier's Cloudflare-blocked live re-fetch, and the unknown of whether
the live page has changed. It does not present a fresh live
confirmation.

### Closeout

A later independent verification returned PASS. The missing
durable-research issue from the PARTIAL result is resolved: the
per-source notes, the dated Q-004 and Q-005 evidence, and the
current-state statement are in the repository. This closeout marks the
task DONE. It does not add a Decision Log entry, approve a source,
close Q-004 or Q-005, or treat the DICE terms as freshly
live-reverified.

`docs/01_CURRENT_STATE.md` already stated that the four-source research
is recorded and that no commercial source is approved. It was not
expanded. `docs/04_ROADMAP.md` records first-source research as
complete inside Phase 1. Phase 1 remains in progress.

---

## 14. Verification Result

**Verifier:** independent Live Tape verifier  
**Result:** PASS  
**Date:** 2026-09-27

This is the second independent verification. The earlier result was
PARTIAL and is preserved below as historical context. The missing
durable-research issue from that result is resolved.

### Evidence

The second independent verification returned PASS on 2026-09-27.

The repository now contains the durable research the PARTIAL result
required:

- `docs/research/sources/crowdvolt.md`
- `docs/research/sources/shotgun.md`
- `docs/research/sources/resident-advisor.md`
- `docs/research/sources/dice.md`
- dated per-source evidence on Q-004 and Q-005, both left Open
- a current-state statement that no commercial source is approved

No Decision Log entry was added. No source was approved. This closeout
does not claim a fresh live re-fetch of the DICE US Terms.

### Findings

The blocking documentation gap is resolved. Four sources were
investigated. No commercial source is approved for automated historical
collection. CrowdVolt remains an unapproved permission-review
candidate. Q-004 and Q-005 remain Open. No adapter and no automated
collection were implemented.

### Required Changes

None.

### Historical verification context

**Verifier:** independent Live Tape verifier  
**Result:** PARTIAL  
**Date:** 2026-09-27

This earlier result preceded the documentation correction. It is not
the verification that closed the task.

#### Evidence

The verifier inspected repository state and re-fetched cited primary
pages where practical on 2026-09-27.

Repository facts that decided PARTIAL:

- `docs/research/` contained only `.gitkeep`
- `docs/research/sources/` did not exist
- Q-004 and Q-005 were Open stubs without per-source evidence
- no source adapter was present
- TASK-004 was still READY
- the research report existed only in chat

Primary-page results from that pass:

- CrowdVolt robots.txt and User Agreement §6.1 were retrieved and
  matched the research
- Resident Advisor terms §4.4(a) and §4.4(f), and robots.txt, were
  retrieved and matched the research
- DICE robots.txt was retrieved (`Disallow: /api/`)
- DICE US Terms of Use was not retrieved live because Cloudflare
  blocked the re-fetch; the crawl clause was checked against the
  researcher's same-day cache
- Shotgun US General Terms were not retrieved
- Shotgun Europe English terms were retrieved and were not generalized
  into a US policy
- Shotgun `robots.txt` `Allow: /` was confirmed and was not treated as
  permission

#### Findings

The research itself was largely supported. Four sources were
investigated. Access claims for CrowdVolt and Resident Advisor matched
live first-party text. Shotgun US permission correctly remained
UNKNOWN. One-time field observations were kept separate from Q-005
reliability. CrowdVolt was described as a permission-review candidate,
not an approved source. Q-004 and Q-005 were correctly left open. No
adapter or circumvention was implemented.

The blocking issue was missing durable repository documentation.
TASK-004 expects findings under `docs/research/sources/`, and Q-004 and
Q-005 require the dated evidence. That evidence was only in chat.

#### Required Changes

Before a later review could return PASS:

1. Persist per-source notes under `docs/research/sources/`.
2. Update Q-004 and Q-005 with that evidence and keep both Open.
3. Record in current state that no source is approved and that no
   adapter should start. Do not add a Decision Log entry.
4. Keep the DICE live-retrieval block as lasting uncertainty unless a
   later fetch actually retrieves the page. Do not invent that fetch.

The documentation correction in Section 13 addressed items 1–3 and
recorded item 4. The second verification, recorded above, returned
PASS. That PASS does not replace this historical PARTIAL result.

---

## 15. Completion

**Completed:** 2026-09-27  
**Final Commit / PR:** none

### Summary

TASK-004 investigated four candidate sources: CrowdVolt, Shotgun,
Resident Advisor, and DICE. The conclusion is that no commercial source
is currently approved for automated historical collection.

CrowdVolt is the strongest permission-review candidate because it
exposed useful NYC-nightlife bid/ask-style market information. That
observation is not permission and is not a project decision.

Resident Advisor's published terms restrict commercial automated
extraction absent written agreement.

DICE's US terms, as retrieved by the researcher on 2026-09-27, contain
a crawling restriction. Later live verification was Cloudflare-blocked.
This task does not claim a fresh live re-verification of that page.

Shotgun US automation permission remains UNKNOWN because the current US
General Terms were not retrieved.

Q-004 and Q-005 remain Open. No source adapter was implemented.
Automated collection was not started. No D-xxx decision was created.

### Follow-Up Tasks

- Shotgun US General Terms remain unretrieved. US automation permission
  stays UNKNOWN.
- A live re-fetch of the DICE US Terms only when the page is reachable
  without circumvention.
- Any later source approval requires an explicit project decision.
  None exists. An adapter must not start from this task.
