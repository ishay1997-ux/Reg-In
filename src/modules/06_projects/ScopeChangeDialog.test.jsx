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

// `actual_qty` מפורש בשתי השורות — הוא חצי מכלל-ההסרה (㊱), ושורה שאינה נוקבת בו
// קוראת כאילו הכלל אינו רלוונטי לה.
function logisticsFixture() {
  return [
    {
      project_id: 8,
      sku: 'B-REG-TAG',
      serial_number: 1,
      planned_qty: 300,
      actual_qty: 0,
      item_status: 'not_started',
      quote_service_line_id: 2,
      project_change_id: null,
    },
    {
      project_id: 8,
      sku: 'B-LAN',
      serial_number: 2,
      planned_qty: 300,
      actual_qty: 0,
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

  // 🔴 ההודעה הגורפת הישנה ("להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה") נמחקה מהשרת
  // ב-M5-7 ⇒ אין לה יותר מקור, ובמקומה שתי מראות ממוקדות-יעד.
  it('אפס בשורת-הדיילות נחסם לפני שליחה, במשפט הזהה-בייט לשרת (AR-10)', async () => {
    const hostessInput = await renderDialog()
    fireEvent.change(hostessInput, { target: { value: '0' } })
    // 🔒 עותק מילולי של raise-השרת — supabase/migrations/
    // 20260826002448_module5_scope_change_reset_removal.sql, גוף apply_scope_change.
    // לא מיובא מהקומפוננטה, כדי שהבדיקה תתפוס סטייה שלה.
    expect(screen.getByText('כמות הדיילות חייבת להיות גדולה מאפס.')).toBeInTheDocument()
    // 🔴 והרצפה של שורת-הדיילות נשארת 1. המוקאפ המאושר צייר `min="0"` בשלוש השורות
    // כולל זו — אבל `min` הוא התנהגות, והאפיון גובר על הציור (AR-10 + ה-CHECK במסד).
    expect(hostessInput).toHaveAttribute('min', '1')
    expect(screen.getByTestId('scope-save')).toBeDisabled()
    // שגיאה בשורה אחת חוסמת שמירה גם כששורה אחרת שונתה כדין ויש סיבה.
    fireEvent.change(screen.getByLabelText(TAGS_INPUT), { target: { value: '380' } })
    fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'סיבה' } })
    expect(screen.getByTestId('scope-save')).toBeDisabled()
  })

  it('אפס בשורת פריט חדש נחסם — אין "הסרה" של מה שטרם קיים (G11b)', async () => {
    await renderDialog()
    fireEvent.click(screen.getByTestId('scope-add-item'))
    fireEvent.change(screen.getByTestId('scope-new-row-select-0'), {
      target: { value: 'B-SAT-LAN' },
    })
    fireEvent.change(screen.getByTestId('scope-new-row-qty-0'), { target: { value: '0' } })
    expect(screen.getByText('כמות של פריט חדש חייבת להיות גדולה מאפס.')).toBeInTheDocument()
    expect(screen.getByTestId('scope-new-row-qty-0')).toHaveAttribute('min', '1')
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

// 🔄ה · ㊳ · ㊱ · ㉚ — הסרת פריט אינה מסך חדש: היא נעשית כאן, ורצפת-הספינר דינמית לפי שני
// התנאים. **שני מסלולים לאותו יעד:** פקד "הסר פריט" מפורש (המסלול שהמשתמשת מוצאת), והקלדת
// `0` ביד (המסלול הישן, שלא נגרע — הבדיקות שלו נשארו כלשונן). המערך מצטט את `#107` החי
// (`docs/specs/module_05_logistics/data-set.md`): שלושת מצבי-הפריט על מסך אחד, ושני צדי
// כלל-ההסרה.
describe('ScopeChangeDialog — הסרה = הקלדת 0 (M5-7 · ㊱ · ㉚)', () => {
  const SAT_INPUT = 'כמות חדשה — שרוך סאטן - ממותג'
  const ECO_INPUT = 'כמות חדשה — תג שם אקולוגי - ממותג'

  // satActualQty > 0 מייצר את המקרה השני של ㊱ — שאין לו אף שורה חיה במסד (נמדד 26/08),
  // ולכן הוא מוכח כאן ורק כאן.
  function removalScene({ satActualQty = 0 } = {}) {
    const catalog = catalogFixture()
    catalog.products.push({
      sku: 'B-ECO-TAG',
      item_name: 'תג שם אקולוגי - ממותג',
      category: 'product',
      unit: 'יחידה',
      status: 'active',
      base_price: 7,
    })
    getPricingCatalog.mockResolvedValue(catalog)
    getQuote.mockResolvedValue({
      quote_id: 21,
      applied_customer_discount: 5,
      manual_discount: 10,
      vat_rate_snapshot: 18,
      quote_services: [
        { line_id: 1, sku: 'H-SRV', line_number: 1, qty: 2, closing_unit_price: 500, color: null },
        {
          line_id: 2,
          sku: 'B-REG-TAG',
          line_number: 2,
          qty: 150,
          closing_unit_price: 5,
          color: null,
        },
        {
          line_id: 3,
          sku: 'B-SAT-LAN',
          line_number: 3,
          qty: 150,
          closing_unit_price: 9,
          color: null,
        },
        {
          line_id: 4,
          sku: 'B-ECO-TAG',
          line_number: 4,
          qty: 50,
          closing_unit_price: 7,
          color: null,
        },
      ],
    })
    getProjectLogistics.mockResolvedValue([
      {
        project_id: 8,
        sku: 'B-REG-TAG',
        serial_number: 1,
        planned_qty: 150,
        actual_qty: 0,
        item_status: 'ordered',
        quote_service_line_id: 2,
        project_change_id: null,
      },
      {
        project_id: 8,
        sku: 'B-SAT-LAN',
        serial_number: 2,
        planned_qty: 150,
        actual_qty: satActualQty,
        item_status: 'not_started',
        quote_service_line_id: 3,
        project_change_id: null,
      },
      {
        project_id: 8,
        sku: 'B-ECO-TAG',
        serial_number: 3,
        planned_qty: 50,
        actual_qty: 50,
        item_status: 'ready',
        quote_service_line_id: 4,
        project_change_id: null,
      },
    ])
  }

  const rowOf = (label) => screen.getByLabelText(label).closest('tr')

  it('מצב-הפריט מוצג בשורת-המשנה הקיימת — ולא כעמודה שביעית, ולא על שורת-הדיילות (㊳②)', async () => {
    removalScene()
    await renderDialog()
    expect(within(rowOf(TAGS_INPUT)).getByText('הוזמן')).toBeInTheDocument()
    expect(within(rowOf(SAT_INPUT)).getByText('טרם החל')).toBeInTheDocument()
    expect(within(rowOf(ECO_INPUT)).getByText('מוכן')).toBeInTheDocument()
    // שורת-הדיילות אינה שורת-לוגיסטיקה ⇒ אין לה מצב-פריט ואין לה תג.
    const hostessRow = rowOf(HOSTESS_INPUT)
    for (const label of ['טרם החל', 'הוזמן', 'מוכן']) {
      expect(within(hostessRow).queryByText(label)).toBeNull()
    }
    // ושש העמודות נשארו שש — עמודה שביעית הייתה מצרה את שתי עמודות-הכסף.
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
  })

  it('`טרם החל` + אפס שהגיע ⇒ הרצפה 0, האפס מתקבל, ונשלח כ-target_qty 0', async () => {
    removalScene()
    await renderDialog()
    const sat = screen.getByLabelText(SAT_INPUT)
    // ⚠️ השורה נתפסת **לפני** ההקלדה: משסומנה להסרה, שדה-הכמות מתחלף ב"יוסר" ואין יותר
    // תווית לחפש לפיה. ה-`<tr>` עצמו נשמר (אותו `key`) ⇒ ההפניה נשארת חיה.
    const satRow = rowOf(SAT_INPUT)
    expect(sat).toHaveAttribute('min', '0')
    // אין שורת-הסבר על שורה שמותר להסיר — ההסבר שמור לחסימה (㉚).
    expect(within(satRow).queryByRole('alert')).toBeNull()

    fireEvent.change(sat, { target: { value: '0' } })
    expect(within(satRow).queryByRole('alert')).toBeNull()
    fireEvent.change(screen.getByTestId('scope-reason'), {
      target: { value: 'הלקוח ויתר על השרוכים' },
    })
    expect(screen.getByTestId('scope-save')).not.toBeDisabled()

    fireEvent.click(screen.getByTestId('scope-save'))
    await waitFor(() => expect(applyScopeChange).toHaveBeenCalledTimes(1))
    const [, pLines] = applyScopeChange.mock.calls[0]
    expect(pLines).toEqual([
      { target: 'logistics', sku: 'B-SAT-LAN', serial_number: 2, target_qty: 0 },
    ])
  })

  it('`הוזמן` ⇒ הרצפה 1, ההסבר על המסך עוד לפני שהיא ניסתה, ואפס נחסם באותו משפט (㉚)', async () => {
    removalScene()
    await renderDialog()
    const tags = screen.getByLabelText(TAGS_INPUT)
    expect(tags).toHaveAttribute('min', '1')
    // 🔒 עותק מילולי של raise-השרת (M5-7) — לא מיובא מהקומפוננטה.
    expect(
      within(rowOf(TAGS_INPUT)).getByText('הפריט כבר הוזמן — לא ניתן להסירו'),
    ).toBeInTheDocument()

    fireEvent.change(tags, { target: { value: '0' } })
    expect(within(rowOf(TAGS_INPUT)).getByRole('alert').textContent).toBe(
      'הפריט כבר הוזמן — לא ניתן להסירו',
    )
    expect(screen.getByTestId('scope-save')).toBeDisabled()
  })

  it('`מוכן` ⇒ אותו חוק ואותו נוסח — הכסף כבר יצא (§7.31)', async () => {
    removalScene()
    await renderDialog()
    const eco = screen.getByLabelText(ECO_INPUT)
    expect(eco).toHaveAttribute('min', '1')
    expect(
      within(rowOf(ECO_INPUT)).getByText('הפריט כבר הוזמן — לא ניתן להסירו'),
    ).toBeInTheDocument()
    fireEvent.change(eco, { target: { value: '0' } })
    expect(within(rowOf(ECO_INPUT)).getByRole('alert').textContent).toBe(
      'הפריט כבר הוזמן — לא ניתן להסירו',
    )
  })

  it('`טרם החל` עם סחורה שהגיעה ⇒ הנוסח השני — היא צריכה לדעת איזה חוק חסם (㊱)', async () => {
    // התרחיש של ㊱ מילה-במילה: הגיעו 8 מתוך 150, והשורה אינה ניתנת להסרה לעולם.
    removalScene({ satActualQty: 8 })
    await renderDialog()
    const sat = screen.getByLabelText(SAT_INPUT)
    expect(sat).toHaveAttribute('min', '1')
    expect(
      within(rowOf(SAT_INPUT)).getByText('הגיעו כבר פריטים — לא ניתן להסיר'),
    ).toBeInTheDocument()
    fireEvent.change(sat, { target: { value: '0' } })
    expect(within(rowOf(SAT_INPUT)).getByRole('alert').textContent).toBe(
      'הגיעו כבר פריטים — לא ניתן להסיר',
    )
    // ושני הנוסחים אינם זהים — זו כל הנקודה של ההפרדה.
    expect(
      within(rowOf(TAGS_INPUT)).getByText('הפריט כבר הוזמן — לא ניתן להסירו'),
    ).toBeInTheDocument()
  })

  // 🔴 ㉚ בקורא-מסך (הכרעת-ישי 26/08/2026 — "למה לדחות ל-12 ולא לסדר עכשיו"): הסיבה
  // שחסמה אותה חייבת להישמע כשהמיקוד נכנס לשדה, לא רק להיראות לידו. בלי הקישור, מי
  // שמנווט במקלדת פוגש שדה שאינו מקבל אפס ולא שומע למה.
  it('㉚ — שורת-ההסבר מקושרת לשדה ב-aria-describedby, וגם נוסח-השגיאה אחרי הקלדה', async () => {
    removalScene()
    await renderDialog()
    const tags = screen.getByLabelText(TAGS_INPUT)

    // (א) מצב-ההסבר: הקישור קיים, מצביע לאלמנט קיים, וזה האלמנט שנושא את הסיבה.
    const hintId = tags.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    // מזהה חוקי — אין רווחים. `aria-describedby` היא רשימת-טוקנים מופרדת-ברווח, ולכן
    // מזהה עם רווח היה נקרא כמה מזהים שאינם קיימים והקישור היה נשבר בשקט.
    expect(hintId).not.toMatch(/\s/)
    expect(document.getElementById(hintId).textContent).toBe('הפריט כבר הוזמן — לא ניתן להסירו')

    // (ב) ואחרי שהיא מקלידה 0 — אותו קישור מצביע לנוסח-השגיאה, לא לאלמנט מת.
    fireEvent.change(tags, { target: { value: '0' } })
    const errId = tags.getAttribute('aria-describedby')
    expect(errId).toBeTruthy()
    expect(document.getElementById(errId).textContent).toBe('הפריט כבר הוזמן — לא ניתן להסירו')
    expect(document.getElementById(errId)).toHaveAttribute('role', 'alert')
  })

  it('שלילי בשורת-לוגיסטיקה קיימת אינו הסרה — ונחסם בנוסח נפרד משלו', async () => {
    removalScene()
    await renderDialog()
    fireEvent.change(screen.getByLabelText(SAT_INPUT), { target: { value: '-5' } })
    expect(within(rowOf(SAT_INPUT)).getByRole('alert').textContent).toBe(
      'הכמות אינה יכולה להיות שלילית.',
    )
  })

  it('בלוק "מה יקרה כשתשמרי" מקבל את שורת-ההסרה בנוסח שהוכרע (26/08/2026)', async () => {
    removalScene()
    await renderDialog()
    fireEvent.change(screen.getByLabelText(SAT_INPUT), { target: { value: '0' } })
    expect(
      screen.getByText(
        '"שרוך סאטן - ממותג" — השורה תוסר ממסך הלוגיסטיקה, וההסרה תירשם בהיסטוריית שינויי-התכולה.',
      ),
    ).toBeInTheDocument()
  })

  // ── הפקד המפורש: "הסר פריט" ────────────────────────────────────────────────────────
  // עד כה הדרך היחידה להסיר פריט הייתה להקליד `0` — ואין במערכת אף פעולה הרסנית אחרת
  // בלי פקד ששמו נקוב ("העבר לארכיון", "השבת", "ביטול פרויקט"). ההכרעה (㊳) לא השתנתה
  // בגרם: ההסרה עדיין שינוי-תכולה, עדיין של מנהלת הפרויקטים, ועדיין בדיאלוג הזה. מה
  // שהשתנה הוא **איך היא מבצעת אותה**.
  describe('פקד "הסר פריט" — המסלול המפורש', () => {
    const SAT_NAME = 'שרוך סאטן - ממותג'
    const TAGS_NAME = 'תג שם רגיל - ממותג'
    const ECO_NAME = 'תג שם אקולוגי - ממותג'
    const HOSTESS_NAME = 'שירותי דיילת (4 שעות)'
    // הפקד נשאל לפי **שמו הנגיש** ולא לפי testid: זה בדיוק מה שקורא-מסך מכריז, וזה גם
    // מה שמתהפך בסימון — כך שהשאילתה עצמה מאמתת את היפוך-התווית.
    const removeBtn = (name) => screen.getByRole('button', { name })

    it('שורה שעומדת בשני תנאי ㊱ מקבלת "הסר פריט" פעיל, ו"הוזמן"/"מוכן" מקבלות אותו מושבת ומנומק (㉚)', async () => {
      removalScene()
      await renderDialog()
      expect(removeBtn(`הסר פריט — ${SAT_NAME}`)).not.toBeDisabled()

      const tagsBtn = removeBtn(`הסר פריט — ${TAGS_NAME}`)
      expect(tagsBtn).toBeDisabled()
      // 🔒 עותק מילולי של raise-השרת — והסיבה **גלויה** על המסך ליד הפקד.
      // 🔴 ולא `title`: לכפתור מושבת אין hit-test, ולכן tooltip עליו לעולם אינו נפתח.
      expect(
        within(rowOf(TAGS_INPUT)).getByText('הפריט כבר הוזמן — לא ניתן להסירו'),
      ).toBeInTheDocument()
      expect(tagsBtn).not.toHaveAttribute('title')

      const ecoBtn = removeBtn(`הסר פריט — ${ECO_NAME}`)
      expect(ecoBtn).toBeDisabled()
      expect(
        within(rowOf(ECO_INPUT)).getByText('הפריט כבר הוזמן — לא ניתן להסירו'),
      ).toBeInTheDocument()
    })

    it('"טרם החל" עם סחורה שהגיעה ⇒ הכפתור מושבת בנוסח השני של ㊱, לא בראשון', async () => {
      removalScene({ satActualQty: 8 })
      await renderDialog()
      expect(removeBtn(`הסר פריט — ${SAT_NAME}`)).toBeDisabled()
      expect(
        within(rowOf(SAT_INPUT)).getByText('הגיעו כבר פריטים — לא ניתן להסיר'),
      ).toBeInTheDocument()
    })

    it('שורת-הדיילות ושורת "פריט חדש" אינן מקבלות פקד-הסרה, ואינן מתבלבלות עם "הסרה" שכבר קיים שם', async () => {
      removalScene()
      await renderDialog()
      // AR-10 — אין "הסרה" של כמות-דיילות (מקטינים אותה), ואין "הסרה" של מה שטרם קיים.
      expect(screen.queryByRole('button', { name: `הסר פריט — ${HOSTESS_NAME}` })).toBeNull()
      expect(within(rowOf(HOSTESS_INPUT)).queryByRole('button')).toBeNull()

      fireEvent.click(screen.getByTestId('scope-add-item'))
      const newRow = screen.getByTestId('scope-new-row-select-0').closest('tr')
      // הקישור שכבר קיים בשורה החדשה נשאר כלשונו — **"הסרה"**, והוא מוחק שורת-טופס שלא
      // נשמרה. הפקד החדש הוא **"הסר פריט"**, והוא מסיר פריט מהאירוע. שני נוסחים שונים
      // בכוונה, כי טעות ביניהם היא בדיוק ההבחנה פח-מול-ארכיון של `src/CLAUDE.md`.
      expect(within(newRow).getByText('הסרה')).toBeInTheDocument()
      expect(within(newRow).queryByRole('button', { name: /^הסר פריט/ })).toBeNull()
    })

    it('לחיצה **מסמנת בלבד** — "יוסר" מחליף את שדה-הכמות, הכפתור מתהפך, ושום דבר לא נשלח', async () => {
      removalScene()
      await renderDialog()
      const satRow = rowOf(SAT_INPUT)
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))

      expect(within(satRow).getByText('יוסר')).toBeInTheDocument()
      // הוחלף, לא רק הושבת — שדה-מספר שנשאר היה מזמין אותה לערוך כמות של פריט שלא יהיה.
      expect(within(satRow).queryByRole('spinbutton')).toBeNull()
      // הפקד **מתהפך** ואינו מתווסף: הישן נעלם קודם, ורק אז נבדק החדש.
      expect(screen.queryByRole('button', { name: `הסר פריט — ${SAT_NAME}` })).toBeNull()
      expect(removeBtn(`בטל הסרה — ${SAT_NAME}`)).toBeInTheDocument()
      // 🔴 סימון אינו שמירה ואינו מחיקה: אין קריאת-שרת עד "שמור שינוי תכולה".
      expect(applyScopeChange).not.toHaveBeenCalled()
    })

    it('"בטל הסרה" מחזיר את השורה — שדה-הכמות חוזר עם הכמות שבתוקף, והשורה שוב "ללא שינוי"', async () => {
      removalScene()
      await renderDialog()
      const satRow = rowOf(SAT_INPUT)
      // הסיבה ממולאת מראש בכוונה: אחרת השמירה מושבתת ממילא בגלל ㉖, והבדיקה האחרונה כאן
      // הייתה עוברת גם אילו הביטול לא היה מחזיר את השורה למצב "ללא שינוי".
      fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'הלקוח ויתר' } })
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      fireEvent.click(removeBtn(`בטל הסרה — ${SAT_NAME}`))

      expect(screen.getByLabelText(SAT_INPUT)).toHaveValue(150)
      expect(within(satRow).queryByText('יוסר')).toBeNull()
      expect(within(satRow).getByText('ללא שינוי')).toBeInTheDocument()
      expect(screen.getByTestId('scope-save')).toBeDisabled()
    })

    it('שמירה של שורה מסומנת שולחת target_qty 0 — לאותה שורה בלבד, ובאותו חוזה-פיילוד', async () => {
      removalScene()
      await renderDialog()
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      fireEvent.change(screen.getByTestId('scope-reason'), {
        target: { value: 'הלקוח ויתר על השרוכים' },
      })
      fireEvent.click(screen.getByTestId('scope-save'))

      await waitFor(() => expect(applyScopeChange).toHaveBeenCalledTimes(1))
      const [, pLines] = applyScopeChange.mock.calls[0]
      // 🔴 חוזה-השרת לא השתנה בגרם — הפקד הוא מסלול נוסף אל אותו `target_qty: 0`.
      expect(pLines).toEqual([
        { target: 'logistics', sku: 'B-SAT-LAN', serial_number: 2, target_qty: 0 },
      ])
    })

    it('בלוק "מה יקרה כשתשמרי" אומר את משפט-ההסרה עוד לפני השמירה', async () => {
      removalScene()
      await renderDialog()
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      expect(
        screen.getByText(
          '"שרוך סאטן - ממותג" — השורה תוסר ממסך הלוגיסטיקה, וההסרה תירשם בהיסטוריית שינויי-התכולה.',
        ),
      ).toBeInTheDocument()
      expect(applyScopeChange).not.toHaveBeenCalled()
    })

    // 🪤 המלכודת שהסעיף הזה שומר עליה: היא מסמנת הסרה, ו"לא שינית אף כמות" נשאר על המסך
    // עם כפתור-שמירה מושבת. שתי בדיקות ולא אחת — כדי שכל צד ייכשל בנפרד ולא ייחבא מאחורי
    // חברו.
    it('סימון-הסרה לבדו הוא שינוי — "לא שינית אף כמות" נעלם', async () => {
      removalScene()
      await renderDialog()
      expect(screen.getByTestId('scope-no-change')).toBeInTheDocument()
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      expect(screen.queryByTestId('scope-no-change')).toBeNull()
    })

    it('סימון-הסרה לבדו פותח את השמירה — אחרי סיבה, ולא לפניה (㉖)', async () => {
      removalScene()
      await renderDialog()
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      // הסיבה נשארת חובה — ההסרה אינה פותחת עוקף.
      expect(screen.getByTestId('scope-save')).toBeDisabled()

      fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'הלקוח ויתר' } })
      expect(screen.getByTestId('scope-save')).not.toBeDisabled()
    })

    it('㉚ — סיבת-החסימה של הכפתור מקושרת ב-aria-describedby, המזהה בלי רווחים, וזה **אותו** אלמנט של השדה', async () => {
      removalScene()
      await renderDialog()
      const tagsBtn = removeBtn(`הסר פריט — ${TAGS_NAME}`)
      const describedBy = tagsBtn.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      // מזהה חוקי — אין רווחים. `aria-describedby` היא רשימת-טוקנים מופרדת-ברווח, ולכן
      // מזהה עם רווח היה נקרא כמה מזהים שאינם קיימים והקישור היה נשבר בשקט.
      expect(describedBy).not.toMatch(/\s/)
      // המזהה מצביע לאלמנט **קיים** — קישור למזהה שאינו קיים נשבר בשקט בדיוק כמו רווח.
      expect(document.getElementById(describedBy)).not.toBeNull()
      expect(document.getElementById(describedBy).textContent).toBe(
        'הפריט כבר הוזמן — לא ניתן להסירו',
      )
      // אלמנט אחד, שני פקדים: המשפט אינו נכתב פעמיים באותה שורת-טבלה.
      expect(screen.getByLabelText(TAGS_INPUT).getAttribute('aria-describedby')).toBe(describedBy)
      expect(
        within(rowOf(TAGS_INPUT)).getAllByText('הפריט כבר הוזמן — לא ניתן להסירו'),
      ).toHaveLength(1)
    })

    it('הקלדת 0 ביד נוחתת באותו מצב בדיוק — המצב נגזר מהיעד, לא מלחיצה על הכפתור', async () => {
      removalScene()
      await renderDialog()
      const satRow = rowOf(SAT_INPUT)
      fireEvent.change(screen.getByLabelText(SAT_INPUT), { target: { value: '0' } })
      expect(within(satRow).getByText('יוסר')).toBeInTheDocument()
      expect(removeBtn(`בטל הסרה — ${SAT_NAME}`)).toBeInTheDocument()
    })

    it('בזמן שמירה הפקד מושבת יחד עם שאר הפקדים', async () => {
      removalScene()
      let release
      applyScopeChange.mockImplementation(() => new Promise((resolve) => (release = resolve)))
      await renderDialog()
      fireEvent.click(removeBtn(`הסר פריט — ${SAT_NAME}`))
      fireEvent.change(screen.getByTestId('scope-reason'), { target: { value: 'הלקוח ויתר' } })
      fireEvent.click(screen.getByTestId('scope-save'))

      await waitFor(() => expect(removeBtn(`בטל הסרה — ${SAT_NAME}`)).toBeDisabled())
      release({ change_group_id: 1, lines: [] })
      await waitFor(() => expect(removeBtn(`בטל הסרה — ${SAT_NAME}`)).not.toBeDisabled())
    })
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
