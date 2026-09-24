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

// 🔴 **תיקון-יחידה בצד-הלקוח — ומאז 16/09 12:0X הוא שומר-נסיגה בלבד, לא תיקון פעיל.**
// ‏`report_m17_fairness` החזיר את שני זמני-התגובה ב**שעות** (‏`9.9` · `20.7`, כרטיס §③)
// אך הכריז עליהם `format: 'days'`, ו-`reportsFormat.FORMATTERS.days` מעגל לשלם ומוסיף
// *"ימים"* ⇒ המסך אמר *"⁦10⁩ ימים"* על תשובה שהגיעה אחרי ⁦9.9⁩ שעות.
// ✏️ **נמדד היום מחדש (`results/payloads_h5`, קריאה חיה כמנכ"ל): שני האריחים מוכרזים
// עכשיו `ratio` בשרת** — מיגרציית I1 תיקנה זאת במקור. ⇒ **התנאי כאן אינו נתפס יותר.**
// 🔑 **ולמה הוא נשאר בכל זאת:** ‏I1 עדיין אינה מקומטת (`git status`: untracked), והוא
// **אידמפוטנטי ואפס-עלות** — הוא נוגע רק ב-`format === 'days'` על שני המפתחות האלה.
// ⇒ **המלצה לדיווח: למחוק אותו ברגע ש-I1 מקומטת.** שומר-נסיגה שאיש אינו יודע שהוא מת
// גרוע משומר-נסיגה שכתוב עליו שהוא מת.
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
