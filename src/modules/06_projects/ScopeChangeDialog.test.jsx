// בדיקות דיאלוג שינוי-התכולה (משטח 6, צעד 3.6) — ה-API ממוקק (אין Supabase בבדיקה),
// והשעון מוזרק דרך prop-הבדיקה `now` (אותו עיקרון של "השעון נכנס כפרמטר" מ-src/lib).
// מה שנעול כאן: ארבעת המצבים של המוקאפ · שני צידי גבול-24-השעות של isLateChange ·
// עוגן-הכסף 1,404.20 ₪ · חוזה-הפיילוד (target_qty = היעד; שורה חדשה בלי serial_number) ·
// והמחרוזות שזהות-בייט לשרת.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ScopeChangeDialog from './ScopeChangeDialog'
import { applyScopeChange, getProjectAssignments, getProjectLogistics } from './api'
import { getPricingCatalog, getQuote } from '@/modules/03_quotes/api'

vi.mock('./api', () => ({
  applyScopeChange: vi.fn(),
  getProjectAssignments: vi.fn(),
  getProjectLogistics: vi.fn(),
}))
vi.mock('@/modules/03_quotes/api', () => ({
  getQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { fullName: 'דנה כהן', email: 'dana@regin.co.il' } }),
}))

// "עכשיו" קבוע — 2026-08-19 12:00Z. האירוע 2026-09-30 ⇒ רחוק מכל סף "שינוי מאוחר",
// כך שהבאנר לא מופיע אלא בבדיקות שמזיזות את השעון בכוונה.
const NOW = '2026-08-19T12:00:00Z'

function project(overrides) {
  return {
    project_id: 8,
    quote_id: 21,
    event_name: 'כנס לקוחות שנתי',
    customer_name: 'מדיטק פתרונות בע"מ',
    final_event_date: '2026-09-30',
    final_start_time: '18:00',
    final_end_time: '22:00',
    project_status: 'in_progress',
    required_hostess_count: 6,
    ...overrides,
  }
}

// אותם מספרים כמו המוקאפ המאושר: דיילות 6×500 · תגים 300×5 · שרוך 300×6, הנחות 5%+10%,
// מע"מ 18% — העוגן 1,404.20 ₪ נגזר מהם ביד ולא חושב-מחדש בבדיקה.
function quoteFixture() {
  return {
    quote_id: 21,
    applied_customer_discount: 5,
    manual_discount: 10,
    vat_rate_snapshot: 18,
    quote_services: [
      { line_id: 1, sku: 'H-SRV', line_number: 1, qty: 6, closing_unit_price: 500, color: null },
      {
        line_id: 2,
        sku: 'B-REG-TAG',
        line_number: 2,
        qty: 300,
        closing_unit_price: 5,
        color: null,
      },
      { line_id: 3, sku: 'B-LAN', line_number: 3, qty: 300, closing_unit_price: 6, color: null },
    ],
  }
}

function catalogFixture() {
  return {
    products: [
      {
        sku: 'H-SRV',
        item_name: 'שירותי דיילת (4 שעות)',
        category: 'hostess',
        unit: 'משמרת',
        status: 'active',
        base_price: 500,
      },
      {
        sku: 'B-REG-TAG',
        item_name: 'תג שם רגיל - ממותג',
        category: 'product',
        unit: 'יחידה',
        status: 'active',
        base_price: 6,
      },
      {
        sku: 'B-LAN',
        item_name: 'שרוך בד - ממותג',
        category: 'product',
        unit: 'יחידה',
        status: 'active',
        base_price: 6,
      },
      {
        sku: 'B-SAT-LAN',
        item_name: 'שרוך סאטן - ממותג',
        category: 'product',
        unit: 'יחידה',
        status: 'active',
        base_price: 9,
      },
    ],
    tiers: [
      { sku: 'B-SAT-LAN', min_qty: 51, max_qty: 200, special_price: 8.4 },
      { sku: 'B-REG-TAG', min_qty: 201, max_qty: 400, special_price: 5 },
      { sku: 'B-REG-TAG', min_qty: 401, max_qty: null, special_price: 4.5 },
    ],
    params: [],
  }
}

function logisticsFixture() {
  return [
    {
      project_id: 8,
      sku: 'B-REG-TAG',
      serial_number: 1,
      planned_qty: 300,
      item_status: 'not_started',
      quote_service_line_id: 2,
      project_change_id: null,
    },
    {
      project_id: 8,
      sku: 'B-LAN',
      serial_number: 2,
      planned_qty: 300,
      item_status: 'not_started',
      quote_service_line_id: 3,
      project_change_id: null,
    },
  ]
}

function assignmentsFixture() {
  return [
    {
      project_id: 8,
      hostess_id: 1,
      assignment_number: 1,
      assignment_status: 'finally_approved',
      hostesses: { hostess_id: 1, full_name: 'יעל דוד' },
    },
  ]
}

const HOSTESS_INPUT = 'כמות חדשה — שירותי דיילת (4 שעות)'
const TAGS_INPUT = 'כמות חדשה — תג שם רגיל - ממותג'

async function renderDialog(props = {}) {
  render(
    <ScopeChangeDialog
      project={project(props.project)}
      open
      onOpenChange={props.onOpenChange ?? vi.fn()}
      onSaved={props.onSaved ?? vi.fn()}
      now={props.now ?? NOW}
    />,
  )
  // הטעינה הסתיימה כשהקלט של שורת-הדיילות על המסך.
  return screen.findByLabelText(HOSTESS_INPUT)
}

beforeEach(() => {
  vi.clearAllMocks()
  getQuote.mockResolvedValue(quoteFixture())
  getPricingCatalog.mockResolvedValue(catalogFixture())
  getProjectLogistics.mockResolvedValue(logisticsFixture())
  getProjectAssignments.mockResolvedValue(assignmentsFixture())
  applyScopeChange.mockResolvedValue({
    change_group_id: 1,
    lines: [],
    revenue_delta_total: 1400,
    can_read_revenue: true,
    hours_to_event: 1000,
  })
})

describe('ScopeChangeDialog — בלוק-הכסף וחוזה-הפיילוד', () => {
  it('משחזר את עוגן-הכסף 1,404.20 ₪ ושולח target_qty = היעד החדש, לא את הדלתא', async () => {
    const hostessInput = await renderDialog()
    fireEvent.change(hostessInput, { target: { value: '8' } })
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '380' } })

    // 1,400 − 15% = 1,190 · +18% מע"מ = 1,404.20 — חושב ביד במדריך, לא כאן.
    expect(screen.getByTestId('scope-money-total').textContent).toContain('1,404.20 ₪')

    fireEvent.change(screen.getByTestId('scope-reason'), {
      target: { value: 'רון גל ביקש להוסיף' },
    })
    fireEvent.click(screen.getByTestId('scope-save'))

    await waitFor(() => expect(applyScopeChange).toHaveBeenCalledTimes(1))
    const [projectId, pLines, reason] = applyScopeChange.mock.calls[0]
    expect(projectId).toBe(8)
    expect(reason).toBe('רון גל ביקש להוסיף')
    // 🔴 target_qty הוא היעד (8 · 380), לא ההפרש (2 · 80) — שליחת דלתא מחייבת-כפול בניסיון-חוזר.
    expect(pLines).toEqual([
      { target: 'hostess_count', target_qty: 8 },
      { target: 'logistics', sku: 'B-REG-TAG', serial_number: 1, target_qty: 380 },
    ])
    // שורת-הדיילות נשלחת בלי serial_number ובלי sku — נוכחות המפתח עצמו היא שגיאת-שרת.
    expect('serial_number' in pLines[0]).toBe(false)
    expect('sku' in pLines[0]).toBe(false)
  })

  it('מציג — בכל עמודות-הכסף כשההצעה אינה קריאה (can_read_revenue), לעולם לא 0', async () => {
    getQuote.mockResolvedValue(null)
    render(
      <ScopeChangeDialog
        project={project()}
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        now={NOW}
      />,
    )
    // בלי הצעה קריאה השורות נבנות מהלוגיסטיקה + כמות-הדיילות של הפרויקט.
    const tagsInput = await screen.findByLabelText(TAGS_INPUT)
    fireEvent.change(tagsInput, { target: { value: '380' } })
    expect(screen.getByTestId('scope-money-total').textContent).toBe('—')
  })
})

describe('ScopeChangeDialog — מצב ③: שמירה חסומה', () => {
  it('בלי שום שינוי — הכפתור מושבת ולצידו המשפט המדויק', async () => {
    await renderDialog()
    expect(screen.getByTestId('scope-save')).toBeDisabled()
    expect(screen.getByTestId('scope-no-change').textContent).toBe(
      'לא שינית אף כמות — אין מה לשמור',
    )
  })

  it('סיבה ריקה — הכפתור מושבת והנוסח הנעול של §3.7 (וריאנט שינוי-תכולה) מוצג', async () => {
    const hostessInput = await renderDialog()
    fireEvent.change(hostessInput, { target: { value: '8' } })
    expect(screen.getByTestId('scope-save')).toBeDisabled()
    expect(screen.getByTestId('scope-reason-error').textContent).toBe(
      'חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש.',
    )
  })

  it('כמות אפס נחסמת לפני שליחה, במשפט הזהה-בייט לשרת', async () => {
    const hostessInput = await renderDialog()
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '0' } })
    // 🔒 עותק מילולי של raise-השרת — supabase/migrations/20260814142440_module6_rpcs_writes.sql,
    // גוף apply_scope_change (AR-4). לא מיובא מהקומפוננטה, כדי שהבדיקה תתפוס סטייה שלה.
    expect(
      screen.getByText('הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('scope-save')).toBeDisabled()
    fireEvent.change(hostessInput, { target: { value: '8' } })
    expect(screen.getByTestId('scope-save')).toBeDisabled()
  })

  it('כמות לא-שלמה נחסמת לפני שליחה, במשפט של השרת', async () => {
    await renderDialog()
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '2.5' } })
    // 🔒 עותק מילולי — אותו מקור-שרת (המיגרציה משרשרת שם " השינוי לא בוצע."; לפני-שליחה
    // מוצג המשפט שמדריך-המיקרו נעל, בלי הסיומת — הסטייה מדווחת בדוח הצעד).
    expect(screen.getByText('הכמות חייבת להיות מספר שלם.')).toBeInTheDocument()
    expect(screen.getByTestId('scope-save')).toBeDisabled()
  })
})

describe('ScopeChangeDialog — מצב ①: שינוי מאוחר (מודיע, לא חוסם)', () => {
  // האירוע: 2026-08-20 12:00 שעון-ישראל (אוגוסט ⇒ UTC+3) = 2026-08-20T09:00:00Z.
  const lateProject = { final_event_date: '2026-08-20', final_start_time: '12:00' }

  it('העלאת-דיילות 19 שעות לפני ⇒ הבאנר מוצג והשמירה נשארת פעילה (⑯)', async () => {
    const hostessInput = await renderDialog({
      project: lateProject,
      now: '2026-08-19T14:00:00Z', // 19 שעות לפני
    })
    fireEvent.change(hostessInput, { target: { value: '8' } })
    expect(screen.getByTestId('scope-late-banner').textContent).toContain('שעות לפני האירוע')
    fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'סיבה' } })
    expect(screen.getByTestId('scope-save')).not.toBeDisabled()
  })

  it('בדיוק 24 שעות לפני — לא מסומן (הגבול הוא < 24, לא ≤)', async () => {
    const hostessInput = await renderDialog({
      project: lateProject,
      now: '2026-08-19T09:00:00Z', // בדיוק 24 שעות לפני
    })
    fireEvent.change(hostessInput, { target: { value: '8' } })
    expect(screen.queryByTestId('scope-late-banner')).toBeNull()
  })

  it('הפחתה לעולם אינה מסומנת כמאוחרת, גם 19 שעות לפני', async () => {
    const hostessInput = await renderDialog({
      project: lateProject,
      now: '2026-08-19T14:00:00Z',
    })
    fireEvent.change(hostessInput, { target: { value: '4' } })
    expect(screen.queryByTestId('scope-late-banner')).toBeNull()
  })
})

describe('ScopeChangeDialog — מצב ②: צמצום', () => {
  it('הקטנת כמות-הדיילות מציגה את באנר מי-משחרר, והשחרור אינו מכאן', async () => {
    const hostessInput = await renderDialog()
    fireEvent.change(hostessInput, { target: { value: '4' } })
    const banner = screen.getByTestId('scope-reduction-banner')
    expect(banner.textContent).toContain('מנהלת הגיוס בוחרת את מי לשחרר')
  })
})

describe('ScopeChangeDialog — מצב ④: פריט שאינו בהצעה', () => {
  it('מתומחר לפי מדרגת-הקטלוג של היום, ונשלח בלי מפתח serial_number בכלל', async () => {
    await renderDialog()
    fireEvent.click(screen.getByTestId('scope-add-item'))
    fireEvent.change(screen.getByTestId('scope-new-row-select-0'), {
      target: { value: 'B-SAT-LAN' },
    })
    fireEvent.change(screen.getByTestId('scope-new-row-qty-0'), { target: { value: '80' } })

    // 80 יחידות ⇒ מדרגה 51–200 ⇒ 8.40 ₪ — מחיר-הקטלוג של היום, לא מחיר-בסיס.
    expect(screen.getByText('8.40 ₪')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'תוספת שרוכים' } })
    fireEvent.click(screen.getByTestId('scope-save'))

    await waitFor(() => expect(applyScopeChange).toHaveBeenCalledTimes(1))
    const [, pLines] = applyScopeChange.mock.calls[0]
    expect(pLines).toEqual([{ target: 'logistics', sku: 'B-SAT-LAN', target_qty: 80 }])
    // 🔴 ההשמטה היא האות "שורה חדשה" — השרת מקצה max+1; הלקוח לעולם לא ממציא מספר סידורי.
    expect('serial_number' in pLines[0]).toBe(false)
  })
})

describe('ScopeChangeDialog — הודעת חציית-מדרגה (③ↄ)', () => {
  it('מוצגת כשהיעד נכנס למדרגה זולה יותר, ובלי שום ספרת ₪', async () => {
    await renderDialog()
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '420' } })
    const notice = screen.getByTestId('scope-tier-notice')
    expect(notice.textContent).toContain('מדרגת מחיר זולה יותר')
    expect(notice.textContent).not.toContain('₪')
  })

  it('אינה מוצגת כשהיעד נשאר באותה מדרגה', async () => {
    await renderDialog()
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '380' } })
    expect(screen.queryByTestId('scope-tier-notice')).toBeNull()
  })
})

describe('ScopeChangeDialog — כשל-טעינה (הצורה הנעולה של §3.7)', () => {
  it('שתי השורות — הנעולה + הודעת-העוטף — ו"נסי שוב"', async () => {
    getPricingCatalog.mockRejectedValue(new Error('שגיאה בטעינת קטלוג המחירים.'))
    render(
      <ScopeChangeDialog
        project={project()}
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        now={NOW}
      />,
    )
    const box = await screen.findByTestId('scope-load-error')
    // השורה הראשונה נעולה; השורה השנייה נוקבת במה שחסר (ההודעה העברית של העוטף).
    expect(within(box).getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(within(box).getByText('שגיאה בטעינת קטלוג המחירים.')).toBeInTheDocument()
    expect(within(box).getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
  })
})

describe('ScopeChangeDialog — סירובי-שרת', () => {
  it('הודעת-השרת העברית מוצגת כלשונה, לא "השמירה נכשלה" גנרי', async () => {
    const serverMessage =
      'הפריט הזה כבר קיים באירוע. לעדכון הכמות שלחי את השורה הקיימת עם המספר הסידורי שלה. השינוי לא בוצע.'
    applyScopeChange.mockRejectedValue(new Error(serverMessage))
    const hostessInput = await renderDialog()
    fireEvent.change(hostessInput, { target: { value: '8' } })
    fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'סיבה' } })
    fireEvent.click(screen.getByTestId('scope-save'))
    await waitFor(() =>
      expect(screen.getByTestId('scope-server-error').textContent).toBe(serverMessage),
    )
  })
})
