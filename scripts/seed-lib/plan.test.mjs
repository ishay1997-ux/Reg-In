// בדיקות-יחידה על המתכנן הטהור — רצות ב-`npm run gate` בלי מסד. מה שנבדק כאן הוא מה
// שהמפרט (`seed-data-spec.md §ז׳`) דורש מהתוכנית לפני שנכתבת שורה: תקרת-3/יום, אף אירוע
// בשבת/חג, אף שיבוץ לפני created_at, שיעור-אישור, כל הסטטוסים ומדרגות-הביטול, דטרמיניזם.
import { describe, expect, it } from 'vitest'
import { buildPlan, summarizePlan, validatePlan } from './plan.mjs'
import { buildHolidayMap, classifyDay } from './calendar.mjs'

const CATALOG = {
  ratio: 50,
  minWage: 35.4,
  travelAmount: 22.6,
  products: [
    ['06ST', 'hostess', 800],
    ['04ST', 'hostess', 500],
    ['01WEB', 'site', 2500],
    ['REG-TAG', 'product', 3],
    ['B-REG-TAG', 'product', 6],
    ['ECO-TAG', 'product', 5],
    ['B-ECO-TAG', 'product', 8],
    ['FAB-LAN', 'product', 4],
    ['B-FAB-LAN', 'product', 7],
    ['SAT-LAN', 'product', 6],
    ['B-SAT-LAN', 'product', 9],
  ].map(([sku, category, base_price]) => ({ sku, category, base_price })),
  tiers: [
    { sku: 'B-REG-TAG', min_qty: 51, special_price: 5.5 },
    { sku: 'B-REG-TAG', min_qty: 201, special_price: 5 },
  ],
}

const EXISTING = {
  hostesses: [
    { hostess_id: 11, full_name: 'נועה שגיא', created_at: '2026-08-09T10:00:00Z', hourly_rate: 45 },
  ],
  bookedDates: ['id:11@2026-10-15'],
  legacyEventDates: { '2026-10-15': 1, '2026-10-20': 1, '2026-11-05': 1, '2026-10-09': 1 },
  companyNumbers: ['514992001'],
  idNumbers: ['44711521'],
}

const TODAY = '2026-09-03'

function plan(overrides = {}) {
  return buildPlan({
    batch: 'seed-unit-a',
    from: '2024-01-01',
    today: TODAY,
    catalog: CATALOG,
    existing: EXISTING,
    ...overrides,
  })
}

describe('buildPlan — תוכנית מלאה', () => {
  const full = plan()
  const summary = summarizePlan(full)

  it('דטרמיניסטית: אותה אצווה ⇒ אותה תוכנית', () => {
    expect(JSON.stringify(plan())).toBe(JSON.stringify(full))
    expect(JSON.stringify(plan({ batch: 'seed-unit-b' }))).not.toBe(JSON.stringify(full))
  })

  it('עוברת את האימותים הטהורים (תקרה · לוח · created_at · כפל-שיבוץ)', () => {
    expect(validatePlan(full, EXISTING)).toEqual([])
  })

  it('נפח בסדר-הגודל של המפרט (~900 פרויקטים על 32 חודשים) ושיעור-אישור 60–80%', () => {
    expect(summary.projects).toBeGreaterThan(650)
    expect(summary.projects).toBeLessThan(1150)
    expect(summary.approvalRate).toBeGreaterThanOrEqual(0.6)
    expect(summary.approvalRate).toBeLessThanOrEqual(0.8)
  })

  it('כל שמונת סטטוסי-הפרויקט מיוצגים', () => {
    for (const s of [
      'not_started',
      'in_progress',
      'ready',
      'event_finished',
      'awaiting_invoice',
      'awaiting_payment',
      'finished',
      'cancelled',
    ]) {
      expect(summary.statuses[s], s).toBeGreaterThan(0)
    }
  })

  it('ביטולים בכל מדרגת-פיצוי, ושניים עתידיים לא-פתורים', () => {
    const tiers = full.events
      .filter((e) => e.project?.cancellation)
      .map((e) => e.project.cancellation.tier)
    for (const t of ['far', 'mid', 'near', 'force_majeure']) expect(tiers).toContain(t)
    expect(
      full.events.filter(
        (e) =>
          e.project?.cancellation && e.project.cancellation.resolution === null && e.date >= TODAY,
      ).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('שבע סיבות-דחייה ושלושת טווחי זמן-ההקדמה', () => {
    const reasons = new Set(
      full.events.filter((e) => e.outcome.kind === 'rejected').map((e) => e.outcome.reason),
    )
    for (const r of [
      'מחיר',
      'חוסר זמינות/לו"ז',
      'נבחר מתחרה',
      'תקציב לקוח',
      'האירוע בוטל אצל הלקוח',
      'פג תוקף',
      'נפתחה בטעות',
    ])
      expect(reasons.has(r), r).toBe(true)
    const leads = full.events.map((e) => e.leadDays)
    expect(leads.some((l) => l >= 60)).toBe(true)
    expect(leads.some((l) => l >= 21 && l < 60)).toBe(true)
    expect(leads.some((l) => l < 21)).toBe(true)
  })

  it('שורות-הגיבור של העתיד (הצמד של מ7 + שני טריגרי-הענבר) מסומנות', () => {
    const heroes = new Set(full.events.flatMap((e) => e.project?.hero ?? []))
    for (const h of [
      'fullStaffMissingLogistics',
      'fullLogisticsMissingStaff',
      'amberNotStarted',
      'lateArrival',
    ])
      expect(heroes.has(h), h).toBe(true)
  })

  it('חמשת פרופילי Smart Match: החדשה בלי היסטוריה, האחרות עם', () => {
    const rowsFor = (key) =>
      full.events.flatMap((e) => (e.project?.staffing ?? []).filter((r) => r.ref.key === key))
    expect(rowsFor('h3')).toHaveLength(0)
    expect(rowsFor('h1').length).toBeGreaterThan(5)
    expect(rowsFor('h2').length).toBeGreaterThan(5)
    const noShows = rowsFor('h1').filter(
      (r) => r.attendance?.attendance_status === 'no_show',
    ).length
    expect(noShows).toBeGreaterThan(0)
    expect(
      rowsFor('h2').every(
        (r) => r.attendance === null || r.attendance.attendance_status === 'arrived',
      ),
    ).toBe(true)
  })

  it('כל תוצאות-הנוכחות מיוצגות', () => {
    const seen = new Set()
    for (const e of full.events)
      for (const r of e.project?.staffing ?? []) {
        if (r.status === 'approval_withdrawn') seen.add('withdrew')
        if (r.attendance)
          seen.add(
            `${r.attendance.attendance_status}/${r.attendance.lateness_level ?? r.attendance.no_show_reason ?? ''}`,
          )
      }
    for (const k of [
      'arrived/',
      'late/light',
      'late/medium',
      'late/heavy',
      'no_show/ghosted',
      'no_show/sick',
      'no_show/approved_absence',
      'withdrew',
    ])
      expect(seen.has(k), k).toBe(true)
  })

  it('לקוחות-הגיבור: ענק · בלי-הצעות · הצעות-בלי-פרויקטים · רדום · בארכיון עם הצעה פתוחה', () => {
    const byKey = (key) => full.events.filter((e) => e.customerKey === key)
    const giant = full.customers.find((c) => c.role === 'giant')
    expect(byKey(giant.key).filter((e) => e.project).length).toBeGreaterThan(8)
    expect(byKey(full.customers.find((c) => c.role === 'noQuotes').key)).toHaveLength(0)
    const qnp = byKey(full.customers.find((c) => c.role === 'quotesNoProjects').key)
    expect(qnp.length).toBeGreaterThan(0)
    expect(qnp.every((e) => !e.project)).toBe(true)
    const archived = full.customers.find((c) => c.role === 'archivedOpenQuote')
    expect(archived.status).toBe('inactive')
    expect(byKey(archived.key).some((e) => e.outcome.kind === 'open')).toBe(true)
    expect(full.customers.filter((c) => c.contacts.length >= 2).length).toBeGreaterThanOrEqual(10)
    expect(full.customers.every((c) => c.contacts.filter((k) => k.is_primary).length === 1)).toBe(
      true,
    )
  })

  it('הצעות היסטוריות סגורות כולן; פתוחות רק טריות עם אירוע עתידי', () => {
    for (const e of full.events.filter((x) => x.outcome.kind === 'open')) {
      expect(e.date >= TODAY).toBe(true)
      expect(e.quoteCreated >= '2026-08-05').toBe(true)
    }
  })
})

describe('אצווה קטנה (--scale 0.05, חודש אחד)', () => {
  it('נבנית, תקפה, ובלי שורות-גיבור עתידיות כשהחלון בעבר', () => {
    const small = buildPlan({
      batch: 'seed-small',
      from: '2026-06-01',
      today: TODAY,
      catalog: CATALOG,
      existing: EXISTING,
      scale: 0.05,
      futureUntil: '2026-06-30',
    })
    expect(validatePlan(small, EXISTING)).toEqual([])
    expect(small.events.length).toBeGreaterThan(0)
    expect(small.events.length).toBeLessThan(40)
  })
})

describe('calendar', () => {
  const holidays = buildHolidayMap(2024, 2026)
  it('חוסם שבת, יום כיפור, ראש השנה, פסח, שבועות ותשעה באב', () => {
    // 🔄 03/09/2026: התאריכים תוקנו ביום אחד קדימה — הרשימה הקודמת נכתבה מול לוח שזז יום אחורה
    // (ר' ההערה ב-`buildHolidayMap`): יום-כיפור תשפ"ז הוא 21/09/2026, לא 20/09.
    for (const iso of [
      '2026-09-05', // שבת
      '2026-09-21', // יום כיפור תשפ"ז
      '2025-10-02', // יום כיפור תשפ"ו
      '2026-09-12', // ראש השנה תשפ"ז
      '2026-04-02', // פסח תשפ"ו
      '2025-06-02', // שבועות תשפ"ה
      '2025-08-03', // תשעה באב תשפ"ה
    ]) {
      expect(classifyDay(iso, holidays).blocked, iso).toBe(true)
    }
  })
  it('יום עבודה רגיל בצפיפות מלאה, שישי וחול-המועד בצפיפות נמוכה', () => {
    expect(classifyDay('2026-09-01', holidays)).toMatchObject({ blocked: false, density: 1 })
    expect(classifyDay('2026-09-04', holidays).density).toBeLessThan(0.2)
    expect(classifyDay('2026-09-28', holidays).density).toBeLessThan(0.5)
  })
})
