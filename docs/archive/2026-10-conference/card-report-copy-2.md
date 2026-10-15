# Card: builder, report wording Ishay approved at 19:2x ("מאשר הכל")

**Role: builder.** Exact replacements only; no wording decisions of your own.
- **Worktree:** `C:\Users\ishay\Reg-In-payroll-e`. Run `git fetch origin && git checkout -b ishay/report-copy-2 origin/main`.
- Commit by explicit pathspec. No push, merge or deploy.
- **DB: SELECT only, plus ONE migration FILE that you write and never apply.**

## The approved changes (today → new). The numbers stay computed exactly as today
| Report | Today | New |
|---|---|---|
| Discounts (find the function: grep the live bodies for "לא לתת מעל") | "לא לתת מעל N% הנחה כדי לסגור — הסגירה בה A% מול B% בלי הנחה, והרווח יורד ל-C%." | "הנחה מעל N% לא משתלמת: נסגרות A% מההצעות (B% בלי הנחה), והשוליים יורדים ל-C%." |
| Hostess reliability | "…N הדיילות האדומות — … ; M דיילות ענבר לאזהרה." and every other visible "אדומות"/"ענבר"/"אדומה" used as a category name | "…N הדיילות בסיכון גבוה … M נוספות במעקב". The category names become "בסיכון גבוה" / "במעקב" |
| Drifting customers | "שתיהן שקטו פי X ופי Y מהקצב שלהן" (and its other count variants) | "שתיהן לא הזמינו כבר פי X ופי Y מהזמן הרגיל אצלן". Keep each variant's grammar (one customer / several) |
| Satisfaction / customers | "מול 41 אצל המרוצה" | "מול 41 אצל המרוצים" |
| Hostess load / fairness | "רבע הדיילות העמוסות 57.0% מהמשמרות" | "רבע מהדיילות עשו 57% מהמשמרות". Keep the number expression, and drop ".0" only if the format already allows it; otherwise keep the format |
| All report functions | visible label text with code-style hyphens: מבט-על · יתרת-חוב · חציון-סטייה · שעות-צוות · ציון-משוב · ראש-משמרת · אי-הגעה · מסנני-דף · באיחור-תשלום · דמי-ביטול · שיעור-היענות · ימי-האיחור · טופס-המשוב · שביעות-הרצון · מדרג-גיול · סוג-לקוח · דוח-סיכום · שינויי-תכולה · פרטי-בנק · שולי-רווח (m04, m08) | the same words without the hyphen. "ראש-משמרת" becomes "אחראית משמרת" |

## How
1. **Find each string in the live function bodies:**
   ```sql
   select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'report_%' and pg_get_functiondef(p.oid) like '%<text>%'
   ```
   Then read the exact SQL around each one. The anchors must be the live SQL text, with `v_lri`/`v_pdi`/`||`, not the rendered text.
2. **Write ONE file:** `supabase/migrations/20261014200000_module11_report_copy_2.sql`. Copy the technique of `supabase/migrations/20261014170000_module11_stage_copy.sql` exactly:
   - `pg_get_functiondef` + `pg_temp.m11_replace_once`, so each anchor must occur exactly once or the migration raises;
   - a counted plain `replace` is allowed only for a hyphen word that occurs N>1 times; assert the count;
   - `execute`, then a `proacl` assert per function.
   - Record in the header each function's md5 as measured before writing.
   - **Hyphen rule:** replace a hyphen word ONLY inside a string literal that is shown to the user. Never in comments, identifiers, column names or JSON keys. If a word occurs both in a comment and in a literal, anchor on the literal with its quotes.
3. **Client:** update every test, hint (`src/lib/onboardingCopy*.js`) and e2e anchor that quotes a changed string; search `src` and `e2e`.
4. **Gate:** `npm run gate > C:\Users\ishay\payroll-work\gate-report-copy-2.log 2>&1; echo exit=$?` must exit 0. Never pipe it into head/tail.

## Report (your final message)
- the SHA and the migration path;
- per function: the anchors and the counts, and its md5 before;
- the client files changed;
- anything not done and why;
- the gate exit code.

**Finish by 20:50**: the deputy applies and merges at 21:00, after the freeze.
