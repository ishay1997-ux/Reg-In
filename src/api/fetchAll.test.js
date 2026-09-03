import { describe, expect, it, vi } from 'vitest'
import { fetchAll } from './fetchAll'

// בילדר-מדומה: `range(from, to)` מחזיר את החתך המתאים מתוך מערך-הבסיס, כמו PostgREST.
function makeBuilder(all, { failAt = null } = {}) {
  const calls = []
  return {
    calls,
    build: () => ({
      range: vi.fn((from, to) => {
        calls.push([from, to])
        if (failAt !== null && calls.length === failAt) {
          return Promise.resolve({ data: null, error: { message: 'boom' } })
        }
        return Promise.resolve({ data: all.slice(from, to + 1), error: null })
      }),
    }),
  }
}

describe('fetchAll — דפדוף מעל תקרת-1,000 השקטה', () => {
  it('מחזיר את כל השורות כשיש יותר מעמוד אחד, ועוצר על עמוד חלקי', async () => {
    const all = Array.from({ length: 2345 }, (_, i) => ({ id: i }))
    const b = makeBuilder(all)
    const { data, error } = await fetchAll(b.build)
    expect(error).toBeNull()
    expect(data).toHaveLength(2345)
    expect(data[2344]).toEqual({ id: 2344 })
    expect(b.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
  })

  it('בדיוק 1,000 שורות — עמוד שני ריק מסיים, בלי שורה כפולה', async () => {
    const all = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
    const b = makeBuilder(all)
    const { data } = await fetchAll(b.build)
    expect(data).toHaveLength(1000)
    expect(b.calls).toHaveLength(2)
  })

  it('טבלה ריקה ⇒ מערך ריק, קריאה אחת', async () => {
    const b = makeBuilder([])
    await expect(fetchAll(b.build)).resolves.toEqual({ data: [], error: null })
    expect(b.calls).toHaveLength(1)
  })

  it('שגיאה בעמוד השני מוחזרת כשגיאה — לא כחצי-רשימה שנראית שלמה', async () => {
    const all = Array.from({ length: 1500 }, (_, i) => ({ id: i }))
    const b = makeBuilder(all, { failAt: 2 })
    const { data, error } = await fetchAll(b.build)
    expect(data).toBeNull()
    expect(error).toEqual({ message: 'boom' })
  })

  it('גודל-עמוד מותאם (בדיקות/מסכים קטנים) מכובד', async () => {
    const all = Array.from({ length: 7 }, (_, i) => ({ id: i }))
    const b = makeBuilder(all)
    const { data } = await fetchAll(b.build, { pageSize: 3 })
    expect(data).toHaveLength(7)
    expect(b.calls).toEqual([
      [0, 2],
      [3, 5],
      [6, 8],
    ])
  })
})
