// בדיקות-רכיב ל-`ReportSurface` — נקודות-ההרחבה של בוני-הלשוניות ו-`meta.extra_tables`.
// ‏`callReport` ממוקם: הרכיב לעולם אינו פונה לרשת כאן; `recharts` ממוקם כי jsdom אינו מרנדר SVG.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
// ⚠️ מוק-recharts שמרנדר (ולא `{}`) — בלעדיו כל בדיקה שיש בה גרף נופלת על "Element type is
// invalid". הוא גם מה שמאפשר לבדוק את **נתיב-המקלדת** של הקרוס-פילטר: הכפתורים יושבים
// בטבלת-קורא-המסך של `ChartCard`, שהיא DOM רגיל ואינה עוברת דרך הספרייה.
vi.mock('recharts', () => {
  // ✨ `data-props` נוסף 16/09/2026: בלעדיו אי-אפשר למדוד **מה מסומן על הגרף**
  // (הדלי הפתוח בדף-דריל). פונקציות וצמתי-React מסוננים — `JSON.stringify` על Fiber נופל.
  const serializable = (value) => {
    try {
      JSON.stringify(value)
      return typeof value !== 'function' && !(value && value.$$typeof)
    } catch {
      return false
    }
  }
  const stub =
    (name) =>
    ({ children, ...props }) => (
      <div
        data-testid={`recharts-${name}`}
        data-props={JSON.stringify(
          Object.fromEntries(Object.entries(props).filter(([, v]) => serializable(v))),
        )}
      >
        {children}
      </div>
    )
  const names = `Bar BarChart CartesianGrid Cell ComposedChart Label Line LineChart ReferenceLine
    ResponsiveContainer Scatter ScatterChart Tooltip XAxis YAxis ZAxis`.split(/\s+/)
  return Object.fromEntries(names.map((name) => [name, stub(name)]))
})
const callReport = vi.fn()
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, callReport: (...a) => callReport(...a) }
})

import ReportSurface from './ReportSurface'

const surface = {
  id: 'm15',
  slug: 'reliability',
  rpc: 'report_m15_reliability',
  name: 'אמינות',
  drill: false,
}
const filters = { from: null, to: null, customerId: null, windowLabel: '', isFiltered: false }

function payload(extra = {}) {
  return {
    population: { label: 'אוכלוסייה: 106 דיילות', n: 106 },
    window: { from: null, to: null, label: 'חלון' },
    tiles: [{ key: 'a', label: 'אריח', value: 5, format: 'int', compare: null }],
    chart: null,
    columns: [
      { key: 'name', label: 'שם', format: 'text' },
      { key: 'rating', label: 'דירוג', format: 'int', sorted: 'descending' },
    ],
    rows: [
      { row_key: 1, name: 'א', rating: 5 },
      { row_key: 2, name: 'ב', rating: null },
    ],
    so_what: null,
    definitions: null,
    drill: null,
    meta: {},
    ...extra,
  }
}

describe('ReportSurface — extension slots', () => {
  it('renders the slots with the transformed payload, in document order', async () => {
    callReport.mockResolvedValueOnce(payload())
    const transformPayload = (p) => ({ ...p, rows: p.rows.filter((r) => r.rating == null) })
    render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={() => {}}
        transformPayload={transformPayload}
        renderTop={(p) => <p data-testid="slot-top">top {p.rows.length}</p>}
        renderBeforeTable={(p) => <p data-testid="slot-table">table {p.rows.length}</p>}
        renderExtras={(p) => <p data-testid="slot-extras">extras {p.rows.length}</p>}
      />,
    )
    expect(await screen.findByTestId('slot-top')).toHaveTextContent('top 1')
    expect(screen.getByTestId('slot-table')).toHaveTextContent('table 1')
    expect(screen.getByTestId('slot-extras')).toHaveTextContent('extras 1')
    // הפאג'ר סופר את מה שהטבלה מציגה (📐8) — אחרי הסינון של הלשונית.
    expect(screen.getAllByTestId('report-row')).toHaveLength(1)
    // 📐9 — `columns[].sorted` הופך ל-`aria-sort` על העמודה הממוינת בלבד.
    const headers = screen.getAllByRole('columnheader')
    expect(headers[1]).toHaveAttribute('aria-sort', 'descending')
    expect(headers[0]).not.toHaveAttribute('aria-sort')
    const order = [
      'slot-top',
      'report-population',
      'slot-table',
      'report-table-card',
      'slot-extras',
    ]
    const all = Array.from(document.body.querySelectorAll('[data-testid]'))
    const positions = order.map((id) => all.indexOf(screen.getByTestId(id)))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('renders every meta.extra_tables entry through ReportTable with its own title', async () => {
    callReport.mockResolvedValueOnce(
      payload({
        meta: {
          extra_tables: [
            {
              title: 'אי-הגעה לפי דירוג',
              sort: { key: 'rating', direction: 'ascending' },
              columns: [
                { key: 'rating', label: 'דירוג', format: 'int' },
                { key: 'm12', label: '12 חודשים', format: 'percent' },
              ],
              rows: [
                { row_key: 3, rating: 3, m12: 6.5 },
                { row_key: 4, rating: 4, m12: 2.8 },
              ],
            },
          ],
        },
      }),
    )
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={() => {}} />)
    const extra = await screen.findByTestId('report-extra-table')
    expect(within(extra).getByRole('heading', { level: 3 })).toHaveTextContent('אי-הגעה לפי דירוג')
    expect(within(extra).getAllByTestId('report-row')).toHaveLength(2)
    // ‏`table.sort` של ה-RPC מנצח את `columns[].sorted` — אחרת אין `aria-sort` על טבלה נוספת.
    expect(within(extra).getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'ascending')
  })

  it('does not run transformPayload on a failed load and keeps the error envelope', async () => {
    callReport.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 'XX000' }))
    const transformPayload = vi.fn((p) => p)
    render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={() => {}}
        transformPayload={transformPayload}
      />,
    )
    expect(await screen.findByText('נסי שוב')).toBeInTheDocument()
    expect(transformPayload).not.toHaveBeenCalled()
  })
})

// ── הכרעה 19 · דלתות-שורה בכל משטח, לא רק בדפי-דריל ─────────────────────────

describe('ReportSurface — הכרעה 19: השורה כולה היא הדלת', () => {
  const doorRows = [
    { row_key: 1, name: 'א', rating: 5, drill_key: { kind: 'hostess', id: 449 } },
    { row_key: 2, name: 'ב', rating: 4, drill_key: { kind: 'hostess', id: 450 } },
  ]

  it('משטח שאינו דוח-דריל פותח את שורותיו כשיש להן drill_key', async () => {
    callReport.mockResolvedValueOnce(payload({ rows: doorRows }))
    const onDrill = vi.fn()
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={onDrill} />)
    const rows = await screen.findAllByTestId('report-row-drillable')
    expect(rows).toHaveLength(2)
    rows[0].click()
    expect(onDrill).toHaveBeenCalledWith({ kind: 'hostess', id: 449 }, doorRows[0])
  })

  // 🔴 `cards-finance ⑧12.1`: יעד-הקידוח של ה-sku אינו מסך קיים ⇒ **אין דלת**, ולא
  // שורה שנראית לחיצה ואינה מובילה לשום מקום.
  it('drill_key שאין לו מסך (sku) אינו הופך את השורה ללחיצה', async () => {
    callReport.mockResolvedValueOnce(
      payload({ rows: [{ row_key: 3, name: 'ג', rating: 3, drill_key: { sku: 'B-SAT-LAN' } }] }),
    )
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    await screen.findByTestId('report-table-card')
    expect(screen.queryAllByTestId('report-row-drillable')).toHaveLength(0)
    expect(screen.getAllByTestId('report-row')).toHaveLength(1)
  })

  // 📐13① — הפירורים נשארים דריל-בלבד; דלת-שורה אינה הופכת משטח לדוח-דריל.
  it('דלתות-שורה אינן מציירות פירורי-לחם', async () => {
    callReport.mockResolvedValueOnce(
      payload({
        rows: doorRows,
        drill: { level: 0, crumbs: [{ label: 'הכול' }, { label: 'שנייה' }] },
      }),
    )
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    await screen.findAllByTestId('report-row-drillable')
    expect(screen.queryByTestId('report-crumbs')).toBeNull()
  })
})

// ── 📐23 · סדר "אז מה" ⇐ המוקאפ המאושר ──────────────────────────────────────

describe('ReportSurface — 📐23: שורת-"אז מה" מעל האריחים', () => {
  it('נמדד על 19 דפי-המוקאפ: so_what לפני האריחים, בסדר-המסמך', async () => {
    callReport.mockResolvedValueOnce(payload({ so_what: 'להתקשר השבוע לשלוש דיילות' }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    const soWhat = await screen.findByTestId('report-so-what')
    const tiles = screen.getByTestId('report-tiles')
    expect(soWhat.compareDocumentPosition(tiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

// ── 📐8 · תקרת-השורות מוצהרת ────────────────────────────────────────────────

describe('ReportSurface — 📐8: הצהרת תקרת-השורות', () => {
  it('row_total גדול ממספר השורות ⇒ שורה שאומרת זאת', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { row_total: 241 } }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    // 🔤 הנוסח של §9 D-25, מילה-במילה.
    expect(await screen.findByTestId('report-row-cap')).toHaveTextContent('מוצגות')
    expect(screen.getByTestId('report-row-cap').textContent).toContain('241')
  })

  it('row_total שווה למספר השורות, או חסר ⇒ אין שורה', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { row_total: 2 } }))
    const { unmount } = render(
      <ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />,
    )
    await screen.findByTestId('report-table-card')
    expect(screen.queryByTestId('report-row-cap')).toBeNull()
    unmount()

    callReport.mockResolvedValueOnce(payload())
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    await screen.findByTestId('report-table-card')
    expect(screen.queryByTestId('report-row-cap')).toBeNull()
  })
})

// ── 📐6/📐8/📐9 · סינון-צולב גרף ⇐ טבלה ─────────────────────────────────────

const CHART = {
  type: 'bar',
  title: 'אי-הגעה לפי דירוג',
  xKey: 'rating',
  series: [{ key: 'n', label: 'שורות' }],
  data: [
    { rating: 5, label: 'דירוג 5', n: 1 },
    { rating: 4, label: 'דירוג 4', n: 1 },
  ],
}

const crossPayload = (chart = CHART) =>
  payload({
    chart,
    rows: [
      { row_key: 1, name: 'א', rating: 5 },
      { row_key: 2, name: 'ב', rating: 4 },
      { row_key: 3, name: 'ג', rating: 4 },
    ],
  })

const renderCross = (props = {}) =>
  render(
    <ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} {...props} />,
  )

describe('ReportSurface — סינון-צולב (📐6 · 📐8 · 📐9)', () => {
  it("לחיצה על דאטום מסננת את הטבלה, והפאג'ר סופר את מה שמוצג", async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    expect(await screen.findAllByTestId('report-row')).toHaveLength(3)
    // נתיב-המקלדת: הכפתור שבטבלת-קורא-המסך של הגרף — לא onClick על ה-SVG.
    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(screen.getAllByTestId('report-row')).toHaveLength(2)
    expect(screen.getByTestId('report-pager')).toHaveTextContent('2')
  })

  it('📐9 — האזור-החי מכריז את הבחירה ואת מספר השורות', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    const live = screen.getByTestId('report-table-announce')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live.textContent).toBe('')
    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(live.textContent).toBe('מסונן לדירוג 4; 2 שורות')
    fireEvent.click(screen.getByTestId('chart-select-0'))
    expect(live.textContent).toBe('מסונן לדירוג 5; שורה אחת')
  })

  it("הכרעה 15-ד — לחיצה חוזרת על אותו דאטום מבטלת, וגם צ'יפ-הניקוי", async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    expect(screen.queryByTestId('report-clear-crossfilter')).toBeNull()

    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(screen.getByTestId('report-clear-crossfilter')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(screen.getAllByTestId('report-row')).toHaveLength(3)
    expect(screen.queryByTestId('report-clear-crossfilter')).toBeNull()

    fireEvent.click(screen.getByTestId('chart-select-1'))
    fireEvent.click(screen.getByTestId('report-clear-crossfilter'))
    expect(screen.getAllByTestId('report-row')).toHaveLength(3)
    expect(screen.getByTestId('report-table-announce').textContent).toBe('')
  })

  // ✏️ **נכתבה מחדש 17/09/2026 ע"י סשן-הייצוא — ת4 הופך (ת4ב · §7.103).** הבדיקה נעלה קודם
  // את *"בדיוק מה שעל המסך"*: תווית-הסינון-הצולב נכנסת לשם-הקובץ, והכיתוב יושב מתחת לכפתור.
  // **שניהם בוטלו בהכרעת-ישי** — הייצוא הוא כלי שליפה עצמאי, החלון שולף `drill: null`, ולכן
  // שם שנושא רמה או בחירה **היה משקר**. הכיתוב עבר לתוך החלון עם אותו `testid`.
  // 🔑 **ומה שהבדיקה שומרת עליו עכשיו הוא הצד השני של אותו מטבע:** הסינון-הצולב **אינו** נוגע
  // עוד בייצוא, וכפתור-הייצוא אינו מושפע ממנו.
  it('ת4ב — הסינון-הצולב אינו נוגע בייצוא, ואין עוד כיתוב מתחת לכפתור', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-0'))
    expect(screen.queryByTestId('reports-export-file')).toBeNull()
    expect(screen.getByTestId('reports-export-button')).toBeEnabled()
  })

  // ✏️ **הדאטום כאן נושא `n: 3` ולא `n: 0`, ומסיבה מדודה (16/09/2026):** מאז שכלל
  // "עמודה שספירתה ⁦0⁩ אינה נלחצת" נכנס ל-`ChartCard`, עמודת-אפס **מנוטרלת** ואינה יכולה
  // לייצר בחירה כלל. 🔑 **והמקרה שהבדיקה הזו באמת שומרת עליו נשאר בדיוק אותו מקרה**:
  // דאטום שיש לו ערך על הגרף ו**אין לו ולו שורה אחת בטבלה** — הפער בין האוכלוסייה שהגרף
  // מודד לזו שהטבלה מודדת. ⚠️ עמודת-האפס עצמה נבדקת בכרטיס-הגרף, שם היא חיה.
  it('בחירה שאין לה שורות ⇒ הכרזה כנה והייצוא מנוטרל', async () => {
    const chart = { ...CHART, data: [...CHART.data, { rating: 1, label: 'דירוג 1', n: 3 }] }
    callReport.mockResolvedValueOnce(crossPayload(chart))
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-2'))
    expect(screen.getByTestId('report-table-announce').textContent).toBe(
      'מסונן לדירוג 1; אין שורות',
    )
    // ✏️ **17/09/2026 — היה `toBeDisabled`.** הכפתור פעיל תמיד מרגע שהחלון מאפשר לבחור כל
    // אחד מארבעת דוחות הלשונית: חסימה בגלל הדוח — או הבחירה — שבמקרה פתוח היא מחסום שרירותי.
    // **החסימה לא נעלמה, היא עברה פנימה ונבדקת פר-דוח נבחר** (`ExportDialog`, מצב `blockedReason`).
    expect(screen.getByTestId('reports-export-button')).toBeEnabled()
  })

  // 🔴 **נמדד 16/09/2026:** שורת-התקרה נגזרה מ-`payload.rows.length` בעוד הטבלה מתחתיה כבר
  // הציגה את השורות המסוננות — כלומר *"מוצגות ⁦3⁩ מתוך ⁦731⁩"* מעל טבלה בת שורה אחת.
  it('📐8 — שורת-תקרת-השורות נעלמת בזמן בחירה, וחוזרת עם הניקוי', async () => {
    callReport.mockResolvedValueOnce({ ...crossPayload(), meta: { row_total: 731 } })
    renderCross()
    expect((await screen.findByTestId('report-row-cap')).textContent).toContain('731')

    fireEvent.click(screen.getByTestId('chart-select-0'))
    // ההכרזה החיה (📐9) כבר אומרת כמה שורות מוצגות — מונה שני היה סותר אותה.
    expect(screen.queryByTestId('report-row-cap')).toBeNull()
    expect(screen.getByTestId('report-table-announce').textContent).toBe('מסונן לדירוג 5; שורה אחת')

    fireEvent.click(screen.getByTestId('report-clear-crossfilter'))
    expect(screen.getByTestId('report-row-cap').textContent).toContain('731')
  })

  it('15-ד — הבחירה מסומנת על הגרף עצמו, ולא רק בשבב', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(screen.getByTestId('report-crossfilter-label')).toHaveTextContent('דירוג 4')
  })

  // 🔴 הפגם שהאימות תפס: תווית-הדאטום מול מפתח-השורה — שם תואם, ערכים שאינם נפגשים.
  it('xKey ששמו תואם אך ערכיו אינם נפגשים עם השורות ⇒ אין קרוס-פילטר כלל', async () => {
    const chart = {
      ...CHART,
      xKey: 'bucket',
      data: [{ bucket: '1–30', n: 1 }],
    }
    callReport.mockResolvedValueOnce(
      payload({ chart, rows: [{ row_key: 1, name: 'א', bucket: 'd1_30' }] }),
    )
    renderCross()
    await screen.findAllByTestId('report-row')
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  it('xKey שאינו מפתח של עמודה או של שורה ⇒ אין קרוס-פילטר', async () => {
    callReport.mockResolvedValueOnce(payload({ chart: { ...CHART, xKey: 'month' } }))
    renderCross()
    await screen.findByTestId('report-table-card')
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  it('filter_key: false ⇒ כבוי מפורשות גם כשהזיהוי היה מצליח', async () => {
    callReport.mockResolvedValueOnce(crossPayload({ ...CHART, filter_key: false }))
    renderCross()
    await screen.findAllByTestId('report-row')
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  it('filter_key מפורש גובר על ה-xKey', async () => {
    const chart = { ...CHART, xKey: 'label', filter_key: 'rating' }
    callReport.mockResolvedValueOnce(
      payload({
        chart: { ...chart, data: [{ label: 5, n: 1 }] },
        rows: [
          { row_key: 1, name: 'א', rating: 5 },
          { row_key: 2, name: 'ב', rating: 4 },
        ],
      }),
    )
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-0'))
    expect(screen.getAllByTestId('report-row')).toHaveLength(1)
  })

  // 📐13 — בדף-דריל לחיצה על עמודה **יורדת רמה** (כרטיס-מ9 שורה 6), ולכן אין זיהוי-אוטומטי.
  it('דף-דריל אינו מקבל קרוס-פילטר אוטומטי', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross({ surface: { ...surface, drill: true } })
    await screen.findAllByTestId('report-row')
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  it('הבחירה מתאפסת כששינוי-מסנן מייצר בקשה אחרת', async () => {
    callReport.mockResolvedValue(crossPayload())
    const { rerender } = renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-1'))
    expect(screen.getAllByTestId('report-row')).toHaveLength(2)
    rerender(
      <ReportSurface
        surface={surface}
        filters={{ ...filters, customerId: 401 }}
        drill={null}
        onDrill={vi.fn()}
      />,
    )
    expect(await screen.findAllByTestId('report-row')).toHaveLength(3)
    expect(screen.queryByTestId('report-clear-crossfilter')).toBeNull()
  })
})

describe('ReportSurface — request identity', () => {
  it('does not refetch when drill/onWindow change identity but not content', async () => {
    callReport.mockClear()
    callReport.mockResolvedValue(payload())
    const onWindow = vi.fn()
    const { rerender } = render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={{ kind: 'bucket', bucket: 'd90p' }}
        onDrill={() => {}}
        onWindow={onWindow}
      />,
    )
    await screen.findByTestId('report-population')
    expect(callReport).toHaveBeenCalledTimes(1)
    expect(callReport.mock.calls[0][1].drill).toEqual({ kind: 'bucket', bucket: 'd90p' })
    // אותו תוכן, זהות חדשה — כמו שהמעטפת מייצרת בכל רינדור.
    rerender(
      <ReportSurface
        surface={surface}
        filters={{ ...filters }}
        drill={{ kind: 'bucket', bucket: 'd90p' }}
        onDrill={() => {}}
        onWindow={vi.fn()}
      />,
    )
    await new Promise((r) => setTimeout(r, 0))
    expect(callReport).toHaveBeenCalledTimes(1)
    // ✏️ **הערוץ למעטפת נושא שלושה ארגומנטים מאז 17/09/2026**: החלון · `meta` הגולמי ·
    // שם-ה-RPC. שם חיים הדגלים שקובעים אם המסננים חלים על הדף, והמעטפת חייבת לדעת **של
    // מי** הם (`readScope` ב-`ReportsPage`).
    expect(onWindow).toHaveBeenCalledTimes(1)
    expect(onWindow.mock.calls[0][0]).toEqual(expect.objectContaining({ label: 'חלון' }))
    expect(onWindow.mock.calls[0][2]).toBe(surface.rpc)
  })

  // 🔴 **הטרנספורם רץ פעם אחת למטען, ולא בכל רינדור** — הפיזור של מ6 (⁦717⁩ נקודות) נבנה
  // מחדש בכל הקלדה במסנן, ו-`chart` בזהות חדשה מכריח את Recharts לרנדר הכול מחדש.
  // ⚠️ **התנאי: טרנספורם יציב-זהות.** בדיקה שמוסרת חץ-אינליין הייתה "עוברת" בלי למדוד כלום.
  it('transformPayload אינו רץ שוב ברינדור-חוזר עם אותם קלטים', async () => {
    callReport.mockClear()
    callReport.mockResolvedValue(payload())
    const transformPayload = vi.fn((p) => p)
    const props = {
      surface,
      filters,
      drill: null,
      onDrill: () => {},
      transformPayload,
    }
    const { rerender } = render(<ReportSurface {...props} />)
    await screen.findByTestId('report-population')
    expect(transformPayload).toHaveBeenCalledTimes(1)
    rerender(<ReportSurface {...props} />)
    expect(transformPayload).toHaveBeenCalledTimes(1)
  })
})

// ── 📐10 · מהי "ריק" ────────────────────────────────────────────────────────
//
// 🔴 **המבחן הקודם היה `tiles || charts || rows`, וכל 16 ה-RPC מחזירים אריחים תמיד** ⇒
// מצב 2 של 📐10 (*"ריק-אחרי-סינון"* + *"נקי מסננים"*) היה **קוד-מת בכל המודול**.

describe('ReportSurface — 📐10: ריקות נמדדת באוכלוסייה', () => {
  const filtered = { ...filters, isFiltered: true, clearFilters: vi.fn() }

  it('אפס שורות ו-n=0 ⇒ מצב "ריק-אחרי-סינון" עם כפתור-ניקוי', async () => {
    callReport.mockResolvedValueOnce(payload({ rows: [], population: { label: 'אין', n: 0 } }))
    render(<ReportSurface surface={surface} filters={filtered} drill={null} onDrill={vi.fn()} />)
    expect(await screen.findByTestId('reports-clear-filters')).toBeInTheDocument()
    expect(screen.queryByTestId('report-table-card')).toBeNull()
  })

  // 🔴 **הצד שתופס רגרסיה:** רשימת-חריגים בלי חריגים אינה מסך-ריק — היא תשובה אמיתית.
  it('אפס שורות עם אוכלוסייה קיימת ⇒ הדוח מוצג במלואו', async () => {
    callReport.mockResolvedValueOnce(payload({ rows: [], population: { label: 'הכול', n: 106 } }))
    render(<ReportSurface surface={surface} filters={filtered} drill={null} onDrill={vi.fn()} />)
    expect(await screen.findByTestId('report-table-card')).toBeInTheDocument()
    expect(screen.queryByTestId('reports-clear-filters')).toBeNull()
    expect(screen.getByTestId('report-tiles')).toBeInTheDocument()
  })

  it('בלי מסנן ⇒ "ריק-לגמרי", בלי הצעה לנקות', async () => {
    callReport.mockResolvedValueOnce(payload({ rows: [], population: { label: 'אין', n: 0 } }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    await screen.findByTestId('report-reliability-blank')
    expect(screen.queryByTestId('reports-clear-filters')).toBeNull()
  })

  // 🔴 **‏T3 (אודיט-הסגירה 17/09/2026, ממצא F-13) — פרמטר חסר אינו "אין נתונים".**
  // החזרת-הריק המוקדמת קדמה ל-`MissingParamsBanner`, ולכן מטען עם אפס שורות **וגם**
  // `missing_params` הציג *"אין נתונים"* ולעולם לא את משפט §7.83 — בדיוק ברירת-המחדל
  // השקטה שההכרעה אוסרת, ובמצב שבו הדף הכי משכנע שהוא יודע ואינו יודע.
  it('אפס שורות עם `missing_params` ⇒ הבאנר נאמר, ולא רק "אין נתונים"', async () => {
    callReport.mockResolvedValueOnce(
      payload({
        rows: [],
        population: { label: 'אין', n: 0 },
        meta: { missing_params: ['מקדם_אמינות_אדום'] },
      }),
    )
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: מקדם_אמינות_אדום',
    )
    // ⚠️ ומצב-הריק **נשאר** — הבאנר מתווסף לו ואינו מחליף אותו.
    expect(screen.getByTestId('report-reliability-blank')).toBeInTheDocument()
  })
})

// 🔴 **‏T10 (אודיט-הסגירה 17/09/2026, ממצא F-15) — המנגנון המתועד לא היה זה שרץ.**
// ‏`missingReportParamsMessage` (`src/lib/reportsParams.js`) נכתבה בדיוק בשביל המשפט הזה,
// ‏**ולא היה לה ולו צרכן-ייצור אחד** — המסך הדפיס את שם-הפרמטר החשוף. ההבדל אינו נוסחי:
// המשתמשת צריכה לדעת **מה לא עובד עכשיו** ומה לעשות, לא רק ששורה חסרה.
describe('ReportSurface — משפט-הפרמטר-החסר הוא זה של `reportsParams`', () => {
  it('שם מוכר ⇒ ההשלכה והפעולה נאמרות, לא רק השם', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { missing_params: ['מקדם_אמינות_אדום'] } }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: מקדם_אמינות_אדום — אין סימון אדום בדוח אמינות הדיילות. ' +
        'יש להוסיף את השורה בהגדרות המערכת.',
    )
  })

  // 🪤 **ה-RPCs נוקבים גם בשמות שאינם ברשימת-ההשלכות** (`יחס_אורחים_לדיילת` ·
  // `תנאי_תשלום_ימים` · `קבוע_ריסון_m`) — ואז המשפט נאמר **בלי** סעיף-ההשלכה, ולא עם
  // מקף תלוי שאין אחריו דבר.
  it('שם בלי השלכה כתובה ⇒ משפט שלם בלי מקף ריק', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { missing_params: ['יחס_אורחים_לדיילת'] } }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    const banner = await screen.findByTestId('report-missing-params')
    expect(banner).toHaveTextContent(
      'חסר פרמטר מערכת: יחס_אורחים_לדיילת. יש להוסיף את השורה בהגדרות המערכת.',
    )
    expect(banner.textContent).not.toContain('— .')
  })

  it('שני שמות ⇒ לשון-רבים בתווית ובפעולה', async () => {
    callReport.mockResolvedValueOnce(
      payload({ meta: { missing_params: ['מקדם_אמינות_אדום', 'מקדם_אמינות_ענבר'] } }),
    )
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    const banner = await screen.findByTestId('report-missing-params')
    expect(banner).toHaveTextContent('חסרים פרמטרי מערכת: מקדם_אמינות_אדום, מקדם_אמינות_ענבר')
    expect(banner).toHaveTextContent('יש להוסיף את השורות בהגדרות המערכת.')
  })
})

// ── ✏️ שלוש נקודות-ההרחבה החדשות ───────────────────────────────────────────

describe('ReportSurface — renderAfterSoWhat · renderChartAside · renderChartFooter', () => {
  it('⑩א — הרמז יושב בין "אז מה" לאריחים, ולא מעל שורת-האוכלוסייה', async () => {
    callReport.mockResolvedValueOnce(payload({ so_what: 'לפעול השבוע' }))
    render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        renderAfterSoWhat={() => <p data-testid="why-hint">למה הדוח הזה</p>}
      />,
    )
    const hint = await screen.findByTestId('why-hint')
    const soWhat = screen.getByTestId('report-so-what')
    const tiles = screen.getByTestId('report-tiles')
    const population = screen.getByTestId('report-population')
    expect(soWhat.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(hint.compareDocumentPosition(tiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(population.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('אריח-הצד והכיתוב-התחתון נמסרים לכרטיס-הגרף עם מספר-הגרף', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        renderChartAside={(p, i) => <span>צד-{i}</span>}
        renderChartFooter={(p, i) => <span>תחתון-{i}</span>}
      />,
    )
    expect(await screen.findByTestId('chart-aside')).toHaveTextContent('צד-0')
    expect(screen.getByTestId('chart-footer')).toHaveTextContent('תחתון-0')
  })
})

// ── 🚪 דף-דריל: העמודה היא פקד-הקידוח ──────────────────────────────────────

const DRILL_SURFACE = {
  id: 'm9',
  slug: 'aging',
  rpc: 'report_m09_aging',
  name: 'גיול',
  drill: true,
}

// 🌱 צורת-המטען החי של מ9: העמודה מציגה **תווית** והדאטום נושא **מפתח**.
const agingPayload = (over = {}) =>
  payload({
    chart: {
      type: 'stackedBar',
      title: 'חוב לפי מדרג',
      xKey: 'bucket',
      series: [{ key: 'amount', label: 'חוב' }],
      data: [
        { bucket: '1–30', bucket_key: 'd1_30', amount: 82000 },
        { bucket: '31–60', bucket_key: 'd31_60', amount: 57000 },
        { bucket: '90+', bucket_key: 'd90p', amount: 0 },
      ],
    },
    drill: { level: 0, levels: ['מדרג', 'לקוח'], crumbs: [{ label: 'הכול', drill: null }] },
    rows: [{ row_key: 1, name: 'אלפא', drill_key: { kind: 'customer', bucket: 'd1_30', id: 401 } }],
    ...over,
  })

describe('ReportSurface — 🚪 לחיצה על עמודה בדף-דריל יורדת רמה', () => {
  it('הלחיצה מוסרת את ה*מפתח* של הדאטום, לא את התווית', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(agingPayload())
    render(
      <ReportSurface surface={DRILL_SURFACE} filters={filters} drill={null} onDrill={onDrill} />,
    )
    fireEvent.click(await screen.findByTestId('chart-select-0'))
    expect(onDrill).toHaveBeenCalledWith({ bucket: 'd1_30' }, null, 'level')
  })

  // 🔑 בלי זה המשתמשת יורדת רמה והגרף נראה בדיוק כמו קודם.
  it('הדלי הפתוח נשאר מסומן אחרי הירידה', async () => {
    callReport.mockResolvedValueOnce(
      agingPayload({
        drill: { level: 1, levels: ['מדרג', 'לקוח'], crumbs: [{ label: 'הכול', drill: null }] },
      }),
    )
    render(
      <ReportSurface
        surface={DRILL_SURFACE}
        filters={filters}
        drill={{ bucket: 'd31_60' }}
        onDrill={vi.fn()}
      />,
    )
    await screen.findByTestId('report-table-card')
    const cells = screen.getAllByTestId('recharts-Cell').map((n) => JSON.parse(n.dataset.props))
    // העמודה הפתוחה נשארת טורקיז, השתיים האחרות יורדות ל-slate-300.
    expect(cells.filter((c) => c.fill === '#CAD5E2')).toHaveLength(2)
  })

  // 🚫 מדרג שספירתו אפס אינו דלת — המגן של `ChartCard` ממשיך לחול על נתיב-הדריל.
  it('מדרג ריק אינו מוריד רמה', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(agingPayload())
    render(
      <ReportSurface surface={DRILL_SURFACE} filters={filters} drill={null} onDrill={onDrill} />,
    )
    expect(await screen.findByTestId('chart-select-2')).toBeDisabled()
  })

  // ⚠️ ברמה האחרונה אין רמה לרדת אליה — והעמודה חוזרת להיות לא-לחיצה.
  it('ברמה האחרונה הגרף אינו מוריד רמה', async () => {
    callReport.mockResolvedValueOnce(
      agingPayload({
        drill: { level: 1, levels: ['מדרג', 'לקוח'], crumbs: [{ label: 'הכול', drill: null }] },
      }),
    )
    render(
      <ReportSurface surface={DRILL_SURFACE} filters={filters} drill={null} onDrill={vi.fn()} />,
    )
    await screen.findByTestId('report-table-card')
    expect(screen.queryByTestId('chart-select-0')).toBeNull()
  })

  // 🔴 **הפגם הסמוי:** ‏`{kind:'customer', …, id:401}` הוא `kind` מרשימת-הדלתות, ועד עכשיו
  // הוא ירד רמה **רק** כי `id` חסר. עכשיו הכוונה מוצהרת — והיא שקובעת.
  // ✏️ **ומאז 17/09/2026 (פריט [E1]) היא נקבעת לפי מפתח-השורה ולא לפי המשטח:** מפתח
  // ש**חוזר על הממד של הרמה הפתוחה** (`bucket`, זה שיושב ב-`?drill=`) הוא ירידת-רמה —
  // וזה שורד גם את היום שבו ה-RPC יוסיף `id` לשורת-הדלי, שהוא כל מה ש-`DRILL_INTENT` נולד
  // בשבילו. 🌱 צורת-המפתח כאן היא זו שנמדדה בריצה חיה על רמת-הדלי של מ9.
  it('שורה בדף-דריל שחוזרת על ממד-הרמה מוסרת סימן-ירידה, גם כשיש לה id', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(
      agingPayload({
        drill: { level: 1, levels: ['הכול', 'מדרג', 'לקוח'], crumbs: [{ label: 'הכול' }] },
        rows: [
          {
            row_key: 1,
            name: 'אלפא',
            drill_key: { kind: 'customer', bucket: 'd90p', customer_id: 401, id: 401 },
          },
        ],
      }),
    )
    render(
      <ReportSurface
        surface={DRILL_SURFACE}
        filters={filters}
        drill={{ bucket: 'd90p' }}
        onDrill={onDrill}
      />,
    )
    fireEvent.click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(onDrill.mock.calls[0][2]).toBe('level')
  })

  // 🚪 **הצד השני של אותה הכרעה, והוא זה ש-E2E מדד אדום פעמיים (הכרעה 19):** בשורש של
  // מ9 אין ממד פתוח, ולכן שורה שנושאת `{kind:'project', id}` היא **דלת אל כרטיס-הפרויקט**
  // — ‏`ReportsPage.openDoor` מנווט אליה, ואינו כותב `?drill=`.
  it('שורת-שורש עם kind+id היא דלת — בלי סימן-ירידה', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(
      agingPayload({
        rows: [{ row_key: 1, name: 'אלפא', drill_key: { kind: 'project', id: 1040 } }],
      }),
    )
    render(
      <ReportSurface surface={DRILL_SURFACE} filters={filters} drill={null} onDrill={onDrill} />,
    )
    fireEvent.click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(onDrill.mock.calls[0][0]).toEqual({ kind: 'project', id: 1040 })
    expect(onDrill.mock.calls[0][2]).toBeNull()
  })

  it('ברמה האחרונה אין סימן — הדלת היא הישות עצמה', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(
      agingPayload({
        drill: { level: 1, levels: ['מדרג', 'לקוח'], crumbs: [{ label: 'הכול', drill: null }] },
      }),
    )
    render(
      <ReportSurface surface={DRILL_SURFACE} filters={filters} drill={null} onDrill={onDrill} />,
    )
    fireEvent.click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(onDrill.mock.calls[0][2]).toBeUndefined()
  })
})

// ── 🚪 הגרף והשורה — דלת אחת, שתי כניסות (פזה ב׳ שלב 8, 23/09/2026) ─────────────

// 🌱 צורת-המטען החי של מ3 (`…j3….sql` — `'drill_key', jsonb_build_object('kind','year','year',yr)`):
// הדאטום של הגרף נושא **אותו** `drill_key` שהשורה בטבלה נושאת. עד היום הגרף חיפש `year_key`,
// שאינו קיים, ולכן שלוש העמודות בדף "מגמות רב-שנתיות" היו מתות.
const trendsPayload = (over = {}) =>
  payload({
    chart: {
      type: 'bar',
      title: 'הכנסה לפי שנה',
      xKey: 'year',
      series: [{ key: 'revenue', label: 'הכנסה' }],
      data: [
        { year: 2024, revenue: 100, drill_key: { kind: 'year', year: 2024 } },
        { year: 2025, revenue: 120, drill_key: { kind: 'year', year: 2025 } },
      ],
    },
    rows: [{ row_key: 1, name: '2024', drill_key: { kind: 'year', year: 2024 } }],
    drill: { level: 0, levels: ['כל השנים', 'שנה', 'חודש'], crumbs: [{ label: 'כל השנים' }] },
    ...over,
  })

const TRENDS_SURFACE = { ...DRILL_SURFACE, id: 'm3', slug: 'trends', rpc: 'report_m03_trends' }

describe('ReportSurface — 🚪 הגרף יורד רמה דרך ה-drill_key של הדאטום', () => {
  it('לחיצה על עמודת-שנה מוסרת את מפתח-הדאטום עצמו, כמו לחיצה על השורה', async () => {
    const onDrill = vi.fn()
    callReport.mockResolvedValueOnce(trendsPayload())
    render(
      <ReportSurface surface={TRENDS_SURFACE} filters={filters} drill={null} onDrill={onDrill} />,
    )
    fireEvent.click(await screen.findByTestId('chart-select-1'))
    expect(onDrill).toHaveBeenCalledWith({ kind: 'year', year: 2025 }, null, 'level')
  })

  it('ליד גרף שיורד רמה יש שורת-יכולת, ובנוסח שהמשטח מסר', async () => {
    callReport.mockResolvedValueOnce(trendsPayload())
    render(
      <ReportSurface
        surface={TRENDS_SURFACE}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        chartAction={() => 'לחיצה על שנה בגרף יורדת לחודשים שלה'}
      />,
    )
    expect(await screen.findByTestId('chart-action')).toHaveTextContent(
      'לחיצה על שנה בגרף יורדת לחודשים שלה',
    )
  })

  it('בגרף-קווים הנוסח אומר "נקודה", לא "עמודה"', async () => {
    callReport.mockResolvedValueOnce(crossPayload({ ...CHART, type: 'line' }))
    renderCross()
    expect(await screen.findByTestId('chart-action')).toHaveTextContent(
      'לחיצה על נקודה מסננת את הטבלה',
    )
  })

  it('גרף שמסנן את הטבלה אומר זאת', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    expect(await screen.findByTestId('chart-action')).toHaveTextContent(
      'לחיצה על עמודה מסננת את הטבלה',
    )
  })

  it('גרף שאינו לחיץ אינו מבטיח דבר', async () => {
    callReport.mockResolvedValueOnce(crossPayload({ ...CHART, filter_key: false }))
    renderCross()
    await screen.findAllByTestId('report-row')
    expect(screen.queryByTestId('chart-action')).toBeNull()
  })
})

// ── 📐8 · שורת-התקרה מול צמצום-לקוח ────────────────────────────────────────

describe('ReportSurface — תקרת-השורות נמדדת מול השורות הגולמיות', () => {
  // 🔴 נמדד במ16: השרת מסר 50 מתוך 50 (**אין תקרה**), שבב-לקוח צמצם ל-2, והשורה הופיעה
  // ואמרה "מוצגות 2 מתוך 50" — כלומר **צמצום-לקוח נקרא כתקרת-שרת**, וזה בדיוק ההפך.
  it('טרנספורם שמצמצם שורות אינו מדליק את שורת-התקרה', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { row_total: 2 } }))
    const shrink = (p) => ({ ...p, rows: p.rows.slice(0, 1) })
    render(
      <ReportSurface
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        transformPayload={shrink}
      />,
    )
    await screen.findByTestId('report-table-card')
    expect(screen.queryByTestId('report-row-cap')).toBeNull()
  })

  it('תקרת-שרת אמיתית עדיין מוצהרת', async () => {
    callReport.mockResolvedValueOnce(payload({ meta: { row_total: 731 } }))
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    expect((await screen.findByTestId('report-row-cap')).textContent).toContain('731')
  })
})

// ── 🔤 נוסח צ'יפ-הניקוי ────────────────────────────────────────────────────

describe('ReportSurface — נוסח הצ׳יפ', () => {
  // ‏`spec.md §1.5` + S-28 נועלים ציווי בנקבה, והמוקאפ המאושר כותב זאת בשורה 897.
  it('הצ׳יפ אומר "× נקי בחירה"', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-0'))
    expect(screen.getByTestId('report-clear-crossfilter')).toHaveTextContent('× נקי בחירה')
  })
})

// ── 📏 תיבת-האריח של המוקאפ ────────────────────────────────────────────────

describe('ReportSurface — גבולות-רוחב של האריח', () => {
  // 🔴 נמדד במ19: משפט-השוואה ארוך ניפח אריח אחד ושבר את השורה ל-2+2 ב-1280px, בעוד
  // המוקאפ מצייר ארבעה על שורה אחת (`min-width:210px; flex:1 1 210px; max-width:340px`).
  it('כל אריח נושא את גבולות-הרוחב, והרצועה נשארת flex-wrap', async () => {
    callReport.mockResolvedValueOnce(payload())
    render(<ReportSurface surface={surface} filters={filters} drill={null} onDrill={vi.fn()} />)
    const strip = await screen.findByTestId('report-tiles')
    expect(strip.className).toContain('flex-wrap')
    const box = strip.firstElementChild
    expect(box.className).toContain('min-w-[210px]')
    expect(box.className).toContain('max-w-[340px]')
    expect(box.className).toContain('basis-[210px]')
  })
})
