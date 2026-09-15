<div dir="rtl">

# דוחות-הכותבים של שלב 8 (מ5 · מ1 · מ9 · מרשם-הפרמטרים) — מילה-במילה, להעברת-המקל S3 → S4

> **מה הקובץ הזה:** ארבעת דוחות-הכותבים של שלב 8 של לילה-הטקסטים, כפי שהגיעו לסשן 3 — **מילה-במילה** (תנאי S1·S2, 09/09/2026 04:2X). סשן 3 מסר את המקל באמצע השלב (הקשר 800K לפי מדידת-ישי); **המיזוג לא התחיל.** **הקורא:** S4, שממזג לפי המסירה §4. ~~נמחק אחרי קומיט שלב 8~~ **נשאר בריפו — הכרעת-ישי 09/09/2026 05:2X (*"מה למה שתמחק קובץ דוחות?"*):** זה הרשם המילה-במילה היחיד של ארבעת הכותבים; שורות ה-`↳ as-built` במדריכי 1/5/9 והרשמים C-31…C-34 · S-20 הם תקציר שמצביע לכאן. **המיזוג בוצע 09/09/2026 05:3X (S4).**
> **נוצר:** 09/09/2026 04:2X. **הבריפים:** `stage8-shared.md` + `w12a–d.md` בסקראצ'פד של S3 (מתים איתו — תמציתם במסירה §4 של שלב 7 בהיסטוריה).

## 0 · רשימת הקבצים שנשארו על העץ לא-מקומטים (`git status --short` ברגע ההעברה)

**17 קבצים** (`src/`/`e2e/` בלבד; כל קובץ-תיעוד אחר ב-`git status` הוא של S4 עצמו):

- `src/lib/paramsRegistry.js`
- `src/modules/01_auth/LoginPage.jsx`
- `src/modules/01_auth/PermissionsMatrixPage.jsx`
- `src/modules/01_auth/PriceTiersDialog.jsx`
- `src/modules/01_auth/PricesManagementPage.jsx`
- `src/modules/01_auth/ProductFormDialog.jsx`
- `src/modules/01_auth/UsersManagementPage.jsx`
- `src/modules/01_auth/UsersManagementPage.test.jsx`
- `src/modules/01_auth/pricesApi.js`
- `src/modules/05_logistics/ChecklistDialog.jsx`
- `src/modules/05_logistics/ChecklistDialog.test.jsx`
- `src/modules/05_logistics/LogisticsPage.jsx`
- `src/modules/05_logistics/LogisticsPage.test.jsx`
- `src/modules/09_settings/MySettingsPage.jsx`
- `src/modules/09_settings/ParamsTab.jsx`
- `src/modules/09_settings/components/ParamRow.jsx`
- `src/modules/09_settings/components/ParamRow.test.jsx`

🔴 **לפני כל שער — הכרעת S4 על כפתור-הכניסה:** W12b שינה `התחברות` ⇒ `התחברי` (ו-Google) ב-`LoginPage.jsx`; **24 קובצי-E2E** + `smoke.spec.js` + ספקי-הראיות מאתרים `getByRole('button', { name: 'התחברות', exact: true })`. המלצת S3: להחזיר את שני הכפתורים ל-`התחברות`/`התחברות עם Google` ולרשום שאלת-מדריך שישית לשלב 9 (כפתור-הכניסה = חוזה-הכניסה של כל הבדיקות, שם-פעולה כמו `סגירה`).


## W12c — module 9: settings screens + components + api + lib/listWindow (report verbatim)

**1. Mine check**
- E2E-pinned strings in my files: `ההגדרות נשמרו` · `שינית N מתוך M` pattern · `השמירה נכשלה ב"<label>" — <reason>` · `ערך חוקי: מספר בין 0 ל-100…` / `ערך חוקי: מספר שלם חיובי` (owned by `paramsRegistry.js`, not mine, verified untouched) · `(בקרוב)` and `אין ערוץ SMS במערכת` (not present in these 11 files at all — no hits) · `settings-value-<name>` / `settings-template-chip-<token>` test-ids — all unchanged. `title=` E2E triad (`צפייה ועריכה`/`צפייה בלבד`/`אין גישה`) and `כתובת דוא״ל` — not present in these files.
- `grep -n 'מנכ' <my files>` → **9 hits, all inside code comments** (never in rendered strings) — changed 0.
- `grep "raise exception" supabase/migrations/*.sql` → 284 total repo-wide; none of those exception strings are byte-copied into any of my 11 files — raise-coupled count for module 9 = **0**.

**2. Changed strings**

| file | before | after | rule(s) | fell where |
|---|---|---|---|---|
| `ParamsTab.jsx` / `MySettingsPage.jsx` (search placeholder) | `חיפוש לפי שם ההגדרה או שם הפרמטר במערכת` | `חיפוש לפי שם ההגדרה או שם הפרמטר` | R9 (cut filler — "במערכת" adds nothing, every param is by definition in the system) | base |
| `ParamsTab.jsx` `GROUP_LEADS.pricing_timing` | `הערכים שמנוע התמחור וההצעות קורא. שינוי משפיע על הצעות חדשות בלבד — הצעה שכבר אושרה שומרת את הערכים שהוקפאו בה.` | `שינוי כאן משפיע על הצעות חדשות בלבד — הצעה שכבר אושרה שומרת את הערכים שהוקפאו בה.` | R10/B8 (first sentence names an internal engine — "מנוע התמחור" — dev architecture, not a term a user needs) · R13 clarification (two literal sentences → one) · H1 (term-definition belongs to the layer) · R26 (the consequence sentence is essential — stays) | first sentence → candidate (H-layer, type ③ term); second sentence → base |
| `ParamRow.jsx` | `<p>{entry.hint}</p>` followed by `{isUnknown && <p>שורה זו אינה מוכרת למרשם התצוגה.</p>}` | the second `<p>` removed entirely | R27 (repeats what `entry.hint` — "הגדרה ללא הגדרת-תצוגה" — already says one line above) · R10 (the removed line also exposed "מרשם" — internal-registry jargon) | gone |

**3. Kept strings ("stands")** — checked, left as-is (all locked by test/E2E, or already compliant and not worth touching):
`ההגדרות שלי` (h1 — matches Topbar nav item verbatim, R11) · `לא ניתן לטעון את ההגדרות.` (both screens, test-pinned) · `אין הגדרות בבעלות התפקיד שלך` (test+E2E-adjacent) · `אין הגדרות שתואמות לחיפוש` (both screens, R30-consistent) · subtitle `X הגדרות בבעלותך, ב-Y קבוצות.` · `יש שדה עם ערך לא תקין` / `…בקבוצה הזו` (both blockedReason fallbacks) · `צפייה בלבד` (test-pinned, ×2 places) · `שלוש המשקולות חייבות להסתכם ל-1.00` / `WEIGHTS_SUM_ERROR` / `DISTANCE_ORDER_ERROR` / `CANCELLATION_ORDER_ERROR` / `EXPIRY_WARNING_ORDER_ERROR` (§3.7-ruled) · `שינוי כאן משנה שיבוצים אמיתיים…` (CEO_WARNING, test-pinned) · `שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ.` (OWNER_WARNING, test-pinned) · attendance-note singular/plural (test-pinned exact) · "בפועל כרגע: היענות X% · קרבה Y% — …" · GROUP_LEADS.smart_match · all of `TemplateEditor.jsx`'s blocked/warning/legend text (test-pinned or already tight) · `משתנה` terminology (locked, per known items) · `(בקרוב)` / `אין ערוץ SMS במערכת` — not present in these 11 files · all of `BelowMinWageList.jsx` (every visible string test-pinned) · `SaveRow.jsx` (`שינית N מתוך M`, `שומרת…`, `נסי שוב`, `שמרי שינויים`, `ביטול` — all test-pinned or open guide-level questions per brief) · `GroupList.jsx` (aria-label, no visible strings) · `api.js` (`saveOnboardingMode`/`listOnboardingModes` messages — known-item keep; generic `שגיאה בטעינת X.` pattern — repo-wide convention, 75 hits outside module 9, R30 forbids a lone-module deviation) · `src/lib/listWindow.js` `WINDOW_OPTIONS` labels (`החודש`/`3 חודשים`/`השנה`/`הכול`) — already 1–2 words, R1-compliant, shared across many modules.
Gender/address: already feminine throughout (stage 2 already ran on these files — `שמרי שינויים`, `נסי שוב`, `שתראי`, etc.) — verified with a masculine-imperative grep, zero real hits (all matches were comments or substrings inside longer words).

**4. Tests**
- Edited `src/modules/09_settings/components/ParamRow.test.jsx`: removed the assertion on the deleted redundant line, added a comment explaining why.
- No hits outside my file set for any string I changed (verified via `grep` in `src/` and `e2e/` before editing).
- `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vitest run <my 11 test files>` → **11 test files passed (11), 144 tests passed (144)**, exit 0. Also ran `npx eslint` on the 4 touched files — clean.

**5. Candidates / Structural findings**
- **Candidate** (screen: `ParamsTab.jsx`, group "תמחור ותזמון" lead) — old sentence: `הערכים שמנוע התמחור וההצעות קורא` — why it left: names an internal engine, defines what the group *is* rather than telling the user anything actionable — statement type **③ (term)**. Proposed layer text (not written to `onboardingCopy.js`, per rule): *"הקבוצה הזו מזינה את מנוע-התמחור וההצעות — כל מה שכתוב כאן נכנס לחישוב שהמערכת עושה כשבונים הצעת מחיר."*
- **Structural finding**: none new beyond what's already tracked (F-8 templates-without-contract, F-1 min-wage RPC blocking, V-9/R-2/R-3 already fixed in earlier audits — all still correctly implemented, verified by reading the code, not just trusting the mines file).

**6. Seen, not touched / Doubts**
- The `pricing_timing` GROUP_LEAD I split was **drawn verbatim in the approved mockup** (`docs/mockups/settings-screen/02_params_tab_roles_and_states.html:293`), and a code comment explicitly warned against inventing wording for the other four groups. Per the doc hierarchy, mockups are §4 (visual reference only, "part of it is wrong"), below the full-reset mandate — but flagging this explicitly since it's a deliberate deviation from a specifically-drawn sentence, not an untouched blank.
- `api.js`'s generic `שגיאה בטעינת X.` pattern (7 occurrences in this file) is visibly less "how do I fix this" than R17 asks for — but it's a 75-hit, repo-wide SSOT convention; changing it only here would violate R30 (same component/pattern, same wording everywhere). This is a whole-app candidate, not a module-9 one — flagging it rather than acting unilaterally.
- Five guide-level open questions (inline `label: value` colons, noun-form dialog-opener buttons, `— חובה` marks, multi-sentence toasts, `ביטול` as secondary label) all appear in these files and were left exactly as the brief instructed (not mine to decide): the `SaveRow.jsx` `ביטול` button, and the two `blockedReason` fallback sentences (single-sentence, no colon-chip pattern present here).
- No contradictions found between the style guide, the shared brief, and what's actually in these 11 files — the module was already carried through several close-audit passes (F-1…F-9, R-2, R-3, V-4, V-7, V-9, UX-1…6) before this stage, which is why the yield of a "full reset" here is small: most strings already met the bar this pass is enforcing.

**Files touched:** `src/modules/09_settings/ParamsTab.jsx` · `src/modules/09_settings/MySettingsPage.jsx` · `src/modules/09_settings/components/ParamRow.jsx` · `src/modules/09_settings/components/ParamRow.test.jsx`. No other file in the set required a code change.

**Agent usage:** 334K tokens · 57 tool uses · ~10.5 min.

## W12d — module 9 · `src/lib/paramsRegistry.js` (report verbatim)

### 1. Mine check
- **`name:` entries:** 43 (test-locked: `PARAM_REGISTRY).toHaveLength(43)`). Changed: **0**. The task title's "44" resolves to 43 real entries + the 1 fallback pair in `getParamEntry`'s catch-all (`label: name`, `hint: 'הגדרה ללא הגדרת-תצוגה'`) = 44 label/hint pairs total — confirmed by counting `label:`/`hint:` occurrences (44 each) vs `name:` (43).
- **Raise-coupled strings:** grepped `raise exception` across `supabase/migrations/*.sql` (284 total) and cross-checked against param-related ones — none of the 44 hint/label strings are byte-copies. **Count: 0.**
- **`grep -n 'מנכ'`** → 0 hits. **Changed: 0.**
- **E2E-pinned strings in my files:** grepped every label/hint string (old and new) against `e2e/settings.spec.js` and `e2e/prices.spec.js` — zero matches. The only pinned strings that touch this file's *logic* are `settings-value-<name>`/`data-param="<name>"` (built from `name`, untouched) and the two generated validation messages `'ערך חוקי: מספר בין 0 ל-100, עד שתי ספרות אחרי הנקודה'` (settings.spec.js:168) and `'ערך חוקי: מספר שלם חיובי'` (prices.spec.js:240) — from `KIND_RULES`/`rangePhrase`/`numericMessage`/`BLANK_NUMERIC_ERROR`, left **completely untouched**.

### 2. Changed strings (file: `src/lib/paramsRegistry.js` for all)

| param (`name`) | field | before | after | rule(s) | destination |
|---|---|---|---|---|---|
| `יחס_אורחים_לדיילת` | hint | `כמה אורחים לכל דיילת אחת — משמש להמלצת המערכת על כמות הדיילות הנדרשת` | `כמה אורחים לכל דיילת אחת — קובע את כמות הדיילות המומלצת לאירוע` | R7, R9 | base |
| `שכר_מינימום_שעתי` | label | `שכר מינימום שעתי` | `שכר מינימום שעתי לדיילת` | B14 | base |
| `שכר_מינימום_שעתי` | hint | `התעריף המינימלי לשעת-עבודה של דיילת — משמש לבדיקת תעריפים ולרשימת דיילות מתחת לרף` | `התעריף המינימלי לשעת-עבודה של דיילת — דיילת מתחתיו מוצגת ברשימת דיילות מתחת לרף` | R9, B13-style | base |
| `שכר_מינימום_שעתי` | affects | `...ואת בדיקת התעריפים במודול הדיילות` | `...ואת בדיקת התעריפים במסך הדיילות` | glossary 3ג | base |
| `אחוז_פיצוי_ביטול_חלקי` | hint | `אחוז מהתשלום לדיילת המשולם כפיצוי בביטול פרויקט בטווח-הביניים` | `אחוז מהתשלום לדיילת שמשולם לה כפיצוי כשהביטול חלקי, לא מלא` | R10, R11 | base |
| `שעות_פיצוי_ביטול_חלקי` | hint | `מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי חלקי` | `כמה שעות לפני האירוע שמתחתיהן ביטול מזכה בפיצוי חלקי` | R30 | base |
| `שעות_פיצוי_ביטול_מלא` | hint | `מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי מלא` | `כמה שעות לפני האירוע שמתחתיהן ביטול מזכה בפיצוי מלא` | R30 | base |
| `שעות_תזכורת_לדיילת` | hint | `כמה שעות לפני המשמרת תישלח לדיילת תזכורת אוטומטית (השליחה האוטומטית טרם נבנתה — הערך נשמר ומחכה לה)` | `כמה שעות לפני המשמרת נשלחת לדיילת תזכורת אוטומטית — השליחה עדיין לא הופעלה, הערך רק נשמר לקראתה` | house-style (parens→dash); honesty caveat kept (R26) | base |
| `סף_שביעות_רצון` | hint | `...ובירור טלפוני; לקוח שממוצע-המשוב שלו נמוך מהסף מסומן "טעון בירור"` | `...ובירור טלפוני — לקוח שהממוצע שלו נמוך ממנו מסומן "טעון בירור"` | R13 | base |
| `סף_שביעות_רצון` | affects | `מעלה את הרף שבו נדרשת סיבה למשוב — מסך הכספים ידרוש אותה` | `משנה את הרף שממנו נדרשת סיבה למשוב — מסך הכספים ידרוש אותה` | R30 + precision | base |
| `שעות_סף_זימון_לפני_אירוע` | hint | `מספר השעות לפני האירוע שמתחתיו זימון-משמרת נחשב "ליום האחרון"` | `כמה שעות לפני האירוע זימון-משמרת נחשב "ליום האחרון"` | R30 | base |
| `שעות_תוקף_זימון` | affects | `...משפיע גם על מסך הצוות בפרויקט (מודול 6)` | `...משפיע גם על מסך הצוות בפרויקט` | glossary 3ג | base |
| `שעות_אירוע_דחוף` | hint | `מספר השעות עד האירוע שמתחתיו הוא מסומן "דחוף" במבט-העל ובמיון` | `כמה שעות לפני האירוע הוא נחשב "דחוף" במבט-העל ובמיון` | R30 | base |
| `תבנית_תזכורת_משמרת` | hint | `המייל האוטומטי שיוצא לדיילת לפני המשמרת (טריגר: שעות_תזכורת_לדיילת)` | `המייל שיישלח לדיילת לפני המשמרת, כשהתזכורת האוטומטית תופעל` | R10/B8 | base |
| `חלון_חישוב_חודשים` | hint | `...לחישוב ציוני היענות ואמינות (החישוב טרם משתמש בערך הזה)` | `...לחישוב ציוני היענות ואמינות — הערך נשמר, החישוב טרם משתמש בו` | house-style | base |
| `חלון_חישוב_מורחב_חודשים` | hint | `...בחלון הרגיל (טרם בשימוש)` | `...בחלון הרגיל — הערך נשמר, טרם בשימוש` | house-style | base |
| `תקרת_שבועות_הוגנות` | hint | `מספר השבועות המרבי שנספר לבונוס ההוגנות` | `כמה שבועות לכל היותר נספרים לבונוס ההוגנות` | R30 | base |

**17 field-level edits across 14 distinct params.** Every old string was grepped against `src/` and `e2e/` first — **zero external hits**.

### 3. Kept strings ("stands")
All remaining entries' `label`/`hint` not listed above — stands (incl. all 11 `תבנית_*`, the three weights, `שער_מרחק_קמ`, `גולפוסט_מרחק_קמ`, `קבוע_ריסון_m`, `מינימום_תשובות_להצגת_ציון`, `שיעור_בונוס_הוגנות_לשבוע`, `לא_ענתה_ל_N`, `מרכיב_אמינות_פעיל`, `מייל_משרד_רואי_חשבון`). Also stands: the 6 `GROUP_LABELS`, the 6 `affects` entries not listed (the three weight/boolean ones deliberately keep their future-tense "תראה מחר" phrasing — R8 exception, matches `SmartMatchPane.jsx:55`), and every string in `KIND_RULES`/`rangePhrase`/`decimalsPhrase`/`numericMessage`/`BLANK_NUMERIC_ERROR` (E2E-pinned).

### 4. Tests
- **Edited:** none. **Hits outside my set:** none.
- `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vitest run src/lib/paramsRegistry.test.js` — **1 file, 114 tests passed**, 4.40s.

### 5. Candidates / Structural findings
- **Candidate** — `קבוע_ריסון_m` hint's clause "מונע קפיצה מדירוג אחד או שניים" is design-rationale (⑤); left on the base (R26, one sentence-unit) — recorded per "ספק ⇒ רשום".
- **Structural finding** — `ParamRow.jsx:86` detects an unmapped param by **exact string-equality on the hint text** (`entry.hint === 'הגדרה ללא הגדרת-תצוגה'`) instead of a flag; rewording that fallback hint would silently break the "never hidden" safety net. Proposed fix: `unknown: true` on the fallback object + check the flag in `ParamRow.jsx`.

### 6. Seen, not touched / Doubts
- `תנאי תשלום` label — borderline B14, pinned by two tests outside my set (`useParamsForm.test.js:303`, `MySettingsPage.test.jsx:181`); left. If ruled: `תנאי תשלום ללקוח`.
- `סף שביעות רצון`, `טווח חישוב`, `טווח חישוב מורחב` labels — borderline B14, no external test dependency; left as judgment-call.
- `פיצוי` labels — deliberate non-change: `פיצוי` is domain-locked to hostess compensation (glossary 3ב).
- Guide §4 example-3 mine (a hint quoting another param's value as a constant): **0 instances**; the raw param NAME leak in `תבנית_תזכורת_משמרת` was fixed above.
- "44 hints + labels" in the task title = 43 entries + 1 fallback pair.

**Files touched:** `src/lib/paramsRegistry.js` only. **Agent usage:** 274K tokens · 46 tool uses · ~15 min.

## W12a — module 5 (logistics): LogisticsPage · ChecklistDialog · SegmentedControl · api.js · lib/projectLogistics (report verbatim)

### 1. Mine check
- **`grep -n 'מנכ'` across all 5 files: 0 hits.** Changed 0.
- **Raise-coupled sentences (byte-copies of migration `raise exception`) — measured in my files:**
  - `ChecklistDialog.jsx`: `CLOSED_EVENT_SENTENCE` = `'האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.'` — matches migration line 105 exactly. **Changed 0.**
  - `ChecklistDialog.jsx`: `CANCELLED_CONTROL_TITLE` = `'הפרויקט בוטל — לא ניתן לעדכן'` — matches migration line 101 exactly. **Changed 0.**
  - `lib/projectLogistics.js`: `NEGATIVE_QTY_SENTENCE` = `'כמות בפועל אינה יכולה להיות שלילית.'` — matches migration line 133 exactly. **Changed 0.**
  - `api.js`: `` `שדה לא מוכר בבקשה (${key}) — העדכון לא בוצע.` `` — matches migration line 75 pattern exactly. **Changed 0.**
  - The brief's 5th item, `'לא נשלח אף שינוי לשמירה.'`, **does not exist as an editable string in `api.js`** — it appears only inside a Hebrew *comment* (line 75) quoting the migration's `raise` text; the actual message is relayed live via `error.message` passthrough in `ChecklistDialog`'s `failureMessage()`. Verified with grep — flagged under §6.
  - `grep -c "raise exception" supabase/migrations/20260826002447_module5_checklist_rpc.sql` → **16** total raises in the module-5 RPC (only the 4 above are byte-copied into JS).
- **E2E-pinned strings — grepped `e2e/logistics.spec.js` and `e2e/smoke-anchors.json` directly:** the spec locally re-declares **17** constants copied byte-for-byte from my 5 files. **16 unchanged**, **1 broken by a bug fix, reported below**:
  - Unchanged, byte-identical: `QUEUE_NO_PERMISSION_SENTENCE`, `WRITE_FAILURE_SENTENCE`, `QUEUE_SORT_LINE`, `DISABLED_PILL_TITLE`, `FILTERED_EMPTY_TITLE`, `OUTBOUND_HEADING`, `CANCELLED_CONTROL_TITLE`, `QTY_LOCKED_BY_ITEM`, `CANCEL_BANNER_LINE`, `CANCEL_BANNER_QTY_LINE`, `SHORTFALL_LEAD`, `SHORTFALL_EMPHASIS`, `PILLS` (3 labels), plus the 5 pins the brief named (`עדכון מצב` · `הפרויקט עבר ל` · `בתהליך` · `בוטל` · `בוטלו`).
  - **Broken by my bug fix (§2 row 2): `e2e/logistics.spec.js:61`** — `const CANCELLED_QTY_TITLE = 'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)'` must become `'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה'` (drop the trailing `(㊴)`). Used at `e2e/logistics.spec.js:660`. **I did not edit `e2e/` — for the orchestrator.**

### 2. Changed strings

| File | Before | After | Rule(s) | Where it fell |
|---|---|---|---|---|
| `LogisticsPage.jsx`, `AmberLegend` | `⏱ שורה בענבר — פריט פיזי טרם הוזמן, והאירוע בתוך {N} ימי עסקים — או: משלוח שתאריכו המובטח עבר וטרם הגיע. סימון מיידע בלבד: אפשר להתעלם ממנו, ואף פקד אינו ננעל. הקמת אתר רישום (01WEB) אינה נספרת — הסף נגזר מזמן ייצור של דפוס.` (254 chars) | `⏱ שורה בענבר = דורש תשומת-לב. שום דבר לא ננעל.` | The pre-settled example from `ui-copy-and-onboarding-mode.md` §4 "שלב 8" — applied verbatim. R9/R13/R27 · H2 (nothing essential lost — the two amber triggers are still individually explained: the physical-item trigger via the per-row icon `title` (`amberGlyphTitle`, untouched), the late-arrival trigger via the row's reason-line (`lateArrivalReason`, untouched)) | Base short; full two-trigger explanation + the `{N} ימי עסקים` reasoning + the 01WEB exclusion ⇒ **candidate** (§5) |
| `ChecklistDialog.jsx`, `CANCELLED_QTY_TITLE` | `'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)'` | `'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה'` | **Bug fix** — an internal decision-marker glyph (`㊴`) leaked inside the string literal and rendered as a browser `title` tooltip. R10 | Removed — pure defect |
| `ChecklistDialog.jsx`, `SHORTFALL` fragments + `CompletionBanner` | 8 disjoint string constants assembled through 3 nested JSX ternaries | Same visible text, restructured into `shortfallClause(completion)` (one function, one singular/plural switch) + `SHORTFALL_LEAD`/`SHORTFALL_EMPHASIS`, composed once | Known item "rewrite in place, run UC37 with n=1". Content is Ishay's approved decision O-5 — **not reworded**; only the code shape changed. Verified byte-identical output against all 4 existing `checklist-shortfall` assertions (incl. n=1 at `ChecklistDialog.test.jsx:640`) | Not a copy change — code-structure only |

No other strings in these 5 files were changed.

### 3. Kept strings ("stands")
- `PILLS` labels (`דורש טיפול`/`ממתין למשלוח`/`הכול`) — approved-spec copy (`screens-approved.md §⑥`).
- `DISABLED_PILL_TITLE` (`'אין כרגע פרויקט במצב הזה'`) — deliberately diverges from `ProjectsPage.jsx`'s `'אין כרגע פרויקט בסטטוס הזה'`; the spec itself documents why (`§⑦`: *"ובמודול 5 הגלולות אינן סטטוסים"*) and leaves it open (§⑧-13, still ⬜). Not mine to resolve.
- `FILTERED_EMPTY_TITLE`, `CLEAR_FILTER_LABEL` — byte-identical to `ProjectsPage.jsx` (R30).
- `CHECKLIST_LINK_LABEL` (`"לצ'קליסט →"`) — noun-form navigation link, per the open question.
- `OUTBOUND_LEGEND`, the outbound window paragraph — pre-approved (`§⑧-3`).
- `NOTE_PLACEHOLDER`, `EXPLAINER_SAVE`, `AUTOFILL_TAG` — approved verbatim (`§⑧-5`).
- `CancelBanner` full text, `STAFFING_HOLD_SENTENCE` — approved verbatim (O-4 applied).
- `ChecklistFooter` button `"סגירה"` (noun-form) — R30 with `ClosingWindowDialog.jsx`'s dismiss button ×2: dialog-chrome close buttons stay noun-form.
- `QTY_LOCKED_BY_ITEM` — content fine; minor punctuation/quote-style mismatch vs its raise sibling noted in §6, not changed.
- `checklist-locked-note` — considered for R27 removal, kept: answers a distinct "is this a bug?" anxiety the banner does not cover; one sentence.
- Inline `label: value` chips (`מצב הפרויקט:`, `מוכנות לוגיסטית:`) — colon kept (open question).
- DB-derived / locked: `LOGISTICS_STATUS_LABELS`, `מוכנות` header, `SORT_LINE`/`QUEUE_SORT_LINE` — untouched.

### 4. Tests
- **Edited (inside my set):** `ChecklistDialog.test.jsx:737` (drop `(㊴)`) · `LogisticsPage.test.jsx:536–582` — the "amber legend" block: one test asserts the new short base text; the two params-mutation tests (5↔12) kept, trimmed to the per-row icon `title` channel (the legend no longer carries a number; the "live params change is reflected on screen" property is still covered via the icon tooltip).
- **Hits outside my set (for the orchestrator):** `e2e/logistics.spec.js:61` — `CANCELLED_QTY_TITLE` constant needs `(㊴)` dropped; used at `:660`.
- **vitest (CI-parity), verbatim:** `Test Files 5 passed (5) · Tests 175 passed (175)` (04:34:11, 14.25s). eslint on the 4 touched files: 0 findings; no unused-import fallout from removing the `amberDays` prop off `AmberLegend`.

### 5. Candidates / Structural findings
**Candidate:** `LogisticsPage.jsx` `AmberLegend` — the removed 254-char text (two amber triggers · the N-business-days threshold · the 01WEB print-lead-time exclusion) ⇒ `amberLegend.why`. Types ③ + ⑤. 🔴 The `{N} ימי עסקים` threshold is a live `params` value — when written to `onboardingCopy.js` it must be interpolated, never hard-coded (as `amberGlyphTitle` already does).
**Structural findings:** none new (the open `DISABLED_PILL_TITLE` wording question is tracked in `screens-approved.md §⑧`).

### 6. Seen, not touched / Doubts
- `LEGAL_EMPTY_DETAIL` and `LOAD_FAILURE_DETAIL` (`lib/projectLogistics.js`) — not test-locked per `§⑨`, but also imported and rendered by `src/modules/06_projects/LogisticsTab.jsx` (outside my set) — left unchanged; flagging for the orchestrator.
- `QTY_LOCKED_BY_ITEM` — punctuation/quote-style mismatch vs its raise sibling (no trailing period, `"…"` vs `'…'` around `הוזמן`) — not fixed.
- The brief's "5 raise-coupled" list is one item short of what is literally editable (`'לא נשלח אף שינוי לשמירה.'` is a comment only).
- The brief's E2E-pins list (5) undercounts: 17 constants are re-declared in `e2e/logistics.spec.js`; only one needed a reported line.
- `DISABLED_PILL_TITLE` — a live open spec question (`§⑧-13`), left as-is.

**Files touched:** `src/modules/05_logistics/LogisticsPage.jsx` · `ChecklistDialog.jsx` · `LogisticsPage.test.jsx` · `ChecklistDialog.test.jsx`. **Agent usage:** 362K tokens · 75 tool uses · ~18 min.

## W12b — מודול 1 (כניסה · משתמשים · הרשאות · מחירים) — full reset (report verbatim)

> 🔴 **הערת-הממזג (S3, לפני ההעברה):** הכותב שינה את כפתור-הכניסה `התחברות` ⇒ `התחברי` ו-`התחברות עם Google` ⇒ `התחברי עם Google`, ודיווח "0 פגיעות E2E". **זה שגוי:** `getByRole('button', { name: 'התחברות', exact: true })` הוא פונקציית-ה-`login()` של **כל** קובצי ה-E2E, של `smoke.spec.js`, ושל ספקי-הראיות. **S4 מכריע לפני השערים:** (א) להחזיר את שני הכפתורים ל-`התחברות`/`התחברות עם Google` ולרשום שאלת-מדריך שישית לשלב 9 (כפתור-הכניסה כחוזה-כניסה של כל הבדיקות; שם-פעולה כמו `סגירה`) — **המלצת S3**, זול ובטוח · או (ב) לעדכן ~25 קובצי-spec + `smoke.spec.js` + ספקי-הראיות באותו קומיט. גם `דוא"ל` ⇒ `דוא״ל` (U+05F4) ב-`UsersManagementPage` — לבדוק מול `e2e/` לפני השערים.

### 1. בדיקת-מוקשים
- **חוזה E2E:** נבדק מול `e2e/` לכל מחרוזת ששיניתי — **0 פגיעות** *(ר' הערת-הממזג למעלה — לא נכון לכפתור-הכניסה)*. `title="צפייה ועריכה"/"צפייה בלבד"/"אין גישה"` (PermissionsMatrixPage), `placeholder="כתובת דוא״ל"` עם U+05F4, ה-h1 `כניסה למערכת` וה-h2 `מטריצת הרשאות` — **כולם נשארו בייט-בבייט**. `e2e/auth.spec.js:33` משתמש ברג'קס חלקי (`/מייל או סיסמה שגויים|החשבון ננעל/`) שממשיך לתפוס אחרי המיזוג-למשפט-אחד.
- **raise-coupled:** **0 פגיעות** במודול 1.
- **`grep 'מנכ'`:** 18 מופעים; רובם הערות-קוד. **2 בתוך מחרוזת-משתמשת** (`LoginPage.jsx:96,103`) — הערך `מנכ"ל` **שונה 0 פעמים**; רק המשפט סביבו אוחד למשפט-אחד (אין מסלול-עקיפה למסך-כניסה — כאן באמת צריך לפנות למנכ"ל).

### 2. טבלת שינויים
**LoginPage.jsx** — תשעה משפטים דו-משפטיים אוחדו למשפט אחד עם קו-מפריד (R13): נעילה זמנית · נעילה אחרי 5 ניסיונות (`— נסי שוב בעוד כ-15 דקות.`) · `מייל או סיסמה שגויים — נסי שוב.` · תקלה זמנית · `חשבון זה אינו מורשה במערכת — יש לפנות למנכ"ל.` · `…אינו פעיל במערכת — יש לפנות למנכ"ל לבירור.` · Google נכשל · `לא הצלחנו לשלוח מייל איפוס — בדקי את הכתובת.` (R7 הודאה) · `נשלח אליך מייל לאיפוס הסיסמה — בדקי את תיבת הדוא״ל.` · **כפתור `התחברות` ⇒ `התחברי`** · **`התחברות עם Google` ⇒ `התחברי עם Google`** (R12/B2 — ר' הערת-הממזג).
**UsersManagementPage.jsx** — `שמירת מצב ההטמעה נכשלה.` ⇒ `… — נסי שוב.` (R13/R17) · `שמירת השינויים נכשלה — נסי שוב.` · `שמירה נכשלה — נסי שוב.` · `דוא"ל` ⇒ `דוא״ל` (U+05F4, R11 — label · th · שתי שגיאות) · תיאור-דיאלוג-עריכה `עדכון שם, טלפון ותפקיד — לשינוי כתובת דוא״ל יש ליצור משתמש חדש` (בלי נקודה, R3) · `לא ניתן לשנות תפקיד לחשבון שלך` (בלי נקודה) · placeholder `שם פרטי ומשפחה` ⇒ `לדוגמה: דנה כהן` (R5, S-05) · `השבתת/הפעלת המשתמש נכשלה — נסי שוב.`
**PermissionsMatrixPage.jsx** — `השינוי לא נשמר — נסי שוב.` (R13).
**PricesManagementPage.jsx** — `שינוי הסטטוס לא נשמר — נסי שוב.` (R13/R17).
**ProductFormDialog.jsx** — `שדה חובה` ⇒ `יש להזין מק"ט` / `יש להזין שם פריט` (R19) · `…כבר קיים בקטלוג — בחרי מק"ט אחר.` · `שמירה נכשלה — נסי שוב.` · תיאורי-הדיאלוג בלי נקודת-סיום (§1) · `(רשות)` ⇒ `(לא חובה)` ×2 (R6).
**PriceTiersDialog.jsx** — ההסבר הארוך של כלל-המדרגה ⇒ בסיס `ללא מדרגות, ההצעה מתומחרת לפי מחיר הבסיס` (שורה אחת), הכלל המלא ⇒ מועמד `prices.tierRule` (③) · `שמירת מדרגות המחיר נכשלה — נסי שוב.`
**pricesApi.js** — שש הודעות-כישלון קיבלו `— נסי שוב.` (R17).
**`src/lib/permissions.js` · `src/lib/constants.js`** — 0 שינויים.

### 3. נבדקו ועומדות
`יש להזין כתובת דוא״ל.` · `הסיסמה חייבת להכיל לפחות 6 תווים.` · `הזיני קודם את כתובת הדוא״ל שלך בשדה למעלה.` · `שכחת סיסמה?` (ספק §7) · משפחת `שגיאה בטעינת …` (R30) · `יש לבחור תפקיד.` · `מספר טלפון נייד לא תקין (לדוגמה: 050-1234567).` · `שם מלא חייב להכיל לפחות 2 תווים.` · `אותיות גדולות, ספרות ומקפים בלבד (לא בתחילת המק"ט)` · `מצב הטמעה הודלק/כובה` · `רשימת עובדים` · `+ הוספת משתמש חדש` / `+ מוצר חדש` (שאלה פתוחה) · כותרות-דיאלוג `עריכת משתמש`/`הוספת משתמש חדש` · `אין מדרגות למוצר זה — הוא מתומחר לפי מחיר הבסיס.` · `הנתונים נשמרו בהצלחה` · `למנכ"ל תמיד עריכה מלאה` · משפחת `אין הרשאה ל…`.

### 4. בדיקות
**נערכו:** `UsersManagementPage.test.jsx` — placeholder (135, 213) · "דוא״ל תקינה" (223, 242) · "השבתת משתמש" (248, 259, 276, 287). **פגיעות מחוץ לתחום:** "אין" *(ר' הערת-הממזג)*. **vitest (CI-parity):** `Test Files 2 passed (2) · Tests 20 passed (20)`.

### 5. מועמדים · ממצאי-מבנה
**מועמד:** `PriceTiersDialog.jsx` — *"המדרגה שכמות-המינימום שלה היא הגבוהה ביותר מבין אלה שאינן עולות על הכמות בהצעה — היא שקובעת את המחיר."* ⇒ `prices.tierRule` (③).
**ממצא-מבנה:** `LoginPage.jsx` — שדות `email`/`password` נשענים רק על `placeholder` (נעלם בהקלדה), בלי `<label>` נראה — בניגוד ל-`UsersManagementPage`/`ProductFormDialog`. תיקון מוצע: `<label>` צמוד לכל שדה (שינוי-פריסה, כלל 8 — לא תוקן).

### 6. נראה, לא נגעתי
`+ הוספת משתמש חדש` / `+ מוצר חדש` · כפתור "X מדרגות"/"ללא מדרגות" (ניווט בצורת-תג).

### 7. ספקות / סתירות
1. **`שכחת סיסמה?`** — R12 מול מוסכמת-UX עולמית; לא שונה, מסומן לאודיט.
2. **"משתמש" מול "משתמשת"** בכותרות-דיאלוג/כפתורים — הוכרע לפי התקדים המוזג ב-`CustomerFormDialog` (`הוסיפי לקוח`, לא "לקוחה"): צורת-קטגוריה גנרית נשארת; משפט זורם על אישה ספציפית — נקבה. ⚠️ ראוי לבירור עקרוני עם ישי/המדריך.
3. **שני נוסחי-נעילה** (`:47` לפני הניסיון — "מאוחר יותר"; `:64` מיד אחרי — "בעוד כ-15 דקות") — מכוונים, לא סתירת-R30.
**מחוץ לתחום, לדיווח:** `src/components/ProfileSettingsPage.jsx:139–145` — placeholder `שם פרטי ומשפחה` + הערה שהשאירה אותו "עד שמודול 1 עובר שכתוב" — עכשיו לעדכן ל-`לדוגמה: דנה כהן` ולמחוק את ההערה (S-05).

**Agent usage:** 367K tokens · 123 tool uses · ~33 min.

