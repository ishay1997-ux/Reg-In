import { test, expect } from '@playwright/test'
import { REPORT_TABS } from '../src/modules/11_reports/reportsCatalog.js'

// 📏 **בדיקת-הצפיפות של מ11 — כללי מצב 0 ומצב 2 כמספרים שנמדדים על המסך.**
// המקור: `docs/plans/2026-09-23-module-11-decision-reports.md` §4ה (הטבלאות 0.1–0.12 ו-2.1–2.10)
// ו-`~/.claude/skills/ui-copy-and-onboarding-levels/references/data-surfaces.md` §2–§3.
//
// 🔑 **למה בדיקה ולא עוד כלל כתוב:** ישי, 23/09/2026: *"נראלי הכללים שם לא מספיקים"* — כרטיס בן
// חמש שורות עבר את כל הכללים הכתובים, כי אף אחד מהם לא היה מספר שנמדד על המסך. כאן כל כלל הוא
// מספר, וכל חריגה נכשלת עם **שם הדוח, הכרטיס, הכלל והערך** — כך שהבדיקה אומרת גם מה לתקן.
//
// 🔴 **המצב נכפה ביירוט, לא בכתיבה למסד** — אותו דפוס בדיוק כמו `reports.spec.js` (מצב-הטמעה 2):
// ה-GET היחיד ש-`AuthContext` שולח ל-`notification_preferences` מקבל את המצב המבוקש. ⇒ אפס
// כתיבות, ואין שחזור שיכול להיכשל באמצע ולהשאיר את המנכ"ל במצב הלא-נכון.
// ⚠️ **ומוודאים שהכפייה באמת תפסה** (data-surfaces §4: *"צילום 'מצב 0' של משתמשת במצב 2 מודד את
// השכבה וקורא לה בסיס"*): במצב 0 — אפס רמזים גלויים בכל הדפים; במצב 2 — לפחות רמז אחד.
//
// 🧮 **מה אינו נמדד כאן, ולמה** (כדי שהיעדר-כישלון לא ייקרא כ"נבדק"):
// 0.12 עיגול-אחיד — קיים ב-`formatByType` ובבדיקות-היחידה שלו · 2.2 רמז ≤ 220 — `onboardingCopy.budget.test.js`
// · 2.6 נראות-השכבה · 2.7 מבחן-המחיקה · 2.8 לשון · 2.9 המתג · 2.10 "לא נתקעת" — שיפוט/חזותי, נבדקים
// בצילומים ובקריאה, לא כאן.

const CEO_EMAIL = process.env.E2E_CEO_EMAIL
const CEO_PASSWORD = process.env.E2E_CEO_PASSWORD

// 📏 הספים — התוכנית §4ה, כפי שכוילו (ישי 23/09: *"אולי אשתקד זה כן נחמד"* ⇒ השוואה + שורת-הקשר ≤30).
const LIMITS = Object.freeze({
  nameWords: 4, // 0.1
  valueChars: 12, // 0.2
  contextChars: 30, // 0.3 — שורת-ההקשר הגלויה (המכנה)
  linesUnderValue: 2, // 0.3 — השוואה + שורת-הקשר
  tilesPerRow: 6, // 0.4
  tileRows: 2, // 0.4
  soWhatChars: 120, // 0.5
  chartTitleWords: 6, // 0.6
  chartSubChars: 60, // 0.6
  columnWords: 3, // 0.7
  // 0.9 — ✏️ כיול 23/09 לילה: פרוזה חופשית בלבד (שבב-ההיקף · הערת-גרף · הערות-שוליים · באנר).
  // הדגם שישי אישר (מ02) עומד בזה; שורת-"אז מה" ושורות-ההקשר נמדדות בכללים שלהן.
  explanatoryChars: 150,
  hintsPerScreen: 4, // 2.3
})

// 0.8 — תאריך או חלון-זמן בתוך כרטיס: "23/09" · "12 החודשים" · "נכון ל" · "כל הזמנים".
const PERIOD_PATTERN = /\d{1,2}\/\d{1,2}|החודשים האחרונים|נכון ל|כל הזמנים/
// 0.5 — מילה ראשונה של שורת-"אז מה": שם-פועל (ל…) או ציווי-נקבה ידוע. `כ2` (m11-copy-rules) נועל
// את "לשים לב ש…" לדוחות אסטרטגיים — ולכן הוא עובר כאן בכוונה.
const ACTION_START = /^(ל\S+|אין|שימי|בדקי|פתחי|התקשרי|גבי)/
// 2.5 — רמז שנפתח בהגדרה ולא ב"למה"/"מה לעשות".
const DEFINITION_START = /^(המדד|הדוח הזה|מדד זה|זהו|זה המספר)/

const SURFACES = REPORT_TABS.flatMap((tab) =>
  tab.surfaces.map((surface) => ({ tab: tab.key, ...surface })),
)

async function login(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('כתובת אימייל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  await expect(page).toHaveURL('/', { timeout: 30_000 })
}

async function forceOnboardingMode(page, mode) {
  await page.route('**/rest/v1/notification_preferences*', async (route) => {
    const response = await route.fetch()
    let body = await response.json()
    if (Array.isArray(body)) body = body.map((row) => ({ ...row, onboarding_mode: mode }))
    else if (body && typeof body === 'object') body = { ...body, onboarding_mode: mode }
    await route.fulfill({ response, json: body })
  })
}

async function openReport(page, surface) {
  await page.goto(`/reports?tab=${surface.tab}&report=${surface.slug}`)
  await page
    .locator(
      [
        `[data-testid="report-${surface.slug}"]`,
        `[data-testid="report-${surface.slug}-blank"]`,
        `[data-testid="report-${surface.slug}-empty"]`,
        `[data-testid="report-${surface.slug}-error"]`,
      ].join(', '),
    )
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForLoadState('networkidle')
}

// 🔬 כל המדידה בדפדפן, בקריאה אחת — ומחזירה עובדות בלבד. ההשוואה לספים נעשית ב-Node,
// כדי שהודעת-הכישלון תישא את הערך שנמדד ולא רק "נכשל".
function measure(slug) {
  const strip = (s) => (s ?? '').replace(/[⁦-⁩]/g, '').replace(/\s+/g, ' ').trim()
  const visible = (el) => !!el && el.getClientRects().length > 0
  const qa = (root, sel) => [...root.querySelectorAll(sel)]
  const root = document.querySelector(`[data-testid="report-${slug}"]`)
  if (!root) return { missing: true }
  const tiles = qa(root, '[data-testid^="report-tile-box-"]').map((box) => {
    const tile = box.querySelector(
      '[data-testid^="report-tile-"]:not([data-testid^="report-tile-box-"]):not([data-testid^="report-tile-link-"])',
    )
    const spans = tile ? [...tile.children] : []
    const label = strip(spans[0]?.innerText)
    const value = strip(spans[1]?.innerText)
    const under = spans
      .slice(2)
      .flatMap((el) => [
        ...el.querySelectorAll('[data-testid="kpi-sub"],[data-testid="kpi-compare"]'),
      ])
      .filter(visible)
      .map((el) => ({
        kind: el.dataset.testid,
        text: strip(el.innerText),
        // 0.3 "שורה אחת" — נמדד כגובה, לא כתווים: שורה שנשברה לשתיים היא שתי שורות על המסך.
        wrapped:
          el.getBoundingClientRect().height > parseFloat(getComputedStyle(el).lineHeight) * 1.5,
      }))
    const r = box.getBoundingClientRect()
    return {
      key: box.dataset.testid.replace('report-tile-box-', ''),
      label,
      value,
      under,
      top: Math.round(r.top),
      height: Math.round(r.height),
      width: Math.round(r.width),
    }
  })
  const text = (sel) =>
    qa(root, sel)
      .filter(visible)
      .map((el) => strip(el.innerText))
  const hints = qa(root, '[data-testid^="hint-"]')
    .filter(visible)
    .map((el) => ({
      id: el.dataset.testid,
      text: strip(el.innerText),
      top: Math.round(el.getBoundingClientRect().top + window.scrollY),
    }))
  const banners = qa(root, '.bg-amber-50')
    .filter(visible)
    .filter((el) => el.dataset.testid !== 'report-missing-params')
    .map((el) => el.dataset.testid ?? el.className)
  const tileValues = tiles.map((t) => t.value).join(' ')
  return {
    tiles,
    soWhat: text('[data-testid="report-so-what"]')[0] ?? null,
    chartTitles: qa(root, '[data-testid^="chart-card-"] > h3')
      .filter(visible)
      .map((el) => strip(el.innerText)),
    chartSubs: text('[data-testid="chart-note"], [data-testid="chart-action"]'),
    // טבלת-קורא-המסך של הגרף (`sr-only`) אינה על המסך — כותרותיה אינן נמדדות.
    columns: qa(root, 'thead th')
      .filter((el) => !el.closest('[data-testid="chart-sr-table"]'))
      .filter(visible)
      .map((el) => strip(el.innerText))
      .filter(Boolean),
    // 0.9 — פרוזה חופשית בלבד. מה שיש לו כלל משלו אינו נספר פעמיים: שורת-"אז מה" (0.5) · שורת-ההקשר
    // בכרטיס (0.3) · שורות-היכולת ("לחיצה על…") והכותרת-הכנה — תוויות-ממשק, לא הסבר.
    explanatory: [
      ...text('[data-testid="report-scope-summary"]'),
      ...text('[data-testid="chart-note"]'),
      ...text('[data-testid="report-meta-notes"]'),
      ...(banners.length ? text('.bg-amber-50') : []),
    ],
    banners,
    hints,
    tileValues,
    emptyText: text('[data-testid$="-blank"], [data-testid$="-empty"]')[0] ?? null,
  }
}

// מילה = אסימון שיש בו אות או ספרה; "—" ו-"·" אינם מילים.
const words = (s) => (s ? s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length : 0)
// כותרת-גרף "שם · כותרת-משנה" — החלק שלפני "·" הוא הכותרת (0.6: ≤6 מילים), השאר שורות-משנה.
const titleParts = (t) => t.split(' · ')
const numeric = /\d/

function mode0Violations(surface, m) {
  const v = []
  const at = (card, rule, value) => v.push(`${surface.id} · ${card} · ${rule} · ${value}`)
  for (const t of m.tiles) {
    if (words(t.label) > LIMITS.nameWords) at(t.label, '0.1 שם ≤4 מילים', words(t.label))
    const masked = t.value.includes('לא זמין בתפקידך')
    // אין ערך ("—" / "אין נתונים עדיין") — מותר רק כשהסיבה גלויה מתחתיו. ערך שהוא מילים (שם-לקוח) — אסור.
    const noValue = !t.value || t.value === '—' || t.value === 'אין נתונים עדיין'
    if (!masked && noValue && t.under.length === 0)
      at(t.label, '0.2 אין ערך ואין סיבה', t.value || '(ריק)')
    if (!masked && !noValue && !numeric.test(t.value)) at(t.label, '0.2 ערך שאינו מספר', t.value)
    if (t.value === '0' && !t.under.some((line) => line.kind === 'kpi-sub'))
      at(t.label, '0.2 אפס בלי בסיס', t.value)
    for (const line of t.under) if (line.wrapped) at(t.label, '0.3 שורה אחת', line.text)
    if (!masked && numeric.test(t.value) && t.value.length > LIMITS.valueChars)
      at(t.label, '0.2 ערך ≤12 תווים', t.value)
    if (t.under.length > LIMITS.linesUnderValue) at(t.label, '0.3 שורות מתחת לערך', t.under.length)
    for (const line of t.under) {
      if (
        line.kind === 'kpi-sub' &&
        numeric.test(t.value) &&
        line.text.length > LIMITS.contextChars
      )
        at(t.label, '0.3 שורת-הקשר ≤30', line.text)
      if (PERIOD_PATTERN.test(line.text)) at(t.label, '0.8 תקופה בכרטיס', line.text)
    }
    if (PERIOD_PATTERN.test(t.label)) at(t.label, '0.8 תקופה בשם', t.label)
  }
  const rows = new Map()
  for (const t of m.tiles) rows.set(t.top, [...(rows.get(t.top) ?? []), t])
  if (rows.size > LIMITS.tileRows) at('כרטיסים', '0.4 ≤2 שורות', rows.size)
  for (const row of rows.values()) {
    if (row.length > LIMITS.tilesPerRow) at('כרטיסים', '0.4 ≤6 בשורה', row.length)
    const heights = new Set(row.map((t) => t.height))
    if (heights.size > 1) at('כרטיסים', '0.4 גובה שווה', [...heights].join('/'))
  }
  // 0.4 — ✏️ רשת (הכרעת-ישי 23/09 לילה): רוחב שווה לכל הכרטיסים בדף, גם לכרטיס יתום בשורה שנייה.
  const widths = new Set(m.tiles.map((t) => t.width))
  if (widths.size > 1) at('כרטיסים', '0.4 רוחב שווה', [...widths].join('/'))
  if (m.soWhat) {
    if (m.soWhat.length > LIMITS.soWhatChars) at('אז מה', '0.5 ≤120 תווים', m.soWhat.length)
    if (!ACTION_START.test(m.soWhat)) at('אז מה', '0.5 מתחיל בפעולה', m.soWhat.split(' ')[0])
  }
  for (const full of m.chartTitles) {
    const [title, ...subs] = titleParts(full)
    if (words(title) > LIMITS.chartTitleWords) at(full, '0.6 כותרת-גרף ≤6 מילים', words(title))
    if (subs.length > 1) at(full, '0.6 לכל היותר שורת-משנה אחת', subs.length)
    for (const sub of subs)
      if (sub.length > LIMITS.chartSubChars) at(full, '0.6 שורת-משנה ≤60', sub.length)
  }
  for (const sub of m.chartSubs)
    if (sub.length > LIMITS.chartSubChars) at('גרף', '0.6 שורת-משנה ≤60', sub.length)
  for (const col of m.columns)
    if (words(col) > LIMITS.columnWords) at(col, '0.7 כותרת-עמודה ≤3 מילים', words(col))
  const total = m.explanatory.join('').length
  if (total > LIMITS.explanatoryChars) at('דף', '0.9 תווי-הסבר ≤150', total)
  for (const banner of m.banners) at('דף', '0.10 באנר במצב 0', banner)
  if (m.hints.length > 0) at('דף', 'מצב 0 מציג רמזים', m.hints.map((h) => h.id).join(','))
  return v
}

function mode2Violations(surface, m) {
  const v = []
  const at = (card, rule, value) => v.push(`${surface.id} · ${card} · ${rule} · ${value}`)
  const tops = m.hints.map((h) => h.top).sort((a, b) => a - b)
  for (let i = 0; i < tops.length; i += 1) {
    const inScreen = tops.filter((top) => top >= tops[i] && top < tops[i] + 900).length
    if (inScreen > LIMITS.hintsPerScreen) {
      at('רמזים', '2.3 ≤4 בגובה-מסך', inScreen)
      break
    }
  }
  const shownNumbers = new Set((m.tileValues.match(/\d[\d,.]*/g) ?? []).filter((n) => n.length > 1))
  for (const hint of m.hints) {
    if (DEFINITION_START.test(hint.text))
      at(hint.id, '2.5 נפתח בהגדרה', hint.text.split(' ').slice(0, 3).join(' '))
    for (const n of hint.text.match(/\d[\d,.]*/g) ?? [])
      if (n.length >= 3 && shownNumbers.has(n)) at(hint.id, '2.4 חוזר על מספר שעל המסך', n)
  }
  return v
}

test.describe('בדיקת-הצפיפות — 16 דוחות, מצב 0 ומצב 2', () => {
  test.use({ viewport: { width: 1536, height: 900 } })
  test.skip(!CEO_EMAIL || !CEO_PASSWORD, 'E2E_CEO_* לא הוגדרו ב-.env.local')

  for (const mode of [0, 2]) {
    test(`מצב ${mode}`, async ({ page }) => {
      test.setTimeout(16 * 30_000)
      await forceOnboardingMode(page, mode)
      await login(page, CEO_EMAIL, CEO_PASSWORD)
      const violations = []
      let hintsSeen = 0
      for (const surface of SURFACES) {
        await openReport(page, surface)
        const m = await page.evaluate(measure, surface.slug)
        if (m.missing) continue // מצב-מעטפת (ריק/תקלה) — אין דף למדוד
        hintsSeen += m.hints.length
        violations.push(...(mode === 0 ? mode0Violations(surface, m) : mode2Violations(surface, m)))
      }
      // ⚠️ הוכחה שהכפייה תפסה — אחרת "אפס חריגות במצב 2" אומר רק שהשכבה לא הופיעה.
      if (mode === 2) expect(hintsSeen, 'מצב 2 לא הציג אף רמז — הכפייה לא תפסה').toBeGreaterThan(0)
      expect(violations, violations.join('\n')).toEqual([])
    })
  }
})
