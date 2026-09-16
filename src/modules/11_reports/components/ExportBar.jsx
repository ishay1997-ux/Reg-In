// כפתור-הייצוא ושתי שורות-הכיתוב שמתחתיו (ת4 · `cards-*.md §⑤` שורה 5).
//
// 🔑 **שתי השורות אינן קישוט — הן ההבטחה שלפני הלחיצה:** שם-הקובץ הצפוי ושמות-העמודות
// שיירדו. הייצוא מוריד את **מצב-המסך** (מסננים ורמת-דריל כלולים), ובלי הכיתוב המשתמשת
// לוחצת בלי לדעת אם תקבל 12 שורות או 700.
//
// 🚫 **אין הרשאת-ייצוא נפרדת** — *"מי שרואה, מייצא"* (ת4, ⚙️ בהאצלה). הרכיב אינו בודק הרשאה.
//
// 🔤 שלושת המצבים הריקים נעולים ומגיעים מ-`reportsExport.js` — מועתקים, לא מנוסחים כאן.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { buildExportFileName, exportCaption, exportReportRows } from '@/lib/reportsExport'

export default function ExportBar({
  reportName,
  windowLabel,
  drillLabel,
  columns = [],
  rows = [],
  blockedReason,
}) {
  const [error, setError] = useState(null)
  const fileName = buildExportFileName({ reportName, windowLabel, drillLabel })
  const caption = exportCaption({ fileName, columns, rowCount: rows.length, blockedReason })

  function handleExport() {
    try {
      setError(null)
      exportReportRows({ fileName, sheetName: reportName, columns, rows })
    } catch (err) {
      // ⚠️ הודעת-הזריקה היא **מחרוזת עברית שכתבנו** (שלושת המצבים הנעולים), ולכן ראויה
      // להצגה. תקלת-ספרייה אמיתית נופלת לנוסח הכללי — לא מדליפים טקסט טכני למסך.
      const known = [caption.file, err?.message].includes(err?.message)
      setError(known ? err.message : 'הייצוא לא הושלם.')
    }
  }

  return (
    <div className="flex flex-col items-start gap-0.5" data-testid="reports-export">
      <Button
        type="button"
        variant="outline"
        disabled={caption.disabled}
        onClick={handleExport}
        title={caption.disabled ? caption.file : undefined}
        className="h-auto rounded-lg border-slate-300 px-4 py-2 font-medium text-slate-700"
        data-testid="reports-export-button"
      >
        ייצוא לאקסל
      </Button>
      <span className="text-[11px] text-slate-500" data-testid="reports-export-file">
        {caption.file}
      </span>
      {caption.columns && (
        <span className="text-[11px] text-slate-500" data-testid="reports-export-columns">
          {caption.columns}
        </span>
      )}
      {error && (
        <span className="text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
