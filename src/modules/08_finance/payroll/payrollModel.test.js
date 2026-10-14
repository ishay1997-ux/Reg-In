// בדיקות מודל-התצוגה של דוח השכר — טהור, בלי רשת ובלי DOM.

import { describe, expect, it } from 'vitest'
import {
  CASE_CATEGORY_LABELS,
  accountantDeliveryTag,
  actionReason,
  blockerText,
  defaultFilter,
  filterRecipients,
  formatHours,
  formatStoredMoment,
  hoursSum,
  isDecided,
  groupReports,
  isoToJerusalemLocal,
  jerusalemLocalToIso,
  kindLabel,
  lastEndedPeriod,
  monthNotEndedMessage,
  needsReconstruction,
  nextMonthStartLabel,
  operationStage,
  parsePeriodParam,
  payrollErrorMessage,
  processStage,
  lastActionAt,
  recipientStatus,
  resendOutcome,
} from './payrollModel'
import { makePreview, makeReview, opStatus, recipient, reportItem } from './testFixtures'

describe('תקופה', () => {
  it('parsePeriodParam: YYYY-MM תקין ⇒ YYYY-MM-01; זר ⇒ null', () => {
    expect(parsePeriodParam('2026-07')).toBe('2026-07-01')
    expect(parsePeriodParam('2026-13')).toBeNull()
    expect(parsePeriodParam('july')).toBeNull()
    expect(parsePeriodParam(null)).toBeNull()
  })

  it('nextMonthStartLabel: אוקטובר ⇒ 01/11/2026, דצמבר ⇒ 01/01 של השנה הבאה', () => {
    expect(nextMonthStartLabel('2026-10-01')).toBe('01/11/2026')
    expect(nextMonthStartLabel('2026-12-01')).toBe('01/01/2027')
    expect(monthNotEndedMessage('2026-10-01')).toBe(
      'הפקה ושליחה יתאפשרו מ-01/11/2026, אחרי סוף החודש',
    )
  })

  it('lastEndedPeriod לפי שעון ישראל: 31/10 22:30Z כבר 01/11 בישראל ⇒ אוקטובר', () => {
    expect(lastEndedPeriod(new Date('2026-10-31T22:30:00Z'))).toBe('2026-10-01')
    expect(lastEndedPeriod(new Date('2026-10-31T20:00:00Z'))).toBe('2026-09-01')
    expect(lastEndedPeriod(new Date('2026-01-15T10:00:00Z'))).toBe('2025-12-01')
  })
})

describe('שעון ישראל בשדה מועד אחרון', () => {
  it('קיץ (+3) וחורף (+2) — הלוך ושוב', () => {
    expect(jerusalemLocalToIso('2026-10-14T18:00')).toBe('2026-10-14T15:00:00.000Z')
    expect(jerusalemLocalToIso('2026-12-01T09:30')).toBe('2026-12-01T07:30:00.000Z')
    expect(isoToJerusalemLocal('2026-10-14T15:00:00.000Z')).toBe('2026-10-14T18:00')
    expect(jerusalemLocalToIso('')).toBeNull()
  })
})

describe('recipientStatus — עמודת סטטוס אחת, לפי סדר חשיבות (תיקון ישי 14/10)', () => {
  it.each([
    [{ open_case_id: 5, delivery: { state: 'failed' } }, 'פנייה פתוחה', 'attention'],
    [{ delivery: { state: 'failed' }, digest_current: false }, 'השליחה נכשלה', 'error'],
    [{ delivery: { state: 'unknown' }, digest_current: false }, 'לא ידוע אם נשלח', 'unknown'],
    [{ digest_current: false, state: 'hostess_approved' }, 'עודכן — נדרש אישור מחדש', 'attention'],
    [{ delivery: null }, 'לא נשלח', 'neutral'],
    [{}, 'ממתין לתגובה', 'neutral'],
    [{ state: 'hostess_approved' }, 'הדיילת אישרה', 'ok'],
    [{ state: 'manager_approved_no_response' }, 'אושר לפי תיעוד', 'ok'],
  ])('%o ⇒ %s', (partial, label, kind) => {
    expect(recipientStatus(recipient(partial))).toEqual({ label, kind })
  })

  it('"נשלח" אינו "אושר": משלוח מוצלח בלי תגובה = "ממתין לתגובה"', () => {
    expect(recipientStatus(recipient()).label).toBe('ממתין לתגובה')
  })
})

describe('החלטה גוברת על מצב המשלוח (סקירת UX מקומית 14/10, פריט 1)', () => {
  const decided = ['hostess_approved', 'manager_approved_no_response', 'manager_resolved']
  const labels = {
    hostess_approved: 'הדיילת אישרה',
    manager_approved_no_response: 'אושר לפי תיעוד',
    manager_resolved: 'הפנייה טופלה',
  }
  for (const state of decided) {
    for (const deliveryState of ['failed', 'unknown']) {
      it(`${state} + משלוח ${deliveryState} ⇒ ההחלטה, לא "דורש טיפול", בלי הסבר`, () => {
        const r = recipient({ state, delivery: { attempt_id: 1, state: deliveryState } })
        expect(recipientStatus(r)).toEqual({ label: labels[state], kind: 'ok' })
        expect(isDecided(r)).toBe(true)
        const { counts } = filterRecipients([r], {
          filter: 'all',
          query: '',
          deadlinePassed: true,
          distributed: true,
        })
        expect(counts).toMatchObject({ action: 0, approved: 1 })
        expect(actionReason(r, { deadlinePassed: true, distributed: true })).toBeNull()
      })
    }
  }

  it('החלטה על סיכום שהשתנה אינה גוברת — "עודכן — נדרש אישור מחדש"', () => {
    const r = recipient({ state: 'hostess_approved', digest_current: false })
    expect(isDecided(r)).toBe(false)
    expect(recipientStatus(r).label).toBe('עודכן — נדרש אישור מחדש')
  })

  it('שורה שתוקנה אחרי שליחה: "יש לשלוח סיכום מעודכן" ולא "המועד עבר" (פריט 4)', () => {
    expect(actionReason(recipient({ digest_current: false }), { deadlinePassed: true })).toBe(
      'יש לשלוח סיכום מעודכן',
    )
  })
})

describe('דיילת שלא נשלח אליה סיכום (קבלה בייצור על יולי, 14/10)', () => {
  const flags = { deadlinePassed: true, distributed: true }

  it('סטטוס "לא נשלח" — גם כשהנתונים השתנו; ההסבר אינו "מעודכן"', () => {
    for (const partial of [{ delivery: null }, { delivery: null, digest_current: false }]) {
      const r = recipient(partial)
      expect(recipientStatus(r)).toEqual({ label: 'לא נשלח', kind: 'neutral' })
      expect(actionReason(r, flags)).toBe('יש לשלוח את הסיכום')
    }
  })

  it('לפני שליחת הסיכומים — אין הסבר בשורה', () => {
    expect(actionReason(recipient({ delivery: null }), { distributed: false })).toBeNull()
  })

  it('"פעולה אחרונה": בלי משלוח ובלי החלטה ⇒ null (זמן יצירת השורה אינו פעולה)', () => {
    const created = { last_action_at: '2026-10-13T10:00:00.000Z' }
    expect(lastActionAt(recipient({ ...created, delivery: null }))).toBeNull()
    expect(lastActionAt(recipient({ ...created }))).toBe('2026-10-13T10:00:00.000Z')
    expect(
      lastActionAt(
        recipient({
          ...created,
          delivery: null,
          state: 'manager_approved_no_response',
          decided_at: '2026-10-21T09:00:00.000Z',
        }),
      ),
    ).toBe('2026-10-13T10:00:00.000Z')
  })
})

describe('filterRecipients — מונים על כל הרשימה, לא על העמוד', () => {
  const many = Array.from({ length: 300 }, (_, i) =>
    recipient({
      recipient_id: i + 1,
      hostess_name: `דיילת ${String(i).padStart(3, '0')}`,
      state: i < 200 ? 'hostess_approved' : 'awaiting',
      delivery: i === 299 ? { attempt_id: 1, state: 'failed' } : recipient().delivery,
    }),
  )

  it('300 דיילות: 200 אושרו · 99 לא השיבו · 1 דורשת טיפול (כשל משלוח)', () => {
    const { counts } = filterRecipients(many, { filter: 'all', query: '', distributed: true })
    expect(counts).toEqual({ action: 1, noreply: 99, approved: 200, all: 300 })
    expect(defaultFilter(counts)).toBe('action')
  })

  it('חיפוש לפי שם רץ על כל הרשימה ומוצא דיילת שאינה בעמוד הראשון', () => {
    const { rows } = filterRecipients(many, {
      filter: 'all',
      query: 'דיילת 287',
      distributed: true,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].recipient.recipient_id).toBe(288)
  })

  it('מיון: דורש טיפול ⇐ לא השיבו ⇐ אושרו', () => {
    const { rows } = filterRecipients(many, { filter: 'all', query: '', distributed: true })
    expect(rows[0].bucket).toBe('action')
    expect(rows[1].bucket).toBe('noreply')
    expect(rows[299].bucket).toBe('approved')
  })

  it('אחרי המועד, מי שלא השיבה עוברת ל"דורש טיפול" עם הסבר', () => {
    const late = recipient()
    const { counts } = filterRecipients([late], {
      filter: 'all',
      query: '',
      deadlinePassed: true,
      distributed: true,
    })
    expect(counts.action).toBe(1)
    expect(actionReason(late, { deadlinePassed: true })).toBe('המועד עבר בלי תגובה')
    expect(actionReason(recipient({ digest_current: false }), {})).toBe('יש לשלוח סיכום מעודכן')
  })

  it('לפני שליחה, היעדר ניסיון אינו "דורש טיפול"; אין מסננים ⇒ ברירת מחדל "הכל"', () => {
    const { counts } = filterRecipients([recipient({ delivery: null })], {
      filter: 'all',
      query: '',
      distributed: false,
    })
    expect(counts.action).toBe(0)
    expect(defaultFilter(counts)).toBe('all')
  })
})

describe('חוסמי הפקה ⇒ משפט גלוי + יעד', () => {
  it('פניות פתוחות ⇒ למעקב, מסנן דורש טיפול', () => {
    expect(blockerText({ code: 'OBJECTION_OPEN', count: 2 }, { period: '2026-07-01' })).toEqual({
      text: '2 פניות פתוחות',
      target: { view: 'review', filter: 'action' },
    })
  })
  it('חודש שלא נגמר ⇒ התאריך המחושב, בלי יעד', () => {
    expect(blockerText({ code: 'MONTH_NOT_ENDED' }, { period: '2026-10-01' }).text).toBe(
      'הפקה ושליחה יתאפשרו מ-01/11/2026, אחרי סוף החודש',
    )
  })
  it('דיילת אחת בלי אישור ⇒ "דיילת אחת עוד בלי אישור"', () => {
    expect(blockerText({ code: 'DECISIONS_MISSING', count: 1 }, {}).text).toBe(
      'דיילת אחת עוד בלי אישור',
    )
  })
})

describe('operationStage — מצב ההפקה ⇒ הודעה ופעולה', () => {
  it.each([
    [{ state: 'preparing', next_action: 'wait' }, 'מכין ושומר את הקובץ…', true, null],
    [{ state: 'prepared', next_action: 'wait' }, 'מפיק את הדוח…', true, null],
    [{ state: 'prepared', next_action: 'resume' }, 'מפיק את הדוח…', false, 'resume'],
  ])('%o', (partial, text, busy, action) => {
    const stage = operationStage(opStatus({ accountant_attempt: null, ...partial }))
    expect(stage).toMatchObject({ text, busy, action })
  })

  it('הופק ונשלח / הופק ולא נשלח / לא ידוע', () => {
    expect(operationStage(opStatus()).text).toBe('הדוח נשמר ונשלח לרואה החשבון')
    expect(
      operationStage(opStatus({ accountant_attempt: { attempt_id: 1, state: 'failed' } })),
    ).toMatchObject({ text: 'הדוח נשמר אבל לא נשלח. אפשר לשלוח שוב', action: 'retry_send' })
    expect(
      operationStage(opStatus({ accountant_attempt: { attempt_id: 1, state: 'unknown' } })),
    ).toMatchObject({
      text: 'לא ידוע אם הדוח נשלח. יש לבדוק לפני שליחה חוזרת',
      action: 'check_status',
    })
    expect(
      operationStage(
        opStatus({ accountant_attempt: { attempt_id: 1, state: 'sending' }, next_action: 'wait' }),
      ),
    ).toMatchObject({ text: 'שולח לרואה החשבון…', busy: true })
  })

  it('כשל לפני הפקה: אחסון ⇒ "הדוח לא הופק ולא נשלח"; נתונים שהשתנו ⇒ רענון', () => {
    expect(
      operationStage(opStatus({ state: 'failed', failure_code: 'STORAGE_UPLOAD_FAILED' })).text,
    ).toBe('שמירת הקובץ נכשלה. הדוח לא הופק ולא נשלח, אפשר לנסות שוב')
    expect(
      operationStage(opStatus({ state: 'failed', failure_code: 'PREVIEW_CHANGED' })).text,
    ).toBe('הנתונים השתנו. יש לרענן לפני אישור')
  })
})

describe('היסטוריה', () => {
  it('השלמות מתחת למקורי שלהן; השלמה בלי מקורי ברשימה לא נעלמת', () => {
    const rows = groupReports([
      reportItem({ report_id: 40, period: '2026-09-01' }),
      reportItem({
        report_id: 41,
        report_kind: 'supplement',
        original_report_id: 31,
        supplement_seq: 2,
      }),
      reportItem({ report_id: 31 }),
      reportItem({
        report_id: 35,
        report_kind: 'supplement',
        original_report_id: 31,
        supplement_seq: 1,
      }),
      reportItem({
        report_id: 50,
        report_kind: 'supplement',
        original_report_id: 999,
        supplement_seq: 1,
      }),
    ])
    expect(rows.map((r) => [r.report.report_id, r.nested])).toEqual([
      [40, false],
      [31, false],
      [35, true],
      [41, true],
      [50, false],
    ])
  })

  it('שחזור מוצע רק לדוח בלי קובץ', () => {
    // צורת השרת: אין `artifact_available` בפרטי הדוח — ההכרעה לפי `artifact` בלבד.
    expect(needsReconstruction({ key: 'payroll/k.xlsx', reference_missing: false })).toBe(false)
    expect(needsReconstruction({ key: null, reference_missing: true })).toBe(true)
    expect(needsReconstruction({ key: null })).toBe(true)
    expect(needsReconstruction(null)).toBe(true)
    expect(
      operationStage(opStatus({ state: 'failed', failure_code: 'XLSX_BUILD_FAILED' })).text,
    ).toBe('שמירת הקובץ נכשלה. הדוח לא הופק ולא נשלח, אפשר לנסות שוב')
  })

  it('תוויות סוג ומשלוח', () => {
    expect(kindLabel('regular')).toBe('רגיל')
    expect(kindLabel('supplement', 2)).toBe('השלמה 2')
    expect(accountantDeliveryTag('unknown').label).toBe('לא ידוע אם נשלח')
  })
})

describe('processStage — שלב והצעד הבא', () => {
  it('בלי בדיקה ⇒ טיוטה; ממתין לאישור טיוטה; ממתין לתגובות; מוכן; הופק', () => {
    expect(processStage({ preview: makePreview(), review: null }).label).toBe('טיוטה')
    expect(
      processStage({
        preview: makePreview({ period: '2026-10-01', month_state: 'current' }),
        review: null,
      }).next,
    ).toBe(
      'הפקה ושליחה יתאפשרו מ-01/11/2026, אחרי סוף החודש. בינתיים אפשר לבדוק את הטיוטה ולהוריד אותה',
    )
    expect(blockerText({ code: 'DIGEST_STALE', count: 1 }, {}).text).toBe(
      'סיכום אחד השתנה ומחכה לבדיקה חוזרת',
    )
    expect(blockerText({ code: 'DIGEST_STALE', count: 2 }, {}).text).toBe(
      '2 סיכומים השתנו ומחכים לבדיקה חוזרת',
    )
    expect(
      processStage({
        preview: makePreview(),
        review: makeReview({ review: { manager_approved: false, distributed_at: null } }),
      }).next,
    ).toBe('הצעד הבא: לאשר את הטיוטה ולקבוע מועד אחרון לתגובה')
    expect(processStage({ preview: makePreview(), review: makeReview() }).label).toBe(
      'ממתין לתגובות',
    )
    expect(
      processStage({
        preview: makePreview(),
        review: makeReview({ readiness: { ready: true, blockers: [], counts: {} } }),
      }).label,
    ).toBe('מוכן להפקה')
    expect(
      processStage({ preview: makePreview(), review: makeReview({ review: { status: 'issued' } }) })
        .label,
    ).toBe('הופק')
  })
})

describe('שעות (F12)', () => {
  it('hoursSum במאיות; ערך חסר ⇒ null ולא 0', () => {
    expect(hoursSum([{ hours: 6 }, { hours: 4.25 }, { hours: 1.26 }])).toBe(11.51)
    expect(hoursSum([{ hours: 6 }, { hours: null }])).toBeNull()
    expect(formatHours(11.5)).toBe('11.5')
    expect(formatHours(6)).toBe('6')
    expect(formatHours(undefined)).toBeNull()
  })
})

describe('resendOutcome — "נשלח" רק כשהניסיון באמת נשלח', () => {
  it.each([
    ['sent', 'success', 'נשלח שוב'],
    ['failed', 'error', 'השליחה החוזרת נכשלה. אפשר לנסות שוב'],
    ['unknown', 'error', 'לא ידוע אם נשלח. יש לבדוק לפני שליחה חוזרת'],
    [undefined, 'error', 'לא ידוע אם נשלח. יש לבדוק לפני שליחה חוזרת'],
  ])('%s', (state, tone, text) => {
    expect(resendOutcome(state, 'נשלח שוב')).toEqual({ tone, text })
  })
})

describe('formatStoredMoment — לא מציגים שעה שלא נשמרה (פוליש 14/10, פריט 3)', () => {
  it('תאריך-בלבד נשאר תאריך, בלי שעה', () => {
    expect(formatStoredMoment('2026-09-02')).toBe('02/09/2026')
  })
  it('דוח מהתהליך הקודם: חותמת יומן ⇒ תאריך בלבד בשעון ישראל', () => {
    expect(formatStoredMoment('2026-09-02T10:00:00+00:00', { dateOnly: true })).toBe('02/09/2026')
  })
  it('חותמת אמיתית מהתהליך החדש ⇒ תאריך ושעה', () => {
    expect(formatStoredMoment('2026-09-02T10:00:00+00:00')).toBe('02/09/2026 13:00')
    expect(formatStoredMoment(null)).toBe('—')
  })
})

describe('payrollErrorMessage', () => {
  it('קוד ידוע ⇒ ההודעה; לא ידוע ⇒ הודעה כללית', () => {
    expect(payrollErrorMessage({ code: 'PREVIEW_CHANGED' })).toBe(
      'הנתונים השתנו. יש לרענן לפני אישור',
    )
    expect(payrollErrorMessage('ZZZ')).toBe('הפעולה נכשלה. נסה שוב')
    // קוד בלי נוסח ⇒ ההודעה העברית של השרת; SALARY_* ⇒ נוסח בניית-הקובץ.
    expect(payrollErrorMessage({ code: 'ZZZ', serverMessage: 'כתובת רו"ח השתנתה' })).toBe(
      'כתובת רו"ח השתנתה',
    )
    expect(payrollErrorMessage('SALARY_TOTAL_MISMATCH')).toBe(
      'נתוני הדוח לא הסתדרו בבניית הקובץ. הדוח לא הופק ולא נשלח',
    )
    expect(payrollErrorMessage('REVIEW_NOT_OPEN')).toBe(
      'הבדיקה לחודש הזה כבר לא פתוחה. יש לרענן את העמוד',
    )
  })
})

describe('קטגוריות פנייה (F11 — משמרות ושעות בלבד)', () => {
  it('ארבע קטגוריות, בלי תעריף ובלי בונוס/נסיעות', () => {
    expect(CASE_CATEGORY_LABELS).toEqual({
      hours: 'שעות',
      missing_shift: 'משמרת חסרה',
      not_worked: 'משמרת שלא עבדתי בה',
      other: 'אחר',
    })
  })
})
