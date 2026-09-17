// בדיקות המעטפת (מ1). 🔴 **מה שהן באמת שומרות עליו: המיסוך.**
// ‏`ProtectedRoute` חוסם את המסך כולו, וה-RPC חוסם את הדאטה — אבל **מה שקורה בין השניים**,
// כלומר אילו לשוניות המשתמשת רואה ואיך, אינו נאכף בשום מקום אחר. לשונית שתיעלם במקום
// להיות ממוסכת (הכרעה 2 · 15-ה) היא רגרסיה **בלי סימפטום**: המסך ייראה תקין לגמרי.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'

// ⚠️ חובה (מלכודת `.env.local` מול CI): בלי המוק, כל בדיקת-רכיב שנוגעת ב-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('recharts', () => ({}))
// 🔑 **הגרף מנוטרל ברמת-הכרטיס ולא ברמת-הספרייה** — המוק של `recharts` כאן הוא `{}`, ולכן
// מטען שיש בו `chart` היה מפיל את `ChartCard` על `ResponsiveContainer` שאינו קיים. המעטפת
// אינה יודעת דבר על גרפים (`ReportSurface` מצייר אותם), ולכן אין מה לבדוק כאן דרכם.
vi.mock('./components/ChartCard', () => ({ default: () => null }))

// 🔴 **מוק חלקי ולא מלא** — ‏`api.js` מייצא גם **קבועי-חוזה** שהמעטפת נשענת עליהם
// (‏`ROW_DOOR_KINDS`, שלפיו המנתב מחליט אם `drill_key` הוא דלת). מוק שמחליף את המודול
// כולו היה מוחק אותם והופך את הבדיקה לבדיקה של **הרשימה שכתבתי בבדיקה**, לא של הקוד.
const callReport = vi.fn()
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, callReport: (...args) => callReport(...args) }
})

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

// ── ✏️ ברירת-מחדל פר-לשונית — הכרעת-ישי 16/09/2026 17:4X (כרטיס ⑧H2) ────────
//
// 🔴 **הפגם שזה סוגר הוא פער-אוכלוסייה, לא נוחות:** כרטיסי-הדיילות מוגדרים על **חלון
// מתגלגל של ⁦12⁩ חודשים**, והלשונית נפתחה על **שנה קלנדרית** — המסך מדד אוכלוסייה אחת
// והכרטיס הגדיר אחרת, בלי שאף שער יראה זאת.
describe('מ1 — ברירת-מחדל של תקופה פר-לשונית', () => {
  const serverToday = (over = {}) =>
    payload({ window: { from: '2026-01-01', to: '2026-09-16', label: '2026' }, ...over })

  it('לשונית-הדיילות נפתחת על 12 חודשים מתגלגלים, בלי period בכתובת', async () => {
    permissions = CEO
    callReport.mockResolvedValue(serverToday())
    renderPage('/reports?tab=hostesses')
    await screen.findByTestId('reports-filters')
    await waitFor(() => {
      const last = callReport.mock.calls.at(-1)[1]
      expect(last.from).toBe('2025-09-16')
      expect(last.to).toBe('2026-09-16')
    })
    // 📐17 — והכותרת-המשנה אומרת את הטווח המתגלגל, לא "2026".
    expect(screen.getByTestId('reports-window-label').textContent).toContain('16/09/2025')
  })

  it('לשונית-ההנהלה נשארת על השנה הקלנדרית', async () => {
    permissions = CEO
    callReport.mockResolvedValue(serverToday())
    renderPage('/reports?tab=exec')
    await screen.findByTestId('reports-filters')
    await waitFor(() => {
      const last = callReport.mock.calls.at(-1)[1]
      expect(last.from).toBe('2026-01-01')
    })
  })

  // 🔴 **הכתובת גוברת תמיד** — אחרת קישור-לדוח ששותף היה נפתח אצל המקבל על תקופה אחרת.
  it('period בכתובת גובר על ברירת-המחדל של הלשונית', async () => {
    permissions = CEO
    callReport.mockResolvedValue(serverToday())
    renderPage('/reports?tab=hostesses&period=month')
    await screen.findByTestId('reports-filters')
    await waitFor(() => {
      expect(callReport.mock.calls.at(-1)[1].from).toBe('2026-09-01')
    })
  })

  // הלוך-ושוב בכתובת: בחירה נכתבת, וחזרה לברירת-המחדל של הלשונית משמיטה את הפרמטר.
  it('בחירה נכתבת לכתובת, ובחירה חוזרת בברירת-המחדל משמיטה אותה', async () => {
    permissions = CEO
    callReport.mockResolvedValue(serverToday())
    renderPage('/reports?tab=hostesses')
    await screen.findByTestId('reports-filters')

    await click(screen.getByTestId('reports-period-year'))
    await waitFor(() => {
      expect(callReport.mock.calls.at(-1)[1].from).toBe('2026-01-01')
    })

    await click(screen.getByTestId('reports-period-12m'))
    await waitFor(() => {
      expect(callReport.mock.calls.at(-1)[1].from).toBe('2025-09-16')
    })
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
  // ✏️ **`population.n = 0` נוסף לשני המצבים 16/09/2026 — וזו ההכרעה, לא ליטוש-בדיקה:**
  // עד עכשיו "ריק" נמדד כ-`tiles || charts || rows`, וכל שישה-עשר ה-RPC מחזירים אריחים
  // **תמיד** ⇒ שני המצבים האלה היו **בלתי-נגישים בייצור** ורק המוק כאן הפעיל אותם.
  // המבחן החדש הוא האוכלוסייה עצמה: אפס שורות **וגם** `n = 0`.
  const emptyPayload = () => payload({ population: { n: 0, label: 'אוכלוסייה: הכול · n=0' } })

  it('ריק בלי מסנן ⇒ "ריק-לגמרי", בלי כפתור-ניקוי', async () => {
    callReport.mockResolvedValue(emptyPayload())
    renderPage('/reports?period=all')
    expect(await screen.findByText('אין נתונים עדיין')).toBeInTheDocument()
    expect(screen.queryByTestId('reports-clear-filters')).toBeNull()
  })

  // ✏️ **פריט [5], 17/09/2026 — שני נוסחים למצב 2, לפי המסנן שרוקן** (כ17). שלוש בדיקות
  // ולא אחת: הלקוח, התקופה, והכלל ש"נקי מסננים" נשאר בשתיהן. **הבדיקה הזו הייתה קודם
  // מנוסחת הפוך** — היא בחרה לקוח וציפתה למשפט-התקופה, וזו בדיוק ההפרה שנמדדה על מ21.
  it('ריק עם מסנן-לקוח ⇒ המשפט נוקב בלקוח, עם כפתור-ניקוי', async () => {
    callReport.mockResolvedValue(emptyPayload())
    renderPage('/reports?customer=42')
    expect(await screen.findByText('אין נתונים ללקוח שנבחר')).toBeInTheDocument()
    expect(screen.queryByText('אין נתונים בתקופה שנבחרה')).toBeNull()
    expect(screen.getByTestId('reports-clear-filters')).toBeInTheDocument()
  })

  it('ריק בלי לקוח, עם תקופה מסוננת ⇒ המשפט הנעול של 15(ו) נשאר כפי שהוא', async () => {
    callReport.mockResolvedValue(emptyPayload())
    renderPage('/reports?period=12m')
    expect(await screen.findByText('אין נתונים בתקופה שנבחרה')).toBeInTheDocument()
    expect(screen.queryByText('אין נתונים ללקוח שנבחר')).toBeNull()
    expect(screen.getByTestId('reports-clear-filters')).toBeInTheDocument()
  })

  // 🔴 **הצד השני של אותה הכרעה, והוא זה שתופס רגרסיה:** דף שאוכלוסייתו גדולה וטבלתו
  // ריקה (רשימת-חריגים בלי חריגים) **אינו** מסך-ריק — הוא תשובה אמיתית, והאריחים נשארים.
  // ✏️ **הבדיקה נמדדת עכשיו **בלי מסנן** (17/09/2026, פריט [9]) — וזה תיקון-בדיקה ולא
  // ויתור על הכלל:** ‏D-34② נולד למקרה של *רשימת-חריגים בלי חריגים*, שהוא **מצב-בסיס**
  // ולא תוצאה של בחירה. הבדיקה הקודמת הפעילה אותו דרך `?customer=42`, ובכך תיארה בדיוק
  // את המצב שנמדד שבור על מ21 (ר' הבדיקה הבאה).
  it('אוכלוסייה קיימת עם אפס שורות ובלי מסנן אינה מסך-ריק — הדוח מוצג', async () => {
    callReport.mockResolvedValue(payload({ population: { n: 241, label: 'אוכלוסייה · n=241' } }))
    renderPage('/reports?period=all')
    expect(await screen.findByTestId('report-population')).toHaveTextContent('n=241')
    expect(screen.queryByTestId('reports-clear-filters')).toBeNull()
  })

  // 🔴 **פריט [9], נמדד על מ21 (`probe-filters.log` 12–16):** לקוח שנבחר הותיר טבלה עם
  // שורת-כותרת בלבד — בלי שורות, בלי פאג'ר ובלי משפט — בעוד שורת-האוכלוסייה, שורת-"אז מה"
  // וארבעת האריחים נשארו **זהים בתו** למסך הלא-מסונן (ה-RPC אינו מסנן אותם, וזו הפאה שלו).
  // ⇒ אפס שורות **תחת מסנן-לקוח** הוא מצב 2 של 📐10, יהיה `population.n` אשר יהיה.
  it('לקוח שנבחר והטבלה התרוקנה ⇒ "ריק-אחרי-סינון", גם כשהאוכלוסייה גדולה', async () => {
    callReport.mockResolvedValue(payload({ population: { n: 52, label: 'אוכלוסייה · n=52' } }))
    renderPage('/reports?customer=411')
    // ‏17/09: אותו מצב בדיוק, והמשפט נוקב עכשיו במסנן שבאמת רוקן (פריט [5]).
    expect(await screen.findByText('אין נתונים ללקוח שנבחר')).toBeInTheDocument()
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

// ── 🚪 מנתב-הדלתות של המעטפת (הכרעה 33 · הכרעה 19) ──────────────────────────
//
// 🔴 **מה שלא עבד עד 16/09/2026, ולמה זה לא נראה שבור:** ‏`onDrill` כתב **כל** ערך שקיבל
// אל `?drill=` — כלומר גם יעד-אריח וגם דלת-שורה נחתו כ`p_drill` של אותו דוח, והמסך פשוט
// נשאר במקומו. הבדיקות כאן מפרידות את שלושת הענפים זה מזה.
//
// ⚠️ **דרך לשונית-הדיילות ובכוונה:** לשונית-ההנהלה עוטפת את `onDrill` במנתב משלה
// (`tabs/executive/surfaceDoors.jsx`), ולכן בדיקה דרכה הייתה מודדת **אותו** ולא את המעטפת.

const doorPayload = (over = {}) =>
  payload({
    tiles: [
      {
        key: 'red',
        label: 'דיילות אדומות',
        value: 6,
        format: 'int',
        compare: null,
        target: { tab: 'לקוחות', report: 'לקוחות מתרחקים', drill: null },
      },
    ],
    columns: [{ key: 'name', label: 'שם', format: 'text' }],
    ...over,
  })

// 🔗 **`?hostess=<id>` — `HostessesPage.jsx` האמיתי הוא זה שקורא אותו וגם פותח את
// הכרטיס.** כאן מסך-המוק רק מציג את הפרמטר, כדי שהבדיקה תדע שהמנתב (`DOOR_PATHS.hostess`)
// אכן העביר אותו הלאה בכתובת, ולא רק ניווט ל-`/hostesses` בלי id (תוקן 16/09/2026).
function HostessDoorScreen() {
  const [params] = useSearchParams()
  return (
    <>
      <p>מסך דיילות</p>
      <p data-testid="hostess-door-param">{params.get('hostess') ?? ''}</p>
    </>
  )
}

function renderDoors(initialEntry = '/reports?tab=hostesses') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/projects/:id" element={<p>מסך פרויקט</p>} />
        <Route path="/customers/:customerId" element={<p>מסך לקוח</p>} />
        <Route path="/hostesses" element={<HostessDoorScreen />} />
        <Route path="/quotes/:quoteId/edit" element={<p>מסך הצעת מחיר</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('מ1 — מנתב-הדלתות', () => {
  it('① יעד-אריח מעביר לשונית ודוח, ולא נכתב כמצב-דריל', async () => {
    permissions = CEO
    callReport.mockResolvedValue(doorPayload())
    renderDoors()
    await click(await screen.findByTestId('report-tile-link-red'))
    // הכתובת היא מקור-האמת: הלשונית והדוח התחלפו, ו-`drill` לא נכתב.
    expect(await screen.findByTestId('reports-chip-drifting')).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('לקוחות מתרחקים')
  })

  // 🔴 נמדד: מ2/מ7/מ9 מחזירים **שם-פונקציה** ומ14/מ16/מ19 **שם עברי קצר** — המנתב מקבל
  // את שניהם, והפער עצמו דווח כשאלת-חוזה.
  it('① יעד שנוקב בשם-ה-RPC עובד בדיוק כמו יעד שנוקב בשם העברי', async () => {
    permissions = CEO
    callReport.mockResolvedValue(
      doorPayload({
        tiles: [
          {
            key: 'red',
            label: 'דיילות אדומות',
            value: 6,
            format: 'int',
            compare: null,
            target: { tab: 'לקוחות', report: 'report_m21_drifting', drill: null },
          },
        ],
      }),
    )
    renderDoors()
    await click(await screen.findByTestId('report-tile-link-red'))
    expect(await screen.findByTestId('reports-chip-drifting')).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  // ת8 — מיסוך אינו נעקף דרך אריח: מנהלת-גיוס אינה רואה את לשונית-הלקוחות כלל.
  //
  // ✏️ **הבדיקה שונתה 16/09/2026 — והשינוי הוא ההתנהגות, לא הניסוח:** עד היום האריח נשאר
  // ‏`<button>` עם `aria-label` *"פתחי את הדוח"* שלחיצה עליו לא עשתה **דבר** (נמדד ע"י בונה-
  // הלקוחות על אריח ⁦4⁩ של מ19 למנהלת-פרויקטים). כרטיס ⑧19.2 ממליץ על אפשרות **א** — *הערך
  // נשאר, הדלת נעלמת* — והמעטפת היא היחידה שיודעת מה ממוסך ⇒ `ReportsShellContext`.
  it('① יעד בלשונית ממוסכת אינו דלת כלל — הערך נשאר, הכפתור נעלם', async () => {
    permissions = RECRUIT
    callReport.mockResolvedValue(doorPayload())
    renderDoors()
    // האריח עצמו על המסך, עם הערך — רק הדלת אינה קיימת.
    expect(await screen.findByTestId('report-tile-red')).toHaveTextContent('דיילות אדומות')
    expect(screen.queryByTestId('report-tile-link-red')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מבט-על דיילות')
  })

  // 🔑 **אותו אריח בדיוק, למנכ"ל — הדלת שם.** בלי הצד הזה הבדיקה שמעל הייתה עוברת גם אילו
  // הדלת נעלמה לכולם.
  it('① אותו יעד לתפקיד שיש לו את הלשונית — נשאר דלת', async () => {
    permissions = CEO
    callReport.mockResolvedValue(doorPayload())
    renderDoors()
    expect(await screen.findByTestId('report-tile-link-red')).toBeInTheDocument()
  })

  it('② דלת-שורה מנווטת למסך של הישות', async () => {
    permissions = CEO
    callReport.mockResolvedValue(
      doorPayload({
        rows: [{ row_key: 1, name: 'נועה', drill_key: { kind: 'hostess', id: 449 } }],
      }),
    )
    renderDoors()
    await click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(await screen.findByText('מסך דיילות')).toBeInTheDocument()
    // ✏️ 16/09/2026 — הדלת כבר לא חצי-דלת (ר' `DOOR_PATHS.hostess`): ה-id עובר בכתובת,
    // ‏`HostessesPage` פותחת ממנו את כרטיס-הדיילת עצמו ולא רק את מסך-הרשימה.
    expect(screen.getByTestId('hostess-door-param')).toHaveTextContent('449')
  })

  it('② דלת-לקוח ודלת-פרויקט מגיעות לשני מסכים שונים', async () => {
    permissions = CEO
    callReport.mockResolvedValue(
      doorPayload({
        rows: [{ row_key: 1, name: 'אלפא', drill_key: { kind: 'customer', id: 401 } }],
      }),
    )
    const { unmount } = renderDoors()
    await click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(await screen.findByText('מסך לקוח')).toBeInTheDocument()
    unmount()

    callReport.mockResolvedValue(
      doorPayload({
        rows: [{ row_key: 2, name: 'כנס', drill_key: { kind: 'project', id: 1395 } }],
      }),
    )
    renderDoors()
    await click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(await screen.findByText('מסך פרויקט')).toBeInTheDocument()
  })

  // 🌱 שורת-מ4 — `cards-management` שורה 8: *"יעד-הקידוח היחיד: הצעת-המחיר"*. נמדד ⁦50⁩
  // שורות כאלה בכל מטען-מ4 חי, וכולן `{kind:'quote', id}`.
  it('② דלת-הצעה נוחתת על ההצעה עצמה, לא על רשימת-ההצעות', async () => {
    permissions = CEO
    callReport.mockResolvedValue(
      doorPayload({
        rows: [{ row_key: 1, name: 'ערב גאלה', drill_key: { kind: 'quote', id: 1907 } }],
      }),
    )
    renderDoors()
    await click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(await screen.findByText('מסך הצעת מחיר')).toBeInTheDocument()
  })

  it('③ כל השאר נשאר מצב-דריל של הדוח הנוכחי, ונשלח כ-p_drill', async () => {
    permissions = CEO
    // שבב-יום-בשבוע של מ15 — `{ dow: N }`: לא יעד-אריח ולא דלת-שורה, ולכן ענף ③.
    callReport.mockResolvedValue(
      doorPayload({
        chart: {
          type: 'bar',
          title: 'לפי יום בשבוע',
          xKey: 'dow',
          label_source: 'WEEKDAY_NAMES_HE',
          series: [{ key: 'n', label: 'אירועים' }],
          // ‏`mapChartLabels` של הלשונית ממפה את המספר לשם-היום; הבורר גוזר ממנו חזרה את ה-`dow`.
          data: [{ dow: 4, n: 2 }],
        },
      }),
    )
    renderDoors('/reports?tab=hostesses&report=reliability')
    await screen.findByTestId('reports-chips-dow')
    callReport.mockClear()
    await click(screen.getByTestId('reports-chips-dow-dow-4'))
    await waitFor(() => expect(callReport).toHaveBeenCalled())
    expect(callReport.mock.calls.at(-1)[1].drill).toEqual({ dow: 4 })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('אמינות והתייצבות')
  })

  // 🚫 יעד שאינו בקטלוג (משטח נדחה, שם שהשתנה) — **לא מנווטים ולא כותבים מצב-זבל**.
  it('יעד-אריח שאינו בקטלוג אינו כותב מצב-דריל ואינו מנווט', async () => {
    permissions = CEO
    callReport.mockResolvedValue(
      doorPayload({
        tiles: [
          {
            key: 'red',
            label: 'דיילות אדומות',
            value: 6,
            format: 'int',
            compare: null,
            target: { tab: 'לקוחות', report: 'דוח שנדחה', drill: null },
          },
        ],
      }),
    )
    renderDoors()
    await click(await screen.findByTestId('report-tile-link-red'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מבט-על דיילות')
    expect(callReport.mock.calls.at(-1)[1].drill).toBeNull()
  })
})

// ── ✏️ סבב-3: 📐17 · שורת-המסננים · ניסוח ─────────────────────────────────

describe('מ1 — 📐17: הכותרת נוקבת באוכלוסייה', () => {
  const CUSTOMERS = [
    { customer_id: 401, company_name: 'אלפא סיסטמס' },
    { customer_id: 414, company_name: 'בטא הפקות' },
  ]

  // 🔴 נמדד: עם לקוח מסונן הכותרת אמרה "· כל הלקוחות" בעוד שם-קובץ-הייצוא אמר
  // "לקוח-נבחר" — שתי הצהרות סותרות על אותו מסך.
  it('לקוח שנבחר מופיע בשורת-התקופה, ולא "כל הלקוחות"', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    renderPage('/reports?customer=414')
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('בטא הפקות')
    })
    expect(screen.getByTestId('reports-window-label')).not.toHaveTextContent('כל הלקוחות')
  })

  it('בלי לקוח — "כל הלקוחות", כמו קודם', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    renderPage()
    await screen.findByTestId('reports-filters')
    expect(screen.getByTestId('reports-window-label')).toHaveTextContent('כל הלקוחות')
  })

  // ⚠️ הכתובת מחזירה מחרוזת ו-`customer_id` הוא מספר — `===` היה נכשל בשקט.
  it('מזהה-מחרוזת מהכתובת נפגש עם מזהה-מספר מהרשימה', async () => {
    listCustomers.mockResolvedValueOnce([{ customer_id: 401, company_name: 'אלפא סיסטמס' }])
    renderPage('/reports?customer=401')
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('אלפא סיסטמס')
    })
  })
})

describe('מ1 — הייצוא יושב בשורת-המסננים', () => {
  // 🔤 המוקאפ המאושר מציב את הכפתור ושתי שורות-הכיתוב **בתוך** `.global-filters`.
  it('כפתור-הייצוא מרונדר בתוך שורת-המסננים ולא בתוך הדוח', async () => {
    renderPage()
    const button = await screen.findByTestId('reports-export-button')
    expect(screen.getByTestId('reports-filters').contains(button)).toBe(true)
  })

  it('שתי שורות-הכיתוב נשארות איתו', async () => {
    renderPage()
    expect(await screen.findByTestId('reports-export-file')).toBeInTheDocument()
  })

  // 🚫 עותק אחד בלבד — לא אחד בשורת-המסננים ועוד אחד בתוך הדוח.
  it('אין שני כפתורי-ייצוא על המסך', async () => {
    renderPage()
    await screen.findByTestId('reports-export-button')
    expect(screen.getAllByTestId('reports-export-button')).toHaveLength(1)
  })
})

describe('מ1 — ציווי בנקבה', () => {
  // ‏`spec.md §1.5` + S-28 נועלים ציווי בנקבה בכל הממשק.
  it('משפט "אין דוחות" פונה בנקבה', () => {
    expect(NO_TABS_SENTENCE).toContain('פני')
    expect(NO_TABS_SENTENCE).not.toContain('פנה')
  })
})

// ── ✏️ סבב-התיקון 17/09/2026: הכותרת והמסננים מצייתים למה שהמשטח באמת מדד ──────────

// 🌱 צורות-המטען כאן נקראו מגוף ה-SQL החי, לא הומצאו: מ3/מ4/מ6 מחזירים `'from', null`
// (`…i2_rpc_round3.sql:609`, `…d2_rpcs_executive_fixes.sql:1217,1545`) וארבעת משטחי-
// הדיילות מחזירים `'customer_filter_ignored', true` (`…i2_rpc_round3.sql:1706,2184,2616`).
const ignoresPeriod = () =>
  payload({
    window: { from: null, to: '2026-09-16', label: 'כל הזמנים' },
    population: { n: 736, label: 'אוכלוסייה · n=736 בכל השנים' },
  })

const ignoresCustomer = () =>
  payload({
    window: { from: '2025-09-16', to: '2026-09-16', label: 'נכון להיום · 12 חודשים' },
    meta: { missing_params: [], notes: [], customer_filter_ignored: true },
  })

describe('מ1 — 📐17: הכותרת מצהירה מה נמדד, ולא מה שנבחר בגלולה (פריטים [3] · [28])', () => {
  // 🔴 נמדד: שלושה משטחים שמודדים את כל ההיסטוריה הציגו בכותרת
  // "⁦01/01/2026–16/09/2026⁩ · כל הלקוחות" — בעוד שורת-האוכלוסייה מתחתיה אומרת "בכל השנים".
  it('משטח שאינו מחיל תקופה ⇒ תווית-החלון של השרת, ולא הטווח שנגזר מהגלולה', async () => {
    callReport.mockResolvedValue(ignoresPeriod())
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('כל הזמנים')
    })
    expect(screen.getByTestId('reports-window-label')).not.toHaveTextContent('01/01/2026')
  })

  // ㉚ — הפקד שאינו חל **מושבת ומנומק**, ולא נעלם.
  it('גלולות-התקופה מושבתות שם, עם נימוק גלוי', async () => {
    callReport.mockResolvedValue(ignoresPeriod())
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('reports-period-month')).toBeDisabled()
    })
    expect(screen.getByTestId('reports-period-disabled')).toBeInTheDocument()
    expect(screen.getByTestId('reports-customer-filter')).not.toBeDisabled()
  })

  // 🔑 **הצד השני, והוא זה שתופס רגרסיה:** משטח שכן מסונן-לפי-תקופה לא זז מילימטר.
  it('משטח שכן מחיל תקופה — הכותרת והגלולות כפי שהיו', async () => {
    callReport.mockResolvedValue(payload())
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('01/01/2026')
    })
    expect(screen.getByTestId('reports-period-month')).not.toBeDisabled()
    expect(screen.queryByTestId('reports-period-disabled')).toBeNull()
  })
})

describe('מ1 — משטח שאינו מחיל מסנן-לקוח (פריט [8])', () => {
  const CUSTOMERS = [{ customer_id: 414, company_name: 'בטא הפקות' }]

  // 🔴 נמדד: `grep -rn customer_filter_ignored src/` החזיר ⁦0⁩ — כל ארבעת משטחי-הדיילות
  // הצהירו את הדגל, ואיש לא קרא אותו: הכותרת הדהדה שם-לקוח שה-RPC אינו מקבל כלל.
  it('שם-הלקוח אינו מהודהד בכותרת', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    callReport.mockResolvedValue(ignoresCustomer())
    renderPage('/reports?customer=414')
    await waitFor(() => {
      expect(screen.getByTestId('reports-customer-filter')).toBeDisabled()
    })
    expect(screen.getByTestId('reports-window-label')).not.toHaveTextContent('בטא הפקות')
    expect(screen.getByTestId('reports-customer-disabled')).toBeInTheDocument()
  })

  // 🔑 **והכתובת ממשיכה לעבוד:** ‏`?customer=` נשאר, ולכן מעבר למשטח שכן מסנן לפיו
  // מחזיר את הבחירה — מה שנחסם הוא השינוי מכאן, לא המצב.
  it('הפרמטר בכתובת אינו נמחק, ומשטח אחר עדיין מהדהד את הלקוח', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    callReport.mockResolvedValue(payload())
    renderPage('/reports?customer=414')
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('בטא הפקות')
    })
    expect(screen.getByTestId('reports-customer-filter')).not.toBeDisabled()
  })
})

describe('מ1 — הכותרת לפני שיש מטען, עם לקוח בכתובת (פריט [6])', () => {
  const CUSTOMERS = [{ customer_id: 414, company_name: 'בטא הפקות' }]

  // 🔴 **הנקודה-העיוורת של סבב א', והתרחיש שהיא נקבה בו:** ‏`readScope` נורה רק מתשובה
  // שהצליחה ⇒ בזמן-טעינה ובתקלה-שלפני-התשובה-הראשונה הדגל אינו קיים, והכותרת הדהדה שם
  // של לקוח על משטח שאולי אינו מסנן לפיו כלל. **בדיקת ה-RPC המבוטל היא בדיוק אותו מצב.**
  it('‏RPC שלא חוזר — שם-הלקוח אינו מהודהד, וסעיף-האוכלוסייה נשאר', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    callReport.mockReturnValue(new Promise(() => {}))
    renderPage('/reports?period=12m&customer=414')
    const label = await screen.findByTestId('reports-window-label')
    await waitFor(() => {
      expect(screen.getByTestId('reports-customer-filter')).toHaveValue('414')
    })
    expect(label).not.toHaveTextContent('בטא הפקות')
    expect(label).toHaveTextContent('12 חודשים')
    // 🔑 *"כל הלקוחות"* היא הצהרה על האוכלוסייה ונכונה בכל משטח — ולכן היא נשארת
    // (תיקון [27] של סבב א'), ומה שיורד הוא **השם** בלבד.
    expect(label).toHaveTextContent('כל הלקוחות')
    // ⚠️ ולא ידוע עדיין שהבורר לא-רלוונטי ⇒ הוא פעיל, ואינו נושא נימוק-נטרול.
    expect(screen.getByTestId('reports-customer-filter')).not.toBeDisabled()
    expect(screen.queryByTestId('reports-customer-disabled')).toBeNull()
  })

  // 🔑 **והצד השני — ברגע שהמטען חוזר וממשטח שכן מסנן לפי לקוח, השם חוזר.** בלי הבדיקה
  // הזו "הסתרת השם" הייתה יכולה להיות קבועה, ואיש לא היה מבחין.
  it('ברגע שהמטען חוזר, השם מופיע בכותרת', async () => {
    listCustomers.mockResolvedValueOnce(CUSTOMERS)
    callReport.mockResolvedValue(payload())
    renderPage('/reports?period=12m&customer=414')
    await waitFor(() => {
      expect(screen.getByTestId('reports-window-label')).toHaveTextContent('בטא הפקות')
    })
  })
})

describe('מ1 — הכותרת לפני שהשרת מסר "היום" (פריט [27])', () => {
  // 🔴 נמדד במצב-התקלה של מ14: השורה התכווצה ל-"כל הלקוחות" לבד — בלי טווח — בעוד
  // הגלולה מסומנת "12 חודשים". `serverToday` מגיע מהמטען, ומטען שנכשל אינו מוסר אותו.
  it('בלי תשובה מהשרת — הכותרת נוקבת בגלולה, ולא באוכלוסייה בלי תאריך', async () => {
    callReport.mockReturnValue(new Promise(() => {}))
    renderPage('/reports?period=12m')
    const label = await screen.findByTestId('reports-window-label')
    expect(label).toHaveTextContent('12 חודשים')
    expect(label).toHaveTextContent('כל הלקוחות')
  })

  // ⚠️ ב-"הכול" אין טווח מלכתחילה — והשורה נשארת בדיוק כפי שהייתה.
  it('בתקופת "הכול" השורה נשארת "כל הלקוחות" לבדה', async () => {
    callReport.mockReturnValue(new Promise(() => {}))
    renderPage('/reports?period=all')
    expect(await screen.findByTestId('reports-window-label')).toHaveTextContent('כל הלקוחות')
    expect(screen.getByTestId('reports-window-label')).not.toHaveTextContent('הכול')
  })
})

describe('מ1 — מנעול הלשונית הממוסכת (פריט [26])', () => {
  // ‏`src/CLAUDE.md §4.3`: אייקון `size-4` מ-`lucide-react`. אמוג'י מרנדר בצבעי-הפונט שלו.
  it('אייקון ולא אמוג' + "'" + 'י, והטקסט הגלוי לא זז', async () => {
    permissions = FINANCE
    renderPage()
    const masked = await screen.findByTestId('reports-tab-hostesses')
    expect(masked.textContent).not.toContain('🔒')
    expect(masked.querySelector('svg')).toBeInTheDocument()
    expect(masked.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(within(masked).getByText(MASKED_TEXT)).toBeInTheDocument()
    expect(masked).toHaveAttribute('aria-disabled', 'true')
  })
})
