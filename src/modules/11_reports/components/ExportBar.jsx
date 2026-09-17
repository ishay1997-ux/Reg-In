// כפתור-הייצוא של הלשונית, והחיווט שלו לחלון-הייצוא הגנרי.
//
// ✏️ **17/09/2026 — הכרעת-ישי הפכה את ת4:** הכפתור אינו מוריד עוד מיד, אלא פותח חלון שבו
// בוחרים דוח · תקופה · לקוח · מסננים · עמודות וסדר. *"רוצים ליצא דוח חייב אפשרויות סינון
// מקיפות לא מעניין מה היה במסך מקודם בכלל"*. *(ת4ב ב-`processes-approved.md` · §7.103.)*
//
// 🚫 **שתי שורות-הכיתוב שהיו כאן הוסרו** (*"מאשר לפי המלצך"*): הן קיימו הבטחה-לפני-לחיצה
// כשהלחיצה הורידה **מיד**. עכשיו התצוגה-המקדימה עושה את זה טוב מהן, ושורה שמבטיחה דוח שאולי
// כלל לא ייבחר היא הבטחה שקרית. **הבטחת-השם עצמה לא נעלמה — היא זזה לתוך החלון, עם אותו
// `data-testid` בדיוק, כדי שחוזה ה-E2E יישאר חוזה.**
//
// 🔴 **הכפתור פעיל תמיד, וזו תוצאה ישירה של הבורר.** קודם הוא נוטרל כשלדוח הפתוח לא הייתה
// טבלה; מרגע שאפשר לבחור בחלון כל אחד מארבעת הדוחות, חסימה בגלל הדוח שבמקרה פתוח היא מחסום
// שרירותי. ⇒ **`blockedReason` עובר פנימה ונבדק פר-דוח נבחר.**
//
// 🚫 **`rows` שמגיע מהמסך אינו בשימוש** — החלון שולף בעצמו (`exportFetch.js`). הפרופ נשאר
// בחתימה כי `ReportSurface.jsx` שולח אותו, והוא **שטח של הסשן המקביל** שאין לגעת בו.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import ExportDialog from '@/components/ExportDialog'
import { listCustomers } from '@/modules/02_customers/api'
import { fetchExportData, reportsOfTab } from '@/modules/11_reports/exportFetch'
import {
  buildExportFileName,
  buildExportSheet,
  EXPORT_LOCKED_MESSAGES,
  exportReportRows,
} from '@/lib/reportsExport'

export default function ExportBar({ reportName, windowLabel, columns = [], blockedReason }) {
  // 🔴 **קריאה ישירה מה-URL ולא `useSearchParams` — וזה לא סגנון אלא מדידה.** ההוק דורש
  // הקשר-ניתוב, ו-`ExportBar` מרונדר בתוך `ReportSurface` שארבעה קובצי-בדיקה של הסשן
  // המקביל מרנדרים **בלי Router**. ‏📏 נמדד 17/09/2026: המעבר להוק הפיל **122 בדיקות**
  // בארבעה קבצים שאינם שלי (`ReportSurface` · `HostessesTab` · `CustomersTab` ועוד).
  // ⇒ הרכיב **קורא** את הלשונית ואינו מנהל אותה, ולכן אין לו סיבה לדרוש הקשר.
  const params = new URLSearchParams(window.location.search)
  const tabKey = params.get('tab')
  const openReport = params.get('report')

  const [open, setOpen] = useState(false)
  const [reportId, setReportId] = useState(openReport)
  const [period, setPeriod] = useState({ from: '', to: '' })
  const [customerId, setCustomerId] = useState('')
  const [customers, setCustomers] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const reports = reportsOfTab(tabKey)
  const selected = reports.find((report) => report.id === reportId) ?? reports[0] ?? null

  // ⚠️ הרשימה נטענת רק כשהחלון נפתח — מסך-הדוחות אינו משלם עליה.
  // 🔤 **כישלון אינו מדובר:** בורר-הלקוחות פשוט לא יוצג, והייצוא רץ על כל הלקוחות. זו בדיוק
  // ההתנהגות של מסנן-הלקוח במסך (`module-11 CLAUDE.md` §3) — `listCustomers` חסום ב-RLS
  // לתפקידים שאינם 'לקוחות', ומחזיר `[]` בלי שגיאה.
  useEffect(() => {
    if (!open || customers.length > 0) return
    listCustomers()
      .then((rows) =>
        setCustomers((rows ?? []).map((row) => ({ id: row.customer_id, name: row.company_name }))),
      )
      .catch(() => setCustomers([]))
  }, [open, customers.length])

  // 🔑 **"התחלנו לשלוף" נקבע בזמן הרינדור ולא בתוך האפקט.** ‏`setState` סינכרוני בגוף אפקט
  // מרנדר פעם אחת עם המצב הישן ואז שוב — כלומר החלון היה מציג רגע את **נתוני הדוח הקודם**
  // כאילו הם מוכנים, ורק אז נדלק חיווי-הטעינה. ‏ESLint חוסם זאת (`react-hooks/set-state-in-effect`).
  // ⇒ מפתח-הבקשה מוגדר כאן, והאפקט מעדכן **רק בתוך ה-callbacks**.
  const requestKey =
    open && selected ? `${selected.rpc}|${period.from}|${period.to}|${customerId}|${tick}` : null
  const [seenRequest, setSeenRequest] = useState(null)
  if (requestKey && seenRequest !== requestKey) {
    setSeenRequest(requestKey)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    if (!open || !selected) return
    let alive = true
    fetchExportData({
      rpc: selected.rpc,
      from: period.from,
      to: period.to,
      customerId,
    })
      .then((next) => {
        if (alive) setData(next)
      })
      .catch((err) => {
        // 🔴 מצב תלת-ערכי: כישלון **אינו** נכתב כ-`[]`. הוא נאמר, והחלון מציע לנסות שוב.
        if (alive) {
          setData(null)
          setError(err?.message || 'שליפת הנתונים לא הושלמה.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  // 🔑 **שם-הקובץ נגזר פעם אחת ומוזן גם להבטחה וגם להורדה** — שתי גזירות היו נפרדות ביום
  // שאחת מהן תשתנה, וה-E2E משווה את השתיים בייט-בבייט (`reports.spec.js:442`).
  // 🚫 **ואין בו עוד רמת-דריל:** החלון שולף `drill: null`, ולכן שם שנושא רמה היה משקר.
  const fileName = buildExportFileName({
    reportName: selected?.name ?? reportName,
    windowLabel: data?.windowLabel ?? (period.from || period.to ? '' : windowLabel),
  })

  return (
    <div data-testid="reports-export">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-auto rounded-lg border-slate-300 px-4 py-2 font-medium text-slate-700"
        data-testid="reports-export-button"
      >
        ייצוא לאקסל
      </Button>

      {open && (
        <ExportDialog
          open={open}
          onOpenChange={setOpen}
          reports={reports}
          reportId={selected?.id ?? null}
          onReportChange={setReportId}
          customers={customers}
          customerId={customerId}
          onCustomerChange={setCustomerId}
          from={period.from}
          to={period.to}
          onPeriodChange={setPeriod}
          columns={data?.columns ?? columns}
          rows={data?.rows ?? []}
          rowTotal={data?.rowTotal ?? null}
          topN={data?.topN ?? null}
          loading={loading}
          error={error}
          onRetry={() => setTick((value) => value + 1)}
          blockedReason={data ? data.blockedReason : blockedReason}
          buildSheet={buildExportSheet}
          knownMessages={EXPORT_LOCKED_MESSAGES}
          fileName={fileName}
          onExport={({ columns: picked, rows: pickedRows, scope, count }) =>
            exportReportRows({
              fileName,
              sheetName: selected?.name ?? reportName,
              columns: picked,
              rows: pickedRows,
              meta: { scope, count, generatedAt: new Date() },
            })
          }
        />
      )}
    </div>
  )
}
