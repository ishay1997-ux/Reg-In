<div dir="rtl">

# חוזה-העיצוב — מודול 5 (לוגיסטיקה)

> **מה הקובץ הזה:** המקור היחיד לצבע, לטון, לכיווניות ולצורת-הרכיב עבור **שני המוקאפים של מודול 5**
> — מבט-על לוגיסטי · Checklist פר-פרויקט · דיאלוג הסרת-פריט. **פגם כאן מוכפל פי 3**, ולכן כל טענה
> בקובץ נושאת נתיב-קובץ + **עוגן-גריפ** (מחרוזת שאפשר לחפש), ולא מספר-שורה — מספרי-שורה מתיישנים
> בשקט בעריכה הבאה שמעליהם.
>
> **מה הקובץ הזה אינו:** אינו מכריע מוצר. מה מוצג במסך, אילו עמודות, איזו פעולה מותרת למי — כל אלה
> ‏`processes-approved.md` ו-`screens-approved.md` של המודול, בהכרעת-ישי. כאן רק **איך זה נראה**.
>
> 🔑 **וזו הצורה המחייבת של הכפיפות הזאת** *(22/08/2026)*: **‏`processes-approved.md` הוא הקובץ
> היחיד בתיקייה שמכריע.** כלל-מוצר שמנוסח כאן חייב **תג-מראה** *(‏`docs/CLAUDE.md`, עוגן-גריפ:
> ‏`קונבנציית מראה`)*, למשל `🔗 מראת ㉚ — SSOT: processes-approved.md (לא לערוך כאן)`.
> **נוסח בלי תג = ממצא לתיקון.** ⚠️ **וזה נדרש כי זה כבר קרה:** שלד-ה-⑦ נכתב **לפני** ההכרעה ㉚
> והסתיר פקד שההכרעה מחייבת להשאיר מושבת.
> ⬅️ **ובכיוון ההפוך — הקובץ הזה הוא הבעלים הבלעדי של צבע.** ‏`data-set.md` נקב פעם ב-`#0D9488`
> משלו; **מ-22/08/2026 הוא מפנה לכאן** *(‏§1.2 · §1.3)*, ואין לשחזר ערך-צבע בשום קובץ אחר בתיקייה.
>
> 🔴 **התקדים שהקובץ הזה נולד ממנו, ואסור לחזור עליו:** האפיון המאושר של מודול 6
> (`docs/specs/module_06_projects/screens-approved.md`) **נשען על קובץ בשם `_design-contract.md`
> שאינו קיים בריפו** — פעמיים בשמו המפורש (עוגן-גריפ: `_design-contract §3.2` · `_design-contract.md §5.8`)
> ועוד שבע פעמים בשמו העברי `חוזה-העיצוב`, **וגם — המחלקה המסוכנת — כהפניות `§N.M` חשופות בלי שם-קובץ
> כלל**, שסשן-בנייה קורא בטעות כסעיף של המסמך שהוא כבר מחזיק ביד. ‏**התיעוד של הממצא:** ‏`STATUS.md`
> (עוגן-גריפ: `מצוטט 9 פעמים באפיון-מ6`) ‏· `docs/micro_guides/module-6.md`
> (עוגן-גריפ: `_design-contract.md` does not exist).
> ⇒ **הקובץ הזה קיים, יושב בתיקיית-האפיון של המודול, וכל הפניה אליו נכתבת בשמו המלא:
> ‏`docs/specs/module_05_logistics/design-contract.md §N`.** לעולם לא `§N.M` חשוף.

---

## ① הפלטה — נמדדה, לא הועתקה

### 1.1 המדידה עצמה

הפקודה שרצה (‏`21/08/2026`), **בלי רשימת-משפחות מקודדת** — כדי שתגלה גם משפחה שאיש לא ציפה לה:

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sort | uniq -c | sort -rn
```

**התוצאה: חמש משפחות בלבד בכל `src/`.** חמש-עשרה השורות הראשונות:

| # | ה-utility | מופעים |
|:-:|---|--:|
| 1 | `text-slate-500` | 206 |
| 2 | `text-slate-700` | 127 |
| 3 | `border-slate-300` | 100 |
| 4 | `border-slate-200` | 96 |
| 5 | `text-slate-400` | 85 |
| 6 | `text-slate-600` | 79 |
| 7 | `text-teal-700` | 71 |
| 8 | `text-red-600` | 71 |
| 9 | `text-slate-800` | 64 |
| 10 | `bg-slate-50` | 49 |
| 11 | `border-slate-100` | 44 |
| 12 | `bg-teal-600` | 38 |
| 13 | `bg-amber-50` | 33 |
| 14 | `bg-slate-100` | 32 |
| 15 | `text-amber-700` | 31 |

**סיכום לפי משפחה** (סכום כל הגוונים) — ‏**נמדד מחדש `22/08/2026`, ולא נספר ביד:**
‏**slate 900 · teal 206 · amber 139 · red 132 · green 46.** *(סך-הכול 1,423 מופעים ב-51 יוטיליטיז נבדלים.)*
🔍 **וזו הפקודה שמייצרת בדיוק את חמשת המספרים האלה — להרצה חוזרת, בלי לספור את הטבלה למעלה:**

```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sed -E 's/^(bg|text|border)-([a-z]+)-[0-9]{2,3}$/\2/' | sort | uniq -c | sort -rn
```

⚠️ **הסכימה חייבת לרוץ, ולעולם לא להיגזר מהטבלה שלמעלה:** חמש-עשרה השורות שבה נושאות **1,126
מתוך 1,423** המופעים — ‏**297 יושבים מחוצה לה.** ‏`teal` לבדה מתפרסת על **12** יוטיליטיז נבדלים
ורק **שניים** מהם בטבלה *(`text-teal-700` · `bg-teal-600`)* ⇒ **מי שיסכם בעין יקבל ‏109 במקום 206.**
בנוסף, מחוץ לצורת-הביטוי של החיפוש: `bg-white` ×81 · `text-white` ×35 *(אומת מחדש `22/08/2026`)*.

🔴 **ומה שהחיפוש הפתוח גילה, ורשימה סגורה לא הייתה מגלה — בדיקת-נגד שרצה בנפרד:**

```
grep -rhoE "(bg|text|border)-(blue|purple|orange|indigo|sky|violet|yellow|emerald|gray|zinc|neutral|stone|cyan|lime|pink|rose|fuchsia)-[0-9]{2,3}" src/
```

**פלט ריק — אפס מופעים.** אין כחול, אין סגול, אין כתום, אין גם `gray`/`zinc`/`neutral` (רק `slate`).
⇒ **מוקאפ של מודול 5 שמכניס צבע שישי הוא סטייה, לא בחירה.**

### 1.2 הערכים בפועל — ‏Tailwind v4, ולא Tailwind v3

הפרויקט על **Tailwind 4**, שבו כל צבע מוגדר ב-OKLCH ו**הערכים נבדלים מהקסה של v3 שכולם זוכרים בעל-פה.**
הערכים למטה הומרו מ-`node_modules/tailwindcss/theme.css` (עוגן-גריפ: `--color-teal-600:`) והוצלבו
מול הטוקנים של המוקאפ המאושר `docs/mockups/project-management-screen/approved/03_tab_logistics_approved.html`
(עוגן-גריפ: `--teal600:#009689`) — **התאמה מלאה, ספרה-בספרה.**

| טוקן | ערך | טוקן | ערך |
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
| `green-50` | `#F0FDF4` | `amber-700` | `#BB4D00` |
| `green-100` | `#DCFCE7` | `amber-800` | `#973C00` |
| `green-200` | `#B9F8CF` | `red-50` | `#FEF2F2` |
| `green-700` | `#008236` | `red-100` | `#FFE2E2` |
| `white` | `#FFFFFF` | `red-200` | `#FFC9C9` |
| `--primary` (טוקן) | `#0D9488` | `red-600` | `#E7000B` |

### 1.3 🔴 הסתירה שמצאתי מול `PROJECT_MASTER §4` — ולא הכרעתי בה לבד

`PROJECT_MASTER §4` (עוגן-גריפ: `פרימרי — טורקיז/teal`) כותב:
*"פרימרי — טורקיז/teal `#0D9488` **(teal-600**, מחווט ל-token `--primary`)"*.

**המדידה אומרת ששני החצאים של המשפט אינם אותו צבע:**

| הצד | הערך בפועל | מי משתמש בו | העוגן |
|---|---|---|---|
| **הטוקן** `--primary` | `#0D9488` (מילולי, hex מוקלד ביד) | ‏`<Button>` ברירת-מחדל (`bg-primary`) · `variant="link"` (`text-primary`) | `src/index.css` — עוגן-גריפ `--primary: #0d9488` |
| **ה-utility** `bg-teal-600` | `#009689` (‏Tailwind 4, ‏OKLCH) | ‏**38 אתרי-קריאה** — כולל כפתור-האישור של `ConfirmDialog` | `src/components/ConfirmDialog.jsx` — עוגן-גריפ `bg-teal-600 hover:bg-teal-700` |

⇒ **‏`#0D9488` היה `teal-600` ב-Tailwind 3. ב-Tailwind 4 הוא כבר לא.** שני טורקיזים שונים חיים
היום זה לצד זה על המסך. ‏`src/CLAUDE.md` כבר מסמן את הקיום (עוגן-גריפ: `הטורקיז חי בשני מקומות`)
אך אומר רק ש*"שינוי הטוקן לבדו לא ישנה אותם"* — **ולא שהם צבעים שונים.**

**🚫 לא הכרעתי — הכרעת-צבע היא של ישי (כלל ברזל 8).** ⚠️ **ומה שהמוקאפים כן חייבים לעשות בינתיים,
כי בלי זה אין מה לצייר: לחקות את המצב הקיים, לא לאחד אותו** — ‏`#0D9488` רק במקום שבו האפליקציה
מושכת מהטוקן, ו-`#009689` בכל מקום שבו האפליקציה כותבת `bg-teal-600`. **בפועל, לשלושת מסכי מודול 5,
כמעט הכול נופל בצד `#009689`** (כפתור ראשי, תג, גלולה). *(זו בדיוק ההכרעה שהמוקאפים המאושרים של
מודול 6 כבר קיבלו — ‏`--primary:#0D9488` **ו**-`--teal600:#009689` יושבים שם זה ליד זה.)*

**סתירות משניות מול §4, לרשומה — אף אחת מהן אינה חוסמת ציור:**

| מה §4 אומר | מה נמדד | המסקנה למוקאפ |
|---|---|---|
| רקע `#F8FAFC`, גבולות `#E2E8F0` | ✅ **תואם ספרה-בספרה** — `slate-50`/`slate-200`, ו-`MainLayout.jsx` צובע את הדף `bg-slate-50` (עוגן-גריפ: `min-h-screen bg-slate-50`) | להשתמש כפי שכתוב |
| ירוק `~#22C55E` · אדום `~#EF4444` · כתום `~#F59E0B` | אלה גוונים ברמת-`500` מ-Tailwind 3; ‏`src/` כמעט אינו משתמש ב-`500` למשפחות האלה. בפועל: `text-red-600`, `bg-amber-50`+`text-amber-700`, `bg-green-100`+`text-green-700` | §4 מגדיר **כיוון-גוון**, לא את הגוון שמצייָר. לצייר לפי §1.2 |
| נייבי `~#1E293B` · גרפים כחול `#3B82F6`, סגול, כתום | **אפס מופעים ב-`src/`** (§1.1). ‏`src/CLAUDE.md` אומר במפורש *"אין סגול/כתום בשפת-העיצוב"* | **לא לצייר.** חמש משפחות בלבד |
| — | הטוקן `--background` ב-`index.css` הוא **לבן** (`oklch(1 0 0)`), בעוד הדף בפועל `slate-50` | **המעטפת מנצחת:** רקע-דף `#F8FAFC`, כרטיסים `#FFFFFF` |

### 1.4 המשמעות הסמנטית — מה כל צבע *אומר*

| צבע | שמור ל… | לא ל… |
|---|---|---|
| **טורקיז מלא** (`#009689` רקע · `#00786F` טקסט) | **הפעולה הראשית האחת של המסך.** ופריט-סרגל פעיל: `teal-50` רקע + `teal-700` טקסט | מסנן נבחר · עובדה חיובית · אריח-מדד |
| **טורקיז בהיר** (`teal-50` רקע · `teal-200` מסגרת · `teal-700` טקסט) | **מצב-נבחר** של מסנן, ותג-סטטוס בטון `teal` ("בתנועה") | פעולה |
| **ענבר** | **אזהרת-היגיינה — לא הצלחה ולא שגיאה.** חוסר שנוצר, פריט שטרם מוכן, "הוגדל מ-…" | שגיאה אמיתית |
| **אדום** | **שגיאת-טעינה** (`text-red-600 font-semibold`) ו**פעולה הרסנית מאושרת** (`bg-red-600` בכפתור-האישור של דיאלוג-מסוכן) | סטטוס "פחות טוב"; אין תג-סטטוס אדום במערכת |
| **ירוק** | **עובדה שנסגרה** — טון `ok` של תג-סטטוס, ופעולת-אישור בשורה (`RowAction tone="approve"`) | פעולה ראשית |
| **slate ("muted")** | **הרוב המוחלט.** טקסט, גבולות, רקע-דף, ומצב שאין בו מה לעשות איתו — טון `muted` הוא **`bg-slate-100` + `text-slate-500`** | — |

🔴 **מוקש שמסתתר כאן, ושווה לו שורה משלו:** תווית-סטטוס שאינה ממופה נופלת ב-`StatusTag` בשקט ל-`muted`
— **אפור שזהה-בייט לטון של סטטוס אמיתי, כלומר בלתי-נראה על המסך.** לכן `src/lib/projectLogistics.js`
עוטף אותה ב-`resolveLogisticsTone` שזורק שגיאה (עוגן-גריפ: `תווית מצב-פריט לא ממופה`).
**במוקאפ המשמעות היא: לא להמציא תווית-מצב רביעית.** ‏`item_status` הוא `CHECK` תלת-ערכי במסד.

---

## ② כלל-המילוי — הצורה שהכי קל להפר בלי לשים לב

**‏`src/components/StatTile.jsx`, כותרת-הקובץ, מילה-במילה:**

> 🎨 לבן + מסגרת אפורה, לעולם לא מילוי-צבע — כלל-המילוי (`PROJECT_MASTER §4`): מדד הוא
> **עובדה**, ומילוי שמור לפעולה-הראשית של המסך או לאזהרה. אריח-מדד צבוע מתחרה ויזואלית
> עם הכפתור הראשי, וזה בדיוק מה שהכלל נועד למנוע.

**כלל ①. מילוי-רקע צבעוני מגיע לשלושה דברים בלבד:** ‏① הפעולה-הראשית-האחת של המסך ·
‏② אזהרה ממשית · ③ תג-סטטוס שמבדיל בין מצבים אמיתיים.
**כל השאר — לבן + מסגרת `slate-200`, גם כשהעובדה חיובית.** במילותיו של ישי, על צ'יפ:
*"עובדה טובה אינה צבועה"* (`PROJECT_MASTER §4`, עוגן-גריפ: `כלל-מילוי — מתי צובעים רקע`).

**כלל ②. אריח-מדד תמיד בצורה הזאת:** ‏**תווית מעל הערך** · `rounded-xl border border-slate-200 bg-white p-4`
· ‏`flex flex-col items-start gap-0.5`. **תווית `text-xs text-slate-500` · ערך `text-xl font-bold text-slate-800`
· שורת-משנה `text-[11px] text-slate-500`.** ‏(‏`StatTile.jsx`, עוגן-גריפ: `rounded-xl border border-slate-200 bg-white p-4`.)

**כלל ③. רצועת-האריחים היא `flex flex-wrap`, לעולם לא `grid` שנמתח לרוחב-מלא.** הכרעת-ישי 08/08/2026
(‏`StatTile.jsx`, עוגן-גריפ: `לעולם לא \`grid\` שמותח לרוחב-מלא`) — ‏`grid-cols-N` על מספר-קטן-של-אריחים
משאיר שטח-ריק **בתוך** כל אריח.

**כלל ④. אין נתון ⇒ טקסט, לעולם לא `0`.** ברירת-המחדל: `אין נתונים עדיין` ‏(`text-sm text-slate-400`).
‏🔴 **ו**מונה שאסור לקרוא מציג `—` ולעולם לא `0` — ‏`DENIED_MARK` ב-`PermissionAwareEmpty.jsx`
(עוגן-גריפ: `export const DENIED_MARK`). ‏`0` נקרא כעובדה; `—` נקרא כ"אין לי את הנתון".

**כלל ⑤. כפתור ראשי אחד לכרטיס** — בכותרת בלבד. הכרעת-ישי-מואצלת 19/08/2026,
‏`src/modules/06_projects/CLAUDE.md` (עוגן-גריפ: `כפתור ראשי אחד לכרטיס`).

---

## ③ טוני תגי-הסטטוס — כבר בנויים ומאושרים, מועתקים בייט-בבייט

### 3.1 מפת-הטונים המלאה — `src/components/StatusTag.jsx` (עוגן-גריפ: `const TONES = {`)

| טון | המחלקות בפועל | הערכים לציור | מתי |
|---|---|---|---|
| `ok` | `bg-green-100 text-green-700` | רקע `#DCFCE7` · טקסט `#008236` | "סגור, אין מה לעשות" |
| `teal` | `bg-teal-100 text-teal-700` | רקע `#CBFBF1` · טקסט `#00786F` | בתנועה, התחיל ולא נגמר |
| `muted` | `bg-slate-100 text-slate-500` | רקע `#F1F5F9` · טקסט `#62748E` | ניטרלי / ממתין |
| `warn` | `bg-amber-200 text-amber-800` | רקע `#FEE685` · טקסט `#973C00` | אזהרת-היגיינה |
| `outline` | `bg-slate-100 text-slate-600 border border-slate-200` | רקע `#F1F5F9` · טקסט `#45556C` · מסגרת `#E2E8F0` | — |
| `dashed` | `bg-slate-100 text-slate-500 border border-dashed border-slate-300` | כמו `muted` + מסגרת **מקווקוות** `#CAD5E2` | הושבת / בוטל |

**צורת-התג עצמה** (עוגן-גריפ: `inline-block whitespace-nowrap rounded-full`):
`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold`.

🔑 **המפתח הוא התווית המוצגת, לא ערך-ה-enum.** ‏(`StatusTag.jsx`, עוגן-גריפ: `המפתח הוא התווית המוצגת`.)

### 3.2 שלוש התוויות של מודול 5 — הן קיימות, אין מה להמציא

`src/lib/projectLogistics.js`, עוגן-גריפ `export const LOGISTICS_STATUS_LABELS`:

| `item_status` | התווית **על המסך** | הטון | הערכים לציור |
|---|---|---|---|
| `not_started` | **טרם החל** | `muted` | רקע `#F1F5F9` · טקסט `#62748E` |
| `ordered` | **הוזמן** | `teal` | רקע `#CBFBF1` · טקסט `#00786F` |
| `ready` | **מוכן** | `ok` | רקע `#DCFCE7` · טקסט `#008236` |

מיפוי-הטונים: `src/lib/projectLogistics.js`, עוגן-גריפ `const LOGISTICS_STATUS_TONES`.
‏**⚠️ ומקור שני הטונים מוצהר בקוד עצמו כ`הנחתי`:** *"'הוזמן'/'מוכן' אינם מצוירים באף מוקאפ ⇒ נגזרו
מתקדים"*. הם כבר בנויים ומוצגים חי בלשונית-הלוגיסטיקה של מודול 6 — ⇒ **המוקאפים מחקים אותם, ואם
ישי רוצה אחרת זו הכרעה שלו על שני המקומות יחד, לא על המוקאפ לבדו.**

**‏🚫 אין ערך רביעי.** ‏`§7.31` הוכרע 13/08/2026: פרויקט שבוטל — *"לא נוגעים בהן"*, ו-`item_status`
נשאר בכוונה תלת-ערכי (`processes-approved.md` של המודול, עוגן-גריפ: `אין קסקדה`).

**סדר-התצוגה הוא ערוץ-מידע:** `not_started` → `ordered` → `ready` — *"מה שרחוק ביותר ממוכן — תחילה"*
(עוגן-גריפ: `const STATUS_RANK`, והמחרוזת המוצגת `export const SORT_LINE`).

### 3.3 שמונת סטטוסי-הפרויקט — אם מסך מבט-העל מציג גם אותם

`src/lib/projects.js`, עוגן-גריפ `export const PROJECT_STATUS_TONES`:
`טרם החל`=muted · `בתהליך`=muted · `מוכן לביצוע`=teal · `ממתין לסגירה`=**warn** ·
`ממתין לחשבונית`=muted · `ממתין לתשלום`=muted · `פרויקט הסתיים`=ok · `בוטל`=**dashed**.

---

## ④ כיווניות (RTL) — הכי קל להיכשל כאן, והכי שקט

### 4.1 יוטיליטיז פיזיים בלבד. אפס לוגיים.

‏`src/CLAUDE.md` (עוגן-גריפ: `הפרויקט משתמש ב-utilities פיזיות בלבד`):
**`right-0`, `mr-60`, `pr-9`, `text-right` — ואין ולו `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` אחד בכל `src/`.**

🔴 **למה יוטיליטי לוגי נוחת מתחת לסרגל, בשקט:** ‏`<html dir="rtl">` כבר מוגדר ⇒ `ms-60` נפתר
ל**ימין** — **אותו צד שבו יושב הסרגל** — והתוכן נוחת **מתחת** אליו. **וזה נראה תקין בתצוגת LTR
ושבור באפליקציה**, כלומר מי שבודק את המוקאפ בדפדפן LTR לא יראה כלום.
**במוקאפ HTML הכלל מתורגם ל:** `right`/`left`/`margin-right`/`padding-right`/`text-align:right` —
לעולם לא `inset-inline-start`, `margin-inline-*`, `padding-inline-*`.

**מספרי-הפריסה** (`Sidebar.jsx`/`Topbar.jsx`/`MainLayout.jsx`, עוגני-גריפ `w-60` · `right-60` · `mr-60` · `h-16`):
סרגל-צד **ימני 240px** ‏(`w-60`; מכווץ 64px) · סרגל-עליון **64px** ‏(`h-16`) · תוכן `margin-right:240px; padding-top:64px`.
🔴 **זה מספר-קסם משולש** — ‏`w-60` ↔ `mr-60` ↔ `right-60` בשלושה קבצים. שינוי אחד = חפיפה או פער, בלי שגיאה.

### 4.2 שני רכיבי-הבידוד — חובה, לא בחירה

| מה | הרכיב | הצורה ב-HTML | העוגן |
|---|---|---|---|
| **סכום ב-₪** | `<Money amount={n}/>` | `<span class="ltr">1,250 ₪</span>` — **מספר, ואז ₪ מימינו** | `src/components/Money.jsx`, עוגן-גריפ `הצורה הקנונית` |
| **כל ערך לא-עברי-טהור** — מספר, `SKU`, שעה, תאריך, אחוז, `REG-IN` | `<Ltr>` | `<span class="ltr">…</span>` = `direction:ltr; unicode-bidi:isolate; display:inline-block` | `src/components/Ltr.jsx`, עוגן-גריפ `[unicode-bidi:isolate]` |
| **טווח / נוסחה** (שדות בכיוון הפוך) | `<LtrFieldGroup items={…}/>` | תוויות וערכים מ**אותו מערך** — שתי שורות שנכתבות בנפרד מתפצלות בשקט (**קרה שלוש פעמים**) | `src/components/LtrFieldGroup.jsx` |

### 4.3 🔴 המקרה שבו בידוד הוא התיקון **השגוי**

‏`src/CLAUDE.md`, המופע התשיעי (עוגן-גריפ: `62% / 38%`):

> באנר במסך Smart Match הדפיס את שתי המשקולות כרצף — `62% / 38%` — ומדידת `Range` הראתה
> ש-**`38%` נחת משמאל ל-`62%`**: הצמד מתפרק לשני רצפים נפרדים שה-bidi מסדר הפוך, ומי שקורא
> את הסוגריים לבדם מקבל **את המשקולות מוחלפות**.

🔑 **הכלל: ‏`Money` ו-LRI/PDI פותרים *ערך בודד* בתוך עברית — ל**רצף בן שני ערכים אין סדר נכון בכלל.**
⇒ **התיקון הוא לפרק את הרצף, לא לבודד אותו:** כל מספר עובר לצד המילה שלו.

**ולמודול 5 זה הכי רלוונטי שיש, כי מסך-Checklist הוא במהותו "כמה מתוך כמה":**

**🚫 אסור:** `3/5` · `12 / 40` · `2/3 מוכנים` · `62% / 38%`
**✅ הצורה שכבר נבנתה ורצה במסך חי** (`src/modules/06_projects/LogisticsTab.jsx`, עוגן-גריפ: `} מתוך {`):

```jsx
<Ltr>{String(ready)}</Ltr> מתוך <Ltr>{String(rows.length)}</Ltr>
```

כלומר ב-HTML: `<span class="ltr">3</span> מתוך <span class="ltr">5</span>` — **מילה עברית בין שני
המספרים היא מה שנותן ל-bidi עוגן ומונע את ההיפוך.**

📏 **ודיוק שנמדד על שלד §⑦ עצמו בדפדפן חי (21/08/2026), כדי שלא תתקן יתר על המידה:**
‏**שני ערכים שכל אחד מהם עטוף ב-`.ltr` בנפרד — כן מסתדרים נכון גם כשמפריד ביניהם תו ניטרלי**
(`·`). ‏המדידה: בשורה `⚠ הוגדל מ-8 · 18/08`, ‏`8` נחת ב-`left=487` ו-`18/08` ב-`left=451` —
כלומר `8` מימין ונקרא ראשון, **כמתוכנן.** ‏**מה שנשבר במקרה 62%/38% היה שני מספרים גולמיים
בלי בידוד** — ‏`.ltr` הופך כל אחד ליחידה אטומית שהפסקה ה-RTL מסדרת לפי סדר-המקור.
⇒ ‏**‏🚫 האיסור הוא על `3/5` הגולמי, לא על שני `<Ltr>` נפרדים.** ובכל זאת — **את שני המספרים
מפרידים במילה עברית כשאפשר** (`מתוך`), כי זו הצורה שכבר רצה במסך חי ואינה תלויה בניתוח.

### 4.4 🔴 ‏`npm run check:bidi` **אינו** רשת-ביטחון ל-`3/5`

הסורק הוא `scripts/check-bidi-glyphs.mjs`. הביטוי-הרגולרי שלו (עוגן-גריפ: `const RISK_GLYPHS`) הוא
**ספרה צמודה ל-`₪` / `★` / `×` בלבד**. ‏**‏`3/5` אינו מכיל אף אחד מהשלושה ⇒ עובר ירוק.**
הקובץ מצהיר על זה בעצמו (עוגן-גריפ: `Known blind spot`), וכך גם `Ltr.jsx` (עוגן-גריפ: `check:bidi` נורה רק על ספרה`)
שמונה `1/6`, `0/2` ו-*"חסרות 5"* כדוגמאות שעוברות ירוק בלי בידוד.

⇒ **צורת-השבר `N/M` היא בדיוק הצורה שהשער לא תופס.** ‏**במוקאפ אין שער בכלל** — אין `check:bidi`
על `docs/mockups/`. ⇒ **המבחן היחיד הוא לפתוח את הקובץ בדפדפן ולקרוא בעיניים**, ובמיוחד: **כל מקום
שיש בו שני מספרים באותו משפט.**
⚠️ **ואל תסמוך על "בניתי כמו שצויר":** המוקאפ המאושר של מודול 4 **שיכפל בעצמו** את הפגם — הוא בידד
את עמודת-השכר ולא את עמודת-ההתרשמות, ו-`★ 5` הודפס הפוך (`src/CLAUDE.md`, מופע שמיני).

---

## ⑤ טיפוגרפיה ומוסכמות-רכיב

### 5.1 גופן

`src/index.css` (עוגן-גריפ: `--font-sans: 'Geist Variable'`) ‏· `@import '@fontsource-variable/geist'`.
**ל-Geist אין כיסוי עברי** ⇒ העברית באפליקציה נופלת ממילא ל-`sans-serif` של המערכת.
**המחסנית למוקאפ, זהה למוקאפים המאושרים של מודול 6:**

```css
font-family:'Geist Variable','Geist',"Segoe UI",Arial,sans-serif;
font-size:14px; line-height:1.5;
```

*(במוקאפ עצמאי `Geist Variable` לא ייטען — אין CDN — והדפדפן ייפול ל-Segoe UI. **זה בסדר ומכוון:**
זה בדיוק מה שקורה לעברית באפליקציה האמיתית.)*

### 5.2 🔴 כפתורים — ה-`Button` ברירת-המחדל **קטן ממה שהאפליקציה משתמשת בו**

`src/CLAUDE.md` (עוגן-גריפ: `Button` ברירת-מחדל קטן משמעותית`) + `src/components/ui/button.jsx`
(עוגן-גריפ: `h-8 gap-1.5 px-2.5`):

> **‏`Button` ברירת-מחדל קטן משמעותית ממה שהאפליקציה משתמשת בו** (`h-8 px-2.5`); כמעט כל
> אתר-קריאה דורס ל-`h-auto py-2 px-4`. **כפתור חדש בלי דריסה ייראה קטן מהשכנים.**

| הכפתור | הדריסה בפועל | הערכים לציור | העוגן |
|---|---|---|---|
| **ראשי** | `bg-teal-600 hover:bg-teal-700 text-white font-semibold h-auto py-2 px-4 rounded-lg` | רקע `#009689` · טקסט לבן · `padding:8px 16px` · `border-radius:10px` | `ConfirmDialog.jsx`, עוגן-גריפ `bg-teal-600 hover:bg-teal-700` |
| **משני (outline)** | `variant="outline"` + `h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700` | לבן · מסגרת `#CAD5E2` · טקסט `#314158` | `LoadingOrError.jsx` + `PermissionAwareEmpty.jsx`, עוגן-גריפ `rounded-lg border-slate-300 text-slate-700` |
| **הרסני מאושר** (בדיאלוג) | `bg-red-600 hover:bg-red-700 text-white font-semibold h-auto py-2.5 px-4 rounded-lg` | רקע `#E7000B` | `ConfirmDialog.jsx`, עוגן-גריפ `danger ? 'bg-red-600` |
| **כפתור-אייקון** | `variant="link"` + `className="h-auto p-0"` | טקסט בצבע `--primary`, בלי רקע ובלי מסגרת | `src/CLAUDE.md`, עוגן-גריפ `variant="link"` + `h-auto p-0` |

⚠️ **‏`size="icon"` קיים ב-`button.jsx` ואינו בשימוש בשום מקום בפרויקט** — לא לצייר אותו.

**כפתור-פעולה בתוך שורת-טבלה הוא רכיב אחר:** `src/components/RowAction.jsx` — ריבוע ממוסגר
**30px**, ‏`rounded-md` (8px), שלושה טונים (עוגן-גריפ: `size-[30px] rounded-md border`):
`neutral` = `border-slate-200 bg-white text-slate-600` · `approve` = `border-green-200 bg-green-50 text-green-700`
· `reject` = `border-red-200 bg-red-50 text-red-700`.
‏🔴 **ה-`title` שלו הוא גם `aria-label` וגם חוזה-E2E — שינוי הטקסט אינו קוסמטי.**

### 5.3 אייקונים

`lucide-react` בלבד (‏22 קובצי-מקור מייבאים ממנו) · **`size-4` = 16px** היא המידה הסטנדרטית
(63 מופעים; `size-5`=20px ‏7 מופעים, `size-3`=12px ‏8 מופעים). ‏`src/CLAUDE.md`, עוגן-גריפ:
`אייקונים \`size-4\` מ-\`lucide-react\``.

🔴 **פח-אשפה — ואין לו מקום באף מסך של מודול 5** *(㊳, ‏22/08/2026)*. **הסעיף הזה עסק עד אז
בפח שבשורת-הצ'קליסט ובדיאלוג-הסרת-הפריט; שניהם אינם קיימים.** ‏**ההסרה היא שינוי-תכולה של
מנהלת הפרויקטים** ומתבצעת בדיאלוג הקיים של מודול 6 בהקלדת `0` — **לא באייקון.**
‏`🔗 מראת ⑰+㊱+㊳ — SSOT: processes-approved.md (לא לערוך כאן)`

**ומה שנשאר תקף מהסעיף הזה — כלל-הרכיב עצמו, לכל מסך שכן יציג פעולה הרסנית:**
‏`src/CLAUDE.md` (עוגן-גריפ: `פח-אשפה מול ארכיון`) — **פח = הסרת שורה מטופס שלא נשמר; רשומה
קיימת מארכבים ולא מוחקים.** ‏**ובפקד חסום — נשאר, מושבת ומנומק, לעולם לא נעלם** *(㉚)*.
🔑 **וכך זה מתממש בדיאלוג של מ6:** ‏**רצפת-הספינר נשארת `1` עם הסבר בשורה** *(‏`🎓㉚`)*, ולא
פקד שנעלם. **הסרה = הקלדת `0`, ולכן חסימתה היא רצפת-מספר ולא כפתור מושבת.**
**ושני נימוקים שונים בכוונה**, כי היא צריכה לדעת איזה משני החוקים חסם אותה:
‏**`הוזמן`/`מוכן`** ⇒ *"הפריט כבר הוזמן — לא ניתן להסירו"* · **`טרם החל` עם כמות-בפועל > 0** ⇒
*"הגיעו כבר פריטים — לא ניתן להסיר"*.

### 5.4 גלולת-מסנן — `src/components/FilterPill.jsx`

עוגן-גריפ: `const off = 'border-slate-200 bg-white text-slate-600'`.

| מצב | המחלקות | הערכים לציור |
|---|---|---|
| **כבוי** | `border-slate-200 bg-white text-slate-600` | לבן · מסגרת `#E2E8F0` · טקסט `#45556C` |
| **דלוק (רגיל)** | `border-teal-200 bg-teal-50 text-teal-700 font-semibold` | רקע `#F0FDFA` · מסגרת `#96F7E4` · טקסט `#00786F` |
| **דלוק (`tone="warn"`)** | `border-amber-200 bg-amber-50 text-amber-700 font-semibold` | רקע `#FFFBEB` · מסגרת `#FEE685` · טקסט `#BB4D00` |
| **מושבת** | `opacity-50` | 50% שקיפות |

**הצורה:** `h-auto rounded-full border px-3 py-1 text-[12.5px]` + `aria-pressed`.

🔴 **וזה בדיוק המקום שהצבע הוא משמעות:** *"טורקיז **בהיר** למצב-נבחר, בעוד הטורקיז **המלא** שמור
לפעולה הראשית של המסך"* (`FilterPill.jsx`, עוגן-גריפ: `וכאן הסטייה מסוכנת במיוחד`).
**מסנן-פעיל שנצבע כמו הכפתור הראשי הוא בדיוק הפגם שישי כבר תפס פעם אחת.**

🔴 **‏`disabled` אינו "להעלים" — הוא "להשאיר ולהסביר".** מסנן שאין לו דאטה **נשאר על המסך מכובה
ומנומק** (עוגן-גריפ: `disabled\` אינו "להעלים"`).
🔑 **וזו המוסכמה שההכרעה ㉚ נשענת עליה, והיא חלה על *כל* פקד ולא רק על גלולה** — ‏**מה שנחסם
בגלל *מצב* נשאר מושבת ומנומק; מה שנחסם בגלל *היעדר הרשאה* מוסר מהמסך לגמרי.**
‏`🔗 מראת ㉚ — SSOT: processes-approved.md (לא לערוך כאן)`.

### 5.5 טבלה

`src/modules/06_projects/LogisticsTab.jsx`, עוגן-גריפ `<table className="w-full border-collapse text-sm">`:

- **טבלה:** `w-full border-collapse text-sm`
- **שורת-כותרת:** `border-b border-slate-200 text-right text-xs font-semibold text-slate-500`
- **תא-כותרת:** `px-2.5 py-1.5` + רוחב באחוזים (`w-[46%]`, `w-[17%]`…)
- **שורת-גוף:** `border-b border-slate-100`
- **תא-גוף:** `px-2.5 py-2.5`
- **שם-פריט:** `font-semibold text-slate-800` · **שורת-משנה** (`SKU`): `text-[11.5px] text-slate-500` בתוך `<Ltr>`
- **ערך מספרי בולט:** `text-[13.5px] font-bold text-slate-800` בתוך `<Ltr>`
- **הערת-אזהרה בתא:** `text-[11px] font-semibold text-amber-700` (וכשהיא ניטרלית: `text-slate-400`)

**‏🔴 תקציב-הצבע של הטבלה, כפי שנכתב בקוד** (עוגן-גריפ: `תקציב-הצבע: אפס שורות אדומות`):
**אפס שורות אדומות; ענבר רק על "הוגדל מ-…" (הגדלה יוצרת חוסר); הקטנה אפורה (עובדה).**

**שורת-טבלה לחיצה:** כל פקד בתוכה חייב `onClick={(e) => e.stopPropagation()}`.

### 5.6 דיאלוג

`src/components/ui/dialog.jsx` (עוגן-גריפ: `sm:max-w-lg`) + `ConfirmDialog.jsx` (עוגן-גריפ: `sm:max-w-md`):

- **רוחב:** דיאלוג רגיל `sm:max-w-lg` = **512px** · דיאלוג-וידוא `sm:max-w-md` = **448px**
- **צורה:** `rounded-xl border shadow-lg`, ‏`max-h-[90vh]`, ממורכז
- **‏🔴 `dir="rtl"` מפורש על `DialogContent`** — אין `DirectionProvider` בפרויקט; כל משטח שנפתח
  ב-portal מקבל את התכונה ידנית (`src/CLAUDE.md`, עוגן-גריפ: `מקבל \`dir="rtl"\` מפורש`)
- **כפתור-סגירה בפינה ה**שמאלית** (`left-4`) · כותרת `sm:text-right` · ‏footer `sm:justify-start`
- **ברירות-מחדל של `ConfirmDialog`:** כותרת `אישור פעולה` · אישור `אישור` · ביטול `ביטול`
  (עוגן-גריפ: `const DEFAULTS = {`)

### 5.7 שדה-קלט ריק — מעבר-קלט-ריק (חובה לפני שמוקאפ מוצג לישי)

`src/CLAUDE.md` (עוגן-גריפ: `מעבר-קלט-ריק`): **כל `<input>`/`<select>` ריק חייב `placeholder`
שמראה את הפורמט/הדוגמה, או טקסט-עזר צמוד.** שדה עם ערך-דוגמה ממולא — פטור.
*(ישי תפס בדיוק את זה במוקאפ של מודול 4 ושאל "איך אני יודע שאין עוד".)*
**תיבת-חיפוש: זכוכית-מגדלת בצד ימין** + `padding-right` (‏`Topbar.jsx`, עוגן-גריפ: `pr-9`).

### 5.8 מצב ריק / חסום / שגיאה — המחרוזות הנעולות

**‏`src/components/PermissionAwareEmpty.jsx`** — שלושה מצבים, ומחרוזות שנעולות בקובץ:

| מה | הערך המדויק | העוגן |
|---|---|---|
| כותרת-שגיאה | `לא ניתן לטעון את הנתונים.` | `const ERROR_TITLE` |
| תווית-נסיון-חוזר | **`נסי שוב`** ‏(**נקבה**, מקודד-קשיח) | `const RETRY_LABEL` |
| סימן-חסימה | `—` | `export const DENIED_MARK` |
| מעטפת | `flex flex-col items-center gap-2 py-12 text-center` (בשגיאה: `gap-3` + `role="alert"`) | `items-center gap-2 py-12` |
| כותרת ריק/חסום | `text-slate-600 font-medium` · פירוט `text-sm text-slate-500` | `text-slate-600 font-medium` |
| כותרת שגיאה | `text-red-600 font-semibold` · פירוט `text-sm text-slate-600` | `text-red-600 font-semibold` |
| מנעול | `🔒` באמוג'י, `text-2xl`, `aria-hidden="true"` — **דקורטיבי** | `aria-hidden="true"` |

**‏`src/components/LoadingOrError.jsx`:**

| מה | הערך המדויק | העוגן |
|---|---|---|
| טעינה | `טוען...` ‏(`text-slate-500`, `role="status" aria-live="polite"`) | `טוען...` |
| שגיאה | `<p className="text-red-600 font-semibold">{error}</p>` | `text-red-600 font-semibold` |
| ‏🔴 תווית-נסיון-חוזר | **ברירת-המחדל היא `נסה שוב` — לשון זכר** | `retryLabel = 'נסה שוב'` |
| שלד-טעינה | `variant`: `table` · `cards` · `card` · `fields` · `page`; הפס עצמו `animate-pulse rounded bg-slate-200` | `const BAR =` |

**המחרוזות שכבר נעולות ל**לוגיסטיקה** — `src/lib/projectLogistics.js`** (עוגן-גריפ: `export const LEGAL_EMPTY_TITLE`).
מוקאפ שמצייר אחד מהמצבים האלה **מעתיק את המשפט, לא כותב אותו מחדש**:

- `LEGAL_EMPTY_TITLE` — *"לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד."*
- `LEGAL_EMPTY_DETAIL` — *"מצב תקין. פרויקט בלי פריטי לוגיסטיקה נספר כמוכן לוגיסטית."*
- `NO_PERMISSION_SENTENCE` — *"אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין."*
- `BROKEN_EMPTY_DETAIL` — *"להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין."*
- `LOAD_FAILURE_DETAIL` — *"נתוני הלוגיסטיקה של הפרויקט לא נטענו."*
- `MONEY_HIDDEN_SENTENCE` — *"אין לך הרשאה לצפות בנתונים כספיים."*
- `SORT_LINE` — *"ממוין: מה שרחוק ביותר ממוכן — תחילה"*
- `FROZEN_PRICE_SENTENCE` — *"המחיר ליחידה נלקח מההצעה המקורית ואינו מחושב מחדש."*

🔴 **ושלושת המצבים חייבים להיקרא שונה זה מזה** — *"'ריק' ו'חסום' שנראים זהים הם הכשל השקט המסוכן
של המודול"* (‏S-26). קריאה שנחסמה ב-RLS מחזירה `{data:null, error:null}` — **זהה-בייט לאפס שורות.**

### 5.9 ניסוח — מעבר-ניסוח (`src/CLAUDE.md`, עוגן-גריפ: `מעבר-ניסוח`)

① **קודם כול לחפש מחרוזת שכבר קיימת** בקוד/במסד/במסכים · ② **תווית היא צירוף-שם, לא משפט**
(*"סיבות דחייה"*, לא *"למה הפסדנו"*; **פועל בתווית = סימן שתרגמתי**) · ③ **בלי מטאפורות מיובאות**
(*"צנרת"*, *"משפך"*, *"לידים"*).

---

## ⑥ מין — כל מחרוזת שמודול 5 כותב היא **בלשון נקבה**

> ‏`🔗 מראת ㉜ — SSOT: processes-approved.md (לא לערוך כאן)`

**ההכרעה:** ‏S-28 של מודול 6 — **כל חמש המשתמשות נשים.** ‏**מודול 5 הולך אחרי מודול 6.**
**העוגן:** ‏`src/components/PermissionAwareEmpty.jsx`, עוגן-גריפ `לשון-נקבה — S-28: כל חמש המשתמשות`.

**מה כל רכיב עושה בפועל — וזו ההבחנה שקובעת מה המוקאפ מצייר:**

| הרכיב | מה הוא נותן | מה זה אומר למוקאפ |
|---|---|---|
| `PermissionAwareEmpty` | **מקודד-קשיח `נסי שוב`** — נקבה, אין פרמטר לשנות | ✅ **לצייר `נסי שוב`.** אין מה להחליט |
| `LoadingOrError` | **ברירת-מחדל `נסה שוב`** — זכר; יש `retryLabel` לדריסה | ⚠️ **לצייר `נסי שוב`** ולסמן שהבנייה חייבת להעביר `retryLabel="נסי שוב"` במפורש |

**התקדים המחייב:** ‏`src/modules/06_projects/CLAUDE.md`, עוגן-גריפ `retryLabel="נסי שוב"` —
*"`retryLabel="נסי שוב"` בכל משטחי המודול (S-28, לשון-נקבה); ברירת-המחדל המשותפת של `LoadingOrError`
לא שונתה (חוצה-מערכת, `🚧 מ12`)."*
⇒ **החלפת ברירת-המחדל היא חוב רשום ל-מ12 ואינה של מודול 5 לעשות.** מודול 5 דורס באתר-הקריאה.

**‏`ERROR_TITLE` = *"לא ניתן לטעון את הנתונים."* חסר-מין ותקין כפי שהוא** — לא להנקיב אותו.
**כלל-אצבע לכל מחרוזת חדשה:** *"בחרי"*, *"עדכני"*, *"סמני"*, *"נסי"*, *"אין לך הרשאה"* — ולא
*"בחר"*, *"עדכן"*, *"סמן"*. ‏**וכשאפשר לנסח בלי מין (שם-פעולה: "עדכון מצב") — זה עדיף.**

---

## ⑦ שלד HTML להעתקה

**מה זה:** דף עצמאי לחלוטין (בלי CDN, בלי גופן חיצוני) שנפתח נכון בלחיצה כפולה בדפדפן. הוא מכיל
את המעטפת (סרגל ימני + סרגל עליון), ודוגמה אחת מכל אחד: **StatTile · תג-סטטוס · גלולת-מסנן · שורת-טבלה**,
בתוספת כפתור ראשי, כפתור משני, כפתור-שורה, ומצב-ריק.

**כללי-שימוש:** ‏① **את בלוק `:root` לא נוגעים** — הערכים מדודים ‏② כל ערך שאינו עברית טהורה עובר
דרך `class="ltr"` ‏③ שני מספרים באותו משפט — **מילה עברית ביניהם** ‏④ שם-הקובץ באנגלית, ב-
`docs/mockups/logistics-screen/` ‏(היום יש שם `01.png` ו-`02.png` בלבד; המוסכמה ממודול 6:
תת-תיקיית `drafts/` ואז `approved/` עם סיומת `_approved.html`).

> 🔴 **‏⑤ והכלל שמכריע מה מותר לכתוב *בתוך* השלד** *(הכרעה 22/08/2026, אחרי שבקר תפס כאן תאריך
> וכמויות שאינם קיימים ב-`data-set.md`)*: **השלד הוא *גלריית-רכיבים*, לא מוקאפ.** תפקידו להראות
> **איך מצב נראה**, לא **איזו שורה מצוירת** ⇒ **המספרים והתאריכים שבו הם המחשה, ופטורים מכלל-הבית
> `🚫 אין המצאת שם, מק"ט, לקוח או תאריך`** — ‏**שחל במלואו, וללא פטור, על המוקאפים עצמם.**
> 🔑 **החריג היחיד שאינו פטור — שמות-מוצר ומק"טים:** הם **כן** חייבים לבוא מהקטלוג האמיתי, כי מק"ט
> מומצא נוסע מכאן אל המוקאפ בהעתק-הדבק ואיש לא בודק אותו שוב. *(וזה בדיוק מה שקרה: שני מק"טים
> מומצאים ישבו כאן עד 22/08 והוחלפו בשורות האמיתיות של `#107`.)*
> 🚫 **ובכיוון ההפוך: אין לצייר במוקאפ מספר שראית כאן.** ‏**המוקאפ שואב אך ורק מ-`data-set.md`**
> *(‏§⑦½ למטה)*.

```html
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>מוקאפ מ5 · &lt;שם המשטח&gt;</title>
<style>
/* ═══ טוקנים — מדודים 21/08/2026. אל תשנה ערך. ═══
   --primary : מילולי ב-src/index.css (--primary: #0d9488) — הטוקן של <Button> ברירת-מחדל
   --teal600 : המרת oklch→sRGB מ-node_modules/tailwindcss/theme.css — זה מה ש-bg-teal-600 מצייר
   🔴 השניים אינם אותו צבע. ר' design-contract.md §1.3. אל תעתיק הקסה של Tailwind 3. */
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

/* ═══ הכלל שנשבר הכי הרבה: כל ערך שאינו עברית טהורה עובר דרך .ltr ═══
   מקור: src/components/Ltr.jsx · Money.jsx
   ⚠️ ולשני מספרים ברצף אין סדר נכון בכלל — מפרקים אותם ("3 מתוך 5"), לא מבודדים. */
.ltr{ direction:ltr; unicode-bidi:isolate; display:inline-block; }

/* ── מעטפת: סרגל ימני + סרגל עליון. מאפיינים פיזיים בלבד (right/left) ── */
.side{position:fixed; top:0; right:0; width:var(--sidebar); height:100vh; background:#fff;
      border-left:1px solid var(--s200); z-index:30}
.side .logo{height:var(--topbar); display:flex; align-items:center; justify-content:center;
      border-bottom:1px solid var(--s100); font-weight:700; color:var(--teal700); letter-spacing:.5px}
.side nav{padding:12px 8px; display:flex; flex-direction:column; gap:4px}
.nav-i{display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:var(--r-lg);
      font-size:14px; font-weight:500; color:var(--s600); text-decoration:none}
.nav-i .ic{width:20px; text-align:center; flex:none}
.nav-i.on{background:var(--teal50); color:var(--teal700)}      /* פריט פעיל — §4 */
.top{position:fixed; top:0; left:0; right:var(--sidebar); height:var(--topbar); background:#fff;
     border-bottom:1px solid var(--s200); display:flex; align-items:center;
     justify-content:space-between; padding:0 24px; z-index:20}
.top h1{font-size:17px; font-weight:700; color:var(--s800)}
main{margin-right:var(--sidebar); padding:calc(var(--topbar) + 24px) 24px 40px}

/* ── אריח-מדד: לבן + מסגרת. לעולם לא מילוי-צבע (StatTile.jsx) ── */
.tiles{display:flex; flex-wrap:wrap; gap:12px}          /* flex-wrap, לא grid */
.tile{border:1px solid var(--s200); background:#fff; border-radius:var(--r-xl); padding:16px;
      display:flex; flex-direction:column; align-items:flex-start; gap:2px; min-width:180px}
.tile .lb{font-size:12px; color:var(--s500)}
.tile .vl{font-size:20px; font-weight:700; color:var(--s800)}
.tile .sub{font-size:11px; color:var(--s500)}
.tile-empty{font-size:14px; color:var(--s400)}  /* 🔴 שם נפרד בכוונה — `.empty` הכללי (למטה) הוא flex+padding ומנפח את האריח ב-70px. אותו שם בדיוק כמו במוקאפים המאושרים של מ6. */

/* ── תג-סטטוס (StatusTag.jsx) — הטון הוא משמעות, לא קישוט ── */
.st{display:inline-block; white-space:nowrap; border-radius:9999px; padding:2px 10px;
    font-size:11px; font-weight:600}
.st.ok{background:var(--green100); color:var(--green700)}
.st.teal{background:var(--teal100); color:var(--teal700)}
.st.muted{background:var(--s100); color:var(--s500)}
.st.warn{background:var(--amber200); color:var(--amber800)}
.st.outline{background:var(--s100); color:var(--s600); border:1px solid var(--s200)}
.st.dashed{background:var(--s100); color:var(--s500); border:1px dashed var(--s300)}

/* ── גלולת-מסנן (FilterPill.jsx) — טורקיז בהיר לנבחר; המלא שמור לפעולה ── */
.pill{border-radius:9999px; border:1px solid var(--s200); background:#fff; color:var(--s600);
      padding:4px 12px; font:inherit; font-size:12.5px; cursor:pointer}
.pill.on{border-color:var(--teal200); background:var(--teal50); color:var(--teal700); font-weight:600}
.pill.on.warn{border-color:var(--amber200); background:var(--amber50); color:var(--amber700)}
.pill:disabled{opacity:.5; cursor:default}

/* ── כפתורים: ברירת-המחדל של Button קטנה מהאמת — הדריסה h-auto py-2 px-4 ── */
.btn{border:1px solid transparent; border-radius:var(--r-lg); padding:8px 16px;
     font:inherit; font-size:14px; font-weight:600; cursor:pointer}
.btn-primary{background:var(--teal600); color:#fff}
.btn-primary:hover{background:var(--teal700)}
.btn-outline{background:#fff; border-color:var(--s300); color:var(--s700); font-weight:500}
.btn-danger{background:var(--red600); color:#fff}
.btn-danger:hover{background:var(--red700)}
.rowact{width:30px; height:30px; border-radius:var(--r-md); border:1px solid var(--s200);
     background:#fff; color:var(--s600); display:inline-flex; align-items:center;
     justify-content:center; cursor:pointer}
/* ㉚ — פקד חסום נשאר ומוסבר, לעולם לא נעלם. אותו opacity:.5 של .pill:disabled */
.rowact:disabled{opacity:.5; cursor:not-allowed}
/* ⚠️ ㊳ — ואף שורה בשלד הזה אינה משתמשת ב-.rowact: לצ'קליסט של מ5 אין פקד-שורה כלל
   מאז שההסרה עברה לדיאלוג של מודול 6. הסגנון נשאר כמראה של src/components/RowAction.jsx
   למי שיצטרך פקד-שורה בעתיד — ואינו רמז שיש כזה במודול 5 היום. */

/* ── כרטיס וטבלה (LogisticsTab.jsx) ── */
.card{background:#fff; border:1px solid var(--s200); border-radius:var(--r-xl); padding:16px}
.card h2{font-size:15px; font-weight:700; color:var(--s800); margin-bottom:4px}
.hint{font-size:11.5px; color:var(--s400)}
table{width:100%; border-collapse:collapse; font-size:14px}
thead tr{border-bottom:1px solid var(--s200); text-align:right;
     font-size:12px; font-weight:600; color:var(--s500)}
th{padding:6px 10px; font-weight:600}
tbody tr{border-bottom:1px solid var(--s100)}
td{padding:10px}
.item-name{font-weight:600; color:var(--s800)}
.item-sku{margin-top:2px; font-size:11.5px; color:var(--s500)}
.num{font-size:13.5px; font-weight:700; color:var(--s800)}
.note-warn{font-size:11px; font-weight:600; color:var(--amber700)}
.note-mute{font-size:11px; color:var(--s400)}

/* ── מצב-ריק / חסום / שגיאה (PermissionAwareEmpty.jsx) ── */
.empty{display:flex; flex-direction:column; align-items:center; gap:8px;
     padding:48px 0; text-align:center}
.empty .ttl{color:var(--s600); font-weight:500}
.empty .dtl{font-size:14px; color:var(--s500)}
.empty .err{color:var(--red600); font-weight:600}
</style>
</head>
<body>

<aside class="side">
  <div class="logo">REG-IN</div>
  <nav>
    <a class="nav-i" href="#"><span class="ic">🏠</span>מסך הבית</a>
    <a class="nav-i on" href="#"><span class="ic">📦</span>לוגיסטיקה</a>
    <a class="nav-i" href="#"><span class="ic">📁</span>פרויקטים</a>
  </nav>
</aside>

<header class="top">
  <h1>בקרה לוגיסטית</h1>
  <button class="btn btn-primary">עדכון מצב פריטים</button>
</header>

<main>

  <!-- אריחי-מדד: לבן + מסגרת, תווית מעל הערך, flex-wrap -->
  <section class="tiles" style="margin-bottom:16px">
    <div class="tile">
      <span class="lb">פריטים מוכנים</span>
      <span class="vl"><span class="ltr">3</span> מתוך <span class="ltr">5</span></span>
      <span class="sub">2 פריטים טרם מוכנים</span>
    </div>
    <div class="tile">
      <span class="lb">אירועים השבוע</span>
      <span class="vl"><span class="ltr">4</span></span>
    </div>
    <div class="tile">
      <span class="lb">שינויי תכולה</span>
      <span class="tile-empty">אין נתונים עדיין</span>
    </div>
  </section>

  <!-- גלולות-מסנן: נבחר = טורקיז בהיר; הטורקיז המלא שמור לפעולה הראשית.
       🔗 מראת ㉙ — SSOT: processes-approved.md (לא לערוך כאן)
       שלוש גלולות בלבד, בשמן: `דורש טיפול` (ברירת-המחדל, ולכן היא הדלוקה) · `ממתין למשלוח` · `הכול`.
       ⚠️ עד 22/08/2026 עמדו כאן ארבע גלולות אחרות — השלד נכתב לפני ㉙, בדיוק כמו במקרה ㉚ למטה.
       🚫 ובפרט אין ואסור שתהיה גלולת "בוטלו": פרויקט מבוטל אינו פרויקט פעיל ⇒ אינו מגיע למשטח 1
          כלל, ונראה דרך משטח 2 בלבד (processes-approved.md, עוגן-גריפ: `ושניים מחוץ לכל הגלולות`;
          ההקצאה המדודה — data-set.md, עוגן-גריפ: `אינו מגיע למשטח 1 כלל`). אין לשחזר. -->
  <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px">
    <button class="pill on">דורש טיפול</button>
    <button class="pill">ממתין למשלוח</button>
    <button class="pill">הכול</button>
  </div>

  <section class="card">
    <h2>פריטי האירוע</h2>
    <p class="hint" style="margin-bottom:10px">ממוין: מה שרחוק ביותר ממוכן — תחילה</p>

    <table>
      <!-- 🔴 ㊳ (22/08/2026) — אין עמודת-פעולה, ואין פח-הסרה (🗑) באף שורה של הצ'קליסט.
           עד 22/08/2026 עמדה כאן עמודה חמישית ובה פח מושבת בכל שורה. ההכרעה ㊳ קבעה
           שהסרת פריט היא שינוי-תכולה של *מנהלת הפרויקטים*, ומתבצעת בדיאלוג שינוי-התכולה
           הקיים של מודול 6 בהקלדת `0` — ולא במסך של מודול 5. ⇒ לצ'קליסט אין מה להשבית,
           כי אין בו פקד הסרה מלכתחילה. אין לשחזר את העמודה.
           (processes-approved.md, עוגני-גריפ: `🎓㊳` + `🔄ה`.)
           🔑 ומוסכמת ㉚ עצמה לא בוטלה — היא חלה עכשיו בדיאלוג של מ6, שם רצפת-הספינר
           נשארת `1` עם הסבר בשורה, במקום פקד שנעלם. -->
      <thead>
        <tr>
          <th style="width:50%">פריט</th>
          <th style="width:18%">כמות מתוכננת</th>
          <th style="width:16%">כמות בפועל</th>
          <th style="width:16%">מצב הפריט</th>
        </tr>
      </thead>
      <tbody>
        <!-- 🚫 אין המצאת מק"ט ואין המצאת שם-פריט: שלוש השורות לקוחות מקטלוג-המוצרים דרך
             data-set.md (עוגן-גריפ: `קטלוג המוצרים`), והצמד מק"ט↔שם נלקח משם כמות-שהוא.
             שלושתן חיות יחד על `#107` — B-SAT-LAN (טרם החל) · B-REG-TAG (הוזמן) · B-ECO-TAG (מוכן).
             ⚠️ עד 22/08/2026 עמדו כאן `B-REG-TBL` ו-`B-REG-RUP`, שאינם קיימים בקטלוג בן 11 המק"טים
             ומפרים את חוק-הבית `🚫 אין המצאת שם, מק"ט, לקוח או תאריך`. אין לשחזר אותם. -->
        <tr>
          <td>
            <div class="item-name">שרוך סאטן - ממותג</div>
            <div class="item-sku"><span class="ltr">B-SAT-LAN</span></div>
          </td>
          <td>
            <div class="num"><span class="ltr">12</span></div>
            <div class="note-warn">⚠ הוגדל מ-<span class="ltr">8</span> · <span class="ltr">18/08</span></div>
          </td>
          <td><span class="ltr">8</span></td>
          <td><span class="st muted">טרם החל</span></td>
        </tr>
        <tr>
          <td>
            <div class="item-name">תג שם רגיל - ממותג</div>
            <div class="item-sku"><span class="ltr">B-REG-TAG</span></div>
          </td>
          <td><div class="num"><span class="ltr">300</span></div></td>
          <td><span class="ltr">300</span></td>
          <td><span class="st teal">הוזמן</span></td>
        </tr>
        <tr>
          <td>
            <div class="item-name">תג שם אקולוגי - ממותג</div>
            <div class="item-sku"><span class="ltr">B-ECO-TAG</span></div>
          </td>
          <td><div class="num"><span class="ltr">2</span></div></td>
          <td><span class="ltr">2</span></td>
          <td><span class="st ok">מוכן</span></td>
        </tr>
      </tbody>
    </table>

    <p class="hint" style="margin-top:8px">
      שלושת מצבי הפריט, לפי הסדר: <b>טרם החל</b>, <b>הוזמן</b>, <b>מוכן</b>.
    </p>
  </section>

  <!-- מצב-ריק כדין (המחרוזות נעולות ב-src/lib/projectLogistics.js) -->
  <section class="card" style="margin-top:16px">
    <div class="empty">
      <p class="ttl">לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד.</p>
      <p class="dtl">מצב תקין. פרויקט בלי פריטי לוגיסטיקה נספר כמוכן לוגיסטית.</p>
    </div>
  </section>

  <!-- מצב חסום-הרשאה: מנעול דקורטיבי, ולעולם לא 0 -->
  <section class="card" style="margin-top:16px">
    <div class="empty">
      <span aria-hidden="true" style="font-size:24px">🔒</span>
      <p class="ttl">אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין.</p>
      <p class="dtl">המונה מציג <span class="ltr">—</span>, לא <span class="ltr">0</span>.</p>
    </div>
  </section>

  <!-- מצב שגיאה: "נסי שוב" — נקבה (S-28) -->
  <section class="card" style="margin-top:16px">
    <div class="empty" role="alert">
      <p class="err">לא ניתן לטעון את הנתונים.</p>
      <p class="dtl">נתוני הלוגיסטיקה של הפרויקט לא נטענו.</p>
      <button class="btn btn-outline">נסי שוב</button>
    </div>
  </section>

</main>
</body>
</html>
```

---

## ⑦½ 🔗 הקובץ השני שכל צייר חייב — **מערך-הנתונים**

🔴 **החוזה הזה קובע איך זה נראה. הוא אינו קובע *אילו שורות* מצוירות.**
זה נקבע ב-**`docs/specs/module_05_logistics/data-set.md`** — נמדד חי מהמסד, עם "היום" אחד משותף
לשני המוקאפים והקצאה פר-משטח.
🚫 **צייר שיקבל רק את החוזה יבחר דאטה משלו** ⇒ פרויקט שמופיע במסך אחד ייעלם באחר — **בדיוק הכשל
ששני הקבצים האלה קיימים כדי למנוע.** ‏**פרומפט-הצייר חייב להצביע לשניהם.**
*(נוסף 21/08/2026 אחרי בקרת-חוזה בהקשר-טרי: החוזה נכתב לפני שמערך-הנתונים נולד ולא הזכיר אותו כלל.)*

---

## ⑧ מה חיפשתי — כולל מה שלא נמצא

> 🔬 **מבקרת-ההקשר-הטרי של `21/08/2026`, מה ששרד ממנה כרישום-אימות:** ‏**29 ערכי-ההקס של §1.2
> הומרו שנית מ-OKLCH באופן בלתי-תלוי — כולם נכונים.**
> *(שאר ממצאיה — ציטוט כותרת `processes-approved.md`, מניין הקבצים בתיקייה, וסיכומי-משפחות-הצבע —
> **תוקנו בגוף המסמך `22/08/2026`**: פריט 1 למטה ו-§1.1. **הערת-התיקון עצמה הוסרה בכוונה** — הערה
> שמצביעה על טקסט שכבר תוקן היא בדיוק פגם ריבוד-התיקונים, ואין לשחזר אותה.)*

**גריפים ופקודות שרצו (‏21/08/2026), לפי סדר:**

| # | מה חיפשתי | התוצאה |
|:-:|---|---|
| 1 | `grep -rhoE "(bg\|text\|border)-[a-z]+-[0-9]{2,3}" src/ \| sort \| uniq -c \| sort -rn` | ‏50 שורות · 5 משפחות · §1.1 |
| 2 | אותו חיפוש על 17 משפחות אחרות (`blue`, `purple`, `orange`, `gray`, …) | **פלט ריק** — אין משפחה שישית |
| 3 | `grep -rhoE "(bg\|text\|border)-white" src/` | `bg-white` ×81 · `text-white` ×35 |
| 4 | `node_modules/tailwindcss/theme.css` — כל `--color-{slate,teal,amber,red,green}-*` | ‏OKLCH; הומר ל-sRGB (§1.2) |
| 5 | הצלבה מול `03_tab_logistics_approved.html` | **התאמה מלאה** — כל ערך משותף זהה |
| 6 | `src/components/{StatTile,StatusTag,FilterPill,LoadingOrError,PermissionAwareEmpty,Money,Ltr,ConfirmDialog,RowAction}.jsx` | נקראו במלואם |
| 7 | `src/lib/projectLogistics.js` · `src/lib/projects.js` (`PROJECT_STATUS_TONES`) | נקראו |
| 8 | ‏`src/CLAUDE.md` — סעיפי RTL, כיווניות, חמשת-המעברים | נקראו במלואם |
| 9 | `scripts/check-bidi-glyphs.mjs` | הביטוי הוא `₪`/`★`/`×` בלבד (§4.4) |
| 10 | `grep -rn "design-contract" --include=*.md .` | ‏**47 מופעים ב-6 קבצים**; שני ציטוטים חיים באפיון-מ6 (§ראש-המסמך) |
| 11 | `grep -rn "מתוך" src/modules/06_projects/LogisticsTab.jsx` | התבנית `<Ltr>{n}</Ltr> מתוך <Ltr>{m}</Ltr>` (§4.3) |
| 12 | `Sidebar.jsx` · `Topbar.jsx` · `MainLayout.jsx` | ‏240/64 px, מאפיינים פיזיים |

**‏🔬 והשלד של §⑦ לא רק נכתב — הוא הורץ בדפדפן חי ונמדד** (‏21/08/2026, ‏Playwright, ‏1280×1100).
**ארבע הבדיקות שעברו, עם המספרים:**

| הבדיקה | מה נמדד | התוצאה |
|---|---|---|
| **יישור תווית↔ערך באריח** (מעבר-הכיווניות ①, `src/CLAUDE.md`) | הקצה הימני של תווית · ערך · שורת-משנה | ‏**999 · 999 · 999** — זהים |
| **סדר שני ערכים** | `⚠ הוגדל מ-8 · 18/08` | `8`@487 · `18/08`@451 ⇒ `8` מימין, נקרא ראשון ✅ |
| **שבר-התקדמות** | `3 מתוך 5` | `3`@988 · `5`@919 ⇒ סדר נכון ✅ |
| **תוכן מתחת לסרגל** | קצה-שמאל של הסרגל מול קצה-ימין של `main` | **1040 מול 1040** — נוגעים, לא חופפים ✅ |

*(הצילום והשרת הזמני נמחקו; ‏`git status` נקי מלבד הקובץ הזה.)*

**‏🚫 מה חיפשתי ולא מצאתי — "אין" הוא תשובה לגיטימית, אבל צריך לומר מה חיפשתי:**

1. **‏`docs/specs/module_05_logistics/screens-approved.md` — ‏🆕 נוצר 22/08/2026, ‏שלב 2 נסגר**
   *(עודכן כאן באותו יום; קודם עמד "טרם נוצר", וזה היה נכון בבוקר ושגוי בערב)*. **בתיקייה שישה
   קבצים** — נוסף `screens-approved.md`, ובו **שני כרטיסי-מסך** בדגם תשעת-הסעיפים של מודול 6
   *(נכתבו שלושה, והשלישי נמחק ב-㊳)*. ‏**שלב 1 סגור** — **שבעת כרטיסי-התהליך מאושרים ·
   ‏`M = 2` משטחים · ‏38 הכרעות ברשם** *(‏①–㊳; קודם נכתב כאן "34" ואז "37" — הרשם גדל
   ב-㉟ · ㊱ · ㊲ · ㊳)*.
   ⇒ **חוזה-העיצוב אינו יודע מה מצויר בכל מסך — רק איך.**
2. **‏`src/modules/05_logistics/` — לא קיים** (הצהרה מפורשת ב-`processes-approved.md`). כל התקדימים
   בקובץ הזה נשאבו מ-`src/modules/06_projects/LogisticsTab.jsx` ומהרכיבים המשותפים.
3. **‏`docs/mockups/logistics-screen/` — ‏🆕 נוספה `approved/` ובה שני המוקאפים** *(תוקן 22/08: הם קודמו מ-`drafts/` אחרי אישור-ישי, ו-`drafts/` **אינה קיימת יותר**)* *(‏22/08/2026; צוירו שלושה, והשלישי נמחק ב-㊳ יחד עם המשטח שלו)*.
   ‏`01.png` ו-`02.png` שבשורש הם **קדם-Discovery ואפס-אמינות** *(הכרעה ①)*, ואין עדיין `approved/`
   — ‏**הקידום ל-`approved/` הוא פעולת-ישי אחרי מעבר-עיניים.**
4. **טוקן-מרווחים (spacing scale) מוצהר — אין כזה.** ‏`@theme inline` ב-`index.css` מגדיר
   `--radius-*` ו-`--font-*` בלבד; מרווחים הם `p-4`/`gap-2` פר-רכיב. ⇒ **§⑦ מביא את המרווחים
   של הרכיבים בפועל, ולא ממציא סולם.**
5. **תג-סטטוס אדום — לא קיים בשום מקום.** ‏`TONES` מונה שישה טונים ואף אחד אינו אדום. אדום =
   שגיאת-טעינה או כפתור-הרסני-מאושר בלבד.
6. **מצב-כהה — לא נגיש.** אין מתג, `.dark` לא מופעל אף פעם, והטוקן שלו נשאר אפור.
   ⏸️ נדחה ל-מ12 בהכרעת-ישי 29/07/2026. ⇒ **המוקאפים מציירים מצב-בהיר בלבד.**
7. **מסך "צפיפות" / breakpoint מוצהר — לא מצאתי.** יש `sm:grid-cols-2` ב-`CardsSkeleton` ו-`sm:max-w-*`
   בדיאלוגים, אך אין החלטת-רספונסיביות מתועדת. ⇒ **לצייר לדסקטופ**, כמו כל המוקאפים המאושרים.

</div>
