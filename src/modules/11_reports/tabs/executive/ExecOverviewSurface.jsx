// מ2 · **מבט-על הנהלה** — *"מה מצב העסק השנה?"* (`cards-management.md`, שורה 89 · `#p1` במוקאפ).
//
// 🔑 **מה הדף מחויב להראות, ומאיפה זה מגיע:** ארבעה אריחים עם חצי-השוואה (📐1) וחלון (📐3) ·
// גרף-חודשים · טבלת האירועים הגדולים · שורת-"אז מה" · הגדרות — **כולם מהמטען** (C8).
// מה שנוסף כאן הוא רק מה שהמטען אינו יכול לומר לרכיבים המשותפים בעצמו.
//
// 🔴 **הכרעה 33 חיה כאן במלואה:** ארבעת האריחים נושאים `target`, ושלושה מהם פותחים דוח
// **בלשונית אחרת** (רווחיות-פרויקטים בכספים · לקוחות-מתרחקים בלקוחות). ⚠️ **ומי שאין לו
// הרשאה על הלשונית ההיא ינחת על לשונית ממוסכת** — ההכרעה מתירה דלת חוצת-לשונית במפורש,
// והצמד עצמו מסומן `הנחתי` בדוח של בונה-ה-RPC ועדיין טעון אישור.

import { isolateLtr } from '@/lib/reportsFormat'
import ReportSurface from '../../components/ReportSurface'
import { ChartLead, SurfaceLead, TableLead } from './surfaceKit'
import {
  useSurfaceDoors,
  withCharts,
  withLabelAxis,
  withRowDoors,
  withTileSubRows,
} from './surfaceDoors'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:501`) — הכרעה 19 כפי
// שהיא נאמרת למשתמשת. **אין קישור "פתח…" חוזר בכל שורה; השורה עצמה היא הדלת.**
const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'
// 🔤 החץ נשאר `→` ואינו מתהפך — `m11-copy-rules §4.2` נועל אותו מול התקדים החי
// `לכרטיס →` (`CustomerDetailsPage.jsx:1332`), ולא לפי כלל-הכיווניות הכללי (כ10).
const TRENDS_LINK = 'כל השנים בדוח "מגמות רב-שנתיות" →'

// ‏`'2026-09-16'` ⇒ `16`. **נגזר מה-`window` שהשרת החזיר ולעולם לא מ-`new Date()`** —
// מוקש-השעון של `src/CLAUDE.md`: מסך שנטען אחרי חצות היה מצהיר אורך-חודש שגוי.
function dayOfMonth(isoDate) {
  const day = Number(isoDate?.slice(8, 10))
  return Number.isFinite(day) && day > 0 ? day : null
}

const sameMonth = (isoA, isoB) =>
  Boolean(isoA) && Boolean(isoB) && isoA.slice(0, 7) === isoB.slice(0, 7)

/**
 * 📐20 — **מקטע-זמן שאינו שווה לשאר חייב להצהיר על אורכו בתווית.** החודש האחרון בגרף מכסה
 * את הימים שחלפו בלבד (`partial: true` מהמטען), והשוואתו לחודש מלא היא בדיוק ההטעיה
 * שהכלל קיים כדי למנוע.
 * ⚠️ **ומה שהמוקאפ עשה ואי-אפשר לשחזר כאן:** הוא צייר את העמודה החלקית בדפוס-מילוי מקווקו.
 * ‏`ChartCard` נושא דפוס פר-**סדרה** (הבחנה בין סדרות, מדידת-נגישות של §⑤) ולא פר-עמודה ⇒
 * **ההצהרה עוברת כולה לתווית ולהערת-הגרף**, וזו הזרוע השנייה של 📐20 ולא ויתור עליו.
 */
function withPartialMonthLabel(chart, windowTo) {
  const days = dayOfMonth(windowTo)
  if (!days || !chart.data?.some((row) => row.partial)) return chart
  const data = chart.data.map((row) =>
    row.partial && sameMonth(row.month, windowTo)
      ? { ...row, label: `${row.label} (${isolateLtr(String(days))} ימים)` }
      : row,
  )
  return { ...chart, data }
}

function partialMonthNote(payload) {
  const days = dayOfMonth(payload.window?.to)
  const charts = Array.isArray(payload.chart) ? payload.chart : [payload.chart]
  const hasPartial = charts.some((chart) => chart?.data?.some((row) => row.partial))
  if (!days || !hasPartial) return null
  return `החודש האחרון בגרף מכסה ${isolateLtr(String(days))} ימים ולא חודש שלם — הוא אינו בר-השוואה לשאר החודשים, אבל כן לאותו חודש בשנה שעברה.`
}

function transformPayload(payload) {
  return withCharts(withTileSubRows(payload), (chart) =>
    withPartialMonthLabel(withLabelAxis(chart), payload.window?.to),
  )
}

export default function ExecOverviewSurface({ surface, filters, drill, onDrill, onWindow }) {
  const openDoor = useSurfaceDoors(onDrill)
  // ‏`.lnk[data-goto=p2]` של המוקאפ (סימון 7) — אותו מעבר בדיוק שהאריח הראשון עושה,
  // ולכן הוא נשען על אותו מנתב-דלתות ולא על ניווט שני.
  const openTrends = () => openDoor({ tab: 'הנהלה', report: 'report_m03_trends', drill: null })

  return (
    <ReportSurface
      surface={withRowDoors(surface)}
      filters={filters}
      drill={drill}
      onDrill={openDoor}
      onWindow={onWindow}
      transformPayload={transformPayload}
      renderTop={() => <SurfaceLead hintId="reports.execOverview.purpose" />}
      renderBeforeChart={(payload) => (
        <ChartLead
          note={partialMonthNote(payload)}
          hintIds={['reports.execOverview.revenueBasis', 'reports.execOverview.top5Share']}
        />
      )}
      renderBeforeTable={(payload) => (
        <TableLead
          payload={payload}
          rowAction={ROW_ACTION}
          hintId="reports.execOverview.topEventsSort"
        />
      )}
      renderExtras={() => (
        <button
          type="button"
          onClick={openTrends}
          className="mt-2 text-[12.5px] font-semibold text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          data-testid="exec-overview-trends-link"
        >
          {TRENDS_LINK}
        </button>
      )}
    />
  )
}
