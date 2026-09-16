// 🧭 **שתי טרנספורמציות-גרף שנשארו ללשונית "הנהלה" — וכל השאר נמחק.**
//
// 🔴 **מה היה כאן עד 16/09 11:1X, ולמה אינו כאן יותר:** הקובץ נשא חמישה מעקפים שהלשונית
// בנתה סביב פערים ברכיבים המשותפים — ‏`withRowDoors` (שורה לחיצה) · `withTileSubRows`
// (‏`tiles[].sub` שלא רונדר) · `withCompareFormat` (‏📐4 על חצי-ההשוואה) · `useSurfaceDoors`
// (נתב-דלתות משלה). **השכבה המשותפת קלטה את חמשתם** (‏`KpiTile` · `ReportSurface` ·
// `ReportsPage`, קומיט `11f347a9`), ו**מעקף ששרד את הפער שיצר אותו הוא תצוגה כפולה**:
// שתי שורות-`sub` באריח, שתי שורות-תקרה מעל הטבלה, ושני נתבים עם שני כללי-ניווט שונים.
// ⇒ **נמחקו.** מה שנשאר כאן הוא רק מה שעדיין אין לו בית משותף.
//
// 🚫 **ואין כאן JSX ואין רכיב** — ‏`react-refresh/only-export-components` הוא שגיאה בשער,
// ולכן היגיון וקומפוננטות חיים בשני קבצים.

/**
 * מפעיל טרנספורמציה על גרף יחיד או על מערך-גרפים, **בלי לשנות את צורת `chart`** (C8):
 * אובייקט נשאר אובייקט, מערך נשאר מערך באותו אורך.
 */
export function withCharts(payload, transform) {
  const { chart } = payload
  if (!chart) return payload
  const next = Array.isArray(chart) ? chart.map(transform) : transform(chart, 0)
  return { ...payload, chart: next }
}

/**
 * מחליף את ציר-הקטגוריה למפתח שנושא תווית עברית.
 * ⚠️ **נשאר בשימוש של מ4 בלבד** — ‏`report_m04_discounts` עדיין מחזיר `xKey: 'tier'`
 * (‏`'0'` · `'1-5'` · `'6-10'` · `'10+'`) בעוד כל שורה נושאת `label` עברי (`'1–5%'`).
 * מ2 ומ3 קיבלו את התיקון בשרת במיגרציית `d2` ואינם עוברים כאן יותר.
 */
export function withLabelAxis(chart, labelKey = 'label') {
  if (chart.xKey === labelKey) return chart
  if (!chart.data?.length || !Object.hasOwn(chart.data[0], labelKey)) return chart
  return { ...chart, xKey: labelKey }
}

/**
 * 🚫 **כיבוי מפורש של הקרוס-פילטר** (`ReportSurface` · תוספת C8 16/09).
 * המנגנון המשותף מזהה מפתח-סינון **אוטומטית** כשערכי-ציר-ה-X נפגשים עם ערכי-השורות, וזו
 * ברירת-מחדל נכונה לרוב המשטחים. ‏**שני משטחי-הלשונית הזו הם החריגים המתועדים:** מ4 מסנן
 * בשרת דרך `p_drill` (שורת-השבבים), ומ6 מתועד ב-`cards-management.md` ① כמי ש**אין** בו
 * סינון-צולב כלל — ושם זה נרשם כסטייה מוצהרת מ-📐13 ולא כפער.
 * ⇒ שני סינונים מתחרים על אותה טבלה הם בדיוק המצב שבו המשתמשת רואה מספר ואינה יודעת
 * מה הוא סופר.
 */
export function withoutCrossFilter(chart) {
  return { ...chart, filter_key: false }
}
