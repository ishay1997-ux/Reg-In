// שכבת-ההרכבה של Smart Match: **שורות-מסד ⇒ הקלט ש-`rankCandidates` דורש**, ובנוסף
// הנתונים שצ'יפי-ההנמקה מציגים. טהור — בלי Supabase ובלי שעון.
//
// 🔑 **למה קובץ נפרד מ-`smartMatch.js`:** שם יושבת **הנוסחה** (ארבע השכבות, המשקולות,
// הריסון) והיא ה-SSOT שאסור לגעת בו; כאן יושבת **התרגום** מהסכמה אליה. ערבוב השניים היה
// גורם לכל שינוי-סכמה להיראות כמו שינוי-אלגוריתם.
//
// 🔴 **וכל הדיילות עוברות דרך כאן, גם מי שתיפסל בשער** — `C` (ממוצע-החברה) מחושב עליהן,
// וסינון מוקדם היה משנה אותו ואת כל הדירוג. נמדד כמלכודת אמיתית ב-`§11.3`.

import { responsivenessCounts, candidateDistanceKm } from '@/lib/smartMatch'
import {
  finalAssignmentRows,
  weeksSinceLastWorked,
  eventWasCancelled,
  optionalNumber,
} from '@/lib/hostesses'

const MS_PER_HOUR = 60 * 60 * 1000

// ── חלון-החישוב · 12 ⇐ 24 חודשים ─────────────────────────────────────────────
//
// ✏️ **נבנה 25/09/2026, בהכרעת-ישי (אודיט השיבוץ-החכם, פער 3).** עד אז ההיענות והאמינות נספרו
// על **כל** ההיסטוריה — ‏50% משורות-השיבוץ במסד היו מלפני יותר משנה — בעוד שני הפרמטרים נשמרו
// ונערכו במסך-ההגדרות, והרמז שם הודה ש"החישוב טרם משתמש בו".
// ‏**המקור:** `research §11.1` — *"12 חודשים, מתרחב ל-24 אם <3 תשובות בחלון"* · והנחות 3–4
// שאושרו בבלופרינט (`module-4.md` §Assumptions): **סופרים קודם בחלון הבסיסי, ומרחיבים רק אם
// יש פחות מהסף — ואז סופרים מחדש** · **‏`C` על חלון בסיסי אחד וקבוע**, כי הוא תכונה של החברה.
//
// 🔑 **החלון נמדד אחורה מהיום, לא מתאריך-האירוע** — אחרת `C` היה משתנה בין שני אירועים בלי
// ששום דבר בחברה השתנה, בדיוק מה ש-`§11.3` אוסר (*"`C` הוא תכונה של החברה בחלון-זמן, לא של
// האירוע"*). שורה נכנסת לחלון לפי **תאריך-האירוע שלה**, ⚠️ ושורה בלי תאריך **נשארת בפנים** —
// הוצאה על סמך נתון חסר היא בדיוק החור השקט.
// 🔑 **והחלון נקבע פעם אחת לדיילת, לפי התשובות שלה, וחל על כל המרכיבים שלה** (היענות · אמינות ·
// זמן-תגובה): האפיון מגדיר את ההרחבה לפי *תשובות*, ולדיילת אחת אין שני "עברים" שונים.
function monthsBefore(isoDate, months) {
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 - months, 1))
  // 31/03 פחות חודש הוא 28/02 ולא 03/03 — יום-החודש נחתך לאורך החודש שאליו חוזרים.
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

function rowEventDate(row) {
  return row?.projects?.final_event_date ?? row?.event_date ?? null
}

function rowsSince(rows, cutoffIso) {
  return rows.filter((row) => {
    const date = rowEventDate(row)
    return !date || String(date) >= cutoffIso
  })
}

// 🛑 **החלון חובה — אין ברירת-מחדל של "כל ההיסטוריה".** ברירת-מחדל שקטה היא בדיוק איך
// החלון לא עבד בלי שאיש ראה. פרמטר חסר עוצר כאן, כמו `requireParams` בדירוג.
function requireWindow(window) {
  const months = optionalNumber(window?.months)
  const extendedMonths = optionalNumber(window?.extendedMonths)
  const minAnswers = optionalNumber(window?.minAnswers)
  if (months === null || extendedMonths === null || minAnswers === null) {
    throw new Error('חסרים פרמטרים של חלון-החישוב של Smart Match בהגדרות המערכת.')
  }
  return { months, extendedMonths, minAnswers }
}

// ── "תענה הכי מהר" · זמן-התגובה החציוני ───────────────────────────────────────
//
// ✏️ **נבנה 25/09/2026 (אודיט השיבוץ-החכם, פער 2).** האפיון: *"`responded_at − invite_sent_at` ·
// האירוע מחר ואין זמן לחכות"* (`spec.md` §ארבע הזוויות). עד היום הזווית מיינה לפי שדה שאיש לא
// יצר, כלומר בהגרלה.
// 🔑 **חציון ולא ממוצע:** תשובה אחת שנענתה אחרי שבוע הייתה גוררת ממוצע של דיילת שעונה תוך
// שעה — והמנהלת שואלת "מי תענה מהר *בדרך-כלל*".
// 🔴 **פחות מהסף ⇒ `null` ("לא ידוע"), והיא יורדת לסוף הרשימה בזווית הזו** — שתי תשובות
// מהירות אינן "מהירה", והמיון כבר שולח `null` לסוף (`sortAngles.js`, `ascending`).
// ⚠️ **שני גבולות שהנתון עצמו מציב, ולא נפתרים כאן:** ‏`responded_at` נכתב **רק בתשובה דרך
// הקישור** — סימון ידני אחרי שיחת-טלפון אינו מודד זמן (`api.js`, `markAssignmentStatus`) ·
// ומי שלא ענתה כלל אינה בחישוב, בדיוק כמו בציון (שתיקה אינה סירוב — `processes-approved.md §ב4`);
// הצ'יפ `לא ענתה ל-N האחרונים` הוא שמראה אותה.
// ⚠️ זמן שלילי (תשובה "לפני" השליחה) מדולג — הוא עדות לשורה ש-`invite_sent_at` שלה רוענן אחרי
// המענה, לא למהירות.
function medianResponseHours(rows, minSamples) {
  const hours = []
  for (const row of rows) {
    if (!row?.invite_sent_at || !row?.responded_at) continue
    const elapsed = Date.parse(row.responded_at) - Date.parse(row.invite_sent_at)
    if (!Number.isFinite(elapsed) || elapsed < 0) continue
    hours.push(elapsed / MS_PER_HOUR)
  }
  if (hours.length === 0 || hours.length < minSamples) return null

  hours.sort((a, b) => a - b)
  const middle = Math.floor(hours.length / 2)
  return hours.length % 2 === 1 ? hours[middle] : (hours[middle - 1] + hours[middle]) / 2
}

// כמה אירועים **שכבר עברו** עבדה הדיילת אצל לקוח האירוע הזה.
// 🔴 ארבעה תנאים, וכל אחד מהם הוא הכרעה (הנחה 11 בבלופרינט): **אותו לקוח** ·
// **`אושרה סופית`** בשורה הקובעת · **תאריך-אירוע שכבר עבר** — "עבדה אצל" בלשון עבר ·
// 🆕 **והאירוע לא בוטל.**
// ⚠️ **סופרים אירועים ולא שורות:** שתי שורות באותו פרויקט (סירוב שנעקף) הן פעם אחת.
//
// 🆕 **התנאי הרביעי נוסף באודיט-הסגירה 12/08/2026, בהכרעת-ישי ("לתקן בסבב הזה").**
// **הפער שהוא סגר:** ‏`processes-approved.md §ב8` מכריע שביטול-לקוח **לא נספר לרעתה**
// *("הן לא אשמות")* — **ושותק על הכיוון ההפוך.** בלי התנאי הזה, אירוע שהלקוח ביטל
// נספר **לזכותה**: הצ'יפ `עבדה אצל <לקוח> N×` מונה אירוע שבו לא עבדה אף שעה, וזווית
// המיון "עבדה אצל הלקוח הזה" מעלה אותה על סמך היכרות שלא התקיימה.
// 🔑 **הצד הזה של הכלל הוא הכרעה חדשה ולא גזירה** — ולכן הוא מתועד כאן ולא נטען כמובן-מאליו.
// עברה תאריך-האירוע? "היום" ← מ-`todayIso`, בדיוק כמו `countWorkedForCustomer`/
// `weeksSinceLastWorked` שמעליי — אותו מבחן `String(date) < String(todayIso)`.
function eventHasPassed(row, todayIso) {
  const eventDate = row?.projects?.final_event_date
  return Boolean(eventDate) && String(eventDate) < String(todayIso)
}

// 🔴 §2.7 — התרגום מ-שורות-מסד גולמיות לקלט ש-`reliabilityScore` (`smartMatch.js`) יודעת
// לפענח. **רק שתי המשפחות שנחשבות עובדה** נכנסות לרשימה:
// ‏① `finally_approved` **שנסגר בפועל** (`attendance_status` אינו `null` — האירוע נסגר
//    במשטח-הסגירה של מודול 6) · ② `assignment_status === 'approval_withdrawn'` — הענף
//    הנפרד של §2.7#2, שאינו נושא עמודות-נוכחות בכלל.
// 🚫 **שיבוץ `finally_approved` שטרם נסגר (שלוש העמודות `null` — צורה חוקית לגמרי לפי
// `assignments_attendance_shape`) אינו נכנס לרשימה** — הוא "עדיין אין עובדה", לא "צירוף
// לא-מוכר"; ההבחנה בין השניים חייבת לקרות **כאן**, לפני `resolveAttendanceOutcome`, אחרת
// כל שיבוץ פתוח היה נזרק כשגיאת-מיפוי. שאר הסטטוסים (`pending`/`declined`/`released`/
// `confirmed_available`) אינם רלוונטיים לאמינות-הגעה כלל ואינם מייצרים רשומה.
function buildAttendanceRecords(finalRows, todayIso) {
  const records = []
  for (const row of finalRows ?? []) {
    if (!row) continue

    const isWithdrawn = row.assignment_status === 'approval_withdrawn'
    const isClosedApproval =
      row.assignment_status === 'finally_approved' &&
      row.attendance_status !== null &&
      row.attendance_status !== undefined
    if (!isWithdrawn && !isClosedApproval) continue

    records.push({
      assignment_status: row.assignment_status,
      attendance_status: row.attendance_status ?? null,
      lateness_level: row.lateness_level ?? null,
      no_show_reason: row.no_show_reason ?? null,
      projectCancelled: eventWasCancelled(row),
      eventPassed: eventHasPassed(row, todayIso),
    })
  }
  return records
}

function countWorkedForCustomer(finalRows, customerId, todayIso) {
  if (customerId === null || customerId === undefined) return 0
  const projects = new Set()
  for (const row of finalRows) {
    if (row.assignment_status !== 'finally_approved') continue
    if (row.projects?.customer_id !== customerId) continue
    if (eventWasCancelled(row)) continue
    const eventDate = row.projects?.final_event_date
    if (!eventDate || String(eventDate) >= String(todayIso)) continue
    projects.add(row.project_id)
  }
  return projects.size
}

// ‏`window` = `{ months, extendedMonths, minAnswers }` — מ-`params` (`חלון_חישוב_חודשים` ·
// `חלון_חישוב_מורחב_חודשים` · `מינימום_תשובות_להצגת_ציון`). ⚠️ **הסף להרחבה הוא סף-הצגת-הציון:**
// §11.1 נוקב בשניהם "3", ומספר שלישי בקוד היה עותק שאיש לא היה מעדכן.
export function buildSmartMatchCandidates(
  { project, hostesses, assignments, sameDayHostessIds, preferences },
  todayIso,
  window,
) {
  const { months, extendedMonths, minAnswers } = requireWindow(window)
  const baseCutoff = monthsBefore(todayIso, months)
  const extendedCutoff = monthsBefore(todayIso, extendedMonths)
  // ✏️ מנוף-ההוגנות נמדד **עד תאריך-האירוע** (הכרעת-ישי 25/09/2026, פער 4). אירוע בלי תאריך ⇒
  // עד היום, כמו קודם — לא `null`, שהיה מבטל את המנוף לכולן בשקט.
  const eventDate = project?.final_event_date ?? todayIso
  const sameDay = new Set(sameDayHostessIds ?? [])
  const preferenceByHostess = new Map(
    (preferences ?? []).map((row) => [row.hostess_id, row.preference]),
  )

  // קיבוץ פעם אחת, לא שאילתה-לכל-דיילת: 50 דיילות × היסטוריה זה סט קטן, אבל מעבר
  // מלא על המערך לכל דיילת הוא O(n²) על לא-כלום.
  const rowsByHostess = new Map()
  for (const row of assignments ?? []) {
    if (!row) continue
    const list = rowsByHostess.get(row.hostess_id) ?? []
    list.push(row)
    rowsByHostess.set(row.hostess_id, list)
  }

  const eventPoint = { lat: project?.lat, lng: project?.lng }

  return (hostesses ?? []).map((hostess) => {
    const mine = rowsByHostess.get(hostess.hostess_id) ?? []
    const finalRows = finalAssignmentRows(mine)

    // החלון שלה: בסיסי, ומורחב רק אם בבסיסי יש לה פחות מהסף (הנחה 3).
    const baseRows = rowsSince(mine, baseCutoff)
    const baseCounts = responsivenessCounts(baseRows)
    const widened = baseCounts.answered < minAnswers
    const windowRows = widened ? rowsSince(mine, extendedCutoff) : baseRows
    const counts = widened ? responsivenessCounts(windowRows) : baseCounts

    return {
      ...hostess,
      // ── מה שהאלגוריתם דורש ──
      // 🔴 **בתוך החלון** — וזה גם מה שהצ'יפ `אישרה N מ-M` מציג (`screens-approved.md`:
      // *"פחות מ-3 תשובות **בחלון**"*).
      answered: counts.answered,
      confirmed: counts.confirmed,
      // ‏`C` (ממוצע-החברה) נסכם **על החלון הבסיסי בלבד** (הנחה 4) — גם אצל מי שהחלון שלה הורחב.
      baseAnswered: baseCounts.answered,
      baseConfirmed: baseCounts.confirmed,
      // 🔴 **`candidateDistanceKm` ולא `haversineKm`** — כשכתובת-אירוע נפתרה לרמת-עיר
      // ולדיילת יש רק עיר, שני הצדדים נוחתים על אותה נקודה בדיוק ⇒ מרחק `0` ⇒ ציון-קרבה
      // מושלם. כלומר **ככל שיש עליה פחות מידע כך היא מדורגת גבוה יותר.** הדלת היחידה.
      distanceKm: candidateDistanceKm({ lat: hostess.lat, lng: hostess.lng }, eventPoint),
      // ✏️ **הקלט של מנוף-ההוגנות — עד תאריך-האירוע** (הכרעת-ישי 25/09/2026). הצ'יפ על הכרטיס
      // קורא את `weeksSinceWorkedToday` שמתחת, כי הוא עובדה על היום.
      weeksSinceWorked: weeksSinceLastWorked(finalRows, todayIso, eventDate),
      weeksSinceWorkedToday: weeksSinceLastWorked(finalRows, todayIso),
      unavailability: hostess.hostess_unavailability ?? [],
      hasSameDayFinalAssignment: sameDay.has(hostess.hostess_id),
      preference: preferenceByHostess.get(hostess.hostess_id) ?? null,
      // ✅ §2.7 (14/08/2026) — מוזנת משורות-`assignments` אמיתיות דרך `buildAttendanceRecords`
      // (למעלה בקובץ). מערך ריק ולא אפס: `reliabilityScore` על מערך ריק הוא "אין נתונים",
      // בעוד אפס הוא "נכשלה". ⚠️ המרכיב עצמו נשאר במשקל 0 עד ש-מ9 ידליק את
      // `מרכיב_אמינות_פעיל` — הצינור-הזה כבר עובד כדי שההדלקה תהיה שינוי-פרמטר בלבד.
      // 🚧 מ9 ← מ4/מ6 (צעד 2.4, V-5) — אותו `attendance` הזה עכשיו גם ניזון ל-
      // `companyReliabilityAverage` (‏`smartMatch.js`, מחושב על כל המאגר בתוך `rankCandidates`)
      // ולא רק ל-`reliabilityScore` של הדיילת עצמה — אין שינוי כאן, הצורה כבר הייתה נכונה.
      // ✏️ 25/09/2026 — בתוך החלון שלה, כמו ההיענות; ו-`baseAttendance` לממוצע-האמינות של החברה.
      attendance: buildAttendanceRecords(finalAssignmentRows(windowRows), todayIso),
      baseAttendance: buildAttendanceRecords(finalAssignmentRows(baseRows), todayIso),
      // ‏"תענה הכי מהר" — חציון שעות, או `null` כשאין מספיק תשובות דרך הקישור בחלון שלה.
      medianResponseHours: medianResponseHours(windowRows, minAnswers),

      // ── מה שצ'יפי-ההנמקה מציגים (אינם משפיעים על הציון) ──
      workedForCustomerCount: countWorkedForCustomer(finalRows, project?.customer_id, todayIso),
      totalAnswered: counts.answered,
      hasCoordinates: hostess.lat !== null && hostess.lng !== null,
      assignmentRows: finalRows,
    }
  })
}
