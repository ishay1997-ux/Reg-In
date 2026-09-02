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
import { render, screen } from '@testing-library/react'
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

function renderTab() {
  return render(<OverviewTab reloadKey={0} onOpenSmartMatch={vi.fn()} onResendExpired={vi.fn()} />)
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
})
