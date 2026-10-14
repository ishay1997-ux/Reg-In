// פרטי-שגיאה שיוצאים מהפונקציה (תשובה ללקוח + `email_log.error_message`) — בלי כתובות URL ועד 500
// תווים. 🔒 הודעת-רשת של `fetch` עלולה לכלול את כתובת ה-webhook של Make, שהיא סוד: היא חייבת
// להישאר רק במשתנה-הסביבה. אותו כלל כמו `sanitizeDetail` ב-`payroll/pipeline.ts`.
export function sanitizeDetail(detail: unknown): string | null {
  if (detail === null || detail === undefined) return null
  return String(detail)
    .replace(/https?:\/\/\S+/gi, '[url]')
    .slice(0, 500)
}
