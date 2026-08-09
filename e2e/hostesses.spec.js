import { test, expect } from '@playwright/test'

// E2E של מודול 4 — **משטח 1, מבט-על השיבוצים** (צעד 3.3).
//
// ⚠️ **אפס כתיבות למסד.** הבדיקות כאן קוראות בלבד, והמצב היחיד ש"נכפה" נכפה **ברשת**
// (`page.route`) ולא בדאטה — אותה מוסכמה כמו `load-failure-guards.spec.js`. אין סביבת-בדיקה
// נפרדת בפרויקט הזה, ולכן הזרקת-שורות מזהמת דאטה אמיתית.
//
// 🔑 **מה הבדיקות האלה מוכיחות שצילום-מסך אינו מוכיח:** שהמסך מבחין בין "אין אירועים"
// לבין "השאילתה נכשלה" — שתי תוצאות שנראות **זהות** בדפדפן, וההבחנה ביניהן היא
// `spec.md § מה ייחשב עובד` #4, הכשל החמור ביותר במודול.

const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

test.describe('מודול 4 · משטח 1 — מבט-על השיבוצים', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('נוחתים על לשונית מבט-העל, והיא מציגה אירועים אמיתיים', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')

    // 🔴 ברירת-המחדל היא מבט-העל ולא המאגר — המנהלת נכנסת כדי לראות **איפה חסר**.
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })

    // 🔴 **אירוע שתאריכו עבר אינו ברשימה.** במסד יושב `תרחיש-קבלה 5.1` מ-01/08/2026 עם
    // 6 חסרות; בלי כלל-התאריך הוא היה יושב **בראש** מסך-הטריאז' לנצח, כי המיון לפי קרבה.
    await expect(page.getByTestId('overview-table')).not.toContainText('תרחיש-קבלה')

    await expect(page.getByTestId('overview-row-8')).toBeVisible()
    await expect(page.getByTestId('overview-row-3')).toBeVisible()
  })

  test('🔴 הסדר הוא התשובה — האירוע הקרוב יותר יושב מעל הרחוק', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })

    // שני האירועים חסרים במידה זהה (0 מתוך 6), ולכן שובר-השוויון הוא קרבת-האירוע:
    // ‏22/08 לפני 27/09. אילו המיון היה לפי `project_id` — הסדר היה הפוך.
    const ids = await page
      .locator('[data-testid^="overview-row-"]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-testid')))
    expect(ids.indexOf('overview-row-8')).toBeLessThan(ids.indexOf('overview-row-3'))
  })

  test('שני ה-KPI מדברים על אותה רשימה שמתחתיהם', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-kpi-missing')).toBeVisible({ timeout: 30_000 })

    // ⚠️ מספרים **לא** מקובעים: הדאטה חיה, ושורות-שיבוץ ייווצרו בצעדים 3.4/3.5. הטענה
    // היציבה היא שהמונה תואם את מספר השורות שמסומנות כחסרות — ולא ערך קסם.
    const missingRows = await page
      .locator('[data-testid^="overview-row-"]', { hasText: 'חסרות' })
      .count()
    await expect(page.getByTestId('overview-kpi-missing')).toContainText(String(missingRows))

    // 🐞 **רגרסיה לפגם שנתפס בצילום-מסך ולא בבדיקה:** `StatTile` מעביר ערך **מספרי**
    // דרך `Money`, והאריח הציג `0 ₪` על **ספירת זימונים**. שני האריחים מונים דברים,
    // ואף אחד מהם אינו כסף.
    await expect(page.getByTestId('overview-kpi-pending')).not.toContainText('₪')
    await expect(page.getByTestId('overview-kpi-missing')).not.toContainText('₪')
  })

  test('ריק-אחרי-סינון אומר "לא נמצאו" ומציע לנקות — ולא מתחזה למאגר ריק', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })

    // "דחוף (עד 72 שעות)" — אין היום אירוע כזה, ולכן זה מצב ריק-אחרי-סינון אמיתי.
    await page.getByTestId('overview-filter-urgent').click()
    await expect(page.getByTestId('overview-empty-filtered')).toBeVisible()
    await expect(page.getByTestId('overview-empty-filtered')).toContainText('התואמים לסינון')

    await page.getByTestId('overview-clear-filters').click()
    await expect(page.getByTestId('overview-table')).toBeVisible()
  })

  test('"שלח שוב למי שפג תוקפן (0)" מכובה ואינו נעלם', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    const bulk = page.getByTestId('overview-resend-all')
    await expect(bulk).toBeVisible({ timeout: 30_000 })
    await expect(bulk).toBeDisabled()
    await expect(bulk).toContainText('(0)')
  })

  // 🔴 **הבדיקה החשובה ביותר במסך הזה.** טבלה עם RLS ובלי policy מחזירה
  // `{data:null, error:null}` — "הצלחה ריקה" — ו"אין כרגע אירועים" הוא כאן **בשורה טובה**.
  // ⇒ שתי משמעויות הפוכות שנראות זהות. הבדיקה מפילה את השאילתה בכוונה ומאמתת שהמסך צועק.
  test('🔴 כשל-טעינה מציג שגיאה + "נסה שוב", לעולם לא "אין כרגע אירועים"', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    await page.route('**/rest/v1/projects*', (route) =>
      route.fulfill({ status: 500, body: '{"message":"boom"}' }),
    )
    await page.goto('/hostesses')

    await expect(page.getByTestId('overview-retry')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('לא הצלחנו לטעון את רשימת האירועים')).toBeVisible()
    await expect(page.getByTestId('overview-empty-true')).toHaveCount(0)

    // רגרסיה: מסירים את היירוט ולוחצים "נסה שוב" — המסך חוזר לעצמו.
    await page.unroute('**/rest/v1/projects*')
    await page.getByTestId('overview-retry').click()
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
  })

  test('🔒 מנהלת פרויקטים רואה את הרשימה — ואין לה אף כפתור-שליחה', async ({ page }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await page.goto('/hostesses')

    // 🔑 **בקרה חיובית קודם:** אם ההתחזות שבורה, "אין כפתורים" נראה כמו הרשאות מושלמות
    // בעוד שבפועל המסך פשוט ריק. לכן קודם מאמתים שהיא **כן** רואה את הטבלה.
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('overview-resend-all')).toHaveCount(0)
    await expect(page.locator('[data-testid^="overview-resend-"]')).toHaveCount(0)
  })
})
