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
