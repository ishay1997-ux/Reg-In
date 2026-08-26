# M8 Cross-Module Debt Audit — Discovery Close

Scope: `docs/PROJECT_MASTER.md §6` (full range, lines 378–657) vs. `docs/specs/module_08_finance/*`
(all 7 top-level files + the one mandatory stage1-review section). Read-only; every claim below
is anchored to a file+line/section, not paraphrased from memory.

---

## PASS 1 — INCOMING: every `🚧 מ8` line in §6, and whether the m8 spec pays it

| # | The §6 debt (line #) | Where m8's spec pays it | Verdict |
|---|---|---|---|
| 1 | **Customer-card completions** (§6:21-22,27,29) — "ממוצע-משוב" + "רווח-גולמי-מצטבר" per customer, **satisfaction filter** in customer list | `processes-approved.md:184` A1/A2/A3 · closed by **ה8** (:252, feedback-avg = `feedback_status='completed'` only; profit = `finished`-only) · build-item sized and file-mapped in **R4-F8** (:364, names `customers.js`, `02_customers/api.js`, `CustomersPage.jsx`, `customers.test.js`) | ✅ **paid-in-plan** — explicit formula + explicit file list |
| 2 | **Email engine — `invoice`/`salary_report` CHECK values** (§6:35-47, part of the מ3/מ8/מ11 email-engine debt) | `processes-approved.md:186` B11 · **R4-F12** (:358): two new `entity_type` values, attachment-mandatory, `'כספים'` SELECT policy, **"מיגרציה לפני דיפלוי, לעולם לא הפוך"** — matches `db_roadmap.md:186` A-20's own note "M8 and M11 remain owed" | ✅ **paid-in-plan** |
| 3 | **Salary report `salary_reports`** — full screen/formula/export/RLS (§6:135-137, `🚧 מ8 ← מ4`) | This **is** P4 in full: card at `processes-approved.md:286-298`, screen S3+M2 in `screens-approved.md`, closed by **ה1·ה7·ה9·ה14·ה15·ה19·ה20** | ✅ **paid-in-plan** — the largest incoming debt, and the most thoroughly built out |
| 4 | **RLS gap: `quote_services.closing_unit_cost` readable at `view`-tier** on "הצעות מחיר" (§6:175-177, joint `🚧 מ8 · 🚧 מ9`) — original debt text: *"מי מהם שיגיע ראשון חייב להכריע: פיצול-טבלה … או ויתור מנומק"* | `processes-approved.md:186` **B14 only** — *"נקרא ב-view על הצעות — אזהרת-עקביות להרשאות-מ8"*. Grepped `closing_unit_cost` across every top-level spec file: **zero other mentions**, no `ה##` decision, no `db_roadmap` migration row | ⚠️ **paid-but-not-explicit** — flagged, never decided. The debt demanded a decision ("split the table, or a reasoned waiver"); B14 is neither — it's a warning note with no owner and no verdict |
| 5 | **Bank "structure check" deliberately not built** (§6:197, `🚧 מ8 ← מ4`) | `processes-approved.md:186` **B3** — *"בדיקת-מבנה-בנק לא נבנתה בכוונה — ההצלבה כאן"*, matches the §6 text word-for-word (Ishay's original 12/08 ruling) | ✅ **paid-in-plan** — this was already closed at the §6 level; B3 is the required cross-reference, not new work |
| 6a | **`event_finished` label parity** — m8 must show "ממתין לסגירה" identically to m6 (§6:247, `🚧 מ8 ← מ6`) | `spec.md:38` — locked-dictionary row, byte-exact | ✅ **paid-in-plan** |
| 6b | **`actual_guests` is not a billing input** — bill by what was ordered, not who showed up (§6:247) | **No explicit mention anywhere.** Grepped `אורחים`/`guests` across the whole spec: only `data-set.md:57` (a cast value) and the closed א58 line. The m8 formula (**ה2**, **ה17**) never reads `actual_guests` for revenue or cost — so the debt is *structurally* satisfied — but no line says "we checked this, here's why" | ⚠️ **paid-but-not-explicit** — satisfied by omission, not by a stated decision |
| 6c | **§7.39 — who sends the feedback survey mail** (§6:247-248) | `processes-approved.md:109` א21, `:255` ה11, `:186` B15 — closed **repeatedly and explicitly**: m6 sends in operational closing, m8 never sends | ✅ **closed** |
| 6d | **🔮 `/feedback/:token` public feedback page** (§6:248) | `processes-approved.md:235` — **adopted** 26/08 as S4, the fourth approved screen | ✅ **adopted, in-plan** |
| 7 | **RC-6 — customer-card "Amount" column excludes scope-changes** (§6:275, `🚧 מ8 ← מ6`) — original text explicitly warns *"מסלול-קריאה ממוסך-כסף … ⇒ עבודה, לא תיקון"* and that the target module is negotiable (m8 or m6) | `processes-approved.md:184` A7 (one line in a 12-item list) + `:246` ה2 (cites RC-6 as precedent for m8's *own* internal formula). **Zero mentions** of the actual file (`src/lib/customerProjects.js:143-146`, `projectAmount`) anywhere in the spec — contrast with item #1 above, where the equivalent cross-module touch (customer-card metrics) got a full file-mapped build item in R4-F8 | ⚠️ **paid-but-not-explicit** — acknowledged twice in prose, but never given the same file-level build-item treatment as its sibling debt (#1). A blueprint session reading only `processes-approved.md`'s headline list could easily read A7 as "already covered by ה2" and never touch `customerProjects.js` |
| 8 | **`salary_reports` unique-per-month constraint** — flagged as owed-to-m8 in `db_roadmap.md:138` (§7.40c) | `processes-approved.md:253` ה9 — `period` UNIQUE + `salary_report_lines` | ✅ **paid-in-plan** |

**Pass 1 tally: 8 debt-lines / 11 sub-items examined → 8 ✅ paid-in-plan · 3 ⚠️ paid-but-not-explicit · 0 🔴 unaddressed.**
No incoming debt was silently dropped. The gap in Pass 1 is entirely about **explicitness of the build-item home**, not about missing coverage — items #4 and #7 are genuinely un-decided/un-located, not un-considered.

---

## PASS 2 — OUTGOING: debts m8 creates for modules that haven't been built yet

**Finding, checked directly:** `grep "← מ8" docs/PROJECT_MASTER.md` → **zero results, anywhere in the file.**
Not one `🚧 מN ← מ8` line exists in §6 today. Cross-checked against `src/modules/` and `docs/specs/`:
only m1–m6 are built; **m7, m9, m10, m11, m12 are all unbuilt and will each `grep '🚧 מ<N>'` on
opening** — so every item below has a live reader and is a real gap, not a formality.

| Candidate | Confirmed? | Evidence in m8 spec | What the missing §6 line would carry |
|---|---|---|---|
| **(a) `🚧 מ11 ← מ8`** | ✅ **confirmed missing** | `ה1` (:245, salary reports = m11 read-only) · `א52` (:150, profitability report screen = m11, **source number = m8**) · `ה17`/`ה18` (:260-261, budget-deviation ₪ = m8's SSOT for m11's report) · P3 "קשרים" (:330, "מייצר את המספר ל… דו"ח-מ11") · product decision #1 (:368, cancelled-and-resolved projects appear in m11's reports, flagged rows) · `stage1-review/m8-review-infra-ripples.md:311` (blind spot — m11's RLS policy on `salary_reports` was never checked) | Read-only contract on `salary_reports` + `salary_report_lines` · the profitability-report source fields (final_profit %, budget-deviation ₪, feedback_score) and their exact population rules (ה8/ה17/ה18) · that cancelled-but-resolved projects belong in m11's population, tagged |
| **(b) `🚧 מ10 ← מ8`** | ✅ **confirmed missing** | `spec.md:77` §④ "פתוח בכוונה": **"סכום-הנסיעות הסופי (§7.69 — רו"ח, לפני מ10)"** + **"תזכורות-אוטומטיות (מ10)"** · `P1` card (:305, "הטלפון שלה, אין תזכורות-מערכת §7.20א") · `ה20`/§7.69 (:263, travel-amount seed is a placeholder pending accountant sign-off, explicitly "לפני מ10") | Travel-amount CPA verification gate before automating · payment-reminder automation (m8 deliberately built manual-only in v1) · PDF export for reports as an upgrade candidate (see Pass 3) |
| **(c) `🚧 מ7 ← מ8`** | 🆕 **found, not on the original suspect list** | `§7.37` in `docs/PROJECT_MASTER_sec7.md:136` — status is explicitly **"פתוח — חצי-סגור (הנותר: מודול 7)"**: m8's Discovery closed the weighting-formula half (ה6) but the **KPI quarter-window** (calendar-quarter vs. rolling-90-day) is named as m7's to decide. `module_07_dashboard.md:16` already anticipates this on m7's side — but nothing on m8's side registers it, and `docs/PROJECT_MASTER.md` has zero `← מ8` lines to match | The two KPI values m8 supplies (`A10`, "רווח גולמי משוער לחודש" + "ממוצע שביעות רצון") and the open quarter-window question that m7 must resolve |
| **(d) `🚧 מ9` update** | ⚠️ **existing joint token needs a write-back, not a new line** | Same item as Pass-1 #4. The existing `🚧 מ8 · 🚧 מ9` line (§6:175-177) already gives m9 a reader — so this is **not** a missing-line gap like (a)-(c). But m8's Discovery closed *without deciding* it (B14 only flags), so the §6 line's framing — *"מי מהם שיגיע ראשון חייב להכריע"* — is now stale: m8 arrived first and punted. The line should be updated to say so explicitly, or the decision should be made now rather than carried a second time | — |

**Pass 2 tally: 3 missing `🚧 מN ← מ8` lines (m7, m10, m11) confirmed; 1 existing joint line (m9) needs a write-back update, not a new line.**

---

## PASS 3 — NEVER-NOTICED HUNT

**1. The 16-row ripples change-list** (`stage1-review/m8-review-infra-ripples.md:285-304`, the one
file `spec.md` mandates reading in full) — checked each row against `processes-approved.md`: **all
16 carry an explicit spec anchor** (ה2/ה8/ה9/ה10/ה12/ה14/ה15/ה17/ה19/ה20, P1-P4, S4, A1/A3, B4/B11,
§7.16/§7.63, F16). None are floating. Row 11 ("reverses an m2 privacy comment") and row 8 (rewires
5 m4 code sites) are real cross-module code touches into *merged* modules, but since m2/m4 are
closed-and-merged they have no future reader to warn — they are m8's own build items, correctly
scoped as such, not a debt for anyone else. ✅ No orphans found here.

**2. Step-guides / micro-guides scan** (`docs/guides/modules/*.md`, `docs/micro_guides/*.md`,
grep `מ8`): m2, m4, m6 all reciprocate cleanly — every מ8 token in those guides has a matching §6
line (confirmed independently inside `module-6.md:812-813`'s own push-side audit). **m7's step
guide (`module_07_dashboard.md:16`) is the one guide that names מ8 without a matching §6 line** —
this is the same gap as Pass-2(c), found twice by two different sweeps, which raises confidence
it's real. m9/m10/m11/m12 step guides: **zero** mentions of מ8 — confirming they carry no
independent trail back to m8's obligations; §6 is the *only* mechanism that will route them.

**3. §7.37 (m7 half) and §7.79 (m2 wiring)** — both checked directly in `PROJECT_MASTER_sec7.md`.
§7.37 is genuinely half-open (line 136, confirms Pass-2c). §7.79 is **fully closed** (🟢, line 271)
and its m2-wiring half is already captured in the existing §6 customer-card line (Pass-1 #1) — no
further action needed there.

**4. C5 §5.7.x report sections (m11 territory)** — read `C5_clean_transcript.md:741-749`
(§5.7.4, "דו"ח רווחיות פרויקטים"). Its field list — רווח גולמי (%) · סטיית תקציב (₪) · ציון משוב
לקוח — are all three m8-owned numbers, all three already formalized in m8's spec (ה17/ה18/ה8), but
**none registered as a §6 debt m11 will find**. This is the same finding as Pass-2(a), confirmed a
third way.

**5. One orphan found with no module at all:** `spec.md:77` §④ lists **"PDF-לדוח (הרחבה עתידית)"**
as deliberately open — but unlike its three siblings on the same line (each tagged מ10 or מ7), this
one carries **no module tag whatsoever**. It most likely belongs with the m10 payment-automation/
export cluster (Pass-2b), but as written today it is an unowned wish with no §6 home and no future
reader who would know to claim it.

---

## השורות המדויקות להוספה ל-§6 (מוכנות להדבקה, בסגנון הרשם הקיים)

> שלוש שורות חדשות + עדכון לשורה קיימת אחת. **לא נכתבו לרשם בפועל — ר' פתיח.**

**חדש — `🚧 מ11 ← מ8`:**

```
- 🚧 מ11 ← מ8 — **חוזה-אספקה: דוחות-רווחיות + דוח-שכר (נרשם [DATE], סגירת-Discovery-מ8).** מ8 בונה
  את שלושת המספרים שדוח-הרווחיות של מ11 צורך (C5 §5.7.4): **רווח גולמי (%)** — נגזר-חי מ-`final_profit`
  הקפוא · **סטיית-תקציב (₪)** — נוסחת-ה18 (הפרש-תעריף-קבוע × הפרש-שעות) · **ציון-משוב-לקוח** — 1–5,
  מ-`projects.feedback_score`. **אוכלוסיית-הדוח (ה8, מורחבת):** פרויקטים ב-`finished` **וגם** מבוטלים
  שדמי-הביטול שלהם נפתרו — מ11 חייב לתייג את השורות המבוטלות בנפרד, לא למזג עם `finished` רגיל.
  **מ11 קורא את `salary_reports`/`salary_report_lines` לקריאה-בלבד** (ה1) — **הרשאת-ה-RLS של תפקיד-מ11
  על `salary_reports` לא נבדקה** (`stage1-review/m8-review-infra-ripples.md` blind-spot #2) — מ11 חייב
  לוודא שיש לו policy-קריאה בשער המתאים, לא להניח שהוא יורש אחת. **מקור:** `docs/specs/module_08_finance/processes-approved.md`
  ה1·ה8·ה17·ה18·א52 · `docs/reference_spec/C5_clean_transcript.md` §5.7.4.
```

**חדש — `🚧 מ10 ← מ8`:**

```
- 🚧 מ10 ← מ8 — **שלושה שדרוגים-עתידיים שנרשמו במפורש כ"פתוח בכוונה" בסגירת-Discovery-מ8 (נרשם [DATE]):**
  ‏**(1) תזכורות-אוטומטיות לתשלום** — v1 של מ8 הוא "הטלפון שלה, אין תזכורות-מערכת" (P1, §7.20א
  במפורש); מ10 הוא היעד הטבעי כשזה יידרש. ‏**(2) סכום-הנסיעות הסופי (§7.69) 🟠 טרם-סגור** — נזרע
  `22.60` כערך-דמו (ה20), אך **אימות מול רו"ח נדרש לפני שמ10 מפעיל שליחה-אוטומטית** שמסתמכת על הסכום
  הזה כעובדה חתומה. ‏**(3) ✚ מועמד: ייצוא-PDF לדוח-השכר** — מ8 בחר `Excel (.xlsx) בלבד` ל-v1 (ה4),
  "הרחבה עתידית אם רו"ח יבקש" — לא הוכרע איזה מודול בונה זאת; מ10 (תשתית-שליחה/ייצוא) הוא הסביר ביותר,
  אך זה טעון-הכרעה, לא נתון. **מקור:** `docs/specs/module_08_finance/spec.md` §④ · P1 · ה4 · §7.69.
```

**חדש — `🚧 מ7 ← מ8`:**

```
- 🚧 מ7 ← מ8 — **חלון-הרבעון של KPI-שביעות-הרצון (§7.37, נשאר חצי-פתוח אחרי סגירת-Discovery-מ8,
  נרשם [DATE]).** מ8 סגר את חצי-השקלול (ה6: אין נוסחת-שקלול — הסקר חיצוני, ציון-אחד נכנס למסד) אך
  **חלון-החישוב עצמו — רבעון קלנדרי מול 90-יום נגלל — לא הוכרע, ומוגדר במפורש כשל-מ7.**
  ‏**שני המספרים שמ8 מספק ל-דשבורד:** "רווח גולמי משוער לחודש" (רווח-צפוי, ה27) ·
  "ממוצע שביעות רצון" (מ-`feedback_score`, מסונן `feedback_status='completed'` — כמו ה8). **מ7 כבר
  מודע לחצי הפתוח בעצמו** (`docs/guides/modules/module_07_dashboard.md:16`) — השורה הזו רק סוגרת
  את הצד השני, כדי ש-`grep '🚧 מ7'` ימצא אותו. **מקור:** `docs/PROJECT_MASTER_sec7.md` §7.37 ·
  `docs/specs/module_08_finance/processes-approved.md` ה6·ה27·A10.
```

**עדכון לשורה הקיימת — `🚧 מ8 · 🚧 מ9`** (§6:175-177, `closing_unit_cost` RLS):

```
↳ [DATE] עדכון-סגירת-Discovery-מ8: מ8 **לא הכריע.** processes-approved.md B14 מסמן את הפער כ"אזהרת-
עקביות" בלבד, בלי החלטה ובלי מיגרציה — הטוקן הכפול נשאר חי במלואו, וההכרעה ("פיצול-טבלה כמו
product_costs, או ויתור מנומק") ממתינה למ9 או לסבב-ריצה נפרד של מ8 עצמו.
```

---

## פריטי-בנייה שחייבים בית ב-spec (לא חוב חוצה-מודולים — עבודה בתוך מ8 עצמו שטרם מוקמה)

- **RC-6 (item #7 above) — עמודת-"סכום" בכרטיס-הלקוח (`src/lib/customerProjects.js:143-146`,
  `projectAmount`).** יש הכרעה (ה2) אך אין מיפוי-קובץ ואין גודל-משוער, בניגוד לתאום שקיבל הפריט
  התאום (A1/A3, ראה R4-F8). מומלץ: להוסיף שורת-`stage1-review` נוספת (בסגנון F1–F16) שממפה את
  הקובץ, שער-ההרשאה (חשיפה לכספים וללקוח) וגודל-העבודה — לפני שהבלופרינט מתחיל.
- **`quote_services.closing_unit_cost` RLS (item #4 above).** דורש הכרעה בפועל, לא רק אזהרה —
  אם מ8 בוחר "לא עכשיו", זו הכרעה לגיטימית (F1-חוסר-שגיאה, כי היום התפקיד היחיד עם `view` על
  הצעות גם מחזיק `edit` על כספים) — אבל היא צריכה להיכתב ככזו, עם טריגר-לפתיחה-מחדש מפורש, לא
  להישאר כאזהרה תלויה-באוויר.
