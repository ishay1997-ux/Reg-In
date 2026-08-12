// המרת כתובת לקואורדינטות — **החלק הטהור.** בלי רשת, בלי Supabase, בלי שעון.
// התובלה (הקריאה בפועל, ויסות-הקצב, פסק-הזמן) יושבת ב-`src/api/geocode.js`.
// 🔗 אותו פיצול בדיוק כמו מנוע-המייל: `src/lib/email.js` טהור · `src/api/email.js` תובלה.
//
// למה זה קיים: מרכיב-הקרבה הוא 0.25 מציון ההתאמה, והוא דורש שתי נקודות (§11.4).
// היום אין במסד ולו קואורדינטה אחת — לא לדיילת ולא לאירוע.
//
// 🔴 **דין-חוסר-נתון, ואינו נתון לפרשנות** (§7.55 · §11.4 · `spec.md §2.1(1)`):
// כתובת שלא הומרה **אינה חוסמת שמירה**, ומקבלת ציון-קרבה **ניטרלי + סימון על השורה** —
// 🚫 לעולם לא `0`. אפס הוא הציון המושלם, כלומר חוסר-נתון היה מקפיץ אותה לראש הדירוג.

import { optionalNumber } from './hostesses'

// תקרת ניסיונות לכתובת אחת. ‏Nominatim מתיר בקשה אחת בשנייה (תנאי-השימוש, נקראו
// 09/08/2026), ולכן כל ניסיון נוסף הוא שנייה שהמנהלת מחכה בשמירה. ארבעה מכסים כל
// כתובת שנמדדה כאן בפועל, ומונעים מכתובת משורשרת להפוך לשיטפון.
export const MAX_GEOCODE_ATTEMPTS = 4

// שומר שני, בלתי-תלוי ב-`countrycodes=il` שבשאילתה. שומר שנשען על פרמטר יחיד
// בכתובת URL מת בשקט ברגע שמישהו עורך את השאילתה.
const ISRAEL_BOUNDS = { minLat: 29.0, maxLat: 33.5, minLng: 34.0, maxLng: 36.0 }

// המפתחות שבהם Nominatim מחזיר **יישוב**. 🚫 במכוון בלי `suburb`/`residential`:
// בתשובה על "אקספו תל אביב" הם מחזיקים "מרכז הירידים", שהוא שכונה ולא עיר.
const LOCALITY_KEYS = ['city', 'town', 'village', 'municipality']

// אורך מזערי לקטע-שם שנחשב התאמה. שלוש אותיות היו מקבלות את "כפר" ומתאימות
// את כפר-סבא לכפר-ויתקין; ארבע דורשות שם ממשי.
const MIN_LOCALITY_PREFIX = 4

// מנקה מקף עברי (U+05BE), קווים מפרידים, רווחים וסימני-כיווניות. השירות מחזיר
// `תל־אביב–יפו` בעוד המנהלת הקלידה `תל אביב` — בלי הניקוי הזה הן שני מיתרים זרים.
function normalizeForMatch(value) {
  return String(value ?? '')
    .replace(/[‎‏‪-‮]/g, '')
    .replace(/[\s־‐-―-]/g, '')
}

// מ-`תל־אביב–יפו` מייצר `תלאביב` ו-`תלאביביפו`. נחוץ כי שם-היישוב הרשמי ארוך
// מזה שאנשים כותבים: אף אחד לא מקליד "יפו" בכתובת של מגדל באקספו.
function localityPrefixes(name) {
  const tokens = String(name ?? '')
    .split(/[\s־‐-―-]+/)
    .filter(Boolean)
  const prefixes = []
  let joined = ''
  for (const token of tokens) {
    joined += normalizeForMatch(token)
    if (joined.length >= MIN_LOCALITY_PREFIX) prefixes.push(joined)
  }
  return prefixes
}

// הכתובת שנשלחת לחיפוש עבור דיילת. 🔑 **העיר אחרונה בכוונה** — שרשרת-הניסיונות
// למטה מנסה את הקטעים מהסוף להתחלה, ולכן הקטע האחרון הוא רשת-הביטחון.
// עמודת `city` היא NOT NULL במסד ⇒ לדיילת תמיד יש עוגן, ולכן היא כמעט לעולם
// לא תסומן "אין קואורדינטות".
export function buildHostessAddress(hostess) {
  const city = String(hostess?.city ?? '').trim()
  if (!city) return ''
  const address = String(hostess?.address ?? '').trim()
  return address ? `${address}, ${city}` : city
}

// שרשרת הניסיונות: הכתובת המלאה, ואז כל קטע **מהאחרון לראשון**.
//
// 🔴 הסדר הזה נולד ממדידה חיה (09/08/2026) ולא מהיגיון-לכאורה:
//   · `אקספו תל אביב, ביתן 2` (פרויקט 8) — הכתובת המלאה מחזירה **ריק**; `אקספו תל אביב` פוגע.
//   · `מרכז הכנסים, ירושלים` (פרויקט 3) — המלאה **ריקה**; `ירושלים` פוגעת.
// ⇒ בלי שרשרת, **שני האירועים האמיתיים היחידים במערכת** היו מסומנים "אין קואורדינטות".
//
// 🚨 ולמה מהסוף ולא מההתחלה, וזו המדידה החשובה מכולן: קטע בודד בתחילת כתובת הוא
// גנרי ומחזיר יישוב שרירותי — `מרכז הכנסים` לבדו מחזיר **אשקלון** (‏62 ק"מ מהתשובה
// הנכונה) ו-`הרצל 50` לבדו מחזיר **נתניה**. הקטע האחרון בכתובת עברית הוא בדרך-כלל
// היישוב, ולכן הוא הניחוש הבטוח. **ושומר-היישוב שלמטה הוא מה שהופך את זה לבטוח באמת.**
export function buildGeocodeCandidates(rawAddress) {
  const segments = String(rawAddress ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (segments.length === 0) return []

  const candidates = [segments.join(', ')]
  for (let i = segments.length - 1; i >= 0; i--) {
    if (!candidates.includes(segments[i])) candidates.push(segments[i])
  }
  return candidates.slice(0, MAX_GEOCODE_ATTEMPTS)
}

// 🛡️ **השומר.** תשובה מתקבלת רק אם היישוב שהיא מחזירה **מופיע בכתובת המקורית**.
//
// בלעדיו השרשרת מסוכנת יותר ממה שהיא פותרת: `מרכז הכנסים` היה מחזיר את אשקלון
// על אירוע בירושלים — קואורדינטה **תקינה לחלוטין ושגויה ב-62 ק"מ**, שהייתה עוברת
// את שער-ה-80 ומזיזה את הדירוג בשקט. **קואורדינטה שגויה גרועה מקואורדינטה חסרה:**
// החסרה מסומנת על המסך, השגויה נראית כמו עובדה.
//
// 🔴 ואי-יכולת-לאמת אינה אישור — תשובה בלי שם-יישוב נדחית.
export function localityMatchesAddress(addressDetails, originalAddress) {
  if (!addressDetails) return false
  const haystack = normalizeForMatch(originalAddress)
  if (!haystack) return false

  for (const key of LOCALITY_KEYS) {
    const value = addressDetails[key]
    if (!value) continue
    // שמות דו-לשוניים מגיעים מופרדים בקו אנכי: `ירושלים | القدس`.
    for (const variant of String(value).split('|')) {
      if (localityPrefixes(variant).some((prefix) => haystack.includes(prefix))) return true
    }
  }
  return false
}

function withinIsrael(lat, lng) {
  return (
    lat >= ISRAEL_BOUNDS.minLat &&
    lat <= ISRAEL_BOUNDS.maxLat &&
    lng >= ISRAEL_BOUNDS.minLng &&
    lng <= ISRAEL_BOUNDS.maxLng
  )
}

// מפענח תשובה של Nominatim. `null` = אין קואורדינטות, וזה מצב תקין ולא שגיאה.
//
// 🚨 `optionalNumber` ולא `Number`, ובכוונה: `Number(null)` הוא **0** (לא NaN), ו-`0,0`
// היא נקודה תקינה באוקיינוס האטלנטי. בדיוק המלכודת שנתפסה בפזה הזו — haversine החזיר
// 3,558 ק"מ לדיילת בלי קואורדינטות. `src/lib/hostesses.js` הוא הדלת היחידה לקריאת
// מספר-אופציונלי במודול 4.
export function parseGeocodeResult(payload, originalAddress) {
  if (!Array.isArray(payload) || payload.length === 0) return null

  const [hit] = payload
  const lat = optionalNumber(hit?.lat)
  const lng = optionalNumber(hit?.lon)
  if (lat === null || lng === null) return null
  if (!withinIsrael(lat, lng)) return null
  if (!localityMatchesAddress(hit?.address, originalAddress)) return null

  return { lat, lng }
}
