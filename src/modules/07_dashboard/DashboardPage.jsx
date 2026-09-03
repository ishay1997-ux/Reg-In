// מסך-הבית (מודול 7) — RPC יחיד (`getDashboardSummary`, api.js), ואפס לוגיקה-עסקית כאן
// (כלל 14): כל צבע/מיון/משפט חי ב-src/lib/dashboard.js, והרכיב הזה רק מרכיב את המסך ומחזיק
// state-תצוגה. "היום"/"החודש הנוכחי" מגיעים תמיד מה-RPC (`summary.today`/`summary.month_start`)
// — לעולם לא `new Date()` כאן (react-hooks/purity + מוקש-השעון של src/CLAUDE.md).
//
// החודש-המוצג חי בכתובת (`?month=YYYY-MM-01`, S-18 — תואם ProjectsPage) כדי ש"חזור" ישחזר
// אותו; החיפוש וצ'יפי-הצבע של הלוח הם "איך המסך נראה עכשיו" ונשארים state מקומי ב-CalendarGrid.
// בזמן ריענון-חודש (‹/›/היום) הנתונים הקודמים נשארים על המסך (עמעום עדין), כדי שלא תהיה הבהוב
// שלד-מלא בכל לחיצה — שלד-עמוד-מלא שמור לטעינה הראשונה בלבד.

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { cn } from '@/lib/utils'
import { kpiCards, shiftMonth, missingDashboardParamsMessage } from '@/lib/dashboard'
import KpiStrip from './KpiStrip'
import CalendarGrid from './CalendarGrid'
import AttentionPanel from './AttentionPanel'
import { getDashboardSummary, DASHBOARD_SHAPE_DRIFT_CODE } from './api'

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get('month')

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)

  // "האם זו הטעינה הראשונה" — ref ולא state נגזר-מ-summary, כדי שלא נצטרך לקרוא summary
  // בתוך התלויות של ה-effect (זה היה מריץ אותו מחדש בכל setSummary, כולל אחרי החלפת-חודש).
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (hasLoadedRef.current) setRefreshing(true)
    else setLoading(true)
    ;(async () => {
      try {
        const data = await getDashboardSummary(monthParam ?? null)
        if (cancelled) return
        setSummary(data)
        setError(null)
        hasLoadedRef.current = true
      } catch (err) {
        if (!cancelled) {
          console.error('dashboard summary load failed:', err)
          setError(toScreenError(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [monthParam, reloadTick])

  function refresh() {
    setReloadTick((t) => t + 1)
  }

  function setMonth(newMonthStartIso) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newMonthStartIso) next.set('month', newMonthStartIso)
        else next.delete('month')
        return next
      },
      { replace: true },
    )
  }

  // הבאנר נגזר ב-src/lib/dashboard.js (כלל 14) — כאן רק מציגים אותו. '' ⇒ אין באנר.
  const missingParams = missingDashboardParamsMessage(summary)

  // עוגן-הניווט: פרמטר-הכתובת אם קיים, אחרת החודש שה-RPC כבר בחר (summary.month_start) —
  // לעולם לא new Date() מקומי (ר' הערת-הכותרת).
  const monthStartIso = monthParam ?? summary?.month_start ?? null

  function handlePrev() {
    setMonth(shiftMonth(monthStartIso, -1))
  }
  function handleNext() {
    setMonth(shiftMonth(monthStartIso, 1))
  }
  function handleToday() {
    // מוחקים את הפרמטר כדי שה-RPC יבחר "החודש הנוכחי" לפי השעון שלו — לא מחשבים כאן.
    setMonth(null)
  }

  if (loading) {
    return (
      <div data-testid="dashboard-page">
        <PageHeader />
        <LoadingOrError loading skeleton={{ variant: 'page' }} />
      </div>
    )
  }

  // ① חוסר-הרשאה — **הענף הראשון תמיד**, בדיוק כמו ב-FinancePage. מיזוגו לתוך "תקלה" היה
  // מסתיר חסימת-הרשאה מאחורי "נסי שוב" שלעולם לא יעזור.
  if (error?.kind === 'noPermission') {
    return (
      <div data-testid="dashboard-page">
        <PageHeader />
        <PermissionAwareEmpty
          state="noPermission"
          title={NO_PERMISSION_SENTENCE}
          testId="dashboard-no-permission"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="dashboard-page">
        <PageHeader />
        <PermissionAwareEmpty
          state="error"
          detail={error.detail ?? undefined}
          onRetry={refresh}
          testId="dashboard-error"
        />
      </div>
    )
  }

  return (
    <div data-testid="dashboard-page">
      <PageHeader />
      {/* אזהרת פרמטר-מערכת חסר. 🔴 הסגנון ו-role מועתקים **בייט-בבייט** מהבאנר של QuotesPage
          (שהעתיק בעצמו מ-CustomerFormDialog) — מעבר-אחידות של src/CLAUDE.md, לא גוון חדש. */}
      {missingParams && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 mb-4"
          role="alert"
          data-testid="dashboard-missing-params"
        >
          {missingParams}
        </p>
      )}
      <KpiStrip cards={kpiCards(summary)} />
      {/* 🔴 **04/09/2026 — הלוח מלא-רוחב, והרצועה מתחתיו (מוקאפ מאושר).** קודם היה
          `grid-cols-[2fr_1fr]`, כלומר שליש מהמסך הוקצע לרשימה — והלוח, שהוא הגיבור של
          המסך, נשאר עם תאים בני ~90px שחתכו את שם-האירוע. `flex-col` ולא grid: אין כאן
          יותר שתי עמודות, רק שני בלוקים אחד מתחת לשני. */}
      <div
        className={cn('flex flex-col gap-4', refreshing && 'opacity-60 transition-opacity')}
        aria-busy={refreshing}
      >
        <CalendarGrid
          summary={summary}
          monthStartIso={monthStartIso}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
        <AttentionPanel summary={summary} />
      </div>
    </div>
  )
}

function PageHeader() {
  return <h1 className="mb-4 text-lg font-bold text-slate-800">מסך הבית</h1>
}

const NO_PERMISSION_SENTENCE = 'אין לך הרשאה לצפות במסך הבית.'

// 🔒 הודעות-מסד ידועות ⇒ **נוסח משלנו**, לעולם לא המחרוזת הגולמית. אותה תבנית בדיוק כמו
// `SERVER_MESSAGE_RULES`/`quoteServerErrorMessage` ב-`src/lib/quotes.js`, ומאותו נימוק שכתוב שם:
// מחרוזת-מסד שלא מופתה עלולה לשאת ערכי-enum, שמות-עמודות, אנגלית — או **מזהה פנימי**, שאינו
// מוצג במסך בפרויקט הזה (§7.34). שתי הודעות-ה-`P0001` של `finance_project_money` נוקבות במספר
// הפרויקט; המשפט כאן אומר את אותו דבר בלי המספר, ומפנה למקום שבו מתקנים.
// ⚠️ **תואם-קדימה בכוונה:** `P0001` חדש שיתווסף למסלול-הקריאה הזה **לא** ידלוף למסך — הוא פשוט
// לא יימצא ברשימה ויקבל את המסך הכללי. זו בדיוק הסיבה שהמיפוי הוא לפי תחילית ולא לפי קוד.
const SERVER_MESSAGE_RULES = [
  {
    prefix: 'לא ניתן לחשב כספים לפרויקט',
    text: 'החודש המוצג כולל פרויקט שאי-אפשר לחשב לו כספים — אין לו הצעת מחיר מקושרת, או שההצעה ריקה. יש להשלים אותה במסך הפרויקטים.',
  },
]

function serverMessage(raw) {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return null
  return SERVER_MESSAGE_RULES.find((rule) => text.startsWith(rule.prefix))?.text ?? null
}

// 🔴 **מיון-הכשלים (03/09/2026, אודיט-הסגירה T-2).** לפני זה כל כשל — חסימת-הרשאה, פרויקט
// בלי הצעת-מחיר, דריפט-צורה ונפילת-רשת — הוצג כאותו משפט אחד עם "נסי שוב", והנוסח העברי
// שהמערכת **כבר כתבה** מת ב-console. שלושה ענפים, אותה חלוקה כמו FinancePage:
// · `42501` — מסך אחר, **בלי כפתור** (הוא לא יעזור לעולם), **ובלי הודעת-השרת.**
//   🔴 **וזה תוקן בסריקה-חוזרת של סבב-התיקון עצמו:** הגרסה הראשונה הציגה כאן את
//   `err.cause.message`, בהנחה שכל `42501` הוא ה-raise העברי של `assert_module_permission`.
//   ‏**הוא לא:** `42501` הוא `insufficient_privilege` הכללי של Postgres, ו-`revoke` בלי `grant`
//   או טוקן שפג מחזירים `permission denied for function get_dashboard_summary` — **באנגלית**,
//   היישר לכותרת המסך. המשפט הנעול נכון לכל המקרים ואינו יכול לדלוף. (התקדים: `FinancePage`
//   מעביר `{kind:'noPermission'}` בלי `detail` כלל.)
// · הודעה מוכרת מהמסד ⇒ **הנוסח שלנו** דרך `serverMessage` (ר' ההערה מעליה). לא מוכרת ⇒ הכללי.
// · שער-הצורה — מסומן ב-`DASHBOARD_SHAPE_DRIFT_CODE`, וההודעה שלה עצמה היא הפירוט: היא נטבעה
//   בקוד שלנו, בעברית, ונוקבת בשם-השדה. זה הדבר היחיד שמסביר למה מסך שעבד אתמול לא עובד היום.
// · כל השאר — נפילת-רשת וכד'. **בלי פירוט בכוונה:** `Failed to fetch` באנגלית טכנית אינו מידע
//   למשתמשת, והמסך הגנרי + "נסי שוב" הוא בדיוק התשובה הנכונה שם.
function toScreenError(err) {
  if (err?.code === '42501') return { kind: 'noPermission' }
  const mapped = serverMessage(err?.cause?.message)
  if (mapped) return { kind: 'error', detail: mapped }
  if (err?.code === DASHBOARD_SHAPE_DRIFT_CODE && err?.message) {
    return { kind: 'error', detail: err.message }
  }
  return { kind: 'error' }
}
