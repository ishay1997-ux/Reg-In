// בדיקת החיווט של ספי-הזימון במבט-העל (מודול 9 · צעד 2.3) — **הקובץ הראשון שמרנדר
// קומפוננטה של מודול 4.** עד כה היה למודול קובץ-בדיקה אחד בלבד (`api.test.js`), כלומר
// שלושת הספים שירדו ל-`params` היו נבדקים בשכבה הטהורה ואף לא פעם אחת על מסך.
//
// 🎯 **ההיקף מכוון וצר:** מה שצעד 2.3 שינה כאן ותו לא — הטעינה דרך `getParamValues`,
// הזרקת שלושת הספים ל-`overviewRow`, ושתי המחרוזות שמצטטות אותם (תווית "דחוף" ושורת-
// המשנה של אריח האירועים החסרים). 🚫 הבדיקה **אינה** מנסה לכסות את שאר המסך (מיון,
// כפתור-הרענון המרוכז, מצבי-ריק) — זה היה מרחיב את הצעד לעבודה שאיש לא ביקש.
//
// ⚠️ **התאריכים יחסיים לשעון האמיתי**: המסך קורא את השעון בעצמו (`nowIso()`), וקיבוע
// תאריך היה מזייף בדיוק את חלונות-הזמן שנבדקים כאן.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import OverviewTab from './OverviewTab'
import { listStaffingOverview } from './api'
import { getParamValues } from '@/api/params'

vi.mock('./api', () => ({ listStaffingOverview: vi.fn() }))
// 🔄 הקורא המשותף ממוקק כמו כל שאר ה-API. הערכים **מחרוזות**, כפי שהמסד מחזיר
// (`param_value` הוא `text` לכל סוג).
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))

const authState = { permissions: { דיילות: 'edit', פרויקטים: 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const HOURS = 3_600_000

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * HOURS)
}

// אירוע שמתחיל בעוד N שעות, בפורמט ש-`eventStartInstant` מרכיב ממנו את רגע-האירוע
// (תאריך + שעה מקומיים). מספר-הדיילות הנדרש גדול מהמאושרות ⇒ השורה **חסרה**, וזה
// התנאי של `showsFinalDayAlert`.
function projectInHours(projectId, hours) {
  const at = hoursFromNow(hours)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    project_id: projectId,
    event_name: `אירוע ${projectId}`,
    customer_name: 'לקוח בדיקה',
    final_event_date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    final_start_time: `${pad(at.getHours())}:${pad(at.getMinutes())}:00`,
    final_end_time: '23:59:00',
    final_location: 'תל אביב',
    required_hostess_count: 3,
    project_status: 'in_progress',
    assignments: [],
  }
}

const THRESHOLDS = {
  שעות_תוקף_זימון: '48',
  שעות_סף_זימון_לפני_אירוע: '24',
  שעות_אירוע_דחוף: '72',
}

beforeEach(() => {
  vi.clearAllMocks()
  // ‏19 שעות ⇒ בתוך חלון ה-24 **וגם** בתוך חלון ה-72 בברירת-המחדל.
  listStaffingOverview.mockResolvedValue([projectInHours(701, 19)])
  getParamValues.mockResolvedValue(THRESHOLDS)
})

// ✏️ 25/09/2026: המסנן חי בכתובת (`?filter=`) ⇒ המסך צריך נתב. ‏`Where` מדפיס את הכתובת הנוכחית.
function Where() {
  const location = useLocation()
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>
}

function renderTab(entry = '/hostesses') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <OverviewTab reloadKey={0} onOpenSmartMatch={vi.fn()} onResendExpired={vi.fn()} />
      <Where />
    </MemoryRouter>,
  )
}

describe('מבט-על — שלושת הספים נטענים מ-`params` ואינם קבועים בקוד', () => {
  it('שולף בדיוק את שלושת השמות, בשמם המדויק', async () => {
    renderTab()
    await screen.findByTestId('overview-table')

    expect(getParamValues).toHaveBeenCalledWith([
      'שעות_תוקף_זימון',
      'שעות_סף_זימון_לפני_אירוע',
      'שעות_אירוע_דחוף',
    ])
  })

  // 🛡️ **"שומר שלא נצפה נכשל — אינו שומר"** (`src/CLAUDE.md`): הכשל מוחזר בכוונה.
  // שורת-`params` חסרה **חייבת** לנחות במצב-השגיאה, ולא להציג רשימה שבה אף אירוע אינו
  // "דחוף" ואף זימון אינו "פג תוקף" — מצב שנראה בדיוק כמו "הכול בסדר".
  it('🔴 שורת-פרמטר חסרה ⇒ מצב-שגיאה, ולא רשימה שנראית תקינה', async () => {
    getParamValues.mockRejectedValueOnce(new Error('הפרמטר "שעות_אירוע_דחוף" חסר בהגדרות המערכת.'))
    renderTab()

    expect(await screen.findByTestId('overview-retry')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-table')).not.toBeInTheDocument()
  })
})

describe('הכיתובים מצטטים את הספים החיים — ולא מספר קפוא', () => {
  it('בברירת-המחדל: תווית "דחוף (עד 72 שעות)" ושורת-משנה "בתוך 24 שעות"', async () => {
    renderTab()
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-filter-urgent')).toHaveTextContent('דחוף (עד 72 שעות)')
    expect(screen.getByTestId('overview-kpi-missing')).toHaveTextContent('מתוכם 1 בתוך 24 שעות')
  })

  // 🔬 **בדיקת-המוטציה של צעד 2.3.** אותו אירוע ואותו "עכשיו" בדיוק — רק שתי שורות
  // אחרות ב-`params`. אילו המספרים היו נשארים קפואים במחרוזות, שתי הבדיקות היו זהות
  // והירוק היה מוכיח כלום.
  it('🔬 ספים 36/6 ⇒ הכיתובים אומרים 36 ו-6, ולא 72 ו-24', async () => {
    getParamValues.mockResolvedValue({
      ...THRESHOLDS,
      שעות_סף_זימון_לפני_אירוע: '6',
      שעות_אירוע_דחוף: '36',
    })
    renderTab()
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-filter-urgent')).toHaveTextContent('דחוף (עד 36 שעות)')
    expect(screen.getByTestId('overview-filter-urgent')).not.toHaveTextContent('72')
  })

  // 🔑 **והחצי שמוכיח שהכיתוב והחישוב זזו יחד:** ב-19 שעות לאירוע, סף 6 מוציא את השורה
  // מחלון ה-T-24 ⇒ שורת-המשנה מתחלפת לנוסח-השלילה, **עם אותו מספר חדש**. כיתוב שזז בלי
  // שהחישוב יזוז (או להפך) היה מסך שמסביר את עצמו לא נכון, וזה בדיוק מה שנבדק כאן.
  it('🔬 סף T-24 שירד ל-6 ⇒ האירוע יוצא מהחלון, והנוסח מתחלף עם המספר', async () => {
    getParamValues.mockResolvedValue({ ...THRESHOLDS, שעות_סף_זימון_לפני_אירוע: '6' })
    renderTab()
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-kpi-missing')).toHaveTextContent(
      'אף אחד מהם אינו בתוך 6 שעות',
    )
  })

  // 🔬 **החצי שחסר עד עכשיו (אודיט-סגירת מ9, 03/09/2026): גם ה*שורה*, לא רק האריח.**
  // `OverviewRow` נשא `24` קשיח בעוד האריח שמעליו כבר ציטט את הסף החי, כלומר בסף 6 אותו
  // מסך היה מציג שני מספרים סותרים במרחק שורה זה מזה. שתי הבדיקות שקדמו לזו היו עוברות.
  it('🔬 שורת-האירוע מצטטת את אותו סף כמו האריח — ולא 24 קפוא', async () => {
    getParamValues.mockResolvedValue({ ...THRESHOLDS, שעות_סף_זימון_לפני_אירוע: '48' })
    renderTab()
    await screen.findByTestId('overview-table')

    const kpi = screen.getByTestId('overview-kpi-missing')
    expect(kpi).toHaveTextContent('בתוך 48 שעות')
    const table = screen.getByTestId('overview-table')
    expect(table).toHaveTextContent('בתוך 48 שעות')
    expect(table).not.toHaveTextContent('בתוך 24 שעות')
  })
})

// ✏️ 25/09/2026 (הכרעת הסגן #1): אריח "אירועים עם חוסר" בדוח מ14 פותח את המסך הזה ב-`?filter=missing`.
// אירוע מאויש במלואו (701) ואירוע חסר (702) — כך רואים שהמסנן באמת נדלק מהכתובת.
function staffedProject(projectId, hours) {
  const project = projectInHours(projectId, hours)
  return {
    ...project,
    required_hostess_count: 1,
    assignments: [
      {
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'finally_approved',
        project_id: projectId,
      },
    ],
  }
}

describe('המסנן בכתובת — ?filter=missing', () => {
  beforeEach(() => {
    listStaffingOverview.mockResolvedValue([staffedProject(701, 30), projectInHours(702, 50)])
  })

  it('כתובת עם ?filter=missing ⇒ "הציגי חסרים בלבד" דלוק, והשורה המאוישת לא מוצגת', async () => {
    renderTab('/hostesses?filter=missing')
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-filter-missing')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('overview-row-702')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-row-701')).not.toBeInTheDocument()
  })

  it('בלי פרמטר ⇒ "הכול", ושתי השורות מוצגות', async () => {
    renderTab()
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-filter-all')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('overview-row-701')).toBeInTheDocument()
    expect(screen.getByTestId('overview-row-702')).toBeInTheDocument()
  })

  it('לחיצה על "הכול" מוחקת את הפרמטר, ולחיצה על "חסרים" כותבת אותו — ושאר הכתובת נשמרת', async () => {
    renderTab('/hostesses?filter=missing&returnTo=%2Freports')
    await screen.findByTestId('overview-table')

    fireEvent.click(screen.getByTestId('overview-filter-all'))
    expect(screen.getByTestId('where')).toHaveTextContent('/hostesses?returnTo=%2Freports')

    fireEvent.click(screen.getByTestId('overview-filter-missing'))
    expect(screen.getByTestId('where')).toHaveTextContent('filter=missing')
    expect(screen.getByTestId('where')).toHaveTextContent('returnTo=%2Freports')
  })

  it('ערך לא מוכר ⇒ "הכול", בלי לרוקן את הרשימה', async () => {
    renderTab('/hostesses?filter=bogus')
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-filter-all')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('overview-row-701')).toBeInTheDocument()
  })
})

// ✏️ 25/09/2026 (סבב תיקוני-אמת, מעבר-העיניים #9): באתר האריח אמר "מתוכם 37 פג תוקפם" והכפתור המרוכז "(7)", ועל
// שורות של אירועים מאוישים ישב כפתור נעול עם מונה ("שלחי שוב (5)"). שני המספרים נכונים — הכפתור סופר רק
// אירועים שעוד חסרים — אבל רק אחד אמר מה הוא סופר.
describe('"שלחי שוב" — כל מספר אומר מה הוא סופר', () => {
  function expiredInvite(projectId, hostessId) {
    return {
      project_id: projectId,
      hostess_id: hostessId,
      assignment_number: 1,
      assignment_status: 'pending',
      invite_sent_at: hoursFromNow(-100).toISOString(),
    }
  }

  it('אירוע מאויש עם זימונים שפגו: הכפתור בשורה נעול ובלי מונה; הכפתור המרוכז אומר "באירועים שעוד חסרים"', async () => {
    const full = {
      ...projectInHours(801, 200),
      required_hostess_count: 1,
      assignments: [
        { ...expiredInvite(801, 1), assignment_status: 'finally_approved' },
        expiredInvite(801, 2),
        expiredInvite(801, 3),
      ],
    }
    const missing = { ...projectInHours(802, 200), assignments: [expiredInvite(802, 4)] }
    listStaffingOverview.mockResolvedValue([full, missing])
    renderTab()
    await screen.findByTestId('overview-table')

    expect(screen.getByTestId('overview-kpi-pending')).toHaveTextContent('מתוכם 3 פג תוקפם')
    const bulk = screen.getByTestId('overview-resend-all')
    expect(bulk).toHaveTextContent('באירועים שעוד חסרים (1)')

    const fullButton = screen.getByTestId('overview-resend-801')
    expect(fullButton).toBeDisabled()
    expect(fullButton).toHaveTextContent(/^שלחי שוב$/)

    const missingButton = screen.getByTestId('overview-resend-802')
    expect(missingButton).toBeEnabled()
    expect(missingButton).toHaveTextContent('שלחי שוב (1)')
  })
})
