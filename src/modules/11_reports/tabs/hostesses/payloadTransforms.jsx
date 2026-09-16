// טרנספורמציות-הלקוח של לשונית "דיילות" — **הכול טהור**, בלי JSX, בלי רשת, בלי שעון.
//
// 🔑 **מה מותר לטרנספורמציה לעשות, ומה לא** (`ReportSurface.jsx`, חוזה נקודות-ההרחבה):
// היא מקבלת את מטען-C8 שחזר מהשרת ומחזירה **את אותה צורה** — סינון-לקוח, מיפוי-תוויות,
// מיסוך. 🚫 **לעולם אינה מוחקת מפתח** ולעולם אינה רצה על כשל (‏`payload === null`).
//
// 🔴 **ולמה הפונקציות כאן ולא בתוך הלשונית:** ‏📐8 קובע שהפאג'ר סופר **את מה שמוצג**, ולכן
// הסינון חייב לקרות **לפני** ש-`ReportTable` מקבל את השורות — כלומר בשכבה הזו בדיוק.
// שלושה משטחים מסננים, ושלושה עותקים של אותו `rows.filter` הם מה ש-jscpd תופס.

import { WEEKDAY_NAMES_HE } from '@/lib/dates'
import { HOSTESS_STATUS_LABELS } from '@/lib/hostesses'

// C8 `chart.label_source` — ה-RPC מחזיר מפתח-מכונה (‏`dow` 0–6) ונוקב בקבוע העברי שממנו
// נגזרת התווית. 🔴 **בלי זה ציר יום-בשבוע של מ15 מרונדר `0 1 2 3 4 5`** — נמדד ונרשם
// בכותרת מיגרציית F2, והקבוע אכן לא היה מיוצא עד הצעד הזה.
const LABEL_SOURCES = { WEEKDAY_NAMES_HE }

function mapOneChart(chart) {
  const names = LABEL_SOURCES[chart?.label_source]
  if (!names || !Array.isArray(chart.data)) return chart
  const xKey = chart.xKey ?? 'x'
  return {
    ...chart,
    // ⚠️ אידמפוטנטי בכוונה: ערך שכבר מופה הוא מחרוזת עברית, `names[…]` עליו הוא `undefined`,
    // והנפילה-אחורה מחזירה אותו כפי שהוא. טרנספורמציה שרצה פעמיים אינה מוחקת תוויות.
    data: chart.data.map((row) => ({ ...row, [xKey]: names[row[xKey]] ?? row[xKey] })),
  }
}

/** מיפוי `chart.label_source` — עובד גם על גרף יחיד וגם על מערך (C8: עד שניים לדף). */
export function mapChartLabels(payload) {
  if (!payload.chart) return payload
  const chart = Array.isArray(payload.chart)
    ? payload.chart.map(mapOneChart)
    : mapOneChart(payload.chart)
  return { ...payload, chart }
}

/** סינון-לקוח על שורות-הטבלה הראשית. 📐8 — הפאג'ר סופר את מה שנשאר. */
export function filterRows(payload, keep) {
  return { ...payload, rows: payload.rows.filter(keep) }
}

// 🔴 **מ16 · כיבוי מפורש של הסינון-הצולב — וזו הכרעת-משמעות, לא כיוונון.**
// המעטפת מזהה מפתח-סינון אוטומטית כש-`chart.xKey` הוא גם מפתח-שורה, וערכיהם נפגשים
// (`ReportSurface.autoFilterKey`). בפיזור של מ16 שני התנאים מתקיימים על **`hourly_rate`**
// — נמדד: `xKey='hourly_rate'`, העמודה קיימת, והערכים נפגשים ⇒ הזיהוי תופס.
// ⚠️ **ומה שהיה קורה אז:** לחיצה על נקודה הייתה מסננת את הטבלה **לכל הדיילות שתעריפן זהה**
// — קבוצה שאין לה שום משמעות מוצרית. שאלת-הדף היא *"מי שווה את התעריף שלה"*, כלומר
// ה**נקודה** היא דיילת, לא התעריף. 🚫 מזהה-דיילת אינו במטען-הגרף כמפתח-שורה
// (`hostess_id` בגרף מול `drill_key.id` בשורות), ולכן אין מה לסנן לפיו **מהלקוח**.
// ⇒ **כבוי כאן בשורה אחת**, והתיקון הנכון — `chart.filter_key: 'hostess_id'` מהשרת עם
// אותו מפתח בשורות — מדווח ואינו נעשה כאן (`C8` · `ReportSurface` ①).
export function disableCrossFilter(payload) {
  if (!payload.chart || Array.isArray(payload.chart)) return payload
  if (payload.chart.filter_key === false) return payload
  return { ...payload, chart: { ...payload.chart, filter_key: false } }
}

/** מ15 · שבב *"אדומות וענבר בלבד"* — ‏`rows[].band` הוא `'red'`/`'amber'`, ו-`null` ללא-מסומנת. */
export const isFlagged = (row) => row.band != null

/** מ15 · שבב *"פעילות בלבד"* — התווית נקראת מ-`HOSTESS_STATUS_LABELS` ואינה מתורגמת מחדש. */
export const isActive = (row) => row.status === HOSTESS_STATUS_LABELS.active

/** מ16 · שבב *"בלי דירוג בלבד"*, דלוק כברירת-מחדל (`meta.default_filter === 'no_rating'`). */
export const hasNoRating = (row) => row.rating === null || row.rating === undefined

// 🔴 **תיקון-יחידה בצד-הלקוח, מוצהר וזמני — ומדווח כפגם ב-RPC, לא נסגר כאן.**
// ‏`report_m17_fairness` מחזיר את שני זמני-התגובה ב**שעות** (‏`9.9` · `20.7`, כרטיס §③)
// אך מכריז עליהם `format: 'days'`. ‏`reportsFormat.FORMATTERS.days` מעגל לשלם ומוסיף
// *"ימים"* ⇒ המסך היה אומר *"10 ימים"* על תשובה שהגיעה אחרי ⁦9.9⁩ שעות — **שגוי בערך
// וביחידה כאחד**. ⇒ כאן ה-format יורד ל-`ratio` (ספרה עשרונית אחת, בלי יחידה), והיחידה
// נאמרת בשורת-ההגדרות של הדף (*"זמן-תגובה = … בשעות"*), שהיא בסיס ברמה 0.
// ⚠️ **התיקון מותנה ואידמפוטנטי** — הוא נוגע רק ב-`format === 'days'` על שני המפתחות
// האלה. ביום שבו תיקון-קדימה ב-SQL יחזיר `ratio`, התנאי פשוט לא ייתפס.
const HOURS_TILES = new Set(['median_response', 'p90_response'])

export function fixResponseTimeUnit(payload) {
  if (!payload.tiles.some((tile) => HOURS_TILES.has(tile.key) && tile.format === 'days')) {
    return payload
  }
  return {
    ...payload,
    tiles: payload.tiles.map((tile) =>
      HOURS_TILES.has(tile.key) && tile.format === 'days' ? { ...tile, format: 'ratio' } : tile,
    ),
  }
}
