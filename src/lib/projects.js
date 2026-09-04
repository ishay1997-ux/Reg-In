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

const CANCEL_TYPE_NAMES = {
  customer: 'ביטול לקוח',
  internal: 'ביטול פנימי',
  force_majeure: 'כוח עליון',
}

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
    cancel_type: cancelType,
  } = project

  // מצבים שאינם של מנהלת הפרויקטים: אצל הכספים / סגורים סופית.
  if (status === 'awaiting_invoice' || status === 'awaiting_payment') {
    return 'אצל מנהלת הכספים — אינו דורש ממך פעולה'
  }
  if (status === 'finished') return '✓ נסגר בהצלחה'
  if (status === 'cancelled') {
    if (cancelType && CANCEL_TYPE_NAMES[cancelType]) {
      return `בוטל — ${CANCEL_TYPE_NAMES[cancelType]}`
    }
    return 'הפרויקט בוטל'
  }

  // ממתין לסגירה: ההבחנה היא האם אי-פעם נשלח זימון — ‏#7 הוא המקרה החי של "מעולם לא".
  if (status === 'event_finished') {
    return rowCount === 0
      ? 'האירוע עבר ולא נסגר — לא נשלח בו אף זימון מעולם'
      : 'ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום'
  }

  // מצבים פעילים — שאלת-החוסר עצמה.
  const staffing = staffingMetric3(confirmed, required)
  const logistics = { complete: logisticsComplete(project) }
  if (staffing.complete && logistics.complete) return '✓ מוכן לאירוע'
  if (rowCount === 0) return 'לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר'

  const gap = Math.max(required - confirmed, 0)
  // המקרה של #11: כל החוסר הוא דיילת אחת שכבר אישרה זמינות — הכדור אצל דנה, לא אצלה.
  if (gap === 1 && confirmedAvailable === 1 && !pending) {
    return 'הדיילת היחידה אישרה זמינות וממתינה לאישור סופי ממך'
  }
  if (pending > 0) return pendingInvitesSentence(pending, gap)
  // לשון-יחיד לחוסר בודד — "חסרות 1" היא עברית שבורה, ובאותה שורה ממש עמודת-הדיילות
  // אומרת "חסרה 1" (gapWord). אותה תבנית-יחיד שאושרה פעמיים (נוסחי-הולידציה · זימון בודד).
  if (gap > 0) return gapWord(gap)
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

// ── נגזרות מבט-העל (משטח 1) — כל מספר, סדר ומשפט של המסך נולד כאן, לא בקומפוננטה (כלל 14) ──

// הסטטוסים שיצאו מידיה של מנהלת הפרויקטים — אצל הכספים או סגורים סופית. שורה כזאת
// במבט-העל מעומעמת ומדדי-המוכנות שלה מוצגים '—', כי מוכנות שם חסרת משמעות (הערת-המוקאפ
// שמעל לשונית "הכול"). לא מיוצא — הצרכנים עוברים דרך overviewRowKind/staffingCell.
const HANDED_OFF_STATUSES = ['awaiting_invoice', 'awaiting_payment', 'finished', 'cancelled']

// הפרש ימי-לוח בין תאריך-האירוע להיום (שלילי = עבר). Date.parse על T00:00:00Z בשני הצדדים —
// פענוח מקומי היה מזיז את התאריך סביב חצות בחלק מאזורי-הזמן בלבד (המוקש של weekdayOf ב-dates.js).
export function eventDaysFromToday(isoDate, todayIso) {
  const event = Date.parse(`${isoDate}T00:00:00Z`)
  const today = Date.parse(`${todayIso}T00:00:00Z`)
  if (Number.isNaN(event) || Number.isNaN(today)) return null
  return Math.round((event - today) / 86400000)
}

// עמודת "מתי", שורת-המשנה: עתיד בנוסח המוקאפ ("בעוד N ימים"), עבר בנוסח הארוך הנעול
// ("התקיים לפני N ימים" — §3.7, זהה בשתי הלשוניות). לשון-היחיד (היום/מחר/אתמול) לפי
// תקדים eventProximityLabel של מודול 4 — "בעוד 1 ימים" היא עברית שבורה על המסך,
// אותה תבנית-הרחבה שאושרה למשפט-הזימון-הבודד של gapSentence.
export function proximitySentence(days) {
  if (days == null) return ''
  if (days === 0) return 'היום'
  if (days === 1) return 'מחר'
  if (days === 2) return 'בעוד יומיים'
  if (days === -1) return 'התקיים אתמול'
  if (days === -2) return 'התקיים לפני יומיים'
  if (days < 0) return eventPassedSentence(-days)
  return `בעוד ${days} ימים`
}

// "יש חוסר" (⑥, בינארי — אין דירוג-חומרה, זה בדיוק ה"ציון" ש-⑧ ביטלה): במצבים הפעילים —
// מדד-דיילות או מדד-לוגיסטיקה מתחת ל-100%; ‏event_finished תמיד חסר (שלושת שדות-הסגירה
// טרם הוזנו — סגירה מעבירה את הסטטוס הלאה, ולכן עצם הישיבה בלשונית "לסגירה" היא החוסר);
// מה שיצא מידיה — לעולם לא חסר.
export function overviewHasGap(project) {
  const status = project.project_status
  if (status === 'event_finished') return true
  if (!ACTIVE_PROJECT_STATUSES.includes(status)) return false
  const required = Number(project.required_hostess_count) || 0
  const confirmed = Number(project.hostesses_confirmed) || 0
  return confirmed < required || !logisticsComplete(project)
}

// סדר-השורות הוא התשובה של המסך (⑧, S-7): חסרים תחילה, ובתוכם לפי קרבת-האירוע —
// כשה"קרבה" של תאריך שעבר היא המרחק המוחלט מהיום, בכל כיוון (אירוע שעבר לפני 5 ימים
// קרוב יותר מאירוע שעבר לפני 12). שובר-שוויון יציב: project_id — סדר-הקליטה, לא אקראי.
export function sortOverviewProjects(projects, todayIso) {
  return [...(projects ?? [])].sort((a, b) => {
    const gapDiff = Number(overviewHasGap(b)) - Number(overviewHasGap(a))
    if (gapDiff !== 0) return gapDiff
    const distA = Math.abs(eventDaysFromToday(a.final_event_date, todayIso) ?? Infinity)
    const distB = Math.abs(eventDaysFromToday(b.final_event_date, todayIso) ?? Infinity)
    if (distA !== distB) return distA - distB
    return (a.project_id ?? 0) - (b.project_id ?? 0)
  })
}

// צבע-השורה (⑥, F20): אדום = אפס שורות assignments — המימד היחיד שבו "אפס" פירושו שאיש
// לא נגע בפרויקט (שורות לוגיסטיקה נולדות אוטומטית עם הפרויקט; שורת-שיבוץ נוצרת רק כשאדם
// פעל). מעומעם = יצא מידיה. אדום נבחן רק על שורות שעוד דורשות טיפול — פרויקט מבוטל בלי
// זימונים אינו קורא לפעולה, ולכן אינו אדום.
export function overviewRowKind(project) {
  if (HANDED_OFF_STATUSES.includes(project.project_status)) return 'muted'
  if ((project.assignments_row_count ?? 0) === 0) return 'red'
  return 'plain'
}

// "חסרה 1" / "חסרות N" — לשון-יחיד לחוסר בודד, הנוסח שהמוקאפ מצייר בעמודת הדיילות.
function gapWord(gap) {
  return gap === 1 ? 'חסרה 1' : `חסרות ${gap}`
}

// עמודת "דיילות": יחס + שורת-משנה + טון. hidden ⇒ המסך מצייר '—' (מוכנות חסרת משמעות
// אחרי מסירה/ביטול). הטון: miss (אדום) רק כשאיש לא נגע — אפס שורות שיבוץ; hint (ענבר)
// לחוסר שיש לו מענה בדרך; done לעובדה סגורה. ‏≥ ולא = (§7.43): ‏7/6 הוא מאויש.
export function staffingCell(project) {
  if (project.project_status === 'cancelled') {
    return { hidden: true }
  }
  const required = Number(project.required_hostess_count) || 0
  const confirmed = Number(project.hostesses_confirmed) || 0
  const ratio = `${confirmed}/${required}`

  // פרויקט שהסתיים או שנמסר לכספים — מציג את עובדת האיוש הסופית בטון רגוע (done), לעולם לא ריק או אדום
  if (
    project.project_status === 'finished' ||
    project.project_status === 'awaiting_invoice' ||
    project.project_status === 'awaiting_payment'
  ) {
    if (required === 0) return { ratio: null, sub: '✓ אין דיילות', tone: 'done' }
    if (confirmed >= required) return { ratio, sub: '✓ מאויש', tone: 'done' }
    return { ratio, sub: confirmed > 0 ? `${confirmed} שובצו` : 'לא שובצו', tone: 'done' }
  }

  if (confirmed >= required && required > 0) return { ratio, sub: '✓ מאויש', tone: 'done' }
  const gap = Math.max(required - confirmed, 0)
  if ((project.assignments_row_count ?? 0) === 0) {
    // אחרי שהאירוע עבר, "חסרות N" כבר אינו מעשי — המוקאפ מנסח את העובדה ההיסטורית.
    const sub = project.project_status === 'event_finished' ? 'אף אחת לא שובצה' : gapWord(gap)
    return { ratio, sub, tone: 'miss' }
  }
  return { ratio, sub: gap > 0 ? gapWord(gap) : null, tone: 'hint' }
}

// עמודת "לוגיסטיקה": אפס שורות = הושלם ("✓ אין פריטים" — הכרעת-ישי 08/08, המקרה של #11).
// ‏🔴 שורת-המשנה לחוסר היא "טרם מוכנים" ולא "טרם הוזמנו" שבמוקאפ — סטייה מודעת:
// ‏list_projects_overview מחזירה ready/total בלבד, בלי מונה ordered, ולכן "לא הוזמן" אינו
// ניתן לאימות מהנתונים (פריט ordered שטרם הגיע היה הופך את המשפט לשקר). degraded-never-wrong.
// אחרי שהאירוע עבר הטון calm — הלוגיסטיקה כבר אינה עבודה (הערת-המוקאפ בלשונית "לסגירה").
export function logisticsCell(project) {
  if (project.project_status === 'cancelled') {
    return { hidden: true }
  }
  const total = project.logistics_total ?? 0
  const ready = project.logistics_ready ?? 0
  if (total === 0) return { ratio: null, sub: '✓ אין פריטים', tone: 'done' }
  if (ready >= total) return { ratio: `${ready}/${total}`, sub: '✓ מוכן', tone: 'done' }

  // פרויקט שהסתיים או שנמסר לכספים — מציג את נתוני הלוגיסטיקה שהושלמה בטון done רגוע
  if (
    project.project_status === 'finished' ||
    project.project_status === 'awaiting_invoice' ||
    project.project_status === 'awaiting_payment'
  ) {
    return { ratio: `${ready}/${total}`, sub: '✓ הושלם', tone: 'done' }
  }

  const remaining = total - ready
  return {
    ratio: `${ready}/${total}`,
    sub: remaining === 1 ? 'טרם מוכן' : 'טרם מוכנים',
    tone: project.project_status === 'event_finished' ? 'calm' : 'hint',
  }
}

// הטון של עמודת "מה חסר" — הענפים משקפים אחד-לאחד את ענפי gapSentence שמעל: אותו מצב
// שמוליד את המשפט מוליד את צבעו. miss רק על "איש לא נגע" (אפס שורות); calm לעובדות
// שאין בהן מה לעשות; השאר hint. שינוי ענף שם בלי שינוי כאן הוא באג — הבדיקות מצמידות.
export function gapTone(project) {
  const status = project.project_status
  if (HANDED_OFF_STATUSES.includes(status)) return 'calm'
  const untouched = (project.assignments_row_count ?? 0) === 0
  if (status === 'event_finished') return untouched ? 'miss' : 'hint'
  if (!overviewHasGap(project)) return 'calm'
  return untouched ? 'miss' : 'hint'
}

// שני אריחי-המדד (③): נספרים על רשימת-הפעילים של ⑫ בלבד, ולכן אינם משתנים בין הלשוניות —
// "מדד שמשתנה כשלוחצים על לשונית הוא מדד שאי-אפשר לצטט בפגישה". לעולם לא ממוזגים לאחוז
// אחד (⑨): לוגיסטיקה 100% ושיבוץ 0% ממוזגים ל"50% מוכן" — מספר שאינו מוביל לשום פעולה.
export function overviewTiles(projects) {
  const active = (projects ?? []).filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.project_status))
  const missingStaffing = active.filter(
    (p) => (Number(p.hostesses_confirmed) || 0) < (Number(p.required_hostess_count) || 0),
  )
  const missingLogistics = active.filter((p) => !logisticsComplete(p))
  return {
    staffing: {
      count: missingStaffing.length,
      noInviteCount: missingStaffing.filter((p) => (p.assignments_row_count ?? 0) === 0).length,
    },
    logistics: {
      count: missingLogistics.length,
      itemsNotReady: missingLogistics.reduce(
        (sum, p) => sum + Math.max((p.logistics_total ?? 0) - (p.logistics_ready ?? 0), 0),
        0,
      ),
    },
  }
}

// שורת-המשנה של אריח-הדיילות — נגזרת חיה (מונה ⑫-פעילים עם אפס שורות שיבוץ), לא מספר
// קשיח. לשון-יחיד/רבים כמו במוקאפ ("מתוכם 1 שלא נשלח בו אף זימון"); אפס ⇒ אין שורה —
// "לא בכוח": אין ממצא, אין משפט.
export function staffingTileSub({ count, noInviteCount }) {
  if (count === 0 || noInviteCount === 0) return null
  return noInviteCount === 1
    ? 'מתוכם 1 שלא נשלח בו אף זימון'
    : `מתוכם ${noInviteCount} שלא נשלח בהם אף זימון`
}

// שורת-המשנה של אריח-הלוגיסטיקה. 🔴 סטייה מודעת מהמוקאפ ("4 פריטים, אף אחד לא הוזמן"):
// ה-RPC אינו מחזיר מונה ordered, ולכן "אף אחד לא הוזמן" אינו ניתן לאימות — הנגזרת הישרה
// היא כמה פריטים טרם מוכנים (total−ready על הפרויקטים הפעילים החסרים).
export function logisticsTileSub({ count, itemsNotReady }) {
  if (count === 0 || itemsNotReady === 0) return null
  return itemsNotReady === 1 ? 'פריט אחד טרם מוכן' : `${itemsNotReady} פריטים טרם מוכנים`
}

// השורה השנייה של מצב-הריק-אחרי-סינון — המונה חי ("8 פרויקטים קיימים ואינם מוצגים כרגע"),
// לא מועתק מהמוקאפ. לשון-יחיד לפרויקט בודד — "1 פרויקטים קיימים" היא עברית שבורה.
export function filteredOutSentence(total) {
  return total === 1
    ? 'פרויקט אחד קיים ואינו מוצג כרגע.'
    : `${total} פרויקטים קיימים ואינם מוצגים כרגע.`
}
