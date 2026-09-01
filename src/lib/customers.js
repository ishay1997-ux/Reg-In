// לוגיקה עסקית של מודול 2 (לקוחות) — SSOT יחיד (כלל 14): כל כלל נכתב כאן פעם אחת ונבדק,
// וה-UI (Phase 3) וה-api רק מייבאים. גם בוחר-הלקוח של מודול 3 (הצעות מחיר) מייבא מכאן את
// חיפוש-הלקוח הסלחני (§7.11) — כדי שלא תיווצר לוגיקת-חיפוש כפולה שתסטה.

import { COMPANY_ID_REGEX, EMAIL_REGEX, isValidDiscountPercent } from '@/lib/validators'
// חישוב סכום-הצעה מגיע מ-SSOT של מודול 3 ולעולם לא משוכפל כאן (PROJECT_MASTER §6 מורה זאת
// במפורש: "דרך ה-SSOT של התמחור — לא לשכפל נוסחה"). deriveQuoteAmount כבר עוטף את
// computeQuoteTotals ומטפל במע"מ הקפוא מול החי, ולכן זו נקודת-הכניסה הנכונה.
import { deriveQuoteAmount } from '@/lib/quotes'

// §7.3 (הכרעת ישי 06/07): תוויות סוג-הלקוח לפי האפיון הקפוא C5 §1.5.3, 1:1 מול ערכי ה-enum ב-DB
// (docs/schema.sql:43). מקור-אמת יחיד לתוויות — ה-UI לא כותב מחרוזות-עברית ידנית (מונע אי-התאמה).
export const CUSTOMER_TYPE_LABELS = {
  private_company: 'חברה פרטית',
  government: 'חברה ממשלתית',
  production_company: 'חברת הפקה',
  nonprofit: 'עמותה',
}

// 🆕 סף "טעון בירור" — הציון שמתחתיו לקוח דורש בירור אנושי (§7.80 / ה16 של מודול 8:
// ‏5=מצוין · 4=טוב · 3=בינוני · **1–2=טעון בירור**, "הקו האדום מתלכד עם סף-הבירור-הטלפוני
// הקיים"). אותו קו בדיוק חי במסד: `record_feedback` דורשת `negative_feedback_reason` בכל
// ציון **קטן מ-3** — כלומר הסף הזה אינו בחירת-מסך אלא הכלל שהמערכת כבר אוכפת.
//
// ⚠️ **ולמה המספר נכתב כאן ולא מיובא מ-`scoreTag` (src/lib/projectFinance.js), שמחזיקה את
// אותה מדרגה:** ‏`scoreTag` **זורקת** על ציון שאינו שלם (‏`Number.isInteger` — הוא נועד
// לציון-פרויקט בודד מהמסד), ואילו כאן מדובר ב**ממוצע** של כמה משובים (3.5). ייבוא היה
// מפיל את המסך; שכפול-המדרגה מסומן במפורש כדי שמי שישנה אחד ידע שיש שני.
export const SATISFACTION_ATTENTION_MAX = 3

// ממוצע-משוב ⇒ האם הלקוח ברשימת-"טעון בירור". ‏null/לא-מספר = **אין נתון**, ולא "בסדר"
// ולא "בעייתי" — ר' ההערה במסנן עצמו.
export function needsSatisfactionAttention(avgFeedback) {
  return typeof avgFeedback === 'number' && avgFeedback < SATISFACTION_ATTENTION_MAX
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
  const {
    text,
    customerType,
    marketingConsent,
    minDiscount,
    hasDiscount,
    status,
    createdAfter,
    dormantOnly,
    lowSatisfactionOnly,
  } = filters
  // סטטוס: מסננים רק כשסופק ערך מפורש. toggle-הארכיון בעמוד שולח status='active' כברירת-מחדל
  // (מציג פעילים בלבד — סטיית-הכרעה מ-5.x, ר' §9 במדריך); כשמדליקים "הצג ארכיון" הוא לא נשלח כלל.
  if (status && customer.status !== status) return false
  // "רדומים" (A3, מודול 6 · משטח 8) — `is_dormant` הוא ערך-נגזר שמוזרק לשורה **לפני** הסינון
  // (בדיוק כמו `total_revenue`), כי הפונקציה הזו טהורה ואינה יכולה לחשב אותו בעצמה: הנוסחה
  // (`isCustomerDormant`, src/lib/customerProjects.js) תלויה בנתוני-פרויקטים חוצי-לקוח וב"היום",
  // ששניהם נטענים/מחושבים ברמת-העמוד. בוליאני-מפורש בלבד — כמו כל שאר הדגלים כאן.
  if (dormantOnly === true && customer.is_dormant !== true) return false
  // 🆕 "טעון בירור" (A3 — מסנן-שביעות-הרצון שמודול 8 חייב למודול 2). אותה תבנית בדיוק כמו
  // `is_dormant`: `avg_feedback` הוא ערך-נגזר שמוזרק לשורה **לפני** הסינון, כי הוא נשען על
  // נתוני-פרויקטים חוצי-לקוח שהפונקציה הטהורה הזו אינה רואה. **ולמה `null` אינו עובר את
  // המסנן:** לקוח שאיש מלקוחותיו לא ענה על סקר אינו "לקוח לא-מרוצה" — הוא לקוח שאין עליו
  // נתון, ורשימת-הטיפול חייבת להכיל רק את מי שבאמת דורש טלפון (אותה דוקטרינת "ריק אינו 0").
  if (lowSatisfactionOnly === true && !needsSatisfactionAttention(customer.avg_feedback)) {
    return false
  }
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
    (filters.newWithinDays ? 1 : 0) +
    (filters.dormantOnly === true ? 1 : 0) +
    // 🆕 "טעון בירור" — נספר כמו `dormantOnly`: צ'יפ בוליאני חד-כיווני, ולכן רק `true` נספר.
    (filters.lowSatisfactionOnly === true ? 1 : 0)
  )
}

// אזהרת-הארכוב (§7.34, הכרעת-ישי 30/07: מתריעים ולא חוסמים). מחזירה את גוף-ההודעה,
// או null כשאין מה להתריע עליו.
//
// ⚠️ **"עדיין לא ידוע" אינו "אין הצעות פתוחות"** — וזה לא ניואנס: ההצעות נטענות בבקשה
// שנייה ונפרדת אחרי רשימת-הלקוחות, ולחיצה בשנייה שלפני שהיא חוזרת דילגה על האזהרה
// לגמרי וארכבה בשקט (נתפס 30/07/2026 בבדיקה שארכבה לקוחה אמיתית). `metrics === null`
// = טרם-נטען או שהטעינה נכשלה ⇒ שואלים. אותה דוקטרינת "ריק אינו 0" של מודול-הכסף.
//
// יושבת כאן ולא במסך כדי שהכלל יהיה נבדק — הסיווג הזה הוא החלטה עסקית, לא ניסוח.
export function archiveWarningMessage(companyName, metrics, formatMoney) {
  if (metrics === null || metrics === undefined) {
    return `עדיין לא ידוע אם ל"${companyName}" יש הצעות פתוחות — נתוני ההצעות טרם נטענו. להעביר לארכיון בכל זאת?`
  }
  const count = metrics.openCount ?? 0
  if (count <= 0) return null
  const amount =
    metrics.openQuotesValue != null ? ` בשווי ${formatMoney(metrics.openQuotesValue)}` : ''
  const what = count === 1 ? 'הצעה פתוחה אחת' : `${count} הצעות פתוחות`
  return `ל"${companyName}" ${what}${amount}. הן יישארו פעילות וימשיכו לפוג כרגיל. להעביר לארכיון בכל זאת?`
}

// מיון צד-לקוח ללחיצת-כותרת-עמודה (step 3.3). מוגדר ונבדק כאן כדי שה-UI לא ישכפל את המשווה.
// `total_revenue` נוסף בצעד 3.5: הוא **אינו** עמודה במסד אלא ערך נגזר שהעמוד מחשב מההצעות
// (דרך deriveCustomerMetrics) וממזג לשורה לפני המיון. הוא נמצא כאן ולא בעמוד כדי שהמשווה
// יישאר במקום אחד ובדוק — בדיוק כמו שאר המפתחות.
const SORT_KEYS = ['company_name', 'customer_type', 'discount_percent', 'status', 'total_revenue']
const NUMERIC_SORT_KEYS = ['discount_percent', 'total_revenue']

// key ∈ SORT_KEYS · dir ∈ 'asc'|'desc'. מחזיר עותק חדש (לא מוטציה על ה-prop). מפתח לא-מוכר =
// מוחזר עותק בלי מיון (יציב, בלי לזרוק). customer_type ממוין לפי התווית העברית שרואים בתצוגה,
// לא לפי ערך-ה-enum הלועזי — כדי שהסדר יתאים למה שהמשתמש קורא.
export function sortCustomers(customers, key, dir = 'asc') {
  if (!SORT_KEYS.includes(key)) return [...customers]
  const factor = dir === 'desc' ? -1 : 1
  return [...customers].sort((a, b) => {
    if (NUMERIC_SORT_KEYS.includes(key)) {
      // null ⇒ 0 במיון בלבד (התא עצמו מציג "—"): לקוח בלי הכנסות אכן נמצא בתחתית
      // מיון-יורד, וזה בדיוק מה שהמשתמש מצפה לו כששואל "מי הגדולים שלי".
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
//   avgFeedback — מ-feedback_score של מ8. ✅ **חובר 28/08/2026 (מ8, צעד 4.2)** — ר' ה8 למטה.
// ~~🚧 מ3~~ (שולם 05/08/2026) · 🚧 מ6 · ~~🚧 מ8~~ (שולם 28/08/2026) — רשום ב-PROJECT_MASTER §6
// ("השלמות כרטיס לקוח"); כל מודול-יעד גורף `grep '🚧 מ<מספרו>' §6` וחוזר לחווט כאן — כלל ברזל 15.
// ⚠️ סכימת סכומי-הצעות. הרעלה מכוונת: אם ולו הצעה אחת מחזירה total=null (מע"מ שלא נפתר —
// לא קפוא בהצעה ולא נטען מ-params), הסכום **כולו** מוחזר null. הסיבה: סכום שחסרה בו הצעה
// אחת נראה תקין לחלוטין, ולכן הוא מסוכן יותר מ"אין נתונים" — "ריק אינו 0" (quotes.js).
// העיגול לשתי ספרות בסוף: הסכומים כבר באגורות שלמות, אך חיבור float צובר סחף (1180.0000000001).
function sumQuoteTotals(rows, vatRate) {
  let sum = 0
  for (const row of rows) {
    const { total } = deriveQuoteAmount(row, vatRate)
    if (total === null) return null
    sum += total
  }
  return Math.round(sum * 100) / 100
}

// 🆕 ה8 · אוכלוסיית **הרווח-המצטבר** (§7.79 + ה-↳ שלו): פרויקט שהסתיים (`finished`), **או**
// פרויקט מבוטל שדמי-הביטול שלו נפתרו. **המבחן ל"נפתר" הוא הרווח הקפוא עצמו** ולא סטטוס נפרד:
// מבוטל **לעולם אינו מגיע ל-`finished`** במסד (‏CHECK `projects_closed_needs_report` מונע זאת
// פיזית), והרווח שלו נכתב **ברגע פתרון-הפה** (‏`resolve_cancellation_fee`/`record_payment`,
// הכרעת Q-4) — כלומר `final_profit` מלא **הוא** ההוכחה שהפה נפתר. גבייה אמיתית של דמי-ביטול
// לא נעלמת מהדו"חות, וּויתור נרשם כהפסד אמיתי (שלילי) ולא נמחק.
function isInProfitPopulation(project) {
  if (project?.project_status === 'finished') return true
  return project?.project_status === 'cancelled' && project?.final_profit != null
}

// 🆕 ה8 · אוכלוסיית **ממוצע-המשוב**: בעלי `feedback_status = 'completed'` בלבד — ‏C6 §2.4.1
// "מאלה שענו". ‏`sent`/`no_response`/`not_sent` אינם משתתפים גם אם משום-מה יש להם ציון.
function hasCompletedFeedback(project) {
  return project?.feedback_status === 'completed'
}

// ↳ הורחבה בצעד 3.5 (מודול 3) **בתוספת-פרמטרים בלבד**: קורא ישן שמעביר רק `projects` מקבל
// בדיוק את מה שקיבל קודם, וכל ה-null המכוונים נשמרים. `quotes` = שורות listQuotesByCustomer
// (צורת-DB גולמית), `vatRate` = המע"מ החי מ-params (ההצעות המאושרות גוברות עליו עם הקפוא שלהן).
export function deriveCustomerMetrics(projects = [], quotes = null, vatRate = null) {
  // מספר-אירועים: 0-נראה → null (projects עדיין deny-all עד מ6; 0-נראה ≠ 0-אמיתי) כדי שהכרטיס
  // יציג "אין נתונים עדיין" ולא "0" מטעה.
  const projectCount = projects.length > 0 ? projects.length : null
  // 🔴 **שינוי-התנהגות מכוון (מ8 · ה8 · §7.79, 28/08/2026): הממוצע רץ על `completed` בלבד.**
  // עד היום הוא מיצע **כל** פרויקט שיש לו ציון, בלי מסנן — פגם חי שנמדד ב-26/08 ונרשם ב-§7.79
  // ("היום הוא ממצע כל פרויקט עם ציון, בלי מסנן-סטטוס"). ⚠️ הסינון הוא על **סטטוס-המשוב** ולא
  // על סטטוס-הפרויקט: `completed` הוא בדיוק "הלקוח ענה", וזו האוכלוסייה שהאפיון נוקב בה.
  const scores = projects
    .filter(hasCompletedFeedback)
    .map((p) => p?.feedback_score)
    .filter((s) => typeof s === 'number' && !Number.isNaN(s))
  // עיגול לספרה אחת אחרי הנקודה — **וזה לא קוסמטיקה**: הערך נכנס גם לתצוגת-הכוכבים
  // (`4.6666666666666665 ★` על המסך) וגם למסנן "טעון בירור", ושניהם חייבים לראות בדיוק
  // את אותו מספר. עיגול בתצוגה בלבד היה יוצר לקוח שמוצג "3 ★" ובכל זאת יושב ברשימת ה-<3.
  const avgFeedback =
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
      : null
  const feedbackCount = scores.length

  // 🆕 רווח-גולמי מצטבר (§7.79 + ה8) — **נגזר כאן, לא מוצג בכרטיס-הלקוח**, וזו הכרעה קיימת
  // ולא השמטה: הרווח ירד מהכרטיס בהחלטת-פרסונה (11/07) ויעדו מסך-הכספים ודו"ח-מ11, וגם
  // ה-RLS מסכים — ‏`final_profit` חי על `project_finance`, שקריאתה מגודרת ב'כספים' בלבד.
  // הנוסחה יושבת כאן כי §7.79 מורה עליה כאן ("`deriveCustomerMetrics` מקבל את שני המסננים"),
  // וכי מ11 יצרוך **את הפונקציה הזו** ולא יכתוב שנייה. 🚫 **לא למחוק כ"קוד מת".**
  //
  // ⚠️ ההרעלה זהה ל-`sumQuoteTotals`: פרויקט שבאוכלוסייה אך `final_profit` שלו אינו מספר
  // ⇒ הסכום **כולו** null. סכום שחסר בו פרויקט אחד נראה תקין לחלוטין, ולכן הוא מסוכן יותר
  // מ"אין נתונים". קורא בלי הרשאת-'כספים' (או קורא שלא ביקש את השדה כלל — מודול 2) מקבל
  // ‏null על כל לקוח שיש לו פרויקט באוכלוסייה, וזה בדיוק "אין נתונים", לא "0 ₪".
  const profitRows = projects.filter(isInProfitPopulation)
  let cumulativeProfit = null
  if (profitRows.length > 0) {
    let sum = 0
    for (const row of profitRows) {
      const value = Number(row?.final_profit)
      if (row?.final_profit == null || Number.isNaN(value)) {
        sum = null
        break
      }
      sum += value
    }
    cumulativeProfit = sum === null ? null : Math.round(sum * 100) / 100
  }

  const base = {
    projectCount,
    lastEventDate: null,
    isDormant: null,
    avgFeedback,
    // כמה משובים עומדים מאחורי הממוצע — שורת-המשנה של האריח ("מאלה שענו"). 0 אמיתי ולא null:
    // זו עובדה נכונה ("איש לא ענה"), והאריח ממילא מציג "אין נתונים עדיין" כשהממוצע null.
    feedbackCount,
    cumulativeProfit,
  }

  // מודול 3 לא חווט בקריאה הזו (קורא ישן) ⇒ null מכוון ולא 0: "אין נתונים עדיין" הוא
  // הודעה נכונה, ואילו "0 ₪" הוא טענה שקרית על לקוח שאולי הכניס מיליון.
  if (!quotes) {
    return {
      ...base,
      totalRevenue: null,
      avgDealSize: null,
      openQuotesValue: null,
      approvedCount: null,
    }
  }

  const approved = quotes.filter((q) => q?.quote_status === 'approved')
  const open = quotes.filter((q) => q?.quote_status === 'in_progress')
  const totalRevenue = sumQuoteTotals(approved, vatRate)

  return {
    ...base,
    totalRevenue,
    // הכנסות מהצעות **מאושרות בלבד** — הצעה בתהליך אינה כסף שנכנס, והצעה שנדחתה בוודאי לא.
    approvedCount: approved.length,
    // ⚠️ אפס עסקאות ⇒ null ולא 0. "גודל עסקה ממוצע 0 ₪" על מדגם ריק הוא מספר שקרי, לא נמוך —
    // אותו כלל בדיוק כמו approvalRate ב-quotes.js. חלוקה ב-0 הייתה גם מחזירה NaN למסך.
    avgDealSize:
      totalRevenue !== null && approved.length > 0
        ? Math.round((totalRevenue / approved.length) * 100) / 100
        : null,
    // מדד אחר לגמרי מהכנסות: כמה כסף ממתין להחלטת הלקוח **עכשיו**. לקוח עם 0 הכנסות
    // ו-16,520 ₪ פתוחים אינו לקוח חסר-ערך, והכרטיס חייב להראות את ההבדל.
    openQuotesValue: sumQuoteTotals(open, vatRate),
    // ⚠️ **0 אמיתי ולא null** (בשונה מהסכומים): זו התשובה "אין הצעות פתוחות", ואזהרת-הארכוב
    // (§7.34, הכרעת-ישי 30/07) נשענת עליה כדי **לא** להופיע. null כאן היה מתפרש כ"לא ידוע"
    // ומדליק חלון-וידוא על לקוח נקי לגמרי — בדיוק החיכוך שההכרעה מ-11/07 באה למנוע.
    // הספירה גם אינה תלויה במע"מ, ולכן היא אמינה גם כשהסכום עצמו אינו ניתן לחישוב.
    openCount: open.length,
  }
}
