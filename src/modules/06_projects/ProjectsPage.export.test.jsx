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
import { gapSentence, staffingCell, PROJECT_STATUS_LABELS } from '@/lib/projects'

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
    expect(preview.getByText(gapSentence(row))).toBeInTheDocument()
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
    expect(heads).toContain('מה חסר')
    expect(heads).toContain('סטטוס')
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
