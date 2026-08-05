// ולידציות משותפות בין מסכים (UsersManagementPage, ProfileSettingsPage וכו') - כדי לא לשכפל regex.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const ISRAELI_MOBILE_REGEX = /^0(5[0-9])-?\d{7}$/ // נייד ישראלי: קידומת 05X (050–059) + 7 ספרות, מקף אופציונלי
export const MIN_PASSWORD_LENGTH = 6

// ח"פ לקוח (מודול 2) = בדיוק 9 ספרות. מקביל ל-CHECK customers_company_number_9_digits ב-DB
// (הגנה-לעומק — ה-DB הוא החומה האמיתית; זו ולידציית-נוחות ל-UX לפני round-trip).
// ⚠️ טלפון-לקוח = חופשי, בלי regex (החלטת ישי 10/07 — האפיון לא קובע פורמט; כלל ה-050 הוא מסך הדיילת בלבד).
export const COMPANY_ID_REGEX = /^[0-9]{9}$/

// אחוז-הנחה חוקי: מספר בטווח 0–100 (מקביל ל-CHECK customers_discount_range ב-DB).
export function isValidDiscountPercent(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100
}

// ---- מודול 3 (הצעות מחיר / מחירים) — נוספו 29/07/2026, צעד 2.2 ----
// ⚠️ תוספת בלבד לקובץ המשותף עם מודול 2 — אין נגיעה בוולידטורים שמעל השורה הזו
// (design-notes §5 + מוסכמת-shared-surface שמדריך-המיקרו מסמן).

// מק"ט: אותיות-גדולות/ספרות בהתחלה, בלי מקף-מוביל — עקבי עם החלטת-ה-Seed (C6 §9 פגם ידוע #2,
// שהחליטה על הצורה הקנונית `B-REG-TAG` ולא `-06ST`/`ST-04` שמופיעות במקורות אחרים).
export const SKU_REGEX = /^[A-Z0-9][A-Z0-9-]{0,29}$/

export function isValidSku(value) {
  return typeof value === 'string' && SKU_REGEX.test(value)
}

// ⚠️ ‏Number(null)===0 ו-Number('')===0 (לא NaN) — לכן ולידטור-"מותר 0" חייב לפסול ריק
// במפורש, אחרת שדה-מחיר שהמשתמש השאיר ריק היה עובר כ"0 חוקי" (אותה מלכודת שתועדה ב-pricing.js).
function isBlank(value) {
  return value === null || value === undefined || value === ''
}

// products.base_price/cost — CHECK מתיר 0 (למשל עלות-אפס למוצר-שירות תיאורטי).
export function isValidNonNegativePrice(value) {
  if (isBlank(value)) return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0
}

// price_tiers.special_price — CHECK ‏> 0 (לא 0, לא שלילי) ב-DB.
export function isValidPositivePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

// price_tiers.min_qty/max_qty — מספר-שלם חיובי-ממש.
export function isValidPositiveInt(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0
}

// params.אחוז_מעמ — טווח זהה ל-isValidDiscountPercent, אבל שדה-משמעות שונה (מע"מ, לא הנחת-לקוח)
// ולכן שם-פונקציה נפרד; לא מאוחדים בכוונה — נגיעה בקובץ-לקוחות מחוץ להיקף מודול 3.
// (אותה מלכודת-blank כמו isValidNonNegativePrice: מע"מ ריק אינו מע"מ 0%.)
export function isValidVatPercent(value) {
  if (isBlank(value)) return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100
}

// params.יחס_אורחים_לדיילת — חייב חיובי-ממש: 0 היה מחלק-באפס ב-recommendHostessCount (pricing.js).
export function isValidGuestsRatio(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}
