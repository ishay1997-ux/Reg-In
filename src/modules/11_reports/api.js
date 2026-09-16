// שכבת ה-API של מודול 11 — **כל גישת ה-Supabase של המודול מרוכזת כאן** (כלל-ברזל 14 + C5).
// שום רכיב במודול אינו קורא `supabase.from`/`supabase.rpc` בעצמו.
//
// 🔴 **האכיפה האמיתית יושבת במסד ולא כאן** (ת8 #3): כל משטח הוא `security definer` שפותחת
// ב-`assert_module_permission('<בעלים>', array['edit','view'])` ומחזירה **מספרים גמורים**.
// הדפדפן אינו קורא טבלאות ⇒ אין policy חדשה על `project_finance`/`assignments`. המיסוך
// שבמסך הוא שכבה שנייה, לא היחידה.
//
// 🔴 **והכשל השקט שהמודול הזה חי בצילו** (§4.3 של מדריך-המיקרו): טבלה עם RLS דלוק ואפס
// policies מחזירה **אפס שורות עם `error: null`** — המסך משקר ואינו נכשל. ⇒ תשובה שאינה
// בצורה המוסכמת **נזרקת בקול**, ולעולם אינה מרונדרת כ"אין נתונים". זו הסיבה לשער-הצורה
// למטה, ותקדימיו המדויקים הם `assertDashboardShape` (מ7) ו-`assertFinanceShape` (מ8).

import { supabase } from '@/supabaseClient'
import { toError } from '@/lib/apiError'

// 🔑 **מפתחות-החובה — מועתקים מ-C8**, לא נגזרים. מפתח שנעלם (`undefined`) הוא דריפט-צורה;
// מפתח שקיים וערכו `null`/`[]` הוא תשובה לגיטימית ("אין מה לומר"), בדיוק כפי ש-C8 מנסח:
// *"a key with nothing to say is `null` or `[]`, never absent"*.
export const REPORT_REQUIRED_KEYS = Object.freeze([
  'population',
  'window',
  'tiles',
  'chart',
  'columns',
  'rows',
  'so_what',
  'definitions',
  'drill',
  'meta',
])

// ✏️ **ארבעה מתוך העשרה נאכפים גם כ"לא-null"** — הם מה שכל דף מצייר תמיד: הצהרת-האוכלוסייה
// (📐2), חלון-הזמן (📐17), האריחים ו-`meta`. השאר יכולים להיות ריקים כדין: דף בלי גרף, דף
// בלי טבלה (`columns: []`), דף בלי דריל (`drill: null`).
const NON_NULL_KEYS = Object.freeze(['population', 'window', 'tiles', 'meta'])

// קוד סינתטי — הוא לא הגיע מהמסד, הוא **המסקנה שלנו**. אותו תקדים בדיוק כמו
// `RLS_DENIED_CODE` (`src/lib/apiError.js`) ו-`DASHBOARD_SHAPE_DRIFT_CODE` (מ7): המסך צריך
// להבחין בין זריקה **שלנו**, שהודעתה עברית וראויה להצגה, לבין `TypeError: Failed to fetch`.
export const REPORT_SHAPE_DRIFT_CODE = 'REPORT_SHAPE_DRIFT'

// 🔤 הודעה אחת, **בלי שם-שדה** — שם-מפתח הוא ז'רגון-בנאים ואסור על המסך (מדריך-הסגנון
// §2א/§3ג, ואותה הכרעה בדיוק שנרשמה ב-`07_dashboard/api.js`). האבחון חי ב-`err.code`.
const SHAPE_DRIFT_MESSAGE = 'יש תקלה בנתונים.'

function shapeError() {
  const e = new Error(SHAPE_DRIFT_MESSAGE)
  e.code = REPORT_SHAPE_DRIFT_CODE
  return e
}

/**
 * שער-הצורה של תשובת-דוח. טהור, כדי שייבדק ביחידה בלי לדמות Supabase.
 * 🚫 **אינו "מתקן" ואינו ממלא ברירות-מחדל** — תשובה חסרה היא חוזה שנשבר, ומסך שממציא
 * מבנה חסר מציג אריחים ריקים כאילו נמדדו.
 */
export function assertReportShape(payload) {
  if (payload === null || payload === undefined || typeof payload !== 'object') throw shapeError()
  if (Array.isArray(payload)) throw shapeError()

  for (const key of REPORT_REQUIRED_KEYS) {
    if (!Object.hasOwn(payload, key) || payload[key] === undefined) throw shapeError()
  }
  for (const key of NON_NULL_KEYS) {
    if (payload[key] === null) throw shapeError()
  }
  if (!Array.isArray(payload.tiles)) throw shapeError()
  if (!Array.isArray(payload.columns)) throw shapeError()
  if (!Array.isArray(payload.rows)) throw shapeError()
  if (typeof payload.population !== 'object' || Array.isArray(payload.population))
    throw shapeError()
  if (typeof payload.meta !== 'object' || Array.isArray(payload.meta)) throw shapeError()

  return payload
}

// 📐 **תקרת-הגרפים לדף: שניים** (C8 — `chart` הוא אובייקט או מערך באורך ≤ 2).
const CHART_CAP = 2

/**
 * ‏`chart` הוא אובייקט יחיד, מערך באורך ≤ 2, או `null` (C8) — מנורמל למערך לצרכן אחד.
 * ⚠️ **החיתוך ל-2 אינו "ליתר ביטחון"**: התקרה היא הכרעת-מוצר (C8), ודף עם שלושה גרפים
 * הוא תשובה שגויה של השרת. הוא נחתך ולא מוצג, כי גרף שלישי היה נראה תקין לחלוטין.
 */
export function normalizeCharts(chart) {
  if (!chart) return []
  return Array.isArray(chart) ? chart.slice(0, CHART_CAP) : [chart]
}

/**
 * קריאה למשטח. `fn` מגיע מ-`reportsCatalog` ואינו נבנה כאן מתבנית — שם שנגזר היה נשבר
 * בשקט מול המסד ביום שבו מיגרציה תיקרא אחרת.
 *
 * ⚠️ **ארבעת הפרמטרים עוברים תמיד, גם כשהם `null`.** לפונקציות במסד יש `default null`,
 * אבל השמטת מפתח מ-`supabase.rpc` היא הצורה שבה חתימה-שהשתנתה נעלמת בשקט: פרמטר שנשלח
 * ושמו השתנה מחזיר שגיאה קולנית, ופרמטר שלא נשלח מחזיר תשובה על התקופה הלא-נכונה.
 */
export async function callReport(rpcName, { from, to, customerId, drill } = {}) {
  const { data, error } = await supabase.rpc(rpcName, {
    p_from: from ?? null,
    p_to: to ?? null,
    p_customer_id: customerId ?? null,
    p_drill: drill ?? null,
  })
  if (error) throw toError(error, 'שגיאה בטעינת הדוח.')
  return assertReportShape(data)
}

/**
 * הכתיבה היחידה של המודול (§4.4): *"אשר להצגה"* של ריצת-סיווג-ההערות, גדורה `edit` על
 * `'דו"חות'` בגוף ה-RPC. **לעולם לא כתיבה ישירה מהלקוח.**
 *
 * 🔴 `data.ok !== true` אינו "הצלחה חלקית" — הוא חוזה שנשבר, ובמודול שמפרסם דוח למנכ"ל
 * אסור לו לעבור בשקט. אותה צורה בדיוק כמו `callWriteRpc` של מ8.
 */
export async function approveFeedbackAiRun(runId) {
  const fallback = 'אישור ריצת-הניתוח נכשל.'
  const { data, error } = await supabase.rpc('approve_feedback_ai_run', { p_run_id: runId })
  if (error) throw toError(error, error.message?.trim() || fallback)
  if (data?.ok !== true) {
    throw toError(
      { code: REPORT_SHAPE_DRIFT_CODE },
      `${fallback.replace(/\.$/, '')} — תשובת השרת לא הייתה תקינה.`,
    )
  }
  return data
}
