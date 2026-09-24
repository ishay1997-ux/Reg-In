// שומר-הטיוטה של `draft-followup` — פונקציה טהורה, בלי Deno ובלי רשת, כדי שבדיקת-יחידה ב-Vitest
// (`draftGuard.test.js`) תייבא אותה ישירות. ‏`index.ts` מייבא מכאן; ‏`deno check` של ה-CI בודק גם את הקובץ הזה.
// ⚠️ **פריסה דרך MCP חייבת לכלול את שני הקבצים** (`index.ts` + `draftGuard.ts`), אחרת הייבוא נופל.

// ── שומר-הטיוטה: מה שלא עובר כאן **לא** מגיע למשתמשת ─────────────────────────────────
// 🔴 **"טיוטה שבורה" גרועה מ"הניסוח נכשל":** מציין-מקום שהמודל המציא (`{{מחיר}}`) היה נשאר על
// המסך כסוגריים, וסכום או הנחה שהמודל המציא היו נשלחים ללקוח כהתחייבות. ⇒ נכשלים ב-502 ומבקשים
// "נסי שוב", במקום להציג משהו שאסור לשלוח. אין כאן ספרות אסורות: `days_since_sent` הוא עובדה שמותר
// למודל להזכיר, ולכן הבדיקה היא על סימני-כסף והנחה, לא על כל ספרה.
// ✏️ 24/09/2026 (ממצא-הבודק): הרמז בחלון אומר שהמחיר וההנחה לא נשלחים ל-AI — והשומר הוא מה שמונע
// ממנו להמציא אותם. נוספו: "אחוז" במילים, וסכום-במילים צמוד לספרה ("5 אלף", "3,000 שקלים" כבר נתפס).
const MAX_BODY_CHARS = 2_000
const MONEY_OR_DISCOUNT = /₪|%|ש"ח|ש״ח|שקל|הנחה|הנחות|אחוז|\d[\d,.]*\s*(?:אלף|אלפים|מיליון)/
const PLACEHOLDER_TOKEN = /\{\{[^{}]*\}\}/g
// 🔤 **כתב ערבי — כל ארבעת הטווחים** (הכרעת-הסגן 25/09/2026): הבסיסי U+0600–06FF · התוספת 0750–077F ·
// צורות-התצוגה FB50–FDFF ו-FE70–FEFF. נמדד חי 25/09: "מו<U+0639><U+062F>" — ע' ו-ד' ערביות (U+0639 · U+062F) בתוך מילה עברית;
// בעין זה נראה כמעט תקין, וללקוח זו שגיאת-כתיב גלויה. במייל-מעקב בעברית אין שום סיבה לתו כזה.
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/
// הסיבה שה-draft מזהה כדי לבקש ניסיון נוסף — קבוע ולא מחרוזת חוזרת, כדי ששני הצדדים לא ייפרדו.
export const ARABIC_SCRIPT_PROBLEM = 'arabic script'

export function draftProblem(text: string, allowed: string[]): string | null {
  if (text.trim() === '') return 'empty'
  const tokens = text.match(PLACEHOLDER_TOKEN) ?? []
  const unknown = tokens.filter((token) => !allowed.includes(token))
  if (unknown.length > 0) return `unknown placeholder ${unknown.join(',')}`
  if (text.replace(PLACEHOLDER_TOKEN, '').includes('{{')) return 'broken placeholder'
  if (ARABIC_SCRIPT.test(text)) return ARABIC_SCRIPT_PROBLEM
  if (MONEY_OR_DISCOUNT.test(text)) return 'money or discount'
  if (text.length > MAX_BODY_CHARS) return 'too long'
  return null
}
