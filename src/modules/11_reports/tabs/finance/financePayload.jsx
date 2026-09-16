// 🧮 **מה שהלשונית "כספים" עושה ל-payload לפני שהוא מצויר — וכל השאר מגיע כמו שהוא.**
//
// 🔑 **הקובץ הזה הוא `transformPayload` של `ReportSurface` ותו לא** (חוזה נקודות-ההרחבה,
// `components/ReportSurface.jsx`): הוא **מקבל ומחזיר את צורת C8, ולעולם אינו מוחק מפתח**
// ואינו ממציא מספר. שלוש הפעולות היחידות שהוא עושה — ולכל אחת מקור כתוב:
// ① **מיפוי-תוויות של סדרת-גרף** לפי `chart.label_source` (תיקון-C8 מ-16/09) —
//    מ9 מחזיר `government`/`nonprofit` כמפתחות-enum של המסד ונוקב בקבוע העברי.
//    🔴 **מקרא שמציג `private_company` הוא בדיוק הכשל שהשדה הזה נולד למנוע.**
// ② **מפתחות-דלי-גיול ⇒ תוויות-מסך** בעמודת "מדרג" של מ9 — ר' `AGING_BUCKET_LABELS`.
// ③ **סימון העמודה הממוינת** (`columns[].sorted` ⇒ `aria-sort`, 📐9) — ר' ההערה המלאה
//    אצל `markSortedColumns`; **המועמדת מגיעה מהכרטיס, והכיוון נמדד על השורות שיורדו.**
//
// ✏️ **שתי פעולות נוספות הוסרו מכאן 16/09/2026 אחרי שהשכבה המשותפת נחתה (11f347a9 · 902bbc7f),
// וזה בדיוק הסדר הנכון — תיקון-לשונית הוא פיגום עד שהמקור מתוקן:**
// ‏· **השלמת `format` לחצי-ההשוואה** — `KpiTile` נופל היום ל-`compare.format ?? tile.format`
//   (GAP 8), ולכן אין עוד צורך להשלים אותו פר-לשונית.
// ‏· **תיקון `format:'text'` על עמודות-תאריך** — מיגרציה H2 שינתה את `sent_date`/`due_date`
//   של מ7 ומ9 ל-`format:'date'` במקור. **אומת בקריאה חיה אחרי H2**: חמש עמודות-התאריך
//   בשני המשטחים מחזירות `date`, ולכן התיקון היה הופך לקוד-מת שנראה פעיל.
//
// 🚫 **ומה שהוא בכוונה אינו עושה:** אינו מסנן שורות ואינו מוסיף אריח. שני אלה היו מזיזים
// את המספר שהאוכלוסייה (📐2) והפאג'ר (📐8) מצהירים עליו, והם מגיעים מהשרת בלבד.

import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'
import { AGING_BUCKETS } from '@/lib/reportsFinance'

// מפת הקבועים ש-`chart.label_source` רשאי לנקוב בהם. **טבלה ולא `if`** — מקור חדש הוא שורה.
const LABEL_SOURCES = { CUSTOMER_TYPE_LABELS }

// 🔴 **מפתח-דלי ⇐ התווית שעל המסך — פגם שנראה בעין בדפדפן ואף בדיקה לא תפסה (16/09/2026).**
// עמודת "מדרג" של מ9 מחזירה את **מפתח-המסד** (`d90p` · `d61_90` · `current`), והמסך הציג
// חמש מחרוזות באנגלית בטור עברי — בעוד **הגרף באותו דף** מציג את אותם דליים כ-`1–30` ·
// `61–90` · `90+`. ⇒ שתי איותים לאותו דבר על מסך אחד.
// 🔑 **התוויות אינן מומצאות כאן:** `AGING_BUCKETS` (`src/lib/reportsFinance.js`) הוא ה-SSOT
// שלהן, וההערה שם קובעת במפורש *"התוויות הן מה שמופיע על המסך (spec §1.4 · כרטיס מ9 §⑥)"*
// — כולל מקף-הטווח `–` (en-dash). ⚠️ **וזו אותה משפחה בדיוק של `chart.label_source`**,
// רק שאין ל-C8 שדה מקביל לעמודה; ⇒ מדווח כבקשת-שדה, וממופה כאן בינתיים.
const AGING_BUCKET_LABELS = Object.freeze(
  Object.fromEntries(AGING_BUCKETS.map((bucket) => [bucket.key, bucket.label])),
)

/**
 * מפרט ארבעת המשטחים של הלשונית — **דאטה, לא קוד**, וזו הסיבה שיש כאן רכיב אחד ולא ארבעה:
 * ארבעה רכיבים שכל אחד בונה את אותן חמש נקודות-הרחבה היו מפילים את jscpd (סף 3%) בדיוק
 * כפי שהאדנדום מזהיר. **ההבדל בין המשטחים הוא הנתונים שבטבלה הזו.**
 *
 * `hints` — מפתחות §⑩ של הכרטיס, לפי נקודת-ההרחבה שבה הם נמסרים.
 * `sort` — ר' `markSortedColumns`.
 * 🚫 **ומה שכבר אינו כאן:** `rowsOpenProject`. עד 16/09 הלשונית מסרה ל-`ReportSurface` עותק
 *   של `surface` עם `drill: true` רק כדי שהשורות ייפתחו (הכרעה 19). **המעטפת המשותפת פותחת
 *   היום שורה על כל `drill_key` שסוגו נתיב** (GAP 2 · `ROW_DOOR_KINDS`), והדגל הפך למזיק:
 *   `surface.drill` מדכא את הסינון-הצולב האוטומטי ומצייר פירורים אם יגיעו שתי רמות.
 * `bucketColumn` — מ9: העמודה שערכיה הם מפתחות-דלי, ר' `AGING_BUCKET_LABELS`.
 * `currentBucketTile` — מ9: אריח "שוטף" יושב ב-`meta.current_tile` ולא ב-`tiles`.
 * `openInvoicesDoor` — מ7: הקישור "כל N החשבוניות הפתוחות →" לדוח-הגיול (📑ב).
 */
export const FINANCE_SURFACE_SPECS = Object.freeze({
  'finance-overview': Object.freeze({
    hints: Object.freeze({
      top: ['reports.overview.whyAndFirst'],
      chart: ['reports.overview.tileBasis', 'reports.overview.debtSeriesBasis'],
      table: ['reports.overview.oldestSort'],
      extras: [],
    }),
    // כרטיס מ7 §⑩ ד: *"ממוינת לפי ימי-איחור בסדר יורד"* + *"aria-sort על עמודת ימי-האיחור"*,
    // וכך גם ה-`<th aria-sort="descending">ימי איחור ▼</th>` שבמוקאפ המאושר (שורה 672).
    sort: Object.freeze({ columns: [{ key: 'days_overdue', direction: 'descending' }] }),
    openInvoicesDoor: true,
  }),
  profitability: Object.freeze({
    hints: Object.freeze({
      top: ['reports.profitability.whyAndFirst'],
      chart: ['reports.profitability.tileBasis'],
      table: ['reports.profitability.sortWhy'],
      extras: [],
    }),
    // 📑ב#5 נועל מיון-ברירת-מחדל **לפי ₪**. `groupKey`: שורות מתחת לרצפת-המהותיות יורדות
    // לסוף הרשימה (כרטיס §⑦), ולכן הטור יורד **בתוך כל אחת משתי הקבוצות** ולא לאורך כולו.
    sort: Object.freeze({
      columns: [{ key: 'deviation', direction: 'descending' }],
      groupKey: 'below_materiality',
    }),
  }),
  aging: Object.freeze({
    hints: Object.freeze({
      top: ['reports.aging.whyAndFirst'],
      chart: [
        'reports.aging.overdueBasis',
        'reports.aging.bucketOrder',
        'reports.aging.currentTile',
      ],
      table: [],
      extras: [],
    }),
    // רמות 0 ו-2 ממוינות לפי ימי-איחור (`summariseAging`, `src/lib/reportsFinance.js`), ורמה 1
    // — הלקוחות שבמדרג — **לפי הסכום**. שתי ההצהרות כתובות במוקאפ עצמו כ-`aria-sort`:
    // `ימי איחור ▼` בטבלת מ7 (שורה 672) ו-`₪ ▼` בטבלת-הלקוחות של מ9 (שורה 1212).
    sort: Object.freeze({
      columns: [{ key: 'days_overdue', direction: 'descending' }],
      byLevel: { 1: [{ key: 'amount', direction: 'descending' }] },
    }),
    bucketColumn: 'bucket',
    currentBucketTile: true,
  }),
  equipment: Object.freeze({
    hints: Object.freeze({
      top: ['reports.equipment.whyAndFirst'],
      chart: ['reports.equipment.tileBasis', 'reports.equipment.sortWhy'],
      table: [],
      extras: ['reports.equipment.orderCeiling'],
    }),
    // הטבלה הראשית לפי העלות שהיא מציגה (📐7 · כרטיס מ12 ③); טבלת-ההזמנה לפי הכמות.
    sort: Object.freeze({
      columns: [
        { key: 'ordered_cost', direction: 'descending' },
        { key: 'qty', direction: 'descending' },
      ],
    }),
  }),
})

/** מפתחות-דלי בעמודה אחת ⇒ התוויות של `AGING_BUCKETS`. ערך שאינו מפתח מוכר נשאר כפי שהוא. */
function withBucketLabels(payload, columnKey) {
  if (!columnKey || !payload.rows?.length) return payload
  if (!payload.columns?.some((c) => c.key === columnKey)) return payload
  if (!payload.rows.some((row) => AGING_BUCKET_LABELS[row[columnKey]])) return payload
  return {
    ...payload,
    rows: payload.rows.map((row) => {
      const label = AGING_BUCKET_LABELS[row[columnKey]]
      return label ? { ...row, [columnKey]: label } : row
    }),
  }
}

function mapSeriesLabels(chart) {
  const dictionary = LABEL_SOURCES[chart?.label_source]
  if (!dictionary || !Array.isArray(chart.series)) return chart
  return {
    ...chart,
    series: chart.series.map((s) => ({ ...s, label: dictionary[s.label] ?? s.label })),
  }
}

/** `chart` הוא אובייקט, מערך באורך ≤ 2, או `null` (C8) — שלושתם עוברים דרך אותה פונקציה. */
function mapChartLabels(payload) {
  if (!payload.chart) return payload
  const chart = Array.isArray(payload.chart)
    ? payload.chart.map(mapSeriesLabels)
    : mapSeriesLabels(payload.chart)
  return { ...payload, chart }
}

/**
 * כיוון-המיון של קטע-שורות בעמודה אחת:
 * `'descending'`/`'ascending'` · `null` (קטע שטוח או בן שורה אחת — אינו מעיד) ·
 * `false` (**סותר**: לא-מספרי, או עולה ויורד לסירוגין).
 */
function segmentDirection(rows, key) {
  const values = rows.map((row) => row[key])
  if (values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) return false
  let up = false
  let down = false
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) up = true
    if (values[i] < values[i - 1]) down = true
  }
  if (up && down) return false
  if (down) return 'descending'
  if (up) return 'ascending'
  return null
}

/** חלוקה לקטעים רצופים לפי ערך-דגל (מ8: מתחת-לרצפה מול בתוך-הדירוג). */
function segmentsBy(rows, groupKey) {
  if (!groupKey) return [rows]
  const segments = []
  for (const row of rows) {
    const last = segments[segments.length - 1]
    if (last && last.flag === row[groupKey]) last.rows.push(row)
    else segments.push({ flag: row[groupKey], rows: [row] })
  }
  return segments.map((s) => s.rows)
}

function renderedDirection(rows, key, groupKey) {
  let direction = null
  for (const segment of segmentsBy(rows, groupKey)) {
    const found = segmentDirection(segment, key)
    if (found === false) return null
    if (found === null) continue
    if (direction && direction !== found) return null
    direction = found
  }
  return direction
}

/**
 * 📐9 — `aria-sort` על העמודה הממוינת.
 *
 * 🔴 **למה זה נגזר כאן ולא מוצהר, ומה ההבדל:** `columns[].sorted` הוא שדה של C8 ומקומו
 * ב-RPC; **ארבעת משטחי-הכספים אינם מחזירים אותו** (נמדד חי 16/09/2026 על ארבעת ה-payloads:
 * `sorted` חסר בכל 27 העמודות, ו-`meta.sort` אינו קיים) ⇒ בלי זה אין `aria-sort` כלל,
 * וזו אחת מארבע דרישות-הנגישות ש-`ReportTable` נבנה סביבן.
 * 🔑 **והשמירה מפני "הצהרה שאינה נמדדת", שהיא כל העניין — והיא דו-צדדית:**
 * **גם העמודה וגם הכיוון מוצהרים מראש** מהמוקאפ ומהכרטיס *(שני ה-`aria-sort` המצוירים:
 * `ימי איחור ▼` בשורה 672 · `₪ ▼` בשורה 1212 · 📑ב#5 · 📐7)*, ואז **נמדדים על השורות
 * שעומדות לרדת למסך**. ⇒ עמודה שסדרה בפועל אינו מסכים עם ההצהרה **אינה מסומנת כלל**,
 * ו-`aria-sort` שגוי אינו יכול להיווצר מסדר מקרי בטבלה בת שתי שורות.
 * 🚫 **ומתבטל מעצמו:** אם ה-payload כבר נושא `meta.sort` או `columns[].sorted` — לא נוגעים.
 */
function markColumns(columns, rows, declared, groupKey) {
  if (!columns?.length || !rows?.length) return columns
  if (columns.some((c) => c.sorted)) return columns
  for (const { key, direction } of declared) {
    if (!columns.some((c) => c.key === key)) continue
    if (renderedDirection(rows, key, groupKey) !== direction) continue
    return columns.map((c) => (c.key === key ? { ...c, sorted: direction } : c))
  }
  return columns
}

function markSortedColumns(payload, sort) {
  if (!sort?.columns?.length || payload.meta?.sort) return payload
  // רמת-הקידוח מחליפה את ההצהרה, כי כל רמה היא טבלה אחרת עם מיון אחר (מ9).
  const declared = sort.byLevel?.[payload.drill?.level] ?? sort.columns
  const columns = markColumns(payload.columns, payload.rows, declared, sort.groupKey)
  const tables = payload.meta?.extra_tables
  // C8 `meta.extra_tables` — כל טבלה נוספת מקבלת את אותו טיפול, כי `ReportSurface`
  // מרנדר גם אותה דרך `ReportTable`, ו-📐9 אינו חל על הטבלה הראשית בלבד.
  const extraTables = tables?.map((t) => ({
    ...t,
    columns: markColumns(t.columns, t.rows, sort.columns, sort.groupKey),
  }))
  if (columns === payload.columns && !extraTables) return payload
  return {
    ...payload,
    columns,
    meta: extraTables ? { ...payload.meta, extra_tables: extraTables } : payload.meta,
  }
}

/** `transformPayload` של הלשונית — שלוש הפעולות של הכותרת, בסדר הזה. */
export function transformFinancePayload(payload, spec) {
  const labelled = withBucketLabels(mapChartLabels(payload), spec.bucketColumn)
  return markSortedColumns(labelled, spec.sort)
}
