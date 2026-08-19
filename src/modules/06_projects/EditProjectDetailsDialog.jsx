// דיאלוג "עריכת פרטי האירוע" (מודול 6 · משטח 2 · מצב ב׳ של המוקאפ המאושר) — הכתיבה
// היחידה של המעטפת: RPC אחד (update_project_details) בטרנזקציה אחת. שלושת השדות, שלוש
// התנהגויות (spec.md §2.5): תאריך מאפס אישורים ומזמין מחדש · מיקום שומר אישורים ומאפס
// lat/lng · שעות שומרות אישורים ושולחות עדכון שנוקב בשעות החדשות.
//
// 🔴 המיילים יוצאים מהלקוח אחרי הצלחת ה-RPC (AR-5), לעולם לא בתוכו — והדיווח הוא
// פר-נמען בשלוש תוצאות (נשלח/לא-ידוע/נכשל), אותה הבחנה כמו במודול 4.
//
// ⚠️ האב מרנדר את הדיאלוג עם key שמשתנה בכל פתיחה (remount = איפוס-טופס) — הדפוס
// הקנוני של CustomerFormDialog: אתחול מ-props ב-useState בלבד, בלי effect-סנכרון.

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Ltr from '@/components/Ltr'
import { useToast } from '@/components/ToastProvider'
import { finalAssignmentRows } from '@/lib/hostesses'
import { eventDaysFromToday } from '@/lib/projects'
import {
  validateDetailsForm,
  parseDmyToIso,
  isoToDmy,
  dateChangeBanner,
  mailOutcomeMessage,
  saveSuccessMessage,
  CROSS_MIDNIGHT_NOTICE,
  PAST_DATE_NOTICE,
  REACTIVATION_NOTICE,
} from '@/lib/projectCard'
import {
  updateProjectDetails,
  getProjectAssignments,
  sendDateChangeReinvites,
  sendDetailsChangedMails,
} from './api'

// "18:00:00" מהמסד ⇒ "18:00" לשדה-הקלט; ריק נשאר ריק (שעות הן nullable, both-or-neither).
function hhmm(value) {
  return typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : ''
}

// שגיאת-שדה מתחת לשדה — אותה צורה כמו CustomerFormDialog.
function FieldError({ name, message }) {
  if (!message) return null
  return (
    <p className="text-xs font-semibold text-red-600" data-testid={`edit-project-error-${name}`}>
      {message}
    </p>
  )
}

export default function EditProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  overviewRow,
  canReadHostesses,
  onSaved,
}) {
  const toast = useToast()

  const [dateText, setDateText] = useState(() => isoToDmy(project?.final_event_date))
  const [location, setLocation] = useState(() => project?.final_location ?? '')
  const [startTime, setStartTime] = useState(() => hhmm(project?.final_start_time))
  const [endTime, setEndTime] = useState(() => hhmm(project?.final_end_time))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  // "היום" מחושב פעם אחת ב-mount (react-hooks/purity אוסר שעון ברינדור) — הדיאלוג חי דקות.
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  // שמות המאושרות-סופית לבאנר ㉑ — נטענים רק כשיש הרשאת 'דיילות'; בלעדיה הבאנר מונה
  // בלי שמות (as-built ⑤ — נוסח-המונה, לעולם לא undefined ליד פסיק).
  const [approvedNames, setApprovedNames] = useState(null)

  const confirmedCount = Number(overviewRow?.hostesses_confirmed) || 0
  const requiredCount = Number(overviewRow?.required_hostess_count) || 0

  useEffect(() => {
    if (!open || !canReadHostesses || confirmedCount === 0 || !project?.project_id) return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getProjectAssignments(project.project_id)
        if (cancelled) return
        const names = finalAssignmentRows(rows)
          .filter((row) => row.assignment_status === 'finally_approved')
          .map((row) => row.hostesses?.full_name)
          .filter(Boolean)
        setApprovedNames(names)
      } catch {
        // כשל-טעינת-שמות אינו חוסם את הבאנר — הוא נופל לנוסח-המונה, שנכון תמיד.
        if (!cancelled) setApprovedNames(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, canReadHostesses, confirmedCount, project?.project_id])

  const parsedIso = parseDmyToIso(dateText)
  const dateChanged = Boolean(parsedIso) && parsedIso !== project?.final_event_date
  const newDateDays = parsedIso ? eventDaysFromToday(parsedIso, todayIso) : null

  // באנר-ההשלכה (㉑) — לפני האישור, ברגע שהשדה השתנה; הוא אינו קבוע (כרטיס-המסך ①).
  const banner = useMemo(
    () =>
      dateChanged
        ? dateChangeBanner({ confirmedCount, names: approvedNames, requiredCount })
        : null,
    [dateChanged, confirmedCount, approvedNames, requiredCount],
  )

  // הפשרה (as-built ③): מ"ממתין לסגירה", תאריך עתידי מחזיר את הפרויקט לציר הפעיל —
  // ההשלכה נאמרת לפני האישור. תאריך עבר מ-event_finished יסורב בשרת והודעתו תוצג כלשונה.
  const reactivating =
    project?.project_status === 'event_finished' && dateChanged && (newDateDays ?? 0) >= 0

  // שני המודיעים-שאינם-חוסמים (S-17): תאריך בעבר — רגוע; חוצה-חצות — ענבר. אף אחד
  // מהם אינו משבית את השמירה — "הזמן מודיע, לעולם אינו מחליט" (⑯).
  const pastDate = dateChanged && newDateDays != null && newDateDays < 0
  const crossMidnight =
    /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && endTime < startTime

  async function save() {
    const nextErrors = validateDetailsForm({ dateText, location, startTime, endTime })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    setServerError('')
    let result
    try {
      result = await updateProjectDetails(project.project_id, {
        eventDate: parsedIso,
        location: location.trim(),
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
      })
    } catch (err) {
      // 🔴 הודעת-השרת מוצגת כלשונה (AR-10: העברית המוגמרת — כולל שם הדיילת והאירוע
      // המתנגש — מגיעה מה-RPC; הלקוח לעולם אינו משחזר אותה). הדיאלוג נשאר פתוח עם
      // הערכים שהוקלדו (כרטיס-המסך ④ — לא לסגור ולא לאבד הקלדה).
      setServerError(err.message)
      setSaving(false)
      return
    }

    // ── מכאן: השמירה הצליחה. מיילים — רק עכשיו (AR-5), וכשלם אינו מבטל את השמירה. ──
    const reinviteIds = (result?.hostesses_to_reinvite ?? []).map((h) => h.hostess_id)
    const notifyIds = (result?.hostesses_to_notify ?? []).map((h) => h.hostess_id)
    let reinviteOutcome = null
    let updateOutcome = null
    try {
      if (result?.date_changed && reinviteIds.length > 0) {
        reinviteOutcome = await sendDateChangeReinvites(
          projectWithNewValues(),
          reinviteIds,
          window.location.origin,
        )
      }
      if ((result?.location_changed || result?.hours_changed) && notifyIds.length > 0) {
        updateOutcome = await sendDetailsChangedMails(projectWithNewValues(), notifyIds)
      }
    } catch (mailErr) {
      // תבנית חסרה / תקלה לפני שליחה — נאמר בקול; הפרטים כבר נשמרו במסד.
      toast.error(mailErr.message)
    }

    toast.success(saveSuccessMessage(result, reinviteOutcome?.sent ?? 0))
    if (result?.reactivated) {
      // התג והלשוניות נגזרים מחדש ברענון של האב — הטוסט רק אומר מה קרה.
      toast.info('הפרויקט חזר לציר הפעיל.')
    }
    reportReinviteOutcome(result, reinviteIds, reinviteOutcome)
    reportUpdateOutcome(updateOutcome)

    setSaving(false)
    onSaved?.(result)
    onOpenChange(false)
  }

  // הבונים של המיילים קוראים את פרטי-האירוע מהאובייקט — חייבים את הערכים *החדשים*,
  // לא את השורה שהייתה טעונה כשהדיאלוג נפתח.
  function projectWithNewValues() {
    return {
      ...project,
      final_event_date: parsedIso,
      final_location: location.trim(),
      final_start_time: startTime.trim() ? `${startTime.trim()}:00` : null,
      final_end_time: endTime.trim() ? `${endTime.trim()}:00` : null,
    }
  }

  function reportReinviteOutcome(result, reinviteIds, outcome) {
    if (!outcome) return
    // כשאין הרשאת-דיילות אין מאיפה לקחת כתובות — האמת נאמרת במקום "N נכשלו" סתמי.
    if (outcome.failed === reinviteIds.length && result?.can_read_hostesses === false) {
      toast.error(
        'הזימונים מחדש לא נשלחו — אין לך הרשאה לצפות בדיילות, ולכן אין מכאן דרך לשלוח אליהן.',
      )
      return
    }
    const report = mailOutcomeMessage(outcome, 'זימונים מחדש נשלחו')
    if (report?.isError) toast.error(report.message)
  }

  function reportUpdateOutcome(outcome) {
    if (!outcome) return
    if (outcome.blockedReason === 'permission') {
      toast.error(
        'מיילי העדכון לא נשלחו — אין לך הרשאה לצפות בדיילות, ולכן אין מכאן דרך לשלוח אליהן.',
      )
      return
    }
    if (outcome.blockedReason === 'contact') {
      toast.error(
        'מיילי העדכון לא נשלחו — למנהלת הפרויקט חסר שם או טלפון, ואין איש-קשר לציין במייל.',
      )
      return
    }
    const report = mailOutcomeMessage(
      outcome,
      outcome.sent === 1 ? 'מייל עדכון נשלח' : 'מיילי עדכון נשלחו',
    )
    if (!report) return
    if (report.isError) toast.error(report.message)
    else toast.success(report.message)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" data-testid="edit-project-dialog">
        <DialogHeader>
          <DialogTitle>עריכת פרטי האירוע</DialogTitle>
          <DialogDescription className="text-[12.5px] text-slate-500">
            {project?.event_name} · {project?.customer_name}. שינוי כאן משנה את הפרויקט בלבד — ההצעה
            שהלקוח אישר נשארת כפי שהיא.
          </DialogDescription>
        </DialogHeader>

        {banner && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
            data-testid="edit-project-date-banner"
          >
            <b>⚠ {banner.opening}</b> {banner.body}{' '}
            <span>
              מדד הצוות יחזור מ-<Ltr>{banner.metricFrom}</Ltr> ל-<Ltr>{banner.metricTo}</Ltr>.
            </span>
          </div>
        )}
        {reactivating && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
            data-testid="edit-project-reactivation-notice"
          >
            {REACTIVATION_NOTICE}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-project-date" className="text-xs text-slate-500">
              תאריך האירוע
            </label>
            <Input
              id="edit-project-date"
              dir="ltr"
              value={dateText}
              onChange={(e) => setDateText(e.target.value)}
              placeholder="DD/MM/YYYY"
              data-testid="edit-project-date-input"
            />
            <span className="text-[11px] text-slate-500">
              התאריך הנוכחי: <Ltr>{isoToDmy(project?.final_event_date)}</Ltr>
            </span>
            {/* תאריך בעבר — מודיע ברוגע, לעולם לא חוסם (S-17). */}
            {pastDate && (
              <span className="text-[11.5px] text-slate-400" data-testid="edit-project-past-date">
                {PAST_DATE_NOTICE}
              </span>
            )}
            <FieldError name="date" message={errors.date} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-project-location" className="text-xs text-slate-500">
              מיקום
            </label>
            <Input
              id="edit-project-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="למשל: היכל התרבות, תל אביב"
              data-testid="edit-project-location-input"
            />
            <span className="text-[11px] text-slate-500">
              שינוי מיקום אינו מבטל אישורים. הדיילות מקבלות עדכון, והנקודה על המפה נקבעת מחדש.
            </span>
            <FieldError name="location" message={errors.location} />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="edit-project-start" className="text-xs text-slate-500">
              שעות האירוע
            </label>
            {/* טווח-שעות = פקד אחד ב-LTR (חוק-בית 4, ‏.trange במוקאפ): התחלה משמאל, סיום
                מימין, והזוג צמוד לקצה הימני — מתחת לתווית העברית שלו. */}
            <div dir="ltr" className="flex items-center justify-end gap-2 [unicode-bidi:isolate]">
              <Input
                id="edit-project-start"
                className="w-[110px]"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:MM"
                data-testid="edit-project-start-input"
              />
              <span className="text-slate-400">–</span>
              <Input
                id="edit-project-end"
                className="w-[110px]"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:MM"
                data-testid="edit-project-end-input"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              שינוי שעות אינו מבטל אישורים. הדיילות מקבלות עדכון שנוקב בשעות החדשות.
            </span>
            {/* חוצה-חצות — ענבר, מודיע ואינו חוסם: 22:00–02:00 חוקי לגמרי בענף (S-17). */}
            {crossMidnight && (
              <span
                className="text-[11px] font-semibold text-amber-700"
                data-testid="edit-project-cross-midnight"
              >
                {CROSS_MIDNIGHT_NOTICE}
              </span>
            )}
            <FieldError name="hours" message={errors.hours} />
          </div>
        </div>

        {serverError && (
          <p
            role="alert"
            className="text-xs font-semibold text-red-600"
            data-testid="edit-project-server-error"
          >
            {serverError}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-auto bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            data-testid="edit-project-save"
          >
            שמור ושלח זימון מחדש
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-auto border-slate-300 px-4 py-2 text-slate-700"
            data-testid="edit-project-cancel"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
