// עיצוב תאריכים לתצוגה. **טהור** — בלי שעון, בלי Supabase, בלי DOM.
//
// 🔴 **למה קובץ, ולא עוד עותק מקומי:** נמדד 09/08/2026 שאותה `formatDate` בת ארבע השורות
// כתובה **שלוש פעמים** בריפו — `03_quotes/quotePdf.jsx` · `04_hostesses/RepositoryTab.jsx` ·
// `04_hostesses/HostessViewCard.jsx` — ומבט-העל היה העותק הרביעי. זה בדיוק התסריט של
// `StatTile` (`src/CLAUDE.md`): רכיב שהוגדר פעמיים **סטה בפועל**, ואיש לא ראה עד שהיו שלושה.
//
// ⚠️ **מה כן נשאר בחוץ, ובמכוון: `quotePdf.jsx`.** הגרסה שלו מקבלת גם אובייקט `Date`
// ומחזירה `—` על ערך ריק, בעוד ששתי הגרסאות של מודול 4 מחזירות מחרוזת ריקה. איחוד
// שלהן **היה משנה פלט PDF שכבר יוצא ללקוחות** — שינוי-התנהגות מוסווה כניקיון. הוא נשאר
// שם, והשורה הזאת היא הרישום שהוא ידוע ולא נשכח.
//
// 🔴 **וההבדל ההתנהגותי ביניהן אינו רק "ריק מול מקף" — הוא מה שקורה על חותמת-זמן:**
// הגרסה כאן מפצלת ב-`-` ודורשת `YYYY-MM-DD` ⇒ **דוחה** חותמת. זו שב-`quotePdf` מפרסרת
// דרך `new Date()` ⇒ **בולעת** חותמת ומחזירה תאריך תקין.
// ⚠️ **ולכן אתר-קריאה של `formatDate` אינו אומר דבר עד שפתחת את שורת ה-`import` שלו.**
// *(אנקדוטה מדודה, 10/08/2026: בסריקת-סתירות דיווחתי על "באג במודול 3" ב-
// `QuoteDocumentDialog` — והוא מייבא את הגרסה של `quotePdf`, שמטפלת בחותמת נכון. **אין שם
// באג.** הראיה שהייתה עוצרת אותי הייתה באותו פלט-grep: שתי שורות `export function formatDate`.)*
// 🔑 **הכלל שנגזר: כשסורקים "איפה עוד אותו פגם חי" — פותרים את הייבוא, לא את השם.
// ושתי הגדרות של אותו שם באותו פלט-חיפוש הן הריח שמחייב זאת.**
// 🔴 **תאריך-בלבד (`YYYY-MM-DD`), ובמכוון לא חותמת-זמן.** קלט שאינו כזה מוחזר כ-`emptyText`
// ולא נחתך בשקט — כי חיתוך היה מציג את **התאריך לפי UTC**, ובשעות הלילה בישראל זה
// היום הקודם. מי שמחזיק חותמת-זמן קורא ל-`formatTimestamp` שמתחת.
// 🐞 **הפגם שגרם לשורה הזאת (09/08/2026):** חותמת מלאה שנמסרה לכאן הפיקה על המסך
// `09T20:33:42.432+00:00/08/2026`. ⚠️ **והבדיקה שהייתה קיימת ידעה על המלכודת וחתכה
// בעצמה לפני הקריאה** — כלומר היא הגנה על אתר-קריאה מסוים ולא על הפונקציה.
export function formatDate(isoDate, emptyText = '') {
  if (!isoDate) return emptyText
  const [year, month, day] = String(isoDate).split('-')
  if (!/^\d{4}$/.test(year ?? '') || !/^\d{2}$/.test(month ?? '') || !/^\d{2}$/.test(day ?? '')) {
    return emptyText
  }
  return `${day}/${month}/${year}`
}

// ליבה משותפת ל-formatTimestamp/formatTimestampFull (אוחד 19/08/2026 — jscpd תפס את בלוק
// ה-Intl.DateTimeFormat כפול; `withYear` הוא ההבדל היחיד בין השתיים, וההרכבה הסופית של
// כל אחת נשארת בפונקציה הציבורית שלה כי הנימוק ל"עם שנה מול בלי" שייך לקורא, לא לפירסור.
function formatIsraelTimestampParts(iso, { withYear }) {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    ...(withYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  return (type) => parts.find((part) => part.type === type)?.value ?? ''
}

// חותמת-זמן ⇒ `DD/MM HH:MM` **בשעון ישראל**, כפי שהמוקאפ המאושר מצייר ("נשלח 03/08 08:00").
// 🔴 **בלי שנה במכוון:** השורה עונה על *"מתי נשלח, וכמה זמן נשאר"* — שנה על שעון בן
// 48 שעות היא רעש.
// ⚠️ **והמרת אזור-הזמן אינה קוסמטיקה:** המסד שומר ב-UTC, ומייל שיצא ב-01:10 בלילה
// בישראל רשום שם כ-22:10 של **אתמול**. הצגה גולמית הייתה מזיזה אותו יום אחורה.
export function formatTimestamp(iso, emptyText = '') {
  if (!iso) return emptyText
  const at = formatIsraelTimestampParts(iso, { withYear: false })
  if (!at) return emptyText
  return `${at('day')}/${at('month')} ${at('hour')}:${at('minute')}`
}

// חותמת-זמן ⇒ `DD/MM/YYYY HH:MM` בשעון ישראל — הצורה המלאה, **עם** שנה.
// נפרדת מ-formatTimestamp שמעליה בכוונה: שם השנה הושמטה כי ההקשר הוא שעון בן 48 שעות,
// וכאן ההקשר הפוך — חותמת סגירה/ביטול של פרויקט נקראת גם שנים אחרי האירוע
// ("נסגר ב-… על-ידי …", מודול 6 משטח 2), ותאריך בלי שנה שם הוא חידה ולא מידע.
export function formatTimestampFull(iso, emptyText = '') {
  if (!iso) return emptyText
  const at = formatIsraelTimestampParts(iso, { withYear: true })
  if (!at) return emptyText
  return `${at('day')}/${at('month')}/${at('year')} ${at('hour')}:${at('minute')}`
}

// "18:00:00" מהמסד ⇒ "18:00". 🚫 טווח מוצג **רק כששני הקצוות קיימים** — "18:00–" נראה
// כמו תקלת-רינדור, ואירוע בלי שעת-סיום הוא מצב לגיטימי בסכמה.
export function formatTimeRange(start, end) {
  const trim = (value) =>
    typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : null
  const from = trim(start)
  const to = trim(end)
  if (!from || !to) return from ?? ''
  return `${from}–${to}`
}

// ── יום בשבוע (Step 2.4, מודול 6) ────────────────────────────────────────────
//
// 🔴 **קובץ יחיד למערך-שמות-הימים.** `src/lib/shiftInvite.js` כבר החזיק מערך זהה בתוכן
// (`WEEKDAYS`) בשביל שורת "יום שלישי הקרוב · 18:00–22:00" — הפרויקט הזה כבר שילם פעמיים
// על שתי פונקציות עם שם אחד שסטו בשקט (`StatTile`, `formatDate` — ר' תיעוד למעלה). הצורות
// שונות (כאן "שבת" חשוף, שם "יום שבת" עם קידומת) ולכן `shiftInvite.js` עבר לייבא מכאן
// ולהוסיף את הקידומת בעצמו, במקום להחזיק מערך שני.
const WEEKDAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

// שם היום בעברית (בלי קידומת "יום ") לפי תאריך `YYYY-MM-DD` — משמש למשל בקו-המשנה
// "שבת · בעוד 9 ימים" של מבט-העל בפרויקטים (מודול 6, משטח 1).
// 🔴 **חייב `Date.UTC(y, m-1, d)` ולא `new Date(iso)` מקומי.** הפענוח המקומי מזיז את התאריך
// לפי אזור-הזמן של הדפדפן/הריצה **בחלק מהתאריכים בלבד** (סביב חצות) — הבאג הכי גרוע כי הוא
// עובר את רוב הבדיקות ונופל רק סביב הגבול.
export function weekdayOf(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return ''
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return WEEKDAY_NAMES_HE[index] ?? ''
}
