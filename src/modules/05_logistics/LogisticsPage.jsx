// משטח 1 של מודול 5 — תור-העבודה של מנהלת הלוגיסטיקה (`/logistics`), ובראשו סעיף-היציאה.
// 🔴 **מסך קריאה בלבד, לכל התפקידים.** אפס `INSERT`/`UPDATE`/`DELETE`/RPC-כותב (כרטיס-המסך §⑨),
// ולכן **אין כאן ולו שורת-לוגיקת-הרשאה אחת**: המסך של `view` זהה-בייט למסך של `edit` (§⑤),
// וההבדל היחיד חי בתוך דיאלוג-הצ'קליסט (משטח 2). כל הכתיבה של המודול יושבת שם.
//
// 🔴 **הענף הראשון הוא חוסר-הרשאה, וזו תכונת-אבטחה ולא נוחות-UX** (AR-3 · כרטיס §④/§⑨):
// ל-`logistics` יש RLS פעיל, וקריאה שנחסמה מחזירה **אפס שורות עם `error: null`** — זהה-בייט
// ל"התור ריק". ⇒ המסך אינו נכשל, הוא **משקר**. המבחין הזמין הוא שני השערים (`projects` מול
// `logistics`), והוא נעול ב-`resolveQueueBranch`; כאן רק מציירים את התוצאה. **אפס שורות
// לוגיסטיקה ⇒ משפט-חוסר-ההרשאה ומונים `—`, לעולם לא "התור ריק כדין".**
//
// 🔴 **אפס נוסחאות בקובץ הזה** (כלל 14): כל מונה, מיון, סף ומשפט מגיע מ-`src/lib/projectLogistics.js`
// ומ-`src/lib/projects.js`. הקומפוננטה מרנדרת בלבד — כולל שורות-הנימוק, שחוזרות כ**חלקים**
// (`{prefix, value, suffix, tone}`) ולעולם לא כמחרוזת שטוחה: מספר בתוך עברית בלי בידוד נוחת
// בצד הלא-נכון (`src/CLAUDE.md §🔤`, תשעה מופעים מדודים).
//
// 🔴 **אין כפתור-פעולה ראשי, וזו הכרעה ולא השמטה** (כרטיס §①): שורות-הלוגיסטיקה נולדות
// אוטומטית מאישור הצעת-המחיר (`🔄א`), והיא **אינה מוסיפה · מוחקת · ולא עורכת פריטים**.
// *"+ פריט חדש"* כאן היה כפתור משקר. הפעולה של המסך היא פתיחת שורה.

import { useCallback, useEffect, useMemo, useState } from 'react'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty, { DENIED_MARK } from '@/components/PermissionAwareEmpty'
import StatusTag from '@/components/StatusTag'
import FilterPill from '@/components/FilterPill'
import Ltr from '@/components/Ltr'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate, weekdayOf } from '@/lib/dates'
import { businessDaysUntil } from '@/lib/projectChanges'
import {
  PROJECT_STATUS_LABELS,
  resolveProjectTone,
  logisticsMetric,
  eventDaysFromToday,
  proximitySentence,
  filteredOutSentence,
} from '@/lib/projects'
import {
  QUEUE_NO_PERMISSION_SENTENCE,
  QUEUE_SORT_LINE,
  EMPTY_OUTBOUND_SENTENCE,
  queueBaseProjects,
  queuePillCounts,
  filterQueueByPill,
  sortQueueProjects,
  outboundMembership,
  amberMark,
  queueReason,
  outboundReason,
  lateArrivalReason,
  resolveQueueBranch,
} from '@/lib/projectLogistics'
import ChecklistDialog from './ChecklistDialog'
import { listActiveProjects, listLogisticsRows, listProducts } from './api'

// שלוש גלולות בדיוק (㉙), בשמן ובסדר שהמוקאפ מצייר. 🚫 **ואין גלולה רביעית** — ובפרט אין
// `בוטלו`: פרויקט מבוטל אינו פעיל ⇒ אינו מגיע למשטח הזה בשום מסנן (כרטיס §①).
const PILLS = [
  { key: 'needsAction', label: 'דורש טיפול' },
  { key: 'awaitingDelivery', label: 'ממתין למשלוח' },
  { key: 'all', label: 'הכול' },
]

const DEFAULT_PILL = 'needsAction'

// טוני שורת-הנימוק — תרגום 1:1 של מחלקות המוקאפ (`.miss`/`.hint`/`.done`/`.calm`), זהה
// למפה של מבט-העל במ6: המילה נושאת את המשמעות, הצבע רק מדגיש.
const REASON_TONES = {
  miss: 'text-red-600 text-[11.5px] font-semibold',
  hint: 'text-amber-700 text-[11px] font-semibold',
  done: 'text-slate-500 text-[11.5px]',
  calm: 'text-slate-400 text-[11.5px]',
}

// ── המחרוזות שמקורן המוקאפ המאושר (S-3 · S-2, מדריך-המיקרו §3.7) ─────────────
// 🚫 מועתקות בייט-בבייט ואינן מנוסחות מחדש. הן יושבות כאן ולא ב-`src/lib` מאותו טעם
// ש-`SORT_LINE` של מבט-העל במ6 יושב בקומפוננטה שלו: זהו טקסט של משטח יחיד.
const OUTBOUND_LEGEND = 'הסעיף מיידע בלבד — אין כאן סימון "יצא" ואין מה לשמור.'
const AMBER_GLYPH_TITLE = 'פריט פיזי טרם הוזמן, והאירוע בתוך 10 ימי עסקים'
const DISABLED_PILL_TITLE = 'אין כרגע פרויקט במצב הזה'
const FILTERED_EMPTY_TITLE = 'אין פרויקט התואם למסנן שבחרת.'
const CLEAR_FILTER_LABEL = 'נקי סינון'
// בנוי על `לכרטיס →` של המבט-על המאושר במ6 (אותה צורה: מילת-יעד + חץ), ו"צ'קליסט" הוא
// שמו המאושר של משטח 2. כמחרוזת ולא כטקסט-JSX — הגרש שבתוכה אינו עובר ישות-HTML בשקט.
const CHECKLIST_LINK_LABEL = "לצ'קליסט →"

// "היום" בשעון **ישראל**, לא ב-UTC.
// 🔴 סטייה מודעת מ-`todayIso` של מבט-העל במ6 (`new Date().toISOString()`), והעוגן הוא
// `jerusalemParts` שב-`src/lib/projectLogistics.js`: בין חצות ל-03:00 בישראל ה-UTC עדיין
// **באתמול**, וכל חלונות-הזמן של המסך הזה (⑳ סף-הענבר · ㉓ חלון-היציאה) היו זזים יום שלם.
// במסך שכל תוכנו הוא *"מה יוצא היום"* זה אינו ניואנס.
function todayIso() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const at = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${at('year')}-${at('month')}-${at('day')}`
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = String(isoDate).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  return new Date(Date.UTC(year, month - 1, day) + days * 86_400_000).toISOString().slice(0, 10)
}

// יום-העסקים הבא לשורת-ההסבר של הסעיף. 🔴 **נגזר מ-`businessDaysUntil` ולא מלוח-שנה שני** —
// ㉓ מורה מפורשות *"אין להמציא חישוב שני"*: המועמד הראשון שהמרחק אליו הוא בדיוק יום-עסקים
// אחד. כלל סוף-השבוע נשאר כולו אצל הפונקציה המשותפת; כאן רק חשבון-ימים.
function nextBusinessDayIso(today) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDaysIso(today, offset)
    if (candidate && businessDaysUntil(today, candidate) === 1) return candidate
  }
  return null
}

// `DD/MM` לשורת-ההסבר. 🔴 **נגזר מ-`formatDate` הנעולה ולא מפרסר שני:** `dayMonthOf` כבר
// קיימת ב-`src/lib/projectLogistics.js` אך **אינה מיוצאת**, וייצואה היא שינוי-`src/lib`
// שאינו בבעלות הצעד הזה (מדווח). חיתוך של הפורמט הנעול משאיר מקור-אמת אחד לפענוח —
// ‏`formatDate` כבר דוחה קלט שאינו `YYYY-MM-DD` ומחזירה מחרוזת ריקה.
function dayMonth(isoDate) {
  return formatDate(isoDate).slice(0, 5)
}

// שורת-הנימוק של שורת-התור. 🔴 **הטריגר השני של ㊶ (נוסח O-1) כותב את השורה רק כשלא נשאר
// מה להזמין:** *"ההגעה מתעכבת"* הוא ניסוח חד יותר של *"N יחידות עדיין בדרך"*, אבל הוא
// **לעולם לא מסתיר את *"טרם הוזמנו"*** — זו העבודה שהיא באה לעשות, וגלולת ברירת-המחדל
// בנויה עליה. פרויקט עם פריט שטרם הוזמן *וגם* משלוח מאחר יראה קודם את מה שדורש ממנה פעולה.
function pickQueueReason(rows, amber) {
  const stillUnordered = rows.some((row) => row.item_status === 'not_started')
  if (!stillUnordered && amber.triggers.includes('lateArrival')) {
    const late = lateArrivalReason(amber.lateRow?.expected_arrival_date)
    if (late) return late
  }
  return queueReason(rows)
}

export default function LogisticsPage() {
  const [data, setData] = useState({ projects: [], rows: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [today, setToday] = useState(todayIso)
  const [reloadTick, setReloadTick] = useState(0)
  // מצב-הגלולה חי בקומפוננטה ולא בכתובת — **וזו סטייה מנומקת ממ6, לא פספוס.** שם
  // (`S-18`) המצב עבר לכתובת כי לחיצה על שורה **מנווטת** לכרטיס-הפרויקט וה"חזור" היה מוחק
  // את הלשונית; כאן משטח 2 הוא **דיאלוג ואינו ראוט** (㉔ — *"התור נשאר גלוי מאחור"*), המסך
  // לעולם אינו נעזב-וחוזר, ולכן אין מה לשחזר. חזרה למסך מתחילה בברירת-המחדל, וזה נכון:
  // ‏`דורש טיפול` **היא** מה שהיא באה לעשות.
  const [pill, setPill] = useState(DEFAULT_PILL)
  const [openProjectId, setOpenProjectId] = useState(null)

  // רענון שקט — בלי שלד. מצב ⑧ של הכרטיס: הדיאלוג נסגר, **התור מתרענן**, ופרויקט שהפריט
  // האחרון בו סומן `מוכן` יוצא מגלולת ברירת-המחדל. 🚫 אין הודעת-הצלחה צפה — התוצאה על המסך
  // היא הערוץ. הבהוב-שלד בכל סגירת-דיאלוג היה רועש בדיוק במקום שבו השינוי אמור להיקרא בשקט.
  const refetch = useCallback(() => setReloadTick((tick) => tick + 1), [])

  // ניסיון-חוזר אחרי תקלה — כאן כן עם שלד, כי המסך ריק ואין מה לשמר.
  const retry = useCallback(() => {
    setLoading(true)
    setReloadTick((tick) => tick + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // שלוש קריאות ישירות (AR-3), בלי RPC-קריאה חדש. שורות-הלוגיסטיקה תלויות ברשימת
        // הפרויקטים ⇒ סדרתי; הקטלוג עצמאי ⇒ במקביל.
        const projects = await listActiveProjects()
        const [rows, products] = await Promise.all([
          listLogisticsRows(projects.map((project) => project.project_id)),
          listProducts(),
        ])
        if (cancelled) return
        setData({ projects, rows, products })
        setToday(todayIso())
        setFailed(false)
      } catch (err) {
        // 🔴 כשל-טעינה לעולם אינו "התור ריק" (מצב ②). ‏`err.message` אינו מגיע למסך — כשל-רשת
        // חוזר כ-"TypeError: Failed to fetch" באנגלית טכנית; הכותרת הנעולה בעברית, הפרטים לקונסול.
        if (!cancelled) {
          console.error('logistics queue load failed:', err)
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  const branch = useMemo(() => resolveQueueBranch(data.projects, data.rows), [data])
  const base = useMemo(() => queueBaseProjects(data.projects, data.rows), [data])
  const counts = useMemo(() => queuePillCounts(base), [base])
  const visible = useMemo(
    () => sortQueueProjects(filterQueueByPill(base, pill), today),
    [base, pill, today],
  )
  // סעיף-היציאה אינו מושפע מהגלולה — הוא סעיף קבוע בראש המשטח (⑦), ונגזר מכל הבסיס.
  const outbound = useMemo(
    () =>
      sortQueueProjects(
        base.filter((entry) =>
          outboundMembership(entry.project.final_event_date, today, businessDaysUntil),
        ),
        today,
      ),
    [base, today],
  )

  const openChecklist = useCallback((projectId) => setOpenProjectId(projectId), [])

  // סגירת הדיאלוג = ביטול-הרכבה. 🔑 **וזה מה שמקיים את ㊲**: הדיאלוג קורא את סטטוס-הפרויקט
  // ואת שורותיו **מחדש בכל פתיחה** ולעולם אינו סומך על שורת-התור ששיגרה אותו — מסלול-הכניסה
  // היחיד לווריאנט-המבוטל. רכיב שנשאר מורכב היה יכול להציג דאטה של פתיחה קודמת.
  const closeChecklist = useCallback(
    (next) => {
      if (next) return
      setOpenProjectId(null)
      refetch()
    },
    [refetch],
  )

  if (loading) {
    return (
      <div data-testid="logistics-page">
        <PageHeader today={today} />
        <Card>
          <LoadingOrError loading skeleton={{ variant: 'table', rows: 5, cols: 6 }} />
        </Card>
      </div>
    )
  }

  if (failed) {
    // מצב ② — תקלת-טעינה. 🔴 **הכותרת הנעולה לבדה, בלי שורת-פירוט** (המלצה ③ שאושרה,
    // כרטיס §⑧-5): ‏`LOAD_FAILURE_DETAIL` מדבר על *"הלוגיסטיקה של **הפרויקט**"* ואינו מתאים
    // לתור, ונוסח רביעי היה המצאה. ‏`PermissionAwareEmpty` ולא `LoadingOrError` כי שתי
    // המחרוזות שהכרטיס נועל — `ERROR_TITLE` ו-`נסי שוב` — חיות שם, מקודדות-קשיח בלשון-נקבה.
    return (
      <div data-testid="logistics-page">
        <PageHeader today={today} />
        <Card>
          <PermissionAwareEmpty state="error" onRetry={retry} testId="logistics-error" />
        </Card>
      </div>
    )
  }

  if (branch === 'noPermission') {
    // מצב ① — **הענף הראשון תמיד.** הגלולות נשארות על המסך עם `—` במקום מונה (‏`DENIED_MARK`):
    // ‏`0` נקרא כעובדה, `—` נקרא כ"אין לי את הנתון".
    // 🚫 **וסעיף-היציאה אינו מצויר כאן:** כל תוכנו נגזר משורות-הלוגיסטיקה, ו*"אין אירוע שיוצא
    // עד יום העסקים הבא"* על קריאה חסומה הוא **בדיוק אותו שקר שקט** שהענף הזה קיים כדי למנוע.
    // (‏S-7 מחייבת שהסעיף לא ייעלם כשהוא **ריק כדין** — לא כשהנתונים אינם קריאים.)
    return (
      <div data-testid="logistics-page">
        <PageHeader today={today} />
        <Card>
          <PillsBar counts={null} pill={pill} onSelect={setPill} />
          <PermissionAwareEmpty
            state="noPermission"
            title={QUEUE_NO_PERMISSION_SENTENCE}
            detail={
              <>
                המונים מציגים <Ltr>{DENIED_MARK}</Ltr>, לא <Ltr>0</Ltr>.
              </>
            }
            testId="logistics-no-permission"
          />
        </Card>
      </div>
    )
  }

  return (
    <div data-testid="logistics-page">
      <PageHeader today={today} />
      <OutboundSection entries={outbound} today={today} onOpen={openChecklist} />
      <Card>
        <PillsBar counts={counts} pill={pill} onSelect={setPill} />
        {visible.length === 0 ? (
          // מצב ③ — ריק אחרי גלולה. הפעולה הנכונה **הפוכה ממצב ②** (ניקוי-סינון, לא
          // ניסיון-חוזר) ⇒ 🚫 אסור לאחד ביניהם. המונה בשורה השנייה **חי**, לא מועתק.
          <PermissionAwareEmpty
            state="empty"
            title={FILTERED_EMPTY_TITLE}
            detail={filteredOutSentence(base.length)}
            action={
              <Button
                type="button"
                variant="link"
                // 🔴 **מעביר לגלולת `הכול`, ולא ל"ברירת-המחדל" כלשון כרטיס §①** — וזו סתירה
                // שנפתרה ולא הוכרעה מחדש: גלולה עם מונה `0` **מושבתת** (㉚) ⇒ המצב הזה נגיש
                // אך ורק כשברירת-המחדל עצמה ריקה, והחזרה אליה הייתה הופכת את הכפתור
                // ל-no-op בדיוק במצב היחיד שבו הוא מוצג. התקדים המוזג עושה בדיוק את זה
                // (`ProjectsPage.jsx` — `onClear` מעביר ל-`all`). מדווח לישי.
                onClick={() => setPill('all')}
                className="h-auto p-0 text-[12.5px] font-semibold text-teal-700"
                data-testid="logistics-clear-filter"
              >
                {CLEAR_FILTER_LABEL}
              </Button>
            }
            testId="logistics-empty-filtered"
          />
        ) : (
          <>
            <QueueTable
              entries={visible}
              products={data.products}
              today={today}
              onOpen={openChecklist}
            />
            <AmberLegend />
          </>
        )}
      </Card>
      {/* משטח 2 הוא **דיאלוג ואינו ראוט** (㉔) — התור נשאר גלוי מאחוריו. הדיאלוג שולף את
          הדאטה של עצמו בפתיחה (㊲) ואינו מקבל אותה מכאן. */}
      {openProjectId !== null && (
        <ChecklistDialog
          projectId={openProjectId}
          open
          onOpenChange={closeChecklist}
          // שמירת-סגירה שנחתה אחרי הרענון של closeChecklist מיישרת את התור מחדש (ממצא 26/08)
          onSaveSettledAfterClose={refetch}
        />
      )}
    </div>
  )
}

function PageHeader({ today }) {
  // תת-הכותרת אינה קישוט: **מסך שמראה "מחר" בלי להצהיר מה ה"היום" שלו אינו ניתן לבדיקה**
  // (`data-set.md`). התאריך **חי מהשעון** — המוקאפ מצויר על חמישי 27/08/2026, שהוא ה"היום"
  // של הציור ולא ערך שמועתק.
  return (
    <div className="mb-4">
      <h1 className="text-lg font-bold text-slate-800">לוגיסטיקה</h1>
      <div className="mt-0.5 text-[12px] text-slate-500" data-testid="logistics-today">
        היום: <Ltr>{formatDate(today)}</Ltr> · יום {weekdayOf(today)}
      </div>
    </div>
  )
}

function Card({ children }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
}

// `counts === null` = הענף החסום: מונה `—` וגלולה מושבתת **בלי נימוק**, כי *"אין כרגע
// פרויקט במצב הזה"* היה טענה על דאטה שאיננו רשאים לקרוא.
function PillsBar({ counts, pill, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      {PILLS.map(({ key, label }) => {
        const count = counts ? counts[key] : null
        const blocked = counts === null
        return (
          <FilterPill
            key={key}
            on={pill === key}
            // ㉚ — גלולת-0 **נשארת על המסך, מושבתת ומנומקת**, לעולם אינה נעלמת.
            disabled={blocked || count === 0}
            title={!blocked && count === 0 ? DISABLED_PILL_TITLE : undefined}
            onClick={() => onSelect(key)}
            testId={`logistics-pill-${key}`}
          >
            {label}
            <Ltr className="mr-1.5 font-semibold opacity-70">
              {blocked ? DENIED_MARK : String(count)}
            </Ltr>
          </FilterPill>
        )
      })}
      {/* כיתוב-מיון, לא פקד (תקדים מ4/מ6): אין מיון-בלחיצה-על-כותרת ואין מימד-מיון שני —
          הגלולה כבר עשתה את מה ש"חסרים תחילה" עושה שם. */}
      <span className="mr-auto text-[12px] text-slate-400">{QUEUE_SORT_LINE}</span>
    </div>
  )
}

function OutboundSection({ entries, today, onOpen }) {
  const next = nextBusinessDayIso(today)
  return (
    <section
      className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="logistics-outbound"
    >
      <h2 className="text-lg font-bold text-slate-800">יוצא עד יום העסקים הבא</h2>
      <p className="mt-1 mb-3 text-[12px] leading-[1.7] text-slate-500">
        החלון: מהיום ועד יום העסקים הבא בכלל. היום <Ltr>{dayMonth(today)}</Ltr> — יום{' '}
        {weekdayOf(today)}, ושישי ושבת אינם ימי עבודה ⇒ יום העסקים הבא הוא {weekdayOf(next)}{' '}
        <Ltr>{dayMonth(next)}</Ltr>.
      </p>
      {entries.length === 0 ? (
        // מצב ⑥ — **הסעיף נשאר על המסך** (S-7). סעיף שנעלם מלמד אותה שהוא לא תמיד שם,
        // ואז היא תפסיק לסמוך עליו — וזה הרוב המוחלט של הימים.
        <p
          className="px-4 py-6 text-center text-[12.5px] text-slate-500"
          data-testid="logistics-outbound-empty"
        >
          {EMPTY_OUTBOUND_SENTENCE}
        </p>
      ) : (
        <table className="w-full border-collapse" data-testid="logistics-outbound-table">
          <thead>
            <tr>
              <Th className="w-[52%]">האירוע</Th>
              <Th className="w-[26%]">מתי</Th>
              <Th className="w-[22%]">מוכנות</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <OutboundRow
                key={entry.project.project_id}
                entry={entry}
                today={today}
                onOpen={onOpen}
              />
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-2.5 text-[11.5px] leading-[1.8] text-slate-500">{OUTBOUND_LEGEND}</div>
    </section>
  )
}

function OutboundRow({ entry, today, onOpen }) {
  const { project, rows } = entry
  const metric = logisticsMetric(rows)
  const reason = outboundReason(rows, project.final_event_date, today)
  const days = eventDaysFromToday(project.final_event_date, today)

  return (
    <ClickableRow
      project={project}
      onOpen={onOpen}
      testId={`logistics-outbound-row-${project.project_id}`}
    >
      <Td>
        <div className="font-semibold text-slate-800">{project.event_name}</div>
        <div className="mt-0.5 text-[11.5px] text-slate-500">{project.customer_name}</div>
        {/* ⑳ צובע **רקע-שורה**; הסעיף צובע **טקסט בלבד** (כרטיס §⑧-12) — כך שני הענברים
            שבמסך אינם נקראים כאותו סימון. */}
        <ReasonLine reason={reason} className="mt-[3px] block" />
      </Td>
      <Td>
        <Ltr className="text-[13px]">{formatDate(project.final_event_date, '—')}</Ltr>
        <span className="mt-0.5 block text-[11.5px] text-slate-400">
          {proximitySentence(days)} · {weekdayOf(project.final_event_date)}
        </span>
      </Td>
      <Td>
        <ReadinessCell metric={metric} />
      </Td>
    </ClickableRow>
  )
}

function QueueTable({ entries, products, today, onOpen }) {
  return (
    <table className="w-full border-collapse" data-testid="logistics-queue-table">
      <thead>
        <tr>
          <Th className="w-[26%]">אירוע</Th>
          <Th className="w-[16%]">מתי</Th>
          {/* 📛 `מוכנות` ולא `התקדמות` (AS-7, הכרעת 22/08): זהו אותו מספר בדיוק ואותה
              פונקציה (`logisticsMetric`) שהסעיף שלמעלה מציג ⇒ שם אחד. שני שמות לאותו נתון
              באותו מסך נקראים כשני מדדים שונים. */}
          <Th className="w-[13%]">מוכנות</Th>
          <Th className="w-[12%]">מצב</Th>
          <Th className="w-[24%]">מה חסר</Th>
          <Th className="w-[9%]" />
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <QueueRow
            key={entry.project.project_id}
            entry={entry}
            products={products}
            today={today}
            onOpen={onOpen}
          />
        ))}
      </tbody>
    </table>
  )
}

function QueueRow({ entry, products, today, onOpen }) {
  const { project, rows } = entry
  const metric = logisticsMetric(rows)
  const amber = amberMark(rows, products, project.final_event_date, today, businessDaysUntil)
  const reason = pickQueueReason(rows, amber)
  const days = eventDaysFromToday(project.final_event_date, today)
  const label = PROJECT_STATUS_LABELS[project.project_status]
  // הטריגר של ⑳ הוא זה שהכיתוב מסביר. כשהשורה בענבר בגלל **איחור-הגעה** בלבד (הטריגר השני
  // של ㊶) — הכיתוב הזה היה שקרי, ושורת-הנימוק כבר אומרת במילים מה קרה ⇒ אין `title`.
  const glyphTitle = amber.triggers.includes('physicalNotStarted') ? AMBER_GLYPH_TITLE : undefined

  return (
    <ClickableRow
      project={project}
      onOpen={onOpen}
      amber={amber.amber}
      testId={`logistics-row-${project.project_id}`}
    >
      <Td>
        <div className="font-semibold text-slate-800">
          {amber.amber && (
            <span
              className="ml-1.5 text-amber-700"
              title={glyphTitle}
              aria-hidden={glyphTitle ? undefined : 'true'}
            >
              ⏱
            </span>
          )}
          {project.event_name}
        </div>
        <div className="mt-0.5 text-[11.5px] text-slate-500">{project.customer_name}</div>
      </Td>
      <Td>
        <Ltr className="text-[13px]">{formatDate(project.final_event_date, '—')}</Ltr>
        <span className="mt-0.5 block text-[11.5px] text-slate-400">{proximitySentence(days)}</span>
        {glyphTitle && amber.businessDays !== null && (
          <span className="block text-[11px] font-semibold text-amber-700">
            <Ltr>{String(amber.businessDays)}</Ltr> ימי עסקים
          </span>
        )}
      </Td>
      <Td>
        <ReadinessCell metric={metric} />
      </Td>
      <Td>
        {/* ㉘ — תווית-**פרויקט** בעמודת "מצב", ומצבי-הפריטים חיים **רק** בתוך המדד המספרי.
            "טרם החל" היא אותה מחרוזת בדיוק בשתי המשמעויות, וההפרדה היא בפריסה ולא בניסוח
            ⇒ 🚫 אין ואסור שיהיה תג מצב-פריט על שורת-הפרויקט. */}
        <StatusTag label={label} tone={resolveProjectTone(label)} />
      </Td>
      <Td>
        <ReasonLine reason={reason} />
      </Td>
      <Td>
        {/* אפורדנס גלוי לכך שהשורה נפתחת — אותה פעולה בדיוק. `stopPropagation` כדי שלא
            תירה פעמיים. 🚫 אינו `<Link>`: משטח 2 הוא דיאלוג ואין לו כתובת. */}
        <Button
          type="button"
          variant="link"
          onClick={(event) => {
            event.stopPropagation()
            onOpen(project.project_id)
          }}
          className="h-auto p-0 text-[12.5px] font-semibold whitespace-nowrap text-teal-700"
          data-testid={`logistics-checklist-${project.project_id}`}
        >
          {CHECKLIST_LINK_LABEL}
        </Button>
      </Td>
    </ClickableRow>
  )
}

// ⌨️ שורה לחיצה חייבת נגישות-מקלדת משלה — התבנית של `ProjectsPage`/`OverviewTab`, שכל
// מסך-טבלה בונה מחדש ולכן כל מסך יכול לשכוח בנפרד. כאן היא מרוכזת לשתי הטבלאות, כי ㊷
// קובעת ששורות סעיף-היציאה לחיצות בדיוק כמו שורות התור.
function ClickableRow({ project, onOpen, amber, children, testId }) {
  const open = () => onOpen(project.project_id)
  return (
    <tr
      onClick={open}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
      aria-label={`${project.event_name} — לצ'קליסט`}
      className={cn(
        'cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset focus-visible:outline-none',
        // ⑳ — רקע ענבר, **ולעולם לא אדום**: אדום במערכת אומר "חסום", וזה בדיוק מה שהסימון
        // הזה אינו. שורה מסומנת אינה מקבלת גם רמז-ריחוף, כדי שהצבע יישאר חד-משמעי.
        amber ? 'bg-amber-50' : 'hover:bg-slate-50',
      )}
      data-testid={testId}
    >
      {children}
    </tr>
  )
}

function ReadinessCell({ metric }) {
  // שני מספרים ברצף אינם מבודדים — **מפרקים** אותם במילה עברית ביניהם (`src/CLAUDE.md`,
  // המופע התשיעי): `<Ltr>` על כל ערך בנפרד, לעולם לא על "1 מתוך 4" כמחרוזת אחת.
  return (
    <span className="text-[13.5px] font-bold text-slate-800">
      <Ltr>{String(metric.ready)}</Ltr> מתוך <Ltr>{String(metric.total)}</Ltr>
    </span>
  )
}

function ReasonLine({ reason, className }) {
  // "לא בכוח": אין נימוק ⇒ אין שורה. שורת-נימוק ריקה או "0 יחידות בדרך" היו שקר קטן על המסך.
  if (!reason) return null
  return (
    <span className={cn(REASON_TONES[reason.tone], className)}>
      {reason.prefix}
      {reason.value != null && <Ltr>{reason.value}</Ltr>}
      {reason.suffix}
    </span>
  )
}

// המקרא הוא מה שהופך את הצבע ללימוד במקום לחידה — בלעדיו השאלה *"למה השורה הזאת צהובה?"*
// נשאלת מול המסך, בכנס. פסוקית-הטריגר-השני נוספה בהכרעת-ישי Q1 ("מאשר לפי המלצתך",
// 26/08/2026 13:0X) — ההכרעה ㊶ שלו יצרה סיבת-ענבר שהמקרא המצויר לא הכיר, והגליף נשאר
// אחיד על שתי הסיבות.
function AmberLegend() {
  return (
    <div className="mt-2.5 text-[11.5px] leading-[1.8] text-slate-500">
      <span className="font-bold text-amber-700">⏱ שורה בענבר</span> — פריט פיזי טרם הוזמן, והאירוע
      בתוך <Ltr>10</Ltr> ימי עסקים — או: משלוח שתאריכו המובטח עבר וטרם הגיע. סימון מיידע בלבד: אפשר
      להתעלם ממנו, ואף פקד אינו ננעל. הקמת אתר רישום (<Ltr>01WEB</Ltr>) אינה נספרת — הסף נגזר מזמן
      ייצור של דפוס.
    </div>
  )
}

function Th({ children, className }) {
  return (
    <th
      className={cn(
        'border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold whitespace-nowrap text-slate-500',
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="border-b border-slate-100 px-2.5 py-2.5 align-middle">{children}</td>
}
