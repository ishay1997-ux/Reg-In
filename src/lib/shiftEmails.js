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
  return { name: source.name, phone: source.phone, isShiftLead: source.isShiftLead }
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
    '[שם_דיילת]': hostess.full_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[תאריך_אירוע]': formatDate(project?.final_event_date, '—'),
    '[שעת_התחלה]': hhmm(project?.final_start_time),
    '[שעת_סיום]': hhmm(project?.final_end_time),
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
  if (!contact || !hostess?.email) return null

  const body = fillEmailTemplate(template, {
    '[שם_דיילת]': hostess.full_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
    '[תאריך_אירוע]': formatDate(project?.final_event_date, '—'),
    '[שעת_התחלה]': hhmm(project?.final_start_time),
    '[שעת_סיום]': hhmm(project?.final_end_time),
    // 🔴 **הכתובת המלאה** ולא העיר — זה מה שהדיילת מנווטת אליו בבוקר האירוע.
    '[כתובת_אירוע_מלאה]': project?.final_location ?? '',
    '[שם_מנהלת_פרויקט]': contact.name,
    '[טלפון_מנהלת_פרויקט]': contact.phone,
  })
  if (!body) return null

  return buildEmailPayload({
    to: hostess.email,
    subject: finalApprovalSubject(project),
    body,
    requireAttachment: false,
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
