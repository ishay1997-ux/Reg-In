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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ⚠️ מלכודת `.env.local` מול CI — בלי המוק כל בדיקת-רכיב שנוגעת בשרשרת-ה-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

// 🧪 **רק ההורדה עצמה ממוקמת — שלוש המחרוזות הנעולות ובניית-השם נשארות אמיתיות.**
// ‏`exportReportRows` היא הגבול שמעברו יושבת ספריית-הצד-השלישי, וכשל שלה הוא הכישלון
// היחיד שיכול לקרות בייצור (שני המצבים הריקים חסומים מראש ע"י כפתור מנוטרל).
const exportRows = vi.fn()
vi.mock('@/lib/reportsExport', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, exportReportRows: (...args) => exportRows(...args) }
})

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

// 🔴 **B-1 (אודיט-הסגירה 17/09/2026, ממצא F-10) — "המסך משקר; הוא אינו נכשל" על מסלול חי.**
// ‏`exportReportRows` מחזירה **הבטחה** (‏`writeXlsxFile` הוא a-סינכרוני), והיא נקראה בלי
// ‏`await` בתוך `try` — כלומר **דחייה חמקה מה-catch לגמרי**: בלי `setError`, בלי שורת-קונסול,
// בלי דבר על המסך. המשתמשת לוחצת, קובץ אינו יורד, והמוצר שותק.
// 🧪 שלוש הבדיקות כאן מכסות את שלושת המצבים שהמדידה מצאה: דחייה אמיתית · נוסח נעול ·
// שגיאה חסרת-`message` (שקודם רינדרה `span` **ריק**, כי המשמר היה טאוטולוגי).
describe('ExportBar — כשל-הייצוא נאמר על המסך (B-1)', () => {
  beforeEach(() => {
    exportRows.mockReset()
  })

  it('דחייה של ההורדה מגיעה ל-catch ומוצגת, ואינה נעלמת בשקט', async () => {
    exportRows.mockRejectedValueOnce(new Error('write failed'))
    render(<ExportBar {...PROPS} />)
    fireEvent.click(screen.getByTestId('reports-export-button'))
    expect(await screen.findByRole('alert')).toHaveTextContent('הייצוא לא הושלם.')
  })

  // 🔤 נוסח נעול שזרקנו בעצמנו — מוצג כמות שהוא; רק תקלת-ספרייה נופלת לנוסח הכללי.
  it('נוסח נעול מוצג מילה-במילה', async () => {
    exportRows.mockRejectedValueOnce(new Error(EXPORT_NO_ROWS))
    render(<ExportBar {...PROPS} />)
    fireEvent.click(screen.getByTestId('reports-export-button'))
    expect(await screen.findByRole('alert')).toHaveTextContent(EXPORT_NO_ROWS)
  })

  it('שגיאה בלי `message` מרנדרת את הנוסח הכללי ולא משבצת ריקה', async () => {
    exportRows.mockRejectedValueOnce({})
    render(<ExportBar {...PROPS} />)
    fireEvent.click(screen.getByTestId('reports-export-button'))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('הייצוא לא הושלם.')
  })
})
