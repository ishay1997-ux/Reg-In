// לוגיקה עסקית של מודול 2 (לקוחות) — SSOT יחיד (כלל 14): כל כלל נכתב כאן פעם אחת ונבדק,
// וה-UI (Phase 3) וה-api רק מייבאים. גם בוחר-הלקוח של מודול 3 (הצעות מחיר) מייבא מכאן את
// חיפוש-הלקוח הסלחני (§7.11) — כדי שלא תיווצר לוגיקת-חיפוש כפולה שתסטה.

// §7.3 (הכרעת ישי 06/07): תוויות סוג-הלקוח לפי האפיון הקפוא C5 §1.5.3, 1:1 מול ערכי ה-enum ב-DB
// (docs/schema.sql:43). מקור-אמת יחיד לתוויות — ה-UI לא כותב מחרוזות-עברית ידנית (מונע אי-התאמה).
export const CUSTOMER_TYPE_LABELS = {
  private_company: 'חברה פרטית',
  government: 'חברה ממשלתית',
  production_company: 'חברת הפקה',
  nonprofit: 'עמותה',
}

// חיפוש-טקסט סלחני-אך-חד-משמעי (§7.11): מתאים אם מחרוזת-החיפוש היא תת-מחרוזת בשם-החברה
// או בשם-איש-הקשר, או **תחילית** של ה-ח"פ (company_number). ח"פ הוא מזהה ולכן התאמת-תחילית
// בלבד (לא includes) — כדי שחיפוש "514" ימצא לקוח שח"פ שלו מתחיל ב-514, בלי התאמות-אמצע מקריות.
function matchesText(customer, rawText) {
  const q = (rawText ?? '').trim().toLowerCase()
  if (q === '') return true
  const company = (customer.company_name ?? '').toLowerCase()
  const contact = (customer.contact_name ?? '').toLowerCase()
  const companyNumber = customer.company_number ?? '' // ח"פ (מאז §7.64 עמודה עסקית, לא ה-PK)
  return company.includes(q) || contact.includes(q) || companyNumber.startsWith(q)
}

// סינון לקוחות לפי מסך 5.6.3 + המסננת המתקדמת (מוקאפ 04): סוג-לקוח, מאושר-דיוור,
// אחוז-הנחה-מינימלי, וטקסט חופשי (§7.11). כל קריטריון שלא-סופק = לא-מסנן (משאיר את הרשומה).
export function matchesCustomerFilters(customer, filters = {}) {
  const { text, customerType, marketingConsent, minDiscount } = filters
  if (customerType && customer.customer_type !== customerType) return false
  // הסכמת-דיוור: מסננים רק כשהפילטר בוליאני מפורש; undefined/null = "לא אכפת", לא מסנן.
  if (typeof marketingConsent === 'boolean' && customer.marketing_consent !== marketingConsent) {
    return false
  }
  if (minDiscount != null && Number(customer.discount_percent ?? 0) < Number(minDiscount)) {
    return false
  }
  return matchesText(customer, text)
}

// מיון צד-לקוח ללחיצת-כותרת-עמודה (step 3.3). מוגדר ונבדק כאן כדי שה-UI לא ישכפל את המשווה.
const SORT_KEYS = ['company_name', 'customer_type', 'discount_percent', 'status']

// key ∈ SORT_KEYS · dir ∈ 'asc'|'desc'. מחזיר עותק חדש (לא מוטציה על ה-prop). מפתח לא-מוכר =
// מוחזר עותק בלי מיון (יציב, בלי לזרוק). customer_type ממוין לפי התווית העברית שרואים בתצוגה,
// לא לפי ערך-ה-enum הלועזי — כדי שהסדר יתאים למה שהמשתמש קורא.
export function sortCustomers(customers, key, dir = 'asc') {
  if (!SORT_KEYS.includes(key)) return [...customers]
  const factor = dir === 'desc' ? -1 : 1
  return [...customers].sort((a, b) => {
    if (key === 'discount_percent') {
      return (Number(a[key] ?? 0) - Number(b[key] ?? 0)) * factor
    }
    let av = a[key]
    let bv = b[key]
    if (key === 'customer_type') {
      av = CUSTOMER_TYPE_LABELS[av] ?? av
      bv = CUSTOMER_TYPE_LABELS[bv] ?? bv
    }
    return String(av ?? '').localeCompare(String(bv ?? ''), 'he') * factor
  })
}

// מדדים נגזרים לכרטיס-הלקוח (step 3.6). totalRevenue + grossProfit מוחזרים null **במכוון**:
// totalRevenue מגיע מ-SSOT-התמחור של מודול 3 (src/lib/pricing.js), grossProfit מרווחיות מודול 7
// (§7.79) — אין כאן נוסחת-הכנסה/רווח (כלל 14: לא משכפלים; המקור הוא המודול האחראי).
// avgFeedback נגזר מ-projects.feedback_score כשיש נתונים (מודול 8 ימלא), אחרת null.
export function deriveCustomerMetrics(projects = []) {
  const scores = projects
    .map((p) => p?.feedback_score)
    .filter((s) => typeof s === 'number' && !Number.isNaN(s))
  const avgFeedback =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
  return { totalRevenue: null, grossProfit: null, avgFeedback }
}
