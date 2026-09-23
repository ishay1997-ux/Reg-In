// הצד השמאלי של חלון-הייצוא: **חמש השורות הראשונות של הקובץ עצמו.**
//
// 🔴 **`sheet` הוא הפלט של `buildExportSheet` ולא `rows` גולמי**, ולכן מה שנראה כאן עבר כבר
// את עיצוב-התאים, את מחיקת תווי-הכיווניות ואת הפיכת הסכומים למספרים. ⇒ **אי-אפשר שהתצוגה
// תראה משהו אחר מהקובץ.** השורה הראשונה במערך היא שורת-הכותרת.
//
// 🔑 **`reports-export-file` נשאר ה-testid של הבטחת-השם** — הוא זז מתחת לכפתור לתוך החלון
// (הכרעת-ישי 17/09/2026), אבל **החוזה לא השתנה**: `e2e/reports.spec.js` קורא ממנו את השם
// המובטח ומשווה אותו בייט-בבייט לקובץ שנחת. ‏testid חדש היה הופך העברה למחיקה.
//
// 🔴 **גלילה לצדדים — הכרעת-ישי 17/09/2026:** *"שיהיה ניתן להתמודד עם מספר רב של עמודות
// נדרש רק מן סרגל כזה שניתן לגלול לצדדים"*. **רק פס. לא פקד חכם.**
//
// ⚠️ **ו-`min-w-max` על הטבלה הוא מה שמאפשר לפס להתקיים — לא `overflow` על המכל.**
// 📊 **נמדד 17/09, ותפס תיקון שגוי שלי:** הוספתי `overflow-x-scroll` והצהרתי *"פס נראה"*,
// ואז המדידה החזירה `scrollWidth 614 == clientWidth 614 · canScroll false · עובי-פס 0`.
// **הסיבה:** הטבלה הייתה `w-full` ⇒ היא **נדחסת** כדי להיכנס למכל במקום לגלוש. ⇒ אין מה
// לגלול, אין פס — **וב-30 עמודות זה היה נותן רצועות בלתי-קריאות במקום גלילה.**
// ⇒ `min-w-max`: כל עמודה שומרת את רוחבה הטבעי, הטבלה רחבה מהמכל, **והפס מופיע מעצמו.**
// 🔑 **ו-`overflow-x-auto` ולא `scroll`** — `scroll` לא הוסיף פס נראה בפועל (עובי 0), ורק
// היה מייצר מסילה ריקה בפלטפורמות שכן מציירות אותה.
// ⚠️ **גבול-הראיה שלי:** עובי-הפס נמדד ב-Chromium headless. **על Windows אמיתי הוא ~15px**
// ואיני יכול לאמת זאת מכאן — זה נבדק על המכונה של ישי.
// ♿ **ו-`tabIndex` + `role="region"` אינם קוסמטיקה:** אזור שניתן לגלול חייב להיות
// מגיע-במקלדת, אחרת העמודות הנסתרות אינן נגישות למי שאינה משתמשת בעכבר.

// 🔴🔴 **מסנן מכותרת-העמודה — הכרעת-ישי 23/09/2026, והנימוק הוא גילוי ולא נוחות.**
//
// הוא הציע קליק-ימני. 📊 **נבדק מה גרידים אמיתיים עושים:** ‏AG Grid ו-MUI X נותנים קליק-ימני
// **כקיצור**, ולצידו **תמיד אייקון גלוי בכותרת** (ו-MUI אף מוסיף `Ctrl+Enter` למקלדת).
// 🔑 **הסיבה אינה טכנית אלא גילוי:** לקליק-ימני **אין סימן שהוא קיים** — מי שלא ינסה, לא יֵדע.
// ➕ **ואין לו מקבילה במקלדת** ⇒ הכפתור הוא גם הנתיב הנגיש. **שניהם, לא אחד במקום השני.**
//
// 🔴 **והוא אינו מערכת-סינון שנייה — וזה קריטי (כלל-ברזל 14):** הלחיצה **מוסיפה תנאי לאותה
// רשימת-`conditions` שבפאנל הימני**. מקור-אמת אחד, שתי דלתות-כניסה.
// ⚠️ האייקון מופיע בריחוף או בפוקוס, ו**נשאר דולק כשהמסנן פעיל** — כדי שאפשר יהיה לראות
// **אילו עמודות מסוננות בלי לקרוא את כל רשימת-התנאים**.
import { Filter } from 'lucide-react'

const HEAD_CELL = 'sticky top-0 bg-slate-50 px-2 py-1 text-right font-medium text-slate-600'
const BODY_CELL = 'whitespace-nowrap border-t border-slate-200 px-2 py-1 text-right'

// 🔴 **"כך ייראה הקובץ" — ולכן מספר מוצג בפורמט שהקובץ נושא, לא בערך הגולמי.**
// 📊 נמדד 23/09/2026 בדוח "הנחות ורווחיות": התצוגה הראתה `52.3095131596135` ו-`7578.87`,
// ובקובץ עצמו אותם תאים נקראים `52.3` ו-`7,579` (`PERCENT_FORMAT` · `MONEY_FORMAT` ב-`reportsExport.js`).
// ⇒ התצוגה סתרה את הקובץ שהיא מבטיחה להראות. הערך עצמו נשאר מספר מלא בקובץ — רק התצוגה מעוגלת.
// מוכרים כאן רק פורמטים בצורת `0` · `0.0` · `#,##0` וכו'; כל פורמט אחר ⇒ הערך הגולמי, כמו קודם.
function formatLikeExcel(n, format) {
  const match = /^(#,##)?0(?:\.(0+))?$/.exec(format ?? '')
  if (!match) return String(n)
  const digits = match[2]?.length ?? 0
  return n.toLocaleString('en-US', {
    useGrouping: Boolean(match[1]),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function cellValue(cell) {
  if (cell === null || cell === undefined) return ''
  if (typeof cell.value === 'number' && cell.format) return formatLikeExcel(cell.value, cell.format)
  return String(cell.value ?? '')
}

// 🔴🔴 **`<bdi>` על כל תא, וזה תיקון של ערך שנקרא **הפוך** — לא קוסמטיקה.**
//
// 📊 **נמדד 23/09/2026 באימות-עיניים על דוח הגיול, והמדידה היא העיקר:**
// המחרוזת הלוגית בתא היא `61–90` (קודנקודות `36 31 2013 39 30`), **ועל המסך היא
// נקראה `90–61`** · ו-`90+` נקרא `+90`. **הסיבה:** תחת `dir="rtl"` שתי רצפות-הספרות
// הן רצפי-LTR נפרדים, ו**סדר הרצפים עצמו הוא ימין-לשמאל**; המקף וה-`+` נייטרליים
// ונגררים איתם. ⇒ **מדרג של "61 עד 90 יום" מוצג למנהלת-הכספים כמדרג שאינו קיים.**
// 🔑 **וזו אותה מחלקה של מלכודת 17:** *מספר שנקרא כמספר אחר גרוע ממספר שחסר* —
// והפעם זה **לא** חיתוך: װ`scrollWidth === clientWidth` בכל התאים, והערך שלם.
//
// ✅ **והמסך הראשי כבר פתר את זה — התצוגה-המקדימה עקפה אותו:** װ`ReportTable.jsx:37-39`
// מעביר כל תא דרך `formatByType` עם `textLtr` (נוסף 16/09/2026 בדיוק למלכודה הזו),
// והפאנל הזה מרנדר מה-`sheet` — שבו ה-`format` כבר אינו קיים. ⇒ בידוד ברמת-התא.
// 🔑 **למה `<bdi>` ולא `dir="ltr"` קשיח:** װ`<bdi>` מזהה כיווניות מהתוכן — שם-לקוח
// עברי נשאר RTL ונקרא נכון, וערך מספרי מקבל LTR. **`dir="ltr"` גורף היה שובר את העברית.**
// ⚠️ **וזה תצוגה בלבד — הקובץ אינו משתנה.** װ`buildExportSheet` מחזיר אותם תאים
// בדיוק, ו-`stripBidiControls` ממשיך לנקות תווי-כיווניות מהערכים שנכתבים ל-xlsx.
function Cell({ cell }) {
  return <bdi>{cellValue(cell)}</bdi>
}

export default function ExportPreviewPanel({
  loading,
  error,
  onRetry,
  sheet = [],
  columns = [],
  filteredKeys,
  onFilterColumn,
  countLine,
  scopeLine,
  fileName,
}) {
  const [header, ...body] = sheet
  const hasTable = Array.isArray(header) && header.length > 0

  return (
    <section
      className="flex flex-col rounded-lg bg-slate-50 p-3"
      aria-label="תצוגה מקדימה של הקובץ"
      data-testid="export-preview"
    >
      {/*
        🔴🔴 **מספר-העמודות נאמר במילים, וזה לא קישוט — הוא הסימן היחיד שאפשר לסמוך עליו.**

        הכרעת-ישי 23/09/2026: *"צריך בתצוגה מקדימה גלילה ימינה שמאלה לראות את העמודות"*.
        📊 **נמדד ב-20 עמודות:** הגלילה עובדת (856px מוסתרים) **ואין שום סימן שהיא קיימת.**
        נוסף פס מפורש (`.scrollbar-visible` ב-`index.css`) — **אבל אי-אפשר לאמת אותו מכאן:**
        🔴 Chromium ב-headless מצייר **overlay-scrollbar שלעולם אינו תופס מקום**, ולכן
        `offsetHeight - clientHeight` נשאר `0` **גם אחרי `::-webkit-scrollbar` עם גובה מפורש**.
        ⇒ על המכונה של ישי הפס יופיע; **כאן זו הנחה, לא מדידה** (§7 פריט 3ה, פתוח מ-17/09).

        🔑 **ולכן המספר:** הוא **אינו תלוי בשום ציור של הדפדפן** — אם הקובץ נושא
        20 עמודות ועל המסך נראות תשע, **המשתמשת יודעת שיש עוד.** והוא ניתן למדידה.
      */}
      <p className="mb-2 text-xs text-slate-500" data-testid="export-preview-caption">
        כך ייראה הקובץ — חמש השורות הראשונות
        {hasTable && header.length > 0 && ` · ${header.length} עמודות`}
      </p>

      {loading && (
        <div className="space-y-2 py-2" data-testid="export-preview-loading">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="h-4 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      )}

      {/* ⚠️ תקלת-תצוגה אינה חוסמת ייצוא — היא נאמרת ומוצע לנסות שוב (מצב תלת-ערכי, `src/CLAUDE.md §3`). */}
      {!loading && error && (
        <div className="rounded-md bg-white p-3 text-xs" role="alert">
          <p className="text-red-600">{error}</p>
          {onRetry && (
            <button type="button" className="mt-1 text-slate-600 underline" onClick={onRetry}>
              נסי שוב
            </button>
          )}
        </div>
      )}

      {/*
        🔴🔴 **פס-גלילה שנראה בעין — הכרעת-ישי 23/09/2026: *"צריך בתצוגה מקדימה גלילה ימינה
        שמאלה לראות את העמודות"*.**

        📊 **נמדד לפני התיקון, ב-20 עמודות:** ‏`canScrollX: true` · **856px מוסתרים** ·
        **ו-`offsetHeight - clientHeight` = `0`** ⇒ **הדפדפן לא צייר פס בכלל.**
        ⇒ הגלילה עבדה, **ולא היה שום סימן שהיא קיימת** — המשתמשת רואה עמודה נחתכת בקצה
        ואין לה דרך לדעת שיש עוד שמונה מאחוריה.

        🔴 **וזו מסקנה שגויה מ-17/09 שתוקנה כאן, ולא פגם חדש:** שם נמדד *"עובי-פס 0"* והוסק
        *"`auto` ודי"*. **המדידה הייתה נכונה; המסקנה הפוכה** — אפס פירושו שאין פס.
        🔑 **הסיבה:** ‏Chromium מצייר כברירת-מחדל **overlay-scrollbar** שאינו תופס מקום ואינו
        מופיע עד שגוללים. `scrollbar-width` הופך אותו ל**פס קלאסי שתמיד נוכח**.

        ⚠️ **ולמה `style` ולא מחלקת-Tailwind:** ‏`scrollbar-width`/`scrollbar-color` הם תקן-CSS
        שאין לו utility ב-v4, והחלופה (`::-webkit-scrollbar`) מחייבת גיליון-סגנון משותף.
        **מאפיין-סגנון על הרכיב שומר את השינוי בקובץ אחד.**
      */}
      {!loading && !error && hasTable && (
        <div
          className="scrollbar-visible max-h-64 overflow-x-auto overflow-y-auto rounded-md bg-white"
          tabIndex={0}
          role="region"
          aria-label="תצוגה מקדימה של הקובץ — ניתן לגלול הצידה לעמודות נוספות"
        >
          {/*
            🔑 **`w-full` **לצד** `min-w-max`, ושני אלה אינם סותרים — הם תקרה ורצפה.**
            ‏`min-width: max-content` הוא **הרצפה**: העמודות לעולם לא נדחסות מתחת לרוחבן הטבעי,
            וזה מה שמייצר את פס-הגלילה ב-30 עמודות. ‏`width: 100%` הוא **הבקשה**: כשיש מקום
            פנוי — הטבלה לוקחת אותו. ⇒ הרוחב בפועל הוא `max(100%, max-content)`.
            📊 **נמדד 23/09/2026 בצילום:** בלי `w-full`, ב-8 עמודות על מסך 1440 הטבלה תפסה
            ‏685px מתוך מכל של 870 — **185px של לבן ריק לצד הנתונים**, שנקראו כחוסר-איזון.
            ⚠️ **וזה אינו מבטל את המדידה של 17/09** — ב-30 עמודות `max-content` גובר על 100%,
            הטבלה גולשת, והפס חוזר. **הרצפה נשארה; רק הבקשה נוספה.**
          */}
          <table className="w-full min-w-max border-collapse text-xs">
            <thead>
              <tr className="group/head">
                {header.map((cell, index) => {
                  const column = columns[index]
                  const active = Boolean(column && filteredKeys?.has(column.key))
                  return (
                    <th
                      key={index}
                      scope="col"
                      className={HEAD_CELL}
                      onContextMenu={(event) => {
                        if (!column || !onFilterColumn) return
                        event.preventDefault()
                        onFilterColumn(column.key)
                      }}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <Cell cell={cell} />
                        {column && onFilterColumn && (
                          <button
                            type="button"
                            onClick={() => onFilterColumn(column.key)}
                            aria-label={`סנני לפי ${column.label}`}
                            data-testid={`export-head-filter-${column.key}`}
                            className={`inline-flex size-6 shrink-0 items-center justify-center rounded transition-opacity hover:bg-slate-200 focus-visible:opacity-100 group-hover/head:opacity-100 ${
                              active ? 'text-teal-700 opacity-100' : 'text-slate-400 opacity-0'
                            }`}
                          >
                            <Filter className="size-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={index} className={BODY_CELL}>
                      <Cell cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && !hasTable && (
        <p className="rounded-md bg-white p-3 text-xs text-slate-500">{countLine}</p>
      )}

      <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-500">
        <p data-testid="export-count">{countLine}</p>
        <p data-testid="export-scope">חל על הקובץ: {scopeLine}</p>
        {fileName && <p data-testid="reports-export-file">יירד: {fileName}</p>}
      </div>
    </section>
  )
}
