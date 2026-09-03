// בדיקות S4 — `MySettingsPage` ("ההגדרות שלי", צעד 3.4).
//
// מה נעול כאן: `listMyParams` נקראת עם `roleId` הנוכחי (§4.4 — "queries with owner_role_id =
// roleId, never all then filter") · מציגה **רק** את השורות שהוחזרו (לא לשונית-ניווט כמו
// `ParamsTab`) · מחרוזת-הריק הנעולה (§3.7) · הפאנלים האמיתיים (`TemplateEditor`/`SmartMatchPane`
// בנוסח-בעלים) מרונדרים דרך `paneComponents`-מקומי, לא מדומים · שמירה-אחת-לכל-הדף.
//
// אותה תשתית-מוק כמו `ParamsTab.test.jsx` (`vi.importActual` כדי לא לגעת ב-`@/supabaseClient`
// אמיתי בזמן-הייבוא — הלקח שנמדד ב-`FinancePage.test.jsx`, §2.9).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import MySettingsPage from './MySettingsPage'
import { listMyParams, updateParams } from '@/modules/09_settings/api'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('@/modules/09_settings/api', async () => {
  const actual = await vi.importActual('@/modules/09_settings/api')
  return {
    ...actual,
    listMyParams: vi.fn(),
    updateParams: vi.fn(),
    listBelowMinWage: vi.fn().mockResolvedValue([]),
  }
})

const FINANCE = 3
let authState = { user: { roleId: FINANCE }, permissions: { 'הגדרות מערכת': 'blocked' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

function row(name, value, type, ownerRoleId) {
  return { param_name: name, param_value: value, param_type: type, owner_role_id: ownerRoleId }
}

function renderPage() {
  return render(
    <ToastProvider>
      <MySettingsPage />
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState = { user: { roleId: FINANCE }, permissions: { 'הגדרות מערכת': 'blocked' } }
  listMyParams.mockResolvedValue([])
  updateParams.mockResolvedValue([])
})

describe('MySettingsPage — טעינה מסוננת-שרת', () => {
  it('קוראת ל-listMyParams עם ה-roleId של המשתמשת המחוברת, לא "הכול ואז סינון"', async () => {
    renderPage()
    await screen.findByTestId('settings-my-page')
    expect(listMyParams).toHaveBeenCalledWith(FINANCE)
    expect(listMyParams).toHaveBeenCalledTimes(1)
  })

  it('כשל-טעינה מציג את הנוסח הנעול וכפתור "נסי שוב" שטוען מחדש', async () => {
    listMyParams.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    expect(await screen.findByText('לא ניתן לטעון את ההגדרות.')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('settings-my-retry'))
    await screen.findByTestId('settings-my-page')
    expect(listMyParams).toHaveBeenCalledTimes(2)
  })
})

describe('MySettingsPage — ריק (V-7: פאיל-סייף)', () => {
  it('אין שורות בבעלות ⇒ מחרוזת-הריק הנעולה, בלי טבלאות ובלי שורת-שמירה', async () => {
    listMyParams.mockResolvedValue([])
    renderPage()
    expect(await screen.findByTestId('settings-my-empty')).toHaveTextContent(
      'אין הגדרות בבעלות התפקיד שלך',
    )
    expect(screen.queryByTestId('settings-save-button')).not.toBeInTheDocument()
  })
})

describe('MySettingsPage — מציגה רק את השורות שהוחזרו', () => {
  it('מציגה את שתי הקבוצות שהוחזרו בלבד, עם המונים הנכונים', async () => {
    listMyParams.mockResolvedValue([
      row('אחוז_מעמ', '18', 'pricing_timing', FINANCE),
      row('תנאי_תשלום_ימים', '30', 'pricing_timing', FINANCE),
      row('סף_שביעות_רצון', '3', 'control_alerts', FINANCE),
    ])
    renderPage()
    await screen.findByTestId('settings-my-page')

    expect(screen.getByTestId('settings-my-group-pricing_timing')).toHaveTextContent('(2)')
    expect(screen.getByTestId('settings-my-group-control_alerts')).toHaveTextContent('(1)')
    expect(screen.queryByTestId('settings-my-group-smart_match')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-value-אחוז_מעמ')).toBeInTheDocument()
  })

  it('שינוי + שמירה שולחים אצווה אחת עם ownerRoleId נכון, ומציגים את הטוסט הנעול', async () => {
    listMyParams.mockResolvedValue([row('אחוז_מעמ', '18', 'pricing_timing', FINANCE)])
    renderPage()
    await screen.findByTestId('settings-value-אחוז_מעמ')

    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '17' } })
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 1 מתוך 1')
    fireEvent.click(screen.getByTestId('settings-save-button'))

    await waitFor(() =>
      expect(updateParams).toHaveBeenCalledWith(
        [{ name: 'אחוז_מעמ', value: '17', ownerRoleId: FINANCE }],
        { roleId: FINANCE, canEditAll: false },
      ),
    )
    expect(await screen.findByTestId('toast-success')).toHaveTextContent('ההגדרות נשמרו')
  })
})

describe('MySettingsPage — הפאנלים האמיתיים (תבניות/Smart Match, נוסח-בעלים)', () => {
  it('קבוצת תבניות בבעלות ⇒ TemplateEditor האמיתי מרונדר עם התוויות מהמרשם', async () => {
    listMyParams.mockResolvedValue([
      row('תבנית_מייל_חשבונית_מס', 'שלום [שם_לקוח_חברה]', 'templates', FINANCE),
      row('תבנית_מייל_דוח_שכר', 'שלום', 'templates', FINANCE),
    ])
    renderPage()
    const list = await screen.findByTestId('settings-template-list')
    expect(list).toHaveTextContent('חשבונית מס')
    expect(list).toHaveTextContent('דוח שכר')
  })

  it('קבוצת Smart Match בבעלות ⇒ SmartMatchPane האמיתי מרונדר בנוסח-בעלים (variant="owner")', async () => {
    authState = { user: { roleId: 4 }, permissions: { 'הגדרות מערכת': 'blocked' } }
    listMyParams.mockResolvedValue([
      row('משקולת_היענות', '0.40', 'smart_match', 4),
      row('משקולת_אמינות', '0.35', 'smart_match', 4),
      row('משקולת_קרבה', '0.25', 'smart_match', 4),
    ])
    renderPage()
    expect(await screen.findByTestId('settings-smartmatch-warning-owner')).toHaveTextContent(
      'שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ.',
    )
    expect(screen.queryByTestId('settings-smartmatch-warning')).not.toBeInTheDocument()
  })
})

describe('MySettingsPage — "מי מתחת לשכר המינימום" (מוקאפ §5)', () => {
  it('שכר_מינימום_שעתי בבעלות ⇒ הרשימה מוצגת; לא בבעלות ⇒ נעדרת', async () => {
    listMyParams.mockResolvedValue([row('שכר_מינימום_שעתי', '35', 'pricing_timing', FINANCE)])
    renderPage()
    expect(await screen.findByTestId('settings-below-min-wage')).toBeInTheDocument()
  })

  it('בלי שכר_מינימום_שעתי בבעלות — אין רשימת-שכר בדף כלל', async () => {
    listMyParams.mockResolvedValue([row('אחוז_מעמ', '18', 'pricing_timing', FINANCE)])
    renderPage()
    await screen.findByTestId('settings-value-אחוז_מעמ')
    expect(screen.queryByTestId('settings-below-min-wage')).not.toBeInTheDocument()
  })
})

// 🔍 ממצא UX-6 (אודיט-סגירת מ9, 03/09/2026): הטיעון שהוליד את תיבת-החיפוש בלשונית המלאה
// (①ב② במדריך-הצעדים) חל גם כאן — מנהלת-הגיוס מחזיקה 25 מ-38 השורות. כאן החיפוש **מסנן**
// ולא מנווט, כי אין ניווט-קבוצות שיתנגש בכלל-השורה-החלקית של פאנל-ההתאמה.
describe('MySettingsPage — חיפוש (UX-6)', () => {
  it('מסנן את השורות המוצגות, ומודיע כשאין תוצאה', async () => {
    listMyParams.mockResolvedValue([
      { param_name: 'אחוז_מעמ', param_value: '18', param_type: 'pricing_timing', owner_role_id: 3 },
      {
        param_name: 'תנאי_תשלום_ימים',
        param_value: '30',
        param_type: 'pricing_timing',
        owner_role_id: 3,
      },
    ])
    renderPage()
    expect(await screen.findByTestId('settings-my-search')).toBeInTheDocument()
    expect(screen.getByText('אחוז מע"מ')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('settings-my-search'), { target: { value: 'תשלום' } })
    expect(screen.queryByText('אחוז מע"מ')).not.toBeInTheDocument()
    expect(screen.getByText('תנאי תשלום')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('settings-my-search'), { target: { value: 'זזזז' } })
    expect(screen.getByTestId('settings-my-no-results')).toBeInTheDocument()
  })
})
