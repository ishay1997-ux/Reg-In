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
  //
  // 🆕 🔴 **ותוספת 02/09/2026 — שורות-הצ׳קליסט מיוצרות ביירוט, ואינן נלקחות כמות שהן.**
  // הסריקה של הווריאנט המבוטל דורשת שדה **פתוח** על מסך שכולו נעול (חריג ㊴) — וזה קיים
  // רק בשורת `הוזמן`/`מוכן`. עד היום הבדיקה פתחה את שורת-התור הראשונה **וקיוותה** שיש בה
  // כזאת; בלילה שבו מסע-הקבלה של מודול 8 ביטל את הפרויקט היחיד שהיו לו שורות כאלה,
  // הבדיקה האדימה על *"אין שדה פתוח בווריאנט המבוטל"* — **כשל בדאטה שנקרא ככשל נגישות.**
  // ⇒ הזהות עדיין נבחרת מהתור החי (הבקרה החיובית נשמרת), אבל שורות-הלוגיסטיקה של אותו
  // פרויקט מוחלפות ביירוט באוסף קבוע: `הוזמן` · `טרם החל` · `מוכן`. **וזו גם סריקה טובה
  // יותר**, לא רק יציבה: כל סוגי-הפקדים נמצאים על המסך בוודאות (שדה פתוח, שדה נעול,
  // שדה-תאריך, כפתורי-מצב) במקום מה שהפרויקט הראשון במקרה נשא. 🚫 ואפס כתיבות — יירוט
  // על קריאת-GET, כמו כל שאר הקובץ.
  const CRAFTED_STATUSES = ['ordered', 'not_started', 'ready']
  const rowKeyOf = (row) => `${row.sku}-${row.serial_number}`

  // מחליף את שורות-הלוגיסטיקה של `projectId` **בלבד** — שאר התור נשאר אמיתי, ולכן משטח 1
  // (שנסרק לפני ההתקנה) והמיון שלו אינם מושפעים. כל שורה נגזרת משורה אמיתית של אותו
  // פרויקט; מה שנקבע הוא מצב-הפריט והשדות שהמסך גוזר ממנו. שורה שאין לה מקור מקבלת
  // שכפול של הראשונה עם `serial_number` פנוי (החלק השלישי במפתח הראשי).
  async function routeCraftedChecklistRows(page, projectId) {
    const crafted = []
    await page.route(
      (url) => url.pathname === '/rest/v1/logistics',
      async (route) => {
        const response = await route.fetch()
        const payload = await response.json()
        const all = Array.isArray(payload) ? payload : [payload]
        const mine = all.filter((row) => Number(row.project_id) === projectId)
        const others = all.filter((row) => Number(row.project_id) !== projectId)
        if (mine.length === 0) return route.fulfill({ status: response.status(), body: '[]' })
        let spare = Math.max(...mine.map((row) => Number(row.serial_number) || 0)) + 1
        const next = CRAFTED_STATUSES.map((status, index) => ({
          ...(mine[index] ?? { ...mine[0], serial_number: spare++ }),
          item_status: status,
          actual_qty: 0,
          actual_qty_autofilled: false,
          notes: null,
          expected_arrival_date: null,
          actual_arrival_date: status === 'ready' ? '2026-08-11' : null,
        }))
        crafted.splice(0, crafted.length, ...next)
        return route.fulfill({
          status: response.status(),
          contentType: 'application/json',
          body: JSON.stringify([...others, ...next]),
        })
      },
    )
    return crafted
  }

  // בוחר את הפרויקט שעליו יורכב המצב, ומתקין עליו את היירוט. ‏`logistics-pill-all` שמופעל
  // כאן הוא **הבקרה החיובית** של `e2e/CLAUDE.md` — גלולה מושבתת אצל תפקיד רואה-כול פירושה
  // הזדהות/RLS שבורים, ולא "אין דאטה".
  async function selectQueueSubject(page) {
    await expect(page.getByTestId('logistics-pill-all')).toBeEnabled({ timeout: 30_000 })
    await page.getByTestId('logistics-pill-all').click()
    const first = page.locator('[data-testid^="logistics-row-"]').first()
    await expect(first).toBeVisible({ timeout: 30_000 })
    const testId = await first.getAttribute('data-testid')
    const projectId = Number(testId.replace('logistics-row-', ''))
    return { projectId, crafted: await routeCraftedChecklistRows(page, projectId) }
  }

  async function openChecklistAndAssertContent(page, subject) {
    await expect(page.getByTestId('logistics-pill-all')).toBeEnabled({ timeout: 30_000 })
    await page.getByTestId('logistics-pill-all').click()
    // 🔒 נפתח **לפי מזהה** ולא ב-`.first()`: שתי הפתיחות (הרגילה והמבוטלת) חייבות לגעת
    // באותו פרויקט — הוא היחיד שהיירוט מרכיב עליו מצב — וביניהן יש `reload`.
    await page.getByTestId(`logistics-row-${subject.projectId}`).click()
    const rows = page.locator('[data-testid^="checklist-row-"]')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    expect(await rows.count(), 'הדיאלוג נסרק בלי שורות — הסריקה רצה על מכנה 0').toBeGreaterThan(0)
    // 🔴 והמכנה החזק, שבלעדיו בדיקה שמייצרת את הקלט שלה יכולה לעבור על מסך שלא צייר דבר:
    // אלה **השורות שיוצרו** שרונדרו, כל אחת בשמה — ולא שלוש שורות אקראיות של פרויקט אחר.
    expect(subject.crafted.length, 'היירוט לא ייצר שורות — אין מה לסרוק').toBe(
      CRAFTED_STATUSES.length,
    )
    await expect(rows).toHaveCount(subject.crafted.length)
    for (const row of subject.crafted) {
      await expect(page.getByTestId(`checklist-row-${rowKeyOf(row)}`)).toBeVisible()
    }
  }

  test('סריקה על שני משטחי מודול 5, כולל הווריאנט המבוטל', async ({ page }) => {
    await login(page)

    // משטח 1 — תור-העבודה. נסרק על הדאטה החיה **כפי שהיא**, לפני כל יירוט.
    await page.goto('/logistics')
    await expect(page.getByTestId('logistics-queue-table')).toBeVisible({ timeout: 30_000 })
    await scan(page, 'לוגיסטיקה · תור-העבודה (מודול 5, משטח 1)')

    // הנושא נבחר מהתור החי, ומרגע זה שורותיו מיוצרות.
    const subject = await selectQueueSubject(page)

    // משטח 2 — דיאלוג-הצ'קליסט במצבו הרגיל (פקדי-כתיבה פעילים).
    await openChecklistAndAssertContent(page, subject)
    await scan(page, 'לוגיסטיקה · דיאלוג-הצ׳קליסט (מודול 5, משטח 2)')
    await page.getByTestId('checklist-close').click()
    await expect(page.locator('[data-testid^="checklist-row-"]')).toHaveCount(0)

    // 🔒 הווריאנט המבוטל (㉝ כפי שצומצמה ב-㊴) — **המצב שבו כל הפקדים מושבתים ושדה אחד
    // נשאר פתוח**, וזה בדיוק המצב שבו `aria-label`/`title` של פקד נעול נבדקים. אינו קיים
    // בדאטה החיה (פרויקט מבוטל אינו מגיע למשטח 1) ⇒ מיוצר ביירוט-רשת בלבד, אפס כתיבות.
    // **שני חצאי-המצב, ושניהם מיוצרים** (עודכן 02/09/2026): הנעילה באה מכאן — הקריאה-מחדש
    // של הדיאלוג, המובחנת ב-`quote_id` שב-`select` — וה**שדה שנשאר פתוח** בא מ-
    // ‏`routeCraftedChecklistRows` שלמעלה, כי הוא תלוי במצב-הפריט ולא במצב-הפרויקט.
    // בשני המקרים התשובה האמיתית נמשכת ומומרת — אף מזהה ואף `sku` אינם מומצאים.
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
    await openChecklistAndAssertContent(page, subject)
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

  // ── מודול 9 (נוסף 02/09/2026, צעד 4.2) — שלושת ה-DOM-ים של לשונית "פרמטרים" ──────────
  // 🔴 **שלוש סריקות ולא אחת, וזה לא ייתור:** שלוש הקבוצות מרנדרות פקדים שונים לגמרי —
  // טבלה גנרית (שדות-טקסט), עורך-תבניות (textarea + צ׳יפים כפתורים), ופאנל Smart Match
  // (מתג + באנר + שורת-סיכום). ‏axe בודק DOM, וממצא של אחד אינו נבדק אצל האחרים.
  // ⚠️ **וכל סריקה ממתינה לתוכן של אותה קבוצה, לא לשלד** — הלקח של `e2e/CLAUDE.md`
  // (מדידה שהמכנה שלה 0 אינה ירוקה, היא לא רצה).
  test('סריקה על לשונית הפרמטרים (מודול 9) — טבלה גנרית, עורך-תבניות ופאנל Smart Match', async ({
    page,
  }) => {
    await login(page)
    await page.goto('/system/params')

    const rows = page.locator('[data-testid="settings-row"]')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    expect(await rows.count(), 'הקבוצה הגנרית נסרקה בלי שורות — מכנה 0').toBeGreaterThan(0)
    await scan(page, 'הגדרות מערכת · קבוצה גנרית (מודול 9)')

    await page.getByTestId('settings-group-templates').click()
    await expect(page.getByTestId('settings-template-body')).toBeVisible({ timeout: 30_000 })
    await scan(page, 'הגדרות מערכת · עורך התבניות (מודול 9)')

    await page.getByTestId('settings-group-smart_match').click()
    await expect(page.getByTestId('settings-smartmatch-reliability-toggle')).toBeVisible({
      timeout: 30_000,
    })
    await scan(page, 'הגדרות מערכת · פאנל Smart Match (מודול 9)')
  })
})

// ── מודול 9 · "ההגדרות שלי" — נסרק **כמנהלת הכספים ולא כמנכ"ל** (נוסף 02/09/2026) ───────
// 🔴 **וזה הכרחי, לא העדפה:** המנכ"ל אינו בעלים של אף שורה (`owner_role_id IS NULL` =
// CEO-בלבד) ⇒ אצלו הדף מרנדר את מצב-הריק בלבד, וסריקה עליו הייתה בודקת פסקה אחת
// ומדווחת "ירוק" על מסך שלא צייר את הטבלאות, את פאנל-התבניות ואת רשימת-השכר.
// מנהלת הכספים היא הזהות שיש לה תוכן אמיתי בדף הזה.
test.describe('נגישות (axe-core) — מודול 9, "ההגדרות שלי" (מנהלת הכספים)', () => {
  const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
  const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD,
    'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('סריקה על "ההגדרות שלי" עם שורות אמיתיות', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('כתובת דוא״ל').fill(FINANCE_EMAIL)
    await page.getByPlaceholder('סיסמה').fill(FINANCE_PASSWORD)
    await page.getByRole('button', { name: 'התחברות', exact: true }).click()
    await expect(page).toHaveURL('/', { timeout: 30_000 })

    await page.goto('/my-settings')
    const rows = page.locator('[data-testid="settings-row"]')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    // המכנה: היא באמת בעלת שורות. אפס = מפת-הבעלות/ההזדהות שבורות, והסריקה מדדה ריק.
    expect(await rows.count(), '"ההגדרות שלי" נסרק בלי שורות — מכנה 0').toBeGreaterThan(0)
    await scan(page, 'הגדרות מערכת · "ההגדרות שלי" (מודול 9)')
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
    // 🔴 תוקן `01/09/2026` באודיט-הסגירה: השם הנגיש של כפתור-הכוכב היה `5 מתוך 5` —
    // נוסח שנכתב למסך **פנימי** שבו מנהלת מדרגת דיילת. כרטיס-המסך המאושר של הדף
    // הציבורי (§S4/①) נועל `כוכב 1`…`כוכב 5`, והדף תוקן אליו. **לאלמנט יש שם-נגיש
    // אחד בלבד**, ולכן אין גרסה שמספקת את שניהם — הבדיקה נעה עם המסך.
    await page.getByTestId('feedback-stars').getByRole('button', { name: 'כוכב 5' }).click()
    await scanPublic(page, 'משוב-לקוח · טופס פתוח (מודול 8, משטח S4)')
  })
})
