// שכבת ה-API של מודול 7 (מסך-בית) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן.
// מסך-הבית קורא RPC יחיד — get_dashboard_summary — ולא מצרף טבלאות בעצמו: המיסוך
// (profit_visible/quotes_visible לפי §7.97), "היום" (שעון ישראל) והקיפולים כולם קורים בגוף
// ה-RPC (supabase/migrations/20260903184711_module7_dashboard_cancelled_on_calendar_and_profit.sql).
// src/lib/dashboard.js הוא הצרכן היחיד של הצורה שחוזרת מכאן — היא לא מעוצבת-מחדש כאן.
//
// 🔴 הלקוח אף פעם לא מחשב "היום"/"החודש" בעצמו — לא new Date(), לא Date.now(). ה-RPC מחשב את
// זה בשעון ישראל (`now() at time zone 'Asia/Jerusalem'`) ומחזיר גם today וגם month_start
// בתשובה, כדי שמסך שנטען אחרי חצות לא יציג חודש שגוי (אותו מוקש שכבר נמדד ופתור ב-
// src/lib/projectFinance.js §"מועד-פירעון").

import { supabase } from '@/supabaseClient'
import { toError } from '@/lib/apiError'

// מפתחות-החובה של השורה שחוזרת מ-get_dashboard_summary. מפתח שנעלם (undefined) הוא דריפט-צורה
// ונזרק בקול — בדיוק דוקטרינת assertFinanceShape (src/lib/projectFinance.js): "השדה לא הגיע
// כלל" (undefined) שונה מ"השדה נקרא וערכו null" (מסך חסום-הרשאה / חודש-ריק — ערך לגיטימי).
const REQUIRED_TOP_LEVEL_FIELDS = [
  'today',
  'month_start',
  'active_projects_count',
  'satisfaction_avg',
  'satisfaction_count',
  'profit_visible',
  'monthly_profit',
  'monthly_profit_project_count',
  'quotes_visible',
  'pending_quotes_count',
  'params',
  'projects',
  'pending_quotes',
]

// חמשת השדות היחידים שמותר להם null (עוגן: גוף ה-RPC — v_sat_avg/v_pending/v_profit/
// v_profit_count/v_quotes נשארים NULL כשאין נתון או כשהמסך חסום-הרשאה, וזה מכוון ולא כשל).
// כל שאר REQUIRED_TOP_LEVEL_FIELDS חייבים ערך לא-null.
const NULLABLE_FIELDS = new Set([
  'monthly_profit',
  'satisfaction_avg',
  'pending_quotes_count',
  'monthly_profit_project_count',
  'pending_quotes',
])

const REQUIRED_PARAM_FIELDS = [
  'quote_validity_days',
  'quote_expiring_soon_days',
  'event_warning_days',
]

// שומר-הצורה של השורה שחוזרת מ-get_dashboard_summary. 🔑 למה זה קיים: profit_visible/
// quotes_visible הם דגלי-מיסוך (§7.97 — אותו predicate בדיוק כמו policy-הקריאה הקיימת) —
// שדה שנעלם בשקט (undefined) היה הופך "מוסך בכוונה" ל"אין נתון בכלל", בדיוק המחלה
// ש-src/lib/projectFinance.js נבנה כדי למנוע ב'כספים'. פונקציה טהורה כדי שאפשר לבדוק אותה
// בבדיקת-יחידה בלי לדמות Supabase — ראו api.test.js.
export function assertDashboardShape(row) {
  if (row === null || row === undefined || typeof row !== 'object') {
    throw new Error('לא התקבל מסך-בית מהשרת.')
  }

  const missing = REQUIRED_TOP_LEVEL_FIELDS.filter(
    (field) => !Object.hasOwn(row, field) || row[field] === undefined,
  )
  if (missing.length > 0) {
    throw new Error(`חסרים שדות בנתוני מסך-הבית: ${missing.join(', ')}.`)
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!NULLABLE_FIELDS.has(field) && row[field] === null) {
      throw new Error(`שדה "${field}" חסר ערך (חזר null) בנתוני מסך-הבית.`)
    }
  }

  if (typeof row.profit_visible !== 'boolean') {
    throw new Error('שדה "profit_visible" אינו בוליאני בנתוני מסך-הבית.')
  }
  if (typeof row.quotes_visible !== 'boolean') {
    throw new Error('שדה "quotes_visible" אינו בוליאני בנתוני מסך-הבית.')
  }
  if (!Array.isArray(row.projects)) {
    throw new Error('שדה "projects" אינו מערך בנתוני מסך-הבית.')
  }
  if (row.params === null || typeof row.params !== 'object' || Array.isArray(row.params)) {
    throw new Error('שדה "params" חסר או שגוי בנתוני מסך-הבית.')
  }
  const missingParams = REQUIRED_PARAM_FIELDS.filter(
    (field) => !Object.hasOwn(row.params, field) || row.params[field] === undefined,
  )
  if (missingParams.length > 0) {
    throw new Error(`חסרים שדות ב-params של מסך-הבית: ${missingParams.join(', ')}.`)
  }

  return row
}

// נתוני מסך-הבית — RPC יחיד, בלי צירוף בצד-דפדפן. monthStartIso מועבר כפי-שהוא ל-p_month;
// null/לא-מועבר משאיר לשרת להכריע "החודש הנוכחי" לפי שעון ישראל — ראו הערת-הכותרת למעלה.
// מחזירה את השורה כפי-שהיא אחרי שער-הצורה — src/lib/dashboard.js הוא זה שגוזר תצוגה ממנה.
export async function getDashboardSummary(monthStartIso = null) {
  const { data, error } = await supabase.rpc('get_dashboard_summary', { p_month: monthStartIso })
  if (error) throw toError(error, 'שגיאה בטעינת מסך-הבית.')
  return assertDashboardShape(data)
}
