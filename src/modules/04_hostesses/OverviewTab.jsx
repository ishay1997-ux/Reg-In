// משטח 1 · מבט-על השיבוצים — הלשונית שהמנהלת נוחתת עליה.
// נבנה לפי המוקאפ המאושר `docs/mockups/hostesses-screen/approved/01_overview_approved.html`.
//
// 🔑 **ההחלטה האחת שהמסך משרת** (`screens-approved.md` מסך 1 §②, מצוטט מישי):
// *"על איזה אירוע אני נכנסת לטפל **עכשיו** — ומה בדיוק חסר בו."*
// ⇒ 🔴 **זה מסך טריאז', לא דוח, ולכן הסדר הוא התשובה** — לא הרשימה. כל רכיב שאינו עוזר
// לדרג בין אירוע לאירוע יוצא מכאן, וזו הסיבה שאין בו חיפוש, אין מיון-עמודות ואין עימוד.
//
// 🚫 **והפעולה היחידה שכותבת למסד מהמסך הזה היא "שלח שוב"** — כל השאר מנתב פנימה.
// זו אינה קוסמטיקה: `מחכות לאישורך` הוא **טקסט ולא כפתור**, כי אישור דורש לבחור *מי*,
// וההחלטה נעשית במסך שיש בו המידע לבחור (Smart Match). מאותו טעם אין כאן
// "שלח לעוד דיילות".

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import FilterPill from '@/components/FilterPill'
import StatTile from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dates'
import { overviewRow, sortOverviewRows, overviewKpis, eventProximityLabel } from '@/lib/hostesses'
import { listStaffingOverview } from './api'

const FILTERS = {
  all: 'הכול',
  missing: 'הצג חסרים בלבד',
  urgent: 'דחוף (עד 72 שעות)',
}

// ⚠️ מחושב פעם אחת בטעינה ומוחזק ב-state — `react-hooks/purity` אוסר קריאת-שעון בתוך
// render, וגם לוגית: "עכשיו" שזז באמצע רינדור מייצר שורות שמסכימות זו עם זו רק לפעמים.
function nowIso() {
  return new Date().toISOString()
}

export default function OverviewTab({ reloadKey, onOpenSmartMatch, onResendExpired }) {
  const { permissions } = useAuth()
  const canEdit = permissions['דיילות'] === 'edit'
  const toast = useToast()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(nowIso)
  const [filter, setFilter] = useState('all')
  const [sending, setSending] = useState(false)

  const [reloadTick, setReloadTick] = useState(0)
  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listStaffingOverview()
        if (cancelled) return
        setProjects(rows)
        setNow(nowIso())
        setError(null)
      } catch (err) {
        // 🔴 **הכשל החמור ביותר במודול הוא "אין כרגע אירועים" כשהשאילתה נכשלה**
        // (`spec.md § מה ייחשב עובד` #4). טבלה עם RLS ובלי policy מחזירה
        // `{data:null, error:null}` — כלומר **הצלחה ריקה** — ו"ריק אמיתי" במסך הזה הוא
        // דווקא בשורה טובה. שתי המשמעויות ההפוכות נראות זהות, ולכן החצי הזה הוא של המסך.
        if (!cancelled) setError(err.message ?? 'לא הצלחנו לטעון את רשימת האירועים')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey, reloadTick])

  const today = now.slice(0, 10)

  // 🔴 אירוע שתאריכו עבר יוצא מהרשימה **לפני** המיון וה-KPI — הוא אינו החלטה שממתינה
  // לה, והמיון-לפי-קרבה היה מקבע אותו בראש לנצח. ר' `isPastEvent` לנימוק המלא.
  const rows = useMemo(() => {
    const derived = projects.map((project) => overviewRow(project, now, today))
    return sortOverviewRows(derived.filter((row) => !row.isPast))
  }, [projects, now, today])

  const kpis = useMemo(() => overviewKpis(rows), [rows])

  const visible = useMemo(() => {
    if (filter === 'missing') return rows.filter((row) => row.isMissing)
    if (filter === 'urgent') return rows.filter((row) => row.isUrgent)
    return rows
  }, [rows, filter])

  // 🔴 **הכפתור המרוכז אינו סופר כל זימון מת — רק את אלה שרענון שלהם יגיע חי.**
  // שורה באירוע שבתוך T-24 או באירוע שכבר אויש נושאת קישור שהמסד ידחה ממילא
  // (`screens-approved` מסך 4 §⑧③) ⇒ הכללתה הייתה שולחת לדיילת מייל שנולד מת.
  const resendableRows = useMemo(() => rows.filter(canResend), [rows])
  const resendableCount = resendableRows.reduce((sum, row) => sum + row.counts.expired, 0)

  // 🔴 **שלוש תוצאות ולא שתיים** (`src/CLAUDE.md`): פסק-זמן הוא **"לא ידוע"** ולא "נכשל" —
  // המייל אולי כן יצא, ו"נכשל" היה גורר את המנהלת לשלוח שוב ולהציף את הדיילת. ולכן גם
  // ההודעה אינה "נשלח בהצלחה" גורף: היא מונה בדיוק מה קרה.
  async function resend(targetRows, label) {
    if (!onResendExpired || targetRows.length === 0) return
    setSending(true)
    try {
      const { sent, unknown, failed } = await onResendExpired(
        targetRows.map((row) => row.project.project_id),
      )
      const parts = [`${sent} ${sent === 1 ? 'קישור נשלח מחדש' : 'קישורים נשלחו מחדש'}${label}`]
      if (unknown > 0) parts.push(`${unknown} — לא ידוע אם יצאו (ייתכן שכן; לא לשלוח שוב מיד)`)
      if (failed > 0) parts.push(`${failed} נכשלו`)

      if (unknown > 0 || failed > 0) toast.error(parts.join(' · '))
      else toast.success(parts[0])
      refresh()
    } catch (err) {
      toast.error(err.message ?? 'שליחת הקישורים מחדש נכשלה.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingOrError loading />
  if (error) {
    return (
      <LoadingOrError
        error={`לא הצלחנו לטעון את רשימת האירועים — ${error}`}
        onRetry={refresh}
        retryTestId="overview-retry"
      />
    )
  }

  return (
    <div>
      {/* 🎨 שני ה-KPI עוברים דרך `StatTile` (תווית מעל ערך) ולא דרך רצועת-הכותרת שהמוקאפ
          מצייר — `src/CLAUDE.md` מחייב את הרכיב, וכרטיס-הדיילת של המודול הזה כבר בנוי כך.
          מותר לי להכריע כאן כי מסך 1 אושר בהאצלה מפורשת ("נותן לך להחליט על זה").
          ⚠️ והם יושבים **בתוך הלשונית** ולא מעליה: הם מתארים את מבט-העל בלבד, ורצועה
          מעל שורת-הלשוניות הייתה נקראת כאילו היא מתארת גם את מאגר-הדיילות. */}
      <div className="flex flex-wrap gap-3 pb-3">
        <StatTile
          label="אירועים חסרים"
          value={
            <span className={kpis.missingEvents > 0 ? 'text-red-600' : ''}>
              {kpis.missingEvents}
            </span>
          }
          sub={
            kpis.missingWithinFinalDay > 0
              ? `מתוכם ${kpis.missingWithinFinalDay} בתוך 24 שעות`
              : 'אף אחד מהם אינו בתוך 24 שעות'
          }
          testId="overview-kpi-missing"
        />
        <StatTile
          label="זימונים ממתינים"
          // 🐞 **`String(...)` ולא מספר — נתפס בצילום-מסך, לא בבדיקה: `StatTile` מעביר
          // ערך **מספרי** דרך `Money` אוטומטית**, והאריח הציג `0 ₪` על ספירת זימונים.
          // הרכיב מתנהג כמתועד (`src/CLAUDE.md`); המלכודת היא שרוב האריחים במערכת אכן
          // מציגים כסף, ולכן ברירת-המחדל שלו נכונה — ומונה הוא החריג שחייב לומר זאת.
          value={String(kpis.pendingInvites)}
          // ⚠️ "מתוכם" ולא "ובנוסף" — פג-התוקף הוא **תת-קבוצה** של הממתינים
          // (`screens-approved.md:464`), וזו גם הסיבה שהמספר העליון אינו סכום של השניים.
          sub={
            kpis.expiredInvites > 0
              ? `מתוכם ${kpis.expiredInvites} פג תוקפם`
              : 'אף קישור לא פג תוקף'
          }
          testId="overview-kpi-pending"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-3">
        {Object.entries(FILTERS).map(([key, label]) => (
          <FilterPill
            key={key}
            on={filter === key}
            onClick={() => setFilter(key)}
            testId={`overview-filter-${key}`}
          >
            {label}
          </FilterPill>
        ))}

        <span className="mr-auto text-[12px] text-slate-400">
          ממוין: חסרים תחילה, לפי קרבת האירוע
        </span>

        {/* 🔴 מכובה כש-N=0 ולא נעלם (כרטיס §①) — ובלי חלון-אישור, במכוון: *"אפס שיקול
            דעת — הקישורים מתו, רענון לא יכול להזיק, ואי-מענה ממילא מחוץ לציון"*. */}
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            disabled={resendableCount === 0 || sending}
            onClick={() => resend(resendableRows, '')}
            className="h-auto rounded-lg border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            data-testid="overview-resend-all"
          >
            {`שלח שוב למי שפג תוקפן (${resendableCount})`}
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState filtered={filter !== 'all'} onClear={() => setFilter('all')} />
      ) : (
        <table className="w-full border-collapse" data-testid="overview-table">
          <thead>
            <tr>
              <Th>אירוע</Th>
              <Th>מתי</Th>
              <Th>מיקום</Th>
              <Th>איוש</Th>
              <Th>מצב הזימונים</Th>
              {canEdit && <Th>פעולה</Th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <OverviewRow
                key={row.project.project_id}
                row={row}
                today={today}
                canEdit={canEdit}
                sending={sending}
                onOpen={() => onOpenSmartMatch?.(row.project.project_id)}
                onResend={() => resend([row], ` — ${row.project.event_name}`)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// 🔴 שלושת תנאי-הכיבוי של "שלח שוב", והם של כרטיס מסך 4 §⑤/§⑧③ ולא המצאה מקומית:
// ‏① אין בכלל קישור מת · ② האירוע בתוך T-24 (הקישור מת 24 שעות לפני האירוע — רענון
// היה שולח מייל שהדיילת תלחץ עליו ותקבל "המשרה כבר אוישה") · ③ האירוע כבר אויש.
function canResend(row) {
  return row.counts.expired > 0 && !row.isFinalDay && row.isMissing
}

function OverviewRow({ row, today, canEdit, sending, onOpen, onResend }) {
  const { project, counts, required, staffed, gap, isMissing, isFinalDay, showsFinalDayAlert } = row
  const filled = required > 0 ? Math.min(100, Math.round((staffed / required) * 100)) : 0

  return (
    <tr
      onClick={onOpen}
      className={`cursor-pointer ${showsFinalDayAlert ? 'bg-red-50' : isMissing ? '' : 'bg-slate-50 text-slate-500'}`}
      data-testid={`overview-row-${project.project_id}`}
    >
      <Td>
        <div className="font-semibold text-slate-800">
          {/* ⚠ נדלק על **חוסר** בתוך T-24, לא על קרבה (כרטיס §④): אירוע מלא שמתקיים מחר
              אינו דורש ממנה דבר, וסימון עליו מלמד להתעלם מהסימן. */}
          {showsFinalDayAlert && (
            <span className="ml-1.5 text-red-600" title="חסר איוש, והאירוע בתוך 24 שעות">
              ⚠
            </span>
          )}
          {project.event_name}
        </div>
        <div className="mt-0.5 text-[11.5px] text-slate-500">{project.customer_name}</div>
      </Td>

      <Td>
        <div className="text-[13px]">{formatDate(project.final_event_date, '—')}</div>
        <div
          className={`mt-0.5 text-[11.5px] ${isFinalDay ? 'font-semibold text-red-600' : 'text-slate-400'}`}
        >
          {eventProximityLabel(project.final_event_date, today)}
          {isFinalDay ? ' · בתוך 24 שעות' : ''}
        </div>
      </Td>

      <Td>{project.final_location || '—'}</Td>

      <Td>
        <div className="flex items-center gap-2">
          <span className="block h-[7px] w-[78px] overflow-hidden rounded-full bg-slate-200">
            <span
              className={`block h-full ${showsFinalDayAlert ? 'bg-red-600' : 'bg-green-700'}`}
              style={{ width: `${filled}%` }}
            />
          </span>
          {/* בידוד-כיווניות: `3/4` בתוך תא עברי מתהפך ל-`4/3` בלי זה — אותה משפחה
              בדיוק כמו ה-₪ ב-`Money` (המופע השביעי והשמיני, `src/CLAUDE.md`). */}
          <b className="text-[13px]" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {staffed}/{required}
          </b>
        </div>
        {gap > 0 && (
          <span className="text-[11.5px] font-semibold text-red-600">
            {gap === 1 ? 'חסרה 1' : `חסרות ${gap}`}
          </span>
        )}
      </Td>

      <Td>
        <div className="flex items-start gap-2.5">
          <Counter n={counts.finallyApproved} label="אושרו סופית" tone="text-green-700" />
          <Counter n={counts.confirmedAvailable} label="אישרו זמינות" tone="text-teal-700">
            {/* 🔴 טקסט ולא כפתור — אישור דורש לבחור *מי*, וזו החלטה ששייכת למסך שיש בו
                המידע להחליט. הצבתו ככפתור כאן הייתה מזמינה אישור עיוור. */}
            {counts.confirmedAvailable > 0 && isMissing && (
              <span className="block text-[10px] font-semibold text-teal-700">מחכות לאישורך</span>
            )}
          </Counter>
          <Counter n={counts.declined} label="סירבו" tone="text-slate-400" />
          <Counter n={counts.pending} label="ממתינות" tone="text-amber-700">
            {counts.expired > 0 && (
              <span className="block text-[10px] font-semibold text-red-600 underline">
                {counts.expired === 1 ? '1 פג תוקף' : `${counts.expired} פג תוקפן`}
              </span>
            )}
          </Counter>
        </div>
      </Td>

      {canEdit && (
        <Td>
          {/* 🔴 בתוך T-24 הכפתור אינו "מכובה" אלא **מוחלף בניתוב** — הקישור מת, והפעולה
              שנשארה היא טלפון, שחי במסך השיבוץ (`אושרה סופית — סוכם בטלפון`).
              כך גם מצויר במוקאפ: השורה הקריטית נושאת `לשיבוץ →` ולא כפתור-שליחה. */}
          {isFinalDay ? (
            <span className="whitespace-nowrap text-[12.5px] font-semibold text-teal-700">
              לשיבוץ →
            </span>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={!canResend(row) || sending}
              onClick={(e) => {
                e.stopPropagation() // שורה לחיצה — בלי זה כל לחיצה על הכפתור גם מנווטת
                onResend()
              }}
              className="h-auto whitespace-nowrap rounded-lg border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              data-testid={`overview-resend-${project.project_id}`}
            >
              {`שלח שוב (${counts.expired})`}
            </Button>
          )}
        </Td>
      )}
    </tr>
  )
}

function Counter({ n, label, tone, children }) {
  return (
    <span className="min-w-[46px] text-center">
      <span className={`block text-[15px] font-bold leading-tight ${tone}`}>{n}</span>
      <span className="block text-[10.5px] text-slate-500">{label}</span>
      {children}
    </span>
  )
}

// 🔴 שתי הודעות שונות, וזו לא קוסמטיקה (כרטיס §⑥): **"אין אירועים" הוא בשורה טובה**
// ולכן מנוסח בחיוב, בעוד "ריק אחרי סינון" חייב להציע ניקוי. הודעה אחת לשניהם הייתה
// גורמת למנהלת לחשוב שהמסך נשבר דווקא ברגע שהכול מאויש.
function EmptyState({ filtered, onClear }) {
  if (filtered) {
    return (
      <div
        className="py-6 text-center text-[12.5px] text-slate-500"
        data-testid="overview-empty-filtered"
      >
        <span className="mb-1 block text-[22px]">🔍</span>
        אין אירועים התואמים לסינון
        <div>
          <Button
            type="button"
            variant="link"
            onClick={onClear}
            className="mt-2 h-auto p-0 text-xs font-semibold text-teal-700"
            data-testid="overview-clear-filters"
          >
            נקה סינון
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="py-6 text-center text-[12.5px] text-slate-500"
      data-testid="overview-empty-true"
    >
      <span className="mb-1 block text-[22px]">✅</span>
      אין כרגע אירועים הממתינים לאיוש
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold text-slate-500">
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="border-b border-slate-100 px-2.5 py-2.5 align-middle">{children}</td>
}
