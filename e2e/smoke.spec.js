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
  // ‏קריאת-RPC היא POST בפרוטוקול של Supabase — אלה קריאות-בלבד (SELECT בגוף הפונקציה),
  // והחוסם הפיל את מסך-הפרויקטים כולו כשנחסמו. אין כאן ריכוך: כתיבות אמיתיות עדיין נחסמות.
  '/rest/v1/rpc/list_projects_overview',
  '/rest/v1/rpc/list_project_changes',
  // מודול 8 (28/08/2026, צעד 4.4): `get_finance_overview` היא DEFINER-קוראת-בלבד (מיגרציה
  // E1) — אותו נימוק בדיוק כמו שתי השורות שמעל. `finance-open-salary` לעולם לא נלחץ כאן,
  // ולכן `generate_salary_report`/`finalize_salary_report` (שתיהן כותבות, נמדד `pg_proc`)
  // לא נכנסות לרשימה הזו במכוון.
  '/rest/v1/rpc/get_finance_overview',
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
    // ⚠️ **דרך לשונית "הכל", וזו תוספת-תיקון של 09/08/2026 ולא ריכוך.** לשונית-ברירת-המחדל
    // היא `בתהליך` (`QuotesPage.jsx`, `useState('in_progress')`), והצעה #6 — נושאת הסכום
    // הקנוני — **אושרה ב-01/08/2026** ומאז אינה מופיעה שם. הבדיקה חיפשה אותה בלשונית שבה
    // היא כבר לא יכולה להיות. העוגן עצמו (‏6,319 ₪, שעובר דרך מנוע-התמחור האמיתי) נשמר
    // כלשונו — רק המסך שבו מסתכלים עליו תוקן.
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-all').click()
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

    // פרויקטים (מודול 6, נוסף 19/08/2026): מבט-העל עולה עם הלוח האמיתי. שני עוגנים:
    // האירוע הידוע מופיע בלשונית "הכול" (שם-אירוע הוא snapshot, עמיד-ריקבון — הסטטוס
    // שלו ינוע ולכן לא נועצים לשונית-סטטוס), ומונה-הלשונית שווה לספירת השורות שרונדרו —
    // אינווריאנט עצמי שאינו נועץ מספר ללוח שעוד יגדל.
    await page.goto('/projects')
    // הלשוניות מרונדרות רק אחרי שה-RPC חזר (עד אז — שלד) ⇒ ממתינים לטבלה לפני הלחיצה.
    await expect(page.getByTestId('projects-table')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('projects-tab-all').click()
    await expect(
      page.locator('[data-testid^="projects-row-"]', { hasText: anchors.projects.knownEvent }),
    ).toHaveCount(1)
    const allTabText = await page.getByTestId('projects-tab-all').innerText()
    const allTabCount = Number(allTabText.replace(/[^0-9]/g, ''))
    await expect(page.locator('[data-testid^="projects-row-"]')).toHaveCount(allTabCount)

    // דיילות: הסרגל טוען את המודול, ומסך Smart Match לאירוע האמיתי מציג רק מי שעברה
    // את שער-הפסילה — מועמדת אחת ידועה בפנים, ושתי הנפסלות (בלי-רכב-ורחוקה /
    // לא-זמינה-בתאריך-האירוע) בחוץ.
    await expect(page.getByRole('link', { name: anchors.hostesses.sidebarLink })).toBeVisible()
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible()
    await page
      .locator('[data-testid^="overview-row-"]', { hasText: anchors.hostesses.eventName })
      .first()
      .click()
    await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(anchors.hostesses.availableCandidate).first()).toBeVisible()
    await expect(page.getByText(anchors.hostesses.excludedNoCar)).toHaveCount(0)
    await expect(page.getByText(anchors.hostesses.excludedUnavailable)).toHaveCount(0)

    // לוגיסטיקה (מודול 5, נוסף 26/08/2026): תור-העבודה עולה עם הלוח האמיתי.
    // 🔴 **אף עוגן כאן אינו תאריך ואינו מספר-חי** — הסיד של המודול גוזר את תאריכיו
    // מ-`current_date` ולכן הוא זז מדי יום, והמונים זזים עם כל סימון של מנהלת הלוגיסטיקה.
    // מה שנעוץ: שמות שלוש הגלולות ומספרן (㉙ — גלולה רביעית אסורה), כותרת סעיף-היציאה
    // (S-7 — הסעיף נשאר על המסך גם ביום שאין בו אירוע יוצא, וזה רוב הימים), וכיתוב-המיון.
    // המספר היחיד הוא **אינווריאנט עצמי**: מונה `הכול` מול ספירת-השורות שרונדרו.
    // ⚠️ העשן רץ כמנכ"ל בלבד, והוא `edit` על "לוגיסטיקה" ⇒ המסך נפתח לו במלואו.
    await expect(page.getByRole('link', { name: anchors.logistics.sidebarLink })).toBeVisible()
    await page.goto('/logistics')
    // הגלולות מרונדרות רק אחרי שהקריאות חזרו (עד אז — שלד) ⇒ ממתינים לגלולה עצמה,
    // לא ל-`logistics-page` שמרונדר גם במצב-הטעינה.
    const logisticsAllPill = page.getByTestId('logistics-pill-all')
    await expect(logisticsAllPill).toBeEnabled({ timeout: 30_000 })
    const logisticsPills = page.locator('[data-testid^="logistics-pill-"]')
    await expect(logisticsPills).toHaveCount(anchors.logistics.pills.length)
    for (const [index, label] of anchors.logistics.pills.entries()) {
      await expect(logisticsPills.nth(index)).toContainText(label)
    }
    await expect(page.getByTestId('logistics-outbound')).toContainText(
      anchors.logistics.outboundHeading,
    )
    await expect(page.getByText(anchors.logistics.sortLine)).toBeVisible()
    await logisticsAllPill.click()
    const logisticsAllText = await logisticsAllPill.innerText()
    const logisticsAllCount = Number(logisticsAllText.replace(/[^0-9]/g, ''))
    expect(
      logisticsAllCount,
      'מונה "הכול" הוא 0 אצל המנכ"ל (edit) — הזדהות/RLS שבורים, לא "אין דאטה"',
    ).toBeGreaterThan(0)
    await expect(page.locator('[data-testid^="logistics-row-"]')).toHaveCount(logisticsAllCount)

    // כספים (מודול 8, נוסף 28/08/2026): מבט-העל עולה, ושלוש הלשוניות עקביות עם השורות
    // שרונדרו. 🔴 **אין כאן מספר-שורות נעוץ** — שלוש הלשוניות מחזיקות שורה בודדת כרגע
    // (עוגן חי, `smoke-anchors.json`), והבדיקה קוראת כל מונה בזמן-ריצה ומאמתת אינווריאנט-
    // עצמי מולו, בדיוק כמו `logistics`/`projects` שמעל. עוגן-החיוב היחיד: הפרויקט הידוע
    // חייב להופיע באיזושהי לשונית שיש בה שורות (לא דווקא זו שנרשמה — ר' הערת-הראש שם).
    await expect(page.getByRole('link', { name: anchors.finance.sidebarLink })).toBeVisible()
    await page.goto('/finance')
    await expect(page.getByTestId('finance-page')).toBeVisible({ timeout: 30_000 })
    let financeKnownProjectFound = false
    for (const tabKey of ['awaiting_invoice', 'awaiting_payment', 'finished']) {
      const tab = page.getByTestId(`finance-tab-${tabKey}`)
      await expect(tab).not.toContainText('—', { timeout: 30_000 })
      await tab.click()
      const tabCount = Number((await tab.innerText()).replace(/[^0-9]/g, ''))
      expect(tabCount, `מונה-לשונית ${tabKey} שלילי`).toBeGreaterThanOrEqual(0)
      const financeRows = page.locator('[data-testid^="finance-row-"]')
      if (tabCount === 0) {
        await expect(page.getByTestId('finance-empty-tab')).toBeVisible()
        continue
      }
      await expect(financeRows).toHaveCount(tabCount)
      const knownRow = page.getByTestId(`finance-row-${anchors.finance.knownProjectId}`)
      if ((await knownRow.count()) > 0) {
        await expect(knownRow).toContainText(anchors.finance.knownProjectName)
        financeKnownProjectFound = true
      }
    }
    expect(
      financeKnownProjectFound,
      `פרויקט #${anchors.finance.knownProjectId} ("${anchors.finance.knownProjectName}") לא נמצא באף לשונית — הזדהות/RLS שבורים, לא "העוגן זז" (אם הוא רק עבר לשונית, זה עדכון-עוגן לגיטימי)`,
    ).toBe(true)

    // המנגנונים — לא הבטחות: אפס ניסיונות-כתיבה, אפס יעדים חיצוניים, אפס שגיאות-קונסול.
    expect(blockedWrites, 'מסך ניסה לכתוב למסד בזמן קריאה-בלבד').toEqual([])
    expect(externalHits, 'בקשה ליעד חיצוני שאינו האפליקציה/Supabase').toEqual([])
    expect(consoleErrors, 'שגיאות-קונסול במהלך המסע').toEqual([])
  })
})
