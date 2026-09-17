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
// 🔴 **גלילה אופקית עם פס נראה — הכרעת-ישי 17/09/2026:** *"וצריך אפשרות לזוז ימינה שמאלה
// לראות את כל העמודות"*. ‏`overflow-auto` אכן גולל, **אבל בלי פס-גלילה נראה** — ולכן טבלה
// שנחתכה נראית כטבלה שנגמרה. 📊 **נמדד 17/09:** 8 עמודות של גיול-חובות דורשות 565px והמכל
// קיבל 551 ⇒ הערך בעמודה האחרונה נקרא **"0–61" במקום "31–60"**. 🔑 **ומספר שנחתך גרוע ממספר
// שחסר — הוא נקרא כמספר.** ⇒ `overflow-x-scroll`, **פס קבוע גם כשהתוכן נכנס**, כי דוח עם
// 15 עמודות יגלוש בכל רוחב והאפשרות לזוז צריכה להיראות תמיד ולא רק כשהיא כבר דחופה.
// ♿ **ו-`tabIndex` + `role="region"` אינם קוסמטיקה:** אזור שניתן לגלול חייב להיות
// מגיע-במקלדת, אחרת העמודות הנסתרות אינן נגישות למי שאינה משתמשת בעכבר.

const HEAD_CELL = 'sticky top-0 bg-slate-50 px-2 py-1 text-right font-medium text-slate-600'
const BODY_CELL = 'whitespace-nowrap border-t border-slate-200 px-2 py-1 text-right'

function cellValue(cell) {
  if (cell === null || cell === undefined) return ''
  return String(cell.value ?? '')
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
          className="max-h-64 overflow-x-scroll overflow-y-auto rounded-md bg-white"
          tabIndex={0}
          role="region"
          aria-label="תצוגה מקדימה של הקובץ — ניתן לגלול הצידה לעמודות נוספות"
        >
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index} scope="col" className={HEAD_CELL}>
                    {cellValue(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={index} className={BODY_CELL}>
                      {cellValue(cell)}
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
