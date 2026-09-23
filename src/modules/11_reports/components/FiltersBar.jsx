// שורת-המסננים הגלובליים — **תקופה · לקוח**, ושניהם חיים בכתובת-הדף (📐13④).
//
// 🔑 **הגלולות הן `FilterPill` הקיימת ולא צורה חדשה** (כלל-ברזל 14 · §2.5 של חוזה-העיצוב):
// טורקיז **בהיר** למצב-נבחר, בעוד הטורקיז **המלא** שמור לפעולה הראשית. עותק שני היה מייצר
// מסנן שנראה כמו כפתור-הפעולה.
//
// ⚠️ **ובכל זאת לא `WindowChips`:** זה חלון-עבר בלבד (`from` בלי `to`, "מלפני X ואילך"),
// בדיוק כפי ש-`src/lib/listWindow.js` מסביר — ומסנן-דוח הוא **טווח סגור** ששני קצותיו
// נשלחים ל-RPC (`p_from`/`p_to`). ארבע התוויות של `WindowChips` חוזרות כאן במכוון
// *(החודש · 3 חודשים · השנה · הכול)*, כי המשתמשת רואה את אותן מילים בכל מסכי-הרשימה.
// ✏️ **וגלולה חמישית שאין לה מקבילה שם — *"12 חודשים"* (16/09/2026):** היא **חלון מתגלגל**
// ולא תקופה קלנדרית, ומסכי-הרשימה אינם מכירים את ההבחנה הזו. הנימוק המלא (וההכרעה
// שהולידה אותה) יושב ב-`reportsPeriod.js` ליד המפתח עצמו — כאן היא מרונדרת בלבד:
// 🔑 **הרכיב עובר על `PERIOD_OPTIONS` ואינו מונה גלולות**, ולכן תוספת אינה נוגעת בו כלל.
//
// 🔴 **בורר-הלקוח קורא דרך api של מ2 ולא `supabase.from` מהרכיב** (כלל-ברזל 14 · C5) —
// ולכן הרשימה מגיעה כ-prop; הרכיב הזה תצוגתי בלבד, אפס שליפות.
// ⚠️ **ומי שחסום על 'לקוחות' יקבל רשימה ריקה עם `error: null`** (הכשל השקט של §4.3) ⇒
// רשימה ריקה **אינה** מסתירה את הבורר; הוא נשאר עם "כל הלקוחות" בלבד, כי דוח על כל
// הלקוחות הוא תשובה נכונה, ובורר שנעלם היה מסתיר את קיום היכולת.

import FilterPill from '@/components/FilterPill'
import { PERIOD_OPTIONS } from '../reportsPeriod'

const LABEL_CLASS = 'text-xs text-slate-500'
// 🔤 ערך-עובדה במקום פקד — טקסט רגיל ולא גלולה, כדי שלא ייראה לחיץ.
const FACT_CLASS = 'text-sm text-slate-700'

function CustomerPicker({ customers, customerId, onCustomerChange }) {
  return (
    <select
      id="reports-customer"
      // ⚠️ `<select>` מקורי ולא Radix: אין כאן portal ⇒ אין את המוקש של §3.5
      // (*"כל משטח שנפתח ב-portal מקבל `dir=\"rtl\"` מפורש"*), והפקד יורש את כיוון-הדף.
      value={customerId ?? ''}
      onChange={(e) => onCustomerChange(e.target.value || null)}
      data-testid="reports-customer-filter"
      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <option value="">כל הלקוחות</option>
      {customers.map((c) => (
        <option key={c.customer_id} value={String(c.customer_id)}>
          {c.company_name}
        </option>
      ))}
    </select>
  )
}

/**
 * ‏`periodFixedLabel` · `customerFixed` — **משטח שאינו מגיב למסנן מציג עובדה, לא פקד.**
 * ✏️ **הכרעת-ישי 5, 17/09/2026** (`processes-approved.md` §👤 טיפוגרפיה וניסוח): *"לפעמים כתוב
 * הדף לא מושפע ממסנן התקופה אז למה להציג אותו בכלל??? ... תנסה להכליל את הטעות"* ⇒ *"פקד-מת
 * מוחלף בתווית עובדה"*. **בוצע 23/09/2026 (פזה ב׳ שלב 9)** — עד אז הפקד היה **מושבת ומנומק**
 * (㉚, 17/09), כלומר חמש גלולות אפורות ומשפט-הסתייגות לצידן.
 * ‏`periodFixedLabel` — מחרוזת-העובדה (תווית-החלון שהשרת מדד, למשל *"כל הזמנים"*) ⇒ במקום
 * הגלולות; ‏`null` ⇒ הגלולות כרגיל. ‏`customerFixed` ⇒ *"כל הלקוחות"* במקום הבורר.
 * 🔑 **והכתובת ממשיכה לעבוד:** ‏`?period=`/`?customer=` נשמרים, ומשטח שכן מסנן לפיהם מחזיר אותם.
 */
export default function FiltersBar({
  period,
  onPeriodChange,
  periodFixedLabel,
  customers = [],
  customerId,
  onCustomerChange,
  customerFixed,
  exportSlot,
}) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      data-testid="reports-filters"
      role="group"
      aria-label="מסננים"
    >
      {/* 🔤 **בלי נקודתיים** (‏`m11-copy-rules §2.5`, כלל כ19 · R2). */}
      <span className={LABEL_CLASS}>תקופה</span>
      {periodFixedLabel ? (
        <span className={FACT_CLASS} data-testid="reports-period-fixed">
          {periodFixedLabel}
        </span>
      ) : (
        PERIOD_OPTIONS.map((option) => (
          <FilterPill
            key={option.key}
            on={period === option.key}
            onClick={() => onPeriodChange(option.key)}
            testId={`reports-period-${option.key}`}
          >
            {option.label}
          </FilterPill>
        ))
      )}

      {customerFixed ? (
        <>
          <span className={`${LABEL_CLASS} mr-2`}>לקוח</span>
          <span className={FACT_CLASS} data-testid="reports-customer-fixed">
            כל הלקוחות
          </span>
        </>
      ) : (
        <>
          <label className={`${LABEL_CLASS} mr-2`} htmlFor="reports-customer">
            לקוח
          </label>
          <CustomerPicker
            customers={customers}
            customerId={customerId}
            onCustomerChange={onCustomerChange}
          />
        </>
      )}

      {/* ✏️ **צ'יפ-ניקוי-הקרוס-פילטר נמחק מכאן 16/09/2026 — הוא היה קוד-מת:** אף אתר-קריאה
          לא מסר `crossFilterLabel`/`onClearCrossFilter` (נמדד), והצ'יפ **החי** יושב
          ב-`ReportSurface`, צמוד לטבלה שהוא מנקה. שני צ'יפים לאותה פעולה הם בדיוק הכפילות
          שסבב-הפיוס הזה נולד למחוק — ו**הנוסח הנעול נשאר אחד**: *"× נקי בחירה"*. */}

      {/* הייצוא נדחף לקצה השמאלי של השורה, בדיוק כמו בשלד (`margin-right:auto` ב-RTL). */}
      {exportSlot && <div className="mr-auto">{exportSlot}</div>}
    </div>
  )
}
