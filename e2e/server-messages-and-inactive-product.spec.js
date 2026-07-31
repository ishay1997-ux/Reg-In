import { test, expect } from '@playwright/test'

// E2E לסבב-התיקונים D (31/07/2026) — שני מקרים שבהם המשתמשת נתקעה ולא יכלה להבין ממה.
//
// **מה זה מכסה, ולמה לא די בבדיקת-יחידה:** בדיקת-היחידה מוכיחה ש-`quoteServerErrorMessage`
// ממפה נכון מחרוזת נתונה. היא אינה יכולה להוכיח ש**החוט שלם** — שהודעת ה-RPC אכן מגיעה
// מ-Supabase אל `Error.message` ומשם אל החלון שעל המסך. עד היום היא נעצרה ב-`e.cause`,
// ולכן שישה מסלולי-כשל שונים הופיעו כמשפט אחד. אותו דבר במוצר-מושבת: היחידה מוכיחה
// ש-`repriceLine` אינו נופל ל-0; רק כאן נראה שהשורה נשמרת ושהתג מוצג.
//
// ⚠️ **כל בדיקה כאן מפילה את המסלול בכוונה, מאמתת שההגנה צועקת, ואז מסירה את היירוט
// ומאמתת שההתנהגות התקינה חזרה** (אזהרה 3 של תוכנית-התיקונים: שומר שלא נצפה נכשל אינו
// שומר). התבנית זהה ל-`load-failure-guards.spec.js` מסבב B.
//
// 🧨 **אפס כתיבות למסד.** אין סביבת-בדיקה נפרדת — יש פרויקט Supabase חי אחד
// (`src/CLAUDE.md`). גם שגיאת-השרת וגם ההשבתה נוצרות ב**יירוט תשובת-הרשת** בלבד:
// הצעה 6 והמוצר `04ST` נשארים במסד בדיוק כפי שהם.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

// מק"ט שיושב על שורת-דיילות בהצעה פתוחה אמיתית (אומת במסד 31/07/2026: הצעה 6,
// "כנס לקוחות שנתי" של מדיטק, 6 × 500 ₪). זה בדיוק התרחיש שהתיקון נועד לו.
const HOSTESS_SKU = '04ST'
const QUOTE_WITH_HOSTESS_LINE = 6

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// מחזיר שגיאת-Postgres גולמית מ-RPC, בדיוק בצורה ש-PostgREST פולט (message/code/details).
// המחרוזת מועתקת מילולית מקובץ-המיגרציה — היא הקלט האמיתי של הממפה.
async function failRpc(page, rpcName, { message, code = 'P0001' }) {
  await page.route(`**/rest/v1/rpc/${rpcName}*`, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message, code, details: null, hint: null }),
    }),
  )
}

// מדמה "המנכ"ל השבית את המוצר **אחרי** שהוא כבר נכנס להצעה" — ברמת תשובת-הרשת בלבד.
//
// ⚠️ **שתי התנהגויות, וזה מה שהופך את הבדיקה למשמעותית.** הניסיון הראשון רק צבע את השורה
// ל-`inactive` בדרך חזרה — והבדיקה **עברה גם כשהבאג הוחזר לקוד**, כלומר לא בדקה דבר:
// השורה עצמה נשארה בקטלוג, בעוד שהכשל האמיתי הוא **היעלמותה ממנו**. לכן היירוט מחקה גם
// את השרת: אם השאילתה נושאת `status=eq.active` (הצורה שהייתה כאן עד סבב D) — השורה
// **נמחקת מהתשובה**, בדיוק כפי ש-PostgREST היה עושה על מוצר מושבת אמיתי.
// כך גרסה עם המסנן מאבדת את המוצר ונופלת, וגרסת-התיקון מקבלת אותו מסומן.
async function deactivateProduct(page, sku) {
  await page.route('**/rest/v1/products*', async (route) => {
    const response = await route.fetch()
    let body
    try {
      body = await response.json()
    } catch {
      return route.fulfill({ response })
    }
    if (!Array.isArray(body)) return route.fulfill({ response })

    const serverFiltersToActive = /status=eq\.active/.test(route.request().url())
    const patched = serverFiltersToActive
      ? body.filter((row) => row.sku !== sku)
      : body.map((row) => (row.sku === sku ? { ...row, status: 'inactive' } : row))
    return route.fulfill({ response, json: patched })
  })
}

test.describe('הודעות-הכשל של המסד מגיעות למסך (סבב D)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  // פותח את חלון-האישור על ההצעה הפתוחה הראשונה בלשונית "בתהליך" ולוחץ "אישור".
  async function confirmFirstApproval(page) {
    await page.goto('/quotes')
    const approve = page.getByTestId(/^quote-approve-/).first()
    await expect(approve).toBeVisible({ timeout: 30_000 })
    await approve.click()
    await expect(page.getByTestId('approve-dialog-title')).toBeVisible()
    await page.getByTestId('approve-confirm').click()
  }

  test('כשל-אישור: ההודעה הממופה מוצגת, והמחרוזת הגולמית לא', async ({ page }) => {
    // המחרוזת מ-20260731085335, כולל ערך-ה-enum שהמסד מזריק ל-%.
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'ההצעה כבר טופלה (סטטוס approved) — לא ניתן לאשר שוב',
    })
    await confirmFirstApproval(page)

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    // ⇐ הראיה שההגנה צועקת נכון: ניסוח בר-פעולה, בלי ערך-enum באנגלית.
    await expect(alert).toContainText('כבר אושרה')
    await expect(alert).toContainText('לרענן')
    await expect(alert).not.toContainText('approved')
    // ⇐ והראיה שזו באמת ההודעה הממופה ולא ה-fallback הישן.
    await expect(alert).not.toContainText('אישור ההצעה נכשל')
  })

  test('כשל אחר של אותו RPC נותן הודעה **אחרת** — לא משפט אחד לכולם', async ({ page }) => {
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'לא ניתן לאשר הצעה ללא שורות-דיילות (אין אירוע בלי דיילות)',
    })
    await confirmFirstApproval(page)

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('להוסיף שורת דיילות')
    await expect(alert).not.toContainText('כבר אושרה')
  })

  test('שגיאה לא-מוכרת נשארת עם ה-fallback (רגרסיה: אין ניחוש)', async ({ page }) => {
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'duplicate key value violates unique constraint "projects_quote_id_key"',
      code: '23505',
    })
    await confirmFirstApproval(page)

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('אישור ההצעה נכשל')
    // מחרוזת-מסד באנגלית לעולם לא מוצגת למשתמשת.
    await expect(alert).not.toContainText('duplicate key')
  })

  test('רגרסיה — בלי יירוט, חלון-האישור נפתח נקי ובלי שגיאה', async ({ page }) => {
    // ⚠️ **לא לוחצים "אישור"**: אישור הוא בלתי-הפיך (יוצר פרויקט אמיתי). מה שנבדק כאן
    // הוא שהמסלול התקין לא נשבר מהשינוי — החלון נפתח, ואין הודעת-שגיאה תלויה בו.
    await page.goto('/quotes')
    const approve = page.getByTestId(/^quote-approve-/).first()
    await expect(approve).toBeVisible({ timeout: 30_000 })
    await approve.click()
    await expect(page.getByTestId('approve-dialog-title')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('מוצר שהושבת אינו מפיל שורה קיימת ל-0 ₪ (סבב D)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('השורה מסומנת, המחיר שורד שינוי-כמות, והשמירה אינה נחסמת', async ({ page }) => {
    await deactivateProduct(page, HOSTESS_SKU)
    await page.goto(`/quotes/${QUOTE_WITH_HOSTESS_LINE}/edit`)

    const table = page.getByTestId('quote-lines-table')
    await expect(table).toBeVisible({ timeout: 30_000 })

    // (1) הסימון — בלעדיו ההשבתה בלתי-נראית, והמוצר "נעלם" מהבחירה בלי הסבר.
    await expect(page.getByTestId(/^quote-line-inactive-/).first()).toContainText('מוצר מושבת')

    // (2) המחיר השמור מוצג ולא 0 — זה הכשל שהתיקון נועד לו.
    const priceCells = table.locator('tbody tr td:nth-child(4)')
    await expect(priceCells.first()).not.toContainText(/^0\s/)

    // (3) ⇐ הלב: שינוי-כמות מפעיל `repriceLine`, ובגרסה הישנה זה איפס את המחיר לצמיתות.
    const qty = page.getByTestId(/^quote-line-qty-/).first()
    await qty.click()
    await qty.fill('7')
    await qty.blur()
    await expect(priceCells.first()).not.toContainText(/^0\s/)

    // (4) והשמירה אינה נחסמת בהודעת-הדיילות המבלבלת — הקטגוריה שרדה, ולכן
    //     `sumHostessQty` עדיין רואה שורת-דיילות. **לא לוחצים שמור** (כתיבה למסד חי):
    //     נבדק שהוולידציה עצמה לא מסמנת את הטבלה, וזה בדיוק אותו כלל שחוסם את השמירה.
    await expect(page.getByTestId('quote-lines-error')).toHaveCount(0)
  })

  test('רגרסיה — בלי יירוט, אין תג-השבתה ואין שינוי במסך', async ({ page }) => {
    await page.goto(`/quotes/${QUOTE_WITH_HOSTESS_LINE}/edit`)
    await expect(page.getByTestId('quote-lines-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId(/^quote-line-inactive-/)).toHaveCount(0)
    await expect(page.getByTestId('quote-lines-error')).toHaveCount(0)
  })
})
