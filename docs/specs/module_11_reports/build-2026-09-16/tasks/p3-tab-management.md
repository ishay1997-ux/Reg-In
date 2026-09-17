# P3 · Tab הנהלה (executive) — read `p3-common.md` first, then this

**Files you own:** `src/modules/11_reports/tabs/ExecutiveTab.jsx` (+ `tabs/executive/*.jsx` as you see fit) · `tabs/ExecutiveTab.test.jsx` · `src/lib/onboardingCopy.m11.exec.js`.
**Mockup:** `docs/mockups/management-report-screen/approved/02_tab_executive_approved.html` — `section.page#p1` מבט-על הנהלה (line 363) · `#p2` מגמות רב-שנתיות (545) · `#p3` הנחות ורווחיות (770) · `#p4` קהל מול צוות (939). 10 tables, 7 inline SVG charts.
**Card:** `stage2-cards/cards-management.md` — מ2 (89; ①91 ②99 ③105 ④151 ⑤161 ⑥172 ⑦184 ⑧194 ⑩210 — 4 keys, first `reports.execOverview.purpose`) · מ3 (236; ①238 ②253 ③260 ④314 ⑤323 ⑥326 ⑦338 ⑧347 ⑩362 — 4 keys, `reports.trends.purpose`; **drill surface**) · מ4 (388; ①390 ②402 ③408 ④453 ⑤462 ⑥467 ⑦479 ⑧489 ⑩503 — 3 keys, `reports.discounts.purpose`) · מ6 (523; ①525 ②534 ③540 ④577 ⑤586 ⑥592 ⑦604 ⑧614 ⑩628 — 4 keys, `reports.staffing.purpose`). Total keys for this tab: **15** (screens-approved count).
**RPCs:** `report_m02_exec_overview` · `report_m03_trends` (drill) · `report_m04_discounts` · `report_m06_staffing` — migration `*module11_d_rpcs_executive.sql`.
**Labels (spec §1.4, הנהלה row):** titles מבט-על הנהלה · מגמות רב-שנתיות · הנחות ורווחיות · קהל מול צוות; tiles: הכנסות מתחילת השנה · שולי-רווח גולמי · אירועים שהסתיימו · נתח 5 · שולי-רווח ללא הנחה · שולי-רווח בהנחה מעל 10% · הפרש בין הקצוות · שיעור אישור הצעות · יחס חציוני: אורחים לדיילת · אירועים מעל הצפי · אירועים ביחס מעל 50 · אירועים עם שני המספרים.
**Rulings to make visible:** 4 · 6 · 19 · 22 · 24 · 33 · 36 · **39** (tiers `0 · 1–5 · 6–10 · 10+`) · §7.82.
**Report file:** `<scratchpad>/results/p3-management.json`.
