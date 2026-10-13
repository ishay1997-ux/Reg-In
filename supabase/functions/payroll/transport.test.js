// @vitest-environment node
// סיווג תוצאת השליחה ל-Make (חוזה §3.1 שלב 4): 2xx ⇒ נשלח · אחר ⇒ נכשל · חריגה/פסק-זמן ⇒ לא ידוע.
import { describe, it, expect, vi } from 'vitest'
import { sendToMake } from './transport.ts'

const PAYLOAD = { to: 'ishay1997@gmail.com', subject: 'נושא', body: '<div>x</div>' }

describe('sendToMake', () => {
  it('2xx ⇒ sent, וחמשת המפתחות נשלחים תמיד (ריק = אין מצורף)', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }))
    const out = await sendToMake('https://hook.example/x', PAYLOAD, fetchImpl)
    expect(out).toEqual({ outcome: 'sent', httpStatus: 200 })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://hook.example/x')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      to: 'ishay1997@gmail.com',
      subject: 'נושא',
      body: '<div>x</div>',
      filename: '',
      pdf_base64: '',
    })
  })

  it('502 ⇒ failed עם קוד-HTTP', async () => {
    const out = await sendToMake('u', PAYLOAD, async () => new Response('', { status: 502 }))
    expect(out).toEqual({ outcome: 'failed', httpStatus: 502, errorCode: 'TRANSPORT_REJECTED' })
  })

  it('ניתוק רשת אחרי שהבקשה יצאה ⇒ unknown (לא failed)', async () => {
    const out = await sendToMake('u', PAYLOAD, async () => {
      throw new TypeError('connection reset')
    })
    expect(out.outcome).toBe('unknown')
    expect(out.errorCode).toBe('TRANSPORT_UNKNOWN')
    expect(out.httpStatus).toBeNull()
  })

  it('פסק-זמן ⇒ הבקשה מבוטלת ⇒ unknown', async () => {
    const fetchImpl = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        )
      })
    const out = await sendToMake('u', PAYLOAD, fetchImpl, 10)
    expect(out.outcome).toBe('unknown')
    expect(out.detail).toContain('AbortError')
  })
})
