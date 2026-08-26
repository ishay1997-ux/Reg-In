import { test, expect } from '@playwright/test'

// E2E מודול 5 — **שני המשטחים** (צעד 4.4): תור-העבודה `/logistics` ודיאלוג-הצ'קליסט.
//
// ⚠️ **אפס כתיבות למסד.** אין סביבת-בדיקה נפרדת (`e2e/CLAUDE.md`, הסעיף הראשון) ⇒ כל מצב
// שאינו קיים בדאטה החיה מיוצר ב**יירוט-רשת** (`page.route`) בלבד, לעולם לא בהזרקת שורות.
// 🔒 ומעבר להצהרה — **מנגנון**: `installWriteGuard` חוסם ברמת-הרשת כל בקשה שאינה
// `GET/HEAD/OPTIONS` אל Supabase פרט לזרימת-ההתחברות, ואוסף את מה שנחסם. כל בדיקה מאשרת
// בסופה שהאוסף ריק. הבדיקה היחידה שמפעילה במכוון את ה-RPC הכותב מיירטת אותו **בעצמה**
// (‏`route.fulfill`) — כלומר גם שם הבקשה לעולם אינה עוזבת את הדפדפן.
//
// 🔒 בחירת-נושא בזמן-ריצה לפי תנאי, לעולם לא `project_id` קשיח ולא מספר חי (מונה/סכום/
// תאריך/סטטוס): שניהם מרקיבים לבד, ושניהם כבר שברו את החבילה הזאת (`e2e/CLAUDE.md`,
// "פיקסטורות נעוצות… מרקיבות לבד" + "וגם מספר חי הוא פיקסטורה"). ⇒ כל טענה מספרית כאן
// היא **אינווריאנט עצמי**: המסך נמדד מול עצמו (מונה-גלולה מול ספירת-השורות שרונדרו).
//
// 🔴 ומדידה שהמכנה שלה 0 אינה ירוקה — היא לא רצה (`e2e/CLAUDE.md`, 26/08/2026, **על
// דיאלוג של המודול הזה**): כל סריקה כאן מאשרת קודם שהאוסף אינו ריק, וההמתנה היא **לתוכן
// הנמדד עצמו** ולא ל-`toBeVisible` של המעטפת.
//
// 🔑 הטענות המרכזיות של הקובץ:
//   ① סדר-הענפים של כרטיס §④ — **אפס שורות-לוגיסטיקה נקרא "חסום", לעולם לא "התור ריק"**,
//      והמונים מציגים `—` ולא `0`.
//   ② ㊲+㉝+㊴ — שורה שנטענה **פעילה**, סטטוס שנקרא-מחדש מחזיר `cancelled` ⇒ הפקדים
//      ננעלים, **ושדה `actual_qty` נשאר הפתוח היחיד**.
//   ③ **כתיבה שנחסמה אינה מדווחת "נשמר"** — מחרוזת S-2 מוצגת והערך חוזר לקודמו.
//   ④ ענפי-הרשאה: `E2E_STAFF_*` (= מנהלת לוגיסטיקה, `edit`) רואה · `E2E_RECRUIT_*` חסומה ·
//      `E2E_PROJECTS_*` (`view`) רואה את הערכים **כטקסט**, בלי פקדי-כתיבה.

const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD
const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD

// ── מחרוזות נעולות שהבדיקה נשענת עליהן ────────────────────────────────────────────────
// מועתקות בייט-בבייט מהמקור שהן חיות בו; הבדיקה **אינה** מנסחת אותן מחדש.
// ‏`src/lib/projectLogistics.js`:
const QUEUE_NO_PERMISSION_SENTENCE =
  'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין.'
const WRITE_FAILURE_SENTENCE = 'העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב.'
const QUEUE_SORT_LINE = 'ממוין: לפי קרבת האירוע'
// ‏`src/components/PermissionAwareEmpty.jsx` (נעולות בתוך הרכיב, בלשון-נקבה — ㉜/S-28):
const ERROR_TITLE = 'לא ניתן לטעון את הנתונים.'
const RETRY_LABEL = 'נסי שוב'
const DENIED_MARK = '—'
// ‏`src/modules/05_logistics/LogisticsPage.jsx`:
const DISABLED_PILL_TITLE = 'אין כרגע פרויקט במצב הזה'
const FILTERED_EMPTY_TITLE = 'אין פרויקט התואם למסנן שבחרת.'
const OUTBOUND_HEADING = 'יוצא עד יום העסקים הבא'
// ‏`src/modules/05_logistics/ChecklistDialog.jsx`:
const CANCELLED_CONTROL_TITLE = 'הפרויקט בוטל — לא ניתן לעדכן'
const CANCELLED_QTY_TITLE = 'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)'
const QTY_LOCKED_BY_ITEM = 'הפריט טרם הוזמן — הכמות בפועל נפתחת לעריכה אחרי סימון "הוזמן"'
const CANCEL_BANNER_LINE = 'אין לעדכן מצב או הערה בפרויקט מבוטל.'
const CANCEL_BANNER_QTY_LINE = 'אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים.'
const SHORTFALL_LEAD = 'נרשם חוסר של '
const SHORTFALL_EMPHASIS = 'הוא מתועד ואינו עוצר את הפרויקט'

// שלוש הגלולות בדיוק, בשמן ובסדרן (㉙). 🚫 **ואין רביעית, ובפרט אין `בוטלו`** — פרויקט
// מבוטל אינו פעיל ואינו מגיע למשטח הזה בשום מסנן (כרטיס משטח 1 §①).
const PILLS = [
  { key: 'needsAction', label: 'דורש טיפול' },
  { key: 'awaitingDelivery', label: 'ממתין למשלוח' },
  { key: 'all', label: 'הכול' },
]

const QUEUE_ROW = '[data-testid^="logistics-row-"]'
const OUTBOUND_ROW = '[data-testid^="logistics-outbound-row-"]'
const CHECKLIST_ROW = '[data-testid^="checklist-row-"]'

// זרימת-ההתחברות היא הכתיבה היחידה שהמנגנון למטה מתיר. `register_failed_login` אינו כאן
// **במכוון**: כל ההתחברויות בקובץ הזה אמורות להצליח, ולכן הופעתו היא ממצא ולא רעש.
const ALLOWED_WRITE_PATHS = [
  '/auth/v1/',
  '/rest/v1/rpc/check_login_lock',
  '/rest/v1/rpc/reset_login_attempts',
]

// 🔒 המנגנון, לא ההבטחה: כל כתיבה שאינה בזרימת-ההתחברות **נחסמת ונרשמת**. נרשם ראשון
// בכוונה — Playwright בוחן מסלולים בסדר **הפוך** לרישום, ולכן יירוט ספציפי שנרשם אחר-כך
// בתוך בדיקה גובר עליו (וזה בדיוק מה שבדיקת כשל-הכתיבה עושה).
async function installWriteGuard(page) {
  const blockedWrites = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const isSupabase = url.hostname.endsWith('.supabase.co')
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
    if (isWrite && isSupabase && !ALLOWED_WRITE_PATHS.some((p) => url.pathname.startsWith(p))) {
      blockedWrites.push(`${request.method()} ${url.pathname}`)
      return route.abort()
    }
    return route.continue()
  })
  return blockedWrites
}

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  // התחברות מוצלחת = שרשרת קריאות ארוכה לפני הניווט; תקרה מורחבת מונעת כשל-שווא ברשת איטית.
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// 🔴 המתנה ל**תוכן**, לא למעטפת: `logistics-page` מרונדר גם במצב-הטעינה, ובדיקה שנשענת
// עליו הייתה מודדת שלד (זה בדיוק הכשל שנרשם ב-`e2e/CLAUDE.md` על דיאלוג מ5, 26/08/2026).
// ⇒ ממתינים לאחד מארבעת המצבים הסופיים של המשטח.
async function gotoLogistics(page) {
  await page.goto('/logistics')
  await expect(
    page
      .getByTestId('logistics-queue-table')
      .or(page.getByTestId('logistics-empty-filtered'))
      .or(page.getByTestId('logistics-no-permission'))
      .or(page.getByTestId('logistics-error')),
  ).toBeVisible({ timeout: 30_000 })
}

// אותה המתנה, בגרסת-הדיאלוג: שורות-הפריטים או אחד ממצבי-הריק — לעולם לא השלד.
async function waitForChecklist(page) {
  await expect(
    page
      .locator(CHECKLIST_ROW)
      .first()
      .or(page.getByTestId('checklist-state-legal-empty'))
      .or(page.getByTestId('checklist-state-no-permission'))
      .or(page.getByTestId('checklist-state-broken'))
      .or(page.getByTestId('checklist-state-error')),
  ).toBeVisible({ timeout: 30_000 })
}

async function openChecklist(page, rowTestId) {
  await page.getByTestId(rowTestId).click()
  await waitForChecklist(page)
}

async function closeChecklist(page) {
  await page.getByTestId('checklist-close').click()
  await expect(page.locator(CHECKLIST_ROW)).toHaveCount(0)
}

// מונה-הגלולה כפי שהוא **על המסך**. `—` (מונה שאסור לקרוא) מוחזר כ-`null` ולא כ-0 —
// ההבחנה הזאת היא בדיוק מה ש-`DENIED_MARK` קיים בשבילו (כרטיס §③).
async function pillCount(page, key) {
  const text = (await page.getByTestId(`logistics-pill-${key}`).innerText())
    .replace(/\s+/g, ' ')
    .trim()
  if (text.endsWith(DENIED_MARK)) return null
  const match = text.match(/(\d+)$/)
  expect(
    match,
    `מונה הגלולה "${key}" אינו מספר ואינו "${DENIED_MARK}" — נקרא: ${text}`,
  ).not.toBeNull()
  return Number(match[1])
}

// מעביר לגלולת `הכול` ומחזיר את מזהי-השורות. **הבקרה החיובית של `e2e/CLAUDE.md`**:
// תפקיד עם `edit` חייב להחזיר ≥1 שורה — אפס שם אינו "אין דאטה" אלא הזדהות/RLS שבורים.
async function allQueueRowIds(page) {
  const allPill = page.getByTestId('logistics-pill-all')
  await expect(
    allPill,
    'גלולת "הכול" מושבתת ⇒ מונה 0 ⇒ אין ולו פרויקט פעיל אחד עם שורת-לוגיסטיקה. לתפקיד בעל edit זו הזדהות שבורה, לא "אין דאטה".',
  ).toBeEnabled({ timeout: 30_000 })
  await allPill.click()
  const ids = await page
    .locator(QUEUE_ROW)
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-testid')))
  expect(ids.length, 'גלולת "הכול" נבחרה ולא רונדרה אף שורה').toBeGreaterThan(0)
  return ids
}

// "היום" בשעון **ישראל** — אותו חישוב בדיוק שהמסך עושה (`todayIso` ב-`LogisticsPage.jsx`).
// 🚫 לא `toISOString()`: בין חצות ל-03:00 בישראל ה-UTC עדיין באתמול, וכל חלונות-הזמן זזים יום.
function israelTodayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// שני מזהי-הקריאה של `projects` נבדלים ב-`select` ולא בנתיב: התור מבקש חמש עמודות,
// והדיאלוג מבקש גם `quote_id` (הוא הקלט של מבחין-מצבי-הריק). זו ההפרדה שמאפשרת ליירט
// את **הקריאה-מחדש של ㊲ בלבד** ולהשאיר את התור עצמו אמיתי.
const isChecklistProjectRead = (url) =>
  url.pathname === '/rest/v1/projects' &&
  (url.searchParams.get('select') ?? '').includes('quote_id')
const isQueueProjectRead = (url) =>
  url.pathname === '/rest/v1/projects' &&
  !(url.searchParams.get('select') ?? '').includes('quote_id')
const isLogisticsRead = (url) => url.pathname === '/rest/v1/logistics'

// יירוט שמושך את התשובה **האמיתית** וממיר אותה — כך שאף ערך אינו מומצא ואף מזהה אינו
// מקודד-קשיח; מה שמשתנה הוא רק השדה שהמצב-הנבדק דורש. `maybeSingle` מבקש אובייקט ולא
// מערך, ולכן שתי הצורות נתמכות.
async function fulfillTransformed(route, transform) {
  const response = await route.fetch()
  const payload = await response.json()
  const next = Array.isArray(payload) ? payload.map(transform) : transform(payload)
  return route.fulfill({
    status: response.status(),
    contentType: 'application/json',
    body: JSON.stringify(next),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// משטח 1 — תור-העבודה, **קריאות אמיתיות** (מנהלת לוגיסטיקה, `edit`)
// ═══════════════════════════════════════════════════════════════════════════════════════
test.describe('מודול 5 · משטח 1 — תור-העבודה (קריאות אמיתיות)', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  test('המסך עולה עם שורות אמיתיות · שלוש גלולות בדיוק · סעיף-היציאה על המסך · אפס ₪', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoLogistics(page)

    // אף אחד משלושת מצבי-הכשל — המסך האמיתי, לא "חסום" ולא "תקלה".
    await expect(page.getByTestId('logistics-no-permission')).toHaveCount(0)
    await expect(page.getByTestId('logistics-error')).toHaveCount(0)

    // ㉙ — שלוש גלולות, בשמן ובסדרן. הספירה היא הטענה: גלולה רביעית תפיל את הבדיקה.
    const pills = page.locator('[data-testid^="logistics-pill-"]')
    await expect(pills).toHaveCount(PILLS.length)
    for (const [index, pill] of PILLS.entries()) {
      await expect(pills.nth(index)).toContainText(pill.label)
    }
    await expect(page.getByText('בוטלו')).toHaveCount(0)

    // ㉓/S-7 — הסעיף **נשאר על המסך תמיד**, גם ביום שאין בו אירוע יוצא (רוב הימים):
    // סעיף שנעלם מלמד אותה שהוא לא תמיד שם, ואז היא מפסיקה לסמוך עליו.
    const outbound = page.getByTestId('logistics-outbound')
    await expect(outbound).toBeVisible()
    await expect(outbound).toContainText(OUTBOUND_HEADING)
    await expect(
      page.getByTestId('logistics-outbound-table').or(page.getByTestId('logistics-outbound-empty')),
    ).toBeVisible()

    // הבקרה החיובית + כיתוב-המיון (S-3), על מסך שיש בו שורות.
    const ids = await allQueueRowIds(page)
    expect(ids.length).toBeGreaterThan(0)
    await expect(page.getByText(QUEUE_SORT_LINE)).toBeVisible()

    // 🚫 אין ולו ₪ אחד באף אחד משני מסכי המודול — היא `blocked` על "הצעות מחיר"
    // (כרטיס §③). המכנה אינו 0: זה נאמר על טבלה שאישרנו זה עתה שיש בה שורות.
    await expect(page.getByTestId('logistics-queue-table')).not.toContainText('₪')
    await expect(page.getByTestId('logistics-outbound')).not.toContainText('₪')

    expect(blockedWrites, 'מסך קריאה-בלבד ניסה לכתוב למסד').toEqual([])
  })

  test('מונה כל גלולה שווה לספירת-השורות שרונדרו (אינווריאנט עצמי, בלי מספר נעוץ)', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoLogistics(page)

    // המכנה נאמר במפורש: `הכול` חייבת מונה > 0 אצל בעלת-`edit`.
    const allCount = await pillCount(page, 'all')
    expect(allCount, 'מונה "הכול" הוא — ⇒ הענף החסום, ולא המסך הרגיל').not.toBeNull()
    expect(allCount, 'מונה "הכול" = 0 אצל תפקיד עם edit — הזדהות/RLS שבורים').toBeGreaterThan(0)

    let exercised = 0
    for (const { key } of PILLS) {
      const count = await pillCount(page, key)
      const pill = page.getByTestId(`logistics-pill-${key}`)
      if (count === 0) {
        // ㉚ — גלולת-0 **נשארת על המסך, מושבתת ומנומקת**, לעולם לא נעלמת.
        // ⚠️ הטענה היא על ה-`title` ולא על הופעתו בריחוף: ה-`Button` המשותף נושא
        // `disabled:pointer-events-none`, וזה תיקון-בית שנרשם לצעד 4.2 ואינו של הצעד הזה.
        await expect(pill).toBeDisabled()
        await expect(pill).toHaveAttribute('title', DISABLED_PILL_TITLE)
        continue
      }
      await expect(pill).toBeEnabled()
      await pill.click()
      await expect(page.locator(QUEUE_ROW)).toHaveCount(count)
      exercised += 1
    }
    expect(exercised, 'אף גלולה לא נבדקה מול שורות — המדידה רצה על מכנה 0').toBeGreaterThan(0)

    expect(blockedWrites, 'מסך קריאה-בלבד ניסה לכתוב למסד').toEqual([])
  })

  test('㉔ — שורת-התור והקישור "לצ׳קליסט →" פותחים את דיאלוג אותו אירוע', async ({ page }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoLogistics(page)
    const ids = await allQueueRowIds(page)

    const projectId = ids[0].replace('logistics-row-', '')
    // שם-האירוע נקרא **מהמסך**, והוא הטענה שתיבדק בכותרת הדיאלוג.
    const eventName = (await page.getByTestId(ids[0]).locator('td').first().innerText())
      .split('\n')[0]
      .replace('⏱', '')
      .trim()
    expect(eventName.length).toBeGreaterThan(0)

    await openChecklist(page, ids[0])
    await expect(page.getByRole('dialog')).toContainText(eventName)
    // ㉔ — דיאלוג ואינו ראוט: התור נשאר גלוי מאחור, והכתובת אינה זזה.
    await expect(page).toHaveURL(/\/logistics$/)
    await closeChecklist(page)

    // אותה פעולה בדיוק דרך הקישור — האפורדנס הגלוי (‏`stopPropagation`, לא יורה פעמיים).
    await page.getByTestId(`logistics-checklist-${projectId}`).click()
    await waitForChecklist(page)
    await expect(page.getByRole('dialog')).toContainText(eventName)

    expect(blockedWrites, 'פתיחת דיאלוג ניסתה לכתוב למסד').toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// משטח 1 — מצבים שאינם קיימים בדאטה החיה, מיוצרים ב**יירוט-רשת** בלבד
// ═══════════════════════════════════════════════════════════════════════════════════════
test.describe('מודול 5 · משטח 1 — מצבים מיוצרים ביירוט', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  test('כרטיס §④ — אפס שורות-לוגיסטיקה נקרא "חסום" ולעולם לא "התור ריק", והמונים מציגים —', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // 🚨 הכשל השקט של המודול: קריאה שנחסמה ב-RLS מחזירה **אפס שורות עם `error: null`** —
    // זהה-בייט ל"התור ריק". התשובה הריקה מיוצרת ברשת, כי היא אינה בת-השגה מול מסד שיש בו
    // שורות (ואין דרך לרוקן אותו — אין סביבת-בדיקה שנייה).
    await page.route(
      (url) => isLogisticsRead(url),
      (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await gotoLogistics(page)

    const blocked = page.getByTestId('logistics-no-permission')
    await expect(blocked).toBeVisible()
    await expect(blocked).toContainText(QUEUE_NO_PERMISSION_SENTENCE)
    // 🔴 `0` נקרא כעובדה, `—` נקרא כ"אין לי את הנתון" — וזה ההבדל שהענף הזה קיים בשבילו.
    const pills = page.locator('[data-testid^="logistics-pill-"]')
    await expect(pills).toHaveCount(PILLS.length)
    for (const { key } of PILLS) {
      expect(await pillCount(page, key), `הגלולה "${key}" מציגה מונה במצב חסום`).toBeNull()
      await expect(page.getByTestId(`logistics-pill-${key}`)).toBeDisabled()
    }
    // ולא אחד משלושת המצבים האחרים — **ההבחנה היא הטענה, לא הנוכחות**.
    await expect(page.getByTestId('logistics-queue-table')).toHaveCount(0)
    await expect(page.getByTestId('logistics-empty-filtered')).toHaveCount(0)
    await expect(page.getByTestId('logistics-error')).toHaveCount(0)
    // 🚫 וסעיף-היציאה אינו מצויר כאן: *"אין אירוע שיוצא"* על קריאה חסומה הוא בדיוק
    // אותו שקר שקט. (S-7 מחייבת שהסעיף לא ייעלם כשהוא **ריק כדין** — לא כשהוא לא-קריא.)
    await expect(page.getByTestId('logistics-outbound')).toHaveCount(0)

    expect(blockedWrites, 'מסך קריאה-בלבד ניסה לכתוב למסד').toEqual([])
  })

  test('כרטיס §④ — אותה קריאה שנופלת באמת נקראת "תקלה", בנוסח שונה מ"חסום"', async ({ page }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // **אותו endpoint בדיוק** כמו בבדיקה שמעליה — הפעם נזרק ולא מוחזר ריק. שני אותות
    // שונים ⇒ שני מסכים שונים; זו כל ההבחנה של S-26.
    await page.route(
      (url) => isLogisticsRead(url),
      (route) => route.abort(),
    )
    await gotoLogistics(page)

    const failure = page.getByTestId('logistics-error')
    await expect(failure).toBeVisible()
    await expect(failure).toContainText(ERROR_TITLE)
    await expect(failure.getByRole('button', { name: RETRY_LABEL })).toBeVisible()
    await expect(failure).not.toContainText(QUEUE_NO_PERMISSION_SENTENCE)
    await expect(page.getByTestId('logistics-no-permission')).toHaveCount(0)

    expect(blockedWrites, 'מסך קריאה-בלבד ניסה לכתוב למסד').toEqual([])
  })

  test('㉚ — גלולה שמונה 0 נשארת מושבתת ומנומקת, ו"נקי סינון" מוציא ממצב-הריק', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // גלולת-0 אינה קיימת בדאטה החיה (לשלושתן יש מונה > 0), ולכן היא **מיוצרת**: התשובה
    // האמיתית נמשכת ומומרת כך שאף פריט אינו `טרם החל` ⇒ `דורש טיפול` מתאפסת בהגדרה (㉙),
    // ו-`ממתין למשלוח` בולעת את כל הבסיס (㉛). אף מזהה ואף מספר אינם מומצאים.
    await page.route(
      (url) => isLogisticsRead(url),
      (route) => fulfillTransformed(route, (row) => ({ ...row, item_status: 'ordered' })),
    )
    await gotoLogistics(page)

    const needsAction = page.getByTestId('logistics-pill-needsAction')
    expect(await pillCount(page, 'needsAction')).toBe(0)
    await expect(needsAction).toBeVisible()
    await expect(needsAction).toBeDisabled()
    await expect(needsAction).toHaveAttribute('title', DISABLED_PILL_TITLE)

    // ㉛ — "לא נשאר מה להזמין ולא הכול הגיע": הגלולה האמצעית שווה עכשיו לבסיס כולו.
    const awaiting = await pillCount(page, 'awaitingDelivery')
    const all = await pillCount(page, 'all')
    expect(all).toBeGreaterThan(0)
    expect(awaiting).toBe(all)

    // מצב ③ — ריק אחרי גלולה: הפעולה **הפוכה** ממצב ② (ניקוי-סינון, לא ניסיון-חוזר).
    const filtered = page.getByTestId('logistics-empty-filtered')
    await expect(filtered).toBeVisible()
    await expect(filtered).toContainText(FILTERED_EMPTY_TITLE)
    await expect(filtered).not.toContainText(ERROR_TITLE)
    // ✏️ היעד הוא `הכול` ולא ברירת-המחדל (תיקון-הכרטיס 26/08/2026): ברירת-מחדל בת 0
    // מושבתת (㉚), ו"חזרה אליה" הייתה כפתור-סרק במצב היחיד שמציג אותו.
    await page.getByTestId('logistics-clear-filter').click()
    await expect(page.getByTestId('logistics-pill-all')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator(QUEUE_ROW)).toHaveCount(all)

    expect(blockedWrites, 'מסך קריאה-בלבד ניסה לכתוב למסד').toEqual([])
  })

  test('㊷ — שורות סעיף-היציאה לחיצות ופותחות את דיאלוג-הצ׳קליסט', async ({ page }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // 🔴 **חברוּת בסעיף-היציאה תלוית-תאריך, ולכן היא מיוצרת ולא נשענת על הלוח החי** —
    // עוגן-תאריך היה מרקיב מעצמו (`e2e/CLAUDE.md`). התשובה האמיתית נמשכת, ותאריך-האירוע
    // של כל פרויקט מוחלף ב"היום" בשעון-ישראל ⇒ `businessDaysUntil(today, today) = 0 ≤ 1`
    // ⇒ **כל הבסיס נכנס לסעיף**, והמכנה ידוע ושווה למונה של `הכול`.
    const today = israelTodayIso()
    await page.route(
      (url) => isQueueProjectRead(url),
      (route) => fulfillTransformed(route, (row) => ({ ...row, final_event_date: today })),
    )
    await gotoLogistics(page)

    const all = await pillCount(page, 'all')
    expect(all).toBeGreaterThan(0)
    const outboundRows = page.locator(OUTBOUND_ROW)
    await expect(outboundRows).toHaveCount(all)

    await outboundRows.first().click()
    await waitForChecklist(page)
    await expect(page.locator(CHECKLIST_ROW).first()).toBeVisible()

    expect(blockedWrites, 'לחיצה על שורת סעיף-היציאה ניסתה לכתוב למסד').toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// משטח 2 — מסלולי-הכתיבה של הדיאלוג, כולם ביירוט-רשת
// ═══════════════════════════════════════════════════════════════════════════════════════
test.describe('מודול 5 · משטח 2 — דיאלוג-הצ׳קליסט (מסלולי-כתיבה ביירוט)', () => {
  test.skip(!STAFF_EMAIL || !STAFF_PASSWORD, 'E2E_STAFF_* לא הוגדרו ב-.env.local')

  // בוחר בזמן-ריצה את הפרויקט שהדיאלוג שלו נושא שורה שהכמות-בפועל שלה **עריכה**
  // (‏`הוזמן`/`מוכן` — ㉕). 🚫 לא `project_id` קשיח: הלוח החי זז, והמצב הזה יכול לעבור
  // מפרויקט לפרויקט בלי שאיש יגע בקוד.
  //
  // 🔴 **`preferFull` — ולמה הוא אינו קישוט:** בדיקת-הנעילה סורקת שלושה אוספים
  // (כפתורי-מצב · שדות-תאריך · שדות-כמות נעולים), ו**מדידה שהמכנה שלה 0 אינה ירוקה**.
  // שדה-תאריך קיים רק בשורת `הוזמן`, וכמות נעולה רק בשורת `טרם החל` ⇒ פרויקט שכל שורותיו
  // `מוכן` נותן שני אוספים ריקים ושתי לולאות שגופן לא הורץ מעולם. **וזה בדיוק מה שקרה כאן,
  // ונתפס במבחן-האדום:** הבדיקה עברה בירוק גם כששתי הטענות הופכו. ⇒ הבחירה **מעדיפה**
  // פרויקט שיש בו את שלושת סוגי-השורות, והבדיקה מצהירה על המכנה לפני כל לולאה.
  // ‏🚪 והפונקציה תמיד מחזירה עם הדיאלוג **סגור** — הקורא פותח מחדש, כדי שלמסלול-היציאה
  // תהיה צורה אחת (חצי-מצב כאן הוא בדיוק הבאג שקשה לראות).
  async function findChecklistSubject(page, ids, { preferFull = false } = {}) {
    let fallback = null
    for (const id of ids) {
      await openChecklist(page, id)
      const editable = page.locator('[data-testid^="checklist-qty-"]:not([disabled])')
      const editableCount = await editable.count()
      const dateCount = await page.locator('[data-testid^="checklist-date-"]').count()
      const lockedQtyCount = await page.locator('[data-testid^="checklist-qty-"][disabled]').count()
      const qtyTestId =
        editableCount > 0 ? await editable.first().getAttribute('data-testid') : null
      await closeChecklist(page)
      if (!qtyTestId) continue
      const candidate = {
        rowId: id,
        qtyTestId,
        key: qtyTestId.replace('checklist-qty-', ''),
        dateCount,
        lockedQtyCount,
      }
      if (!preferFull || (dateCount > 0 && lockedQtyCount > 0)) return candidate
      if (!fallback) fallback = candidate
    }
    return fallback
  }

  test('㊲ + ㉝ + ㊴ — שורה שנטענה פעילה, סטטוס שנקרא-מחדש מבוטל ⇒ נעילה, ורק הכמות פתוחה', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoLogistics(page)
    const ids = await allQueueRowIds(page)

    const subject = await findChecklistSubject(page, ids, { preferFull: true })
    expect(
      subject,
      'אין בתור אף פרויקט עם שורה בסטטוס "הוזמן"/"מוכן" — לחריג ㊴ אין נושא',
    ).not.toBeNull()

    // 🔴 **זו הגזרה של ㊲ בדיוק:** התור (שנטען קודם, בלי יירוט) הציג את הפרויקט כ**פעיל** —
    // הוא לא היה מגיע לשם אחרת. היירוט חל **רק על הקריאה-מחדש של הדיאלוג** (המובחנת
    // ב-`quote_id` שב-`select`), כלומר בדיוק על התרחיש שבו הביטול נחת אחרי טעינת-התור.
    await page.route(
      (url) => isChecklistProjectRead(url),
      (route) =>
        fulfillTransformed(route, (project) => ({
          ...project,
          project_status: 'cancelled',
          cancelled_at: israelTodayIso(),
          cancel_reason: 'הלקוח ביטל',
        })),
    )
    await openChecklist(page, subject.rowId)

    // הבאנר — הודעה על מצב **תקין-וסופי**, ובו שתי השורות של O-4 מילה-במילה.
    const banner = page.getByTestId('checklist-banner-cancelled')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(CANCEL_BANNER_LINE)
    await expect(banner).toContainText(CANCEL_BANNER_QTY_LINE)
    await expect(page.getByTestId('checklist-project-status')).toHaveText('בוטל')
    await expect(page.getByTestId('checklist-locked-note')).toBeVisible()
    // ⚠️ ובקרת-שפיות על היירוט עצמו: כותרת-הדיאלוג נשארה שם-האירוע. תשובה מיורטת בעלת
    // **צורה** שגויה (פריסת-אובייקט על מערך) מייצרת פרויקט בלי `event_name` — כותרת ריקה
    // שכל שאר הטענות כאן היו עוברות מעליה בירוק. נמדד 26/08/2026, ותפוס בסריקת-הנגישות.
    await expect(page.getByRole('dialog').getByRole('heading').first()).not.toBeEmpty()

    // ㉝ — **כל** כפתורי-עדכון-המצב מושבתים ומנומקים, ונשארים גלויים. המכנה מוצהר.
    const statusButtons = page.locator('[data-testid^="checklist-status-"]')
    const statusCount = await statusButtons.count()
    expect(statusCount, 'אין ולו כפתור-מצב אחד על המסך — אין מה לנעול').toBeGreaterThan(0)
    for (let i = 0; i < statusCount; i += 1) {
      await expect(statusButtons.nth(i)).toBeDisabled()
      await expect(statusButtons.nth(i)).toHaveAttribute('title', CANCELLED_CONTROL_TITLE)
    }

    // ㉝ — שדות-ההערה מושבתים ומנומקים (ולא מוסרים: זו חסימת-**מצב**, לא חסימת-הרשאה).
    const notes = page.locator('[data-testid^="checklist-note-"]')
    const noteCount = await notes.count()
    expect(noteCount, 'אין ולו שדה-הערה אחד על המסך').toBeGreaterThan(0)
    for (let i = 0; i < noteCount; i += 1) {
      await expect(notes.nth(i)).toBeDisabled()
      await expect(notes.nth(i)).toHaveAttribute('title', CANCELLED_CONTROL_TITLE)
    }

    // 🔓 ㊴ — **החריג היחיד**: הכמות-בפועל של שורה שכבר הוזמנה נשארת פתוחה ומנומקת.
    // הנושא נבחר בזמן-ריצה למעלה, ולכן קיומו כבר אושר.
    const qty = page.getByTestId(subject.qtyTestId)
    await expect(qty).toBeEnabled()
    await expect(qty).toHaveAttribute('title', CANCELLED_QTY_TITLE)

    // 🔒 ושדה-התאריך **נעול** — ㊴ מתירה את הכמות בלבד; המוקאפ ציירו פתוח וזה גליץ' מדווח.
    // המכנה מוצהר: בלי שורת `הוזמן` אין שדה-תאריך כלל, והלולאה הייתה עוברת בירוק על אפס.
    const dates = page.locator('[data-testid^="checklist-date-"]')
    const dateCount = await dates.count()
    expect(
      dateCount,
      'לנושא שנבחר אין שורת "הוזמן" ⇒ אין שדה-תאריך — טענת נעילת-התאריך של ㊴ לא נמדדה',
    ).toBeGreaterThan(0)
    for (let i = 0; i < dateCount; i += 1) {
      await expect(dates.nth(i)).toBeDisabled()
    }
    // ושדה-כמות של שורה שטרם הוזמנה נשאר נעול בנימוק של **מצב-הפריט**, לא של הביטול (㉕).
    const lockedQty = page.locator('[data-testid^="checklist-qty-"][disabled]')
    const lockedQtyCount = await lockedQty.count()
    expect(
      lockedQtyCount,
      'לנושא שנבחר אין שורת "טרם החל" — טענת נימוק-מצב-הפריט לא נמדדה',
    ).toBeGreaterThan(0)
    for (let i = 0; i < lockedQtyCount; i += 1) {
      await expect(lockedQty.nth(i)).toHaveAttribute('title', QTY_LOCKED_BY_ITEM)
    }

    expect(blockedWrites, 'הווריאנט המבוטל ניסה לכתוב למסד').toEqual([])
  })

  test('S-2 — כתיבה שנחסמה מציגה את משפט-הכשל, מחזירה את הערך, ואינה מדווחת "נשמר"', async ({
    page,
  }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await gotoLogistics(page)
    const ids = await allQueueRowIds(page)

    const subject = await findChecklistSubject(page, ids)
    expect(subject, 'אין שורה עם כמות-בפועל עריכה — למסלול-הכתיבה אין נושא').not.toBeNull()
    await openChecklist(page, subject.rowId)

    // 🔴 ה-RPC הכותב **מיורט ומוגש מקומית** — הבקשה לעולם אינה עוזבת את הדפדפן, ואפס
    // שורות משתנות במסד. מעטפת-ההחזרה מוגשת **בלי `row`**, וזו בדיוק התשובה ש-RLS
    // מייצר: הצלחה-לכאורה שלא נגעה בשורה (`assertLogisticsUpdate` הופכת אותה לזריקה).
    // נרשם **אחרי** שומר-הכתיבה, ולכן גובר עליו — Playwright בוחן בסדר הפוך לרישום.
    await page.route(
      (url) => url.pathname === '/rest/v1/rpc/update_logistics_item',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ project_status: 'in_progress' }),
        }),
    )

    const qty = page.getByTestId(subject.qtyTestId)
    const before = await qty.inputValue()
    const typed = String(Number(before) + 7)
    await qty.fill(typed)
    await qty.press('Tab')

    const error = page.getByTestId(`checklist-error-${subject.key}`)
    await expect(error).toBeVisible({ timeout: 15_000 })
    // מחרוזת S-2 **כפי שהיא**, לא נוסח שני (AR-9), ומוכרזת לקורא-מסך כשגיאה.
    await expect(error).toHaveText(WRITE_FAILURE_SENTENCE)
    await expect(error).toHaveAttribute('role', 'alert')
    // 🔴 והערך על המסך חזר לקודמו — ערך שנשאר בלי שנכתב הוא ה"נשמר" הכוזב עצמו.
    await expect(qty).toHaveValue(before)
    expect(typed).not.toBe(before)
    // 🚫 ואין ולו ערוץ-הצלחה אחד: במסך הזה אין טוסט (מצב ⑧ — התוצאה נראית על המסך),
    // ולכן "דווח כנשמר" פירושו ערך שנשאר או באנר-השלמה שנדלק. שניהם נשללים כאן.
    await expect(page.getByTestId('checklist-banner-complete')).toHaveCount(0)

    expect(blockedWrites, 'כתיבה אמיתית דלפה למסד למרות היירוט').toEqual([])
  })

  test('⑬ — באנר-ההשלמה הוא הודעה ולא שער: הדיאלוג נשאר פתוח ואין מה לאשר', async ({ page }) => {
    const blockedWrites = await installWriteGuard(page)
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // שורות-הפריטים של הדיאלוג נאספות מהתשובה **האמיתית**, כדי שתשובת-ה-RPC המוגשת
    // תיבנה משורה אמיתית ולא ממצאה. 🚫 אין כאן `route.fetch` על ה-RPC עצמו — זו הייתה
    // כתיבה אמיתית.
    const seenRows = new Map()
    await page.route(
      (url) => isLogisticsRead(url),
      (route) =>
        fulfillTransformed(route, (row) => {
          seenRows.set(`${row.sku}-${row.serial_number}`, row)
          return row
        }),
    )
    await gotoLogistics(page)
    const ids = await allQueueRowIds(page)

    // נושא בזמן-ריצה: פרויקט שאינו **כבר** `מוכן לביצוע` — הבאנר נדלק ב*מעבר* אל `ready`
    // בלבד, ועל פרויקט שכבר שם הוא לא היה נדלק והבדיקה הייתה ירוקה על כלום.
    let subject = null
    for (const id of ids) {
      await openChecklist(page, id)
      const status = await page.getByTestId('checklist-project-status').innerText()
      const button = page
        .locator(
          '[data-testid^="checklist-status-"][data-testid$="-ready"]:not([aria-pressed="true"])',
        )
        .first()
      if (status.trim() !== 'מוכן לביצוע' && (await button.count()) > 0) {
        const testId = await button.getAttribute('data-testid')
        subject = { id, key: testId.replace(/^checklist-status-/, '').replace(/-ready$/, '') }
        break
      }
      await closeChecklist(page)
    }
    expect(subject, 'אין פרויקט לא-מוכן עם שורה שניתן לסמן "מוכן" — לבאנר אין נושא').not.toBeNull()

    const row = seenRows.get(subject.key)
    expect(row, `שורת ${subject.key} לא נצפתה בתשובת הקריאה — אין ממה לבנות תשובת-RPC`).toBeTruthy()

    // תשובת-הצלחה מוגשת מקומית: השורה עוברת ל-`ready` עם חוסר מלאכותי של יחידה אחת,
    // כדי ששורת-החוסר של ㊵ תופיע בוודאות (‏`items ≥ 1`) בלי לנחש מה במסד.
    await page.route(
      (url) => url.pathname === '/rest/v1/rpc/update_logistics_item',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            row: {
              ...row,
              item_status: 'ready',
              actual_qty: Math.max(Number(row.planned_qty) - 1, 0),
              actual_arrival_date: israelTodayIso(),
            },
            project_status: 'ready',
          }),
        }),
    )

    await page.getByTestId(`checklist-status-${subject.key}-ready`).click()

    const banner = page.getByTestId('checklist-banner-complete')
    await expect(banner).toBeVisible({ timeout: 15_000 })
    await expect(banner).toContainText('הפרויקט עבר ל"מוכן לביצוע" ויצא מרשימת העבודה שלך.')
    // ㊵ — החוסר מדווח ואינו עוצר.
    const shortfall = page.getByTestId('checklist-shortfall')
    await expect(shortfall).toBeVisible()
    await expect(shortfall).toContainText(SHORTFALL_LEAD)
    await expect(shortfall).toContainText(SHORTFALL_EMPHASIS)
    // 🔴 **הודעה, לא שער**: הדיאלוג נשאר פתוח, אין מה לאשר, ואין דרך לעצור.
    await expect(banner).toHaveAttribute('role', 'status')
    await expect(page.locator(CHECKLIST_ROW).first()).toBeVisible()
    await expect(page.getByTestId('checklist-close')).toBeEnabled()
    await expect(page.getByRole('button', { name: /^(אישור|אשר|אשרי|המשך)$/ })).toHaveCount(0)

    expect(blockedWrites, 'כתיבה אמיתית דלפה למסד למרות היירוט').toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// ענפי-הרשאה — המטריצה החיה, לא C5
// ═══════════════════════════════════════════════════════════════════════════════════════
test.describe('מודול 5 · ענפי-הרשאה', () => {
  test('מנהלת גיוס ושיבוץ — `blocked` על לוגיסטיקה ⇒ המסך כולו חסום', async ({ page }) => {
    test.skip(!RECRUIT_EMAIL || !RECRUIT_PASSWORD, 'E2E_RECRUIT_* לא הוגדרו ב-.env.local')
    const blockedWrites = await installWriteGuard(page)
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/logistics')

    // ‏`<ProtectedRoute allow="לוגיסטיקה">` — חסימה ברמת-הראוט, גם בכניסה ישירה לכתובת.
    await expect(page.getByTestId('access-denied')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('logistics-page')).toHaveCount(0)
    // ואין דליפה של המשטח דרך מצב-ריק כלשהו: לא תור, לא סעיף-יציאה, לא גלולות.
    await expect(page.getByTestId('logistics-outbound')).toHaveCount(0)
    await expect(page.locator('[data-testid^="logistics-pill-"]')).toHaveCount(0)

    expect(blockedWrites, 'מסך חסום ניסה לכתוב למסד').toEqual([])
  })

  test('מנהלת פרויקטים (`view`) — רואה את הערכים כטקסט, וכל פקדי-הכתיבה מוסרים מהמסך', async ({
    page,
  }) => {
    test.skip(!PROJECTS_EMAIL || !PROJECTS_PASSWORD, 'E2E_PROJECTS_* לא הוגדרו ב-.env.local')
    const blockedWrites = await installWriteGuard(page)
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
    await gotoLogistics(page)

    // §⑤ — במשטח 1 אין ולו פקד-כתיבה אחד ⇒ המסך שלה **זהה-בייט** למסך של `edit`:
    // הגלולות, הסעיף והתור נמצאים, וגם הקישור `לצ'קליסט →` אינו מוסר לה.
    const ids = await allQueueRowIds(page)
    const projectId = ids[0].replace('logistics-row-', '')
    await expect(page.getByTestId(`logistics-checklist-${projectId}`)).toBeVisible()

    await openChecklist(page, ids[0])
    const rows = page.locator(CHECKLIST_ROW)
    const rowCount = await rows.count()
    expect(rowCount, 'הדיאלוג נפתח בלי שורות — אין על מה לטעון טענת-הרשאה').toBeGreaterThan(0)

    // 🔴 **היעדר הרשאה ⇒ הפקד מוסר מהמסך לגמרי** (ולא מושבת — זו ההבחנה של ㉚).
    await expect(page.locator('[data-testid^="checklist-status-"]')).toHaveCount(0)
    await expect(
      page.locator('[data-testid^="checklist-qty-"]:not([data-testid*="-text-"])'),
    ).toHaveCount(0)
    await expect(
      page.locator('[data-testid^="checklist-note-"]:not([data-testid*="-text-"])'),
    ).toHaveCount(0)
    await expect(
      page.locator('[data-testid^="checklist-date-"]:not([data-testid*="-text-"])'),
    ).toHaveCount(0)
    // וגם עמודת "עדכון מצב" עצמה יורדת — עמודה שכל תאיה ריקים היא "אין תפקיד ⇒ נמחק".
    await expect(page.getByRole('dialog').getByText('עדכון מצב')).toHaveCount(0)

    // ומה שכן על המסך: אותם ערכים בדיוק, כטקסט. המכנה שווה למספר השורות.
    await expect(page.locator('[data-testid^="checklist-qty-text-"]')).toHaveCount(rowCount)
    await expect(page.locator('[data-testid^="checklist-note-text-"]')).toHaveCount(rowCount)

    expect(blockedWrites, 'משתמשת view ניסתה לכתוב למסד').toEqual([])
  })
})
