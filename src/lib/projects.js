// הלוגיקה העסקית של מודול 6 (פרויקטים) — מקור-אמת יחיד לתוויות, לצבעים, לשני
// מדדי-המוכנות ולעמודת "מה חסר". ה-UI רק מייבא (כלל ברזל 14); קומפוננטה שמחשבת
// יחס/משפט בעצמה היא פגם.
import { finalAssignmentRows } from '@/lib/hostesses'

// אוצר-המילים הנעול של spec.md §1.1 — ⑲: ‏event_finished מוצג "ממתין לסגירה".
// "אירוע הסתיים" הוא ערך-המסד, לא תווית — כתיבתו על מסך היא ההכרעה שהכי קל לשבור.
export const PROJECT_STATUS_LABELS = {
  not_started: 'טרם החל',
  in_progress: 'בתהליך',
  ready: 'מוכן לביצוע',
  event_finished: 'ממתין לסגירה',
  awaiting_invoice: 'ממתין לחשבונית',
  awaiting_payment: 'ממתין לתשלום',
  finished: 'פרויקט הסתיים',
  cancelled: 'בוטל',
}

// ‏S-1. ממופתח לפי התווית המוצגת — כי זה מה ש-StatusTag מחפש, ופספוס שם נופל
// ל-muted בלי שגיאה. הצבע הוא משמעות:
// · "בתהליך" אפור — רוב שורות המבט-על "בתהליך", וטון שצובע את הרוב מפסיק להפריד.
// · "מוכן לביצוע" teal ולא ירוק — 🔄6② קובע שהמצב הפיך; ירוק אומר "סגור, אין מה לעשות".
// · "בוטל" מקווקו ולא אדום — מצב סופי תקין, לא כישלון; אדום שמור ל"מה חסר" (F20).
export const PROJECT_STATUS_TONES = {
  'טרם החל': 'muted',
  בתהליך: 'muted',
  'מוכן לביצוע': 'teal',
  'ממתין לסגירה': 'warn',
  'ממתין לחשבונית': 'muted',
  'ממתין לתשלום': 'muted',
  'פרויקט הסתיים': 'ok',
  בוטל: 'dashed',
}

// שכבת-הדיווח של שומר ①: ‏StatusTag נופל ל-muted בשקט על תווית זרה, ולכן מסלול
// מודול 6 עובר דרך הפונקציה הזאת — שצועקת במקום להצביע אפור. הבדיקות נשענות על הזריקה.
export function resolveProjectTone(label) {
  const tone = PROJECT_STATUS_TONES[label]
  if (!tone) throw new Error(`תווית סטטוס-פרויקט לא ממופה: "${label}"`)
  return tone
}

// ⑫ — "פעיל" מוגדר פעם אחת. ‏ready פעיל (פרויקט נכנס ויוצא ממנו), ‏cancelled לא.
// מחליף את OPEN_PROJECT_STATUSES של מודול 4, שהשמיט את ready (צעד 2.6).
export const ACTIVE_PROJECT_STATUSES = ['not_started', 'in_progress', 'ready']

// מדד-השיבוץ (🔄4): נספר על השורה הקובעת בלבד — MAX(assignment_number) פר-דיילת —
// אחרת דיילת שסירבה-וזומנה-שוב נספרת פעמיים. אותו קיפול שכבר חי ב-hostesses.js
// וב-list_projects_overview במסד; עוגן #8 (9 שורות ⇒ 1/6) הוא מה שמצמיד את שלושתם.
export function staffingMetric(assignmentRows, requiredCount) {
  const confirmed = finalAssignmentRows(assignmentRows).filter(
    (row) => row.assignment_status === 'finally_approved',
  ).length
  const required = Number(requiredCount) || 0
  return { confirmed, required, complete: confirmed >= required && required > 0 }
}

// מדד-הלוגיסטיקה (§1.3): רק ready נספר — פריט שהוזמן ולא הגיע זהה במדד לפריט שאיש
// לא נגע בו. אפס שורות = הושלם (אירוע בלי לוגיסטיקה אינו "0% מוכן").
export function logisticsMetric(logisticsRows) {
  const rows = logisticsRows ?? []
  const ready = rows.filter((row) => row.item_status === 'ready').length
  return { ready, total: rows.length, complete: rows.length === 0 || ready === rows.length }
}

// הנוסח האחיד לאירוע שעבר — הכרעת-ישי 18/08/2026: הצורה הארוכה ("התקיים לפני…")
// בשתי הלשוניות; המוקאפ נשא שני ניסוחים שונים ואחד נבחר.
export function eventPassedSentence(days) {
  return `התקיים לפני ${days} ימים`
}

const ALL_DONE = 'הכול סגור — אין מה לעשות'

// עמודת "מה חסר" (⑧): משפט במילים, לעולם לא ציון. סדר הענפים = סדר-הקדימות:
// מצב-החיים של הפרויקט קודם, ורק בתוך המצבים הפעילים נשאלת שאלת-החוסר.
// הקלט הוא שורת ה-RPC ‏list_projects_overview כפי שהיא; ‏confirmed_available הוא
// שדה-רשות שהמסך יכול לצרף משורות-השיבוץ (ה-RPC אינו מחזיר אותו).
export function gapSentence(project) {
  const {
    project_status: status,
    required_hostess_count: required,
    hostesses_confirmed: confirmed,
    pending_invites: pending,
    assignments_row_count: rowCount,
    confirmed_available: confirmedAvailable,
  } = project

  // מצבים שאינם של מנהלת הפרויקטים: אצל הכספים / סגורים סופית.
  if (status === 'awaiting_invoice' || status === 'awaiting_payment') {
    return 'אצל מנהלת הכספים — אינו דורש ממך פעולה'
  }
  if (status === 'finished' || status === 'cancelled') return ALL_DONE

  // ממתין לסגירה: ההבחנה היא האם אי-פעם נשלח זימון — ‏#7 הוא המקרה החי של "מעולם לא".
  if (status === 'event_finished') {
    return rowCount === 0
      ? 'האירוע עבר ולא נסגר — לא נשלח בו אף זימון מעולם'
      : 'ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום'
  }

  // מצבים פעילים — שאלת-החוסר עצמה.
  const staffing = staffingMetric3(confirmed, required)
  const logistics = { complete: logisticsComplete(project) }
  if (staffing.complete && logistics.complete) return ALL_DONE
  if (rowCount === 0) return 'לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר'

  const gap = Math.max(required - confirmed, 0)
  // המקרה של #11: כל החוסר הוא דיילת אחת שכבר אישרה זמינות — הכדור אצל דנה, לא אצלה.
  if (gap === 1 && confirmedAvailable === 1 && !pending) {
    return 'הדיילת היחידה אישרה זמינות וממתינה לאישור סופי ממך'
  }
  if (pending > 0) return pendingInvitesSentence(pending, gap)
  if (gap > 0) return `חסרות ${gap}`
  // חוסר-לוגיסטיקה בלבד (אין שורה חיה כזאת היום) — נוסח ממתין לאישור-ישי, ר' יומן-הסטיות.
  return 'הלוגיסטיקה טרם מוכנה'
}

// משפט הזימונים-הפתוחים — הנוסח המאושר של #8 ("וגם אם" מפריד בין מה שבדרך לבין מה שעוד לא
// טופל). לשון-היחיד לזימון בודד — אותה תבנית-הרחבה שישי הנהן לה בנוסחי-הולידציה של הסגירה;
// "1 זימונים ממתינים" הוא עברית שבורה על המסך. וכשהזימונים מכסים את החוסר — הצורה הקצרה,
// לעולם לא "עדיין חסרות 0" (שער-2.9, מוטציה שהוכיחה שהגבול לא היה מכוסה).
function pendingInvitesSentence(pending, gap) {
  const stillMissing = gap - pending
  if (pending === 1) {
    return stillMissing > 0
      ? `זימון אחד ממתין למענה — וגם אם תאשר, עדיין חסרות ${stillMissing}`
      : 'זימון אחד ממתין למענה'
  }
  const answerers = pending === 2 ? 'שתיהן' : 'כולן'
  if (stillMissing > 0) {
    return `${pending} זימונים ממתינים למענה — וגם אם ${answerers} יאשרו, עדיין חסרות ${stillMissing}`
  }
  return `${pending} זימונים ממתינים למענה`
}

// עזרים פנימיים ל-gapSentence — הקלט שלה הוא ספירות ה-RPC, לא שורות גולמיות,
// ולכן המדדים מחושבים כאן מהמספרים ולא דרך staffingMetric/logisticsMetric.
function staffingMetric3(confirmed, required) {
  return { complete: confirmed >= required && required > 0 }
}

function logisticsComplete(project) {
  const total = project.logistics_total ?? 0
  return total === 0 || (project.logistics_ready ?? 0) === total
}
