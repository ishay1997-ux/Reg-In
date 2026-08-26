# M8 Pre-Handoff Review — Simulated Blueprint Session (constrained to spec.md §① reading list)

**Reading list actually consumed (all 8 items + registers + 6 mockups):**
1. `docs/specs/module_08_finance/processes-approved.md` (384 lines, full)
2. `docs/specs/module_08_finance/screens-approved.md` (642 lines, full)
3. `docs/mockups/finance-screen/approved/` — all 6 HTML files listed and spot-verified via targeted grep (not read byte-for-byte; verified specific claims against them, see §2)
4. `docs/db_roadmap.md` — every line matching `M8|project_finance|salary_reports`, plus surrounding context for the non-trivial ones (RLS deny-all list, A-20 forward notices, per-table pending index, RLS rollout matrix)
5. `docs/PROJECT_MASTER_sec7.md` — items 19,20,37,38,46,52,57,58,61,63,68,69,78,79,80,92 (all 16, in full)
6. `docs/PROJECT_MASTER.md` §6 — every `🚧 מ8` occurrence (lines 398,404,412,420-424,484-493,512-514,552-554,574,624,647) read in full context
7. `docs/specs/module_08_finance/design-contract.md` (860 lines) — §① (palette), §⑥ (S1–S4 precedent mapping), §⑦ (what was measured) read in full; §②–⑤ (component catalogue, RTL, fill-rule, HTML skeleton) skimmed by header only, not fully read
   `data-set.md` (334 lines, full)
8. `docs/specs/module_08_finance/world-sources.md` (64 lines, full)

Excluded per constraint and NOT opened: `stage0-sweeps/`, `stage1-review/`, `research/`, `discovery-log.md`, `src/`, DB.

---

## 1. Where I had to GUESS

**G1 — Payment-terms param has no settled name.** `data-set.md §7` flags `תנאי_תשלום_ימים` as "not in the DB at all" and even qualifies its own citation with "(או שם דומה)" — the reading list does not commit to a final param name. Minor (the blueprint creates it), but it is a real open naming decision, not a copy-paste.

**G2 — Payroll export filename contradicts itself inside the mandatory list.** `screens-approved.md` finding #5 (line ~618-627) declares the filename **corrected** to `08_2026_Payroll_Report.xlsx` (numeric month), and the mockup `06_mail_salary_approved.html` (line 146) matches that fix. But `data-set.md §5` and `§6` — same reading list, same day (26/08) — still hard-codes `אוגוסט_2026_Payroll_Report.xlsx` (Hebrew month name) as the canonical filename for the S3/M2 render, with no note that it was superseded. A blueprint session building the Excel-export function has two contradictory ground-truth values for the one thing it must literally type into a filename string, and nothing in `data-set.md` flags that its own value is stale.

**G3 — `data-set.md`'s own open flag is actually already closed, one section over.** `data-set.md §3` (project #14, cancellation) writes: *"⚠️ הנחה לא-מוכרעת... לא מצאתי הכרעה כתובה לצורך ההדגמה הזו — הנחתי שלא... דגל לסבב-ההכרעות הבא"* about whether travel is included in a cancelled shift's compensation line. But `processes-approved.md`'s own **ה29** (added the same day, and its text says it was raised precisely by *"סוכן-סט-הדאטה"* — i.e. by whoever wrote `data-set.md`) rules definitively: no travel component in a cancellation-compensation row. The outcome data-set.md guessed happens to match ה29, but the file still presents it as an open flag rather than a closed ruling — a session skimming only `data-set.md` would go hunting for a decision that already exists three files over.

**G4 — Severity/magnitude claims cited from an excluded directory.** Several ה-decisions and R-findings cite specific measured numbers from `stage1-review/` that the reading list does not let me open — e.g. ה23's anchor "R2-F3 measured a 2.1× gap" (processes-approved.md line ~344), or ה19/R4-F13's "5 M4 code sites… mapped in stage1-review F13" (line ~359). The *conclusion* (use `closing_unit_price` not `closing_unit_cost`; split off `hostess_bank_details`) is fully actionable from the reading list — but the supporting evidence is not independently checkable within it. This is a legitimate "list does not let you reach it" case, not a blocker.

**G5 — `design-contract.md §②–⑤` not fully read.** I verified §① (palette), §⑥ (screen→precedent mapping) and §⑦ (measurement log) in full, and spot-checked their claims against the live mockups (all matched — see §2). I did not read the component-catalogue / RTL / fill-rule / HTML-skeleton sections (§②–⑤, ~560 lines) line-by-line; I cannot personally vouch for every component-usage claim in that stretch, only that the sections it points to (Money, StatTile, etc.) are named consistently everywhere I did cross-check them.

None of G1–G5 block starting the blueprint. G2 and G3 are the two that a fresh session could act on wrongly without noticing, because nothing inside the reading list itself flags the contradiction.

---

## 2. What I FOLLOWED and verified (10 sampled cross-file checks — all in `docs/mockups/finance-screen/approved/*.html` against claims in `processes-approved.md` / `screens-approved.md` / `data-set.md`)

| # | Claim | Verified against | Result |
|---|---|---|---|
| 1 | S1 finding #1 fix: row #13 (finished tab) opens S2 "נעול-לעיון", not a separate card | `01_finance_overview_approved.html:396` `aria-label="פסטיבל קיץ עירוני, פתיחת חלון סגירת-תיק (נעול-לעיון)"` | ✅ matches screens-approved.md §① |
| 2 | S1 finding #2 fix: S3 sidebar icons match the emoji set used on S1/S2 | `03_salary_report_approved.html:196-203` — full 🏠👥📄📁👤📦💰📊 set present | ✅ |
| 3 | Score-tag format S1 = bare word, no number (ה16/finding #4 canonical) | `01_finance_overview_approved.html:406` `<span class="tag ok">טוב</span>` | ✅ |
| 4 | Score-tag format S2 still carries the number ("בבנייה: כ-S1", not re-drawn) | `02_closing_window_approved.html:314,417` — `"ציון 2 — טעון בירור"` / `"4 — טוב"` | ✅ consistent with the documented not-yet-redrawn state |
| 5 | Cancellation-fee three components sum to the locked anchor 3,508.00 (328.00 + 3,180.00) | `02_closing_window_approved.html:526-567` | ✅ digit-for-digit |
| 6 | Salary report: bonus/travel show "—" not "0.00 ₪" on cancellation-compensation rows (ה24/ה29) | `03_salary_report_approved.html:283-333` | ✅ |
| 7 | M2 payroll filename corrected to numeric-month form | `06_mail_salary_approved.html:146` `08_2026_Payroll_Report.xlsx` | ✅ in the mockup — **but see G2**: `data-set.md` disagrees |
| 8 | M1 invoice mail uses project #13 / `Invoice_4127.pdf`, matching data-set.md §6 | `05_mail_invoice_approved.html:114-152` | ✅ |
| 9 | Cancellation timing arithmetic: #14 cancelled 26/08 11:00 is exactly 30h before its 27/08 17:00 event start → falls in the 24–72h / 50% bracket (ה24) | `data-set.md §3` cancellation timestamp vs `processes-approved.md` ה24 bracket | ✅ math checks out |
| 10 | "written_off" bad-debt tag string is a single locked string across the two files that use it | `02_closing_window_approved.html:589` and `01_finance_overview_approved.html:479` both read `"הסתיים — לא שולם"` | ✅ byte-identical |

10/10 sampled claims held up. The one place a check surfaced a real problem (#7) is G2 above, not a mockup defect — the mockup is *right*, the shared dataset doc is stale.

---

## 3. The four self-answering questions

**① What stage is this Discovery at, per its own files?**
Hard to find, and genuinely contradictory *within a single file*. `processes-approved.md`'s own header (lines 6-7) says: *"סטטוס: 🚦 שלב 0 הושלם... ממתין לעצירה 1 (ישי)"* — i.e. Discovery hasn't even reached Stop-1 yet. Six lines below it, the "מצב" tracking table (lines 10-21) shows Stop-1, the delegation, and stages 1-א/1-ב already ✅, but stages **1-ג (process cards) / 2 (mockups) / 3 (spec.md+handoff) still marked ⬜**. Neither of those matches reality: the rest of the *same 384-line file* contains all four fully-approved process cards (P1–P4, "מאשר"/"מעולה מאשר"), a full audit wave, and three closed product questions dated the same evening. `screens-approved.md` (all 6 surfaces "מאשר את כולם") and `spec.md` itself ("Discovery הושלם 26/08/2026; אפס שאלות פתוחות") confirm the true state is **fully closed**. So the file carries three different snapshots of its own status (stale header → stale table → accurate body), and only the outermost document, `spec.md`, gives the correct one-line answer. A session that stopped reading at the top of `processes-approved.md` would wrongly conclude Discovery is barely started.

**② What may the blueprint NOT decide?**
Explicit in `spec.md §④/⑤` and `processes-approved.md`'s numbered ⑤-list: the exact travel reimbursement **amount** (§7.69 — stays a placeholder until verified with the accountant, before M10); the KPI quarter-window definition (owned by M7); refund-on-cancellation policy (declared out of scope); PDF export of the payroll report (future). Also global, from `CLAUDE.md` rule 8: no color/layout invention without Ishay's sign-off — but S1–S4/M1–M2 are already mockup-approved, so this mostly constrains anything the blueprint draws beyond the six approved files.

**③ What is already ruled and closed?**
Very large surface, verified consistent across files 1/4/5/6: all 16 sampled §7 items (19,20,37[half],38,46,52,57,58,61,63,68,69[mechanism only, amount open],78,79,80,92) are 🟢/⚪/🟠, none 🟡; all 29 ה-decisions in `processes-approved.md` §ה; all 4 process cards P1–P4; all 6 surfaces in `screens-approved.md`; the 3 product questions Ishay answered in person on 26/08 (cancelled-with-fee inclusion in reports; the `project_finance` child-table shape; scope-change pricing at list price). The `🚧 מ8` debt ledger in `PROJECT_MASTER.md` §6 (bank-structure validation explicitly *not* built by design; the "amount" column in the customer-card projects tab not including scope changes yet, flagged not blocking) is consistent with what M8 is asked to build.

**④ What is the top silent mine?**
**G2** — the payroll-export filename disagreement between `data-set.md` (still Hebrew month name) and `screens-approved.md`/the approved mockup (numeric month, explicitly "fixed"). It is silent because `screens-approved.md`'s own finding-log for this exact issue (finding #5) only lists the mockup file and the M2 card as corrected — it never mentions that `data-set.md`, the file that is supposed to be the single shared ground-truth for every mockup's numbers, was never updated to match. Anyone building the actual Excel-export RPC and going to `data-set.md` first (a reasonable thing to do, since it says "מקורות" in its own title) types the wrong string. Low blast radius (one filename), but it is exactly the kind of thing that a "coherence, not load" academic-demo grading pass (per `PROJECT_MASTER.md §1`) would notice on stage — a downloaded file whose name doesn't match what the screen showed.

---

## 4. Verdict: **READY-WITH-FIXES**

The product substance is unusually solid for a Discovery hand-off: 10/10 sampled cross-file numeric/string claims held up byte-for-byte, every §7 item in the reading list is closed or explicitly half-closed-with-owner, and the document set is honest about its own real gaps (S3's month-picker and history-list have no code precedent and say so plainly; several ⬜ validation-message gaps in `screens-approved.md` are marked, not hidden).

Three small, cheap fixes before a real blueprint session opens this cold:

1. **Collapse the stale status preamble in `processes-approved.md`** (header lines 4-9 + the "מצב" table lines 10-21) to match the file's own body — or replace both with a one-line pointer to `spec.md`'s "Discovery הושלם" line. Cost: one edit, no content lost (the table's history is redundant with the body it precedes).
2. **Reconcile `data-set.md §5/§6`'s payroll filename** (`אוגוסט_2026_Payroll_Report.xlsx`) with the corrected numeric form (`08_2026_Payroll_Report.xlsx`) already applied to the mockup and to `screens-approved.md`. Cost: two string edits in one file.
3. **Update `data-set.md §3`'s "לא מצאתי הכרעה כתובה"** note on travel-in-cancellation to point at ה29 (already closed, same outcome) instead of reading as an open flag for the next ruling round. Cost: one sentence.

None of the three blocks migration/RPC/screen planning — a blueprint session can proceed today and would only trip on #2 at the exact moment it writes the Excel filename string, and on #1 only if it (wrongly) trusts the file's own preamble over its body.
