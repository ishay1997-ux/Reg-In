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
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Eye, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Money from '@/components/Money'
import RowAction from '@/components/RowAction'
import StatTile from '@/components/StatTile'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { CUSTOMER_TYPE_LABELS, deriveCustomerMetrics } from '@/lib/customers'
import { parseVatPercent } from '@/lib/pricing'
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
import { getCustomer, getCustomerProjects, listCustomerContacts } from '@/modules/02_customers/api'
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

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [customer, setCustomer] = useState(null)
  const [projects, setProjects] = useState([])
  const [contacts, setContacts] = useState([])
  const [quotes, setQuotes] = useState([])
  // ⚠️ **`null` = טרם ידוע, Set = נטען** (31/07/2026, אותה משפחה כמו חלון-המסמך). קבוצה ריקה
  // בכשל נקראת כ"אף הצעה לא נשלחה", והתווית "טרם נשלחה ללקוח" היא בדיוק הרמז שגורם לאדם
  // לפתוח את החלון ולשלוח — כלומר שקר-בביטחון שמוביל לשליחה כפולה, לא קישוט.
  const [sentIds, setSentIds] = useState(null)
  const [productsBySku, setProductsBySku] = useState({})
  const [params, setParams] = useState({})
  const [reloadTick, setReloadTick] = useState(0)

  const [tab, setTab] = useState('quotes')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('recent')

  const [editOpen, setEditOpen] = useState(false)
  const [documentQuote, setDocumentQuote] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const numericId = Number(customerId)

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
        const [c, p, cc, qs, paramRows, catalog] = await Promise.all([
          getCustomer(numericId),
          getCustomerProjects(numericId),
          listCustomerContacts(numericId),
          listQuotesByCustomer(numericId),
          getQuoteScreenParams(),
          getPricingCatalog(),
        ])
        if (cancelled) return
        setCustomer(c)
        setProjects(p)
        setContacts(cc)
        setQuotes(qs)
        setParams(Object.fromEntries(paramRows.map((row) => [row.param_name, row.param_value])))
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

  const counts = {
    all: quotes.length,
    in_progress: quotes.filter((q) => q.quote_status === 'in_progress').length,
    approved: quotes.filter((q) => q.quote_status === 'approved').length,
    rejected: quotes.filter((q) => q.quote_status === 'rejected').length,
  }
  const showControls = quotes.length > CONTROLS_THRESHOLD
  // ⚠️ כשהפקדים מוסתרים הם גם **לא מסננים** — מסנן דלוק בלי פקד נראה שמסביר אותו מעלים
  // שורות בלי סיבה גלויה (אותה מלכודת שתועדה במסך-הניהול).
  const filteredQuotes = quotes.filter((q) => {
    if (!showControls) return true
    if (statusFilter !== 'all' && q.quote_status !== statusFilter) return false
    return matchesQuoteFilters(q, { text: searchText })
  })
  // המשווה עצמו חי ב-`sortQuotes` (src/lib/quotes.js) ונבדק שם — אותו קוד בדיוק שמסך-הניהול
  // משתמש בו, כדי ששני המסכים לא יוכלו לסדר את אותן הצעות בסדר שונה.
  const visibleQuotes =
    sortKey === 'recent'
      ? filteredQuotes
      : sortQuotes(filteredQuotes, sortKey, { defaultVatRate: vatRate })

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

        {/* ---- רצועת-הדגשים: שלושת המספרים החיים בלבד (LOCAL-14) ---- */}
        <div className="flex flex-wrap gap-3 p-6 pb-0">
          <StatTile
            label={'סה"כ הכנסות'}
            value={metrics.totalRevenue}
            sub={
              metrics.approvedCount > 0
                ? approvedQuotesLabel(metrics.approvedCount)
                : 'טרם נסגרה עסקה'
            }
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
        </div>
        {/* המדדים שטרם חוברו יורדים לשורה אחת שקטה: הם לא נמחקים (לא מסתירים יכולת עתידית),
            אך גם לא תופסים שליש מרצועת-ההדגשים בשלושה ריבועי "אין נתונים עדיין". */}
        <p className="mx-6 mt-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-500">
          ממתינים למודולים הבאים — מספר אירועים ואירוע אחרון (מודול 6) · ממוצע משוב (מודול 8)
        </p>

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
            <Detail label="שם" value={customer.contact_name} />
            <Detail label="טלפון" value={customer.phone} ltr />
            <Detail label="אימייל" value={customer.email} ltr />
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

        {/* ---- לשוניות ---- */}
        <div className="flex border-b border-slate-200 px-6">
          <Tab
            label="הצעות מחיר"
            count={counts.all}
            active={tab === 'quotes'}
            onClick={() => setTab('quotes')}
            testId="customer-tab-quotes"
          />
          <Tab
            label="פרויקטים"
            count={projects.length}
            active={tab === 'projects'}
            onClick={() => setTab('projects')}
            testId="customer-tab-projects"
          />
        </div>

        <div className="p-6">
          {tab === 'projects' ? (
            // ריק בכוונה: `projects` היא deny-all (RLS בלי policies) עד מודול 6. בלי חיפוש
            // ובלי סינון — פקדים מעל אפס שורות הם פקדים בלי תפקיד. 🚧 מ6 מוסיף אותם עם הנתונים.
            <p
              className="text-center text-sm text-slate-400 py-8"
              data-testid="customer-no-projects"
            >
              אין פרויקטים עדיין — יתמלא במודול 6
            </p>
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
                    onChange={(e) => setSearchText(e.target.value)}
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
                      onClick={() => setStatusFilter(key)}
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
                      {visibleQuotes.map((quote) => {
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
                            <td className="py-2.5 px-3 text-sm text-slate-600 text-right" dir="ltr">
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
                                <div className="text-[11.5px] text-amber-600">טרם נשלחה ללקוח</div>
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
