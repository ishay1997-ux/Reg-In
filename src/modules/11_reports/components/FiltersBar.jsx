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

function CustomerPicker({ customers, customerId, onCustomerChange }) {
  return (
    <>
      <label className={`${LABEL_CLASS} mr-2`} htmlFor="reports-customer">
        לקוח:
      </label>
      <select
        id="reports-customer"
        // ⚠️ `<select>` מקורי ולא Radix: אין כאן portal ⇒ אין את המוקש של §3.5
        // (*"כל משטח שנפתח ב-portal מקבל `dir=\"rtl\"` מפורש"*), והפקד יורש את כיוון-הדף.
        value={customerId ?? ''}
        onChange={(e) => onCustomerChange(e.target.value || null)}
        data-testid="reports-customer-filter"
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12.5px] text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <option value="">כל הלקוחות</option>
        {customers.map((c) => (
          <option key={c.customer_id} value={String(c.customer_id)}>
            {c.company_name}
          </option>
        ))}
      </select>
    </>
  )
}

export default function FiltersBar({
  period,
  onPeriodChange,
  customers = [],
  customerId,
  onCustomerChange,
  exportSlot,
}) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      data-testid="reports-filters"
      role="group"
      aria-label="מסננים"
    >
      <span className={LABEL_CLASS}>תקופה:</span>
      {PERIOD_OPTIONS.map((option) => (
        <FilterPill
          key={option.key}
          on={period === option.key}
          onClick={() => onPeriodChange(option.key)}
          testId={`reports-period-${option.key}`}
        >
          {option.label}
        </FilterPill>
      ))}

      <CustomerPicker
        customers={customers}
        customerId={customerId}
        onCustomerChange={onCustomerChange}
      />

      {/* ✏️ **צ'יפ-ניקוי-הקרוס-פילטר נמחק מכאן 16/09/2026 — הוא היה קוד-מת:** אף אתר-קריאה
          לא מסר `crossFilterLabel`/`onClearCrossFilter` (נמדד), והצ'יפ **החי** יושב
          ב-`ReportSurface`, צמוד לטבלה שהוא מנקה. שני צ'יפים לאותה פעולה הם בדיוק הכפילות
          שסבב-הפיוס הזה נולד למחוק — ו**הנוסח הנעול נשאר אחד**: *"× נקי בחירה"*. */}

      {/* הייצוא נדחף לקצה השמאלי של השורה, בדיוק כמו בשלד (`margin-right:auto` ב-RTL). */}
      {exportSlot && <div className="mr-auto">{exportSlot}</div>}
    </div>
  )
}
