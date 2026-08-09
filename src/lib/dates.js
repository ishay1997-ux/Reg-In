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
export function formatDate(isoDate, emptyText = '') {
  if (!isoDate) return emptyText
  const [year, month, day] = String(isoDate).split('-')
  if (!year || !month || !day) return emptyText
  return `${day}/${month}/${year}`
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
