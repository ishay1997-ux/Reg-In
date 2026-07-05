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
