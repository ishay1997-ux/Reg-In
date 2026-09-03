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

// מק"ט שיושב על שורת-דיילות בהצעה פתוחה אמיתית. זה בדיוק התרחיש שהתיקון נועד לו.
// ⚠️ **עברה מ-#6 ל-#8 (אומת במסד 04/08/2026).** ‏#6 אושרה מאז, ומסך-העריכה שלה אינו
// המקרה שנבדק כאן. ‏#8 ("יום גיבוש חברה", הייטק גרופ) עומדת באותם שלושה תנאים ש-#6
// עמדה בהם, ו**כל השלושה נחוצים**: `in_progress` (אחרת אין מסך-עריכה) · שורת-`04ST`
// ראשונה (הבדיקות פונות ל-`.first()`) · שורה שנייה שאינה דיילות (‏`B-ECO-TAG`) —
// היא זו שמוכיחה ש-§7.34 מסתיר את המוצר המושבת **בשורה אחרת**.
const HOSTESS_SKU = '04ST'
// 🔄 03/09/2026: #8 נמחקה עם דמו-יולי בהכרעת-ישי. ההצעה נבחרת בזמן-ריצה לפי אותם שלושה
// תנאים בדיוק (`pickQuoteWithHostessLine`, נקראת ב-`beforeEach`), ונופלת ברעש על
// "פיקסטורה חסרה" אם אין כזו — לא ירוק-על-כלום ולא מזהה שירקיב.
let QUOTE_WITH_HOSTESS_LINE = null

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

async function pickQuoteWithHostessLine(page) {
  const lines = await page.evaluate(
    async ({ url, anon }) => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
      const token = JSON.parse(sessionStorage.getItem(key)).access_token
      const res = await fetch(
        `${url}/rest/v1/quote_services?select=quote_id,line_number,sku,quotes!inner(quote_status)&quotes.quote_status=eq.in_progress&line_number=in.(1,2)&order=quote_id,line_number`,
        { headers: { apikey: anon, Authorization: `Bearer ${token}` } },
      )
      return res.json()
    },
    { url: SUPABASE_URL, anon: SUPABASE_ANON },
  )
  const byQuote = new Map()
  for (const line of lines)
    byQuote.set(line.quote_id, { ...byQuote.get(line.quote_id), [line.line_number]: line.sku })
  const found = [...byQuote.entries()].find(
    ([, skus]) => skus[1] === HOSTESS_SKU && skus[2] && !skus[2].endsWith('ST'),
  )
  expect(
    found,
    'אין הצעה בתהליך עם 04ST בשורה 1 ושורה שנייה שאינה דיילות — פיקסטורה חסרה, לא באג',
  ).toBeTruthy()
  QUOTE_WITH_HOSTESS_LINE = found[0]
}

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
    await pickQuoteWithHostessLine(page)
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

  // ⚠️ **המסלול השני, ולא רק האישור.** ‏`toWriteError` עוטף שלוש כתיבות, וחלון-האישור הוא
  // רק אחת מהן — השנייה היא שמירת-עריכה, שמציגה **טוסט** ולא שורה בחלון. נתיב-תצוגה אחר
  // לגמרי, ולכן "עובד באישור" אינו מעיד עליו. (הבדיקה הזו הייתה בתוכנית המאושרת ונשמטה
  // בסבב הראשון — נוספה 31/07 14:50 אחרי שישי שאל מה לא נבדק.)
  test('כשל שמירת-עריכה: הטוסט מציג את ההודעה הממופה, לא את הגולמית', async ({ page }) => {
    // המחרוזת מ-20260723115000 (`replace_quote_lines`), עם ערך-ה-enum שהמסד מזריק.
    await failRpc(page, 'replace_quote_lines', {
      message: 'לא ניתן לערוך הצעה שאינה בתהליך (סטטוס approved)',
    })
    await page.goto(`/quotes/${QUOTE_WITH_HOSTESS_LINE}/edit`)
    await expect(page.getByTestId('quote-lines-table')).toBeVisible({ timeout: 30_000 })

    // ⚠️ **חייבים לשנות משהו לפני הלחיצה** (הכרעת-ישי 01/08): "עדכן ושלח" בלי שינוי אינו
    // שומר כלל — הוא פותח `window.confirm`, ש-Playwright דוחה כברירת-מחדל ⇒ הקוד חוזר
    // בלי לגעת ב-RPC, והטוסט שהבדיקה מחפשת לעולם לא ייווצר. שינוי-כמות הוא הדרך הזולה
    // ביותר להכריח את המסלול האמיתי. **אפס כתיבות** — ה-RPC מיורט ונופל ב-400.
    const qty = page.getByTestId(/^quote-line-qty-/).first()
    await qty.click()
    await qty.fill('9')
    await qty.blur()

    // ⚠️ התווית היא **'עדכן ושלח'** (‏`QuoteBuilderPage.jsx:748`, אותה הכרעה —
    // השמירה פותחת את חלון-השליחה). עד 04/08 עמד כאן 'עדכון ההצעה', שם שכבר לא קיים
    // במוצר, והבדיקה נפלה ב-timeout על כפתור שאינו — כלומר לא בדקה דבר.
    await page.getByRole('button', { name: 'עדכן ושלח' }).click()

    const toast = page.getByTestId('toast-error')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('אינה בסטטוס')
    await expect(toast).not.toContainText('approved')
    // 🔒 ‏`'עדכון ההצעה נכשל'` **נשאר כאן במכוון ואינו שריד** — זו מחרוזת-ה-fallback החיה
    // ב-`03_quotes/api.js:204`, וכל העניין הוא שההודעה הממופה גברה עליה.
    await expect(toast).not.toContainText('עדכון ההצעה נכשל')
  })

  // שתי המחלקות שה-SQLSTATE מזהה לבדו, בלי תלות בטקסט — ולכן הן היחידות שישרדו גם
  // ניסוח-מחדש של הודעה במסד. נבדקו כאן על המסך, ולא רק ביחידה.
  test('חוסר-הרשאה (42501) והצעה-שנעלמה (P0002) — שתי הודעות שונות ומובנות', async ({ page }) => {
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'אין הרשאה: נדרשת עריכה על הצעות מחיר לאישור הצעה',
      code: '42501',
    })
    await confirmFirstApproval(page)
    await expect(page.getByRole('alert')).toContainText('הרשאת עריכה')

    await page.unroute('**/rest/v1/rpc/approve_quote_and_create_project*')
    await failRpc(page, 'approve_quote_and_create_project', {
      message: 'הצעה 7 לא נמצאה',
      code: 'P0002',
    })
    await page.reload()
    await confirmFirstApproval(page)
    await expect(page.getByRole('alert')).toContainText('לא נמצאה')
  })

  // ⚠️ **מסלול שלישי, ושונה מבנית מהשניים:** דחייה היא `UPDATE` ישיר על `quotes` ולא RPC
  // (‏`rejectQuote` — מותר כי טריגר-הנעילה מתיר עדכון כל עוד הסטטוס הישן הוא in_progress).
  // לכן ההודעה שתיפגש כאן היא של **טריגר-הנעילה**, ולא של פונקציית-שרת — ניסוח נפרד לגמרי
  // שעד עכשיו נבדק ביחידה בלבד.
  test('דחייה על הצעה שננעלה בינתיים — הודעת טריגר-הנעילה מגיעה מובנת', async ({ page }) => {
    await page.route('**/rest/v1/quotes?*', async (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback()
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'הצעה נעולה: עריכה/מחיקה מותרת רק בסטטוס in_progress (נמצא: approved)',
          code: 'P0001',
        }),
      })
    })

    await page.goto('/quotes')
    const reject = page.getByTestId(/^quote-reject-/).first()
    await expect(reject).toBeVisible({ timeout: 30_000 })
    await reject.click()
    await expect(page.getByTestId('reject-dialog-title')).toBeVisible()
    await page.getByRole('radio', { name: 'מחיר' }).check()
    await page.getByTestId('reject-confirm').click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('נעולה לשינויים')
    await expect(alert).not.toContainText('in_progress')
    await expect(alert).not.toContainText('דחיית ההצעה נכשלה')
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
    await pickQuoteWithHostessLine(page)
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

    // (5) נגישות: התג **מקושר** לבורר, ולא רק מוצג לידו — אחרת המידע קיים רק למי שמסתכל,
    //     ומי שמשתמש בקורא-מסך שומע שם-מוצר רגיל ולא יודע שהוא הושבת.
    const picker = page.getByTestId(/^quote-line-product-/).first()
    const describedBy = await picker.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy}`)).toContainText('מוצר מושבת')
  })

  // ⏸️ **מה שלא נבנה כאן, בכוונה (הכרעת-ישי 31/07):** בדיקת-פריסה למסך צר על התג הזה.
  // המערכת היא כלי-עבודה שולחני, השבתת-מוצר היא אירוע נדיר, והצירוף "מוצר מושבת + מסך
  // צר" הוא מקרה-קצה של מקרה-קצה. הבדיקה הייתה עולה זמן-ריצה בכל סבב עתידי בלי להגן על
  // תרחיש אמיתי. ⛔ לא להוסיף אותה "ליתר ביטחון" בלי שישי יבקש.

  // ⚠️ **הפער שנתפס בצילום ולא בקוד** (31/07 14:55, אחרי ששאל ישי "מה לא בדקת"): הגרסה
  // הראשונה חישבה את רשימת-המוצרים **פעם אחת לכל הטבלה** עם קבוצת כל המק"טים שבשימוש,
  // ולכן המוצר המושבת הופיע כאופציה רגילה **בכל השורות** — כלומר אפשר היה לבחור אותו
  // לשורה חדשה, בניגוד ישיר להכרעת-12/07. הבדיקה נועלת את הכיוון: מותר בשורה שלו, אסור באחרת.
  test('§7.34 — המוצר המושבת מוצע רק בשורה שלו, ולא בשורה אחרת', async ({ page }) => {
    await deactivateProduct(page, HOSTESS_SKU)
    await page.goto(`/quotes/${QUOTE_WITH_HOSTESS_LINE}/edit`)
    await expect(page.getByTestId('quote-lines-table')).toBeVisible({ timeout: 30_000 })

    const pickers = page.getByTestId(/^quote-line-product-/)
    const inactiveName = 'שירותי דיילת (4 שעות)'

    // (א) בשורה שלו — כן, אחרת ה-trigger היה מתרוקן ומוחק ויזואלית מוצר ששמור במסד.
    await pickers.first().click()
    await expect(page.getByRole('option', { name: inactiveName })).toBeVisible()
    await page.keyboard.press('Escape')

    // (ב) בשורה אחרת (שורת התגים) — לא. זו האכיפה בפועל של §7.34.
    await pickers.nth(1).click()
    await expect(page.getByRole('option', { name: inactiveName })).toHaveCount(0)
    // ובקרה שהרשימה אכן נפתחה, כדי ש-0 לא ינבע מכך שכלום לא מוצג.
    await expect(page.getByRole('option', { name: 'שירותי דיילת (6 שעות)' })).toBeVisible()
  })

  test('רגרסיה — בלי יירוט, אין תג-השבתה ואין שינוי במסך', async ({ page }) => {
    await page.goto(`/quotes/${QUOTE_WITH_HOSTESS_LINE}/edit`)
    await expect(page.getByTestId('quote-lines-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId(/^quote-line-inactive-/)).toHaveCount(0)
    await expect(page.getByTestId('quote-lines-error')).toHaveCount(0)
  })
})
