// מבט-העל של הפרויקטים (מודול 6 · משטח 1) — מסך-קריאה טהור: אפס כתיבות, אפס דיאלוגים,
// אפס מיילים (כרטיס-המסך §①). זה מסך טריאז', לא דוח — "לאיזה אירוע אני נכנסת עכשיו, ומה
// בדיוק חסר בו" — ולכן סדר-השורות הוא התשובה: אין מיון-עמודות, אין חיפוש, אין עימוד.
// כלל 14: אפס נוסחאות כאן — כל מספר, סדר ומשפט מגיע מ-src/lib/projects.js או מה-RPC.
//
// 🔴 אין כפתור-פעולה ראשי בכותרת, וזו הכרעה ולא השמטה (S-5): פרויקט נולד אך ורק מאישור
// הצעת-מחיר (approve_quote_and_create_project) — "+ פרויקט חדש" היה כפתור שמבטיח פעולה
// שאינה קיימת. כל פעולות המודול יושבות בכרטיס-הפרויקט (משטח 2).
//
// 🔴 אין עמודת מיקום, וזו סטייה מודעת מהתקדים הבנוי של מודול 4 (S-8): במבט-העל של מודול 4
// (OverviewTab.jsx) המיקום מוצג כי שם הוא קלט-דירוג — 0.25 מציון-הקרבה של Smart Match.
// כאן אין לו צרכן שמפריד בין פרויקט לפרויקט: ההחלטה האחת של המסך היא לדרג בין אירוע
// לאירוע, והמיקום אינו מדרג. הוא יושב בכרטיס-הפרויקט, ששם הוא נדרש. בלי המשפט הזה,
// המהנדס הראשון שיפתח את שני המסכים יקרא את ההיעדר כפספוס.
//
// 🔴 עמודת "מה חסר" עוברת דרך gapSentence בלבד, בלי confirmed_available — הנתיב המדורד
// המתועד (as-built 18/08, צעד 2.5): ה-RPC אינו מחזיר את המונה, ושליפת assignments פר-פרויקט
// מכאן אסורה (AR-3) — למי שחסומה על 'דיילות' הצירוף מחזיר [] בלי שגיאה והמשפט יוצא שגוי.
// מדורד-ולעולם-לא-שגוי מנצח: המשפט נופל ל"חסרות N" הנכון תמיד.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Hint from '@/components/Hint'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import StatusTag from '@/components/StatusTag'
import StatTile from '@/components/StatTile'
import FilterPill from '@/components/FilterPill'
import Ltr from '@/components/Ltr'
import { WindowChips, Pager } from '@/components/ListWindow'
import {
  DEFAULT_WINDOW,
  PAGE_SIZE,
  filterByWindow,
  paginate,
  parsePageParam,
  parseWindowParam,
} from '@/lib/listWindow'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/dates'
import {
  PROJECT_STATUS_LABELS,
  ACTIVE_PROJECT_STATUSES,
  resolveProjectTone,
  gapSentence,
  gapTone,
  eventDaysFromToday,
  proximitySentence,
  sortOverviewProjects,
  overviewRowKind,
  staffingCell,
  logisticsCell,
  overviewTiles,
  staffingTileSub,
  logisticsTileSub,
  filteredOutSentence,
} from '@/lib/projects'
import { listProjectsOverview } from './api'
import ExportDialog from '@/components/ExportDialog'
import {
  buildExportFileName,
  buildExportSheet,
  EXPORT_LOCKED_MESSAGES,
  exportReportRows,
} from '@/lib/reportsExport'

// שלוש הלשוניות על שם מה שדנה עושה, לא על שם סטטוס (⑰). המונה בכל לשונית הוא היישום
// של ⑦ — עבודה שממתינה בלשונית אחרת אינה נעלמת, ומונה 0 נשאר על המסך ואינו מוסתר.
const TABS = [
  { key: 'work', label: 'בעבודה' },
  { key: 'closing', label: 'לסגירה' },
  { key: 'all', label: 'הכול' },
]

// טוני שורת-המשנה — תרגום 1:1 של מחלקות המוקאפ (miss/hint/done/calm): המילה נושאת את
// המשמעות, הצבע רק מדגיש — כל שורה נקראת במלואה גם בשחור-לבן (מבחן המוקאפ).
const SUB_TONES = {
  miss: 'text-red-600 text-xs font-semibold',
  hint: 'text-amber-700 text-xs font-semibold',
  done: 'text-slate-500 text-xs',
  calm: 'text-slate-400 text-xs',
}

// שורת-המיון — טקסט בלבד (⑧): קיימת כי סדר לא-מוסבר הוא חידה, וכותרות-העמודות אינן
// לחיצות בכוונה — מיון לפי "תאריך" היה מחזיר בדיוק את הטעות ש-⑧ נועדה למנוע.
const SORT_LINE = 'ממוין: חסרים תחילה, ובתוכם לפי קרבת האירוע'
// ✏️ 25/09/2026 (סבב תיקוני-אמת, מעבר-העיניים): בלשונית "לסגירה" כל שורה נחשבת "חסרה" (`overviewHasGap` מחזירה
// true לכל `event_finished` — מה שחסר שם הוא הסגירה עצמה), ולכן הסדר בפועל הוא קרבה בלבד. השורה אמרה "חסרים
// תחילה", והשורה עם 7/8 ישבה שלישית. ⇒ השורה אומרת את הסדר האמיתי. (ולא שינינו את הסדר: 7/8 באירוע שכבר
// התקיים הוא עובדה לסגירה, לא חוסר שאפשר עוד להשלים.)
const SORT_LINE_CLOSING = 'ממוין לפי קרבת האירוע'

// "היום" מחושב פעם אחת בטעינה ומוחזק ב-state (react-hooks/purity אוסר שעון ברינדור,
// והדפוס זהה ל-OverviewTab של מודול 4) — ומתעדכן עם כל רענון-נתונים.
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// 🔴 **תיאור-העמודות לחלון-הייצוא — החוזה ש-`PROJECT_MASTER §6` מבטיח, והמסך הראשון שצורך אותו.**
//
// 🔑 **כל `value` קורא לאותה פונקציית-נגזרת שהטבלה קוראת לה — לעולם לא מימוש שני.**
// התאים כאן אינם ערכים גולמיים: "דיילות" הוא `staffingCell(p).ratio` · "מה חסר" הוא `gapSentence(p)` ·
// "סטטוס" הוא תווית מ-`PROJECT_STATUS_LABELS`. **מימוש שני היה מפצל את המסך מהקובץ**
// ביום שאחת מהנגזרות תשתנה, והפער היה שקט — א׳לא שגיאה וא׳לא בדיקה שנופלת.
//
// ⚠️ **17 שדות, לא 30 — וזה גבול שנמדד ולא השמטה.** המוקאפ הראה 30 שדות מטבלת
// `projects`, אבל **השליפה שהמסך מריץ מחזירה 17**: `list_projects_overview()`
// (`20260814142439_module6_rpcs_reads_and_close.sql:138-157`).
// 🔑 **אי-אפשר לייצא שדה שלא נשלף.** שלושה-עשר הנותרים דורשים שינוי ב-RPC,
// כלומר **מיגרציה ⇒ כלל-ברזל 4, הכרעת-ישי בלבד.** נרשם ולא בוצע בשקט.
//
// 🚧 **ואין כאן `visible`, וגם זה נמדד:** עמודת-הכסף היחידה היא `planned_revenue`,
// **והיא ממוסכת במסד** ולא בלקוח — ר' ההערה שלידה. ⇒ אין כאן שדה שהלקוח צריך להסתיר.
const EXPORT_COLUMNS = [
  { key: 'project_id', label: 'מס׳ פרויקט', format: 'id', core: true },
  { key: 'event_name', label: 'אירוע', format: 'text', core: true },
  { key: 'customer_name', label: 'לקוח', format: 'text', core: true },
  { key: 'final_event_date', label: 'תאריך האירוע', format: 'date', core: true },
  {
    key: 'staffing',
    label: 'דיילות',
    format: 'text',
    core: true,
    value: (project) => staffingCell(project).ratio ?? '',
  },
  {
    key: 'logistics',
    label: 'לוגיסטיקה',
    format: 'text',
    core: true,
    value: (project) => logisticsCell(project).ratio ?? '',
  },
  {
    key: 'project_status',
    label: 'סטטוס',
    format: 'text',
    core: true,
    value: (project) => PROJECT_STATUS_LABELS[project.project_status] ?? '',
  },
  // 🔴 **מחוץ לברירת-המחדל במכוון — החריג היחיד לכלל "מה שבמסך".**
  // הקריטריון שישי נתן (23/09): *"אם זה לא עוזר להם בניתוח באקסל אז מיותר"*.
  // 🔑 **והמשפט הזה הוא תרגום-למילים של עמודות שכבר בקובץ** — *"2 זימונים ממתינים
  // למענה"* הוא אותו נתון שב"דיילות" (2/3). באקסל אי-אפשר למיין, לסנן או לעשות
  // טבלת-ציר על משפט — **והנתון כבר שם בצורה שכן אפשר.**
  // ⚠️ **ונשאר זמין ולא נמחק** — שלילה היא הכרעת-מוצר, והוא הכריע להשאיר.
  // 🚫 **וזה החריג היחיד:** ברגע שנתחיל לבחור ידנית אילו עמודות-מסך "שימושיות" —
  // איבדנו את הכלל, וכל מסך יהפוך להכרעה מחדש. **הקריטריון צר בכוונה:
  // עמודה שהיא ניסוח-מילולי של עמודות אחרות באותו קובץ.**
  { key: 'gap', label: 'מה חסר', format: 'text', value: (project) => gapSentence(project) },

  // ⬇️ **זמינות בבוחר, אינן מסומנות** — "ואם ירצה יוכל להוסיף עוד" (הכרעת-ישי 23/09).
  { key: 'final_location', label: 'מיקום', format: 'text' },
  { key: 'final_start_time', label: 'שעת התחלה', format: 'text' },
  { key: 'final_end_time', label: 'שעת סיום', format: 'text' },
  { key: 'required_hostess_count', label: 'דיילות נדרשות', format: 'int' },
  { key: 'hostesses_confirmed', label: 'דיילות שאושרו', format: 'int' },
  { key: 'pending_invites', label: 'זימונים ממתינים', format: 'int' },
  { key: 'logistics_ready', label: 'לוגיסטיקה מוכנה', format: 'int' },
  { key: 'logistics_total', label: 'פריטי לוגיסטיקה', format: 'int' },
  // 📄 התווית מאושרת ב-`rulings-2026-09-22.md`: *"תאריך ביטול"*, ולא *"בוטל בתאריך"*.
  { key: 'cancelled_at', label: 'תאריך ביטול', format: 'date' },
  { key: 'cancel_type', label: 'סוג ביטול', format: 'text' },
  // 💰 **כסף — ובטוח להצעה, כי המיסוך במסד ולא בלקוח.** `list_projects_overview`
  // מחשבת את ראות-הקוראת על 'הצעות מחיר' ומחזירה **`NULL` למי שאין לה**
  // (`20260814142439_module6_rpcs_reads_and_close.sql:103-108`).
  // ⇒ אינו בברירת-המחדל (אינו על המסך), וכן זמין למי שיסמן אותו.
  { key: 'planned_revenue', label: 'הכנסה מתוכננת', format: 'money' },
]

// 🔑 **ברירת-המחדל היא בדיוק מה שהטבלה על המסך מראה** — הכרעת-ישי 23/09/2026:
// *"בכל מסך שילחצו ייצוא ברירת המחדל תהיה מה שבמסך, ואם ירצה יוכל להוסיף עוד"*.
// ✅ **וזה אינו שינוי מההכרעה מ-18/09** — היא אמרה *"8 עמודות-הליבה **שמופיעות
// בטבלת המסך**"*; הניסוח החדש רק הפך אותה לכלל כללי שאינו דורש הכרעה מחדש פר-מסך.
// 📌 **והאכיפה עצמה יושבת ב-`defaultSelection` (`src/lib/exportColumns.js`)** ולא כאן —
// כדי שכל מסך שיחובר יקבל את אותה התנהגות בלי לחזור על הלוגיקה. **כלל-ברזל 14.**

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [today, setToday] = useState(todayIso)
  const [exportOpen, setExportOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listProjectsOverview()
        if (cancelled) return
        setProjects(rows)
        setToday(todayIso())
        setError(null)
      } catch (err) {
        // 🔴 כשל-טעינה לעולם אינו "אין פרויקטים" (④) — המסך כולו נכשל בקול, עם "נסי שוב".
        // ‏err.message לא מוצג לדנה — כשל-רשת מגיע כ-"TypeError: Failed to fetch" באנגלית
        // (נתפס בצילום-האימות 19/08); השורה השנייה נעולה בעברית, והפרטים הטכניים לקונסול.
        if (!cancelled) {
          console.error('projects overview load failed:', err)
          setError('רשימת הפרויקטים לא נטענה.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  // מצב-התצוגה חי בכתובת ולא ב-state (S-18) — "חזור" משחזר את הלשונית והמסנן במקום למחוק
  // אותם. writeParams ממוזג + replace, ו-resolveNext מגן על הצורה הפונקציונלית של סטרים —
  // המוקש שנשך ב-CustomersPage ב-30/07 (סטר-URL שקיבל פונקציה כתב אותה כמחרוזת, בשקט).
  function writeParams(patch) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === null) next.delete(key)
          else next.set(key, String(value))
        }
        return next
      },
      { replace: true },
    )
  }

  function resolveNext(valueOrFn, current) {
    return typeof valueOrFn === 'function' ? valueOrFn(current) : valueOrFn
  }

  const tabParam = searchParams.get('tab') ?? 'work'
  // ערך זר בכתובת נופל ללשונית הראשונה — ברירת-המחדל של S-18, לא מסך שבור.
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'work'
  const setTab = (value) => {
    const next = resolveNext(value, tab)
    // מסנן-הסטטוס שייך ללשונית "הכול" בלבד — מעבר לשונית מנקה אותו, אחרת הוא היה חוזר
    // בשקט בחזרה אליה עם סינון ישן שהמשתמשת כבר שכחה. מעבר-לשונית מאפס גם עמוד (04/09) —
    // עמוד 3 בלשונית הישנה אינו קיים בהכרח בחדשה.
    writeParams({ tab: next === 'work' ? undefined : next, status: undefined, page: undefined })
  }

  const statusFilter = searchParams.get('status') ?? 'all'
  const setStatusFilter = (value) => {
    const next = resolveNext(value, statusFilter)
    writeParams({ status: next === 'all' ? undefined : next, page: undefined })
  }

  // חלון-הזמן + עמוד (הכרעת-ישי 04/09/2026) — שני הפרמטרים האלה בלבד עוברים לכתובת;
  // ‏tab/status ממשיכים באותו writeParams כבר שהיה כאן (S-18), בלי הסבה.
  const windowKey = parseWindowParam(searchParams.get('window'))
  const setWindowKey = (value) => {
    const next = resolveNext(value, windowKey)
    // כל שינוי-חלון מאפס עמוד — עמוד 3 של "3 חודשים" אינו בהכרח קיים ב"הכול".
    writeParams({ window: next === DEFAULT_WINDOW ? undefined : next, page: undefined })
  }

  const page = parsePageParam(searchParams.get('page'))
  const setPage = (value) => {
    const next = resolveNext(value, page)
    writeParams({ page: next === 1 ? undefined : next })
  }

  const sorted = useMemo(() => sortOverviewProjects(projects, today), [projects, today])

  // דליים גולמיים (לפני חלון) — נשמרים כדי ש-hiddenCount ומסנן-הסטטוס יוכלו להשוות "מה היה
  // כאן בלי החלון" מול "מה יש עם החלון", בדיוק כמו שכרטיס-החוזה מבקש.
  const rawTabRows = useMemo(
    () => ({
      work: sorted.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.project_status)),
      closing: sorted.filter((p) => p.project_status === 'event_finished'),
      all: sorted,
    }),
    [sorted],
  )

  // 🔑 החלון חל על תאריך-האירוע (final_event_date) ומוחל **פר-לשונית** — כדי שמונה-הלשונית
  // עצמו יספור "בתוך החלון", לא את כל הדאטה (חוזה §3: "מוני-הלשונית סופרים בתוך החלון").
  const windowedTabRows = useMemo(() => {
    const byKey = {}
    for (const key of Object.keys(rawTabRows)) {
      byKey[key] = filterByWindow(rawTabRows[key], (p) => p.final_event_date, windowKey, today)
    }
    return byKey
  }, [rawTabRows, windowKey, today])

  const tabRows = windowedTabRows

  const statusCounts = useMemo(() => {
    const counts = {}
    for (const p of windowedTabRows.all)
      counts[p.project_status] = (counts[p.project_status] ?? 0) + 1
    return counts
  }, [windowedTabRows])

  // האריחים אינם תלויים בלשונית ולא בחלון-הזמן (הכרעה קיימת: הם מדד-התרעה גלובלי, לא
  // תצוגת-רשימה) — נשארים על כל הפרויקטים, בדיוק כפי שהיו לפני החלון.
  const tiles = useMemo(() => overviewTiles(projects), [projects])

  const currentRawRows = rawTabRows[tab]
  const preWindowVisible =
    tab === 'all' && statusFilter !== 'all'
      ? currentRawRows.filter((p) => p.project_status === statusFilter)
      : currentRawRows

  // סדר-הפעולות של החוזה: מסננים-קיימים (לשונית+סטטוס) → חלון → מיון (כבר מוחל ב-`sorted`
  // למעלה, כי הוא רץ פעם אחת על כל הפרויקטים ומשמר את סדרו דרך כל הסינונים) → עימוד.
  const windowedVisible = useMemo(
    () => filterByWindow(preWindowVisible, (p) => p.final_event_date, windowKey, today),
    [preWindowVisible, windowKey, today],
  )
  const hiddenCount = preWindowVisible.length - windowedVisible.length

  // שם-הקובץ נגזר מאותו `buildExportFileName` שמודול 11 משתמש בו — **בונה אחד לשם-קובץ**,
  // ולא ניסוח שני שיתפצל ביום שהכלל ישתנה (הוא גם מנקה תווים אסורים ותווי-בידוד).
  const exportFileName = useMemo(
    () =>
      buildExportFileName({
        reportName: 'פרויקטים',
        windowLabel: TABS.find((t) => t.key === tab)?.label,
      }),
    [tab],
  )

  const pageResult = useMemo(
    () => paginate(windowedVisible, page, PAGE_SIZE),
    [windowedVisible, page],
  )
  const visible = pageResult.pageRows

  if (loading) {
    return (
      <div data-testid="projects-page">
        <PageHeader />
        {/* האריחים והלשוניות מקבלים שלד משלהם (④) — מונה-לשונית ריק גרוע ממונה שעדיין טוען. */}
        <TilesSkeleton />
        <div className="rounded-xl border border-slate-200 bg-white px-4 pb-3.5 shadow-sm">
          <TabsSkeleton />
          <LoadingOrError loading skeleton={{ variant: 'table', rows: 5, cols: 7 }} />
        </div>
      </div>
    )
  }

  if (error) {
    // מצב ⑤ — כשל-טעינה של המסך כולו. הנוסח הנעול (§3.7) — הכותרת + שורת-מה-חסר + "נסי
    // שוב" — חי ב-PermissionAwareEmpty (צעד 3.0 δ), ולכן הוא הרכיב כאן ולא LoadingOrError:
    // האחרון מציג שורת-שגיאה אחת, והנעילה דורשת שתיים. האריחים אינם מוצגים — אריח "0" על
    // כשל-קריאה הוא בדיוק השקר של "אפס שורות ⇒ הכול תקין".
    return (
      <div data-testid="projects-page">
        <PageHeader />
        <div className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <PermissionAwareEmpty
            state="error"
            detail={error}
            onRetry={refresh}
            testId="projects-error"
          />
        </div>
      </div>
    )
  }

  return (
    <div data-testid="projects-page">
      <PageHeader />
      <TilesRow tiles={tiles} />
      <div className="rounded-xl border border-slate-200 bg-white px-4 pb-3.5 shadow-sm">
        {projects.length === 0 ? (
          // מצב ② — ריק אמיתי: אין מה לסנן ואין לשונית שתציג משהו; הפעולה היחידה שקיימת
          // היא במסך שבו פרויקטים נולדים. סטייה מודעת מתבנית "הוסף ראשון" — כאן אין הוספה.
          <PermissionAwareEmpty
            state="empty"
            title="עדיין אין פרויקטים במערכת."
            detail="פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית."
            action={
              <Link
                to="/quotes"
                className="text-xs font-semibold text-teal-700"
                data-testid="projects-goto-quotes"
              >
                למסך הצעות מחיר →
              </Link>
            }
            testId="projects-empty-true"
          />
        ) : (
          <>
            <TabsBar
              active={tab}
              counts={{
                work: tabRows.work.length,
                closing: tabRows.closing.length,
                all: tabRows.all.length,
              }}
              onSelect={setTab}
            />
            <div className="flex flex-wrap items-center gap-2 py-2.5">
              {tab === 'all' && (
                <StatusPills
                  selected={statusFilter}
                  total={tabRows.all.length}
                  counts={statusCounts}
                  onSelect={setStatusFilter}
                />
              )}
              {/* חלון-הזמן יושב באותה שורת-המסננים, אחרי הגלולות — אותו מיקום בדיוק בשני
                  המסכים (חוזה §4). */}
              <WindowChips value={windowKey} onChange={setWindowKey} hiddenCount={hiddenCount} />
              <span className="mr-auto text-sm text-slate-400" data-testid="projects-sort-line">
                {tab === 'closing' ? SORT_LINE_CLOSING : SORT_LINE}
              </span>
              {/* הכפתור יושב בשורת-המסננים, בדיוק כמו במודול 11 — אותו מיקום בכל מסך
                  שמחובר לחלון. 🔑 **פעיל תמיד**: החלון עצמאי ואומר בעצמו כשאין מה לייצא
                  (הכרעת-ישי 17/09, ת4ב) — כפתור מנוטרל אינו אומר למשתמשת למה. */}
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setExportOpen(true)}
                data-testid="projects-export-button"
              >
                <Download className="size-4" aria-hidden="true" />
                ייצוא
              </Button>
            </div>
            {/* הרמז מסביר "החסרים עולים למעלה" — לא נכון בלשונית "לסגירה" (ר' SORT_LINE_CLOSING). */}
            {visible.length > 0 && tab !== 'closing' && <Hint id="projects.sort" />}
            {visible.length === 0 ? (
              <EmptyRows
                filtered={tab === 'all' && statusFilter !== 'all'}
                tab={tab}
                total={projects.length}
                onClear={() => setStatusFilter('all')}
              />
            ) : (
              <ProjectsTable
                rows={visible}
                closing={tab === 'closing'}
                today={today}
                onOpen={(id) => navigate(`/projects/${id}`)}
              />
            )}
            {/*
              🔑 **החלון מקבל `windowedVisible` ולא `visible`, וזה ההבדל היחיד שחשוב כאן:**
              `visible` הוא **עמוד אחד** (`paginate`), ו-`windowedVisible` הוא כל מה שעומד במסנן.
              װ**הכרעת-ישי 17/09: *"כל השורות שעומדות במסנן"*** — קובץ שמכיל עמוד
              אחד מתוך שלושה הוא בדיוק החיתוך-השקט שכל המנגנון הזה נבנה כדי למנוע.
              🚧 **ואין כאן שליפה שנייה**, בשונה ממודול 11: װ`listProjectsOverview` כבר הביא את הכול
              לזיכרון והדפדוף כולו בלקוח (תוכנית §7.1) ⇒ החלון מקבל שורות, לא פונקציית-שליפה.
              ⚠️ **ו-`permissions` אינו מועבר במכוון:** אף מפתח כאן אינו ברשם-העמודות-הרגישות,
              ו-`isVisible` נופל **סגור** על מפתח רשום כשאין הרשאות ⇒ אם מישהו יוסיף כאן
              עמודת-שכר בעתיד, היא **תיחסם ולא תדלוף**, עד שיועברו הרשאות במפורש.
            */}
            {exportOpen && (
              <ExportDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                title="ייצוא פרויקטים לאקסל"
                columns={EXPORT_COLUMNS}
                rows={windowedVisible}
                buildSheet={buildExportSheet}
                knownMessages={EXPORT_LOCKED_MESSAGES}
                fileName={exportFileName}
                onExport={({ columns: picked, rows: pickedRows, scope, count }) =>
                  exportReportRows({
                    fileName: exportFileName,
                    sheetName: 'פרויקטים',
                    columns: picked,
                    rows: pickedRows,
                    meta: { scope, count, generatedAt: new Date() },
                  })
                }
              />
            )}
            {/* הדפדוף יושב תחת הטבלה, בתוך אותו כרטיס (חוזה §4) — ומוסתר-מאליו כש-total=0
                (חוסר-שורות אחרי-חלון/סינון כבר מטופל ע"י EmptyRows). */}
            <Pager
              page={pageResult.page}
              pageCount={pageResult.pageCount}
              from={pageResult.from}
              to={pageResult.to}
              total={pageResult.total}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}

function PageHeader() {
  // ‏<h1> לבדו — בלי כפתור ראשי (S-5, ההערה בראש הקובץ).
  return <h1 className="mb-4 text-lg font-bold text-slate-800">פרויקטים</h1>
}

function TilesRow({ tiles }) {
  const staffingSub = staffingTileSub(tiles.staffing)
  const logisticsSub = logisticsTileSub(tiles.logistics)
  return (
    // flex flex-wrap ולא grid (הכרעת-ישי 08/08) — האריחים עוטפים ואינם נמתחים לרוחב מלא.
    <div className="mb-4 flex flex-wrap gap-3">
      <StatTile
        label="אירועים שחסרות בהם דיילות"
        // מונה עובר כמחרוזת/צומת, לעולם לא כמספר — StatTile מעביר value מספרי דרך Money
        // והאריח היה מציג "3 ₪" (המלכודת שנתפסה בצילום-מסך במודול 4). רק הספרה אדומה,
        // הרקע נשאר לבן (המוקאפ: tile-v.alarm), ו-Ltr על הספרה — לא על השורה (חוזה §4.3).
        value={
          <span className={tiles.staffing.count > 0 ? 'text-red-600' : ''}>
            <Ltr>{String(tiles.staffing.count)}</Ltr>
          </span>
        }
        sub={staffingSub ?? undefined}
        testId="projects-tile-staffing"
      />
      <StatTile
        label="אירועים שהלוגיסטיקה בהם טרם מוכנה"
        value={<Ltr>{String(tiles.logistics.count)}</Ltr>}
        sub={logisticsSub ?? undefined}
        testId="projects-tile-logistics"
      />
    </div>
  )
}

function TabsBar({ active, counts, onSelect }) {
  return (
    <div className="-mx-4 flex gap-1 border-b border-slate-200 px-4" role="tablist">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          onClick={() => onSelect(key)}
          className={cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm',
            active === key
              ? 'border-teal-600 font-semibold text-teal-700'
              : 'border-transparent font-medium text-slate-500',
          )}
          data-testid={`projects-tab-${key}`}
        >
          {label}
          {/* המונה חלק משטח-הלחיצה של הלשונית, ומוצג גם כשהוא 0 (⑦) — לשונית שמעלימה את
              המונה מוחקת את המצב מהמציאות. */}
          <Ltr
            className={cn(
              'mr-1.5 text-xs font-semibold',
              active === key ? 'text-teal-700' : 'text-slate-400',
            )}
          >
            {String(counts[key])}
          </Ltr>
        </button>
      ))}
    </div>
  )
}

function StatusPills({ selected, total, counts, onSelect }) {
  // סדר הגלולות = סדר האוצר הנעול (PROJECT_STATUS_LABELS) — זהה לסדר שהמוקאפ מצייר.
  return (
    <>
      <FilterPill
        on={selected === 'all'}
        onClick={() => onSelect('all')}
        testId="projects-pill-all"
      >
        הכול
        <Ltr className="mr-1.5 font-semibold opacity-70">{String(total)}</Ltr>
      </FilterPill>
      {Object.entries(PROJECT_STATUS_LABELS).map(([status, label]) => {
        const count = counts[status] ?? 0
        return (
          <FilterPill
            key={status}
            on={selected === status}
            // גלולת-0 נשארת על המסך, מכובה ומנומקת — מכבים ומנמקים, לא מעלימים (⑦).
            disabled={count === 0}
            title={count === 0 ? 'אין כרגע פרויקט בסטטוס הזה' : undefined}
            onClick={() => onSelect(status)}
            testId={`projects-pill-${status}`}
          >
            {label}
            <Ltr className="mr-1.5 font-semibold opacity-70">{String(count)}</Ltr>
          </FilterPill>
        )
      })}
    </>
  )
}

function EmptyRows({ filtered, tab, total, onClear }) {
  if (filtered) {
    // מצב ③ — ריק אחרי סינון: הפעולה הנכונה הפוכה ממצב ② (ניקוי-סינון, לא ניווט להצעות)
    // ואסור לאחד אותם (④). המונה בשורה השנייה חי, לא מועתק.
    return (
      <PermissionAwareEmpty
        state="empty"
        title="אין פרויקט התואם למסנן שבחרת."
        detail={filteredOutSentence(total)}
        action={
          <Button
            type="button"
            variant="link"
            onClick={onClear}
            className="h-auto p-0 text-xs font-semibold text-teal-700"
            data-testid="projects-clear-filter"
          >
            נקי סינון
          </Button>
        }
        testId="projects-empty-filtered"
      />
    )
  }
  // מצב ④ — לשונית ריקה: בשורה טובה, מנוסחת בחיוב ולא כשגיאה; המונה 0 נשאר על הלשונית.
  return (
    <PermissionAwareEmpty
      state="empty"
      title={tab === 'closing' ? 'אין אירוע שממתין לסגירה' : 'אין אירוע בעבודה כרגע'}
      testId="projects-empty-tab"
    />
  )
}

function ProjectsTable({ rows, closing, today, onOpen }) {
  return (
    <table className="w-full border-collapse" data-testid="projects-table">
      <thead>
        <tr>
          <Th>אירוע</Th>
          <Th>מתי</Th>
          <Th>דיילות</Th>
          {/* בלשונית "לסגירה" עמודת הלוגיסטיקה יוצאת — אחרי שהאירוע התקיים היא כבר אינה
              עבודה (המוקאפ, מצב 2). */}
          {!closing && <Th>לוגיסטיקה</Th>}
          <Th>סטטוס</Th>
          <Th>מה חסר</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((project) => (
          <ProjectRow
            key={project.project_id}
            project={project}
            closing={closing}
            today={today}
            onOpen={() => onOpen(project.project_id)}
          />
        ))}
      </tbody>
    </table>
  )
}

function ProjectRow({ project, closing, today, onOpen }) {
  const kind = overviewRowKind(project)
  const label = PROJECT_STATUS_LABELS[project.project_status]
  const days = eventDaysFromToday(project.final_event_date, today)
  const staffing = staffingCell(project)
  const logistics = logisticsCell(project)
  const linkText = closing ? 'לסגירה →' : 'לכרטיס →'

  return (
    <tr
      onClick={onOpen}
      // ⌨️ שורה לחיצה חייבת נגישות-מקלדת משלה — התבנית של CustomersPage/OverviewTab,
      // שכל מסך-טבלה בונה מחדש ולכן כל מסך יכול לשכוח בנפרד (מוקש מודול 4).
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-label={`${project.event_name} — ${closing ? 'לסגירה' : 'לכרטיס'}`}
      className={cn(
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
        // תקציב-הצבע (⑥): אדום = אפס שורות שיבוץ (איש לא נגע); מעומעם = יצא מידיה.
        kind === 'red' && 'bg-red-50',
        kind === 'muted' && 'bg-slate-50 text-slate-500',
      )}
      data-testid={`projects-row-${project.project_id}`}
    >
      <Td>
        <div className="font-semibold text-slate-800">
          {kind === 'red' && (
            <span className="ml-1.5 text-red-600" title="לא נשלח אף זימון לדיילת">
              ⚠
            </span>
          )}
          {project.event_name}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">{project.customer_name}</div>
      </Td>
      <Td>
        <Ltr className="text-sm">{formatDate(project.final_event_date, '—')}</Ltr>
        {/* קרבת-האירוע לעולם אינה נצבעת (F20 · ⑯) — טקסט אפור, משפיעה על סדר-המיון בלבד. */}
        <div className="mt-0.5 text-xs text-slate-400">{proximitySentence(days)}</div>
      </Td>
      <Td>
        <MetricCell cell={staffing} />
      </Td>
      {!closing && (
        <Td>
          <MetricCell cell={logistics} />
        </Td>
      )}
      <Td>
        {/* הטון מועבר במפורש דרך resolveProjectTone — שצועק על תווית לא-ממופה במקום
            הנפילה השקטה של StatusTag ל-muted (שומר ① של צעד 2.1). */}
        <StatusTag label={label} tone={resolveProjectTone(label)} />
      </Td>
      <Td>
        {/* משפט במילים, לעולם לא ציון (⑧) — הנוסח מ-gapSentence בלבד, הנתיב המדורד
            (בלי confirmed_available; ההערה בראש הקובץ). */}
        <span className={SUB_TONES[gapTone(project)]}>{gapSentence(project)}</span>
      </Td>
      <Td>
        <Link
          to={`/projects/${project.project_id}`}
          onClick={(e) => e.stopPropagation()}
          className="whitespace-nowrap text-sm font-semibold text-teal-700"
        >
          {linkText}
        </Link>
      </Td>
    </tr>
  )
}

// תא-מדד: יחס בבידוד-כיווניות (Ltr על הערך, לא על התא — כילד-flex/block הוא היה נמתח
// ומיישר את המספר שמאלה, הרחק מתוויתו: מנגנון 3.0 β) + שורת-משנה במילים.
function MetricCell({ cell }) {
  if (cell.hidden) return <span className="text-slate-400">—</span>
  return (
    <>
      {cell.ratio != null && <Ltr className="text-sm">{cell.ratio}</Ltr>}
      {cell.sub && <span className={cn('block', SUB_TONES[cell.tone])}>{cell.sub}</span>}
    </>
  )
}

const SKELETON_BAR = 'animate-pulse rounded bg-slate-200'

function TilesSkeleton() {
  return (
    <div
      className="mb-4 flex flex-wrap gap-3"
      data-testid="projects-tiles-skeleton"
      aria-hidden="true"
    >
      {[0, 1].map((i) => (
        <div key={i} className="min-w-[150px] rounded-xl border border-slate-200 bg-white p-4">
          <span className={cn(SKELETON_BAR, 'block h-3 w-36')} />
          <span className={cn(SKELETON_BAR, 'mt-2 block h-5 w-8')} />
          <span className={cn(SKELETON_BAR, 'mt-2 block h-2.5 w-28')} />
        </div>
      ))}
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div
      className="-mx-4 mb-3 flex gap-4 border-b border-slate-200 px-4 py-3"
      data-testid="projects-tabs-skeleton"
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn(SKELETON_BAR, 'h-4 w-16')} />
      ))}
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold text-slate-500">
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="border-b border-slate-100 px-2.5 py-2.5 align-middle">{children}</td>
}
