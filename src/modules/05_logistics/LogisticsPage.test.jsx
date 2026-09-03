// בדיקת משטח 1 של מודול 5 (`/logistics`) — נועלת את מה שהאישור של 26/08/2026 קבע לצעד 3.1:
// חמשת המצבים בסדר-הענפים של כרטיס-המסך §④ (**חוסר-הרשאה ראשון**) · שלוש הגלולות ומוניהן ·
// סעיף-היציאה שנשאר גם ריק · סימון-הענבר של ⑳ והחרגת `01WEB` · שורות-הנימוק המאושרות (O-1/O-5) ·
// ולחיצוּת כל שורה, כולל בסעיף-היציאה (㊷). ה-API והדיאלוג ממוקקים — אין Supabase בבדיקה.
//
// ⚠️ **כל התאריכים יחסיים ל"היום" האמיתי**, כי המסך קורא את השעון בעצמו וקיבוע תאריך היה
// מזייף את חלונות-הזמן. ההיסטים נבחרו כך שהמסקנה זהה בכל יום בשבוע: `+12` יום-לוח הם
// ‏8–10 ימי-עסקים (תמיד ≤ 10 ⇒ ענבר), ‏`+49`/`+70` הם הרבה מעל הסף (⇒ אף פעם לא ענבר),
// ו-`+0`/`+1` תמיד בתוך חלון-היציאה של ㉓.
//
// 🔬 **הנתונים מגוונים ולא-מונוטוניים לפי אינדקס** (משמעת 30/07): סדר-הקלט מעורבב בכוונה,
// אחרת בדיקת-המיון הייתה מאשרת את סדר-הקליטה במקום את המיון.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import LogisticsPage from './LogisticsPage'
import { listActiveProjects, listLogisticsRows, listProducts } from './api'
import { getParamValues } from '@/api/params'

vi.mock('./api', () => ({
  listActiveProjects: vi.fn(),
  listLogisticsRows: vi.fn(),
  listProducts: vi.fn(),
}))

// 🔄 סף-הענבר ירד ל-`params` (מודול 9 · צעד 2.3) והמסך טוען אותו בעצמו — הקורא המשותף
// ממוקק כמו כל שאר ה-API. הערך `'10'` הוא **מחרוזת**, כפי שהמסד מחזיר (`param_value` הוא `text`).
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))

// הדיאלוג הוא של צעד 3.2 — כאן נבדק **חוזה-האינטגרציה בלבד**: מי נפתח, ומה קורה בסגירה.
vi.mock('./ChecklistDialog', () => ({
  default: ({ projectId, open, onOpenChange }) => (
    <div data-testid="checklist-dialog" data-project={String(projectId)} data-open={String(open)}>
      <button type="button" data-testid="checklist-close" onClick={() => onOpenChange(false)}>
        סגור
      </button>
    </div>
  ),
}))

// אותו "היום" שהמסך מחשב — שעון ישראל, לא UTC.
function todayIso() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const at = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${at('year')}-${at('month')}-${at('day')}`
}

function offsetIso(days) {
  const [year, month, day] = todayIso().split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day) + days * 86_400_000).toISOString().slice(0, 10)
}

const PRODUCTS = [
  { sku: 'B-REG-TAG', item_name: 'תג רישום', category: 'print', unit: 'יחידה' },
  { sku: 'B-ECO-TAG', item_name: 'תג אקולוגי', category: 'print', unit: 'יחידה' },
  { sku: 'B-SAT-LAN', item_name: 'שרוך', category: 'print', unit: 'יחידה' },
  // ⑧/⑳ — אתר-הרישום אינו פריט פיזי: הסף נגזר מזמן-ייצור של דפוס, ואתר אינו מודפס.
  { sku: '01WEB', item_name: 'הקמת אתר רישום', category: 'site', unit: 'יחידה' },
]

function project(id, name, customer, date, status) {
  return {
    project_id: id,
    event_name: name,
    customer_name: customer,
    final_event_date: date,
    project_status: status,
  }
}

function row(projectId, sku, itemStatus, extra = {}) {
  return {
    project_id: projectId,
    sku,
    serial_number: 1,
    planned_qty: 100,
    actual_qty: null,
    item_status: itemStatus,
    notes: null,
    expected_arrival_date: null,
    actual_arrival_date: null,
    ...extra,
  }
}

// לוח-הדמו כפי שנזרע: 3 `דורש טיפול` · 1 `ממתין למשלוח` · 5 `הכול` · 2 בסעיף-היציאה ·
// ענבר על אחד בלבד. ‏`#11` הוא פעיל **בלי שורות** — כלל-האוכלוסייה מוציא אותו מכל גלולה,
// ובלעדיו `הכול` היה 6.
function board() {
  return {
    projects: [
      project(3, 'כנס רפואה 2026', 'מדיטק פתרונות בע"מ', offsetIso(70), 'not_started'),
      project(106, 'כנס פתיחת שנה', 'הייטק גרופ בע"מ', offsetIso(1), 'in_progress'),
      project(11, 'כנס טכנולוגיה שנתי', 'מדיטק פתרונות בע"מ', offsetIso(33), 'in_progress'),
      project(
        107,
        'ערב השקה — קמפוס צפון',
        'קמפוס טכנולוגי צפון בע"מ',
        offsetIso(12),
        'in_progress',
      ),
      project(8, 'כנס לקוחות שנתי', 'מדיטק פתרונות בע"מ', offsetIso(49), 'in_progress'),
      project(105, 'פסטיבל קיץ עירוני', 'עיריית חדרה', offsetIso(0), 'ready'),
    ],
    rows: [
      row(8, 'B-REG-TAG', 'not_started'),
      row(8, 'B-SAT-LAN', 'not_started'),
      row(105, 'B-REG-TAG', 'ready', { actual_qty: 300 }),
      row(105, 'B-SAT-LAN', 'ready', { actual_qty: 300 }),
      row(107, 'B-REG-TAG', 'ready', { actual_qty: 150 }),
      row(107, 'B-SAT-LAN', 'not_started'),
      row(107, '01WEB', 'not_started', { planned_qty: 1 }),
      row(107, 'B-ECO-TAG', 'ordered'),
      row(106, 'B-REG-TAG', 'ready', { actual_qty: 250 }),
      row(106, 'B-SAT-LAN', 'ordered', { planned_qty: 200, actual_qty: 120 }),
      row(3, 'B-REG-TAG', 'not_started'),
      row(3, 'B-ECO-TAG', 'not_started'),
    ],
  }
}

function loadBoard({ projects, rows }) {
  listActiveProjects.mockResolvedValue(projects)
  listLogisticsRows.mockResolvedValue(rows)
}

function queueOrder() {
  return screen
    .getAllByTestId(/^logistics-row-/)
    .map((tr) => Number(tr.getAttribute('data-testid').replace('logistics-row-', '')))
}

beforeEach(() => {
  vi.clearAllMocks()
  listProducts.mockResolvedValue(PRODUCTS)
  getParamValues.mockResolvedValue({ סף_לוגיסטיקה_ימי_עסקים: '10' })
  loadBoard(board())
})

describe('LogisticsPage — כותרת ומצב-טעינה', () => {
  it('מצב ⑤: שלד-טבלה, לא ספינר ולא מסך ריק', () => {
    listActiveProjects.mockReturnValue(new Promise(() => {}))
    render(<LogisticsPage />)
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
    expect(screen.queryByTestId('logistics-queue-table')).not.toBeInTheDocument()
    expect(screen.queryByText('לא ניתן לטעון את הנתונים.')).not.toBeInTheDocument()
  })

  it('תת-הכותרת מצהירה מה ה"היום" של המסך — מהשעון, לא מהמוקאפ', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const [year, month, day] = todayIso().split('-')
    // 🚫 התאריך המצויר במוקאפ (חמישי 27/08/2026) הוא ה"היום" של הציור ואינו נכתב לקוד —
    // השורה נגזרת מהשעון בכל טעינה.
    expect(screen.getByTestId('logistics-today').textContent).toBe(
      `היום: ${day}/${month}/${year} · יום ${'ראשון שני שלישי רביעי חמישי שישי שבת'.split(' ')[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()]}`,
    )
  })
})

describe('LogisticsPage — 🔴 מצב ①: חוסר-הרשאה נבדק ראשון (AR-3 · כרטיס §④)', () => {
  it('projects החזירה שורות ו-logistics אפס ⇒ משפט-החוסר-הרשאה ומונים "—", לעולם לא "התור ריק"', async () => {
    loadBoard({ projects: board().projects.slice(0, 3), rows: [] })
    render(<LogisticsPage />)

    expect(
      await screen.findByText(
        'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין.',
      ),
    ).toBeInTheDocument()

    // שלושת המונים "—" ולא "0" — `0` נקרא כעובדה, `—` נקרא כ"אין לי את הנתון".
    for (const key of ['needsAction', 'awaitingDelivery', 'all']) {
      const pill = screen.getByTestId(`logistics-pill-${key}`)
      expect(within(pill).getByText('—')).toBeInTheDocument()
      expect(within(pill).queryByText('0')).not.toBeInTheDocument()
      expect(pill).toBeDisabled()
      // הנימוק של גלולה-מושבתת הוא טענה על דאטה שאיננו רשאים לקרוא ⇒ אינו מוצג כאן.
      expect(pill).not.toHaveAttribute('title')
    }

    // 🚫 ולא "ריק כדין" בשום צורה — לא בתור ולא בסעיף-היציאה.
    expect(screen.queryByText('אין פרויקט התואם למסנן שבחרת.')).not.toBeInTheDocument()
    expect(screen.queryByText('אין אירוע שיוצא עד יום העסקים הבא.')).not.toBeInTheDocument()
    expect(screen.queryByTestId('logistics-outbound')).not.toBeInTheDocument()
  })

  it('היפוך הפיקסצ׳ר: **אותם שלושה** פרויקטים, עם השורות שלהם ⇒ תור רגיל, בלי משפט-החוסר-הרשאה', async () => {
    // 🔬 **זוג מבוקר.** עד כאן ההיפוך רץ על הלוח המלא (שישה פרויקטים) בעוד הבדיקה שמעליו
    // רצה על שלושה — כלומר **שני** משתנים התחלפו בבת-אחת, וההיפוך לא הוכיח שהמבחין הוא
    // `rows`. כאן חתיכת-הפרויקטים זהה (`slice(0, 3)`, אותה שורה בדיוק), ורק השורות שלהם
    // מוחזרות ⇒ המשתנה היחיד שמשתנה הוא הקריאה ל-`logistics`.
    const data = board()
    const kept = data.projects.slice(0, 3)
    const keptIds = new Set(kept.map((p) => p.project_id))
    loadBoard({ projects: kept, rows: data.rows.filter((r) => keptIds.has(r.project_id)) })
    render(<LogisticsPage />)
    expect(await screen.findByTestId('logistics-queue-table')).toBeInTheDocument()
    expect(screen.queryByTestId('logistics-no-permission')).not.toBeInTheDocument()
    expect(screen.getByTestId('logistics-outbound')).toBeInTheDocument()
  })
})

describe('LogisticsPage — מצב ②: תקלת-טעינה', () => {
  it('הכותרת הנעולה לבדה + "נסי שוב"; 🚫 בלי שורת-הפירוט שמדברת על "הפרויקט"', async () => {
    listActiveProjects.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<LogisticsPage />)

    expect(await screen.findByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(screen.queryByText('נתוני הלוגיסטיקה של הפרויקט לא נטענו.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
    // 🚫 כשל-טעינה אינו "ריק" ואינו "חסום" — שלושת המצבים נראים שונה זה מזה.
    expect(screen.queryByTestId('logistics-no-permission')).not.toBeInTheDocument()
    expect(screen.queryByTestId('logistics-outbound')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    expect(await screen.findByTestId('logistics-queue-table')).toBeInTheDocument()
  })

  // 🛡️ **"שומר שלא נצפה נכשל — אינו שומר"** (`src/CLAUDE.md`): הכשל מוחזר בכוונה כדי
  // לראות את ההגנה צועקת. שורת-`params` חסרה **חייבת** לנחות במצב ② ולא לצייר תור לבן
  // שנראה תקין — זה בדיוק "המסך משקר" שכרטיס-המסך נכתב נגדו.
  it('🔴 שורת `סף_לוגיסטיקה_ימי_עסקים` חסרה ⇒ מצב ②, ולא תור בלי ענבר', async () => {
    getParamValues.mockRejectedValueOnce(
      new Error('הפרמטר "סף_לוגיסטיקה_ימי_עסקים" חסר בהגדרות המערכת.'),
    )
    render(<LogisticsPage />)

    expect(await screen.findByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(screen.queryByTestId('logistics-queue-table')).not.toBeInTheDocument()
  })
})

describe('LogisticsPage — שלוש הגלולות (㉙ · ㉛ · ⑲ · ㉚)', () => {
  it('פריט-חוזה 3: המונים 3 · 1 · 5 — ופרויקט פעיל בלי שורות אינו נספר באף גלולה', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    // 🔴 הפיזור לשאילתה השנייה הוא **כל** מזהי-הפרויקטים שחזרו, בסדר שבו חזרו — כולל `#11`
    // שאין לו שורות. מזהה שנשמט מהמערך מחזיר טבלה שנראית "ריקה כדין" בשקט, וזה בדיוק
    // הכשל ש-`resolveQueueBranch` אינו יכול לתפוס (אפס שורות = חסום = ריק).
    expect(listLogisticsRows).toHaveBeenCalledWith([3, 106, 11, 107, 8, 105])
    const count = (key) =>
      screen.getByTestId(`logistics-pill-${key}`).textContent.replace(/\D/g, '')
    expect(count('needsAction')).toBe('3')
    expect(count('awaitingDelivery')).toBe('1')
    // ‏#11 פעיל עם אפס שורות ⇒ 5 ולא 6.
    expect(count('all')).toBe('5')
    expect(screen.queryByText('כנס טכנולוגיה שנתי')).not.toBeInTheDocument()
  })

  it('🚫 שלוש גלולות בדיוק — אין רביעית, ובפרט אין "בוטלו"', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(screen.getAllByTestId(/^logistics-pill-/)).toHaveLength(3)
    expect(screen.queryByText('בוטלו')).not.toBeInTheDocument()
  })

  it('㉛: "ממתין למשלוח" תופס את מי שאין בו אף `טרם החל` אך גם לא הכול הגיע', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    fireEvent.click(screen.getByTestId('logistics-pill-awaitingDelivery'))
    expect(queueOrder()).toEqual([106])
  })

  it('⑲: "הכול" כוללת גם את מי שהלוגיסטיקה בו הושלמה', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    fireEvent.click(screen.getByTestId('logistics-pill-all'))
    expect(queueOrder()).toEqual([105, 106, 107, 8, 3])
  })

  it('㉚: גלולה עם מונה 0 נשארת על המסך — מושבתת ומנומקת, לעולם לא נעלמת', async () => {
    const data = board()
    // בלי `#106` אין אף פרויקט במצב "ממתין למשלוח".
    loadBoard({
      projects: data.projects.filter((p) => p.project_id !== 106),
      rows: data.rows.filter((r) => r.project_id !== 106),
    })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const pill = screen.getByTestId('logistics-pill-awaitingDelivery')
    expect(pill).toBeInTheDocument()
    expect(pill).toBeDisabled()
    expect(pill).toHaveAttribute('title', 'אין כרגע פרויקט במצב הזה')
    // גלולה עם דאטה אינה מושבתת ואינה נושאת נימוק.
    expect(screen.getByTestId('logistics-pill-all')).not.toBeDisabled()
  })
})

describe('LogisticsPage — סעיף-היציאה (㉓ · S-7 · ㊷)', () => {
  it('שתי שורות בלי ללחוץ דבר: מי שהכול מוכן בו, ומי שעדיין חסר — בסדר קרבה', async () => {
    render(<LogisticsPage />)
    const table = await screen.findByTestId('logistics-outbound-table')
    const names = within(table)
      .getAllByTestId(/^logistics-outbound-row-/)
      .map((tr) => tr.getAttribute('data-testid'))
    expect(names).toEqual(['logistics-outbound-row-105', 'logistics-outbound-row-106'])

    // עובדה טובה אינה צבועה — הנוסח הרגוע הנעול.
    expect(within(table).getByText('הכול מוכן — לוודא שהסחורה יוצאת')).toBeInTheDocument()
    // O-5: צורת-היחידות המאושרת ("שרוכים" אינו נגזר מדאטה), בקידומת "מתי הוא יוצא".
    const outbound106 = screen.getByTestId('logistics-outbound-row-106')
    expect(outbound106.textContent).toContain('יוצא ביום')
    expect(outbound106.textContent).toContain('80')
    expect(outbound106.textContent).toContain('יחידות עדיין בדרך')
    expect(outbound106.textContent).not.toContain('שרוכים')
  })

  it('מוכנות בסעיף: אותו מונה של התור, מפורק לשני ערכים מבודדים', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-outbound-table')
    expect(screen.getByTestId('logistics-outbound-row-105').textContent).toContain('2 מתוך 2')
    expect(screen.getByTestId('logistics-outbound-row-106').textContent).toContain('1 מתוך 2')
  })

  it('S-7: הסעיף נשאר על המסך גם כשאין אירוע בחלון — עם המשפט הנעול', async () => {
    const data = board()
    const far = new Set([105, 106])
    loadBoard({
      projects: data.projects.filter((p) => !far.has(p.project_id)),
      rows: data.rows.filter((r) => !far.has(r.project_id)),
    })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(screen.getByTestId('logistics-outbound')).toBeInTheDocument()
    expect(screen.getByTestId('logistics-outbound-empty').textContent).toBe(
      'אין אירוע שיוצא עד יום העסקים הבא.',
    )
    expect(screen.queryByTestId('logistics-outbound-table')).not.toBeInTheDocument()
  })

  it('🚫 אין בסעיף שום פקד-רישום — אין צ׳קבוקס "יצא"', async () => {
    render(<LogisticsPage />)
    const section = await screen.findByTestId('logistics-outbound')
    expect(within(section).queryAllByRole('checkbox')).toHaveLength(0)
    expect(within(section).queryAllByRole('button')).toHaveLength(0)
    expect(section.textContent).toContain('הסעיף מיידע בלבד')
  })
})

describe('LogisticsPage — סימון-הענבר (⑳ · ㊶)', () => {
  it('שורה אחת בלבד בענבר, עם הגליף ושורת ימי-העסקים — והשאר נקיות', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')

    const flagged = screen.getByTestId('logistics-row-107')
    expect(flagged.className).toContain('bg-amber-50')
    expect(flagged.className).not.toContain('bg-red-50')
    expect(
      within(flagged).getByTitle('פריט פיזי טרם הוזמן, והאירוע בתוך 10 ימי עסקים'),
    ).toBeInTheDocument()
    expect(flagged.textContent).toContain('ימי עסקים')

    for (const id of [8, 3]) {
      const clean = screen.getByTestId(`logistics-row-${id}`)
      expect(clean.className).not.toContain('bg-amber-50')
      expect(clean.textContent).not.toContain('ימי עסקים')
    }
  })

  it('⑧: `01WEB` אינו נספר — פרויקט שכל החוסר בו הוא אתר-הרישום אינו נדלק בענבר', async () => {
    loadBoard({
      projects: [project(201, 'כנס דיגיטלי', 'לקוח בדיקה', offsetIso(4), 'in_progress')],
      rows: [row(201, '01WEB', 'not_started', { planned_qty: 1 }), row(201, 'B-REG-TAG', 'ready')],
    })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const only = screen.getByTestId('logistics-row-201')
    expect(only.className).not.toContain('bg-amber-50')
    expect(only.textContent).not.toContain('ימי עסקים')
  })

  it('O-1: הטריגר השני של ㊶ — משלוח שהובטח ואיחר כותב את שורת-הנימוק', async () => {
    loadBoard({
      projects: [project(202, 'ערב מותג', 'לקוח בדיקה', offsetIso(40), 'in_progress')],
      rows: [
        row(202, 'B-REG-TAG', 'ready'),
        row(202, 'B-SAT-LAN', 'ordered', {
          planned_qty: 200,
          actual_qty: 120,
          expected_arrival_date: offsetIso(-6),
        }),
      ],
    })
    render(<LogisticsPage />)
    // בפרויקט היחיד אין אף `טרם החל` ⇒ גלולת ברירת-המחדל ריקה, והשורה חיה ב"ממתין למשלוח".
    fireEvent.click(await screen.findByTestId('logistics-pill-awaitingDelivery'))

    const late = screen.getByTestId('logistics-row-202')
    const [, month, day] = offsetIso(-6).split('-')
    expect(late.textContent).toContain(`ההגעה מתעכבת — הובטח ל-${day}/${month} וטרם הגיע`)
    // 🚫 והנוסח הכללי אינו מוצג במקומו.
    expect(late.textContent).not.toContain('יחידות עדיין בדרך')
    // האירוע רחוק (40 יום) ⇒ הענבר כאן אינו של ⑳, ולכן אין כיתוב-⑳ ואין שורת ימי-עסקים.
    expect(late.className).toContain('bg-amber-50')
    expect(
      within(late).queryByTitle('פריט פיזי טרם הוזמן, והאירוע בתוך 10 ימי עסקים'),
    ).not.toBeInTheDocument()
    expect(late.textContent).not.toContain('ימי עסקים')
  })

  it('🔴 "טרם הוזמנו" גובר על נוסח-האיחור — הוא העבודה שדורשת ממנה פעולה', async () => {
    loadBoard({
      projects: [project(203, 'כנס משולב', 'לקוח בדיקה', offsetIso(40), 'in_progress')],
      rows: [
        row(203, 'B-REG-TAG', 'not_started'),
        row(203, 'B-SAT-LAN', 'ordered', {
          planned_qty: 200,
          actual_qty: 120,
          expected_arrival_date: offsetIso(-6),
        }),
      ],
    })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const mixedRow = screen.getByTestId('logistics-row-203')
    expect(mixedRow.textContent).toContain('פריט אחד טרם הוזמן')
    expect(mixedRow.textContent).not.toContain('ההגעה מתעכבת')
  })
})

describe('LogisticsPage — טבלת-התור: עמודות, מיון ותוכן', () => {
  it('שש עמודות, הכותרת "מוכנות" — 🚫 ולעולם לא "התקדמות"', async () => {
    render(<LogisticsPage />)
    const table = await screen.findByTestId('logistics-queue-table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(6)
    expect(within(table).getByRole('columnheader', { name: 'מוכנות' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'מה חסר' })).toBeInTheDocument()
    expect(screen.queryByText('התקדמות')).not.toBeInTheDocument()
  })

  it('ממוין לפי קרבת האירוע — הקרוב תחילה, ולא לפי סדר-הקליטה', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(queueOrder()).toEqual([107, 8, 3])
    expect(screen.getByText('ממוין: לפי קרבת האירוע')).toBeInTheDocument()
  })

  it('שורות-הנימוק המאושרות בעמודת "מה חסר", ותג-מצב-הפרויקט בעמודת "מצב"', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(screen.getByTestId('logistics-row-107').textContent).toContain('שני פריטים טרם הוזמנו')
    expect(screen.getAllByText('טרם הוזמן אף פריט')).toHaveLength(2)
    expect(screen.getByTestId('logistics-row-107').textContent).toContain('1 מתוך 4')
    // ㉘ — "טרם החל" מופיע כתווית-**פרויקט** בלבד; מצבי-הפריטים חיים רק בתוך המדד המספרי.
    expect(within(screen.getByTestId('logistics-row-3')).getByText('טרם החל')).toBeInTheDocument()
    expect(screen.queryByText('הוזמן')).not.toBeInTheDocument()
    expect(screen.queryByText('מוכן')).not.toBeInTheDocument()
  })

  it('🚫 מה שאסור שיהיה על המסך: ₪ · מספרי-פרויקט · אריחי-מדד · כפתור ראשי · חיפוש', async () => {
    const { container } = render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(container.textContent).not.toContain('₪')
    expect(container.textContent).not.toContain('#107')
    expect(screen.queryByTestId(/tile/)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    // הכפתורים היחידים במסך: שלוש הגלולות + קישור-הצ׳קליסט בכל שורה.
    expect(screen.getAllByRole('button')).toHaveLength(3 + queueOrder().length)
  })
})

describe('LogisticsPage — פתיחת הצ׳קליסט (㉔ · ㊷) ורענון בסגירה (מצב ⑧)', () => {
  it('לחיצה על שורת-תור פותחת את הדיאלוג עם הפרויקט הנכון', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(screen.queryByTestId('checklist-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('logistics-row-8'))
    const dialog = screen.getByTestId('checklist-dialog')
    expect(dialog).toHaveAttribute('data-project', '8')
    expect(dialog).toHaveAttribute('data-open', 'true')
  })

  it('הקישור "לצ׳קליסט →" עושה בדיוק אותו דבר', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    fireEvent.click(screen.getByTestId('logistics-checklist-3'))
    expect(screen.getByTestId('checklist-dialog')).toHaveAttribute('data-project', '3')
  })

  it('㊷: גם שורה בסעיף-היציאה לחיצה ופותחת את אותו דיאלוג', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-outbound-table')
    fireEvent.click(screen.getByTestId('logistics-outbound-row-106'))
    expect(screen.getByTestId('checklist-dialog')).toHaveAttribute('data-project', '106')
  })

  it('⌨️ שורה נפתחת גם ב-Enter — נגישות-מקלדת, לא רק עכבר', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const queueRow = screen.getByTestId('logistics-row-107')
    expect(queueRow).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(queueRow, { key: 'Enter' })
    expect(screen.getByTestId('checklist-dialog')).toHaveAttribute('data-project', '107')
  })

  it('סגירת הדיאלוג מרעננת את התור — והתוצאה החדשה נוחתת על המסך, בלי שלד ובלי הודעה צפה', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    expect(listActiveProjects).toHaveBeenCalledTimes(1)
    expect(queueOrder()).toEqual([107, 8, 3])

    fireEvent.click(screen.getByTestId('logistics-row-8'))
    // 🔴 **לוח שני לפני הסגירה** — `#8` חוזר כשכל שורותיו `מוכן`. בלי זה שתי הקריאות פותרות
    // לאותו לוח בדיוק, ורענון שתוצאתו נזרקת לפח היה עובר בירוק: מונה-הקריאות מעיד שהקריאה
    // **נורתה**, לא שהתשובה **נחתה**.
    const refreshed = board()
    refreshed.rows = refreshed.rows.map((r) =>
      r.project_id === 8 ? { ...r, item_status: 'ready', actual_qty: 300 } : r,
    )
    loadBoard(refreshed)
    fireEvent.click(screen.getByTestId('checklist-close'))

    expect(screen.queryByTestId('checklist-dialog')).not.toBeInTheDocument()
    expect(listActiveProjects).toHaveBeenCalledTimes(2)
    // מצב ⑧ במילים: `#8` יצא מגלולת ברירת-המחדל, כי לא נשאר בו אף `טרם החל`.
    await waitFor(() => expect(queueOrder()).toEqual([107, 3]))
    expect(screen.getByTestId('logistics-pill-needsAction').textContent.replace(/\D/g, '')).toBe(
      '2',
    )
    // …והמוכנות שלו אכן נקראה מחדש ולא הוחזקה מהטעינה הראשונה: תחת `הכול` הוא 2 מתוך 2.
    fireEvent.click(screen.getByTestId('logistics-pill-all'))
    expect(screen.getByTestId('logistics-row-8').textContent).toContain('2 מתוך 2')

    // 🚫 והרענון שקט: אין הבהוב-שלד ואין הודעת-הצלחה צפה — התוצאה על המסך היא הערוץ.
    expect(screen.queryByTestId('skeleton-table')).not.toBeInTheDocument()
    expect(screen.getByTestId('logistics-queue-table')).toBeInTheDocument()
  })
})

describe('LogisticsPage — מקרא-הענבר נועל את שתי הסיבות (Q1, הכרעת-ישי 26/08)', () => {
  it('המקרא נושא גם את פסוקית-הטריגר-השני של ㊶ — אובדן-שורה-שקט הוא המשפחה המתועדת', async () => {
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')
    const legend = screen.getByText(/שורה בענבר/).closest('div')
    // שתי הסיבות, באותו מקרא: טריגר-⑳ (פיזי + 10 ימי-עסקים) והטריגר השני של ㊶ (איחור-משלוח) —
    // הפסוקית השנייה היא הנוסח שישי אישר מילה-במילה ("מאשר לפי המלצתך").
    expect(legend.textContent).toContain('פריט פיזי טרם הוזמן')
    expect(legend.textContent).toContain('או: משלוח שתאריכו המובטח עבר וטרם הגיע.')
    expect(legend.textContent).toContain('אינה נספרת — הסף נגזר מזמן ייצור של דפוס.')
  })

  // 🔬 בדיקת-המוטציה של צעד 2.3: **שינוי השורה ב-`params` משנה את מה שכתוב על המסך.**
  // אילו המספר היה נשאר קפוא בשתי המחרוזות, שני האתרים היו ממשיכים לומר "10" בעוד
  // הצבע עצמו נקבע לפי 5 — כלומר המסך היה מסביר את עצמו לא נכון, בלי שום שגיאה.
  it('🔬 סף 5 ב-`params` ⇒ המקרא **וגם** כיתוב-הגליף אומרים 5, לא 10', async () => {
    getParamValues.mockResolvedValue({ סף_לוגיסטיקה_ימי_עסקים: '5' })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')

    const legend = screen.getByText(/שורה בענבר/).closest('div')
    expect(legend.textContent).toContain('בתוך 5 ימי עסקים')
    expect(legend.textContent).not.toContain('בתוך 10 ימי עסקים')

    // ‏#107 הוא 8 ימי-עסקים ⇒ בסף 5 הוא כבר **אינו** בענבר, ולכן אין לו כיתוב-גליף
    // כלל: הצבע והכיתוב זזו יחד, וזה בדיוק מה שהבדיקה נועלת.
    expect(
      screen.queryByTitle('פריט פיזי טרם הוזמן, והאירוע בתוך 5 ימי עסקים'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTitle('פריט פיזי טרם הוזמן, והאירוע בתוך 10 ימי עסקים'),
    ).not.toBeInTheDocument()
  })

  // 🔬 והצד השני של אותה מוטציה: סף 12 **כן** מדליק את #107 (8 ימי-עסקים), והכיתוב
  // נושא 12. בלי הזוג הזה, הבדיקה שמעליי הייתה מתיישבת גם עם "הגליף פשוט נעלם תמיד".
  it('🔬 סף 12 ⇒ ‏#107 בענבר, וכיתוב-הגליף אומר 12', async () => {
    getParamValues.mockResolvedValue({ סף_לוגיסטיקה_ימי_עסקים: '12' })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-queue-table')

    const flagged = screen.getByTestId('logistics-row-107')
    expect(
      within(flagged).getByTitle('פריט פיזי טרם הוזמן, והאירוע בתוך 12 ימי עסקים'),
    ).toBeInTheDocument()
  })
})

describe('LogisticsPage — מצב ③: ריק אחרי גלולה', () => {
  it('המשפטים הנעולים + מונה חי + "נקי סינון" שבאמת מוציא ממצב-הריק', async () => {
    const data = board()
    const kept = new Set([105, 106])
    loadBoard({
      projects: data.projects.filter((p) => kept.has(p.project_id)),
      rows: data.rows.filter((r) => kept.has(r.project_id)),
    })
    render(<LogisticsPage />)

    expect(await screen.findByText('אין פרויקט התואם למסנן שבחרת.')).toBeInTheDocument()
    expect(screen.getByText('2 פרויקטים קיימים ואינם מוצגים כרגע.')).toBeInTheDocument()
    // 🚫 הפעולה הפוכה ממצב ② — ניקוי-סינון, לא ניסיון-חוזר.
    expect(screen.queryByRole('button', { name: 'נסי שוב' })).not.toBeInTheDocument()
    // ㉜ — לשון-נקבה בדריסת אתר-הקריאה.
    expect(screen.getByTestId('logistics-clear-filter').textContent).toBe('נקי סינון')

    fireEvent.click(screen.getByTestId('logistics-clear-filter'))
    expect(await screen.findByTestId('logistics-queue-table')).toBeInTheDocument()
    expect(queueOrder()).toEqual([105, 106])
  })

  it('סעיף-היציאה נשאר גלוי גם כשהתור ריק אחרי סינון', async () => {
    const data = board()
    const kept = new Set([105, 106])
    loadBoard({
      projects: data.projects.filter((p) => kept.has(p.project_id)),
      rows: data.rows.filter((r) => kept.has(r.project_id)),
    })
    render(<LogisticsPage />)
    await screen.findByTestId('logistics-empty-filtered')
    expect(screen.getByTestId('logistics-outbound-table')).toBeInTheDocument()
  })
})
