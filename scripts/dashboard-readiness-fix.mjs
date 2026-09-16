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
 *
 *    ⚠️ ושורה שלישית, אם מילאת את יומן-המיילים (ר' `reportEmailLogGap` למטה) — היא
 *       חייבת לרוץ **לפני** מחיקת השיבוצים, אחרת אין לפי מה לזהות אותן:
 *
 *      delete from public.email_log e
 *       where e.template_name = 'shift_invite'
 *         and exists (select 1 from public.assignments a
 *                      join public.hostesses h on h.hostess_id = a.hostess_id
 *                     where a.project_id = e.entity_id and h.email = e.recipient
 *                       and e.created_at = a.invite_sent_at
 *                       and not exists (select 1 from seed_snapshot.assignments_20260915 s
 *                                        where s.project_id = a.project_id
 *                                          and s.hostess_id = a.hostess_id
 *                                          and s.assignment_number = a.assignment_number));
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

// שיעור-הסירוב של העולם הזה, נמדד 16/09/2026 על השורה הקובעת לכל (פרויקט, דיילת):
// ‏4,253 "כן" מתוך 5,047 שענו ⇒ **15.7% סירוב**. לא מספר שנבחר — המצב שהיה לפני שנגעתי.
const DECLINE_RATE = 0.157

// 🔴 **והמודל חייב להיות פר-הזמנה, לא פר-אירוע.** ניסיון ראשון חישב
// `round(need × 0.157)` לכל פרויקט — ומכיוון שרוב הסבבים מזמינים 1–2 דיילות, הוא החזיר
// **אפס** כמעט תמיד (נמדד: 5 סירובים על 52 שיבוצים = 8.8%, מול 15.7% בעולם). הצורה
// הנכונה: כל **גיוס** דרש בממוצע `1/(1−p)` הזמנות, ולכן על כל אישור מוטלת מטבע אחת.
// ⇒ תוחלת של `52 × 0.157/0.843 ≈ 9.7` סירובים, והפיזור נשאר אקראי-קבוע (אותו זרע).
const DECLINES_PER_HIRE = DECLINE_RATE / (1 - DECLINE_RATE)
function declineCount(need) {
  let n = 0
  for (let i = 0; i < need; i += 1) if (rng.chance(DECLINES_PER_HIRE)) n += 1
  return n
}
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
    db.select('hostesses', 'hostess_id, id_number, full_name, email, hourly_rate, rating, status', [
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
  const hasRowInProject = new Set(approved.map((a) => `${a.project_id}:${a.hostess_id}`))
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
  const declinePlan = []
  for (const project of targets) {
    if (KEEP_SHORT_STAFF.has(project.project_id)) continue
    const need = project.required_hostess_count - (confirmed.get(project.project_id) ?? 0)
    if (need <= 0) continue

    const date = project.final_event_date
    const eligible = pool.filter((h) => {
      // 🔴 **המסנן שנשכח בריצה הראשונה, ושהוא-הוא הבאג.** בדקתי שהדיילת אינה תפוסה
      // באותו **יום**, אבל לא שכבר יש לה שורה **באותו אירוע** — ואז `max+1` עשה בדיוק
      // מה שהוא אמור: פתח "סיבוב שני". נמדד: שתי שורות כאלה נוצרו, ואחת מהן **דרסה
      // סירוב אמיתי** (הסטטוס הקובע הוא של `MAX(assignment_number)`), כלומר מחקה
      // החלטה של דיילת מכל מונה במערכת. השנייה דרסה הזמנה שעוד המתינה למענה.
      if (hasRowInProject.has(`${project.project_id}:${h.hostess_id}`)) return false
      if (bookedDay.has(`${h.hostess_id}@${date}`)) return false
      if (blocked.has(`${project.customer_id}:${h.hostess_id}`)) return false
      if (overlapsUnavailability(unavailByHostess.get(h.hostess_id) ?? [], date)) return false
      return true
    })
    const declines = declineCount(need)
    if (eligible.length < need + declines) {
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

    // 🔴 **הסירובים, וזה לא קישוט.** סבב-איוש בלי אף סירוב הוא 100% היענות, ו-Smart
    // Match קורא בדיוק את המספר הזה: `responsivenessCounts` (src/lib/smartMatch.js)
    // סופר `finally_approved` **גם במונה וגם במכנה**, ולכן שורה שנולדה מאושרת היא
    // "הוזמנה, ענתה, אמרה כן" — מענה מושלם למי שלא קיבלה הזמנה. 📏 נמדד אחרי הריצה
    // הראשונה: שרון כהן עברה מ-1/2 ל-4/4, וממוצע-החברה (`C`) זז מ-0.842679 ל-0.844449
    // — וה-`C` הזה מרסן את הציון של **כל** דיילת, גם של מי שלא נגעתי בה.
    // ⇒ הסבב מקבל סירובים ביחס האמיתי של העולם הזה.
    for (let i = 0; i < declines; i += 1) {
      const pick = eligible.splice(Math.floor(rng.next() * eligible.length), 1)[0]
      const sentAt = atLocal(inviteDay, rng.int(9, 18), rng.int(0, 59))
      const respondedAt = new Date(
        new Date(sentAt).getTime() + responseHours(pick.rating) * 3600 * 1000,
      ).toISOString()
      declinePlan.push({
        project_id: project.project_id,
        hostess_id: pick.hostess_id,
        assignment_number: (maxNumber.get(`${project.project_id}:${pick.hostess_id}`) ?? 0) + 1,
        assignment_status: 'declined',
        hourly_rate_snapshot: Math.max(minWage, Math.round(pick.hourly_rate)),
        invite_sent_at: sentAt,
        responded_at: respondedAt,
        created_at: sentAt,
        is_shift_lead: false,
        travel_amount: 0,
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
  console.log(`שיבוצים חדשים: ${staffingPlan.length} · סירובים נלווים: ${declinePlan.length}`)
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
  if (declinePlan.length) await db.insert('assignments', declinePlan)
  console.log(`סירובים: ${declinePlan.length} ✓`)

  await reportEmailLogGap(db, [...staffingPlan, ...declinePlan], projects, hostesses)
}

// ── יומן-המיילים ─────────────────────────────────────────────────────────────
// 🔴 **מה שנשבר בריצה הראשונה, ולמה זה לא פער תיאורטי.** נמדד 16/09/2026: מינואר 2026
// ואילך **לכל זימון יש שורת-יומן — 1,527 מתוך 1,527, תשעה חודשים רצופים.** הסקריפט
// יוצר שיבוץ "מאושר סופית" ישירות, בלי לעבור את מסלול-ההזמנה, ולכן 50 הזימונים שהוא
// כתב היו החריגה היחידה בדפוס הזה (ספטמבר ירד ל-46/102).
//
// 🚫 **ולמה הסקריפט אינו כותב את זה בעצמו — וזה מכוון, לא חוסר.** ל-`email_log` אין
// policy-כתיבה ללקוח **בכוונה**, והנימוק כתוב בפונקציית-הקצה `send-email/index.ts`:
// *"יומן שהדפדפן יכול לכתוב אליו אינו ראיה."* הכותב היחיד הוא ה-service-role, והמפתח
// שלו אינו ב-`.env.local` ואינו אמור להיות שם. לקרוא ל-`send-email` היה **שולח 50
// מיילים אמיתיים** לכתובות של דיילות. ⇒ הסקריפט **מזהה ומדווח**, ומוסר את ה-SQL
// המדויק להרצה בהרשאת-שרת. הוא לא מעמיד פנים שביצע.
async function reportEmailLogGap(db, staffingPlan, projects, hostesses) {
  if (!staffingPlan.length) return
  const projectIds = [...new Set(staffingPlan.map((a) => a.project_id))]
  const logged = await db.select('email_log', 'entity_id, recipient', [
    ['eq', 'template_name', 'shift_invite'],
    ['in', 'entity_id', projectIds],
  ])
  const have = new Set(logged.map((e) => `${e.entity_id}|${e.recipient}`))
  const emailOf = new Map(hostesses.map((h) => [h.hostess_id, h.email]))
  const missing = staffingPlan.filter(
    (a) => !have.has(`${a.project_id}|${emailOf.get(a.hostess_id)}`),
  )
  if (!missing.length) {
    console.log('יומן-מיילים: כל הזימונים רשומים ✓')
    return
  }
  console.log(`\n⚠️ יומן-מיילים: ${missing.length} זימונים בלי שורת-יומן.`)
  console.log('   הסקריפט אינו יכול לכתוב לטבלה הזו (ר׳ ההערה מעל reportEmailLogGap).')
  console.log('   להריץ בהרשאת-שרת — הצורה זהה ל-1,570 השורות הקיימות:\n')
  console.log(`insert into public.email_log
  (entity_type, entity_id, recipient, template_name, subject, status, sent_by_email, created_at)
select 'shift', a.project_id, h.email, 'shift_invite',
       'זימון למשמרת — ' || p.event_name, 'sent', 'recruit.test@regin.co.il', a.invite_sent_at
  from public.assignments a
  join public.hostesses h on h.hostess_id = a.hostess_id
  join public.projects   p on p.project_id = a.project_id
 where a.invite_sent_at is not null
   and a.project_id in (${projectIds.join(', ')})
   and not exists (select 1 from public.email_log e
                    where e.template_name = 'shift_invite'
                      and e.entity_id = a.project_id and e.recipient = h.email);\n`)
}

main().catch((error) => {
  console.error(`נכשל: ${error.message}`)
  process.exit(1)
})
