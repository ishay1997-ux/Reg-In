// מ2 · **מבט-על הנהלה** — *"מה מצב העסק השנה?"* (`cards-management.md`, שורה 89 · `#p1` במוקאפ).
//
// 🔑 **מה הדף מחויב להראות, ומאיפה זה מגיע:** ארבעה אריחים עם חצי-השוואה (📐1) וחלון (📐3) ·
// גרף-חודשים · טבלת האירועים הגדולים · שורת-"אז מה" · הגדרות — **כולם מהמטען** (C8), וכולם
// מרונדרים ע"י השלד המשותף. מה שנוסף כאן הוא רק מה שהמטען אינו יכול לומר לו בעצמו.
//
// 🔴 **הכרעה 33 חיה כאן במלואה, ומאז 16/09 11:1X היא של המעטפת:** ארבעת האריחים נושאים
// `target`, ושלושה מהם פותחים דוח **בלשונית אחרת**. ‏`ReportsPage` הוא נתב-הדלתות היחיד —
// הלשונית מוסרת את `onDrill` כפי שקיבלה אותו ו**אינה כותבת לכתובת בעצמה**. *(עד לתאריך הזה
// היה כאן נתב משלה, כי `onDrill` של המעטפת כתב רק `drill`; שני נתבים = שני כללי-ניווט.)*

import { isolateLtr } from '@/lib/reportsFormat'
import { ChartLead, SurfaceLead, TableLead, ExecutiveSurface } from './surfaceKit'
import { withCharts } from './chartShape'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:501`) — הכרעה 19 כפי
// שהיא נאמרת למשתמשת. **אין קישור "פתח…" חוזר בכל שורה; השורה עצמה היא הדלת.**
const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'
// 🔤 החץ נשאר `→` ואינו מתהפך — `m11-copy-rules §4.2` נועל אותו מול התקדים החי
// `לכרטיס →` (`CustomerDetailsPage.jsx:1332`), ולא לפי כלל-הכיווניות הכללי (כ10).
const TRENDS_LINK = 'כל השנים בדוח "מגמות רב-שנתיות" →'
const TRENDS_TARGET = Object.freeze({ tab: 'הנהלה', report: 'report_m03_trends', drill: null })

// ‏`'2026-09-16'` ⇒ `16`. **נגזר מה-`window` שהשרת החזיר ולעולם לא מ-`new Date()`** —
// מוקש-השעון של `src/CLAUDE.md`: מסך שנטען אחרי חצות היה מצהיר אורך-חודש שגוי.
function dayOfMonth(isoDate) {
  const day = Number(isoDate?.slice(8, 10))
  return Number.isFinite(day) && day > 0 ? day : null
}

const sameMonth = (isoA, isoB) => Boolean(isoA && isoB) && isoA.slice(0, 7) === isoB.slice(0, 7)

/**
 * 📐20 — **מקטע-זמן שאינו שווה לשאר מוצהר בשלושה מקומות, כמו במוקאפ המאושר:**
 * ① `is_today: true` על השורה ⇒ ‏`ChartCard` מצייר את העמודה **חלולה-ומקווקוות** בלי לשנות
 *    את הגוון (📐19). *(הערוץ הזה נוסף לשכבה המשותפת ב-16/09 ולא היה קיים קודם — עד אז
 *    ההצהרה נשענה על התווית בלבד.)* ·
 * ② התווית נושאת את אורך-החלון בפועל — *"ספטמבר (⁦16⁩ ימים)"* ·
 * ③ ו-`chart.note` אומר זאת במילים, בתוך כרטיס-הגרף, בדיוק היכן שהמוקאפ שם את `.chart-note`.
 */
function withPartialMonth(chart, windowTo) {
  const days = dayOfMonth(windowTo)
  if (!days || !chart.data?.some((row) => row.partial)) return chart
  const data = chart.data.map((row) =>
    row.partial && sameMonth(row.month, windowTo)
      ? { ...row, is_today: true, label: `${row.label} (${isolateLtr(String(days))} ימים)` }
      : row,
  )
  const note = `החודש האחרון מכסה ${isolateLtr(String(days))} ימים ולא חודש שלם — הוא אינו בר-השוואה לשאר החודשים, אבל כן לאותו חודש בשנה שעברה.`
  return { ...chart, data, note }
}

function transformPayload(payload) {
  return withCharts(payload, (chart) => withPartialMonth(chart, payload.window?.to))
}

export default function ExecOverviewSurface(props) {
  const { onDrill } = props
  return (
    <ExecutiveSurface
      {...props}
      transformPayload={transformPayload}
      renderTop={() => <SurfaceLead hintId="reports.execOverview.purpose" />}
      renderBeforeChart={() => (
        <ChartLead
          hintIds={['reports.execOverview.revenueBasis', 'reports.execOverview.top5Share']}
        />
      )}
      renderBeforeTable={() => (
        <TableLead rowAction={ROW_ACTION} hintId="reports.execOverview.topEventsSort" />
      )}
      renderExtras={() => (
        // ‏`.lnk[data-goto=p2]` של המוקאפ (סימון 7) — אותו יעד בדיוק שהאריח הראשון נושא,
        // ולכן הוא נוסע באותו נתב-דלתות של המעטפת ולא בניווט שני.
        <button
          type="button"
          onClick={() => onDrill(TRENDS_TARGET)}
          className="mt-2 text-[12.5px] font-semibold text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          data-testid="exec-overview-trends-link"
        >
          {TRENDS_LINK}
        </button>
      )}
    />
  )
}
