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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  releaseAssignment,
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
  // 🆕 חלון-ההשבתה-עם-שיבוצים-עתידיים הוא תלת-ברירה (שחרר / השבת-ותשלים / ביטול), ו-`useConfirm`
  // הוא דו-ברירתי בלבד (Provider משותף לכל האפליקציה — לא משנים את הצורה שלו בשביל מסך אחד).
  // ⇒ דיאלוג ייעודי מקומי, על אותם primitives (`components/ui/dialog`), רק כאן.
  const [deactivateChoice, setDeactivateChoice] = useState(null) // null | {hostess, futureActive}
  const [releasing, setReleasing] = useState(false)

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
  //
  // ✅ **§7.33 נסגר ב-3.5 — השחרור בנוי ופעיל בקוד (`releaseAssignment`, `api.js`), עם מייל-ביטול
  // אמיתי.** עד עכשיו החלון הזה עדיין אמר "יתווסף בהמשך" ולא הציע אותו כלל — תוקן כאן: שתי
  // האפשרויות מוצגות כפעולות אמיתיות, ו"שחרר מהאירועים" היא המומלצת (§א4 + המוקאפ המאושר, `.copt.rec`).
  function toggleStatus(row) {
    const { hostess, futureActive } = row

    if (hostess.status !== 'active') {
      activate(hostess)
      return
    }

    if (futureActive.length > 0) {
      setDeactivateChoice({ hostess, futureActive })
      return
    }

    applyDeactivate(hostess, { release: false })
  }

  async function applyDeactivate(hostess, { release, futureActive = [] }) {
    setReleasing(true)
    try {
      if (release && futureActive.length > 0) {
        const results = await Promise.allSettled(
          futureActive.map((a) =>
            releaseAssignment({
              project_id: a.projectId,
              hostess_id: a.hostessId,
              assignment_number: a.assignmentNumber,
              hostesses: hostess,
              projects: { event_name: a.eventName },
            }),
          ),
        )
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
          toast.error(
            `שחרור מ-${failed.length} מתוך ${futureActive.length} אירועים נכשל — ${hostess.full_name} עדיין משובצת אליהם. נסי לשחרר ידנית מתפריט-הפעולות במסך שיבוץ חכם.`,
          )
        }

        // 🆕 **12/08/2026 — שחרור שהצליח אך ההודעה עליו לא יצאה נאמר בקול.**
        // חלון-ההשבתה מבטיח למנהלת *"והדיילת תקבל מייל-ביטול על כל אירוע"*; עד האודיט
        // `Promise.allSettled` ספר כל שחרור שהסתדר כהצלחה מלאה, **גם כשאף מייל לא יצא** —
        // הפונקציה פשוט לא החזירה את זה לאף אחד. עכשיו היא מחזירה, וזה מדווח.
        const mail = results.reduce(
          (acc, r) => {
            const m = r.status === 'fulfilled' ? r.value?.mail : null
            if (!m) return acc
            return {
              unknown: acc.unknown + m.unknown,
              failed: acc.failed + m.failed,
            }
          },
          { unknown: 0, failed: 0 },
        )
        if (mail.failed > 0 || mail.unknown > 0) {
          const parts = []
          if (mail.failed > 0) parts.push(`${mail.failed} לא נשלחו`)
          if (mail.unknown > 0) parts.push(`${mail.unknown} — לא ידוע אם יצאו`)
          toast.error(
            `${hostess.full_name} שוחררה, אך הודעות-הביטול: ${parts.join(' · ')}. כדאי ליידע אותה טלפונית.`,
          )
        }
      }

      await setHostessStatus(hostess.hostess_id, 'inactive')
      toast.success(
        release ? `${hostess.full_name} שוחררה מהאירועים והושבתה` : `${hostess.full_name} הושבתה`,
      )
      setDeactivateChoice(null)
      refresh()
    } catch (err) {
      toast.error(err.message ?? 'שינוי סטטוס הדיילת נכשל.')
    } finally {
      setReleasing(false)
    }
  }

  async function activate(hostess) {
    try {
      await setHostessStatus(hostess.hostess_id, 'active')
      toast.success(`${hostess.full_name} הופעלה`)
      refresh()
    } catch (err) {
      toast.error(err.message ?? 'שינוי סטטוס הדיילת נכשל.')
    }
  }

  // שלד-טבלה, כפי שהאפיון קובע (`screens-approved.md:625`).
  if (loading) return <LoadingOrError loading skeleton={{ variant: 'table', rows: 6, cols: 6 }} />
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
            aria-label="סינון לפי עיר"
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
                onClick={() => onOpenCard(hostess.hostess_id)}
                // ⌨️ אותו דפוס בדיוק כמו `CustomersPage` (תיקון 11/07 שם) — שורה שלמה לחיצה,
                // לא רק השם: לחיצה בכל מקום פותחת את כרטיס הדיילת. ‏Enter/רווח עושים אותו דבר.
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpenCard(hostess.hostess_id)
                  }
                }}
                aria-label={`פתח כרטיס דיילת: ${hostess.full_name}`}
                className={`cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 ${hostess.status === 'active' ? '' : 'bg-slate-50'}`}
                data-testid={`repository-row-${hostess.hostess_id}`}
              >
                <Td>
                  <span
                    className={`font-semibold hover:text-teal-700 hover:underline ${
                      hostess.status === 'active' ? 'text-slate-800' : 'text-slate-500'
                    }`}
                    data-testid={`repository-name-${hostess.hostess_id}`}
                  >
                    {hostess.full_name}
                  </span>
                  {streak && (
                    <span className="block text-[10.5px] text-amber-700">{streak.label}</span>
                  )}
                </Td>
                <Td>{hostess.city}</Td>
                <Td>
                  {/* בידוד-כיווניות תואם למוקאפ המאושר (`.num{direction:ltr;unicode-bidi:isolate}`,
                      חל על ארבע העמודות המספריות בשורה) — `dir` לבדו אינו מספיק בתא עצמאי. */}
                  <span className="inline-block" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
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
                  <span className="inline-block" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                    {quarterEvents}
                  </span>
                </Td>
                {canEdit && (
                  // stopPropagation: פקדי-פעולה תוך-שורה (עריכה/מתג) לא פותחים את כרטיס-הדיילת
                  <Td onClick={(e) => e.stopPropagation()}>
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

      <Dialog
        open={deactivateChoice != null}
        onOpenChange={(next) => !next && !releasing && setDeactivateChoice(null)}
      >
        <DialogContent dir="rtl" className="sm:max-w-md" data-testid="deactivate-dialog">
          {deactivateChoice && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {deactivateChoice.hostess.full_name} משובצת ל-
                  {deactivateChoice.futureActive.length}{' '}
                  {deactivateChoice.futureActive.length === 1 ? 'אירוע עתידי' : 'אירועים עתידיים'}
                </DialogTitle>
                <DialogDescription>
                  {/* ⚠️ צמתים ולא מחרוזת עם `\n` — `DialogDescription` מרנדר פסקה אחת, ושורות-חדשות
                      בתוכה נבלעות. `span.block` ולא `div` — `<div>` בתוך `<p>` הוא HTML לא-תקין. */}
                  {deactivateChoice.futureActive.map((a) => (
                    <span key={a.projectId} className="block font-semibold text-slate-700">
                      • {a.eventName} · {formatDate(a.eventDate)} · {a.statusLabel}
                    </span>
                  ))}
                  <span className="mt-2 block">
                    <b>שחרר מהאירועים (מומלץ)</b> — כל שיבוץ יסומן כ"שוחררה" והדיילת תקבל מייל-ביטול
                    על כל אירוע. האירוע חוזר לחסר-איוש, וזה נספר כשחרור-שלנו — לא לרעתה.
                  </span>
                  <span className="mt-2 block">
                    <b>השבת — תשלים את מה שהתחייבה</b> — השיבוצים העתידיים נשארים על כנם; היא רק
                    מפסיקה לקבל הזמנות חדשות.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2 sm:flex-col">
                <Button
                  type="button"
                  disabled={releasing}
                  onClick={() =>
                    applyDeactivate(deactivateChoice.hostess, {
                      release: true,
                      futureActive: deactivateChoice.futureActive,
                    })
                  }
                  className="h-auto w-full py-2.5 px-4 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700"
                  data-testid="deactivate-release"
                >
                  {releasing ? 'משחרר...' : 'שחרר מהאירועים'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={releasing}
                  onClick={() => applyDeactivate(deactivateChoice.hostess, { release: false })}
                  className="h-auto w-full py-2.5 px-4 rounded-lg border-slate-300 text-slate-700"
                  data-testid="deactivate-keep"
                >
                  השבת — תשלים את מה שהתחייבה
                </Button>
                <Button
                  type="button"
                  variant="link"
                  disabled={releasing}
                  onClick={() => setDeactivateChoice(null)}
                  className="h-auto w-full py-1 text-slate-500"
                  data-testid="deactivate-cancel"
                >
                  ביטול
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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

function Td({ children, onClick }) {
  return (
    <td className="border-b border-slate-100 px-2.5 py-2.5 align-middle" onClick={onClick}>
      {children}
    </td>
  )
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
