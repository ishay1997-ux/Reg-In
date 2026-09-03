// חלון-זמן + דפדוף לרשימות ארוכות — הלוגיקה הטהורה (ה-UI ב-`components/ListWindow.jsx`).
//
// 🔴 למה זה קיים (הכרעת-ישי 04/09/2026, אחרי זריעת-ההדגמה של מ7): לשונית "הכל" בהצעות הציגה
// 1,212 שורות, "הסתיימו" בכספים 701, ופרויקטים 827 — בלי שום חלון. הפתרון המקובל בכלי-תפעול
// (Monday · Asana · HubSpot · מערכות הנה"ח) הוא **שלושה יחד, לא אחד**: חלון-זמן כברירת-מחדל,
// חיפוש, ודפדוף של 25–50 שורות עם מונה — לא גלילה-אינסופית, שמתאימה לפיד ולא לטבלת-עבודה.
//
// 🔑 **החלון תוחם את העבר בלבד — שורה עתידית לעולם אינה מוסתרת על-ידי חלון-זמן.**
// "3 חודשים" פירושו "מלפני 3 חודשים ואילך": אירוע בחודש הבא הוא בדיוק מה שהמנהלת צריכה לראות,
// ואסור שמסנן-ברירת-מחדל יעלים אותו בשקט. זו הסיבה שיש `from` ואין `to`.
//
// ⚠️ אחד בלבד: כל מסך-רשימה משתמש בקבועים האלה ולא מגדיר משלו (מעבר-האחידות, `src/CLAUDE.md`).

export const WINDOW_OPTIONS = [
  { key: 'month', label: 'החודש' },
  { key: '90d', label: '3 חודשים' },
  { key: 'year', label: 'השנה' },
  { key: 'all', label: 'הכול' },
]
export const DEFAULT_WINDOW = '90d'
export const PAGE_SIZE = 50

const KEYS = new Set(WINDOW_OPTIONS.map((o) => o.key))

// ערך מהכתובת (`?window=`) — לא מוכר ⇒ ברירת-המחדל, בלי שגיאה ובלי מסך ריק.
export function parseWindowParam(value) {
  return KEYS.has(value) ? value : DEFAULT_WINDOW
}

// ערך מהכתובת (`?page=`) — שלם ≥1, אחרת 1. הגזירה לתקרה נעשית ב-`paginate` כי היא תלויה בכמות.
export function parsePageParam(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

// גבול-ההתחלה (ISO `YYYY-MM-DD`) של החלון, או `null` ל"הכול". מחושב על מחרוזות-ISO בלבד —
// בלי `Date` מקומי, כדי שלא יזוז עם אזור-הזמן (המוקש שנתפס ב-CI ב-`seed-lib/calendar.mjs`).
export function windowStart(key, todayIso) {
  // 🔴 בפריים הראשון של מסך `today` עדיין ריק (נקבע ב-effect) — ואז אין חלון בכלל, לא קריסה.
  // נתפס 04/09/2026 בבדיקת-העשן: `Invalid time value` הפיל את מסך-ההצעות ל-ErrorBoundary.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(todayIso ?? ''))) return null
  const [y, m, d] = todayIso.split('-').map(Number)
  switch (key) {
    case 'month':
      return `${y}-${String(m).padStart(2, '0')}-01`
    case 'year':
      return `${y}-01-01`
    case '90d': {
      const t = Date.UTC(y, m - 1, d) - 90 * 86_400_000
      return new Date(t).toISOString().slice(0, 10)
    }
    default:
      return null
  }
}

// האם תאריך נופל בחלון. תאריך חסר נשאר בפנים — שורה בלי תאריך היא ממצא להראות, לא להסתיר.
export function inWindow(dateIso, key, todayIso) {
  const start = windowStart(key, todayIso)
  if (!start || !dateIso) return true
  return String(dateIso).slice(0, 10) >= start
}

export function filterByWindow(rows, dateOf, key, todayIso) {
  if (key === 'all') return rows
  return rows.filter((row) => inWindow(dateOf(row), key, todayIso))
}

// חיתוך לעמוד. העמוד נגזר לטווח החוקי (רשימה שהתקצרה אחרי סינון לא משאירה את המשתמשת על
// עמוד ריק), והמונים הם 1-based כפי שהם מוצגים: "51–100 מתוך 701".
export function paginate(rows, page, pageSize = PAGE_SIZE) {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const startIndex = (current - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)
  return {
    pageRows,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : startIndex + 1,
    to: startIndex + pageRows.length,
  }
}
