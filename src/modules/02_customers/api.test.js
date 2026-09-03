// בדיקות-יחידה ל-`api.js` של מודול 2 (לקוחות) — קובץ חדש, נכתב בתוך N2 (02/09/2026,
// ‏ishay/n2-contacts-rewire). עד כה לא היה קובץ בדיקה ל-`api.js` של מודול זה כלל — לפי
// ההערה בראש `05_logistics/api.test.js`, שני המודולים היחידים בלי api.test.js היו 02 ו-03,
// וזו הייתה שתיקה ולא מוסכמה. ההיקף כאן ממוקד במה ש-N2 שינתה בפועל: שלושת ה-select-ים
// שמצרפים `customer_contacts` (עם `is_primary`), ו-`replaceCustomerContacts` שעברה מכתיבה
// ישירה (insert-then-delete) ל-RPC אחד — `replace_customer_contacts`
// (‏supabase/migrations/20260902141451_n2b_replace_customer_contacts_rpc.sql).
//
// ⚠️ **ה-RPC הזה טרם הוחל על ה-DB** (ממתין לשער-ההקלדה של ישי, לפי ראש קובץ המיגרציה) —
// הבדיקות כאן מדמות (`vi.fn`) את `supabase.rpc` בלבד ואינן ראיה לכך שהוא רץ נכון מול מסד
// אמיתי. שום דבר כאן לא מחליף את האימות-החי אחרי ההחלה.
//
// מוק ל-`@/supabaseClient` חובה (התבנית הקיימת בכל api.test.js אחר בריפו — `supabaseClient.js`
// קורא ל-`createClient(import.meta.env.VITE_SUPABASE_URL, …)` בזמן-טעינה, ונכשל-בטעינה בלי
// `.env.local`, למשל ב-CI). ‏`./api` מייבאת גם `@/modules/06_projects/api` (ל-`getProjectChanges`
// ול-`rpcErrorMessage`, N2) — לא ממוקה: `05_logistics/api.test.js` מעתיק את אותה גישה (מייבא
// `getQuote` האמיתי מ-03_quotes/api) כי כל הפונקציות שם בסופו-של-דבר נשענות על אותו `supabase`
// הממוק, ולא על משתני-סביבה משלהן.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

// הקורא-המשותף מדומה ישירות: `getCustomerScreenParams` עברה אליו 03/09/2026 (ממצא F-7),
// ומה שהבדיקות כאן צריכות לאמת הוא **החוזה מולו** — לא את שאילתת-ה-Supabase שבתוכו,
// שכבר מכוסה ב-`src/api/params.test.js`.
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))

import { supabase } from '@/supabaseClient'
import { getParamValues } from '@/api/params'
import {
  listCustomers,
  getCustomer,
  getConsentedCustomers,
  replaceCustomerContacts,
  getCustomerScreenParams,
} from './api'

// בילדר-שרשרתי מזערי לצורך שלוש בדיקות-ה-select — לא בילדר-התור-פר-טבלה המלא של
// 04_hostesses/05_logistics/06_projects (שם יש כמה טבלאות בו-זמנית באותה בדיקה; כאן, בכל
// בדיקת-select, יש קריאה אחת בלבד ל-`.from('customers')`, אז די בלכידת ה-select שהועבר).
function selectSpyBuilder(finalResult) {
  const builder = {}
  let capturedSelect = null
  for (const method of ['eq', 'order']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.select = vi.fn((arg) => {
    capturedSelect = arg
    return builder
  })
  builder.maybeSingle = vi.fn(() => Promise.resolve(finalResult))
  builder.then = (resolve, reject) => Promise.resolve(finalResult).then(resolve, reject)
  return { builder, getSelect: () => capturedSelect }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('קריאות — ה-select-ים מצרפים customer_contacts עם is_primary (N2)', () => {
  it('listCustomers מצרפת contact_id/contact_name/phone/email/is_primary, לא רק contact_name', async () => {
    const { builder, getSelect } = selectSpyBuilder({ data: [], error: null })
    supabase.from.mockImplementation((table) => {
      expect(table).toBe('customers')
      return builder
    })

    await listCustomers()

    const select = getSelect()
    expect(select).toContain('customer_contacts(')
    expect(select).toContain('is_primary')
    expect(select).toContain('contact_id')
    expect(select).toContain('contact_name')
    expect(select).toContain('phone')
    expect(select).toContain('email')
    // ⚠️ לא רק "יש is_primary איפשהו במחרוזת" — צריך שהוא יהיה *בתוך* ה-embed של
    // customer_contacts, לא עמודה שטוחה בטעות על customers עצמה.
    expect(select).toMatch(/customer_contacts\([^)]*is_primary[^)]*\)/)
  })

  it('getCustomer מצרפת את אותו embed — עד N2 היא לא צירפה אנשי-קשר בכלל', async () => {
    const { builder, getSelect } = selectSpyBuilder({ data: null, error: null })
    supabase.from.mockImplementation((table) => {
      expect(table).toBe('customers')
      return builder
    })

    await getCustomer(1)

    const select = getSelect()
    expect(select).toMatch(/customer_contacts\([^)]*is_primary[^)]*\)/)
    expect(select).toContain('phone')
    expect(select).toContain('email')
  })

  it('getConsentedCustomers מצרפת customer_contacts, ולא בוחרת contact_name/email כעמודות שטוחות', async () => {
    const { builder, getSelect } = selectSpyBuilder({ data: [], error: null })
    supabase.from.mockImplementation((table) => {
      expect(table).toBe('customers')
      return builder
    })

    await getConsentedCustomers()

    const select = getSelect()
    expect(select).toMatch(/customer_contacts\([^)]*is_primary[^)]*\)/)
    // שתי העמודות שעומדות להימחק (N2ב הבאה) לא נבחרות עוד ישירות בשמן — כדי שהמחיקה
    // העתידית לא תשבור את ה-select הזה. ⚠️ קודם מסירים את ה-embed כולו (כולל תוכנו —
    // הוא *כן* מכיל contact_name/email, ובכוונה), ורק אז בודקים עמודות-שטוחות בשם מלא —
    // לא תת-מחרוזת, שלא ייתפס "contact_name" בטעות בגלל הפסיקים שבתוך ה-embed.
    const withoutEmbed = select.replace(/customer_contacts\([^)]*\)/, '')
    const flatColumns = withoutEmbed.split(',').map((s) => s.trim())
    expect(flatColumns).not.toContain('contact_name')
    expect(flatColumns).not.toContain('email')
  })
})

describe('replaceCustomerContacts — RPC יחיד במקום insert-then-delete (N2ב)', () => {
  it('שולחת ל-RPC בדיוק p_customer_id + p_contacts, שורה-לשורה עם is_primary', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ contact_id: 1, contact_name: 'דנה כהן', is_primary: true }],
      error: null,
    })

    const contacts = [
      { contact_name: '  דנה כהן  ', phone: '050-1112222', email: 'dana@x.co', is_primary: true },
      { contact_name: 'רון גל', phone: null, email: undefined, is_primary: false },
    ]
    await replaceCustomerContacts(47, contacts)

    expect(supabase.rpc).toHaveBeenCalledTimes(1)
    const [fnName, args] = supabase.rpc.mock.calls[0]
    expect(fnName).toBe('replace_customer_contacts')
    // ⚠️ בכוונה לא בודקים חיתוך-רווחים/המרת-''-ל-null כאן: ה-RPC מנרמל את זה בעצמו
    // (btrim + nullif בגוף `replace_customer_contacts`), והפונקציה כאן לא משכפלת את
    // הנירמול — רק ממירה null/undefined ל-null מפורש ו-is_primary לבוליאני. הבדיקה
    // הבאה (`is_primary חסר...`) מכסה בדיוק את זה.
    expect(args).toEqual({
      p_customer_id: 47,
      p_contacts: [
        { contact_name: '  דנה כהן  ', phone: '050-1112222', email: 'dana@x.co', is_primary: true },
        { contact_name: 'רון גל', phone: null, email: null, is_primary: false },
      ],
    })
  })

  it('is_primary חסר/falsy נשלח כ-false מפורש, לא undefined — כדי שה-RPC לא ייפול על נירמול', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null })
    await replaceCustomerContacts(47, [{ contact_name: 'שם בלי is_primary' }])
    expect(supabase.rpc.mock.calls[0][1].p_contacts[0]).toEqual({
      contact_name: 'שם בלי is_primary',
      phone: null,
      email: null,
      is_primary: false,
    })
  })

  it('contacts ריק/undefined ⇒ p_contacts הוא מערך ריק (הסירוב על "אין ראשי" הוא באחריות ה-RPC)', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null })

    await replaceCustomerContacts(47, [])
    expect(supabase.rpc.mock.calls[0][1].p_contacts).toEqual([])

    supabase.rpc.mockClear()
    supabase.rpc.mockResolvedValue({ data: [], error: null })
    await replaceCustomerContacts(47, undefined)
    expect(supabase.rpc.mock.calls[0][1].p_contacts).toEqual([])
  })

  it('מחזירה את השורות שה-RPC החזיר כפי-שהן, בלי לעבד אותן', async () => {
    const rows = [
      { contact_id: 9, contact_name: 'דנה כהן', phone: null, email: null, is_primary: true },
    ]
    supabase.rpc.mockResolvedValue({ data: rows, error: null })

    const result = await replaceCustomerContacts(47, [
      { contact_name: 'דנה כהן', is_primary: true },
    ])

    expect(result).toBe(rows)
  })

  it('data null (לא אמור לקרות בלי error, אבל) ⇒ מחזירה מערך ריק ולא null', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null })
    const result = await replaceCustomerContacts(47, [{ contact_name: 'x' }])
    expect(result).toEqual([])
  })

  it('שגיאת-שרת P0001 (הניסוח של ישי על מחיקת-הראשי האחרון) מגיעה לקורא כלשונה', async () => {
    const serverMessage = 'אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי.'
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: serverMessage },
    })

    await expect(
      replaceCustomerContacts(47, [{ contact_name: 'x', is_primary: false }]),
    ).rejects.toMatchObject({ code: 'P0001', message: serverMessage })
  })

  it('שגיאת "שני ראשיים" מגיעה גם היא כלשונה, לא בניסוח גנרי', async () => {
    const serverMessage = 'ניתן לסמן איש קשר ראשי אחד בלבד.'
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: serverMessage },
    })

    await expect(
      replaceCustomerContacts(47, [
        { contact_name: 'א', is_primary: true },
        { contact_name: 'ב', is_primary: true },
      ]),
    ).rejects.toMatchObject({ message: serverMessage })
  })

  it('שגיאה בלי הודעת-שרת (תקלת-רשת/timeout) נופלת ל-fallback של הקובץ, לא לזריקה ריקה', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { code: undefined, message: '' } })

    await expect(replaceCustomerContacts(47, [])).rejects.toMatchObject({
      message: 'שמירת אנשי הקשר נכשלה.',
    })
  })

  it('שגיאת-שרת בלי code (למשל תקלת-רשת עם הודעה) עדיין משמרת את הודעת-השרת', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: '  לא ניתן לשמור לקוח בלי איש קשר אחד לפחות.  ' },
    })

    await expect(replaceCustomerContacts(47, [])).rejects.toMatchObject({
      message: 'לא ניתן לשמור לקוח בלי איש קשר אחד לפחות.',
    })
  })
})

// 🔴 ממצא F-7 (אודיט-סגירת מ9, 03/09/2026): שורת-פרמטר חסרה חייבת להפיל את הטעינה ולא לחזור
// כמפה חלקית. בלי זה הרגרסיה שקטה לגמרי — התגית "טעון בירור" נעלמת מכל הלקוחות והמסנן מחזיר
// ריק, מה שנקרא כ"אין למי להתקשר". השינוי מוצהר כשינוי-התנהגות במסלול-כשל, לא כתיקון-באג.
describe('getCustomerScreenParams — עוברת דרך הקורא שצועק (F-7)', () => {
  beforeEach(() => {
    getParamValues.mockReset()
  })

  it('מבקשת בדיוק את שני השמות, ומחזירה אותם בצורת-שורות', async () => {
    getParamValues.mockResolvedValue({ סף_לקוח_רדום_ימים: '120', סף_שביעות_רצון: '3' })
    const rows = await getCustomerScreenParams()
    expect(getParamValues).toHaveBeenCalledWith(['סף_לקוח_רדום_ימים', 'סף_שביעות_רצון'])
    expect(rows).toEqual(
      expect.arrayContaining([
        { param_name: 'סף_לקוח_רדום_ימים', param_value: '120' },
        { param_name: 'סף_שביעות_רצון', param_value: '3' },
      ]),
    )
  })

  it('שורה חסרה ⇒ השגיאה של הקורא עולה החוצה, ואין מפה חלקית', async () => {
    getParamValues.mockRejectedValue(new Error('הפרמטר "סף_שביעות_רצון" חסר בהגדרות המערכת.'))
    await expect(getCustomerScreenParams()).rejects.toThrow(/סף_שביעות_רצון/)
  })
})
