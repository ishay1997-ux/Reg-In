// מנוע-הסינון של חלון-הייצוא — **גנרי, נגזר מ-`format` ולא מ-`typeof`**.
//
// 🔴 **למה זה לא "מסנן אחד" אלא ארבעה פקדים, ולמה זה נמדד ולא הונח:** נספרו 484 הכרזות-עמודה
// ב-`supabase/migrations/*module11*.sql` בשמונה פורמטים — `int` 124 · `text` 108 · `money` 104 ·
// `percent` 59 · `date` 39 · `days` 28 · `ratio` 15 · `id` 7. **שלוש עובדות מהספירה הפילו את
// המיפוי הפשטני שנכתב תחילה** *(«text ⇒ מכיל · מספרי ⇒ גדול/קטן»)*:
//
// ① **`id` הוא פורמט נפרד.** ‏`פרויקט` ו-`הצעה` מוכרזים גם `id` וגם `int`. *"פרויקט גדול מ-1500"*
//    חסר-משמעות ⇒ ל-`id` יש שוויון ובחירה-מרשימה בלבד.
// ② **אותה תווית מוכרזת בפורמטים שונים בדוחות שונים** — `מועד-פירעון חוזי` הוא `date` באחד
//    ו-`text` באחר · `שנה` הוא `int` ו-`text` · `ציון אחרון · ממוצעו` הוא `ratio` ו-`text`.
//    ⇒ **נגזרים מהפורמט של העמודה בדוח הזה, לעולם לא מהשם.** מיפוי-לפי-שם היה שגוי במחצית.
// ③ **`text` הוא שני דברים.** ‏`מדרג` הוא טקסט עם **ארבעה** ערכים (1–30 · 31–60 · 61–90 · 90+);
//    ‏`לקוח` הוא טקסט חופשי עם עשרות. תיבת-חיפוש על הראשון היא פקד שגוי. ⇒ ההבחנה **מחושבת
//    מהנתונים** ולא מוכרזת פר-דוח, ולכן היא נכונה גם בדוח ה-17 שטרם נבנה.

import { finiteNumber } from '@/lib/reportsFormat'
import { readCell } from '@/lib/exportColumns'
import { stripBidiControls } from '@/lib/reportsExport'

const NUMERIC = new Set(['money', 'int', 'days', 'percent', 'ratio'])

// מעל הסף, רשימת-בחירה הופכת לקיר. מתחתיו, תיבת-חיפוש היא ניחוש.
export const CATEGORY_MAX_VALUES = 15

// 🚫 **אינו מיוצא בכוונה** — `operatorsFor` הוא הדלת היחידה החוצה. ייצוא בלי צרכן מפיל את
// `knip`, והתיקון הנכון הוא לצמצם את ה-API ולא להוסיף `ignore` (הכרעת-ישי 29/07/2026).
const OPERATORS = {
  gt: { id: 'gt', label: 'גדול מ-' },
  lt: { id: 'lt', label: 'קטן מ-' },
  eq: { id: 'eq', label: 'שווה ל-' },
  between: { id: 'between', label: 'בין' },
  from: { id: 'from', label: 'מתאריך' },
  to: { id: 'to', label: 'עד תאריך' },
  contains: { id: 'contains', label: 'מכיל' },
  oneOf: { id: 'oneOf', label: 'אחד מ-' },
}

const text = (value) =>
  value === null || value === undefined ? '' : stripBidiControls(String(value)).trim()

// 🔴 **`finiteNumber` ולא `toFiniteNumber` מ-`pricing.js`** — ההבדל נעול בבדיקה ואינו סגנוני:
// אצל השני `'  '` הופך ל-**0**, כלומר שורה שלא נמדדה הייתה עוברת *"קטן מ-100"* כאילו היא אפס.
const num = (value) => finiteNumber(value)

// תאריך מושווה על עשרת התווים הראשונים (`YYYY-MM-DD`) — השוואת-מחרוזת נכונה לפורמט הזה,
// ואינה נוגעת באזור-הזמן. ⚠️ `new Date()` על ערך-מסד הייתה מזיזה יום סביב חצות.
const day = (value) => {
  const raw = text(value)
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null
}

/** האופרטורים החוקיים לעמודה — לפי הפורמט שה-RPC הכריז, ולפי צורת הערכים בפועל. */
export function operatorsFor(format, categorical = false) {
  if (format === 'id') return [OPERATORS.eq, OPERATORS.oneOf]
  if (NUMERIC.has(format)) return [OPERATORS.gt, OPERATORS.lt, OPERATORS.between, OPERATORS.eq]
  if (format === 'date') return [OPERATORS.from, OPERATORS.to]
  return categorical ? [OPERATORS.oneOf] : [OPERATORS.contains]
}

/**
 * הערכים שקיימים בפועל בעמודה — הבסיס לרשימת-הבחירה. ריקים אינם ערך.
 *
 * ⚠️ **מקבל את העמודה ולא את המפתח, וזה שינוי-חתימה מכוון** (22/09/2026):
 * עמודה נגזרת (`value`) אינה יושבת על `row[key]` כלל, ורשימת-בחירה שנבנתה
 * ממפתח היתה **ריקה בשקט** — פקד שנראה תקין ואינו מציג אף ערך.
 */
export function distinctValues(rows, column) {
  const seen = new Set()
  for (const row of rows ?? []) {
    const value = text(readCell(row, column))
    if (value !== '') seen.add(value)
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'he'))
}

/** האם העמודה מתנהגת כקטגוריה — **נמדד מהשורות, לא מוכרז**. */
export function isCategorical(rows, column, max = CATEGORY_MAX_VALUES) {
  const values = distinctValues(rows, column)
  return values.length > 0 && values.length <= max
}

function passesNumeric(value, condition) {
  const n = num(value)
  // 🔴 **ערך חסר אינו אפס ואינו עובר תנאי מספרי.** אותו אינווריאנט של `finiteNumber`:
  // *ערך שאינו סופי הוא **היעדר***. שורה בלי מדידה שהייתה נספרת כ-0 הופכת "אין נתון" ל"אפס".
  if (n === null) return false
  const a = num(condition.value)
  const b = num(condition.value2)
  switch (condition.operator) {
    case 'gt':
      return a !== null && n > a
    case 'lt':
      return a !== null && n < a
    case 'eq':
      return a !== null && n === a
    case 'between':
      return a !== null && b !== null && n >= Math.min(a, b) && n <= Math.max(a, b)
    default:
      return true
  }
}

function passesOne(row, column, condition) {
  // װ`readCell` ולא `row[column.key]`: אחרת סינון על עמודה נגזרת היה משווה מול
  // `undefined` ומחזיר אפס שורות בלי לומר למה.
  // 🔑 **והעיקר: המסנן והקובץ חייבים לקרוא את אותו ערך** — שתי דרכי-קריאה
  // נפרדות הן בדיוק המצב שבו המשתמשת מסננת לפי אחד ומקבלת קובץ לפי השני.
  const value = readCell(row, column)
  if (column.format === 'date') {
    const d = day(value)
    const edge = day(condition.value)
    if (d === null || edge === null) return false
    return condition.operator === 'from' ? d >= edge : d <= edge
  }
  if (NUMERIC.has(column.format)) return passesNumeric(value, condition)
  if (condition.operator === 'oneOf') {
    const wanted = (condition.values ?? []).map(text).filter(Boolean)
    return wanted.length === 0 || wanted.includes(text(value))
  }
  if (condition.operator === 'eq') return text(value) === text(condition.value)
  const needle = text(condition.value).toLowerCase()
  return needle === '' || text(value).toLowerCase().includes(needle)
}

/**
 * כל התנאים מצטברים (AND). תנאי שעמודתו אינה קיימת בדוח הנוכחי — **נזרק**, לא מסנן הכול החוצה:
 * החלון מרכיב מחדש את רשימת-התנאים בכל החלפת-דוח, וזו רשת-ביטחון לרגע שבין השניים.
 */
/**
 * 🔴 **תנאי שטרם מולא אינו מסנן — וזה תיקון של סתירה, לא נוחות.**
 *
 * 📊 **נמדד 23/09/2026 באימות-עיניים:** לחיצה על מסנן-הכותרת יוצרת תנאי עם ערך ריק,
 * ו-`passesNumeric` עם ערך ריק מחזיר `false` **לכל השורות** ⇒ הטבלה התרוקנה מיד,
 * הופיע *"הסינון לא הותיר שורות"*, **והייצוא נחסם** — לפני שהמשתמשת הקלידה דבר.
 *
 * 🔑 **וזו סתירה שהיתה קיימת קודם ורק לא נראתה:** שורת-"חל על הקובץ"
 * (`ExportDialog.jsx`) **כבר מדלגת על תנאי בלי ערך** — כלומר המסך אמר *"אין מסנן"*
 * בדיוק כשהמנוע סינן **הכול החוצה.** ⇒ השניים מוסכמים עכשיו על אותה הגדרה.
 */
function isComplete(condition) {
  if (condition?.operator === 'oneOf') return (condition.values ?? []).length > 0
  const filled = (value) => value !== '' && value !== null && value !== undefined
  if (condition?.operator === 'between') return filled(condition.value) && filled(condition.value2)
  return filled(condition?.value)
}

export function applyFilters(rows, columns, conditions) {
  const list = Array.isArray(rows) ? rows : []
  const byKey = new Map((columns ?? []).map((column) => [column.key, column]))
  const active = (conditions ?? []).filter(
    (condition) => byKey.has(condition?.key) && isComplete(condition),
  )
  if (active.length === 0) return list
  return list.filter((row) =>
    active.every((condition) => passesOne(row, byKey.get(condition.key), condition)),
  )
}
