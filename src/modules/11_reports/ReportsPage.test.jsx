// בדיקות המעטפת (מ1). 🔴 **מה שהן באמת שומרות עליו: המיסוך.**
// ‏`ProtectedRoute` חוסם את המסך כולו, וה-RPC חוסם את הדאטה — אבל **מה שקורה בין השניים**,
// כלומר אילו לשוניות המשתמשת רואה ואיך, אינו נאכף בשום מקום אחר. לשונית שתיעלם במקום
// להיות ממוסכת (הכרעה 2 · 15-ה) היא רגרסיה **בלי סימפטום**: המסך ייראה תקין לגמרי.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ⚠️ חובה (מלכודת `.env.local` מול CI): בלי המוק, כל בדיקת-רכיב שנוגעת ב-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('recharts', () => ({}))

const callReport = vi.fn()
vi.mock('./api', () => ({
  callReport: (...args) => callReport(...args),
  normalizeCharts: (chart) => (chart ? [chart] : []),
}))

const listCustomers = vi.fn(() => Promise.resolve([]))
vi.mock('@/modules/02_customers/api', () => ({ listCustomers: (...a) => listCustomers(...a) }))

let permissions = {}
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions, onboardingMode: 0 }),
}))

import ReportsPage, { NO_TABS_SENTENCE } from './ReportsPage'
import { MASKED_TEXT } from '@/lib/dashboard'

// ארבע מפות-ההרשאות של §2.7 — זהויות-הבדיקה האמיתיות, לא מומצאות.
const CEO = { כספים: 'edit', דיילות: 'edit', לקוחות: 'edit', 'דו"חות': 'edit' }
const FINANCE = { כספים: 'edit', לקוחות: 'edit', 'דו"חות': 'edit' }
const RECRUIT = { דיילות: 'view', 'דו"חות': 'view' }
const STAFF = { לוגיסטיקה: 'edit', 'דו"חות': 'view' }

const payload = (over = {}) => ({
  population: { n: 3, label: 'אוכלוסייה: הכול · n=3' },
  window: { from: '2026-01-01', to: '2026-09-06', label: '2026' },
  tiles: [],
  chart: null,
  columns: [],
  rows: [],
  so_what: null,
  definitions: '',
  drill: null,
  meta: { missing_params: [], notes: [] },
  ...over,
})

function renderPage(initialEntry = '/reports') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ‏`user-event` אינו מותקן בריפו (נמדד) — ‏`fireEvent` עטוף ב-`act` הוא הדפוס הקיים
// (`08_finance/ClosingWindowDialog.test.jsx`). העטיפה נחוצה כי הלחיצה מפעילה `setSearchParams`
// ואז effect שקורא ל-API.
async function click(element) {
  await act(async () => {
    fireEvent.click(element)
  })
}

beforeEach(() => {
  callReport.mockReset()
  callReport.mockResolvedValue(payload())
  listCustomers.mockClear()
  permissions = CEO
})

describe('מ1 — מיסוך הלשוניות (הכרעה 2 · 15-ה · ת8)', () => {
  it('מנכ"ל: ארבע לשוניות פתוחות, אף אחת אינה ממוסכת', async () => {
    permissions = CEO
    renderPage()
    const tabs = await screen.findAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(screen.queryAllByText(MASKED_TEXT)).toHaveLength(0)
  })

  // מנהלת-כספים: 'כספים' פותח **שתי** לשוניות (הנהלה+כספים — אותה הרשאת-מודול, שני
  // מסכים), ו'לקוחות' פותח שלישית. דיילות ממוסכת.
  it('מנהלת כספים ולקוחות: הנהלה · כספים · לקוחות פתוחות, דיילות ממוסכת', async () => {
    permissions = FINANCE
    renderPage()
    await screen.findByTestId('reports-tabs')
    const hostesses = screen.getByTestId('reports-tab-hostesses')
    expect(within(hostesses).getByText(MASKED_TEXT)).toBeInTheDocument()
    expect(hostesses).toHaveAttribute('aria-disabled', 'true')
    for (const key of ['exec', 'finance', 'customers']) {
      expect(within(screen.getByTestId(`reports-tab-${key}`)).queryByText(MASKED_TEXT)).toBeNull()
    }
  })

  it('מנהלת גיוס: דיילות בלבד — והיא זו שנפתחת, לא "הנהלה" קשיח', async () => {
    permissions = RECRUIT
    renderPage()
    expect(await screen.findByTestId('reports-tab-hostesses')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getAllByText(MASKED_TEXT)).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מבט-על דיילות')
  })

  // 🔤 ת8 #5, מילה-במילה: **לא מסך ריק** — ארבע לשוניות ממוסכות והודעה אחת.
  it('מנהלת לוגיסטיקה: ארבע ממוסכות + ההודעה הנעולה, ולא מסך ריק', async () => {
    permissions = STAFF
    renderPage()
    expect(await screen.findByText(NO_TABS_SENTENCE)).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(screen.getAllByText(MASKED_TEXT)).toHaveLength(4)
    // ולא נשלחה שום קריאה — אין דוח לטעון.
    expect(callReport).not.toHaveBeenCalled()
  })

  // 🔴 `aria-selected` **תמיד**, גם על הממוסכת — הכרעה 15-ה במפורש.
  it('כל role="tab" נושא aria-selected, כולל הממוסכות', async () => {
    permissions = FINANCE
    renderPage()
    const tabs = await screen.findAllByRole('tab')
    for (const tab of tabs) expect(tab).toHaveAttribute('aria-selected')
  })

  it('לחיצה על לשונית ממוסכת אינה עושה דבר', async () => {
    permissions = FINANCE
    renderPage()
    const before = screen.getByTestId('reports-tab-exec').getAttribute('aria-selected')
    await click(screen.getByTestId('reports-tab-hostesses'))
    expect(screen.getByTestId('reports-tab-exec')).toHaveAttribute('aria-selected', before)
  })
})

describe('מ1 — בורר-הדוח (הכרעה 18 · 29)', () => {
  it('לחיצה על שבב מחליפה את הכותרת ואת השאלה (הכרעה 18)', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('מבט-על הנהלה')
    expect(screen.getByText('מה מצב העסק השנה?')).toBeInTheDocument()

    await click(screen.getByTestId('reports-chip-trends'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מגמות רב-שנתיות')
    expect(screen.getByText('האם הצמיחה שומרת על שולי-הרווח?')).toBeInTheDocument()
  })

  it('הבורר הוא שורת-שבבים אופקית ברוחב מלא — לא סרגל אנכי', async () => {
    renderPage()
    const picker = await screen.findByTestId('reports-picker')
    // 🔴 הפגם שישי תפס בעין ב-11/09: `flex-direction:column; width:220px`.
    expect(picker.className).toContain('flex-wrap')
    expect(picker.className).toContain('w-full')
    expect(picker.className).not.toContain('flex-col')
    expect(picker.tagName).toBe('NAV')
  })

  it('התוויות הן השם הקצר, והשאלה יורדת לכותרת-המשנה', async () => {
    renderPage()
    const picker = await screen.findByTestId('reports-picker')
    expect(within(picker).getByText('מגמות רב-שנתיות')).toBeInTheDocument()
    // 🚫 השאלה אינה תווית-שבב (הכרעה 18), ואין מספר-דוח בממשק.
    expect(within(picker).queryByText('האם הצמיחה שומרת על שולי-הרווח?')).toBeNull()
    expect(picker.textContent).not.toMatch(/דוח \d/)
  })

  it('שבב פעיל נושא aria-current, והאחרים לא', async () => {
    renderPage()
    const picker = await screen.findByTestId('reports-picker')
    const current = within(picker)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'true')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('מבט-על הנהלה')
  })

  it('המשטחים הנדחים אינם על המסך כלל — גם לא מנוטרלים', async () => {
    renderPage()
    await click(screen.getByTestId('reports-tab-finance'))
    const picker = screen.getByTestId('reports-picker')
    expect(within(picker).getAllByRole('button')).toHaveLength(4)
    for (const name of ['תזרים צפוי', 'תוספות שטח', 'שכר דיילות לפי חודש']) {
      expect(within(picker).queryByText(name)).toBeNull()
    }
  })
})

describe('מ1 — מצב-התצוגה חי בכתובת (📐13④ · S-18)', () => {
  it('כתובת עם לשונית ודוח נפתחת עליהם', async () => {
    renderPage('/reports?tab=finance&report=aging')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('גיול חובות')
    expect(screen.getByText('את מי לגבות השבוע?')).toBeInTheDocument()
    expect(screen.getByTestId('reports-tab-finance')).toHaveAttribute('aria-selected', 'true')
  })

  it('בחירת שבב כותבת את הדוח לכתובת, וקריאה חוזרת משחזרת אותו', async () => {
    renderPage()
    await click(await screen.findByTestId('reports-chip-discounts'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('הנחות ורווחיות')
    expect(screen.getByTestId('reports-chip-discounts')).toHaveAttribute('aria-current', 'true')
  })

  it('מעבר-לשונית מאפס את הדוח — דוח של לשונית אחרת אינו קיים בחדשה', async () => {
    renderPage('/reports?tab=exec&report=discounts')
    await screen.findByRole('heading', { level: 1 })
    await click(screen.getByTestId('reports-tab-hostesses'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מבט-על דיילות')
  })

  // S-18: ערך זר בכתובת אינו מסך שבור — הוא נופל לברירת-המחדל.
  it('לשונית או דוח לא-מוכרים בכתובת ⇒ ברירת-מחדל, בלי קריסה', async () => {
    renderPage('/reports?tab=nope&report=nope')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('מבט-על הנהלה')
  })

  it('כתובת חוסמת לשונית שאין לה הרשאה — נופלת לראשונה המותרת', async () => {
    permissions = RECRUIT
    renderPage('/reports?tab=finance')
    expect(await screen.findByTestId('reports-tab-hostesses')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  // 🔴 **הבדיקה שתופסת מסנן-תפאורה.** "היום" מגיע מהשרת (`window.to`), ולכן הטעינה
  // הראשונה שולחת `null` — ורק אחריה הגלולות יכולות לגזור טווח אמיתי. בלי החוליה הזו
  // הגלולות היו משנות את הכתובת ושולחות `null` לנצח, והמסנן לא היה מסנן דבר.
  it('הטעינה הראשונה שולחת null, ואחרי שהשרת מסר "היום" הגלולה גוזרת טווח אמיתי', async () => {
    callReport.mockResolvedValue(
      payload({
        tiles: [{ key: 'a', label: 'הכנסות', value: 1, format: 'money' }],
        window: { from: '2026-01-01', to: '2026-09-16', label: '2026' },
      }),
    )
    renderPage()
    await screen.findByTestId('reports-filters')
    expect(callReport.mock.calls[0][1].from).toBeNull()
    expect(callReport.mock.calls[0][1].to).toBeNull()

    await click(screen.getByTestId('reports-period-month'))
    await waitFor(() => {
      const last = callReport.mock.calls.at(-1)[1]
      expect(last.from).toBe('2026-09-01')
      expect(last.to).toBe('2026-09-16')
    })
  })

  it('"הכול" מאפס את שני הקצוות — השרת בוחר את חלון-ברירת-המחדל של הכרטיס', async () => {
    renderPage()
    await screen.findByTestId('reports-filters')
    await click(screen.getByTestId('reports-period-all'))
    const last = callReport.mock.calls.at(-1)[1]
    expect(last.from).toBeNull()
    expect(last.to).toBeNull()
  })
})

describe('מ1 — מצבי-המעטפת (📐10)', () => {
  it('תקלה מציגה את מצב-השגיאה עם "נסי שוב", ולא "אין נתונים"', async () => {
    callReport.mockRejectedValue(Object.assign(new Error('boom'), { code: 'XX000' }))
    renderPage()
    expect(await screen.findByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
    expect(screen.getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(screen.queryByText('אין נתונים עדיין')).toBeNull()
  })

  it('"נסי שוב" קורא שוב ל-API', async () => {
    callReport.mockRejectedValue(Object.assign(new Error('boom'), { code: 'XX000' }))
    renderPage()
    const retry = await screen.findByRole('button', { name: 'נסי שוב' })
    const before = callReport.mock.calls.length
    await click(retry)
    expect(callReport.mock.calls.length).toBeGreaterThan(before)
  })

  // 🔴 חסימת-הרשאה **אינה** תקלה: כפתור "נסי שוב" עליה לעולם לא יעזור.
  it('42501 ⇒ מצב חוסר-הרשאה בלי כפתור, ובלי הודעת-השרת', async () => {
    callReport.mockRejectedValue(Object.assign(new Error('permission denied'), { code: '42501' }))
    renderPage()
    expect(await screen.findByText(/אין לך הרשאה לצפות ב/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'נסי שוב' })).toBeNull()
    expect(screen.queryByText(/permission denied/)).toBeNull()
  })

  it('פונקציה שלא נבנתה עדיין מקבלת נוסח עברי, ולא שם-הפונקציה באנגלית', async () => {
    callReport.mockRejectedValue(
      Object.assign(new Error('x'), {
        code: 'PGRST202',
        cause: { message: 'Could not find the function public.report_m02_exec_overview' },
      }),
    )
    renderPage()
    expect(await screen.findByText('הדוח הזה עדיין לא זמין במערכת.')).toBeInTheDocument()
    expect(screen.queryByText(/report_m02/)).toBeNull()
  })

  // 🔑 שני מצבים שונים, והמסנן הוא מה שמפריד ביניהם: "ריק-לגמרי" אינו מציע לנקות מסננים
  // שלא יעזרו, ו"ריק-אחרי-סינון" כן. מיזוגם היה מציע פעולה חסרת-תועלת.
  it('ריק בלי מסנן ⇒ "ריק-לגמרי", בלי כפתור-ניקוי', async () => {
    callReport.mockResolvedValue(payload())
    renderPage('/reports?period=all')
    expect(await screen.findByText('אין נתונים עדיין')).toBeInTheDocument()
    expect(screen.queryByTestId('reports-clear-filters')).toBeNull()
  })

  it('ריק עם מסנן-לקוח ⇒ "ריק-אחרי-סינון" עם כפתור-ניקוי', async () => {
    callReport.mockResolvedValue(payload())
    renderPage('/reports?customer=42')
    expect(await screen.findByText('אין נתונים בתקופה שנבחרה')).toBeInTheDocument()
    expect(screen.getByTestId('reports-clear-filters')).toBeInTheDocument()
  })
})

describe('מ1 — כותרת-העמוד', () => {
  it('יש <h1> אמיתי ברמת-העמוד (§⑤ #11 — סריקת-הנגישות ממתינה לו)', async () => {
    renderPage()
    const h1 = await screen.findAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
  })

  it('📐17 — התקופה מוצגת בכותרת-המשנה', async () => {
    renderPage()
    expect(await screen.findByTestId('reports-window-label')).toHaveTextContent('כל הלקוחות')
  })
})
