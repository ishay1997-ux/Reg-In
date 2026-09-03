import { describe, it, expect } from 'vitest'
import {
  deriveCalendarColor,
  colorProjects,
  kpiCards,
  MASKED_TEXT,
  attentionRows,
  attentionSummary,
  attentionAllLabel,
  monthStartOf,
  shiftMonth,
  hebrewMonthTitle,
  monthGridCells,
  projectsByDate,
  filterCalendarProjects,
  colorCounts,
} from '@/lib/dashboard'

const TODAY = '2026-09-03'

// ── deriveCalendarColor / colorProjects (§7.94) ──────────────────────────────

describe('deriveCalendarColor — הזוג הראשי: חוסר = staffingIncomplete OR logisticsIncomplete', () => {
  const farFromToday = {
    project_id: 1,
    project_status: 'in_progress',
    final_event_date: '2026-12-01', // 89 ימים מהיום — מעבר לכל warningDays סביר
  }

  it('איוש מלא + לוגיסטיקה חסרה ⇒ חוסר (רחוק ⇒ צהוב)', () => {
    const project = {
      ...farFromToday,
      required_hostess_count: 5,
      hostesses_confirmed: 5,
      logistics_ready: 1,
      logistics_total: 3,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('yellow')
  })

  it('איוש חסר + לוגיסטיקה מלאה ⇒ חוסר (רחוק ⇒ צהוב)', () => {
    const project = {
      ...farFromToday,
      required_hostess_count: 5,
      hostesses_confirmed: 2,
      logistics_ready: 3,
      logistics_total: 3,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('yellow')
  })

  it('שני המדדים מלאים ⇒ ירוק', () => {
    const project = {
      ...farFromToday,
      required_hostess_count: 5,
      hostesses_confirmed: 5,
      logistics_ready: 3,
      logistics_total: 3,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('green')
  })

  it('logistics_total=0 נחשב הושלם (אירוע בלי פריטי-לוגיסטיקה אינו "0% מוכן")', () => {
    const project = {
      ...farFromToday,
      required_hostess_count: 4,
      hostesses_confirmed: 4,
      logistics_ready: 0,
      logistics_total: 0,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('green')
  })
})

describe('deriveCalendarColor — גבול 14 הימים ו-warningDays חסר', () => {
  // איוש חסר קבוע (2/4) לכל המקרים — רק התאריך/הסף משתנים.
  const shortageBase = {
    project_id: 2,
    project_status: 'in_progress',
    required_hostess_count: 4,
    hostesses_confirmed: 2,
    logistics_ready: 3,
    logistics_total: 3,
  }

  it.each([
    ['2026-09-16', 13, 'red'],
    ['2026-09-17', 14, 'red'],
    ['2026-09-18', 15, 'yellow'],
  ])('בעוד %i ימים (%s) עם warningDays=14 ⇒ %s', (date, _daysAway, expected) => {
    const project = { ...shortageBase, final_event_date: date }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe(expected)
  })

  it('אירוע שעבר (-2 ימים) ועדיין פעיל, עם חוסר ⇒ אדום (עבר נחשב "בתוך")', () => {
    const project = { ...shortageBase, final_event_date: '2026-09-01' }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('red')
  })

  it('warningDays חסר (null) ⇒ חוסר תמיד צהוב, לעולם לא אדום — גם אירוע מחר', () => {
    const project = { ...shortageBase, final_event_date: '2026-09-04' }
    expect(deriveCalendarColor(project, TODAY, null)).toBe('yellow')
  })
})

describe('deriveCalendarColor — סטטוס לא-פעיל ⇒ ירוק תמיד, גם עם חוסר עצום', () => {
  const hugeGap = {
    project_id: 3,
    required_hostess_count: 10,
    hostesses_confirmed: 0,
    logistics_ready: 0,
    logistics_total: 5,
    final_event_date: '2026-09-04', // מחר — היה אדום אילו הסטטוס היה פעיל
  }

  it.each(['event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished'])(
    'סטטוס "%s" ⇒ ירוק בלי קשר למונים',
    (status) => {
      expect(deriveCalendarColor({ ...hugeGap, project_status: status }, TODAY, 14)).toBe('green')
    },
  )
})

describe('deriveCalendarColor — מבוטל: צבע רביעי משלו, לא ירוק (הכרעת-ישי 03/09/2026)', () => {
  it('מבוטל עם חוסר-איוש עצום ואירוע בעוד 3 ימים ⇒ "cancelled", לא "red"', () => {
    const project = {
      project_id: 9,
      project_status: 'cancelled',
      final_event_date: '2026-09-06', // בעוד 3 ימים — היה אדום אילו הסטטוס היה פעיל
      required_hostess_count: 10,
      hostesses_confirmed: 0,
      logistics_ready: 0,
      logistics_total: 5,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('cancelled')
  })

  it('מבוטל בלי חוסר בכלל — גם אז "cancelled", לא "green"', () => {
    const project = {
      project_id: 10,
      project_status: 'cancelled',
      final_event_date: '2026-09-06',
      required_hostess_count: 2,
      hostesses_confirmed: 2,
      logistics_ready: 1,
      logistics_total: 1,
    }
    expect(deriveCalendarColor(project, TODAY, 14)).toBe('cancelled')
  })
})

describe('colorProjects — טהורה, מוסיפה color בלי לגעת במקור', () => {
  it('מוסיפה color לכל שורה ולא נוגעת באובייקטים המקוריים', () => {
    const projects = [
      {
        project_id: 1,
        project_status: 'in_progress',
        final_event_date: '2026-09-04',
        required_hostess_count: 3,
        hostesses_confirmed: 0,
        logistics_ready: 0,
        logistics_total: 0,
      },
      {
        project_id: 2,
        project_status: 'finished',
        final_event_date: '2026-09-04',
        required_hostess_count: 3,
        hostesses_confirmed: 0,
        logistics_ready: 0,
        logistics_total: 0,
      },
    ]
    const result = colorProjects(projects, TODAY, 14)
    expect(result.map((p) => p.color)).toEqual(['red', 'green'])
    expect(projects[0].color).toBeUndefined()
  })
})

// ── kpiCards (§7.95 · §7.96 · §7.97) ─────────────────────────────────────────

describe('kpiCards — masked / no-data / value, לעולם לא null⇒0', () => {
  it('MASKED_TEXT הוא הנוסח המדויק מהמוקאפ', () => {
    expect(MASKED_TEXT).toBe('לא זמין בתפקידך')
  })

  it('רווח: profit_visible=false ⇒ ממוסך, amount:null גם אם ערך דלף מהשרת', () => {
    const cards = kpiCards({ profit_visible: false, monthly_profit: 118000 })
    const profit = cards.find((c) => c.key === 'profit')
    expect(profit).toMatchObject({ masked: true, amount: null })
  })

  it('רווח: profit_visible=true, monthly_profit=null ⇒ לא ממוסך, "אין נתון" (לא 0)', () => {
    const cards = kpiCards({ profit_visible: true, monthly_profit: null })
    const profit = cards.find((c) => c.key === 'profit')
    expect(profit).toMatchObject({ masked: false, amount: null })
  })

  it('רווח: profit_visible=true עם ערך ⇒ הערך מוצג כלשונו', () => {
    const cards = kpiCards({ profit_visible: true, monthly_profit: 52500.5 })
    const profit = cards.find((c) => c.key === 'profit')
    expect(profit).toMatchObject({ masked: false, amount: 52500.5 })
  })

  it('הצעות: quotes_visible=false ⇒ ממוסך, value:null', () => {
    const cards = kpiCards({ quotes_visible: false, pending_quotes_count: 9 })
    const quotes = cards.find((c) => c.key === 'quotes')
    expect(quotes).toMatchObject({ masked: true, value: null })
  })

  it('הצעות: quotes_visible=true עם 0 ⇒ value:0, לא null (אפס אמיתי, לא "לא נטען")', () => {
    const cards = kpiCards({ quotes_visible: true, pending_quotes_count: 0 })
    const quotes = cards.find((c) => c.key === 'quotes')
    expect(quotes).toMatchObject({ masked: false, value: 0 })
  })

  it('הצעות: quotes_visible=true עם ערך ⇒ הערך מוצג', () => {
    const cards = kpiCards({ quotes_visible: true, pending_quotes_count: 9 })
    const quotes = cards.find((c) => c.key === 'quotes')
    expect(quotes).toMatchObject({ masked: false, value: 9 })
  })

  it('שביעות-רצון: אין ממוצע ⇒ value:null, בלי שורת-משנה', () => {
    const cards = kpiCards({ satisfaction_avg: null, satisfaction_count: 0 })
    const sat = cards.find((c) => c.key === 'satisfaction')
    expect(sat.value).toBeNull()
    expect(sat.sub).toBeUndefined()
  })

  it('שביעות-רצון: משוב יחיד ⇒ עשרוני אחד + לשון-יחיד', () => {
    const cards = kpiCards({ satisfaction_avg: 4.3, satisfaction_count: 1 })
    const sat = cards.find((c) => c.key === 'satisfaction')
    expect(sat).toMatchObject({ value: '4.3', suffix: '/5', sub: 'על סמך משוב אחד' })
  })

  it('שביעות-רצון: כמה משובים, עיגול לעשרוני אחד + לשון-רבים', () => {
    const cards = kpiCards({ satisfaction_avg: 4.278, satisfaction_count: 5 })
    const sat = cards.find((c) => c.key === 'satisfaction')
    expect(sat).toMatchObject({ value: '4.3', sub: 'על סמך 5 משובים' })
  })

  // 🔴 שונה 03/09/2026 (אודיט-הסגירה, T-1): קודם נדרש כאן `0` כשלא-נטען. זה היה שקר שקט —
  // "לא ידוע" הוצג כעובדה "אפס פרויקטים פעילים" על מסך ששלושת האריחים האחרים בו מציגים `—`.
  // השער הרועש (`assertDashboardShape`) הוא הערובה שזה לא יקרה; הכרטיס מדווח `null` ביושר.
  it('פרויקטים פעילים: המספר כמו-שהוא, ו-null נשאר null (לא 0 — "לא ידוע" אינו עובדה)', () => {
    expect(kpiCards({ active_projects_count: 17 }).find((c) => c.key === 'active').value).toBe(17)
    expect(kpiCards({ active_projects_count: null }).find((c) => c.key === 'active').value).toBe(
      null,
    )
  })
})

// ── attentionRows — סדר, סינון-null, ניסוחי-קצה ─────────────────────────────

describe('attentionRows — סדר בין שלושת הענפים ובתוך כל ענף', () => {
  const summary = {
    today: TODAY,
    params: {
      quote_validity_days: '30',
      quote_expiring_soon_days: '7',
      event_warning_days: '14',
    },
    projects: [
      // (א) הסתיים ולא חויב — שני פרויקטים, ותיק-יותר צריך להופיע ראשון.
      {
        project_id: 101,
        event_name: 'פסטיבל קיץ עירוני',
        customer_name: 'עיריית העיר',
        final_event_date: '2026-08-26', // 8 ימים לפני TODAY
        project_status: 'event_finished',
        required_hostess_count: 6,
        hostesses_confirmed: 6,
        assignments_row_count: 9,
        logistics_ready: 2,
        logistics_total: 2,
      },
      {
        project_id: 102,
        event_name: 'השקת מוצר — סייברארק',
        customer_name: 'סייברארק',
        final_event_date: '2026-09-01', // 2 ימים לפני TODAY
        project_status: 'awaiting_invoice',
        required_hostess_count: 4,
        hostesses_confirmed: 4,
        assignments_row_count: 6,
        logistics_ready: 1,
        logistics_total: 1,
      },
      // (ב) חוסר וקרוב — שניים, הקרוב-יותר קודם. אחד חוסר-איוש, אחד חוסר-לוגיסטיקה.
      {
        project_id: 103,
        event_name: 'כנס לקוחות שנתי',
        customer_name: 'מדיטק',
        final_event_date: '2026-09-17', // 14 ימים — גבול-הסף בדיוק
        project_status: 'in_progress',
        required_hostess_count: 6,
        hostesses_confirmed: 0,
        assignments_row_count: 0,
        logistics_ready: 2,
        logistics_total: 2,
      },
      {
        project_id: 104,
        event_name: 'כנס פתיחת שנה',
        customer_name: 'וואטסאפ',
        final_event_date: '2026-09-08', // 5 ימים — קרוב יותר מ-103
        project_status: 'ready',
        required_hostess_count: 3,
        hostesses_confirmed: 3, // איוש מלא — החוסר הוא בלוגיסטיקה בלבד
        assignments_row_count: 5,
        logistics_ready: 1,
        logistics_total: 3,
      },
      // מחוץ לחלון (32 ימים) — לא אמור להופיע כלל.
      {
        project_id: 105,
        event_name: 'אירוע רחוק מדי',
        customer_name: 'לקוח כלשהו',
        final_event_date: '2026-10-05',
        project_status: 'not_started',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        assignments_row_count: 0,
        logistics_ready: 0,
        logistics_total: 0,
      },
      // מאויש-ומוכן לגמרי — לא אמור להופיע כלל.
      {
        project_id: 106,
        event_name: 'אירוע מאוייש לגמרי',
        customer_name: 'לקוח שקט',
        final_event_date: '2026-09-05',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 2,
        assignments_row_count: 3,
        logistics_ready: 4,
        logistics_total: 4,
      },
      // מבוטל עם חוסר-איוש עצום ואירוע קרוב — נשאר בלוח (03/09/2026) אבל לעולם לא
      // בפס "מה דורש טיפול": אין מה לטפל בו באירוע שלא יתקיים.
      {
        project_id: 107,
        event_name: 'אירוע שבוטל',
        customer_name: 'לקוח שהתחרט',
        final_event_date: '2026-09-06',
        project_status: 'cancelled',
        required_hostess_count: 10,
        hostesses_confirmed: 0,
        assignments_row_count: 0,
        logistics_ready: 0,
        logistics_total: 5,
      },
    ],
    pending_quotes: [
      {
        // updated_at + 30 יום נופל 3 ימים אחרי TODAY ⇒ פג-בקרוב (סף 7).
        quote_id: 41,
        event_name: 'כנס היי-טק',
        customer_name: 'הייטק גרופ',
        updated_at: '2026-08-07T09:00:00+00:00',
        estimated_event_date: '2026-10-01',
      },
      {
        // מעודכן היום — התוקף רחוק (30 יום), לא פג-בקרוב.
        quote_id: 55,
        event_name: 'ערב גיבוש',
        customer_name: 'נגה',
        updated_at: '2026-09-03T09:00:00+00:00',
        estimated_event_date: '2026-11-01',
      },
    ],
  }

  it('הסדר המלא: הסתיים-ולא-חויב (ותיק→חדש) → חוסר-וקרוב (קרוב→רחוק) → הצעה-פגה', () => {
    const rows = attentionRows(summary, TODAY)
    expect(rows.map((r) => r.title)).toEqual([
      'פסטיבל קיץ עירוני',
      'השקת מוצר — סייברארק',
      'כנס פתיחת שנה',
      'כנס לקוחות שנתי',
      'הצעה #41',
    ])
    expect(rows.map((r) => r.kind)).toEqual([
      'unbilled',
      'unbilled',
      'shortage',
      'shortage',
      'quote',
    ])
  })

  it('why/tone/href מדויקים לכל שורה — הנוסחים מהמוקאפ המאושר', () => {
    const rows = attentionRows(summary, TODAY)
    expect(rows[0]).toMatchObject({
      tone: 'red',
      why: 'הסתיים לפני 8 ימים, לא חויב',
      href: '/projects/101',
    })
    expect(rows[1]).toMatchObject({ tone: 'red', why: 'הסתיים לפני 2 ימים, לא חויב' })
    expect(rows[2]).toMatchObject({
      tone: 'yellow',
      why: 'לוגיסטיקה 1/3, 8 בחודש',
      href: '/projects/104',
    })
    expect(rows[3]).toMatchObject({
      tone: 'yellow',
      why: '0/6 דיילות, 17 בחודש',
      href: '/projects/103',
    })
    expect(rows[4]).toMatchObject({
      tone: 'yellow',
      why: 'פגה בעוד 3 ימים',
      href: '/quotes/41/edit',
    })
  })

  it('מבוטל (107) אף פעם לא בפס "מה דורש טיפול" — לא unbilled ולא shortage', () => {
    const rows = attentionRows(summary, TODAY)
    expect(rows.some((r) => r.title === 'אירוע שבוטל')).toBe(false)
    expect(rows.every((r) => r.href !== '/projects/107')).toBe(true)
  })

  it('pending_quotes===null ⇒ מדלגים על ענף ההצעות לגמרי, בלי שגיאה', () => {
    const rows = attentionRows({ ...summary, pending_quotes: null }, TODAY)
    expect(rows.some((r) => r.kind === 'quote')).toBe(false)
    expect(rows).toHaveLength(4)
  })

  it('todayIso לא נמסר ⇒ נופלים ל-summary.today', () => {
    const rows = attentionRows(summary) // בלי הפרמטר השני
    expect(rows[0].title).toBe('פסטיבל קיץ עירוני')
  })

  it('event_warning_days חסר ⇒ אין שורות-חוסר בכלל (בלי ברירת-מחדל מומצאת)', () => {
    const rows = attentionRows({
      ...summary,
      params: { ...summary.params, event_warning_days: null },
    })
    expect(rows.some((r) => r.kind === 'shortage')).toBe(false)
    expect(rows.some((r) => r.kind === 'unbilled')).toBe(true) // ענפים אחרים לא מושפעים
  })
})

describe('attentionRows — ענף-החוסר יושר מול צבע-הלוח (03/09/2026): עבר-ועדיין-פעיל נכלל', () => {
  it('פרויקט פעיל עם חוסר שהאירוע שלו כבר עבר (-5 ימים) ⇒ מופיע (הכי דחוף, לא מוחרג)', () => {
    const summary = {
      params: { event_warning_days: '14' },
      projects: [
        {
          project_id: 201,
          event_name: 'אירוע שעבר ועדיין פעיל',
          final_event_date: '2026-08-29', // 5 ימים לפני TODAY
          project_status: 'in_progress',
          required_hostess_count: 4,
          hostesses_confirmed: 1,
          logistics_ready: 2,
          logistics_total: 2,
        },
      ],
    }
    const rows = attentionRows(summary, TODAY)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      kind: 'shortage',
      tone: 'yellow',
      title: 'אירוע שעבר ועדיין פעיל',
      why: '1/4 דיילות, 29 בחודש',
    })
  })
})

describe('attentionRows — ניסוחי-קצה: יום בודד', () => {
  it('הסתיים אתמול (יום אחד) ⇒ לשון-יחיד', () => {
    const summary = {
      params: { event_warning_days: '14' },
      projects: [
        {
          project_id: 1,
          event_name: 'אירוע-אתמול',
          final_event_date: '2026-09-02',
          project_status: 'event_finished',
          required_hostess_count: 1,
          hostesses_confirmed: 1,
          logistics_ready: 0,
          logistics_total: 0,
        },
      ],
    }
    expect(attentionRows(summary, TODAY)[0].why).toBe('הסתיים אתמול, לא חויב')
  })

  it('הצעה פגה היום (0) והצעה פגה מחר (1) — שני הניסוחים המיוחדים', () => {
    const summary = {
      params: { quote_validity_days: '30', quote_expiring_soon_days: '7' },
      projects: [],
      pending_quotes: [
        { quote_id: 70, event_name: 'א', updated_at: '2026-08-04T00:00:00+00:00' }, // daysLeft=0
        { quote_id: 71, event_name: 'ב', updated_at: '2026-08-05T00:00:00+00:00' }, // daysLeft=1
      ],
    }
    const rows = attentionRows(summary, TODAY)
    expect(rows.find((r) => r.title === 'הצעה #70').why).toBe('פגה היום')
    expect(rows.find((r) => r.title === 'הצעה #71').why).toBe('פגה מחר')
  })
})

// ── attentionSummary / attentionAllLabel — תיקרה, לא סינון ─────────────────
// (הכרעת-ישי 03/09/2026 19:3X, "זה מעולה" על ההמלצה: הפאנל מוגבל, לא מסונן ולא מעומד.)

describe('attentionSummary — תיקרה על 12 שורות (5 unbilled + 5 shortage + 2 quote)', () => {
  const bigSummary = {
    today: TODAY,
    params: {
      event_warning_days: '14',
      quote_validity_days: '30',
      quote_expiring_soon_days: '7',
    },
    projects: [
      // (א) חמישה "הסתיים ולא חויב" — ותיק-לחדש, כל תאריך בעבר.
      {
        project_id: 301,
        event_name: 'הסתיים 1',
        final_event_date: '2026-08-29',
        project_status: 'event_finished',
        required_hostess_count: 1,
        hostesses_confirmed: 1,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 302,
        event_name: 'הסתיים 2',
        final_event_date: '2026-08-30',
        project_status: 'event_finished',
        required_hostess_count: 1,
        hostesses_confirmed: 1,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 303,
        event_name: 'הסתיים 3',
        final_event_date: '2026-08-31',
        project_status: 'event_finished',
        required_hostess_count: 1,
        hostesses_confirmed: 1,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 304,
        event_name: 'הסתיים 4',
        final_event_date: '2026-09-01',
        project_status: 'event_finished',
        required_hostess_count: 1,
        hostesses_confirmed: 1,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 305,
        event_name: 'הסתיים 5',
        final_event_date: '2026-09-02',
        project_status: 'event_finished',
        required_hostess_count: 1,
        hostesses_confirmed: 1,
        logistics_ready: 1,
        logistics_total: 1,
      },
      // (ב) חמישה "חוסר קרוב" — קרוב-לרחוק, כולם בתוך 14 יום.
      {
        project_id: 306,
        event_name: 'חוסר 1',
        final_event_date: '2026-09-04',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 307,
        event_name: 'חוסר 2',
        final_event_date: '2026-09-05',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 308,
        event_name: 'חוסר 3',
        final_event_date: '2026-09-06',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 309,
        event_name: 'חוסר 4',
        final_event_date: '2026-09-07',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        logistics_ready: 1,
        logistics_total: 1,
      },
      {
        project_id: 310,
        event_name: 'חוסר 5',
        final_event_date: '2026-09-08',
        project_status: 'in_progress',
        required_hostess_count: 2,
        hostesses_confirmed: 0,
        logistics_ready: 1,
        logistics_total: 1,
      },
    ],
    pending_quotes: [
      { quote_id: 70, event_name: 'הצעה א', updated_at: '2026-08-04T00:00:00+00:00' }, // daysLeft=0
      { quote_id: 71, event_name: 'הצעה ב', updated_at: '2026-08-05T00:00:00+00:00' }, // daysLeft=1
    ],
  }

  // 🔴 התיקרה ירדה 8 ⇒ 4 ב-04/09/2026, ובאותו יום נוסף **ייצוג-קבוצות** (הכרעת-ישי):
  // ‏4 מקומות ו-3 קבוצות ⇒ כל קבוצה מביאה את הדחוף-ביותר שבה, והמקום הרביעי הולך
  // לבא-בתור לפי סדר-הדחיפות (unbilled#2). בלי זה — 5 ה-unbilled היו בולעים הכול.
  it('12 שורות; cap=4 ⇒ כל קבוצה מיוצגת (2 חיוב · 1 חוסר · 1 הצעה), hidden=8, total=12', () => {
    const full = attentionRows(bigSummary, TODAY)
    expect(full).toHaveLength(12)
    const { rows, hidden, total } = attentionSummary(bigSummary, TODAY)
    expect(rows).toHaveLength(4)
    expect(rows.map((r) => r.kind)).toEqual(['unbilled', 'unbilled', 'shortage', 'quote'])
    // כל נציג הוא הראשון-בתור של הקבוצה שלו — כלומר הדחוף ביותר שבה.
    // (‏toEqual ולא toBe: attentionRows נקראת פעמיים ומחזירה אובייקטים שקולים, לא זהים.)
    expect(rows[0]).toEqual(full.find((r) => r.kind === 'unbilled'))
    expect(rows[2]).toEqual(full.find((r) => r.kind === 'shortage'))
    expect(rows[3]).toEqual(full.find((r) => r.kind === 'quote'))
    // הפלט שומר על סדר-הדחיפות המקורי, לא על סדר-הבחירה: הכותרות עולות באותו סדר
    // שבו הן מופיעות ב-full.
    const order = rows.map((r) => full.findIndex((f) => f.title === r.title && f.why === r.why))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(hidden).toBe(8)
    expect(total).toBe(12)
  })

  it('‏firstHidden הוא הראשון שנשאר בחוץ — ולא `all[cap]`, שאינו נכון עם ייצוג-קבוצות', () => {
    const full = attentionRows(bigSummary, TODAY)
    const { rows, firstHidden } = attentionSummary(bigSummary, TODAY)
    const shownTitles = new Set(rows.map((r) => r.title))
    expect(firstHidden).toEqual(full.find((r) => !shownTitles.has(r.title)))
    // 🔑 השומר: `all[cap]` **אינו** התשובה כאן — הוא היה נותן ליעד-הקישור שורה שמוצגת.
    expect(firstHidden.title).not.toBe(full[4].title)
  })

  it('קבוצה יחידה ⇒ התנהגות זהה ל-slice רגיל (אין למי לשמור מקום)', () => {
    const onlyUnbilled = {
      ...bigSummary,
      projects: bigSummary.projects.filter((p) => p.project_status === 'event_finished'),
      pending_quotes: [],
    }
    const full = attentionRows(onlyUnbilled, TODAY)
    const { rows } = attentionSummary(onlyUnbilled, TODAY)
    expect(rows).toEqual(full.slice(0, 4))
  })

  it('תקרה קטנה ממספר-הקבוצות (cap=2) ⇒ שתי הקבוצות הראשונות בקדימות, השלישית בחוץ', () => {
    const { rows } = attentionSummary(bigSummary, TODAY, 2)
    expect(rows.map((r) => r.kind)).toEqual(['unbilled', 'shortage'])
  })

  it('groups סופרים על הרשימה המלאה (12), לא על הארבע המוצגות', () => {
    const { groups } = attentionSummary(bigSummary, TODAY)
    expect(groups).toEqual([
      { kind: 'unbilled', label: 'הסתיים ולא חויב', count: 5 },
      { kind: 'shortage', label: 'חוסר קרוב', count: 5 },
      { kind: 'quote', label: 'הצעה שפגה בקרוב', count: 2 },
    ])
  })

  it('קבוצה בת-0 מדולגת: בלי פרויקטים פעילים ⇒ אין "חוסר קרוב" ברשימת הקבוצות', () => {
    const noShortage = {
      ...bigSummary,
      projects: bigSummary.projects.filter((p) => p.project_status === 'event_finished'),
    }
    const { groups } = attentionSummary(noShortage, TODAY)
    expect(groups.map((g) => g.kind)).toEqual(['unbilled', 'quote'])
  })

  it('cap מותאם-אישית (פרמטר שלישי): cap=3 מציג 3 שורות — אחת מכל קבוצה, hidden=9', () => {
    const { rows, hidden } = attentionSummary(bigSummary, TODAY, 3)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.kind)).toEqual(['unbilled', 'shortage', 'quote'])
    expect(hidden).toBe(9)
  })

  it('רשימה ריקה ⇒ rows/groups ריקים, hidden=0, firstHidden=null, total=0', () => {
    const empty = attentionSummary({ today: TODAY, projects: [], pending_quotes: [] }, TODAY)
    expect(empty).toEqual({ rows: [], hidden: 0, firstHidden: null, groups: [], total: 0 })
  })
})

describe('attentionAllLabel', () => {
  it('0 ⇒ מחרוזת ריקה (בלי קישור)', () => {
    expect(attentionAllLabel(0)).toBe('')
  })

  it('1 ⇒ לשון-יחיד ("כל 1 הפריטים" הייתה עברית שבורה)', () => {
    expect(attentionAllLabel(1)).toBe('פריט אחד ←')
  })

  it('2 ומעלה ⇒ המספר הכולל, לא המוסתר — "כמה יש לטפל" ולא "כמה הוסתרו"', () => {
    expect(attentionAllLabel(21)).toBe('כל 21 הפריטים ←')
  })
})

// ── לוח-החודש ─────────────────────────────────────────────────────────────

describe('monthStartOf / shiftMonth / hebrewMonthTitle', () => {
  it('monthStartOf חותך לתחילת-החודש', () => {
    expect(monthStartOf('2026-09-17')).toBe('2026-09-01')
  })

  it('shiftMonth חוצה שנה קדימה (דצמבר→ינואר)', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01')
  })

  it('shiftMonth חוצה שנה אחורה (ינואר→דצמבר)', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01')
  })

  it('hebrewMonthTitle — השם המדויק מהמוקאפ המאושר', () => {
    expect(hebrewMonthTitle('2026-09-01')).toBe('ספטמבר 2026')
    expect(hebrewMonthTitle('2026-01-01')).toBe('ינואר 2026')
  })
})

describe('monthGridCells', () => {
  it('ספטמבר 2026 מתחיל ביום שלישי (אינדקס 2) ובו 30 ימים', () => {
    const cells = monthGridCells('2026-09-01')
    expect(cells[0]).toEqual({ date: null, day: null, inMonth: false })
    expect(cells[1]).toEqual({ date: null, day: null, inMonth: false })
    expect(cells[2]).toEqual({ date: '2026-09-01', day: 1, inMonth: true })
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('חודש שמתחיל ביום ראשון — בלי תאים ריקים מובילים (ינואר 2023, ✓ יום ראשון)', () => {
    const cells = monthGridCells('2023-01-01')
    expect(cells[0]).toEqual({ date: '2023-01-01', day: 1, inMonth: true })
  })

  it('הרשת תמיד שלמת-שבועות (מכפלה של 7)', () => {
    expect(monthGridCells('2026-09-01').length % 7).toBe(0)
  })
})

// ── projectsByDate / filterCalendarProjects / colorCounts ───────────────────

describe('projectsByDate', () => {
  it('מקבצת לפי תאריך בתוך החודש, כולל מבוטל (03/09/2026 — נשאר בלוח כמו Monday), ומדלגת רק על חודש אחר', () => {
    const projects = [
      { project_id: 1, final_event_date: '2026-09-05', project_status: 'in_progress' },
      { project_id: 2, final_event_date: '2026-09-05', project_status: 'ready' },
      { project_id: 3, final_event_date: '2026-09-06', project_status: 'cancelled' },
      { project_id: 4, final_event_date: '2026-10-01', project_status: 'in_progress' },
    ]
    const byDate = projectsByDate(projects, '2026-09-01')
    expect(Object.keys(byDate).sort()).toEqual(['2026-09-05', '2026-09-06'])
    expect(byDate['2026-09-05'].map((p) => p.project_id)).toEqual([1, 2])
    expect(byDate['2026-09-06'].map((p) => p.project_id)).toEqual([3])
  })
})

describe('filterCalendarProjects', () => {
  const projects = [
    { project_id: 1, event_name: 'כנס אדום', customer_name: 'לקוח א', color: 'red' },
    { project_id: 2, event_name: 'כנס צהוב', customer_name: 'לקוח ב', color: 'yellow' },
    { project_id: 3, event_name: 'כנס ירוק', customer_name: 'לקוח ג', color: 'green' },
    { project_id: 4, event_name: 'כנס מבוטל', customer_name: 'לקוח ד', color: 'cancelled' },
  ]

  it('צ׳יפ-צבעים מסנן לפי חברות-בקבוצה', () => {
    const result = filterCalendarProjects(projects, { colors: new Set(['red', 'yellow']) })
    expect(result.map((p) => p.project_id)).toEqual([1, 2])
  })

  it('cancelled הוא צבע-צ׳יפ רביעי לכל דבר — ברירת-מחדל-ארבעתם-דלוקים כוללת אותו', () => {
    const result = filterCalendarProjects(projects, {
      colors: new Set(['red', 'yellow', 'green', 'cancelled']),
    })
    expect(result).toHaveLength(4)
  })

  it('כיבוי הצ׳יפ cancelled מסתיר רק אותו', () => {
    const result = filterCalendarProjects(projects, {
      colors: new Set(['red', 'yellow', 'green']),
    })
    expect(result.map((p) => p.project_id)).toEqual([1, 2, 3])
  })

  it('חיפוש-טקסט מתעלם מרישיות/רווחים ובודק שם-אירוע או שם-לקוח', () => {
    const result = filterCalendarProjects(projects, { query: '  לקוח ב  ' })
    expect(result.map((p) => p.project_id)).toEqual([2])
  })

  it('שאילתה ריקה ⇒ בלי סינון-טקסט כלל', () => {
    const result = filterCalendarProjects(projects, { query: '' })
    expect(result).toHaveLength(4)
  })

  it('בלי colors כלל ⇒ בלי סינון-צבע כלל', () => {
    const result = filterCalendarProjects(projects, {})
    expect(result).toHaveLength(4)
  })
})

describe('colorCounts', () => {
  it('סופרת כל צבע בנפרד, כולל cancelled — נתונים לא-אחידים', () => {
    const projects = [
      { color: 'red' },
      { color: 'red' },
      { color: 'yellow' },
      { color: 'green' },
      { color: 'cancelled' },
      { color: 'cancelled' },
      { color: 'cancelled' },
    ]
    expect(colorCounts(projects)).toEqual({ red: 2, yellow: 1, green: 1, cancelled: 3 })
  })

  it('רשימה ריקה ⇒ אפסים לארבעת הצבעים, לא קריסה', () => {
    expect(colorCounts([])).toEqual({ red: 0, yellow: 0, green: 0, cancelled: 0 })
  })
})
