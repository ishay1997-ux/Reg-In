// בוחר-לקוח להצעת מחיר (§7.11 + F25). תיבת-חיפוש שנפתחת לרשימה תוך-כדי הקלדה, ולא תפריט
// נפתח רגיל: רשימת-לקוחות גדלה עם הזמן, ותפריט שטוח הופך לבלתי-שמיש בעשרות שורות.
//
// ⚠️ החיפוש עצמו **אינו נכתב כאן** — הוא מיובא מ-src/lib/customers.js (matchesCustomerFilters),
// אותה פונקציה שמסך-הלקוחות משתמש בה. ההערה בראש אותו קובץ קובעת זאת מפורשות: לוגיקת-חיפוש
// כפולה הייתה סוטה בשקט, ואז אותו חיפוש היה מוצא לקוח במסך אחד ולא מוצא אותו בשני.
//
// כל שורה מציגה את **שלושת המזהים** (שם · ח"פ · איש קשר) — שתי חברות יכולות להיבדל רק בח"פ.
// אחוז-ההנחה **אינו** מוצג ברשימה (הכרעת-ישי 29/07): הוא תוצאה של הבחירה ולא שיקול בבחירה,
// ומקומו בתג שמופיע אחרי הבחירה.

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { matchesCustomerFilters } from '@/lib/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 8

export default function CustomerPicker({
  customers,
  selectedCustomer,
  onSelect,
  onCreateNew,
  disabled,
  error,
  // ‏`Field` מזריק את זה כשיש שגיאה, כדי שהודעת-השגיאה שמתחת תיקשר לתיבה עצמה.
  // חייב להתקבל ולהיות מועבר במפורש — הרכיב אינו פורש props, ולכן תכונה שלא נכתבה
  // כאן פשוט נעלמת בלי שגיאה.
  'aria-describedby': ariaDescribedBy,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // לקוחות פעילים בלבד (הכרעת-ישי 29/07): לקוח שהועבר לארכיון במודול 2 פירושו "הפסקנו לעבוד
  // איתו", והצעה חדשה עבורו היא כמעט תמיד טעות. שחזור מהארכיון הוא לחיצה אחת במסך הלקוחות.
  const matches = useMemo(
    () => customers.filter((c) => matchesCustomerFilters(c, { text: query, status: 'active' })),
    [customers, query],
  )
  const visible = matches.slice(0, MAX_VISIBLE)

  // אין תוצאות אך קיים לקוח **בארכיון** שתואם — ההסבר מופיע רק כאן, ברגע שיש מה לומר,
  // ולא כהודעה קבועה שיושבת ברשימה תמיד.
  const archivedMatch = useMemo(
    () =>
      matches.length === 0 && query.trim() !== ''
        ? customers.some((c) => matchesCustomerFilters(c, { text: query, status: 'inactive' }))
        : false,
    [customers, matches.length, query],
  )

  function choose(customer) {
    onSelect(customer)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => {
        const next = event.key === 'ArrowDown' ? i + 1 : i - 1
        return Math.max(0, Math.min(next, visible.length - 1))
      })
    } else if (event.key === 'Enter' && open && visible[activeIndex]) {
      event.preventDefault()
      choose(visible[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  // לקוח כבר נבחר ⇒ מציגים אותו כשורה נבחרת עם כפתור-החלפה, במקום להשאיר תיבת-חיפוש
  // שנראית כאילו לא נבחר דבר.
  if (selectedCustomer) {
    return (
      <div
        className="flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3"
        data-testid="quote-customer-selected"
      >
        <span className="truncate text-sm font-medium text-slate-800">
          {selectedCustomer.company_name}
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="link"
            title="החלפת לקוח"
            aria-label={`החלפת לקוח (נבחר: ${selectedCustomer.company_name})`}
            onClick={() => onSelect(null)}
            className="h-auto p-0 text-slate-400 hover:text-slate-600"
            data-testid="quote-customer-clear"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        {/* זכוכית-המגדלת בצד ימין — כמו בתיבת-החיפוש של מסך הלקוחות (CustomersPage.jsx:289) */}
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setOpen(true)}
          // סגירה מיידית ב-blur מותרת **רק** מפני שהפאנל מונע את ה-blur מלקרות בכלל
          // (preventDefault על mousedown שלו). לכן blur כאן פירושו תמיד "המשתמש עזב
          // באמת" — לחיצה בחוץ או Tab. אין כאן טיימר, במכוון. ר' ההערה על הפאנל.
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={'חיפוש לפי שם חברה, איש קשר או ח"פ...'}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className="h-9 rounded-lg border-slate-300 pr-9 pl-3 text-right"
          data-testid="quote-customer-search"
        />
      </div>

      {open && !disabled && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg"
          // ⚠️ באג אמיתי שישי תפס 29/07/2026, ובדיקה אוטומטית **לא** תפסה:
          // הגרסה הקודמת סגרה את הרשימה בטיימר של 120ms אחרי ה-blur. לחיצת-אדם רגילה
          // (אצבע יורדת ועולה) נמשכת לרוב יותר מזה, ולכן הרשימה נסגרה **באמצע הלחיצה**
          // וה-click נחת על אלמנט שכבר לא היה שם — הבחירה פשוט לא קרתה. לחיצת Playwright
          // מיידית ולכן תמיד הספיקה, וזו הסיבה שהבדיקה עברה בירוק על קוד שבור.
          // התיקון: preventDefault על mousedown של הפאנל מונע את איבוד-המיקוד מלכתחילה,
          // כך שאין מרוץ בין סגירה ללחיצה. אין טיימרים — אין תזמון שאפשר להפסיד בו.
          onMouseDown={(event) => event.preventDefault()}
          data-testid="quote-customer-panel"
        >
          {visible.map((customer, index) => (
            <button
              key={customer.customer_id}
              type="button"
              onClick={() => choose(customer)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-right',
                index === activeIndex && 'bg-teal-50',
              )}
              data-testid={`quote-customer-option-${customer.customer_id}`}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                {customer.company_name}
              </span>
              <span className="whitespace-nowrap text-xs text-slate-500">
                {'· ח"פ '}
                <span dir="ltr">{customer.company_number}</span>
              </span>
              {customer.contact_name && (
                <span className="whitespace-nowrap text-xs text-slate-500">
                  · {customer.contact_name}
                </span>
              )}
            </button>
          ))}

          {visible.length === 0 && (
            <p className="px-3 py-3 text-sm text-slate-500" data-testid="quote-customer-no-results">
              {archivedMatch
                ? 'לקוח בשם זה נמצא בארכיון — יש לשחזר אותו במסך הלקוחות כדי להציע לו הצעה.'
                : customers.length === 0
                  ? 'אין עדיין לקוחות במערכת.'
                  : 'לא נמצא לקוח תואם.'}
            </p>
          )}

          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
            <Button
              type="button"
              variant="link"
              onClick={onCreateNew}
              className="h-auto p-0 font-semibold text-teal-600 hover:text-teal-700"
              data-testid="quote-customer-add"
            >
              + לקוח חדש
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
