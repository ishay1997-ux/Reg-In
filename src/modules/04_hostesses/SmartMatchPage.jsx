// מסך 2 · שיבוץ חכם (Smart Match) — **לב המודול ותערוכת-הכנס.**
// נבנה לפי המוקאפ המאושר `docs/mockups/hostesses-screen/approved/02_smartmatch_approved.html`.
//
// 🔑 **ההחלטה שהמסך משרת** (`screens-approved.md` מסך 2 §②):
// *"למי לשלוח עכשיו — ואת מי לאשר סופית."* שתי החלטות במסך אחד **במכוון**: הן חולקות את
// אותו מידע. הטור הימני = מי כבר בפנים · השמאלי = מי המועמדות.
//
// 🔴 **הציון נשאר סמוי, והצ'יפים מסבירים במקומו.** זו ההכרעה החשובה במסך: מספר בודד
// ("התאמה 87%") **לא אומר למה**, ושתי הפרסונות שנבדקו במחקר אמרו שיפסיקו לסמוך על כלי
// אטום. ⇒ הסדר סמוי, ההנמקה גלויה, **והמנהלת יכולה לחלוק על הדירוג במקום לציית לו.**
//
// 🔴 **וכל מה שחסר נאמר בקול ולעולם לא נשאר אפס שקט** (§7.90): מרכיב אמינות-ההגעה כבוי עד
// מודול 6, וזווית "תענה הכי מהר" מוצגת **מכובה ומנומקת** כל עוד אין נתוני זמן-תגובה.
// אפס שקט מעניש דיילת על תקלה של המערכת.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmDialog'
import LoadingOrError from '@/components/LoadingOrError'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import { Button } from '@/components/ui/button'
import { formatDate, formatTimestamp } from '@/lib/dates'
import {
  parseSmartMatchParams,
  rankCandidates,
  distanceLabel,
  activeWeights,
} from '@/lib/smartMatch'
import { buildSmartMatchCandidates } from '@/lib/smartMatchCandidates'
import { SORT_ANGLES, sortByAngle, isAngleAvailable, defaultSortAngle } from '@/lib/sortAngles'
import {
  ASSIGNMENT_ACTION,
  quotaNotice,
  overQuotaLabel,
  autoReleaseTargets,
} from '@/lib/assignmentActions'
import {
  HOSTESS_PARAM_NAMES,
  finalAssignmentRows,
  countAssignmentStates,
  assignmentDisplayStatus,
  inviteHoursLeft,
  isUrgentEvent,
  isWithinFinalDay,
  eventStartInstant,
  unansweredStreakTag,
  optionalNumber,
} from '@/lib/hostesses'
import AssignmentRowMenu from './AssignmentRowMenu'
import {
  getSmartMatchData,
  createShiftInvites,
  resendInvite,
  approveFinalAndRelease,
  markAssignmentStatus,
  releaseAssignment,
  setShiftLead,
} from './api'

// 8 גלויות והשאר בגלילה (`§ב2`, הכרעת-ישי). 🚫 **לא עימוד** — הרשימה נשארת אחת, והגלילה
// היא הדבר היחיד שמפריד; עימוד היה מסתיר מועמדת מאחורי לחיצה נוספת ברגע שהיא הכי נחוצה.
const VISIBLE_CANDIDATES = 8

function nowIso() {
  return new Date().toISOString()
}

export default function SmartMatchPage({ projectId, onBack }) {
  const { permissions } = useAuth()
  const canEdit = permissions['דיילות'] === 'edit'
  const toast = useToast()
  const confirm = useConfirm()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(nowIso)
  const [angle, setAngle] = useState(null)
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await getSmartMatchData(projectId)
        if (cancelled) return
        setData(loaded)
        setNow(nowIso())
        setError(null)
      } catch (err) {
        // 🔴 **מסך שלא הצליח לטעון אומר זאת** (`screens-approved` מסך 2 §④): שלוש הטבלאות
        // שהמסך קורא מהן מחזירות `{data:null,error:null}` כשה-RLS חוסם — כלומר **ריק
        // שנראה בדיוק כמו "אין מועמדות פנויות"**. שתי המשמעויות ההפוכות חייבות להיראות שונה.
        if (!cancelled) setError(err.message ?? 'לא הצלחנו לטעון את מסך השיבוץ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, reloadTick])

  const today = now.slice(0, 10)
  const project = data?.project ?? null

  const params = useMemo(() => (data?.params ? parseSmartMatchParams(data.params) : null), [data])

  // שורות-השיבוץ של האירוע הזה, מקופלות לשורה הקובעת פר-דיילת.
  // 🔴 **`MAX(assignment_number)` ולא "האחרונה שנוצרה"** — דיילת שסירבה ונעקפה בטלפון
  // מחזיקה שתי שורות, והישנה נשארת כהיסטוריה ומזינה את הציון.
  //
  // ⚠️ **הדיילת והאירוע מוצמדים כאן ולא בשאילתה** — `getSmartMatchData` טוענת ממילא את
  // **כל** המאגר (ל-`C`), וצירוף שני לאותן שורות היה סיבוב-רשת מיותר. הצמדה נדרשת כי
  // הפעולות במורד הזרם (מייל-שחרור, מייל-אישור) בונות גוף-מייל מהשורה עצמה.
  const eventRows = useMemo(() => {
    const byId = new Map((data?.hostesses ?? []).map((h) => [h.hostess_id, h]))
    const mine = (data?.assignments ?? []).filter((row) => row.project_id === projectId)
    return finalAssignmentRows(mine).map((row) => ({
      ...row,
      hostesses: byId.get(row.hostess_id) ?? null,
      projects: data?.project ?? null,
      // ‏`assignmentDisplayStatus` גוזרת "הושלם" מרגע-האירוע; בלעדיו שיבוץ שהסתיים
      // היה ממשיך להציג "אושרה סופית" לנצח.
      event_starts_at: eventStartInstant(
        data?.project?.final_event_date,
        data?.project?.final_start_time,
      ),
    }))
  }, [data?.assignments, data?.hostesses, data?.project, projectId])

  // 🔄 שלושת ספי-הזימון ירדו ל-`params` (מודול 9 · צעד 2.3) ומגיעים באותה שליפה שכבר
  // מביאה את פרמטרי ה-Smart Match (`ALL_PARAM_NAMES`) — בלי סיבוב-רשת נוסף.
  // ⚠️ גולמיים (`text`) ולא מפוענחים: כל פונקציה מפענחת בעצמה דרך `optionalNumber`.
  const inviteValidityHours = data?.params?.[HOSTESS_PARAM_NAMES.inviteValidityHours]
  const inviteCutoffHours = data?.params?.[HOSTESS_PARAM_NAMES.inviteCutoffHours]
  const urgentEventHours = data?.params?.[HOSTESS_PARAM_NAMES.urgentEventHours]

  const counts = useMemo(
    () => countAssignmentStates(eventRows, now, inviteValidityHours),
    [eventRows, now, inviteValidityHours],
  )
  const required = optionalNumber(project?.required_hostess_count) ?? 0
  const isStaffed = required > 0 && counts.finallyApproved >= required
  const eventStartsAt = eventStartInstant(project?.final_event_date, project?.final_start_time)
  const finalDay = isWithinFinalDay(eventStartsAt, now, inviteCutoffHours)

  // 🔴 **הזווית "תענה הכי מהר" נשענת על `responded_at` — ונמדדת מהדאטה, לא מונחת.**
  // כל עוד אף דיילת לא ענתה דרך הקישור, מיון לפי עמודה ריקה **משקר בשקט**.
  const hasResponseTimes = useMemo(
    () => (data?.assignments ?? []).some((row) => row.responded_at),
    [data?.assignments],
  )
  const availability = { hasResponseTimes }
  const activeAngle =
    angle ?? defaultSortAngle(isUrgentEvent(eventStartsAt, now, urgentEventHours), availability)

  // ── ארבע השכבות ────────────────────────────────────────────────────────────
  // ⚠️ **המועמדות מחושבות על כל המאגר**, גם על מי שתיפסל בשער: `C` (ממוצע-החברה) מחושב
  // עליהן, וסינון מוקדם היה משנה אותו ואת כל הדירוג (`§11.3`).
  // 🔴 **`eventDate` לשער חייב להיות תאריך-האירוע, לא "היום" — נתפס 11/08/2026 בזרע-הדגמה
  // של צעד 4.2.** `rankCandidates` מעביר אותו ל-`isUnavailableOn` בלבד (השער האמינותי היחיד
  // שתלוי בו); `today` נשאר הפרמטר הנכון ל-`buildSmartMatchCandidates` (שבועות-מאז-עבדה/
  // ספירת-רבעון — אלה כן נמדדים מ"עכשיו"). ⚠️ **הבדיקות הקיימות של השכבה הטהורה
  // (`smartMatch.test.js`) לא תפסו את זה** כי הן מזינות `eventDate` מפורש כפרמטר-בדיקה
  // ולעולם לא "היום" — הפגם ישב רק בחיווט של המסך, לא בנוסחה עצמה.
  const ranked = useMemo(() => {
    if (!data || !params) return []
    const candidates = buildSmartMatchCandidates(data, today)
    return rankCandidates(candidates, { params, eventDate: project?.final_event_date, projectId })
  }, [data, params, today, project, projectId])

  // 📌 `הנחתי` (§10): **מי שכבר יש לה שורה באירוע הזה אינה מועמדת.** האפיון מונה חמישה
  // תנאי-שער ואין ביניהם "כבר זומנה" — אבל היא כבר מוצגת בטור הימני, והופעתה גם משמאל
  // הייתה מזמינה זימון כפול. **וזה אינו סוגר את הדלת:** דיילת שסירבה או שוחררה חוזרת
  // דרך `פתח זימון חדש` שבתפריט-השורה — הערוץ שנועד לכך במפורש.
  const assignedIds = useMemo(() => new Set(eventRows.map((row) => row.hostess_id)), [eventRows])
  // ⚠️ בלי `useMemo` במכוון: `activeAngle` נגזר מ-state ומ-`now`, וקומפיילר-React של
  // הפרויקט דוחה מזכור ידני שתלוי בו (`preserve-manual-memoization`). הוא ממזכר לבד.
  const candidates = sortByAngle(
    ranked.filter((c) => !assignedIds.has(c.hostess_id)),
    activeAngle,
  )

  const weights = params ? activeWeights(params) : null

  async function run(label, action) {
    setBusy(true)
    try {
      await action()
      refresh()
    } catch (err) {
      toast.error(err.message ?? `${label} נכשל.`)
    } finally {
      setBusy(false)
    }
  }

  // 🔴 **שלוש תוצאות ולא שתיים** (`src/CLAUDE.md`): פסק-זמן הוא **"לא ידוע"** ולא "נכשל" —
  // המייל אולי כן יצא, ודיווח "נכשל" היה גורר שליחה חוזרת והצפה של הדיילת.
  function reportMail({ sent, unknown, failed }, verb) {
    const parts = []
    if (sent > 0) parts.push(`${sent} ${verb}`)
    if (unknown > 0) parts.push(`${unknown} — לא ידוע אם יצאו (ייתכן שכן; לא לשלוח שוב מיד)`)
    if (failed > 0) parts.push(`${failed} נכשלו`)
    if (parts.length === 0) return
    if (unknown > 0 || failed > 0) toast.error(parts.join(' · '))
    else toast.success(parts[0])
  }

  // 🆕 **12/08/2026 — השחרור מדווח כמו כל שליחה אחרת במודול.** עד האודיט הוא היה הנתיב
  // היחיד שהצהיר *"והודעה נשלחה אליה"* **ללא תנאי**, גם כשהמייל נכשל — הוכח בהזרקת-תקלה.
  // 🔑 אותן שלוש תוצאות בדיוק כמו ב-`reportMail`, כי זו אותה הבחנה: פסק-זמן אינו כשל.
  function reportRelease(who, { unknown, failed }) {
    if (failed > 0) {
      toast.error(`${who} שוחררה — אך ההודעה אליה לא נשלחה. כדאי ליידע אותה טלפונית.`)
      return
    }
    if (unknown > 0) {
      toast.error(`${who} שוחררה — לא ידוע אם ההודעה יצאה (ייתכן שכן; אל תשלחי שוב מיד).`)
      return
    }
    toast.success(`${who} שוחררה, והודעה נשלחה אליה`)
  }

  // 🔴 **כשל-שחרור נאמר בשם, ולפני הכול — נוסף 12/08/2026.**
  // המנהלת אישרה את השמות האלה בחלון שאמר *"כל אחת מהן תקבל הודעה"*; שם שנשמט מהרשימה
  // בלי מילה פירושו **דיילת שנשארה משובצת על אירוע מלא ותגיע אליו**. זו שגיאה, לא הערה.
  function reportReleaseFailures(names) {
    if (!names?.length) return
    toast.error(
      `${names.join(' · ')} לא שוחררו — הן עדיין משובצות לאירוע. נסי לשחרר ידנית מתפריט-השורה.`,
    )
  }

  // אותה הבחנה, לקבוצה שמשוחררת אוטומטית כשהמכסה נסגרת (`§ב6`).
  function reportReleaseGroup(names, { unknown, failed }) {
    if (names.length === 0) return
    const who = `שוחררו: ${names.join(' · ')}`
    if (failed > 0 || unknown > 0) {
      const parts = []
      if (failed > 0) parts.push(`${failed} לא קיבלו הודעה`)
      if (unknown > 0) parts.push(`${unknown} — לא ידוע אם ההודעה יצאה`)
      toast.error(`${who} — ${parts.join(' · ')}`)
      return
    }
    toast.info(`${who} — כולן קיבלו הודעה`)
  }

  async function sendInvites() {
    await run('שליחת הזימונים', async () => {
      const outcome = await createShiftInvites({
        projectId,
        hostessIds: selected,
        // 🔗 `window.location.origin` ולא קבוע: מייל שנשלח מסביבת-פיתוח חייב להצביע
        // לסביבת-פיתוח, אחרת "בדקתי את הקישור" בודק את הפרודקשן ולא את מה שנבנה.
        origin: window.location.origin,
      })
      setSelected([])
      reportMail(outcome, outcome.sent === 1 ? 'זימון נשלח' : 'זימונים נשלחו')
    })
  }

  // 🔴 **עודף אישורים מזהיר ולעולם לא חוסם** (`§ב5`): שביעית היא לפעמים ביטוח לגיטימי,
  // וחסימה ממילא הייתה נעקפת בשלוש לחיצות דרך "אושרה סופית — סוכם בטלפון".
  // ⚠️ **כפל-תאריך, לעומת זאת, נחסם — ובמסד**, כי "אסור שזה יקרה": שיבוץ כפול = תשלום כפול.
  async function approveAll() {
    const waiting = eventRows.filter((row) => row.assignment_status === 'confirmed_available')
    if (waiting.length === 0) return

    const notice = quotaNotice({
      approvedCount: counts.finallyApproved,
      requiredCount: required,
      adding: waiting.length,
      subjectLabel: waiting.length === 1 ? waiting[0].hostesses?.full_name : undefined,
    })
    if (notice && !(await confirm({ title: notice.title, message: notice.note }))) return

    // מי תשוחרר אוטומטית אחרי האישור — נאמר **לפני** ולא מתגלה אחרי (`local-13`).
    const releasing = autoReleaseTargets(
      eventRows.map((row) =>
        waiting.includes(row) ? { ...row, assignment_status: 'finally_approved' } : row,
      ),
      required,
    )
    if (
      releasing.length > 0 &&
      !(await confirm({
        title: `המכסה תיסגר — ${releasing.length} דיילות שאישרו זמינות ישוחררו`,
        message: `${releasing.map((r) => r.hostesses?.full_name).join(' · ')} — כל אחת מהן תקבל הודעה שהמשרה אוישה. להמשיך?`,
      }))
    ) {
      return
    }

    await run('האישור הסופי', async () => {
      const result = await approveFinalAndRelease({
        projectId,
        hostessIds: waiting.map((row) => row.hostess_id),
      })
      reportMail(result.mail, result.mail.sent === 1 ? 'אישור נשלח' : 'אישורים נשלחו')
      // 🔴 **כשל אינו נבלע ואינו מתחזה להצלחה** — השורה נשארה במצבה הקודם, והמנהלת
      // חייבת לדעת בשם: אירוע שנראה מאויש ואינו מאויש הוא בדיוק מה שהמודול נועד למנוע.
      for (const failure of result.failed) {
        toast.error(`${failure.name}: ${failure.message}`)
      }
      reportReleaseFailures(result.releaseFailed)
      reportReleaseGroup(result.released, result.releaseMail)
    })
  }

  async function handleRowAction(row, menuItem) {
    const name = row.hostesses?.full_name ?? ''

    if (menuItem.action === ASSIGNMENT_ACTION.RESEND) {
      return run('שליחת הקישור', async () => {
        reportMail(await resendInvite(row, window.location.origin), 'קישור נשלח מחדש')
      })
    }

    // 🔴 **שורה שנייה, לא רענון** — הישנה נשארת כהיסטוריה. שתי הפעולות נראות דומות
    // ואינן: איחודן היה מוחק סירוב שקדם, וההיענות היא 40% מהציון.
    if (menuItem.action === ASSIGNMENT_ACTION.NEW_INVITE) {
      return run('פתיחת הזימון', async () => {
        const outcome = await createShiftInvites({
          projectId,
          hostessIds: [row.hostess_id],
          origin: window.location.origin,
        })
        reportMail(outcome, 'זימון חדש נשלח')
      })
    }

    if (menuItem.action === ASSIGNMENT_ACTION.RELEASE) {
      if (
        !(await confirm({
          title: `לשחרר את ${name} מהאירוע?`,
          message:
            'היא תקבל הודעה שהמשרה אוישה. 🚫 שחרור אינו נספר לרעתה בשום צד של הדירוג — הוא פעולת מערכת.',
        }))
      ) {
        return
      }
      return run('השחרור', async () => {
        const { mail } = await releaseAssignment(row)
        reportRelease(name, mail)
      })
    }

    if (menuItem.action === ASSIGNMENT_ACTION.MARK_WITHDRAWN) {
      if (
        !(await confirm({
          title: `${name} ביטלה אחרי האישור הסופי?`,
          message:
            'האירוע יחזור להיות חסר, והביטול ייספר במרכיב האמינות שלה. 🚫 זה אינו "שחרור" — שם אנחנו ויתרנו עליה, וכאן היא חזרה בה.',
        }))
      ) {
        return
      }
      return run('הסימון', async () => {
        await markAssignmentStatus(row, 'approval_withdrawn')
        toast.success(`${name} סומנה כמי שביטלה אחרי אישור`)
      })
    }

    if (menuItem.action === ASSIGNMENT_ACTION.MARK_AVAILABLE) {
      return run('הסימון', async () => {
        await markAssignmentStatus(row, 'confirmed_available')
        toast.success(`${name} סומנה כמי שאישרה זמינות`)
      })
    }

    if (menuItem.action === ASSIGNMENT_ACTION.MARK_DECLINED) {
      return run('הסימון', async () => {
        await markAssignmentStatus(row, 'declined')
        toast.success(`${name} סומנה כמי שסירבה`)
      })
    }

    // 🔴 **שני המסלולים לאישור סופי מפעילים את אותה פונקציה** — גם "אשר סופית ושלח
    // פרטים" וגם "אושרה סופית — סוכם בטלפון": *"מייל האישור הסופי נשלח בכל מסלול"* (§⑧①).
    if (
      menuItem.action === ASSIGNMENT_ACTION.APPROVE_FINAL ||
      menuItem.action === ASSIGNMENT_ACTION.APPROVE_BY_PHONE
    ) {
      const notice = quotaNotice({
        approvedCount: counts.finallyApproved,
        requiredCount: required,
        adding: 1,
        subjectLabel: name,
      })
      if (notice && !(await confirm({ title: notice.title, message: notice.note }))) return

      return run('האישור הסופי', async () => {
        const result = await approveFinalAndRelease({ projectId, hostessIds: [row.hostess_id] })
        reportMail(result.mail, 'אישור נשלח')
        for (const failure of result.failed) toast.error(`${failure.name}: ${failure.message}`)
        reportReleaseFailures(result.releaseFailed)
        reportReleaseGroup(result.released, result.releaseMail)
      })
    }

    if (
      menuItem.action === ASSIGNMENT_ACTION.SET_SHIFT_LEAD ||
      menuItem.action === ASSIGNMENT_ACTION.CLEAR_SHIFT_LEAD
    ) {
      const marking = menuItem.action === ASSIGNMENT_ACTION.SET_SHIFT_LEAD
      return run('הסימון', async () => {
        await setShiftLead(row, marking)
        toast.success(marking ? `${name} סומנה כאחראית משמרת` : 'סימון אחראית המשמרת בוטל')
      })
    }
  }

  // שלד של 8 כרטיסי-מועמדת, לא "0 מתוך 0" (`screens-approved.md:326`).
  if (loading) return <LoadingOrError loading skeleton={{ variant: 'cards', count: 8 }} />
  if (error) {
    return (
      <LoadingOrError
        error={`לא הצלחנו לטעון את מסך השיבוץ — ${error}`}
        onRetry={refresh}
        retryTestId="smart-match-retry"
      />
    )
  }

  const hasShiftLead = eventRows.some((row) => row.is_shift_lead)
  const waitingCount = counts.confirmedAvailable
  const overLabel = overQuotaLabel(counts.finallyApproved, required)

  return (
    <div className="p-6" data-testid="smart-match-page">
      <Button
        type="button"
        variant="link"
        onClick={onBack}
        className="mb-2 h-auto p-0 text-[12.5px] font-semibold text-teal-700"
        data-testid="smart-match-back"
      >
        ← חזרה למבט-על
      </Button>

      <div className="mb-3">
        <h1 className="text-lg font-bold text-slate-800">שיבוץ חכם — {project?.event_name}</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {[
            project?.customer_name,
            formatDate(project?.final_event_date, '—'),
            `${hhmm(project?.final_start_time)}–${hhmm(project?.final_end_time)}`,
            project?.final_location,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {/* 🐞 **ארבעת המונים מקבלים `String(n)` ולא מספר** — `StatTile` מעביר ערך מספרי דרך
          `Money` אוטומטית, ומונה היה מוצג `0 ₪`. נתפס במסך 1 בצילום-מסך, לא בבדיקה. */}
      <div className="flex flex-wrap gap-3 pb-3">
        <StatTile label="נדרשות" value={String(required)} testId="sm-kpi-required" />
        <StatTile
          label="אושרו סופית"
          value={
            <span className={counts.finallyApproved >= required ? 'text-green-700' : ''}>
              {counts.finallyApproved}
            </span>
          }
          sub={overLabel ?? `מתוך ${required}`}
          testId="sm-kpi-approved"
        />
        <StatTile
          label="אישרו זמינות"
          value={String(waitingCount)}
          sub={waitingCount > 0 ? 'מחכות לאישורך' : 'אף אחת אינה ממתינה לאישורך'}
          testId="sm-kpi-available"
        />
        <StatTile
          label="ממתינות"
          value={String(counts.pending)}
          // ⚠️ "מתוכן" ולא "ובנוסף" — פג-התוקף הוא **תת-קבוצה** של הממתינות
          // (`screens-approved.md:464`), ולכן המספר העליון אינו סכום של השניים.
          sub={counts.expired > 0 ? `מתוכן ${counts.expired} פג תוקפן` : 'אף קישור לא פג תוקף'}
          testId="sm-kpi-pending"
        />
      </div>

      {/* 🔴 **המסך מודיע שהמרכיב כבוי, ואינו מעמיד פנים שהציון מלא** (§7.90) — כולל
          המשקלים בפועל, שנקראים מ-`activeWeights` ולא נכתבים כמספר קשיח כאן.
          ⚠️ **ומותנה בפרמטר בפועל, לא מוצג-תמיד** — בלי התנאי, ביום שהמרכיב יודלק הבאנר היה
          ממשיך להכריז שהוא כבוי בעוד הציון כבר משתמש בו.

          🔴 **תוקן 22/08/2026 (ישי תפס) — שני פגמים, ושניהם מאותה משפחה: טקסט סטטי שטוען
          טענה שהוא אינו יכול לדעת אם היא עדיין נכונה.**

          (א) **הטקסט אמר "ואין עדיין נתונים", וזו הייתה גם טענת-זמן-ריצה וגם הסיבה הלא-נכונה.**
              המרכיב אינו כבוי בגלל היעדר דאטה — הוא כבוי כי הפרמטר `מרכיב_אמינות_פעיל` כבוי,
              **והדלקתו היא של מ9** (`🚧 מ9 ← מ4`). מ6 רק מייצר את נתוני-הנוכחות, **והוא כבר
              מוזג וחי** (`close_project_operationally` כותב `attendance_status`) ⇒ המשפט התיישן
              ברגע שמ6 מוזג, ואיש לא היה מתריע. ⇒ הבאנר אומר עכשיו רק את מה שהוא **קורא** מהמצב.

          (ב) 🔴 **ופסקת "מצוינת אצל הלקוח" הוסרה — היא הייתה מוסתרת מאחורי התנאי הלא-נכון.**
              התגית נגזרת מ-`candidate.preference === PINNED_PREFERENCE` (`customer_hostess_preference`),
              **ואין לה שום קשר ל-`reliabilityEnabled`** — כלומר הסבר על X ישב מאחורי תנאי על Y,
              והיה **נעלם ביום שמ9 תדליק את הפרמטר** אף שהתגית עדיין עשויה להיות ריקה. היא גם
              הסבירה למשתמשת היעדר של דבר שמעולם לא ראתה — `src/CLAUDE.md` מעבר-מלאי: אין תפקיד ⇒ נמחק. */}
      {params?.reliabilityEnabled === false && (
        <div
          className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-600"
          data-testid="sm-reliability-off"
        >
          ⓘ <b>מרכיב "אמינות הגעה" כבוי</b> — הוא עדיין אינו נכלל בציון.{' '}
          {/* 🔬 **כל אחוז צמוד למילה שלו — ולא זוג `62% / 38%`.** נמדד בדפדפן דרך `Range`
              ש-`38%` נחת **משמאל** ל-`62%`: הצמד מתפרק לשני רצפים שה-bidi מסדר הפוך, ומי
              שקורא את הסוגריים לבדם מקבל את המשקולות מוחלפות. זו המשפחה שנתפסה כבר שמונה
              פעמים כאן (`src/CLAUDE.md`), **והתיקון היציב הוא להסיר את הרצף ולא לבודד אותו**:
              לצירוף שכל איבר בו יושב ליד התווית שלו אין סדר שאפשר לטעות בו. */}
          <b>
            הדירוג כרגע מבוסס על שיעור-היענות
            {weights ? ` (${Math.round(weights.responsiveness * 100)}%)` : ''} ועל קרבה
            {weights ? ` (${Math.round(weights.proximity * 100)}%)` : ''} בלבד.
          </b>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row-reverse">
        {/* ── טור ימני: מי כבר בפנים ─────────────────────────────────────── */}
        <section className="flex-1" data-testid="sm-event-column">
          <h2 className="text-sm font-bold text-slate-800">דיילות באירוע</h2>
          <p className="mb-2 text-[11.5px] text-slate-500">
            {`${counts.finallyApproved} מתוך ${required} אושרו סופית`}
            {waitingCount > 0 ? ` · ${waitingCount} אישרו זמינות וממתינות לאישורך` : ''}
          </p>

          {eventRows.length === 0 ? (
            <p
              className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[12.5px] text-slate-500"
              data-testid="sm-event-empty"
            >
              עדיין לא נשלח אף זימון לאירוע הזה — בחרי מועמדות מהטור השני ושלחי.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {eventRows.map((row) => (
                <EventRow
                  key={row.hostess_id}
                  row={row}
                  now={now}
                  canEdit={canEdit}
                  busy={busy}
                  context={{
                    nowIso: now,
                    inviteValidityHours,
                    // נוסח-הכיבוי של "שלח שוב" מצטט את הסף במילים ⇒ הוא צריך את הערך
                    // עצמו, לא רק את הבוליאני שנגזר ממנו.
                    inviteCutoffHours,
                    isEventStaffed: isStaffed,
                    isWithinFinalDay: finalDay,
                    hasShiftLead,
                  }}
                  onAction={(menuItem) => handleRowAction(row, menuItem)}
                />
              ))}
            </ul>
          )}

          {canEdit && waitingCount > 0 && (
            <Button
              type="button"
              disabled={busy}
              onClick={approveAll}
              className="mt-3 h-auto w-full rounded-lg bg-green-700 px-4 py-2 text-[13px] font-semibold text-white"
              data-testid="sm-approve-all"
            >
              {`שלח אישור סופי לכל מי שאישרה זמינות (${waitingCount})`}
            </Button>
          )}
        </section>

        {/* ── טור שמאלי: המועמדות ────────────────────────────────────────── */}
        <section className="flex-1" data-testid="sm-candidates-column">
          <h2 className="text-sm font-bold text-slate-800">מועמדות מתאימות</h2>
          {/* 🔴 שני ניסוחים שונים לאותה עובדה לא מוצגים יחד — כשאין מועמדות, ההסבר המפורט
              (`sm-candidates-empty` למטה) מכסה את זה לבד; שורה זו מוצגת רק כשיש מה לספור. */}
          {candidates.length > 0 && (
            <p className="mb-2 text-[11.5px] text-slate-500">
              {`${Math.min(VISIBLE_CANDIDATES, candidates.length)} ראשונות מתוך ${candidates.length} שעברו את הסינון · השאר בגלילה`}
            </p>
          )}

          {/* 🔴 **ארבע הזוויות מסדרות בלבד — אינן מסננות.** שכבות 1–3 רצות זהה בכל אחת,
              והצ'יפים אינם משתנים. סינון היה מאבד למנהלת מועמדת בלי שתדע. */}
          <div className="mb-1 flex flex-wrap gap-1.5" data-testid="sm-sort-angles">
            {Object.entries(SORT_ANGLES).map(([key, meta]) => {
              const available = isAngleAvailable(key, availability)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!available}
                  onClick={() => setAngle(key)}
                  className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    activeAngle === key
                      ? 'border-teal-600 bg-teal-50 font-semibold text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  } ${available ? '' : 'opacity-50'}`}
                  data-testid={`sm-angle-${key}`}
                >
                  {meta.label}
                  {/* 🔴 **מכובה ומנומקת — לא נעלמת ולא ממיינת שגוי** (§⑥). */}
                  {!available && <span className="text-[10.5px]"> — כבוי</span>}
                </button>
              )
            })}
          </div>
          {!isAngleAvailable('fastest', availability) && (
            <p className="mb-2 text-[11px] text-slate-400" data-testid="sm-angle-note">
              {SORT_ANGLES.fastest.disabledNote}
            </p>
          )}

          {candidates.length === 0 ? (
            <p
              className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[12.5px] text-slate-500"
              data-testid="sm-candidates-empty"
            >
              אין מועמדות פנויות לאירוע הזה כרגע.
              <span className="mt-1 block text-[11.5px] text-slate-400">
                כולן נפסלו בשער: לא פעילות · משובצות באותו תאריך · הצהירו אי-זמינות · רחוקות מ-
                {params?.gateDistanceKm ?? '—'} ק"מ · או מסומנות "לא-לשלוח" אצל הלקוח הזה.
              </span>
              <span className="mt-1 block text-[11.5px] text-slate-400">
                אפשר לבדוק במאגר הדיילות אם יש עוד מישהי שמתאימה ולא נכנסה לסינון.
              </span>
            </p>
          ) : (
            <ul className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto pl-1">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.hostess_id}
                  candidate={candidate}
                  params={params}
                  unansweredN={params?.unansweredStreak}
                  customerName={project?.customer_name}
                  canEdit={canEdit}
                  checked={selected.includes(candidate.hostess_id)}
                  onToggle={() =>
                    setSelected((current) =>
                      current.includes(candidate.hostess_id)
                        ? current.filter((id) => id !== candidate.hostess_id)
                        : [...current, candidate.hostess_id],
                    )
                  }
                />
              ))}
            </ul>
          )}

          {canEdit && (
            <>
              <Button
                type="button"
                disabled={selected.length === 0 || busy}
                onClick={sendInvites}
                className="mt-3 h-auto w-full rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
                data-testid="sm-send-invites"
              >
                {`שלח מייל תיאום (${selected.length} נבחרו)`}
              </Button>
              {/* 🔑 **אין מספר שהמערכת מציעה** (`§ב3`, C5:311 — שיקול דעת אנושי טהור).
                  והנימוק אינו נימוס: שליחה נדיבה מדי **שוחקת את שיעור-ההיענות**, שהוא
                  40% מהדירוג — כלומר היא מענישה את הדיילות על החלטה שלנו. */}
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                <b>אין מספר שהמערכת מציעה.</b> שולחים בסבבים, ומחליטים בכל סבב מחדש כמה — כל זימון
                עודף שנסגר שולח "המשרה כבר אוישה", ושליחה נדיבה מדי שוחקת את שיעור-ההיענות.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// "18:00:00" ⇒ "18:00". מקומי במכוון — הוא נגזרת-תצוגה של שדה-שעה, וכבר יש לו תאום
// ב-`shiftEmails.js` שמשרת את גוף-המייל; איחודם היה כובל ניסוח-מסך לניסוח-מייל.
function hhmm(value) {
  return typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : '—'
}

function EventRow({ row, now, canEdit, busy, context, onAction }) {
  // סף-התוקף מגיע בתוך `context` — אותו אובייקט שכבר נושא את "עכשיו" ואת שני שערי-הכיבוי,
  // כך שאין prop רביעי שאפשר לשכוח להעביר לשורה אחת מתוך רשימה.
  const label = assignmentDisplayStatus(row, now, context?.inviteValidityHours)
  const hoursLeft = inviteHoursLeft(row, now, context?.inviteValidityHours)

  return (
    <li
      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
      data-testid={`sm-event-row-${row.hostess_id}`}
    >
      <div className="flex items-center gap-2">
        <b className="flex-1 text-[13px] text-slate-800">{row.hostesses?.full_name}</b>
        <StatusTag label={label} testId={`sm-status-${row.hostess_id}`} />
        <AssignmentRowMenu
          row={row}
          context={context}
          canEdit={canEdit}
          busy={busy}
          onAction={onAction}
        />
      </div>
      {/* 🔴 **חסר עד עכשיו — גם המוקאפ המאושר וגם האפיון מציגים את הטלפון על שורת-השיבוץ**
          (`04_rowmenu_approved.html`, `screens-approved.md` מפת-הלחיצות); הנתון כבר נשלף
          (`row.hostesses.phone`) ופשוט לא הוצג. `tel:` כדי שהלחיצה מחייגת, לא רק מציגה. */}
      {row.hostesses?.phone && (
        <a
          href={`tel:${row.hostesses.phone}`}
          className="mt-0.5 block text-[11.5px] text-teal-700 hover:underline"
          dir="ltr"
          style={{ unicodeBidi: 'isolate', textAlign: 'right' }}
          data-testid={`sm-phone-${row.hostess_id}`}
        >
          ☎ {row.hostesses.phone}
        </a>
      )}
      {/* שורת-הזמן שהמוקאפ מצייר על כל שורה: מתי נשלח, ומה מצב שעון 48 השעות.
          🔴 **"נותרו N שעות" ולא תאריך-פקיעה** — המנהלת מחליטה לפי כמה זמן נשאר, לא
          לפי מתי בדיוק הקישור ימות. ⚠️ `null` = השאלה אינה רלוונטית (הדיילת כבר ענתה),
          ואז לא מוצג שעון כלל — שעון על שורה שנענתה נקרא כאילו משהו עוד תלוי ועומד. */}
      <div className="mt-0.5 text-[11px] text-slate-400">
        {/* 🐞 **`formatTimestamp` ולא `formatDate`** — `invite_sent_at` הוא חותמת-זמן, ולא
            תאריך. הגרסה הראשונה הציגה `09T20:33:42.432+00:00/08/2026` על המסך; נתפס
            בצילום-מסך ולא בבדיקה. ‏`formatDate` דוחה עכשיו קלט כזה במקום לפלוט זבל. */}
        {row.invite_sent_at ? `נשלח ${formatTimestamp(row.invite_sent_at, '—')}` : 'טרם נשלח זימון'}
        {hoursLeft === 0 && ' · הקישור פג אחרי 48 שעות'}
        {hoursLeft > 0 && ` · נותרו ${hoursLeft} שעות`}
      </div>

      {row.is_shift_lead && (
        <span className="mt-1 block text-[11px] font-semibold text-green-700">★ אחראית משמרת</span>
      )}
    </li>
  )
}

// שתי משפחות-צ'יפים, ולא לערבב (`screens-approved` מסך 2 §③ · `spec.md §1.5`):
// **`score`** — מה שנכנס לציון (היענות, קרבה) · **`ctx`** — הקשר תפעולי שאינו בציון
// (עבדה אצל הלקוח, יש רכב, סימוני-חוסר). 🔑 **ההפרדה היא מפרט ולא קישוט:** צ'יפ שנראה
// כמו מרכיב-ציון ואינו כזה מלמד את המנהלת שהמערכת שוקלת משהו שהיא אינה שוקלת.
const CHIP_CLASS = {
  score: 'border-slate-400 bg-white font-semibold text-slate-800',
  ctx: 'border-slate-200 bg-slate-100 text-slate-500',
  grey: 'border-slate-100 bg-slate-100 text-slate-500',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  pin: 'border-green-200 bg-green-100 font-bold text-green-700',
}

function Chip({ family = 'ctx', children, testId }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] ${CHIP_CLASS[family]}`}
      data-testid={testId}
    >
      {children}
    </span>
  )
}

function CandidateCard({
  candidate,
  params,
  unansweredN,
  customerName,
  canEdit,
  checked,
  onToggle,
}) {
  const streak = unansweredStreakTag(candidate.assignmentRows, unansweredN)
  const weeksCap = params?.fairnessWeeksCap
  const staleWeeks =
    candidate.weeksSinceWorked !== null &&
    weeksCap !== null &&
    candidate.weeksSinceWorked >= weeksCap

  return (
    <li
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
        checked ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'
      }`}
      data-testid={`sm-candidate-${candidate.hostess_id}`}
    >
      {/* 🔴 למי שאין עריכה — התיבה אינה קיימת כלל, לא תיבה מכובה (§④, "פעולה חסומה"). */}
      {canEdit && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 size-4 accent-teal-600"
          aria-label={`בחר את ${candidate.full_name}`}
          data-testid={`sm-pick-${candidate.hostess_id}`}
        />
      )}

      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <b className="text-[13px] text-slate-800">{candidate.full_name}</b>
          {candidate.pinned && <Chip family="pin">מצוינת אצל הלקוח הזה</Chip>}
        </div>
        {/* בידוד-כיווניות: מספר-טלפון בתוך טקסט עברי מתהפך בלי זה — אותה משפחה בדיוק
            כמו ה-₪ ב-`Money` (המופעים השביעי והשמיני, `src/CLAUDE.md`). */}
        <div className="mt-0.5 text-[11.5px] text-slate-500">
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {candidate.phone}
          </span>
          {candidate.city ? ` · ${candidate.city}` : ''}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {candidate.workedForCustomerCount > 0 && (
            <Chip family="ctx" testId={`sm-chip-customer-${candidate.hostess_id}`}>
              {/* בידוד-כיווניות: מספר צמוד ל-`×` בתוך משפט עברי — אותה משפחה בדיוק כמו
                  ה-₪/★ (`src/CLAUDE.md`), שם `Money`/`RatingStars` עושים את זה במקום. */}
              {`עבדה אצל ${customerName ?? 'הלקוח הזה'} `}
              <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                {candidate.workedForCustomerCount}×
              </span>
            </Chip>
          )}

          {/* 🔴 **המונה והמכנה הגולמיים, לא הציון** — הציון נשאר סמוי לאורך כל המסך. */}
          {!candidate.flags.notEnoughAnswers && (
            <Chip family="score" testId={`sm-chip-responsiveness-${candidate.hostess_id}`}>
              {`אישרה ${candidate.confirmed} מ-${candidate.answered}`}
            </Chip>
          )}

          {/* 🔴 **תווית ולא מספר** (`local-10`, הכרעת-ישי): כתובת-אירוע יכולה להיפתר רק
              לרמת-עיר, ואז `18 ק"מ` הוא מספר **שמתחזה** למדוד. הציון עצמו ממשיך לרוץ
              על ק"מ רציפים — רק התצוגה השתנתה. */}
          {!candidate.flags.noCoordinates && (
            <Chip family="score" testId={`sm-chip-distance-${candidate.hostess_id}`}>
              {distanceLabel(candidate.distanceKm, params?.goalpostDistanceKm)}
            </Chip>
          )}

          {candidate.has_car && <Chip family="grey">יש רכב</Chip>}

          {/* 🔴 **סימוני-חוסר נאמרים בקול ולעולם אינם אפס שקט** — אפס היה מעניש דיילת
              על תקלה של המערכת, ו"טרם נצבר מידע" הוא **לא ציון נמוך**: היא מדורגת
              על ממוצע-החברה בדיוק בגלל זה. */}
          {candidate.flags.notEnoughAnswers && (
            <Chip family="grey" testId={`sm-chip-noinfo-${candidate.hostess_id}`}>
              טרם נצבר מידע
            </Chip>
          )}
          {candidate.flags.noCoordinates && (
            <Chip family="grey" testId={`sm-chip-nocoords-${candidate.hostess_id}`}>
              אין קואורדינטות
            </Chip>
          )}

          {staleWeeks && (
            <Chip family="warn">{`עבדה לאחרונה לפני ${candidate.weeksSinceWorked} שבועות`}</Chip>
          )}

          {/* 🔴 **מוצג למנהלת, ואינו מעניש בציון** — אי-מענה נשאר מחוץ לנוסחה בכוונה
              (`§ב4`: שתיקה אינה סירוב, והעולם ניסה להעניש ונסוג). */}
          {streak && (
            <Chip family="warn" testId={`sm-chip-streak-${candidate.hostess_id}`}>
              {streak.label}
            </Chip>
          )}
        </div>
      </div>
    </li>
  )
}
