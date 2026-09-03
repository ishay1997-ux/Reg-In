import { describe, it, expect } from 'vitest'
import {
  ASSIGNMENT_ACTION,
  nextAssignmentNumber,
  autoReleaseTargets,
  quotaNotice,
  overQuotaLabel,
  resendDisabledReason,
  rowMenuItems,
} from './assignmentActions'

// שורת-שיבוץ מינימלית. `assignment_number` ברירת-מחדל 1 — רוב המקרים כאן הם שורה יחידה,
// והמקרים שבהם יש שתיים הם בדיוק אלה שהבדיקות למטה נכתבו בשבילם.
const row = (patch = {}) => ({
  project_id: 8,
  hostess_id: 1,
  assignment_number: 1,
  assignment_status: 'pending',
  invite_sent_at: '2026-08-09T08:00:00.000Z',
  is_shift_lead: false,
  ...patch,
})

// 🔄 שני ספי-הזימון ירדו ל-`params` (מודול 9 · צעד 2.3) ונוסעים באותו אובייקט-הקשר
// שכבר נשא את "עכשיו". **מחרוזות** — `param_value` הוא `text` במסד.
const CTX = {
  nowIso: '2026-08-09T12:00:00.000Z',
  inviteValidityHours: '48',
  inviteCutoffHours: '24',
  isEventStaffed: false,
  isWithinFinalDay: false,
  hasShiftLead: false,
}

const labelsOf = (items) => items.map((item) => item.label)

describe('nextAssignmentNumber — "פתח זימון חדש" יוצר שורה שנייה', () => {
  it('אין שורה לצמד ⇒ 1', () => {
    expect(nextAssignmentNumber([], 8, 1)).toBe(1)
  })

  it('🔴 max+1 ולא count+1 — שורה שנמחקה/נדלגה אינה מחזירה מספר שכבר היה בשימוש', () => {
    const rows = [
      row({ assignment_number: 1 }),
      row({ assignment_number: 5 }),
      row({ assignment_number: 3 }),
    ]
    expect(nextAssignmentNumber(rows, 8, 1)).toBe(6)
  })

  it('🔴 סופר רק את הצמד הזה — דיילת אחרת באותו אירוע אינה מזיזה את המספר', () => {
    const rows = [row({ hostess_id: 2, assignment_number: 9 }), row({ assignment_number: 1 })]
    expect(nextAssignmentNumber(rows, 8, 1)).toBe(2)
  })

  it('🔴 ואירוע אחר של אותה דיילת אינו מזיז אותו', () => {
    const rows = [row({ project_id: 3, assignment_number: 7 })]
    expect(nextAssignmentNumber(rows, 8, 1)).toBe(1)
  })
})

describe('autoReleaseTargets — השחרור שנוסע יחד עם האישור הסופי (local-13)', () => {
  const filled = [
    row({ hostess_id: 1, assignment_status: 'finally_approved' }),
    row({ hostess_id: 2, assignment_status: 'finally_approved' }),
    row({ hostess_id: 3, assignment_status: 'confirmed_available' }),
    row({ hostess_id: 4, assignment_status: 'pending' }),
  ]

  it('🔴 המכסה מלאה ⇒ מי שאישרה זמינות ולא נכנסה משוחררת', () => {
    expect(autoReleaseTargets(filled, 2).map((r) => r.hostess_id)).toEqual([3])
  })

  it('🔴 המכסה עדיין חסרה ⇒ אף אחת אינה משוחררת — היא עוד עשויה להיכנס', () => {
    expect(autoReleaseTargets(filled, 6)).toEqual([])
  })

  it('🚫 "ממתינה" אינה משוחררת גם כשהמכסה מלאה — היא לא הבטיחה כלום', () => {
    const targets = autoReleaseTargets(filled, 2)
    expect(targets.some((r) => r.assignment_status === 'pending')).toBe(false)
  })

  it('🔴 על השורה הקובעת בלבד: אישרה זמינות ואז נפתח לה זימון חדש שממתין — אינה משוחררת', () => {
    const rows = [
      row({ hostess_id: 1, assignment_status: 'finally_approved' }),
      row({ hostess_id: 3, assignment_number: 1, assignment_status: 'confirmed_available' }),
      row({ hostess_id: 3, assignment_number: 2, assignment_status: 'pending' }),
    ]
    expect(autoReleaseTargets(rows, 1)).toEqual([])
  })

  it('מכסה חסרה או לא ידועה ⇒ ריק, ולא "שחרר את כולן"', () => {
    expect(autoReleaseTargets(filled, null)).toEqual([])
  })
})

describe('quotaNotice — עודף אישורים מזהיר ולעולם לא חוסם (§ב5)', () => {
  it('בתוך המכסה ⇒ אין אזהרה', () => {
    expect(quotaNotice({ approvedCount: 2, requiredCount: 6, adding: 3 })).toBe(null)
  })

  it('🔴 חצייה של המכסה ⇒ אזהרה שנוקבת בשני המספרים ובשם', () => {
    const notice = quotaNotice({
      approvedCount: 6,
      requiredCount: 6,
      adding: 1,
      subjectLabel: 'נועה שגיא',
    })
    expect(notice.title).toBe('המכסה מלאה — 6 מתוך 6. לאשר את נועה שגיא בכל זאת?')
    expect(notice.note).toBe('ההצעה תומחרה ל-6 דיילות. דיילת נוספת היא עלות שהלקוח לא משלם עליה.')
  })

  it('אישור-בכמות שחוצה את המכסה מזהיר גם הוא', () => {
    expect(quotaNotice({ approvedCount: 5, requiredCount: 6, adding: 3 })).not.toBe(null)
  })

  it('🚫 מכסה לא-ידועה אינה ממציאה אזהרה', () => {
    expect(quotaNotice({ approvedCount: 9, requiredCount: null, adding: 1 })).toBe(null)
  })
})

describe('overQuotaLabel — המונה שנצבע כשעברו את הנדרש (§ב5)', () => {
  it('בדיוק במכסה ⇒ אין תוספת', () => {
    expect(overQuotaLabel(6, 6)).toBe(null)
  })

  it('אחת מעבר ⇒ בעברית, לא "1 מעבר"', () => {
    expect(overQuotaLabel(7, 6)).toBe('אחת מעבר לנדרש')
  })

  it('יותר מאחת ⇒ מספר', () => {
    expect(overQuotaLabel(9, 6)).toBe('3 מעבר לנדרש')
  })
})

describe('resendDisabledReason — שלושה מצבים, לא אחד (מסך 4 §⑤)', () => {
  it('שורה ממתינה באירוע חי ⇒ מותר', () => {
    expect(resendDisabledReason(row(), CTX)).toBe(null)
  })

  it('🔴 בתוך 24 השעות — קישור שנשלח עכשיו נולד מת', () => {
    expect(resendDisabledReason(row(), { ...CTX, isWithinFinalDay: true })).toBe(
      'האירוע בתוך 24 שעות — קישור חדש כבר לא ייפתח',
    )
  })

  // 🔬 בדיקת-המוטציה של צעד 2.3: אותו מצב בדיוק, סף אחר ⇒ **הכיתוב עצמו משתנה**.
  // אילו המספר היה נשאר קפוא במחרוזת, שתי השורות היו זהות והבדיקה ירוקה על נוסח שקרי.
  it('הסף במשפט מגיע מ-`params` — סף 12 מייצר "בתוך 12 שעות"', () => {
    expect(
      resendDisabledReason(row(), { ...CTX, isWithinFinalDay: true, inviteCutoffHours: '12' }),
    ).toBe('האירוע בתוך 12 שעות — קישור חדש כבר לא ייפתח')
  })

  // 🔴 סף חסר ⇒ **הפסוקית יורדת ואין נוסח חדש** — הסיבה עצמה נאמרת במלואה.
  // המסלול אינו נגיש ממסך אמיתי (הטוען זורק קודם), ולכן ניסוח-חלופה היה המצאה.
  it('סף חסר ⇒ הסיבה בלי הפסוקית, ובלי מספר מומצא', () => {
    for (const bad of [undefined, null, '', '   ']) {
      expect(
        resendDisabledReason(row(), { ...CTX, isWithinFinalDay: true, inviteCutoffHours: bad }),
      ).toBe('קישור חדש כבר לא ייפתח')
    }
  })

  it('🔴 האירוע כבר אויש — הדיילת תלחץ ותקבל "המשרה כבר אוישה"', () => {
    expect(resendDisabledReason(row(), { ...CTX, isEventStaffed: true })).toBe(
      'האירוע כבר אויש במלואו',
    )
  })

  it('🔴 שורה שאינה ממתינה — אין קישור חי לרענן', () => {
    expect(resendDisabledReason(row({ assignment_status: 'declined' }), CTX)).toBe(
      'הדיילת כבר ענתה — רענון קישור לא רלוונטי',
    )
  })
})

describe('rowMenuItems — התוכן נגזר מהסטטוס, לעולם לא רשימה שטוחה', () => {
  it('🔴 ממתינה: ארבעה פריטים, ו"שלח את הקישור שוב" ראשי', () => {
    const items = rowMenuItems(row(), CTX)
    expect(labelsOf(items)).toEqual([
      'שלח את הקישור שוב',
      'סמן: אישרה זמינות',
      'סמן: סירבה',
      'אושרה סופית — סוכם בטלפון',
    ])
    expect(items[0].isPrimary).toBe(true)
  })

  it('🔴 פג תוקף = אותם ארבעה פריטים בדיוק — לא תפריט אחר (§⑧②)', () => {
    const expired = row({ invite_sent_at: '2026-08-01T08:00:00.000Z' })
    expect(labelsOf(rowMenuItems(expired, CTX))).toEqual(labelsOf(rowMenuItems(row(), CTX)))
  })

  it('🔴 בתוך T-24 אותם פריטים, סדר הפוך — והרענון מכובה ומנומק, לא נעלם', () => {
    const items = rowMenuItems(row(), { ...CTX, isWithinFinalDay: true })
    expect(labelsOf(items)).toEqual([
      'אושרה סופית — סוכם בטלפון',
      'סמן: אישרה זמינות',
      'סמן: סירבה',
      'שלח את הקישור שוב',
    ])
    expect(items[0].isPrimary).toBe(true)
    expect(items[3].disabledReason).toBe('האירוע בתוך 24 שעות — קישור חדש כבר לא ייפתח')
  })

  it('🔴 אישרה זמינות: אין "שלח שוב" — היא כבר ענתה', () => {
    const items = rowMenuItems(row({ assignment_status: 'confirmed_available' }), CTX)
    expect(labelsOf(items)).toEqual([
      'אשר סופית ושלח פרטים',
      'סמן: סירבה (חזרה בה)',
      'שחרר — המשרה אוישה',
    ])
  })

  it('🔴 אושרה סופית: שלוש הפעולות שאין לאף שורה אחרת', () => {
    const items = rowMenuItems(row({ assignment_status: 'finally_approved' }), CTX)
    expect(labelsOf(items)).toEqual([
      'סמן כאחראית משמרת',
      'שחרר מהאירוע (צמצום תקנים)',
      'סמן: ביטלה אחרי אישור',
    ])
  })

  it('אחראית משמרת מסומנת ⇒ הפריט הופך לביטול', () => {
    const items = rowMenuItems(
      row({ assignment_status: 'finally_approved', is_shift_lead: true }),
      { ...CTX, hasShiftLead: true },
    )
    expect(items[0].label).toBe('בטל סימון אחראית משמרת')
    expect(items[0].disabledReason).toBe(null)
  })

  it('🔴 כבר יש אחראית אחרת ⇒ הפריט מכובה ומנומק, ולא נופל על אילוץ-המסד', () => {
    const items = rowMenuItems(row({ assignment_status: 'finally_approved' }), {
      ...CTX,
      hasShiftLead: true,
    })
    expect(items[0].disabledReason).toBe('כבר מסומנת אחראית משמרת אחרת לאירוע הזה')
  })

  it('🔴 סירבה ⇒ "פתח זימון חדש" בלבד — ולעולם לא "שלח את הקישור שוב"', () => {
    const items = rowMenuItems(row({ assignment_status: 'declined' }), CTX)
    expect(labelsOf(items)).toEqual(['פתח זימון חדש'])
    expect(items[0].action).toBe(ASSIGNMENT_ACTION.NEW_INVITE)
  })

  it('🔴 שוחררה ⇒ גם היא "פתח זימון חדש", כשתקן נפתח מחדש', () => {
    expect(labelsOf(rowMenuItems(row({ assignment_status: 'released' }), CTX))).toEqual([
      'פתח זימון חדש',
    ])
  })

  it('🔴 ביטלה אחרי אישור ⇒ אין פעולות, שורת היסטוריה', () => {
    expect(rowMenuItems(row({ assignment_status: 'approval_withdrawn' }), CTX)).toEqual([])
  })

  it('🚫 אין מחיקה בשום סטטוס', () => {
    const statuses = [
      'pending',
      'confirmed_available',
      'finally_approved',
      'declined',
      'released',
      'approval_withdrawn',
    ]
    const everyLabel = statuses.flatMap((assignment_status) =>
      labelsOf(rowMenuItems(row({ assignment_status }), CTX)),
    )
    expect(everyLabel.some((label) => label.includes('מחק'))).toBe(false)
  })

  it('🔴 כל פריט מצהיר אם הוא מגיע לדיילת — המסך חייב להבדיל', () => {
    const sending = rowMenuItems(row(), CTX).filter((item) => item.sendsEmail)
    expect(labelsOf(sending)).toEqual(['שלח את הקישור שוב', 'אושרה סופית — סוכם בטלפון'])
    const marking = rowMenuItems(row({ assignment_status: 'finally_approved' }), CTX)
    // 🔴 **המוקאפ סותר את עצמו כאן, והכרטיס מכריע:** ההערה שמתחת לתפריט אומרת *"שתי
    // האחרונות שולחות מייל"*, בעוד **מפת-הלחיצות** (`screens-approved` מסך 4 §①) מסמנת
    // `סמן: ביטלה אחרי אישור` כ-🚫 **ומקרא-המוקאפ עצמו** מונה אותה תחת *"רק רושמות"*.
    // ⇒ שתיים מול אחת, והבוררות ממילא נותנת התנהגות לאפיון. **היא אינה שולחת מייל.**
    expect(marking.find((i) => i.label === 'סמן: ביטלה אחרי אישור').sendsEmail).toBe(false)
    expect(marking.find((i) => i.label === 'שחרר מהאירוע (צמצום תקנים)').sendsEmail).toBe(true)
    expect(marking.find((i) => i.label === 'סמן כאחראית משמרת').sendsEmail).toBe(false)
  })
})
