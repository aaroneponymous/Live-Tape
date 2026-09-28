# DICE

**Retrieval date:** 2026-09-27  
**Approval status:** Not approved for automated collection  
**Related questions:** Q-004, Q-005  
**Related decisions:** D-001, D-007 remain accepted. This note does not add a decision.

DICE is not approved for automated historical collection.

The live US Terms page was not independently reconfirmed during the verification pass.

---

## Source Role

**VERIFIED FACT.** The researcher retrieved the US Terms of Use on 2026-09-27 from `https://dicefm.zendesk.com/hc/en-gb/articles/4412973085841-United-States-Terms-of-Use`. The recorded text, last updated March 10, 2026, describes DICE as a primary ticketing agent (§1.2 and §3.1).

§7.2 in that recorded text describes a waiting list on which a ticket holder may be offered a chance to offer a ticket back through DICE. That is a return-to-primary mechanism in the terms. An open bid/ask book was not on the browse page examined the same day.

---

## NYC Nightlife Relevance

**VERIFIED FACT.** `https://dice.fm/browse/new-york`, retrieved 2026-09-27, listed NYC events at Brooklyn Storehouse, Pacha New York, Knockdown Center, House of Yes, and similar rooms, with prices such as “From $30.90”, “From $63.66”, “From free”, and at least one sold-out label.

**INFERENCE.** That inventory is relevant to the NYC nightlife wedge in D-001.

---

## Pages Examined

Retrieved or viewed on 2026-09-27:

- `https://dice.fm/browse/new-york`
- `https://dice.fm/robots.txt`
- US Terms of Use, researcher retrieval: `https://dicefm.zendesk.com/hc/en-gb/articles/4412973085841-United-States-Terms-of-Use`

The browse page and the Zendesk terms page loaded in the research pass.

---

## Authentication Observations

**VERIFIED FACT.** The browse page loaded without login.

**VERIFIED FACT.** In the US Terms text the researcher retrieved, §8.2 requires an account to purchase or to use features such as the waiting list.

**UNKNOWN.** Checkout was not tested.

---

## Automation and Access-Policy Evidence

**VERIFIED FACT.** The researcher retrieved the US Terms text on 2026-09-27 and recorded the crawl-restriction clause. In that recorded text, §8.4 says the user will not:

> use software, devices, or other manual or automated processes to "crawl" any page of our website, App or Services, including but not limited to any use of any scripts or web crawlers

The same recorded section restricts commercial resale purchasing and ticket-purchasing software.

**VERIFIED FACT.** The independent verifier's later live re-fetch of `https://dicefm.zendesk.com/hc/en-gb/articles/4412973085841-United-States-Terms-of-Use` was blocked by Cloudflare. The verifier compared the crawl-restriction quote to the researcher’s same-day cache. The live page body was not independently reconfirmed during the verification pass.

**UNKNOWN.** Whether the currently served live page has changed since the researcher's same-day retrieval.

**UNKNOWN.** Whether DICE would grant a written exception. None was found in this pass.

This note does not invent a fresh live verification of the terms page.

---

## Robots.txt Evidence

**VERIFIED FACT.** `https://dice.fm/robots.txt`, retrieved 2026-09-27: `User-agent: *` / `Disallow: /api/`, plus sitemaps.

The independent verifier re-fetched this file on 2026-09-27 and confirmed `Disallow: /api/`.

That directive is separate from the Terms of Use. It does not permit crawling HTML pages, and it does not replace the terms clause recorded above.

---

## Technical-Access Observations

**VERIFIED FACT.** The New York browse page loaded in the research pass. The Zendesk terms page loaded for the researcher on 2026-09-27. The verifier’s later live re-fetch of the terms URL was Cloudflare-blocked.

**UNKNOWN.** Repeated headless behavior of the browse page. No challenge was bypassed. D-007 forbids circumvention.

Cloudflare on the verifier’s terms fetch is an access observation. It is not proof that the clause changed, and it is not a fresh confirmation of the live body.

---

## Event Fields Observed

**VERIFIED FACT.** On the browse page, once: name, venue, date, and a displayed price or sold-out state.

**UNKNOWN.** Promoter and doors were not isolated on the browse cards.

---

## Market Fields Observed

**VERIFIED FACT.** Primary “From $”, free, and sold-out labels were visible once on the browse page.

**UNKNOWN.** Bid, ask, depth, and last trade were not shown. Waiting-list offer prices were not observed in the UI.

One observation does not establish reliable observability over time.

---

## Historical-Data Usefulness

**INFERENCE.** If observation were allowed, repeated browse pages could support primary asking-price and sold-out history.

**INFERENCE.** Those pages are a weak fit for spread or bid history, on the fields observed here.

The recorded terms restrict crawling. This usefulness is not an approval.

---

## Q-004 Implications

The researcher’s 2026-09-27 retrieval recorded a crawl restriction in the US Terms of Use. The verifier could not live-reconfirm that page because Cloudflare blocked the re-fetch. Whether the live page has since changed is unknown.

DICE is not approved for automated observation. A browse page that loads in a browser is not authorization. `Disallow: /api/` is not the contractual finding.

---

## Q-005 Implications

Primary price and sold-out labels were visible once on the browse page. Reliability over time is unknown. Bid and ask were not observed.

---

## Remaining Unknowns

- Whether the currently served US Terms page still matches the researcher’s 2026-09-27 retrieval.
- Whether DICE would grant written research access.
- Waiting-list prices in the UI.
- Bid, ask, depth, and last trade.
- Repeated capture behavior of the browse page.
- Legal effect beyond the clause recorded from the same-day retrieval.
