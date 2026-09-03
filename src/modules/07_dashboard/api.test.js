// בדיקות-יחידה ל-api.js של מודול 7 (מסך-בית). דפוס-המוק זהה-בייט לכל מודול אחר בריפו
// (02_customers · 03_quotes · 04_hostesses · 06_projects): `./api` מייבא `@/supabaseClient`,
// וזה קורא ל-`createClient(import.meta.env.VITE_SUPABASE_URL, …)` בזמן-טעינה. בלי `.env.local`
// (למשל ב-CI) ה-URL undefined ו-`createClient` זורק "supabaseUrl is required", והקובץ נכשל
// עוד לפני שבדיקה רצה — לכן המוק חובה כאן, לא נוחות.

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '@/supabaseClient'
import { getDashboardSummary, assertDashboardShape } from './api'

// שורה תקינה מלאה, לפי הצורה שמחזירה get_dashboard_summary (המיגרציה
// 20260903184711_module7_dashboard_cancelled_on_calendar_and_profit.sql). כל בדיקה שמשנה
// היבט יחיד עושה זאת על עותק שטוח של זו, כדי שהבדיקה תדבר על הפרש אחד בלבד.
function validRow(overrides = {}) {
  return {
    today: '2026-09-03',
    month_start: '2026-09-01',
    active_projects_count: 4,
    satisfaction_avg: 4.5,
    satisfaction_count: 2,
    profit_visible: true,
    monthly_profit: 3650,
    monthly_profit_project_count: 1,
    quotes_visible: true,
    pending_quotes_count: 2,
    params: {
      quote_validity_days: 14,
      quote_expiring_soon_days: 3,
      event_warning_days: 7,
    },
    projects: [],
    pending_quotes: [],
    ...overrides,
  }
}

describe('getDashboardSummary', () => {
  it('מעבירה p_month=null כשלא סיפקו פרמטר (השרת מכריע "החודש הנוכחי")', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: validRow(), error: null })
    await getDashboardSummary()
    expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_summary', { p_month: null })
  })

  it('מעבירה תאריך-חודש מפורש כפי-שהוא, בלי חישוב בצד-הלקוח', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: validRow(), error: null })
    await getDashboardSummary('2026-08-01')
    expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_summary', { p_month: '2026-08-01' })
  })

  it('מחזירה את השורה כפי-שהיא (בלי לעצב-מחדש) אחרי שער-הצורה', async () => {
    const row = validRow()
    supabase.rpc.mockResolvedValueOnce({ data: row, error: null })
    await expect(getDashboardSummary()).resolves.toEqual(row)
  })

  it('שגיאת-RPC ⇒ זריקה', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'אין הרשאה.' },
    })
    await expect(getDashboardSummary()).rejects.toThrow()
  })
})

describe('assertDashboardShape', () => {
  it('שורה תקינה עוברת ומוחזרת כפי-שהיא', () => {
    const row = validRow()
    expect(assertDashboardShape(row)).toBe(row)
  })

  it('חסר profit_visible ⇒ זורקת ונוקבת בשם השדה', () => {
    const row = validRow()
    delete row.profit_visible
    expect(() => assertDashboardShape(row)).toThrow(/profit_visible/)
  })

  it('חסר quotes_visible ⇒ זורקת ונוקבת בשם השדה', () => {
    const row = validRow()
    delete row.quotes_visible
    expect(() => assertDashboardShape(row)).toThrow(/quotes_visible/)
  })

  it('חסר params ⇒ זורקת ונוקבת בשם השדה', () => {
    const row = validRow()
    delete row.params
    expect(() => assertDashboardShape(row)).toThrow(/params/)
  })

  it('שדות-כסף/משוב null (מסך חסום-הרשאה או חודש-ריק) ⇒ מתקבל', () => {
    const row = validRow({
      monthly_profit: null,
      satisfaction_avg: null,
      monthly_profit_project_count: null,
    })
    expect(() => assertDashboardShape(row)).not.toThrow()
  })

  it('pending_quotes: null (quotes_visible=false) ⇒ מתקבל', () => {
    const row = validRow({
      quotes_visible: false,
      pending_quotes_count: null,
      pending_quotes: null,
    })
    expect(() => assertDashboardShape(row)).not.toThrow()
  })

  it('projects שאינו מערך ⇒ זורקת', () => {
    const row = validRow({ projects: null })
    expect(() => assertDashboardShape(row)).toThrow(/projects/)
  })

  it('profit_visible לא-בוליאני ⇒ זורקת', () => {
    const row = validRow({ profit_visible: 1 })
    expect(() => assertDashboardShape(row)).toThrow(/profit_visible/)
  })

  it('active_projects_count שחזר null (שדה שאינו ברשימת ה-nullable) ⇒ זורקת', () => {
    const row = validRow({ active_projects_count: null })
    expect(() => assertDashboardShape(row)).toThrow(/active_projects_count/)
  })

  it('params חסר מפתח פנימי ⇒ זורקת ונוקבת בשמו', () => {
    const row = validRow()
    delete row.params.event_warning_days
    expect(() => assertDashboardShape(row)).toThrow(/event_warning_days/)
  })

  it('שורה null מהשרת ⇒ זורקת', () => {
    expect(() => assertDashboardShape(null)).toThrow()
  })
})
