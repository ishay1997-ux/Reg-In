#!/usr/bin/env node
/**
 * dashboard-readiness-fix — מביא את אירועי ספטמבר–נובמבר 2026 למצב "מוכן לביצוע",
 * ומשאיר מיעוט מכוון עם חוסר אמיתי. הכרעת-ישי 16/09/2026.
 *
 * 🔴 למה זה קיים. נמדד 16/09/2026 על המסד החי: מתוך 108 פריטי-לוגיסטיקה באירועים
 *    פעילים־עתידיים רק **10 מסומנים 'ready'**. התוצאה על המסך: אוקטובר — חודש הכנס —
 *    מציג **אירוע אחד מוכן מתוך 21**, ונובמבר **0 מתוך 18**. אירועים מאויישים במלואם
 *    נראים חסרים רק בגלל זה. זו אינה תקלת-קוד אלא זריעה שלא הושלמה, והיא מחמירה
 *    מעצמה: כל יום שעובר מעביר עוד אירוע-ירוק לעבר.
 *
 * 🔑 למה סקריפט ולא SQL גולמי. הכתיבה ל-`logistics` עוברת אך ורק דרך
 *    `update_logistics_item` (ל-`logistics` אין policy-כתיבה — deny-all במכוון), והיא
 *    חוסמת קורא בלי `auth.email()`. ⇒ חיבור-שירות אינו יכול לקרוא לה, ו-UPDATE גולמי
 *    היה יוצר פריט "מוכן" עם כמות-שהגיעה 0 ובלי תאריך-הגעה — מצב שהפונקציה עצמה
 *    מונעת. הסקריפט נכנס כמנכ"לית דרך `connectAsCeo` (המפתח הציבורי, RLS חל במלואו)
 *    וקורא לאותה פונקציה שהמסך קורא לה. **שום טריגר אינו מכובה.**
 *
 * 🚫 ומה שלא נוגעים בו, במכוון:
 *    · `projects.project_status` — לעולם לא נכתב ידנית. הטריגר
 *      `assignments_recompute_project_status` / `logistics_recompute_project_status`
 *      מריץ את `recompute_project_status`, והיא לבדה מחליטה מה "מוכן".
 *    · דצמבר 2026 ואילך — 10 אירועים בלי דיילות ובלי פריטי-ציוד כלל. אירוע בעוד
 *      ארבעה חודשים שכולו מסודר נראה מפוברק, והם גם האוכלוסייה היחידה שנותנת
 *      לצ'יפ "טרם החל" משהו להראות.
 *
 * שימוש:
 *   node scripts/dashboard-readiness-fix.mjs            תוכנית בלבד — לא כותב כלום
 *   node scripts/dashboard-readiness-fix.mjs --write    ביצוע בפועל
 *
 * ↩️ ביטול. ⚠️ `seed_reset` **אינו** מכסה את זה — הוא מוחק פרויקטים רשומים, ושיבוץ
 *    בודד אינו ישות שניתן לרשום במרשם (`seed_register` מקבל customer/hostess/quote/
 *    project בלבד). ⇒ הביטול הוא מול צילום-המצב 15/09, שאומת זהה-לחי לפני ההרצה
 *    (‏5,681 שיבוצים · 1,771 פריטי-ציוד · 837 פרויקטים). שתי השאילתות, בסדר הזה:
 *
 *      delete from public.assignments a
 *       where not exists (select 1 from seed_snapshot.assignments_20260915 s
 *                          where s.project_id = a.project_id and s.hostess_id = a.hostess_id
 *                            and s.assignment_number = a.assignment_number);
 *
 *      update public.logistics l
 *         set item_status = s.item_status, actual_qty = s.actual_qty,
 *             actual_qty_autofilled = s.actual_qty_autofilled,
 *             actual_arrival_date = s.actual_arrival_date
 *        from seed_snapshot.logistics_20260915 s
 *       where l.project_id = s.project_id and l.sku = s.sku and l.serial_number = s.serial_number
 *         and (l.item_status, l.actual_arrival_date) is distinct from
 *             (s.item_status, s.actual_arrival_date);
 *
 *    🔑 אין צורך לגעת ב-`projects.project_status`: הטריגרים על שתי הטבלאות רצים גם
 *       על DELETE ועל UPDATE, ומחזירים כל פרויקט לסטטוס שהמסד גוזר מהמצב שחזר.
 */

import { connectAsCeo, SeedDb, loadEnvLocal } from './seed-lib/db.mjs'
import { createRng } from './seed-lib/prng.mjs'
import { addDays, atLocal } from './seed-lib/calendar.mjs'

const WINDOW_END = '2026-11-30'
const ACTIVE = ['not_started', 'in_progress', 'ready']

// חמש דיילות-ההדגמה של 11/08/2026 — עוגני-בדיקה ב-`e2e/smoke-anchors.json`; שיבוץ שלהן
// היה מוציא אותן משער-Smart-Match של פרויקט 8. מזוהות בת"ז, לא ב-hostess_id.
const DEMO_ID_NUMBERS = new Set(['44711521', '44711539', '44711547', '44711554', '44711562'])

// 🎯 המיעוט המכוון (הכרעת-ישי 16/09). בלי זה כל ארבעת כרטיסי "מה דורש טיפול" היו
// מציגים "✓ אין", ומסך מושלם נקרא כמפוברק לעין מנוסה.
const KEEP_SHORT_STAFF = new Map([
  [1594, 'ערב גאלה שנתי · 22/09 — בתוך חלון-האזהרה, מזין את כרטיס-הדיילות'],
  [1597, 'מפגש משקיעים רבעוני · 28/09 — בתוך חלון-האזהרה'],
  [1600, 'טקס פרסים עירוני · 05/10 — חוסר באוקטובר, חודש הכנס'],
  [1615, 'הכשרת מנהלים · 25/10'],
  [1620, 'ערב גאלה שנתי · 02/11'],
  [1633, 'כנס מכירות · 25/11'],
])
const KEEP_ONE_ITEM_OPEN = new Map([
  [1606, 'ערב גאלה שנתי · 12/10 — מאויש במלואו, ולכן החוסר היחיד שלו הוא ציוד'],
  [1622, 'כנס לקוחות שנתי · 04/11 — מאויש במלואו'],
])
// המוקאפ שאושר מציג באוקטובר צ'יפ מקווקו אחד. בלי זה לחודש שמוצג בכנס לא נשאר
// אף "טרם החל", והמצב השלישי של הלוח לא מודגם בכלל.
const KEEP_NOT_STARTED = new Map([[16, "כנס שנתי · 09/10 — הצ'יפ המקווקו של אוקטובר"]])

const rng = createRng('dashboard-readiness-2026-09-16')
const write = process.argv.includes('--write')

// 🔴 מבחן-קוהרנטיות מ3 (`seed-coherence-tests.md`) דורש שזמן-התגובה לזימון **יבחין בין
// דיילות לפי דירוג** — פער ≥ 40% בין המהירה לאיטית. זמן אקראי אחיד הוא בדיוק הכשל
// שהמבחן נולד לתפוס (נמדד 09/09: 18.1/17.8/18.5 שעות ⇒ פער 4%). הרצועות כאן חופפות
// בכוונה: כלל-העל של אותו קובץ אומר שמתאם **מושלם** פוסל בדיוק כמו היעדר-מתאם.
// ⚠️ הריצה של 16/09/2026 יצאה לפני שהרצועות נכנסו ונתנה זמן אקראי אחיד; 52 השורות
// תוקנו בדיעבד לפי אותן רצועות (נמדד אחרי: 27.6 / 9.2 / 3.8 שעות — פער 86%).
const RESPONSE_BANDS = { 5: [1, 8], 4: [4, 18], 3: [12, 40] }
function responseHours(rating) {
  const [min, max] = RESPONSE_BANDS[rating] ?? [4, 18]
  return rng.float(min, max)
}

function overlapsUnavailability(windows, dateIso) {
  return windows.some((w) => w.start_date <= dateIso && (w.end_date ?? w.start_date) >= dateIso)
}

async function main() {
  loadEnvLocal()
  const supabase = await connectAsCeo()
  const db = new SeedDb(supabase, { batch: 'dashboard-readiness-2026-09-16' })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })

  const [projects, hostesses, approved, params, unavail, prefs] = await Promise.all([
    db.select(
      'projects',
      'project_id, event_name, customer_id, final_event_date, required_hostess_count, project_status, created_at',
      [
        ['in', 'project_status', ACTIVE],
        ['gte', 'final_event_date', today],
      ],
    ),
    db.select('hostesses', 'hostess_id, id_number, full_name, hourly_rate, rating, status', [
      ['eq', 'status', 'active'],
    ]),
    db.select(
      'assignments',
      'project_id, hostess_id, assignment_number, event_date, assignment_status',
    ),
    db.select('params', 'param_name, param_value'),
    db.select('hostess_unavailability', 'hostess_id, start_date, end_date'),
    db.select('customer_hostess_preference', 'customer_id, hostess_id, preference'),
  ])

  const paramOf = (name) => params.find((p) => p.param_name === name)?.param_value
  const minWage = Number(paramOf('שכר_מינימום_שעתי'))
  const travelAmount = Number(paramOf('סכום_נסיעות_למשמרת') ?? 0)
  if (!Number.isFinite(minWage) || !Number.isFinite(travelAmount)) {
    throw new Error('פרמטרי שכר-מינימום/נסיעות לא נקראו מהמסד')
  }

  // 🔴 `assignments_one_event_per_day` — אינדקס ייחודי חלקי על (hostess_id, event_date)
  // כש-finally_approved. בלי הסט הזה ההכנסה נופלת ב-23505 באמצע הריצה.
  const bookedDay = new Set(
    approved
      .filter((a) => a.assignment_status === 'finally_approved')
      .map((a) => `${a.hostess_id}@${a.event_date}`),
  )
  const hasAnyAssignment = new Set(approved.map((a) => a.project_id))
  const maxNumber = new Map() // project_id:hostess_id -> max(assignment_number)
  const hasLead = new Set() // project_id שכבר יש בו אחראית-משמרת
  const confirmed = new Map() // project_id -> מספר המאושרות סופית (לפי MAX per hostess)
  const lastStatus = new Map() // project_id:hostess_id -> הסטטוס של השורה האחרונה
  for (const a of approved) {
    const key = `${a.project_id}:${a.hostess_id}`
    if ((maxNumber.get(key) ?? 0) <= a.assignment_number) {
      maxNumber.set(key, a.assignment_number)
      lastStatus.set(key, a.assignment_status)
    }
  }
  for (const [key, status] of lastStatus) {
    if (status !== 'finally_approved') continue
    const pid = Number(key.split(':')[0])
    confirmed.set(pid, (confirmed.get(pid) ?? 0) + 1)
  }

  const unavailByHostess = new Map()
  for (const u of unavail) {
    if (!unavailByHostess.has(u.hostess_id)) unavailByHostess.set(u.hostess_id, [])
    unavailByHostess.get(u.hostess_id).push(u)
  }
  const blocked = new Set(
    prefs.filter((p) => p.preference === 'לא_לשלוח').map((p) => `${p.customer_id}:${p.hostess_id}`),
  )

  const pool = hostesses.filter((h) => !DEMO_ID_NUMBERS.has(h.id_number))
  const targets = projects.filter(
    (p) => p.final_event_date <= WINDOW_END && !KEEP_NOT_STARTED.has(p.project_id),
  )

  const logisticsRows = await db.select(
    'logistics',
    'project_id, sku, serial_number, item_status, planned_qty, actual_qty',
    [['in', 'project_id', projects.map((p) => p.project_id)]],
  )

  // ── ① לוגיסטיקה ──────────────────────────────────────────────────────────
  const logisticsPlan = []
  for (const project of targets) {
    const rows = logisticsRows
      .filter((l) => l.project_id === project.project_id && l.item_status !== 'ready')
      .sort((a, b) => a.sku.localeCompare(b.sku) || a.serial_number - b.serial_number)
    const skip = KEEP_ONE_ITEM_OPEN.has(project.project_id) ? 1 : 0
    for (const row of rows.slice(skip)) logisticsPlan.push(row)
  }

  // ── ② איוש ───────────────────────────────────────────────────────────────
  const staffingPlan = []
  for (const project of targets) {
    if (KEEP_SHORT_STAFF.has(project.project_id)) continue
    const need = project.required_hostess_count - (confirmed.get(project.project_id) ?? 0)
    if (need <= 0) continue

    const date = project.final_event_date
    const eligible = pool.filter((h) => {
      if (bookedDay.has(`${h.hostess_id}@${date}`)) return false
      if (blocked.has(`${project.customer_id}:${h.hostess_id}`)) return false
      if (overlapsUnavailability(unavailByHostess.get(h.hostess_id) ?? [], date)) return false
      return true
    })
    if (eligible.length < need) {
      throw new Error(`פרויקט ${project.project_id}: ${eligible.length} פנויות מול ${need} נדרשות`)
    }

    // הזמנה נשלחה אחרי שהפרויקט נוצר, לפני האירוע, ולא בעתיד.
    const createdIso = project.created_at.slice(0, 10)
    let inviteDay = addDays(date, -rng.int(18, 35))
    if (inviteDay < createdIso) inviteDay = addDays(createdIso, 1)
    if (inviteDay > today) inviteDay = addDays(today, -1)

    for (let i = 0; i < need; i += 1) {
      const pick = eligible.splice(Math.floor(rng.next() * eligible.length), 1)[0]
      const sentAt = atLocal(inviteDay, rng.int(9, 18), rng.int(0, 59))
      const respondedAt = new Date(
        new Date(sentAt).getTime() + responseHours(pick.rating) * 3600 * 1000,
      ).toISOString()
      const key = `${project.project_id}:${pick.hostess_id}`
      const lead =
        !hasLead.has(project.project_id) && (confirmed.get(project.project_id) ?? 0) === 0
      if (lead) hasLead.add(project.project_id)
      bookedDay.add(`${pick.hostess_id}@${date}`)
      staffingPlan.push({
        project_id: project.project_id,
        hostess_id: pick.hostess_id,
        assignment_number: (maxNumber.get(key) ?? 0) + 1,
        assignment_status: 'finally_approved',
        hourly_rate_snapshot: Math.max(minWage, Math.round(pick.hourly_rate)),
        invite_sent_at: sentAt,
        responded_at: respondedAt,
        created_at: sentAt,
        is_shift_lead: lead,
        travel_amount: travelAmount,
      })
    }
  }

  // ── ③ תחזית — שכפול מדויק של `recompute_project_status` על המצב שאחרי התוכנית.
  // 🔑 זו הבדיקה היחידה שעונה על "מה ישי יראה בלוח", ולכן היא רצה גם בהרצת-יבש.
  const willBeReady = new Set(
    logisticsPlan.map((r) => `${r.project_id}:${r.sku}:${r.serial_number}`),
  )
  const added = new Map()
  for (const a of staffingPlan) added.set(a.project_id, (added.get(a.project_id) ?? 0) + 1)

  const byMonth = new Map()
  for (const p of projects) {
    const items = logisticsRows.filter((l) => l.project_id === p.project_id)
    const allReady = items.every(
      (l) =>
        l.item_status === 'ready' || willBeReady.has(`${l.project_id}:${l.sku}:${l.serial_number}`),
    )
    const staffed = (confirmed.get(p.project_id) ?? 0) + (added.get(p.project_id) ?? 0)
    // "נגעה בו יד" = קיימת שורת-שיבוץ כלשהי, או שפריט-ציוד יצא מ'טרם החל'.
    const touched =
      hasAnyAssignment.has(p.project_id) ||
      (added.get(p.project_id) ?? 0) > 0 ||
      items.some(
        (l) =>
          l.item_status !== 'not_started' ||
          willBeReady.has(`${l.project_id}:${l.sku}:${l.serial_number}`),
      )
    let status = 'טרם החל'
    if (staffed >= p.required_hostess_count && (items.length === 0 || allReady))
      status = 'מוכן לביצוע'
    else if (touched) status = 'בתהליך'
    const month = p.final_event_date.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, new Map())
    const bucket = byMonth.get(month)
    bucket.set(status, (bucket.get(status) ?? 0) + 1)
  }

  console.log(`\nתחזית הלוח אחרי התיקון:`)
  for (const month of [...byMonth.keys()].sort()) {
    const b = byMonth.get(month)
    const total = [...b.values()].reduce((s, n) => s + n, 0)
    const parts = ['מוכן לביצוע', 'בתהליך', 'טרם החל']
      .filter((k) => b.get(k))
      .map((k) => `${b.get(k)} ${k}`)
    console.log(`  ${month}: ${total} אירועים — ${parts.join(' · ')}`)
  }
  console.log('')

  console.log(`אירועים בטווח (${today} → ${WINDOW_END}): ${targets.length}`)
  console.log(`פריטי-ציוד לעדכון: ${logisticsPlan.length}`)
  console.log(`שיבוצים חדשים: ${staffingPlan.length}`)
  console.log(
    `נשארים חסרי דיילות: ${KEEP_SHORT_STAFF.size} · חסרי ציוד: ${KEEP_ONE_ITEM_OPEN.size}`,
  )
  console.log(`נשארים "טרם החל": ${KEEP_NOT_STARTED.size} + ${'דצמבר ואילך (מחוץ לטווח)'}`)
  console.log(`תעריף-מינימום ${minWage} ₪ · נסיעות ${travelAmount} ₪`)

  if (!write) {
    console.log('\n— תוכנית בלבד. להרצה: --write')
    return
  }

  let done = 0
  for (const row of logisticsPlan) {
    await db.rpc('update_logistics_item', {
      p_project_id: row.project_id,
      p_sku: row.sku,
      p_serial_number: row.serial_number,
      p_changes: { item_status: 'ready' },
    })
    done += 1
    if (done % 20 === 0) console.log(`  ציוד: ${done}/${logisticsPlan.length}`)
  }
  console.log(`ציוד: ${done}/${logisticsPlan.length} ✓`)

  if (staffingPlan.length) await db.insert('assignments', staffingPlan)
  console.log(`שיבוצים: ${staffingPlan.length} ✓`)
}

main().catch((error) => {
  console.error(`נכשל: ${error.message}`)
  process.exit(1)
})
