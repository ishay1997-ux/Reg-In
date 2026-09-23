import { describe, expect, it } from 'vitest'
import {
  applyColumnOrder,
  defaultOrder,
  isVisible,
  moveKey,
  moveToTop,
  readCell,
  reorderKey,
} from '@/lib/exportColumns'
import { buildExportSheet } from '@/lib/reportsExport'

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

describe('moveToTop — קפיצה לראש בלחיצה אחת', () => {
  it('מעביר מהסוף לראש, והסדר היחסי של השאר נשמר', () => {
    expect(moveToTop(ALL, 'days_overdue')).toEqual([
      'days_overdue',
      'project_id',
      'customer_name',
      'amount',
    ])
  })

  it('מעביר מהאמצע לראש', () => {
    expect(moveToTop(ALL, 'amount')).toEqual([
      'amount',
      'project_id',
      'customer_name',
      'days_overdue',
    ])
  })

  // 🔴 **הבדיקה שנועלת את סיבת-הקיום של הפונקציה.** װ`reorderKey(ALL, key, ALL[0])`
  // בקריאה ישירה **מעיף את הפריט לסוף** במקרה הזה: המפתח מסונן החוצה,
  // ואז `indexOf(beforeKey)` מחפש אותו מפתח עצמו ⇒ `-1` ⇒ `at < 0 ? list.length`.
  // ⚠️ **הכפתור מנוטרל ב-`index === 0`, והשכבה הטהורה אינה סומכת על ה-UI.**
  it('🔴 מפתח שכבר ראשון נשאר ראשון — ולא נוחת בסוף', () => {
    expect(moveToTop(ALL, 'project_id')).toEqual(ALL)
    expect(reorderKey(ALL, 'project_id', ALL[0])).not.toEqual(ALL)
  })

  it('מפתח שאינו ברשימה — אין-מעש', () => {
    expect(moveToTop(ALL, 'nope')).toEqual(ALL)
  })

  it('מחזיר מערך חדש ואינו משנה במקום', () => {
    const before = [...ALL]
    const next = moveToTop(ALL, 'amount')
    expect(ALL).toEqual(before)
    expect(next).not.toBe(ALL)
  })
})

// 🔴🔴 **§7 פריט 9ב — החוזה שהרשם הבטיח והמנוע לא קיים.**
// װ`RepositoryTab.jsx:404` · `:455` מסירים את `שכר שעתי` מהמסך ללא הרשאת-עריכה,
// ותיאור-עמודות תמים היה מייצא אותה לכולן. **שלוש טענות נפרדות, לא אחת.**
describe('🔴 visible — עמודה מוסתרת אינה מגיעה לקובץ', () => {
  const canEdit = false
  const WITH_WAGE = [
    { key: 'name', label: 'שם', format: 'text' },
    { key: 'hourly_wage', label: 'שכר שעתי', format: 'money', visible: () => canEdit },
  ]
  const STAFF = [{ name: 'נועה', hourly_wage: 55 }]

  it('① אינה נכנסת ל-defaultOrder ⇒ אינה מופיעה בבוחר', () => {
    expect(defaultOrder(WITH_WAGE)).toEqual(['name'])
  })

  it('② אינה חוזרת מ-applyColumnOrder — גם כשה-`order` השמור מבקש אותה במפורש', () => {
    const smuggled = ['hourly_wage', 'name']
    const out = applyColumnOrder(WITH_WAGE, smuggled, new Set(smuggled))
    expect(out.map((c) => c.key)).toEqual(['name'])
  })

  it('③ אינה בשורת-הכותרת ולא בגוף של buildExportSheet — גם בקריאה ישירה שעוקפת את החלון', () => {
    const sheet = buildExportSheet({ columns: WITH_WAGE, rows: STAFF })
    const flat = JSON.stringify(sheet)
    expect(sheet[0].map((c) => c.value)).toEqual(['שם'])
    expect(flat).not.toContain('שכר שעתי')
    expect(flat).not.toContain('55')
  })

  it('visible חסר ⇒ העמודה נראית (16 דוחות מ11 אינם מצהירים עליו)', () => {
    expect(defaultOrder(COLUMNS)).toEqual(ALL)
    expect(isVisible({ key: 'x' })).toBe(true)
  })

  it('visible כבוליאן עובד גם הוא', () => {
    expect(isVisible({ key: 'x', visible: false })).toBe(false)
    expect(isVisible({ key: 'x', visible: true })).toBe(true)
  })
})

describe('readCell — דלת-הקריאה היחידה', () => {
  it('עם value — קורא לנגזרת ומעביר לה את השורה השלמה', () => {
    const column = { key: 'total', value: (r) => r.a + r.b }
    expect(readCell({ a: 2, b: 3 }, column)).toBe(5)
  })

  it('בלי value — קורא לפי מפתח', () => {
    expect(readCell({ amount: 7 }, { key: 'amount' })).toBe(7)
  })

  it('שורה או עמודה חסרות — undefined ולא זריקה', () => {
    expect(readCell(null, { key: 'a' })).toBeUndefined()
    expect(readCell({ a: 1 }, null)).toBeUndefined()
  })
})
