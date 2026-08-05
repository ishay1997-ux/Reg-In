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

if (process.argv.includes('--reset')) {
  const removed = await reset()
  console.log(`✓ נמחקו ${removed} לקוחות-דמו והצעותיהם.`)
  process.exit(0)
}

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
