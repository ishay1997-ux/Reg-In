// בדיקות הלוגיקה הטהורה של לשונית הלוגיסטיקה (משטח 3) — נועלות: מיון "רחוק ממוכן תחילה",
// רק ready נספר, חשבון-ההנחה של האריח השלישי (חשבון 2.2, לא חשבון חדש), הסימן החתום,
// המבחין של שלושת מצבי-הריק, והדגל money_visible (לעולם לא price === null).
import { describe, it, expect } from 'vitest'
import {
  LOGISTICS_STATUS_LABELS,
  resolveLogisticsTone,
  sortLogisticsRows,
  readinessTileSub,
  readinessMetricBlocked,
  readyItemsCount,
  SORT_LINE,
  changesTileSub,
  signedShekelCents,
  signedDelta,
  moneyHidden,
  lastLogisticsChangeBySku,
  plannedChangeNote,
  changeRowsWithRanges,
  changesMoneySummary,
  countProductLines,
  LEGAL_EMPTY_TITLE,
  LEGAL_EMPTY_DETAIL,
  NO_PERMISSION_SENTENCE,
  BROKEN_EMPTY_DETAIL,
  LOAD_FAILURE_DETAIL,
  // ── משטח 1 (מודול 5, צעד 2.1) ──
  QUEUE_NO_PERMISSION_SENTENCE,
  EMPTY_OUTBOUND_SENTENCE,
  WRITE_FAILURE_SENTENCE,
  NEGATIVE_QTY_SENTENCE,
  QUEUE_SORT_LINE,
  OUTBOUND_READY_REASON,
  queueBaseProjects,
  pillOf,
  filterQueueByPill,
  queuePillCounts,
  amberMark,
  outboundMembership,
  sortQueueProjects,
  resolveQueueBranch,
  queueReason,
  outboundReason,
  lateArrivalReason,
} from './projectLogistics'
import { businessDaysUntil } from './projectChanges'

describe('resolveLogisticsTone — תווית לא-ממופה צועקת ולא מאפירה', () => {
  it('מחזירה טון לכל אחת משלוש התוויות', () => {
    for (const label of Object.values(LOGISTICS_STATUS_LABELS)) {
      expect(typeof resolveLogisticsTone(label)).toBe('string')
    }
  })

  it('זורקת על תווית זרה — StatusTag היה מציג אפור בשקט', () => {
    expect(() => resolveLogisticsTone('בהזמנה')).toThrow('בהזמנה')
  })
})

describe('sortLogisticsRows — מה שרחוק ביותר ממוכן תחילה', () => {
  it('ready אחרון, not_started ראשון, ושובר-שוויון יציב לפי sku', () => {
    const rows = [
      { sku: 'A', serial_number: 1, item_status: 'ready' },
      { sku: 'C', serial_number: 1, item_status: 'not_started' },
      { sku: 'B', serial_number: 1, item_status: 'ordered' },
      { sku: 'A', serial_number: 2, item_status: 'not_started' },
    ]
    expect(sortLogisticsRows(rows).map((r) => `${r.sku}:${r.item_status}`)).toEqual([
      'A:not_started',
      'C:not_started',
      'B:ordered',
      'A:ready',
    ])
  })
})

describe('readinessTileSub — רק ready נספר (§1.3)', () => {
  it('אף פריט לא הוזמן ⇒ הנוסח של המוקאפ, בטון ענבר', () => {
    const rows = [{ item_status: 'not_started' }, { item_status: 'not_started' }]
    expect(readinessTileSub(rows)).toEqual({ text: 'טרם הוזמן אף פריט', tone: 'hint' })
  })

  it('פריט שהוזמן ולא הגיע זהה במדד לפריט שאיש לא נגע בו — ושונה בתג', () => {
    // ordered אינו נספר: 1 ready מתוך 3 ⇒ "2 פריטים טרם מוכנים", לא "1 טרם מוכן".
    const rows = [
      { item_status: 'ready' },
      { item_status: 'ordered' },
      { item_status: 'not_started' },
    ]
    expect(readinessTileSub(rows)).toEqual({ text: '2 פריטים טרם מוכנים', tone: 'hint' })
  })

  it('לשון-יחיד לפריט בודד, וסגירה מלאה היא עובדה רגועה', () => {
    expect(readinessTileSub([{ item_status: 'ready' }, { item_status: 'ordered' }])).toEqual({
      text: 'פריט אחד טרם מוכן',
      tone: 'hint',
    })
    expect(readinessTileSub([{ item_status: 'ready' }])).toEqual({ text: '✓ מוכן', tone: 'done' })
    expect(readinessTileSub([])).toEqual({ text: '✓ אין פריטים', tone: 'done' })
  })
})

describe('readyItemsCount — המונה של האריח ושורת-המשנה, ממקור אחד', () => {
  it('סופר רק ready — ordered ו-not_started אינם נספרים', () => {
    const rows = [
      { item_status: 'ready' },
      { item_status: 'ordered' },
      { item_status: 'not_started' },
      { item_status: 'ready' },
    ]
    expect(readyItemsCount(rows)).toBe(2)
    expect(readyItemsCount([])).toBe(0)
    expect(readyItemsCount(null)).toBe(0)
  })
})

describe('readinessMetricBlocked — מתי המדד מציג — ולעולם לא 0/0 (S-26)', () => {
  it('noPermission וגם broken חוסמים — רשימה ריקה לא-כדין אינה "0 מתוך 0 ✓"', () => {
    expect(readinessMetricBlocked('noPermission')).toBe(true)
    expect(readinessMetricBlocked('broken')).toBe(true)
  })

  it('legal וטבלה מאוכלסת (null) אינם חסומים', () => {
    expect(readinessMetricBlocked('legal')).toBe(false)
    expect(readinessMetricBlocked(null)).toBe(false)
  })
})

describe('changesTileSub — "האחרון היום, 09:15" בשעון ישראל', () => {
  it('שינוי מאותו יום-ישראל מקבל "האחרון היום" עם השעה', () => {
    const sub = changesTileSub('2026-08-13T06:15:00Z', '2026-08-13T12:00:00Z')
    expect(sub.prefix).toBe('האחרון היום, ')
    expect(sub.value).toBe('09:15') // ‏06:15Z = ‏09:15 בישראל (קיץ, UTC+3)
  })

  it('שינוי מיום אחר מקבל תאריך DD/MM', () => {
    const sub = changesTileSub('2026-08-11T11:22:00Z', '2026-08-13T12:00:00Z')
    expect(sub.prefix).toBe('האחרון ב-')
    expect(sub.value).toBe('11/08')
  })

  it('קלט לא-תקין ⇒ null, לא זריקה', () => {
    expect(changesTileSub(null, '2026-08-13T12:00:00Z')).toBeNull()
  })
})

describe('signedShekelCents — הסימן מהערך, הגודל מ-formatShekelCents', () => {
  it('חיובי מקבל +, שלילי מקבל −, אפס נשאר עובדה', () => {
    expect(signedShekelCents(85)).toBe('+85.00 ₪')
    expect(signedShekelCents(-300)).toBe('−300.00 ₪')
    expect(signedShekelCents(0)).toBe('0.00 ₪')
  })

  it('ערך לא-מספרי ⇒ מקף, לעולם לא 0', () => {
    expect(signedShekelCents(null)).toBe('—')
    expect(signedShekelCents(undefined)).toBe('—')
  })
})

describe('signedDelta — דלתא חתומה בלי ₪ (עמודת "השינוי" היא כמות, לא כסף)', () => {
  it('חיובי +, שלילי − (U+2212), אפס עובדה, ולא-מספרי מקף', () => {
    expect(signedDelta(80)).toBe('+80')
    expect(signedDelta(-50)).toBe('−50')
    expect(signedDelta(0)).toBe('0')
    expect(signedDelta('abc')).toBe('—')
  })
})

describe('moneyHidden — הדגל money_visible הוא המבחין, לא price === null', () => {
  it('שורה אחת עם money_visible=false מסתירה את כל הכסף', () => {
    expect(moneyHidden([{ money_visible: true }, { money_visible: false }])).toBe(true)
  })

  it('כולן true — או אין שורות בכלל — הכסף גלוי', () => {
    expect(moneyHidden([{ money_visible: true }])).toBe(false)
    expect(moneyHidden([])).toBe(false)
  })

  it('revenue_delta null עם money_visible=true אינו "חסום" — null חוקי גם כערך', () => {
    expect(moneyHidden([{ money_visible: true, revenue_delta: null }])).toBe(false)
  })
})

describe('plannedChangeNote — הוגדל=ענבר (יוצר חוסר) · הוקטן=אפור (עובדה)', () => {
  it('הגדלה: המקור הוא הנוכחי פחות הדלתא, והטון ענבר', () => {
    const note = plannedChangeNote(380, {
      delta_qty: 80,
      created_at: '2026-08-11T11:22:00Z',
    })
    expect(note).toMatchObject({ text: 'הוגדל מ-', previous: 300, tone: 'hint' })
    expect(note.dayMonth).toBe('11/08')
  })

  it('הקטנה: טון רגוע, לא ענבר', () => {
    const note = plannedChangeNote(250, {
      delta_qty: -50,
      created_at: '2026-08-13T06:15:00Z',
    })
    expect(note).toMatchObject({ text: 'הוקטן מ-', previous: 300, tone: 'calm' })
  })

  it('בלי שינוי — אין שורת-משנה בכלל', () => {
    expect(plannedChangeNote(300, undefined)).toBeNull()
  })
})

describe('changeRowsWithRanges — שחזור "300 → 380" לאחור מהערך הנוכחי', () => {
  it('שרשרת שינויים על אותו פריט נפרשת נכון מהחדש לישן', () => {
    // ‏desc: ‏+30 (אחרון, ליעד 380) ואז +50 (קודם, ליעד 350).
    const changes = [
      { change_id: 2, change_target: 'logistics', sku: 'TAG', delta_qty: 30 },
      { change_id: 1, change_target: 'logistics', sku: 'TAG', delta_qty: 50 },
    ]
    const ranged = changeRowsWithRanges(changes, { plannedBySku: new Map([['TAG', 380]]) })
    expect(ranged.map(({ from, to }) => `${from}→${to}`)).toEqual(['350→380', '300→350'])
  })

  it('שינוי כמות-דיילות נמדד מול required הנוכחי', () => {
    const changes = [{ change_id: 1, change_target: 'hostess_count', sku: null, delta_qty: 2 }]
    const [row] = changeRowsWithRanges(changes, { currentRequired: 8 })
    expect(row).toMatchObject({ from: 6, to: 8 })
  })

  it('פריט שאינו קריא (אין planned) ⇒ null-ים, לא NaN', () => {
    const changes = [{ change_id: 1, change_target: 'logistics', sku: 'GONE', delta_qty: 10 }]
    const [row] = changeRowsWithRanges(changes, { plannedBySku: new Map() })
    expect(row.from).toBeNull()
    expect(row.to).toBeNull()
  })
})

describe('changesMoneySummary — חשבון 2.2: סכום ⇒ הנחה, באגורות שלמות', () => {
  it('העוגן של המוקאפ: ‏+400 −300 בהנחת 5%+10% ⇒ ‏+100 לפני, ‏+85 אחרי', () => {
    const changes = [
      { delta_qty: 80, unit_price_snapshot: 5 },
      { delta_qty: -50, unit_price_snapshot: 6 },
    ]
    const meta = { applied_customer_discount: 5, manual_discount: 10 }
    expect(changesMoneySummary(changes, meta)).toEqual({
      preDiscount: 100,
      discountPercent: 15,
      afterDiscount: 85,
    })
  })

  it('בלי מטא-הצעה ההנחה 0 והסכום נשאר טרום-הנחה', () => {
    const changes = [{ delta_qty: 10, unit_price_snapshot: 5 }]
    expect(changesMoneySummary(changes, null)).toEqual({
      preDiscount: 50,
      discountPercent: 0,
      afterDiscount: 50,
    })
  })
})

describe('countProductLines — המבחין של שלושת מצבי-הריק (S-26)', () => {
  const products = [
    { sku: 'H-SRV', category: 'hostess' },
    { sku: 'TAG', category: 'product' },
  ]

  it('הצעה לא-קריאה ⇒ null — שני מצבים אינם יכולים לבטא שלוש סיטואציות', () => {
    expect(countProductLines(null, products)).toBeNull()
  })

  it('הצעת דיילות-בלבד ⇒ 0 ⇒ ריק כדין', () => {
    const quote = { quote_services: [{ sku: 'H-SRV' }] }
    expect(countProductLines(quote, products)).toBe(0)
  })

  it('הצעה עם שורות-מוצר ⇒ רשימה ריקה היא תקלה, לא מצב תקין', () => {
    const quote = { quote_services: [{ sku: 'H-SRV' }, { sku: 'TAG' }] }
    expect(countProductLines(quote, products)).toBe(1)
  })

  it('מק"ט שאינו בקטלוג נספר כמוצר — טעות לכיוון "תקלה", לא לכיוון "תקין"', () => {
    const quote = { quote_services: [{ sku: 'MYSTERY' }] }
    expect(countProductLines(quote, products)).toBe(1)
  })
})

describe('lastLogisticsChangeBySku — השינוי האחרון בלבד, פר-פריט', () => {
  it('הראשון בסדר-ה-desc מנצח, ושינויי כמות-דיילות אינם נכנסים', () => {
    const changes = [
      { change_id: 3, change_target: 'hostess_count', sku: null, delta_qty: 2 },
      { change_id: 2, change_target: 'logistics', sku: 'TAG', delta_qty: 30 },
      { change_id: 1, change_target: 'logistics', sku: 'TAG', delta_qty: 50 },
    ]
    const map = lastLogisticsChangeBySku(changes)
    expect(map.get('TAG').change_id).toBe(2)
    expect(map.size).toBe(1)
  })
})

describe('שלושת המשפטים של מצבי-הריק שונים זה מזה — S-26', () => {
  it('אין שני מצבים שחולקים משפט', () => {
    const sentences = [LEGAL_EMPTY_TITLE, NO_PERMISSION_SENTENCE, BROKEN_EMPTY_DETAIL]
    expect(new Set(sentences).size).toBe(3)
  })

  // הרחבת-הנעילה של צעד 2.1 (מדריך-המיקרו §3.7): שני האחים שלא היו נעולים
  // (`LEGAL_EMPTY_DETAIL` · `LOAD_FAILURE_DETAIL`) + משפט-התור החדש (S-2). ששת המשפטים
  // חיים באותו מודול, ושניים שיישמעו זהים הם בדיוק הכשל השקט של S-26.
  it('וגם ששת המשפטים של המודול, כולל משפט-התור החדש — S-2', () => {
    const sentences = [
      LEGAL_EMPTY_TITLE,
      LEGAL_EMPTY_DETAIL,
      NO_PERMISSION_SENTENCE,
      BROKEN_EMPTY_DETAIL,
      LOAD_FAILURE_DETAIL,
      QUEUE_NO_PERMISSION_SENTENCE,
    ]
    expect(new Set(sentences).size).toBe(6)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// משטח 1 — תור-העבודה של מנהלת הלוגיסטיקה (צעד 2.1)
// "היום" בכל הפיקסצ'רות: חמישי 27/08/2026 — היום היחיד שבו חלון-㉓ נראה על המסך
// (`data-set.md §📅`). 28–29/08 שישי-שבת; יום-העסקים הבא הוא ראשון 30/08.
// ═══════════════════════════════════════════════════════════════════════════════

const TODAY = '2026-08-27'

// קטלוג-המוצרים: `01WEB` הוא היחיד מקטגוריית `site` (⑧ — אתר-רישום אינו ייצור-דפוס).
const PRODUCTS = [
  { sku: 'B-REG-TAG', category: 'product' },
  { sku: 'B-SAT-LAN', category: 'product' },
  { sku: 'B-ECO-TAG', category: 'product' },
  { sku: 'B-FAB-LAN', category: 'product' },
  { sku: '01WEB', category: 'site' },
]

const row = (projectId, sku, status, extra = {}) => ({
  project_id: projectId,
  sku,
  serial_number: 1,
  planned_qty: 100,
  actual_qty: 0,
  item_status: status,
  expected_arrival_date: null,
  actual_arrival_date: null,
  ...extra,
})

// מערך-הדמו של `data-set.md §5`, בשמות-המספרים שלו. חמישה פעילים עם שורות + `#11`
// הפעיל-בלי-שורות + `#103` המבוטל — כלומר שבעה פרויקטים, ובסיס בן 5.
const DEMO_PROJECTS = [
  { project_id: 105, project_status: 'ready', final_event_date: '2026-08-27' },
  { project_id: 106, project_status: 'in_progress', final_event_date: '2026-08-30' },
  { project_id: 107, project_status: 'in_progress', final_event_date: '2026-09-08' },
  { project_id: 8, project_status: 'in_progress', final_event_date: '2026-10-15' },
  { project_id: 3, project_status: 'not_started', final_event_date: '2026-11-05' },
  { project_id: 11, project_status: 'ready', final_event_date: '2026-10-20' },
  { project_id: 103, project_status: 'cancelled', final_event_date: '2026-09-05' },
]

const DEMO_ROWS = [
  // ‏#105 — הכול הגיע (2 מתוך 2); החוסר של 285/300 אינו חוסם (§7.22).
  row(105, 'B-REG-TAG', 'ready', { planned_qty: 300, actual_qty: 285 }),
  row(105, 'B-FAB-LAN', 'ready', { planned_qty: 300, actual_qty: 300, serial_number: 2 }),
  // ‏#106 — ההגעה-החלקית: אין אף `טרם החל`, ו-80 שרוכים עדיין בדרך (㉛).
  row(106, 'B-ECO-TAG', 'ready', { planned_qty: 200, actual_qty: 200 }),
  row(106, 'B-SAT-LAN', 'ordered', { planned_qty: 200, actual_qty: 120, serial_number: 2 }),
  // ‏#107 — שלושת המצבים על מסך אחד + פריט `site` שאינו נספר בענבר.
  row(107, 'B-REG-TAG', 'ordered', { planned_qty: 150 }),
  row(107, 'B-SAT-LAN', 'not_started', { planned_qty: 150, serial_number: 2 }),
  row(107, 'B-ECO-TAG', 'ready', { planned_qty: 50, actual_qty: 50, serial_number: 3 }),
  row(107, '01WEB', 'not_started', { planned_qty: 1, serial_number: 4 }),
  // ‏#8 ו-#3 — איש לא נגע בהם.
  row(8, 'B-REG-TAG', 'not_started', { planned_qty: 300 }),
  row(8, 'B-FAB-LAN', 'not_started', { planned_qty: 300, serial_number: 2 }),
  row(3, 'B-REG-TAG', 'not_started', { planned_qty: 200 }),
  row(3, 'B-ECO-TAG', 'not_started', { planned_qty: 200, serial_number: 2 }),
  // ‏#103 מבוטל — יש לו שורות, ואסור שיגיע לאף גלולה.
  row(103, 'B-REG-TAG', 'not_started', { planned_qty: 150 }),
  // ‏#11 — אפס שורות בכוונה. אין כאן שורה, וזו כל הפואנטה.
]

const rowsOf = (projectId) => DEMO_ROWS.filter((r) => r.project_id === projectId)

describe('queueBaseProjects — כלל-האוכלוסייה: פעיל *וגם* בעל שורות', () => {
  it('‏#11 (פעיל, אפס שורות) ו-#103 (מבוטל) מחוץ לבסיס — הבסיס הוא 5', () => {
    const base = queueBaseProjects(DEMO_PROJECTS, DEMO_ROWS)
    expect(base.map((entry) => entry.project.project_id)).toEqual([105, 106, 107, 8, 3])
    expect(base).toHaveLength(5)
  })

  it('שורות-הפרויקט נצמדות לפרויקט הנכון ואינן נשפכות בין שכנים', () => {
    const base = queueBaseProjects(DEMO_PROJECTS, DEMO_ROWS)
    const byId = new Map(base.map((entry) => [entry.project.project_id, entry.rows]))
    expect(byId.get(107)).toHaveLength(4)
    expect(byId.get(105)).toHaveLength(2)
    expect(byId.get(3).every((r) => r.project_id === 3)).toBe(true)
  })

  it('קלט ריק/חסר אינו זורק', () => {
    expect(queueBaseProjects(null, null)).toEqual([])
    expect(queueBaseProjects(DEMO_PROJECTS, [])).toEqual([])
  })
})

describe('pillOf + queuePillCounts — ㉙ · ㉛ · ⑲', () => {
  it('שלושת המצבים, כל אחד על הפרויקט שמדגים אותו', () => {
    expect(pillOf(rowsOf(107))).toBe('needsAction')
    expect(pillOf(rowsOf(8))).toBe('needsAction')
    expect(pillOf(rowsOf(106))).toBe('awaitingDelivery')
    expect(pillOf(rowsOf(105))).toBe('ready')
    expect(pillOf([])).toBeNull()
  })

  it('‏㉛ סוגרת את החור של #106 — "לא נשאר מה להזמין, ולא הכול הגיע"', () => {
    // הנוסח הישן ("כלום עוד לא הגיע") היה מפיל את #106 בין הגלולות: יש בו פריט `מוכן`.
    const partiallyArrived = [
      { item_status: 'ready', planned_qty: 200, actual_qty: 200 },
      { item_status: 'ordered', planned_qty: 200, actual_qty: 120 },
    ]
    expect(pillOf(partiallyArrived)).toBe('awaitingDelivery')
  })

  it('🔴 המונים הם 3 · 1 · 5 — ו-`הכול` הוא 5 ולא 6 (סייג-#11)', () => {
    const base = queueBaseProjects(DEMO_PROJECTS, DEMO_ROWS)
    expect(queuePillCounts(base)).toEqual({ needsAction: 3, awaitingDelivery: 1, all: 5 })
  })

  it('הסינון פר-גלולה מחזיר בדיוק את הפרויקטים של `data-set.md §5`', () => {
    const base = queueBaseProjects(DEMO_PROJECTS, DEMO_ROWS)
    const ids = (pill) => filterQueueByPill(base, pill).map((e) => e.project.project_id)
    expect(ids('needsAction')).toEqual([107, 8, 3])
    expect(ids('awaitingDelivery')).toEqual([106])
    expect(ids('all')).toEqual([105, 106, 107, 8, 3])
  })
})

describe('amberMark — ⑳ (פריט פיזי + סף ימי-עסקים) + הטריגר השני של ㊶', () => {
  // 🔄 הסף ירד מקבוע-קוד לשורת-`params` `סף_לוגיסטיקה_ימי_עסקים` (מודול 9 · צעד 2.3)
  // ומוזרק כמו `todayIso` ו-`businessDaysUntil`. **מחרוזת** — `param_value` הוא `text`.
  const AMBER_DAYS = '10'
  const mark = (rows, eventDate, today = TODAY, thresholdDays = AMBER_DAYS) =>
    amberMark(rows, PRODUCTS, eventDate, today, businessDaysUntil, thresholdDays)

  it('‏#107 הוא היחיד במערך שנושא סימון — ‏8 ימי-עסקים', () => {
    const result = mark(rowsOf(107), '2026-09-08')
    expect(result.amber).toBe(true)
    expect(result.triggers).toEqual(['physicalNotStarted'])
    expect(result.businessDays).toBe(8)
  })

  it('שלושת האחרים אינם מסומנים, כל אחד מסיבה אחרת', () => {
    expect(mark(rowsOf(105), '2026-08-27').amber).toBe(false) // אין `טרם החל`
    expect(mark(rowsOf(106), '2026-08-30').amber).toBe(false) // אין `טרם החל`
    expect(mark(rowsOf(8), '2026-10-15').amber).toBe(false) // מעבר לסף
  })

  it('🔴 פרויקט שכל ה-`טרם החל` שלו הוא 01WEB אינו מסומן — ההחרגה שהמערך אינו מוכיח', () => {
    const siteOnly = [
      row(900, '01WEB', 'not_started'),
      row(900, 'B-REG-TAG', 'ready', { serial_number: 2 }),
    ]
    expect(mark(siteOnly, '2026-09-08').amber).toBe(false)
  })

  it('מק"ט שאינו בקטלוג נספר כפיזי — טעות לכיוון האזעקה, כמו countProductLines', () => {
    expect(mark([row(901, 'MYSTERY', 'not_started')], '2026-09-08').amber).toBe(true)
  })

  it('הגבול: ‏10 ימי-עסקים מסומן, ‏11 אינו', () => {
    expect(mark([row(902, 'B-REG-TAG', 'not_started')], '2026-09-10').businessDays).toBe(10)
    expect(mark([row(902, 'B-REG-TAG', 'not_started')], '2026-09-10').amber).toBe(true)
    expect(mark([row(902, 'B-REG-TAG', 'not_started')], '2026-09-13').businessDays).toBe(11)
    expect(mark([row(902, 'B-REG-TAG', 'not_started')], '2026-09-13').amber).toBe(false)
  })

  // 🔬 בדיקת-המוטציה: אותה שורה ואותו תאריך בדיוק, סף אחר ⇒ תשובה אחרת. אילו המימוש
  // היה ממשיך לקרוא 10 מהקוד, שתי השורות היו זהות והבדיקה הייתה ירוקה על קוד שלא זז.
  it('‏8 ימי-עסקים: סף 10 ⇒ ענבר, סף 5 ⇒ לא', () => {
    const rows = [row(905, 'B-REG-TAG', 'not_started')]
    expect(mark(rows, '2026-09-08', TODAY, '10').amber).toBe(true)
    expect(mark(rows, '2026-09-08', TODAY, '5').amber).toBe(false)
  })

  // 🔴 סף חסר ⇒ הטריגר של ⑳ אינו נדלק, ולא נפילה חזרה ל-10. הטריגר השני (איחור-הגעה)
  // אינו תלוי בסף וממשיך לעבוד — וזה מה שהשורה השנייה נועלת.
  it('סף חסר ⇒ ⑳ שותק, ㊶ ממשיך', () => {
    // ⚠️ קריאה ישירה ולא דרך `mark`: לעוזר יש ברירת-מחדל לסף, ו-`undefined` דרכו היה
    // נופל עליה — כלומר הבדיקה הייתה מוכיחה את ההפך ממה שהיא מתיימרת.
    const notStarted = [row(906, 'B-REG-TAG', 'not_started')]
    for (const bad of [undefined, null, '', '   ']) {
      expect(
        amberMark(notStarted, PRODUCTS, '2026-09-08', TODAY, businessDaysUntil, bad).amber,
      ).toBe(false)
    }
    const late = [
      row(907, 'B-REG-TAG', 'ordered', {
        expected_arrival_date: '2026-08-25',
        actual_arrival_date: null,
      }),
    ]
    expect(
      amberMark(late, PRODUCTS, '2026-10-15', TODAY, businessDaysUntil, undefined).triggers,
    ).toEqual(['lateArrival'])
  })

  it('🔴 אירוע שעבר אינו מסומן — businessDaysUntil מחזירה 0 על תאריך-עבר', () => {
    // בלי שומר-העבר, פרויקט פעיל תקוע מאתמול היה נדלק בענבר לנצח.
    expect(businessDaysUntil(TODAY, '2026-08-25')).toBe(0)
    expect(mark([row(903, 'B-REG-TAG', 'not_started')], '2026-08-25').amber).toBe(false)
  })

  it('הטריגר השני של ㊶: הוזמן · התאריך שהובטח עבר · טרם הגיע', () => {
    const late = [
      row(904, 'B-REG-TAG', 'ordered', {
        expected_arrival_date: '2026-08-25',
        actual_arrival_date: null,
      }),
    ]
    // ‏15/10 רחוק מכל סף — ולכן זה מוכיח שהטריגר השני עומד בפני עצמו.
    const result = mark(late, '2026-10-15')
    expect(result.amber).toBe(true)
    expect(result.triggers).toEqual(['lateArrival'])
    expect(result.lateRow.expected_arrival_date).toBe('2026-08-25')
  })

  it('הטריגר השני כבוי כשההבטחה בעתיד, כשהסחורה הגיעה, או כשאין תאריך', () => {
    const at = (extra) => mark([row(905, 'B-REG-TAG', 'ordered', extra)], '2026-10-15').amber
    expect(at({ expected_arrival_date: '2026-09-30' })).toBe(false)
    expect(at({ expected_arrival_date: '2026-08-25', actual_arrival_date: '2026-08-26' })).toBe(
      false,
    )
    expect(at({ expected_arrival_date: null })).toBe(false)
    // 🔒 גבול-ההשוואה: הבטחה **להיום** אינה איחור — ㊶ נדלקת רק אחרי שהיום שהובטח חלף,
    // ולכן ההשוואה חייבת להישאר `<` ולא `<=`. בלי השורה הזאת החלפת האופרטור לא הפילה
    // אף בדיקה, והמסך היה מכריז "ההגעה מתעכבת" על סחורה שהיום עוד לא נגמר עבורה.
    expect(at({ expected_arrival_date: TODAY })).toBe(false)
  })

  it('שני הטריגרים יחד מדווחים שניהם — הקורא צריך לדעת מה נדלק', () => {
    const both = [
      row(906, 'B-SAT-LAN', 'not_started'),
      row(906, 'B-REG-TAG', 'ordered', {
        serial_number: 2,
        expected_arrival_date: '2026-08-25',
      }),
    ]
    expect(mark(both, '2026-09-08').triggers).toEqual(['physicalNotStarted', 'lateArrival'])
  })
})

describe('outboundMembership — ㉓: מהיום ועד יום-העסקים הבא בכלל', () => {
  const inWindow = (eventDate) => outboundMembership(eventDate, TODAY, businessDaysUntil)

  it('ביום חמישי החלון מגיע עד ראשון — וזה כל הטעם של ㉓', () => {
    expect(inWindow('2026-08-27')).toBe(true) // היום
    expect(inWindow('2026-08-28')).toBe(true) // שישי — 0 ימי-עסקים
    expect(inWindow('2026-08-30')).toBe(true) // ראשון — יום-העסקים הבא
    expect(inWindow('2026-08-31')).toBe(false) // שני — יום-העסקים השני
    expect(inWindow('2026-09-08')).toBe(false)
  })

  it('🔴 אירוע שעבר אינו בחלון — אותה מלכודת של businessDaysUntil', () => {
    expect(inWindow('2026-08-25')).toBe(false)
    expect(inWindow('2026-08-01')).toBe(false)
  })

  it('שני הפרויקטים של המוקאפ בפנים, שלושת האחרים בחוץ', () => {
    const base = queueBaseProjects(DEMO_PROJECTS, DEMO_ROWS)
    const outbound = base.filter((entry) =>
      outboundMembership(entry.project.final_event_date, TODAY, businessDaysUntil),
    )
    expect(outbound.map((entry) => entry.project.project_id)).toEqual([105, 106])
  })
})

describe('sortQueueProjects — S-3: מרחק מוחלט, בלי מימד-מיון שני', () => {
  it('הקרוב ביותר תחילה, ואירוע שעבר נמדד במרחק המוחלט שלו', () => {
    const entries = [
      { project: { project_id: 3, final_event_date: '2026-11-05' } },
      { project: { project_id: 12, final_event_date: '2026-08-19' } }, // ‎−8
      { project: { project_id: 107, final_event_date: '2026-09-08' } }, // ‎+12
      { project: { project_id: 105, final_event_date: '2026-08-27' } }, // ‎0
    ]
    expect(sortQueueProjects(entries, TODAY).map((e) => e.project.project_id)).toEqual([
      105, 12, 107, 3,
    ])
  })

  it('שובר-שוויון יציב לפי project_id, ותאריך חסר נופל לסוף', () => {
    const entries = [
      { project: { project_id: 9, final_event_date: null } },
      { project: { project_id: 7, final_event_date: '2026-08-30' } },
      { project: { project_id: 4, final_event_date: '2026-08-30' } },
    ]
    expect(sortQueueProjects(entries, TODAY).map((e) => e.project.project_id)).toEqual([4, 7, 9])
  })

  it('אינו משנה את המערך שנמסר לו', () => {
    const entries = [
      { project: { project_id: 2, final_event_date: '2026-09-08' } },
      { project: { project_id: 1, final_event_date: '2026-08-27' } },
    ]
    sortQueueProjects(entries, TODAY)
    expect(entries.map((e) => e.project.project_id)).toEqual([2, 1])
  })
})

describe('resolveQueueBranch — AR-3: חוסר-הרשאה תמיד הענף הראשון', () => {
  it('‏projects החזירה שורות ו-logistics אפס ⇒ חסימה, לא "תור ריק"', () => {
    expect(resolveQueueBranch(DEMO_PROJECTS, [])).toBe('noPermission')
  })

  it('שתיהן ריקות ⇒ גם כן חסימה — טעות לכיוון "אולי חסומה"', () => {
    expect(resolveQueueBranch([], [])).toBe('noPermission')
  })

  it('יש שורות-לוגיסטיקה ⇒ מסלול רגיל', () => {
    expect(resolveQueueBranch(DEMO_PROJECTS, DEMO_ROWS)).toBe('normal')
    expect(resolveQueueBranch(null, DEMO_ROWS)).toBe('normal')
  })
})

describe('queueReason — שורת-הנימוק של התור, בחלקים מבודדים (🔤)', () => {
  it('אף שורה לא יצאה מ-not_started ⇒ המחרוזת הנעולה של readinessTileSub', () => {
    const reason = queueReason(rowsOf(8))
    expect(reason).toEqual({
      prefix: 'טרם הוזמן אף פריט',
      value: null,
      suffix: '',
      tone: 'hint',
    })
    // 🔒 אותה מחרוזת בדיוק, לא ליטרל שני שנכתב לידה.
    expect(reason.prefix).toBe(readinessTileSub(rowsOf(8)).text)
  })

  it('שניים מתוך ארבעה (#107) ⇒ הנוסח הכפול המצויר, לא הספרה', () => {
    expect(queueReason(rowsOf(107))).toEqual({
      prefix: 'שני פריטים טרם הוזמנו',
      value: null,
      suffix: '',
      tone: 'hint',
    })
  })

  it('אחד ⇒ לשון-יחיד · שלושה ⇒ ספרה מבודדת מהעברית', () => {
    const one = [{ item_status: 'not_started' }, { item_status: 'ready' }]
    expect(queueReason(one)).toMatchObject({ prefix: 'פריט אחד טרם הוזמן', value: null })
    const three = [
      { item_status: 'not_started' },
      { item_status: 'not_started' },
      { item_status: 'not_started' },
      { item_status: 'ready' },
    ]
    expect(queueReason(three)).toEqual({
      prefix: '',
      value: '3',
      suffix: ' פריטים טרם הוזמנו',
      tone: 'hint',
    })
  })

  it('אין מה להזמין ולא הכול הגיע ⇒ סכום-היחידות שבדרך, מבודד', () => {
    expect(queueReason(rowsOf(106))).toEqual({
      prefix: '',
      value: '80',
      suffix: ' יחידות עדיין בדרך',
      tone: 'hint',
    })
  })

  it('יחידה בודדת בדרך ⇒ לשון-יחיד בלי ספרה', () => {
    const almost = [
      { item_status: 'ready', planned_qty: 10, actual_qty: 10 },
      { item_status: 'ordered', planned_qty: 10, actual_qty: 9 },
    ]
    expect(queueReason(almost)).toMatchObject({ prefix: 'יחידה אחת עדיין בדרך', value: null })
  })

  it('🔒 שתי שורות `הוזמן`, אחת בעודף ⇒ סכום על **כל** השורות, והעודף אינו מקזז', () => {
    // הפיקסצ'רה הזאת נועדה לנעול שני דברים שאף פיקסצ'רה אחרת בקובץ אינה מוכיחה — בכולן
    // יש שורת-`הוזמן` **אחת** ואף אחת אינה בעודף:
    // ‏(א) הסכום רץ על **כל** שורות ה-`הוזמן` (‏Σ) ולא על הראשונה בלבד ·
    // ‏(ב) הקיזוז פר-שורה נחסם באפס — שורה שהגיעה בעודף (`actual_qty > planned_qty`, מצב
    //     שה-RPC מתיר במפורש) אינה "מינוס בדרך" שמקטין את החוסר של שורה אחרת.
    // שלוש תוצאות שונות מאותה פיקסצ'רה, וזה מה שהופך אותה לנועלת: כמימושה 0+50=50 ·
    // בלי החסימה באפס ‎−20+50=30 · עם שורה-ראשונה-בלבד 0 ⇒ אין משפט כלל.
    const overAndUnder = [
      { item_status: 'ordered', planned_qty: 100, actual_qty: 120 },
      { item_status: 'ordered', planned_qty: 100, actual_qty: 50 },
    ]
    expect(queueReason(overAndUnder)).toEqual({
      prefix: '',
      value: '50',
      suffix: ' יחידות עדיין בדרך',
      tone: 'hint',
    })
  })

  it('הוזמן אך הפער נסגר (טרם סומן מוכן) ⇒ אין משפט — "לא בכוח"', () => {
    const closed = [{ item_status: 'ordered', planned_qty: 10, actual_qty: 10 }]
    expect(queueReason(closed)).toBeNull()
  })

  it('הכול מוכן ⇒ המחרוזת הנעולה `✓ מוכן`, בטון עובדה', () => {
    expect(queueReason(rowsOf(105))).toEqual({
      prefix: '✓ מוכן',
      value: null,
      suffix: '',
      tone: 'done',
    })
  })

  it('בלי שורות אין משפט', () => {
    expect(queueReason([])).toBeNull()
    expect(queueReason(null)).toBeNull()
  })
})

describe('outboundReason — שתי השורות המצוירות של סעיף-היציאה', () => {
  it('‏#105 — הכול מוכן ⇒ הנוסח הנעול, בטון רגוע (עובדה טובה אינה צבועה)', () => {
    expect(outboundReason(rowsOf(105), '2026-08-27', TODAY)).toEqual({
      prefix: OUTBOUND_READY_REASON,
      value: null,
      suffix: '',
      tone: 'calm',
    })
  })

  it('‏#106 — "יוצא ביום ראשון" + מה שעדיין בדרך, בטון ענבר', () => {
    expect(outboundReason(rowsOf(106), '2026-08-30', TODAY)).toEqual({
      prefix: 'יוצא ביום ראשון — ',
      value: '80',
      suffix: ' יחידות עדיין בדרך',
      tone: 'hint',
    })
  })

  it('אירוע שיוצא היום מקבל "יוצא היום", לא שם-יום', () => {
    const rows = [
      { item_status: 'not_started' },
      { item_status: 'not_started' },
      { item_status: 'ready' },
    ]
    expect(outboundReason(rows, '2026-08-27', TODAY)).toMatchObject({
      prefix: 'יוצא היום — שני פריטים טרם הוזמנו',
      tone: 'hint',
    })
  })

  it('בלי שורות אין שורת-נימוק — ולא קידומת "יוצא היום" תלויה באוויר', () => {
    // המסלול השלילי של הפונקציה: `queueReason` מחזירה null, והקידומת **אינה** נבנית
    // סביב כלום. בלי הבדיקה הזאת שלושת המקרים היו כולם חיוביים, ושורת `if (!base)`
    // לא הייתה נצפית אף פעם ("שומר שלא נצפה — אינו שומר").
    expect(outboundReason([], '2026-08-30', TODAY)).toBeNull()
    expect(outboundReason(null, '2026-08-30', TODAY)).toBeNull()
  })
})

describe('lateArrivalReason — O-1 (אושר 26/08/2026; קבוע אחד, שינוי בשורה אחת)', () => {
  it('התאריך שהובטח מבודד מהעברית שסביבו', () => {
    expect(lateArrivalReason('2026-08-25')).toEqual({
      prefix: 'ההגעה מתעכבת — הובטח ל-',
      value: '25/08',
      suffix: ' וטרם הגיע',
      tone: 'hint',
    })
  })

  it('תאריך חסר או פגום ⇒ אין משפט, לא "NaN/NaN"', () => {
    expect(lateArrivalReason(null)).toBeNull()
    expect(lateArrivalReason('2026-08')).toBeNull()
  })
})

describe('המחרוזות הנעולות של משטח 1 — מועתקות, לא נגזרות מחדש', () => {
  it('‏S-2 · S-3 · S-5 — בייט-בבייט', () => {
    expect(QUEUE_NO_PERMISSION_SENTENCE).toBe(
      'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין.',
    )
    expect(EMPTY_OUTBOUND_SENTENCE).toBe('אין אירוע שיוצא עד יום העסקים הבא.')
    expect(WRITE_FAILURE_SENTENCE).toBe('העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב.')
    expect(NEGATIVE_QTY_SENTENCE).toBe('כמות בפועל אינה יכולה להיות שלילית.')
    expect(QUEUE_SORT_LINE).toBe('ממוין: לפי קרבת האירוע')
    expect(OUTBOUND_READY_REASON).toBe('הכול מוכן — לוודא שהסחורה יוצאת')
  })

  it('כיתוב-המיון של התור אינו זה של הצ׳קליסט — שני מסכים, שתי יחידות-מיון', () => {
    expect(QUEUE_SORT_LINE).not.toBe(SORT_LINE)
  })
})
