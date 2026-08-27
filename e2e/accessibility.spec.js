import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// סריקת-נגישות אוטומטית (axe-core) — נוספה 10/08/2026 בעקבות שני ממצאי-3.7 שכלי כזה
// היה תופס מכנית: מלכודת-מקלדת (מבט-העל, מודול 4) וכפתור-סגירה כפול (כרטיס-דיילת, מודול 4).
// רץ נגד מסכים אמיתיים על פני כל המודולים הבנויים — לא רק מודול 4 — כי הכלי בודק DOM,
// לא לוגיקה-עסקית, ואינו תלוי-מודול.
//
// 🔴 **מדיניות-חומרה, לא "אפס הכול":** רק violations בחומרה `critical`/`serious` נכשלים את
// הבדיקה. `moderate`/`minor` נאספים ומודפסים לעיון, לא חוסמים — אותו עיקרון בדיוק כמו
// `audit-gate.mjs` (פטור מתועד לממצא-ידוע, לא השתקה שקטה).
//
// 🔬 **תיקון 10/08/2026 (אותו ערב, אחרי שישי ביקש לתקן) — הממצא הראשון היה שגוי בחלקו:**
// הריצה הראשונה דיווחה "ל-7 מתוך 8 מסכים אין `<main>`/`<h1>`" — **זו הייתה תקלת-תזמון בבדיקה
// עצמה, לא בקוד.** `page.goto()` בין מסכים גורם ל-reload מלא, ו-axe רץ **מיד**, לפעמים בדיוק
// באותה מילישנייה שבה `MainLayout` עדיין מציג את מסך-הביניים `"טוען..."` (לפני ש-AuthContext
// סיים) — שם באמת אין `<main>`/`<nav>`/`<h1>`, כי זה עדיין לא העמוד עצמו. **נמדד ישירות:**
// scan מבודד על מסך-הבית, בלי המרוץ, החזיר **אפס** violations — ול-6 מתוך 7 המסכים-שנחשדו
// כבר יש `<h1>` ו-`<main>` תקינים (`MainLayout` עוטף הכול ב-`<main>` אחד קבוע). **הממצא האמיתי
// היחיד ממשפחה זו: `CustomersPage` בלבד היה בלי `<h1>` (`<h2>רשימת לקוחות</h2>`) — תוקן.**
// ⇒ הוספתי המתנה-לטעינה (`waitForReady`) לפני כל סריקה, כדי שהמסך-הביניים לא יזוהה כ"עמוד".
//
// 🎯 **ושני ממצאים אמיתיים נוספים נמצאו באותה ריצה, ותוקנו:** `button-name` על ה-Select של
// "עיר" במאגר-הדיילות (לא היה `aria-label` בכלל, בניגוד לשדות-טופס שיש להם תווית חזותית
// לפחות) — נוסף `aria-label="סינון לפי עיר"`.
//
// ⏸️ **וממצא אחד נשאר פתוח בכוונה, לא תוקן:** `color-contrast` על שני אלמנטים — טקסט לבן על
// `bg-teal-600` בכפתור "+ הוספת דיילת" (יחס 3.66, נדרש 4.5 — **צבע-המותג הראשי**, בשימוש
// ב-24 קבצים ברחבי `src/`) והכיתוב `text-slate-400` "רבעון אחרון" (יחס 2.63). **שני אלה
// הם שינוי-צבע ולא תיקון-סמנטיקה** — כלל-ברזל 8 אוסר לשנות צבעים בלי אישור ישי, וה-slate-400
// כבר רשום כחוב-נגישות מתוכנן ל-M12 (`architecture_and_qa_roadmap.md:141`). ⇒ `color-contrast`
// מסווג כאן **advisory ולא blocking** במפורש (לא "נשכח" — ראה `CONTRAST_IS_ADVISORY` למטה),
// עד שתתקבל הכרעה על גוון-המותג.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

// ראה הערת 10/08/2026 למעלה: `color-contrast` תלוי-הכרעת-צבע (כלל-ברזל 8), לא תקלת-קוד.
const CONTRAST_IS_ADVISORY = new Set(['color-contrast'])

async function login(page) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(CEO_EMAIL)
  await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// ממתין שהעמוד האמיתי יתרנדר (הסרגל תמיד נושא <nav>) — לא למסך-הביניים "טוען..." של
// MainLayout, שבו באמת אין landmarks. בלי זה, axe שרץ מיד אחרי goto() תופס לפעמים
// את המסך-הביניים ומדווח "אין main/h1" על עמוד שיש לו את שניהם.
//
// 🔴 **הורחב באודיט-הסגירה של מודול 4 (12/08/2026) — התיקון מ-10/08 היה חצי-תיקון.**
// ‏`<nav>` הוא **תפאורת-הפריסה**, והוא נוכח ברגע ש-`AuthContext` סיים — כלומר **לפני**
// שהמסך עצמו טען את הנתונים שלו. ⇒ axe הספיק לסרוק טבלה שעדיין מתרנדרת.
// 🔬 **איך זה התגלה, ואיך אומת:** בריצת-החבילה המלאה נפל `button-name … (11 nodes)` על
// `/system/prices`; **ריצה מבודדת של אותה בדיקה עברה**, ובה אותו מסך החזיר **אפס** ממצאים
// (בריצה שנפלה הוא החזיר גם `empty-table-header` — התסמין הקלאסי של טבלה חצי-בנויה).
// ‏11 הצמתים הם **11 המוצרים**: ה-`SelectTrigger` של סטטוס-המוצר שואב את שמו-הנגיש
// **רק** מה-`SelectValue` שבתוכו, וכל עוד הערך לא נצבע — לכפתור אין שם.
// 🔑 **סיבה אחת, שלושה תסמינים** (`button-name` · `empty-table-header` · ממצא-ה-landmarks
// מ-10/08) ⇒ ההמתנה חייבת להיות ל**תוכן של המסך**, לא לשלד שסביבו.
// ⚠️ `networkidle` אינו "המתנה שרירותית": הוא בדיוק הרגע שבו שאילתות-המסך הסתיימו.
async function waitForReady(page) {
  await page.locator('nav').first().waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 })
}

async function scan(page, label) {
  await waitForReady(page)
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter(
    (v) => ['critical', 'serious'].includes(v.impact) && !CONTRAST_IS_ADVISORY.has(v.id),
  )
  const advisory = results.violations.filter(
    (v) => !['critical', 'serious'].includes(v.impact) || CONTRAST_IS_ADVISORY.has(v.id),
  )
  if (advisory.length > 0) {
    console.log(
      `⚠️ ${label}: ${advisory.length} advisory finding(s) — ${advisory
        .map((v) => v.id)
        .join(', ')}`,
    )
  }
  expect(
    blocking.map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`),
    `${label} — critical/serious accessibility violations`,
  ).toEqual([])
}

test.describe('נגישות (axe-core) — מסכים ראשיים על פני כל המודולים', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('סריקה על מסכי מודולים 1–4', async ({ page }) => {
    await login(page)

    await page.goto('/')
    await scan(page, 'מסך הבית')

    await page.goto('/customers')
    await scan(page, 'לקוחות (מודול 2)')

    await page.goto('/quotes')
    await scan(page, 'הצעות (מודול 3)')

    await page.goto('/quotes/new')
    await scan(page, 'בניית הצעה (מודול 3)')

    await page.goto('/system/prices')
    await scan(page, 'מחירים (מודול 1/system)')

    await page.goto('/system/permissions')
    await scan(page, 'מטריצת הרשאות (מודול 1)')

    await page.goto('/hostesses')
    await scan(page, 'דיילות · מעקב פניות ושיבוצים (מודול 4)')

    await page.getByTestId('hostesses-tab-repository').click()
    await scan(page, 'דיילות · מאגר (מודול 4)')
  })

  // ── מודול 5 (נוסף 26/08/2026, צעד 4.4) — **שני המשטחים, ושלושתם עם המתנה-לתוכן** ──────
  // 🔴 ההמתנה כאן אינה `waitForReady` לבדה, וזה לא ייתור: `waitForReady` ממתין ל-`h1` של
  // **העמוד**, והדיאלוג הוא portal שנפתח אחריו. סריקה שרצה על שלד-הדיאלוג מחזירה אפס
  // ממצאים ונראית ירוקה בעוד היא מדדה כלום — וזה בדיוק הכשל שנרשם ב-`e2e/CLAUDE.md`
  // (26/08/2026) על **דיאלוג של המודול הזה**. ⇒ לפני כל סריקת-דיאלוג: המתנה לשורות
  // עצמן **ואסרשן שהמכנה אינו 0**.
  async function openChecklistAndAssertContent(page) {
    await expect(page.getByTestId('logistics-pill-all')).toBeEnabled({ timeout: 30_000 })
    await page.getByTestId('logistics-pill-all').click()
    await page.locator('[data-testid^="logistics-row-"]').first().click()
    const rows = page.locator('[data-testid^="checklist-row-"]')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    expect(await rows.count(), 'הדיאלוג נסרק בלי שורות — הסריקה רצה על מכנה 0').toBeGreaterThan(0)
  }

  test('סריקה על שני משטחי מודול 5, כולל הווריאנט המבוטל', async ({ page }) => {
    await login(page)

    // משטח 1 — תור-העבודה.
    await page.goto('/logistics')
    await expect(page.getByTestId('logistics-queue-table')).toBeVisible({ timeout: 30_000 })
    await scan(page, 'לוגיסטיקה · תור-העבודה (מודול 5, משטח 1)')

    // משטח 2 — דיאלוג-הצ'קליסט במצבו הרגיל (פקדי-כתיבה פעילים).
    await openChecklistAndAssertContent(page)
    await scan(page, 'לוגיסטיקה · דיאלוג-הצ׳קליסט (מודול 5, משטח 2)')
    await page.getByTestId('checklist-close').click()
    await expect(page.locator('[data-testid^="checklist-row-"]')).toHaveCount(0)

    // 🔒 הווריאנט המבוטל (㉝ כפי שצומצמה ב-㊴) — **המצב שבו כל הפקדים מושבתים ושדה אחד
    // נשאר פתוח**, וזה בדיוק המצב שבו `aria-label`/`title` של פקד נעול נבדקים. אינו קיים
    // בדאטה החיה (פרויקט מבוטל אינו מגיע למשטח 1) ⇒ מיוצר ביירוט-רשת בלבד, אפס כתיבות:
    // רק הקריאה-מחדש של הדיאלוג מיורטת (היא המובחנת ב-`quote_id` שב-`select`), והתשובה
    // האמיתית נמשכת ומומרת — כך שאף מזהה ואף ערך אינם מומצאים.
    await page.route(
      (url) =>
        url.pathname === '/rest/v1/projects' &&
        (url.searchParams.get('select') ?? '').includes('quote_id'),
      async (route) => {
        const response = await route.fetch()
        const payload = await response.json()
        // 🔴 **התשובה היא מערך, גם על `maybeSingle`** (נמדד 26/08/2026: `route.fetch()`
        // מחזיר `[{…}]`). פריסת-אובייקט על מערך מייצרת `{0:{…}}` — פרויקט בלי `event_name`,
        // כלומר כותרת-דיאלוג ריקה, ואז axe מדווח `aria-dialog-name`+`empty-heading` על
        // **פגם של הבדיקה** ולא של המסך. ⇒ ממפים, ולא פורסים.
        const cancel = (project) => ({
          ...project,
          project_status: 'cancelled',
          cancelled_at: '2026-08-11',
          cancel_reason: 'הלקוח ביטל',
        })
        return route.fulfill({
          status: response.status(),
          contentType: 'application/json',
          body: JSON.stringify(Array.isArray(payload) ? payload.map(cancel) : cancel(payload)),
        })
      },
    )
    await page.reload()
    await openChecklistAndAssertContent(page)
    // המכנה של המצב עצמו: הבאנר על המסך ⇒ זהו באמת הווריאנט המבוטל ולא הדיאלוג הרגיל.
    await expect(page.getByTestId('checklist-banner-cancelled')).toBeVisible()
    // ⚠️ ושהכותרת אינה ריקה — אחרת הסריקה מודדת דיאלוג שהיירוט עצמו שיבש.
    await expect(page.getByRole('dialog').getByRole('heading').first()).not.toBeEmpty()
    const openField = page.locator('[data-testid^="checklist-qty-"]:not([disabled])')
    expect(
      await openField.count(),
      'אין שדה פתוח בווריאנט המבוטל — חריג ㊴ לא נסרק',
    ).toBeGreaterThan(0)
    await scan(page, 'לוגיסטיקה · דיאלוג-הצ׳קליסט — וריאנט מבוטל (מודול 5, משטח 2)')
  })

  // ── מודול 8 (נוסף 28/08/2026, צעד 4.4) — S1 (מבט-על) + הדיאלוג שהיא פותחת (S2) ─────────
  // 🔴 קריאה-בלבד: אף כפתור-כותב לא נלחץ באף בדיקה בקובץ הזה (אותו איסור כמו
  // `finance.spec.js`/`public-feedback.spec.js` — 28/08/2026, יום ההצגה-הביניים על אותו
  // Supabase). הדיאלוג נסרק ואז נסגר ב-`Escape`, לא בכפתור עסקי.
  test('סריקה על מודול 8 — מבט-העל (S1) ודיאלוג-סגירת-תיק (S2)', async ({ page }) => {
    await login(page)

    await page.goto('/finance')
    await scan(page, 'כספים · מבט-העל (מודול 8, משטח S1)')

    // הלשונית הראשונה שיש בה שורה — לא נועצים 'awaiting_invoice': ר' הערת-הריקבון
    // ב-`finance.spec.js` (הפרויקט הידוע יתקדם ללשונית הבאה ברגע ש-5.1 ישלח חשבונית).
    let opened = false
    for (const tabKey of ['awaiting_invoice', 'awaiting_payment', 'finished']) {
      const tab = page.getByTestId(`finance-tab-${tabKey}`)
      await expect(tab).not.toContainText('—', { timeout: 30_000 })
      await tab.click()
      const count = Number((await tab.innerText()).replace(/[^0-9]/g, ''))
      if (count > 0) {
        await page.locator('[data-testid^="finance-row-"]').first().click()
        opened = true
        break
      }
    }
    expect(opened, 'אין אף שורה בשלוש הלשוניות כרגע — אין דיאלוג-S2 לסרוק').toBe(true)

    const dialog = page.getByTestId('closing-dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('closing-meta')).toBeVisible({ timeout: 15_000 })
    await scan(page, 'כספים · דיאלוג-סגירת-תיק (מודול 8, משטח S2)')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})

// ── מודול 8 — S4, הדף הציבורי למשוב-לקוח (נוסף 28/08/2026, צעד 4.4) ────────────────────
// 🔴 **אינו דורש session** (אותו תקדים בדיוק כמו `/shift/:token`) ⇒ describe נפרד, בלי
// ‏`E2E_CEO_*` ובלי `login()`. `scan()` שמעל דורשת `<nav>` (סרגל-הצד) — והדף הציבורי
// **בכוונה** יושב מחוץ ל-`MainLayout` ולכן אין לו סרגל בכלל; `scanPublic` להלן ממתין
// לתוכן-המסך עצמו (בדיוק כמו `waitForReady`, בלי דרישת-`nav` שלעולם לא תתקיים כאן).
test.describe('נגישות (axe-core) — מודול 8, משטח S4 (ציבורי, בלי session)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  async function scanPublic(page, label) {
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).analyze()
    const blocking = results.violations.filter(
      (v) => ['critical', 'serious'].includes(v.impact) && !CONTRAST_IS_ADVISORY.has(v.id),
    )
    const advisory = results.violations.filter(
      (v) => !['critical', 'serious'].includes(v.impact) || CONTRAST_IS_ADVISORY.has(v.id),
    )
    if (advisory.length > 0) {
      console.log(
        `⚠️ ${label}: ${advisory.length} advisory finding(s) — ${advisory
          .map((v) => v.id)
          .join(', ')}`,
      )
    }
    expect(
      blocking.map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`),
      `${label} — critical/serious accessibility violations`,
    ).toEqual([])
  }

  // ① מסך-התוצאה (dead) — **מיורט, ולא אמיתי. תיקון-עובדה 28/08/2026:** עד היום נכתב כאן
  // ש-`get_feedback_page` היא "קריאה טהורה וטוקן-שווא לא כותב דבר" — **וזה שגוי.** גוף
  // הפונקציה פותח ב-`perform public.feedback_rate_limit()`, שמוחקת-ומכניסה שורה ל-
  // `feedback_rpc_calls` (`20260827155303_module8_public_feedback_rpc.sql`) ⇒ כל קריאה כותבת
  // למסד החי, בניגוד לחוזה-הריצה של 28/08 (יום ההצגה על אותו פרויקט Supabase).
  // ‏🔬 אומת חי: הטבלה כבר מחזיקה 10 שורות מ-IP אחד ⇒ ה-`insert` אכן מתבצע כאן.
  // ‏🚫 **ואין כאן שום אובדן-כיסוי:** מטרת הבדיקה היא סריקת-DOM של מסך-התוצאה, וה-DOM
  // שנוצר מתשובת-`not_found` מזויפת זהה לזה שנוצר מהתשובה החיה — אותו `state` בדיוק.
  // ההנמקה המלאה, כולל למה התקדים `public-confirm` כן קורא חי: `e2e/public-feedback.spec.js`.
  test('סריקה על מסך-התוצאה (dead)', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_feedback_page', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ state: 'not_found' }),
      }),
    )
    await page.goto('/feedback/00000000-0000-4000-8000-000000000002')
    await expect(page.getByTestId('feedback-result-dead')).toBeVisible({ timeout: 15_000 })
    await scanPublic(page, 'משוב-לקוח · מסך-תוצאה (מודול 8, משטח S4)')
  })

  // ② הטופס הפתוח — יירוט-רשת ולא סמיכות על שורת-`ok` חיה שעלולה שלא להיות קיימת
  // ברגע שהבדיקה רצה (אותה מדיניות בדיוק כמו `public-feedback.spec.js`).
  test('סריקה על הטופס הפתוח (form, עם כוכב נבחר)', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_feedback_page', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ok',
          event_name: 'כנס E2E לבדיקת-נגישות',
          event_date: '2026-09-01',
        }),
      }),
    )
    await page.goto('/feedback/00000000-0000-4000-8000-000000000003')
    await expect(page.getByTestId('feedback-form')).toBeVisible({ timeout: 15_000 })
    // כוכב נבחר לפני הסריקה: כפתור-השליחה עובר מ-`disabled` ל-`enabled`, ואלמנט-מושבת
    // עלול להסתיר ממצאי-נגישות שרק ב-state הפעיל שלו נחשפים.
    await page.getByTestId('feedback-stars').getByRole('button', { name: '5 מתוך 5' }).click()
    await scanPublic(page, 'משוב-לקוח · טופס פתוח (מודול 8, משטח S4)')
  })
})
