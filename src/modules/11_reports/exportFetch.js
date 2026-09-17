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
export async function fetchExportData({ rpc, from, to, customerId }) {
  const payload = await callReport(rpc, {
    from: from || null,
    to: to || null,
    customerId: customerId || null,
    drill: null,
  })

  const total = payload?.meta?.row_total ?? null
  const label = TOP_N_LABELS[rpc] ?? null

  return {
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
