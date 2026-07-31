// מסך ניהול הצעות המחיר (מודול 3, מסך C5 §5.6.5 · צעד 3.3).
// נבנה אחד-לאחד לפי המוקאפ שאישר ישי 29/07/2026:
// docs/mockups/quote-screen/09_quote_management_approved.html
//
// ה-Route מוגן ב-ProtectedRoute allow="הצעות מחיר" (App.jsx) וה-RLS אוכף ברמת ה-DB
// (§7.21) — כאן רק הבחנת edit-vs-view לרינדור (כלל 9: ה-UI נוחות, ה-DB החומה).
// כלל 14: אפס supabase.from כאן; הדאטה דרך api.js, כל הלוגיקה מ-src/lib/quotes.js.
//
// ⚠️ listQuotes() מביאה את הכול ואינה מקבלת מסננים (מתועד ב-api.js) — הטאבים, המונים,
// המסננים והמיון הם **כולם צד-לקוח**, בדיוק כמו מסך הלקוחות של מודול 2.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, Eye, Pencil, Search, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import Money from '@/components/Money'
import RowAction from '@/components/RowAction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  QUOTE_SCREEN_PARAM_NAMES,
  countRejectionReasons,
  deriveQuoteAmount,
  deriveQuoteExpiry,
  deriveQuoteMetrics,
  isEventSoon,
  matchesQuoteFilters,
  missingPricingParamsMessage,
  sortQuotes,
} from '@/lib/quotes'
import { parseVatPercent } from '@/lib/pricing'
import { formatDate } from '@/modules/03_quotes/quotePdf'
import {
  approveQuote,
  getPricingCatalog,
  getQuoteScreenParams,
  listQuotes,
  rejectQuote,
} from '@/modules/03_quotes/api'
import ApproveQuoteDialog from '@/modules/03_quotes/ApproveQuoteDialog'
import QuoteDocumentDialog from '@/modules/03_quotes/QuoteDocumentDialog'
import RejectQuoteDialog from '@/modules/03_quotes/RejectQuoteDialog'

// הכרעת-ישי 29/07: לשונית "הכל" + שלוש לשוניות-הסטטוס. ולמה לא עוד לשוניות — לשונית היא
// **מצב בלעדי של אותה שורה**, ו-quote_status קפוא על 3 ערכים (§7.82/F16): "טיוטה" הייתה
// דורשת סטטוס חדש, "פג תוקף" היא סיבת-דחייה (§7.41) שכבר נראית בתוך "נדחו", ו"פג בקרוב"
// אינה יכולה להיות לשונית כי הצעה היא בתהליך **וגם** פגה-בקרוב באותו רגע — ולכן היא מסנן.
const TABS = [
  { key: 'all', label: 'הכל', status: null },
  { key: 'in_progress', label: 'בתהליך', status: 'in_progress' },
  { key: 'approved', label: 'מאושרות', status: 'approved' },
  { key: 'rejected', label: 'נדחו', status: 'rejected' },
]

// הכרעת-ישי 29/07: ברירת-המחדל היא "הקרוב לפוג ראשון" — שמו של ישי לסדר שהצעתי
// ("הישן שלא נגעו בו"), והוא טוב יותר: הוא מתאר את מה שמונח על הכף ולא את המדד שמייצג אותו.
const SORTS = [
  { key: 'expiry', label: 'הקרוב לפוג ראשון' },
  { key: 'amount', label: 'סכום — מהגבוה' },
  { key: 'eventDate', label: 'תאריך האירוע — הקרוב' },
]

const STATUS_PILL = {
  in_progress: { label: 'בתהליך', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'מאושרת', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'נדחתה', className: 'bg-red-100 text-red-700' },
}

// מסנן-מהיר. הכרעת-ישי: זהו **כפתור** — לחיצה מסננת, לחיצה שנייה מבטלת — ולא אריח-מדד.
// ⚠️ מצב-נבחר מקבל גוון בהיר ולא טורקיז-מלא: הטורקיז המלא שמור לפעולה הראשית היחידה
// של המסך ("+ הצעה חדשה"), אחרת שני דברים שונים לובשים אותו מראה (src/CLAUDE.md מעבר-מלאי).
// אפס תוצאות ⇒ מושבת, כי אין למה לסנן.
function FilterChip({ label, count, active, onToggle, testId }) {
  const disabled = count === 0
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
        disabled && 'border-slate-200 bg-white text-slate-400 cursor-not-allowed',
        !disabled && active && 'border-teal-300 bg-teal-50 text-teal-700 font-semibold',
        !disabled && !active && 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
      )}
    >
      {label}
      <span
        dir="ltr"
        className={cn(
          'rounded-full px-1.5 text-[11px] font-semibold',
          disabled && 'bg-slate-100 text-slate-400',
          !disabled && active && 'bg-teal-100 text-teal-700',
          !disabled && !active && 'bg-amber-200 text-amber-800',
        )}
      >
        {count}
      </span>
    </button>
  )
}

export default function QuotesPage() {
  const { permissions } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const canEdit = permissions['הצעות מחיר'] === 'edit'

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quotes, setQuotes] = useState([])
  const [productsBySku, setProductsBySku] = useState({})
  const [params, setParams] = useState({})
  // התאריך נקבע פעם אחת בטעינה ולא בכל רינדור: Date.now()/new Date() בגוף-רינדור הם
  // שגיאת-lint קשיחה בקונפיג הזה (react-hooks/purity), ומעבר לכך — תאריך שמשתנה
  // תוך-כדי רינדור היה יכול להזיז שורה בין "פג בקרוב" לרגילה באמצע לחיצה.
  const [todayIso, setTodayIso] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  const [tab, setTab] = useState('in_progress')
  const [searchText, setSearchText] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [eventDateFrom, setEventDateFrom] = useState('')
  const [eventDateTo, setEventDateTo] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [sortKey, setSortKey] = useState('expiry')
  const [expiringSoon, setExpiringSoon] = useState(false)
  const [eventSoon, setEventSoon] = useState(false)

  const [documentQuote, setDocumentQuote] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rows, paramRows, catalog] = await Promise.all([
          listQuotes(),
          getQuoteScreenParams(),
          getPricingCatalog(),
        ])
        if (cancelled) return
        setQuotes(rows)
        setParams(Object.fromEntries(paramRows.map((p) => [p.param_name, p.param_value])))
        setProductsBySku(Object.fromEntries(catalog.products.map((p) => [p.sku, p])))
        // תאריך-היום מהלוח **המקומי** ולא מ-toISOString (שהוא UTC): בין חצות ל-03:00
        // שעון ישראל ה-UTC עדיין באתמול, ו"פג בעוד N יום" היה מוצג ביום שלם בהפרש.
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        setTodayIso(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
        setLoadError('')
      } catch {
        if (!cancelled) setLoadError('שגיאה בטעינת רשימת ההצעות.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  function reload() {
    setReloadTick((t) => t + 1)
  }

  const vatRate = parseVatPercent(params[QUOTE_SCREEN_PARAM_NAMES.vatPercent])
  const validityDays = params[QUOTE_SCREEN_PARAM_NAMES.validityDays]
  const eventWarningDays = params[QUOTE_SCREEN_PARAM_NAMES.eventWarningDays]
  const emailTemplate = params[QUOTE_SCREEN_PARAM_NAMES.quoteEmailTemplate]
  const ctx = { todayIso, validityDays, eventWarningDays, defaultVatRate: vatRate }
  const missingParamsMessage = missingPricingParamsMessage({ vatRate, validityDays })

  // בלי useMemo: הקומפיילר של React מזכר את זה לבד, ו-memoization ידני על ערך שנגזר
  // ממשתנה-רינדור מקומי (vatRate) מפיל אצלו את האופטימיזציה כולה — ‏react-hooks/preserve-manual-memoization.
  const metrics = deriveQuoteMetrics(quotes, vatRate)

  // רשימת-הלקוחות לתפריט-הסינון נגזרת מההצעות עצמן ולא מטבלת-הלקוחות: לקוח בלי הצעות
  // בתפריט הוא אפשרות שמובילה תמיד לאפס תוצאות.
  const customerOptions = useMemo(() => {
    const map = new Map()
    for (const q of quotes) {
      if (q.customers?.company_name) map.set(q.customer_id, q.customers.company_name)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [quotes])

  // הסינון שאינו-לשונית ואינו-צ'יפ. מונֵי-הלשוניות ומונֵי-הצ'יפים נגזרים ממנו, כך
  // שמספר בלשונית תמיד תואם למה שיוצג בלחיצה עליה.
  const baseFilters = {
    text: searchText,
    customerId: customerId === '' ? null : Number(customerId),
    eventDateFrom: eventDateFrom || undefined,
    eventDateTo: eventDateTo || undefined,
  }
  const baseRows = quotes.filter((q) => matchesQuoteFilters(q, baseFilters, ctx))
  const tabRows = baseRows.filter((q) => {
    const status = TABS.find((t) => t.key === tab)?.status
    return !status || q.quote_status === status
  })

  const expiringCount = tabRows.filter(
    (q) => deriveQuoteExpiry(q, validityDays, todayIso)?.isExpiringSoon,
  ).length
  const eventSoonCount = tabRows.filter((q) => isEventSoon(q, eventWarningDays, todayIso)).length

  // ── מתי צ'יפ מוצג, ומתי הוא רק מושבת ──────────────────────────────────────
  // הכלל של ישי נשמר: **צ'יפ מוצג-ומושבת כשהמונה 0**, כדי שהמשתמש יראה שהמסנן קיים.
  // הוא מוסתר לגמרי רק כשהמונה **אינו יכול** להיות שונה מ-0 בלשונית הזו — פקד שלעולם
  // לא יידלק אינו "מסנן ריק" אלא רעש.
  //   • "פג בקרוב" — תפוגה מוגדרת רק ל-in_progress, ולכן בלשוניות "מאושרות"/"נדחו"
  //     הוא 0 מבנית ומוסתר.
  //   • "אירועים קרובים" — מודד את **מועד הלקוח**, שקיים גם להצעה מאושרת. לכן הוא
  //     מוצג בכל מקום שבו יש בפועל מה להראות, ומוסתר רק כשאין ואף לא יכול להיות.
  // ⇒ ברגע שייכנסו נתונים אמיתיים (הצעה שמזדקנת · אירוע שמתקרב) הצ'יפים יופיעו וידלקו
  //   מעצמם. שום דבר כאן אינו מכבה אותם לצמיתות.
  const tabHasOpenQuotes = tabRows.some((q) => q.quote_status === 'in_progress')
  const showExpiringChip = tabHasOpenQuotes
  const showEventSoonChip = tabHasOpenQuotes || eventSoonCount > 0
  const showChips = showExpiringChip || showEventSoonChip

  // ⚠️ כשהצ'יפים מוסתרים (לשונית סגורה) הם גם **לא מסננים** — אחרת מסנן פעיל שנשאר
  // דלוק מלשונית קודמת היה מעלים שורות בלי שום פקד נראה שמסביר למה.
  const chipFilters = {
    expiringSoon: showExpiringChip && expiringSoon,
    eventSoon: showEventSoonChip && eventSoon,
  }
  const visibleRows = sortQuotes(
    tabRows.filter((q) => matchesQuoteFilters(q, chipFilters, ctx)),
    sortKey,
    ctx,
  )

  const rejectionBreakdown = tab === 'rejected' ? countRejectionReasons(tabRows) : []

  const hasActiveFilters =
    searchText.trim() !== '' ||
    customerId !== '' ||
    eventDateFrom ||
    eventDateTo ||
    chipFilters.expiringSoon ||
    chipFilters.eventSoon

  async function handleApprove() {
    await approveQuote(approveTarget.quote_id)
    setApproveTarget(null)
    toast.success(`ההצעה אושרה ונפתח פרויקט חדש עבור "${approveTarget.event_name}".`)
    reload()
  }

  async function handleReject(reason, notes) {
    await rejectQuote(rejectTarget.quote_id, reason, notes)
    setRejectTarget(null)
    toast.success('ההצעה נדחתה.')
    reload()
  }

  if (loading || loadError) {
    return (
      <div className="p-6">
        <LoadingOrError
          loading={loading}
          error={loadError}
          onRetry={reload}
          retryTestId="quotes-retry"
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* שני המדדים יושבים בשורת-הכותרת ולא ברצועה ברוחב-מלא (הכרעת-ישי 29/07): רצועה
          עם שני מספרים בלבד נמדדה כ-100% רוחב וכמעט ריקה. כאן הם בגודל-התוכן שלהם. */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ניהול הצעות מחיר</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            מעקב אחר הצעות שנשלחו, ואישור או דחייה שלהן
          </p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-l border-slate-200">
            <Money amount={metrics.openValue} className="text-[22px] font-bold text-slate-800" />
            <div className="text-xs text-slate-500">שווי הצעות פתוחות</div>
            <div className="text-[11px] text-slate-400">
              {metrics.openCount} ממתינות לתשובת הלקוח
            </div>
          </div>
          <div className="px-4 py-2.5">
            {/* שיעור שאין ממנו מדגם מוצג כ-"—" ולא כ-0%: 0% על אפס הצעות סגורות אינו
                מספר נמוך אלא מספר שקרי. */}
            <div className="text-[22px] font-bold text-slate-800" dir="ltr">
              {metrics.approvalRate === null ? '—' : `${metrics.approvalRate}%`}
            </div>
            <div className="text-xs text-slate-500">שיעור אישור</div>
            <div className="text-[11px] text-slate-400">
              {metrics.approvedCount} מתוך {metrics.closedCount} שנסגרו
            </div>
          </div>
        </div>
      </div>

      {/* אזהרת פרמטר-מערכת חסר (הכרעת-ישי 31/07/2026). הסגנון מועתק מבאנר-האזהרה
          הקיים ב-CustomerFormDialog — מעבר-אחידות, לא המצאת גוון חדש. */}
      {missingParamsMessage && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 mb-4"
          role="alert"
          data-testid="quotes-missing-params"
        >
          {missingParamsMessage}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm px-4 pb-3">
        {/* לשוניות קו-תחתון — הועתקו מהמוקאפ המאושר של ניהול-הפרויקטים
            (docs/mockups/project-management-screen/01_overview_reworked.html). גרסת-כפתורים
            נפסלה ע"י ישי: "נראית כמו מסננים, לא כמו לשוניות". */}
        <div className="flex items-center gap-1 border-b border-slate-200 -mx-4 px-4 mb-3">
          {TABS.map((t) => {
            const count = baseRows.filter((q) => !t.status || q.quote_status === t.status).length
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                data-testid={`quotes-tab-${t.key}`}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm border-b-2 -mb-px transition-colors',
                  active
                    ? 'border-teal-600 text-teal-700 font-semibold'
                    : 'border-transparent text-slate-500 font-medium hover:text-slate-700',
                )}
              >
                {t.label}
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
          })}
          {canEdit && (
            <Button
              onClick={() => navigate('/quotes/new')}
              className="mr-auto self-center h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              data-testid="quote-add-button"
            >
              + הצעה חדשה
            </Button>
          )}
        </div>

        {/* ⚠️ שורה אחת, ולא שתיים. חמישה פקדים בשורה אחת נמדדו ב-1,174px בתוך כרטיס של
            960px (חלון 1280) והשורה נשברה — הצ'יפים נחתו בשורה נפרדת ונראו כמו פקד אחר.
            לכן: כל פקד ברוחב-התוכן הנדרש לו בלבד, ותאריכי-הטווח בפקד צר אחד עם אייקון
            במקום תווית-טקסט (הכיתוב "תאריך האירוע" לבדו גזל ~90px). */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="relative w-[11.5rem] shrink-0">
            {/* זכוכית-מגדלת בצד ימין — אותה מוסכמה כמו CustomersPage.jsx (מעבר-אחידות) */}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="חיפוש לקוח או אירוע..."
              className="h-auto py-2 pr-9 pl-3 text-right rounded-lg border-slate-300 text-sm"
              data-testid="quotes-search"
            />
          </div>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-[38px] max-w-[8.5rem] shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
            aria-label="סינון לפי לקוח"
            data-testid="quotes-customer-filter"
          >
            <option value="">כל הלקוחות</option>
            {customerOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* ⚠️ טווח-התאריכים הוא **כפתור שפותח פאנל**, ולא שני שדות-תאריך פתוחים בשורה.
              שתי סיבות, ושתיהן נמדדו: (א) שני `input[type=date]` תופסים 258px — הם לבדם
              שברו את השורה לשתיים (סה"כ 1,071px בתוך 912); במוקאפ המאושר זהו תפריט אחד
              צר. (ב) זה הדפוס שכבר קיים בפרויקט — כפתור "סינון" ב-CustomersPage פותח
              מסננת נפרדת, ולא מפזר שדות בשורה (מעבר-אחידות). */}
          <button
            type="button"
            onClick={() => setShowDateFilter((v) => !v)}
            aria-expanded={showDateFilter}
            className={cn(
              'flex items-center gap-1.5 h-[38px] rounded-lg border px-2.5 text-sm shrink-0',
              eventDateFrom || eventDateTo
                ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium'
                : 'border-slate-300 bg-white text-slate-700',
            )}
            data-testid="quotes-date-toggle"
          >
            <CalendarDays className="size-4 text-slate-400" />
            תאריך האירוע
          </button>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="h-[38px] shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
            aria-label="מיון"
            data-testid="quotes-sort"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                מיון: {s.label}
              </option>
            ))}
          </select>

          {/* שני הצ'יפים כיחידה אחת שנדחפת לקצה. ‏mr-auto ב-RTL דוחף שמאלה — ובניגוד
              ל-span עם flex-1, הוא אינו כופה שבירת-שורה כשהמקום צר.
              ⚠️ מוצגים רק בלשוניות שבהן הם יכולים אי-פעם להידלק: שניהם נוגעים להצעה
              **פתוחה** (מסמך שמזדקן · אירוע שמתקרב ועוד לא אויש). בלשונית "נדחו" צ'יפ
              "פג בקרוב" הוא בהגדרה 0 לנצח — פקד שלעולם לא יעשה דבר הוא רעש. */}
          <div className={cn('items-center gap-2 mr-auto', showChips ? 'flex' : 'hidden')}>
            {showExpiringChip && (
              <FilterChip
                label="פג בקרוב"
                count={expiringCount}
                active={expiringSoon}
                onToggle={() => setExpiringSoon((v) => !v)}
                testId="quotes-chip-expiring"
              />
            )}
            {/* חלון-האזהרה נקרא מהפרמטר הקיים `ימי_אזהרה_קדם_אירוע` (=14) ולא ממספר שהומצא
                כאן. ⚠️ מדד שונה לגמרי מ"פג בקרוב": שם מזדקן המסמך שלנו, כאן מתקרב המועד של
                הלקוח — הצעה יכולה להיות טרייה ועדיין דחופה, כי אין זמן לאייש את האירוע. */}
            {showEventSoonChip && (
              <FilterChip
                label="אירועים קרובים"
                count={eventSoonCount}
                active={eventSoon}
                onToggle={() => setEventSoon((v) => !v)}
                testId="quotes-chip-event-soon"
              />
            )}
          </div>
        </div>

        {showDateFilter && (
          // הטווח מוצג כפקד אחד בכיוון LTR — התחלה משמאל וסיום מימין — ולא כשני שדות
          // ש-RTL הופך את סדרם ומייצר על המסך טווח הפוך ממה שהוקלד (src/CLAUDE.md).
          <div
            dir="ltr"
            className="flex items-center gap-2 mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 w-fit"
          >
            <input
              type="date"
              value={eventDateFrom}
              onChange={(e) => setEventDateFrom(e.target.value)}
              aria-label="תאריך אירוע מ-"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
              data-testid="quotes-event-from"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="date"
              value={eventDateTo}
              onChange={(e) => setEventDateTo(e.target.value)}
              aria-label="תאריך אירוע עד"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
              data-testid="quotes-event-to"
            />
            {(eventDateFrom || eventDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setEventDateFrom('')
                  setEventDateTo('')
                }}
                className="text-xs text-slate-500 underline"
                data-testid="quotes-date-clear"
              >
                ניקוי
              </button>
            )}
          </div>
        )}

        {rejectionBreakdown.length > 0 && (
          <div className="flex gap-4 text-xs text-slate-500 pb-2" data-testid="rejection-breakdown">
            <span>סיבות דחייה:</span>
            {rejectionBreakdown.map(({ reason, count }) => (
              <span key={reason}>
                <b className="text-slate-700">{count}</b> {reason}
              </span>
            ))}
          </div>
        )}

        {visibleRows.length === 0 ? (
          <div className="py-12 text-center" data-testid="quotes-empty-state">
            {quotes.length === 0 ? (
              <>
                <p className="text-slate-500 font-medium">אין הצעות מחיר במערכת עדיין.</p>
                {canEdit && (
                  <p className="text-slate-400 text-sm mt-1">
                    לחצו על "+ הצעה חדשה" כדי ליצור את ההצעה הראשונה.
                  </p>
                )}
              </>
            ) : hasActiveFilters ? (
              <>
                <p className="text-slate-500 font-medium">אין הצעות התואמות את החיפוש.</p>
                <p className="text-slate-500 text-sm mt-1">
                  נסו לשנות את מונחי החיפוש או לנקות את הסינון.
                </p>
              </>
            ) : (
              <p className="text-slate-500 font-medium">אין הצעות בלשונית זו.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[52rem] text-right border-collapse text-sm"
              data-testid="quotes-table"
            >
              <thead>
                <tr className="text-[11.5px] text-slate-500 border-b border-slate-200">
                  <th className="font-medium py-2.5 pl-3.5 text-right">מס׳</th>
                  <th className="font-medium py-2.5 pl-3.5">ההצעה</th>
                  <th className="font-medium py-2.5 pl-3.5">איש קשר</th>
                  <th className="font-medium py-2.5 pl-3.5">תאריך האירוע</th>
                  {/* הכותרת והמספרים חולקים את אותו רוחב ואותו יישור, ולכן נופלים על אותו
                      קו. בלי ה-min-width הזהה, עמודת-כסף "מתנדנדת" בין שורה לשורה. */}
                  <th className="font-medium py-2.5 pl-3.5 text-left">
                    <span className="inline-block min-w-[5.5rem] text-right">סכום כולל</span>
                  </th>
                  <th className="font-medium py-2.5 pl-3.5">סטטוס</th>
                  <th className="font-medium py-2.5">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((quote) => {
                  const { total, discountPercent } = deriveQuoteAmount(quote, vatRate)
                  const expiry = deriveQuoteExpiry(quote, validityDays, todayIso)
                  const pill = STATUS_PILL[quote.quote_status]
                  const isOpen = quote.quote_status === 'in_progress'
                  const email = quote.customers?.email

                  return (
                    <tr
                      key={quote.quote_id}
                      className="border-b border-slate-100 last:border-b-0"
                      data-testid={`quote-row-${quote.quote_id}`}
                    >
                      {/* ⚠️ direction:ltr לבדו דוחף את התוכן שמאלה בעוד הכותרת מיושרת ימינה
                          (נמדד: 15px סטייה). המספר נשאר LTR כדי ש-"#7" ייקרא נכון, ומיושר
                          לימין כמו הכותרת שמעליו. */}
                      <td dir="ltr" className="py-2.5 pl-3.5 text-right text-slate-500">
                        #{quote.quote_id}
                      </td>
                      <td className="py-2.5 pl-3.5">
                        <div className="font-semibold text-slate-800">{quote.event_name}</div>
                        <div className="text-[11.5px] text-slate-500">
                          {quote.customers?.company_name}
                        </div>
                      </td>
                      <td className="py-2.5 pl-3.5">
                        <div className="text-slate-700">{quote.customers?.contact_name}</div>
                        <div dir="ltr" className="text-[11.5px] text-slate-500 text-right">
                          {quote.customers?.phone}
                        </div>
                        {/* קישור-פנייה כללי לאיש-הקשר (mailto ריק, אותו מנגנון כמו פאנל-השיווק
                            של מודול 2). ⚠️ תפקיד שונה משליחת-ההצעה בחלון "צפייה במסמך" — שם
                            נשלח בפועל המסמך עם תבנית-הגוף; זה כאן רק פותח תוכנת-דואר ריקה
                            לפנייה חופשית. שמות שונים כדי שלא ייקראו כאותה פעולה. כפתור-חיוג
                            tel: ירד בהכרעת-ישי: במחשב הוא לרוב לא מחייג. */}
                        {email && (
                          <a
                            href={`mailto:${email}`}
                            title="מייל לאיש הקשר"
                            className="inline-block mt-1 text-[11px] text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-1.5 py-0.5"
                            data-testid={`quote-mailto-${quote.quote_id}`}
                          >
                            ✉ מייל לאיש הקשר
                          </a>
                        )}
                      </td>
                      <td dir="ltr" className="py-2.5 pl-3.5 text-right text-slate-700">
                        {formatDate(quote.estimated_event_date)}
                      </td>
                      <td className="py-2.5 pl-3.5 text-left">
                        <Money
                          amount={total}
                          className="font-bold text-slate-800 min-w-[5.5rem] text-right"
                        />
                        {/* "אחרי X% הנחה" מוצג רק כשיש הנחה (הכרעת-ישי): בלשונית "נדחו" הוא
                            נקרא לצד "נבחר מתחרה" — כלומר גם הנחנו וגם הפסדנו. */}
                        {discountPercent > 0 && (
                          <div className="text-[11.5px] text-slate-500">
                            אחרי {discountPercent}% הנחה
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pl-3.5">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap',
                            pill?.className,
                          )}
                        >
                          {pill?.label}
                        </span>
                        {/* מתחת לתגית: עבור הצעה פתוחה — כמה זמן נשאר; עבור נדחתה — הסיבה,
                            שהיא הדבר היחיד שמסביר את השורה. */}
                        {expiry && (
                          <div className="text-[11.5px] text-slate-500">
                            פג בעוד {expiry.daysLeft} יום
                          </div>
                        )}
                        {quote.quote_status === 'rejected' && quote.rejection_reason && (
                          <div className="text-[11.5px] text-slate-500">
                            {quote.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1.5 justify-start">
                          {canEdit && isOpen && (
                            <RowAction
                              title="עריכת ההצעה"
                              onClick={() => navigate(`/quotes/${quote.quote_id}/edit`)}
                              testId={`quote-edit-${quote.quote_id}`}
                            >
                              <Pencil className="size-4" />
                            </RowAction>
                          )}
                          <RowAction
                            title="צפייה במסמך"
                            onClick={() => setDocumentQuote(quote)}
                            testId={`quote-document-${quote.quote_id}`}
                          >
                            <Eye className="size-4" />
                          </RowAction>
                          {canEdit && isOpen && (
                            <>
                              <RowAction
                                title="אישור ההצעה"
                                tone="approve"
                                onClick={() => setApproveTarget(quote)}
                                testId={`quote-approve-${quote.quote_id}`}
                              >
                                <Check className="size-4" />
                              </RowAction>
                              <RowAction
                                title="דחיית ההצעה"
                                tone="reject"
                                onClick={() => setRejectTarget(quote)}
                                testId={`quote-reject-${quote.quote_id}`}
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
      </div>

      <QuoteDocumentDialog
        key={`document-${documentQuote?.quote_id ?? 'none'}`}
        open={documentQuote != null}
        onOpenChange={(o) => !o && setDocumentQuote(null)}
        quote={documentQuote}
        productsBySku={productsBySku}
        vatRate={vatRate}
        validityDays={validityDays}
        emailTemplate={emailTemplate}
        canEdit={canEdit}
      />
      {/* remount לפי id (מוסכמת מודול 1/2): הטופס בתוך חלון-הדחייה מתאפס בפתיחה חדשה
          בלי effect שמסנכרן props→state — שהוא שגיאת-lint קשיחה בקונפיג הזה. */}
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
