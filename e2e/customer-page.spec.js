import { test, expect } from '@playwright/test'

// E2E עמוד-הלקוח (`/customers/:id`) — נבנה בצעד 3.5 של מודול 3 על משטח מודול 2.
//
// ⚠️ **הוקדם מצעד 4.3 בהכרעת-ישי 30/07/2026** ("מעדיף ללכת בזהירות; בקצב הזה נהיה בסדר בדדליין").
// הנימוק היה קונקרטי ולא זהירות כללית: באותו יום **בדיקת-רגרסיה קיימת תפסה באג אמיתי**
// (מתג-הארכיון שנשבר בשקט כשהסינון עבר לכתובת), בעוד שהמסכים שנבנו באותו יום נותרו בלי
// רשת כזו. החבילה הזו היא הרשת עבורם.
//
// 🧨 מוסכמות שהספק הזה מקפיד עליהן, ואסור לשבור אותן בעריכה עתידית:
// 1. **אפס כתיבות למסד.** אין סביבת-בדיקה נפרדת — יש פרויקט Supabase חי אחד (ר' `src/CLAUDE.md`).
//    מצבים שדורשים דאטה שאינה קיימת נוצרים ב**יירוט תשובת-הרשת**, לא בהזרקת שורות.
// 2. **אזהרת-הארכוב נבדקת בענף "ביטול" בלבד** — הענף שמאשר היה משנה סטטוס של לקוח אמיתי.
// 3. creds מ-`.env.local` דרך `process.env`; חסרים ⇒ `test.skip` בחן (מוסכמת שאר הספים).
//
// 🔄 **03/09/2026 (זריעת-הדגמה של מודול 7, `seed-data-spec.md §7א`):** הפיקסטורות "מדיטק" /
// "עיריית חדרה" ומספריהן (22,503 · 561 · 7,501 · 16,520 · הצעות #10/#11 · `/customers/46`) נמחקו
// עם דמו-יולי בהכרעת-ישי. **אף שם ואף מספר חי אינו נעוץ כאן יותר:** כל בדיקה בוחרת את הלקוח
// שלה בזמן-ריצה לפי התנאי שהיא צריכה (יש הכנסות · יש הצעה פתוחה · יש הצעה דחויה · יש הנחה) —
// דרך המסך כשהוא חושף את התנאי, ודרך REST כמנכ"ל (קריאה בלבד, RLS חל) כשאינו — ומאמתת
// אינווריאנט: אותו סכום בשני מסכים · מונה-לשונית = שורות · פעולה קיימת ⇔ סטטוס. תנאי-קדם
// שאינו מתקיים נופל **ברעש** עם הודעה שאומרת "פיקסטורה", לא "באג" (`e2e/CLAUDE.md`: מכנה-0
// אינו ירוק). מה שלא נחלש: כל טענה שהייתה כאן עדיין נבדקת — על לקוח שנבחר, לא על לקוח שנעוץ.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// סכום ממשי — לא "0 ₪". עמודת-הכסף היחידה ברשימת-הלקוחות היא "סה"כ הצעות מאושרות".
const MONEY = /[1-9][\d,]* ₪/

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// קריאת-REST בזהות המחוברת (הטוקן מה-sessionStorage של האפליקציה, כמו ב-`quotes.spec.js`) —
// לבחירת פיקסטורה לפי תנאי שהמסך אינו חושף. קריאה בלבד; RLS חל בדיוק כמו על המסך.
async function restGet(page, path) {
  return page.evaluate(
    async ({ url, anon, path }) => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
      const token = JSON.parse(sessionStorage.getItem(key)).access_token
      const res = await fetch(`${url}/rest/v1/${path}`, {
        headers: { apikey: anon, Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`REST ${path}: ${res.status}`)
      return res.json()
    },
    { url: SUPABASE_URL, anon: SUPABASE_ANON, path },
  )
}

// לקוח פעיל שיש לו הצעה בסטטוס נתון (ולפי הצורך — סיבת-דחייה של ממש, לא 'פג תוקף', שעליה
// המסך מציג תגית "פגה" במקום שורת-סיבה).
async function customerWithQuote(page, status, { rejectedWithReason = false } = {}) {
  const filters = [`quote_status=eq.${status}`, 'customers.status=eq.active', 'limit=1']
  if (rejectedWithReason) {
    filters.push('rejection_reason=not.is.null')
    filters.push(`rejection_reason=neq.${encodeURIComponent('פג תוקף')}`)
  }
  const rows = await restGet(
    page,
    `quotes?select=customer_id,customers!inner(company_name,status)&${filters.join('&')}`,
  )
  expect(
    rows.length,
    `אין לקוח פעיל עם הצעה ${status} — פיקסטורה חסרה (הזריעה), לא באג`,
  ).toBeGreaterThan(0)
  return { id: rows[0].customer_id, name: rows[0].customers.company_name }
}

// השורה הראשונה ברשימה שמציגה הכנסות ממשיות — מזהה, שם וסכום כפי שהם על המסך.
async function customerRowWithRevenue(page) {
  await page.goto('/customers')
  await expect(page.getByTestId('customers-list-card')).toBeVisible()
  const row = page.locator('[data-testid^="customer-row-"]').filter({ hasText: MONEY }).first()
  await expect(row, 'אין לקוח עם הכנסות ברשימה — פיקסטורה חסרה, לא באג').toBeVisible({
    timeout: 30_000,
  })
  const id = (await row.getAttribute('data-testid')).replace('customer-row-', '')
  const revenue = (await row.innerText()).match(MONEY)[0]
  const [{ company_name: name }] = await restGet(
    page,
    `customers?select=company_name&customer_id=eq.${id}`,
  )
  return { row, id, name, revenue }
}

const tabCount = async (tab) => Number((await tab.innerText()).replace(/[^0-9]/g, ''))

test.describe('עמוד הלקוח (מודול 3 / צעד 3.5) — CEO', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('רשימת הלקוחות: עמודת הכנסות, מיון, והסינון שורד ניווט-חזרה', async ({ page }) => {
    // ההכנסות מחושבות מהצעות מאושרות דרך ה-SSOT של התמחור. הסכום שנקרא כאן מהרשימה הוא
    // מה שהבדיקה הבאה דורשת לראות גם ברצועת-המדדים של העמוד.
    const { name, revenue } = await customerRowWithRevenue(page)

    // מיון בלחיצת-כותרת נכתב לכתובת (ולא ל-state) — זה מה שמאפשר לו לשרוד חזרה.
    // ⚠️ 19/08/2026 (מודול 6 · משטח 8, E3 🟢 RULED): התווית שונתה מ"סה"כ הכנסות" ל"סה"כ
    // הצעות מאושרות" — החישוב לא זז, רק המילה. עודכן כאן כדי שלא לחפש עמודה שכבר לא קיימת.
    await page.getByRole('button', { name: /סה"כ הצעות מאושרות/ }).click()
    await expect(page).toHaveURL(/sort=total_revenue/)

    // 🐞 רגרסיה אמיתית: כשהכרטיס היה חלון, הסינון שרד מעצמו; כעמוד הוא נמחק בכל "חזור".
    // הבדיקה מוודאת את **מצב התיבה אחרי החזרה**, לא רק את הכתובת.
    await page.getByTestId('customers-search').fill(name)
    await expect(page).toHaveURL(/q=/)
    const filteredUrl = page.url()
    const filteredRow = page.locator('tbody tr', { hasText: name }).first()
    await expect(filteredRow).toContainText(revenue)
    await filteredRow.click()
    await expect(page).toHaveURL(/\/customers\/\d+/)
    await page.goBack()
    await expect(page).toHaveURL(filteredUrl)
    await expect(page.getByTestId('customers-search')).toHaveValue(name)
  })

  test('העמוד: מדדים חיים, לשוניות, סיבת-דחייה על השורה, ופעולות לפי סטטוס', async ({ page }) => {
    const { row, revenue } = await customerRowWithRevenue(page)
    await row.click()
    await expect(page.getByTestId('customer-page')).toBeVisible()

    // שלושת המדדים החיים: ההכנסות זהות לרשימה (אותו SSOT, שני מסלולי-שאילתה שונים), ושני
    // האחרים הם סכומי-כסף ולא "—": ממוצע-עסקה קיים כי יש לפחות הצעה מאושרת אחת.
    // ⚠️ עד 03/09/2026 עמדו כאן שלושה מספרים נעוצים (22,503 · 561 · 7,501) שחושבו ביד
    // מהשורות שבמסד — כל שינוי-דאטה לגיטימי הפיל אותם. האינווריאנט חוצה-המסכים תופס את
    // אותו באג (מדד שאינו מחושב מההצעות) בלי לרקוב.
    await expect(page.getByTestId('metric-revenue')).toContainText(revenue)
    await expect(page.getByTestId('metric-open')).toContainText('₪')
    await expect(page.getByTestId('metric-avg-deal')).toContainText(MONEY)

    // מונה-לשונית = שורות שרונדרו — בשתי הלשוניות.
    // 🔴 ההיסטוריה של הטענה על "פרויקטים" שווה לזכור: עד 09/08/2026 היא ציפתה ל-0 **לא כי
    // אין** אלא כי `projects` הייתה deny-all ב-RLS — הבדיקה **שימרה** את החור במקום לתפוס
    // אותו, ורק מיגרציה `20260809134237` (policy-קריאה על 'פרויקטים') הפילה אותה. לכן כאן
    // גם אסרשן-מכנה: ללקוח עם הצעה מאושרת חייב להיות פרויקט; 0 = policy חסרה, לא "אין".
    const quoteRows = page.locator('tr[data-testid^="customer-quote-"]')
    await expect(quoteRows.first()).toBeVisible()
    expect(await quoteRows.count()).toBe(await tabCount(page.getByTestId('customer-tab-quotes')))
    const projectsTab = page.getByTestId('customer-tab-projects')
    const projectCount = await tabCount(projectsTab)
    expect(
      projectCount,
      'ללקוח עם הצעה מאושרת אין פרויקטים — policy-הקריאה על projects חסרה?',
    ).toBeGreaterThan(0)
    await projectsTab.click()
    await expect(
      page.locator('[data-testid^="customer-project-"]:not([data-testid*="-link-"])'),
    ).toHaveCount(projectCount)

    // ארבע פעולות על הצעה בתהליך · צפייה בלבד על סגורה (הסגורות נעולות ב-DB ממילא).
    // **חובה שזו תהיה הצעה `in_progress` אמיתית** — על סגורה שלוש האסרציות היו עוברות
    // ריקות מתוכן, וזה בדיוק "שומר שלא נצפה נכשל". הלקוח נבחר לפי התנאי הזה, וכפתור-האישור
    // מרונדר **רק** על `in_progress` — הופעתו היא ההגדרה המדויקת של "פתוחה".
    // ⚠️ ולמה לא מזהה: `ימי_תוקף_הצעה`=30 והעבודה `module3-quote-expiry` מעבירה הצעות ישנות
    // ל-`rejected` — הצעה נעוצה הייתה מפילה את הטענות בלי שאיש נגע בקוד. *(`🚧 מ6 ← מ3`.)*
    const open = await customerWithQuote(page, 'in_progress')
    await page.goto(`/customers/${open.id}`)
    await expect(page.getByTestId('customer-page')).toBeVisible()
    const openApprove = page.getByTestId(/^customer-quote-approve-/).first()
    await expect(
      openApprove,
      'ללקוח שנבחר אין כפתור-אישור למרות הצעה בתהליך — זה באג, לא פיקסטורה',
    ).toBeVisible()
    const openId = (await openApprove.getAttribute('data-testid')).replace(
      'customer-quote-approve-',
      '',
    )
    await expect(page.getByTestId(`customer-quote-edit-${openId}`)).toBeVisible()
    await expect(page.getByTestId(`customer-quote-reject-${openId}`)).toBeVisible()
    // ועל כל שורה שאינה "בתהליך" — אין כפתור-אישור. (הטענה "‏#10 סגורה ⇒ אין אישור" הפכה לכלל.)
    const closedRows = page
      .locator('tr[data-testid^="customer-quote-"]')
      .filter({ hasNotText: 'בתהליך' })
    const closedCount = await closedRows.count()
    for (let i = 0; i < closedCount; i++) {
      const id = (await closedRows.nth(i).getAttribute('data-testid')).replace(
        'customer-quote-',
        '',
      )
      await expect(page.getByTestId(`customer-quote-approve-${id}`)).toHaveCount(0)
    }

    // סיבת-הדחייה **חייבת** לשבת על השורה: כפתור-העין פותח את ה-PDF שהלקוח מקבל,
    // ובו אין (ונכון שאין) סיבת-דחייה — כלומר זה המקום היחיד שבו היא נגישה.
    const rejected = await customerWithQuote(page, 'rejected', { rejectedWithReason: true })
    await page.goto(`/customers/${rejected.id}`)
    await expect(page.getByTestId('customer-page')).toBeVisible()
    await expect(page.getByText('סיבת דחייה:').first()).toBeVisible()
  })

  test('"+ הצעה חדשה" פותח טופס עם הלקוח **וההנחה שלו** — לא רק מנווט', async ({ page }) => {
    // 🐞 הבאג שהספק הזה קיים בשבילו: הכפתור ניווט למסך הנכון ו**הפיל את הלקוח**, כי
    // מסך-הבנייה לא קרא את הכתובת כלל. בדיקה שמאמתת "הכפתור מוצג" הייתה עוברת בירוק.
    // הלקוח נבחר לפי התנאי שהטענה השנייה צריכה: פעיל, עם הנחה קבועה > 0.
    const rows = await restGet(
      page,
      'customers?select=customer_id,company_name,discount_percent&status=eq.active&discount_percent=gt.0&limit=1',
    )
    expect(rows.length, 'אין לקוח פעיל עם הנחה — פיקסטורה חסרה, לא באג').toBeGreaterThan(0)
    const { customer_id: id, company_name: name, discount_percent: discount } = rows[0]
    await page.goto(`/customers/${id}`)
    await page.getByTestId('customer-new-quote').click()
    await expect(page).toHaveURL(new RegExp(`/quotes/new\\?customerId=${id}`))
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
    // ⚠️ ההנחה נצבעת יחד עם הבחירה (F12) — בלעדיה נוצרת הצעה ב-0% ללקוח שהנחתו N%, בשקט.
    await expect(page.getByText(new RegExp(`${Number(discount)}%`)).first()).toBeVisible()
  })

  test('חלון המסמך מעמוד-הלקוח מפיק PDF תקין (הזרקת פרטי הלקוח עובדת)', async ({ page }) => {
    const { id } = await customerRowWithRevenue(page)
    await page.goto(`/customers/${id}`)
    await page
      .getByTestId(/^customer-quote-document-/)
      .first()
      .click()
    await expect(page.locator('iframe[src^="blob:"]')).toBeVisible({ timeout: 20_000 })

    // ⚠️ נבדק על ה**בייטים** ולא על צילום-מסך: ה-iframe ריק בכרומיום של Playwright (אין
    // מציג-PDF מובנה) — תכונת-סביבה ולא באג. `listQuotesByCustomer` אינה מצרפת `customers`,
    // ולכן מסמך תקין כאן הוא ההוכחה שהעמוד מזריק את הלקוח שכבר טען.
    const pdf = await page.evaluate(async () => {
      const res = await fetch(document.querySelector('iframe[src^="blob:"]').src)
      const buf = await res.arrayBuffer()
      return {
        bytes: buf.byteLength,
        isPdf: new TextDecoder('latin1').decode(buf).startsWith('%PDF'),
      }
    })
    expect(pdf.isPdf).toBe(true)
    expect(pdf.bytes).toBeGreaterThan(20_000)
  })

  test('§7.34 — ארכוב לקוח עם הצעה פתוחה מתריע, ו"ביטול" באמת לא מארכב', async ({ page }) => {
    // ⚠️ תנאי-מוקדם: לקוח **פעיל** עם הצעה פתוחה — נבחר לפי התנאי, לא בשם. כשל של
    // השורה הבאה פירושו כמעט תמיד **שדאטת-הדגמה סטתה** (למשל לקוח שנשאר מארכב מריצה
    // קודמת — קרה בפועל 30/07/2026, מספק-בדיקה זמני שארכב ולא שחזר) ולא שהפיצ'ר נשבר.
    const open = await customerWithQuote(page, 'in_progress')
    await page.goto('/customers')
    await page.getByTestId('customers-search').fill(open.name)
    const row = page.getByTestId(`customer-row-${open.id}`)
    await expect(row, 'הלקוח עם ההצעה הפתוחה אינו ברשימת הפעילים').toBeVisible()
    // ⚠️ ממתינים שנתוני-ההצעות ייטענו (הבקשה השנייה) **לפני** הלחיצה — אחרת נבדק ענף
    // "טרם ידוע" במקום ענף "יש הצעות פתוחות". עמודת ההכנסות היא הסימן שהמפה הגיעה.
    await expect(row.getByText('₪')).toBeVisible()
    await row.getByTitle('העבר לארכיון').click()

    const dialog = page.getByTestId('confirm-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/פתוח/)
    await expect(dialog).toContainText('₪')

    // ⚠️ העיקר: לא שהחלון **נראה**, אלא שהוא **עוצר**. חלון יפה שמארכב בכל מקרה הוא
    // בדיוק סוג הכשל שאזהרה אמורה למנוע. אין כאן ענף-אישור — הוא היה משנה דאטה אמיתית.
    await dialog.getByRole('button', { name: 'ביטול' }).click()
    await expect(dialog).toBeHidden()
    await expect(row.getByText('פעיל', { exact: true })).toBeVisible()
  })
})

// 🎯 שני השערים הנפרדים של העמוד — הבדיקה שהתכנון כולו נבנה בשבילה.
// מנהלת הכספים היא `edit` על 'לקוחות' אבל **`view` בלבד** על 'הצעות מחיר' (אומת מול המסד),
// ולכן היא הראיה היחידה ששער-יחיד לעמוד לא היה מספיק.
// ⚠️ המשתמשת `finance.test@regin.co.il` **קיימת ופעילה במסד**; מה שחסר הוא רק הסיסמה
// ב-`.env.local` (‏`E2E_FINANCE_EMAIL` + `E2E_FINANCE_PASSWORD`). עד שתתווסף — הבדיקה
// מדלגת בחן ומצהירה על כך, ולא מתחזה לכיסוי שאינו קיים.
test.describe('עמוד הלקוח — מנהלת כספים (edit על לקוחות, view על הצעות)', () => {
  const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
  const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD,
    'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו ב-.env.local — ענף שתי-ההרשאות לא נבדק',
  )

  test('רואה את העמוד ועריכת-פרטים, ולא רואה אישור/דחייה/הצעה-חדשה', async ({ page }) => {
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    // `view` על הצעות מספיק ל-REST-קריאה ⇒ אותו בורר-פיקסטורה כמו אצל המנכ"ל.
    const open = await customerWithQuote(page, 'in_progress')
    await page.goto(`/customers/${open.id}`)
    await expect(page.getByTestId('customer-page')).toBeVisible()

    // 'לקוחות' = edit ⇒ עריכת פרטים מותרת לה.
    await expect(page.getByTestId('customer-edit')).toBeVisible()
    // 'הצעות מחיר' = view ⇒ צפייה במסמך כן, פעולות-כתיבה לא.
    // 🔄 שוכתב 27/08/2026 (אודיט-סגירת-מ5, אשרור-ישי): הגרסה הקודמת ננעצה ל-#22, וקרון-
    // התפוגה היה הופך את שלושת ה-toHaveCount(0) לירוקים-על-כלום סביב 31/08 — על הצעה
    // סגורה *לאיש* אין פעולות. האינווריאנט: הנושא נבחר בזמן-ריצה — כל הצעה *פתוחה*
    // ("בתהליך"), שאצל בעלת-edit כן נושאת פעולות — ואסרשן-המכנה מבטיח שהמדידה רצה
    // (מכנה-0 אינו ירוק — e2e/CLAUDE.md).
    await expect(page.getByTestId(/^customer-quote-document-/).first()).toBeVisible()
    const openRows = page.locator('tr[data-testid^="customer-quote-"]', { hasText: 'בתהליך' })
    const openCount = await openRows.count()
    expect(
      openCount,
      'אין הצעה פתוחה על עמוד הלקוח שנבחר לפי התנאי הזה — סתירה בין REST למסך, לא פיקסטורה',
    ).toBeGreaterThan(0)
    for (let i = 0; i < openCount; i++) {
      const rowTestId = await openRows.nth(i).getAttribute('data-testid')
      const quoteId = rowTestId.replace('customer-quote-', '')
      await expect(page.getByTestId(`customer-quote-approve-${quoteId}`)).toHaveCount(0)
      await expect(page.getByTestId(`customer-quote-reject-${quoteId}`)).toHaveCount(0)
      await expect(page.getByTestId(`customer-quote-edit-${quoteId}`)).toHaveCount(0)
    }
    await expect(page.getByTestId('customer-new-quote')).toHaveCount(0)
  })
})

test.describe('עמוד הלקוח — תפקיד חסום', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  test('כתובת ישירה ל-/customers/:id נחסמת (המסלול עטוף ב-ProtectedRoute)', async ({ page }) => {
    // ⚠️ מסלול תחת MainLayout **בלי** עטיפת-הרשאה גלוי לכל משתמש מחובר — בלי lint, בלי
    // אזהרה, בלי כשל-בדיקה (`src/CLAUDE.md`). לכן העטיפה נבדקת ולא מונחת.
    // המזהה אינו נקרא מעולם — השומר חוסם לפני שהעמוד טוען דבר — ולכן אינו פיקסטורה.
    const ANY_ID = 1
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await page.goto(`/customers/${ANY_ID}`)
    await expect(page.getByTestId('customer-page')).toHaveCount(0)
    await expect(page.getByText(/אין לך הרשאה|אין הרשאה/)).toBeVisible({ timeout: 10_000 })
  })
})
