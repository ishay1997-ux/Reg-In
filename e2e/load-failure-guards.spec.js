import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// E2E לסבב-התיקון של 31/07/2026 — "כשל-טעינה מתחזה ל'נטען, אין נתונים'".
//
// ⚠️ **הבדיקות כאן מוכיחות כשל, לא הצלחה.** שומר שראית אותו *עובר* לא הוכיח דבר; לכן כל
// בדיקה כאן **מפילה בכוונה** את השאילתה (page.route ⇒ 500), מאמתת שההגנה צועקת, ואז
// מסירה את היירוט ומאמתת שההתנהגות הרגילה חזרה (רגרסיה).
//
// ⚠️ אין הזרקת-שורות ל-DB החי (src/CLAUDE.md): היירוט הוא ברשת בלבד. החריג היחיד הוא
// לקוח-בדיקה יחיד שנוצר ונמחק כאן (אותה מוסכמה כמו customers.spec.js) — הוא נחוץ כי כל
// ארבעת הלקוחות בדאטה החיה מחזיקים הצעה פתוחה, ובלעדיו אין מקרה "לקוח נקי" לרגרסיה.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

const CLEAN_COMPANY_NUMBER = String(Date.now()).slice(-9)
const CLEAN_COMPANY_NAME = `בדיקת שומרים ${CLEAN_COMPANY_NUMBER}`

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// לקוח "נקי" (בלי אף הצעה) — המקרה היחיד שבו ארכוב **לא** אמור לשאול. נוצר ונמחק ברמת-DB
// כי אין UI-מחיקה (מוסכמת-ארכיון), בדיוק כמו ב-customers.spec.js.
async function withServiceClient(fn) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !CEO_EMAIL || !CEO_PASSWORD) return
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON)
  try {
    await sb.auth.signInWithPassword({ email: CEO_EMAIL, password: CEO_PASSWORD })
    await fn(sb)
  } finally {
    await sb.auth.signOut()
  }
}

test.describe('שומרי "לא ידוע" — כשל-טעינה שמכבה רשת-ביטחון (סבב 31/07)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')
  test.skip(!SUPABASE_URL || !SUPABASE_ANON, 'VITE_SUPABASE_* חסרים — אין ניקוי-DB, מדלגים')

  test.beforeAll(async () => {
    await withServiceClient(async (sb) => {
      await sb.from('customers').insert({
        company_name: CLEAN_COMPANY_NAME,
        company_number: CLEAN_COMPANY_NUMBER,
        customer_type: 'private_company',
        contact_name: 'איש קשר בדיקה',
        phone: '03-1234567',
        email: 'guards@example.com',
      })
    })
  })

  test.afterAll(async () => {
    await withServiceClient(async (sb) => {
      await sb.from('customers').delete().eq('company_number', CLEAN_COMPANY_NUMBER)
    })
  })

  test('לקוחות: כשל בטעינת ההצעות ⇒ באנר + כל ארכוב שואל "טרם ידוע"', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)

    // ── הכשל מוחזר בכוונה: שאילתת ההצעות נופלת ─────────────────────────────
    await page.route('**/rest/v1/quotes*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced"}' }),
    )
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: 'רשימת לקוחות' })).toBeVisible()

    // ההגנה צועקת: המשתמש רואה שמשהו לא נטען — ולא מסך שמשקר בביטחון.
    await expect(page.getByTestId('customers-revenue-error')).toBeVisible()

    // ⚠️ הלב של הממצא: לפני התיקון האזהרה **נעלמה** במצב הזה. גם לקוח נקי לגמרי
    // חייב לקבל כאן את שאלת "טרם ידוע" — כי אי-אפשר לדעת שהוא נקי.
    await page.getByTestId('customers-search').fill(CLEAN_COMPANY_NUMBER)
    const cleanRow = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: CLEAN_COMPANY_NAME })
    await cleanRow.getByTitle('העבר לארכיון').click()
    await expect(page.getByTestId('confirm-dialog-title')).toHaveText('טרם ידוע אם יש הצעות פתוחות')
    // מבטלים — הבדיקה מוכיחה את השאלה, לא מארכבת שורה אמיתית.
    await page.getByTestId('confirm-dialog-cancel').click()

    // ── הכשל מוסר: המסך חוזר להתנהגות הרגילה ───────────────────────────────
    await page.unroute('**/rest/v1/quotes*')
    await page.getByTestId('customers-revenue-retry').click()
    await expect(page.getByTestId('customers-revenue-error')).toBeHidden()

    // רגרסיה (א): לקוח נקי מאורכב **בלי שאלה** — הכרעת-11/07 נשמרת.
    await cleanRow.getByTitle('העבר לארכיון').click()
    await expect(page.getByTestId('confirm-dialog-title')).toHaveCount(0)
    await expect(page.getByText(CLEAN_COMPANY_NAME)).toBeHidden()

    // רגרסיה (ב): לקוח עם הצעה פתוחה מקבל את האזהרה הרגילה (§7.34) ולא את "טרם ידוע".
    await page.getByTestId('customers-search').fill('')
    const busyRow = page.locator('[data-testid^="customer-row-"]').first()
    await busyRow.getByTitle('העבר לארכיון').click()
    await expect(page.getByTestId('confirm-dialog-title')).toHaveText('ללקוח יש הצעות פתוחות')
    await page.getByTestId('confirm-dialog-cancel').click()
  })
})
