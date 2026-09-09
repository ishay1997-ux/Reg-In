# Module 6 · Phase 3 · Session D — 3.8 (customer-card projects tab) + 3.9 (end-of-phase 🎨 review) + full regression

## Context

Sessions A–C signed. Session D closes Phase 3, same conversation, same method. Step 3.8/3.9 bodies read in full. Per Ishay's reminder: builder agent on **sonnet** (the step body is exhaustively specified), adversarial panel + orchestrator verification on the session model.

## Build (1 sonnet agent) — Step 3.8, M2's screen (bounded block)

`CustomerDetailsPage.jsx` (+ its tab component) · `02_customers/api.js` (`getCustomerProjects` A12: direct `customer_id`, LEFT join, explicit columns — index exists, do not add) · `src/lib/customers.js` (A3 `רדומים` filter reading `סף_לקוח_רדום_ימים` from params, ruled 120, never hard-coded) · `02_customers/CLAUDE.md` (A13 stale-comment fix) · per card `:2016-2300` + mockup 08. Key traps (all in the step body): `מספר אירועים` as STRING (StatTile routes numbers through Money → "4 ₪") · two sections `מתקרבים`/`התקיימו` (cancelled sits in התקיימו regardless of calendar, dashed tag + `היה אמור להתקיים`) · rejected-and-not-rebuilt: archive tab, date-range filter · E3's label rename in BOTH render sites (`סה"כ הצעות מאושרות` — `customers.js` computes once, card tile + list column render) · placeholder block `:446` + the TWO stale comments (`:440-441` RLS lie) deleted; `customer-no-projects` testid is an E2E contract — check e2e/ first · six appendix states (search-not-filter vocabulary; no-permission counter `—`) · search placeholder byte-identical to the quotes tab's. Tests per house style; M2's existing tests must stay green untouched.

## Step 3.9 — end-of-phase 🎨 review (👤 gate)

Assemble and present to Ishay: (a) §4 design conformance · (b) functional-states inventory across all 8 surfaces · (c) keyboard operability + focus ring · (d) validation completeness · (e) the open design question. Plus the two module passes: the **status × surface tone matrix** (build once, keep — the artefact whose absence let S-1's contradiction survive) and the **direction pass** (label/value pairs, .ltr, items-start). Method: one review agent (sonnet) sweeps code + fresh screenshots (temp route mount) for (b)/(c)/direction; I verify its findings and run the greyscale/document pass myself; findings → build-fixes now or logged deferrals — Ishay rules at the gate.

## Regression (end of phase)

`npm run gate` (no pipe) · full `npm run test:e2e` + `npm run smoke` (neither runs in CI — the phase close is where they run; E2E identities from .env.local) · suite baseline 1235. M2-focused regression emphasis after 3.8 (customers specs).

## Bookkeeping

Guide close per step + §10 entry J · Phase-3 close: ripple-sweep block + **phase compaction deferred to the phase-4 session** (never compact the active phase; 3.9's sign-off closes it, the next session compacts) · commits pathspec · push + rule-10 · LOG/STATUS · stop at the 🎨 gate with the full evidence package for Ishay's ruling.
