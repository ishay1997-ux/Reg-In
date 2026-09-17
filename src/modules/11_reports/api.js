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

/**
 * 🚪 **ערכי `rows[].drill_key.kind` שיש להם מסך לפתוח** (C8 · הכרעה 19).
 *
 * 🔴 **למה רשימה ולא "כל `drill_key` פותח":** נמדד 16/09/2026 שהשדה נושא גם מפתחות שאין
 * להם יעד — `{sku:…}` במ12, ו-`cards-finance ⑧12.1` מצהיר במפורש ש**יעד-הקידוח של ה-sku
 * אינו מסך קיים**. שורה שנראית לחיצה ואינה מובילה לשום מקום היא *"סמן-מת"* ש-📐14ב③ אוסר.
 * ⚠️ **ומפתחות שהם שלב-קידוח ולא יעד** (`year` · `month` · `tier` · `bucket`) אינם כאן
 * בכוונה: הם נוסעים ב-`p_drill` ונשארים בתוך אותו דוח.
 * ‏`quote` **כן** כאן *(נוסף 16/09/2026)*: הוא היעד היחיד של שורת-מ4 — `cards-management`
 * שורה 8, *"יעד-הקידוח היחיד: הצעת-המחיר"* — ונמדד ב-⁦50⁩ שורות בכל מטען-מ4 חי. היעד הוא
 * **מסך-ההצעה עצמה** (`/quotes/:quoteId/edit`, `App.jsx`) ולא רשימת-ההצעות: רשימה אינה
 * יכולה לקשר להצעה אחת, וזו בדיוק אותה חצי-דלת שנרשמה על `hostess`.
 *
 * 📍 **ולמה כאן ולא ליד הרכיב שצורך אותו:** קובץ-רכיב אינו רשאי לייצא לא-רכיב
 * (‏`react-refresh/only-export-components` הוא **שגיאה** בשער הריפו), והמקום השני שבו
 * חוזה-C8 כבר חי הוא הקובץ הזה — לצד `REPORT_REQUIRED_KEYS`.
 * 🔑 **שני הצרכנים מייבאים את אותה רשימה:** ‏`ReportSurface` מחליט לפיה אם השורה היא דלת,
 * ו-`ReportsPage` מנתב לפיה — **הוספת יעד היא שורה אחת, ושני הצדדים זזים יחד.**
 */
export const ROW_DOOR_KINDS = Object.freeze(['project', 'customer', 'hostess', 'quote'])

/**
 * 🚪 **סימן חיובי ש"זו ירידת-רמה ולא דלת-ישות"** — נמסר כ**ארגומנט שלישי**:
 * ‏`onDrill(drillKey, row, DRILL_INTENT)`.
 *
 * 🔴 **הפגם הסמוי שהוא סוגר, נמדד ע"י סוכן-ה-E2E 16/09/2026 ומחכה ליום שבו ה-RPC ישתנה:**
 * ברמת-הדלי של מ9 השורות נושאות `drill_key = { kind: 'customer', bucket: 'd90p',
 * customer_id: 401 }` — ‏`kind` שנמצא **ברשימת-הדלתות**, עם המזהה תחת `customer_id` ולא
 * `id`. היום הלחיצה יורדת רמה **רק** כי `next.id` חסר, כלומר הנכונות נשענת על **היעדר
 * שדה**. ברגע שה-RPC יוסיף `id` — אותה לחיצה בדיוק תנווט לכרטיס-הלקוח במקום לרדת רמה,
 * ‏**ושום בדיקה לא תאדים.**
 *
 * 🔑 **ולמה ארגומנט ולא שדה בתוך האובייקט:** האובייקט הזה **נכתב לכתובת** (`?drill=`)
 * ומשם נשלח כ-`p_drill` ל-RPC. שדה-תצוגה בתוכו היה מחייב למחוק אותו לפני כל כתיבה —
 * מחיקה אחת שנשכחת שולחת לשרת מפתח שאינו מכיר, כלומר **החלפנו כשל-שקט אחד באחר**.
 * הארגומנט חי בקריאה בלבד ואינו נוגע בשום מצב.
 * ⚠️ **והמחיר, מוצהר:** לשונית שתעטוף את `onDrill` ותשמיט את הארגומנט השלישי תחזיר את
 * ההתנהגות הישנה **בשקט**. היום כל ארבע הלשוניות מוסרות אותו **כפי שהתקבל** ובמפורש
 * (`tabs/executive/surfaceKit.jsx`: *"נמסרים לשלד כפי שהתקבלו, בלי עטיפה"*) —
 * ‏**וזה ניתן לבדיקה:** `grep -n "onDrill" src/modules/11_reports/tabs/` מראה מסירה ישירה.
 */
export const DRILL_INTENT = 'level'

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

// 📐 **תקרת-הגרפים לדף: ארבעה** ✏️ *(היה 2 · הועלה 16/09/2026, §9 D-28)*.
//
// 🔴 **שני מקורות מאושרים סתרו זה את זה, וזו ההכרעה ביניהם — לא שינוי שקט:**
// · ‏`spec.md ⏳10` קובע *"‏2 לדף"* — ‏**והמדידה שמאחוריו רצה על ארבעת דפי-הכספים בלבד.**
// · ‏**הכרעת-ישי ✅4** *("מבנה · סדר · אילו אריחים/גרפים/טבלאות ⇐ המוקאפ")* **מאוחרת יותר**,
//   והמוקאפ המאושר של מ20 (`05_tab_customers_approved.html`) מצייר **ארבעה** גרפים —
//   ו-📑ב#17 אף **אוסר** לאחד את שני גרפי-הסיבות, כלומר אין דרך לרדת לשניים בלי לאבד תוכן.
// · ‏**וגם C8 עצמו כבר תוקן לכיוון הזה** (תוספת 16/09): *"‏‎≤ 2 היא מדידת ⏳10 על דפי-הכספים
//   בלבד; דף שהמוקאפ המאושר שלו מצייר יותר (מ20: ארבעה) מחזיר את כולם כמערך"*.
// ⇒ **התקרה עולה ל-4 ואינה נמחקת:** היא עדיין שער-צורה מול תשובת-שרת שהשתגעה, ו-4 הוא
// המספר שהמוקאפ המאושר הגבוה ביותר מצייר. **שאלת-קונפליקט לשולחן-הבוקר של ישי, לא הכרעה שלי.**
const CHART_CAP = 4

/**
 * ‏`chart` הוא אובייקט יחיד, מערך באורך ≤ `CHART_CAP`, או `null` (C8) — מנורמל למערך לצרכן אחד.
 * ⚠️ **החיתוך אינו "ליתר ביטחון"**: התקרה היא הכרעת-מוצר (ר' למעלה), ודף עם חמישה גרפים
 * הוא תשובה שגויה של השרת. הוא נחתך ולא מוצג, כי גרף חמישי היה נראה תקין לחלוטין.
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
