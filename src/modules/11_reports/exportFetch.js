// שליפת-הנתונים של חלון-הייצוא — **הקובץ היחיד כאן שיודע שמדובר בדוחות.**
//
// 🔑 **למה שליפה עצמאית ולא מחזור של `rows` שעל המסך:** ההכרעה של ישי (17/09/2026) הפכה את
// הייצוא לכלי שליפה שאינו תלוי במסך — *"לא מעניין מה היה במסך מקודם בכלל"* — ולכן החלון בוחר
// דוח, תקופה ולקוח בעצמו. ⚠️ **ויש לכך גם סיבה הנדסית שנייה, שתגיע גם בלי ההכרעה:** דפדוף-השרת
// שהסשן המקביל בונה יהפוך את `rows` של המסך ל**עמוד אחד**, וייצוא שממחזר אותו היה מצטמצם בשקט.
//
// 🚫 **לעולם לא `supabase.from`.** קריאה ישירה לטבלאות **אינה** מדליפה כסף — היא מחזירה
// `{ data: [], error: null }` ומייצרת xlsx **ריק בשקט** (`api.js:9-11`, הכשל השקט של RLS).
// ⇒ הכול דרך `callReport`, שגם אוכף את צורת-התשובה וזורק בקול כשהיא סטתה.
//
// 📌 **`p_asof` אינו נשלח — ולא במקרה.** שתי פונקציות נושאות אותו (`report_m07_finance_overview`
// ו-`report_m09_aging`, נמדד ב-`pg_proc` 17/09/2026) והשאר לא. ‏`callReport` שולח פרמטרים
// **בשם**, ולכן ההבדל שקוף לקורא והברירה-מחדל של המסד תופסת. 🔴 **האיסור היחיד: קריאה לפי מיקום.**

import { callReport } from '@/modules/11_reports/api'
import { findTab } from '@/modules/11_reports/reportsCatalog'

// 🔴 **שלושת המשטחים האלה אינם "חתוכים" — הם רשימות-שיא מתוכננות**, וזו הבחנה מוצרית שנקראה
// מה-SQL ולא הונחה: מ07 — *"הטבלה מציגה את 4 הישנות ביותר בלי פאג'ר + קישור 'כל N →' לדוח
// הגיול"* · מ19 — *"הטבלה · 8 הלקוחות הגדולים ב-12 החודשים"*. ⇒ הקובץ מכיל את רשימת-השיא,
// ושורת-הכמות נוקבת באוכלוסייה במקום להעמיד פנים שזה הכול.
const TOP_N_LABELS = Object.freeze({
  report_m02_exec_overview: '8 האירועים הגדולים',
  report_m07_finance_overview: '4 החשבוניות הישנות ביותר',
  report_m19_customers_overview: '8 הלקוחות הגדולים',
})

// 🔴 **חמשת הדוחות שהשרת חותך, ולכן היחידים שמקבלים `p_page_size`** (מיגרציית K1, 17/09/2026 —
// `20260917150000_module11_k1_pagination_params.sql`, הכותרת). 11 האחרים מחזירים הכול ממילא,
// ופרמטר שאינו בחתימה שלהם היה מפיל את הקריאה. **"כל השורות" = `p_page_size` בגודל האוכלוסייה
// (`meta.row_total` מהשליפה הראשונה)** — ולא `null`. תיעוד PostgreSQL מגדיר `LIMIT NULL` כבלי-הגבלה
// ו-`OFFSET NULL` כ-0 (✏️ תוקן 23/09 — הנוסח הקודם טען שההתנהגות לא מוגדרת), אבל מספר שנמדד
// מאותו שרת הוא מה ששורת-הכמות מבטיחה, והקובץ חייב להיות שווה לה — לא לסמנטיקה של SQL.
const PAGED_RPCS = new Set([
  'report_m02_exec_overview',
  'report_m19_customers_overview',
  'report_m07_finance_overview',
  'report_m04_discounts',
  'report_m06_staffing',
])

/** ארבעת הדוחות של הלשונית, בצורה שהחלון מבין. לשונית לא-מוכרת ⇒ רשימה ריקה, לא קריסה. */
export function reportsOfTab(tabKey) {
  const tab = findTab(tabKey)
  return (tab?.surfaces ?? []).map((surface) => ({
    id: surface.slug,
    name: surface.name,
    rpc: surface.rpc,
  }))
}

/**
 * שליפה אחת לחלון. מחזיר **רק** את מה שהחלון צריך — הוא אינו מקבל את ה-payload המלא,
 * כדי שלא ייווצר צרכן שני לשדות שהמסך מפרש אחרת.
 */
export async function fetchExportData({
  rpc,
  from,
  to,
  customerId,
  showAll = false,
  rowTotal = null,
}) {
  // "כל השורות" (הכרעת-ישי 17/09: *"כל השורות שעומדות במסנן"*): רק לדוח חתוך, ורק כשגודל
  // האוכלוסייה כבר ידוע מהשליפה הקודמת. אחרת — השליפה הרגילה, והתיבה עדיין מוצגת כי `topN` נגזר.
  const wantsAll = showAll && PAGED_RPCS.has(rpc) && Number.isInteger(rowTotal) && rowTotal > 0
  const payload = await callReport(rpc, {
    from: from || null,
    to: to || null,
    customerId: customerId || null,
    drill: null,
    ...(wantsAll ? { pageSize: rowTotal } : {}),
  })

  const total = payload?.meta?.row_total ?? null
  const label = TOP_N_LABELS[rpc] ?? null

  return {
    // מזהה-הדוח נוסע עם הנתונים — `ExportBar` משתמש ב-`row_total` רק כשהוא של אותו דוח.
    rpc,
    columns: payload?.columns ?? [],
    rows: payload?.rows ?? [],
    // ⚠️ `row_total` שאינו גדול ממספר השורות אינו "חיתוך" — ולכן לא נאמר עליו דבר.
    rowTotal: total,
    windowLabel: payload?.window?.label ?? null,
    blockedReason: payload?.meta?.export_blocked_reason ?? null,
    // רשימת-שיא מוצהרת רק כשידוע גם גודל האוכלוסייה — אחרת המשפט היה נוקב במספר שאין לו מקור.
    topN: label && total !== null ? { label, total } : null,
  }
}
