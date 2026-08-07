import { test, expect } from '@playwright/test'

// E2E שומר-המע"מ — נבנה 31/07/2026 בסבב-התיקונים A של סקירת-הקוד (`docs/audit_2026-07-31_fix_plan.md` §A).
//
// **מה זה מכסה, ולמה זה לא יכול להיות בדיקת-יחידה:** בדיקת-היחידה מוכיחה שמנוע ה-PDF
// **זורק** כשאין שיעור מע"מ. היא אינה יכולה להוכיח שהמשתמשת רואה הודעה מובנת במקום
// מסמך — ושכפתורי ההורדה והשליחה אכן מתים. עד 31/07 המסלול הזה הפיק ללקוח משלם מסמך
// שכתוב בו `מע"מ (0%)` וסכום נמוך ב-~15%, בלי שום שגיאה.
//
// 🧨 **אפס כתיבות למסד.** אין סביבת-בדיקה נפרדת — יש פרויקט Supabase חי אחד
// (`src/CLAUDE.md`). מצב "הפרמטר נמחק" נוצר ב**יירוט תשובת-הרשת** בלבד: התשובה האמיתית
// נשלפת ומסוננת בדרך חזרה. שורת `אחוז_מעמ` שבמסד לא נגעו בה, והיא נדרשת כדי שהבדיקה
// האחרונה (המסלול התקין) תעבור.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

const VAT_PARAM = 'אחוז_מעמ'

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// מסירה את שורת הפרמטר מכל תשובת `params` — בדיוק מה שקורה כשמוחקים אותה
// ב-Table Editor (§7.84). שתי שאילתות שונות פונות לטבלה הזו (מסך-ההצעות והקטלוג),
// ולכן היירוט הוא על הנתיב ולא על שאילתה מסוימת.
async function hideParamRow(page, paramName) {
  await page.route('**/rest/v1/params*', async (route) => {
    const response = await route.fetch()
    let body
    try {
      body = await response.json()
    } catch {
      return route.fulfill({ response })
    }
    const filtered = Array.isArray(body) ? body.filter((r) => r.param_name !== paramName) : body
    return route.fulfill({ response, json: filtered })
  })
}

test.describe('שומר המע"מ — מסמך אינו מופק כששיעור המע"מ אינו ידוע', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('פרמטר אחוז_מעמ חסר — אזהרה במסך, הודעה בחלון, ושני הכפתורים מתים', async ({ page }) => {
    await hideParamRow(page, VAT_PARAM)
    await page.goto('/quotes')

    // (1) האזהרה במסך — היא שנותנת למשתמשת סיכוי לתקן לבד.
    const banner = page.getByTestId('quotes-missing-params')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(VAT_PARAM)

    // (2) החלון נפתח — ובמקום המסמך יש הודעה שאומרת מה לתקן, לא "הפקת המסמך נכשלה".
    const firstDocButton = page.locator('[data-testid^="quote-document-"]').first()
    await firstDocButton.click()
    const error = page.getByTestId('quote-document-error')
    await expect(error).toBeVisible()
    await expect(error).toContainText(VAT_PARAM)
    await expect(page.getByTestId('quote-document-frame')).toHaveCount(0)

    // (3) הכפתורים. ההורדה קיימת תמיד; השליחה מוצגת רק להצעה "בתהליך" —
    //     ולכן נבדקת רק אם היא בכלל שם, בלי להניח על איזו שורה נחתנו.
    await expect(page.getByTestId('quote-document-download')).toBeDisabled()
    const sendButton = page.getByTestId('quote-document-send')
    if ((await sendButton.count()) > 0) await expect(sendButton).toBeDisabled()
  })

  // ⚠️ **המסלול התקין הוא חלק מההוכחה, לא נספח.** בלעדיו הבדיקה שמעל הייתה עוברת
  // גם על מסך שבור לגמרי (שלעולם אינו מפיק מסמך), ו"ההגנה עובדת" היה נשמע זהה.
  test('הפרמטר במקומו — אין אזהרה, והמסמך מופק', async ({ page }) => {
    await page.goto('/quotes')

    await expect(page.getByTestId('quotes-missing-params')).toHaveCount(0)

    await page.locator('[data-testid^="quote-document-"]').first().click()
    await expect(page.getByTestId('quote-document-frame')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('quote-document-error')).toHaveCount(0)
    await expect(page.getByTestId('quote-document-download')).toBeEnabled()
  })
})
