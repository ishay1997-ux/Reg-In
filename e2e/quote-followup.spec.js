import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

// ✨ D2 — "נסחי מייל מעקב" מחלון-המסמך של הצעה (ליטושי-הכנס 24/09/2026, התוכנית §6 D2 · §6ה).
//
// 🔴 **אף בדיקה כאן אינה פונה ל-AI:** ‏`**/functions/v1/draft-followup` מיורט בכל בדיקה (התוכנית §8
// מלכודת 12 — מכסת-ה-AI לא ידועה ומשותפת). **ואפס כתיבות למסד:** ההצעה נבחרת מהתשובה החיה של
// רשימת-ההצעות (`e2e/CLAUDE.md` §2.2 — בלי מזהה קשיח), והחלון רק קורא.
// 🔒 **ו-0 שליחות:** כל בדיקה סופרת בקשות ל-`send-email` ודורשת אפס — המערכת לעולם לא שולחת.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const EXPIRED_REASON = 'פג תוקף'

const DRAFT = {
  draft: {
    subject: 'מעקב אחרי הצעת המחיר — אירוע בדיקה',
    body: 'שלום רב,\nרצינו לבדוק אם האירוע עדיין רלוונטי עבורכם.\nנשמח לחדש את ההצעה.\nבברכה,',
  },
  to: 'client@example.com',
}

async function login(page) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת אימייל').fill(CEO_EMAIL)
  await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// בוחר הצעות מהתשובה החיה של `listQuotes` (עמוד אחרי עמוד, `fetchAll`) — **קריאה בלבד**, בלי יירוט.
async function pickQuotes(page) {
  const pending = []
  const rows = []
  const onResponse = (res) => {
    if (!res.url().includes('/rest/v1/quotes') || res.request().method() !== 'GET') return
    pending.push(
      res
        .json()
        .then((data) => Array.isArray(data) && rows.push(...data))
        .catch(() => {}),
    )
  }
  page.on('response', onResponse)
  await page.goto('/quotes')
  await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  page.off('response', onResponse)
  await Promise.all(pending)
  const expired = rows.find(
    (q) => q.quote_status === 'rejected' && q.rejection_reason === EXPIRED_REASON,
  )
  // המכנה: בלי הצעה שפג תוקפה, הבדיקה הייתה "עוברת" על כלום.
  expect(expired, 'אין הצעה שפג תוקפה ברשימה — אין על מה לבדוק').toBeTruthy()
  return { expiredId: expired.quote_id, rows }
}

// מיירט את פונקציית-השרת ורושם כל קריאה; ובנפרד סופר כל בקשה ל-`send-email`.
async function routeDraft(page, reply) {
  const calls = []
  const sends = []
  page.on('request', (req) => {
    if (req.url().includes('/functions/v1/send-email')) sends.push(req.url())
  })
  await page.route('**/functions/v1/draft-followup', async (route) => {
    if (route.request().method() === 'POST') calls.push(route.request().postDataJSON())
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(reply.body),
    })
  })
  return { calls, sends }
}

async function activeTestId(page) {
  return page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '')
}

// ⌨️ מקש Tab עד שהפוקוס מגיע לפקד — ולא `.focus()`: המבחן הוא שהפקד **בר-הגעה** במקלדת.
async function tabTo(page, testId, max = 30) {
  for (let i = 0; i < max; i += 1) {
    if ((await activeTestId(page)) === testId) return
    await page.keyboard.press('Tab')
  }
  expect(await activeTestId(page), `לא הגעתי ל-${testId} ב-${max} לחיצות Tab`).toBe(testId)
}

// 🔌 הכפתור מוסתר כל עוד `FOLLOWUP_AI_AVAILABLE` כבוי (`src/lib/quoteFollowup.js`, הכרעת-הסגן 24/09).
// נקרא מקובץ-המקור ולא מועתק — כך הבדיקות חוזרות לרוץ מעצמן ביום שמדליקים אותו. (ה-alias `@/` שבקובץ
// אינו נפתר ב-Playwright, ולכן קריאת-טקסט ולא import.)
const FOLLOWUP_AI_AVAILABLE = /FOLLOWUP_AI_AVAILABLE\s*=\s*true/.test(
  readFileSync('src/lib/quoteFollowup.js', 'utf8'),
)

test.describe('D2 · טיוטת מייל-מעקב בעזרת AI', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')
  test.skip(
    !FOLLOWUP_AI_AVAILABLE,
    'הכפתור מוסתר — FOLLOWUP_AI_AVAILABLE כבוי (הספק לא ענה, 24/09)',
  )
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('⌨️ הזרימה כולה במקלדת בלבד — פתיחה, ניסוח, העתקה, Esc, והפוקוס חוזר לכפתור', async ({
    page,
  }) => {
    const { expiredId } = await pickQuotes(page)
    const { calls, sends } = await routeDraft(page, { body: DRAFT })

    await page.goto(`/quotes?view=${expiredId}`)
    await expect(page.getByTestId('quote-document-title')).toContainText(String(expiredId))
    const open = page.getByTestId('quote-followup-open')
    await expect(open).toBeEnabled({ timeout: 15_000 })

    // פתיחה — Tab עד הכפתור, Enter.
    await tabTo(page, 'quote-followup-open')
    await page.keyboard.press('Enter')
    const dialog = page.getByTestId('followup-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('followup-draft')).toBeVisible()
    // 🔒 מה שיצא לשרת: מזהה-ההצעה בלבד.
    expect(calls).toEqual([{ quote_id: expiredId }])

    // הפוקוס בתוך חלון-הטיוטה (נלכד בו), והטיוטה ניתנת-לעריכה מהמקלדת.
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await expect(page.getByTestId('followup-notice')).toHaveText('טיוטה — בדקי לפני שליחה.')
    await tabTo(page, 'followup-subject')
    await page.keyboard.press('End')
    await page.keyboard.type(' (עודכן)')
    await expect(page.getByTestId('followup-subject')).toHaveValue(/\(עודכן\)$/)

    // "פתחי במייל" בר-הגעה ונושא את הנוסח הערוך (לא נלחץ: `mailto:` פותח תוכנה חיצונית).
    await tabTo(page, 'followup-open-mail')
    const href = await page.getByTestId('followup-open-mail').getAttribute('href')
    expect(href).toContain(`mailto:${encodeURIComponent(DRAFT.to)}`)
    expect(href).toContain(encodeURIComponent('(עודכן)'))

    // העתקה — Tab, Enter; הלוח מכיל את הגוף, והאזור-החי מכריז.
    await tabTo(page, 'followup-copy')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('followup-status')).toHaveText('הועתק.')
    // ⚠️ הלוח של Windows מחזיר `\r\n` במקום `\n` — משווים אחרי נרמול, לא את התווים הגולמיים.
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip.replace(/\r\n/g, '\n').startsWith(DRAFT.draft.body)).toBe(true)

    // Esc סוגר את חלון-הטיוטה בלבד, והפוקוס חוזר לכפתור שפתח; Esc שני סוגר את חלון-המסמך.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('quote-document-title')).toBeVisible()
    expect(await activeTestId(page)).toBe('quote-followup-open')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('quote-document-title')).toBeHidden()

    expect(calls).toHaveLength(1)
    expect(sends, '🔒 המערכת לעולם לא שולחת').toEqual([])
  })

  test('מכסה (429) ⇒ "הגעת למכסת ה-AI — נסי שוב מאוחר יותר.", בלי טיוטה ובלי "נסי שוב"', async ({
    page,
  }) => {
    const { expiredId } = await pickQuotes(page)
    const { sends } = await routeDraft(page, {
      status: 429,
      body: { status: 'quota', error: 'הגעת למכסת ה-AI — נסי שוב מאוחר יותר.' },
    })
    await page.goto(`/quotes?view=${expiredId}`)
    await page.getByTestId('quote-followup-open').click()
    await expect(page.getByTestId('followup-status')).toHaveText(
      'הגעת למכסת ה-AI — נסי שוב מאוחר יותר.',
    )
    await expect(page.getByTestId('followup-draft')).toHaveCount(0)
    await expect(page.getByTestId('followup-retry')).toHaveCount(0)
    expect(sends).toEqual([])
  })

  test('הצעה פתוחה שלא נשלחה ⇒ הכפתור מושבת, והנימוק גלוי ליד הכפתור (יומן-המיילים החי)', async ({
    page,
  }) => {
    const { calls } = await routeDraft(page, { body: DRAFT })
    await page.goto('/quotes')
    const unsent = page.locator('[data-testid^="quote-unsent-"]').first()
    await expect(unsent).toBeVisible({ timeout: 30_000 })
    const id = (await unsent.getAttribute('data-testid')).replace('quote-unsent-', '')
    await page.goto(`/quotes?view=${id}`)
    await expect(page.getByTestId('quote-followup-reason')).toHaveText('ההצעה עוד לא נשלחה ללקוח')
    await expect(page.getByTestId('quote-followup-open')).toBeDisabled()
    expect(calls).toEqual([])
  })
})
