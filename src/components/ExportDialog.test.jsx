// בדיקות חלון-הייצוא — **מה שיורד לקובץ הוא מה שנראה בחלון, ומה שנאמר עליו הוא אמת.**
//
// 🔑 **הבדיקה המרכזית כאן היא לא "הרכיב מרונדר" אלא שהתצוגה-המקדימה נגזרת מ-`buildSheet`** —
// אותה פונקציה שכותבת את הגיליון. לכן `buildSheet` **אינו ממוקם**: מוזנת בו הפונקציה האמיתית
// (`buildExportSheet`), וכל שינוי בעיצוב-התאים ייראה כאן מיד. מוק שלה היה הופך את הבדיקה
// למדידת-עצמה.

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ExportDialog, { NO_ROWS_AFTER_FILTER, PICK_ONE_COLUMN } from '@/components/ExportDialog'
import { buildExportSheet } from '@/lib/reportsExport'

// ⚠️ מלכודת `.env.local` מול CI — בלי המוק בדיקת-רכיב שנוגעת בשרשרת-ה-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

const COLUMNS = [
  { key: 'project_id', label: 'פרויקט', format: 'id' },
  { key: 'customer_name', label: 'לקוח', format: 'text' },
  { key: 'amount', label: 'סכום', format: 'money' },
  { key: 'days_overdue', label: 'ימי איחור', format: 'days' },
]

// שורות אמיתיות ממ9 (גיול חובות), נמדדו במסד 17/09/2026.
const ROWS = [
  { project_id: 1040, customer_name: 'מועצה מקומית שוהם', amount: 2899, days_overdue: 611 },
  { project_id: 1460, customer_name: 'אלפא סיסטמס בע"מ', amount: 10163, days_overdue: 140 },
  { project_id: 1468, customer_name: 'מועצה אזורית עמק חפר', amount: 4884, days_overdue: 89 },
]

function setup(props = {}) {
  const onExport = vi.fn().mockResolvedValue(undefined)
  const view = render(
    <ExportDialog
      open
      onOpenChange={vi.fn()}
      columns={COLUMNS}
      rows={ROWS}
      buildSheet={buildExportSheet}
      fileName="גיול-חובות_2026.xlsx"
      onExport={onExport}
      {...props}
    />,
  )
  return { onExport, container: view.container }
}

const headers = () =>
  within(screen.getByTestId('export-preview'))
    .getAllByRole('columnheader')
    .map((cell) => cell.textContent)

describe('ExportDialog — התצוגה המקדימה היא הקובץ', () => {
  it('מציג את העמודות שהוכרזו, בסדר שהוכרז', () => {
    setup()
    expect(headers()).toEqual(['פרויקט', 'לקוח', 'סכום', 'ימי איחור'])
  })

  it('כיבוי עמודה מסיר אותה מהתצוגה — ולכן גם מהקובץ', () => {
    setup()
    fireEvent.click(screen.getByLabelText('סכום, עמודה 3 מתוך 4'))
    expect(headers()).toEqual(['פרויקט', 'לקוח', 'ימי איחור'])
  })

  it('🔴 הזזה מעלה משנה את סדר העמודות בקובץ', () => {
    setup()
    fireEvent.click(screen.getByLabelText('הזיזי את סכום מעלה'))
    expect(headers()).toEqual(['פרויקט', 'סכום', 'לקוח', 'ימי איחור'])
  })

  it('העמודה הראשונה אינה יכולה לעלות, והאחרונה אינה יכולה לרדת', () => {
    setup()
    expect(screen.getByLabelText('הזיזי את פרויקט מעלה')).toBeDisabled()
    expect(screen.getByLabelText('הזיזי את ימי איחור מטה')).toBeDisabled()
  })

  // 🔑 **הכרעת-ישי 17/09/2026:** *"«העבר לראש» מסכים"*. װ📊 **הנימוק:** ב-30 שדות,
  // העברה ממקום 30 ל-1 בחצים = **29 לחיצות**. הבדיקה נועלת את הסדר **בקובץ**,
  // ולא את קיום הכפתור — כי התצוגה-המקדימה **היא** הקובץ.
  it('🔴 "העבירי לראש" מקפיץ עמודה לראש הקובץ בלחיצה אחת', () => {
    setup()
    fireEvent.click(screen.getByLabelText('העבירי את ימי איחור לראש הרשימה'))
    expect(headers()).toEqual(['ימי איחור', 'פרויקט', 'לקוח', 'סכום'])
  })

  it('"העבירי לראש" מנוטרל על העמודה שכבר ראשונה', () => {
    setup()
    expect(screen.getByLabelText('העבירי את פרויקט לראש הרשימה')).toBeDisabled()
  })
})

describe('ExportDialog — שורת-הכמות אומרת את האמת', () => {
  it('בלי חיתוך — מספר השורות בלבד', () => {
    setup()
    expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 3 שורות')
  })

  it('🔴 עם חיתוך — נוקב גם באוכלוסייה, ולא מציג "3 מתוך 3"', () => {
    setup({ rowTotal: 737 })
    expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 3 שורות מתוך 737')
  })

  it('🔴 רשימת-שיא היא הדוח ולא מדגם — והנוסח נוקב במספר האוכלוסייה', () => {
    setup({ topN: { label: '8 הלקוחות הגדולים', total: 52 } })
    expect(screen.getByTestId('export-count')).toHaveTextContent('8 הלקוחות הגדולים · מתוך 52')
  })

  it('מתג "כל השורות" מחליף את הנוסח', () => {
    setup({ topN: { label: '8 הלקוחות הגדולים', total: 52 }, showAll: true })
    expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 3 שורות')
  })

  it('אפס עמודות — הכפתור מנוטרל והמשפט מפורש', () => {
    setup()
    for (const label of ['פרויקט', 'לקוח', 'סכום', 'ימי איחור']) {
      const index = COLUMNS.findIndex((column) => column.label === label) + 1
      fireEvent.click(screen.getByLabelText(`${label}, עמודה ${index} מתוך 4`))
    }
    expect(screen.getByTestId('export-count')).toHaveTextContent(PICK_ONE_COLUMN)
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })

  it('חסימה פר-דוח נאמרת במקום שורת-הכמות, והייצוא מנוטרל', () => {
    setup({ blockedReason: 'אין שורות לייצא — טרם אושרה ריצת-ניתוח' })
    expect(screen.getByTestId('export-count')).toHaveTextContent('טרם אושרה ריצת-ניתוח')
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })
})

describe('ExportDialog — סינון', () => {
  it('מסנן מצמצם את השורות, ושורת-הכמות עוקבת', () => {
    setup()
    fireEvent.click(screen.getByTestId('export-add-filter'))
    fireEvent.change(screen.getByLabelText('עמודה לסינון'), { target: { value: 'days_overdue' } })
    fireEvent.change(screen.getByLabelText('תנאי'), { target: { value: 'gt' } })
    fireEvent.change(screen.getByLabelText('ערך'), { target: { value: '100' } })
    expect(screen.getByTestId('export-count')).toHaveTextContent('הקובץ יכלול 2 שורות')
  })

  it('סינון שמרוקן — נאמר, והייצוא מנוטרל', () => {
    setup()
    fireEvent.click(screen.getByTestId('export-add-filter'))
    fireEvent.change(screen.getByLabelText('עמודה לסינון'), { target: { value: 'days_overdue' } })
    fireEvent.change(screen.getByLabelText('תנאי'), { target: { value: 'gt' } })
    fireEvent.change(screen.getByLabelText('ערך'), { target: { value: '9999' } })
    expect(screen.getByTestId('export-count')).toHaveTextContent(NO_ROWS_AFTER_FILTER)
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })

  it('🔴 ל-id אין "גדול מ-" ברשימת התנאים', () => {
    setup()
    fireEvent.click(screen.getByTestId('export-add-filter'))
    const operators = within(screen.getByLabelText('תנאי'))
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(operators).toEqual(['שווה ל-', 'אחד מ-'])
  })
})

describe('ExportDialog — הבטחת השם וכשל הייצוא', () => {
  it('🔑 הבטחת-השם נשארת תחת reports-export-file — החוזה של ה-E2E', () => {
    setup()
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent(
      'יירד: גיול-חובות_2026.xlsx',
    )
  })

  it('מייצא את העמודות והשורות שנבחרו בפועל', async () => {
    const { onExport } = setup()
    fireEvent.click(screen.getByLabelText('לקוח, עמודה 2 מתוך 4'))
    fireEvent.click(screen.getByTestId('export-dialog-run'))
    await vi.waitFor(() => expect(onExport).toHaveBeenCalled())
    const call = onExport.mock.calls[0][0]
    expect(call.columns.map((column) => column.key)).toEqual([
      'project_id',
      'amount',
      'days_overdue',
    ])
    expect(call.rows).toHaveLength(3)
  })

  it('🔴 כשל-ייצוא נאמר על המסך — הרגרסיה של B-1', async () => {
    const onExport = vi.fn().mockRejectedValue(new Error('אין שורות לייצא'))
    setup({ onExport, knownMessages: new Set(['אין שורות לייצא']) })
    fireEvent.click(screen.getByTestId('export-dialog-run'))
    expect(await screen.findByRole('alert')).toHaveTextContent('אין שורות לייצא')
  })

  // 🔴 **הצד השני של אותו משמר, וזה החצי שנשכח פעם אחת:** נוסח שאינו ברשימה הסגורה הוא
  // תקלת-ספרייה, ואסור שידלוף למסך. בלי הבדיקה הזו, ההבחנה נשארת הצהרה בהערה.
  it('🔴 שגיאה שאינה ברשימה הסגורה אינה מדליפה טקסט טכני', async () => {
    const onExport = vi.fn().mockRejectedValue(new Error('TypeError: cell.value is not a function'))
    setup({ onExport, knownMessages: new Set(['אין שורות לייצא']) })
    fireEvent.click(screen.getByTestId('export-dialog-run'))
    expect(await screen.findByRole('alert')).toHaveTextContent('הייצוא לא הושלם.')
  })

  it('שגיאה בלי message אינה מרנדרת משבצת ריקה', async () => {
    const onExport = vi.fn().mockRejectedValue({})
    setup({ onExport, knownMessages: new Set(['אין שורות לייצא']) })
    fireEvent.click(screen.getByTestId('export-dialog-run'))
    expect(await screen.findByRole('alert')).toHaveTextContent('הייצוא לא הושלם.')
  })
})

// 🔴🔴 **דליפת-השכר — שלושה מסלולים שסוכן-יריב מצא 22/09/2026,**
// וכולם אומתו בקוד לפני שתוקנו. 🔑 **השאלה אינה "האם העמודה בגיליון"**
// אלא **"האם הערך ניתן להסקה"** — תווית בשורת-"חל על הקובץ" וערכים
// ברשימת-הבחירה של המסנן מדליפים אותו בדיוק כמו עמודה.
describe('🔴 visible — העמודה המוסתרת אינה דולפת גם סביב הגיליון', () => {
  const HIDDEN = [
    { key: 'name', label: 'שם', format: 'text' },
    { key: 'hourly_wage', label: 'שכר שעתי', format: 'money', visible: () => false },
  ]
  const STAFF = [
    { name: 'נועה', hourly_wage: 145 },
    { name: 'שיר', hourly_wage: 160 },
  ]

  it('① אינה מופיעה ברשימת-העמודות של הבוחר', () => {
    setup({ columns: HIDDEN, rows: STAFF })
    expect(screen.queryByTestId('export-column-hourly_wage')).toBeNull()
  })

  it('② אינה מופיעה בבורר-העמודות של המסנן — ולכן אי-אפשר לראות את ערכיה', () => {
    setup({ columns: HIDDEN, rows: STAFF })
    fireEvent.click(screen.getByTestId('export-add-filter'))
    const picker = screen.getByLabelText('עמודה לסינון')
    expect(picker.textContent).not.toContain('שכר שעתי')
  })

  it('③ ערכיה אינם מגיעים לשום מקום בחלון', () => {
    const { container } = setup({ columns: HIDDEN, rows: STAFF })
    expect(container.textContent).not.toContain('145')
    expect(container.textContent).not.toContain('שכר שעתי')
  })
})

// 🔴 **כיוון-הכשל של מנגנון-הרשאות.** בריפו הזה הרשאות הן **מחרוזות**
// (`RepositoryTab.jsx:72` — `permissions['דיילות'] === 'edit'`), ולכן הכתיבה הטבעית
// `visible: () => permissions['דיילות']` מחזירה `'view'` — **אמתית, ולכן הייתה מייצאת את השכר.**
// ⚠️ **מנגנון-הרשאות חייב ליפול סגור, לא פתוח.**
describe('🔴 isVisible — נופל סגור', () => {
  const wage = (flag) => [
    { key: 'name', label: 'שם', format: 'text' },
    { key: 'hourly_wage', label: 'שכר שעתי', format: 'money', visible: flag },
  ]

  it('מחרוזת-הרשאה אינה כן — view מסתיר, ואינו חושף', () => {
    setup({ columns: wage(() => 'view'), rows: [{ name: 'נועה', hourly_wage: 145 }] })
    expect(screen.queryByTestId('export-column-hourly_wage')).toBeNull()
  })

  it('רק true מפורש חושף', () => {
    setup({ columns: wage(() => true), rows: [{ name: 'נועה', hourly_wage: 145 }] })
    expect(screen.queryByTestId('export-column-hourly_wage')).not.toBeNull()
  })
})

// 🔴🔴 **בידוד-כיווניות בתצוגה-המקדימה — נמצא באימות-עיניים, לא בשער.**
// 📊 **נמדד 23/09/2026 על דוח הגיול ב-1024px:** המחרוזת הלוגית בתא היא `61–90`,
// ועל המסך היא נקראה **`90–61`** · ו-`90+` נקרא **`+90`**. תחת `dir="rtl"` שתי
// רצפות-הספרות הן רצפי-LTR נפרדים, וסדרם הוא ימין-לשמאל.
// 🔑 **וזה המקרה הגרוע מכולם:** לא ערך חסר ולא ערך חתוך — **ערך שלם שנקרא
// כערך אחר.** מנהלת-הכספים רואה מדרג שאינו קיים, ואין שער שתופס את זה.
describe('🔴 התצוגה-המקדימה — כל תא מבודד כיוונית', () => {
  const BUCKETS = [
    { key: 'bucket', label: 'מדרג', format: 'text' },
    { key: 'customer_name', label: 'לקוח', format: 'text' },
  ]
  const BUCKET_ROWS = [
    { bucket: '61–90', customer_name: 'מועצה מקומית שוהם' },
    { bucket: '90+', customer_name: 'אלפא סיסטמס בע"מ' },
  ]

  it('כל תא-גוף עטוף ב-bdi', () => {
    setup({ columns: BUCKETS, rows: BUCKET_ROWS })
    const cells = within(screen.getByTestId('export-preview')).getAllByRole('cell')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      expect(cell.querySelector('bdi')).not.toBeNull()
    }
  })

  it('הערך עצמו נשמר בדיוק — הבידוד אינו משנה את הקובץ', () => {
    setup({ columns: BUCKETS, rows: BUCKET_ROWS })
    const preview = within(screen.getByTestId('export-preview'))
    expect(preview.getByText('61–90')).toBeInTheDocument()
    expect(preview.getByText('90+')).toBeInTheDocument()
  })

  // 📊 **סריקה, לא ניחוש (23/09/2026):** `grep -rhoE "'[0-9]+[–-][0-9]+'"` על מיגרציות מ11
  // מחזיר עוד **שמונה** ערכים מאותה צורה — `1-5` · `6-10` · `25-30` … `50-55` —
  // בדוחות-ההנהלה (`module11_d_rpcs_executive.sql:998` · `:1404`). **אם `61–90` נשבר, גם הם.**
  // 🔑 והתיקון הוא פר-תא ואדיש-לתוכן ⇒ **מכסה את כולם**, וגם את הבא.
  it('הבידוד אדיש לצורת-הערך — מקף ASCII · מקף-עילי · פלוס · טווח-שנים', () => {
    const shapes = ['25-30', '61–90', '10+', '2024–2026', '1-5']
    setup({
      columns: [{ key: 'band', label: 'מדרג', format: 'text' }],
      rows: shapes.map((band) => ({ band })),
    })
    const preview = within(screen.getByTestId('export-preview'))
    for (const shape of shapes) {
      const node = preview.getByText(shape)
      expect(node.tagName).toBe('BDI')
    }
  })

  it('גם שורת-הכותרת מבודדת', () => {
    setup({ columns: BUCKETS, rows: BUCKET_ROWS })
    const heads = within(screen.getByTestId('export-preview')).getAllByRole('columnheader')
    for (const head of heads) {
      expect(head.querySelector('bdi')).not.toBeNull()
    }
  })
})
