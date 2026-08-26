<div dir="rtl">

# חוזה-העיצוב — מודול 8 (כספים וסגירת אירוע)

> 🔴 **החוק שהמשימה הזו נפתחה איתו, כלשונו:** **`processes-approved.md` הוא הקובץ היחיד בתיקיית-
> האפיון הרשאי לקבוע כלל-מוצר.** הקובץ הזה נושא **מדידות, פלטות ודאטה בלבד**. תפסתי את עצמי כותב
> כלל ("המסך צריך…", "החלון חייב…") ⇒ עצרתי: או שהוא מצוטט כמצביע להכרעה קיימת
> (`🔗 מראת <הכרעה> — SSOT: processes-approved.md`), או שהוא לא נכתב כלל. **הכרעות מודול 8 כולן
> סגורות ויציבות** (`processes-approved.md`, טבלת-המצב) — הקובץ הזה אינו משחזר אף אחת מהן, רק
> מצביע אליה כשצריך את התוכן שלה כדי להסביר איך רכיב נראה.

> **מה הקובץ הזה כן:** מדידות-עיצוב עבור ששת הפריטים שהוזמנו לשלב 2 (משטחים) — פלטה ·
> רכיבים-משותפים-לשימוש-חובה · כיווניות (RTL) · כלל-המילוי · שלד-HTML-להעתקה · שיוך ארבעת
> המשטחים המאושרים (S1–S4) לתקדים קיים במערכת. כל טענה נושאת נתיב-קובץ **ועוגן-גריפ** (מחרוזת
> לחיפוש), לא מספר-שורה — מספרי-שורה מתיישנים בעריכה הבאה מעליהם.

> **מה הקובץ הזה אינו:** אינו כרטיס-מסך, אינו מוקאפ, ואינו מכריע מה מוצג בכל משטח — זה
> `processes-approved.md` ו-(כשייכתב בשלב הבא) `screens-approved.md` של מודול 8. סעיף ⑥ למטה
> **משייך** משטח לתקדים-קיים; הוא אינו קובע אילו שדות/עמודות/כפתורים המשטח הזה מציג.

> 🔑 **הצורה המחייבת של ההפניה לקובץ הזה (תקדים ממודול 5, `design-contract.md §ראש-המסמך`):**
> תמיד בשם המלא **`docs/specs/module_08_finance/design-contract.md §N`** — לעולם לא `§N.M` חשוף
> בלי שם-קובץ. הפניה חשופה היא בדיוק הפגם שנתפס באפיון-מ6 (תשע הפניות ל-`_design-contract.md`
> שלא היה קיים בריפו) ותוקן.

---

## ① הפלטה — נמדדה, לא הועתקה

### 1.1 הפקודה שרצה (26/08/2026), על כל `src/`

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sort | uniq -c | sort -rn
```

**התוצאה המלאה — 51 utilities נבדלים, 1,514 מופעים. בלי רשימת-משפחות מקודדת מראש**, כדי שמשפחה
שישית תהיה גלויה אם היא קיימת (ר' 1.4):

| # | ה-utility | מופעים | # | ה-utility | מופעים |
|:-:|---|--:|:-:|---|--:|
| 1 | `text-slate-500` | 227 | 27 | `text-red-700` | 10 |
| 2 | `text-slate-700` | 128 | 28 | `border-teal-600` | 9 |
| 3 | `border-slate-200` | 105 | 29 | `bg-teal-100` | 9 |
| 4 | `border-slate-300` | 101 | 30 | `border-teal-200` | 8 |
| 5 | `text-slate-400` | 94 | 31 | `text-teal-800` | 7 |
| 6 | `text-slate-600` | 81 | 32 | `bg-amber-200` | 6 |
| 7 | `text-slate-800` | 79 | 33 | `text-slate-300` | 5 |
| 8 | `text-teal-700` | 74 | 34 | `bg-amber-100` | 5 |
| 9 | `text-red-600` | 73 | 35 | `text-green-600` | 4 |
| 10 | `bg-slate-50` | 53 | 36 | `border-red-200` | 4 |
| 11 | `border-slate-100` | 46 | 37 | `bg-red-600` | 4 |
| 12 | `bg-amber-50` | 40 | 38 | `bg-red-100` | 4 |
| 13 | `bg-teal-600` | 38 | 39 | `text-red-800` | 3 |
| 14 | `text-amber-700` | 36 | 40 | `border-teal-300` | 3 |
| 15 | `bg-slate-100` | 33 | 41 | `border-red-600` | 3 |
| 16 | `text-amber-800` | 29 | 42 | `border-green-200` | 3 |
| 17 | `bg-teal-700` | 27 | 43 | `bg-green-700` | 3 |
| 18 | `border-amber-200` | 26 | 44 | `text-amber-600` | 2 |
| 19 | `bg-teal-50` | 19 | 45 | `border-teal-500` | 2 |
| 20 | `text-green-700` | 18 | 46 | `border-red-300` | 2 |
| 21 | `bg-green-100` | 18 | 47 | `bg-red-700` | 2 |
| 22 | `border-red-500` | 15 | 48 | `bg-green-50` | 2 |
| 23 | `bg-red-50` | 15 | 49 | `border-teal-100` | 1 |
| 24 | `text-teal-600` | 13 | 50 | `border-slate-400` | 1 |
| 25 | `bg-slate-200` | 12 | 51 | `bg-green-600` | 1 |
| 26 | `border-amber-300` | 11 | | | |

*(51 utilities, 26+25 עמודות. אומת בסקריפט אחרי הכתיבה: סכום שתי העמודות = 1,514 — זהה למונה
בסעיף 1.2 ולסכום-הידני של רשימת-הגלם. הגרסה הראשונה של הטבלה הזאת השמיטה בטעות שתי שורות
[`text-red-700`=10, `border-amber-300`=11] בעימוד הידני לשתי עמודות — נתפס ותוקן באותו סשן, לפני
מסירה, ע"י `diff` בין הטבלה לרשימת-הגלם המקורית.)*

### 1.2 סיכום-לפי-משפחה — נמדד, לא נספר ביד

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sed -E 's/^(bg|text|border)-([a-z]+)-[0-9]{2,3}$/\2/' | sort | uniq -c | sort -rn
```

| משפחה | סה"כ מופעים |
|---|--:|
| `slate` | 965 |
| `teal` | 210 |
| `amber` | 155 |
| `red` | 135 |
| `green` | 49 |
| **סה"כ** | **1,514** |

**מחוץ לצורת-הביטוי של החיפוש** (`grep -rhoE "(bg|text)-white" src/`): `bg-white` ×87 ·
`text-white` ×35 — לא נספרים בטבלה כי אין להם גוון מספרי, אבל הם חלק אינטגרלי מהפלטה (רקע-כרטיס
לבן, טקסט על-כפתור-מלא).

### 1.3 בדיקת-נגד — האם יש משפחה שישית?

```
grep -rhoE "(bg|text|border)-(blue|purple|orange|indigo|sky|violet|yellow|emerald|gray|zinc|neutral|stone|cyan|lime|pink|rose|fuchsia)-[0-9]{2,3}" src/
```

**פלט ריק — אפס מופעים על 17 משפחות אחרות שנבדקו.** אין כחול, אין סגול, אין כתום, אין `gray`/
`zinc`/`neutral`/`stone` (רק `slate`). ⇒ **חמש המשפחות שבטבלה הן כל הפלטה של `src/` נכון
ל-26/08/2026 — לא רק "אלה שנספרו".** מוקאפ של מודול 8 שמכניס צבע שישי הוא סטייה, לא בחירה.

*(השוואה ל-21/08/2026, המדידה המקבילה שרצה עבור מודול 5, `docs/specs/module_05_logistics/
design-contract.md §1.1`: אז נמדדו 1,423 מופעים ב-5 משפחות. חמשת הימים שביניהם הוסיפו 91 מופעים —
בעיקר עבודת-מודול-6 שנמשכה — ואפס משפחות חדשות. הפלטה יציבה.)*

### 1.4 הערכים בפועל — Tailwind v4, לא Tailwind v3

הפרויקט על **Tailwind 4**, שבו כל צבע מוגדר ב-OKLCH והערכים **נבדלים** מהקסה של v3 שרבים זוכרים
בעל-פה. אומת מחדש היום (26/08/2026): `src/index.css`, עוגן-גריפ `--primary: #0d9488` —
`--primary` הוא **מחרוזת-הקסה מוקלדת-ביד**, לא צבע-Tailwind. לעומתו `node_modules/tailwindcss/
theme.css`, עוגן-גריפ `--color-teal-600:` ⇒ `oklch(60% 0.118 184.704)`.

| טוקן | ערך (sRGB) | טוקן | ערך (sRGB) |
|---|---|---|---|
| `slate-50` | `#F8FAFC` | `teal-50` | `#F0FDFA` |
| `slate-100` | `#F1F5F9` | `teal-100` | `#CBFBF1` |
| `slate-200` | `#E2E8F0` | `teal-200` | `#96F7E4` |
| `slate-300` | `#CAD5E2` | `teal-500` | `#00BBA7` |
| `slate-400` | `#90A1B9` | `teal-600` | `#009689` |
| `slate-500` | `#62748E` | `teal-700` | `#00786F` |
| `slate-600` | `#45556C` | `amber-50` | `#FFFBEB` |
| `slate-700` | `#314158` | `amber-100` | `#FEF3C6` |
| `slate-800` | `#1D293D` | `amber-200` | `#FEE685` |
| `green-50` | `#F0FDF4` | `amber-300` | `#FFDF20` |
| `green-100` | `#DCFCE7` | `amber-700` | `#BB4D00` |
| `green-200` | `#B9F8CF` | `amber-800` | `#973C00` |
| `green-700` | `#008236` | `red-50` | `#FEF2F2` |
| `white` | `#FFFFFF` | `red-100` | `#FFE2E2` |
| `--primary` (טוקן) | `#0D9488` | `red-200` | `#FFC9C9` |
| | | `red-500` | `#FB2C36` |
| | | `red-600` | `#E7000B` |

🔴 **הערכים לא הומרו מחדש ב-OKLCH היום — הם מאומצים מהמדידה שכבר בוצעה ואומתה פעמיים
ב-21–22/08/2026** (`design-contract.md` של מודול 5, §1.2 + §⑧ שורה 1: "29 ערכי-ההקס הומרו שנית
מ-OKLCH באופן בלתי-תלוי — כולם נכונים") **ובנוסף הוצלבו** נגד המוקאפ המאושר החי `docs/mockups/
logistics-screen/approved/01_overview_approved.html` (עוגן-גריפ: `--teal600:#009689`) — התאמה
מלאה, ספרה-בספרה. **אין סיבה למדוד שוב את אותה קבוצת-קבועים גלובלית של Tailwind 4** שאינה תלוית-
מודול; מה שכן נמדד מחדש כאן, בעצמאות, הוא **הרשימה** (§1.1–1.3) — שכן משתנה בין מודולים ובין
תאריכים.

### 1.5 🔴 הסתירה מול `PROJECT_MASTER §4` — קיימת, ולא הוכרעה כאן

`PROJECT_MASTER §4` (עוגן-גריפ: `פרימרי — טורקיז/teal`) כותב: *"פרימרי — טורקיז/teal `#0D9488`
(teal-600, מחווט ל-token `--primary`)"*. **המדידה אומרת ששני חצאי-המשפט אינם אותו צבע:**

| הצד | הערך בפועל | מי משתמש בו | העוגן |
|---|---|---|---|
| **הטוקן** `--primary` | `#0D9488` (מילולי) | `<Button>` ברירת-מחדל (`bg-primary`) · `variant="link"` (`text-primary`) | `src/index.css`, עוגן-גריפ `--primary: #0d9488` |
| ה-**utility** `bg-teal-600` | `#009689` (Tailwind 4, OKLCH) | 38 אתרי-קריאה — כולל כפתור-האישור של `ConfirmDialog` | `src/components/ConfirmDialog.jsx`, עוגן-גריפ `bg-teal-600 hover:bg-teal-700` |

⇒ `#0D9488` היה `teal-600` ב-Tailwind 3; ב-Tailwind 4 הוא כבר לא. שני טורקיזים שונים חיים היום
זה לצד זה על המסך. **זו אותה עובדה שנתפסה במודול 5** (§1.3 שם) ולא הוכרעה שם — **אין הכרעת-צבע
כאן גם עבור מודול 8** (כלל ברזל 8: הכרעת-צבע היא של ישי). **ההנחיה הקיימת לציור, שכבר אומצה
פעמיים** (מוקאפי מודול 5 ומודול 6 גם יחד): לחקות את המצב הקיים ולא לאחד אותו — `#0D9488` רק היכן
שהאפליקציה מושכת מהטוקן, ו-`#009689` בכל מקום שהאפליקציה כותבת `bg-teal-600` (רוב-מוחלט התצוגה:
כפתור-ראשי, תג, גלולה).

---

## ② רכיבים-משותפים — שימוש-חובה, לא המצאה מחדש

### 2.1 `Money` — הדרך היחידה להציג ₪

`src/components/Money.jsx`. **הצורה הקנונית: מספר ואז `₪` מימינו**, זהה למה ש-`quotePdf.jsx`
מדפיס ללקוח — עוגן-גריפ בקובץ עצמו: `הצורה הקנונית` (השורה: *"מספר ואז ₪ מימינו — זהה למה
ש-quotePdf.jsx מדפיס ללקוח"*). הרכיב עוטף `<Ltr>` סביב הפלט של `formatShekelWhole`/
`formatShekelExact`/`formatShekelCents` (`src/lib/pricing.js`).

```jsx
<Money amount={n} />           {/* ברירת-מחדל: שקלים שלמים */}
<Money amount={n} exact />     {/* אגורות, גם כש-.00 */}
<Money amount={n} cents />     {/* אגורות — למחיר-יחידה, לא לסכום מצטבר */}
```

🔴 **חובה למודול 8 באופן מיוחד — זהו המודול היחיד שכל מסך בו נושא סכומי-כסף כתוכן מרכזי.** כתיבת
סכום ידנית ב-JSX (`{amount} ₪`) **מתהפכת** לפי ההקשר-העברי שסביבה בלי שגיאה (`src/CLAUDE.md §🔤`,
המופע השביעי — סכום ידני הציג ₪ **משמאל** לספרות באותו מסך שבו `Money` הציג נכון).

### 2.2 `StatTile` — אריח-מדד, לבן+מסגרת בלבד

`src/components/StatTile.jsx`.

```jsx
<StatTile label="…" value={numberOrNode} sub="…" emptyText="אין נתונים עדיין" />
```

- **הצורה:** `rounded-xl border border-slate-200 bg-white p-4`, `flex flex-col items-start
  gap-0.5` — **תווית מעל הערך** (עוגן-גריפ: `rounded-xl border border-slate-200 bg-white p-4`).
- תווית `text-xs text-slate-500` · ערך `text-xl font-bold text-slate-800` · שורת-משנה
  `text-[11px] text-slate-500`.
- `value` מספרי עובר **אוטומטית** דרך `Money`; `value == null` מציג `emptyText` (ברירת-מחדל
  "אין נתונים עדיין"), **לא `0`**.
- **מעטפת-האריחים היא `flex flex-wrap`, לעולם לא `grid` שנמתח לרוחב-מלא** (הכרעת-ישי 08/08/2026,
  עוגן-גריפ בקובץ: `לעולם לא \`grid\` שמותח לרוחב-מלא`).

🔴 **מוקש נמדד בפועל במודול 4 — רלוונטי במיוחד למודול 8:** `StatTile` הופך מספר לשקלים
אוטומטית; אריח שערכו **אינו** כסף (למשל מונה-ימים, אחוז) חייב לעבור כ-`value={<Ltr>…</Ltr>}` או
כמחרוזת, לא כמספר גולמי — אחרת "₪" מודפס על נתון שאינו כסף (`04_hostesses/CLAUDE.md`, עוגן-גריפ:
`StatTile\` הופך מספר לשקלים אוטומטית`).

### 2.3 `LtrFieldGroup` — קבוצת-שדות בכיוון הפוך (טווח, נוסחה)

`src/components/LtrFieldGroup.jsx`. `items` — מערך משמאל-לימין: `{id,label,value,readOnly}` /
`{id,label,inputProps}` / `{op:'÷'}`. **שורת-התוויות ושורת-הערכים נגזרות מ**אותו מערך**, אותו
סדר** — כתיבתן כשתי שורות נפרדות היא הבאג שהרכיב קיים כדי למנוע (קרה שלוש פעמים, `src/CLAUDE.md
§🔤`).

```jsx
<LtrFieldGroup
  items={[
    { id: 'a', label: 'הכנסות', value: <Money amount={x} />, readOnly: true },
    { op: '−' },
    { id: 'b', label: 'הוצאות', value: <Money amount={y} />, readOnly: true },
  ]}
/>
```

**רלוונטי במיוחד ל-S2/S3** — נוסחת-הרווח-הגולמי (הכנסות-נטו − הוצאות-ישירות) ומדרג-הפיצוי
בביטול הם בדיוק הצורה ש-`LtrFieldGroup` נבנתה בשבילה: ביטוי-חשבוני שקורא נכון בעברית. `item.
invalid` צובע תא אדום + `aria-invalid` לשדה-קלט שגוי בתוך הקבוצה.

### 2.4 תגי-סטטוס וסרגלי-לשוניות — שני תקדימים זהים, לא רכיב חדש

**‏`StatusTag` (`src/components/StatusTag.jsx`)** — שש טונים בלבד, **המפתח הוא התווית המוצגת, לא
ה-enum** (עוגן-גריפ: `המפתח הוא התווית המוצגת`):

| טון | מחלקות | ערכים | מתי |
|---|---|---|---|
| `ok` | `bg-green-100 text-green-700` | `#DCFCE7`/`#008236` | סגור, אין מה לעשות |
| `teal` | `bg-teal-100 text-teal-700` | `#CBFBF1`/`#00786F` | בתנועה |
| `muted` | `bg-slate-100 text-slate-500` | `#F1F5F9`/`#62748E` | ניטרלי/ממתין |
| `warn` | `bg-amber-200 text-amber-800` | `#FEE685`/`#973C00` | אזהרת-היגיינה |
| `outline` | `bg-slate-100 text-slate-600 border border-slate-200` | — | — |
| `dashed` | `bg-slate-100 text-slate-500 border border-dashed border-slate-300` | — | הושבת/בוטל |

צורה: `inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold`.
**שמונת סטטוסי-הפרויקט כבר ממופים ב-`src/lib/projects.js`, `PROJECT_STATUS_TONES`** (מיובא
ל-`StatusTag` דרך spread) — כולל `ממתין לחשבונית`=`muted`, `ממתין לתשלום`=`muted`,
`פרויקט הסתיים`=`ok`, שלוש התוויות שמודול 8 עצמו קורא/כותב.

**סרגל-לשוניות — נמדד **פעמיים** באותו קובץ ובאותה מחלקות בדיוק, ולכן זה תקדים יציב ולא מקרי:**

- **ברמת-עמוד** (מבט-על, 3 לשוניות עם מונה) — `src/modules/06_projects/ProjectsPage.jsx`, פונקציה
  `TabsBar` (עוגן-גריפ: `function TabsBar({ active, counts, onSelect })`):
  `role="tablist"` על מעטפת `-mx-4 flex gap-1 border-b border-slate-200 px-4`; כל לשונית
  `role="tab" aria-selected={…}`, `-mb-px border-b-2 px-4 py-2.5 text-sm`, פעילה = `border-teal-
  600 font-semibold text-teal-700`, כבויה = `border-transparent font-medium text-slate-500`,
  ומונה `<Ltr>` צמוד בתוך אותו כפתור — **מוצג גם כשהוא `0`**.
- **ברמת-כרטיס** (בתוך `ProjectCardPage`, כרטיס-פרויקט) — `src/modules/06_projects/
  ProjectCardPage.jsx`, פונקציה `TabsBar` (עוגן-גריפ: `function TabsBar({ tab, onSelect,
  closing })`): **אותן מחלקות בדיוק, שם-פונקציה זהה, שני קבצים שונים** — `baseTab`/`onCls`/
  `offCls` הם עותק-בייט. מוסיפה גם דוגמה ל**לשונית-מושבתת-עם-נימוק** (`disabled` + טקסט-הסבר
  `text-[11px] font-normal text-slate-400` בתוך התווית עצמה — לא נעלמת, נשארת ומנומקת).

⇒ **מסך מבט-הכספים (S1) — שלוש לשוניות: ממתין-לחשבונית · ממתין-לתשלום · הסתיים — נמצא בדיוק
בתבנית שה-TabsBar הזה כבר מיישם פעמיים.** ר' גם §⑥ למטה.

**גלולת-מסנן** — `src/components/FilterPill.jsx`: כבוי `border-slate-200 bg-white text-slate-
600`; דלוק `border-teal-200 bg-teal-50 text-teal-700 font-semibold` (טורקיז **בהיר** — הטורקיז
המלא שמור לפעולה הראשית); `tone="warn"` דלוק = `border-amber-200 bg-amber-50 text-amber-700 font-semibold`;
מושבת = `opacity-50` **בלי להיעלם** (עוגן-גריפ: `disabled` אינו "להעלים"`). צורה:
`h-auto rounded-full border px-3 py-1 text-[12.5px]` + `aria-pressed`.

### 2.5 דיאלוגים — שני שלדים קיימים, שני רוחבים

**המעטפת המשותפת** — `src/components/ui/dialog.jsx`: `DialogContent` ברירת-מחדל `sm:max-w-lg`
(**512px**), `flex max-h-[90vh] flex-col overflow-hidden rounded-xl border shadow-lg`, גלילה
**פנימית** (`overflow-y-auto` על ה-`div` הפנימי, לא על האלמנט המעוגל — הערת-הקוד: פס-גלילה על
הפינה המעוגלת שובר את הפינה, נתפס 29/07/2026). `DialogHeader` — `text-center sm:text-right`.
`DialogFooter` — `flex-col-reverse sm:flex-row sm:justify-start` (בעברית: הכפתור **הראשון**
ב-JSX יושב **הכי ימני**). כפתור-הסגירה **בפינה השמאלית** (`absolute top-4 left-4`) — כל דיאלוג
שנפתח ב-portal מקבל `dir="rtl"` מפורש (`src/CLAUDE.md`, אין `DirectionProvider` בפרויקט).

**רוחב-שני:** `sm:max-w-3xl` (**768px**) — `src/modules/06_projects/ScopeChangeDialog.jsx`,
עוגן-גריפ `<DialogContent dir="rtl" className="sm:max-w-3xl">`. זה הדיאלוג הרחב ביותר שנמדד
בקוד — נבחר כשהתוכן הוא **טבלת-שורות עריכה**, לא טופס-שדות. **רלוונטי ל-S3** (תצוגה-מקדימה של
דוח-שכר, שהיא בפועל טבלה) יותר מהרוחב הצר.

**שני דפוסי-תוכן מדודים מ-`CancelProjectDialog.jsx`, רלוונטיים ישירות ל-S2** (חלון סגירת-תיק,
המקרה השני של "פעולה עם השלכה כספית שצריך לראות לפני שמאשרים"):

1. **באנר-השלכה** — `rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs
   leading-relaxed text-amber-800`, שורות עם גליף-מוביל קבוע-רוחב (`w-[13px] flex-none
   text-center`) ואז תוכן. **ענבר, לא אדום** — התראה-מדווחת, לא שגיאה. עוגן-גריפ:
   `function BannerRow`.
2. **קבוצת-בחירה כרדיו-כרטיסים** — `role="radio"` על `<button>`, לא `<input type="radio">`
   מוסתר: `flex items-start gap-2 rounded-lg border px-3 py-2 text-right`, נבחר =
   `border-teal-200 bg-teal-50`, גליף `⦿`/`○` בעמודה קבועה-רוחב, כותרת-אפשרות
   `text-[13.5px] font-semibold text-slate-800` + תיאור `text-[11.5px] text-slate-500` +
   שורת-השלכה-כספית `text-[11.5px] font-semibold text-amber-700`. עוגן-גריפ:
   `function TypeOption`.
3. **כפתור-הרס = מסגרת אדומה, לעולם לא מילוי** — `h-auto rounded-lg border-red-200 bg-red-50
   px-4 py-2 text-red-600 hover:bg-red-100` (עוגן-גריפ: `function CancelFooter`). מילוי-אדום
   מלא **אינו קיים באף מקום ב-`src/`**. הכפתור המשני הוא "חזרה", לא "ביטול" — שתי משמעויות
   הפוכות ("שם-הפעולה ההרסנית" מול "כפתור-סגירה") לא חולקות מילה בעברית.
4. **גוף-הדיאלוג ממונטש רק כשהוא פתוח** — `{open && project ? <Body …/> : null}` — כל פתיחה
   מתחילה ממצב טרי דרך remount, לא `useEffect` שמסנכרן props→state (`src/CLAUDE.md`,
   כלל-האיפוס-בדיאלוג).

### 2.6 טבלה/רשימה — שתי צורות מדודות, לפי סוג-התוכן

**טבלת-שורות עם עמודות-רוחב-קבוע** — `src/modules/05_logistics/LogisticsPage.jsx`, פונקציות
`Th`/`Td` (עוגן-גריפ: `function Th({ children, className })`):
- `<table className="w-full border-collapse">`.
- `Th`: `border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold whitespace-
  nowrap text-slate-500` + רוחב-אחוזי inline (`w-[26%]` וכו').
- `Td`: `border-b border-slate-100 px-2.5 py-2.5 align-middle`.
- שורה-לחיצה: `tabIndex={0}` + `onKeyDown` (Enter/רווח) + `aria-label` + `cursor-pointer
  focus-visible:ring-2 focus-visible:ring-teal-500` — נגישות-מקלדת נבנית **בכל מסך-טבלה מחדש**,
  אינה ירושה מרכיב-משותף (`src/CLAUDE.md`, "שורת-טבלה: אותה תבנית, ולא כל מסך קיבל אותה").
  כל פקד **בתוך** שורה-לחיצה חייב `onClick={(e) => e.stopPropagation()}`.
- שורה עם התרעה = `bg-amber-50`, **לעולם לא אדום** — אדום במערכת אומר "חסום" (עוגן-גריפ:
  `⑳ — סימון-ההתרעה`).

**כרטיס-זהות עם תאי-שדה נעולים-לעיון** — `src/modules/06_projects/ProjectCardPage.jsx`,
פונקציות `Cell`/`Val`/`Sub` (עוגן-גריפ: `function Cell({ label, children, testId })`):
```jsx
<Cell label="ח.פ" testId="…"><Val>…</Val></Cell>
```
- `Cell`: `flex min-w-0 flex-col items-start gap-0.5` — **תווית מעל ערך**, אותו עיקרון
  כמו `StatTile` אך ל**שדה בודד**, לא למדד-מספר-גדול.
- תווית: `text-xs text-slate-500`.
- `Val`: ערך רגיל `text-sm font-semibold text-slate-800`; `Val empty`: `text-sm font-medium
  text-slate-400` (ערך-ריק אפור ולא-מודגש — "0 נקרא כעובדה שקרית", מקף/מילים לא).
- `Sub`: `text-[11px] text-slate-500` — שורת-הסבר תחת הערך.
- הכרטיס עצמו: `rounded-xl border border-slate-200 bg-white p-4 shadow-sm`, שדות בגריד
  `grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4`.

⇒ **רלוונטי ישירות ל-S2** — שלושת השדות-הנעולים-לעיון של חלון-הסגירה (ח.פ · איש-קשר ·
מייל-לחיוב) הם בדיוק צורת `Cell`+`Val` הקיימת, לא שדה-קלט מושבת.

### 2.7 מצבי ריק/חסום/שגיאה — שני רכיבים, שלושה מצבים

**`PermissionAwareEmpty`** (`src/components/PermissionAwareEmpty.jsx`) — `state`: `'empty'` /
`'noPermission'` / `'error'`. כותרת-השגיאה **נעולה בקובץ**: `לא ניתן לטעון את הנתונים.`
(עוגן-גריפ: `const ERROR_TITLE`), כפתור-נסיון-חוזר **נעול**: `נסי שוב` (נקבה — S-28, ר' §③ למטה).
`state="noPermission"` מציג מנעול דקורטיבי (`🔒`, `aria-hidden`) + המשפט המלא שהמסך מעביר.
**מונה חסום מציג `—` (`export const DENIED_MARK`), לעולם לא `0`** — `0` נקרא כעובדה, `—` נקרא
כ"אין לי את הנתון". `deniedValue(canRead, value)` הוא העזר: הדגל המפורש מהשרת מכריע, לא
`value === null` (null חוקי גם כערך-אמיתי).

**`LoadingOrError`** (`src/components/LoadingOrError.jsx`) — `skeleton={{variant, …}}`:
`table`/`cards`/`card`/`fields`/`page`. **וריאנט `fields` הוא הרלוונטי ביותר לדיאלוגי-טופס
כמו S2/S3** — תווית-קצרה+קלט-מלא בשורות (עוגן-גריפ: `function FieldsSkeleton`). ברירת-מחדל של
`retryLabel` היא **`'נסה שוב'` — זכר**; דריסה מפורשת ל-`'נסי שוב'` נדרשת בכל אתר-קריאה חדש
(ר' §③).

**המחרוזות הן חוזה — לא מנוסחות מחדש פר-מודול.** דוגמה-לתבנית מהקוד: `LEGAL_EMPTY_TITLE` /
`NO_PERMISSION_SENTENCE` / `LOAD_FAILURE_DETAIL` יושבים ב-`src/lib/projectLogistics.js` (SSOT
של מודול 5); מודול 8 יבנה מקבילות משלו באותו מקום-בעלות (`src/lib/…js` של מודול 8, כשייכתב),
לא בקומפוננטה.

### 2.8 טוסטים — הודעת-רגע, לא חוסמת

`src/components/ToastProvider.jsx` — **אין `sonner`, אין ספריית-צד-שלישי; Provider תפור-בית**
(`package.json` — לא נמצא `sonner`). API: `toast.success(msg)` / `toast.error(msg)` /
`toast.info(msg)`, דרך `useToast()`.

- **מיקום:** מרכז-תחתון, צף (`fixed bottom-4 left-1/2 … -translate-x-1/2`), נערם כשיש כמה.
- **דחייה-אוטומטית:** `AUTO_DISMISS_MS = 4000` (4 שניות) + כפתור-`X` לסגירה ידנית.
- **שלושה וריאנטים, לפי שפת-העיצוב §4:** `success` = `bg-teal-50 border-teal-200 text-teal-800`
  (אייקון `CheckCircle2`) · `error` = `bg-red-50 border-red-200 text-red-800` (`AlertCircle`) ·
  `info` = `bg-slate-50 border-slate-200 text-slate-700` (`Info`). שלושתם מ-`lucide-react`.
- **הכרזת-נגישות שונה לפי חומרה:** `error` = `role="alert" aria-live="assertive"` (מוכרז מיד);
  `success`/`info` = `role="status" aria-live="polite"`.
- צורה: `rounded-xl border px-4 py-3 shadow-md`, `dir="rtl"` על המעטפת.

⇒ **מודול 8 שולח מיילים אמיתיים (חשבונית, דוח-שכר) ומבצע מעברי-סטטוס בלתי-הפיכים** — בדיוק
המקום שבו הדפוס הקיים (`toast.success` על תוצאה + `toast.error` פר-נמענת-שנכשלה, התקדים המדויק:
`src/modules/06_projects/CancelProjectDialog.jsx`, פונקציה `reportCancellationMails`) חל ישירות.

---

## ③ כיווניות (RTL) — נמדד מ-`src/CLAUDE.md` ומרכיבים חיים

### 3.1 יוטיליטיז פיזיים בלבד — אפס לוגיים

`src/CLAUDE.md`, עוגן-גריפ: `הפרויקט משתמש ב-utilities פיזיות בלבד`: **`right-0`, `mr-60`,
`pr-9`, `text-right` — אין ולו `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` אחד בכל `src/`.**
`<html dir="rtl">` כבר מוגדר ⇒ יוטיליטי לוגי כמו `ms-60` נפתר ל**ימין** (אותו צד שהסרגל יושב בו)
והתוכן נוחת **מתחת** אליו — נראה תקין ב-LTR, שבור באפליקציה.

**מספרי-הפריסה, אומתו מחדש היום מול הקוד החי:** סרגל-צד `w-60` (240px, מכווץ `w-16`=64px) ·
סרגל-עליון `h-16` (64px, קבוע) · תוכן `mr-60`/`mr-16` תואם-מצב-הכיווץ (`src/components/layout/
Sidebar.jsx` + `Topbar.jsx` + `MainLayout.jsx`, עוגני-גריפ `'w-16' : 'w-60'` · `right-16'` ·
`mr-16'`).

### 3.2 שני רכיבי-בידוד חובה

| מה | הרכיב | הצורה | העוגן |
|---|---|---|---|
| סכום ב-₪ | `<Money amount={n}/>` | מספר, ואז ₪ מימינו | §2.1 למעלה |
| כל ערך לא-עברי-טהור (מספר, תאריך, שעה, אחוז, קוד, **כתובת-מייל**) | `<Ltr>…</Ltr>` | `direction:ltr; unicode-bidi:isolate; display:inline-block` | `src/components/Ltr.jsx` — תקדים לכתובת-מייל: `ProjectCardPage.jsx`, עוגן-גריפ `<Ltr>{project.owner_email}</Ltr>` |
| טווח/נוסחה (שדות בכיוון-הפוך) | `<LtrFieldGroup items={…}/>` | תוויות+ערכים מ**אותו** מערך | §2.3 למעלה |

### 3.3 🔴 שני מספרים ברצף — אין להם סדר נכון בכלל

`src/CLAUDE.md`, המופע התשיעי (עוגן-גריפ: `62% / 38%`): מדידת `Range` בדפדפן הראתה ש-`38%` נחת
**משמאל** ל-`62%` כשהם הודפסו כרצף `62% / 38%` — כל אחד עם בידוד עצמאי לא עוזר לרצף. **התיקון
הוא לפרק את הרצף, לא לבודד אותו** — כל מספר עובר לצד המילה שלו. הצורה הקיימת שכבר רצה חי
(`src/modules/06_projects/LogisticsTab.jsx`, עוגן-גריפ: `} מתוך {`):

```jsx
<Ltr>{String(ready)}</Ltr> מתוך <Ltr>{String(total)}</Ltr>
```

🔴 **רלוונטי ישירות למודול 8:** אחוזי-פיצוי, ימי-איחור, שעות-בפועל מול מתוכננות, וסכומים
עוקבים — כל אלה זוגות-מספרים באותו משפט. הדוגמה החיה בדיוק בתחום של מודול 8 (פיצוי-ביטול,
`src/modules/06_projects/CancelProjectDialog.jsx`, פונקציה `CompensationRow`):

```jsx
<b>פיצוי לדיילות: <Ltr>{percent === null ? '—' : `${percent}%`}</Ltr></b>
```

— אחוז יחיד תמיד, לעולם לא שני אחוזים באותה יחידת-משפט בלי מילה עברית ביניהם.

### 3.4 `npm run check:bidi` אינו רשת-ביטחון ל-`N/M`

`scripts/check-bidi-glyphs.mjs` תופס ספרה צמודה ל-`₪`/`★`/`×` **בלבד**. צורת-השבר `3/5` **אינה**
מכילה אחד מהשלושה ⇒ עוברת ירוק גם בלי בידוד. אין שער אוטומטי על מוקאפי-HTML בכלל. **המבחן היחיד:
לפתוח בדפדפן ולקרוא בעיניים, ובמיוחד בכל מקום עם שני מספרים באותו משפט.**

### 3.5 כל משטח שנפתח ב-portal מקבל `dir="rtl"` מפורש

אין `DirectionProvider` בפרויקט — `DialogContent`/`SelectContent`/`DropdownMenuContent` מקבלים
את התכונה כ-DOM attribute ידני. **רלוונטי ל-S2/S3** (דיאלוגים) ול-Radix `Select`/`Switch` אם
משטח מודול 8 ישתמש בהם.

### 3.6 מגדר — כל מחרוזת שמודול 8 כותב היא בלשון-נקבה

**עובדה קיימת, לא הכרעה חדשה כאן:** `S-28` (מודול 6) — **כל חמש המשתמשות במערכת נשים** (עוגן-
גריפ: `src/components/PermissionAwareEmpty.jsx`, `לשון-נקבה — S-28: כל חמש המשתמשות`). מודול 5
כבר אימץ את זה במפורש בחוזה-העיצוב שלו (§6 שם); מודול 8 יורש את אותה עובדה **מאותו מקור**, לא
מהכרעה עצמאית. הנפקה מעשית: `PermissionAwareEmpty` כבר נקבע (`נסי שוב`, אין פרמטר); `LoadingOrError`
צריך `retryLabel="נסי שוב"` **מפורש** בכל אתר-קריאה (ברירת-המחדל המשותפת `'נסה שוב'` היא חוב
חוצה-מערכת ל-מ12, לא של מודול 8 לשנות — התקדים: `src/modules/06_projects/CLAUDE.md`, עוגן-גריפ
`retryLabel="נסי שוב"`).

---

## ④ כלל-המילוי — SSOT: `PROJECT_MASTER §4`

**הציטוט המלא, מילה-במילה** (`docs/PROJECT_MASTER.md`, כותרת `## 4. שפה עיצובית כללית`, עוגן-
גריפ `כלל-מילוי — מתי צובעים רקע`):

> 🔑 **כלל-מילוי — מתי צובעים רקע, ומתי לא (הכרעת-ישי 07/08/2026, ולא רק למודול 4):**
> **מילוי-צבע (טורקיז/ירוק/ענבר/אדום) שמור למשמעות אמיתית** — פעולה ראשית אחת של המסך, אזהרה
> ממשית, או תג-סטטוס שמבדיל בין מצבים אמיתיים. **עובדה חיובית או מידע ניטרלי מוצג בלי מילוי**
> (מסגרת בהירה על רקע לבן — כמו `.chip.score` לעומת `.chip.good` שתוקן במסך 2 של מודול 4), **גם
> אם היא "עובדה טובה."** *(במילותיו, על צ'יפ: "עובדה טובה אינה צבועה"; מוכלל כאן מרצועת-הדגשים
> שהייתה כולה טורקיז-מלא בכרטיס-דיילת-לצפייה — כוכבים/יש-רכב/מספר-אירועים אינם פעולה ואינם
> אזהרה, ולא היו אמורים להיצבע כמו הכפתור הראשי.)* **הבדיקה:** אם הרכיב אינו הפעולה-האחת-של-המסך
> ואינו נושא אזהרה/הבחנת-מצב — הוא לבן+מסגרת, לא מילוי. **וזה כבר היה כתוב חלקית** ב-`src/CLAUDE.md`
> ("טורקיז מלא שמור לפעולה הראשית האחת של המסך") — הסעיף הזה מכליל אותו לכל צבעי-המילוי, לא רק
> טורקיז, ומעביר אותו לשפת-העיצוב הכללית כדי שכל מודול עתידי יראה אותו, לא רק `src/`.

**אותו כלל, בניסוח-קוד, ב-`StatTile.jsx` עצמו** (עוגן-גריפ: `כלל-המילוי`):

> 🎨 לבן + מסגרת אפורה, לעולם לא מילוי-צבע — כלל-המילוי (`PROJECT_MASTER §4`): מדד הוא **עובדה**,
> ומילוי שמור לפעולה-הראשית של המסך או לאזהרה. אריח-מדד צבוע מתחרה ויזואלית עם הכפתור הראשי, וזה
> בדיוק מה שהכלל נועד למנוע.

🔴 **רלוונטי במיוחד למודול 8, יותר מכל מודול אחר עד כה:** S1/S2/S3 כולם עתירי-מספרים-חיוביים
(רווח, יתרה, ציון-משוב, שעות). **הפיתוי הטבעי הוא לצבוע ירוק כל מספר טוב** — בדיוק המקרה שהכלל
נכתב נגדו (הדוגמה המצוטטת ב-§4: רצועת-דגשים שהייתה כולה טורקיז-מלא בכרטיס-דיילת ותוקנה). מדד
כספי חיובי מוצג ב-`StatTile`/`Cell`+`Val` (לבן+מסגרת) בדיוק כמו מדד שלילי — **הצבע שמור לפעולה
האחת, לא למספר עצמו.**

**שלושה צבעים שכן מיישמים משמעות אמיתית, וכבר קיימים למודול 8 לצרוך:** תג-סטטוס `ok`/`warn`
(§2.4) על שדה-סטטוס-משוב (ציון<3 = בירור-חובה) · באנר-אזהרה `bg-amber-50` (§2.5) על השלכה-כספית
לפני-אישור-סופי, בדיוק כמו שהוא כבר משמש בביטול-פרויקט.

---

## ⑤ שלד-HTML להעתקה — מבנה בלבד, מהמוקאפים המאושרים הכי טריים

**מקור — שני קבצים, לא אחד:** מבנה-העמוד (סרגל-צד/סרגל-עליון/טוקנים, למשטחי-העמוד-המלא S1/S4) —
`docs/mockups/logistics-screen/approved/01_overview_approved.html`. **דפוס-הדיאלוג** (`.dlg`/
`.dlg-head`/`.meta`/`.dlg-body`/`.dlg-foot` למטה, למשטחי-הדיאלוג S2/S3) — `docs/mockups/
logistics-screen/approved/02_dialog_checklist_approved.html`.

נבדק מול תאריכי-קובץ בפועל (`git log -1 --format=%ai`): `01_overview_approved.html`
`22/08/2026 12:17:50` · `02_dialog_checklist_approved.html` `22/08/2026 23:40:03` **— מעל 11 שעות
טרי יותר, באותה תיקיית-אישור של מודול 5** · מודול 6 `13/08/2026 21:28` (הישן מבין השלושה). *(תיקון:
הגרסה הקודמת של הסעיף הזה טענה "מודול 5 הוא המוקאפ המאושר הטרי ביותר בריפו" והשוותה רק מול מודול 6
— בלי לבדוק מול שאר תיקיית-האישור של מודול 5 עצמו, ולכן פספסה ש-`02` טרי יותר מ-`01`. `02` כבר נושא
דפוס-דיאלוג מלא ומאושר לאותו תקדים ש-S2/S3 מצטטים בעצמם [§2.5: `sm:max-w-3xl`/`ScopeChangeDialog.jsx`]
— ולכן דפוס-הדיאלוג נבנה עליו, ולא מומצא מחדש מקריאת `dialog.jsx`.)*

🚫 **מה שלא נכלל כאן במכוון:** תוכן ספציפי-למודול 5 (שורות-לוגיסטיקה, מק"טים, מספרי-דגמה) — הבקשה
היא "מבנה בלבד". גוף-התוכן של כל אחד מ-S1–S4 שייך למוקאפ עצמו, לא לשלד.

**הראש — פונטים, כיווניות, טוקנים** (הועתק מילולית מהמקור, עוגן-גריפ `--primary:#0D9488` +
`font-family:'Geist Variable'`):

```html
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>מוקאפ מ8 · &lt;שם המשטח&gt;</title>
<style>
/* ═══ טוקנים — אל תשנה ערך. מקור: §① למעלה + docs/mockups/logistics-screen/approved/. ═══ */
:root{
  --primary:#0D9488;
  --teal50:#F0FDFA; --teal100:#CBFBF1; --teal200:#96F7E4;
  --teal500:#00BBA7; --teal600:#009689; --teal700:#00786F;
  --green50:#F0FDF4; --green100:#DCFCE7; --green200:#B9F8CF; --green700:#008236;
  --amber50:#FFFBEB; --amber100:#FEF3C6; --amber200:#FEE685;
  --amber700:#BB4D00; --amber800:#973C00;
  --red50:#FEF2F2; --red100:#FFE2E2; --red200:#FFC9C9; --red600:#E7000B; --red700:#C10007;
  --s50:#F8FAFC; --s100:#F1F5F9; --s200:#E2E8F0; --s300:#CAD5E2;
  --s400:#90A1B9; --s500:#62748E; --s600:#45556C; --s700:#314158; --s800:#1D293D;
  /* --radius=0.625rem ⇒ md 8 · lg 10 · xl 14 · 2xl 18 (@theme inline ב-src/index.css) */
  --r-md:8px; --r-lg:10px; --r-xl:14px; --r-2xl:18px;
  --sidebar:240px;   /* w-60 */
  --topbar:64px;     /* h-16 */
}
*{box-sizing:border-box; margin:0; padding:0}
body{
  background:var(--s50); color:var(--s800);
  font-family:'Geist Variable','Geist',"Segoe UI",Arial,sans-serif;
  font-size:14px; line-height:1.5;
}

/* כל ערך שאינו עברית טהורה עובר דרך .ltr. שני מספרים ברצף: מפרקים (§3.3), לא מבודדים יחד. */
.ltr{ direction:ltr; unicode-bidi:isolate; display:inline-block; }

/* ── מעטפת: סרגל ימני + סרגל עליון. מאפיינים פיזיים בלבד (right/left, §3.1) ── */
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
.search{position:relative; width:288px; max-width:100%}
.search .mg{position:absolute; right:12px; top:50%; transform:translateY(-50%);
     color:var(--s400); font-size:13px}
.search input{width:100%; height:36px; border:1px solid var(--s200); border-radius:var(--r-lg);
     background:var(--s50); padding:0 36px 0 12px; font:inherit; font-size:14px; color:var(--s500)}
.who{display:flex; align-items:center; gap:8px}
.who .av{width:36px; height:36px; border-radius:999px; background:var(--teal600); color:#fff;
     display:flex; align-items:center; justify-content:center; font-weight:600}

main{margin-right:var(--sidebar); padding:calc(var(--topbar) + 24px) 24px 40px}
h1{font-size:20px; font-weight:700; color:var(--s800)}
.psub{font-size:12px; color:var(--s500); margin-top:2px}

/* ── כרטיס-תוכן ── */
.card{background:#fff; border:1px solid var(--s200); border-radius:var(--r-xl);
     box-shadow:0 1px 2px rgba(15,23,42,.06); padding:16px}

/* ── אריח-מדד (StatTile.jsx, §2.2): לבן+מסגרת, לעולם לא מילוי (§④) ── */
.tiles{display:flex; flex-wrap:wrap; gap:12px}
.tile{border:1px solid var(--s200); background:#fff; border-radius:var(--r-xl); padding:16px;
      display:flex; flex-direction:column; align-items:flex-start; gap:2px; min-width:180px}
.tile .lb{font-size:12px; color:var(--s500)}
.tile .vl{font-size:20px; font-weight:700; color:var(--s800)}
.tile .sub{font-size:11px; color:var(--s500)}

/* ── סרגל-לשוניות (§2.4) ── */
.tabs{display:flex; gap:4px; border-bottom:1px solid var(--s200); margin:0 -16px 0; padding:0 16px}
.tab{border:none; background:none; border-bottom:2px solid transparent; margin-bottom:-1px;
     padding:10px 16px; font-size:14px; font-weight:500; color:var(--s500); cursor:pointer}
.tab.on{border-color:var(--teal600); font-weight:600; color:var(--teal700)}

/* ── תג-סטטוס (StatusTag.jsx, §2.4) ── */
.tag{display:inline-block; white-space:nowrap; border-radius:999px;
     padding:2px 10px; font-size:11px; font-weight:600}
.tag.ok{background:var(--green100); color:var(--green700)}
.tag.teal{background:var(--teal100); color:var(--teal700)}
.tag.muted{background:var(--s100); color:var(--s500)}
.tag.warn{background:var(--amber200); color:var(--amber800)}

/* ── גלולת-מסנן (FilterPill.jsx, §2.4) ── */
.pill{border:1px solid var(--s200); background:#fff; color:var(--s600);
     border-radius:999px; padding:4px 12px; font:inherit; font-size:12.5px; cursor:pointer}
.pill.on{background:var(--teal50); border-color:var(--teal200); color:var(--teal700); font-weight:600}
.pill[disabled]{opacity:.5; cursor:not-allowed}

/* ── כפתורים (button.jsx + הדריסות בפועל) ── */
.btn{border-radius:var(--r-lg); font:inherit; font-size:14px; font-weight:600;
     padding:8px 16px; border:1px solid transparent; cursor:pointer; white-space:nowrap}
.btn-primary{background:var(--teal600); color:#fff}
.btn-primary:hover{background:var(--teal700)}
.btn-outline{background:#fff; border-color:var(--s300); color:var(--s700); font-weight:500}
.btn-danger-outline{background:var(--red50); border-color:var(--red200); color:var(--red600)}

/* ── טבלה (§2.6) ── */
table{width:100%; border-collapse:collapse}
th{font-size:12px; font-weight:600; color:var(--s500); text-align:right;
   padding:6px 10px; border-bottom:1px solid var(--s200); white-space:nowrap}
td{padding:10px; border-bottom:1px solid var(--s100); vertical-align:middle}
tr.click{cursor:pointer}
tr.click:hover td{background:var(--s50)}
tr.amber td{background:var(--amber50)}   /* התרעה — ענבר, לעולם לא אדום */

/* ── כרטיס-זהות (Cell/Val/Sub, §2.6) ── */
.cell{display:flex; flex-direction:column; align-items:flex-start; gap:2px; min-width:0}
.cell .lb{font-size:12px; color:var(--s500)}
.cell .val{font-size:14px; font-weight:600; color:var(--s800)}
.cell .val.empty{font-weight:500; color:var(--s400)}
.cell .sub{font-size:11px; color:var(--s500)}

/* ── דיאלוג (dialog.jsx §2.5) — דפוס head/body/foot מועתק מ-
   docs/mockups/logistics-screen/approved/02_dialog_checklist_approved.html (המוקאפ המאושר-
   וטרי-יותר לאותו תקדים sm:max-w-3xl/ScopeChangeDialog.jsx), לא מומצא מחדש. .dlg-head .meta
   (זוגות מפתח/ערך) הוא הצורה הקיימת לשדות-הזהות-הנעולים של S2; .dlg-head .sub (שורת-אזהרה
   ענבר) הוא הצורה הקיימת לבאנר-ההשלכה של S2. ── */
.scrim{position:fixed; inset:0; background:rgba(2,6,23,.45); z-index:50}
.dlg{position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:51;
     width:calc(100% - 2rem); max-width:512px; max-height:90vh;
     display:flex; flex-direction:column; overflow:hidden;
     background:#fff; border:1px solid var(--s200); border-radius:var(--r-xl);
     box-shadow:0 10px 30px rgba(15,23,42,.20)}
.dlg-wide{max-width:768px}         /* ScopeChangeDialog / S3 — טבלת-שורות, לא טופס */
.dlg-head{padding:18px 20px 12px; border-bottom:1px solid var(--s100); position:relative}
.dlg-head h2{font-size:18px; font-weight:700; color:var(--s800); text-align:right; padding-left:28px}
.dlg-head .lead{font-size:12.5px; color:var(--s500); margin-top:3px}
.dlg-head .meta{display:flex; flex-wrap:wrap; align-items:center; gap:8px 18px; margin-top:10px}
.dlg-head .meta .k{font-size:11.5px; color:var(--s500)}
.dlg-head .meta .v{font-size:13px; font-weight:600; color:var(--s800)}
.dlg-head .sub{display:block; margin-top:6px; font-size:11.5px; color:var(--amber700); font-weight:600}
.x{position:absolute; left:16px; top:16px; width:26px; height:26px; border:0; background:none;
   color:var(--s400); font-size:16px; cursor:pointer; border-radius:var(--r-md)}
.dlg-body{padding:14px 20px 4px; overflow:auto}
.dlg-foot{display:flex; justify-content:flex-start; gap:8px;
     padding:12px 20px 16px; border-top:1px solid var(--s100)}

/* ── מצב-ריק / חסום / שגיאה (PermissionAwareEmpty.jsx, §2.7) ── */
.empty{display:flex; flex-direction:column; align-items:center; gap:8px;
     padding:48px 0; text-align:center}
.empty .ttl{color:var(--s600); font-weight:500}
.empty .dtl{font-size:14px; color:var(--s500)}
.empty .err{color:var(--red600); font-weight:600}

/* ── טוסט (ToastProvider.jsx, §2.8) ── */
.toast{position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:60;
     width:100%; max-width:384px; display:flex; flex-direction:column; align-items:center; gap:8px}
.toast-box{width:100%; display:flex; align-items:center; gap:12px; border-radius:var(--r-xl);
     border:1px solid; padding:12px 16px; box-shadow:0 4px 12px rgba(15,23,42,.1); font-size:14px}
.toast-box.success{background:var(--teal50); border-color:var(--teal200); color:#00786f}
.toast-box.error{background:var(--red50); border-color:var(--red200); color:#c10007}
</style>
</head>
<body>

<aside class="side">
  <div class="logo">REG-IN</div>
  <nav>
    <!-- שבעת מודולי-העסק + "מסך הבית" (קבוע, לא מודול) — src/lib/constants.js,
         עוגן-גריפ `export const BUSINESS_MODULES`. סדר-ההצגה = סדר module_id.
         "כספים" מסומן .on כדוגמה למסך של מודול 8; לצייר .on על הפריט הרלוונטי בפועל. -->
    <a class="nav-i" href="#"><span class="ic">🏠</span>מסך הבית</a>
    <a class="nav-i" href="#"><span class="ic">👥</span>לקוחות</a>
    <a class="nav-i" href="#"><span class="ic">📄</span>הצעות מחיר</a>
    <a class="nav-i" href="#"><span class="ic">📁</span>פרויקטים</a>
    <a class="nav-i" href="#"><span class="ic">👤</span>דיילות</a>
    <a class="nav-i" href="#"><span class="ic">📦</span>לוגיסטיקה</a>
    <a class="nav-i on" href="#"><span class="ic">💰</span>כספים</a>
    <a class="nav-i" href="#"><span class="ic">📊</span>דו"חות</a>
  </nav>
</aside>

<header class="top">
  <h1 style="font-size:17px">כספים</h1>
  <div class="search"><span class="mg">🔍</span><input placeholder="חיפוש…"></div>
  <div class="who">
    <span class="av">מ</span>
  </div>
</header>

<main>
  <!-- תוכן-המשטח — שייך למוקאפ הספציפי, לא לשלד. הדוגמאות למטה הן גלריית-רכיבים בלבד,
       באותו רוח כמו §⑦ בחוזה-העיצוב של מודול 5: מראות "איך מצב נראה", לא "איזו שורה מצוירת". -->

  <div class="phead" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
    <div>
      <h1>&lt;כותרת המשטח&gt;</h1>
      <p class="psub">&lt;תת-כותרת, אם יש&gt;</p>
    </div>
    <button class="btn btn-primary">&lt;פעולה ראשית אחת&gt;</button>
  </div>

  <div class="card">
    <div class="tabs" style="margin-bottom:16px">
      <button class="tab on">לשונית א <span class="ltr" style="margin-right:6px; opacity:.7">3</span></button>
      <button class="tab">לשונית ב <span class="ltr" style="margin-right:6px; opacity:.7">0</span></button>
      <button class="tab">לשונית ג <span class="ltr" style="margin-right:6px; opacity:.7">12</span></button>
    </div>

    <table>
      <thead><tr><th style="width:40%">עמודה</th><th style="width:30%">עמודה</th><th style="width:30%">סטטוס</th></tr></thead>
      <tbody>
        <tr class="click">
          <td>תוכן-דוגמה</td>
          <td class="ltr">1,250 ₪</td>
          <td><span class="tag muted">ממתין לתשלום</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- מצב-ריק כדין / חסום-הרשאה / שגיאה — שלושת המצבים חייבים להיקרא שונה זה מזה -->
  <div class="card" style="margin-top:16px">
    <div class="empty" role="alert">
      <p class="err">לא ניתן לטעון את הנתונים.</p>
      <button class="btn btn-outline">נסי שוב</button>
    </div>
  </div>
</main>

</body>
</html>
```

**כללי-שימוש** (זהים לכללי מודול 5, §⑦ שם): ① בלוק `:root` לא נוגעים — הערכים נמדדו (§①) ②
כל ערך שאינו עברית טהורה עובר דרך `class="ltr"` ③ שני מספרים באותו משפט — מפרקים, מילה עברית
ביניהם (§3.3) ④ שם-הקובץ באנגלית, בתת-תיקייה `docs/mockups/finance-screen/drafts/` ואז
`approved/` עם סיומת `_approved.html` (מוסכמת מודול 6) ⑤ **השלד הוא גלריית-רכיבים, לא מוקאפ** —
המספרים שבו פטורים מכלל-הבית `🚫 אין המצאת שם/מק"ט/לקוח/תאריך`; **המוקאפים עצמם אינם פטורים.**

🔴 **מה חסר עדיין ל-S1–S4 בפועל, ואינו חלק מהחוזה הזה:** מערך-נתונים חי לציור (מקביל ל-
`docs/specs/module_05_logistics/data-set.md`) — טרם נכתב למודול 8. **צייר שיקבל רק את השלד הזה
יבחר דאטה משלו**, וזה הכשל ש-`data-set.md` של מודול 5 קיים כדי למנוע (התקדים מתועד ב-§⑦½ של
`design-contract.md` של מודול 5). זו הערה לשלב 2/3, לא כלל-מוצר — ואינה מוכרעת כאן.

---

## ⑥ ארבעת המשטחים המאושרים — שיוך לתקדים קיים

> מקור-רשימת-המשטחים: `processes-approved.md`, טבלת "רשימת-המשטחים המאושרת" — S1–S4, הכרעת-ישי
> 26/08/2026. **הטבלה למטה משייכת כל משטח לתקדים-קוד קיים; היא אינה קובעת אילו שדות/עמודות
> המשטח מציג** — זה נשאר ב-`processes-approved.md` ובכרטיסי-התהליכים.

### S1 — מסך הכספים, מבט-על (3 לשוניות · סינון)

| רכיב-על-המסך | התקדים המדוד | עוגן |
|---|---|---|
| שלוש הלשוניות עם מונה | `TabsBar` ברמת-עמוד | §2.4, `ProjectsPage.jsx` |
| סרגל-חיפוש/סינון מעל הרשימה | `StatusPills`/`FilterPill` | §2.4, `ProjectsPage.jsx`, `FilterPill.jsx` |
| טבלת-השורות | `Th`/`Td` רוחב-אחוזי | §2.6, `LogisticsPage.jsx` |
| שלושת מצבי-ריק/חסום/שגיאה | `PermissionAwareEmpty` | §2.7 |
| מדדי-KPI מעל הטבלה (אם ייבחרו) | `StatTile`, `flex-wrap` | §2.2 |

**המסך הקרוב ביותר במבנה, בפועל, הוא `ProjectsPage.jsx` עצמו** — גם שם 3+ מצבי-סטטוס בלשוניות
עם מונה, גם שם טבלת-פרויקטים עם עמודת-סטטוס וסינון. **הבדל מהותי אחד שנמדד:** ב-`ProjectsPage`
הלשוניות **וגם** גלולות-הסינון מוצגות יחד (שכבת-על + שכבת-פנים); S1 מוגדר ב-`processes-approved.md`
כשלוש לשוניות **בלבד** + סרגל-סינון/חיפוש (תאריכים/שם-חברה/מספר-פרויקט) — לא גלולות-סטטוס נוספות,
כי הלשונית **היא** הסטטוס. ⇒ שכבת-הגלולות של S1 (אם תיבנה) משרתת מסננים **בתוך** לשונית, לא
בין-סטטוסים — התאמה למבנה, לא עותק-מלא.

### S2 — חלון סגירת-תיק פרויקט

| רכיב-על-המסך | התקדים המדוד | עוגן |
|---|---|---|
| שדות-זהות נעולים-לעיון (ח.פ · איש-קשר · מייל-לחיוב) | `Cell`/`Val`/`Sub` | §2.6, `ProjectCardPage.jsx` |
| נוסחת-רווח / מאזן (הכנסות−הוצאות) | `LtrFieldGroup` | §2.3 |
| מדדי-סיכום (רווח, יתרה) | `StatTile` | §2.2 |
| באנר-השלכה לפני-אישור | `BannerRow` + `bg-amber-50` | §2.5, `CancelProjectDialog.jsx` |
| דיאלוג-מעטפת + כפתור "שמור סטטוס"/"עדכן ושמור" | `Dialog`/`DialogFooter`, `sm:max-w-lg` | §2.5 |
| חתימה אוטומטית (תאריך/מבצע) בלתי-ניתנת-לעריכה | שורת-הסבר `text-[11px] text-slate-500` | §2.5, `CancelProjectDialog.jsx` (השורה "התאריך… נחתמים אוטומטית") |

**התקדים המדויק ביותר במערכת לחלון "פעולה כספית/בלתי-הפיכה עם סיכום-לפני-אישור" הוא
`CancelProjectDialog.jsx`** — לא מקרי: זו הפעם היחידה עד כה שדיאלוג במודול 6 מציג נוסחת-כסף,
באנר-השלכה, ואישור בלתי-הפיך, יחד. S2 חדש-לגמרי (אין תקדים ל"סגירת-תיק" עצמה), אבל **הרכיבים
שהוא בנוי מהם — כן** קיימים ומדודים.

### S3 — הפקת דוח-השכר (בחירת-חודש · תצוגה-מקדימה · ייצא-ושלח · היסטוריה)

| רכיב-על-המסך | התקדים המדוד | עוגן |
|---|---|---|
| דיאלוג רחב לטבלת-תוכן | `sm:max-w-3xl` | §2.5, `ScopeChangeDialog.jsx` |
| תצוגה-מקדימה של מסמך לפני שליחה | דיאלוג עם `<iframe>` + כפתורי הורדה/שליחה | `src/modules/03_quotes/QuoteDocumentDialog.jsx` (ר' למטה) |
| דיווח-תוצאת-שליחה | `toast.success`/`toast.error` פר-תוצאה | §2.8 |
| שדה-תאריך בודד (`type="date"`, `dir="ltr"`) | `h-8 rounded-lg border border-slate-200` | `src/modules/05_logistics/ChecklistDialog.jsx` |
| טבלת-שורות (שכר פר-דיילת) | `Th`/`Td` | §2.6 |

🔴 **שני חורים אמיתיים — אין תקדים, לא "לא חיפשתי":**

1. **בורר-חודש/שנה.** נבדק: אין `<input type="month">` בשום מקום ב-`src/` (0 תוצאות), ואין
   רכיב-בורר-חודש ייעודי. הפריט הכי-קרוב שנמדד הוא שדה-תאריך בודד (`type="date"`, טבלה למעלה) —
   **פרימיטיב, לא בורר-חודש**. מי שיצייר את S3 בונה את זה בפעם הראשונה.
2. **רשימת-היסטוריה (הפקות קודמות).** נבדק (`grep -rn "היסטורי\|Log\b" src/`): אין מסך שמרנדר
   רשימת-אירועי-עבר כטבלה עצמאית — הקרוב ביותר הוא חיווי-שורה בודד ("נשלחה"/"טרם נשלחה", ב-
   `CustomerDetailsPage.jsx`/`QuotesPage.jsx`), לא רשימת-היסטוריה. **הצורה החוזרת הזמינה
   ביחיד:** טבלת `Th`/`Td` הגנרית (§2.6) — יישום-ראשון לתוכן מסוג "יומן-הפקות", לא עותק של
   מסך קיים.

**מה כן קיים ומדויק: מסך "צפייה במסמך לפני שליחה"** — `QuoteDocumentDialog.jsx` (מודול 3, סגור
ומוזג). דיאלוג עם `<iframe src={blobURL}>` להצגת PDF שנוצר בדפדפן, כפתור-הורדה (אייקון `Download`)
וכפתור-שליחה (אייקון `Mail`) שקורא ל-`sendEmail` הגנרי (`src/api/email.js`), ודיווח-תוצאה בטוסט.
**זה בדיוק צורת "תצוגה-מקדימה → ייצא-ושלח" ש-S3 דורש**, גם אם הפורמט (Excel, לא PDF) שונה —
מבנה-הזרימה (הפק → הצג → שלח/הורד → דווח) זהה.

### S4 — דף-משוב ציבורי `/feedback/:token`

**התקדים היחיד הרלוונטי, ומדויק ברמת-מבנה:** `src/modules/04_hostesses/PublicConfirmPage.jsx`
(`/shift/:token`) — הדף הציבורי היחיד באפליקציה שנפתח בלי התחברות ובלי סרגל-צד, ותקדים מפורש
ל-`/feedback/:token` (`processes-approved.md`, "התקדים: `/shift/:token`, חי ב-UAT").

**מבנה מדוד, שורה-שורה:**

| חלק | מה נמדד | עוגן |
|---|---|---|
| מיקום-ראוט | מחוץ ל-`<MainLayout>`, בלי `<ProtectedRoute>`, כמו `/login` | הערת-הראש בקובץ |
| מעטפת-עמוד | `min-h-screen bg-slate-50 px-4 py-8`, כרטיס ממורכז `mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-sm` | `return (…)` הראשי |
| כותרת-מיתוג | נקודה טורקיז `h-2 w-2 rounded-full bg-teal-600` + `REG-IN · <שם התהליך>` | `<div className="flex items-center gap-2">` |
| שלד-טעינה בלי-הבטחה-מוקדמת | אין שם-אירוע/כפתורים לפני שהטוקן נבדק — `animate-pulse` גנרי | `function Skeleton()` |
| מצב-פעולה (המקביל ל"תשובה למשמרת") | כרטיס-פרטים אפור (`rounded-2xl border bg-slate-50 p-4`) + שני כפתורי-מגע-גדולים (`py-3.5`, `rounded-xl`, אחד `bg-teal-600` מלא ואחד `outline`) | `function AwaitingAnswer` |
| **מסך-תוצאה מחליף את כל תוכן-העמוד, לא נוסף עליו** | אייקון-עיגול צבוע-לפי-טון (`RESULT_LOOK`) + משפט יחיד + כפתור-נסיון-חוזר **רק** על כשל-רשת | `function Result` |
| כשל-רשת ≠ "לא בתוקף" | מצב `saveFailed` נפרד מכל שאר התוצאות; הוא היחיד עם "נסי שוב" | הערת-הראש, §① בקובץ |
| שימוש ב-`Money` גם בדף הציבורי | `<Money amount={invite?.hourly_rate}/>` | `function AwaitingAnswer` |
| מטרות-מגע ≥44px | `py-3.5` על שני כפתורי-הפעולה (מדידה: ~52px גובה בפועל) | הערת-הקוד "מטרות-מגע 44px+" |

⇒ **S4 אינו "מסך חדש מאפס" מבחינת-מבנה** — הוא אימוץ-ישיר של תבנית קיימת, מאומתת חי (UAT), עם
תוכן שונה (טופס-ציון/טקסט במקום שני כפתורי-אישור/סירוב). כל שורה בטבלה למעלה היא נקודת-העתקה,
לא נקודת-המצאה.

---

## ⑦ מה נמדד — כולל מה שלא נמצא

**קבצים ופקודות שנקראו/רצו היום (26/08/2026), לפי סדר:**

1. `docs/specs/module_08_finance/processes-approved.md` + `discovery-log.md` — נקראו במלואם.
2. `docs/specs/module_05_logistics/design-contract.md` — נקרא במלואו (859 שורות), כתקדים-מבנה
   ומקור לערכי-הקסה (§1.4).
3. `grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/` — רץ מלא + סיכום-משפחות + בדיקת-נגד על
   17 משפחות אחרות (§①).
4. `src/components/{Money,StatTile,LtrFieldGroup,StatusTag,PermissionAwareEmpty,LoadingOrError,
   ToastProvider,FilterPill,RowAction}.jsx` + `ui/{button,dialog}.jsx` — נקראו במלואם.
5. `src/modules/06_projects/{CancelProjectDialog,ProjectCardPage,ProjectsPage}.jsx` +
   `ScopeChangeDialog.jsx` (grep ממוקד על `DialogContent`) — נקראו/נגרפו.
6. `src/modules/05_logistics/LogisticsPage.jsx` — נקרא במלואו.
7. `src/modules/04_hostesses/PublicConfirmPage.jsx` — נקרא במלואו.
8. `src/modules/03_quotes/QuoteDocumentDialog.jsx` — נקראו 70 השורות הראשונות (מבנה-ייבוא +
   הערת-ראש); לא נקרא במלואו — אינו נחוץ למיפוי-מבנה.
9. `src/CLAUDE.md` (סעיפי RTL/כיווניות/חמשת-המעברים) + `docs/PROJECT_MASTER.md` §4 (`awk` על
   הטווח המלא) — נקראו במלואם.
10. `src/lib/constants.js` (`BUSINESS_MODULES`) + `src/components/layout/{Sidebar,Topbar,
    MainLayout}.jsx` (grep על `w-60`/`w-16`/`h-16`/`pr-9`) — לאימות-רוחב-סרגל ולנav המלא.
11. `node_modules/tailwindcss/theme.css` (`--color-teal-600`) + `src/index.css`
    (`--primary`/`--radius`) — לאימות שאין דריפט מאז 21/08.
12. `grep` שלילי על בורר-חודש (`type="month"`) והיסטוריה-כרשימה — שני חורים מדווחים ב-§⑥/S3,
    לא הומצא פתרון בכוחי.

**מה לא נמצא, ונרשם ככזה (§⑥/S3):** בורר-חודש/שנה · מסך-רשימת-היסטוריה עצמאי. **מה לא נבדק כאן
בכוונה:** תוכן-דאטה אמיתי לציור (מספרי-פרויקטים, שמות-לקוחות) — זה תפקיד `data-set.md` שטרם נכתב
למודול 8 (מצוין כפער פתוח בסוף §⑤, לא מוכרע).

</div>
