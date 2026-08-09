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
import {
  HOSTESS_PARAM_NAMES,
  hostessServerErrorMessage,
  finalAssignmentRows,
  isInviteExpired,
} from '@/lib/hostesses'
import { classifySendError, EMAIL_SEND_RESULT } from '@/lib/email'
import { sendEmail } from '@/api/email'
import {
  SHIFT_TEMPLATE_NAMES,
  buildShiftInvitePayload,
  buildFinalApprovalPayload,
  buildReleasePayload,
  resolveShiftContact,
  confirmUrlFor,
} from '@/lib/shiftEmails'
import { nextAssignmentNumber, autoReleaseTargets } from '@/lib/assignmentActions'
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
// 🔴 **אבל הוא אינו כל הסינון של המסך, ואל תסיק מכאן שהוא כן:** אירוע שתאריכו **לפני היום**
// מסונן ב-`OverviewTab` דרך `isPastEvent`, ולא כאן. הסיבה שהוא אינו בשאילתה: "היום" הוא
// שעון-הדפדפן, ושאילתה שמשווה ל-`now()` של המסד הייתה נחתכת בשעה אחרת מזו שהמסך מציג.
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

// כל שורות-השיבוץ של המאגר, לשלוש הנגזרות שטבלת מסך 3 מציגה על **כל** שורה:
// מונה-הרבעון · תגי "לא ענתה" · והשיבוצים העתידיים שחלון-ההשבתה (§א4) מונה בשם.
//
// 🔴 **קריאה אחת ולא אחת-לכל-דיילת:** 50 דיילות היו הופכות ל-50 סיבובי-רשת לפני שהטבלה
// מצטיירת. הסט כולו קטן (מאגר של עד 50 דיילות × מעט אירועים), והוא **מסונן ע"י ה-RLS**
// בשרת בדיוק כמו כל קריאה אחרת.
// ⚠️ שולפים גם שורות ישנות במכוון — מונה-הרבעון ותגי-ההיענות **חייבים** היסטוריה;
// סינון לעתיד בלבד היה מרוקן את שתי העמודות בשקט.
export async function listRepositoryAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select(
      'project_id, hostess_id, assignment_number, assignment_status, invite_sent_at, projects(event_name, final_event_date)',
    )
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית השיבוצים.')
  return data ?? []
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

// ---- זימוני-משמרת (קריאה + כתיבה + מייל, יחד בכוונה) ----

// תבנית-מייל בודדת מ-`params`. 🚫 **לא מצטרפת ל-`ALL_PARAM_NAMES`** — המסכים טוענים את
// אלה בכל רינדור, והתבניות הן טקסט ארוך שנחוץ רק ברגע השליחה.
async function getEmailTemplate(name) {
  const { data, error } = await supabase
    .from('params')
    .select('param_value')
    .eq('param_name', name)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת תבנית המייל.')
  // 🔴 תבנית חסרה **עוצרת** ואינה נשלחת כגוף ריק: מייל ריק לדיילת גרוע ממייל שלא נשלח.
  if (!data?.param_value) throw toError({ code: 'PGRST116' }, `תבנית המייל "${name}" חסרה בהגדרות.`)
  return data.param_value
}

// "שלח שוב" — **הפעולה היחידה שכותבת למסד ממסך מבט-העל**, והיא זהה לפריט
// `שלח את הקישור שוב` שבתפריט-השורה (`screens-approved` מסך 4 §①): מרעננת טוקן
// ו-`invite_sent_at` **על אותה שורה** — בלי שורה חדשה, בלי סטטוס חדש, ובלי השפעה על
// הציון (`ממתין` מחוץ למכנה). 🚫 **ואינה נוגעת ב-`responded_at`** — הוא נכתב פעם אחת
// במענה הראשון, ורענון שהיה מאפס אותו היה מייצר **זמן-תגובה שלילי** (`§ב3`).
//
// ⚠️ **סדר הפעולות אינו סגנון:** קודם נכתב הטוקן ורק אחר-כך נשלח המייל. בסדר ההפוך
// הדיילת מקבלת קישור שאינו קיים במסד — כלומר קישור מת בוודאות.
// 🔴 **ובכשל-שליחה מגלגלים את `invite_sent_at` בלבד לאחור:** בלי זה השורה מציגה שעון-48
// שרץ מחדש **על מייל שמעולם לא יצא**, והמנהלת ממתינה לתשובה שלא תגיע. הטוקן החדש נשאר —
// הוא בלתי-מזיק, והישן ממילא כבר מת.
// 🚫 **פסק-זמן אינו כשל** (`src/CLAUDE.md`, שלושת מצבי-התוצאה): המייל אולי יצא, ולכן
// אין גלגול-אחורה — הספירה מוחזרת בנפרד והמסך אומר "לא ידוע" במקום להבטיח.
// כל שורות-השיבוץ של אירוע אחד, **עם כל מה שמייל צריך** — שם הדיילת, כתובתה, פרטי
// האירוע ואיש-הקשר שעליו. מסך 2 ותפריט-השורה עובדים שניהם על הסט הזה.
// ⚠️ **גם שורות-היסטוריה נשלפות** (`assignment_number` ישנים): הקיפול ל"שורה קובעת" הוא
// של הקוד, ושליפה מסוננת-מראש הייתה מסתירה בדיוק את הסירוב שנעקף בטלפון.
// 🔒 **פנימית בכוונה, ולא מיוצאת:** המסך מקבל את השורות מ-`getSmartMatchData` בקריאה אחת;
// הפונקציה הזו קיימת כדי שהכתיבות יעבדו על **מצב טרי מהמסד** ולא על מה שהוחזק בזיכרון —
// ייצואה הייתה מזמינה מסך לטעון פעמיים את אותו דבר ולהציג שני מצבים שונים.
async function listProjectAssignments(projectId) {
  const { data, error } = await supabase
    .from('assignments')
    .select(
      '*, hostesses(hostess_id, full_name, email, phone), projects(project_id, event_name, final_event_date, final_start_time, final_end_time, final_location, required_hostess_count, owner_name, owner_phone)',
    )
    .eq('project_id', projectId)
    .order('hostess_id')
    .order('assignment_number')
  if (error) throw toError(error, 'שגיאה בטעינת השיבוצים של האירוע.')
  return data ?? []
}

// שלוש התוצאות של שליחה, במקום אחד. **`unknown` אינו כשל** (`src/CLAUDE.md`): המייל אולי
// יצא, ודיווח "נכשל" היה גורם למנהלת לשלוח שוב — כלומר הדיילת מקבלת שני זימונים.
const emptyOutcome = () => ({ sent: 0, unknown: 0, failed: 0 })

// 🔴 **הליבה המשותפת ל"שלח את הקישור שוב" בשני המסכים** — הכפתור הצובר של מבט-העל,
// והפריט בתפריט-השורה. `screens-approved` מסך 4 §➕ אומר במפורש שהן *"אותה פעולה בדיוק"*,
// ושני עותקים היו מתפצלים בשקט ברגע שאחד מהם יתוקן.
//
// ⚠️ **סדר הפעולות אינו סגנון:** קודם נכתב הטוקן ורק אחר-כך נשלח המייל. בסדר ההפוך
// הדיילת מקבלת קישור שאינו קיים במסד — כלומר קישור מת בוודאות.
// 🔴 **ובכשל-שליחה מגלגלים את `invite_sent_at` בלבד לאחור:** בלי זה השורה מציגה שעון-48
// שרץ מחדש **על מייל שמעולם לא יצא**, והמנהלת ממתינה לתשובה שלא תגיע. הטוקן החדש נשאר —
// הוא בלתי-מזיק, והישן ממילא כבר מת.
async function refreshInviteAndSend(row, { template, origin, nowIso }) {
  const token = crypto.randomUUID()
  const payload = buildShiftInvitePayload({
    template,
    hostess: row.hostesses,
    project: row.projects,
    hourlyRate: row.hourly_rate_snapshot,
    confirmUrl: confirmUrlFor(origin, token),
  })
  // דיילת בלי כתובת-מייל אינה עוצרת את השאר — היא נספרת ככשל ונאמרת בקול.
  if (!payload) return 'failed'

  const previousSentAt = row.invite_sent_at
  const { data: updated, error: updateError } = await supabase
    .from('assignments')
    .update({ invite_token: token, invite_sent_at: nowIso })
    .eq('project_id', row.project_id)
    .eq('hostess_id', row.hostess_id)
    .eq('assignment_number', row.assignment_number)
    .select()
  if (updateError || !updated?.length) return 'failed'

  try {
    await sendEmail({
      payload,
      entityType: 'shift',
      // ⚠️ `entity_id` הוא **הפרויקט** ולא השיבוץ: ל-`assignments` מפתח משולש ואין לו
      // מזהה-עמודה-אחת, והעמודה כאן היא `integer`. מי קיבל נשמר ב-`recipient`.
      // 🔑 ואין כאן אובדן-הגנה: שליחה חוזרת של זימון **מותרת במפורש** (`§ב4`), ולכן
      // היומן הזה הוא תיעוד ולא שער — בשונה מהצעת-מחיר.
      entityId: row.project_id,
      templateName: SHIFT_TEMPLATE_NAMES.invite,
    })
    return 'sent'
  } catch (sendError) {
    // 🚫 פסק-זמן אינו כשל: אין גלגול-אחורה, כי המייל אולי כן יצא.
    if (classifySendError(sendError) === EMAIL_SEND_RESULT.UNKNOWN) return 'unknown'
    await supabase
      .from('assignments')
      .update({ invite_sent_at: previousSentAt })
      .eq('project_id', row.project_id)
      .eq('hostess_id', row.hostess_id)
      .eq('assignment_number', row.assignment_number)
    return 'failed'
  }
}

// "שלח שוב" — **הפעולה היחידה שכותבת למסד ממסך מבט-העל**, והיא זהה לפריט
// `שלח את הקישור שוב` שבתפריט-השורה: מרעננת טוקן ו-`invite_sent_at` **על אותה שורה** —
// בלי שורה חדשה, בלי סטטוס חדש, ובלי השפעה על הציון (`ממתין` מחוץ למכנה).
// 🚫 **ואינה נוגעת ב-`responded_at`** — הוא נכתב פעם אחת במענה הראשון, ורענון שהיה מאפס
// אותו היה מייצר **זמן-תגובה שלילי** (`§ב3`).
export async function resendExpiredInvites(projectIds, origin) {
  if (!projectIds?.length) return emptyOutcome()

  const nowIso = new Date().toISOString()
  const template = await getEmailTemplate(SHIFT_TEMPLATE_NAMES.invite)

  // ⚠️ נשלפות **כל** שורות הפרויקטים ולא רק ה-`pending`: הסטטוס הקובע הוא של
  // `MAX(assignment_number)` פר-דיילת, ושליפה מסוננת-מראש הייתה מרעננת קישור של שורה
  // ישנה שכבר נעקפה בשורה חדשה.
  const { data, error } = await supabase
    .from('assignments')
    .select(
      'project_id, hostess_id, assignment_number, assignment_status, invite_sent_at, hourly_rate_snapshot, hostesses(full_name, email), projects(event_name, final_event_date, final_start_time, final_end_time, final_location)',
    )
    .in('project_id', projectIds)
  if (error) throw toError(error, 'שגיאה בטעינת הזימונים לשליחה חוזרת.')

  const targets = finalAssignmentRows(data ?? []).filter((row) => isInviteExpired(row, nowIso))

  const outcome = emptyOutcome()
  for (const row of targets) {
    outcome[await refreshInviteAndSend(row, { template, origin, nowIso })] += 1
  }
  return outcome
}

// רענון קישור על **שורה אחת** — פריט `שלח את הקישור שוב` בתפריט-השורה.
// 🔑 אותה פונקציה בדיוק שמפעילה את הכפתור הצובר; ההבדל היחיד הוא כמה שורות נכנסות אליה.
export async function resendInvite(row, origin) {
  const template = await getEmailTemplate(SHIFT_TEMPLATE_NAMES.invite)
  const outcome = emptyOutcome()
  outcome[
    await refreshInviteAndSend(row, { template, origin, nowIso: new Date().toISOString() })
  ] += 1
  return outcome
}

// 🔴 **"שלח מייל תיאום" ו"פתח זימון חדש" הן אותה פעולה בדיוק — יצירת שורה חדשה —
// ולכן מימוש אחד.** ⚠️ **ואל תאחד אותה עם `resendInvite`:** שם מתרענן טוקן על אותה שורה,
// כאן נולדת **שורה שנייה** והישנה נשארת כהיסטוריה. איחוד היה מוחק סירוב שקדם, וההיענות
// היא **40% מהציון** — כלומר הדירוג היה משתנה בלי שאף בדיקה תיפול.
//
// 🔴 **`hourly_rate_snapshot` מוקפא כאן ולא נקרא מאוחר יותר** (`§א2`): *"הבטחנו לה תעריף
// במייל, ומייל הוא הבטחה"*. עדכון תעריף במאגר מחר אינו משנה זימון שכבר יצא.
// ⚠️ **`event_date` אינו נכתב כאן** — טריגר `assignments_sync_event_date` ממלא אותו
// מ-`projects.final_event_date` בכל insert, וכתיבה ידנית הייתה יכולה לסתור אותו.
export async function createShiftInvites({ projectId, hostessIds, origin }) {
  if (!hostessIds?.length) return emptyOutcome()

  const nowIso = new Date().toISOString()
  const template = await getEmailTemplate(SHIFT_TEMPLATE_NAMES.invite)

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      'project_id, event_name, final_event_date, final_start_time, final_end_time, final_location',
    )
    .eq('project_id', projectId)
    .maybeSingle()
  if (projectError) throw toError(projectError, 'שגיאה בטעינת פרטי האירוע.')
  if (!project) throw toError({ code: 'PGRST116' }, 'האירוע לא נמצא, או שאין לך הרשאה אליו.')

  const { data: hostesses, error: hostessError } = await supabase
    .from('hostesses')
    .select('hostess_id, full_name, email, hourly_rate')
    .in('hostess_id', hostessIds)
  if (hostessError) throw toError(hostessError, 'שגיאה בטעינת פרטי הדיילות.')

  const outcome = emptyOutcome()
  for (const hostess of hostesses ?? []) {
    const inserted = await insertInviteRow({ project, hostess, nowIso })
    if (!inserted) {
      outcome.failed += 1
      continue
    }
    outcome[
      await refreshInviteAndSend(
        { ...inserted, hostesses: hostess, projects: project },
        { template, origin, nowIso },
      )
    ] += 1
  }
  return outcome
}

// 🔴 **`max+1` עם ניסיון-חוזר אחד** (§7.41↳). המפתח הראשי הוא
// `(project_id, hostess_id, assignment_number)` ⇒ שני כותבים שחישבו את אותו מספר —
// **השני מקבל `23505` ונעצר בקול.** זה בדיוק מה שהופך את המרוץ ללא-מסוכן: אין דריסה
// שקטה, ורק צריך לחשב מחדש ולנסות שוב. **פעם אחת** — כישלון שני אינו מרוץ אלא תקלה.
async function insertInviteRow({ project, hostess, nowIso, attempt = 0 }) {
  const { data: existing, error: readError } = await supabase
    .from('assignments')
    .select('project_id, hostess_id, assignment_number')
    .eq('project_id', project.project_id)
    .eq('hostess_id', hostess.hostess_id)
  if (readError) return null

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      project_id: project.project_id,
      hostess_id: hostess.hostess_id,
      assignment_number: nextAssignmentNumber(
        existing ?? [],
        project.project_id,
        hostess.hostess_id,
      ),
      assignment_status: 'pending',
      hourly_rate_snapshot: hostess.hourly_rate,
      invite_sent_at: nowIso,
    })
    .select()
    .maybeSingle()

  if (error?.code === '23505' && attempt === 0) {
    return insertInviteRow({ project, hostess, nowIso, attempt: 1 })
  }
  return error ? null : data
}

// ---- אישור סופי, והשחרור שנוסע איתו ----

// 🔴 **פעולה אחת ולא שתיים** (`local-13`): האישור הסופי והשחרור-האוטומטי יוצאים יחד,
// **מהקוד ולא מטריגר** — כי לשחרור נלווה **מייל משלו**, וטריגר במסד אינו שולח מיילים.
// היה זה טריגר, השחרור היה קורה וההודעה עליו לא — והדיילת שאמרה "כן" לא הייתה שומעת כלום.
//
// ⚠️ **כפל-תאריך נחסם במסד ולא כאן** (`§ב5`, *"אסור שזה יקרה"*): האינדקס
// `assignments_one_event_per_day` מחזיר `23505`, ‏`hostessServerErrorMessage` מתרגם לעברית,
// **והשורה נשארת במצבה הקודם** — כי הכתיבה כלל לא עברה.
// 🚫 **ועודף-כמות אינו נחסם כאן בכלל** — הוא אזהרה שהמסך מציג *לפני* הקריאה (`quotaNotice`).
// 🚫 **ו-M4 לעולם אינו כותב `projects.project_status`** — המעבר ל"מוכן לביצוע" הוא של
// מודול 6 (`🚧 מ6 ← מ4`), למרות ש-`processes-approved.md:270` עדיין אומר אחרת.
// ⚠️ **בלי `origin`** — למייל האישור-הסופי אין קישור: ההחלטה כבר התקבלה, ואין מה לאשר.
export async function approveFinalAndRelease({ projectId, hostessIds }) {
  const result = { approved: [], failed: [], released: [], mail: emptyOutcome() }
  if (!hostessIds?.length) return result

  const rows = await listProjectAssignments(projectId)
  const deciding = finalAssignmentRows(rows)
  const project = deciding[0]?.projects ?? rows[0]?.projects ?? null

  const approvedIds = []
  for (const hostessId of hostessIds) {
    const row = deciding.find((candidate) => candidate.hostess_id === hostessId)
    if (!row) continue

    const { data, error } = await supabase
      .from('assignments')
      .update({ assignment_status: 'finally_approved' })
      .eq('project_id', row.project_id)
      .eq('hostess_id', row.hostess_id)
      .eq('assignment_number', row.assignment_number)
      .select()
    // 🔴 `!data?.length` בלי `error` הוא **חסימת-RLS** — הכשל השקט של הפרויקט. שורה שלא
    // עודכנה **אינה** מדווחת כהצלחה, אחרת המסך היה מציג "אושרה" על אירוע שנשאר חסר.
    if (error || !data?.length) {
      result.failed.push({
        name: row.hostesses?.full_name ?? '',
        message:
          hostessServerErrorMessage(error) ??
          (error ? 'האישור הסופי נכשל.' : 'אין הרשאה לאשר את הדיילת הזו.'),
      })
      continue
    }
    result.approved.push(row.hostesses?.full_name ?? '')
    approvedIds.push(hostessId)
  }

  // המייל נשלח **אחרי** שכל האישורים נכתבו: איש-הקשר במייל תלוי במי שאושרה (אחראית
  // משמרת), ושליחה תוך-כדי הייתה מדפיסה איש-קשר שונה לדיילות של אותו אירוע.
  if (approvedIds.length) {
    result.mail = await sendFinalApprovalMails({ projectId, hostessIds: approvedIds })
  }

  // ⚠️ נקרא **מחדש** מהמסד ולא מהסט שבזיכרון: המכסה נמדדת אחרי הכתיבות, ובדיקה על
  // נתונים ישנים הייתה משחררת מוקדם מדי — או לא משחררת בכלל.
  const refreshed = await listProjectAssignments(projectId)
  const targets = autoReleaseTargets(refreshed, project?.required_hostess_count)
  for (const target of targets) {
    const released = await releaseAssignment(target, { silent: true })
    if (released) result.released.push(target.hostesses?.full_name ?? '')
  }

  return result
}

// מייל האישור-הסופי — **פרטי האירוע המלאים ואיש-הקשר בשטח.**
// 🔴 **`resolveShiftContact` מחזיר `null` כשחסר שם או טלפון, והשליחה נעצרת** — עדיף
// שהמנהלת תראה "לא נשלח" מאשר שדיילת תקבל *"טלפון: "* ריק ותתקשר לאף אחד.
async function sendFinalApprovalMails({ projectId, hostessIds }) {
  const template = await getEmailTemplate(SHIFT_TEMPLATE_NAMES.finalApproval)
  const rows = await listProjectAssignments(projectId)
  const deciding = finalAssignmentRows(rows)

  const leadRow = deciding.find((row) => row.is_shift_lead)
  const project = deciding[0]?.projects ?? null
  const contact = resolveShiftContact({ project, shiftLead: leadRow?.hostesses ?? null })

  const outcome = emptyOutcome()
  for (const hostessId of hostessIds) {
    const row = deciding.find((candidate) => candidate.hostess_id === hostessId)
    const payload = buildFinalApprovalPayload({
      template,
      hostess: row?.hostesses,
      project,
      contact,
    })
    if (!payload) {
      outcome.failed += 1
      continue
    }
    try {
      await sendEmail({
        payload,
        entityType: 'shift',
        entityId: projectId,
        templateName: SHIFT_TEMPLATE_NAMES.finalApproval,
      })
      outcome.sent += 1
    } catch (sendError) {
      outcome[classifySendError(sendError) === EMAIL_SEND_RESULT.UNKNOWN ? 'unknown' : 'failed'] +=
        1
    }
  }
  return outcome
}

// ---- כתיבות תפריט-השורה ----

// עדכון-סטטוס **רושם בלבד** — `סמן: אישרה זמינות` · `סמן: סירבה` · `סמן: ביטלה אחרי אישור`.
// 🔑 **קיימות כי לדיילת אין אפליקציה:** לכל מצב שהקישור מייצר חייב להיות מסלול-מנהלת
// מקביל (`screens-approved` מסך 4 §②). **אף אחת מהן אינה שולחת מייל.**
// 🚫 **ו-`responded_at` אינו נכתב כאן** — הוא מודד את זמן-התגובה של **הדיילת דרך הקישור**;
// עדכון ידני של המנהלת אינו מענה שלה, ורישומו היה מזייף את זווית "תענה הכי מהר".
export async function markAssignmentStatus(row, status) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ assignment_status: status })
    .eq('project_id', row.project_id)
    .eq('hostess_id', row.hostess_id)
    .eq('assignment_number', row.assignment_number)
    .select()
  if (error) throw toWriteError(error, 'עדכון הסטטוס נכשל.')
  assertRowsAffected(data, 'אין הרשאה לעדכן את השיבוץ הזה.')
  return data[0]
}

// שחרור — `שחרר — המשרה אוישה` (ידני) וגם השחרור-האוטומטי (`§ב6`).
// 🔴 **ושחרור אינו "ביטלה אחרי אישור", אף שעל המסך הם נראים דומים:** שחרור = **אנחנו**
// ויתרנו עליה ⇒ **מחוץ לציון לגמרי**; ביטול = **היא** חזרה בה ⇒ נספרת באמינות ב-`0.5`.
// פריט אחד לשתיהן היה מזייף את הדירוג של דיילת חפה-מפשע.
export async function releaseAssignment(row, { silent = false } = {}) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ assignment_status: 'released' })
    .eq('project_id', row.project_id)
    .eq('hostess_id', row.hostess_id)
    .eq('assignment_number', row.assignment_number)
    .select()

  if (error || !data?.length) {
    // ⚠️ בשחרור-האוטומטי כשל אינו מפיל את האישור שכבר נכתב — הוא מדווח למסך כמספר.
    if (silent) return null
    if (error) throw toWriteError(error, 'השחרור נכשל.')
    assertRowsAffected(data, 'אין הרשאה לשחרר את השיבוץ הזה.')
  }

  // 🔑 ההודעה נוסעת עם הפעולה, ולא "אחר-כך": מי שאמרה "כן" ולא שמעה כלום מפסיקה לענות,
  // **וההיענות היא 40% מהציון** — כלומר שתיקה שלנו נרשמת כחוסר-אמינות שלה.
  try {
    const template = await getEmailTemplate(SHIFT_TEMPLATE_NAMES.release)
    const payload = buildReleasePayload({
      template,
      hostess: row.hostesses,
      project: row.projects,
    })
    if (payload) {
      await sendEmail({
        payload,
        entityType: 'shift',
        entityId: row.project_id,
        templateName: SHIFT_TEMPLATE_NAMES.release,
      })
    }
  } catch {
    // הסטטוס כבר נכתב; כשל-מייל אינו מחזיר אותו אחורה — השורה משוחררת בפועל, והמסך
    // מדווח על המייל בנפרד. גלגול-אחורה כאן היה מחזיר דיילת לתקן שכבר אינו קיים.
  }

  return data?.[0] ?? null
}

// ★ אחראית משמרת — **רושם בלבד, בלי מייל.** אחת לאירוע, ורק אחרי אישור סופי (`§ב5`).
// ⚠️ **הייחוד נאכף במסד** (`assignments_one_shift_lead_per_project`), והמסך מכבה-ומנמק
// את הפריט כשכבר יש אחת — כדי שהלחיצה לא תיפול על אילוץ במקום להסביר.
export async function setShiftLead(row, isShiftLead) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ is_shift_lead: isShiftLead })
    .eq('project_id', row.project_id)
    .eq('hostess_id', row.hostess_id)
    .eq('assignment_number', row.assignment_number)
    .select()
  if (error) throw toWriteError(error, 'סימון אחראית המשמרת נכשל.')
  assertRowsAffected(data, 'אין הרשאה לסמן אחראית משמרת.')
  return data[0]
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
