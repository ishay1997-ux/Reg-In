// 🧱 **המרנדר המשותף של משטח-דוח — הדרך היחידה שבה שישה-עשר המשטחים מציירים.**
//
// 🔴 **למה זה קיים, וזה לא "נוחות":** §2ב C6 קובע שהרכיבים המשותפים הם **הדרך היחידה**
// שבה אריח/גרף/טבלה/ייצוא מרונדרים, כי **jscpd נופל ב-3%** ושישה-עשר משטחים דומים יפילו
// אותו ברגע שקוד יועתק בין דפים. מרנדר אחד שנגזר מ**חוזה-ה-RPC (§2ב C8)** הופך את זה
// ממשמעת-שצריך-לזכור למבנה.
//
// 🔑 **החוזה הוא המבנה:** ‏`population · window · tiles · chart · columns · rows · so_what ·
// definitions · drill · meta` — כל מפתח מצויר כאן פעם אחת, במקום הנכון לפי 📐:
// ‏📐2 הצהרת-אוכלוסייה · 📐1/📐3 אריחים · 📐5/📐6 גרף · 📐7/📐8/📐9 טבלה · 📐23 "אז מה" ·
// 📐16 הגדרות-מדדים · 📐13 פירורים · ת4 ייצוא.
//
// ⏳ **ומה שאינו קיים עדיין, במפורש:** שש-עשרה פונקציות-השרת נבנות בפזה 1–2. עד אז כל
// משטח מחזיר שגיאת-"פונקציה לא נמצאה", והמסך מציג את **מצב-התקלה** עם *"נסי שוב"* —
// 🔴 **ולעולם לא "אין נתונים"**, שהוא בדיוק מצג-השווא שמדריך-המיקרו §4.3 אוסר.

import { useEffect, useState } from 'react'
import { callReport, normalizeCharts } from '../api'
import ChartCard from './ChartCard'
import DrillCrumbs from './DrillCrumbs'
import Envelope from './Envelope'
import ExportBar from './ExportBar'
import KpiTile from './KpiTile'
import ReportTable from './ReportTable'

// 🔒 הודעות-מסד ידועות ⇒ **נוסח משלנו**, לעולם לא המחרוזת הגולמית. אותה תבנית בדיוק כמו
// `SERVER_MESSAGE_RULES` במ7, ומאותו נימוק: מחרוזת-מסד נושאת אנגלית ושמות-פונקציה, ושניהם
// אסורים על המסך (`docs/plans/ui-copy-styleguide.md` §2א/§3ג).
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883'])
const NOT_BUILT_YET = 'הדוח הזה עדיין לא זמין במערכת.'

// 🔤 §⑥ · גלריית-המצבים, מצב 4 — נוסח-הבסיס הנעול, מושלם בשם-הדוח.
const noPermissionSentence = (name) => `אין לך הרשאה לצפות ב${name}`

function toScreenError(err) {
  // `42501` הוא `insufficient_privilege` הכללי של Postgres — ולא רק ה-raise העברי של
  // `assert_module_permission`. ⇒ מסך-הרשאה **בלי** הודעת-שרת, שאחרת הייתה מדליפה
  // `permission denied for function report_m09_aging` באנגלית לכותרת. (תקדים: מ7, מ8.)
  if (err?.code === '42501') return { kind: 'noPermission' }
  if (MISSING_FUNCTION_CODES.has(err?.code)) return { kind: 'error', detail: NOT_BUILT_YET }
  return { kind: 'error' }
}

function PopulationLine({ population }) {
  // 📐2 — **שורה קבועה בכל דף**: מי נכלל · מי הוצא · ה-`n`. היא **בסיס ולא רמז** (§3 של
  // חוזה-ההטמעה): *"דוח שמחריג בשקט מדבר על עולם אחר מזה שהקורא מדמיין"*.
  if (!population?.label) return null
  return (
    <p className="mb-2 text-[11.5px] text-slate-500" data-testid="report-population">
      {population.label}
    </p>
  )
}

function Tiles({ tiles, onOpenTarget }) {
  if (!tiles?.length) return null
  return (
    // `flex flex-wrap` ולעולם לא `grid` — הכרעת-ישי 08/08, מתועדת ב-`StatTile.jsx`:
    // אריחים עוטפים ואינם נמתחים.
    <div className="mb-4 flex flex-wrap gap-3" data-testid="report-tiles">
      {tiles.map((tile) => (
        <KpiTile key={tile.key} tile={tile} masked={tile.masked} onOpenTarget={onOpenTarget} />
      ))}
    </div>
  )
}

function MissingParamsBanner({ names }) {
  // 🔴 §7.83 — שורת-`params` חסרה **מוצהרת על המסך** ולעולם אינה מקבלת ברירת-מחדל שקטה.
  // הצורה מועתקת מ-`missingDashboardParamsMessage` (מ7), כולל ה-`role="alert"`.
  if (!names?.length) return null
  return (
    <p
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
      role="alert"
      data-testid="report-missing-params"
    >
      חסר פרמטר מערכת: {names.join(' · ')}
    </p>
  )
}

function Footers({ definitions, notes }) {
  return (
    <>
      {/* 📐16 — שורת-הגדרות-המדדים, בתחתית כל דף. **בסיס**, לא שכבת-הטמעה. */}
      {definitions && (
        <p
          className="mt-3 text-[11px] leading-relaxed text-slate-500"
          data-testid="report-definitions"
        >
          {definitions}
        </p>
      )}
      {/* סייגי-דאטה שהכרטיס מחייב על המסך (C8 `meta.notes`) — למשל "נמדד על N שורות מתוך M". */}
      {notes?.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-500" data-testid="report-notes">
          {notes.join(' · ')}
        </p>
      )}
    </>
  )
}

// 📐9 — `aria-sort` על העמודה הממוינת: ה-RPC מסמן `columns[].sorted` (C8, תוספת 16/09);
// ‏`meta.sort` הישן נשמר כעדיפות ראשונה כדי לא לשבור payload שכבר נבדק.
function sortFromColumns(columns) {
  const column = (columns ?? []).find((c) => c.sorted)
  if (!column) return undefined
  const direction = column.sorted === 'ascending' ? 'ascending' : 'descending'
  return { key: column.key, direction }
}

// C8 `meta.extra_tables` — משטח שצריך יותר מטבלה אחת (מ12: בלוק-ההזמנות ושורות ㉗ · מ15:
// אי-הגעה לפי דירוג) — כל טבלה נוספת עם כותרת משלה ופאג'ר משלה, **דרך אותו `ReportTable`**.
function ExtraTable({ table }) {
  const [page, setPage] = useState(1)
  return (
    <section className="mb-4" data-testid="report-extra-table">
      <h3 className="mb-1.5 text-[13px] font-semibold text-slate-700">{table.title}</h3>
      <ReportTable
        columns={table.columns}
        rows={table.rows}
        page={page}
        onPage={setPage}
        sort={sortFromColumns(table.columns)}
        caption={table.title}
      />
    </section>
  )
}

/**
 * ‏`surface` · `filters` · `drill` · `onDrill` — חוזה-הפרופס של רכיב-לשונית (ר' `tabs/ExecutiveTab.jsx`).
 *
 * 🔌 **חמש נקודות-ההרחבה של בונה-הלשונית — והן הדרך היחידה להוסיף, בלי לשכפל את השלד:**
 * ‏`transformPayload(payload) ⇒ payload'` — סינון-לקוח (למשל שבב *"רק בלי דירוג"* במ16 —
 *   הפאג'ר סופר את מה שמוצג, 📐8) · מיפוי תוויות (`chart.label_source` ⇒ הקבוע העברי) ·
 *   מיסוך-אריח. **מקבל ומחזיר את צורת C8; לעולם לא מוחק מפתח.**
 * ‏`renderTop(payload)` — מעל שורת-האוכלוסייה: רמז-ה-`purpose`/`whyAndFirst` של §⑩, שבבים.
 * ‏`renderBeforeChart(payload)` · `renderBeforeTable(payload)` — רמזי "איך לקרוא את הגרף/הטבלה".
 * ‏`renderExtras(payload)` — בתחתית: מה שייחודי למשטח *(פס-האישור של מ25 בדף 20, רמזי-מונחים)*.
 * כל הארבעה מקבלים את ה-payload **אחרי** `transformPayload`.
 */
export default function ReportSurface({
  surface,
  filters,
  drill,
  onDrill,
  onWindow,
  transformPayload,
  renderTop,
  renderBeforeChart,
  renderBeforeTable,
  renderExtras,
}) {
  const [reloadTick, setReloadTick] = useState(0)

  const {
    from,
    to,
    customerId,
    windowLabel,
    isFiltered,
    clearFilters,
    reloadTick: outerTick,
  } = filters

  // 🔑 **זהות-הבקשה כמחרוזת אחת** — כל מה שמשנה *איזה* דוח מוצג. היא גם מפתח-ה-deps וגם
  // מה שמפריד בין "נטען" ל"נטען משהו אחר".
  const drillKey = drill ? JSON.stringify(drill) : ''
  const filterKey = `${surface.rpc}|${from ?? ''}|${to ?? ''}|${customerId ?? ''}|${drillKey}`
  const requestKey = `${filterKey}|${reloadTick}|${outerTick ?? 0}`

  // 🔴 **תוצאה אחת, ולא שלושה `useState` נפרדים** — וזה לא סגנון:
  // ① `payload`/`error`/`loading` כשלושה מצבים נפרדים יכולים להיות לא-עקביים לרגע
  //    (דאטה ישנה לצד שגיאה חדשה), וזה בדיוק מה שמייצר מסך שמציג מספרים של תקופה אחרת.
  // ② ‏`loading` **נגזר** מהשוואת-מפתחות ואינו נכתב ב-effect — ‏`react-hooks/set-state-in-effect`
  //    חוסם setState סינכרוני בגוף effect, ובצדק: הוא יוצר רינדור מדורג.
  // ⚠️ **מצב תלת-ערכי נשמר במלואו** (§4 של `CLAUDE.md`): `payload: null` = טרם ידוע/כשל ·
  // אובייקט = נטען. **כשל לעולם אינו הופך ל-`{}`** — זה מצג-השווא של "אין נתונים".
  const [result, setResult] = useState({ key: null, payload: null, error: null })
  const loading = result.key !== requestKey

  useEffect(() => {
    let cancelled = false
    callReport(surface.rpc, { from, to, customerId, drill })
      .then((data) => {
        if (cancelled) return
        setResult({ key: requestKey, payload: data, error: null })
        // 🔴 **מכאן המעטפת לומדת מה "היום" בשעון-ישראל** — ולעולם לא מ-`new Date()` בדפדפן.
        // אותו דפוס בדיוק כמו מ7, שמחזיר `today`/`month_start` בגוף התשובה מהסיבה הזו
        // (מסך שנטען אחרי חצות היה מציג חודש שגוי). בלי זה, גלולות-התקופה היו משנות את
        // הכתובת ושולחות `null` בכל מקרה — מסנן שנראה עובד ואינו מסנן דבר.
        onWindow?.(data.window)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(`report ${surface.rpc} failed:`, err)
        setResult({ key: requestKey, payload: null, error: toScreenError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, surface.rpc, from, to, customerId, drill, onWindow])

  // 📐8 · עמוד — **נגזר ולא מאופס ב-effect.** כל שינוי-מסנן מחזיר לעמוד 1 (עמוד 3 של
  // תקופה אחת אינו קיים בהכרח באחרת), וההשוואה מול `filterKey` עושה זאת **בזמן הרינדור**
  // ולא בסבב שני. ⚠️ `reloadTick` בכוונה **אינו** ב-`filterKey`: "נסי שוב" אינו שינוי-סינון
  // ואינו אמור לזרוק את המשתמשת לתחילת הטבלה.
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (next) => setPageState({ key: filterKey, page: next })

  const { payload: rawPayload, error } = result
  // הטרנספורמציה של הלשונית רצה על payload שנטען בלבד — `null` (כשל/טרם) נשאר `null`.
  const payload = rawPayload && transformPayload ? transformPayload(rawPayload) : rawPayload

  if (loading) return <Envelope state="loading" testId={`report-${surface.slug}`} />
  if (error?.kind === 'noPermission') {
    return (
      <Envelope
        state="noPermission"
        title={noPermissionSentence(surface.name)}
        testId={`report-${surface.slug}`}
      />
    )
  }
  if (error) {
    return (
      <Envelope
        state="error"
        detail={error.detail}
        onRetry={() => setReloadTick((t) => t + 1)}
        testId={`report-${surface.slug}`}
      />
    )
  }
  if (!payload) return <Envelope state="blank" testId={`report-${surface.slug}`} />

  const charts = normalizeCharts(payload.chart)
  const hasContent = payload.tiles.length > 0 || charts.length > 0 || payload.rows.length > 0
  if (!hasContent) {
    // ריק-אחרי-סינון מול ריק-לגמרי (§⑥ מצבים 2 · 3) — ‏`isFiltered` נגזר במעטפת, ר' שם.
    return (
      <Envelope
        state={isFiltered ? 'empty' : 'blank'}
        testId={`report-${surface.slug}`}
        onClearFilters={isFiltered ? clearFilters : undefined}
      />
    )
  }

  const crumbs = payload.drill?.crumbs ?? []
  const drillLabel = crumbs.length > 1 ? crumbs[crumbs.length - 1].label : null

  return (
    <div data-testid={`report-${surface.slug}`}>
      {/* 📐13① — פירורים **רק** בדפי-הדריל, ורק כשיש יותר מרמה אחת. */}
      {surface.drill && <DrillCrumbs crumbs={crumbs} onNavigate={(next) => onDrill(next)} />}
      {renderTop?.(payload)}
      <PopulationLine population={payload.population} />
      <MissingParamsBanner names={payload.meta?.missing_params} />

      <ExportBar
        reportName={surface.name}
        windowLabel={payload.window?.label ?? windowLabel}
        drillLabel={drillLabel}
        columns={payload.columns}
        rows={payload.rows}
        blockedReason={payload.meta?.export_blocked_reason}
      />

      <Tiles tiles={payload.tiles} onOpenTarget={(target) => onDrill(target)} />

      {/* 📐23 — שורת-"אז מה", פעולה קודמת לעובדה. יושבת מעל הגרף, כמו בשלד של §⑥. */}
      {payload.so_what && (
        <p
          className="mb-4 border-r-[3px] border-teal-600 px-3.5 py-1.5 text-[13px] font-semibold text-teal-700"
          data-testid="report-so-what"
        >
          {payload.so_what}
        </p>
      )}

      {charts.length > 0 && renderBeforeChart?.(payload)}
      {charts.map((chart, index) => (
        <ChartCard key={chart.title ?? index} chart={chart} />
      ))}

      {payload.columns?.length > 0 && renderBeforeTable?.(payload)}
      <ReportTable
        columns={payload.columns}
        rows={payload.rows}
        page={page}
        onPage={setPage}
        sort={payload.meta?.sort ?? sortFromColumns(payload.columns)}
        onDrill={surface.drill ? (drillKey) => onDrill(drillKey) : undefined}
        caption={surface.name}
      />
      {payload.meta?.extra_tables?.map((table) => (
        <ExtraTable key={table.title} table={table} />
      ))}

      <Footers definitions={payload.definitions} notes={payload.meta?.notes} />
      {renderExtras?.(payload)}
    </div>
  )
}
