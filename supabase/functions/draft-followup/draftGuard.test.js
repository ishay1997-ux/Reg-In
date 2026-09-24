// בדיקות-יחידה לשומר-הטיוטה של `draft-followup` (`draftGuard.ts`) — הקובץ טהור, בלי Deno, ולכן Vitest
// מייבא אותו ישירות. 🔤 **הסיבה שהקובץ קיים:** נמדד חי 25/09/2026 — טיוטה כתבה "מועד" עם ע' ו-ד' ערביות
// (U+0639 · U+062F), והשומר העביר אותה. ⚠️ התווים הערביים כתובים כאן כ-escape ולא כתווים, כדי ששום עורך
// לא "יתקן" אותם בשקט ל-ע' עברית — ואז הבדיקה הייתה עוברת בלי לבדוק כלום.
import { describe, it, expect } from 'vitest'
import { ARABIC_SCRIPT_PROBLEM, draftProblem } from './draftGuard.ts'

const allowed = ['{{איש_קשר}}', '{{אירוע}}']
const clean = 'שלום {{איש_קשר}},\nרצינו לבדוק אם {{אירוע}} עדיין רלוונטי.\nבברכה,'

describe('draftProblem — כתב ערבי', () => {
  it('המילה שנמדדה חי ("מו" + ע׳ ו-ד׳ ערביות) נפסלת', () => {
    const measured = 'מכיוון שמוعد האירוע כבר עבר, נשמח לעזור.'
    expect(draftProblem(measured, allowed)).toBe(ARABIC_SCRIPT_PROBLEM)
  })

  it.each([
    ['הטווח הבסיסי', '؀'],
    ['סוף הטווח הבסיסי', 'ۿ'],
    ['התוספת', 'ݐ'],
    ['צורות-תצוגה א', 'ﭐ'],
    ['צורות-תצוגה ב (סוף)', 'ﻼ'],
  ])('תו מ%s נפסל', (_label, char) => {
    expect(draftProblem(`שלום ${char} רב`, allowed)).toBe(ARABIC_SCRIPT_PROBLEM)
  })

  it('טיוטה עברית תקינה עוברת — השומר לא פוסל עברית, סימני-כיוון או מצייני-מקום', () => {
    expect(draftProblem(clean, allowed)).toBeNull()
  })

  it('ע׳ עברית (U+05E2) אינה נפסלת — ההבדל הוא בדיוק בין שני התווים', () => {
    expect(draftProblem('מכיוון שמועד האירוע כבר עבר.', allowed)).toBeNull()
  })

  it('שאר כללי-השומר לא השתנו (כסף עדיין נפסל, ולא בתור כתב ערבי)', () => {
    expect(draftProblem('ההצעה על 5,000 ₪', allowed)).toBe('money or discount')
  })
})
