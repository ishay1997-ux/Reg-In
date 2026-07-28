// מסך הלקוחות (מודול 2, מסך 5.6.3) — רשימת הלקוחות + אזור השיווק.
// ה-Route כבר מוגן ב-ProtectedRoute allow="לקוחות" (App.jsx) וה-RLS אוכף ברמת ה-DB (תבנית §7.21),
// לכן אין כאן בדיקת הרשאה עצמאית — רק הבחנת edit-vs-view לרינדור (כלל 9: ה-UI נוחות, ה-DB החומה).
// כלל 14: אפס supabase.from כאן — כל הדאטה דרך api.js, כל הלוגיקה (תוויות/סינון/מיון) מ-src/lib/customers.js.
// מוסכמת הארכיון (מודול 1, מחייבת): אין "מחיקה" — status דו-כיווני, שורות לא-פעילות מעומעמות ולא מוסתרות.

import { useEffect, useMemo, useState } from 'react'
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
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import {
  CUSTOMER_TYPE_LABELS,
  countActiveFilters,
  matchesCustomerFilters,
  sortCustomers,
} from '@/lib/customers'
import { listCustomers, setCustomerStatus, updateCustomer } from '@/modules/02_customers/api'
import CustomerFormDialog from '@/modules/02_customers/CustomerFormDialog'
import CustomersFilterSheet from '@/modules/02_customers/CustomersFilterSheet'
import MarketingPanel from '@/modules/02_customers/MarketingPanel'
import CustomerDetailsCard from '@/modules/02_customers/CustomerDetailsCard'
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

export default function CustomersPage() {
  const { permissions } = useAuth()
  const toast = useToast() // התראות אחידות (במקום window.alert) — שגיאות + משוב-הצלחה לארכוב/שחזור
  // edit-vs-view (סעיף 4 במדריך-המיקרו): רק edit מרנדר פקדים משנים; view מקבל מסך קריאה-בלבד.
  const canEdit = permissions['לקוחות'] === 'edit'

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [customers, setCustomers] = useState([])
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

  // כרטיס הלקוח (3.6): נפתח בלחיצה על שורה. שומר רק את ה-id — הכרטיס עצמו קורא getCustomer טרי.
  const [cardCustomerId, setCardCustomerId] = useState(null)
  const [cardOpen, setCardOpen] = useState(false)

  function openCard(customerId) {
    setCardCustomerId(customerId)
    setCardOpen(true)
  }

  // חיפוש/סינון/מיון (3.3) — הכרעת P13: תיבת-חיפוש-אחת. הטקסט מנוהל בנפרד מהמסננת המתקדמת
  // (סוג/דיוור/הנחה) כדי לשלב אותם ב-filters object אחד ל-matchesCustomerFilters (src/lib/customers.js).
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({}) // { customerType, marketingConsent, minDiscount, hasDiscount, newWithinDays }
  const [showFilters, setShowFilters] = useState(false)
  // תצוגת-סטטוס דו-מצבית (הכרעת-ישי 11/07): כפתור-יחיד שמוביל לארכיון ובחזרה, במקום toggle שהראה
  // פעילים+ארכיון יחד (בלבל). 'active'=רשימת הפעילים (ברירת-מחדל) · 'inactive'=רשימת הארכיון בלבד.
  // לעולם לא מציגים את שניהם יחד — מכוון (סטייה ממוסכמת-מודול-1 show-all+dim). §9 במדריך.
  const [statusView, setStatusView] = useState('active')
  // מיון בלחיצת-כותרת: sortKey ∈ {company_name, customer_type, discount_percent, status}; dir אסק/דסק.
  // null = ללא מיון (סדר-הטעינה מ-api, שהוא לפי company_name). המשווה עצמו חי ב-sortCustomers — לא כאן.
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // הרשימה הנראית = סינון (טקסט + מסננת) ואז מיון. useMemo כדי לא לחשב מחדש בכל רינדור לא-קשור.
  // הספירה עצמה חיה ב-src/lib/customers.js ליד matchesCustomerFilters (כלל 14) — כדי שתג-הספירה
  // לא יסטה מהשדות שבאמת מסננים.
  const activeFilterCount = countActiveFilters(filters)

  const visibleCustomers = useMemo(() => {
    // מסנן-הסטטוס: 'active'/'inactive' מסננים לסטטוס יחיד, 'all' מסיר את ההגבלה (status=undefined).
    // createdAfter ("נוספו לאחרונה") מחושב במסננת (event handler) ומגיע דרך ...filters — לא כאן,
    // כדי לא לקרוא Date.now בזמן רינדור (react-hooks/purity).
    const filtered = customers.filter((c) =>
      matchesCustomerFilters(c, {
        text: searchText,
        ...filters,
        status: statusView, // 'active' או 'inactive' — תמיד רשימה אחת, לא שתיהן
      }),
    )
    return sortKey ? sortCustomers(filtered, sortKey, sortDir) : filtered
  }, [customers, searchText, filters, statusView, sortKey, sortDir])

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

  // ארכוב/שחזור דו-כיווני (מוסכמת מודול 1; §7.34: בלי guard על התחייבויות פעילות — אין נתוני
  // quotes/projects עדיין). §7.34 מסומן OPEN — כשמודול 3 קיים, זו הופכת לאזהרה-לא-חסימה (בלדג'ר).
  // בלי חלון-וידוא (הכרעת-ישי 11/07): הארכוב הפיך לחלוטין (שחזור בלחיצה מרשימת-הארכיון), פעולה
  // נמוכת-סיכון — וידוא כאן הוא חיכוך מיותר. עיקרון: וידוא רק לפעולות קריטיות (למשל השבתת-משתמש במ1).
  async function handleToggleStatus(customer) {
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active'
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
          <h2 className="text-lg font-bold text-slate-800">רשימת לקוחות</h2>
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
          <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>שליחת חומר שיווקי</DialogTitle>
              <DialogDescription>העלו חומר ושלחו אותו ללקוחות שאישרו קבלת דיוור.</DialogDescription>
            </DialogHeader>
            <MarketingPanel refreshKey={consentedSignature} embedded />
          </DialogContent>
        </Dialog>
      )}

      {/* כרטיס הלקוח (3.6) — נפתח בלחיצה על שורה; קורא getCustomer טרי לפי ה-id.
          key=customerId ⇒ remount טרי לכל לקוח (loading מתאפס, בלי effect-סנכרון) */}
      <CustomerDetailsCard
        key={cardCustomerId ?? 'none'}
        open={cardOpen}
        onOpenChange={setCardOpen}
        customerId={cardCustomerId}
      />
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
