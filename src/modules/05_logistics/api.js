// שכבת ה-API של מודול 5 (לוגיסטיקה) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן.
// קומפוננטות ה-UI (פזה 3) מייבאות את הפונקציות האלה בלבד ולעולם לא קוראות ל-supabase.from(...)
// או supabase.rpc(...) בעצמן. הלוגיקה העסקית (תור, גלולות, ענבר, אוצר-המילים) חיה ב-
// src/lib/projectLogistics.js ו-src/lib/projects.js — כאן רק קלט/פלט מול ה-DB, כמו ב-
// src/modules/06_projects/api.js (מודול-הייחוס).
//
// 🔴 **כל כתיבה של מודול 5 היא ה-RPC `update_logistics_item` — אין ולו `.from().update()`/
// `.insert()`/`.delete()`/`.upsert()` אחד בקובץ הזה ובכל תיקיית המודול** (הכרעת-ישי ㉑ / AR-1).
// הנימוק נמדד ואינו טעם: שומר-הסטטוס של מודול 6 יושב **בתוך** `recompute_project_status` ועושה
// `return` מוקדם על פרויקט `cancelled`/`event_finished` (`🧱④`) ⇒ כתיבה ישירה **נוחתת בשקט** על
// שורה ש-§7.31 מגדיר כראיית-חיוב, ורק חישוב-הסטטוס מדולג. במסד עצמו אין אכיפה של כללי-הסטטוס של
// מ6 — היא חיה אך ורק בתוך ה-RPC, ושם אי-אפשר לעקוף אותה משום מסלול-קוד עתידי.
//
// 🚨 והכשל השקט של המודול (`🧱⑥`, §4.3 במדריך-המיקרו): `logistics` היא RLS-on. קריאה שנחסמה
// מחזירה **0 שורות עם `error: null`** — זהה-בייט ל"אין פריטים", ולכן שום `try/catch` לא יתפוס
// אותה. ⇒ ההבחנה בין "ריק כדין" ל"חסום" נעשית **אצל הקורא** (AR-3: ענף חוסר-ההרשאה ראשון, לפי
// הצלבת `projects` מול `logistics`), ולא כאן. הפונקציות כאן מחזירות `[]` **במכוון** ואינן
// מנחשות איזה משני המצבים קרה — ניחוש כאן היה מסתיר בדיוק את מה שהמסך צריך להבחין בו.
//
// 🔤 והודעות-השרת מוצגות כפי-שהן ולעולם לא משוחזרות (דפוס-הבית, `rpcErrorMessage` של מ6):
// ה-RPC זורק עברית גמורה בלשון-נקבה (㉜), וניסוח שני בצד-הלקוח היה יוצר שתי אמיתות לאותה
// שגיאה — בדיוק מה ש-AR-9 ("חוזה-בייט בין ה-raise לטקסט הלקוח") קיים כדי למנוע.

import { supabase } from '@/supabaseClient'
import { toError, RLS_DENIED_CODE } from '@/lib/apiError'
import { ACTIVE_PROJECT_STATUSES } from '@/lib/projects'
// ‏`WRITE_FAILURE_SENTENCE` — מחרוזת S-2 הנעולה (מדריך-המיקרו §3.7), **מיובאת ולא מנוסחת מחדש**:
// ‏§4.3 מורה במפורש שתשובה-בלי-שורה מוצגת *במחרוזת S-2*, ו-`countProductLines` הוא המבחין
// הנעול של שלושת מצבי-הריק (S-26) — שניהם כבר קיימים וכבר נעולים בבדיקה ב-`projectLogistics`.
import { WRITE_FAILURE_SENTENCE, countProductLines } from '@/lib/projectLogistics'
// ‏`rpcErrorMessage` — מיובאת ממ6 ולא משוכפלת (תקדים-הבית לייבוא חוצה-מודולים: מ6 מייבאת
// `writeInviteToken` ממ4). ⚠️ ‏`toRpcError` **אינה** מיוצאת שם, ולכן ההרכבה חוזרת כאן — אותה
// הרכבה בדיוק, לא נוסח שני.
import { rpcErrorMessage } from '@/modules/06_projects/api'
// ‏`getQuote` — המבחין של "ריק שבור" נשען על שורות-המוצר של ההצעה, ותקדים-הבית לקרוא אותן
// הוא לייבא את קריאת מודול 3 (‏`06_projects/LogisticsTab.jsx` עושה בדיוק זאת), ולא לכתוב
// שאילתה שנייה ל-`quotes` בתוך מודול 5.
import { getQuote } from '@/modules/03_quotes/api'

// ---- שגיאות-כתיבה ----

// מחזירה Error שהודעתו היא הודעת-השרת כפי-שהיא, ורק בהיעדרה (תקלת-רשת/timeout, שאין בה
// הודעה עברית) ניסוח-fallback. מיוצאת — בניגוד לתאומתה במ6 — כדי שלמיפוי תהיה בדיקת-יחידה
// (שם התפקיד הזה מולא ע"י ייצוא `rpcErrorMessage` עצמה).
export function toRpcError(error, fallbackMessage) {
  return toError(error, rpcErrorMessage(error, fallbackMessage))
}

// ---- חוזה המטען של ה-RPC (AS-8) ----

// ארבעת המפתחות שה-RPC מכיר — **העתק של הרשימה-הלבנה שבמיגרציה עצמה**
// (`20260826002447_module5_checklist_rpc.sql`, עוגן-גריפ `k not in (`). כל שינוי כאן בלי
// מיגרציה מקבילה שובר את החוזה בצד אחד.
// ‏AS-8 — **סמנטיקת מפתח-נוכח:** מפתח שנשלח נכתב; מפתח שלא נשלח אינו נוגע בערך הקיים.
// 🚫 ‏`actual_arrival_date` אינו ברשימה **בכוונה**: ה-RPC חותם אותו במעבר ל-`ready` ומוחק אותו
// ביציאה משם, והמסך לעולם אינו כותב אותו ידנית (M5-8 · ㊶).
export const LOGISTICS_CHANGE_KEYS = ['item_status', 'actual_qty', 'notes', 'expected_arrival_date']

// בונה את המטען שנשלח ל-`p_changes`.
// 🔴 מפתח זר ⇒ זריקה, ולא סינון-בשקט: סינון היה הופך באג-קוד ("שלחתי `qty` במקום `actual_qty`")
// ל"שמירה שהצליחה ולא שינתה כלום" — אותה משפחה בדיוק של הכשל השקט שהמודול נבנה נגדו.
// הניסוח זהה ל-raise של המיגרציה (AR-9) — שתי אמיתות לאותה שגיאה זה מה שהכלל מונע.
export function buildLogisticsChanges(changes) {
  const source = changes ?? {}
  const payload = {}
  for (const key of Object.keys(source)) {
    if (!LOGISTICS_CHANGE_KEYS.includes(key)) {
      throw toError(null, `שדה לא מוכר בבקשה (${key}) — העדכון לא בוצע.`)
    }
    // ‏`undefined` פירושו "לא נשלח" ואינו נכנס למטען. 🔴 ‏`null` **כן** נכנס — כך נמחק
    // `expected_arrival_date` (G9), ובאותה מידה `0` ומחרוזת ריקה הם ערכים לגיטימיים
    // (‏`actual_qty = 0` · הערה שנמחקה) ⇒ הבדיקה היא על `undefined` בלבד, לא על falsy.
    if (source[key] !== undefined) payload[key] = source[key]
  }
  // מטען ריק **נשלח כמות שהוא** ואינו נעצר כאן: ה-RPC זורק על כך `לא נשלח אף שינוי לשמירה.`,
  // וניסוח מקביל בצד-הלקוח היה מייצר בדיוק את הנוסח-השני ש-AR-9 אוסר.
  return payload
}

// מאמתת את מעטפת-ההחזרה של ה-RPC (G10: שני מפתחות בדיוק — `row` + `project_status`).
// 🚨 זו נקודת-ההבחנה של הכשל השקט בצד-הכתיבה: תשובת-הצלחה שאין בה שורה פירושה שהכתיבה לא
// נחתה, ובלי הבדיקה הזאת המסך היה מציג "נשמר" בלי שדבר השתנה (תקדים 02_customers: זריקת
// `RLS_DENIED` סינתטי — קוד שאינו מגיע מהמסד אלא **המסקנה שלנו** מתשובה ריקה).
// שני המפתחות נבנים באותו `jsonb_build_object` בשרת ⇒ מעטפת חצי-מלאה אינה תשובה של ה-RPC
// הזה כלל, ולכן שתי הבדיקות חולקות מסלול-כשל אחד.
// 🔤 וההודעה היא **`WRITE_FAILURE_SENTENCE` המיובאת** ולא ניסוח מקומי: §4.3 במדריך-המיקרו קובעת
// שזהו בדיוק המקרה שמוצג במחרוזת S-2, ושתי מחרוזות עבריות לאותו כשל הן מה ש-AR-9 מונע —
// אותו טעם בדיוק שבגללו הודעת-השרת מועברת כפי-שהיא ואינה משוחזרת כאן.
export function assertLogisticsUpdate(data) {
  const row = data?.row
  const isRow = Boolean(row) && typeof row === 'object' && !Array.isArray(row)
  const hasStatus = typeof data?.project_status === 'string' && data.project_status.length > 0
  if (!isRow || !hasStatus) {
    throw toError({ code: RLS_DENIED_CODE }, WRITE_FAILURE_SENTENCE)
  }
  return data
}

// ---- קריאות (Reads) — AR-3: שלוש קריאות ישירות, בלי RPC-קריאה חדש ----

// הפרויקטים הפעילים שמהם נבנה התור (משטח 1).
// 🔴 ‏`customer_name` נקרא מ-`projects` — עמודה מפורקת-נורמליזציה שנולדה בדיוק בשביל זה —
// ו**לעולם לא בצירוף ל-`customers`**: מנהלת הלוגיסטיקה חסומה על מודול 'לקוחות', והצירוף היה
// מחזיר `null` **בלי שגיאה** (אותה הכרעה בדיוק כמו ב-04_hostesses/api.js ו-06_projects/api.js).
// ⚠️ הסינון ל-`ACTIVE_PROJECT_STATUSES` נעשה **בשאילתה**, והרשימה מיובאת מ-`src/lib/projects.js` —
// לעולם לא רשימה מקומית (החוזה שירשנו ממ6, `🚧 מ5 ← מ6` פריט 3: הגדרה שנייה תסטה בשקט).
// 🚫 והמיון כאן הוא `project_id` **בכוונה, ולא לפי תאריך-האירוע**: מיון-התצוגה הוא לפי קרבת
// האירוע והוא נגזר בדפדפן (צעד 2.1). מיון-מסד שדומה לו היה מסתיר מסך ששכח למיין — בדיוק
// מלכודת "נתוני-בדיקה אחידים" של 30/07. כאן רק סדר דטרמיניסטי, כדי שצילומי-מסך לא ירצדו.
export async function listActiveProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('project_id, event_name, customer_name, final_event_date, project_status')
    .in('project_status', ACTIVE_PROJECT_STATUSES)
    .order('project_id')
  if (error) throw toError(error, 'שגיאה בטעינת הפרויקטים הפעילים.')
  return data ?? []
}

// שורות-הלוגיסטיקה של אותם פרויקטים, בקריאה אחת.
// מיון יציב: `sku` ואז `serial_number` (החלק השלישי במפתח הראשי) — תקדים `getProjectLogistics`
// במ6. 🚫 המיון התצוגתי בצ'קליסט הוא `sortLogisticsRows` (לפי מצב-הפריט), והוא בדפדפן.
// 🚨 רשימה ריקה כאן אינה מבדילה בין "אין פריטים" ל"אין הרשאה" (`🧱⑥`) — ההבחנה אצל הקורא.
export async function listLogisticsRows(projectIds) {
  // בלי פרויקטים אין למי לשאול: `.in()` על מערך ריק הוא סבב-רשת שתשובתו ידועה מראש.
  if (!projectIds?.length) return []
  const { data, error } = await supabase
    .from('logistics')
    .select('*')
    .in('project_id', projectIds)
    .order('sku')
    .order('serial_number')
  if (error) throw toError(error, 'שגיאה בטעינת שורות הלוגיסטיקה.')
  return data ?? []
}

// קטלוג-המוצרים — ‏`category` הוא מה שמכריע את סימון-הענבר (⑳: פריט פיזי בלבד; `site` פטור),
// ו-`item_name`/`unit` הם מה שהצ'קליסט מציג במקום מק"ט עירום.
// ‏`products_select_all_authenticated` הוא `using(true)` ⇒ אין כאן שער-הרשאה ואין כשל-שקט.
export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('sku, item_name, category, unit')
    .order('sku')
  if (error) throw toError(error, 'שגיאה בטעינת קטלוג המוצרים.')
  return data ?? []
}

// קריאת-הרענון של דיאלוג-הצ'קליסט (משטח 2).
// 🔴 ㊲ — הדיאלוג קורא את **סטטוס-הפרויקט מחדש בפתיחה** ואינו סומך על שורת-התור שממנה נלחץ:
// זה מסלול-הכניסה היחיד לווריאנט-המבוטל (㉝), כי פרויקט יכול להתבטל בין טעינת-התור ללחיצה.
// ‏`cancelled_at`/`cancel_reason` נקראים כאן ורק כאן — הבאנר של הווריאנט מציג אותם.
// 🔴 ‏`quoteProductLines` — **המבחין של שלושת מצבי-הריק במשטח 2** (כרטיס-המסך §④ + §⑨):
// בלעדיו הדיאלוג היה מצייר "לא הוזמנו מוצרים לאירוע הזה" על פרויקט שיש בו 150 תגים, כי
// קריאה שנחסמה ב-RLS מחזירה אפס שורות בלי שגיאה (`🧱⑥`). המבחין הזמין: להצעה שאושרה יש
// שורות-מוצר שאינן `hostess`, ואותן כן ניתן לקרוא ⇒ **שורות-מוצר בהצעה + אפס ב-`logistics`
// = תקלה, לא ריק כדין.** אותו מבחין בדיוק שמשמש את לשונית מ6 (`countProductLines`, S-26) —
// לא ניסוח שני. **שלושה מצבים ולא שניים** (דפוס "נשלח/לא-נשלח/לא-ידוע" של `email_log`):
// ‏`undefined` = לא נשאל כלל *(יש שורות — אין מה להבחין)* · `null` = ההצעה עצמה אינה קריאה
// ⇒ ענף חוסר-ההרשאה · מספר = כמה שורות-מוצר יש בהצעה *(0 ⇒ ריק כדין · >0 ⇒ ריק שבור)*.
export async function getChecklist(projectId) {
  if (!projectId) return { project: null, rows: [], quoteProductLines: undefined }
  const [project, rows] = await Promise.all([
    readChecklistProject(projectId),
    listLogisticsRows([projectId]),
  ])
  // ⚠️ הקריאה הנוספת נעשית **רק כשהרשימה ריקה** — כשיש שורות אין מה להבחין, וסבב-רשת שתשובתו
  // לא תיקרא הוא בדיוק מה שמוקש-הביצועים של המשטח (⏱️ §⑨) אומר לא לעשות בפתיחת-דיאלוג.
  const quoteProductLines =
    rows.length === 0 ? await countChecklistProductLines(project) : undefined
  return { project, rows, quoteProductLines }
}

// ‏`quote_id` הוא `not null` בסכמה (`docs/schema.sql`, עוגן-גריפ `projects_quote_id_fkey`) ⇒
// ענף ה-`0` כאן הוא הגנה ולא מסלול-חיים: פרויקט בלי הצעה אינו יכול להיוולד, ואילו כן —
// אין שורות-מוצר שיכלו להוליד לוגיסטיקה, כלומר ריק **כדין** ולא תקלה (אותה הכרעה כמו במ6).
// ‏`project === null` (חסום/לא-קיים) ⇒ אין את מי לשאול, והבאנר של הווריאנט ממילא לא ייבנה.
async function countChecklistProductLines(project) {
  if (!project?.quote_id) return 0
  const [quote, products] = await Promise.all([getQuote(project.quote_id), listProducts()])
  // ‏`countProductLines` מחזירה `null` כשההצעה אינה קריאה — זה **הסימן**, לא תקלה.
  return countProductLines(quote, products)
}

// 🚫 לא מיוצאת: היא חצי מ-㊲, וחצי-רענון (סטטוס בלי שורות, או להפך) הוא בדיוק המצב ש-㊲
// נועדה למנוע. הדלת היחידה החוצה היא `getChecklist`.
async function readChecklistProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    // ‏`quote_id` נקרא כאן ורק כאן — הוא הקלט של מבחין-מצבי-הריק שלמעלה (§⑨), ולא מוצג בשום מקום.
    .select(
      'project_id, event_name, customer_name, final_event_date, project_status, cancelled_at, cancel_reason, quote_id',
    )
    .eq('project_id', projectId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי הפרויקט.')
  return data ?? null
}

// ---- כתיבה (Write) — הכותב היחיד של המודול ----

// ‏`update_logistics_item` — ה-RPC של M5-6, החתימה מהמיגרציה:
// ‏`(p_project_id integer, p_sku text, p_serial_number integer, p_changes jsonb)`.
// 🔴 ‏`serial_number` הוא החלק השלישי במפתח הראשי — השמטתו אינה שגיאה אלא **עדכון שורה אחרת**.
// מחזירה את מעטפת G10 **כמות שהיא** (`{row, project_status}`): `project_status` נקרא בשרת
// **אחרי** הכתיבה, כשהטריגר של מ6 כבר רץ סינכרונית ⇒ באנר-ההשלמה (⑬) נבנה בלי סבב-רשת שני.
// כשל ⇒ **זריקה**, כדי שהדיאלוג יחזיר את הערך שעל המסך לקודמו ויציג את מחרוזת S-2; בליעה
// שקטה כאן הייתה משאירה על המסך ערך שלא קיים במסד.
export async function updateLogisticsItem({ projectId, sku, serialNumber, changes }) {
  const { data, error } = await supabase.rpc('update_logistics_item', {
    p_project_id: projectId,
    p_sku: sku,
    p_serial_number: serialNumber,
    p_changes: buildLogisticsChanges(changes),
  })
  if (error) throw toRpcError(error, 'שמירת עדכון הפריט נכשלה.')
  return assertLogisticsUpdate(data)
}
