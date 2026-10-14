// הערה רכה מתחת לשדות ההנחה בבונה-ההצעה (ביקורת-ולידציה שורה 4 + כלל-ההנחה של ישי, 14/10/2026).
// ענבר ולא אדום: היא **מודיעה ולא חוסמת** — הכלל והנוסח ב-`discountNotice` (`src/lib/quotes.js`).
// קובץ משלו ולא פונקציה בתוך QuoteBuilderPage: הדף משותף עם בונה אחר באותו יום, ונגיעה מינימלית בו
// שומרת על מיזוג נקי.
import { discountNotice } from '@/lib/quotes'

export default function DiscountNotice({ applied, manual, threshold }) {
  const text = discountNotice(applied, manual, threshold)
  if (!text) return null
  return (
    <p
      className="mt-1 text-xs font-medium text-amber-700"
      role="status"
      data-testid="quote-discount-notice"
    >
      {text}
    </p>
  )
}
