import { describe, expect, it } from 'vitest'
import {
  applyFilters,
  CATEGORY_MAX_VALUES,
  distinctValues,
  isCategorical,
  operatorsFor,
} from '@/lib/exportFilters'

const COLUMNS = [
  { key: 'project_id', label: 'פרויקט', format: 'id' },
  { key: 'customer_name', label: 'לקוח', format: 'text' },
  { key: 'bucket', label: 'מדרג', format: 'text' },
  { key: 'amount', label: 'סכום', format: 'money' },
  { key: 'days_overdue', label: 'ימי איחור', format: 'days' },
  { key: 'margin', label: 'שולי-רווח', format: 'percent' },
  { key: 'sent_date', label: 'נשלחה', format: 'date' },
]

// שורות אמיתיות ממ9 (גיול חובות), 17/09/2026.
const ROWS = [
  {
    project_id: 1040,
    customer_name: 'מועצה מקומית שוהם',
    bucket: '90+',
    amount: 2899,
    days_overdue: 611,
    margin: 52.4,
    sent_date: '2025-01-14',
  },
  {
    project_id: 1460,
    customer_name: 'אלפא סיסטמס בע"מ',
    bucket: '90+',
    amount: 10163,
    days_overdue: 140,
    margin: 31.2,
    sent_date: '2026-04-30',
  },
  {
    project_id: 1468,
    customer_name: 'מועצה אזורית עמק חפר',
    bucket: '61–90',
    amount: 4884,
    days_overdue: 89,
    margin: null,
    sent_date: '2026-05-11',
  },
  {
    project_id: 1521,
    customer_name: 'שקד הפקות כנסים',
    bucket: '31–60',
    amount: 4624,
    days_overdue: '  ',
    margin: 0,
    sent_date: '2026-06-18',
  },
]

describe('operatorsFor — הפקד נגזר מהפורמט', () => {
  it('🔴 ל-id אין "גדול מ-" — "פרויקט מעל 1500" חסר-משמעות', () => {
    const ids = operatorsFor('id').map((o) => o.id)
    expect(ids).toEqual(['eq', 'oneOf'])
    expect(ids).not.toContain('gt')
  })

  it('מספרי מקבל ארבעה, תאריך שניים', () => {
    expect(operatorsFor('money').map((o) => o.id)).toEqual(['gt', 'lt', 'between', 'eq'])
    expect(operatorsFor('percent').map((o) => o.id)).toContain('between')
    expect(operatorsFor('date').map((o) => o.id)).toEqual(['from', 'to'])
  })

  it('🔴 טקסט הוא שני פקדים שונים — קטגוריה מול חופשי', () => {
    expect(operatorsFor('text', true).map((o) => o.id)).toEqual(['oneOf'])
    expect(operatorsFor('text', false).map((o) => o.id)).toEqual(['contains'])
  })
})

describe('distinctValues · isCategorical — נמדד מהנתונים, לא מוכרז', () => {
  it('מדרג הוא קטגוריה, שם-לקוח אינו בהכרח', () => {
    expect(distinctValues(ROWS, 'bucket')).toEqual(['31–60', '61–90', '90+'])
    expect(isCategorical(ROWS, 'bucket')).toBe(true)
  })

  it('חורג מהסף ⇒ אינו קטגוריה', () => {
    const many = Array.from({ length: CATEGORY_MAX_VALUES + 1 }, (_, i) => ({ k: `v${i}` }))
    expect(isCategorical(many, 'k')).toBe(false)
  })

  it('ריקים אינם ערך, וכפילויות מתאחדות', () => {
    expect(distinctValues([{ k: 'א' }, { k: 'א' }, { k: '' }, { k: null }], 'k')).toEqual(['א'])
  })
})

describe('applyFilters — מספרי', () => {
  it('גדול/קטן/בין/שווה', () => {
    const only = (c) => applyFilters(ROWS, COLUMNS, [c]).map((r) => r.project_id)
    expect(only({ key: 'days_overdue', operator: 'gt', value: 90 })).toEqual([1040, 1460])
    expect(only({ key: 'amount', operator: 'lt', value: 4700 })).toEqual([1040, 1521])
    expect(only({ key: 'amount', operator: 'between', value: 4000, value2: 5000 })).toEqual([
      1468, 1521,
    ])
    expect(only({ key: 'project_id', operator: 'eq', value: 1040 })).toEqual([1040])
  })

  it('🔴 ערך חסר אינו אפס — null אינו עובר "קטן מ-10"', () => {
    const got = applyFilters(ROWS, COLUMNS, [{ key: 'margin', operator: 'lt', value: 10 }])
    // 0 אמיתי כן עובר; null לא. שניהם היו נראים אותו דבר אילו null היה נקרא כאפס.
    expect(got.map((r) => r.project_id)).toEqual([1521])
  })

  it('🔴 מחרוזת-רווחים אינה אפס — ההבדל מול toFiniteNumber של pricing.js', () => {
    const got = applyFilters(ROWS, COLUMNS, [{ key: 'days_overdue', operator: 'lt', value: 10 }])
    expect(got).toEqual([])
  })

  it('percent בסולם 0–100 — "מעל 50" תופס 52.4 ולא דורש 0.524', () => {
    const got = applyFilters(ROWS, COLUMNS, [{ key: 'margin', operator: 'gt', value: 50 }])
    expect(got.map((r) => r.project_id)).toEqual([1040])
  })

  it('סכום שהגיע כמחרוזת מושווה מספרית ולא אלפביתית', () => {
    const rows = [{ amount: '9' }, { amount: '10163' }]
    const got = applyFilters(rows, COLUMNS, [{ key: 'amount', operator: 'gt', value: 100 }])
    expect(got).toEqual([{ amount: '10163' }])
  })
})

describe('applyFilters — טקסט ותאריך', () => {
  it('🔴 מכיל מוצא ערך שנושא תו-כיווניות בלתי-נראה', () => {
    const rows = [{ customer_name: '⁦מועצה אזורית עמק חפר⁩' }]
    const got = applyFilters(rows, COLUMNS, [
      { key: 'customer_name', operator: 'contains', value: 'עמק חפר' },
    ])
    expect(got).toHaveLength(1)
  })

  it('oneOf על קטגוריה', () => {
    const got = applyFilters(ROWS, COLUMNS, [
      { key: 'bucket', operator: 'oneOf', values: ['90+', '61–90'] },
    ])
    expect(got.map((r) => r.project_id)).toEqual([1040, 1460, 1468])
  })

  it('תאריך מ-/עד, בלי הזזת-יום סביב חצות', () => {
    const only = (c) => applyFilters(ROWS, COLUMNS, [c]).map((r) => r.project_id)
    expect(only({ key: 'sent_date', operator: 'from', value: '2026-05-01' })).toEqual([1468, 1521])
    expect(only({ key: 'sent_date', operator: 'to', value: '2026-04-30' })).toEqual([1040, 1460])
  })
})

describe('applyFilters — הרכבה', () => {
  it('תנאים מצטברים ב-AND', () => {
    const got = applyFilters(ROWS, COLUMNS, [
      { key: 'bucket', operator: 'oneOf', values: ['90+'] },
      { key: 'amount', operator: 'gt', value: 5000 },
    ])
    expect(got.map((r) => r.project_id)).toEqual([1460])
  })

  it('תנאי על עמודה שאינה בדוח — נזרק, ואינו מסנן הכול החוצה', () => {
    expect(applyFilters(ROWS, COLUMNS, [{ key: 'nope', operator: 'gt', value: 1 }])).toHaveLength(4)
  })

  it('אין תנאים ⇒ הכול עובר', () => {
    expect(applyFilters(ROWS, COLUMNS, [])).toHaveLength(4)
  })
})
