// בדיקות הלוגיקה הטהורה של לשונית צוות-הדיילות (משטח 4) — נועלות: משפט-לכל-סטטוס
// (מילים, לעולם לא ציון — §1.8), המשפט-האדום-היחיד על נוסחו המאושר, סדר "בפנים · פתוח ·
// יצא", הערת-הקיפול במספרים חיים, ונוסחי הווריאנטים (בוטל · טרם נשלח זימון).
import { describe, it, expect } from 'vitest'
import {
  assignmentMeaning,
  teamHeadline,
  missingTileSub,
  sortTeamRows,
  isMutedTeamRow,
  inviteExpiryText,
  daysWithoutAnswer,
  historyFootnote,
  sortRoundsHistory,
  cancelledReleasedSentence,
  hostessCountChanges,
  scopeFactSentence,
} from './projectTeam'

describe('assignmentMeaning — משפט לכל מצב, לעולם לא ציון', () => {
  const ALL_STATUSES = [
    'pending',
    'confirmed_available',
    'declined',
    'finally_approved',
    'released',
    'approval_withdrawn',
  ]

  it('לכל אחד מששת הסטטוסים יש משפט, ואין בו צורת-ציון (N/M)', () => {
    for (const status of ALL_STATUSES) {
      const sentence = assignmentMeaning({ status })
      expect(sentence.length).toBeGreaterThan(5)
      expect(sentence).not.toMatch(/\d+\s*\/\s*\d+/)
    }
  })

  it('אחראית-משמרת מקבלת את משפט-המוקאפ המלא', () => {
    expect(assignmentMeaning({ status: 'finally_approved', isShiftLead: true })).toBe(
      'בפנים. היא אחראית המשמרת של האירוע — אחת לאירוע, ורק על מי שאושרה סופית.',
    )
  })

  it('זימון שפג: ימים-ללא-מענה + רגע-התפוגה + הפעולה הבאה', () => {
    const sentence = assignmentMeaning({
      status: 'pending',
      expired: true,
      daysWithoutAnswer: 4,
      expiredOnText: '11/08 23:33',
    })
    expect(sentence).toBe(
      '4 ימים ללא מענה, והקישור פג ב-11/08 23:33. אין ממה לחכות — היא לא תוכל לענות; הפעולה הבאה היא זימון חדש.',
    )
  })

  it('שוחררה וביטלה נבדלות במילים — הן נראות זהות בתג ואינן (§⑥)', () => {
    const released = assignmentMeaning({ status: 'released' })
    const withdrawn = assignmentMeaning({ status: 'approval_withdrawn' })
    expect(released).toContain('אינו נספר לה לרעה')
    expect(withdrawn).toContain('כן נספר באמינות ההגעה שלה')
    expect(released).not.toBe(withdrawn)
  })

  it('הושלם גובר על כל השאר — האירוע התקיים', () => {
    expect(assignmentMeaning({ status: 'finally_approved', completed: true })).toContain(
      'האירוע התקיים',
    )
  })
})

describe('teamHeadline — המשפט האדום היחיד, והמילים נושאות אותו', () => {
  it('המקרה החי של #8: כל הזימונים הפתוחים פגו — הנוסח המאושר', () => {
    const headline = teamHeadline({ gap: 5, pendingLive: 0, pendingExpired: 2 })
    expect(headline.lead).toBe('⚠ חסרות 5 דיילות')
    expect(headline.rest).toBe(
      '— שני הזימונים הפתוחים פגו אחרי 48 שעות, כלומר אין קישור חי: גם דיילת שתרצה לאשר עכשיו לא תוכל. הפעולה הבאה היא זימון חדש, לא המתנה.',
    )
  })

  it('אין חוסר ⇒ אין משפט — "לא בכוח"', () => {
    expect(teamHeadline({ gap: 0, pendingLive: 0, pendingExpired: 2 })).toBeNull()
  })

  it('לשון-יחיד לחוסר בודד ולזימון בודד', () => {
    expect(teamHeadline({ gap: 1, pendingLive: 0, pendingExpired: 1 }).lead).toBe(
      '⚠ חסרה דיילת אחת',
    )
    expect(teamHeadline({ gap: 1, pendingLive: 0, pendingExpired: 1 }).rest).toContain(
      'הזימון הפתוח היחיד פג',
    )
    expect(teamHeadline({ gap: 2, pendingLive: 1, pendingExpired: 0 }).rest).toContain(
      'זימון אחד ממתין למענה',
    )
  })

  it('יש זימונים חיים ⇒ אין טענת "אין קישור חי"', () => {
    const headline = teamHeadline({ gap: 3, pendingLive: 2, pendingExpired: 1 })
    expect(headline.rest).toContain('2 זימונים ממתינים למענה')
    expect(headline.rest).not.toContain('אין קישור חי')
  })
})

describe('missingTileSub — שורת-המשנה של אריח "חסרות"', () => {
  it('כל הפתוחים פגו ⇒ "אין אף זימון חי" (המוקאפ)', () => {
    expect(missingTileSub({ gap: 5, pendingLive: 0, pendingExpired: 2 })).toBe('אין אף זימון חי')
  })

  it('אין חוסר ⇒ אין שורה', () => {
    expect(missingTileSub({ gap: 0 })).toBeNull()
  })

  it('זימונים חיים נספרים, בלשון-יחיד לבודד', () => {
    expect(missingTileSub({ gap: 2, pendingLive: 1 })).toBe('זימון אחד ממתין למענה')
    expect(missingTileSub({ gap: 3, pendingLive: 2 })).toBe('2 זימונים ממתינים למענה')
  })
})

describe('sortTeamRows — בפנים · פתוח · יצא', () => {
  it('הסדר הוא ערוץ-מידע: אושרה ⇒ פתוחות ⇒ שוחררו ⇒ ביטלה — כמו במוקאפ', () => {
    const rows = [
      {
        hostess_id: 'h6',
        assignment_status: 'approval_withdrawn',
        invite_sent_at: '2026-08-09T20:36:00Z',
      },
      { hostess_id: 'h4', assignment_status: 'released', invite_sent_at: '2026-08-12T07:01:00Z' },
      { hostess_id: 'h2', assignment_status: 'pending', invite_sent_at: '2026-08-11T09:04:00Z' },
      {
        hostess_id: 'h1',
        assignment_status: 'finally_approved',
        invite_sent_at: '2026-08-09T20:33:00Z',
      },
      { hostess_id: 'h5', assignment_status: 'released', invite_sent_at: '2026-08-09T20:33:00Z' },
      { hostess_id: 'h3', assignment_status: 'pending', invite_sent_at: '2026-08-09T20:33:00Z' },
    ]
    expect(sortTeamRows(rows).map((row) => row.hostess_id)).toEqual([
      'h1', // בפנים
      'h2', // פתוח — הזימון החדש קודם
      'h3',
      'h4', // שוחררו — החדשה קודם
      'h5',
      'h6', // ביטלה אחרי אישור — אחרונה
    ])
  })

  it('שוחררה וביטלה מעומעמות; פתוחות אינן', () => {
    expect(isMutedTeamRow('released')).toBe(true)
    expect(isMutedTeamRow('approval_withdrawn')).toBe(true)
    expect(isMutedTeamRow('pending')).toBe(false)
    expect(isMutedTeamRow('finally_approved')).toBe(false)
  })
})

describe('נגזרות-הזמן של זימון', () => {
  // 🔄 סף-התוקף ירד מקבוע-קוד לשורת-`params` `שעות_תוקף_זימון` (מודול 9 · צעד 2.3)
  // ומוזרק כמו "עכשיו". **מחרוזת** — `param_value` הוא `text` במסד.
  it('רגע-התפוגה = שליחה + סף-התוקף, בשעון ישראל', () => {
    // ‏09/08 20:33Z (קיץ, UTC+3 ⇒ ‏23:33 מקומי); ‏+48 שעות ⇒ ‏11/08 23:33.
    expect(inviteExpiryText('2026-08-09T20:33:00Z', '48')).toBe('11/08 23:33')
  })

  // 🔬 מוטציה: אותה שליחה בדיוק, סף אחר ⇒ רגע-תפוגה אחר.
  it('סף 24 שעות מזיז את רגע-התפוגה ליום קודם', () => {
    expect(inviteExpiryText('2026-08-09T20:33:00Z', '24')).toBe('10/08 23:33')
  })

  // 🔴 סף חסר ⇒ `null` ולא חותמת מומצאת — הלשונית מציגה את המשפט בלי רגע-התפוגה.
  it('סף חסר ⇒ null, ולא נפילה חזרה ל-48', () => {
    for (const bad of [undefined, null, '', '   ']) {
      expect(inviteExpiryText('2026-08-09T20:33:00Z', bad)).toBeNull()
    }
  })

  it('ימים-ללא-מענה נספרים בימים שלמים מרגע-השליחה', () => {
    expect(daysWithoutAnswer('2026-08-09T20:33:00Z', '2026-08-13T21:00:00Z')).toBe(4)
    expect(daysWithoutAnswer(null, '2026-08-13T21:00:00Z')).toBeNull()
  })
})

describe('historyFootnote — הקיפול גלוי במספרים חיים, לא מועתקים', () => {
  it('‏9 שורות ⇒ 6 דיילות, בנוסח המוקאפ', () => {
    expect(historyFootnote(9, 6)).toBe(
      '9 שורות במסד, 6 דיילות על המסך: הסטטוס הקובע לכל דיילת הוא של הסבב האחרון שלה. הסבבים הקודמים נשמרים ואינם נמחקים.',
    )
  })

  it('לשון-יחיד — "1 שורות" היא עברית שבורה', () => {
    expect(historyFootnote(1, 1)).toContain('שורה אחת במסד, דיילת אחת על המסך')
  })
})

describe('sortRoundsHistory — סבב ואז תאריך-שליחה', () => {
  it('סבב 1 כולו לפני סבב 2, ובתוך סבב לפי רגע-השליחה', () => {
    const rows = [
      { hostess_id: 'h2', assignment_number: 2, invite_sent_at: '2026-08-11T09:04:00Z' },
      { hostess_id: 'h1', assignment_number: 1, invite_sent_at: '2026-08-09T20:36:00Z' },
      { hostess_id: 'h3', assignment_number: 1, invite_sent_at: '2026-08-09T20:33:00Z' },
    ]
    expect(
      sortRoundsHistory(rows).map((row) => `${row.hostess_id}:${row.assignment_number}`),
    ).toEqual(['h3:1', 'h1:1', 'h2:2'])
  })
})

describe('וריאנט הביטול ומקטע שינויי-הכמות', () => {
  it('משפט-השחרור נבנה מהמונה החי, בלשון-יחיד לבודדת', () => {
    expect(cancelledReleasedSentence(3)).toBe(
      '3 דיילות שוחררו אוטומטית וקיבלו הודעה. אין מה לבחור ואין חוסר — האירוע אינו מתקיים.',
    )
    expect(cancelledReleasedSentence(1)).toContain('דיילת אחת שוחררה אוטומטית וקיבלה הודעה')
    expect(cancelledReleasedSentence(0)).toBe('אין מה לבחור ואין חוסר — האירוע אינו מתקיים.')
  })

  it('hostessCountChanges מסנן לפי change_target — אחרת הלשונית מציגה גם שינויי-תגים', () => {
    const changes = [
      { change_id: 1, change_target: 'logistics', sku: 'TAG' },
      { change_id: 2, change_target: 'hostess_count', sku: null },
    ]
    expect(hostessCountChanges(changes).map((change) => change.change_id)).toEqual([2])
  })

  it('שורת-העובדה נוקבת בכמות ובמועד-האישור', () => {
    const sentence = scopeFactSentence({ required: 6, approvedOnText: '12/08/2026' })
    expect(sentence).toContain('הכמות עומדת על 6 מאז אישור ההצעה (12/08/2026)')
    expect(sentence).toContain('מה השתנה · בכמה · מי ביצע · מתי · והסיבה שנרשמה')
  })
})
