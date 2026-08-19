import { test, expect } from '@playwright/test'

// E2E מודול 6 — **סגירת-אירוע והדיאלוגים, עד גבול-השליחה בלבד** (צעד 5.1).
//
// 🔴 **גבול-הכתיבה של הקובץ הזה, במילים מדויקות:** מול הלוח החי אף בדיקה כאן אינה
// לוחצת "שמור ושלח", אינה מאשרת ביטול ואינה שולחת שינוי-תכולה. דיאלוגים נפתחים
// ונטענים במלואם — והטענות נעצרות על סף כפתור-השליחה (מושבת/נוסח), בלי לחצות אותו.
// הסיבה אינה זהירות כללית: הסגירה חד-פעמית (#7 שמור לתרחיש-הקבלה — do-not-touch.md),
// וביטול מכלה פרויקט לצמיתות.
//
// 🧭 **מסעות-הכתיבה (הסגירה המלאה · ביטול · שינוי-תכולה · שינוי-תאריך) מקודדים כאן,
// אך רצים אך ורק על נושא ייעודי ששמו מתחיל ב-`E2E-`** — פרויקט שייווצר בכוונה למטרה
// הזאת (Carry-forward ③: "a purpose-made subject, never #7/#8"). היום אין נושא כזה ⇒
// כל מסע מדלג בשם הסיבה. ⚠️ המסעות מעולם לא רצו — בהרצה החיה הראשונה יש לעבור עליהם
// בעין לפני שסומכים על ירוק שלהם.
//
// 🔒 A10 — כל נושא נבחר בזמן-ריצה לפי תנאי (סטטוס/קידומת-שם), לעולם לא project_id קשיח.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD
const PROJECTS_EMAIL = process.env.E2E_PROJECTS_EMAIL
const PROJECTS_PASSWORD = process.env.E2E_PROJECTS_PASSWORD

// הסיבה המוסכמת (פרומפט-הצעד, rule 4) — מילה-במילה, כדי שדוח-ריצה יקרא אותה כשם.
const NO_E2E_SUBJECT_REASON = 'אין פרויקט E2E-* ייעודי — מסע-הכתיבה ממתין לנושא שנוצר בכוונה'

const ROW_SELECTOR = '[data-testid^="projects-row-"]'

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

async function gotoProjects(page, query = '') {
  await page.goto(`/projects${query}`)
  await expect(page.getByTestId('projects-page')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('projects-tabs-skeleton')).toHaveCount(0, { timeout: 30_000 })
}

// פותח את הכרטיס של השורה הראשונה בלשונית הנתונה; מחזיר false כשאין שורות (הדילוג
// המנומק אצל הקורא — הסיבה שונה פר-בדיקה).
async function openFirstCard(page, tabQuery) {
  await gotoProjects(page, tabQuery)
  const rows = page.locator(ROW_SELECTOR)
  if ((await rows.count()) === 0) return false
  await rows.first().click()
  // ⚠️ `project-card-page` מרונדר גם בזמן-טעינה (שלד) — ההמתנה האמיתית היא לתא-זהות,
  // שקיים רק אחרי שהכרטיס נטען. בלעדיה, בדיקת-נוכחות של כפתור רצה על שלד ומדלגת בטעות.
  await expect(page.getByTestId('project-cell-date')).toBeVisible({ timeout: 20_000 })
  return true
}

// המסך של לשונית-הסגירה: פתוח (טיוטה) / נעול (נסגר כבר) — ההבחנה דרושה לדילוגים.
async function openClosingTab(page) {
  const closingTab = page.getByTestId('project-tab-closing')
  await expect(closingTab).toBeEnabled()
  await closingTab.click()
  await expect(
    page.getByTestId('closing-tab').or(page.getByTestId('closing-tab-closed')),
  ).toBeVisible({ timeout: 20_000 })
  return (await page.getByTestId('closing-tab-closed').count()) > 0 ? 'closed' : 'open'
}

// מאתר נושא-כתיבה ייעודי: שורת מבט-על ששם-האירוע שלה מתחיל ב-`E2E-`. מחזיר את השורה
// או null — והקורא מדלג בשם המוסכם. הסינון בטקסט-שורה מספיק: הקידומת שמורה לנושאי-בדיקה.
async function findE2ESubjectRow(page, tabQuery = '?tab=all') {
  await gotoProjects(page, tabQuery)
  const rows = page.locator(ROW_SELECTOR, { hasText: 'E2E-' })
  return (await rows.count()) > 0 ? rows.first() : null
}

// PNG חוקי בן פיקסל אחד — דוח-הסיכום של מסע-הסגירה מוזרם מהזיכרון, שום קובץ לא נכתב לדיסק.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

// ── קריאה-בלבד: המצב-הריק החוקי וכפתור-השמירה המושבת-ומנומק ─────────────────────────
test.describe('מודול 6 · לשונית-הסגירה — עד סף-השליחה', () => {
  test.skip(
    !PROJECTS_EMAIL || !PROJECTS_PASSWORD,
    'E2E_PROJECTS_* לא הוגדרו ב-.env.local — נקודת-המבט של מנהלת הפרויקטים לא נבדקת',
  )

  test.beforeEach(async ({ page }) => {
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
  })

  test('אירוע שהסתיים בלי שיבוצים: "לא שובצו דיילות" + כפתור-השמירה קיים (ולא נלחץ)', async ({
    page,
  }) => {
    // הנושא בזמן-ריצה: השורה הראשונה בלשונית "לסגירה" (event_finished בהגדרה).
    const found = await openFirstCard(page, '?tab=closing')
    test.skip(!found, 'אין פרויקט שממתין לסגירה בלוח החי — לשונית "לסגירה" ריקה')

    const mode = await openClosingTab(page)
    test.skip(mode === 'closed', 'הפרויקט שממתין-לסגירה היחיד כבר נסגר תפעולית — אין טיוטה לבדוק')

    // 0 שיבוצים ⇒ המצב-הריק החוקי; יש שיבוצים ⇒ הטענה הזאת שייכת ללוח אחר.
    // מונה-השורות נכנס לסיבת-הדילוג — כדי שדוח-ריצה יגיד *כמה* שיבוצים חסמו, לא רק "יש".
    const legalEmpty = page.getByTestId('closing-legal-empty')
    const assignedRows = await page.locator('[data-testid^="closing-row-"]').count()
    test.skip(
      (await legalEmpty.count()) === 0,
      `לפרויקט שממתין לסגירה יש ${assignedRows} שורות-שיבוץ — המצב-הריק החוקי אינו בר-השגה היום`,
    )
    // האירוע נסגר משלושת שדות-האירוע לבדם — המסך אסור שייראה כאילו נכשל.
    await expect(legalEmpty).toContainText('לא שובצו דיילות')

    // כפתור-השמירה קיים — הסגירה אפשרית גם בלי דיילות. 🚫 לא נלחץ: חד-פעמי על מסד חי.
    const save = page.getByTestId('closing-save')
    await expect(save).toBeVisible()
    await expect(save).toHaveText('שמור ושלח')
  })

  test('שדות-חובה ריקים: הכפתור מושבת ומשפט-הסיכום נוקב במה שחסר — בלי לחיצה', async ({ page }) => {
    const found = await openFirstCard(page, '?tab=closing')
    test.skip(!found, 'אין פרויקט שממתין לסגירה בלוח החי — לשונית "לסגירה" ריקה')

    const mode = await openClosingTab(page)
    test.skip(mode === 'closed', 'הפרויקט שממתין-לסגירה היחיד כבר נסגר תפעולית — אין טיוטה לבדוק')

    // הטיוטה נפתחת ריקה ⇒ הכפתור חייב להיות מושבת, והנימוק הוא משפט-סיכום אחד
    // (screens-approved: "במקום שבע ההודעות") שנוקב בחסרים בשמם — לא "לא ניתן" סתמי.
    await expect(page.getByTestId('closing-save')).toBeDisabled()
    const summary = page.getByTestId('closing-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('לא ניתן לסגור: חסרים')
    // שני חסרים ודאיים על טיוטה ריקה: שעות-האירוע ודוח-הסיכום (קיימים בכל תרחיש).
    await expect(summary).toContainText('שעות ביצוע בפועל')
    await expect(summary).toContainText('דוח-סיכום')
  })
})

// ── דיאלוג-הביטול: המסלול החסום בלבד — נפתח, נטען, ולעולם לא מאושר ──────────────────
test.describe('מודול 6 · דיאלוג-הביטול — המסלול החסום', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_EMAIL/E2E_CEO_PASSWORD לא הוגדרו ב-.env.local')

  test('בלי סיבה הכפתור ההרסני מושבת, והיציאה היא "חזרה" — הדיאלוג נסגר בלי לבטל', async ({
    page,
  }) => {
    await login(page, CEO_EMAIL, CEO_PASSWORD)

    // הנושא בזמן-ריצה: פרויקט פעיל (לשונית "בעבודה") — כפתור-הביטול קיים רק על פעיל.
    const found = await openFirstCard(page, '')
    test.skip(!found, 'אין פרויקט פעיל בלוח החי — אין כרטיס עם כפתור-ביטול לפתוח')

    const cancelButton = page.getByTestId('project-card-cancel-button')
    test.skip(
      (await cancelButton.count()) === 0,
      'לכרטיס הנבחר אין כפתור-ביטול (סטטוס לא-פעיל או תפקיד בלי הפעולה) — אין דיאלוג לבדוק',
    )
    await cancelButton.click()

    // הכלל החוסם של המשטח: הדיאלוג אינו שמיש עד שהבאנר נטען במלואו — ממתינים לו קודם.
    await expect(page.getByTestId('cancel-banner')).toBeVisible({ timeout: 20_000 })

    // לפני כל בחירה: הכפתור ההרסני מושבת (אין סוג-ביטול ואין סיבה).
    const confirm = page.getByTestId('cancel-confirm')
    await expect(confirm).toBeDisabled()
    await expect(confirm).toHaveText('בטל את הפרויקט')

    // גם אחרי בחירת-סוג — סיבה ריקה מחזיקה את החסימה, והשגיאה נוקבת בנימוק המדויק
    // (זהה-בייט למה שה-RPC זורק — הדיאלוג והשרת אומרים את אותו משפט).
    await page.getByTestId('cancel-type-customer').click()
    await expect(confirm).toBeDisabled()
    await expect(page.getByTestId('cancel-reason-error')).toContainText('חובה לכתוב סיבה')

    // היציאה הבטוחה: "חזרה" (S-29 — לא "ביטול", שבעברית הוא גם שם הפעולה ההרסנית).
    const back = page.getByTestId('cancel-back')
    await expect(back).toHaveText('חזרה')
    await back.click()
    await expect(page.getByTestId('cancel-banner')).toBeHidden()
    // הפרויקט לא השתנה — הכרטיס עדיין מציג פרויקט חי (אין תא סיבת-ביטול).
    await expect(page.getByTestId('project-cell-cancel-reason')).toHaveCount(0)
  })
})

// ── מסעות-הכתיבה — רצים אך ורק על נושא `E2E-*`; היום כולם מדלגים בשם ────────────────
test.describe('מודול 6 · מסעות-כתיבה על נושא E2E-* ייעודי', () => {
  test.skip(
    !PROJECTS_EMAIL || !PROJECTS_PASSWORD,
    'E2E_PROJECTS_* לא הוגדרו ב-.env.local — מסעות-הכתיבה דורשים את מנהלת הפרויקטים',
  )

  test.beforeEach(async ({ page }) => {
    await login(page, PROJECTS_EMAIL, PROJECTS_PASSWORD)
  })

  test('מסע-הסגירה מקצה-לקצה — על אירוע E2E-* שהסתיים', async ({ page }) => {
    // הנושא: פרויקט E2E-* בלשונית "לסגירה" (event_finished). אין ⇒ הדילוג המוסכם.
    const row = await findE2ESubjectRow(page, '?tab=closing')
    test.skip(row === null, NO_E2E_SUBJECT_REASON)

    await row.click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    const mode = await openClosingTab(page)
    test.skip(mode === 'closed', 'נושא ה-E2E-* כבר נסגר תפעולית — נדרש נושא טרי למסע')

    // שלושת שדות-האירוע + סימון כל דיילת (אם שובצו) — התנאים שה-RPC אוכף בשרת.
    await page.getByTestId('closing-hours').fill('6')
    await page.getByTestId('closing-guests').fill('100')
    await page.setInputFiles('[data-testid="closing-file-input"]', {
      name: 'e2e-summary-report.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })

    const hostessRows = page.locator('[data-testid^="closing-row-"]')
    const rowCount = await hostessRows.count()
    for (let i = 0; i < rowCount; i += 1) {
      const rowEl = hostessRows.nth(i)
      const hostessId = (await rowEl.getAttribute('data-testid')).replace('closing-row-', '')
      // נוכחות: האפשרות הראשונה שאינה ה-placeholder; איכות: "בסדר" (ניטרלית, בלי שדה-סיבה).
      await page.getByTestId(`closing-attendance-${hostessId}`).selectOption({ index: 1 })
      await page.getByTestId(`closing-quality-${hostessId}-בסדר`).click()
    }

    // סף-השליחה נחצה כאן במכוון — הנושא ייעודי, והסגירה היא בדיוק מה שהמסע מוכיח.
    await expect(page.getByTestId('closing-save')).toBeEnabled()
    await page.getByTestId('closing-save').click()

    // ההוכחה: המסך הנעול עם חותמת-הסגירה — הסגירה עומדת גם אם מייל נכשל (AR-5).
    await expect(page.getByTestId('closing-tab-closed')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('closing-stamp')).toContainText('נסגר ב-')
  })

  test('מסע-הביטול — על פרויקט E2E-* פעיל', async ({ page }) => {
    const row = await findE2ESubjectRow(page)
    test.skip(row === null, NO_E2E_SUBJECT_REASON)

    await row.click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    const cancelButton = page.getByTestId('project-card-cancel-button')
    test.skip(
      (await cancelButton.count()) === 0,
      'נושא ה-E2E-* אינו פעיל — מסע-הביטול דורש נושא בסטטוס פעיל',
    )

    await cancelButton.click()
    await expect(page.getByTestId('cancel-banner')).toBeVisible({ timeout: 20_000 })
    // "אחר" ולא "כוח עליון": לא מדגימים מסלול שמאפס פיצוי על נושא שמישהו עוד יסתכל עליו.
    await page.getByTestId('cancel-type-other').click()
    await page.getByTestId('cancel-reason').fill('ביטול מבוקר של נושא-בדיקה ייעודי (E2E)')
    await expect(page.getByTestId('cancel-confirm')).toBeEnabled()
    await page.getByTestId('cancel-confirm').click()

    // ההוכחה: הכרטיס נטען מחדש כמבוטל — התג, והתא התשיעי עם הסיבה שנשמרה.
    await expect(page.getByTestId('project-card-status')).toContainText('בוטל', {
      timeout: 30_000,
    })
    await expect(page.getByTestId('project-cell-cancel-reason')).toContainText('נושא-בדיקה')
  })

  test('מסע שינוי-התכולה — על פרויקט E2E-* פעיל', async ({ page }) => {
    const row = await findE2ESubjectRow(page)
    test.skip(row === null, NO_E2E_SUBJECT_REASON)

    await row.click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    const scopeButton = page.getByTestId('project-card-scope-button')
    test.skip(
      (await scopeButton.count()) === 0 || !(await scopeButton.isEnabled()),
      'נושא ה-E2E-* אינו פעיל — שינוי-תכולה חסום אחרי האירוע',
    )

    await scopeButton.click()
    // שורת-הדיילות קיימת תמיד (fallback) — מעלים את הכמות ב-1 דרך שדה-הכמות הראשון.
    const qtyInput = page.getByLabel(/^כמות חדשה — /).first()
    await expect(qtyInput).toBeVisible({ timeout: 20_000 })
    const current = Number((await qtyInput.inputValue()) || '0')
    await qtyInput.fill(String(current + 1))
    await page.getByTestId('scope-reason').fill('שינוי-תכולה מבוקר על נושא-בדיקה ייעודי (E2E)')
    await expect(page.getByTestId('scope-save')).toBeEnabled()
    await page.getByTestId('scope-save').click()

    // ההוכחה: הדיאלוג נסגר והשינוי מופיע בהיסטוריה שבלשונית-הלוגיסטיקה (רשומה קבועה).
    await expect(page.getByTestId('scope-save')).toBeHidden({ timeout: 30_000 })
    await expect(page.getByTestId('logistics-history')).toContainText('נושא-בדיקה', {
      timeout: 20_000,
    })
  })

  test('מסע שינוי-התאריך — על פרויקט E2E-* פעיל (מאפס אישורים — לכן רק על נושא ייעודי)', async ({
    page,
  }) => {
    const row = await findE2ESubjectRow(page)
    test.skip(row === null, NO_E2E_SUBJECT_REASON)

    await row.click()
    await expect(page.getByTestId('project-card-page')).toBeVisible({ timeout: 15_000 })
    const editButton = page.getByTestId('project-card-edit-details')
    test.skip(
      (await editButton.count()) === 0,
      'לנושא ה-E2E-* אין כפתור-עריכה (תפקיד בלי edit) — המסע דורש מנהלת פרויקטים',
    )

    await editButton.click()
    await expect(page.getByTestId('edit-project-dialog')).toBeVisible({ timeout: 20_000 })
    // תאריך עתידי חדש (60 יום קדימה) — ㉑ יאפס אישורים סופיים; מותר רק כי הנושא ייעודי.
    const nextDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await page.getByTestId('edit-project-date-input').fill(nextDate)
    await expect(page.getByTestId('edit-project-save')).toBeEnabled()
    await page.getByTestId('edit-project-save').click()

    // ההוכחה: הדיאלוג נסגר בלי שגיאת-שרת, והתא בכרטיס מציג את התאריך החדש (DD/MM/YYYY).
    await expect(page.getByTestId('edit-project-dialog')).toBeHidden({ timeout: 30_000 })
    const [y, m, d] = nextDate.split('-')
    await expect(page.getByTestId('project-cell-date')).toContainText(`${d}/${m}/${y}`)
  })
})
