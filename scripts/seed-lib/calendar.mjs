// לוח-שנה ישראלי לגנרטור — `seed-data-spec.md §ב׳`: "מייצרים לוח שנה, לא התפלגות".
//
// 🔴 התאריכים העבריים נשלפים מספריית `@hebcal/core` **בזמן-ריצה, לכל שנה בנפרד** — לא
// מרשימה קשיחה. רשימה קשיחה היא בדיוק "כשל-המספר-הקפוא" שהמפרט אוסר: היא נכונה לשנה
// שנכתבה בה ושגויה בשנה שאחריה, בלי שאיש ירגיש.
//
// חסימות קשיחות (אירוע עליהן = פגם): שבת · יום כיפור · החגים עצמם (ר"ה, סוכות ראשון/שמיני
// עצרת, פסח ראשון/שביעי, שבועות) · תשעה באב.
// צפיפות רכה (מותר, נדיר): שישי · חול-המועד · ערבי-חג · יום-הזיכרון/העצמאות · ימי-בחירות.

import { HebrewCalendar, flags } from '@hebcal/core'

const DAY_MS = 86_400_000

// ימי-בחירות בחלון (2024–2026). 📌 `הנחתי`-ממקור-ציבורי: הבחירות לרשויות המקומיות נערכו
// ב-27/02/2024 עם סיבוב שני ב-10/03/2024. אין מנגנון ספרייה לימי-בחירות, ולכן זו הרשימה
// היחידה שנכתבת ביד כאן — והיא מסומנת בתגית כדי שמי שמרחיב את החלון ידע לעדכן אותה.
const ELECTION_DAYS = new Set(['2024-02-27', '2024-03-10'])

const HARD_BLOCK_DESCRIPTIONS = new Set(["Tish'a B'Av"])

export function isoToUtcMs(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function msToIso(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  return msToIso(isoToUtcMs(iso) + days * DAY_MS)
}

export function daysBetween(fromIso, toIso) {
  return Math.round((isoToUtcMs(toIso) - isoToUtcMs(fromIso)) / DAY_MS)
}

// 0=ראשון … 6=שבת — ב-UTC, בדיוק כמו `weekdayOf` ב-`src/lib/dates.js` (הפענוח המקומי מזיז
// יום סביב חצות בחלק מהתאריכים).
export function weekdayIndex(iso) {
  return new Date(isoToUtcMs(iso)).getUTCDay()
}

// ימי-עסקים בין שני תאריכים (לא כולל `from`, כולל `to`) — אותו כלל של
// `businessDaysUntil` ב-`src/lib/projectChanges.js`: א׳–ה׳ בלבד.
export function businessDaysBetween(fromIso, toIso) {
  let count = 0
  for (let ms = isoToUtcMs(fromIso) + DAY_MS; ms <= isoToUtcMs(toIso); ms += DAY_MS) {
    const day = new Date(ms).getUTCDay()
    if (day !== 5 && day !== 6) count += 1
  }
  return count
}

// בונה מפה iso ⇒ {kind, desc} לכל השנים שבטווח. נקרא פעם אחת לריצה.
export function buildHolidayMap(fromYear, toYear) {
  const map = new Map()
  for (let year = fromYear; year <= toYear; year += 1) {
    const events = HebrewCalendar.calendar({
      year,
      isHebrewYear: false,
      il: true,
      noRoshChodesh: true,
      noSpecialShabbat: true,
      noModern: false,
    })
    for (const event of events) {
      // 🔴 `greg()` מחזיר Date בחצות **מקומית**; `toISOString` ממיר ל-UTC ⇒ בישראל (UTC+2/3) כל חג
      // היה זז יום אחורה, ובשרת-CI (UTC) לא — הבדיקה עברה מקומית ונפלה ב-CI (03/09/2026, PR #110).
      // הרכיבים המקומיים הם התאריך הלועזי שהלוח התכוון אליו, בכל אזור-זמן.
      const g = event.getDate().greg()
      const iso = `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`
      const f = event.getFlags()
      const desc = event.getDesc()
      let kind = null
      if (f & flags.CHAG) kind = 'chag'
      else if (f & flags.MAJOR_FAST && HARD_BLOCK_DESCRIPTIONS.has(desc)) kind = 'fast'
      else if (f & flags.CHOL_HAMOED) kind = 'cholhamoed'
      else if (f & flags.EREV) kind = 'erev'
      else if (f & flags.MODERN_HOLIDAY) kind = 'modern'
      if (!kind) continue
      // חג גובר על כל סימון אחר באותו יום.
      const current = map.get(iso)
      if (!current || kind === 'chag') map.set(iso, { kind, desc })
    }
  }
  return map
}

const SOFT_MODERN = new Set(['Yom HaZikaron', "Yom HaAtzma'ut"])

// סיווג יום: `blocked` = אסור בהחלט · `density` = מכפיל-הסתברות (1 = יום עבודה רגיל).
export function classifyDay(iso, holidayMap) {
  const weekday = weekdayIndex(iso)
  if (weekday === 6) return { blocked: true, density: 0, reason: 'שבת' }

  const holiday = holidayMap.get(iso)
  if (holiday?.kind === 'chag') return { blocked: true, density: 0, reason: holiday.desc }
  if (holiday?.kind === 'fast') return { blocked: true, density: 0, reason: holiday.desc }

  let density = 1
  let reason = null
  if (weekday === 5) {
    density = 0.08
    reason = 'שישי'
  }
  if (holiday?.kind === 'cholhamoed') {
    density = Math.min(density, 0.25)
    reason = holiday.desc
  } else if (holiday?.kind === 'erev') {
    density = Math.min(density, 0.2)
    reason = holiday.desc
  } else if (holiday?.kind === 'modern' && SOFT_MODERN.has(holiday.desc)) {
    density = Math.min(density, 0.15)
    reason = holiday.desc
  } else if (holiday?.kind === 'modern' && holiday.desc === 'Yom HaShoah') {
    density = Math.min(density, 0.5)
    reason = holiday.desc
  }
  if (ELECTION_DAYS.has(iso)) {
    density = Math.min(density, 0.2)
    reason = 'יום בחירות'
  }
  return { blocked: false, density, reason }
}

// ערבי-חג של הפרויקט הזה "עירוניים" (פסטיבלים) — לא נדרש להפרדה כאן; המתכנן משתמש רק
// ב-blocked/density. הפונקציה קיימת כדי שסקריפט-הטענות ישאל **אותה** שאלה שהמתכנן שאל
// (טענה 1 במפרט: "הבדיקה דורשת מקור-לוח-עברי אמיתי בזמן-הבדיקה").
export function isForbiddenEventDay(iso, holidayMap) {
  return classifyDay(iso, holidayMap).blocked
}

// טווח-תאריכים כולל.
export function* eachDay(fromIso, toIso) {
  for (let ms = isoToUtcMs(fromIso); ms <= isoToUtcMs(toIso); ms += DAY_MS) {
    yield msToIso(ms)
  }
}

export function monthKey(iso) {
  return String(iso).slice(0, 7)
}

export function lastDayOfMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  return msToIso(Date.UTC(y, m, 0))
}

// חותמת-זמן ISO משעת-קיר ישראלית. 📌 `הנחתי`: שעון-קיץ מקורב לחודשים 4–10 (ההיסט המדויק
// אינו משנה דבר בדאטה — רק את השעה שתוצג בכרטיס, וגם זה בהפרש של שעה לכל היותר).
export function atLocal(iso, hour = 10, minute = 0) {
  const month = Number(String(iso).slice(5, 7))
  const offset = month >= 4 && month <= 10 ? 3 : 2
  const ms = isoToUtcMs(iso) + ((hour - offset) * 60 + minute) * 60_000
  return new Date(ms).toISOString()
}
