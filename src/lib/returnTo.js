// "חזרה למקור" — ליטושי-הכנס, חבילה 0ב (24/09/2026). ישי: *"שלוחצים על דיילת ואז סוגרים אתה לא חוזר
// למסך בדוחות… יכול להיות שהבעיה יותר רחבה"*.
//
// 🔑 כל דלת מדוח ומפריטי "דורש תשומת לב" במסך הבית מעבירה `?returnTo=<הכתובת שממנה יצאו>`, והיעד חוזר
// אליה בסגירה. 🔒 **נתיב פנימי בלבד — דוחות או מסך הבית.** כל ערך אחר (כתובת חיצונית, `//host`,
// לוכסן-הפוך, מסך פנימי אחר) ⇒ `null`, כלומר מתעלמים — פרמטר-כתובת הוא קלט שכל אחד יכול לכתוב,
// ו"חזרה" שמנווטת החוצה היא open-redirect.

export const RETURN_TO_PARAM = 'returnTo'

const MAX_LENGTH = 1000

export function safeReturnTo(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_LENGTH) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  if ([...value].some((ch) => ch.charCodeAt(0) < 32)) return null
  if (value === '/') return value
  if (value === '/reports' || value.startsWith('/reports?') || value.startsWith('/reports/')) {
    return value
  }
  return null
}

// הקישור ליעד, עם כתובת-החזרה. יעד-חזרה לא-בטוח ⇒ הקישור כמות-שהוא (אין לאן לחזור).
export function withReturnTo(href, returnTo) {
  const safe = safeReturnTo(returnTo)
  if (!safe) return href
  const url = new URL(href, 'http://internal')
  url.searchParams.set(RETURN_TO_PARAM, safe)
  return `${url.pathname}${url.search}${url.hash}`
}

export function returnToLabel(returnTo) {
  return returnTo === '/' ? 'חזרה למסך הבית' : 'חזרה לדוח'
}

// ✏️ 24/09/2026 (ביקורת-קוד, דרך הסגן) — **סגירה חוזרת ל-`returnTo` רק כשנסגר הפריט שהדלת פתחה.**
// הבאג: כרטיס ריק במסך הבית מוביל לרשימה עצמה (`/quotes?returnTo=/`), המשתמשת פותחת בה פריט בעצמה,
// ו-`returnTo` שנשמר בכתובת הטיס אותה למסך הבית בסגירה. ‏`doorId` = המזהה שהיה בכתובת **ברינדור
// הראשון** (הדלת); פריט אחר ⇒ סגירה רגילה, והיא נשארת ברשימה. הקישור בראש המסך נשאר כל עוד יש `returnTo`.
export function shouldReturnOnClose({ returnTo, closingId, doorId }) {
  if (!safeReturnTo(returnTo)) return false
  if (closingId == null || doorId == null) return false
  return String(closingId) === String(doorId)
}
