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
import { finalAssignmentRows, weeksSinceLastWorked, eventWasCancelled } from '@/lib/hostesses'

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

export function buildSmartMatchCandidates(
  { project, hostesses, assignments, sameDayHostessIds, preferences },
  todayIso,
) {
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
    const counts = responsivenessCounts(mine)

    return {
      ...hostess,
      // ── מה שהאלגוריתם דורש ──
      answered: counts.answered,
      confirmed: counts.confirmed,
      // 🔴 **`candidateDistanceKm` ולא `haversineKm`** — כשכתובת-אירוע נפתרה לרמת-עיר
      // ולדיילת יש רק עיר, שני הצדדים נוחתים על אותה נקודה בדיוק ⇒ מרחק `0` ⇒ ציון-קרבה
      // מושלם. כלומר **ככל שיש עליה פחות מידע כך היא מדורגת גבוה יותר.** הדלת היחידה.
      distanceKm: candidateDistanceKm({ lat: hostess.lat, lng: hostess.lng }, eventPoint),
      weeksSinceWorked: weeksSinceLastWorked(finalRows, todayIso),
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
      attendance: buildAttendanceRecords(finalRows, todayIso),

      // ── מה שצ'יפי-ההנמקה מציגים (אינם משפיעים על הציון) ──
      workedForCustomerCount: countWorkedForCustomer(finalRows, project?.customer_id, todayIso),
      totalAnswered: counts.answered,
      hasCoordinates: hostess.lat !== null && hostess.lng !== null,
      assignmentRows: finalRows,
    }
  })
}
