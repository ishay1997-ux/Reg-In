#!/usr/bin/env node
/**
 * demo-seed — גנרטור נתוני-ההדגמה של REG-IN (‏32 חודשים, ~900 פרויקטים), הפיך דרך מרשם-הזריעה.
 *
 * 📜 היסטוריה, כדי שלא תוסק מחדש: הגרסה הראשונה (29/07/2026) זרעה 4 לקוחות, 8 הצעות ו-5
 * דיילות, ומחקה לפי `company_number`/ת"ז קבועים. **הדאטה ההיא נשארת במסד בדיוק כפי שהיא** —
 * לקוחות 46–49, פרויקטים 3/7/8/13/14 וחמש דיילות-ההדגמה הם עוגני-הבדיקה (`e2e/smoke-anchors.json`,
 * `seed-data-spec.md §א׳`) ומוקאפי מודול 6 מצוירים על "פרויקט 8". הסקריפט הזה **לעולם אינו נוגע
 * בהם**: הם אינם במרשם-הזריעה, ולכן `--reset` אינו יכול להגיע אליהם מבנייה.
 *
 * ⚠️ עיקרון-המפתח נשמר מהגרסה הראשונה: ההזנה עוברת דרך **אותן פונקציות-שרת שהמסכים קוראים
 * להן** — `create_quote` · `approve_quote_and_create_project` · `update_logistics_item` ·
 * `cancel_project` · `close_project_operationally` · `record_invoice_sent` · `record_payment` ·
 * `record_feedback` · `archive_project` · `resolve_cancellation_fee` — כי שורה שנכתבת "מבחוץ"
 * עוקפת מספור-שורות, הקפאת-עלות ו-28 טריגרים. **שום טריגר אינו מכובה.**
 *
 * 🔑 ומה שהמסלול הרגיל אינו יודע לעשות, ולכן קיימת מיגרציית `seed_registry_and_helpers` (03/09/2026):
 *   · אישור-הצעה מסרב לתאריך שעבר ⇒ ההצעה נוצרת ומאושרת עם תאריך-מציין עתידי, ואז
 *     `seed_backdate_quote`/`seed_backdate_project` מזיזות אותה לתאריך האמיתי — **רק שורות רשומות**.
 *   · ל-`projects` אין policy-כתיבה ⇒ חותמות-הזמן (`cancelled_at` וכו') מוזזות דרך אותן פונקציות.
 *   · הנעילה של §7.50 חוסמת מחיקה ⇒ `seed_reset` מוחקת אצווה רשומה בלבד, בסדר ה-FK.
 *
 * 🔒 סודות: נקראים מ-.env.local לתוך process.env בלבד; הסקריפט לעולם אינו מדפיס אותם.
 *
 * שימוש:
 *   node scripts/demo-seed.mjs --batch <שם>                 תוכנית בלבד (ברירת-המחדל: לא כותב)
 *   node scripts/demo-seed.mjs --batch <שם> --write         זריעה בפועל
 *   node scripts/demo-seed.mjs --batch <שם> --write --from 2026-06-01 --scale 0.05   אצווה קטנה
 *   node scripts/demo-seed.mjs --reset <שם>                 מחיקת אצווה (דרך seed_reset)
 * דגלים: --from YYYY-MM-DD (ברירת-מחדל 2024-01-01) · --scale 0..1 · --concurrency N · --future-until YYYY-MM-DD
 *
 * הרשם של כל ריצה: scripts/seed-runs/<batch>.json — המזהים שנוצרו, לצורך `seed-assert.mjs` ו-`--reset`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { connectAsCeo, SeedDb, runPool } from './seed-lib/db.mjs'
import { buildPlan, summarizePlan, validatePlan, vatRateFor } from './seed-lib/plan.mjs'
import { addDays, atLocal } from './seed-lib/calendar.mjs'

// ── ארגומנטים ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback
}

const RUNS_DIR = resolve(process.cwd(), 'scripts', 'seed-runs')
const runFile = (batch) => resolve(RUNS_DIR, `${batch}.json`)

// חמש דיילות-ההדגמה של 11/08/2026 (ת"ז קבועות ב-`smoke-anchors.json` בשם) — לעולם אינן משובצות
// על-ידי הגנרטור: שיבוץ שלהן ב-15/10 היה מוציא אותן משער-Smart-Match של פרויקט 8.
const DEMO_HOSTESS_IDS = new Set(['44711521', '44711539', '44711547', '44711554', '44711562'])

function todayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

function saveRun(record) {
  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true })
  writeFileSync(runFile(record.batch), JSON.stringify(record, null, 2) + '\n', 'utf-8')
}

// ── איפוס אצווה ──────────────────────────────────────────────────────────────
async function resetBatch(batch) {
  const supabase = await connectAsCeo()
  const db = new SeedDb(supabase, { batch })
  const result = await db.rpc('seed_reset', { p_batch: batch })
  console.log(`✓ seed_reset("${batch}") ⇒ ${JSON.stringify(result)}`)
  if (existsSync(runFile(batch))) {
    const record = JSON.parse(readFileSync(runFile(batch), 'utf-8'))
    record.resetAt = new Date().toISOString()
    record.resetResult = result
    saveRun(record)
  }
}

// ── קריאת המצב הקיים (קריאה בלבד) ───────────────────────────────────────────
async function loadExisting(db) {
  const [products, tiers, params, hostesses, customers, projects, assignments] = await Promise.all([
    db.select('products', 'sku, category, base_price, status', [['eq', 'status', 'active']]),
    db.select('price_tiers', 'sku, min_qty, special_price'),
    db.select('params', 'param_name, param_value'),
    db.select('hostesses', 'hostess_id, full_name, id_number, created_at, hourly_rate, status'),
    db.select('customers', 'customer_id, company_number'),
    db.select('projects', 'project_id, final_event_date, project_status'),
    db.select('assignments', 'hostess_id, event_date, assignment_status', [
      ['eq', 'assignment_status', 'finally_approved'],
    ]),
  ])
  const param = (name) => params.find((p) => p.param_name === name)?.param_value
  const legacyEventDates = {}
  for (const p of projects) {
    if (p.project_status === 'cancelled') continue
    legacyEventDates[p.final_event_date] = (legacyEventDates[p.final_event_date] ?? 0) + 1
  }
  return {
    catalog: {
      products,
      tiers,
      ratio: Number(param('יחס_אורחים_לדיילת')),
      minWage: Number(param('שכר_מינימום_שעתי')),
      travelAmount: Number(param('סכום_נסיעות_למשמרת') ?? 0),
    },
    existing: {
      hostesses: hostesses.filter(
        (h) => h.status === 'active' && !DEMO_HOSTESS_IDS.has(h.id_number),
      ),
      bookedDates: assignments.map((a) => `id:${a.hostess_id}@${a.event_date}`),
      legacyEventDates,
      companyNumbers: customers.map((c) => c.company_number),
      idNumbers: hostesses.map((h) => h.id_number),
    },
  }
}

// ── כתיבה ────────────────────────────────────────────────────────────────────
async function writeHostesses(db, plan, record) {
  const keyToId = {}
  const chunks = []
  for (let i = 0; i < plan.hostesses.length; i += 40) chunks.push(plan.hostesses.slice(i, i + 40))
  for (const chunk of chunks) {
    const rows = chunk.map((h) => ({
      id_number: h.id_number,
      full_name: h.full_name,
      phone: h.phone,
      email: h.email,
      city: h.city,
      address: h.address,
      lat: h.lat,
      lng: h.lng,
      has_car: h.has_car,
      hourly_rate: h.hourly_rate,
      rating: h.rating,
      status: 'active',
      created_at: h.created_at,
    }))
    const created = await db.insert('hostesses', rows)
    const ids = created.map((r) => r.hostess_id)
    await db.register('hostess', ids)
    record.ids.hostesses.push(...ids)
    created.forEach((row, i) => {
      keyToId[chunk[i].key] = row.hostess_id
    })
    const languages = chunk.flatMap((h, i) =>
      h.languages.map((language) => ({ hostess_id: created[i].hostess_id, language })),
    )
    if (languages.length) await db.insert('hostess_languages', languages)
    const unavailability = chunk
      .map((h, i) =>
        h.unavailability ? { hostess_id: created[i].hostess_id, ...h.unavailability } : null,
      )
      .filter(Boolean)
    if (unavailability.length) await db.insert('hostess_unavailability', unavailability)
  }
  record.hostessKeys = keyToId
  saveRun(record)
  return keyToId
}

async function writeCustomers(db, plan, record) {
  const keyToId = {}
  const rows = plan.customers.map((c) => ({
    company_name: c.company_name,
    company_number: c.company_number,
    customer_type: c.customer_type,
    discount_percent: c.discount_percent,
    marketing_consent: c.marketing_consent,
    status: 'active',
    created_at: c.created_at,
  }))
  const created = await db.insert('customers', rows)
  const ids = created.map((r) => r.customer_id)
  await db.register('customer', ids)
  record.ids.customers.push(...ids)
  for (let i = 0; i < created.length; i += 1) {
    keyToId[plan.customers[i].key] = created[i].customer_id
    await db.rpc('replace_customer_contacts', {
      p_customer_id: created[i].customer_id,
      p_contacts: plan.customers[i].contacts,
    })
  }
  record.customerKeys = keyToId
  saveRun(record)
  return keyToId
}

function placeholderDate(index) {
  return addDays('2030-01-01', index)
}

function makeEventWriter({ db, plan, record, customerIds, hostessIds, catalog }) {
  const hostessIdOf = (ref) => (ref.key ? hostessIds[ref.key] : ref.hostess_id)
  const isPast = (iso) => iso < plan.today

  async function backdateQuote(event, quoteId, vat) {
    await db.rpc('seed_backdate_quote', {
      p_quote_id: quoteId,
      p_created_at: atLocal(event.quoteCreated, 11, 15),
      p_issue_date: event.quoteCreated,
      p_estimated_event_date: event.date,
      p_vat_rate_snapshot: vat,
    })
  }

  async function writeLogistics(event, project, projectId) {
    const rows = await db.select('logistics', 'project_id, sku, serial_number, item_status', [
      ['eq', 'project_id', projectId],
    ])
    const remaining = [...project.logistics]
    for (const row of rows) {
      const idx = remaining.findIndex((l) => l.sku === row.sku)
      if (idx < 0) continue
      const [planned] = remaining.splice(idx, 1)
      const key = { p_project_id: projectId, p_sku: row.sku, p_serial_number: row.serial_number }
      if (planned.status === 'ordered') {
        await db.rpc('update_logistics_item', {
          ...key,
          p_changes: { item_status: 'ordered', expected_arrival_date: planned.expectedArrival },
        })
      } else if (planned.status === 'ready') {
        await db.rpc('update_logistics_item', { ...key, p_changes: { item_status: 'ready' } })
      }
      planned.serial_number = row.serial_number
    }
  }

  async function backdateLogistics(project, projectId) {
    for (const planned of project.logistics) {
      if (planned.serial_number === undefined) continue
      const patch = {
        created_at: planned.createdAt ? atLocal(planned.createdAt, 11, 20) : undefined,
      }
      if (planned.status === 'ready') {
        patch.expected_arrival_date = planned.expectedArrival
        patch.actual_arrival_date = planned.actualArrival
      }
      await db.update(
        'logistics',
        patch,
        { project_id: projectId, sku: planned.sku, serial_number: planned.serial_number },
        { expect: 1 },
      )
    }
  }

  async function writeAssignments(event, project, projectId) {
    if (!project.staffing.length) return
    const rows = project.staffing.map((r) => ({
      project_id: projectId,
      hostess_id: hostessIdOf(r.ref),
      assignment_number: r.assignment_number,
      assignment_status: r.status,
      hourly_rate_snapshot: r.hourly_rate_snapshot,
      invite_sent_at: r.invite_sent_at,
      responded_at: r.responded_at,
      created_at: r.created_at,
      is_shift_lead: r.status === 'finally_approved' && r.is_shift_lead,
      travel_amount: r.status === 'finally_approved' ? catalog.travelAmount : 0,
    }))
    await db.insert('assignments', rows)
  }

  async function closeAndSettle(event, project, projectId, customerType) {
    const closing = project.closing
    const attendanceRows = project.staffing
      .filter((r) => r.status === 'finally_approved' && r.attendance)
      .map((r) => ({
        hostess_id: hostessIdOf(r.ref),
        assignment_number: r.assignment_number,
        attendance_status: r.attendance.attendance_status,
        lateness_level: r.attendance.lateness_level,
        no_show_reason: r.attendance.no_show_reason,
        actual_hours: r.actual_hours,
        preference: r.preference,
        preference_reason: r.preference_reason,
      }))
    if (!attendanceRows.length) return // אירוע שלא אויש כלל — נשאר "ממתין לסגירה" (מקרה #7)
    await db.rpc('close_project_operationally', {
      p_project_id: projectId,
      p_actual_hours: closing.actual_hours,
      p_actual_guests: closing.actual_guests,
      p_report_path: closing.reportPath,
      p_rows: attendanceRows,
    })
    const stamps = {
      p_project_id: projectId,
      p_operationally_closed_at: atLocal(closing.closedAt, 12, 30),
    }

    if (project.feedback) {
      await db.rpc('mark_feedback_survey_sent', { p_project_id: projectId })
      await db.rpc(
        'record_feedback',
        project.feedback.noResponse
          ? { p_project_id: projectId, p_mark_no_response: true }
          : {
              p_project_id: projectId,
              p_score: project.feedback.score,
              p_reason: project.feedback.reason,
              p_notes: project.feedback.notes,
              p_mark_no_response: false,
            },
      )
    }
    if (project.invoice) {
      await db.rpc('record_invoice_sent', {
        p_project_id: projectId,
        p_file_url: project.invoice.fileUrl,
      })
      stamps.p_invoice_sent_at = atLocal(project.invoice.sentAt, 14, 5)
    }
    if (project.payment) {
      await db.rpc('record_payment', {
        p_project_id: projectId,
        p_payment_date: project.payment.date,
      })
    }
    if (project.target === 'finished') {
      await db.rpc('archive_project', { p_project_id: projectId })
      stamps.p_archived_at = atLocal(project.archivedAt, 9, 45)
    }
    await db.rpc('seed_backdate_project', stamps)
    void customerType
  }

  async function settleCancellation(project, projectId) {
    const { resolution } = project.cancellation
    if (!resolution) return
    if (resolution === 'bill') {
      const [proposal] = await db.rpc('finance_cancellation_fee_proposal', {
        p_project_id: projectId,
      })
      const fee = Number(proposal?.proposed_fee ?? 0)
      if (fee > 0) {
        await db.rpc('resolve_cancellation_fee', {
          p_project_id: projectId,
          p_action: 'bill',
          p_amount: fee,
          p_note: 'דמי ביטול לפי ההצעה האוטומטית',
        })
        if (project.payment)
          await db.rpc('record_payment', {
            p_project_id: projectId,
            p_payment_date: project.payment.date,
          })
      } else {
        await db.rpc('resolve_cancellation_fee', {
          p_project_id: projectId,
          p_action: 'waive',
          p_note: 'לא הוצאו עלויות עד רגע הביטול — ויתור',
        })
      }
      return
    }
    const note =
      resolution === 'waive'
        ? 'לקוח ותיק — ויתור על דמי ביטול'
        : 'הלקוח לא הגיב לפניות — נסגר כחוב אבוד'
    await db.rpc('resolve_cancellation_fee', {
      p_project_id: projectId,
      p_action: resolution,
      p_note: note,
    })
  }

  return async function writeEvent(event, index) {
    const customerId = customerIds[event.customerKey]
    const customer = plan.customers.find((c) => c.key === event.customerKey)
    const project = event.project
    const header = {
      customer_id: customerId,
      event_name: event.event_name,
      recommended_hostess_count: Math.max(1, Math.ceil(event.guests / catalog.ratio)),
      estimated_guests: event.guests,
      estimated_event_date: isPast(event.date) && project ? placeholderDate(index) : event.date,
      estimated_location: event.venue.name,
      estimated_start_time: event.start,
      estimated_end_time: event.end,
      applied_customer_discount: customer.discount_percent,
      manual_discount: event.manual_discount,
      notes: event.notes,
    }
    const quoteId = await db.rpc('create_quote', { p_header: header, p_lines: event.lines })
    await db.register('quote', [quoteId])
    const entry = {
      key: event.key,
      date: event.date,
      quote_id: quoteId,
      project_id: null,
      outcome: event.outcome.kind,
      target: project?.target ?? null,
      hero: project?.hero ?? [],
    }
    record.events.push(entry)
    record.ids.quotes.push(quoteId)

    if (event.outcome.kind === 'open') {
      await backdateQuote(event, quoteId, null)
      return
    }
    if (event.outcome.kind === 'rejected') {
      await backdateQuote(event, quoteId, null)
      await db.update(
        'quotes',
        {
          quote_status: 'rejected',
          rejection_reason: event.outcome.reason,
          rejection_notes: event.outcome.notes,
        },
        { quote_id: quoteId },
        { expect: 1 },
      )
      return
    }

    const projectId = await db.rpc('approve_quote_and_create_project', { p_quote_id: quoteId })
    await db.register('project', [projectId])
    entry.project_id = projectId
    record.ids.projects.push(projectId)
    await db.rpc('set_project_coordinates', {
      p_project_id: projectId,
      p_lat: event.venue.lat,
      p_lng: event.venue.lng,
    })

    await writeLogistics(event, project, projectId)
    await writeAssignments(event, project, projectId)
    if (project.cancellation) {
      await db.rpc('cancel_project', {
        p_project_id: projectId,
        p_cancel_type: project.cancellation.type,
        p_cancel_reason: project.cancellation.reason,
      })
    }
    await backdateQuote(event, quoteId, vatRateFor(project.approvedAt))
    await db.rpc('seed_backdate_project', {
      p_project_id: projectId,
      p_created_at: atLocal(project.approvedAt, 11, 40),
      p_final_event_date: event.date,
      p_cancelled_at: project.cancellation?.cancelledAt ?? null,
    })
    await backdateLogistics(project, projectId)

    if (project.cancellation) await settleCancellation(project, projectId)
    else if (project.closing)
      await closeAndSettle(event, project, projectId, customer.customer_type)
  }
}

async function finishStatuses(db, plan, record, hostessIds, customerIds) {
  for (const h of plan.hostesses) {
    if (h.end === null) continue
    await db.update(
      'hostesses',
      { status: 'inactive' },
      { hostess_id: hostessIds[h.key] },
      { expect: 1 },
    )
  }
  for (const c of plan.customers) {
    if (c.status !== 'inactive') continue
    await db.update(
      'customers',
      { status: 'inactive' },
      { customer_id: customerIds[c.key] },
      { expect: 1 },
    )
  }
  saveRun(record)
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (value('reset')) {
    await resetBatch(value('reset'))
    return
  }
  const batch = value('batch')
  if (!batch) {
    console.error('✗ חסר --batch <שם-אצווה> (או --reset <שם-אצווה>).')
    process.exit(1)
  }
  if (existsSync(runFile(batch)) && flag('write')) {
    const previous = JSON.parse(readFileSync(runFile(batch), 'utf-8'))
    if (!previous.resetAt) {
      console.error(
        `✗ האצווה "${batch}" כבר נזרעה (${previous.startedAt}). לאפס קודם: --reset ${batch}`,
      )
      process.exit(1)
    }
  }

  const supabase = await connectAsCeo()
  const errors = []
  const db = new SeedDb(supabase, { batch, onError: (e) => errors.push(String(e.message)) })
  const { catalog, existing } = await loadExisting(db)
  const today = todayIso()

  const plan = buildPlan({
    batch,
    from: value('from', '2024-01-01'),
    today,
    catalog,
    existing,
    scale: Number(value('scale', '1')),
    futureUntil: value('future-until', undefined),
  })
  const problems = validatePlan(plan, existing)
  const summary = summarizePlan(plan)
  console.log(`📋 תוכנית "${batch}" (היום ${today}):`)
  console.log(JSON.stringify(summary, null, 2))
  if (problems.length) {
    console.error(`✗ ${problems.length} בעיות בתוכנית — לא כותבים:`)
    for (const p of problems.slice(0, 20)) console.error('  ' + p)
    process.exit(1)
  }
  if (!flag('write')) {
    console.log('ℹ️ תוכנית בלבד. להרצה בפועל: --write')
    return
  }

  const record = {
    batch,
    startedAt: new Date().toISOString(),
    today,
    from: plan.from,
    futureUntil: plan.futureUntil,
    scale: plan.scale,
    summary,
    ids: { customers: [], hostesses: [], quotes: [], projects: [] },
    hostessKeys: {},
    customerKeys: {},
    events: [],
    errors,
    completed: false,
  }
  saveRun(record)

  console.log('→ דיילות…')
  const hostessIds = await writeHostesses(db, plan, record)
  console.log(`  ✓ ${record.ids.hostesses.length} דיילות`)
  console.log('→ לקוחות…')
  const customerIds = await writeCustomers(db, plan, record)
  console.log(`  ✓ ${record.ids.customers.length} לקוחות`)

  console.log(`→ ${plan.events.length} אירועים…`)
  const writeEvent = makeEventWriter({ db, plan, record, customerIds, hostessIds, catalog })
  const failures = await runPool(plan.events, writeEvent, {
    concurrency: Number(value('concurrency', '3')),
    onProgress: (done, total) => {
      if (done % 25 === 0 || done === total) {
        console.log(`  … ${done}/${total} (${db.calls} קריאות)`)
        saveRun(record)
      }
    },
  })
  if (failures.length) {
    record.failures = failures.map((f) => ({ key: f.item.key, error: String(f.error.message) }))
    saveRun(record)
    console.error(
      `✗ ${failures.length} אירועים נכשלו — הריצה נעצרה. הראשון: ${failures[0].error.message}`,
    )
    console.error(`  לאיפוס: node scripts/demo-seed.mjs --reset ${batch}`)
    process.exit(1)
  }

  console.log('→ סטטוסים סופיים (דיילות שעזבו, לקוח בארכיון)…')
  await finishStatuses(db, plan, record, hostessIds, customerIds)
  record.completed = true
  record.finishedAt = new Date().toISOString()
  record.calls = db.calls
  saveRun(record)
  console.log(
    `✓ הסתיים: ${record.ids.customers.length} לקוחות · ${record.ids.hostesses.length} דיילות · ${record.ids.quotes.length} הצעות · ${record.ids.projects.length} פרויקטים · ${db.calls} קריאות · ${errors.length} שגיאות.`,
  )
  console.log(`  טענות-הקבלה: node scripts/seed-assert.mjs --batch ${batch}`)
  console.log(`  איפוס: node scripts/demo-seed.mjs --reset ${batch}`)
}

main().catch((error) => {
  console.error(`✗ ${error.message}`)
  process.exit(1)
})
