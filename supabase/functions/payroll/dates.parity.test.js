// @vitest-environment node
// `formatTimestampFull` של השרת מול זה של האפליקציה (`src/lib/dates.js`) — 20 רגעים, רובם סביב
// מעברי שעון-קיץ/חורף בישראל 2026 (27/03 ו-25/10) וסביב חצות UTC/ישראל.
import { describe, it, expect } from 'vitest'
import { formatTimestampFull as browser } from '@/lib/dates'
import { formatTimestampFull as edge } from './dates.ts'

const INSTANTS = [
  '2026-03-26T21:59:59Z',
  '2026-03-26T22:00:00Z',
  '2026-03-26T23:59:00Z',
  '2026-03-27T00:00:00Z',
  '2026-03-27T00:30:00Z',
  '2026-03-27T01:00:00Z',
  '2026-10-24T21:59:00Z',
  '2026-10-24T22:00:00Z',
  '2026-10-24T22:30:00Z',
  '2026-10-24T23:00:00Z',
  '2026-10-24T23:30:00Z',
  '2026-10-25T00:00:00Z',
  '2026-08-31T21:00:00Z',
  '2026-08-31T20:59:59Z',
  '2026-12-31T22:00:00Z',
  '2026-12-31T21:59:00Z',
  '2026-02-28T22:00:00Z',
  '2028-02-28T22:30:00Z',
  '2026-10-13T23:45:00.123+00:00',
  '2026-07-15T09:05:00+03:00',
]

describe('formatTimestampFull — שוויון', () => {
  it.each(INSTANTS)('%s', (iso) => {
    expect(edge(iso)).toBe(browser(iso))
    expect(edge(iso)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it.each([[null], [''], ['לא תאריך'], [undefined]])('%j ⇒ אותו ערך ריק', (value) => {
    expect(edge(value, '—')).toBe(browser(value, '—'))
  })

  it('דוגמה מוחלטת: 31/08 21:00 UTC הוא 01/09 00:00 בישראל', () => {
    expect(edge('2026-08-31T21:00:00Z')).toBe('01/09/2026 00:00')
  })
})
