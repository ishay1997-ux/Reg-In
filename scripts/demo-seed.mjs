#!/usr/bin/env node
/**
 * demo-seed — נתוני-הדגמה הפיכים ללקוחות ולהצעות מחיר.
 *
 * למה זה קיים (הכרעת-ישי 29/07/2026): להגשה נדרשת מערכת שנראית כאילו עבדו בה, ולא
 * טבלאות ריקות. בנוסף, מסך-ניהול-ההצעות (צעד 3.3) בנוי כולו סביב לשוניות, מונים
 * ומסננים — הוא **אינו ניתן לבנייה או לאימות מול טבלה ריקה**.
 *
 * ⚠️ עיקרון-המפתח: ההזנה עוברת דרך **אותן פונקציות-שרת שהמסכים קוראים להן**
 * (create_quote / approve_quote_and_create_project), ולא בכתיבה ישירה לטבלאות.
 * שורה שנכתבת "מבחוץ" יכולה לעקוף מספור-שורות, הקפאת-עלות ואילוצי-RLS — ואז המסך
 * מציג מצב שלא יכול להיווצר במציאות, ומבזבזים שעה על באג שקיים רק בדאטה עצמה.
 * כאן הנתונים נוצרים בדיוק כמו שנוצרים נתוני-אמת.
 *
 * הפיך לחלוטין: `--reset` מוחק את כל מה שהסקריפט יצר (מזוהה לפי DEMO_TAG) ויוצא.
 *
 * שימוש:
 *   node scripts/demo-seed.mjs           יצירה (מוחק קודם דאטת-הדגמה קיימת)
 *   node scripts/demo-seed.mjs --reset   מחיקה בלבד
 *
 * 🔒 סודות: נקראים מ-.env.local לתוך process.env בלבד; הסקריפט לעולם אינו מדפיס אותם.
 *
 * ⚠️ מגבלה ידועה: `updated_at` נקבע ע"י טריגר `moddatetime` ולכן **לא ניתן להזדקן**
 * מלאכותית — כל ההצעות ייראו כאילו נוצרו היום, ותגית "פג בקרוב" (‏30 יום מ-updated_at)
 * תהיה ריקה. זה נכון ומכוון: דאטה מיושנת אמיתית תיווצר עם דאטת-ההגשה המלאה במודול 12
 * (`PROJECT_MASTER §6`, 🚧 מ12), שם גם ממילא נדרשים פרויקטים/דיילות/לוגיסטיקה.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// טעינת .env.local (Vite טוען אותו לאפליקציה; Node לא) — אותה תבנית כמו playwright.config.js.
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim()
  }
}

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_CEO_EMAIL, E2E_CEO_PASSWORD } = process.env
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !E2E_CEO_EMAIL || !E2E_CEO_PASSWORD) {
  console.error('✗ חסרים ערכים ב-.env.local (כתובת Supabase / מפתח / משתמש מנכ"ל).')
  process.exit(1)
}

// סימון-זיהוי: כל לקוח שהסקריפט יוצר נושא אותו בהערה, וכך המחיקה מוצאת בדיוק את שלו
// ולעולם לא נוגעת בלקוח אמיתי שהוזן ידנית.
const DEMO_TAG = '[דמו]'

// שמות גנריים אך אמינים (הכרעת-ישי 29/07) — לא לקוחות אמיתיים.
const CUSTOMERS = [
  {
    company_name: 'מדיטק פתרונות בע"מ',
    company_number: '514992001',
    customer_type: 'private_company',
    contact_name: 'רון גל',
    phone: '052-4471180',
    email: 'ron@meditech-demo.co.il',
    discount_percent: 5,
  },
  {
    company_name: 'עיריית חדרה',
    company_number: '500221004',
    customer_type: 'government',
    contact_name: 'שרית מזרחי',
    phone: '054-8123390',
    email: 'sarit@hadera-demo.muni.il',
    discount_percent: 0,
  },
  {
    company_name: 'הייטק גרופ בע"מ',
    company_number: '515330872',
    customer_type: 'private_company',
    contact_name: 'טל אבידן',
    phone: '053-7712045',
    email: 'tal@hitechgroup-demo.co.il',
    discount_percent: 12,
  },
  {
    company_name: 'אולמי הנשיא הפקות',
    company_number: '512884417',
    customer_type: 'production_company',
    contact_name: 'מאיה רון',
    phone: '050-9903318',
    email: 'maya@hanasi-demo.co.il',
    discount_percent: 3,
  },
]

// תאריכים יחסיים להיום, כדי שהסט יישאר הגיוני בכל יום שבו מריצים אותו.
function inDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// 8 הצעות: 4 בתהליך · 1 מאושרת · 3 נדחו (שלוש סיבות שונות, כולל 'פג תוקף' — מה
// שעבודת-הרקע היומית כותבת). כל הצעה כוללת שורת-דיילות (§7.53 חוסם הצעה בלעדיה).
const QUOTES = [
  {
    customer: 0,
    event_name: 'כנס לקוחות שנתי',
    days: 24,
    location: 'אקספו תל אביב, ביתן 2',
    start: '18:00',
    end: '22:00',
    guests: 300,
    manual: 10,
    notes: 'כולל הקמה ופירוק. חניה לצוות באחריות הלקוח.',
    lines: [
      ['04ST', 6],
      ['B-REG-TAG', 300],
      ['B-FAB-LAN', 300],
    ],
    outcome: 'in_progress',
  },
  {
    customer: 1,
    event_name: 'טקס פרסים עירוני',
    days: 38,
    location: 'היכל התרבות, חדרה',
    start: '19:00',
    end: '23:00',
    guests: 500,
    manual: 0,
    notes: '',
    lines: [
      ['06ST', 10],
      ['01WEB', 1],
      ['B-SAT-LAN', 500],
    ],
    outcome: 'in_progress',
  },
  {
    customer: 2,
    event_name: 'יום גיבוש חברה',
    days: 45,
    location: 'חוות האירועים, בית זית',
    start: '09:00',
    end: '17:00',
    guests: 80,
    manual: 5,
    notes: 'הלקוח ביקש תגים אקולוגיים.',
    lines: [
      ['04ST', 2],
      ['B-ECO-TAG', 80],
    ],
    outcome: 'in_progress',
  },
  {
    customer: 3,
    event_name: 'השקת סבב גיוס',
    days: 12,
    location: 'אולמי הנשיא, ראשון לציון',
    start: '20:00',
    end: '01:00',
    guests: 220,
    manual: 0,
    notes: 'אירוע ערב שנמשך אל תוך הלילה.',
    lines: [
      ['06ST', 5],
      ['REG-TAG', 220],
      ['FAB-LAN', 220],
    ],
    outcome: 'in_progress',
  },
  {
    customer: 0,
    event_name: 'כנס רפואה 2026',
    days: 60,
    location: 'מרכז הכנסים, ירושלים',
    start: '08:00',
    end: '16:00',
    guests: 300,
    manual: 0,
    notes: '',
    lines: [
      ['06ST', 6],
      ['01WEB', 1],
      ['B-REG-TAG', 300],
    ],
    outcome: 'approved',
  },
  {
    customer: 1,
    event_name: 'ערב הוקרה למתנדבים',
    days: 20,
    location: 'מתנ"ס מרכז, חדרה',
    start: '18:30',
    end: '21:30',
    guests: 150,
    manual: 0,
    notes: '',
    lines: [
      ['04ST', 3],
      ['REG-TAG', 150],
    ],
    outcome: 'rejected',
    reason: 'תקציב לקוח',
  },
  {
    customer: 2,
    event_name: 'מפגש משקיעים רבעוני',
    days: 15,
    location: 'מגדל המוזיאון, תל אביב',
    start: '17:00',
    end: '20:00',
    guests: 120,
    manual: 0,
    notes: '',
    lines: [
      ['04ST', 3],
      ['B-SAT-LAN', 120],
    ],
    outcome: 'rejected',
    reason: 'נבחר מתחרה',
  },
  {
    customer: 3,
    event_name: 'אירוע חנוכת מתחם',
    days: 30,
    location: 'פארק התעשייה, נס ציונה',
    start: '10:00',
    end: '14:00',
    guests: 200,
    manual: 0,
    notes: '',
    lines: [
      ['04ST', 4],
      ['ECO-TAG', 200],
    ],
    outcome: 'rejected',
    reason: 'פג תוקף',
  },
]

// חמש דיילות-דגמה נוספות למאגר, למסך Smart Match (צעד 4.2). 🚫 בלי המילה "דמו" בשום שדה
// (הכרעת-ישי, אותו כלל כמו local-14 לעשרים הקיימות) — שמות ריאליים, לא מתנגשים עם חמשת
// הדיילות שכבר משובצות בפועל לאירוע 8 (נועה שגיא · רוני אלמוג · עדי שפירא · דנה ברק ·
// הילה מזרחי, ר' STATUS.md).
// 🔴 קואורדינטות קבועות בקוד ולא גאוקוד: Nominatim חוסם User-Agent של node (`Access denied`,
// מתועד ב-`04_hostesses/CLAUDE.md`). המרחקים מחושבים מראש מול אירוע 8 (32.1062629/34.8101508,
// אקספו ת"א) ונבחרו כדי שכל אחד מחמשת התנאים בשער (§ שכבה 1 ב-`smartMatch.js`) יודגם בבידוד —
// לא שחזור-ליחסי-ההיענות ההיסטוריים של `spec.md §3.1` (המספר `0.67/0.66/0.64` כבר מוכח בבדיקת
// היחידה; שחזורו החי היה דורש עשרות שיבוצי-עבר בדויים ומכניס ריקבון-פיקסטורות חדש — הכרעה
// עם ישי, 11/08/2026).
const HOSTESSES = [
  {
    id_number: '44711521',
    full_name: 'מאיה כהן',
    phone: '050-2217731',
    email: 'maya.cohen@regin-demo.co.il',
    city: 'הרצליה',
    address: 'סוקולוב 14, הרצליה',
    hourly_rate: 45,
    bank_name: 'בנק הפועלים',
    bank_branch: '612',
    bank_account: '104223',
    lat: 32.1624,
    lng: 34.8447,
    has_car: true, // קרובה (~7 ק"מ) ועם רכב — עוברת בשער בלי שהרכב נדרש כדי להסביר את זה
  },
  {
    id_number: '44711539',
    full_name: 'שירי לוגסי',
    phone: '052-8834410',
    email: 'shiri.lugassi@regin-demo.co.il',
    city: 'נתניה',
    address: 'הרצל 22, נתניה',
    hourly_rate: 48,
    bank_name: 'בנק לאומי',
    bank_branch: '904',
    bank_account: '227719',
    lat: 32.3215,
    lng: 34.8532,
    has_car: true, // בינונית (~24 ק"מ, מתחת לגולפוסט) — עוברת ללא תלות ברכב
  },
  {
    id_number: '44711547',
    full_name: 'טל ברקאי',
    phone: '054-3395512',
    email: 'tal.barkai@regin-demo.co.il',
    city: 'ירושלים',
    address: 'יפו 88, ירושלים',
    hourly_rate: 46,
    bank_name: 'בנק דיסקונט',
    bank_branch: '083',
    bank_account: '551084',
    lat: 31.7683,
    lng: 35.2137,
    // 🎯 רחוקה מעל הגולפוסט (~53 ק"מ, מתחת לשער 80) **עם** רכב — עוברת בזכות הרכב בלבד.
    // הניגוד ל"קרן אשכנזי" למטה (אותו טווח-מרחק, בלי רכב, נפסלת) הוא ההדגמה החיה של §11.5.
    has_car: true,
  },
  {
    id_number: '44711554',
    full_name: 'קרן אשכנזי',
    phone: '053-6621087',
    email: 'keren.ashkenazi@regin-demo.co.il',
    city: 'חיפה',
    address: 'העצמאות 40, חיפה',
    hourly_rate: 47,
    bank_name: 'מזרחי טפחות',
    bank_branch: '457',
    bank_account: '339061',
    lat: 32.794,
    lng: 34.9896,
    // 🚫 רחוקה מעל הגולפוסט (~78 ק"מ, עדיין מתחת לשער 80) ובלי רכב ⇒ נפסלת בשער
    // ("בלי רכב מ-40 ק"מ זו פסילה מוחלטת ולא שיפור שולי", §11.5).
    has_car: false,
  },
  {
    id_number: '44711562',
    full_name: 'ליאת רזניק',
    phone: '058-7743295',
    email: 'liat.reznik@regin-demo.co.il',
    city: 'רעננה',
    address: 'אחוזה 61, רעננה',
    hourly_rate: 44,
    bank_name: 'בנק יהב',
    bank_branch: '129',
    bank_account: '882014',
    lat: 32.1848,
    lng: 34.8713,
    // 🚫 קרובה (~10 ק"מ) ועם רכב — ועדיין נפסלת, כי היא מוצהרת לא-זמינה בתאריך האירוע
    // (טווח 20/08–25/08/2026 חופף ל-22/08). ההדגמה: מרחק ורכב אינם התנאי היחיד בשער.
    has_car: true,
    unavailability: { start_date: '2026-08-20', end_date: '2026-08-25', note: 'חופשה מתוכננת' },
  },
]

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const { error: authError } = await supabase.auth.signInWithPassword({
  email: E2E_CEO_EMAIL,
  password: E2E_CEO_PASSWORD,
})
if (authError) {
  console.error('✗ ההתחברות נכשלה.')
  process.exit(1)
}

// מחיקה: לקוחות-הדמו בלבד. quotes → quote_services הוא cascade; quotes עצמן חייבות
// מחיקה מפורשת לפני הלקוח (FK), ופרויקטים שנוצרו מאישור נמחקים אף הם.
async function reset() {
  const { data: demoCustomers } = await supabase
    .from('customers')
    .select('customer_id')
    .like('company_name', `%${DEMO_TAG}%`)
  const ids = (demoCustomers ?? []).map((c) => c.customer_id)
  if (ids.length === 0) return 0

  const { data: demoQuotes } = await supabase
    .from('quotes')
    .select('quote_id')
    .in('customer_id', ids)
  const quoteIds = (demoQuotes ?? []).map((q) => q.quote_id)
  if (quoteIds.length > 0) {
    await supabase.from('projects').delete().in('quote_id', quoteIds)
    // טריגר-הנעילה (§7.50) חוסם DELETE על הצעה שאינה in_progress — לכן מחזירים אותה
    // לסטטוס הזה לפני המחיקה. זה מותר כאן ורק כאן: דאטת-דמו שהסקריפט עצמו יצר.
    await supabase
      .from('quotes')
      .update({ quote_status: 'in_progress', rejection_reason: null, rejection_notes: null })
      .in('quote_id', quoteIds)
    await supabase.from('quotes').delete().in('quote_id', quoteIds)
  }
  await supabase.from('customers').delete().in('customer_id', ids)
  return ids.length
}

// מחיקת חמש דיילות-הדגמה (אם קיימות מריצה קודמת) — מזוהות לפי ת"ז קבועה, לא לפי תג
// טקסטואלי (בלי המילה "דמו" בשום שדה, ר' ההערה ליד `HOSTESSES`). `hostess_unavailability`
// נמחקת עם ה-`on delete cascade` שלה מ-`hostesses`; אין להן שיבוצים (הן לא מוזמנות
// לאף אירוע ע"י הסקריפט) ולכן `on delete restrict` של `assignments` אינו חוסם.
async function resetHostesses() {
  const ids = HOSTESSES.map((h) => h.id_number)
  const { data: existing } = await supabase
    .from('hostesses')
    .select('id_number')
    .in('id_number', ids)
  const removed = existing?.length ?? 0
  if (removed > 0) {
    await supabase.from('hostesses').delete().in('id_number', ids)
  }
  return removed
}

if (process.argv.includes('--reset')) {
  const removed = await reset()
  const removedHostesses = await resetHostesses()
  console.log(`✓ נמחקו ${removed} לקוחות-דמו והצעותיהם, ו-${removedHostesses} דיילות-דגמה.`)
  process.exit(0)
}

// 🔑 חמש הדיילות נזרעות **לפני** לקוחות/הצעות ובלי תלות בהן — נמצא בפועל (11/08/2026)
// ש-`reset()` למעלה שותק על שגיאה (אין בדיקת `error` בשלוש קריאות ה-delete/update שלה)
// ואינו יכול למחוק/לאפס הצעה שכבר אושרה **דרך המסך** (טריגר-הנעילה חוסם), כלומר
// `node scripts/demo-seed.mjs` הרגיל נכשל היום ב-`process.exit(1)` על התנגשות
// company_number עוד **לפני** שהוא מגיע לקטע הדיילות. תועד כממצא (`04_hostesses/CLAUDE.md`),
// לא תוקן — תיקון-אמת ל-`reset()` היה עלול להצליח למחוק את פרויקט 8 (`on delete cascade`
// מ-`assignments`) ולסחוף את חמשת שיבוצי-ההדגמה המאושרים מ-3.7. הרצת הדיילות בעצמאות
// מהחלק השבור מבטיחה שהן נוצרות גם אם חלק הלקוחות/הצעות ייכשל כרגיל.
await resetHostesses()
for (const h of HOSTESSES) {
  const { unavailability, ...hostessRow } = h
  // ⚠️ הוספה ישירה ולא דרך `createHostess`: הפונקציה האמיתית מגאוקדת את הכתובת,
  // וגאוקוד חסום מ-node (`Access denied`, מתועד ב-`04_hostesses/CLAUDE.md`).
  const { data: created, error: hostessError } = await supabase
    .from('hostesses')
    .insert({ ...hostessRow, status: 'active' })
    .select()
    .single()
  if (hostessError) {
    console.error(`✗ יצירת דיילת נכשלה (${h.full_name}): ${hostessError.message}`)
    process.exit(1)
  }
  if (unavailability) {
    const { error: unavailError } = await supabase
      .from('hostess_unavailability')
      .insert({ hostess_id: created.hostess_id, ...unavailability })
    if (unavailError) {
      console.error(`✗ רישום אי-זמינות נכשל (${h.full_name}): ${unavailError.message}`)
      process.exit(1)
    }
  }
}
console.log(`✓ נוצרו ${HOSTESSES.length} דיילות-דגמה למסך Smart Match.`)

await reset()

// קטלוג חי — המחירים נשלפים מה-DB ולא מוקלדים, כדי שהדמו ישקף את המחירון האמיתי.
const { data: products } = await supabase.from('products').select('*').eq('status', 'active')
const { data: tiers } = await supabase.from('price_tiers').select('*')
const { data: ratioParam } = await supabase
  .from('params')
  .select('param_value')
  .eq('param_name', 'יחס_אורחים_לדיילת')
  .single()
const ratio = Number(ratioParam.param_value)

// אותו כלל-מדרגות בדיוק כמו src/lib/pricing.js — הועתק לכאן במודע כי סקריפט Node
// אינו יכול לייבא דרך ה-alias '@/' של Vite. שינוי בכלל שם מחייב עדכון גם כאן.
function unitPrice(product, qty) {
  const candidates = tiers.filter((t) => t.sku === product.sku && Number(t.min_qty) <= qty)
  if (candidates.length === 0) return Number(product.base_price)
  const winner = candidates.reduce((a, b) => (Number(b.min_qty) > Number(a.min_qty) ? b : a))
  return Number(winner.special_price)
}

const customerIds = []
for (const c of CUSTOMERS) {
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...c, company_name: `${c.company_name} ${DEMO_TAG}`, status: 'active' })
    .select()
    .single()
  if (error) {
    console.error(`✗ יצירת לקוח נכשלה: ${error.message}`)
    process.exit(1)
  }
  customerIds.push(data.customer_id)
}

let approved = 0
let rejected = 0
for (const q of QUOTES) {
  const customer = CUSTOMERS[q.customer]
  const header = {
    customer_id: customerIds[q.customer],
    event_name: q.event_name,
    recommended_hostess_count: Math.ceil(q.guests / ratio),
    estimated_guests: q.guests,
    estimated_event_date: inDays(q.days),
    estimated_location: q.location,
    estimated_start_time: q.start,
    estimated_end_time: q.end,
    applied_customer_discount: customer.discount_percent,
    manual_discount: q.manual,
    notes: q.notes,
  }
  const lines = q.lines.map(([sku, qty]) => {
    const product = products.find((p) => p.sku === sku)
    return { sku, qty, closing_unit_price: unitPrice(product, qty), color: '', notes: '' }
  })

  const { data: quoteId, error } = await supabase.rpc('create_quote', {
    p_header: header,
    p_lines: lines,
  })
  if (error) {
    console.error(`✗ יצירת הצעה נכשלה (${q.event_name}): ${error.message}`)
    process.exit(1)
  }

  if (q.outcome === 'approved') {
    const { error: approveError } = await supabase.rpc('approve_quote_and_create_project', {
      p_quote_id: quoteId,
    })
    if (approveError) {
      console.error(`✗ אישור הצעה נכשל (${q.event_name}): ${approveError.message}`)
      process.exit(1)
    }
    approved++
  } else if (q.outcome === 'rejected') {
    const { error: rejectError } = await supabase
      .from('quotes')
      .update({ quote_status: 'rejected', rejection_reason: q.reason })
      .eq('quote_id', quoteId)
    if (rejectError) {
      console.error(`✗ דחיית הצעה נכשלה (${q.event_name}): ${rejectError.message}`)
      process.exit(1)
    }
    rejected++
  }
}

console.log(
  `✓ נוצרו ${CUSTOMERS.length} לקוחות ו-${QUOTES.length} הצעות ` +
    `(${QUOTES.length - approved - rejected} בתהליך · ${approved} מאושרת · ${rejected} נדחו).`,
)
console.log('  איפוס: node scripts/demo-seed.mjs --reset')
