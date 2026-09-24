// "להזמין לחודש הקרוב" — ליטושי-הכנס, חבילה 0ג פריט 4 (24/09/2026).
//
// 🔑 **למה כאן:** דוח "צריכת ציוד" (מ12) אומר *"להזמין 2,540…"* — ומי שמזמינה, מנהלת הלוגיסטיקה,
// חסומה על כל לשוניות הדוחות. המשימה שלה (פעם בשבוע) מקבלת בית במסך שלה, מתחת לתור.
// ‏**אותו חישוב בדיוק** — ‏`logistics_upcoming_orders` קורא לפונקציה שמ12 קורא לה (כלל-ברזל 14).
//
// 🔴 **מצב-טעינה משלו, ותלת-ערכי** (`CLAUDE.md` §4.3): `null` = בטעינה · שגיאה ⇒ שורה + "נסי שוב",
// **לעולם לא "אין מה להזמין"** · `[]` = באמת אין · שורות = הטבלה. כשל כאן **אינו מפיל את התור** —
// ולכן הקריאה אינה בתוך ה-`Promise.all` של המסך.

import { useCallback, useEffect, useState } from 'react'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import { formatDate } from '@/lib/dates'
import { getUpcomingOrders } from './api'

const TITLE = 'להזמין לחודש הקרוב'
const EMPTY_SENTENCE = 'אין ציוד להזמין לאירועים של החודש הקרוב.'

export default function UpcomingOrders() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await getUpcomingOrders()
        if (cancelled) return
        setData(next)
        setError('')
      } catch (err) {
        if (cancelled) return
        console.error('upcoming orders load failed:', err)
        setError(err?.message || 'שגיאה בטעינת רשימת ההזמנה.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tick])

  const retry = useCallback(() => {
    setError('')
    setData(null)
    setTick((t) => t + 1)
  }, [])

  return (
    <section
      className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="upcoming-orders-title"
      data-testid="logistics-upcoming-orders"
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 id="upcoming-orders-title" className="text-lg font-bold text-slate-800">
          {TITLE}
        </h2>
        {data && (
          <span className="text-sm text-slate-500" data-testid="logistics-upcoming-orders-range">
            <Ltr>
              {formatDate(data.from)}–{formatDate(data.to)}
            </Ltr>
          </span>
        )}
      </div>
      <Body data={data} error={error} onRetry={retry} />
    </section>
  )
}

function Body({ data, error, onRetry }) {
  if (error) return <LoadingOrError error={error} onRetry={onRetry} />
  if (!data) return <LoadingOrError loading skeleton={{ variant: 'table', rows: 3, cols: 3 }} />
  if (data.rows.length === 0) {
    return (
      <p
        className="px-4 py-6 text-center text-sm text-slate-500"
        data-testid="logistics-upcoming-orders-empty"
      >
        {EMPTY_SENTENCE}
      </p>
    )
  }
  return (
    <table className="mt-2 w-full border-collapse" data-testid="logistics-upcoming-orders-table">
      <caption className="sr-only">{TITLE}</caption>
      <thead>
        <tr>
          <HeadCell className="w-[60%]">פריט</HeadCell>
          <HeadCell>כמות</HeadCell>
          <HeadCell>אירועים</HeadCell>
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row) => (
          <tr key={row.sku} data-testid="logistics-upcoming-orders-row">
            <td className="border-b border-slate-100 px-2.5 py-2 text-sm text-slate-800">
              {row.item_name}
            </td>
            <td className="border-b border-slate-100 px-2.5 py-2 text-sm font-semibold text-slate-800">
              <Ltr>{Number(row.qty).toLocaleString('he-IL')}</Ltr>
            </td>
            <td className="border-b border-slate-100 px-2.5 py-2 text-sm text-slate-600">
              <Ltr>{String(row.events)}</Ltr>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HeadCell({ children, className }) {
  return (
    <th
      scope="col"
      className={`border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold text-slate-500 ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
