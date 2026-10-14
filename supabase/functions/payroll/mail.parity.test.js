// @vitest-environment node
// כללי המייל של השרת מול האפליקציה (`src/lib/email.js`, `src/modules/08_finance/api.js` — קריאה
// בלבד), ועוד המייל האישי לדיילת (חוזה §3.1 שלב 3).
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/supabaseClient', () => ({ supabase: {} }))

import * as app from '@/lib/email'
import {
  buildSalaryReportEmailPayload,
  salaryReportEmailSubject as appSubject,
  templateWithoutAccountantName as appStrip,
} from '@/modules/08_finance/api'
import {
  fillEmailTemplate,
  findUnknownPlaceholders,
  isAttachmentTooLarge,
  plainTextToEmailHtml,
  renderAccountantText,
  renderReviewText,
  reviewEmailSubject,
  salaryReportEmailSubject,
  templateWithoutAccountantName,
} from './mail.ts'

// מוקלד בייט-בבייט מזרע ה-params (אותו נוסח כמו ב-`src/modules/08_finance/api.test.js`).
const SALARY_TEMPLATE = `שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],
מצורף בזאת קובץ אקסל המרכז את שעות העבודה של צוות הדיילות של חברת REG-IN עבור חודש [חודש_דיווח_ושנה].
הקובץ כולל פירוט תעריפים, שעות בפועל ובונוסים, לאחר שעבר בקרה ואישור במערכת. בכל שאלה או בירור בנוגע לנתונים, ניתן לפנות למחלקת הכספים.
בברכה,
מערכת REG-IN.`

// גוף ברירת-המחדל מהתוכנית (`docs/plans/2026-10-13-payroll-end-to-end.md`).
const REVIEW_TEMPLATE = `שלום [שם_דיילת],

סיכום השעות שלך לחודש [חודש_דיווח_ושנה] מוכן לבדיקה.
אפשר לאשר את הנתונים או לדווח על טעות בקישור:
[לינק_בדיקת_שעות]

נבקש להשיב עד [מועד_אחרון_לתגובה].`

const TEXTS = [
  'שלום REG-IN!',
  'a & b < c > d',
  'שורה 1\nשורה 2\r\nשורה 3',
  'קישור: https://reg-in.example/payroll-review/abc_DEF-123?x=1.',
  'ת"ז 012345678 בשעה 18:00',
  '',
]

describe('פונקציות-המייל — שוויון', () => {
  it.each(TEXTS)('plainTextToEmailHtml(%j)', (text) => {
    expect(plainTextToEmailHtml(text)).toBe(app.plainTextToEmailHtml(text))
  })

  it.each([
    [SALARY_TEMPLATE, { '[חודש_דיווח_ושנה]': 'יולי 2026' }],
    [SALARY_TEMPLATE, { '[חודש_דיווח_ושנה]': 'יולי 2026', '[שם_רואה_חשבון]': '' }],
    ['לקוח [דמו] [שם]', { '[שם]': 'רון [דמו]' }],
    ['', { '[x]': '1' }],
  ])('fillEmailTemplate + findUnknownPlaceholders', (template, replacements) => {
    expect(fillEmailTemplate(template, replacements)).toBe(
      app.fillEmailTemplate(template, replacements),
    )
    expect(findUnknownPlaceholders(template, replacements)).toEqual(
      app.findUnknownPlaceholders(template, replacements),
    )
  })

  it.each([
    SALARY_TEMPLATE,
    'שלום [שם_רואה_חשבון] / צוות,\nשורה',
    'שלום [שם_רואה_חשבון] ,\nשורה',
    'בלי מציין מקום',
  ])('templateWithoutAccountantName', (template) => {
    expect(templateWithoutAccountantName(template)).toBe(appStrip(template))
  })

  it('נושא מייל הרו"ח', () => {
    expect(salaryReportEmailSubject('יולי 2026')).toBe(appSubject('יולי 2026'))
  })

  it.each([
    [3_000_000, 'a'.repeat(3_000_000)],
    [4_000_000, 'a'.repeat(4_000_000)],
    [4_000_001, 'a'.repeat(4_000_001)],
  ])('isAttachmentTooLarge(%i)', (length, base64) => {
    expect(isAttachmentTooLarge(length)).toBe(app.isAttachmentTooLarge(base64))
  })
})

describe('renderAccountantText — זהה לגוף שהאפליקציה שלחה לרו"ח', () => {
  it('גוף ונושא זהים ל-buildSalaryReportEmailPayload (בלי שם רו"ח)', () => {
    const rendered = renderAccountantText(SALARY_TEMPLATE, 'יולי 2026')
    const legacy = buildSalaryReportEmailPayload({
      template: SALARY_TEMPLATE,
      recipient: 'office@example.com',
      periodLabel: 'יולי 2026',
      fileName: '07_2026_Payroll_Report.xlsx',
      attachmentBase64: 'AAAA',
    })
    expect(plainTextToEmailHtml(rendered.text)).toBe(legacy.body)
    expect(rendered.subject).toBe(legacy.subject)
    expect(rendered.text.startsWith('שלום לצוות הנהלת חשבונות,')).toBe(true)
  })

  it('דוח השלמה: התווית נושאת "— השלמה n" בגוף ובנושא', () => {
    const rendered = renderAccountantText(SALARY_TEMPLATE, 'אוגוסט 2026 — השלמה 1')
    expect(rendered.subject).toBe('דוח שכר דיילות — אוגוסט 2026 — השלמה 1')
    expect(rendered.text).toContain('עבור חודש אוגוסט 2026 — השלמה 1.')
  })

  it.each([
    ['תבנית ריקה', ''],
    ['בלי [חודש_דיווח_ושנה]', 'שלום,\nמצורף הדוח.'],
    ['שדה לא מוכר', `${SALARY_TEMPLATE}\n[טלפון_מנהלת]`],
  ])('%s ⇒ TEMPLATE_INVALID', (_name, template) => {
    expect(() => renderAccountantText(template, 'יולי 2026')).toThrow(
      expect.objectContaining({ code: 'TEMPLATE_INVALID' }),
    )
  })
})

describe('renderReviewText — המייל האישי לדיילת', () => {
  const values = {
    hostessName: 'אפרת דהן',
    periodLabel: 'יולי 2026',
    link: 'https://reg-in.example/payroll-review/abcDEF_123-xyz0123456789',
    deadline: '20/10/2026 18:00',
  }

  it('ארבעת השדות מולאו; נושא "סיכום שעות לבדיקה — <חודש>"', () => {
    const rendered = renderReviewText(REVIEW_TEMPLATE, values)
    expect(rendered.subject).toBe('סיכום שעות לבדיקה — יולי 2026')
    expect(rendered.text).toBe(`שלום אפרת דהן,

סיכום השעות שלך לחודש יולי 2026 מוכן לבדיקה.
אפשר לאשר את הנתונים או לדווח על טעות בקישור:
${values.link}

נבקש להשיב עד 20/10/2026 18:00.`)
  })

  it('השלמה: הנושא נושא "— השלמה n"', () => {
    expect(reviewEmailSubject('אוגוסט 2026 — השלמה 1')).toBe(
      'סיכום שעות לבדיקה — אוגוסט 2026 — השלמה 1',
    )
  })

  it.each([
    ['בלי קישור', REVIEW_TEMPLATE.replace('[לינק_בדיקת_שעות]', '')],
    ['בלי מועד', REVIEW_TEMPLATE.replace('[מועד_אחרון_לתגובה]', 'מחר')],
    ['שדה לא מוכר', `${REVIEW_TEMPLATE}\n[טלפון_מנהלת]`],
    ['ריקה', '   '],
  ])('%s gives TEMPLATE_INVALID before sending', (_name, template) => {
    expect(() => renderReviewText(template, values)).toThrow(
      expect.objectContaining({ code: 'TEMPLATE_INVALID' }),
    )
  })

  it('שם עם סוגריים הוא דאטה ולא שדה — לא חוסם', () => {
    const rendered = renderReviewText(REVIEW_TEMPLATE, { ...values, hostessName: 'נועה [דמו]' })
    expect(rendered.text).toContain('שלום נועה [דמו],')
  })
})
