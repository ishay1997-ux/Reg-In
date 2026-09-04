// הלוגיקה הטהורה של משטח S4 — הדף הציבורי למשוב-לקוח (`/feedback/:token`).
//
// 🚫 **אין כאן Supabase, אין DOM** — אותה מוסכמה בדיוק כמו `src/lib/shiftInvite.js`
// (המקביל של S4-4, `/shift/:token`), שנקרא במלואו לפני כתיבת הקובץ הזה. קובץ נפרד,
// לא פונקציות בתוך `PublicFeedbackPage.jsx` עצמו — `react-refresh/only-export-components`
// חוסם קובץ-קומפוננטה שמייצא גם ערכים/פונקציות לא-קומפוננטה לצד ה-`export default`
// (נתפס ב-`npm run lint` תוך-כדי הבנייה, לא הונח מראש).

export const FEEDBACK_STATE = {
  loading: 'loading',
  form: 'form',
  thankYou: 'thankYou',
  already: 'already',
  dead: 'dead',
  // 🔴 המצב שקיים כדי ש**לעולם לא ייכתב "נשמר" כשלא נשמר** — אותו עוגן כמו
  // `SHIFT_INVITE_STATE.saveFailed` (spec.md § מה ייחשב עובד #3). נוסף כאן ביוזמת
  // N-5 (הכרעת-ישי 26/08/2026): הבריף המאושר צייר בדיוק ארבעה מצבים (א–ד) והוציא
  // כשל-רשת מהיקפו במפורש; N-5 קובע שהתנהגות (חוזה-העיצוב, saveFailed+"נסי שוב")
  // גוברת על היקף-הציור — כלל-הפיצול הקבוע.
  saveFailed: 'saveFailed',
}

// הנוסחים מצוטטים מילה-במילה: "המשוב כבר התקבל, תודה" ו"הקישור אינו בתוקף" הם
// ציטוט-מדויק מ-`processes-approved.md` (§3.7 הנעול); "תודה שלקחתם רגע..." הוא
// מחבילת N-2 (אושרה 26/08/2026, "מאשר את כולם"). נוסח-הכשל אינו נעול במקור —
// נבנה בהשראת "לא הצלחנו לשמור את התשובה..." של `/shift/:token`, בפנייה נטולת-מגדר
// (רבים: "אפשר", לא "נסי"): S-28 (לשון-נקבה) חל על חמש-המשתמשות-הצוות, לא על לקוח
// חיצוני ממין לא-ידוע — בדיוק כמו "רוצים"/"געו" במוקאפ המאושר עצמו.
export const FEEDBACK_MESSAGE = {
  [FEEDBACK_STATE.thankYou]: 'תודה שלקחתם רגע לספר לנו איך היה!',
  [FEEDBACK_STATE.already]: 'המשוב כבר התקבל, תודה',
  [FEEDBACK_STATE.dead]: 'הקישור אינו בתוקף',
  [FEEDBACK_STATE.saveFailed]: 'לא הצלחנו לשמור את המשוב. אפשר לנסות שוב.',
}

// payload של `get_feedback_page` ⇐ מצב-מסך.
//
// ⚠️ `not_found` מכסה טוקן ריק/שגוי/מת — אותו אובייקט בדיוק, בכוונת-המיגרציה
// (אין ערוץ-מידע למי שמנחש טוקנים). ערך לא-מוכר ⇒ `dead` ולא `form`: ברירת-המחדל
// הבטוחה היא לא-להציע טופס-קלט שאולי לא יישמר, בדיוק כמו `stateFromInvitePayload`.
export function stateFromPagePayload(payload) {
  switch (payload?.state) {
    case 'ok':
      return FEEDBACK_STATE.form
    case 'already':
      return FEEDBACK_STATE.already
    case 'not_found':
      return FEEDBACK_STATE.dead
    default:
      return FEEDBACK_STATE.dead
  }
}

// payload של `submit_feedback` ⇐ מצב-מסך, או `null` כשההגשה לא נכתבה ואין להתקדם
// (`invalid` — ציון חסר/מחוץ-לטווח; בפועל בלתי-מושג כי "שלח" חסום עד בחירת-כוכב,
// A-1 — אבל התשובה נשארת מוגדרת-במפורש ולא נופלת ל-`default` דמוי-הצלחה).
export function stateFromSubmitPayload(payload) {
  switch (payload?.state) {
    case 'ok':
      return FEEDBACK_STATE.thankYou
    case 'already':
      return FEEDBACK_STATE.already
    case 'not_found':
      return FEEDBACK_STATE.dead
    default:
      return null
  }
}

// חמשת הערכים המוגדרים בסכימה ובאילוץ לכל אחד משני הסוגים:
export const FEEDBACK_NEGATIVE_REASONS = [
  'איחור דיילות',
  'תפקוד דיילות',
  'איכות תגים',
  'ניהול לקוי',
  'אחר',
]

export const FEEDBACK_POSITIVE_REASONS = [
  'מקצועיות הדיילות',
  'עמידה בזמנים',
  'איכות תגים וציוד',
  'ניהול ותקשורת',
  'אחר',
]

// פונקציית טיהור טהורה כדי להבטיח שלעולם לא תישלח סיבה שלילית בציון גבוה ולהפך,
// ותמיכה מלאה בבחירה מרובה (מערכים) לצד תאימות לאחור לערכים בודדים.
export function sanitizeReasons(score, negativeReasons, positiveReasons) {
  if (score == null) {
    return {
      negativeReasons: [],
      positiveReasons: [],
      negativeReason: null,
      positiveReason: null,
    }
  }

  const toArray = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    return [val]
  }

  const negArr = toArray(negativeReasons)
  const posArr = toArray(positiveReasons)

  if (score <= 3) {
    const valid = negArr.filter((r) => FEEDBACK_NEGATIVE_REASONS.includes(r))
    return {
      negativeReasons: valid,
      positiveReasons: [],
      negativeReason: valid[0] ?? null,
      positiveReason: null,
    }
  }

  const valid = posArr.filter((r) => FEEDBACK_POSITIVE_REASONS.includes(r))
  return {
    negativeReasons: [],
    positiveReasons: valid,
    negativeReason: null,
    positiveReason: valid[0] ?? null,
  }
}
