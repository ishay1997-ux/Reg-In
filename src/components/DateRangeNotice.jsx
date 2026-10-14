// הסבר מתחת לשדות טווח-תאריכים כש"מ" מאוחר מ"עד" (ביקורת-ולידציה שורה 26, 14/10/2026).
// ענבר ולא אדום: אין כאן שגיאת-שמירה — רק הסבר למה הרשימה ריקה. הכלל ב-`src/lib/dates.js`.
import { invertedDateRangeMessage } from '@/lib/dates'

export default function DateRangeNotice({
  from,
  to,
  testId = 'date-range-notice',
  className = '',
}) {
  const text = invertedDateRangeMessage(from, to)
  if (!text) return null
  return (
    <p
      className={`text-xs font-semibold text-amber-700 ${className}`}
      role="status"
      data-testid={testId}
    >
      {text}
    </p>
  )
}
