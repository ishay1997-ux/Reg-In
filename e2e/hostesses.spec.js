import { test, expect } from '@playwright/test'

// E2E של מודול 4 — **משטח 1, מבט-על השיבוצים** (צעד 3.3).
//
// ⚠️ **אפס כתיבות למסד.** הבדיקות כאן קוראות בלבד, והמצב היחיד ש"נכפה" נכפה **ברשת**
// (`page.route`) ולא בדאטה — אותה מוסכמה כמו `load-failure-guards.spec.js`. אין סביבת-בדיקה
// נפרדת בפרויקט הזה, ולכן הזרקת-שורות מזהמת דאטה אמיתית.
//
// 🔑 **מה הבדיקות האלה מוכיחות שצילום-מסך אינו מוכיח:** שהמסך מבחין בין "אין אירועים"
// לבין "השאילתה נכשלה" — שתי תוצאות שנראות **זהות** בדפדפן, וההבחנה ביניהן היא
// `spec.md § מה ייחשב עובד` #4, הכשל החמור ביותר במודול.

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

// 🕓 **אירוע-ההדגמה נבחר בשמו ולעולם לא ב-`project_id`** (`e2e/CLAUDE.md`: פיקסטורה נעוצה
// לשורת-מסד חיה מרקיבה לבד; והכרעת-דפוס-הפיקסטורות ב-`module-4.md` §10). זהו האירוע שחמש
// דיילות-ההדגמה של צעד 4.2 נבנו סביבו.
const DEMO_EVENT = 'כנס לקוחות שנתי'

// 🐞 **שתי צורות-רינדור לאותה עובדה, והבדיקה הכירה רק אחת** (נתפס 26/08/2026).
// ‏`OverviewTab` כותב `{gap === 1 ? 'חסרה 1' : `חסרות ${gap}`}` — כלומר סינון על המילה
// `חסרות` בלבד **עיוור מבנית לענף היחיד**. הלוח החי נשא באותו יום פערים 10 · 6 · 5 · **1**:
// האריח אמר `4`, ומונה-הבדיקה ראה `3`, בלי שום באג במסך.
// ⇒ הביטוי מזהה את **שתי** הצורות, ואינו תלוי בכמה אירועים יש על הלוח.
const MISSING_ROW_MARK = /חסר(?:ה|ות) \d+/

// התאריכים המצוירים בשורות שמסומנות כחסרות-איוש, כמספרים בני-השוואה.
// ⚠️ **נקרא מהמסך ולא מהמסד** — הטענה של הבדיקה היא על מה שהמנהלת רואה, וגם המיון עצמו
// רץ בדפדפן. הפורמט על המסך הוא `DD/MM/YYYY` (`formatDate`), ולכן ההיפוך ל-`YYYYMMDD`.
async function missingRowDates(page) {
  const texts = await page
    .locator('[data-testid^="overview-row-"]')
    .evaluateAll((rows) =>
      rows.map((row) => (/חסר/.test(row.textContent ?? '') ? (row.textContent ?? '') : null)),
    )
  return texts
    .filter(Boolean)
    .map((text) => text.match(/(\d{2})\/(\d{2})\/(\d{4})/))
    .filter(Boolean)
    .map(([, day, month, year]) => Number(`${year}${month}${day}`))
}

// לשונית המאגר (משטח 3). ברירת-המחדל של המסך היא מבט-העל, ולכן צריך מעבר מפורש.
async function openRepository(page, email, password) {
  await login(page, email, password)
  await page.goto('/hostesses')
  await page.getByTestId('hostesses-tab-repository').click()
}

test.describe('מודול 4 · משטח 1 — מבט-על השיבוצים', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('נוחתים על לשונית מבט-העל, והיא מציגה אירועים אמיתיים', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')

    // 🔴 ברירת-המחדל היא מבט-העל ולא המאגר — המנהלת נכנסת כדי לראות **איפה חסר**.
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })

    // 🔴 **אירוע שתאריכו עבר אינו ברשימה.** במסד יושב `תרחיש-קבלה 5.1` מ-01/08/2026 עם
    // 6 חסרות; בלי כלל-התאריך הוא היה יושב **בראש** מסך-הטריאז' לנצח, כי המיון לפי קרבה.
    await expect(page.getByTestId('overview-table')).not.toContainText('תרחיש-קבלה')

    await expect(page.locator('[data-testid^="overview-row-"]').first()).toBeVisible()
    await expect(page.getByTestId('overview-table')).toContainText(DEMO_EVENT)
  })

  test('🔴 הסדר הוא התשובה — האירוע הקרוב יותר יושב מעל הרחוק', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })

    // 🔴 **הטענה נמדדת על מה שמצויר, לא על מזהי-מסד:** בתוך קבוצת האירועים החסרים
    // התאריכים חייבים לעלות. אילו המיון היה לפי `project_id` — הסדר היה נשבר כאן.
    // ⚠️ **ודווקא בתוך קבוצת-החסרים:** `sortOverviewRows` ממיין "חסרים תחילה" ורק אז לפי
    // קרבה, כך שהשוואת כל השורות יחד הייתה נכשלת **בצדק** על אירוע מאויש וקרוב.
    const missingDates = await missingRowDates(page)
    expect(missingDates.length).toBeGreaterThan(0)
    expect([...missingDates].sort((a, b) => a - b)).toEqual(missingDates)
  })

  test('שני ה-KPI מדברים על אותה רשימה שמתחתיהם', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-kpi-missing')).toBeVisible({ timeout: 30_000 })

    // ⚠️ מספרים **לא** מקובעים: הדאטה חיה, ושורות-שיבוץ ייווצרו בצעדים 3.4/3.5. הטענה
    // היציבה היא שהמונה תואם את מספר השורות שמסומנות כחסרות — ולא ערך קסם.
    await expect(page.getByTestId('overview-table')).toBeVisible()

    // 🔴 **אסרשן-מכנה** (`e2e/CLAUDE.md`: *"מדידה שהמכנה שלה 0 אינה ירוקה — היא לא רצה"*):
    // בלי זה, לוח שכל שורותיו נעלמו היה מפיק `0 === 0` ירוק שאינו בודק דבר.
    const rowCount = await page.locator('[data-testid^="overview-row-"]').count()
    expect(rowCount).toBeGreaterThan(0)

    // 🔴 **האינווריאנט: האריח והרשימה שמתחתיו מתארים את אותה קבוצה** — `missingEvents`
    // סופר `isMissing` (כלומר `gap > 0`), וזה בדיוק התנאי שמצייר את שורת-החוסר.
    const missingRows = await page
      .locator('[data-testid^="overview-row-"]', { hasText: MISSING_ROW_MARK })
      .count()

    // ⚠️ **הערך נקרא מהאריח כמספר, ולא כהכלת-מחרוזת:** `toContainText('3')` היה עובר
    // בירוק גם על אריח שערכו `4` ושורת-המשנה שלו נושאת "מתוכם 3 בתוך 24 שעות".
    // התווית עצמה נטולת ספרות, ולכן רצף-הספרות הראשון באריח הוא הערך.
    const tileText = (await page.getByTestId('overview-kpi-missing').textContent()) ?? ''
    const tileValue = Number(tileText.match(/\d+/)?.[0])
    expect(Number.isFinite(tileValue)).toBe(true)
    expect(tileValue).toBe(missingRows)

    // 🐞 **רגרסיה לפגם שנתפס בצילום-מסך ולא בבדיקה:** `StatTile` מעביר ערך **מספרי**
    // דרך `Money`, והאריח הציג `0 ₪` על **ספירת זימונים**. שני האריחים מונים דברים,
    // ואף אחד מהם אינו כסף.
    await expect(page.getByTestId('overview-kpi-pending')).not.toContainText('₪')
    await expect(page.getByTestId('overview-kpi-missing')).not.toContainText('₪')
  })

  // 🕓 **תוקנה 26/08/2026 — ושוב בלי שום באג במסך.** הגרסה הקודמת נשענה על משפט
  // *"אין היום אירוע דחוף"*, כלומר על **מצב הלוח באותו יום**. ב-26/08 היו שני אירועים
  // בתוך 72 שעות (אחד היום, אחד מחר) ⇒ המסנן החזיר שורות, מצב ריק-אחרי-סינון פשוט לא
  // התרחש, ו-`overview-empty-filtered` לא נולד. ⚠️ **ואין מסנן שני שמובטח ריק** —
  // 'הצג חסרים בלבד' החזיר באותו רגע 4 שורות.
  // 🔴 **ולכן המצב נכפה ברשת ולא נצוד בדאטה** — אותה מוסכמה בדיוק כמו מצב T-24 שמתחת
  // (`e2e/CLAUDE.md`: יירוט הוא הדרך היחידה לייצר מצב): אירוע יחיד, **רחוק ומאויש
  // במלואו**, ולכן שני המסננים גם יחד מובטחים ריקים עליו — בכל יום, לנצח.
  test('ריק-אחרי-סינון אומר "לא נמצאו" ומציע לנקות — ולא מתחזה למאגר ריק', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const farDate = new Date(Date.now() + 60 * 24 * 3600_000).toISOString().slice(0, 10)
    await page.route('**/rest/v1/projects*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            project_id: 99003,
            event_name: 'אירוע בדיקת ריק-אחרי-סינון',
            customer_name: 'לקוח בדיקה',
            final_event_date: farDate,
            final_start_time: '10:00:00',
            final_end_time: '23:00:00',
            final_location: 'אולם בדיקה',
            required_hostess_count: 1,
            project_status: 'not_started',
            // מאויש 1/1 ⇒ `gap = 0` ⇒ אינו "חסר"; ורחוק 60 יום ⇒ אינו "דחוף".
            assignments: [
              {
                project_id: 99003,
                hostess_id: 99003,
                assignment_number: 1,
                assignment_status: 'finally_approved',
                invite_sent_at: new Date(Date.now() - 5 * 24 * 3600_000).toISOString(),
              },
            ],
          },
        ]),
      }),
    )

    await page.goto('/hostesses')
    // 🔑 **בקרה חיובית קודם:** האירוע **כן** יושב ברשימה. בלעדיה "ריק אחרי סינון" היה
    // מוכיח רק שהלוח ריק מלכתחילה — וזו בדיוק ההטעיה שהבדיקה קיימת כדי לשלול.
    await expect(page.getByTestId('overview-row-99003')).toBeVisible({ timeout: 30_000 })

    for (const filter of ['missing', 'urgent']) {
      await page.getByTestId(`overview-filter-${filter}`).click()

      await expect(page.getByTestId('overview-empty-filtered')).toBeVisible()
      await expect(page.getByTestId('overview-empty-filtered')).toContainText('התואמים לסינון')
      // 🔴 **הלב, ולא קוסמטיקה:** ריק-שנגרם-בסינון לעולם אינו מתחזה ל"אין כרגע אירועים"
      // (`overview-empty-true`) — שתי משמעויות הפוכות שנראות זהות בדפדפן.
      await expect(page.getByTestId('overview-empty-true')).toHaveCount(0)
      // ...ומציע לנקות. הצעה שאינה על המסך משאירה את המנהלת תקועה במסך ריק.
      await expect(page.getByTestId('overview-clear-filters')).toBeVisible()

      await page.getByTestId('overview-clear-filters').click()
      await expect(page.getByTestId('overview-table')).toBeVisible()
    }
  })

  // 🕓 **תוקנה 11/08/2026 בצעד 5.1 — והיא עצמה הייתה ההדגמה החיה של הכלל.** הגרסה הראשונה
  // (‏09/08) קיבעה `(0)` כאמת נצחית, ו**נפלה יומיים אחר-כך בלי שום באג**: הזימון של
  // `רוני אלמוג` נשלח ב-09/08, חלון הקישור הוא 48 שעות, ומאותו רגע יש בדיוק אחד "פג תוקף"
  // שאפשר לשלוח לו מחדש ⇒ הכפתור נדלק והציג `(1)`. **אומת ב-`git stash` שהיא נופלת גם על
  // הקוד שלפני השינוי** (`e2e/CLAUDE.md`: לפני שמייחסים כשל-E2E לשינוי האחרון).
  //
  // 🔴 **הכלל שהבדיקה נושאת בשמה — "אינו נעלם" — הוא הכלל האמיתי** (§11.4): פקד שנעלם
  // מלמד שהמערכת לא-עקבית; פקד מכובה עם מספר מלמד **למה**. ⇒ נבדק שהוא תמיד קיים,
  // ושמצב-הכיבוי **עקבי עם המספר שעליו** — טענה שאינה תלויה בשעון.
  test('"שלח שוב למי שפג תוקפן" אינו נעלם, ומצב-הכיבוי שלו עקבי עם המספר שעליו', async ({
    page,
  }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/hostesses')
    const bulk = page.getByTestId('overview-resend-all')
    await expect(bulk).toBeVisible({ timeout: 30_000 })

    const label = (await bulk.textContent()) ?? ''
    const count = Number(label.match(/\((\d+)\)/)?.[1])
    expect(Number.isFinite(count)).toBe(true)

    if (count === 0) await expect(bulk).toBeDisabled()
    else await expect(bulk).toBeEnabled()
  })

  // 🔴 **הבדיקה החשובה ביותר במסך הזה.** טבלה עם RLS ובלי policy מחזירה
  // `{data:null, error:null}` — "הצלחה ריקה" — ו"אין כרגע אירועים" הוא כאן **בשורה טובה**.
  // ⇒ שתי משמעויות הפוכות שנראות זהות. הבדיקה מפילה את השאילתה בכוונה ומאמתת שהמסך צועק.
  test('🔴 כשל-טעינה מציג שגיאה + "נסה שוב", לעולם לא "אין כרגע אירועים"', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    await page.route('**/rest/v1/projects*', (route) =>
      route.fulfill({ status: 500, body: '{"message":"boom"}' }),
    )
    await page.goto('/hostesses')

    await expect(page.getByTestId('overview-retry')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('לא הצלחנו לטעון את רשימת האירועים')).toBeVisible()
    await expect(page.getByTestId('overview-empty-true')).toHaveCount(0)

    // רגרסיה: מסירים את היירוט ולוחצים "נסה שוב" — המסך חוזר לעצמו.
    await page.unroute('**/rest/v1/projects*')
    await page.getByTestId('overview-retry').click()
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
  })

  test('🔒 מנהלת פרויקטים רואה את הרשימה — ומ-19/08/2026 גם את פקדי-השליחה (edit)', async ({
    page,
  }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await page.goto('/hostesses')

    // 🔑 **בקרה חיובית קודם:** אם ההתחזות שבורה, המסך ריק והבדיקה מוכיחה כלום.
    await expect(page.getByTestId('overview-table')).toBeVisible({ timeout: 30_000 })
    // הכרעת-ישי 19/08/2026 ("מאוד פשוט, להרחיב לה הרשאה"): התא דיילות×מנהלת-פרויקטים
    // הוחלף view→edit כדי שמיילי-הזימון-מחדש של שינוי-תאריך (מ6, ㉑) ייכתבו מהלקוח.
    // ⇒ הציפייה התהפכה: פקדי-השליחה כן מוצגים לה. ⚠️ לתפקיד-view על 'דיילות' אין עוד
    // נושא חי במטריצה — מסלול-ה-view בקוד נותר מכוסה בבדיקות-יחידה בלבד.
    await expect(page.locator('[data-testid^="overview-resend-"]').first()).toBeVisible()
  })

  // 🔴 **מצב T-24 — המצב היחיד במשטח 1 שאי-אפשר להעמיד על דאטה חיה** (`spec.md ✅#6`):
  // הוא דורש אירוע שמתחיל בתוך 24 שעות, ואירועי-הדגמה כאלה אינם קיימים ואסור ליצור אותם
  // (‏`e2e/CLAUDE.md` — אפס הזרקות למסד). ⇒ נכפה **ברשת**: אותה שאילתה, תשובה מומצאת.
  //
  // 🛡️ **ובעיקר — הבדיקה מריצה את שני הכיוונים על אותה דאטה בדיוק**, כי שער שראו אותו
  // רק *עובר* אינו שער (`src/CLAUDE.md`): קודם אירוע רחוק ⇒ כפתור-השליחה קיים ומונה 1,
  // ואז **אותו אירוע עצמו** בתוך 24 שעות ⇒ הכפתור מוחלף בניתוב והמונה יורד ל-0.
  test('🔴 מצב T-24: הקישור מת ⇒ כפתור-השליחה מוחלף בניתוב, וגם הכפתור המרוכז מפסיק לספור אותו', async ({
    page,
  }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // זימון שפג תוקפו (נשלח לפני 5 ימים, חלון הקישור 48 שעות) — בלעדיו "פג תוקפן" הוא 0
    // ממילא, והבדיקה הייתה עוברת גם אילו שער ה-T-24 לא היה קיים כלל.
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600_000).toISOString()
    const serveProject = (startsAt) =>
      page.route('**/rest/v1/projects*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              project_id: 99001,
              event_name: 'אירוע בדיקת T-24',
              customer_name: 'לקוח בדיקה',
              final_event_date: startsAt.date,
              final_start_time: startsAt.time,
              final_end_time: '23:00:00',
              final_location: 'אולם בדיקה',
              required_hostess_count: 4,
              project_status: 'not_started',
              assignments: [
                {
                  project_id: 99001,
                  hostess_id: 99001,
                  assignment_number: 1,
                  assignment_status: 'pending',
                  invite_sent_at: fiveDaysAgo,
                },
              ],
            },
          ]),
        }),
      )

    // ── בקרה שלילית: אותו אירוע, רחוק ⇒ ההגנה **אינה** אמורה לפעול ─────────────
    const farDate = new Date(Date.now() + 30 * 24 * 3600_000).toISOString().slice(0, 10)
    await serveProject({ date: farDate, time: '10:00:00' })
    await page.goto('/hostesses')
    await expect(page.getByTestId('overview-row-99001')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('overview-resend-99001')).toBeEnabled()
    await expect(page.getByTestId('overview-resend-all')).toContainText('(1)')

    // ── ואותו אירוע בתוך 24 שעות ⇒ ההגנה נושכת ────────────────────────────────
    // ⚠️ **שעון-הקיר של האירוע נגזר מהשעה הנוכחית ולא מקובע** — `eventStartInstant` מפרש
    // תאריך+שעה כשעון ישראל, ושעה קבועה כמו "מחר ב-09:00" הייתה בתוך החלון או מחוצה לו
    // **לפי השעה שבה הבדיקה במקרה רצה**. שמונה שעות קדימה נמצאות תמיד בתוך 24.
    const soon = new Date(Date.now() + 8 * 3600_000)
    const pad = (n) => String(n).padStart(2, '0')
    await page.unroute('**/rest/v1/projects*')
    await serveProject({
      date: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`,
      time: `${pad(soon.getHours())}:${pad(soon.getMinutes())}:00`,
    })
    await page.reload()
    await expect(page.getByTestId('overview-row-99001')).toBeVisible({ timeout: 30_000 })

    await expect(page.getByTestId('overview-row-99001')).toContainText('בתוך 24 שעות')
    await expect(page.getByTestId('overview-row-99001')).toContainText('לשיבוץ →')
    // הכפתור אינו "מכובה" אלא **אינו קיים** — הפעולה שנשארה היא הטלפון, במסך השיבוץ.
    await expect(page.getByTestId('overview-resend-99001')).toHaveCount(0)
    // ⚠ נדלק על **חוסר** בתוך T-24, לא על קרבה: כאן חסרות 4 מתוך 4.
    await expect(page.getByTestId('overview-row-99001')).toContainText('⚠')
    // 🔴 והכפתור המרוכז ירד מ-1 ל-0 — כלומר הוא אינו סופר קישור שנולד מת.
    await expect(page.getByTestId('overview-resend-all')).toContainText('(0)')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// משטח 3 — מאגר הדיילות (צעד 5.1)
//
// 🔑 **מה נבדק כאן ומה במכוון לא:** המסך והחסימות — כן. **מסלול-הכתיבה — לא**, ובכוונה:
// אין סביבת-בדיקה נפרדת, ולחיצה אמיתית על "שמור" הייתה מוסיפה דיילת למאגר-ההדגמה של
// הכנס (`e2e/CLAUDE.md`). מסלול-הכתיבה מכוסה בבדיקות-היחידה של `src/lib/hostesses.js`
// ובריצה החיה שבה 20 הדיילות נוצרו דרך המסך (`local-14`).
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('מודול 4 · משטח 3 — מאגר הדיילות', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('לשונית המאגר מציגה דיילות אמיתיות ואת שלושת המסננים', async ({ page }) => {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('repository-search')).toBeVisible()
    await expect(page.getByTestId('repository-city')).toBeVisible()
    await expect(page.getByTestId('repository-active-only')).toBeVisible()
    await expect(page.locator('[data-testid^="repository-row-"]').first()).toBeVisible()
  })

  test('🔴 סינון-עיר מצמצם באמת — כל שורה שנשארה היא מהעיר שנבחרה', async ({ page }) => {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })

    // 🕓 העיר נבחרת מהרשימה בזמן-ריצה — עיר מקודדת הייתה מתה ביום שדיילת אחרונה בה תושבת.
    await page.getByTestId('repository-city').click()
    const option = page.getByRole('option').nth(1) // [0] = "כל הערים"
    const cityName = (await option.textContent())?.trim()
    await option.click()

    // 🔴 **הטענה היא על התוכן ולא על הספירה:** "פחות שורות" עובר בירוק גם על סינון שגוי.
    await expect(page.locator('[data-testid^="repository-row-"]').first()).toBeVisible()
    const cities = await page
      .locator('[data-testid^="repository-row-"] td:nth-child(2)')
      .allTextContents()
    expect(cities.length).toBeGreaterThan(0)
    expect(cities.every((c) => c.trim() === cityName)).toBe(true)
  })

  test('🔴 ריק-אחרי-סינון ו"מאגר ריק" הן שתי הודעות שונות — וזו לא קוסמטיקה', async ({ page }) => {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('repository-search').fill('קגכעחלךמנס')
    await expect(page.getByTestId('repository-empty-filtered')).toBeVisible()
    // 🔑 **הלב של הבדיקה:** הודעה אחת לשני המצבים הייתה גורמת למנהלת לחשוב שהמאגר נמחק.
    await expect(page.getByTestId('repository-empty-true')).toHaveCount(0)

    await page.getByTestId('repository-clear-filters').click()
    await expect(page.getByTestId('repository-table')).toBeVisible()
  })

  test('🔴 מאגר ריק באמת אומר משהו אחר לגמרי — נכפה ברשת, לא בדאטה', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // ⚠️ **הצד השני של הבדיקה שמעליה, ובלעדיו היא מוכיחה חצי:** מאגר ריק אמיתי אינו קיים
    // (‏20+ דיילות במסד, ואין מחיקה במודול), ולכן המצב נכפה ברשת — אותה שאילתה, תשובה ריקה.
    await page.route('**/rest/v1/hostesses*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.goto('/hostesses')
    await page.getByTestId('hostesses-tab-repository').click()

    await expect(page.getByTestId('repository-empty-true')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('repository-empty-filtered')).toHaveCount(0)
  })

  test('🔴 כשל-טעינה מציג שגיאה + "נסה שוב", ולעולם לא "עדיין אין דיילות במאגר"', async ({
    page,
  }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    // 🔴 זהו `spec.md ✅#4` על המשטח הזה: טבלה עם RLS ובלי policy מחזירה `{data:null,error:null}`,
    // כלומר **הצלחה ריקה** — ו"אין דיילות" הוא כאן שקר מוחלט שנראה בדיוק כמו האמת.
    await page.route('**/rest/v1/hostesses*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced"}' }),
    )
    await page.goto('/hostesses')
    await page.getByTestId('hostesses-tab-repository').click()

    await expect(page.getByTestId('repository-retry')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('לא הצלחנו לטעון את המאגר')).toBeVisible()
    await expect(page.getByTestId('repository-empty-true')).toHaveCount(0)

    // רגרסיה: מסירים את היירוט ולוחצים "נסה שוב" — המסך חוזר לעצמו.
    await page.unroute('**/rest/v1/hostesses*')
    await page.getByTestId('repository-retry').click()
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })
  })

  test('🖱️ לחיצה בכל מקום בשורה פותחת את הכרטיס — לא רק על השם, וגם מהמקלדת', async ({ page }) => {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })

    // 🔴 רגרסיה לממצא שישי עצמו הצביע עליו בסבב 3.7 ("בדומה ללקוחות… לא רק לחיצה על השם"):
    // עד אז רק תא-השם היה לחיץ. לכן הלחיצה כאן היא דווקא על **תא העיר**.
    const firstRow = page.locator('[data-testid^="repository-row-"]').first()
    await firstRow.locator('td').nth(1).click()
    await expect(page.getByTestId('hostess-card-title')).toBeVisible({ timeout: 15_000 })
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('hostess-card-title')).toHaveCount(0)

    // ⌨️ ואותו דבר מהמקלדת — `<tr>` אינו בר-מיקוד מטבעו, וזה החצי שנשכח בשלושה מסכים.
    await firstRow.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('hostess-card-title')).toBeVisible({ timeout: 15_000 })
  })

  test('🔒 מנהלת פרויקטים במאגר — מ-19/08/2026 בדרגת edit: שכר ופקדי-עריכה מוצגים', async ({
    page,
  }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    await openRepository(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)

    // 🔑 **בקרה חיובית קודם:** בלעדיה, התחזות שבורה נראית כמו הרשאות מושלמות.
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid^="repository-row-"]').first()).toBeVisible()

    // הכרעת-ישי 19/08/2026: התא דיילות×מנהלת-פרויקטים הוחלף view→edit (מיילי-㉑ של מ6).
    // ⇒ עמודת-השכר ופקדי-העריכה כן מוצגים לה — הציפייה הישנה ("בלי שכר, בלי עריכה")
    // תיעדה את המטריצה שלפני ההכרעה. מסלול-ה-view בקוד נותר מכוסה בבדיקות-יחידה.
    await expect(page.getByRole('columnheader', { name: 'שכר שעתי' })).toBeVisible()
    await expect(page.getByTestId('repository-add')).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// משטחים 3ב/3ג — טופס ההוספה והעריכה
//
// 🚫 **אף בדיקה כאן אינה לוחצת "שמור".** שלוש התנהגויות-הוולידציה נבדקות דרך מצב הכפתור
// ודרך ההודעה שמתחת לשדה — וזה בדיוק מה שהמנהלת רואה.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('מודול 4 · משטחים 3ב/3ג — טופס הדיילת', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  async function openAddDialog(page) {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('repository-add').click()
    await expect(page.getByTestId('hostess-dialog-title')).toBeVisible()
  }

  test('🔴 ת"ז לא-תקינה חוסמת שמירה ואומרת למה — ותקינה משחררת את החסימה', async ({ page }) => {
    await openAddDialog(page)

    // ספרת-ביקורת שגויה. **החסימה הזאת היא הסיבה שאין UNIQUE על המייל** (§7.65):
    // את כפילות-האדם מונעת הת"ז, ולכן היא חייבת להיות אמינה.
    await page.getByTestId('hostess-id-number').fill('123456789')
    await expect(page.getByText('מספר תעודת זהות אינו תקין')).toBeVisible()
    await expect(page.getByTestId('hostess-save')).toBeDisabled()

    // 🛡️ והכיוון ההפוך, אחרת הבדיקה מוכיחה רק שהכפתור מכובה משהו: ת"ז תקינה מסירה
    // את ההודעה. (הכפתור נשאר מכובה — שאר שדות-החובה עדיין ריקים, וזה נכון.)
    await page.getByTestId('hostess-id-number').fill('123456782')
    await expect(page.getByText('מספר תעודת זהות אינו תקין')).toHaveCount(0)
  })

  test('🔴 שכר מתחת למינימום חוסם — והרף מגיע מהמערכת, לא מהבדיקה', async ({ page }) => {
    await openAddDialog(page)

    // ⚠️ **הבדיקה אינה נוקבת בסכום המינימום בכוונה** — הוא פרמטר במסד, ומספר מקודד כאן
    // היה הופך את הבדיקה לעותק שני שלו שמתיישן בשקט ביום שהפרמטר יעודכן.
    await page.getByTestId('hostess-hourly-rate').fill('1')
    await page.getByTestId('hostess-hourly-rate').blur()
    await expect(page.getByText('שכר מינימום').first()).toBeVisible()
    await expect(page.getByTestId('hostess-save')).toBeDisabled()
  })

  test('🟡 מייל שכבר רשום מזהיר — ואינו חוסם (§7.65)', async ({ page }) => {
    await openRepository(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await expect(page.getByTestId('repository-table')).toBeVisible({ timeout: 30_000 })

    // 🕓 הכתובת נשאבת בזמן-ריצה מדיילת קיימת — כתובת מקודדת הייתה מתיישנת ביום שהיא תעודכן.
    await page.locator('[data-testid^="repository-edit-"]').first().click()
    await expect(page.getByTestId('hostess-email')).toBeVisible()
    const existingEmail = await page.getByTestId('hostess-email').inputValue()
    await page.keyboard.press('Escape')

    await page.getByTestId('repository-add').click()
    await expect(page.getByTestId('hostess-dialog-title')).toBeVisible()

    // כל שדות-החובה מלאים ותקינים — אחרת "הכפתור פעיל" לא היה מוכיח דבר על **המייל**.
    await page.getByTestId('hostess-id-number').fill('123456782')
    await page.getByTestId('hostess-full-name').fill('בדיקת אימייל כפול')
    await page.getByTestId('hostess-phone').fill('050-0000000')
    await page.getByTestId('hostess-city').fill('תל אביב')
    await page.getByTestId('hostess-hourly-rate').fill('80')
    await page.getByTestId('hostess-bank-name').fill('הפועלים')
    await page.getByTestId('hostess-bank-branch').fill('123')
    await page.getByTestId('hostess-bank-account').fill('123456')
    await page.getByTestId('hostess-email').fill(existingEmail)

    // 🟡 **מזהיר ולא חוסם** — תיבה משפחתית משותפת היא מקרה לגיטימי (הכרעת §7.65).
    await expect(page.getByText('כתובת זו כבר רשומה אצל')).toBeVisible()
    // 🚫 **ומכאן והלאה לא נוגעים בכפתור.** הוא פעיל, וזו בדיוק הטענה — לחיצה עליו הייתה
    // כותבת דיילת אמיתית למאגר-ההדגמה של הכנס.
    await expect(page.getByTestId('hostess-save')).toBeEnabled()
  })

  test('שדות-החובה נושאים דוגמה, ו-Enter מוגדר לשלוח את הטופס', async ({ page }) => {
    await openAddDialog(page)

    // רגרסיה לממצא ⑦ של סבב 3.7: ארבעה שדות-חובה היו בלי `placeholder`, בניגוד לכלל
    // שישי עצמו קבע פעם אחת (`src/CLAUDE.md`, מעבר-קלט-ריק).
    for (const id of ['hostess-full-name', 'hostess-bank-name', 'hostess-bank-branch']) {
      const placeholder = await page.getByTestId(id).getAttribute('placeholder')
      expect(placeholder?.trim().length ?? 0).toBeGreaterThan(0)
    }

    // רגרסיה לממצא ⑥: לא היה `<form>` עוטף, ולכן Enter לא עשה כלום. ⚠️ **נבדק מבנית
    // ולא בלחיצת-Enter אמיתית** — Enter על טופס תקין *ישמור*, וזו כתיבה למסד.
    await expect(page.getByTestId('hostess-save')).toHaveAttribute('type', 'submit')
    await expect(
      page.locator('form').filter({ has: page.getByTestId('hostess-save') }),
    ).toHaveCount(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// חלון ההשבתה — שלוש דרכים (§א4)
//
// ⚠️ **דאטה מומצאת לגמרי, ובכוונה כפולה:** ‏(1) על דאטה חיה אין דרך לדעת מראש לאיזו
// דיילת יש שיבוץ עתידי פעיל, ומתג על דיילת **בלי** שיבוץ כזה **משבית אותה מיד** —
// כתיבה אמיתית למאגר-ההדגמה. ‏(2) המזהה 999001 אינו קיים במסד, ולכן אפילו לחיצה שגויה
// לא הייתה נוגעת בשורה אמיתית.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('מודול 4 · משטח 3 — חלון ההשבתה', () => {
  test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')

  test('🔴 דיילת עם שיבוץ עתידי — המתג שואל, ולא משבית בשקט', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)

    const futureDate = new Date(Date.now() + 21 * 24 * 3600_000).toISOString().slice(0, 10)
    await page.route('**/rest/v1/hostesses*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            hostess_id: 999001,
            id_number: '123456782',
            full_name: 'דיילת בדיקת השבתה',
            phone: '050-0000000',
            email: 'deactivate.test@example.com',
            city: 'תל אביב',
            address: null,
            hourly_rate: 80,
            rating: 4,
            has_car: true,
            languages: null,
            status: 'active',
            lat: null,
            lng: null,
            hostess_unavailability: [],
          },
        ]),
      }),
    )
    await page.route('**/rest/v1/assignments*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            project_id: 99002,
            hostess_id: 999001,
            assignment_number: 1,
            assignment_status: 'finally_approved',
            invite_sent_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
            projects: { event_name: 'אירוע בדיקת השבתה', final_event_date: futureDate },
          },
        ]),
      }),
    )

    await page.goto('/hostesses')
    await page.getByTestId('hostesses-tab-repository').click()
    await expect(page.getByTestId('repository-row-999001')).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('repository-toggle-999001').click()

    // 🔴 **שלוש דרכים אמיתיות, לא שתיים ולא טקסט מת** — עד סבב 3.7 החלון הזה אמר
    // "שחרור מהאירועים יתווסף בהמשך" על יכולת שכבר נבנתה בצעדים 3.4/3.5.
    await expect(page.getByTestId('deactivate-dialog')).toBeVisible()
    await expect(page.getByTestId('deactivate-dialog')).toContainText('אירוע בדיקת השבתה')
    await expect(page.getByTestId('deactivate-release')).toBeVisible()
    await expect(page.getByTestId('deactivate-keep')).toBeVisible()
    await expect(page.getByTestId('deactivate-cancel')).toBeVisible()

    // 🚫 **"שחרר מהאירועים" לעולם לא נלחץ כאן** — הוא שולח מייל-ביטול אמיתי. יוצאים בביטול.
    await page.getByTestId('deactivate-cancel').click()
    await expect(page.getByTestId('deactivate-dialog')).toHaveCount(0)
    await expect(page.getByTestId('repository-row-999001')).toBeVisible()
  })
})
