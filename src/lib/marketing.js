// לוגיקה עסקית של אזור-השיווק במודול 2 (מסך 5.6.3) — SSOT יחיד (כלל 14): כל כלל נכתב כאן
// פעם אחת ונבדק, ו-`MarketingPanel` רק מייבא. הופרד מהקומפוננטה ב-29/07/2026 כשכללי sonarjs
// הוקשחו ל-'error' — אותה תבנית שהורידה את `CustomerFormDialog` ו-`CustomersPage` מתחת לסף.
//
// 🚧 מ10 — מודל-השליחה כאן זמני (mailto + קישור ציבורי, בלי מעקב-שליחות); מודול 10 מחליף
// בשליחת-שרת אמיתית. רשום ב-PROJECT_MASTER §6 ("שליחת חומר שיווקי אמיתית").
//
// ⚠️ כל הפונקציות כאן נקראות **בזמן render** ולכן חייבות להישאר טהורות —
// אסור `Date.now()`/`Math.random()` (‏`react-hooks/purity` היא שגיאה חוסמת בקונפיג הזה).

// mailto ארוך מדי נחתך בשקט ע"י מערכת-ההפעלה (~2,000 תווים ב-Windows) — חלק מהנמענים לא יקבלו
// דיוור בלי שום שגיאה. לכן סף-בטיחות מתחת לגבול: מעליו לא מרנדרים mailto חתוך — משביתים ומפנים
// ל"העתק רשימת נמענים". (השליחה האמיתית בלי מגבלה = מודול 10.)
// **פרטי במכוון** — לא מיוצא, כדי לא לחזור על ממצא-knip של `MARKETING_MAX_BYTES`.
const MAILTO_MAX_CHARS = 1900

const SUBJECT = 'חומר שיווקי מ-REG-IN'

// הנמענים שנבחרו לשליחה הנוכחית. ההחרגות (§Q3, הכרעת-ישי) הן **פר-שליחה בלבד** — ביטול-וי
// לא נוגע בהסכמה-הקבועה שב-DB. מחזיר מערך חדש; לא משנה את הקלט.
export function selectRecipients(recipients, excludedIds) {
  return (recipients ?? []).filter((r) => !excludedIds?.has(r.customer_id))
}

// רשימת ה-BCC נגזרת מהנמענים עם dedup על email — ‏email **אינו UNIQUE** ב-DB (§7.65), ולכן
// שני לקוחות שונים יכולים לחלוק כתובת. בלי ה-dedup אותה כתובת הייתה מופיעה פעמיים ב-BCC.
export function dedupeEmails(rows) {
  return [...new Set((rows ?? []).map((r) => r.email))]
}

// סוג התצוגה-המקדימה לפי ה-MIME של הקובץ שהועלה. ה-MIME כבר נבדק מול MARKETING_ALLOWED_MIME
// ב-api.uploadMarketingFile — כאן רק בוחרים <img> מול <embed>; מחרוזת ריקה = בלי תצוגה מקדימה.
export function marketingPreviewKind(mimeType) {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  return ''
}

// גוף ה-mailto. ‏encodeURIComponent על הנושא והגוף הוא **load-bearing**: ה-& וה-? שבתוך הקישור
// הציבורי לקובץ היו חותכים את גוף ההודעה אחרת. השער הוא קיום-הקובץ (ולא ה-URL), בדיוק כמו
// הטרנארי המקורי בקומפוננטה.
export function buildMarketingMailtoHref({ hasFile, publicUrl, bccEmails }) {
  if (!hasFile) return ''
  const body = `לצפייה בחומר השיווקי: ${publicUrl}`
  return `mailto:?bcc=${encodeURIComponent((bccEmails ?? []).join(','))}&subject=${encodeURIComponent(
    SUBJECT,
  )}&body=${encodeURIComponent(body)}`
}

// האם ה-mailto יקוטע בשקט. השוואה `>` ולא `>=` — אורך של בדיוק הסף עדיין מותר (התנהגות קיימת).
export function isMailtoTooLong(href) {
  return (href ?? '').length > MAILTO_MAX_CHARS
}

// הסיבה שכפתור-השליחה מושבת, כטקסט ה-title. סדר-הקדימויות משמעותי: חוסר-קובץ קודם לכל,
// ואחריו ההבחנה בין "אין בכלל מאושרי-דיוור" (בעיה שנפתרת ברשימת-הלקוחות) לבין "יש מאושרים
// אבל הוסרו לשליחה הזו" (נפתר כאן) — שתי הודעות שונות כי הפעולה המתקנת שונה.
// ⚠️ ארבע המחרוזות הן **חוזה** (‏title גלוי ל-E2E ולקורא-מסך). המקף ב"ארוכה מדי" הוא
// **U+2014 (מקף ארוך)** — הקלדה מחדש עם `-` רגיל שוברת את החוזה בשקט.
export function disabledSendReason({ hasFile, selectedCount, consentedCount }) {
  if (!hasFile) return 'יש להעלות קובץ תחילה'
  if (selectedCount > 0) return 'רשימת הנמענים ארוכה מדי — השתמשו בהעתקה'
  return consentedCount === 0 ? 'אין לקוחות שאישרו דיוור' : 'לא נבחרו נמענים לשליחה'
}
