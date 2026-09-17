import { describe, expect, it } from 'vitest'
import { applyColumnOrder, defaultOrder, moveKey, reorderKey } from '@/lib/exportColumns'

const COLUMNS = [
  { key: 'project_id', label: 'פרויקט', format: 'id' },
  { key: 'customer_name', label: 'לקוח', format: 'text' },
  { key: 'amount', label: 'סכום', format: 'money' },
  { key: 'days_overdue', label: 'ימי איחור', format: 'days' },
]
const ALL = defaultOrder(COLUMNS)

describe('applyColumnOrder — מה שיורד לקובץ', () => {
  it('מחזיר את הנבחרות בסדר שנקבע, ולא בסדר שה-RPC הכריז', () => {
    const picked = applyColumnOrder(
      COLUMNS,
      ['amount', 'customer_name', 'project_id'],
      ['amount', 'customer_name'],
    )
    expect(picked.map((c) => c.key)).toEqual(['amount', 'customer_name'])
  })

  it('🔴 מפתח שאינו קיים בדוח הנוכחי נזרק — המלכודת של Metabase #75791', () => {
    // סדר שנשמר על רמת-דריל אחרת נושא מפתח שאינו כאן. הוא לא יפיל ולא יחזיר את הכול.
    const picked = applyColumnOrder(
      COLUMNS,
      ['bucket', 'amount', 'project_id'],
      ['amount', 'project_id'],
    )
    expect(picked.map((c) => c.key)).toEqual(['amount', 'project_id'])
  })

  it('עמודה שה-RPC הוסיף ואינה בסדר השמור — מצטרפת ואינה נעלמת', () => {
    const picked = applyColumnOrder(COLUMNS, ['amount'], ['amount', 'days_overdue'])
    expect(picked.map((c) => c.key)).toEqual(['amount', 'days_overdue'])
  })

  it('🔴 בחירה ריקה מחזירה את כל העמודות — ולא קובץ בן שורת-כותרת בלבד', () => {
    expect(applyColumnOrder(COLUMNS, ALL, []).map((c) => c.key)).toEqual(ALL)
  })

  it('קלט לא-תקין אינו זורק', () => {
    expect(applyColumnOrder(null, null, null)).toEqual([])
    expect(applyColumnOrder(COLUMNS, undefined, undefined).map((c) => c.key)).toEqual(ALL)
  })
})

describe('moveKey — מעלה/מטה', () => {
  it('מזיז צעד אחד ומחזיר מערך חדש', () => {
    const next = moveKey(ALL, 'amount', -1)
    expect(next).toEqual(['project_id', 'amount', 'customer_name', 'days_overdue'])
    expect(next).not.toBe(ALL)
  })

  it('קצה אינו גולש לצד השני', () => {
    expect(moveKey(ALL, 'project_id', -1)).toEqual(ALL)
    expect(moveKey(ALL, 'days_overdue', 1)).toEqual(ALL)
  })

  it('מפתח שאינו ברשימה אינו משנה דבר', () => {
    expect(moveKey(ALL, 'nope', 1)).toEqual(ALL)
  })
})

describe('reorderKey — גרירה אנכית', () => {
  it('מציב לפני מפתח אחר', () => {
    expect(reorderKey(ALL, 'amount', 'project_id')).toEqual([
      'amount',
      'project_id',
      'customer_name',
      'days_overdue',
    ])
  })

  it('null מציב בסוף', () => {
    expect(reorderKey(ALL, 'project_id', null)).toEqual([
      'customer_name',
      'amount',
      'days_overdue',
      'project_id',
    ])
  })

  it('מפתח שאינו ברשימה אינו נוסף', () => {
    expect(reorderKey(ALL, 'nope', 'amount')).toEqual(ALL)
  })
})
