import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// צעד 4.3 (31/07/2026) — **החוב מ-3.4: מסלול-המייל מקבל סוף-סוף בדיקה קבועה.**
//
// עד היום המסלול נבדק בחמש חבילות **זמניות** שנמחקו אחרי השימוש (מטריצת-ה-QA של המודול
// אומרת זאת במפורש), כלומר אפס רשת-ביטחון על השרשרת שמוציאה מסמך ללקוח אמיתי.
//
// ⛔ **אף בדיקה כאן אינה שולחת מייל.** הקריאה ל-`send-email` מיורטת בכל מסלולי-ההצלחה;
// המסלול היחיד שמגיע לשרת באמת הוא זה שחייב **להידחות** (מנהלת-כספים), ובקרת-החיוב שלו
// נבנתה כך שגם היא נופלת לפני מודול-הדואר — ר' ההערה שם.
// ══════════════════════════════════════════════════════════════════════════════════════

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// ⚠️ נמדד חי 31/07/2026. #6 היא **ההצעה היחידה שיש לה שורת-שליחה אמיתית ב-`email_log`**
// (נשלחה 30/07 ל-ron@meditech-demo.co.il) — ולכן היא זו שמוכיחה את חיווי "כבר נשלח".
// #7 (עיריית חדרה, sarit@hadera-demo.muni.il) נקייה מיומן ⇒ מסלול-שליחה בלחיצה אחת.
const SENT_QUOTE_ID = 6
const SENT_RECIPIENT = 'ron@meditech-demo.co.il'
const CLEAN_QUOTE_ID = 7
const CLEAN_RECIPIENT = 'sarit@hadera-demo.muni.il'

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

async function openDocumentDialog(page, quoteId) {
  await page.goto('/quotes')
  await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })
  await page.getByTestId(`quote-document-${quoteId}`).click()
  await expect(page.getByTestId('quote-document-title')).toBeVisible()
  // הכפתור נדלק רק אחרי שה-PDF נבנה בפועל — לחיצה לפני כן היא no-op שקט.
  await expect(page.getByTestId('quote-document-send')).toBeEnabled({ timeout: 30_000 })
}

test.describe('שליחת ההצעה במייל — החוזה מול השרת (חוב 3.4)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('שמונה השדות יוצאים — והמצורף הוא PDF אמיתי, לא מחרוזת שנראית כמו קובץ', async ({
    page,
  }) => {
    let body = null
    await page.route('**/functions/v1/send-email', async (route) => {
      body = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await openDocumentDialog(page, CLEAN_QUOTE_ID)
    await page.getByTestId('quote-document-send').click()
    await expect(page.getByTestId('toast-success')).toBeVisible()

    // חמשת שדות-החוזה מול מבנה-הנתונים `regin-quote` ב-Make. שדה שישתנה כאן בלי שינוי
    // מקביל שם פשוט **לא יגיע למייל, בלי שגיאה** — ולכן הם ננעלים בשמם.
    // ⚠️ **שמות-החוט, לא שמות-הקוד.** ‏`buildEmailPayload` מקבל `attachmentBase64` ופולט
    // ‏`pdf_base64` — וזה האחרון הוא מה ש-Make מכיר. הבדיקה נכתבה בטעות על שם-הקוד ונפלה,
    // וזו בדיוק הטעות שהיא נועדה לתפוס אצל מי שיוסיף שדה בעתיד.
    expect(body.to).toBe(CLEAN_RECIPIENT)
    expect(body.subject).toBeTruthy()
    expect(body.filename).toContain('.pdf')
    expect(body.pdf_base64).toBeTruthy()

    // 🔄 גוף-המייל חייב לצאת עטוף בכיווניות — **מופע חמישי** של באג-הכיווניות, והראשון
    // מחוץ למסך: גוף עברי שנשלח כ-HTML בלי `dir="rtl"` מוצג LTR אצל הלקוח והפיסוק נוחת
    // בצד הלא-נכון. תקינות ה-PDF אינה מעידה על תקינות המייל שנושא אותו.
    expect(body.body).toContain('rtl')

    // ⚠️ ושלושת שדות-המטא, שאינם חלק מחוזה-Make אלא של היומן שלנו: ל-`email_log.entity_id`
    // יש NOT NULL, ובלעדיהם **המייל יוצא והיומן נשאר ריק** — כלומר ההגנה מפני שליחה-כפולה
    // מפסיקה להתקיים בלי שאיש רואה שגיאה. זה קרה בפועל באימות מקצה-לקצה ב-30/07.
    expect(body.entity_type).toBe('quote')
    expect(body.entity_id).toBe(CLEAN_QUOTE_ID)
    expect(body.template_name).toBeTruthy()

    // 🔬 **המצורף נבדק בבייטים ולא בסיומת** — הלקח מ-3.4: Gmail מדווח `application/pdf`
    // לפי שם-הקובץ גם כשהתוכן זבל. `JVBERi0` הוא base64 של `%PDF-`.
    expect(body.pdf_base64.startsWith('JVBERi0')).toBe(true)
    expect(body.pdf_base64.length).toBeGreaterThan(10_000)
  })

  test('המייל יצא אך היומן נכשל — נאמר בקול ולא נקבר בקונסול', async ({ page }) => {
    await page.route('**/functions/v1/send-email', async (route) => {
      // ⚠️ `ok:true` בכוונה: המייל **כבר אצל הלקוח**, ולכן זו אינה שגיאת-שליחה. מה שמת
      // הוא ההגנה מפני שליחה-כפולה — ועד 31/07 זה חי רק ב-console של פונקציית-השרת.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, log_failed: true }),
      })
    })

    await openDocumentDialog(page, CLEAN_QUOTE_ID)
    await page.getByTestId('quote-document-send').click()

    await expect(page.getByTestId('quote-send-check-notice')).toBeVisible()
    await expect(page.getByTestId('toast-error')).toBeVisible()
  })

  test('הקריאה מתה באמצע — "לא ידוע", ולא "נכשל"', async ({ page }) => {
    // ⚠️ ההבחנה הזו היא לב העניין: "נכשל" גורם למשתמש לשלוח שוב, והלקוח מקבל את ההצעה
    // פעמיים. כשאין אישור — אומרים "לא ידוע" ומפנים לבדוק **לפני** ניסיון חוזר.
    await page.route('**/functions/v1/send-email', (route) => route.abort())

    await openDocumentDialog(page, CLEAN_QUOTE_ID)
    await page.getByTestId('quote-document-send').click()

    const err = page.getByTestId('quote-send-error')
    await expect(err).toBeVisible()
    // 🔒 חוזה: הניסוח חי ב-`src/lib/email.js` (`sendResultMessage`) ונבדק שם ביחידה;
    // כאן נבדק שה**מצב הנכון** נבחר — "לא התקבל אישור" ולא "לא נשלחה".
    await expect(err).toContainText('לא התקבל אישור')
    await expect(err).not.toContainText('ההצעה לא נשלחה')
  })

  test('חיווי "כבר נשלח" מגיע מהיומן במסד — ולכן שורד רענון-דף', async ({ page }) => {
    // ⚠️ אין כאן שום יירוט: זו שורת-`email_log` **אמיתית** מ-30/07. שלוש שכבות-ההגנה
    // האחרות חיות ב-state של הקומפוננטה ומתות ברענון; זו היחידה ששורדת — וגם מגיעה
    // למשתמש שני שפותח את אותה הצעה במחשב אחר.
    await openDocumentDialog(page, SENT_QUOTE_ID)
    await expect(page.getByTestId('quote-previous-send')).toContainText(SENT_RECIPIENT)

    await page.reload()
    await openDocumentDialog(page, SENT_QUOTE_ID)
    await expect(page.getByTestId('quote-previous-send')).toContainText(SENT_RECIPIENT)

    // ובקרת-חיוב: על הצעה שלא נשלחה, אותו חיווי **אינו** מוצג — אחרת הבדיקה עוברת
    // גם על מסך שמציג "כבר נשלח" לכולם.
    await page.getByTestId('quote-document-title').press('Escape')
    await openDocumentDialog(page, CLEAN_QUOTE_ID)
    await expect(page.getByTestId('quote-previous-send')).toHaveCount(0)
  })
})

test.describe('פונקציית-השרת דוחה בעצמה — לא הכפתור המוסתר (חוב 3.4)', () => {
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD || !CEO_EMAIL || !CEO_PASSWORD,
    'חסרים E2E_FINANCE_* או E2E_CEO_* ב-.env.local',
  )

  // קריאה ישירה ל-Edge Function מתוך הדפדפן המחובר, עם ה-JWT של המשתמשת.
  async function callSendEmail(page, payload) {
    return page.evaluate(
      async ({ url, anon, body }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const res = await fetch(`${url}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        return { status: res.status, body: await res.json().catch(() => null) }
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON, body: payload },
    )
  }

  test('מנהלת כספים (view) נדחית ב-403 מהשרת עצמו', async ({ page }) => {
    // §7.82/F19: שליחת מסמך ללקוח היא פעולת-`edit`. מנהלת-כספים היא `view` על
    // 'הצעות מחיר' — ולכן הכפתור מוסתר ממנה; זו הבדיקה שהחומה קיימת **גם בלעדיו**.
    // ⚠️ המסלול הזה נבנה **שגוי פעם אחת** (מדיניות `permissions_select_all` היא
    // `using(true)`, כלומר סינון לפי מודול בלבד מחזיר את כל 45 השורות והבדיקה קורסת).
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const denied = await callSendEmail(page, {})
    expect(denied.status).toBe(403)
    // 🔒 חוזה: הניסוח המילולי של `send-email` בדחיית-הרשאה.
    expect(denied.body?.error).toContain('אין לך הרשאה')
  })

  test('בקרת-חיוב: אותה קריאה בדיוק כמנכ"ל נופלת ב-400 — כלומר השער עבר, ואף מייל לא יצא', async ({
    page,
  }) => {
    // ⚠️ בלי הבדיקה הזו, ה-403 שלמעלה יכול לנבוע מהגוף הריק ולא מהתפקיד.
    // 🔒 **וזו הסיבה שהגוף ריק דווקא:** בפונקציה שער-ההרשאה רץ **לפני** קריאת גוף-הבקשה
    // (`index.ts` — 403 בשורה 71, ואימות-השדות רק בשורה 84). כלומר קריאה של מנכ"ל עם גוף
    // ריק עוברת את השער ונופלת על "חסרים נתונים" — **לפני מודול-הדואר**. אין מסלול
    // שבו הבדיקה הזו שולחת מייל לאיש.
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const passed = await callSendEmail(page, {})
    expect(passed.status).toBe(400)
    expect(passed.status).not.toBe(403)
    expect(passed.body?.error).toContain('חסרים נתונים')
  })
})
