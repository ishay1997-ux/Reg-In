import fs from 'fs'
import path from 'path'
import { test, expect } from '@playwright/test'
import anchors from './smoke-anchors.json' with { type: 'json' }

// בדיקת-עשן (הכרעת-ישי 30/07/2026, "יד חופשית"): מסע-קריאה אחד על כל המסכים הראשיים,
// שמוכיח שהמערכת באמת עולה עם הנתונים האמיתיים. רצה דרך `npm run smoke` (scripts/smoke.mjs),
// **בנפרד מ-gate/CI בכוונה** — קרטוע-רשת לא יחסום פריסה.
//
// העקרונות (מהלקחים של ישי בפרויקט gedood-710, אומצו כלשונם):
// 1. **קריאה-בלבד כמנגנון, לא כהבטחה** — כל בקשת-כתיבה (POST/PATCH/PUT/DELETE) נחסמת
//    ברמת-הרשת ומפילה את הריצה, פרט לזרימת-ההתחברות עצמה. יעד חיצוני שאינו האפליקציה
//    או Supabase נחסם כליל.
// 2. **טענות חזקות** — כל מסך מאומת מול ערך-עוגן אמיתי מ-smoke-anchors.json ("יש שורות" פסול).
// 3. **קודי-יציאה מובחנים** — כשל-התחברות נרשם לקובץ-סמן שהעוטפן מתרגם ל-exit 2 (בעיית
//    סיסמה, לא באג); כשל-טענה = exit 1 (באג אמיתי); שרת לא רץ = exit 3 (נבדק בעוטפן).
// 4. **SMOKE_BREAK** — מתג-חבלה מכוון למבחן-הקבלה "שברתי בכוונה וראיתי שהיא נכשלת".
//    ערכים: empty-products (קטלוג ריק) · empty-quotes (רשימת-הצעות ריקה).

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const FAILURE_MARKER = path.resolve('test-results/smoke-failure-class.json')

// בקשות-כתיבה שההתחברות עצמה חייבת (מנגנון נעילת-5-הניסיונות של מודול 1). register_failed_login
// אינו כאן במכוון: חסימתו מונעת מריצת-עשן עם סיסמה שגויה לקדם נעילה אמיתית של החשבון.
const ALLOWED_WRITE_PATHS = [
  '/auth/v1/',
  '/rest/v1/rpc/check_login_lock',
  '/rest/v1/rpc/reset_login_attempts',
]

test.describe('בדיקת-עשן', () => {
  test.skip(
    !CEO_EMAIL || !CEO_PASSWORD,
    'E2E_CEO_* לא הוגדרו — העוטפן אמור לתפוס זאת לפני (exit 2)',
  )

  test('כל המסכים הראשיים עולים עם הנתונים האמיתיים', async ({ page }) => {
    const blockedWrites = []
    const externalHits = []
    const consoleErrors = []

    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    // מנגנון הקריאה-בלבד + כליאת-רשת: חוסם יעדים חיצוניים וכל כתיבה שאינה בזרימת-ההתחברות.
    await page.route('**/*', async (route) => {
      const req = route.request()
      const url = new URL(req.url())
      const isApp = url.hostname === 'localhost'
      const isSupabase = url.hostname.endsWith('.supabase.co')
      if (!isApp && !isSupabase) {
        externalHits.push(`${req.method()} ${url.href}`)
        return route.abort()
      }
      const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method())
      if (isWrite && isSupabase && !ALLOWED_WRITE_PATHS.some((p) => url.pathname.startsWith(p))) {
        blockedWrites.push(`${req.method()} ${url.pathname}`)
        return route.abort()
      }
      return route.continue()
    })

    // מתגי-החבלה למבחן-הקבלה: מרוקנים תשובת-קריאה אחת, והעוגן חייב להפיל את הריצה.
    if (process.env.SMOKE_BREAK === 'empty-products') {
      await page.route(
        (url) => url.pathname.includes('/rest/v1/products'),
        (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
      )
    }
    if (process.env.SMOKE_BREAK === 'empty-quotes') {
      await page.route(
        (url) => url.pathname.includes('/rest/v1/quotes'),
        (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
      )
    }

    // התחברות. כל כשל כאן מסומן כ-auth — העוטפן מתרגם ל-exit 2 (סיסמה/משתמש, לא באג).
    try {
      await page.goto('/login')
      await page.getByPlaceholder('כתובת דוא״ל').fill(CEO_EMAIL)
      await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
      await page.getByRole('button', { name: 'התחברות', exact: true }).click()
      await expect(page).toHaveURL('/', { timeout: 30_000 })
    } catch (err) {
      fs.mkdirSync(path.dirname(FAILURE_MARKER), { recursive: true })
      fs.writeFileSync(FAILURE_MARKER, JSON.stringify({ failureClass: 'auth' }))
      throw err
    }

    // מסך הבית: הסרגל נבנה ממפת-ההרשאות האמיתית — מודול חסר = הרשאות לא נטענו.
    await expect(page.getByRole('link', { name: anchors.sidebarModule })).toBeVisible()

    // לקוחות: הלקוחה המוכרת עם ההכנסות המחושבות שלה (עובר דרך מנוע-התמחור האמיתי).
    await page.goto('/customers')
    const customerRow = page.locator('tr').filter({ hasText: anchors.customers.name }).first()
    await expect(customerRow).toContainText(anchors.customers.revenues)

    // עמוד-הלקוח: אותו עוגן ברצועת-המדדים — מסלול נפרד (שאילתות עמוד-הרשומה).
    await customerRow.click()
    await expect(page).toHaveURL(/\/customers\/\d+/)
    await expect(page.getByText(anchors.customers.revenues).first()).toBeVisible()

    // הצעות: הסכום הקנוני של תרחיש-האפיון חייב להופיע ברשימה.
    await page.goto('/quotes')
    await expect(page.getByText(anchors.quotes.knownAmount).first()).toBeVisible()

    // בניית-הצעה: שדה-היחס נטען מ-params האמיתי — ריק/שגוי = טעינת-פרמטרים שבורה.
    await page.goto('/quotes/new')
    await expect(page.locator('#quote-ratio')).toHaveValue(anchors.builder.ratioDefault)

    // מסך המחירים: הקטלוג המלא + מחיר/עלות/מדרגות של מוצר-העוגן + פרמטר המע"מ.
    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-row')).toHaveCount(anchors.prices.productCount)
    const productRow = page.getByTestId('prices-row').filter({ hasText: anchors.prices.sku })
    await expect(productRow).toContainText(anchors.prices.basePrice)
    await expect(productRow).toContainText(anchors.prices.cost)
    await expect(productRow.getByTestId('prices-tiers-button')).toHaveText(
      anchors.prices.tiersButton,
    )
    await expect(page.getByTestId('param-vat')).toHaveValue(anchors.prices.vat)

    // המנגנונים — לא הבטחות: אפס ניסיונות-כתיבה, אפס יעדים חיצוניים, אפס שגיאות-קונסול.
    expect(blockedWrites, 'מסך ניסה לכתוב למסד בזמן קריאה-בלבד').toEqual([])
    expect(externalHits, 'בקשה ליעד חיצוני שאינו האפליקציה/Supabase').toEqual([])
    expect(consoleErrors, 'שגיאות-קונסול במהלך המסע').toEqual([])
  })
})
