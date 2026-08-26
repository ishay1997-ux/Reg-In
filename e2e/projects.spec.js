import { test, expect } from '@playwright/test'

// E2E מודול 6 — **מבט-העל והכרטיס, קריאה-בלבד** (צעד 5.1).
//
// ⚠️ **אפס כתיבות למסד.** אין סביבת-בדיקה נפרדת (e2e/CLAUDE.md) — כל מצב שאינו קיים
// בדאטה החיה מיוצר ב**יירוט-רשת** (`page.route`) בלבד, לעולם לא בהזרקת שורות. הקובץ
// הזה אינו לוחץ על שום פקד שכותב: לא "שמור ושלח", לא "בטל את הפרויקט", לא "עדכן ושלח".
//
// 🔒 A10 — בחירת-נושא בזמן-ריצה לפי תנאי, לעולם לא project_id קשיח: הלוח החי משתנה
// (סגירת #7 חד-פעמית, ביטול מכלה פרויקט לצמיתות), ופיקסטורה נעוצה מרקיבה לבד
// (e2e/CLAUDE.md: ההצעות #6/#8 כבר הוכיחו זאת פעמיים). נושא שאינו קיים ⇒ דילוג מנומק
// בשם, לעולם לא "עבר בירוק כי לא היה על מה לרוץ".
//
// 🔑 הטענה המרכזית של הקובץ: חמשת התפקידים רואים את המסך לפי מטריצת-ההרשאות החיה
// (module-6.md, Carry-forward ①), וההבחנה ריק-כדין/חסום/תקלה בלשונית-הלוגיסטיקה
// נקראת שונה בכל אחד משלושת המצבים (S-26 — הכשל השקט המסוכן של המודול).

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD
const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// המסך נטען כשמופיעה הטבלה או אחד ממצבי-הריק — טעינה ("שלד") אינה "נטען".
async function gotoProjects(page, query = '') {
  await page.goto(`/projects${query}`)
  await expect(page.getByTestId('projects-page')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('projects-tabs-skeleton')).toHaveCount(0, { timeout: 30_000 })
}

// שורות מבט-העל. פרויקט אינו ניתן למחיקה (אין DELETE בשום מסלול) ⇒ "≥ 1 שורה" היא
// טענה יציבה לכל תפקיד עם הרשאה — וזו הבקרה החיובית של e2e/CLAUDE.md: אפס שורות
// אצל תפקיד מורשה = הזדהות/RLS שבורים, לא "אין דאטה".
const ROW_SELECTOR = '[data-testid^="projects-row-"]'

// שני נוסחי-הריק של המסך — הבדיקה נועלת שהם **שונים** (④: אסור לאחד את המצבים).
const TRUE_EMPTY_TITLE = 'עדיין אין פרויקטים במערכת.'
const FILTERED_EMPTY_TITLE = 'אין פרויקט התואם למסנן שבחרת.'

// ── חמשת התפקידים: המסך נטען, בלי מצב-שגיאה, עם ≥ 1 שורה ────────────────────────────
// כל התפקידים מחזיקים ≥ view על 'פרויקטים' (המטריצה החיה, Carry-forward ①) ⇒ ה-RPC
// מחזיר את כל השורות לכולם. תפקיד שנחסם כאן = סחף-מטריצה, וזה בדיוק מה שצריך להאדים.
const FIVE_ROLES = [
  ['מנכ"ל', CEO_EMAIL, CEO_PASSWORD, 'E2E_CEO_*'],
  ['מנהלת פרויקטים', PROJECTS_EMAIL, PROJECTS_PASSWORD, 'E2E_PROJECTS_*'],
  ['מנהלת לוגיסטיקה', STAFF_EMAIL, STAFF_PASSWORD, 'E2E_STAFF_*'],
  ['מנהלת גיוס ושיבוץ', RECRUIT_EMAIL, RECRUIT_PASSWORD, 'E2E_RECRUIT_*'],
  ['מנהלת כספים ולקוחות', FINANCE_EMAIL, FINANCE_PASSWORD, 'E2E_FINANCE_*'],
]

test.describe('מודול 6 · מבט-העל — חמשת התפקידים', () => {
  for (const [roleName, email, password, envName] of FIVE_ROLES) {
    test(`${roleName} — המסך נטען עם שורות אמיתיות, בלי מצב-שגיאה`, async ({ page }) => {
      test.skip(!email || !password, `${envName} לא הוגדרו ב-.env.local`)
      await login(page, email, password)
      await gotoProjects(page)

      // הבקרה החיובית — במיוחד למנכ"ל (edit על הכול): ריק אצלו = הזדהות שבורה.
      await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 15_000 })
      await expect(page.getByTestId('projects-error')).toHaveCount(0)
      // המסך מזוהה כמסך האמיתי, לא "בבנייה" — ההגנה מפני רגרסיית-ניתוב של 4.1.
      await expect(page.getByTestId('projects-table')).toBeVisible()
    })
  }
})

// ── מנהלת לוגיסטיקה: מה היא רואה ומה מוסתר ממנה ─────────────────────────────────────
test.describe('מודול 6 · מבט-העל והכרטיס — מנהלת לוגיסטיקה', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  test('רואה מוני-לוגיסטיקה אמיתיים, ו"הכנסה מתוכננת" מציגה — (חסימת הצעות-מחיר)', async ({
    page,
  }) => {
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoProjects(page)

    // ללוגיסטיקה שלה edit ⇒ עמודת הלוגיסטיקה חיה אצלה: לפחות שורה אחת נושאת יחס N/M
    // או "✓" (פרויקט בלי פריטים) — לעולם לא "—" גורף, שהיה אומר שהמודול שלה חסום.
    const rowsText = await page.locator(ROW_SELECTOR).allTextContents()
    expect(
      rowsText.some((t) => /\d+\/\d+/.test(t) || t.includes('✓')),
      'אף שורה אינה מציגה מונה-לוגיסטיקה — המודול שלה נראה חסום',
    ).toBe(true)

    // בכרטיס (הנושא נבחר בזמן-ריצה — השורה הראשונה): ההכנסה המתוכננת חסומה בפניה.
    // planned_revenue חוזר NULL למי שאין לה 'הצעות מחיר' ⇒ '—', לעולם לא '0.00 ₪'
    // (S-2 — 0 היה עובדה שקרית).
    await page.locator(ROW_SELECTOR).first().click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('project-cell-revenue')).toContainText('—')
    await expect(page.getByTestId('project-cell-revenue')).not.toContainText('₪')

    // טענת-מסך (לא גבול-אבטחה — Carry-forward ①): פקדי "שינוי תכולה" ו"ביטול פרויקט"
    // אינם מוצגים לה בשום מקום בכרטיס.
    await expect(page.getByTestId('project-card-scope-button')).toHaveCount(0)
    await expect(page.getByTestId('project-card-cancel-button')).toHaveCount(0)
    await page.getByTestId('project-tab-team').click()
    // ממתינים לאריח שקיים בכל וריאנט-תוכן של הלשונית — `team-tab` לבדו מרונדר גם בשלד,
    // וספירת-כפתור על שלד הייתה עוברת ריקה מתוכן.
    await expect(page.getByTestId('team-tile-required')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('team-scope-button')).toHaveCount(0)
  })
})

// ── מנהלת גיוס: לשונית-לוגיסטיקה חסומה נקראת "חסומה", לא "ריקה" ולא "שבורה" ─────────
test.describe('מודול 6 · הכרטיס — מנהלת גיוס ושיבוץ', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('לשונית הלוגיסטיקה מציגה מצב-חסימה (🔒) — לא "לא הוזמנו מוצרים" ולא שגיאה', async ({
    page,
  }) => {
    // היא ➖ גם על 'לוגיסטיקה' וגם על 'הצעות מחיר' ⇒ רשימת-הפריטים חוזרת ריקה בלי שגיאה.
    // 🔄 עודכן 27/08/2026 (אודיט-סגירת-מ5, אשרור-ישי "בצע הכל לפי המלצה שלך"): מאז
    // `bde057a` המבחין **הראשון** הוא מפת-ההרשאות שלה על 'לוגיסטיקה' — לא ההצעה — ולכן
    // הענף, ה-testid והנוסח חדשים: `TAB_NO_PERMISSION_SENTENCE` (הגרסה המדויקת-יותר, על
    // *הלוגיסטיקה* ולא על *ההצעה*). הבדיקה הקודמת הכירה את המסך הישן ונפלה בצדק.
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await gotoProjects(page, '?tab=all')

    // הנושא בזמן-ריצה: הפרויקט הראשון שנוצר מהצעה (יש לו quote_id ⇒ המבחין רלוונטי).
    // כל פרויקט נולד מאישור-הצעה, ולכן השורה הראשונה מספיקה; אם אין שורות — הבדיקה
    // הקודמת (חמשת-התפקידים) כבר האדימה.
    await page.locator(ROW_SELECTOR).first().click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })

    // לשונית-הלוגיסטיקה היא ברירת-המחדל של הכרטיס.
    const blocked = page.getByTestId('logistics-state-no-permission-logistics')
    await expect(blocked).toBeVisible({ timeout: 15_000 })
    await expect(blocked).toContainText(
      'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין.',
    )
    // ולא אחד מהמצבים האחרים — ההבחנה היא הטענה, לא הנוכחות (כולל הענף הישן, שאסור
    // שיופיע אצל חסומת-לוגיסטיקה).
    await expect(page.getByTestId('logistics-state-no-permission')).toHaveCount(0)
    await expect(page.getByTestId('logistics-state-legal-empty')).toHaveCount(0)
    await expect(page.getByTestId('logistics-state-error')).toHaveCount(0)
    await expect(page.getByTestId('logistics-state-broken')).toHaveCount(0)
  })
})

// ── שני מצבי-הריק של מבט-העל נקראים שונה ────────────────────────────────────────────
test.describe('מודול 6 · מבט-העל — מצבי-ריק', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('ריק-אחרי-סינון: נוסח משלו + "נקה סינון" — שונה מנוסח הריק-האמיתי', async ({ page }) => {
    await gotoProjects(page, '?tab=all')

    // הסטטוס הריק נבחר בזמן-ריצה מגלולה שמונה 0 (מכובה ⇒ לא לחיצה — מגיעים אליה דרך
    // הכתובת, S-18: מצב-התצוגה חי ב-URL). אין גלולת-0 ⇒ אין דרך לגיטימית למצב הזה היום.
    const disabledPill = page.locator('[data-testid^="projects-pill-"][disabled]').first()
    const hasZeroPill = (await disabledPill.count()) > 0
    test.skip(!hasZeroPill, 'אין סטטוס עם 0 פרויקטים בלוח החי — אין דרך לריק-אחרי-סינון היום')

    const status = (await disabledPill.getAttribute('data-testid')).replace('projects-pill-', '')
    await gotoProjects(page, `?tab=all&status=${status}`)

    const filtered = page.getByTestId('projects-empty-filtered')
    await expect(filtered).toBeVisible()
    await expect(filtered).toContainText(FILTERED_EMPTY_TITLE)
    // הפעולה של המצב הזה הפוכה מזו של הריק-האמיתי: ניקוי-סינון, לא ניווט להצעות (④).
    await expect(page.getByTestId('projects-clear-filter')).toBeVisible()
    await expect(filtered).not.toContainText(TRUE_EMPTY_TITLE)
  })

  test('ריק-אמיתי (מיוצר ביירוט-רשת): נוסח משלו + קישור להצעות — ושונה מריק-אחרי-סינון', async ({
    page,
  }) => {
    // הריק-האמיתי אינו בר-השגה מול מסד חי שיש בו פרויקטים (פרויקט אינו נמחק לעולם) —
    // מיוצר בתבנית-הבית היחידה המותרת: יירוט תשובת ה-RPC (e2e/CLAUDE.md), אפס כתיבות.
    await page.route(
      (url) => url.pathname.includes('/rest/v1/rpc/list_projects_overview'),
      (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await gotoProjects(page)

    const empty = page.getByTestId('projects-empty-true')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText(TRUE_EMPTY_TITLE)
    // הפעולה: ניווט למסך שבו פרויקטים נולדים — אין "צור פרויקט" (S-5).
    await expect(page.getByTestId('projects-goto-quotes')).toBeVisible()
    // נעילת-ההבחנה: שני הנוסחים שונים (④ אוסר לאחד את המצבים).
    expect(TRUE_EMPTY_TITLE).not.toBe(FILTERED_EMPTY_TITLE)
    await expect(empty).not.toContainText(FILTERED_EMPTY_TITLE)
  })

  test('לשונית ריקה: המונה נשאר 0 על הלשונית, והנוסח חיובי — לא שגיאה', async ({ page }) => {
    await gotoProjects(page)

    // הנושא בזמן-ריצה: לשונית שמונה 0. בלוח של היום שלוש הלשוניות מאוישות ⇒ דילוג
    // מנומק — הטענה נדלקת מעצמה ביום שהלוח יתרוקן (למשל אחרי סגירת #7).
    const tabs = ['work', 'closing', 'all']
    let zeroTab = null
    for (const key of tabs) {
      const text = await page.getByTestId(`projects-tab-${key}`).textContent()
      if (/\b0\b/.test(text ?? '')) {
        zeroTab = key
        break
      }
    }
    test.skip(zeroTab === null, 'אין לשונית עם מונה 0 בלוח החי — המצב אינו בר-השגה היום')

    await page.getByTestId(`projects-tab-${zeroTab}`).click()
    const emptyTab = page.getByTestId('projects-empty-tab')
    await expect(emptyTab).toBeVisible()
    // ניסוח חיובי ("אין אירוע ש…"), לא נוסח-תקלה — והמונה 0 לא הוסתר מהלשונית (⑦).
    await expect(emptyTab).toContainText(/אין אירוע/)
    await expect(emptyTab).not.toContainText('לא ניתן לטעון')
    await expect(page.getByTestId(`projects-tab-${zeroTab}`)).toContainText('0')
  })
})

// ── לשונית-הלוגיסטיקה: ריק-כדין מול תקלה — שני נוסחים שונים ─────────────────────────
test.describe('מודול 6 · לשונית-לוגיסטיקה — ריק-כדין מול תקלה', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('ריק-כדין על פרויקט בלי מוצרים, ותקלה מיוצרת-ברשת — הנוסחים שונים', async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await gotoProjects(page, '?tab=all')

    // הנושא בזמן-ריצה לפי תנאי: הפרויקט הראשון שלשונית-הלוגיסטיקה שלו ריקה-כדין
    // (הצעה בלי שורות-מוצר — היום #11 עומד בזה, אבל לא ננעץ למספר). סורקים את הכרטיסים
    // לפי הסדר עד שנמצא אחד כזה.
    const ids = await page
      .locator(ROW_SELECTOR)
      .evaluateAll((rows) =>
        rows.map((row) => row.getAttribute('data-testid').replace('projects-row-', '')),
      )

    let legalEmptyText = null
    let subjectId = null
    for (const id of ids) {
      await page.goto(`/projects/${id}`)
      await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
      // מחכים שהלשונית תצא ממצב-טעינה: אחד מארבעת המצבים או הטבלה עצמה.
      await expect(
        page
          .getByTestId('logistics-state-legal-empty')
          .or(page.getByTestId('logistics-state-no-permission'))
          .or(page.getByTestId('logistics-state-error'))
          .or(page.getByTestId('logistics-state-broken'))
          .or(page.locator('[data-testid^="logistics-row-"]').first()),
      ).toBeVisible({ timeout: 20_000 })
      const legal = page.getByTestId('logistics-state-legal-empty')
      if ((await legal.count()) > 0) {
        legalEmptyText = await legal.textContent()
        subjectId = id
        break
      }
    }
    test.skip(
      subjectId === null,
      'אין פרויקט שהצעתו נטולת-מוצרים — הריק-כדין אינו בר-השגה בלוח החי היום',
    )

    // הנוסח של ריק-כדין: עובדה חיובית, לא תקלה.
    expect(legalEmptyText).toContain('לא הוזמנו מוצרים לאירוע הזה')

    // התקלה מיוצרת בתבנית-הבית: יירוט בקשת שורות-הלוגיסטיקה והפלתה — אפס כתיבות.
    await page.route(
      (url) => url.pathname.includes('/rest/v1/logistics'),
      (route) => route.abort(),
    )
    await page.goto(`/projects/${subjectId}`)
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    const error = page.getByTestId('logistics-state-error')
    await expect(error).toBeVisible({ timeout: 20_000 })
    const errorText = await error.textContent()

    // הטענה עצמה (S-26): אותו מסך, אותו פרויקט — שני מצבים, שני נוסחים שונים.
    expect(errorText).toContain('לא ניתן לטעון את הנתונים')
    expect(errorText).not.toBe(legalEmptyText)
    expect(errorText).not.toContain('לא הוזמנו מוצרים')
  })
})

// ── הכרטיס: לשונית-סגירה נעולה-עם-נימוק, והתא התשיעי נעדר משורה חיה ─────────────────
test.describe('מודול 6 · הכרטיס — פרויקט פעיל', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('לשונית-הסגירה מושבתת עם נימוק, ותא סיבת-הביטול אינו קיים על פרויקט שלא בוטל', async ({
    page,
  }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
    await gotoProjects(page)

    // הנושא בזמן-ריצה: השורה הראשונה בלשונית "בעבודה" — פעיל בהגדרה (לשונית-הסטטוסים
    // הפעילים). אין שורות ⇒ אין פרויקט פעיל היום ⇒ דילוג מנומק.
    const activeRows = page.locator(ROW_SELECTOR)
    test.skip(
      (await activeRows.count()) === 0,
      'אין פרויקט פעיל בלשונית "בעבודה" — הטענה על לשונית-סגירה נעולה ממתינה לנושא',
    )
    await activeRows.first().click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })

    // הלשונית קיימת, מושבתת, ומנומקת בתווית עצמה — מצב-חסימה נשאר ומנומק, לא נעלם.
    const closingTab = page.getByTestId('project-tab-closing')
    await expect(closingTab).toBeDisabled()
    await expect(page.getByTestId('project-tab-closing-reason')).toContainText(/נפתחת/)

    // התא התשיעי (סיבת-הביטול, S-30) קיים רק על פרויקט מבוטל — על חי הוא נעדר, לא ריק.
    await expect(page.getByTestId('project-cell-cancel-reason')).toHaveCount(0)
  })
})

// ── הקישור "פתח שיבוץ חכם" נושא את הפרויקט איתו ──────────────────────────────────
// 🔗 **ישי, 22/08/2026:** *"יותר נכון שהקישור הזה בכרטיס פרויקט יוביל לשיבוץ של אותו
// פרויקט? כרגע הוא מוביל למבט על של הגיוס."* — נכון; הוא היה `<Link to="/hostesses">`
// חשוף, והמנהלת נחתה על מבט-העל ונאלצה לאתר מחדש את הפרויקט שממנו בדיוק יצאה.
//
// 🔴 **הבדיקה מנוסחת על ההקשר ולא על הכתובת, בכוונה.** `HostessesPage` מצהיר
// ששיבוץ-חכם **אינו מסלול** ("מסלול היה מאבד את מצב-הסינון של המבט-על בכל חזרה"),
// ולכן ההעברה היא דרך `state` של הניווט — הכתובת נשארת `/hostesses` בשני המקרים.
// ⇒ `toHaveURL` היה עובר בירוק גם לפני התיקון וגם אחריו. **מה שמפריד הוא שם-האירוע
// בכותרת** ("שיבוץ חכם — {event_name}"), וזה מה שנבדק כאן.
test.describe('מודול 6 · כרטיס פרויקט — הקישור לשיבוץ חכם', () => {
  test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')

  test('🔗 הקישור מלשונית "צוות דיילות" נוחת על השיבוץ של אותו פרויקט', async ({ page }) => {
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await gotoProjects(page)

    // נושא בזמן-ריצה, לא מזהה קשיח (e2e/CLAUDE.md — פיקסטורה נעוצה מרקיבה לבד).
    const rows = page.locator(ROW_SELECTOR)
    test.skip((await rows.count()) === 0, 'אין פרויקט פעיל — אין נושא לבדיקה')
    await rows.first().click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })

    // שם-האירוע נקרא מהמסך עצמו — הוא הטענה שתיבדק בצד השני.
    const eventName = (await page.locator('h1').first().innerText()).trim()
    expect(eventName.length).toBeGreaterThan(0)

    await page.getByTestId('project-tab-team').click()
    const link = page.getByTestId('team-smart-match-link')
    await expect(link).toBeVisible({ timeout: 15_000 })
    await link.click()

    // 🔑 הטענה: נחתנו על מסך-השיבוץ **של אותו פרויקט**, לא על מבט-העל של הגיוס.
    await expect(page.getByRole('heading', { name: `שיבוץ חכם — ${eventName}` })).toBeVisible({
      timeout: 30_000,
    })
    // ובקרה שלילית: לשוניות מבט-העל של הגיוס אינן על המסך — כלומר לא נחתנו שם.
    await expect(page.getByTestId('hostesses-tab-overview')).toHaveCount(0)
  })
})
