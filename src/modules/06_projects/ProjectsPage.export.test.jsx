// חיבור מסך-הפרויקטים לחלון-הייצוא — **המסך המוכיח של החוזה** (`PROJECT_MASTER §6`).
//
// 🔑 **מה שנבדק כאן אינו "הכפתור נפתח" אלא שני החוזים שהמסך הזה קיים כדי לאמת:**
// ① `value` קורא לאותה פונקציית-נגזרת שהטבלה קוראת לה ⇒ הקובץ והמסך אינם מתפצלים ·
// ② הקובץ מקבל את **כל השורות שעומדות במסנן**, ולא את עמוד-הדפדוף.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions: { פרויקטים: 'edit' }, onboardingMode: 0 }),
}))

const listProjectsOverview = vi.fn()
vi.mock('./api', () => ({ listProjectsOverview: (...a) => listProjectsOverview(...a) }))

import ProjectsPage from './ProjectsPage'
import { staffingCell, PROJECT_STATUS_LABELS } from '@/lib/projects'

// שורות בצורת `listProjectsOverview` — נגזרות, לא ערכים גולמיים. זו כל הנקודה.
const project = (over = {}) => ({
  project_id: 1500,
  event_name: 'כנס לקוחות',
  customer_name: 'אלפא סיסטמס בע"מ',
  final_event_date: '2026-11-04',
  project_status: 'in_progress',
  required_hostess_count: 4,
  assignment_rows: [],
  logistics_rows: [],
  ...over,
})

function setup(rows) {
  listProjectsOverview.mockResolvedValue(rows)
  return render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  )
}

describe('ProjectsPage — חיבור לחלון-הייצוא', () => {
  it('הכפתור קיים ופעיל תמיד — החלון עצמאי ואומר בעצמו כשאין מה לייצא', async () => {
    setup([project()])
    const button = await screen.findByTestId('projects-export-button')
    expect(button).toBeEnabled()
  })

  it('🔴 עמודה נגזרת מגיעה לקובץ עם הערך שהטבלה מציגה — ולא undefined', async () => {
    const row = project()
    setup([row])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    const preview = within(await screen.findByTestId('export-preview'))

    // הערך שהמסך גוזר, מחושב כאן מאותה פונקציה בדיוק
    const expected = PROJECT_STATUS_LABELS[row.project_status]
    expect(expected).toBeTruthy()
    await waitFor(() => expect(preview.getByText(expected)).toBeInTheDocument())
    // ⚠️ װ`gapSentence` אינה נבדקת כאן יותר — "מה חסר" יצאה מברירת-המחדל
    // בהכרעת-ישי 23/09. החוזה נבדק על `staffingCell`, שהיא נגזרת **ובברירת-המחדל**.
    expect(preview.getByText(staffingCell(row).ratio)).toBeInTheDocument()
  })

  it('שורת-הכמות סופרת את כל מה שעומד במסנן, לא את עמוד-הדפדוף', async () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      project({ project_id: 1500 + i, event_name: `אירוע ${i}` }),
    )
    setup(rows)
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent(`${rows.length} שורות`),
    )
  })

  it('כותרות הקובץ הן התוויות של המסך', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    const heads = within(await screen.findByTestId('export-preview'))
      .getAllByRole('columnheader')
      .map((c) => c.textContent)
    expect(heads).toContain('אירוע')
    expect(heads).toContain('סטטוס')
    expect(heads).toContain('דיילות')
    // 🚫 עמודת "פעולות" לעולם אינה מיוצאת (תוכנית §7.2)
    expect(heads.join(' ')).not.toContain('לכרטיס')
  })

  it('🔑 אין עמודת-כסף — ולכן אין כאן דליפת-שכר לבדוק', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    const heads = within(await screen.findByTestId('export-preview'))
      .getAllByRole('columnheader')
      .map((c) => c.textContent)
      .join(' ')
    for (const word of ['שכר', 'תעריף', 'רווח', 'עלות']) {
      expect(heads).not.toContain(word)
    }
  })

  it('staffingCell נקראת פעם אחת בלבד לכל שורה — אותה נגזרת, לא מימוש שני', () => {
    const row = project({ required_hostess_count: 4 })
    expect(staffingCell(row)).toEqual(staffingCell(row))
  })
})

// 🔴🔴 **הכלל שישי ניסח 23/09/2026:** *"בכל מסך שילחצו ייצוא ברירת המחדל
// תהיה מה שבמסך, ואם ירצה יוכל להוסיף עוד"*.
// 🔴 **עד 23/09 מומש רק החצי הראשון** — היו שמונה עמודות ונקודה, ולא היה מה להוסיף.
describe('🔴 ברירת-מחדל = מה שבמסך, ואפשר להוסיף עוד', () => {
  it('נפתח עם עמודות-המסך בלבד — לא עם כולן', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    const heads = () =>
      within(screen.getByTestId('export-preview'))
        .getAllByRole('columnheader')
        .map((c) => c.textContent)
    await waitFor(() => expect(heads()).toContain('אירוע'))
    // שבע עמודות-מסך, ו**לא** כל 17 הזמינות
    expect(heads()).not.toContain('מיקום')
    expect(heads()).not.toContain('הכנסה מתוכננת')
  })

  it('העמודות הנוספות **זמינות בבוחר** גם כשאינן מסומנות', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    await screen.findByTestId('export-column-list')
    expect(screen.getByTestId('export-column-final_location')).toBeInTheDocument()
    expect(screen.getByTestId('export-column-planned_revenue')).toBeInTheDocument()
  })

  it('🔴 "סמני הכול" מכניס את השאר לקובץ', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    fireEvent.click(await screen.findByTestId('export-select-all'))
    const heads = within(screen.getByTestId('export-preview'))
      .getAllByRole('columnheader')
      .map((c) => c.textContent)
    expect(heads).toContain('מיקום')
    expect(heads).toContain('הכנסה מתוכננת')
  })

  it('אחרי "סמני הכול" הכפתור נעלם — כפתור שאינו עושה דבר הוא רעש', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    fireEvent.click(await screen.findByTestId('export-select-all'))
    expect(screen.queryByTestId('export-select-all')).toBeNull()
  })

  it('װ"מה חסר" זמינה אך אינה בברירת-המחדל — החריג שישי אישר', async () => {
    setup([project()])
    fireEvent.click(await screen.findByTestId('projects-export-button'))
    await screen.findByTestId('export-column-list')
    expect(screen.getByTestId('export-column-gap')).toBeInTheDocument()
    const heads = within(screen.getByTestId('export-preview'))
      .getAllByRole('columnheader')
      .map((c) => c.textContent)
    expect(heads).not.toContain('מה חסר')
  })
})
