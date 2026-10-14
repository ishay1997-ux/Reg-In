// בדיקות-תקינות רכות לשעות האירוע — מודיעות, לעולם לא חוסמות (S-17: "הזמן מודיע, לעולם
// אינו מחליט"). דלת אחת לשני המסכים שקובעים שעות אירוע: בונה הצעת המחיר ודיאלוג עריכת
// פרטי האירוע בכרטיס הפרויקט (ישי 14/10: *"הם אוהבים בדיקות תקינות"*).
//
// שלוש הודעות, לפי הסדר:
//   · שעת סיום זהה לשעת ההתחלה (0 שעות) — הודעה זו בלבד: אין טעם לומר "חוצה חצות" או "ארוך".
//   · האירוע חוצה חצות (סיום לפני ההתחלה) — אותו נוסח כמו בדיאלוג הפרויקט (`CROSS_MIDNIGHT_NOTICE`).
//   · משך ארוך מהרגיל — מעל הסף שבהגדרות (`סף_אזהרת_משך_אירוע_שעות`, ברירת מחדל 10).
// חוצה-חצות וארוך יכולים להופיע יחד.

import { CROSS_MIDNIGHT_NOTICE } from './projectCard'
import { QUOTE_SCREEN_PARAM_NAMES, computeEventHours } from './quotes'

// השם חי ב-`QUOTE_SCREEN_PARAM_NAMES` (בונה ההצעה טוען אותו עם שאר פרמטרי המסך); כאן רק כינוי.
export const EVENT_DURATION_WARNING_PARAM = QUOTE_SCREEN_PARAM_NAMES.eventDurationWarningHours
export const DEFAULT_EVENT_DURATION_WARNING_HOURS = 10
export const LONG_DURATION_NOTICE = 'משך ארוך מהרגיל — כדאי לוודא את השעות'
export const SAME_TIME_NOTICE = 'שעת הסיום זהה לשעת ההתחלה'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

// ערך הפרמטר (טקסט מ-params) ⇒ מספר שעות. חסר, ריק או לא תקין ⇒ 10.
// 🔑 למה כאן כן יש ברירת מחדל, בניגוד ל-`getParamValues` שזורקת על פרמטר חסר: הסף הזה
// רק מציג או מסתיר משפט מידע מתחת לשדה — הוא לא חוסם, לא מחשב כסף ולא משנה נתון. פרמטר
// חסר (למשל לפני שהמיגרציה שלו הוחלה) אסור שיחסום עריכת הצעה או פרויקט, ו-10 הוא הערך
// שישי קבע (14/10: *"תגדיר 10 כברירת מחדל"*). `Number('')` הוא 0, ולכן ריק נבדק לפני.
export function eventDurationThreshold(rawValue) {
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
    return DEFAULT_EVENT_DURATION_WARNING_HOURS
  }
  const hours = Number(rawValue)
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_EVENT_DURATION_WARNING_HOURS
}

// `HH:MM` ⇒ רשימת הודעות `{ key, text }` (ריקה כשאין מה לומר או כשאחת השעות חסרה/לא תקינה —
// על שעה לא תקינה מודיעה הוולידציה של הטופס, לא הבדיקה הרכה).
export function eventTimeNotices(startTime, endTime, thresholdHours) {
  const start = String(startTime ?? '').trim()
  const end = String(endTime ?? '').trim()
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) return []
  if (start === end) return [{ key: 'same', text: SAME_TIME_NOTICE }]

  const notices = []
  if (end < start) notices.push({ key: 'cross-midnight', text: CROSS_MIDNIGHT_NOTICE })
  const hours = computeEventHours(start, end)
  if (hours !== null && hours > eventDurationThreshold(thresholdHours)) {
    notices.push({ key: 'long', text: LONG_DURATION_NOTICE })
  }
  return notices
}
