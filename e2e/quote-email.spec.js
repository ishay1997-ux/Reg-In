import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

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

// ⚠️ **נמדד מחדש חי 04/08/2026 — שתי ההצעות שהיו כאן חדלו להתאים, וכל אחת מסיבה אחרת.**
//
// (א) ‏#6 הייתה "ההצעה עם שורת-היומן"; מאז היא **אושרה**, ו-`isQuoteSendable` מחזיר
//     ‏`in_progress` בלבד ⇒ אין בחלון שלה כפתור-שליחה כלל. ‏**#22** ירשה אותה: `in_progress`
//     ויש לה שורות-`email_log` אמיתיות מ-01/08.
// (ב) ‏#7 (עיריית חדרה) עדיין פתוחה ונקייה מיומן — אבל **כתובת הלקוח שלה הוחלפה
//     ב-01/08 לכתובת פרטית אמיתית** (הכרעת-ישי, כדי לקבל את המיילים לתיבה שלו).
//     ‏**קובץ-בדיקה נכנס לגיט לצמיתות ⇒ אסור שתופיע בו כתובת אמיתית.** לכן הנמען-הקבוע
//     עבר להצעה **#8** (הייטק גרופ), שנשארה על דומיין-דמו.
//
// 🔒 ו-`SENT_RECIPIENT` **אינו קבוע יותר** — הוא נקרא מ-`email_log` בזמן ריצה, ולכן הכתובת
// אינה נכנסת לגיט וגם לא תתיישן שוב.
// ⚠️ **ומה שהוא לא מוכיח, במפורש:** אצל #22 נמען-היומן וכתובת-הלקוח **זהים**, ולכן
// האסרציה הזו לבדה אינה מבחינה בין "החיווי קרא את היומן" ל"החיווי הציג את כתובת הלקוח".
// מה שכן מבחין הוא **בקרת-החיוב שבסוף הבדיקה**: על הצעה שלא נשלחה (#8) — ללקוח שלה יש
// כתובת בדיוק כמו לכל אחד — החיווי **אינו** מוצג כלל. מסך שהיה מציג את כתובת-הלקוח היה
// מציג אותו גם שם. שתי הטענות ביחד הן ההוכחה; אף אחת מהן לבדה איננה.
// ⚠️ **ורקבה שוב, 09/08/2026 — והפעם התיקון הוא מבני ולא מספר חדש.**
// ‏#8 קיבלה שורת-`email_log` אמיתית ב-07/08/2026 (‏`tal@hitechgroup-demo.co.il`, `sent`) ⇒
// חדלה להיות "נקייה". **ארבע בדיקות נפלו, ואף אחת מהן לא בגלל באג:** שלוש נתקעו כי החלון
// פותח `window.confirm('ההצעה כבר נשלחה…')` ש-Playwright דוחה אוטומטית (ואז `return`
// שקט — בלי toast, בלי שגיאה, בלי שום דבר על המסך), והרביעית ראתה חיווי "כבר נשלח"
// במקום היעדרו.
// 🔒 **לכן ההצעה-הנקייה נבחרת עכשיו בזמן-ריצה** — `in_progress` · יש לה כתובת · **ואין לה
// ולו שורת-`email_log` מוצלחת אחת** — בדיוק התבנית ש-`e2e/CLAUDE.md` מורה עליה
// ("לבחור פיקסטורה בזמן-ריצה לפי תנאי, לא מזהה קשיח"; ‏`🚧 מ4` ב-`PROJECT_MASTER §6`).
// ⚠️ **וגם הנמען אינו נכנס לגיט** — הוא נגזר מהשורה שנבחרה. עדיפות לדומיין-דמו, כי שתי
// הצעות פתוחות נושאות כתובת פרטית אמיתית של ישי (הכרעת-ישי 01/08, כדי לקבל את המיילים).
// ⚠️ **נבחרת בזמן-ריצה, ולא `22` כפי שהיה כאן.** השימוש היחיד בה הוא שליפת נמען מ-`email_log`,
// ולכן היא **אינה** נשברת כשההצעה פגה — אבל מזהה קשיח לשורה חיה מרקיב מעצם היותו, וזו אותה
// משפחה שהעבירה כאן `#6`→`#22` ב-04/08. *(`🚧 מ6 ← מ3`.)*
let SENT_QUOTE_ID = null
const DEMO_DOMAIN = '-demo.'

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

// 🔴 מ-12/08/2026 "כבר נשלחה — לשלוח שוב?" הוא דיאלוג מעוצב (`useConfirm`), לא
// `window.confirm` — ר' ההערה ב-`load-failure-guards.spec.js:159`. הוא נפתח רק על שליחה
// שנייה+ לאותה הצעה בתוך הריצה, ולכן זה תנאי ולא שלב-קבוע.
async function confirmSendIfAsked(page) {
  const dialog = page.getByTestId('confirm-dialog')
  try {
    await dialog.waitFor({ state: 'visible', timeout: 3_000 })
  } catch {
    return
  }
  await page.getByTestId('confirm-dialog-confirm').click()
}

test.describe('שליחת ההצעה במייל — החוזה מול השרת (חוב 3.4)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  // 🔒 הנמען של החיווי "כבר נשלח" נקרא מהיומן החי — לא מקודד. אותה תבנית-חיבור כמו
  // ‏`load-failure-guards.spec.js`, ומאותה סיבה: הקריאה כאן היא **הכנה** ולא מה שנבדק.
  // ⚠️ ולידציית-שפיות על הקריאה עצמה: בלי שורה, שלוש הטענות שלמטה היו עוברות על מחרוזת
  // ריקה. אין שורה ⇒ הבדיקה נופלת כאן ואומרת מה נשבר, ולא מדווחת ירוק על כלום.
  let sentRecipient = null
  let CLEAN_QUOTE_ID = null
  let CLEAN_RECIPIENT = null
  test.beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON || !CEO_EMAIL || !CEO_PASSWORD) return
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON)
    try {
      await sb.auth.signInWithPassword({ email: CEO_EMAIL, password: CEO_PASSWORD })
      const { data } = await sb
        .from('email_log')
        .select('entity_id, recipient')
        .eq('entity_type', 'quote')
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(50)
      // 🔴 שני תנאים, לא אחד: `openDocumentDialog` פותח את החלון **מטבלת-ההצעות** וממתין
      // שכפתור-השליחה יידלק — ו-`isQuoteSendable` מחזיר `in_progress` בלבד.
      // ⚠️ נמדד: בחירה לפי "האחרון שנשלח" בלבד החזירה הצעה **מאושרת** (#24), והבדיקה נפלה
      // על הלחיצה. **הצעה שנשלחה אינה בהכרח הצעה שניתן לשלוח.**
      const sentIds = [...new Set((data ?? []).map((r) => r.entity_id))]
      if (sentIds.length) {
        const { data: openSent } = await sb
          .from('quotes')
          .select('quote_id')
          .eq('quote_status', 'in_progress')
          .in('quote_id', sentIds)
          .order('quote_id', { ascending: false })
          .limit(1)
        SENT_QUOTE_ID = openSent?.[0]?.quote_id ?? null
        sentRecipient = (data ?? []).find((r) => r.entity_id === SENT_QUOTE_ID)?.recipient ?? null
      }

      // ── בחירת ההצעה-הנקייה בזמן-ריצה ────────────────────────────────────────
      // שתי שאילתות ולא צירוף: `email_log` פולימורפית ואין לה FK ל-`quotes`.
      const { data: sentRows } = await sb
        .from('email_log')
        .select('entity_id')
        .eq('entity_type', 'quote')
        .eq('status', 'sent')
      const everSent = new Set((sentRows ?? []).map((row) => row.entity_id))

      const { data: openQuotes } = await sb
        .from('quotes')
        .select('quote_id, customers(email)')
        .eq('quote_status', 'in_progress')
        .order('quote_id')
      const candidates = (openQuotes ?? []).filter(
        (row) => row.customers?.email && !everSent.has(row.quote_id),
      )
      // דומיין-דמו קודם; כתובת אמיתית היא מוצא-אחרון ולא ברירת-מחדל.
      const chosen =
        candidates.find((row) => row.customers.email.includes(DEMO_DOMAIN)) ?? candidates[0] ?? null
      CLEAN_QUOTE_ID = chosen?.quote_id ?? null
      CLEAN_RECIPIENT = chosen?.customers?.email ?? null
    } finally {
      await sb.auth.signOut()
    }
  })

  // ⚠️ ולידציית-שפיות, מאותה סיבה כמו זו של `sentRecipient`: בלי הצעה נקייה כל בדיקות
  // מסלול-ההצלחה היו רצות על `undefined` ונופלות בהודעה שאינה אומרת מה נשבר. אין מועמדת ⇒
  // נופלים כאן ואומרים בדיוק מה חסר — ולא מדווחים ירוק על כלום.
  test.beforeEach(() => {
    expect(
      CLEAN_QUOTE_ID,
      'אין אף הצעה "בתהליך" עם כתובת שמעולם לא נשלחה — יש ליצור אחת או לנקות את היומן',
    ).not.toBeNull()
  })

  test.beforeEach(async ({ page }) => {
    // 🔴 **החבילה מזהמת את הפיקסטורה של עצמה, וזה נראה כמו רגרסיה אקראית** (נמדד 10/08/2026):
    // ‏`beforeAll` בוחר הצעה שמעולם לא נשלחה ומקבע אותה לכל הקובץ — **והבדיקה הראשונה שולחת
    // אותה באמת.** מאותו רגע `previousSend` קיים, ולחיצה על "שלח" פותחת חלון-ווידוא
    // *("כבר נשלחה — לשלוח שוב?")*. ‏**Playwright דוחה דיאלוגים אוטומטית** ⇒ השליחה לא קורית,
    // והבדיקה שאחריה מחפשת אלמנט שלא נוצר ונופלת ב-`element(s) not found` — הודעה שאינה
    // רומזת על הסיבה. אומת בהרצות חוזרות על **אותו קוד**: נפילה · הצלחה · נפילה · הצלחה.
    // ⇒ מאשרים את החלון. **שליחה חוזרת היא מקרה לגיטימי מתועד** (`03_quotes/CLAUDE.md`),
    // וכל בדיקה כאן שלוחצת "שלח" מתכוונת באמת לשלוח.
    // 🚫 **ואין כאן החלשה של שומר:** אף בדיקה בקובץ אינה מאמתת שהחלון **חוסם** — הוולידציה
    // של החלון עצמו חיה בבדיקות-היחידה של `hasQuoteChanged`/`getLastSuccessfulSend`.
    // 🔒 האישור עצמו מטופל ב-`confirmSendIfAsked` אחרי כל לחיצת-שליחה (הדיאלוג מעוצב, לא
    // `window.confirm` — ר' `openDocumentDialog` שמעל).
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
    await confirmSendIfAsked(page)
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
    await confirmSendIfAsked(page)

    await expect(page.getByTestId('quote-send-check-notice')).toBeVisible()
    await expect(page.getByTestId('toast-error')).toBeVisible()
  })

  test('הקריאה מתה באמצע — "לא ידוע", ולא "נכשל"', async ({ page }) => {
    // ⚠️ ההבחנה הזו היא לב העניין: "נכשל" גורם למשתמש לשלוח שוב, והלקוח מקבל את ההצעה
    // פעמיים. כשאין אישור — אומרים "לא ידוע" ומפנים לבדוק **לפני** ניסיון חוזר.
    await page.route('**/functions/v1/send-email', (route) => route.abort())

    await openDocumentDialog(page, CLEAN_QUOTE_ID)
    await page.getByTestId('quote-document-send').click()
    await confirmSendIfAsked(page)

    const err = page.getByTestId('quote-send-error')
    await expect(err).toBeVisible()
    // 🔒 חוזה: הניסוח חי ב-`src/lib/email.js` (`sendResultMessage`) ונבדק שם ביחידה;
    // כאן נבדק שה**מצב הנכון** נבחר — "לא התקבל אישור" ולא "לא נשלחה".
    await expect(err).toContainText('לא התקבל אישור')
    await expect(err).not.toContainText('ההצעה לא נשלחה')
  })

  test('חיווי "כבר נשלח" מגיע מהיומן במסד — ולכן שורד רענון-דף', async ({ page }) => {
    // ⚠️ אין כאן שום יירוט: זו שורת-`email_log` **אמיתית** (‏#22, 01/08). שלוש שכבות-ההגנה
    // האחרות חיות ב-state של הקומפוננטה ומתות ברענון; זו היחידה ששורדת — וגם מגיעה
    // למשתמש שני שפותח את אותה הצעה במחשב אחר.
    expect(sentRecipient, `אין שורת email_log מוצלחת להצעה ${SENT_QUOTE_ID}`).toBeTruthy()

    await openDocumentDialog(page, SENT_QUOTE_ID)
    await expect(page.getByTestId('quote-previous-send')).toContainText(sentRecipient)

    await page.reload()
    await openDocumentDialog(page, SENT_QUOTE_ID)
    await expect(page.getByTestId('quote-previous-send')).toContainText(sentRecipient)

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
    // 🔒 **וזו הסיבה שהגוף ריק דווקא:** בפונקציה שער-ההרשאה רץ **לפני** אימות-השדות. כלומר
    // קריאה של מנכ"ל עם גוף ריק עוברת את השער ונופלת על "חסרים נתונים" — **לפני מודול-הדואר**.
    // אין מסלול שבו הבדיקה הזו שולחת מייל לאיש.
    // ⚠️ **מ-09/08/2026 הפונקציה כן קוראת את הגוף לפני השער** — אבל **רק כדי לדעת איזו ישות
    // זו** (מפת `ENTITY_MODULE`), ו**אינה מחזירה ממנו שום שגיאה**. הסדר שהבדיקה נועלת נשמר.
    // 🔑 ובמכוון בלי מספרי-שורות: הנוסח הקודם כאן נעץ "403 בשורה 71 … בשורה 84", והמספרים
    // זזו ברגע שמישהו נגע בקובץ — הערה שאף מנגנון אינו מאמת. העוגן הוא המחרוזות:
    // `אין לך הרשאה לשלוח.` (403) חייבת להופיע ב-`index.ts` **לפני** `חסרים נתונים לשליחה.` (400).
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const passed = await callSendEmail(page, {})
    expect(passed.status).toBe(400)
    expect(passed.status).not.toBe(403)
    expect(passed.body?.error).toContain('חסרים נתונים')
  })
})
