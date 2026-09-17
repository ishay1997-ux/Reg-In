// ייצוא-אקסל של מודול 11 — **מנגנון אחד, שישה-עשר משטחים** (מדריך-המיקרו, צעד 3.0ג).
//
// 🔑 **הספרייה כבר בריפו ואינה נבחרת מחדש** (כלל-ברזל 14): `write-excel-file`, הכניסה
// הדפדפנית, שהצרכן הקיים היחיד שלה הוא `writeSalaryReportXlsx` (`src/lib/salaryReport.js`).
// 🔴 **והאופציה שהועתקה משם במכוון: `rightToLeft: true`.** ההערה שם מסבירה למה — *"אחרת
// אקסל פותח מסמך עברי עם עמודה A משמאל"*. **ייצוא עברי בלעדיה שגוי בדרך ששום בדיקה בריפו
// אינה תופסת**, כי הקובץ נוצר תקין מבחינת תוכן.
//
// ⚠️ **ומה שהמודול הזה **אינו** עושה, ומ8 כן: קריאה שנייה למסד.** ‏`processes-approved.md §📤`
// + ת4 קובעים שהייצוא מוריד **את מה שכבר על המסך** — אותן שורות, אותם מסננים, אותה רמת-דריל.
// מ8 בונה מסמך קבוע ומעלה אותו ל-bucket; כאן זו הורדה של דאטה שה-RPC כבר החזיר.
// ⇒ **ספרייה משותפת, אתר-קריאה חדש — לא לנתב דרך הקוד של מ8.**
//
// 🚫 **אין הרשאת-ייצוא נפרדת** (ת4: *"מי שרואה, מייצא"*), ולכן אין כאן בדיקת-הרשאה כלל.

import writeXlsxFile from 'write-excel-file'
import { formatIsraelDate } from '@/lib/reportsFormat'

// 🔤 **שלושת המצבים הריקים נעולים מילה-במילה** — ת4 ו-`cards-customers.md` G-ל8. הם מועתקים
// ולא מנוסחים מחדש: שינוי-נוסח כאן הוא שינוי-מוצר בשלושה-עשר כרטיסים בבת-אחת.
export const EXPORT_NO_ROWS = 'אין שורות לייצא'
export const EXPORT_NO_TABLE = 'אין טבלה לייצוא בדף הזה'
export const EXPORT_NO_APPROVED_RUN = 'אין שורות לייצא — טרם אושרה ריצת-ניתוח'

// 🔴 **רשימה סגורה של הנוסחים שמותר להציג כמות-שהם — ולא בדיקה שמשווה שגיאה לעצמה.**
// ‏why: אתר-הקריאה צריך להבחין בין *"מחרוזת עברית שאנחנו זרקנו"* לבין *"תקלת-ספרייה"*,
// והמשמר שהיה שם (`[caption.file, err?.message].includes(err?.message)`) היה **טאוטולוגיה**:
// המערך הכיל את הערך שנבדק, ולכן כל שגיאה נחשבה "מוכרת" — הנוסח הכללי היה קוד-מת, ושגיאה
// בלי `message` רינדרה משבצת-שגיאה **ריקה** (אודיט-הסגירה 17/09/2026, ‏B-1).
// 🔑 **והרשימה יושבת כאן ולא ברכיב** — היא נגזרת של אותם שלושה קבועים, במקום שבו הם נעולים.
export const EXPORT_LOCKED_MESSAGES = new Set([
  EXPORT_NO_ROWS,
  EXPORT_NO_TABLE,
  EXPORT_NO_APPROVED_RUN,
])

// ✏️ שם-הגיליון באקסל חסום ל-31 תווים ואוסר `[ ] : * ? / \` — חוק של הפורמט, לא בחירה שלנו.
// גיליון עם שם פסול נפתח כקובץ פגום, ולכן הניקוי כאן ולא באתר-הקריאה.
const SHEET_NAME_MAX = 31
const SHEET_FORBIDDEN = /[[\]:*?/\\]/g

export function sanitizeSheetName(name) {
  const cleaned = String(name ?? '')
    .replace(SHEET_FORBIDDEN, '-')
    .trim()
  return (cleaned || 'דוח').slice(0, SHEET_NAME_MAX)
}

// 🔴 **שם-הקובץ נבנה כאן ולא ב-JSX, כי הוא מוצג למשתמשת *לפני* הלחיצה** (ת4: שתי שורות-
// כיתוב מתחת לשורת-המסננים אומרות מה יירד). שתי גזירות נפרדות של אותו שם היו נפרדות ביום
// שבו אחת מהן תשתנה — וההבטחה שעל המסך היא בדיוק מה שהמנגנון הזה קיים בשבילו.
// ⚠️ **תווי-בקרה מסוננים לפי קוד ולא בתוך הביטוי-הרגולרי** — `no-control-regex` חוסם
// טווח `\x00-\x1f` בתוך regex, ובצדק: תו-בקרה בתוך ביטוי הוא בלתי-נראה בקוד עצמו.
const FILENAME_FORBIDDEN = /[<>:"/\\|?*]/g
const stripControlChars = (text) => [...text].filter((ch) => ch.codePointAt(0) > 0x1f).join('')

/**
 * ‏`{ reportName: 'גיול חובות', windowLabel: '01/01/2026–06/09/2026', drillLabel: '61–90 יום' }`
 * ⇒ `"גיול-חובות_01-01-2026-06-09-2026_61-90-יום.xlsx"`.
 * ‏📐13③: שם-הקובץ נושא את **הרמה הנוכחית** של הדריל, לא את השורש.
 */
export function buildExportFileName({ reportName, windowLabel, drillLabel } = {}) {
  const segment = (raw) =>
    stripControlChars(String(raw ?? ''))
      // תווי-בידוד בלתי-נראים אינם שייכים לשם-קובץ — הם הופכים אותו לבלתי-ניתן-להקלדה
      // ולבלתי-ניתן-לחיפוש, ומי שרואה את השם על המסך לא יבין למה הוא לא מוצא אותו.
      .replaceAll('⁦', '')
      .replaceAll('⁩', '')
      // 🔴 **תו אסור הופך למקף ואינו נמחק** — נמדד 16/09/2026: מחיקה הפכה את התקופה
      // `01/01/2026` ל-`01012026`, מספר בן שמונה ספרות שאי-אפשר לקרוא כתאריך. שם-הקובץ
      // מוצג למשתמשת **לפני** הלחיצה (ת4), ולכן קריאוּתו היא חלק מהחוזה ולא נוחות.
      .replace(FILENAME_FORBIDDEN, '-')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
  const namePart = segment(reportName) || 'דוח'
  const windowPart = segment(windowLabel)
  const drillPart = segment(drillLabel)
  // 🔴 **הרמה נאמרת **פעם אחת** — נמדד 16/09/2026 ותוקן 17/09 (פריט [19] של סבב-הראיות):**
  // ברמת-דריל של מ3 שם-הקובץ יצא `מגמות-רב-שנתיות_2024-·-כל-הלקוחות_2024.xlsx` וברמה
  // השנייה `…_ינואר-2024-·-כל-הלקוחות_ינואר-2024.xlsx`. **הסיבה מדודה ולא משוערת:**
  // ‏`windowLabel` כאן הוא `payload.window.label` של השרת (`ReportSurface`), והשרת **כבר**
  // נוקב ברמה הפתוחה בתוכו — כך שהסיומת חזרה עליה.
  // 🔑 **הבליעה היא של הסיומת ולא של החלון**, ובכוונה: 📐13③ דורש שהשם יישא את **הרמה
  // הנוכחית**, ותווית-השרת היא זו שנושאת אותה בפועל. ⚠️ **ומדובר בהכלה ולא בשוויון** —
  // תווית-החלון היא `2024-·-כל-הלקוחות` והסיומת היא `2024`.
  // 🚫 **ומה שזה **אינו** נוגע בו:** מפרידי-השם (`_` · `-`) נשארים בדיוק כשהיו — `e2e/
  // reports.spec.js` נשען עליהם ב-`fileNameSegment()`, ובדיקת-הדריל של מ9 עדיין מוצאת
  // את תווית-הרמה בתוך השם, כי היא נמצאת בו דרך חלון-השרת.
  const parts = [namePart, windowPart, windowPart.includes(drillPart) ? '' : drillPart].filter(
    Boolean,
  )
  return `${parts.join('_')}.xlsx`
}

/**
 * שתי שורות-הכיתוב שיושבות מתחת לשורת-המסננים **לפני** הלחיצה (ת4 · `cards-*.md §⑤` שורה 5):
 * השורה הראשונה נוקבת בשם-הקובץ הצפוי, השנייה בשמות-העמודות שיירדו.
 *
 * 🔑 **למה זה חשוב ולא קישוט:** הייצוא מוריד את **מצב-המסך** — מסננים ורמת-דריל כלולים.
 * בלי הכיתוב, המשתמשת לוחצת בלי לדעת אם תקבל 12 שורות או 700, והפער מתגלה רק באקסל.
 * ⚠️ **ומצב בלי טבלה אינו "כיתוב ריק"** — הוא אומר זאת במפורש (📐10: לכל דף יש מצב מוגדר).
 */
export function exportCaption({ fileName, columns, rowCount, blockedReason } = {}) {
  if (blockedReason) return { file: blockedReason, columns: null, disabled: true }

  const names = (columns ?? []).map((c) => c.label).filter(Boolean)
  if (names.length === 0) {
    return { file: EXPORT_NO_TABLE, columns: null, disabled: true }
  }
  if (rowCount === 0) {
    return { file: EXPORT_NO_ROWS, columns: `עמודות: ${names.join(' · ')}`, disabled: true }
  }
  return {
    file: `יירד: ${fileName}`,
    columns: `עמודות: ${names.join(' · ')}`,
    disabled: false,
  }
}

// 🔴 **התא נבנה מהפורמט שה-RPC הכריז עליו (C8), ולא מ-`typeof` של הערך.** ההבדל אינו
// אקדמי: סכום שמגיע כ-`"1250"` (מחרוזת) היה נוחת באקסל כטקסט, ות4 דורש במפורש *"סכומים
// כמספרים (לא טקסט)"* — כלומר רו"ח שיסכם את הטור יקבל 0. הפורמט הוא מה שיודע שזה כסף.
const MONEY_FORMAT = '#,##0'
const PERCENT_FORMAT = '0.0'
const GINI_FORMAT = '0.00'

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function numericCell(value, format) {
  const n = toNumber(value)
  // ⚠️ `null` ⇒ תא ריק ולא `0`. אותה הבחנה שהמסך עושה עם `—`: אפס שנמדד ואין-נתון אינם
  // אותו דבר, ובאקסל אפס-מומצא ייכנס לסכום של הטור.
  if (n === null) return null
  return { value: n, type: Number, format }
}

/**
 * 🔤 **תווי-כיווניות בלתי-נראים — הרשימה המלאה, נקובה בשם.**
 * ‏`U+200E/200F` (LRM/RLM) · `U+061C` (ALM) · `U+2066–2069` (isolates) · `U+202A–202E`
 * (embeddings/overrides). 🚫 **ולא רק השניים שהמודול הזה מייצר:** מחרוזת-מסד שהודבקה
 * מוורד יכולה לשאת כל אחד מהם, והתוצאה זהה — תא שנראה נקי ואינו נקי.
 * ⚠️ הרשימה כתובה בקודים ולא בתווים עצמם **בכוונה**: הריפו כבר נכווה מ-`U+200F` נסתר
 * שאיש לא ידע שהוא שם (`src/lib/hostesses.js`).
 */
const BIDI_CONTROLS = /[‎‏؜⁦-⁩‪-‮]/g

// 🔑 **מיוצא — ולא מועתק — כי מנוע-הסינון חייב להשוות על אותו טקסט בדיוק** (`exportFilters.js`).
// ‏why: ערך שנושא תו-בידוד בלתי-נראה נראה על המסך זהה לחלוטין, אבל `'עמק חפר' === '⁦עמק חפר⁩'`
// הוא `false`. מסנן שמשווה על הגולמי היה מחזיר *"אין שורות"* על חיפוש שהמשתמשת רואה בעיניה
// שהוא תואם — **כשל שקט מושלם**. עותק שני של הביטוי היה נפרד ביום שהרשימה תתעדכן.
export const stripBidiControls = (text) => text.replace(BIDI_CONTROLS, '')

function cellFor(value, format) {
  switch (format) {
    case 'money':
      return numericCell(value, MONEY_FORMAT)
    case 'percent':
      return numericCell(value, PERCENT_FORMAT)
    case 'gini':
      return numericCell(value, GINI_FORMAT)
    case 'int':
    case 'days':
      return numericCell(value, '0')
    case 'ratio':
      return numericCell(value, '0.0')
    case 'date':
      // 🔑 תאריך יורד כ**טקסט בצורה הישראלית** ולא כ-`type: Date`: העמודה נקראת ע"י רו"ח
      // שפותח בלוקאל עברי, ותא-תאריך של אקסל מוצג לפי הגדרות-המכונה שלו ולא שלנו.
      return { value: formatIsraelDate(value), type: String }
    default:
      // 🔴 **תווי-בידוד נמחקים לפני שהם נכנסים לתא — נמדד 16/09/2026 וזה היה דלף אמיתי:**
      // המסך מבודד טווח-ספרות (`⁦1–30⁩`, ר' `textLtr` ב-`reportsFormat`) כדי שלא יתהפך
      // ב-RTL, ואקסל **אינו מסך** — הוא קיבל שני תווים בלתי-נראים בתוך הערך, שנדבקים
      // לכל `VLOOKUP`/השוואה שהרו"ח יעשה עליו ואינם נראים לעין שתחפש למה זה לא מתאים.
      // 🔑 **המחיקה כאן ולא באתר-הקריאה:** הייצוא הוא **הגבול** שבו הטקסט יוצא מהדפדפן,
      // וכל עמודה עוברת בו — כלל אחד במקום זכירה פר-לשונית.
      return value === null || value === undefined
        ? null
        : { value: stripBidiControls(String(value)), type: String }
  }
}

/**
 * ממפה שורות+עמודות של C8 לגיליון של `write-excel-file`: שורת-כותרת מודגשת ואז השורות.
 * טהור — כדי שייבדק ביחידה בלי לדמות הורדת-קובץ.
 */
export function buildExportSheet({ columns, rows }) {
  const header = (columns ?? []).map((c) => ({
    value: c.label,
    type: String,
    fontWeight: 'bold',
  }))
  const body = (rows ?? []).map((row) => (columns ?? []).map((c) => cellFor(row[c.key], c.format)))
  return [header, ...body]
}

/**
 * ההורדה עצמה. **זורק** כשאין מה לייצא — ולא מוריד קובץ ריק בשקט: קובץ בן שורת-כותרת
 * בלבד נראה כמו ייצוא שהצליח, וזו בדיוק ההטעיה ש-`EXPORT_NO_ROWS` נועד למנוע על המסך.
 */
export function exportReportRows({ fileName, sheetName, columns, rows }) {
  if (!columns || columns.length === 0) throw new Error(EXPORT_NO_TABLE)
  if (!rows || rows.length === 0) throw new Error(EXPORT_NO_ROWS)

  return writeXlsxFile(buildExportSheet({ columns, rows }), {
    fileName,
    sheet: sanitizeSheetName(sheetName),
    // 🔴 האופציה שכל הייצוא העברי תלוי בה — ר' הערת-הכותרת.
    rightToLeft: true,
    columns: columns.map((c) => ({ width: c.label && c.label.length > 14 ? 26 : 16 })),
  })
}
