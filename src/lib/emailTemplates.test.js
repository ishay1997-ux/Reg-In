import { describe, it, expect } from 'vitest'
import {
  TEMPLATE_PLACEHOLDERS,
  TEMPLATE_SAMPLE_VALUES,
  renderTemplateSample,
  templateSaveVerdict,
} from './emailTemplates'
import { buildShiftInvitePayload } from './shiftEmails'

const TEMPLATE_NAMES = Object.keys(TEMPLATE_PLACEHOLDERS)

// גוף-תבנית "מלא" מלאכותי, לצורך בדיקת-ok: כל הטוקנים (חובה+רשות) בתוך משפט-מסגרת אחד.
function fullBody(name) {
  const { required, optional } = TEMPLATE_PLACEHOLDERS[name]
  return `שלום ${[...required, ...optional].join(' ')} תודה.`
}

describe('TEMPLATE_PLACEHOLDERS — 12 התבניות (11 של §3.7 + סיכום השעות של מ8), בייט-בבייט', () => {
  it('12 תבניות בדיוק, ואיפוס-סיסמה/קישור-סקר לא ביניהן (Q-2)', () => {
    expect(TEMPLATE_NAMES).toHaveLength(12)
    expect(TEMPLATE_PLACEHOLDERS).not.toHaveProperty('תבנית_איפוס_סיסמה')
    expect(TEMPLATE_PLACEHOLDERS).not.toHaveProperty('קישור_בסיס_סקר_לקוחות')
  })

  it('כל תבנית נושאת required (מערך לא-ריק) ו-optional (מערך, אולי ריק)', () => {
    for (const name of TEMPLATE_NAMES) {
      const contract = TEMPLATE_PLACEHOLDERS[name]
      expect(Array.isArray(contract.required)).toBe(true)
      expect(contract.required.length).toBeGreaterThan(0)
      expect(Array.isArray(contract.optional)).toBe(true)
    }
  })

  it('כל טוקן בסוגריים מרובעים בייט-בבייט, ואין טוקן כפול בתוך אותה תבנית', () => {
    for (const name of TEMPLATE_NAMES) {
      const { required, optional } = TEMPLATE_PLACEHOLDERS[name]
      const all = [...required, ...optional]
      for (const token of all) {
        expect(token).toMatch(/^\[[^[\]\n]+\]$/)
      }
      expect(new Set(all).size).toBe(all.length)
    }
  })
})

describe('templateSaveVerdict — R-3: חובה חוסמת, רשות מזהירה, לא-מוכר חוסם', () => {
  it.each(TEMPLATE_NAMES)('%s — גוף מלא (כל הטוקנים) ⇒ ok', (name) => {
    const verdict = templateSaveVerdict(name, fullBody(name))
    expect(verdict.status).toBe('ok')
    expect(verdict.missingRequired).toEqual([])
    expect(verdict.missingOptional).toEqual([])
    expect(verdict.unknown).toEqual([])
  })

  it.each(TEMPLATE_NAMES)('%s — הסרת כל משתנה-חובה בתורו ⇒ blocked ושמו מוזכר בהודעה', (name) => {
    const { required } = TEMPLATE_PLACEHOLDERS[name]
    for (const missing of required) {
      const remaining = fullBody(name).split(missing).join('')
      const verdict = templateSaveVerdict(name, remaining)
      expect(verdict.status).toBe('blocked')
      expect(verdict.missingRequired).toContain(missing)
      expect(verdict.message).toContain(missing)
      expect(verdict.message.startsWith(`בלי ${missing} `)).toBe(true)
    }
  })

  it('הסרת משתנה-רשות בלבד ⇒ warning, לא blocked (זימון-משמרת: עיר-אירוע)', () => {
    const name = 'תבנית_זימון_משמרת'
    const withoutCity = fullBody(name).split('[עיר_אירוע]').join('')
    const verdict = templateSaveVerdict(name, withoutCity)
    expect(verdict.status).toBe('warning')
    expect(verdict.missingRequired).toEqual([])
    expect(verdict.missingOptional).toContain('[עיר_אירוע]')
  })

  it('שגיאת-כתיב בסוגריים (טוקן לא-מוכר) ⇒ blocked, גם כשכל טוקן-חובה האמיתי עדיין קיים', () => {
    const name = 'תבנית_מייל_ביטול_משמרת' // required: [שם_דיילת] בלבד
    const body = 'שלום [שם_דיילת], [שם_דילת] נפלה בטעות כאן.' // טוקן אמיתי + טעות-כתיב ליד
    const verdict = templateSaveVerdict(name, body)
    expect(verdict.status).toBe('blocked')
    expect(verdict.unknown).toContain('[שם_דילת]')
    expect(verdict.missingRequired).toEqual([]) // הטוקן האמיתי כן קיים
  })

  it('שם-תבנית לא-מוכר (כמו URL שאינו פותח עורך) ⇒ ok תמיד — אין חוזה לאכוף', () => {
    expect(templateSaveVerdict('קישור_בסיס_סקר_לקוחות', 'כל דבר')).toEqual({
      status: 'ok',
      missingRequired: [],
      missingOptional: [],
      unknown: [],
      message: '',
    })
  })

  it('גוף ריק לתבנית ⇒ blocked (חובה תמיד חסרה כשאין גוף)', () => {
    for (const name of TEMPLATE_NAMES) {
      expect(templateSaveVerdict(name, '').status).toBe('blocked')
    }
    expect(templateSaveVerdict('תבנית_זימון_משמרת', null).status).toBe('blocked')
    expect(templateSaveVerdict('תבנית_זימון_משמרת', undefined).status).toBe('blocked')
  })
})

// ⚠️ **גבול-הבדיקה, נמסר בכנות (§"בדיקה ירוקה אינה הוכחה"):** אין לבונה הזה גישה ל-MCP של
// Supabase (לא מאומת בסשן הזה) ואין הרשאה להזריק/לקרוא סודות — ולכן "פיקסצ'ר מה-DB" כאן
// הוא **בדיוק** הטבלה המתוארכת שב-`docs/micro_guides/module-9.md` §3.7 (נמדדה 02/09/2026
// מגופי-ה-DB החיים, ואומתה פעמיים ע"י בודק בהקשר-טרי) — לא שליפה חוזרת של הבדיקה הזו.
describe('עקביות מול הגופים הזרועים (§3.7, מתוארך 02/09/2026) — התוקן שלא ייכתב פעמיים', () => {
  it('כל טוקן מהרשימה הזרועה ⊆ required∪optional (טאוטולוגי-במתכוון: המקור הוא אותה טבלה)', () => {
    // אין דריפט "בשקט" בין §3.7 לקובץ הזה — אם מישהו יוסיף כאן טוקן שאין ל-§3.7, זה ייתפס
    // ע"י בדיקת-הפורמט למעלה; הבדיקה הזו שומרת על עצם החוזה: allowed הוא איחוד נקי, בלי חפיפה.
    for (const name of TEMPLATE_NAMES) {
      const { required, optional } = TEMPLATE_PLACEHOLDERS[name]
      const overlap = required.filter((token) => optional.includes(token))
      expect(overlap, `"${name}" — טוקן גם ב-required וגם ב-optional`).toEqual([])
    }
  })

  it('buildShiftInvitePayload (shiftEmails.js) צורכת בפועל את שני משתני-החובה של תבנית-הזימון', () => {
    const { required } = TEMPLATE_PLACEHOLDERS['תבנית_זימון_משמרת']
    expect(required).toEqual(['[שם_דיילת]', '[לינק_אישור_משמרת]'])

    const template = required.join(' — ')
    const hostess = { full_name: 'רוני לוי', email: 'roni@example.com' }
    const project = {
      event_name: 'כנס REG-IN',
      final_event_date: '2026-10-05',
      final_start_time: '18:00:00',
      final_end_time: '22:00:00',
      final_location: 'תל אביב',
    }
    const confirmUrl = 'https://reg-in.example.com/shift/tok-abc123'

    const payload = buildShiftInvitePayload({
      template,
      hostess,
      project,
      hourlyRate: 45,
      confirmUrl,
    })

    expect(payload).not.toBeNull()
    // ⚠️ שתי אלה מוכיחות **צריכה בפועל**, לא רק שהבונה לא זרק — אילו placeholder כלשהו
    // נשאר לא-מוכר, `fillEmailTemplate` הייתה מחזירה גוף ריק ו-`buildShiftInvitePayload` null.
    expect(payload.body).toContain('רוני לוי')
    expect(payload.body).toContain(confirmUrl)
  })
})

// 🆕 13/10/2026 — מ8 דוח שכר מקצה לקצה: תבנית הסיכום האישי ותצוגה מקדימה בעורך.
describe('תבנית_מייל_סיכום_שעות_דיילת — חוזה ארבעת המשתנים', () => {
  const NAME = 'תבנית_מייל_סיכום_שעות_דיילת'
  // גוף ברירת המחדל מהמיגרציה 20261014001000, מילה במילה.
  const DEFAULT_BODY = `שלום [שם_דיילת],

סיכום השעות שלך לחודש [חודש_דיווח_ושנה] מוכן לבדיקה.
אפשר לאשר את הנתונים או לדווח על טעות בקישור:
[לינק_בדיקת_שעות]

נשמח לתשובתך עד [מועד_אחרון_לתגובה].`

  it('ארבעה משתני חובה בדיוק, בלי רשות — אותה רשימה שהשרת בודק', () => {
    expect(TEMPLATE_PLACEHOLDERS[NAME]).toEqual({
      required: ['[שם_דיילת]', '[חודש_דיווח_ושנה]', '[לינק_בדיקת_שעות]', '[מועד_אחרון_לתגובה]'],
      optional: [],
    })
  })

  it('גוף ברירת המחדל מהמיגרציה עובר את שער השמירה', () => {
    expect(templateSaveVerdict(NAME, DEFAULT_BODY).status).toBe('ok')
  })

  it.each([
    ['[לינק_בדיקת_שעות]', 'בלי [לינק_בדיקת_שעות] הדיילת לא תוכל לאשר את השעות או לדווח על טעות.'],
    ['[מועד_אחרון_לתגובה]', 'בלי [מועד_אחרון_לתגובה] הדיילת לא תדע עד מתי להשיב.'],
  ])('מחיקת %s ⇒ חסום עם תוצאה מוצרית', (token, message) => {
    const verdict = templateSaveVerdict(NAME, DEFAULT_BODY.split(token).join(''))
    expect(verdict.status).toBe('blocked')
    expect(verdict.message).toBe(message)
  })

  it('משתנה של תבנית רואה החשבון בתוך הסיכום האישי ⇒ לא מוכר וחסום', () => {
    const verdict = templateSaveVerdict(NAME, `${DEFAULT_BODY}\n[שם_רואה_חשבון]`)
    expect(verdict.status).toBe('blocked')
    expect(verdict.unknown).toEqual(['[שם_רואה_חשבון]'])
  })
})

describe('TEMPLATE_SAMPLE_VALUES / renderTemplateSample — תצוגה מקדימה שלא שולחת', () => {
  it('לכל משתנה בכל אחת מ-12 התבניות יש ערך דוגמה לא ריק', () => {
    for (const name of TEMPLATE_NAMES) {
      const { required, optional } = TEMPLATE_PLACEHOLDERS[name]
      for (const token of [...required, ...optional]) {
        expect(TEMPLATE_SAMPLE_VALUES[token], `${name} · ${token}`).toBeTruthy()
      }
    }
  })

  it.each(TEMPLATE_NAMES)('%s — גוף מלא מוצג בלי אף סוגר גולמי', (name) => {
    const rendered = renderTemplateSample(name, fullBody(name))
    expect(rendered).not.toBe('')
    expect(rendered).not.toMatch(/\[[^\]\n]+\]/)
  })

  it('הסיכום האישי מוצג עם ערכי הדוגמה במקומם', () => {
    const rendered = renderTemplateSample(
      'תבנית_מייל_סיכום_שעות_דיילת',
      'שלום [שם_דיילת], [חודש_דיווח_ושנה] [לינק_בדיקת_שעות] עד [מועד_אחרון_לתגובה]',
    )
    expect(rendered).toBe(
      'שלום נועה כהן, ספטמבר 2026 https://example.com/payroll-review/sample עד 20/10/2026 18:00',
    )
  })

  it('משתנה לא מוכר בגוף ⇒ ריק (אותו סירוב כמו במייל אמיתי), תבנית לא מוכרת ⇒ ריק', () => {
    expect(renderTemplateSample('תבנית_מייל_סיכום_שעות_דיילת', 'שלום [שם_חברה]')).toBe('')
    expect(renderTemplateSample('לא_תבנית', 'שלום')).toBe('')
    expect(renderTemplateSample('תבנית_מייל_סיכום_שעות_דיילת', '')).toBe('')
  })
})
