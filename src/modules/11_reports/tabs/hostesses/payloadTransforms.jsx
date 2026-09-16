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

// 🔴 **חצי-ההשוואה של 📐1 איבד את היחידה ואת הדיוק על המסך — נמדד בדפדפן 16/09/2026,
// ואף שער לא תפס אותו.** ‏C8 מגדיר `compare: {value, label, direction}` **בלי `format`**,
// ואילו `KpiTile.CompareLine` מעצב דרך `formatByType(compare.value, compare.format)` ⇒
// ‏`undefined` נופל ל-`text` ומדפיס את המספר הגולמי. **מה שנראה בפועל בדפדפן:**
// *"התקופה המקבילה אשתקד: ⁦89⁩"* במקום `88.7%`, ו-*"(n=91): 0.3873"* במקום `0.39`
// **בעוד ערך-האריח באותו אריח בדיוק מוצג `0.46`** — שני דיוקים לאותו מדד, באותו אריח.
// ⇒ **התיקון הנכון אינו כאן** (או `compare.format` מה-RPC, או נפילה-אחורה ב-`KpiTile`,
// שניהם נוגעים בארבע הלשוניות) — והוא מדווח. עד שינחת, האריח יורש את פורמט-הערך שלו:
// זו **תוספת-מפתח בלבד**, אינה מוחקת דבר, ומפסיקה לפעול ברגע ש-`compare.format` יגיע.
export function inheritCompareFormat(payload) {
  if (!payload.tiles.some((tile) => tile.compare && tile.compare.format === undefined)) {
    return payload
  }
  return {
    ...payload,
    tiles: payload.tiles.map((tile) =>
      tile.compare && tile.compare.format === undefined
        ? { ...tile, compare: { ...tile.compare, format: tile.format } }
        : tile,
    ),
  }
}
