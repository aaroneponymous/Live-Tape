# Shotgun

**Retrieval date:** 2026-09-27  
**Approval status:** Not approved for automated collection  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-001, D-007 remain accepted. This note does not add a decision.

US automation permission remains unknown. Shotgun is not approved for automated historical collection.

---

## Source Role

**VERIFIED FACT.** The Europe English General Terms, last update 4 May 2026, issued by Shotgun SAS, describe a primary ticketing platform. The French text prevails over that English translation.

Those terms define “Automatic Resale” as in-platform ticket cancellation when another client buys, and paid transfer at the original total ticket price. That description is not an open public order book.

**UNKNOWN.** Whether the US product matches the Europe English terms.

---

## NYC Nightlife Relevance

**VERIFIED FACT.** `https://shotgun.live/en/cities/new-york`, retrieved 2026-09-27, listed 196 upcoming events, including Nublu and other local rooms, with card prices such as $44.00, $23.00, and $33.75.

**INFERENCE.** That inventory is relevant to the NYC nightlife wedge in D-001.

---

## Pages Examined

Retrieved or viewed on 2026-09-27:

- `https://shotgun.live/robots.txt`
- `https://shotgun.live/en/cities/new-york`
- `https://support.shotgun.live/hc/en-us/articles/14330476029330--General-Terms-and-Conditions` — stopped on a Cloudflare browser-verification page. The US English PDF link was not retrieved.
- Europe English PDF: `https://res.cloudinary.com/shotgun/image/upload/v1773830497/Terms%20and%20Conditions/Current%20versions/Shotgun_-_GTC_-_EUR_-_04-05-2026_b6ovum.pdf`

The US General Terms were not retrieved. An independent verifier on 2026-09-27 also could not retrieve them.

---

## Authentication Observations

**VERIFIED FACT.** The New York city page was readable without login.

**VERIFIED FACT.** Europe English §4.1.1 says any person may browse ticket offers, and purchase requires an account. That statement is about the Europe English document.

**UNKNOWN.** Checkout was not tested. Whether the US product uses the same rule is unknown.

---

## Automation and Access-Policy Evidence

**UNKNOWN.** US automation permission. The US General Terms were not retrieved on 2026-09-27.

**VERIFIED FACT.** The retrieved Europe English terms say clients must not automate or mass-send follow requests, invitations, or social interactions using scripts or bots, and must have purchased a ticket without using any automated means. A search of that PDF found no sentence granting scraping and no general website-crawl ban.

That finding applies only to the Europe English text. It must not be generalized into a US policy.

An independent verifier retrieved the same Europe English PDF on 2026-09-27 and found the social “scripts, bots” clause, and did not find a general scrape ban in that document.

---

## Robots.txt Evidence

**VERIFIED FACT.** `https://shotgun.live/robots.txt`, retrieved 2026-09-27, contains `User-agent: *` / `Allow: /`, plus a sitemap.

The independent verifier confirmed that allow rule on 2026-09-27.

`Allow: /` is a robots directive. It is not contractual permission to build a historical dataset.

---

## Technical-Access Observations

**VERIFIED FACT.** The help-center fetch stopped on a Cloudflare verification page. The New York city page loaded.

**UNKNOWN.** Repeated headless behavior. No attempt was made to pass Cloudflare. D-007 forbids circumvention.

---

## Event Fields Observed

**VERIFIED FACT.** On the New York city page, once: name, venue, date and time, genre tags, and some organizer context.

---

## Market Fields Observed

**VERIFIED FACT.** City-card dollar prices and a free-style listing were present once.

**UNKNOWN.** Bid, ask depth, and last trade were not present on that page. Event-detail inventory was not re-checked in this pass.

One observation does not establish reliable observability over time.

---

## Historical-Data Usefulness

**INFERENCE.** If observation were allowed, repeated city pages could support primary list-price and listing-availability history.

**INFERENCE.** The fields observed here would not support a bid/ask tape.

Permission for the US site remains unknown, so this usefulness is not an approval.

---

## Q-004 Implications

US permission remains unknown because the US General Terms were not retrieved.

The Europe English terms are not a substitute US policy. `robots.txt` `Allow: /` is not permission. A city page that loads in a browser is not authorization to automate.

---

## Q-005 Implications

City-card prices were visible once. Reliability across time is unknown. An order book was not observed.

---

## Remaining Unknowns

- The current US English General Terms, and therefore US automation permission.
- Whether the US product matches the Europe English “Automatic Resale” description.
- Whether event-detail HTML contains the live price shown on city cards.
- Repeated capture behavior.
- Legal effect of the Europe English clauses outside that document.
