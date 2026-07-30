// מסך בניית הצעת מחיר (מסך 5.6.4) — יצירה ועריכה באותו מסך.
// ה-Route מוגן ב-ProtectedRoute allow="הצעות מחיר" וה-RLS אוכף ב-DB; כאן רק הבחנת edit-vs-view
// לרינדור (כלל 9: ה-UI נוחות, ה-DB החומה).
// כלל 14: אפס supabase.from כאן — הכל דרך api.js; כל חישוב-כסף מ-src/lib/pricing.js וכל כלל-טופס
// מ-src/lib/quotes.js. המסך מציג ומזין בלבד.
//
// המוקאפ אושר ע"י ישי 29/07/2026 אחרי ~11 סבבים; שש ההכרעות שלו מסומנות בקוד במקומן.

import { cloneElement, isValidElement, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import LtrFieldGroup from '@/components/LtrFieldGroup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  computeQuoteTotals,
  parseGuestsRatio,
  parseVatPercent,
  recommendHostessCount,
  PRICING_PARAM_NAMES,
} from '@/lib/pricing'
import {
  buildQuoteHeader,
  buildQuoteLines,
  computeEventHours,
  computeLinesCost,
  crossesMidnight,
  deriveProfitability,
  formToPreviewQuote,
  linesToPricingShape,
  quoteToFormState,
  sumHostessQty,
  validateQuoteForm,
  QUOTE_SCREEN_PARAM_NAMES,
} from '@/lib/quotes'
import { listCustomers } from '@/modules/02_customers/api'
import CustomerFormDialog from '@/modules/02_customers/CustomerFormDialog'
import {
  createQuote,
  getPricingCatalog,
  getQuote,
  getQuoteScreenParams,
  saveQuoteEdit,
} from '@/modules/03_quotes/api'
import CustomerPicker from '@/modules/03_quotes/CustomerPicker'
import QuoteDocumentDialog from '@/modules/03_quotes/QuoteDocumentDialog'
import QuoteLineEditor from '@/modules/03_quotes/QuoteLineEditor'
import QuoteSummaryPanel from '@/modules/03_quotes/QuoteSummaryPanel'

const EMPTY_FORM = {
  customerId: null,
  eventName: '',
  eventDate: '',
  location: '',
  startTime: '',
  endTime: '',
  guests: '',
  ratio: '',
  hostessCount: '',
  appliedDiscount: 0,
  manualDiscount: 0,
  notes: '',
}

// שדה-טופס רגיל (תווית מעל, הודעת-שגיאה מתחת) — קומפוננטה עליונה (react-hooks/static-components).
// ⚠️ הסימון מוזרק לשדה עצמו ולא נכתב באתר-הקריאה (סקירת 3.7): עד 31/07/2026 רק בוחר-הלקוח
// סימן את עצמו, ושם-האירוע/תאריך/מיקום קיבלו טקסט אדום מתחת ומסגרת אפורה רגילה — כלומר
// מי שמסתכל לא רואה איזה שדה שגוי, ומי שמשתמש בקורא-מסך לא שומע זאת כלל. הזרקה כאן ולא
// בשמונה אתרי-קריאה, כי אתר-קריאה שיישכח חוזר בשקט למצב הקודם.
// ‏`aria-invalid` הוא גם מה שמפעיל את הגבול האדום המובנה של `Input` (`ui/input.jsx:13`) —
// אין כאן צבע חדש (כלל 8), ובורר-התכונה גובר בספציפיות על `border-slate-300` שבאתר-הקריאה.
function Field({ id, label, error, children, className }) {
  const errorId = `${id}-error`
  const markedChild =
    error && isValidElement(children)
      ? cloneElement(children, { 'aria-invalid': true, 'aria-describedby': errorId })
      : children
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs text-slate-500">
        {label}
      </label>
      {markedChild}
      {error && (
        <p
          id={errorId}
          className="mt-1 text-xs font-medium text-red-600"
          data-testid={`quote-error-${id}`}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default function QuoteBuilderPage() {
  const { quoteId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // נשלף כאן ולא בתוך ה-effect: ערך פרימיטיבי יציב במערך-התלויות, בעוד ש-`searchParams`
  // הוא אובייקט חדש בכל שינוי-כתובת — והיה גורם לטעינה מחדש של הלקוחות והקטלוג לחינם.
  const preselectCustomerId = searchParams.get('customerId')
  const toast = useToast()
  const { permissions } = useAuth()
  const canEdit = permissions['הצעות מחיר'] === 'edit'
  const isEditMode = Boolean(quoteId)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [catalog, setCatalog] = useState({ products: [], tiers: [], params: [] })
  const [form, setForm] = useState(EMPTY_FORM)
  const [lines, setLines] = useState([])
  // ⚠️ השגיאות **אינן** state — הן נגזרות מהטופס בכל רינדור, אחרי הניסיון-לשמור הראשון.
  // למה לא state (מה שהיה כאן עד 29/07/2026, וישי תפס): מפת-שגיאות שנשמרת בלחיצת "שמור"
  // נשארת תלויה מעל שדה שכבר תוקן, עד הלחיצה הבאה. גזירה חיה מנקה כל הודעה **ברגע**
  // שהשדה שלה נעשה תקין, ומשאירה את מי שעדיין ריק — וזו בדיוק ההתנהגות שהוא ציפה לה.
  // ⚠️ לא מנקים "שגיאה של השדה שנגעו בו" בלבד: כללים חוצי-שדות (סכום ההנחות ≤100%,
  // חובת שורת-דיילות) תלויים בכמה שדות יחד, וניקוי-פר-שדה היה משאיר אותם תקועים.
  const [submitAttempted, setSubmitAttempted] = useState(false)
  // "היום" נשמר ב-state ולא מחושב ברינדור — react-hooks/purity אוסר Date בגוף הרינדור.
  const [todayIso, setTodayIso] = useState('')
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  // ⚠️ השורה השמורה נשמרת **בנוסף** לטופס, ולא רק מומרת אליו: המסמך צריך ממנה שלושה
  // שדות שאין להם מקור בטופס — מספר-ההצעה, תאריך-ההנפקה, ו-updated_at (שממנו נגזר התוקף).
  const [savedQuote, setSavedQuote] = useState(null)
  const [screenParams, setScreenParams] = useState({})
  const [documentOpen, setDocumentOpen] = useState(false)

  // טעינה: לקוחות + קטלוג-תמחור, ובמצב-עריכה גם ההצעה עצמה. כל ה-setState אחרי await
  // (react-hooks/set-state-in-effect), ודגל cancelled מונע כתיבה אחרי ניווט באמצע טעינה.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // ‏getQuoteScreenParams נטענת גם כאן ולא רק במסך-הניהול: `ימי_תוקף_הצעה` נדרש
        // לשורת "תוקף ההצעה עד" שבמסמך, ובלעדיו המסמך שהמשתמש רואה מהבנייה היה מציג "—"
        // בעוד שאותו מסמך מהניהול מציג תאריך — שני מסמכים שונים לאותה הצעה.
        const [customerRows, catalogData, quote, paramRows] = await Promise.all([
          listCustomers(),
          getPricingCatalog(),
          isEditMode ? getQuote(Number(quoteId)) : Promise.resolve(null),
          getQuoteScreenParams(),
        ])
        if (cancelled) return
        setScreenParams(Object.fromEntries(paramRows.map((p) => [p.param_name, p.param_value])))
        setSavedQuote(quote)

        const ratioParam = catalogData.params.find(
          (p) => p.param_name === PRICING_PARAM_NAMES.GUESTS_PER_HOSTESS_RATIO,
        )
        const defaultRatio = parseGuestsRatio(ratioParam?.param_value)

        setCustomers(customerRows)
        setCatalog(catalogData)

        if (isEditMode) {
          if (!quote) {
            setLoadError('ההצעה לא נמצאה, או שאין לך הרשאה לצפות בה.')
          } else if (quote.quote_status !== 'in_progress') {
            // טריגר-הנעילה (§7.50) יסרב לעדכון ממילא — עדיף לומר זאת לפני שממלאים טופס שלם.
            setLoadError('לא ניתן לערוך הצעה שאינה בסטטוס "בתהליך".')
          } else {
            const productsBySku = Object.fromEntries(catalogData.products.map((p) => [p.sku, p]))
            const state = quoteToFormState(quote, productsBySku, defaultRatio)
            setForm(state.form)
            setLines(state.lines)
          }
        } else {
          // ↳ 30/07/2026: הגעה מ"+ הצעה חדשה" בעמוד-הלקוח מביאה `?customerId=` בכתובת,
          // והלקוח נבחר מראש. ⚠️ **חייב לעבור דרך אותו צילום-הנחה של handleSelectCustomer**
          // (F12): לקוח שנבחר בלי `appliedDiscount` היה מייצר הצעה עם 0% הנחה בשקט, למרות
          // שבכרטיסו רשומה הנחה — בדיוק סוג הכשל שהמסך הזה בנוי למנוע.
          // ⚠️ מזהה שאינו ברשימה (נמחק / אין הרשאה) נופל בשקט חזרה לטופס ריק, ולא מפיל את המסך.
          const preselected = preselectCustomerId
            ? customerRows.find((c) => c.customer_id === Number(preselectCustomerId))
            : null
          setForm({
            ...EMPTY_FORM,
            ratio: defaultRatio ?? '',
            customerId: preselected?.customer_id ?? null,
            appliedDiscount: Number(preselected?.discount_percent ?? 0),
          })
        }
        setLoadError('')
      } catch {
        if (!cancelled) setLoadError('שגיאה בטעינת נתוני ההצעה.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quoteId, isEditMode, reloadTick, preselectCustomerId])

  const selectedCustomer = customers.find((c) => c.customer_id === form.customerId) ?? null

  // מפת מק"ט⇒מוצר — המסמך צריך אותה כדי להציג שם-פריט ולא מק"ט (מוקש 3.1: מק"ט שאינו
  // בקטלוג נופל חזרה למק"ט עצמו, כי שורה בלי שם במסמך-לקוח מביכה).
  const productsBySku = useMemo(
    () => Object.fromEntries(catalog.products.map((p) => [p.sku, p])),
    [catalog.products],
  )

  // המע"מ נקרא מהפרמטרים ולא מקודד — parseVatPercent מחזיר null כשהוא חסר, ואז המסך
  // מסרב לחשב במקום להמציא 0% (אותה דוקטרינה כמו ב-pricing.js).
  const vatRate = useMemo(() => {
    const row = catalog.params.find((p) => p.param_name === PRICING_PARAM_NAMES.VAT_PERCENT)
    return parseVatPercent(row?.param_value)
  }, [catalog.params])

  const totals = useMemo(() => {
    if (vatRate === null) return null
    try {
      return computeQuoteTotals(
        linesToPricingShape(lines),
        form.appliedDiscount,
        Number(form.manualDiscount) || 0,
        vatRate,
      )
    } catch {
      // הנחות חורגות תוך-כדי הקלדה — הוולידציה תתפוס בשמירה; הסיכום לא צריך להתרסק.
      return null
    }
  }, [lines, form.appliedDiscount, form.manualDiscount, vatRate])

  const profitability = useMemo(
    () => deriveProfitability(totals?.preVat ?? 0, computeLinesCost(lines)),
    [totals?.preVat, lines],
  )

  const recommendedHostesses = recommendHostessCount(form.guests, form.ratio)
  const actualHostesses = sumHostessQty(lines)
  const eventHours = computeEventHours(form.startTime, form.endTime)

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  // הכרעת-ישי 29/07: כמות-הדיילות נערכת **ישירות**. שינוי אורחים/יחס מרענן אותה להמלצה
  // החדשה — התנהגות צפויה יותר מ"לזכור" ערך ידני שנקבע לפי נתונים אחרים — ומי שדרס בכוונה
  // מקבל קיצור להחזרת-ההמלצה, שמופיע רק כשהמספרים באמת נפרדו.
  function updateHeadcountInput(patch) {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      return { ...next, hostessCount: recommendHostessCount(next.guests, next.ratio) || '' }
    })
  }

  // בחירת לקוח = צילום-מצב של אחוז ההנחה שלו (F12). ההנחה נשמרת בהצעה ולא נמשכת מחדש
  // בעריכה, ולכן לקוח שהנחתו תשתנה מחר לא ישנה הצעה שכבר נוצרה.
  function handleSelectCustomer(customer) {
    updateForm({
      customerId: customer?.customer_id ?? null,
      appliedDiscount: Number(customer?.discount_percent ?? 0),
    })
  }

  // לקוח חדש נוצר מתוך המסך (F25) — נבחר אוטומטית ברגע שהרשימה נטענת מחדש.
  function handleCustomerCreated() {
    setCustomerDialogOpen(false)
    listCustomers()
      .then((rows) => {
        setCustomers(rows)
        const newest = rows.reduce(
          (best, c) => (best === null || c.customer_id > best.customer_id ? c : best),
          null,
        )
        if (newest) handleSelectCustomer(newest)
      })
      .catch(() => toast.error('הלקוח נשמר, אך רענון הרשימה נכשל.'))
  }

  async function handleSave() {
    // רענון "היום" ברגע השמירה, ולא הסתמכות על מה שנקבע בטעינת המסך: טופס שנשאר פתוח
    // לילה שלם היה נבדק מול תאריך של אתמול.
    const freshToday = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD בזמן מקומי
    setTodayIso(freshToday)
    setSubmitAttempted(true)
    const found = validateQuoteForm(form, lines, freshToday)
    if (Object.keys(found).length > 0) {
      toast.error('יש שדות שדורשים תיקון לפני השמירה.')
      return
    }

    setSaving(true)
    try {
      const header = buildQuoteHeader(form)
      const payload = buildQuoteLines(lines)
      if (isEditMode) {
        await saveQuoteEdit(Number(quoteId), header, payload)
        toast.success('ההצעה עודכנה.')
      } else {
        await createQuote(header, payload)
        toast.success('ההצעה נשמרה.')
      }
      navigate('/quotes')
    } catch (err) {
      toast.error(err.message || 'שמירת ההצעה נכשלה.')
    } finally {
      setSaving(false)
    }
  }

  // הגזירה עצמה. לפני ניסיון-השמירה הראשון המפה ריקה — טופס חדש לא נפתח באדום.
  const errors = submitAttempted ? validateQuoteForm(form, lines, todayIso) : {}

  if (loading) return <LoadingOrError loading />
  if (loadError) {
    return (
      <LoadingOrError
        error={loadError}
        onRetry={() => setReloadTick((t) => t + 1)}
        retryTestId="quote-load-retry"
      />
    )
  }
  if (!canEdit) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md">
        <p className="font-medium text-slate-600">אין לך הרשאת עריכה להצעות מחיר.</p>
      </div>
    )
  }
  if (vatRate === null) {
    return <LoadingOrError error='שיעור המע"מ אינו מוגדר בהגדרות המערכת — לא ניתן לתמחר הצעה.' />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {isEditMode ? `עריכת הצעה #${quoteId}` : 'הצעת מחיר חדשה'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">תוקף ההצעה: 30 יום ממועד השליחה</p>
        </div>
        <div className="flex items-center gap-2">
          {/* ⚠️ במצב-עריכה בלבד: מספר-ההצעה, תאריך-ההנפקה וחלון-התוקף אינם קיימים בטופס
              אלא רק בשורה השמורה, ובלעדיהם המסמך יוצא בלי מספר ובלי תאריכים.
              המסמך נבנה **ממה שעל המסך עכשיו** (formToPreviewQuote) ולא מהשורה השמורה —
              אחרת המשתמש היה מסתכל על גרסה אחת ושולח אחרת. אין כאן כפתור-שליחה:
              ‏`isQuoteSendable` מחזיר false כי לתצוגה-מהטופס אין סטטוס, וזה מכוון —
              שליחת גרסה שלא נשמרה הייתה מצרפת מסמך שה-DB אינו מחזיק. */}
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDocumentOpen(true)}
              className="h-auto gap-2 rounded-lg border-slate-300 px-4 py-2 text-slate-700"
              data-testid="quote-builder-document"
            >
              <Eye className="size-4" />
              צפייה במסמך
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/quotes')}
            className="h-auto gap-2 rounded-lg border-slate-300 px-4 py-2 text-slate-700"
            data-testid="quote-back"
          >
            <ArrowRight className="size-4" />
            לרשימת ההצעות
          </Button>
        </div>
      </div>

      {/* ⚠️ minmax(0,1fr) ולא 1fr: ברירת-המחדל של עמודת-גריד היא minmax(auto,1fr), כלומר היא
          **מסרבת להצטמצם** מתחת לרוחב-התוכן שלה. טבלת-המפרט נושאת min-width לקריאוּת, ולכן
          עם 1fr היא דחפה את כל העמוד לגלישה אופקית (נמדד: 1456px בחלון 1280) — והגלילה
          הפנימית של הטבלה מעולם לא נכנסה לפעולה. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex flex-col gap-4">
          {/* 1 — לקוח ופרטי האירוע */}
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-3 text-sm font-bold text-slate-700">לקוח ופרטי האירוע</h2>
            <div className="grid gap-3 md:grid-cols-12">
              <Field
                id="quote-customer"
                // התווית קצרה בכוונה: ההסבר מה החיפוש מוצא כבר כתוב בתוך התיבה עצמה
                // (placeholder), וכפילות של אותו מידע בשתי שורות היא רעש.
                label="לקוח *"
                error={errors.customerId}
                className="md:col-span-5"
              >
                <CustomerPicker
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelect={handleSelectCustomer}
                  onCreateNew={() => setCustomerDialogOpen(true)}
                  error={errors.customerId}
                />
              </Field>

              <Field
                id="quote-event-name"
                label="שם האירוע *"
                error={errors.eventName}
                className="md:col-span-4"
              >
                <Input
                  id="quote-event-name"
                  value={form.eventName}
                  onChange={(e) => updateForm({ eventName: e.target.value })}
                  className="h-9 rounded-lg border-slate-300 text-right"
                  data-testid="quote-event-name"
                />
              </Field>

              <Field
                id="quote-event-date"
                label="תאריך משוער *"
                error={errors.eventDate}
                className="md:col-span-3"
              >
                <Input
                  id="quote-event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => updateForm({ eventDate: e.target.value })}
                  className="h-9 rounded-lg border-slate-300"
                  data-testid="quote-event-date"
                />
              </Field>

              <Field
                id="quote-location"
                label="מיקום *"
                error={errors.location}
                className="md:col-span-3"
              >
                <Input
                  id="quote-location"
                  value={form.location}
                  onChange={(e) => updateForm({ location: e.target.value })}
                  className="h-9 rounded-lg border-slate-300 text-right"
                  data-testid="quote-location"
                />
              </Field>

              {/* שעות = פקד-טווח אחד ב-LTR: התחלה משמאל, סיום מימין — כמו שנקרא טווח-שעות
                  וכמו שהוא מודפס ב-PDF. שני שדות נפרדים היו מתהפכים ב-RTL (הכרעת-ישי 29/07). */}
              <div className="md:col-span-3">
                <LtrFieldGroup
                  data-testid="quote-time-range"
                  errorId="quote-times-error"
                  items={[
                    {
                      id: 'quote-start-time',
                      label: 'שעת התחלה *',
                      invalid: Boolean(errors.startTime),
                      inputProps: {
                        type: 'time',
                        value: form.startTime,
                        onChange: (e) => updateForm({ startTime: e.target.value }),
                      },
                    },
                    { op: '→' },
                    {
                      id: 'quote-end-time',
                      label: 'שעת סיום *',
                      invalid: Boolean(errors.endTime),
                      inputProps: {
                        type: 'time',
                        value: form.endTime,
                        onChange: (e) => updateForm({ endTime: e.target.value }),
                      },
                    },
                  ]}
                />
                {(errors.startTime || errors.endTime) && (
                  <p id="quote-times-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.startTime || errors.endTime}
                  </p>
                )}
              </div>

              <Field id="quote-hours" label="משך האירוע" className="md:col-span-2">
                <output
                  id="quote-hours"
                  dir="ltr"
                  className="flex h-9 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-600"
                  data-testid="quote-hours"
                >
                  {eventHours === null ? '—' : `${eventHours} שעות`}
                </output>
              </Field>

              {/* כוח אדם כנוסחה: 300 ÷ 50 = 6. שלוש משבצות קטנות בקבוצה אחת במקום שלושה
                  שדות רחבים למספרים דו-ספרתיים (הכרעת-ישי 29/07). */}
              <div className="md:col-span-4">
                <LtrFieldGroup
                  data-testid="quote-hostess-formula"
                  errorId="quote-headcount-error"
                  items={[
                    {
                      id: 'quote-guests',
                      label: 'אורחים *',
                      invalid: Boolean(errors.guests),
                      inputProps: {
                        type: 'number',
                        min: '1',
                        value: form.guests,
                        onChange: (e) => updateHeadcountInput({ guests: e.target.value }),
                      },
                    },
                    { op: '÷' },
                    {
                      id: 'quote-ratio',
                      label: 'יחס',
                      invalid: Boolean(errors.ratio),
                      inputProps: {
                        type: 'number',
                        min: '1',
                        value: form.ratio,
                        onChange: (e) => updateHeadcountInput({ ratio: e.target.value }),
                      },
                    },
                    { op: '=' },
                    {
                      id: 'quote-hostess-count',
                      label: 'דיילות *',
                      invalid: Boolean(errors.hostessCount),
                      inputProps: {
                        type: 'number',
                        min: '1',
                        value: form.hostessCount,
                        onChange: (e) => updateForm({ hostessCount: e.target.value }),
                      },
                    },
                  ]}
                />
                {/* קיצור-החזרה מופיע רק כשהמספר שהוזן שונה מההמלצה — לא כאישור על מצב תקין. */}
                {recommendedHostesses > 0 &&
                  Number(form.hostessCount) !== recommendedHostesses &&
                  !errors.hostessCount && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => updateForm({ hostessCount: recommendedHostesses })}
                      className="mt-1 h-auto p-0 text-xs text-teal-600 hover:text-teal-700"
                      data-testid="quote-hostess-reset"
                    >
                      ההמלצה: {recommendedHostesses} — החזרה
                    </Button>
                  )}
                {(errors.guests || errors.ratio || errors.hostessCount) && (
                  <p id="quote-headcount-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.guests || errors.ratio || errors.hostessCount}
                  </p>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {'ח"פ '}
                  <span dir="ltr">{selectedCustomer.company_number}</span>
                </span>
                {selectedCustomer.contact_name && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    איש קשר: {selectedCustomer.contact_name}
                  </span>
                )}
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  הנחה קבועה {Number(form.appliedDiscount)}%
                </span>
              </div>
            )}

            {/* רמזים רכים — מופיעים רק כשיש מה לומר, לא כאישור על מצב תקין. */}
            {crossesMidnight(form.startTime, form.endTime) && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                האירוע נמשך אל תוך הלילה.
              </p>
            )}
          </section>

          {/* 2 — מפרט השירותים */}
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-3 text-sm font-bold text-slate-700">מפרט השירותים</h2>
            <QuoteLineEditor
              lines={lines}
              products={catalog.products}
              tiers={catalog.tiers}
              onChange={setLines}
              error={errors.lines}
            />
            {/* השוואה מול הכמות שנקבעה בטופס (ולא מול ההמלצה) — מאז שהיא נערכת ידנית, היא
                זו שמבטאת את הכוונה, והפער שמעניין הוא בינה לבין השורות שבפועל. */}
            {actualHostesses > 0 && actualHostesses !== Number(form.hostessCount) && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                בשורות המפרט {actualHostesses} דיילות, ובפרטי האירוע נקבעו{' '}
                {Number(form.hostessCount)}.
              </p>
            )}
          </section>

          {/* 3 — הנחות והערות */}
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-3 text-sm font-bold text-slate-700">הנחות והערות</h2>
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <LtrFieldGroup
                  data-testid="quote-discounts"
                  items={[
                    {
                      id: 'quote-applied-discount',
                      label: 'קבועה',
                      value: `${Number(form.appliedDiscount)}%`,
                      readOnly: true,
                    },
                    { op: '+' },
                    {
                      id: 'quote-manual-discount',
                      label: 'נוספת',
                      inputProps: {
                        type: 'number',
                        min: '0',
                        max: '100',
                        value: form.manualDiscount,
                        onChange: (e) => updateForm({ manualDiscount: e.target.value }),
                      },
                    },
                    { op: '=' },
                    {
                      id: 'quote-total-discount',
                      label: 'סה"כ',
                      value: `${Number(form.appliedDiscount) + (Number(form.manualDiscount) || 0)}%`,
                      readOnly: true,
                    },
                  ]}
                />
                {errors.manualDiscount && (
                  <p
                    className="mt-1 text-xs font-medium text-red-600"
                    data-testid="quote-error-discount"
                  >
                    {errors.manualDiscount}
                  </p>
                )}
              </div>

              <Field
                id="quote-notes"
                label="הערות להצעה — מופיעות במסמך שנשלח ללקוח"
                className="md:col-span-8"
              >
                <textarea
                  id="quote-notes"
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus-visible:ring-3 focus-visible:ring-teal-500/50"
                  data-testid="quote-notes"
                />
              </Field>
            </div>
          </section>
        </div>

        {totals && (
          <QuoteSummaryPanel
            totals={totals}
            appliedDiscount={form.appliedDiscount}
            manualDiscount={form.manualDiscount}
            vatRate={vatRate}
            profitability={profitability}
            showProfitability={canEdit}
            onSave={handleSave}
            onCancel={() => navigate('/quotes')}
            saving={saving}
            saveLabel={isEditMode ? 'עדכון ההצעה' : 'שמור הצעה'}
          />
        )}
      </div>

      {/* אותו חלון-מסמך של מסך-הניהול, כדי שלא יהיו שני מסמכים לאותה הצעה. הוא מקבל
          "הצעה" שנבנתה מהטופס החי — ולכן שינוי כמות שטרם נשמר **כן** מופיע במסמך. */}
      {documentOpen && (
        <QuoteDocumentDialog
          open
          onOpenChange={setDocumentOpen}
          quote={formToPreviewQuote({ form, lines, savedQuote, customer: selectedCustomer })}
          productsBySku={productsBySku}
          vatRate={vatRate}
          validityDays={screenParams[QUOTE_SCREEN_PARAM_NAMES.validityDays]}
        />
      )}

      {/* F25 — טופס הלקוח של מודול 2 בשימוש חוזר כמות-שהוא, דרך props */}
      <CustomerFormDialog
        key={customerDialogOpen ? 'open' : 'closed'}
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        editingCustomer={null}
        customers={customers}
        onSaved={handleCustomerCreated}
      />
    </div>
  )
}
