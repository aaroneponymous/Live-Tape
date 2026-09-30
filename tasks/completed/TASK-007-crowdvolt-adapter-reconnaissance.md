# Task: CrowdVolt Adapter Reconnaissance

**ID:** TASK-007  
**Status:** DONE  
**Created:** 2026-09-30  
**Updated:** 2026-09-30  
**Owner:**  
**Related Decisions:** D-007, D-008  
**Related Open Questions:** Q-005

This task does not close Q-005. It does not add a source adapter, a
scheduler, or a `RawSnapshot` content-hash rule.

---

## 1. Goal

Use the existing capture stack, under the CrowdVolt `browser_capture`
authorization, to inspect one public event-market page and record
which fields are actually present for a future adapter.

---

## 2. Why This Exists

Written permission allows observation of public CrowdVolt event pages.
The 2026-09-27 research saw a book in a normal browser and a
disagreement between fetched prose and the rendered Buy control.
Whether `page.content()` contains those fields was unknown.

---

## 3. Result

One manual capture was performed after `canCollect` and `canCollectAt`
both allowed it. `minimumIntervalSeconds` was 3600.
`lastSuccessfulCaptureAt` was null because no prior stack capture of
the URL existed.

`capturedAt`: `2026-09-30T18:31:01.194Z`  
URL: `https://www.crowdvolt.com/event/jamie-jones-pacha-new-york-brooklyn-new-york-october-10-2026`

The stored HTML and viewport screenshot are a Cloudflare block page.
Event, ticket-class, and market fields were `NOT_OBSERVED`. The
serialized HTML and the screenshot agree on the block. The earlier
`$53` / `$55` disagreement was not present to compare.

No adapter or scheduler was implemented. The authorization evidence
file was not modified. The run stopped on the block. No circumvention
was added.

The research record is
`docs/research/sources/crowdvolt-adapter-reconnaissance.md`.

Another capture of this URL before `2026-09-30T19:31:01.194Z` would
violate the authorization interval.

---

## 4. Completion

**Completed:** 2026-09-30

- [x] One authorized manual CrowdVolt capture
- [x] 60-minute constraint respected (`lastSuccessfulCaptureAt` null; timestamp recorded)
- [x] HTML and screenshot preserved in the local ArtifactStore
- [x] Observable fields mapped
- [x] HTML-versus-rendered differences documented
- [x] Extraction boundary recommended: fail closed on this block document; do not choose a market parser until an event page is captured
- [x] No production source adapter
- [x] No scheduler
- [x] Q-005 remains open
