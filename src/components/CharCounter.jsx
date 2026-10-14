// מונה-תווים לשדה טקסט חופשי עם תקרה (ביקורת-ולידציה שורות 19/20/28, 14/10/2026).
// מוצג רק מ-80% מהתקרה — שדה ריק או קצר אינו צריך מונה, ורעש קבוע מתחת לכל שדה מסיח.
// התקרה עצמה נאכפת ב-`maxLength` של השדה; המונה רק אומר כמה נשאר. ‏`aria-live` — כדי שקורא-מסך
// ישמע את ההתקרבות לתקרה ולא רק יגלה שהקלדה הפסיקה לעבוד.
const COUNTER_VISIBLE_FROM = 0.8

export default function CharCounter({ value, max, testId }) {
  const length = String(value ?? '').length
  if (!max || length < max * COUNTER_VISIBLE_FROM) return null
  return (
    <p
      className={`mt-1 text-xs ${length >= max ? 'font-semibold text-amber-700' : 'text-slate-500'}`}
      aria-live="polite"
      data-testid={testId}
    >
      <span dir="ltr">
        {length}/{max}
      </span>
    </p>
  )
}
