#!/usr/bin/env node
/**
 * seed-assert — 15 טענות-הקבלה של `seed-data-spec.md §ז׳`, כשאילתות שעוברות או נכשלות.
 *
 * רץ כמנכ"ל דרך המפתח הציבורי (אותה עין כמו המסכים), קורא את רשם-הריצה
 * `scripts/seed-runs/<batch>.json` כדי לדעת מה נזרע, ומדפיס ✅/❌/⚠️ עם ספירות — לא "בדקתי".
 *
 * ⚠️ שלוש טענות אינן שאילתות ומדווחות כתזכורת: ‏11 (‏smoke + test:e2e) · ‏12 (‏gate עם משתני-
 * סביבה מנוקים) · ‏6 (אפס חריגות בריצה — נקרא מרשם-הריצה, לא מהמסד).
 * ‏13ב תלוית-זמן במכוון: נמדדת מול "היום" ברגע ההרצה, ומשמעותית רק סמוך לזריעה.
 *
 * שימוש: node scripts/seed-assert.mjs --batch <שם>   (בלי --batch: על כל המסד, בלי הבחנת-מקור)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { connectAsCeo, SeedDb } from './seed-lib/db.mjs'
import {
  addDays,
  atLocal,
  buildHolidayMap,
  businessDaysBetween,
  classifyDay,
  daysBetween,
} from './seed-lib/calendar.mjs'

const argv = process.argv.slice(2)
const batchArg = (() => {
  const i = argv.indexOf('--batch')
  return i >= 0 ? argv[i + 1] : null
})()

const results = []
const ok = (n, title, detail) => results.push({ n, status: '✅', title, detail })
const bad = (n, title, detail) => results.push({ n, status: '❌', title, detail })
const warn = (n, title, detail) => results.push({ n, status: '⚠️', title, detail })
const check = (n, title, condition, detail) => (condition ? ok : bad)(n, title, detail)

function todayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

// ‏computeQuoteTotals של `src/lib/pricing.js`, בייט-בבייט מבחינת החשבון: אגורות שלמות,
// הנחות בחיבור, מע"מ אחרי ההנחה. משוכפל כאן במודע — סקריפט Node אינו מייבא דרך '@/'.
function quoteTotal(quote, defaultVat) {
  const vat = quote.vat_rate_snapshot ?? defaultVat
  if (vat === null || vat === undefined) return null
  const subtotal = (quote.quote_services ?? []).reduce(
    (sum, l) => sum + Math.round(Number(l.qty) * Math.round(Number(l.closing_unit_price) * 100)),
    0,
  )
  const discount = Math.round(
    (subtotal * (Number(quote.applied_customer_discount) + Number(quote.manual_discount))) / 100,
  )
  const preVat = subtotal - discount
  const vatAmount = Math.round((preVat * Number(vat)) / 100)
  return (preVat + vatAmount) / 100
}

const fmt = (n) => Math.round(n).toLocaleString('en-US')

async function loadAll(db) {
  const [
    projects,
    quotes,
    assignments,
    hostesses,
    logistics,
    customers,
    contacts,
    params,
    products,
    tiers,
    costs,
    finance,
    preferences,
  ] = await Promise.all([
    db.select(
      'projects',
      'project_id, quote_id, customer_id, event_name, final_event_date, final_start_time, project_status, cancelled_at, cancel_type, created_at, feedback_status, feedback_score, invoice_sent_at, payment_date, required_hostess_count',
    ),
    db.select(
      'quotes',
      'quote_id, customer_id, event_name, quote_status, rejection_reason, created_at, updated_at, estimated_event_date, applied_customer_discount, manual_discount, vat_rate_snapshot, quote_services(sku, qty, closing_unit_price, closing_unit_cost)',
    ),
    db.select(
      'assignments',
      'project_id, hostess_id, assignment_number, assignment_status, event_date, attendance_status, lateness_level, no_show_reason, invite_sent_at, created_at',
    ),
    db.select('hostesses', 'hostess_id, full_name, status, created_at'),
    db.select(
      'logistics',
      'project_id, sku, item_status, expected_arrival_date, actual_arrival_date',
    ),
    db.select('customers', 'customer_id, company_name, status, customer_type'),
    db.select('customer_contacts', 'customer_id, is_primary'),
    db.select('params', 'param_name, param_value, param_type'),
    db.select('products', 'sku, category, base_price, status'),
    db.select('price_tiers', 'sku, min_qty, special_price'),
    db.select('product_costs', 'sku, cost'),
    db.select('project_finance', 'project_id, final_profit, cancellation_fee'),
    db.select('customer_hostess_preference', 'customer_id, hostess_id, preference'),
  ])
  return {
    projects,
    quotes,
    assignments,
    hostesses,
    logistics,
    customers,
    contacts,
    params,
    products,
    tiers,
    costs,
    finance,
    preferences,
  }
}

function finalRows(assignments) {
  const byPair = new Map()
  for (const row of assignments) {
    const key = `${row.project_id}|${row.hostess_id}`
    const current = byPair.get(key)
    if (!current || row.assignment_number > current.assignment_number) byPair.set(key, row)
  }
  return [...byPair.values()]
}

async function main() {
  const today = todayIso()
  const run =
    batchArg && existsSync(resolve('scripts/seed-runs', `${batchArg}.json`))
      ? JSON.parse(readFileSync(resolve('scripts/seed-runs', `${batchArg}.json`), 'utf-8'))
      : null
  if (batchArg && !run) {
    console.error(`✗ אין רשם-ריצה לאצווה "${batchArg}" תחת scripts/seed-runs/.`)
    process.exit(1)
  }
  const db = new SeedDb(await connectAsCeo(), { batch: batchArg })
  const d = await loadAll(db)
  const seededProjects = new Set(run?.ids.projects ?? d.projects.map((p) => p.project_id))
  const seededQuotes = new Set(run?.ids.quotes ?? d.quotes.map((q) => q.quote_id))
  const seededHostesses = new Set(run?.ids.hostesses ?? [])
  const param = (name) => d.params.find((p) => p.param_name === name)?.param_value
  const vat = Number(param('אחוז_מעמ'))
  const holidays = buildHolidayMap(2023, Number(today.slice(0, 4)) + 1)
  const projectById = new Map(d.projects.map((p) => [p.project_id, p]))
  const hostessById = new Map(d.hostesses.map((h) => [h.hostess_id, h]))
  const finals = finalRows(d.assignments)

  // 1 · לוח-שנה — על הזרוע בלבד; 9 · העוגנים הישנים מדווחים בנפרד.
  const onForbidden = (list) =>
    list.filter(
      (p) => p.project_status !== 'cancelled' && classifyDay(p.final_event_date, holidays).blocked,
    )
  const seededList = d.projects.filter((p) => seededProjects.has(p.project_id))
  const legacyList = d.projects.filter((p) => !seededProjects.has(p.project_id))
  const forbiddenSeeded = onForbidden(seededList)
  check(
    1,
    'אף אירוע זרוע לא בשבת/יום כיפור/חג/ט׳ באב',
    forbiddenSeeded.length === 0,
    `${seededList.length} פרויקטים זרועים · ${forbiddenSeeded.length} על יום חסום${forbiddenSeeded.length ? ' — ' + forbiddenSeeded.map((p) => `#${p.project_id} ${p.final_event_date}`).join(', ') : ''}`,
  )
  const forbiddenLegacy = onForbidden(legacyList)
  ;(forbiddenLegacy.length ? warn : ok)(
    9,
    'עוגני-העבר מול הלוח (פגם קיים, לא אילוץ על הזריעה)',
    `${legacyList.length} פרויקטים ישנים · ${forbiddenLegacy.length} על יום חסום${forbiddenLegacy.length ? ' — ' + forbiddenLegacy.map((p) => `#${p.project_id} ${p.final_event_date} (${classifyDay(p.final_event_date, holidays).reason})`).join(', ') : ''}`,
  )

  // 2 · שמונת הסטטוסים
  const statuses = [
    'not_started',
    'in_progress',
    'ready',
    'event_finished',
    'awaiting_invoice',
    'awaiting_payment',
    'finished',
    'cancelled',
  ]
  const statusCounts = Object.fromEntries(
    statuses.map((s) => [s, d.projects.filter((p) => p.project_status === s).length]),
  )
  check(
    2,
    'לכל אחד משמונת הסטטוסים ≥1 פרויקט',
    statuses.every((s) => statusCounts[s] > 0),
    statuses.map((s) => `${s}=${statusCounts[s]}`).join(' · '),
  )

  // 3 · מדרגות פיצוי-ביטול (§7.16) — שעות בין הביטול לתחילת האירוע
  const fullH = Number(param('שעות_פיצוי_ביטול_מלא'))
  const partH = Number(param('שעות_פיצוי_ביטול_חלקי'))
  const tiers = { over72: 0, between: 0, under24: 0, forceMajeure: 0 }
  for (const p of d.projects.filter((x) => x.project_status === 'cancelled' && x.cancelled_at)) {
    if (p.cancel_type === 'force_majeure') {
      tiers.forceMajeure += 1
      continue
    }
    const [h, m] = String(p.final_start_time ?? '00:00')
      .split(':')
      .map(Number)
    const hours =
      (Date.parse(atLocal(p.final_event_date, h, m)) - Date.parse(p.cancelled_at)) / 3_600_000
    if (hours > partH) tiers.over72 += 1
    else if (hours >= fullH) tiers.between += 1
    else tiers.under24 += 1
  }
  check(
    3,
    'לכל מדרגת פיצוי-ביטול ≥1 אירוע',
    Object.values(tiers).every((n) => n > 0),
    `>72ש׳=${tiers.over72} · 24–72=${tiers.between} · <24=${tiers.under24} · כוח-עליון=${tiers.forceMajeure}`,
  )

  // 4 · תוצאות-נוכחות
  const outcomes = {
    arrived: 0,
    late_light: 0,
    late_medium: 0,
    late_heavy: 0,
    no_show_ghosted: 0,
    no_show_sick: 0,
    no_show_approved: 0,
    approval_withdrawn: 0,
  }
  for (const a of finals) {
    if (a.assignment_status === 'approval_withdrawn') outcomes.approval_withdrawn += 1
    if (a.attendance_status === 'arrived') outcomes.arrived += 1
    if (a.attendance_status === 'late') outcomes[`late_${a.lateness_level}`] += 1
    if (a.attendance_status === 'no_show')
      outcomes[
        `no_show_${a.no_show_reason === 'approved_absence' ? 'approved' : a.no_show_reason}`
      ] += 1
  }
  check(
    4,
    'לכל תוצאת-נוכחות ≥1 שורה',
    Object.values(outcomes).every((n) => n > 0),
    Object.entries(outcomes)
      .map(([k, v]) => `${k}=${v}`)
      .join(' · '),
  )

  // 5 · שיבוץ לפני created_at של הדיילת
  const earlyOf = (list) =>
    list.filter((a) => {
      const h = hostessById.get(a.hostess_id)
      return h && a.event_date < h.created_at.slice(0, 10)
    })
  const seededAssignments = d.assignments.filter((a) => seededProjects.has(a.project_id))
  const early = earlyOf(seededAssignments)
  const earlyLegacy = earlyOf(d.assignments.filter((a) => !seededProjects.has(a.project_id)))
  check(
    5,
    'אף event_date זרוע לא לפני created_at של הדיילת',
    early.length === 0,
    `${seededAssignments.length} שיבוצים זרועים · ${early.length} מוקדמים מדי` +
      (earlyLegacy.length
        ? ` · ⚠️ ${earlyLegacy.length} שיבוצי-עבר ישנים מוקדמים מדי (פגם קיים: ${[...new Set(earlyLegacy.map((a) => `#${a.project_id}`))].join(', ')})`
        : ''),
  )

  // 6 · אפס חריגות בריצה — מהרשם
  if (run)
    check(
      6,
      'ריצת-הייצור הסתיימה בלי חריגות',
      run.completed && (run.errors?.length ?? 0) === 0,
      `completed=${run.completed} · errors=${run.errors?.length ?? 0} · calls=${run.calls ?? '?'}`,
    )
  else warn(6, 'ריצת-הייצור — אין רשם-ריצה (הרץ עם --batch)', '')

  // 7 · שיעור-אישור + שבע סיבות-דחייה
  const closedQuotes = d.quotes.filter(
    (q) =>
      seededQuotes.has(q.quote_id) &&
      q.quote_status !== 'in_progress' &&
      q.rejection_reason !== 'נפתחה בטעות',
  )
  const approvedCount = closedQuotes.filter((q) => q.quote_status === 'approved').length
  const rate = closedQuotes.length ? approvedCount / closedQuotes.length : null
  const reasons = [
    'מחיר',
    'חוסר זמינות/לו"ז',
    'נבחר מתחרה',
    'תקציב לקוח',
    'האירוע בוטל אצל הלקוח',
    'פג תוקף',
    'נפתחה בטעות',
  ]
  const reasonCounts = Object.fromEntries(
    reasons.map((r) => [r, d.quotes.filter((q) => q.rejection_reason === r).length]),
  )
  check(
    7,
    'שיעור-אישור 60–80% ושבע סיבות-דחייה קיימות',
    rate !== null && rate >= 0.6 && rate <= 0.8 && reasons.every((r) => reasonCounts[r] > 0),
    `שיעור=${rate === null ? '—' : Math.round(rate * 100) + '%'} על ${closedQuotes.length} · ${Object.entries(
      reasonCounts,
    )
      .map(([k, v]) => `${k}=${v}`)
      .join(' · ')}`,
  )

  // 8 · סריקת-עוגנים מכנית — smoke-anchors.json + מספרים בקובצי E2E
  const anchors = JSON.parse(readFileSync(resolve('e2e/smoke-anchors.json'), 'utf-8'))
  // 🔄 03/09/2026: העוגנים החיים (מדיטק · #6 · "כנס לקוחות שנתי" · דיילות-הדגמה · המספרים
  // הנעוצים בקובץ-הלקוח) נמחקו עם דמו-יולי בהכרעת-ישי והוחלפו בפיקסטורות בזמן-ריצה (§7א).
  // נשארו לסריקה רק עוגני קטלוג/פרמטרים/סכמה — שאינם מרקיבים — והפרויקט הידוע של מודול 8.
  const findings = []
  if (d.products.filter((p) => p.status === 'active').length !== anchors.prices.productCount)
    findings.push(
      `prices.productCount: ${d.products.filter((p) => p.status === 'active').length} ≠ ${anchors.prices.productCount}`,
    )
  const bReg = d.products.find((p) => p.sku === anchors.prices.sku)
  if (!bReg || Number(bReg.base_price) !== 6) findings.push('prices.basePrice של B-REG-TAG זז')
  if (Number(d.costs.find((c) => c.sku === anchors.prices.sku)?.cost) !== 2.5)
    findings.push('prices.cost של B-REG-TAG זז')
  if (d.tiers.filter((t) => t.sku === anchors.prices.sku).length !== 5)
    findings.push('prices.tiersButton (5 מדרגות) זז')
  if (String(vat) !== anchors.settings.vat)
    findings.push(`settings.vat: ${vat} ≠ ${anchors.settings.vat}`)
  if (new Set(d.params.map((p) => p.param_type)).size !== anchors.settings.groupCount)
    findings.push('settings.groupCount זז')
  for (const key of ['customers', 'quotes', 'projects'])
    if (anchors[key] && Object.keys(anchors[key]).length)
      findings.push(`smoke-anchors.json נועץ שוב ערך-דאטה תחת "${key}" — §7א אוסר`)
  const p12 = projectById.get(anchors.finance.knownProjectId)
  const tabOf = (s) =>
    s === 'awaiting_invoice'
      ? 'awaiting_invoice'
      : s === 'awaiting_payment'
        ? 'awaiting_payment'
        : s === 'cancelled'
          ? 'cancelled'
          : null
  // העוגן השבור-מראש (§א׳3) מדווח בנפרד — הוא לא נשבר על-ידי הזריעה, והתיקון שלו הוא של ישי.
  const knownBroken =
    !p12 || tabOf(p12.project_status) !== anchors.finance.knownProjectTab
      ? `finance.knownProjectTab: #${anchors.finance.knownProjectId} הוא ${p12?.project_status}, ה-JSON אומר ${anchors.finance.knownProjectTab}`
      : null
  const gotoIds = [
    ...readdirSync(resolve('e2e'))
      .filter((f) => f.endsWith('.spec.js'))
      .flatMap((f) =>
        [...readFileSync(resolve('e2e', f), 'utf-8').matchAll(/goto\('\/customers\/(\d+)'/g)].map(
          (m) => Number(m[1]),
        ),
      ),
  ]
  for (const id of new Set(gotoIds))
    if (!d.customers.some((c) => c.customer_id === id))
      findings.push(`E2E מנווט ל-/customers/${id} שאינו קיים`)
  ;(findings.length ? bad : ok)(
    8,
    'סריקת-עוגנים מכנית (smoke-anchors.json + e2e/*.spec.js)',
    findings.length
      ? findings.join(' | ')
      : `${Object.keys(anchors).filter((k) => !k.startsWith('_')).length} בלוקים ב-JSON (קטלוג/פרמטרים/סכמה בלבד) — כולם תואמים`,
  )

  if (knownBroken) warn('8׳', 'עוגן שבור-מראש (§א׳3) — תיקון של ישי, לא של הזריעה', knownBroken)

  // 10 · פיזור-העומס בין דיילות פעילות
  const activeIds = d.hostesses
    .filter((h) => h.status === 'active' && h.created_at.slice(0, 10) <= addDays(today, -90))
    .map((h) => h.hostess_id)
  // המדד: אירועים-לחודש-פעיל ב-12 החודשים האחרונים (חלון-החישוב של Smart Match) — ולא ספירה
  // גולמית, כי דיילת-גרעין שפעילה 32 חודשים צוברת יותר ממי שהצטרפה לפני חצי שנה בלי שזה
  // אומר דבר על הוגנות-השיבוץ. `הנחתי` על נוסח-המפרט.
  const windowStart = addDays(today, -365)
  const load = activeIds
    .map((id) => {
      const created = hostessById.get(id).created_at.slice(0, 10)
      const activeMonths = Math.min(
        12,
        Math.max(1, daysBetween(created > windowStart ? created : windowStart, today) / 30),
      )
      const events = finals.filter(
        (a) =>
          a.hostess_id === id &&
          a.assignment_status === 'finally_approved' &&
          a.event_date < today &&
          a.event_date >= windowStart &&
          projectById.get(a.project_id)?.project_status !== 'cancelled',
      ).length
      return Math.round((events / activeMonths) * 10) / 10
    })
    .sort((a, b) => a - b)
  const median = load.length ? load[Math.floor(load.length / 2)] : 0
  const idle = load.filter((n) => n === 0).length
  // `הנחתי` על נוסח-המפרט "רבעון-תחתון אינו ריק": לכל היותר רבע מהפעילות-הוותיקות בלי
  // אירוע אחד — כלומר בונוס-ההוגנות באמת מפזר, ולא רק "יש מישהי ברבעון".
  check(
    10,
    'אף דיילת פעילה מעל פי-3 מהחציון (אירועים/חודש-פעיל, 12 חודשים), ולכל היותר רבע בלי אירוע',
    load.length > 0 && median > 0 && Math.max(...load) <= 3 * median && idle <= load.length / 4,
    `n=${load.length} (פעילות שנוצרו לפני ≥90 יום) · חציון=${median}/חודש · בלי-אירוע=${idle} · מקסימום=${load.length ? Math.max(...load) : 0}/חודש`,
  )

  warn(11, 'npm run smoke + npm run test:e2e — מורצים ידנית, אינם ב-gate ולא ב-CI', 'ר׳ דוח-השלב')
  warn(12, 'gate עם VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= — מורץ ידנית', 'ר׳ דוח-השלב')

  // 13א · שורות-הגיבור המוחלטות
  const hero = []
  const byCustomer = (list, key = 'customer_id') =>
    list.reduce((m, x) => m.set(x[key], (m.get(x[key]) ?? 0) + 1), new Map())
  const quotesBy = byCustomer(d.quotes)
  const projectsBy = byCustomer(d.projects)
  const giant = d.customers.find(
    (c) => (quotesBy.get(c.customer_id) ?? 0) > 8 && (projectsBy.get(c.customer_id) ?? 0) > 8,
  )
  hero.push([
    `לקוח-ענק (>8 הצעות ו->8 פרויקטים)`,
    giant
      ? `${giant.company_name}: ${quotesBy.get(giant.customer_id)}/${projectsBy.get(giant.customer_id)}`
      : null,
  ])
  hero.push([
    'לקוח בלי הצעות',
    d.customers.find((c) => !quotesBy.has(c.customer_id))?.company_name ?? null,
  ])
  hero.push([
    'לקוח עם הצעות בלי פרויקטים',
    d.customers.find((c) => quotesBy.has(c.customer_id) && !projectsBy.has(c.customer_id))
      ?.company_name ?? null,
  ])
  const dormantDays = Number(param('סף_לקוח_רדום_ימים'))
  const dormant = d.customers.find((c) => {
    const mine = d.projects.filter(
      (p) => p.customer_id === c.customer_id && p.project_status !== 'cancelled',
    )
    if (!mine.length || mine.some((p) => p.final_event_date >= today)) return false
    const last = mine
      .map((p) => p.final_event_date)
      .sort()
      .at(-1)
    return daysBetween(last, today) > dormantDays
  })
  hero.push([`לקוח רדום (>${dormantDays} יום)`, dormant?.company_name ?? null])
  hero.push([
    'לקוח בארכיון עם הצעה פתוחה',
    d.customers.find(
      (c) =>
        c.status === 'inactive' &&
        d.quotes.some((q) => q.customer_id === c.customer_id && q.quote_status === 'in_progress'),
    )?.company_name ?? null,
  ])
  const contactCounts = byCustomer(d.contacts)
  hero.push([
    'לקוח עם 2+ אנשי-קשר',
    [...contactCounts.entries()].filter(([, n]) => n >= 2).length
      ? `${[...contactCounts.entries()].filter(([, n]) => n >= 2).length} לקוחות`
      : null,
  ])
  const noPrimary = d.customers.filter(
    (c) => !d.contacts.some((k) => k.customer_id === c.customer_id && k.is_primary),
  )
  hero.push(['לכל לקוח איש-קשר ראשי', noPrimary.length === 0 ? 'כולם' : null])
  const lowFeedback = d.customers.find((c) => {
    const scores = d.projects
      .filter(
        (p) =>
          p.customer_id === c.customer_id &&
          p.feedback_status === 'completed' &&
          p.feedback_score !== null,
      )
      .map((p) => p.feedback_score)
    return (
      scores.length &&
      scores.reduce((s, x) => s + x, 0) / scores.length < Number(param('סף_שביעות_רצון'))
    )
  })
  hero.push(['לקוח עם ממוצע-משוב מתחת לסף ("טעון בירור")', lowFeedback?.company_name ?? null])
  hero.push([
    'לקוח עם פרויקט מבוטל',
    d.customers.find((c) =>
      d.projects.some((p) => p.customer_id === c.customer_id && p.project_status === 'cancelled'),
    )?.company_name ?? null,
  ])
  const types = ['private_company', 'government', 'production_company', 'nonprofit']
  hero.push([
    'אחד מכל ארבעת סוגי-הלקוח',
    types.every((t) => d.customers.some((c) => c.customer_type === t)) ? 'כולם' : null,
  ])
  const tierCross = d.quotes.find((q) =>
    q.quote_services.some((l) =>
      d.tiers.some(
        (t) => t.sku === l.sku && Number(t.min_qty) > 1 && Number(l.qty) >= Number(t.min_qty),
      ),
    ),
  )
  hero.push([
    'הצעה שחוצה מדרגת-מחיר (qty ≥ min_qty של מדרגה)',
    tierCross ? `#${tierCross.quote_id}` : null,
  ])
  hero.push([
    'הצעה עם הנחה ידנית',
    d.quotes.find((q) => Number(q.manual_discount) > 0) ? 'יש' : null,
  ])
  hero.push([
    'הצעה עם הנחת-לקוח',
    d.quotes.find((q) => Number(q.applied_customer_discount) > 0) ? 'יש' : null,
  ])
  const logByProject = d.logistics.reduce(
    (m, l) => m.set(l.project_id, [...(m.get(l.project_id) ?? []), l]),
    new Map(),
  )
  const activeFuture = d.projects.filter(
    (p) =>
      ['not_started', 'in_progress', 'ready'].includes(p.project_status) &&
      p.final_event_date >= today,
  )
  const staffed = (p) =>
    finals.filter(
      (a) => a.project_id === p.project_id && a.assignment_status === 'finally_approved',
    ).length >= p.required_hostess_count
  const logisticsDone = (p) =>
    (logByProject.get(p.project_id) ?? []).every((l) => l.item_status === 'ready')
  hero.push([
    'צמד מ7: שיבוץ מלא + לוגיסטיקה חסרה',
    activeFuture.find((p) => staffed(p) && !logisticsDone(p)) ? 'יש' : null,
  ])
  hero.push([
    'צמד מ7: לוגיסטיקה מלאה + שיבוץ חסר',
    activeFuture.find(
      (p) => !staffed(p) && logisticsDone(p) && (logByProject.get(p.project_id) ?? []).length > 0,
    )
      ? 'יש'
      : null,
  ])
  hero.push([
    'אירוע-פער בתוך 14 יום',
    activeFuture.find((p) => !staffed(p) && daysBetween(today, p.final_event_date) <= 14)
      ? 'יש'
      : null,
  ])
  hero.push([
    'אירוע-פער מעבר ל-14 יום',
    activeFuture.find((p) => !staffed(p) && daysBetween(today, p.final_event_date) > 14)
      ? 'יש'
      : null,
  ])
  hero.push([
    'אירוע שנתי חוזר (אותו לקוח, אותו שם, שנים שונות)',
    (() => {
      const seen = new Map()
      for (const p of d.projects) {
        const k = `${p.customer_id}|${p.event_name}`
        seen.set(k, new Set([...(seen.get(k) ?? []), p.final_event_date.slice(0, 4)]))
      }
      const hit = [...seen.entries()].find(([, years]) => years.size >= 2)
      return hit ? hit[0].split('|')[1] : null
    })(),
  ])
  const missingHero = hero.filter(([, v]) => !v)
  ;(missingHero.length ? bad : ok)(
    '13א',
    'שורות-הגיבור המוחלטות',
    missingHero.length
      ? 'חסר: ' + missingHero.map(([k]) => k).join(' · ')
      : hero.map(([k, v]) => `${k}: ${v}`).join(' | '),
  )
  warn(
    '13א׳',
    'שתי שורות-גיבור שאינן ניתנות לייצור בלי לשנות קטלוג (§6 אוסר)',
    '"עלות לא-ידועה" (create_quote מסרב למוצר בלי עלות) · "מוצר מושבת על שורה קיימת" (אין מוצר מושבת) — ממצא על המצב, לא שורה שנשתלה',
  )
  check(
    '13א״',
    'סיבות-דחייה: כל השבע',
    reasons.every((r) => reasonCounts[r] > 0),
    Object.entries(reasonCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' · '),
  )
  // 15 נבדק למעלה כחלק מ-13א (אירוע שנתי חוזר).
  ;(hero.find(([k]) => k.startsWith('אירוע שנתי'))[1] ? ok : bad)(
    15,
    'אירוע שנתי חוזר',
    hero.find(([k]) => k.startsWith('אירוע שנתי'))[1] ?? 'אין',
  )

  // 13ב · תלוי-זמן
  const validityDays = Number(param('ימי_תוקף_הצעה'))
  const warnDays = Number(param('ימי_אזהרה_הצעה_פגה'))
  const eventWarn = Number(param('ימי_אזהרה_קדם_אירוע'))
  const amberBd = Number(param('סף_לוגיסטיקה_ימי_עסקים'))
  const openQuotes = d.quotes.filter((q) => q.quote_status === 'in_progress')
  const expiringSoon = openQuotes.filter(
    (q) => validityDays - daysBetween(q.updated_at.slice(0, 10), today) <= warnDays,
  ).length
  const eventSoon = openQuotes.filter(
    (q) =>
      daysBetween(today, q.estimated_event_date) >= 0 &&
      daysBetween(today, q.estimated_event_date) <= eventWarn,
  ).length
  const late = d.logistics.filter(
    (l) =>
      l.item_status === 'ordered' &&
      l.expected_arrival_date &&
      l.expected_arrival_date < today &&
      !l.actual_arrival_date &&
      activeFuture.some((p) => p.project_id === l.project_id),
  ).length
  const physicalSoon = activeFuture.filter(
    (p) =>
      businessDaysBetween(today, p.final_event_date) <= amberBd &&
      (logByProject.get(p.project_id) ?? []).some(
        (l) =>
          l.item_status === 'not_started' &&
          d.products.find((x) => x.sku === l.sku)?.category !== 'site',
      ),
  ).length
  ;(expiringSoon > 0 ? ok : warn)(
    '13ב',
    '"פגה בקרוב" — מגבלה מוצהרת: updated_at אינו ניתן לזריעה',
    `${expiringSoon} הצעות פתוחות בתוך ${warnDays} ימי-אזהרה מתוך ${openQuotes.length} פתוחות (נדלק טבעית ~${validityDays - warnDays} ימים אחרי הזריעה)`,
  )
  check(
    '13ב׳',
    '"אירוע קרוב" + שני טריגרי-הענבר',
    eventSoon > 0 && late > 0 && physicalSoon > 0,
    `אירוע-קרוב=${eventSoon} · משלוח-שאיחר=${late} · לא-הוזמן-בתוך-הסף=${physicalSoon}`,
  )

  // 14 · זמן-ההקדמה
  const leads = { long: 0, medium: 0, short: 0 }
  for (const q of d.quotes.filter((x) => seededQuotes.has(x.quote_id))) {
    const lead = daysBetween(q.created_at.slice(0, 10), q.estimated_event_date)
    if (lead >= 60) leads.long += 1
    else if (lead >= 21) leads.medium += 1
    else if (lead >= 7) leads.short += 1
  }
  check(
    14,
    'התפלגות זמן-ההקדמה (2–6 חודשים · 3–8 שבועות · 1–3 שבועות)',
    Object.values(leads).every((n) => n > 0),
    `≥60י׳=${leads.long} · 21–59=${leads.medium} · 7–20=${leads.short}`,
  )

  // תוספת §י״א4 — בדיקת-קבלה של רווח גולמי, אחרי הריצה, לעולם לא קלט.
  const finishedSeeded = d.projects.filter(
    (p) => seededProjects.has(p.project_id) && p.project_status === 'finished',
  )
  const profits = finishedSeeded
    .map((p) => Number(d.finance.find((f) => f.project_id === p.project_id)?.final_profit))
    .filter(Number.isFinite)
  const avgProfit = profits.length ? profits.reduce((s, x) => s + x, 0) / profits.length : null
  const months = new Set(finishedSeeded.map((p) => p.final_event_date.slice(0, 7))).size
  ;(avgProfit !== null && avgProfit > 0 ? ok : warn)(
    'י״א4',
    'רווח גולמי ממוצע לאירוע (finished, מ-project_finance) — בדיקת-שפיות בלבד',
    avgProfit === null
      ? 'אין פרויקטים סגורים'
      : `ממוצע ${fmt(avgProfit)} על ${profits.length} פרויקטים · ${Math.round(profits.length / Math.max(1, months))} לחודש · סה"כ חודשי ≈ ${fmt((avgProfit * profits.length) / Math.max(1, months))}`,
  )

  // Smart Match — חמשת הפרופילים קיימים ופעילים, עם היסטוריה שונה (הבדיקה הכמותית בדוח).
  const profiles = ['עדן ברזילי', 'ליאן אוחנה', 'שלי אלקיים', 'מיקה סופר', 'גפן שמואלי']
  const profileRows = profiles.map((name) => {
    const h = d.hostesses.find((x) => x.full_name === name)
    if (!h) return `${name}: חסרה`
    const mine = finals.filter((a) => a.hostess_id === h.hostess_id)
    const answered = mine.filter((a) =>
      ['confirmed_available', 'finally_approved', 'declined'].includes(a.assignment_status),
    ).length
    const yes = mine.filter((a) =>
      ['confirmed_available', 'finally_approved'].includes(a.assignment_status),
    ).length
    const noShow = mine.filter((a) => a.attendance_status === 'no_show').length
    const late = mine.filter((a) => a.attendance_status === 'late').length
    return `${name}: ענתה ${yes}/${answered} · הבריזה ${noShow} · איחרה ${late} · ${h.status}`
  })
  check(
    'SM',
    'חמשת פרופילי Smart Match קיימים',
    profiles.every((n) => d.hostesses.some((h) => h.full_name === n && h.status === 'active')),
    profileRows.join(' | '),
  )
  void seededHostesses
  void d.preferences

  // ── פלט ──
  const failed = results.filter((r) => r.status === '❌').length
  for (const r of results)
    console.log(`${r.status} ${String(r.n).padEnd(4)} ${r.title}\n      ${r.detail}`)
  console.log(
    `\n${results.length} טענות · ${failed} נכשלו · ${results.filter((r) => r.status === '⚠️').length} תזכורות/מגבלות · היום ${today}${run ? ` · אצווה ${run.batch}` : ''}`,
  )
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(`✗ ${error.message}`)
  process.exit(1)
})
