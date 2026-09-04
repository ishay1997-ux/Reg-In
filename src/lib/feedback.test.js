// בדיקות הלוגיקה הטהורה של משטח S4 — `stateFromPagePayload`/`stateFromSubmitPayload`.
// דפוס-הבדיקה זהה ל-`shiftInvite.test.js`: בדיקות-יחידה ישירות על ה-payload,
// בלי React ובלי מוקים.
import { describe, it, expect } from 'vitest'
import {
  FEEDBACK_STATE,
  FEEDBACK_NEGATIVE_REASONS,
  FEEDBACK_POSITIVE_REASONS,
  sanitizeReasons,
  stateFromPagePayload,
  stateFromSubmitPayload,
} from './feedback'

describe('stateFromPagePayload (get_feedback_page ⇐ מצב-מסך)', () => {
  it('ok ⇒ form', () => {
    expect(stateFromPagePayload({ state: 'ok' })).toBe(FEEDBACK_STATE.form)
  })
  it('already ⇒ already', () => {
    expect(stateFromPagePayload({ state: 'already' })).toBe(FEEDBACK_STATE.already)
  })
  it('not_found ⇒ dead (מכסה טוקן ריק/שגוי/מת — אותו אובייקט בכוונה)', () => {
    expect(stateFromPagePayload({ state: 'not_found' })).toBe(FEEDBACK_STATE.dead)
  })
  it('ערך לא-מוכר או payload ריק ⇒ dead, לא form (ברירת-מחדל בטוחה)', () => {
    expect(stateFromPagePayload({ state: 'something-new' })).toBe(FEEDBACK_STATE.dead)
    expect(stateFromPagePayload(null)).toBe(FEEDBACK_STATE.dead)
    expect(stateFromPagePayload(undefined)).toBe(FEEDBACK_STATE.dead)
  })
})

describe('stateFromSubmitPayload (submit_feedback ⇐ מצב-מסך)', () => {
  it('ok ⇒ thankYou', () => {
    expect(stateFromSubmitPayload({ state: 'ok' })).toBe(FEEDBACK_STATE.thankYou)
  })
  it('already (מרוץ — הוגש בין הטעינה להגשה) ⇒ already', () => {
    expect(stateFromSubmitPayload({ state: 'already' })).toBe(FEEDBACK_STATE.already)
  })
  it('not_found (מרוץ — הועבר לארכיון בין הטעינה להגשה) ⇒ dead', () => {
    expect(stateFromSubmitPayload({ state: 'not_found' })).toBe(FEEDBACK_STATE.dead)
  })
  it('invalid — כלום לא נכתב ⇒ null (המסך נשאר על הטופס, לא "הצלחה" מזויפת)', () => {
    expect(stateFromSubmitPayload({ state: 'invalid' })).toBe(null)
  })
  it('payload ריק/לא-מוכר ⇒ null (אותו טיפול כמו invalid — לעולם לא מתקדם ללא הבטחה)', () => {
    expect(stateFromSubmitPayload(null)).toBe(null)
    expect(stateFromSubmitPayload({ state: 'something-new' })).toBe(null)
  })
})

describe('FEEDBACK_REASONS & sanitizeReasons', () => {
  it('רשימות הסיבות מכילות 5 ערכים כל אחת, בדיוק לפי הסכימה', () => {
    expect(FEEDBACK_NEGATIVE_REASONS).toHaveLength(5)
    expect(FEEDBACK_POSITIVE_REASONS).toHaveLength(5)
    expect(FEEDBACK_NEGATIVE_REASONS).toContain('איחור דיילות')
    expect(FEEDBACK_POSITIVE_REASONS).toContain('מקצועיות הדיילות')
  })

  it('sanitizeReasons: ציון נמוך (<=3) שומר סיבות שליליות תקפות ומאפס סיבות חיוביות', () => {
    expect(sanitizeReasons(2, ['איחור דיילות', 'תפקוד דיילות'], ['מקצועיות הדיילות'])).toEqual({
      negativeReasons: ['איחור דיילות', 'תפקוד דיילות'],
      positiveReasons: [],
      negativeReason: 'איחור דיילות',
      positiveReason: null,
    })
    expect(sanitizeReasons(3, 'איכות תגים', null)).toEqual({
      negativeReasons: ['איכות תגים'],
      positiveReasons: [],
      negativeReason: 'איכות תגים',
      positiveReason: null,
    })
  })

  it('sanitizeReasons: ציון גבוה (>=4) שומר סיבות חיוביות תקפות ומאפס סיבות שליליות', () => {
    expect(sanitizeReasons(4, ['איחור דיילות'], ['מקצועיות הדיילות', 'עמידה בזמנים'])).toEqual({
      negativeReasons: [],
      positiveReasons: ['מקצועיות הדיילות', 'עמידה בזמנים'],
      negativeReason: null,
      positiveReason: 'מקצועיות הדיילות',
    })
    expect(sanitizeReasons(5, null, 'עמידה בזמנים')).toEqual({
      negativeReasons: [],
      positiveReasons: ['עמידה בזמנים'],
      negativeReason: null,
      positiveReason: 'עמידה בזמנים',
    })
  })

  it('sanitizeReasons: ערכים שאינם ברשימה הסגורה מסוננים החוצה', () => {
    expect(sanitizeReasons(2, ['איחור דיילות', 'ערך זר ולא מאושר'], null)).toEqual({
      negativeReasons: ['איחור דיילות'],
      positiveReasons: [],
      negativeReason: 'איחור דיילות',
      positiveReason: null,
    })
    expect(sanitizeReasons(5, null, ['הזרקת SQL', 'מקצועיות הדיילות'])).toEqual({
      negativeReasons: [],
      positiveReasons: ['מקצועיות הדיילות'],
      negativeReason: null,
      positiveReason: 'מקצועיות הדיילות',
    })
  })

  it('sanitizeReasons: כשאין ציון (null/undefined) מחזיר מערכים ריקים ו-null', () => {
    expect(sanitizeReasons(null, ['איחור דיילות'], ['מקצועיות הדיילות'])).toEqual({
      negativeReasons: [],
      positiveReasons: [],
      negativeReason: null,
      positiveReason: null,
    })
  })
})
