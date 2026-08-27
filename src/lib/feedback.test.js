// בדיקות הלוגיקה הטהורה של משטח S4 — `stateFromPagePayload`/`stateFromSubmitPayload`.
// דפוס-הבדיקה זהה ל-`shiftInvite.test.js`: בדיקות-יחידה ישירות על ה-payload,
// בלי React ובלי מוקים.
import { describe, it, expect } from 'vitest'
import { FEEDBACK_STATE, stateFromPagePayload, stateFromSubmitPayload } from './feedback'

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
