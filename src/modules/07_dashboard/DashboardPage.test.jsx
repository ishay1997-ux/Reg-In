// בדיקת מסך-הבית — קופצת ל-./api (RPC יחיד), כך שכל הנגזרות (src/lib/dashboard.js) רצות
// באמת על דאטה סינתטי. תאריכי-הפרויקטים כתובים DD/MM (9/9 · 11/9 · 17/9 · 7/9 · 26/8) —
// אותם ימים בדיוק שהמוקאפ המאושר מצייר (docs/specs/module_07_dashboard/dashboard-mockup-approved.html),
// כדי שהתנהגות-הצבע/החוסר תהיה ניתנת-להצלבה מולו.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { getDashboardSummary } from './api'

vi.mock('./api', () => ({ getDashboardSummary: vi.fn() }))

function project(overrides) {
  return {
    project_id: 1,
    event_name: 'אירוע',
    customer_name: 'לקוח',
    final_event_date: '2026-09-15',
    project_status: 'in_progress',
    required_hostess_count: 4,
    hostesses_confirmed: 4,
    logistics_total: 2,
    logistics_ready: 2,
    ...overrides,
  }
}

// לוח-הבדיקה: 201 אדום (9/9, חוסר-איוש בתוך 14 יום) · 202 ירוק (11/9) · 203/204/205 באותו
// יום (17/9 — שני צ'יפים + "+1 עוד") · 206 מבוטל (7/9) · 207 event_finished מחוץ לחודש (26/8,
// לא-מחויב) שנבדק רק בפאנל-הטיפול, לא בלוח. ה-pending_quotes מכיל הצעה #41 שפגה בעוד 3 ימים
// (updated_at 7/8 + תוקף 30 יום = 6/9, מול "היום" 3/9).
function board() {
  return [
    project({
      project_id: 201,
      event_name: 'השקת מוצר — סייברארק',
      customer_name: 'סייברארק',
      final_event_date: '2026-09-09',
      required_hostess_count: 6,
      hostesses_confirmed: 2,
    }),
    project({
      project_id: 202,
      event_name: 'כנס הייטק גרופ',
      customer_name: 'הייטק גרופ',
      final_event_date: '2026-09-11',
    }),
    project({
      project_id: 203,
      event_name: 'כנס לקוחות שנתי',
      customer_name: 'לקוח א',
      final_event_date: '2026-09-17',
      required_hostess_count: 6,
      hostesses_confirmed: 0,
    }),
    project({
      project_id: 204,
      event_name: 'חתונת-חברה — אינטל',
      customer_name: 'אינטל',
      final_event_date: '2026-09-17',
    }),
    project({
      project_id: 205,
      event_name: 'כנס פתיחת שנה',
      customer_name: 'לקוח ג',
      final_event_date: '2026-09-17',
    }),
    project({
      project_id: 206,
      event_name: 'ערב לקוחות VIP',
      customer_name: 'עמותת נגה',
      final_event_date: '2026-09-07',
      project_status: 'cancelled',
    }),
    project({
      project_id: 207,
      event_name: 'פסטיבל קיץ עירוני',
      customer_name: 'עיריית X',
      final_event_date: '2026-08-26',
      project_status: 'event_finished',
    }),
  ]
}

function summaryFixture(overrides) {
  return {
    today: '2026-09-03',
    month_start: '2026-09-01',
    active_projects_count: 17,
    satisfaction_avg: 4.3,
    satisfaction_count: 12,
    profit_visible: true,
    monthly_profit: 118000,
    monthly_profit_project_count: 14,
    quotes_visible: true,
    pending_quotes_count: 9,
    params: {
      event_warning_days: '14',
      quote_validity_days: '30',
      quote_expiring_soon_days: '7',
    },
    projects: board(),
    pending_quotes: [{ quote_id: 41, updated_at: '2026-08-07T10:00:00Z' }],
    ...overrides,
  }
}

function renderPage(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <DashboardPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getDashboardSummary.mockResolvedValue(summaryFixture())
})

describe('DashboardPage — טעינה ושגיאה', () => {
  it('שלד-עמוד בטעינה הראשונה', () => {
    getDashboardSummary.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByTestId('skeleton-page')).toBeInTheDocument()
  })

  it('🔴 כשל-טעינה: המשפט הנעול בעברית + "נסה שוב" שבאמת מנסה שוב', async () => {
    getDashboardSummary.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderPage()
    expect(await screen.findByText('מסך הבית לא נטען.')).toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()

    getDashboardSummary.mockResolvedValueOnce(summaryFixture())
    fireEvent.click(screen.getByTestId('dashboard-retry'))
    expect(await screen.findByTestId('kpi-active')).toBeInTheDocument()
    expect(getDashboardSummary).toHaveBeenCalledTimes(2)
  })
})

describe('DashboardPage — רצועת ה-KPI', () => {
  it('ארבעה אריחים, ורווח מוצג דרך Money כשגלוי', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    expect(screen.getAllByTestId(/^kpi-/)).toHaveLength(4)
    // Money מציג ₪ מימין הספרות — לא "0" ולא מחרוזת-מיסוך.
    expect(screen.getByTestId('kpi-profit').textContent).toContain('118,000')
    expect(screen.getByTestId('kpi-profit').textContent).toContain('₪')
  })

  it('🔴 מסך ממוסך: הטקסט הנעול המדויק, ולעולם לא "0"', async () => {
    getDashboardSummary.mockResolvedValue(
      summaryFixture({
        profit_visible: false,
        monthly_profit: null,
        quotes_visible: false,
        pending_quotes_count: null,
      }),
    )
    renderPage()
    await screen.findByTestId('kpi-active')
    // הטקסט המדויק (לא "0" ולא emptyText הכללי של StatTile) — שתי אמירות שונות (§7.97).
    expect(screen.getByTestId('kpi-profit').textContent).toBe('רווח חודשי משוערלא זמין בתפקידך')
    expect(screen.getByTestId('kpi-quotes').textContent).toBe('הצעות ממתינותלא זמין בתפקידך')
  })
})

describe('DashboardPage — לוח החודש', () => {
  it('צ׳יפים בצבע הנכון, ו"+1 עוד" ביום עם שלושה פרויקטים', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    expect(screen.getByTestId('dashboard-chip-201').className).toContain('bg-red-100')
    expect(screen.getByTestId('dashboard-chip-202').className).toContain('bg-green-100')
    expect(screen.getByTestId('dashboard-more-2026-09-17')).toHaveTextContent('+1 עוד')
  })

  it('צ׳יפ מבוטל: קו-חוצה + תג "מבוטל", ובלי סמלי-ממד', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    const chip = screen.getByTestId('dashboard-chip-206')
    expect(chip.className).toContain('line-through')
    expect(within(chip).getByText('מבוטל')).toBeInTheDocument()
    expect(chip.querySelectorAll('svg')).toHaveLength(0)
  })

  it('חיפוש "כנס" משאיר רק צ׳יפים תואמי-שם/לקוח', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    fireEvent.change(screen.getByTestId('dashboard-cal-search'), { target: { value: 'כנס' } })
    expect(screen.queryByTestId('dashboard-chip-201')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-chip-202')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-chip-203')).toBeInTheDocument()
  })

  it('כיבוי צ׳יפ-הסינון האדום מסתיר את הצ׳יפ האדום בלבד', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    fireEvent.click(screen.getByTestId('dashboard-filter-red'))
    expect(screen.queryByTestId('dashboard-chip-201')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-chip-202')).toBeInTheDocument()
  })

  it('› קורא ל-getDashboardSummary עם החודש הבא, והכתובת מתעדכנת', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    fireEvent.click(screen.getByTestId('dashboard-cal-next'))
    await screen.findByText('אוקטובר 2026')
    expect(getDashboardSummary).toHaveBeenLastCalledWith('2026-10-01')
  })
})

describe('DashboardPage — מה דורש טיפול', () => {
  it('סדר-הענפים של attentionRows: הסתיים-ולא-חויב → חוסר → הצעה-פגה', async () => {
    renderPage()
    await screen.findByTestId('kpi-active')
    const rows = screen.getAllByTestId(/^dashboard-attention-row-/)
    expect(rows).toHaveLength(4)
    expect(within(rows[0]).getByText('פסטיבל קיץ עירוני')).toBeInTheDocument()
    expect(within(rows[0]).getByText('הסתיים לפני 8 ימים, לא חויב')).toBeInTheDocument()
    expect(within(rows[3]).getByText('הצעה #41')).toBeInTheDocument()
    expect(within(rows[3]).getByText('פגה בעוד 3 ימים')).toBeInTheDocument()
  })

  it('רשימה ריקה מציגה שורה אחת מנומקת ולא כלום', async () => {
    getDashboardSummary.mockResolvedValue(summaryFixture({ projects: [], pending_quotes: [] }))
    renderPage()
    await screen.findByTestId('kpi-active')
    expect(screen.getByText('✓ אין פריטים הדורשים טיפול')).toBeInTheDocument()
    expect(screen.queryByTestId(/^dashboard-attention-row-/)).not.toBeInTheDocument()
  })
})

describe('DashboardPage — מה דורש טיפול: תיקרה וקבוצות (הכרעת-ישי 03/09/2026 19:3X)', () => {
  // ארבעה "הסתיים ולא חויב" (ותיק→חדש) + ארבעה "חוסר קרוב" (קרוב→רחוק) = 8, בדיוק התיקרה —
  // ושתי הצעות-שפגות-בקרוב נחתכות ל"עוד". סה"כ 10 שורות, כמו שהמשימה מבקשת.
  function unbilled(id, date) {
    return project({
      project_id: id,
      event_name: `הסתיים ${id}`,
      final_event_date: date,
      project_status: 'event_finished',
      required_hostess_count: 1,
      hostesses_confirmed: 1,
      logistics_ready: 1,
      logistics_total: 1,
    })
  }
  function shortage(id, date) {
    return project({
      project_id: id,
      event_name: `חוסר ${id}`,
      final_event_date: date,
      project_status: 'in_progress',
      required_hostess_count: 2,
      hostesses_confirmed: 0,
      logistics_ready: 1,
      logistics_total: 1,
    })
  }

  it('10 פריטים (4+4+2) ⇒ 8 שורות מוצגות, שורת-קבוצות מלאה, וקישור "+2 נוספים" ל-/quotes', async () => {
    getDashboardSummary.mockResolvedValue(
      summaryFixture({
        projects: [
          unbilled(401, '2026-08-20'),
          unbilled(402, '2026-08-21'),
          unbilled(403, '2026-08-22'),
          unbilled(404, '2026-08-23'),
          shortage(405, '2026-09-04'),
          shortage(406, '2026-09-05'),
          shortage(407, '2026-09-06'),
          shortage(408, '2026-09-07'),
        ],
        pending_quotes: [
          { quote_id: 41, updated_at: '2026-08-07T09:00:00+00:00' }, // daysLeft=3
          { quote_id: 42, updated_at: '2026-08-08T09:00:00+00:00' }, // daysLeft=4
        ],
      }),
    )
    renderPage()
    await screen.findByTestId('kpi-active')

    expect(screen.getAllByTestId(/^dashboard-attention-row-/)).toHaveLength(8)

    const groupLine = screen.getByTestId('dashboard-attention-groups').textContent
    expect(groupLine).toContain('הסתיים ולא חויב (4)')
    expect(groupLine).toContain('חוסר קרוב (4)')
    expect(groupLine).toContain('הצעה שפגה בקרוב (2)')

    const more = screen.getByTestId('dashboard-attention-more')
    expect(more).toHaveTextContent('+2 נוספים')
    expect(more.getAttribute('href')).toBe('/quotes')
  })

  it('3 פריטים בלבד ⇒ בלי קישור-עוד (הכול כבר מוצג)', async () => {
    getDashboardSummary.mockResolvedValue(
      summaryFixture({
        projects: [unbilled(409, '2026-08-20'), shortage(410, '2026-09-04')],
        pending_quotes: [{ quote_id: 43, updated_at: '2026-08-07T09:00:00+00:00' }],
      }),
    )
    renderPage()
    await screen.findByTestId('kpi-active')

    expect(screen.getAllByTestId(/^dashboard-attention-row-/)).toHaveLength(3)
    expect(screen.queryByTestId('dashboard-attention-more')).not.toBeInTheDocument()
  })
})
