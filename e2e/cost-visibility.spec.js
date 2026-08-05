import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// סבב G (31/07/2026) — `products.cost` עבר לטבלת-בת `product_costs` עם policy מצומצמת
// (§7.83↳). הבדיקה הזו נועלת את **שני הכיוונים**, כי כל אחד לבדו נותן ביטחון-שווא:
//   • בעלת-הרשאה **כן** רואה עלות ורווחיות — אחרת שברנו את §7.28 (הכרעת-ישי 29/07).
//   • חסומת-הרשאה מקבלת **0 שורות** בפנייה ישירה ל-REST — אחרת לא סגרנו כלום.
//
// ⚠️ הכיוון השני נבדק **ברשת ולא במסך** במכוון: המסך ממילא מסתיר את הפאנל לפי `canEdit`,
// והפער שהסבב הזה בא לסגור היה בדיוק זה — שהחומה מתירה מה שהמסך מסתיר. בדיקה שמסתכלת
// רק על המסך הייתה עוברת בירוק גם לפני התיקון.
// **נמדד לפני התיקון (31/07): כל חמשת התפקידים קיבלו את העלויות**, כולל השניים שחסומים
// לגמרי על 'הצעות מחיר'.
//
// אפס כתיבות: התחברות + קריאות בלבד.
// ══════════════════════════════════════════════════════════════════════════════════════

const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD
const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// פנייה ישירה ל-REST **מתוך הדפדפן המחובר**, כדי שה-JWT של המשתמשת המחוברת יישלח.
// זו בדיוק הדלת שתוקף/סקרן היה משתמש בה — לא ה-UI.
// ⚠️ הכתובת והמפתח מועברים כפרמטרים ולא נקראים מ-`import.meta.env` בתוך `evaluate`:
// ‏Playwright אינו יכול לסרלז פונקציה שמכילה `import.meta`. שניהם ציבוריים ממילא —
// הם יושבים בבנדל של הדפדפן (וזו בדיוק הסיבה שהסבב הזה קיים).
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

async function fetchAsUser(page, path) {
  return page.evaluate(
    async ({ url, anon, p }) => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
      const token = JSON.parse(sessionStorage.getItem(key)).access_token
      const res = await fetch(`${url}/rest/v1/${p}`, {
        headers: { apikey: anon, Authorization: `Bearer ${token}` },
      })
      return { status: res.status, body: await res.json() }
    },
    { url: SUPABASE_URL, anon: SUPABASE_ANON, p: path },
  )
}

test.describe('חשיפת עלות-רכש — מי רואה ומי לא (§7.83↳, סבב G)', () => {
  test('מנהלת פרויקטים: רואה עלות ורווחיות במסך-הבנייה (§7.28 שרד)', async ({ page }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)

    // ⚠️ הכיוון הזה הוא ה"לא שברנו" של הסבב: אם הצירוף היה נשבר, `cost` היה null,
    // `computeLinesCost` היה מחזיר 0, והפאנל היה מציג "עלות משוערת 0 ₪" — **בלי שגיאה**.
    const costs = await fetchAsUser(page, 'product_costs?select=sku,cost')
    expect(costs.status).toBe(200)
    expect(costs.body.length).toBeGreaterThan(0)

    await page.goto('/quotes/new')
    const panel = page.getByTestId('quote-profitability')
    await expect(panel).toBeVisible({ timeout: 30_000 })
    await expect(panel).toContainText('עלות משוערת')
  })

  test('🔒 מנהלת גיוס: 0 שורות עלות בפנייה ישירה ל-REST — לא רק מוסתר במסך', async ({ page }) => {
    test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const costs = await fetchAsUser(page, 'product_costs?select=sku,cost')
    expect(costs.status).toBe(200)
    expect(costs.body).toEqual([])

    // ⚠️ והעמודה הישנה לא חזרה מהדלת האחורית: `products` פתוח לקריאה לכולם (§7.83 —
    // הקטלוג נצרך גם ע"י מודולים עתידיים), ולכן חייבים לוודא שהעלות **אינה** בתוכו.
    const products = await fetchAsUser(page, 'products?select=*')
    expect(products.status).toBe(200)
    expect(products.body.length).toBeGreaterThan(0)
    for (const row of products.body) {
      expect(row).not.toHaveProperty('cost')
    }
  })

  test('§7.34 — הצירוף LEFT: מוצר בלי עלות נשאר בקטלוג ואינו נעלם', async ({ page }) => {
    test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // מנהלת-הגיוס אינה רשאית לקרוא עלויות, ולכן זו הדמיה חינמית של "מוצר בלי שורת-עלות":
    // אם הצירוף היה `!inner`, הקטלוג שלה היה חוזר **ריק** — וזה בדיוק הבאג של סבב D
    // (מוצר שנעלם מהקטלוג ⇒ שורה מאבדת קטגוריה ⇒ 0 ₪ נשמר בשקט).
    const joined = await fetchAsUser(page, 'products?select=sku,product_costs(cost)')
    expect(joined.status).toBe(200)
    expect(joined.body.length).toBeGreaterThan(0)
    expect(joined.body.every((row) => row.product_costs === null)).toBe(true)
  })
})
