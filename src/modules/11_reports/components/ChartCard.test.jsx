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
