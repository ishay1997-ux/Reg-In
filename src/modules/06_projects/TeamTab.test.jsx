// בדיקות לשונית צוות-הדיילות (משטח 4, צעד 3.4) — ה-API ממוקק. מה שנעול כאן: הקיפול
// (9 שורות במסד ⇒ 6 דיילות על המסך) · הנגזרות בטבלה החיה מול הסטטוס הגולמי בהיסטוריה ·
// המשפט-האדום-היחיד בנוסחו המאושר · שני הווריאנטים (טרם נשלח זימון · פרויקט שבוטל) ·
// ומצב-ההרשאה המוצהר למי שחסומה על 'דיילות' (לעולם לא טבלה ריקה בשקט).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TeamTab from './TeamTab'
import { getProjectAssignments, getProjectChanges } from './api'
import { getParamValues } from '@/api/params'
import { TEAM_NO_PERMISSION_SENTENCE, CANCELLED_SCOPE_REASON } from '@/lib/projectTeam'

vi.mock('./api', () => ({
  getProjectAssignments: vi.fn(),
  getProjectChanges: vi.fn(),
}))

// 🔄 סף-תוקף-הזימון ירד ל-`params` (מודול 9 · צעד 2.3) והלשונית טוענת אותו בעצמה.
// הערך `'48'` **מחרוזת**, כפי שהמסד מחזיר (`param_value` הוא `text`).
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))

// תאריכים יחסיים לשעון האמיתי — הלשונית קוראת את השעון בעצמה, ותוקף-הזימון נגזר ממנו
// (‏48 שעות, מ-`params`).
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}
function daysFromNow(days) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

function project(overrides) {
  return {
    project_id: 8,
    quote_id: 6,
    event_name: 'כנס לקוחות שנתי',
    project_status: 'in_progress',
    required_hostess_count: 6,
    final_event_date: daysFromNow(9),
    final_start_time: '18:00',
    final_end_time: '22:00',
    created_at: '2026-08-12T10:00:00Z',
    ...overrides,
  }
}

function overviewRow(overrides) {
  return {
    project_id: 8,
    required_hostess_count: 6,
    hostesses_confirmed: 1,
    pending_invites: 2,
    ...overrides,
  }
}

function assignmentRow(overrides) {
  return {
    project_id: 8,
    assignment_number: 1,
    assignment_status: 'pending',
    invite_sent_at: hoursAgo(96),
    responded_at: null,
    is_shift_lead: false,
    hourly_rate_snapshot: 45,
    hostesses: { hostess_id: 'h0', full_name: 'דיילת', email: 'x@y.z', phone: '050' },
    ...overrides,
  }
}

// לוח #8 כפי שנמדד: 9 שורות · 6 דיילות · 1 אושרה סופית · שני זימונים פתוחים שפגו.
function boardFixture() {
  return [
    assignmentRow({
      hostess_id: 'h1',
      assignment_status: 'finally_approved',
      is_shift_lead: true,
      responded_at: hoursAgo(90),
      // ‏city — תת-שורת-העיר מהמוקאפ המאושר (psub2), נוספה לצירוף בצעד 4.2.
      hostesses: { hostess_id: 'h1', full_name: 'נועה שגיא', city: 'רמת גן' },
    }),
    assignmentRow({
      hostess_id: 'h2',
      assignment_status: 'declined',
      hostesses: { hostess_id: 'h2', full_name: 'עדי שפירא' },
    }),
    assignmentRow({
      hostess_id: 'h2',
      assignment_number: 2,
      assignment_status: 'pending',
      invite_sent_at: hoursAgo(72), // פג — עברו יותר מ-48 שעות
      hostesses: { hostess_id: 'h2', full_name: 'עדי שפירא' },
    }),
    assignmentRow({
      hostess_id: 'h3',
      assignment_status: 'pending',
      invite_sent_at: hoursAgo(100), // פג
      hostesses: { hostess_id: 'h3', full_name: 'רוני אלמוג' },
    }),
    assignmentRow({
      hostess_id: 'h4',
      assignment_status: 'released',
      hostesses: { hostess_id: 'h4', full_name: 'דנה לוין' },
    }),
    assignmentRow({
      hostess_id: 'h4',
      assignment_number: 2,
      assignment_status: 'released',
      invite_sent_at: hoursAgo(80),
      hostesses: { hostess_id: 'h4', full_name: 'דנה לוין' },
    }),
    assignmentRow({
      hostess_id: 'h4',
      assignment_number: 3,
      assignment_status: 'released',
      invite_sent_at: hoursAgo(60),
      hostesses: { hostess_id: 'h4', full_name: 'דנה לוין' },
    }),
    assignmentRow({
      hostess_id: 'h5',
      assignment_status: 'released',
      hostesses: { hostess_id: 'h5', full_name: 'דנה ברק' },
    }),
    assignmentRow({
      hostess_id: 'h6',
      assignment_status: 'approval_withdrawn',
      hostesses: { hostess_id: 'h6', full_name: 'הילה מזרחי' },
    }),
  ]
}

async function renderTab(props = {}) {
  const utils = render(
    <MemoryRouter>
      <TeamTab
        project={project()}
        overviewRow={overviewRow()}
        canEdit
        canReadHostesses
        onScopeChange={() => {}}
        {...props}
      />
    </MemoryRouter>,
  )
  await waitFor(() => expect(screen.queryByTestId('skeleton-table')).not.toBeInTheDocument())
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjectAssignments.mockResolvedValue(boardFixture())
  getProjectChanges.mockResolvedValue([])
  getParamValues.mockResolvedValue({ שעות_תוקף_זימון: '48' })
})

// 🛡️ **"שומר שלא נצפה נכשל — אינו שומר"** (`src/CLAUDE.md`): הכשל מוחזר בכוונה כדי לראות
// את ההגנה צועקת. שורת-`params` חסרה **חייבת** לנחות במצב-השגיאה המוצהר, ולא להפוך בשקט
// כל זימון פג ל"ממתינה למענה" — הפגם שהמשפט-האדום של המסך קיים בשבילו.
describe('סף-תוקף-הזימון חסר — מצב-שגיאה מוצהר, לא טבלה שקרית', () => {
  it('🔴 `getParamValues` שנכשלת ⇒ שגיאה + "נסי שוב", בלי טבלה', async () => {
    getParamValues.mockRejectedValueOnce(new Error('הפרמטר "שעות_תוקף_זימון" חסר בהגדרות המערכת.'))
    render(
      <MemoryRouter>
        <TeamTab
          project={project()}
          overviewRow={overviewRow()}
          canEdit
          canReadHostesses
          onScopeChange={() => {}}
        />
      </MemoryRouter>,
    )
    expect(await screen.findByTestId('team-state-error')).toBeInTheDocument()
    expect(screen.queryByTestId('team-table')).not.toBeInTheDocument()
  })
})

describe('הקיפול — 9 שורות במסד, 6 דיילות על המסך', () => {
  it('הטבלה הראשית מציגה שורה אחת פר-דיילת, לפי הסבב האחרון', async () => {
    await renderTab()
    expect(screen.getAllByTestId(/^team-row-/)).toHaveLength(6)
    // עדי סירבה בסבב 1 וזומנה שוב — הקובע הוא סבב 2 (פג תוקף), לא הסירוב.
    expect(screen.getByTestId('team-status-h2')).toHaveTextContent('פג תוקף')
  })

  it('תת-שורת-העיר מוצגת מתחת לשם בטבלה הקובעת בלבד (המוקאפ: psub2)', async () => {
    await renderTab()
    // לנועה יש city בפיקסטורה — מוצג; לשאר אין — לא נוצר אלמנט ריק.
    const noaCell = screen.getByTestId('team-row-h1')
    expect(noaCell).toHaveTextContent('רמת גן')
    // ההיסטוריה מציגה שם בלבד — העיר אינה שם (המוקאפ מצייר שם חשוף).
    fireEvent.click(screen.getByTestId('team-history-toggle'))
    expect(screen.getByTestId('team-history-row-h1-1')).not.toHaveTextContent('רמת גן')
  })

  it('הערת-השוליים של ההיסטוריה נוקבת במספרים החיים', async () => {
    await renderTab()
    fireEvent.click(screen.getByTestId('team-history-toggle'))
    expect(screen.getByTestId('team-history-footnote')).toHaveTextContent(
      '9 שורות במסד, 6 דיילות על המסך',
    )
  })
})

describe('נגזרות בטבלה החיה — סטטוס גולמי בהיסטוריה (הכלל חל על שתי הנגזרות)', () => {
  it('זימון שפג: "פג תוקף" למעלה, "ממתינה למענה" בהיסטוריה', async () => {
    await renderTab()
    expect(screen.getByTestId('team-status-h3')).toHaveTextContent('פג תוקף')
    fireEvent.click(screen.getByTestId('team-history-toggle'))
    expect(screen.getByTestId('team-history-status-h3-1')).toHaveTextContent('ממתינה למענה')
  })

  it('אירוע שעבר: "הושלם" למעלה, "אושרה סופית" בהיסטוריה', async () => {
    // אירוע אתמול ⇒ הנגזרת השנייה נדלקת על המאושרת — והגולמי אינו משתנה.
    await renderTab({ project: project({ final_event_date: daysFromNow(-1) }) })
    expect(screen.getByTestId('team-status-h1')).toHaveTextContent('הושלם')
    fireEvent.click(screen.getByTestId('team-history-toggle'))
    expect(screen.getByTestId('team-history-status-h1-1')).toHaveTextContent('אושרה סופית')
  })
})

describe('המשפט האדום היחיד — המילים נושאות אותו', () => {
  it('שני הזימונים הפתוחים פגו ⇒ הנוסח המאושר, במספרים חיים', async () => {
    await renderTab()
    const headline = screen.getByTestId('team-headline')
    expect(headline).toHaveTextContent('⚠ חסרות 5 דיילות')
    expect(headline).toHaveTextContent('שני הזימונים הפתוחים פגו אחרי 48 שעות')
    expect(headline).toHaveTextContent('הפעולה הבאה היא זימון חדש, לא המתנה.')
  })

  it('עמודת "מה זה אומר" — משפט, לעולם לא ציון', async () => {
    await renderTab()
    expect(screen.getByTestId('team-meaning-h1')).toHaveTextContent(
      'בפנים. היא אחראית המשמרת של האירוע',
    )
    // שוחררה מול ביטלה — נראות דומות בתג ושונות במילים (§⑥).
    expect(screen.getByTestId('team-meaning-h4')).toHaveTextContent('אנחנו ויתרנו עליה')
    expect(screen.getByTestId('team-meaning-h6')).toHaveTextContent('כן נספר באמינות ההגעה שלה')
  })

  it('תג אחראית-המשמרת בלי ★ — הגליף שמור להתרשמות (ζ)', async () => {
    await renderTab()
    const row = screen.getByTestId('team-row-h1')
    expect(within(row).getByText('אחראית משמרת')).toBeInTheDocument()
    expect(row.textContent).not.toContain('★')
  })
})

describe('וריאנט "טרם נשלח אף זימון"', () => {
  it('מצב-ריק עם קישור לשיבוץ החכם — ובלי אריח "חסרות"', async () => {
    getProjectAssignments.mockResolvedValue([])
    await renderTab()
    expect(screen.getByText('טרם נשלח אף זימון לאירוע הזה.')).toBeInTheDocument()
    const link = screen.getByTestId('team-empty-smart-match-link')
    expect(link).toHaveAttribute('href', '/hostesses')
    expect(screen.queryByTestId('team-tile-missing')).not.toBeInTheDocument()
    expect(screen.queryByTestId('team-headline')).not.toBeInTheDocument()
  })
})

describe('וריאנט "פרויקט שבוטל" — אין חוסר ואין אדום', () => {
  function cancelledProject() {
    return project({
      project_status: 'cancelled',
      cancelled_at: '2026-08-11T06:40:00Z',
      cancel_type: 'customer',
      cancel_reason: 'הלקוח ביטל את האירוע',
    })
  }

  function releasedBoard() {
    return ['יעל דוד', 'סיון נחום', 'מאיה כהן'].map((name, i) =>
      assignmentRow({
        hostess_id: `r${i}`,
        assignment_status: 'released',
        hostesses: { hostess_id: `r${i}`, full_name: name },
      }),
    )
  }

  it('תג בוטל + רשימת המשוחררות + כפתור מכובה-ומנומק', async () => {
    getProjectAssignments.mockResolvedValue(releasedBoard())
    await renderTab({ project: cancelledProject() })
    const fact = screen.getByTestId('team-cancelled-fact')
    expect(within(fact).getByText('בוטל')).toBeInTheDocument()
    expect(fact).toHaveTextContent('הלקוח ביטל')
    expect(fact).toHaveTextContent('3 דיילות שוחררו אוטומטית וקיבלו הודעה')
    expect(fact).toHaveTextContent('אין מה לבחור ואין חוסר — האירוע אינו מתקיים.')
    expect(screen.getAllByTestId(/^team-released-/)).toHaveLength(3)
    // מכובה ומנומק — לא נעלם (חסימת-מצב, בשונה מחסימת-הרשאה).
    const button = screen.getByTestId('team-scope-button')
    expect(button).toBeDisabled()
    expect(screen.getByTestId('team-cancelled-reason')).toHaveTextContent(CANCELLED_SCOPE_REASON)
    // אין חוסר ואין אדום — אין את המשפט האדום ואין אריח "חסרות".
    expect(screen.queryByTestId('team-headline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('team-tile-missing')).not.toBeInTheDocument()
  })
})

describe('חסימת "דיילות" — מצב מוצהר, לא טבלה ריקה בשקט (⑧-8ב)', () => {
  it('מנהלת כספים: המונים מהמבט-העל אמיתיים, הפירוט חסום במפורש', async () => {
    await renderTab({ canReadHostesses: false, canEdit: false })
    // הקריאה החסומה לא נורית בכלל — [] בלי שגיאה היה נקרא "טרם נשלח זימון".
    expect(getProjectAssignments).not.toHaveBeenCalled()
    expect(screen.getByText(TEAM_NO_PERMISSION_SENTENCE)).toBeInTheDocument()
    expect(screen.queryByText('טרם נשלח אף זימון לאירוע הזה.')).not.toBeInTheDocument()
    // המונים מגיעים משורת מבט-העל (RPC מוגדר): אושרו 1 מתוך 6 נדרשות.
    expect(screen.getByTestId('team-tile-confirmed')).toHaveTextContent('1')
    expect(screen.getByTestId('team-tile-required')).toHaveTextContent('6')
  })
})

describe('"שנה כמות דיילות" — כפתור-משני שפותח את דיאלוג התכולה', () => {
  it('לוחץ אל onScopeChange, וקיים רק לבעלת-עריכה', async () => {
    const onScopeChange = vi.fn()
    await renderTab({ onScopeChange })
    fireEvent.click(screen.getByTestId('team-scope-button'))
    expect(onScopeChange).toHaveBeenCalledTimes(1)
  })

  it('בלי הרשאת-עריכה הכפתור אינו קיים כלל', async () => {
    await renderTab({ canEdit: false })
    expect(screen.queryByTestId('team-scope-button')).not.toBeInTheDocument()
  })
})

describe('מקטע שינויי-התכולה בכמות הדיילות', () => {
  it('בלי שינויים — שורת-העובדה עם הכמות החיה', async () => {
    await renderTab()
    const section = screen.getByTestId('team-scope-changes')
    expect(section).toHaveTextContent('אין.')
    expect(section).toHaveTextContent('הכמות עומדת על 6 מאז אישור ההצעה')
  })

  it('שינוי כמות-דיילות מוצג; שינויי-תגים אינם נכנסים לכאן', async () => {
    getProjectChanges.mockResolvedValue([
      {
        change_id: 7,
        change_target: 'hostess_count',
        sku: null,
        delta_qty: 2,
        money_visible: false,
        reason: 'הלקוח הגדיל את האירוע',
        performed_by: 'dana@regin.co.il',
        created_at: '2026-08-14T08:00:00Z',
      },
      {
        change_id: 8,
        change_target: 'logistics',
        sku: 'B-REG-TAG',
        delta_qty: 80,
        money_visible: false,
        reason: 'עוד תגים',
        performed_by: 'dana@regin.co.il',
        created_at: '2026-08-14T09:00:00Z',
      },
    ])
    await renderTab()
    expect(screen.getByTestId('team-scope-change-7')).toHaveTextContent('הלקוח הגדיל את האירוע')
    expect(screen.queryByTestId('team-scope-change-8')).not.toBeInTheDocument()
    // אריח "כמות נדרשת" מפסיק לטעון שהכמות מההצעה.
    expect(screen.getByTestId('team-tile-required')).toHaveTextContent('עודכן בשינוי-תכולה')
  })
})
