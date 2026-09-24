import { test, expect } from '@playwright/test'

// "חזרה למקור" — ביקורת-קוד, 24/09/2026: **חזרה-בסגירה רק לפריט שהדלת פתחה.**
// התרחיש: כרטיס "מה דורש טיפול" ריק במסך הבית מוביל לרשימת-המודול עצמה —
// `withReturnTo(def.href, '/')` (`src/lib/dashboard.js` · `AttentionPanel.jsx`) ⇒ `/quotes?returnTo=%2F`.
// המשתמשת פותחת פריט מהרשימה בעצמה וסוגרת ⇒ **נשארת ברשימה** (עד התיקון — הועפה למסך הבית).
// 🔑 הכתובת נבנית כאן ישירות ולא דרך לחיצה על כרטיס ריק: אילו כרטיסים ריקים — תלוי-נתונים וזז
// מיום ליום (`e2e/CLAUDE.md` §2.2). ‏הרגרסיה ההפוכה (דוח ⇐ שורה ⇐ סגירה ⇐ חזרה לדוח) — `reports.spec.js` "0ב".
// 🚫 קריאה בלבד: פותחים וסוגרים, שום כפתור-כתיבה לא נלחץ.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

async function login(page) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת אימייל').fill(CEO_EMAIL)
  await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

test.describe('0ב · כרטיס ריק במסך הבית ⇐ רשימה ⇐ פריט שנפתח ונסגר ⇐ נשארים ברשימה', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('הצעות: חלון-מסמך שנפתח מהרשימה נסגר, והמסך נשאר רשימת-ההצעות', async ({ page }) => {
    await page.goto('/quotes?returnTo=%2F')
    await expect(page.getByTestId('return-to-link')).toHaveText('חזרה למסך הבית')
    const eye = page.locator('[data-testid^="quote-document-"]').first()
    await expect(eye).toBeVisible({ timeout: 30_000 })
    await eye.click()
    await expect(page.getByTestId('quote-document-title')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('quote-document-title')).toBeHidden()
    await expect(page).toHaveURL(/\/quotes\?/)
    expect(new URL(page.url()).searchParams.get('view')).toBeNull()
    await expect(page.getByTestId('return-to-link')).toHaveText('חזרה למסך הבית')
  })

  test('דיילות: כרטיס שנפתח מהמאגר נסגר, והמסך נשאר מסך הדיילות', async ({ page }) => {
    await page.goto('/hostesses?returnTo=%2F')
    await page.getByTestId('hostesses-tab-repository').click()
    const row = page.locator('[data-testid^="repository-row-"]').first()
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.locator('td').nth(1).click()
    await expect(page.getByTestId('hostess-card-title')).toBeVisible({ timeout: 15_000 })
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('hostess-card-title')).toHaveCount(0)
    await expect(page).toHaveURL(/\/hostesses\?/)
    expect(new URL(page.url()).searchParams.get('hostess')).toBeNull()
    await expect(page.getByTestId('return-to-link')).toHaveText('חזרה למסך הבית')
  })
})
