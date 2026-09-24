// טיוטת מייל-מעקב בעזרת AI (ליטושי-הכנס, חבילה D2, 24/09/2026) — הכללים הטהורים, SSOT (כלל 14).
//
// 🔗 הזרימה: חלון-המסמך (`03_quotes/QuoteDocumentDialog.jsx`) ⇒ "נסחי מייל מעקב" ⇒ חלון-הטיוטה
//    (`03_quotes/FollowupDraftDialog.jsx`) ⇒ `draftFollowupEmail` (`03_quotes/api.js`) ⇒ פונקציית-השרת
//    `supabase/functions/draft-followup` ⇒ Gemini. **המקור המלא: `docs/plans/2026-09-24-system-polish.md` §6 D2.**
//
// 🔒 **המערכת לעולם לא שולחת.** שתי הפעולות כאן הן "העתיקי" ו"פתחי במייל" (`mailto:`) — שתיהן
//    מעבירות את הטקסט לאדם, שבודק ושולח בעצמו. זו הסיבה ש"טיוטה — בדקי לפני שליחה." קבוע ולא רמז:
//    אזהרה לפני פעולה יוצאת-החוצה **לעולם** לא עוברת לשכבת-ההסבר (מדריך-הסגנון H2 · §6ה-ג).
//
// ⚠️ הכול כאן נקרא בזמן render ⇒ טהור (`react-hooks/purity`): בלי `Date.now()`, בלי רשת.

import { isMailtoTooLong } from '@/lib/marketing'

// ‏35 שניות: לפונקציית-השרת יש תקציב משלה — `BUDGET_MS` ב-`supabase/functions/draft-followup/index.ts`
// (27 שניות מאז `0fa4ff55`) — והחלון מחכה לה, ועוד 8 שניות ל-cold-start ולרשת. ⇒ השרת תמיד עונה
// (טיוטה או "הניסוח נכשל") לפני שהחלון מוותר. ✏️ 24/09/2026 (הסגן): היה 30 — 3 שניות מרווח בלבד.
// ⚠️ **היעד ≤10 שניות (התוכנית §6ה-ה) לא עמד** בשתי המדידות החיות (18.7 · 25 שניות בלי תשובה) — זו התקרה.
export const FOLLOWUP_DRAFT_TIMEOUT_MS = 35_000

// 🔌 **המתג של הכפתור "נסחי מייל מעקב" — כבוי.** הכרעת-הסגן 24/09/2026: *"אם הקריאה החיה המדודה לא
// מחזירה טיוטה ⇐ להסתיר את הכפתור (הקוד נשאר)"*. 📏 **שלוש קריאות-אמת, שלושתן בלי תשובה מהספק:**
// 10:58 UTC (תקרה 18 שנ') · 11:05 (25 שנ') · 13:15 (25 שנ', כבר עם `max_output_tokens` 1024 — כך
// שזה אינו ייצור-שבורח). ⇒ כפתור שתמיד נגמר ב"הניסוח נכשל" גרוע מאין-כפתור. **החלון, השרת והבדיקות
// נשארים כמו שהם**; מדליקים כאן אחרי קריאה חיה אחת שמחזירה טיוטה (`supabase/functions/draft-followup/README.md`).
export const FOLLOWUP_AI_AVAILABLE = false

// סיבת-הדחייה שעבודת-התפוגה כותבת (`20260731085335_module3_vat_and_expiry_param_guards.sql:121`).
// פרטי במכוון — ייצוא בלי צרכן הוא ממצא-knip.
const FOLLOWUP_EXPIRED_REASON = 'פג תוקף'

// הנוסחים — כלשון התוכנית §6 D2. ⚠️ `FOLLOWUP_NOT_SENT_REASON` **זהה** לתשובת-ה-409 של השרת
// (בלי הנקודה, כי כאן הוא טקסט-עזר ליד כפתור — R3/R14): אותה עובדה, אותן מילים, בשני הצדדים.
export const FOLLOWUP_LABEL = 'נסחי מייל מעקב'
export const FOLLOWUP_NOT_SENT_REASON = 'ההצעה עוד לא נשלחה ללקוח'
export const FOLLOWUP_CHECKING_REASON = 'בודקת אם ההצעה נשלחה…'
export const FOLLOWUP_NO_EMAIL_REASON = 'אין מייל לאיש הקשר הראשי'
export const FOLLOWUP_NOTICE = 'טיוטה — בדקי לפני שליחה.'
export const FOLLOWUP_FAILED_MESSAGE = 'הניסוח נכשל — נסי שוב.'
export const FOLLOWUP_QUOTA_MESSAGE = 'הגעת למכסת ה-AI — נסי שוב מאוחר יותר.'

/**
 * האם הכפתור מוצג, ואם הוא מושבת — למה (הנימוק מוצג **כטקסט גלוי**, לא רק `title`: §6ה-ד).
 *
 * @param quote       ההצעה שבחלון
 * @param canEdit     `edit` על 'הצעות מחיר' — אותו שער שבשרת (כל קריאה שורפת מכסת-AI)
 * @param lastSend    תלת-מצבי, **בדיוק** כמו `previousSend` בחלון-המסמך:
 *                    `undefined` = טרם ידוע · `null` = נטען, לא נשלחה · אובייקט = נשלחה
 * @param sentNow     נשלחה בחלון הזה עכשיו (לפני שהיומן נטען מחדש)
 * @param checkFailed שאילתת-היומן נכשלה (החלון כבר מציג על כך באנר ענבר)
 *
 * 🔑 **"לא ידוע" שנכשל ⇒ פעיל, לא מושבת:** טיוטה אינה שולחת כלום, והשרת בודק את היומן בעצמו
 *    ועונה 409 `ההצעה עוד לא נשלחה ללקוח.` אם אין שליחה — כך האמת נאמרת גם כשהשאילתה כאן נפלה.
 *    ⛔ השבתה על "לא ידוע" הייתה חוסמת בדיוק כשאין לנו מידע, ואומרת נימוק שאיננו יודעים שהוא נכון.
 */
export function followupAvailability({ quote, canEdit, lastSend, sentNow, checkFailed }) {
  const hidden = { show: false, disabledReason: '' }
  if (!canEdit || !quote?.quote_id) return hidden
  if (quote.quote_status === 'rejected' && quote.rejection_reason === FOLLOWUP_EXPIRED_REASON) {
    return { show: true, disabledReason: '' }
  }
  if (quote.quote_status !== 'in_progress') return hidden
  if (sentNow || lastSend) return { show: true, disabledReason: '' }
  if (lastSend === null) return { show: true, disabledReason: FOLLOWUP_NOT_SENT_REASON }
  return { show: true, disabledReason: checkFailed ? '' : FOLLOWUP_CHECKING_REASON }
}

/**
 * תשובת-כשל של השרת ⇒ מה החלון אומר ומה הוא מציע.
 * - `quota` (429) — אין "נסי שוב" עכשיו: המכסה לא נפתחת בשנייה, וכל ניסיון שורף ממנה.
 * - `final` (4xx אחר: הרשאה · לא נמצאה · לא-זכאית · וגם 500 `unavailable` = אין מפתח-AI) — ההודעה של
 *   השרת כלשונה; ניסיון-חוזר לא ישנה דבר.
 * - `retry` (5xx · רשת · פסק-זמן · תשובה ריקה) — `נסי שוב`.
 */
export function classifyFollowupFailure(body, httpStatus) {
  const serverMessage = typeof body?.error === 'string' && body.error.trim() ? body.error : ''
  if (httpStatus === 429 || body?.status === 'quota') {
    return { kind: 'quota', message: FOLLOWUP_QUOTA_MESSAGE }
  }
  // מפתח-AI שלא הוגדר (500 עם `unavailable`) — סופי: "נסי שוב" לא יתקין מפתח, והיה מבטיח דרך שאין.
  if ((httpStatus >= 400 && httpStatus < 500) || body?.status === 'unavailable') {
    return { kind: 'final', message: serverMessage || FOLLOWUP_FAILED_MESSAGE }
  }
  return { kind: 'retry', message: serverMessage || FOLLOWUP_FAILED_MESSAGE }
}

// טיוטה ריקה אינה טיוטה (התוכנית: *"לעולם לא טיוטה ריקה"*) — מחזיר null, והקורא הופך אותו לכשל.
export function readFollowupDraft(data) {
  const subject = typeof data?.draft?.subject === 'string' ? data.draft.subject.trim() : ''
  const body = typeof data?.draft?.body === 'string' ? data.draft.body.trim() : ''
  if (!subject || !body) return null
  const to = typeof data?.to === 'string' && data.to.trim() ? data.to.trim() : null
  return { subject, body, to }
}

// השרת מסיים ב"בברכה," בלי שם; החתימה היא `buildSenderSignature` (`src/lib/quotes.js`) של מי שלחצה —
// אותו בלוק של מייל-ההצעה, כך ששם המשתמשת לא נשלח למודל ואין עותק שני של כללי-החתימה.
export function composeFollowupBody(body, signature) {
  const sign = (signature ?? '').trim()
  return sign ? `${body}\n${sign}` : body
}

/**
 * קישור ה-`mailto:` של "פתחי במייל", מהנוסח **הערוך** שבחלון.
 *
 * 🔴 **ולמה לפעמים בלי גוף:** קישור-mailto ארוך נחתך בשקט ע"י מערכת-ההפעלה (~2,000 תווים ב-Windows —
 *    הסף `isMailtoTooLong` של `src/lib/marketing.js`, ששם נולד מאותה תקלה). ‏`encodeURIComponent` על
 *    עברית = 6 תווים לכל אות ⇒ טיוטה בת 5 שורות עוברת את הסף בקלות. **גוף חתוך באמצע משפט גרוע
 *    מגוף חסר** ⇒ מעל הסף הקישור נושא נמען + נושא בלבד, `bodyIncluded: false`, והחלון מעתיק את הגוף
 *    ללוח ואומר זאת בגלוי. ‏`\n` ⇐ `\r\n` כי זה מעבר-השורה ש-RFC 6068 מגדיר לגוף-mailto.
 */
export function buildFollowupMailto({ to, subject, body }) {
  const base = `mailto:${encodeURIComponent(to ?? '')}?subject=${encodeURIComponent(subject ?? '')}`
  const full = `${base}&body=${encodeURIComponent((body ?? '').replace(/\r?\n/g, '\r\n'))}`
  return isMailtoTooLong(full)
    ? { href: base, bodyIncluded: false }
    : { href: full, bodyIncluded: true }
}
