// בדיקות כרטיס-הגרף — **הגרף הראשון בריפו**, ולכן הן בודקות את **החוזה** (§⑤) ולא מראה.
//
// 🔑 **מה בדיקת-יחידה כאן יכולה ומה לא:** ‏`recharts` ממודמה (jsdom אינו מודד SVG, ו-
// `ResponsiveContainer` מקבל רוחב 0 בלי layout) ⇒ מה שנבדק כאן הוא **מה שנמסר ל-Recharts
// ומה שיושב סביבו**: עטיפת-ה-LTR, הכותרת מחוץ לה, טבלת-קורא-המסך, המקרא, ונתיב-המקלדת.
// 🔴 **ומה ש*חייב* להיבדק בדפדפן אמיתי ואינו כאן:** כיווניות בפועל, `orientation="right"`,
// ירושת-`dir` לטולטיפ. אלה הפריטים המסומנים ב-§⑤ ונבדקו בצעד 3.0ב בדפדפן — ר' הדיווח.

import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

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
  // 🔑 **`data-ticks` — איך בודקים `tickFormatter` דרך מוק שמסנן פונקציות:** ‏`sanitize`
  // זורק כל פונקציה (ובצדק — Fiber אינו ניתן להמרה), ולכן `tickFormatter` לא היה נראה
  // בבדיקה כלל. ⇒ המוק **מפעיל** אותו על שני ערכי-בדיקה ומוסר את התוצאה כמחרוזת.
  // ⚠️ תוספת בלבד: `data-props` לא השתנה, וכל הבדיקות הקיימות ממשיכות למדוד את מה שמדדו.
  const tickSamples = (formatter) =>
    typeof formatter === 'function' ? JSON.stringify([50, 600000].map(formatter)) : undefined
  const stub =
    (name) =>
    ({ children, ...props }) => (
      <div
        data-testid={`recharts-${name}`}
        data-props={JSON.stringify(sanitize(props))}
        data-ticks={tickSamples(props.tickFormatter)}
      >
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
import { EMPTY_AFTER_FILTER } from './reportsCopy'

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

  // 📐6 — קו-השוויון של מ17 (✏️ 24/09/2026: עמודות-רבעים במקום עקומה) הוא קו **אופקי** ב-25%.
  it('קו-ייחוס אופקי נמסר כ-y עם הערך, ולא כ-segment', () => {
    render(
      <ChartCard
        chart={{
          ...BAR_CHART,
          unit: 'percent',
          domain: [0, 100],
          refLines: [{ axis: 'y', value: 25, label: 'חלוקה שווה = 25%' }],
        }}
      />,
    )
    const refLine = screen.getByTestId('recharts-ReferenceLine')
    const ref = JSON.parse(refLine.dataset.props)
    expect(ref.y).toBe(25)
    expect(ref.segment).toBeUndefined()
    // 🔴 **התווית היא רכיב-ילד ולא `label={{…}}`** — נמדד בדפדפן 16/09/2026 שהצורה
    // האובייקטית אינה מרנדרת טקסט כלל ב-Recharts 3.10.1, וקו-השוויון נחת בלי שמו.
    const label = refLine.querySelector('[data-testid="recharts-Label"]')
    expect(label).not.toBeNull()
    expect(JSON.parse(label.dataset.props).value).toBe('חלוקה שווה = 25%')
  })
})

// ── 📐4 · תוויות-הציר ───────────────────────────────────────────────────────
//
// 🔴 **נמדד בדפדפן 16/09/2026:** בלי `tickFormatter` ‏Recharts מדפיס את הערך גולמי, והמסך
// הראה `600000` / `450000` במ7, `240000` במ12 ו-`100000` במ9. ‏`grep tickFormatter` = 0.

// תווי-הבידוד (LRI…PDI) מוסרים לפני ההשוואה — הם בלתי-נראים, וההשוואה כאן היא על הספרות.
const plainTicks = (element) =>
  JSON.parse(element.dataset.ticks).map((tick) => tick.replaceAll('⁦', '').replaceAll('⁩', ''))

describe('ChartCard — 📐4: ציר-הערך נושא tickFormatter', () => {
  it('ציר של כסף מקבל מפריד-אלפים, ובלי הגליף ₪ שהיה חוזר בכל תו-סימון', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(plainTicks(screen.getAllByTestId('recharts-YAxis')[0])).toEqual(['50', '600,000'])
  })

  it('ציר של אחוזים נושא % ולא .0', () => {
    render(
      <ChartCard
        chart={{ ...BAR_CHART, unit: 'percent', series: [{ key: 'revenue', label: 'שיעור' }] }}
      />,
    )
    expect(plainTicks(screen.getAllByTestId('recharts-YAxis')[0])[0]).toBe('50%')
  })

  it('ציר-ימין הנעול 0–100 נשאר אחוז, גם כשציר-שמאל הוא ₪', () => {
    render(
      <ChartCard
        chart={{
          ...BAR_CHART,
          unit: 'money',
          series: [
            { key: 'revenue', label: 'הכנסה', format: 'money' },
            { key: 'profit', label: 'שולי רווח', kind: 'line', axis: 'right', format: 'percent' },
          ],
        }}
      />,
    )
    const axes = screen.getAllByTestId('recharts-YAxis')
    expect(plainTicks(axes[0])).toEqual(['50', '600,000'])
    expect(plainTicks(axes[1])[0]).toBe('50%')
  })

  // ציר-קטגוריה אינו ציר-ערך — מספר-חודש אינו מקבל פסיקי-אלפים.
  it('ציר-הקטגוריה אינו מקבל מעצב-ערכים כלל', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(screen.getAllByTestId('recharts-XAxis')[0].dataset.ticks).toBeUndefined()
  })
})

// ── chart.layout: 'horizontal' — עמודות אופקיות ────────────────────────────

const REASONS_CHART = {
  type: 'bar',
  title: 'מה מכעיס',
  xKey: 'reason',
  layout: 'horizontal',
  unit: 'int',
  series: [{ key: 'n', label: 'משובים' }],
  data: [
    { reason: 'חוסר מקצועיות של הצוות', n: 7 },
    { reason: 'איחור', n: 5 },
  ],
}

describe('ChartCard — chart.layout: "horizontal"', () => {
  // 🔴 ‏`layout` לבדו כבר נמסר ל-Recharts, אבל בלי החלפת **סוגי-הצירים** הלוח יוצא ריק.
  it('הקטגוריה עוברת לציר-Y והערך ל-X', () => {
    render(<ChartCard chart={REASONS_CHART} />)
    expect(JSON.parse(screen.getByTestId('recharts-BarChart').dataset.props).layout).toBe(
      'vertical',
    )
    const yAxis = JSON.parse(screen.getAllByTestId('recharts-YAxis')[0].dataset.props)
    expect(yAxis.dataKey).toBe('reason')
    expect(yAxis.type).toBe('category')
    const xAxis = JSON.parse(screen.getAllByTestId('recharts-XAxis')[0].dataset.props)
    expect(xAxis.type).toBe('number')
    expect(xAxis.domain).toEqual([0, 'auto'])
  })

  // 📏 ציר-Y של Recharts קבוע ב-60px; תווית-סיבה עברית נחתכת שם בשקט.
  it('רוחב ציר-הקטגוריה נגזר מהתווית הארוכה ביותר, ומעל ברירת-המחדל', () => {
    render(<ChartCard chart={REASONS_CHART} />)
    const { width } = JSON.parse(screen.getAllByTestId('recharts-YAxis')[0].dataset.props)
    expect(width).toBeGreaterThan(60)
    expect(width).toBeLessThanOrEqual(190)
  })

  it('בלי layout הצירים נשארים כשהיו — הקטגוריה ב-X', () => {
    render(<ChartCard chart={{ ...REASONS_CHART, layout: undefined }} />)
    expect(JSON.parse(screen.getByTestId('recharts-BarChart').dataset.props).layout).toBe(
      'horizontal',
    )
    expect(JSON.parse(screen.getAllByTestId('recharts-XAxis')[0].dataset.props).dataKey).toBe(
      'reason',
    )
  })

  // טבלת-קורא-המסך אינה יודעת דבר על כיוון הציור — אותם נתונים בדיוק.
  it('טבלת-קורא-המסך אינה משתנה עם הכיוון', () => {
    render(<ChartCard chart={REASONS_CHART} />)
    expect(screen.getByRole('table')).toHaveTextContent('חוסר מקצועיות של הצוות')
  })
})

// ── 🚫 עמודה שספירתה 0 אינה דלת ────────────────────────────────────────────

const ZERO_CHART = {
  type: 'bar',
  title: 'אי-הגעה לפי מדרג',
  xKey: 'bucket',
  unit: 'int',
  series: [{ key: 'n', label: 'שורות' }],
  data: [
    { bucket: 'א', n: 4 },
    { bucket: 'ב', n: 0 },
  ],
}

describe('ChartCard — עמודה שספירתה 0 אינה נלחצת', () => {
  it('הכפתור בטבלת-קורא-המסך מנוטרל לעמודת-האפס בלבד', () => {
    render(<ChartCard chart={ZERO_CHART} onSelect={vi.fn()} />)
    expect(screen.getByTestId('chart-select-0')).toBeEnabled()
    expect(screen.getByTestId('chart-select-1')).toBeDisabled()
  })

  it('לחיצה על עמודת-האפס אינה מפעילה את הקרוס-פילטר', () => {
    const onSelect = vi.fn()
    render(<ChartCard chart={ZERO_CHART} onSelect={onSelect} />)
    screen.getByTestId('chart-select-1').click()
    expect(onSelect).not.toHaveBeenCalled()
    screen.getByTestId('chart-select-0').click()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  // 🔑 הסמן אומר את אותו דבר שהמקלדת אומרת — אחרת אחד משניהם משקר.
  it('התא של עמודת-האפס נושא cursor: not-allowed, והאחר pointer', () => {
    render(<ChartCard chart={ZERO_CHART} onSelect={vi.fn()} />)
    const cells = screen.getAllByTestId('recharts-Cell')
    expect(JSON.parse(cells[0].dataset.props).cursor).toBe('pointer')
    expect(JSON.parse(cells[1].dataset.props).cursor).toBe('not-allowed')
  })

  it('בלי קרוס-פילטר אין סמן כלל — אין מה להבטיח', () => {
    render(<ChartCard chart={ZERO_CHART} />)
    const cells = screen.getAllByTestId('recharts-Cell')
    expect(JSON.parse(cells[1].dataset.props).cursor).toBeUndefined()
  })

  // ⚠️ מוערם: קטגוריה ריקה היא זו שכל נדבכיה אפס, לא זו שנדבך אחד שלה אפס.
  it('בגרף מוערם — נדבך אחד ריק אינו מרוקן את הקטגוריה', () => {
    const onSelect = vi.fn()
    render(
      <ChartCard
        chart={{
          ...ZERO_CHART,
          type: 'stackedBar',
          series: [
            { key: 'n', label: 'א' },
            { key: 'm', label: 'ב' },
          ],
          data: [
            { bucket: 'א', n: 0, m: 3 },
            { bucket: 'ב', n: 0, m: 0 },
          ],
        }}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByTestId('chart-select-0')).toBeEnabled()
    expect(screen.getByTestId('chart-select-1')).toBeDisabled()
  })
})

// ── 📐10 · גרף שחזר בלי דאטה ────────────────────────────────────────────────
//
// 🔴 **נמדד 16/09/2026:** לחיצה אחת על גלולת "החודש" במ14 השאירה מסגרת ⁦260⁩px ריקה לגמרי,
// בלי מילה — ‏`ChartCard` לא היה בו ולו ענף אחד על אורך-הדאטה.

describe('ChartCard — 📐10: גרף ריק אומר זאת', () => {
  const EMPTY = { ...BAR_CHART, data: [] }

  it('כותרת + משפט-הריקות, ובלי מקרא/עטיפת-LTR/טבלה', () => {
    render(<ChartCard chart={EMPTY} />)
    expect(screen.getByRole('heading', { name: BAR_CHART.title })).toBeInTheDocument()
    expect(screen.getByTestId('chart-empty')).toHaveTextContent('אין נתונים בתקופה שנבחרה')
    // 🚫 שלושתם מתארים דאטה שאינה שם.
    expect(screen.queryByTestId('chart-figure')).toBeNull()
    expect(screen.queryByTestId('chart-legend')).toBeNull()
    expect(screen.queryByRole('table', { hidden: true })).toBeNull()
  })

  it('המשפט הוא אותו נוסח שהמעטפת אומרת, ולא ניסוח שני', () => {
    render(<ChartCard chart={EMPTY} />)
    expect(screen.getByTestId('chart-empty').textContent).toBe(EMPTY_AFTER_FILTER)
  })

  it('גרף עם דאטה אינו מציג אותו', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(screen.queryByTestId('chart-empty')).toBeNull()
    expect(screen.getByTestId('chart-figure')).toBeInTheDocument()
  })

  // ✏️ 17/09/2026 — כשהמסנן שרוקן הוא הלקוח, המעטפת מוסרת את משפט-הלקוח (כלל כ17), והגרף
  // אומר אותו ולא את משפט-התקופה — אחרת מסך אחד היה אומר שני משפטים על אותו מסנן.
  it('משפט-הריקות מגיע מהמעטפת כשהיא מוסרת אותו (מסנן-לקוח)', () => {
    render(<ChartCard chart={EMPTY} emptyText="אין נתונים ללקוח שנבחר" />)
    expect(screen.getByTestId('chart-empty').textContent).toBe('אין נתונים ללקוח שנבחר')
  })
})

// ── 📐20 · תאים לכל סדרת-עמודות ─────────────────────────────────────────────

describe('ChartCard — תאים נפלטים לכל סדרת-עמודות', () => {
  const TWO_YEARS = {
    ...BAR_CHART,
    data: [
      { period: 'אוגוסט', revenue: 46400, profit: 23200 },
      { period: 'ספטמבר', revenue: 30000, profit: 15000, is_today: true },
    ],
  }

  // 🔴 הפגם: ספטמבר יצא חלול-ומקווקו בשנה אחת מתוך שתיים, כי `<Cell>` נפלט רק ל-index 0.
  it('עמודת-"היום" מסומנת בשתי הסדרות, וכל אחת בגוון שלה', () => {
    render(<ChartCard chart={TWO_YEARS} />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells).toHaveLength(4)
    const dashed = cells.filter((c) => c.strokeDasharray === '4 2')
    expect(dashed).toHaveLength(2)
    // הסדרה השנייה מקבלת את **המתאר שלה**, לא את זה של הראשונה.
    expect(dashed.map((c) => c.stroke)).toEqual(['#009689', '#62748E'])
  })

  it('העמעום של הסינון-הצולב חל גם על הסדרה השנייה', () => {
    render(<ChartCard chart={TWO_YEARS} selected="ספטמבר" />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells.filter((c) => c.fill === '#CAD5E2')).toHaveLength(2)
  })

  // 🚫 `over_threshold` הוא דגל על **המדד** של השורה, לא על כל סדרותיה: צביעת "אשתקד"
  // באדום כי **השנה** חצתה סף היא קביעה שהמטען לא עשה.
  it('אדום-מעל-סף נשאר על הסדרה הראשונה בלבד', () => {
    render(<ChartCard chart={BAR_CHART} />)
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    expect(cells.filter((c) => c.fill === '#E7000B')).toHaveLength(1)
  })
})

// ── פיזור: אותו תחום לשני הצירים, ו-x_domain של השרת ───────────────────────

const SCATTER = {
  type: 'scatter',
  title: 'צפי מול בפועל',
  xKey: 'estimated',
  unit: 'int',
  domain: [0, 630],
  series: [
    { key: 'estimated', label: 'צפי' },
    { key: 'actual', label: 'בפועל' },
  ],
  data: [{ estimated: 100, actual: 120 }],
}

describe('ChartCard — פיזור: תחום הציר', () => {
  const axes = (name) =>
    screen.getAllByTestId(`recharts-${name}`).map((n) => JSON.parse(n.dataset.props))

  // 🔴 נמדד: `domain:[0,630]` הוגש ל-Y בלבד, ציר-X נגזר מהדאטה (מקסימום ⁦600⁩), הקצה של
  // האלכסון נפל מחוץ לתחום ו-Recharts השליך את הקטע — האלכסון פשוט לא צויר.
  it('בהיעדר x_domain שני הצירים מקבלים את אותו תחום', () => {
    render(<ChartCard chart={SCATTER} />)
    expect(axes('XAxis')[0].domain).toEqual([0, 630])
    expect(axes('YAxis')[0].domain).toEqual([0, 630])
  })

  // ✏️ חריג-📐5 המוצהר: ציר של **שיעור** (תעריף שעתי ⁦41⁩–⁦49⁩ ₪) אינו חייב להתחיל באפס.
  it('x_domain של השרת גובר על תחום-ציר-Y, ואינו נוגע ב-Y', () => {
    render(<ChartCard chart={{ ...SCATTER, x_domain: [40, 50] }} />)
    expect(axes('XAxis')[0].domain).toEqual([40, 50])
    expect(axes('YAxis')[0].domain).toEqual([0, 630])
  })
})

// ── שתי נקודות-ההרחבה של כרטיס-הגרף ────────────────────────────────────────

describe('ChartCard — aside · footer', () => {
  it('אריח-הצד יושב בתוך הכרטיס, לצד הגרף', () => {
    render(<ChartCard chart={BAR_CHART} aside={<span>שוטף</span>} />)
    const aside = screen.getByTestId('chart-aside')
    expect(aside).toHaveTextContent('שוטף')
    // 🔑 **בתוך** הכרטיס — זה בדיוק מה שהכרטיס מעגן ומה שלא היה אפשרי קודם.
    expect(screen.getByTestId('chart-card-bar').contains(aside)).toBe(true)
  })

  it('הכיתוב-התחתון יושב מתחת לגרף ומעל שורת-"אז מה"', () => {
    render(<ChartCard chart={BAR_CHART} footer={<span>איך לקרוא</span>} soWhat="לפעול" />)
    const footer = screen.getByTestId('chart-footer')
    const soWhat = screen.getByTestId('chart-so-what')
    expect(screen.getByTestId('chart-figure').compareDocumentPosition(footer)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(footer.compareDocumentPosition(soWhat)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  // ⚠️ הכיתוב מסביר **איך לקרוא** — ולכן נשאר גם כשאין מה לקרוא.
  it('הכיתוב-התחתון מוצג גם בגרף ריק, והאריח לא', () => {
    render(
      <ChartCard
        chart={{ ...BAR_CHART, data: [] }}
        aside={<span>צד</span>}
        footer={<span>הסבר</span>}
      />,
    )
    expect(screen.getByTestId('chart-footer')).toBeInTheDocument()
    expect(screen.queryByTestId('chart-aside')).toBeNull()
  })

  it('בלי שתיהן אין צמתים ריקים', () => {
    render(<ChartCard chart={BAR_CHART} />)
    expect(screen.queryByTestId('chart-aside')).toBeNull()
    expect(screen.queryByTestId('chart-footer')).toBeNull()
  })
})

// ── טבלת-קורא-המסך: פרישה כשכבה, לא בזרימה ────────────────────────────────
//
// 🔴 **נמדד ע"י סוכן-ה-E2E:** ‏`not-sr-only` החזיר אותה לזרימה, פרישתה דחפה למטה את הצ'יפ
// *"× נקי בחירה"*, ולחיצת-עכבר עליו **לא ירתה `click` כלל** — הדף זז בין mousedown ל-mouseup.

describe('ChartCard — טבלת-קורא-המסך נפרשת כשכבה', () => {
  it('במצב סגור היא sr-only, ובפוקוס היא absolute ולא בזרימה', () => {
    render(<ChartCard chart={BAR_CHART} onSelect={vi.fn()} />)
    const table = screen.getByTestId('chart-sr-table')
    expect(table.className).toBe('sr-only')

    fireEvent.focus(screen.getByTestId('chart-select-0'), { bubbles: true })
    expect(table.className).toContain('absolute')
    expect(table.className).not.toContain('sr-only')
  })

  it('מעבר-פוקוס בתוך הטבלה אינו מקפל אותה', () => {
    render(<ChartCard chart={BAR_CHART} onSelect={vi.fn()} />)
    const table = screen.getByTestId('chart-sr-table')
    const first = screen.getByTestId('chart-select-0')
    const second = screen.getByTestId('chart-select-1')
    fireEvent.focus(first)
    fireEvent.blur(first, { relatedTarget: second })
    expect(table.className).toContain('absolute')
  })

  it('יציאה החוצה מקפלת אותה חזרה', () => {
    render(<ChartCard chart={BAR_CHART} onSelect={vi.fn()} />)
    const table = screen.getByTestId('chart-sr-table')
    const first = screen.getByTestId('chart-select-0')
    fireEvent.focus(first)
    fireEvent.blur(first, { relatedTarget: document.body })
    expect(table.className).toBe('sr-only')
  })
})
