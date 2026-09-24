// פאנל הסינון המתקדם (מסך 5.6.3, מוקאפ 04) — נפתח/נסגר מעל הרשימה. אין רכיב Sheet ב-shadcn של
// הפרויקט, ולכן פאנל מתקפל פשוט (יד-חופשית, הכרעת P13). כל הפרדיקטים חיים ב-matchesCustomerFilters
// (src/lib/customers.js) — הפאנל רק אוסף את ערכי-הסינון ומעביר אותם למעלה; אינו מסנן בעצמו.
// הכרעת P13: תיבת-חיפוש-אחת (לא כאן — היא בעמוד); כאן רק המסננת המתקדמת + "נקה הכל".

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CUSTOMER_TYPE_LABELS, SATISFACTION_BANDS } from '@/lib/customers'

// ערך-דמה ל"כל הסוגים" ב-Select (Radix לא מאפשר SelectItem עם value ריק) — ממופה חזרה ל-undefined.
const ANY_TYPE = '__any__'
const ANY_RECENT = '__any_recent__'
const ANY_DISCOUNT = '__any_discount__'
const ANY_SATISFACTION = '__any_satisfaction__'

export default function CustomersFilterSheet({ filters, onChange }) {
  // filters = { customerType, marketingConsent, minDiscount } — הטקסט-החופשי מנוהל בנפרד בעמוד.
  function patch(next) {
    onChange({ ...filters, ...next })
  }

  return (
    <div
      dir="rtl"
      className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2.5"
      data-testid="customers-filter-sheet"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">סינון מתקדם</h3>
        <Button
          type="button"
          variant="link"
          onClick={() => onChange({})}
          className="h-auto p-0 text-teal-600 hover:text-teal-700 text-sm"
          data-testid="customers-filter-clear"
        >
          נקי הכל
        </Button>
      </div>

      {/* פריסה קומפקטית (הכרעת-ישי 11/07 — "עדיין גדול מדי"): שורת-פקדים גולשת עם רוחב-לפי-תוכן,
          במקום 2-עמודות רוחב-מלא. כל פקד צר ככל שנדרש; גלישה לשורה נוספת רק כשאין מקום. */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5">
        <div className="flex flex-col gap-1 w-44">
          <label className="text-xs text-slate-600">סוג לקוח</label>
          <Select
            value={filters.customerType ?? ANY_TYPE}
            onValueChange={(v) => patch({ customerType: v === ANY_TYPE ? undefined : v })}
          >
            <SelectTrigger
              className="w-full h-auto p-2 rounded-lg border-slate-300 text-sm"
              data-testid="customers-filter-type"
            >
              <SelectValue placeholder="כל הסוגים" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value={ANY_TYPE}>כל הסוגים</SelectItem>
              {/* §7.3: התוויות מ-SSOT בלבד */}
              {Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* "נוספו לאחרונה" — נשמר כ-newWithinDays; העמוד גוזר ממנו createdAfter (הפונקציה טהורה). */}
        <div className="flex flex-col gap-1 w-44">
          <label className="text-xs text-slate-600">נוספו לאחרונה</label>
          <Select
            value={filters.newWithinDays ? String(filters.newWithinDays) : ANY_RECENT}
            onValueChange={(v) => {
              if (v === ANY_RECENT) {
                patch({ newWithinDays: undefined, createdAfter: undefined })
              } else {
                const days = Number(v)
                // חישוב סף-התאריך ב-handler (לא render) — react-hooks/purity אוסר Date.now ברינדור.
                patch({
                  newWithinDays: days,
                  createdAfter: new Date(Date.now() - days * 86400000).toISOString(),
                })
              }
            }}
          >
            <SelectTrigger
              className="w-full h-auto p-2 rounded-lg border-slate-300 text-sm"
              data-testid="customers-filter-recent"
            >
              <SelectValue placeholder="כל הזמן" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value={ANY_RECENT}>כל הזמן</SelectItem>
              <SelectItem value="30">30 הימים האחרונים</SelectItem>
              <SelectItem value="90">90 הימים האחרונים</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* יש/אין הנחה (הכרעת-ישי) — הכל / יש / בלי ⇒ hasDiscount undefined/true/false. */}
        <div className="flex flex-col gap-1 w-32">
          <label className="text-xs text-slate-600">הנחה</label>
          <Select
            value={
              filters.hasDiscount === true
                ? 'yes'
                : filters.hasDiscount === false
                  ? 'no'
                  : ANY_DISCOUNT
            }
            onValueChange={(v) =>
              patch({ hasDiscount: v === 'yes' ? true : v === 'no' ? false : undefined })
            }
          >
            <SelectTrigger
              className="w-full h-auto p-2 rounded-lg border-slate-300 text-sm"
              data-testid="customers-filter-has-discount"
            >
              <SelectValue placeholder="הכול" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value={ANY_DISCOUNT}>הכול</SelectItem>
              <SelectItem value="yes">יש הנחה</SelectItem>
              <SelectItem value="no">בלי הנחה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* שביעות-רצון (§7.80). הוחזרה 11/07 בהכרעת-ישי ("סינון חשוב") והייתה מושבתת עם "אין
            נתונים עדיין" עד שמ8 יביא ציונים. ✏️ 24/09/2026 (ליטושי-הכנס, C3): מ8 נבנה ⇒ **פעילה**,
            ארבע רמות §7.80. **אותו פרמטר-כתובת של הצ'יפ "טעון בירור"** (`satisfaction`) — שני
            מסננים נפרדים לאותה שאלה היו מתפצלים. לקוח בלי משוב אינו בשום רמה. */}
        <div className="flex flex-col gap-1 w-44" data-testid="customers-filter-satisfaction">
          <label className="text-xs text-slate-600">שביעות רצון</label>
          <Select
            value={filters.satisfaction ?? ANY_SATISFACTION}
            onValueChange={(v) => patch({ satisfaction: v === ANY_SATISFACTION ? undefined : v })}
          >
            <SelectTrigger
              className="w-full h-auto p-2 rounded-lg border-slate-300 text-sm"
              data-testid="customers-filter-satisfaction-trigger"
            >
              <SelectValue placeholder="הכול" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value={ANY_SATISFACTION}>הכול</SelectItem>
              {SATISFACTION_BANDS.map((band) => (
                <SelectItem key={band.key} value={band.key}>
                  {band.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* "מאושר לדיוור בלבד" הוסר מהפאנל 11/07 (הכרעת-ישי — כפילות מבלבלת): הצ'יפ "קהל דיוור" בסרגל
            (פעילים + מאושרי-דיוור = קהל ה-BCC) כבר מכסה את סינון-ההסכמה, בצורה בולטת ועסקית יותר. */}
      </div>
    </div>
  )
}
