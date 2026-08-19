// לוגיקה עסקית טהורה לסגירה-תפעולית של אירוע (מודול 6, מסך 5 "סגירת אירוע" — צעד 2.3).
// מקור-האמת לצורת ה-payload וללולידציות שהשרת אוכף הוא ה-RPC `close_project_operationally`
// (docs/micro_guides/module-6.md, ↳ as-built 14/08/2026 של צעד 2.3 ושל ה-PAYLOAD CONTRACTS
// בראש ה-Phase-2). קובץ זה משקף את אותה בדיקה בצד-הלקוח — ולעולם לא סותר אותה — כדי שדנה
// תיתקל בהודעה עברית *לפני* שהיא לוחצת "שמור ושלח", לא בשגיאת-23514 גולמית מהשרת.
//
// 🚫 בכוונה: אין כאן שום חישוב-רווח, בונוס או נסיעות (AR-6 · ㉟ · R-2 — הכרעת-ישי).
// מ6 מקפיא קלטים בלבד; מ8 גוזר מהם רווח ושכר בחלון שלו.

// ⚠️ ‏Number(null) ו-Number('') מחזירים 0, לא NaN — לכן ריק נפסל במפורש לפני ההמרה, בדיוק
// כמו ב-src/lib/pricing.js. בלי זה שדה ריק היה מתחזה בשקט לערך 0 תקין.
function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// עבודה באגורות-שלמות כמו src/lib/pricing.js (§7.25/§7.74) — נמנעים מ-0.1+0.2 ≠ 0.3
// בחישוב כסף. ההמרה חזרה לשקלים קורית רק בשורת ה-return.
function toAgorotSafe(shekels) {
  const n = Number(shekels)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

// spec.md §1.4 — שבע האפשרויות בסדר-המוקאפ המדויק, כל אחת ממופה לשלושת עמודות-המסד
// (attendance_status/lateness_level/no_show_reason) ש-`close_project_operationally` דורש
// בכל שורת p_rows. ⚠️ הערכים באנגלית — זה מה שה-CHECKים `assignments_attendance_shape` ב-DB
// אוכפים, אף שהתווית שדנה רואה היא עברית (ES §12⑤/step 2.3 as-built ①).
export const ATTENDANCE_OPTIONS = [
  { label: 'הגיעה', attendance_status: 'arrived', lateness_level: null, no_show_reason: null },
  { label: 'איחרה — קל', attendance_status: 'late', lateness_level: 'light', no_show_reason: null },
  {
    label: 'איחרה — בינוני',
    attendance_status: 'late',
    lateness_level: 'medium',
    no_show_reason: null,
  },
  { label: 'איחרה — רב', attendance_status: 'late', lateness_level: 'heavy', no_show_reason: null },
  {
    label: 'לא הגיעה — חולה',
    attendance_status: 'no_show',
    lateness_level: null,
    no_show_reason: 'sick',
  },
  {
    label: 'לא הגיעה — אישור מראש',
    attendance_status: 'no_show',
    lateness_level: null,
    no_show_reason: 'approved_absence',
  },
  {
    label: 'לא הגיעה — הבריזה',
    attendance_status: 'no_show',
    lateness_level: null,
    no_show_reason: 'ghosted',
  },
]

// spec.md §1.5 — התווית על המסך אינה הערך במסד. 🔴 "לא לשלוח שוב" ⇒ `לא_לשלוח`
// (קו-תחתון, בלי המילה "שוב") — זה מה ש-`customer_hostess_preference`'s CHECK מקבל
// (schema.sql:883); כל ערך אחר ("not_send", "לא לשלוח") נדחה ב-23514 בשרת.
// המפתח כאן הוא התווית המוצגת, כי זה מה שה-UI קורא מתוך הבחירה של דנה.
export const QUALITY_MARKS = {
  מצוינת: 'מצוינת',
  בסדר: 'בסדר',
  'לא לשלוח שוב': 'לא_לשלוח',
}

// ט4-א: "לא הגיעה" (בכל שלוש הסיבות) משביתה את שדה-האיכות ואת שדה-השעות של השורה —
// "אי-אפשר לשפוט מי שלא ראית" (screens-approved.md:1424). פונקציה נפרדת כי גם
// closingValidationSummary וגם ה-UI צריכים את אותה בדיקה, ושכפולה הייתה בדיוק סוג-הסטייה
// ש-src/CLAUDE.md מזהיר מפניו.
export function isNoShowAttendance(attendanceLabel) {
  const option = ATTENDANCE_OPTIONS.find((o) => o.label === attendanceLabel)
  return option?.attendance_status === 'no_show'
}

// 🔴 `hourly_rate_snapshot` מ-`assignments` — לעולם לא `hostesses.hourly_rate` של היום
// (הקורא אחראי להעביר את הפרמטר הנכון; הפונקציה עצמה טהורה ואינה קוראת ל-DB).
// עיגול לאגורה כמו כל כסף אחר בפרויקט — למרות שהעוגן ב-spec.md §3.3 יוצא מדויק בלי עיגול,
// שעות-בפועל עשרוניות (למשל 5.5) על תעריפים עשרוניים יכולות לייצר שארית-float.
export function hostessActualCost(actualHours, hourlyRateSnapshot) {
  const hours = toFiniteNumber(actualHours)
  const rate = toFiniteNumber(hourlyRateSnapshot)
  if (hours === null || rate === null || hours < 0 || rate < 0) return 0
  return toAgorotSafe(hours * rate) / 100
}

// ט4-ב: השעות-לשורה נגזרות משעות-האירוע, וניתנות לדריסה ידנית פר-שורה. "הקלדה מנתקת
// את השורה מברירת-המחדל לתמיד, עד רענון הדף" (screens-approved.md:1229) — ולכן הפונקציה
// אינה יודעת את הערך הידני עצמו, רק אם השורה נותקה: `null` אומר לקורא "אל תיגע, השורה כבר
// שלה". אין לה גישה ל-state של הטופס — זו אחריות הקומפוננטה, לא של helper טהור.
export function defaultHoursForRow(eventHours, wasManuallyOverridden) {
  if (wasManuallyOverridden) return null
  return toFiniteNumber(eventHours)
}

// שעות-האירוע המתוכננות מ-final_start_time/final_end_time — אותה גזירה שה-RPC מריץ בשרת
// (↳ as-built ③ של צעד 2.3: "event hours from final_end_time − final_start_time, cross-midnight
// handled, fallback 24 when either time is NULL"). הערך משמש פעמיים: ברירת-המחדל של עמודת
// "שעות בפועל" (ט4-ב) והגבול העליון של שעות-פר-דיילת (event_hours + 2). חציית-חצות מודולו
// יממה — 22:00–02:00 הן 4 שעות, לא ‎-20 (S-17). נוסף בצעד 3.5 — תוספת בלבד, שום ייצוא קיים
// לא השתנה.
export function plannedEventHours(startTime, endTime) {
  const toMinutes = (value) => {
    const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ''))
    if (!match) return null
    return Number(match[1]) * 60 + Number(match[2])
  }
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  // אחת השעות חסרה ⇒ 24, בדיוק כמו ה-fallback בשרת — גבול מתירני עדיף על חסימה שגויה.
  if (start === null || end === null) return 24
  return ((end - start + 1440) % 1440) / 60
}

// עוזר-ניסוח לרשימת "מה חסר" בעברית: יחיד כשה-count הוא 1, "N <רבים>" אחרת —
// 🔴 הנחתי (לא מעוגן): רק הצירוף "N סימוני-איכות" מצוטט מילה-במילה ב-spec.md §3.3/
// screens-approved.md:1415 — צורת-היחיד וכל שאר הקטגוריות למטה הן ניסוח סביר שלי,
// לא ציטוט מאושר. ר' דוח-המסירה.
function countPhrase(count, singular, plural) {
  return count === 1 ? singular : `${count} ${plural}`
}

// רשימה עברית: פסיקים בין כל האיברים חוץ מהאחרון, ו-"ו" צמודה (בלי רווח) לאחרון —
// בדיוק כמו "2 סימוני-איכות ודוח-סיכום" (הציטוט המדויק היחיד שקיים).
function joinHebrewList(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} ו${items[items.length - 1]}`
}

// closingValidationSummary — משפט-החסימה היחיד שמוצג ליד כפתור "שמור ושלח" הכבוי,
// **במקום שבע ההודעות** של טבלת §⑦ (screens-approved.md:1414-1415). מטרתו לתפוס בצד-
// הלקוח בדיוק את מה שה-RPC אוכף בשרת (↳ as-built ③ בצעד 2.3):
//   · שעות-האירוע 0.5–24 · אורחים ≥ 0 · שעות-פר-דיילת 0..(שעות-האירוע + 2)
//   · נוכחות חובה לכל שורה · איכות חובה לכל שורה **חוץ מ**"לא הגיעה" (ט4-א)
//   · סיבה חובה כש"לא לשלוח שוב" נבחר · דוח-סיכום חובה
// 🔴 מעוגן במלואו רק לצירוף היחיד שהאפיון מצטט: "חסרים 2 סימוני-איכות ודוח-סיכום."
// שאר הקטגוריות (שעות-אירוע/אורחים/נוכחות/סיבה/שעות-שורה) בונות על אותו תבנית-משפט
// בהיעדר ציטוט חלופי — הנחתי, ר' דוח-המסירה.
export function closingValidationSummary(draft) {
  const rows = draft?.rows ?? []
  const missing = []

  const eventHours = toFiniteNumber(draft?.actualHours)
  if (eventHours === null || eventHours < 0.5 || eventHours > 24) {
    missing.push('שעות ביצוע בפועל')
  }

  const eventGuests = toFiniteNumber(draft?.actualGuests)
  if (eventGuests === null || eventGuests < 0) {
    missing.push('כמות אורחים בפועל')
  }

  let missingAttendance = 0
  let missingQuality = 0
  let missingReason = 0
  let invalidHours = 0
  const upperBound = eventHours === null ? null : eventHours + 2

  rows.forEach((row) => {
    const noShow = isNoShowAttendance(row?.attendanceLabel)

    if (!row?.attendanceLabel) missingAttendance += 1

    // ט4-א: שורת "לא הגיעה" — שדה-האיכות מושבת, לא ריק ⇒ אינו נספר כחסר.
    if (!noShow && !row?.qualityLabel) missingQuality += 1

    if (row?.qualityLabel === 'לא לשלוח שוב' && !row?.qualityReason) missingReason += 1

    // ט4-א: שעות "לא הגיעה" מאופסות ל-0 ומושבתות בשרת ובטופס — 0 תמיד בתחום, לא נבדק.
    if (!noShow) {
      const rowHours = toFiniteNumber(row?.actualHours)
      const overBound = upperBound !== null && rowHours !== null && rowHours > upperBound
      if (rowHours === null || rowHours < 0 || overBound) invalidHours += 1
    }
  })

  if (missingAttendance > 0) {
    missing.push(countPhrase(missingAttendance, 'סימון-נוכחות אחד', 'סימוני-נוכחות'))
  }
  if (missingQuality > 0) {
    missing.push(countPhrase(missingQuality, 'סימון-איכות אחד', 'סימוני-איכות'))
  }
  if (missingReason > 0) {
    missing.push(countPhrase(missingReason, 'סיבת "לא לשלוח שוב" אחת', 'סיבות ל"לא לשלוח שוב"'))
  }
  if (invalidHours > 0) {
    missing.push(countPhrase(invalidHours, 'שעה בפועל אחת שגויה', 'שעות בפועל שגויות'))
  }
  if (!draft?.hasReport) missing.push('דוח-סיכום')

  if (missing.length === 0) return null
  return `לא ניתן לסגור: חסרים ${joinHebrewList(missing)}.`
}
