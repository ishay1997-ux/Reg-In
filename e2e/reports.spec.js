import { test, expect } from '@playwright/test'

// מסעות מודול 11 (דו"חות) — לשונית לכל תפקיד · מיסוך · קידוח · ייצוא · סינון-צולב ·
// שכבת-ההטמעה · שער "טרם אושרה ריצת-ניתוח" · כשל-רשת.
//
// 🔴 **אפס כתיבות למסד, וזה לא זהירות אלא כלל-ברזל של `e2e/CLAUDE.md §2.1`:** המסד משרת
// גם את הייצור, ולכן כל תרחיש שאינו קיים בדאטה החיה מזויף ב-`page.route` — **תשובת-API
// מזויפת, לעולם לא שורה מזויפת.** שני מקומות שבהם זה נדרש כאן, ושניהם מוצהרים:
// ① **שער מ22** — הסיווג כבר רץ ואושר (⁦426⁩ תובנות), כלומר מצב "טרם אושרה" **אינו קיים
//    היום בדאטה**; הוא מזויף ע"י שכתוב `meta.run`/`rows` בתשובת ה-RPC האמיתית.
//    🚫 **ו"הרץ ניתוח" לעולם אינו נלחץ כאן** — הוא קורא למודל בתשלום.
// ② **מצב-הטמעה 2** — הרמה יושבת ב-`notification_preferences.onboarding_mode` של המשתמשת,
//    והמנכ"ל נמצא ברמה 0. ⚠️ **ההרמה נעשית ביירוט ה-GET היחיד ש-`AuthContext` שולח
//    (`select=onboarding_mode`), ולא בכתיבה לשורה** — מסלול-הרינדור (AuthContext ⇐ Hint)
//    הוא האמיתי, ואין שחזור-ב-`afterAll` שיכול להיכשל באמצע ולהשאיר את המנכ"ל ברמה 2.
//    *(זו סטייה מוצהרת מהוראת-המשימה, שביקשה לכתוב דרך הסטר של מודול 9 ולשחזר.)*
//
// 🔑 **אין כאן מזהה קשוח אחד** (`e2e/CLAUDE.md §2.2): הלקוח שמרוקן את הטבלה, השורה
// שנפתחת בקידוח והקטגוריה שנבחרת בגרף — כולם נבחרים **בזמן-ריצה** מהמסך עצמו.
//
// 🪤 **שני מוקשים שנמדדו בבנייה הזו, ולכן יש להם עזרים ולא תיקוני-אד-הוק:**
// ① כותרת-העמוד `fixed top-0` (‏`h-16`) חוטפת קליק על אלמנט שנגלל למינימום ⇒ `clickCentered`.
// ② כפתורי-הבחירה של הגרף יושבים ב**טבלת-קורא-המסך** (`sr-only focus-within:not-sr-only`),
//    כלומר קליק-עכבר עליהם נוחת על אלמנט אחר ⇒ **פוקוס + Enter**, שהוא ממילא נתיב-המקלדת
//    ש-📐14ב③ דורש שיוכח בפועל.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD
const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

// 🔤 נוסחים נעולים שהמסך חייב לומר. מועתקים ממקורם בקוד ולא מנוסחים כאן:
// `MASKED_TEXT` (`src/lib/dashboard.js`) · `NO_TABS_SENTENCE` (`ReportsPage.jsx`) ·
// `EXPORT_NO_ROWS`/`EXPORT_NO_APPROVED_RUN` (`src/lib/reportsExport.js`) ·
// כותרת-הכשל ו-"נסי שוב" (`src/components/PermissionAwareEmpty.jsx`).
const MASKED_TEXT = 'לא זמין בתפקידך'
const NO_TABS_SENTENCE = 'אין דוחות זמינים בתפקידך — פני למנכ"ל'
const EXPORT_NO_APPROVED_RUN = 'אין שורות לייצא — טרם אושרה ריצת-ניתוח'
// 🔤 **נוסח של החלון עצמו** (`NO_ROWS_AFTER_FILTER` ב-`src/components/ExportDialog.jsx`).
// 🔴 **ואינו אותו דבר כמו `EXPORT_NO_ROWS`, ולכן אינו מחליף אותו:** ‏`EXPORT_NO_ROWS` נזרק
// מ-`exportReportRows` כשאין **טבלה** כלל, וזה הנוסח כשהסינון **של החלון** לא הותיר שורות.
// ‏`EXPORT_NO_ROWS` ירד מכאן משום שמסע-המסך שנשען עליו בוטל בת4ב — **המחרוזת עצמה נשארת
// נעולה זהות-בייט ב-`src/lib/reportsExport.test.js`**, ולכן אינה מאבדת שמירה.
const NO_ROWS_AFTER_FILTER = 'הסינון לא הותיר שורות'
const LOAD_ERROR_TITLE = 'לא ניתן לטעון את הנתונים.'
const RETRY_LABEL = 'נסי שוב'
const CLEAR_SELECTION_LABEL = '× נקי בחירה'

// אין עוזר-login משותף ב-`e2e/` (‏`e2e/CLAUDE.md`): כל spec מגדיר אותו זהה. מועתק
// מ-`permissions.spec.js` מילה-במילה, כולל ה-timeout המורחב ונימוקו.
async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת אימייל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  // login מוצלח = שרשרת קריאות-רשת ארוכה (lock-check, Auth, reset, שליפת users) לפני הניווט -
  // timeout מורחב מונע כשל-שווא ברשת איטית (האפליקציה תקינה, הרשת לא).
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// 🪤 מוקש ①: הכותרת `fixed top-0` חוטפת קליק על אלמנט שנגלל למינימום. גלילה למרכז
// לפני הקליק היא התיקון, ולא `force` — ‏`force` היה מדלג גם על בדיקת-הנראות עצמה.
async function clickCentered(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await locator.click()
}

// 🪤 מוקש ②: כפתורי-הבחירה של הגרף הם `sr-only` עד שהם מקבלים פוקוס. **פוקוס + Enter**
// הוא נתיב-המקלדת האמיתי (📐14ב③), ולכן הבדיקה מפעילה אותו ולא מזייפת קליק.
async function activateWithKeyboard(page, locator) {
  await locator.evaluate((el) => el.focus())
  await page.keyboard.press('Enter')
}

// 🪤 מוקש ③, **נמדד בריצה הראשונה של הקובץ הזה (16/09/2026)**: ‏`networkidle` לבדו שקר
// כאן. ‏`MainLayout` מציג *"טוען…"* בזמן ש-`AuthContext` נטען, ובדיוק באותו רגע הרשת
// שקטה ⇒ ‏`count()` (שאינו חוזר-על-עצמו כמו `expect`) החזיר **0 שורות** על מסך שלא צויר
// עדיין. ⇒ **כל ספירה בקובץ הזה מגיעה אחרי המתנה לתוכן**, לא אחרי `networkidle`.
// (זו בדיוק המלכודת "מדידה שהמכנה שלה 0" מ-`e2e/CLAUDE.md §3`.)
async function openReport(page, tab, report) {
  await page.goto(`/reports?tab=${tab}&report=${report}`)
  await expect(page.getByTestId(`report-${report}`)).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
}

// כמו `openReport`, אבל גם מצב-מעטפת ריק/תקלה הוא תשובה לגיטימית — לכן ההמתנה היא
// ל**אחד** מחמשת המצבים של 📐10 ולא לתוכן בלבד. ‏`-loading` אינו ברשימה, בכוונה.
async function openReportAnyState(page, url, report) {
  await page.goto(url)
  await page
    .locator(
      [
        `[data-testid="report-${report}"]`,
        `[data-testid="report-${report}-blank"]`,
        `[data-testid="report-${report}-empty"]`,
        `[data-testid="report-${report}-error"]`,
        `[data-testid="report-${report}-no-permission"]`,
      ].join(', '),
    )
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForLoadState('networkidle')
}

// גזירת מקטע-שם-הקובץ, זהה ל-`segment()` ב-`src/lib/reportsExport.js` — כדי לאמת
// ש**ההבטחה שעל המסך** (שם-הקובץ שיירד) באמת נושאת את הבחירה, בלי לנעוץ שם קבוע.
function fileNameSegment(raw) {
  return String(raw ?? '')
    .replaceAll('⁦', '')
    .replaceAll('⁩', '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// 🔑 **הבטחת-השם עברה לתוך חלון-הייצוא — עם אותו `testid` בדיוק** (ת4ב · הכרעת-ישי
// 17/09/2026: *"מאשר לפי המלצך"*). ⇒ **לקרוא אותה פירושו לפתוח את החלון.** ‏testid חדש
// היה הופך את ההעברה למחיקה, ולכן החוזה נשמר והמסע הוא שהשתנה.
//
// 📊 **נמדד לפני התיקון, ולא הוסק מהקוד** (ריצה 17/09/2026, 7 מ-8 נכשלו): הטענות הישנות
// נפלו ב-`TimeoutError: waiting for getByTestId('reports-export-file')` — הכיתוב פשוט
// **אינו על המסך** — ובשלוש אחרות ב-`Expected: disabled · Received: enabled`.
//
// ⚠️ **ההמתנה כאן היא לשליפה של החלון, שאינה השליפה של המסך:** ‏`exportFetch` קורא ל-RPC
// מחדש עם `drill: null` (החלון עצמאי), ולכן `networkidle` של המסך אינו מעיד עליו.
async function openExportDialog(page) {
  await page.getByTestId('reports-export-button').click()
  await expect(page.getByTestId('export-dialog')).toBeVisible()
  await expect(page.getByTestId('export-preview-loading')).toHaveCount(0, { timeout: 30_000 })
}

async function closeExportDialog(page) {
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('export-dialog')).toHaveCount(0)
}

// שם-הקובץ המובטח, נקרא מתוך החלון וסוגר אותו אחריו — כדי שהמסע יוכל להמשיך במסך.
async function promisedFileName(page) {
  await openExportDialog(page)
  const text = (await page.getByTestId('reports-export-file').textContent()).trim()
  await closeExportDialog(page)
  return text
}

function mainTableRows(page) {
  return page
    .getByTestId('report-table-card')
    .first()
    .locator('[data-testid="report-row"], [data-testid="report-row-drillable"]')
}

// יירוט ה-GET היחיד שממנו `AuthContext` לומד את רמת-ההטמעה. נרשם **לפני** ההתחברות,
// כי הקריאה יוצאת בתוך `loadUser`.
async function forceOnboardingMode(page, level) {
  await page.route('**/rest/v1/notification_preferences*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const response = await route.fetch()
    const text = await response.text()
    let body
    try {
      const parsed = JSON.parse(text)
      body = Array.isArray(parsed)
        ? JSON.stringify(parsed.map((row) => ({ ...row, onboarding_mode: level })))
        : JSON.stringify({ ...(parsed ?? {}), onboarding_mode: level })
    } catch {
      body = JSON.stringify({ onboarding_mode: level })
    }
    await route.fulfill({ response, body })
  })
}

// שער-מ22: אותו RPC אמיתי, עם `meta.run` מנוטרל ובלי שורות — כלומר **בדיוק המצב שהיה
// לפני שהריצה אושרה**, בלי לגעת ב-`feedback_ai_runs`.
async function fakeM22WithoutApprovedRun(page) {
  await page.route('**/rest/v1/rpc/report_m22_notes', async (route) => {
    const response = await route.fetch()
    const payload = await response.json()
    payload.rows = []
    payload.meta = {
      ...payload.meta,
      run: null,
      run_in_progress: null,
      export_blocked_reason: EXPORT_NO_APPROVED_RUN,
    }
    await route.fulfill({ response, body: JSON.stringify(payload) })
  })
}

const DEFAULT_SURFACES = [
  { tab: 'exec', report: 'exec-overview', name: 'מבט-על הנהלה' },
  { tab: 'finance', report: 'finance-overview', name: 'מבט-על כספים' },
  { tab: 'hostesses', report: 'hostess-overview', name: 'מבט-על דיילות' },
  { tab: 'customers', report: 'customers-overview', name: 'מבט-על לקוחות' },
]

test.describe('מודול 11 · מעטפת-הדוחות והמסעות שלה', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  // ① המנכ"ל פותח `/reports`: ארבע לשוניות פתוחות, ודף-ברירת-המחדל נושא את שלוש
  //    שורות-הבסיס (📐2 אוכלוסייה · 📐23 "אז מה" · 📐16 הגדרות) ואת האריחים.
  test('מנכ"ל: ארבע לשוניות פתוחות, ודף-ברירת-המחדל נושא אוכלוסייה · "אז מה" · אריחים · טבלה', async ({
    page,
  }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')

    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)
    // אף לשונית אינה ממוסכת אצל המנכ"ל — לא `aria-disabled` ולא המשפט הגלוי.
    await expect(page.locator('[role="tab"][aria-disabled="true"]')).toHaveCount(0)
    await expect(page.getByTestId('reports-tabs')).not.toContainText(MASKED_TEXT)
    await expect(page.getByTestId('reports-tab-exec')).toHaveAttribute('aria-selected', 'true')

    const surface = page.getByTestId('report-exec-overview')
    await expect(surface).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('מבט-על הנהלה')
    // ✏️ 23/09/2026 (טיפוגרפיה פזה ב׳, הדגם שישי אישר): האוכלוסייה וההגדרות מקופלות בשבב-ההיקף.
    // גלוי: השבב, עם ה-n מתוך ה-N מהשרת (`population.summary`). בפנים: ההצהרה המלאה וההגדרות.
    await expect(page.getByTestId('report-scope-summary')).toContainText('אירועים שהסתיימו')
    await expect(page.getByTestId('report-population')).not.toBeEmpty()
    await expect(page.getByTestId('report-so-what')).not.toBeEmpty()
    await expect(page.getByTestId('report-definitions')).not.toBeEmpty()
    await expect(page.getByTestId('report-table-card')).toBeVisible()
    // מכנה שאינו 0 (`e2e/CLAUDE.md`): סריקה על שלד מחזירה "אפס בעיות" ונראית ירוקה.
    expect(await page.getByTestId('report-tiles').locator('> *').count()).toBeGreaterThan(0)
    expect(await mainTableRows(page).count()).toBeGreaterThan(0)

    // C2/📐23 — שורת-"אז מה" **מעל** האריחים, כפי ש-19 דפי-המוקאפ המאושרים מציירים.
    const order = await page.evaluate(() => {
      const soWhat = document.querySelector('[data-testid="report-so-what"]')
      const tiles = document.querySelector('[data-testid="report-tiles"]')
      if (!soWhat || !tiles) return 'missing'
      return soWhat.compareDocumentPosition(tiles) & Node.DOCUMENT_POSITION_FOLLOWING
        ? 'so-what-first'
        : 'tiles-first'
    })
    expect(order, 'שורת-"אז מה" חייבת להופיע לפני האריחים בסדר-המסמך').toBe('so-what-first')
  })

  // ② כל אחת מארבע הלשוניות עולה למנכ"ל, בלי שגיאת-קונסול אחת (שורת ה-QA "מסע ללשונית").
  test('מנכ"ל: ארבע לשוניות-ברירת-המחדל עולות, אפס שגיאות-קונסול', async ({ page }) => {
    test.setTimeout(150_000)
    const consoleErrors = []
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await login(page, CEO_EMAIL, CEO_PASSWORD)
    for (const surface of DEFAULT_SURFACES) {
      await openReport(page, surface.tab, surface.report)
      await expect(page.getByTestId(`report-${surface.report}`)).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(surface.name)
      // ✏️ 23/09/2026: ההיקף גלוי כשבב; ההצהרה המלאה בתוכו (ר' ①).
      await expect(page.getByTestId('report-scope-summary')).toBeVisible()
      await expect(page.getByTestId('reports-export-button')).toBeVisible()
    }
    expect(consoleErrors, 'שגיאות-קונסול במסע הלשוניות').toEqual([])
  })

  // ③ גלולת-התקופה: הכתובת · תווית-החלון · שורת-האוכלוסייה — שלושתן זזות יחד.
  //    ⚠️ **בלי מספר נעוץ**: נבדק ש-`n` **השתנה**, לא שהוא ערך מסוים שירקב מחר.
  test('מנכ"ל: גלולת-תקופה משנה את הכתובת, את תווית-החלון ואת שורת-האוכלוסייה', async ({
    page,
  }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'exec', 'exec-overview')

    const windowBefore = await page.getByTestId('reports-window-label').textContent()
    // ✏️ 23/09/2026: ה-n חי בשבב-ההיקף (`population.summary`), לא בהצהרה המקופלת — שם בודקים שזז.
    const populationBefore = await page.getByTestId('report-scope-summary').textContent()
    // 🔑 **גלולה אחת דלוקה, ולא "השנה" נעוצה בשמה** — ‏`defaultPeriod` הוא שדה-לשונית
    // (‏`reportsCatalog.js`, 16/09) ולשוניות שונות נפתחות על חלונות שונים. מה שמחייב הוא
    // שתמיד תהיה בדיוק אחת דלוקה, ושהיא **לא** זו שמיד נלחצת.
    await expect(page.locator('[data-testid^="reports-period-"][aria-pressed="true"]')).toHaveCount(
      1,
    )
    await expect(page.getByTestId('reports-period-month')).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('reports-period-month').click()
    await expect(page).toHaveURL(/period=month/)
    await expect(page.getByTestId('reports-period-month')).toHaveAttribute('aria-pressed', 'true')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('reports-window-label')).not.toHaveText(windowBefore)
    await expect(page.getByTestId('report-scope-summary')).not.toHaveText(populationBefore)
  })

  // ④ מסנן-הלקוח מצמצם משטח שמסונן-לפי-לקוח. הלקוח נבחר **בזמן-ריצה** (כלל-ברזל של
  //    `e2e/CLAUDE.md §2.2`) — הראשון שמחזיר פחות שורות מהכלל ועדיין לא ריק.
  test('מנכ"ל: מסנן-הלקוח מצמצם את "לקוחות מתרחקים"', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'customers', 'drifting')
    const rowsAll = await mainTableRows(page).count()
    expect(rowsAll, 'הדוח חייב להיפתח עם שורות לפני שמודדים צמצום').toBeGreaterThan(0)

    const values = await page
      .locator('[data-testid="reports-customer-filter"] option')
      .evaluateAll((els) => els.slice(1).map((el) => el.value))
    expect(values.length, 'בורר-הלקוחות ריק — הקריאה ל-listCustomers נחסמה').toBeGreaterThan(0)

    let narrowed = null
    for (const value of values.slice(0, 12)) {
      await openReportAnyState(
        page,
        `/reports?tab=customers&report=drifting&customer=${value}`,
        'drifting',
      )
      const rows = await mainTableRows(page).count()
      if (rows > 0 && rows < rowsAll) {
        narrowed = { value, rows }
        break
      }
    }
    expect(narrowed, 'לא נמצא לקוח שמצמצם את הטבלה').not.toBeNull()
    expect(narrowed.rows).toBeLessThan(rowsAll)
    await expect(page).toHaveURL(new RegExp(`customer=${narrowed.value}`))
  })
})

test.describe('מודול 11 · מיסוך לפי תפקיד (התוצאה הנכונה, לא תקלה)', () => {
  test('מנהלת לוגיסטיקה: ארבע לשוניות ממוסכות והודעה אחת — ולא טבלה ריקה', async ({ page }) => {
    test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')

    // ת8 #5 — ‏`role="tab"` נשמר **וגם** `aria-disabled`, והמשפט גלוי ולא רק ב-`title`.
    await expect(page.getByRole('tab')).toHaveCount(4)
    await expect(page.locator('[role="tab"][aria-disabled="true"]')).toHaveCount(4)
    for (const key of ['exec', 'finance', 'hostesses', 'customers']) {
      await expect(page.getByTestId(`reports-tab-${key}`)).toContainText(MASKED_TEXT)
      await expect(page.getByTestId(`reports-tab-${key}`)).toHaveAttribute('aria-selected', 'false')
    }
    // §⑤ #11 — `<h1>` קיים גם במסך הזה (סריקת-הנגישות ממתינה לו).
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('דו"חות')
    await expect(page.getByTestId('reports-no-tabs-blank')).toContainText(NO_TABS_SENTENCE)
    // 🔴 ההפך ממצג-השווא: אין טבלה, אין אריחים, אין ייצוא — ולא "אין נתונים".
    await expect(page.getByTestId('report-table-card')).toHaveCount(0)
    await expect(page.getByTestId('report-tiles')).toHaveCount(0)
    await expect(page.getByTestId('reports-export-button')).toHaveCount(0)
  })

  test('מנהלת כספים ולקוחות: דיילות ממוסכת, שלוש האחרות פתוחות', async ({ page }) => {
    test.skip(!FINANCE_EMAIL || !FINANCE_PASSWORD, 'E2E_FINANCE_* לא הוגדרו ב-.env.local')
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('reports-tab-hostesses')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('reports-tab-hostesses')).toContainText(MASKED_TEXT)
    for (const key of ['exec', 'finance', 'customers']) {
      await expect(page.getByTestId(`reports-tab-${key}`)).not.toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
    // לשונית פתוחה = דף אמיתי, לא מעטפת ריקה.
    await expect(page.getByTestId('report-exec-overview')).toBeVisible()
    await expect(page.getByTestId('report-table-card')).toBeVisible()
  })

  test('מנהלת גיוס ושיבוץ: רק דיילות פתוחה, והיא גם לשונית-ברירת-המחדל', async ({ page }) => {
    test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')

    for (const key of ['exec', 'finance', 'customers']) {
      await expect(page.getByTestId(`reports-tab-${key}`)).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByTestId(`reports-tab-${key}`)).toContainText(MASKED_TEXT)
    }
    await expect(page.getByTestId('reports-tab-hostesses')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
    // ברירת-המחדל היא **הלשונית הראשונה שמותר לה**, ולא "הנהלה" קשיח.
    await expect(page.getByTestId('reports-tab-hostesses')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('מבט-על דיילות')
  })
})

test.describe('מודול 11 · קידוח (📐13) — מ9 בלבד', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  // ✏️ 24/09/2026 — **מ3 כבר אינו דוח-קידוח.** הוא שודרג במקום ל"סגירת הצעות" (דוח-החלטה, אותו slug):
  // אין בו ציר-שנים לרדת בו, ולכן במקום בדיקת-הקידוח — הבדיקה שהשורה היא דלת להצעה עצמה ואין פירורים.
  test('ה1 (מ3): אין פירורים, ושורה פותחת את הצעת-המחיר שאבדה', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'exec', 'trends')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('סגירת הצעות')
    await expect(page.getByTestId('report-crumbs')).toHaveCount(0)
    await expect(page.getByTestId('report-so-what')).toBeVisible()
    await clickCentered(page.getByTestId('report-row-drillable').first())
    await expect(page).toHaveURL(/\/quotes\/\d+\/edit/)
  })

  test('מ9: אריח-דלת פותח מדרג, הפירורים נוקבים בו — והייצוא דווקא לא', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'finance', 'aging')
    await expect(page.getByTestId('report-crumbs')).toHaveCount(0)
    const exportAtRoot = await promisedFileName(page)

    // הכרעה 33 — אריח-מבט-על הוא דלת. הראשון שנמצא, לא אחד נעוץ בשמו.
    const tileDoor = page.locator('[data-testid^="report-tile-link-"]').first()
    await expect(tileDoor).toBeVisible()
    await clickCentered(tileDoor)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/drill=/)
    const crumbs = page.getByTestId('report-crumbs')
    await expect(crumbs).toBeVisible()
    const levelLabel = (await crumbs.textContent()).split('|').pop().trim()
    expect(levelLabel.length, 'לפירור-הרמה אין תווית').toBeGreaterThan(0)
    // 🔁 **ההיפוך של 📐13③ (ת4ב):** הפירור נוקב ברמה — **והייצוא לא.** החלון שולף `drill: null`,
    // ולכן שם שנושא את תווית-הרמה היה מבטיח קובץ מסונן שאינו הקובץ שיירד.
    // 🔑 **שתי טענות ולא אחת, והן אינן כפילות:** השוויון אומר *"השם לא זז"*, ו-`not.toContain`
    // אומר *"וגם לא בלע את התווית בדרך אחרת"* — נוקבת במה שנשבר, לא רק בכך שמשהו נשבר.
    const exportAtLevel = await promisedFileName(page)
    expect(exportAtLevel, 'שם-הקובץ זז עם הדריל — ת4ב קובע שהחלון עצמאי ממנו').toBe(exportAtRoot)
    expect(exportAtLevel).not.toContain(fileNameSegment(levelLabel))
    await expect(page.getByTestId('report-tiles')).toBeVisible()
    expect(await page.getByTestId('report-tiles').locator('> *').count()).toBeGreaterThan(0)
  })

  // הכרעה 19 — **בשורש** של מ9 השורה כולה היא דלת שיוצאת מהדוח אל כרטיס-הפרויקט.
  // 🔴 **ובכוונה בשורש בלבד, וזה ממצא ולא סגנון-בדיקה (נמדד 16/09/2026):** ברמת-המדרג
  // (`?drill={"bucket":"d90p"}`) אותה שורה נושאת `drill_key` של **רמה שלישית** —
  // `{kind:"customer", bucket:"d90p", customer_id:401}` — כלומר `kind` שנמצא ברשימת
  // `ROW_DOOR_KINDS` אבל **בלי `id`**, ולכן `ReportsPage.openDoor` נופל לענף מצב-הדריל
  // ומקדח במקום לנווט. זו התנהגות נכונה היום, ו**שביר**: ברגע שה-RPC יחזיר גם `id`,
  // אותה לחיצה תנווט לכרטיס-הלקוח במקום לרדת רמה — מדווח, לא מתוקן כאן.
  test('מ9 בשורש: השורה כולה דלת אל כרטיס-הפרויקט (הכרעה 19)', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'finance', 'aging')
    const row = page.getByTestId('report-row-drillable').first()
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('role', 'button')
    await clickCentered(row)
    await expect(page).toHaveURL(/\/projects\/\d+/)
  })
})

test.describe('מודול 11 · ייצוא (ת4)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('משטח עם שורות: החלון מוריד קובץ, ושמו הוא זה שהובטח בתוכו', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'exec', 'exec-overview')

    // 🔁 **הכפתור פותח, ואינו מוריד** (ת4ב). ההבטחה נקראת מתוך החלון, ובאותו `testid`.
    await openExportDialog(page)
    const caption = (await page.getByTestId('reports-export-file').textContent()).trim()
    expect(caption.startsWith('יירד:'), `הכיתוב אינו הבטחת-הורדה: ${caption}`).toBe(true)
    const promised = caption.replace('יירד:', '').trim()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-dialog-run').click(),
    ])
    // ההבטחה שלפני הלחיצה היא בדיוק הקובץ שנחת (ת4ב) — לא רק "ירד משהו".
    expect(download.suggestedFilename()).toBe(promised)
    expect(download.suggestedFilename().endsWith('.xlsx')).toBe(true)
    // ⚠️ ייצוא מוצלח סוגר את החלון — וזו התנהגות, לא ניקוי: מסך שנשאר פתוח אחרי הורדה
    // מזמין לחיצה שנייה על אותו קובץ.
    await expect(page.getByTestId('export-dialog')).toHaveCount(0)
  })

  // 🔁 **המסע הזה עבר מהמסך אל תוך החלון, וזו אינה החלפת-סלקטור אלא תיקון של מה שהוא מודד.**
  // ‏ת4ב: *"לא מעניין מה היה במסך מקודם בכלל"* ⇒ **החלון אינו יורש את מסנן-הלקוח של המסך.**
  // ⇒ ריקון המסך כבר אינו מרוקן את הקובץ, והטענה הישנה הייתה נשארת ירוקה בלי לבדוק דבר.
  // **הסינון שמרוקן חייב להיות הסינון של החלון.**
  test('בתוך החלון: סינון שמרוקן ⇒ הייצוא מנוטרל, והכפתור שבמסך נשאר פעיל', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'customers', 'drifting')
    await openExportDialog(page)

    const customerSelect = page.getByTestId('export-customer')
    await expect(customerSelect).toBeVisible()
    const values = await customerSelect
      .locator('option')
      .evaluateAll((els) => els.slice(1).map((el) => el.value))
    expect(values.length, 'בורר-הלקוחות בחלון ריק — אין ממה לבחור').toBeGreaterThan(0)

    // הלקוח נבחר בזמן-ריצה (‏`e2e/CLAUDE.md §2.2`): הראשון שמרוקן את **הקובץ**.
    let emptied = null
    for (const value of values.slice(0, 12)) {
      await customerSelect.selectOption(value)
      await expect(page.getByTestId('export-preview-loading')).toHaveCount(0, { timeout: 30_000 })
      if ((await page.getByTestId('export-count').textContent()) === NO_ROWS_AFTER_FILTER) {
        emptied = value
        break
      }
    }
    expect(
      emptied,
      'לא נמצא לקוח שמרוקן את הקובץ — יש לעדכן את המסע, לא להחליש את הטענה',
    ).not.toBeNull()

    await expect(page.getByTestId('export-count')).toHaveText(NO_ROWS_AFTER_FILTER)
    await expect(page.getByTestId('export-dialog-run')).toBeDisabled()

    // 🔴 **והכפתור שבמסך נשאר פעיל — זו ההכרעה, לא תופעת-לוואי.** מרגע שאפשר לבחור בחלון כל
    // אחד מדוחות הלשונית, נטרול בגלל הדוח שבמקרה פתוח הוא מחסום שרירותי (‏`ExportBar`).
    await closeExportDialog(page)
    await expect(page.getByTestId('reports-export-button')).toBeEnabled()
  })
})

test.describe('מודול 11 · סינון-צולב גרף⇐טבלה (📐9 · הכרעה 15-ד)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('מ12: בחירה בגרף מצמצמת את הטבלה, מכריזה באזור-החי, ומתנקה — בלי לגעת בקובץ', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'finance', 'equipment')

    const selectButtons = page.locator('[data-testid^="chart-select-"]:not([disabled])')
    expect(await selectButtons.count(), 'למ12 אין כפתורי-בחירה — הקרוס-פילטר כבוי').toBeGreaterThan(
      0,
    )
    const rowsBefore = await mainTableRows(page).count()
    const exportBefore = await promisedFileName(page)
    await expect(page.getByTestId('report-clear-crossfilter')).toHaveCount(0)

    const first = selectButtons.first()
    const label = (await first.textContent()).trim()
    await activateWithKeyboard(page, first)

    // 15-ד — הצ'יפ אומר **מה** נבחר, והגוון אומר איפה.
    await expect(page.getByTestId('report-clear-crossfilter')).toHaveText(CLEAR_SELECTION_LABEL)
    await expect(page.getByTestId('report-crossfilter-label')).toHaveText(label)
    // 📐9④ — האזור-החי קיים מראש ומכריז את התוצאה בלשון-מספר נכונה.
    await expect(page.getByTestId('report-table-announce').first()).toHaveText(
      new RegExp(`^מסונן ל.+; (אין שורות|שורה אחת|[\\d,]+ שורות)$`),
    )
    const rowsAfter = await mainTableRows(page).count()
    expect(rowsAfter).toBeLessThan(rowsBefore)
    expect(rowsAfter).toBeGreaterThan(0)
    // 🔁 **ת4 קבע שהייצוא מוריד את מצב-המסך; ת4ב הפך זאת** — *"לא מעניין מה היה במסך
    // מקודם בכלל"*. ⇒ **הסינון-הצולב נשאר סינון-מסך בלבד ואינו נוגע בקובץ**, ושם-הקובץ
    // אינו נושא את הבחירה. 🔑 הטענה נשמרת ומתהפכת — הקשר בין השניים הוא בדיוק מה
    // שהוכרע, ולכן הוא ראוי לנעילה גם בכיוון ההפוך.
    const exportWithSelection = await promisedFileName(page)
    expect(exportWithSelection, 'הסינון-הצולב נכנס לשם-הקובץ — ת4ב מנתק ביניהם').toBe(exportBefore)
    expect(exportWithSelection).not.toContain(fileNameSegment(label))

    // 🪤 **הצ'יפ מנוקה במקלדת ולא בעכבר, וזה לא נוחות — נמדד 16/09/2026:** הפוקוס יושב
    // על כפתור טבלת-קורא-המסך, והיא `focus-within:not-sr-only`. ‏`mousedown` על הצ'יפ
    // מוציא את הפוקוס ⇒ הטבלה מתקפלת ⇒ הדף נדחף למעלה בין ה-`down` ל-`up`, וה-`up` נוחת
    // על אלמנט אחר: **אירוע ה-click לא נורה כלל**, הצ'יפ קיבל פוקוס ונשאר על המסך.
    // זהו בן-דוד ישיר של "משטח צף שנסגר ב-blur" מ-`e2e/CLAUDE.md §3`.
    await activateWithKeyboard(page, page.getByTestId('report-clear-crossfilter'))
    await expect(page.getByTestId('report-clear-crossfilter')).toHaveCount(0)
    expect(await mainTableRows(page).count()).toBe(rowsBefore)
    // סוגר את המעגל: לא הבחירה ולא הניקוי הזיזו את שם-הקובץ.
    expect(await promisedFileName(page)).toBe(exportBefore)
  })
})

test.describe('מודול 11 · מצב-הטמעה 0 מול 2 (C3 · מבחן-המחיקה)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('רמה 2: לכל אחת מארבע הלשוניות יש לפחות משפט-הסבר אחד', async ({ page }) => {
    test.setTimeout(150_000)
    await forceOnboardingMode(page, 2)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    for (const surface of DEFAULT_SURFACES) {
      await openReport(page, surface.tab, surface.report)
      await expect(page.getByTestId(`report-${surface.report}`)).toBeVisible()
      expect(
        await page.locator('[data-testid^="hint-"]').count(),
        `אין ולו רמז אחד ב-${surface.tab} ברמה 2`,
      ).toBeGreaterThan(0)
    }
  })

  test('רמה 0: אפס משפטי-הסבר — והבסיס כולו נשאר על המסך', async ({ page }) => {
    test.setTimeout(150_000)
    await forceOnboardingMode(page, 0)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    for (const surface of DEFAULT_SURFACES) {
      await openReport(page, surface.tab, surface.report)
      await expect(page.locator('[data-testid^="hint-"]')).toHaveCount(0)
      // מבחן-המחיקה: מה שיורד ברמה 0 הוא **רק** שכבת-ההטמעה.
      // ✏️ 23/09/2026: האוכלוסייה וההגדרות הן עדיין בסיס — גלויות ברמה 0 בלחיצה על השבב, לא ברמז.
      await expect(page.getByTestId('report-scope-summary')).toBeVisible()
      await expect(page.getByTestId('report-so-what')).toBeVisible()
      await page.getByTestId('report-scope-summary').click()
      await expect(page.getByTestId('report-population')).toBeVisible()
      await expect(page.getByTestId('report-definitions')).toBeVisible()
      await expect(page.getByTestId('report-table-card')).toBeVisible()
      expect(await page.getByTestId('report-tiles').locator('> *').count()).toBeGreaterThan(0)
    }
  })
})

test.describe('מודול 11 · שער מ22 "טרם אושרה ריצת-ניתוח" (פיקסטורה, לא ריצה אמיתית)', () => {
  test('מנכ"ל (edit): הבלוק המסביר, ייצוא חסום בנימוקו, וכפתור "הרץ ניתוח" קיים — ואינו נלחץ', async ({
    page,
  }) => {
    test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await fakeM22WithoutApprovedRun(page)
    await openReport(page, 'customers', 'notes')

    await expect(page.getByTestId('m22-no-run')).toContainText('טרם אושרה ריצת-ניתוח')
    // 🔁 **הכפתור פעיל תמיד (ת4ב), והחסימה עברה לתוך החלון.** ‏`meta.export_blocked_reason`
    // נוסע מה-RPC ל-`blockedReason`, מוצג במקום שורת-הכמות, ומנטרל את הייצוא **שם**.
    // 🔴 הנימוק הוא **זה שהשרת מסר**, ולא נוסח כללי — וזה מה שנשמר מהטענה המקורית.
    // ⚠️ **ושים לב ל-testid:** ההבטחה נשארה `reports-export-file`, אבל **הנימוק החסום יושב
    // ב-`export-count`.** טענה שתמשיך לקרוא את הראשון תקבל שם-קובץ ותשווה אותו לנוסח.
    await expect(page.getByTestId('reports-export-button')).toBeEnabled()
    await openExportDialog(page)
    await expect(page.getByTestId('export-count')).toHaveText(EXPORT_NO_APPROVED_RUN)
    await expect(page.getByTestId('export-dialog-run')).toBeDisabled()
    await closeExportDialog(page)
    // ⑤/⑦ — הכפתור קיים למי שיש לה `edit` על 'דו"חות'. 🚫 **לא נלחץ**: מודל בתשלום.
    await expect(page.getByTestId('m25-run-button')).toBeVisible()
    await expect(page.getByTestId('m25-run-button')).toHaveText('הרץ ניתוח')
  })

  test('מנהלת פרויקטים (view): אותו שער — בלי כפתור-הרצה כלל', async ({ page }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await fakeM22WithoutApprovedRun(page)
    await openReport(page, 'customers', 'notes')

    await expect(page.getByTestId('m22-no-run')).toContainText('טרם אושרה ריצת-ניתוח')
    // ⑤ — בלי `edit` הכפתור **אינו מוצג כלל** (ולא מוצג-מנוטרל).
    await expect(page.getByTestId('m25-run-button')).toHaveCount(0)
    // 🔁 אותו היפוך, **ובתפקיד `view`** — הבדיקה היחידה בקובץ שאינה רצה כמנכ"ל, ולכן זו
    // הנקודה היחידה שמוכיחה שהחסימה בתוך החלון אינה תלויה בהרשאת-עריכה.
    // ‼️ **והיא נפקדה מספירת §6 במסמך-המסירה** (*"581 · 582"*), ובלעדיה החבילה נשארת אדומה.
    await expect(page.getByTestId('reports-export-button')).toBeEnabled()
    await openExportDialog(page)
    await expect(page.getByTestId('export-count')).toHaveText(EXPORT_NO_APPROVED_RUN)
    await expect(page.getByTestId('export-dialog-run')).toBeDisabled()
  })
})

test.describe('מודול 11 · כשל-רשת ⇒ "נסי שוב", ולעולם לא "אין נתונים"', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('קריאת-הדוח נופלת ⇒ מעטפת-תקלה; ביטול-היירוט + "נסי שוב" ⇒ המשטח מצויר', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.route('**/rest/v1/rpc/report_m14_hostess_overview', (route) => route.abort())
    await page.goto('/reports?tab=hostesses&report=hostess-overview')

    const errorEnvelope = page.getByTestId('report-hostess-overview-error')
    await expect(errorEnvelope).toBeVisible()
    await expect(errorEnvelope).toContainText(LOAD_ERROR_TITLE)
    // 🔴 §4.3 — כשל-רשת **אינו** "אין נתונים עדיין".
    await expect(page.getByTestId('reports-page')).not.toContainText('אין נתונים עדיין')
    await expect(page.getByTestId('report-table-card')).toHaveCount(0)

    await page.unroute('**/rest/v1/rpc/report_m14_hostess_overview')
    await page.getByRole('button', { name: RETRY_LABEL }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('report-hostess-overview')).toBeVisible()
    await expect(page.getByTestId('report-table-card')).toBeVisible()
    expect(await mainTableRows(page).count()).toBeGreaterThan(0)
  })
})

// ── סדר-התווים בתא (נוסף 17/09/2026) — אינווריאנט 5 של `src/modules/11_reports/CLAUDE.md` ──
// 🔴 **למה בדיקה משלה, ולמה דווקא ב-E2E:** שני הפגמים שנמדדו בבנייה — `₪ 46,400` שהגליף
// שלו נדד **משמאל** לספרות, ותא-מדרג שהציג `30–1` במקום `1–30` — שרדו קומפילציה, בדיקות-
// יחידה, `npm run check:bidi` **וגם את העין**: התווים שמתקנים אותם בלתי-נראים, ואלגוריתם
// ה-bidi מסדר את התא רק כשיש `<td dir="rtl">` אמיתי סביבו. ⇒ הטענה היחידה שתופסת אותם היא
// **השוואת-תווים על מה שהדפדפן צייר בפועל מול מה שהשרת שלח**.
// 🔑 **ואין כאן ולו שם אחד נעוץ** (`e2e/CLAUDE.md §2.2`): מפתחות-העמודות נגזרים מ-`columns[]`
// של המטען שנתפס, והשורה שנבדקת היא הראשונה שיש בה גם מדרג וגם איש-קשר.

// 🔤 תווי-הבידוד נקובים ב**קוד-נקודה ולא מודבקים כתווים חיים**: הם בלתי-נראים, וקובץ שנושא
// אותם כמות-שהם אי-אפשר לקרוא בעין ואי-אפשר לחפש בו (אותו נימוק בדיוק כמו `LRI`/`PDI`
// ב-`src/lib/reportsFormat.js`, ואותה כווייה: `U+200F` נסתר ששיבש ספירה ב-`hostesses.js`).
const ISOLATE_CHARS = /[\u2066\u2067\u2068\u2069]/
const HEBREW_LETTER = /[\u0590-\u05FF]/
const NO_VALUE_MARK = '—'

// הפורמטים ש-`FORMATTERS` (`src/lib/reportsFormat.js`) מבודד בעצמו. ‏`gini` **אינו** כאן
// בכוונה — הוא מחזיר `toFixed(2)` חשוף, ודרישת-בידוד עליו הייתה טענה שגויה.
const ISOLATING_FORMATS = new Set(['money', 'percent', 'int', 'days', 'ratio', 'score', 'textLtr'])

const stripIsolates = (text) => String(text ?? '').replace(/[\u2066\u2067\u2068\u2069]/g, '')

// מפקד-הבידוד על **כל** תאי-העמוד שעמודתם הוכרזה בפורמט-מבודד: מי חסר בידוד (`offenders`),
// כמה תאים נמדדו בכלל (המכנה — סריקה על טבלה ריקה אינה ירוקה, היא לא רצה) וכמה מהם
// מערבבים ספרות ועברית (`⁦45⁩ ימים`) — הצורה שבלי בידוד נשברת ואיש אינו רואה.
function isolationCensus(columns, grid) {
  const offenders = []
  let checked = 0
  let mixed = 0
  for (const [index, column] of columns.entries()) {
    if (!ISOLATING_FORMATS.has(column.format)) continue
    for (const cells of grid) {
      const raw = cells[index]
      const text = stripIsolates(raw)
      if (text.trim() === '' || text === NO_VALUE_MARK) continue
      checked += 1
      if (!ISOLATE_CHARS.test(raw)) offenders.push(`${column.label}: ${text}`)
      if (/\d/.test(text) && HEBREW_LETTER.test(text)) mixed += 1
    }
  }
  return { offenders, checked, mixed }
}

test.describe('מודול 11 · סדר-תווים בתא (מ9 · אינווריאנט 5 · 📐18)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('מ9: תא-המדרג ותא-איש-הקשר תו-בתו מול המטען, וכל מספר בעמוד מבודד', async ({ page }) => {
    test.setTimeout(120_000)

    // 🚫 **אפס שינוי בתשובה** (`e2e/CLAUDE.md §2.1`): היירוט מושך את התשובה האמיתית, שומר
    // עותק, ומגיש אותה **כפי שהיא**. מה שהמסך צייר נגזר מה-JSON שנשמר כאן — ולא מהנחה.
    let captured = null
    await page.route('**/rest/v1/rpc/report_m09_aging', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      try {
        captured = JSON.parse(body)
      } catch {
        captured = null
      }
      await route.fulfill({ response, body })
    })

    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await openReport(page, 'finance', 'aging')

    expect(captured, 'מטען-ה-RPC של מ9 לא נתפס — אין מול מה להשוות').not.toBeNull()
    const columns = captured.columns
    // 🔑 העמודות נמצאות **לפי מה שהמטען מצהיר**: המדרג הוא העמודה שהוכרזה `textLtr` (i2),
    // ואיש-הקשר לפי מפתחה. שינוי-תווית בשרת לא ישבור את הבדיקה, ושינוי-חוזה כן — כרצוי.
    const bucketIndex = columns.findIndex((column) => column.format === 'textLtr')
    const contactIndex = columns.findIndex((column) => /owner|contact/i.test(String(column.key)))
    expect(bucketIndex, 'אין במ9 עמודה שמוצהרת `textLtr` — חוזה-הפורמט השתנה').toBeGreaterThan(-1)
    expect(contactIndex, 'אין במ9 עמודת איש-קשר (📐18)').toBeGreaterThan(-1)

    // כל תאי-העמוד בקריאה אחת: `textContent` הגולמי, **לפני** הפשטת הבידוד — הוא הראיה.
    const grid = await page
      .getByTestId('report-table-card')
      .first()
      .evaluate((card) =>
        Array.from(card.querySelectorAll('tbody tr')).map((tr) =>
          Array.from(tr.querySelectorAll('td')).map((td) => td.textContent),
        ),
      )
    expect(grid.length, 'הטבלה נמדדה בלי שורות — מכנה 0').toBeGreaterThan(0)
    expect(grid.length, 'העמוד מציג יותר שורות מכפי שהמטען נושא').toBeLessThanOrEqual(
      captured.rows.length,
    )

    // גודל-העמוד נקרא מהמסך ולא מקבוע מועתק, ולכן `PAGE_SIZE` אינו מוגדר כאן פעם שנייה.
    const pageRows = captured.rows.slice(0, grid.length)
    const hasText = (value) => typeof value === 'string' && value.trim() !== ''
    const rowIndex = pageRows.findIndex(
      (row) => hasText(row[columns[contactIndex].key]) && hasText(row[columns[bucketIndex].key]),
    )
    test.skip(rowIndex === -1, 'אין בעמוד-הראשון שורה שיש בה גם מדרג וגם איש-קשר')

    const row = pageRows[rowIndex]
    const cells = grid[rowIndex]
    expect(cells.length, 'מספר התאים בשורה אינו מספר העמודות שהמטען הכריז').toBe(columns.length)

    // 🔴 **ההשוואה היא תו-בתו** (`Array.from` על מחרוזת מפרק לנקודות-קוד): מקף שנדד, ספרה
    // שהתהפכה או שם שהתפצל מהמספר שלו — כולם נראים כאן, ואף אחד מהם אינו נראה ב-`toContain`.
    for (const index of [bucketIndex, contactIndex]) {
      const column = columns[index]
      expect(
        Array.from(stripIsolates(cells[index])),
        `תא "${column.label}" — סדר-התווים על המסך אינו סדר-המטען`,
      ).toEqual(Array.from(String(row[column.key])))
    }

    // ותא-המדרג נושא את הבידוד עצמו — בלעדיו `1–30` מרונדר `30–1` ואף שער לא תופס.
    expect(
      ISOLATE_CHARS.test(cells[bucketIndex]),
      'תא-המדרג הגיע בלי תו-בידוד — `format: textLtr` אינו בתוקף',
    ).toBe(true)

    const census = isolationCensus(columns, grid)
    expect(census.offenders, 'תאים בפורמט-מבודד שהגיעו בלי תו-בידוד').toEqual([])
    expect(census.checked, 'לא נמדד אף תא מספרי — מכנה 0').toBeGreaterThan(0)
    expect(
      census.mixed,
      'אין בעמוד ולו תא אחד שמערבב ספרות ועברית — הצורה שאינווריאנט 5 קיים בשבילה לא נבדקה',
    ).toBeGreaterThan(0)
  })
})
