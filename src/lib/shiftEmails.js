// מיילי מודול 4 — **מה שספציפי לדיילות בלבד.** המנוע עצמו (מילוי-תבנית · חוזה-חמשת-השדות
// מול Make · תקרת-מצורף · שלושת מצבי-התוצאה) חי ב-`src/lib/email.js` ואינו משוכפל כאן;
// התובלה חיה ב-`src/api/email.js`. אותה חלוקה בדיוק שמודול 3 עושה ב-`quotes.js`.
//
// 🚫 **אין כאן Supabase ואין שעון** — טהור, כמו כל `src/lib/`.

import { buildEmailPayload, fillEmailTemplate } from '@/lib/email'
import { formatDate } from '@/lib/dates'

// 🔴 זהים-בייט לשורות ה-`params` (מיגרציות `20260723112000` ו-`20260809125750`). שם שגוי
// בתו אחד מחזיר תבנית ריקה, ואז אין מייל **ואין שגיאה** — הכשל השקט הקלאסי כאן.
export const SHIFT_TEMPLATE_NAMES = {
  invite: 'תבנית_זימון_משמרת',
  finalApproval: 'תבנית_אישור_סופי_שיבוץ',
  cancellation: 'תבנית_מייל_ביטול_משמרת',
  release: 'תבנית_מייל_שחרור_משמרת',
  reminder: 'תבנית_תזכורת_משמרת',
}

// 🔴 תבניות **מודול 6** — ברמת-הפרויקט, לא ברמת-המשמרת. **קבוצה נפרדת מ-`SHIFT_TEMPLATE_NAMES`
// ולא מפתח נוסף בתוכה**: `cancellation` שם כבר תפוס ע"י `תבנית_מייל_ביטול_משמרת` (מודול 4 —
// המשרה כבר אוישה ע"י מישהי אחרת), ואילו כאן האירוע **כולו** מתבטל. שני מיילים שונים לגמרי
// שחולקים מקרה-קצה בשם בלבד — זרעו כמפתח כפול היה מוחק אחד מהם בשקט.
// זהים-בייט לשורות ה-`params` שנזרעו ב-`module6_params_seed` (`db_roadmap.md` M6-12).
export const PROJECT_TEMPLATE_NAMES = {
  cancellation: 'תבנית_מייל_אירוע_בוטל',
  detailsChanged: 'תבנית_מייל_פרטי_האירוע_השתנו',
}

// הקישור האישי של הדיילת. **הטוקן בנתיב ולא ב-query** — פרמטרי-query נוטים להיגזר
// בלוגים, ב-Referer ובקיצורי-קישורים, והטוקן הזה הוא **מפתח-כתיבה למסד** (`§7.45`).
// ⚠️ הבסיס מגיע מהקורא (`window.location.origin`) ולא מקבוע: מייל שנשלח מסביבת-פיתוח
// חייב להצביע לסביבת-פיתוח, אחרת בדיקה "מצליחה" מול הפרודקשן ולא מול מה שנבנה.
export function confirmUrlFor(origin, token) {
  if (!origin || !token) return null
  return `${String(origin).replace(/\/+$/, '')}/shift/${token}`
}

export function shiftInviteSubject(project) {
  return `זימון למשמרת — ${project?.event_name ?? ''}`.trim()
}

export function finalApprovalSubject(project) {
  return `אישור סופי למשמרת — ${project?.event_name ?? ''}`.trim()
}

// ⚠️ **לא "ביטול משמרת"** — הדיילת מעולם לא שובצה, והנושא הוא הדבר הראשון שהיא רואה.
// אותו נימוק בדיוק שבגללו נזרעה תבנית חמישית ולא נעשה שימוש חוזר במייל-הביטול (`§ב6`).
export function releaseSubject(project) {
  return `עדכון על המשמרת — ${project?.event_name ?? ''}`.trim()
}

// "18:00:00" ⇒ "18:00". שעה חסרה מוחזרת כמקף ולא כמחרוזת ריקה — *"שעות: עד 22:00"*
// נראה כמו תקלה, ו-`fillEmailTemplate` ממילא אינו יודע להשמיט שורה.
function hhmm(value) {
  return typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : '—'
}

// ── placeholders משותפים ──────────────────────────────────────────────────
// חמשת ה-placeholders שכל מייל-משמרת נושא — שם-דיילת + פרטי-האירוע (אוחד 19/08/2026,
// jscpd: אותו בלוק חזר זהה-בייט בשלושה בונים). סדר-המפתחות באובייקט אינו משפיע על
// `fillEmailTemplate` — הוא מחליף כל placeholder בנפרד (split/join, לא regex-מסודר).
function shiftEventPlaceholders(hostess, project) {
  return {
    '[שם_דיילת]': hostess.full_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[תאריך_אירוע]': formatDate(project?.final_event_date, '—'),
    '[שעת_התחלה]': hhmm(project?.final_start_time),
    '[שעת_סיום]': hhmm(project?.final_end_time),
  }
}

// שלושת ה-placeholders הנוספים שמייל-עם-איש-קשר-בשטח נושא, מעל חמשת אלה — משותף בין
// `buildFinalApprovalPayload` ו-`buildProjectDetailsChangedPayload` (8 placeholders
// זהים-בייט, ר' ההערה על `buildProjectDetailsChangedPayload` למטה).
function shiftContactPlaceholders(hostess, project, contact) {
  return {
    ...shiftEventPlaceholders(hostess, project),
    // 🔴 **הכתובת המלאה** ולא העיר — זה מה שהדיילת מנווטת אליו בבוקר האירוע.
    '[כתובת_אירוע_מלאה]': project?.final_location ?? '',
    '[שם_מנהלת_פרויקט]': contact.name,
    '[טלפון_מנהלת_פרויקט]': contact.phone,
  }
}

// גוף+payload משותפים ל-`buildFinalApprovalPayload`/`buildProjectDetailsChangedPayload` —
// שני מיילים "עם איש-קשר בשטח" שנבדלים רק בנושא (אוחד 19/08/2026, jscpd: אחרי איחוד
// ה-placeholders למעלה הגופים נשארו זהים-בייט מלבד קריאת ה-subject). כל אחת מהן שומרת
// על חתימת-הפרמטרים המקורית שלה (עם/בלי `= {}`) — ר' שתי העוטפות שמתחת.
function buildContactPayload({ subject, template, hostess, project, contact }) {
  if (!contact || !hostess?.email) return null

  const body = fillEmailTemplate(template, shiftContactPlaceholders(hostess, project, contact))
  if (!body) return null

  return buildEmailPayload({
    to: hostess.email,
    subject,
    body,
    requireAttachment: false,
  })
}

// נושא-הביטול. **בלי ייחוס** — כמו גוף-המייל עצמו (§ למטה) — כי `cancel_type` נושא שלושה
// ערכים (`customer`/`force_majeure`/`other`, `schema.sql:1146`) והנושא אינו יכול לבחור ביניהם.
export function projectCancellationSubject(project) {
  return `ביטול האירוע — ${project?.event_name ?? ''}`.trim()
}

export function projectDetailsChangedSubject(project) {
  return `עדכון פרטי האירוע — ${project?.event_name ?? ''}`.trim()
}

// ── איש הקשר בשטח ────────────────────────────────────────────────────────────

// **מי מודפס במייל האישור-הסופי כאיש-הקשר בשטח** (`local-2`, ישי 08/08 · `§ב5`):
// **האחראית-משמרת אם סומנה, אחרת מנהלת הפרויקט.**
//
// 🔴 **והשם והטלפון של מנהלת הפרויקט נקראים מ-`projects.owner_name`/`owner_phone`, שהם
// צילום — לא מ-`users`.** ⚠️ **זה לא סגנון ולא אופטימיזציה:** נמדד חי 09/08/2026 שמנהלת
// הגיוס מקבלת מ-`users` **`200` ורשימה ריקה** (`users_select_self_or_ceo` — רק את עצמה או
// מנכ"ל), כלומר המייל היה יוצא עם *"מנהלת הפרויקט -, טלפון: "* **בלי שום שגיאה**. מיגרציה G
// יצרה את שתי העמודות. ➕ ובנוסף זה גם הדבר הנכון סמנטית: **מה שנכתב במייל שיצא נשאר מה
// שנכתב בו**, בדיוק כמו `hourly_rate_snapshot`.
//
// 🔴 **`null` כשחסר שם או טלפון — והקורא חייב לעצור את השליחה.** שתי העמודות nullable
// במכוון (ל-`users.phone` מותר להיות ריק), ו-`fillEmailTemplate` **אינו** יכול לתפוס את זה:
// ה-placeholder מוכר, הוא פשוט מתמלא במחרוזת ריקה. זו אותה משפחה כמו `buildShiftInvitePayload`
// שמחזיר `null` בלי קישור.
// 🚫 **ואחראית-משמרת בלי טלפון אינה "נופלת אחורה" למנהלת** — היא איש-הקשר בפועל, והחלפה
// שקטה בגורם אחר הייתה שולחת דיילת בשטח לטלפון של מישהי שאינה שם.
export function resolveShiftContact({ project, shiftLead } = {}) {
  const source = shiftLead
    ? { name: shiftLead.full_name, phone: shiftLead.phone, isShiftLead: true }
    : { name: project?.owner_name, phone: project?.owner_phone, isShiftLead: false }

  if (!source.name || !source.phone) return null

  // 🔴 **התפקיד נוסע בתוך הערך, ולא בתבנית** — מיגרציה `20260810001421` הסירה מהתבנית את
  // המילים הקשיחות *"מנהלת הפרויקט -"*, כי הן **שיקרו** ברגע שסומנה אחראית משמרת: הדיילות
  // האחרות היו קוראות שמי שתתקשרנה אליה בשטח היא מנהלת הפרויקט, והיא אינה.
  // 🔑 **ולמה כאן ולא placeholder שביעי:** שדה נוסף היה מחייב **כל** מסלול-שליחה לדעת עליו,
  // בעוד ששני המקרים הם אותה שאלה אחת — *מי איש-הקשר, ובאיזה תפקיד*. `spec.md §12` רשם את
  // החור, ו-§7.89 האציל *"כל placeholder מוכרע לגופו"*.
  const role = source.isShiftLead ? 'אחראית המשמרת' : 'מנהלת הפרויקט'
  return { name: `${role} ${source.name}`, phone: source.phone, isShiftLead: source.isShiftLead }
}

// זימון-משמרת ⇒ גוף-מייל מוכן לשליחה, או `null` אם חסר משהו שבלעדיו אין טעם לשלוח.
//
// 🔴 **`null` ולא "לשלוח בכל זאת":** מייל זימון בלי קישור הוא מייל שמבקש מהדיילת ללחוץ
// על כלום, והיא תתקשר למנהלת — כלומר בדיוק העלות שהמודול הזה נועד לחסוך.
//
// ⚠️ **`[עיר_אירוע]` מקבל את `final_location` המלא — הנחה מודעת** *(`הנחתי`, 09/08/2026)*:
// **אין ל-`projects` עמודת-עיר** (נמדד מול הסכמה החיה), והכתובות בפועל אינן ניתנות לפיצול
// אמין — ב-`אקספו תל אביב, ביתן 2` העיר יושבת **בתוך שם המתחם**, וב-`מרכז הכנסים, ירושלים`
// היא דווקא בסוף. 🚫 פרסר-ניחוש היה מייצר עיר שגויה **בשקט**, וזה בדיוק הלקח של הגאוקוד:
// *"נתון חסר מכריז על עצמו — נתון שגוי מתחזה לנתון שנמדד."* ➕ והאפיון עצמו מונה את השדה
// כ**"מיקום"** (`processes-approved.md §ב3`), והדף הציבורי מציג *"בדיוק אותם שדות שכבר במייל"*.
export function buildShiftInvitePayload({ template, hostess, project, hourlyRate, confirmUrl }) {
  if (!confirmUrl || !hostess?.email) return null

  const body = fillEmailTemplate(template, {
    ...shiftEventPlaceholders(hostess, project),
    '[עיר_אירוע]': project?.final_location ?? '',
    '[תעריף_שעתי_דיילת]': String(hourlyRate ?? ''),
    '[לינק_אישור_משמרת]': confirmUrl,
  })
  if (!body) return null

  // 🔴 `requireAttachment: false` **במפורש** — ברירת-המחדל של המנוע היא לדרוש מצורף, וזו
  // רצפה שנשמרת דלוקה בכוונה בשביל נתיב הצעת-המחיר. זימון-משמרת הוא טקסט בלבד.
  return buildEmailPayload({
    to: hostess.email,
    subject: shiftInviteSubject(project),
    body,
    requireAttachment: false,
  })
}

// מייל האישור הסופי — **פרטי האירוע המלאים, והפעם בלי קישור**: ההחלטה כבר התקבלה.
//
// ⚠️ **שם ה-placeholder `[שם_מנהלת_פרויקט]` נשאר כפי שנזרע, גם כשהערך הוא האחראית-משמרת.**
// התבנית מקדימה לו את המילים *"מנהלת הפרויקט -"*, ולכן כשמסומנת אחראית-משמרת המשפט
// **מתייג אותה בתפקיד שאינו שלה**. 🔴 **זה חור מוכר ורשום** (`spec.md §12` — *"ולתבנית אין
// placeholder עבורה בכלל"*), הוא **טעון הכרעת-ישי** (§7.89: כל placeholder לגופו), ותיקונו
// הוא שינוי-טקסט ב-`params` ⇒ **מיגרציה**. עד אז: מסומנת אחראית ⇒ הערך נכון, התווית לא.
export function buildFinalApprovalPayload({ template, hostess, project, contact }) {
  return buildContactPayload({
    subject: finalApprovalSubject(project),
    template,
    hostess,
    project,
    contact,
  })
}

// הודעת-השחרור. **תבנית משלה, ולא מייל-הביטול** — `processes-approved.md:264-266` אוסר
// זאת במפורש, כי *"המשמרת שלך בוטלה"* הוא **שקר**: הדיילת מעולם לא שובצה.
// 🔑 **ולמה בכלל שולחים:** שיעור-ההיענות הוא 40% מהציון. מי שתענה "כן" שלוש פעמים ולא
// תשמע כלום תפסיק לענות — **והמערכת תרשום אותה כלא-אמינה על תקלה שלנו.**
export function buildReleasePayload({ template, hostess, project }) {
  if (!hostess?.email) return null

  const body = fillEmailTemplate(template, { '[שם_דיילת]': hostess.full_name ?? '' })
  if (!body) return null

  return buildEmailPayload({
    to: hostess.email,
    subject: releaseSubject(project),
    body,
    requireAttachment: false,
  })
}

// ── מודול 6 · שלב 2.8 — ביטול-פרויקט ועדכון-פרטים ──────────────────────────

// מייל ביטול-האירוע — יוצא **לכל** דיילת ששובצה, לא רק למי שיש לה איש-קשר תקין בפרויקט.
//
// 🔴 **בכוונה אינה קוראת ל-`resolveShiftContact`.** אותה פונקציה מחזירה `null` כששם *או*
// טלפון של איש-הקשר חסרים (`projects.owner_phone` nullable), והקורא שלה **חייב** אז לעצור
// את השליחה — זה בדיוק הכלל ב-`buildFinalApprovalPayload`. אבל כאן העצירה הזו הייתה שקרית:
// המייל הזה אינו תלוי באיש-קשר בשטח בכלל (שלוש placeholders בלבד — דיילת/פרויקט/תאריך),
// וקריאה מיותרת לפונקציה שיכולה להחזיר `null` הייתה חוסמת מייל-חובה על סמך שדה שהוא כלל
// לא צריך. `db_roadmap.md` M6-12 §① מנמק את אותה הכרעה מפורשות.
//
// 🚫 **אין ייחוס-סיבה בתבנית, ולא יהיה.** `cancel_type` נושא שלושה ערכים
// (`customer`/`force_majeure`/`other`) והתבנית היא מחרוזת קבועה אחת ש-`fillEmailTemplate`
// אינו יודע להסתעף בה — *"בוטל על ידי הלקוח"* היה **שקר** במקרה של כוח-עליון.
export function buildProjectCancellationPayload({ template, hostess, project } = {}) {
  if (!hostess?.email) return null

  const body = fillEmailTemplate(template, {
    '[שם_דיילת]': hostess.full_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[תאריך_אירוע]': formatDate(project?.final_event_date, '—'),
  })
  if (!body) return null

  return buildEmailPayload({
    to: hostess.email,
    subject: projectCancellationSubject(project),
    body,
    requireAttachment: false,
  })
}

// ── מודול 6 · צעד 3.5 — שני מיילי-הסגירה ללקוח (AR-5: אחרי ה-commit, לעולם לא בתוכו) ──

// תבנית סקר-המשוב זרועה חיה (מיגרציית מודול 3, `20260723112000`), ו-db_roadmap §5 אוסר
// במפורש לזרוע אותה שוב: `[לינק_לשאלון_שביעות_רצון]` הוא ה-placeholder שבתוכה.
export const FEEDBACK_TEMPLATE_NAME = 'תבנית_מייל_משוב_לקוח'

// 🪦 **`קישור_בסיס_סקר_לקוחות` — הפרמטר שהחזיק את קישור-ה-Google-Forms — יצא מהזרימה במודול 8**
// (אדוות-מ8 ②, `specs/module_08_finance/processes-approved.md` §S4). מה שנשלח ללקוח מעכשיו הוא
// **URL-הטוקן של דף-המשוב שלנו** (`feedbackUrlFor` מיד מתחת), ואף קוד אינו קורא את הפרמטר.
// 🗑️ **ושורת-ה-params עצמה נמחקה מהמסד ב-02/09/2026** — הכרעת-ישי Q-2 בפתיחת מודול 9 (מיגרציה
// `20260902211549_module9_a_params_owner_types_seed`; לפני כן, מ-27/08, היא נשארה "מיושנת" בכוונה
// לפי הכרעת-האפיון של מ8). מסך-ההגדרות של מ9 מציג רק שורות שמישהו קורא — שורה שאיש לא קורא
// הייתה משקרת למשתמש. **הקבוע שהחזיק את השם נמחק מכאן, וזו הערה ולא מצבה-מיוצאת** — ‏`knip` (שער חוסם ב-`gate`)
// מדווח ייצוא בלי צרכן ככשל, ונמדד שהוא אכן נופל עליו. השם נשאר כתוב כאן במלואו כדי שמי
// שיגרר אחריו מהמסד ינחת על ההסבר ולא על שקט — grep מוצא הערה בדיוק כמו שהוא מוצא קבוע.

// קישור-המשוב האישי של הלקוח — **אותו חוזה בדיוק כמו `confirmUrlFor` של הדיילת**, ולכן אותה
// צורה: הטוקן **בנתיב ולא ב-query** (הוא מפתח-כתיבה למסד — §7.45), והבסיס מגיע מהקורא ולא
// מקבוע, כדי שמייל שנשלח מסביבת-פיתוח יצביע לסביבת-פיתוח. 🚫 בלי טוקן אין קישור: מוטב מייל
// שלא יצא מאשר מייל שמוביל ל"הקישור אינו בתוקף".
export function feedbackUrlFor(origin, token) {
  if (!origin || !token) return null
  return `${String(origin).replace(/\/+$/, '')}/feedback/${token}`
}

export function projectReportSubject(project) {
  return `דוח-סיכום האירוע — ${project?.event_name ?? ''}`.trim()
}

export function feedbackSurveySubject(project) {
  return `סקר שביעות רצון — ${project?.event_name ?? ''}`.trim()
}

// גוף מייל דוח-הסיכום — 🔴 הנחתי: אין שורת-תבנית זרועה לדוח-הסיכום (מיגרציית M6-12 זרעה
// בדיוק שתי תבניות, שתיהן לדיילות; אף מסמך אינו מגדיר תבנית לדוח), ולכן הגוף חי כאן בקוד,
// בסגנון תבנית-החשבונית הקיימת ("מצורפת בזאת…"). placeholder-פורמט נשמר כדי שהמרה עתידית
// לשורת-params תהיה העתקה, לא שכתוב. ההמרה ל-HTML-עם-כיווניות קורית ב-buildEmailPayload
// (plainTextToEmailHtml) — כמו כל מייל אחר.
const PROJECT_REPORT_BODY_TEMPLATE = `שלום [שם_איש_קשר],
מצורף בזאת דוח-סיכום האירוע '[שם_פרויקט]' שהתקיים בתאריך [תאריך_אירוע].
נשמח לעמוד לרשותך בכל שאלה על האירוע ועל הדוח.
בברכה,
צוות REG-IN.`

// מייל דוח-הסיכום ללקוח: entityType 'project_report', **המצורף חובה** (AR-8) — הקובץ מורד
// מה-bucket ומצורף כ-base64; 🚫 לעולם לא קישור חתום (spec §12⑬(ג): קישור שפג אצל הלקוח
// נראה כמו תקלה). requireAttachment נשאר ברירת-המחדל true של המנוע — בכוונה לא מכובה.
export function buildProjectReportPayload({ contact, project, filename, attachmentBase64 } = {}) {
  if (!contact?.email) return null

  const body = fillEmailTemplate(PROJECT_REPORT_BODY_TEMPLATE, {
    '[שם_איש_קשר]': contact.contact_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[תאריך_אירוע]': formatDate(project?.final_event_date, '—'),
  })
  if (!body) return null

  return buildEmailPayload({
    to: contact.email,
    subject: projectReportSubject(project),
    body,
    filename,
    attachmentBase64,
  })
}

// מייל סקר-המשוב: התבנית הזרועה של מודול 3, שלושת ה-placeholders שלה בדיוק —
// `[שם_איש_קשר]` · `[שם_פרויקט]` · `[לינק_לשאלון_שביעות_רצון]`.
// 🔄 **ערכו של השלישי השתנה במודול 8 (אדוות-מ8 ①): קישור-טוקן אישי לדף-המשוב שלנו
// (`feedbackUrlFor`), הנטבע ברגע-השליחה — ולא עוד הקישור-הקבוע של Google Forms.** עד
// 28/08/2026 עמדה כאן ההערה *"קישור קבוע — הכרעת-ישי 13/08: הטופס קיים והקישור קבוע"*;
// היא נכונה היסטורית ושקרית מאז שדף-המשוב נבנה, ולכן הוחלפה ולא הושארה.
// 🔑 `surveyUrl` נשאר **פרמטר**: הבונה טהור ואינו יודע לטבוע טוקנים — הטביעה היא של הקורא.
// טקסט בלבד ⇒ requireAttachment:false.
export function buildFeedbackSurveyPayload({ template, surveyUrl, contact, project } = {}) {
  if (!contact?.email || !surveyUrl) return null

  const body = fillEmailTemplate(template, {
    '[שם_איש_קשר]': contact.contact_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[לינק_לשאלון_שביעות_רצון]': surveyUrl,
  })
  if (!body) return null

  return buildEmailPayload({
    to: contact.email,
    subject: feedbackSurveySubject(project),
    body,
    requireAttachment: false,
  })
}

// מייל עדכון-פרטי-האירוע — יוצא רק כששיבוצה **נשאר בתוקף** (מיקום או שעות השתנו), ולכן
// דורש איש-קשר תקין בדיוק כמו האישור-הסופי.
//
// 🔴 **8 placeholders זהים-בייט לאלה של `תבנית_אישור_סופי_שיבוץ`** (`db_roadmap.md` M6-12) —
// ולכן `resolveShiftContact` נצרך כאן **בלי שינוי**, לא בשכפול. ⚠️ **הקריאה למייל הזה עצמה
// אינה כאן** — קביעת "האם לשלוח" (מיקום/שעות בלבד, לא תאריך — ㉑ מאפס אישורים ומזמינה מחדש
// כשהתאריך משתנה) היא של הקוד שקורא לבונה הזה, לא של הבונה עצמו.
export function buildProjectDetailsChangedPayload({ template, hostess, project, contact } = {}) {
  return buildContactPayload({
    subject: projectDetailsChangedSubject(project),
    template,
    hostess,
    project,
    contact,
  })
}
