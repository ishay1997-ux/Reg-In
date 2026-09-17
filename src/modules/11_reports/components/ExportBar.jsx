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
import {
  EXPORT_LOCKED_MESSAGES,
  buildExportFileName,
  exportCaption,
  exportReportRows,
} from '@/lib/reportsExport'

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

  // 🔴 **`async` + `await` — וזה התיקון עצמו, לא סגנון** (אודיט-הסגירה 17/09/2026, ‏B-1):
  // ‏`exportReportRows` מסתיימת ב-`return writeXlsxFile(...)`, כלומר מחזירה **הבטחה**. בלי
  // ‏`await` הדחייה שלה חומקת מה-`try` לגמרי — אין `setError`, אין שורת-קונסול, **אין דבר
  // על המסך**: המשתמשת לוחצת, קובץ אינו יורד, והמוצר שותק (§4.3 — *"המסך משקר, הוא אינו
  // נכשל"*). 🔑 **ושתי הזריקות הסינכרוניות נשארות סינכרוניות** — הן נתפסות באותו `try`
  // בדיוק, ולכן חוזה-הזריקה של `reportsExport.js` לא השתנה.
  async function handleExport() {
    try {
      setError(null)
      await exportReportRows({ fileName, sheetName: reportName, columns, rows })
    } catch (err) {
      // ⚠️ הודעת-הזריקה היא **מחרוזת עברית שכתבנו** (שלושת המצבים הנעולים), ולכן ראויה
      // להצגה. תקלת-ספרייה אמיתית נופלת לנוסח הכללי — לא מדליפים טקסט טכני למסך.
      // 🔴 **והמבחן הוא מול הרשימה הסגורה** ולא מול השגיאה עצמה: המשמר הקודם השווה את
      // ‏`err?.message` למערך שהכיל אותו, ולכן היה תמיד אמת (`EXPORT_LOCKED_MESSAGES`).
      const known = EXPORT_LOCKED_MESSAGES.has(err?.message)
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
      {/* 🔤 **שם-הקובץ נשאר טקסט-פסקה ואינו מבודד ל-LTR — נמדד 17/09/2026, וזו מדידה
          שסותרת את פריט [1] של סבב-הראיות.** הפריט תיאר את הכיתוב כגולש לשתי שורות עם
          `.xlsx` בקצה השמאלי של השורה השנייה; **בצילום שהוא עצמו מצטט הכיתוב יושב על שורה
          אחת**, ו-`.xlsx` נמצא בקצה השמאלי שלה — כלומר **בסוף הלוגי של השם** בקריאה מימין
          לשמאל, וזה הסדר הנכון לקורא עברית.
          🔴 **וניסיון-התיקון נמדד כהרעה:** עטיפה ב-`<bdi dir="ltr">` הפכה את הסדר החזותי
          ל-*"יירד: ‎.xlsx‏מבט-על-הנהלה…"* — הסיומת קופצת מיד אחרי המילה *"יירד"*, לפני השם.
          📎 ההשוואה: `results-fix/evidence/bar2-before.png` מול `bar2-after.png`.
          ⇒ **הושאר כפי שהיה, והפער דווח עם המדידה** במקום לתקן לפי תיאור שלא שוחזר. */}
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
