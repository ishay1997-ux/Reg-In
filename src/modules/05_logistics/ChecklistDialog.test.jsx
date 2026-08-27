// בדיקות דיאלוג-הצ'קליסט (מודול 5 · משטח 2, צעד 3.2) — שכבת-ה-api ממוקקת (אין Supabase
// בבדיקה), והמחרוזות מגיעות מ-`src/lib/projectLogistics.js` האמיתי כדי שניסוח-מחדש שקט ייפול כאן.
//
// מה נעול כאן, ולמה דווקא זה:
// · 🔴 **מרוץ-㊲** — שורת-התור אמרה "פעיל", `getChecklist` מחזירה `cancelled`. בלי הבדיקה הזאת
//   כתיבה לפרויקט מבוטל "מצליחה" בשקט (`🧱④`) והמשתמשת הולכת הביתה בטוחה שסימנה.
// · ③ — **שתי שורות של אותו מק"ט הן מצב חוקי** (הכרעת-ישי: "קורה", תגים בשני צבעים), ולדג'ר
//   §3.8 מטיל את הראיה שלה על **הפיקסצ'ר כאן** ולא על ה-seed. בלי שורה כזאת, `serial_number`
//   נשמט מכל מפתח במסך בלי שאף בדיקה תאדים — וזה בדיוק **עדכון שורה אחרת**.
// · ㊵/G8 — התג `מולא אוטומטית` נעלם ברגע ההקלדה, ומספר שהוקלד לעולם אינו נדרס.
// · כרטיס §① — לחיצה על המצב הנוכחי אינה כותבת דבר · §⑦ — שלילי נחסם ומוסבר, לא-מספר חוזר
//   בשקט, וגדול-מהמתוכנן **מותר**.
// · S-2 — כשל-כתיבה מחזיר את הערך ומציג את המשפט הנעול; `raise` עברי של השרת מוצג כפי-שהוא.
// · ⑬ — באנר-ההשלמה בשלושת ענפי-החוסר · §⑤ — למשתמשת `view` הפקדים **מוסרים**, לא מושבתים.
// · חוזה עמודת-ההגעה (25/08) בשלושת מצביה · ושימור-המיקוד אחרי קפיצת-המיון.
//
// ⚠️ הפיקסצ'רים **מעורבבים בכוונה** ולא ממוינים-מראש: רשימה שכבר ממוינת מאשרת מיון שלא רץ
// (המלכודת המדודה של 30/07).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChecklistDialog from './ChecklistDialog'
// הדיאלוג צורך useToast (ערוץ-הכשל של שמירת-הסגירה) ⇒ כל רינדור עטוף ב-Provider האמיתי.
import { ToastProvider } from '@/components/ToastProvider'
import { getChecklist, listProducts, updateLogisticsItem } from './api'
import {
  LEGAL_EMPTY_TITLE,
  NEGATIVE_QTY_SENTENCE,
  NO_PERMISSION_SENTENCE,
  BROKEN_EMPTY_DETAIL,
  LOAD_FAILURE_DETAIL,
  SORT_LINE,
  WRITE_FAILURE_SENTENCE,
} from '@/lib/projectLogistics'

vi.mock('./api', () => ({
  getChecklist: vi.fn(),
  listProducts: vi.fn(),
  updateLogisticsItem: vi.fn(),
}))

const authState = { permissions: { לוגיסטיקה: 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const PRODUCTS = [
  { sku: '01WEB', item_name: 'הקמת אתר רישום', category: 'site', unit: 'פרויקט' },
  { sku: 'B-ECO-TAG', item_name: 'תג שם אקולוגי - ממותג', category: 'product', unit: 'יחידה' },
  { sku: 'B-REG-TAG', item_name: 'תג שם רגיל - ממותג', category: 'product', unit: 'יחידה' },
  { sku: 'B-SAT-LAN', item_name: 'שרוך סאטן - ממותג', category: 'product', unit: 'יחידה' },
]

const PROJECT = {
  project_id: 15,
  quote_id: 31,
  event_name: 'ערב השקה — קמפוס צפון',
  customer_name: 'קמפוס טכנולוגי צפון בע"מ',
  final_event_date: '2026-09-08',
  project_status: 'in_progress',
  cancelled_at: null,
  cancel_reason: null,
}

function row(overrides) {
  return {
    project_id: 15,
    sku: 'B-REG-TAG',
    serial_number: 1,
    planned_qty: 150,
    actual_qty: 0,
    item_status: 'not_started',
    notes: null,
    expected_arrival_date: null,
    actual_arrival_date: null,
    actual_qty_autofilled: false,
    ...overrides,
  }
}

// ארבע שורות, שלושת מצבי-הפריט, כמויות שונות זו מזו — ובסדר-קלט שאינו סדר-התצוגה.
// הסדר הצפוי אחרי `sortLogisticsRows`: 01WEB · B-SAT-LAN (טרם החל) → B-REG-TAG (הוזמן) →
// B-ECO-TAG (מוכן). `localeCompare` מציב ספרה לפני אות.
const ROWS = [
  row({
    sku: 'B-ECO-TAG',
    planned_qty: 50,
    actual_qty: 50,
    item_status: 'ready',
    actual_qty_autofilled: true,
    actual_arrival_date: '2026-08-24',
  }),
  row({ sku: 'B-SAT-LAN', planned_qty: 150 }),
  row({
    sku: 'B-REG-TAG',
    planned_qty: 150,
    actual_qty: 20,
    item_status: 'ordered',
    expected_arrival_date: '2026-09-02',
  }),
  row({ sku: '01WEB', planned_qty: 1 }),
]

function checklist(overrides = {}) {
  return { project: PROJECT, rows: ROWS, quoteProductLines: undefined, ...overrides }
}

async function renderDialog({ envelope = checklist(), permissions } = {}) {
  authState.permissions = permissions ?? { לוגיסטיקה: 'edit' }
  getChecklist.mockResolvedValue(envelope)
  listProducts.mockResolvedValue(PRODUCTS)
  render(
    <ToastProvider>
      <ChecklistDialog projectId={15} open onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  await waitFor(() => expect(getChecklist).toHaveBeenCalledWith(15))
}

const rowOrder = () =>
  Array.from(document.querySelectorAll('[data-testid^="checklist-row-"]')).map((el) =>
    el.getAttribute('data-testid'),
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChecklistDialog — הצגה, מיון ועמודת ההגעה', () => {
  it('הכותרת · המדד · כיתוב-המיון · וסדר-השורות של sortLogisticsRows', async () => {
    await renderDialog()
    expect(await screen.findByText('ערב השקה — קמפוס צפון')).toBeInTheDocument()
    expect(screen.getByTestId('checklist-project-status')).toHaveTextContent('בתהליך')
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('1 מתוך 4')
    expect(screen.getByText(SORT_LINE)).toBeInTheDocument()
    expect(rowOrder()).toEqual([
      'checklist-row-01WEB-1',
      'checklist-row-B-SAT-LAN-1',
      'checklist-row-B-REG-TAG-1',
      'checklist-row-B-ECO-TAG-1',
    ])
  })

  it('חוזה עמודת "הגעה משוערת" — שלושת המצבים, וגליף-הריק האחיד `—`', async () => {
    await renderDialog()
    await screen.findByTestId('checklist-row-01WEB-1')

    // `טרם החל` ⇒ `—` בלבד, אין שדה.
    const notStarted = screen.getByTestId('checklist-arrival-01WEB-1')
    expect(notStarted).toHaveTextContent('—')
    expect(notStarted.querySelector('input')).toBeNull()

    // `הוזמן` ⇒ שדה-תאריך עריך.
    const ordered = screen.getByTestId('checklist-date-B-REG-TAG-1')
    expect(ordered).toHaveAttribute('type', 'date')
    expect(ordered).toHaveValue('2026-09-02')
    expect(ordered).toBeEnabled()

    // `מוכן` ⇒ תאריך-ההגעה בפועל כטקסט + הכיתוב, ולעולם לא שדה (ה-RPC חותם אותו).
    const ready = screen.getByTestId('checklist-arrival-B-ECO-TAG-1')
    expect(ready).toHaveTextContent('24/08/2026')
    expect(ready).toHaveTextContent('הגיע בפועל')
    expect(ready.querySelector('input')).toBeNull()
  })

  // 🔴 שתי שורות-ההסבר של §3.7 **מקצה-לקצה**, ולא במצביע אחד: מצביע כבר הסתיר פעם את שורת-㊵
  // בשקט (הערת-הקוד ב-`ChecklistDialog.jsx` מתעדת את זה). ההשוואה היא על `textContent` המלא,
  // ולכן שורה שתיפול — או תג-הכיתוב `מולא אוטומטית` שיילך לאיבוד — מפילה את הבדיקה.
  // ⚠️ ‏`<br/>` ו-`<span className="block">` אינם תורמים ולו תו אחד ל-`textContent` ⇒ המשפטים
  // נדבקים זה לזה (`במסך.סימון` · `ידע.מספר`), וזו הצורה המדודה שנעולה כאן — לא ניחוש.
  // הרכיב נבחר דרך טקסט-הילד-הישיר שלו: `getNodeText` של Testing Library מצרף **רק** צמתי-טקסט
  // ישירים, ולכן ההורים אינם מתחרים על ההתאמה ואין צורך ב-`data-testid` על ה-`div`.
  const EXPLAINER_TEXT = [
    'כל שינוי נשמר מיד — אין כפתור שמירה במסך.',
    'סימון מוכן ממלא את הכמות בפועל אוטומטית, רק אם עדיין לא הוקלד בה ערך.',
    ' וערך שמולא כך נושא לידו את הכיתוב "מולא אוטומטית" — שנעלם ברגע שהיא מקלידה. ',
    'מספר שנרשם כאילו נמדד, ולא נמדד, יזלוג לחישוב הרווחיות של מודול 8 בלי שאיש ידע.',
    'מספר שהקלדת לעולם אינו נדרס.',
  ].join('')

  it('§3.7 — בלוק-ההסבר שמתחת לטבלה, שתי השורות במלואן', async () => {
    await renderDialog()
    await screen.findByTestId('checklist-row-01WEB-1')
    expect(screen.getByText(/מספר שהקלדת לעולם אינו נדרס/).textContent).toBe(EXPLAINER_TEXT)
  })

  it('㉟ — `טרם החל` עם כמות בפועל > 0 מרנדר את ערך השדה, לא `0` קשיח', async () => {
    await renderDialog({
      envelope: checklist({ rows: [row({ sku: 'B-SAT-LAN', planned_qty: 12, actual_qty: 8 })] }),
    })
    const input = await screen.findByTestId('checklist-qty-B-SAT-LAN-1')
    expect(input).toHaveValue('8')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute(
      'title',
      'הפריט טרם הוזמן — הכמות בפועל נפתחת לעריכה אחרי סימון "הוזמן"',
    )
  })
})

// 🔴 ③ — הפיקסצ'ר שהלדג'ר (§3.8) מטיל דווקא כאן, ו**ה-seed אינו יכול לשאת אותו** (שורות `#107`
// הן שני מק"טים שונים). כל שאר הפיקסצ'רים בקובץ הם `serial_number: 1`, ולכן כל שורה בהם היא
// היחידה של המק"ט שלה — מצב שבו **כל מספר סידורי בעולם היה עובד**, כולל `1` מקודד-קשיח.
// 🔑 וזה בדיוק הכשל ששורת-ההערה ב-`ChecklistDialog.jsx` מזהירה ממנו — *"השמטתו אינה שגיאה אלא
// **עדכון שורה אחרת**"*: היא מתקנת כמות בתג הטורקיז, והכמות נכתבת לתג הלבן. הבדיקה הראשונה
// כותבת לכן **לשורה השנייה** דווקא, כי רק שם `serialNumber: 2` הוא טענה שאפשר להפריך.
// המק"ט זהה כי אלה **שני צבעים של אותו פריט** (③ · `logistics.color`), והצבע עצמו אינו מצויר
// בכרטיס-המסך ⇒ על המסך שתי השורות נראות **תאומות**, וההפרדה כולה נשענת על המפתח.
// ⚠️ והשורות מוזנות **הפוכות** (2 לפני 1) — רשימה שכבר ממוינת מאשרת שובר-שוויון שלא רץ.
describe('ChecklistDialog — ③ שתי שורות של אותו מק"ט', () => {
  const twoColors = [
    row({
      sku: 'B-REG-TAG',
      serial_number: 2,
      planned_qty: 40,
      actual_qty: 60,
      item_status: 'ordered',
    }),
    row({
      sku: 'B-REG-TAG',
      serial_number: 1,
      planned_qty: 150,
      actual_qty: 20,
      item_status: 'ordered',
    }),
  ]

  it('שתיהן מרונדרות, שוברות-שוויון לפי `serial_number`, והטיוטה של האחת אינה נוגעת בשנייה', async () => {
    await renderDialog({ envelope: checklist({ rows: twoColors }) })
    await screen.findByTestId('checklist-row-B-REG-TAG-1')
    expect(rowOrder()).toEqual(['checklist-row-B-REG-TAG-1', 'checklist-row-B-REG-TAG-2'])

    const first = screen.getByTestId('checklist-qty-B-REG-TAG-1')
    const second = screen.getByTestId('checklist-qty-B-REG-TAG-2')
    fireEvent.change(second, { target: { value: '35' } })
    // תא-טיוטה משותף היה מציג כאן `35` גם בשורה הראשונה — היא לא נגעה בה כלל.
    expect(first).toHaveValue('20')

    updateLogisticsItem.mockResolvedValue({
      row: { ...twoColors[0], actual_qty: 35 },
      project_status: 'in_progress',
    })
    fireEvent.blur(second)
    // 🔴 והשליחה נושאת `serialNumber: 2` — **לא 1**. זו השורה שהיא ערכה.
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-REG-TAG',
        serialNumber: 2,
        changes: { actual_qty: 35 },
      }),
    )
    expect(updateLogisticsItem).toHaveBeenCalledTimes(1)
    // והשורה שחזרה מה-RPC מוחלפת במקומה שלה: 35 בשנייה, 20 בראשונה שלא נגעו בה.
    await waitFor(() => expect(second).toHaveValue('35'))
    expect(first).toHaveValue('20')
  })

  it('כשל-כתיבה בשורה אחת מוצג תחתיה בלבד — ולא תחת אחותה בעלת אותו מק"ט', async () => {
    await renderDialog({ envelope: checklist({ rows: twoColors }) })
    const second = await screen.findByTestId('checklist-qty-B-REG-TAG-2')
    updateLogisticsItem.mockRejectedValue(new Error('שמירת עדכון הפריט נכשלה.'))
    fireEvent.change(second, { target: { value: '90' } })
    fireEvent.blur(second)
    await waitFor(() =>
      expect(screen.getByTestId('checklist-error-B-REG-TAG-2')).toHaveTextContent(
        WRITE_FAILURE_SENTENCE,
      ),
    )
    expect(screen.queryByTestId('checklist-error-B-REG-TAG-1')).toBeNull()
    expect(second).toHaveValue('60')
  })
})

describe('ChecklistDialog — ㊵ תג המילוי האוטומטי', () => {
  it('מופיע על ערך שהמערכת מילאה, ונעלם ברגע שהיא מקלידה', async () => {
    await renderDialog()
    expect(await screen.findByTestId('checklist-autofill-B-ECO-TAG-1')).toHaveTextContent(
      'מולא אוטומטית',
    )
    fireEvent.change(screen.getByTestId('checklist-qty-B-ECO-TAG-1'), { target: { value: '48' } })
    expect(screen.queryByTestId('checklist-autofill-B-ECO-TAG-1')).toBeNull()
  })

  it('G8 — הקלדת אותו מספר על ערך שמולא אוטומטית עדיין נשלחת (מרגע ההקלדה זו מדידה)', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-ECO-TAG-1')
    updateLogisticsItem.mockResolvedValue({
      row: { ...ROWS[0], actual_qty: 50, actual_qty_autofilled: false },
      project_status: 'in_progress',
    })
    // הקלדה אמיתית: מוחקת ספרה ומחזירה אותה. (‏`fireEvent.change` עם אותו ערך בדיוק אינו
    // מפעיל `onChange` ב-React — ולכן שני צעדים, כמו במקלדת.)
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.blur(input)
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-ECO-TAG',
        serialNumber: 1,
        changes: { actual_qty: 50 },
      }),
    )
    await waitFor(() => expect(screen.queryByTestId('checklist-autofill-B-ECO-TAG-1')).toBeNull())
  })
})

// 🔴 **המסך מבטיח "כל שינוי נשמר מיד" — והבדיקה הזאת היא מה שמחזיק את ההבטחה.**
// נמדד 26/08/2026 שהיא הופרה: הערה שהוקלדה ולא יצאו מהשדה **אבדה** בסגירת הדיאלוג, כי
// React אינו יורה `blur` על אלמנט ממוקד שמפורק. והכי מסוכן — זה היה **תלוי-אמצעי-קלט**:
// סגירה בעכבר הזיזה מיקוד ⇒ נשמר · סגירה במקלדת פירקה ישירות ⇒ אבד. אותה כוונה, שתי תוצאות.
describe('ChecklistDialog — הבטחת "נשמר מיד" מול סגירת הדיאלוג', () => {
  it('הערה שהוקלדה ולא יצאו ממנה — נשמרת כשהדיאלוג נסגר, ולא נעלמת', async () => {
    const onOpenChange = vi.fn()
    getChecklist.mockResolvedValue(checklist())
    listProducts.mockResolvedValue(PRODUCTS)
    updateLogisticsItem.mockResolvedValue({ row: row({ notes: 'נשלח לבית-הדפוס' }) })
    render(
      <ToastProvider>
        <ChecklistDialog projectId={15} open onOpenChange={onOpenChange} />
      </ToastProvider>,
    )
    await screen.findByTestId('checklist-row-B-SAT-LAN-1')

    const note = screen.getByTestId('checklist-note-B-SAT-LAN-1')
    fireEvent.change(note, { target: { value: 'נשלח לבית-הדפוס' } })
    note.focus()
    expect(updateLogisticsItem).not.toHaveBeenCalled()

    // הסגירה שהמשתמשת עושה — בלי לגעת בשום שדה אחר קודם.
    fireEvent.click(screen.getByTestId('checklist-close'))

    await waitFor(() => expect(updateLogisticsItem).toHaveBeenCalled())
    expect(updateLogisticsItem).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'B-SAT-LAN', changes: { notes: 'נשלח לבית-הדפוס' } }),
    )
  })

  // 🔴 הענף השני של אותה הבטחה (ממצא אודיט-הסגירה 26/08/2026): שמירת-הסגירה **נכשלת** אחרי
  // שהדיאלוג פורק ⇒ שורת-השגיאה של השורה כבר לא קיימת, ובלי ערוץ חלופי הכשל נבלע והערך
  // אובד בשקט — בדיוק ה"נשמר" הכוזב שהמודול נבנה נגדו. הערוץ: טוסט-שגיאה מתמיד.
  it('שמירת-סגירה שנכשלה אחרי הפירוק — מדווחת בטוסט-שגיאה, לא נבלעת', async () => {
    authState.permissions = { לוגיסטיקה: 'edit' }
    getChecklist.mockResolvedValue(checklist())
    listProducts.mockResolvedValue(PRODUCTS)
    let rejectSave
    updateLogisticsItem.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject
        }),
    )
    const { rerender } = render(
      <ToastProvider>
        <ChecklistDialog projectId={15} open onOpenChange={vi.fn()} />
      </ToastProvider>,
    )
    await screen.findByTestId('checklist-row-B-SAT-LAN-1')

    const note = screen.getByTestId('checklist-note-B-SAT-LAN-1')
    fireEvent.change(note, { target: { value: 'הערה שתאבד' } })
    fireEvent.blur(note)
    await waitFor(() => expect(updateLogisticsItem).toHaveBeenCalled())

    // הדיאלוג נסגר בזמן שהשמירה עוד באוויר — הגוף פורק, aliveRef כבה.
    rerender(
      <ToastProvider>
        <ChecklistDialog projectId={15} open={false} onOpenChange={vi.fn()} />
      </ToastProvider>,
    )
    // ועכשיו השמירה נכשלת. בלי התיקון: אין שום זכר לכשל על המסך.
    rejectSave(new Error('network down'))
    // תקלת-רשת בלי code ⇒ המשפט הנעול S-2, עם שם-הפריט כזיהוי.
    expect(await screen.findByText(/שרוך סאטן.*העדכון לא נשמר/)).toBeInTheDocument()
  })

  // כרטיס §② (שורת "מדד השיבוץ"): *"בלעדיו סימון הפריט האחרון לא יקדם את הפרויקט; זה נאמר
  // בהודעה ברגע שזה קורה"* — ההשמטה שנתפסה באודיט-הסגירה (C-3) ונבנתה בהכרעת-ישי 27/08/2026.
  it('סימון הפריט האחרון כשחסרה דיילת — באנר-ענבר "לא עבר למוכן לביצוע", ולא הבאנר הירוק', async () => {
    const almostReady = [
      row({
        sku: 'B-ECO-TAG',
        planned_qty: 50,
        actual_qty: 50,
        item_status: 'ready',
        actual_arrival_date: '2026-08-24',
      }),
      row({ sku: 'B-SAT-LAN', planned_qty: 150, actual_qty: 20, item_status: 'ordered' }),
    ]
    await renderDialog({ envelope: checklist({ rows: almostReady }) })
    await screen.findByTestId('checklist-row-B-SAT-LAN-1')

    // ה-RPC מחזיר את השורה מוכנה — אבל הפרויקט נשאר `in_progress` (האיוש חסר; הטריגר דורש שניהם).
    updateLogisticsItem.mockResolvedValue({
      row: row({
        sku: 'B-SAT-LAN',
        planned_qty: 150,
        actual_qty: 150,
        item_status: 'ready',
        actual_qty_autofilled: true,
      }),
      project_status: 'in_progress',
    })
    fireEvent.click(screen.getByTestId('checklist-status-B-SAT-LAN-1-ready'))

    const hold = await screen.findByTestId('checklist-banner-staffing-hold')
    expect(hold).toHaveTextContent(
      'כל הפריטים מוכנים — אך הפרויקט לא עבר ל"מוכן לביצוע": צוות הדיילות טרם הושלם.',
    )
    // ולא הבאנר הירוק — הפרויקט באמת לא התקדם.
    expect(screen.queryByTestId('checklist-banner-complete')).toBeNull()

    // הודעת-רגע, לא מדד קבוע: שמירת הערה רגילה אחריה מכבה את הבאנר.
    updateLogisticsItem.mockResolvedValue({
      row: row({
        sku: 'B-SAT-LAN',
        planned_qty: 150,
        actual_qty: 150,
        item_status: 'ready',
        notes: 'הערה',
      }),
      project_status: 'in_progress',
    })
    const note = screen.getByTestId('checklist-note-B-SAT-LAN-1')
    fireEvent.change(note, { target: { value: 'הערה' } })
    fireEvent.blur(note)
    await waitFor(() => expect(screen.queryByTestId('checklist-banner-staffing-hold')).toBeNull())
  })
})

describe('ChecklistDialog — מסלול-הכתיבה', () => {
  it('כרטיס §① — לחיצה על המצב הנוכחי אינה כותבת דבר; לחיצה על מצב אחר כותבת', async () => {
    await renderDialog()
    await screen.findByTestId('checklist-row-01WEB-1')

    fireEvent.click(screen.getByTestId('checklist-status-01WEB-1-not_started'))
    expect(updateLogisticsItem).not.toHaveBeenCalled()

    updateLogisticsItem.mockResolvedValue({
      row: row({ sku: '01WEB', planned_qty: 1, item_status: 'ordered' }),
      project_status: 'in_progress',
    })
    fireEvent.click(screen.getByTestId('checklist-status-01WEB-1-ordered'))
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: '01WEB',
        serialNumber: 1,
        changes: { item_status: 'ordered' },
      }),
    )
  })

  it('§⑦ — שלילי נחסם לפני השליחה, מוסבר, והערך חוזר לקודם', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    fireEvent.change(input, { target: { value: '-5' } })
    fireEvent.blur(input)
    expect(updateLogisticsItem).not.toHaveBeenCalled()
    expect(screen.getByTestId('checklist-error-B-REG-TAG-1')).toHaveTextContent(
      NEGATIVE_QTY_SENTENCE,
    )
    expect(input).toHaveValue('20')
  })

  it('§⑦ — לא-מספר חוזר לקודם בשקט (בלי כתיבה ובלי הודעה)', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    fireEvent.change(input, { target: { value: 'שלוש' } })
    fireEvent.blur(input)
    expect(updateLogisticsItem).not.toHaveBeenCalled()
    expect(screen.queryByTestId('checklist-error-B-REG-TAG-1')).toBeNull()
    expect(input).toHaveValue('20')
  })

  it('§⑦ — כמות גדולה מהמתוכננת מותרת ונשלחת', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    updateLogisticsItem.mockResolvedValue({
      row: { ...ROWS[2], actual_qty: 200 },
      project_status: 'in_progress',
    })
    fireEvent.change(input, { target: { value: '200' } })
    fireEvent.blur(input)
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-REG-TAG',
        serialNumber: 1,
        changes: { actual_qty: 200 },
      }),
    )
    expect(screen.queryByTestId('checklist-error-B-REG-TAG-1')).toBeNull()
  })

  it('הערה נשמרת ב-blur; מחיקתה נשלחת כמחרוזת ריקה', async () => {
    await renderDialog({
      envelope: checklist({
        rows: [row({ sku: 'B-REG-TAG', item_status: 'ordered', notes: 'הוזמן בבית-הדפוס' })],
      }),
    })
    const note = await screen.findByTestId('checklist-note-B-REG-TAG-1')
    expect(note).toHaveAttribute('placeholder', 'הערה חופשית — מה שכדאי שמנהלת הפרויקטים תדע')
    updateLogisticsItem.mockResolvedValue({
      row: row({ sku: 'B-REG-TAG', item_status: 'ordered', notes: '' }),
      project_status: 'in_progress',
    })
    fireEvent.change(note, { target: { value: '' } })
    fireEvent.blur(note)
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-REG-TAG',
        serialNumber: 1,
        changes: { notes: '' },
      }),
    )
  })

  it('G9 — ניקוי תאריך-ההגעה נשלח כ-null', async () => {
    await renderDialog()
    const date = await screen.findByTestId('checklist-date-B-REG-TAG-1')
    updateLogisticsItem.mockResolvedValue({
      row: { ...ROWS[2], expected_arrival_date: null },
      project_status: 'in_progress',
    })
    fireEvent.change(date, { target: { value: '' } })
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-REG-TAG',
        serialNumber: 1,
        changes: { expected_arrival_date: null },
      }),
    )
  })

  it('S-2 — כשל-כתיבה בלי קוד-שרת מחזיר את הערך ומציג את המשפט הנעול', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    updateLogisticsItem.mockRejectedValue(new Error('שמירת עדכון הפריט נכשלה.'))
    fireEvent.change(input, { target: { value: '90' } })
    fireEvent.blur(input)
    await waitFor(() =>
      expect(screen.getByTestId('checklist-error-B-REG-TAG-1')).toHaveTextContent(
        WRITE_FAILURE_SENTENCE,
      ),
    )
    expect(input).toHaveValue('20')
  })

  it('‏`raise` עברי של השרת מוצג כפי-שהוא ואינו מנוסח מחדש', async () => {
    await renderDialog()
    const input = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    const serverError = new Error('כמות בפועל אינה יכולה להיות שלילית.')
    serverError.code = 'P0001'
    updateLogisticsItem.mockRejectedValue(serverError)
    fireEvent.change(input, { target: { value: '90' } })
    fireEvent.blur(input)
    await waitFor(() =>
      expect(screen.getByTestId('checklist-error-B-REG-TAG-1')).toHaveTextContent(
        'כמות בפועל אינה יכולה להיות שלילית.',
      ),
    )
  })

  it('הצלחה רגילה — שלושת האפקטים יחד: תג-המצב, המדד בכותרת, וקפיצת-המיון עם המיקוד', async () => {
    await renderDialog()
    await screen.findByTestId('checklist-row-01WEB-1')
    updateLogisticsItem.mockResolvedValue({
      row: row({ sku: '01WEB', planned_qty: 1, item_status: 'ready', actual_qty: 1 }),
      project_status: 'in_progress',
    })
    expect(rowOrder()[0]).toBe('checklist-row-01WEB-1')
    // 🔴 המצב **לפני**, כדי שמה שנבדק אחר-כך יהיה מעבר ולא צילום: כרטיס-המסך מגדיר את
    // ענף-ההצלחה כשלושה אפקטים, וקפיצת-המיון לבדה הייתה עוברת גם אם השניים האחרים קפאו.
    expect(screen.getByTestId('checklist-item-status-01WEB-1')).toHaveTextContent('טרם החל')
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('1 מתוך 4')
    fireEvent.click(screen.getByTestId('checklist-status-01WEB-1-ready'))
    // השורה אכן קפצה ממקום ראשון לקבוצת ה-`מוכן` (המיון הוא ערוץ-מידע — זו ההפתעה הידועה).
    // שובר-השוויון בתוך הקבוצה הוא `sku`, ו-`localeCompare` מציב `01WEB` לפני `B-ECO-TAG`.
    await waitFor(() => expect(rowOrder()[2]).toBe('checklist-row-01WEB-1'))
    expect(rowOrder()).toEqual([
      'checklist-row-B-SAT-LAN-1',
      'checklist-row-B-REG-TAG-1',
      'checklist-row-01WEB-1',
      'checklist-row-B-ECO-TAG-1',
    ])
    // …והמיקוד נשאר על הפקד שנלחץ, כי הוא העוגן הוויזואלי שלה וקורא-המסך זקוק לו.
    // 🐞 **`waitFor` ולא `expect` יבש — תוקן 27/08/2026 אחרי שתי נפילות באותו יום.**
    // שחזור-המיקוד קורה ב-effect **אחרי** המיון-מחדש, ואילו ההשוואה הייתה סינכרונית ⇒
    // תחת עומס-מעבד היא רצה לפני שה-effect התחייב, ו-`activeElement` עדיין היה
    // כפתור-הסגירה של Radix (שמקבל מיקוד בפתיחת הדיאלוג).
    // 🔑 **וההוכחה שזו שבריריות ולא רגרסיה: אותו SHA בדיוק (`7eba407`) נכשל בריצת-CI
    // אחת ועבר בשנייה, דקות זו מזו.** בלי הפרש-קוד אפשרי.
    // ⚠️ **וזה אינו ריכוך:** הטענה זהה — אותו אלמנט בדיוק — רק מותר לה להמתין
    // ל-effect. שחזור-מיקוד שבאמת נשבר עדיין מפיל את הבדיקה ב-timeout.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('checklist-status-01WEB-1-ready')),
    )
    // ㉘ — תג-מצב-הפריט שבשורה התהפך לתווית החדשה (`LOGISTICS_STATUS_LABELS.ready`).
    expect(screen.getByTestId('checklist-item-status-01WEB-1')).toHaveTextContent('מוכן')
    // …והמדד שבכותרת נספר מחדש מאותה שורה שחזרה מה-RPC: 1 ⇒ 2 מתוך 4.
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('2 מתוך 4')
  })
})

describe('ChecklistDialog — ⑬ באנר ההשלמה', () => {
  const completionRows = [
    row({ sku: 'B-REG-TAG', planned_qty: 200, actual_qty: 200, item_status: 'ready' }),
    row({ sku: 'B-SAT-LAN', planned_qty: 200, actual_qty: 120, item_status: 'ordered' }),
  ]

  async function markLastReady(returnedRow) {
    await renderDialog({ envelope: checklist({ rows: completionRows }) })
    await screen.findByTestId('checklist-row-B-SAT-LAN-1')
    updateLogisticsItem.mockResolvedValue({ row: returnedRow, project_status: 'ready' })
    fireEvent.click(screen.getByTestId('checklist-status-B-SAT-LAN-1-ready'))
    return screen.findByTestId('checklist-banner-complete')
  }

  it('חוסר בפריט אחד — שם-הפריט במרכאות (O-5)', async () => {
    const banner = await markLastReady(
      row({ sku: 'B-SAT-LAN', planned_qty: 200, actual_qty: 120, item_status: 'ready' }),
    )
    expect(banner).toHaveTextContent('הפרויקט עבר ל"מוכן לביצוע" ויצא מרשימת העבודה שלך.')
    expect(banner).toHaveTextContent('כל הפריטים סומנו מוכנים והאיוש מלא.')
    expect(screen.getByTestId('checklist-shortfall').textContent).toBe(
      'נרשם חוסר של 80 יחידות ב"שרוך סאטן - ממותג" — הוא מתועד ואינו עוצר את הפרויקט.',
    )
  })

  // 🔴 חוסר של **יחידה אחת** — הצורה שלא צוירה מעולם (המוקאפ צייר 80) ולכן הודפסה
  // "‏1 יחידות". נעולה כאן לפי העוגן של ישי `O-5`, שנתן לאח-התאום את אותה צורה בדיוק
  // (`יחידה אחת עדיין בדרך`). ⚠️ הענף חייב להיגזר מ-`units` ולא מ-`items`.
  it('חוסר של יחידה אחת — "יחידה אחת", לעולם לא "1 יחידות" (עוגן O-5)', async () => {
    await markLastReady(
      row({ sku: 'B-SAT-LAN', planned_qty: 200, actual_qty: 199, item_status: 'ready' }),
    )
    expect(screen.getByTestId('checklist-shortfall').textContent).toBe(
      'נרשם חוסר של יחידה אחת ב"שרוך סאטן - ממותג" — הוא מתועד ואינו עוצר את הפרויקט.',
    )
  })

  it('אין חוסר — משפט-החוסר מושמט לגמרי', async () => {
    const banner = await markLastReady(
      row({ sku: 'B-SAT-LAN', planned_qty: 200, actual_qty: 200, item_status: 'ready' }),
    )
    expect(banner).toBeInTheDocument()
    expect(screen.queryByTestId('checklist-shortfall')).toBeNull()
  })

  it('חוסר בכמה פריטים — מונה-פריטים במקום שם', async () => {
    await renderDialog({
      envelope: checklist({
        rows: [
          row({ sku: 'B-REG-TAG', planned_qty: 200, actual_qty: 180, item_status: 'ready' }),
          row({ sku: 'B-ECO-TAG', planned_qty: 100, actual_qty: 90, item_status: 'ready' }),
          row({ sku: 'B-SAT-LAN', planned_qty: 50, actual_qty: 50, item_status: 'ordered' }),
        ],
      }),
    })
    await screen.findByTestId('checklist-row-B-SAT-LAN-1')
    updateLogisticsItem.mockResolvedValue({
      row: row({ sku: 'B-SAT-LAN', planned_qty: 50, actual_qty: 50, item_status: 'ready' }),
      project_status: 'ready',
    })
    fireEvent.click(screen.getByTestId('checklist-status-B-SAT-LAN-1-ready'))
    await screen.findByTestId('checklist-banner-complete')
    expect(screen.getByTestId('checklist-shortfall').textContent).toBe(
      'נרשם חוסר של 30 יחידות ב-2 פריטים — הוא מתועד ואינו עוצר את הפרויקט.',
    )
  })

  it('הבאנר אינו נדלק שוב על פרויקט שכבר היה `ready` — הוא מדווח על מעבר, לא על מצב', async () => {
    await renderDialog({
      envelope: checklist({
        project: { ...PROJECT, project_status: 'ready' },
        rows: [row({ sku: 'B-REG-TAG', planned_qty: 10, actual_qty: 10, item_status: 'ready' })],
      }),
    })
    await screen.findByTestId('checklist-row-B-REG-TAG-1')
    updateLogisticsItem.mockResolvedValue({
      row: row({ sku: 'B-REG-TAG', planned_qty: 10, actual_qty: 9, item_status: 'ready' }),
      project_status: 'ready',
    })
    fireEvent.change(screen.getByTestId('checklist-qty-B-REG-TAG-1'), { target: { value: '9' } })
    fireEvent.blur(screen.getByTestId('checklist-qty-B-REG-TAG-1'))
    await waitFor(() => expect(updateLogisticsItem).toHaveBeenCalled())
    expect(screen.queryByTestId('checklist-banner-complete')).toBeNull()
  })
})

describe('ChecklistDialog — ㊲ מרוץ-הביטול ונעילת ㉝/㊴', () => {
  const cancelledEnvelope = {
    project: {
      ...PROJECT,
      project_id: 13,
      event_name: 'ערב לקוחות VIP',
      project_status: 'cancelled',
      cancelled_at: '2026-08-11',
      cancel_reason: 'הלקוח דחה את האירוע לרבעון הבא',
    },
    rows: [
      row({
        project_id: 13,
        sku: 'B-REG-TAG',
        item_status: 'ordered',
        expected_arrival_date: '2026-09-02',
      }),
      row({ project_id: 13, sku: 'B-SAT-LAN', planned_qty: 40 }),
    ],
    quoteProductLines: undefined,
  }

  it('שורת-התור אמרה "פעיל" — `getChecklist` מחזירה `cancelled` ⇒ באנר, נעילה, ופתח ㊴ יחיד', async () => {
    await renderDialog({ envelope: cancelledEnvelope })
    const banner = await screen.findByTestId('checklist-banner-cancelled')
    expect(banner).toHaveTextContent('האירוע בוטל ב-11/08/2026 — הפרויקט נעול לעריכה.')
    expect(banner).toHaveTextContent('הסיבה שנרשמה: "הלקוח דחה את האירוע לרבעון הבא".')
    // ✅ O-4 — הנוסח המתוקן, ולא המצויר ("מצב, כמות או הערה") שסתר את ㊴.
    expect(banner).toHaveTextContent('אין לעדכן מצב או הערה בפרויקט מבוטל.')
    expect(banner).toHaveTextContent('אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים.')

    // כפתורי-המצב: מושבתים, גלויים ומנומקים (㉚) — ולא מוסרים.
    for (const status of ['not_started', 'ordered', 'ready']) {
      const button = screen.getByTestId(`checklist-status-B-REG-TAG-1-${status}`)
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'הפרויקט בוטל — לא ניתן לעדכן')
    }
    // ההערה נעולה, ותאריך-ההגעה נעול (S-6 — המוקאפ צייר אותו פתוח, וזה גליץ' מדווח).
    expect(screen.getByTestId('checklist-note-B-REG-TAG-1')).toBeDisabled()
    expect(screen.getByTestId('checklist-date-B-REG-TAG-1')).toBeDisabled()
    // 🔓 ㊴ — הכמות בפועל היא הפקד היחיד שנשאר פתוח, ומנומק.
    const qty = screen.getByTestId('checklist-qty-B-REG-TAG-1')
    expect(qty).toBeEnabled()
    expect(qty).toHaveAttribute('title', 'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)')
    // ומצב-הפריט עדיין חוסם: `טרם החל` נשאר מושבת גם תחת ㊴ (㉕ — עריך ב`הוזמן`/`מוכן` בלבד).
    expect(screen.getByTestId('checklist-qty-B-SAT-LAN-1')).toBeDisabled()
    // §⑧-9ב — שורת-המשנה מושמטת בתצוגה המבוטלת; המדד נשאר כי הוא עובדה.
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('0 מתוך 2')
    expect(screen.queryByText('2 פריטים טרם מוכנים')).toBeNull()
    expect(screen.getByTestId('checklist-locked-note')).toBeInTheDocument()
  })

  it('㊴ — כתיבת כמות על פרויקט מבוטל אכן נשלחת', async () => {
    await renderDialog({ envelope: cancelledEnvelope })
    const qty = await screen.findByTestId('checklist-qty-B-REG-TAG-1')
    updateLogisticsItem.mockResolvedValue({
      row: { ...cancelledEnvelope.rows[0], actual_qty: 150 },
      project_status: 'cancelled',
    })
    fireEvent.change(qty, { target: { value: '150' } })
    fireEvent.blur(qty)
    await waitFor(() =>
      expect(updateLogisticsItem).toHaveBeenCalledWith({
        projectId: 15,
        sku: 'B-REG-TAG',
        serialNumber: 1,
        changes: { actual_qty: 150 },
      }),
    )
  })

  it('אירוע שהסתיים — כל פקדי-הכתיבה נעולים, כולל הכמות (㊴ חלה על `cancelled` בלבד)', async () => {
    await renderDialog({
      envelope: checklist({
        project: { ...PROJECT, project_status: 'event_finished' },
        rows: [row({ sku: 'B-REG-TAG', item_status: 'ordered', actual_qty: 20 })],
      }),
    })
    expect(await screen.findByTestId('checklist-banner-closed')).toHaveTextContent(
      'האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.',
    )
    expect(screen.getByTestId('checklist-qty-B-REG-TAG-1')).toBeDisabled()
    expect(screen.getByTestId('checklist-note-B-REG-TAG-1')).toBeDisabled()
    expect(screen.getByTestId('checklist-status-B-REG-TAG-1-ready')).toBeDisabled()
  })
})

describe('ChecklistDialog — §⑤ תפקיד-צפייה', () => {
  it('פקדי-הכתיבה מוסרים מהמסך (לא מושבתים), והערכים מוצגים כטקסט', async () => {
    await renderDialog({ permissions: { לוגיסטיקה: 'view' } })
    await screen.findByTestId('checklist-row-01WEB-1')

    expect(document.querySelectorAll('[data-testid^="checklist-status-"]')).toHaveLength(0)
    // אף שדה-קלט אינו קיים כלל בדיאלוג — לא מושבת, לא מוסתר: **מוסר**.
    expect(document.querySelectorAll('input')).toHaveLength(0)
    expect(screen.queryByTestId('checklist-qty-B-REG-TAG-1')).toBeNull()
    expect(screen.queryByTestId('checklist-note-B-REG-TAG-1')).toBeNull()
    expect(screen.queryByTestId('checklist-date-B-REG-TAG-1')).toBeNull()

    expect(screen.getByTestId('checklist-qty-text-B-REG-TAG-1')).toHaveTextContent('20')
    expect(screen.getByTestId('checklist-date-text-B-REG-TAG-1')).toHaveTextContent('02/09/2026')
    expect(screen.getByTestId('checklist-note-text-B-REG-TAG-1')).toHaveTextContent('—')
    // עמודה שכל תאיה ריקים אינה נשארת על המסך (מעבר-המלאי: "אין תפקיד ⇒ נמחק").
    expect(screen.queryByText('עדכון מצב')).toBeNull()
  })
})

describe('ChecklistDialog — מצבי ריק, חסימה וכשל-טעינה', () => {
  it('ריק כדין — המשפט הנעול, ובלי כפתור "הוסף פריט"', async () => {
    await renderDialog({ envelope: checklist({ rows: [], quoteProductLines: 0 }) })
    expect(await screen.findByTestId('checklist-state-legal-empty')).toHaveTextContent(
      LEGAL_EMPTY_TITLE,
    )
    expect(screen.queryByText(/הוסף פריט/)).toBeNull()
  })

  it('ריק שבור — נוסח שונה מהריק-כדין, והמדד מציג `—` ולא `0 מתוך 0`', async () => {
    await renderDialog({ envelope: checklist({ rows: [], quoteProductLines: 3 }) })
    expect(await screen.findByTestId('checklist-state-broken')).toHaveTextContent(
      BROKEN_EMPTY_DETAIL,
    )
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('—')
    expect(screen.getByTestId('checklist-metric')).not.toHaveTextContent('0 מתוך 0')
  })

  it('חוסר-הרשאה — `quoteProductLines === null` ⇒ הענף הבטוח, והמדד חסום', async () => {
    await renderDialog({ envelope: checklist({ rows: [], quoteProductLines: null }) })
    expect(await screen.findByTestId('checklist-state-no-permission')).toHaveTextContent(
      NO_PERMISSION_SENTENCE,
    )
    expect(screen.getByTestId('checklist-metric')).toHaveTextContent('—')
  })

  it('מצב-טעינה — שלד-הטבלה המשותף (4×5), ולא ספינר ולא דיאלוג ריק', async () => {
    authState.permissions = { לוגיסטיקה: 'edit' }
    // הבטחה שלעולם אינה נפתרת ⇒ ‏`Promise.all` שבטעינה תקוע, והמסך נשאר בענף-הטעינה.
    getChecklist.mockReturnValue(new Promise(() => {}))
    listProducts.mockResolvedValue(PRODUCTS)
    render(
      <ToastProvider>
        <ChecklistDialog projectId={15} open onOpenChange={vi.fn()} />
      </ToastProvider>,
    )

    // 🔴 השלד מגיע מ-`LoadingOrError` — **הרכיב-המשותף היחיד** לשלד-טעינה בפרויקט
    // (`src/CLAUDE.md`), ולא שלד מקומי של המודול. הצורה שנעולה: `variant:'table'`, 4×5.
    const skeleton = await screen.findByTestId('skeleton-table')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton.children).toHaveLength(4)
    expect(skeleton.children[0].children).toHaveLength(5)
    // השלד עצמו דקורטיבי ⇒ בלי ההכרזה ה-sr-only שלצידו קורא-מסך אינו שומע דבר.
    const status = screen.getByRole('status')
    expect(status).toContainElement(skeleton)
    expect(status).toHaveTextContent('טוען...')

    // 🚫 ולא "דיאלוג ריק": אין שורות-פריט, אין כפתור-סגירה ואין מסך-שגיאה — והדיאלוג
    // בכל זאת נושא שם נגיש כל זמן הטעינה.
    expect(document.querySelectorAll('[data-testid^="checklist-row-"]')).toHaveLength(0)
    expect(screen.queryByTestId('checklist-close')).toBeNull()
    expect(screen.queryByTestId('checklist-state-error')).toBeNull()
    expect(screen.getByText('צ׳קליסט הפרויקט')).toBeInTheDocument()
  })

  it('כשל-טעינה — הכותרת הנעולה + פירוט + "נסי שוב" (נקבה), וניסיון חוזר קורא שוב', async () => {
    getChecklist.mockRejectedValueOnce(new Error('boom'))
    listProducts.mockResolvedValue(PRODUCTS)
    authState.permissions = { לוגיסטיקה: 'edit' }
    render(
      <ToastProvider>
        <ChecklistDialog projectId={15} open onOpenChange={vi.fn()} />
      </ToastProvider>,
    )
    const state = await screen.findByTestId('checklist-state-error')
    expect(state).toHaveTextContent('לא ניתן לטעון את הנתונים.')
    expect(state).toHaveTextContent(LOAD_FAILURE_DETAIL)
    getChecklist.mockResolvedValue(checklist())
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    await screen.findByTestId('checklist-row-01WEB-1')
  })
})
