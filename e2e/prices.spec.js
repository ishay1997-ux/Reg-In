import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// צעד 4.3 (31/07/2026) — החבילה הקבועה של לשונית "מחירים" (§7.84).
//
// ⚠️ **החבילה הזמנית של צעד 3.6 לא הועתקה לכאן.** היא עשתה כתיבה-ושחזור אמיתיים על
// הקטלוג החי — ובדיוק בדפוס הזה אירע ב-30/07 אובדן-נתונים אמיתי (5 מדרגות של תג-ממותג
// נמחקו כשבדיקה נסגרה בין "מחק" ל"הכנס"). כאן **כל מסלולי-הכתיבה מיורטים ברשת**:
// המסך מרנדר ומאמת באמת, המסד לא שומע. הדרישה הזו כתובה במפורש במטריצת-ה-QA של המודול.
//
// הכתיבה האמיתית היחידה היא זו שמובטח שתיחסם: קריאה ישירה ל-`products` עם JWT של
// מנהלת-פרויקטים — קיר-ה-RLS, שהוא החומה האמיתית (כלל ברזל 9; המסך הוא נוחות).
// ══════════════════════════════════════════════════════════════════════════════════════

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// ⚠️ ערכי-זרע אמיתיים, נמדדו חי 31/07/2026 מול המסד (לא הועתקו ממסמך שעלול להתיישן):
// 11 מוצרים · 40 מדרגות · `B-REG-TAG` = "תג שם רגיל - ממותג", מחירון 6.00, חמש מדרגות
// ‏(1-50@6.00 · 51-200@5.50 · 201-400@5.00 · 401-1000@4.50 · 1001+@4.00).
const PRODUCT_COUNT = 11
const TIER_SKU = 'B-REG-TAG'
const TIER_COUNT = 5

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// חוסם **כל** כתיבה לשלוש טבלאות-הקטלוג ומחזיר את מה שנשלח. שום בדיקה כאן לא נוגעת
// בקטלוג האמיתי — וכל ניסיון-כתיבה שלא נצפה כאן הוא באג בבדיקה, לא בקוד.
// ‏delayMs מאט את התשובה המזויפת. why: אחרי שמירה מוצלחת החלון נסגר מעצמו כעבור 900ms,
// ובקשה שנענית מיידית משאירה חלון-זמן צר מדי לאמת בו את מה שמוצג — כלומר בדיקה תנודתית.
// ההשהיה היא של **הבדיקה**, לא של המוצר.
function interceptCatalogWrites(page, { delayMs = 0 } = {}) {
  const sent = []
  return {
    sent,
    install: async () => {
      for (const table of ['products', 'price_tiers', 'params', 'product_costs']) {
        await page.route(`**/rest/v1/${table}?*`, async (route) => {
          const req = route.request()
          // ⚠️ `continue()` ולא `fallback()`: המסך שולף מדרגות **פר-מוצר** (12 שליפות בטעינה),
          // ו-`fallback()` מריץ מחדש את התאמת-המסלולים לכל אחת. בהרצה בודדת זה לא נראה, ובריצה
          // הטורית המלאה (66 בדיקות) התוספת חרגה מתקרת-ההמתנה והפילה את הבדיקה. נמדד, לא נוחש.
          if (req.method() === 'GET' || req.method() === 'HEAD') return route.continue()
          sent.push({ table, method: req.method(), body: req.postDataJSON() })
          if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ok: true }]),
          })
        })
      }
    },
  }
}

test.describe('מנכ"ל — הקטלוג נטען ונערך (4.3)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('הקטלוג מציג את 11 המוצרים ואת כפתור ההוספה', async ({ page }) => {
    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('prices-row')).toHaveCount(PRODUCT_COUNT)
    // בקרת-חיוב: למנכ"ל **יש** כתיבה — אחרת בדיקת-השלילה שלמטה עוברת מהסיבה הלא-נכונה.
    await expect(page.getByTestId('prices-add-product')).toBeVisible()
  })

  test('עורך המדרגות נפתח עם חמש המדרגות האמיתיות של תג-ממותג', async ({ page }) => {
    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })

    const row = page.getByTestId('prices-row').filter({ hasText: TIER_SKU })
    await row.getByTestId('prices-tiers-button').click()
    await expect(page.getByTestId('tiers-dialog-title')).toBeVisible()
    await expect(page.getByTestId('tier-row')).toHaveCount(TIER_COUNT)

    // ערכים אמיתיים ולא "יש שורות": מדרגה שנטענת ריקה הייתה עוברת ספירה בלבד.
    await expect(page.getByTestId('tier-min-qty').nth(2)).toHaveValue('201')
    await expect(page.getByTestId('tier-max-qty').nth(2)).toHaveValue('400')
    await expect(page.getByTestId('tier-price').nth(2)).toHaveValue('5')
  })

  test('"עד" קטן מ"מכמות" חוסם את השמירה — ואף כתיבה לא יוצאת', async ({ page }) => {
    const writes = interceptCatalogWrites(page)
    await writes.install()

    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })
    await page
      .getByTestId('prices-row')
      .filter({ hasText: TIER_SKU })
      .getByTestId('prices-tiers-button')
      .click()
    await expect(page.getByTestId('tier-row')).toHaveCount(TIER_COUNT)

    // 201..400 הופך ל-201..5 — טווח הפוך, שגיאה חוסמת.
    await page.getByTestId('tier-max-qty').nth(2).fill('5')
    await page.getByTestId('tiers-save').click()

    await expect(page.getByTestId('tier-row-error').first()).toBeVisible()
    await expect(page.getByTestId('tiers-save-success')).toHaveCount(0)
    // ⚠️ הטענה האמיתית: לא "נראתה שגיאה" אלא **שהמסד לא נגע בכלום**.
    expect(writes.sent).toHaveLength(0)
  })

  test('מחיר מתחת לעלות מזהיר אך אינו חוסם — והשמירה אכן יוצאת (LOCAL-20)', async ({ page }) => {
    const writes = interceptCatalogWrites(page, { delayMs: 1500 })
    await writes.install()

    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })
    await page
      .getByTestId('prices-row')
      .filter({ hasText: TIER_SKU })
      .getByTestId('prices-tiers-button')
      .click()
    await expect(page.getByTestId('tier-row')).toHaveCount(TIER_COUNT)

    // מחיר-הפסד מכוון (מבצע/חיסול) — הכרעת-ישי: **אזהרה מיידעת, שגיאה חוסמת**.
    // ⚠️ הוולידציה מחושבת ב**לחיצת-שמור** בלבד (הקלדה מנקה משוב ישן), ולכן האזהרה
    // נבדקת אחרי הלחיצה ולא לפניה. עלות `B-REG-TAG` = 2.50 ⇒ 0.01 הוא מתחת-לעלות.
    await page.getByTestId('tier-price').nth(2).fill('0.01')
    await page.getByTestId('tiers-save').click()

    await expect(page.getByTestId('tier-row-warning').first()).toBeVisible()
    // וזו החצי השני של ההכרעה: אזהרה **אינה** שגיאה, ולכן השמירה ממשיכה.
    await expect(page.getByTestId('tier-row-error')).toHaveCount(0)
    await expect(page.getByTestId('tiers-save-success')).toBeVisible()

    // וההוכחה שזו באמת שמירה ולא רק הודעה ירוקה: המחיר החדש נמצא במה שנשלח.
    expect(writes.sent.length).toBeGreaterThan(0)
    const payloads = JSON.stringify(writes.sent)
    expect(payloads).toContain('0.01')
    expect(payloads).toContain(TIER_SKU)
  })

  test('מק"ט ריק חוסם יצירת מוצר — ואף כתיבה לא יוצאת', async ({ page }) => {
    const writes = interceptCatalogWrites(page)
    await writes.install()

    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('prices-add-product').click()
    await expect(page.getByTestId('product-dialog-title')).toBeVisible()

    await page.getByTestId('product-form-name').fill('מוצר בדיקה')
    await page.getByTestId('product-form-submit').click()

    await expect(page.getByTestId('product-field-error-sku')).toBeVisible()
    await expect(page.getByTestId('product-save-success')).toHaveCount(0)
    expect(writes.sent).toHaveLength(0)
  })
})

// 🔀 **הועבר ללשונית "פרמטרים" ב-02/09/2026 (מודול 9, Q-1 — הכרעת-ישי).** ‏`PricingParamsCard`
// הוסר מלשונית "מחירים", ושני הפרמטרים (`אחוז_מעמ` · `יחס_אורחים_לדיילת`) חיים עכשיו
// ב-`/system/params` (מנכ"ל) וב-"ההגדרות שלי" (הבעלים). **הכיסוי לא רוכך ולא נמחק** — הוא
// מצביע למסך שבו הפרמטרים באמת נערכים היום, במזהי `settings-` (המרחב `param-*`/`params-*`
// מת יחד עם הכרטיס). החבילה נשארת כאן כי הטענה עצמה היא של §7.84 ("מי עורך את שני
// הפרמטרים האלה"), ולא של מודול 9 — `e2e/settings.spec.js` מכסה את המסך עצמו.
test.describe('פרמטרי-תמחור: שמירה ווולידציה (4.3b ②, הועבר ללשונית "פרמטרים")', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('שמירת שני הפרמטרים יחד יוצאת עם השם והערך הנכונים (§7.84)', async ({ page }) => {
    // 🔴 פער ② (4.3b): שדה-המע"מ היה מכוסה פעם אחת בלבד, לקריאה-בלבד, בתוך `smoke.spec.js`;
    // שדה-היחס וכפתור-השמירה לא היו מכוסים כלל. מע"מ שבור מדפיס ללקוח "מע"מ (0%)" בלי
    // שגיאה (שומר-המע"מ, `03_quotes/CLAUDE.md`) — בדיוק הכשל שסבב A נבנה כדי לעצור.
    const sent = []
    await page.route('**/rest/v1/params?*', async (route) => {
      const req = route.request()
      if (req.method() !== 'PATCH') return route.continue()
      sent.push({ url: decodeURIComponent(req.url()), body: req.postDataJSON() })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ param_id: 1, param_value: req.postDataJSON().param_value }]),
      })
    })

    // שני הפרמטרים יושבים בקבוצה `pricing_timing`, שהיא הקבוצה הפעילה בעלייה ⇒ שמירה
    // אחת של הקבוצה מכסה את שניהם, בדיוק כמו ששני ה-upsert של הכרטיס הישן עשו.
    await page.goto('/system/params')
    await expect(page.getByTestId('settings-value-אחוז_מעמ')).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('settings-value-אחוז_מעמ').fill('17')
    await page.getByTestId('settings-value-יחס_אורחים_לדיילת').fill('60')
    await page.getByTestId('settings-save-button').click()

    await expect(page.getByTestId('toast-success')).toHaveText('ההגדרות נשמרו')
    expect(sent).toHaveLength(2)
    // הכתיבות רצות ברצף שורה-שורה (`useParamsForm.submit`), ולכן שני מזהי-השם ב-URL
    // ולא בגוף (‏`updateParams` שולחת רק `param_value`; השם הוא ה-`.eq()` שבשאילתה).
    const vatWrite = sent.find((s) => s.url.includes('אחוז_מעמ'))
    const ratioWrite = sent.find((s) => s.url.includes('יחס_אורחים_לדיילת'))
    expect(vatWrite?.body.param_value).toBe('17')
    expect(ratioWrite?.body.param_value).toBe('60')
  })

  test('יחס-אורחים לא-תקין (0) חוסם שמירה — ואף כתיבה לא יוצאת', async ({ page }) => {
    const sent = []
    await page.route('**/rest/v1/params?*', async (route) => {
      const req = route.request()
      if (req.method() !== 'PATCH') return route.continue()
      sent.push({ url: decodeURIComponent(req.url()), body: req.postDataJSON() })
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    await page.goto('/system/params')
    await expect(page.getByTestId('settings-value-יחס_אורחים_לדיילת')).toBeVisible({
      timeout: 30_000,
    })

    // `isValidPositiveInt` (`src/lib/validators.js`, דרך קינד `int` במרשם) דורש `n > 0`
    // בדיוק — 0 הוא ערך-הגבול האמיתי שנכשל (`0 מחלק-באפס ב-recommendHostessCount`),
    // לא ערך-שרירותי שנראה לא-תקין.
    await page.getByTestId('settings-value-יחס_אורחים_לדיילת').fill('0')

    // 🔀 הבדל-צורה מהכרטיס הישן, לא ריכוך: שם השגיאה הופיעה **אחרי** לחיצה על "שמור";
    // כאן היא מוצגת מיד, וכפתור-השמירה עצמו מנוטרל — כלומר המסלול חסום בשלב מוקדם יותר.
    await expect(page.locator('[data-param="יחס_אורחים_לדיילת"]').getByRole('alert')).toHaveText(
      'ערך חוקי: מספר שלם חיובי',
    )
    await expect(page.getByTestId('settings-save-button')).toBeDisabled()
    await expect(page.getByTestId('toast-success')).toHaveCount(0)
    expect(sent).toHaveLength(0)
  })
})

test.describe('קטלוג: toggle סטטוס-מוצר (4.3b ④)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('שינוי סטטוס-מוצר שולח PATCH עם המק"ט והערך הנכונים', async ({ page }) => {
    // 🟡 פער ④ (4.3b, תוקן מ-"item ④" השגוי שבקופסה מעל 4.3b ל-item ①, ✅ אושר ע"י המנהל
    // 01/08 — ר' הערת ↳ as-built בטבלת-הצעדים). `prices-status-select` לא מופיע באף בדיקה.
    // **מה שכבר מכוסה** (סבב D, `server-messages-and-inactive-product.spec.js`): התוצאה של
    // מוצר-מושבת (לא נופל ל-0 ₪, לא מוצע בשורה חדשה). **מה שחסר כאן:** שהפעולה עצמה —
    // הבחירה במסך — יוצאת כ-PATCH עם המק"ט והערך הנכונים.
    // ⚠️ `interceptCatalogWrites` (למעלה) לא שומר את ה-URL, רק table/method/body — ולכן
    // כאן יירוט ייעודי, כדי שאפשר יהיה לאמת גם **על איזה מק"ט** בדיוק יצא ה-PATCH.
    const sent = []
    await page.route('**/rest/v1/products?*', async (route) => {
      const req = route.request()
      if (req.method() === 'GET' || req.method() === 'HEAD') return route.continue()
      sent.push({ url: req.url(), body: req.postDataJSON() })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ok: true }]),
      })
    })

    await page.goto('/system/prices')
    await expect(page.getByTestId('prices-table')).toBeVisible({ timeout: 30_000 })

    const row = page.getByTestId('prices-row').filter({ hasText: TIER_SKU })
    await row.getByTestId('prices-status-select').click()
    await page.getByRole('option', { name: 'לא פעיל' }).click()

    await expect.poll(() => sent.length).toBeGreaterThan(0)
    expect(sent[0].body.status).toBe('inactive')
    expect(sent[0].url).toContain(`sku=eq.${TIER_SKU}`)
  })
})

test.describe('קיר-ההרשאות: המסך CEO-בלבד, והמסד אוכף בעצמו (4.3)', () => {
  test.skip(
    !PROJECTS_EMAIL || !PROJECTS_PASSWORD,
    'E2E_PROJECTS_EMAIL/E2E_PROJECTS_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('מנהלת פרויקטים נחסמת מהמסך — ואינה רואה ולו שורת-קטלוג אחת', async ({ page }) => {
    // §7.84 + Ledger LOCAL-21: המסך נשאר מנכ"ל-בלבד. מנהלת-פרויקטים היא `blocked` על
    // 'הגדרות מערכת' (נמדד חי) אך `edit` על 'הצעות מחיר' — כלומר היא **כן** משתמשת
    // בקטלוג בתוך הצעה, ורק התחזוקה שלו סגורה בפניה.
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await page.goto('/system/prices')

    await expect(page.getByTestId('access-denied')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('prices-table')).toHaveCount(0)
    await expect(page.getByTestId('prices-add-product')).toHaveCount(0)
  })

  test('🔒 והחומה אינה המסך: כתיבה ישירה ל-products עם ה-JWT שלה אינה משנה כלום', async ({
    page,
  }) => {
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    // המסך שהיא כן מורשית לו — רק כדי שיהיה session חי בדפדפן.
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    // ⚠️ כתיבה אמיתית שחייבת להיחסם. הערך הנשלח הוא **הערך שכבר יושב בשורה**
    // (`status='active'` על מוצר פעיל), כך שאפילו אילו ה-RLS היה שבור לא היה משתנה
    // דבר במסד — הבדיקה עדיין נכשלת ומדווחת, בלי לזהם את הקטלוג.
    // 🚨 חסימת-RLS מחזירה **מערך ריק עם `error: null`**, לא שגיאה — זה הכשל השקט
    // המרכזי של הפרויקט, ולכן הטענה היא על **מספר השורות** ולא על קיום שגיאה.
    const res = await page.evaluate(
      async ({ url, anon, sku }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const r = await fetch(`${url}/rest/v1/products?sku=eq.${sku}`, {
          method: 'PATCH',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ status: 'active' }),
        })
        return { status: r.status, body: await r.json() }
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON, sku: TIER_SKU },
    )

    expect(Array.isArray(res.body) ? res.body : []).toHaveLength(0)
  })
})
