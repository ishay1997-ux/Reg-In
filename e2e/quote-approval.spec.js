import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// צעד 4.1 (31/07/2026) — קצוות זרימת-האישור.
//
// ⚠️ **אישור מוצלח הוא בלתי-הפיך** — הוא יוצר פרויקט, וטריגר-הנעילה (§7.50) יחד עם
// `projects.quote_id … on delete restrict` חוסמים גם UPDATE וגם DELETE אחר-כך. אין
// "ביטול אישור", ויש פרויקט-Supabase חי אחד. ולכן **שום בדיקה כאן אינה מאשרת הצעה
// אמיתית**: המסלולים החוסמים נבדקים ביירוט-רשת, והחומה עצמה נבדקת על מזהה שאינו קיים.
// ההוכחה שהשומרים במסד באמת יורים נעשתה ב-SQL בטרנזקציה שגולגלה אחורה (module-3.md §9).
//
// מה הקובץ הזה מוסיף מעל `server-messages-and-inactive-product.spec.js` (סבב D), שכבר
// מכסה על המסך לחיצה-כפולה · הצעה-ללא-דיילות · 42501 · P0002 · שגיאה-לא-מוכרת:
//   • שומר-התאריך (§7.32) — המסלול היחיד מהמשפחה שלא נבדק על המסך.
//   • תפקיד-צפייה: הכפתור חסר בשני המסכים **וגם** ה-RPC עצמו דוחה.
//   • הצעה סגורה: הכפתור חסר גם למי שיש לה הרשאה — אחרת בדיקת-ההרשאה עוברת מסיבה שגויה.
// ══════════════════════════════════════════════════════════════════════════════════════

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// 🔄 03/09/2026: הצעה #10 ולקוח 46 (דמו-יולי) נמחקו בהכרעת-ישי. שתי הבדיקות שנשענו עליהם
// בוחרות עכשיו בזמן-ריצה — השורה הראשונה בלשונית "מאושרות", והלקוח הראשון ברשימה שמציג
// הכנסות (= יש לו הצעה מאושרת ⇒ יש "צפייה במסמך") — ונופלות ברעש כשאין (פיקסטורה, לא באג).

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// מחזיר שגיאת-שרת מומצאת ל-RPC מסוים, בלי שהבקשה תגיע למסד.
async function failRpc(page, rpcName, { message, code = 'P0001' }) {
  await page.route(`**/rest/v1/rpc/${rpcName}*`, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message, code, details: null, hint: null }),
    }),
  )
}

// קריאת-RPC ישירה **מתוך הדפדפן המחובר**, כדי שה-JWT של המשתמשת יישלח — הדלת שעוקפת
// את המסך. התבנית (והנימוק למה URL+anon עוברים כפרמטרים) מ-`cost-visibility.spec.js`.
async function approveAsUser(page, quoteId) {
  return page.evaluate(
    async ({ url, anon, id }) => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
      const token = JSON.parse(sessionStorage.getItem(key)).access_token
      const res = await fetch(`${url}/rest/v1/rpc/approve_quote_and_create_project`, {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_quote_id: id }),
      })
      return { status: res.status, body: await res.json() }
    },
    { url: SUPABASE_URL, anon: SUPABASE_ANON, id: quoteId },
  )
}

test.describe('שומר תאריך-האירוע מגיע למסך בניסוח בר-פעולה (§7.32)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('תאריך שעבר — ההודעה אומרת מה לתקן, ולא מציגה את התאריך הגולמי', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)

    // ⚠️ המחרוזת אינה מומצאת: זו הפלט המילולי של הפונקציה החיה, שנמדד 31/07/2026
    // בסוללת-ה-SQL המגולגלת (module-3.md §9). כך הבדיקה נשענת על החוזה האמיתי
    // שבין ה-RAISE שבמסד לבין `quoteServerErrorMessage`, ולא על ניחוש-ניסוח.
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר (2026-07-30)',
    })

    await page.goto('/quotes')
    const approve = page.getByTestId(/^quote-approve-/).first()
    await expect(approve).toBeVisible({ timeout: 30_000 })
    await approve.click()
    await expect(page.getByTestId('approve-dialog-title')).toBeVisible()
    await page.getByTestId('approve-confirm').click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('תאריך האירוע')
    await expect(alert).toContainText('לעדכן את התאריך')
    // התאריך הגולמי הוא ערך-מסד ולא מידע שימושי למשתמשת — ואם הוא מופיע, סימן
    // שההודעה עברה כמות-שהיא במקום להיות ממופה.
    await expect(alert).not.toContainText('2026-07-30')
    await expect(alert).not.toContainText('אישור ההצעה נכשל')
  })
})

test.describe('הרשאת-צפייה: הכפתור חסר בשני המסכים — והחומה עצמה דוחה', () => {
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD,
    'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו ב-.env.local',
  )

  test.beforeEach(async ({ page }) => {
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
  })

  test('מסך ההצעות: אפס כפתורי-אישור, ובכל זאת השורות מוצגות', async ({ page }) => {
    await page.goto('/quotes')

    // ⚠️ בקרת-חיוב חובה: מנהלת-כספים היא `view` על 'הצעות מחיר', ולכן היא **כן** רואה
    // את הטבלה. בלי האימות הזה, מסך שנשבר לגמרי (או הרשאה שנשללה בטעות) היה נותן
    // "0 כפתורי-אישור" ועובר בירוק מהסיבה הלא-נכונה.
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="quote-document-"]').first()).toBeVisible()

    await expect(page.locator('[data-testid^="quote-approve-"]')).toHaveCount(0)
    await expect(page.locator('[data-testid^="quote-reject-"]')).toHaveCount(0)
    await expect(page.locator('[data-testid^="quote-edit-"]')).toHaveCount(0)
  })

  test('עמוד הלקוח: אותה פעולה, מסך אחר — גם שם אין כפתור-אישור', async ({ page }) => {
    // ⚠️ שני שערי-הרשאה נפרדים על העמוד הזה (LOCAL-15): `לקוחות` לעריכת הכרטיס,
    // `הצעות מחיר` לפעולות על שורות-ההצעה. מנהלת-כספים היא edit על הראשון ו-view
    // על השני — כלומר שער יחיד היה מעניק לה אישור/דחייה. זו הבדיקה שנועלת את ההפרדה.
    await page.goto('/customers')
    const revenueRow = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: /[1-9][d,]* ₪/ })
      .first()
    await expect(revenueRow, 'אין לקוח עם הכנסות — פיקסטורה חסרה, לא באג').toBeVisible({
      timeout: 30_000,
    })
    await revenueRow.click()
    await expect(page.getByTestId('customer-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="customer-quote-document-"]').first()).toBeVisible()

    await expect(page.locator('[data-testid^="customer-quote-approve-"]')).toHaveCount(0)
    await expect(page.locator('[data-testid^="customer-quote-reject-"]')).toHaveCount(0)
  })

  test('🔒 הקריאה הישירה ל-RPC נדחית ב-42501 — לא הכפתור המוסתר הוא החומה', async ({ page }) => {
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    // ⚠️ **מזהה שאינו קיים במכוון.** שומר-ההרשאה ב-RPC רץ *לפני* חיפוש השורה, ולכן
    // התשובה התקינה היא 42501; ואם השומר היה שבור, היינו מקבלים P0002 — הבדיקה עדיין
    // תופסת. מה שאי-אפשר לקרות בשום מסלול: אישור של הצעה אמיתית.
    const denied = await approveAsUser(page, 999999)
    expect(denied.body?.code).toBe('42501')
    expect(denied.status).toBeGreaterThanOrEqual(400)
    expect(denied.body?.message).toContain('אין הרשאה')
  })
})

test.describe('הצעה סגורה: גם למי שמורשית אין כפתור-אישור', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('הצעה מאושרת — יש "צפייה במסמך" ואין "אישור"', async ({ page }) => {
    // בלי הבדיקה הזו, בדיקת-ההרשאה שלמעלה מוכיחה חצי דבר: השורה נסתרת גם לפי סטטוס
    // (`canEdit && isOpen`), ולכן "אין כפתור" יכול לנבוע מהסטטוס ולא מההרשאה.
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-approved').click()

    const approvedRow = page.locator('[data-testid^="quote-row-"]').first()
    await expect(approvedRow, 'אין הצעה מאושרת — פיקסטורה חסרה, לא באג').toBeVisible({
      timeout: 30_000,
    })
    const APPROVED_QUOTE_ID = (await approvedRow.getAttribute('data-testid')).replace(
      'quote-row-',
      '',
    )
    await expect(page.getByTestId(`quote-document-${APPROVED_QUOTE_ID}`)).toBeVisible()
    await expect(page.getByTestId(`quote-approve-${APPROVED_QUOTE_ID}`)).toHaveCount(0)
    await expect(page.getByTestId(`quote-edit-${APPROVED_QUOTE_ID}`)).toHaveCount(0)

    // ובקרת-החיוב לכיוון השני: למנכ"ל **כן** יש כפתור-אישור, על הלשונית "בתהליך".
    await page.getByTestId('quotes-tab-in_progress').click()
    await expect(page.getByTestId(/^quote-approve-/).first()).toBeVisible()
  })

  test('בקרת-חיוב ל-42501: אותה קריאה בדיוק כמנכ"ל מחזירה P0002, לא חוסר-הרשאה', async ({
    page,
  }) => {
    // ⚠️ בלי הבדיקה הזו, בדיקת-ה-RPC של מנהלת-הכספים חשופה לטענה "היא נדחתה בגלל
    // המזהה שאינו קיים, לא בגלל התפקיד". כאן אותה קריאה, אותו מזהה, תפקיד אחר —
    // והתשובה **שונה**: השומר עבר, והפונקציה נפלה על חיפוש-השורה. זה מה שמוכיח
    // ששני השומרים אמיתיים ושסדר-ההפעלה הוא כפי שהונח (הרשאה לפני חיפוש).
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const missing = await approveAsUser(page, 999999)
    expect(missing.body?.code).toBe('P0002')
    expect(missing.body?.code).not.toBe('42501')
    expect(missing.body?.message).toContain('לא נמצאה')
  })
})
