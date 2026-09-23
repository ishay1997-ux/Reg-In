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

// 🔴 "כל השורות" — §7 פריט 9 של המסירה: התיבה הוצגה מ-17/09 ולא עשתה דבר עד 23/09.
describe('ExportBar — "כל השורות"', () => {
  const TOP_N_PAYLOAD = {
    ...PAYLOAD,
    rows: Array.from({ length: 8 }, (_, i) => ({ project_id: 1000 + i, amount: 100 + i })),
    meta: { row_total: 20 },
  }

  it('סימון התיבה שולף מחדש עם p_page_size = row_total, ושורת-הכמות מפסיקה לומר "מתוך"', async () => {
    callReport.mockResolvedValue(TOP_N_PAYLOAD)
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    const box = await screen.findByTestId('export-show-all')
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(1))
    expect(callReport.mock.calls[0][1]).not.toHaveProperty('pageSize')
    expect(screen.getByTestId('export-count')).toHaveTextContent('מתוך 20')
    callReport.mockResolvedValue({
      ...TOP_N_PAYLOAD,
      rows: Array.from({ length: 20 }, (_, i) => ({ project_id: 1000 + i, amount: 100 + i })),
    })
    fireEvent.click(box)
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(2))
    expect(callReport.mock.calls[1][1]).toMatchObject({ pageSize: 20 })
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 20 שורות'),
    )
  })

  it('החלפת דוח מאפסת את התיבה — הגודל שנשלח הוא של הדוח הנוכחי, לא של הקודם', async () => {
    callReport.mockResolvedValue(TOP_N_PAYLOAD)
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    fireEvent.click(await screen.findByTestId('export-show-all'))
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(2))
    const select = screen.getByTestId('export-report-select')
    fireEvent.change(select, { target: { value: select.querySelectorAll('option')[1].value } })
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(3))
    expect(callReport.mock.calls[2][1]).not.toHaveProperty('pageSize')
  })
})

// 🔴 הסוכן-היריב (23/09): הגודל שנשלח הוא `row_total` של השליפה הקודמת — שינוי תקופה/לקוח מחליף אוכלוסייה.
describe('ExportBar — "כל השורות" מתאפסת עם כל שינוי-מסנן', () => {
  const TOP_N_PAYLOAD = {
    ...PAYLOAD,
    rows: Array.from({ length: 8 }, (_, i) => ({ project_id: 1000 + i, amount: 100 + i })),
    meta: { row_total: 20 },
  }

  it('שינוי תקופה מכבה את התיבה, והשליפה הבאה יוצאת בלי p_page_size', async () => {
    callReport.mockResolvedValue(TOP_N_PAYLOAD)
    renderBar()
    fireEvent.click(screen.getByTestId('reports-export-button'))
    fireEvent.click(await screen.findByTestId('export-show-all'))
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(2))
    expect(callReport.mock.calls[1][1]).toMatchObject({ pageSize: 20 })
    fireEvent.change(screen.getByTestId('export-from'), { target: { value: '2026-01-01' } })
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(3))
    expect(callReport.mock.calls[2][1]).not.toHaveProperty('pageSize')
    expect(screen.getByTestId('export-show-all')).not.toBeChecked()
  })
})

// 🔴 הכרעת-ישי 23/09/2026 — *"מאשר לפי המלצתך"*: התיבה גם במ04/מ06, שבהם השרת חותך ב-50 (תקרה, לא רשימת-שיא).
describe('ExportBar — "כל השורות" בדוחות עם תקרה (מ04 · מ06)', () => {
  const capped = (n, total) => ({
    ...PAYLOAD,
    rows: Array.from({ length: n }, (_, i) => ({ project_id: 1000 + i, amount: 100 + i })),
    meta: { row_total: total },
  })

  it('נחתך ⇒ התיבה נוקבת באילו 50 נכנסו, וסימון שולף הכול ונשאר ניתן לביטול', async () => {
    callReport.mockResolvedValue(capped(50, 80))
    renderBar({}, '/reports?tab=exec&report=discounts')
    fireEvent.click(screen.getByTestId('reports-export-button'))
    const box = await screen.findByTestId('export-show-all')
    expect(box.closest('label')).toHaveTextContent('כל 80 השורות, ולא רק 50 ההנחות הגבוהות')
    expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 50 שורות מתוך 80')
    callReport.mockResolvedValue(capped(80, 80))
    fireEvent.click(box)
    await waitFor(() => expect(callReport).toHaveBeenCalledTimes(2))
    expect(callReport.mock.calls[1]).toEqual([
      'report_m04_discounts',
      expect.objectContaining({ pageSize: 80 }),
    ])
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 80 שורות'),
    )
    expect(screen.getByTestId('export-show-all')).toBeChecked()
  })

  it('לא נחתך (≤50) ⇒ אין תיבה — אין מה להוסיף', async () => {
    callReport.mockResolvedValue(capped(12, 12))
    renderBar({}, '/reports?tab=exec&report=staffing')
    fireEvent.click(screen.getByTestId('reports-export-button'))
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 12 שורות'),
    )
    expect(screen.queryByTestId('export-show-all')).not.toBeInTheDocument()
  })
})
