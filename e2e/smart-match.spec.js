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
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

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

// הטקסט שמופיע על שורה שמעולם לא זומנה. **קבוע ולא תבנית** — הוא חצי מחלוקה חדה,
// והחצי השני הוא חותמת-הזמן הקריאה. ר' הבדיקה של שורת "נשלח" למטה.
const NEVER_INVITED = 'טרם נשלח זימון'

// צילום-מצב של הטור "דיילות באירוע": מזהה-דיילת · תווית-הסטטוס שעל השורה · הטקסט המלא.
// 🔑 שלושתם נקראים **בסריקה אחת**, כדי שכל בדיקה תוכל להחליט על נושא-המדידה שלה
// מהמסך עצמו ולא מהנחה על הדאטה.
async function eventRowsSnapshot(page) {
  const rows = page.locator('[data-testid^="sm-event-row-"]')
  const count = await rows.count()
  const snapshot = []
  for (let i = 0; i < count; i += 1) {
    const testId = await rows.nth(i).getAttribute('data-testid')
    const hostessId = testId.replace('sm-event-row-', '')
    const label = (await page.getByTestId(`sm-status-${hostessId}`).textContent())?.trim()
    snapshot.push({ hostessId, label, text: await rows.nth(i).innerText() })
  }
  return snapshot
}

function groupByLabel(rows) {
  const byLabel = {}
  for (const row of rows) byLabel[row.label] = [...(byLabel[row.label] ?? []), row.hostessId]
  return byLabel
}

// 🕓 **נושא-הבדיקה נבחר בזמן-ריצה לפי התנאי שהבדיקה עצמה צריכה — לא מזהה, לא שם-אירוע,
// ולא "השורה הראשונה".** ‏`e2e/CLAUDE.md` אוסר פיקסטורה נעוצה לשורת-מסד חיה; **וגם
// "הראשונה" היא פיקסטורה** ברגע שהבדיקה צריכה תוכן מסוים ולא סתם מסך.
// 🔬 **נמדד 26/08/2026 ולא משוער:** השורה הראשונה בלוח נשאה **שורת-שיבוץ אחת בסטטוס
// יחיד ובלי זימון שנשלח** ⇒ שלוש בדיקות מדדו עליה כלום (אחת נפלה על *"expected >= 3,
// received 1"*, אחת על *"expected >= 1, received 0"*, ואחת ניסתה להתאים תבנית-חותמת
// לשורה שמעולם לא זומנה).
// ⇒ סורקים את שורות מבט-העל בסדר שבו הן מוצגות, פותחים אחת-אחת, ועוצרים באירוע
// **הראשון שעונה על התנאי**. מה שנראה בדרך מוחזר ב-`seen`, כדי שדילוג יסביר את עצמו
// במקום להיעלם בשקט.
async function openEventWhere(page, predicate) {
  await page.goto('/hostesses')
  await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
  const testIds = await page
    .locator('[data-testid^="overview-row-"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')))
  // 🔴 אסרשן-מכנה: לוח בלי שורות אינו "אין מה לבדוק" — הוא כשל, ונופל כאן ולא מדלג.
  expect(testIds.length).toBeGreaterThan(0)

  const seen = []
  for (const testId of testIds) {
    if (seen.length > 0) {
      await page.goto('/hostesses')
      await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    }
    await page.getByTestId(testId).click()
    await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })
    // ⚠️ **ממתינים לתוכן הנמדד עצמו, לא למעטפת** (`e2e/CLAUDE.md`: מדידה על שלד-טעינה
    // מחזירה `measured=0, failures=[]` ונראית ירוקה). הטור מצויר לפני שורותיו.
    await expect(
      page.locator('[data-testid^="sm-event-row-"], [data-testid="sm-event-empty"]').first(),
    ).toBeVisible({ timeout: 30_000 })

    const rows = await eventRowsSnapshot(page)
    seen.push(`${testId} → ${rows.map((row) => row.label).join(' · ') || 'אין שורות שיבוץ'}`)
    if (predicate(rows)) return { rows, seen }
  }
  return { rows: null, seen }
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

  // 🐞 **נכתבה מחדש 26/08/2026 — והשער שלה עצמו היה הבאג.** הגרסה הקודמת דילגה על שורה
  // שאין בה `'נשלח'` — אבל `'טרם נשלח זימון'` **מכיל** `'נשלח'`, ולכן שורה שמעולם לא זומנה
  // **לא דולגה**, ונפלה על תבנית-החותמת (*"Received: גלית מור … טרם נשלח זימון"*).
  // 🔑 **החלוקה עכשיו חדה ובלי חפיפה, והיא גם מרחיבה את הטענה:** שורת-הזמן של **כל** שורה
  // חייבת ליפול על אחת משתי הצורות החוקיות — `טרם נשלח זימון` **או** `נשלח DD/MM HH:MM`.
  // שורה שאיבדה את שתיהן (בדיוק מה שקרה כשחותמת עברה דרך `formatDate`) נופלת עכשיו,
  // במקום להישאר מחוץ ללולאה.
  test('🐞 שורת "נשלח" מציגה תאריך ושעה קריאים — לא חותמת-זמן גולמית', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // 🕓 האירוע נבחר לפי מה שהבדיקה **צריכה**: שורה שזימון כן נשלח בה. בלי זה המדידה
    // רצה על אירוע שכל שורותיו "טרם נשלח זימון" — מכנה 0 שנראה ירוק.
    const { rows, seen } = await openEventWhere(page, (eventRows) =>
      eventRows.some((row) => !row.text.includes(NEVER_INVITED)),
    )
    test.skip(
      rows === null,
      `אין באף אירוע בלוח שורה שנשלח בה זימון — אין חותמת-זמן למדוד. מה שנסרק: ${seen.join(' | ')}`,
    )

    // 🔴 אסרשן-מכנה: המדידה שהבדיקה קיימת בשבילה רצה על לפחות שורה אחת שנשלחה.
    const sent = rows.filter((row) => !row.text.includes(NEVER_INVITED))
    expect(sent.length).toBeGreaterThan(0)

    for (const row of rows) {
      // רגרסיה לפגם שנתפס **בצילום-מסך ולא בבדיקה**: `invite_sent_at` הוא חותמת-זמן,
      // ו-`formatDate` (שמצפה לתאריך-בלבד) הפיק `09T20:33:42.432+00:00/08/2026`.
      expect(row.text).not.toContain('+00:00')
      expect(row.text).toMatch(new RegExp(`(${NEVER_INVITED}|נשלח \\d{2}\\/\\d{2} \\d{2}:\\d{2})`))
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
    // 🔄 03/09/2026: המתג `מרכיב_אמינות_פעיל` הוא הכרעת-מוצר שיכולה להתהפך במסך-הפרמטרים
    // (ישי הורה להדליק אותו היום, אחרי שנתוני-הנוכחות נזרעו). האינווריאנט אינו "הבאנר קיים"
    // אלא **הבאנר אומר את האמת על הפרמטר**: כבוי ⇒ באנר עם המשקלים בפועל; דלוק ⇒ אין באנר.
    // הפרמטר נקרא כמו שהמסך עצמו קורא אותו (אותה זהות, אותה RLS).
    const reliabilityOn = await page.evaluate(
      async ({ url, anon }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const res = await fetch(
          `${url}/rest/v1/params?select=param_value&param_name=eq.${encodeURIComponent('מרכיב_אמינות_פעיל')}`,
          { headers: { apikey: anon, Authorization: `Bearer ${token}` } },
        )
        const [row] = await res.json()
        return row ? String(row.param_value).trim().toLowerCase() === 'true' : null
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON },
    )
    expect(reliabilityOn, 'הפרמטר לא נקרא — הזדהות/RLS, לא באג במסך').not.toBeNull()
    if (reliabilityOn) {
      await expect(page.locator('[data-testid^="sm-candidate-"]').first()).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByTestId('sm-reliability-off')).toHaveCount(0)
      return
    }
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
    // 🔄 03/09/2026: "ליאת רזניק" (20–25/08 מול אירוע 22/08) נמחקה עם דמו-יולי בהכרעת-ישי —
    // וממילא הטווח שלה חלף, כלומר הבדיקה הפסיקה להוכיח משהו ב-26/08 בלי שאיש נגע בה.
    // הפיקסטורה נבחרת עכשיו בזמן-ריצה: אירוע עתידי שמופיע במבט-העל + דיילת פעילה שטווח
    // אי-הזמינות שלה מכיל את תאריך האירוע **ושאינה משובצת בו** (אחרת הייתה נעדרת מהמועמדות
    // מסיבה אחרת, והבדיקה הייתה עוברת מהסיבה הלא-נכונה). אין זוג ⇒ נפילה ברעש על פיקסטורה.
    const today = new Date().toISOString().slice(0, 10)
    const pairs = await page.evaluate(
      async ({ url, anon, today }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const get = async (path) =>
          (
            await fetch(`${url}/rest/v1/${path}`, {
              headers: { apikey: anon, Authorization: `Bearer ${token}` },
            })
          ).json()
        const [unavail, projects, assigned] = await Promise.all([
          get(
            `hostess_unavailability?select=hostess_id,start_date,end_date,hostesses!inner(full_name,status)&hostesses.status=eq.active&end_date=gte.${today}`,
          ),
          get(
            `projects?select=project_id,final_event_date&final_event_date=gte.${today}&project_status=in.(not_started,in_progress,ready)&order=final_event_date&limit=200`,
          ),
          get(`assignments?select=project_id,hostess_id&event_date=gte.${today}`),
        ])
        const taken = new Set(assigned.map((a) => `${a.project_id}:${a.hostess_id}`))
        const found = []
        for (const p of projects)
          for (const u of unavail)
            if (
              u.start_date <= p.final_event_date &&
              p.final_event_date <= u.end_date &&
              !taken.has(`${p.project_id}:${u.hostess_id}`)
            )
              found.push({ projectId: p.project_id, hostessName: u.hostesses.full_name })
        return found
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON, today },
    )
    expect(
      pairs.length,
      'אין זוג אירוע-עתידי/דיילת-לא-זמינה — פיקסטורה חסרה, לא באג',
    ).toBeGreaterThan(0)

    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    // הזוג הראשון שאירועו באמת מופיע במבט-העל (אירוע שאויש במלואו עשוי שלא להופיע שם).
    let chosen = null
    for (const pair of pairs) {
      if ((await page.getByTestId(`overview-row-${pair.projectId}`).count()) > 0) {
        chosen = pair
        break
      }
    }
    expect(chosen, 'אף אירוע מהזוגות אינו במבט-העל — פיקסטורה חסרה, לא באג').toBeTruthy()
    await page.getByTestId(`overview-row-${chosen.projectId}`).click()
    await expect(page.getByTestId('smart-match-page')).toBeVisible({ timeout: 30_000 })

    // בקרה חיובית קודם: יש מועמדות — אחרת הבדיקה הייתה מוכיחה רק שהרשימה כולה ריקה,
    // לא שהשער עובד נכון.
    const candidates = page.locator('[data-testid^="sm-candidate-"]')
    await expect(candidates.first()).toBeVisible({ timeout: 30_000 })
    await expect(candidates.filter({ hasText: chosen.hostessName })).toHaveCount(0)
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

// התוויות שהמיפוי מכיר, מתוך צילום-המצב. **מוגדר על הצילום ולא על המסך** כדי שאותה
// סריקה תשמש גם לבחירת-הנושא (`openEventWhere`) וגם לטענה עצמה.
function knownLabels(rows) {
  return [...new Set(rows.map((row) => row.label))].filter((label) => label in MENU_ITEMS_BY_LABEL)
}

// 🔑 ארבעת הסטטוסים שאחת משתי הפעולות-התאומות **יכולה** להופיע בהם: `ממתינה למענה`/`פג תוקף`
// מקבלים `שלח את הקישור שוב`, ו-`סירבה`/`שוחררה` מקבלים `פתח זימון חדש`. מחוץ להם אין
// לטענה על מה לרוץ, וזה **תנאי-מקדים** — לא הטענה.
const TWIN_ACTION_LABELS = ['ממתינה למענה', 'פג תוקף', 'סירבה', 'שוחררה']

function twinActionLabels(rows) {
  return TWIN_ACTION_LABELS.filter((label) => rows.some((row) => row.label === label))
}

test.describe('מודול 4 · משטח 4 — תפריט-הפעולות פר-שורה', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  // 🔴 **נכתבה מחדש 26/08/2026 — התנאי-המקדים הופרד מהטענה.** ‏`labels.length >= 3` היה
  // שומר-מכנה שהתחזה לטענה: כשהאירוע שנפתח נשא שורה אחת בסטטוס אחד, הבדיקה נפלה על
  // *"expected >= 3, received 1"* — הודעה שאינה מלמדת דבר על המיפוי, ואינה באג במסך.
  // 🔑 **שלושה חלקים נפרדים מעכשיו:** ‏① **הנושא** נבחר בזמן-ריצה — האירוע הראשון שחיות
  // בו לפחות **שתי** תוויות-סטטוס מוכרות (בלי שתיים, "לכל סטטוס רשימה **משלו**" אינה
  // טענה השוואתית) · ② **הטענה** היא המיפוי, לכל תווית שנמצאה בפועל, ובכללה
  // `ביטלה אחרי אישור` שאין לה `⋯` כלל · ③ **חוסר-יכולת** נאמר בקול כדילוג מנומק
  // שמונה מה נסרק — לעולם לא ירוק שקט.
  test('🔴 כל סטטוס מקבל רשימת-פעולות משלו — ו"ביטלה אחרי אישור" אינה מקבלת תפריט כלל', async ({
    page,
  }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const { rows, seen } = await openEventWhere(
      page,
      (eventRows) => knownLabels(eventRows).length >= 2,
    )
    test.skip(
      rows === null,
      `אין בלוח אירוע שחיות בו שתי תוויות-סטטוס מוכרות ומעלה — מיפוי סטטוס⇐תפריט לא נבדק. מה שנסרק: ${seen.join(' | ')}`,
    )

    await expect(page.getByTestId('sm-event-column')).toBeVisible()
    const byLabel = groupByLabel(rows)
    const labels = knownLabels(rows)

    // 🔴 **אסרשן-מכנה** (`e2e/CLAUDE.md`): הלולאה שמתחת רצה על אוסף שאינו ריק.
    expect(labels.length).toBeGreaterThan(0)

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

  // 🔴 **נכתבה מחדש 26/08/2026, אותו טיפול כמו זו שמעליה:** ‏`openable.length >= 1` היה
  // תנאי-מקדים שנכתב כטענה, ונפל על *"expected >= 1, received 0"* כשהאירוע שנפתח לא נשא
  // אף סטטוס משלושת אלה — כלומר הודעת-כשל שמתארת את הלוח, לא את המוצר.
  test('🔴 שתי הפעולות שנראות זהות ואינן — לעולם לא באותו תפריט', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // 🔑 `שלח את הקישור שוב` מרענן את **אותה שורה**; `פתח זימון חדש` יוצר **שורה שנייה**
    // והישנה נשארת היסטוריה. איחודן היה מוחק סירוב שקדם — וההיענות היא 40% מהציון,
    // כלומר הדירוג היה משתנה **ואף בדיקה לא הייתה נופלת**. לכן דווקא זו.
    const { rows, seen } = await openEventWhere(
      page,
      (eventRows) => twinActionLabels(eventRows).length > 0,
    )
    test.skip(
      rows === null,
      `אין בלוח שורה באחד מהסטטוסים ${TWIN_ACTION_LABELS.join(' · ')} — אף תפריט אינו יכול להכיל אף אחת מהשתיים, והטענה לא נבדקה. מה שנסרק: ${seen.join(' | ')}`,
    )

    await expect(page.getByTestId('sm-event-column')).toBeVisible()
    const byLabel = groupByLabel(rows)
    const openable = twinActionLabels(rows)
    // 🔴 אסרשן-מכנה.
    expect(openable.length).toBeGreaterThan(0)

    for (const label of openable) {
      await page.getByTestId(`row-menu-${byLabel[label][0]}`).click()
      await expect(page.getByRole('menuitem').first()).toBeVisible()

      const resend = page.getByRole('menuitem').filter({ hasText: 'שלח את הקישור שוב' })
      const newInvite = page.getByRole('menuitem').filter({ hasText: 'פתח זימון חדש' })
      const resendCount = await resend.count()
      const newInviteCount = await newInvite.count()

      // ① השתיים לעולם לא יחד — זו הטענה המקורית.
      expect(resendCount > 0 && newInviteCount > 0).toBe(false)
      // ② **ובדיוק אחת מהן כן שם.** בלי החצי הזה, תפריט שאיבד את שתיהן היה עובר בירוק
      //    על `false && false` — כלומר הטענה הייתה מתאמתת על כלום.
      expect(resendCount + newInviteCount).toBe(1)

      await page.keyboard.press('Escape')
      await expect(page.getByRole('menuitem')).toHaveCount(0)
    }
  })
})
