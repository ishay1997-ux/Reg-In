// שליחה אחת ל-webhook של Make, וסיווג התוצאה לאחד משלושה מצבים (חוזה §3.1 שלב 4).
//
// 🔑 **שלושה ולא שניים:** תשובה 2xx = נשלח · תשובה שאינה 2xx = נכשל (Make ענה שלא שלח) ·
// כל חריגה **אחרי** שהבקשה יצאה (פסק-זמן, ניתוק) = **לא ידוע** — ייתכן שהמייל כבר יצא, ולכן אסור
// לומר "נכשל" (זה היה מזמין שליחה כפולה) ואסור לומר "נשלח".
// ⚠️ חמשת המפתחות נשלחים תמיד — זה החוזה הקיים מול תרחיש ה-Make; מחרוזת ריקה = אין מצורף.

export const TRANSPORT_TIMEOUT_MS = 25_000

export interface TransportPayload {
  to: string
  subject: string
  body: string
  filename: string
  pdf_base64: string
}

export type TransportOutcome =
  | { outcome: 'sent'; httpStatus: number }
  | { outcome: 'failed'; httpStatus: number; errorCode: 'TRANSPORT_REJECTED' }
  | { outcome: 'unknown'; httpStatus: null; errorCode: 'TRANSPORT_UNKNOWN'; detail: string }

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export async function sendToMake(
  webhookUrl: string,
  payload: TransportPayload,
  fetchImpl: FetchLike = fetch,
  timeoutMs = TRANSPORT_TIMEOUT_MS,
): Promise<TransportOutcome> {
  const body = JSON.stringify({
    to: payload.to,
    subject: payload.subject ?? '',
    body: payload.body,
    filename: payload.filename ?? '',
    pdf_base64: payload.pdf_base64 ?? '',
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })
    if (res.ok) return { outcome: 'sent', httpStatus: res.status }
    return { outcome: 'failed', httpStatus: res.status, errorCode: 'TRANSPORT_REJECTED' }
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : 'transport error'
    return { outcome: 'unknown', httpStatus: null, errorCode: 'TRANSPORT_UNKNOWN', detail }
  } finally {
    clearTimeout(timer)
  }
}
