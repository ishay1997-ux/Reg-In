// בדיקות S1 — `ParamsTab` (צעד 3.1).
//
// מה נעול כאן, לפי סעיפי המוקאפ המאושר (1 · 8):
// ① שש הקבוצות ומוניהן · ② חיפוש שמוצא **גם לפי התווית העברית וגם לפי שם-השדה במסד**
// (מוקש-המרשם: מי שמחפש `שער_מרחק_קמ` חייב למצוא) · ③ ערך פסול מציג את ההודעה העברית
// **ואינו נשלח** · ④ אצווה מעורבת-בעלות לעולם אינה נוצרת — שורה שאינה שלך מושבתת ·
// ⑤ מצב-צפייה (A-11): שדות מושבתים, הערת "צפייה בלבד", **אין שורת-שמירה** ·
// ⑥ כשל-שמירה נוקב בשם השדה, והטיוטה של השדה הבא נשארת על המסך (C5 §5.6.17.4) ·
// ⑦ שמירה מוצלחת ⇒ הטוסט הנעול "ההגדרות נשמרו".
//
// כל שכבת ה-API ממוקקת; אין רשת ואין Supabase. מוק-הלקוח חובה — `vi.importActual` על
// `api.js` מייבא את `@/supabaseClient` בזמן-הייבוא, ובלעדיו הקובץ נופל **ב-CI בלבד**
// (הלקח שנמדד 02/09/2026 ב-`08_finance/FinancePage.test.jsx`).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import ParamsTab from './ParamsTab'
import { listParams, updateParams, listBelowMinWage } from '@/modules/09_settings/api'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('@/modules/09_settings/api', async () => {
  const actual = await vi.importActual('@/modules/09_settings/api')
  return {
    ...actual,
    listParams: vi.fn(),
    updateParams: vi.fn(),
    listBelowMinWage: vi.fn(),
  }
})

// מצב-ההרשאות מוחלף פר-בדיקה (אותו סגנון-בית כמו `CustomersPage.satisfaction.test.jsx`).
let authState = { user: { roleId: 1 }, permissions: { 'הגדרות מערכת': 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

const CEO = 1
const PROJECTS = 2
const FINANCE = 3
const LOGISTICS = 5

function row(name, value, type, ownerRoleId = null) {
  return { param_name: name, param_value: value, param_type: type, owner_role_id: ownerRoleId }
}

// תשע שורות שמכסות את כל ששת הסוגים — מספיק כדי לנעול מונים, סינון, ובעלות מעורבת,
// בלי לגרור פיקסטורה בת 43 שורות שתתיישן בכל שינוי-Seed.
const ROWS = [
  row('אחוז_מעמ', '18', 'pricing_timing', FINANCE),
  row('ימי_תוקף_הצעה', '30', 'pricing_timing', PROJECTS),
  row('שכר_מינימום_שעתי', '35', 'pricing_timing', FINANCE),
  row('תנאי_תשלום_ימים', '30', 'pricing_timing', FINANCE),
  row('סף_שביעות_רצון', '3', 'control_alerts', FINANCE),
  row('שעות_תוקף_זימון', '48', 'shift_invites', null),
  row('תבנית_מייל_הצעת_מחיר', 'שלום [שם_איש_קשר]', 'templates', PROJECTS),
  row('שער_מרחק_קמ', '80', 'smart_match', null),
  row('גולפוסט_מרחק_קמ', '40', 'smart_match', null),
  row('מייל_משרד_רואי_חשבון', 'acc@example.co.il', 'integration_tech', FINANCE),
]

function renderTab() {
  return render(
    <ToastProvider>
      <ParamsTab />
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState = { user: { roleId: CEO }, permissions: { 'הגדרות מערכת': 'edit' } }
  listParams.mockResolvedValue(ROWS)
  updateParams.mockResolvedValue([])
  listBelowMinWage.mockResolvedValue([])
})

describe('ParamsTab — קבוצות וחיפוש', () => {
  it('מרנדר את שש הקבוצות עם המונים שלהן', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    expect(screen.getByTestId('settings-groups').children).toHaveLength(6)
    expect(screen.getByTestId('settings-group-pricing_timing')).toHaveTextContent('4')
    expect(screen.getByTestId('settings-group-control_alerts')).toHaveTextContent('1')
    expect(screen.getByTestId('settings-group-shift_invites')).toHaveTextContent('1')
    expect(screen.getByTestId('settings-group-templates')).toHaveTextContent('1')
    expect(screen.getByTestId('settings-group-smart_match')).toHaveTextContent('2')
    expect(screen.getByTestId('settings-group-integration_tech')).toHaveTextContent('1')
  })

  it('חיפוש "מרחק" מוצא את שער_מרחק_קמ ומקפיץ לקבוצה שבה הוא יושב', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-search'), { target: { value: 'מרחק' } })
    expect(await screen.findByTestId('settings-value-שער_מרחק_קמ')).toBeInTheDocument()
    expect(screen.getByTestId('settings-group-smart_match')).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByTestId('settings-value-אחוז_מעמ')).not.toBeInTheDocument()
  })

  it('חיפוש לפי שם-השדה במסד מוצא את אותה שורה', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-search'), { target: { value: 'שער_מרחק_קמ' } })
    expect(await screen.findByTestId('settings-value-שער_מרחק_קמ')).toBeInTheDocument()
    expect(screen.getByTestId('settings-group-smart_match')).toHaveTextContent('1')
  })

  it('חיפוש בלי תוצאות אומר זאת ואינו מציג טבלה ריקה', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-search'), { target: { value: 'זזזזז' } })
    expect(await screen.findByTestId('settings-no-results')).toBeInTheDocument()
    expect(screen.queryByTestId('settings-table')).not.toBeInTheDocument()
  })
})

describe('ParamsTab — ולידציה ושמירה', () => {
  it('ערך פסול מציג הודעה עברית ואינו נשלח', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '150' } })

    expect(
      await screen.findByText('ערך חוקי: מספר בין 0 ל-100, עד שתי ספרות אחרי הנקודה'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()

    // ריק ⇒ הודעת-"חסר ערך" ולא טווח (C6, 03/09/2026): מי שמחקה שדה חושבת שהמספר שלה
    // פסול כשהיא מקבלת טווח, ולא שהשדה ריק.
    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '' } })
    expect(await screen.findByText('יש למלא ערך — שדה ריק אינו 0')).toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()
    fireEvent.click(screen.getByTestId('settings-save-button'))
    expect(updateParams).not.toHaveBeenCalled()
  })

  it('שמירה מוצלחת מציגה את הטוסט הנעול ומאפסת את המונה', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '17' } })
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 1 מתוך 4')

    fireEvent.click(screen.getByTestId('settings-save-button'))
    expect(await screen.findByTestId('toast-success')).toHaveTextContent('ההגדרות נשמרו')
    await waitFor(() =>
      expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 0 מתוך 4'),
    )
  })

  it('כשל-שמירה נוקב בשם השדה — והטיוטה של השדה הבא נשארת על המסך', async () => {
    updateParams.mockRejectedValueOnce(new Error('החיבור לשרת נכשל'))
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '19' } })
    fireEvent.change(screen.getByTestId('settings-value-תנאי_תשלום_ימים'), {
      target: { value: '45' },
    })
    fireEvent.click(screen.getByTestId('settings-save-button'))

    expect(await screen.findByTestId('settings-save-failed')).toHaveTextContent(
      'השמירה נכשלה ב"אחוז מע"מ" — החיבור לשרת נכשל',
    )
    expect(screen.getByTestId('settings-value-אחוז_מעמ')).toHaveValue('19')
    expect(screen.getByTestId('settings-value-תנאי_תשלום_ימים')).toHaveValue('45')
    // הרצף נעצר בכשל הראשון — השורה השנייה מעולם לא נשלחה.
    expect(updateParams).toHaveBeenCalledTimes(1)
  })
})

describe('ParamsTab — הרשאות', () => {
  it('בעלת-שורה אינה יכולה ליצור אצווה מעורבת — שורה שאינה שלה מושבתת', async () => {
    authState = { user: { roleId: FINANCE }, permissions: { 'הגדרות מערכת': 'blocked' } }
    renderTab()
    await screen.findByTestId('settings-table')

    expect(screen.getByTestId('settings-value-אחוז_מעמ')).toBeEnabled()
    expect(screen.getByTestId('settings-value-ימי_תוקף_הצעה')).toBeDisabled()

    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '17' } })
    fireEvent.click(screen.getByTestId('settings-save-button'))

    await waitFor(() => expect(updateParams).toHaveBeenCalledTimes(1))
    expect(updateParams).toHaveBeenCalledWith(
      [{ name: 'אחוז_מעמ', value: '17', ownerRoleId: FINANCE }],
      { roleId: FINANCE, canEditAll: false },
    )
  })

  it('הרשאת `view` — כל השדות מושבתים, יש הערת "צפייה בלבד" ואין שורת-שמירה', async () => {
    authState = { user: { roleId: LOGISTICS }, permissions: { 'הגדרות מערכת': 'view' } }
    renderTab()
    const table = await screen.findByTestId('settings-table')

    expect(screen.getByTestId('settings-view-only-note')).toHaveTextContent('צפייה בלבד')
    expect(screen.queryByTestId('settings-save-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('settings-dirty-count')).not.toBeInTheDocument()
    for (const input of within(table).getAllByRole('textbox')) expect(input).toBeDisabled()
  })
})

describe('ParamsTab — מצבי-טעינה ורשימת שכר-המינימום', () => {
  it('כשל-טעינה מציג את הנוסח הנעול וכפתור "נסי שוב" שטוען מחדש', async () => {
    listParams.mockRejectedValueOnce(new Error('boom'))
    renderTab()
    expect(await screen.findByText('לא ניתן לטעון את ההגדרות.')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('settings-retry'))
    await screen.findByTestId('settings-table')
    expect(listParams).toHaveBeenCalledTimes(2)
  })

  // 🔴 **שער-השמירה מסונן לקבוצה הפעילה (אודיט-סגירת מ9, 03/09/2026).** עד עכשיו הוא בדק
  // את **כל** שגיאות-הרוחב: המנכ"לית מהפכת את צמד-המרחקים ב"התאמה חכמה", עוברת ל"תמחור
  // ותזמון", והשמירה שם מתה — עם משפט אדום שמדבר על שני שדות שאינם על המסך. הבדיקה נועלת
  // את שני הצדדים: שקוף בקבוצה הזרה, וחוסם בקבוצה שלו.
  it('🔬 צמד-מרחקים הפוך ב"התאמה חכמה" אינו חוסם שמירה ב"תמחור ותזמון"', async () => {
    renderTab()
    await screen.findByTestId('settings-groups')

    fireEvent.click(screen.getByTestId('settings-group-smart_match'))
    fireEvent.change(await screen.findByTestId('settings-value-גולפוסט_מרחק_קמ'), {
      target: { value: '90' },
    })
    expect(screen.getByTestId('settings-cross-field-error')).toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()

    fireEvent.click(screen.getByTestId('settings-group-pricing_timing'))
    fireEvent.change(await screen.findByTestId('settings-value-אחוז_מעמ'), {
      target: { value: '17' },
    })
    // המשפט שייך לקבוצה השנייה ⇒ אינו מצויר כאן, והכפתור חי.
    expect(screen.queryByTestId('settings-cross-field-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button')).not.toBeDisabled()

    fireEvent.click(screen.getByTestId('settings-save-button'))
    await waitFor(() => expect(updateParams).toHaveBeenCalled())
    expect(updateParams.mock.calls[0][0]).toEqual([
      expect.objectContaining({ name: 'אחוז_מעמ', value: '17' }),
    ])
  })

  it('רשימת "מי מתחת לרף" מוצגת לצד שכר-המינימום, ורק בקבוצה שלו', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    expect(screen.getByTestId('settings-below-min-wage')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('settings-group-smart_match'))
    await waitFor(() =>
      expect(screen.queryByTestId('settings-below-min-wage')).not.toBeInTheDocument(),
    )
  })

  // תצוגה-מקדימה (הוראת-אורקסטרטור, מיגרציה D): הקלדה בשדה השמור-מינימום — לפני שמירה —
  // מזינה את `BelowMinWageList` ב-`draftThreshold`, שאחרי דמדום שולפת מול הערך המוקלד.
  it('הקלדת 40 בשדה שכר-המינימום שולפת את הרשימה מול 40 (תצוגה מקדימה, לפני שמירה)', async () => {
    renderTab()
    await screen.findByTestId('settings-table')
    fireEvent.change(screen.getByTestId('settings-value-שכר_מינימום_שעתי'), {
      target: { value: '40' },
    })

    await waitFor(() => expect(listBelowMinWage).toHaveBeenCalledWith(40), { timeout: 2000 })
    expect(screen.getByTestId('settings-below-min-wage-preview')).toBeInTheDocument()
    expect(updateParams).not.toHaveBeenCalled()
  })
})

// חיווט-גל-2 (§10 · 02/09 22:1X) — `paneComponents.templates`/`smart_match` הם ברירת-המחדל
// האמיתית של `ParamsTab` (לא מדומים כאן): הבדיקות למטה מוודאות שהפאנלים האמיתיים באמת
// מרונדרים על שורות-DB גולמיות, לא רק שה-map מוגדר.
describe('ParamsTab — חיווט-גל-2: הפאנלים האמיתיים מרונדרים', () => {
  // 11 שמות-התבניות החיים (§3.7, אחרי מחיקות Q-2) — שורות-DB גולמיות בדיוק כמו ש-`listParams`
  // באמת מחזירה, לא צורת-מרשם.
  const TEMPLATE_NAMES = [
    'תבנית_מייל_הצעת_מחיר',
    'תבנית_זימון_משמרת',
    'תבנית_מייל_משוב_לקוח',
    'תבנית_מייל_חשבונית_מס',
    'תבנית_מייל_ביטול_משמרת',
    'תבנית_אישור_סופי_שיבוץ',
    'תבנית_תזכורת_משמרת',
    'תבנית_מייל_דוח_שכר',
    'תבנית_מייל_שחרור_משמרת',
    'תבנית_מייל_אירוע_בוטל',
    'תבנית_מייל_פרטי_האירוע_השתנו',
  ]
  const TEMPLATE_LABELS = [
    'הצעת מחיר',
    'זימון משמרת',
    'משוב לקוח',
    'חשבונית מס',
    'ביטול משמרת',
    'אישור סופי שיבוץ',
    'תזכורת משמרת',
    'דוח שכר',
    'שחרור ממשמרת',
    'האירוע בוטל',
    'פרטי האירוע השתנו',
  ]

  it('פאנל התבניות מציג את 11 התוויות האמיתיות מהמרשם (לא ריק, לא צורת-מרשם)', async () => {
    listParams.mockResolvedValue(
      TEMPLATE_NAMES.map((name) => row(name, `גוף-${name}`, 'templates', CEO)),
    )
    renderTab()
    await screen.findByTestId('settings-groups')
    fireEvent.click(screen.getByTestId('settings-group-templates'))

    const list = await screen.findByTestId('settings-template-list')
    for (const label of TEMPLATE_LABELS) expect(list).toHaveTextContent(label)
  })

  it('פאנל Smart Match מרונדר בנוסח-המנכ"ל (variant="ceo") מתוך הלשונית', async () => {
    listParams.mockResolvedValue([
      row('משקולת_היענות', '0.40', 'smart_match', null),
      row('משקולת_אמינות', '0.35', 'smart_match', null),
      row('משקולת_קרבה', '0.25', 'smart_match', null),
    ])
    renderTab()
    await screen.findByTestId('settings-groups')
    fireEvent.click(screen.getByTestId('settings-group-smart_match'))

    expect(await screen.findByTestId('settings-smartmatch-warning')).toHaveTextContent(
      'שינוי כאן משנה שיבוצים אמיתיים.',
    )
  })
})
