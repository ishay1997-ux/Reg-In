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

// 🆕 **שלושת פרמטרי-הרשות שלמטה (01/09/2026) — למה הם קיימים בכלל.**
// הרכיב נולד לקהל **אחד**: מנהלת שמתרשמת מדיילת. הנוסח והצבע נגזרו מהקהל הזה, ולכן
// כשהדף הציבורי `/feedback/:token` (משטח S4 של מ8) עשה בו שימוש-חוזר, נוסח-המנהלת דלף
// אל מסך שקורא **לקוח חיצוני**: "טרם התרשמת" הוא לשון-נקבה-יחיד בעוד הדף פונה ברבים
// ("געו", "רוצים לספר לנו עוד?"), והמילה "התרשמות" מיועדת במפורש לדעת-המנהלת-על-דיילת
// (הערת-הראש למעלה) ולא לפסק-דין של לקוח על האירוע שלו.
// ⚠️ **ולכן אל "תאחד" את שני הקהלים בחזרה לנוסח אחד** — הם באמת שונים, וזו הסיבה
// שהרכיב מקבל פרמטרים ולא מחרוזת-על אחת.
// **התקדים לצורה הזאת:** `retryLabel = 'נסה שוב'` ב-`LoadingOrError` (מודול 6 נזקק
// ללשון-נקבה ולא הרשה לעצמו להחליף את ברירת-המחדל חוצת-המערכת) ו-`exact`/`cents`
// ב-`Money` — פרמטר-רשות שברירת-המחדל שלו משחזרת בייט-בבייט את ההתנהגות הקיימת.
// 🔴 **שלושתם `opt-in`: קורא שלא מעביר אותם מקבל בדיוק את מה שקיבל אתמול.**

import Ltr from '@/components/Ltr'

const STAR_COUNT = 5
const EMPTY_LABEL = '—'

// `tone` — צבע הכוכב **המלא**. ‏`neutral` (ברירת-מחדל) = מה שכל המסכים הפנימיים מציגים
// היום. ‏`primary` = הטורקיז של המותג (`--primary: #0d9488` ב-`index.css`, שהוא בדיוק
// `teal-600`; זו גם הצורה שכל שאר `src/` מפנה אליה — `text-teal-600` ולא הקס גולמי).
// **מתי לבחור בו:** רק כשהדירוג הוא **הפעולה הראשית של המסך**, לפי כלל-המילוי
// (`PROJECT_MASTER §4`, מעבר-האחידות ב-`src/CLAUDE.md`) — כלומר בדף-המשוב הציבורי,
// שבו אין פעולה מתחרה מלבד "שלח". במסך פנימי שבו ההתרשמות היא **שדה אחד מני רבים**
// טורקיז-מלא היה מתחרה בכפתור-הפעולה, וזו בדיוק הסיבה שברירת-המחדל נשארה אפורה.
const FILLED_TONE = {
  neutral: 'text-slate-700',
  primary: 'text-teal-600',
}
const EMPTY_STAR = 'text-slate-300'

// ברירת-המחדל ל-`aria-label` פר-כוכב — **המחרוזת המדויקת שהייתה כאן קודם**, כדי שאף
// קורא-מסך ואף בדיקה קיימת לא ישתנו. מוגדרת ברמת-המודול ולא inline כדי שזהות-הפונקציה
// תהיה יציבה בין רינדורים.
const defaultStarLabel = (star) => `${star} מתוך ${STAR_COUNT}`

function Glyphs({ value, filled }) {
  return Array.from({ length: STAR_COUNT }, (_, index) => (
    <span key={index} className={index < value ? filled : EMPTY_STAR}>
      ★
    </span>
  ))
}

// value: 1–5 או `null`/`undefined` = לא דורגה.
// variant: `glyphs` (ברירת-מחדל, כרטיס-הצפייה) · `compact` (שורת-טבלה).
// onChange: קיים ⇒ הרכיב עריך (טופס). ⚠️ `readOnly` מובלע — אין `onChange`, אין עריכה.
// tone / starLabel / hideCaption: פרמטרי-רשות — ר' הבלוק בראש הקובץ.
export default function RatingStars({
  value,
  variant = 'glyphs',
  onChange,
  testId,
  tone = 'neutral',
  starLabel = defaultStarLabel,
  hideCaption = false,
}) {
  const rating = Number.isFinite(value) ? value : null
  const filled = FILLED_TONE[tone] ?? FILLED_TONE.neutral

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
              // 🚫 בלי `outline-none` כאן ובשום מקום ברכיב: הכוכבים הם `<button>` גולמי
              // ולכן טבעת-המיקוד היא של הדפדפן (מגוונת ב-`index.css` דרך `outline-ring/50`).
              // ביטולה היה משאיר את הווידג'ט בלתי-שמיש למי שמנווט במקלדת, בלי שום סימן.
              className={`h-auto p-0 leading-none ${star <= (rating ?? 0) ? filled : EMPTY_STAR}`}
              aria-label={starLabel(star)}
              aria-pressed={star === rating}
            >
              ★
            </button>
          )
        })}
        {hideCaption ? null : (
          <span className="mr-1.5 text-[11.5px] text-slate-500">
            {rating === null ? 'טרם התרשמת' : `${rating} מתוך ${STAR_COUNT}`}
          </span>
        )}
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
      <Ltr className={filled} data-testid={testId}>
        {rating} ★
      </Ltr>
    )
  }

  return (
    <span className="text-[17px]" data-testid={testId}>
      <Glyphs value={rating} filled={filled} />
    </span>
  )
}
