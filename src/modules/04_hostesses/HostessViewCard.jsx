// משטח 3ד · כרטיס דיילת לצפייה — מוקאפ מאושר `08_view_hostess_approved.html`.
//
// 🔑 **ההחלטה האחת** (`screens-approved.md` 3ד §②): *"מי הדיילת הזו, ומה כדאי לי לדעת
// עליה לפני שאני מתקשרת אליה או משבצת אותה."* זה ההבדל בין טבלת-המאגר (סריקה מהירה)
// לכרטיס הזה (תמונה מלאה על אדם אחד) — אותו יחס בדיוק כמו טבלת-לקוחות מול עמוד-לקוח.
//
// 🔴 **‏overlay מעל המאגר, לא עמוד** — `processes-approved.md` מצטט את C5 במפורש:
// *"באותו מסך"*. שאלת "עמוד מול חלון" שנדונה ב-`CustomerDetailsPage` אינה חלה כאן
// באותה עוצמה: למאגר של עד 50 דיילות, היסטוריית-שיבוצים בודדת אינה מתקרבת לאותו היקף.
//
// 🚫 **תצוגה בלבד** — אין קישורים לאירועים/לקוחות מתוך ההיסטוריה; מסך-הפרויקטים שייך
// למודול 6, ולינק שמוביל לשום מקום גרוע מהיעדרו.

import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingOrError from '@/components/LoadingOrError'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import RatingStars from '@/components/RatingStars'
import ChipToggle from '@/components/ChipToggle'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ASSIGNMENT_STATUS_LABELS,
  HOSTESS_PARAM_NAMES,
  assignmentDisplayStatus,
  eventStartInstant,
  eventWasCancelled,
  finalAssignmentRows,
  eventsInLastQuarter,
  unansweredStreakTag,
  hostessDisplayState,
  unavailabilityLabel,
  optionalNumber,
} from '@/lib/hostesses'
import { responsivenessCounts, SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { formatDate } from '@/lib/dates'
import { getHostess, getHostessAssignments, getHostessScreenParams } from './api'

const MS_PER_WEEK = 7 * 24 * 3_600_000

export default function HostessViewCard({ hostessId, onClose, onEdit }) {
  const { permissions } = useAuth()
  const canEdit = permissions['דיילות'] === 'edit'

  const [hostess, setHostess] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const now = useMemo(() => new Date().toISOString(), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [row, rows, paramRows] = await Promise.all([
          getHostess(hostessId),
          getHostessAssignments(hostessId),
          getHostessScreenParams(),
        ])
        if (cancelled) return
        if (!row) throw new Error('הדיילת לא נמצאה, או שאין לך הרשאה אליה.')
        setHostess(row)
        setAssignments(rows)
        setParams(paramRows)
      } catch (err) {
        // 🔴 שגיאה מוצגת כשגיאה — לא כרטיס חצי-מלא בשקט (כרטיס §⑤).
        if (!cancelled) setError(err.message ?? 'לא הצלחנו לטעון את כרטיס הדיילת')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [hostessId])

  const derived = useMemo(
    () => (hostess ? deriveCardData(hostess, assignments, params, today) : null),
    [hostess, assignments, params, today],
  )

  if (loading || error || !derived) {
    return (
      <Dialog open onOpenChange={(next) => !next && onClose()}>
        <DialogContent dir="rtl" className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>כרטיס דיילת</DialogTitle>
          </DialogHeader>
          {/* שלד-כרטיס: רצועת-הדגשים + פרטים כקווים אפורים (`screens-approved.md:882`). */}
          <LoadingOrError
            loading={loading}
            error={error ?? 'לא הצלחנו לטעון את כרטיס הדיילת'}
            skeleton={{ variant: 'card' }}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-3xl">
        {/* אין כפתור-סגירה ידני כאן — DialogContent כבר מרנדר את זה של Radix באותה נקודה
            בדיוק (`src/components/ui/dialog.jsx`); עותק שני יצר שני יעדי-Tab לאותה פעולה. */}
        <CardBody
          hostess={hostess}
          derived={derived}
          canEdit={canEdit}
          now={now}
          // 🔄 סף-תוקף-הזימון מ-`params` (מודול 9 · צעד 2.3) — מגיע מהטעינה שכבר קיימת
          // בכרטיס (`getHostessScreenParams`), ולא בשליפה נוספת.
          inviteValidityHours={params[HOSTESS_PARAM_NAMES.inviteValidityHours]}
          onEdit={() => onEdit(hostessId)}
        />
      </DialogContent>
    </Dialog>
  )
}

// כל החישובים של הכרטיס במקום אחד, מחוץ לקומפוננטה — כך שהקומפוננטה נשארת תצוגה בלבד.
function deriveCardData(hostess, assignments, params, today) {
  {
    const finals = finalAssignmentRows(assignments)

    // 🔴 "שיבוצים קרובים" מול "היסטוריה" — אותה רשימה, נחתכת בתאריך-האירוע. הכותרת
    // במוקאפ אומרת זאת מפורשות: ההיסטוריה **אינה כוללת** את השיבוץ הפעיל שכבר למעלה.
    const upcoming = finals
      .filter((row) => (row.projects?.final_event_date ?? '') >= today)
      .sort((a, b) => a.projects.final_event_date.localeCompare(b.projects.final_event_date))
    const history = finals
      .filter((row) => (row.projects?.final_event_date ?? '') < today)
      .sort((a, b) => b.projects.final_event_date.localeCompare(a.projects.final_event_date))

    // "עבדה אצל <לקוח> — Nx": אותו JOIN של הצ'יפ במסך 2, מקובץ לפי לקוח במקום
    // מסונן-לאירוע. נספר על אותו כלל כמו מונה-הרבעון — אירוע שהושלם בפועל.
    const byCustomer = new Map()
    for (const row of finals) {
      if (row.assignment_status !== 'finally_approved') continue
      // 🆕 12/08/2026 — אירוע שבוטל אינו נספר. **אותה פונקציה בדיוק** כמו בשיבוץ-החכם:
      // עד היום הצ'יפ כאן והצ'יפ שם היו מציגים שני מספרים שונים לאותה דיילת ולאותו לקוח.
      if (eventWasCancelled(row)) continue
      if ((row.projects?.final_event_date ?? '') >= today) continue
      const name = row.projects?.customer_name
      if (!name) continue
      byCustomer.set(name, (byCustomer.get(name) ?? 0) + 1)
    }

    // "עבדה לאחרונה לפני N שבועות" — נמדד ממתי שהיא **עבדה**, לא ממתי שהוזמנה.
    const lastWorked = history
      .filter((row) => row.assignment_status === 'finally_approved')
      .map((row) => row.projects.final_event_date)
      .sort()
      .at(-1)

    const weeksSinceWorked = lastWorked
      ? Math.floor(
          (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastWorked}T00:00:00Z`)) / MS_PER_WEEK,
        )
      : null

    // 🔴 **אותו סף בדיוק כמו מסך 2** (`screens-approved.md` 3ד §⑦: "אותו סף/מכפיל של מנוף-ההוגנות
    // (8 שבועות, מסך 2 §🏷️), לא ניסוח חדש") — `SmartMatchPage.jsx` מציג את הצ'יפ הזה רק מעל
    // `תקרת_שבועות_הוגנות`, וכאן הוא הוצג ללא סף בכלל: דיילת שעבדה אתמול הייתה מקבלת
    // "עבדה לאחרונה לפני 0 שבועות" — בדיוק ההפך מהאזהרה שהצ'יפ נועד לשאת.
    const weeksCap = optionalNumber(params[SMART_MATCH_PARAM_NAMES.fairnessWeeksCap])
    const weeksSinceWorkedStale =
      weeksSinceWorked !== null && weeksCap !== null && weeksSinceWorked >= weeksCap

    return {
      state: hostessDisplayState(hostess, hostess.hostess_unavailability, today),
      counts: responsivenessCounts(assignments),
      quarterEvents: eventsInLastQuarter(assignments, today),
      streak: unansweredStreakTag(
        assignments,
        optionalNumber(params[SMART_MATCH_PARAM_NAMES.unansweredStreak]),
      ),
      upcoming,
      history,
      customers: [...byCustomer.entries()].sort((a, b) => b[1] - a[1]),
      weeksSinceWorked,
      weeksSinceWorkedStale,
    }
  }
}

function CardBody({ hostess, derived, canEdit, now, inviteValidityHours, onEdit }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle data-testid="hostess-card-title">
          <span className="flex items-center gap-2">
            {hostess.full_name}
            <StatusTag label={derived.state.label} tone={derived.state.tone} />
          </span>
        </DialogTitle>
        <p className="mt-0.5 text-xs text-slate-500">
          {hostess.created_at && (
            <>
              במאגר מ-
              <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                {formatDate(hostess.created_at.slice(0, 10))}
              </span>{' '}
              ·{' '}
            </>
          )}
          עיר: {hostess.city}
        </p>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            title="עריכה"
            aria-label={`עריכת ${hostess.full_name}`}
            className="absolute left-12 top-4 h-7 w-7 rounded-md border-slate-200 p-0 text-slate-600"
            data-testid="hostess-card-edit"
          >
            <Pencil className="size-4" />
          </Button>
        )}
      </DialogHeader>

      <div className="max-h-[70vh] overflow-y-auto pl-1">
        <div className="mb-3 flex flex-wrap gap-2">
          <StatTile label="התרשמות המנהלת" value={<RatingStars value={hostess.rating} />} />
          <StatTile
            label="שיעור היענות"
            // 🔴 `null` ולא `0 מ-0`: לדיילת חדשה אין רקורד, ו"0" נקרא כשיפוט שלילי
            // על מי שפשוט טרם קיבלה זימון. אותו כלל בדיוק כמו `טרם נצבר מידע` בציון.
            value={
              derived.counts.answered > 0
                ? `${derived.counts.confirmed} מ-${derived.counts.answered}`
                : null
            }
            emptyText="טרם נצבר מידע"
          />
          <StatTile label="יש רכב" value={hostess.has_car ? 'כן' : 'לא'} />
          <StatTile label="אירועים ברבעון האחרון" value={String(derived.quarterEvents)} />
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {derived.weeksSinceWorkedStale && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              עבדה לאחרונה לפני {derived.weeksSinceWorked} שבועות
            </span>
          )}
          {derived.streak && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              {derived.streak.label}
            </span>
          )}
        </div>

        <Section title="שיבוצים קרובים" note="מה שהיא כרגע מחויבת אליו">
          {derived.upcoming.length === 0 ? (
            <Muted>אין לה כרגע שיבוץ פעיל</Muted>
          ) : (
            <AssignmentTable
              rows={derived.upcoming}
              now={now}
              inviteValidityHours={inviteValidityHours}
            />
          )}
        </Section>

        <Section title="עבדה אצל" note="לפי לקוח, לא רק ספירה שטוחה">
          {derived.customers.length === 0 ? (
            <Muted>עדיין לא עבדה אצל אף לקוח</Muted>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {derived.customers.map(([name, count]) => (
                <span
                  key={name}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600"
                >
                  {name} ·{' '}
                  <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                    {count}×
                  </span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* 🔴 **ריק מוצהר, לא ריק שקט.** הטבלה נכתבת ע"י מודול 6 ותישאר ריקה עד
                  שייבנה — והמסך אומר זאת במפורש. פאנל ריק בלי הסבר היה נקרא כתקלה. */}
        <Section title="העדפת-לקוחות" note="שכבה 2 של Smart Match">
          <Muted>⚠️ עדיין לא זמין — הטבלה נכתבת ע״י מודול 6 ותישאר ריקה עד שהוא ייבנה.</Muted>
        </Section>

        <Section title="פרטי קשר">
          <div className="grid grid-cols-2 gap-2">
            <KeyValue label="טלפון" value={hostess.phone} ltr />
            <KeyValue label="אימייל" value={hostess.email} ltr />
            <KeyValue label="עיר" value={hostess.city} />
            <KeyValue label="כתובת מלאה" value={hostess.address ?? '—'} />
          </div>
          {hostess.lat === null && (
            <p className="mt-1 text-[11px] text-amber-700">
              אין קואורדינטות — בחישוב הקרבה היא מקבלת ציון ניטרלי, לא אפס.
            </p>
          )}
        </Section>

        {/* 🔴 בנק ות"ז **רק להרשאת-עריכה** (`processes-approved.md §0`) — התנאי חל
                  בתוך הכרטיס עצמו, לא רק על הגישה אליו. */}
        {canEdit && (
          <Section title="פרטים עסקיים" note="רק למי שיש לה הרשאת-עריכה">
            <div className="grid grid-cols-2 gap-2">
              <KeyValue label="תעודת זהות" value={hostess.id_number} ltr />
              <KeyValue label="שכר שעתי" value={<Money amount={Number(hostess.hourly_rate)} />} />
              {/* 🔴 מ8 ה19: פרטי-הבנק מגיעים מטבלת-הבת דרך LEFT JOIN, ולכן **חוסר-שורה
                  הוא מצב תקין** ולא שגיאה. בלי התנאי הזה דיילת בלי פרטי-בנק הייתה
                  מציגה `" ·  · "` — שלוש נקודות ריקות שנראות כמו תקלה. `—` הוא
                  המוסכמה בפרויקט ל"לא רלוונטי/חסר", ולעולם לא 0 או מחרוזת ריקה. */}
              <KeyValue
                label="בנק · סניף · חשבון"
                value={
                  hostess.bank_name || hostess.bank_branch || hostess.bank_account
                    ? `${hostess.bank_name} · ${hostess.bank_branch} · ${hostess.bank_account}`
                    : '—'
                }
                ltr
              />
              <KeyValue
                label="שפות"
                value={<ChipToggle options={[]} selected={hostess.languages} />}
              />
            </div>
          </Section>
        )}

        <Section title="אי-זמינות מוצהרת">
          {(hostess.hostess_unavailability ?? []).length === 0 ? (
            <Muted>לא הוצהרה אי-זמינות</Muted>
          ) : (
            hostess.hostess_unavailability.map((range) => (
              <div
                key={range.unavailability_id}
                className="mb-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12.5px] text-amber-800"
              >
                {unavailabilityLabel(range)?.replace('לא זמינה ', '')}
                {range.note ? ` · ${range.note}` : ''}
              </div>
            ))
          )}
        </Section>

        <Section title="היסטוריה" note="לא כולל את השיבוץ הפעיל שכבר מופיע למעלה">
          {derived.history.length === 0 ? (
            <Muted>דיילת חדשה, עדיין אין לה היסטוריית שיבוצים</Muted>
          ) : (
            <AssignmentTable
              rows={derived.history}
              now={now}
              inviteValidityHours={inviteValidityHours}
            />
          )}
        </Section>
      </div>
    </>
  )
}

// ‏`inviteValidityHours` = הערך הגולמי של `שעות_תוקף_זימון` מ-`params` (מודול 9 · צעד 2.3).
// הוא מגיע מהטעינה שכבר קיימת בכרטיס (`getHostessScreenParams`) ואינו שליפה נוספת.
function AssignmentTable({ rows, now, inviteValidityHours }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          {['תאריך', 'אירוע', 'לקוח', 'סטטוס'].map((h) => (
            <th
              key={h}
              className="border-b border-slate-200 px-2 py-1.5 text-right text-xs text-slate-500"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          // ⚠️ התווית עוברת דרך `assignmentDisplayStatus` ולא דרך המפה הגולמית, כדי
          // ש"פג תוקף" ו"הושלם" — שתי הנגזרות — יופיעו כאן בדיוק כמו בכל מסך אחר.
          // 🔴 `event_starts_at` חייב לעבור דרך `eventStartInstant` (שעת-האירוע האמיתית,
          // לא חצות UTC מומצא) — `src/modules/04_hostesses/CLAUDE.md` דורש זהות מול
          // `respond_to_shift_invite`. חצות מומצא + "עכשיו"=סוף-היום היו מתייגים כל שיבוץ
          // שתאריכו היום כ"הושלם" מרגע פתיחת הכרטיס, גם אם האירוע רק בערב.
          const label =
            assignmentDisplayStatus(
              {
                ...row,
                event_starts_at: eventStartInstant(
                  row.projects?.final_event_date,
                  row.projects?.final_start_time,
                ),
              },
              now,
              inviteValidityHours,
            ) ?? ASSIGNMENT_STATUS_LABELS[row.assignment_status]
          return (
            <tr key={`${row.project_id}-${row.assignment_number}`}>
              <td className="border-b border-slate-100 px-2 py-1.5" dir="ltr">
                <span className="block text-right">
                  {formatDate(row.projects?.final_event_date)}
                </span>
              </td>
              <td className="border-b border-slate-100 px-2 py-1.5">{row.projects?.event_name}</td>
              <td className="border-b border-slate-100 px-2 py-1.5">
                {row.projects?.customer_name}
              </td>
              <td className="border-b border-slate-100 px-2 py-1.5">
                <StatusTag label={label} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Section({ title, note, children }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-[12.5px] font-semibold text-slate-700">
        {title}
        {note && <span className="font-normal text-slate-500"> — {note}</span>}
      </h3>
      {children}
    </div>
  )
}

function KeyValue({ label, value, ltr }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span
        className={`text-[13px] text-slate-800 ${ltr ? 'text-right' : ''}`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </span>
    </div>
  )
}

function Muted({ children }) {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] text-slate-500">
      {children}
    </p>
  )
}
