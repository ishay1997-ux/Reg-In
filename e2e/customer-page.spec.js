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

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD

// מדיטק [דמו] — הלקוחה היחידה עם הצעה מאושרת, ולכן היחידה שמדדיה אינם אפס.
const MEDITECH = 'מדיטק'
// עיריית חדרה [דמו] — 0 הכנסות אבל הצעה פתוחה גדולה: הלקוחה שמוכיחה שהאזהרה מופיעה.
const HADERA = 'עיריית חדרה'

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

test.describe('עמוד הלקוח (מודול 3 / צעד 3.5) — CEO', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('רשימת הלקוחות: עמודת הכנסות, מיון, והסינון שורד ניווט-חזרה', async ({ page }) => {
    await page.goto('/customers')
    await expect(page.getByTestId('customers-list-card')).toBeVisible()

    // ההכנסות מחושבות מהצעות מאושרות דרך ה-SSOT של התמחור.
    // ↳ 01/08/2026 (צעד 5.1): ר' ההערה המלאה בבדיקה שלמטה — הצעה #21 אושרה, ההכנסות עלו.
    // ↳ 04/08/2026: **גם #6 אושרה מאז**, וההכנסות עלו שוב ל-22,503 ₪ (ר' ההערה שלמטה).
    await expect(page.locator('tbody tr', { hasText: MEDITECH }).first()).toContainText('22,503')

    // מיון בלחיצת-כותרת נכתב לכתובת (ולא ל-state) — זה מה שמאפשר לו לשרוד חזרה.
    await page.getByRole('button', { name: /סה"כ הכנסות/ }).click()
    await expect(page).toHaveURL(/sort=total_revenue/)

    // 🐞 רגרסיה אמיתית: כשהכרטיס היה חלון, הסינון שרד מעצמו; כעמוד הוא נמחק בכל "חזור".
    // הבדיקה מוודאת את **מצב התיבה אחרי החזרה**, לא רק את הכתובת.
    await page.getByTestId('customers-search').fill(MEDITECH)
    await expect(page).toHaveURL(/q=/)
    const filteredUrl = page.url()
    await page.locator('tbody tr', { hasText: MEDITECH }).first().click()
    await expect(page).toHaveURL(/\/customers\/\d+/)
    await page.goBack()
    await expect(page).toHaveURL(filteredUrl)
    await expect(page.getByTestId('customers-search')).toHaveValue(MEDITECH)
  })

  test('העמוד: מדדים חיים, לשוניות, סיבת-דחייה על השורה, ופעולות לפי סטטוס', async ({ page }) => {
    await page.goto('/customers')
    await page.locator('tbody tr', { hasText: MEDITECH }).first().click()
    await expect(page.getByTestId('customer-page')).toBeVisible()

    // שלושת המדדים החיים. 6,319 ₪ הוא תרחיש-האפיון המחייב של המודול.
    // ↳ 01/08/2026 (צעד 5.1): הצעה #21 נבנתה ואושרה חי דרך המסך כתרחיש-הקבלה המחייב —
    // מדיטק עברה מהצעה מאושרת אחת (#10, 9,865 ₪) לשתיים (#10+#21, 16,184 ₪).
    // ↳ 04/08/2026: **גם #6 אושרה מאז** (6,319 ₪) ⇒ שלוש מאושרות, 22,503 ₪, ממוצע 7,501.
    // ההצעה הפתוחה היחידה שנותרה למדיטק היא #22 ("אימות שמור-ושלח", שורת-דיילות אחת
    // ב-500 ₪ ⇒ 5% הנחת-לקוח ⇒ 475 ⇒ 18% מע"מ ⇒ **561 ₪** בעיגול-לשלם).
    // ⚠️ שלושת המספרים חושבו כאן **מהשורות שבמסד דרך נוסחת `computeQuoteTotals`** ואז
    // הוצלבו מול המסך — לא הועתקו מתוך הכשל. אותו כלל כמו הפעם הקודמת: הנתון השתנה
    // בצדק, מעדכנים את המספר ולא מרככים את הטענה.
    await expect(page.getByTestId('metric-revenue')).toContainText('22,503')
    await expect(page.getByTestId('metric-open')).toContainText('561')
    await expect(page.getByTestId('metric-avg-deal')).toContainText('7,501')

    // ⚠️ 3 ולא 2 — הצעה #21 (צעד 5.1, 01/08/2026) נוספה חי דרך המסך על השתיים שנותרו אחרי
    // ניקוי 3.7. אותו כלל כמו התיעוד הקודם כאן: הנתון השתנה בצדק, מעדכנים את המספר ולא
    // מרככים את הטענה (אותו כלל שכתוב בראש smoke-anchors.json).
    // ↳ 04/08/2026: 4 — הצעה #22 ("אימות שמור-ושלח") נוספה ב-01/08.
    // ↳ 🔴 09/08/2026: **"פרויקטים" עבר מ-0 ל-3 — וזה תיקון, לא רגרסיה.**
    // הערת-הבדיקה הקודמת כאן ניסחה את זה במפורש: *"נשאר 0 **לא כי אין** (#10/#21/#6 ילדו
    // פרויקטים) אלא כי `projects` היא deny-all ב-RLS — אפס policies, ולכן הלקוח מקבל
    // רשימה ריקה בלי שגיאה"*. כלומר הטענה **קיבעה תקלה כציפייה**, ותיעדה זאת ביושר.
    // מיגרציה `20260809134237` (מודול 4) הוסיפה `projects_select_by_permission` על מודול
    // 'פרויקטים' — ‏`spec.md §12②` דורש אותה, אחרת המסך הראשון של מ4 חוזר ריק לכולם.
    // ⇒ המנכ"ל (edit על 'פרויקטים') רואה עכשיו את שלושת הפרויקטים של מדיטק (3 · 7 · 8),
    // ‏**אומת ישירות במסד**, לא הועתק מתוך הכשל.
    // 🔑 ולמה זו דוגמה שכדאי לזכור: בדיקה שהייתה ירוקה **בזכות** policy חסרה. היא לא
    // תפסה את החור — היא **שימרה** אותו, ורק תיקון החור הפיל אותה.
    await expect(page.getByTestId('customer-tab-quotes')).toContainText('4')
    await expect(page.getByTestId('customer-tab-projects')).toContainText('3')

    // ארבע פעולות על הצעה בתהליך · צפייה בלבד על סגורה (הסגורות נעולות ב-DB ממילא).
    // ⚠️ ההצעה-הפתוחה עברה מ-#6 ל-#22 (‏04/08/2026): #6 אושרה, ולכן היא כבר אינה המקרה
    // שהטענה הזו בודקת. **חובה שזו תהיה הצעה `in_progress` אמיתית** — על סגורה שלוש
    // האסרציות היו עוברות ריקות מתוכן, וזה בדיוק "שומר שלא נצפה נכשל".
    await expect(page.getByTestId('customer-quote-edit-22')).toBeVisible()
    await expect(page.getByTestId('customer-quote-approve-22')).toBeVisible()
    await expect(page.getByTestId('customer-quote-reject-22')).toBeVisible()
    await expect(page.getByTestId('customer-quote-approve-10')).toHaveCount(0)

    // סיבת-הדחייה **חייבת** לשבת על השורה: כפתור-העין פותח את ה-PDF שהלקוח מקבל,
    // ובו אין (ונכון שאין) סיבת-דחייה — כלומר זה המקום היחיד שבו היא נגישה.
    // ⚠️ הטענה עברה ממדיטק לעיריית חדרה **כי למדיטק אין יותר הצעה דחויה** אחרי
    // הניקוי. הכיסוי נשמר במלואו — לא נמחקה טענה, היא עברה ללקוח שיש לו את הנתון.
    await page.goto('/customers')
    await page.locator('tbody tr', { hasText: HADERA }).first().click()
    await expect(page.getByTestId('customer-page')).toBeVisible()
    await expect(page.getByTestId('customer-quote-11')).toContainText('תקציב לקוח')
  })

  test('"+ הצעה חדשה" פותח טופס עם הלקוח **וההנחה שלו** — לא רק מנווט', async ({ page }) => {
    // 🐞 הבאג שהספק הזה קיים בשבילו: הכפתור ניווט למסך הנכון ו**הפיל את הלקוח**, כי
    // מסך-הבנייה לא קרא את הכתובת כלל. בדיקה שמאמתת "הכפתור מוצג" הייתה עוברת בירוק.
    await page.goto('/customers/46')
    await page.getByTestId('customer-new-quote').click()
    await expect(page).toHaveURL(/\/quotes\/new\?customerId=46/)
    await expect(page.getByText('מדיטק פתרונות')).toBeVisible({ timeout: 15_000 })
    // ⚠️ ההנחה נצבעת יחד עם הבחירה (F12) — בלעדיה נוצרת הצעה ב-0% ללקוח שהנחתו 5%, בשקט.
    await expect(page.getByText(/5%/).first()).toBeVisible()
  })

  test('חלון המסמך מעמוד-הלקוח מפיק PDF תקין (הזרקת פרטי הלקוח עובדת)', async ({ page }) => {
    await page.goto('/customers/46')
    await page.getByTestId('customer-quote-document-10').click()
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
    // ⚠️ תנאי-מוקדם: "עיריית חדרה" **פעילה** ויש לה הצעה פתוחה אחת (14,000 בסיס, בלי
    // הנחות, מע"מ 18% ⇒ 16,520 ₪). כשל של השורה הבאה פירושו כמעט תמיד **שדאטת-הדמו סטתה**
    // ולא שהפיצ'ר נשבר — למשל לקוחה שנשארה מארכבת מריצה קודמת. השחזור:
    // `node scripts/demo-seed.mjs --reset`. קרה בפועל 30/07/2026, מספק-בדיקה זמני שארכב
    // ולא שחזר — ומכאן ההקפדה שהחבילה הזו נוגעת רק בענף-הביטול.
    await page.goto('/customers')
    const row = page.locator('[data-testid^="customer-row-"]', { hasText: HADERA })
    await expect(row, 'עיריית חדרה אינה ברשימת הפעילים — בדוק אם נשארה מארכבת').toBeVisible()
    // ⚠️ ממתינים שנתוני-ההצעות ייטענו (הבקשה השנייה) **לפני** הלחיצה — אחרת נבדק ענף
    // "טרם ידוע" במקום ענף "יש הצעות פתוחות". עמודת ההכנסות היא הסימן שהמפה הגיעה.
    await expect(row.getByText('₪')).toBeVisible()
    await row.getByTitle('העבר לארכיון').click()

    const dialog = page.getByTestId('confirm-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('הצעה פתוחה אחת')
    await expect(dialog).toContainText('16,520')

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
    await page.goto('/customers/46')
    await expect(page.getByTestId('customer-page')).toBeVisible()

    // 'לקוחות' = edit ⇒ עריכת פרטים מותרת לה.
    await expect(page.getByTestId('customer-edit')).toBeVisible()
    // 'הצעות מחיר' = view ⇒ צפייה במסמך כן, פעולות-כתיבה לא.
    // ⚠️ ‏#22 ולא #6 (‏04/08/2026): #6 אושרה, ועל הצעה סגורה **לאיש** אין שלוש הפעולות
    // האלה — כלומר שלושת ה-`toHaveCount(0)` היו עוברים גם אילו שער-ההרשאה נשבר לגמרי.
    // הטענה כאן היא על ההרשאה, ולכן היא חייבת לרוץ על הצעה שלמנכ"ל **כן** יש בה פעולות.
    await expect(page.getByTestId('customer-quote-document-10')).toBeVisible()
    await expect(page.getByTestId('customer-quote-approve-22')).toHaveCount(0)
    await expect(page.getByTestId('customer-quote-reject-22')).toHaveCount(0)
    await expect(page.getByTestId('customer-quote-edit-22')).toHaveCount(0)
    await expect(page.getByTestId('customer-new-quote')).toHaveCount(0)
  })
})

test.describe('עמוד הלקוח — תפקיד חסום', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  test('כתובת ישירה ל-/customers/:id נחסמת (המסלול עטוף ב-ProtectedRoute)', async ({ page }) => {
    // ⚠️ מסלול תחת MainLayout **בלי** עטיפת-הרשאה גלוי לכל משתמש מחובר — בלי lint, בלי
    // אזהרה, בלי כשל-בדיקה (`src/CLAUDE.md`). לכן העטיפה נבדקת ולא מונחת.
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await page.goto('/customers/46')
    await expect(page.getByTestId('customer-page')).toHaveCount(0)
    await expect(page.getByText(/אין לך הרשאה|אין הרשאה/)).toBeVisible({ timeout: 10_000 })
  })
})
