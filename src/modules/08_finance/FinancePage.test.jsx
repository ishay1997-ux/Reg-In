// בדיקות S1 — `FinancePage` (צעד 3.1).
//
// מה נעול כאן, בסדר-הענפים של כרטיס-המסך §④:
// ① **חוסר-הרשאה נבדק ראשון** ומזוהה מקוד-השגיאה `42501` (לא מאפס-שורות) · ② תקלת-טעינה
// **ודריפט-צורה** נוחתים באותו מסך, וההודעה של `assertFinanceShape` מוצגת · ③ ריק-אחרי-סינון
// עם "נקי סינון" · ריק-אמיתי פר-לשונית.
// ובנוסף: שלוש הלשוניות ומוניהן · **`resolved_cancelled` אינו מופיע באף לשונית** (B-9 +
// שאלת-מוצר 1) · עמודות שונות פר-לשונית · ימי-איחור אדומים מול `—` מול `0` · סכום + שורת
// "כולל מע"מ" · דמי-ביטול שטרם נפתרו כ-`—` ולא כמספר · רווח סופי ‏% ראשי / ‏₪ משני (§7.52) ·
// תג-ציון בפורמט-S1 (תווית בלבד) · ענבר על שורות-פעולה בלבד · פתיחת S2 בקליק ובמקלדת ·
// כפתור Q-2 שפותח את S3 ומרענן את כרטיס-ההיסטוריה.
//
// כל ה-API ממוקק (כולל `getParamValue` חוצה-המודול) — אין נגיעה ברשת/Supabase. שני
// הדיאלוגים ממוקקים: כאן נבדק **חוזה-האינטגרציה** בלבד (מי נפתח, עם מה, ומה קורה בסגירה).
//
// 🕓 "היום" מקובע ל-`15/10/2026` — ה"היום" המשותף של `data-set.md §0`, שממנו נגזרים
// חמשת ימי-האיחור של #15. בלי קיבוע, בדיקת-האיחור הייתה משתנה מדי יום.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import FinancePage from './FinancePage'
import { listFinanceOverview } from './api'
import { getParamValue } from '@/modules/06_projects/closingApi'

vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return { ...actual, listFinanceOverview: vi.fn() }
})
vi.mock('@/modules/06_projects/closingApi', () => ({ getParamValue: vi.fn() }))

vi.mock('./ClosingWindowDialog', () => ({
  default: ({ project, open }) => (
    <div
      data-testid="closing-dialog"
      data-project={String(project?.project_id)}
      data-open={String(open)}
    />
  ),
}))

vi.mock('./SalaryReportDialog', () => ({
  default: ({ open }) => <div data-testid="salary-dialog" data-open={String(open)} />,
}))

const NOW = new Date('2026-10-15T10:00:00Z') // "היום" המשותף — data-set.md §0

// שורת-בסיס עם כל 21 העמודות שטבלת-ההחזרה של `get_finance_overview` מצהירה עליהן.
// 🔴 הרשימה מלאה בכוונה: השמטה כאן הייתה מפילה את שער-הצורה ומסתירה את הבדיקה שהיא באה
// לעשות. בדיקת-הדריפט למטה מסירה עמודה **במפורש**, ולכן היא נבדלת מכל שאר המקרים.
function overviewRow(overrides = {}) {
  return {
    project_id: 0,
    event_name: '',
    customer_id: 1,
    customer_name: '',
    project_status: 'awaiting_invoice',
    tab: 'awaiting_invoice',
    revenue: '0.00',
    gross_profit: '0.00',
    final_profit: null,
    invoice_sent: false,
    invoice_sent_at: null,
    payment_date: null,
    payment_terms_days: 30,
    feedback_status: 'pending',
    feedback_score: null,
    cancelled_at: null,
    cancel_type: null,
    cancellation_fee: null,
    written_off: false,
    credit_note_flag: false,
    operationally_closed_at: null,
    archived_at: null,
    ...overrides,
  }
}

// הקאסט המשותף של `data-set.md` — ארבעת הפרויקטים החיים, פלוס מבוטל-שנפתר שנוצר כאן
// במפורש כדי לנעול שהוא **לא** מוצג בשום לשונית.
const P12 = overviewRow({
  project_id: 12,
  event_name: 'כנס משקיעים שנתי',
  customer_name: 'קבוצת אחזקות דנוך בע"מ',
  project_status: 'awaiting_invoice',
  tab: 'awaiting_invoice',
  revenue: '500.00',
  feedback_status: 'completed',
  feedback_score: 2,
  operationally_closed_at: '2026-08-21T09:00:00Z',
})

const P14 = overviewRow({
  project_id: 14,
  event_name: 'כנס פתיחת שנה',
  customer_name: 'הייטק גרופ בע"מ',
  project_status: 'cancelled',
  tab: 'awaiting_invoice',
  revenue: '4200.00',
  cancelled_at: '2026-08-26T09:00:00Z',
  cancel_type: 'customer',
  cancellation_fee: null, // טרם נפתרו
})

const P15 = overviewRow({
  project_id: 15,
  event_name: 'ערב השקה — קמפוס צפון',
  customer_name: 'קמפוס טכנולוגי צפון בע"מ',
  project_status: 'awaiting_payment',
  tab: 'awaiting_payment',
  revenue: '5985.00',
  invoice_sent: true,
  invoice_sent_at: '2026-09-10T09:00:00Z',
  feedback_status: 'no_response',
  operationally_closed_at: '2026-09-08T09:00:00Z',
})

const P13 = overviewRow({
  project_id: 13,
  event_name: 'פסטיבל קיץ עירוני',
  customer_name: 'עיריית חדרה',
  project_status: 'finished',
  tab: 'finished',
  revenue: '5300.00',
  final_profit: '3650.00',
  invoice_sent: true,
  invoice_sent_at: '2026-08-28T09:00:00Z',
  payment_date: '2026-09-04',
  feedback_status: 'completed',
  feedback_score: 4,
  operationally_closed_at: '2026-08-25T09:00:00Z',
  archived_at: '2026-09-06T09:00:00Z',
})

const RESOLVED_CANCELLED = overviewRow({
  project_id: 99,
  event_name: 'אירוע שבוטל והפה נפתר',
  customer_name: 'לקוח כלשהו בע"מ',
  project_status: 'cancelled',
  tab: 'resolved_cancelled',
  cancelled_at: '2026-07-01T09:00:00Z',
  cancel_type: 'customer',
  cancellation_fee: '1000.00',
  final_profit: '800.00',
})

// 🔬 סדר-הקלט מעורבב בכוונה — אחרת בדיקת-הפילוח הייתה מאשרת את סדר-הקליטה.
const BOARD = [P15, P12, RESOLVED_CANCELLED, P13, P14]

async function renderPage() {
  const view = render(<FinancePage />)
  await screen.findByTestId('finance-table')
  return view
}

function rpcError(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
  listFinanceOverview.mockResolvedValue(BOARD)
  getParamValue.mockResolvedValue('18')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('S1 — שלד, לשוניות ומונים', () => {
  it('מציג שלד-טבלה בטעינה, ואז את הטבלה', async () => {
    let release
    listFinanceOverview.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve(BOARD)
      }),
    )
    render(<FinancePage />)
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
    release()
    expect(await screen.findByTestId('finance-table')).toBeInTheDocument()
  })

  it('מונה כל לשונית = מספר השורות בה, ו-resolved_cancelled אינו נספר ואינו מוצג', async () => {
    await renderPage()
    expect(screen.getByTestId('finance-tab-awaiting_invoice')).toHaveTextContent('ממתין לחשבונית2')
    expect(screen.getByTestId('finance-tab-awaiting_payment')).toHaveTextContent('ממתין לתשלום1')
    expect(screen.getByTestId('finance-tab-finished')).toHaveTextContent('פרויקטים שהסתיימו1')

    // 🔴 הנעילה של B-9 — השורה יורדת מהעולם, לא עוברת ללשונית 3.
    for (const tab of ['awaiting_invoice', 'awaiting_payment', 'finished']) {
      fireEvent.click(screen.getByTestId(`finance-tab-${tab}`))
      expect(screen.queryByTestId('finance-row-99')).not.toBeInTheDocument()
    }
  })

  it('ברירת-המחדל היא "ממתין לתשלום", והלשונית הפעילה מסומנת ל-aria', async () => {
    await renderPage()
    expect(screen.getByTestId('finance-tab-awaiting_payment')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('finance-tab-finished')).toHaveAttribute('aria-selected', 'false')
  })
})

describe('S1 — לשונית "ממתין לתשלום" (#15)', () => {
  it('מועד-פירעון, שוטף+30, חמישה ימי-איחור וסכום עם שורת כולל-מע"מ', async () => {
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).toHaveTextContent('ערב השקה — קמפוס צפון')
    expect(row).toHaveTextContent('10/09/2026') // חשבונית נשלחה
    expect(row).toHaveTextContent('10/10/2026') // מועד פירעון = +30
    expect(row).toHaveTextContent('שוטף+30')
    expect(row).toHaveTextContent('5 ימים')
    expect(row).toHaveTextContent('5,985.00 ₪')
    expect(row).toHaveTextContent('7,062.30 ₪ כולל מע"מ')
  })

  it('שורה בפיגור מסומנת בענבר — פריט-פעולה אמיתי, לא קישוט', async () => {
    await renderPage()
    expect(screen.getByTestId('finance-row-15').className).toContain('bg-amber-50')
  })

  it('עמודות הלשונית הן של הלשונית, לא סט אחיד', async () => {
    await renderPage()
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual([
      'פרויקט',
      'חשבונית נשלחה',
      'מועד פירעון',
      'ימי איחור',
      'סכום לתשלום',
      'סטטוס',
    ])
  })

  it('בלי חשבונית שנשלחה: מועד-פירעון וימי-איחור מציגים — ולא 0', async () => {
    listFinanceOverview.mockResolvedValue([
      { ...P15, invoice_sent: false, invoice_sent_at: null },
      P13,
    ])
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).not.toHaveTextContent('ימים')
    expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(row.className).not.toContain('bg-amber-50')
  })

  it('מועד-פירעון שטרם חלף מציג 0 (מספר שנמדד), ולא — ולא "ימים"', async () => {
    // חשבונית נשלחה ב-01/10 ⇒ פירעון 31/10, וה"היום" הוא 15/10 ⇒ אין איחור.
    listFinanceOverview.mockResolvedValue([
      { ...P15, invoice_sent_at: '2026-10-01T09:00:00Z' },
      P13,
    ])
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).toHaveTextContent('31/10/2026')
    expect(row).not.toHaveTextContent('ימים')
    expect(within(row).getByText('0')).toBeInTheDocument()
    expect(row.className).not.toContain('bg-amber-50')
  })

  it('פרמטר תנאי-תשלום חסר ⇒ אין מועד-פירעון ואין ימי-איחור, ולא ברירת-מחדל 30', async () => {
    listFinanceOverview.mockResolvedValue([{ ...P15, payment_terms_days: null }, P13])
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).not.toHaveTextContent('10/10/2026')
    expect(row).not.toHaveTextContent('שוטף+')
    expect(row).not.toHaveTextContent('ימים')
  })

  // 🔴 **המצב שלא היה מכוסה כאן, והוא המצב הרגיל של כל תיק בין תשלום לארכוב.**
  // ‏`record_payment` כותבת `payment_date` ואינה נוגעת ב-`project_status` (מיגרציה E2),
  // ו-`get_finance_overview` משייכת ללשונית לפי הסטטוס בלבד ⇒ השורה **נשארת כאן** עד
  // שהארכוב יעבור — ושער-הארכוב דורש גם משוב-פתור, כלומר ימים ולא רגע. עד `28/08/2026`
  // המונה האדום המשיך לגדול על השורה הזאת כל יום. **הקיבוע כאן הוא על שני חצאים:**
  // ‏① המונה נעצר · ‏② במקומו נאמר בפועל שהכסף הגיע — בלי זה השורה עדיין קוראת
  // "סכום לתשלום" בלי שום סימן-נגד, וזה בדיוק הטלפון ללקוח ששילם.
  it('תיק ששולם וטרם ארוכב: המונה נעצר, ובמקומו תג "שולם" עם התאריך', async () => {
    // חשבונית 10/09 + שוטף30 ⇒ פירעון 10/10; ה"היום" הוא 15/10 ⇒ חשבון-הימים הטהור
    // מחזיר 5. התשלום (12/10) הוא מה שסוגר את החוב, והסטטוס נשאר `awaiting_payment`.
    listFinanceOverview.mockResolvedValue([{ ...P15, payment_date: '2026-10-12' }, P13])
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(screen.getByTestId('finance-paid-15')).toHaveTextContent('שולם')
    expect(row).toHaveTextContent('12/10/2026')
    expect(row).not.toHaveTextContent('5 ימים')
    expect(row).not.toHaveTextContent('ימים')
    expect(row.className).not.toContain('bg-amber-50')
  })

  it('תיק שנסגר כחוב-אבוד וטרם ארוכב: המונה נעצר, ובלי תג "שולם" — הוא לא שולם', async () => {
    listFinanceOverview.mockResolvedValue([{ ...P15, written_off: true }, P13])
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(screen.queryByTestId('finance-paid-15')).not.toBeInTheDocument()
    expect(screen.getByTestId('finance-writeoff-tag-15')).toHaveTextContent('הסתיים — לא שולם')
    expect(row).not.toHaveTextContent('ימים')
    expect(row.className).not.toContain('bg-amber-50')
  })
})

describe('S1 — לשונית "ממתין לחשבונית" (#12 · #14)', () => {
  beforeEach(async () => {
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-awaiting_invoice'))
  })

  it('#12 — ציון-משוב 2 מייצר שורת-בירור-טלפוני ומסמן את השורה בענבר', () => {
    const row = screen.getByTestId('finance-row-12')
    expect(row).toHaveTextContent('כנס משקיעים שנתי')
    expect(row).toHaveTextContent('נדרש בירור טלפוני')
    expect(row).toHaveTextContent('21/08/2026')
    expect(row).toHaveTextContent('נסגר תפעולית')
    expect(row).toHaveTextContent('500.00 ₪')
    expect(row).toHaveTextContent('590.00 ₪ כולל מע"מ')
    expect(row.className).toContain('bg-amber-50')
  })

  it('#14 — דמי-ביטול שטרם נפתרו: — ולא סכום, שורת-ענבר, ושני תגים', () => {
    const row = screen.getByTestId('finance-row-14')
    expect(row).toHaveTextContent('26/08/2026')
    expect(row).toHaveTextContent('הלקוח ביטל')
    // 📐 **מיקום ולא רק נוכחות** — המוקאפ מצייר שני דברים שונים בשני תאים שונים, ובדיקה
    // ברמת-השורה לבדה עברה בירוק גם כששניהם ישבו בתא אחד:
    // ‏(א) שורת-ההקשר ("הלקוח ביטל") תחת שם-הפרויקט · (ב) המילה "בוטל" בתא-התאריך.
    expect(screen.getByTestId('finance-cancel-context-14')).toHaveTextContent('הלקוח ביטל')
    const cells = within(row).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('הלקוח ביטל')
    expect(cells[1]).toHaveTextContent('26/08/2026')
    expect(cells[1]).toHaveTextContent('בוטל')
    expect(cells[1]).not.toHaveTextContent('הלקוח ביטל')
    // 🔴 ההצעה התלת-רכיבית אינה בטבלת-ההחזרה של get_finance_overview ⇒ אין כאן מספר
    // לקרוא, וההכנסה **לא** נכתבת במקומו.
    expect(row).not.toHaveTextContent('4,200.00 ₪')
    expect(row).toHaveTextContent('דמי-ביטול — טרם נפתרו')
    expect(row).toHaveTextContent('בוטל')
    expect(screen.getByTestId('finance-fee-tag-14')).toHaveTextContent('דמי-ביטול')
    expect(row.className).toContain('bg-amber-50')
  })

  it('עמודות הלשונית שונות מהלשונית הקודמת', () => {
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['פרויקט', 'תאריך', 'סכום', 'סטטוס'])
  })
})

describe('S1 — לשונית "פרויקטים שהסתיימו" (#13)', () => {
  beforeEach(async () => {
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-finished'))
  })

  it('רווח סופי: % כערך-ראשי ו-₪ בשורת-משנה (§7.52)', () => {
    const row = screen.getByTestId('finance-row-13')
    expect(row).toHaveTextContent('69%') // 3,650 / 5,300, מעוגל
    expect(row).toHaveTextContent('3,650.00 ₪')
    expect(row).toHaveTextContent('06/09/2026')
  })

  it('תג-הציון בפורמט-S1: תווית בלבד, בלי מספר בתוך התג', () => {
    const row = screen.getByTestId('finance-row-13')
    expect(row).toHaveTextContent('טוב')
    expect(row).not.toHaveTextContent('ציון 4')
    expect(row).not.toHaveTextContent('4 — טוב')
  })

  it('שורה שהסתיימה אינה בענבר — אין בה פריט-פעולה', () => {
    expect(screen.getByTestId('finance-row-13').className).not.toContain('bg-amber-50')
  })

  it('שורה ששולמה אינה נחשבת "באיחור" למרות חשבונית ישנה', () => {
    // ‏#13: חשבונית 28/08 + שוטף30 ⇒ פירעון 27/09, וה"היום" הוא 15/10 — חשבון-הימים טהור
    // ומחזיר מספר חיובי. התשלום (04/09) הוא מה שסוגר את החוב.
    expect(screen.getByTestId('finance-row-13').className).not.toContain('bg-amber-50')
  })

  it('אין תג חוב-אבוד על תיק ששולם', () => {
    expect(screen.queryByTestId('finance-writeoff-tag-13')).not.toBeInTheDocument()
  })
})

describe('S1 — תיק מארוכב אינו מבקש טיפול', () => {
  it('ציון נמוך על שורה מארוכבת אינו מייצר שורת-בירור ואינו צובע ענבר', async () => {
    // שער-הארכוב דורש משוב-פתור ⇒ ציון 2 שארוכב כבר טופל בטלפון; שורת-"נדרש בירור"
    // עליו הייתה מבקשת מהמנהלת לעשות שוב את מה שהיא כבר עשתה.
    listFinanceOverview.mockResolvedValue([P15, { ...P13, feedback_score: 2 }])
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-finished'))
    const row = screen.getByTestId('finance-row-13')
    expect(row).not.toHaveTextContent('נדרש בירור טלפוני')
    expect(row).toHaveTextContent('טעון בירור') // התג עצמו כן נשאר — הוא עובדה, לא משימה
    expect(row.className).not.toContain('bg-amber-50')
  })
})

describe('S1 — דגלים ותגים נוספים', () => {
  it('דגל חשבונית-זיכוי מוצג בשורה, באותו נוסח שנעול ב-S2', async () => {
    listFinanceOverview.mockResolvedValue([{ ...P15, credit_note_flag: true }])
    await renderPage()
    expect(screen.getByTestId('finance-credit-note-15')).toHaveTextContent('נדרשת חשבונית זיכוי')
  })

  it('פרויקט שנסגר ללא תשלום נושא תג "הסתיים — לא שולם"', async () => {
    listFinanceOverview.mockResolvedValue([P15, { ...P13, written_off: true, payment_date: null }])
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-finished'))
    expect(screen.getByTestId('finance-writeoff-tag-13')).toHaveTextContent('הסתיים — לא שולם')
    // חוב-אבוד אינו "איחור פתוח": התיק נסגר, והשורה אינה נצבעת ענבר.
    expect(screen.getByTestId('finance-row-13').className).not.toContain('bg-amber-50')
  })
})

describe('S1 — סרגל-הסינון', () => {
  beforeEach(async () => {
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-awaiting_invoice'))
  })

  it('סינון לפי שם-חברה מצמצם את הטבלה', () => {
    fireEvent.change(screen.getByTestId('finance-filter-company'), { target: { value: 'הייטק' } })
    expect(screen.getByTestId('finance-row-14')).toBeInTheDocument()
    expect(screen.queryByTestId('finance-row-12')).not.toBeInTheDocument()
  })

  it('סינון לפי מספר-פרויקט מצמצם את הטבלה', () => {
    fireEvent.change(screen.getByTestId('finance-filter-number'), { target: { value: '12' } })
    expect(screen.getByTestId('finance-row-12')).toBeInTheDocument()
    expect(screen.queryByTestId('finance-row-14')).not.toBeInTheDocument()
  })

  it('סינון לפי טווח-תאריכים פועל על התאריך שהלשונית מציגה', () => {
    fireEvent.change(screen.getByTestId('finance-filter-from'), { target: { value: '2026-08-25' } })
    expect(screen.getByTestId('finance-row-14')).toBeInTheDocument() // 26/08
    expect(screen.queryByTestId('finance-row-12')).not.toBeInTheDocument() // 21/08
  })

  it('טווח הפוך (מ- מאוחר מ-עד) אינו שגיאה — הוא מצב-ריק עם "נקי סינון" (A-2)', () => {
    fireEvent.change(screen.getByTestId('finance-filter-from'), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByTestId('finance-filter-to'), { target: { value: '2026-01-01' } })
    const empty = screen.getByTestId('finance-empty-filtered')
    expect(empty).toHaveTextContent('אין פרויקט התואם לסינון שבחרת.')
    expect(screen.queryByTestId('finance-error')).not.toBeInTheDocument()
  })

  it('"נקי סינון" מחזיר את כל השורות', () => {
    fireEvent.change(screen.getByTestId('finance-filter-company'), { target: { value: 'הייטק' } })
    expect(screen.queryByTestId('finance-row-12')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('finance-clear-filter'))
    expect(screen.getByTestId('finance-row-12')).toBeInTheDocument()
    expect(screen.getByTestId('finance-filter-company')).toHaveValue('')
  })

  it('מצב-הריק שאחרי-סינון נבדל ממצב-ריק-אמיתי: פעולה הפוכה, לא "נסי שוב"', () => {
    fireEvent.change(screen.getByTestId('finance-filter-company'), { target: { value: 'זזזז' } })
    expect(screen.getByTestId('finance-empty-clear-filter')).toHaveTextContent('נקי סינון')
    expect(screen.queryByText('נסי שוב')).not.toBeInTheDocument()
  })
})

describe('S1 — מצבי-הריק והשגיאה, בסדר-הענפים של הכרטיס', () => {
  it('① חוסר-הרשאה (42501) נבדק ראשון: משפט-החסימה, ומונים "—" ולא 0', async () => {
    listFinanceOverview.mockRejectedValue(
      rpcError('42501', 'אין לך הרשאה לבצע פעולה זו במודול כספים'),
    )
    render(<FinancePage />)
    const blocked = await screen.findByTestId('finance-no-permission')
    expect(blocked).toHaveTextContent('אין לך הרשאה לצפות בנתוני הכספים.')
    expect(screen.getByTestId('finance-tab-awaiting_invoice')).toHaveTextContent('—')
    expect(screen.getByTestId('finance-tab-awaiting_invoice')).not.toHaveTextContent('0')
    expect(screen.queryByTestId('finance-error')).not.toBeInTheDocument()
  })

  it('② תקלת-טעינה: מסך-שגיאה עם "נסי שוב", ו"נסי שוב" באמת טוען מחדש', async () => {
    listFinanceOverview.mockRejectedValueOnce(new Error('Failed to fetch'))
    render(<FinancePage />)
    await screen.findByTestId('finance-error')
    expect(screen.getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()

    listFinanceOverview.mockResolvedValue(BOARD)
    fireEvent.click(screen.getByText('נסי שוב'))
    expect(await screen.findByTestId('finance-table')).toBeInTheDocument()
  })

  it('② דריפט-צורה: עמודה שנעלמה מפילה את המסך בקול, עם הודעת שער-הצורה', async () => {
    // 🔴 זו הבדיקה שמצדיקה את `assertFinanceShape` בגבול: `final_profit` אינה נקראת
    // בלשונית הפעילה כלל, ובלי השער היא הייתה נעלמת בשקט ו-#13 היה מציג "—" לנצח.
    const drifted = { ...P15 }
    delete drifted.final_profit
    listFinanceOverview.mockResolvedValue([drifted])
    render(<FinancePage />)
    const error = await screen.findByTestId('finance-error')
    expect(error).toHaveTextContent('חסרים שדות בשורות מסך הכספים: final_profit.')
  })

  it('③ ריק-אמיתי: לשונית בלי שורות ובלי סינון פעיל מקבלת משפט משלה, לא "נקי סינון"', async () => {
    listFinanceOverview.mockResolvedValue([P13])
    render(<FinancePage />)
    await screen.findByTestId('finance-empty-tab')
    expect(screen.getByTestId('finance-empty-tab')).toHaveTextContent('אין פרויקט שממתין לתשלום')
    expect(screen.queryByTestId('finance-empty-clear-filter')).not.toBeInTheDocument()
  })

  it('ציון-משוב מחוץ ל-1–5 אינו נופל בשקט לאפור — הוא מפיל את המסך בקול', async () => {
    listFinanceOverview.mockResolvedValue([{ ...P13, feedback_score: 9 }])
    render(<FinancePage />)
    expect(await screen.findByTestId('finance-error')).toHaveTextContent('ציון משוב לא חוקי: 9')
  })
})

describe('S1 — מע"מ', () => {
  it('פרמטר-מע"מ שאינו נטען: השורה הראשית נשארת, ושורת כולל-המע"מ מציגה — ולא את הסכום עצמו', async () => {
    getParamValue.mockRejectedValue(new Error('הפרמטר "אחוז_מעמ" חסר בהגדרות המערכת.'))
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).toHaveTextContent('5,985.00 ₪')
    expect(row).toHaveTextContent('— כולל מע"מ')
    expect(row).not.toHaveTextContent('7,062.30 ₪')
  })
})

describe('S1 — פתיחת S2 (חלון סגירת-תיק)', () => {
  it('לחיצה על שורה פותחת את הדיאלוג עם אותו פרויקט — בכל הלשוניות, כולל "הסתיימו"', async () => {
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-row-15'))
    expect(screen.getByTestId('closing-dialog')).toHaveAttribute('data-project', '15')

    // resolution #1 — גם שורה שהסתיימה נפתחת, בתצוגה נעולה-לעיון.
    fireEvent.click(screen.getByTestId('finance-tab-finished'))
    fireEvent.click(screen.getByTestId('finance-row-13'))
    expect(screen.getByTestId('closing-dialog')).toHaveAttribute('data-project', '13')
  })

  it('שורה נפתחת גם ממקלדת (Enter), ונושאת aria-label שמסביר לאן היא מובילה', async () => {
    await renderPage()
    const row = screen.getByTestId('finance-row-15')
    expect(row).toHaveAttribute('aria-label', 'ערב השקה — קמפוס צפון, פתיחת חלון סגירת-תיק')
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(screen.getByTestId('closing-dialog')).toHaveAttribute('data-project', '15')
  })

  it('שורה שהסתיימה מכריזה במפורש שהחלון נעול-לעיון', async () => {
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-tab-finished'))
    expect(screen.getByTestId('finance-row-13')).toHaveAttribute(
      'aria-label',
      'פסטיבל קיץ עירוני, פתיחת חלון סגירת-תיק (נעול-לעיון)',
    )
  })

  it('אין דיאלוג פתוח לפני קליק', async () => {
    await renderPage()
    expect(screen.queryByTestId('closing-dialog')).not.toBeInTheDocument()
  })
})

describe('S1 — מסלול-הכניסה ל-S3 (הכרעת Q-2)', () => {
  it('כפתור "הפקת דוח-שכר" קיים בכותרת ופותח את הדיאלוג', async () => {
    await renderPage()
    const button = screen.getByTestId('finance-open-salary')
    expect(button).toHaveTextContent('הפקת דוח-שכר')
    expect(screen.getByTestId('salary-dialog')).toHaveAttribute('data-open', 'false')
    fireEvent.click(button)
    expect(screen.getByTestId('salary-dialog')).toHaveAttribute('data-open', 'true')
  })

  // 🔴 הכרעת-ישי 28/08/2026: ההיסטוריה עברה אל תוך הדיאלוג. הבדיקה הפוכה בכוונה — היא
  // נועלת את מה שהמסך הזה **אינו** מציג יותר, כדי שהחזרה שלה תיתפס ולא תיראה כתוספת תמימה.
  it('מסך-הכספים אינו מציג יותר את כרטיס-ההיסטוריה — הוא מציג פרויקטים בלבד', async () => {
    await renderPage()
    expect(screen.queryByTestId('salary-history-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('finance-open-salary')).toBeInTheDocument()
  })
})
