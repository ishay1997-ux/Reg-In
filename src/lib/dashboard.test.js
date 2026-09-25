import { describe, it, expect } from 'vitest'
import {
  deriveCalendarColor,
  calendarColorMeta,
  isWithinWarningWindow,
  staffingRatioLabel,
  logisticsRatioLabel,
  colorProjects,
  kpiCards,
  MASKED_TEXT,
  attentionRows,
  attentionCategories,
  monthStartOf,
  shiftMonth,
  hebrewMonthTitle,
  monthGridCells,
  projectsByDate,
  filterCalendarProjects,
  colorCounts,
} from '@/lib/dashboard'
import { PROJECT_STATUS_LABELS } from '@/lib/projects'

const TODAY = '2026-09-03'

// ── deriveCalendarColor / colorProjects (§7.94) ──────────────────────────────

// ✏️ **16/09/2026 — הבדיקות של "גבול 14 הימים" נמחקו במודע, לא התיישנו מאליהן.**
// הן היו ההוכחה הנעולה של §7.94 בנוסחו הישן (13/14 ⇒ אדום · 15 ⇒ צהוב). מרגע
// ש-`deriveCalendarColor` מפסיקה לתלות בשעון, אין להן מה להוכיח — והמחיקה נרשמת כאן
// כדי שלא תיקרא בסקירה הבאה כאובדן-כיסוי שקט. במקומן: טבלת-מיפוי מלאה + השומר
// שהפונקציה **אינה זזה** כשמזיזים את היום.
describe('deriveCalendarColor — הצבע הוא הסטטוס, מיפוי מלא', () => {
  const base = {
    project_id: 1,
    final_event_date: '2026-12-01',
    required_hostess_count: 5,
    hostesses_confirmed: 2,
    logistics_ready: 1,
    logistics_total: 3,
  }

  it.each([
    ['not_started', 'not_started'],
    ['in_progress', 'in_progress'],
    ['ready', 'ready'],
    ['event_finished', 'past'],
    ['awaiting_invoice', 'past'],
    ['awaiting_payment', 'past'],
    ['finished', 'past'],
    ['cancelled', 'cancelled'],
  ])('סטטוס "%s" ⇒ צבע "%s"', (status, expected) => {
    expect(deriveCalendarColor({ ...base, project_status: status })).toBe(expected)
  })

  it('חמישה צבעים בלבד — שלושת מצבי-הציר-הפעיל, past ו-cancelled', () => {
    const all = [
      'not_started',
      'in_progress',
      'ready',
      'event_finished',
      'awaiting_invoice',
      'awaiting_payment',
      'finished',
      'cancelled',
    ].map((project_status) => deriveCalendarColor({ ...base, project_status }))
    expect(new Set(all)).toEqual(
      new Set(['not_started', 'in_progress', 'ready', 'past', 'cancelled']),
    )
  })

  // 🔴 **השומר של השינוי כולו.** הכלל הישן היה פונקציה של השעון, ולכן אותו אירוע
  // בדיוק שינה צבע בלי שאיש נגע בו. כאן: אותו פרויקט, שלושה "היום" שונים — ואם
  // מישהו יחזיר תלות בזמן, הבדיקה הזו נופלת.
  it('הצבע אינו משתנה כשמזיזים את "היום" או את סף-האזהרה', () => {
    const project = { ...base, project_status: 'in_progress', final_event_date: '2026-09-17' }
    const color = deriveCalendarColor(project)
    expect(color).toBe('in_progress')
    expect(deriveCalendarColor(project, '2026-09-16', 14)).toBe(color)
    expect(deriveCalendarColor(project, '2026-12-31', 0)).toBe(color)
    expect(deriveCalendarColor(project, TODAY, null)).toBe(color)
  })

  // המונים אינם משתתפים יותר בהחלטה — הם חיים באייקוני-הצ'יפ וברצועה בלבד.
  it('שני הממדים מלאים או ריקים — הצבע עדיין הסטטוס, לא המונים', () => {
    const full = {
      ...base,
      project_status: 'in_progress',
      hostesses_confirmed: 5,
      logistics_ready: 3,
    }
    const empty = { ...base, project_status: 'ready', hostesses_confirmed: 0, logistics_ready: 0 }
    expect(deriveCalendarColor(full)).toBe('in_progress')
    expect(deriveCalendarColor(empty)).toBe('ready')
  })
})

describe('isWithinWarningWindow — הקרבה עברה לתא-היום', () => {
  it.each([
    ['2026-09-03', true],
    ['2026-09-16', true],
    ['2026-09-17', true],
    ['2026-09-18', false],
  ])('תאריך %s עם סף 14 ⇒ %s', (date, expected) => {
    expect(isWithinWarningWindow(date, TODAY, 14)).toBe(expected)
  })

  it('יום שעבר אינו בחלון — "בעוד כמה ימים" ולא "לפני"', () => {
    expect(isWithinWarningWindow('2026-09-01', TODAY, 14)).toBe(false)
  })

  it('סף לא-נטען ⇒ שום יום אינו מסומן, בלי ברירת-מחדל מומצאת', () => {
    expect(isWithinWarningWindow('2026-09-04', TODAY, null)).toBe(false)
  })
})

// 🆕 R3 09/09/2026 (הכרעת-ישי): היה "ירוק תמיד" — הפך ל-`'past'`, צבע חמישי משלו.
// העוגן: "טקס פרסים" 01/09 (סטטוס "ממתין לסגירה"=event_finished) הוצג ירוק עם
// אייקוני-מוכנות מלאים, זהה לאירוע-מוכן עתידי, בזמן שהרצועה מדווחת 17 כאלה שלא חויבו.
describe('deriveCalendarColor — מבוטל: צבע משלו, נבדק לפני הכול (הכרעת-ישי 03/09/2026)', () => {
  it('מבוטל בלי חוסר בכלל — עדיין "cancelled", לא "ready"', () => {
    const project = {
      project_id: 10,
      project_status: 'cancelled',
      final_event_date: '2026-09-06',
      required_hostess_count: 2,
      hostesses_confirmed: 2,
      logistics_ready: 1,
      logistics_total: 1,
    }
    expect(deriveCalendarColor(project)).toBe('cancelled')
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
    const result = colorProjects(projects)
    // 🆕 R3: סטטוס 'finished' (לא-פעיל, לא-מבוטל) ⇒ 'past'.
    expect(result.map((p) => p.color)).toEqual(['in_progress', 'past'])
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

  // 🆕 R2/R6 09/09/2026: הענף "shortage" מתפצל ל-`staffing`/`logistics` — קבוצה-קבועה
  // ולא עוד "קרוב-לרחוק" חוצה-ממדים; 103 (חוסר-איוש בלבד) נופל בקבוצת staffing,
  // 104 (חוסר-לוגיסטיקה בלבד) בקבוצת logistics, וסדר-הקבוצות קבוע (staffing→logistics)
  // בלי קשר לקרבת-התאריך בין שתי הקבוצות.
  it('הסדר המלא: הסתיים-ולא-חויב (ותיק→חדש) → חוסר-איוש → חוסר-לוגיסטיקה → הצעה-פגה', () => {
    const rows = attentionRows(summary, TODAY)
    expect(rows.map((r) => r.title)).toEqual([
      'פסטיבל קיץ עירוני',
      'השקת מוצר — סייברארק',
      'כנס לקוחות שנתי',
      'כנס פתיחת שנה',
      'הצעה #41',
    ])
    expect(rows.map((r) => r.kind)).toEqual([
      'unbilled',
      'unbilled',
      'staffing',
      'logistics',
      'quote',
    ])
  })

  it('why/tone/href מדויקים לכל שורה — הנוסחים מהמוקאפ המאושר, tone אדום ל-R2', () => {
    const rows = attentionRows(summary, TODAY)
    expect(rows[0]).toMatchObject({
      tone: 'red',
      why: 'הסתיים לפני 8 ימים, לא חויב',
      href: '/projects/101',
    })
    expect(rows[1]).toMatchObject({ tone: 'red', why: 'הסתיים לפני 2 ימים, לא חויב' })
    // R2: tone הפך מ-yellow ל-red — אותה הגדרת-חוסר-וקרוב בדיוק כמו הצבע האדום בלוח.
    expect(rows[2]).toMatchObject({
      tone: 'red',
      why: '0/6 דיילות, 17/09',
      href: '/projects/103',
    })
    expect(rows[3]).toMatchObject({
      tone: 'red',
      why: 'לוגיסטיקה 1/3, 08/09',
      href: '/projects/104',
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
    expect(rows.some((r) => r.kind === 'staffing' || r.kind === 'logistics')).toBe(false)
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
      kind: 'staffing',
      tone: 'red',
      title: 'אירוע שעבר ועדיין פעיל',
      // ✏️ 25/09/2026: יום/חודש מלא — "29 בחודש" תחת לוח של ספטמבר היה נקרא כ-29/09.
      why: '1/4 דיילות, 29/08',
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

// ── attentionCategories — ארבעה כרטיסי-מחלקה (R6 09/09/2026) ───────────────
// (הכרעת-ישי 09/09/2026 — תשובה ל"עם איזה מנהל לדבר": מחליף את attentionSummary/
// pickWithGroupRepresentation/ATTENTION_CAP/attentionAllLabel; הרשימה המשותפת-עם-
// תיקרה הפכה לארבעה כרטיסים קבועים, אחד לכל מחלקה.)

describe('attentionCategories — ארבעה כרטיסים קבועים (5 unbilled + 5 staffing + 0 logistics + 2 quote)', () => {
  const bigSummary = {
    today: TODAY,
    quotes_visible: true,
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

  it('ארבעה כרטיסים בסדר קבוע, עם המונה הנכון לכל אחד', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    expect(categories.map((c) => c.kind)).toEqual(['unbilled', 'staffing', 'logistics', 'quote'])
    expect(categories.map((c) => c.count)).toEqual([5, 5, 0, 2])
  })

  it('topLine הוא הפריט הדחוף ביותר בכל קטגוריה — שם + "למה", ואותו ניסוח כמו attentionRows', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    const byKind = Object.fromEntries(categories.map((c) => [c.kind, c]))
    expect(byKind.unbilled.topLine).toBe('הסתיים 1 — הסתיים לפני 5 ימים, לא חויב')
    expect(byKind.staffing.topLine).toBe('חוסר 1 — 0/2 דיילות, 04/09')
    expect(byKind.quote.topLine).toBe('הצעה #70 — פגה היום')
  })

  it('קטגוריה בת-0 (logistics): count=0, topLine=null — הכרטיס נשאר, לא נעלם', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    const logistics = categories.find((c) => c.kind === 'logistics')
    expect(logistics).toMatchObject({ count: 0, topLine: null, masked: false })
  })

  it('תפקיד/tone קבועים לכל כרטיס — התשובה ל"עם איזה מנהל לדבר"', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    expect(categories.map((c) => [c.kind, c.label, c.role, c.tone])).toEqual([
      ['unbilled', 'כספים', 'מנהלת כספים', 'red'],
      ['staffing', 'דיילות', 'מנהלת גיוס', 'red'],
      ['logistics', 'לוגיסטיקה', 'מנהלת לוגיסטיקה', 'red'],
      ['quote', 'הצעות', 'מנהלת פרויקטים', 'yellow'],
    ])
  })

  // 🔗 הכרעת-ישי 16/09: "מה שאתה רואה הוא מה שאתה לוחץ" — הכרטיס מוביל לפריט
  // שהוא נוקב בשמו ב-topLine, ולא למסך-המודול. כרטיס ריק נופל חזרה למודול.
  it('הקישור הוא של הפריט הדחוף שהכרטיס מציג; כרטיס ריק ⇒ כתובת-המודול', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    const byKind = Object.fromEntries(categories.map((c) => [c.kind, c]))
    // "הסתיים 1" הוא הוותיק מבין החמישה (29/08) ⇒ ראש-הרשימה, והקישור הוא שלו.
    expect(byKind.unbilled.topLine).toContain('הסתיים 1')
    expect(byKind.unbilled.href).toBe('/projects/301')
    // logistics ריק בתרחיש הזה (count=0) ⇒ אין פריט לנקוב בו
    expect(byKind.logistics.count).toBe(0)
    expect(byKind.logistics.href).toBe('/logistics')
  })

  // 🔴 המספר לעולם לא לבדו, והסייג נאמר על המסך: כרטיס-הגיוס סופר רק את מה
  // שבתוך חלון-האזהרה, ובלי שהחלון ייאמר המספר אינו חסר בראש הקורא אלא שגוי.
  it('שם-העצם נושא את מסנן-האוכלוסייה; ענף בלי חלון אינו ממציא אחד', () => {
    const categories = attentionCategories(bigSummary, TODAY)
    const byKind = Object.fromEntries(categories.map((c) => [c.kind, c]))
    expect(byKind.staffing.noun).toBe('אירועים חסרי דיילות ב-14 הימים הקרובים')
    expect(byKind.logistics.noun).toBe('אירועים חסרי ציוד ב-14 הימים הקרובים')
    expect(byKind.unbilled.noun).toBe('אירועים שהסתיימו ולא חויבו')
    expect(byKind.quote.noun).toBe('הצעות שפגות בקרוב')
  })

  it('סף-אזהרה לא-נטען ⇒ שם-העצם בלי סייג, בלי מספר מומצא', () => {
    const categories = attentionCategories(
      { ...bigSummary, params: { ...bigSummary.params, event_warning_days: null } },
      TODAY,
    )
    const staffing = categories.find((c) => c.kind === 'staffing')
    expect(staffing.noun).toBe('אירועים חסרי דיילות')
  })

  // ✏️ 25/09/2026 (הכרעת הסגן, סריקת-תחנות): המסך הציג "1 אירועים חסרי דיילות". ביום הכנס
  // תחנה 1 מראה בדיוק אירוע אחד (1615) ⇒ **אחד ⇒ יחיד**, ושניים ומעלה — רבים, כמו תמיד.
  it('אירוע אחד ⇒ שם-עצם ביחיד; שניים ⇒ רבים (והסייג של החלון נשאר)', () => {
    const short = (id, date) => ({
      project_id: id,
      event_name: `אירוע ${id}`,
      project_status: 'in_progress',
      final_event_date: date,
      required_hostess_count: 2,
      hostesses_confirmed: 1,
    })
    const summaryOf = (projects) => ({
      today: TODAY,
      projects,
      params: { event_warning_days: 14 },
      quotes_visible: false,
      pending_quotes: null,
    })
    const one = attentionCategories(summaryOf([short(1, '2026-09-10')]), TODAY)
    const staffingOne = one.find((c) => c.kind === 'staffing')
    expect(staffingOne.count).toBe(1)
    expect(staffingOne.noun).toBe('אירוע חסר דיילות ב-14 הימים הקרובים')

    const two = attentionCategories(
      summaryOf([short(1, '2026-09-10'), short(2, '2026-09-12')]),
      TODAY,
    )
    const staffingTwo = two.find((c) => c.kind === 'staffing')
    expect(staffingTwo.count).toBe(2)
    expect(staffingTwo.noun).toBe('אירועים חסרי דיילות ב-14 הימים הקרובים')
  })

  it('quotes_visible=false ⇒ כרטיס-ההצעות ממוסך (§7.97, MASKED_TEXT), לא "0"', () => {
    const categories = attentionCategories(
      { ...bigSummary, quotes_visible: false, pending_quotes: null },
      TODAY,
    )
    const quote = categories.find((c) => c.kind === 'quote')
    expect(quote).toMatchObject({ masked: true, count: null, topLine: null })
  })

  it('רשימה ריקה ⇒ ארבעה כרטיסים, כולם count=0 (או ממוסך אם quotes_visible חסר)', () => {
    const categories = attentionCategories(
      { today: TODAY, projects: [], pending_quotes: [] },
      TODAY,
    )
    expect(categories.map((c) => c.count)).toEqual([0, 0, 0, null])
    expect(categories.find((c) => c.kind === 'quote').masked).toBe(true)
  })
})

describe('calendarColorMeta — התוויות הן מונחי-הסטטוס מילה-במילה', () => {
  // 🔒 UC11+UC42: מונח אחד, שם אחד, בכל מקום. הבדיקה מצליבה מול המקור עצמו, כך
  // ששינוי-גלוסרי עתידי ב-PROJECT_STATUS_LABELS ייפול כאן אם הלוח לא ילך אחריו.
  it('שלושת מצבי-הציר-הפעיל זהים ל-PROJECT_STATUS_LABELS', () => {
    const meta = calendarColorMeta()
    expect(meta.ready.label).toBe(PROJECT_STATUS_LABELS.ready)
    expect(meta.in_progress.label).toBe(PROJECT_STATUS_LABELS.in_progress)
    expect(meta.not_started.label).toBe(PROJECT_STATUS_LABELS.not_started)
    expect(meta.ready.label).toBe('מוכן לביצוע')
  })

  it('past ו-cancelled: "התקיים" ו-"בוטל"', () => {
    const meta = calendarColorMeta()
    expect(meta.past.label).toBe('התקיים')
    expect(meta.cancelled.label).toBe('בוטל')
  })

  // ה-tooltip שהחזיק את ההגדרה נמחק: אין יותר מונח-שהמצאנו שדורש הסבר.
  it('אין יותר title על אף צבע', () => {
    const meta = calendarColorMeta()
    for (const entry of Object.values(meta)) expect(entry.title).toBeUndefined()
  })
})

describe('staffingRatioLabel / logisticsRatioLabel — כותרות-ריחוף על אייקוני-הצ׳יפ (R4)', () => {
  it('שני המספרים כלשונם מהפרויקט', () => {
    expect(staffingRatioLabel({ hostesses_confirmed: 2, required_hostess_count: 4 })).toBe(
      'איוש 2/4',
    )
    expect(logisticsRatioLabel({ logistics_ready: 0, logistics_total: 4 })).toBe('לוגיסטיקה 0/4')
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
    { project_id: 1, event_name: 'כנס טרם החל', customer_name: 'לקוח א', color: 'not_started' },
    { project_id: 2, event_name: 'כנס בתהליך', customer_name: 'לקוח ב', color: 'in_progress' },
    { project_id: 3, event_name: 'כנס מוכן', customer_name: 'לקוח ג', color: 'ready' },
    { project_id: 4, event_name: 'כנס מבוטל', customer_name: 'לקוח ד', color: 'cancelled' },
  ]

  it('צ׳יפ-צבעים מסנן לפי חברות-בקבוצה', () => {
    const result = filterCalendarProjects(projects, {
      colors: new Set(['not_started', 'in_progress']),
    })
    expect(result.map((p) => p.project_id)).toEqual([1, 2])
  })

  it('cancelled הוא צבע-צ׳יפ לכל דבר — ברירת-המחדל כוללת אותו', () => {
    const result = filterCalendarProjects(projects, {
      colors: new Set(['not_started', 'in_progress', 'ready', 'cancelled']),
    })
    expect(result).toHaveLength(4)
  })

  it('כיבוי הצ׳יפ cancelled מסתיר רק אותו', () => {
    const result = filterCalendarProjects(projects, {
      colors: new Set(['not_started', 'in_progress', 'ready']),
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
      { color: 'not_started' },
      { color: 'not_started' },
      { color: 'in_progress' },
      { color: 'ready' },
      { color: 'past' },
      { color: 'cancelled' },
      { color: 'cancelled' },
      { color: 'cancelled' },
    ]
    expect(colorCounts(projects)).toEqual({
      ready: 1,
      in_progress: 1,
      not_started: 2,
      past: 1,
      cancelled: 3,
    })
  })

  it('רשימה ריקה ⇒ אפסים לחמשת הצבעים, לא קריסה', () => {
    expect(colorCounts([])).toEqual({
      ready: 0,
      in_progress: 0,
      not_started: 0,
      past: 0,
      cancelled: 0,
    })
  })
})
