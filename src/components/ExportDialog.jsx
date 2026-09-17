// חלון-הייצוא לאקסל — **גנרי: מקבל `{ key, label, format }` ואינו יודע דבר על דוחות.**
//
// 🔑 **הכרעת-ישי 17/09/2026, וממנה נגזר כל הקובץ:** *"רוצים ליצא דוח חייב אפשרויות סינון
// מקיפות לא מעניין מה היה במסך מקודם בכלל"* ⇒ **זהו כלי שליפה עצמאי ולא "הורדה של המסך"**.
// החלון אינו יורש את מצב-המסך ואינו משנה אותו; הדבר היחיד שנגרר הוא הדוח הפתוח, כברירת-מחדל
// ולנוחות בלבד. *(האפיון: `processes-approved.md` ת4ב · ההכרעה: `PROJECT_MASTER_sec7.md` §7.103.)*
//
// 🔴 **התצוגה-המקדימה אינה "המחשה" — היא הקובץ.** היא מרונדרת מהפלט של `buildSheet`, אותה
// פונקציה טהורה שכותבת את הגיליון עצמו (`buildExportSheet`), חתוך לחמש שורות. ⇒ פער בינה
// לבין מה שיירד אינו באג שצריך לתפוס — הוא **בלתי-אפשרי**. טבלת-תצוגה שנייה שנכתבת במיוחד
// למודאל **הייתה סוטה** ביום שעיצוב-התאים ישתנה.
//
// 🚫 **בלי ספריית-גרירה.** הגרירה אנכית בתוך רשימה אחת ⇒ גרירת-HTML מובנית מספיקה, והנגישות
// יושבת על כפתורי מעלה/מטה. פקד דו-אזורי היה מעביר **אופקית**, ותחת `<html dir="rtl">` חץ
// "ימינה" מעביר שמאלה — מלכודת שרשימה-אחת מוחקת מהשורש (הכרעת-ישי: *"עמודה אחת בה הוא מסדר
// את הסדר, מסתיר או לא"*).

import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { applyColumnOrder, defaultOrder, moveKey, reorderKey } from '@/lib/exportColumns'
import { applyFilters } from '@/lib/exportFilters'
import ExportConfigPanel from '@/components/ExportConfigPanel'
import ExportPreviewPanel from '@/components/ExportPreviewPanel'

const PREVIEW_ROWS = 5

// 🔤 נוסחים נעולים — משתנים רק יחד עם הבדיקות שטוענות עליהם (`ui-copy-styleguide.md` §5).
export const PICK_ONE_COLUMN = 'בחרי עמודה אחת לפחות'
export const NO_ROWS_AFTER_FILTER = 'הסינון לא הותיר שורות'

export default function ExportDialog({
  open,
  onOpenChange,
  title = 'ייצוא לאקסל',
  reports = [],
  reportId = null,
  onReportChange,
  customers = [],
  customerId = '',
  onCustomerChange,
  from = '',
  to = '',
  onPeriodChange,
  columns = [],
  rows = [],
  rowTotal = null,
  topN = null,
  showAll = false,
  onShowAllChange,
  loading = false,
  error = null,
  onRetry,
  blockedReason = null,
  buildSheet,
  fileName = '',
  onExport,
  knownMessages = null,
}) {
  const [order, setOrder] = useState(() => defaultOrder(columns))
  const [selected, setSelected] = useState(() => new Set(defaultOrder(columns)))
  const [conditions, setConditions] = useState([])
  const [busy, setBusy] = useState(false)
  const [exportError, setExportError] = useState(null)
  const dragKey = useRef(null)

  // 🔴 **רשימת-העמודות נבנית מחדש בכל החלפת-דוח או רמת-דריל, ואינה "נשמרת".**
  // ‏why: `report_m09_aging` מכריזה עמודות שונות לרמה 0 ולרמה 1. העדפה ששרדה מעבר היא בדיוק
  // המצב שבו מפתחות זרים נכנסים לסדר — ומ-`applyColumnOrder` הם ייזרקו, אבל **התנאים** היו
  // נשארים ומסננים על עמודה שאינה קיימת. ⇒ מאפסים את שלושתם יחד.
  //
  // 🔑 **האיפוס נעשה **בזמן הרינדור** ולא ב-`useEffect`, וזה לא סגנון:** ‏`setState` בתוך אפקט
  // מרנדר פעם אחת עם המצב הישן ואז שוב עם החדש — כלומר **התצוגה-המקדימה הייתה מהבהבת בעמודות
  // של הדוח הקודם** לפני שהיא מתקנת את עצמה. ‏ESLint חוסם את זה (`react-hooks/set-state-in-effect`),
  // והדפוס כאן הוא זה שהתיעוד של React מורה עליו: השוואת-מפתח והתאמה מיידית.
  const columnsKey = columns.map((column) => column.key).join('|')
  const [seenKey, setSeenKey] = useState(columnsKey)
  if (seenKey !== columnsKey) {
    const keys = defaultOrder(columns)
    setSeenKey(columnsKey)
    setOrder(keys)
    setSelected(new Set(keys))
    setConditions([])
    setExportError(null)
  }

  const filteredRows = useMemo(
    () => applyFilters(rows, columns, conditions),
    [rows, columns, conditions],
  )
  const visibleColumns = useMemo(
    () => applyColumnOrder(columns, order, selected),
    [columns, order, selected],
  )
  const sheet = useMemo(() => {
    if (typeof buildSheet !== 'function' || selected.size === 0) return []
    // ⚠️ **חתימת-אובייקט ולא שני ארגומנטים** — `buildExportSheet({ columns, rows })`.
    // קריאה מיקומית מחזירה גיליון ריק **בלי לזרוק**, והתצוגה הייתה נראית כ"אין טבלה".
    return buildSheet({ columns: visibleColumns, rows: filteredRows.slice(0, PREVIEW_ROWS) })
  }, [buildSheet, visibleColumns, filteredRows, selected])

  const nothingPicked = selected.size === 0
  const emptyAfterFilter = !loading && !blockedReason && filteredRows.length === 0
  const canExport = !blockedReason && !loading && !busy && !nothingPicked && !emptyAfterFilter

  const scopeLine = useMemo(() => {
    const parts = []
    parts.push(from || to ? `תקופה ${from || '—'}–${to || '—'}` : 'כל התקופות')
    const customer = customers.find((item) => String(item.id) === String(customerId))
    parts.push(customer ? `לקוח: ${customer.name}` : 'כל הלקוחות')
    for (const condition of conditions) {
      const column = columns.find((item) => item.key === condition.key)
      if (!column) continue
      const shown =
        condition.operator === 'oneOf' ? (condition.values ?? []).join(' · ') : condition.value
      if (shown === '' || shown === undefined || shown === null) continue
      parts.push(`${column.label} ${condition.operatorLabel ?? ''} ${shown}`.trim())
    }
    return parts.join(' · ')
  }, [from, to, customers, customerId, conditions, columns])

  // 🔴 **שורת-הכמות אומרת את האמת גם כשאינה נוחה.** רשימת-שיא אינה "מדגם" ואינה חיתוך —
  // היא הדוח (מ02 · מ07 · מ19), ולכן היא נוקבת **במספר האוכלוסייה** ולא ב-"כל הלקוחות":
  // תשעה לקוחות בלי אירוע ב-12 החודשים אינם באוכלוסיית הדוח בשום גודל.
  const countLine = useMemo(() => {
    if (blockedReason) return blockedReason
    if (nothingPicked) return PICK_ONE_COLUMN
    if (emptyAfterFilter) return NO_ROWS_AFTER_FILTER
    const n = filteredRows.length
    if (topN && !showAll) return `${topN.label} · מתוך ${topN.total}`
    if (rowTotal !== null && rowTotal > n) return `הקובץ יכלול ${n} שורות מתוך ${rowTotal}`
    return `הקובץ יכלול ${n} שורות`
  }, [blockedReason, nothingPicked, emptyAfterFilter, filteredRows, topN, showAll, rowTotal])

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function reset() {
    const keys = defaultOrder(columns)
    setOrder(keys)
    setSelected(new Set(keys))
    setConditions([])
  }

  async function handleExport() {
    setExportError(null)
    setBusy(true)
    try {
      await onExport?.({ columns: visibleColumns, rows: filteredRows, fileName })
      onOpenChange?.(false)
    } catch (err) {
      // ⚠️ ה-`await` הוא התיקון עצמו ולא סגנון (ממצא B-1): בלי המתנה הדחייה חומקת מה-`try`,
      // הקובץ אינו יורד, **ושום דבר אינו נאמר על המסך**.
      // 🔴 **המבחן הוא מול רשימה סגורה, ולא מול השגיאה עצמה** (ממצא B-1): נוסח עברי
      // שאנחנו זרקנו ראוי להצגה כמות-שהוא; תקלת-ספרייה **לא** — לא מדליפים טקסט טכני
      // למסך. ⚠️ והרשימה מוזרקת ואינה מיובאת, כדי שהחלון יישאר גנרי.
      const known = knownMessages instanceof Set && knownMessages.has(err?.message)
      setExportError(known ? err.message : 'הייצוא לא הושלם.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-5xl" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            הבחירה כאן נוגעת לקובץ בלבד ואינה משנה את המסך.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ExportConfigPanel
            reports={reports}
            reportId={reportId}
            onReportChange={onReportChange}
            customers={customers}
            customerId={customerId}
            onCustomerChange={onCustomerChange}
            from={from}
            to={to}
            onPeriodChange={onPeriodChange}
            columns={columns}
            rows={rows}
            order={order}
            selected={selected}
            onToggle={toggle}
            onMove={(key, delta) => setOrder((prev) => moveKey(prev, key, delta))}
            onDragStart={(key) => {
              dragKey.current = key
            }}
            onDropBefore={(beforeKey) => {
              const key = dragKey.current
              dragKey.current = null
              if (key) setOrder((prev) => reorderKey(prev, key, beforeKey))
            }}
            conditions={conditions}
            onConditions={setConditions}
            onReset={reset}
            topN={topN}
            showAll={showAll}
            onShowAllChange={onShowAllChange}
          />
          <ExportPreviewPanel
            loading={loading}
            error={error}
            onRetry={onRetry}
            sheet={sheet}
            countLine={countLine}
            scopeLine={scopeLine}
            fileName={fileName}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            data-testid="export-dialog-run"
          >
            {busy ? 'מייצר קובץ…' : 'ייצוא'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            ביטול
          </Button>
          {exportError && (
            <span className="text-xs font-medium text-red-600" role="alert">
              {exportError}
            </span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
