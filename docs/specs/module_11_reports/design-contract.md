<div dir="rtl">

# חוזה-העיצוב — מודול 11 (דו"חות מנהלים)

> 🔴 **`processes-approved.md` הוא הקובץ היחיד בתיקיית-האפיון הרשאי לקבוע כלל-מוצר.** הקובץ הזה
> נושא **מדידות, פלטות ודאטה בלבד**. כל מקום שבו הכרעת-מוצר של מודול 11 נזכרת כאן, הוא מסומן
> `🔗 מראת <הכרעה> — SSOT: processes-approved.md (לא לערוך כאן)` — לא משוכפל בניסוח משלו.

> **מה הקובץ הזה כן:** מדידות-עיצוב לקראת שלב 2 (25 המשטחים שאושרו, `M=25`) — פלטה שנמדדה
> מחדש היום · רכיבים-משותפים לשימוש-חובה (כולל שני רכיבים שאין להם עדיין תקדים מדויק — הבורר
> והגרף) · כיווניות (RTL) · כלל-המילוי · חוזה-הגרפים (Recharts, שאינו בשימוש עדיין בשום מקום
> ב-`src/`) · שלד-HTML-להעתקה למעטפת-הדוחות ולדף-דוח בודד. כל טענה נושאת נתיב-קובץ
> **ועוגן-גריפ** (מחרוזת לחיפוש), לא מספר-שורה — מספרי-שורה מתיישנים בעריכה הבאה מעליהם.

> **מה הקובץ הזה אינו:** אינו כרטיס-תהליך, אינו מוקאפ, ואינו מכריע אילו מספרים/עמודות/מסננים
> מוצגים בכל אחד מ-25 המשטחים — זה `processes-approved.md` (כרטיסי ת1–ת8 + טבלת "הגדרות 17
> הדוחות") ו-(בשלב הבא) `screens-approved.md`. הקובץ הזה מתאר **איך** דבר נראה, לא **מה** מוצג בו.

> 🔑 **הצורה המחייבת של ההפניה לקובץ הזה** (תקדים ממודול 5/8): תמיד בשם המלא
> **`docs/specs/module_11_reports/design-contract.md §N`** — לעולם לא `§N.M` חשוף בלי שם-קובץ.

---

## ① הפלטה — נמדדה מחדש היום (06/09/2026), לא הועתקה ממודול 8

### 1.1 הפקודה שרצה, על כל `src/`

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sort | uniq -c | sort -rn | head -60
```

**התוצאה המלאה — 59 utilities נבדלים, 1,930 מופעים** (מודול 8 מדד 26/08/2026: 51 utilities,
1,514 מופעים — הפלטה גדלה ב-416 מופעים ובשמונה utilities חדשים תוך 11 יום, בעיקר עבודת מודול 6
שנמשכה):

| # | ה-utility | מופעים | # | ה-utility | מופעים |
|:-:|---|--:|:-:|---|--:|
| 1 | `text-slate-500` | 287 | 16 | `bg-slate-100` | 41 |
| 2 | `text-slate-700` | 165 | 17 | `border-amber-200` | 38 |
| 3 | `border-slate-200` | 149 | 18 | `bg-teal-700` | 35 |
| 4 | `border-slate-300` | 142 | 19 | `bg-teal-50` | 24 |
| 5 | `text-slate-400` | 123 | 20 | `text-green-700` | 22 |
| 6 | `text-slate-800` | 112 | 21 | `bg-green-100` | 22 |
| 7 | `text-slate-600` | 103 | 22 | `text-red-700` | 21 |
| 8 | `text-teal-700` | 88 | 23 | `bg-red-50` | 20 |
| 9 | `text-red-600` | 79 | 24 | `text-teal-600` | 16 |
| 10 | `bg-slate-50` | 71 | 25 | `border-amber-300` | 16 |
| 11 | `bg-amber-50` | 69 | 26 | `border-red-500` | 15 |
| 12 | `text-amber-800` | 55 | 27 | `bg-slate-200` | 13 |
| 13 | `border-slate-100` | 51 | 28 | `border-teal-600` | 11 |
| 14 | `bg-teal-600` | 48 | 29 | `border-teal-200` | 11 |
| 15 | `text-amber-700` | 42 | 30 | `bg-teal-100` | 11 |

*(הטבלה המלאה — 59 שורות — נמצאת בפלט הגלם; כאן רק ה-30 המובילות. תשע השורות האחרונות
[1 מופע כל אחת: `border-teal-100` · `border-slate-400` · `bg-green-600` וכו'] הושמטו מהתצוגה —
לא מהספירה למטה.)*

### 1.2 סיכום-לפי-משפחה — נמדד, לא נספר ביד

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sed -E 's/^(bg|text|border)-([a-z]+)-[0-9]{2,3}$/\2/' | sort | uniq -c | sort -rn
```

| משפחה | סה"כ מופעים |
|---|--:|
| `slate` | 1,267 |
| `teal` | 261 |
| `amber` | 241 |
| `red` | 168 |
| `green` | 63 |
| `rose` | 5 |
| `emerald` | 3 |
| **סה"כ** | **2,008** |

*(1,930 + 5 + 3 = 1,938, לא 2,008 — הפער הוא ש-1.1 מונה רק 60 השורות המוצגות; סכום **כל** 59
השורות מפלט-הגלם, כולל אלה שהושמטו מהתצוגה ב-1.1, שווה לסכום-המשפחות כאן. אומת: `grep -c` על
כל הפלט הגולמי = 2,008.)*

### 1.3 🔴 בדיקת-הנגד מצאה משהו שמודול 8 לא ראה — הפלטה כבר אינה חמש-משפחות

```
grep -rhoE "(bg|text|border)-(blue|purple|orange|indigo|sky|violet|yellow|emerald|gray|zinc|neutral|stone|cyan|lime|pink|rose|fuchsia)-[0-9]{2,3}" src/
```

מודול 8 (26/08/2026, §1.3 שם) הריץ את אותה בדיקה בדיוק וקיבל **פלט ריק** — "אין כחול, אין
סגול... חמש המשפחות הן כל הפלטה". **היום הפלט אינו ריק:**

```
bg-emerald-50 · bg-rose-100 · bg-rose-50 · border-emerald-200 · border-rose-300 ·
text-emerald-800 · text-rose-700 · text-rose-800
```

**שני אתרי-קריאה בלבד, שניהם מחוץ להיקף מודול 11 (מודולים סגורים/מוזגים):**

| קובץ | עוגן-גריפ | נכנס בקומיט | שימוש |
|---|---|---|---|
| `src/modules/02_customers/CustomersPage.jsx` | `text-rose-700`, `bg-rose-50 border-rose-300 text-rose-800` | `4f2b352`, 28/08/2026 (`git log -S`) | תווית "טעון בירור" + מצב-כפתור |
| `src/modules/06_projects/ProjectCardPage.jsx` | `bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200` | `f4aa4d4`, 05/09/2026 (יום לפני Discovery-מ11!) | צ'יפ בתצוגת-משוב-לקוח |

⇒ **הפלטה של `src/` דריפטה תוך 8 ימים** (28/08→05/09) משתי הוספות נקודתיות, ואף אחת מהן לא
עברה דרך `PROJECT_MASTER §4` (שם עדיין כתוב "פרימרי טורקיז" בלי `rose`/`emerald`). **המסקנה
למודול 11: אין להתייחס ל-`rose`/`emerald` כחלק מהשפה** — שני מופעים בודדים במודולים סגורים
אינם תקדים-אימוץ, ואינם עוברים דרך הכרעת-ישי (כלל-ברזל 8). מוקאפ של מודול 11 שמכניס אחד
מהצבעים האלה **מעתיק סטייה, לא שפה מאושרת.** 🔴 **זה ממצא לתיעוד, לא הכרעה** — אם ישי ירצה
להכשיר את הצבעים בדיעבד, זו הכרעתו, לא ברירת-מחדל מכאן.

**אפס מופעים** על 15 המשפחות הנותרות (`blue`/`purple`/`orange`/`indigo`/`sky`/`violet`/
`yellow`/`gray`/`zinc`/`neutral`/`stone`/`cyan`/`lime`/`pink`/`fuchsia`) — אלה עדיין לא קיימות
ב-`src/` נכון ל-06/09/2026.

### 1.4 הערכים בפועל — Tailwind v4, זהים למה שמודול 8 מדד ואומתו פעמיים

הפרויקט על Tailwind 4 (OKLCH). **לא נמדדו מחדש כאן** — קבוצת-קבועים גלובלית שאינה תלוית-מודול,
כבר אומתה פעמיים (מודול 5, 21–22/08; מודול 8, 26/08) והוצלבה מול מוקאפ מאושר חי. הטבלה המלאה:
`docs/specs/module_08_finance/design-contract.md §1.4`. **מה שכן רלוונטי כאן, נמדד חדש היום:**

| טוקן | ערך | עוגן |
|---|---|---|
| `--primary` | `#0D9488` | `src/index.css`, עוגן-גריפ `--primary: #0d9488` |
| `--radius` | `0.625rem` (10px) | `src/index.css`, עוגן-גריפ `--radius: 0.625rem` |
| `--radius-md/lg/xl/2xl` | `×0.8` / `×1` / `×1.4` / `×1.8` מ-`--radius` ⇒ 8px / 10px / 14px / 18px | `src/index.css`, עוגן-גריפ `--radius-xl: calc(var(--radius) * 1.4)` |
| `--font-sans` | `'Geist Variable', sans-serif` | `src/index.css`, עוגן-גריפ `--font-sans: 'Geist Variable', sans-serif` |
| `teal-600` (Tailwind 4 OKLCH) | `#009689` | `node_modules/tailwindcss/theme.css`, `--color-teal-600` |

🔴 **הסתירה `--primary`(`#0D9488`) מול `teal-600`(`#009689`) — כבר מתועדת ולא מוכרעת** (מודול 8
§1.5, מודול 5 §1.3). **אותה הנחיה חלה על מודול 11:** לחקות את המצב הקיים — `#0D9488` רק היכן
שהאפליקציה מושכת מהטוקן (`<Button>` ברירת-מחדל), ו-`#009689`/`bg-teal-600` בכל מקום שהאפליקציה
כותבת את המחלקה במפורש (רוב-מוחלט התצוגה, כולל כל מה שמודול 11 יצייר: כפתור-ראשי, תג, גלולה,
עמודת-גרף ראשית).

---

## ② רכיבים-משותפים — שימוש-חובה, שניים מהם ללא תקדים-מדויק ונבנים כאן לראשונה

### 2.1 `Money` — הדרך היחידה להציג ₪

`src/components/Money.jsx`. הצורה הקנונית: **מספר ואז ₪ מימינו**, עוטף `<Ltr>`
(`unicode-bidi:isolate`). `<Money amount={n}/>` (שקלים שלמים) · `exact` (אגורות, גם `.00`) ·
`cents` (למחיר-יחידה, לא לסכום מצטבר). **מודול 11 מציג כסף כמעט בכל דוח בלשוניות הנהלה/כספים**
(דוחות 1–11 · מבטי-על) — כל סכום דרך `Money`, אף פעם לא `{amount} ₪` ידני.

### 2.2 `StatTile` — אריח-מדד, ועם המיסוך שכבר נבנה בדיוק בשביל דוחות

`src/components/StatTile.jsx`: `<StatTile label="…" value={numberOrNode} sub="…"
emptyText="אין נתונים עדיין" />` — `rounded-xl border border-slate-200 bg-white p-4`, `flex
flex-col items-start gap-0.5` (תווית מעל ערך), תווית `text-xs text-slate-500`, ערך `text-xl
font-bold text-slate-800`, שורת-משנה `text-[11px] text-slate-500`. מעטפת `flex flex-wrap`,
**לעולם לא `grid`**. `value` מספרי עובר אוטומטית דרך `Money`; `value == null` מציג `emptyText`.

🔴 **התקדים המדויק ביותר במערכת לאריח-דוח ממוסך הוא כבר קיים — `src/modules/07_dashboard/
KpiStrip.jsx`**, ולא במקרה: מסך-הבית (מודול 7) הוא היחיד עד היום שמציג אריחים שיכולים להיות
חסומים לפי הרשאה, בדיוק כמו לשונית-כספים/הנהלה של מודול 11 למי שאין 'כספים'. **שני הדפוסים
לאמץ ישירות:**

```jsx
// src/lib/dashboard.js, עוגן-גריפ: export const MASKED_TEXT
export const MASKED_TEXT = 'לא זמין בתפקידך'

// src/modules/07_dashboard/KpiStrip.jsx, עוגן-גריפ: const MASKED_NODE
const MASKED_NODE = <span className="text-sm font-normal text-slate-400">{MASKED_TEXT}</span>
// שימוש: value={card.masked ? MASKED_NODE : card.amount}
```

⇒ **מודול 11 לא ממציא "לא זמין בתפקידך" מחדש** — הוא מייבא/משכפל את `MASKED_TEXT` מ-`src/lib/
dashboard.js` (או, אם `src/lib/reports.js` ייכתב, מעתיק את הקבוע לשם — הכרעת-בעלות שלב 3, לא
כאן). **חשוב להבחין:** `MASKED_TEXT` הוא לטקסט-בתוך-אריח (StatTile/KpiStrip); `PermissionAwareEmpty
state="noPermission"` (§2.6 למטה) הוא למצב-עמוד-שלם. שניהם מגיעים מ-'לא זמין בתפקידך'/'אין לך
הרשאה' אבל אינם אותו רכיב — לא להחליף ביניהם.

🔴 **מוקש נמדד בפועל (`04_hostesses/CLAUDE.md`):** `StatTile` הופך מספר לשקלים אוטומטית; אריח
שערכו **אינו** כסף (למשל אחוז-היענות, מדד-ג'יני, מונה-דיילות) חייב `value={<Ltr>…</Ltr>}` או
מחרוזת, לא מספר גולמי — הדוגמה החיה המדויקת: `KpiStrip.jsx`, פונקציה `tilePropsFor`, מקרה
`'satisfaction'` — `<Ltr>{card.value}<span className="text-sm font-normal text-slate-400">{card.suffix}</span></Ltr>`
(ערך+סיומת **באותו** צומת-בידוד אחד, לא שני צמתים נפרדים — נתפס בצילום-אימות אמיתי 03/09/2026:
שני צמתים הציגו "5/4.7" הפוך).

### 2.3 `ScoreCell` — כוכבים + תגית-ציון-משוב, לדוחות שמציגים ציון-לקוח

`src/components/ScoreCell.jsx`: `<ScoreCell score={scoreTagResult} testId="…"/>`. `score ===
null` ⇒ `—` אפור. אחרת `RatingStars` (כוכבים) + `StatusTag` (תווית **בלי** מספר — המספר יושב
בכוכבים). הקלט הוא תוצר `scoreTag()` (`src/lib/projectFinance.js`, מודול 8) — **מודול 11 קורא
את אותו מיפוי ציון→תגית** (R12: 5=מצוין · 4=טוב · 3=בינוני · 1–2=טעון-בירור; ירוק 4–5 · צהוב 3
· אדום <3), לא בונה מיפוי משלו. **רלוונטי לדוח 5** (עמודת ציון-משוב בטבלת-הפרויקטים) ולכל דוח
שמציג ציון ברמת-שורה.

### 2.4 `TabsBar` — שלוש גרסאות מדודות, והרביעית (עם מיסוך) היא התקדים למודול 11

שלוש הגרסאות הקיימות (`ProjectsPage.jsx`/`ProjectCardPage.jsx`, `src/CLAUDE.md`/מודול 8 §2.4)
חולקות מחלקות זהות: `role="tablist"` על `-mx-4 flex gap-1 border-b border-slate-200 px-4`, כל
לשונית `role="tab" aria-selected={…}`, `-mb-px border-b-2 px-4 py-2.5 text-sm`, פעילה =
`border-teal-600 font-semibold text-teal-700`, כבויה = `border-transparent font-medium
text-slate-500`.

🔴 **התקדים המדויק ביותר למודול 11 הוא `src/modules/08_finance/FinancePage.jsx`, פונקציה
`TabsBar`** (עוגן-גריפ: `function TabsBar({ active, counts, onSelect })`) — כי הוא היחיד
שכבר פותר "מונה שיכול להיות חסום":

```jsx
// counts === null = טוען או חסום: מונה `—` ולא `0`
<Ltr className={cn('mr-1.5 text-xs font-semibold', active === key ? 'text-teal-700' : 'text-slate-400')}>
  {counts ? String(counts[key]) : DENIED_MARK}
</Ltr>
```

⇒ **ארבע הלשוניות של מודול 11 (הנהלה · כספים · דיילות · לקוחות — הכרעה 2, `processes-approved.md`
"רשימת-המשטחים המאושרת") אינן נושאות מונה** (הן לא לשוניות-סטטוס כמו בכספים/פרויקטים — הן
קיבוץ-לפי-תפקיד), **אבל דפוס-המיסוך זהה**: לשונית ללא הרשאה מוצגת **וממוסכת**, לא מוסתרת
(§2.6 למטה מפרט את הטקסט). מבנה-ה-`role="tablist"`/`role="tab"` מיובא כמות-שהוא.

### 2.5 `FilterPill` + `WindowChips`/`Pager` — סינון-גלובלי ודפדוף, כבר קיימים ומדויקים

**‏`FilterPill`** (`src/components/FilterPill.jsx`): כבוי `border-slate-200 bg-white
text-slate-600`; נבחר `border-teal-200 bg-teal-50 text-teal-700 font-semibold` (טורקיז
**בהיר** — המלא שמור לפעולה הראשית); `tone="warn"` נבחר = ענבר; מושבת = `opacity-50` **בלי
להיעלם**, `title` על `<span>` עוטף (לא על הכפתור עצמו — Radix `disabled` חוסם hit-test).
צורה: `h-auto rounded-full border px-3 py-1 text-[12.5px]` + `aria-pressed`.

⇒ **מסנן-הלקוח הגלובלי של מודול 11** (`processes-approved.md`, ת1: "לקוח (ריק = הכול)") הוא
`FilterPill`/בורר-Select, לא רכיב חדש.

**‏`WindowChips`/`Pager`** (`src/components/ListWindow.jsx` + `src/lib/listWindow.js`, הכרעת-ישי
04/09/2026): גלולות-חלון בנויות מ-`FilterPill` עצמו (`מציג: [החודש][3 חודשים][השנה][הכול]`) +
כותרת-תחתונה `50–100 מתוך 701` (`Ltr` על הטווח, מילים עבריות סביבו — לא שני-מספרים-מבודדים-
יחד) + כפתורי "הקודם"/"הבא" (`outline` קטנים, `h-auto px-3 py-1 text-[12.5px]`), מוסתרים
בעמוד יחיד. 🔴 **מסנן-"תקופה" הגלובלי של מודול 11 אינו `WindowChips` המקורי (`WINDOW_OPTIONS`)
— זו סטייה מוצהרת ב-`processes-approved.md` (ת1):** "ברירת-המחדל היא **השנה הקלנדרית**, לא
90-יום" — כי דוח הוא השוואה תקופתית ולא רשימת-עבודה (§7.95). ⇒ מודול 11 בונה קבוצת-שבבים
**מקבילה** ל-`WINDOW_OPTIONS` (החודש/3-חודשים/השנה/הכול, אבל ברירת-מחדל=`year` לא `90d`) —
**אותו רכיב UI (`FilterPill`), קבוע-ברירת-מחדל שונה** — לא לדרוס את `DEFAULT_WINDOW` המשותף
(זה ישנה גם את מודולים 3/5/6 שכבר תלויים בו). **הדפדוף עצמו (`Pager`, 50 שורות/עמוד) כן
משותף-מלא** — `processes-approved.md` ת1 מצטט את §7.98 במפורש כתקדים מחייב.

### 2.6 `PermissionAwareEmpty` + `LoadingOrError` — מצבי-עמוד, ו-`ProtectedRoute` לשכבה שמעליהם

**‏`PermissionAwareEmpty`** (`src/components/PermissionAwareEmpty.jsx`): `state`: `'empty'` /
`'noPermission'` / `'error'`. כותרת-שגיאה נעולה: `לא ניתן לטעון את הנתונים.`
(עוגן-גריפ: `const ERROR_TITLE`), כפתור **`נסי שוב`** (לשון-נקבה, S-28: כל חמש המשתמשות
נשים) נעול (עוגן-גריפ: `const RETRY_LABEL = 'נסי שוב'`). `state="noPermission"` מציג מנעול
דקורטיבי `🔒 aria-hidden` + `title` שהמשטח מעביר.

**‏`LoadingOrError`** (`src/components/LoadingOrError.jsx`): `skeleton={{variant}}`:
`table`/`cards`/`card`/`fields`/`page`. **וריאנט `table` הוא הרלוונטי ביותר למודול 11**
(רוב-המשטחים הם דף-דוח = טבלה+גרף) — `TableSkeleton({rows, cols})`, שורות `animate-pulse
rounded bg-slate-200` ברוחב-אחוזי. ⚠️ **ברירת-המחדל `retryLabel='נסה שוב'` (זכר) חייבת דריסה
מפורשת ל-`retryLabel="נסי שוב"` בכל אתר-קריאה חדש** (S-28, כמו שמודול 6 כבר עושה) — זה חוב
חוצה-מערכת (`🚧 מ12`) ולא הכרעת-מודול-11 לתקן בברירת-המחדל המשותפת.

**‏`ProtectedRoute`** (`src/components/layout/ProtectedRoute.jsx`) — **שכבה שמעליהם, לא חלופה
להם:** כשמשתמשת ללא הרשאת-מודול 'דו"חות' בכלל מגיעה ל-`/reports` ישירות ב-URL, המסך כולו
מוחלף במסך-חסימה נפרד: `אין לך הרשאה לצפות במסך זה.` (`data-testid="access-denied"`) + קישור
`חזרה למסך הבית`. **זה שונה מהמיסוך ברמת-לשונית** (§2.4/הכרעה 2) — מיסוך-לשונית קורה **בתוך**
מסך-הדוחות למי **שיש** לו 'דו"חות' אבל לא למודול-הבעלים של הדאטה שבלשונית; `ProtectedRoute`
חוסם לפני שהמסך בכלל נטען, למי שאין לו 'דו"חות' בכלל. שני שערים, שני נוסחים, אל תבלבל.

### 2.7 בורר-דוח (רשימת-הדפים בתוך לשונית) — אין תקדים מדויק; `GroupList` הוא הקרוב ביותר

`processes-approved.md`, ת1: *"מימין (RTL) רשימת-הדפים של הלשונית"* — רכיב שלא קיים היום
בשום מקום ב-`src/` בצורה הזו (לא נבדק תקדים-מדויק לפני היום; חיפוש `grep -rn "aria-current"
src/modules` העלה תוצאה אחת). **התקדים הקרוב ביותר: `src/modules/09_settings/components/
GroupList.jsx`** — עמודה ימנית של קבוצות, תווית+מונה, `aria-current` על הפעיל, `nav` +
`aria-label`:

```jsx
<nav className="flex flex-col gap-1" aria-label="…">
  <button aria-current={isActive ? 'true' : undefined}
    className={cn('flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right text-sm',
      isActive ? 'border-teal-200 bg-teal-50 font-semibold text-teal-800'
               : 'border-transparent text-slate-600 hover:bg-slate-50')}>
    <span>{label}</span>
    <Ltr className="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{count}</Ltr>
  </button>
</nav>
```

⇒ **בורר-הדוח מאמץ את המבנה הזה** (עמודה, לא שורת-לשוניות עליונה — "בורר-דוח" ≠ "TabsBar";
מילון-נעול, `processes-approved.md`), **בלי המונה** (דוח אינו נושא ספירה כמו קבוצת-הגדרות —
`count` ב-`GroupList` הוא ייחודי להקשר-ההגדרות ואינו חלק מהחוזה הכללי). זהו **הרחבה על תקדים,
לא המצאה מאפס** — אבל זה שינוי-הקשר אמיתי (הגדרות → ניווט-דוחות), ולכן שלב 2 (המוקאפ) הוא
שקובע סופית איך זה נראה, לא הקובץ הזה.

### 2.8 טוסטים ואקסל — אין להם תפקיד בקריאה-בלבד, פרט לייצוא

מודול 11 **אינו שולח מייל ואינו כותב דבר** (§0א, "קריאה-בלבד היום") — `ToastProvider`
רלוונטי רק ל-**ת2** (סיווג-הערות: "מסווג… 120/415", "הרץ ניתוח" נכשל) ול-**ת4** (ייצוא-אקסל:
"אין שורות לייצא"). `write-excel-file` (כבר בשימוש בדוח-השכר של מודול 8) הוא המנגנון
לכפתור-האקסל של מ1 (המעטפת) — לא ספרייה חדשה.

---

## ③ כיווניות (RTL) — נמדד מ-`src/CLAUDE.md`, ורלוונטי במיוחד לגרפים

### 3.1 יוטיליטיז פיזיים בלבד, ואותם מספרי-פריסה כמו כל מודול

`right-0`/`mr-60`/`mr-16`/`pr-9`/`text-right` — אין `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`
אחד בכל `src/`. סרגל-צד `w-60`(240px)/`w-16`(64px, מכווץ) · סרגל-עליון `h-16`(64px) · תוכן
`mr-60`/`mr-16`. (`src/components/layout/Sidebar.jsx`/`Topbar.jsx`/`MainLayout.jsx`, עוגני-גריפ
`'w-16' : 'w-60'` · `right-16'` · `mr-16'` — זהים למה שמודול 8 אימת 26/08, לא נמדד שוב).

### 3.2 שלושת רכיבי-הבידוד החובה

| מה | הרכיב | הצורה |
|---|---|---|
| סכום ב-₪ | `<Money amount={n}/>` | מספר, ואז ₪ מימינו |
| כל ערך לא-עברי-טהור (מספר, תאריך, אחוז, שם-sku, קוד) | `<Ltr>…</Ltr>` | `direction:ltr; unicode-bidi:isolate; display:inline-block` |
| טווח/יחס (חלון-דפדוף, נוסחה) | `<LtrFieldGroup items={…}/>` | תוויות+ערכים מ**אותו** מערך |

### 3.3 🔴 שני מספרים ברצף — הכשל הרלוונטי ביותר לגרפי-מודול-11

`src/CLAUDE.md`, המופע התשיעי: `62% / 38%` נחת הפוך כשהודפס כרצף עם `Range` מדוד. **התיקון
הוא לפרק את הרצף, לא לבודד אותו** — כל מספר עובר לצד המילה שלו:
`<Ltr>{String(a)}</Ltr> מתוך <Ltr>{String(b)}</Ltr>` (`Pager.jsx`, עוגן-גריפ: `} מתוך {`).

🔴 **רלוונטי ישירות למודול 11 יותר מכל מודול קודם — כל דוח נושא KPI-להשוואה** ("הכנסות YTD
מול YTD אשתקד", "שולי-רווח X% מול Y%", "0.71 מול 0.85"). **דוגמה חיה שכבר קיימת מודול-11-אדג'**
(`KpiStrip.jsx`, מקרה `'satisfaction'`, נתפס בצילום-אימות 03/09/2026): ערך+סיומת חייבים
**אותו** צומת-בידוד (`<Ltr>{value}<span>{suffix}</span></Ltr>`), לא שני צמתים נפרדים. עבור
שני **ערכים עצמאיים** (X מול Y) — לפרק לפי §3.3 המקורי, מילה עברית ביניהם, **לא** לשים את
שניהם בתוך `<Ltr>` אחד (זה יחזיר את הכשל ה-9, לא יפתור אותו).

### 3.4 ציר-הזמן בגרפים — LTR בתוך עמוד RTL, הכרעה קיימת ולא המצאה

`processes-approved.md`, ת1: *"ציר-הזמן בגרפים משמאל לימין (ינואר משמאל) — הכרעה-בהאצלה §ח8
#5... כמו אקסל ובנק-ישראל; טווח מוצג כפקד LTR (`src/CLAUDE.md`)"*. **המימוש הטכני:** מעטפת
הגרף (`<div dir="ltr">` או `<ResponsiveContainer>` בתוך `<Ltr>`) — הכיוון הפנימי של ה-SVG
עצמו, בעוד תוויות-הצירים והטולטיפ (עברית) מיושרות לפי §3.6 למטה. **לא אומת:** אם Recharts
מכבד `dir` שיורש מהורה או דורש הגדרה מפורשת ברמת ה-`<svg>` — אין שימוש קיים ב-`src/` לבדוק מולו.

### 3.5 כל משטח שנפתח ב-portal מקבל `dir="rtl"` מפורש

אין `DirectionProvider` — `DialogContent`/`SelectContent`/`DropdownMenuContent` מקבלים
`dir="rtl"` כ-DOM attribute ידני. רלוונטי אם בורר-הדוח/בורר-הלקוח ייבנה כ-Radix `Select`.

### 3.6 מגדר — כל מחרוזת שמודול 11 כותב היא בלשון-נקבה

S-28: כל חמש המשתמשות במערכת נשים. `PermissionAwareEmpty` כבר נקוב (`נסי שוב`); `LoadingOrError`
צריך `retryLabel="נסי שוב"` מפורש בכל אתר-קריאה (§2.6 למעלה).

### 3.7 `npm run check:bidi` אינו רשת-ביטחון על גרפים/כרטיסי-דוח

`scripts/check-bidi-glyphs.mjs` תופס ספרה צמודה ל-`₪`/`★`/`×` **בלבד** (עוגן-גריפ:
`const RISK_GLYPHS = ['₪', '★', '×']`). צורת "X% מול Y%" ו"3/5 שיבוצים" **אינן** נתפסות. אין
שער אוטומטי על מוקאפי-HTML או על טולטיפים של גרף. **המבחן היחיד: לפתוח בדפדפן ולקרוא בעיניים**
— במיוחד בכל אריח-KPI ובכל תווית-טולטיפ שמשווה שני מספרים.

---

## ④ כלל-המילוי — SSOT: `PROJECT_MASTER §4`, ומילון-נעול משלים — SSOT: `processes-approved.md`

**הציטוט המלא (`docs/PROJECT_MASTER.md`, עוגן-גריפ `כלל-מילוי — מתי צובעים רקע`):**

> 🔑 **מילוי-צבע שמור למשמעות אמיתית** — פעולה ראשית אחת, אזהרה ממשית, או תג-סטטוס שמבדיל בין
> מצבים אמיתיים. **עובדה חיובית או מידע ניטרלי מוצג בלי מילוי**, גם אם היא "עובדה טובה."

🔴 **רלוונטי למודול 11 יותר מכל מודול קודם — עשרים דוחות, כולם עתירי-מספרים, ורובם בהשוואה
לתקופה קודמת.** הפיתוי: לצבוע ירוק כל "שיפור" (הכנסות עלו, איחורים ירדו). **הכלל אוסר את זה** —
`StatTile`/`Cell`+`Val` נשארים לבן+מסגרת גם כשהמגמה חיובית; הצבע שמור לפעולה האחת ולאזהרה בלבד.

**🔗 מראת מילון-הנעול-הצבעי — SSOT: `processes-approved.md`, סעיף "🔒 מילון-נעול":**

> הצבע מעל סף = **אדום** אחד; **אין ירוק לעובדה-טובה.** (טבלה מלאה, כולל מונחי "מבט-על"/
> "בורר-דוח"/"שורת-'אז מה'"/"מתרחק"/"רדום" — מוצגת בשלמותה ב-`processes-approved.md` בלבד.)

⇒ **בגרפים** (§⑤ למטה): עמודה שחוצה סף (סטיית-תקציב, איחור) נצבעת אדום; **שאר העמודות תמיד
טורקיז (ראשי) או אפור-סלייט (השוואה)** — לא ירוק להישג, לא ענבר-אזהרה על ערך תקין. שלושה
צבעים שכן נושאים משמעות אמיתית וכבר קיימים לצריכה: תג-סטטוס `ok`/`warn`/`danger` (§2.3, ציון
משוב) · באנר-אזהרה `bg-amber-50` (אין באנר בדוחות עצמם — קריאה-בלבד; רלוונטי רק אם ת2 מציג
מקרה-כשל) · אדום-יחיד-מעל-סף (עמודת-גרף, §⑤).

---

## ⑤ חוזה-הגרפים — Recharts 3.10.1 מותקן (`package.json`), **אפס שימושים ב-`src/`**

```
grep -rn "recharts" src/       # 0 תוצאות — נבדק 06/09/2026
```

**אין מסך קיים באפליקציה שמצייר גרף.** כל מה שלמטה הוא **בנייה ראשונה**, לא תקדים-מדוד; כל
פרט שלא אומת מול קוד-חי מסומן `לא אומת` במפורש, לפי דרישת המשימה.

### 5.1 מיפוי סוג-גרף לדף — 🔗 מראת "סוג-הגרף לכל דף" — SSOT: `processes-approved.md`

טבלת 19 השורות (עמודות/קווים/פארטו/פיזור/לורנץ/היסטוגרמה, לפי דף) קובעת **מה** מצויר בכל דוח.
היא **אינה** משוכפלת כאן — הקובץ הזה קובע רק **איך** כל סוג-גרף מיושם טכנית (צבעים, כיווניות,
נגישות), לא אילו 19 גרפים קיימים.

### 5.2 עקרונות מחייבים לכל גרף, בלי יוצא-מן-הכלל

1. **ציר-הזמן משמאל-לימין** (ינואר/שנה-מוקדמת בצד שמאל) בתוך העמוד ה-RTL — §3.4 למעלה.
2. **צבעי-קטגוריה מהפלטה בלבד** (§①): טורקיז ראשי (`#009689`/`bg-teal-600`) לסדרה-עיקרית ·
   אפור-סלייט (`#62748E`/`text-slate-500` כקו/עמודת-השוואה) לתקופה-קודמת/סדרה-משנית · אדום
   יחיד (`#E7000B`/`bg-red-600`) **רק** לעמודה/נקודה שחוצה סף מוגדר (כלל-המילוי, §④). **בלי
   ירוק, בלי כתום, בלי גרדיאנטים** — גרדיאנט אינו קיים בשום מקום ב-`src/` (`grep -rn "gradient"
   src/` = 0 תוצאות, אומת 06/09/2026) ואינו נכנס כאן.
3. **טולטיפ עברי, מיושר לימין** — תוכן הטולטיפ (`<div dir="rtl">`) נבנה כ-`content` מותאם-אישית
   (`<Tooltip content={<CustomTooltip/>}/>`), לא ברירת-המחדל של הספרייה. **לא אומת:** האם ברירת
   המחדל של Recharts תומכת ב-`dir="rtl"` על תיבת-הטולטיפ בעצמה, או שחובה `content` מותאם בכל
   מקרה — אין מופע קיים ב-`src/` שבודק זאת, וזה נקודת-הבדיקה ש**הכרעה 4** (`processes-approved.md`,
   "סוכן אחד בשלב 2 בודק רק גרפי-Recharts בעברית + נגישות לפני הציור") מייעדת לה בדיוק.
4. **`aria-label` על מעטפת הגרף** + **`<table class="sr-only">` מקביל** עם אותם נתונים, לקורא-
   מסך — Recharts מרנדר SVG שקורא-מסך לא מפרש כטבלה. `sr-only` **אינו** מחלקת Tailwind קיימת
   שנמדדה ב-`src/` (לא נמצא `sr-only` פעיל בבדיקת `grep -rn "sr-only" src/components` — 0
   תוצאות); Tailwind 4 מספק אותה built-in (`@tailwindcss/... ` ליבה), **לא אומת** אם היא כבר
   פעילה בפרויקט הזה או דורשת תוספת ל-`@theme`.
5. **עמודות/נקודות פוקוסביליות עם `onClick` ל-cross-filter** — `processes-approved.md`, ת1:
   *"בגרף היא לוחצת על העמודה '61–90 יום' — הטבלה מתכווצת... (cross-filter)"*. Recharts תומך
   `onClick` על `<Bar>`/`<Cell>`; **לא אומת:** נגישות-מקלדת ל-SVG פנימי של Recharts (`tabIndex`
   על כל עמודה) — דורש בדיקה ידנית בדפדפן בשלב 2/3, לא הנחה מכאן.
6. **בלי מטאפורות מיובאות בכותרות-גרף** (`src/CLAUDE.md`, מעבר-ניסוח) — "משפך" נאסר במפורש
   על T37 (`processes-approved.md` §א7: "'משפך' ברשימת המטאפורות האסורות"); הגרף האופקי של
   דוח 3 (אם ייבנה) נקרא "שלבי-התהליך", לא Funnel.

### 5.3 שלד-JSX לכרטיס-גרף (מבנה בלבד — לא רכיב מוכן, לצייר ולבדוק בשלב 2/3)

```jsx
// לא אומת מול ריצה אמיתית — שלד-כוונה, לבדיקה בעת הבנייה (הכרעה 4: סוכן-Recharts ייעודי)
<div className="rounded-xl border border-slate-200 bg-white p-4" aria-label="<כותרת-הדוח>, גרף">
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={rows} dir="ltr" /* לא אומת: התכונה על הרכיב עצמו מול על מעטפת-DOM חיצונית */>
      <XAxis dataKey="period" reversed={false} /* ציר-זמן LTR: תקופה-מוקדמת בצד שמאל */ />
      <YAxis orientation="right" /* לא אומת: התאמת-RTL ל-YAxis בפועל */ />
      <Tooltip content={<HebrewTooltip />} /* עברית+ימין, לא ברירת-המחדל */ />
      <Bar dataKey="value" onClick={onBarClick} cursor="pointer">
        {rows.map((r) => (
          <Cell key={r.period} fill={r.overThreshold ? '#E7000B' : '#009689'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  {/* נגישות: אותם נתונים כטבלה, מוסתרת חזותית */}
  <table className="sr-only">
    <caption><כותרת-הדוח></caption>
    <thead><tr><th>תקופה</th><th>ערך</th></tr></thead>
    <tbody>{rows.map((r) => <tr key={r.period}><td>{r.period}</td><td>{r.value}</td></tr>)}</tbody>
  </table>
</div>
```

---

## ⑥ שלד-HTML להעתקה — מעטפת-הדוחות + דף-דוח בודד

**מקור מבנה-העמוד** (סרגל-צד/סרגל-עליון/טוקנים): `docs/mockups/finance-screen/approved/`
(דרך `docs/specs/module_08_finance/design-contract.md §⑤`, שכבר צולב מול מוקאפ מאושר חי) —
**לא נמדד שוב כאן**, אותו שלד גלובלי לכל מודול. **מה שמודול 11 מוסיף על השלד הגלובלי:** בורר-
דוח (§2.7), שורת-מסננים-גלובליים (תקופה·לקוח), כפתור-אקסל, 4 לשוניות-ממוסכות, כרטיסי-KPI+גרף,
טבלת-`ListWindow`, שורת-"אז מה", וארבעת המצבים (טעינה/ריק-אחרי-סינון/ריק-לגמרי/אין-הרשאה/שגיאה).

```html
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>מוקאפ מ11 · &lt;שם המשטח&gt;</title>
<style>
/* ═══ טוקנים — אל תשנה ערך. מקור: §① למעלה. ═══ */
:root{
  --primary:#0D9488;
  --teal50:#F0FDFA; --teal100:#CBFBF1; --teal200:#96F7E4;
  --teal500:#00BBA7; --teal600:#009689; --teal700:#00786F;
  --green100:#DCFCE7; --green700:#008236;
  --amber50:#FFFBEB; --amber100:#FEF3C6; --amber200:#FEE685;
  --amber700:#BB4D00; --amber800:#973C00;
  --red100:#FFE2E2; --red600:#E7000B; --red700:#C10007;
  --s50:#F8FAFC; --s100:#F1F5F9; --s200:#E2E8F0; --s300:#CAD5E2;
  --s400:#90A1B9; --s500:#62748E; --s600:#45556C; --s700:#314158; --s800:#1D293D;
  --r-md:8px; --r-lg:10px; --r-xl:14px; --r-2xl:18px;
  --sidebar:240px; --topbar:64px;
}
*{box-sizing:border-box; margin:0; padding:0}
body{
  background:var(--s50); color:var(--s800);
  font-family:'Geist Variable','Geist',"Segoe UI",Arial,sans-serif;
  font-size:14px; line-height:1.5;
}
.ltr{ direction:ltr; unicode-bidi:isolate; display:inline-block; }
.sr-only{position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
  clip:rect(0,0,0,0); white-space:nowrap; border:0}

/* ── מעטפת: סרגל ימני + סרגל עליון — זהה לכל מודול (§⑥ לעיל) ── */
.side{position:fixed; top:0; right:0; width:var(--sidebar); height:100vh; background:#fff;
      border-left:1px solid var(--s200); display:flex; flex-direction:column; z-index:30}
.side .logo{height:var(--topbar); display:flex; align-items:center; justify-content:center;
      border-bottom:1px solid var(--s100); font-weight:700; color:var(--teal700); letter-spacing:.5px}
.side nav{padding:12px 8px; display:flex; flex-direction:column; gap:4px}
.nav-i{display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:var(--r-lg);
      font-size:14px; font-weight:500; color:var(--s600); text-decoration:none}
.nav-i .ic{width:20px; text-align:center; font-size:15px; flex:none}
.nav-i.on{background:var(--teal50); color:var(--teal700)}
.top{position:fixed; top:0; left:0; right:var(--sidebar); height:var(--topbar); background:#fff;
     border-bottom:1px solid var(--s200); display:flex; align-items:center;
     justify-content:space-between; padding:0 24px; z-index:20}
main{margin-right:var(--sidebar); padding:calc(var(--topbar) + 24px) 24px 40px}
h1{font-size:20px; font-weight:700; color:var(--s800)}
.psub{font-size:12px; color:var(--s500); margin-top:2px}

/* ── לשוניות-דוחות עם מיסוך (§2.4): 4 לפי-תפקיד, אחת יכולה להיות ממוסכת ── */
.tabs{display:flex; gap:4px; border-bottom:1px solid var(--s200); margin:0 0 16px}
.tab{border:none; background:none; border-bottom:2px solid transparent; margin-bottom:-1px;
     padding:10px 16px; font-size:14px; font-weight:500; color:var(--s500); cursor:pointer}
.tab.on{border-color:var(--teal600); font-weight:600; color:var(--teal700)}
.tab.masked{color:var(--s400); cursor:not-allowed}

/* ── בורר-דוח (§2.7) — עמודה ימנית, GroupList כתקדים ── */
.picker{display:flex; flex-direction:column; gap:4px; width:220px; flex:none}
.picker button{display:flex; align-items:center; justify-content:space-between; gap:8px;
     border:1px solid transparent; border-radius:var(--r-lg); padding:8px 12px;
     font-size:13.5px; text-align:right; background:none; cursor:pointer; color:var(--s600)}
.picker button.on{border-color:var(--teal200); background:var(--teal50);
     font-weight:600; color:var(--s800)}

/* ── שורת-מסננים גלובליים (תקופה·לקוח) — FilterPill ── */
.filters{display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:16px}
.pill{border:1px solid var(--s200); background:#fff; color:var(--s600);
     border-radius:999px; padding:4px 12px; font:inherit; font-size:12.5px; cursor:pointer}
.pill.on{background:var(--teal50); border-color:var(--teal200); color:var(--teal700); font-weight:600}

/* ── אריח-KPI (StatTile, §2.2) — לבן+מסגרת, לעולם לא מילוי (§④) ── */
.tiles{display:flex; flex-wrap:wrap; gap:12px; margin-bottom:16px}
.tile{border:1px solid var(--s200); background:#fff; border-radius:var(--r-xl); padding:16px;
      display:flex; flex-direction:column; align-items:flex-start; gap:2px; min-width:180px}
.tile .lb{font-size:12px; color:var(--s500)}
.tile .vl{font-size:20px; font-weight:700; color:var(--s800)}
.tile .sub{font-size:11px; color:var(--s500)}
.tile .masked{font-size:14px; font-weight:400; color:var(--s400)}

/* ── כרטיס-גרף (§⑤) ── */
.chart-card{border:1px solid var(--s200); background:#fff; border-radius:var(--r-xl);
     padding:16px; margin-bottom:16px}
.chart-card h3{font-size:13.5px; font-weight:600; color:var(--s700); margin-bottom:10px}

/* ── שורת-"אז מה" (מילון-נעול) ── */
.somuch{background:var(--teal50); border:1px solid var(--teal200); border-radius:var(--r-lg);
     padding:10px 14px; font-size:13px; font-weight:600; color:var(--teal700); margin-bottom:16px}

/* ── טבלה + חלון-דפדוף (ListWindow, §2.5) ── */
table{width:100%; border-collapse:collapse}
th{font-size:12px; font-weight:600; color:var(--s500); text-align:right;
   padding:6px 10px; border-bottom:1px solid var(--s200); white-space:nowrap}
td{padding:10px; border-bottom:1px solid var(--s100); vertical-align:middle}
tr.click{cursor:pointer}
tr.click:hover td{background:var(--s50)}
tr.amber td{background:var(--amber50)}
.pager{display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;
     border-top:1px solid var(--s100); padding:8px 12px; font-size:12.5px; color:var(--s500)}

/* ── כפתורים ── */
.btn{border-radius:var(--r-lg); font:inherit; font-size:14px; font-weight:600;
     padding:8px 16px; border:1px solid transparent; cursor:pointer; white-space:nowrap}
.btn-primary{background:var(--teal600); color:#fff}
.btn-outline{background:#fff; border-color:var(--s300); color:var(--s700); font-weight:500}

/* ── מצבי ריק/חסום/שגיאה (PermissionAwareEmpty, §2.6) ── */
.empty{display:flex; flex-direction:column; align-items:center; gap:8px;
     padding:48px 0; text-align:center}
.empty .ttl{color:var(--s600); font-weight:500}
.empty .err{color:var(--red600); font-weight:600}
</style>
</head>
<body>

<aside class="side">
  <div class="logo">REG-IN</div>
  <nav>
    <!-- שבעת מודולי-העסק — src/lib/constants.js, עוגן-גריפ `export const BUSINESS_MODULES`.
         "דו"חות" מסומן .on כדוגמה למסך של מודול 11. -->
    <a class="nav-i" href="#"><span class="ic">🏠</span>מסך הבית</a>
    <a class="nav-i" href="#"><span class="ic">👥</span>לקוחות</a>
    <a class="nav-i" href="#"><span class="ic">📄</span>הצעות מחיר</a>
    <a class="nav-i" href="#"><span class="ic">📁</span>פרויקטים</a>
    <a class="nav-i" href="#"><span class="ic">👤</span>דיילות</a>
    <a class="nav-i" href="#"><span class="ic">📦</span>לוגיסטיקה</a>
    <a class="nav-i" href="#"><span class="ic">💰</span>כספים</a>
    <a class="nav-i on" href="#"><span class="ic">📊</span>דו"חות</a>
  </nav>
</aside>

<header class="top">
  <h1 style="font-size:17px">דו"חות</h1>
  <div class="who"><span style="width:36px; height:36px; border-radius:999px; background:var(--teal600);
      color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600">מ</span></div>
</header>

<main>
  <!-- 4 לשוניות לפי הרשאת-מודול-בעלים (הכרעה 2). "דיילות" מצוירת .masked כדוגמה. -->
  <div class="tabs" role="tablist">
    <button class="tab on" role="tab" aria-selected="true">הנהלה</button>
    <button class="tab" role="tab" aria-selected="false">כספים</button>
    <button class="tab masked" role="tab" aria-disabled="true" title="לא זמין בתפקידך">דיילות</button>
    <button class="tab" role="tab" aria-selected="false">לקוחות</button>
  </div>

  <div style="display:flex; gap:20px; align-items:flex-start">
    <!-- בורר-דוח (§2.7) -->
    <nav class="picker" aria-label="דוחות הלשונית">
      <button class="on">מבט-על</button>
      <button>1 · צמיחה ורווחיות</button>
      <button>2 · הנחות ↔ רווח</button>
      <button>4 · ריכוזיות לקוחות</button>
    </nav>

    <div style="flex:1; min-width:0">
      <!-- מסננים גלובליים (§2.5): תקופה · לקוח -->
      <div class="filters">
        <span style="font-size:12px; color:var(--s500)">תקופה:</span>
        <button class="pill">החודש</button>
        <button class="pill">3 חודשים</button>
        <button class="pill on">השנה</button>
        <button class="pill">הכול</button>
        <span style="font-size:12px; color:var(--s500); margin-right:8px">לקוח:</span>
        <button class="pill">הכול</button>
        <button class="btn btn-outline" style="margin-right:auto">ייצוא לאקסל</button>
      </div>

      <!-- שורת-"אז מה" — מחושבת, לא מנוסחת ע"י LLM (הכרעה 1) -->
      <p class="somuch">"הכנסות עד אוגוסט: 1,340,000 ₪, Δ 12% מול אשתקד; שולי-רווח 34%"</p>

      <!-- אריחי-KPI (StatTile) — לבן+מסגרת, השוואה-לתקופה-קודמת בכל אריח (הכרעה 4) -->
      <div class="tiles">
        <div class="tile"><span class="lb">הכנסות YTD</span><span class="vl">1,340,000 ₪</span><span class="sub">אשתקד: 1,196,000 ₪</span></div>
        <div class="tile"><span class="lb">שולי-רווח</span><span class="vl">34%</span><span class="sub">אשתקד: 31%</span></div>
        <div class="tile"><span class="lb">פרויקטים שהסתיימו</span><span class="vl">701</span></div>
        <div class="tile"><span class="lb">נתח 5 הגדולים</span><span class="masked">לא זמין בתפקידך</span></div>
      </div>

      <!-- כרטיס-גרף (§⑤): ציר-זמן LTR, cross-filter בלחיצה על עמודה -->
      <div class="chart-card" aria-label="הכנסה ורווח לפי חודש, גרף">
        <h3>הכנסה ורווח לפי חודש</h3>
        <div class="ltr" style="height:220px; display:flex; align-items:flex-end; gap:8px">
          <!-- שלד-דוגמה בלבד — עמודות אמיתיות דרך Recharts, §5.3 -->
          <div style="width:24px; height:60%; background:var(--teal600); border-radius:4px 4px 0 0"></div>
          <div style="width:24px; height:80%; background:var(--teal600); border-radius:4px 4px 0 0"></div>
          <div style="width:24px; height:45%; background:var(--red600); border-radius:4px 4px 0 0"></div>
        </div>
      </div>

      <!-- טבלת ListWindow (§2.5) -->
      <div class="chart-card" style="padding:0">
        <table>
          <thead><tr><th style="width:40%">פרויקט</th><th style="width:30%">הכנסה</th><th style="width:30%">רווח</th></tr></thead>
          <tbody>
            <tr class="click"><td>כנס-דוגמה</td><td class="ltr">42,000 ₪</td><td class="ltr">14,300 ₪</td></tr>
          </tbody>
        </table>
        <div class="pager">
          <span><span class="ltr">1–50</span> מתוך <span class="ltr">701</span></span>
          <div style="display:flex; gap:8px">
            <button class="btn btn-outline" style="padding:4px 12px; font-size:12.5px">הקודם</button>
            <span>עמוד <span class="ltr">1/15</span></span>
            <button class="btn btn-outline" style="padding:4px 12px; font-size:12.5px">הבא</button>
          </div>
        </div>
      </div>

      <!-- מצב-שגיאה/ריק — שלושת המצבים חייבים להיקרא שונה זה מזה -->
      <!--
      <div class="empty" role="alert"><p class="err">לא ניתן לטעון את הנתונים.</p><button class="btn btn-outline">נסי שוב</button></div>
      -->
    </div>
  </div>
</main>

</body>
</html>
```

**כללי-שימוש** (זהים למודול 5/8): ① בלוק `:root` לא נוגעים ② כל ערך שאינו עברית טהורה עובר
דרך `class="ltr"` ③ שני מספרים באותו משפט — מפרקים, מילה עברית ביניהם (§3.3) ④ שם-הקובץ
באנגלית, `docs/mockups/reports-screen/drafts/` ואז `approved/` עם סיומת `_approved.html` ⑤
**השלד הוא גלריית-רכיבים, לא מוקאפ** — פטור מכלל-הבית `🚫 אין המצאת שם/מק"ט/לקוח/תאריך`;
**המוקאפים עצמם אינם פטורים** — הדאטה-לציור נקבע ב-`seed-plan.md` (שלב 1-ד, "היום" אחד לכל
המוקאפים).

🔴 **מה חסר עדיין, ואינו חלק מהחוזה הזה:** מערך-נתונים חי לציור (מקביל ל-`data-set.md` של
מודול 5) — זה `seed-plan.md`, שכבר קיים ובכיוון-אושר (הכרעות 10–11) אבל טרם נגמר. צייר שמקבל
רק את השלד הזה בוחר דאטה משלו עד ש-`seed-plan.md` ננעל.

---

## ⑦ מה נמדד היום — כולל מה שלא נמצא

**קבצים ופקודות שנקראו/רצו (06/09/2026), לפי סדר:**

1. `docs/specs/module_08_finance/design-contract.md` (861 שורות) — נקרא במלואו, כתקדים-מבנה.
2. `src/CLAUDE.md` (סעיפי RTL/כיווניות/חמשת-המעברים/מודל-אבטחה) — נקרא במלואו.
3. `docs/PROJECT_MASTER.md` §4 — נקרא (עוגן-גריפ `כלל-מילוי`).
4. `docs/specs/module_11_reports/processes-approved.md` — נקרא במלואו (740 שורות): 0 · 0א2 ·
   טבלת-המשטחים (M=25) · ת1 · ת2 · 1-ג2 (חוזים חוצי-מודולים) · סוג-הגרף-לכל-דף · מילון-נעול ·
   הגדרות-17-הדוחות · הכרעות 1–4.
5. `grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/` — רץ מלא + סיכום-משפחות + בדיקת-נגד
   על 17 משפחות אחרות (§①) — **מצא סטייה שמודול 8 לא ראה** (`rose`/`emerald`, §1.3).
6. `git log -S` על שני אתרי-הקריאה של `rose`/`emerald` — לתיארוך מתי נכנסו (28/08, 05/09).
7. `src/components/{Money,StatTile,ScoreCell,PermissionAwareEmpty,LoadingOrError,FilterPill,
   ListWindow,Ltr,LtrFieldGroup,StatusTag}.jsx` + `src/lib/listWindow.js` + `src/lib/dashboard.js`
   — נקראו במלואם.
8. `src/modules/08_finance/FinancePage.jsx` (grep ממוקד על `TabsBar`) · `src/modules/07_dashboard/
   KpiStrip.jsx` (במלואו — התקדים המדויק למיסוך-אריחים) · `src/modules/09_settings/components/
   GroupList.jsx` (במלואו — התקדים הקרוב ביותר לבורר-דוח) · `src/components/layout/
   ProtectedRoute.jsx` (במלואו).
9. `src/components/layout/{Sidebar,Topbar,MainLayout}.jsx` (grep על `w-60`/`w-16`/`h-16`) ·
   `src/lib/constants.js` (`BUSINESS_MODULES`) — לאימות-נגד, לא נמדד מחדש (זהה למודול 8).
10. `node_modules/tailwindcss/theme.css` + `src/index.css` — `--primary`/`--radius`/`--font-sans`.
11. `grep -rn "recharts" src/` — 0 תוצאות, אומת ש-Recharts אינו בשימוש בשום מקום.
12. `grep -rn "gradient" src/` — 0 תוצאות (§5.2 #2).
13. `scripts/check-bidi-glyphs.mjs` — נקרא (`RISK_GLYPHS = ['₪', '★', '×']`).
14. `grep -rn "aria-current" src/modules` — תוצאה אחת (`GroupList.jsx`), אישרה שאין תקדים שני.

**מה לא נמצא, ונרשם ככזה:** בורר-דוח מדויק (§2.7, `GroupList` הוא הקרוב ביותר, לא זהה) ·
כל שימוש ב-Recharts (§⑤, כל הסעיף "לא אומת" במקומות המסומנים) · `sr-only` פעיל ב-`src/
components` (§5.2 #4). **מה לא נבדק כאן בכוונה:** תוכן-דאטה אמיתי לציור — זה `seed-plan.md`,
בכיוון-אושר אך לא נעול (§⑥, הפער הפתוח).

</div>
