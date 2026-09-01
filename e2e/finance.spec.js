import { test, expect } from '@playwright/test'

// E2E של מודול 8 — המשטחים הפנימיים (S1 מבט-על · S2 חלון-סגירה · S3 דוח-שכר + היסטוריה).
// צעד 4.4, לפי `docs/micro_guides/module-8.md` §6.
//
// 🔴 **אפס כתיבות למסד, בכוונה מלאה — לא רק כמדיניות-קבע של `e2e/CLAUDE.md`.** הריצה הזו
// מתבצעת ב-28/08/2026, **יום ההצגה-הביניים של ישי על אותו פרויקט Supabase**; חוזה-הריצה
// המשותף לכל הסוכנים באותה עבודה אוסר במפורש `INSERT/UPDATE/DELETE`/RPC-כותב על המסד החי.
// ⇒ הבדיקות כאן **קוראות ותו לא**: פותחים דיאלוג, קוראים שדות, סוגרים ב-`Escape` — אף כפתור
// שכותב ("שמור ושלח", "שמור סטטוס", "העבר לארכיון", "הפקה") לא נלחץ באף בדיקה בקובץ הזה.
// בדיקות שכן מדמות כתיבה (הפקת-דוח, שליחת-חשבונית) שייכות ל-5.1 (מסע-חי, בהרשאת-ישי) או
// ליירוט-רשת (`public-feedback.spec.js`), לא לכאן.
//
// 🕓 **עוגן-הדאטה נבחר בזמן-כתיבה, נמדד חי ולא מקודד-שרירותי** (27-28/08/2026, שאילתת
// קריאה-בלבד על `projects`+`project_finance`): כרגע יש **שורה אחת בלבד** בשלוש לשוניות-S1
// גם יחד — פרויקט **#12 "כנס משקיעים שנתי"** (קבוצת אחזקות דנוך בע"מ), בלשונית "ממתין
// לחשבונית" (`operationally_closed_at` קיים, `invoice_sent=false`). זהו אותו פרויקט-#12
// שהאפיון מייעד למסע-הקבלה החי של 5.1 — ולכן קיים כאן במכוון, לא צירוף-מקרים.
// ⚠️ **וזה בדיוק המקום שבו `e2e/CLAUDE.md` מזהיר מפיקסטורה נעוצה:** שם/מספר עלולים לזוז
// (החשבונית תישלח ב-5.1, השורה תעבור ללשונית הבאה). ⇒ **הבדיקות כאן קוראות ערך בזמן-ריצה
// מהעמוד עצמו ומאמתות עקביות-פנימית (מונה-לשונית = ספירת-שורות שרונדרו) בכל שלוש הלשוניות**
// — בדיוק הדפוס של `projects`/`logistics` ב-`smoke.spec.js` — ואינן נועצות "1" בקוד.
// המחרוזת היחידה שנעוצה, "כנס משקיעים שנתי", עמידה יותר: היא snapshot-שם בלי מסלול-עריכה,
// בדיוק כמו `projects.knownEvent` באותו קובץ-עוגנים.
//
// 🔴 **תיקון 28/08/2026 — ההגנה הזו הוצהרה אך לא מומשה, בשתי הבדיקות.** ‏S1 סייגה את
// זיהוי-השורה ב-`if (key === KNOWN_PROJECT_TAB)`, ו-S2 לחצה ישירות על הלשונית הנעוצה
// והמתינה לשורה בתוכה. ⇒ **ברגע ש-5.1 שולח את החשבונית של #12** (הצעד שמיד אחרי הפזה
// הזו, לפי §6 של המדריך) **שתיהן היו נופלות על מסך תקין לחלוטין** — בדיוק מצב-הכשל שהערה
// זו התיימרה למנוע. שתיהן מאתרות עכשיו את הלשונית בזמן-ריצה
// (`openTabHoldingKnownProject`), ו-S2 בודקת את **אינווריאנט הגייט של השלב שנמצא בפועל**
// במקום להניח את שלב-החשבונית.

const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL
const FINANCE_PASSWORD = process.env.E2E_FINANCE_PASSWORD

const KNOWN_PROJECT_ID = 12
const KNOWN_PROJECT_NAME = 'כנס משקיעים שנתי'
// 🕓 **אין כאן קבוע-לשונית, בכוונה.** בזמן-הכתיבה (28/08/2026) #12 ישב ב-`awaiting_invoice`,
// אבל אף אסרשן בקובץ אינו תלוי בכך — הלשונית נקראת מהמסך בזמן-ריצה.

const TAB_KEYS = ['awaiting_invoice', 'awaiting_payment', 'finished']

async function login(page) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(FINANCE_EMAIL)
  await page.getByPlaceholder('סיסמה').fill(FINANCE_PASSWORD)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// מונה-הלשונית קורא `—` בטעינה/חוסם ו-ספרה אחרת. ממתינים לספרה לפני שקוראים אותה,
// אחרת מירוץ מול הטעינה הראשונית מוציא NaN ומפיל את ההשוואה בלי קשר לתקינות המסך.
async function waitForTabCount(page, key) {
  const tab = page.getByTestId(`finance-tab-${key}`)
  await expect(tab).toBeVisible({ timeout: 30_000 })
  await expect(tab).not.toContainText('—', { timeout: 30_000 })
  const text = await tab.innerText()
  return Number(text.replace(/[^0-9]/g, ''))
}

// 🔴 **מאתר את הלשונית שבה השורה הידועה יושבת *עכשיו*, ולא מניח אותה** *(נוסף 28/08/2026)*.
// הלשונית היא **מדידה מזמן-הכתיבה, לא קבוע**: צעד 5.1 של אותו מדריך-מיקרו שולח
// את החשבונית של #12 בדיוק, ומאותו רגע השורה עוברת ל-`awaiting_payment` — ולשונית נעוצה
// הייתה מפילה את הבדיקה על מסך תקין לגמרי. זהו בדיוק מוקש "פיקסטורה נעוצה לשורה חיה"
// ש-`e2e/CLAUDE.md` מזהיר ממנו. ⚠️ **ובדיקת-S1 לא "כבר הגנה מזה" — היא רק הצהירה שכן**;
// הסתירה בין ההערה שלה לקוד שלה תוקנה באותו יום (ר' ההערה בגוף S1).
// 🚫 **ואין כאן ריכוך:** אם השורה לא נמצאת באף לשונית — הבדיקה נופלת, כי אז ההרשאה/ה-RPC
// שבורים ולא "העוגן התיישן".
async function openTabHoldingKnownProject(page) {
  for (const key of TAB_KEYS) {
    await page.getByTestId(`finance-tab-${key}`).click()
    const count = await waitForTabCount(page, key)
    if (count === 0) continue
    // ממתינים לרינדור השורות של הלשונית לפני שמחפשים — אחרת חיפוש על טבלה שעדיין
    // ריקה מחזיר 0 ומדלג על הלשונית הנכונה (מדידה על מכנה-0, `e2e/CLAUDE.md`).
    await expect(page.locator('[data-testid^="finance-row-"]')).toHaveCount(count, {
      timeout: 30_000,
    })
    if ((await page.getByTestId(`finance-row-${KNOWN_PROJECT_ID}`).count()) > 0) return key
  }
  throw new Error(
    `פרויקט #${KNOWN_PROJECT_ID} ("${KNOWN_PROJECT_NAME}") לא נמצא באף אחת משלוש לשוניות-S1 — ` +
      'זה לא "עוגן שהתיישן" אלא הרשאה/RPC שבורים, כי הפרויקט סגור-תפעולית במסד.',
  )
}

test.describe('מודול 8 · כספים — E2E פנימי (S1/S2/S3), קריאה-בלבד', () => {
  test.skip(
    !FINANCE_EMAIL || !FINANCE_PASSWORD,
    'E2E_FINANCE_EMAIL/E2E_FINANCE_PASSWORD לא הוגדרו ב-.env.local',
  )

  test('S1: שלוש הלשוניות עולות, כל מונה-לשונית עקבי עם השורות שרונדרו', async ({ page }) => {
    await login(page)
    await page.goto('/finance')
    await expect(page.getByTestId('finance-page')).toBeVisible()

    let foundKnownProject = false

    for (const key of TAB_KEYS) {
      await page.getByTestId(`finance-tab-${key}`).click()
      const count = await waitForTabCount(page, key)
      expect(count, `מונה-הלשונית ${key} שלילי`).toBeGreaterThanOrEqual(0)

      if (count === 0) {
        // ⬜ ריק-אמיתי (בלי סינון פעיל) — הכרטיס §④ מסמן אותו "חסר, לא צויר"; המסך בכל זאת
        // מציג משהו קוהרנטי (לא טבלה ריקה בלי הסבר).
        await expect(page.getByTestId('finance-empty-tab')).toBeVisible()
        continue
      }

      // אינווריאנט-עצמי: מספר-השורות שרונדרו שווה למונה שהלשונית מציגה — בדיוק כמו
      // `projects-tab-all`/`logistics-pill-all` ב-`smoke.spec.js`. אין כאן מספר נעוץ שירקיב.
      const rows = page.locator('[data-testid^="finance-row-"]')
      await expect(rows).toHaveCount(count, { timeout: 30_000 })

      // 🔴 **תוקן 28/08/2026 — כאן היה `if (key === KNOWN_PROJECT_TAB)`, וזו הייתה סתירה
      // בין ההערה לקוד:** הערת-הסיום למטה הבטיחה "באיזושהי לשונית", אבל התנאי הזה אִפשר
      // ל-`foundKnownProject` להידלק **רק** ב-`awaiting_invoice` ⇒ ברגע ש-5.1 שולח את
      // החשבונית של #12 והשורה עוברת ל-`awaiting_payment`, גם בדיקת-S1 הייתה נופלת על מסך
      // תקין. הבדיקה סורקת עכשיו את שלוש הלשוניות באמת, כפי שההערה תמיד טענה.
      const knownRow = page.getByTestId(`finance-row-${KNOWN_PROJECT_ID}`)
      if ((await knownRow.count()) > 0) {
        await expect(knownRow).toContainText(KNOWN_PROJECT_NAME)
        foundKnownProject = true
      }
    }

    // עוגן-חיוב אחד: הפרויקט הידוע חייב להופיע *באיזושהי* לשונית שיש בה שורות — אחרת
    // ההרשאה/ה-RPC שבורים, וזה כשל אמיתי ולא "עוגן שהתיישן": הפרויקט סגור-תפעולית במסד
    // ולכן חייב להופיע באחת השלוש, יהיה שלב-הכסף שלו אשר יהיה.
    expect(
      foundKnownProject,
      `פרויקט #${KNOWN_PROJECT_ID} ("${KNOWN_PROJECT_NAME}") לא נמצא באף אחת משלוש הלשוניות — הוא סגור-תפעולית ולכן חייב להופיע באחת מהן; זו הרשאה/RPC שבורים, לא עוגן מיושן`,
    ).toBe(true)
  })

  test('S2: לחיצה על השורה הידועה פותחת את חלון-הסגירה עם שער-חשבונית גלוי', async ({ page }) => {
    await login(page)
    await page.goto('/finance')
    await expect(page.getByTestId('finance-page')).toBeVisible()

    // 🕓 הלשונית נקראת מהמסך בזמן-ריצה, לא נעוצה — ר' `openTabHoldingKnownProject` למעלה.
    const tab = await openTabHoldingKnownProject(page)
    const row = page.getByTestId(`finance-row-${KNOWN_PROJECT_ID}`)
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.click()

    const dialog = page.getByTestId('closing-dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    // ① — הדיאלוג אינו סומך על השורה ששיגרה אותו (הערת-הראש של הקובץ): הכותרת/התיאור
    // מגיעים מה-`project` prop (שדה-תצוגה בלבד), אבל הגוף נשלף מחדש מה-RPC. שני העוגנים —
    // כותרת הדיאלוג ומצב-הפרויקט — מאמתים ששני המקורות מסכימים על אותו פרויקט.
    await expect(dialog.getByRole('heading', { name: KNOWN_PROJECT_NAME })).toBeVisible()
    await expect(page.getByTestId('closing-meta')).toBeVisible()

    // 🔑 **האינווריאנט הנבדק זהה בכל שלוש הלשוניות: הפקד הכותב של השלב חסום עד שתנאיו
    // מתמלאים** — וזה מה שנשאר נכון גם אחרי ש-5.1 יזיז את #12. הענף נבחר לפי הלשונית
    // שנמצאה בפועל, ולא לפי הנחה על מצב-המסד.
    if (tab === 'awaiting_invoice') {
      // גייט-נוט (P1 card, "שמור ושלח" חסום עד קובץ מצורף). `invoice_sent=false` — נמדד
      // חי בזמן-כתיבה, ומאומת כאן מחדש דרך הלשונית שבה השורה נמצאה.
      await expect(page.getByTestId('closing-invoice-block')).toBeVisible()
      await expect(page.getByTestId('closing-invoice-gate')).toBeVisible()
      await expect(page.getByTestId('closing-send-invoice')).toBeDisabled()
    } else if (tab === 'awaiting_payment') {
      // אותו אינווריאנט בשלב הבא: "שמור תשלום" חסום כל עוד שדה-התאריך ריק
      // (`disabled={value === ''}`), ובפתיחה הוא ריק.
      await expect(page.getByTestId('closing-payment-block')).toBeVisible()
      await expect(page.getByTestId('closing-payment-date')).toHaveValue('')
      await expect(page.getByTestId('closing-save-payment')).toBeDisabled()
    } else {
      // ארכיון: התיק נעול, ואין בו פקד-כתיבה כלל.
      await expect(page.getByTestId('closing-locked-banner')).toBeVisible()
    }

    // סגירה ב-Escape בלבד — לא בכפתור עסקי. לוחצים ומוודאים שהדיאלוג נעלם ושום
    // באנר-הצלחה/שגיאת-שרת לא נותר על המסך (סימן שנשלחה בטעות כתיבה).
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('closing-server-error')).toHaveCount(0)
  })

  test('S3: דיאלוג דוח-השכר נפתח עם תצוגה-מקדימה, וההיסטוריה יושבת בתוכו', async ({ page }) => {
    await login(page)
    await page.goto('/finance')
    await expect(page.getByTestId('finance-page')).toBeVisible()

    // 🔴 **ההיסטוריה עברה אל תוך הדיאלוג — הכרעת-ישי 28/08/2026, שגוברת על Q-2 ועל
    // המוקאפ המאושר.** הנימוק שלו: לשונית "הסתיימו" צוברת כל פרויקט שאורכב אי-פעם, ולכן
    // כרטיס מתחת לטבלה נדחק מתחת לקו-הקיפול לצמיתות. **הבדיקה נועלת את שני הצדדים** —
    // שהמסך כבר אינו נושא אותו, ושהדיאלוג כן — כדי שחזרה שקטה למצב הקודם תיתפס.
    await expect(page.getByTestId('salary-history-card')).toHaveCount(0)

    await page.getByTestId('finance-open-salary').click()
    const dialog = page.getByTestId('salary-report-dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    const history = dialog.getByTestId('salary-history-card')
    await expect(history).toBeVisible({ timeout: 30_000 })
    // 🕓 מספר-הדוחות משתנה עם הזמן (5.1 הפיק את אוגוסט 2026) ⇒ שני מצבים לגיטימיים.
    // 🔴 **תוקן 28/08/2026 — כאן היה `if ((await historyRows.count()) === 0)`, וזה מרוץ.**
    // ‏`.count()` הוא צילום-רגע **ואינו חוזר על עצמו** כמו `expect`: הוא יכול לקרוא 0 בעוד
    // השליפה באוויר, ואז הבדיקה מחכה למציין-"ריק" שלעולם לא יופיע — כי שורות כן הגיעו.
    // ‏`.or()` הוא ה-locator היחיד שמחכה **לשני** המצבים ומצליח על הראשון שמתייצב.
    // *(נתפס באודיט-ריצה בלתי-תלוי, שאבחן את השורה במדויק — הכשל היה בבדיקה, לא במסך.)*
    await expect(
      history
        .getByTestId('salary-history-empty')
        .or(history.locator('[data-testid^="salary-history-row-"]').first()),
    ).toBeVisible({ timeout: 30_000 })

    // תצוגה-מקדימה **אינה** מציגה מספר-כסף (הערת-הראש של הקובץ — אין קורא שאינו כותב) —
    // הבדיקה נשארת נאמנה לכך ומאמתת רק את מה שהמסך בפועל מבטיח: כפתור-בורר-החודש (הבורר
    // עצמו סגור כברירת-מחדל — `pickerOpen` מתחיל `false`, ולא נלחץ כאן כדי להישאר קריאה-
    // בלבד) + גוש-תצוגה-מקדימה עולים, ואפס פעולה-כותבת נלחצת.
    await expect(page.getByTestId('salary-report-month-button')).toBeVisible()

    // 🔴 **תוקן `01/09/2026` באודיט-הסגירה — הבדיקה הייתה תלוית-תאריך ונפלה על מסך תקין.**
    // בורר-החודש נפתח על **החודש הקודם** (`SalaryReportDialog.jsx`, `d.setMonth(d.getMonth() - 1)`).
    // ב-28/08, כשהבדיקה נכתבה, זה היה יולי — שלא הופק — ולכן הקדם-הפקה רונדר. **מ-01/09 זהו
    // אוגוסט, שדוח 13 כבר הופק עבורו**, והמסך מרנדר במקומו את הבאנר-החסום — **וזו התנהגות
    // נכונה ומתועדת** (`ClosingWindow`/`SalaryReportDialog`: "מצב-הקדם-הפקה **לא מוצג כשהחודש
    // כבר הופק**"). האסרשן היה בלתי-מותנה במקום שבו המסך מותנה.
    // ⇒ **נועלים את האינווריאנט ולא את המצב:** בדיוק אחד משני הגושים קיים, ולכל אחד מהם
    // המשמעות ההפוכה לגבי כפתור-ההפקה. זהו אותו דפוס של `.or()` שכבר תוקן למעלה, ואותו לקח
    // שהיומן רושם: בדיקה שנעוצה לספירה/תאריך/מזהה חי **מרקיבה** — נועלים תנאי-ריצה, לא ערך.
    const preflight = page.getByTestId('salary-report-preflight')
    const blockedBanner = page.getByTestId('salary-report-blocked-banner')
    await expect(preflight.or(blockedBanner).first()).toBeVisible({ timeout: 15_000 })

    const monthAlreadyGenerated = (await blockedBanner.count()) > 0
    if (monthAlreadyGenerated) {
      // חודש שהופק ⇒ אין קדם-הפקה, וכפתור-ההפקה **חייב** להיות מושבת.
      await expect(preflight).toHaveCount(0)
      await expect(page.getByTestId('salary-report-generate')).toBeDisabled()
    } else {
      // חודש פתוח ⇒ הקדם-הפקה הוא המסר, וכפתור-ההפקה פעיל.
      await expect(preflight).toBeVisible()
      await expect(page.getByTestId('salary-report-generate')).toBeEnabled()
    }

    // סגירה בכפתור-הביטול המפורש (לא "הפקה") — הכפתור הכותב היחיד בדיאלוג נשאר בלתי-נלחץ.
    await expect(page.getByTestId('salary-report-generate')).toBeVisible()
    await page.getByTestId('salary-report-cancel').click()
    await expect(dialog).toBeHidden()
  })
})
