// לשונית "צוות דיילות" (מודול 6 · משטח 4, צעד 3.4) — מסך-קריאה: הלשונית קוראת, היא אינה
// משנה שיבוצים. הקלט היחיד שמתחיל כאן הוא "שנה כמות דיילות" — כפתור-משני שפותח את דיאלוג
// שינוי-התכולה (onScopeChange); הפעולה הראשית של הכרטיס שייכת למעטפת (משטח 2).
//
// ההכרעות שמעצבות את הקובץ:
// · **הקיפול**: הטבלה מציגה שורה אחת פר-דיילת — הסטטוס של MAX(assignment_number) —
//   דרך finalAssignmentRows (אותו קיפול כמו המדד; ספירה נאיבית מונה דיילת שסירבה-וזומנה-
//   שוב פעמיים). היסטוריית-הסבבים מציגה את כל השורות, בסטטוס **הגולמי** — שתי התוויות
//   הנגזרות ('פג תוקף' · 'הושלם') חיות בטבלה החיה בלבד (הכלל של הכרטיס, מוחל על שתיהן).
// · **חציית-מודולים (⑤)**: assignments+hostesses מגודרות על 'דיילות' בעוד הלשונית יושבת
//   במודול 'פרויקטים' ⇒ למנהלת כספים/לוגיסטיקה הטבלה מקבלת מצב-ריק מוצהר-הרשאה (⑧-8ב),
//   לעולם לא טבלה ריקה בשקט. המונים באריחים ממשיכים להגיע משורת מבט-העל (RPC מוגדר).
// · **המשפט האדום היחיד**: המילים נושאות אותו בלי הצבע (§3.4) — הנוסח המאושר למקרה
//   שכל הזימונים הפתוחים פגו (48 שעות, isInviteExpired), נגזר חי ולא מועתק.
// · **בבוטל אין חוסר ואין אדום** — ביטול הוא מצב-סיום תקין; כל השיבוצים שוחררו אוטומטית.
//
// 🚫 ובמכוון אין כאן (רשימת-ההדרה של המוקאפ): כפתור הפעולה הראשית של הכרטיס · מדד
// הלוגיסטיקה (שני המדדים נשארים נפרדים, ⑨) · פעולות-שיבוץ פר-שורה (של מודול 4) ·
// שדות נוכחות ואיכות (של לשונית הסגירה).

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import LoadingOrError from '@/components/LoadingOrError'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { resolveProjectTone } from '@/lib/projects'
import { formatDate, formatTimestamp, formatTimestampFull } from '@/lib/dates'
import {
  ASSIGNMENT_STATUS_LABELS,
  COMPLETED_ASSIGNMENT_LABEL,
  assignmentDisplayStatus,
  countAssignmentStates,
  eventStartInstant,
  finalAssignmentRows,
  inviteHoursLeft,
  isInviteExpired,
} from '@/lib/hostesses'
import { CANCEL_TYPE_LABELS } from '@/lib/projectCard'
import {
  CANCELLED_SCOPE_REASON,
  TEAM_NO_PERMISSION_SENTENCE,
  NO_INVITES_TITLE,
  SORT_LINE,
  SCOPE_NOTE,
  SMART_MATCH_CLARIFICATION,
  RAW_STATUS_NOTE,
  SHIFT_LEAD_LABEL,
  assignmentMeaning,
  teamHeadline,
  missingTileSub,
  sortTeamRows,
  isMutedTeamRow,
  inviteExpiryText,
  daysWithoutAnswer,
  historyFootnote,
  sortRoundsHistory,
  cancelledReleasedSentence,
  hostessCountChanges,
  scopeFactSentence,
} from '@/lib/projectTeam'
import { getProjectAssignments, getProjectChanges } from './api'

// אותה חסימת-מצב כמו כפתורי שינוי-התכולה האחרים: אחרי האירוע שינויים מוזנים בלשונית
// הסגירה (㉔); אחרי הסגירה התפעולית ה-RPC מסרב (㉙) והכפתור מנומק בחותמת.
const POST_EVENT_STATUSES = ['event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished']
const SCOPE_BLOCKED_TITLE = "אחרי האירוע, שינויים מוזנים בלשונית 'סגירת אירוע'"

export default function TeamTab({
  project,
  overviewRow,
  canEdit,
  canReadHostesses,
  onScopeChange,
}) {
  const projectId = project?.project_id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [changes, setChanges] = useState([])
  const [now, setNow] = useState(() => new Date().toISOString())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // מי שחסומה על 'דיילות' אינה קוראת שיבוצים בכלל — קריאה חסומה הייתה חוזרת []
        // בלי שגיאה ונקראת בטעות "טרם נשלח זימון"; ההיסטוריה של השינויים ('פרויקטים')
        // נקראת לכולן.
        const [assignmentRows, changeRows] = await Promise.all([
          canReadHostesses ? getProjectAssignments(projectId) : Promise.resolve([]),
          getProjectChanges(projectId),
        ])
        if (cancelled) return
        // 'הושלם' נגזר מאושרה-סופית + אירוע שעבר — הנגזרת צריכה את רגע-האירוע על השורה
        // (החוזה של assignmentDisplayStatus), והוא מוצמד כאן פעם אחת לכולן.
        const startsAt = eventStartInstant(project?.final_event_date, project?.final_start_time)
        setRows(assignmentRows.map((row) => ({ ...row, event_starts_at: startsAt })))
        setChanges(changeRows)
        setNow(new Date().toISOString())
        setError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('team tab load failed:', err)
          setError('נתוני צוות הדיילות של הפרויקט לא נטענו.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    projectId,
    project?.final_event_date,
    project?.final_start_time,
    canReadHostesses,
    reloadTick,
  ])

  if (loading) {
    return (
      <div className="pt-3" data-testid="team-tab">
        <LoadingOrError loading skeleton={{ variant: 'table', rows: 3, cols: 4 }} />
      </div>
    )
  }

  if (error) {
    // כשל-קריאה מפורש — רשימה ריקה בשקט נראית בדיוק כמו "טרם נשלח זימון", ואסור (④).
    return (
      <div className="pt-3" data-testid="team-tab">
        <PermissionAwareEmpty
          state="error"
          detail={error}
          onRetry={refresh}
          testId="team-state-error"
        />
      </div>
    )
  }

  const finalRows = finalAssignmentRows(rows)
  const counts = countAssignmentStates(rows, now)
  const required = Number(project?.required_hostess_count) || 0
  // מונה-המאושרות: מהשורות כשהן קריאות, אחרת משורת מבט-העל — ה-RPC המוגדר קריא לכל תפקיד.
  const confirmed = canReadHostesses
    ? counts.finallyApproved
    : Number(overviewRow?.hostesses_confirmed) || 0
  const gap = Math.max(required - confirmed, 0)
  const pendingExpired = canReadHostesses ? counts.expired : 0
  const pendingLive = canReadHostesses
    ? counts.pending - counts.expired
    : Number(overviewRow?.pending_invites) || 0
  const hostessChanges = hostessCountChanges(changes)
  const cancelled = project?.project_status === 'cancelled'

  if (cancelled) {
    return (
      <CancelledVariant
        project={project}
        finalRows={finalRows}
        canEdit={canEdit}
        canReadHostesses={canReadHostesses}
      />
    )
  }

  const noInvites = canReadHostesses && rows.length === 0
  const headline = canReadHostesses ? teamHeadline({ gap, pendingLive, pendingExpired }) : null

  return (
    <div className="pt-3" data-testid="team-tab">
      {/* ── שלושת האריחים; בווריאנט "טרם נשלח זימון" המוקאפ מצייר שניים בלבד ── */}
      <div className="mb-3 flex flex-wrap gap-3">
        <StatTile
          label="כמות נדרשת"
          value={<Ltr>{String(required)}</Ltr>}
          sub={hostessChanges.length > 0 ? 'עודכן בשינוי-תכולה' : 'מההצעה'}
          testId="team-tile-required"
        />
        <StatTile
          label="אושרו סופית"
          value={<Ltr>{String(confirmed)}</Ltr>}
          sub="המדד: מאושרות ≥ נדרשות"
          testId="team-tile-confirmed"
        />
        {!noInvites && (
          <StatTile
            label="חסרות"
            value={
              // רק הספרה אדומה — הרקע נשאר לבן (tile-v.alarm במוקאפ).
              <span className={gap > 0 ? 'text-red-600' : undefined}>
                <Ltr>{String(gap)}</Ltr>
              </span>
            }
            sub={missingTileSub({ gap, pendingLive, pendingExpired }) ?? undefined}
            testId="team-tile-missing"
          />
        )}
      </div>

      {/* המשפט האדום היחיד של המסך — המילים נושאות אותו גם בלי הצבע (§3.4). */}
      {!noInvites && headline && (
        <p className="mb-3.5 text-[13px] leading-relaxed" data-testid="team-headline">
          <span className="font-semibold text-red-600">{headline.lead}</span>{' '}
          <span className="text-slate-600">{headline.rest}</span>
        </p>
      )}

      {/* ── סרגל: כפתור-משני ממוסגר (הפעולה הראשית של הכרטיס אינה כאן — ⑧-5) ── */}
      <ActionsBar
        project={project}
        canEdit={canEdit}
        canReadHostesses={canReadHostesses}
        onScopeChange={onScopeChange}
        showSortLine={!noInvites && canReadHostesses}
      />

      {!canReadHostesses ? (
        // חסימת 'דיילות' — מצב מוצהר, לא טבלה ריקה בשקט (⑧-8ב). המונים למעלה אמיתיים
        // (מבט-העל מוגדר); רק הפירוט פר-דיילת חסום.
        <PermissionAwareEmpty
          state="noPermission"
          title={TEAM_NO_PERMISSION_SENTENCE}
          testId="team-state-no-permission"
        />
      ) : noInvites ? (
        <PermissionAwareEmpty
          state="empty"
          title={NO_INVITES_TITLE}
          action={
            <Link
              to="/hostesses"
              className="text-xs font-semibold text-teal-700"
              data-testid="team-empty-smart-match-link"
            >
              פתח שיבוץ חכם →
            </Link>
          }
          testId="team-state-no-invites"
        />
      ) : (
        <MainTable finalRows={finalRows} now={now} />
      )}

      {/* ── שינויי-תכולה בכמות הדיילות — יושבים איפה שהתוצאה שלהם נראית ── */}
      <ScopeChangesSection project={project} hostessChanges={hostessChanges} required={required} />

      {/* ── היסטוריית הסבבים — הסטטוס הגולמי, מקופלת כברירת-מחדל ── */}
      {canReadHostesses && rows.length > 0 && (
        <RoundsHistory
          rows={rows}
          finalCount={finalRows.length}
          open={historyOpen}
          onToggle={() => setHistoryOpen((open) => !open)}
        />
      )}
    </div>
  )
}

function ActionsBar({ project, canEdit, canReadHostesses, onScopeChange, showSortLine }) {
  const status = project?.project_status
  const closedStamp = project?.operationally_closed_at
  const blocked = POST_EVENT_STATUSES.includes(status)
  const blockedTitle = closedStamp
    ? `הכרטיס נסגר תפעולית ב-${formatDate(String(closedStamp).slice(0, 10))}`
    : blocked
      ? SCOPE_BLOCKED_TITLE
      : undefined

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pb-1">
        {canEdit && (
          <button
            type="button"
            disabled={blocked}
            title={blockedTitle}
            onClick={() => onScopeChange?.()}
            className={cn(
              'rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            data-testid="team-scope-button"
          >
            שנה כמות דיילות
          </button>
        )}
        {canReadHostesses && (
          <Link
            to="/hostesses"
            className="text-xs font-semibold text-teal-700"
            data-testid="team-smart-match-link"
          >
            פתח שיבוץ חכם →
          </Link>
        )}
        {showSortLine && <span className="mr-auto text-xs text-slate-400">{SORT_LINE}</span>}
      </div>
      {(canEdit || canReadHostesses) && (
        <p className="mb-3 text-[11.5px] leading-relaxed text-slate-400">
          {SCOPE_NOTE}
          {canReadHostesses && <> · {SMART_MATCH_CLARIFICATION}</>}
        </p>
      )}
    </>
  )
}

// הטבלה הראשית: שורה אחת פר-דיילת (הקיפול), 4 עמודות. "מה זה אומר" — משפט, לעולם לא ציון.
function MainTable({ finalRows, now }) {
  const sorted = sortTeamRows(finalRows)
  return (
    <table className="w-full border-collapse text-sm" data-testid="team-table">
      <thead>
        <tr className="border-b border-slate-200 text-right text-xs font-semibold text-slate-500">
          <th className="w-[24%] px-2.5 py-1.5">דיילת</th>
          <th className="w-[16%] px-2.5 py-1.5">סטטוס</th>
          <th className="w-[20%] px-2.5 py-1.5">מתי</th>
          <th className="w-[40%] px-2.5 py-1.5">מה זה אומר</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => {
          const displayLabel = assignmentDisplayStatus(row, now)
          const expired = isInviteExpired(row, now)
          const meaning = assignmentMeaning({
            status: row.assignment_status,
            expired,
            completed: displayLabel === COMPLETED_ASSIGNMENT_LABEL,
            isShiftLead: Boolean(row.is_shift_lead),
            daysWithoutAnswer: expired ? daysWithoutAnswer(row.invite_sent_at, now) : null,
            expiredOnText: expired ? inviteExpiryText(row.invite_sent_at) : null,
            hoursLeft: inviteHoursLeft(row, now),
          })
          return (
            <tr
              key={row.hostess_id}
              className={cn(
                'border-b border-slate-100',
                isMutedTeamRow(row.assignment_status) && 'bg-slate-50 text-slate-500',
              )}
              data-testid={`team-row-${row.hostess_id}`}
            >
              <td className="px-2.5 py-2.5">
                <span className="font-semibold text-slate-800">
                  {row.hostesses?.full_name ?? '—'}
                </span>{' '}
                {/* ζ: תג-אחראית בלי ★ — הגליף כבר תפוס ל"התרשמות" (RatingStars). */}
                {row.is_shift_lead && <StatusTag label={SHIFT_LEAD_LABEL} tone="outline" />}
              </td>
              <td className="px-2.5 py-2.5">
                <StatusTag label={displayLabel} testId={`team-status-${row.hostess_id}`} />
              </td>
              <td className="px-2.5 py-2.5 text-xs text-slate-500">{whenCell(row)}</td>
              <td
                className="px-2.5 py-2.5 text-[12.5px] leading-relaxed text-slate-600"
                data-testid={`team-meaning-${row.hostess_id}`}
              >
                {meaning}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// "סבב 1 · זימון 09/08 20:33" — החותמת מבודדת-כיווניות; המילים סביבה עבריות.
function whenCell(row) {
  const round = `סבב ${Number(row.assignment_number) || 1}`
  if (!row.invite_sent_at) return round
  return (
    <span>
      {round} · זימון <Ltr>{formatTimestamp(row.invite_sent_at)}</Ltr>
    </span>
  )
}

function ScopeChangesSection({ project, hostessChanges, required }) {
  return (
    <div className="mt-6" data-testid="team-scope-changes">
      <h2 className="text-sm font-bold text-slate-700">שינויי-תכולה בכמות הדיילות</h2>
      {hostessChanges.length === 0 ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600">
          <b>אין.</b>{' '}
          {scopeFactSentence({
            required,
            // רגע-האישור: הפרויקט נולד מאישור-ההצעה, ולכן created_at שלו הוא התאריך (`הנחתי`).
            approvedOnText: formatDate(String(project?.created_at ?? '').slice(0, 10)) || null,
          })}
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          {hostessChanges.map((change) => (
            <div
              key={change.change_id}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600"
              data-testid={`team-scope-change-${change.change_id}`}
            >
              <b>
                <Ltr>
                  {Number(change.delta_qty) > 0 ? `+${change.delta_qty}` : String(change.delta_qty)}
                </Ltr>
              </b>{' '}
              · <Ltr>{change.performed_by ?? '—'}</Ltr> ·{' '}
              <Ltr>{formatTimestampFull(change.created_at)}</Ltr> · {change.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// היסטוריית הסבבים: **הסטטוס הגולמי כפי שנרשם** — לא 'פג תוקף' ולא 'הושלם' (שתי הנגזרות
// חיות בטבלה החיה בלבד; "תווית שהופכת לסטטוס היא סטטוס חדש בדלת האחורית").
function RoundsHistory({ rows, finalCount, open, onToggle }) {
  const sorted = sortRoundsHistory(rows)
  return (
    <div className="mt-6" data-testid="team-history">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-sm font-bold text-slate-700">היסטוריית הסבבים</h2>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-semibold text-teal-700"
          data-testid="team-history-toggle"
        >
          {open ? `הסתר (${rows.length} שורות)` : `הצג (${rows.length} שורות)`}
        </button>
        {open && <span className="mr-auto text-xs text-slate-400">{RAW_STATUS_NOTE}</span>}
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 pb-2 pt-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-right text-xs font-semibold text-slate-500">
                <th className="w-[9%] px-2 py-1.5">סבב</th>
                <th className="w-[23%] px-2 py-1.5">דיילת</th>
                <th className="w-[22%] px-2 py-1.5">סטטוס גולמי</th>
                <th className="w-[16%] px-2 py-1.5">תעריף מוקפא</th>
                <th className="w-[15%] px-2 py-1.5">זימון נשלח</th>
                <th className="w-[15%] px-2 py-1.5">נענה</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={`${row.hostess_id}-${row.assignment_number}`}
                  className="border-b border-slate-200"
                  data-testid={`team-history-row-${row.hostess_id}-${row.assignment_number}`}
                >
                  <td className="px-2 py-2">
                    <Ltr>{String(row.assignment_number)}</Ltr>
                  </td>
                  <td className="px-2 py-2">{row.hostesses?.full_name ?? '—'}</td>
                  <td className="px-2 py-2">
                    <StatusTag
                      label={ASSIGNMENT_STATUS_LABELS[row.assignment_status] ?? '—'}
                      testId={`team-history-status-${row.hostess_id}-${row.assignment_number}`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {/* התעריף המוקפא של הסבב — לא hostesses.hourly_rate, שיכול להשתנות. */}
                    <Money amount={row.hourly_rate_snapshot} />
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {row.invite_sent_at ? <Ltr>{formatTimestamp(row.invite_sent_at)}</Ltr> : '—'}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {row.responded_at ? <Ltr>{formatTimestamp(row.responded_at)}</Ltr> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            className="px-0.5 pt-2 text-[11.5px] text-slate-400"
            data-testid="team-history-footnote"
          >
            {historyFootnote(rows.length, finalCount)}
          </p>
        </div>
      )}
    </div>
  )
}

// וריאנט "פרויקט שבוטל": תג בוטל + שורת-העובדה + רשימת-המשוחררות; אין חוסר, אין אדום,
// אין היסטוריה — ביטול הוא מצב-סיום תקין. הכפתור מכובה-ומנומק (המוקאפ), לא נעלם.
function CancelledVariant({ project, finalRows, canEdit, canReadHostesses }) {
  const released = finalRows.filter((row) => row.assignment_status === 'released')
  return (
    <div className="pt-3" data-testid="team-tab">
      <div
        className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600"
        data-testid="team-cancelled-fact"
      >
        {/* הטון דרך resolveProjectTone — SSOT יחיד לתווית/צבע-סטטוס-פרויקט (כלל ברזל 14), אותו
            דפוס כמו ProjectRow ב-CustomerDetailsPage.jsx; לא tone="dashed" מוקלד-קשיח. */}
        <StatusTag label="בוטל" tone={resolveProjectTone('בוטל')} />{' '}
        {project?.cancelled_at && (
          <b>
            <Ltr>{formatTimestampFull(project.cancelled_at)}</Ltr>
          </b>
        )}
        {project?.cancel_type && <> · {CANCEL_TYPE_LABELS[project.cancel_type]}</>} ·{' '}
        {cancelledReleasedSentence(canReadHostesses ? released.length : 0)}
      </div>

      {canReadHostesses ? (
        released.length > 0 && (
          <table className="w-full border-collapse text-sm" data-testid="team-cancelled-list">
            <tbody>
              {released.map((row) => (
                <tr
                  key={row.hostess_id}
                  className="border-b border-slate-100 bg-slate-50 text-slate-500"
                  data-testid={`team-released-${row.hostess_id}`}
                >
                  <td className="px-2.5 py-2.5">{row.hostesses?.full_name ?? '—'}</td>
                  <td className="w-[34%] px-2.5 py-2.5">
                    <StatusTag label={ASSIGNMENT_STATUS_LABELS.released} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <PermissionAwareEmpty
          state="noPermission"
          title={TEAM_NO_PERMISSION_SENTENCE}
          testId="team-state-no-permission"
        />
      )}

      {canEdit && (
        <p className="mt-3 flex items-center gap-2.5">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-700 opacity-50"
            data-testid="team-scope-button"
          >
            שנה כמות דיילות
          </button>
          <span className="text-[11.5px] text-slate-400" data-testid="team-cancelled-reason">
            {CANCELLED_SCOPE_REASON}
          </span>
        </p>
      )}
    </div>
  )
}
