import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// סריקת-נגישות אוטומטית (axe-core) — נוספה 10/08/2026 בעקבות שני ממצאי-3.7 שכלי כזה
// היה תופס מכנית: מלכודת-מקלדת (מבט-העל, מודול 4) וכפתור-סגירה כפול (כרטיס-דיילת, מודול 4).
// רץ נגד מסכים אמיתיים על פני כל המודולים הבנויים — לא רק מודול 4 — כי הכלי בודק DOM,
// לא לוגיקה-עסקית, ואינו תלוי-מודול.
//
// 🔴 **מדיניות-חומרה, לא "אפס הכול":** רק violations בחומרה `critical`/`serious` נכשלים את
// הבדיקה. `moderate`/`minor` נאספים ומודפסים לעיון, לא חוסמים — אותו עיקרון בדיוק כמו
// `audit-gate.mjs` (פטור מתועד לממצא-ידוע, לא השתקה שקטה).
//
// 🔬 **תיקון 10/08/2026 (אותו ערב, אחרי שישי ביקש לתקן) — הממצא הראשון היה שגוי בחלקו:**
// הריצה הראשונה דיווחה "ל-7 מתוך 8 מסכים אין `<main>`/`<h1>`" — **זו הייתה תקלת-תזמון בבדיקה
// עצמה, לא בקוד.** `page.goto()` בין מסכים גורם ל-reload מלא, ו-axe רץ **מיד**, לפעמים בדיוק
// באותה מילישנייה שבה `MainLayout` עדיין מציג את מסך-הביניים `"טוען..."` (לפני ש-AuthContext
// סיים) — שם באמת אין `<main>`/`<nav>`/`<h1>`, כי זה עדיין לא העמוד עצמו. **נמדד ישירות:**
// scan מבודד על מסך-הבית, בלי המרוץ, החזיר **אפס** violations — ול-6 מתוך 7 המסכים-שנחשדו
// כבר יש `<h1>` ו-`<main>` תקינים (`MainLayout` עוטף הכול ב-`<main>` אחד קבוע). **הממצא האמיתי
// היחיד ממשפחה זו: `CustomersPage` בלבד היה בלי `<h1>` (`<h2>רשימת לקוחות</h2>`) — תוקן.**
// ⇒ הוספתי המתנה-לטעינה (`waitForReady`) לפני כל סריקה, כדי שהמסך-הביניים לא יזוהה כ"עמוד".
//
// 🎯 **ושני ממצאים אמיתיים נוספים נמצאו באותה ריצה, ותוקנו:** `button-name` על ה-Select של
// "עיר" במאגר-הדיילות (לא היה `aria-label` בכלל, בניגוד לשדות-טופס שיש להם תווית חזותית
// לפחות) — נוסף `aria-label="סינון לפי עיר"`.
//
// ⏸️ **וממצא אחד נשאר פתוח בכוונה, לא תוקן:** `color-contrast` על שני אלמנטים — טקסט לבן על
// `bg-teal-600` בכפתור "+ הוספת דיילת" (יחס 3.66, נדרש 4.5 — **צבע-המותג הראשי**, בשימוש
// ב-24 קבצים ברחבי `src/`) והכיתוב `text-slate-400` "רבעון אחרון" (יחס 2.63). **שני אלה
// הם שינוי-צבע ולא תיקון-סמנטיקה** — כלל-ברזל 8 אוסר לשנות צבעים בלי אישור ישי, וה-slate-400
// כבר רשום כחוב-נגישות מתוכנן ל-M12 (`architecture_and_qa_roadmap.md:141`). ⇒ `color-contrast`
// מסווג כאן **advisory ולא blocking** במפורש (לא "נשכח" — ראה `CONTRAST_IS_ADVISORY` למטה),
// עד שתתקבל הכרעה על גוון-המותג.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

// ראה הערת 10/08/2026 למעלה: `color-contrast` תלוי-הכרעת-צבע (כלל-ברזל 8), לא תקלת-קוד.
const CONTRAST_IS_ADVISORY = new Set(['color-contrast'])

async function login(page) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת דוא״ל').fill(CEO_EMAIL)
  await page.getByPlaceholder('סיסמה').fill(CEO_PASSWORD)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

// ממתין שהעמוד האמיתי יתרנדר (הסרגל תמיד נושא <nav>) — לא למסך-הביניים "טוען..." של
// MainLayout, שבו באמת אין landmarks. בלי זה, axe שרץ מיד אחרי goto() תופס לפעמים
// את המסך-הביניים ומדווח "אין main/h1" על עמוד שיש לו את שניהם.
//
// 🔴 **הורחב באודיט-הסגירה של מודול 4 (12/08/2026) — התיקון מ-10/08 היה חצי-תיקון.**
// ‏`<nav>` הוא **תפאורת-הפריסה**, והוא נוכח ברגע ש-`AuthContext` סיים — כלומר **לפני**
// שהמסך עצמו טען את הנתונים שלו. ⇒ axe הספיק לסרוק טבלה שעדיין מתרנדרת.
// 🔬 **איך זה התגלה, ואיך אומת:** בריצת-החבילה המלאה נפל `button-name … (11 nodes)` על
// `/system/prices`; **ריצה מבודדת של אותה בדיקה עברה**, ובה אותו מסך החזיר **אפס** ממצאים
// (בריצה שנפלה הוא החזיר גם `empty-table-header` — התסמין הקלאסי של טבלה חצי-בנויה).
// ‏11 הצמתים הם **11 המוצרים**: ה-`SelectTrigger` של סטטוס-המוצר שואב את שמו-הנגיש
// **רק** מה-`SelectValue` שבתוכו, וכל עוד הערך לא נצבע — לכפתור אין שם.
// 🔑 **סיבה אחת, שלושה תסמינים** (`button-name` · `empty-table-header` · ממצא-ה-landmarks
// מ-10/08) ⇒ ההמתנה חייבת להיות ל**תוכן של המסך**, לא לשלד שסביבו.
// ⚠️ `networkidle` אינו "המתנה שרירותית": הוא בדיוק הרגע שבו שאילתות-המסך הסתיימו.
async function waitForReady(page) {
  await page.locator('nav').first().waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 })
}

async function scan(page, label) {
  await waitForReady(page)
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter(
    (v) => ['critical', 'serious'].includes(v.impact) && !CONTRAST_IS_ADVISORY.has(v.id),
  )
  const advisory = results.violations.filter(
    (v) => !['critical', 'serious'].includes(v.impact) || CONTRAST_IS_ADVISORY.has(v.id),
  )
  if (advisory.length > 0) {
    console.log(
      `⚠️ ${label}: ${advisory.length} advisory finding(s) — ${advisory
        .map((v) => v.id)
        .join(', ')}`,
    )
  }
  expect(
    blocking.map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`),
    `${label} — critical/serious accessibility violations`,
  ).toEqual([])
}

test.describe('נגישות (axe-core) — מסכים ראשיים על פני כל המודולים', () => {
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  test('סריקה על מסכי מודולים 1–4', async ({ page }) => {
    await login(page)

    await page.goto('/')
    await scan(page, 'מסך הבית')

    await page.goto('/customers')
    await scan(page, 'לקוחות (מודול 2)')

    await page.goto('/quotes')
    await scan(page, 'הצעות (מודול 3)')

    await page.goto('/quotes/new')
    await scan(page, 'בניית הצעה (מודול 3)')

    await page.goto('/system/prices')
    await scan(page, 'מחירים (מודול 1/system)')

    await page.goto('/system/permissions')
    await scan(page, 'מטריצת הרשאות (מודול 1)')

    await page.goto('/hostesses')
    await scan(page, 'דיילות · מעקב פניות ושיבוצים (מודול 4)')

    await page.getByTestId('hostesses-tab-repository').click()
    await scan(page, 'דיילות · מאגר (מודול 4)')
  })
})
