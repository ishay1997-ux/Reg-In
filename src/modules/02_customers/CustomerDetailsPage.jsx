// עמוד-לקוח (צעד 3.5, מודול 3) — החליף את `CustomerDetailsCard` שהיה חלון של 512px.
//
// למה עמוד ולא חלון (הכרעת-ישי 30/07/2026, LOCAL-13): חלון לא מכיל 30 הצעות, ובמודול 6
// יצטרפו לכאן גם כרטיסי-פרויקט. הקו המנחה שלו: "כל המידע שיש במערכת על הלקוח, מסודר,
// עם חיפוש וסינון נוחים". המבנה **הועתק מתבנית עמוד-הרשומה המקובלת ב-CRM** ולא הומצא:
// רצועת-הדגשים (4–6 שדות קריטיים-להחלטה) ⇒ פרטים מקובצים ⇒ לשוניות של רשימות-קשורות.
//
// ⚠️ שתי הרשאות נפרדות בעמוד אחד (LOCAL-15) — וזו לא קפדנות תיאורטית: מנהלת-כספים היא
// `edit` על 'לקוחות' אבל `view` בלבד על 'הצעות מחיר' (אומת מול המסד 30/07). שער יחיד לעמוד
// היה נותן לה לאשר ולדחות הצעות. ה-RLS חוסם אותה ממילא — ולכן שער יחיד לא היה "מקל",
// הוא היה גורם לכפתור לשקר (כלל ברזל 9: ה-UI הוא נוחות, המסד הוא החומה).

import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Eye, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import RowAction from '@/components/RowAction'
import RatingStars from '@/components/RatingStars'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import { WindowChips, Pager } from '@/components/ListWindow'
import {
  DEFAULT_WINDOW,
  PAGE_SIZE,
  filterByWindow,
  paginate,
  parsePageParam,
  parseWindowParam,
} from '@/lib/listWindow'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { CUSTOMER_TYPE_LABELS, deriveCustomerMetrics, primaryContact } from '@/lib/customers'
import { parseVatPercent } from '@/lib/pricing'
import { eventDaysFromToday, PROJECT_STATUS_LABELS, resolveProjectTone } from '@/lib/projects'
import {
  DORMANT_THRESHOLD_PARAM_NAME,
  cancellationSubLabel,
  cancelledCountNote,
  eventCountSummary,
  lastEventTileState,
  matchesProjectSearch,
  projectAmount,
  projectDaySentence,
  splitCustomerProjectsByTimeline,
} from '@/lib/customerProjects'
import {
  deriveQuoteAmount,
  matchesQuoteFilters,
  sortQuotes,
  QUOTE_ACTION_LABELS,
  QUOTE_REJECTED_TOAST,
  QUOTE_SCREEN_PARAM_NAMES,
  QUOTE_STATUS_LABELS,
  approvedQuotesLabel,
  pendingQuotesLabel,
  quoteApprovedToast,
} from '@/lib/quotes'
import {
  getCustomer,
  getCustomerProjects,
  getCustomerScreenParams,
  listCustomerContacts,
} from '@/modules/02_customers/api'
import {
  approveQuote,
  getPricingCatalog,
  getQuoteScreenParams,
  listQuotesByCustomer,
  rejectQuote,
} from '@/modules/03_quotes/api'
import { getSentEntityIds } from '@/api/email'
import { formatDate } from '@/modules/03_quotes/quotePdf'
import CustomerFormDialog from '@/modules/02_customers/CustomerFormDialog'
import QuoteDocumentDialog from '@/modules/03_quotes/QuoteDocumentDialog'
import ApproveQuoteDialog from '@/modules/03_quotes/ApproveQuoteDialog'
import RejectQuoteDialog from '@/modules/03_quotes/RejectQuoteDialog'

// מעל כמה הצעות מופיעים החיפוש והצ'יפים (הכרעת-ישי 30/07). מתחת לסף הם פקדים שאין להם
// מה לסנן — "אין תפקיד ⇒ נמחק" (src/CLAUDE.md, מעבר-המלאי). הסף הוא גם גובה-הגלילה בפועל.
const CONTROLS_THRESHOLD = 8

// תגיות-הסטטוס. 'פג תוקף' מקבל תגית **אפורה נפרדת** ולא אדומה כמו דחייה: המסמך התיישן,
// הלקוח לא אמר "לא". ההבחנה נגזרת מ-rejection_reason ולא מהסטטוס (שניהם 'rejected').
const EXPIRED_REASON = 'פג תוקף'

// מיוני לשונית-ההצעות (הכרעת-ישי 30/07). ⚠️ התוויות זהות-בייט למסך-הניהול במכוון — משתמש
// לא צריך ללמוד שני אוצרות-מילים לאותה פעולה. 'recent' הוא **סדר-השאילתה עצמו**
// (issue_date יורד + quote_id שובר-שוויון), ולכן הוא לא עובר דרך sortQuotes: מיון-מחדש
// היה מאבד את שובר-השוויון שדווקא הוא מה שהופך את הסדר לדטרמיניסטי.
const QUOTE_SORTS = [
  { key: 'recent', label: 'החדשות ראשונות' },
  { key: 'amount', label: 'סכום — מהגבוה' },
  { key: 'eventDate', label: 'תאריך האירוע — הקרוב' },
]

// שלוש התוויות נשאבות מ-QUOTE_STATUS_LABELS (`src/lib/quotes.js`), הבית הקנוני שנבדק שם
// מול ערכי ה-CHECK — ולא מוקלדות מחדש כמו עד 31/07/2026.
// ⚠️ **"פגה" נשאר ענף מקומי ואינו נכנס למפה המשותפת** — הוא אינו סטטוס אלא **סיבת-דחייה**
// (§7.41) שהעמוד הזה בלבד בחר להציג כתגית נפרדת. דחיפתו למפה הייתה משנה גם את מסך-הניהול,
// שם ההצעה הזו אמורה להיראות כ"נדחתה" ככל האחרות.
function statusPill(quote) {
  if (quote.quote_status === 'approved') {
    return { label: QUOTE_STATUS_LABELS.approved, className: 'bg-green-100 text-green-700' }
  }
  if (quote.quote_status === 'in_progress') {
    return { label: QUOTE_STATUS_LABELS.in_progress, className: 'bg-amber-100 text-amber-700' }
  }
  if (quote.rejection_reason === EXPIRED_REASON) {
    return { label: 'פגה', className: 'bg-slate-100 text-slate-600' }
  }
  return { label: QUOTE_STATUS_LABELS.rejected, className: 'bg-red-100 text-red-700' }
}

// אריח-המדד חולץ ל-`@/components/StatTile` (07/08/2026, הכרעת-ישי) — הוא היה מוגדר כאן
// ובנפרד ב-QuotesPage, והשניים סטו בפועל. ⛔ לא להחזיר הגדרה מקומית.

// שורת-פרט. התווית והערך נכתבים יחד בקומפוננטה אחת במכוון — שתי שורות שנכתבות בנפרד
// מתפצלות בשקט וכל תווית נוחתת מעל ערך של מישהו אחר (קרה שלוש פעמים; src/CLAUDE.md).
function Detail({ label, value, ltr }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-700 text-right" dir={ltr ? 'ltr' : undefined}>
        {value || '—'}
      </span>
    </div>
  )
}

// 🆕 שני חישובי-תצוגה של אריחי-מ6 (③.2), מחוץ לקומפוננטה בכוונה: הם מכניסים if/else-if
// ו-JSX-מותנה שהיו מנפחים את המורכבות-הקוגניטיבית של CustomerDetailsPage מעבר לסף (sonarjs).

// שלושת מצבי אריח "אירוע אחרון" (נספח ⑥ של המוקאפ) → {value, emptyText, sub} של StatTile.
// StatTile עצמו לא יודע להבחין בין "עדיין לא ידוע" ל"טרם התקיים אירוע" (שניהם value=null) —
// לכן ה-emptyText נקבע כאן, לפי ה-kind, לא לפי ברירת-המחדל הגנרית של הרכיב.
function lastEventTileDisplay(state) {
  if (!state) return { value: null }
  if (state.kind === 'neverHeld') {
    return {
      value: null,
      emptyText: 'טרם התקיים אירוע',
      sub: state.nextDate ? (
        <>
          הראשון מתוכנן ל-<Ltr>{formatDate(state.nextDate)}</Ltr>
        </>
      ) : undefined,
    }
  }
  return {
    value: <Ltr>{formatDate(state.date)}</Ltr>,
    sub: state.dormant ? (
      <span className="text-amber-700 font-semibold">{`רדום · לפני ${state.daysAgo} ימים`}</span>
    ) : (
      projectDaySentence(-state.daysAgo)
    ),
  }
}

// E3 (🟢 RULED 14/08): התווית משתנה ("סה"כ הצעות מאושרות"), החישוב לא — ומונה-הביטולים
// מצטרף לשורת-המשנה הקיימת כשיש כאלה. "לא בכוח": אין הרשאת-פרויקטים/עדיין נטען
// (`cancelledCount` undefined) ⇒ מציגים את מה שכן ידוע בלי מונה-הביטולים, לא מסתירים הכול.
function revenueTileSub(metrics, cancelledCount) {
  if (metrics.approvedCount <= 0) return 'טרם נסגרה עסקה'
  return [approvedQuotesLabel(metrics.approvedCount), cancelledCountNote(cancelledCount)]
    .filter(Boolean)
    .join(' · ')
}

// 🆕 שורת-המשנה של אריח-המשוב (מ8 · 4.2): **כמה** משובים עומדים מאחורי הממוצע. בלעדיה
// "5 ★" של משוב בודד נראה זהה ל-"5 ★" של שנים-עשר, וזו בדיוק ההטעיה ש-C6 §2.4.1 ("מאלה
// שענו") בא למנוע. 0 ⇒ אין שורה כלל — האריח ממילא מציג "אין נתונים עדיין" ("לא בכוח").
// לשון-יחיד/רבים כמו בכל המערכת (`cancelledCountNote`).
function feedbackCountNote(count) {
  if (!count) return undefined
  return count === 1 ? 'ממשוב אחד שהתקבל' : `מ-${count} משובים שהתקבלו`
}

// 🆕 מכנס את כל ה"מה ידוע על הפרויקטים כרגע" (③.2) למקום אחד מחוץ לקומפוננטה — שוב,
// מורכבות-קוגניטיבית: בלי זה שלושה תנאים-זהים (canView && !loading && !error) היו חוזרים
// בגוף-הרינדור עצמו במקום ליפול פעם אחת כאן.
function deriveProjectsTileData({
  canView,
  loading,
  error,
  projects,
  today,
  dormantThresholdDays,
}) {
  const known = canView && !loading && !error
  const eventStats = known ? eventCountSummary(projects) : null
  const lastEventState = known ? lastEventTileState(projects, today, dormantThresholdDays) : null
  return {
    tabCount: canView ? projects.length : '—',
    eventStats,
    lastEvent: lastEventTileDisplay(lastEventState),
  }
}

// 🆕 חלון-הזמן + הדפדוף המשותפים לשתי הלשוניות (04/09/2026, הכרעת-ישי) — מחוץ לקומפוננטה
// מאותה סיבה בדיוק כמו deriveProjectsTileData שמעליי: כל התנאים כאן (חלון → סינון-קיים →
// מיון → דפדוף, `src/CLAUDE.md`) הם גזירה טהורה בלי תלות ב-state, ומרוכזים כאן כדי
// ש-CustomerDetailsPage עצמה לא תיפול על סף-המורכבות-הקוגניטיבית (sonarjs).
function deriveWindowedListsState({
  quotes,
  projects,
  windowKey,
  today,
  tab,
  canViewProjects,
  showControls,
  statusFilter,
  searchText,
  sortKey,
  vatRate,
  projectsShowControls,
  projectSearchText,
  pageParam,
}) {
  // חלון-ההצעות: מוני-הלשונית (badge + צ'יפי-הסטטוס) סופרים **בתוך** החלון — אותו כלל
  // בדיוק כמו הספירה-בתוך-החיפוש שכבר הייתה כאן, ואותה מוסכמה כמו מסך-הניהול של מודול 3.
  const windowedQuotes = filterByWindow(quotes, (q) => q.estimated_event_date, windowKey, today)
  const counts = {
    all: windowedQuotes.length,
    in_progress: windowedQuotes.filter((q) => q.quote_status === 'in_progress').length,
    approved: windowedQuotes.filter((q) => q.quote_status === 'approved').length,
    rejected: windowedQuotes.filter((q) => q.quote_status === 'rejected').length,
  }
  function applyQuoteRowFilters(list) {
    return list.filter((q) => {
      if (!showControls) return true
      if (statusFilter !== 'all' && q.quote_status !== statusFilter) return false
      return matchesQuoteFilters(q, { text: searchText })
    })
  }
  const filteredQuotes = applyQuoteRowFilters(windowedQuotes)
  // "עוד N מחוץ לחלון" — שורות שעונות ללשונית+לסינון הקיים ורק החלון מסתיר אותן.
  const quotesHiddenByWindow = applyQuoteRowFilters(quotes).length - filteredQuotes.length
  // המשווה עצמו חי ב-`sortQuotes` (src/lib/quotes.js) ונבדק שם — אותו קוד בדיוק שמסך-הניהול
  // משתמש בו, כדי ששני המסכים לא יוכלו לסדר את אותן הצעות בסדר שונה.
  const visibleQuotes =
    sortKey === 'recent'
      ? filteredQuotes
      : sortQuotes(filteredQuotes, sortKey, { defaultVatRate: vatRate })
  const quotesPagination = paginate(visibleQuotes, pageParam, PAGE_SIZE)

  // חלון-הפרויקטים: אותו רעיון. tabCount (badge הלשונית) נגזר מהחלון ולא מכל ההיסטוריה.
  const windowedProjects = filterByWindow(projects, (p) => p.final_event_date, windowKey, today)
  const projectsTabCount = canViewProjects ? windowedProjects.length : '—'
  // החיפוש בלשונית-הפרויקטים הוא פר-לשונית (`matchesProjectSearch`) ומחושב כאן ולא בתוך
  // ProjectsTabContent, כדי ש-WindowChips היחיד שמעל שתי הלשוניות יידע להציג את "עוד N
  // מחוץ לחלון" הנכון גם כשהלשונית הפעילה היא 'projects'.
  function applyProjectRowFilters(list) {
    return projectsShowControls
      ? list.filter((p) => matchesProjectSearch(p, projectSearchText))
      : list
  }
  const projectsHiddenByWindow =
    applyProjectRowFilters(projects).length - applyProjectRowFilters(windowedProjects).length

  return {
    counts,
    visibleQuotes,
    quotesPagination,
    windowedProjects,
    projectsTabCount,
    hiddenByWindow: tab === 'projects' ? projectsHiddenByWindow : quotesHiddenByWindow,
  }
}

// 🆕 טעינת לשונית-הפרויקטים — מחוץ לקומפוננטה (מורכבות-קוגניטיבית, sonarjs) ומחוץ ל-effect
// (כך שהיא לא זקוקה לגישה ל-state; הקורא מחליט מה לעשות עם התוצאה). `projects: null`
// מסמן כשל (השאירי את הרשימה הישנה כמות שהיא; מסך-השגיאה מכסה אותה ממילא) ולעולם לא
// "אין הרשאה" ⇒ בקשה בכלל (screens-approved ⑤).
async function fetchProjectsTabState(canView, customerId) {
  if (!canView) return { projects: [], error: '' }
  try {
    const rows = await getCustomerProjects(customerId)
    return { projects: rows, error: '' }
  } catch (err) {
    return { projects: null, error: err.message || 'שגיאה בטעינת היסטוריית הפרויקטים.' }
  }
}

function Tab({ label, count, active, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm border-b-2 -mb-px transition-colors',
        active
          ? 'border-teal-600 text-teal-700 font-semibold'
          : 'border-transparent text-slate-500 font-medium hover:text-slate-700',
      )}
    >
      {label}
      <span
        dir="ltr"
        className={cn(
          'rounded-full px-2 text-xs font-semibold',
          active ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500',
        )}
      >
        {count}
      </span>
    </button>
  )
}

export default function CustomerDetailsPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { permissions } = useAuth()
  // ⚠️ שני שערים, לא אחד — ר' הערת-הפתיחה. מנהלת-כספים: edit כאן, view שם.
  const canEditCustomer = permissions['לקוחות'] === 'edit'
  const canEditQuotes = permissions['הצעות מחיר'] === 'edit'
  // 🆕 משטח 8 (מודול 6): הרשאה נקראת מ-AuthContext **לפני** מצב-ריק (screens-approved ⑤) —
  // אותו דפוס בדיוק כמו canReadHostesses/canReadCustomers ב-ProjectCardPage.jsx (מודול 6
  // עצמו). projects_select_by_permission מחזירה אפס-שורות-בלי-שגיאה למי שאין לו הרשאה, ובלי
  // הבדיקה הזו "אין הרשאה" היה נראה זהה ל"ריק כדין" — בדיוק המלכודת ש-⑤ אוסרת.
  const canViewProjects = ['edit', 'view'].includes(permissions['פרויקטים'])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [customer, setCustomer] = useState(null)
  // N2 (02/09/2026): נגזר פעם אחת מהאמבד ש-`getCustomer()` מביא. `customer` הוא null
  // עד שהטעינה מסתיימת, ולכן primaryContact מקבלת null בטוח ומחזירה null.
  const primaryCustomerContact = primaryContact(customer)
  const [contacts, setContacts] = useState([])
  const [quotes, setQuotes] = useState([])
  // ⚠️ **`null` = טרם ידוע, Set = נטען** (31/07/2026, אותה משפחה כמו חלון-המסמך). קבוצה ריקה
  // בכשל נקראת כ"אף הצעה לא נשלחה", והתווית "טרם נשלחה ללקוח" היא בדיוק הרמז שגורם לאדם
  // לפתוח את החלון ולשלוח — כלומר שקר-בביטחון שמוביל לשליחה כפולה, לא קישוט.
  const [sentIds, setSentIds] = useState(null)
  const [productsBySku, setProductsBySku] = useState({})
  const [params, setParams] = useState({})
  const [reloadTick, setReloadTick] = useState(0)

  // 🆕 היסטוריית-הפרויקטים (משטח 8) — state+טעינה נפרדים משאר העמוד, ר' ה-effect השני
  // למטה. אותו דפוס כמו sentIds: כשל/הרשאה כאן לא מפילים את שאר הכרטיס.
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const [projectsReloadTick, setProjectsReloadTick] = useState(0)
  const [projectSearchText, setProjectSearchText] = useState('')
  // "היום" מחושב פעם אחת (אתחול-עצל של useState, לא ב-render/useMemo — react-hooks/purity),
  // אותו דפוס כמו ProjectCardPage.jsx של מודול 6.
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const [tab, setTab] = useState('quotes')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('recent')
  // חלון-הזמן + הדפדוף חיים בכתובת (`?window=&page=`), לא ב-state — אותה מוסכמה כמו
  // CustomersPage.jsx ומסך-הניהול של מודול 3 (הכרעת-ישי 04/09/2026). שתי הלשוניות חולקות
  // חלון אחד וטופס-עמוד אחד: מעבר-לשונית הוא בעצמו "שינוי-מסנן" ומאפס את העמוד ל-1.
  const [searchParams, setSearchParams] = useSearchParams()

  const [editOpen, setEditOpen] = useState(false)
  const [documentQuote, setDocumentQuote] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const numericId = Number(customerId)

  const windowKey = parseWindowParam(searchParams.get('window'))
  const pageParam = parsePageParam(searchParams.get('page'))

  function stripPage(sp) {
    const next = new URLSearchParams(sp)
    next.delete('page')
    return next
  }

  // כל שינוי לשונית/חיפוש/מסנן/חלון מאפס את העמוד ל-1 (אותו כלל כמו מסך-הניהול של
  // מודול 3) — אחרת דפדוף עמוק בלשונית אחת נשאר תקוע כשעוברים ללשונית או לחיפוש אחר.
  function resetPage() {
    setSearchParams((prev) => stripPage(prev), { replace: true })
  }

  function goToPage(next) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next <= 1) p.delete('page')
        else p.set('page', String(next))
        return p
      },
      { replace: true },
    )
  }

  function handleWindowChange(key) {
    setSearchParams(
      (prev) => {
        const p = stripPage(prev)
        if (key === DEFAULT_WINDOW) p.delete('window')
        else p.set('window', key)
        return p
      },
      { replace: true },
    )
  }

  async function handleApprove() {
    await approveQuote(approveTarget.quote_id)
    setApproveTarget(null)
    toast.success(quoteApprovedToast(approveTarget.event_name))
    setReloadTick((t) => t + 1)
  }

  async function handleReject(reason, notes) {
    await rejectQuote(rejectTarget.quote_id, reason, notes)
    setRejectTarget(null)
    toast.success(QUOTE_REJECTED_TOAST)
    setReloadTick((t) => t + 1)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [c, cc, qs, paramRows, catalog, customerParamRows] = await Promise.all([
          getCustomer(numericId),
          listCustomerContacts(numericId),
          listQuotesByCustomer(numericId),
          getQuoteScreenParams(),
          getPricingCatalog(),
          // 🆕 סף-הרדימות (משטח 8) — לא בין שלושת פרמטרי-מסך-ההצעות, לכן שאילתה נפרדת.
          getCustomerScreenParams(),
        ])
        if (cancelled) return
        setCustomer(c)
        setContacts(cc)
        setQuotes(qs)
        setParams(
          Object.fromEntries(
            [...paramRows, ...customerParamRows].map((row) => [row.param_name, row.param_value]),
          ),
        )
        setProductsBySku(Object.fromEntries(catalog.products.map((prod) => [prod.sku, prod])))
        // יומן-השליחות נטען **אחרי** ההצעות כי הוא צריך את המזהים שלהן, וכשלון בו לא מפיל
        // את העמוד — אבל גם **אינו נבלע**: הוא מחזיר את המצב ל"לא ידוע", שני החיוויים
        // נעלמים והמשתמש מקבל שורת-הסבר במקומם.
        try {
          const ids = await getSentEntityIds(
            'quote',
            qs.map((row) => row.quote_id),
          )
          if (!cancelled) setSentIds(ids)
        } catch {
          if (!cancelled) setSentIds(null)
        }
        setLoadError('')
      } catch {
        if (!cancelled) setLoadError('שגיאה בטעינת כרטיס הלקוח.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [numericId, reloadTick])

  // 🆕 היסטוריית-הפרויקטים (משטח 8) — נפרדת מה-effect שמעל: כשל בה לא מפיל את כל הכרטיס
  // (לשונית 'הצעות' ממשיכה לעבוד), ולשונית 'פרויקטים' מקבלת שגיאה+'נסה שוב' משלה
  // (screens-approved §④). אין הרשאה נבדק **לפני** השליחה — לא רק לא-מציגים את התוצאה:
  // 0 שורות עם error:null הוא מצב-RLS תקין (⑨), ומיותר לבקש רק כדי לזרוק את התשובה.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setProjectsLoading(true)
      const result = await fetchProjectsTabState(canViewProjects, numericId)
      if (cancelled) return
      // projects=null ⇒ כשל; משאירים את הרשימה הקודמת ב-state, מסך-השגיאה מכסה אותה ממילא.
      if (result.projects !== null) setProjects(result.projects)
      setProjectsError(result.error)
      setProjectsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [numericId, canViewProjects, projectsReloadTick])

  // ‏parseVatPercent ולא ה-param_value הגולמי — אותו טיפוס בדיוק שמסך-ההצעות מעביר
  // (`QuotesPage.jsx`). שני מסכים שמעבירים טיפוסים שונים ל-prop אחד הם באג בהמתנה,
  // ובנוסף הפונקציה פוסלת ערך מחוץ ל-0–100 שהיה מגיע כמות-שהוא למסמך הלקוח.
  const vatRate = parseVatPercent(params[QUOTE_SCREEN_PARAM_NAMES.vatPercent])
  const validityDays = params[QUOTE_SCREEN_PARAM_NAMES.validityDays]
  const emailTemplate = params[QUOTE_SCREEN_PARAM_NAMES.quoteEmailTemplate]
  const metrics = deriveCustomerMetrics(projects, quotes, vatRate)

  if (loading) return <LoadingOrError loading />
  if (loadError) {
    return (
      <LoadingOrError
        error={loadError}
        onRetry={() => setReloadTick((t) => t + 1)}
        retryTestId="customer-page-retry"
      />
    )
  }
  // לקוח שאינו קיים **או** שה-RLS מסתיר — אותה חתימה בדיוק (getCustomer מחזיר null בשניהם).
  // הודעה מפורשת ולא מסך לבן: בחלון הישן היא הייתה, ואסור לאבד אותה במעבר לעמוד.
  if (!customer) {
    return (
      <div
        className="bg-white rounded-2xl shadow-md p-8 text-center"
        data-testid="customer-missing"
      >
        <p className="text-slate-600 mb-4">הלקוח לא נמצא.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/customers')}
          className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
        >
          חזרה לרשימת הלקוחות
        </Button>
      </div>
    )
  }

  const showControls = quotes.length > CONTROLS_THRESHOLD
  const projectsShowControls = projects.length > CONTROLS_THRESHOLD

  // 🆕 שני אריחי-המדד שמ6 מחבר (③.2) — `null` (ולא 0/תאריך מזויף) כל עוד הנתון אינו ידוע
  // בביטחון: אין הרשאה · עדיין נטען · טעינה נכשלה. "אין נתונים עדיין" עדיף על שקר.
  // ⚠️ eventStats/lastEvent נשארים על **כל** ההיסטוריה (לא בתוך החלון) — הם מדדי-לקוח
  // מצטברים ("מספר אירועים", "אירוע אחרון"), לא רשימה שהחלון אמור לקצר.
  const dormantThresholdDays = Number(params[DORMANT_THRESHOLD_PARAM_NAME])
  const { eventStats, lastEvent: lastEventDisplay } = deriveProjectsTileData({
    canView: canViewProjects,
    loading: projectsLoading,
    error: projectsError,
    projects,
    today,
    dormantThresholdDays,
  })
  const revenueSub = revenueTileSub(metrics, eventStats?.cancelledCount)

  // חלון-הזמן+הדפדוף חושבים מחוץ לקומפוננטה (`deriveWindowedListsState`, מתחת) — אותה
  // סיבה כמו `deriveProjectsTileData`: ריכוז המורכבות-הקוגניטיבית של כל התנאים האלה
  // בפונקציה טהורה אחת, כדי ש-CustomerDetailsPage עצמה תישאר קריאה (sonarjs).
  const {
    counts,
    visibleQuotes,
    quotesPagination,
    windowedProjects,
    projectsTabCount,
    hiddenByWindow,
  } = deriveWindowedListsState({
    quotes,
    projects,
    windowKey,
    today,
    tab,
    canViewProjects,
    showControls,
    statusFilter,
    searchText,
    sortKey,
    vatRate,
    projectsShowControls,
    projectSearchText,
    pageParam,
  })

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 w-fit"
        data-testid="customer-page-back"
      >
        <ArrowRight className="size-4" />
        חזרה לרשימת הלקוחות
      </button>

      <div className="bg-white rounded-2xl shadow-md" data-testid="customer-page">
        {/* ---- כותרת + פעולות ---- */}
        <div className="p-6 pb-0 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">{customer.company_name}</h2>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                customer.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {customer.status === 'active' ? 'פעיל' : 'בארכיון'}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {CUSTOMER_TYPE_LABELS[customer.customer_type] ?? customer.customer_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canEditQuotes && (
              <Button
                type="button"
                onClick={() => navigate(`/quotes/new?customerId=${customer.customer_id}`)}
                className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700"
                data-testid="customer-new-quote"
              >
                <Plus className="size-4" />
                הצעה חדשה
              </Button>
            )}
            {canEditCustomer && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
                data-testid="customer-edit"
              >
                <Pencil className="size-4" />
                עריכת פרטים
              </Button>
            )}
          </div>
        </div>

        {/* ---- רצועת-הדגשים: שלושת הקיימים (מ2/מ3) + שני שמ6 מחבר (LOCAL-14, ③.2) ---- */}
        <div className="flex flex-wrap gap-3 p-6 pb-0">
          {/* E3 (🟢 RULED 14/08): התווית משתנה מ"סה"כ הכנסות" ל"סה"כ הצעות מאושרות" בשני
              המקומות שהיא מוצגת (כאן וב-CustomersPage) — החישוב עצמו לא זז. הצעה מאושרת
              נספרת גם כשהפרויקט שנולד ממנה בוטל, ומונה-הביטולים מסביר את זה בשורת-המשנה. */}
          <StatTile
            label={'סה"כ הצעות מאושרות'}
            value={metrics.totalRevenue}
            sub={revenueSub}
            testId="metric-revenue"
          />
          <StatTile
            label="שווי הצעות פתוחות"
            value={metrics.openQuotesValue}
            sub={pendingQuotesLabel(counts.in_progress)}
            testId="metric-open"
          />
          <StatTile
            label="גודל עסקה ממוצע"
            value={metrics.avgDealSize}
            sub={metrics.avgDealSize == null ? 'אין עסקאות סגורות' : undefined}
            testId="metric-avg-deal"
          />
          {/* 🆕 מ6 · מדד 1 מתוך 2. 🔴 מוקש-מוקאפ: StatTile מעביר ערך מספרי דרך Money —
              value={4} היה מוצג "4 ₪". "מספר אירועים" עובר כמחרוזת. */}
          <StatTile
            label="מספר אירועים"
            value={eventStats ? String(eventStats.count) : null}
            sub={eventStats ? cancelledCountNote(eventStats.cancelledCount) : undefined}
            testId="metric-event-count"
          />
          {/* 🆕 מ6 · מדד 2 מתוך 2 — שלושת מצביו (נספח ⑥ של המוקאפ) ב-lastEventTileDisplay. */}
          <StatTile
            label="אירוע אחרון"
            value={lastEventDisplay.value}
            emptyText={lastEventDisplay.emptyText}
            sub={lastEventDisplay.sub}
            testId="metric-last-event"
          />
          {/* 🆕 מ8 · צעד 4.2 — האריח החמישי, זה שהיה "ממתין למודול הבא". ה8/§7.79:
              הממוצע רץ על בעלי `feedback_status='completed'` **בלבד** ("מאלה שענו"), והסינון
              עצמו חי ב-`deriveCustomerMetrics` (כלל 14) ולא כאן.
              🔴 `variant="compact"` ולא הגליפים: הערך הוא **ממוצע** (4.5), וחמישה גליפים
              יודעים לצייר רק מספר שלם — 4.5 היה נצבע כחמישה כוכבים מלאים, כלומר "מצוין"
              על לקוח שאינו. הצורה הדחוסה `4.5 ★` מבודדת-כיווניות דרך `Ltr` (RatingStars). */}
          <StatTile
            label="ממוצע משוב"
            value={
              metrics.avgFeedback == null ? null : (
                <RatingStars
                  value={metrics.avgFeedback}
                  variant="compact"
                  testId="metric-feedback-stars"
                />
              )
            }
            sub={feedbackCountNote(metrics.feedbackCount)}
            testId="metric-feedback"
          />
        </div>

        {/* ---- פרטים מקובצים ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-6">
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold text-slate-400">פרטי חברה</h3>
            <Detail label={'ח"פ'} value={customer.company_number} ltr />
            <Detail
              label="סוג לקוח"
              value={CUSTOMER_TYPE_LABELS[customer.customer_type] ?? customer.customer_type}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold text-slate-400">איש קשר</h3>
            {/* N2 (02/09/2026): הראשי הוא שורת `customer_contacts` עם `is_primary`, לא עמודה
                על `customers`. `getCustomer()` מביא את האמבד; primaryContact בוחרת. */}
            <Detail label="שם" value={primaryCustomerContact?.contact_name} />
            <Detail label="טלפון" value={primaryCustomerContact?.phone} ltr />
            <Detail label="אימייל" value={primaryCustomerContact?.email} ltr />
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold text-slate-400">מסחרי</h3>
            <Detail label="אחוז הנחה קבוע" value={`${Number(customer.discount_percent ?? 0)}%`} />
            <Detail label="מאושר לדיוור" value={customer.marketing_consent ? 'כן' : 'לא'} />
          </div>
        </div>

        {/* אנשי-קשר נוספים (§7.81) — מוצגים רק כשקיימים; היום הטבלה ריקה בפועל. */}
        {contacts.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">אנשי קשר נוספים</h3>
            <div className="flex flex-col gap-2">
              {contacts.map((cc) => (
                <div
                  key={cc.contact_id}
                  className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <span className="font-medium text-slate-700">{cc.contact_name}</span>
                  <span className="text-slate-600 text-right" dir="ltr">
                    {cc.phone || '—'}
                  </span>
                  <span className="text-slate-600 text-right" dir="ltr">
                    {cc.email || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* חלון-הזמן — מופע יחיד מעל שתי הלשוניות (הכרעת-ישי 04/09/2026): שתיהן מציגות
            היסטוריה שגדלה, וחלון אחד שחל על שתיהן חוסך מהמשתמש ללמוד שני פקדים זהים. */}
        <div className="px-6 pt-4">
          <WindowChips
            value={windowKey}
            onChange={handleWindowChange}
            hiddenCount={hiddenByWindow}
          />
        </div>

        {/* ---- לשוניות ---- */}
        <div className="flex border-b border-slate-200 px-6">
          <Tab
            label="הצעות מחיר"
            count={counts.all}
            active={tab === 'quotes'}
            onClick={() => {
              setTab('quotes')
              resetPage()
            }}
            testId="customer-tab-quotes"
          />
          <Tab
            // 🔴 המונה מציג '—' ולא 0 כשאין הרשאה — 0 הוא שקר על הדאטה (screens-approved ④/⑤).
            label="פרויקטים"
            count={projectsTabCount}
            active={tab === 'projects'}
            onClick={() => {
              setTab('projects')
              resetPage()
            }}
            testId="customer-tab-projects"
          />
        </div>

        <div className="p-6">
          {tab === 'projects' ? (
            <ProjectsTabContent
              canView={canViewProjects}
              loading={projectsLoading}
              error={projectsError}
              onRetry={() => setProjectsReloadTick((t) => t + 1)}
              projects={windowedProjects}
              today={today}
              vatRate={vatRate}
              searchText={projectSearchText}
              onSearchTextChange={(value) => {
                setProjectSearchText(value)
                resetPage()
              }}
              page={pageParam}
              onPage={goToPage}
            />
          ) : quotes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8" data-testid="customer-no-quotes">
              אין הצעות מחיר ללקוח הזה
            </p>
          ) : (
            <>
              {/* יומן-השליחות לא נטען: שני החיוויים ("נשלחה"/"טרם נשלחה") נעלמים, וזה נאמר
                  במקומם. בלי השורה הזו היעלמותם הייתה נקראת כ"אין מידע כזה בכלל". */}
              {sentIds === null && (
                <p
                  className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 mb-3 text-[13px] text-amber-800"
                  role="alert"
                  data-testid="customer-sent-history-error"
                >
                  לא ניתן היה לבדוק אילו הצעות כבר נשלחו ללקוח — בדקו בחלון המסמך לפני שליחה.
                </p>
              )}
              {showControls && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <input
                    type="search"
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value)
                      resetPage()
                    }}
                    placeholder="חיפוש לפי שם אירוע"
                    data-testid="customer-quotes-search"
                    className="h-9 w-64 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                  />
                  {[
                    ['all', 'הכל'],
                    ['in_progress', 'בתהליך'],
                    ['approved', 'מאושרות'],
                    ['rejected', 'נדחו'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(key)
                        resetPage()
                      }}
                      aria-pressed={statusFilter === key}
                      data-testid={`customer-quotes-chip-${key}`}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        statusFilter === key
                          ? 'border-teal-300 bg-teal-50 text-teal-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {label} <span dir="ltr">{counts[key]}</span>
                    </button>
                  ))}
                  {/* מיון — הפקד האחרון, נדחף לקצה. mr-auto ב-RTL דוחף שמאלה (אותה תבנית
                      כמו במסך-הניהול), ובניגוד ל-flex-1 הוא אינו כופה שבירת-שורה. */}
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    aria-label="מיון"
                    data-testid="customer-quotes-sort"
                    className="mr-auto h-[34px] shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
                  >
                    {QUOTE_SORTS.map((s) => (
                      <option key={s.key} value={s.key}>
                        מיון: {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {visibleQuotes.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">אין הצעות התואמות לסינון</p>
              ) : (
                <>
                  <div
                    className={cn(
                      'rounded-xl border border-slate-100',
                      showControls && 'max-h-[340px] overflow-y-auto',
                    )}
                  >
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-slate-500">
                          <th className="text-right font-medium py-2.5 px-3">תאריך אירוע</th>
                          <th className="text-right font-medium py-2.5 px-3">שם האירוע</th>
                          <th className="text-right font-medium py-2.5 px-3">סכום</th>
                          <th className="text-right font-medium py-2.5 px-3">סטטוס</th>
                          <th className="py-2.5 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {quotesPagination.pageRows.map((quote) => {
                          const pill = statusPill(quote)
                          const { total, discountPercent } = deriveQuoteAmount(quote, vatRate)
                          const isOpen = quote.quote_status === 'in_progress'
                          return (
                            <tr
                              key={quote.quote_id}
                              className="border-t border-slate-100"
                              data-testid={`customer-quote-${quote.quote_id}`}
                            >
                              {/* ⚠️ אותו formatDate שמסך-הניהול וה-PDF ללקוח משתמשים בו.
                                תאריך ISO גולמי ('2026-10-25') נראה תקין אבל הוא פורמט אחר
                                מהמסמך שהלקוח מקבל — ושני פורמטים לאותו תאריך באותה מערכת
                                הם בדיוק סוג חוסר-האחידות שמעבר-האחידות נועד לתפוס. */}
                              <td
                                className="py-2.5 px-3 text-sm text-slate-600 text-right"
                                dir="ltr"
                              >
                                {formatDate(quote.estimated_event_date)}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-sm font-medium text-slate-700">
                                  {quote.event_name}
                                </div>
                                {discountPercent > 0 && (
                                  <div className="text-[11.5px] text-slate-500">
                                    אחרי {discountPercent}% הנחה
                                  </div>
                                )}
                                {/* סיבת-הדחייה **חייבת** להיות כאן: כפתור-העין פותח את ה-PDF,
                                  שהוא המסמך שהלקוח מקבל — ואין בו (ונכון שאין) סיבת-דחייה.
                                  יוצא-דופן 'פג תוקף': התגית האפורה "פגה" כבר אומרת זאת,
                                  ושורה מתחתיה הייתה אותו מידע פעמיים. */}
                                {quote.quote_status === 'rejected' &&
                                  quote.rejection_reason &&
                                  quote.rejection_reason !== EXPIRED_REASON && (
                                    <div className="text-[11.5px] text-slate-500">
                                      סיבת דחייה: {quote.rejection_reason}
                                    </div>
                                  )}
                                {/* כן/לא בלי תאריך (LOCAL-16) — ורק על הצעה פתוחה, שבה זו עדיין
                                  פעולה שאפשר לעשות. על הצעה סגורה זו כבר לא שאלה פתוחה. */}
                                {sentIds && isOpen && !sentIds.has(quote.quote_id) && (
                                  <div className="text-[11.5px] text-amber-600">
                                    טרם נשלחה ללקוח
                                  </div>
                                )}
                                {sentIds?.has(quote.quote_id) && (
                                  <div className="text-[11.5px] text-teal-700">נשלחה ללקוח</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-sm text-slate-700">
                                {total == null ? '—' : <Money amount={total} />}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={cn(
                                    'inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold',
                                    pill.className,
                                  )}
                                >
                                  {pill.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex gap-1.5 justify-start">
                                  {canEditQuotes && isOpen && (
                                    <RowAction
                                      title={QUOTE_ACTION_LABELS.edit}
                                      onClick={() => navigate(`/quotes/${quote.quote_id}/edit`)}
                                      testId={`customer-quote-edit-${quote.quote_id}`}
                                    >
                                      <Pencil className="size-4" />
                                    </RowAction>
                                  )}
                                  <RowAction
                                    title={QUOTE_ACTION_LABELS.view}
                                    onClick={() => setDocumentQuote(quote)}
                                    testId={`customer-quote-document-${quote.quote_id}`}
                                  >
                                    <Eye className="size-4" />
                                  </RowAction>
                                  {canEditQuotes && isOpen && (
                                    <>
                                      <RowAction
                                        title={QUOTE_ACTION_LABELS.approve}
                                        tone="approve"
                                        onClick={() => setApproveTarget(quote)}
                                        testId={`customer-quote-approve-${quote.quote_id}`}
                                      >
                                        <Check className="size-4" />
                                      </RowAction>
                                      <RowAction
                                        title={QUOTE_ACTION_LABELS.reject}
                                        tone="reject"
                                        onClick={() => setRejectTarget(quote)}
                                        testId={`customer-quote-reject-${quote.quote_id}`}
                                      >
                                        <X className="size-4" />
                                      </RowAction>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pager
                    page={quotesPagination.page}
                    pageCount={quotesPagination.pageCount}
                    from={quotesPagination.from}
                    to={quotesPagination.to}
                    total={quotesPagination.total}
                    onPage={goToPage}
                    testId="customer-quotes-pager"
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* טופס-הלקוח של מודול 2, נצרך כמות-שהוא. remount לפי מצב-הפתיחה = איפוס בלי effect. */}
      {canEditCustomer && (
        <CustomerFormDialog
          key={`edit-${customer.customer_id}-${editOpen}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          editingCustomer={customer}
          customers={[]}
          onSaved={() => {
            setEditOpen(false)
            setReloadTick((t) => t + 1)
          }}
        />
      )}

      {/* ⚠️ canEdit=false במכוון: שליחת ההצעה במייל נעשית ממסך ההצעות, לא מכרטיס הלקוח —
          כאן ההקשר הוא "מה עשינו עם הלקוח הזה", לא "לשלוח לו עכשיו".
          ⚠️ ה-PDF זקוק ל-customers (לכבוד + ח"פ), ו-listQuotesByCustomer אינה מצרפת אותו —
          לכן הלקוח שכבר נטען מוזרק פנימה, אותה תבנית כמו formToPreviewQuote. */}
      <QuoteDocumentDialog
        key={`document-${documentQuote?.quote_id ?? 'none'}`}
        open={documentQuote != null}
        onOpenChange={(o) => !o && setDocumentQuote(null)}
        quote={documentQuote ? { ...documentQuote, customers: customer } : null}
        productsBySku={productsBySku}
        vatRate={vatRate}
        validityDays={validityDays}
        emailTemplate={emailTemplate}
        canEdit={false}
      />
      {/* ⚠️ שני החלונות מקבלים `onConfirm` שמבצע את הקריאה בעצמו (ומותר לו לזרוק — המעטפת
          המשותפת מציגה את השגיאה באותו מקום שבו תוצג שגיאת-ולידציה). זהו החוזה בדיוק כמו
          במסך-הניהול; העתקת חוזה שגוי כאן הייתה מפילה את הכפתור בלי שגיאת-בנייה. */}
      <ApproveQuoteDialog
        key={`approve-${approveTarget?.quote_id ?? 'none'}`}
        open={approveTarget != null}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        quote={approveTarget}
        amount={approveTarget ? deriveQuoteAmount(approveTarget, vatRate).total : null}
        onConfirm={handleApprove}
      />
      <RejectQuoteDialog
        key={`reject-${rejectTarget?.quote_id ?? 'none'}`}
        open={rejectTarget != null}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        quote={rejectTarget}
        onConfirm={handleReject}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// לשונית-הפרויקטים (משטח 8, מודול 6 על מסך מודול 2) — קומפוננטות-משנה, אותה מוסכמה
// כמו Detail/Tab למעלה: קטנות, מקומיות לקובץ הזה, לא מיוצאות.
// ══════════════════════════════════════════════════════════════════════════

// שישה מצבים (screens-approved §④ + נספח-המוקאפ): אין-הרשאה · טעינה · שגיאה · ריק-אמיתי ·
// ריק-אחרי-חיפוש · תוכן (שני קטעים). הסדר כאן *הוא* סדר-העדיפות — הרשאה נבדקת ראשונה.
function ProjectsTabContent({
  canView,
  loading,
  error,
  onRetry,
  projects,
  today,
  vatRate,
  searchText,
  onSearchTextChange,
  page,
  onPage,
}) {
  // 🔒 אין הרשאה — לא "אין פרויקטים". נבדק ראשון, לפני טעינה/שגיאה: מי שחסום לא ממתין
  // לתשובת-רשת כדי לגלות שאין לו הרשאה (screens-approved ⑤).
  if (!canView) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-8 text-center"
        data-testid="customer-projects-no-permission"
      >
        <span aria-hidden="true" className="text-2xl">
          🔒
        </span>
        <p className="text-sm text-slate-500">אין לך הרשאה לצפות בפרויקטים.</p>
      </div>
    )
  }

  if (loading) {
    return <LoadingOrError loading skeleton={{ variant: 'table' }} />
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-8 text-center"
        role="alert"
        data-testid="customer-projects-error"
      >
        {/* הנוסח כבר קיים מילולית ב-02_customers/api.js (הודעת getCustomerProjects) —
            לא מנוסח מחדש (screens-approved §④). */}
        <p className="text-red-600 font-semibold">שגיאה בטעינת היסטוריית הפרויקטים.</p>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
          data-testid="customer-projects-retry"
        >
          נסה שוב
        </Button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400 py-8" data-testid="customer-no-projects">
        עדיין לא נוצר פרויקט ללקוח הזה.
        <br />
        פרויקט נולד מאישור הצעת מחיר.
      </p>
    )
  }

  // מעל 8 פרויקטים בלבד (⑥, אותו CONTROLS_THRESHOLD שהלשונית-השכנה כבר משתמשת בו) —
  // ומתחת לסף החיפוש גם **לא מסנן** (אותה מלכודת המתועדת בלשונית-ההצעות).
  const showControls = projects.length > CONTROLS_THRESHOLD
  const filtered = showControls
    ? projects.filter((proj) => matchesProjectSearch(proj, searchText))
    : projects
  // ⚠️ הדפדוף חל על הרשימה הממוזגת (לפני הפיצול ל"מתקרבים"/"התקיימו") ולא על כל קטע
  // בנפרד — אחרת "עמוד 2" היה אומר משהו שונה בכל קטע. המשמעות: קטע יכול להציג רק חלק
  // מהשורות שלו בעמוד נתון; "N מתוך M" ב-Pager מתאר את הרשימה כולה, לא קטע בודד.
  const projectsPagination = paginate(filtered, page, PAGE_SIZE)
  const { upcoming, happened } = splitCustomerProjectsByTimeline(projectsPagination.pageRows, today)

  return (
    <div className="flex flex-col gap-4">
      {showControls && (
        <input
          type="search"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="חיפוש לפי שם אירוע"
          data-testid="customer-projects-search"
          className="h-9 w-64 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
        />
      )}

      {showControls && filtered.length === 0 ? (
        // ריק-אחרי-חיפוש — הפוך מריק-אמיתי: יש נתונים, אין התאמה. 🔴 "חיפוש" ולא "סינון"
        // (§3.7): המשטח הזה מסנן בתיבת-טקסט, לא בגלולות, כמו שאר שבעת המשטחים.
        <p
          className="text-center text-sm text-slate-400 py-8"
          data-testid="customer-projects-no-results"
        >
          אין פרויקט התואם לחיפוש.{' '}
          <button
            type="button"
            onClick={() => onSearchTextChange('')}
            className="text-teal-700 hover:text-teal-800 font-semibold"
            data-testid="customer-projects-clear-search"
          >
            נקה חיפוש
          </button>
        </p>
      ) : (
        <>
          {/* קטע ריק אינו מוצג כלל (④) — כותרת מעל אפס שורות היא רעש; אם הפילטר-אחר-חיפוש
              הותיר קטע אחד ריק, הוא פשוט נעלם, לא "0 תוצאות". */}
          {upcoming.length > 0 && (
            <ProjectsSection
              title="מתקרבים"
              definition="תאריך האירוע טרם עבר · הקרוב ראשון"
              rows={upcoming}
              today={today}
              vatRate={vatRate}
            />
          )}
          {happened.length > 0 && (
            <ProjectsSection
              title="התקיימו"
              definition="תאריך האירוע עבר, או שהפרויקט בוטל · האחרון ראשון · המבוטלים בסוף"
              rows={happened}
              today={today}
              vatRate={vatRate}
            />
          )}
          <Pager
            page={projectsPagination.page}
            pageCount={projectsPagination.pageCount}
            from={projectsPagination.from}
            to={projectsPagination.to}
            total={projectsPagination.total}
            onPage={onPage}
            testId="customer-projects-pager"
          />
        </>
      )}
    </div>
  )
}

function ProjectsSection({ title, definition, rows, today, vatRate }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 flex-wrap pb-1.5">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        {/* דרך <Ltr> ולא dir="ltr" גולמי — אותה מוסכמת-בידוד כמו בכל מונה-מספר במערכת. */}
        <Ltr className="text-xs font-semibold text-slate-500">{rows.length}</Ltr>
        <span className="text-[11.5px] text-slate-400">· {definition}</span>
      </div>
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="text-right font-medium py-2.5 px-3">תאריך אירוע</th>
              <th className="text-right font-medium py-2.5 px-3">שם האירוע</th>
              <th className="text-right font-medium py-2.5 px-3">סכום</th>
              <th className="text-right font-medium py-2.5 px-3">מצב</th>
              <th className="py-2.5 px-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((project) => (
              <ProjectRow
                key={project.project_id}
                project={project}
                today={today}
                vatRate={vatRate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// שורה לחיצה כולה (①) — "לכרטיס →" הוא אותו יעד בדיוק, החיווי הגלוי שהשורה לחיצה.
// 🔴 היעד קיים כבר כקומפוננטה (ProjectCardPage.jsx, מ6 בנתה אותה בצעדים 3.0-3.7) — רק
// ניתוב-הכתובת חסר עד צעד 4.1. הקישור מרונדר כבר עכשיו לפי הנחיית-הבנייה של הצעד הזה;
// ר' דוח-המסירה לניגוד מול screens-approved ⑨ ("קישור ל-404 אינו אפשרות").
function ProjectRow({ project, today, vatRate }) {
  const navigate = useNavigate()
  const isCancelled = project.project_status === 'cancelled'
  const amount = projectAmount(project, vatRate)
  const label = PROJECT_STATUS_LABELS[project.project_status]
  const days = eventDaysFromToday(project.final_event_date, today)
  const href = `/projects/${project.project_id}`

  function goToCard() {
    navigate(href)
  }

  return (
    <tr
      className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      onClick={goToCard}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToCard()
        }
      }}
      aria-label={`פתח כרטיס פרויקט: ${project.event_name}`}
      data-testid={`customer-project-${project.project_id}`}
    >
      <td className="py-2.5 px-3 text-sm text-slate-600">
        <div className="text-right">
          <Ltr>{formatDate(project.final_event_date)}</Ltr>
        </div>
        <div className="text-[11.5px] text-slate-400">
          {/* 🔴 ㊲: מבוטל תמיד מציג "היה אמור להתקיים" — לא ספירת-ימים, גם אם תאריכו עתידי. */}
          {isCancelled ? 'היה אמור להתקיים' : projectDaySentence(days)}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="text-sm font-medium text-slate-700">{project.event_name}</div>
        {isCancelled && (
          <div className="text-[11.5px] text-slate-500">{cancellationSubLabel(project)}</div>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm text-slate-700">
        {amount == null ? '—' : <Money amount={amount} />}
      </td>
      <td className="py-2.5 px-3">
        {/* הטון דרך resolveProjectTone — שצועק על תווית לא-ממופה במקום להאפיר בשקט
            (אותו דפוס כמו ProjectsPage.jsx של מודול 6 עצמו). */}
        <StatusTag label={label} tone={resolveProjectTone(label)} />
      </td>
      <td className="py-2.5 px-3">
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goToCard()
          }}
          className="text-teal-700 hover:text-teal-800 text-[12.5px] font-semibold whitespace-nowrap"
          data-testid={`customer-project-link-${project.project_id}`}
        >
          לכרטיס →
        </a>
      </td>
    </tr>
  )
}
