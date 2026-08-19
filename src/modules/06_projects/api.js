// שכבת ה-API של מודול 6 (פרויקטים) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן.
// קומפוננטות ה-UI (Phase 3) מייבאות את הפונקציות האלה בלבד ולעולם לא קוראות ל-supabase.from(...)
// או supabase.rpc(...) בעצמן. הלוגיקה העסקית (תוויות, מדדים, gapSentence) חיה ב-src/lib/projects.js —
// כאן רק קלט/פלט מול ה-DB, כמו ב-02_customers/api.js (מודול-הייחוס).
//
// 🔴 כל כתיבה של מודול 6 היא RPC, לא UPDATE/INSERT ישיר על טבלה — `projects` אין לה policy-כתיבה
// כלל, ו-`logistics`/`project_changes` כתיבתן דרך פונקציות בלבד (`docs/schema.sql:1032`,
// `module-6.md` §4.2-4.3). כל RPC כזה הוא SECURITY DEFINER שבודק הרשאה בעצמו וזורק
// `raise exception` בעברית גמורה כשהיא נדחית (§4.3) — ⇒ בניגוד לתבנית AS-6 של 02_customers
// (UPDATE ישיר שחוזר 0-שורות-בלי-שגיאה בחסימת-RLS), כאן אין "הצלחה-ריקה" אפשרית: המסד מדבר.
// לכן העוטף כאן (`rpcErrorMessage`) מציג את `error.message` של השרת כפי-שהוא ולא משחזר אותו
// (`↳ as-built 14/08/2026 ⑤` בצעד 2.5: "the client displays the server's message; it does not
// reconstruct it") — ורק כשאין הודעה (תקלת-רשת/timeout) נופל לניסוח כללי.

import { supabase } from '@/supabaseClient'
import { toError, RLS_DENIED_CODE } from '@/lib/apiError'
import { finalAssignmentRows } from '@/lib/hostesses'
import { classifySendError, EMAIL_SEND_RESULT } from '@/lib/email'
import {
  SHIFT_TEMPLATE_NAMES,
  PROJECT_TEMPLATE_NAMES,
  buildShiftInvitePayload,
  buildProjectDetailsChangedPayload,
  confirmUrlFor,
  resolveShiftContact,
} from '@/lib/shiftEmails'
import { sendEmail, getEmailTemplate } from '@/api/email'

// ---- שגיאות-כתיבה ----

// מחזירה את הודעת-השרת כפי-שהיא (חתוכה מרווחים), או ניסוח-fallback כשאין הודעה. פונקציה טהורה
// כדי שאפשר לבדוק אותה בבדיקת-יחידה בלי לדמות Supabase — ראו api.test.js.
export function rpcErrorMessage(error, fallbackMessage) {
  const raw = typeof error?.message === 'string' ? error.message.trim() : ''
  return raw || fallbackMessage
}

function toRpcError(error, fallbackMessage) {
  return toError(error, rpcErrorMessage(error, fallbackMessage))
}

// ---- קריאות (Reads) ----

// מבט-העל (משטח 1): RPC אחד, לא צירוף בצד-דפדפן. AR-3: 🚫 אין לצרף projects+assignments+logistics
// כאן — 17 העמודות (כולל required_hostess_count ו-pending_invites) כבר מגיעות מחושבות מהמסד.
// planned_revenue === null פירושו "אין הרשאה / אין הצעה", לעולם לא 0 — הקורא לא הופך את זה.
export async function listProjectsOverview() {
  const { data, error } = await supabase.rpc('list_projects_overview')
  if (error) throw toRpcError(error, 'שגיאה בטעינת מבט-העל של הפרויקטים.')
  return data ?? []
}

// פרויקט בודד — אזור-הזהות. event_name/customer_name נקראים מ-projects כ*תצלום* (schema.sql:1119,
// 1125), לעולם לא בצירוף ל-customers: מנהלת-הלוגיסטיקה חסומה על מודול 'לקוחות', והצירוף היה
// מחזיר null בלי שגיאה בשלושה מסכים מאושרים — אותה הכרעה בדיוק כמו ב-04_hostesses/api.js:128-130.
export async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי הפרויקט.')
  return data ?? null
}

// שורות-הלוגיסטיקה של הפרויקט. מסד ל-mockup: רשימה ריקה אינה שגיאה — "אפס שורות ⇒ הושלם"
// (spec.md §"מה ייחשב עובד" #8, staffingMetric/logisticsMetric ב-src/lib/projects.js).
// מיון יציב: sku ואז serial_number (החלק השלישי במפתח הראשי, schema.sql:1045).
export async function getProjectLogistics(projectId) {
  const { data, error } = await supabase
    .from('logistics')
    .select('*')
    .eq('project_id', projectId)
    .order('sku')
    .order('serial_number')
  if (error) throw toError(error, 'שגיאה בטעינת הלוגיסטיקה של הפרויקט.')
  return data ?? []
}

// יומן-השינויים (משטח 3.3): RPC, **לעולם לא** `.from('project_changes').select()`. הטבלה
// deny-all עם אפס policies (נמדד: pg_policies ⇒ 0 שורות) ⇒ .from() היה מחזיר {data:[],error:null}
// לכל תפקיד כולל מנכ"ל — בדיוק הכשל השקט שהמודול הזה קיים כדי לתעד. שלושת עמודות-הכסף
// (unit_price_snapshot · unit_cost_snapshot · revenue_delta) חוזרות NULL בלי 'הצעות מחיר',
// ו-`money_visible` הוא המבחין המפורש — הקורא בודק את הדגל, לעולם לא `price === null`,
// כי NULL-אמיתי ו-NULL-חסום בלתי-ניתנים-להבחנה בלעדיו. revenue_delta הוא טרום-הנחה וטרום-מע"מ.
export async function getProjectChanges(projectId) {
  const { data, error } = await supabase.rpc('list_project_changes', {
    p_project_id: projectId,
  })
  if (error) throw toRpcError(error, 'שגיאה בטעינת יומן השינויים.')
  return data ?? []
}

// שיבוצי הפרויקט (משטח 5 וכל מסך שסופר דיילות-על-אירוע). 🔴 `hostesses.full_name` +
// `hostesses.hostess_id` — **לא** `first_name`/`last_name`: אלה לא קיימים בשום מקום בסכמה
// (`full_name text not null`, schema.sql:145; המפתח עבר ל-hostess_id, id_number הוסר).
export async function getProjectAssignments(projectId) {
  const { data, error } = await supabase
    .from('assignments')
    // ‏email/phone נוספו לצירוף בצעד 3.2 (תוספת-שדות בלבד): מיילי ㉑/㉒/㉝ יוצאים מהלקוח
    // (AR-5) וצריכים כתובת ואיש-קשר; הצירוף כולו מגודר על 'דיילות' — מי שחסומה שם מקבלת
    // אפס שורות בלי שגיאה, וזה בדיוק הסימן שהמסך מתרגם ל"אין דרך לשלוח מכאן".
    .select('*, hostesses(full_name, hostess_id, email, phone)')
    .eq('project_id', projectId)
    .order('hostess_id')
    .order('assignment_number')
  if (error) throw toError(error, 'שגיאה בטעינת שיבוצי הפרויקט.')
  return data ?? []
}

// נתוני-ההצעה שאזור-הזהות מציג (אורחים מוערכים · שני אחוזי-ההנחה). ‏quotes מגודרת על
// 'הצעות מחיר' (מנהלת גיוס ומנהלת לוגיסטיקה ➖ שתיהן) ⇒ קריאה חסומה חוזרת null **בלי
// שגיאה — וזה מכוון וזה הסימן**: אותו שער בדיוק כמו planned_revenue של מבט-העל, ולכן
// "ההנחה לא נקראה" ו"הסכום לא נקרא" קורים תמיד יחד (as-built 3.3④) והתא מציג `—` אחד.
// 🚫 לא זורקים על null — null-חסום ו-null-אין-שורה בלתי-ניתנים-להבחנה, ושניהם ⇒ `—`.
export async function getProjectQuoteMeta(quoteId) {
  if (!quoteId) return null
  const { data, error } = await supabase
    .from('quotes')
    .select('estimated_guests, applied_customer_discount, manual_discount')
    .eq('quote_id', quoteId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת נתוני ההצעה.')
  return data ?? null
}

// איש-הקשר אצל הלקוח — חי, לא snapshot (כרטיס-המסך ③: החלפת איש-קשר אצל הלקוח משתקפת
// מיד). ‏customers מגודרת על 'לקוחות' ⇒ למנהלת גיוס/לוגיסטיקה הקריאה חוזרת null בשקט;
// המסך בודק את ההרשאה בלקוח ומציג `—` במקום להסיק "אין איש קשר" מקריאה חסומה.
export async function getProjectCustomerContact(customerId) {
  if (!customerId) return null
  const { data, error } = await supabase
    .from('customers')
    .select('contact_name, phone')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת איש הקשר של הלקוח.')
  return data ?? null
}

// ---- מדד-רשות ל-gapSentence: confirmed_available ----

// ➕ `↳ as-built 18/08/2026` בצעד 2.1: `list_projects_overview` **אינה** מחזירה
// confirmed_available, ו-gapSentence (src/lib/projects.js) מקבלת אותו כשדה-רשות אופציונלי כדי
// לרנדר את משפט #11 ("הדיילת היחידה אישרה זמינות..."). הפונקציה הטהורה כאן היא הגזירה —
// אותו קיפול MAX(assignment_number) פר-דיילת כמו staffingMetric (src/lib/projects.js), על
// שורות assignment_status='confirmed_available' בלבד. הקלט הוא תוצאת getProjectAssignments.
//
// ⚠️ **למה זו לא נקראת בתוך listProjectsOverview עצמה, למרות שה-as-built מנסח "this step's
// wrapper... derives it":** listProjectsOverview נושאת גם את איסור-AR-3 המפורש
// ("🚫 No browser-side join across projects + assignments + logistics") **באותו צעד ובאותו קובץ**.
// צירוף assignments לתוך תוצאת מבט-העל היה בדיוק הצירוף הזה. הפתרון שנבחר: להשאיר את
// listProjectsOverview טהורה (AR-3), ולחשוף את הגזירה כפונקציה טהורה+בדוקה שהמסך (3.1) מפעיל
// על שורות שכבר הביא דרך getProjectAssignments(projectId) — בדיוק כפי שה-as-built עצמו מציג
// "2.5 או 3.1" כאפשרות. **זו סתירה בין AR-3 לבין נוסח "this step's wrapper derives it" בתוך
// אותו בלוק — מדווחת בדוח הסשן, לא מוכרעת בשקט.**
export function confirmedAvailableCount(assignmentRows) {
  return finalAssignmentRows(assignmentRows).filter(
    (row) => row?.assignment_status === 'confirmed_available',
  ).length
}

// ---- כתיבות (Writes) — כל אחת RPC יחיד, כמו שהוגדר ב-§4.2-4.3 של מדריך-המיקרו ----

// עדכון פרטי-הזהות/תאריך/שעות/מיקום. ㉑ מאפסת אישורים-סופיים ו-invite_token בשינוי-תאריך,
// ושינוי-מיקום מאפס lat/lng ללא-תנאי (as-built 14/08/2026, פסקת "The RPCs' as-built surface").
// מ-event_finished עם תאריך **עתידי** ה-RPC "מפשיר" את הפרויקט חזרה לציר הפעיל
// (`reactivated: true`) — התאריך בלבד קובע, לא סוג-הקריאה.
export async function updateProjectDetails(projectId, { eventDate, location, startTime, endTime }) {
  const { data, error } = await supabase.rpc('update_project_details', {
    p_project_id: projectId,
    p_event_date: eventDate,
    p_location: location,
    p_start_time: startTime,
    p_end_time: endTime,
  })
  if (error) throw toRpcError(error, 'עדכון פרטי הפרויקט נכשל.')
  return data
}

// שינוי-תכולה (משטח 3.6/3.7). 📜 PAYLOAD CONTRACT מחייב (step 1.8, מצוטט ב-2.5):
// כל אובייקט ב-`lines` הוא `{target, sku?, serial_number?, target_qty}` — `target_qty` הוא
// **היעד, לא הדלתא** (הדלתא נגזרת בשרת: target_qty − planned_qty). `serial_number` מושמט
// **רק** בשורה חדשה (השרת מקצה max+1); בשורה קיימת השמטתו מעדכנת שורה שגויה בלי שגיאה.
// המחזור: {change_group_id, lines[], revenue_delta_total, can_read_revenue, hours_to_event}.
// can_read_revenue===false ⇒ revenue_delta/unit_price_snapshot חוזרים null — לרנדר '—', לא 0.
export async function applyScopeChange(projectId, lines, reason) {
  const { data, error } = await supabase.rpc('apply_scope_change', {
    p_project_id: projectId,
    p_lines: lines,
    p_reason: reason,
  })
  if (error) throw toRpcError(error, 'שמירת שינוי התכולה נכשלה.')
  return data
}

// ביטול פרויקט. cancel_type ∈ {customer, force_majeure, other} (schema.sql:1146 — שלוש הערכים
// המדויקים). המעטפת: {released_rows, finally_approved_count, other_live_count,
// can_read_hostesses, hostesses_to_notify[], logistics_untouched}. full_name בתוך
// hostesses_to_notify הוא null למי שאין לה 'דיילות' — לרנדר מונה, לא שם ריק.
export async function cancelProject(projectId, cancelType, cancelReason) {
  const { data, error } = await supabase.rpc('cancel_project', {
    p_project_id: projectId,
    p_cancel_type: cancelType,
    p_cancel_reason: cancelReason,
  })
  if (error) throw toRpcError(error, 'ביטול הפרויקט נכשל.')
  return data
}

// סגירה תפעולית (משטח 5). 📜 PAYLOAD CONTRACT: כל אובייקט ב-`rows` הוא שיבוץ יחיד —
// {hostess_id, assignment_number, attendance_status, lateness_level, no_show_reason,
// actual_hours, preference, preference_reason}. `assignment_number` הוא החלק השלישי במפתח —
// השמטתו כותבת את השורה השגויה בלי שגיאה. `preference` הוא המפתח (לא quality_mark) והוא נוחת
// ב-customer_hostess_preference, לא ב-assignments. `projects.customer_id` הוא nullable —
// כשהוא null ה-RPC מדלגת על upsert-ההעדפה ומשלימה את הסגירה בכל זאת
// (preferences_saved:false, preferences_written:0 במעטפת). המעטפת המלאה: {customer_id,
// customer_name, event_name, report_path, feedback_status, operationally_closed_at,
// preferences_saved, preferences_written}. 🚫 אין money בשום שדה כאן (§7.52, AR-6).
export async function closeProjectOperationally(
  projectId,
  { actualHours, actualGuests, reportPath, rows },
) {
  const { data, error } = await supabase.rpc('close_project_operationally', {
    p_project_id: projectId,
    p_actual_hours: actualHours,
    p_actual_guests: actualGuests,
    p_report_path: reportPath,
    p_rows: rows,
  })
  if (error) throw toRpcError(error, 'סגירת האירוע נכשלה.')
  return data
}

// שליחת-סקר הצליחה — RPC צר שכותב feedback_status='sent' ובלבד, **פטור** מסירוב-הנעילה ㉙
// (AR-5/AS-5: הנעילה היא רשימה-סגורה של ארבע פונקציות תפעוליות, וזו אינה אחת מהן) —
// כדי שבקרת "שליחה חוזרת" (משטח 5, אחרי סגירה) תהיה לה נתיב-כתיבה חוקי.
// מחזירה `true` כששורה אחת זזה (as-built ⑦, צעד 2.5). `false`/לא-true בהצלחה-כביכול הוא
// המקבילה של "0 שורות בלי שגיאה" של AS-6 — ולכן נבדק ונזרק כ-RLS_DENIED סינתטי.
// ---- מיילי עדכון-הפרטים (AR-5: הלקוח שולח אחרי הצלחת ה-RPC, לעולם לא בתוכו) ----

// שלוש התוצאות של שליחה — אותה הבחנה כמו במודול 4: פסק-זמן הוא "לא ידוע", לא "נכשל".
const emptyMailOutcome = () => ({ sent: 0, unknown: 0, failed: 0 })

// השורה הקובעת פר-דיילת מתוך תוצאת getProjectAssignments, לרשימת hostess_id נתונה.
// למי שחסומה על 'דיילות' הצירוף חוזר ריק בלי שגיאה ⇒ המפה ריקה, וזה מזוהה בקוראים.
function latestRowsByHostess(assignmentRows, hostessIds) {
  const wanted = new Set(hostessIds)
  const byHostess = new Map()
  for (const row of finalAssignmentRows(assignmentRows)) {
    if (wanted.has(row.hostess_id)) byHostess.set(row.hostess_id, row)
  }
  return byHostess
}

// זימון-מחדש אחרי שינוי-תאריך (㉑). ‏update_project_details כבר איפסה את השורות ל-pending
// וניקתה invite_token/invite_sent_at (המיגרציה מנמקת: טוקן ישן היה קישור חי שמציג את
// התאריך הישן ומאשר את החדש) — כאן נולד טוקן חדש, נכתב לשורה, ורק אז יוצא המייל: בסדר
// ההפוך הדיילת מקבלת קישור שאינו קיים במסד (הכלל של refreshInviteAndSend במודול 4).
//
// כתיבת הטוקן דורשת edit על 'דיילות' (assignments_write_by_permission). הסתירה שהייתה
// כאן — מנהלת הפרויקטים החזיקה view בלבד — נסגרה בהכרעת-ישי 19/08/2026 ("מאוד פשוט,
// להרחיב לה הרשאה"): התא הוחלף ל-edit דרך מסך-המטריצה. מסלול-הכשל נשאר בכוונה —
// תפקיד אחר עם edit על 'פרויקטים' בלי 'דיילות' (מנהלת לוגיסטיקה) עדיין נספר failed בקול.
export async function sendDateChangeReinvites(project, hostessIds, origin) {
  const outcome = emptyMailOutcome()
  if (!hostessIds?.length) return outcome

  const [template, assignmentRows] = await Promise.all([
    getEmailTemplate(SHIFT_TEMPLATE_NAMES.invite),
    getProjectAssignments(project.project_id),
  ])
  const byHostess = latestRowsByHostess(assignmentRows, hostessIds)

  for (const hostessId of hostessIds) {
    const row = byHostess.get(hostessId)
    // שורה לא-קריאה (חסימת 'דיילות') או דיילת בלי מייל — כשל כן, לא שקט.
    if (!row?.hostesses?.email) {
      outcome.failed += 1
      continue
    }
    const token = crypto.randomUUID()
    const payload = buildShiftInvitePayload({
      template,
      hostess: row.hostesses,
      project,
      hourlyRate: row.hourly_rate_snapshot,
      confirmUrl: confirmUrlFor(origin, token),
    })
    if (!payload) {
      outcome.failed += 1
      continue
    }
    const nowIso = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from('assignments')
      .update({ invite_token: token, invite_sent_at: nowIso })
      .eq('project_id', row.project_id)
      .eq('hostess_id', row.hostess_id)
      .eq('assignment_number', row.assignment_number)
      .select()
    if (updateError || !updated?.length) {
      outcome.failed += 1
      continue
    }
    try {
      await sendEmail({
        payload,
        entityType: 'shift',
        // כמו במודול 4: entity_id הוא הפרויקט — ל-assignments מפתח משולש ואין מזהה-עמודה-אחת.
        entityId: row.project_id,
        templateName: SHIFT_TEMPLATE_NAMES.invite,
      })
      outcome.sent += 1
    } catch (sendError) {
      if (classifySendError(sendError) === EMAIL_SEND_RESULT.UNKNOWN) {
        // פסק-זמן אינו כשל: אין גלגול-אחורה, כי המייל אולי כן יצא.
        outcome.unknown += 1
      } else {
        // מגלגלים את invite_sent_at בלבד — אחרת שעון-48 רץ על מייל שמעולם לא יצא.
        await supabase
          .from('assignments')
          .update({ invite_sent_at: null })
          .eq('project_id', row.project_id)
          .eq('hostess_id', row.hostess_id)
          .eq('assignment_number', row.assignment_number)
        outcome.failed += 1
      }
    }
  }
  return outcome
}

// מייל "פרטי האירוע השתנו" (㉒/㉝ — מיקום/שעות; לא תאריך, שמסלולו זימון-מחדש). הבונה
// והתבנית של צעד 2.8; איש-הקשר דרך resolveShiftContact — אחראית-משמרת אם סומנה, אחרת
// מנהלת הפרויקט מה-snapshot. contact חסר (שם/טלפון ריקים) עוצר את כל השליחה — זה החוזה
// של resolveShiftContact, והתוצאה מדווחת כ-blocked ולא נבלעת.
export async function sendDetailsChangedMails(project, hostessIds) {
  const outcome = { ...emptyMailOutcome(), blockedReason: null }
  if (!hostessIds?.length) return outcome

  const [template, assignmentRows] = await Promise.all([
    getEmailTemplate(PROJECT_TEMPLATE_NAMES.detailsChanged),
    getProjectAssignments(project.project_id),
  ])
  const byHostess = latestRowsByHostess(assignmentRows, hostessIds)

  if (byHostess.size === 0) {
    // הצירוף חזר ריק על רשימה לא-ריקה ⇒ אין קריאת-דיילות (חסימת 'דיילות') — אין ממי
    // לקחת כתובת מייל, והאמת הזאת נאמרת למסך במקום להיספר כ"נכשלו" סתמי.
    outcome.failed = hostessIds.length
    outcome.blockedReason = 'permission'
    return outcome
  }

  const leadRow = finalAssignmentRows(assignmentRows).find((row) => row.is_shift_lead)
  const contact = resolveShiftContact({ project, shiftLead: leadRow?.hostesses })
  if (!contact) {
    outcome.failed = hostessIds.length
    outcome.blockedReason = 'contact'
    return outcome
  }

  for (const hostessId of hostessIds) {
    const row = byHostess.get(hostessId)
    const payload = buildProjectDetailsChangedPayload({
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
        entityType: 'project',
        entityId: project.project_id,
        templateName: PROJECT_TEMPLATE_NAMES.detailsChanged,
      })
      outcome.sent += 1
    } catch (sendError) {
      if (classifySendError(sendError) === EMAIL_SEND_RESULT.UNKNOWN) outcome.unknown += 1
      else outcome.failed += 1
    }
  }
  return outcome
}

export async function markFeedbackSurveySent(projectId) {
  const { data, error } = await supabase.rpc('mark_feedback_survey_sent', {
    p_project_id: projectId,
  })
  if (error) throw toRpcError(error, 'עדכון סטטוס-הסקר נכשל.')
  if (data !== true) {
    throw toError({ code: RLS_DENIED_CODE }, 'עדכון סטטוס-הסקר לא נחת — ייתכן שאין לך הרשאה.')
  }
  return data
}
