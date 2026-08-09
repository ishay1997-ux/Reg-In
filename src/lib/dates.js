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

// חותמת-זמן ⇒ `DD/MM HH:MM` **בשעון ישראל**, כפי שהמוקאפ המאושר מצייר ("נשלח 03/08 08:00").
// 🔴 **בלי שנה במכוון:** השורה עונה על *"מתי נשלח, וכמה זמן נשאר"* — שנה על שעון בן
// 48 שעות היא רעש.
// ⚠️ **והמרת אזור-הזמן אינה קוסמטיקה:** המסד שומר ב-UTC, ומייל שיצא ב-01:10 בלילה
// בישראל רשום שם כ-22:10 של **אתמול**. הצגה גולמית הייתה מזיזה אותו יום אחורה.
export function formatTimestamp(iso, emptyText = '') {
  if (!iso) return emptyText
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return emptyText

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const at = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${at('day')}/${at('month')} ${at('hour')}:${at('minute')}`
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
