// ארבע זוויות-המיון של Smart Match (`research §11.7`, שמצטט את `§9.9`).
//
// 🔴 **הן משנות אך ורק את הסדר.** שכבות 1–3 — שער · נעיצה · ציון — רצות **זהה בכל זווית**,
// והצ'יפים על הכרטיסים אינם משתנים. ⇒ החלפת זווית לעולם אינה מוסיפה או מסירה מועמדת;
// אילו הייתה, המנהלת הייתה מאבדת מועמדת בלי לדעת שהיא איבדה אותה.
//
// 🔑 **ולמה זווית ולא סינון, וזו סטייה מודעת מכל מה שנמצא בשוק:** מוצרים אחרים מסננים כי
// יש להם אלפי מועמדים; כאן **23 נכנסות למסך** ⇒ סינון חסר-תוחלת, וסידור-מחדש הוא הכלי.
// *(`world-sources.md` סבב 2 — לא נמצא מוצר עם שני סדרי-דירוג נקובים בשם.)*

// ⚠️ המפתחות באנגלית והתוויות עברית: התווית היא **מה שנכתב על המסך מילה-במילה**
// (המוקאפ המאושר `02_smartmatch_approved.html`), והמפתח הוא מה שנשמר במצב-המסך.
export const SORT_ANGLES = {
  proximity: { label: 'קרבה' },
  customer: { label: 'עבדה אצל הלקוח הזה' },
  fastest: {
    label: 'תענה הכי מהר',
    // 🔴 **מכובה-ומנומקת, לא נעלמת** (`§11.4`, וכרטיס מסך 2 §⑥): הזווית נשענת על
    // `responded_at`, שקיים בסכמה **וריק** — אף דיילת עוד לא ענתה. כפתור שנעלם משאיר את
    // המנהלת בלי הסבר; כפתור שנשאר פעיל וממיין לפי עמודה ריקה **משקר בשקט.**
    disabledNote: 'עדיין אין נתוני זמן-תגובה — הזווית תופעל כשדיילות יתחילו לענות דרך הקישור',
  },
  cheapest: { label: 'הזולה ביותר' },
}

// מיון עולה עם `null` **בסוף** — נתון חסר לעולם לא מתחזה ל"הכי טוב".
function ascending(getter) {
  return (a, b) => {
    const left = getter(a)
    const right = getter(b)
    if (left === null || left === undefined) return right === null || right === undefined ? 0 : 1
    if (right === null || right === undefined) return -1
    return left - right
  }
}

const COMPARATORS = {
  proximity: ascending((c) => c.distanceKm),
  customer: (a, b) => Number(b.workedForCustomerCount ?? 0) - Number(a.workedForCustomerCount ?? 0),
  fastest: ascending((c) => c.averageResponseHours),
  cheapest: ascending((c) => Number(c.hourly_rate)),
}

// ‏`hasResponseTimes` מגיע מהמסך (האם יש בכלל `responded_at` באירוע הזה), ולא נגזר כאן —
// הקובץ הזה טהור ואינו יודע דבר על המסד.
export function isAngleAvailable(angle, { hasResponseTimes } = {}) {
  return angle === 'fastest' ? Boolean(hasResponseTimes) : true
}

// ‏`§11.7`: *"תענה הכי מהר"* **רק** כשהאירוע קרוב מ-72 שעות · אחרת *"קרבה"* — הזווית
// הניטרלית ביותר כשאין לחץ-זמן.
// 🔴 **ונפילה-חזרה כשהיא כבויה:** אחרת דווקא במצב הלחוץ ביותר המסך היה נופל לזווית שאין
// לה דאטה — בדיוק התסריט ש-`spec.md §12` מזהיר ממנו *("בלי טיפול, המסך היה נופל בשקט")*.
export function defaultSortAngle(isUrgent, availability = {}) {
  if (isUrgent && isAngleAvailable('fastest', availability)) return 'fastest'
  return 'proximity'
}

// 🔴 **נעוצה קודמת לכל זווית** — הנעיצה היא שכבה 2 והזווית היא שכבה 4, וסדר-השכבות הוא
// ההכרעה. 🚧 מ6: הטבלה ריקה היום, ולכן בפועל אף אחת אינה נעוצה — אבל הסדר נכון מהיום.
// ⚠️ ושובר-השוויון הוא זה של הדירוג (`tieBreak`) ולא סדר-הקליטה: שתי מועמדות באותו מרחק
// היו מחליפות מקום בין רענונים, וזה נראה כמו מסך שמשנה את דעתו.
export function sortByAngle(candidates, angle) {
  const compare = COMPARATORS[angle] ?? COMPARATORS.proximity
  return [...(candidates ?? [])].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      compare(a, b) ||
      String(a.tieBreak ?? '').localeCompare(String(b.tieBreak ?? '')),
  )
}
