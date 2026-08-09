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
import { finalAssignmentRows, weeksSinceLastWorked } from '@/lib/hostesses'

// כמה אירועים **שכבר עברו** עבדה הדיילת אצל לקוח האירוע הזה.
// 🔴 שלושה תנאים, וכל אחד מהם הוא הכרעה (הנחה 11 בבלופרינט): **אותו לקוח** ·
// **`אושרה סופית`** בשורה הקובעת · **ותאריך-אירוע שכבר עבר** — "עבדה אצל" בלשון עבר.
// ⚠️ **סופרים אירועים ולא שורות:** שתי שורות באותו פרויקט (סירוב שנעקף) הן פעם אחת.
function countWorkedForCustomer(finalRows, customerId, todayIso) {
  if (customerId === null || customerId === undefined) return 0
  const projects = new Set()
  for (const row of finalRows) {
    if (row.assignment_status !== 'finally_approved') continue
    if (row.projects?.customer_id !== customerId) continue
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
      // 🚧 מ6 — סימוני-הנוכחות נוצרים בסגירת האירוע ואינם קיימים היום. מערך ריק ולא
      // אפס: `reliabilityScore` על מערך ריק הוא "אין נתונים", בעוד אפס הוא "נכשלה".
      attendance: [],

      // ── מה שצ'יפי-ההנמקה מציגים (אינם משפיעים על הציון) ──
      workedForCustomerCount: countWorkedForCustomer(finalRows, project?.customer_id, todayIso),
      totalAnswered: counts.answered,
      hasCoordinates: hostess.lat !== null && hostess.lng !== null,
      assignmentRows: finalRows,
    }
  })
}
