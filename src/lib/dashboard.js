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
import { deriveQuoteExpiry, missingParamsMessage } from '@/lib/quotes'

// אותה סמנטיקה בדיוק כמו paramNumber הפרטית ב-quotes.js ("לא נטען ≠ אפס") — מועתקת
// מקומית כי המקור שם אינו מיוצא. ⚠️ Number(null) ו-Number('') הם 0: ערך-פרמטר שלא
// נטען חייב להיפסל לפני ההמרה, אחרת "לא נטען" הופך בשקט ל-0 (סף-אזהרה 0 ימים,
// רווח 0 ₪ וכו').
function paramNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// ── צבע-הלוח (§7.94 · R3 09/09/2026) ────────────────────────────────────────
// "חוסר" הוא בדיוק overviewHasGap (src/lib/projects.js) על פרויקט פעיל — לא הגדרה
// מקבילה. red = יש חוסר וגם האירוע בתוך warningDays ימים מהיום (כולל; אירוע שכבר
// עבר ועדיין פעיל נחשב "בתוך" — כל days<=warningDays, גם שלילי). yellow = חוסר
// רחוק יותר. green = בלי חוסר (פעיל, שני הממדים מלאים).
// 🆕 R3 (09/09/2026, הכרעת-ישי): סטטוס לא-פעיל ושאינו מבוטל (event_finished/
// awaiting_invoice/awaiting_payment/finished) הופך ל-`'past'`, צבע חמישי משלו — לא
// עוד `green`. **הפגם שזה מתקן, נמדד על המסך החי (09/09):** "טקס פרסים" מ-01/09,
// סטטוס "ממתין לסגירה", הוצג ירוק עם אייקוני-מוכנות מלאים — זהה בדיוק לאירוע-מוכן
// עתידי, בעוד רצועת "מה דורש טיפול" מכריזה על 17 אירועים כאלה שלא חויבו. §7.94
// עצמו לא נפתח מחדש: הצבע-רביעי (מבוטל) והכלל האדום/צהוב/ירוק על הציר הפעיל נשארו
// כפי שהוכרעו — זה רק מפצל את מה שהיה "ירוק תמיד" לשני מובנים שונים באמת.
export function deriveCalendarColor(project, todayIso, warningDays) {
  // הכרעת-ישי 03/09/2026 ~18:4X: מבוטל נשאר בלוח — כמו Monday / Google Calendar,
  // לא נעלם ממנו. המנהלת צריכה לדעת שהתאריך התפנה, לא רק "לשכוח" את הפרויקט —
  // ולכן זה צבע משלו, נבדק לפני שאלת-החוסר (מבוטל אינו "פעיל" וגם לא
  // "ירוק כאילו-תקין"; הוא עובדה שונה לגמרי).
  if (project?.project_status === 'cancelled') return 'cancelled'
  if (!ACTIVE_PROJECT_STATUSES.includes(project?.project_status)) return 'past'
  if (!overviewHasGap(project)) return 'green'

  const warning = paramNumber(warningDays)
  // ⚠️ סף לא-נטען ⇒ אף פעם לא אדום (בלי ברירת-מחדל מומצאת) — כל חוסר נשאר צהוב עד
  // שמישהו יגדיר את הסף בפועל.
  if (warning === null) return 'yellow'

  const days = eventDaysFromToday(project.final_event_date, todayIso)
  if (days !== null && days <= warning) return 'red'
  return 'yellow'
}

// ── מטא-הצבע (R1/R4, 09/09/2026) ────────────────────────────────────────────
// הכרעת-ישי: מילים בכל צ'יפי-הספירה ("דחוף 13" ולא נקודה+מספר), ושורת-המקרא
// מתחת ללוח נמחקת — ההגדרה המדויקת (מה "דחוף" אומר בפועל) חיה ב-title לריחוף.
// warningDays עובר כפרמטר ולא קשיח (המספר "14" קבוע במוקאפ, לא בקוד — כלל 14):
// שינוי-פרמטר עתידי לא ישאיר ניסוח שקרי, בדיוק כמו שהמקרא הקודם דאג לזה.
export function calendarColorMeta(warningDays) {
  const warning = paramNumber(warningDays)
  const soonTitle = warning === null ? 'חוסר, הסף לא נטען' : `חוסר ואירוע בתוך ${warning} יום`
  const laterTitle = warning === null ? 'חוסר, הסף לא נטען' : `חוסר, האירוע מעבר ל-${warning} יום`
  return {
    red: { label: 'דחוף', title: soonTitle },
    yellow: { label: 'לטיפול', title: laterTitle },
    green: { label: 'מוכן', title: 'איוש ולוגיסטיקה מלאים' },
    past: { label: 'התקיים', title: 'האירוע כבר קרה' },
    cancelled: { label: 'בוטל', title: 'הפרויקט בוטל' },
  }
}

// כותרות-ריחוף על אייקוני-הממד בצ'יפ (R4/R5) — "איוש 2/4"/"לוגיסטיקה 0/4". שני
// המספרים כבר יושבים על הפרויקט (מה-RPC); זו רק ניסוח-המשפט, ולכן כאן ולא ברכיב
// (כלל 14: כל משפט של המסך נולד בקובץ הזה).
export function staffingRatioLabel(project) {
  const confirmed = Number(project?.hostesses_confirmed) || 0
  const required = Number(project?.required_hostess_count) || 0
  return `איוש ${confirmed}/${required}`
}

export function logisticsRatioLabel(project) {
  const total = project?.logistics_total ?? 0
  const ready = project?.logistics_ready ?? 0
  return `לוגיסטיקה ${ready}/${total}`
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
      // 🔴 בלי `?? 0` (הוסר 03/09/2026, אודיט-הסגירה T-1): `active_projects_count` הוא שדה-חובה
      // לא-null ב-`assertDashboardShape`, ולכן הוא כבר נזרק בקול לפני שנגיע לכאן. נפילה-לאחור
      // שקטה ל-0 כאן לא הגנה על כלום — היא רק המתינה ליום שבו מישהו יוסיף את השדה ל-NULLABLE,
      // ואז "לא ידוע" היה מוצג כ-"0 פרויקטים פעילים" על מסך ששלושת האריחים האחרים בו מקפידים
      // להציג "—". השער הרועש נשאר הערובה; המסך מציג `—` אם בכל זאת אין ערך.
      label: 'פרויקטים פעילים',
      value: paramNumber(summary?.active_projects_count),
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

// ── שורת-פרמטר חסרה (הכרעת-ישי 03/09/2026, אודיט-הסגירה T-1) ────────────────
// 🔴 **הכשל שזה מונע, במילים של המסך:** בלי `ימי_אזהרה_קדם_אירוע` הלוח **לעולם לא מאדים**
// ‏(`deriveCalendarColor` מחזיר yellow) ורצועת "מה דורש טיפול" **מוותרת על ענף-החוסר לגמרי**
// (`staffingShortageRows`/`logisticsShortageRows` מחזירות []) — ואז המסך מכריז "✓ אין" בזמן שלאירוע
// בעוד שלושה ימים חסרות דיילות. הסירוב להמציא ברירת-מחדל נכון ונשאר; מה שחסר היה **לומר**.
// אותו באנר ואותו נוסח בדיוק כמו מסך-ההצעות — `missingParamsMessage` ב-`src/lib/quotes.js`.
//
// ⚖️ **ולמה רק מה שרלוונטי לצופה:** שני פרמטרי-ההצעות משפיעים על המסך הזה **רק** דרך ענף
// "הצעה פגה בקרוב", וענף זה כבר לא קיים אצל מי שאינו רואה הצעות (`quotes_visible=false` ⇒
// ‏`pending_quotes` הוא null). לדווח למנהלת-הגיוס על פרמטר שאינו משנה דבר במסך שלה זה רעש,
// והרעש הוא מה שגורם לבאנרים להיקרא כרקע. ⇒ המפתחות נמסרים לפי מה שבאמת פעיל אצלה.
export function missingDashboardParamsMessage(summary) {
  const params = summary?.params
  const values = { eventWarningDays: params?.event_warning_days }
  if (summary?.quotes_visible) {
    values.validityDays = params?.quote_validity_days
    values.expiringSoonDays = params?.quote_expiring_soon_days
  }
  return missingParamsMessage(values)
}

// ── "מה דורש טיפול" (המוקאפ המאושר; R2/R6 09/09/2026) ────────────────────────
// ארבעה ענפים בסדר-קדימות קבוע: הסתיים-ולא-חויב (אדום) → חוסר-איוש (אדום, R2) →
// חוסר-לוגיסטיקה (אדום, R2) → הצעה-פגה-בקרוב (צהוב). כל ענף ממוין בפני עצמו ואז
// מחובר — משמש כמנוע-הביניים ל-`attentionCategories` (R6), שממיין את השורות
// לארבעת כרטיסי-המחלקה. ⚠️ מבוטל לעולם לא מופיע כאן, גם שהוא נשאר בלוח (03/09) —
// אין "מה לטפל בו" באירוע שלא יתקיים; שלושת הענפים האחרונים כבר מסננים לפי סטטוס
// ומעולם לא כוללים cancelled (לא event_finished/awaiting_invoice, לא ACTIVE_PROJECT_STATUSES).
export function attentionRows(summary, todayIso) {
  const today = todayIso ?? summary?.today
  const projects = summary?.projects ?? []
  const warning = summary?.params?.event_warning_days

  return [
    ...unbilledRows(projects, today),
    ...staffingShortageRows(projects, today, warning),
    ...logisticsShortageRows(projects, today, warning),
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

// (ב) חוסר וקרוב, מפוצל לשני ממדים (R2/R6, 09/09/2026 — היה ענף אחד "shortage").
// **R2:** ה-tone הפך מ-yellow ל-red — זו אותה הגדרת-"חוסר-וקרוב" בדיוק כמו הצבע
// האדום בלוח (deriveCalendarColor), ולא היה הגיוני שהן ייצבעו אחרת באותו מסך (נמדד
// על "כנס מכירות" 09/09: אדום בלוח, נקודה צהובה ברצועה — אותה שורה בדיוק).
// **R6:** הפיצול לאיוש/לוגיסטיקה מאפשר שני כרטיסי-מחלקה נפרדים (מנהלת-גיוס מול
// מנהלת-לוגיסטיקה) — פרויקט עם שני החוסרים נספר בשניהם, במכוון (זה מה שכל מנהלת
// צריכה לראות בתור שלה). "קרוב" הוא אותו טווח days<=warningDays כולל שלילי (03/09:
// פרויקט שעדיין in_progress אחרי שתאריך-האירוע עבר הוא המקרה הכי דחוף, לא פחות).
// סף לא-נטען ⇒ אי-אפשר לשפוט "בתוך-הסף" בכלל, ולכן שום פרויקט לא נכלל — בלי
// ברירת-מחדל מומצאת (אותה משמעת כמו missingPricingParamsMessage ב-quotes.js).
function staffingShortageRows(projects, todayIso, warningDaysRaw) {
  const warning = paramNumber(warningDaysRaw)
  if (warning === null) return []
  return projects
    .filter(
      (p) =>
        ACTIVE_PROJECT_STATUSES.includes(p.project_status) &&
        (Number(p.hostesses_confirmed) || 0) < (Number(p.required_hostess_count) || 0),
    )
    .map((p) => ({ p, days: eventDaysFromToday(p.final_event_date, todayIso) }))
    .filter(({ days }) => days !== null && days <= warning)
    .sort((a, b) => a.days - b.days)
    .map(({ p }) => ({
      kind: 'staffing',
      tone: 'red',
      title: p.event_name,
      why: staffingWhy(p),
      href: `/projects/${p.project_id}`,
    }))
}

function staffingWhy(project) {
  const required = Number(project.required_hostess_count) || 0
  const confirmed = Number(project.hostesses_confirmed) || 0
  const dayOfMonth = dayOfMonthOf(project.final_event_date)
  return `${confirmed}/${required} דיילות, ${dayOfMonth} בחודש`
}

function logisticsShortageRows(projects, todayIso, warningDaysRaw) {
  const warning = paramNumber(warningDaysRaw)
  if (warning === null) return []
  return projects
    .filter((p) => {
      if (!ACTIVE_PROJECT_STATUSES.includes(p.project_status)) return false
      const total = p.logistics_total ?? 0
      const ready = p.logistics_ready ?? 0
      return total > 0 && ready < total
    })
    .map((p) => ({ p, days: eventDaysFromToday(p.final_event_date, todayIso) }))
    .filter(({ days }) => days !== null && days <= warning)
    .sort((a, b) => a.days - b.days)
    .map(({ p }) => ({
      kind: 'logistics',
      tone: 'red',
      title: p.event_name,
      why: logisticsWhy(p),
      href: `/projects/${p.project_id}`,
    }))
}

function logisticsWhy(project) {
  const total = project.logistics_total ?? 0
  const ready = project.logistics_ready ?? 0
  const dayOfMonth = dayOfMonthOf(project.final_event_date)
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

// ── ארבעה כרטיסי-מחלקה (R6, 09/09/2026 — מחליף את מנגנון-התקרה/ייצוג-הקבוצות) ──
// עד כאן הרצועה הציגה תקרה של 4 שורות-פרויקט בודדות מתוך רשימה משותפת. ישי שאל
// "זה יעזור למנכ"ל עם איזה מנהל לדבר?" — והתשובה היא שהחלוקה הנכונה היא **לפי
// מחלקה**, לא לפי שורה: כל קטגוריה שייכת בדיוק לתפקיד אחד (נמדד ב-e2e/dashboard.spec.js
// שורות 21-25: `quotes:true` רק אצל ceo/finance/**projects** — כלומר הצעות-מחיר
// שייכות למנהלת-פרויקטים, לא לתפקיד-מכירות נפרד). ⇒ ארבעה כרטיסים קבועים, כל אחד עם
// נקודת-צבע + מונה + הפריט הדחוף ביותר שבו, ולחיצה עליו פותחת את מסך המודול של
// המנהלת שבאמת מטפלת בו — זו התשובה בפועל ל"עם מי מדברים", לא רק מספר.
const ATTENTION_CATEGORY_DEFS = [
  { kind: 'unbilled', label: 'כספים', role: 'מנהלת כספים', href: '/finance', tone: 'red' },
  { kind: 'staffing', label: 'דיילות', role: 'מנהלת גיוס', href: '/hostesses', tone: 'red' },
  {
    kind: 'logistics',
    label: 'לוגיסטיקה',
    role: 'מנהלת לוגיסטיקה',
    href: '/logistics',
    tone: 'red',
  },
  { kind: 'quote', label: 'הצעות', role: 'מנהלת פרויקטים', href: '/quotes', tone: 'yellow' },
]

// `topLine` הוא הפריט הדחוף ביותר בקטגוריה, בניסוח-שם+"למה" זהה למה שהיה מוצג בשורה
// הבודדת קודם (title + why) — כי אלה כבר הניסוחים שאושרו, לא הומצא ניסוח חדש.
function categoryCard(kind, rows) {
  const first = rows?.[0]
  return {
    count: rows ? rows.length : null,
    topLine: first ? `${first.title} — ${first.why}` : null,
    masked: rows === null,
  }
}

export function attentionCategories(summary, todayIso) {
  const today = todayIso ?? summary?.today
  const projects = summary?.projects ?? []
  const warning = summary?.params?.event_warning_days
  // הצעות ממוסך: אותו predicate בדיוק כמו kpiCards (§7.97) — quotes_visible=false ⇒
  // pending_quotes הוא null מה-RPC, ואין לחייב חישוב על אוכלוסייה שלא קיימת אצלה.
  const quotesVisible = Boolean(summary?.quotes_visible)

  const rowsByKind = {
    unbilled: unbilledRows(projects, today),
    staffing: staffingShortageRows(projects, today, warning),
    logistics: logisticsShortageRows(projects, today, warning),
    quote: quotesVisible
      ? quoteExpiringRows(summary?.pending_quotes, today, summary?.params)
      : null,
  }

  return ATTENTION_CATEGORY_DEFS.map((def) => ({
    ...def,
    ...categoryCard(def.kind, rowsByKind[def.kind]),
  }))
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
  const counts = { red: 0, yellow: 0, green: 0, past: 0, cancelled: 0 }
  for (const project of coloredProjects ?? []) {
    if (project.color in counts) counts[project.color] += 1
  }
  return counts
}
