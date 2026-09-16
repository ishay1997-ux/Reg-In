// 🧭 **מ1 — מעטפת-הדוחות.** ארבע לשוניות · בורר-דוח · מסננים גלובליים · חמשת מצבי-המעטפת.
// זהו המשטח היחיד במודול שאין לו קובץ-מוקאפ משלו, **וזו הכרעה ולא פער** (§⑥.2, ישי 11/09):
// המעטפת מצוירת ארבע פעמים בארבעת המוקאפים המאושרים, וקובץ חמישי היה מראה אותו מסך בחמישית.
// ⇒ **מה שהבנייה קוראת עבורו: `design-contract §⑥` (השלד המלא) + §⑥.1 (ארבעת הבוררים) +
// כל אחד מארבעת המוקאפים.**
//
// 🔴 **המוקש האחד שהשלד נשא שגוי:** בורר-הדוח הוא **שורת-שבבים אופקית** ולא סרגל אנכי
// בן 220px — ר' `components/ReportChips.jsx`, שם הנימוק במלואו.
//
// 🔑 **חלוקת-הרשויות:** המעטפת מחזיקה מצב-כתובת, הרשאות, מסננים ומצבי-מעטפת — **ואינה
// יודעת דבר על תוכן דוח.** רכיב-הלשונית מקבל `{ surface, filters, drill, onDrill }` וקורא
// ל-`api.js` בעצמו. כך ארבעה סוכני-לשונית עובדים במקביל בלי לגעת בקובץ הזה.
//
// 🔴 **המיסוך: ממוסך ולא מוסתר** (הכרעה 2 · 15-ה · §4.2). לשונית שאין לה הרשאה נשארת על
// המסך באפור עם 🔒 ועם המשפט הגלוי *"לא זמין בתפקידך"*, ו-`role="tab"` נושא `aria-selected`
// **תמיד**. הסתרה הייתה משאירה את המשתמשת בלי לדעת שהיכולת קיימת.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { listCustomers } from '@/modules/02_customers/api'
import { MASKED_TEXT } from '@/lib/dashboard'
import { formatIsraelDate, formatWindowLabel } from '@/lib/reportsFormat'
import { cn } from '@/lib/utils'
import { ROW_DOOR_KINDS } from './api'
import { REPORT_TABS, canOpenTab, findSurface, findTab } from './reportsCatalog'
import Envelope from './components/Envelope'
import FiltersBar from './components/FiltersBar'
import { DEFAULT_PERIOD, parsePeriodParam, periodRange } from './reportsPeriod'
import ReportChips from './components/ReportChips'
import ExecutiveTab from './tabs/ExecutiveTab'
import FinanceTab from './tabs/FinanceTab'
import HostessesTab from './tabs/HostessesTab'
import CustomersTab from './tabs/CustomersTab'

const TAB_COMPONENTS = {
  exec: ExecutiveTab,
  finance: FinanceTab,
  hostesses: HostessesTab,
  customers: CustomersTab,
}

// 🔤 ת8 #5, מילה-במילה: תפקיד בלי אף לשונית מקבל **מסך עם ארבע לשוניות ממוסכות והודעה
// אחת** — לא מסך ריק ולא הפניה. הנוסח הוא של האפיון ואינו מנוסח מחדש.
export const NO_TABS_SENTENCE = 'אין דוחות זמינים בתפקידך — פנה למנכ"ל'

/**
 * 🚪 **מנתב-הדלתות של המעטפת — אחד לכל ארבע הלשוניות** (הכרעה 33 · הכרעה 19).
 *
 * 🔴 **הפגם שהוא סוגר, נמדד 16/09/2026:** ‏`onDrill` כתב *כל* ערך שקיבל אל `?drill=`, ולכן
 * יעד-אריח (`{tab, report, drill}`) ודלת-שורה (`{kind, id}`) נחתו שניהם כ**מצב-דריל** של
 * הדוח הנוכחי — כלומר נשלחו כ-`p_drill` לאותו RPC, וכלום לא ניווט לשום מקום *(נמדד: לחיצה
 * על "דיילות אדומות" נשארה על מ14)*. **שלוש משמעויות באותו callback, אחת מהן מיושמת.**
 *
 * ‏**שלושת הענפים, לפי סדר:**
 * ‏① `{tab, report}` ⇒ **דלת-משטח**, גם חוצת-לשונית: הכתובת מקבלת לשונית+דוח (+`drill`
 *    כשהיעד נושא רמה, כמו אריח *"מעל 60 יום"* של מ9 שנפתח בדלי `d90p`). **לשונית ממוסכת
 *    ⇒ לא קורה כלום** — ת8 אינו מתיר לעקוף מיסוך דרך אריח.
 * ‏② `{kind, id}` מתוך `ROW_DOOR_KINDS` ⇒ **ניווט אמיתי** למסך של הישות.
 * ‏③ כל השאר (`year`/`month`/`tier`/`bucket`/`sku`/פירור/`null`) ⇒ **מצב-דריל בכתובת**,
 *    בדיוק כפי שהיה.
 *
 * ⚠️ **ושתי מדידות שהמימוש נשען עליהן, ולא הנחות:**
 * ‏① `target.tab` הוא **התווית העברית** (`'כספים'`), לא ה-`key`. ⁦99⁩ מתוך ⁦99⁩ היעדים החיים.
 * ‏② `target.report` **אינו אחיד בין ה-RPC-ים**: מ2/מ7/מ9 מחזירים **שם-פונקציה**
 *    (`report_m09_aging`) ומ14/מ16/מ19 מחזירים **שם קצר בעברית** (`'גיול חובות'`).
 *    ⇒ המנתב מקבל את שניהם (וגם `slug`), **והפער מדווח כשאלת-חוזה** — לא מתוקן כאן.
 */
function locateDoor(next) {
  if (!next?.tab || !next?.report) return null
  const tab = REPORT_TABS.find((t) => t.label === next.tab || t.key === next.tab)
  if (!tab) return null
  const surface = tab.surfaces.find(
    (s) => s.rpc === next.report || s.name === next.report || s.slug === next.report,
  )
  // יעד שאינו בקטלוג (משטח נדחה, למשל) — **לא מנווטים לשום מקום** ולא זורקים.
  return surface ? { tab, surface, drill: next.drill ?? null } : null
}

/**
 * 🔗 **המסכים שדלת-שורה מובילה אליהם — נמדדו ב-`src/App.jsx`, לא הונחו.**
 * ‏`project` ⇒ `/projects/:id` · `customer` ⇒ `/customers/:customerId` — שני מסכים אמיתיים.
 * 🔴 **`hostess` הוא חצי-דלת, ומוצהר ככזה:** ל**כרטיס-הדיילת אין כתובת** — ‏`HostessesPage`
 * פותח אותו ממצב מקומי (`cardHostessId`), ולכן הלחיצה נוחתת על **מסך-הדיילות** ולא על
 * הכרטיס עצמו. הוספת `?hostess=<id>` היא נגיעה בקוד **מוזג של מודול 4** (אדווה + רגרסיה
 * מלאה שלו) ⇒ **פריט-המשך מדווח, לא תיקון שקט.**
 */
const DOOR_PATHS = Object.freeze({
  project: (id) => `/projects/${id}`,
  customer: (id) => `/customers/${id}`,
  hostess: () => '/hostesses',
})

function TabButton({ tab, active, masked, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      // 🔴 `aria-selected` **תמיד**, גם על הלשונית הממוסכת (הכרעה 15-ה) — ולא רק
      // `aria-disabled`. קורא-מסך שלא שומע "לא-נבחרת" שומע לשונית שבורה.
      aria-selected={active}
      aria-disabled={masked || undefined}
      title={masked ? MASKED_TEXT : undefined}
      onClick={masked ? undefined : () => onSelect(tab.key)}
      data-testid={`reports-tab-${tab.key}`}
      className={cn(
        '-mb-px flex flex-col items-center gap-0.5 border-b-2 px-4 py-2.5 text-sm',
        masked
          ? 'cursor-not-allowed border-transparent text-slate-400'
          : active
            ? 'border-teal-600 font-semibold text-teal-700'
            : 'border-transparent font-medium text-slate-500',
      )}
    >
      <span>
        {masked && (
          <span aria-hidden="true" className="ml-1">
            🔒
          </span>
        )}
        {tab.label}
      </span>
      {/* 🔤 המשפט **גלוי** בשורה שנייה ולא רק ב-`title` (הכרעה 15-ה) — ‏`title` לבדו אינו
          נגיש למקלדת, ועל כפתור מנוטרל הוא לא מוצג כלל. */}
      {masked && <span className="text-[10.5px] font-normal text-slate-400">{MASKED_TEXT}</span>}
    </button>
  )
}

function PageHeading({ surface, windowLabel }) {
  return (
    <div className="mb-3">
      {/* §⑤ #11 — `<h1>` **אמיתי ברמת-העמוד** לפני שהגרפים נטענים: סריקת-הנגישות ממתינה
          לו (`e2e/accessibility.spec.js`), וכותרת בתוך card אינה מספיקה. */}
      <h1 className="text-xl font-bold text-slate-800">{surface.name}</h1>
      {/* הכרעה 18 — השאלה היא **כותרת-המשנה** ולא התווית בבורר. */}
      <p className="mt-0.5 text-xs text-slate-500">{surface.question}</p>
      {/* 📐17 — התקופה בכותרת-המשנה של כל דף; היא משקרת ברגע שהמסנן זז אם אינה מוזרקת. */}
      <p className="mt-0.5 text-xs text-slate-500" data-testid="reports-window-label">
        {windowLabel}
      </p>
    </div>
  )
}

export default function ReportsPage() {
  const { permissions } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // ריענון ידני אחרי תקלה — אותו דפוס `reloadTick` בדיוק כמו `DashboardPage`.
  const [reloadTick, setReloadTick] = useState(0)
  // "היום" בשעון-ישראל, כפי שהשרת החזיר אותו (ר' הנימוק אצל `periodRange` למטה).
  const [serverToday, setServerToday] = useState(null)

  const openTabs = useMemo(
    () => REPORT_TABS.filter((tab) => canOpenTab(tab, permissions)),
    [permissions],
  )

  // רשימת-הלקוחות למסנן הגלובלי — דרך ה-api של מ2 (כלל-ברזל 14), **לא** `supabase.from`
  // מתוך רכיב.
  // 🔴 **מגבלה מוצהרת, ולא כשל שקט:** הקריאה גדורה ב-RLS על `'לקוחות'`, ולכן מנהלת-כספים
  // שאין לה הרשאה על 'לקוחות' תקבל **רשימה ריקה עם `error: null`** — בדיוק הכשל שמדריך-
  // המיקרו §4.3 מתאר. ⇒ הרשימה הריקה **אינה מסתירה את הבורר ואינה נקראת כתקלה**: הבורר
  // נשאר עם "כל הלקוחות" בלבד, וזו תשובה נכונה (הדוח רץ על כל הלקוחות). ⚠️ מה שהיא **כן**
  // אומרת הוא שסינון-לפי-לקוח אינו זמין לתפקיד הזה — ר' הדיווח, זה פריט להכרעה ולא לתיקון-
  // בשקט: הפתרון הנכון הוא רשימה שמגיעה מתוך ה-RPC המגודר של הדוח, ולא קריאת-טבלה שנייה.
  const [customers, setCustomers] = useState([])
  useEffect(() => {
    let cancelled = false
    listCustomers()
      .then((rows) => {
        if (!cancelled) setCustomers(rows ?? [])
      })
      .catch((err) => {
        // כשל-רשת כאן **אינו מפיל את הדוח** — המסנן הוא עזר, והמעטפת ממשיכה לעבוד בלעדיו.
        console.warn('reports: customer filter list failed to load', err)
        if (!cancelled) setCustomers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 🔴 **הכתובת היא מקור-האמת למצב-התצוגה** (📐13④ · S-18): לשונית · דף · מסננים · רמה ·
  // בחירה. "חזור" משחזר את הדוח במקום למחוק אותו, ו**קישור לדוח מסונן ניתן לשליחה**.
  function writeParams(patch) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === null || value === '') next.delete(key)
          else next.set(key, String(value))
        }
        return next
      },
      { replace: true },
    )
  }

  // 🔴 **המוקש של `src/CLAUDE.md`:** סטר-URL שמקבל פונקציה כותב את **גוף הפונקציה** ככתובת,
  // בשקט ובלי שגיאה (נשך ב-`CustomersPage` ב-30/07). ‏`resolveNext` הוא ההגנה, והיא חוזרת
  // כאן בדיוק כפי שהיא ב-`ProjectsPage`/`CustomersPage`.
  function resolveNext(valueOrFn, current) {
    return typeof valueOrFn === 'function' ? valueOrFn(current) : valueOrFn
  }

  // לשונית ברירת-מחדל = **הראשונה שהמשתמשת רשאית לפתוח**, לא "הנהלה" קשיח: מנהלת-הגיוס
  // הייתה נוחתת על מסך ממוסך בכל כניסה.
  const requestedTab = findTab(searchParams.get('tab'))
  const activeTab =
    requestedTab && canOpenTab(requestedTab, permissions) ? requestedTab : (openTabs[0] ?? null)

  const activeSurface = activeTab
    ? (findSurface(activeTab, searchParams.get('report')) ?? activeTab.surfaces[0])
    : null

  const period = parsePeriodParam(searchParams.get('period'))
  const customerId = searchParams.get('customer')
  // 🔴 **"היום" מגיע מהשרת ולעולם לא מ-`new Date()`** (מוקש-השעון, `src/CLAUDE.md`; התקדים
  // המלא ב-`07_dashboard/api.js`). ⇒ **הטעינה הראשונה שולחת `null`**, ה-RPC בוחר את
  // חלון-ברירת-המחדל של הכרטיס בשעון-ישראל ומחזיר אותו ב-`window` (C8), ומהרגע הזה
  // גלולות-התקופה נגזרות מול ה"היום" **שלו**.
  // ⚠️ **בלי זה המסנן היה תפאורה:** הגלולות היו משנות את הכתובת ושולחות `null` בכל מקרה.
  const { from, to } = periodRange(period, serverToday)

  const drillParam = searchParams.get('drill')
  const drill = useMemo(() => parseDrill(drillParam), [drillParam])

  const windowLabel = formatWindowLabel({ from, to })

  function setTab(value) {
    const next = resolveNext(value, activeTab?.key)
    // מעבר-לשונית מאפס דף, דריל ועמוד — דוח של לשונית אחרת אינו קיים בלשונית החדשה,
    // ורמת-דריל שנשארה הייתה נקראת כאילו היא של הדוח החדש.
    writeParams({ tab: next, report: undefined, drill: undefined, page: undefined })
  }

  function setReport(value) {
    const next = resolveNext(value, activeSurface?.slug)
    // 📐13④ — **כל דף נפתח בשורש**; מצב-הדריל חי בכתובת ואינו נגרר בין דוחות.
    writeParams({ report: next, drill: undefined, page: undefined })
  }

  // 🔑 **`isFiltered` הוא מה שמפריד בין שני מצבי-הריק** (§⑥, מצבים 2 ו-3): "ריק-אחרי-סינון"
  // מציע לנקות, "ריק-לגמרי" אומר שאין דאטה בכלל. ⚠️ **והמבחן אינו "האם `from` קיים"** —
  // אחרי שהשרת מסר את "היום", ל-`from` יש ערך כמעט תמיד. המבחן הוא **האם המשתמשת צמצמה
  // משהו**: לקוח שנבחר, או תקופה שאינה "הכול".
  const isFiltered = Boolean(customerId) || period !== 'all'
  // 🔴 **`useCallback` ולא חץ-אינליין — וזה לא ניקיון:** `onWindow` יושב במערך-התלויות של
  // ה-effect שקורא ל-RPC, ופונקציה חדשה בכל רינדור הייתה מייצרת **לולאת-קריאות אינסופית**.
  // (‏`exhaustive-deps` מסמן בדיוק את זה; השתקתו הייתה מסתירה את הלולאה, לא מונעת אותה.)
  const handleWindow = useCallback((serverWindow) => {
    // נקבע פעם אחת ליום-עבודה: השרת מהדהד את ה-`to` ששלחנו, ולכן אין כאן לולאה — אבל
    // ההשוואה מפורשת כדי שרינדור נוסף לא ייווצר על ערך זהה.
    const day = serverWindow?.to ?? null
    setServerToday((current) => (day && day !== current ? day : current))
  }, [])

  const filters = {
    period,
    from,
    to,
    customerId,
    windowLabel,
    reloadTick,
    isFiltered,
    clearFilters: () => writeParams({ period: 'all', customer: undefined }),
  }

  // 🚪 שלושת הענפים — ר' `locateDoor`/`DOOR_PATHS` למעלה.
  function openDoor(next) {
    if (next?.tab && next?.report) {
      const door = locateDoor(next)
      // 🚫 יעד שאינו בקטלוג (משטח נדחה · שם שהשתנה) ⇒ **לא מנווטים ולא כותבים מצב-זבל**;
      // בלי זה הוא היה נופל לענף ③ ונכתב כ-`?drill={"tab":…}` — אותה תקלה, כניסה אחרת.
      // ת8 — ומיסוך אינו נעקף דרך אריח: הדלת פשוט אינה נפתחת, בלי שגיאה ובלי ניווט-חצי.
      if (!door || !canOpenTab(door.tab, permissions)) return
      writeParams({
        tab: door.tab.key,
        report: door.surface.slug,
        drill: door.drill ? JSON.stringify(door.drill) : undefined,
        page: undefined,
      })
      // דלת פותחת **דף אחר** — והמשתמשת עומדת בגובה-הגלילה של הדף הקודם.
      // ⚠️ `?.()` על המתודה עצמה: ‏`scrollTo` אינו ממומש ב-jsdom (אותו תקדים מדויק כמו
      // `scrollIntoView` ב-`SalaryReportDialog.jsx:596`), ובלי זה כל בדיקת-דלת רועשת.
      window.scrollTo?.({ top: 0, behavior: 'smooth' })
      return
    }
    if (next?.id != null && ROW_DOOR_KINDS.includes(next.kind)) {
      navigate(DOOR_PATHS[next.kind](next.id))
      return
    }
    writeParams({ drill: next ? JSON.stringify(next) : undefined })
  }

  if (!activeTab) {
    return (
      <div data-testid="reports-page">
        {/* 🔴 **`<h1>` גם במצב הזה — נמדד חסר 16/09/2026 ותוקן.** ‏§⑤ #11: `waitForReady()`
            בסריקת-הנגישות ממתין ל-`<h1>` **גלוי** לפני שהסריקה רצה בכלל
            (`e2e/accessibility.spec.js`), ולכן דף בלי כותרת אינו "דף בלי כותרת" — הוא דף
            שסריקת-הנגישות נתקעת עליו. ⚠️ וזה בדיוק המצב של מנהלת-הלוגיסטיקה (ת8 #5),
            כלומר המסך היחיד שהיא רואה. השם מגיע מ-`BUSINESS_MODULES` ואינו מנוסח כאן. */}
        <h1 className="mb-4 text-xl font-bold text-slate-800">דו&quot;חות</h1>
        <TabsRow tabs={REPORT_TABS} activeKey={null} permissions={permissions} onSelect={setTab} />
        <Envelope state="blank" title={NO_TABS_SENTENCE} testId="reports-no-tabs" />
      </div>
    )
  }

  const TabComponent = TAB_COMPONENTS[activeTab.key]

  return (
    <div data-testid="reports-page">
      <TodayStamp today={serverToday} />
      <TabsRow
        tabs={REPORT_TABS}
        activeKey={activeTab.key}
        permissions={permissions}
        onSelect={setTab}
      />
      <ReportChips
        tabLabel={activeTab.label}
        surfaces={activeTab.surfaces}
        activeSlug={activeSurface.slug}
        onSelect={setReport}
      />
      <PageHeading surface={activeSurface} windowLabel={windowLabel} />
      <FiltersBar
        period={period}
        onPeriodChange={(next) =>
          writeParams({ period: next === DEFAULT_PERIOD ? undefined : next })
        }
        customers={customers}
        customerId={customerId}
        onCustomerChange={(next) => writeParams({ customer: next })}
      />
      {/* 🚫 **אין כאן `<Hint>`, ובכוונה.** ‏§2ב C3 מחייב שכל מפתח-הטמעה של מ11 **מועתק
          מטבלת §⑩ של הכרטיס**, ול-מ1 (המעטפת) אין כרטיס — היא המשטח היחיד בלי קובץ משלו
          (§⑥.2). מפתח מומצא היה מרנדר `null` בשקט בייצור (`spec.md §🚫.5`), כלומר קוד-מת
          שאף שער לא תופס. שכבת-ההטמעה נבנית בצעד 3.5, מהכרטיסים. */}
      <TabComponent
        surface={activeSurface}
        filters={filters}
        drill={drill}
        onDrill={openDoor}
        onWindow={handleWindow}
        onRetry={() => setReloadTick((t) => t + 1)}
      />
    </div>
  )
}

// ✏️ חותמת-"היום" (הכרעה 15-ז · §⑥ `.stamp`) — פינה שמאלית-עליונה, 11px, אפור.
// 🔴 **התאריך מגיע מהשרת** (`window.to`) ולעולם לא מ-`new Date()` — ר' `reportsPeriod.js`.
// ⚠️ ולכן היא **אינה מוצגת עד שהתשובה הראשונה חוזרת**: חותמת שמוצגת מהשעון המקומי הייתה
// מצהירה תאריך שאינו זה שהדוח נמדד בו, וזו בדיוק ההטעיה ש-📐22 קיים כדי למנוע.
function TodayStamp({ today }) {
  if (!today) return null
  return (
    <p className="mb-1 text-left text-[11px] text-slate-500" data-testid="reports-stamp">
      היום: {formatIsraelDate(today)}
    </p>
  )
}

function TabsRow({ tabs, activeKey, permissions, onSelect }) {
  return (
    <div
      className="-mx-4 mb-4 flex gap-1 border-b border-slate-200 px-4"
      role="tablist"
      aria-label="לשוניות דוחות"
      data-testid="reports-tabs"
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          tab={tab}
          active={tab.key === activeKey}
          masked={!canOpenTab(tab, permissions)}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// מצב-הדריל נוסע בכתובת כ-JSON (📐13④). ⚠️ **כתובת פגומה אינה מפילה מסך** — היא נקראת
// כשורש, בדיוק כמו ערך-לשונית זר שנופל ללשונית הראשונה (S-18).
function parseDrill(raw) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
