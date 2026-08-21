// כוכבי-ההתרשמות — הצורה היחידה שבה `hostesses.rating` מוצג או נערך במערכת.
//
// 🔴 **הדבר האחד שהרכיב הזה קיים בשבילו: `null` הוא "טרם התרשמתי", והוא מוצג `—` ולעולם
// לא `3 ★`.** העמודה הייתה `int not null default 3`, כלומר **כל דיילת נולדה עם שלושה
// כוכבים שאיש לא נתן לה** — וזה בדיוק מה שהורג עמודת-דירוג בעולם האמיתי
// (`research §6.2`: ‏Nature 2025 — 85% מהדירוגים 1–5 הם 5★ · `§9.2`: ‏Wonolo ביטלה את
// דירוג-הכוכבים כי המזמינים לא מילאו אותו). המיגרציה הסירה את ברירת-המחדל; **הרכיב הזה
// הוא החצי השני של אותה הכרעה — בלעדיו המסך היה ממציא בחזרה את ה-3.**
//
// 🔤 **והמילה היא "התרשמות", לא "דירוג"** — זו דעת המנהלת ולא פסק-דין של המערכת, ואינה
// רכיב בציון ה-Smart Match. הוכרע ב-`processes-approved.md`, ומצוטט בשלושה כרטיסי-מסך.
//
// שלוש הצורות למטה **נקראו מהמוקאפים המאושרים**, לא הומצאו: הטבלה מציגה `5 ★` דחוס
// (מוקאפ 03), הכרטיס מציג חמישה גליפים (מוקאפ 08), והטופס מציג חמישה גליפים לחיצים
// + `N מתוך 5` (מוקאפים 06/07).

import Ltr from '@/components/Ltr'

const STAR_COUNT = 5
const EMPTY_LABEL = '—'

function Glyphs({ value }) {
  return Array.from({ length: STAR_COUNT }, (_, index) => (
    <span key={index} className={index < value ? 'text-slate-700' : 'text-slate-300'}>
      ★
    </span>
  ))
}

// value: 1–5 או `null`/`undefined` = לא דורגה.
// variant: `glyphs` (ברירת-מחדל, כרטיס-הצפייה) · `compact` (שורת-טבלה).
// onChange: קיים ⇒ הרכיב עריך (טופס). ⚠️ `readOnly` מובלע — אין `onChange`, אין עריכה.
export default function RatingStars({ value, variant = 'glyphs', onChange, testId }) {
  const rating = Number.isFinite(value) ? value : null

  if (onChange) {
    return (
      <div className="flex items-center gap-1 text-[17px]" data-testid={testId}>
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const star = index + 1
          return (
            <button
              key={star}
              type="button"
              // 🔴 לחיצה על הכוכב שכבר נבחר **מנקה** את ההתרשמות בחזרה ל-`null`. בלי זה
              // אין שום דרך לחזור מ"דירגתי" ל"טרם התרשמתי", והעמודה הופכת חד-כיוונית —
              // כלומר טעות אחת של המנהלת נעולה לנצח.
              onClick={() => onChange(rating === star ? null : star)}
              className={`h-auto p-0 leading-none ${star <= (rating ?? 0) ? 'text-slate-700' : 'text-slate-300'}`}
              aria-label={`${star} מתוך ${STAR_COUNT}`}
              aria-pressed={star === rating}
            >
              ★
            </button>
          )
        })}
        <span className="mr-1.5 text-[11.5px] text-slate-500">
          {rating === null ? 'טרם התרשמת' : `${rating} מתוך ${STAR_COUNT}`}
        </span>
      </div>
    )
  }

  if (rating === null) {
    return (
      <span className="text-slate-400" data-testid={testId}>
        {EMPTY_LABEL}
      </span>
    )
  }

  if (variant === 'compact') {
    // 🔴 **בידוד-כיווניות — אותה משפחה כמו `Money`, ונתפס בעין על המסך הבנוי (09/08/2026).**
    // המוקאפ כותב `5 ★` (ספרה ואז כוכב), אבל בתא RTL בלי בידוד ה-bidi מעביר את הכוכב
    // אל **שמאל** הספרה ומוצג `★ 5`. ⚠️ **וגם המוקאפ עצמו היה נשבר כך** — הוא מבודד את
    // עמודת-השכר (`.num`) ולא את עמודת-ההתרשמות, ולכן "כמו שצויר" לבדו היה משכפל את הפגם.
    // ⇒ העטיפה עברה לרכיב `Ltr` (צעד 3.0 של מודול 6) — זה היה ההעתק הידני השני של הזוג
    // `dir="ltr"` + `unicode-bidi:isolate`, ורכיב אחד שפולט את שניהם הוא מה שמונע סטייה.
    return (
      <Ltr className="text-slate-700" data-testid={testId}>
        {rating} ★
      </Ltr>
    )
  }

  return (
    <span className="text-[17px]" data-testid={testId}>
      <Glyphs value={rating} />
    </span>
  )
}
