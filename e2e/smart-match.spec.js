import { test, expect } from '@playwright/test'

// E2E של מודול 4 — **מסך 2, שיבוץ חכם** (צעד 3.4) ו**תפריט-השורה** (משטח 4, צעד 3.5).
//
// ⚠️ **אפס כתיבות למסד.** כל מה שכאן קורא בלבד; המצב היחיד שנכפה נכפה **ברשת**
// (`page.route`) ולא בדאטה — אין סביבת-בדיקה נפרדת, והזרקת-שורות מזהמת דאטה אמיתית.
//
// 🔑 **מה הבדיקות האלה מוכיחות שצילום-מסך אינו מוכיח:**
// ‏① שהחלפת זווית **מסדרת מחדש את אותן מועמדות** ואינה מסננת אף אחת — שינוי-סדר נראה
//    "עובד" בעין גם כשמועמדת נעלמה, וההפרש נקרא רק בספירה.
// ‏② שהזווית המכובה **קיימת ומנומקת** ולא נעלמה.
// ‏③ שכשל-טעינה נראה **שונה** מ"אין מועמדות" — שתי תוצאות שנראות זהות בדפדפן.

const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// 🔴 **נכנסים דרך לחיצה על שורה ולא דרך כתובת** — זה בדיוק המסלול ש-3.3 השאירה פתוח
// (הודעה זמנית במקום ניווט), והוא מה שצעד C5 סגר.
//
// 🕓 **והשורה נבחרת בזמן-ריצה, לא מקודדת** — `e2e/CLAUDE.md`: *"פיקסטורות נעוצות לשורות-מסד
// חיות מרקיבות לבד"*. **וכאן זה היה קורה בתאריך ידוע:** הגרסה הראשונה נעצה `overview-row-8`,
// ואירוע 8 מתקיים **22/08/2026** — מבט-העל מסנן אירועים שעברו (`isPastEvent`) ⇒ **החל מ-23/08
// כל הבדיקות בקובץ הזה היו נופלות בלי שום באג**, שלושה שבועות לפני ההגשה.
async function openSmartMatch(page, email, password) {
  await login(page, email, password)
  await page.goto('/hostesses')
  await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
  await page.locator('[data-testid^="overview-row-"]').first().click()
  await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })
}

test.describe('מודול 4 · מסך 2 — שיבוץ חכם', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('לחיצה על שורה במבט-העל פותחת את השיבוץ החכם של אותו אירוע, וחוזרים ממנו', async ({
    page,
  }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('שיבוץ חכם')

    await page.getByTestId('smart-match-back').click()
    await expect(page.getByTestId('overview-table')).toBeVisible()
  })

  test('🐞 ארבעת אריחי-המונים אינם מציגים שקלים', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // רגרסיה לפגם שנתפס בצילום-מסך ולא בבדיקה (מסך 1): `StatTile` מעביר ערך **מספרי**
    // דרך `Money`, והאריח הציג `0 ₪` על ספירה. **ארבעה אריחים כאן, וכולם מונים.**
    for (const id of ['sm-kpi-required', 'sm-kpi-approved', 'sm-kpi-available', 'sm-kpi-pending']) {
      await expect(page.getByTestId(id)).toBeVisible()
      await expect(page.getByTestId(id)).not.toContainText('₪')
    }
  })

  test('🔴 החלפת זווית מסדרת מחדש את אותן מועמדות — לא מסננת אף אחת', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const ids = () =>
      page
        .locator('[data-testid^="sm-candidate-"]')
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-testid')))

    const byProximity = await ids()
    expect(byProximity.length).toBeGreaterThan(1)

    await page.getByTestId('sm-angle-cheapest').click()
    const byPrice = await ids()

    // 🔴 **אותה קבוצה בדיוק** — זו הטענה שהאפיון עושה ("מסדרות בלבד, אינן מסננות"),
    // והיא נבדקת כקבוצה ולא כרשימה, כי הסדר **אמור** להשתנות.
    expect([...byPrice].sort()).toEqual([...byProximity].sort())
    // ...ובכל זאת השתנה. ⚠️ אילו הדאטה הייתה אחידה (כל התעריפים זהים) הבדיקה הייתה
    // עוברת בירוק על מיון שבור — ולכן היא נכשלת במפורש במקרה הזה במקום להיות ריקה.
    expect(byPrice).not.toEqual(byProximity)
  })

  test('🐞 שורת "נשלח" מציגה תאריך ושעה קריאים — לא חותמת-זמן גולמית', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // רגרסיה לפגם שנתפס **בצילום-מסך ולא בבדיקה**: `invite_sent_at` הוא חותמת-זמן,
    // ו-`formatDate` (שמצפה לתאריך-בלבד) הפיק `09T20:33:42.432+00:00/08/2026`.
    const rows = page.locator('[data-testid^="sm-event-row-"]')
    const count = await rows.count()
    for (let i = 0; i < count; i += 1) {
      const text = await rows.nth(i).innerText()
      if (!text.includes('נשלח')) continue
      expect(text).not.toContain('+00:00')
      expect(text).toMatch(/נשלח \d{2}\/\d{2} \d{2}:\d{2}/)
    }
  })

  test('🔴 הזווית שאין לה דאטה מוצגת מכובה ומנומקת — לא נעלמת', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const angle = page.getByTestId('sm-angle-fastest')
    await expect(angle).toBeVisible()
    await expect(angle).toBeDisabled()
    await expect(angle).toContainText('כבוי')
    // ההסבר עצמו חייב להיות על המסך: כפתור מכובה בלי סיבה נקרא כמו תקלה.
    await expect(page.getByTestId('sm-angle-note')).toBeVisible()
  })

  test('🔴 המסך אומר בקול שמרכיב האמינות כבוי, ואינו מעמיד פנים שהציון מלא', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('sm-reliability-off')).toContainText('אמינות')
    await expect(page.getByTestId('sm-reliability-off')).toContainText('מודול 6')
  })

  // 🐞 רגרסיה (נתפס 11/08/2026, צעד 4.2): עד לתיקון, `rankCandidates` קיבל
  // `eventDate: today` במקום את תאריך-האירוע — כלומר השער בדק אם הדיילת לא-זמינה
  // **היום**, לא אם היא לא-זמינה **בתאריך האירוע**. אף בדיקה קיימת לא תפסה זאת כי אף אחת
  // לא הזינה דיילת עם טווח-אי-זמינות **עתידי** שחופף לאירוע. `spec.md §3.1` (שירה) ו-דיילת
  // הדגמה `ליאת רזניק` (`scripts/demo-seed.mjs`, טווח 20/08–25/08 מול אירוע 22/08) הן
  // בדיוק המקרה הזה.
  test('🔴 שער אי-הזמינות בודק את תאריך האירוע — לא את תאריך היום', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    // נבחר בזמן-ריצה לפי שם-האירוע, לא לפי מזהה קשיח (`e2e/CLAUDE.md`).
    await page
      .locator('[data-testid^="overview-row-"]', { hasText: 'כנס לקוחות שנתי' })
      .first()
      .click()
    await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })

    // בקרה חיובית קודם: דיילת-דגמה זמינה **כן** מופיעה — אחרת הבדיקה הייתה מוכיחה רק
    // שהרשימה כולה ריקה, לא שהשער עובד נכון.
    await expect(page.locator('body')).toContainText('מאיה כהן')
    await expect(page.locator('body')).not.toContainText('ליאת רזניק')
  })

  test('🔴 כשל-טעינה מציג שגיאה + "נסה שוב", ולעולם לא "אין מועמדות"', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // ⚠️ **נכשל ברשת ולא בדאטה** — אותה מוסכמה כמו `load-failure-guards.spec.js`.
    await page.route('**/rest/v1/hostesses*', (route) => route.abort())
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('overview-row-8').click()

    await expect(page.getByTestId('smart-match-retry')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('body')).not.toContainText('אין מועמדות פנויות')
  })
})

test.describe('מודול 4 · מסך 2 — שני כיווני ההרשאה', () => {
  test.skip(
    !RECRUIT_EMAIL || !RECRUIT_PASSWORD || !PROJECTS_EMAIL || !PROJECTS_PASSWORD,
    'זוגות E2E_* לא הוגדרו ב-.env.local',
  )

  test('מנהלת גיוס רואה תיבות-סימון וכפתור-שליחה', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('sm-send-invites')).toBeVisible()
    await expect(page.locator('[data-testid^="sm-pick-"]').first()).toBeVisible()
  })

  test('🔴 מנהלת פרויקטים רואה את הדירוג — ואין לה תיבות, כפתור-שליחה או תפריט-שורה', async ({
    page,
  }) => {
    await openSmartMatch(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)

    // בקרה חיובית: היא **כן** רואה את המסך והמועמדות — אחרת הבדיקה מוכיחה רק שהיא חסומה.
    await expect(page.locator('[data-testid^="sm-candidate-"]').first()).toBeVisible()

    // 🔴 **פקד חסום אינו קיים כלל, לא פקד מכובה** — הכלל של §④/§⑥.
    await expect(page.getByTestId('sm-send-invites')).toHaveCount(0)
    await expect(page.getByTestId('sm-approve-all')).toHaveCount(0)
    await expect(page.locator('[data-testid^="sm-pick-"]')).toHaveCount(0)
    await expect(page.locator('[data-testid^="row-menu-"]')).toHaveCount(0)
  })
})
