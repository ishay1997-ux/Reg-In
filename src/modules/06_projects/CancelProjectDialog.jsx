// דיאלוג ביטול-הפרויקט (משטח 7, צעד 3.7) — הפעולה **אינה הפיכה** (אין ביטול-ביטול,
// הכרעת-ישי "בא נניח שלא"), ולכן הבאנר שלפני-האישור הוא הרגע האחרון שבו מישהו יכול לעצור:
// אין נוטיפיקציות במערכת (⑥) — ברגע הלחיצה הדיילות מקבלות מייל ואין דרך חזרה.
//
// שלוש הכרעות שמעצבות את הקובץ:
// · **המדרג נקרא מ-`params`** (שלוש השורות שנזרעו ב-1.7) — לעולם לא 24/72/50 קשיחים במשפט.
// · **המייל נשלח מהלקוח אחרי הצלחת ה-RPC** (AR-5), פר-דיילת ועם דיווח-תוצאה פר-נמענת —
//   לא בתוך ה-RPC. הבונה: `buildProjectCancellationPayload` (3 placeholders, **בלי**
//   `resolveShiftContact` — למייל הזה אין איש-קשר, וקריאה אליו הייתה חוסמת מייל-חובה).
// · **כפתור-ההרס הוא מסגרת אדומה, לא מילוי** — הדפוס השלילי היחיד ב-src/ (RowAction),
//   ומילוי-אדום מלא אינו קיים באף מקום. הכפתור המשני "חזרה" ולא "ביטול" (S-29 — בעברית
//   "ביטול" הוא גם שם הפעולה ההרסנית וגם כפתור-הסגירה; שתי משמעויות הפוכות בדיאלוג אחד).
//
// מבנה: גוף-הדיאלוג ממונטש רק כשהוא פתוח ⇒ כל פתיחה מתחילה מ-state טרי (איפוס דרך
// remount, לא effect שמסנכרן — src/CLAUDE.md).
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { useToast } from '@/components/ToastProvider'
import { cancelProject, getProjectAssignments } from './api'
import {
  getCancellationEmailTemplate,
  getCancellationParams,
  getHostessEmails,
} from './cancellationApi'
import {
  CANCELLATION_PARAM_NAMES,
  cancelSuccessMessage,
  cancellationBannerModel,
  compensationPercent,
  compensationReason,
  compensationSubLine,
  ladderSentence,
  releasedSentence,
} from '@/lib/projectCancellation'
import { hoursUntilEvent } from '@/lib/projectChanges'
import { classifySendError, EMAIL_SEND_RESULT } from '@/lib/email'
import { mailOutcomeMessage } from '@/lib/projectCard'
import { eventDaysFromToday } from '@/lib/projects'
import { PROJECT_TEMPLATE_NAMES, buildProjectCancellationPayload } from '@/lib/shiftEmails'
import { sendEmail } from '@/api/email'

// 🔒 נעול ב-§3.7 של מדריך-המיקרו, וזהה-בייט למה שה-RPC זורק (מיגרציה 20260814142440,
// גוף cancel_project) — הדיאלוג והשרת אומרים את אותו משפט.
export const EMPTY_CANCEL_REASON_MESSAGE =
  'חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול.'

// שלוש האפשרויות — ערכי-המסד מתוך CHECK הטבלה (customer/force_majeure/other), והנוסחים
// מילוליים מהמוקאפ המאושר. שורת-ההסבר של "כוח עליון" היא חובה (⑪) — האפשרות היחידה
// שלוקחת כסף מהדיילות, ולכן היחידה שאומרת גם מה היא *אינה*.
const CANCEL_TYPES = [
  {
    value: 'customer',
    title: 'הלקוח ביטל',
    description: 'הפרת-הסכם מצידו — אנחנו היינו מוכנים ומסוגלים לבצע.',
    moneyLine: 'הפיצוי לדיילות נקבע לפי מרחק-הזמן מהאירוע.',
  },
  {
    value: 'force_majeure',
    title: 'כוח עליון',
    description: 'מלחמה · אסון טבע · צו ממשלתי. לא: שינוי דעה של הלקוח.',
    moneyLine: 'מאפס את הפיצוי לדיילות — 0% תמיד, גם בביטול של יום לפני.',
  },
  {
    value: 'other',
    title: 'אחר',
    description: 'מקרה חריג שאינו אחד משני אלה — תארי אותו בשדה למטה.',
    moneyLine: 'לעניין הפיצוי מתנהג כמו "הלקוח ביטל".',
  },
]

// ── AR-5: שליחת מייל "האירוע בוטל" לכל משוחררת, אחרי הצלחת ה-RPC בלבד ─────────────────
// `hostesses_to_notify` נושא בכוונה רק מזהה+שם (הערת-הגוף במיגרציה: "🚫 לא מייל") ⇒
// הכתובות נשלפות בנפרד, והתבנית נקראת ברגע השליחה (as-built 2.8). כשל-הכנה אינו מפיל
// את הביטול — הוא כבר קרה ואינו הפיך; הכשל מדווח פר-נמענת.
// כל תוצאה: { name, status (EMAIL_SEND_RESULT), text } — הטקסט הוא מה שהטוסט מציג.
async function sendCancellationMails({ toNotify, project }) {
  if (!toNotify.length) return []

  let template = null
  let emailsById = new Map()
  let prepError = null
  try {
    ;[template, emailsById] = await Promise.all([
      getCancellationEmailTemplate(),
      getHostessEmails(toNotify.map((h) => h.hostess_id)),
    ])
  } catch (err) {
    prepError = err?.message ?? 'הכנת המיילים נכשלה.'
  }

  // 🔴 חסימת-RLS שקטה: `hostesses` מגודרת על 'דיילות', וקוראת חסומה מקבלת מפה ריקה
  // **בלי שגיאה**. מפה ריקה מול רשימת-שחרור לא-ריקה ⇒ אין הרשאה לכתובות — וזה מה
  // שנאמר, לא "לא נמצאה כתובת מייל" (שקר: הכתובת קיימת, רק אסורה לקריאה).
  const emailsBlocked = !prepError && emailsById.size === 0

  const outcomes = []
  // סדרתית ולא Promise.all במכוון: 1–6 נמענות, וסדרתיות נותנת דיווח דטרמיניסטי לפי
  // סדר הרשימה שה-RPC החזיר.
  for (const hostess of toNotify) {
    const contactRow = emailsById.get(hostess.hostess_id) ?? null
    const name = hostess.full_name ?? contactRow?.full_name ?? `דיילת #${hostess.hostess_id}`
    if (prepError) {
      outcomes.push({ name, status: EMAIL_SEND_RESULT.FAILED, text: `לא נשלח — ${prepError}` })
      continue
    }
    if (emailsBlocked) {
      outcomes.push({
        name,
        status: EMAIL_SEND_RESULT.FAILED,
        text: 'לא נשלח — אין הרשאה לכתובות המייל.',
      })
      continue
    }
    const payload = buildProjectCancellationPayload({
      template,
      hostess: { email: contactRow?.email, full_name: name },
      project,
    })
    if (!payload) {
      outcomes.push({
        name,
        status: EMAIL_SEND_RESULT.FAILED,
        text: 'לא נשלח — לא נמצאה כתובת מייל.',
      })
      continue
    }
    try {
      await sendEmail({
        payload,
        entityType: 'project',
        entityId: project.project_id,
        templateName: PROJECT_TEMPLATE_NAMES.cancellation,
      })
      outcomes.push({ name, status: EMAIL_SEND_RESULT.SENT, text: 'נשלח.' })
    } catch (err) {
      // הסיווג דרך ה-SSOT של המנוע (classifySendError) — פסק-זמן/תקלת-רשת = "לא ידוע",
      // לא "נכשל": המייל אולי כן יצא, ו"נכשל" היה גורר שליחה חוזרת והצפת הדיילת.
      const status = classifySendError(err)
      outcomes.push({
        name,
        status,
        text:
          status === EMAIL_SEND_RESULT.UNKNOWN
            ? 'לא ידוע אם נשלח — לא התקבל אישור שליחה.'
            : 'נכשל — המייל לא נשלח.',
      })
    }
  }
  return outcomes
}

// דיווח-המיילים בטוסטים, אחרי שהדיאלוג נסגר (שורת "הצלחה" בכרטיס: הדיאלוג נסגר —
// אין פאנל-סיום). ההצלחות מקובצות דרך mailOutcomeMessage (ה-SSOT של שלוש-התוצאות);
// כשל/לא-ידוע נשארים פר-נמענת (AR-5) — שם-הדיילת הוא מה שמאפשר לתקן: להוסיף כתובת,
// או להרים אליה טלפון.
function reportCancellationMails(toast, outcomes) {
  const sent = outcomes.filter((o) => o.status === EMAIL_SEND_RESULT.SENT).length
  const sentReport = mailOutcomeMessage(
    { sent, unknown: 0, failed: 0 },
    sent === 1 ? 'מייל "האירוע בוטל" נשלח' : 'מיילי "האירוע בוטל" נשלחו',
  )
  if (sentReport) toast.success(sentReport.message)
  for (const o of outcomes) {
    if (o.status !== EMAIL_SEND_RESULT.SENT) {
      toast.error(`מייל "האירוע בוטל" אל ${o.name}: ${o.text}`)
    }
  }
}

// ── תת-רכיבים ────────────────────────────────────────────────────────────────────────

function BannerRow({ glyph, children, testId }) {
  return (
    <div className="mt-1.5 flex items-start gap-2 first:mt-0">
      <span className="w-[13px] flex-none text-center">{glyph}</span>
      <span data-testid={testId}>{children}</span>
    </div>
  )
}

// שורת-ה-₪: האחוז + הנימוק + שורת-המשנה. הענף של כוח-עליון (ההשוואה למה ש"הלקוח
// ביטל" היה נותן — מצב ב במוקאפ) חי ב-compensationSubLine שב-src/lib (כלל 14).
function CompensationRow({ cancelType, percent, standardPercent, reasonLine, ladder }) {
  const subLine = compensationSubLine({ cancelType, standardPercent, ladder })
  return (
    <>
      <b>
        פיצוי לדיילות: <Ltr>{percent === null ? '—' : `${percent}%`}</Ltr>
      </b>
      {reasonLine ? <> — {reasonLine}</> : null}
      <span className="mt-0.5 block text-[11px] text-slate-500" data-testid="cancel-ladder">
        {subLine}
      </span>
    </>
  )
}

function TypeOption({ type, selected, submitting, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={submitting}
      data-testid={`cancel-type-${type.value}`}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-right ${
        selected ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'
      }`}
      onClick={() => onSelect(type.value)}
    >
      <span
        className={`w-3.5 flex-none text-center text-[13px] ${
          selected ? 'text-teal-700' : 'text-slate-400'
        }`}
        aria-hidden="true"
      >
        {selected ? '⦿' : '○'}
      </span>
      <span className="flex-1">
        <span className="block text-[13.5px] font-semibold text-slate-800">{type.title}</span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
          {type.description}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed font-semibold text-amber-700">
          {type.moneyLine}
        </span>
      </span>
    </button>
  )
}

// הפוטר: כפתור-ההרס (מסגרת אדומה — דפוס RowAction, לעולם לא מילוי) ואז "חזרה".
function CancelFooter({ confirmDisabled, submitting, onConfirm, onBack }) {
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-lg border-red-200 bg-red-50 px-4 py-2 text-red-600 hover:bg-red-100 hover:text-red-600"
        disabled={confirmDisabled}
        data-testid="cancel-confirm"
        onClick={onConfirm}
      >
        {submitting ? 'מבטל...' : 'בטל את הפרויקט'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
        disabled={submitting}
        data-testid="cancel-back"
        onClick={onBack}
      >
        חזרה
      </Button>
    </DialogFooter>
  )
}

// ── גוף-הדיאלוג — ממונטש רק כשהדיאלוג פתוח ──────────────────────────────────────────
function CancelProjectBody({ project, onOpenChange, onCancelled, now }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [loadedAt, setLoadedAt] = useState(null)
  const [cancelType, setCancelType] = useState(null) // 🚫 אין ברירת-מחדל — הבחירה נושאת כסף (⑦)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const projectId = project.project_id
  const eventDate = project.final_event_date
  const startTime = project.final_start_time

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // 🔴 הכלל החוסם (כרטיס §④): לעולם לא להציג את הדיאלוג עם באנר ריק או חלקי —
        // משתמשת שתאשר בלי לראות את ההשלכה היא בדיוק מה שהמשטח נועד למנוע. כשל בטעינה
        // או מדרג חסר ⇒ מצב-שגיאה עם "נסי שוב", לא באנר חסר ולא מספר מקודד-קשיח.
        const [assignments, params] = await Promise.all([
          getProjectAssignments(projectId),
          getCancellationParams(),
        ])
        if (!alive) return
        const missing = Object.values(CANCELLATION_PARAM_NAMES).filter((name) => !(name in params))
        if (missing.length > 0) {
          // שורת-הפירוט בלבד — השורה הנעולה "לא ניתן לטעון את הנתונים." מגיעה מהרכיב.
          setLoadError('מדרג-הפיצוי חסר בהגדרות המערכת.')
        } else {
          setData({ assignments, params })
          setLoadedAt(now ? new Date(now) : new Date())
          setLoadError(null)
        }
      } catch (err) {
        // ההודעה העברית של העוטף היא שורת-הפירוט (מה חסר); השורה הנעולה "לא ניתן
        // לטעון את הנתונים." מגיעה מ-PermissionAwareEmpty — לא משוכפלת לכאן.
        if (alive) setLoadError(err?.message ?? 'שגיאה לא צפויה.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- טעינה בפתיחה וברענון בלבד
  }, [reloadTick])

  if (loading || loadError) {
    return (
      <>
        {loading ? (
          <LoadingOrError loading skeleton={{ variant: 'fields' }} />
        ) : (
          // הצורה הנעולה של §3.7: השורה הנעולה + שורת-פירוט פר-משטח + "נסי שוב" —
          // אותה צורה בדיוק כמו כשל-הטעינה של כרטיס-הפרויקט.
          <PermissionAwareEmpty
            state="error"
            detail={loadError}
            onRetry={() => {
              setLoading(true)
              setReloadTick((t) => t + 1)
            }}
            testId="cancel-load-error"
          />
        )}
        {/* הכפתור הראשי מושבת כל עוד הבאנר לא הוצג במלואו (כרטיס §④, שורת-הטעינה) */}
        <CancelFooter
          confirmDisabled
          submitting={false}
          onConfirm={() => {}}
          onBack={() => onOpenChange?.(false)}
        />
      </>
    )
  }

  const banner = cancellationBannerModel(data.assignments)
  const ladderValues = {
    fullHours: data.params[CANCELLATION_PARAM_NAMES.fullHours],
    partialHours: data.params[CANCELLATION_PARAM_NAMES.partialHours],
    partialPercent: data.params[CANCELLATION_PARAM_NAMES.partialPercent],
  }
  const hours = eventDate ? hoursUntilEvent(eventDate, startTime, loadedAt) : null
  // האחוז עוקב אחרי הבחירה; לפני בחירה מוצג מדרג "הלקוח ביטל" (ברירת-תצוגה, לא ברירת-שמירה).
  const effectiveType = cancelType ?? 'customer'
  const percent = compensationPercent({
    hoursUntilEvent: hours,
    cancelType: effectiveType,
    ...ladderValues,
  })
  const standardPercent = compensationPercent({
    hoursUntilEvent: hours,
    cancelType: 'customer',
    ...ladderValues,
  })
  const reasonLine = compensationReason({
    cancelType: effectiveType,
    percent,
    fullHours: ladderValues.fullHours,
    partialHours: ladderValues.partialHours,
  })
  const ladder = ladderSentence(ladderValues)
  const daysBefore = eventDate
    ? eventDaysFromToday(eventDate, loadedAt.toISOString().slice(0, 10))
    : null

  const reasonEmpty = reason.trim() === ''
  const confirmDisabled = submitting || !cancelType || reasonEmpty

  const handleConfirm = async () => {
    if (confirmDisabled) return
    setSubmitting(true)
    setServerError('')
    let result
    try {
      result = await cancelProject(projectId, cancelType, reason.trim())
    } catch (err) {
      // הודעת-השרת (כבר-בוטל · האירוע-התקיים · סוג-לא-מוכר) מוצגת כלשונה, עטופה בנוסח
      // הכרטיס (§④): הדיאלוג נשאר פתוח עם כל הערכים, ולעולם לא "בוטל" כשלא בוטל.
      setServerError(
        `הביטול לא בוצע — ${err?.message ?? 'שגיאה לא צפויה.'} הפרויקט לא השתנה, והדיילות לא שוחררו.`,
      )
      setSubmitting(false)
      return
    }

    // ── מכאן: הביטול קרה ואינו הפיך. המיילים — רק עכשיו (AR-5); כשלם אינו "מבטל"
    // ביטול שכבר בוצע. ואז — שורת "הצלחה" של הכרטיס המאושר: הדיאלוג נסגר, הכרטיס
    // נטען מחדש (onCancelled ⇒ refresh) עם תג "בוטל", והדיווח עובר בטוסטים.
    const mailOutcomes = await sendCancellationMails({
      toNotify: result?.hostesses_to_notify ?? [],
      project,
    })
    toast.success(cancelSuccessMessage(result?.released_rows))
    reportCancellationMails(toast, mailOutcomes)
    setSubmitting(false)
    onCancelled?.(result)
    onOpenChange?.(false)
  }

  return (
    <>
      {/* באנר-ההשלכה — ענבר (מודיע, לא כשל). ארבע שורות-גליף ⚠ ✉ ₪ ▥, בסדר הזה,
          וכל שורה נקראת לבד גם בלי הצבע (מבחן השחור-לבן של המוקאפ). */}
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
        data-testid="cancel-banner"
      >
        <BannerRow glyph="⚠">
          <b>
            ביטול <Ltr>{daysBefore === null ? '—' : String(daysBefore)}</Ltr> ימים לפני האירוע.
          </b>
        </BannerRow>
        <BannerRow glyph="✉" testId="cancel-released-row">
          {releasedSentence(banner)}
        </BannerRow>
        <BannerRow glyph="₪">
          <CompensationRow
            cancelType={cancelType}
            percent={percent}
            standardPercent={standardPercent}
            reasonLine={reasonLine}
            ladder={ladder}
          />
        </BannerRow>
        <BannerRow glyph="▥">
          <b>פריטי הלוגיסטיקה לא משתנים.</b> מה שכבר הוזמן נשאר מסומן כהוזמן — זו הראיה לחיוב
          ההוצאות שבוצעו לפני הביטול.
        </BannerRow>
      </div>

      {/* סוג הביטול — בחירת-חובה בלי ברירת-מחדל: הבחירה נושאת כסף (100% מול 0%). */}
      <div>
        <span className="mb-1.5 block text-xs text-slate-500" id="cancel-type-label">
          סוג הביטול — חובה לבחור אחד
        </span>
        <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="cancel-type-label">
          {CANCEL_TYPES.map((type) => (
            <TypeOption
              key={type.value}
              type={type}
              selected={cancelType === type.value}
              submitting={submitting}
              onSelect={setCancelType}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500" htmlFor="cancel-reason">
          סיבת הביטול — חובה
        </label>
        <textarea
          id="cancel-reason"
          rows={2}
          value={reason}
          disabled={submitting}
          data-testid="cancel-reason"
          placeholder="למשל: הלקוח דחה את האירוע לרבעון הבא"
          className={`w-full resize-y rounded-lg border px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
            reasonEmpty && cancelType ? 'border-red-600' : 'border-slate-300'
          }`}
          onChange={(e) => setReason(e.target.value)}
        />
        {reasonEmpty && cancelType ? (
          <span
            className="text-[11px] font-semibold text-red-600"
            role="alert"
            data-testid="cancel-reason-error"
          >
            {EMPTY_CANCEL_REASON_MESSAGE}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">
            נשמרת בכרטיס הפרויקט וזמינה לדו"חות. חובה בכל אחד משלושת הסוגים.
          </span>
        )}
      </div>

      <div className="text-[11px] leading-relaxed text-slate-500">
        התאריך, השעה ומי ביצעה את הביטול — נחתמים אוטומטית עם האישור, ואינם ניתנים לעריכה.
      </div>

      {serverError ? (
        <p
          className="text-sm font-semibold text-red-600"
          role="alert"
          data-testid="cancel-server-error"
        >
          {serverError}
        </p>
      ) : null}

      <CancelFooter
        confirmDisabled={confirmDisabled}
        submitting={submitting}
        onConfirm={handleConfirm}
        onBack={() => onOpenChange?.(false)}
      />
    </>
  )
}

export default function CancelProjectDialog({ project, open, onOpenChange, onCancelled, now }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>ביטול פרויקט</DialogTitle>
          <DialogDescription>
            הפרויקט ייסגר, הדיילות ישוחררו, והעובדה תישמר בכרטיס — <b>והפעולה אינה הפיכה</b>.
          </DialogDescription>
        </DialogHeader>
        {open && project ? (
          <CancelProjectBody
            project={project}
            onOpenChange={onOpenChange}
            onCancelled={onCancelled}
            now={now}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
