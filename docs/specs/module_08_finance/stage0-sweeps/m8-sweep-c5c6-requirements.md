# Module 8 (כספים וסגירת אירוע) — C5/C6 Atomic Requirement Extraction

Read-only sweep. Every row anchored to file + section id + a verbatim quoted grep-anchor (never a line number — line numbers rot; C5/C6 are frozen files resolved via their own `<!-- מקור C5/C6 L… -->` section-head comments). C5/C6 are evidence of what was once specified, not authority — extracted faithfully, no editorializing, nothing marked "wrong" (that judgment is Ishay's / §7's).

Where a row's content is already known to be superseded by a later ruling (visible in `docs/PROJECT_MASTER_sec7.md` or inline `🔧 פגם ידוע` callouts already embedded in C5/C6 themselves), the **notes** column says so — the row itself still reports the C5/C6 text as written, per instructions.

Searches run (both vocabularies, per the absence-claim rule):
- C5: full-text section-anchor scan (`מקור C5 L`), then targeted reads of §5.1–5.4 (scope/constraints/permissions), §5.5.1, §5.5.7 (partial, cross-ref only), §5.5.10, §5.5.11.2, §5.5.11.5, §5.6.2, §5.6.7, §5.6.13, §5.6.14, §5.6.16, §5.7.4, §5.7.5, §5.8.2, §5.8.3, §5.8.8, §5.8.9 (skipped, not finance), §5.8.10.
- Hebrew grep terms run against C5: `חשבונית`, `משוב`, `סקר`, `שכר`, `רווח`, `1\.2\.2`, `מפיק.{0,15}חשבונ`.
- English/schema-vocabulary grep run against C5/C6: `salary_reports`, `DFD`, `2\.4\.(1|4|10|13|14)`.
- Confirmed **absent**: a section literally numbered "1.2.2" does not exist anywhere in `C5_clean_transcript.md` — the file's only top-level chapter is "פרק 5" (`# פרק 5 – אפיון מערכת המידע החדשה`, anchor `sec-5`). The task brief's "1.2.2 (system does not produce invoices)" resolves instead to **§5.2.2** (line list "מחוץ להיקף הפרויקט"), item `ממשק הנהלת חשבונות: הפקת חשבוניות/ קבלות אוטומטיות בסיום פרויקט` — see row 2. (The `§1.2.2` citation used *inside* `PROJECT_MASTER_sec7.md` item 38 to refer to this same fact is that document's own internal numbering, not a real C5 heading — noted, not corrected here.)
- Section "1.4.x/1.5.x" permissions (as named in the task brief) resolves to **§5.4.1–§5.4.6** — the only permissions section in the file.

---

## Requirements table

| # | requirement (short quote) | source anchor | type | notes |
|---|---|---|---|---|
| 1 | "כספים וסגירת אירוע: בקרה על גבייה, סקרי שביעות רצון וסגירת הפרויקט" — scope-in for v1 | C5 §5.2.1 — "כספים וסגירת אירוע: בקרה על גבייה" | field | Names the module's 3 in-scope pillars: collection control, satisfaction surveys, project closing |
| 2 | "ממשק הנהלת חשבונות: הפקת חשבוניות/ קבלות אוטומטיות בסיום פרויקט" listed under future/out-of-scope developments | C5 §5.2.2 — "הפקת חשבוניות/ קבלות אוטומטיות בסיום פרויקט" | rule (scope exclusion) | This is the textual basis for "system does not produce invoices" (see header note — not "§1.2.2"). Already ruled §7.38: manual-upload-and-send is the real flow, resolving the apparent clash with the §5.8.3 email template (row 61) which assumes an invoice file exists to attach |
| 3 | "חוקי מס: המערכת מניחה שיעור מע"מ קבוע (18%)" | C5 §5.3.4.1 — "מניחה שיעור מע"מ קבוע (18%)" | number | VAT assumed constant at 18%; listed as a functional *assumption*, not a param-screen-editable rule (contrast row 51, which frames VAT as one of the editable global financial params — same fact, two different postures) |
| 4 | "דיווח שעות אמת... מדויק ותקף לשעות העבודה של כלל הדיילות בפרויקט לפני שלב הגבייה" | C5 §5.3.4.3 — "לפני שלב הגבייה" | rule (assumption) | System assumes the project manager's post-event hours report is accurate/valid for all hostesses before the collection stage begins |
| 5 | Gross profit computed at project module level, not net profit | C5 §5.3.4.4 — "מחשבת... רווח גולמי פר פרויקט, ולא רווח נקי" | rule | States the deliberate choice: gross, not net, profit |
| 6 | Computation trigger: "מתבצע אוטומטית בעת סגירת הפרויקט" | C5 §5.3.4.4 — "החישוב מתבצע אוטומטית בעת סגירת הפרויקט" | status-transition / rule | Gross-profit calc fires automatically at project closing |
| 7 | Formula: רווח גולמי = הכנסות נטו מהצעת המחיר − הוצאות ישירות | C5 §5.3.4.4 — "פחות (סך ההוצאות הישירות של הפרויקט)" | rule | The core formula |
| 8 | Net revenue = total customer charge as approved in the quote, after both discounts, excluding VAT | C5 §5.3.4.4 — "לאחר קיזוז ההנחות (הנחת לקוח קבועה והנחה ידנית נוספת)" | field / rule | Two named discount components subtracted |
| 9 | Net revenue is taken specifically from the quote's "סה"כ לפני מע"מ" line | C5 §5.3.4.4 — "נלקח משורת 'סה"כ לפני מע"מ'" | field | Names the exact source line/field |
| 10 | Direct (variable) expenses = automatic sum of actual hostess salary (hourly wage × project hours) + bonuses + service/product procurement costs | C5 §5.3.4.4 — "סכימה אוטומטית של שכר דיילות בפועל" | rule / number | Full expense-side formula, 3 components |
| 11 | Hostess salary cost boundary = "עלות עבודה ישירה גולמית" (actual hours × hourly wage) only | C5 §5.3.4.4 — "חישוב של 'עלות עבודה ישירה גולמית'" | rule (boundary) | Explicit scope boundary on the labor-cost calc |
| 12 | System explicitly does NOT compute taxation, pension, or deductions | C5 §5.3.4.4 — "אינה מחשבת מיסוי, פנסיה או ניכויים" | rule (scope exclusion) | |
| 13 | Fixed operating costs (rent, back-office salary) are handled only by the external accounting system, outside REG-IN | C5 §5.3.4.4 — "מחוץ למערכתREG-IN" | rule (scope exclusion) | |
| 14 | מנהלת פרויקטים: "גישה חסומה למודול ריכוז שכר דיילות" | C5 §5.4.2 — "גישה חסומה למודול ריכוז שכר דיילות" | field (permission) | Project manager explicitly blocked from the salary-consolidation module (M8 territory) |
| 15 | מנהלת פרויקטים: view-only permission on relevant reports | C5 §5.4.2 — "והרשאת צפייה בדו"חות רלוונטיים" | field (permission) | "Relevant" reports unspecified — ambiguous which ones include finance/salary reports |
| 16 | מנהלת כספים ולקוחות — role definition: "ניהול ההתחשבנות הפיננסית מול הלקוחות, גבייה, בקרת רווחיות והכנת נתוני השכר" | C5 §5.4.3 — "בקרת רווחיות והכנת נתוני השכר של הדיילות" | field | Role charter: billing, collection, profitability control, salary-data prep |
| 17 | מנהלת כספים: full edit permission on "ניהול לקוחות" module | C5 §5.4.3 — "הרשאות עריכה מלאות במודול 'ניהול לקוחות'" | field (permission) | |
| 18 | מנהלת כספים: full edit permission on "סגירה פיננסית" module (invoicing + collection) | C5 §5.4.3 — "במודול 'סגירה פיננסית' (הפקת חשבוניות וגבייה)" | field (permission) | Module named here "סגירה פיננסית", not "כספים וסגירת אירוע" (the official M8 name used in §5.2.1/§5.6.13/§5.6.2) — naming inconsistency, see contradictions section |
| 19 | מנהלת כספים: full edit permission on report generator, with emphasis on hostess-salary report and project-profitability report | C5 §5.4.3 — "בדגש על דו"ח שכר דיילות ודו"ח רווחיות פרויקטים" | field (permission) | |
| 20 | מנהלת כספים: "גישה חסומה לעריכת שיבוצים או לוגיסטיקה" | C5 §5.4.3 — "גישה חסומה לעריכת שיבוצים או לוגיסטיקה" | field (permission) | View presumably still allowed (mirrors the pattern in row 15); edit is blocked |
| 21 | Project-status field constrained to exactly 8 named values | C5 §5.5.1 — "שדה סטטוס הפרויקט מוגבל לערכים הבאים בלבד" | field / rule | Enumerated: 'טרם החל', 'בתהליך', 'מוכן לביצוע', 'אירוע הסתיים', 'ממתין לחשבונית', 'ממתין לתשלום', **'פרויקט הסתיים'**, 'בוטל'. Last-but-one label differs from C6's Projects-table enum (row 42 uses **'הסתיים'**) — see contradictions section |
| 22 | Post-event work converges to a single track handling: final data entry (operational closing) + collection/feedback management | C5 §5.5.1 — "הזנת נתונים סופיים מהאירוע – סגירת אירוע תפעולית" / "גבייה וניהול משוב מול הלקוח" | rule | Frames the M6→M8 handoff at the process level |
| 23 | Finance workspace organized as 3 status-tabs: "ממתין לחשבונית", "ממתין לתשלום", "הסתיים" | C5 §5.5.10 — "המייצגת את הסטטוסים הרלוונטיים למנהלת הכספים" | field | |
| 24 | Tabs "מתעדכנים אוטומטית בהתאם לפעולות מנהלת הכספים" | C5 §5.5.10 — "מתעדכנים אוטומטית בהתאם לפעולות מנהלת הכספים" | rule | |
| 25 | Feedback-status field constrained to exactly 3 values | C5 §5.5.10 — "שדה סטטוס המשוב במערכת יכיל אחד משלושת הערכים הבאים" | field / rule | 'הוזן משוב חיובי (3-5)', 'הוזן משוב שלילי (<3)', 'לא ענה לסקר' — contradicts C6 Projects table's 4-value "סטטוס משוב" enum (row 44); see contradictions section |
| 26 | Step 1: finance manager locates operationally-completed projects in "ממתין לחשבונית" tab | C5 §5.5.10 — "מנהלת הכספים מאתרת בלשונית 'ממתין לחשבונית'" | action | |
| 27 | Step 1: manager checks "V" in "סמן כנשלחה חשבונית" checkbox | C5 §5.5.10 — "מסמנת במסך 'V' בתיבת 'סמן כנשלחה חשבונית'" | action / field | |
| 28 | Step 1: manager "שולחת ללקוח קישור לסקר משוב" as part of this same action | C5 §5.5.10 — "שולחת ללקוח קישור לסקר משוב" | action | Contradicts §5.8.2's trigger (row 60: project manager, at operational lock) and §5.6.7 (row 58); already ruled §7.39 — module 6 sends at operational closing, module 8 doesn't send at all. See contradictions section |
| 29 | Step 1: after save, "המערכת משנה את הסטטוס ומעבירה אוטומטית את הפרויקט ללשונית 'ממתין לתשלום'" | C5 §5.5.10 — "מעבירה אוטומטית את הפרויקט ללשונית 'ממתין לתשלום'" | status-transition | |
| 30 | Step 2: "הלקוח ממלא סקר חיצוני (Google Forms)" | C5 §5.5.10 — "הלקוח ממלא סקר חיצוני (Google Forms)" | action (external actor) | |
| 31 | Step 2: "המנהלת מזינה את הציון המשוקלל (1-5 כוכבים) למערכת" | C5 §5.5.10 — "מזינה את הציון המשוקלל (1-5 כוכבים)" | field / action | Single weighted 1–5 score entered manually by the finance manager, sourced from the external Google Form |
| 32 | Rule: score ≥3 → "נשמר בתיק הלקוח ומשפיע מיידית על מדד ה-KPI בדשבורד" | C5 §5.5.10 — "ציון 3 ומעלה: נשמר בתיק הלקוח ומשפיע מיידית" | rule / status-transition | "מיידית" implies live/read-time KPI recompute, not a push |
| 33 | Rule: score <3 → "המערכת מחייבת בירור טלפוני והזנת סיבה" | C5 §5.5.10 — "המערכת מחייבת בירור טלפוני והזנת סיבה" | enforcement / validation | System-enforced requirement to enter a reason for low scores; matches C6 Projects table field "סיבת משוב שלילי" (row 43) which is conditionally required at score <3 |
| 34 | Rule: no response → "המנהלת מסמנת תיבת 'לא ענה לסקר' והמטלה נסגרת" | C5 §5.5.10 — "מסמנת תיבת 'לא ענה לסקר' והמטלה נסגרת" | action / status-transition | A legitimate no-op-outcome path — worth flagging against the archiving-enforcement rule in row 55 |
| 35 | Step 3: "עם קבלת התשלום, המנהלת מזינה את תאריך קבלת התשלום" | C5 §5.5.10 — "מזינה את תאריך קבלת התשלום" | field / action | |
| 36 | "מיד עם הזנת התאריך, המערכת מציגה חיווי ויזואלי אוטומטי המאשר את קבלת התשלום" | C5 §5.5.10 — "חיווי ויזואלי אוטומטי המאשר את קבלת התשלום" | rule (UI feedback) | |
| 37 | "במקביל, המערכת מחשבת ומציגה אוטומטית את הרווח הגולמי באחוזים" | C5 §5.5.10 — "מחשבת ומציגה אוטומטית את הרווח הגולמי באחוזים" | number / rule | States the profit is shown **as a percentage** here — contradicts §5.6.14's "בשקלים" for the same bottom-line figure (row 54); see contradictions section |
| 38 | Profit inputs stated inline again: "הכנסות מתוכננות מול הוצאות ישירות בפועל (כגון שכר דיילות ורכש מוצרים)" | C5 §5.5.10 — "הכנסות מתוכננות מול הוצאות ישירות בפועל" | rule | Uses "הכנסות מתוכננות" (planned revenue) here vs "הכנסות נטו" (net revenue, actual/approved) in §5.3.4.4 — terminology drift worth noting, not necessarily a contradiction |
| 39 | Same step: "מעדכנת את סטטוס הפרויקט ל'הסתיים'" | C5 §5.5.10 — "מעדכנת את סטטוס הפרויקט ל'הסתיים'" | status-transition | Uses label "הסתיים" here (matches C6's Projects enum, row 42) — NOT "פרויקט הסתיים" as used earlier in the very same document at §5.5.1 (row 21) |
| 40 | Same step: "ומעבירה אותו ללשונית פרויקטים שהסתיימו" | C5 §5.5.10 — "מעבירה אותו ללשונית פרויקטים שהסתיימו" | status-transition / field | Tab name, distinct from the status-field value in row 39 |
| 41 | דו"ח רווחיות process: "רשומות בסטטוס 'הסתיים'" fed into the report | C5 §5.5.11.2 — "המערכת מציגה את כלל הפרויקטים בסטטוס 'הסתיים'" | rule | |
| 42 | Report shows "'הרווח הגולמי בפועל' (שחושב ונשמר בעת סגירת הפרויקט)" | C5 §5.5.11.2 — "שחושב ונשמר בעת סגירת הפרויקט" | field | Already flagged inline in C5 itself as §9 #15 known-defect: contradicts C6 §2.4.4 which defines gross profit as a **derived, not-stored** attribute (row 45). Decision pending §7.52+§7.78 |
| 43 | Report shows "'ציון המשוב' שהתקבל מהלקוח" | C5 §5.5.11.2 — "ואת 'ציון המשוב' שהתקבל מהלקוח" | field | |
| 44 | Report highlights "חריגות ביצוע" visually: projects over-budget OR with low feedback score | C5 §5.5.11.2 — "פרויקטים שחרגו מהתקציב המתוכנן או שקיבלו ציון משוב נמוך" | rule / validation | "Over budget" and "low score" both undefined thresholds here (no explicit % or score cutoff given in this sentence) |
| 45 | דו"ח שכר process — step 1: "מנהלת הכספים בוחרת את החודש והשנה הרצויים להפקה" | C5 §5.5.11.5 — "בוחרת את החודש והשנה הרצויים להפקה" | field / action | |
| 46 | Step 2: "המערכת סורקת פרויקטים שהסתיימו בחודש זה" | C5 §5.5.11.5 — "סורקת פרויקטים שהסתיימו בחודש זה" | rule | Scope = projects completed **in that month** — "completed in" ambiguous: event date in month, or payment-completion date in month? Not specified |
| 47 | Step 2: "עבור כל דיילת, המערכת סוכמת את שעות הביצוע בפועל" | C5 §5.5.11.5 — "סוכמת את שעות הביצוע בפועל" | rule / number | |
| 48 | Step 2: sums are "מכפילה בנתון 'שכר שעתי בביצוע' מתוך השיבוצים" | C5 §5.5.11.5 — "מכפילה בנתון 'שכר שעתי בביצוע' מתוך השיבוצים" | rule / field | Explicitly uses the wage FROZEN on the assignment record, not the hostess's current profile wage |
| 49 | Explicit reason given: "כדי למנוע עיוותים משינויי שכר עתידיים" | C5 §5.5.11.5 — "למנוע עיוותים משינויי שכר עתידיים" | rule | Named business rationale for using the frozen per-assignment wage |
| 50 | Step 2: "ומחלקת את ה'בונוס פרויקט כללי' בין הדיילות ששובצו" | C5 §5.5.11.5 — "מחלקת את ה'בונוס פרויקט כללי' בין הדיילות ששובצו" | rule | Division **method** not specified anywhere in this sentence (equal split? proportional to hours?) — see "could not fully specify" section |
| 51 | Step 3: "המשתמשת לוחצת 'ייצא ושלח'" | C5 §5.5.11.5 — "לוחצת 'ייצא ושלח'" | action | |
| 52 | Step 3: "המערכת מייצאת את הקובץ (Excel) למייל של הנהלת החשבונות" | C5 §5.5.11.5 — "מייצאת את הקובץ (Excel) למייל" | action / field | Format stated here: **Excel only**. Contradicts §5.7.5 ("PDF/Excel", row 65) and matches C6 §2.4.10 ("Excel / CSV", row 68) only partially — 3-way format mismatch, see contradictions section |
| 53 | Step 3: "מייצרת אוטומטית רשומה עם קוד הפקה ייחודי, למניעת כפילויות תשלום בעתיד" | C5 §5.5.11.5 — "קוד הפקה ייחודי, למניעת כפילויות תשלום" | enforcement / field | Duplicate-payment prevention mechanism, matches C6 §2.4.10's stated purpose (row 67) |
| 54 | Home screen KPI: "רווח גולמי משוער לחודש הנוכחי" | C5 §5.6.2 — "רווח גולמי משוער לחודש הנוכחי" | field | One of 4 home-screen KPI cards |
| 55 | Home screen KPI: "ממוצע שביעות רצון (רבעוני)" | C5 §5.6.2 — "ממוצע שביעות רצון (רבעוני)" | field | Quarterly cadence stated here — but the quarter boundary (calendar quarter vs. rolling 90 days) is undefined; already an open item (§7.37) |
| 56 | Project-card tab 3 ("סגירת אירוע"): mandatory fields "שעות ביצוע בפועל", "כמות אורחים בפועל", file-upload button ("דו"ח סיכום") | C5 §5.6.7 — "שדות חובה להזנת שעות אמת כלליות... כמות אורחים בפועל" | field | Operational-closing inputs owned by project manager, upstream of finance handoff |
| 57 | Enforcement: "המערכת לא תאפשר לחיצה על כפתור 'שמור ושלח' ללא הזנת שעות המסגרת הכלליות, כמות האורחים, והעלאת קובץ דו"ח הסיכום" | C5 §5.6.7 — "לא תאפשר לחיצה... ללא הזנת שעות המסגרת" | enforcement / validation | 3-part required-field gate on operational closing |
| 58 | On successful closing: "שולחת אוטומטית את הדו"ח ללקוח, ומעבירה את הסטטוס ל'ממתין לחשבונית' עבור מנהלת הכספים" | C5 §5.6.7 — "שולחת אוטומטית את הדו"ח ללקוח" | action / status-transition | This is the M6→M8 handoff trigger. "שולחת... את הדו"ח" (sends the report) here plausibly = the §5.8.2 feedback-request email (see contradictions section) — not the same act as §5.5.10's finance-manager-sent survey link (row 28) |
| 59 | Finance overview screen: filter/search bar "לפי תאריכים, שם חברה, או מספר פרויקט" | C5 §5.6.13 — "סרגל סינון וחיפוש (לפי תאריכים, שם חברה, או מספר פרויקט)" | field | |
| 60 | Finance overview: 3 tabs "'ממתין לחשבונית', 'ממתין לתשלום', ו'פרויקטים שהסתיימו'" | C5 §5.6.13 — "פרויקטים שהסתיימו" | field | 3rd tab label here is "פרויקטים שהסתיימו" (plural, tab name) — §5.5.10 used "הסתיים" (row 23) for the same 3rd tab; minor naming variance across the two descriptions of the same screen |
| 61 | List columns: "שם לקוח, תאריך סיום, רווח סופי (%), ציון שביעות רצון (כוכבים), וסטטוס" | C5 §5.6.13 — "רווח סופי (%), ציון שביעות רצון (כוכבים)" | field | Profit shown **as %** here too (3rd instance, matches row 37) |
| 62 | "המערכת מזרימה אוטומטית ללשונית 'ממתין לחשבונית' כל פרויקט שהסתיים תפעולית בשטח" | C5 §5.6.13 — "מזרימה אוטומטית ללשונית 'ממתין לחשבונית'" | status-transition / rule | |
| 63 | "לחיצה על פרויקט מתוך הרשימה תפתח את חלון סגירת תיק הפרויקט" | C5 §5.6.13 — "תפתח את חלון סגירת תיק הפרויקט" | action | Navigation from list → detail window |
| 64 | Closing-window billing area: "שדות מזהים ננעלים לעיון (ח.פ, איש קשר, מייל לחיוב)" | C5 §5.6.14 — "שדות מזהים ננעלים לעיון" | field | Read-only identifying fields |
| 65 | Checkbox: "תיבת סימון 'חשבונית נשלחה'" | C5 §5.6.14 — "תיבת סימון 'חשבונית נשלחה'" | field | Matches C6 Projects table field "נשלחה חשבונית" (row 40 in the table section below) |
| 66 | Field: "שדה הזנה ל'תאריך קבלת תשלום'" | C5 §5.6.14 — "שדה הזנה ל'תאריך קבלת תשלום'" | field | |
| 67 | Profitability display: "תחשיב הרווח הגולמי במבנה מאזן... סה"כ ההכנסות (הכנסת בסיס מההצעה + חיוב על שינויים)" | C5 §5.6.14 — "הכנסת בסיס מההצעה + חיוב על שינויים" | field / rule | Introduces a **new revenue component** — "חיוב על שינויים" (billing for changes) — not present in §5.3.4.4's formula (row 8, which sourced net revenue purely from the quote's pre-VAT total). What "changes" are billed, and how, is undefined here; loosely related to §7.67/§7.72 (Quote_Services pricing lineage) but not resolved by this text |
| 68 | Expense side: "סה"כ ההוצאות הישירות (תצוגת שכר הדיילות שנגזרה משעות הביצוע, עלויות רכש לוגיסטי)" | C5 §5.6.14 — "עלויות רכש לוגיסטי" | field | |
| 69 | "מתחת לנתונים אלו מופיעה שורה תחתונה מודגשת המציגה את הרווח הגולמי הסופי בשקלים" | C5 §5.6.14 — "הרווח הגולמי הסופי בשקלים" | field / number | States final gross profit **in ILS (currency)** — contradicts §5.5.10 (row 37) and §5.6.13 (row 61), both of which show/state the figure as a **percentage**. See contradictions section |
| 70 | Satisfaction area: "כפתור פעולה לשליחת שאלון שביעות רצון ללקוח" | C5 §5.6.14 — "כפתור פעולה לשליחת שאלון שביעות רצון ללקוח" | action / field | A send-survey button living **inside this closing window**, distinct again from the §5.5.10 auto-send-on-invoice-tab (row 28) and the §5.8.2/§5.6.7 send-on-operational-lock (rows 58, 60) — a 3rd apparent survey-send trigger point |
| 71 | Satisfaction area: "שדה להזנת הציון שהתקבל (1-5 כוכבים) במידה והתקבל טלפונית/ ידנית" | C5 §5.6.14 — "התקבל טלפונית/ ידנית" | field | Confirms a manual/phone fallback entry channel alongside the Google-Forms digital channel |
| 72 | Action buttons: "כפתור 'שמור סטטוס' (לשמירת ביניים)" | C5 §5.6.14 — "כפתור 'שמור סטטוס' (לשמירת ביניים)" | field / action | Interim-save button, distinct from the final commit |
| 73 | Action buttons: "כפתור סופי 'עדכן ושמור' – עם חלונית וידוא פעולה" | C5 §5.6.14 — "עם חלונית וידוא פעולה" | action / validation | Final-save button carries a confirmation dialog |
| 74 | "סימון 'V' על שליחת חשבונית ולחיצה על שמירה משנה אוטומטית את סטטוס הפרויקט ל'ממתין לתשלום'" | C5 §5.6.14 — "משנה אוטומטית את סטטוס הפרויקט ל'ממתין לתשלום'" | status-transition | |
| 75 | "עם הזנת תאריך קבלת התשלום... המערכת מציגה חיווי ויזואלי המאשר את הסדרת החוב" | C5 §5.6.14 — "מאשר את הסדרת החוב" | rule (UI feedback) | Restates row 36's visual-confirmation rule for this window specifically |
| 76 | Enforcement: "המערכת לא תאפשר לחיצה על כפתור 'העבר לארכיון' ללא קליטת ציון משוב מהלקוח" | C5 §5.6.14 — "לא תאפשר לחיצה על כפתור 'העבר לארכיון' ללא קליטת ציון משוב" | enforcement / validation | Blocks archiving without a captured feedback score. Tension with row 34 (a legitimate "לא ענה לסקר" outcome that closes the feedback task without ever producing a numeric score) — does the checkbox count as "קליטה"? Not stated; see contradictions section |
| 77 | "ציון משוב... נשמר בתיק הלקוח ומשפיע על ממוצע שביעות הרצון הכולל" | C5 §5.6.14 — "משפיע על ממוצע שביעות הרצון הכולל" | rule | Restates row 32's KPI-feed rule |
| 78 | "עמידה בתנאי זה ולחיצה על העברה לארכיון נועלת את התיק לעריכה באופן מוחלט, ומשנה את סטטוס הפרויקט לפרויקטים שהסתיימו" | C5 §5.6.14 — "נועלת את התיק לעריכה באופן מוחלט" | enforcement / status-transition | "באופן מוחלט" = irreversible lock, no undo path described anywhere in this text |
| 79 | Same sentence: sets "סטטוס הפרויקט" to "פרויקטים שהסתיימו" | C5 §5.6.14 — "ומשנה את סטטוס הפרויקט לפרויקטים שהסתיימו" | status-transition | Literally uses the **plural tab name** ("פרויקטים שהסתיימו") as the value assigned to the singular project-status field — see "could not cleanly break apart" section; likely loose phrasing conflating "moves to the completed-projects tab" with "sets the status field", when the actual status enum value (per row 39 / C6 row 42) is "הסתיים" |
| 80 | Settings screen — financial params: "עדכון משתני הליבה המשפיעים על מנוע התמחור ודו"חות הרווחיות, כגון: שכר מינימום שעתי לדיילת, תעריף חיוב קבוע לדיילת ללקוח" | C5 §5.6.16 — "שכר מינימום שעתי לדיילת, תעריף חיוב קבוע לדיילת ללקוח" | field | 🔧 Already flagged inline in C5 as §9 #8: "תעריף חיוב קבוע לדיילת ללקוח" was **removed** per Seed decision #4 — no fixed customer-billing rate exists in the salary model. Reported here as written |
| 81 | Settings screen — integrations: "כתובת הדוא"ל של רואה החשבון (לייצוא אוטומטי של דו"ח השכר)" | C5 §5.6.16 — "כתובת הדוא"ל של רואה החשבון" | field | Accountant email address is a configurable global param, feeding §5.5.11.5/§5.8.10's auto-export |
| 82 | Settings screen — integrations: "קישור חיצוני לטופס סקר שביעות רצון" | C5 §5.6.16 — "קישור חיצוני לטופס סקר שביעות רצון" | field | The external Google Forms survey link is itself a configurable global param |
| 83 | Settings screen — templates: editable "תבנית דוא"ל לסיום אירוע" among others | C5 §5.6.16 — "ותבנית דוא"ל לסיום אירוע" | field | Confirms the event-closing email (§5.8.2/§5.8.3 family) is meant to be editable free text with dynamic fields, not hardcoded |
| 84 | דו"ח רווחיות (§5.7.4) — target users: "מנכ"ל ומנהלת כספים" | C5 §5.7.4 — "משתמש יעד: מנכ"ל ומנהלת כספים" | field | |
| 85 | Output: "תצוגת מסך וייצוא לקובץ... טבלת נתונים עם חיווי אדום לחריגות תקציביות, וגרף עמודות (Bar Chart)... לאורך החודש" | C5 §5.7.4 — "גרף עמודות... הממחיש הכנסות מול הוצאות ישירות לאורך החודש" | field / rule | Bar-chart granularity stated as "לאורך החודש" (across the month) while the user-selected date range (next row) is quarter/year — granularity mismatch, see "could not cleanly break apart" |
| 86 | Data fields: "מזהה פרויקט, שם אירוע, שם לקוח, רווח גולמי (%), סטיית תקציב (בש"ח), ציון משוב לקוח" | C5 §5.7.4 — "רווח גולמי (%), סטיית תקציב (בש"ח)" | field | Profit again **%**, but budget-deviation is explicitly in ₪ — two different units for two related figures on the same report row |
| 87 | Logic: "המנהלת מגדירה טווח תאריכים (למשל רבעון)... שולפת... רשומות בסטטוס 'הסתיים'" | C5 §5.7.4 — "המנהלת מגדירה טווח תאריכים (למשל רבעון)" | field / rule | Date-range granularity here is user-chosen (quarter given only as an example) — conflicts with row 85's fixed "month" chart axis |
| 88 | Logic: gross profit = net revenue approved in quote − direct expenses (actual hostess hours, logistics costs) | C5 §5.7.4 — "הפחתת סך ההוצאות הישירות... מסך ההכנסות נטו שאושרו בהצעת המחיר" | rule | Restates the §5.3.4.4 formula at report level, using "הכנסות נטו... שאושרו בהצעת המחיר" (matches §5.3.4.4's phrasing, not §5.5.10's "הכנסות מתוכננות") |
| 89 | דו"ח שכר (§5.7.5) — target users: "מנהלת כספים (ורואה חשבון כגורם חיצוני)" | C5 §5.7.5 — "מנהלת כספים (ורואה חשבון כגורם חיצוני)" | field | |
| 90 | Output format: "קובץ מיוצא (PDF /Excel) בעל מבנה פורמלי, הכולל חותמת זמן ושורת סיכום כוללת בתחתית" | C5 §5.7.5 — "קובץ מיוצא (PDF /Excel)" | field | States **PDF or Excel**. Contradicts §5.5.11.5's process text ("Excel" only, row 52) and C6 §2.4.10's field definition ("Excel / CSV", row 68) — a 3-way file-format mismatch across three separate C5/C6 passages, see contradictions section |
| 91 | Formal structure requirement: "הכולל חותמת זמן ושורת סיכום כוללת בתחתית" | C5 §5.7.5 — "חותמת זמן ושורת סיכום כוללת בתחתית" | rule / field | Timestamp + grand-total summary row required in the exported file |
| 92 | Data fields: "קוד הפקת דו"ח, ת"ז דיילת, שם מלא, פרטי בנק, שכר שעתי בביצוע, סך שעות חודשי בפועל, בונוסים אישיים לאותו חודש" | C5 §5.7.5 — "פרטי בנק, שכר שעתי בביצוע" | field | All 7 fields confirmed to exist on source tables: report code + hostess ID/name/bank details on Hostesses (C6 §2.4.5), "שכר שעתי בביצוע" is the Assignments-table frozen wage (C6 §2.4.14, row 71 below) |
| 93 | Logic: "בסוף החודש מפעילה מנהלת הכספים את שאילתת השכר" | C5 §5.7.5 — "מפעילה מנהלת הכספים את שאילתת השכר" | action | |
| 94 | Logic: "המערכת שולפת ממאגר השיבוצים את כלל שעות הביצוע והבונוסים של הדיילות מהפרויקטים שהסתיימו באותו חודש" | C5 §5.7.5 — "מהפרויקטים שהסתיימו באותו חודש" | rule | Same "completed in that month" ambiguity as row 46 |
| 95 | Logic: "המערכת מחשבת ומקבצת את סך השעות לכל דיילת בנפרד" | C5 §5.7.5 — "מקבצת את סך השעות לכל דיילת בנפרד" | rule / number | Grouping-by-hostess step |
| 96 | §5.8.2 template trigger: "מנהלת הפרויקטים נועלת את האירוע בסיום הביצוע" | C5 §5.8.2 — "מנהלת הפרויקטים נועלת את האירוע בסיום הביצוע" | field (trigger) | Trigger owner = **project manager**, at operational lock — see contradictions section (clashes with rows 28, 70) |
| 97 | §5.8.2 body: fixed template with placeholders `[שם_איש_קשר]`, `[שם_פרויקט]`, `[לינק_לשאלון_שביעות_רצון]` | C5 §5.8.2 — "[לינק_לשאלון_שביעות_רצון]" | field | |
| 98 | §5.8.3 template trigger: "סגירה פיננסית של האירוע" | C5 §5.8.3 — "טריגר לשליחה: סגירה פיננסית של האירוע" | field (trigger) | Trigger owner implicitly = finance manager (matches §5.6.14 flow) |
| 99 | §5.8.3 body: fixed template with placeholders `[שם_לקוח_חברה]`, `[שם_פרויקט]` | C5 §5.8.3 — "מצורפת בזאת חשבונית מס/קבלה" | field | |
| 100 | §5.8.3 attachment: `Invoice_[מספר_פרויקט].pdf` | C5 §5.8.3 — "קובץ מצורף: Invoice_[מספר_פרויקט].pdf" | field | Filename pattern; per §7.38 ruling this file is finance-manager-uploaded, not system-produced (already reconciled with the row-2 out-of-scope statement) |
| 101 | §5.8.8 distribution timing: "יופץ ללקוח בפורמט דיגיטלי מיד עם סיום האירוע" | C5 §5.8.8 — "יופץ ללקוח בפורמט דיגיטלי מיד עם סיום האירוע" | field / rule | Timing = immediately at event end — contradicts §5.5.10's timing (sent when the finance manager processes the invoice tab, potentially well after event end); see contradictions section |
| 102 | §5.8.8 data ownership: "הנתונים הנאספים בו משמשים את מנהלת הפרויקטים לצורך בקרה" | C5 §5.8.8 — "משמשים את מנהלת הפרויקטים לצורך בקרה" | field / rule | Assigns survey-data ownership/control to the **project manager** — a 3rd conflicting role assignment for the feedback flow, alongside §5.4.3/§5.5.10/§5.6.14 (finance manager) and §5.8.2 (project manager triggers the send). See contradictions section |
| 103 | §5.8.8 data entry point: "הציון המשוקלל וההערות מוזנים ישירות לכרטיס הפרויקט במערכת" | C5 §5.8.8 — "מוזנים ישירות לכרטיס הפרויקט" | field | |
| 104 | §5.8.8: 4 named 1–5 rating questions | C5 §5.8.8 — "שאלות דירוג (סקאלה 1–5)" | field | Team professionalism, PM communication/management, digital registration experience, product quality — 4 separate scores feeding into 1 stored "ציון משוקלל"; the aggregation rule from 4→1 is nowhere in C5/C6 (already an open item, §7.37) |
| 105 | §5.8.10 trigger: "לחיצה של מנהלת הכספים על כפתור 'ייצא ושלח' במסך הדו"חות בסיום החודש" | C5 §5.8.10 — "לחיצה של מנהלת הכספים על כפתור 'ייצא ושלח'" | field (trigger) | |
| 106 | §5.8.10 body: fixed template with placeholders `[שם_רואה_חשבון]`, `[חודש_דיווח_ושנה]` | C5 §5.8.10 — "[חודש_דיווח_ושנה]" | field | |
| 107 | §5.8.10 attachment: `[חודש_שנה]_Payroll_Report.xlsx` | C5 §5.8.10 — "[חודש_שנה]_Payroll_Report.xlsx" | field | Excel-only filename — matches §5.5.11.5 (row 52), conflicts with §5.7.5's "PDF/Excel" (row 90) |
| 108 | Customers table: "אחוז הנחה קבועה" field, ≥0, default 0 | C6 §2.4.1 — "אחוז הנחה קבועה \| מספרי עשרוני \| חובה \| ברירת מחדל: 0" | field | Fixed per-customer discount %, feeds the M8 revenue formula (row 8) |
| 109 | Customers table — derived (not stored): "כמות פרויקטים שבוצעו; סה"כ הכנסות מלקוח; רווח גולמי מצטבר; ציון משוב ממוצע (מאלה שענו)" | C6 §2.4.1 — "רווח גולמי מצטבר; ציון משוב ממוצע (מאלה שענו)" | field (derived, real-time, not persisted) | Cumulative gross profit and average feedback score are explicitly real-time-computed, never stored, at the *customer* rollup level — distinct from the per-project gross-profit storage question (row 42/45) |
| 110 | Customers table — average feedback score explicitly scoped to "מאלה שענו" (those who answered) | C6 §2.4.1 — "ציון משוב ממוצע (מאלה שענו)" | rule | Confirms non-respondents are excluded from the average — consistent with the 'לא ענה לסקר' status existing as a distinct non-scoring outcome |
| 111 | Projects table full field list (moved here from its original mis-print inside §2.4.2, per the file's own תיקון-ב note) | C6 §2.4.4 — "מזהה פרויקט \| מספרי שלם \| מפתח ראשי" | field | Header row for the whole finance-relevant column set below |
| 112 | Field: "סטטוס פרויקט" enum = 8 named values, default "טרם החל" | C6 §2.4.4 — "[טרם החל \| בתהליך \| מוכן לביצוע \| אירוע הסתיים \| ממתין לחשבונית \| ממתין לתשלום \| הסתיים \| בוטל]" | field | 6th value here is **"הסתיים"**, not "פרויקט הסתיים" as in C5 §5.5.1 (row 21) — see contradictions section |
| 113 | Field: "נשלחה חשבונית" — boolean, default false | C6 §2.4.4 — "נשלחה חשבונית \| בוליאני \| חובה" | field | Backing field for the §5.6.14 checkbox (row 65) |
| 114 | Field: "סטטוס משוב" enum = 4 values, default "טרם נשלח" | C6 §2.4.4 — "[טרם נשלח \| נשלח ללקוח \| הושלם \| ללא מענה]" | field | Contradicts C5 §5.5.10's 3-value enum for the same conceptual field (row 25) — see contradictions section |
| 115 | Field: "אורחים בפועל" — optional, "הופך לחובה בשלב סגירת אירוע תפעולית" | C6 §2.4.4 — "הופך לחובה בשלב סגירת אירוע תפעולית" | field / validation | Conditional-required field, matches §5.6.7's operational-closing gate (row 57) |
| 116 | Field: "שעות בפועל" — optional, same conditional-required note | C6 §2.4.4 — "שעות בפועל \| מספרי עשרוני \| רשות \| גדול מ-0 (הופך לחובה" | field / validation | |
| 117 | Field: "תאריך קבלת תשלום" — optional date field | C6 §2.4.4 — "תאריך קבלת תשלום \| תאריך \| רשות" | field | Backing field for row 66 |
| 118 | Field: "ציון משוב" — optional integer, domain [1–5] | C6 §2.4.4 — "ציון משוב \| מספרי שלם \| רשות \| [1–5]" | field | Single stored score, matches the "ציון משוקלל" concept from C5 §5.5.10/§5.8.8 |
| 119 | Field: "סיבת משוב שלילי" — conditionally required "בציון משוב < 3", 5 named enum values | C6 §2.4.4 — "(חובה בציון משוב < 3)" | field / validation | Enum: איחור דיילות / תפקוד דיילות / איכות תגים / ניהול לקוי / אחר. Matches C5's requirement (row 33) with an explicit DB-level conditional-required rule and a concrete reason taxonomy C5 itself never lists |
| 120 | Field: "הערות משוב" — free text, optional | C6 §2.4.4 — "הערות משוב \| טקסט חופשי \| רשות" | field | |
| 121 | Field: "קישור לדו"ח סיכום" — optional | C6 §2.4.4 — "קישור לדו"ח סיכום \| אלפאנומרי \| רשות" | field | Backing field for the §5.6.7 summary-report file upload (row 56); marked "רשות" (optional) at the table level even though §5.6.7's UI enforces it as a hard-required upload before operational closing — a table-vs-screen strictness mismatch, see "could not cleanly break apart" |
| 122 | Projects — derived (not stored): "מדד שיבוץ; מדד לוגיסטיקה; רווח גולמי פרויקט; סטיית תקציב" | C6 §2.4.4 — "רווח גולמי פרויקט; סטיית תקציב" | field (derived, not persisted) | Project-level gross profit and budget deviation are BOTH declared derived/real-time here — directly contradicts §5.5.11.2's "חושב ונשמר" (row 42); this is the pairing already flagged in-line as §9 #15 |
| 123 | Params table: "סוג פרמטר" enum includes "תמחור וזמנים" and "תבניות תוכן" categories | C6 §2.4.9 — "[תמחור וזמנים \| בקרה והתראות \| מנוע שיבוץ Smart Match \| תבניות תוכן \| אינטגרציה וטכנולוגיה]" | field | Confirms VAT rate, min wage, and email templates all live as rows in one generic global-params table, not dedicated columns |
| 124 | Params table purpose statement names VAT and Smart-Match weights as example editable params, not salary-report or archiving params | C6 §2.4.9 — "מאפשר עדכון דינמי של הגדרות גלובליות (מע"מ, שכר מינימום...)" | field | |
| 125 | Salary_Reports table: PK = "קוד הפקת דו"ח" (integer) | C6 §2.4.10 — "קוד הפקת דו"ח \| מספרי שלם \| מפתח ראשי (PK)" | field | |
| 126 | Salary_Reports table: "תאריך שליחה" — required, "תאריך שליחה לרואה החשבון" | C6 §2.4.10 — "תאריך שליחה \| תאריך \| חובה" | field | |
| 127 | Salary_Reports table: "קובץ הדו"ח" — required, "נתיב לקובץ Excel / CSV" | C6 §2.4.10 — "נתיב לקובץ Excel / CSV" | field | States **Excel/CSV**, no PDF — the 3rd distinct format statement (vs. §5.7.5's "PDF/Excel" and §5.5.11.5's "Excel"); see contradictions section |
| 128 | Salary_Reports — derived (not stored): "סה"כ שכר ארגוני ששולם" | C6 §2.4.10 — "תכונות נגזרות... סה"כ שכר ארגוני ששולם" | field (derived, not persisted) | Org-wide total salary paid is a real-time rollup, not a stored total on this table |
| 129 | Salary_Reports table purpose: "כל רשומת שיבוץ שמעובדת מקבלת מפתח זר לדו"ח, ולא ניתן לשייך אותה פעמיים" | C6 §2.4.10 — "ולא ניתן לשייך אותה פעמיים" | rule / enforcement | The duplicate-payment guard is structural: an assignment row's FK to a report is (implicitly) a one-time assignment, not merely a business-process convention |
| 130 | Assignments table: "שכר שעתי באירוע" — required, "מוקפא מכרטיס הדיילת" | C6 §2.4.14 — "שכר שעתי באירוע \| מספרי עשרוני \| חובה \| מוקפא מכרטיס הדיילת" | field | This is the field C5 §5.5.11.5 calls "שכר שעתי בביצוע" (row 48) — same concept, different literal field name across C5 prose vs C6 schema; not flagged elsewhere as a known defect |
| 131 | Assignments table: "שעות בפועל" — required, ≥0, default 0 | C6 §2.4.14 — "שעות בפועל \| מספרי עשרוני \| חובה \| ≥ 0 \| ברירת מחדל: 0" | field | Feeds the salary calc (row 47) and the gross-profit expense side (row 10) |
| 132 | Assignments table: "בונוס אישי" — required, ≥0, default 0 | C6 §2.4.14 — "בונוס אישי \| מספרי עשרוני \| חובה \| ≥ 0 \| ברירת מחדל: 0" | field | Per-assignment personal bonus — distinct from the project-level "בונוס פרויקט כללי" (row 50) that gets divided among hostesses; two separate bonus concepts feeding the same salary report |
| 133 | Assignments table: FK "קוד הפקת דו"ח" ← Salary_Reports, ON DELETE RESTRICT | C6 §2.4.14 — "קוד הפקת דו"ח \| מספרי שלם \| מפתח זר (FK) ← טבלת דו"חות שכר" | field | Structural backbone of the duplicate-payment guard (row 129) |
| 134 | Hostesses table: "פרטי בנק (תכונה מורכבת)" — required composite field: bank/branch/account numbers, "כולל ולידציה" | C6 §2.4.5 — "מאגדת: מספר בנק, מספר סניף, מספר חשבון (כולל ולידציה)" | field / validation | Confirms the bank-details field that §5.7.5's salary report requires (row 92) actually exists, as a validated composite |
| 135 | Hostesses — derived (not stored): "סך שעות חודשי; סך בונוסים חודשי; היקף משמרות רבעוני" | C6 §2.4.5 — "סך שעות חודשי; סך בונוסים חודשי" | field (derived, not persisted) | Monthly hour/bonus totals per hostess are real-time rollups — directly feed the §5.7.5/§5.5.11.5 salary report, never persisted |
| 136 | DFD dictionary — U3 "מנהלת כספים ולקוחות": "ניהול לקוחות, גבייה, הפקת חשבוניות, דוחות שכר והזנת משובים" | C6 §2.2 — "גבייה, הפקת חשבוניות, דוחות שכר והזנת משובים" | field | External-entity role summary; "הפקת חשבוניות" (invoice **production**) phrased here again as if the system produces invoices — same tension as row 2/100, resolved by §7.38 as upload-and-send |
| 137 | DFD dictionary — U8 "משרד רואה חשבון": "קבלת דוח שעות חודשי במייל" | C6 §2.2 — "U8 \| משרד רואה חשבון \| קבלת דוח שעות חודשי במייל" | field | The accountant is modeled purely as a mail recipient, no system access |
| 138 | DFD dictionary — D5 "מאגר פרויקטים": "נתוני אירועים, סטטוס פרויקט, נתוני ביצוע בפועל ומשובים" | C6 §2.2 — "נתוני ביצוע בפועל ומשובים" | field | |
| 139 | DFD dictionary — D7 "מאגר דוחות שכר": "רשומות ריכוז שכר חודשי ותאריך שליחה לרו"ח (למניעת כפילויות)" | C6 §2.2 — "למניעת כפילויות" | field | |
| 140 | DFD dictionary — D9 "פרמטרי מערכת": "משקולות אלגוריתם התאמה, שכר מינימום, תעריפים, מע"מ ותבניות מייל" | C6 §2.2 — "שכר מינימום, תעריפים, מע"מ ותבניות מייל" | field | |
| 141 | DFD dictionary — F4 "בצע סגירה פיננסית": "קליטת נתוני ביצוע, הפקת חשבוניות ודוחות, שמירת משובים" | C6 §2.2 — "F4 \| בצע סגירה פיננסית \| קליטת נתוני ביצוע, הפקת חשבוניות ודוחות, שמירת משובים" | field | Top-level process definition for the whole M8 domain; again uses "הפקת חשבוניות" language (see row 136) |

---

## Sentences I could NOT break apart / passages that contradict each other inside C5–C6

Verbatim quotes, grouped by tension. Each is a genuine textual clash **inside C5/C6 as written** — several are already resolved by later rulings in `PROJECT_MASTER_sec7.md` or already flagged inline by C5/C6's own `🔧 פגם ידוע` notes (cited where applicable); listed here regardless, per the brief's instruction to report contradictions faithfully rather than silently defer to the resolution.

1. **Feedback-status field: two incompatible enums for the same concept.**
   - C5 §5.5.10: *"שדה סטטוס המשוב במערכת יכיל אחד משלושת הערכים הבאים: 'הוזן משוב חיובי (3-5), 'הוזן משוב שלילי' ,(<3) או 'לא ענה לסקר'."*
   - C6 §2.4.4 (Projects table, "סטטוס משוב"): *"[טרם נשלח \| נשלח ללקוח \| הושלם \| ללא מענה]"*
   - Three values vs. four; outcome-based vs. process-state-based. Not resolvable by reading alone — different axes entirely (one tracks the survey-sending pipeline, the other tracks the scoring outcome).

2. **Who sends the feedback-survey link, and when — at least three different owners/triggers across C5.**
   - C5 §5.5.10 (inside the finance-manager's invoice-tab step): *"מסמנת במסך 'V' בתיבת 'סמן כנשלחה חשבונית', **שולחת ללקוח קישור לסקר משוב**, ושומרת."*
   - C5 §5.8.2 (template trigger): *"טריגר לשליחה: **מנהלת הפרויקטים** נועלת את האירוע בסיום הביצוע."*
   - C5 §5.6.7 (operational closing, project manager's screen): *"...**שולחת אוטומטית את הדו"ח ללקוח**, ומעבירה את הסטטוס ל'ממתין לחשבונית'..."*
   - C5 §5.6.14 (closing window): *"כפתור פעולה לשליחת שאלון שביעות רצון ללקוח"* — a 4th, manual send button living inside the finance-closing window itself.
   - C5 §5.8.8: *"השאלון יופץ ללקוח בפורמט דיגיטלי **מיד עם סיום האירוע**"* — a timing claim that fits §5.6.7/§5.8.2 (operational lock) but not §5.5.10 (invoice-tab processing, which can happen well after event end).
   - Four passages, at least two owners (project manager vs. finance manager), at least three trigger moments, and one explicit timing statement that only matches one of the readings. Already ruled in `docs/PROJECT_MASTER_sec7.md` item 39: *"מודול 6 שולח בסגירה התפעולית; מודול 8 אינו שולח כלל"* — but the raw text still contains all four claims as written.

3. **Who "owns"/controls the feedback data — project manager or finance manager?**
   - C5 §5.4.3 (permissions): finance manager has *"הרשאות עריכה מלאות במודול 'ניהול לקוחות'... ובמודול 'סגירה פיננסית'"* and the whole §5.5.10/§5.6.14 flow is written as her workspace.
   - C5 §5.8.8: *"הנתונים הנאספים בו משמשים את **מנהלת הפרויקטים** לצורך בקרה, כאשר הציון המשוקלל וההערות מוזנים ישירות לכרטיס הפרויקט."*
   - Not just a send-trigger conflict (item 2 above) but a stated data-ownership conflict for who *uses* the score for control purposes.

4. **Gross profit displayed as a percentage in some places, in shekels in another.**
   - C5 §5.5.10: *"המערכת מחשבת ומציגה אוטומטית את הרווח הגולמי **באחוזים**"*
   - C5 §5.6.13 (list column): *"רווח סופי **(%)**"*
   - C5 §5.7.4 (report data fields): *"רווח גולמי **(%)**"*
   - C5 §5.6.14 (closing-window bottom line): *"שורה תחתונה מודגשת המציגה את הרווח הגולמי הסופי **בשקלים**."*
   - Three passages say %, one says ₪, for what reads as the same "final gross profit" figure. Could be two genuinely different figures (a %-margin KPI vs. an absolute-₪ line item) coexisting on the same closing window, but the text never says so explicitly — it is ambiguous whether these are one number shown two ways or two distinct numbers.

5. **File format for the monthly salary-report export: three different answers.**
   - C5 §5.5.11.5 (process step 3): *"המערכת מייצאת את הקובץ **(Excel)** למייל..."*
   - C5 §5.8.10 (attachment filename): *"[חודש_שנה]_Payroll_Report**.xlsx**"* (matches Excel-only)
   - C5 §5.7.5 (report spec): *"אמצעי פלט ותצוגה חזותית: קובץ מיוצא **(PDF /Excel)**..."*
   - C6 §2.4.10 (Salary_Reports.קובץ הדו"ח): *"נתיב לקובץ **Excel / CSV**"*
   - Excel-only (2 places), PDF-or-Excel (1 place), Excel-or-CSV (1 place) — three distinct format sets for what is described everywhere as the same monthly file.

6. **Project-status terminal-value label mismatch (already flagged inline as C5's own §9 defect, cited for completeness).**
   - C5 §5.5.1 (status enum list): *"...'ממתין לתשלום', '**פרויקט הסתיים**', 'בוטל'."*
   - C5 §5.5.10 (same document, later): *"מעדכנת את סטטוס הפרויקט ל'**הסתיים**'"*
   - C6 §2.4.4 (Projects table enum): *"[...\| ממתין לתשלום \| **הסתיים** \| בוטל]"*
   - C5 §5.6.14: *"...ומשנה את סטטוס הפרויקט ל**פרויקטים שהסתיימו**"* — yet a 3rd variant, and this one is grammatically the plural **tab name**, not a singular status value at all; reads like the sentence conflated "moves the project into the completed-projects tab" with "sets the status field", and I could not resolve which was intended from the sentence alone.
   - `PROJECT_MASTER_sec7.md` item 41 already canonizes C6's "הסתיים" as the real value ("תוויות-עברית קנוניות לסטטוסים לפי C6... C5:117/227 = נרטיב, לא ערך") — cited for context, not to substitute for the raw text.

7. **Gross profit / budget deviation: "derived, never stored" vs. "computed and saved at closing" — flagged inline in C5 itself.**
   - C6 §2.4.4 (Projects, derived-attributes line): *"תכונות נגזרות (מחושבות בזמן אמת, **אינן נשמרות פיזית**): מדד שיבוץ; מדד לוגיסטיקה; **רווח גולמי פרויקט**; סטיית תקציב."*
   - C5 §5.5.11.2: *"'הרווח הגולמי בפועל' (**שחושב ונשמר** בעת סגירת הפרויקט)"*
   - C5 itself already carries a `🔧 פגם ידוע (§9 #15)` note on this exact clash, pending §7.52+§7.78. Listed here because it's a direct, load-bearing C5-vs-C6 contradiction for module 8's core number, not because it's undiscovered.

8. **"Bonus split among hostesses" — division method never stated.**
   - C5 §5.5.11.5: *"ומחלקת את ה'בונוס פרויקט כללי' **בין** הדיילות ששובצו."*
   - "מחלקת בין" (divides among) does not say equally, pro-rata by hours, or by any other rule — and no other C5/C6 passage read in this sweep touches it. Genuinely unspecified, not just ambiguous phrasing — flagged as a gap rather than a contradiction.

9. **Revenue formula: a component appears in the detailed screen that the canonical formula never mentions.**
   - C5 §5.3.4.4 (the canonical formula section): net revenue = *"סך החיוב ללקוח כפי שאושר בהצעת המחיר, לאחר קיזוז ההנחות... נלקח משורת 'סה"כ לפני מע"מ'."* — sourced entirely from the quote, no other component named.
   - C5 §5.6.14: *"סה"כ ההכנסות (**הכנסת בסיס מההצעה + חיוב על שינויים**)"* — introduces "billing for changes" as a second revenue component, with no definition of what a "change" is, how it's priced, or where it's recorded, anywhere else in C5 or C6.

10. **Report-window date-range granularity vs. chart-axis granularity.**
    - C5 §5.7.4: *"המנהלת מגדירה טווח תאריכים (**למשל רבעון**)"* (user-selected — quarter given only as an example, so could be a year per the report's own "מטרת הדו"ח" line: *"ניתוח פיננסי מעמיק... ‏(רבעון או שנה אחרונה)"* one paragraph earlier in §5.5.11.2).
    - Same §5.7.4: *"גרף עמודות (Bar Chart) הממחיש הכנסות מול הוצאות ישירות **לאורך החודש**."*
    - If the manager picks a year-long range, a chart fixed to "along the month" doesn't obviously compose — the sentence doesn't say whether the bar chart re-buckets into months regardless of the selected range, or is only meaningful for a 1-month selection. Could not resolve from the text alone.

11. **Archiving-enforcement rule vs. the legitimate "no survey answer" outcome.**
    - C5 §5.5.10 (item 3 of the feedback step): *"היעדר מענה: המנהלת מסמנת תיבת 'לא ענה לסקר' **והמטלה נסגרת**."* — presented as a valid, closeable outcome with no numeric score.
    - C5 §5.6.14: *"המערכת **לא תאפשר** לחיצה על כפתור 'העבר לארכיון' **ללא קליטת ציון משוב** מהלקוח..."* — the archiving gate is phrased around a captured *score*, not a captured *status*.
    - The sentence doesn't say whether checking "לא ענה לסקר" counts as satisfying the archive-gate's "קליטת ציון משוב" requirement, or whether a non-responding customer's project can never be archived. Genuinely unresolvable from the text.

12. **Module name inconsistency for the same functional area.**
    - Official module name used throughout (§5.2.1, §5.6.2 nav menu, §5.6.13 title, DFD F4 label "בצע סגירה פיננסית"): *"כספים וסגירת אירוע"* (as a module) / *"כספים"* (nav item).
    - C5 §5.4.3 (permissions): *"הרשאות עריכה מלאות... במודול '**סגירה פיננסית**' (הפקת חשבוניות וגבייה)"* — names it "סגירה פיננסית" as if that's the module's proper name, without "וסגירת אירוע"/"כספים". Minor, but it's the literal string a permissions-matrix implementation would need to match against a module name, so the mismatch is not purely cosmetic.

---

## Row counts

- Requirements table: **141 rows**.
- Contradiction/could-not-decompose section: **12 items** (several are compound, citing 2–4 source passages each).

## Summary (for the calling session)

Read C5 §5.2.1–§5.2.2 (scope), §5.3.4.1/§5.3.4.3–4 (VAT assumption + the full gross-profit formula), §5.4.1–§5.4.6 (all 5 role permission blocks — no "1.4.x/1.5.x" numbering exists, that's the task brief's own shorthand for this section), §5.5.1 (project-status enum), §5.5.10 (the core financial-closing process, atomized into ~18 rows), §5.5.11.2 and §5.5.11.5 (profitability and salary report processes), §5.6.2 (home KPIs), §5.6.7 (operational-closing screen, the M6→M8 handoff), §5.6.13–§5.6.14 (the two M8 screens, very dense — §5.6.14 alone yielded ~16 atomic rows), §5.6.16 (settings — financial params/integrations/templates), §5.7.4–§5.7.5 (the two M8 reports), and the 4 M8-relevant email templates (§5.8.2, §5.8.3, §5.8.8, §5.8.10). On C6: full Customers (§2.4.1), Projects (§2.4.4 — the finance-column-heavy table), Hostesses (§2.4.5, for bank-details/wage confirmation), Params (§2.4.9), Salary_Reports (§2.4.10), Assignments (§2.4.14), and the DFD dictionary (§2.2) entries for U3/U8/D5/D7/D9/F4. 141 atomic requirement rows total; row types split roughly field-heavy (~75) with the rest rules/actions/status-transitions/enforcement/validation/numbers.

Confirmed absent: no section literally numbered "1.2.2" exists in C5 — the file has one chapter ("פרק 5"). The task brief's phrase resolves to §5.2.2's out-of-scope invoice-automation line (row 2); PROJECT_MASTER_sec7.md item 38 uses "§1.2.2" as its own internal shorthand for that same C5 fact, not a real C5 heading.

Twelve contradiction/gap items surfaced (full verbatim quotes in the dedicated section above), the two most load-bearing being: (a) at least 4 different textual claims about who sends the feedback survey and when — project manager at operational lock (§5.8.2, §5.6.7) vs. finance manager at invoice-tab time (§5.5.10) vs. a 4th manual-send button inside the closing window itself (§5.6.14), with a 3rd stated data-ownership conflict (§5.8.8 says the project manager, not finance, "uses" the data for control) — already ruled in §7 item 39/§7.37 but still present as written in the raw text; and (b) gross profit shown as a percentage in three places (§5.5.10, §5.6.13, §5.7.4) but "in shekels" in the one screen (§5.6.14) that actually renders the bottom-line number, with no text clarifying whether that's one figure or two. Also newly surfaced (not flagged inline by C5/C6's own defect-notes and not found cross-referenced in PROJECT_MASTER_sec7.md during this sweep): a 3-way file-format mismatch for the monthly salary export (Excel-only in §5.5.11.5/§5.8.10, PDF-or-Excel in §5.7.5, Excel-or-CSV in C6 §2.4.10); an undefined "חיוב על שינויים" (billing-for-changes) revenue component that appears only in §5.6.14 and is absent from the canonical §5.3.4.4 formula; an unspecified bonus-division method ("מחלקת... בין הדיילות" — no rule for equal vs. proportional split); and a tension between the §5.5.10 "לא ענה לסקר" legitimate-closeout path and the §5.6.14 archive-gate's wording, which requires "קליטת ציון משוב" (score capture) without saying whether a checked "no answer" box satisfies that gate.
