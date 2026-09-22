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
import { applyColumnOrder, defaultOrder, moveKey, moveToTop, reorderKey } from '@/lib/exportColumns'
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
      // 🔑 **`scope` ו-`count` נמסרים ולא מחושבים שוב** — הם המחרוזות שהמשתמשת בדיוק
      // ראתה. גזירה שנייה בצד הכותב הייתה נפרדת מזו שעל המסך ביום שאחת מהן תשתנה.
      await onExport?.({
        columns: visibleColumns,
        rows: filteredRows,
        fileName,
        scope: scopeLine,
        count: countLine,
      })
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
      {/*
        🔴 **`sm:max-w-5xl` ולא `max-w-5xl`, וזה לא סגנון — `max-w-5xl` לבדו לא עשה דבר.**
        ‏📊 נמדד 17/09/2026 בשלושה רוחבי-מסך (1024 · 1366 · 1920): החלון יצא **512px בכולם**,
        ו-`getComputedStyle(...).maxWidth` החזיר `512px` — כלומר **גודל המסך לא שינה כלום.**
        **הסיבה:** מחרוזת-הבסיס של `DialogContent` (`ui/dialog.jsx:46`) מסתיימת ב-`sm:max-w-lg`
        (‏32rem = 512px). ‏Tailwind פולט וריאנטים-רספונסיביים **אחרי** ה-utilities הבסיסיות,
        ולכן מעל 640px הוריאנט גובר על `max-w-5xl` — ו-`cn()`/`tailwind-merge` **אינו מאחד
        ביניהם**, כי אלה שתי תכונות שונות (עם וריאנט ובלי). ⇒ הכיתוב שלנו נדרס בשקט.
        🔑 **מתקנים בוריאנט תואם**, כדי שהתיקון לא יידרס באותו אופן.
        ⚠️ **התוצאה שנמדדה קודם:** תצוגה-מקדימה 268px · טבלה 565px ⇒ **2 מתוך 8 עמודות נראות.**
        *(שאלת-ישי שחשפה זאת: "רק 3 נכנסו? דמיין מסך 15.6 אינטש לפחות".)*
      */}
      {/*
        ⚠️ **ולמה `7xl` (1280px) ולא `5xl` (1024):** אחרי התיקון לעיל החלון הגיע ל-1024
        **בכל** רוחב-מסך, ו-📊 נמדד ש-8 העמודות של גיול-חובות דורשות 565px מול 551 שקיבלו
        ⇒ **העמודה השמינית נחתכה באמצע ערך** (*"0–61"* במקום *"31–60"*). **שאלת-ישי:
        *"דמיין מסך 15.6 אינטש לפחות"*** — ובצדק: מסך 1366 או 1920 שילם על רוחב ולא קיבל אותו.
        🔑 **ו-`max-w-[calc(100%-2rem)]` של הבסיס נשאר בתוקף**, ולכן במסך צר החלון מצטמצם לבד.
      */}
      <DialogContent dir="rtl" className="sm:max-w-7xl" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            הבחירה כאן נוגעת לקובץ בלבד ואינה משנה את המסך.
          </DialogDescription>
        </DialogHeader>

        {/*
          🔴 **פאנל-התצורה ברוחב קבוע, והתצוגה-המקדימה לוקחת את השאר — הכרעת-ישי 17/09/2026**
          *("שים לב שהפאנל ימני לא יהיה גדול מדי אלא בדיוק ברוחב המתאים כדי שהכל שם יהיה קריא"* ·
          *"הבלוק בחירת עמודות כולו יהיה גודל קבוע והחלק של תצוגת הטבלה בהתאם לגודל המסך"*).
          **הנימוק:** ‏`2fr/3fr` חילק כל פיקסל שהמסך נותן **בין מי שצריך אותו למי שלא** — לפאנל
          יש רוחב טבעי (שם-עמודה + סימון + ידית + שני חצים), ומעליו הוא רק נמתח; **הטבלה
          מרוויחה מכל פיקסל.**
          📊 **ו-20rem אינו מספר שנבחר בעין:** התווית הארוכה ביותר מבין 16 הדוחות היא **23
          תווים** (נמדד מ-`'columns'` במיגרציות, לא מתוויות אריחים) ⇒ ~150px טקסט + תיבת-סימון
          + ידית-גרירה + שני חצים ≈ **250px נדרשים**. ‏320 נותן מרווח-נשימה בלי בזבוז.
          ⚠️ **`minmax(0,1fr)` ולא `1fr`** — בלי ה-0 התא מקבל `min-width:auto` והטבלה הרחבה
          מנפחת אותו במקום לגלול, וזו אותה מלכודת בדיוק שתפסה את שדות-התאריך.
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,1fr)]">
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
            onMoveToTop={(key) => setOrder((prev) => moveToTop(prev, key))}
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
