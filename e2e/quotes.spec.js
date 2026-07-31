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
