import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// צעדים 4.2 + 4.3 (31/07/2026) — מסלול הדחייה והתפוגה, וחבילת-ההצעות הקבועה.
//
// ⚠️ **דחייה היא כמעט בלתי-הפיכה** (בדיוק כמו אישור): טריגר `quotes_lock_non_in_progress`
// חוסם `update` **וגם** `delete` על כל הצעה שאינה `in_progress`, ואין סביבת-בדיקה נפרדת —
// יש פרויקט Supabase חי אחד. ולכן **שום בדיקה כאן אינה דוחה הצעה אמיתית**:
//   • מסלול-הדחייה המלא נבדק ביירוט-רשת — המסך מרנדר באמת, המסד לא שומע;
//   • הכתיבות האמיתיות היחידות הן כאלה שמובטח שייכשלו (חומת-הנעילה);
//   • שומרי-המסד עצמם הוכחו ב-SQL בטרנזקציה שגולגלה אחורה — `module-3.md` §9 (31/07).
//
// 🔴 **בררנים: `data-testid` בלבד.** ‏E2E אינו רץ ב-CI, ו-81 בררנים קיימים תופסים מחרוזות
// עבריות — כלומר שינוי-ניסוח שובר בדיקות בעוד השער נשאר ירוק (הכרעת-ישי 31/07). כל מחרוזת
// עברית שכן ננעלת כאן מסומנת בהערה כ**חוזה** (ערך-CHECK במסד / הודעת-שרת), לא כנוסח-מסך.
// ══════════════════════════════════════════════════════════════════════════════════════

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// ⚠️ שורות-זרע אמיתיות. נמדדו חי 31/07/2026: 8 הצעות — 4 בתהליך (6,7,8,9) · 1 מאושרת (10) ·
// 3 דחויות (11 תקציב לקוח · 12 נבחר מתחרה · 13 פג תוקף). המקור: `scripts/demo-seed.mjs`.
// לפני מחיקת הצעה מהמסד — לחפש את מספרה בחבילת-הבדיקות (זה כבר נשך פעם, ב-#14/#15).
// ↳ 01/08/2026 (צעד 5.1): +1 הצעה (מדיטק #21, נבנתה ואושרה חי) — עכשיו 9 הצעות: אותן 4
// בתהליך, 2 מאושרות (10,21), אותן 3 דחויות. אף אסרטה כאן אינה נשענת על מונה-כולל, רק על
// REJECTED_COUNT (לא זז) ומזהי-שורה ספציפיים — ולכן אין תיקון-קוד מעבר להערה הזו.
const REJECTED_QUOTE_ID = 11
const REJECTED_COUNT = 3

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// סופר כל ניסיון-כתיבה אמיתי לטבלת ההצעות. הבדיקות שמוכיחות "נחסם לפני המסד" נשענות
// על **0** כאן — לא על היעדר הודעת-הצלחה, שיכולה לנבוע גם מכשל אחר לגמרי.
function countQuoteWrites(page) {
  const writes = []
  page.on('request', (req) => {
    const isWrite = req.method() === 'PATCH' || req.method() === 'POST'
    if (isWrite && req.url().includes('/rest/v1/quotes')) writes.push(req.url())
  })
  return writes
}

async function openRejectDialog(page) {
  await page.goto('/quotes')
  await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })
  await page
    .getByTestId(/^quote-reject-/)
    .first()
    .click()
  await expect(page.getByTestId('reject-dialog-title')).toBeVisible()
}

test.describe('חלון הדחייה חוסם לפני שהמסד נשמע (4.2)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('דחייה בלי לבחור סיבה — נעצרת, ואף בקשת-כתיבה לא יוצאת', async ({ page }) => {
    const writes = countQuoteWrites(page)
    await openRejectDialog(page)
    await page.getByTestId('reject-confirm').click()

    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('יש לבחור סיבת דחייה')
    // ⚠️ זו הטענה האמיתית: לא "נראתה הודעה" אלא **שהמסד לא נגע בכלום**. בלי הספירה הזו,
    // בדיקה כזו עוברת גם על מסך ששלח בקשה ונכשל בשרת מסיבה אחרת.
    expect(writes).toHaveLength(0)
  })

  test('סיבה "אחר" בלי פירוט — נעצרת, ואף בקשת-כתיבה לא יוצאת', async ({ page }) => {
    const writes = countQuoteWrites(page)
    await openRejectDialog(page)

    // 🔒 חוזה, לא נוסח-מסך: 'אחר' הוא אחד משמונה הערכים של `quotes_rejection_reason_check`
    // במסד, והתלות בו זהה לתלות של `quotes_rejection_notes_required` שאוכף אותו שם.
    await page.locator('input[name="rejection-reason"][value="אחר"]').check()
    await expect(page.getByTestId('reject-notes')).toBeVisible()
    await page.getByTestId('reject-confirm').click()

    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('יש לפרט')
    expect(writes).toHaveLength(0)
  })

  test('דחייה מלאה — מה שנשלח למסד הוא בדיוק מה שנבחר במסך', async ({ page }) => {
    let sent = null
    let targetUrl = ''

    // ⚠️ היירוט הוא מה שמאפשר לבדוק את המסלול **המלא** בלי לדחות הצעה אמיתית לנצח.
    await page.route('**/rest/v1/quotes?*', async (route) => {
      const req = route.request()
      // `continue()` ולא `fallback()` — ר' ההסבר המלא ב-`prices.spec.js`: ‏fallback מריץ מחדש
      // את התאמת-המסלולים לכל בקשה שעוברת, וזה נמדד כמפיל בדיקה בריצה הטורית המלאה.
      if (req.method() !== 'PATCH') return route.continue()
      sent = req.postDataJSON()
      targetUrl = req.url()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ quote_id: 0, quote_status: 'rejected' }]),
      })
    })

    await openRejectDialog(page)
    await page.locator('input[name="rejection-reason"][value="נבחר מתחרה"]').check()
    await page.getByTestId('reject-confirm').click()

    await expect(page.getByTestId('toast-success')).toBeVisible()
    expect(sent).not.toBeNull()
    expect(sent.quote_status).toBe('rejected')
    expect(sent.rejection_reason).toBe('נבחר מתחרה')
    // סיבה שאינה 'אחר' ⇒ פירוט ריק נשלח כ-null ולא כמחרוזת ריקה: `rejection_notes` הוא
    // עמודה שהפילוח בלשונית "נדחו" נשען עליה, ומחרוזת-ריקה שם היא "יש פירוט" שקרי.
    expect(sent.rejection_notes).toBeNull()
    expect(targetUrl).toContain('quote_id=eq.')
  })

  test('סיבה "אחר" עם פירוט — הטקסט מגיע בפועל לעמודה (4.3b ③)', async ({ page }) => {
    // 🟡 פער ③ (4.3b): הבדיקה שממעל מוכיחה רק את חצי-השלילה (סיבה רגילה ⇒ notes=null).
    // אף בדיקה לא הוכיחה שפירוט **שכן** מולא באמת מגיע לעמודה — ועליה נשען פילוח-הסיבות
    // בלשונית "נדחו".
    let sent = null
    const NOTES_TEXT = 'הלקוח ביקש להקטין את התקציב וסירב להצעה המתוקנת'

    await page.route('**/rest/v1/quotes?*', async (route) => {
      const req = route.request()
      if (req.method() !== 'PATCH') return route.continue()
      sent = req.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ quote_id: 0, quote_status: 'rejected' }]),
      })
    })

    await openRejectDialog(page)
    await page.locator('input[name="rejection-reason"][value="אחר"]').check()
    await page.getByTestId('reject-notes').fill(NOTES_TEXT)
    await page.getByTestId('reject-confirm').click()

    await expect(page.getByTestId('toast-success')).toBeVisible()
    expect(sent).not.toBeNull()
    expect(sent.rejection_reason).toBe('אחר')
    expect(sent.rejection_notes).toBe(NOTES_TEXT)
  })
})

test.describe('הצעה שנדחתה נעולה — והנעילה בשרת, לא בכפתור שהוסתר (4.2)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('אין פעולות-עריכה על השורה, והעדכון הישיר נופל על טריגר-הנעילה', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-rejected').click()

    const row = page.getByTestId(`quote-row-${REJECTED_QUOTE_ID}`)
    await expect(row).toBeVisible({ timeout: 30_000 })
    // בקרת-חיוב: המסמך **כן** נגיש — אחרת "אין כפתורים" היה יכול לנבוע ממסך שבור.
    await expect(page.getByTestId(`quote-document-${REJECTED_QUOTE_ID}`)).toBeVisible()
    await expect(page.getByTestId(`quote-edit-${REJECTED_QUOTE_ID}`)).toHaveCount(0)
    await expect(page.getByTestId(`quote-approve-${REJECTED_QUOTE_ID}`)).toHaveCount(0)
    await expect(page.getByTestId(`quote-reject-${REJECTED_QUOTE_ID}`)).toHaveCount(0)

    // 🔒 **כתיבה אמיתית שחייבת להידחות.** זו הדלת שעוקפת את המסך: JWT של מנכ"ל (edit),
    // כלומר ה-RLS מתיר את הבקשה והיא מגיעה עד הטריגר. ⚠️ הערך הנשלח הוא **בדיוק הערך
    // שכבר יושב בשורה** (`null`) — כך שגם אילו הנעילה הייתה שבורה, לא היה נכתב שום דבר
    // חדש למסד; הבדיקה עדיין נכשלת ומדווחת, אבל בלי לזהם שורה אמיתית.
    const denied = await page.evaluate(
      async ({ url, anon, id }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const res = await fetch(`${url}/rest/v1/quotes?quote_id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ rejection_notes: null }),
        })
        return { status: res.status, body: await res.json() }
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON, id: REJECTED_QUOTE_ID },
    )

    expect(denied.status).toBeGreaterThanOrEqual(400)
    expect(denied.body?.code).toBe('P0001')
    // 🔒 חוזה: תחילית ה-RAISE של `enforce_quote_in_progress_lock`, שממנה גם
    // `SERVER_MESSAGE_RULES` מזהה את המקרה. שינוי הניסוח במסד שובר את שניהם.
    expect(denied.body?.message).toContain('הצעה נעולה')
  })

  test('טריגר-הנעילה על quote_services (הענף שמעולם לא רץ) חוסם UPDATE וגם DELETE (4.3b ①)', async ({
    page,
  }) => {
    // 🔴 פער ① (4.3b): `enforce_quote_in_progress_lock` מותקן פעמיים — על `quotes` הוא קורא
    // OLD.quote_status ישירות, ועל `quote_services` הוא רץ תת-שאילתה (ענף נפרד לגמרי,
    // מיגרציה 20260723115000 שורות 40-41 + טריגר `quote_services_lock_non_in_progress`
    // שורות 53-55, `before update or delete`). זה הענף ששומר על הקפאת-שורות של הצעה
    // מאושרת/דחויה — ומעולם לא נבדק ישירות. line_id=19 = השורה הראשונה (04ST) של הצעה #11
    // (נדחתה, 'תקציב לקוח').
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const LOCKED_LINE_ID = 19

    async function callRest(method) {
      return page.evaluate(
        async ({ url, anon, id, method }) => {
          const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
          const token = JSON.parse(sessionStorage.getItem(key)).access_token
          const res = await fetch(`${url}/rest/v1/quote_services?line_id=eq.${id}`, {
            method,
            headers: {
              apikey: anon,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            ...(method === 'PATCH' ? { body: JSON.stringify({ notes: null }) } : {}),
          })
          return { status: res.status, body: await res.json() }
        },
        { url: SUPABASE_URL, anon: SUPABASE_ANON, id: LOCKED_LINE_ID, method },
      )
    }

    // 🔒 תנאי-קדם שלא סומך על מדידת-לילה (הכרעת-מנהל 01/08/2026): קוראים את השורה קודם
    // ונכשלים ברעש אם ההנחה לא מחזיקה — אחרת ה-PATCH למטה לא היה באמת no-op.
    const before = await callRest('GET')
    expect(before.status).toBe(200)
    expect(before.body).toHaveLength(1)
    expect(before.body[0].notes, 'תנאי-הקדם נשבר: השורה כבר לא notes=null').toBeNull()

    // UPDATE — ערך זהה-לקיים: גם אילו הטריגר היה שבור, שום דבר לא היה נכתב מחדש.
    const patchDenied = await callRest('PATCH')
    expect(patchDenied.status).toBeGreaterThanOrEqual(400)
    expect(patchDenied.body?.code).toBe('P0001')
    expect(patchDenied.body?.message).toContain('הצעה נעולה')

    // DELETE — הענף השני שאותו טריגר מגן עליו (`before update or delete`).
    const deleteDenied = await callRest('DELETE')
    expect(deleteDenied.status).toBeGreaterThanOrEqual(400)
    expect(deleteDenied.body?.code).toBe('P0001')
    expect(deleteDenied.body?.message).toContain('הצעה נעולה')

    // קריאה-חזרה: השורה עדיין קיימת ובלתי-משתנה — לא רק "קיבלנו שגיאה".
    const after = await callRest('GET')
    expect(after.body).toHaveLength(1)
    expect(after.body[0]).toEqual(before.body[0])
  })
})

test.describe('התפוגה מגיעה למסך כמו כל דחייה אחרת (4.2)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('לשונית "נדחו": שלוש שורות, פילוח-סיבות, ו"פג תוקף" ביניהן', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-rejected').click()
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    await expect(page.locator('[data-testid^="quote-row-"]')).toHaveCount(REJECTED_COUNT)

    // 🔒 חוזה: שלוש המחרוזות הן ערכי `quotes_rejection_reason_check` במסד, לא תוויות-מסך.
    // ‏'פג תוקף' הוא היחיד שאיש אינו יכול לבחור בחלון — **רק עבודת-הרקע כותבת אותו**
    // (§7.41), ולכן הופעתו כאן היא ההוכחה שמסלול-התפוגה נגמר במקום הנכון על המסך.
    const breakdown = page.getByTestId('rejection-breakdown')
    await expect(breakdown).toContainText('פג תוקף')
    await expect(breakdown).toContainText('תקציב לקוח')
    await expect(breakdown).toContainText('נבחר מתחרה')
  })

  test('הצעה שפגה אינה ניתנת להחייאה — אין לה שום פעולה מלבד צפייה', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await page.getByTestId('quotes-tab-rejected').click()
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    // §7.41: "expiry ⇒ rejected + 'פג תוקף', no revival". השורה שנושאת את הסיבה הזו
    // מאותרת דרך הפילוח שכבר אומת למעלה; כאן נבדק שאין עליה דרך חזרה.
    const expiredRow = page.locator('[data-testid^="quote-row-"]', { hasText: 'פג תוקף' }).first()
    await expect(expiredRow).toBeVisible()
    await expect(expiredRow.locator('[data-testid^="quote-approve-"]')).toHaveCount(0)
    await expect(expiredRow.locator('[data-testid^="quote-edit-"]')).toHaveCount(0)
    await expect(expiredRow.locator('[data-testid^="quote-reject-"]')).toHaveCount(0)
  })
})

test.describe('מסנן "פג בקרוב" — 7 הימים שאי-אפשר להוכיח על הדאטה האמיתית (4.2)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('על הנתונים האמיתיים הצ׳יפ קיים ומושבת — כי אין אף הצעה שפגה בקרוב', async ({ page }) => {
    // נמדד 31/07: כל 8 ההצעות עודכנו 29/07 וימי-התוקף=30 ⇒ נותרו 28 ימים לכולן.
    // הצ'יפ מושבת ב-0 בכוונה (הכרעת-ישי) — אין למה לסנן.
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    const chip = page.getByTestId('quotes-chip-expiring')
    await expect(chip).toBeVisible()
    await expect(chip).toBeDisabled()
  })

  test('עם הצעות מומצאות ברשת — סופר 2 מתוך 3 ומסנן אליהן בלבד', async ({ page }) => {
    // ⚠️ **אין סביבת-בדיקה** — אסור להזריק שורות למסד כדי לבדוק את כלל ה-7-ימים.
    // התבנית המאושרת (`src/CLAUDE.md`): מחזירים שורות מומצאות ברשת. המסך מחשב עליהן באמת,
    // המסד לא שומע. ⚠️ הנתונים **מגוונים בכוונה** — סט אחיד היה מאמת "כל שורה ≤ קודמתה"
    // ועובר גם על סינון שבור.
    const day = 24 * 60 * 60 * 1000
    const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()
    const base = {
      quote_status: 'in_progress',
      customer_id: 46,
      estimated_event_date: '2026-12-01',
      estimated_guests: 100,
      recommended_hostess_count: 2,
      applied_customer_discount: 0,
      manual_discount: 0,
      vat_rate_snapshot: null,
      rejection_reason: null,
      rejection_notes: null,
      notes: null,
      issue_date: '2026-07-01',
      quote_services: [],
      customers: {
        customer_id: 46,
        company_name: 'לקוח בדיקה',
        contact_name: 'א',
        phone: '',
        email: '',
      },
    }
    await page.route('**/rest/v1/quotes?select=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          // 26 ו-28 ימי-הזדקנות ⇒ נותרו 4 ו-2 ימים ⇒ שניהם "פג בקרוב" (≤7)
          { ...base, quote_id: 9001, event_name: 'פג בעוד 4', updated_at: iso(26 * day) },
          { ...base, quote_id: 9002, event_name: 'פג בעוד 2', updated_at: iso(28 * day) },
          // טרייה — חייבת להישאר בחוץ, אחרת "מסנן" שמחזיר הכול היה עובר
          { ...base, quote_id: 9003, event_name: 'טרייה', updated_at: iso(1 * day) },
        ]),
      })
    })

    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="quote-row-"]')).toHaveCount(3)

    const chip = page.getByTestId('quotes-chip-expiring')
    await expect(chip).toBeEnabled()
    await expect(chip).toContainText('2')

    await chip.click()
    await expect(page.locator('[data-testid^="quote-row-"]')).toHaveCount(2)
    await expect(page.getByTestId('quote-row-9001')).toBeVisible()
    await expect(page.getByTestId('quote-row-9002')).toBeVisible()
    await expect(page.getByTestId('quote-row-9003')).toHaveCount(0)

    // לחיצה שנייה מבטלת — הכרעת-ישי: זה כפתור-מסנן, לא אריח-מדד.
    await chip.click()
    await expect(page.locator('[data-testid^="quote-row-"]')).toHaveCount(3)
  })
})

test.describe('מנהלת פרויקטים: אותו מסך, אותן שלוש הפעולות (4.3)', () => {
  test.skip(
    !PROJECTS_EMAIL || !PROJECTS_PASSWORD,
    'E2E_PROJECTS_EMAIL/E2E_PROJECTS_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('בעלת edit שאינה מנכ"ל רואה עריכה/אישור/דחייה על הצעה פתוחה', async ({ page }) => {
    // ⚠️ בקרת-חיוב לבדיקות-השלילה של 4.1 (מנהלת כספים = view ⇒ אפס כפתורים): בלעדיה,
    // "0 כפתורים" יכול לנבוע ממסך שבור ולא מההרשאה. כאן אותו מסך **כן** מציג אותם.
    // §7.82/F19: אין הפרדת-חובות — edit על 'הצעות מחיר' = יצירה+עריכה+אישור+דחייה.
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await page.goto('/quotes')
    await expect(page.getByTestId('quotes-table')).toBeVisible({ timeout: 30_000 })

    await expect(page.getByTestId(/^quote-edit-/).first()).toBeVisible()
    await expect(page.getByTestId(/^quote-approve-/).first()).toBeVisible()
    await expect(page.getByTestId(/^quote-reject-/).first()).toBeVisible()
  })
})

test.describe('הנחות חורגות מ-100% במסך-הבנייה — הפאנל לא נעלם בלי הסבר (ממצא-אודיט 01/08)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  // ⚠️ computeQuoteTotals (pricing.js) זורק כשסכום ההנחות >100% — טעות-הקלדה קלאסית
  // (100 במקום 10). לפני התיקון `totals` היה הופך `null` וה-`{totals && <QuoteSummaryPanel/>}`
  // היה גורם לפאנל **כולו** (כולל כפתור השמירה) להיעלם בלי שום הודעה — ואין דרך להגיע
  // ל-`errors.manualDiscount` כי הוא תלוי ב-`submitAttempted`, שנקבע רק בלחיצה על אותו
  // כפתור שנעלם. הבדיקה מוכיחה: (1) ההודעה מופיעה, (2) שום בקשת-כתיבה לא יוצאת, (3) תיקון
  // ההנחה מחזיר את הפאנל.
  test('הנחה ידנית 150% — הודעה מוסברת במקום פאנל נעלם, ואפס כתיבות', async ({ page }) => {
    const writes = countQuoteWrites(page)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes/new')

    await expect(page.getByTestId('quote-summary')).toBeVisible({ timeout: 30_000 })

    const manualDiscount = page.locator('#quote-manual-discount')
    await manualDiscount.fill('150')
    await manualDiscount.blur()

    // הפאנל (וכפתור השמירה שבתוכו) נעלם, וההודעה המוסברת תופסת את מקומו.
    await expect(page.getByTestId('quote-summary')).toHaveCount(0)
    const blocked = page.getByTestId('quote-totals-blocked')
    await expect(blocked).toBeVisible()
    await expect(blocked).toContainText('חורגות מ-100%')

    // תיקון ההנחה — הפאנל חוזר.
    await manualDiscount.fill('10')
    await manualDiscount.blur()
    await expect(page.getByTestId('quote-totals-blocked')).toHaveCount(0)
    await expect(page.getByTestId('quote-summary')).toBeVisible()

    expect(writes).toHaveLength(0)
  })
})

test.describe('שמירה פותחת את חלון-השליחה (C5 §5.5.4 "שמור ושלח", 01/08)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  // ⚠️ **הבדיקה הזו חייבת לרוץ בלי לשמור הצעה אמיתית, וזו לא קפדנות — זו נכונות.**
  // מסלול-השמירה יוצר שורה; בדיקה שרצה בכל gate הייתה מוסיפה הצעה **בכל ריצה** למסד
  // החי (אין סביבת-בדיקה נפרדת), מנפחת את דאטת-הדמו, ושוברת כל אסרטה שסופרת שורות —
  // בדיוק הצימוד שכבר נשך שלוש פעמים היום. לכן `create_quote` ו-`getQuote` מיורטים,
  // והמסך מרנדר שורה מומצאת. **אפס כתיבות.**
  const FAKE_ID = 9101

  test('שמירה ⇒ חלון-השליחה נפתח על ההצעה השמורה, והכפתור פעיל — בלי כתיבה ובלי מייל', async ({
    page,
  }) => {
    const writes = countQuoteWrites(page)
    let rpcCalled = 0

    // ⛔ שום מייל לא יוצא, בשום מקרה.
    await page.route('**/functions/v1/send-email', (route) => route.abort())

    // ה-RPC מחזיר את המזהה החדש — זה בדיוק התפר שהיה מנותק (ערך-ההחזרה נזרק).
    await page.route('**/rest/v1/rpc/create_quote', async (route) => {
      rpcCalled += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_ID),
      })
    })

    // השליפה החוזרת של השורה השמורה. `in_progress` הוא מה שהופך את הכפתור לפעיל
    // (`isQuoteSendable`), ו-`customers` **לא** מוחזר כאן במכוון — העמוד מזריק אותו
    // מהלקוח שנבחר, וזו בדיוק ההתנהגות שהבדיקה נועלת.
    await page.route(`**/rest/v1/quotes?*quote_id=eq.${FAKE_ID}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          quote_id: FAKE_ID,
          quote_status: 'in_progress',
          customer_id: 46,
          event_name: 'בדיקת שמור-ושלח',
          issue_date: '2026-08-01',
          updated_at: new Date().toISOString(),
          estimated_event_date: '2026-12-01',
          estimated_location: 'אולם בדיקה',
          estimated_start_time: '10:00:00',
          estimated_end_time: '14:00:00',
          estimated_guests: 100,
          recommended_hostess_count: 2,
          applied_customer_discount: 0,
          manual_discount: 0,
          vat_rate_snapshot: null,
          notes: null,
          quote_services: [
            {
              line_id: 1,
              line_number: 1,
              sku: '04ST',
              qty: 1,
              closing_unit_price: 500,
              closing_unit_cost: 300,
              color: null,
              notes: null,
            },
          ],
        }),
      })
    })

    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes/new')
    await expect(page.getByTestId('quote-summary')).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('quote-customer-search').fill('מדיטק')
    await page.locator('[data-testid^="quote-customer-option-"]').first().click()
    await page.getByTestId('quote-event-name').fill('בדיקת שמור-ושלח')
    await page.getByTestId('quote-event-date').fill('2026-12-01')
    await page.getByTestId('quote-location').fill('אולם בדיקה')
    await page.locator('#quote-start-time').fill('10:00')
    await page.locator('#quote-end-time').fill('14:00')
    await page.locator('#quote-guests').fill('100')
    await page.getByTestId('quote-line-add').click()
    await page.locator('[data-testid^="quote-line-product-"]').last().click()
    await page.getByRole('option').filter({ hasText: 'שירותי דיילת (4 שעות)' }).first().click()

    await page.getByTestId('quote-save').click()

    // 🎯 הטענה: החלון נפתח **על ההצעה השמורה** והכפתור פעיל — לא תצוגה-מקדימה חסרת-שליחה.
    await expect(page.getByTestId('quote-document-title')).toBeVisible({ timeout: 30_000 })
    const send = page.getByTestId('quote-document-send')
    await expect(send).toBeVisible()
    await expect(send).toBeEnabled()
    // ובלי סיבת-השבתה. ⚠️ הקוד כותב `title={disabledReason || undefined}`, כלומר כשאין
    // סיבה **התכונה נעדרת** ואינה מחרוזת ריקה — לכן `toHaveAttribute('title','')` נכשל
    // (נתפס בהרצה). זו האסרטה הנכונה, והיא זו שתתפוס "אין תבנית מייל"/"אין כתובת".
    expect(await send.getAttribute('title')).toBeNull()

    // ה-RPC אכן נקרא — אחרת הבדיקה "עוברת" כי כלום לא קרה.
    expect(rpcCalled).toBe(1)
    // ובקרת-הכתיבות: אף בקשה אמיתית לא הגיעה לטבלת ההצעות (ה-RPC יורט).
    expect(writes).toHaveLength(0)

    // סגירת החלון מחזירה לרשימה — ההתנהגות שהחליפה את הניווט-המיידי.
    await page.getByTestId('quote-document-title').press('Escape')
    await expect(page).toHaveURL(/\/quotes$/, { timeout: 15_000 })
  })

  // 🛡️ **השומר שכל הפיצ'ר נשען עליו — וזו הצפייה בו נכשל.**
  // ‏`handleSave` מפוצל לשני `try` בדיוק בשביל המסלול הזה: כשהשמירה הצליחה אך השליפה
  // החוזרת נכשלה, ה-`catch` של השמירה היה מכריז **"שמירת ההצעה נכשלה"** על הצעה שכבר
  // יושבת במסד — ומשתמש שיאמין להודעה ישמור שוב ויקבל **הצעה כפולה**.
  // עד עכשיו הפיצול היה **כתוב ולא נצפה**; כאן הוא נצפה.
  test('השליפה-החוזרת נכשלת אחרי שמירה מוצלחת — נאמר שההצעה נשמרה, ולא שנכשלה', async ({
    page,
  }) => {
    let rpcCalled = 0
    await page.route('**/functions/v1/send-email', (route) => route.abort())

    await page.route('**/rest/v1/rpc/create_quote', async (route) => {
      rpcCalled += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_ID),
      })
    })

    // ⚠️ היירוט ממוקד ל-**מזהה המומצא בלבד**, ולכן אינו נוגע בטעינת-המסך הרגילה:
    // הוא יורה רק על השליפה שאחרי השמירה.
    await page.route(`**/rest/v1/quotes?*quote_id=eq.${FAKE_ID}*`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    )

    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes/new')
    await expect(page.getByTestId('quote-summary')).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('quote-customer-search').fill('מדיטק')
    await page.locator('[data-testid^="quote-customer-option-"]').first().click()
    await page.getByTestId('quote-event-name').fill('בדיקת כשל-שליפה')
    await page.getByTestId('quote-event-date').fill('2026-12-01')
    await page.getByTestId('quote-location').fill('אולם בדיקה')
    await page.locator('#quote-start-time').fill('10:00')
    await page.locator('#quote-end-time').fill('14:00')
    await page.locator('#quote-guests').fill('100')
    await page.getByTestId('quote-line-add').click()
    await page.locator('[data-testid^="quote-line-product-"]').last().click()
    await page.getByRole('option').filter({ hasText: 'שירותי דיילת (4 שעות)' }).first().click()

    await page.getByTestId('quote-save').click()

    // 🎯 הטענה: ההודעה אומרת שההצעה **נשמרה** — ומפנה לשלוח אותה ממסך ההצעות.
    const errorToast = page.getByTestId('toast-error')
    await expect(errorToast).toBeVisible({ timeout: 30_000 })
    await expect(errorToast).toContainText('ההצעה נשמרה')
    // ⛔ ובשום אופן לא ההודעה שהייתה מופיעה לפני הפיצול — זו שגורמת לשמירה כפולה.
    await expect(errorToast).not.toContainText('שמירת ההצעה נכשלה')

    // ולא נשארים תקועים בטופס: המשתמש מוחזר לרשימה, שם ההצעה קיימת.
    await expect(page).toHaveURL(/\/quotes$/, { timeout: 15_000 })
    expect(rpcCalled).toBe(1)
  })
})

test.describe('עלות-רכש לא-ידועה — מקפים, לא רווחיות 100% (סבב-התיקון פריט 2, 01/08)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  // ⚠️ **למה דווקא E2E ולא בדיקת-יחידה, למרות ש-E2E אינו רץ ב-CI:** הפער שהבדיקה הזו סוגרת
  // אינו ב-`src/lib/quotes.js` (שם יש כבר 4 בדיקות-יחידה חוסמות-gate) אלא ב-`repriceLine`
  // שבתוך `QuoteLineEditor.jsx` — אחד מארבעת אתרי-ה-`?? 0` המקוריים. מי שיחזיר שם `?? 0`
  // **לא יפיל אף בדיקת-יחידה**, כי הפונקציה אינה מיוצאת ואינה נבדקת. רק אסרטה על הפאנל
  // **המרונדר** רואה את ההרכבה בפועל. נצפתה נכשלת על `?? 0` שהוחזר בכוונה (תנאי-המנהל).
  //
  // ⚠️ אפס כתיבות: מדמים "מוצר בלי שורת-עלות" ביירוט-רשת בלבד — הסרת `product_costs`
  // מתשובת-הקטלוג היא בדיוק מה שה-LEFT join מחזיר למי שאין לו הרשאת-עלות. אסור להזריק
  // שורות למסד (אין סביבת-בדיקה נפרדת — `src/CLAUDE.md`).
  async function stripProductCosts(page) {
    const counter = { intercepted: 0 }
    await page.route('**/rest/v1/products**', async (route) => {
      const res = await route.fetch()
      let body
      try {
        body = await res.json()
      } catch {
        return route.fulfill({ response: res })
      }
      if (Array.isArray(body) && body.some((r) => 'product_costs' in r)) {
        counter.intercepted += 1
        body = body.map((r) => ({ ...r, product_costs: null }))
      }
      await route.fulfill({ response: res, body: JSON.stringify(body) })
    })
    return counter
  }

  async function addProductLine(page, productText) {
    await page.getByTestId('quote-line-add').click()
    await page.locator('[data-testid^="quote-line-product-"]').last().click()
    await page.getByRole('option').filter({ hasText: productText }).first().click()
  }

  test('מוצר בלי עלות ⇒ שלושת השדות מקפים + שם המוצר, ואפס כתיבות', async ({ page }) => {
    const writes = countQuoteWrites(page)
    const counter = await stripProductCosts(page)
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes/new')
    await expect(page.getByTestId('quote-profitability')).toBeVisible({ timeout: 30_000 })

    await addProductLine(page, 'תג שם רגיל')

    const notice = page.getByTestId('quote-cost-unknown')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('תג שם רגיל')

    // ⚠️ האסרטה האמיתית: **אין מספר** בשדות-הרווחיות. בלי זה, בדיקה שרואה רק את ההודעה
    // הייתה עוברת גם על פאנל שמציג "0 ₪" לצידה — כלומר בדיוק הבאג.
    const panel = page.getByTestId('quote-profitability')
    await expect(panel).toContainText('—')
    await expect(panel).not.toContainText('₪')

    // ביקורת-שפיות: היירוט באמת פעל. בלעדיה הבדיקה יכולה "לעבור" כי כלום לא קרה.
    expect(counter.intercepted).toBeGreaterThan(0)
    expect(writes).toHaveLength(0)
  })

  // בקרת-חיוב: בלי היירוט אותו מסך **חייב** להציג מספרים. בלי הכיוון הזה, "מקפים תמיד"
  // היה עובר את הבדיקה שמעל בירוק מלא.
  test('בקרת-חיוב — עם עלות ידועה מוצגים מספרים ואין הודעה', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await page.goto('/quotes/new')
    await expect(page.getByTestId('quote-profitability')).toBeVisible({ timeout: 30_000 })

    await addProductLine(page, 'תג שם רגיל')

    await expect(page.getByTestId('quote-cost-unknown')).toHaveCount(0)
    await expect(page.getByTestId('quote-profitability')).toContainText('₪')
  })
})
