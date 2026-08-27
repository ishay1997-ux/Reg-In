// בדיקות לשונית הלוגיסטיקה (משטח 3, צעד 3.3) — ה-API ממוקק (אין Supabase בבדיקה).
// מה שנעול כאן: שלושת מצבי-הריק נקראים שונה (S-26) והמדד לעולם לא '0/0' כשחסום ·
// רק ready נספר · הגדלה ענבר והקטנה אפורה · חשבון-ההנחה של האריח השלישי (‏+85.00 ₪
// מ-‏+100 בהנחת 15%) · וצורת-האין-הרשאה בשלושת אתרי-הכסף כש-money_visible=false.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LogisticsTab from './LogisticsTab'
import { getProjectLogistics, getProjectChanges, getProjectQuoteMeta } from './api'
import { getQuote, getPricingCatalog } from '@/modules/03_quotes/api'
import {
  LEGAL_EMPTY_TITLE,
  NO_PERMISSION_SENTENCE,
  BROKEN_EMPTY_DETAIL,
  MONEY_HIDDEN_SENTENCE,
} from '@/lib/projectLogistics'

// 🔴 שכבת-ההרשאות מוקקת מאז 26/08: המבחין הראשון של מצב-הריק הוא **ההרשאה ללוגיסטיקה**
// ולא ההצעה. ברירת-המחדל היא `edit`, כך שכל הבדיקות שקדמו לשינוי מתנהגות בדיוק כשהיו.
const authState = { permissions: { לוגיסטיקה: 'edit', 'הצעות מחיר': 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

vi.mock('./api', () => ({
  getProjectLogistics: vi.fn(),
  getProjectChanges: vi.fn(),
  getProjectQuoteMeta: vi.fn(),
}))
vi.mock('@/modules/03_quotes/api', () => ({
  getQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
}))

function project(overrides) {
  return {
    project_id: 8,
    quote_id: 6,
    project_status: 'in_progress',
    required_hostess_count: 6,
    ...overrides,
  }
}

// אותם מק"טים כמו הדאטה החיה של #8: תג ושרוך (מוצרים) + שורת-דיילות בהצעה.
function catalogFixture() {
  return {
    products: [
      { sku: 'H-SRV', item_name: 'שירותי דיילת', category: 'hostess', base_price: 500 },
      { sku: 'B-REG-TAG', item_name: 'תג שם רגיל - ממותג', category: 'product', base_price: 6 },
      { sku: 'B-FAB-LAN', item_name: 'שרוך בד - ממותג', category: 'product', base_price: 6 },
    ],
    tiers: [],
    params: [],
  }
}

function logisticsRows() {
  return [
    {
      project_id: 8,
      sku: 'B-REG-TAG',
      serial_number: 1,
      planned_qty: 380,
      actual_qty: 0,
      item_status: 'not_started',
    },
    {
      project_id: 8,
      sku: 'B-FAB-LAN',
      serial_number: 2,
      planned_qty: 250,
      actual_qty: 0,
      item_status: 'not_started',
    },
  ]
}

// שני השינויים של המוקאפ, בסדר ה-desc של ה-RPC (החדש ראשון): הקטנת השרוך ואז הגדלת התג.
function changesFixture({ moneyVisible = true } = {}) {
  return [
    {
      change_id: 2,
      change_group_id: 'g2',
      change_target: 'logistics',
      sku: 'B-FAB-LAN',
      color: null,
      delta_qty: -50,
      unit_price_snapshot: moneyVisible ? 6 : null,
      unit_cost_snapshot: moneyVisible ? 2 : null,
      revenue_delta: moneyVisible ? -300 : null,
      money_visible: moneyVisible,
      reason: 'הלקוח צמצם — שרוכים למרצים ולצוות בלבד',
      performed_by: 'dana@regin.co.il',
      created_at: '2026-08-13T06:15:00Z',
    },
    {
      change_id: 1,
      change_group_id: 'g1',
      change_target: 'logistics',
      sku: 'B-REG-TAG',
      color: null,
      delta_qty: 80,
      unit_price_snapshot: moneyVisible ? 5 : null,
      unit_cost_snapshot: moneyVisible ? 2 : null,
      revenue_delta: moneyVisible ? 400 : null,
      money_visible: moneyVisible,
      reason: 'הלקוח הגדיל את רשימת המוזמנים',
      performed_by: 'dana@regin.co.il',
      created_at: '2026-08-11T11:22:00Z',
    },
  ]
}

function mockHappyPath({ rows = logisticsRows(), changes = changesFixture(), meta } = {}) {
  getProjectLogistics.mockResolvedValue(rows)
  getProjectChanges.mockResolvedValue(changes)
  getProjectQuoteMeta.mockResolvedValue(
    meta === undefined ? { applied_customer_discount: 5, manual_discount: 10 } : meta,
  )
  getPricingCatalog.mockResolvedValue(catalogFixture())
  getQuote.mockResolvedValue(null)
}

async function renderTab(props = {}) {
  // חתימת-הלשונית היא { project } בלבד — קריאה-בלבד, בלי canEdit/onScopeChange.
  const utils = render(<LogisticsTab project={project()} {...props} />)
  await waitFor(() => expect(screen.queryByTestId('skeleton-table')).not.toBeInTheDocument())
  return utils
}

beforeEach(() => {
  authState.permissions = { לוגיסטיקה: 'edit', 'הצעות מחיר': 'edit' }
  vi.clearAllMocks()
})

describe('שלושת מצבי-הריק נקראים שונה — S-26', () => {
  it('ריק כדין: ההצעה קריאה וכוללת שירותי דיילות בלבד', async () => {
    mockHappyPath({ rows: [], changes: [] })
    getQuote.mockResolvedValue({ quote_id: 6, quote_services: [{ sku: 'H-SRV' }] })
    await renderTab()
    expect(screen.getByText(LEGAL_EMPTY_TITLE)).toBeInTheDocument()
    // פרויקט בלי פריטים נספר כמוכן לוגיסטית — לא '0/0' ולא אזהרה.
    expect(screen.getByTestId('logistics-tile-ready')).toHaveTextContent('✓ אין פריטים')
  })

  it('אין הרשאה: המבחין עצמו חוזר null — והמדד מציג — ולעולם לא 0/0', async () => {
    mockHappyPath({ rows: [], changes: [] })
    getQuote.mockResolvedValue(null) // ‏RLS מחזיר אפס שורות בלי שגיאה — זה הסימן.
    await renderTab()
    expect(screen.getByText(NO_PERMISSION_SENTENCE)).toBeInTheDocument()
    const tile = screen.getByTestId('logistics-tile-ready')
    expect(tile).toHaveTextContent('—')
    expect(tile.textContent).not.toContain('0')
  })

  it('ריק שאינו כדין: להצעה יש שורות-מוצר ⇒ תקלה עם "נסי שוב", לא "אין פריטים"', async () => {
    mockHappyPath({ rows: [], changes: [] })
    getQuote.mockResolvedValue({
      quote_id: 6,
      quote_services: [{ sku: 'H-SRV' }, { sku: 'B-REG-TAG' }],
    })
    await renderTab()
    expect(screen.getByText(BROKEN_EMPTY_DETAIL)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
    expect(screen.queryByText(LEGAL_EMPTY_TITLE)).not.toBeInTheDocument()
    // המדד חסום גם כאן: '—' ולא '0 מתוך 0' עם '✓' מעל פאנל-השגיאה — השקר של S-26.
    const tile = screen.getByTestId('logistics-tile-ready')
    expect(tile).toHaveTextContent('—')
    expect(tile.textContent).not.toContain('✓')
    expect(tile.textContent).not.toContain('0')
  })

  it('כשל-טעינה אמיתי: הודעה עברית נעולה + נסי שוב, לעולם לא רשימה ריקה בשקט', async () => {
    getProjectLogistics.mockRejectedValue(new Error('network'))
    getProjectChanges.mockResolvedValue([])
    getProjectQuoteMeta.mockResolvedValue(null)
    getPricingCatalog.mockResolvedValue(catalogFixture())
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderTab()
    expect(screen.getByText('נתוני הלוגיסטיקה של הפרויקט לא נטענו.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
    expect(screen.queryByText(LEGAL_EMPTY_TITLE)).not.toBeInTheDocument()
    errorSpy.mockRestore()
  })
})

describe('מדד-המוכנות — רק ready נספר (§1.3)', () => {
  it('פריט שהוזמן ולא הגיע זהה במדד לפריט שאיש לא נגע בו', async () => {
    mockHappyPath({
      rows: [
        {
          sku: 'B-REG-TAG',
          serial_number: 1,
          planned_qty: 10,
          actual_qty: 10,
          item_status: 'ready',
        },
        {
          sku: 'B-FAB-LAN',
          serial_number: 2,
          planned_qty: 10,
          actual_qty: 0,
          item_status: 'ordered',
        },
        {
          sku: 'H-SRV',
          serial_number: 3,
          planned_qty: 10,
          actual_qty: 0,
          item_status: 'not_started',
        },
      ],
      changes: [],
    })
    await renderTab()
    expect(screen.getByTestId('logistics-tile-ready')).toHaveTextContent('1 מתוך 3')
  })
})

describe('תקציב-הצבע: הגדלה ענבר, הקטנה אפורה, אפס שורות אדומות', () => {
  it('ההגדלה מסומנת ענבר (יוצרת חוסר) וההקטנה רגועה (עובדה)', async () => {
    mockHappyPath()
    await renderTab()
    const increase = screen.getByTestId('logistics-change-note-B-REG-TAG-1')
    expect(increase).toHaveTextContent('הוגדל מ-300')
    expect(increase.className).toContain('text-amber-700')
    const decrease = screen.getByTestId('logistics-change-note-B-FAB-LAN-2')
    expect(decrease).toHaveTextContent('הוקטן מ-300')
    expect(decrease.className).toContain('text-slate-400')
  })
})

describe('האריח השלישי — חשבון 2.2: ההנחה מוחלת בצד-הלקוח על revenue_delta', () => {
  it('‏+400 −300 בהנחת 5%+10% ⇒ ‏+85.00 ₪ עם "אחרי הנחת הלקוח"', async () => {
    mockHappyPath()
    await renderTab()
    const tile = screen.getByTestId('logistics-tile-impact')
    expect(tile).toHaveTextContent('+85.00 ₪')
    expect(tile).toHaveTextContent('אחרי הנחת הלקוח')
    // משפט-הסיכום: טרום-הנחה, אחוז-ההנחה, ואחרי-הנחה — מספרים חיים.
    const totals = screen.getByTestId('logistics-totals')
    expect(totals).toHaveTextContent('+100.00 ₪')
    expect(totals).toHaveTextContent('15%')
    expect(totals).toHaveTextContent('+85.00 ₪')
  })

  it('אין שינויים ⇒ טקסט ולא 0 — "אין שינויים עדיין"', async () => {
    mockHappyPath({ changes: [] })
    await renderTab()
    expect(screen.getByTestId('logistics-tile-impact')).toHaveTextContent('אין שינויים עדיין')
  })
})

describe('money_visible=false — צורת אין-ההרשאה בשלושת אתרי-הכסף', () => {
  it('האריח, עמודת-ההיסטוריה ומשפט-הסיכום — כולם — עם הסבר, לא מקף חשוף', async () => {
    mockHappyPath({ changes: changesFixture({ moneyVisible: false }), meta: null })
    await renderTab()
    // האריח: — עם משפט-ההרשאה.
    const tile = screen.getByTestId('logistics-tile-impact')
    expect(tile).toHaveTextContent('—')
    expect(screen.getByTestId('logistics-impact-no-permission')).toHaveTextContent(
      MONEY_HIDDEN_SENTENCE,
    )
    // תאי-העמודה: — (הדגל מכריע, לא price === null).
    expect(screen.getByTestId('logistics-history-money-1')).toHaveTextContent('—')
    expect(screen.getByTestId('logistics-history-money-2')).toHaveTextContent('—')
    // משפט-הסיכום מוחלף בהסבר-ההרשאה; ‏0.00 ₪ הוא השקר של S-2 ואסור שיופיע.
    expect(screen.getByTestId('logistics-totals-no-permission')).toHaveTextContent(
      MONEY_HIDDEN_SENTENCE,
    )
    expect(screen.queryByTestId('logistics-totals')).not.toBeInTheDocument()
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument()
  })
})

describe('הכפתור "שינוי תכולה" — הוסר מהלשונית בהכרעת-ישי-מואצלת 19/08', () => {
  it('הכפתור אינו קיים בלשונית — הראשי היחיד יושב בכותרת-הכרטיס (שניים באותו תפקיד ⇒ אחד נמחק)', async () => {
    mockHappyPath()
    await renderTab()
    expect(screen.queryByTestId('logistics-scope-button')).not.toBeInTheDocument()
    expect(screen.queryByText('שינוי תכולה')).not.toBeInTheDocument()
  })

  it('אין CTA של "הוסף פריט ראשון" במצב-הריק — הוספה היא שינוי-תכולה, דרך כפתור-הכותרת', async () => {
    mockHappyPath({ rows: [], changes: [] })
    getQuote.mockResolvedValue({ quote_id: 6, quote_services: [{ sku: 'H-SRV' }] })
    await renderTab()
    expect(screen.queryByText(/הוסף פריט/)).not.toBeInTheDocument()
  })
})

describe('טבלת-הפריטים — קריאה בלבד, בסדר "רחוק ממוכן תחילה"', () => {
  it('המסביר מופיע מילולית, והסטטוסים תגים ולא פקדים', async () => {
    mockHappyPath()
    await renderTab()
    expect(
      screen.getByText(/מי שמעדכנת אותם היא מנהלת הלוגיסטיקה, במסך שלה\. כאן הם לקריאה בלבד\./),
    ).toBeInTheDocument()
    expect(screen.getAllByText('טרם החל').length).toBeGreaterThan(0)
  })

  // ㉒ — ההערה של מנהלת הלוגיסטיקה נראית למנהלת הפרויקטים. הצורה הוכרעה 26/08/2026:
  // תת-שורה ברוחב מלא מתחת לפריט; שורה בלי הערה אינה מייצרת תת-שורה כלל.
  // המערך מצטט את `#107` החי (`data-set.md`): ההערה היחידה במערך יושבת על שורה 1.
  it('ההערה מוצגת כתת-שורה ברוחב מלא — ורק על השורה שיש בה הערה (㉒)', async () => {
    mockHappyPath({
      rows: [
        {
          sku: 'B-REG-TAG',
          serial_number: 1,
          planned_qty: 150,
          actual_qty: 0,
          item_status: 'ordered',
          notes: 'הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא.',
        },
        {
          sku: 'B-SAT-LAN',
          serial_number: 2,
          planned_qty: 150,
          actual_qty: 0,
          item_status: 'not_started',
          notes: null,
        },
        {
          sku: 'B-ECO-TAG',
          serial_number: 3,
          planned_qty: 50,
          actual_qty: 50,
          item_status: 'ready',
          notes: '   ',
        },
        {
          sku: '01WEB',
          serial_number: 4,
          planned_qty: 1,
          actual_qty: 0,
          item_status: 'not_started',
        },
      ],
      changes: [],
    })
    await renderTab()

    const noteRow = screen.getByTestId('logistics-note-B-REG-TAG-1')
    expect(noteRow).toHaveTextContent('הערת הלוגיסטיקה:')
    expect(noteRow).toHaveTextContent('הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא.')
    // ברוחב מלא — ארבע העמודות הקיימות אינן משנות רוחב בגלל ההערה.
    expect(noteRow.querySelector('td')).toHaveAttribute('colspan', '4')
    // ושלוש האחרות — אפס אלמנט-הערה. גם `null` וגם רווחים-בלבד אינם הערה.
    expect(screen.getAllByTestId(/^logistics-note-/)).toHaveLength(1)
  })

  it('ready ממוין אחרון — מה שרחוק ביותר ממוכן תחילה', async () => {
    mockHappyPath({
      rows: [
        {
          sku: 'B-REG-TAG',
          serial_number: 1,
          planned_qty: 10,
          actual_qty: 10,
          item_status: 'ready',
        },
        {
          sku: 'B-FAB-LAN',
          serial_number: 2,
          planned_qty: 10,
          actual_qty: 0,
          item_status: 'not_started',
        },
      ],
      changes: [],
    })
    await renderTab()
    const rows = screen.getAllByTestId(/^logistics-row-/)
    expect(rows[0].dataset.testid).toBe('logistics-row-B-FAB-LAN-2')
    expect(rows[1].dataset.testid).toBe('logistics-row-B-REG-TAG-1')
  })
})

// 🔴 שני הכיוונים של מבחין-הריק — כל אחד נמדד כשבור לפני התיקון (26/08/2026).
// המבחין נשען עד אז על **ההצעה בלבד**, ולכן טעה בשני הכיוונים ההפוכים.
describe('LogisticsTab — חסימת-הרשאה אינה "תקלה", וריק-כדין אינו "אין הרשאה"', () => {
  it('🔴 חסומה על לוגיסטיקה + רואה הצעות ⇒ "אין הרשאה ללוגיסטיקה" — ולא פאנל-תקלה', async () => {
    // מנהלת הכספים והלקוחות: `blocked` על לוגיסטיקה, `view` על הצעות מחיר.
    authState.permissions = { לוגיסטיקה: 'blocked', 'הצעות מחיר': 'view' }
    getProjectLogistics.mockResolvedValue([]) // RLS: אפס שורות, בלי שגיאה
    getProjectChanges.mockResolvedValue([])
    getProjectQuoteMeta.mockResolvedValue(null)
    getPricingCatalog.mockResolvedValue(catalogFixture())
    // ההצעה **כן** נקראית לה ויש בה פריטי-מוצר — זה מה שהוליד קודם את "תקלה".
    getQuote.mockResolvedValue({ quote_services: [{ sku: 'B-REG-TAG', qty: 300 }] })

    render(<LogisticsTab project={{ project_id: 15, quote_id: 31 }} />)

    const panel = await screen.findByTestId('logistics-state-no-permission-logistics')
    expect(panel).toHaveTextContent('אין לך הרשאה לצפות בפריטי הלוגיסטיקה')
    // 🚫 ולא הפאנל שמאשים את המערכת:
    expect(screen.queryByTestId('logistics-state-broken')).toBeNull()
    // 🚫 ולא המשפט שמדבר על **ההצעה** — היא כן רשאית לראות אותה:
    expect(screen.queryByTestId('logistics-state-no-permission')).toBeNull()
    // והמדד חסום — לעולם לא "0 מתוך 0" עם ✓ (‏S-26).
    expect(screen.getByTestId('logistics-tile-ready')).toHaveTextContent('—')
  })

  it('🔴 מנהלת הלוגיסטיקה על אירוע דיילות-בלבד ⇒ "ריק כדין", ולא "אין לך הרשאה"', async () => {
    // היא `edit` על לוגיסטיקה ו-`blocked` על הצעות מחיר — ולכן `getQuote` חוזרת ריקה.
    authState.permissions = { לוגיסטיקה: 'edit', 'הצעות מחיר': 'blocked' }
    getProjectLogistics.mockResolvedValue([])
    getProjectChanges.mockResolvedValue([])
    getProjectQuoteMeta.mockResolvedValue(null)
    getPricingCatalog.mockResolvedValue(catalogFixture())
    getQuote.mockResolvedValue(null) // ‏RLS על 'הצעות מחיר' — אפס שורות בלי שגיאה

    render(<LogisticsTab project={{ project_id: 11, quote_id: 24 }} />)

    // המצב הנכון היום הוא "אין הרשאה **להצעה**" — כי באמת אין לה, והמבחין באמת חסום.
    // 🔑 מה שחשוב: **זה לא הענף החדש**, ולכן התיקון לא גזל ממנה את ההבחנה הקיימת.
    await waitFor(() => {
      expect(screen.queryByTestId('logistics-state-no-permission-logistics')).toBeNull()
    })
  })
})
