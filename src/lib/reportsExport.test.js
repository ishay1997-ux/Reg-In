// בדיקות-היחידה של מנגנון-הייצוא. שלוש מהן קיימות בשביל כשלים שאין להם סימפטום נראה:
// ① `rightToLeft` חסר ⇒ קובץ נפתח הפוך, והתוכן תקין ⇒ שום בדיקה אחרת לא תצעק.
// ② סכום שיורד כטקסט ⇒ הטור באקסל מסתכם ל-0 אצל הרו"ח, לא אצלנו.
// ③ שם-הקובץ שעל המסך לפני הלחיצה חייב להיות **אותו** שם שיורד — שתי גזירות נפרדות סוטות.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 🔑 הספרייה ממודמה: הבדיקה בודקת **מה נמסר לה**, לא שהדפדפן הוריד קובץ (אין דפדפן ב-vitest).
vi.mock('write-excel-file', () => ({ default: vi.fn(() => Promise.resolve()) }))

import writeXlsxFile from 'write-excel-file'
import {
  EXPORT_LOCKED_MESSAGES,
  META_SHEET_NAME,
  EXPORT_NO_APPROVED_RUN,
  EXPORT_NO_ROWS,
  EXPORT_NO_TABLE,
  buildExportFileName,
  buildExportSheet,
  buildMetaSheet,
  exportReportRows,
  sanitizeSheetName,
} from '@/lib/reportsExport'

const COLUMNS = [
  { key: 'customer', label: 'לקוח', format: 'text' },
  { key: 'amount', label: 'יתרת-חוב פתוחה', format: 'money' },
  { key: 'days', label: 'ימי איחור', format: 'days' },
  { key: 'due', label: 'מועד פירעון', format: 'date' },
]

const ROWS = [
  { customer: 'אלפא סיסטמס בע"מ', amount: 18643, days: 68, due: '2026-07-10' },
  { customer: 'עיריית רעננה', amount: '15610', days: null, due: null },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildMetaSheet · הגיליון השני — ההקשר שהקובץ נושא איתו', () => {
  const AT = new Date('2026-09-17T15:45:00Z')

  it('ארבע שורות: דוח · חל על הקובץ · שורות · הופק', () => {
    const sheet = buildMetaSheet({
      reportName: 'גיול חובות',
      scope: 'תקופה 01/01/2026–17/09/2026 · כל הלקוחות',
      count: 'הקובץ יכלול 35 שורות',
      generatedAt: AT,
    })
    expect(sheet.map((row) => row[0].value)).toEqual(['דוח', 'חל על הקובץ', 'שורות בקובץ', 'הופק'])
    expect(sheet[1][1].value).toBe('תקופה 01/01/2026–17/09/2026 · כל הלקוחות')
    expect(sheet[2][1].value).toBe('הקובץ יכלול 35 שורות')
  })

  it('🔴 תווי-כיווניות בלתי-נראים נמחקים גם כאן', () => {
    const sheet = buildMetaSheet({ scope: '⁦תקופה 2026⁩', generatedAt: AT })
    expect(sheet[1][1].value).toBe('תקופה 2026')
  })

  it('שדה חסר אינו מרנדר "undefined"', () => {
    const sheet = buildMetaSheet({ generatedAt: AT })
    expect(sheet[0][1].value).toBe('—')
    expect(sheet[1][1].value).toBe('—')
  })

  it('חותמת-זמן פסולה אינה מפילה ואינה ממציאה תאריך', () => {
    const sheet = buildMetaSheet({ generatedAt: 'not-a-date' })
    expect(sheet[3][1].value).toBe('—')
  })
})

describe('exportReportRows · שני גיליונות', () => {
  it('🔴 הגיליון הראשון נשאר טבלה טהורה, והשני נושא את הפרטים', async () => {
    writeXlsxFile.mockClear()
    await exportReportRows({
      fileName: 'x.xlsx',
      sheetName: 'גיול חובות',
      columns: COLUMNS,
      rows: ROWS,
      meta: { scope: 'כל התקופות · כל הלקוחות', count: 'הקובץ יכלול 2 שורות' },
    })
    const [data, options] = writeXlsxFile.mock.calls[0]
    expect(data).toHaveLength(2)
    // שורה 1 של גיליון-הנתונים היא הכותרות — בלי שום שורת-מטא מעליה, אחרת VLOOKUP נשבר.
    expect(data[0][0].map((cell) => cell.value)).toEqual(COLUMNS.map((c) => c.label))
    expect(data[1][0][0].value).toBe('דוח')
    expect(options.sheets).toEqual(['גיול חובות', META_SHEET_NAME])
    // 🔴 האופציה שכל הייצוא העברי תלוי בה — חלה על שני הגיליונות.
    expect(options.rightToLeft).toBe(true)
    expect(options.columns).toHaveLength(2)
  })
})

describe('שלוש המחרוזות הנעולות — החוזה שהחלון והבדיקות נשענים עליו', () => {
  // 🔴 הן לא "טקסט" אלא **גבול**: `exportReportRows` זורקת אותן, `ExportBar` מזין את הסט
  // ל-`ExportDialog`, ו-`e2e/reports.spec.js` טוען על שתיים מהן. שינוי-נוסח כאן הוא
  // שינוי-מוצר, ולכן הוא חייב להפיל בדיקה ולא לעבור בשקט (`ui-copy-styleguide.md` §5).
  it('הסט מחזיק בדיוק את שלושתן', () => {
    expect([...EXPORT_LOCKED_MESSAGES].sort()).toEqual(
      [EXPORT_NO_ROWS, EXPORT_NO_TABLE, EXPORT_NO_APPROVED_RUN].sort(),
    )
  })

  it('הנוסחים זהים-בייט', () => {
    expect(EXPORT_NO_ROWS).toBe('אין שורות לייצא')
    expect(EXPORT_NO_TABLE).toBe('אין טבלה לייצוא בדף הזה')
    expect(EXPORT_NO_APPROVED_RUN).toBe('אין שורות לייצא — טרם אושרה ריצת-ניתוח')
  })
})

describe('buildExportFileName — 📐13③: שם-הקובץ נושא את הרמה הנוכחית', () => {
  it('מחבר שם-דוח · תקופה · רמת-דריל', () => {
    expect(
      buildExportFileName({
        reportName: 'גיול חובות',
        windowLabel: '01/01/2026–06/09/2026',
        drillLabel: '61–90 יום',
      }),
    ).toBe('גיול-חובות_01-01-2026–06-09-2026_61–90-יום.xlsx')
  })

  it('בלי דריל — שני מקטעים בלבד, בלי מפריד תלוי', () => {
    expect(buildExportFileName({ reportName: 'גיול חובות', windowLabel: '2026' })).toBe(
      'גיול-חובות_2026.xlsx',
    )
  })

  // 🔴 תווי-הבידוד בלתי-נראים, ולכן `windowLabel` שמגיע מ-`formatWindowLabel` היה מבריח
  // אותם לתוך שם-הקובץ — ושם הם אינם ניתנים להקלדה ואינם נראים למי שמחפש את הקובץ.
  it('מנקה תווי-בידוד ותווים אסורים במערכת-הקבצים', () => {
    expect(buildExportFileName({ reportName: 'רווחיות/פרויקטים', windowLabel: '⁦2026⁩' })).toBe(
      'רווחיות-פרויקטים_2026.xlsx',
    )
  })

  it('בלי שם כלל ⇒ ברירת-מחדל, לא קובץ בשם ריק', () => {
    expect(buildExportFileName({})).toBe('דוח.xlsx')
  })
})

describe('sanitizeSheetName — מגבלת-הפורמט של אקסל', () => {
  it('חותך ל-31 תווים ומחליף תווים אסורים', () => {
    expect(sanitizeSheetName('רווחיות/פרויקטים')).toBe('רווחיות-פרויקטים')
    expect(sanitizeSheetName('א'.repeat(40))).toHaveLength(31)
  })

  it('ריק ⇒ ברירת-מחדל, כדי שהקובץ לא ייפתח פגום', () => {
    expect(sanitizeSheetName('')).toBe('דוח')
  })
})

describe('buildExportSheet — מיפוי שורה→תא לפי ה-format של C8', () => {
  const sheet = buildExportSheet({ columns: COLUMNS, rows: ROWS })

  it('שורת-הכותרת מודגשת ונושאת את תוויות-העמודות', () => {
    expect(sheet[0]).toEqual([
      { value: 'לקוח', type: String, fontWeight: 'bold' },
      { value: 'יתרת-חוב פתוחה', type: String, fontWeight: 'bold' },
      { value: 'ימי איחור', type: String, fontWeight: 'bold' },
      { value: 'מועד פירעון', type: String, fontWeight: 'bold' },
    ])
  })

  // 🔴 ת4: *"סכומים כמספרים (לא טקסט)"*. הבדיקה המרכזית של הקובץ הזה.
  it('כסף יורד כ-Number עם פורמט, גם כשה-RPC שלח מחרוזת', () => {
    expect(sheet[1][1]).toEqual({ value: 18643, type: Number, format: '#,##0' })
    expect(sheet[2][1]).toEqual({ value: 15610, type: Number, format: '#,##0' })
  })

  it('תאריך יורד כטקסט בצורה הישראלית, לא כתא-תאריך תלוי-לוקאל', () => {
    expect(sheet[1][3]).toEqual({ value: '10/07/2026', type: String })
  })

  // ⚠️ null ⇒ תא ריק, **לא אפס** — אחרת סכום-הטור אצל הרו"ח מקבל מספר שאיש לא מדד.
  it('ערך חסר ⇒ תא ריק ולא 0', () => {
    expect(sheet[2][2]).toBeNull()
    expect(sheet[2][3]).toEqual({ value: '—', type: String })
  })
})

describe('exportReportRows — הקריאה לספרייה', () => {
  it('מעביר rightToLeft:true — האופציה שבלעדיה הקובץ נפתח הפוך', async () => {
    await exportReportRows({
      fileName: 'גיול-חובות_2026.xlsx',
      sheetName: 'גיול חובות',
      columns: COLUMNS,
      rows: ROWS,
    })
    expect(writeXlsxFile).toHaveBeenCalledTimes(1)
    const [sheets, options] = writeXlsxFile.mock.calls[0]
    expect(options.rightToLeft).toBe(true)
    expect(options.fileName).toBe('גיול-חובות_2026.xlsx')
    // ✏️ **17/09/2026 — היו `options.sheet` ו-`sheet` יחיד.** נוסף גיליון "פרטי הדוח"
    // (הכרעת-ישי), ולכן החתימה היא הרב-גיליונית של הספרייה: מערך-גיליונות + `sheets`.
    // 🔑 **מה שהבדיקה שמרה עליו לא השתנה:** `rightToLeft` ושם-הקובץ, וגיליון-הנתונים
    // שעדיין נושא שורת-כותרת ועוד שתי שורות — **בלי שום שורת-מטא מעליו.**
    expect(options.sheets[0]).toBe('גיול חובות')
    expect(sheets[0]).toHaveLength(3)
  })

  // 🔴 קובץ בן שורת-כותרת בלבד נראה כמו ייצוא שהצליח. זריקה, לא הורדה שקטה.
  // ⚠️ הזריקה **סינכרונית** ולא promise-דחוי, במכוון: אתר-הקריאה בודק את המצב לפני שהוא
  // מציג כפתור פעיל, וזריקה סינכרונית נתפסת ב-`try` רגיל בלי `await` שמישהו ישכח.
  it('בלי שורות ⇒ זורק ואינו מוריד כלום', () => {
    expect(() =>
      exportReportRows({ fileName: 'x.xlsx', sheetName: 'x', columns: COLUMNS, rows: [] }),
    ).toThrow(EXPORT_NO_ROWS)
    expect(writeXlsxFile).not.toHaveBeenCalled()
  })

  it('בלי עמודות ⇒ זורק את הנוסח האחר', () => {
    expect(() =>
      exportReportRows({ fileName: 'x.xlsx', sheetName: 'x', columns: [], rows: ROWS }),
    ).toThrow(EXPORT_NO_TABLE)
    expect(writeXlsxFile).not.toHaveBeenCalled()
  })

  // 🔴 **כל העמודות מוסתרות — השומר חייב לזרוק, לא להוריד קובץ ריק.**
  // עד 22/09/2026 השומר מדד את `columns` הגולמי ⇒ הרשימה נראתה לא-ריקה,
  // הגיליון יצא בלי אף עמודה, **והקובץ ירד כאילו הצליח** — בדיוק ההטעיה
  // ש-`EXPORT_NO_TABLE` נולד כדי למנוע. *(נמצא על-ידי סוכן-יריב, אומת ותוקן.)*
  it('🔴 כל העמודות מוסתרות ⇒ זורק, ולא מוריד קובץ בלי עמודות', () => {
    expect(() =>
      exportReportRows({
        fileName: 'x.xlsx',
        sheetName: 'x',
        columns: [{ key: 'hourly_wage', label: 'שכר שעתי', format: 'money', visible: () => false }],
        rows: ROWS,
      }),
    ).toThrow(EXPORT_NO_TABLE)
    expect(writeXlsxFile).not.toHaveBeenCalled()
  })
})

// ✏️ **תווי-בידוד אינם יוצאים לאקסל** (16/09/2026).
// 🔴 המסך מבודד טווח-ספרות כדי שלא יתהפך ב-RTL; אקסל אינו מסך, והתווים הבלתי-נראים
// נדבקים לכל `VLOOKUP` שהרו"ח יעשה על התא — ואינם נראים לעין שתחפש למה זה לא מתאים.
describe('buildExportSheet — תאי-טקסט יוצאים נקיים מתווי-כיווניות', () => {
  const sheetFor = (value, format = 'text') =>
    buildExportSheet({ columns: [{ key: 'v', label: 'ערך', format }], rows: [{ v: value }] })

  it('LRI…PDI נמחקים מערך-טקסט', () => {
    expect(sheetFor('\u20661–30\u2069')[1][0]).toEqual({ value: '1–30', type: String })
  })

  it('גם textLtr יוצא נקי', () => {
    expect(sheetFor('\u206690+\u2069', 'textLtr')[1][0]).toEqual({ value: '90+', type: String })
  })

  it('כל משפחת תווי-הכיווניות, לא רק שני הבידודים', () => {
    expect(sheetFor('\u200eא\u200fב\u202aג\u202c')[1][0]).toEqual({ value: 'אבג', type: String })
  })

  it('טקסט רגיל אינו משתנה', () => {
    expect(sheetFor('אלפא סיסטמס')[1][0]).toEqual({ value: 'אלפא סיסטמס', type: String })
  })
})

// ✏️ **פריט [19] של סבב-הראיות (17/09/2026): הרמה נאמרה פעמיים.** נמדד בריצה חיה על מ3 —
// `מגמות-רב-שנתיות_2024-·-כל-הלקוחות_2024.xlsx`, כי תווית-החלון של השרת כבר נושאת את הרמה.
describe('buildExportFileName — תווית-הדריל פעם אחת בלבד', () => {
  it('רמה שכבר נמצאת בתווית-החלון אינה נוספת כסיומת', () => {
    expect(
      buildExportFileName({
        reportName: 'מגמות רב-שנתיות',
        windowLabel: '2024 · כל הלקוחות',
        drillLabel: '2024',
      }),
    ).toBe('מגמות-רב-שנתיות_2024-·-כל-הלקוחות.xlsx')
  })

  it('גם ברמה השנייה (חודש בתוך שנה)', () => {
    expect(
      buildExportFileName({
        reportName: 'מגמות רב-שנתיות',
        windowLabel: 'ינואר 2024 · כל הלקוחות',
        drillLabel: 'ינואר 2024',
      }),
    ).toBe('מגמות-רב-שנתיות_ינואר-2024-·-כל-הלקוחות.xlsx')
  })

  // 🔑 **וזה אינו "לוותר על הרמה"** — ‏📐13③ עדיין מתקיים: הרמה בשם, פעם אחת.
  it('רמה שאינה בתווית-החלון (מ9) נשארת סיומת, כמו קודם', () => {
    expect(
      buildExportFileName({
        reportName: 'גיול חובות',
        windowLabel: 'נכון להיום',
        drillLabel: 'מדרג 90+ יום',
      }),
    ).toBe('גיול-חובות_נכון-להיום_מדרג-90+-יום.xlsx')
  })

  it('שורש (בלי רמה) לא נגע בו דבר', () => {
    expect(
      buildExportFileName({
        reportName: 'מגמות רב-שנתיות',
        windowLabel: '2024–2026 · כל הלקוחות',
        drillLabel: null,
      }),
    ).toBe('מגמות-רב-שנתיות_2024–2026-·-כל-הלקוחות.xlsx')
  })
})
