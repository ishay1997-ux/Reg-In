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

  // 🔴 **נכתבה מחדש 12/08/2026 באודיט-הסגירה — והסיבה שווה יותר מהתיקון.**
  // הגרסה הקודמת קיבעה `toBeDisabled()` + `כבוי` **כאמת נצחית**, על סמך מצב-הדאטה של 09/08.
  // ‏**היא נפלה בלי שאיש נגע בקוד:** בבדיקת-הקבלה החיה ישי ענה דרך הקישור הציבורי, נרשמה
  // ‏`responded_at` ראשונה במערכת — ו**הזווית נדלקה, בדיוק כפי שהאפיון דורש.**
  // 🔑 **זה המופע הרביעי באותה משפחה** *(מזהה קשיח 04/08 · `overview-row-8` 09/08 · המונה `(0)`
  // ‏12/08 — ועכשיו מצב-כפתור)*, ולכן הבדיקה מאמתת מעכשיו את **האינווריאנטה** ולא את המצב:
  // ‏**① הזווית תמיד נוכחת ואינה נעלמת** *(‏`§11.4`: פקד שנעלם מלמד חוסר-עקביות; פקד מכובה
  // עם נימוק מלמד **למה**)* · **② מצבה תואם לטקסט שעליה** — `כבוי` ⇔ מכובה, ובלעדיו פעילה.
  test('🔴 הזווית שאין לה דאטה מוצגת מכובה ומנומקת — לא נעלמת', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const angle = page.getByTestId('sm-angle-fastest')
    await expect(angle).toBeVisible()

    const label = (await angle.textContent()) ?? ''
    const offByLabel = label.includes('כבוי')
    // ⚠️ הבדיקה היא **הסכמה** בין התווית למצב, לא ערך קבוע של אחד מהם.
    if (offByLabel) {
      await expect(angle).toBeDisabled()
      // כפתור מכובה בלי סיבה נקרא כמו תקלה — ההסבר חייב להיות על המסך.
      await expect(page.getByTestId('sm-angle-note')).toBeVisible()
    } else {
      await expect(angle).toBeEnabled()
    }
  })

  test('🔴 המסך אומר בקול שמרכיב האמינות כבוי, ואינו מעמיד פנים שהציון מלא', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('sm-reliability-off')).toContainText('אמינות')
    // 🔴 **עודכן 22/08/2026 — והבדיקה הקודמת היא דוגמה למה שהקובץ הזה מזהיר מפניו.**
    // היא אימתה `toContainText('מודול 6')`, כלומר **ניסוח-ההסבר** ("אין עדיין נתונים
    // מסגירת-האירוע של מודול 6") ולא את האינווריאנט. ההסבר היה שגוי מלכתחילה — המרכיב
    // כבוי כי `מרכיב_אמינות_פעיל` כבוי, והדלקתו היא של מ9 — **והוא גם התיישן ברגע שמ6 מוזג.**
    // ⇒ הבדיקה הייתה נועלת דווקא את החלק שצריך היה להשתנות, ואף שער לא היה מתריע
    // (`test:e2e` אינו רץ ב-CI).
    // 🔑 **האינווריאנט האמיתי, לפי שם-הבדיקה עצמה — "אינו מעמיד פנים שהציון מלא":**
    // המסך אומר במפורש על מה הציון **כן** מבוסס, עם המשקלים בפועל.
    await expect(page.getByTestId('sm-reliability-off')).toContainText('שיעור-היענות')
    await expect(page.getByTestId('sm-reliability-off')).toContainText('קרבה')
    await expect(page.getByTestId('sm-reliability-off')).toContainText('%')
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
    // 🕓 **נבחר בזמן-ריצה ולא `overview-row-8`** — המזהה הקשיח האחרון בקובץ, שנשאר כאן
    // בכוונה בצעד 4.2 ותוקן ב-5.1 לפי הכרעת-דפוס-הפיקסטורות (`module-4.md` §10).
    await page.locator('[data-testid^="overview-row-"]').first().click()

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

  test('🔴 מנהלת פרויקטים ב-Smart Match — מ-19/08/2026 בדרגת edit: הפקדים מוצגים לה', async ({
    page,
  }) => {
    await openSmartMatch(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)

    // בקרה חיובית: היא **כן** רואה את המסך והמועמדות — אחרת הבדיקה מוכיחה רק שהיא חסומה.
    await expect(page.locator('[data-testid^="sm-candidate-"]').first()).toBeVisible()

    // הכרעת-ישי 19/08/2026: דיילות×מנהלת-פרויקטים הוחלף view→edit (מיילי-㉑ של מ6) ⇒
    // תיבות-הבחירה כן מוצגות לה. הציפייה הישנה (אפס פקדים) תיעדה את המטריצה שקדמה להכרעה;
    // כלל "פקד חסום אינו קיים כלל" (§④/§⑥) עומד — הוא נבחן עכשיו דרך מסלול-ה-view ביחידה.
    await expect(page.locator('[data-testid^="sm-pick-"]').first()).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// משטח 4 — תפריט-הפעולות פר-שורה (צעד 5.1)
//
// 🔴 **הטענה המרכזית של המשטח הזה: התוכן נגזר מהסטטוס, ולעולם אינו רשימה שטוחה**
// (`screens-approved` מסך 4 §③). ולכן הבדיקה אינה בודקת "יש תפריט" אלא **שכל סטטוס מקבל
// רשימה אחרת** — ובכללן `ביטלה אחרי אישור`, שאין לה תפריט בכלל.
//
// 🚫 **אף פריט בתפריט אינו נלחץ.** רובם שולחים מייל אמיתי לדיילת אמיתית (זימון · אישור
// סופי · שחרור). פותחים, קוראים, ויוצאים ב-Escape.
//
// 🕓 **והשורות אינן מזוהות בשם-דיילת או במזהה** — אלא **לפי התווית שעל המסך**, שהיא
// בדיוק מה שהכלל מדבר עליו. שמות דיילות-ההדגמה יכולים להשתנות; המיפוי סטטוס⇐תפריט לא.
// ═══════════════════════════════════════════════════════════════════════════════

// 🔑 **מספר הפריטים לכל תווית — מתוך `rowMenuItems`, וכולל את שתי התוויות הנגזרות.**
// ‏`פג תוקף` הוא עדיין `pending` מתחת, ו-`הושלם` עדיין `finally_approved` — שתיהן תוויות
// תצוגה ולא סטטוס שביעי, וזו בדיוק ההבחנה שהמודול חוזר עליה (§1.1: ששת הסטטוסים סגורים).
const MENU_ITEMS_BY_LABEL = {
  'ממתינה למענה': 4,
  'פג תוקף': 4,
  'אישרה זמינות': 3,
  'אושרה סופית': 3,
  הושלם: 3,
  סירבה: 1,
  שוחררה: 1,
  'ביטלה אחרי אישור': 0,
}

async function eventRowsByLabel(page) {
  const rows = page.locator('[data-testid^="sm-event-row-"]')
  const count = await rows.count()
  const byLabel = {}
  for (let i = 0; i < count; i += 1) {
    const testId = await rows.nth(i).getAttribute('data-testid')
    const hostessId = testId.replace('sm-event-row-', '')
    const label = (await page.getByTestId(`sm-status-${hostessId}`).textContent())?.trim()
    byLabel[label] = [...(byLabel[label] ?? []), hostessId]
  }
  return byLabel
}

test.describe('מודול 4 · משטח 4 — תפריט-הפעולות פר-שורה', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('🔴 כל סטטוס מקבל רשימת-פעולות משלו — ו"ביטלה אחרי אישור" אינה מקבלת תפריט כלל', async ({
    page,
  }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('sm-event-column')).toBeVisible()

    const byLabel = await eventRowsByLabel(page)
    const labels = Object.keys(byLabel).filter((label) => label in MENU_ITEMS_BY_LABEL)

    // 🔴 **השומר מפני בדיקה-על-כלום** (המלכודת שחזרה בפרויקט הזה שלוש פעמים): בלי זה,
    // מסך שכל שורותיו נעלמו היה מפיק בדיקה ירוקה ומרשימה שאינה בודקת דבר.
    expect(labels.length).toBeGreaterThanOrEqual(3)

    for (const label of labels) {
      const hostessId = byLabel[label][0]
      const expected = MENU_ITEMS_BY_LABEL[label]
      const trigger = page.getByTestId(`row-menu-${hostessId}`)

      if (expected === 0) {
        // שורת-היסטוריה: אין לה פעולות, ולכן גם אין לה `⋯` — לא כפתור מכובה.
        await expect(trigger).toHaveCount(0)
        continue
      }

      await trigger.click()
      await expect(page.getByRole('menuitem')).toHaveCount(expected)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menuitem')).toHaveCount(0)
    }
  })

  test('🔴 שתי הפעולות שנראות זהות ואינן — לעולם לא באותו תפריט', async ({ page }) => {
    await openSmartMatch(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('sm-event-column')).toBeVisible()

    // 🔑 `שלח את הקישור שוב` מרענן את **אותה שורה**; `פתח זימון חדש` יוצר **שורה שנייה**
    // והישנה נשארת היסטוריה. איחודן היה מוחק סירוב שקדם — וההיענות היא 40% מהציון,
    // כלומר הדירוג היה משתנה **ואף בדיקה לא הייתה נופלת**. לכן דווקא זו.
    const byLabel = await eventRowsByLabel(page)
    const openable = ['ממתינה למענה', 'פג תוקף', 'סירבה', 'שוחררה'].filter((l) => byLabel[l])
    expect(openable.length).toBeGreaterThanOrEqual(1)

    for (const label of openable) {
      await page.getByTestId(`row-menu-${byLabel[label][0]}`).click()
      const resend = page.getByRole('menuitem').filter({ hasText: 'שלח את הקישור שוב' })
      const newInvite = page.getByRole('menuitem').filter({ hasText: 'פתח זימון חדש' })
      const together = (await resend.count()) > 0 && (await newInvite.count()) > 0
      expect(together).toBe(false)
      await page.keyboard.press('Escape')
    }
  })
})
