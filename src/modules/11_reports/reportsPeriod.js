// לוגיקת מסנן-התקופה — **פונקציות טהורות**, בקובץ נפרד מהרכיב שמציג אותן.
//
// 🔑 **למה נפרד ולא בתוך `FiltersBar.jsx`:** ‏§4.1 של `CLAUDE.md` *(לוגיקה עסקית ב-`lib`
// כפונקציות טהורות)*, ובאופן מיידי יותר — `react-refresh/only-export-components` חוסם קובץ
// שמייצא גם רכיב וגם פונקציות. **וזה לא טקס:** הגזירה הזו היא בדיוק מה שצריך בדיקת-יחידה,
// והרכיב הוא בדיוק מה שלא.

// טווחי-התקופה. 🔑 **שמות-המפתח זהים ל-`WINDOW_OPTIONS`** (`month`/`90d`/`year`/`all`) כדי
// שכתובת-דף שהועתקה בין מסכים לא תיקרא אחרת.
// ⚠️ **אבל הסמנטיקה שונה, ובמכוון:** ‏`listWindow` הוא חלון-**עבר** (`from` בלי `to`, כדי
// שאירוע עתידי לא ייעלם בשקט); מסנן-דוח הוא **טווח סגור** ששני קצותיו נשלחים ל-RPC.
export const PERIOD_OPTIONS = Object.freeze([
  { key: 'month', label: 'החודש' },
  { key: '90d', label: '3 חודשים' },
  // ✏️ **הגלולה החמישית, הכרעת-ישי 16/09/2026 17:4X (כרטיס ⑧H2 — *"בלי פינות פתוחות"*):**
  // 🔴 **הפער שהיא סוגרת הוא פער-אוכלוסייה ולא נוחות:** ארבעת כרטיסי-הדיילות מוגדרים על
  // **חלון מתגלגל של ⁦12⁩ חודשים** (`cards-hostesses.md:413` נוקב ב-`(10/09/2025, 10/09/2026]`),
  // בעוד הלשונית נפתחה על **שנה קלנדרית** — כלומר המסך מדד אוכלוסייה אחת והכרטיס הגדיר
  // אחרת, בלי שאף שער יראה זאת.
  { key: '12m', label: '12 חודשים' },
  { key: 'year', label: 'השנה' },
  { key: 'all', label: 'הכול' },
])

// ברירת-המחדל היא **השנה** — ‏`processes-approved.md` ח8-7: *"חלון-CSAT בדוחות = תקופה
// נבחרת, ברירת-מחדל השנה"*. ⚠️ **ולשונית יכולה להכריז אחרת** (`tab.defaultPeriod`
// ב-`reportsCatalog.js`) — ר' `parsePeriodParam` ו-`ReportsPage`.
export const DEFAULT_PERIOD = 'year'

const PERIOD_KEYS = new Set(PERIOD_OPTIONS.map((o) => o.key))

/**
 * ערך מהכתובת (`?period=`) — לא מוכר ⇒ ברירת-המחדל, בלי שגיאה ובלי מסך שבור (S-18).
 *
 * 🔑 **`fallback` הוא ברירת-המחדל של הלשונית הפעילה**, ולכן הוא פרמטר ולא קבוע: כתובת
 * **בלי** `?period=` היא בדיוק המקרה שבו ללשונית מותר להכריע, וכתובת **עם** `?period=`
 * גוברת תמיד — אחרת קישור-לדוח-מסונן ששותף היה נפתח על תקופה אחרת אצל המקבל.
 */
export function parsePeriodParam(value, fallback = DEFAULT_PERIOD) {
  if (PERIOD_KEYS.has(value)) return value
  return PERIOD_KEYS.has(fallback) ? fallback : DEFAULT_PERIOD
}

/**
 * גוזרת `{from, to}` מ-`periodKey` ומ"היום".
 *
 * 🔴 **"היום" מגיע כפרמטר ולעולם לא מ-`new Date()` כאן** — מוקש-השעון של `src/CLAUDE.md`,
 * והתקדים המלא ב-`07_dashboard/api.js`: מסך שנטען אחרי חצות בשעון-ישראל היה שולח טווח של
 * אתמול. המקור הוא `window.to` שה-RPC מחזיר (C8).
 * ⚠️ **ו"היום" שעדיין לא ידוע אינו שגיאה** — הוא מחזיר `{null, null}`, וה-RPC בוחר את
 * חלון-ברירת-המחדל של הכרטיס בעצמו. זה מה שמאפשר לטעינה הראשונה לרוץ לפני שיש שעון.
 * ‏`'all'` ⇒ אותו דבר: שני הקצוות `null`.
 *
 * 🔑 **החישוב על מחרוזות-ISO ולא על `Date` מקומי** — בדיוק כמו `windowStart` ב-
 * `src/lib/listWindow.js`, ומאותו נימוק: `Date` מקומי זז עם אזור-הזמן ונתפס בכך ב-CI.
 */
export function periodRange(periodKey, todayIso) {
  if (periodKey === 'all' || !/^\d{4}-\d{2}-\d{2}$/.test(String(todayIso ?? ''))) {
    return { from: null, to: null }
  }
  const [y, m, d] = todayIso.split('-').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  if (periodKey === 'month') return { from: `${y}-${pad(m)}-01`, to: todayIso }
  if (periodKey === 'year') return { from: `${y}-01-01`, to: todayIso }
  if (periodKey === '12m') {
    // 🔴 **חלון מתגלגל, ‏§9 D-17: `(from, to]` — חצי-פתוח**, בעוד תקופה **קלנדרית**
    // (`month`/`year`) היא `[from, to]` סגורה. ההבחנה אינה סמנטית-בלבד: היא מה שמפריד בין
    // *"⁦12⁩ החודשים האחרונים"* לבין *"אותו יום לפני שנה, ועוד פעם"*.
    // ⚠️ **`Date.UTC` ולא הרכבת-מחרוזת** — ‏`2024-02-29` פחות שנה הוא תאריך שאינו קיים;
    // ‏`Date.UTC` מנרמל אותו ל-`2023-03-01` במקום לייצר `2023-02-29` שה-RPC ידחה.
    const start = new Date(Date.UTC(y - 1, m - 1, d)).toISOString().slice(0, 10)
    return { from: start, to: todayIso }
  }
  // ‏90 יום אחורה — ‏`Date.UTC` בלבד, בלי שעון-מקומי.
  const start = new Date(Date.UTC(y, m - 1, d) - 90 * 86_400_000).toISOString().slice(0, 10)
  return { from: start, to: todayIso }
}
