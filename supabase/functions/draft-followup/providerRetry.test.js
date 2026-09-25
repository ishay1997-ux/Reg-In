// בדיקות-יחידה ל-`providerRetry.ts` — לולאת הניסיון-החוזר של `draft-followup`, בשעון מזויף.
// 🔑 **מה נשמר כאן (הכרעת-הסגן 25/09/2026, #5):** ספק שנתקע לא מושך את הריצה מעבר לתקציב. בלי חיתוך-התקרה
// ניסיון שמתחיל שנייה לפני ה-deadline מקבל 60 שניות מלאות ⇒ ~150 שניות, תקרת-הזמן של פונקציית-קצה.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MIN_ATTEMPT_MS, RETRY_WAITS_MS, callWithRetry } from './providerRetry.ts'

// אותם מספרים כמו ב-`index.ts` (`BUDGET_MS` · `PROVIDER_TIMEOUT_MS`).
const BUDGET_MS = 90_000
const ATTEMPT_MS = 60_000
const PLATFORM_LIMIT_MS = 150_000

const timeout = () => Object.assign(new Error('timeout'), { httpStatus: 504 })
// ספק "תקוע": לא עונה אף פעם, ונכשל רק כשהתקרה שקיבל נגמרת — כמו `AbortSignal.timeout`.
const hangingProvider = (log) => (timeoutMs) => {
  log.push({ at: Date.now(), timeoutMs })
  return new Promise((_, reject) => setTimeout(() => reject(timeout()), timeoutMs))
}
const options = (deadline, extra = {}) => ({
  deadline,
  attemptMs: ATTEMPT_MS,
  isTransient: (err) => err?.httpStatus >= 500,
  exhausted: () => Object.assign(new Error('budget'), { httpStatus: 504, exhausted: true }),
  ...extra,
})

describe('callWithRetry — תקרת-זמן', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('ספק תקוע ⇒ הריצה נגמרת עד ה-deadline, מתחת ל-150 שניות של הפלטפורמה', async () => {
    const start = Date.now()
    const log = []
    let endedAt = null
    const run = callWithRetry(hangingProvider(log), options(start + BUDGET_MS)).catch((err) => {
      endedAt = Date.now()
      return err
    })
    await vi.advanceTimersByTimeAsync(PLATFORM_LIMIT_MS + 10_000)
    const err = await run

    expect(err.httpStatus).toBe(504)
    expect(endedAt - start).toBeLessThanOrEqual(BUDGET_MS)
    expect(endedAt - start).toBeLessThan(PLATFORM_LIMIT_MS)
    // ניסיון 1 מקבל 60 מלאות; ניסיון 2 (אחרי המתנה של 2 שניות) רק את מה שנשאר: 90 − 62 = 28.
    expect(log.map((a) => a.timeoutMs)).toEqual([
      ATTEMPT_MS,
      BUDGET_MS - ATTEMPT_MS - RETRY_WAITS_MS[0],
    ])
  })

  it('אף ניסיון לא מקבל תקרה שחוצה את ה-deadline', async () => {
    const start = Date.now()
    const log = []
    const run = callWithRetry(hangingProvider(log), options(start + BUDGET_MS)).catch((e) => e)
    await vi.advanceTimersByTimeAsync(PLATFORM_LIMIT_MS)
    await run
    for (const a of log) expect(a.at + a.timeoutMs).toBeLessThanOrEqual(start + BUDGET_MS)
  })

  it('פחות מ-MIN_ATTEMPT_MS נשארו ⇒ לא פותחים ניסיון בכלל, ונזרק "התקציב נגמר"', async () => {
    const attempt = vi.fn()
    const err = await callWithRetry(attempt, options(Date.now() + MIN_ATTEMPT_MS - 1)).catch(
      (e) => e,
    )
    expect(attempt).not.toHaveBeenCalled()
    expect(err.exhausted).toBe(true)
  })
})

describe('callWithRetry — מתי מנסים שוב (הדפוס של classify-feedback)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('5xx מהיר ואז הצלחה ⇒ מחזיר את התשובה, עם ניסיון-חוזר אחד', async () => {
    const onRetry = vi.fn()
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('busy'), { httpStatus: 503 }))
      .mockResolvedValueOnce('draft')
    const run = callWithRetry(attempt, options(Date.now() + BUDGET_MS, { onRetry }))
    await vi.advanceTimersByTimeAsync(RETRY_WAITS_MS[0])
    await expect(run).resolves.toBe('draft')
    expect(attempt).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith(1, expect.objectContaining({ httpStatus: 503 }))
  })

  it('429 (מכסה) ⇒ לא מנסים שוב — כל ניסיון שורף עוד בקשה מאותה מכסה', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('quota'), { httpStatus: 429 }))
    const err = await callWithRetry(attempt, options(Date.now() + BUDGET_MS)).catch((e) => e)
    expect(err.httpStatus).toBe(429)
    expect(attempt).toHaveBeenCalledTimes(1)
  })

  it('5xx שחוזר תמיד ⇒ לכל היותר 3 ניסיונות (שתי המתנות)', async () => {
    const attempt = vi.fn().mockRejectedValue(Object.assign(new Error('busy'), { httpStatus: 500 }))
    const run = callWithRetry(attempt, options(Date.now() + BUDGET_MS)).catch((e) => e)
    await vi.advanceTimersByTimeAsync(RETRY_WAITS_MS[0] + RETRY_WAITS_MS[1])
    await run
    expect(attempt).toHaveBeenCalledTimes(RETRY_WAITS_MS.length + 1)
  })
})
