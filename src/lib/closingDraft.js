// הטיוטה-בזיכרון של לשונית סגירת-האירוע (מודול 6 · משטח 5 · צעד 3.5) — לוגיקה טהורה בלבד.
//
// 🔴 R-1 (הכרעת-ישי 14/08/2026): הטיוטה-בזיכרון היא *כל* מה שיש — אין טבלת-טיוטה, אין
// autosave, ואין navigation guard. הקובץ הזה מגלם אותה כאוסף פונקציות טהורות על מערך-שורות,
// כדי שהקומפוננטה תחזיק state אחד ותפעיל reducers בדוקים במקום לוגיקה בתוך handlers.
//
// חוזה-הפיילוד (step 1.8/2.5, מצוטט ב-api.js closeProjectOperationally): כל שורת p_rows היא
// {hostess_id, assignment_number, attendance_status, lateness_level, no_show_reason,
//  actual_hours, preference, preference_reason} — `assignment_number` הוא החלק השלישי במפתח
// המשולש והשמטתו כותבת שורה שגויה בלי שגיאה. buildPayloadRows כאן הוא המקום היחיד שממפה
// טיוטה ⇒ payload, כדי שהחוזה ייאכף פעם אחת ויינעל בבדיקות.

import {
  ATTENDANCE_OPTIONS,
  QUALITY_MARKS,
  isNoShowAttendance,
  hostessActualCost,
} from '@/lib/projectClosing'
import { finalAssignmentRows } from '@/lib/hostesses'

// ⚠️ Number('') ו-Number(null) מחזירים 0, לא NaN (המלכודת של projectClosing.js) — ריק
// נפסל במפורש לפני ההמרה, כדי ששדה ריק לא יתחזה ל-0 תקין.
function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// ── בניית שורות-הטיוטה מתוצאת getProjectAssignments ─────────────────────────

// רק finally_approved, ורק השורה הקובעת (MAX(assignment_number) פר-דיילת — הקיפול של
// spec.md §2.2(ג), אותו קיפול שה-RPC עצמו מריץ בבדיקת "הרשימה שווה לסט המאושר-סופית").
// שורה שהטיוטה בונה שלא מהקיפול הזה תיפסל בשרת עם "אינה על רשימת-הסגירה".
export function buildClosingRows(assignmentRows) {
  return finalAssignmentRows(assignmentRows)
    .filter((row) => row?.assignment_status === 'finally_approved')
    .map((row) => ({
      hostessId: row.hostess_id,
      assignmentNumber: row.assignment_number,
      // 🔴 hostesses.full_name בלבד — first_name/last_name אינם קיימים בסכמה (§10 אימות #8).
      name: row.hostesses?.full_name ?? '',
      city: row.hostesses?.city ?? '',
      // 🔴 התעריף הקפוא מרגע הזימון — לעולם לא hostesses.hourly_rate של היום (כרטיס ③).
      rateSnapshot: row.hourly_rate_snapshot,
      isShiftLead: Boolean(row.is_shift_lead),
      attendanceLabel: null,
      qualityLabel: null,
      qualityReason: '',
      // ט4-ב: null = "לא נדרסה, קחי את ברירת-המחדל משעות-האירוע"; ערך = דריסה ידנית.
      manualHours: null,
      hoursOverridden: false,
      // העמודות השמורות — למצב הקריאה-בלבד אחרי סגירה (התוויות משוחזרות מהן).
      saved: {
        attendance_status: row.attendance_status ?? null,
        lateness_level: row.lateness_level ?? null,
        no_show_reason: row.no_show_reason ?? null,
        actual_hours: row.actual_hours ?? null,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'he'))
}

// השעות האפקטיביות של שורה: no_show ⇒ 0 כפוי (ט4-א, השרת כופה גם הוא) · נדרסה ⇒ הערך
// הידני · אחרת ברירת-המחדל משעות-האירוע. eventHours מגיע משדה-הטופס החי, לא מהמסד.
export function rowEffectiveHours(row, eventHours) {
  if (isNoShowAttendance(row?.attendanceLabel)) return 0
  if (row?.hoursOverridden) return row.manualHours
  return eventHours
}

// ── reducers — כל אחד מחזיר מערך חדש, לעולם לא מוטציה ───────────────────────

function updateRow(rows, key, updater) {
  return rows.map((row) =>
    `${row.hostessId}|${row.assignmentNumber}` === key ? updater(row) : row,
  )
}

export function rowKey(row) {
  return `${row.hostessId}|${row.assignmentNumber}`
}

// בחירת-נוכחות. מעבר ל"לא הגיעה" אינו מוחק את סימון-האיכות ואת השעות הידניות — הם רק
// מושבתים על המסך ומנוטרלים ב-payload; חזרה ל"הגיעה" מחזירה את מה שכבר הוקלד (טעות-לחיצה
// רגעית לא מוחקת עבודה). הנטרול בפועל קורה ב-rowEffectiveHours וב-buildPayloadRows.
export function applyAttendance(rows, key, attendanceLabel) {
  return updateRow(rows, key, (row) => ({ ...row, attendanceLabel }))
}

// בחירת-איכות. יציאה מ"לא לשלוח שוב" מוחקת את הסיבה — סיבה שנשארת על סימון חיובי הייתה
// נשלחת לשרת כ-preference_reason של "מצוינת", עובדה שאיש לא הקליד.
export function applyQuality(rows, key, qualityLabel) {
  return updateRow(rows, key, (row) => ({
    ...row,
    qualityLabel,
    qualityReason: qualityLabel === NEGATIVE_QUALITY_LABEL ? row.qualityReason : '',
  }))
}

export function applyQualityReason(rows, key, qualityReason) {
  return updateRow(rows, key, (row) => ({ ...row, qualityReason }))
}

// הקלדה בשדה-השעות מנתקת את השורה מברירת-המחדל לתמיד (עד רענון הדף) — כרטיס ①:
// "הקלדה מנתקת את השורה מברירת-המחדל לתמיד". גם מחיקת הערך משאירה אותה מנותקת: ריק
// שנדרס הוא "ריק בכוונה", לא "תחזרו לברירת-המחדל". הערך נשמר כמחרוזת-הקלט הגולמית
// (כדי ש-"5." באמצע הקלדה לא יימחק); ההמרה למספר קורית ב-buildPayloadRows ובוולידציה.
export function applyRowHours(rows, key, value) {
  return updateRow(rows, key, (row) => ({
    ...row,
    manualHours: value === '' || value === null ? null : value,
    hoursOverridden: true,
  }))
}

// ── גבולות-הקלט של הטופס — הבית היחיד (כלל 14) ──────────────────────────────
// אותם גבולות בדיוק ש-closingValidationSummary (projectClosing.js) אוכף בתוך המשפט
// המסכם, וש-close_project_operationally אוכף בשרת: שעות-אירוע 0.5–24 · אורחים ≥ 0 ·
// שעות-שורה 0..(שעות-האירוע + 2). מיוצאים כפרדיקטים כדי שהקומפוננטה לא תקליד את
// המספרים מחדש — הקלדה-מחדש היא הסטייה ששני מקורות-אמת מייצרים בשקט.

export function eventHoursInvalid(value) {
  const n = toNumberOrNull(value)
  return n === null || n < 0.5 || n > 24
}

export function eventGuestsInvalid(value) {
  const n = toNumberOrNull(value)
  return n === null || n < 0
}

// הגבול העליון של שעות-שורה: שעות-האירוע + 2 (אכיפת-השרת) — null כשאין שעות-אירוע.
export function rowHoursUpperBound(eventHours) {
  const n = toNumberOrNull(eventHours)
  return n === null ? null : n + 2
}

// שגיאת-שעות-שורה מוצגת רק על שורה שנדרסה ידנית (ברירת-המחדל תקפה מעצם היותה
// שעות-האירוע) ולעולם לא על no_show (השעות כפויות ל-0 ומושבתות — ט4-א).
export function rowHoursOutOfRange(row, eventHours) {
  if (isNoShowAttendance(row?.attendanceLabel) || !row?.hoursOverridden) return false
  const n = toNumberOrNull(row.manualHours)
  const bound = rowHoursUpperBound(eventHours)
  return n === null || n < 0 || (bound !== null && n > bound)
}

// ── מונים ותוויות ────────────────────────────────────────────────────────────

export const NEGATIVE_QUALITY_LABEL = 'לא לשלוח שוב'

// "סומנה" = נוכחות + (איכות או "לא הגיעה" שמייתרת אותה) — כרטיס ③, שורת "5 מתוך 5 סומנו".
export function isRowMarked(row) {
  if (!row?.attendanceLabel) return false
  return isNoShowAttendance(row.attendanceLabel) || Boolean(row.qualityLabel)
}

export function markedRowsCount(rows) {
  return (rows ?? []).filter(isRowMarked).length
}

// המונה שמעל הטבלה — הצורה המצוירת במוקאפ היא "5 דיילות שובצו · כולן סומנו"; שאר הווריאנטים
// נגזרים ממנה (הנחתי: רק צורת-הכול-סומנו מצוירת; היחיד לפי תבנית לשון-היחיד שאושרה פעמיים).
export function assignedCounterText(rows) {
  const total = (rows ?? []).length
  if (total === 0) return null
  const marked = markedRowsCount(rows)
  const assigned = total === 1 ? 'דיילת אחת שובצה' : `${total} דיילות שובצו`
  if (marked === total) return `${assigned} · כולן סומנו`
  if (marked === 0) return `${assigned} · טרם סומנו`
  return `${assigned} · ${marked} סומנו`
}

// סכום שורת-הסיכום "סה"כ עלות דיילות בפועל" — סכימת hostessActualCost על השעות האפקטיביות.
export function totalActualCost(rows, eventHours) {
  return (rows ?? []).reduce(
    (sum, row) => sum + hostessActualCost(rowEffectiveHours(row, eventHours), row.rateSnapshot),
    0,
  )
}

// ── גשר אל closingValidationSummary ו-אל ה-payload ──────────────────────────

// הצורה ש-closingValidationSummary (projectClosing.js, נעוץ מצעד 2.3) מצפה לה.
export function draftForValidation({ rows, eventHours, eventGuests, hasReport }) {
  return {
    actualHours: eventHours,
    actualGuests: eventGuests,
    hasReport,
    rows: (rows ?? []).map((row) => ({
      attendanceLabel: row.attendanceLabel,
      qualityLabel: row.qualityLabel,
      qualityReason: row.qualityReason || null,
      actualHours: rowEffectiveHours(row, eventHours),
    })),
  }
}

// 📜 החוזה: שמונה מפתחות בדיוק, באנגלית, עם שלישיית-הנוכחות מ-ATTENDANCE_OPTIONS
// והמפתח `preference` (לא quality_mark) בערכי-המסד העבריים של QUALITY_MARKS.
// no_show ⇒ שעות 0 והעדפה null — השרת כופה זאת ממילא (2.3 as-built ④), אבל "אל תסתמכי
// על הזריקה" — הטופס משבית, וה-payload משקף את מה שהמסך מציג.
export function buildPayloadRows(rows, eventHours) {
  return (rows ?? []).map((row) => {
    const option = ATTENDANCE_OPTIONS.find((o) => o.label === row.attendanceLabel) ?? {}
    const noShow = option.attendance_status === 'no_show'
    // השעות עשויות לחיות בטיוטה כמחרוזת-קלט — ל-payload יוצא מספר בלבד.
    const effective = Number(rowEffectiveHours(row, eventHours))
    return {
      hostess_id: row.hostessId,
      assignment_number: row.assignmentNumber,
      attendance_status: option.attendance_status ?? null,
      lateness_level: option.lateness_level ?? null,
      no_show_reason: option.no_show_reason ?? null,
      actual_hours: noShow ? 0 : Number.isFinite(effective) ? effective : null,
      preference: noShow ? null : (QUALITY_MARKS[row.qualityLabel] ?? null),
      preference_reason:
        !noShow && row.qualityLabel === NEGATIVE_QUALITY_LABEL && row.qualityReason
          ? row.qualityReason
          : null,
    }
  })
}

// ── שבע מחרוזות-הוולידציה — מילה-במילה מהכרטיס (screens-approved.md:1406-1412) ──
// 🚫 לא לנסח מחדש. החריג היחיד: מגבלת-הקובץ — 2MB דורס את ה-10MB המאושר (הכרעת-ישי
// 14/08/2026, db_roadmap §5; המחרוזת ב-:1398 היא approved-אך-superseded), והמספר מרונדר
// מ-REPORT_MAX_BYTES שמועבר כפרמטר — לעולם לא מוקלד.

export const EVENT_HOURS_ERROR = 'חובה להזין שעות ביצוע — מספר בין 0.5 ל-24.'
export const EVENT_GUESTS_ERROR = 'חובה להזין כמות אורחים בפועל. אם לא הגיע איש — הזיני 0.'

export function reportFileErrorText(maxBytes) {
  const mb = maxBytes / 1024 / 1024
  return `חובה לצרף דוח-סיכום. קבצי PDF, JPG או PNG בלבד, עד ${mb}MB.`
}

export function attendanceMissingError(name) {
  return `חסר סימון נוכחות ל-${name}.`
}

export function qualityMissingError(name) {
  return `חסר סימון איכות ל-${name}.`
}

export const NEGATIVE_REASON_ERROR = "סימון 'לא לשלוח שוב' מחייב סיבה — היא תופיע בכרטיס הדיילת."

export function rowHoursError(name, eventHours) {
  // הגבול מאותו מקור כמו הפרדיקט — כדי שההודעה לעולם לא תנקוב במספר שונה מהבדיקה.
  const bound = rowHoursUpperBound(eventHours)
  return `${name}: שעות בפועל חייבות להיות בין 0 ל-${bound ?? '—'}.`
}

// גודל-קובץ קריא לשורת-הקובץ: מ-1MB ומעלה בעשירית-MB, מתחת — KB עם רצפת 1KB (קובץ
// בן כמה בייטים עדיין "1KB", לא "0KB" שנקרא כקובץ ריק). קלט לא-מספרי ⇒ מחרוזת ריקה.
export function fileSizeText(bytes) {
  if (!Number.isFinite(bytes)) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${Math.round(mb * 10) / 10}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
}

// בדיקת קובץ-הדוח לפני העלאה (סוג/גודל) — מחזירה את מחרוזת-הכרטיס או null כשהקובץ תקין.
// הרשימה מועברת מהמודול (closingApi) כדי שהקבועים יחיו פעם אחת ליד ה-bucket שהם משקפים.
export function validateReportFile(file, { maxBytes, allowedMime }) {
  if (!file) return reportFileErrorText(maxBytes)
  if (!allowedMime.includes(file.type)) return reportFileErrorText(maxBytes)
  if (file.size > maxBytes) return reportFileErrorText(maxBytes)
  return null
}

// ── מצב-העייפות (staleness, as-built ③) ─────────────────────────────────────
// ה-P0001 של השרת מתחיל ב"רשימת-הסגירה אינה מעודכנת" — מזוהה כמצב-בשם, לא ככשל גנרי:
// הציות להודעה ("רענני") מוחק את הטיוטה-בזיכרון, וזה נאמר למשתמשת ביושר במקום להפתיע.
export function isStalenessMessage(message) {
  return typeof message === 'string' && message.includes('רשימת-הסגירה אינה מעודכנת')
}

// הנחתי (נוסח שלי — אין ציטוט מאושר למשפט-ההשלכה): האמת שחייבת להיאמר היא שהרענון
// מוחק את מה שהוקלד. המשפט קצר ואומר בדיוק את זה.
export const STALENESS_CONSEQUENCE =
  'רענון יטען את הרשימה העדכנית — מה שהוקלד בלשונית יימחק ויהיה להזין מחדש.'

// משפט-המצב של בקרת "שליחה חוזרת" — מילה-במילה מצעד 3.5 של מדריך-המיקרו.
export const RESEND_STATE_SENTENCE = 'הסגירה נשמרה. מייל הסקר לא יצא — אפשר לשלוח שוב.'

// שורת-פירוט של שינוי-תכולה במקטע ㉔ — "כמות הדיילות: +2" / "B-REG-TAG · כחול: -50".
// change_target הוא המבחין (hostess_count מקבל תווית עברית, לוגיסטיקה מזוהה במק"ט);
// הסימן החיובי מפורש כי הדלתא היא שינוי, לא ערך — "+2" ולא "2".
export function changeLineText(line) {
  const target = line?.change_target === 'hostess_count' ? 'כמות הדיילות' : (line?.sku ?? '')
  const withColor = line?.color ? `${target} · ${line.color}` : target
  const delta = Number(line?.delta_qty)
  return `${withColor}: ${delta > 0 ? '+' : ''}${delta}`
}

// תווית-הנוכחות ההפוכה לתצוגת קריאה-בלבד אחרי סגירה: שלוש עמודות-המסד ⇒ התווית העברית.
export function attendanceLabelFromColumns({ attendance_status, lateness_level, no_show_reason }) {
  const option = ATTENDANCE_OPTIONS.find(
    (o) =>
      o.attendance_status === attendance_status &&
      o.lateness_level === (lateness_level ?? null) &&
      o.no_show_reason === (no_show_reason ?? null),
  )
  return option?.label ?? null
}

// תווית-האיכות ההפוכה: ערך-המסד ('מצוינת'/'בסדר'/'לא_לשלוח') ⇒ התווית על המסך.
export function qualityLabelFromValue(preference) {
  const entry = Object.entries(QUALITY_MARKS).find(([, value]) => value === preference)
  return entry?.[0] ?? null
}
