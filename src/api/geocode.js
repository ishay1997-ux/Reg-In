// שכבת-התובלה של הגאוקוד — הקריאה בפועל אל שירות חיצוני.
//
// ⚠️ **זו הקריאה הראשונה בפרויקט לשירות שאינו שלנו.** כל השאר עובר דרך `supabase-js`
// או דרך פונקציית-השרת `send-email`; כאן הדפדפן פונה ישירות לצד שלישי.
// הלוגיקה הטהורה (שרשרת-הניסיונות, פענוח, שומר-היישוב) — `src/lib/geocode.js`.
//
// 🔗 הפיצול זהה למנוע-המייל: `src/lib/email.js` טהור · `src/api/email.js` תובלה.

import { buildGeocodeCandidates, parseGeocodeResult } from '@/lib/geocode'

// 🔴 **השירות נבחר על-ידי ישי, 09/08/2026** (§7.55 השאיר את הזהות פתוחה בכוונה
// ודרש בדיקת תנאי-שימוש בזמן הבנייה — לא מהזיכרון).
// **תנאי-השימוש כפי שנקראו באותו יום:** חינמי · בלי מפתח ובלי חשבון · **בקשה אחת
// בשנייה לכל היותר** · חובה לשמור את התוצאה אצלנו · שימוש שהמשתמש יוזם — מותר.
//
// ⚠️ **סטייה מודעת מתנאי-השימוש, ונאמרת בקול:** הם מבקשים שנוכל להחליף שירות **בלי
// עדכון-תוכנה**. הכתובת כאן קבועה בקוד. הנימוק: היקף השימוש כאן הוא ~60 בקשות
// אי-פעם (50 דיילות + כ-10 אירועים, פעם אחת כל אחד), והחלפה היא שינוי השורה הזאת.
// פרמטר במסד היה מוסיף שדה שמישהו יכול לשבור ממסך-ההגדרות, בשביל סיכון שאינו קיים.
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'

export const GEOCODE_MIN_INTERVAL_MS = 1_000
const GEOCODE_TIMEOUT_MS = 8_000

// רגע הבקשה האחרונה — ברמת-המודול בכוונה: המגבלה היא על **השירות**, לא על מסך יחיד,
// ולכן שני מסכים שממירים בו-זמנית חייבים לחלוק את אותו ויסות.
let lastRequestAt = 0

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttle() {
  const waitFor = lastRequestAt + GEOCODE_MIN_INTERVAL_MS - Date.now()
  if (waitFor > 0) await delay(waitFor)
  lastRequestAt = Date.now()
}

// בקשה בודדת. 🔴 **לעולם אינה זורקת** — כל כשל הוא "לא נמצא", והשרשרת ממשיכה.
// זו אינה בליעת-שגיאות אלא ההכרעה של האפיון: *"נכשל ⇒ נשמרת בכל מקרה ומסומנת"*
// (`spec.md §2.1(1)`). קריאה שזורקת הייתה הופכת תקלת-רשת רגעית לכישלון-שמירה.
async function fetchCandidate(query) {
  const url = new URL(NOMINATIM_SEARCH_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  // סינון לישראל — מונע ש"הרצל 50" ייפול על רחוב בחו"ל.
  url.searchParams.set('countrycodes', 'il')
  // בלי זה אין שם-יישוב בתשובה, ושומר-היישוב לא יכול לעבוד.
  url.searchParams.set('addressdetails', '1')

  try {
    await throttle()
    const response = await fetch(url, {
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// ממיר כתובת חופשית לקואורדינטות. מחזיר `{lat, lng}` או `null`.
//
// 🔴 **`null` הוא תשובה תקינה ולא שגיאה** — הקורא שומר את השורה בכל מקרה ומסמן
// אותה "אין קואורדינטות", והציון מקבל ערך **ניטרלי ולא אפס** (§11.4).
//
// עד ארבעה ניסיונות, בשנייה אחת ביניהם, ועוצר בפגיעה הראשונה שעוברת את שומר-היישוב.
export async function geocodeAddress(rawAddress) {
  for (const candidate of buildGeocodeCandidates(rawAddress)) {
    const payload = await fetchCandidate(candidate)
    // 🔑 האימות נעשה מול **הכתובת המקורית המלאה**, לא מול הקטע שנשלח: השומר שואל
    // "האם היישוב שחזר מופיע במה שהמנהלת הקלידה", וקטע-בודד היה מאמת את עצמו.
    const coordinates = parseGeocodeResult(payload, rawAddress)
    if (coordinates) return coordinates
  }
  return null
}
