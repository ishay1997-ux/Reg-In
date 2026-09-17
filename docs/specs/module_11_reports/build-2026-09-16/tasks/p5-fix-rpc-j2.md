# P5-FIX-RPC-J2 · second RPC round — "מהיסוד, בלי קיצורי דרך" (Ishay, 17/09/2026 00:5X) — written by the orchestrator

**Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Read `p5-fix-rpc.md` first (same rules, same apply-and-prove discipline, same output shape), then THIS. Your file: ONE new migration `supabase/migrations/20260917<HHMMSS>_module11_j2_rpc_round5.sql` (J1 from the first round is already applied and committed or about to be — start from the LIVE bodies: `select proname, md5(prosrc) from pg_proc` and `docs/schema.sql §24` name the live file per function; if J1 exists, the functions it touched live in J1). You also own `docs/schema.sql §24` and `docs/db_roadmap.md §10ב` (one row for J2) and — for item 3 only — the affected label rows of `docs/specs/module_11_reports/spec.md §1.4` (+ its declared count, then `npm run check:declared-counts` must exit 0). **Nothing in `src/`. Never commit.**

Why this round exists: the first round fixed symptoms on the shell where the contract was silent; Ishay's word is *"מטפלים הכל מהיסוד בלי קיצורי דרך"* — so the contract carries the truth and the shell only renders it.

## 1. Identifiers declare `format: 'id'` (the contract, not a key heuristic)
Every `columns[]` entry whose value is an identifier declares `'format','id'` instead of `'int'`: `quote_id` in `report_m04_discounts` (live = D2, `…083000_module11_d2_rpcs_executive_fixes.sql:1280`), every `project_id` column in the finance functions (the I1/I2 bodies: `grep -n "'key', 'project_id'" supabase/migrations/20260916114500_*.sql supabase/migrations/20260916194500_*.sql` — map each hit to its function: מ7 · מ8 · מ9 root and drill · מ12), and any other `*_id` column you find with `grep -on "'key', *'[a-z_]*_id'" supabase/migrations/20260916*.sql` in a LIVE body (hostess/customer ids in the hostesses/customers functions if present). The shell (round 1) already renders `format:'id'` as plain digits, no grouping, LTR-isolated. Do not change labels here.

## 2. The comparison half of every tile — one wording, the ruled one
`processes-approved.md` 📐1 (line ~781) and 🗳️ ruling 15(ב) (line ~917) lock the shape: **▲/▼ uncoloured + the previous value, worded *"אשתקד <value>"*** (the ruling's own example: *"אשתקד 1,196,000 ₪"*). Tonight the screens carry four wordings (`results\copy-summary.md`, cross_surface item 1): *"2025 באותו טווח: …"* (הנהלה) · *"לפני שנה, אותו חישוב: …"* · *"התקופה המקבילה אשתקד: …"* · *"אשתקד באותו טווח (109 מתוך 136): …"*. Harmonise every tile's `compare` label across the nine surfaces the evaluator listed (מ2 · מ4 · מ6 · מ8 · מ12 · מ20 · מ14 · מ15 · מ17 — and any other function that prints a compare label) to the ruled form **"אשתקד: <value>"** (keep a surface's extra denominator in parentheses where it exists today, e.g. *"אשתקד (109 מתוך 136): …"* — that is information, not wording). This is spec conformance, not a הנחתי. Where a tile compares to a median rather than to last year (📐15), leave that label alone and list it.

## 3. Month labels on chart axes — one format
Three formats tonight: *"2025-09"* on מ14 (ISO, machine form) · *"09/2025"*-style on the finance chart · *"ינואר 2026"* on the customers chart · plain Hebrew month names on מ2's single-year axis. Ruling 15(ח) fixes dates as `DD/MM/YYYY`; month axes are not ruled. Harmonise to **Hebrew month name + year where the axis spans more than one year (*"ספטמבר 2025"*), Hebrew month name alone within one year** — the majority form on the screens today and the readable one (`הנחתי`, morning table; source checked: 15(ח) + the four screens). Change it where the label is produced — in the RPC's chart rows (C8: labels come from the payload); if a function returns ISO keys for the shell's `label_source` mapping, keep the key and add the label. Functions: מ14 (`report_m14_hostess_overview`) and whichever finance function draws *"09/2025"* (find it: `grep -n "to_char(.*MM/YYYY\|YYYY-MM" supabase/migrations/20260916*.sql`).

## 4. *"חלון קפוא · 12 חודשים"* (מ14's red-queue tile window)
`docs/plans/ui-copy-styleguide.md` line ~157 locks *"קפוא"* as the glossary word for a price frozen at closing. Rename the window label to **"חלון קבוע · 12 חודשים"** (`הנחתי`; the mode-0 evaluator's finding, R11 + styleguide §3ב/§3ד) in the RPC and in `spec.md §1.4` if the label is listed there (it is quoted in `p3-common-addendum.md` as the tile's window label — check §1.4 with grep and keep the declared count right).

## 4ב. מ22 echoes a period it never uses (round-1 shell `not_done` [28])
`report_m22_notes` computes `v_from := coalesce(p_from, date_trunc('year', v_to))` and never queries by it — it only echoes it into `window`. The shell's period rule (round 1) keys on `window.from == null` or `meta.period_filter_ignored`, so מ22 still prints a period. Make מ22 honest like the aging functions: `window.from = null`, `window.label = 'כל הזמנים'` (the population line already says the page ignores the period), and set `meta.period_filter_ignored` — then the shell disables the pills with the reason. Keep `v_to` (the "נכון ל-" date) if the export name uses it.

## 4ג. The 'דלי' remainder inside מ9's chart narrative
J1 harmonised 'דלי' ⇒ 'מדרג' everywhere except the three occurrences inside `v_chart_note` (the seven-line per-bucket paragraph), because that paragraph's EXISTENCE is a question for Ishay. Its TERMS are not a question: replace those three too — the paragraph stays exactly as long, the word changes. Report the three replaces.

## 5. Anything the first round's RPC fixer left in `not_done`
Read `…\scratchpad\results\p5-fix-rpc.json` `not_done[]` — take every item that is an RPC change and do it here; list what you did not take and why.

## Apply and prove — exactly as `p5-fix-rpc.md`: per function < 60 KB, registry NAMES, md5 file == live for every function you touched, signed-in probes (CEO 200 + the changed strings; one blocked identity ⇒ 42501), grants byte-identical, `schema.sql §24` pointers + bodies in place, `db_roadmap §10ב` row, CR=0, `check:declared-counts` + `check:docs-structure` exit 0.

## Output — `…\scratchpad\results\p5-fix-rpc-j2.json`, written after EVERY function, same shape as J1's plus `"compare_labels": [ { "fn", "before", "after" } ]`, `"id_columns": [ { "fn", "key" } ]`, `"month_axis": [ { "fn", "before", "after" } ]`.

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
