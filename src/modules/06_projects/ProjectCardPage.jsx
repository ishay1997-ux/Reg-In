// כרטיס-פרויקט (מודול 6 · משטח 2) — המעטפת ואזור-הזהות: תעודת-הזהות של האירוע, שני
// מדדי-המוכנות, סרגל שלוש הלשוניות, ושלוש הפעולות (שינוי תכולה · ביטול פרויקט · עריכת
// פרטים). תוכן הלשוניות אינו של הצעד הזה: לוגיסטיקה ⇐ 3.3 · צוות ⇐ 3.4 · סגירה ⇐ 3.5.
//
// 🔴 "ביטול פרויקט" יושב על המעטפת ולא בלשונית-הסגירה — סטייה מודעת מ-C5 §5.6.7 (S-14):
// ‏🔄3 קובע שביטול אפשרי "בכל שלב פעיל", בעוד לשונית-הסגירה נפתחת רק אחרי שהאירוע התקיים
// (🏁6 אף קובע "אין סגירה תפעולית לפרויקט מבוטל") ⇒ המיקום של C5 היה הופך את הביטול
// לבלתי-נגיש בדיוק כשהוא נחוץ. הסטייה רשומה בתיעוד החי (Ledger S-14).
//
// 🔴 והכפתור מוצג רק על שלושת הסטטוסים הפעילים של ⑫ (as-built ①): ‏cancel_project מסרבת
// מ-event_finished והלאה, וכפתור שתמיד מרונדר על המעטפת היה חי-ונכשל על פרויקט שהאירוע
// שלו כבר היה. חסימת-מצב ⇒ בכרטיס הזה הכפתור *נעלם* (הכרעת-הכרטיס ④: "אין ביטול-ביטול").
//
// 🚫 שם-הלקוח ומספר-ההצעה אינם קישורים (S-13) — אין ולו קישור ישות⇐ישות אחד באפליקציה
// הבנויה, וקישור שדוחה 2 מ-5 תפקידים גרוע מהיעדרו.
//
// הרשאות: הסתרת הכפתורים היא נוחות-מסך בלבד — מנהלת לוגיסטיקה מחזיקה edit על 'פרויקטים'
// וה-RPC יקבל אותה; ההסתרה משקפת את הכרטיס המאושר (⑤), לא גבול-אבטחה (as-built 3.1).

import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import StatusTag from '@/components/StatusTag'
import StatTile from '@/components/StatTile'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { formatDate, formatTimeRange, formatTimestampFull, weekdayOf } from '@/lib/dates'
import {
  PROJECT_STATUS_LABELS,
  ACTIVE_PROJECT_STATUSES,
  resolveProjectTone,
  staffingCell,
  logisticsCell,
  eventDaysFromToday,
  proximitySentence,
} from '@/lib/projects'
import {
  closingTabState,
  feedbackCell,
  eventDurationText,
  combinedDiscountPercent,
  cardStaffingTileSub,
  cardLogisticsTileSub,
  CANCEL_TYPE_LABELS,
} from '@/lib/projectCard'
import {
  getProject,
  listProjectsOverview,
  getProjectQuoteMeta,
  getProjectCustomerContact,
} from './api'
import EditProjectDetailsDialog from './EditProjectDetailsDialog'
import ScopeChangeDialog from './ScopeChangeDialog'
import CancelProjectDialog from './CancelProjectDialog'
import LogisticsTab from './LogisticsTab'
import TeamTab from './TeamTab'
import ClosingTab from './ClosingTab'

// הסטטוסים שאחרי הסגירה התפעולית — "שינוי תכולה" מושבת-ומנומק עליהם (חסימת-מצב, ㉔),
// בשונה מחסימת-הרשאה שמעלימה. ‏cancelled מטופל בנפרד (הכפתור הראשי יורד מפרויקט מת).
const POST_EVENT_STATUSES = ['event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished']
const SCOPE_BLOCKED_TITLE = "אחרי האירוע, שינויים מוזנים בלשונית 'סגירת אירוע'"

const TAB_KEYS = { logistics: 'logistics', team: 'team', closing: 'closing' }

export default function ProjectCardPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { permissions } = useAuth()

  // הרשאת-עריכה על 'פרויקטים' ⇒ שלוש הפעולות מוצגות; בלעדיה הן פשוט אינן (הכרטיס ⑤:
  // חסימה מטעמי-הרשאה ⇒ הרכיב אינו מוצג — לא present-and-disabled).
  const canEdit = permissions['פרויקטים'] === 'edit'
  const canReadHostesses = ['edit', 'view'].includes(permissions['דיילות'])
  const canReadCustomers = ['edit', 'view'].includes(permissions['לקוחות'])

  const [project, setProject] = useState(null)
  const [overviewRow, setOverviewRow] = useState(null)
  const [quoteMeta, setQuoteMeta] = useState(null)
  const [customerContact, setCustomerContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10))
  const [reloadTick, setReloadTick] = useState(0)

  // ברירת-המחדל תמיד הלשונית הראשונה (הכרטיס ⑧⑥ — לא "הלשונית עם החוסר הגדול"), והמצב
  // מקומי ולא בכתובת בכוונה: החלפת לשונית "אינה ניווט-עמוד; ה-URL של הפרויקט נשמר" (①).
  const [tab, setTab] = useState(TAB_KEYS.logistics)

  const [editOpen, setEditOpen] = useState(false)
  // שני הדיאלוגים של 3.6/3.7 — אותו דפוס remount-דרך-key כמו דיאלוג-העריכה שמתחת.
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeSession, setScopeSession] = useState(0)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelSession, setCancelSession] = useState(0)
  // remount של הדיאלוג בכל פתיחה = איפוס-טופס דרך key (דפוס CustomerFormDialog), בלי
  // לכלול את editOpen עצמו ב-key — זה היה הורג את אנימציית-היציאה של Radix.
  const [editSession, setEditSession] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [proj, overview] = await Promise.all([getProject(projectId), listProjectsOverview()])
        if (cancelled) return
        if (!proj) {
          // ריק-אמיתי אינו קיים בכרטיס — id שאינו קיים הוא "לא נמצא", לא מסך ריק (④).
          setNotFound(true)
          setError(null)
          return
        }
        // הכנסה מתוכננת ושני המדדים — משורת מבט-העל של אותו פרויקט (as-built ⑦: אין
        // reader ייעודי; ה-RPC המוגדר כבר עושה את גידור-ה-NULL של S-2, והצירוף בדפדפן
        // היה פותח מחדש את מלכודת ה-0.00 לשני התפקידים החסומים).
        const row = overview.find((r) => r.project_id === projectId) ?? null
        // נתוני-ההצעה ואיש-הקשר תלויים בשורת-הפרויקט — נטענים אחריה; קריאה חסומה חוזרת
        // null בשקט וזה הסימן שהתא מציג '—' (לא שגיאה).
        const [meta, contact] = await Promise.all([
          proj.quote_id ? getProjectQuoteMeta(proj.quote_id) : Promise.resolve(null),
          proj.customer_id && canReadCustomers
            ? getProjectCustomerContact(proj.customer_id)
            : Promise.resolve(null),
        ])
        if (cancelled) return
        setProject(proj)
        setOverviewRow(row)
        setQuoteMeta(meta)
        setCustomerContact(contact)
        setToday(new Date().toISOString().slice(0, 10))
        setNotFound(false)
        setError(null)
      } catch (err) {
        // שגיאת-קריאה ⇒ הודעה מפורשת במקום הכרטיס — לעולם לא כרטיס-חצי-מלא בשקט (④).
        if (!cancelled) {
          console.error('project card load failed:', err)
          setError('כרטיס הפרויקט לא נטען.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, reloadTick, canReadCustomers])

  if (loading) {
    return (
      <div data-testid="project-card-page">
        <Crumbs eventName="" />
        <LoadingOrError loading skeleton={{ variant: 'card' }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div data-testid="project-card-page">
        <Crumbs eventName="" />
        <PermissionAwareEmpty
          state="empty"
          title="הפרויקט לא נמצא"
          action={
            <Link to="/projects" className="text-xs font-semibold text-teal-700">
              חזרה למבט-העל →
            </Link>
          }
          testId="project-card-not-found"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="project-card-page">
        <Crumbs eventName="" />
        <div className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <PermissionAwareEmpty
            state="error"
            detail={error}
            onRetry={refresh}
            testId="project-card-error"
          />
        </div>
      </div>
    )
  }

  const status = project.project_status
  const statusLabel = PROJECT_STATUS_LABELS[status]
  const isActive = ACTIVE_PROJECT_STATUSES.includes(status)
  const closing = closingTabState(project, today)
  // הפשרה (as-built ③) יכולה לנעול את לשונית-הסגירה בזמן שהיא פתוחה על המסך — הבחירה
  // נופלת אז ללשונית הראשונה במקום לרנדר פאנל של לשונית מושבתת.
  const effectiveTab =
    tab === TAB_KEYS.closing && closing.mode === 'disabled' ? TAB_KEYS.logistics : tab
  const staffing = overviewRow ? staffingCell(overviewRow) : null
  const logistics = overviewRow ? logisticsCell(overviewRow) : null

  return (
    <div data-testid="project-card-page">
      <Crumbs eventName={project.event_name} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-800">{project.event_name}</h1>
            {/* התג מדווח בלבד — הסטטוס נכתב ע"י מכונת-המסד, אין דרך אנושית לשנותו (①). */}
            <StatusTag
              label={statusLabel}
              tone={resolveProjectTone(statusLabel)}
              testId="project-card-status"
            />
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {project.customer_name} · פרויקט <Ltr>{`#${project.project_id}`}</Ltr> · נוצר מהצעה{' '}
            <Ltr>{`#${project.quote_id}`}</Ltr>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {/* סדר ה-DOM: הביטול (שקט) ואז הפעולה הראשית — כמו במוקאפ. */}
            {isActive && (
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => {
                  setCancelSession((s) => s + 1)
                  setCancelOpen(true)
                }}
                data-testid="project-card-cancel-button"
              >
                ביטול פרויקט
              </button>
            )}
            {status !== 'cancelled' && (
              <button
                type="button"
                disabled={POST_EVENT_STATUSES.includes(status)}
                title={POST_EVENT_STATUSES.includes(status) ? SCOPE_BLOCKED_TITLE : undefined}
                className={cn(
                  'rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
                onClick={() => {
                  setScopeSession((s) => s + 1)
                  setScopeOpen(true)
                }}
                data-testid="project-card-scope-button"
              >
                שינוי תכולה
              </button>
            )}
          </div>
        )}
      </div>

      <IdentityCard
        project={project}
        quoteMeta={quoteMeta}
        customerContact={customerContact}
        canReadCustomers={canReadCustomers}
        overviewRow={overviewRow}
        today={today}
        canEdit={canEdit}
        onEdit={() => {
          setEditSession((s) => s + 1)
          setEditOpen(true)
        }}
      />

      {/* שני מדדי-המוכנות — במקום ה-stepper (㉖), לעולם לא ממוזגים לאחוז אחד (⑨).
          אריחים אינם לחיצים (S-16) — הלשונית היא יעד-הלחיצה. */}
      <div className="mb-4 flex flex-wrap gap-3">
        <StatTile
          label="צוות דיילות"
          value={ratioValue(staffing)}
          emptyText={overviewRow ? '—' : 'לא ניתן לטעון'}
          sub={
            staffing && !staffing.hidden
              ? (cardStaffingTileSub(overviewRow) ?? undefined)
              : undefined
          }
          testId="project-card-tile-staffing"
        />
        <StatTile
          label="לוגיסטיקה ומוצרים"
          value={ratioValue(logistics)}
          emptyText={overviewRow ? '—' : 'לא ניתן לטעון'}
          sub={
            logistics && !logistics.hidden
              ? (cardLogisticsTileSub(overviewRow) ?? undefined)
              : undefined
          }
          testId="project-card-tile-logistics"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 pb-3.5 shadow-sm">
        <TabsBar tab={effectiveTab} onSelect={setTab} closing={closing} />
        <TabPanel
          tab={effectiveTab}
          project={project}
          overviewRow={overviewRow}
          canEdit={canEdit}
          canReadHostesses={canReadHostesses}
          onScopeChange={() => {
            setScopeSession((s) => s + 1)
            setScopeOpen(true)
          }}
          onSaved={refresh}
        />
      </div>

      {canEdit && (
        <EditProjectDetailsDialog
          key={editSession}
          open={editOpen}
          onOpenChange={setEditOpen}
          project={project}
          overviewRow={overviewRow}
          canReadHostesses={canReadHostesses}
          onSaved={refresh}
        />
      )}
      {/* חיווט 3.6/3.7 (בוצע בסגירת סשן ב'): רענון הכרטיס אחרי שמירה/ביטול — הסטטוס,
          התג והלשוניות נגזרים מחדש מהמסד, לא מנוחשים בצד-הלקוח. */}
      {canEdit && (
        <ScopeChangeDialog
          key={`scope-${scopeSession}`}
          open={scopeOpen}
          onOpenChange={setScopeOpen}
          project={project}
          onSaved={refresh}
        />
      )}
      {canEdit && (
        <CancelProjectDialog
          key={`cancel-${cancelSession}`}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          project={project}
          onCancelled={refresh}
        />
      )}
    </div>
  )
}

// ערך-האריח: היחס בבידוד-כיווניות, רק הספרה נצבעת (המוקאפ tile-v.alarm — הרקע נשאר לבן);
// hidden (סטטוס שנמסר הלאה) ⇒ null ⇒ ה-emptyText של האריח ("—"). אפס שורות לוגיסטיקה
// (‏ratio null אך לא hidden) ⇒ "✓ אין פריטים" — הכרעת-ישי 08/08, המקרה של #11.
function ratioValue(cell) {
  if (!cell || cell.hidden) return null
  if (cell.ratio == null) {
    return <span className="text-sm font-semibold text-slate-500">✓ אין פריטים</span>
  }
  return (
    <span className={cell.tone === 'done' ? '' : 'text-red-600'}>
      <Ltr>{cell.ratio}</Ltr>
    </span>
  )
}

function Crumbs({ eventName }) {
  // פירורי-לחם ב-flex ולא כטקסט עם מפריד — סדר הפריטים נקבע ע"י הפריסה, לא ע"י
  // אלגוריתם ה-bidi (הערת המוקאפ). הקישור חוזר למבט-העל.
  return (
    <div className="mb-2.5 flex items-center gap-2 text-xs text-slate-500">
      <Link to="/projects" className="font-semibold text-teal-700" data-testid="project-card-crumb">
        פרויקטים
      </Link>
      <span className="text-slate-300">|</span>
      <span>{eventName}</span>
    </div>
  )
}

// תא-זהות: תווית וערך באותו div, בסדר תווית→ערך — לעולם לא שורת-תוויות מעל שורת-ערכים
// (§4.3, הבאג שקרה שלוש פעמים). ‏items-start מחזיר כל ילד לרוחב-תוכן וצמוד-ימין ב-RTL —
// המנגנון של 3.0 β, אותו תיקון שהמוקאפ עצמו נזקק לו (.cell{align-items:flex-start}).
function Cell({ label, children, testId }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5" data-testid={testId}>
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function Val({ children, empty, className }) {
  if (empty) {
    // ערך ריק — אפור ולא-מודגש (המוקאפ .val.empty): "0 נקרא כעובדה שקרית", מקף/מילים לא.
    return <span className={cn('text-sm font-medium text-slate-400', className)}>{children}</span>
  }
  return (
    <span className={cn('break-words text-sm font-semibold text-slate-800', className)}>
      {children}
    </span>
  )
}

function Sub({ children, className, testId }) {
  return (
    <span className={cn('text-[11px] text-slate-500', className)} data-testid={testId}>
      {children}
    </span>
  )
}

function IdentityCard({
  project,
  quoteMeta,
  customerContact,
  canReadCustomers,
  overviewRow,
  today,
  canEdit,
  onEdit,
}) {
  const days = eventDaysFromToday(project.final_event_date, today)
  const duration = eventDurationText(project.final_start_time, project.final_end_time)
  const hoursText = formatTimeRange(project.final_start_time, project.final_end_time)
  const located = project.lat != null && project.lng != null
  const discount = combinedDiscountPercent(quoteMeta)
  const feedback = feedbackCell(project)
  // חסימת 'לקוחות' מחזירה null בלי שגיאה — `—` בלבד; רק מי שרשאית לקרוא ומצאה ריק
  // מקבלת "לא הוגדר איש קשר" (אחרת היינו מסיקים עובדה מקריאה חסומה).
  const contactEmptyText = canReadCustomers && project.customer_id ? 'לא הוגדר איש קשר' : '—'
  // ‏planned_revenue מהשורה של ה-RPC המוגדר: ‏NULL מכסה גם אין-הצעה וגם אין-הרשאה — שניהם
  // `—`; רק אפס אמיתי מוצג "0.00 ₪" (S-2). לעולם לא Σ בדפדפן (as-built ⑦).
  const plannedRevenue = overviewRow?.planned_revenue ?? null

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3.5 flex items-center gap-2.5">
        <h2 className="text-sm font-bold text-slate-700">פרטי האירוע</h2>
        <span className="mr-auto" />
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            data-testid="project-card-edit-details"
          >
            ✎ עריכת פרטים
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
        <Cell label="תאריך האירוע" testId="project-cell-date">
          <Val>
            <Ltr>{formatDate(project.final_event_date, '—')}</Ltr>
          </Val>
          {/* "שבת · בעוד 9 ימים" — טקסט בלבד, לעולם לא צבע (F20). */}
          <Sub>
            {weekdayOf(project.final_event_date)} · {proximitySentence(days)}
          </Sub>
        </Cell>

        <Cell label="שעות האירוע" testId="project-cell-hours">
          {hoursText ? (
            <Val>
              <Ltr>{hoursText}</Ltr>
            </Val>
          ) : (
            <Val empty>לא הוזנו שעות</Val>
          )}
          {duration && <Sub>{duration}</Sub>}
        </Cell>

        <Cell label="מיקום" testId="project-cell-location">
          <Val>{project.final_location}</Val>
          {/* "טרם אותר" הוא עובדה, לא חוסר בעבודה של דנה — בלי צבע (④). */}
          <Sub>
            {located
              ? 'אותר על המפה — משמש לדירוג הקרבה בשיבוץ'
              : 'טרם אותר על המפה — דירוג הקרבה בשיבוץ יהיה ניטרלי'}
          </Sub>
        </Cell>

        <Cell label="איש קשר אצל הלקוח" testId="project-cell-contact">
          {customerContact?.contact_name ? (
            <>
              <Val>{customerContact.contact_name}</Val>
              {customerContact.phone && (
                <Sub>
                  <Ltr>{customerContact.phone}</Ltr>
                </Sub>
              )}
            </>
          ) : (
            <Val empty>{contactEmptyText}</Val>
          )}
        </Cell>

        <Cell label="אורחים מוערכים" testId="project-cell-guests">
          {quoteMeta?.estimated_guests != null ? (
            <>
              <Val>
                <Ltr>{String(quoteMeta.estimated_guests)}</Ltr>
              </Val>
              {/* תמיד המתוכנן — actual_guests שייך למשטח 5 ואינו קלט-חיוב (⑳). */}
              <Sub>מההצעה — לא מספר סופי</Sub>
            </>
          ) : (
            <>
              <Val empty>—</Val>
              {!project.quote_id && <Sub>אין הצעה מקושרת</Sub>}
            </>
          )}
        </Cell>

        <Cell label="הכנסה מתוכננת" testId="project-cell-revenue">
          {plannedRevenue == null ? (
            // `—` לשני מצבי-ה-NULL של ה-RPC (S-2); רק כשאין הצעה כלל נאמר גם למה —
            // "אין הצעה מקושרת" (הכרטיס §④), בדיוק כמו תא-האורחים. חסימת-הרשאה
            // נשארת `—` חשוף — אין להסיק ממנה עובדה על ההצעה.
            <>
              <Val empty>—</Val>
              {!project.quote_id && <Sub>אין הצעה מקושרת</Sub>}
            </>
          ) : (
            <>
              <Val>
                <Money amount={plannedRevenue} cents />
              </Val>
              {/* לפני מע"מ (§3.1② — ‏6,318.90 שם עובר כל בדיקת-סכימה ושוגה); אחוז-ההנחה
                  הוא חיבור ולא שרשור (§7.26), ונקרא מאותו שער כמו הסכום — יחד או כלל לא. */}
              <Sub>
                {discount != null ? (
                  <>
                    לפני מע"מ, אחרי הנחה של <Ltr>{`${discount}%`}</Ltr>
                  </>
                ) : (
                  'לפני מע"מ'
                )}
              </Sub>
            </>
          )}
        </Cell>

        <Cell label="מנהל/ת הפרויקט" testId="project-cell-owner">
          {project.owner_name ? (
            <Val>{project.owner_name}</Val>
          ) : (
            // ענבר ולא אדום — "אזהרת-היגיינה, חסר-מידע" (④); וזה חוסם בפועל את מייל-האישור.
            <span className="text-[11.5px] font-semibold text-amber-700">
              לא הוגדר/ה מנהל/ת פרויקט
            </span>
          )}
          {/* 🔴 טלפון ואימייל בשתי שורות נפרדות (S-23) — לרצף בן שני ערכי-LTR בתוך משפט
              עברי אין סדר נכון בכלל; התיקון הוא לפרק את הרצף. */}
          {project.owner_phone && (
            <Sub>
              <Ltr>{project.owner_phone}</Ltr>
            </Sub>
          )}
          {project.owner_email && (
            <Sub>
              <Ltr>{project.owner_email}</Ltr>
            </Sub>
          )}
          <Sub>מופיע לדיילות במייל האישור</Sub>
        </Cell>

        {/* משוב הלקוח (㉞) — קריאה בלבד, תא אחד: הכתיבה של מסך-הכספים בלבד (㉘/§7.63);
            אין שדה-עריכה ואין כוכבים לחיצים — במכוון. */}
        <Cell label="משוב הלקוח" testId="project-cell-feedback">
          {feedback.kind === 'score' ? (
            <>
              <Val>
                {/* ספרה ואז כוכב, מבודד — בלי הבידוד ה-bidi הופך ל-"★ 5" (RatingStars). */}
                <Ltr>{`${feedback.score} ★`}</Ltr>
              </Val>
              {feedback.reason && <Sub>{feedback.reason}</Sub>}
              {feedback.notes && <Sub>{feedback.notes}</Sub>}
            </>
          ) : (
            <>
              <Val empty={feedback.kind === 'empty'}>{feedback.value}</Val>
              {feedback.sub && <Sub>{feedback.sub}</Sub>}
            </>
          )}
        </Cell>

        {/* התא התשיעי — רק כשהפרויקט בוטל (S-30): הדיאלוג מבטיח "היא נשמרת בכרטיס והיא
            ההסבר היחיד שיישאר אחרי הביטול" — התא הזה הוא המקום שבו ההבטחה מקוימת. */}
        {project.project_status === 'cancelled' && (
          <Cell label="סיבת הביטול" testId="project-cell-cancel-reason">
            <Val>{project.cancel_reason || '—'}</Val>
            {project.cancel_type && <Sub>{CANCEL_TYPE_LABELS[project.cancel_type]}</Sub>}
            {project.cancelled_at && (
              <Sub testId="project-cancel-stamp">
                בוטל ב-<Ltr>{formatTimestampFull(project.cancelled_at)}</Ltr>
                {project.cancelled_by && (
                  <>
                    {' '}
                    על-ידי <Ltr>{project.cancelled_by}</Ltr>
                  </>
                )}
              </Sub>
            )}
          </Cell>
        )}
      </div>
    </div>
  )
}

function TabsBar({ tab, onSelect, closing }) {
  const baseTab = '-mb-px border-b-2 px-4 py-2.5 text-sm'
  const onCls = 'border-teal-600 font-semibold text-teal-700'
  const offCls = 'border-transparent font-medium text-slate-500'
  const closingDisabled = closing.mode === 'disabled'

  return (
    <div className="-mx-4 flex gap-1 border-b border-slate-200 px-4" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={tab === TAB_KEYS.logistics}
        onClick={() => onSelect(TAB_KEYS.logistics)}
        className={cn(baseTab, tab === TAB_KEYS.logistics ? onCls : offCls)}
        data-testid="project-tab-logistics"
      >
        לוגיסטיקה ומוצרים
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === TAB_KEYS.team}
        onClick={() => onSelect(TAB_KEYS.team)}
        className={cn(baseTab, tab === TAB_KEYS.team ? onCls : offCls)}
        data-testid="project-tab-team"
      >
        צוות דיילות
      </button>
      {/* לשונית-הסגירה: מושבתת עם נימוק בתווית (מצב-חסימה נשאר ומנומק, לא נעלם) —
          והשער הוא הסטטוס בלבד, לעולם לא התאריך (⑫/㉚: מכונת-הסטטוס היא הכותב היחיד). */}
      <button
        type="button"
        role="tab"
        aria-selected={tab === TAB_KEYS.closing}
        disabled={closingDisabled}
        onClick={() => onSelect(TAB_KEYS.closing)}
        className={cn(
          baseTab,
          closingDisabled && 'cursor-not-allowed border-transparent font-medium text-slate-400',
          !closingDisabled && (tab === TAB_KEYS.closing ? onCls : offCls),
        )}
        data-testid="project-tab-closing"
      >
        סגירת אירוע{' '}
        {closingDisabled && (
          <span
            className="text-[11px] font-normal text-slate-400"
            data-testid="project-tab-closing-reason"
          >
            {closing.reason}
          </span>
        )}
      </button>
    </div>
  )
}

// חיווט הלשוניות (נסגר בסשן ג'): שלושת התכנים הם רכיבי 3.3/3.4/3.5; מצב-הסגירה
// (open/closed) מוכרע בתוך ClosingTab עצמו — כולל התצוגה הנעולה עם החותמת ו"שליחה חוזרת".
function TabPanel({
  tab,
  project,
  overviewRow,
  canEdit,
  canReadHostesses,
  onScopeChange,
  onSaved,
}) {
  if (tab === TAB_KEYS.logistics) {
    // הלשונית קריאה-בלבד וחתימתה ({ project }) — כפתור "שינוי תכולה" שלה הוסר בהכרעת-
    // ישי-מואצלת 19/08 (הכותרת נושאת את הראשי היחיד), ולכן אין לה canEdit/onScopeChange.
    return (
      <div className="pt-3" data-testid="project-panel-logistics">
        <LogisticsTab project={project} />
      </div>
    )
  }
  if (tab === TAB_KEYS.team) {
    return (
      <div className="pt-3" data-testid="project-panel-team">
        <TeamTab
          project={project}
          overviewRow={overviewRow}
          canEdit={canEdit}
          canReadHostesses={canReadHostesses}
          onScopeChange={onScopeChange}
        />
      </div>
    )
  }
  return (
    <div className="pt-3" data-testid="project-panel-closing">
      {/* ClosingTab גוזר את מצבו (פתוח/נעול) בעצמו מ-project — אין prop של mode. */}
      <ClosingTab
        project={project}
        overviewRow={overviewRow}
        canEdit={canEdit}
        canReadHostesses={canReadHostesses}
        onSaved={onSaved}
      />
    </div>
  )
}
