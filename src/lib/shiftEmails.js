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

// "18:00:00" ⇒ "18:00". שעה חסרה מוחזרת כמקף ולא כמחרוזת ריקה — *"שעות: עד 22:00"*
// נראה כמו תקלה, ו-`fillEmailTemplate` ממילא אינו יודע להשמיט שורה.
function hhmm(value) {
  return typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : '—'
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
