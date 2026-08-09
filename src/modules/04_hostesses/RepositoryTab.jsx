// משטח 3 · מאגר הדיילות — הטבלה שממנה נפתחות ההוספה (3ב), העריכה (3ג) והצפייה (3ד).
// נבנה לפי המוקאפ המאושר `docs/mockups/hostesses-screen/approved/03_repository_approved.html`.
//
// 🔑 **ההחלטה האחת שהמסך משרת** (`screens-approved.md` מסך 3 §①):
// *"איזו דיילת אני פותחת עכשיו — ומה מצבה, לפני שאני נוגעת בה."*
// ⇒ זה מסך **איתור-אדם ופעולה עליו**, לא מסך השוואה. ההשוואה בין דיילות קורית
// ב-Smart Match, שם היא מחושבת. **כל תוספת שמשרתת השוואה שייכת לשם, לא לכאן.**
//
// 🚫 **אין מחיקה בשום מקום** — המתג הוא השבתה/הפעלה, הפיך משני הכיוונים, וההיסטוריה
// נשארת מחוברת (§א4; וכך גם TempWorks/Ubeya). אייקון פח-אשפה היה **משקר** על מה
// שהכפתור עושה, ולכן הוחלף במתג-מצב — סטייה באייקון בלבד, לא בהתנהגות (C5 §5.6.12).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmDialog'
import LoadingOrError from '@/components/LoadingOrError'
import FilterPill from '@/components/FilterPill'
import StatusTag from '@/components/StatusTag'
import RatingStars from '@/components/RatingStars'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  hostessDisplayState,
  unansweredStreakTag,
  eventsInLastQuarter,
  futureActiveAssignments,
  optionalNumber,
} from '@/lib/hostesses'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { formatDate } from '@/lib/dates'
import {
  listHostesses,
  listRepositoryAssignments,
  getHostessScreenParams,
  setHostessStatus,
} from './api'

// סנטינל ל-Select: Radix זורק על `value=""`, וזו התבנית שכבר בשימוש במודול 3.
const ALL_CITIES = '__all__'

// תאריך-היום כמחרוזת ISO. ⚠️ מחושב **פעם אחת בטעינה ומועבר כ-prop** ולא נקרא בתוך
// render — `react-hooks/purity` הוא שגיאה קשיחה בקונפיג הזה, וגם לוגית: תאריך שמשתנה
// באמצע רינדור היה מייצר שורות שמסכימות זו עם זו רק לפעמים.
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function RepositoryTab({ onOpenCard, onEdit, onAdd, reloadKey }) {
  const { permissions } = useAuth()
  const canEdit = permissions['דיילות'] === 'edit'
  const toast = useToast()
  const confirm = useConfirm()

  const [hostesses, setHostesses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [today, setToday] = useState(todayIso)

  const [search, setSearch] = useState('')
  const [city, setCity] = useState(ALL_CITIES)
  const [activeOnly, setActiveOnly] = useState(true) // דלוק כברירת-מחדל, כמצויר
  const [unansweredOnly, setUnansweredOnly] = useState(false)

  // ⚠️ הטעינה חיה **בתוך** ה-effect ומעדכנת state רק אחרי `await` — זו התבנית של
  // `CustomersPage`, והיא נדרשת: `react-hooks/set-state-in-effect` הוא **שגיאה קשיחה**
  // בקונפיג הזה, וקריאה סינכרונית ל-setState בגוף ה-effect נחסמת.
  const [reloadTick, setReloadTick] = useState(0)
  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rows, assignmentRows, paramRows] = await Promise.all([
          listHostesses(),
          listRepositoryAssignments(),
          getHostessScreenParams(),
        ])
        if (cancelled) return
        setHostesses(rows)
        setAssignments(assignmentRows)
        setParams(paramRows)
        setToday(todayIso())
        setError(null)
      } catch (err) {
        // 🔴 **שגיאה מוצגת כשגיאה, לעולם לא כטבלה ריקה בשקט.** זו המלכודת המרכזית של
        // הפרויקט: טבלה עם RLS ובלי policy מתאימה מחזירה `{data:null, error:null}`,
        // והמנהלת מסיקה שהמאגר נמחק. החצי הזה הוא של המסך — המסד אינו יכול לאותת אותו.
        if (!cancelled) setError(err.message ?? 'לא הצלחנו לטעון את המאגר')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey, reloadTick])

  const unansweredThreshold = optionalNumber(params[SMART_MATCH_PARAM_NAMES.unansweredStreak])

  // כל הנגזרות מחושבות פעם אחת לכל דיילת, ולא בתוך ה-render של כל תא.
  const rows = useMemo(() => {
    const byHostess = new Map()
    for (const row of assignments) {
      const list = byHostess.get(row.hostess_id) ?? []
      list.push(row)
      byHostess.set(row.hostess_id, list)
    }

    return hostesses.map((hostess) => {
      const mine = byHostess.get(hostess.hostess_id) ?? []
      return {
        hostess,
        state: hostessDisplayState(hostess, hostess.hostess_unavailability, today),
        streak: unansweredStreakTag(mine, unansweredThreshold),
        quarterEvents: eventsInLastQuarter(mine, today),
        futureActive: futureActiveAssignments(mine, today),
      }
    })
  }, [hostesses, assignments, today, unansweredThreshold])

  const cities = useMemo(
    () =>
      [...new Set(hostesses.map((h) => h.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [hostesses],
  )

  // 🔴 החיפוש על **שם וטלפון בלבד** (כרטיס §⑦): לא ת"ז (אינה מוצגת ממילא, וזו PII)
  // ולא כתובת (מייצרת תוצאות מבלבלות — "תל אביב" היה מחזיר חצי מהמאגר).
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter(({ hostess, streak }) => {
      if (activeOnly && hostess.status !== 'active') return false
      if (city !== ALL_CITIES && hostess.city !== city) return false
      if (unansweredOnly && !streak?.isChip) return false
      if (!needle) return true
      return (
        String(hostess.full_name ?? '')
          .toLowerCase()
          .includes(needle) ||
        String(hostess.phone ?? '')
          .toLowerCase()
          .includes(needle)
      )
    })
  }, [rows, search, city, activeOnly, unansweredOnly])

  const unansweredCount = useMemo(() => rows.filter((r) => r.streak?.isChip).length, [rows])
  const filtersTouched =
    search.trim() !== '' || city !== ALL_CITIES || !activeOnly || unansweredOnly

  function clearFilters() {
    setSearch('')
    setCity(ALL_CITIES)
    setActiveOnly(true)
    setUnansweredOnly(false)
  }

  // השבתה/הפעלה. 🔴 **תלוי-מצב, וזו התנהגות כבר-מוכרעת שהמוקאפ המקורי החמיץ** (§א4):
  // בלי שיבוץ עתידי פעיל — מתהפך מיד, אפס שיקול-דעת. **עם** שיבוץ כזה — חלון שמונה
  // אותם **בשם ובתאריך**, כי שתי האפשרויות לגיטימיות והמנהלת היא שמכריעה ביניהן.
  async function toggleStatus(row) {
    const { hostess, futureActive } = row
    const goingInactive = hostess.status === 'active'

    if (goingInactive && futureActive.length > 0) {
      const count = futureActive.length
      // ⚠️ **צמתים ולא מחרוזת עם `\n`** — `DialogDescription` מרנדר פסקה אחת, ושורות-חדשות
      // בתוכה נבלעות. נתפס בעין על החלון הבנוי: הרשימה והפסקה נדבקו לגוש טקסט אחד.
      // ‏`span.block` ולא `div` — ‏`<div>` בתוך `<p>` הוא HTML לא-תקין.
      const list = (
        <>
          {futureActive.map((a) => (
            <span key={a.projectId} className="block font-semibold text-slate-700">
              • {a.eventName} · {formatDate(a.eventDate)} · {a.statusLabel}
            </span>
          ))}
        </>
      )

      // 🔴 **§א4 מציע שתי אפשרויות, ורק אחת מהן ניתנת לביצוע היום — והחלון אומר זאת
      // במפורש במקום להסתיר.** "שחרר אותה מהאירועים" גורר את תהליך-השחרור המלא (מייל
      // הביטול · החזרת הפרויקט ל"בתהליך"), ו**מנגנון-הכתיבה שלו הוא §7.33 שעדיין פתוח**
      // ⇒ הוא נבנה בצעד 3.5. 🚫 להציג כפתור "שחרר" שרק משנה סטטוס היה משקר למנהלת:
      // האירוע היה נשאר מאויש-לכאורה, ואיש לא היה שם לב עד יום האירוע — בדיוק התרחיש
      // שהאזהרה ב-§א4 קיימת בשבילו.
      const proceed = await confirm({
        title: `${hostess.full_name} משובצת ל-${count} ${count === 1 ? 'אירוע עתידי' : 'אירועים עתידיים'}`,
        message: (
          <>
            {list}
            <span className="mt-2 block">
              השבתה עכשיו משאירה את השיבוצים האלה על כנם — היא תשלים את מה שהתחייבה אליו, ורק תפסיק
              לקבל הזמנות חדשות.
            </span>
            <span className="mt-2 block text-amber-700">
              שחרור מהאירועים (כולל מייל ביטול) עדיין אינו זמין מהמסך הזה ויתווסף בהמשך — עד אז יש
              לשחרר אותה ידנית מכל אירוע.
            </span>
          </>
        ),
        confirmLabel: 'השבת — תשלים את מה שהתחייבה',
        cancelLabel: 'ביטול',
      })
      if (!proceed) return
    }

    try {
      await setHostessStatus(hostess.hostess_id, goingInactive ? 'inactive' : 'active')
      toast.success(goingInactive ? `${hostess.full_name} הושבתה` : `${hostess.full_name} הופעלה`)
      refresh()
    } catch (err) {
      toast.error(err.message ?? 'שינוי סטטוס הדיילת נכשל.')
    }
  }

  if (loading) return <LoadingOrError loading />
  if (error) {
    return (
      <LoadingOrError
        error={`לא הצלחנו לטעון את המאגר — ${error}`}
        onRetry={refresh}
        retryTestId="repository-retry"
      />
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או טלפון"
          className="min-w-[200px] max-w-[240px] h-auto py-1.5 text-[13px]"
          data-testid="repository-search"
        />

        <Select value={city} onValueChange={setCity}>
          <SelectTrigger
            className="h-auto w-auto py-1.5 text-[12.5px]"
            data-testid="repository-city"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value={ALL_CITIES}>כל הערים</SelectItem>
            {cities.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FilterPill
          on={activeOnly}
          onClick={() => setActiveOnly((v) => !v)}
          testId="repository-active-only"
        >
          פעילות בלבד
        </FilterPill>

        {/* 🎨 ענבר ולא ירוק/אדום: זו לא הצלחה ולא שגיאה אלא **אזהרת-היגיינה** — אותה
            משפחה בדיוק כמו "פג תוקף" במסכים 1 ו-4. */}
        {unansweredThreshold !== null && (
          <FilterPill
            on={unansweredOnly}
            tone="warn"
            onClick={() => setUnansweredOnly((v) => !v)}
            testId="repository-unanswered"
          >
            {`לא ענתה ל-${unansweredThreshold} האחרונים (${unansweredCount})`}
          </FilterPill>
        )}

        <span className="mr-auto" />

        {canEdit && (
          <Button
            type="button"
            onClick={onAdd}
            className="h-auto rounded-lg bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white"
            data-testid="repository-add"
          >
            + הוספת דיילת
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        // 🔴 **שתי הודעות שונות, וזו לא קוסמטיקה** (כרטיס §⑤): "ריק אמיתי" מול "ריק
        // אחרי סינון". הודעה אחת לשניהם גורמת למנהלת לחשוב שהמאגר נמחק.
        <EmptyState
          filtered={filtersTouched}
          canEdit={canEdit}
          onAdd={onAdd}
          onClear={clearFilters}
        />
      ) : (
        <table className="w-full border-collapse" data-testid="repository-table">
          <thead>
            <tr>
              <Th>שם</Th>
              <Th>עיר</Th>
              <Th>טלפון</Th>
              <Th>התרשמות</Th>
              {/* 🔴 עמודת השכר אינה קיימת לתפקיד-צפייה — נתון עלות שאינו רלוונטי לה
                  (מצויר במפורש בפאנל "פעולה חסומה" של המוקאפ המאושר). */}
              {canEdit && <Th>שכר שעתי</Th>}
              <Th>מצב</Th>
              <Th>
                אירועים
                <span className="block text-[10px] font-normal text-slate-400">רבעון אחרון</span>
              </Th>
              {canEdit && <Th>פעולה</Th>}
            </tr>
          </thead>
          <tbody>
            {visible.map(({ hostess, state, streak, quarterEvents, futureActive }) => (
              <tr
                key={hostess.hostess_id}
                className={hostess.status === 'active' ? '' : 'bg-slate-50'}
                data-testid={`repository-row-${hostess.hostess_id}`}
              >
                <Td>
                  <button
                    type="button"
                    onClick={() => onOpenCard(hostess.hostess_id)}
                    className={`h-auto p-0 text-right font-semibold hover:text-teal-700 hover:underline ${
                      hostess.status === 'active' ? 'text-slate-800' : 'text-slate-500'
                    }`}
                    data-testid={`repository-name-${hostess.hostess_id}`}
                  >
                    {hostess.full_name}
                  </button>
                  {streak && (
                    <span className="block text-[10.5px] text-amber-700">{streak.label}</span>
                  )}
                </Td>
                <Td>{hostess.city}</Td>
                <Td>
                  <span className="inline-block" dir="ltr">
                    {hostess.phone}
                  </span>
                </Td>
                <Td>
                  <RatingStars value={hostess.rating} variant="compact" />
                </Td>
                {canEdit && (
                  <Td>
                    <Money amount={Number(hostess.hourly_rate)} />
                  </Td>
                )}
                <Td>
                  <StatusTag
                    label={state.label}
                    tone={state.tone}
                    testId={`repository-state-${hostess.hostess_id}`}
                  />
                  {state.note && (
                    <span className="block text-[10px] text-slate-500">הערה: {state.note}</span>
                  )}
                </Td>
                <Td>
                  <span className="inline-block" dir="ltr">
                    {quarterEvents}
                  </span>
                </Td>
                {canEdit && (
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onEdit(hostess.hostess_id)}
                        title="עריכה"
                        aria-label={`עריכת ${hostess.full_name}`}
                        className="h-7 w-7 rounded-md border-slate-200 p-0 text-slate-600"
                        data-testid={`repository-edit-${hostess.hostess_id}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Switch
                        checked={hostess.status === 'active'}
                        onCheckedChange={() => toggleStatus({ hostess, futureActive })}
                        aria-label={
                          hostess.status === 'active'
                            ? `השבתת ${hostess.full_name}`
                            : `הפעלת ${hostess.full_name}`
                        }
                        data-testid={`repository-toggle-${hostess.hostess_id}`}
                      />
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
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

function EmptyState({ filtered, canEdit, onAdd, onClear }) {
  if (filtered) {
    return (
      <div
        className="py-4 text-center text-[12.5px] text-slate-500"
        data-testid="repository-empty-filtered"
      >
        <span className="mb-1 block text-[22px]">🔍</span>
        לא נמצאו דיילות התואמות לסינון
        <div>
          <Button
            type="button"
            variant="link"
            onClick={onClear}
            className="mt-2 h-auto p-0 text-xs font-semibold text-teal-700"
            data-testid="repository-clear-filters"
          >
            נקה סינון
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="py-4 text-center text-[12.5px] text-slate-500"
      data-testid="repository-empty-true"
    >
      <span className="mb-1 block text-[22px]">🗂️</span>
      עדיין אין דיילות במאגר
      {canEdit && (
        <div>
          <Button
            type="button"
            onClick={onAdd}
            className="mt-2 h-auto rounded-lg bg-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            + הוספת דיילת
          </Button>
        </div>
      )}
    </div>
  )
}
