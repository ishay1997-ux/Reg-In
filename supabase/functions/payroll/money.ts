// העתק מדויק של שלוש פונקציות-הכסף מ-`src/lib/pricing.js` — פונקציית-שרת אינה יכולה לייבא
// מ-`src/`. ⚠️ **אין כאן לוגיקה חדשה:** `document.parity.test.js` משווה את המסמך שנבנה כאן מול
// `src/lib/salaryReport.js`, ולכן סטייה בעותק הזה מפילה בדיקה ולא עוברת בשקט.

// שקלים ⇒ אגורות שלמות. קלט לא-מספרי ⇒ 0 (כמו המקור).
export function toAgorot(shekels: unknown): number {
  const n = Number(shekels)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function toShekels(agorot: number): number {
  return agorot / 100
}

// ⚠️ `Number(null)` ו-`Number('')` הם 0 ולא NaN — לכן ריק נפסל במפורש לפני ההמרה.
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
