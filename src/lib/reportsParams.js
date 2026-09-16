// ארבעת פרמטרי-המערכת שדוחות מודול 11 קוראים בזמן-ריצה, והמשפט שנאמר כשאחד מהם חסר.
// 🚫 טהור לחלוטין (בלי Supabase, בלי שעון, בלי DOM) — אותה מוסכמה כמו כל `src/lib/`.
//
// 🔴 **למה הקובץ הזה קיים בכלל:** שורת-`params` חסרה **אינה** שגיאה — היא מחזירה
// `undefined`, ו-`Number(undefined)` הוא `NaN` שמתגלגל בשקט ל-0 או ל-"לא נדלק אף פעם".
// ‏`מקדם_אמינות_אדום` שחסר פירושו שדוח "אמינות והתייצבות" **לא יצבע אף דיילת באדום** —
// כלומר יקרא כבשורה טובה ("אין דיילות בסיכון") בזמן שהוא פשוט לא יודע. ⇒ אומרים זאת
// במפורש, לעולם לא ברירת-מחדל שקטה (מדריך-המיקרו §C5 · כרטיס ת6 · דפוס מ7).
//
// 🧬 **הנוסח מועתק מהמסך הקיים ולא נכתב מחדש** — `missingParamsMessage` ב-`src/lib/quotes.js`
// (שממנה נגזרת `missingDashboardParamsMessage` ב-`src/lib/dashboard.js`):
//   `<תווית>: <שמות> — <השלכות>. <פעולה> בהגדרות המערכת.`
// כולל התאמת מין-ומספר, וכולל **השלכה פר-פרמטר** ולא משפט כללי: המשתמשת צריכה לדעת מה
// לא עובד עכשיו, לא רק שחסרה שורה.
// ✏️ **ההבדל היחיד מהמקור, והוא מכוון:** כאן `null` כשהכול תקין (ולא `''`) — שני הערכים
// נופלים באותה צורה ב-`{message && <banner/>}`, וה-`null` נאמר במפורש בחוזה הקריאה.

export const REPORT_PARAM_NAMES = {
  distantCustomerMultiplier: 'מכפיל_מרווח_מתרחק',
  budgetDeviationPercent: 'סף_סטיית_תקציב_אחוז',
  reliabilityRed: 'מקדם_אמינות_אדום',
  reliabilityAmber: 'מקדם_אמינות_ענבר',
}

// ההשלכה של כל שורה חסרה, במילים של המסך — מה **לא יעבוד**, לא מה "לא נטען".
const MISSING_EFFECTS = {
  [REPORT_PARAM_NAMES.distantCustomerMultiplier]: 'אין סימון "לקוח מתרחק" בדוח הלקוחות',
  [REPORT_PARAM_NAMES.budgetDeviationPercent]: 'אין סימון חריגת-תקציב בדוח רווחיות הפרויקטים',
  [REPORT_PARAM_NAMES.reliabilityRed]: 'אין סימון אדום בדוח אמינות הדיילות',
  [REPORT_PARAM_NAMES.reliabilityAmber]: 'אין סימון ענבר בדוח אמינות הדיילות',
}

const ALL_REPORT_PARAM_NAMES = Object.values(REPORT_PARAM_NAMES)

// "לא נטען ≠ אפס", בשורה אחת ובמכוון: אותה סמנטיקה חיה כבר פעמיים כפונקציה פרטית
// (`paramNumber` ב-`quotes.js` וב-`dashboard.js`), ועותק שלישי בצורת פונקציה היה נתפס
// ע"י `sonarjs/no-identical-functions` — שכבר תפס בדיוק את המקרה הזה ב-01/08/2026.
// ⚠️ `Number(null)` ו-`Number('')` הם 0, ולכן הפסילה קודמת להמרה — **וגם `Number('  ')` הוא 0**,
// ולכן הגזירה. שורה שהערך בה רווחים היא שורה חסרה, לא סף אפס.
const isMissingValue = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (trimmed === null || trimmed === undefined || trimmed === '') return true
  return !Number.isFinite(Number(trimmed))
}

/**
 * @param {Record<string, unknown>} paramsMap מפה של שם-פרמטר (כפי שהוא ב-`params.param_name`) → ערך
 * @param {string[]} names תת-קבוצה לבדיקה; ברירת-המחדל היא ארבעתם
 * @returns {string|null} המשפט העברי, או `null` כשכל השורות קיימות
 *
 * ‏`names` קיים מאותו נימוק שכתוב מעל `missingDashboardParamsMessage`: לדווח למנהלת-הגיוס
 * על סף-תקציב שאינו משנה דבר בלשונית שלה זה רעש, והרעש הוא מה שגורם לבאנרים להיקרא כרקע.
 */
export function missingReportParamsMessage(paramsMap, names = ALL_REPORT_PARAM_NAMES) {
  const values = paramsMap ?? {}
  const missing = names.filter((name) => isMissingValue(values[name]))
  if (missing.length === 0) return null

  const effects = missing.map((name) => MISSING_EFFECTS[name]).filter(Boolean)
  // התאמת מין ומספר — תווית שאומרת "השורות" על שורה אחת נקראת כמו טקסט מתורגם.
  const label = missing.length === 1 ? 'חסר פרמטר מערכת' : 'חסרים פרמטרי מערכת'
  const action = missing.length === 1 ? 'יש להוסיף את השורה' : 'יש להוסיף את השורות'
  return `${label}: ${missing.join(', ')} — ${effects.join(', ')}. ${action} בהגדרות המערכת.`
}
