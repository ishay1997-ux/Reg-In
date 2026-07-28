// לוגיקה עסקית של מודול 2 (לקוחות) — SSOT יחיד (כלל 14): כל כלל נכתב כאן פעם אחת ונבדק,
// וה-UI (Phase 3) וה-api רק מייבאים. גם בוחר-הלקוח של מודול 3 (הצעות מחיר) מייבא מכאן את
// חיפוש-הלקוח הסלחני (§7.11) — כדי שלא תיווצר לוגיקת-חיפוש כפולה שתסטה.

import { COMPANY_ID_REGEX, EMAIL_REGEX, isValidDiscountPercent } from '@/lib/validators'

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
  const companyNumber = customer.company_number ?? '' // ח"פ (מאז §7.64 עמודה עסקית, לא ה-PK)
  // איש-הקשר הראשי (inline) + כל אנשי-הקשר הנוספים (customer_contacts, §7.81) — חיפוש על פני כולם,
  // כדי שאיתור-לקוח לפי שם-איש-קשר (§7.11) יעבוד גם כשההתאמה היא לאיש-קשר משני.
  const contactNames = [
    customer.contact_name,
    ...(customer.customer_contacts ?? []).map((cc) => cc.contact_name),
  ]
  const contactMatch = contactNames.some((n) => (n ?? '').toLowerCase().includes(q))
  return company.includes(q) || contactMatch || companyNumber.startsWith(q)
}

// סינון לקוחות לפי מסך 5.6.3 + המסננת המתקדמת (מוקאפ 04): סוג-לקוח, מאושר-דיוור, אחוז-הנחה,
// יש/אין-הנחה, סטטוס (toggle-ארכיון), "נוספו-לאחרונה", וטקסט חופשי (§7.11). כל קריטריון שלא-סופק =
// לא-מסנן (משאיר את הרשומה). הפונקציה טהורה: הסף לתאריך "נוספו-לאחרונה" (createdAfter) מחושב ב-UI
// ומועבר פנימה — כדי שהיא תישאר נבדקת בלי תלות בשעון.
export function matchesCustomerFilters(customer, filters = {}) {
  const { text, customerType, marketingConsent, minDiscount, hasDiscount, status, createdAfter } =
    filters
  // סטטוס: מסננים רק כשסופק ערך מפורש. toggle-הארכיון בעמוד שולח status='active' כברירת-מחדל
  // (מציג פעילים בלבד — סטיית-הכרעה מ-5.x, ר' §9 במדריך); כשמדליקים "הצג ארכיון" הוא לא נשלח כלל.
  if (status && customer.status !== status) return false
  if (customerType && customer.customer_type !== customerType) return false
  // הסכמת-דיוור: מסננים רק כשהפילטר בוליאני מפורש; undefined/null = "לא אכפת", לא מסנן.
  if (typeof marketingConsent === 'boolean' && customer.marketing_consent !== marketingConsent) {
    return false
  }
  const discount = Number(customer.discount_percent ?? 0)
  if (minDiscount != null && discount < Number(minDiscount)) return false
  // יש/אין-הנחה (הכרעת-ישי): true = הנחה>0 · false = בדיוק 0. בוליאני-מפורש בלבד.
  if (typeof hasDiscount === 'boolean' && discount > 0 !== hasDiscount) return false
  // "נוספו-לאחרונה": created_at ≥ הסף. השוואת-Date (לא מחרוזת) עמידה להבדלי-פורמט בין +00:00 ל-Z.
  if (createdAfter && new Date(customer.created_at ?? 0) < new Date(createdAfter)) return false
  return matchesText(customer, text)
}

// מונה המסננים-הפעילים לתג-הספירה שליד כפתור-המסננת. יושב כאן ולא ב-UI כי הוא חייב להישאר
// נאמן לשדות ש-matchesCustomerFilters באמת מסננת לפיהם (אותו אובייקט filters) — שתי הרשימות
// נקראות יחד. הבחנות מכוונות: marketingConsent נספר רק כשהוא true (מסננת "מאושרי-דיוור");
// hasDiscount נספר בכל בוליאני מפורש (גם false = "בלי הנחה" הוא מסנן פעיל); minDiscount נספר
// גם כשהוא 0 (!= null ולא truthy). text/status אינם נספרים — הם פקדים נפרדים בעמוד.
export function countActiveFilters(filters = {}) {
  return (
    (filters.customerType ? 1 : 0) +
    (filters.marketingConsent === true ? 1 : 0) +
    (filters.minDiscount != null ? 1 : 0) +
    (typeof filters.hasDiscount === 'boolean' ? 1 : 0) +
    (filters.newWithinDays ? 1 : 0)
  )
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

// ---- ולידציית טופס-הלקוח (הועברה לכאן 29/07/2026 מ-CustomerFormDialog) ----
// ולידציה דו-שכבתית לפי C5 §5.6.17.4: blur (משוב מיידי) ושמירה (לפני כתיבה) חולקות את אותם
// כללים בדיוק — ולכן הם נכתבים כאן פעם אחת ונבדקים (כלל 14), וה-UI רק מייבא ומציג.
// ה-constraints ב-DB הם החומה האמיתית (ח"פ 9 ספרות, הנחה 0-100); אלה ולידציות-נוחות (כלל 9).

// מחרוזת-חובה מהאפיון (C5 §5.6.17.4) — לא לנסח מחדש: זו ההודעה המילולית שהאפיון קובע לשגיאת ח"פ.
const COMPANY_ID_ERROR = 'שגיאה: מספר ח.פ. חייב להכיל 9 ספרות בדיוק'

// ולידציה פר-שדה. שם-שדה לא-מוכר מחזיר '' (תקין) — זה מה שמאפשר ל-validateCustomerForm לעבור
// על כל מפתחות הטופס בלי להחזיק רשימת-שדות נפרדת שתסטה מהטופס בשקט.
// טלפון = חופשי-פורמט (האפיון לא קובע תבנית) עם 2 בדיקות-שפיות בלבד: ספרות+סימני-טלפון (בלי
// אותיות) ו-≥4 ספרות (הכרעות-ישי 10–11/07). אין regex-תבנית קשיח (9/10 ספרות).
export function validateCustomerField(name, value) {
  const v = String(value ?? '').trim()
  switch (name) {
    case 'company_name':
      return v.length >= 2 ? '' : 'יש להזין שם לקוח (לפחות 2 תווים).'
    case 'company_number':
      return COMPANY_ID_REGEX.test(v) ? '' : COMPANY_ID_ERROR
    case 'customer_type':
      return v ? '' : 'יש לבחור סוג לקוח.'
    case 'contact_name':
      return v ? '' : 'יש להזין שם איש קשר.'
    case 'phone': {
      // (1) תווים מותרים = ספרות + סימני-טלפון בלבד (רווח, +, -, סוגריים, נקודה) — אותיות
      //     (עברית/לטינית) נחסמות (הכרעת-ישי 11/07: "ן9999999" נשמר). (2) לפחות 4 ספרות —
      //     מתיר מספרים קצרים לגיטימיים (מוקד *XXXX) אך תופס קלט ריק-למחצה.
      if (!v) return 'יש להזין מספר טלפון.'
      if (!/^[\d\s+()\-.]+$/.test(v)) return 'מספר טלפון יכול להכיל ספרות וסימני-טלפון בלבד.'
      return v.replace(/\D/g, '').length >= 4 ? '' : 'יש להזין מספר טלפון תקין.'
    }
    case 'email':
      return EMAIL_REGEX.test(v) ? '' : 'יש להזין כתובת אימייל תקינה.'
    case 'discount_percent':
      return isValidDiscountPercent(v) ? '' : 'אחוז ההנחה חייב להיות מספר בין 0 ל-100.'
    default:
      return ''
  }
}

// ולידציה מלאה של השדות הראשיים לפני כתיבה (חובת-אפיון: כל השדות נבדקים יחד, ומה שתקין
// נשאר בטופס). מחזירה מפה {שם-שדה: הודעה} של השדות הפגומים בלבד — ריקה = הטופס תקין.
// marketing_consent מדולג במפורש (מתג בוליאני, אין לו כלל-ולידציה).
export function validateCustomerForm(form = {}) {
  const errors = {}
  for (const name of Object.keys(form)) {
    if (name === 'marketing_consent') continue
    const msg = validateCustomerField(name, form[name])
    if (msg) errors[name] = msg
  }
  return errors
}

// ולידציית אנשי-הקשר הנוספים (§7.81, הכרעת-ישי 11/07): שורה "בשימוש" (יש בה תוכן) חייבת שם +
// לפחות אחד מ{טלפון, אימייל}; מה שהוזן נבדק דרך validateCustomerField (אותם כללים כמו השדות
// הראשיים). שורה ריקה לגמרי מדולגת (replaceCustomerContacts גם מסנן שורות בלי שם).
// מחזירה מפה {_rk: {field, msg}} — ה-field קובע איזה שדה בשורה נצבע אדום.
export function validateExtraContacts(contacts = []) {
  const errors = {}
  for (const c of contacts) {
    const name = (c.contact_name ?? '').trim()
    const phone = (c.phone ?? '').trim()
    const email = (c.email ?? '').trim()
    if (!name && !phone && !email) continue
    if (!name) {
      errors[c._rk] = { field: 'contact_name', msg: 'יש להזין שם לאיש הקשר.' }
      continue
    }
    if (!phone && !email) {
      errors[c._rk] = { field: 'both', msg: 'יש להזין טלפון או אימייל לאיש הקשר.' }
      continue
    }
    const phoneMsg = phone ? validateCustomerField('phone', phone) : ''
    if (phoneMsg) {
      errors[c._rk] = { field: 'phone', msg: phoneMsg }
      continue
    }
    const emailMsg = email ? validateCustomerField('email', email) : ''
    if (emailMsg) errors[c._rk] = { field: 'email', msg: emailMsg }
  }
  return errors
}

// מדדים נגזרים לכרטיס-הלקוח (step 3.6) — 5 מדדים ממוקדי-מנהלת-לקוחות (הכרעת-ישי 11/07):
// הכנסות · מספר-אירועים · אירוע-אחרון(רדום?) · גודל-עסקה-ממוצע · ממוצע-משוב. רווח-גולמי **ירד**
// מהכרטיס (החלטת-פרסונה — יעדו מסך-הכספים מ8 ודו"ח-הניהול מ11; §9 במדריך מתעד את הסטייה).
// כולם placeholder עד שהמודול-מקור נוחת (כלל 14: לא משכפלים נוסחאות; המקור הוא המודול האחראי):
//   projectCount — נגזר מיד מאורך הרשימה (0-נראה מוחזר null כדי לא להטעות כל עוד projects deny-all).
//   totalRevenue + avgDealSize — מ-SSOT-התמחור של מ3 (src/lib/pricing.js).
//   lastEventDate + isDormant — מתאריכי-הפרויקט של מ6.
//   avgFeedback — מ-feedback_score של מ8. ⚠️ למחווט-מ8: האפיון (5.7.3) ממצע אירועי-עבר בלבד
//   (getCustomerProjects לא מסנן סטטוס — לסנן פרויקטים-שהסתיימו לפני הממוצע).
// 🚧 מ3 · 🚧 מ6 · 🚧 מ8 — רשום ב-PROJECT_MASTER §6 ("השלמות כרטיס לקוח"); כל מודול-יעד גורף
// `grep '🚧 מ<מספרו>' §6` וחוזר לחווט כאן — כלל ברזל 15.
export function deriveCustomerMetrics(projects = []) {
  // מספר-אירועים: 0-נראה → null (projects עדיין deny-all עד מ6; 0-נראה ≠ 0-אמיתי) כדי שהכרטיס
  // יציג "אין נתונים עדיין" ולא "0" מטעה.
  const projectCount = projects.length > 0 ? projects.length : null
  const scores = projects
    .map((p) => p?.feedback_score)
    .filter((s) => typeof s === 'number' && !Number.isNaN(s))
  const avgFeedback =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
  // הכנסות/גודל-עסקה (מ3) ואירוע-אחרון/רדום (מ6) — null עד החיווט. avgDealSize = totalRevenue/projectCount.
  return {
    totalRevenue: null,
    projectCount,
    lastEventDate: null,
    isDormant: null,
    avgDealSize: null,
    avgFeedback,
  }
}
