// בדיקות הלוגיקה הטהורה של כרטיס-הפרויקט (משטח 2) — נועלות את שלושת מצבי לשונית-הסגירה,
// את נוסחי-הולידציה הזהים-לשרת, את באנר-㉑ על שתי גרסאותיו (עם שמות ובלי), ואת ארבעת
// ניסוחי המשוב כולל S-22 (completed בלי ציון).
import { describe, it, expect } from 'vitest'
import {
  closingTabState,
  CLOSING_TAB_BEFORE_EVENT,
  CLOSING_TAB_CRON_GAP,
  CLOSING_TAB_CANCELLED,
  validateDetailsForm,
  DATE_REQUIRED_MSG,
  LOCATION_REQUIRED_MSG,
  HOURS_BOTH_OR_NEITHER_MSG,
  parseDmyToIso,
  isoToDmy,
  feedbackCell,
  eventDurationText,
  combinedDiscountPercent,
  dateChangeBanner,
  cardStaffingTileSub,
  cardLogisticsTileSub,
  mailOutcomeMessage,
  saveSuccessMessage,
  CANCEL_TYPE_LABELS,
} from './projectCard'

const TODAY = '2026-08-19'

describe('closingTabState — שלושה מצבים, לא שניים', () => {
  it('① סטטוס פעיל ותאריך עתידי — מושבתת עם "(נפתחת אחרי האירוע)"', () => {
    const state = closingTabState(
      { project_status: 'in_progress', final_event_date: '2026-08-28' },
      TODAY,
    )
    expect(state).toEqual({ mode: 'disabled', reason: CLOSING_TAB_BEFORE_EVENT })
  })

  it('② האירוע עבר והסטטוס עוד פעיל (חלון ה-cron) — המשפט מתחלף, השער לא', () => {
    const state = closingTabState(
      { project_status: 'ready', final_event_date: '2026-08-18' },
      TODAY,
    )
    // 🔴 עדיין disabled — לעולם לא נפתחת לפי תאריך; רק הנימוק משתנה.
    expect(state.mode).toBe('disabled')
    expect(state.reason).toBe(CLOSING_TAB_CRON_GAP)
  })

  it('event_finished — פתוחה', () => {
    expect(
      closingTabState({ project_status: 'event_finished', final_event_date: '2026-08-01' }, TODAY),
    ).toEqual({ mode: 'open' })
  })

  it('③ אחרי הסגירה התפעולית — הלשונית נשארת (closed), לא נעלמת ולא ננעלת מחדש', () => {
    for (const status of ['awaiting_invoice', 'awaiting_payment', 'finished']) {
      expect(closingTabState({ project_status: status }, TODAY).mode).toBe('closed')
    }
  })

  it('מבוטל — מושבתת עם נימוק 🏁6, לא "נפתחת אחרי האירוע"', () => {
    expect(closingTabState({ project_status: 'cancelled' }, TODAY)).toEqual({
      mode: 'disabled',
      reason: CLOSING_TAB_CANCELLED,
    })
  })
})

describe('validateDetailsForm — זהה-בייט לשרת', () => {
  const valid = {
    dateText: '22/08/2026',
    location: 'אקספו תל אביב, ביתן 2',
    startTime: '18:00',
    endTime: '22:00',
  }

  it('טופס תקין — אפס שגיאות; ‏22:00–02:00 חוקי (S-17: אין בדיקת-סדר)', () => {
    expect(validateDetailsForm(valid)).toEqual({})
    expect(validateDetailsForm({ ...valid, startTime: '22:00', endTime: '02:00' })).toEqual({})
  })

  it('מיקום ריק — המשפט של השרת, מילה במילה', () => {
    expect(validateDetailsForm({ ...valid, location: '  ' }).location).toBe(LOCATION_REQUIRED_MSG)
  })

  it('שעה אחת בלבד — both-or-neither, המשפט של השרת', () => {
    expect(validateDetailsForm({ ...valid, endTime: '' }).hours).toBe(HOURS_BOTH_OR_NEITHER_MSG)
    expect(validateDetailsForm({ ...valid, startTime: '' }).hours).toBe(HOURS_BOTH_OR_NEITHER_MSG)
    expect(validateDetailsForm({ ...valid, startTime: '', endTime: '' }).hours).toBeUndefined()
  })

  it('תאריך ריק או שבור — חובה למלא', () => {
    expect(validateDetailsForm({ ...valid, dateText: '' }).date).toBe(DATE_REQUIRED_MSG)
    expect(validateDetailsForm({ ...valid, dateText: '31/02/2026' }).date).toBe(DATE_REQUIRED_MSG)
  })
})

describe('המרות תאריך', () => {
  it('DD/MM/YYYY ⇄ ISO', () => {
    expect(parseDmyToIso('22/08/2026')).toBe('2026-08-22')
    expect(parseDmyToIso('2026-08-22')).toBe(null)
    expect(isoToDmy('2026-08-22')).toBe('22/08/2026')
  })
})

describe('feedbackCell — ארבעה ניסוחים + S-22', () => {
  it('not_sent — "טרם התקבל משוב" עם שורת-ההסבר (תיקון-הנוסח של 3.5: "נשלח", לא "יוצא")', () => {
    const cell = feedbackCell({ feedback_status: 'not_sent' })
    expect(cell.kind).toBe('empty')
    expect(cell.value).toBe('טרם התקבל משוב')
    expect(cell.sub).toBe('הסקר נשלח בסגירת האירוע · הציון והסיבה מוזנים במסך הכספים')
  })

  it('not_sent אחרי חותמת-הסגירה — שורת-המשנה אומרת שהשליחה לא הצליחה (מדריך-מיקרו :961)', () => {
    const cell = feedbackCell({
      feedback_status: 'not_sent',
      operationally_closed_at: '2026-08-19T10:00:00Z',
    })
    expect(cell.kind).toBe('empty')
    expect(cell.value).toBe('טרם התקבל משוב')
    expect(cell.sub).toBe('מייל הסקר לא יצא בסגירה — שליחה חוזרת מלשונית סגירת האירוע')
  })

  it('sent / no_response — שני מצבים שדנה מתנהגת בהם אחרת', () => {
    expect(feedbackCell({ feedback_status: 'sent' }).value).toBe('הסקר נשלח — טרם התקבלה תשובה')
    expect(feedbackCell({ feedback_status: 'no_response' }).value).toBe('הלקוח לא השיב')
  })

  it('completed עם ציון — הציון עצמו; הסיבה רק כשקיימת', () => {
    const cell = feedbackCell({
      feedback_status: 'completed',
      feedback_score: 5,
      negative_feedback_reason: null,
      positive_feedback_reason: 'מקצועיות הדיילות',
      feedback_notes: 'שירות מצוין',
    })
    expect(cell).toEqual({
      kind: 'score',
      score: 5,
      reason: null,
      positiveReason: 'מקצועיות הדיילות',
      notes: 'שירות מצוין',
    })
  })

  it('🔴 S-22: completed עם ציון NULL — שורה חוקית בסכמה, נוסח משלה ולא ציון-רפאים', () => {
    const cell = feedbackCell({ feedback_status: 'completed', feedback_score: null })
    expect(cell).toEqual({ kind: 'plain', value: 'הסקר מולא' })
  })
})

describe('eventDurationText — כולל חציית-חצות', () => {
  it('18:00–22:00 ⇒ "4 שעות" · 22:00–02:00 ⇒ "4 שעות" (מודולו יממה)', () => {
    expect(eventDurationText('18:00:00', '22:00:00')).toBe('4 שעות')
    expect(eventDurationText('22:00:00', '02:00:00')).toBe('4 שעות')
  })

  it('שעה חסרה ⇒ null — טווח חצי-ריק אינו משך', () => {
    expect(eventDurationText('18:00:00', null)).toBe(null)
  })
})

describe('combinedDiscountPercent — חיבור ולא שרשור (§7.26)', () => {
  it('5% + 10% = 15%', () => {
    expect(combinedDiscountPercent({ applied_customer_discount: 5, manual_discount: 10 })).toBe(15)
  })

  it('אין נתון (חסימת "הצעות מחיר" מחזירה null בשקט) ⇒ null, לא 0', () => {
    expect(combinedDiscountPercent(null)).toBe(null)
  })
})

describe('dateChangeBanner (㉑) — עם שמות ובלי', () => {
  it('דיילת אחת עם שם — הנוסח המצויר במוקאפ', () => {
    const banner = dateChangeBanner({ confirmedCount: 1, names: ['נועה שגיא'], requiredCount: 6 })
    expect(banner.body).toBe(
      'דיילת אחת כבר אושרה סופית לתאריך הקודם — נועה שגיא. השמירה תבטל את האישור שלה ותשלח לה זימון מחדש לתאריך החדש.',
    )
    expect(banner.metricFrom).toBe('1/6')
    expect(banner.metricTo).toBe('0/6')
  })

  it('🔴 בלי שמות (can_read_hostesses=false) — נוסח-המונה, לעולם לא undefined ליד פסיק', () => {
    const banner = dateChangeBanner({ confirmedCount: 1, names: null, requiredCount: 6 })
    expect(banner.body).toBe(
      'דיילת אחת כבר אושרה סופית לתאריך הקודם. השמירה תבטל את האישור שלה ותשלח לה זימון מחדש לתאריך החדש.',
    )
    expect(banner.body).not.toContain('undefined')
  })

  it('אפס מאושרות — אין באנר (אין השלכה להציג)', () => {
    expect(dateChangeBanner({ confirmedCount: 0, names: [], requiredCount: 6 })).toBe(null)
  })
})

describe('שורות-המשנה של אריחי-הכרטיס', () => {
  it('דיילות: המשפט הארוך של המוקאפ, בלשון-יחיד לחוסר בודד', () => {
    expect(cardStaffingTileSub({ required_hostess_count: 6, hostesses_confirmed: 1 })).toBe(
      'חסרות 5 דיילות שאושרו סופית',
    )
    expect(cardStaffingTileSub({ required_hostess_count: 6, hostesses_confirmed: 5 })).toBe(
      'חסרה דיילת אחת שאושרה סופית',
    )
    // ‏≥ ולא = (§7.43): ‏7/6 מאויש.
    expect(cardStaffingTileSub({ required_hostess_count: 6, hostesses_confirmed: 7 })).toBe(
      '✓ מאויש',
    )
  })

  it('לוגיסטיקה: "טרם מוכנים" (הסטייה המאושרת), אפס שורות = אין פריטים', () => {
    expect(cardLogisticsTileSub({ logistics_total: 2, logistics_ready: 0 })).toBe(
      '2 פריטים טרם מוכנים',
    )
    expect(cardLogisticsTileSub({ logistics_total: 2, logistics_ready: 2 })).toBe('✓ מוכן')
    expect(cardLogisticsTileSub({ logistics_total: 0, logistics_ready: 0 })).toBe('✓ אין פריטים')
  })
})

describe('דיווח מיילים ותקציר-הצלחה', () => {
  it('שלוש תוצאות, לא שתיים — "לא ידוע" אינו "נכשל"', () => {
    const report = mailOutcomeMessage({ sent: 2, unknown: 1, failed: 0 }, 'זימונים מחדש נשלחו')
    expect(report.isError).toBe(true)
    expect(report.message).toContain('לא ידוע אם יצאו')
    expect(mailOutcomeMessage({ sent: 0, unknown: 0, failed: 0 }, 'x')).toBe(null)
  })

  it('משפט-ההצלחה של הכרטיס — "התאריך עודכן. נשלח זימון מחדש לדיילת אחת."', () => {
    expect(saveSuccessMessage({ date_changed: true }, 1)).toBe(
      'התאריך עודכן. נשלח זימון מחדש לדיילת אחת.',
    )
    expect(saveSuccessMessage({ location_changed: true, hours_changed: true }, 0)).toBe(
      'המיקום עודכן · השעות עודכנו.',
    )
  })
})

describe('CANCEL_TYPE_LABELS — שלושת ערכי ה-CHECK בלבד', () => {
  it('customer/force_majeure/other — התוויות של דיאלוג-הביטול המאושר', () => {
    expect(CANCEL_TYPE_LABELS).toEqual({
      customer: 'הלקוח ביטל',
      force_majeure: 'כוח עליון',
      other: 'אחר',
    })
  })
})
