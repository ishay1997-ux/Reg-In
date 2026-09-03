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
  // מודול 9 (02/09/2026, צעד 4.2): `list_hostesses_below_min_wage` — אותו נימוק בדיוק
  // כמו שלוש השורות שמעל. היא מוכרזת `stable` (‏`20260902230500…:27`), ו-Postgres **אוסר**
  // על פונקציה `stable` לכתוב — כלומר זו אינה הבטחה אלא אילוץ של המנוע. היא נקראת
  // אוטומטית בעליית לשונית-הפרמטרים (הפאנל שליד `שכר_מינימום_שעתי`), ולכן חסימתה
  // הפילה את המסע בלי שאיש לחץ על דבר.
  '/rest/v1/rpc/list_hostesses_below_min_wage',
]

test.describe('בדיקת-עשן', () => {
  test.skip(
    !CEO_EMAIL || !CEO_PASSWORD,
    'E2E_CEO_* לא הוגדרו — העוטפן אמור לתפוס זאת לפני (exit 2)',
  )

  // ⏱️ **תקציב-הזמן הורחב 02/09/2026 (מודול 9, צעד 4.2) — והנימוק תוקן אחרי המדידה.**
  // המסע הוא **בדיקה אחת ארוכה**, ולכן `timeout` ברירת-המחדל (60 שניות,
  // `playwright.config.js`) הוא התקציב של **עשרת** המסכים יחד. עם הוספת שני מסכי מודול 9
  // הריצה נחתכה ב-`/projects` — המסך שמיד אחריהם.
  // 🔬 **מה באמת אכל את הזמן, ולא מה שהנחתי:** לא עצם שני המסכים, אלא ש-
  // `list_hostesses_below_min_wage` **נחסמה** ע"י שומר-הקריאה-בלבד (‏RPC ב-Supabase הוא
  // POST) והפאנל נתקע בטעינה. אחרי שהיא נוספה ל-`ALLOWED_WRITE_PATHS` המסע כולו רץ
  // ב-**48.4 שניות** — כלומר מתחת ל-60 המקוריות. התקציב נשאר רחב בכל זאת: 11 שניות מרווח
  // על מסע שתלוי-רשת מול Supabase הן שוליים דקים מדי לכשל-שווא, וזו בדיוק הסיבה
  // ש-`playwright.config.js` כבר בחר "תקרה נדיבה" על אותו נימוק.
  // 🚫 ואין כאן ריכוך: אף עוגן לא הוסר ואף טענה לא נחלשה — רק החלון שבו כולן צריכות להספיק.
  test('כל המסכים הראשיים עולים עם הנתונים האמיתיים', async ({ page }) => {
    test.setTimeout(150_000)
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

    // לקוחות: השורה הראשונה שמציגה הכנסות ממשיות (עוברות דרך מנוע-התמחור האמיתי) — נבחרת
    // בזמן-ריצה ולא בשם. 🔄 03/09/2026 (זריעת-הדגמה, `seed-data-spec.md §7א`): "מדיטק /
    // 22,503 ₪" נמחקו עם דמו-יולי; במקומם אינווריאנט חוצה-מסכים — הסכום שברשימה חייב להופיע
    // ברצועת-המדדים של עמוד-הלקוח. עמודת-הכסף היחידה ברשימה היא "סה"כ הצעות מאושרות".
    await page.goto('/customers')
    const customerRow = page
      .locator('[data-testid^="customer-row-"]')
      .filter({ hasText: /[1-9][\d,]* ₪/ })
      .first()
    await expect(customerRow, 'אין לקוח עם הכנסות ברשימה — הזריעה חסרה').toBeVisible({
      timeout: 30_000,
    })
    const customerRevenue = (await customerRow.innerText()).match(/[1-9][\d,]* ₪/)[0]

    // עמוד-הלקוח: אותו סכום ברצועת-המדדים — מסלול נפרד (שאילתות עמוד-הרשומה).
    await customerRow.click()
    await expect(page).toHaveURL(/\/customers\/\d+/)
    await expect(page.getByTestId('metric-revenue')).toContainText(customerRevenue)

    // הצעות: לשונית "הכל" נטענת ושורותיה נושאות סכום שעבר דרך מנוע-התמחור.
    // 🔄 03/09/2026: הסכום הקנוני 6,319 ₪ (הצעה #6 של דמו-יולי) נמחק. לשונית-ברירת-המחדל היא
    // "בתהליך" (QuotesPage.jsx) ולכן עדיין עוברים ל"הכל"; SMOKE_BREAK=empty-quotes עדיין
    // מפיל את הריצה — אפס שורות אינו עובר את הטענה הראשונה. 🚫 אין כאן ריכוך: מה שנפל הוא
    // המספר הנעוץ, לא הדרישה שהמסך יעלה עם דאטה אמיתית.
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-all').click()
    const quoteRows = page.locator('[data-testid^="quote-row-"]')
    await expect(quoteRows.first()).toBeVisible({ timeout: 30_000 })
    await expect(quoteRows.first()).toContainText('₪')

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

    // הגדרות מערכת · לשונית "פרמטרים" (מודול 9, נוסף 02/09/2026): המסך החדש עולה עם
    // כל שש קבוצות ה-`param_type`, ואחוז-המע"מ נקרא מהשורה החיה ב-`params`.
    // 🔀 **עוגן-המע"מ עבר לכאן מלשונית "מחירים" (Q-1)** — `PricingParamsCard` הוסר משם,
    // והשדה היחיד שמציג את הפרמטר הזה היום הוא `settings-value-אחוז_מעמ`. הערך (18) הוא
    // אותו ערך-חי בדיוק; רק המסך שמסתכלים בו השתנה.
    await page.goto('/system/params')
    await expect(page.getByTestId('settings-params-tab')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="settings-group-"]')).toHaveCount(
      anchors.settings.groupCount,
    )
    await expect(page.getByTestId('settings-value-אחוז_מעמ')).toHaveValue(anchors.settings.vat)

    // "ההגדרות שלי" — הדלת השנייה (מודול 9). 🔴 העשן רץ כמנכ"ל, והוא **אינו בעלים של אף
    // שורה** (`owner_role_id IS NULL` = CEO-בלבד, §2.7) ⇒ מצב-הריק הוא התשובה הנכונה כאן,
    // לא ליקוי. העוגן הוא שהמסך **עולה ואומר זאת במילים**, ולא נופל ולא מציג טבלה ריקה.
    await page.goto('/my-settings')
    await expect(page.getByTestId('settings-my-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('settings-my-empty')).toHaveText('אין הגדרות בבעלות התפקיד שלך')

    // פרויקטים (מודול 6, נוסף 19/08/2026): מבט-העל עולה עם הלוח האמיתי. 🔄 03/09/2026:
    // "האירוע הידוע" (#8 של דמו-יולי) נמחק; נשאר האינווריאנט העצמי — לשונית "הכול" מציגה
    // שורות, ומונה-הלשונית שווה לספירת השורות שרונדרו (בלי מספר נעוץ ללוח שעוד יגדל).
    await page.goto('/projects')
    // הלשוניות מרונדרות רק אחרי שה-RPC חזר (עד אז — שלד) ⇒ ממתינים לטבלה לפני הלחיצה.
    await expect(page.getByTestId('projects-table')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('projects-tab-all').click()
    await expect(page.locator('[data-testid^="projects-row-"]').first()).toBeVisible()
    const allTabText = await page.getByTestId('projects-tab-all').innerText()
    const allTabCount = Number(allTabText.replace(/[^0-9]/g, ''))
    await expect(page.locator('[data-testid^="projects-row-"]')).toHaveCount(allTabCount)

    // דיילות: הסרגל טוען את המודול, ומסך Smart Match של האירוע הראשון במבט-העל עולה עם
    // מועמדות אמיתיות. 🔄 03/09/2026: שלוש דיילות-הדגמה ("מאיה כהן" / "קרן אשכנזי" /
    // "ליאת רזניק") ואירוען נמחקו עם דמו-יולי — וטווח אי-הזמינות שלהן (20–25/08) ממילא חלף,
    // כלומר טענת-הפסילה כאן הפסיקה להוכיח משהו ב-26/08 בלי שאיש נגע בה. הוכחת השער עצמו
    // חיה ב-`smart-match.spec.js` עם פיקסטורה שנבחרת בזמן-ריצה; כאן נשאר: המסך עולה,
    // ורשימת-המועמדות אינה ריקה (מכנה ≠ 0, `e2e/CLAUDE.md`).
    await expect(page.getByRole('link', { name: anchors.hostesses.sidebarLink })).toBeVisible()
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible()
    await page.locator('[data-testid^="overview-row-"]').first().click()
    await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="sm-candidate-"]').first()).toBeVisible({
      timeout: 30_000,
    })

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
