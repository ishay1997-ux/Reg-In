// בדיקות כפתור-הייצוא — **מה שהוא עושה עכשיו, ומה שהוא הפסיק לעשות.**
//
// ✏️ **נכתב מחדש 17/09/2026:** הקובץ הקודם נעל את שתי שורות-הכיתוב שמתחת לכפתור ואת מצבי-
// הנטרול שלו. הכרעת-ישי הפכה את שניהם — הכיתוב עבר לתוך החלון והכפתור פעיל תמיד — ולכן
// הבדיקות כאן נועלות את ההתנהגות **החדשה**, ובמפורש גם את מה שנעלם: **אין עוד כיתוב מתחת
// לכפתור, ואין עוד כפתור מנוטרל.**
//
// 🔑 **מה שלא השתנה ונבדק שלא השתנה:** ‏`data-testid="reports-export-button"` — ‏`e2e/reports.spec.js`
// נשען עליו, ושינוי-שם היה שובר בדיקה חיה בלי שאיש ישים לב עד ה-CI.

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExportBar from '@/modules/11_reports/components/ExportBar'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('@/modules/02_customers/api', () => ({ listCustomers: vi.fn().mockResolvedValue([]) }))

const callReport = vi.fn()
vi.mock('@/modules/11_reports/api', () => ({ callReport: (...args) => callReport(...args) }))

const COLUMNS = [
  { key: 'project_id', label: 'פרויקט', format: 'id' },
  { key: 'amount', label: 'סכום', format: 'money' },
]

const PAYLOAD = {
  columns: COLUMNS,
  rows: [{ project_id: 1040, amount: 2899 }],
  window: { label: '2026 · כל הלקוחות' },
  meta: { row_total: 1 },
}

// 🔑 **ה-URL נקבע על `window.location` ולא ב-`MemoryRouter`**, כי `ExportBar` קורא את
// הלשונית ישירות מה-URL ואינו דורש הקשר-ניתוב — בכוונה: ארבעה קובצי-בדיקה של הסשן המקביל
// מרנדרים אותו דרך `ReportSurface` **בלי Router**, והדרישה להקשר הפילה בהם 122 בדיקות.
function renderBar(props = {}, url = '/reports?tab=exec&report=exec-overview') {
  window.history.replaceState({}, '', url)
  return render(
    <ExportBar reportName="מבט-על הנהלה" windowLabel="2026" columns={COLUMNS} {...props} />,
  )
}

beforeEach(() => {
  callReport.mockReset()
  callReport.mockResolvedValue(PAYLOAD)
})

describe('ExportBar — הכפתור', () => {
  it('מרונדר, ואינו פותח חלון לפני לחיצה', () => {
    renderBar()
    expect(screen.getByTestId('reports-export-button')).toBeInTheDocument()
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
  })

  it('🔴 פעיל תמיד — גם כשלדוח הפתוח אין טבלה', () => {
    renderBar({ blockedReason: 'אין טבלה לייצוא בדף הזה' })
    expect(screen.getByTestId('reports-export-button')).toBeEnabled()
  })

  it('🚫 שתי שורות-הכיתוב אינן מתחת לכפתור עוד', () => {
    renderBar()
    expect(screen.queryByTestId('reports-export-file')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reports-export-columns')).not.toBeInTheDocument()
  })
})

describe('ExportBar — פתיחת החלון', () => {
  it('לחיצה פותחת את החלון ושולפת את נתוני הדוח הפתוח', async () => {
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    expect(await screen.findByTestId('export-dialog')).toBeInTheDocument()
    await waitFor(() => expect(callReport).toHaveBeenCalled())
    expect(callReport.mock.calls[0][0]).toBe('report_m02_exec_overview')
  })

  it('🔴 שולף עם drill: null — החלון עצמאי ואינו יורש את רמת-המסך', async () => {
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    await waitFor(() => expect(callReport).toHaveBeenCalled())
    expect(callReport.mock.calls[0][1]).toMatchObject({ drill: null })
  })

  it('מציג את ארבעת דוחות הלשונית בבורר', async () => {
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    const select = await screen.findByTestId('export-report-select')
    expect(select.querySelectorAll('option')).toHaveLength(4)
  })

  it('🔑 הבטחת-השם עברה לתוך החלון, עם אותו testid', async () => {
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    const promise = await screen.findByTestId('reports-export-file')
    expect(promise.textContent).toMatch(/^יירד: .+\.xlsx$/)
  })

  it('🔴 כשל-שליפה נאמר ואינו מרונדר כ"אין נתונים"', async () => {
    callReport.mockRejectedValue(new Error('שגיאה בטעינת הדוח.'))
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    expect(await screen.findByRole('alert')).toHaveTextContent('שגיאה בטעינת הדוח.')
  })
})
