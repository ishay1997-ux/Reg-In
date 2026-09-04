// המתכנן של גנרטור נתוני-ההדגמה — **טהור לחלוטין: בלי Supabase, בלי שעון, בלי קבצים.**
// מקבל תיאור של המסד הקיים (מה שאסור לגעת בו) ומחזיר **תוכנית** — כל לקוח, דיילת, הצעה,
// פרויקט, שיבוץ ופריט-לוגיסטיקה, עם כל תאריך וסטטוס — לפני שנכתבת שורה אחת.
//
// 🔑 למה מתכנן נפרד מהכותב (`demo-seed.mjs`):
//   ‏① ‏`seed-data-spec.md §ו׳2` — "מכוון, לא הסתברותי": שורות-הגיבור (§ה׳) חייבות להתקיים,
//      ואי-אפשר להבטיח זאת תוך-כדי כתיבה למסד; מבטיחים על התוכנית, ואז כותבים.
//   ‏② בדיקות-יחידה על תוכנית שלמה (`plan.test.mjs`) — תקרת-3/יום, אף אירוע בשבת/חג, אף
//      שיבוץ לפני `created_at` של הדיילת — רצות ב-`npm run gate` בלי מסד.
//   ‏③ ‏`--plan` מדפיס את התוכנית לפני ההרצה: ישי רואה מספרים לפני שנכתב משהו.
//
// 🔴 מה המתכנן **לא** מחליט: מחירי-קטלוג ועלויות (נקראים מהמסד החיים, §6 בפרומפט), הסף
// של שכר-המינימום, ומספר-הפרויקט של #8 — כולם קלט, לא פלט.

import { createRng, hashSeed } from './prng.mjs'
import {
  addDays,
  atLocal,
  buildHolidayMap,
  businessDaysBetween,
  classifyDay,
  daysBetween,
  eachDay,
  lastDayOfMonth,
  monthKey,
  weekdayIndex,
} from './calendar.mjs'
import {
  BANKS,
  CANCEL_REASONS,
  CITIES,
  COMPANY_NAMES,
  COMPANY_SLUGS,
  EVENT_TEMPLATES,
  FEEDBACK_NOTES,
  FIRST_NAMES_F,
  FIRST_NAMES_F_ASCII,
  FIRST_NAMES_M,
  LANGUAGES,
  LAST_NAMES,
  LAST_NAMES_ASCII,
  SEED_FEEDBACK_NEGATIVE_REASONS,
  SEED_FEEDBACK_POSITIVE_REASONS,
  STREETS,
  VENUES,
} from './names.mjs'

// ── פרמטרי-הנפח (§ג׳ במפרט) ─────────────────────────────────────────────────
// כולם `הנחתי` בהאצלת-ישי ("תניח הנחות הגיוניות וסגור את זה", 03/09/2026), מלבד
// התקרה (3/יום — במילותיו) והחלון (01/01/2024 — במילותיו).
export const VOLUME = {
  baseStart: 12, // אירועים/חודש בתחילת החלון
  baseEnd: 38, // אירועים/חודש היום
  noiseStdDev: 0.12, // רעש סביב הקו (~±15% ברוב החודשים)
  momentum: 0.5, // "חודש טוב גורר חודש סביר" (§ו׳3 ①)
  dayCap: 3, // תקרת אירועים ביום, בכל החלון (ישי)
  approvalRate: 0.7, // שיעור-אישור יעד (60–80%, §ה׳)
  cancelRate: 0.05, // שיעור-ביטול של פרויקטים היסטוריים
  activeHostessesNow: 50, // גודל-המאגר הפעיל (ישי: "50 דיילות")
}

// עונתיות עסקית לפי חודש לועזי — הטבלה הסגורה של §ג׳. תשרי ופסח נחסמים בפועל דרך הלוח
// (§ב׳), והמכפילים כאן רק מדללים את הימים שסביבם.
export const SEASONALITY = {
  1: 1.1,
  2: 1.1,
  3: 1.1,
  4: 0.65,
  5: 1.1,
  6: 1.1,
  7: 0.65,
  8: 0.7,
  9: 1.2,
  10: 0.6,
  11: 1.2,
  12: 1.3,
}

// שינוי-מחירים לאורך החלון (§ה׳2 #4 — "המחירים חייבים לנוע"). ~3% לשנה, `הנחתי`.
export const PRICE_DRIFT = { 2024: 0.94, 2025: 0.97, 2026: 1.0 }

// מע"מ בישראל: 17% עד 31/12/2024, 18% מ-01/01/2025 (עובדה ציבורית).
export function vatRateFor(iso) {
  return String(iso) < '2025-01-01' ? 17 : 18
}

const REJECTION_WEIGHTS = [
  { value: 'מחיר', weight: 30 },
  { value: 'נבחר מתחרה', weight: 20 },
  { value: 'תקציב לקוח', weight: 15 },
  { value: 'חוסר זמינות/לו"ז', weight: 10 },
  { value: 'האירוע בוטל אצל הלקוח', weight: 10 },
  { value: 'פג תוקף', weight: 9 },
  { value: 'נפתחה בטעות', weight: 4 },
  { value: 'אחר', weight: 2 },
]

const TAG_SKUS = ['REG-TAG', 'B-REG-TAG', 'ECO-TAG', 'B-ECO-TAG']
const LANYARD_SKUS = ['FAB-LAN', 'B-FAB-LAN', 'SAT-LAN', 'B-SAT-LAN']
const COLORS = ['לבן', 'שחור', 'אפור', 'טורקיז', 'כחול']

// ── עזרים ────────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100
}

function pad(n, width) {
  return String(n).padStart(width, '0')
}

function phone(rng) {
  return `05${rng.int(0, 8)}-${pad(rng.int(1000000, 9999999), 7)}`
}

// מחיר-יחידה לפי מדרגות — אותו כלל כמו `resolveUnitPrice` ב-`src/lib/pricing.js`
// (המדרגה עם `min_qty` הגבוה ביותר שאינו עולה על הכמות).
function unitPrice(catalog, sku, qty) {
  const product = catalog.products.find((p) => p.sku === sku)
  const candidates = catalog.tiers.filter((t) => t.sku === sku && Number(t.min_qty) <= qty)
  if (candidates.length === 0) return Number(product.base_price)
  const winner = candidates.reduce((a, b) => (Number(b.min_qty) > Number(a.min_qty) ? b : a))
  return Number(winner.special_price)
}

function driftedPrice(price, iso, category) {
  const drift = PRICE_DRIFT[Number(String(iso).slice(0, 4))] ?? 1
  const value = price * drift
  // שירותים (משמרת/אתר) במחיר עגול, מוצרים באגורות — כך ההצעה נראית כמו שמנהלת כותבת.
  return category === 'product' ? round2(value) : Math.round(value)
}

function hostessSku(startTime, hours) {
  return hours >= 5 || startTime >= '17:00' ? '06ST' : '04ST'
}

// ── לקוחות ───────────────────────────────────────────────────────────────────

const CUSTOMER_COUNTS = { private_company: 34, production_company: 12, government: 6, nonprofit: 4 }

function buildCustomers(rng, ctx) {
  const customers = []
  const usedNumbers = new Set(ctx.existing.companyNumbers)

  const nextCompanyNumber = (type) => {
    const prefix = type === 'nonprofit' ? '58' : type === 'government' ? '50' : '51'
    for (;;) {
      const candidate = `${prefix}${pad(rng.int(1000000, 9999999), 7)}`
      if (!usedNumbers.has(candidate)) {
        usedNumbers.add(candidate)
        return candidate
      }
    }
  }

  for (const [type, count] of Object.entries(CUSTOMER_COUNTS)) {
    const names = COMPANY_NAMES[type]
    const slugs = COMPANY_SLUGS[type]
    for (let i = 0; i < Math.min(count, names.length); i += 1) {
      customers.push({
        key: `c${customers.length + 1}`,
        company_name: names[i],
        slug: slugs[i],
        company_number: nextCompanyNumber(type),
        customer_type: type,
        discount_percent: discountFor(rng, type),
        marketing_consent: rng.chance(0.55),
        status: 'active',
        weight: 1.2,
        role: null,
        annualTemplate: null,
        contacts: [],
        firstAvailable: ctx.from,
      })
    }
  }

  // תפקידים (§ה׳ · מודול 2) — כל אחד שורת-גיבור שמסך תלוי בה.
  const byType = (type) => customers.filter((c) => c.customer_type === type && !c.role)
  const assign = (customer, role, patch = {}) => Object.assign(customer, { role, ...patch })

  assign(byType('private_company')[0], 'giant', { weight: 14 })
  assign(byType('private_company')[0], 'anchor', { weight: 4 })
  assign(byType('private_company')[0], 'anchor', { weight: 4 })
  assign(byType('production_company')[0], 'anchor', { weight: 4 })
  assign(byType('government')[0], 'anchor', { weight: 3 })
  assign(byType('private_company')[0], 'quotesNoProjects', { weight: 0.8 })
  assign(byType('nonprofit')[0], 'noQuotes', { weight: 0 })
  assign(byType('production_company')[0], 'lowFeedback', { weight: 1.5 })
  assign(byType('private_company')[0], 'dormant', { weight: 1.2 })
  assign(byType('private_company')[0], 'dormant', { weight: 1.2 })
  assign(byType('private_company')[0], 'archivedOpenQuote', { weight: 1, status: 'inactive' })

  // שאר הלקוחות: רובם מצטרפים במהלך החלון, לא כולם ביום הראשון.
  for (const c of customers) {
    if (c.role === 'giant' || c.role === 'anchor' || c.role === 'dormant') continue
    if (c.role === 'noQuotes') {
      c.firstAvailable = addDays(ctx.today, -rng.int(20, 400))
      continue
    }
    if (rng.chance(0.4)) c.firstAvailable = addDays(ctx.from, rng.int(30, ctx.pastDays - 120))
    if (rng.chance(0.35)) c.weight = 0.5
  }

  // אירועים שנתיים חוזרים (§ה׳2 #5): ענק + שני עוגנים.
  const annualCandidates = customers.filter((c) => c.role === 'giant' || c.role === 'anchor')
  for (const c of annualCandidates.slice(0, 3)) {
    const annual = EVENT_TEMPLATES[c.customer_type].filter((t) => t.annual)
    c.annualTemplate = { ...rng.pick(annual), month: rng.pick([2, 3, 5, 6, 9, 11, 12]) }
  }

  // אנשי-קשר: ראשי אחד תמיד (§ה׳ — "לכל לקוח is_primary אחד"), ו-12 לקוחות עם 2–3.
  const multi = rng.shuffle(customers).slice(0, 12)
  for (const c of customers) {
    const count = multi.includes(c) ? rng.int(2, 3) : 1
    for (let i = 0; i < count; i += 1) {
      const female = rng.chance(0.5)
      const first = female ? rng.pick(FIRST_NAMES_F) : rng.pick(FIRST_NAMES_M)
      const last = rng.pick(LAST_NAMES)
      c.contacts.push({
        contact_name: `${first} ${last}`,
        phone: phone(rng),
        email: `${c.slug.replace(/-/g, '.')}${i === 0 ? '' : i + 1}@${c.slug}.co.il`,
        is_primary: i === 0,
      })
    }
  }
  return customers
}

function discountFor(rng, type) {
  if (type === 'production_company') return rng.pick([5, 8, 10, 12, 15])
  if (type === 'private_company') return rng.chance(0.3) ? rng.pick([3, 5]) : 0
  if (type === 'nonprofit') return rng.chance(0.5) ? 5 : 0
  return 0
}

// ── דיילות ───────────────────────────────────────────────────────────────────

// חמשת הפרופילים של Smart Match (§ה׳ · מודול 4, בקשת-ישי: "לראות את ההבדלים באלגוריתם
// איך הוא משתנה לפי זווית"). המרחקים מול אקספו ת"א (32.1063/34.8102) — האולם של #8.
const SMART_MATCH_PROFILES = [
  {
    profile: 'near_unreliable',
    full_name: 'עדן ברזילי',
    city: 'תל אביב',
    lat: 32.0853,
    lng: 34.7818,
    has_car: true,
    hourly_rate: 44,
    declineRate: 0.1,
    attendance: { arrived: 0.35, late_heavy: 0.3, no_show: 0.35 },
    responseHours: [2, 24],
    startOffsetDays: -400,
  },
  {
    profile: 'far_perfect',
    full_name: 'ליאן אוחנה',
    city: 'חדרה',
    lat: 32.4341,
    lng: 34.9197,
    has_car: true,
    hourly_rate: 46,
    declineRate: 0.0,
    attendance: { arrived: 1 },
    responseHours: [1, 6],
    startOffsetDays: -420,
  },
  {
    profile: 'new_no_history',
    full_name: 'שלי אלקיים',
    city: 'רמת גן',
    lat: 32.0823,
    lng: 34.8138,
    has_car: false,
    hourly_rate: 40,
    declineRate: 0,
    attendance: { arrived: 1 },
    responseHours: [1, 6],
    startOffsetDays: -12,
    noHistory: true,
  },
  {
    profile: 'balanced',
    full_name: 'מיקה סופר',
    city: 'פתח תקווה',
    lat: 32.0878,
    lng: 34.8878,
    has_car: true,
    hourly_rate: 45,
    declineRate: 0.2,
    attendance: { arrived: 0.85, late_light: 0.15 },
    responseHours: [3, 30],
    startOffsetDays: -380,
  },
  {
    profile: 'fast_irregular',
    full_name: 'גפן שמואלי',
    city: 'הרצליה',
    lat: 32.1663,
    lng: 34.8436,
    has_car: true,
    hourly_rate: 43,
    declineRate: 0.05,
    attendance: { arrived: 0.4, late_medium: 0.25, sick: 0.15, withdrew: 0.2 },
    responseHours: [0.2, 1.5],
    startOffsetDays: -360,
  },
]

function buildHostesses(rng, ctx) {
  const usedIds = new Set(ctx.existing.idNumbers)
  const usedNames = new Set(ctx.existing.hostesses.map((h) => h.full_name))
  const hostesses = []

  const nextIdNumber = () => {
    for (;;) {
      const candidate = `2${pad(rng.int(10000000, 99999999), 8)}`
      if (!usedIds.has(candidate)) {
        usedIds.add(candidate)
        return candidate
      }
    }
  }
  const nextName = () => {
    for (;;) {
      const fi = rng.int(0, FIRST_NAMES_F.length - 1)
      const li = rng.int(0, LAST_NAMES.length - 1)
      const name = `${FIRST_NAMES_F[fi]} ${LAST_NAMES[li]}`
      if (!usedNames.has(name)) {
        usedNames.add(name)
        return { name, ascii: `${FIRST_NAMES_F_ASCII[fi]}.${LAST_NAMES_ASCII[li]}` }
      }
    }
  }

  const pushHostess = (base) => {
    const city = base.cityRow ?? rng.weighted(CITIES.map((c) => ({ weight: c.weight, value: c })))
    const idNumber = nextIdNumber()
    const languages = ['עברית']
    for (const lang of LANGUAGES) {
      if (lang.value !== 'עברית' && rng.chance(lang.weight / 100)) languages.push(lang.value)
    }
    const bank = rng.pick(BANKS)
    hostesses.push({
      key: `h${hostesses.length + 1}`,
      id_number: idNumber,
      city: city.name,
      address: `${rng.pick(STREETS)} ${rng.int(2, 120)}, ${city.name}`,
      lat: round2(city.lat + rng.float(-0.02, 0.02)) + rng.int(0, 99) / 10000,
      lng: round2(city.lng + rng.float(-0.02, 0.02)) + rng.int(0, 99) / 10000,
      has_car: rng.chance(0.55),
      hourly_rate: rng.weighted([
        { weight: 3, value: 38 },
        { weight: 6, value: 40 },
        { weight: 8, value: 42 },
        { weight: 8, value: 44 },
        { weight: 6, value: 45 },
        { weight: 5, value: 46 },
        { weight: 4, value: 48 },
        { weight: 2, value: 50 },
        { weight: 1, value: 52 },
      ]),
      rating: rng.chance(0.3)
        ? null
        : rng.weighted([
            { weight: 2, value: 3 },
            { weight: 5, value: 4 },
            { weight: 4, value: 5 },
          ]),
      languages,
      bank: {
        bank_name: bank[0],
        bank_branch: bank[1],
        bank_account: String(rng.int(100000, 999999)),
      },
      phone: phone(rng),
      declineRate: 0.15,
      attendance: null,
      responseHours: [1, 36],
      fade: false,
      profile: null,
      ...base,
    })
    return hostesses.at(-1)
  }

  // חמשת הפרופילים — נעולים בשם, במיקום ובהתנהגות.
  for (const p of SMART_MATCH_PROFILES) {
    const { startOffsetDays, noHistory, ...rest } = p
    const start = addDays(ctx.today, startOffsetDays)
    pushHostess({
      ...rest,
      cityRow: { name: p.city, lat: p.lat, lng: p.lng },
      email: `${p.profile.replace(/_/g, '.')}@regin-hostesses.co.il`,
      start,
      end: null,
      noHistory: Boolean(noHistory),
    })
  }

  // המאגר: ~160 אנשים על פני החלון, תוחלת-חיים קצרה (§ד׳ — "דיילות מתחלפות כל הזמן").
  const total = Math.round(160 * ctx.scale)
  for (let i = 0; i < total; i += 1) {
    const { name, ascii } = nextName()
    const core = rng.chance(0.08)
    // תאריך-הצטרפות לעולם לא אחרי היום — דיילת "שתצטרף באוקטובר" אינה קוהרנטית על מסך שמוצג היום.
    const start = core
      ? addDays(ctx.from, -rng.int(0, 400))
      : addDays(ctx.from, rng.int(-60, ctx.pastDays - 1))
    let end = null
    if (!core) {
      const duration = rng.chance(0.75) ? rng.int(60, 330) : rng.int(330, 800)
      end = addDays(start, duration)
      if (end >= ctx.today) end = null
    }
    pushHostess({
      full_name: name,
      email: `${ascii}${rng.int(1, 99)}@gmail.com`,
      start,
      end,
      fade: end !== null && rng.chance(0.4),
      declineRate: rng.float(0.05, 0.3),
    })
  }

  // מכוונים את מספר הפעילות-היום לגודל-המאגר של ישי (50 כולל הקיימות שאינן דמו).
  const existingActive = ctx.existing.hostesses.length
  const target = Math.max(5, Math.round(VOLUME.activeHostessesNow * ctx.scale) - existingActive)
  const activeNow = hostesses.filter((h) => h.end === null && !h.profile)
  const extra = activeNow.length - (target - SMART_MATCH_PROFILES.length)
  if (extra > 0) {
    const toEnd = rng.shuffle(activeNow).slice(0, extra)
    for (const h of toEnd) {
      h.end = addDays(ctx.today, -rng.int(15, 240))
      if (h.end <= h.start) h.end = addDays(h.start, 45)
      h.fade = rng.chance(0.4)
    }
  }

  // אי-זמינות מוצהרת: כמה מהפעילות.
  for (const h of hostesses) {
    if (h.end === null && !h.profile && rng.chance(0.12)) {
      const from = addDays(ctx.today, rng.int(3, 60))
      h.unavailability = {
        start_date: from,
        end_date: addDays(from, rng.int(2, 12)),
        note: rng.pick(['חופשה', 'מילואים', 'מבחנים', null]),
      }
    }
  }
  return hostesses
}

// ── נפח: כמה אירועים בכל יום ─────────────────────────────────────────────────

function monthTargets(rng, ctx) {
  const targets = new Map()
  let noise = 0
  let index = 0
  const pastMonths = Math.max(1, ctx.pastMonthKeys.length - 1)
  for (const key of ctx.monthKeys) {
    const month = Number(key.slice(5, 7))
    const growth = Math.min(1, index / pastMonths)
    const base = VOLUME.baseStart + (VOLUME.baseEnd - VOLUME.baseStart) * growth
    noise = VOLUME.momentum * noise + rng.gauss(0, VOLUME.noiseStdDev)
    const noiseFactor = 1 + Math.max(-0.3, Math.min(0.3, noise))
    const monthsAhead = ctx.monthsAhead(key)
    const futureFactor =
      monthsAhead <= 0 ? 1 : monthsAhead === 1 ? 0.9 : monthsAhead === 2 ? 0.45 : 0
    // היעד של §ג׳ הוא **אירועים שהתקיימו** (פרויקטים); ההצעות רבות יותר בשיעור-הדחייה.
    const quotesPerProject = 1 / VOLUME.approvalRate
    targets.set(
      key,
      base * quotesPerProject * SEASONALITY[month] * noiseFactor * futureFactor * ctx.scale,
    )
    index += 1
  }
  return targets
}

function dayCounts(rng, ctx, targets) {
  const counts = new Map()
  for (const key of ctx.monthKeys) {
    const days = [...eachDay(`${key}-01`, lastDayOfMonth(key))]
    const classes = days.map((iso) => classifyDay(iso, ctx.holidays))
    const weightSum = classes.reduce((sum, c) => sum + c.density, 0)
    if (weightSum === 0) continue
    const target = targets.get(key)
    // ימי-אמצע-שבוע צפופים יותר (ג׳–ד׳ שיא, א׳ פחות) — טעם, לא מדידה. `הנחתי`.
    const weekdayBias = { 0: 0.8, 1: 1, 2: 1.15, 3: 1.15, 4: 0.95, 5: 1, 6: 0 }
    days.forEach((iso, i) => {
      if (classes[i].blocked) return
      const expected = (target * classes[i].density * weekdayBias[weekdayIndex(iso)]) / weightSum
      let count = Math.floor(expected) + (rng.chance(expected - Math.floor(expected)) ? 1 : 0)
      // אירועים היסטוריים אחרי היום — רק אם ההצעה שלהם יכולה כבר להתקיים (מוגבל למטה).
      const legacy = ctx.existing.legacyEventDates[iso] ?? 0
      count = Math.min(count, VOLUME.dayCap - legacy)
      if (count > 0) counts.set(iso, count)
    })
  }
  return counts
}

// ── אירועים ──────────────────────────────────────────────────────────────────

const SIZE_GUESTS = { small: [40, 100], medium: [100, 300], big: [300, 600] }
const LEAD_DAYS = { small: [7, 21], medium: [21, 56], big: [60, 180] }

function pickTemplate(rng, customer, month) {
  const list = EVENT_TEMPLATES[customer.customer_type].filter(
    (t) => !t.months || t.months.includes(month),
  )
  return rng.pick(list)
}

function eventTimes(rng, size) {
  const kind = rng.weighted([
    { weight: size === 'big' ? 6 : 3, value: 'day' },
    { weight: 4, value: 'evening' },
    { weight: size === 'small' ? 1 : 2, value: 'gala' },
  ])
  if (kind === 'day')
    return {
      start: rng.pick(['08:00', '08:30', '09:00']),
      end: rng.pick(['15:00', '16:00', '17:00']),
    }
  if (kind === 'evening')
    return {
      start: rng.pick(['17:00', '18:00', '18:30']),
      end: rng.pick(['21:00', '22:00', '23:00']),
    }
  return { start: rng.pick(['19:00', '20:00']), end: rng.pick(['00:00', '01:00']) }
}

function hoursOf(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = eh + em / 60 - (sh + sm / 60)
  return diff > 0 ? diff : diff + 24
}

function buildLines(rng, ctx, { guests, date, size, hostessCount, start, hours }) {
  const lines = []
  const push = (sku, qty, color = null) => {
    const product = ctx.catalog.products.find((p) => p.sku === sku)
    lines.push({
      sku,
      qty,
      closing_unit_price: driftedPrice(unitPrice(ctx.catalog, sku, qty), date, product.category),
      color,
      notes: '',
    })
  }
  // 🔴 הכרעת-ישי 03/09/2026 (היגיון עסקי, לא אילוץ-מסד): "בכל אירוע חייב לפחות פריט של תגים
  // ושרוכים ודיילת אחת לפחות" — כל הצעה נושאת את שלוש השורות, תמיד.
  push(hostessSku(start, hours), hostessCount)
  push(
    rng.pick(TAG_SKUS),
    Math.ceil((guests * rng.float(1.0, 1.15)) / 10) * 10,
    rng.chance(0.6) ? rng.pick(COLORS) : null,
  )
  push(
    rng.pick(LANYARD_SKUS),
    Math.ceil((guests * rng.float(1.0, 1.1)) / 10) * 10,
    rng.chance(0.5) ? rng.pick(COLORS) : null,
  )
  if ((size === 'big' && rng.chance(0.35)) || (size === 'medium' && rng.chance(0.1)))
    push('01WEB', 1)
  return lines
}

function buildEvents(rng, ctx, customers, counts) {
  const events = []
  const customerFor = (iso) => {
    const options = customers
      .filter((c) => c.firstAvailable <= iso && c.weight > 0)
      .filter((c) => c.role !== 'dormant' || iso <= addDays(ctx.today, -240))
      .filter((c) => c.role !== 'archivedOpenQuote' || iso <= addDays(ctx.today, -100))
      .map((c) => ({ weight: c.weight, value: c }))
    return rng.weighted(options)
  }

  const addEvent = (iso, customer, template) => {
    const month = Number(iso.slice(5, 7))
    const tpl = template ?? pickTemplate(rng, customer, month)
    const size = tpl.size
    const guests = Math.round(rng.int(...SIZE_GUESTS[size]) / 10) * 10
    const { start, end } = eventTimes(rng, size)
    const hours = hoursOf(start, end)
    const hostessCount = Math.max(
      1,
      Math.ceil(guests / ctx.catalog.ratio) + (rng.chance(0.2) ? 1 : 0),
    )
    const lead = rng.int(...LEAD_DAYS[size])
    const quoteCreated = addDays(iso, -lead)
    const venue = rng.pick(
      VENUES.filter((v) => v.size === size || (size === 'medium' && v.size === 'big')),
    )
    events.push({
      key: `e${events.length + 1}`,
      customerKey: customer.key,
      event_name: tpl.annual ? tpl.name : tpl.name,
      annual: Boolean(tpl.annual),
      date: iso,
      start,
      end,
      hours,
      guests,
      size,
      hostessCount,
      venue,
      lines: buildLines(rng, ctx, { guests, date: iso, size, hostessCount, start, hours }),
      manual_discount: rng.chance(0.12) ? rng.pick([5, 10]) : 0,
      notes: rng.chance(0.3)
        ? rng.pick([
            'כולל הקמה ופירוק.',
            'חניה לצוות באחריות הלקוח.',
            'הלקוח ביקש תגים ממותגים.',
            'יש להגיע שעה לפני פתיחת הדלתות.',
          ])
        : '',
      quoteCreated,
      leadDays: lead,
    })
    return events.at(-1)
  }

  // אירועים שנתיים חוזרים — קודם, כדי שיתפסו את יומם.
  for (const c of customers.filter((x) => x.annualTemplate)) {
    for (const key of ctx.monthKeys) {
      if (Number(key.slice(5, 7)) !== c.annualTemplate.month) continue
      const day = pickOpenDay(rng, ctx, counts, key)
      if (!day) continue
      counts.set(day, (counts.get(day) ?? 0) + 1)
      addEvent(day, c, c.annualTemplate)
    }
  }

  for (const [iso, count] of [...counts.entries()].sort()) {
    const already = events.filter((e) => e.date === iso).length
    for (let i = already; i < count; i += 1) {
      const customer = customerFor(iso)
      if (customer) addEvent(iso, customer)
    }
  }

  // הצעה לאירוע עתידי חייבת להתקיים כבר היום — אחרת אין לה מקום במסד. אירועים עתידיים
  // שהובלת-הזמן שלהם הייתה מותירה אותם בלי הצעה מקבלים הצעה שנוצרה בשבועות האחרונים
  // (כך אוקטובר מלא, כפי שישי ביקש סביב 15/10, ובלי לזייף הצעה שנוצרה "מחר").
  for (const e of events) {
    if (e.quoteCreated > ctx.today) {
      e.quoteCreated = addDays(ctx.today, -rng.int(2, 40))
      e.leadDays = daysBetween(e.quoteCreated, e.date)
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

function pickOpenDay(rng, ctx, counts, key) {
  const days = [...eachDay(`${key}-01`, lastDayOfMonth(key))].filter((iso) => {
    const cls = classifyDay(iso, ctx.holidays)
    const used = (counts.get(iso) ?? 0) + (ctx.existing.legacyEventDates[iso] ?? 0)
    return !cls.blocked && cls.density >= 0.9 && used < VOLUME.dayCap
  })
  return days.length ? rng.pick(days) : null
}

// ── תוצאות: הצעה · פרויקט · סטטוס-יעד ───────────────────────────────────────

function decideOutcome(rng, ctx, event, customer) {
  const daysToEvent = daysBetween(ctx.today, event.date)
  const quoteAge = daysBetween(event.quoteCreated, ctx.today)

  if (customer.role === 'quotesNoProjects') return rejection(rng, event, quoteAge)
  if (daysToEvent >= 0 && quoteAge <= 25 && rng.chance(0.45)) return { kind: 'open' }
  if (daysToEvent >= 0)
    return rng.chance(0.85) ? { kind: 'approved' } : rejection(rng, event, quoteAge)
  return rng.chance(VOLUME.approvalRate) ? { kind: 'approved' } : rejection(rng, event, quoteAge)
}

function rejection(rng, event, quoteAge) {
  let reason = rng.weighted(REJECTION_WEIGHTS)
  if (reason === 'פג תוקף' && quoteAge < 32) reason = 'מחיר'
  const decidedAt =
    reason === 'פג תוקף'
      ? addDays(event.quoteCreated, 30)
      : addDays(event.quoteCreated, rng.int(2, 20))
  return {
    kind: 'rejected',
    reason,
    notes: reason === 'אחר' ? 'הלקוח עבר לפורמט מקוון ללא רישום פיזי.' : null,
    decidedAt,
  }
}

function targetStatusFor(rng, ctx, event) {
  const days = daysBetween(ctx.today, event.date)
  // חוב-פתוח בן שנתיים אינו קוהרנטי — "ממתין לתשלום" רק בחצי-השנה האחרונה (נמדד 03/09/2026:
  // הגרסה הראשונה הציגה 897 ימי-איחור במסך הכספים).
  if (days < -150) return 'finished'
  if (days < -21) return rng.chance(0.96) ? 'finished' : 'awaiting_payment'
  if (days < -10)
    return rng.weighted([
      { weight: 6, value: 'awaiting_payment' },
      { weight: 2, value: 'finished' },
      { weight: 1, value: 'awaiting_invoice' },
    ])
  if (days < -3)
    return rng.weighted([
      { weight: 4, value: 'awaiting_invoice' },
      { weight: 2, value: 'awaiting_payment' },
      { weight: 2, value: 'event_finished' },
    ])
  if (days < 0) return 'event_finished'
  // 🔴 קרבה קובעת מוכנות (הכרעת-ישי 03/09/2026: "אירועים להיום בלי דיילות ולוגיסטיקה — לא סביר"):
  // עד 3 ימים — מוכן לגמרי; 4–10 — לכל היותר חוסר אחד; חוסר של "איש לא נגע" רק לאירוע רחוק
  // שהצעתו טרייה (ר' למטה). מנהלת אמיתית לא מגיעה לשבוע-האירוע בלי צוות.
  if (days <= 3) return 'ready'
  if (days <= 10)
    return rng.weighted([
      { weight: 7, value: 'ready' },
      { weight: 3, value: 'in_progress' },
    ])
  const freshQuote = daysBetween(event.quoteCreated, ctx.today) <= 10
  if (days <= 21)
    return rng.weighted([
      { weight: 3, value: 'ready' },
      { weight: 5, value: 'in_progress' },
      { weight: freshQuote ? 2 : 0, value: 'not_started' },
    ])
  return rng.weighted([
    { weight: 1, value: 'ready' },
    { weight: 5, value: 'in_progress' },
    { weight: freshQuote ? 5 : 1, value: 'not_started' },
  ])
}

const PAYMENT_DAYS = {
  private_company: [25, 45],
  production_company: [20, 40],
  government: [50, 95],
  nonprofit: [30, 60],
}

function buildProjectPlan(rng, ctx, event, customer, outcome) {
  const target = outcome.cancel ? 'cancelled' : targetStatusFor(rng, ctx, event)
  const approvedAt = addDays(
    event.quoteCreated,
    rng.int(1, Math.max(1, Math.min(14, event.leadDays - 1))),
  )
  const project = {
    target,
    approvedAt,
    logistics: [],
    staffing: [],
    closing: null,
    invoice: null,
    payment: null,
    feedback: null,
    archivedAt: null,
    cancellation: null,
    hero: [],
  }

  if (target === 'cancelled') {
    const tier =
      outcome.cancelTier ??
      rng.weighted([
        { weight: 6, value: 'far' },
        { weight: 2, value: 'mid' },
        { weight: 1, value: 'near' },
        { weight: 1, value: 'force_majeure' },
      ])
    const hoursBefore =
      tier === 'mid' ? rng.int(25, 70) : tier === 'near' ? rng.int(3, 22) : rng.int(96, 700)
    const type = tier === 'force_majeure' ? 'force_majeure' : rng.chance(0.9) ? 'customer' : 'other'
    const eventStart = atLocal(
      event.date,
      Number(event.start.slice(0, 2)),
      Number(event.start.slice(3, 5)),
    )
    const cancelledAt = new Date(Date.parse(eventStart) - hoursBefore * 3_600_000).toISOString()
    const isPast = cancelledAt.slice(0, 10) < ctx.today
    project.cancellation = {
      type,
      reason: rng.pick(CANCEL_REASONS[type]),
      cancelledAt,
      hoursBefore,
      tier,
      // ביטול מסוג "אחר" נשאר בלי הצעת-פיצוי במסד (`finance_cancellation_fee_proposal`
      // מחזירה אחוז ריק) ⇒ הקפאת-הרווח הייתה נכשלת; הוא נשאר פתוח למנהלת-הכספים.
      resolution:
        isPast && !outcome.unresolved && type !== 'other'
          ? rng.weighted([
              { weight: 6, value: 'bill' },
              { weight: 3, value: 'waive' },
              { weight: 1, value: 'write_off' },
            ])
          : null,
    }
    if (
      project.cancellation.resolution === 'bill' &&
      daysBetween(cancelledAt.slice(0, 10), ctx.today) > 40 &&
      rng.chance(0.8)
    ) {
      project.payment = { date: addDays(cancelledAt.slice(0, 10), rng.int(20, 40)) }
    }
  }

  if (['finished', 'awaiting_payment', 'awaiting_invoice'].includes(target)) {
    const closedAt = addDays(event.date, rng.int(1, 4))
    project.closing = {
      actual_hours: round2(event.hours + rng.pick([-0.5, 0, 0, 0, 0.5, 1])),
      actual_guests: Math.max(0, Math.round(event.guests * rng.float(0.8, 1.05))),
      closedAt,
      reportPath: `seed/${event.key}_summary-report.pdf`,
    }
  }
  if (['finished', 'awaiting_payment'].includes(target)) {
    const sentAt = addDays(project.closing.closedAt, rng.int(0, 5))
    project.invoice = { sentAt, fileUrl: `seed/${event.key}_invoice.pdf` }
    const [minDays, maxDays] = PAYMENT_DAYS[customer.customer_type]
    const paidAt = addDays(sentAt, rng.int(minDays, maxDays))
    if (target === 'finished' || (paidAt <= ctx.today && rng.chance(0.3))) {
      project.payment = { date: paidAt <= ctx.today ? paidAt : addDays(ctx.today, -rng.int(0, 3)) }
    }
    project.feedback = buildFeedback(rng, customer)
  }
  if (target === 'finished') {
    project.archivedAt = addDays(project.payment.date, rng.int(1, 7))
  }
  return project
}

function buildFeedback(rng, customer) {
  if (rng.chance(0.2)) return { noResponse: true }
  if (customer.role === 'lowFeedback') {
    const score = rng.pick([1, 2, 2, 3])
    const count = rng.weighted([
      { weight: 6, value: 1 },
      { weight: 3, value: 2 },
      { weight: 1, value: 3 },
    ])
    const negativeReasons = rng.shuffle(SEED_FEEDBACK_NEGATIVE_REASONS).slice(0, count)
    return {
      score,
      negativeReasons,
      negativeReason: negativeReasons[0] ?? null,
      positiveReasons: [],
      positiveReason: null,
      reason: negativeReasons[0] ?? null,
      reasons: negativeReasons,
      notes: rng.pick(FEEDBACK_NOTES.low),
    }
  }
  const score = rng.weighted([
    { weight: 5, value: 5 },
    { weight: 4, value: 4 },
    { weight: 1.2, value: 3 },
    { weight: 0.25, value: 2 },
  ])

  if (score >= 4) {
    const count =
      score === 5
        ? rng.weighted([
            { weight: 1.5, value: 0 },
            { weight: 5, value: 1 },
            { weight: 2.5, value: 2 },
            { weight: 1, value: 3 },
          ])
        : rng.weighted([
            { weight: 2.5, value: 0 },
            { weight: 6, value: 1 },
            { weight: 1.5, value: 2 },
          ])
    const positiveReasons =
      count > 0 ? rng.shuffle(SEED_FEEDBACK_POSITIVE_REASONS).slice(0, count) : []
    return {
      score,
      positiveReasons,
      positiveReason: positiveReasons[0] ?? null,
      negativeReasons: [],
      negativeReason: null,
      reason: null,
      notes: rng.pick(FEEDBACK_NOTES.high),
    }
  }

  // score <= 3
  const count = rng.weighted([
    { weight: 6, value: 1 },
    { weight: 3, value: 2 },
    { weight: 1, value: 3 },
  ])
  const negativeReasons = rng.shuffle(SEED_FEEDBACK_NEGATIVE_REASONS).slice(0, count)
  return {
    score,
    negativeReasons,
    negativeReason: negativeReasons[0] ?? null,
    positiveReasons: [],
    positiveReason: null,
    reason: negativeReasons[0] ?? null,
    reasons: negativeReasons,
    notes: rng.pick(score === 3 ? FEEDBACK_NOTES.mid : FEEDBACK_NOTES.low),
  }
}

// ── לוגיסטיקה ────────────────────────────────────────────────────────────────

function buildLogistics(rng, ctx, event, project) {
  const daysToEvent = daysBetween(ctx.today, event.date)
  const businessDays = daysToEvent >= 0 ? businessDaysBetween(ctx.today, event.date) : null
  return event.lines
    .filter((line) => !line.sku.endsWith('ST'))
    .map((line) => {
      let status = 'ready'
      if (project.target === 'ready') {
        // "מוכן לביצוע" = שיבוץ מלא **וגם** לוגיסטיקה מלאה (recompute_project_status).
        status = 'ready'
      } else if (project.target === 'cancelled') {
        status = rng.weighted([
          { weight: 4, value: 'not_started' },
          { weight: 3, value: 'ordered' },
          { weight: 3, value: 'ready' },
        ])
      } else if (daysToEvent >= 0) {
        // אותה מדרגת-קרבה כמו הסטטוס: בשבוע-האירוע הסחורה כבר כאן (הכרעת-ישי 03/09/2026).
        if (businessDays <= 3) status = 'ready'
        else if (businessDays <= 10)
          status = rng.weighted([
            { weight: 5, value: 'ordered' },
            { weight: 5, value: 'ready' },
          ])
        else if (businessDays <= 20)
          status = rng.weighted([
            { weight: 3, value: 'not_started' },
            { weight: 5, value: 'ordered' },
            { weight: 2, value: 'ready' },
          ])
        else
          status = rng.weighted([
            { weight: 8, value: 'not_started' },
            { weight: 2, value: 'ordered' },
          ])
      }
      const expected = addDays(event.date, -rng.int(3, 12))
      return {
        sku: line.sku,
        status,
        expectedArrival: status === 'not_started' ? null : expected,
        actualArrival: status === 'ready' ? addDays(expected, rng.int(-1, 2)) : null,
        createdAt: project.approvedAt,
      }
    })
}

// ── שיבוצים ──────────────────────────────────────────────────────────────────

const ATTENDANCE_DEFAULT = {
  arrived: 0.86,
  late_light: 0.05,
  late_medium: 0.03,
  late_heavy: 0.01,
  no_show: 0.02,
  sick: 0.02,
  approved_absence: 0.01,
}

function attendanceFor(rng, hostess) {
  const table = hostess.attendance ?? ATTENDANCE_DEFAULT
  const outcome = rng.weighted(Object.entries(table).map(([value, weight]) => ({ weight, value })))
  switch (outcome) {
    case 'late_light':
      return { attendance_status: 'late', lateness_level: 'light', no_show_reason: null }
    case 'late_medium':
      return { attendance_status: 'late', lateness_level: 'medium', no_show_reason: null }
    case 'late_heavy':
      return { attendance_status: 'late', lateness_level: 'heavy', no_show_reason: null }
    case 'no_show':
      return { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'ghosted' }
    case 'sick':
      return { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'sick' }
    case 'approved_absence':
      return {
        attendance_status: 'no_show',
        lateness_level: null,
        no_show_reason: 'approved_absence',
      }
    case 'withdrew':
      return { withdrew: true }
    default:
      return { attendance_status: 'arrived', lateness_level: null, no_show_reason: null }
  }
}

function hostessPool(ctx, hostesses, inviteDate, eventDate) {
  const pool = []
  for (const h of hostesses) {
    if (h.noHistory) continue
    if (h.start > inviteDate) continue
    if (h.end !== null && h.end < eventDate) continue
    pool.push({
      ref: { key: h.key },
      hostess: h,
      rate: h.hourly_rate,
      fading: h.fade && h.end !== null && daysBetween(eventDate, h.end) <= 45,
    })
  }
  for (const h of ctx.existing.hostesses) {
    if (h.created_at.slice(0, 10) > inviteDate) continue
    pool.push({
      ref: { hostess_id: h.hostess_id },
      hostess: {
        declineRate: 0.12,
        attendance: null,
        responseHours: [1, 36],
        hourly_rate: h.hourly_rate,
      },
      rate: h.hourly_rate,
      fading: false,
    })
  }
  return pool
}

function refKey(ref) {
  return ref.key ?? `id:${ref.hostess_id}`
}

function buildStaffing(rng, ctx, event, project, hostesses, booked) {
  if (project.target === 'not_started') return []
  const inviteDate = addDays(project.approvedAt, rng.int(0, 3))
  const pool = rng
    .shuffle(hostessPool(ctx, hostesses, inviteDate, event.date))
    .filter((p) => !booked.has(`${refKey(p.ref)}@${event.date}`))
  const isPast = event.date < ctx.today
  // "בתהליך" = חסרה דיילת אחת (או שתיים באירוע גדול), ולעולם לא אפס מאושרות — אירוע שעובדים עליו
  // מאויש לפחות בדיילת אחת (הכרעת-ישי 03/09/2026). "טרם החל" הוא היחיד בלי שיבוצים.
  const needApproved =
    project.target === 'in_progress'
      ? Math.max(1, event.hostessCount - rng.int(1, event.hostessCount >= 6 ? 2 : 1))
      : event.hostessCount
  const rows = []
  let approved = 0
  let leadChosen = false
  for (const candidate of pool) {
    if (approved >= needApproved) break
    const h = candidate.hostess
    const sentAt = atLocal(inviteDate, rng.int(9, 18), rng.int(0, 59))
    const respondHours = rng.float(...h.responseHours)
    const respondedAt = new Date(Date.parse(sentAt) + respondHours * 3_600_000).toISOString()
    const rate = Math.max(
      ctx.catalog.minWage,
      Math.round(candidate.rate * (PRICE_DRIFT[Number(event.date.slice(0, 4))] ?? 1)),
    )
    const base = {
      ref: candidate.ref,
      assignment_number: 1,
      hourly_rate_snapshot: rate,
      invite_sent_at: sentAt,
      responded_at: respondedAt,
      created_at: sentAt,
      is_shift_lead: false,
      attendance: null,
      preference: null,
      preference_reason: null,
      actual_hours: 0,
    }

    if (candidate.fading) {
      rows.push({ ...base, status: 'pending', responded_at: null })
      continue
    }
    if (rng.chance(h.declineRate)) {
      rows.push({ ...base, status: 'declined' })
      // 3% מהסירובים נעקפים בטלפון — שורה שנייה (assignment_number 2), כמו שהמסך עושה.
      if (rng.chance(0.15)) {
        rows.push({
          ...base,
          assignment_number: 2,
          status: 'finally_approved',
          responded_at: new Date(Date.parse(respondedAt) + 2 * 3_600_000).toISOString(),
        })
        approved += 1
        booked.add(`${refKey(candidate.ref)}@${event.date}`)
      }
      continue
    }
    if (!isPast && project.target === 'in_progress' && rng.chance(0.3)) {
      rows.push({
        ...base,
        status: rng.chance(0.6) ? 'pending' : 'confirmed_available',
        responded_at: null,
      })
      continue
    }
    rows.push({ ...base, status: 'finally_approved', is_shift_lead: !leadChosen })
    leadChosen = true
    approved += 1
    booked.add(`${refKey(candidate.ref)}@${event.date}`)
  }

  // נוכחות — רק לאירועים שנסגרו תפעולית (§ו׳2 — "פיזור על כל תוצאות-הנוכחות").
  if (project.closing) {
    for (const row of rows) {
      if (row.status !== 'finally_approved') continue
      const hostess = pool.find((p) => refKey(p.ref) === refKey(row.ref))?.hostess
      const outcome = attendanceFor(rng, hostess)
      if (outcome.withdrew) {
        row.status = 'approval_withdrawn'
        booked.delete(`${refKey(row.ref)}@${event.date}`)
        continue
      }
      row.attendance = outcome
      row.actual_hours =
        outcome.attendance_status === 'no_show'
          ? 0
          : round2(project.closing.actual_hours + rng.pick([0, 0, 0, 0.5, -0.5]))
      if (outcome.attendance_status !== 'no_show') {
        row.preference = rng.weighted([
          { weight: 20, value: 'מצוינת' },
          { weight: 78, value: 'בסדר' },
          { weight: 2, value: 'לא_לשלוח' },
        ])
        row.preference_reason =
          row.preference === 'לא_לשלוח'
            ? rng.pick(['הלקוח ביקש לא לשבץ שוב — יחס לאורחים', 'איחרה פעמיים אצל הלקוח הזה'])
            : null
      }
    }
  }
  return rows
}

// ── שורות-הגיבור של העתיד (§ה׳ · מודולים 5–7) ────────────────────────────────

function applyFutureHeroes(rng, ctx, events, hostesses, booked) {
  const future = events.filter(
    (e) => e.project && e.date >= ctx.today && e.project.target !== 'cancelled',
  )
  const within = (min, max) =>
    future.filter((e) => {
      const bd = businessDaysBetween(ctx.today, e.date)
      return bd >= min && bd <= max && e.project.logistics.length > 0
    })
  const mark = (event, hero, mutate) => {
    if (!event || event.project.hero.includes(hero)) return
    event.project.hero.push(hero)
    mutate(event)
  }
  const fullStaff = (e) => {
    e.project.target = 'in_progress'
    e.project.staffing = buildStaffing(
      rng,
      ctx,
      e,
      { ...e.project, target: 'ready' },
      hostesses,
      booked,
    )
  }

  // הצמד של מ7 (§7.94): שיבוץ מלא + לוגיסטיקה חסרה, וההפך.
  // שורות-גיבור רק מ-4 ימי-עסקים והלאה — בשבוע-האירוע אין "חוסר להדגמה", יש אירוע שלא מוכן.
  const near = within(4, 12)
  mark(
    near.find((e) => e.project.staffing.length > 0),
    'fullStaffMissingLogistics',
    (e) => {
      fullStaff(e)
      e.project.logistics.forEach((l) =>
        Object.assign(l, { status: 'not_started', expectedArrival: null, actualArrival: null }),
      )
    },
  )
  mark(
    near.find((e) => !e.project.hero.length),
    'fullLogisticsMissingStaff',
    (e) => {
      e.project.target = 'in_progress'
      e.project.staffing = buildStaffing(
        rng,
        ctx,
        e,
        { ...e.project, target: 'in_progress' },
        hostesses,
        booked,
      )
      e.project.logistics.forEach((l) =>
        Object.assign(l, {
          status: 'ready',
          expectedArrival: addDays(ctx.today, -3),
          actualArrival: addDays(ctx.today, -1),
        }),
      )
    },
  )
  // שני טריגרי-הענבר של מ5 (§ה׳): פריט פיזי לא-הוזמן בתוך הסף · משלוח שאיחר.
  for (const e of within(4, 9)
    .filter((x) => !x.project.hero.length)
    .slice(0, 2)) {
    mark(e, 'amberNotStarted', (ev) => {
      ev.project.logistics.forEach((l) =>
        Object.assign(l, { status: 'not_started', expectedArrival: null, actualArrival: null }),
      )
    })
  }
  mark(
    within(4, 15).find((x) => !x.project.hero.length),
    'lateArrival',
    (e) => {
      e.project.logistics.forEach((l) =>
        Object.assign(l, {
          status: 'ordered',
          expectedArrival: addDays(ctx.today, -rng.int(2, 6)),
          actualArrival: null,
        }),
      )
    },
  )
  for (const e of within(4, 20)
    .filter((x) => !x.project.hero.length)
    .slice(0, 2)) {
    mark(e, 'orderedOnly', (ev) => {
      ev.project.logistics.forEach((l) =>
        Object.assign(l, {
          status: 'ordered',
          expectedArrival: addDays(ctx.today, rng.int(1, 5)),
          actualArrival: null,
        }),
      )
    })
  }
}

// ── התוכנית כולה ─────────────────────────────────────────────────────────────

export function buildPlan(input) {
  const { batch, from, today, catalog, existing } = input
  const scale = input.scale ?? 1
  const futureUntil = input.futureUntil ?? lastDayOfMonth(monthKey(addDays(today, 75)))
  const rng = createRng(hashSeed(batch))

  const fromYear = Number(from.slice(0, 4))
  const holidays = buildHolidayMap(fromYear - 1, Number(futureUntil.slice(0, 4)) + 1)
  const monthKeys = []
  for (let key = monthKey(from); key <= monthKey(futureUntil);) {
    monthKeys.push(key)
    const [y, m] = key.split('-').map(Number)
    key = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1, 2)}`
  }
  const pastMonthKeys = monthKeys.filter((k) => k <= monthKey(today))
  const ctx = {
    from,
    today,
    futureUntil,
    scale,
    catalog,
    existing,
    holidays,
    monthKeys,
    pastMonthKeys,
    pastDays: daysBetween(from, today),
    monthsAhead: (key) => {
      const [y, m] = key.split('-').map(Number)
      const [ty, tm] = monthKey(today).split('-').map(Number)
      return (y - ty) * 12 + (m - tm)
    },
  }

  const customers = buildCustomers(rng, ctx)
  const hostesses = buildHostesses(rng, ctx)
  const targets = monthTargets(rng, ctx)
  const counts = dayCounts(rng, ctx, targets)
  const events = buildEvents(rng, ctx, customers, counts)
  const customerByKey = new Map(customers.map((c) => [c.key, c]))

  // ביטולים במרחקים נבחרים (§ו׳2): לפחות אחד בכל מדרגה של §7.16.
  const pastApprovedCandidates = []
  for (const event of events) {
    const customer = customerByKey.get(event.customerKey)
    const outcome = decideOutcome(rng, ctx, event, customer)
    event.outcome = outcome
    if (outcome.kind === 'approved' && event.date < ctx.today) pastApprovedCandidates.push(event)
  }
  // לפחות ארבעה (אחד לכל מדרגה), ולעולם לא יותר משליש מהפרויקטים — אצווה קטנה אינה
  // "עסק שבו הכול מתבטל".
  const cancelCount = Math.min(
    Math.max(4, Math.round(pastApprovedCandidates.length * VOLUME.cancelRate)),
    Math.floor(pastApprovedCandidates.length / 3),
  )
  const cancelPicks = rng.shuffle(pastApprovedCandidates).slice(0, cancelCount)
  const tiers = ['mid', 'near', 'force_majeure', 'far']
  cancelPicks.forEach((event, i) => {
    event.outcome = { kind: 'approved', cancel: true, cancelTier: tiers[i] ?? null }
  })
  // ושני ביטולים עתידיים שדמי-הביטול שלהם עדיין פתוחים (מסך הכספים).
  const futureApproved = events.filter(
    (e) => e.outcome.kind === 'approved' && e.date >= ctx.today && !e.outcome.cancel,
  )
  for (const event of rng.shuffle(futureApproved).slice(0, 2)) {
    event.outcome = { kind: 'approved', cancel: true, cancelTier: 'far', unresolved: true }
  }

  // בניית פרויקטים, לוגיסטיקה ושיבוצים — כרונולוגית, כדי שהזמינות תישמר.
  const booked = new Set(existing.bookedDates)
  for (const event of events) {
    if (event.outcome.kind !== 'approved') {
      event.project = null
      continue
    }
    const customer = customerByKey.get(event.customerKey)
    event.project = buildProjectPlan(rng, ctx, event, customer, event.outcome)
    event.project.logistics = buildLogistics(rng, ctx, event, event.project)
    event.project.staffing = buildStaffing(rng, ctx, event, event.project, hostesses, booked)
  }
  applyFutureHeroes(rng, ctx, events, hostesses, booked)

  // הצעה פתוחה ללקוח בארכיון (§ה׳): הצעה טרייה עם אירוע בעוד ~40 יום.
  const archived = customers.find((c) => c.role === 'archivedOpenQuote')
  if (archived) {
    const day = addDays(today, 40)
    events.push({
      key: `e${events.length + 1}`,
      customerKey: archived.key,
      event_name: 'כנס שותפים',
      annual: false,
      date: day,
      start: '09:00',
      end: '15:00',
      hours: 6,
      guests: 120,
      size: 'medium',
      hostessCount: 3,
      venue: VENUES[4],
      lines: buildLines(rng, ctx, {
        guests: 120,
        date: day,
        size: 'medium',
        hostessCount: 3,
        start: '09:00',
        hours: 6,
      }),
      manual_discount: 0,
      notes: '',
      quoteCreated: addDays(today, -9),
      leadDays: 49,
      outcome: { kind: 'open' },
      project: null,
    })
  }

  // created_at של לקוח: לפני ההצעה הראשונה שלו.
  for (const c of customers) {
    const first = events
      .filter((e) => e.customerKey === c.key)
      .map((e) => e.quoteCreated)
      .sort()[0]
    c.created_at = atLocal(
      first ? addDays(first, -rng.int(3, 90)) : addDays(c.firstAvailable, -rng.int(0, 30)),
      rng.int(9, 17),
    )
  }
  for (const h of hostesses) h.created_at = atLocal(h.start, rng.int(9, 17), rng.int(0, 59))

  return {
    batch,
    from,
    today,
    futureUntil,
    scale,
    customers: customers.map(({ weight, firstAvailable, ...rest }) => rest),
    hostesses,
    events,
  }
}

// ── אימותים טהורים על התוכנית (רצים לפני כל כתיבה, וגם בבדיקות) ─────────────

export function validatePlan(plan, existing) {
  const problems = []
  const holidays = buildHolidayMap(
    Number(plan.from.slice(0, 4)) - 1,
    Number(plan.futureUntil.slice(0, 4)) + 1,
  )
  const perDay = new Map()
  const booked = new Set()
  const hostessByKey = new Map(plan.hostesses.map((h) => [h.key, h]))

  for (const event of plan.events) {
    const cls = classifyDay(event.date, holidays)
    if (cls.blocked) problems.push(`${event.key}: אירוע ביום חסום (${cls.reason}) ${event.date}`)
    if (!event.project) continue
    perDay.set(event.date, (perDay.get(event.date) ?? 0) + 1)
    for (const row of event.project.staffing) {
      const key = `${refKey(row.ref)}@${event.date}`
      if (row.status === 'finally_approved') {
        if (booked.has(key)) problems.push(`${event.key}: דיילת ${key} משובצת פעמיים באותו יום`)
        booked.add(key)
      }
      if (row.ref.key) {
        const h = hostessByKey.get(row.ref.key)
        if (h.created_at.slice(0, 10) > event.date)
          problems.push(`${event.key}: שיבוץ לפני created_at של ${h.full_name}`)
      }
    }
  }
  for (const [iso, n] of perDay) {
    const legacy = existing?.legacyEventDates?.[iso] ?? 0
    if (n + legacy > VOLUME.dayCap) problems.push(`${iso}: ${n + legacy} אירועים — מעל התקרה`)
  }
  return problems
}

export function summarizePlan(plan) {
  const byMonth = new Map()
  for (const e of plan.events) {
    const k = monthKey(e.date)
    const row = byMonth.get(k) ?? { quotes: 0, projects: 0, open: 0, rejected: 0 }
    row.quotes += 1
    if (e.project) row.projects += 1
    if (e.outcome.kind === 'open') row.open += 1
    if (e.outcome.kind === 'rejected') row.rejected += 1
    byMonth.set(k, row)
  }
  const statuses = {}
  for (const e of plan.events) {
    if (!e.project) continue
    statuses[e.project.target] = (statuses[e.project.target] ?? 0) + 1
  }
  const closed = plan.events.filter(
    (e) => e.outcome.kind !== 'open' && e.outcome.reason !== 'נפתחה בטעות',
  )
  return {
    customers: plan.customers.length,
    hostesses: plan.hostesses.length,
    hostessesActiveNow: plan.hostesses.filter((h) => h.end === null).length,
    events: plan.events.length,
    projects: plan.events.filter((e) => e.project).length,
    approvalRate: closed.length
      ? round2(closed.filter((e) => e.outcome.kind === 'approved').length / closed.length)
      : null,
    assignments: plan.events.reduce((s, e) => s + (e.project?.staffing.length ?? 0), 0),
    statuses,
    byMonth: [...byMonth.entries()].sort().map(([k, v]) => ({ month: k, ...v })),
  }
}
