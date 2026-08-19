// לשונית סגירת-האירוע (מודול 6 · משטח 5 · צעד 3.5) — המשטח הכבד במודול, והכלל שמחזיק אותו:
// 🔑 שום דבר כאן אינו נשמר לפני "שמור ושלח" — כל בחירה יושבת בטיוטה-בזיכרון (R-1: אין טבלת-
// טיוטה, אין autosave, ואין navigation guard — לוגיקה למקרה שקיומו נשלל), ונכתבת בפעולה
// אטומית אחת (ט4-ד).
//
// סדר-השמירה שאסור להפוך (spec §2.2): העלאה ל-reports/<project_id>/… ⇒ RPC אטומי אחד
// (נתיב + סטטוס) ⇒ בכשל ה-RPC מוחקים את הקובץ. ואחרי ה-commit, ורק אז (AR-5): מייל-הדוח
// ללקוח (להוריד ולצרף, לא קישור) ⇒ מייל-הסקר ⇒ mark_feedback_survey_sent רק בהצלחת-הסקר.
// מייל שנכשל משאיר את הסגירה עומדת, feedback_status נשאר not_sent (וזו עכשיו האמת), והמסך
// אומר בשם איזה מייל נכשל. בקרת-השליחה מושבתת לכל שלב-השליחה — ל-email_log אין ייחודיות על
// (entity_type, entity_id, recipient), ולחיצה שנייה באמצע הייתה שולחת ללקוח שני דוחות.
//
// מי מפעיל: פעולה רק ל-canEdit+canReadHostesses (מה-ייחשב-עובד #6 — רק מנהלת פרויקטים
// ומנכ"ל; מנהלת לוגיסטיקה מחזיקה edit על 'פרויקטים' אך ➖ על 'דיילות' — היא אינה יכולה
// לקרוא את רשימת-הסגירה שה-RPC דורש במדויק, ולכן פקדים אצלה היו מציעים פעולה בלתי-אפשרית).
// לכל השאר הלשונית קריאה-בלבד — קיימת, לא מושבתת-בלי-הסבר.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import StatusTag from '@/components/StatusTag'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { useToast } from '@/components/ToastProvider'
import { cn } from '@/lib/utils'
import { formatDate, formatTimeRange, formatTimestampFull } from '@/lib/dates'
import {
  ATTENDANCE_OPTIONS,
  isNoShowAttendance,
  hostessActualCost,
  closingValidationSummary,
  plannedEventHours,
} from '@/lib/projectClosing'
import {
  buildClosingRows,
  rowKey,
  rowEffectiveHours,
  applyAttendance,
  applyQuality,
  applyQualityReason,
  applyRowHours,
  NEGATIVE_QUALITY_LABEL,
  assignedCounterText,
  markedRowsCount,
  totalActualCost,
  draftForValidation,
  buildPayloadRows,
  EVENT_HOURS_ERROR,
  EVENT_GUESTS_ERROR,
  attendanceMissingError,
  qualityMissingError,
  NEGATIVE_REASON_ERROR,
  rowHoursError,
  eventHoursInvalid,
  eventGuestsInvalid,
  rowHoursOutOfRange,
  fileSizeText,
  changeLineText,
  validateReportFile,
  isStalenessMessage,
  STALENESS_CONSEQUENCE,
  RESEND_STATE_SENTENCE,
  attendanceLabelFromColumns,
  qualityLabelFromValue,
} from '@/lib/closingDraft'
import { SHIFT_LEAD_LABEL } from '@/lib/projectTeam'
import {
  buildProjectReportPayload,
  buildFeedbackSurveyPayload,
  FEEDBACK_TEMPLATE_NAME,
  SURVEY_LINK_PARAM_NAME,
} from '@/lib/shiftEmails'
import { classifySendError, EMAIL_SEND_RESULT } from '@/lib/email'
import { sendEmail, getEmailTemplate, getLastSuccessfulSend } from '@/api/email'
import {
  getProjectAssignments,
  getProjectQuoteMeta,
  getProjectChanges,
  closeProjectOperationally,
  markFeedbackSurveySent,
} from './api'
import {
  REPORT_MAX_BYTES,
  REPORT_ALLOWED_MIME,
  uploadReportFile,
  deleteReportFile,
  downloadReportAsBase64,
  getReportSignedUrl,
  getCustomerMailContact,
  getCustomerPreferences,
  getParamValue,
  fileToBase64,
} from './closingApi'
import ScopeChangeDialog from './ScopeChangeDialog'

// המחרוזת של המצב-הריק החוקי (#7) — אירוע יכול להגיע לסגירה עם אפס דיילות מאושרות,
// והמסך אסור שייראה כאילו נכשל: הסגירה נשארת אפשרית משלושת שדות-האירוע לבדם.
const LEGAL_EMPTY_SENTENCE = 'לא שובצו דיילות לאירוע הזה — אין מה לסמן'

// ההשלכה של ㉔ (as-built ⑥): הדיאלוג כותב למסד מיד, בעוד טיוטת-הסגירה רק בזיכרון — בלי
// המשפט הזה, נטישת הסגירה אחרי רישום-שינוי נקראת כ"השינוי אבד". (הנחתי — נוסח שלי.)
const SCOPE_COMMITS_NOW_NOTE =
  'שינוי שנשמר בדיאלוג נרשם במסד מיד — גם אם הסגירה לא תושלם, השינוי יישאר רשום וייכנס לחיוב.'

// שמות המיילים כפי שהם נקראים על המסך בכשל — "המסך אומר בשם איזה מייל נכשל".
const REPORT_MAIL_NAME = 'מייל דוח-הסיכום'
const SURVEY_MAIL_NAME = 'מייל הסקר'

function parseNumber(text) {
  if (text === '' || text === null || text === undefined) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

// שליחת מייל-הדוח: מוריד/ממיר את הקובץ, בונה payload עם מצורף-חובה, ושולח כ-project_report.
// מחזירה null בהצלחה, או את סיווג-הכשל (failed/unknown — פסק-זמן אינו "נכשל": המייל אולי יצא).
async function trySendReportMail({ contact, project, localFile, reportPath }) {
  try {
    const attachmentBase64 = localFile
      ? await fileToBase64(localFile)
      : await downloadReportAsBase64(reportPath)
    const filename = localFile?.name ?? String(reportPath).split('/').pop()
    const payload = buildProjectReportPayload({ contact, project, filename, attachmentBase64 })
    if (!payload) throw new Error('REPORT_PAYLOAD_EMPTY')
    await sendEmail({
      payload,
      entityType: 'project_report',
      entityId: project.project_id,
      // אין תבנית זרועה לדוח-הסיכום — הגוף חי בקוד (shiftEmails); template_name nullable.
      templateName: null,
    })
    return null
  } catch (err) {
    return classifySendError(err)
  }
}

// שליחת מייל-הסקר: התבנית הזרועה + פרמטר-הקישור, entityType 'project' (בלי מצורף).
async function trySendSurveyMail({ contact, project }) {
  try {
    const [template, surveyUrl] = await Promise.all([
      getEmailTemplate(FEEDBACK_TEMPLATE_NAME),
      getParamValue(SURVEY_LINK_PARAM_NAME),
    ])
    const payload = buildFeedbackSurveyPayload({ template, surveyUrl, contact, project })
    if (!payload) throw new Error('SURVEY_PAYLOAD_EMPTY')
    await sendEmail({
      payload,
      entityType: 'project',
      entityId: project.project_id,
      templateName: FEEDBACK_TEMPLATE_NAME,
    })
    return null
  } catch (err) {
    return classifySendError(err)
  }
}

// (overviewRow מתקבל מהמעטפת לפי חוזה-הצעד אך אינו נצרך כאן — כל נתוני-הלשונית מגיעים
// משורת-הפרויקט ומהשליפות הישירות; אי-פירוקו מה-props מכוון.)
export default function ClosingTab({ project, canEdit, canReadHostesses, onSaved }) {
  const toast = useToast()
  const projectId = project?.project_id

  // סגירה שהתרחשה בפרופ (טעינה של פרויקט סגור) או ברגע זה (localClosed — כשמייל נכשל אין
  // רענון-עמוד אוטומטי, כי הרענון היה מוחק את הודעת-הכשל בשם; המסך הנעול מרונדר מקומית).
  const [localClosed, setLocalClosed] = useState(null)
  const isClosed = Boolean(project?.operationally_closed_at) || Boolean(localClosed)
  const canAct = canEdit && canReadHostesses

  // ── טעינה ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [quoteMeta, setQuoteMeta] = useState(null)
  const [mailContact, setMailContact] = useState(null)
  const [changes, setChanges] = useState([])
  const [preferences, setPreferences] = useState([])
  const [reloadTick, setReloadTick] = useState(0)

  // ── הטיוטה-בזיכרון (R-1) ───────────────────────────────────────────────────
  const [rows, setRows] = useState([])
  const [hoursText, setHoursText] = useState('')
  const [guestsText, setGuestsText] = useState('')
  const [hoursTouched, setHoursTouched] = useState(false)
  const [guestsTouched, setGuestsTouched] = useState(false)
  const [reportFile, setReportFile] = useState(null)
  const [reportError, setReportError] = useState(null)
  const fileInputRef = useRef(null)

  // ── שמירה/שליחה ────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [staleMessage, setStaleMessage] = useState(null)
  const [mailFailure, setMailFailure] = useState(null)
  const [feedbackStatus, setFeedbackStatus] = useState(project?.feedback_status ?? 'not_sent')

  // ㉔ — הדיאלוג הקיים של משטח 6, remount דרך key בכל פתיחה (הדפוס של ProjectCardPage).
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeSession, setScopeSession] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // איש-הקשר נטען לבאנר ולמיילים; קריאה חסומה ('לקוחות') מחזירה null בשקט — הבאנר
        // נופל לשם-הלקוח מה-snapshot, והכשל האמיתי (אם יש) יקרה בשליחה עם הודעה בשמו.
        const [assignments, meta, contact, changeRows] = await Promise.all([
          canReadHostesses ? getProjectAssignments(projectId) : Promise.resolve([]),
          project?.quote_id ? getProjectQuoteMeta(project.quote_id) : Promise.resolve(null),
          project?.customer_id
            ? getCustomerMailContact(project.customer_id).catch(() => null)
            : Promise.resolve(null),
          getProjectChanges(projectId),
        ])
        if (cancelled) return
        setQuoteMeta(meta)
        setMailContact(contact)
        setChanges(changeRows)
        setRows((prev) => (prev.length > 0 ? prev : buildClosingRows(assignments)))
        // סימוני-איכות שמורים — רק למצב-הנעול (קריאה-בלבד); בטיוטה אין מה לקרוא.
        if (project?.operationally_closed_at && project?.customer_id && canReadHostesses) {
          const ids = buildClosingRows(assignments).map((r) => r.hostessId)
          const prefs = await getCustomerPreferences(project.customer_id, ids).catch(() => [])
          if (!cancelled) setPreferences(prefs)
        }
        setLoadError(null)
      } catch (err) {
        // 🔴 שגיאת-טעינה מפורשת + "נסי שוב", לעולם לא רשימה ריקה — טבלה שריקה בשקט
        // זהה ל"אין דיילות", ודנה הייתה סוגרת אירוע בלי לסמן איש.
        if (!cancelled) {
          console.error('closing tab load failed:', err)
          setLoadError('לשונית הסגירה לא נטענה.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadTick, canReadHostesses])

  // ── נגזרות ─────────────────────────────────────────────────────────────────
  const eventHoursNum = parseNumber(hoursText)
  const eventGuestsNum = parseNumber(guestsText)
  const plannedHours = plannedEventHours(project?.final_start_time, project?.final_end_time)
  const plannedRange = formatTimeRange(project?.final_start_time, project?.final_end_time)

  const validationSummary = useMemo(
    () =>
      closingValidationSummary(
        draftForValidation({
          rows,
          eventHours: hoursText,
          eventGuests: guestsText,
          hasReport: Boolean(reportFile),
        }),
      ),
    [rows, hoursText, guestsText, reportFile],
  )

  // הגבולות עצמם חיים ב-closingDraft (כלל 14) — כאן רק קוראים לפרדיקטים.
  const hoursInvalid = eventHoursInvalid(eventHoursNum)
  const guestsInvalid = eventGuestsInvalid(eventGuestsNum)
  const fieldsOk = !hoursInvalid && !guestsInvalid
  const marked = markedRowsCount(rows)
  const allMarked = rows.length === 0 || marked === rows.length
  const ready = fieldsOk && Boolean(reportFile) && allMarked

  // ── שלב-השליחה המשותף לשמירה ולשליחה-החוזרת ───────────────────────────────
  // מחזיר {ok, message, surveyMarked}. שמות-המיילים מופיעים בהודעה — לא "השליחה נכשלה" סתמי.
  const runMailPhase = useCallback(
    async ({ localFile, reportPath, skipReport }) => {
      let contact = mailContact
      if (!contact?.email && project?.customer_id) {
        contact = await getCustomerMailContact(project.customer_id).catch(() => null)
      }
      if (!contact?.email) {
        return {
          ok: false,
          surveyMarked: false,
          message:
            'המיילים לא יצאו — ללקוח אין כתובת מייל זמינה. אפשר לשלוח שוב אחרי עדכון הכתובת.',
        }
      }

      const failures = []
      const unknowns = []
      const record = (name, sendResult) => {
        if (sendResult === EMAIL_SEND_RESULT.UNKNOWN) unknowns.push(name)
        else if (sendResult === EMAIL_SEND_RESULT.FAILED) failures.push(name)
      }

      if (!skipReport) {
        record(
          REPORT_MAIL_NAME,
          await trySendReportMail({ contact, project, localFile, reportPath }),
        )
      }
      const surveyResult = await trySendSurveyMail({ contact, project })
      record(SURVEY_MAIL_NAME, surveyResult)

      // AR-5: feedback_status='sent' נכתב **רק** אחרי שליחת-סקר שהצליחה בפועל — "לא ידוע"
      // אינו הצלחה, וסימון עליו היה הופך את העמודה לשקר בדיוק כשהיא הכי נחוצה.
      let surveyMarked = false
      if (surveyResult === null) {
        try {
          await markFeedbackSurveySent(projectId)
          surveyMarked = true
        } catch {
          failures.push('עדכון סטטוס-הסקר (הסקר עצמו נשלח)')
        }
      }

      if (failures.length === 0 && unknowns.length === 0) {
        return { ok: true, surveyMarked, recipientName: contact.contact_name ?? '' }
      }
      const parts = []
      if (failures.length > 0) parts.push(`${failures.join(' ו')} לא יצא`)
      if (unknowns.length > 0)
        parts.push(`לא ידוע אם ${unknowns.join(' ו')} יצא — בדקי בתיבת "נשלחו" לפני שליחה חוזרת`)
      return {
        ok: false,
        surveyMarked,
        message: `הסגירה נשמרה. ${parts.join(' · ')} — אפשר לשלוח שוב.`,
      }
    },
    [mailContact, project, projectId],
  )

  // ── שמירה: העלאה ⇒ RPC ⇒ (רק אחרי commit) מיילים ─────────────────────────
  const handleSave = useCallback(async () => {
    if (sending || validationSummary) return
    setSending(true)
    setSaveError(null)
    setStaleMessage(null)

    let uploadedPath = null
    let envelope = null
    try {
      const uploaded = await uploadReportFile(projectId, reportFile)
      uploadedPath = uploaded.path
      envelope = await closeProjectOperationally(projectId, {
        actualHours: eventHoursNum,
        actualGuests: eventGuestsNum,
        reportPath: uploadedPath,
        rows: buildPayloadRows(rows, eventHoursNum),
      })
    } catch (err) {
      // כשל אחרי שהקובץ עלה ⇒ מחיקת הקובץ (קובץ יתום הוא לכלוך שקוף; פרויקט סגור בלי
      // דוח הוא שבר-נתונים — כאן זה הכיוון הראשון).
      if (uploadedPath && !envelope) await deleteReportFile(uploadedPath)
      const message = err?.message || 'סגירת האירוע נכשלה.'
      if (isStalenessMessage(message)) setStaleMessage(message)
      else setSaveError(message)
      setSending(false)
      return
    }

    // מכאן הסגירה עומדת — כל כשל הוא כשל-מייל בלבד, והבקרה נשארת מושבתת עד סוף השלב.
    const outcome = await runMailPhase({ localFile: reportFile, reportPath: uploadedPath })
    setSending(false)
    if (outcome.surveyMarked) setFeedbackStatus('sent')

    if (outcome.ok) {
      const recipient = outcome.recipientName || project?.customer_name || 'הלקוח'
      // משפט-ההצלחה של הכרטיס (④), בשם החי של איש-הקשר.
      toast.success(`האירוע נסגר. הדוח נשלח ל${recipient}, והפרויקט עבר למנהלת הכספים.`)
      if (envelope?.preferences_saved === false && rows.some((r) => r.qualityLabel)) {
        // 2.3 as-built ②: customer_id ריק ⇒ ה-upsert דולג והסגירה מושלמת — לומר, לא לשקר.
        toast.info('סימוני-האיכות לא נשמרו — לפרויקט אין לקוח משויך.')
      }
      onSaved?.()
      return
    }
    // הסגירה עומדת אך מייל נכשל — אין רענון-עמוד (הוא היה מוחק את ההודעה בשם); המסך
    // הנעול מרונדר מקומית עם הכשל ובקרת השליחה-החוזרת, מערכי-הטיוטה שזה-עתה נשמרו.
    setMailFailure(outcome.message)
    setLocalClosed({
      envelope,
      reportPath: uploadedPath,
      actualHours: eventHoursNum,
      actualGuests: eventGuestsNum,
    })
  }, [
    sending,
    validationSummary,
    projectId,
    reportFile,
    eventHoursNum,
    eventGuestsNum,
    rows,
    runMailPhase,
    toast,
    onSaved,
    project,
  ])

  // ── שליחה חוזרת (מהמצב הנעול, feedback_status='not_sent') ─────────────────
  const handleResend = useCallback(async () => {
    if (sending) return
    setSending(true)
    setMailFailure(null)

    // הדוח נשלח כבר? email_log הוא מקור-האמת היחיד ל"כבר נשלח" — undefined (כשל-שאילתה)
    // מטופל כ"לא ידוע" ⇒ לא שולחים שוב דוח שאולי נשלח (הכלל של שלושת-המצבים).
    const lastReport = await getLastSuccessfulSend('project_report', projectId).catch(
      () => undefined,
    )
    const reportPath = localClosed?.reportPath ?? project?.summary_report_url
    const outcome = await runMailPhase({
      reportPath,
      skipReport: lastReport !== null,
    })
    setSending(false)
    if (outcome.surveyMarked) setFeedbackStatus('sent')

    if (outcome.ok || outcome.surveyMarked) {
      toast.success('מייל הסקר נשלח ללקוח.')
      if (!localClosed) onSaved?.()
      return
    }
    setMailFailure(outcome.message)
  }, [sending, projectId, localClosed, project, runMailPhase, toast, onSaved])

  // ── ㉔ — פתיחת דיאלוג-שינוי-התכולה מעל הטיוטה ─────────────────────────────
  // הטיוטה שורדת את הדיאלוג בזיכרון (ה-state כאן אינו מתאפס); אחרי שמירה מוצלחת הלשונית
  // קוראת-מחדש את נתוני-השינויים שלה **בלבד** — רענון-עמוד מלא היה מוחק את הטיוטה (as-built ⑥).
  const handleScopeSaved = useCallback(async () => {
    try {
      setChanges(await getProjectChanges(projectId))
    } catch {
      // הרשימה תתעדכן ברענון הבא; השינוי עצמו כבר רשום במסד.
    }
  }, [projectId])

  // ── בחירת קובץ ─────────────────────────────────────────────────────────────
  const handleFilePick = useCallback((event) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    const error = validateReportFile(file, {
      maxBytes: REPORT_MAX_BYTES,
      allowedMime: REPORT_ALLOWED_MIME,
    })
    if (error) {
      setReportError(error)
      return
    }
    setReportError(null)
    setReportFile(file)
  }, [])

  // ── רינדור ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pt-3" data-testid="closing-tab-loading">
        <LoadingOrError loading skeleton={{ variant: 'fields', rows: 3 }} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="pt-3" data-testid="closing-tab">
        <PermissionAwareEmpty
          state="error"
          detail={loadError}
          onRetry={refresh}
          testId="closing-load-error"
        />
      </div>
    )
  }

  if (isClosed) {
    return (
      <ClosedView
        project={project}
        localClosed={localClosed}
        rows={rows}
        eventHoursDraft={eventHoursNum}
        preferences={preferences}
        canReadHostesses={canReadHostesses}
        canAct={canAct}
        feedbackStatus={feedbackStatus}
        mailFailure={mailFailure}
        sending={sending}
        onResend={handleResend}
        changes={changes}
      />
    )
  }

  const totalCost = totalActualCost(rows, eventHoursNum)
  const counter = assignedCounterText(rows)

  return (
    <div className="pt-3" data-testid="closing-tab">
      {/* ═══ 🅰️ מה קרה בפועל — ברמת האירוע ═══ */}
      <section className="mb-4">
        <h2 className="text-sm font-bold text-slate-700">מה קרה בפועל — ברמת האירוע</h2>
        <p className="mb-2.5 mt-0.5 text-[11.5px] text-slate-500">
          שלושת השדות חובה. בלעדיהם לא ניתן לשמור ולשלוח.
        </p>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="closing-hours" className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">שעות ביצוע בפועל</span> · חובה
            </label>
            <div className="flex items-center gap-2">
              {/* dir="ltr" על שדה-מספר — דפוס-הבית (PricingParamsCard); בלעדיו הערך נצמד
                  לקצה הימני והיחידה מתנתקת ממנו. */}
              <input
                id="closing-hours"
                data-testid="closing-hours"
                dir="ltr"
                inputMode="decimal"
                placeholder="6.5"
                disabled={!canAct}
                className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50"
                value={hoursText}
                onChange={(e) => setHoursText(e.target.value)}
                onBlur={() => setHoursTouched(true)}
                onFocus={(e) => e.target.select()}
              />
              <span className="whitespace-nowrap text-xs text-slate-500">שעות</span>
            </div>
            <span className="text-[11px] text-slate-500">
              מתוכנן: {plannedRange ? <Ltr>{plannedRange}</Ltr> : '—'} ·{' '}
              <Ltr>{String(plannedHours)}</Ltr> שעות
            </span>
            <span className="text-[11px] text-slate-500">
              קובע את ברירת-המחדל בעמודת "שעות בפועל" של כל דיילת — וניתן לדרוס אותה פר-שורה
            </span>
            {hoursTouched && hoursInvalid && (
              <span
                className="text-[11px] font-semibold text-red-600"
                data-testid="closing-hours-error"
              >
                {EVENT_HOURS_ERROR}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="closing-guests" className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">כמות אורחים בפועל</span> · חובה
            </label>
            <div className="flex items-center gap-2">
              <input
                id="closing-guests"
                data-testid="closing-guests"
                dir="ltr"
                inputMode="numeric"
                placeholder="180"
                disabled={!canAct}
                className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50"
                value={guestsText}
                onChange={(e) => setGuestsText(e.target.value)}
                onBlur={() => setGuestsTouched(true)}
                onFocus={(e) => e.target.select()}
              />
              <span className="whitespace-nowrap text-xs text-slate-500">אורחים</span>
            </div>
            <span className="text-[11px] text-slate-500">
              מתוכנן:{' '}
              {quoteMeta?.estimated_guests != null ? (
                <Ltr>{String(quoteMeta.estimated_guests)}</Ltr>
              ) : (
                '—'
              )}{' '}
              אורחים
            </span>
            <span className="text-[11px] text-slate-500">
              לתיעוד ולדו"חות בלבד — אינו משנה את החיוב ללקוח
            </span>
            {guestsTouched && guestsInvalid && (
              <span
                className="text-[11px] font-semibold text-red-600"
                data-testid="closing-guests-error"
              >
                {EVENT_GUESTS_ERROR}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">דוח-סיכום אירוע</span> · חובה
            </span>
            <div
              className="flex min-h-9 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
              data-testid="closing-file-row"
            >
              {reportFile ? (
                <>
                  {/* 🔴 שם-קובץ עברי אינו נעטף ב-Ltr — העטיפה תולשת את הסיומת לקצה הלא-נכון. */}
                  <span className="truncate text-[12.5px] font-semibold text-slate-700">
                    {reportFile.name}
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">
                    <Ltr>{fileSizeText(reportFile.size)}</Ltr>
                  </span>
                  <span className="mr-auto flex gap-2.5 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-[12.5px] font-semibold text-teal-700"
                      onClick={() => {
                        const url = URL.createObjectURL(reportFile)
                        window.open(url, '_blank')
                        setTimeout(() => URL.revokeObjectURL(url), 60_000)
                      }}
                    >
                      הורדה
                    </button>
                    {canAct && (
                      <button
                        type="button"
                        className="text-[12.5px] font-semibold text-teal-700"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="closing-file-replace"
                      >
                        החלפת קובץ
                      </button>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[12.5px] text-slate-400">טרם צורף קובץ</span>
                  {canAct && (
                    <button
                      type="button"
                      className="mr-auto whitespace-nowrap text-[12.5px] font-semibold text-teal-700"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="closing-file-pick"
                    >
                      בחירת קובץ
                    </button>
                  )}
                </>
              )}
            </div>
            {/* שלוש הסיומות = רצף אטומי אחד; המספר מרונדר מ-REPORT_MAX_BYTES, לעולם לא מוקלד. */}
            <span className="text-[11px] text-slate-500">
              ‏<Ltr>PDF · JPG · PNG</Ltr> · עד <Ltr>{`${REPORT_MAX_BYTES / 1024 / 1024}MB`}</Ltr>.
              הקובץ נשלח ללקוח כקובץ מצורף
            </span>
            {reportError && (
              <span
                className="text-[11px] font-semibold text-red-600"
                data-testid="closing-report-error"
              >
                {reportError}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={REPORT_ALLOWED_MIME.join(',')}
              className="hidden"
              onChange={handleFilePick}
              data-testid="closing-file-input"
            />
          </div>
        </div>
      </section>

      {/* ═══ 🅱️ מה קרה עם כל דיילת ═══ */}
      <section className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700">מה קרה עם כל דיילת</h2>
            <p className="mb-2.5 mt-0.5 max-w-2xl text-[11.5px] text-slate-500">
              <b>נוכחות</b> היא עובדה — היא מזינה את ציון-האמינות בשיבוץ החכם. <b>סימון-איכות</b>{' '}
              הוא שיפוט — הוא קובע את מי נציע ל{project?.customer_name ?? 'לקוח'} בפעם הבאה. שתי
              שאלות שונות, ושתיהן חובה בכל שורה.
            </p>
          </div>
          {counter && (
            <span className="pb-2.5 text-[11.5px] text-slate-400" data-testid="closing-counter">
              {counter}
            </span>
          )}
        </div>

        {!canReadHostesses ? (
          <PermissionAwareEmpty
            state="noPermission"
            title="אין לך הרשאה לצפות בדיילות המשובצות."
            detail="טבלת-הסגירה דורשת הרשאת צפייה במודול הדיילות."
            testId="closing-no-permission"
          />
        ) : rows.length === 0 ? (
          <div
            className="rounded-lg border border-slate-200 p-6 text-center text-[12.5px] text-slate-500"
            data-testid="closing-legal-empty"
          >
            {LEGAL_EMPTY_SENTENCE}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[23%]">דיילת</Th>
                  <Th className="w-[21%]">נוכחות</Th>
                  <Th className="w-[27%]">סימון-איכות</Th>
                  <Th className="w-[13%]">שעות בפועל</Th>
                  <Th className="w-[16%]">עלות בפועל</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <DraftRow
                    key={rowKey(row)}
                    row={row}
                    eventHours={eventHoursNum}
                    canAct={canAct}
                    onAttendance={(label) =>
                      setRows((prev) => applyAttendance(prev, rowKey(row), label))
                    }
                    onQuality={(label) => setRows((prev) => applyQuality(prev, rowKey(row), label))}
                    onReason={(value) =>
                      setRows((prev) => applyQualityReason(prev, rowKey(row), value))
                    }
                    onHours={(value) => setRows((prev) => applyRowHours(prev, rowKey(row), value))}
                  />
                ))}
                <tr>
                  <td
                    colSpan={4}
                    className="pt-3 text-sm font-semibold text-slate-700"
                    data-testid="closing-total-label"
                  >
                    סה"כ עלות דיילות בפועל
                  </td>
                  <td className="pt-3 text-sm font-semibold text-slate-700">
                    <span data-testid="closing-total">
                      <Money amount={totalCost} cents />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-400">
            בחירת <b>"לא לשלוח שוב"</b> פותחת מתחת לשורה שדה סיבה — <b>חובה</b>, ובלעדיו לא ניתן
            לשמור.
            <br />
            הסימון נשמר מול <b>{project?.customer_name ?? 'הלקוח'}</b> ומשפיע רק על שיבוצים עתידיים
            אצל הלקוח הזה.
          </p>
        )}
      </section>

      {/* ═══ שינויי תכולה שהתגלו באירוע (㉔ · B7) ═══ */}
      <ScopeChangesSection
        changes={changes}
        canAct={canAct}
        onOpen={() => {
          setScopeSession((s) => s + 1)
          setScopeOpen(true)
        }}
      />

      {/* ═══ מוכנות · השלכה · הפעולה הראשית ═══ */}
      {canAct && (
        <section className="mt-4">
          <div
            className="flex flex-wrap items-center gap-3.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600"
            data-testid="closing-ready-strip"
          >
            <b className="text-slate-700">{ready ? 'מוכן לשליחה' : 'טרם מוכן לשליחה'}</b>
            <ReadyItem ok={fieldsOk}>שלושת שדות-האירוע מולאו</ReadyItem>
            <ReadyItem ok={Boolean(reportFile)}>דוח-סיכום הועלה</ReadyItem>
            {rows.length > 0 && (
              <ReadyItem ok={allMarked}>
                <Ltr>{`${marked}/${rows.length}`}</Ltr> דיילות סומנו
              </ReadyItem>
            )}
          </div>

          {/* באנר-האי-הפיכות — ענבר. 🔴 הסיפא שונתה מהמוקאפ: AR-6 הוציא את הקפאת-הרווח ממ6
              (הבהרת-ישי 14/08 מאוחרת מציור המוקאפ) ⇒ נשארת העלות בלבד. */}
          <div
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800"
            data-testid="closing-banner"
          >
            <b>⚠ הלחיצה הזאת סוגרת את האירוע ואי-אפשר לבטל אותה.</b>
            <br />
            דוח-הסיכום נשלח ל
            {mailContact?.contact_name
              ? `${mailContact.contact_name}, ${project?.customer_name ?? ''}`
              : (project?.customer_name ?? 'לקוח')}{' '}
            · סקר-משוב יוצא ללקוח · הסטטוס עובר ל<b>"ממתין לחשבונית"</b> · הכרטיס ננעל לעריכה
            תפעולית · העלות בפועל קופאת · שעות הדיילות עוברות לדוח-השכר.
          </div>

          {staleMessage && (
            <div
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800"
              role="alert"
              data-testid="closing-stale"
            >
              <b>רשימת-הסגירה השתנתה מאז שהמסך נטען.</b>
              <br />
              {staleMessage}
              <br />
              {/* היושר של as-built ③: הציות ל"רענני" מוחק את הטיוטה — נאמר, לא מופתע. */}
              {STALENESS_CONSEQUENCE}
              <div className="mt-2">
                <button
                  type="button"
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800"
                  onClick={() => {
                    setStaleMessage(null)
                    setRows([])
                    refresh()
                  }}
                  data-testid="closing-stale-refresh"
                >
                  רענון הרשימה
                </button>
              </div>
            </div>
          )}

          {saveError && !staleMessage && (
            <p
              className="mt-3 text-xs font-semibold text-red-600"
              role="alert"
              data-testid="closing-save-error"
            >
              {saveError}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* הכפתור נשאר על המסך, מכובה ומנומק — משפט-סיכום אחד במקום שבע הודעות. */}
            <button
              type="button"
              disabled={Boolean(validationSummary) || sending}
              onClick={handleSave}
              className={cn(
                'rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              data-testid="closing-save"
            >
              {sending ? 'שומר ושולח…' : 'שמור ושלח'}
            </button>
            {validationSummary ? (
              <span
                className="text-[11.5px] font-semibold text-amber-700"
                data-testid="closing-summary"
              >
                ⚠ {validationSummary}
              </span>
            ) : (
              <span className="text-[11.5px] text-slate-500">
                מרגע זה הפרויקט עובר לטיפול מנהלת הכספים.
              </span>
            )}
          </div>
        </section>
      )}

      {canAct && (
        <ScopeChangeDialog
          key={`closing-scope-${scopeSession}`}
          open={scopeOpen}
          onOpenChange={setScopeOpen}
          project={project}
          onSaved={handleScopeSaved}
        />
      )}
    </div>
  )
}

function Th({ children, className }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold text-slate-500',
        className,
      )}
    >
      {children}
    </th>
  )
}

function ReadyItem({ ok, children }) {
  return (
    <span className={ok ? 'text-slate-600' : 'text-slate-400'}>
      {ok ? '✓ ' : '· '}
      {children}
    </span>
  )
}

// שורת-טיוטה אחת. ט4-א: "לא הגיעה" ⇒ פקדי-האיכות מושבתים-עם-נימוק (ריק נראה כמו שכחה,
// מושבת-ומנומק נראה כמו החלטה) ושדה-השעות כפוי ל-0 ומושבת.
function DraftRow({ row, eventHours, canAct, onAttendance, onQuality, onReason, onHours }) {
  const noShow = isNoShowAttendance(row.attendanceLabel)
  const effectiveHours = rowEffectiveHours(row, eventHours)
  const cost = hostessActualCost(effectiveHours, row.rateSnapshot)
  const negative = row.qualityLabel === NEGATIVE_QUALITY_LABEL
  const partiallyFilled = Boolean(row.qualityLabel || row.hoursOverridden)
  // הערך המוצג הוא rowEffectiveHours — הבית היחיד לסדר-הקדימויות (no_show לפני דריסה):
  // שכפול הסדר כאן הציג ערך-דריסה ישן על שורת "לא הגיעה" בעוד ה-payload שולח 0 — המסך
  // והשמירה חייבים לצאת מאותו חישוב. null (אין שעות-אירוע / דריסה שנמחקה) ⇒ שדה ריק.
  const hoursValue = rowEffectiveHours(row, eventHours) ?? ''
  const hoursOut = rowHoursOutOfRange(row, eventHours)

  return (
    <>
      <tr data-testid={`closing-row-${row.hostessId}`}>
        <td className="border-b border-slate-100 px-2.5 py-3 align-top">
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-800">
            {row.name}
            {/* תג-האחראית בצורת TeamTab (ζ) — תג אחד, מראה אחד, בשתי הלשוניות. */}
            {row.isShiftLead && <StatusTag label={SHIFT_LEAD_LABEL} tone="outline" />}
          </div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">
            {row.city && `${row.city} · `}
            <Ltr>{`${Number(row.rateSnapshot ?? 0)} ₪`}</Ltr> לשעה
          </div>
        </td>
        <td className="border-b border-slate-100 px-2.5 py-3 align-top">
          {/* פקד אחד שטוח, שבע אפשרויות (ט4/⑧④) — סדר-המוקאפ המדויק מ-ATTENDANCE_OPTIONS. */}
          <select
            aria-label={`נוכחות — ${row.name}`}
            className={cn(
              'h-[34px] w-full max-w-[190px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px]',
              'disabled:bg-slate-50 disabled:text-slate-500',
            )}
            disabled={!canAct}
            value={row.attendanceLabel ?? ''}
            onChange={(e) => onAttendance(e.target.value || null)}
            data-testid={`closing-attendance-${row.hostessId}`}
          >
            <option value="">בחרי נוכחות…</option>
            {ATTENDANCE_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          {partiallyFilled && !row.attendanceLabel && (
            <div className="mt-1 text-[11px] font-semibold text-red-600">
              {attendanceMissingError(row.name)}
            </div>
          )}
        </td>
        <td className="border-b border-slate-100 px-2.5 py-3 align-top">
          <div className="flex flex-wrap gap-1.5">
            {['מצוינת', 'בסדר', NEGATIVE_QUALITY_LABEL].map((label) => {
              const active = row.qualityLabel === label
              const isNegative = label === NEGATIVE_QUALITY_LABEL
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!canAct || noShow}
                  aria-pressed={active}
                  onClick={() => onQuality(active ? null : label)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px]',
                    active &&
                      !isNegative &&
                      'border-teal-200 bg-teal-50 font-semibold text-teal-700',
                    active &&
                      isNegative &&
                      'border-amber-200 bg-amber-50 font-semibold text-amber-700',
                    !active && 'border-slate-200 bg-white text-slate-600',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  data-testid={`closing-quality-${row.hostessId}-${label}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {noShow && (
            <div
              className="mt-1 text-[11px] text-slate-500"
              data-testid={`closing-noshow-note-${row.hostessId}`}
            >
              לא ניתן לסמן איכות — לא הגיעה, ואי-אפשר לשפוט מי שלא ראית.
            </div>
          )}
          {!noShow && row.attendanceLabel && !row.qualityLabel && (
            <div className="mt-1 text-[11px] font-semibold text-red-600">
              {qualityMissingError(row.name)}
            </div>
          )}
          {negative && !noShow && (
            <div className="mt-2">
              <input
                aria-label={`סיבת "לא לשלוח שוב" — ${row.name}`}
                placeholder="מה קרה — הסיבה תופיע בכרטיס הדיילת"
                className="h-8 w-full rounded-lg border border-amber-200 bg-white px-2.5 text-[12px]"
                disabled={!canAct}
                value={row.qualityReason}
                onChange={(e) => onReason(e.target.value)}
                data-testid={`closing-reason-${row.hostessId}`}
              />
              {!row.qualityReason && (
                <div className="mt-1 text-[11px] font-semibold text-red-600">
                  {NEGATIVE_REASON_ERROR}
                </div>
              )}
            </div>
          )}
        </td>
        <td className="border-b border-slate-100 px-2.5 py-3 align-top">
          <input
            aria-label={`שעות בפועל — ${row.name}`}
            dir="ltr"
            inputMode="decimal"
            disabled={!canAct || noShow}
            className="h-[34px] w-[74px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] disabled:bg-slate-50 disabled:text-slate-500"
            value={String(hoursValue)}
            onChange={(e) => onHours(e.target.value)}
            onFocus={(e) => e.target.select()}
            data-testid={`closing-hours-${row.hostessId}`}
          />
          {noShow && <div className="mt-1 text-[11px] text-slate-500">אין שעות</div>}
          {!noShow &&
            row.hoursOverridden &&
            eventHours != null &&
            Number(row.manualHours) !== eventHours && (
              <div className="mt-1 text-[11px] text-slate-500">
                נדרס ידנית · ברירת-מחדל <Ltr>{String(eventHours)}</Ltr>
              </div>
            )}
          {hoursOut && (
            <div className="mt-1 text-[11px] font-semibold text-red-600">
              {rowHoursError(row.name, eventHours)}
            </div>
          )}
        </td>
        <td className="border-b border-slate-100 px-2.5 py-3 align-top text-sm">
          <span
            className={noShow ? 'text-slate-400' : undefined}
            data-testid={`closing-cost-${row.hostessId}`}
          >
            <Money amount={cost} cents />
          </span>
        </td>
      </tr>
    </>
  )
}

// מקטע שינויי-התכולה (㉔): מצב-ריק כמצויר, רשימה קומפקטית כשקיימים שינויים, והמשפט
// שמונע קריאת "השינוי אבד" — הדיאלוג כותב מיד, הטיוטה לא.
function ScopeChangesSection({ changes, canAct, onOpen }) {
  const groups = useMemo(() => {
    const byGroup = new Map()
    for (const change of changes ?? []) {
      const key = change.change_group_id
      if (!byGroup.has(key)) {
        byGroup.set(key, { reason: change.reason, createdAt: change.created_at, lines: [] })
      }
      byGroup.get(key).lines.push(change)
    }
    return [...byGroup.values()]
  }, [changes])

  return (
    <section className="mt-4" data-testid="closing-changes-section">
      <h2 className="text-sm font-bold text-slate-700">שינויי תכולה שהתגלו באירוע</h2>
      <p className="mb-2.5 mt-0.5 text-[11.5px] text-slate-500">
        תוספת או הפחתה שסוכמה בשטח ולא נרשמה מראש — נרשמת כאן, ונכנסת לחיוב.
      </p>
      {groups.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-6 text-center text-[12.5px] text-slate-500">
          <span aria-hidden="true" className="mb-1.5 block text-[22px]">
            🗂️
          </span>
          לא נרשמו שינויי תכולה באירוע הזה
          {canAct && (
            <div className="mt-2">
              <button
                type="button"
                className="text-[12.5px] font-semibold text-teal-700"
                onClick={onOpen}
                data-testid="closing-change-link"
              >
                רישום שינוי שהתגלה באירוע
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200">
          {groups.map((group, i) => (
            <div
              key={i}
              className="border-b border-slate-100 px-3 py-2.5 text-[12.5px] text-slate-700 last:border-b-0"
            >
              <div className="font-semibold">{group.reason}</div>
              <div className="mt-0.5 text-[11.5px] text-slate-500">
                {/* נוסח-השורה חי ב-changeLineText (כלל 14) — לא מנוסח כאן מחדש. */}
                {group.lines.map(changeLineText).join(' · ')}
                {' · '}
                <Ltr>{formatDate(String(group.createdAt ?? '').slice(0, 10), '—')}</Ltr>
              </div>
            </div>
          ))}
          {canAct && (
            <div className="px-3 py-2.5">
              <button
                type="button"
                className="text-[12.5px] font-semibold text-teal-700"
                onClick={onOpen}
                data-testid="closing-change-link"
              >
                רישום שינוי שהתגלה באירוע
              </button>
            </div>
          )}
        </div>
      )}
      {canAct && (
        <p className="mt-1.5 text-[11px] text-slate-500" data-testid="closing-change-note">
          {SCOPE_COMMITS_NOW_NOTE}
        </p>
      )}
    </section>
  )
}

// המצב-הנעול: הלשונית נשארת ומציגה את מה שנשמר, קריאה-בלבד, עם חותמת-הסגירה — ההיעלמות
// הייתה מוחקת מהמסך את מה שדנה זה-עתה הזינה (הכרטיס ④). כאן חיה גם בקרת השליחה-החוזרת:
// feedback_status='not_sent' אחרי שהחותמת קיימת = מייל הסקר לא יצא, ויש דרך חזרה (AR-5/㉙).
function ClosedView({
  project,
  localClosed,
  rows,
  eventHoursDraft,
  preferences,
  canReadHostesses,
  canAct,
  feedbackStatus,
  mailFailure,
  sending,
  onResend,
  changes,
}) {
  const envelope = localClosed?.envelope
  const closedAt = project?.operationally_closed_at ?? envelope?.operationally_closed_at
  const closedBy = project?.operationally_closed_by
  const reportPath = localClosed?.reportPath ?? project?.summary_report_url ?? envelope?.report_path
  const prefByHostess = useMemo(
    () => new Map((preferences ?? []).map((p) => [p.hostess_id, p])),
    [preferences],
  )
  // סגירה-של-הרגע (מייל נכשל, בלי רענון-עמוד) ⇒ התצוגה מערכי-הטיוטה שזה-עתה נשמרו;
  // סגירה שנטענה מהמסד ⇒ מהעמודות השמורות.
  const displayRows = useMemo(
    () =>
      (rows ?? []).map((row) => {
        if (localClosed) {
          const noShow = isNoShowAttendance(row.attendanceLabel)
          const hours = Number(rowEffectiveHours(row, eventHoursDraft))
          return {
            key: rowKey(row),
            name: row.name,
            isShiftLead: row.isShiftLead,
            rateSnapshot: row.rateSnapshot,
            attendanceLabel: row.attendanceLabel,
            qualityLabel: noShow ? null : row.qualityLabel,
            qualityReason: noShow ? null : row.qualityReason || null,
            hours: Number.isFinite(hours) ? hours : null,
          }
        }
        const pref = prefByHostess.get(row.hostessId)
        return {
          key: rowKey(row),
          name: row.name,
          isShiftLead: row.isShiftLead,
          rateSnapshot: row.rateSnapshot,
          attendanceLabel: attendanceLabelFromColumns(row.saved ?? {}),
          qualityLabel: qualityLabelFromValue(pref?.preference),
          qualityReason: pref?.preference_reason ?? null,
          hours: row.saved?.actual_hours != null ? Number(row.saved.actual_hours) : null,
        }
      }),
    [rows, localClosed, eventHoursDraft, prefByHostess],
  )
  const actualHours =
    project?.actual_hours != null
      ? Number(project.actual_hours)
      : (localClosed?.actualHours ?? null)
  const actualGuests = project?.actual_guests ?? localClosed?.actualGuests ?? null

  const handleDownload = async () => {
    try {
      const url = await getReportSignedUrl(reportPath)
      window.open(url, '_blank')
    } catch (err) {
      console.error('report download failed:', err)
    }
  }

  return (
    <div className="pt-3" data-testid="closing-tab-closed">
      <p className="text-xs text-slate-500" data-testid="closing-stamp">
        נסגר ב-<Ltr>{formatTimestampFull(closedAt)}</Ltr>
        {closedBy && (
          <>
            {' '}
            על-ידי <Ltr>{closedBy}</Ltr>
          </>
        )}
      </p>

      {/* שלושת ערכי-האירוע שנשמרו — כערכים, לא כפקדים מושבתים (הכרטיס ⑤). */}
      <div className="mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {/* items-start בשלושת התאים (מוסכמת Cell(), ProjectCardPage.jsx) — בלעדיו הילדים
            עוברים blockification בעמודת-flex ונמתחים לרוחב מלא, ומיישרים שמאלה ב-RTL. */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-xs text-slate-500">שעות ביצוע בפועל</span>
          <span className="text-sm font-semibold text-slate-800">
            {actualHours != null ? <Ltr>{String(actualHours)}</Ltr> : '—'} שעות
          </span>
        </div>
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-xs text-slate-500">כמות אורחים בפועל</span>
          <span className="text-sm font-semibold text-slate-800">
            {actualGuests != null ? <Ltr>{String(actualGuests)}</Ltr> : '—'} אורחים
          </span>
        </div>
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-xs text-slate-500">דוח-סיכום אירוע</span>
          {reportPath ? (
            <span className="text-sm">
              <span className="font-semibold text-slate-800">
                {String(reportPath).split('/').pop()}
              </span>{' '}
              <button
                type="button"
                className="text-[12.5px] font-semibold text-teal-700"
                onClick={handleDownload}
                data-testid="closing-closed-download"
              >
                הורדה
              </button>
            </span>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </div>
      </div>

      {/* טבלת-הדיילות השמורה — קריאה בלבד. */}
      <div className="mt-4">
        {!canReadHostesses ? (
          <PermissionAwareEmpty
            state="noPermission"
            title="אין לך הרשאה לצפות בדיילות המשובצות."
            testId="closing-closed-no-permission"
          />
        ) : displayRows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 p-6 text-center text-[12.5px] text-slate-500">
            {LEGAL_EMPTY_SENTENCE}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>דיילת</Th>
                  <Th>נוכחות</Th>
                  <Th>סימון-איכות</Th>
                  <Th>שעות בפועל</Th>
                  <Th>עלות בפועל</Th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <ClosedRow key={row.key} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ScopeChangesSection changes={changes} canAct={false} onOpen={() => {}} />

      {mailFailure && (
        <p
          className="mt-4 text-xs font-semibold text-amber-800"
          role="alert"
          data-testid="closing-mail-failure"
        >
          {mailFailure}
        </p>
      )}

      {canAct && feedbackStatus === 'not_sent' && closedAt && (
        <div
          className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
          data-testid="closing-resend-strip"
        >
          <span className="text-xs text-amber-800">{RESEND_STATE_SENTENCE}</span>
          <button
            type="button"
            disabled={sending}
            onClick={onResend}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="closing-resend"
          >
            {sending ? 'שולח…' : 'שליחה חוזרת'}
          </button>
        </div>
      )}
    </div>
  )
}

// שורה שמורה: הנוכחות משוחזרת משלוש עמודות-המסד (או מהטיוטה שזה-עתה נשמרה) לתווית העברית;
// האיכות מ-customer_hostess_preference (קריאה חסומה ⇒ `—`, לא "לא סומנה"); העלות — שעות
// שמורות × התעריף הקפוא.
function ClosedRow({ row }) {
  const cost = row.hours != null ? hostessActualCost(row.hours, row.rateSnapshot) : null

  return (
    <tr data-testid={`closing-closed-row-${row.key}`}>
      <td className="border-b border-slate-100 px-2.5 py-3 text-sm font-semibold text-slate-800">
        {row.name} {/* תג-האחראית בצורת TeamTab (ζ) — אותו תג בדיוק כמו בשורת-הטיוטה למעלה. */}
        {row.isShiftLead && <StatusTag label={SHIFT_LEAD_LABEL} tone="outline" />}
      </td>
      <td className="border-b border-slate-100 px-2.5 py-3 text-sm text-slate-700">
        {row.attendanceLabel ?? '—'}
      </td>
      <td className="border-b border-slate-100 px-2.5 py-3 text-sm text-slate-700">
        {row.qualityLabel ?? '—'}
        {row.qualityReason && (
          <div className="mt-0.5 text-[11px] text-slate-500">{row.qualityReason}</div>
        )}
      </td>
      <td className="border-b border-slate-100 px-2.5 py-3 text-sm text-slate-700">
        {row.hours != null ? <Ltr>{String(row.hours)}</Ltr> : '—'}
      </td>
      <td className="border-b border-slate-100 px-2.5 py-3 text-sm text-slate-700">
        {cost != null ? <Money amount={cost} cents /> : '—'}
      </td>
    </tr>
  )
}
