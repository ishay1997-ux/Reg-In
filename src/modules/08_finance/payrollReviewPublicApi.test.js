// בדיקות שכבת הנתונים של הדף האישי: שמות ה-RPC והפרמטרים (החוזה מול מיגרציה 12), שגיאת
// רשת נזרקת ולא הופכת ל"לא בתוקף", ולוגיקת הטופס הטהורה.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: (...args) => rpc(...args) } }))

const {
  fetchPayrollReview,
  respondToPayrollReview,
  validateObjection,
  buildCasePayload,
  zeroReasonText,
  newRequestId,
  EMPTY_OBJECTION,
  OBJECTION_CATEGORIES,
} = await import('./payrollReviewPublicApi')

beforeEach(() => rpc.mockReset())

describe('קריאות הרשת', () => {
  it('fetchPayrollReview ⇒ payroll_review_public_get עם הטוקן בלבד', async () => {
    rpc.mockResolvedValue({ data: { state: 'invalid' }, error: null })
    await expect(fetchPayrollReview('tok')).resolves.toEqual({ state: 'invalid' })
    expect(rpc).toHaveBeenCalledWith('payroll_review_public_get', { p_token: 'tok' })
  })

  it('respondToPayrollReview ⇒ payroll_review_public_respond עם חמשת הפרמטרים', async () => {
    rpc.mockResolvedValue({ data: { state: 'approved' }, error: null })
    await respondToPayrollReview({
      token: 'tok',
      requestId: 'req',
      digest: 'd1:x',
      action: 'approve',
    })
    expect(rpc).toHaveBeenCalledWith('payroll_review_public_respond', {
      p_token: 'tok',
      p_request_id: 'req',
      p_digest: 'd1:x',
      p_action: 'approve',
      p_case: null,
    })
  })

  it('שגיאת רשת/מסד נזרקת — לא מוחזרת כ"לא בתוקף" או כריק', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'fetch failed' } })
    await expect(fetchPayrollReview('tok')).rejects.toEqual({ message: 'fetch failed' })
    await expect(
      respondToPayrollReview({ token: 't', requestId: 'r', digest: 'd', action: 'approve' }),
    ).rejects.toEqual({ message: 'fetch failed' })
  })

  it('newRequestId מחזיר UUID שונה בכל קריאה', () => {
    const a = newRequestId()
    expect(a).toMatch(/^[0-9a-f-]{36}$/)
    expect(newRequestId()).not.toBe(a)
  })
})

describe('validateObjection', () => {
  const valid = { ...EMPTY_OBJECTION, rowKeys: ['r1'], category: 'hours', description: 'x' }

  it('טופס תקין ⇒ אין שגיאות', () => {
    expect(validateObjection(valid)).toEqual({})
  })

  it('טופס ריק ⇒ שגיאה על משמרת, סוג ותיאור — כל אחת עם שם השדה', () => {
    const errors = validateObjection(EMPTY_OBJECTION)
    expect(Object.keys(errors).sort()).toEqual(['category', 'description', 'rows'])
    expect(errors.rows.startsWith('משמרת:')).toBe(true)
    expect(errors.category.startsWith('סוג הטעות:')).toBe(true)
    expect(errors.description.startsWith('מה לא נכון:')).toBe(true)
  })

  it('"משמרת חסרה" (סימון או קטגוריה) מחליף סימון שורה', () => {
    expect(validateObjection({ ...valid, rowKeys: [], missingShift: true })).toEqual({})
    expect(validateObjection({ ...valid, rowKeys: [], category: 'missing_shift' })).toEqual({})
  })

  it('תיאור של רווחים בלבד ⇒ ריק; 2001 תווים ⇒ ארוך מדי; 2000 ⇒ תקין', () => {
    expect(validateObjection({ ...valid, description: '   ' }).description).toBeTruthy()
    expect(validateObjection({ ...valid, description: 'א'.repeat(2001) }).description).toContain(
      'עד 2000',
    )
    expect(validateObjection({ ...valid, description: 'א'.repeat(2000) })).toEqual({})
  })

  it.each([
    ['', true],
    ['0', true],
    ['8.5', true],
    ['100000', true],
    ['-1', false],
    ['100001', false],
    ['abc', false],
    ['Infinity', false],
  ])('מספר מוצע %s ⇒ תקין=%s', (value, ok) => {
    const errors = validateObjection({ ...valid, suggestedValue: value })
    expect(Boolean(errors.suggested_value)).toBe(!ok)
  })

  it('קטגוריה שאינה ברשימה ⇒ שגיאה', () => {
    expect(validateObjection({ ...valid, category: 'bank' }).category).toBeTruthy()
  })

  it('חמש הקטגוריות תואמות את ה-CHECK במסד', () => {
    expect(OBJECTION_CATEGORIES.map((c) => c.value)).toEqual([
      'hours',
      'rate',
      'bonus_travel',
      'missing_shift',
      'other',
    ])
  })
})

describe('buildCasePayload', () => {
  it('מנקה רווחים, ממיר מספר, ומסמן משמרת חסרה גם מהקטגוריה', () => {
    expect(
      buildCasePayload({
        rowKeys: [],
        missingShift: false,
        category: 'missing_shift',
        description: '  חסרה משמרת  ',
        suggestedValue: ' 6 ',
      }),
    ).toEqual({
      category: 'missing_shift',
      row_keys: [],
      missing_shift: true,
      description: 'חסרה משמרת',
      suggested_value: 6,
    })
  })

  it('מספר מוצע ריק ⇒ null (לא 0)', () => {
    expect(
      buildCasePayload({ ...EMPTY_OBJECTION, rowKeys: ['r2'], category: 'rate', description: 'x' })
        .suggested_value,
    ).toBeNull()
  })
})

describe('zeroReasonText', () => {
  it('שלוש הסיבות מוסברות, ו-null/לא מוכר ⇒ ריק', () => {
    expect(zeroReasonText('force_majeure')).toContain('כוח עליון')
    expect(zeroReasonText('cancelled_early')).toContain('מספיק זמן מראש')
    expect(zeroReasonText('no_hours')).toContain('לא נרשמו שעות')
    expect(zeroReasonText(null)).toBe('')
    expect(zeroReasonText('x')).toBe('')
  })
})
