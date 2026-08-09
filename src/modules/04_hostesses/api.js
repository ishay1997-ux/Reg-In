// שכבת השאילתות של מודול 4. **כל פנייה של המודול למסד עוברת מכאן** — אף קומפוננטה
// אינה מדברת עם `supabase` ישירות (כלל ברזל 14; מודול 1 מקדים את המוסכמה ולא הוסב).
// המבנה מחקה את `02_customers/api.js` ו-`03_quotes/api.js`, שהם מודולי-הייחוס.
//
// 🚨 **המלכודת המרכזית של הפרויקט חיה כאן:** טבלה עם RLS ובלי policy מתאימה מחזירה
// `{ data: null, error: null }` — כלומר **הצלחה ריקה**. לכן כל כתיבה עושה `.select()`
// ובודקת מספר-שורות, וכל קריאה מבדילה בין "השאילתה נכשלה" ל"אין שורות".
// ⚠️ נמדד 09/08/2026 שהמלכודת אמיתית גם אחרי מיגרציה D: הפלת שתי ה-policies החזירה
// **אפס שורות ובלי שגיאה**. החצי השני — שהמסך יאמר זאת — הוא של פזה 3.
//
// ⚠️ **מה עדיין אינו כאן, ולמה** *(09/08/2026)*: כתיבות **מחזור-חיי-השיבוץ** — יצירת
// זימונים, אישור-סופי והשחרור-האוטומטי שנלווה לו, וסימון אחראית-משמרת. שתי הכרעות
// שהן תנאי להן פתוחות ב-§7 במפורש: **§7.33** ("מנגנון-הכתיבה של השחרור לא נקבע") ו-
// **§7.41** (מרוץ `max+1` על `assignment_number` — מסומן 🔵 "להנהון בעת הבנייה").
// ⇒ הן נבנות בפזה 3, יחד עם המסך שמפעיל אותן ועם מנוע-המייל.

import { supabase } from '@/supabaseClient'
import { toError, assertRowsAffected } from '@/lib/apiError'
import { HOSTESS_PARAM_NAMES, hostessServerErrorMessage } from '@/lib/hostesses'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { buildHostessAddress } from '@/lib/geocode'
import { geocodeAddress } from '@/api/geocode'

// שגיאות-מסד מתורגמות **רק בכתיבות**, כמו במודול 3: בקריאה המחרוזת הגולמית (רשת/RLS)
// חסרת-ערך למשתמשת, ואילו בכתיבה היא נושאת מידע שאפשר לפעול לפיו — איזה אילוץ נשבר.
function toWriteError(error, fallbackMessage) {
  return toError(error, hostessServerErrorMessage(error) ?? fallbackMessage)
}

const ALL_PARAM_NAMES = [
  ...Object.values(SMART_MATCH_PARAM_NAMES),
  ...Object.values(HOSTESS_PARAM_NAMES),
]

// סטטוסי-הפרויקט שהמבט-על מציג. 🔴 **`ready` ומעלה אינם ברשימה במכוון** — פרויקט
// שאוייש יצא מרשימת-העבודה של מנהלת הגיוס; היא מסתכלת על מה שעוד חסר.
const OPEN_PROJECT_STATUSES = ['not_started', 'in_progress']

// ---- גאוקוד ----

// ממיר את כתובת הדיילת לקואורדינטות. **לעולם אינו זורק ולעולם אינו חוסם שמירה** —
// *"נכשל ⇒ נשמרת בכל מקרה ומסומנת"* (`spec.md §2.1(1)`).
// 🔴 ומחזיר `{lat:null,lng:null}` מפורש ולא `{}`: בעדכון-כתובת זו **מחיקה מכוונת** של
// קואורדינטה ישנה. קואורדינטה של הכתובת הקודמת גרועה מחוסר-קואורדינטה — החוסר מסומן
// על המסך, והשגויה נראית כמו עובדה ומזיזה את הדירוג בשקט.
async function resolveHostessCoordinates(source) {
  const query = buildHostessAddress(source)
  if (!query) return { lat: null, lng: null }
  return (await geocodeAddress(query)) ?? { lat: null, lng: null }
}

// ממלא קואורדינטות לאירוע בכניסה הראשונה למסך שלו, ושומר דרך הפונקציה הייעודית.
// 🔴 **הכתיבה אינה יכולה לעבור בטבלה עצמה:** ל-`projects` יש מדיניות **קריאה בלבד**
// מטעם מ4 (מיגרציה D), ומדיניות-כתיבה הייתה פותחת את **כל** עמודותיה — ר' המיגרציה
// `..._module4_project_coordinates_rpc.sql` לנימוק המלא.
//
// ⚠️ כשל מוחזר כ"בלי קואורדינטות" ואינו מפיל את המסך — **וזו אינה בליעה שקטה**:
// התוצאה **נראית** על השורה כצ'יפ `אין קואורדינטות`, שהוא מצב מאושר באפיון.
// מנהלת-פרויקטים (הרשאת-צפייה) תיפול כאן על 42501 בכוונה, ותראה בדיוק את זה.
async function ensureProjectCoordinates(project) {
  if (project.lat !== null && project.lng !== null) return null
  const coordinates = await geocodeAddress(project.final_location)
  if (!coordinates) return null

  const { error } = await supabase.rpc('set_project_coordinates', {
    p_project_id: project.project_id,
    p_lat: coordinates.lat,
    p_lng: coordinates.lng,
  })
  return error ? null : coordinates
}

// ---- קריאות (Reads) ----

// כל הדיילות + טווחי אי-הזמינות שלהן. המסננים והמיון העדין נעשים בצד-לקוח
// (עד 50 שורות — הכרעת-היקף מתועדת), אבל **הסט עצמו מסונן ע"י ה-RLS בשרת.**
// ⚠️ ‏`.order` שני על המפתח אינו קישוט: שמות זהים מחליפים מקום בין רענונים בלי
// שובר-שוויון יציב, וזו תקלה שכבר תועדה ב-`03_quotes/api.js`.
export async function listHostesses() {
  const { data, error } = await supabase
    .from('hostesses')
    .select('*, hostess_unavailability(*)')
    .order('full_name')
    .order('hostess_id')
  if (error) throw toError(error, 'שגיאה בטעינת מאגר הדיילות.')
  return data ?? []
}

// דיילת אחת לכרטיס (משטח 3ד).
export async function getHostess(hostessId) {
  const { data, error } = await supabase
    .from('hostesses')
    .select('*, hostess_unavailability(*)')
    .eq('hostess_id', hostessId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת כרטיס הדיילת.')
  return data ?? null
}

// המבט-על (משטח 1): הפרויקטים הפתוחים + שורות-השיבוץ שלהם.
// 🔴 **שם-הלקוח נלקח מ-`projects.customer_name` ולא בצירוף ל-`customers`** — מנהלת
// הגיוס **חסומה** על מודול 'לקוחות', והצירוף היה מחזיר `null` **בלי שגיאה** בשלושה
// מסכים מאושרים. זו בדיוק הסיבה שהעמודה נולדה (local-5, אותו דפוס כמו `event_name`).
// ⚠️ הסינון ל-`OPEN_PROJECT_STATUSES` נעשה **בשאילתה**, לא בדפדפן.
export async function listStaffingOverview() {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'project_id, event_name, customer_name, final_event_date, final_start_time, final_end_time, final_location, required_hostess_count, project_status, assignments(*)',
    )
    .in('project_status', OPEN_PROJECT_STATUSES)
    .order('final_event_date')
    .order('project_id')
  if (error) throw toError(error, 'שגיאה בטעינת רשימת האירועים לאיוש.')
  return data ?? []
}

// חומרי-הגלם של Smart Match לאירוע אחד (משטח 2).
// 🔴 **כל הדיילות נטענות, גם מי שתיפסל בשער** — `C` (ממוצע-החברה) מחושב עליהן, וסינון
// מוקדם היה משנה אותו ואת כל הדירוג. זו אותה הכרעה שנמדדה כמלכודת ב-§11.3.
// שאר הקריאות מסוננות בשרת: העדפות **של לקוח האירוע הזה**, ושיבוצים סופיים **בתאריך
// האירוע הזה** — בדיוק שני התנאים שהשער צריך, ולא יותר.
export async function getSmartMatchData(projectId) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      'project_id, event_name, customer_id, customer_name, final_event_date, final_start_time, final_end_time, final_location, required_hostess_count, lat, lng',
    )
    .eq('project_id', projectId)
    .maybeSingle()
  if (projectError) throw toError(projectError, 'שגיאה בטעינת פרטי האירוע.')
  if (!project) throw toError({ code: 'PGRST116' }, 'האירוע לא נמצא, או שאין לך הרשאה אליו.')

  // ⚠️ ההעדפות נשלפות רק כשיש `customer_id`: הוא **nullable**, ו-`.eq(…, null)` היה
  // מחזיר שגיאה במקום רשימה ריקה. 🚧 מ6 — הטבלה ריקה היום, וזה תקין.
  // ⏱️ הגאוקוד רץ **במקביל** לחמש השאילתות ולא לפניהן: הוא כרוך בעד ארבע פניות
  // לשירות חיצוני בשנייה אחת ביניהן, וסדרתית הוא היה מוסיף שניות לטעינת המסך.
  const [coordinates, hostessesRes, assignmentsRes, sameDayRes, preferencesRes, paramsRes] =
    await Promise.all([
      ensureProjectCoordinates(project),
      supabase.from('hostesses').select('*, hostess_unavailability(*)').order('hostess_id'),
      supabase
        .from('assignments')
        .select('*, projects(final_event_date, project_status, customer_id)'),
      supabase
        .from('assignments')
        .select('hostess_id, project_id')
        .eq('event_date', project.final_event_date)
        .eq('assignment_status', 'finally_approved'),
      project.customer_id
        ? supabase
            .from('customer_hostess_preference')
            .select('hostess_id, preference')
            .eq('customer_id', project.customer_id)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('params').select('param_name, param_value').in('param_name', ALL_PARAM_NAMES),
    ])

  if (hostessesRes.error) throw toError(hostessesRes.error, 'שגיאה בטעינת מאגר הדיילות.')
  if (assignmentsRes.error) throw toError(assignmentsRes.error, 'שגיאה בטעינת היסטוריית השיבוצים.')
  if (sameDayRes.error) throw toError(sameDayRes.error, 'שגיאה בבדיקת שיבוצים באותו תאריך.')
  if (preferencesRes.error) throw toError(preferencesRes.error, 'שגיאה בטעינת העדפות הלקוח.')
  if (paramsRes.error) throw toError(paramsRes.error, 'שגיאה בטעינת פרמטרי Smart Match.')

  return {
    // הקואורדינטות שזה-עתה נשמרו מוזגות לתוך האירוע שחוזר, כדי שהמסך הראשון
    // כבר יראה מרחקים — ולא רק הרענון הבא.
    project: coordinates ? { ...project, ...coordinates } : project,
    hostesses: hostessesRes.data ?? [],
    assignments: assignmentsRes.data ?? [],
    // מזהי הדיילות שכבר מאושרות סופית באותו יום — התנאי השני בשער.
    sameDayHostessIds: (sameDayRes.data ?? [])
      .filter((row) => row.project_id !== project.project_id)
      .map((row) => row.hostess_id),
    preferences: preferencesRes.data ?? [],
    params: Object.fromEntries((paramsRes.data ?? []).map((p) => [p.param_name, p.param_value])),
  }
}

// היסטוריית השיבוצים של דיילת אחת (כרטיס 3ד: "שיבוצים קרובים" + היסטוריה).
export async function getHostessAssignments(hostessId) {
  const { data, error } = await supabase
    .from('assignments')
    .select(
      '*, projects(project_id, event_name, customer_id, customer_name, final_event_date, final_start_time, final_location, project_status)',
    )
    .eq('hostess_id', hostessId)
    .order('project_id')
    .order('assignment_number')
  if (error) throw toError(error, 'שגיאה בטעינת השיבוצים של הדיילת.')
  return data ?? []
}

// הפרמטרים שמסכי מודול 4 צריכים.
// ⚠️ **פרמטר שלא חוזר אינו מקבל ברירת-מחדל כאן** — המסך מציג "—" או חוסם, ולא מספר
// מומצא. אותה הכרעה בדיוק כמו ב-`03_quotes/api.js`.
export async function getHostessScreenParams() {
  const { data, error } = await supabase
    .from('params')
    .select('param_name, param_value')
    .in('param_name', ALL_PARAM_NAMES)
  if (error) throw toError(error, 'שגיאה בטעינת הגדרות המערכת.')
  return Object.fromEntries((data ?? []).map((p) => [p.param_name, p.param_value]))
}

// ---- כתיבות (Writes) ----

// דיילת חדשה. 🔴 `status` אינו מתקבל מהקורא — בשמירה היא `פעילה` ונכנסת מיידית
// למאגר-המועמדות (`spec.md §2.1(1)`); שינוי-מצב עובר **רק** דרך `setHostessStatus`.
export async function createHostess(payload) {
  const coordinates = await resolveHostessCoordinates(payload)
  const { data, error } = await supabase
    .from('hostesses')
    .insert({ ...payload, ...coordinates, status: 'active' })
    .select()
    .single()
  if (error) throw toWriteError(error, 'שמירת הדיילת נכשלה.')
  return data
}

// עדכון דיילת קיימת.
// 🔴 `hostess_id` ו-`id_number` מוסרים הגנתית: ת"ז **נעולה בעריכה** (`screens-approved`),
// והמפתח אינו משתנה לעולם (§7.64). `status` מוסר כדי שבאג-UI לא יעקוף את הפונקציה
// הייעודית ואת חלון-הווידוא שלה — שכבת-הגנה נוספת, לא החומה (ה-RLS הוא החומה).
// ⚠️ תעריף שעודכן **אינו** משנה שיבוצים קיימים: הם מחזיקים `hourly_rate_snapshot`
// שהוקפא ברגע השיבוץ — "הבטחנו לה תעריף במייל, ומייל הוא הבטחה" (§א2).
export async function updateHostess(hostessId, patch) {
  const safePatch = { ...patch }
  delete safePatch.hostess_id
  delete safePatch.id_number
  delete safePatch.status

  // 🔴 כתובת שהשתנתה מחייבת קואורדינטה חדשה — או **אף אחת**. השארת הישנה הייתה
  // מצמידה לדיילת את המיקום של הדירה שממנה עברה, וזה נראה תקין לחלוטין במסך.
  // ⚠️ עדכון שאינו נוגע בכתובת (דירוג, תעריף, טלפון) אינו ממיר מחדש — "פעם אחת".
  if ('address' in safePatch || 'city' in safePatch) {
    Object.assign(safePatch, await resolveHostessCoordinates(safePatch))
  }

  const { data, error } = await supabase
    .from('hostesses')
    .update(safePatch)
    .eq('hostess_id', hostessId)
    .select()
  if (error) throw toWriteError(error, 'שמירת השינויים נכשלה.')
  assertRowsAffected(data, 'אין הרשאה לעדכן דיילת זו.')
  return data[0]
}

// השבתה/הפעלה — פונקציה ייעודית, כמו `setCustomerStatus` במודול 2.
// 🚫 **אין מחיקה בשום מקום** — תג-סטטוס, הפיך משני הכיוונים מאותו כפתור.
// ⚠️ חלון-הווידוא שמונה שיבוצים עתידיים בשם ובתאריך (§7.34↳) הוא **של המסך**, לא של
// השכבה הזו: ההכרעה בין "שחרר אותה" ל"היא תשלים" היא של המנהלת, ופה רק נכתב הסטטוס.
export async function setHostessStatus(hostessId, status) {
  const { data, error } = await supabase
    .from('hostesses')
    .update({ status })
    .eq('hostess_id', hostessId)
    .select()
  if (error) throw toWriteError(error, 'שינוי סטטוס הדיילת נכשל.')
  assertRowsAffected(data, 'אין הרשאה לשנות את סטטוס הדיילת.')
  return data[0]
}

// החלפת טווחי אי-הזמינות של דיילת (הטופס צובר אותם בזיכרון ושומר בפעולה אחת).
//
// 🔴 **‏insert-first, ואז מחיקה לפי מזהים — לעולם לא delete-then-insert.**
// זה לא סגנון: אותה תקלה קרתה **פעמיים באותו לילה** בפרויקט הזה (30/07), ובפעם השנייה
// **מחקה 5 מדרגות-מחיר אמיתיות מהמסד החי** כשהדפדפן נסגר בין שתי הבקשות. כאן המחיר
// היה זהה — טווחי אי-הזמינות הם התנאי החמישי בשער, ואיבודם מחזיר דיילת לרשימה בזמן
// שהיא בחו"ל. הסדר הזה מבטיח שכל כשל-רשת באמצע משאיר את הישן שלם או את החדש כתוב.
export async function replaceHostessUnavailability(hostessId, ranges) {
  const { data: existing, error: readError } = await supabase
    .from('hostess_unavailability')
    .select('unavailability_id')
    .eq('hostess_id', hostessId)
  if (readError) throw toWriteError(readError, 'טעינת טווחי אי-הזמינות נכשלה.')

  const staleIds = (existing ?? []).map((row) => row.unavailability_id)
  const rows = (ranges ?? []).map((range) => ({
    hostess_id: hostessId,
    start_date: range.start_date,
    end_date: range.end_date,
    note: range.note ?? null,
  }))

  if (rows.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('hostess_unavailability')
      .insert(rows)
      .select()
    if (insertError) throw toWriteError(insertError, 'שמירת טווחי אי-הזמינות נכשלה.')
    assertRowsAffected(inserted, 'אין הרשאה לעדכן אי-זמינות לדיילת זו.')
  }

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('hostess_unavailability')
      .delete()
      .in('unavailability_id', staleIds)
    if (deleteError) throw toWriteError(deleteError, 'מחיקת טווחי אי-הזמינות הישנים נכשלה.')
  }

  const { data, error } = await supabase
    .from('hostess_unavailability')
    .select('*')
    .eq('hostess_id', hostessId)
    .order('start_date')
    .order('unavailability_id')
  if (error) throw toError(error, 'שגיאה בטעינת טווחי אי-הזמינות.')
  return data ?? []
}
