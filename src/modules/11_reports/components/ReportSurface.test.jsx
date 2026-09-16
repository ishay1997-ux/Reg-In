// בדיקות-רכיב ל-`ReportSurface` — נקודות-ההרחבה של בוני-הלשוניות ו-`meta.extra_tables`.
// ‏`callReport` ממוקם: הרכיב לעולם אינו פונה לרשת כאן; `recharts` ממוקם כי jsdom אינו מרנדר SVG.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
// ⚠️ מוק-recharts שמרנדר (ולא `{}`) — בלעדיו כל בדיקה שיש בה גרף נופלת על "Element type is
// invalid". הוא גם מה שמאפשר לבדוק את **נתיב-המקלדת** של הקרוס-פילטר: הכפתורים יושבים
// בטבלת-קורא-המסך של `ChartCard`, שהיא DOM רגיל ואינה עוברת דרך הספרייה.
vi.mock('recharts', () => {
  const stub =
    (name) =>
    ({ children }) => <div data-testid={`recharts-${name}`}>{children}</div>
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

  // ת4 — *"בדיוק מה שעל המסך"*: הייצוא מקבל את השורות המסוננות ואת תווית-הבחירה.
  it('ת4 — הייצוא יורד על השורות המסוננות, והתווית נכנסת לשם-הקובץ', async () => {
    callReport.mockResolvedValueOnce(crossPayload())
    renderCross()
    await screen.findAllByTestId('report-row')
    fireEvent.click(screen.getByTestId('chart-select-0'))
    expect(screen.getByTestId('reports-export-file').textContent).toContain('דירוג-5')
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
    expect(screen.getByTestId('reports-export-button')).toBeDisabled()
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
    expect(onWindow).toHaveBeenCalledWith(expect.objectContaining({ label: 'חלון' }))
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
