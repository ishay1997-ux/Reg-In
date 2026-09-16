// בדיקות כרטיס-הגרף — **הגרף הראשון בריפו**, ולכן הן בודקות את **החוזה** (§⑤) ולא מראה.
//
// 🔑 **מה בדיקת-יחידה כאן יכולה ומה לא:** ‏`recharts` ממודמה (jsdom אינו מודד SVG, ו-
// `ResponsiveContainer` מקבל רוחב 0 בלי layout) ⇒ מה שנבדק כאן הוא **מה שנמסר ל-Recharts
// ומה שיושב סביבו**: עטיפת-ה-LTR, הכותרת מחוץ לה, טבלת-קורא-המסך, המקרא, ונתיב-המקלדת.
// 🔴 **ומה ש*חייב* להיבדק בדפדפן אמיתי ואינו כאן:** כיווניות בפועל, `orientation="right"`,
// ירושת-`dir` לטולטיפ. אלה הפריטים המסומנים ב-§⑤ ונבדקו בצעד 3.0ב בדפדפן — ר' הדיווח.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ⚠️ המוק מחזיר אלמנטים אמיתיים ולא `null`, כדי שנוכל לאמת שהילדים אכן נמסרו לגרף.
vi.mock('recharts', () => {
  // ⚠️ פרופים של Recharts נושאים גם צמתי-React (`label`, `content`, `tick`) — ‏`JSON.stringify`
  // עליהם נופל על מבנה מעגלי (Fiber). ⇒ מסננים לכל מה שאינו ניתן-להמרה, פר-מפתח.
  const serializable = (value) => {
    try {
      JSON.stringify(value)
      return typeof value !== 'function' && !(value && value.$$typeof)
    } catch {
      return false
    }
  }
  const sanitize = (props) =>
    Object.fromEntries(Object.entries(props).filter(([, v]) => serializable(v)))
  const stub =
    (name) =>
    ({ children, ...props }) => (
      <div data-testid={`recharts-${name}`} data-props={JSON.stringify(sanitize(props))}>
        {children}
      </div>
    )
  return {
    Bar: stub('Bar'),
    BarChart: stub('BarChart'),
    CartesianGrid: stub('CartesianGrid'),
    Cell: stub('Cell'),
    ComposedChart: stub('ComposedChart'),
    Label: stub('Label'),
    Line: stub('Line'),
    LineChart: stub('LineChart'),
    ReferenceLine: stub('ReferenceLine'),
    ResponsiveContainer: stub('ResponsiveContainer'),
    Scatter: stub('Scatter'),
    ScatterChart: stub('ScatterChart'),
    Tooltip: stub('Tooltip'),
    XAxis: stub('XAxis'),
    YAxis: stub('YAxis'),
    ZAxis: stub('ZAxis'),
  }
})

import ChartCard from './ChartCard'

const BAR_CHART = {
  type: 'bar',
  title: 'הכנסה ורווח לפי חודש',
  xKey: 'period',
  unit: 'money',
  series: [
    { key: 'revenue', label: 'הכנסה' },
    { key: 'profit', label: 'רווח' },
  ],
  data: [
    { period: 'ינואר', revenue: 46400, profit: 23200 },
    { period: 'פברואר', revenue: 57500, profit: 28750, over_threshold: true },
  ],
}

describe('ChartCard — חוזה §⑤', () => {
  it('§⑤ #1 — עטיפת dir="ltr" סביב ResponsiveContainer, ולא על הגרף עצמו', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const figure = screen.getByTestId('chart-figure')
    expect(figure).toHaveAttribute('dir', 'ltr')
    expect(figure.querySelector('[data-testid="recharts-ResponsiveContainer"]')).not.toBeNull()
    // הגרף עצמו אינו נושא dir — זה בדיוק מה ש-Issues #263/#682/#4214 אומרים שלא עובד.
    expect(screen.getByTestId('recharts-BarChart')).not.toHaveAttribute('dir')
  })

  it('§⑤ #8 — גובה מפורש על ההורה, אחרת הגרף מקבל height=0 ואינו מצייר', () => {
    render(<ChartCard chart={BAR_CHART} height={300} />)
    expect(screen.getByTestId('chart-figure')).toHaveStyle({ height: '300px' })
  })

  it('§⑤ #2 — הכותרת העברית יושבת מחוץ לעטיפת-ה-LTR', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const heading = screen.getByRole('heading', { name: 'הכנסה ורווח לפי חודש' })
    expect(screen.getByTestId('chart-figure').contains(heading)).toBe(false)
  })

  it('§⑤ #5/#6 — accessibilityLayer דלוק, ו-role="figure" עם aria-label', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const figure = screen.getByTestId('chart-figure')
    expect(figure).toHaveAttribute('role', 'figure')
    expect(figure).toHaveAttribute('aria-label', 'הכנסה ורווח לפי חודש, גרף')
    const props = JSON.parse(screen.getByTestId('recharts-BarChart').dataset.props)
    expect(props.accessibilityLayer).toBe(true)
  })

  // 🔴 הבדיקה המרכזית של הנגישות: Recharts מרנדר SVG שקורא-מסך אינו מפרש כטבלה, ואין
  // fallback מובנה בספרייה. הטבלה הזו **היא** הנתון עבור קורא-המסך.
  it('§⑤ #6 — טבלת-קורא-מסך מקבילה, עם אותם נתונים ועם scope', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const table = screen.getByRole('table', { hidden: true })
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(3)
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(table.textContent).toContain('ינואר')
    // הערכים מעוצבים לפי 📐4 גם בטבלה — אותו מספר בשני מקומות, אותו עיגול.
    expect(table.textContent).toContain('46,400 ₪')
  })

  // 🔬 המדידה של 16/09/2026 (ΔE 11.5 בראייה תקינה בין טורקיז לסלייט) הופכת את המקרא
  // מרשות לחובה — ר' הערת-הכותרת של הרכיב.
  it('סדרה שנייה מחייבת מקרא, וסדרה יחידה אינה', () => {
    const { rerender } = render(<ChartCard chart={BAR_CHART} />)
    expect(screen.getByTestId('chart-legend').textContent).toContain('רווח')
    rerender(<ChartCard chart={{ ...BAR_CHART, series: [BAR_CHART.series[0]] }} />)
    expect(screen.queryByTestId('chart-legend')).toBeNull()
  })

  // §⑤ #7 — `onClick` על Bar אינו הופך לניתן-להפעלה במקלדת. זה נתיב-ההפעלה שנבנה במקומו.
  it('§⑤ #7 — לקרוס-פילטר יש נתיב-מקלדת אמיתי (כפתור בטבלה), לא רק onClick על העמודה', () => {
    const onSelect = vi.fn()
    render(<ChartCard chart={BAR_CHART} onSelect={onSelect} />)
    const button = screen.getByTestId('chart-select-0')
    expect(button.tagName).toBe('BUTTON')
    button.click()
    expect(onSelect).toHaveBeenCalledWith(BAR_CHART.data[0], 0)
  })

  it('בלי onSelect אין כפתורים — דף בלי קרוס-פילטר אינו מציע אחד', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  it('📐23 — שורת-"אז מה" מוצגת כשנמסרה, ואינה נוצרת כשלא', () => {
    const { rerender } = render(<ChartCard chart={BAR_CHART} soWhat="לגבות השבוע משלושה לקוחות" />)
    expect(screen.getByTestId('chart-so-what').textContent).toBe('לגבות השבוע משלושה לקוחות')
    rerender(<ChartCard chart={BAR_CHART} />)
    expect(screen.queryByTestId('chart-so-what')).toBeNull()
  })

  it('גרף חסר ⇒ null, והמסך אינו נופל', () => {
    const { container } = render(<ChartCard chart={null} />)
    expect(container.firstChild).toBeNull()
  })
})

// 🔴 **הפגם שהמדידה תפסה 16/09/2026:** ‏`BarBody` צייר כל סדרה כעמודה על ציר-ה-₪ היחיד,
// ולכן קו-שולי-הרווח של מ3 (**אחוזים**, ~55) נחת כעמודה שלישית ליד עמודות של 1.9 מיליון ₪.
describe('ChartCard — סדרה מעורבת (series[].kind · series[].axis)', () => {
  // 🌱 שלוש הסדרות של מ3, מילה-במילה מהמטען החי (`report_m03_trends`, 16/09/2026).
  const MIXED = {
    type: 'bar',
    title: 'הכנסה ושולי-רווח לפי שנה',
    xKey: 'year',
    unit: 'money',
    series: [
      { key: 'revenue', label: 'הכנסה', kind: 'bar', axis: 'left', format: 'money' },
      { key: 'revenue_prev', label: 'הכנסה אשתקד', kind: 'bar', axis: 'left', format: 'money' },
      { key: 'margin', label: 'שולי-רווח', kind: 'line', axis: 'right', format: 'percent' },
    ],
    data: [
      { year: 2024, revenue: 1385815, revenue_prev: 1100000, margin: 55.9 },
      { year: 2025, revenue: 1922441, revenue_prev: 1385815, margin: 58.3 },
    ],
  }

  it('סדרת kind:"line" מצוירת כקו ולא כעמודה שלישית', () => {
    render(<ChartCard chart={MIXED} />)
    expect(screen.getByTestId('recharts-ComposedChart')).toBeInTheDocument()
    expect(screen.queryByTestId('recharts-BarChart')).toBeNull()
    expect(screen.getAllByTestId('recharts-Bar')).toHaveLength(2)
    const line = screen.getByTestId('recharts-Line')
    expect(JSON.parse(line.dataset.props).dataKey).toBe('margin')
  })

  // 📐6 — ציר-אחוזים נעול 0–100; בלי זה הקו היה נמדד מול טווח-ה-₪ ונראה שטוח.
  it('axis:"right" מייצר ציר-ימני נעול 0–100, והקו יושב עליו', () => {
    render(<ChartCard chart={MIXED} />)
    const axes = screen.getAllByTestId('recharts-YAxis').map((n) => JSON.parse(n.dataset.props))
    const right = axes.find((a) => a.orientation === 'right')
    expect(right.domain).toEqual([0, 100])
    expect(right.yAxisId).toBe('right')
    expect(JSON.parse(screen.getByTestId('recharts-Line').dataset.props).yAxisId).toBe('right')
    const bars = screen.getAllByTestId('recharts-Bar').map((n) => JSON.parse(n.dataset.props))
    expect(bars.every((b) => b.yAxisId === 'left')).toBe(true)
  })

  it('בלי axis:"right" נשאר ציר אחד, והכול עליו', () => {
    const leftOnly = {
      ...MIXED,
      series: MIXED.series.map((s) => ({ ...s, axis: 'left', format: 'money' })),
    }
    render(<ChartCard chart={leftOnly} />)
    const axes = screen.getAllByTestId('recharts-YAxis').map((n) => JSON.parse(n.dataset.props))
    expect(axes.filter((a) => a.orientation === 'right')).toHaveLength(0)
  })

  // ⚠️ הטולטיפ מעצב פר-סדרה: ₪ לעמודות, % לקו — אותו לוח, שתי יחידות.
  it('כל סדרה נושאת את הפורמט שלה כ-unit, לטולטיפ', () => {
    render(<ChartCard chart={MIXED} />)
    expect(JSON.parse(screen.getByTestId('recharts-Line').dataset.props).unit).toBe('percent')
    const bars = screen.getAllByTestId('recharts-Bar').map((n) => JSON.parse(n.dataset.props))
    expect(bars.map((b) => b.unit)).toEqual(['money', 'money'])
  })

  it('סדרות שכולן קו נשארות LineChart — הפיצול נקבע בערבוב, לא ב-kind לבדו', () => {
    const allLines = {
      ...MIXED,
      type: 'line',
      series: MIXED.series.map((s) => ({ ...s, kind: 'line', axis: 'left' })),
    }
    render(<ChartCard chart={allLines} />)
    expect(screen.getByTestId('recharts-LineChart')).toBeInTheDocument()
    expect(screen.queryByTestId('recharts-ComposedChart')).toBeNull()
  })

  // פארטו **הוא** הלוח המעורב, עם `kind`/`axis` שנגזרים ולא מוצהרים במטען (§5.2ב).
  it('פארטו נגזר לאותו שלד: עמודה אחת שמאלה וקו מצטבר על ציר ימני נעול', () => {
    render(<ChartCard chart={{ ...MIXED, type: 'pareto' }} />)
    expect(screen.getAllByTestId('recharts-Bar')).toHaveLength(1)
    const axes = screen.getAllByTestId('recharts-YAxis').map((n) => JSON.parse(n.dataset.props))
    expect(axes.find((a) => a.orientation === 'right').domain).toEqual([0, 100])
    const lines = screen.getAllByTestId('recharts-Line').map((n) => JSON.parse(n.dataset.props))
    expect(lines.every((l) => l.yAxisId === 'right')).toBe(true)
  })
})

describe('ChartCard — 📐20: עמודת-"היום" חלולה ומקווקוות', () => {
  const TODAY_CHART = {
    ...BAR_CHART,
    series: [BAR_CHART.series[0]],
    data: [
      { period: 'ינואר', revenue: 46400 },
      { period: 'ספטמבר', revenue: 25000, is_today: true },
    ],
  }

  it('רק העמודה שסומנה is_today מקבלת מתאר מקווקו', () => {
    render(<ChartCard chart={TODAY_CHART} />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells[0].strokeDasharray).toBeUndefined()
    expect(cells[1].strokeDasharray).toBe('4 2')
    expect(cells[1].fillOpacity).toBe(0.55)
  })

  // 🚫 הסימון הוא **צורה**, לא גוון — 📐19 נועל גוון למשמעות אחת, וכאן היא כבר תפוסה.
  it('הסימון אינו משנה את הגוון של העמודה', () => {
    render(<ChartCard chart={TODAY_CHART} />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells[1].fill).toBe(cells[0].fill)
  })
})

describe('ChartCard — הכרעה 15-ד: העמודה הנבחרת מסומנת', () => {
  // 🔴 בלי זה הסינון-הצולב חסר את חצי-המשוב שלו: הטבלה מתכווצת, והגרף נראה כמו קודם.
  it('העמודה הנבחרת נשארת טורקיז והשאר יורדות ל-slate-300', () => {
    render(<ChartCard chart={BAR_CHART} selected="פברואר" />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells[0].fill).toBe('#CAD5E2')
    // ⚠️ הנבחרת שומרת על הגוון שלה — כאן היא גם חוצת-סף, ולכן אדומה (§④).
    expect(cells[1].fill).toBe('#E7000B')
  })

  it('בלי בחירה אף עמודה אינה מעומעמת', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells.some((c) => c.fill === '#CAD5E2')).toBe(false)
  })
})

describe('ChartCard — 📑ב#10: ערוץ-הצורה בפיזור', () => {
  const SCATTER = {
    type: 'scatter',
    title: 'קהל מול צוות',
    xKey: 'estimated',
    series: [
      { key: 'estimated', label: 'הערכה' },
      { key: 'actual', label: 'בפועל' },
    ],
    data: [
      { estimated: 100, actual: 140, above: true },
      { estimated: 200, actual: 180, above: false },
      { estimated: 300, actual: 320, above: true },
    ],
  }

  it('בלי shape_key — סדרה אחת, נקודה רגילה (התנהגות קודמת נשמרת)', () => {
    render(<ChartCard chart={SCATTER} />)
    const scatters = screen.getAllByTestId('recharts-Scatter')
    expect(scatters).toHaveLength(1)
    expect(JSON.parse(scatters[0].dataset.props).shape).toBeUndefined()
  })

  it('shape_key מפצל למשולש ולעיגול-חלול, ומחלק את הנקודות נכון', () => {
    render(<ChartCard chart={{ ...SCATTER, shape_key: 'above' }} />)
    const props = screen.getAllByTestId('recharts-Scatter').map((n) => JSON.parse(n.dataset.props))
    const triangle = props.find((p) => p.shape === 'triangle')
    const circle = props.find((p) => p.shape === 'circle')
    expect(triangle.data).toHaveLength(2)
    expect(circle.data).toHaveLength(1)
    // עיגול **חלול**: מתאר בלבד — ההבחנה בצורה, לא בכמות-הדיו ולא בגוון.
    expect(circle.fill).toBe('none')
    expect(circle.stroke).toBe(triangle.fill)
  })

  it('המקרא מסביר את שתי הצורות, ונוסח מהמטען דורס את נוסח-הגיבוי', () => {
    const { rerender } = render(<ChartCard chart={{ ...SCATTER, shape_key: 'above' }} />)
    expect(screen.getByTestId('chart-shape-legend')).toHaveTextContent('מעל קו-הייחוס')
    rerender(
      <ChartCard
        chart={{
          ...SCATTER,
          shape_key: 'above',
          shape_labels: { on: 'הגיעו יותר מהצפי', off: 'כצפי או פחות' },
        }}
      />,
    )
    expect(screen.getByTestId('chart-shape-legend')).toHaveTextContent('הגיעו יותר מהצפי')
  })

  it('בלי shape_key אין מקרא-צורות כלל', () => {
    render(<ChartCard chart={SCATTER} />)
    expect(screen.queryByTestId('chart-shape-legend')).toBeNull()
  })
})

describe('ChartCard — chart.note', () => {
  it('שורת-הפירוש מוצגת מתחת לכותרת כשהמטען נתן אותה', () => {
    const note = 'כל עמודה היא דלי של איחור — כמה ימים עברו מאז מועד הפירעון.'
    render(<ChartCard chart={{ ...BAR_CHART, note }} />)
    const noteNode = screen.getByTestId('chart-note')
    expect(noteNode).toHaveTextContent(note)
    const heading = screen.getByRole('heading', { name: BAR_CHART.title })
    expect(
      heading.compareDocumentPosition(noteNode) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('בלי note אין שורה ריקה', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(screen.queryByTestId('chart-note')).toBeNull()
  })
})

describe('ChartCard — 📐5/📐6: ציר מאפס וקווי-ייחוס', () => {
  it('בלי domain מה-RPC — הציר מתחיל באפס ואינו נקטע', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const yAxis = JSON.parse(screen.getAllByTestId('recharts-YAxis')[0].dataset.props)
    expect(yAxis.domain).toEqual([0, 'auto'])
  })

  it('domain שהוכרע בשרת (0–100 למצטבר) נשמר כפי-שהוא', () => {
    render(<ChartCard chart={{ ...BAR_CHART, domain: [0, 100] }} />)
    const yAxis = JSON.parse(screen.getAllByTestId('recharts-YAxis')[0].dataset.props)
    expect(yAxis.domain).toEqual([0, 100])
  })

  // 📐6 — קו-השוויון בלורנץ הוא אלכסון 1:1. `y=` הוא אופקי בלבד ולא היה מצייר אותו.
  it('קו-ייחוס אלכסוני נמסר כ-segment ולא כ-y', () => {
    render(
      <ChartCard
        chart={{
          ...BAR_CHART,
          type: 'lorenz',
          refLines: [{ axis: 'diagonal', label: 'חלוקה שווה' }],
        }}
      />,
    )
    const refLine = screen.getByTestId('recharts-ReferenceLine')
    const ref = JSON.parse(refLine.dataset.props)
    expect(ref.segment).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ])
    // 🔴 **התווית היא רכיב-ילד ולא `label={{…}}`** — נמדד בדפדפן 16/09/2026 שהצורה
    // האובייקטית אינה מרנדרת טקסט כלל ב-Recharts 3.10.1, וקו-השוויון נחת בלי שמו.
    const label = refLine.querySelector('[data-testid="recharts-Label"]')
    expect(label).not.toBeNull()
    expect(JSON.parse(label.dataset.props).value).toBe('חלוקה שווה')
  })
})
