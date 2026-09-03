import { test, expect } from '@playwright/test'

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

test.describe('התחברות (מודול 1)', () => {
  test('מסך ההתחברות נטען, RTL ועברית מוצגים', async ({ page }) => {
    await page.goto('/login')
    // ה-RTL מוגדר גם על <html dir="rtl"> (index.html) וגם על ה-div העוטף בכל דף (LoginPage.jsx).
    // .first() תופס את הראשון בעץ (<html>) - הבדיקה מאשרת שה-RTL קיים, לא היכן הוא מוגדר.
    await expect(page.locator('[dir="rtl"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'כניסה למערכת' })).toBeVisible()
    await expect(page.getByPlaceholder('כתובת דוא״ל')).toBeVisible()
    await expect(page.getByPlaceholder('סיסמה')).toBeVisible()
  })

  test('גישה ישירה לנתיב מוגן בלי session מנותבת בחזרה להתחברות', async ({ page }) => {
    await page.goto('/system/permissions')
    // MainLayout חוסם משתמש לא-מחובר ומנתב ל-/login (לא "דלת פתוחה" לתוכן מוגן)
    await expect(page).toHaveURL(/\/login/)
  })

  test('סיסמה שגויה מציגה שגיאה (ניסיון כושל יחיד בלבד - לא לחזור, כדי לא לגרום לנעילת חשבון)', async ({
    page,
  }) => {
    test.skip(!CEO_EMAIL, 'E2E_CEO_EMAIL לא הוגדר ב-.env.local')
    await page.goto('/login')
    await page.getByPlaceholder('כתובת דוא״ל').fill(CEO_EMAIL)
    await page.getByPlaceholder('סיסמה').fill('wrong-password-just-once')
    await page.getByRole('button', { name: 'התחברות', exact: true }).click()
    // עד שההודעה מוצגת עוברות 3 קריאות-רשת עוקבות (check_login_lock → Auth → register_failed_login),
    // כל אחת עם preflight משלה - ברשת איטית זה חורג מ-10 השניות של ברירת המחדל.
    await expect(page.getByText(/מייל או סיסמה שגויים|החשבון ננעל/)).toBeVisible({
      timeout: 30_000,
    })
  })

  test('התחברות מוצלחת עם CEO מגיעה למסך הבית (MainLayout)', async ({ page }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
    await page.goto('/login')
    await page.getByPlaceholder('כתובת דוא״ל').fill(CEO_EMAIL)
    await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
    await page.getByRole('button', { name: 'התחברות', exact: true }).click()
    // login מוצלח = שרשרת קריאות-רשת ארוכה (lock-check, Auth, reset, שליפת users) לפני הניווט -
    // timeout מורחב מונע כשל-שווא ברשת איטית (האפליקציה תקינה, הרשת לא).
    await expect(page).toHaveURL('/', { timeout: 30_000 })
    // מודול 7 (03/09/2026): `/` הוא מסך-הבית האמיתי; "ברוכים הבאים" (WelcomePage) הוסר.
    await expect(page.getByRole('heading', { name: 'מסך הבית', level: 1 })).toBeVisible()
    // כל test מקבל browser context מבודד ב-Playwright - אין session שדולף לטסט הבא.
  })
})
