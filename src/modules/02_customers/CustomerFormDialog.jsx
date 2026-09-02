// דיאלוג הוספה/עריכה של לקוח (מסך 5.6.3, מוקאפים 05-06) — כל שדות האפיון הקפוא 1.5.3.
// ולידציה דו-שכבתית לפי C5 §5.6.17.4 (חובת-אפיון): (1) צד-לקוח ב-blur — משוב מיידי מתחת לשדה,
// בלי round-trip; (2) בשמירה — כותבים ל-DB רק כשכל השדות תקינים. ה-constraints ב-DB הם החומה
// האמיתית (ח"פ 9 ספרות, הנחה 0-100) — הוולידציה כאן נוחות בלבד (כלל 9).
// זרימת-הכפילות §7.11: ח"פ קיים ופעיל ⇒ שגיאה ידידושית עם שם הלקוח + קפיצה לעריכת הכרטיס הקיים;
// ח"פ קיים בארכיון ⇒ הצעת שחזור מפורשת (אושר 07/07). ח"פ לעולם לא משתנה בעריכה (קיבוע מודול 2).
//
// 🔴 N2 (02/09/2026, מוקאפ מאושר docs/mockups/customers-screen/08_contacts_form_approved.html,
// הכרעת-ישי 27/08): איש-הקשר הראשי מפסיק להיות שלושה שדות מיוחדים בראש הטופס ונכנס לאותה רשימה
// ככל אנשי-הקשר — שורה אחת, מסומנת בצ'יפ+מסגרת, לא "ראשי" מעל "אחרים". `contacts` הוא עכשיו
// הרשימה **המלאה** (כולל הראשי), וכל שורה נבדקת באותה ולידציה בדיוק (validateExtraContacts).
// "בדיוק ראשי אחד" נאכף כאן לפני הכתיבה — תואם את מה שה-RPC replace_customer_contacts (N2ב)
// אוכף בשרת. מחיקת הראשי חסומה תמיד (לא רק כשהיא השורה היחידה) — זו הכרעת-מוצר מפורשת, לא
// תוצאה של "אין למי להעביר את הדגל": "הפוך לראשי" על שורה אחרת מזיז את הדגל, ורק אז מחיקת
// השורה הישנה (שכבר אינה ראשית) מותרת.
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CUSTOMER_TYPE_LABELS,
  primaryContact,
  validateCustomerField,
  validateCustomerForm,
  validateExtraContacts,
} from '@/lib/customers'
import {
  createCustomer,
  updateCustomer,
  setCustomerStatus,
  listCustomerContacts,
  replaceCustomerContacts,
} from '@/modules/02_customers/api'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  company_name: '',
  company_number: '',
  customer_type: '',
  discount_percent: '0',
  marketing_consent: false,
}

// מפתח-שורה יציב לאנשי-הקשר (§7.81, N2): index-key שובר את ה-reconciliation בהסרת-שורה.
// מוגדל ב-handler בלבד (לא ברינדור) — לכן לא מפר react-hooks/purity.
let nextContactRowKey = 1

// הודעת-שגיאה מתחת לשדה (חובת-אפיון) — קומפוננטה עליונה (כלל react-hooks/static-components:
// קומפוננטה שמוגדרת בתוך render מאבדת state בכל רינדור).
function FieldError({ name, message }) {
  if (!message) return null
  return (
    <p className="text-red-600 text-sm" data-testid={`customer-field-error-${name}`}>
      {message}
    </p>
  )
}

// המשפט המדויק שה-RPC (replace_customer_contacts, N2ב) זורק כשאין ראשי בכלל — נשמר מילה-במילה
// גם בצד-הלקוח כדי שהודעת-החסימה תהיה עקבית בין "ניסית למחוק אותו" לבין "המצב הגיע לשם בכל דרך".
const NO_PRIMARY_MSG = 'אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי.'
// ואותו דבר לשני-ראשיים בבת-אחת — מצב שה-UI אמור למנוע מלכתחילה ("הפוך לראשי" מזיז ולא מכפיל),
// אך נבדק כאן הגנתית ובאותו נוסח כמו השרת.
const TWO_PRIMARY_MSG = 'ניתן לסמן איש קשר ראשי אחד בלבד.'

// ⚠️ הקומפוננטה מאותחלת מ-editingCustomer ב-useState בלבד (בלי effect-סנכרון) — עמוד-האב חייב
// לרנדר אותה עם key שמשתנה בכל פתיחה/החלפת-לקוח (remount = איפוס-טופס). זה הדפוס הקנוני של
// react-hooks/set-state-in-effect לטפסים שנפתחים מחדש.
export default function CustomerFormDialog({
  open,
  onOpenChange,
  editingCustomer, // null = הוספה; אובייקט לקוח = עריכה
  customers, // הרשימה הטעונה — לזיהוי כפילות-ח"פ (§7.11) בלי שאילתה נוספת
  onSaved, // callback לרענון הרשימה בעמוד-האב
  onEditExisting, // §7.11: "ערוך את הכרטיס הקיים" — העמוד מחליף את הדיאלוג ללקוח הקיים
}) {
  const isEdit = !!editingCustomer

  // אתחול חד-פעמי מ-props (remount דרך key בעמוד-האב מחליף effect-סנכרון — ר' ההערה מעל).
  const [form, setForm] = useState(() =>
    editingCustomer
      ? {
          company_name: editingCustomer.company_name ?? '',
          company_number: editingCustomer.company_number ?? '',
          customer_type: editingCustomer.customer_type ?? '',
          discount_percent: String(editingCustomer.discount_percent ?? 0),
          marketing_consent: !!editingCustomer.marketing_consent,
        }
      : EMPTY_FORM,
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  // duplicate = תוצאת זיהוי-הכפילות (§7.11): {customer, isActive} — מרנדר את הזרימה הידידותית.
  const [duplicate, setDuplicate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  // N2: רשימת אנשי-הקשר **המלאה** (כולל הראשי) — כל שורה {_rk, contact_name, phone, email,
  // is_primary}. במצב-הוספה מתחילה עם שורה ריקה אחת מסומנת-ראשי (אין דו-משמעות: יש רק שורה
  // אחת, והיא חייבת להיות הראשי). במצב-עריכה מתחילה ריקה ונטענת מה-DB (ר' ה-effect למטה).
  const [contacts, setContacts] = useState(() =>
    editingCustomer
      ? []
      : [{ _rk: nextContactRowKey++, contact_name: '', phone: '', email: '', is_primary: true }],
  )
  // שגיאות-ולידציה פר-שורת-איש-קשר (§7.81, הכרעת-ישי 11/07): שם חובה + טלפון או אימייל. מפתח = _rk,
  // הערך = {field, msg} כדי לצבוע את השדה הרלוונטי באדום ('both' = טלפון+אימייל יחד).
  const [contactErrors, setContactErrors] = useState({})
  // N2: הודעת "בדיוק ראשי אחד" — מחושבת בשמירה, לא רציפה (אותה מוסכמה כמו fieldErrors/contactErrors:
  // מוצג אחרי ניסיון-שמירה, לא מנטרל את הכפתור בשקט — "בקרה חסומה נושאת משפט").
  const [primaryError, setPrimaryError] = useState('')
  // תיקון אובדן-נתונים (11/07): במצב-עריכה שומרים אנשי-קשר רק אחרי טעינה מוצלחת. בלי זה, כשל-טעינה
  // שקט היה משאיר contacts=[] ובשמירה replaceCustomerContacts היה מוחק את כל אנשי-הקשר הקיימים ב-DB.
  // add-mode: אין מה לטעון ⇒ מותר לשמור מיד (true).
  const [contactsLoaded, setContactsLoaded] = useState(!editingCustomer)
  const [contactsLoadError, setContactsLoadError] = useState(false)

  // טעינת אנשי-הקשר הקיימים בעריכה (fetch, לא sync-מ-props). remount-דרך-key באב מריץ פעם אחת.
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listCustomerContacts(editingCustomer.customer_id)
        if (!cancelled) {
          setContacts(
            rows.map((r) => ({
              _rk: nextContactRowKey++,
              contact_name: r.contact_name ?? '',
              phone: r.phone ?? '',
              email: r.email ?? '',
              is_primary: !!r.is_primary,
            })),
          )
          // רק אחרי טעינה מוצלחת מותר ל-replaceCustomerContacts לרוץ בשמירה (מונע מחיקה עקב כשל-טעינה).
          setContactsLoaded(true)
        }
      } catch {
        // כשל-טעינה לא חוסם עריכת-לקוח, אבל חוסם את שמירת אנשי-הקשר (contactsLoaded נשאר false) כדי
        // לא למחוק את הקיימים ב-DB; מציגים אזהרה גלויה במקום כשל שקט.
        if (!cancelled) setContactsLoadError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, editingCustomer])

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    // שינוי-שדה מנקה את שגיאתו (המשוב הבא יגיע ב-blur) — כך שדות תקינים לא "נתקעים" אדומים.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
    if (name === 'company_number') setDuplicate(null)
  }

  // ניהול שורות אנשי-הקשר (N2, §7.81) — לפי מפתח-שורה יציב (_rk), לא index.
  function addContactRow() {
    setContacts((prev) => [
      ...prev,
      { _rk: nextContactRowKey++, contact_name: '', phone: '', email: '', is_primary: false },
    ])
    setPrimaryError('')
  }
  function updateContactRow(rk, field, value) {
    setContacts((prev) => prev.map((c) => (c._rk === rk ? { ...c, [field]: value } : c)))
    // ניקוי שגיאת-השורה תוך-כדי הקלדה — המשוב הבא יגיע בשמירה הבאה (כמו שדות-הטופס הראשיים).
    setContactErrors((prev) => (prev[rk] ? { ...prev, [rk]: '' } : prev))
  }
  // מחיקת הראשי חסומה תמיד (הכרעת-מוצר מפורשת, לא רק "אין למי להעביר") — ההגנה כאן ולא רק
  // בנטרול-הכפתור, כך שהפונקציה עצמה בטוחה גם אם ייקרא אליה ממקום אחר בעתיד.
  function removeContactRow(rk) {
    setContacts((prev) => {
      const row = prev.find((c) => c._rk === rk)
      if (row?.is_primary) return prev
      return prev.filter((c) => c._rk !== rk)
    })
  }
  // "הפוך לראשי" — מזיז את הדגל, לעולם לא מכפיל אותו (בדיוק שורה אחת מקבלת is_primary:true).
  function makePrimary(rk) {
    setContacts((prev) => prev.map((c) => ({ ...c, is_primary: c._rk === rk })))
    setPrimaryError('')
  }

  // שכבה 1 (C5 §5.6.17.4): ולידציה ב-blur — משוב מיידי מתחת לשדה, בלי לחכות לשמירה.
  function handleBlur(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: validateCustomerField(name, form[name]) }))
  }

  // §7.11: זיהוי כפילות-ח"פ מול הרשימה הטעונה (הטבלה קטנה והרשימה כבר ביד — בלי שאילתה נוספת).
  // 23505 מה-DB נשאר כרשת-ביטחון למרוץ (לקוח נוסף ממכונה אחרת אחרי הטעינה).
  function findDuplicate(companyNumber) {
    return (customers ?? []).find((c) => c.company_number === companyNumber.trim()) ?? null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setDuplicate(null)

    // שכבה 2: ולידציה מלאה לפני כתיבה — כל השדות נבדקים, שדות תקינים נשמרים בטופס (חובת-אפיון).
    // הכללים עצמם חיים ב-src/lib/customers.js (SSOT, כלל 14) ונבדקים שם; כאן רק הזרימה.
    const errors = validateCustomerForm(form)
    setFieldErrors(errors)

    // N2: כשטעינת אנשי-הקשר נכשלה (contactsLoadError) אין לנו נתון אמיתי לבדוק — בדיוק כמו
    // שהשמירה עצמה מדלגת על replaceCustomerContacts במקרה הזה (contactsLoaded), הולידציה כאן
    // מדלגת גם היא, כדי לא לחסום שמירת שאר פרטי הלקוח על סמך מצב שאנחנו יודעים שהוא לא אמין.
    const cErrors = contactsLoadError ? {} : validateExtraContacts(contacts)
    setContactErrors(cErrors)

    let primaryMsg = ''
    if (!contactsLoadError) {
      const primaryCount = contacts.filter((c) => c.is_primary).length
      if (primaryCount === 0) primaryMsg = NO_PRIMARY_MSG
      else if (primaryCount > 1) primaryMsg = TWO_PRIMARY_MSG
    }
    setPrimaryError(primaryMsg)

    if (Object.values(errors).some(Boolean) || Object.keys(cErrors).length > 0 || primaryMsg) {
      return
    }

    if (!isEdit) {
      const existing = findDuplicate(form.company_number)
      if (existing) {
        setDuplicate({ customer: existing, isActive: existing.status === 'active' })
        return
      }
    }

    setSaving(true)
    try {
      // 🔴 N2ג (02/09/2026): שלוש העמודות `customers.contact_name/phone/email` **אינן נכתבות
      // יותר מכאן.** עד עכשיו הן כן נכתבו — בכוונה, כי הן היו `NOT NULL` והשמטתן הייתה מפילה
      // כל שמירה ב-23502. המיגרציה `…_n2c_customers_contact_columns_nullable` ריככה את האילוץ,
      // וזה מה שפתח את הצעד הזה.
      // 🔑 **ולמה זה קודם למחיקה ולא ביחד איתה:** המסד משותף לפיתוח ולייצור, והקוד החי רץ
      // מ-`main`. מחיקת עמודה בזמן שהקוד הפרוס עדיין כותב אליה שוברת את הטופס ברגע ההחלה,
      // לא במיזוג. הסדר היחיד שעובד הוא רכך ← הפסק לכתוב ← פרוס ← מחק (`supabase/migrations/CLAUDE.md`).
      // ⚠️ שלוש העמודות עדיין קיימות ועדיין מלאות — הן קו-הנסיגה עד `N2ד`. מרגע זה הן קפואות:
      // אף מסלול-כתיבה אינו נוגע בהן, ולכן `child_parent_mismatch` יכול להתחיל להתפצל כשמישהו
      // יערוך איש-קשר. **זה צפוי ותקין** — הבדיקה מתה עם המחיקה, ומשמעותה עד אז היא
      // "האם החיווט הושלם", לא "האם הנתונים זהים".
      const payload = {
        company_name: form.company_name.trim(),
        customer_type: form.customer_type,
        discount_percent: Number(form.discount_percent),
        marketing_consent: form.marketing_consent,
      }
      let saved
      if (isEdit) {
        // ח"פ לא נשלח בעריכה (קיבוע §7.11/§7.64; api.js גם מסיר הגנתית).
        saved = await updateCustomer(editingCustomer.customer_id, payload)
      } else {
        saved = await createCustomer({ ...payload, company_number: form.company_number.trim() })
      }
      // אנשי-הקשר (§7.81, N2) נשמרים כיחידה אחרי שהלקוח נשמר (replace צריך את ה-customer_id).
      // נשמרים רק אם נטענו בהצלחה (או מצב-הוספה) — אחרת דילוג, לא מחיקה (תיקון אובדן-הנתונים 11/07).
      if (contactsLoaded) {
        await replaceCustomerContacts(saved.customer_id, contacts)
      }
      // הצלחה: פס ירוק "הנתונים נשמרו בהצלחה" (חובת-אפיון) שדוהה-אוטומטית — ואז סגירה ורענון.
      setSavedOk(true)
      setTimeout(() => {
        onOpenChange(false)
        onSaved?.(saved)
      }, 1200)
    } catch (err) {
      if (err.code === '23505') {
        // מרוץ: הח"פ נוסף ע"י משתמש אחר אחרי שהרשימה נטענה — אותה זרימת-§7.11, בלי פירוט-כרטיס.
        setFormError('חברה זו כבר רשומה במערכת. רעננו את הרשימה כדי לראות את הכרטיס הקיים.')
      } else {
        setFormError(err.message || 'שמירה נכשלה. נסה שוב.')
      }
    } finally {
      setSaving(false)
    }
  }

  // §7.11 (אושר 07/07): ח"פ קיים בארכיון ⇒ שחזור מפורש — מחזיר ל-active ופותח את הכרטיס לעריכה.
  async function handleRestoreArchived() {
    if (!duplicate) return
    setSaving(true)
    try {
      const restored = await setCustomerStatus(duplicate.customer.customer_id, 'active')
      onSaved?.(restored)
      onEditExisting?.(restored)
    } catch (err) {
      setFormError(err.message || 'שחזור הלקוח מהארכיון נכשל.')
    } finally {
      setSaving(false)
    }
  }

  function fieldClass(name) {
    return cn(
      'h-auto p-3 text-right rounded-lg border-slate-300',
      // חובת-אפיון: שדה שגוי מקבל מסגרת אדומה + הודעה ממוקדת מתחתיו; שאר השדות נשארים כמו-שהם.
      fieldErrors[name] && 'border-red-500 focus-visible:ring-red-300',
    )
  }

  // צביעת-שדה באדום בשורת-איש-קשר לפי {field} של השגיאה ('both' צובע גם טלפון וגם אימייל).
  function contactFieldInvalid(rk, field) {
    const err = contactErrors[rk]
    if (!err) return false
    return err.field === field || (err.field === 'both' && (field === 'phone' || field === 'email'))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      {/* הגלילה והגובה-המרבי חיים כעת ב-DialogContent עצמו (ר' ההערה שם — פס-הגלילה
          על האלמנט המעוגל ריבע את הפינות). אין לשחזר כאן overflow-y-auto. */}
      <DialogContent dir="rtl">
        <DialogHeader>
          {/* כותרת-עריכה = מחרוזת-אפיון מדויקת: "עריכת לקוח: [שם]" (C5 §5.6.17.4) */}
          <DialogTitle data-testid="customer-dialog-title">
            {isEdit ? `עריכת לקוח: ${editingCustomer.company_name}` : 'לקוח חדש'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'עדכון פרטי הלקוח. מספר הח"פ קבוע ואינו ניתן לשינוי.'
              : 'הלקוח יתווסף לרשימת הלקוחות במערכת.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">שם לקוח</label>
            <Input
              value={form.company_name}
              onChange={(e) => setField('company_name', e.target.value)}
              onBlur={() => handleBlur('company_name')}
              placeholder="שם החברה / הארגון"
              className={fieldClass('company_name')}
              data-testid="customer-form-company-name"
            />
            <FieldError name="company_name" message={fieldErrors.company_name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">ח"פ (9 ספרות)</label>
            <Input
              value={form.company_number}
              disabled={isEdit}
              inputMode="numeric"
              maxLength={9}
              onChange={(e) => setField('company_number', e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('company_number')}
              placeholder="514123456"
              className={cn(fieldClass('company_number'), isEdit && 'disabled:opacity-60')}
              data-testid="customer-form-company-number"
            />
            <FieldError name="company_number" message={fieldErrors.company_number} />
          </div>

          {/* §7.11: זרימת-הכפילות הידידותית — פעיל=עריכת הקיים · ארכיון=הצעת שחזור */}
          {duplicate && (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex flex-col gap-2"
              role="alert"
              data-testid="customer-duplicate-notice"
            >
              {duplicate.isActive ? (
                <>
                  <p className="text-sm text-amber-800 font-medium">
                    {/* 🔴 N2 (02/09/2026): הראשי נקרא דרך `primaryContact` ולא מ-
                        `duplicate.customer.contact_name`. ‏`listCustomers` עושה `select('*', embed)`,
                        וה-`*` עדיין מחזיר את עמודת-האב **הקפואה** ⇒ הקריאה הישנה הציגה מחרוזת
                        ריקה לכל לקוח שנוצר אחרי `N2ג`, ושם **מיושן** ללקוח שאיש-הקשר שלו נערך
                        מאז. אחרי `N2ד` היא תהיה `undefined`. **שני המצבים שקטים — אין שגיאה.** */}
                    חברה זו כבר רשומה במערכת: {duplicate.customer.company_name} (איש קשר:{' '}
                    {primaryContact(duplicate.customer)?.contact_name ?? '—'}, ח"פ{' '}
                    {duplicate.customer.company_number}).
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => onEditExisting?.(duplicate.customer)}
                    className="h-auto p-0 self-start text-teal-700 hover:text-teal-800 font-semibold"
                    data-testid="customer-duplicate-edit-existing"
                  >
                    ערוך את הכרטיס הקיים
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-amber-800 font-medium">
                    הלקוח {duplicate.customer.company_name} (ח"פ {duplicate.customer.company_number}
                    ) קיים בארכיון — לשחזר?
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    disabled={saving}
                    onClick={handleRestoreArchived}
                    className="h-auto p-0 self-start text-teal-700 hover:text-teal-800 font-semibold"
                    data-testid="customer-duplicate-restore"
                  >
                    שחזר מהארכיון ופתח לעריכה
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">סוג לקוח</label>
            <Select value={form.customer_type} onValueChange={(v) => setField('customer_type', v)}>
              <SelectTrigger
                className={cn(
                  'w-full h-auto p-3 rounded-lg border-slate-300',
                  fieldErrors.customer_type && 'border-red-500',
                )}
                data-testid="customer-form-type"
              >
                <SelectValue placeholder="בחר סוג לקוח" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {/* §7.3: התוויות מהאפיון הקפוא בלבד — מיובאות מ-SSOT, לא כתובות כאן ידנית */}
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError name="customer_type" message={fieldErrors.customer_type} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">אחוז הנחה קבוע (0–100)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.discount_percent}
              onChange={(e) => setField('discount_percent', e.target.value)}
              onBlur={() => handleBlur('discount_percent')}
              className={cn(fieldClass('discount_percent'), 'sm:w-1/2')}
              data-testid="customer-form-discount"
            />
            <FieldError name="discount_percent" message={fieldErrors.discount_percent} />
          </div>

          {/* אנשי-קשר (N2, §7.81) — רשימה אחת שבה כל שורה היא אותו כרטיס; הראשי מסומן בצ'יפ
              ובמסגרת (docs/mockups/customers-screen/08_contacts_form_approved.html, הכרעת-ישי
              27/08). אם טעינת-הקשרים נכשלה — מסתירים את העורך ומראים אזהרה, כדי לא לאבד עריכות
              שלא יישמרו (contactsLoaded=false). */}
          {contactsLoadError ? (
            <p
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
              role="alert"
              data-testid="customer-contacts-load-error"
            >
              לא ניתן לטעון את אנשי הקשר כרגע. שאר פרטי הלקוח יישמרו כרגיל; נסו שוב מאוחר יותר
              לעריכת אנשי הקשר.
            </p>
          ) : (
            <div className="flex flex-col gap-2" data-testid="customer-contacts-section">
              <label className="text-sm text-slate-700">אנשי קשר</label>
              <p className="text-xs text-slate-500">
                איש קשר אחד חייב להיות מסומן כראשי. הוא זה שמופיע בהצעת המחיר ומקבל את המיילים.
              </p>

              {primaryError && (
                <p
                  className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800"
                  role="alert"
                  data-testid="customer-contacts-primary-error"
                >
                  {primaryError}
                </p>
              )}

              {contacts.map((c, idx) => (
                <div
                  key={c._rk}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border p-3',
                    c.is_primary ? 'border-2 border-teal-600' : 'border-slate-200',
                  )}
                  data-testid="contact-row"
                  data-primary={c.is_primary ? 'true' : 'false'}
                >
                  <div className="flex items-center gap-2">
                    {c.is_primary ? (
                      <>
                        <span
                          className="rounded-full bg-teal-100 text-teal-700 px-2.5 py-0.5 text-xs font-bold"
                          data-testid="contact-primary-chip"
                        >
                          ראשי
                        </span>
                        <span className="text-xs text-slate-400">מופיע בהצעת המחיר</span>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => makePrimary(c._rk)}
                        className="h-auto p-0 text-xs font-semibold text-slate-600 hover:text-slate-800"
                        data-testid="contact-make-primary"
                      >
                        הפוך לראשי
                      </Button>
                    )}
                    <span className="flex-1" />
                    <Button
                      type="button"
                      variant="link"
                      // מוסכמת-הבית (MarketingPanel/marketing.js): פקד חסום נושא title שמסביר למה.
                      title={c.is_primary ? NO_PRIMARY_MSG : 'הסר איש קשר'}
                      aria-label={c.is_primary ? 'מחיקה חסומה' : `הסר איש קשר ${idx + 1}`}
                      disabled={c.is_primary}
                      onClick={() => removeContactRow(c._rk)}
                      className="h-auto p-0 text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
                      data-testid="contact-remove"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* שלושה שדות שווים, כל תווית-ותא באותה עטיפה (מוקש-RTL/LTR הקבוע של הפרויקט —
                      תווית עברית שנפרדת מהערך שמתחתיה נצפתה שלוש פעמים כשהם לא באותו בלוק). */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500">שם</label>
                      <Input
                        value={c.contact_name}
                        onChange={(e) => updateContactRow(c._rk, 'contact_name', e.target.value)}
                        placeholder="שם איש הקשר"
                        aria-invalid={contactFieldInvalid(c._rk, 'contact_name') || undefined}
                        className={cn(
                          'h-auto rounded-lg border-slate-300 p-2 text-right',
                          contactFieldInvalid(c._rk, 'contact_name') && 'border-red-500',
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500">טלפון</label>
                      <Input
                        value={c.phone}
                        onChange={(e) => updateContactRow(c._rk, 'phone', e.target.value)}
                        placeholder="050-0000000"
                        dir="ltr"
                        aria-invalid={contactFieldInvalid(c._rk, 'phone') || undefined}
                        className={cn(
                          'h-auto rounded-lg border-slate-300 p-2',
                          contactFieldInvalid(c._rk, 'phone') && 'border-red-500',
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500">אימייל</label>
                      <Input
                        value={c.email}
                        onChange={(e) => updateContactRow(c._rk, 'email', e.target.value)}
                        placeholder="name@company.co.il"
                        dir="ltr"
                        aria-invalid={contactFieldInvalid(c._rk, 'email') || undefined}
                        className={cn(
                          'h-auto rounded-lg border-slate-300 p-2',
                          contactFieldInvalid(c._rk, 'email') && 'border-red-500',
                        )}
                      />
                    </div>
                  </div>

                  {contactErrors[c._rk] && (
                    <p
                      className="text-red-600 text-sm"
                      role="alert"
                      data-testid="contact-row-error"
                    >
                      {contactErrors[c._rk].msg}
                    </p>
                  )}

                  {/* חסימת-מחיקת-הראשי — הנוסח המדויק מהמוקאפ (הכרעת-ישי 27/08), מוצג תמיד
                      ולא רק אחרי ניסיון-לחיצה: "בקרה חסומה נושאת משפט", לא נטרול שקט. */}
                  {c.is_primary && (
                    <p
                      className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800"
                      data-testid="contact-primary-delete-notice"
                    >
                      {NO_PRIMARY_MSG}
                    </p>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addContactRow}
                className="h-auto w-full gap-1 rounded-lg border-dashed border-slate-300 p-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800"
                data-testid="contact-add-row"
              >
                <Plus className="size-4" />
                הוסף איש קשר
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">מאושר לדיוור שיווקי</label>
            <Switch
              dir="rtl"
              checked={form.marketing_consent}
              onCheckedChange={(v) => setField('marketing_consent', v)}
              data-testid="customer-form-consent"
            />
          </div>

          {formError && (
            <p className="text-red-600 text-sm" role="alert" data-testid="customer-form-error">
              {formError}
            </p>
          )}

          {/* חובת-אפיון: פס ירוק "הנתונים נשמרו בהצלחה" — מוצג ואז הדיאלוג נסגר (דהייה-בפועל) */}
          {savedOk && (
            <p
              className="rounded-lg bg-green-100 text-green-700 text-sm font-medium p-3 text-center"
              data-testid="customer-save-success"
            >
              הנתונים נשמרו בהצלחה
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              // מנוטרל גם כשמזוהה כפילות-ח"פ (§7.11): הפעולה הנכונה אז היא "ערוך את הכרטיס הקיים",
              // לא submit חוזר שרק יריץ שוב את אותה בדיקה — נטרול מונע לחיצות-סרק שמרגישות כמו באג.
              disabled={saving || savedOk || !!duplicate}
              className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
              data-testid="customer-form-submit"
            >
              {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף לקוח'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
