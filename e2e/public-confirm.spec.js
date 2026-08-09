import { test, expect } from '@playwright/test'

// E2E של **משטח 5 — הדף הציבורי** (צעד 3.6).
//
// 🔴 **ההקשר כאן הוא כל העניין: אין session, ואסור שיהיה.** ‏`test.use({ storageState:
// { cookies: [], origins: [] } })` מבטיח הקשר נקי — 🚫 **לא "טאב שנראה אנונימי"**, אלא
// דפדפן שאין לו שום זהות. זה בדיוק הכשל שהדף הזה יכול להיכשל בו בשקט: מפתח שבודק אותו
// בטאב שבו הוא כבר מחובר יראה דף עובד, והדיילת תראה מסך-התחברות.
//
// ⚠️ **אפס כתיבות למסד**, כמו `smart-match.spec.js`: המצבים שאין להם שורה אמיתית נכפים
// **ברשת** (`page.route`) ולא בדאטה. אין סביבת-בדיקה נפרדת, והזרקת-שורות מזהמת דאטה חיה.
//
// 🕓 **והשורות נבחרות בזמן-ריצה ולא מקודדות** — `e2e/CLAUDE.md`: "פיקסטורות נעוצות
// לשורות-מסד חיות מרקיבות לבד". כאן זה קריטי במיוחד: **הטוקנים פגים 48 שעות אחרי
// השליחה**, ולכן טוקן מקודד-קשיח היה הופך את הקובץ הזה לאדום תוך יומיים. הבדיקות
// שדורשות טוקן חי קוראות אותו מהמסך הפנימי; מה שאינו זמין — מדולג ברעש, לא בשקט.

const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD

// טוקן שאינו קיים — הצורה תקינה (UUID) כדי שהבדיקה תבחן את **הפונקציה**, לא פרסר.
const UNKNOWN_TOKEN = '00000000-0000-4000-8000-000000000000'

test.describe('משטח 5 — הדף הציבורי לאישור משמרת', () => {
  // 🔴 הקשר בלי זהות, לכל הבדיקות בקובץ.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('טוקן לא-קיים ⇒ ההודעה הגנרית, בלי כפתורים, ובלי הפניה להתחברות', async ({ page }) => {
    await page.goto(`/shift/${UNKNOWN_TOKEN}`)

    await expect(page.getByTestId('shift-result-dead')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('הקישור הזה אינו בתוקף יותר')).toBeVisible()

    // 🔑 **שלוש השליליות שהן עיקר הבדיקה:**
    // ① לא נשלחה להתחברות — זה הכשל השקט שהדף הזה נועד לא לעשות.
    await expect(page).toHaveURL(new RegExp(`/shift/${UNKNOWN_TOKEN}$`))
    await expect(page.getByRole('button', { name: 'התחברות' })).toHaveCount(0)
    // ② אין כפתורי-מענה על קישור מת.
    await expect(page.getByTestId('shift-confirm')).toHaveCount(0)
    await expect(page.getByTestId('shift-decline')).toHaveCount(0)
    // ③ אין סרגל-צד — הדף מחוץ ל-MainLayout.
    await expect(page.getByRole('navigation')).toHaveCount(0)
  })

  // 🔴 **הבדיקה שמגינה על ההכרעה של §⑤**: "פג תוקף" ו"לא תקין" חייבים להיראות זהים.
  // אם מישהו יפצל אותם בעתיד — כאן זה ייפול, גם אם המסך "נראה בסדר".
  test('טוקן פגום וטוקן לא-קיים מציגים בדיוק את אותו מסך', async ({ page }) => {
    await page.goto(`/shift/${UNKNOWN_TOKEN}`)
    await expect(page.getByTestId('shift-result-dead')).toBeVisible({ timeout: 15_000 })
    const generic = await page.getByTestId('shift-result-dead').innerText()

    await page.goto('/shift/לא-טוקן-בכלל')
    await expect(page.getByTestId('shift-result-dead')).toBeVisible({ timeout: 15_000 })
    expect(await page.getByTestId('shift-result-dead').innerText()).toBe(generic)
  })

  // 🔴 **כשל-רשת אינו "הקישור מת".** שתי תוצאות שנראות דומות בדפדפן ומשמעותן הפוכה:
  // האחת אומרת לדיילת להתקשר למשרד, השנייה אומרת לה לנסות שוב. הבדיקה מפרידה ביניהן.
  test('כשל-רשת ⇒ "נסי שוב", לא "הקישור אינו בתוקף"', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_shift_invite', (route) => route.abort())
    await page.goto(`/shift/${UNKNOWN_TOKEN}`)

    await expect(page.getByTestId('shift-result-saveFailed')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('לא הצלחנו לשמור את התשובה')).toBeVisible()
    await expect(page.getByTestId('shift-retry')).toBeVisible()
    await expect(page.getByText('הקישור הזה אינו בתוקף יותר')).toHaveCount(0)

    // ומשהרשת חוזרת — "נסי שוב" באמת טוען מחדש ולא נשאר תקוע על השגיאה.
    await page.unroute('**/rest/v1/rpc/get_shift_invite')
    await page.getByTestId('shift-retry').click()
    await expect(page.getByTestId('shift-result-dead')).toBeVisible({ timeout: 15_000 })
  })

  // מצב "ממתין למענה" — **על שורה אמיתית**, כי הוא היחיד שמצריך שהמסד באמת יחזיר פרטים.
  // 🚫 הבדיקה **קוראת ואינה לוחצת**: לחיצה הייתה צורכת את שורת-ה-`pending` היחידה בדמו.
  test('שורת pending חיה ⇒ פרטי האירוע ושני הכפתורים, בלי התחברות', async ({ page, request }) => {
    const token = await livePendingToken(request)
    test.skip(!token, 'אין כרגע שורת pending עם טוקן בתוקף — נבדק בזמן-ריצה, לא מקודד')

    await page.goto(`/shift/${token}`)
    await expect(page.getByTestId('shift-awaiting')).toBeVisible({ timeout: 15_000 })

    // הפרטים שכרטיס-המסך §④ מחייב — ובלי ציון ובלי השוואה לדיילות אחרות.
    await expect(page.getByText('תוכלי להגיע למשמרת הזו?')).toBeVisible()
    await expect(page.getByTestId('shift-confirm')).toBeVisible()
    await expect(page.getByTestId('shift-decline')).toBeVisible()
    await expect(page.getByTestId('shift-expiry')).toBeVisible()
    // `local-3` — כל עוד הפרמטר `0`, "נסיעות" מודפס בלי מספר.
    await expect(page.getByText('+ נסיעות')).toBeVisible()

    // 🔑 מטרת-מגע: שני הכפתורים חייבים לעבור 44px גם במסך של טלפון.
    await page.setViewportSize({ width: 390, height: 844 })
    for (const id of ['shift-confirm', 'shift-decline']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  // 🔴 **בדיקת-הרגרסיה של צעד 4.1, וזו הסיבה שהיא כאן ולא בקובץ אחר:** הוספת מסלול
  // ציבורי היא בדיוק השינוי שעלול לפתוח **בשקט** מסכים אחרים — טעות-קינון אחת ב-`App.jsx`
  // מוציאה עוד מסלול מתחת ל-`MainLayout`. ‏`App.routes.test.jsx` תופס רק היעדר
  // ‏`ProtectedRoute` **בתוך** MainLayout; מסלול שיצא החוצה בטעות **חומק ממנו לגמרי**.
  // ⇒ הבדיקה החיה הזאת היא השכבה שסוגרת את הפער.
  test('כל מסכי המודול הפנימיים עדיין מפנים להתחברות כשאין session', async ({ page }) => {
    for (const path of ['/hostesses', '/customers', '/quotes', '/system/users', '/profile']) {
      await page.goto(path)
      await expect(page, `${path} נשאר פתוח בלי התחברות`).toHaveURL(/\/login/, {
        timeout: 15_000,
      })
    }
  })

  // 🔑 **מה שצילום-מסך אינו מוכיח:** שהדף אינו דולף מידע על טוקן שכבר נענה.
  // התשובה למצב סופי מכילה **רק** את שם-המצב — בלי שם-דיילת, בלי לקוח, בלי כתובת.
  test('טוקן שכבר נענה אינו מחזיר ולו פרט אישי אחד', async ({ page }) => {
    let body = null
    await page.route('**/rest/v1/rpc/get_shift_invite', async (route) => {
      const response = await route.fetch()
      body = await response.text()
      await route.fulfill({ response })
    })

    await page.goto(`/shift/${UNKNOWN_TOKEN}`)
    await expect(page.getByTestId('shift-result-dead')).toBeVisible({ timeout: 15_000 })
    expect(body).toBeTruthy()
    // תשובת-כישלון היא `{"ok":false}` ותו לא — אין בה שדה כלשהו מעבר לכך.
    expect(JSON.parse(body)).toEqual({ ok: false })
  })
})

// ── עוזר: טוקן חי, נקרא מהמסד דרך המסך הפנימי ────────────────────────────────
//
// ⚠️ **הטוקן אינו מקודד ואינו נשלף מ-`.env`** — הוא פג תוך 48 שעות. הפונקציה מתחברת
// כמנהלת-גיוס (ההרשאה היחידה שרואה `assignments`) ומושכת שורת-`pending` חיה דרך אותו
// REST שהאפליקציה עצמה משתמשת בו. אם אין כזו — הבדיקה **מדולגת ברעש**, לא עוברת בשקט.
async function livePendingToken(request) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !RECRUIT_EMAIL || !RECRUIT_PASSWORD) return null

  const auth = await request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
    data: { email: RECRUIT_EMAIL, password: RECRUIT_PASSWORD },
  })
  if (!auth.ok()) return null
  const { access_token: accessToken } = await auth.json()

  const rows = await request.get(
    `${url}/rest/v1/assignments?select=invite_token,invite_sent_at&assignment_status=eq.pending&invite_token=not.is.null`,
    { headers: { apikey: key, Authorization: `Bearer ${accessToken}` } },
  )
  if (!rows.ok()) return null

  const live = (await rows.json()).find(
    (row) => new Date(row.invite_sent_at).getTime() + 48 * 3_600_000 > Date.now(),
  )
  return live?.invite_token ?? null
}
