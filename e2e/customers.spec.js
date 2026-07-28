import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// E2E מודול 2 (לקוחות) — משקף את קריטריוני-הקבלה (guide ⑦ / מדריך-מיקרו step 5.1):
// edit-tier יוצר לקוח ורואה אותו · סינון עובד · ארכוב הפיך · blocked-role בלי מודול-לקוחות
// (סרגל + URL ישיר). מנגנון ההרשאה עצמו כבר מכוסה ב-permissions.spec.js (מודול 1); כאן הזווית
// היא הזרימה של מודול 2 מעל אותו מנגנון.
//
// creds: כמו שאר הספים — נקראים מ-.env.local דרך process.env (playwright.config טוען אותם).
// יש לנו בפועל CEO (=מנכ"ל, edit על 'לקוחות') + STAFF (=מנהלת לוגיסטיקה, blocked). ספים בשם
// finance/logistics ירוצו אוטומטית אם יתווספו creds תואמים, ו-test.skip בחן כשהם חסרים
// (מוסכמת הפרויקט — ר' permissions.spec.js).

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD
// אופציונליים — אם קיימים ב-.env.local, הווריאנטים בשמם ירוצו; אחרת ידולגו בחן.
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD
const LOGISTICS_EMAIL = process.env.E2E_LOGISTICS_EMAIL
const LOGISTICS_PASSWORD = process.env.E2E_LOGISTICS_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// ח"פ ייחודי לריצה (9 ספרות) — מונע התנגשות בח"פ קיים ומאפשר ריצה חוזרת. workers=1 ⇒ ערך יחיד בטוח.
const TEST_COMPANY_NUMBER = String(Date.now()).slice(-9)
const TEST_COMPANY_NAME = `בדיקת E2E ${TEST_COMPANY_NUMBER}`

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  // login מוצלח = שרשרת קריאות-רשת ארוכה לפני הניווט (כמו בשאר הספים) — timeout מורחב מונע כשל-שווא.
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// ניקוי אחרי הריצה: מחיקה קשיחה של לקוח-הבדיקה כדי שה-DB המשותף יחזור למצב 0-שורות שהמודול מניח.
// אין UI-מחיקה בכוונה (מוסכמת-ארכיון: status דו-כיווני, לא delete) — לכן הניקוי ברמת-DB דרך לקוח
// Supabase מחובר-CEO (edit ⇒ policy ALL של §7.21 מתירה delete). FK של customer_contacts הוא
// on delete cascade, כך שאנשי-הקשר של הבדיקה נמחקים יחד. אם ה-creds/keys חסרים — לא נוצר לקוח ואין מה לנקות.
async function deleteTestCustomer() {
  if (!SUPABASE_URL || !SUPABASE_ANON || !CEO_EMAIL || !CEO_PASSWORD) return
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON)
  try {
    await sb.auth.signInWithPassword({ email: CEO_EMAIL, password: CEO_PASSWORD })
    await sb.from('customers').delete().eq('company_number', TEST_COMPANY_NUMBER)
  } finally {
    await sb.auth.signOut()
  }
}

test.describe('לקוחות (מודול 2) — קבלה E2E (guide ⑦)', () => {
  // רשת-ביטחון: גם אם בדיקת-היצירה נכשלה באמצע, מנקים לפי ח"פ — כדי לא להשאיר שיירים ב-DB המשותף.
  test.afterAll(async () => {
    await deleteTestCustomer()
  })

  test('edit-tier (CEO): יוצר לקוח, רואה אותו, מסנן, וארכוב הפיך', async ({ page }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
    test.skip(
      !SUPABASE_URL || !SUPABASE_ANON,
      'VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY חסרים — אין ניקוי-DB, מדלגים כדי לא ללכלך את ה-DB המשותף',
    )
    // הערה: לארכוב אין חלון-וידוא (הכרעת-ישי 11/07 — הפעולה הפיכה; CustomersPage.jsx). אין להוסיף
    // כאן מטפל-dialog "ליתר ביטחון": הוא יאשר בשקט חלון לא-מכוון במקום שהבדיקה תיפול עליו.
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: 'רשימת לקוחות' })).toBeVisible()

    // --- יצירה ---
    await page.getByTestId('customer-add-button').click()
    await expect(page.getByTestId('customer-dialog-title')).toHaveText('לקוח חדש')
    await page.getByTestId('customer-form-company-name').fill(TEST_COMPANY_NAME)
    await page.getByTestId('customer-form-company-number').fill(TEST_COMPANY_NUMBER)
    // Radix Select — פותחים את ה-trigger ובוחרים תווית-אפיון (§7.3): private_company = "חברה פרטית".
    await page.getByTestId('customer-form-type').click()
    await page.getByRole('option', { name: 'חברה פרטית' }).click()
    await page.getByTestId('customer-form-contact-name').fill('איש קשר בדיקה')
    await page.getByTestId('customer-form-phone').fill('03-1234567')
    await page.getByTestId('customer-form-email').fill('e2e@example.com')
    await page.getByTestId('customer-form-discount').fill('10')
    await page.getByTestId('customer-form-submit').click()

    // הצלחה = פס-ירוק חובת-אפיון, ואז הדיאלוג נסגר אוטומטית (setTimeout 1200ms).
    await expect(page.getByTestId('customer-save-success')).toBeVisible()
    await expect(page.getByTestId('customer-dialog-title')).toBeHidden({ timeout: 5_000 })

    // --- רואה אותו ברשימה (חיפוש §7.11 לפי ח"פ) ---
    const table = page.getByTestId('customers-table')
    await page.getByTestId('customers-search').fill(TEST_COMPANY_NUMBER)
    await expect(table.getByText(TEST_COMPANY_NAME)).toBeVisible()

    // --- סינון עובד: מונח שלא-תואם ⇒ מצב "אין תוצאות"; חזרה ⇒ שוב מופיע ---
    await page.getByTestId('customers-search').fill('לא-קיים-כלשהו-zzz')
    await expect(page.getByTestId('customers-no-results')).toBeVisible()
    await page.getByTestId('customers-search').fill(TEST_COMPANY_NUMBER)
    await expect(table.getByText(TEST_COMPANY_NAME)).toBeVisible()

    // --- ארכוב הפיך ---
    const row = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: TEST_COMPANY_NAME })
    await expect(row).toBeVisible()
    // ארכוב → הלקוח יוצא מרשימת הפעילים (בלי חלון-וידוא — פעולה הפיכה, הכרעת-ישי 11/07).
    await row.getByTitle('העבר לארכיון').click()
    await expect(table.getByText(TEST_COMPANY_NAME)).toBeHidden()
    // כפתור "ארכיון" מוביל לרשימת הארכיון בלבד (הכרעת-ישי 11/07) — השורה חוזרת מסומנת לא-פעיל.
    await page.getByTestId('customers-archive-toggle').click()
    const archivedRow = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: TEST_COMPANY_NAME })
    await expect(archivedRow.getByText('לא פעיל')).toBeVisible()
    // שחזור → חוזר לפעיל; הכפתור עכשיו "חזרה לפעילים" — לוחצים ורואים אותו שוב כפעיל (הפיכוּת מלאה).
    await archivedRow.getByTitle('שחזר מהארכיון').click()
    await page.getByTestId('customers-archive-toggle').click()
    const restoredRow = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: TEST_COMPANY_NAME })
    await expect(restoredRow.getByText('פעיל', { exact: true })).toBeVisible()
  })

  test('blocked-role (STAFF=לוגיסטיקה): אין מודול לקוחות בסרגל וגישה ישירה ל-/customers חסומה', async ({
    page,
  }) => {
    test.skip(
      !STAFF_EMAIL || !STAFF_PASSWORD,
      'E2E_STAFF_EMAIL/E2E_STAFF_PASSWORD לא הוגדרו ב-.env.local',
    )
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    // סרגל-הצד מסנן מודולים blocked (Sidebar.jsx) — אין קישור 'לקוחות'.
    await expect(page.getByRole('link', { name: 'לקוחות' })).toHaveCount(0)
    // גישה ישירה ל-URL חסומה ב-ProtectedRoute (הגנה-כפולה, לא רק הסתרה בתפריט).
    await page.goto('/customers')
    await expect(page.getByText('אין לך הרשאה לצפות במסך זה')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'רשימת לקוחות' })).toHaveCount(0)
  })

  // וריאנט בשם finance (edit) — ירוץ רק אם E2E_FINANCE_* הוגדרו; אחרת מדולג בחן.
  test('finance-role (edit): נכנס למסך הלקוחות ורואה את פקד ההוספה', async ({ page }) => {
    test.skip(
      !FINANCE_EMAIL || !FINANCE_PASSWORD,
      'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו — מדלגים (CEO מכסה את שכבת ה-edit)',
    )
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: 'רשימת לקוחות' })).toBeVisible()
    await expect(page.getByTestId('customer-add-button')).toBeVisible()
  })

  // וריאנט בשם logistics (blocked) — ירוץ רק אם E2E_LOGISTICS_* הוגדרו; אחרת מדולג בחן.
  test('logistics-role (blocked): אין מודול לקוחות וגישה ישירה חסומה', async ({ page }) => {
    test.skip(
      !LOGISTICS_EMAIL || !LOGISTICS_PASSWORD,
      'E2E_LOGISTICS_EMAIL/E2E_LOGISTICS_PASSWORD לא הוגדרו — מדלגים (STAFF מכסה את שכבת ה-blocked)',
    )
    await login(page, LOGISTICS_EMAIL, LOGISTICS_PASSWORD)
    await expect(page.getByRole('link', { name: 'לקוחות' })).toHaveCount(0)
    await page.goto('/customers')
    await expect(page.getByText('אין לך הרשאה לצפות במסך זה')).toBeVisible()
  })
})
