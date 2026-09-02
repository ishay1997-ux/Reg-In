// בדיקות ל-CustomerFormDialog אחרי N2 (איחוד אנשי-הקשר, מוקאפ מאושר
// docs/mockups/customers-screen/08_contacts_form_approved.html, הכרעת-ישי 27/08/2026):
// הראשי הוא עכשיו שורה ברשימה המאוחדת (צ'יפ+מסגרת), לא שלושה שדות נפרדים בראש הטופס.
// מכסות: שמירה בלי איש-קשר ראשי מסומן (חסימה + הנוסח של ה-RPC replace_customer_contacts,
// N2ב) · מחיקת הראשי חסומה **תמיד**, לא רק כשהוא היחיד (הכרעת-מוצר מפורשת, לא "אין למי
// להעביר את הדגל") · "הפוך לראשי" מזיז את הדגל ולא מכפיל אותו · ושמירה רגילה, כולל השיקוף
// של הראשי חזרה ל-customers.contact_name/phone/email (עדיין NOT NULL ב-DB — ר' ההערה
// ב-CustomerFormDialog.jsx עצמו). כל הבדיקות הן במצב-עריכה: אין כאן ניסיון להפעיל את
// ה-Select של "סוג לקוח" (Radix, ללא תקדים-בדיקה בריפו לאינטראקציה איתו) — לא נוגע ב-N2.
// ה-API ממוקק כולו (./api) — אין Supabase בבדיקה, אותו סגנון-בית כמו
// CustomerDetailsPage.projects.test.jsx.
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import CustomerFormDialog from './CustomerFormDialog'
import { updateCustomer, listCustomerContacts, replaceCustomerContacts } from './api'

// 🧨 מוקש-סביבה (jsdom): הדיאלוג הזה הוא הראשון בריפו שמרנדר יחד Select+Switch בתוך Dialog
// עם עץ-JSX גדול מספיק שה-scanner של Vite מגיש את @radix-ui/react-use-size מ-src/*.tsx במקום
// מ-dist — וה-src קורא `new ResizeObserver(...)` בלי guard, ש-jsdom אינו מספק (נמדד: לא קיים
// גם ב-`new JSDOM().window`). ‏setup.js המשותף לא נוגע בזה (זה הקובץ הראשון שנתקל בכך), ואינו
// בבעלותי כאן — הפוליפיל הזעיר הזה יושב מקומית בקובץ שבבעלותי בלבד.
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

vi.mock('./api', () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  setCustomerStatus: vi.fn(),
  listCustomerContacts: vi.fn(),
  replaceCustomerContacts: vi.fn(),
}))

function customerFixture(overrides) {
  return {
    customer_id: 47,
    company_name: 'עיריית חדרה',
    company_number: '512345678',
    customer_type: 'government',
    discount_percent: 0,
    marketing_consent: false,
    status: 'active',
    ...overrides,
  }
}

// נתוני-הבסיס אמיתיים (נמשכו מהמסד 02/09/2026, לקוח #47 — אותו מקור שהמוקאפ עצמו מצטט
// בהערת-הפתיחה שלו). דנה פרץ להמחשה בלבד, כמו במוקאפ.
function contactRow(overrides) {
  return {
    contact_id: 21,
    contact_name: 'שרית מזרחי',
    phone: '054-8123390',
    email: 'sarit@hadera.muni.il',
    is_primary: true,
    ...overrides,
  }
}

function renderDialog(props = {}) {
  return render(
    <CustomerFormDialog
      open
      onOpenChange={vi.fn()}
      editingCustomer={customerFixture()}
      customers={[]}
      onSaved={vi.fn()}
      onEditExisting={vi.fn()}
      {...props}
    />,
  )
}

function waitForContactsLoaded() {
  return screen.findAllByTestId('contact-row')
}

const NO_PRIMARY_MSG = 'אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי.'

beforeEach(() => {
  vi.clearAllMocks()
  updateCustomer.mockResolvedValue(customerFixture())
  replaceCustomerContacts.mockResolvedValue([])
})

describe('CustomerFormDialog — N2, שמירה בלי איש-קשר ראשי מסומן', () => {
  it('חוסמת את השמירה ומציגה את נוסח-ה-RPC, בלי לקרוא לאף פונקציית-כתיבה', async () => {
    // שני אנשי-קשר, אף אחד לא מסומן ראשי — מצב שה-UI אינו מייצר בדרך רגילה (מחיקת-הראשי
    // חסומה), אבל שדה is_primary יכול להגיע כך מנתון ישן/לא-עקבי; הבדיקה הזו מוודאת שהצד-לקוח
    // לא סומך על כך שהמצב הזה לעולם לא יקרה.
    listCustomerContacts.mockResolvedValue([
      contactRow({ contact_id: 21, contact_name: 'שרית מזרחי', is_primary: false }),
      contactRow({ contact_id: 22, contact_name: 'דנה פרץ', is_primary: false }),
    ])
    renderDialog()
    await waitForContactsLoaded()

    fireEvent.click(screen.getByTestId('customer-form-submit'))

    expect(await screen.findByTestId('customer-contacts-primary-error')).toHaveTextContent(
      NO_PRIMARY_MSG,
    )
    expect(updateCustomer).not.toHaveBeenCalled()
    expect(replaceCustomerContacts).not.toHaveBeenCalled()
  })
})

describe('CustomerFormDialog — N2, מחיקת הראשי חסומה תמיד', () => {
  it('כפתור-המחיקה של הראשי מנוטרל ונושא את המשפט; מחיקת השורה השנייה (לא-ראשית) כן עובדת', async () => {
    listCustomerContacts.mockResolvedValue([
      contactRow({ contact_id: 21, contact_name: 'שרית מזרחי', is_primary: true }),
      contactRow({
        contact_id: 22,
        contact_name: 'דנה פרץ',
        phone: '04-6303011',
        email: 'dana@hadera.muni.il',
        is_primary: false,
      }),
    ])
    renderDialog()
    const rows = await waitForContactsLoaded()
    expect(rows).toHaveLength(2)

    const primaryRow = rows.find((r) => r.getAttribute('data-primary') === 'true')
    const nonPrimaryRow = rows.find((r) => r.getAttribute('data-primary') === 'false')

    // הכפתור עצמו מנוטרל (לא רק "ננסה למחוק ונחסום בהודעה") — ונושא את הנוסח, כמוסכמת-הבית
    // (כפתור-שליחה-מושבת ב-MarketingPanel/marketing.js: title שמסביר את החסימה).
    const deleteBtn = within(primaryRow).getByTestId('contact-remove')
    expect(deleteBtn).toBeDisabled()
    expect(deleteBtn).toHaveAttribute('aria-label', 'מחיקה חסומה')
    expect(deleteBtn).toHaveAttribute('title', NO_PRIMARY_MSG)
    expect(within(primaryRow).getByTestId('contact-primary-delete-notice')).toHaveTextContent(
      NO_PRIMARY_MSG,
    )

    // גם ניסיון-לחיצה בפועל (הגנה כפולה: גם ה-UI מנוטרל וגם removeContactRow מסרב להסיר ראשי).
    fireEvent.click(deleteBtn)
    expect(screen.getAllByTestId('contact-row')).toHaveLength(2)

    // ולעומת זאת: מחיקת השורה הלא-ראשית עובדת כרגיל.
    fireEvent.click(within(nonPrimaryRow).getByTestId('contact-remove'))
    expect(screen.getAllByTestId('contact-row')).toHaveLength(1)
  })
})

describe('CustomerFormDialog — N2, "הפוך לראשי" מזיז את הדגל ולא מכפיל', () => {
  it('לוחצים על השורה השנייה, הצ׳יפ עובר אליה, והשמירה שולחת בדיוק ראשי אחד', async () => {
    listCustomerContacts.mockResolvedValue([
      contactRow({ contact_id: 21, contact_name: 'שרית מזרחי', is_primary: true }),
      contactRow({
        contact_id: 22,
        contact_name: 'דנה פרץ',
        phone: '04-6303011',
        email: 'dana@hadera.muni.il',
        is_primary: false,
      }),
    ])
    renderDialog()
    const rows = await waitForContactsLoaded()
    const danaRow = rows.find((r) => within(r).queryByDisplayValue('דנה פרץ'))
    fireEvent.click(within(danaRow).getByTestId('contact-make-primary'))

    const afterRows = screen.getAllByTestId('contact-row')
    const newPrimary = afterRows.find((r) => r.getAttribute('data-primary') === 'true')
    const oldPrimary = afterRows.find((r) => r.getAttribute('data-primary') === 'false')
    expect(within(newPrimary).getByDisplayValue('דנה פרץ')).toBeInTheDocument()
    expect(within(newPrimary).getByTestId('contact-primary-chip')).toBeInTheDocument()
    // הדגל *עבר*, לא הוכפל — השורה הישנה כבר לא נושאת צ'יפ וכן נושאת "הפוך לראשי".
    expect(within(oldPrimary).queryByTestId('contact-primary-chip')).not.toBeInTheDocument()
    expect(within(oldPrimary).getByTestId('contact-make-primary')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('customer-form-submit'))
    await waitFor(() => expect(updateCustomer).toHaveBeenCalledTimes(1))

    // הראשי-החדש משתקף חזרה לשלוש העמודות ב-customers (עדיין NOT NULL ב-DB, ר' ההערה בקוד —
    // מסכים אחרים כמו CustomersPage/CustomerDetailsPage עדיין קוראים אותן ישירות).
    expect(updateCustomer).toHaveBeenCalledWith(
      47,
      expect.objectContaining({
        contact_name: 'דנה פרץ',
        phone: '04-6303011',
        email: 'dana@hadera.muni.il',
      }),
    )

    expect(replaceCustomerContacts).toHaveBeenCalledTimes(1)
    const [customerId, sentContacts] = replaceCustomerContacts.mock.calls[0]
    expect(customerId).toBe(47)
    const primaries = sentContacts.filter((c) => c.is_primary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].contact_name).toBe('דנה פרץ')
  })
})

describe('CustomerFormDialog — N2, שמירה רגילה (לקוח עם איש-קשר יחיד — מצב כל 9 הלקוחות היום)', () => {
  it('שומרת את פרטי הלקוח ואת אנשי-הקשר, ומציגה את פס-ההצלחה', async () => {
    listCustomerContacts.mockResolvedValue([contactRow()])
    renderDialog()
    await waitForContactsLoaded()

    fireEvent.click(screen.getByTestId('customer-form-submit'))

    await waitFor(() => expect(updateCustomer).toHaveBeenCalledTimes(1))
    expect(updateCustomer).toHaveBeenCalledWith(
      47,
      expect.objectContaining({
        company_name: 'עיריית חדרה',
        customer_type: 'government',
        discount_percent: 0,
        marketing_consent: false,
        contact_name: 'שרית מזרחי',
        phone: '054-8123390',
        email: 'sarit@hadera.muni.il',
      }),
    )
    expect(replaceCustomerContacts).toHaveBeenCalledWith(
      47,
      expect.arrayContaining([
        expect.objectContaining({ contact_name: 'שרית מזרחי', is_primary: true }),
      ]),
    )
    expect(await screen.findByTestId('customer-save-success')).toHaveTextContent(
      'הנתונים נשמרו בהצלחה',
    )
  })
})
