import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// מודול 7 — מסך-הבית, חמש הזהויות (פזה 4.2 · מטריצת-QA "E2E" · DoD "נגיש לכל 5 התפקידים").
//
// מה נבדק, ולמה כך:
//   • המסך נפתח לכל אחת מחמש הזהויות ב-`/` בלי `<ProtectedRoute>` (§7.10) — h1 + ארבעה אריחים.
//   • המיסוך (§7.97) נבדק **על המסך ולא ברשת**: הכרטיס הממוסך מציג בדיוק `לא זמין בתפקידך`
//     ולעולם לא `0 ₪` — זה בדיוק הבאג ש-§4 של הבלופרינט מונע (NULL שהופך ל-0 נראה כמו "חודש
//     בלי רווח"). positive control קודם: מנכ"ל וכספים חייבות לראות סכום/ספירה בפועל.
//   • "הצעות ממתינות" הולך אחרי השער הקיים על `quotes` (הכרעת-ישי בשער-ההקלדה, 03/09/2026):
//     גלוי למנכ"ל · כספים · פרויקטים, ממוסך לגיוס · לוגיסטיקה.
//   • הלוח ורצועת "מה דורש טיפול" מתרנדרים לכולן זהים (המסך אחד, התוכן לפי-תפקיד).
//
// אפס כתיבות: התחברות + קריאה. אין יירוט-רשת — המסך נבדק מול המסד החי כפי שהוא, ולכן
// האסרשנים על *ערכים* הם "נראה סכום/ספירה" ולא מספר קשיח (המספרים זזים עם הזריעה).
// צילומי-המסך נשמרים ל-`test-results/dashboard-<role>.png` — הראיה הוויזואלית לשער 3.4.
// ══════════════════════════════════════════════════════════════════════════════════════

const ROLES = [
  { key: 'ceo', label: 'מנכ"ל', env: 'CEO', profit: true, quotes: true },
  { key: 'finance', label: 'מנהלת כספים', env: 'FINANCE', profit: true, quotes: true },
  { key: 'projects', label: 'מנהלת פרויקטים', env: 'PROJECTS', profit: false, quotes: true },
  { key: 'recruit', label: 'מנהלת גיוס', env: 'RECRUIT', profit: false, quotes: false },
  { key: 'staff', label: 'מנהלת לוגיסטיקה (STAFF)', env: 'STAFF', profit: false, quotes: false },
]

const MASKED = 'לא זמין בתפקידך'

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

test.describe('מסך-הבית — חמש הזהויות (§7.10 · §7.97)', () => {
  for (const role of ROLES) {
    test(`${role.label}: המסך נפתח, והמיסוך נכון`, async ({ page }) => {
      const email = process.env[`E2E_${role.env}_EMAIL`]
      const password = process.env[`E2E_${role.env}_PASSWORD`]
      test.skip(!email || !password, `E2E_${role.env}_* לא הוגדרו ב-.env.local`)

      await login(page, email, password)
      await expect(page.getByRole('heading', { name: 'מסך הבית', level: 1 })).toBeVisible()

      // הטעינה הראשונה מציגה שלד; ממתינים לאריח האמיתי, לא למעטפת (מוקש-המכנה-0 של e2e/CLAUDE.md).
      const profit = page.getByTestId('kpi-profit')
      await expect(profit).toBeVisible({ timeout: 30_000 })
      await expect(page.getByTestId('kpi-active')).toBeVisible()
      await expect(page.getByTestId('kpi-satisfaction')).toBeVisible()
      const quotes = page.getByTestId('kpi-quotes')
      await expect(quotes).toBeVisible()

      if (role.profit) {
        // positive control: סכום אמיתי (או "—" לחודש ריק) — לעולם לא הטקסט הממוסך.
        await expect(profit).not.toContainText(MASKED)
        await expect(profit).toContainText(/₪|—/)
      } else {
        await expect(profit).toContainText(MASKED)
        await expect(profit).not.toContainText('₪')
      }

      if (role.quotes) {
        await expect(quotes).not.toContainText(MASKED)
        await expect(quotes).toContainText(/\d|—/)
      } else {
        await expect(quotes).toContainText(MASKED)
      }

      // הלוח והרצועה — זהים לכולן (המסך אחד; רק תוכן-הכסף לפי-תפקיד).
      await expect(page.getByTestId('dashboard-cal-today')).toBeVisible()
      await expect(page.getByTestId('dashboard-attention')).toBeVisible()
      const dayCells = page.locator('[data-testid^="dashboard-day-"]')
      expect(await dayCells.count()).toBeGreaterThanOrEqual(28)

      await page.screenshot({ path: `test-results/dashboard-${role.key}.png`, fullPage: true })
    })
  }

  test('מנכ"ל: ניווט-חודש משנה את הכתובת ואת הכותרת, ו"היום" מחזיר', async ({ page }) => {
    const email = process.env.E2E_CEO_EMAIL
    const password = process.env.E2E_CEO_PASSWORD
    test.skip(!email || !password, 'E2E_CEO_* לא הוגדרו ב-.env.local')

    await login(page, email, password)
    await expect(page.getByTestId('kpi-profit')).toBeVisible({ timeout: 30_000 })
    const title = page.locator('h2').first()
    const before = await title.textContent()

    await page.getByTestId('dashboard-cal-next').click()
    await expect(page).toHaveURL(/month=\d{4}-\d{2}-01/)
    await expect(title).not.toHaveText(before)

    await page.getByTestId('dashboard-cal-today').click()
    await expect(page).not.toHaveURL(/month=/)
    await expect(title).toHaveText(before)
  })
})
