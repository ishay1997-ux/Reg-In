// לוגיקה עסקית של מודול 7 (מסך-הבית) — כל מספר, צבע ומשפט של המסך נולד כאן, לא
// בקומפוננטה (כלל 14). טהור לחלוטין: בלי Supabase ובלי שעון — "היום" תמיד פרמטר,
// אחרת הבדיקות מוכיחות את השעון ולא את הכללים.
//
// הקלט הוא ה-jsonb של get_dashboard_summary() (RPC יחיד למסך-הבית) — ר' הכותרת
// של supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql לצורת
// הפלט המלאה. ⛔ לוגיקה שכבר קיימת (ACTIVE_PROJECT_STATUSES, overviewHasGap,
// eventDaysFromToday מ-src/lib/projects.js; deriveQuoteExpiry מ-src/lib/quotes.js)
// לא משוכפלת כאן — הקובץ הזה רק מרכיב אותה מחדש לצורת מסך-הבית.

import { ACTIVE_PROJECT_STATUSES, overviewHasGap, eventDaysFromToday } from '@/lib/projects'
import { deriveQuoteExpiry } from '@/lib/quotes'

// אותה סמנטיקה בדיוק כמו paramNumber הפרטית ב-quotes.js ("לא נטען ≠ אפס") — מועתקת
// מקומית כי המקור שם אינו מיוצא. ⚠️ Number(null) ו-Number('') הם 0: ערך-פרמטר שלא
// נטען חייב להיפסל לפני ההמרה, אחרת "לא נטען" הופך בשקט ל-0 (סף-אזהרה 0 ימים,
// רווח 0 ₪ וכו').
function paramNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// ── צבע-הלוח (§7.94) ───────────────────────────────────────────────────────
// "חוסר" הוא בדיוק overviewHasGap (src/lib/projects.js) על פרויקט פעיל — לא הגדרה
// מקבילה. red = יש חוסר וגם האירוע בתוך warningDays ימים מהיום (כולל; אירוע שכבר
// עבר ועדיין פעיל נחשב "בתוך" — כל days<=warningDays, גם שלילי). yellow = חוסר
// רחוק יותר. green = בלי חוסר. סטטוס לא-פעיל שאינו מבוטל (event_finished/
// awaiting_invoice/awaiting_payment/finished) אינו נשאל בכלל — ירוק תמיד, בדיוק כפי
// שהוכרע ב-§7.94 ("שאלת-החוסר עצמה" שייכת רק למצבים הפעילים).
export function deriveCalendarColor(project, todayIso, warningDays) {
  // הכרעת-ישי 03/09/2026 ~18:4X: מבוטל נשאר בלוח — כמו Monday / Google Calendar,
  // לא נעלם ממנו. המנהלת צריכה לדעת שהתאריך התפנה, לא רק "לשכוח" את הפרויקט —
  // ולכן זה צבע רביעי משלו, נבדק לפני שאלת-החוסר (מבוטל אינו "פעיל" וגם לא
  // "ירוק כאילו-תקין"; הוא עובדה שונה לגמרי).
  if (project?.project_status === 'cancelled') return 'cancelled'
  if (!ACTIVE_PROJECT_STATUSES.includes(project?.project_status)) return 'green'
  if (!overviewHasGap(project)) return 'green'

  const warning = paramNumber(warningDays)
  // ⚠️ סף לא-נטען ⇒ אף פעם לא אדום (בלי ברירת-מחדל מומצאת) — כל חוסר נשאר צהוב עד
  // שמישהו יגדיר את הסף בפועל.
  if (warning === null) return 'yellow'

  const days = eventDaysFromToday(project.final_event_date, todayIso)
  if (days !== null && days <= warning) return 'red'
  return 'yellow'
}

// טהורה: מחזירה מערך חדש עם שדה color נוסף, לא נוגעת במקור (§ עקרון-הגריעה — UI
// שממיין/מקבץ לפי צבע לא צריך לדעת איך הוא מחושב).
export function colorProjects(projects, todayIso, warningDays) {
  return (projects ?? []).map((project) => ({
    ...project,
    color: deriveCalendarColor(project, todayIso, warningDays),
  }))
}

// ── ארבעת אריחי-הבית (§7.95 · §7.96 · §7.97) ───────────────────────────────
// הצורה תואמת ל-StatTile (src/components/StatTile.jsx) כדי שה-UI יוכל להזרים כמעט
// ישירות — אבל ל-StatTile יש שתי מגבלות שה-UI חייב לדעת עליהן ולא לעקוף בשקט:
// ① `value` מספרי עובר אוטומטית דרך `Money` (₪ מימין) — לא מתאים ל"4.3/5" ולא
//   לספירת-הצעות; ה-UI בונה node מפורש מ-`value`+`suffix`, לא מזרים ישירות.
// ② StatTile מציג emptyText כללי ("אין נתונים עדיין") כש-value==null — אבל
//   `masked` ו-"אין נתון" הן שתי אמירות שונות (§7.97: "לא, לא 0" מול "לא זמין
//   בתפקידך"). כרטיס עם masked=true חייב טקסט **MASKED_TEXT** דווקא, לא
//   ה-emptyText הכללי — StatTile אינו יודע להבחין ביניהן, וזו החלטת ה-UI.
export const MASKED_TEXT = 'לא זמין בתפקידך'

export function kpiCards(summary) {
  const satAvg = paramNumber(summary?.satisfaction_avg)
  const satCount = Number(summary?.satisfaction_count) || 0

  const profitVisible = Boolean(summary?.profit_visible)
  const quotesVisible = Boolean(summary?.quotes_visible)

  return [
    {
      key: 'active',
      label: 'פרויקטים פעילים',
      value: paramNumber(summary?.active_projects_count) ?? 0,
    },
    {
      key: 'satisfaction',
      label: 'שביעות רצון (90 יום)',
      value: satAvg === null ? null : satAvg.toFixed(1),
      suffix: '/5',
      sub: satAvg === null ? undefined : satisfactionSub(satCount),
    },
    {
      key: 'profit',
      label: 'רווח חודשי משוער',
      // §7.97: profit_visible=false ⇒ ממוסך; profit_visible=true עם monthly_profit
      // null ⇒ "חודש ריק" (מוסכמת "אין נתון" הכללית של הפרויקט — שונה מ-masked).
      // אף פעם אין להמיר null ל-0, בשני המקרים.
      masked: !profitVisible,
      amount: profitVisible ? paramNumber(summary?.monthly_profit) : null,
    },
    {
      key: 'quotes',
      label: 'הצעות ממתינות',
      masked: !quotesVisible,
      value: quotesVisible ? paramNumber(summary?.pending_quotes_count) : null,
    },
  ]
}

// לשון-יחיד למשוב בודד — אותו תקדים-הרחבה שכבר אושר ב-projects.js/quotes.js
// (proximitySentence, gapWord): "משוב אחד" ולא "1 משובים".
function satisfactionSub(count) {
  return count === 1 ? 'על סמך משוב אחד' : `על סמך ${count} משובים`
}

// ── "מה דורש טיפול" (המוקאפ המאושר) ─────────────────────────────────────────
// שלושה ענפים בסדר-קדימות קבוע: הסתיים-ולא-חויב (אדום) → חוסר-וקרוב (צהוב) →
// הצעה-פגה-בקרוב (צהוב). כל ענף ממוין בפני עצמו ואז מחובר — הסדר בין הענפים
// עצמו הוא ההיררכיה של "מה הכי דחוף" באותו מסך.
// ⚠️ מבוטל לעולם לא מופיע כאן, גם שהוא נשאר בלוח (03/09/2026) — אין "מה לטפל בו"
// באירוע שלא יתקיים; שני הענפים הבאים כבר מסננים לפי סטטוס ומעולם לא כוללים
// cancelled (לא event_finished/awaiting_invoice, לא ACTIVE_PROJECT_STATUSES).
export function attentionRows(summary, todayIso) {
  const today = todayIso ?? summary?.today
  const projects = summary?.projects ?? []

  return [
    ...unbilledRows(projects, today),
    ...shortageRows(projects, today, summary?.params?.event_warning_days),
    ...quoteExpiringRows(summary?.pending_quotes, today, summary?.params),
  ]
}

// (א) הסתיים ולא חויב: event_finished/awaiting_invoice שתאריכם כבר עבר. ממוין
// מהוותיק לחדש (ימים-שעברו יורד) — הכי דחוף למעלה.
function unbilledRows(projects, todayIso) {
  return projects
    .filter((p) => p.project_status === 'event_finished' || p.project_status === 'awaiting_invoice')
    .map((p) => ({ p, days: eventDaysFromToday(p.final_event_date, todayIso) }))
    .filter(({ days }) => days !== null && days < 0)
    .sort((a, b) => a.days - b.days)
    .map(({ p, days }) => ({
      kind: 'unbilled',
      tone: 'red',
      title: p.event_name,
      why: unbilledWhy(-days),
      href: `/projects/${p.project_id}`,
    }))
}

// "אתמול" ליום בודד — אותו תקדים-לשון-יחיד כמו proximitySentence ב-projects.js
// (days===-1 ⇒ 'התקיים אתמול'). "הסתיים לפני 1 ימים" הייתה עברית שבורה על המסך.
function unbilledWhy(daysPassed) {
  const whenPart = daysPassed === 1 ? 'הסתיים אתמול' : `הסתיים לפני ${daysPassed} ימים`
  return `${whenPart}, לא חויב`
}

// (ב) חוסר וקרוב: פרויקט פעיל עם overviewHasGap שהאירוע שלו בטווח days<=warningDays
// (כולל שלילי — 03/09/2026 יושר מול כלל-צבע-הלוח שמעל: פרויקט שעדיין in_progress
// אחרי שתאריך-האירוע שלו כבר עבר, ועדיין עם חוסר, הוא המקרה **הכי** דחוף, לא פחות
// דחוף — "קרוב" כלל לא היה הקריטריון הנכון לענף הזה, "עדיין-לא-טופל" הוא). סף
// לא-נטען ⇒ אי-אפשר לשפוט "בתוך-הסף" בכלל, ולכן שום פרויקט לא נכלל — בלי ברירת-
// מחדל מומצאת (אותה משמעת כמו missingPricingParamsMessage ב-quotes.js).
function shortageRows(projects, todayIso, warningDaysRaw) {
  const warning = paramNumber(warningDaysRaw)
  if (warning === null) return []
  return projects
    .filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.project_status) && overviewHasGap(p))
    .map((p) => ({ p, days: eventDaysFromToday(p.final_event_date, todayIso) }))
    .filter(({ days }) => days !== null && days <= warning)
    .sort((a, b) => a.days - b.days)
    .map(({ p }) => ({
      kind: 'shortage',
      tone: 'yellow',
      title: p.event_name,
      why: shortageWhy(p),
      href: `/projects/${p.project_id}`,
    }))
}

// עדיפות-תצוגה: איוש קודם ללוגיסטיקה (אותו סדר-ענפים כמו gapSentence ב-projects.js).
// נקרא רק על שורה שכבר ידועה כ-overviewHasGap===true, ולכן "לא חסרה איוש" גוררת
// בהכרח חוסר-לוגיסטיקה — אין צורך לבדוק שוב.
function shortageWhy(project) {
  const required = Number(project.required_hostess_count) || 0
  const confirmed = Number(project.hostesses_confirmed) || 0
  const dayOfMonth = dayOfMonthOf(project.final_event_date)
  if (confirmed < required) return `${confirmed}/${required} דיילות, ${dayOfMonth} בחודש`
  const total = project.logistics_total ?? 0
  const ready = project.logistics_ready ?? 0
  return `לוגיסטיקה ${ready}/${total}, ${dayOfMonth} בחודש`
}

// (ג) הצעה פגה בקרוב: pending_quotes===null (מי שאינו רואה 'הצעות מחיר') ⇒ מדלגים
// לגמרי, לא שגיאה. ⚠️ ה-RPC כבר סינן quote_status='in_progress' לפני שבנה את
// השורה, אבל אינו מחזיר את השדה עצמו בפלט (ר' כותרת המיגרציה) — deriveQuoteExpiry
// (quotes.js) דורש אותו כדי לא לחשב תפוגה על הצעה סגורה, ולכן משלימים אותו כאן
// במפורש במקום להחליש את הבדיקה שם.
function quoteExpiringRows(pendingQuotes, todayIso, params) {
  return (pendingQuotes ?? [])
    .map((q) => ({
      q,
      expiry: deriveQuoteExpiry(
        { ...q, quote_status: 'in_progress' },
        params?.quote_validity_days,
        todayIso,
        params?.quote_expiring_soon_days,
      ),
    }))
    .filter(({ expiry }) => expiry?.isExpiringSoon)
    .sort((a, b) => a.expiry.daysLeft - b.expiry.daysLeft)
    .map(({ q, expiry }) => ({
      kind: 'quote',
      tone: 'yellow',
      // "הצעה #41" — הנוסח המדויק מהמוקאפ המאושר; בלי שם-האירוע (אינו מוצג שם).
      title: `הצעה #${q.quote_id}`,
      why: quoteExpiryWhy(expiry.daysLeft),
      href: `/quotes/${q.quote_id}/edit`,
    }))
}

function quoteExpiryWhy(daysLeft) {
  if (daysLeft === 0) return 'פגה היום'
  if (daysLeft === 1) return 'פגה מחר'
  return `פגה בעוד ${daysLeft} ימים`
}

// ── תקציר-הפאנל: תיקרה, לא סינון (הכרעת-ישי 03/09/2026 19:3X, "זה מעולה") ───────
// המסך הוא מסך-טריאז' ולא דוח (§7.9: "רשימה אחת ממוינת, וכל שורה אומרת למה היא שם").
// התיקרה שומרת את הרצועה קריאה בחודש-שיא (‏~38 אירועים לפי מפרט-הזרע) — בלי לחתוך את
// גודל-הבעיה: שורת-הקבוצות שמתחת סופרת על **כל** הרשימה, לא רק על השורות המוצגות.
// הרשימה המלאה חיה במסכי הפרויקטים/ההצעות שכבר ממיינים ומסננים — הפאנל הזה לא צריך
// לשכפל את זה.
export const ATTENTION_CAP = 8

const ATTENTION_GROUP_DEFS = [
  { kind: 'unbilled', label: 'הסתיים ולא חויב' },
  { kind: 'shortage', label: 'חוסר קרוב' },
  { kind: 'quote', label: 'הצעה שפגה בקרוב' },
]

export function attentionSummary(summary, todayIso, cap = ATTENTION_CAP) {
  const all = attentionRows(summary, todayIso)
  const rows = all.slice(0, cap)
  // ספירה על all, לא על rows — מונה-הקבוצה חייב לשקף את גודל-הבעיה האמיתי, לא רק
  // את מה שנחתך לתוך התקרה. קבוצה בת-0 מדולגת (בלי "הצעה שפגה בקרוב (0)").
  const groups = ATTENTION_GROUP_DEFS.map(({ kind, label }) => ({
    kind,
    label,
    count: all.filter((row) => row.kind === kind).length,
  })).filter((group) => group.count > 0)
  return { rows, hidden: all.length - rows.length, groups, total: all.length }
}

// "+1 נוסף" / "+N נוספים" — אותה תבנית-הרחבה שכבר אושרה ב-gapWord/proximitySentence
// (projects.js): לשון-יחיד לפריט בודד, "1 נוספים" הייתה עברית שבורה.
export function attentionOverflowLabel(hidden) {
  if (hidden === 0) return ''
  return hidden === 1 ? '+1 נוסף' : `+${hidden} נוספים`
}

// יום-בחודש (timezone-safe) — אותו תרגיל Date.UTC כמו weekdayOf ב-dates.js: פענוח
// מקומי (`new Date(iso)`) מזיז תאריכים סביב חצות בחלק מאזורי-הזמן בלבד.
function dayOfMonthOf(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  return new Date(Date.UTC(year, month - 1, day)).getUTCDate()
}

// ── לוח-החודש (שבוע מתחיל ביום ראשון — כותרת המוקאפ: א ב ג ד ה ו ש) ──────────

export function monthStartOf(isoDate) {
  return `${String(isoDate).slice(0, 7)}-01`
}

// הזזת-חודשים בחשבון-שלמים ("חודשים מאז שנה 0"), לא Date — כך שאין תלות
// באזור-זמן ואין מלכודת-31 (Date עם יום 31 "גולש" לחודש הבא כשהוא לא קיים בו).
export function shiftMonth(monthStartIso, delta) {
  const [year, month] = String(monthStartIso).split('-').map(Number)
  const total = year * 12 + (month - 1) + delta
  const newYear = Math.floor(total / 12)
  const newMonth = total - newYear * 12 + 1
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}-01`
}

const HEBREW_MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

export function hebrewMonthTitle(monthStartIso) {
  const [year, month] = String(monthStartIso).split('-').map(Number)
  return `${HEBREW_MONTH_NAMES[month - 1] ?? ''} ${year}`
}

// תאי-הלוח: ריקים מובילים/סוגרים כדי שהרשת תמיד שלמת-שבועות (מכפלה של 7) —
// בדיוק כמו שהמוקאפ המאושר מצייר תאים ריקים בקצוות החודש.
export function monthGridCells(monthStartIso) {
  const [year, month] = String(monthStartIso).split('-').map(Number)
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, day: null, inMonth: false })
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    cells.push({ date: `${year}-${mm}-${dd}`, day, inMonth: true })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null, inMonth: false })
  return cells
}

// שורות-הפרויקטים של החודש, מקובצות לפי תאריך. ⚠️ מבוטל **כן** נכנס (הכרעת-ישי
// 03/09/2026 ~18:4X, תיקון-קדימה למיגרציה 20260903184711): הוא נשאר בלוח כמו
// Monday / Google Calendar — התאריך לא נעלם, הוא רק "התפנה"; ה-RPC כבר מחזיר
// אותו ב-projects. מפתח = ISO-date, כדי שה-UI רק יעשה lookup ולא יסנן בעצמו.
export function projectsByDate(projects, monthStartIso) {
  const monthPrefix = String(monthStartIso).slice(0, 7)
  const byDate = {}
  for (const project of projects ?? []) {
    const date = project.final_event_date
    if (typeof date !== 'string' || !date.startsWith(monthPrefix)) continue
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(project)
  }
  return byDate
}

// סינון-הלוח: צ'יפ-צבעים (Set, ארבעה ערכים — red/yellow/green/cancelled) וחיפוש-
// חופשי על שם-אירוע/שם-לקוח — אותו כלל-סלחנות (trim + lowercase) כמו
// matchesQuoteFilters ב-quotes.js. `colors` שלא נמסר ⇒ בלי סינון-צבע כלל; `colors`
// שנמסר (גם ריק) מסנן לפי חברות-בקבוצה — כל הצ'יפים כבויים באמת מסתירים הכול,
// ולא "כאילו לא נבחר כלום". ברירת-המחדל של ה-UI היא ארבעתם דלוקים.
export function filterCalendarProjects(projects, { colors, query } = {}) {
  const normalizedQuery = String(query ?? '')
    .trim()
    .toLowerCase()
  return (projects ?? []).filter((project) => {
    if (colors && !colors.has(project.color)) return false
    if (!normalizedQuery) return true
    const haystack = `${project.event_name ?? ''} ${project.customer_name ?? ''}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

// מונה-הצ'יפים (③ ליד סרגל-הלוח). מקבל פרויקטים שכבר עברו colorProjects.
export function colorCounts(coloredProjects) {
  const counts = { red: 0, yellow: 0, green: 0, cancelled: 0 }
  for (const project of coloredProjects ?? []) {
    if (project.color in counts) counts[project.color] += 1
  }
  return counts
}
