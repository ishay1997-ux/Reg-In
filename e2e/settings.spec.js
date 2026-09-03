import { test, expect } from '@playwright/test'

// ══════════════════════════════════════════════════════════════════════════════════════
// מודול 9 (הגדרות מערכת) — צעד 4.2. החבילה הקבועה של שני המשטחים: `/system/params`
// (המנכ"ל, כל 43 השורות) ו-`/my-settings` (בעלת-תפקיד, רק השורות שבבעלותה).
//
// 🚫 **אף כתיבה אמיתית אינה יוצאת מכאן.** כל מסלולי-הכתיבה של `params` ושל
// `notification_preferences` מיורטים ברשת (`e2e/CLAUDE.md`: "אין סביבת-בדיקה נפרדת ⇒
// אסור להזריק/לשנות שורות"). המסך מרנדר, מוודא ומדווח באמת — המסד לא שומע.
//
// ⚠️ **הכתיבה האמיתית היחידה היא זו שמובטח שתיחסם**: PATCH ישיר ל-`params` על
// `משקולת_היענות` עם ה-JWT של מנהלת הכספים (היא **אינה** הבעלים של השורה) — קיר-ה-RLS,
// שהוא החומה האמיתית (כלל ברזל 9; המסך הוא נוחות). הערך הנשלח הוא **הערך שכבר יושב
// בשורה**, כך שאפילו אילו ה-RLS היה שבור לא היה משתנה דבר — והבדיקה עדיין נכשלת ומדווחת.
// 🚨 חסימת-RLS מחזירה **מערך ריק עם `error: null`**, לא שגיאה — הכשל השקט המרכזי של
// הפרויקט — ולכן הטענה היא על **מספר השורות**, ואחריה קריאה חוזרת שמוכיחה שהערך לא זז.
//
// 🔑 זהויות: חמישה זוגות `E2E_*` ב-`.env.local` (נספרו 02/09/2026). `STAFF` = מנהלת
// לוגיסטיקה (מתועד ב-`e2e/customers.spec.js:10`). חסר זוג ⇒ `test.skip` בחן, לא כשל.
// 🔴 **בקרה חיובית חובה בכל בדיקת-בעלות** (`e2e/CLAUDE.md`): לפני שקוראים "0 שורות"
// כ-RLS תקין, חייבת להופיע לפחות שורה אחת שכן שייכת לאותה משתמשת. זהות שבורה מחזירה
// אפס-שורות שנראה בדיוק כמו חסימה תקינה.
// ══════════════════════════════════════════════════════════════════════════════════════

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD
const RECRUIT_EMAIL = process.env.E2E_RECRUIT_EMAIL
const RECRUIT_PASSWORD = process.env.E2E_RECRUIT_PASSWORD
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

// שמות-מסד, byte-exact מהמרשם (`src/lib/paramsRegistry.js`) — לא מועתקים ממסמך שעלול
// להתיישן. שם שגוי בתו אחד מחזיר 0 שורות ונראה כמו RLS תקין (מוקש `e2e/CLAUDE.md`).
const VAT = 'אחוז_מעמ'
const QUOTE_VALIDITY = 'ימי_תוקף_הצעה'
const RESPONSIVENESS_WEIGHT = 'משקולת_היענות'
const LOGISTICS_THRESHOLD = 'סף_לוגיסטיקה_ימי_עסקים'
const INVITE_TEMPLATE = 'תבנית_זימון_משמרת'
const INVITE_LINK_TOKEN = '[לינק_אישור_משמרת]'

// שש הקבוצות של §3.7 — התוויות נעולות, והסדר הוא סדר `PARAM_GROUPS`.
const GROUP_TYPES = [
  'pricing_timing',
  'control_alerts',
  'shift_invites',
  'templates',
  'smart_match',
  'integration_tech',
]

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// חוסם **כל** כתיבה ל-`params` ומחזיר את מה שנשלח. תשובת-הזיוף חייבת לשאת שורה אחת
// לפחות: `updateParams` מריצה `assertRowsAffected` על התשובה, ומערך ריק נקרא שם
// כחסימת-RLS (וזה בדיוק מה שהיא צריכה לעשות).
function interceptParamWrites(page) {
  const sent = []
  return {
    sent,
    async install() {
      await page.route('**/rest/v1/params?*', async (route) => {
        const req = route.request()
        if (req.method() === 'GET' || req.method() === 'HEAD') return route.continue()
        const body = req.postDataJSON()
        sent.push({ url: decodeURIComponent(req.url()), body })
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ param_id: 1, param_value: body?.param_value }]),
        })
      })
    },
  }
}

test.describe('הגדרות מערכת · לשונית הפרמטרים (מנכ"ל)', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test.beforeEach(async ({ page }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)
  })

  test('שש הקבוצות עולות, והחיפוש מוצא לפי התווית הידידותית', async ({ page }) => {
    await page.goto('/system/params')
    await expect(page.getByTestId('settings-params-tab')).toBeVisible({ timeout: 30_000 })

    // `settings-groups` (המעטפת) אינו נתפס ע"י התחילית `settings-group-` — אין מקף.
    const groups = page.locator('[data-testid^="settings-group-"]')
    await expect(groups).toHaveCount(GROUP_TYPES.length)
    for (const type of GROUP_TYPES) {
      await expect(page.getByTestId(`settings-group-${type}`)).toBeVisible()
    }

    // 🔴 המכנה לפני החיפוש: הקבוצה הפעילה באמת מחזיקה שורות. בלי זה, "החיפוש צמצם"
    // הייתה עוברת בירוק גם על מסך שלא טען כלום (`e2e/CLAUDE.md`, מדידה על מכנה 0).
    await expect(page.locator('[data-testid="settings-row"]').first()).toBeVisible()
    const rowsBefore = await page.locator('[data-testid="settings-row"]').count()
    expect(rowsBefore, 'הקבוצה הראשונה נטענה בלי שורות — אין מה לסנן').toBeGreaterThan(0)

    // "מרחק" מופיע רק בתוויות של שתי שורות-המרחק (קבוצת התאמת-דיילות) — כלומר
    // הקבוצה הראשונה מתרוקנת, וההתמקדות קופצת לקבוצה שבה יש תוצאה.
    await page.getByTestId('settings-search').fill('מרחק')
    await expect(page.getByTestId('settings-group-pricing_timing')).toContainText('0')
    await expect(page.getByTestId('settings-group-smart_match')).not.toContainText('0')
    await expect(page.getByTestId('settings-smartmatch-pane')).toBeVisible()

    // מונח שאינו קיים ⇒ מצב "אין תוצאות" בקבוצה הגנרית, ולא מסך ריק בלי הסבר.
    await page.getByTestId('settings-search').fill('zzz-לא-קיים')
    await expect(page.getByTestId('settings-no-results')).toBeVisible()
  })

  test('שינוי ערך יוצא כ-PATCH עם השם והערך הנכונים, והמסך מאשר "ההגדרות נשמרו"', async ({
    page,
  }) => {
    const writes = interceptParamWrites(page)
    await writes.install()

    await page.goto('/system/params')
    const field = page.getByTestId(`settings-value-${QUOTE_VALIDITY}`)
    await expect(field).toBeVisible({ timeout: 30_000 })

    // 🕓 הערך הנוכחי נקרא בזמן-ריצה ולא נעוץ (`e2e/CLAUDE.md`: כל ערך שנגזר מדאטה חיה
    // מרקיב). הערך החדש נגזר ממנו, כך שהשורה תמיד "משתנה" ושורת-השמירה נדלקת.
    const current = await field.inputValue()
    expect(Number(current), 'תוקף-ההצעה אינו מספר — הפרמטר לא נטען').toBeGreaterThan(0)
    const next = String(Number(current) + 1)

    await field.fill(next)
    await expect(page.getByTestId('settings-dirty-count')).toContainText('1')
    await page.getByTestId('settings-save-button').click()

    await expect(page.getByTestId('toast-success')).toHaveText('ההגדרות נשמרו')
    expect(writes.sent).toHaveLength(1)
    // ‏`updateParams` שולחת רק `param_value` בגוף; שם-הפרמטר הוא ה-`.eq()` שב-URL.
    expect(writes.sent[0].url).toContain(`param_name=eq.${QUOTE_VALIDITY}`)
    expect(writes.sent[0].body.param_value).toBe(next)
  })

  test('ערך שגוי חוסם שמירה, מציג הודעה — ואינו מוחק את מה שהוקלד בשדה אחר', async ({ page }) => {
    const writes = interceptParamWrites(page)
    await writes.install()

    await page.goto('/system/params')
    const vat = page.getByTestId(`settings-value-${VAT}`)
    const validity = page.getByTestId(`settings-value-${QUOTE_VALIDITY}`)
    await expect(vat).toBeVisible({ timeout: 30_000 })

    // שדה תקין אחד קודם — הוא הביקורת של C5 §5.6.17.4 ("שגיאה בשדה אחד לא מאפסת אחרים").
    const validityCurrent = await validity.inputValue()
    const validityNext = String(Number(validityCurrent) + 1)
    await validity.fill(validityNext)

    // ① מחוץ-לטווח: `isValidVatPercent` דורש 0..100 — 150 הוא הגבול האמיתי שנכשל.
    await vat.fill('150')
    const vatRow = page.locator('[data-param="' + VAT + '"]')
    await expect(vatRow.getByRole('alert')).toHaveText(
      'ערך חוקי: מספר בין 0 ל-100, עד שתי ספרות אחרי הנקודה',
    )
    await expect(page.getByTestId('settings-save-button')).toBeDisabled()
    await expect(validity).toHaveValue(validityNext)

    // ② ריק: A-4 — `Number('') === 0` הוא המלכודת, ולכן ריק פסול לכל קינד שאינו תבנית.
    await vat.fill('')
    await expect(vatRow.getByRole('alert')).toBeVisible()
    await expect(page.getByTestId('settings-save-button')).toBeDisabled()
    await expect(validity).toHaveValue(validityNext)

    // ואף כתיבה לא יצאה — לא בזמן ההקלדה ולא בניסיון-השמירה החסום.
    expect(writes.sent).toHaveLength(0)
  })

  test('עורך התבניות: מחיקת משתנה-החובה חוסמת שמירה, והצ׳יפ משחרר אותה', async ({ page }) => {
    const writes = interceptParamWrites(page)
    await writes.install()

    await page.goto('/system/params')
    await expect(page.getByTestId('settings-params-tab')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('settings-group-templates').click()

    await expect(page.getByTestId('settings-template-editor')).toBeVisible()
    await page.getByTestId(`settings-template-item-${INVITE_TEMPLATE}`).click()
    const body = page.getByTestId('settings-template-body')
    const original = await body.inputValue()
    // 🔴 המכנה: התבנית החיה באמת מכילה את המשתנה. אילו לא — "המחיקה חסמה" הייתה
    // עוברת בירוק על תבנית שממילא הייתה חסומה מלכתחילה.
    expect(original, `${INVITE_TEMPLATE} אינה מכילה ${INVITE_LINK_TOKEN} — אין מה למחוק`).toContain(
      INVITE_LINK_TOKEN,
    )
    await expect(page.getByTestId('settings-template-blocked')).toHaveCount(0)

    await body.fill(original.replaceAll(INVITE_LINK_TOKEN, ''))
    // §3.7 (R-3): תבנית-המשפט `בלי <token> <consequence>` — התחילית היא החלק הנעול.
    await expect(page.getByTestId('settings-template-blocked')).toContainText(
      `בלי ${INVITE_LINK_TOKEN}`,
    )
    await expect(page.getByTestId('settings-save-button')).toBeDisabled()

    // החזרת המשתנה מהצ׳יפ משחררת — לחיצה מכניסה את הטוקן לטקסט.
    await page.getByTestId('settings-template-chip-לינק_אישור_משמרת').click()
    await expect(page.getByTestId('settings-template-blocked')).toHaveCount(0)
    await expect(page.getByTestId('settings-save-button')).toBeEnabled()

    // הטיוטה מבוטלת במפורש — לא נשענים על ניווט כדי "לשכוח" אותה.
    await page.getByTestId('settings-cancel-button').click()
    await expect(body).toHaveValue(original)
    expect(writes.sent, 'עורך-התבניות לא אמור לכתוב דבר בבדיקה הזו').toHaveLength(0)
  })

  test('למנכ"ל אין פריט "ההגדרות שלי" בתפריט המשתמש — הלשונית המלאה היא שלו', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('topbar-user-menu-trigger').click()
    // המכנה: התפריט באמת נפתח (בלעדיו "אין פריט" עוברת בירוק על תפריט סגור).
    await expect(page.getByRole('menuitem', { name: 'הגדרות פרופיל' })).toBeVisible()
    await expect(page.getByTestId('settings-my-settings-link')).toHaveCount(0)
  })

  test('העדפות ההתראות בפרופיל: המתג מתהפך, השמירה יוצאת עם הערך הנכון, ו-SMS אומר את האמת', async ({
    page,
  }) => {
    const sent = []
    await page.route('**/rest/v1/notification_preferences*', async (route) => {
      const req = route.request()
      if (req.method() === 'GET' || req.method() === 'HEAD') return route.continue()
      const body = req.postDataJSON()
      sent.push(body)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([Array.isArray(body) ? body[0] : body]),
      })
    })

    await page.goto('/profile')
    // מסך-הפרופיל נפתח על לשונית "פרטים אישיים"; שורות-ההתראות חיות בלשונית השלישית
    // (`ProfileSettingsPage.TABS`) ואינן ב-DOM עד שלוחצים עליה.
    await page.getByRole('button', { name: 'העדפות והתראות' }).click()
    const emailToggle = page.getByTestId('settings-notify-email')
    await expect(emailToggle).toBeVisible({ timeout: 30_000 })

    // 🕓 המצב ההתחלתי נקרא חי (העדפה של משתמש אמיתי — לא נעוץ), והטענה היא על ההיפוך.
    const before = await emailToggle.getAttribute('data-state')
    const expectedAfter = before === 'checked' ? 'unchecked' : 'checked'
    await emailToggle.click()

    await expect(page.getByTestId('toast-success')).toHaveText('ההגדרות נשמרו')
    // 🔴 והמתג נשאר במצבו החדש אחרי שהשמירה נענתה — `handleEmailToggle` מחזיר אותו
    // אחורה בכשל, כך שהטענה הזאת היא ההוכחה שהשמירה נקראה כהצלחה ולא כמצג-שווא.
    await expect(emailToggle).toHaveAttribute('data-state', expectedAfter)

    expect(sent).toHaveLength(1)
    const payload = Array.isArray(sent[0]) ? sent[0][0] : sent[0]
    expect(payload.email_new_projects).toBe(expectedAfter === 'checked')
    expect(payload.sms_last_minute).toBe(false)

    // R-4: מתג ה-SMS מושבת ואומר את האמת, ואין "(בקרוב)" באף אחת מהשורות.
    await expect(page.getByTestId('settings-notify-sms')).toBeDisabled()
    await expect(page.getByText('אין ערוץ SMS במערכת')).toBeVisible()
    await expect(page.getByText('(בקרוב)')).toHaveCount(0)
  })
})

test.describe('הגדרות מערכת · "ההגדרות שלי" — מנהלת הכספים', () => {
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD,
    'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('רואה את השורות שבבעלותה בלבד — ולא את משקולות ה-Smart Match', async ({ page }) => {
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    await page.goto('/my-settings')
    await expect(page.getByTestId('settings-my-page')).toBeVisible({ timeout: 30_000 })

    // 🔴 בקרה חיובית (`e2e/CLAUDE.md`): מפת-הבעלות (§7.70) נותנת לה את אחוז-המע"מ.
    // אפס שורות כאן = הזדהות/מפת-בעלות שבורים, לא "RLS עובד".
    await expect(page.getByTestId('settings-my-empty')).toHaveCount(0)
    await expect(page.getByTestId(`settings-value-${VAT}`)).toBeVisible()

    // הצד השני של אותה טענה: מה שאינו שלה אינו על המסך.
    await expect(page.getByTestId(`settings-value-${RESPONSIVENESS_WEIGHT}`)).toHaveCount(0)
    await expect(page.getByTestId('settings-smartmatch-pane')).toHaveCount(0)

    // §4.2 — היא `blocked` על 'דיילות', ובכל זאת רואה את רשימת-השכר דרך ה-RPC ה-DEFINER
    // (היא בעלת `שכר_מינימום_שעתי`). הפאנל נעלם לגמרי למי שחסומה, ולכן נוכחותו היא
    // הוכחה שהשער בפונקציה פתח לה — לא רק שהמסך צייר משהו.
    await expect(page.getByTestId('settings-below-min-wage')).toBeVisible()
  })

  test('🔒 החומה אינה המסך: PATCH ישיר על משקולת שאינה שלה אינו משנה דבר', async ({ page }) => {
    test.skip(
      !SUPABASE_URL || !SUPABASE_ANON,
      'VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY חסרים — אין דרך להוכיח את קיר-ה-RLS',
    )
    await login(page, FINANCE_EMAIL, FINANCE_PASSWORD)
    await page.goto('/my-settings')
    await expect(page.getByTestId('settings-my-page')).toBeVisible({ timeout: 30_000 })

    const probe = await page.evaluate(
      async ({ url, anon, name }) => {
        const key = Object.keys(sessionStorage).find((k) => k.startsWith('sb-'))
        const token = JSON.parse(sessionStorage.getItem(key)).access_token
        const headers = {
          apikey: anon,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
        const filter = `param_name=eq.${encodeURIComponent(name)}`
        // ① קוראים את הערך שיושב בשורה (SELECT פתוח לכל authenticated, §7.83).
        const readBefore = await fetch(`${url}/rest/v1/params?${filter}&select=param_value`, {
          headers,
        })
        const before = await readBefore.json()
        // ② כותבים **בדיוק אותו ערך** — כך שגם RLS שבור לא היה מזיז דבר במסד.
        const patch = await fetch(`${url}/rest/v1/params?${filter}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify({ param_value: before[0]?.param_value }),
        })
        const patched = await patch.json()
        // ③ וקוראים שוב — הראיה שהערך לא זז.
        const readAfter = await fetch(`${url}/rest/v1/params?${filter}&select=param_value`, {
          headers,
        })
        const after = await readAfter.json()
        return { status: patch.status, before, patched, after }
      },
      { url: SUPABASE_URL, anon: SUPABASE_ANON, name: RESPONSIVENESS_WEIGHT },
    )

    // המכנה: השורה בכלל קיימת ונקראה (אחרת "0 שורות בכתיבה" חסר משמעות).
    expect(probe.before, `${RESPONSIVENESS_WEIGHT} לא נקראה — הזדהות שבורה`).toHaveLength(1)
    // 🚨 חסימת-RLS = מערך ריק עם `error: null`. הטענה היא על מספר השורות.
    expect(Array.isArray(probe.patched) ? probe.patched : []).toHaveLength(0)
    expect(probe.after[0].param_value).toBe(probe.before[0].param_value)
  })
})

test.describe('הגדרות מערכת · "ההגדרות שלי" — מנהלת הגיוס (התמונה הראי)', () => {
  test.skip(
    !RECRUIT_EMAIL || !RECRUIT_PASSWORD,
    'E2E_RECRUIT_EMAIL/E2E_RECRUIT_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('רואה את משקולות ה-Smart Match — ולא את אחוז המע"מ', async ({ page }) => {
    await login(page, RECRUIT_EMAIL, RECRUIT_PASSWORD)
    await page.goto('/my-settings')
    await expect(page.getByTestId('settings-my-page')).toBeVisible({ timeout: 30_000 })

    await expect(page.getByTestId('settings-my-empty')).toHaveCount(0)
    await expect(page.getByTestId(`settings-value-${RESPONSIVENESS_WEIGHT}`)).toBeVisible()
    // §3.7 — נוסח-הבעלים של האזהרה, לא נוסח-המנכ"ל: היא רואה את המשפט שמדבר אליה.
    await expect(page.getByTestId('settings-smartmatch-warning-owner')).toBeVisible()
    await expect(page.getByTestId('settings-smartmatch-warning')).toHaveCount(0)

    await expect(page.getByTestId(`settings-value-${VAT}`)).toHaveCount(0)
  })
})

test.describe('הגדרות מערכת · מנהלת לוגיסטיקה — חסומה בלשונית, נכנסת מהדלת השנייה', () => {
  test.skip(
    !STAFF_EMAIL || !STAFF_PASSWORD,
    'E2E_STAFF_EMAIL/E2E_STAFF_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('הלשונית `/system/params` חסומה, "ההגדרות שלי" פתוחה, והפריט קיים בתפריט', async ({
    page,
  }) => {
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)

    // ① היא `blocked` על שני מודולי-המערכת ⇒ `ProtectedRoute` עוצר לפני הרינדור.
    await page.goto('/system/params')
    await expect(page.getByTestId('access-denied')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('settings-params-tab')).toHaveCount(0)

    // ② הפריט בתפריט המשתמש הוא הדלת השנייה (V-7: מוצג בדיוק למי שאין לה הלשונית).
    await page.goto('/')
    await page.getByTestId('topbar-user-menu-trigger').click()
    await expect(page.getByRole('menuitem', { name: 'הגדרות פרופיל' })).toBeVisible()
    await expect(page.getByTestId('settings-my-settings-link')).toBeVisible()
    await page.getByTestId('settings-my-settings-link').click()

    // ③ ובדף עצמו — רק השורה שבבעלותה. בקרה חיובית ואז שלילית, כמו אצל הכספים.
    await expect(page).toHaveURL('/my-settings')
    await expect(page.getByTestId('settings-my-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('settings-my-empty')).toHaveCount(0)
    await expect(page.getByTestId(`settings-value-${LOGISTICS_THRESHOLD}`)).toBeVisible()
    await expect(page.getByTestId(`settings-value-${VAT}`)).toHaveCount(0)
    await expect(page.getByTestId(`settings-value-${RESPONSIVENESS_WEIGHT}`)).toHaveCount(0)
  })
})
