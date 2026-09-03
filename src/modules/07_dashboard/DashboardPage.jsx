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
import { cn } from '@/lib/utils'
import { kpiCards, shiftMonth } from '@/lib/dashboard'
import KpiStrip from './KpiStrip'
import CalendarGrid from './CalendarGrid'
import AttentionPanel from './AttentionPanel'
import { getDashboardSummary } from './api'

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
          // 🔴 כשל-טעינה: המשפט הנעול בעברית בלבד; הפרטים הטכניים (err.message) לקונסול בלבד
          // (התבנית של ProjectsPage — err.message מגיע לפעמים באנגלית טכנית).
          console.error('dashboard summary load failed:', err)
          setError('מסך הבית לא נטען.')
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

  if (error) {
    return (
      <div data-testid="dashboard-page">
        <PageHeader />
        <LoadingOrError error={error} onRetry={refresh} retryTestId="dashboard-retry" />
      </div>
    )
  }

  return (
    <div data-testid="dashboard-page">
      <PageHeader />
      <KpiStrip cards={kpiCards(summary)} />
      <div
        className={cn(
          'grid grid-cols-[2fr_1fr] gap-4',
          refreshing && 'opacity-60 transition-opacity',
        )}
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
