===== p5-fix-shell.json: fixes=11
  ✔ [2] identifiers formatted as quantities 
  ✔ [C2] '1 ימים' 
  ✔ [19] drill token twice in the export file name 
  ✔ [3]+[28] the header states a period the surface ignores 
  ✔ [8] customer echoed on the surfaces that ignore the filter 
  ✔ [9] empty-after-filter showed a bare header row 
  ✔ [26] masked-tab lock was an emoji 
  ✔ [27] window line collapsed to a bare 'כל הלקוחות' in the error state 
  ✔ [E1] e2e regression - the root row of m9 drilled instead of opening the project card 
  ✔ [C1] filter labels ended in a colon 
  ✔ [C9]+[C10] hint contradicted the base / two wordings for one tile 
-- gates:
   vitest: npx vitest run src/modules/11_reports src/lib/reports src/modules/09_settings => 723 passed | 1 failed (29 files), exit 1. The single failure is src/modules/11_reports/tabs/ExecutiveTab.test.jsx:775, 
   e2e_reports: npx playwright test --config=playwright.e2e.config.js e2e/reports.spec.js => 19 passed, exit 0 (log: scratchpad/e2e-reports2.log)
   eslint: exit 0 (src/modules/11_reports + reportsExport.js + reportsFormat.js + their tests + onboardingCopy.m11.hostesses.js)
   prettier: --check exit 0 on the same set
   dup: npm run dup exit 0 - total 1.01%, jsx 1.28% (cap 3%)
   bidi: npm run check:bidi exit 0
   build: npm run build exit 0 (the last build is what the preview on 5189 and the playwright preview served)
   cr: CR=0 on all 14 files touched (12 modified + 2 new test files)
-- not_done:
  ✗ [1] export caption file name broken across the bidi boundary → NOT REPRODUCIBLE, and the proposed fix measured as a regression - so it was implemented, measured and reverted. The anomaly cites results/evidence/CEO-m2-exec-overview-export-caption-block.png as two lines with .xlsx at the left of line 2; in that exact PNG, a
  ✗ [28] m22 still prints a period it does not use → The shell rule picks up any surface whose payload says window.from is null, and m22 is the only period-ignoring surface that does not: it computes v_from := coalesce(p_from, date_trunc('year', v_to)) and never uses it in a query - it only echoes it into the wi
  ✗ [2] collateral - one tab test still asserts the grouped id → src/modules/11_reports/tabs/ExecutiveTab.test.jsx:775 finds the m4 row by findAllByText(isolateLtr('1,907')); with the id formatter the cell now reads the isolated 1907. tabs/** is outside my set and I did not touch it. EXACT ONE-LINE PATCH: isolateLtr('1,907'
  ✗ EMPTY_AFTER_FILTER wording when the emptying filter is a customer → The state-2 sentence is 'אין נתונים בתקופה שנבחרה' (locked in components/reportsCopy.js) and it now appears for a CUSTOMER filter on m21 - see drifting-empty-after.png. m11-copy-rules 2.5 rules exactly this class under rule 17 ('אין שינויי-תכולה בתקופה שנבחרה'
-- not_verified:
   - [2] on m4 itself (quote_id): my dispatch was exec-overview+trends; I verified the identical mechanism on m9's project column instead, plus a unit test built on m4's own column declaration.
   - [C9]/[C10] as rendered text: the hostesses run shows hints=10 on m14, but I read the hint strings out of the source, not out of a PNG.
   - [8] with a customer actually selected on a hostesses surface: verified with no customer chosen (header has no customer clause, selector disabled). The 'picking a customer changes nothing' half is the flag+label chain, not a screenshot.
   - The error state on a hostesses surface WITH ?customer=: the flags exist only once a payload loads, so there the selector stays enabled and a chosen customer would still be echoed. Not exercised - see blind_spot.
   - npm run gate as a whole (knip, gitleaks, audit, check:context, check:docs-structure): I ran the gates my brief named plus build. The doc and rpc fixers are editing docs/ and supabase/migrations/ in parallel, so a full gate now would measure their tree, not min
   - e2e/accessibility.spec.js and the rest of the e2e suite: not run. The E2E agent's two uncommitted spec files were left exactly as they were.
-- blind_spot: src/modules/11_reports/ReportsPage.jsx - readScope only ever fires from a payload that LOADED (ReportSurface calls onWindow after a successful callReport). So every filter guarantee added here is silent in the two states where no payload exists: loading and error. Concrete, checkable scenario: open /reports?tab=hostesses&report=hostess-overview&customer=414 with the RPC aborted (the evidence runner's --extras error does exactly this) and the customer selector is enabled with 'בטא הפקות' selected

===== p5-fix-rpc.json: fixes=0
-- gates:
   npm run check:declared-counts: exit=0 — 'check:declared-counts ✅ 6 מספרים מוצהרים נבדקו מול המקור, כולם תואמים' (scratchpad/j1/gate-counts.log)
   npm run check:docs-structure: exit=0 — 'check:docs-structure ✅ 160 קבצים נסרקו, אפס ממצאים' (scratchpad/j1/gate-docs.log)
   npm run format:check: exit=0 (scratchpad/j1/gate-format.log) — run because I edited two .md/.sql docs and Prettier gates .md
   CR count: 0 on all three files I touched (perl -ne '$n+=tr/\r//')
   registry names: 8 rows, compared by NAME not count: module11_j1_m16 · _m08 · _m14 · _m15 · _m20 · _m21 · _m22 · _m09
   grants: proacl on all 8 = postgres=X | service_role=X | authenticated=X — no PUBLIC, no anon
   blocked identity: E2E_RECRUIT (role 'מנהלת גיוס ושיבוץ', permission_level='blocked' on 'כספים') ⇒ HTTP 403 / SQLSTATE 42501 on report_m08_profitability AND report_m09_aging
-- not_done:
  ✗ [C5] third half — the run bar says 'מציג את הריצה' (singular) while two approved runs are shown together → The sentence is composed in JSX, not in SQL: src/modules/11_reports/tabs/customers/AnalysisRunBar.jsx:165 — `text: \`מציג את הריצה מ-${day}, אושרה ע\"י ${run.approved_by}\`` (re-checked this turn). That file is outside my set AND outside the shell fixer's set 
  ✗ [C8] remainder — 'דלי' still appears 3× on the מ9 screen, inside the mode-0 chart narrative paragraph → Those three are in `v_chart_note` (the seven-line per-bucket paragraph). The brief says that paragraph is a question for Ishay and 'do not touch it'. I read that prohibition as narrower than the harmonisation instruction and obeyed the prohibition: I changed o
  ✗ [C4] adjacent — the מ20 onboarding hint restates the base note's multi-reason caveat → The hint text lives at src/lib/onboardingCopy.m11.customers.js:59 ('ספירות הסיבות נקראות מתוך שדה שמאפשר ללקוח לסמן יותר מסיבה אחת, ולכן הן מוצגות כ"כמה מתוך כמה" ולא באחוזים.'). The shell fixer's set names only onboardingCopy.m11.hostesses.js, so no fixer in 
  ✗ [C7] year-ago comparison row — four wordings across nine surfaces → Explicitly not mine per the brief; it touches nine functions and needs a wording ruling. Untouched, including on the eight functions I did edit.
  ✗ [5] ripple — the on-screen hint `reports.profitability.sortWhy` now contradicts the table it describes → src/lib/onboardingCopy.m11.finance.js:76 ends '… ושורה שמסומנת "מתחת לרצפת-המהותיות" יורדת לסוף הטבלה כי המכנה שלה זעיר מדי' (read this turn). After J1 no such row is in the table at all — the 22 below-floor over-threshold projects are excluded, and every retu
-- not_verified:
   - מ8's table went from 30 rows to 8 — I measured that independently (241 in population · 30 over threshold · 22 of them below the floor · 8 ranked · min(planned_hours) among the ranked = 4.0), but I did NOT get a product ruling on the consequence: the tile 'פרוי
   - The מ8 row key `below_materiality` is now false on every returned row. I kept the key (the export and any tab-side marker read it, and removing a contract key is not a text fix), but no reader was re-checked after the change — if a tab renders a 'below the flo
   - I verified every changed payload string through the RPC over PostgREST as a signed-in CEO, not in a browser. Nothing in this round was seen rendered on a screen — bidi behaviour of the two new parenthesised runs (מ8's '(21.1% מעל התכנון)' and מ16's '(43 ₪)') i
   - The comparison between what מ14 and מ15 print is now textual only: both take the numbers from different variables (v_c_frozen vs v_c) that happen to be equal today (0.958358 in both metas). Nothing enforces that they stay equal; if the two windows ever diverge
-- blind_spot: Two places still describe מ8's table the way it behaved before J1, and both are checkable in one grep each. (1) ON SCREEN, and this is the one that matters: `src/lib/onboardingCopy.m11.finance.js:76` — the `reports.profitability.sortWhy` guided hint ends '… ושורה שמסומנת "מתחת לרצפת-המהותיות" יורדת לסוף הטבלה כי המכנה שלה זעיר מדי'. That row no longer exists: the live `rows` of report_m08_profitability now returns 8 rows, all with `below_materiality:false`. I read the line this turn; the file be

