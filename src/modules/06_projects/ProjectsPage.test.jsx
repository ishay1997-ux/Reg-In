// בדיקת מבט-העל של הפרויקטים (משטח 1) — נועלת את מה שמדריך-המיקרו קבע לצעד 3.1:
// חמשת המצבים ומחרוזותיהם הנעולות · האריחים שאינם משתנים בין לשוניות · גלולות רק
// בלשונית "הכול" · פיצול 6-מול-7 עמודות · כלל-האדום (אפס שורות שיבוץ) · לשונית מהכתובת
// (S-18) · והמיון של S-7 (עבר לפי מרחק מוחלט). ה-API ממוקק — אין Supabase בבדיקה.
//
// ⚠️ אין תקדים לבדיקת-עמוד ב-src/modules (quotePdf.test.jsx הוא רכיב-מסמך) — הקובץ הזה
// נכתב בסגנון בדיקות-הרכיבים (PermissionAwareEmpty.test.jsx) עם MemoryRouter סביב העמוד.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProjectsPage from './ProjectsPage'
import { listProjectsOverview } from './api'

vi.mock('./api', () => ({ listProjectsOverview: vi.fn() }))

// תאריכים יחסיים להיום האמיתי — העמוד קורא את השעון בעצמו, וקיבוע תאריך היה מזייף את
// חישוב-הקרבה. אותו חישוב-UTC כמו eventDaysFromToday, כדי שלא ייווצר פער סביב חצות.
function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function row(overrides) {
  return {
    project_id: 1,
    event_name: 'אירוע',
    customer_name: 'לקוח',
    final_event_date: offsetIso(9),
    project_status: 'in_progress',
    required_hostess_count: 6,
    hostesses_confirmed: 1,
    pending_invites: 0,
    assignments_row_count: 3,
    logistics_ready: 0,
    logistics_total: 2,
    cancelled_at: null,
    cancel_type: null,
    planned_revenue: null,
    ...overrides,
  }
}

// לוח-המוקאפ: 4 בעבודה · 2 לסגירה · מבוטל + כספי — בסדר-קלט מעורבב בכוונה, כדי שהמיון
// יעבוד בפועל ולא יאשר את סדר-הקליטה (משמעת 30/07).
function mockBoard() {
  return [
    row({
      project_id: 104,
      event_name: 'כנס מפיקים ארצי',
      final_event_date: offsetIso(-146),
      project_status: 'awaiting_payment',
      hostesses_confirmed: 8,
      required_hostess_count: 8,
      assignments_row_count: 8,
      logistics_ready: 2,
    }),
    row({
      project_id: 3,
      event_name: 'כנס רפואה 2026',
      final_event_date: offsetIso(45),
      project_status: 'not_started',
      hostesses_confirmed: 0,
      assignments_row_count: 0,
    }),
    row({
      project_id: 8,
      event_name: 'כנס לקוחות שנתי',
      pending_invites: 2,
      assignments_row_count: 9,
    }),
    row({
      project_id: 101,
      event_name: 'השקת מוצר Q3',
      final_event_date: offsetIso(6),
      project_status: 'ready',
      hostesses_confirmed: 4,
      required_hostess_count: 4,
      assignments_row_count: 6,
      logistics_ready: 2,
    }),
    row({
      project_id: 7,
      event_name: 'תרחיש-קבלה 5.1',
      final_event_date: offsetIso(-12),
      project_status: 'event_finished',
      hostesses_confirmed: 0,
      assignments_row_count: 0,
    }),
    row({
      project_id: 103,
      event_name: 'ערב לקוחות VIP',
      final_event_date: offsetIso(23),
      project_status: 'cancelled',
      hostesses_confirmed: 0,
      assignments_row_count: 3,
      cancelled_at: '2026-08-11T09:40:00Z',
      cancel_type: 'customer',
    }),
    row({
      project_id: 11,
      event_name: 'כנס טכנולוגיה שנתי',
      final_event_date: offsetIso(33),
      required_hostess_count: 1,
      hostesses_confirmed: 0,
      assignments_row_count: 1,
      logistics_total: 0,
    }),
    row({
      project_id: 102,
      event_name: 'יום העיר חדרה',
      final_event_date: offsetIso(-5),
      project_status: 'event_finished',
      hostesses_confirmed: 5,
      required_hostess_count: 5,
      assignments_row_count: 7,
      logistics_ready: 2,
    }),
  ]
}

function renderPage(url = '/projects') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ProjectsPage />
    </MemoryRouter>,
  )
}

function rowOrder() {
  return screen
    .getAllByTestId(/^projects-row-/)
    .map((tr) => Number(tr.getAttribute('data-testid').replace('projects-row-', '')))
}

beforeEach(() => {
  vi.clearAllMocks()
  listProjectsOverview.mockResolvedValue(mockBoard())
})

describe('ProjectsPage — מצב ①: טעינה', () => {
  it('שלד-טבלה + שלד משלהם לאריחים וללשוניות — מונה ריק גרוע ממונה שטוען', () => {
    listProjectsOverview.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
    expect(screen.getByTestId('projects-tiles-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('projects-tabs-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('לא ניתן לטעון את הנתונים.')).not.toBeInTheDocument()
  })
})

describe('ProjectsPage — מצב ⑤: כשל-טעינה', () => {
  it('🔴 המסך כולו נכשל בקול עם "נסי שוב" — לעולם לא "אין פרויקטים", ואפס אריחי-0', async () => {
    // ‏err.message באנגלית טכנית ("Failed to fetch") — ומוודאים שהוא *לא* מגיע למסך:
    // השורה השנייה נעולה בעברית, והמקור הטכני נשאר בקונסול (תוקן אחרי צילום-האימות 19/08).
    listProjectsOverview.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderPage()
    expect(await screen.findByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(screen.getByText('רשימת הפרויקטים לא נטענה.')).toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
    expect(screen.queryByText(/אין פרויקטים/)).not.toBeInTheDocument()
    // אריח "0" על כשל-קריאה הוא השקר של "אפס שורות ⇒ תקין" — אין אריחים במצב-שגיאה.
    expect(screen.queryByTestId('projects-tile-staffing')).not.toBeInTheDocument()

    // "נסי שוב" באמת מנסה שוב — הקריאה השנייה מצליחה והמסך קם.
    listProjectsOverview.mockResolvedValueOnce([])
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    expect(await screen.findByTestId('projects-empty-true')).toBeInTheDocument()
  })
})

describe('ProjectsPage — מצב ②: ריק אמיתי', () => {
  it('שני המשפטים הנעולים + ניווט למסך הצעות מחיר (ההפך מ"נקה סינון")', async () => {
    listProjectsOverview.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('עדיין אין פרויקטים במערכת.')).toBeInTheDocument()
    expect(
      screen.getByText('פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'למסך הצעות מחיר →' })).toBeInTheDocument()
    expect(screen.queryByText('נקה סינון')).not.toBeInTheDocument()
  })
})

describe('ProjectsPage — לשונית "בעבודה" (ברירת-מחדל)', () => {
  it('S-7: חסרים תחילה לפי קרבה, והסגור אחרון — האדום אינו הראשון, וזה תקין (⑧)', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    // ‏8 (בעוד 9, חסר) · 11 (בעוד 33, חסר) · 3 (בעוד 45, חסר·אדום) · 101 (בעוד 6, סגור).
    expect(rowOrder()).toEqual([8, 11, 3, 101])
  })

  it('7 עמודות כולל לוגיסטיקה, קישור "לכרטיס →", ושורת-המיון כטקסט', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    expect(screen.getAllByRole('columnheader')).toHaveLength(7)
    expect(screen.getByRole('columnheader', { name: 'לוגיסטיקה' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'לכרטיס →' })).toHaveLength(4)
    expect(screen.getByText('ממוין: חסרים תחילה, ובתוכם לפי קרבת האירוע')).toBeInTheDocument()
  })

  it('גלולות-הסטטוס אינן קיימות מחוץ ללשונית "הכול"', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    expect(screen.queryByTestId('projects-pill-not_started')).not.toBeInTheDocument()
    expect(screen.queryByTestId('projects-pill-all')).not.toBeInTheDocument()
  })

  it('🔴 כלל-האדום: אפס שורות שיבוץ ⇒ שורה אדומה; חוסר עם זימונים ⇒ לא', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    expect(screen.getByTestId('projects-row-3').className).toContain('bg-red-50')
    expect(screen.getByTestId('projects-row-8').className).not.toContain('bg-red-50')
  })

  it('עמודת "מה חסר" — משפטי gapSentence מילה-במילה, כולל הנתיב המדורד של #11', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    expect(
      screen.getByText('2 זימונים ממתינים למענה — וגם אם שתיהן יאשרו, עדיין חסרות 3'),
    ).toBeInTheDocument()
    expect(screen.getByText('לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר')).toBeInTheDocument()
    // הנתיב המדורד המתועד: בלי confirmed_available המשפט של #11 נופל ל"חסרות N" — לא שגוי.
    // לשון-יחיד גם בנתיב המדורד — "חסרה 1" בשני התאים של אותה שורה: עמודת-הדיילות
    // (staffingCell) ועמודת "מה חסר" (gapSentence) מספרות את אותו חוסר באותן מילים (תוקן 19/08).
    expect(within(screen.getByTestId('projects-row-11')).getAllByText('חסרה 1')).toHaveLength(2)
    expect(screen.getByText('הכול סגור — אין מה לעשות')).toBeInTheDocument()
  })
})

describe('ProjectsPage — לשונית "לסגירה" (S-18: המצב מהכתובת)', () => {
  it('הלשונית נקראת מה-URL, עמודת הלוגיסטיקה יוצאת (6 עמודות) והקישור "לסגירה →"', async () => {
    renderPage('/projects?tab=closing')
    await screen.findByTestId('projects-table')
    expect(screen.getByTestId('projects-tab-closing')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
    expect(screen.queryByRole('columnheader', { name: 'לוגיסטיקה' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'לסגירה →' })).toHaveLength(2)
  })

  it('S-7: תאריך שעבר ממוין לפי מרחק מוחלט — לפני 5 ימים מעל לפני 12, בנוסח הארוך הנעול', async () => {
    renderPage('/projects?tab=closing')
    await screen.findByTestId('projects-table')
    expect(rowOrder()).toEqual([102, 7])
    expect(screen.getAllByText(/התקיים לפני \d+ ימים/)).toHaveLength(2)
    // תרחיש-קבלה: אפס שורות ⇒ אדום גם כאן.
    expect(screen.getByTestId('projects-row-7').className).toContain('bg-red-50')
  })

  it('לחיצה על לשונית כותבת לכתובת — מעבר ל"הכול" מדליק את הגלולות', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    fireEvent.click(screen.getByTestId('projects-tab-all'))
    expect(await screen.findByTestId('projects-pill-all')).toBeInTheDocument()
  })
})

describe('ProjectsPage — שני האריחים (⑨ · ⑫)', () => {
  it('נגזרים חיים: 3 חסרות-דיילות (מתוכם 1 בלי זימון) · 2 לוגיסטיקה (4 פריטים)', async () => {
    renderPage()
    await screen.findByTestId('projects-table')
    expect(screen.getByTestId('projects-tile-staffing').textContent).toContain('3')
    expect(screen.getByText('מתוכם 1 שלא נשלח בו אף זימון')).toBeInTheDocument()
    expect(screen.getByTestId('projects-tile-logistics').textContent).toContain('2')
    expect(screen.getByText('4 פריטים טרם מוכנים')).toBeInTheDocument()
  })

  it('🔴 האריחים אינם משתנים בין הלשוניות — אותם מספרים גם ב"לסגירה"', async () => {
    const first = renderPage()
    await screen.findByTestId('projects-table')
    const staffing = screen.getByTestId('projects-tile-staffing').textContent
    const logistics = screen.getByTestId('projects-tile-logistics').textContent
    first.unmount()

    renderPage('/projects?tab=closing')
    await screen.findByTestId('projects-table')
    expect(screen.getByTestId('projects-tile-staffing').textContent).toBe(staffing)
    expect(screen.getByTestId('projects-tile-logistics').textContent).toBe(logistics)
  })
})

describe('ProjectsPage — לשונית "הכול": גלולות ומסנן', () => {
  it('תשע גלולות; גלולת-0 נשארת, מכובה ומנומקת ב-title — לא נעלמת (⑦)', async () => {
    renderPage('/projects?tab=all')
    await screen.findByTestId('projects-table')
    const pills = screen.getAllByTestId(/^projects-pill-/)
    expect(pills).toHaveLength(9)
    const invoicePill = screen.getByTestId('projects-pill-awaiting_invoice')
    expect(invoicePill).toBeDisabled()
    expect(invoicePill).toHaveAttribute('title', 'אין כרגע פרויקט בסטטוס הזה')
    const finishedPill = screen.getByTestId('projects-pill-finished')
    expect(finishedPill).toBeDisabled()
    // גלולה עם נתונים אינה מכובה ואינה נושאת נימוק.
    expect(screen.getByTestId('projects-pill-cancelled')).not.toBeDisabled()
  })

  it('⑲: הסטטוס מוצג "ממתין לסגירה" — "אירוע הסתיים" אינו קיים על המסך', async () => {
    renderPage('/projects?tab=all')
    await screen.findByTestId('projects-table')
    expect(screen.getAllByText('ממתין לסגירה').length).toBeGreaterThan(0)
    expect(screen.queryByText('אירוע הסתיים')).not.toBeInTheDocument()
  })

  it('שורה שנמסרה הלאה: מדדי-המוכנות "—" והשורה מעומעמת, לא אדומה', async () => {
    renderPage('/projects?tab=all')
    await screen.findByTestId('projects-table')
    const cancelled = screen.getByTestId('projects-row-103')
    expect(within(cancelled).getAllByText('—')).toHaveLength(2)
    expect(cancelled.className).toContain('bg-slate-50')
    expect(cancelled.className).not.toContain('bg-red-50')
  })

  it('מצב ③ — ריק אחרי סינון: המשפטים הנעולים + "נקה סינון" שבאמת מנקה (ההפך ממצב ②)', async () => {
    // ‏window=all — הבדיקה הזו בודקת את מסנן-הסטטוס, לא את חלון-הזמן; #104 (לפני 146 ימים)
    // חייב להישאר בפנים כדי ש"נקה סינון" יחזיר את כל שמונת השורות כפי שהיה לפני 04/09.
    renderPage('/projects?tab=all&status=awaiting_invoice&window=all')
    expect(await screen.findByText('אין פרויקט התואם למסנן שבחרת.')).toBeInTheDocument()
    expect(screen.getByText('8 פרויקטים קיימים ואינם מוצגים כרגע.')).toBeInTheDocument()
    expect(screen.queryByText('למסך הצעות מחיר →')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('projects-clear-filter'))
    expect(await screen.findByTestId('projects-table')).toBeInTheDocument()
    expect(rowOrder()).toHaveLength(8)
  })

  it('🕐 חלון-ברירת-המחדל (04/09/2026): #104 (לפני 146 ימים) מוסתר; "הכול" (חלון) מציג אותו', async () => {
    // ברירת-המחדל '90d' תוחמת רק את העבר — #104 (awaiting_payment, לפני 146 ימים) נעלם,
    // ושבע השורות האחרות (עתידיות/קרובות) נשארות. גלולת-הרמז מדווחת "עוד 1 מחוץ לחלון".
    renderPage('/projects?tab=all')
    await screen.findByTestId('projects-table')
    expect(rowOrder()).toHaveLength(7)
    expect(rowOrder()).not.toContain(104)
    expect(screen.getByTestId('list-window-hidden')).toHaveTextContent('עוד 1 מחוץ לחלון')

    // מעבר ל"הכול" (גלולת-חלון, לא גלולת-סטטוס) מחזיר את #104 ומכבה את רמז-החוסר.
    fireEvent.click(screen.getByTestId('list-window-all'))
    expect(await screen.findByTestId('projects-row-104')).toBeInTheDocument()
    expect(rowOrder()).toHaveLength(8)
    expect(screen.queryByTestId('list-window-hidden')).not.toBeInTheDocument()
  })
})

describe('ProjectsPage — דפדוף (04/09/2026)', () => {
  it('רשימה של 60 שורות מוצגת בעמודים של 50, והחלפת-לשונית מאפסת את העמוד', async () => {
    // 60 שורות עתידיות (תמיד בתוך כל חלון) בלשונית "בעבודה" — מספיק כדי לחצות את PAGE_SIZE.
    const many = Array.from({ length: 60 }, (_, i) =>
      row({
        project_id: 200 + i,
        event_name: `אירוע ${i}`,
        final_event_date: offsetIso(1 + i),
        project_status: 'not_started',
        assignments_row_count: 0,
      }),
    )
    listProjectsOverview.mockResolvedValue(many)
    renderPage('/projects?page=2')
    await screen.findByTestId('projects-table')
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('2/2')
    expect(rowOrder()).toHaveLength(10) // 60 - 50

    // מעבר-לשונית מאפס את העמוד — עוברים ל"הכול" (גם 60 השורות שם) ומוודאים שהעמוד חוזר
    // ל-1 (50 הראשונות), לא נשאר על ה-offset של עמוד 2 בלשונית הקודמת.
    fireEvent.click(screen.getByTestId('projects-tab-all'))
    await screen.findByTestId('projects-table')
    expect(rowOrder()).toHaveLength(50)
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('1/2')
  })
})

describe('ProjectsPage — מצב ④: לשונית ריקה', () => {
  it('"לסגירה" ריקה היא בשורה טובה — ניסוח חיובי, והמונה 0 נשאר על הלשונית', async () => {
    listProjectsOverview.mockResolvedValue(
      mockBoard().filter((p) => p.project_status !== 'event_finished'),
    )
    renderPage('/projects?tab=closing')
    expect(await screen.findByText('אין אירוע שממתין לסגירה')).toBeInTheDocument()
    // המונה מוצג "0" ואינו נעלם (⑦) — לשונית שנעלמת מוחקת את המצב מהמציאות.
    expect(within(screen.getByTestId('projects-tab-closing')).getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('לא ניתן לטעון את הנתונים.')).not.toBeInTheDocument()
  })
})
