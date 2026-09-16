// בדיקות שורת-הייצוא — **ההבטחה שלפני הלחיצה, ואיך היא יושבת על מסך עברי.**
//
// 🔴 **למה הקובץ נולד ב-17/09/2026, וזו בדיקה שנולדה מ*הפרכה*:** פריט [1] של סבב-הראיות
// תיאר את כיתוב-שם-הקובץ כגולש לשתי שורות עם `.xlsx` בקצה השמאלי של השורה השנייה, והציע
// לבודד את השם כרצף-LTR אחד. **בצילום שהפריט עצמו מצטט הכיתוב יושב על שורה אחת**
// (`…/results/evidence/CEO-m2-exec-overview-export-caption-block.png`), ו-`.xlsx` נמצא
// בקצה השמאלי שלה — כלומר בסוף הלוגי של השם בקריאה מימין לשמאל.
// ⚠️ **והבידוד נמדד כהרעה:** ‏`<bdi dir="ltr">` הקפיץ את `.xlsx` אל **מיד אחרי** המילה
// *"יירד"*, לפני השם *(השוואה: `results-fix/evidence/bar2-before.png` מול `bar2-after.png`)*.
// ⇒ **הרכיב לא שונה, והבדיקות כאן נועלות את מה שנמדד תקין** — כדי שהתיקון-שאינו-תיקון לא
// ייכנס בסבב הבא בלי מדידה חדשה.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ⚠️ מלכודת `.env.local` מול CI — בלי המוק כל בדיקת-רכיב שנוגעת בשרשרת-ה-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

import ExportBar from './ExportBar'
import { EXPORT_NO_ROWS } from '@/lib/reportsExport'

// 🌱 המשטח והמצב שבהם הכיתוב צולם: מ2 אצל המנכ"ל, מצב-הטמעה 2, ⁦1280⁩px.
const PROPS = {
  reportName: 'מבט-על הנהלה',
  windowLabel: '2026 (01/01–16/09) · כל הלקוחות',
  drillLabel: null,
  columns: [
    { key: 'event', label: 'אירוע', format: 'text' },
    { key: 'revenue', label: 'הכנסה', format: 'money' },
  ],
  rows: [{ event: 'כנס לקוחות', revenue: 18000 }],
}

describe('ExportBar — כיתוב-ההבטחה (ת4)', () => {
  // 🔴 **החוזה מול ה-E2E:** ‏*"שמו הוא זה שהובטח על המסך"* משווה את הכיתוב **מילולית**
  // לשם-הקובץ שנחת (`caption.replace('יירד:','').trim()`) — ולכן אסור שייכנס לטקסט תו
  // בלתי-נראה, וזו גם הסיבה ש-`isolateLtr` אינו אפשרות כאן גם אילו הבידוד היה נחוץ.
  it('הטקסט הוא "יירד: " ואחריו השם, בלי תווי-כיווניות בלתי-נראים', () => {
    render(<ExportBar {...PROPS} />)
    const caption = screen.getByTestId('reports-export-file').textContent
    expect(caption).toBe('יירד: מבט-על-הנהלה_2026-(01-01–16-09)-·-כל-הלקוחות.xlsx')
    expect(caption.startsWith('יירד:')).toBe(true)
    expect(caption.endsWith('.xlsx')).toBe(true)
    expect(caption).not.toMatch(/[⁦-⁩‎‏]/)
  })

  // 🚫 ובלי `<bdi>`/`dir` על השם: הכיווניות של הפסקה היא מה שמציב את הסיומת בסוף.
  it('שם-הקובץ אינו עטוף בצומת-כיווניות', () => {
    render(<ExportBar {...PROPS} />)
    const span = screen.getByTestId('reports-export-file')
    expect(span.querySelector('bdi')).toBeNull()
    expect(span.querySelector('[dir]')).toBeNull()
  })

  it('שורת-העמודות נאמרת לצידו, והכפתור פעיל', () => {
    render(<ExportBar {...PROPS} />)
    expect(screen.getByTestId('reports-export-columns')).toHaveTextContent('אירוע · הכנסה')
    expect(screen.getByTestId('reports-export-button')).not.toBeDisabled()
  })

  // 🔤 הנוסח הנעול של מצב-הריק — ר' `reportsExport.js`.
  it('בלי שורות ⇒ הנוסח הנעול, והכפתור מנוטרל', () => {
    render(<ExportBar {...PROPS} rows={[]} />)
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent(EXPORT_NO_ROWS)
    expect(screen.getByTestId('reports-export-button')).toBeDisabled()
  })
})
