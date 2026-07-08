// ולידציות משותפות בין מסכים (UsersManagementPage, ProfileSettingsPage וכו') - כדי לא לשכפל regex.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const ISRAELI_MOBILE_REGEX = /^0(5[0-9])-?\d{7}$/ // נייד ישראלי: קידומת 05X (050–059) + 7 ספרות, מקף אופציונלי
export const MIN_PASSWORD_LENGTH = 6
