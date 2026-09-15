# Module 11 (Reports) — Register Sweep

Mechanical transcription only. No rulings, no recommendations. Every item below was read to its end
(next numbered/bulleted line at column 0), not just its opening sentence.

---

## Section A — `PROJECT_MASTER.md` §6 (debts register)

Command run:
```
awk '/^## 6\./{f=1} /^## 7\./{f=0} f' docs/PROJECT_MASTER.md | grep -n -F '🚧 מ11'
```
Raw stream hits: **10** (lines within the filtered §6 text). Real file line numbers: 458, 466, 634,
685, 690, 695, 702, 709, 712, 713. Of these, **466 and 690 are not new items** — they are
continuation/forward-reference lines inside items 458 and 685 respectively. **Distinct מ11 debt
items: 8.**

Name-variation control run:
```
awk '/^## 6\./{f=1} /^## 7\./{f=0} f{print NR": "$0}' docs/PROJECT_MASTER.md | grep -n -E 'דו"חות|דוחות|reports'
```
Raw hits: **13** (file lines 451, 570, 572, 573, 634, 642, 648, 650, 658, 668, 685, 712, 718).
Of these, 634/642/648/650/658/668 are all inside item 634 (already token-counted); 685 and 712 are
already token-counted; 570/572/573 match on the substring `reports` inside `salary_reports` (מ8←מ4
item, not מ11); 718 matches plain `דוחות` inside `דוחות-שכר (~32)` inside a מ12 scalability item
(watch-list mention, not a מ11 debt). **Genuine name-hit-without-token: line 451** — a **closed** מ3
item ("מובילים לפי הכנסה", ✅ נסגר 31/07/2026 כ"לא נדרש") whose stated reopen-trigger says: *"או
דו"חות מ9/מ11 זקוקים להכנסה כ**פלח** ולא כסדר."* This does **not** carry a `🚧 מ11` token (correctly
— it is a closed item with a future reopen condition, not a live debt), but it does name מ11 as a
context that could reopen a מ3 decision. Reported per instruction, not as a missed debt.

| Source + grep anchor | Head state | Tail/final state | What it dictates to m11 (one line) | Verdict |
|---|---|---|---|---|
| §6:458, anchor `🚧 מ11 ← מ3` | "מנוע-המיילים המשותף + יומן-השליחות (נבנו במ3, 30/07/2026)" — describes the generic engine מ3 built | Line 466 (same complex, continuation): "ומה שנשאר פתוח, וצר בהרבה — ולכן `🚧 מ8 · 🚧 מ11` נשארים חיים" — engine exists, m11 must still add its own placeholders/subject/recipient + widen the `email_log.entity_type` CHECK by one value + add its own module-gated SELECT policy, in the same migration as its send code | Consume `src/lib/email.js` + `send-email` as-is; do not build a parallel engine (jscpd blocks in CI); widen `email_log.entity_type` CHECK + add own read policy, together with deploy, never before | dictates-to-m11 |
| §6:634, anchor `שני חורי-דאטה שמודול-הדוחות יגלה` | "שני חורי-דאטה שמודול-הדוחות יגלה מאוחר מדי אם לא ייכתבו עכשיו" — framed as urgent, must-write-now | Long item ends: "⏳ ולמה זה נדחה ולא נעשה עכשיו... מה שמאבדים בהיעדר-רישום אינו מאמץ אלא היסטוריה... **ההמתנה אינה עולה דבר**" — deliberately deferred; the checking mechanism was already built into `module-blueprint`/`module-close` (12/08/2026) so future modules get asked the same question 12 times cheaply instead of once expensively | The two concrete holes for m4 data: (a) invite-resend overwrites `invite_sent_at`, so "how many reminders until she answered" is uncomputable; (b) no assignment status-history, so "when was she finally approved relative to the event" is uncomputable. Both are **accepted gaps**, not build items, until real usage history accumulates | dictates-to-m11 (head≠tail: urgency reframed as deliberate, mitigated deferral) |
| §6:685, anchor `הדו"חות הומצאו בלי שאלה מנחה` | "הדו"חות הומצאו בלי שאלה מנחה, ומ6 מספק להם את הדאטה" — Ishay: "את הדוחות אני המצאתי. אין לי מושג מה השאלות שלהם" | "✅ מה שכן הוכרע ואומת: מי רואה" (matrix: CEO edit · finance edit · projects-mgr view · recruitment/logistics blocked) + "🔴 ותלות-דאטה חוסמת אחת — נוסחה מחדש 19/08/2026... כי הנוסח הישן כבר הטעה פעם" — the item's OWN earlier wording (blaming `logistics.line_id`) was wrong and was rewritten after live measurement | m11 Discovery must start from the guiding business question, not from the report shape; the who-sees matrix is already settled; "planned vs actual" profitability is uncomputable until a writer is added for `quote_service_line_id`/`project_change_id` on scope-change rows — whoever builds the report also adds the writer | dictates-to-m11 (head≠tail: item's own prior wording explicitly flagged as having misled once, then corrected) |
| §6:695, anchor `רווחיות "תכנון מול ביצוע" לא תהיה ניתנת לחישוב` | "רווחיות... לא תהיה ניתנת לחישוב על שורות-לוגיסטיקה שנולדו משינוי-תכולה — וזה מבני, לא השמטה" | "⚠️ ומה שמ11 צריך להחליט כשיגיע: האם לסדר מחדש `apply_scope_change`, או לגזור את המקור בעקיפין, או לקבל שהמימד חסר לשורות האלה" + explains why filed under מ11 not מ6 ("מ6 סגור וחי בייצור... מ11 טרם נבנה ⇒ יש קורא") | Scope-change-born logistics rows carry NULL in both source-pointer columns by design (decision ㉗, 22/08/2026); m11 must choose: reorder the merged RPC, derive origin indirectly via `project_changes.created_at`, or accept the gap for those rows only | dictates-to-m11 |
| §6:702, anchor `בסיס-העלות לחישוב רווחיות: actual_qty או planned_qty` | "לא הוכרע" | "מה כן הוכרע, וזה מצמצם את השאלה: צד-ההכנסה סגור... הפתוח הוא צד-העלות בלבד" — narrowed, still undecided; "המודול שמחשב רווחיות הוא שיכריע" | Cost basis for profitability (actual_qty vs planned_qty) is an open decision m11 must make; revenue side is already settled (billed by ordered qty, per M6's ⑳); M6 has already delivered the recompute trigger, status-source import, and atomic write for the logistics tables m11 will read | dictates-to-m11 (open decision, not yet closed) |
| §6:709, anchor `פער "מתי השתנה"` | "עריכת מיקום/שעות דרך `update_project_details` על פרויקט עם אפס דיילות מאושרות-סופית אינה שולחת מייל ואינה נרשמת בשום מקום" | Single-paragraph item; ends "חוב-דיווח, לא שינוי-סכימה עכשיו" — no separate tail reversal | "When did the location change" is uncomputable for projects with zero finally-approved hostesses at edit time; date changes DO leave a trace (assignment invite rounds); mail-driven changes land in `email_log` | dictates-to-m11 |
| §6:712, anchor `חוזה-אספקה: דוחות-רווחיות + דוח-שכר` | "מ8 בונה את שלושת המספרים שדוח-הרווחיות של מ11 צורך" | Same paragraph ends with an open caveat: "⚠️ הרשאת-הקריאה של תפקידי-מ11 על `salary_reports` לא נבדקה — מ11 מוודא policy בשער המתאים, לא מניח ירושה" | m8 supplies: gross-profit % (derived live from frozen `final_profit`), budget-deviation ₪ (formula ה18), feedback score (`projects.feedback_score`); report population = `finished` + resolved-cancelled (tagged separately); m11 reads `salary_reports`/`salary_report_lines` read-only and must add its OWN RLS policy, not assume inheritance | dictates-to-m11 |
| §6:713, anchor `רווח-תפעולי/נטו אינו נבנה` | "רווח-תפעולי/נטו אינו נבנה — ומ11 מקבל תזרים-מזומנים במקומו" — states the decision already in the head | Same paragraph: "הוכרע §7.93 (קלוד בהאצלת-ישי, 03/09/2026)... כל 28 טבלאות הסכמה נבדקו ואין בית להוצאות-קבועות" | m11 builds a cash-flow view (`invoice_sent_at`/`payment_date`/`תנאי_תשלום_ימים` — already exist, a query not a new capability), NOT operating/net profit — do not reopen as a product question | dictates-to-m11 (no flip; decision stated in head) |
| §6:451, anchor `דו"חות מ9/מ11 זקוקים להכנסה` | Closed מ3 item ("מובילים לפי הכנסה"), reopen-trigger only | n/a — not a live debt | Informational only: if m9/m11 reports need revenue as a filterable segment (not just a sort key), that could reopen this closed מ3 decision about `total_revenue` | informational |

**Section A counts:** raw token-grep hits = 10 · distinct מ11 debt items = 8 · name-hit control raw = 13
· genuine name-hit-without-token = 1 (line 451, informational) · **head≠tail (meaning changed) = 2**
(items §6:634, §6:685).

---

## Section B — `PROJECT_MASTER_sec7.md` (open-questions register)

Commands run:
```
grep -nE 'מ11([^0-9]|$)' docs/PROJECT_MASTER_sec7.md
grep -nE 'דו"ח|דוח|report' docs/PROJECT_MASTER_sec7.md
```
Raw מ11-token hits: **6** (file lines 179, 292, 350, 356, 358, 360) → **5 distinct items** (§7.58,
§7.82's sub-bullet, §7.95, §7.97, §7.93 — 93 has two hits, 358 and 360, same item).
Raw report-word hits: **24**.

Current §7 tally (as of the last recorded snapshot, line 28): **🟢64 · 🟡8 · 🔵3 · ⚪16 · 🟠1 = 92**
(snapshot dated 28/08/2026). ⚠️ **This snapshot is now stale relative to items read below**: §7.95,
§7.96, §7.97 are dated 03/09/2026 and §7.99 is dated 04/09/2026 — all after the 28/08 snapshot — so
the live 🟢/🟡 counts are higher than what the counter currently shows. Not re-tallied here (out of
scope for a register sweep); flagged so a stale count is not quoted as current.

Required items read in full (per the assignment's list of 20 item numbers — 14, 15, 22, 33, 36, 37,
52, 57, 58, 59, 68, 69, 79, 80, 82, 93, 95, 96, 97, 99):

| Item · anchor | Head glyph/state | Tail/final state | What it dictates to m11 | Verdict |
|---|---|---|---|---|
| §7.14, `Smart Match — סקלת ציון` | 🟢 סגור — states weights **0.4/0.3/0.3** as the decision (07/07/2026) | "⚠️ המשקולות שנקבו כאן — 0.4/0.3/0.3 — הוחלפו 22 יום אחר-כך ואינן בתוקף... §11.1 הוא ה-SSOT" | Not m11-facing directly (Smart Match internals), but a general-register lesson: a 🟢-closed item's numbers can be stale even inside a closed item — always chase the cited SSOT, never quote a closed item's numbers without checking | informational (head≠tail) |
| §7.15, `W3 — יישור טרמינולוגיה` | 🟢 סגור — multi-round item; not m11-facing | Final ruling includes a reversal flagged explicitly: "🔴 היפוך מאוחר (ישי, 09/08/2026)... אין צורך בתקרה, מיותר... **וזה מבטל את תובנת-המוצר שלו-עצמו מ-29/07 ואת ההכרעה מ-07/08**" | Not m11-facing (Smart Match hostess-count cap) | informational (head≠tail, self-flagged reversal) |
| §7.22, `לוגיסטיקה — actual_qty קטן מ-planned_qty` | 🟢 סגור·לוגיקה·מ5/8 — "לא חוסם 'מוכן לביצוע'" | Ends: "🔑 התבלטות שנפתחה ולא הוכרעה כאן... חישוב-הרווחיות צריך לצרוך actual_qty ולא planned_qty... זו עבודה של המודול שמחשב רווחיות (8/11)... ראוי לרשום `🚧 מX ← מ5`" — this is the origin of §6:702 above | Cost-basis-for-profitability decision belongs to whichever module computes profitability (m8/m11); flagged, never separately registered until §6:702 (22/08) closed that gap | dictates-to-m11 |
| §7.33, `עודף זימונים — נתיב שחרור` | 🟢 סגור — not m11-facing | Mechanism refined 09/08 (code, not DB trigger) so the release fires atomically with the release-email | Not m11-facing | informational |
| §7.36, `כשל שליחה טרנזקציוני` | 🟡 פתוח·אוטומציה·מ10 | Half-closed 13/08 (DB constraint prevents "project moved to billing without a report"); "מה שנשאר פתוח... (א) כשל-השליחה עצמו — מודול 10; (ב) ניקוי-יתומים ב-Storage — טרם הוכרע" | Not m11-facing (mail delivery failure handling — m10's scope) | informational |
| §7.37, `שקלול ציון המשוב` | 🟡 פתוח·לוגיקה·מ7/8 | "✅ חצי-השקלול הוכרע... אין נוסחת-שקלול במערכת... מה שנשאר פתוח: חלון-ה-KPI בלבד (רבעון קלנדרי / 90-יום נגלל) — של מ7" — closed by §7.95 (see below) | The satisfaction-score m11 would read is a single manually-entered 1–5 score (no sub-question weighting exists or is planned); the window question (quarterly vs rolling) is m7's, not m11's — though m11 can cut by calendar quarter separately if it wants (per §7.95) | dictates-to-m11 |
| §7.52, `רווח גולמי סופי — נשמר או נגזר` | 🟢 סגור·לוגיקה+DB·מ6/8 — states the two-number design (11/07/2026): "רווח צפוי" (derived-live) vs "רווח סופי" (frozen ₪ at closing) | "✅ בוצע ונסגר 28/08/2026 (מ8)... `final_profit = 207.40 ₪` קפוא, פרויקט #12" + a later clarification (14/08 01:17) that "בסגירת-האירוע" means m8's **financial** close, not m6's operational close — m6 freezes its own inputs (actual_hours, attendance, closing timestamp), m8 freezes the number | This is m11's SSOT for "final profit": `project_finance.final_profit`, frozen at m8's financial close (not m6's operational close); % is always derived for display, never stored | dictates-to-m11 (head≠tail: same-financial-close-vs-operational-close distinction clarified a month after the original ruling, because the two closes didn't have names yet in 11/07) |
| §7.57, `פרמטר-רפאים יום_הפקת_דוח_שכר` | 🟢 סגור·לוגיקה·מ3/8 | "✅ הוכרע (12/07/2026): ידני... דו"ח-מתוזמן = gold-plating, לא נבנה" | Not m11-facing (m8's manual "export & send" trigger) | informational |
| §7.58, `נוסחת סטיית-התקציב` | 🟢 `סגור·לוגיקה·מ8/11` — head states an unresolved mismatch (per-shift planned cost vs per-hour actual cost, no bridging rule) | "✅ הוכרע (26/08/2026)... מספר אחד בש"ח פר-פרויקט, על צד-העבודה בלבד... כלל-הגישור: התעריף זהה בשני הצדדים והשעות הן המשתנה" — this is the exact source of §6:712's "ה18" formula | m11's budget-deviation number is the ONE ₪ figure per project on the labor side only; goods do not contribute deviation (quantity basis is identical in plan and actual, per M6's ⑳); displayed in ₪ per C5 §5.7.4 | dictates-to-m11 |
| §7.59, `הגדרת ה-KPI "רווח גולמי משוער לחודש"` | 🟡 פתוח·לוגיקה·מ7 | Enrichment (11/07): Ishay explicitly requested a monthly cumulative view ("תובנה עסקית מעניינת"): closed months = frozen final numbers, future months = live expected profit; §7.52's two-number model already supplies both sides — "נותר למ7 להגדיר אוכלוסייה/מקרי-קצה בלבד". **Closed by §7.96 below.** | m7's dashboard KPI shares the same two-number model m11's reports will read; m11's own quarterly cuts (if any) can reuse the same population logic once §7.96 nails it down | dictates-to-m11 |
| §7.68, `דוח-שכר כמסמך` | 🟢 סגור·DB·מ8 | "✅ סגור — בוצע 28/08/2026... דוח 13, אוגוסט 2026, 292.60 ₪, האקסל הורד... והפקה שנייה נחסמה" | m11 reads the resulting `salary_reports`/`salary_report_lines` (period UNIQUE, frozen snapshot rows, total_amount) — read-only, per §6:712/ה1 | dictates-to-m11 |
| §7.69, `"+ נסיעות" בתבנית-הזימון` | 🟠 `סגור-מנגנון·לוגיקה·מ4/8` — mechanism decided (fixed amount/shift), amount itself undetermined | "עד היום `סכום_נסיעות_למשמרת` היה 0... המיגרציה עדכנה אותו ל-22.60 — תקרת-החוק היומית — רק במקום שהוא עדיין 0... **זה ערך-בדין כברירת-מחדל, לא הסכום הסופי**" | Travel is a direct-expense line item in the gross-profit formula (§5.14) that m11 would also read/consume for profitability reporting; the seeded 22.60 is a legal-ceiling default, NOT a verified final figure — do not treat it as ground truth for profit accuracy checks | dictates-to-m11 |
| §7.79, `רווח גולמי מצטבר פר-לקוח` | 🟢 סגור·לוגיקה·מ8 — head cites C6 §2.4.1 and an initial (wrong) routing to מ7 | "תיקון-ניתוב (10/07 ערב)... היעד המקורי 'מודול 7' היה שגוי... בעל-הנוסחה הוא מ8" then "✅ הוכרע (26/08/2026)... רווח-גולמי-מצטבר = Σ רווח-סופי-קפוא על `finished` בלבד; ממוצע-משוב = על `feedback_status='completed'` בלבד" + same-day extension: population also includes resolved-cancelled | This is the exact population rule m11's per-project and per-customer profitability reports must reuse: `finished` OR cancelled-with-resolved-fee, tagged; feedback average only over `completed` feedback | dictates-to-m11 (head≠tail: routing target itself was wrong at first and corrected same evening) |
| §7.80, `מיפוי ציון-שביעות → תגית-מלל` | 🟢 סגור·מסך+לוגיקה·מ8 | "✅ הוכרע (26/08/2026): 5=מצוין · 4=טוב · 3=בינוני · 1–2=טעון-בירור; ירוק 4–5 · צהוב 3 · אדום <3" | If m11 displays a satisfaction tag/color anywhere, this is the canonical threshold mapping (shared `ScoreCell` component per §7.99 below) | dictates-to-m11 |
| §7.82, `חבילת הכרעות-הבנייה של מודול 3` | ⚪ ממתין-לביצוע·DB+מסך·מ3 — large umbrella item, mostly not m11-facing | Sub-bullet (line 292): "*(מגמות-לאורך-זמן/win-rate → דו"חות מ11.)*" — current-state filters/views live in m3; anything trend-over-time or win-rate is explicitly routed to m11 | m3's quote-status filters/views (status, customer, date ranges, rejection-reason breakdown, "expiring soon") are current-state only; win-rate and trend analysis over time is explicitly m11's job, not m3's | dictates-to-m11 |
| §7.93, `אילו סוגי-רווח המערכת מציגה` | 🟢 `סגור·מוצר·מ8/מ11` — head poses the terminology question (gross → operating → pre-tax → net profit) | "✅ הוכרע (קלוד בהאצלת-ישי, 03/09/2026)... לא בונים רווח-תפעולי/נטו... למ11: תצוגת תזרים-מזומנים במקום" — same as §6:713 | Same as §6:713: m11 gets cash-flow, not operating/net profit; do not reopen as a product question | dictates-to-m11 |
| §7.95, `חלון-הזמן של KPI-שביעות-הרצון` | 🟢 סגור·לוגיקה·מ7 | "✅ הוכרע (ישי, 03/09/2026): 90-יום נגלל" — closes §7.37's leftover window question; explicit carve-out: "זה תפקידו של מ11, שיכול לחתוך לפי רבעון קלנדרי בנפרד אם ירצה" | m7's dashboard KPI uses a rolling 90-day window; m11 is explicitly free to cut by calendar quarter separately for formal reporting — the two are NOT required to match | dictates-to-m11 |
| §7.96, `אוכלוסיית ה-KPI "רווח גולמי משוער לחודש"` | 🟢 סגור·לוגיקה·מ7 | "✅ הוכרע (03/09/2026): אוכלוסייה = כל פרויקט שה-final_event_date שלו נופל בחודש היעד... פרויקט מבוטל אינו יוצא מהאוכלוסייה... העוגן — תקדים-עוקב ישיר: §7.79" | Confirms the §7.79 population pattern (cancelled-with-resolved-fee stays IN, gets frozen profit the moment resolved) generalizes to month-level cuts too — same principle m11 would apply | dictates-to-m11 |
| §7.97, `מיהו רואה את כרטיסי-הכסף במסך הבית` | 🟢 סגור·אבטחה·מ7 | "✅ הוכרע (ישי, 03/09/2026): (א), המיסוך" — masking chosen over removing the cards; alternative (ב) explicitly considered and rejected was "להוריד... לתת להם בית במ8/מ11/מ3" | Confirms `project_finance` stays m8-only-gated (CEO+finance); m11 must add its OWN module-gated read policy per the `email_log` precedent (A-20), never widen m8's policy | dictates-to-m11 |
| §7.99, `כרטיס-הלקוח: "רווח גולמי מהלקוח"` | 🟢 סגור·מוצר·מ2 (04/09/2026) | Single ruling, no reversal: customer card's first tile becomes cumulative gross profit (Σ frozen `final_profit`, `finished` only) instead of "total approved quotes"; project-tab satisfaction column reuses the shared `ScoreCell` (stars + tag) | Not directly m11-owned, but shares the exact same data (`project_finance.final_profit`, `ScoreCell` component) m11's reports will present — a consistency reference, not a debt | informational |

**Section B counts:** raw מ11-token hits = 6 → 5 distinct items · raw report-word hits = 24 ·
**head≠tail (meaning changed) = 4** (§7.14, §7.15, §7.52, §7.79) among the 20 items read — two more
borderline self-corrections noted as informational (§7.14's stale weights, §7.15's explicit reversal)
are counted here since they meaningfully change what a reader would take from the head alone.

---

## Section C — `docs/micro_guides/` + `src/` (code-doc debts)

Command run:
```
grep -rn 'מ11' docs/micro_guides/ src/ --include='*.md'
```

| Source + grep anchor | Head state | Tail/final state | What it dictates to m11 | Verdict |
|---|---|---|---|---|
| `docs/micro_guides/module-3.md:16`, anchor `A generic email engine now exists` | Announces the shared engine as a fait accompli for a fresh session | No reversal — stable fact carried through the rest of the guide | m11 reuses `src/lib/email.js` + `send-email`; do not build a parallel path | dictates-to-m11 |
| `docs/micro_guides/module-3.md:72`, anchor `Win-rate / loss analytics reports` | "❌ not now \| מ11 \| §7.82 filters note" | n/a — single-line table row, matches §7.82 sub-bullet found in Section B | Confirms: m3 does not build win-rate/trend analytics; that is m11's job | dictates-to-m11 |
| `docs/micro_guides/module-5.md:71/80`, anchor `Lateness/profitability reporting on the recorded data` | "❌ records only \| 🚧 מ11 (M8 consumes through it)" | Line 80 warns explicitly: "re-count live at 4.3, do not trust this sentence" — a self-flagged staleness risk on the count of מ11←מ5 lines | m5 only records data (actual_qty etc.); m8/m11 do the lateness/profitability computation | dictates-to-m11 |
| `docs/micro_guides/module-5.md:527`, anchor `every 🚧 token here has its §6 twin` | Audit checklist line | "audit 27/08: 2 real `🚧 מ11 ← מ5` §6 lines + 1 consumption-citation inside item (1) — a naive `grep -c` returns 3; the guide's expectation of 2 debt lines holds" | Confirms Section A's count of exactly 2 distinct מ11←מ5 items (§6:695, §6:702) — a naive grep over-counts by 1 | informational (corroborates Section A) |
| `docs/micro_guides/module-6.md:93`, anchor `Reports (5 of them)` | "❌ not built \| 🚧 מ11 — Discovery starts from the question, not the report \| 🚧 מ11 ← מ6" | n/a | Matches §6:685's core framing exactly | dictates-to-m11 |
| `docs/micro_guides/module-6.md:806`, anchor `THE 🚧 מ11 ← מ6 BULLET ABOVE IS WRONG` | An earlier draft of the מ11←מ6 debt claimed "the writer is M3's merged approve-RPC, which M6 did not touch" | "🔴 Rewrite the debt honestly... the columns have no writer on EITHER path — not M3's and not M6's. Whoever owns the fix owns adding a writer, not waiting for one." Measured: `count(quote_service_line_id), count(project_change_id) from logistics` = `0, 0` over 6 rows | This is the build-time source of the §6:685 rewrite already found in Section A — corroborates rather than adds a new item | informational (corroborates Section A's head≠tail finding) |
| `docs/micro_guides/module-6.md:812-813`, anchor `the מ11 row honest-rewritten off a live 0/0 measurement` | Closing-audit summary of the same correction | Confirms byte-matching `🚧 מ11 ← מ6` line exists at §6:685 (line reference `:620` in the guide's own numbering) | Same as above | informational |
| `docs/micro_guides/module-8.md:98`, anchor `Reports & KPI feed` | Table row listing the three numbers m8 supplies m11/m7 | "both supply-contract lines ALREADY EXIST in §6... M11 adds its OWN read policies on m8's tables (the email_log per-module-policy precedent)" | Matches §6:712 exactly | dictates-to-m11 |
| `docs/micro_guides/module-8.md:104`, anchor `the draft's first version planned a "new" מ11 line` | A build-session draft initially planned to CREATE a new §6 line for מ11←מ8 | Corrected: "cited, not re-created" — the line already existed from Discovery-close (26/08) | Build-time near-duplication caught before being written; no new debt, existing §6:712 is the sole source | informational |
| `docs/micro_guides/module-8.md:280`, anchor `B-1` | Projects-manager visibility question on "relevant reports" | "her reports window is M11 (👁 on 'דו"חות') — carried by the EXISTING `🚧 מ11 ← מ8` §6 line" | Confirms the who-sees matrix from §6:685/§6:712: projects-manager gets `view` on m11's reports module | dictates-to-m11 |
| `docs/micro_guides/module-8.md:322`, anchor `N-6` | Reviewer question: does a cancellation whose fee was resolved disappear from all screens? | "Accept for v1... M11 is the history's home — the existing `🚧 מ11 ← מ8` contract" | Confirms resolved-cancellations belong in m11's population (matches §7.79/§7.96) | dictates-to-m11 |
| `src/CLAUDE.md:152/154`, anchor `ותבניות עתידיות של מ8/מ11` | Notes that future מ8/מ11 mail templates share the same weakness as an existing מ4 template | No reversal | If/when m11 sends mail via a template, the same weakness (unspecified) applies — informational context, not a report-content debt | informational |
| `src/CLAUDE.md:397`, anchor `שלושה מצבים, לא שניים (חוזה למ4/מ8/מ11)` | Documents a three-state contract (`undefined`/…) that מ4/מ8/מ11 must all honor | No reversal | Any m11 code touching the same contract must handle three states, not two — a code-level mine, not a product debt | informational |
| `src/modules/03_quotes/CLAUDE.md:101/150`, anchor `מ4/מ8/מ11 שואלים אותה שאלה` | Documents the shared `emailSendDisabledReason` helper מ4/מ8/מ11 will all call | No reversal | If m11 ever disables its own email send path, reuse this helper rather than reimplementing | informational |

**Section C counts:** distinct files hit = 6 (`module-3.md`, `module-5.md`, `module-6.md`,
`module-8.md`, `src/CLAUDE.md`, `src/modules/03_quotes/CLAUDE.md`) · total line hits = 21 ·
**no new head≠tail items beyond Section A's — module-6.md:806 corroborates §6:685's rewrite rather
than adding a new one.**

---

## Section D — Sibling approved specs naming module 11

Command run:
```
grep -rn -E 'מ11|מודול 11' docs/specs/ --include='*.md' | grep -v module_11_reports/
```
Raw hits: **56 lines** across `module_05_logistics`, `module_06_projects`, `module_07_dashboard`,
`module_08_finance` (no hits in module_02/03/04/09 specs).

| Source + grep anchor | Head state | Tail/final state | What it dictates to m11 | Verdict |
|---|---|---|---|---|
| `module_05_logistics/processes-approved.md:677-686`, anchor ㉗ | States the debt: scope-change-born `logistics` rows carry NULL in both source-pointer columns | Row confirms: "✅ נרשם — `6b9d96e`"; "ומודול 11 טרם נבנה ⇒ יש לשורה קורא אמיתי" | "Planned-vs-actual" profitability is uncomputable, and only, for scope-change-born rows — declared limitation, not a bug m5 will fix | dictates-to-m11 |
| `module_05_logistics/processes-approved.md:896/918`, anchor `נרשם כאן כדי שמ8/מ11 לא יגלו את זה בהפתעה` | Declared, bounded debt statement | No reversal | Same ㉗ limitation, explicitly flagged so m8/m11 don't discover it mid-build | dictates-to-m11 |
| `module_05_logistics/spec.md:25/196`, anchor `בסיס-העלות לרווחיות: actual_qty או planned_qty \| מ8/מ11` | Table row citing the two open items | No reversal | Confirms exactly 2 `🚧 מ11 ← מ5` lines exist (matches Section A) and the cost-basis decision is m8/m11's, not m5's | dictates-to-m11 |
| `module_06_projects/processes-approved.md:71-75`, anchor `כולם בונים מסכים משלהם וקוראים מ-projects` | Reverse-scan of `projects` consumers: מ7·מ5·מ8·**מ11** (דו"חות) | "⇒ הסריקה ההפוכה אישרה את הרשימה ולא הרחיבה אותה" — confirms, doesn't change | m11 reads `projects` directly for its reports, alongside מ7/מ5/מ8 — none of them add a screen to m6 | dictates-to-m11 |
| `module_06_projects/processes-approved.md:333-334`, anchor `OPEN_PROJECT_STATUSES` | Documents a code-only definition of "active project" (`not_started`,`in_progress`) that M4 decided alone in code, uncoordinated | "🔴 וההגדרה הקיימת שגויה לפי ⑫" — the canonical definition (⑫) is `not_started · in_progress · ready` (i.e., everything before `event_finished`; `cancelled` is NOT active); explicit warning: "ומ7 ומ11 עומדים להמציא הגדרה שלישית ורביעית" | **m11 must NOT invent its own "active project" definition for any report** — must use the single canonical ⑫ definition (or explicitly reconcile with it), not re-derive from `OPEN_PROJECT_STATUSES`'s incomplete code constant | dictates-to-m11 (explicit warning against a predicted future mistake) |
| `module_06_projects/processes-approved.md:769`, anchor `logistics.line_id נכתב ע"י ה-RPC` | Claims the approve-RPC writes the origin pointer (⑬) | "🔴 גובר (אדוות-סגירת מ6, 21/08/2026): הטענה בהווה מטעה — ה-RPC... אינו כותב את עמודת-המצביע... נמדד חי 19/08: 0 מתוך 6 שורות" ⇒ open debts `🚧 מ5 ← מ6` + `🚧 מ11 ← מ6` | Same underlying fact as §6:685/module-6.md:806 — corroborates, not a new item | dictates-to-m11 (head≠tail, same instance as above) |
| `module_06_projects/processes-approved.md:865`, anchor `מודול 11 (צד ה"ביצוע" של דוח-הרווחיות)` | Names m11 as one of three consumers blocked on the operational-closing process card (Smart Match, m8, m11) | "כל השלושה חסומים עד שהוא ייבנה" | m11's "planned vs actual" report is blocked until m6's operational-closing card ships (it has, per Section A) | informational (historical dependency, now resolved) |
| `module_06_projects/processes-approved.md:958-965`, anchor `⇒ נושא לשיחת ה-Discovery של מודול 11` | States who-sees is already decided; "על איזו שאלה כל דו"ח עונה" is explicitly NOT m6's to decide | No reversal | The five C5 §5.7 reports were written without a guiding business question — m11 Discovery must supply the question first | dictates-to-m11 |
| `module_06_projects/spec.md:483`, anchor `נושא ל-Discovery של מודול 11, ואינו של מ6` | Same point, in the module's own spec summary | No reversal | Same as above | dictates-to-m11 |
| `module_07_dashboard/seed-data-spec.md:380`, anchor `מ11 הוצא מהרשימה` | Quotes `00_roadmap.md:103`: "שני בולמי-הזעזועים הם מ10 ומ7 בלבד" | No reversal — confirms m11 is not a deferrable module | Scheduling fact, not a data contract | informational |
| `module_07_dashboard/seed-data-spec.md:506`, anchor `זה קובע כמה מ11 מקבל` | Seed-volume note | No reversal | The seeded data volume affects how much m11 has to report on — informational sizing note | informational |
| `module_07_dashboard/seed-data-spec.md:541`, anchor `PostgREST מחזיר לכל היותר 1,000 שורות` | A measured pagination trap in the seed script itself | "התיקון: `db.select` מדפדף... הלקח... חוב לבדוק בבניית מ7/מ11" | **m11 must paginate/page past PostgREST's 1,000-row default** in any query summarizing large tables (e.g. all assignments) — a measured pitfall, not a guess | dictates-to-m11 |
| `module_08_finance/discovery-log.md:37`, anchor `3 missing supply contracts found and written: מ11·מ10·מ7` | Summarizes m8's Discovery-close audit | No reversal | Confirms §6:712/§6 line for מ11←מ8 was born from a debt-completeness audit Ishay demanded, not an oversight caught later | informational |
| `module_08_finance/processes-approved.md:146-154`, anchor `ד-דו"ח-רווחיות ו-KPI — גבול מ8/מ11/מ7` | Table rows א52/א56: "⬜ — מסך-הדו"ח = מ11; מקור-המספר = מ8" / "⬜ — מסך של מ11; לא מוכרע כאן" | Both explicitly marked ⬜ (not decided here) — deferred to m11 | The profitability-report SCREEN and the quarter-vs-monthly-graph screen both belong to m11; m8 supplies only the source numbers | dictates-to-m11 |
| `module_08_finance/processes-approved.md:184-186`, anchor `A9 בסיס-עלות לרווחיות` / `B12 בסיס-הכמות להכרעת מ8/מ11` | m8's own reverse-contract ledger, listing what it must supply (A-list) and what others dictate to it (B-list) | No reversal | Confirms cost-basis-for-profitability (actual_qty vs planned_qty) is jointly m8/m11's open call, not m5's | dictates-to-m11 |
| `module_08_finance/processes-approved.md:217/245`, anchor ה1 | "✅ גבול דוח-השכר מ8/מ11 ⇒ נסגר בהאצלה" | Row: "זרימת דוח-השכר כולה — מ8 (הפקה)... מ11 = צפייה-בלבד בדוחות-עבר" — "מ11 מוגדר 'לקריאה בלבד' (PROJECT_MASTER §5.17); הפקה כותבת-מסד לא יכולה לחיות במודול קריאה" | **ה1**: Salary-report production (export & send, snapshot, dedupe signature) lives entirely in m8; m11 is strictly read-only over past reports | dictates-to-m11 |
| `module_08_finance/processes-approved.md:252`, anchor ה8 | Row: population rule for customer-card metrics | "רווח-מצטבר = פרויקטים ב-`finished` בלבד; ממוצע-משוב = בעלי `feedback_status='completed'` בלבד — סוגר את פגם-ג15" | **ה8**: Same population rule §7.79 already gave — m11 reuses it for consistency across screens | dictates-to-m11 |
| `module_08_finance/processes-approved.md:260-261`, anchor ה17/ה18 | Rows dated 26/08 | ה17: cost basis for goods in the profit formula = **ordered quantity** (`planned_qty` adjusted for scope changes) × `closing_unit_cost`, NOT `actual_qty` — also neutralizes m5's ㉗ limitation since profit doesn't depend on `actual_qty`. ה18: budget deviation = ONE ₪ figure per project, labor side only: (Σ actual hours × frozen rate) vs (planned event hours × Σ frozen rates of finally-approved hostesses); goods contribute zero deviation because the quantity basis is identical on both sides (ה17) | **ה17+ה18**: the exact source formulas for m11's "final profit %" and "budget deviation ₪" figures cited in §6:712 | dictates-to-m11 |
| `module_08_finance/processes-approved.md:373`, anchor ה26 | "בסיס-העלות של הסחורה נקרא משורות-ההצעה+שינויים, לא מטבלת-הלוגיסטיקה" | "⇒ מגבלת-B13 של מ5 מנוטרלת לחלוטין לנוסחת-הרווח" | Confirms ה17: the profit formula reads goods cost from quote/scope-change rows, not from `logistics` — so m5's ㉗ NULL-pointer limitation does NOT affect m11's profit number (only affects the separate "planned-vs-actual logistics" report, per §6:695) | dictates-to-m11 |
| `module_08_finance/processes-approved.md:374`, anchor ה27 | Row dated 26/08 | "רווח-צפוי (פרויקט פעיל) מוגדר: הכנסות-קפואות − (שעות-אירוע-מתוכננות × Σ תעריפי-משובצות-סופית + סחורה-מתוכננת + נסיעות-צפויות)... הצרכן: KPI-מ7 וכרטיס-מ6" | **ה27**: the "expected profit" formula for still-open projects — not explicitly listed as an m11 consumer here (named consumers are m7's KPI and m6's card), though §6:712 cites it as one of m8's three supplied numbers | dictates-to-m11 (consumer list in this row is narrower than §6:712's claim — noted, not resolved, since it is m6's document, not m11's) |
| `module_08_finance/stage0-sweeps/m8-sweep-reverse-contracts.md:26-29`, anchor A8/A9/A11 | m8's own reverse-contract table, "what m8 must supply to others" | A8: salary-report ownership moved from m4 to m8 (05/08/2026, four verified reasons) — m11 reads the result. A9: profitability cost-basis explicitly not m5's call; inherits m5's ㉗ limitation, "flagged so מ8/מ11 don't discover it by surprise". A11: shared email engine — m8 must consume as-is, two of six seeded templates are m8's (#13 invoice, #20 salary report) | Consolidates A8/A9/A11 exactly as found elsewhere — no new information, cross-referenced for completeness | dictates-to-m11 |
| `module_08_finance/stage1-review/m8-debt-audit.md:39`, anchor `🚧 מ11 ← מ8 confirmed missing` | A **stage-1 review** flags that the מ11←מ8 supply-contract line was MISSING before this point | Lists 6 separate places in the document that collectively justify writing it: ה1, א52, ה17/ה18, P3 "קשרים", product decision #1, and the blind-spot about `salary_reports` RLS | This is the review that produced §6:712 — confirms it was deliberately assembled, not copy-pasted | dictates-to-m11 (process note, not new content) |
| `module_08_finance/stage1-review/m8-review-infra-ripples.md:130`, anchor `Why it matters` | Poses an unresolved fork: cancelled-and-resolved projects either get a frozen profit (and appear in m11's report) or they don't (and a P3 line becomes unimplemented prose) | Not resolved in this document — resolved later by ה8/§7.79's ruling (finished OR resolved-cancelled) | Historical: shows the resolved-cancelled population rule was a live open fork during m8's build, later closed | informational |
| `module_08_finance/stage1-review/m8-review-infra-ripples.md:311`, anchor `מ11's read of salary_reports` | Reviewer's own blind-spot confession: "I verified the table is deny-all but did **not** check whether מ11's role... needs its own policy" | Carried forward verbatim into §6:712's caveat ("הרשאת-הקריאה של תפקידי-מ11 על salary_reports לא נבדקה") | This is the exact origin of the still-open RLS caveat in §6:712 | dictates-to-m11 |
| `module_08_finance/world-sources.md:20`, anchor ה1 | World-research anchor for the salary-report-flow-in-m8 / m11-read-only-decision | "תומך" (supports) — an external anchor for a decision already made, not a new decision | Corroborating world-source citation for ה1, not new content | informational |

**Section D counts:** raw hits = 56 lines across 4 module-spec folders (module_05/06/07/08) · zero
hits in module_02/03/04/09 specs · **head≠tail = 1 additional instance found here** (module_06
`:769`, the ⑬ pointer claim — same underlying fact as Section A/C's `🚧 מ11 ← מ6` rewrite, listed
separately here because it is a distinct source document, not a distinct debt).

---

## Section E — What m11 owes to others (`← מ11` arrows in §6)

Command run:
```
grep -n -E '← מ11' docs/PROJECT_MASTER.md
```
**Result: zero matches.**

Control variation run (broader arrow-character check):
```
grep -n 'מ11 ←\|מ11←\|מ11 →\|מ11→' docs/PROJECT_MASTER.md
```
**Result: 8 matches, and every single one is `מ11 ←` (an arrow INTO m11), never `מX ← מ11` (an arrow
OUT of m11).** Confirmed genuinely empty after two independent search variations (exact instructed
pattern + broad arrow-character sweep).

**Searched and not found:** no `PROJECT_MASTER.md` §6 line records module 11 as a debt SOURCE
(owing something to another module). Every §6 line naming מ11 has מ11 as the debt's TARGET.

---

## Section F — Other modules' §5 screen cards mentioning reports/data m11 would compute

Command run (§5 range only, `### 5.1` through `### 5.17`, excluding 5.17 which is m11's own card):
```
awk 'NR>=266 && NR<397' docs/PROJECT_MASTER.md | grep -n -E 'דו"חות|דוחות|report|רווח|KPI|מגמ|win.?rate'
```

| Card | What it shows that m11 also computes/needs | Anchor |
|---|---|---|
| **5.2** מסך הבית / Dashboard · מודול "מסך הבית" | 4 KPI tiles: **"רווח גולמי משוער לחודש"** · "פרויקטים פעילים" · "ממוצע שביעות רצון רבעוני" · "הצעות מחיר בהמתנה" — DB tables `projects`, `quotes` aggregated for KPI | `docs/PROJECT_MASTER.md:294-296` |
| **5.0** (status-flow reference, not its own numbered card) | Operational closing produces "דו"ח" (a document — the mandatory summary-report upload, `summary_report_url`) — a **different** kind of "report" than m11's analytical reports; noted for disambiguation only | `docs/PROJECT_MASTER.md:274` |
| **5.12** מאגר דיילות · מודול 4 | `salary_reports` explicitly REMOVED from this card 05/08/2026 — ownership moved to מ8; m11 later reads the result read-only | `docs/PROJECT_MASTER.md:366` |
| **5.13** בקרה לוגיסטית-כספית — מבט על · מודול 8 | Columns: לקוח, תאריך סיום, **"רווח סופי %"**, **"משוב★"**, סטטוס — same underlying data (`final_profit`, `feedback_score`) m11's reports present | `docs/PROJECT_MASTER.md:372` |
| **5.14** חלון סגירת תיק פרויקט וחישוב רווחיות · מודול 8 | The gross-profit formula itself — the SSOT m11's profitability report reads from (cross-referenced repeatedly in §6:712, §7.52, §7.58, ה17/ה18) | `docs/PROJECT_MASTER.md:376-379` |

**Section F counts:** 5 cards touched (5.0 informational, 5.2/5.12/5.13/5.14 substantive) out of 16
non-m11 cards in §5.

---

## Section G — `docs/db_roadmap.md`

Commands run:
```
grep -n -E 'מ11|M11|דו"ח|דוח|report' docs/db_roadmap.md   [too broad, 44KB — re-run narrower]
awk '/מ11|M11/{print NR": "$0}' docs/db_roadmap.md
```
Raw narrow (`מ11|M11`) hits: **5** (lines 213, 272, 1376, 1379, 1757). Raw broad
(`מ11|M11|דו"ח|דוח|report`) hits: **89** (mostly generic `report`/`דוח` noise from unrelated RLS/DB
prose — not re-transcribed here per the mine about capped searches; the 5 narrow hits are the
substantive ones).

| Source + grep anchor | Head state | Tail/final state | What it dictates to m11 | Verdict |
|---|---|---|---|---|
| `db_roadmap.md:213`, anchor `A-20 NEW table email_log` | Documents the generic email-log table as applied 30/07/2026 | "Forward notice (§10.2): M4/M8/M11 each widen the entity_type CHECK by one value and add their own module-gated SELECT policy — do NOT widen this policy to 'any authenticated'." Corrected later (18/08) because the notice originally omitted M6, which actually widened by TWO values. **"M8 and M11 remain owed"** as of this entry | If/when m11 sends its own mail, it adds ONE new `entity_type` CHECK value + its own SELECT policy, in the same migration as its code — never widen the existing policy | dictates-to-m11 (head≠tail: the forward-notice's module list was itself found incomplete and corrected) |
| `db_roadmap.md:272`, anchor `M5-3 RIPPLE INTO MERGED M3 CODE` | States the fix approved 21/08/2026 | "🔑 Closes M6-5's stated purpose AND the reporting debt `🚧 מ11 ← מ6` in one change" — but this is a claim about the ORIGIN column (`quote_service_line_id`) only; module-6.md:806 later showed the `project_change_id` half of the same debt was NOT closed by this | Partially resolves §6:685/§6:709's origin-pointer problem — only the approval-born half; the scope-change half remains open (§6:695, ㉗) | dictates-to-m11 (head≠tail: "closes the reporting debt" oversells — only half of it closed, per the later module-6.md:806 correction) |
| `db_roadmap.md:1376-1379`, anchor `Forward notice — מ11 · מ7 · מ10` | States `project_finance` ships with ONE SELECT policy gated 'כספים' and no write policy | "A later module that must read it adds its own module-gated policy... never widen m8's. The three supply contracts already exist as `🚧 מ11 ← מ8` · `🚧 מ7 ← מ8` · `🚧 מ10 ← מ8`" — confirmed later by §7.97 (03/09): מ7's own policy is scoped CEO+finance only | m11 must add its own module-gated read policy on `project_finance`, following the same pattern m7 already implemented — never widen m8's existing policy | dictates-to-m11 |
| `db_roadmap.md:1757`, anchor `migration 20260730095439_module3_email_log.sql applied` | Historical build-log entry for the email_log table | Same forward notice repeated verbatim: "M4 / M8 / M11 each widen the entity_type CHECK by one value and add their OWN module-gated SELECT policy" | Duplicate of :213's notice, logged at point-of-migration | dictates-to-m11 (duplicate, not a new item) |
| §7 RLS rollout matrix row (`docs/db_roadmap.md:397`), anchor `11 דו"חות` | n/a — this is the row itself, no separate head | **"11 דו"חות \| none (5 reports as Views/RPC, read-only) \| per matrix view rights \| no"** | m11 writes NOTHING to the database — it is implemented as 5 read-only Views/RPCs; access follows the existing permission matrix; no multi-module write conflict | dictates-to-m11 |

**Section G counts:** narrow raw hits = 5 · broad raw hits = 89 (mostly noise, not individually
transcribed) · **head≠tail = 2** (`:213`'s incomplete module list, `:272`'s overselling of what was
actually closed).

---

## Section H — `docs/guides/00_roadmap.md` and `STATUS.md`

Commands run:
```
grep -n -E 'מ11|מודול 11|11 —|דו"חות' docs/guides/00_roadmap.md
grep -n -E 'מ11|מודול 11|11 —|דו"חות' STATUS.md
```

| Source + grep anchor | Quote | What it dictates to m11 | Verdict |
|---|---|---|---|
| `00_roadmap.md:39`, module table row | `\| 11 \| דו"חות מנהלים \| 6, 8 \| 5 דו"חות (Views) \| [module_11]...` | m11 depends on modules 6 and 8 (both closed/merged); deliverable is explicitly "5 reports (Views)" | dictates-to-m11 |
| `00_roadmap.md:85`, date row | `\| 11 — דו"חות מנהלים \| **07/09** *(הוזז מ-09/09 בסגירת מ7)* \| \| ~4 ימים ⭐ \|` | Target start date **07/09/2026**, moved up 2 days when m7 closed; estimated duration ~4 days; starred (⭐, meaning: see the buffer-rule note at line 93) | dictates-to-m11 |
| `00_roadmap.md:93`, anchor `לפי כלל-החיץ` | "היומיים אינם נכנסים למ11 — שלושת הנותרים הוזזו מוקדם ביומיים כל אחד (11: 09/09→07/09...)" | The 2-day buffer freed by m7's early closure was explicitly NOT given to m11 — it went to pulling m10/m12's dates earlier instead | dictates-to-m11 |
| `00_roadmap.md:107`, anchor `מ11 (דו"חות) הוצא מרשימת-הנדחים` | *"לוותר על דוחות מרגיש לי קשה"* — Ishay, 12/08/2026, quoted verbatim | **m11 is explicitly NOT deferrable** if time runs out — only מ10 and מ7 are the two shock-absorber modules; m11 is described as "גם הפאנץ' של הכנס" (also the conference's punchline) | dictates-to-m11 |
| `STATUS.md:623`, anchor `דו"חות (מ11) הוצא מרשימת-הנדחים` | "בולמי-הזעזועים הם מ10 ומ7 בלבד" | Restates the same non-deferrable ruling in STATUS.md | dictates-to-m11 (duplicate of 00_roadmap:107) |
| `STATUS.md:902`, module-11 status row | "🔎 קלט-Discovery מוכן (06/09) — ענף `ishay/module-11-reports` נחתך; טיוטת-ישי + סקירה ב-`docs/specs/module_11_reports/research/`; Discovery טרם רץ (⑥0 במדריך) \| **24/09** *(מפת-הדרכים: התחלה 07/09, ~4 ימים — ליישר)*" | Current live status: branch already cut, Ishay's own draft + research exist under `docs/specs/module_11_reports/research/`, Discovery has not yet run. ⚠️ The target-date column shows **24/09**, which the row itself flags as needing alignment ("ליישר") against the roadmap's 07/09-start-plus-4-days — **this is a self-flagged stale/inconsistent date, not a contradiction between two rulings** | dictates-to-m11 |
| `STATUS.md:908`, module-8 status note | "תצוגת רווח-מצטבר בכרטיס-הלקוח *(המספר קיים; התצוגה של מ11)*" | Confirms: the cumulative-profit NUMBER already exists (m8), only its DISPLAY is deferred to m11 | dictates-to-m11 |
| `STATUS.md:605/610`, historical entries about §6:634 | Restates the two מ4 data-holes ("כמה זימונים נשלחו לה", history-of-status-changes) already covered in Section A | No new information — historical narration of the same §6:634 item | informational (duplicate of Section A) |
| `STATUS.md:949`, anchor `מ11 §5.17` | Lists which modules' guides map to which §5 card numbers | `מ11 → §5.17` — confirms the card numbering used in Section F | informational |
| `00_roadmap.md:14`, mission narrative | "...הכל נצבע בדו"חות מנהלים" | Generic mission-statement mention, not a data contract | informational |
| `00_roadmap.md:122`, M4 milestone | "dashboard, כספים, הגדרות, אוטומציות, דו"חות — הכל מחובר" | m11 is one of six things that must all be wired together by the final milestone (26/09/2026) | informational |
| `00_roadmap.md:205`, directory tree | `├── 11_reports/ ← מודול 11` | Confirms folder naming convention, no content | informational |

**Section H counts:** `00_roadmap.md` hits = 6 substantive · `STATUS.md` hits = 6 substantive (plus
duplicates of already-covered content) · **no head≠tail flips found in this section** — the one
apparent date discrepancy (STATUS.md:902's 24/09 vs 00_roadmap's 07/09-start-plus-4-days) is
self-flagged by the document itself as needing alignment, not a silent contradiction.

---

## Totals

| Section | Raw hits | Distinct items/rows | head≠tail count |
|---|---|---|---|
| A — PROJECT_MASTER §6 | 10 (token) / 13 (name control) | 8 debt items + 1 name-only mention | 2 |
| B — PROJECT_MASTER_sec7 | 6 (token) / 24 (report-word) | 5 מ11-tagged items; 20 items read per assignment | 4 |
| C — micro_guides + src | 21 | 6 files | 0 new (corroborates A) |
| D — sibling specs | 56 | ~25 substantive rows across 4 module folders | 1 new (module_06:769, corroborates A/C) |
| E — arrows FROM מ11 | 0 (two search variations) | 0 | n/a — genuinely empty |
| F — §5 screen cards | 8 (regex hits in §5 range) | 5 cards | n/a (not glyph-bearing items) |
| G — db_roadmap.md | 5 (narrow) / 89 (broad, not transcribed) | 5 substantive entries | 2 |
| H — 00_roadmap.md + STATUS.md | 12 substantive | 12 rows | 0 (one self-flagged stale date, not a flip) |

**Grand total head≠tail (meaning changed between an item's opening statement and its final recorded
state): 9** — counting each distinct underlying fact once even where multiple documents corroborate
it: §6:634 · §6:685/module-6.md:806/module_06_projects:769 (one underlying instance, corroborated
three times) · §7.14 · §7.15 · §7.52 · §7.79 · db_roadmap:213 · db_roadmap:272. **If counted strictly
per document-location instead of per underlying fact, the raw count is 12** (Section A=2, B=4,
D=1, G=2, plus the 3-way corroboration of the §6:685 instance counted once in A already).

## Searched and not found

- **Section E**: no `PROJECT_MASTER.md` §6 line has מ11 as the arrow SOURCE (`מX ← מ11`). Verified
  with two independent patterns (exact `← מ11` per the assignment, and a broader `מ11 ←|מ11←|מ11
  →|מ11→` sweep). Every hit found has מ11 as the arrow TARGET.
- **No מ11 mentions** in `docs/micro_guides/module-7.md`, `module-9.md`, or any module-02/03/04/09
  spec folder under `docs/specs/` (checked via the same recursive Section C/D commands — their
  absence from the hit list is a direct read of a comprehensive command, not a separate narrowed
  search).
- **No contradicting pair of live rulings** was found on any מ11-tagged item — every apparent
  reversal found (§7.14's stale weights, §7.15's cap reversal, §6:685/module-6:806's rewrite,
  db_roadmap:213's incomplete module list, db_roadmap:272's overselling) is a single ruling being
  corrected or refined over time, not two standing, currently-live rulings that disagree. The one
  candidate for a live inconsistency — STATUS.md:902's target date 24/09 vs 00_roadmap.md's
  07/09-start-plus-~4-days — is self-flagged by the row itself as needing alignment ("ליישר"), so it
  is reported as a stale/unreconciled date rather than a contradiction between two rulings.
