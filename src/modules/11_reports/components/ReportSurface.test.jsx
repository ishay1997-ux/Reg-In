// בדיקות-רכיב ל-`ReportSurface` — נקודות-ההרחבה של בוני-הלשוניות ו-`meta.extra_tables`.
// ‏`callReport` ממוקם: הרכיב לעולם אינו פונה לרשת כאן; `recharts` ממוקם כי jsdom אינו מרנדר SVG.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('recharts', () => ({}))
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
})
