// בדיקות הלוגיקה הטהורה של דיאלוג-הביטול (משטח 7): מדרג-הפיצוי על גבולותיו המדויקים,
// משפט-המדרג שנבנה מ-params (לעולם לא ממספרים קשיחים), וקיפול-השורה-הקובעת של הבאנר —
// אותו קיפול שה-RPC מריץ, עם נתונים מבחינים (שורה שנעקפה) ולא נתונים שכל מימוש עובר בהם.
import { describe, it, expect } from 'vitest'
import {
  CANCELLATION_PARAM_NAMES,
  LIVE_ASSIGNMENT_STATUSES,
  cancelSuccessMessage,
  cancellationBannerModel,
  compensationPercent,
  compensationReason,
  compensationSubLine,
  ladderSentence,
  releasedSentence,
} from './projectCancellation'

const PARAMS = { fullHours: '24', partialHours: '72', partialPercent: '50' }

describe('compensationPercent — המדרג של §7.16ב על שעות, מול השעה ולא מול חצות', () => {
  it('יותר מ-72 שעות ⇒ 0%', () => {
    expect(compensationPercent({ hoursUntilEvent: 73, cancelType: 'customer', ...PARAMS })).toBe(0)
    expect(compensationPercent({ hoursUntilEvent: 552, cancelType: 'customer', ...PARAMS })).toBe(0)
  })

  it('הגבולות בדיוק: 72 שעות ⇒ 50% · 24 שעות ⇒ 50% · 23 שעות ⇒ 100%', () => {
    // "יותר מ-72 מזכה ב-0%" ⇒ בדיוק 72 כבר בתוך חלון-החצי; "פחות מ-24 מזכה ב-100%" ⇒
    // בדיוק 24 עדיין בחלון-החצי. שני הגבולות נבדקים משני צדדיהם.
    expect(compensationPercent({ hoursUntilEvent: 72, cancelType: 'customer', ...PARAMS })).toBe(50)
    expect(compensationPercent({ hoursUntilEvent: 24, cancelType: 'customer', ...PARAMS })).toBe(50)
    expect(compensationPercent({ hoursUntilEvent: 23, cancelType: 'customer', ...PARAMS })).toBe(
      100,
    )
  })

  it('"אחר" מתנהג כמו "הלקוח ביטל" (יישוב-סתירה 1)', () => {
    expect(compensationPercent({ hoursUntilEvent: 30, cancelType: 'other', ...PARAMS })).toBe(50)
  })

  it('כוח עליון ⇒ 0% תמיד, גם ביום לפני', () => {
    expect(
      compensationPercent({ hoursUntilEvent: 5, cancelType: 'force_majeure', ...PARAMS }),
    ).toBe(0)
  })

  it('params חסרים ⇒ null, לא מספר מומצא', () => {
    expect(
      compensationPercent({ hoursUntilEvent: 30, cancelType: 'customer', fullHours: null }),
    ).toBeNull()
  })
})

describe('ladderSentence — המספרים מוזרקים מ-params, לא כתובים במשפט', () => {
  it('מרנדר את 24/72/50 מהערכים שנמסרו', () => {
    const text = ladderSentence(PARAMS)
    expect(text).toBe(
      'המדרג: יותר מ-72 שעות מזכה ב-0% · 24–72 שעות מזכות ב-50% · פחות מ-24 שעות מזכות ב-100% · כוח עליון מזכה ב-0% תמיד.',
    )
  })

  it('ערכים אחרים ⇒ משפט שעוקב אחריהם (ההוכחה שאין קידוד-קשיח)', () => {
    const text = ladderSentence({ fullHours: '12', partialHours: '48', partialPercent: '60' })
    expect(text).toContain('יותר מ-48 שעות')
    expect(text).toContain('12–48 שעות מזכות ב-60%')
    expect(text).toContain('פחות מ-12 שעות')
    expect(text).not.toContain('72')
  })

  it('פרמטר חסר ⇒ null', () => {
    expect(ladderSentence({ fullHours: '24', partialHours: null, partialPercent: '50' })).toBeNull()
  })
})

describe('compensationReason', () => {
  it('כוח עליון — נימוק-האיפוס הקבוע', () => {
    expect(compensationReason({ cancelType: 'force_majeure', percent: 0, ...PARAMS })).toBe(
      'כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן.',
    )
  })

  it('רגיל — הנימוק לפי האחוז, עם ערכי-params במשפט', () => {
    expect(compensationReason({ cancelType: 'customer', percent: 0, ...PARAMS })).toBe(
      'הביטול הוא יותר מ-72 שעות לפני האירוע.',
    )
    expect(compensationReason({ cancelType: 'customer', percent: 100, ...PARAMS })).toBe(
      'הביטול הוא פחות מ-24 שעות לפני האירוע.',
    )
    expect(compensationReason({ cancelType: 'customer', percent: 50, ...PARAMS })).toBe(
      'הביטול הוא 24–72 שעות לפני האירוע.',
    )
  })
})

describe('compensationSubLine — שורת-המשנה של שורת-ה-₪ (הענף של כוח-עליון, מצב ב במוקאפ)', () => {
  const ladder = 'המדרג: יותר מ-72 שעות מזכה ב-0% · …'

  it('סוג רגיל (וגם לפני בחירה) ⇒ משפט-המדרג עצמו', () => {
    expect(compensationSubLine({ cancelType: 'customer', standardPercent: 50, ladder })).toBe(
      ladder,
    )
    expect(compensationSubLine({ cancelType: null, standardPercent: 0, ladder })).toBe(ladder)
  })

  it('כוח-עליון כשהמדרג הרגיל היה נותן אחוז חיובי ⇒ משפט-ההשוואה עם האחוז', () => {
    expect(compensationSubLine({ cancelType: 'force_majeure', standardPercent: 50, ladder })).toBe(
      'בסוג "הלקוח ביטל" אותו ביטול היה נותן 50% — כאן הפיצוי מתאפס תמיד.',
    )
  })

  it('כוח-עליון כשגם "הלקוח ביטל" היה מאפס ⇒ נוסח "גם הוא 0%"', () => {
    expect(compensationSubLine({ cancelType: 'force_majeure', standardPercent: 0, ladder })).toBe(
      'בסוג "הלקוח ביטל" אותו ביטול היה נותן גם הוא 0% — כאן, לעומת זאת, גם ביטול של יום לפני היה מאפס.',
    )
  })
})

describe('cancelSuccessMessage — משפט-ההצלחה של הטוסט (הדיאלוג נסגר; אין פאנל-סיום)', () => {
  it('רבים · יחיד (לשון-יחיד לשיבוץ בודד) · אפס', () => {
    expect(cancelSuccessMessage(4)).toBe(
      'הפרויקט בוטל. 4 שיבוצים שוחררו, ופריטי הלוגיסטיקה לא השתנו.',
    )
    expect(cancelSuccessMessage(1)).toBe(
      'הפרויקט בוטל. שיבוץ אחד שוחרר, ופריטי הלוגיסטיקה לא השתנו.',
    )
    expect(cancelSuccessMessage(0)).toBe(
      'הפרויקט בוטל. לא היו דיילות משובצות — לא שוחרר אף שיבוץ ולא נשלח אף מייל.',
    )
  })

  it('קלט חסר מתנהג כמו אפס — לא NaN במשפט', () => {
    expect(cancelSuccessMessage(undefined)).toBe(
      'הפרויקט בוטל. לא היו דיילות משובצות — לא שוחרר אף שיבוץ ולא נשלח אף מייל.',
    )
  })
})

// שורת-שיבוץ מינימלית לבדיקת-הקיפול.
function row(hostessId, assignmentNumber, status, fullName) {
  return {
    project_id: 103,
    hostess_id: hostessId,
    assignment_number: assignmentNumber,
    assignment_status: status,
    hostesses: fullName === undefined ? undefined : { hostess_id: hostessId, full_name: fullName },
  }
}

describe('cancellationBannerModel — הקיפול של השורה הקובעת, כמו ה-RPC', () => {
  it('שלושת הסטטוסים החיים זהים לרשימת ה-RPC', () => {
    expect(LIVE_ASSIGNMENT_STATUSES).toEqual(['finally_approved', 'pending', 'confirmed_available'])
  })

  it('שורה שנעקפה (declined ⇒ finally_approved) נספרת פעם אחת, לפי MAX(assignment_number)', () => {
    // נתונים מבחינים: בלי הקיפול, יעל לא הייתה נספרת כלל (השורה הראשונה שלה declined)
    // או נספרת פעמיים. עם הקיפול — נספרת פעם אחת, כמאושרת.
    const model = cancellationBannerModel([
      row(1, 1, 'declined', 'יעל דוד'),
      row(1, 2, 'finally_approved', 'יעל דוד'),
      row(2, 1, 'finally_approved', 'סיון נחום'),
      row(3, 1, 'pending', 'מאיה כהן'),
      row(4, 1, 'released', 'נועה שגיא'), // היסטוריה — לא חיה, לא נספרת
    ])
    expect(model.finallyApprovedCount).toBe(2)
    expect(model.otherLiveCount).toBe(1)
    expect(model.liveCount).toBe(3)
    expect(model.approvedNames).toEqual(['יעל דוד', 'סיון נחום'])
    expect(model.otherNames).toEqual(['מאיה כהן'])
  })

  it('שם חסר ולו אחד ⇒ names null (הווריאנט חסר-השמות), והמונים נשארים', () => {
    const model = cancellationBannerModel([
      row(1, 1, 'finally_approved', null),
      row(2, 1, 'finally_approved', 'סיון נחום'),
    ])
    expect(model.finallyApprovedCount).toBe(2)
    expect(model.approvedNames).toBeNull()
  })
})

describe('releasedSentence — שני המונים תמיד (as-built ②)', () => {
  it('שני המונים מופיעים יחד, עם השמות, ומשפט אין-הבחירה נסגר', () => {
    const text = releasedSentence({
      finallyApprovedCount: 2,
      otherLiveCount: 2,
      approvedNames: ['יעל דוד', 'סיון נחום'],
      otherNames: ['מאיה כהן', 'נועה שגיא'],
    })
    expect(text).toContain(
      '2 דיילות שאושרו סופית ישוחררו ויקבלו מייל "האירוע בוטל": יעל דוד · סיון נחום',
    )
    expect(text).toContain('2 דיילות נוספות שטרם השיבו ישוחררו ויקבלו את אותו מייל')
    expect(text).toContain('אין בחירה מי — כולן משוחררות יחד.')
  })

  it('בלי שמות — המונים לבדם (ספירה בלי שמות, לא שם ריק)', () => {
    const text = releasedSentence({
      finallyApprovedCount: 3,
      otherLiveCount: 0,
      approvedNames: null,
      otherNames: null,
    })
    expect(text).toContain('3 דיילות שאושרו סופית')
    expect(text).not.toContain(':')
  })

  it('אפס משובצות ⇒ משפט-הריק של הכרטיס (§④ — היעדר-השלכה הוא מידע)', () => {
    expect(
      releasedSentence({
        finallyApprovedCount: 0,
        otherLiveCount: 0,
        approvedNames: null,
        otherNames: null,
      }),
    ).toBe('אין דיילות משובצות — אין מה לשחרר ואין פיצוי.')
  })

  it('לשון-יחיד לשיבוץ בודד', () => {
    const text = releasedSentence({
      finallyApprovedCount: 1,
      otherLiveCount: 1,
      approvedNames: ['יעל דוד'],
      otherNames: ['מאיה כהן'],
    })
    expect(text).toContain('דיילת אחת שאושרה סופית תשוחרר')
    expect(text).toContain('דיילת נוספת אחת שטרם השיבה תשוחרר')
  })
})

describe('CANCELLATION_PARAM_NAMES — זהים-בייט לזרע 1.7', () => {
  it('שלושת השמות', () => {
    expect(Object.values(CANCELLATION_PARAM_NAMES)).toEqual([
      'שעות_פיצוי_ביטול_מלא',
      'שעות_פיצוי_ביטול_חלקי',
      'אחוז_פיצוי_ביטול_חלקי',
    ])
  })
})
