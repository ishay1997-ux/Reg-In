// משטחים 3ב (הוספת דיילת) ו-3ג (עריכת דיילת) — **דיאלוג אחד לשניהם.**
// מוקאפים מאושרים: `06_add_hostess_approved.html` · `07_edit_hostess_approved.html`.
//
// 🔑 **למה דיאלוג אחד ולא שניים:** שני המוקאפים זהים שדה-בשדה; ההבדלים הם שלושה בלבד —
// ת"ז נעולה, תג-סטטוס קריא-בלבד בכותרת, וסעיף אי-הזמינות. שני קבצים היו סוטים זה מזה
// בדיוק כפי ש-`StatTile` סטה כשהוגדר פעמיים, וכאן המחיר הוא **ולידציה שקיימת בהוספה
// ונעלמת בעריכה** — כלומר שדה שנשמר ריק דרך דלת אחת ולא דרך השנייה.
//
// 🔑 **ההחלטה האחת** (`screens-approved.md` 3ב §②): *"המנהלת כבר דיברה עם הדיילת בטלפון,
// ועכשיו היא רק מתעדת את מה שסוכם."* ⇒ **אין מסך לדיילת, אין הזמנה ואין קישור**, והטופס
// אינו "ממתין לאישור" של אף אחד. בשמירה היא **פעילה** ונכנסת מיידית למאגר-המועמדות.

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import Hint from '@/components/Hint'
import RatingStars from '@/components/RatingStars'
import ChipToggle from '@/components/ChipToggle'
import StatusTag from '@/components/StatusTag'
import Money from '@/components/Money'
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
import { isValidIsraeliId } from '@/lib/validators'
import {
  HOSTESS_PARAM_NAMES,
  HOSTESS_STATUS_LABELS,
  minWageError,
  duplicateEmailWarning,
  unavailabilityLabel,
  optionalNumber,
} from '@/lib/hostesses'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import {
  listHostesses,
  getHostess,
  getHostessScreenParams,
  createHostess,
  updateHostess,
  replaceHostessUnavailability,
} from './api'

// ⚠️ **הצעה, לא רשימה סגורה** — העמודה היא `text[]` חופשי ואין `enum` בסכמה.
// חמש אלה נקראו מהמוקאפ המאושר; הוספת שפה כאן אינה נוגעת במסד.
const LANGUAGES = ['עברית', 'אנגלית', 'רוסית', 'ערבית', 'אמהרית']

// 🔴 **תשעה שדות-חובה, ולא ארבעה כפי שהמוקאפ מסמן** — הכרעת-ישי 08/08/2026 (`local-1`).
// חמשת הנוספים (`email` · `city` · שלושת שדות-הבנק) הם `not null` **במסד**
// (`schema.sql:143-155`) ⇒ טופס שמסמן אותם כרשות מייצר שמירה שנכשלת בשרת עם הודעה
// שהמנהלת לא יכולה לפעול לפיה. **המוקאפ אינו מצויר מחדש** — סטייה מודעת ומתועדת.
const REQUIRED_FIELDS = {
  id_number: 'תעודת זהות',
  full_name: 'שם מלא',
  phone: 'טלפון',
  email: 'אימייל',
  city: 'עיר',
  hourly_rate: 'שכר שעתי',
  bank_name: 'בנק',
  bank_branch: 'סניף',
  bank_account: 'מס׳ חשבון',
}

const EMPTY = {
  id_number: '',
  full_name: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  hourly_rate: '',
  bank_name: '',
  bank_branch: '',
  bank_account: '',
  rating: null,
  has_car: false,
  languages: [],
}

export default function HostessFormDialog({ hostessId, onClose, onSaved }) {
  const isEdit = hostessId !== null
  const toast = useToast()

  const [form, setForm] = useState(EMPTY)
  const [ranges, setRanges] = useState([])
  const [draftRange, setDraftRange] = useState({ start_date: '', end_date: '', note: '' })
  const [status, setStatus] = useState('active')
  const [peers, setPeers] = useState([])
  const [params, setParams] = useState({})
  // 🔴 **ADD ואין מצב-ביניים; EDIT יש** (`screens-approved.md:702,798` — סטייה מפורשת בין 3ב ל-3ג).
  // הטופס הריק חייב להיפתח מיד ב-ADD; `params`/`peers` נטענים ברקע ומזינים ולידציה-רכה כשהם מגיעים.
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      // ADD: הטופס הריק כבר על המסך (`loading` נולד `false`) — לא מכבים ומדליקים אותו כדי
      // לא ליצור הבזק-של-מצב-ביניים שהאפיון אוסר. EDIT: `loading` כבר `true` מהאתחול.
      if (isEdit) setLoading(true)
      setLoadError(null)
      try {
        // `peers` נדרש לאזהרת-האימייל הרכה — היא משווה מול המאגר, לא מול המסד.
        const [paramRows, allHostesses, existing] = await Promise.all([
          getHostessScreenParams(),
          listHostesses(),
          isEdit ? getHostess(hostessId) : Promise.resolve(null),
        ])
        if (cancelled) return

        setParams(paramRows)
        setPeers(allHostesses)
        if (isEdit) {
          if (!existing) throw new Error('הדיילת לא נמצאה, או שאין לך הרשאה אליה.')
          setForm({
            ...EMPTY,
            ...existing,
            hourly_rate: String(existing.hourly_rate ?? ''),
            languages: existing.languages ?? [],
            address: existing.address ?? '',
          })
          setStatus(existing.status)
          setRanges(existing.hostess_unavailability ?? [])
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message ?? 'טעינת הכרטיס נכשלה.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [hostessId, isEdit])

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }))
  const blur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  // ── ולידציה: שלוש התנהגויות שונות, וזה כל העניין ──────────────────────────
  const errors = useMemo(() => {
    const found = {}

    for (const [field, label] of Object.entries(REQUIRED_FIELDS)) {
      // 🔴 לא `${label} הוא שדה חובה` — "תעודת זהות"/"עיר" הם שמות-עצם בנקבה, ו"הוא"
      // שגוי דקדוקית עליהם. "יש למלא X" נכון לכל שם-עצם בלי תלות במינו.
      if (String(form[field] ?? '').trim() === '') found[field] = `יש למלא ${label}`
    }

    // 🔴 ת"ז — **חוסמת**, ונבדקת תוך כדי ההקלדה (השדה היחיד שאינו ממתין ליציאה מהשדה).
    if (String(form.id_number ?? '').trim() !== '' && !isValidIsraeliId(form.id_number)) {
      found.id_number = 'מספר תעודת זהות אינו תקין'
    }

    // 🔴 שכר מתחת למינימום — **חוסם**, והרף מגיע מ-`params` ולעולם אינו מוקלד בקוד.
    if (String(form.hourly_rate ?? '').trim() !== '') {
      const wageError = minWageError(form.hourly_rate, params[HOSTESS_PARAM_NAMES.minHourlyWage])
      if (wageError) found.hourly_rate = wageError
    }

    return found
  }, [form, params])

  // 🟡 אימייל כפול — **מזהיר ולא חוסם** (§7.65): תיבה משפחתית משותפת היא מקרה לגיטימי,
  // ואת כפילות-האדם מונעת הת"ז ממילא. 🚫 אין UNIQUE על העמודה במסד, במכוון.
  const emailWarning = duplicateEmailWarning(form.email, peers, isEdit ? hostessId : null)

  // 🔴 שער-המרחק של Smart Match (`שער_מרחק_קמ`) הוא `params`, לא קבוע — ר' ההערה ליד
  // ההינט של "יש רכב?" למטה. `null` כל עוד `params` עדיין נטען (ADD פותח מיד, לפני הטעינה).
  const gateDistanceKm = optionalNumber(params[SMART_MATCH_PARAM_NAMES.gateDistanceKm])

  const blocked = Object.keys(errors).length > 0

  function addRange() {
    if (!draftRange.start_date || !draftRange.end_date) return
    if (draftRange.end_date < draftRange.start_date) {
      toast.error('תאריך הסיום מוקדם מתאריך ההתחלה.')
      return
    }
    // 🔴 **נצבר בזיכרון-הטופס בלבד ונכתב רק עם "שמור שינויים"** — אותו דפוס בדיוק כמו
    // "אנשי קשר נוספים" ב-`CustomerFormDialog`. כתיבה מיידית הייתה מחייבת מנגנון-ביטול
    // נפרד ל"הסר" (מחיקה מהמסד, לא רק מהטופס), ולזה אין כיסוי בתהליכים.
    setRanges((prev) => [...prev, { ...draftRange }])
    setDraftRange({ start_date: '', end_date: '', note: '' })
  }

  // Enter בתוך שדות-הטיוטה של טווח-אי-הזמינות מוסיף את הטווח — ולא שולח את כל טופס
  // הדיילת (שעדיין עובד גם על מה שהוקלד בשדות למעלה). בלי זה, ה-`<form>` שנוסף כאן היה
  // תופס Enter מכל שדה, כולל שלושת השדות המקוננים האלה.
  function onDraftRangeKeyDown(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    addRange()
  }

  // ⌨️ Enter בתוך שדה חייב לשלוח את הטופס — כמו `CustomerFormDialog`, שממנו נשאב מבנה
  // הדיאלוג הזה (`screens-approved.md:661-663`). בלעדי זה אין דרך לשמור בלי לגעת בעכבר.
  async function handleSubmit(e) {
    e.preventDefault()
    await handleSave()
  }

  async function handleSave() {
    setTouched(Object.fromEntries(Object.keys(REQUIRED_FIELDS).map((f) => [f, true])))
    if (blocked) return

    setSaving(true)
    try {
      const payload = {
        id_number: form.id_number.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        hourly_rate: Number(form.hourly_rate),
        bank_name: form.bank_name.trim(),
        bank_branch: form.bank_branch.trim(),
        bank_account: form.bank_account.trim(),
        rating: form.rating,
        has_car: form.has_car,
        languages: form.languages,
      }

      let saved
      if (isEdit) {
        saved = await updateHostess(hostessId, payload)
        await replaceHostessUnavailability(hostessId, ranges)
      } else {
        saved = await createHostess(payload)
        if (ranges.length > 0) await replaceHostessUnavailability(saved.hostess_id, ranges)
      }

      // ⚠️ **הכתובת לא נמצאה אינה כישלון** — הדיילת נשמרה, והמסך אומר זאת מפורשות
      // במקום להשתיק. אפס בציון-הקרבה היה מעניש אותה על תקלת-מערכת (§7.55/§11.4).
      if (saved && saved.lat === null && payload.address) {
        toast.success(
          `${payload.full_name} נשמרה — לא הצלחנו לאתר את הכתובת, והיא מסומנת "אין קואורדינטות".`,
        )
      } else {
        toast.success(isEdit ? 'השינויים נשמרו' : `${payload.full_name} נוספה למאגר`)
      }
      onSaved()
    } catch (err) {
      // 🔴 **לעולם לא "נשמר" בשקט** — כתיבה שנחסמה ע"י RLS מחזירה `{data:null,error:null}`,
      // ו-`assertRowsAffected` בשכבת-ה-API הופכת אותה לשגיאה אמיתית שמגיעה לכאן.
      toast.error(err.message ?? 'שמירת הדיילת נכשלה.')
    } finally {
      setSaving(false)
    }
  }

  const showError = (field) => (touched[field] ? errors[field] : null)

  return (
    <Dialog open onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="hostess-dialog-title">
            <span className="flex items-center gap-2">
              {isEdit ? `עריכת דיילת: ${form.full_name}` : 'הוספת דיילת חדשה'}
              {isEdit && <StatusTag label={HOSTESS_STATUS_LABELS[status]} />}
            </span>
          </DialogTitle>
          {/* 🔴 טקסט-עזר מתחת לכותרת-דיאלוג = משפט קצר אחד, בלי נקודה בסוף (styleguide §1,
              הבהרת סבב-2 של מבחן-הקבלה). "תעודת הזהות קבועה" עבר ליד השדה עצמו (R20: שגיאה/
              מידע יושבים ליד מקורם) — כאן נשאר רק מה שאין לה דרך אחרת לדעת: לאן פונים
              להפעלה/השבתה, כי הכרטיס הזה לא נושא את הפעולה הזאת בכלל. */}
          <DialogDescription>
            {isEdit
              ? 'הפעלה והשבתה מתבצעות משורת הדיילת בטבלת המאגר, לא כאן'
              : 'בשמירה, הדיילת נכנסת מיידית למאגר בסטטוס "פעילה"'}
          </DialogDescription>
        </DialogHeader>

        {!isEdit && <Hint id="hostesses.addFormWhen" />}

        <form onSubmit={handleSubmit} noValidate>
          {loading ? (
            // שלד-שדות — ורק ב-EDIT: ב-ADD `loading` נשאר `false` מהאתחול, אז זה כלל לא נטען כאן.
            <LoadingOrError loading skeleton={{ variant: 'fields', rows: 5 }} />
          ) : loadError ? (
            <LoadingOrError error={loadError} />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto pl-1">
              <Field
                label="תעודת זהות"
                // 🔴 בעריכה — **נעולה**, אותו דפוס בדיוק כמו ח"פ-לקוח (§7.64: ת"ז יצאה
                // מהמפתח, אבל היא עדיין המזהה האנושי, והחלפתה היא החלפת אדם). ההסבר
                // יושב כאן, ליד השדה החסום עצמו — לא בתיאור-הדיאלוג הרחוק ממנו.
                hint={isEdit ? 'לא ניתנת לשינוי' : 'בדיקת ספרת-ביקורת תוך כדי ההקלדה'}
                error={isEdit ? null : errors.id_number}
              >
                <Input
                  value={form.id_number}
                  onChange={(e) => set('id_number')(e.target.value)}
                  disabled={isEdit}
                  placeholder="302894506"
                  dir="ltr"
                  className="text-right"
                  data-testid="hostess-id-number"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="שם מלא" error={showError('full_name')}>
                  <Input
                    value={form.full_name}
                    onChange={(e) => set('full_name')(e.target.value)}
                    onBlur={blur('full_name')}
                    placeholder="לדוגמה: נועה שגיא"
                    data-testid="hostess-full-name"
                  />
                </Field>
                <Field label="טלפון" error={showError('phone')}>
                  <Input
                    value={form.phone}
                    onChange={(e) => set('phone')(e.target.value)}
                    onBlur={blur('phone')}
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-right"
                    data-testid="hostess-phone"
                  />
                </Field>
              </div>

              <Field label="אימייל" error={showError('email')} warning={emailWarning}>
                <Input
                  value={form.email}
                  onChange={(e) => set('email')(e.target.value)}
                  onBlur={blur('email')}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="text-right"
                  data-testid="hostess-email"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="עיר" error={showError('city')}>
                  <Input
                    value={form.city}
                    onChange={(e) => set('city')(e.target.value)}
                    onBlur={blur('city')}
                    placeholder="לדוגמה: רמת גן"
                    data-testid="hostess-city"
                  />
                </Field>
                <Field label="כתובת מלאה (לא חובה)" hint="משמש לחישוב הקרבה לאירוע">
                  <Input
                    value={form.address}
                    onChange={(e) => set('address')(e.target.value)}
                    placeholder="לדוגמה: ביאליק 14"
                    data-testid="hostess-address"
                  />
                </Field>
              </div>

              <Field
                label="שכר שעתי (₪)"
                error={showError('hourly_rate')}
                // 🔴 הסכום עובר דרך `Money` ולא נכתב ידנית בתוך המשפט. **נמדד בדפדפן
                // 09/08/2026:** הנוסח הידני הציג את ה-₪ **משמאל** לספרות, בעוד `Money`
                // באותו מסך מציג `45 ₪` — אותו סכום משני צדדים, המופע השביעי של המשפחה.
                hint={
                  <>
                    מתחת ל-
                    <Money amount={Number(params[HOSTESS_PARAM_NAMES.minHourlyWage])} /> (שכר
                    מינימום) חוסם שמירה
                  </>
                }
              >
                <Input
                  value={form.hourly_rate}
                  onChange={(e) => set('hourly_rate')(e.target.value)}
                  onBlur={blur('hourly_rate')}
                  onFocus={(e) => e.target.select()}
                  dir="ltr"
                  className="text-right"
                  data-testid="hostess-hourly-rate"
                />
                {isEdit && (
                  <span className="mt-1 block text-[11px] text-amber-700">
                    שינוי כאן <b>לא משפיע</b> על תעריף שכבר הוקפא בשיבוץ קיים — הוא יחול רק על
                    השיבוץ הבא
                  </span>
                )}
              </Field>

              <p className="mb-2 mt-4 text-xs font-semibold text-slate-500">פרטי בנק</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="בנק" error={showError('bank_name')}>
                  <Input
                    value={form.bank_name}
                    onChange={(e) => set('bank_name')(e.target.value)}
                    onBlur={blur('bank_name')}
                    placeholder="לדוגמה: הפועלים"
                    data-testid="hostess-bank-name"
                  />
                </Field>
                <Field label="סניף" error={showError('bank_branch')}>
                  <Input
                    value={form.bank_branch}
                    onChange={(e) => set('bank_branch')(e.target.value)}
                    onBlur={blur('bank_branch')}
                    placeholder="123"
                    dir="ltr"
                    className="text-right"
                    data-testid="hostess-bank-branch"
                  />
                </Field>
                <Field label="מס׳ חשבון" error={showError('bank_account')}>
                  <Input
                    value={form.bank_account}
                    onChange={(e) => set('bank_account')(e.target.value)}
                    onBlur={blur('bank_account')}
                    placeholder="123456"
                    dir="ltr"
                    className="text-right"
                    data-testid="hostess-bank-account"
                  />
                </Field>
              </div>

              <Field
                label="התרשמות המנהלת (1–5, לא חובה)"
                hint="זו דעתך, לא ציון של המערכת — ואינה חלק מהדירוג בשיבוץ חכם"
              >
                <RatingStars value={form.rating} onChange={set('rating')} testId="hostess-rating" />
              </Field>

              <Field
                label="יש רכב? (לא חובה)"
                // 🔴 40 ק"מ אינו קבוע-בקוד — `שער_מרחק_קמ` הוא פרמטר (`SMART_MATCH_PARAM_NAMES`),
                // ולכן ההינט קורא את הערך החי מ-`params` ולא כותב אותו כמספר קבוע (styleguide §4
                // דוגמה 3). כשהוא עדיין לא נטען (רגע ה-ADD הראשון) — נוסח בלי מספר.
                hint={
                  gateDistanceKm !== null
                    ? `מעל ${gateDistanceKm} ק"מ בלי רכב פוסלת מהשיבוץ, לא רק פוגעת בציון`
                    : 'מעבר למרחק מסוים בלי רכב פוסלת מהשיבוץ, לא רק פוגעת בציון'
                }
              >
                <Switch
                  checked={form.has_car}
                  onCheckedChange={set('has_car')}
                  aria-label="יש רכב"
                  data-testid="hostess-has-car"
                />
              </Field>

              <Field
                label="שפות (לא חובה)"
                hint="שדה-מידע בלבד ולא שער — הבחירה מי לזמן לכל תפקיד תמיד ידנית"
              >
                <ChipToggle
                  options={LANGUAGES}
                  selected={form.languages}
                  onToggle={(lang) =>
                    set('languages')(
                      form.languages.includes(lang)
                        ? form.languages.filter((l) => l !== lang)
                        : [...form.languages, lang],
                    )
                  }
                  testId="hostess-languages"
                />
              </Field>

              {isEdit && (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  {/* R27: שני שדות "מ-תאריך"/"עד-תאריך" מתחת כבר אומרים שזה טווח —
                      הערה שחוזרת על זה נמחקת. */}
                  <p className="mb-2 text-xs font-semibold text-slate-500">אי-זמינות מוצהרת</p>

                  {ranges.map((range, index) => (
                    <div
                      key={`${range.start_date}-${range.end_date}-${index}`}
                      className="mb-1.5 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12.5px] text-amber-800"
                      data-testid={`hostess-range-${index}`}
                    >
                      <span>
                        {unavailabilityLabel(range)?.replace('לא זמינה ', '')}
                        {range.note ? ` · ${range.note}` : ''}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setRanges((prev) => prev.filter((_, i) => i !== index))}
                        className="h-auto p-0 text-xs text-slate-600"
                      >
                        הסירי
                      </Button>
                    </div>
                  ))}

                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <Field label="מ-תאריך" compact>
                      <Input
                        type="date"
                        value={draftRange.start_date}
                        onChange={(e) =>
                          setDraftRange((p) => ({ ...p, start_date: e.target.value }))
                        }
                        onKeyDown={onDraftRangeKeyDown}
                        data-testid="hostess-range-start"
                      />
                    </Field>
                    <Field label="עד-תאריך" compact>
                      <Input
                        type="date"
                        value={draftRange.end_date}
                        onChange={(e) => setDraftRange((p) => ({ ...p, end_date: e.target.value }))}
                        onKeyDown={onDraftRangeKeyDown}
                        data-testid="hostess-range-end"
                      />
                    </Field>
                    <Field label="הערה קצרה" compact grow>
                      <Input
                        value={draftRange.note}
                        onChange={(e) => setDraftRange((p) => ({ ...p, note: e.target.value }))}
                        onKeyDown={onDraftRangeKeyDown}
                        placeholder="לדוגמה: חופשה, מחלה, לימודים"
                        data-testid="hostess-range-note"
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRange}
                      className="h-auto rounded-lg border-slate-300 px-3 py-2 text-xs text-slate-700"
                      data-testid="hostess-range-add"
                    >
                      + הוסיפי טווח
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-auto rounded-lg border-slate-300 px-4 py-2.5 text-slate-700"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={saving || loading || blocked}
              className="h-auto rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white"
              data-testid="hostess-save"
            >
              {saving ? 'שומרת…' : isEdit ? 'שמרי שינויים' : 'שמרי דיילת'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// שדה-טופס: תווית + קלט + שגיאה **מתחתיו**, בדיוק כמו `CustomerFormDialog` — לא מומצא,
// זו שפת-הדיאלוגים היחידה שכבר בנויה בקוד.
// 🔴 R6: שדה-חובה לא מסומן בכוכבית — הלא-חובה מסומן במילים בסוף התווית ("(לא חובה)").
// תשעת שדות-החובה של הטופס הם ברירת-המחדל; ארבעת השדות הלא-חובה (כתובת מלאה · התרשמות ·
// יש רכב · שפות) נושאים את הסימון בתווית שלהם עצמה, לא כאן.
function Field({ label, hint, error, warning, children, compact, grow }) {
  return (
    <div className={`${compact ? 'mb-0' : 'mb-3'} ${grow ? 'flex-1 min-w-[160px]' : ''}`}>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="font-normal text-slate-400"> — {hint}</span>}
      </label>
      {children}
      {error && (
        <span className="mt-1 block text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </span>
      )}
      {!error && warning && (
        <span className="mt-1 block text-[11px] font-semibold text-amber-700">{warning}</span>
      )}
    </div>
  )
}
