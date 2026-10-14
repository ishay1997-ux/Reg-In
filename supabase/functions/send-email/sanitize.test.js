// @vitest-environment node
// פרטי-שגיאה של send-email לא חושפים את כתובת ה-webhook (תשובה + יומן).
import { describe, it, expect } from 'vitest'
import { sanitizeDetail } from './sanitize.ts'

describe('sanitizeDetail', () => {
  it.each([
    ['error sending request for url (https://hook.eu1.make.com/SECRET123): connection reset'],
    ['HTTP://HOOK.EU1.MAKE.COM/abc?x=1 timed out'],
    ['two https://a.example/x and http://b.example/y'],
  ])('%s ⇒ בלי URL', (message) => {
    const out = sanitizeDetail(message)
    expect(out).not.toMatch(/https?:\/\//i)
    expect(out).not.toContain('SECRET123')
    expect(out).toContain('[url]')
  })

  it('הודעה בלי URL נשמרת; ארוכה נחתכת ל-500', () => {
    expect(sanitizeDetail('network error')).toBe('network error')
    expect(sanitizeDetail('x'.repeat(900))).toHaveLength(500)
    expect(sanitizeDetail(null)).toBeNull()
  })

  it('index.ts מעביר את הודעת השגיאה דרך sanitizeDetail', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const source = readFileSync(fileURLToPath(new URL('./index.ts', import.meta.url)), 'utf8')
    expect(source).toContain("sanitizeDetail(err instanceof Error ? err.message : 'network error')")
    expect(source).not.toMatch(/errorMessage = err instanceof Error \? err\.message/)
  })
})
