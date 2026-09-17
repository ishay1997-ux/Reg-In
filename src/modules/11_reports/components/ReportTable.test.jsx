// בדיקות טבלת-הדוח — **מה שהעין רואה בתא, ולא מה שה-RPC התכוון אליו.**
//
// 🔑 **למה הקובץ נולד ב-17/09/2026:** סבב-הראיות מדד על המסך *"‏`1,907`"* בעמודת *"הצעה"*
// של מ4 ו-*"‏`1,416`"* בעמודת-הפרויקט של מ8 — **מזהה שמעוצב ככמות**. הפגם עבר קומפילציה,
// בדיקות ושער-לינט, כי הוא נכון-לחלוטין מבחינת הקוד: ה-RPC הכריז `format:'int'`, ו-`int`
// מריץ `toLocaleString`. ⇒ הבדיקה היושבת על **הטבלה** היא המקום היחיד שבו ההפרה צועקת.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ⚠️ מלכודת `.env.local` מול CI — בלי המוק כל בדיקת-רכיב שנוגעת בשרשרת-ה-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

import ReportTable from './ReportTable'

// 🌱 עמודות ושורות מתוך מטען חי של מ4 (`report_m04_discounts`) — לא הומצאו. ‏`quote_id`
// הוכרז `int` עד 17/09/2026 וזה היה כל הפגם; מיגרציית J2 מצהירה עליו `'format','id'`,
// **וזה המקור היחיד** — כלל-סיומת-ה-`_id` שהיה כאן בבוקר נמחק (שני מנגנונים, D-30).
const COLUMNS = [
  { key: 'quote_id', label: 'הצעה', format: 'id' },
  { key: 'customer_name', label: 'לקוח', format: 'text' },
  { key: 'discount_pct', label: 'הנחה', format: 'percent' },
]
const ROWS = [{ quote_id: 1907, customer_name: 'אלפא סיסטמס', discount_pct: 12.5 }]

const LRI = '⁦'
const PDI = '⁩'

describe('ReportTable — מזהה אינו כמות (פריט [2])', () => {
  it('עמודה שהוכרזה format:"id" מוצגת בלי מפריד-אלפים', () => {
    render(<ReportTable columns={COLUMNS} rows={ROWS} />)
    expect(screen.getByRole('cell', { name: `${LRI}1907${PDI}` })).toBeInTheDocument()
    expect(screen.queryByText('⁦1,907⁩')).not.toBeInTheDocument()
  })

  // 🔑 ההצהרה עובדת גם על מפתח שאינו `_id` — זהו החוזה היחיד (C8), ולא שם-העמודה.
  it('‏format:"id" עובד גם למפתח שאינו _id', () => {
    render(
      <ReportTable
        columns={[{ key: 'quote_no', label: 'הצעה', format: 'id' }]}
        rows={[{ quote_no: 2288 }]}
      />,
    )
    expect(screen.getByRole('cell', { name: `${LRI}2288${PDI}` })).toBeInTheDocument()
  })

  // 🚫 **והנעילה על מחלקת-הפגם שנמחקה:** מפתח שמסתיים ב-`_id` אך הוכרז `int` נשאר `int`.
  // ‏אילו כלל-הסיומת היה חוזר, הבדיקה הזו תיפול — וזה בדיוק תפקידה.
  it('מפתח _id שהוכרז int אינו הופך למזהה מאחורי גב ההצהרה', () => {
    render(
      <ReportTable
        columns={[{ key: 'quote_id', label: 'הצעה', format: 'int' }]}
        rows={[{ quote_id: 1907 }]}
      />,
    )
    expect(screen.getByRole('cell', { name: `${LRI}1,907${PDI}` })).toBeInTheDocument()
  })

  // 🚫 **והכלל אינו גולש לעמודות-כמות** — `int` נשאר `int` בכל עמודה שאינה מזהה.
  it('עמודה מספרית רגילה שומרת על מפריד-האלפים', () => {
    render(
      <ReportTable
        columns={[{ key: 'events', label: 'אירועים', format: 'int' }]}
        rows={[{ events: 1907 }]}
      />,
    )
    expect(screen.getByRole('cell', { name: `${LRI}1,907${PDI}` })).toBeInTheDocument()
  })

  // ⚠️ היישור לא זז: מזהה נסרק בעין כטור-ספרות, והפגם היה המפריד בלבד.
  it('היישור נשאר כשל-עמודה-מספרית', () => {
    render(<ReportTable columns={COLUMNS} rows={ROWS} />)
    expect(screen.getByRole('cell', { name: `${LRI}1907${PDI}` }).className).toContain('text-left')
  })
})
