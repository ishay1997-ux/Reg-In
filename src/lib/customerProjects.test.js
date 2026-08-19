import { describe, it, expect } from 'vitest'
import {
  DORMANT_THRESHOLD_PARAM_NAME,
  splitCustomerProjectsByTimeline,
  eventCountSummary,
  cancelledCountNote,
  isCustomerDormant,
  lastEventTileState,
  projectDaySentence,
  cancellationSubLabel,
  projectAmount,
  matchesProjectSearch,
} from './customerProjects'

const TODAY = '2026-08-13' // "היום" של המוקאפ המאושר (08_customer_projects_tab_approved.html)

// עוזר-בנייה לפרויקט-בדיקה — צורת-DB כפי ש-getCustomerProjects מחזירה (override נקודתי).
const p = (over = {}) => ({
  project_id: 1,
  event_name: 'כנס לקוחות שנתי',
  final_event_date: '2026-08-22',
  project_status: 'in_progress',
  quotes: null,
  ...over,
})

describe('DORMANT_THRESHOLD_PARAM_NAME', () => {
  it('שם-הפרמטר הקבוע — הזרוע ב-module6_params_seed, לעולם לא מוקלד מחדש', () => {
    expect(DORMANT_THRESHOLD_PARAM_NAME).toBe('סף_לקוח_רדום_ימים')
  })
})

describe('splitCustomerProjectsByTimeline — פיצול ⑥', () => {
  const upcomingNear = p({ project_id: 1, final_event_date: '2026-08-22' })
  const upcomingFar = p({ project_id: 2, final_event_date: '2026-09-27' })
  const pastFinished = p({
    project_id: 3,
    final_event_date: '2026-08-01',
    project_status: 'event_finished',
  })
  // 🆕 ㊲: מבוטל שתאריכו **עתידי** — יושב ב"התקיימו" בכל זאת, בסוף הקטע.
  const cancelledFuture = p({
    project_id: 4,
    final_event_date: '2026-09-05',
    project_status: 'cancelled',
  })
  const cancelledPast = p({
    project_id: 5,
    final_event_date: '2026-07-01',
    project_status: 'cancelled',
  })

  it('מתקרבים: תאריך≥היום ולא-מבוטל, הקרוב ראשון — כולל היום עצמו', () => {
    const includesToday = p({ project_id: 6, final_event_date: TODAY })
    const { upcoming } = splitCustomerProjectsByTimeline(
      [upcomingFar, upcomingNear, includesToday],
      TODAY,
    )
    expect(upcoming.map((x) => x.project_id)).toEqual([6, 1, 2])
  })

  it('התקיימו: תאריך<היום או מבוטל — האחרון ראשון, והמבוטלים תמיד בסוף הקטע', () => {
    const { happened } = splitCustomerProjectsByTimeline(
      [pastFinished, cancelledFuture, cancelledPast],
      TODAY,
    )
    // לא-מבוטל (#3) קודם, ואז שני המבוטלים ביניהם ממוינים יורד (#4 לפני #5) — בלי קשר
    // לכך ש-#4 תאריכו עתידי: הסטטוס גובר על הלוח-שנה.
    expect(happened.map((x) => x.project_id)).toEqual([3, 4, 5])
  })

  it('שובר-שוויון יציב (project_id) כששני תאריכים זהים', () => {
    const a = p({ project_id: 10, final_event_date: '2026-09-01' })
    const b = p({ project_id: 5, final_event_date: '2026-09-01' })
    const { upcoming } = splitCustomerProjectsByTimeline([a, b], TODAY)
    expect(upcoming.map((x) => x.project_id)).toEqual([5, 10])
  })
})

describe('eventCountSummary — אריח "מספר אירועים" (③.2)', () => {
  it('סופר הכול כולל מבוטלים, ומפריד כמה מהם בוטלו', () => {
    const list = [
      p({ project_status: 'in_progress' }),
      p({ project_status: 'not_started' }),
      p({ project_status: 'event_finished' }),
      p({ project_status: 'cancelled' }),
    ]
    expect(eventCountSummary(list)).toEqual({ count: 4, cancelledCount: 1 })
  })

  it('אין פרויקטים ⇒ 0/0', () => {
    expect(eventCountSummary([])).toEqual({ count: 0, cancelledCount: 0 })
  })
})

describe('cancelledCountNote — לשון יחיד/רבים, "לא בכוח" באפס', () => {
  it('0 ⇒ null (אין מה לדווח)', () => {
    expect(cancelledCountNote(0)).toBeNull()
  })
  it('1 ⇒ לשון יחיד', () => {
    expect(cancelledCountNote(1)).toBe('אחד מהם בוטל')
  })
  it('N>1 ⇒ לשון רבים', () => {
    expect(cancelledCountNote(3)).toBe('3 מהם בוטלו')
  })
})

describe('isCustomerDormant — שני תנאים, לא אחד (③.2 ↳)', () => {
  const farPast = p({ final_event_date: '2026-01-01', project_status: 'finished' })

  it('יש פרויקט-עתיד ⇒ אף פעם לא רדום, גם אם האחרון היה מזמן', () => {
    const future = p({ final_event_date: '2026-12-01', project_status: 'not_started' })
    expect(isCustomerDormant([farPast, future], TODAY, 120)).toBe(false)
  })

  it('אין עתיד, ומתחת לסף ⇒ לא רדום', () => {
    const recent = p({ final_event_date: '2026-07-20', project_status: 'finished' }) // ~24 ימים
    expect(isCustomerDormant([recent], TODAY, 120)).toBe(false)
  })

  it('אין עתיד, ומעל הסף ⇒ רדום', () => {
    expect(isCustomerDormant([farPast], TODAY, 120)).toBe(true) // >220 ימים
  })

  it('בלי פרויקטים בעבר בכלל (רק מבוטלים/אין) ⇒ לא רדום (אין "אחרון" להשוות אליו)', () => {
    const onlyCancelled = p({ final_event_date: '2026-01-01', project_status: 'cancelled' })
    expect(isCustomerDormant([onlyCancelled], TODAY, 120)).toBe(false)
  })

  it('סף לא-תקין (NaN/חסר, כשל-טעינת-פרמטר) ⇒ לא נכשל, פשוט לא-רדום', () => {
    expect(isCustomerDormant([farPast], TODAY, NaN)).toBe(false)
    expect(isCustomerDormant([farPast], TODAY, undefined)).toBe(false)
  })
})

describe('lastEventTileState — שלושת מצבי האריח (③.2 + נספח ⑥)', () => {
  it('תאריך רגיל (לא רדום)', () => {
    const recent = p({ final_event_date: '2026-08-01', project_status: 'finished' })
    const state = lastEventTileState([recent], TODAY, 120)
    expect(state).toEqual({ kind: 'date', date: '2026-08-01', daysAgo: 12, dormant: false })
  })

  it('תאריך רדום', () => {
    const old = p({ final_event_date: '2026-03-20', project_status: 'finished' })
    const state = lastEventTileState([old], TODAY, 120)
    expect(state.kind).toBe('date')
    expect(state.dormant).toBe(true)
    expect(state.daysAgo).toBeGreaterThan(120)
  })

  it('טרם התקיים אירוע, אבל יש אחד מתוכנן — nextDate = הקרוב מביניהם', () => {
    const far = p({ project_id: 1, final_event_date: '2026-09-27', project_status: 'not_started' })
    const near = p({ project_id: 2, final_event_date: '2026-08-19', project_status: 'not_started' })
    const state = lastEventTileState([far, near], TODAY, 120)
    expect(state).toEqual({ kind: 'neverHeld', nextDate: '2026-08-19' })
  })

  it('טרם התקיים אירוע, ואין אף אחד עתידי — nextDate null', () => {
    expect(lastEventTileState([], TODAY, 120)).toEqual({ kind: 'neverHeld', nextDate: null })
  })
})

describe('projectDaySentence — הצורה הקצרה (③.3), שונה מ-eventPassedSentence הארוכה', () => {
  it('גבולות: היום/מחר/אתמול', () => {
    expect(projectDaySentence(0)).toBe('היום')
    expect(projectDaySentence(1)).toBe('מחר')
    expect(projectDaySentence(-1)).toBe('אתמול')
  })
  it('עתיד/עבר — לשון רבים, בלי "התקיים" (בניגוד ל-§3.7 של מבט-העל)', () => {
    expect(projectDaySentence(9)).toBe('בעוד 9 ימים')
    expect(projectDaySentence(-12)).toBe('לפני 12 ימים')
  })
  it('null/undefined ⇒ מחרוזת ריקה, לא נופל', () => {
    expect(projectDaySentence(null)).toBe('')
    expect(projectDaySentence(undefined)).toBe('')
  })
})

describe('cancellationSubLabel — שורת-המשנה של שורה מבוטלת', () => {
  it('שלושת החלקים מחוברים כמו במוקאפ: תאריך · סוג · "סיבה"', () => {
    const cancelled = p({
      cancelled_at: '2026-08-11T09:30:00+00:00',
      cancel_type: 'customer',
      cancel_reason: 'הלקוח דחה את האירוע לרבעון הבא',
    })
    expect(cancellationSubLabel(cancelled)).toBe(
      'בוטל 11/08/2026 · הלקוח ביטל · "הלקוח דחה את האירוע לרבעון הבא"',
    )
  })

  it('כוח עליון / אחר — תוויות מ-CANCEL_TYPE_LABELS, לא מוקלדות מחדש', () => {
    const fm = p({ cancelled_at: '2026-05-01T00:00:00+00:00', cancel_type: 'force_majeure' })
    expect(cancellationSubLabel(fm)).toContain('כוח עליון')
    const other = p({ cancelled_at: '2026-05-01T00:00:00+00:00', cancel_type: 'other' })
    expect(cancellationSubLabel(other)).toContain('אחר')
  })

  it('בלי סיבה (לא אמור לקרות — הכרעת-חובה בדיאלוג-הביטול — אבל לא נופל)', () => {
    const noReason = p({ cancelled_at: '2026-05-01T00:00:00+00:00', cancel_type: 'customer' })
    expect(cancellationSubLabel(noReason)).toBe('בוטל 01/05/2026 · הלקוח ביטל')
  })
})

describe('projectAmount — מגן על מלכודת-ה"0 ₪" (S-2)', () => {
  it('🔴 quotes=null (אין הצעה, או RLS חוסם) ⇒ null — לא 0 מחושב על lines ריקות', () => {
    // זו בדיוק המוטציה שהייתה עוברת בשקט: deriveQuoteAmount(null, 18) עצמה מחזירה total=0
    // (lines=[] ⇒ סכום-ביניים 0), ורק העטיפה הזו מונעת מ"0 ₪" להיראות על המסך כעובדה.
    expect(projectAmount(p({ quotes: null }), 18)).toBeNull()
  })

  it('quotes קיים ⇒ מחושב דרך deriveQuoteAmount (SSOT), אותם מספרים כמו מדיטק', () => {
    const withQuote = p({
      quotes: {
        applied_customer_discount: '5.00',
        manual_discount: '0.00',
        vat_rate_snapshot: '18.00',
        quote_services: [{ qty: 1, closing_unit_price: '8800.00' }],
      },
    })
    expect(projectAmount(withQuote, 18)).toBe(9864.8)
  })
})

describe('matchesProjectSearch — חיפוש-הטבלה (⑦), בלי אורך-מינימום', () => {
  it('התאמה סלחנית, לא-רגישת-רישיות, על שם-האירוע בלבד', () => {
    expect(matchesProjectSearch(p({ event_name: 'כנס לקוחות שנתי' }), 'לקוחות')).toBe(true)
    expect(matchesProjectSearch(p({ event_name: 'Conference 2026' }), 'conf')).toBe(true)
    expect(matchesProjectSearch(p({ event_name: 'כנס לקוחות שנתי' }), 'תערוכה')).toBe(false)
  })

  it('טקסט ריק/רווחים = מחזיר הכול (= בלי סינון)', () => {
    expect(matchesProjectSearch(p(), '')).toBe(true)
    expect(matchesProjectSearch(p(), '   ')).toBe(true)
    expect(matchesProjectSearch(p(), undefined)).toBe(true)
  })
})
