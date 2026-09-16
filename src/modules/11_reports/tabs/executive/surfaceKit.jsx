// 🧰 **חמשת הרכיבים שארבעת משטחי "הנהלה" מרכיבים מהם את נקודות-ההרחבה של `ReportSurface`.**
//
// 🔴 **למה משותף ולא מקומי, וזה לא "ניקיון":** ארבעת המשטחים ממלאים את אותן נקודות-הרחבה
// באותה צורה בדיוק — רמז-מטרה למעלה · רמזי-אריחים והערת-גרף לפני הגרף · שורת-"לחיצה על
// שורה…" ורמז לפני הטבלה. **ארבעה עותקים של אותו JSX מפילים את jscpd (3%)**, ו-§2ב C6
// קובע שזה המבנה ולא המשמעת. ⇒ כל חתיכה נכתבת כאן פעם אחת, והמשטח מוסר לה טקסט.
//
// 🔑 **ואין כאן אף מחרוזת של משטח מסוים** — הרכיבים מקבלים טקסט ומפתח, ואינם יודעים מי קורא.

import Hint from '@/components/Hint'
import { isolateLtr } from '@/lib/reportsFormat'

// ── רכיבי-התצוגה של נקודות-ההרחבה ────────────────────────────────────────────

/** שורת-טקסט-בסיס קטנה (הערת-גרף · שורת-"לחיצה על שורה…") — **רמה 0, לא שכבת-הטמעה.** */
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
 * ⚠️ **במוקאפ הרמז יושב מתחת לשורת-"אז מה"**, שמצוירת שם מעל האריחים; בשלד המשותף
 * שורת-"אז מה" יורדת מתחת לרצועת-האריחים (📐23, `ReportSurface`). ⇒ *"מתחת ל-אז-מה"*
 * היה מציב את הסבר-הדף **אחרי** המספרים שהוא בא להקדים. **הרמז נשאר ראשון; המיקום דווח.**
 */
export function SurfaceLead({ hintId, children }) {
  return (
    <div className="mb-2">
      {children}
      {hintId && <Hint id={hintId} />}
    </div>
  )
}

/** רמזי-האריחים והערת-הגרף — הכול מתחת לרצועת-האריחים ולפני הגרף הראשון. */
export function ChartLead({ note, hintIds = [] }) {
  return (
    <>
      {hintIds.map((id) => (
        <Hint key={id} id={id} />
      ))}
      <SurfaceNote testId="report-chart-note">{note}</SurfaceNote>
    </>
  )
}

/**
 * 📐8 — **המספר שהטבלה נמדדת מולו מוצהר, ואינו שקט.** ‏§7.98 נועל 50 שורות למטען,
 * ו-`meta.row_total` נושא את הספירה האמיתית; הפאג'ר של `ReportTable` סופר את מה שהגיע
 * (‏50) ולכן **אינו יכול** לומר "50 מתוך 736". שורה אחת אומרת זאת במילים, במקום שהמשתמשת
 * תניח שראתה הכול.
 * ⚠️ **והנוסח נזהר משתי משמעויות שונות של `row_total`, וזה נמדד בדפדפן ולא הונח:** במ4/מ6
 * הוא באמת תקרה (⁦50⁩ מתוך ⁦736⁩ · ⁦135⁩), ובמ2 הטבלה היא **רשימת-שיא** שהשרת מחזיר בשלמותה
 * (⁦8⁩ מתוך ⁦241⁩). ⇒ *"השורות הראשונות"* היה מבטיח עמוד נוסף שאינו קיים; *"שנמדדו"* נכון
 * בשני המקרים, והוא גם בדיוק מה שהפאג'ר במוקאפ אומר (*"1–8 מתוך 236"*).
 */
// 🚫 **לא מיוצא** — הצרכן היחיד הוא `TableLead` שמתחתיו, ו-knip תופס ייצוא ספקולטיבי
// בצדק (התקדים המדויק: `isolatedShekels` ב-`src/lib/hostesses.js`).
function RowCapNote({ rows, rowTotal }) {
  const shown = rows?.length ?? 0
  if (!rowTotal || rowTotal <= shown) return null
  return (
    <SurfaceNote testId="report-row-cap">
      {`מוצגות ${isolateLtr(shown.toLocaleString('he-IL'))} שורות מתוך ${isolateLtr(rowTotal.toLocaleString('he-IL'))} שנמדדו.`}
    </SurfaceNote>
  )
}

/** ראש-הטבלה: תקרת-השורות · שורת-"לחיצה על שורה…" (הכרעה 19) · רמז-הטבלה של §⑩. */
export function TableLead({ payload, rowAction, hintId }) {
  return (
    <>
      <RowCapNote rows={payload.rows} rowTotal={payload.meta?.row_total} />
      <SurfaceNote testId="report-row-action">{rowAction}</SurfaceNote>
      {/* משטח בלי רמז-טבלה ב-§⑩ (מ6) — `<Hint id={undefined}>` היה מזהיר בפיתוח על
          מפתח חסר, וזו אזהרה על משהו שאינו תקלה. */}
      {hintId && <Hint id={hintId} />}
    </>
  )
}
