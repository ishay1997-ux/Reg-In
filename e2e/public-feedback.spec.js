import { test, expect } from '@playwright/test'

// E2E של **משטח S4 — הדף הציבורי למשוב-לקוח** (`/feedback/:token`), צעד 4.4.
// תקדים-מבנה מדויק: `e2e/public-confirm.spec.js` (`/shift/:token`) — נקרא במלואו קודם.
//
// 🔴 **אין session, ואסור שיהיה** (אותו נימוק בדיוק כמו התקדים): לקוח-חיצוני שקיבל קישור
// במייל-הסקר, בלי חשבון ולא יהיה לו. `test.use({ storageState: ... })` מנקה הקשר-זהות.
//
// 🔴 **ארבעת המצבים דרך יירוט-רשת, ולא דרך שורות-מסד** — `e2e/CLAUDE.md`: "התבנית היחידה
// המותרת: יירוט-רשת ב-Playwright, לא הזרקת-שורות". שלושת המצבים שאינם ניתנים להשגה על
// דאטה אמיתית בלי לכתוב (already · saveFailed · thankYou) מיוצרים ברשת בלבד; ה-`submit_feedback`
// **הכותבת עצמה מיורטת** במצב-הטופס — אף קריאה בקובץ הזה לא כותבת שורה אמיתית ב-`projects`.
//
// 🔴 **תיקון-עובדה 28/08/2026 — הנוסח הקודם כאן היה שגוי, ותוקן אחרי מדידה.**
// עד היום נכתב כאן ש-`get_feedback_page` היא "קריאה טהורה, בלי שום כתיבה — נמדד מגוף-הפונקציה",
// ולכן מצב ① נקרא בלי יירוט. **זה לא נכון.** השורה הראשונה בגוף הפונקציה היא
// `perform public.feedback_rate_limit()`, ו-`feedback_rate_limit()` מבצעת
// `delete from public.feedback_rpc_calls …` ואז `insert into public.feedback_rpc_calls (ip)`
// (`supabase/migrations/20260827155303_module8_public_feedback_rpc.sql`, סעיפים 2 ו-4).
// ⇒ **כל קריאה ל-`get_feedback_page` כותבת שורה במסד החי.**
// 🔬 **ואומת חי, לא רק מקריאת-קוד** (שאילתת-קריאה על הפרויקט, 28/08/2026): `feedback_rpc_calls`
// כבר מחזיקה **10 שורות מ-IP אחד**, אחרונה `27/08 22:56Z` — כלומר `x-forwarded-for` אכן מסופק
// כאן על-ידי הפרוקסי, ה-`insert` אכן מתבצע, ואין fail-open שמציל.
// ⚠️ **ולמה הטעות נראתה סבירה:** התקדים `public-confirm.spec.js` באמת קורא ל-`get_shift_invite`
// בלי יירוט — **אבל `get_shift_invite` אינה מגבילת-קצב.** נמדד ישירות מ-`pg_get_functiondef`:
// `get_shift_invite` ⇒ **אין** `rate_limit` בגוף · `get_feedback_page` ⇒ **יש**. התקדים הועתק
// בלי לבדוק שההנמקה שמאחוריו עדיין תקפה.
// ⇒ **מצב ① מיורט גם הוא מאז 28/08.** חוזה-הריצה המשותף לכל סוכני העבודה הזו (28/08/2026,
// יום ההצגה-הביניים על אותו פרויקט Supabase) אוסר כל RPC-כותב על המסד החי, ובנוסף המגביל
// חוסם ב-**15 קריאות לשעה פר-IP** — מכסה שהחבילה הזו חולקת עם ההדגמה עצמה, כך שריצות חוזרות
// מאותו IP עלולות להפיל את דף-המשוב בהצגה בהודעה "לא ניתן להשלים את הפעולה כרגע".
// 🚧 **המחיר, מוצהר ולא מוסתר:** מרגע היירוט **אף בדיקה בקובץ הזה אינה מוכיחה שה-RPC האנונימי
// באמת נגיש חי** (grant ל-`anon`, מסלול-רשת אמיתי). הכיסוי הזה עובר ל-**5.1** (מסע-הקבלה החי,
// בהרשאת-ישי) ולשורת Security/Pen ב-§7 של מדריך-המיקרו — *"anon exposure pair on the public
// RPCs · rate-limit proof"*. **זו החלפה מודעת, לא השמטה.**
//
// 🕓 טוקן קבוע-בקוד מותר כאן, בשונה מ-`e2e/hostesses.spec.js` — הוא לעולם אינו נבדק מול
// שורה אמיתית: **כל ארבע בדיקות-המצבים מיירטות את `get_feedback_page` כליל**, והחמישית
// (דליפת-המסלול) אינה קוראת לה בכלל. אין כאן ערך שיכול "להתיישן".

const FAKE_TOKEN = '00000000-0000-4000-8000-000000000001'
const GET_PAGE_RPC = '**/rest/v1/rpc/get_feedback_page'
const SUBMIT_RPC = '**/rest/v1/rpc/submit_feedback'

test.describe('משטח S4 — הדף הציבורי למשוב-לקוח (ארבעת המצבים, קריאה-בלבד/מיורט-רשת)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  // מצב ① — dead. **מיורט מאז 28/08** (ר' תיקון-העובדה בראש הקובץ: `get_feedback_page`
  // כותבת שורת-מגביל-קצב ב-`feedback_rpc_calls` בכל קריאה, כולל על טוקן-שווא).
  // ⚠️ **מה עדיין נבדק כאן באמת, ולמה זו לא בדיקה-על-כלום:** ה-`not_found` המוחזר הוא בדיוק
  // האובייקט שהפונקציה החיה מחזירה לטוקן שגוי/ריק/מת (`jsonb_build_object('state','not_found')`,
  // אותה מיגרציה) — והבדיקה מריצה דרכו את **המסלול, ה-`PublicFeedbackPage` האמיתי, מיפוי-המצב
  // ושלוש השליליות**, שהן עיקר התקדים. מה שאינו נבדק כאן עוד: נגישות ה-RPC ל-`anon` חי (⇒ 5.1).
  test('טוקן לא-קיים ⇒ מסך "הקישור אינו בתוקף", בלי טופס ובלי סרגל-צד', async ({ page }) => {
    await page.route(GET_PAGE_RPC, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ state: 'not_found' }),
      }),
    )
    await page.goto(`/feedback/${FAKE_TOKEN}`)

    await expect(page.getByTestId('feedback-result-dead')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('הקישור אינו בתוקף')).toBeVisible()

    // אותן שלוש שליליות שהן עיקר התקדים.
    await expect(page).toHaveURL(new RegExp(`/feedback/${FAKE_TOKEN}$`))
    await expect(page.getByRole('button', { name: 'התחברות' })).toHaveCount(0)
    await expect(page.getByTestId('feedback-form')).toHaveCount(0)
    await expect(page.getByRole('navigation')).toHaveCount(0)
  })

  // מצב ② — already. אין דרך להשיג את זה על דאטה אמיתית בלי להגיש משוב אמיתי קודם
  // (בדיוק הכשל שתועד ב-`e2e/CLAUDE.md` על `quote-email.spec.js`) ⇒ יירוט-רשת בלבד.
  test('משוב שכבר נענה ⇒ מסך-תודה חוזר, בלי טופס שני', async ({ page }) => {
    await page.route(GET_PAGE_RPC, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ state: 'already' }),
      }),
    )

    await page.goto(`/feedback/${FAKE_TOKEN}`)
    await expect(page.getByTestId('feedback-result-already')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('המשוב כבר התקבל, תודה')).toBeVisible()
    await expect(page.getByTestId('feedback-form')).toHaveCount(0)
  })

  // מצב ③ — saveFailed מרשת. **כשל-רשת אינו "הקישור מת"** — אותה הבחנה בדיוק כמו התקדים:
  // האחת אומרת ללקוח לנסות שוב, השנייה אומרת שהקישור לא בתוקף. ואחרי חזרת-הרשת, "נסו שוב"
  // באמת טוען מחדש ולא נתקע על אותה שגיאה.
  test('כשל-רשת בטעינה ⇒ "לא הצלחנו לשמור" + נסו-שוב, לא "הקישור אינו בתוקף"', async ({ page }) => {
    await page.route(GET_PAGE_RPC, (route) => route.abort())
    await page.goto(`/feedback/${FAKE_TOKEN}`)

    await expect(page.getByTestId('feedback-result-saveFailed')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('לא הצלחנו לשמור את המשוב')).toBeVisible()
    await expect(page.getByTestId('feedback-retry')).toBeVisible()
    await expect(page.getByText('הקישור אינו בתוקף')).toHaveCount(0)

    await page.unroute(GET_PAGE_RPC)
    await page.route(GET_PAGE_RPC, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ state: 'not_found' }),
      }),
    )
    await page.getByTestId('feedback-retry').click()
    await expect(page.getByTestId('feedback-result-dead')).toBeVisible({ timeout: 15_000 })
  })

  // מצב ④ — thankYou. **הן הקריאה והן ה-RPC-הכותב מיורטים** — הטופס נבנה מפרויקט מומצא
  // ברשת, וההגשה עצמה מקבלת תשובת-הצלחה בדויה בלי לכתוב שורה. A-1 (חסימת-שליחה עד
  // בחירת-כוכב) נבדק לפני הבחירה, לא רק אחריה.
  test('טופס פתוח + הגשה ⇒ מסך-תודה, ואפס כתיבה אמיתית (submit_feedback מיורט כליל)', async ({
    page,
  }) => {
    let submittedBody = null
    await page.route(GET_PAGE_RPC, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ok',
          event_name: 'כנס E2E לבדיקה',
          event_date: '2026-09-01',
        }),
      }),
    )
    await page.route(SUBMIT_RPC, async (route) => {
      submittedBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ state: 'ok' }),
      })
    })

    await page.goto(`/feedback/${FAKE_TOKEN}`)
    const form = page.getByTestId('feedback-form')
    await expect(form).toBeVisible({ timeout: 15_000 })
    await expect(form).toContainText('כנס E2E לבדיקה')

    await expect(page.getByTestId('feedback-submit')).toBeDisabled()
    // 🔴 תוקן `01/09/2026` באודיט-הסגירה: השם הנגיש של כפתור-הכוכב היה `5 מתוך 5` —
    // נוסח שנכתב למסך **פנימי** שבו מנהלת מדרגת דיילת. כרטיס-המסך המאושר של הדף
    // הציבורי (§S4/①) נועל `כוכב 1`…`כוכב 5`, והדף תוקן אליו. **לאלמנט יש שם-נגיש
    // אחד בלבד**, ולכן אין גרסה שמספקת את שניהם — הבדיקה נעה עם המסך.
    await page.getByTestId('feedback-stars').getByRole('button', { name: 'כוכב 5' }).click()
    await expect(page.getByTestId('feedback-submit')).toBeEnabled()
    await page.getByTestId('feedback-submit').click()

    await expect(page.getByTestId('feedback-result-thankYou')).toBeVisible({ timeout: 15_000 })
    // מוכיח שה-RPC-הכותב אכן נקרא (הבדיקה לא ירוקה על מכנה-0) **וגם** שהוא נקרא עם
    // הפרמטרים הנכונים — בלי סמיכות על מה שקרה בפועל במסד, שאסור לגעת בו.
    expect(submittedBody).not.toBeNull()
    expect(submittedBody).toMatchObject({ p_token: FAKE_TOKEN, p_score: 5 })
  })

  // 🔴 **רגרסיית 4.1/4.4, אותו נימוק בדיוק כמו `public-confirm.spec.js`:** מסלול ציבורי חדש
  // הוא בדיוק השינוי שעלול לפתוח בשקט מסך פנימי אחר — טעות-קינון אחת ב-`App.jsx` מוציאה עוד
  // מסלול מתחת ל-`MainLayout`. ‏`App.routes.test.jsx` תופס רק מסלול שכן מקונן; זה שיצא
  // החוצה בטעות חומק ממנו לגמרי.
  test('מסכי המודול הפנימיים (כולל כספים) עדיין דורשים session — /feedback לא פרץ אותם', async ({
    page,
  }) => {
    for (const path of ['/finance', '/hostesses', '/customers', '/quotes']) {
      await page.goto(path)
      await expect(page, `${path} נשאר פתוח בלי התחברות`).toHaveURL(/\/login/, {
        timeout: 15_000,
      })
    }
  })
})
