// מסך הלקוחות (מודול 2, מסך 5.6.3) — רשימת הלקוחות + אזור השיווק.
// ה-Route כבר מוגן ב-ProtectedRoute allow="לקוחות" (App.jsx) וה-RLS אוכף ברמת ה-DB (תבנית §7.21),
// לכן אין כאן בדיקת הרשאה עצמאית — רק הבחנת edit-vs-view לרינדור (כלל 9: ה-UI נוחות, ה-DB החומה).
// כלל 14: אפס supabase.from כאן — כל הדאטה דרך api.js, כל הלוגיקה (תוויות/סינון/מיון) מ-src/lib/customers.js.
// מוסכמת הארכיון (מודול 1, מחייבת): אין "מחיקה" — status דו-כיווני, שורות לא-פעילות מעומעמות ולא מוסתרות.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
  Send,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import {
  CUSTOMER_TYPE_LABELS,
  archiveWarningMessage,
  countActiveFilters,
  deriveCustomerMetrics,
  matchesCustomerFilters,
  sortCustomers,
} from '@/lib/customers'
import { QUOTE_SCREEN_PARAM_NAMES } from '@/lib/quotes'
import { formatShekelWhole } from '@/lib/pricing'
import Money from '@/components/Money'
import { listCustomers, setCustomerStatus, updateCustomer } from '@/modules/02_customers/api'
import { getQuoteScreenParams, listQuotes } from '@/modules/03_quotes/api'
import CustomerFormDialog from '@/modules/02_customers/CustomerFormDialog'
import CustomersFilterSheet from '@/modules/02_customers/CustomersFilterSheet'
import MarketingPanel from '@/modules/02_customers/MarketingPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// שביעות-רצון (§7.80, הכרעת P13): כוכבים כבויים + "אין נתונים עדיין" בלבד — בלי תג-טקסט ("מצוין").
// הנתונים יגיעו רק במודול 8 (feedback_score); עד אז העמודה קיימת-אך-רדומה כדי שהמסך ישקף את האפיון.
function SatisfactionPlaceholder() {
  return (
    <div className="flex flex-col gap-0.5" title="אין נתונים עדיין">
      <div className="flex gap-0.5 text-slate-300">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="size-3" />
        ))}
      </div>
      <span className="text-xs text-slate-400">אין נתונים עדיין</span>
    </div>
  )
}

// ⚠️ פענוח ערכים מהכתובת. ההבחנה בין "לא נבחר" ל-0/false היא load-bearing:
// `minDiscount=0` הוא מסנן לגיטימי ("הנחה מ-0%") ו-`hasDiscount=false` הוא "בלי הנחה" —
// ואילו `Number(null)` הוא 0 ו-`Boolean(null)` הוא false, כלומר המרה תמימה הייתה הופכת
// "לא סיננתי" ל"סיננתי לאפס" בשקט. זו אותה מלכודת שמתועדת ב-quotes.js ("ריק אינו 0").
function numParam(value) {
  return value === null || value === '' ? undefined : Number(value)
}

function boolParam(value) {
  return value === null ? undefined : value === 'true'
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const { permissions } = useAuth()
  const confirm = useConfirm()
  const toast = useToast() // התראות אחידות (במקום window.alert) — שגיאות + משוב-הצלחה לארכוב/שחזור
  // edit-vs-view (סעיף 4 במדריך-המיקרו): רק edit מרנדר פקדים משנים; view מקבל מסך קריאה-בלבד.
  const canEdit = permissions['לקוחות'] === 'edit'

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [customers, setCustomers] = useState([])
  // הכנסות פר-לקוח (צעד 3.5). ⚠️ מחיר מודע: `listQuotes()` מביאה את **כל** ההצעות וכל
  // שורות-המפרט שלהן, בשביל עמודה אחת. נבחר ביודעין — חישוב הסכום חייב לעבור דרך ה-SSOT
  // של התמחור (§6: "לא לשכפל נוסחה"), וסכימה ב-SQL הייתה משכפלת את מדרגות ההנחות והמע"מ.
  // 🔁 זה הצרכן השני של `listQuotes()`, שכבר מסומן כמקום הראשון שיצטרך סינון-בשאילתה.
  // ⚠️ כשל כאן **אינו** מפיל את הרשימה: העמודה מציגה "—" והמסך ממשיך לעבוד.
  const [revenueByCustomer, setRevenueByCustomer] = useState(null)
  // ⚠️ **כשל-טעינה אינו "ללקוח אין הצעות"** (סבב-תיקון 31/07/2026). עד לתאריך הזה ה-catch
  // כתב `{}` — מפה **שנטענה** וריקה — ואז `handleToggleStatus` מיפה כל לקוח ל-openCount:0,
  // ‏`archiveWarningMessage` החזיר null, ו**האזהרה נעלמה לגמרי**: לקוח עם שלוש הצעות פתוחות
  // הגיע לארכיון בלי שאלה. הדגל הזה הוא המצב-השלישי המוצהר: המשתמש רואה שהנתונים לא נטענו
  // ויכול לנסות שוב, ובינתיים כל ארכוב שואל וידוא. אותה דוקטרינת "ריק אינו 0" של מודול-הכסף.
  const [revenueLoadFailed, setRevenueLoadFailed] = useState(false)
  const [consentSavingId, setConsentSavingId] = useState(null)
  // רענון הרשימה נעשה דרך "טיק" — העלאת המונה מריצה מחדש את effect-הטעינה. הדפוס הקנוני של
  // react-hooks/set-state-in-effect: ה-setState קורה רק בתגובה לתשובת ה-DB (אחרי await), לא סינכרונית,
  // ודגל cancelled מונע כתיבת-state אחרי unmount (ניווט באמצע טעינה).
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listCustomers()
        if (!cancelled) {
          setCustomers(data)
          setLoadError('')
        }
      } catch {
        if (!cancelled) setLoadError('שגיאה בטעינת רשימת הלקוחות.')
      } finally {
        if (!cancelled) setLoading(false)
      }

      // ההכנסות נטענות **בנפרד ואחרי** רשימת-הלקוחות, ובלוק try משלהן: משתמש בלי הרשאת-קריאה
      // להצעות (או תקלה ברשת) יקבל רשימת-לקוחות מלאה עם עמודת "—", ולא מסך-שגיאה במקום המסך.
      try {
        const [quoteRows, paramRows] = await Promise.all([listQuotes(), getQuoteScreenParams()])
        if (cancelled) return
        const vatRate = paramRows.find(
          (p) => p.param_name === QUOTE_SCREEN_PARAM_NAMES.vatPercent,
        )?.param_value
        const byCustomer = new Map()
        for (const quote of quoteRows) {
          const list = byCustomer.get(quote.customer_id) ?? []
          list.push(quote)
          byCustomer.set(quote.customer_id, list)
        }
        const map = {}
        for (const [id, list] of byCustomer) {
          const m = deriveCustomerMetrics([], list, vatRate)
          // נשמרים שלושה ערכים ולא רק ההכנסות: אזהרת-הארכוב (§7.34) צריכה את מספר
          // ההצעות הפתוחות ואת שוויין, והם כבר חושבו כאן — שאילתה נוספת הייתה מיותרת.
          map[id] = {
            totalRevenue: m.totalRevenue,
            openCount: m.openCount,
            openQuotesValue: m.openQuotesValue,
          }
        }
        setRevenueByCustomer(map)
        setRevenueLoadFailed(false)
      } catch {
        // ‏null ולא `{}` — ו**במפורש**, לא "להשאיר כמו שהיה": ה-effect רץ מחדש בכל reloadTick
        // (שמירת-לקוח, "נסה שוב"), וכשל אחרי טעינה מוצלחת היה משאיר מפה ישנה שנראית תקפה
        // בזמן שהבאנר מבטיח וידוא-ארכוב שלא היה קופץ.
        if (!cancelled) {
          setRevenueByCustomer(null)
          setRevenueLoadFailed(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  function reloadCustomers() {
    setReloadTick((t) => t + 1)
  }

  // מצב הדיאלוג (3.2): editingCustomer=null ⇒ הוספה; אובייקט ⇒ עריכה (דיאלוג אחד לשני המצבים,
  // הדפוס של מודול 1).
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  // מונה-פתיחה ל-key של הדיאלוג: עולה בכל פתיחה (openAdd/openEdit) → key משתנה בפתיחה ולא בסגירה,
  // כך אנימציית-היציאה של Radix מתנגנת (בניגוד ל-dialogOpen ב-key, ששבר אותה) והטופס עדיין מתאפס.
  const [dialogSeq, setDialogSeq] = useState(0)
  // אזור-השיווק כדיאלוג (הכרעת-ישי) — נפתח מכפתור-הכותרת במקום להיקבר בתחתית העמוד.
  const [marketingOpen, setMarketingOpen] = useState(false)

  function openAddDialog() {
    setEditingCustomer(null)
    setDialogSeq((s) => s + 1) // מאלץ remount → טופס נקי (ר' dialogSeq)
    setDialogOpen(true)
  }

  function openEditDialog(customer) {
    setEditingCustomer(customer)
    setDialogSeq((s) => s + 1)
    setDialogOpen(true)
  }

  // §7.11: "ערוך את הכרטיס הקיים" מתוך זרימת-הכפילות — מחליף את דיאלוג-ההוספה בעריכת הקיים.
  function handleEditExisting(customer) {
    setEditingCustomer(customer)
  }

  // ↳ 30/07/2026 (צעד 3.5): הכרטיס הפך מחלון ל**עמוד** — לחיצה על שורה מנווטת.
  function openCard(customerId) {
    navigate(`/customers/${customerId}`)
  }

  // ⚠️ חיפוש/סינון/מיון חיים ב**כתובת** ולא ב-state (הועבר 30/07/2026, צעד 3.5).
  // **הסיבה היא רגרסיה אמיתית שהמעבר לעמוד-לקוח יצר:** כשהכרטיס היה חלון, כל חמשת ערכי-המצב
  // האלה שרדו — לא עזבנו את העמוד. ברגע שהכרטיס הוא עמוד, כל "חזור" היה מאפס אותם, והמשתמש
  // שסינן לארכיון ופתח לקוח היה חוזר לרשימת הפעילים הריקה מסינון. זה לא נראה כמו באג אלא
  // כמו "המערכת שכחה". הכתובת שורדת ניווט וגם הופכת רשימה מסוננת לקישור שאפשר לשמור.
  // ⚠️ `showFilters` נשאר ב-state במכוון: הוא מתאר **איך המסך נראה**, לא "מה אני מסתכל עליו" —
  // ופאנל שנפתח מעצמו בכניסה מקישור הוא הפתעה, לא שחזור.
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // כתיבה ממוזגת לכתובת. `replace` ולא push — אחרת כל הקלדה בתיבת-החיפוש הייתה רשומת-היסטוריה
  // נפרדת, ו"חזור" היה מוחק תו-תו במקום לחזור לרשימה.
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

  // ⚠️ הסטרים האלה **חייבים** לקבל גם את צורת-העדכון-הפונקציונלית של React (`set(v => ...)`),
  // ולא רק ערך. שני אתרי-קריאה קיימים משתמשים בה (מתג-הארכיון ומתג-הדיוור), וכשהם קיבלו
  // סטר שמצפה לערך — הפונקציה עצמה הומרה למחרוזת ונכתבה לכתובת. **אפס שגיאות, אפס קריסות:**
  // הכפתור פשוט הפסיק לעבוד. נתפס ברגרסיית-E2E, לא בבנייה ולא ב-lint.
  function resolveNext(valueOrFn, current) {
    return typeof valueOrFn === 'function' ? valueOrFn(current) : valueOrFn
  }

  const searchText = searchParams.get('q') ?? ''
  const setSearchText = (value) => writeParams({ q: resolveNext(value, searchText) })
  // תצוגת-סטטוס דו-מצבית (הכרעת-ישי 11/07): 'active' (ברירת-מחדל) · 'inactive' = הארכיון בלבד.
  // ברירת-המחדל אינה נכתבת לכתובת, כדי ש-/customers יישאר נקי.
  const statusView = searchParams.get('status') ?? 'active'
  const setStatusView = (value) => {
    const next = resolveNext(value, statusView)
    writeParams({ status: next === 'active' ? undefined : next })
  }
  const sortKey = searchParams.get('sort')
  const sortDir = searchParams.get('dir') ?? 'asc'

  const filters = useMemo(
    () => ({
      customerType: searchParams.get('type') ?? undefined,
      marketingConsent: boolParam(searchParams.get('consent')),
      minDiscount: numParam(searchParams.get('minDiscount')),
      hasDiscount: boolParam(searchParams.get('hasDiscount')),
      newWithinDays: numParam(searchParams.get('newDays')),
      // הסף עצמו נשמר בכתובת ולא מחושב כאן: Date בגוף-רינדור הוא שגיאת react-hooks/purity,
      // והוא ממילא מחושב בהאנדלר של המסננת (שם מותר לקרוא לשעון).
      createdAfter: searchParams.get('createdAfter') ?? undefined,
    }),
    [searchParams],
  )

  function setFilters(valueOrFn) {
    const next = resolveNext(valueOrFn, filters)
    writeParams({
      type: next.customerType,
      consent: next.marketingConsent,
      minDiscount: next.minDiscount,
      hasDiscount: next.hasDiscount,
      newDays: next.newWithinDays,
      createdAfter: next.createdAfter,
    })
  }

  function toggleSort(key) {
    if (sortKey === key) writeParams({ dir: sortDir === 'asc' ? 'desc' : 'asc' })
    else writeParams({ sort: key, dir: 'asc' })
  }

  // הרשימה הנראית = סינון (טקסט + מסננת) ואז מיון. useMemo כדי לא לחשב מחדש בכל רינדור לא-קשור.
  // הספירה עצמה חיה ב-src/lib/customers.js ליד matchesCustomerFilters (כלל 14) — כדי שתג-הספירה
  // לא יסטה מהשדות שבאמת מסננים.
  const activeFilterCount = countActiveFilters(filters)

  const visibleCustomers = useMemo(() => {
    // מסנן-הסטטוס: 'active'/'inactive' מסננים לסטטוס יחיד, 'all' מסיר את ההגבלה (status=undefined).
    // createdAfter ("נוספו לאחרונה") מחושב במסננת (event handler) ומגיע דרך ...filters — לא כאן,
    // כדי לא לקרוא Date.now בזמן רינדור (react-hooks/purity).
    const filtered = customers
      .filter((c) =>
        matchesCustomerFilters(c, {
          text: searchText,
          ...filters,
          status: statusView, // 'active' או 'inactive' — תמיד רשימה אחת, לא שתיהן
        }),
      )
      // ההכנסות ממוזגות לשורה **לפני** המיון, כדי שהמשווה של total_revenue יחיה ב-sortCustomers
      // (מקום אחד, בדוק) ולא יישכפל כאן. null = עדיין נטען / אין הרשאה — התא יציג "—".
      .map((c) => ({
        ...c,
        total_revenue: revenueByCustomer?.[c.customer_id]?.totalRevenue ?? null,
      }))
    return sortKey ? sortCustomers(filtered, sortKey, sortDir) : filtered
  }, [customers, revenueByCustomer, searchText, filters, statusView, sortKey, sortDir])

  // מפתח-רענון לאזור-השיווק: משתנה בדיוק כשקבוצת המאושרים-הפעילים משתנה (מתג-הסכמה/ארכוב/עריכה),
  // כדי שהפאנל יביא-מחדש את רשימת-הנמענים מ-getConsentedCustomers ולא יפגר. מפתח-מטמון בלבד,
  // לא שכפול-לוגיקה — הפרדיקט האמיתי (consent AND active) חי ב-api (כלל 14).
  const consentedSignature = customers
    .filter((c) => c.marketing_consent && c.status === 'active')
    .map((c) => c.customer_id)
    .join(',')

  // מתג "מאושר לדיוור" ישירות מהרשימה (מוקאפ 01) — שינוי-הסכמה הוא פעולה תכופה שלא מצדיקה
  // פתיחת דיאלוג-עריכה מלא. עדכון אופטימי-הפוך: כותבים ל-DB קודם ומרעננים רק את השורה — כך
  // חסימת-RLS שקטה (RLS_DENIED מ-api.js) לא משאירה מתג שנראה-דלוק-אך-לא-נשמר.
  async function handleConsentToggle(customer, nextConsent) {
    setConsentSavingId(customer.customer_id)
    try {
      const updated = await updateCustomer(customer.customer_id, { marketing_consent: nextConsent })
      setCustomers((prev) => prev.map((c) => (c.customer_id === updated.customer_id ? updated : c)))
    } catch (err) {
      toast.error(err.message || 'עדכון הסכמת הדיוור נכשל.')
    } finally {
      setConsentSavingId(null)
    }
  }

  // ארכוב/שחזור דו-כיווני (מוסכמת מודול 1).
  // §7.34 — הרקע: עד צעד 3.5 לא היה כאן guard כלל ("אין נתוני quotes/projects עדיין"),
  // וברגע שמודול 3 נחת אפשר היה לארכב לקוח עם הצעה פתוחה בלי אזהרה ובלי חיווי.
  // ההכרעה ניתנה 30/07/2026 והיא **בנויה** — הנוסח המלא שלה בהערה שעל התנאי שלמטה.
  // בלי חלון-וידוא (הכרעת-ישי 11/07): הארכוב הפיך לחלוטין (שחזור בלחיצה מרשימת-הארכיון), פעולה
  // נמוכת-סיכון — וידוא כאן הוא חיכוך מיותר. עיקרון: וידוא רק לפעולות קריטיות (למשל השבתת-משתמש במ1).
  async function handleToggleStatus(customer) {
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active'

    // §7.34 — הכרעת-ישי 30/07/2026: **מתריעים, לא חוסמים.** ⚠️ חלון-הווידוא מותנה ומופיע
    // **רק** כשיש הצעות פתוחות — הכרעת-11/07 ("ארכוב בלי וידוא, הפעולה הפיכה") נשמרת
    // במקרה הרגיל. למה לא חסימה: ההצעה הפתוחה היא לרוב **הסיבה** לארכוב, וחסימה הייתה
    // מכריחה לדחות הצעה רק כדי לארכב לקוח. ⛔ ובמפורש **לא** סוגרים את ההצעות אוטומטית —
    // זו כתיבה לרשומות-כסף שהמשתמש לא ביקש.
    // §7.34 — הכלל עצמו (כולל "לא-ידוע ⇒ שואלים") חי ב-`archiveWarningMessage` ונבדק שם.
    if (nextStatus === 'inactive') {
      // ⚠️ לקוח **בלי הצעות כלל** אינו מופיע במפה, ו-`undefined` שלו נראה זהה ל"טרם נטען".
      // לכן כשהמפה נטענה, היעדר-רשומה מנורמל במפורש ל"אפס פתוחות" — אחרת כל לקוח נקי
      // היה מקבל אזהרת "לא ידוע", וזו בדיוק ההפרעה שהכרעת-11/07 באה למנוע.
      const metrics =
        revenueByCustomer === null
          ? null
          : (revenueByCustomer[customer.customer_id] ?? { openCount: 0 })
      const message = archiveWarningMessage(customer.company_name, metrics, formatShekelWhole)
      if (message) {
        const ok = await confirm({
          title:
            revenueByCustomer === null ? 'טרם ידוע אם יש הצעות פתוחות' : 'ללקוח יש הצעות פתוחות',
          message,
          confirmLabel: 'העבר לארכיון',
        })
        if (!ok) return
      }
    }

    try {
      const updated = await setCustomerStatus(customer.customer_id, nextStatus)
      setCustomers((prev) => prev.map((c) => (c.customer_id === updated.customer_id ? updated : c)))
      // משוב-הצלחה לא-חוסם (מחליף את המשוב שאיבדנו כשהסרנו את חלון-הווידוא מהארכוב).
      toast.success(nextStatus === 'inactive' ? 'הלקוח הועבר לארכיון' : 'הלקוח שוחזר')
    } catch (err) {
      toast.error(err.message || 'שינוי סטטוס הלקוח נכשל.')
    }
  }

  if (loading) {
    return <LoadingOrError loading />
  }

  if (loadError) {
    return (
      <LoadingOrError
        error={loadError}
        onRetry={reloadCustomers}
        retryTestId="customers-load-retry"
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-md p-6" data-testid="customers-list-card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-slate-800">רשימת לקוחות</h1>
          {canEdit && (
            <div className="flex items-center gap-2">
              {/* אזור-השיווק עבר מתחתית-העמוד לדיאלוג-בכפתור (הכרעת-ישי) — כדי שלא ייקבר מתחת
                  לרשימה ארוכה. משני (outline); הפעולה הראשית נשארת הוספת-לקוח. */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setMarketingOpen(true)}
                className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700 gap-2"
                data-testid="marketing-open-button"
              >
                <Send className="size-4" />
                שליחת חומר שיווקי
              </Button>
              <Button
                onClick={openAddDialog}
                className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                data-testid="customer-add-button"
              >
                + לקוח חדש
              </Button>
            </div>
          )}
        </div>

        <CustomerFormDialog
          // key = איפוס-טופס דרך remount (הדיאלוג מאותחל מ-props בלי effect): משתנה בכל פתיחה
          // (dialogSeq עולה) ובכל החלפת-לקוח (id) — כולל "ערוך את הכרטיס הקיים" (§7.11). לא כולל
          // סגירה, כדי שאנימציית-היציאה של Radix תתנגן (dialogOpen ב-key שבר אותה).
          key={`${dialogSeq}-${editingCustomer?.customer_id ?? 'new'}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingCustomer={editingCustomer}
          customers={customers}
          onSaved={reloadCustomers}
          onEditExisting={handleEditExisting}
        />

        {/* נתוני-ההצעות נכשלו: הרשימה עצמה תקינה וממשיכה לעבוד, ולכן התראה לא-חוסמת ולא
            מסך-שגיאה. הנוסח אומר גם מה **כן** משתנה בהתנהגות — כל ארכוב ישאל וידוא — כדי
            שהשאלה הנוספת לא תיראה כתקלה. הגוון מועתק מבאנר-האזהרה של QuotesPage (מעבר-אחידות). */}
        {revenueLoadFailed && (
          <div
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 mb-4 flex items-center justify-between gap-3 flex-wrap"
            role="alert"
            data-testid="customers-revenue-error"
          >
            <p className="text-sm text-amber-800">
              נתוני ההצעות לא נטענו — עמודת ההכנסות ריקה, וכל העברה לארכיון תבקש וידוא גם ללקוח שאין
              לו הצעות פתוחות.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={reloadCustomers}
              className="h-auto py-1.5 px-3 rounded-lg border-amber-300 text-amber-800 shrink-0"
              data-testid="customers-revenue-retry"
            >
              נסה שוב
            </Button>
          </div>
        )}

        {customers.length === 0 ? (
          // מצב-ריק: הטבלה ריקה בפרויקט החי (ה-seed הוסר בהכרעת-ישי 10/07) — זהו המצב הראשון שנראה.
          <div className="py-12 text-center" data-testid="customers-empty-state">
            <p className="text-slate-500 font-medium">אין לקוחות במערכת עדיין.</p>
            {canEdit && (
              <p className="text-slate-400 text-sm mt-1">
                לחצו על "+ לקוח חדש" כדי להוסיף את הלקוח הראשון.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* הכרעת P13: תיבת-חיפוש-אחת (החיפוש הסלחני §7.11) + כפתור-סינון שפותח את המסננת המתקדמת */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[12rem] max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={'חיפוש לפי שם חברה, איש קשר או ח"פ...'}
                  className="h-auto py-2.5 pr-10 pl-3 text-right rounded-lg border-slate-300"
                  data-testid="customers-search"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters((v) => !v)}
                className="h-auto py-2.5 px-4 rounded-lg border-slate-300 text-slate-700 gap-2"
                data-testid="customers-filter-toggle"
              >
                <SlidersHorizontal className="size-4" />
                סינון
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {/* preset "קהל דיוור" = פעילים + מאושרי-דיוור (קהל ה-BCC). chip מהיר שמשקף/מחליף את
                  filters.marketingConsent; הדלקה גם מחזירה את מסנן-הסטטוס ל"פעילים" (קהל-דיוור = פעילים בלבד). */}
              <Button
                type="button"
                onClick={() => {
                  const turningOn = filters.marketingConsent !== true
                  setFilters((f) => ({ ...f, marketingConsent: turningOn ? true : undefined }))
                  if (turningOn) setStatusView('active')
                }}
                className={cn(
                  'h-auto py-2.5 px-4 rounded-lg gap-2',
                  filters.marketingConsent === true
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
                data-testid="customers-preset-marketing"
              >
                קהל דיוור
              </Button>
              {/* כפתור-יחיד לתצוגת-הארכיון (הכרעת-ישי 11/07): בתצוגת הפעילים הוא מוביל לארכיון;
                  בתצוגת הארכיון הוא חוזר לפעילים. אף פעם לא מציג את שתי הרשימות יחד. */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusView((v) => (v === 'active' ? 'inactive' : 'active'))}
                aria-pressed={statusView === 'inactive'}
                className="h-auto py-2.5 px-4 rounded-lg border-slate-300 text-slate-700 gap-2"
                data-testid="customers-archive-toggle"
              >
                {statusView === 'active' ? (
                  <>
                    <Archive className="size-4" />
                    ארכיון
                  </>
                ) : (
                  <>
                    <ArrowRight className="size-4" />
                    חזרה לפעילים
                  </>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="mb-4">
                <CustomersFilterSheet filters={filters} onChange={setFilters} />
              </div>
            )}

            {visibleCustomers.length === 0 ? (
              // אף שורה לא עוברת את הסינון. הקופי תלוי-הקשר (תיקון 11/07): חיפוש/סינון פעיל ⇒ "אין
              // תוצאות + שנו חיפוש"; אחרת ⇒ ארכיון-ריק או אין-פעילים — כדי לא להציע "לשנות חיפוש"
              // כשאין חיפוש כלל (המצב הקודם היה מטעה בתצוגת-הארכיון הריקה).
              <div className="py-12 text-center" data-testid="customers-no-results">
                {searchText.trim() !== '' || activeFilterCount > 0 ? (
                  <>
                    <p className="text-slate-500 font-medium">אין לקוחות התואמים את החיפוש.</p>
                    <p className="text-slate-500 text-sm mt-1">
                      נסו לשנות את מונחי החיפוש או לנקות את הסינון.
                    </p>
                  </>
                ) : statusView === 'inactive' ? (
                  <p className="text-slate-500 font-medium">אין לקוחות בארכיון.</p>
                ) : (
                  <p className="text-slate-500 font-medium">
                    אין לקוחות פעילים — כל הלקוחות בארכיון.
                  </p>
                )}
              </div>
            ) : (
              // עטיפת-גלילה אופקית: 11 עמודות גולשות במסך צר (מובייל) — min-w שומר על רוחב קריא
              // והעטיפה גוללת במקום לרסק עמודות; במסך רחב w-full נמתח כרגיל.
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[56rem] text-right border-collapse"
                  data-testid="customers-table"
                >
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <SortableHeader
                        label="שם לקוח"
                        colKey="company_name"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="py-2 font-medium">ח"פ</th>
                      <SortableHeader
                        label="סוג לקוח"
                        colKey="customer_type"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="py-2 font-medium">איש קשר</th>
                      <th className="py-2 font-medium">טלפון</th>
                      <th className="py-2 font-medium">אימייל</th>
                      <SortableHeader
                        label="% הנחה"
                        colKey="discount_percent"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="py-2 font-medium">תוכן שיווקי</th>
                      {/* צעד 3.5 — "מי הלקוחות הגדולים שלי?". הכרעת-ישי: עמודה עם מיון ולא
                          מסננת, כי מסננת מחייבת להמציא סף שרירותי ("מעל כמה ₪?") ומיון עונה
                          ישירות. הערך נגזר מההצעות המאושרות דרך ה-SSOT של התמחור. */}
                      <SortableHeader
                        label={'סה"כ הכנסות'}
                        colKey="total_revenue"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="py-2 font-medium">שביעות רצון</th>
                      <SortableHeader
                        label="סטטוס"
                        colKey="status"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="py-2 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => {
                      const isActive = customer.status === 'active'
                      return (
                        <tr
                          key={customer.customer_id}
                          data-testid={`customer-row-${customer.customer_id}`}
                          onClick={() => openCard(customer.customer_id)}
                          // נגישות-מקלדת (תיקון 11/07): השורה נפתחה רק בעכבר. tabIndex+onKeyDown פותחים
                          // ב-Enter/רווח; focus-ring מסמן מיקוד. (סמנטיקת-row-as-button המלאה — מעבר a11y מ12.)
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openCard(customer.customer_id)
                            }
                          }}
                          aria-label={`פתח כרטיס לקוח: ${customer.company_name}`}
                          className={cn(
                            'border-b border-slate-100 cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                            !isActive && 'opacity-60',
                          )}
                        >
                          <td className="py-3 font-medium">{customer.company_name}</td>
                          <td className="py-3 text-slate-600" dir="ltr">
                            {customer.company_number}
                          </td>
                          <td className="py-3 text-slate-600">
                            {CUSTOMER_TYPE_LABELS[customer.customer_type] ?? customer.customer_type}
                          </td>
                          <td className="py-3 text-slate-600">{customer.contact_name}</td>
                          <td className="py-3 text-slate-600" dir="ltr">
                            {customer.phone}
                          </td>
                          <td className="py-3 text-slate-600" dir="ltr">
                            {customer.email}
                          </td>
                          <td className="py-3 text-slate-600">
                            {Number(customer.discount_percent ?? 0)}%
                          </td>
                          {/* stopPropagation: פקד תוך-שורה (מתג/כפתורים) לא פותח את כרטיס-הלקוח */}
                          <td className="py-3" onClick={(e) => e.stopPropagation()}>
                            {canEdit ? (
                              <ConsentSwitch
                                customer={customer}
                                saving={consentSavingId === customer.customer_id}
                                onToggle={handleConsentToggle}
                              />
                            ) : (
                              // מצב view: מציגים את העובדה בלבד, בלי פקד משנה (edit-vs-view, סעיף 4).
                              <span className="text-sm text-slate-600">
                                {customer.marketing_consent ? 'מאושר' : 'לא מאושר'}
                              </span>
                            )}
                          </td>
                          {/* "—" מבדיל בכוונה בין "עדיין נטען / אין הרשאה להצעות" (null) לבין
                              "0 ₪" שהוא עובדה נכונה על לקוח שטרם סגר עסקה. */}
                          <td className="py-3 text-slate-700">
                            {customer.total_revenue == null ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <Money amount={customer.total_revenue} />
                            )}
                          </td>
                          <td className="py-3">
                            <SatisfactionPlaceholder />
                          </td>
                          <td className="py-3">
                            <span
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-200 text-slate-600',
                              )}
                            >
                              {isActive ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="py-3" onClick={(e) => e.stopPropagation()}>
                            {canEdit ? (
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="link"
                                  title="ערוך לקוח"
                                  aria-label={`ערוך לקוח: ${customer.company_name}`}
                                  onClick={() => openEditDialog(customer)}
                                  className="h-auto p-0 text-teal-600 hover:text-teal-700"
                                  data-testid={`customer-edit-${customer.customer_id}`}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                {/* אפשרות ב (הכרעת-ישי 11/07): צ'יפ צבוע-לפי-פעולה — ענבר לארכוב, טורקיז
                                  לשחזור — כדי שההבחנה בין "ארכב" ל"שחזר" תהיה מיידית (האייקונים לבדם,
                                  שתי קופסאות דומות, בלבלו). לא "פח אדום": ארכוב הפיך, לא מחיקה. */}
                                {isActive ? (
                                  <Button
                                    type="button"
                                    variant="link"
                                    title="העבר לארכיון"
                                    aria-label={`העבר לארכיון: ${customer.company_name}`}
                                    onClick={() => handleToggleStatus(customer)}
                                    className="h-auto p-0"
                                    data-testid={`customer-archive-${customer.customer_id}`}
                                  >
                                    <span className="inline-flex size-7 items-center justify-center rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                                      <Archive className="size-4" />
                                    </span>
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="link"
                                    title="שחזר מהארכיון"
                                    aria-label={`שחזר מהארכיון: ${customer.company_name}`}
                                    onClick={() => handleToggleStatus(customer)}
                                    className="h-auto p-0"
                                    data-testid={`customer-restore-${customer.customer_id}`}
                                  >
                                    <span className="inline-flex size-7 items-center justify-center rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                                      <ArchiveRestore className="size-4" />
                                    </span>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
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

      {/* אזור השיווק (3.5) — עבר לדיאלוג שנפתח מכפתור-הכותרת (הכרעת-ישי; לא נקבר מתחת לרשימה).
          edit-only: הכפתור והדיאלוג מרונדרים רק ל-edit (edit-vs-view, סעיף 4). */}
      {canEdit && (
        <Dialog open={marketingOpen} onOpenChange={setMarketingOpen}>
          <DialogContent dir="rtl" className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>שליחת חומר שיווקי</DialogTitle>
              <DialogDescription>העלו חומר ושלחו אותו ללקוחות שאישרו קבלת דיוור.</DialogDescription>
            </DialogHeader>
            <MarketingPanel refreshKey={consentedSignature} embedded />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// כותרת-עמודה הניתנת למיון (3.3) — קומפוננטה עליונה (react-hooks/static-components). הלחיצה רק
// מדווחת למעלה (onSort); המיון עצמו נעשה ב-sortCustomers (src/lib/customers.js) — הרכיב לא ממיין.
function SortableHeader({ label, colKey, sortKey, sortDir, onSort }) {
  const active = sortKey === colKey
  return (
    <th className="py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={cn(
          'flex items-center gap-1 font-medium hover:text-slate-700',
          active && 'text-teal-600',
        )}
        data-testid={`customers-sort-${colKey}`}
      >
        {label}
        {active &&
          (sortDir === 'asc' ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          ))}
      </button>
    </th>
  )
}

// מתג ההסכמה מופרד כדי שהשורה לא תרנדר-מחדש את כל הטבלה בכל שמירה; ה-Switch (shadcn) כבר teal
// לפי שפת-העיצוב §4 (data-[state=checked]:bg-teal-600) — אין כאן צבע ידני.
function ConsentSwitch({ customer, saving, onToggle }) {
  return (
    <Switch
      dir="rtl"
      checked={!!customer.marketing_consent}
      disabled={saving}
      onCheckedChange={(next) => onToggle(customer, next)}
      data-testid={`customer-consent-${customer.customer_id}`}
      aria-label={`מאושר לדיוור: ${customer.company_name}`}
    />
  )
}
