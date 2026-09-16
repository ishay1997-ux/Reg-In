// 🧰 **ארבעת הרכיבים שמשטחי "הנהלה" מרכיבים מהם את נקודות-ההרחבה של `ReportSurface`.**
//
// 🔴 **למה משותף ולא מקומי, וזה לא "ניקיון":** ארבעת המשטחים ממלאים את אותן נקודות-הרחבה
// באותה צורה בדיוק — רמז-מטרה למעלה · רמזי-אריחים לפני הגרף · שורת-"לחיצה על שורה…" ורמז
// לפני הטבלה. **ארבעה עותקים של אותו JSX מפילים את jscpd (3%)**, ו-§2ב C6 קובע שזה המבנה
// ולא המשמעת. ⇒ כל חתיכה נכתבת כאן פעם אחת, והמשטח מוסר לה טקסט.
//
// ✂️ **ומה שנמחק מכאן 16/09 11:1X:** ‏`RowCapNote` המקומי. ‏§9 D-25 קובע **שורת-תקרה אחת**,
// והיא עברה ל-`ReportSurface` בנוסח *"מוצגות ⁦N⁩ מתוך ⁦M⁩ שורות"*. שתי שורות מעל אותה טבלה
// אינן "גיבוי" — הן שני מספרים שהקוראת צריכה להשוות ביניהם.
//
// 🔑 **ואין כאן אף מחרוזת של משטח מסוים** — הרכיבים מקבלים טקסט ומפתח, ואינם יודעים מי קורא.

import Hint from '@/components/Hint'
import ReportSurface from '../../components/ReportSurface'

/**
 * 🔑 **מעטפת-המשטח — ארבעה משטחים, חוזה-פרופס אחד.**
 * ‏`surface · filters · drill · onDrill · onWindow` נמסרים לשלד **כפי שהתקבלו**, בלי עטיפה
 * ובלי נתב-ביניים (‏`ReportsPage` הוא נתב-הדלתות היחיד מאז 16/09 11:1X). מה שכל משטח מוסיף
 * הוא רק נקודות-ההרחבה שלו.
 * 🔴 **ולמה זה רכיב ולא ארבעה עותקים:** ‏jscpd מדד את בלוק-הפרופס הזה כשכפול בן ⁦10⁩ שורות
 * בין `ExecOverviewSurface` ל-`StaffingSurface` — ‏§2ב C6 קובע שסף ה-3% הוא מבנה ולא משמעת,
 * וארבעה עותקים של חוזה-פרופס הם ארבעה מקומות שבהם פרופ חדש יישכח בשלושה.
 */
export function ExecutiveSurface({ surface, filters, drill, onDrill, onWindow, ...slots }) {
  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      {...slots}
    />
  )
}

/** שורת-טקסט-בסיס קטנה (שורת-"לחיצה על שורה…" · סייג) — **רמה 0, לא שכבת-הטמעה.** */
export function SurfaceNote({ children, testId }) {
  if (!children) return null
  return (
    <p className="mb-2 text-[11.5px] leading-relaxed text-slate-500" data-testid={testId}>
      {children}
    </p>
  )
}

/**
 * ראש-המשטח: רמז-המטרה של §⑩ ומה שהמשטח מוסיף (שורת-שבבים).
 * ✏️ **16/09 11:1X — והמיקום כאן נעשה נאמן למוקאפ בלי שנגעתי בו:** השלד המשותף העביר את
 * שורת-"אז מה" **מעל** רצועת-האריחים (‏19/19 דפי-המוקאפים המאושרים), כך ש-*"מתחת לשורת-
 * אז-מה"* של §⑩ הוא שוב המקום שבו הרמז באמת יושב.
 */
export function SurfaceLead({ hintId, children }) {
  return (
    <div className="mb-2">
      {children}
      {hintId && <Hint id={hintId} />}
    </div>
  )
}

/** רמזי-האריחים והגרף — כולם מתחת לרצועת-האריחים ולפני הגרף הראשון. */
export function ChartLead({ hintIds = [] }) {
  return (
    <>
      {hintIds.map((id) => (
        <Hint key={id} id={id} />
      ))}
    </>
  )
}

/** ראש-הטבלה: שורת-"לחיצה על שורה…" (הכרעה 19) · רמז-הטבלה של §⑩. */
export function TableLead({ rowAction, hintId }) {
  return (
    <>
      <SurfaceNote testId="report-row-action">{rowAction}</SurfaceNote>
      {/* משטח בלי רמז-טבלה ב-§⑩ (מ6) — `<Hint id={undefined}>` היה מזהיר בפיתוח על
          מפתח חסר, וזו אזהרה על משהו שאינו תקלה. */}
      {hintId && <Hint id={hintId} />}
    </>
  )
}
