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

const HEAD_CELL = 'sticky top-0 bg-slate-50 px-2 py-1 text-right font-medium text-slate-600'
const BODY_CELL = 'whitespace-nowrap border-t border-slate-200 px-2 py-1 text-right'

function cellValue(cell) {
  if (cell === null || cell === undefined) return ''
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
      <p className="mb-2 text-xs text-slate-500">כך ייראה הקובץ — חמש השורות הראשונות</p>

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

      {!loading && !error && hasTable && (
        <div
          className="max-h-64 overflow-x-auto overflow-y-auto rounded-md bg-white"
          tabIndex={0}
          role="region"
          aria-label="תצוגה מקדימה של הקובץ — ניתן לגלול הצידה לעמודות נוספות"
        >
          <table className="min-w-max border-collapse text-xs">
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index} scope="col" className={HEAD_CELL}>
                    <Cell cell={cell} />
                  </th>
                ))}
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
