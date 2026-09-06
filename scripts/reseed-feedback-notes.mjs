/**
 * scripts/reseed-feedback-notes.mjs — זריעה-מחדש של הערות-המשוב החופשיות (`projects.feedback_notes`)
 *
 * למה (06/09/2026, הכרעת-ישי "ניתוח הערות חובה"): 351 ההערות הזרועות היו 9 נוסחים בלבד (28–55 תווים),
 * וניתוח-AI עליהן היה מחזיר 9 תוצאות. הסקריפט מייצר לכל פרויקט עם משוב הערה **שנגזרת מהנתונים שלו** —
 * הציון, סיבת-המשוב, התגיות החיוביות, מי איחרה בפועל (מ-`assignments`), כמות-האורחים, סוג-הלקוח
 * והשנה — כך שהסיפורים שהדוחות מספרים (איחור↔מרחק · שחיקת-כוכבות · שיפור רב-שנתי · תגים↔ספק)
 * חיים גם בטקסט החופשי, ומודל-שפה שיסווג אותן "יגלה" את מה שהמסד כבר יודע.
 *
 * הסיפור המכוון (סעיף ח4 ב-`docs/specs/module_11_reports/research/review-2026-09-06.md`):
 *   S1 איחור הוא סיבת-השורש #1 לציון נמוך — וההערה נוקבת בשם הדיילת שבאמת סומנה 'late'.
 *   S2 בעיות-תגים מתרכזות ב-2024–תחילת 2025 ("הספק הקודם") ונעלמות ב-2026.
 *   S3 אירועים גדולים ⇒ תורים בשעת-השיא, גם בציון 4.
 *   S4 "ניהול לקוי" = אין מי שמחליט בשטח / החלפת-עמדה איטית.
 *   S5 ~10% מהערות-4 מסתירות תלונה בלי תגית ("היה מצוין, רק ש…") — הפער אדם↔AI.
 *   S6 שבח נקוב-בשם לדיילות-הגיבורות (מי שעבדה בפועל) — הצד השני של ריכוז-המשמרות.
 *   S7 עיריות: שבח על הרישום + הערת-בירוקרטיה (מספר-הזמנה/חשבונית) — מתחבר לתזרים.
 *
 * דטרמיניסטי: אותו project_id ⇒ אותה הערה (זרע 'notes-v2:<id>'). הרצה חוזרת = אותו פלט.
 * הרצה: `node scripts/reseed-feedback-notes.mjs` = יבש (מדפיס התפלגות ודוגמאות) · `--apply` = כותב.
 */

import dotenv from 'dotenv'
import { createRng } from './seed-lib/prng.mjs'

dotenv.config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')
const SEED_PREFIX = 'notes-v2:'

async function executeSql(query) {
  const url = process.env.VITE_SUPABASE_URL
  const projectRef = url.match(/https:\/\/(.*?)\.supabase\.co/)[1]
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('חסר SUPABASE_ACCESS_TOKEN ב-.env.local')
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`שגיאת SQL Management API (${res.status}): ${await res.text()}`)
  return res.json()
}

const sqlString = (s) => `'${String(s).replace(/'/g, "''")}'`

// ---------- קלט: כל פרויקט עם משוב, עם ההקשר שההערה נשענת עליו ----------
const SELECT = `
select p.project_id, p.feedback_score as score, p.negative_feedback_reason as neg,
       coalesce(p.positive_feedback_reasons, '{}') as pos,
       extract(year from p.final_event_date)::int as yr,
       extract(month from p.final_event_date)::int as mon,
       p.actual_guests, q.estimated_guests, c.customer_type,
       (select array_agg(split_part(h.full_name,' ',1) order by a.lateness_level desc nulls last, h.full_name)
          from assignments a join hostesses h on h.hostess_id=a.hostess_id
         where a.project_id=p.project_id and a.attendance_status in ('late','no_show')) as late_names,
       (select array_agg(a.lateness_level order by a.lateness_level desc nulls last, h.full_name)
          from assignments a join hostesses h on h.hostess_id=a.hostess_id
         where a.project_id=p.project_id and a.attendance_status in ('late','no_show')) as late_levels,
       (select split_part(h.full_name,' ',1) from assignments a join hostesses h on h.hostess_id=a.hostess_id
         where a.project_id=p.project_id and a.is_shift_lead limit 1) as lead_name,
       (select array_agg(split_part(h.full_name,' ',1)) from (
          select h2.full_name from assignments a2 join hostesses h2 on h2.hostess_id=a2.hostess_id
           where a2.project_id=p.project_id and a2.assignment_status='finally_approved' and a2.attendance_status='arrived'
           order by h2.rating desc nulls last, h2.full_name limit 2) h) as good_names
  from projects p join quotes q on q.quote_id=p.quote_id left join customers c on c.customer_id=p.customer_id
 where p.feedback_status='completed'
 order by p.project_id`

// ---------- מילון-נוסחים: כל משפחה נשענת על עובדה שקיימת בשורה ----------
const LATE_MIN = { light: [10, 20], medium: [20, 40], heavy: [40, 75] }

const T = {
  lateNeg: [
    ({ n, m }) => `${n} הגיעה באיחור של כ-${m} דקות והדלפק נפתח אחרי שהאורחים כבר עמדו בתור.`,
    ({ n, m }) => `איחור של ${m} דקות של ${n} — הכניסה התחילה ברגל שמאל, למרות שהשאר עבדו יפה.`,
    ({ n, n2 }) => `${n} ו${n2} הגיעו מאוחר. עמדת הרישום נפתחה חסרה ונוצר עומס בפתיחה.`,
    ({ n }) => `הצוות בסדר, אבל ${n} הגיעה אחרי שעת ההתייצבות ולא הספיקה תדריך. מבקשים להקפיד.`,
    ({ n, m }) =>
      `נאלצנו לפתוח את הדלתות בלי דיילת אחת (${n} איחרה ${m} דק'). הלקוחות שלנו הרגישו את זה.`,
    ({ n }) => `לא הגיעה דיילת אחת (${n}) ולא קיבלנו הודעה מראש. הסתדרנו, אבל זה לא מקובל.`,
    ({ n }) =>
      `${n} לא הופיעה בכלל. המנהלת שלכם סידרה מחליפה תוך שעה — אבל השעה הראשונה הייתה קשה.`,
  ],
  staffNeg: [
    ({ n }) => `${n} לא הכירה את רשימת המוזמנים ושלחה אנשים לעמדה הלא נכונה. חסרה הכנה.`,
    () => `הדיילות היו על הטלפון בזמן שאורחים חיכו. לא הרושם שרצינו לתת.`,
    ({ n }) => `הרישום היה איטי מדי — ${n} התקשתה עם הסורק ולא ידעה למי לפנות.`,
    () => `יחס לא נעים לאורחים בכניסה. שני מוזמנים התלוננו בפניי ישירות.`,
    ({ n, n2 }) => `${n} הייתה מצוינת, ${n2} פחות — לא ידעה לענות על שאלות בסיסיות על התוכנית.`,
    () => `הצוות עבד, אבל בלי חיוך ובלי יוזמה. באירוע לקוחות זה משנה.`,
  ],
  badgeNeg: {
    old: [
      () => `התגים הגיעו עם שגיאות כתיב בשמות של שלושה מנהלים בכירים. מביך.`,
      () => `חלק מהתגים לא תאמו את רשימת המוזמנים ונוצר בלגן בכניסה. הדפסה מהספק הקודם?`,
      () => `איכות ההדפסה הייתה חלשה — הלוגו יצא מטושטש על התגים. לא כמו בפעם הקודמת.`,
      () => `חסרו כ-20 תגים ונאלצנו לכתוב ביד. הדיילות התמודדו יפה, אבל זה נראה חובבני.`,
    ],
    recent: [
      () => `התגים בסדר, אבל השרוכים הגיעו בצבע אחר ממה שסיכמנו. פרט קטן שהרגישו.`,
      () => `טעות בשם אחד על תג (מנכ"ל של לקוח). הוחלף במקום — אבל עדיף בלי.`,
    ],
  },
  mgmtNeg: [
    ({ lead }) => `לא היה ברור מי אחראית בשטח. כששאלנו — ${lead} הפנתה למשרד. באירוע זה לא עובד.`,
    () => `כשהיה צריך להעביר דיילת מעמדה לעמדה זה לקח יותר מדי זמן. חסרה יד מכוונת.`,
    () => `תיאום מולכם לפני האירוע היה טוב, אבל ביום עצמו לא היה מי שינהל את הצוות.`,
    () => `החלפת-משמרת באמצע לא תואמה איתנו. פתאום היו פנים חדשות בדלפק בלי חפיפה.`,
    () => `שאלות שלנו בשטח נענו באיחור. צריך נציגה אחת שמחליטה, לא שלוש שמתייעצות.`,
  ],
  otherNeg: [
    () => `ההערכה של מספר האורחים הייתה גבוהה מדי ושילמנו על דיילות שלא היו נחוצות. כדאי לדייק.`,
    () =>
      `החשבונית הגיעה בלי מספר הזמנת רכש ונתקעה אצלנו בהנה"ח. לא קשור לדיילות — אבל מעכב תשלום.`,
    () => `שעות העבודה שדווחו לא תאמו למה שראינו בשטח. ביקשנו בירור.`,
  ],
  // ציון 3: תלונה + הכרה
  mixed3: [
    ({ n, m }) => `סביר. ${n} איחרה ${m} דקות אבל אחר כך הרישום זרם. הייתי נותן עוד הזדמנות.`,
    () => `בסדר גמור ברמת השירות, פחות ברמת ההכנה — לקח זמן עד שהצוות הבין את מבנה האולם.`,
    () => `האירוע עבר, אבל בלי ה"וואו" של הפעם הקודמת. הצוות הרגיש חדש.`,
    ({ guests }) => `עם ${guests} אורחים היה צריך עוד עמדה. הדיילות עשו כמיטב יכולתן.`,
  ],
  // ציון 4: שבח + הערה קטנה (חלקן "מסתירות" תלונה בלי תגית — S5)
  pos4: [
    ({ n }) => `הכול היה טוב. ${n} במיוחד — קלטה את הרשימה מהר ונתנה יחס לכל אורח.`,
    () => `רישום מסודר, צוות נעים. הערה אחת: התדריך שלכם בבוקר היה קצר מדי.`,
    ({ guests }) => `${guests} אורחים ורק תור קצר בפתיחה. יפה. עוד עמדה בשעת השיא הייתה עוזרת.`,
    () => `טוב מאוד. השרוכים הגיעו קצת מאוחר אבל לפני שהאורחים הגיעו, אז לא נורא.`,
    ({ lead }) => `${lead} ניהלה את הצוות יפה. היינו שמחים לתדריך משותף איתנו לפני הפתיחה.`,
    () => `שירות טוב, זמינות טובה במשרד לפני האירוע. התגים — יפים, אבל הגופן קטן מדי לקריאה ממרחק.`,
  ],
  pos4hidden: [
    ({ n, m }) => `היה מצוין בסך הכול. רק ש-${n} הגיעה כ-${m} דקות אחרי השעה, אבל השלימה את הפער.`,
    ({ n }) => `נהנינו. ${n} הגיעה מאוחר, לא הפריע בסוף — הצוות כיסה.`,
    () => `טוב. בסוף היום לא היה ברור למי מדווחים על שינוי בכמות, אבל הסתדר.`,
  ],
  pos5: [
    ({ n, n2 }) =>
      `${n} ו${n2} — מקצועיות ברמה אחרת. האורחים שלנו ציינו את זה בעצמם. נשמח לאותו צוות.`,
    ({ n }) => `בפעם השלישית שאנחנו מבקשים את ${n}, ושוב לא התאכזבנו. הרישום נסגר תוך 20 דקות.`,
    () => `הצוות הגיע מוקדם, העמדה הייתה מוכנה לפני שהגיע האורח הראשון. בדיוק ככה.`,
    () => `תגים מדויקים, אפס תיקונים ביד, אפס תורים. הכי חלק שהיה לנו עד היום.`,
    ({ lead }) =>
      `${lead} ניהלה את הכניסה כמו שעון — כשהגיעה קבוצה גדולה פתאום, פתחה עמדה נוספת בלי שביקשנו.`,
    ({ guests }) => `${guests} איש נכנסו בלי שהרגישו תור. הצוות שלכם הוא הסיבה שנחזור.`,
    () => `מענה מהיר במשרד, צוות אדיב בשטח, והדוח אחרי האירוע הגיע באותו ערב. תודה.`,
    () => `שירות מצוין מהתחלה ועד הסוף. גם השינוי בכמות ברגע האחרון טופל בלי דרמה.`,
  ],
  govTail: [
    ` נבקש שהחשבונית תישא את מספר ההזמנה — אחרת היא נתקעת אצלנו בגזברות.`,
    ` הערה טכנית: התשלום אצלנו עובר ועדה, אז אל תיבהלו מהעיכוב.`,
  ],
}

function pickLate(row, rng) {
  const names = row.late_names || []
  const levels = row.late_levels || []
  if (!names.length) return null
  const i = 0
  const lvl = levels[i] || 'light'
  const [a, b] = LATE_MIN[lvl] || LATE_MIN.light
  return { n: names[i], n2: names[1] || null, m: rng.int(a, b), level: lvl, noShow: !levels[i] }
}

function buildNote(row, rng) {
  const late = pickLate(row, rng)
  const good = row.good_names || []
  const ctx = {
    n: late?.n || good[0] || 'הדיילת',
    n2: late?.n2 || good[1] || good[0] || 'הדיילת השנייה',
    m: late?.m || rng.int(15, 35),
    lead: row.lead_name || 'המנהלת',
    guests: row.actual_guests || row.estimated_guests || 150,
  }
  const goodCtx = { ...ctx, n: good[0] || ctx.lead, n2: good[1] || good[0] || ctx.lead }
  const pick = (arr, c = ctx) => rng.pick(arr)(c)
  const score = row.score
  const neg = row.neg
  const oldBadgeEra = row.yr < 2025 || (row.yr === 2025 && row.mon <= 4)

  let note
  if (neg === 'איחור דיילות') {
    if (late && late.noShow) note = pick(T.lateNeg.slice(5))
    else if (late && late.n2)
      note = rng.chance(0.4) ? T.lateNeg[2](ctx) : pick(T.lateNeg.slice(0, 5))
    else note = pick(T.lateNeg.slice(0, 5))
    if (score === 3 && rng.chance(0.4)) note = T.mixed3[0](ctx)
  } else if (neg === 'תפקוד דיילות') {
    note = pick(T.staffNeg, late ? ctx : goodCtx)
  } else if (neg === 'איכות תגים') {
    note = pick(oldBadgeEra ? T.badgeNeg.old : T.badgeNeg.recent)
  } else if (neg === 'ניהול לקוי') {
    note = pick(T.mgmtNeg)
  } else if (neg === 'אחר') {
    note = pick(T.otherNeg)
  } else if (score <= 3) {
    note = pick(T.mixed3, late ? ctx : goodCtx)
  } else if (score === 4) {
    // S5: ~10% מהערות-4 מסתירות איחור אמיתי בלי תגית
    if (late && rng.chance(0.3)) note = pick(T.pos4hidden)
    else note = pick(T.pos4, goodCtx)
  } else {
    note = pick(T.pos5, goodCtx)
  }

  // S7: עיריות — זנב בירוקרטי על חלק מההערות החיוביות
  if (row.customer_type === 'government' && score >= 4 && rng.chance(0.25))
    note += rng.pick(T.govTail)
  return note
}

async function main() {
  const rows = await executeSql(SELECT)
  const out = []
  for (const row of rows) {
    const rng = createRng(SEED_PREFIX + row.project_id)
    // כיסוי: כל מי שיש לו סיבת-משוב מקבל הערה; חיוביים — כ-70% (ריאליסטי: לא כולם כותבים)
    const hasNote = row.neg || row.score <= 3 || rng.chance(0.7)
    out.push({
      project_id: row.project_id,
      score: row.score,
      neg: row.neg,
      note: hasNote ? buildNote(row, rng) : null,
    })
  }

  const withNote = out.filter((o) => o.note)
  const distinct = new Set(withNote.map((o) => o.note)).size
  const byScore = {}
  for (const o of withNote) byScore[o.score] = (byScore[o.score] || 0) + 1
  console.log(
    `פרויקטים עם משוב: ${out.length} · עם הערה: ${withNote.length} · נוסחים ייחודיים: ${distinct}`,
  )
  console.log('לפי ציון:', JSON.stringify(byScore))
  const sample = createRng('sample')
  const shown = new Set()
  console.log('\n--- דוגמאות ---')
  for (const s of [1, 2, 3, 3, 4, 4, 4, 5, 5]) {
    const pool = withNote.filter((o) => o.score === s && !shown.has(o.project_id))
    if (!pool.length) continue
    const o = sample.pick(pool)
    shown.add(o.project_id)
    console.log(`[${o.score}${o.neg ? ' · ' + o.neg : ''}] #${o.project_id}: ${o.note}`)
  }

  if (!APPLY) {
    console.log('\n(ריצה יבשה — לא נכתב דבר. להרצה אמיתית: --apply)')
    return
  }
  const stmts = out
    .map(
      (o) =>
        `update projects set feedback_notes = ${o.note ? sqlString(o.note) : 'null'} where project_id = ${o.project_id};`,
    )
    .join('\n')
  await executeSql(`BEGIN;\n${stmts}\nCOMMIT;`)
  console.log(`\n✅ נכתבו ${withNote.length} הערות (${out.length - withNote.length} אופסו ל-null).`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
