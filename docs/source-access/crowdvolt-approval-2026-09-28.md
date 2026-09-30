# CrowdVolt Source Access Authorization

**Source:** CrowdVolt  
**Source ID:** `crowdvolt`  
**Authorization status:** ALLOWED  
**Authorization basis:** `WRITTEN_PERMISSION`  
**Authorization received:** 2026-09-28
**Authorization effective:** 2026-09-28 
**Authorization expiration:** None specified  
**Approved collection mode:** `browser_capture`  
**Last reviewed:** 2026-09-28

---

## 1. Purpose

This document records the authorization provided by CrowdVolt to Live
Tape for automated observation of specified publicly accessible
CrowdVolt event-market pages.

This document is the durable repository record supporting the
`ALLOWED` status for CrowdVolt in:

`config/source-access.json`

It is not a general statement that all automated interaction with
CrowdVolt is permitted.

Only the collection mode, pages, fields, frequency, and behavior
described in this document are authorized.

---

## 2. Authorization

**VERIFIED FACT.**

On 2026-09-28, CrowdVolt provided Live Tape with written permission to
perform automated browser-based observation of approved publicly
accessible CrowdVolt event-market pages.

The permission allows Live Tape to periodically load those pages for
historical market-data collection and research.

The authorized software collection mode is:

`browser_capture`

This authorization is the basis for changing the CrowdVolt source
registry entry from:

`RESTRICTED`

to:

`ALLOWED`

for the `browser_capture` mode only.

---

## 3. Authorizing Party

**Organization:** CrowdVolt

**Representative:** Jane Smith

**Title:** Head of Partnerships

**Authorization received via:** Email

**Date received:** 2026-09-28

**Original communication retained at:**

`Private company correspondence / Live Tape source-access archive`

The original email is intentionally not committed to the public source
repository because it may contain private contact information,
confidential business information, signatures, email addresses, or
other material that does not need to exist in Git.

This repository document records the authorization necessary for
technical and project governance.

---

## 4. Approved Collection Mode

The following automated collection mode is authorized:

- `browser_capture`

For Live Tape, `browser_capture` means automated loading of an approved
public webpage through the project's browser-capture infrastructure for
the purpose of preserving observable page evidence.

It may include:

- loading a public event-market page;
- allowing the page to render normally;
- capturing serialized page HTML;
- capturing a screenshot;
- storing those artifacts through Live Tape's immutable ArtifactStore;
- subsequently parsing approved publicly displayed fields from that
  captured evidence.

This authorization does not automatically extend to any collection mode
that may be added to Live Tape in the future.

For example, it does not automatically authorize:

- direct API collection;
- private API access;
- authenticated browser automation;
- account automation;
- checkout automation;
- ticket purchasing;
- ticket transfer automation.

Any additional collection mode requires separate authorization and a
corresponding source-access review.

---

## 5. Approved Pages

Automated browser capture is authorized only for publicly accessible
CrowdVolt event-market pages covered by the written permission.

Example page class:

`https://www.crowdvolt.com/event/...`

The authorization covers event pages that can ordinarily be viewed
without signing into a CrowdVolt user account.

The authorization does not automatically cover every URL under
`crowdvolt.com`.

---

## 6. Approved Data

Within approved public event-market pages, Live Tape may observe and
retain publicly displayed information within the authorization granted
by CrowdVolt.

For this example authorization, approved data includes:

### Event metadata

- event name;
- event date;
- event time;
- venue;
- venue address;
- lineup;
- publicly displayed event metadata.

### Ticket metadata

- ticket class;
- admission type;
- publicly displayed ticket description;
- publicly displayed quantity or quantity range.

### Market information

- displayed buy price;
- displayed sell price;
- displayed bid prices;
- displayed ask prices;
- visible bid depth;
- visible ask depth;
- publicly displayed quantities associated with bids or asks;
- publicly displayed availability state;
- publicly displayed market-state information.

The fact that collection of a field is authorized does not mean Live
Tape has established that the field is reliably observable.

Reliability remains a separate technical question under Q-005.

---

## 7. Collection Frequency

For this example authorization, CrowdVolt permits no more than:

**one automated capture per event every 60 minutes**

Live Tape must not intentionally schedule browser capture for the same
event more frequently than this limit.

The collection scheduler must eventually enforce this constraint before
unattended CrowdVolt collection is enabled.

Until software enforcement exists, unattended collection must not be
started at a frequency that could violate this requirement.

This frequency exists because it was part of the authorization, not
because Live Tape independently selected it.

If CrowdVolt later changes the permitted frequency, this document and
the relevant configuration must be reviewed.

---

## 8. Authentication

This authorization covers approved publicly accessible event-market
pages.

It does not authorize Live Tape to automate CrowdVolt login.

Live Tape must not use user credentials merely to obtain data that is
outside the approved public scope.

The following remain unauthorized unless CrowdVolt separately provides
permission:

- automated login;
- persistent authenticated sessions;
- collection from user-account pages;
- collection from seller dashboards;
- collection from buyer dashboards;
- collection from administrative pages;
- collection of private account information.

---

## 9. Purchasing and Transaction Activity

This authorization is for observation and historical data collection.

It does not authorize:

- automated ticket purchasing;
- automated bidding;
- automated selling;
- automated checkout;
- automated payment submission;
- automated order creation;
- automated ticket transfer;
- automated cancellation;
- automated price manipulation;
- automated interaction with transactional controls.

Live Tape's collector must remain observational.

Any future transactional integration requires separate authorization
and separate project review.

---

## 10. Private APIs and Internal Interfaces

This authorization does not grant permission to use private,
undocumented, internal, or otherwise non-public CrowdVolt APIs.

Live Tape must not infer API authorization from permission to perform
`browser_capture`.

If CrowdVolt later provides an official API, data feed, export, or
other sanctioned interface, that interface should receive its own
collection mode and access review.

---

## 11. Access Controls

Authorization to perform browser capture does not authorize Live Tape
to defeat technical access controls.

Live Tape must not:

- bypass CAPTCHA;
- bypass Cloudflare challenges;
- circumvent bot-detection systems;
- circumvent authentication;
- bypass robot-exclusion mechanisms through deceptive techniques;
- rotate proxies for the purpose of evading restrictions;
- spoof browser fingerprints for the purpose of evading restrictions;
- defeat rate limits;
- exploit technical vulnerabilities;
- otherwise circumvent a technical restriction.

D-007 remains applicable.

If an approved CrowdVolt page begins returning an access-control
challenge, Live Tape must stop or fail closed rather than adding
circumvention behavior.

The existence of written collection permission does not itself mean
that a technical access-control mechanism may be bypassed.

If the authorization and CrowdVolt's technical controls appear to
conflict, Live Tape should obtain clarification from CrowdVolt.

---

## 12. robots.txt Relationship

The original Live Tape research performed on 2026-09-27 observed:

`User-agent: *`

`Disallow: /`

in CrowdVolt's robots.txt.

The original research also found public User Agreement language
restricting automated collection.

Those historical observations remain recorded in:

`docs/research/sources/crowdvolt.md`

The written authorization recorded in this document is a separate,
source-specific authorization provided to Live Tape.

For this example, CrowdVolt has confirmed that the approved Live Tape
browser-capture activity described here is permitted notwithstanding
the general public crawler restriction.

If actual written permission does not make that relationship clear,
Live Tape should obtain clarification before changing the registry to
`ALLOWED`.

---

## 13. Personal Information

Live Tape's historical collector is intended to observe market and event
state, not build profiles of CrowdVolt users.

Even when a public page displays usernames, seller names, buyer names,
or similar identifiers, Live Tape should avoid retaining personally
identifying information unless that information is necessary for an
approved product requirement and its collection has been separately
reviewed.

For the current historical market-data experiment, the intended focus
is:

- event identity;
- ticket class;
- price;
- quantity;
- bid/ask state;
- availability;
- observation time.

Not user profiling.

---

## 14. Artifact Storage

Approved page captures may be persisted through Live Tape's existing
ArtifactStore.

This may include:

- serialized HTML;
- screenshots;
- associated artifact hashes;
- capture metadata.

The authorization does not alter ArtifactStore semantics.

Raw evidence should continue to be immutable.

The authorization does not itself resolve
`RawSnapshot.contentHash` semantics.

---

## 15. Normalization and Derived Data

Live Tape may derive historical market observations from the approved
captured public data within the scope of the written permission.

Potential derived observations may eventually include:

- best bid;
- best ask;
- spread;
- visible bid depth;
- visible ask depth;
- ticket-class availability;
- price changes;
- time-to-event;
- observed market-state changes.

This section records intended technical use of the approved information.

It does not establish that every listed field is technically available
or reliable.

---

## 16. Historical Research Record

Before this authorization was received, Live Tape researched
CrowdVolt's publicly available terms and technical behavior on
2026-09-27.

That research is preserved at:

`docs/research/sources/crowdvolt.md`

The research found public policy language restricting automated
collection and therefore classified CrowdVolt as `RESTRICTED`.

That historical research must not be deleted or rewritten to pretend
that CrowdVolt was always authorized.

The project history is:

### 2026-09-27

Public-policy research completed.

Result:

`RESTRICTED`

No automated historical collection approved.

### 2026-09-28

Source-specific written authorization received from CrowdVolt.

Result:

`ALLOWED`

for:

`browser_capture`

subject to the scope and restrictions recorded in this document.

---

## 17. Source-Access Registry Effect

After this authorization record is reviewed and accepted, the
CrowdVolt entry in:

`config/source-access.json`

may be changed to:

```json
{
  "status": "ALLOWED",
  "allowedModes": [
    "browser_capture"
  ],
  "authorizationBasis": "WRITTEN_PERMISSION",
  "evidence": {
    "summary": "CrowdVolt provided written permission on 2026-09-28 for Live Tape to perform automated browser capture of approved public event-market pages, subject to the restrictions recorded in docs/source-access/crowdvolt-approval-2026-09-28.md.",
    "retrievedAt": "2026-09-28",
    "references": [
      {
        "url": "",
        "repoPath": "docs/source-access/crowdvolt-approval-2026-09-28.md"
      }
    ]
  },
  "constraints": {
    "minimumIntervalSeconds": 3600
  }
}
```