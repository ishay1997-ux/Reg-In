import { test, expect } from '@playwright/test'

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/')
}

test.describe('הגנת-נתיבים לפי הרשאה (ProtectedRoute + מטריצת הרשאות)', () => {
  test('משתמש לוגיסטיקה נחסם ממטריצת ההרשאות (CEO-בלבד)', async ({ page }) => {
    test.skip(
      !STAFF_EMAIL || !STAFF_PASSWORD,
      'E2E_STAFF_EMAIL/E2E_STAFF_PASSWORD לא הוגדרו ב-.env.local',
    )
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await page.goto('/system/permissions')
    await expect(page.getByText('אין לך הרשאה לצפות במסך זה')).toBeVisible()
    await expect(page.getByText('מטריצת הרשאות')).not.toBeVisible()
  })

  test('CEO נכנס בהצלחה למסך מטריצת ההרשאות', async ({ page }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/system/permissions')
    await expect(page.getByText('מטריצת הרשאות')).toBeVisible()
  })
})

test.describe('מטריצת הרשאות — שינוי תא ודחיסת עצמי (self-lockout)', () => {
  // ממפים שם-עמודה (שם תפקיד) -> אינדקס ה-td בשורה, לפי סדר ה-th בכותרת (roles.map
  // זהה בשורת הכותרת ובשורות הגוף - ר' PermissionsMatrixPage.jsx). נמנעים מ-ID קשיחים
  // מה-DB, ומתאמצים רק את שמות המודולים/התפקידים שכבר קבועים ב-Seed.
  async function columnIndexForRole(page, roleName) {
    // הטבלה מוצגת רק אחרי ש-loadData מסתיים (לפני כן "טוען...") - מחכים לעוגן יציב
    // (הכותרת) לפני שקוראים thead th, אחרת התוכן עוד לא קיים ב-DOM.
    await expect(page.getByRole('heading', { name: 'מטריצת הרשאות' })).toBeVisible()
    const headerTexts = (await page.locator('thead th').allTextContents()).map((t) => t.trim())
    const index = headerTexts.indexOf(roleName)
    expect(index, `לא נמצאה עמודת "${roleName}" בכותרת המטריצה`).toBeGreaterThan(0)
    return index
  }

  function moduleRowLocator(page, moduleName) {
    return page
      .locator('tbody tr')
      .filter({ has: page.getByRole('cell', { name: moduleName, exact: true }) })
  }

  test('CEO משנה תא במטריצה (עריכה→צפייה→חסום), והשינוי נשמר אחרי רענון', async ({ page }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/system/permissions')

    const columnIndex = await columnIndexForRole(page, 'מנהלת לוגיסטיקה')
    const cell = () =>
      moduleRowLocator(page, 'פרויקטים').locator('td').nth(columnIndex).locator('button')

    const titleBefore = await cell().getAttribute('title')
    await cell().click()
    // ה-title משתנה מיידית (עדכון אופטימי) - מוכיח שהקליק בכלל נרשם, לפני שבודקים DB.
    await expect(cell()).not.toHaveAttribute('title', titleBefore)
    const titleAfterClick = await cell().getAttribute('title')

    // רענון מלא מוודא שהערך אכן נכתב ל-permissions ב-DB, לא רק ל-state המקומי בזיכרון.
    await page.reload()
    await expect(cell()).toHaveAttribute('title', titleAfterClick)

    // מחזירים למצב ההתחלתי כדי לא להשאיר שינוי-צד בסביבת הבדיקה המשותפת.
    await cell().click()
    await cell().click()
  })

  test('עמודת המנכ"ל נעולה במטריצה (הגנת self-lockout) - לא ניתן ללחוץ ולא לאבד גישת מנהל', async ({
    page,
  }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/system/permissions')

    const ceoColumnIndex = await columnIndexForRole(page, 'מנכ"ל')
    const ceoButton = moduleRowLocator(page, 'פרויקטים')
      .locator('td')
      .nth(ceoColumnIndex)
      .locator('button')

    await expect(ceoButton).toBeDisabled()
    await expect(ceoButton).toHaveAttribute('title', 'למנכ"ל תמיד עריכה מלאה')
  })
})
