// 🧮 **מה שהלשונית "כספים" עושה ל-payload לפני שהוא מצויר — וכל השאר מגיע כמו שהוא.**
//
// 🔑 **הקובץ הזה הוא `transformPayload` של `ReportSurface` ותו לא** (חוזה נקודות-ההרחבה,
// `components/ReportSurface.jsx`): הוא **מקבל ומחזיר את צורת C8, ולעולם אינו מוחק מפתח**
// ואינו ממציא מספר. שלוש הפעולות היחידות שהוא עושה — ולכל אחת מקור כתוב:
// ① **מיפוי-תוויות של סדרת-גרף** לפי `chart.label_source` (תיקון-C8 מ-16/09) —
//    מ9 מחזיר `government`/`nonprofit` כמפתחות-enum של המסד ונוקב בקבוע העברי.
//    🔴 **מקרא שמציג `private_company` הוא בדיוק הכשל שהשדה הזה נולד למנוע.**
// ② **סימון העמודה הממוינת** (`columns[].sorted` ⇒ `aria-sort`, 📐9) — ר' ההערה המלאה
//    אצל `markSortedColumns`; **המועמדת מגיעה מהכרטיס, והכיוון נמדד על השורות שיורדו.**
// ③ **תיקון פורמט לעמודת-תאריך שהוכרזה `text`** — ר' ההערה אצל `withDateFormats`.
// ④ **השלמת `format` לחצי-ההשוואה של האריח** — ר' ההערה אצל `withCompareFormat`.
//
// 🚫 **ומה שהוא בכוונה אינו עושה:** אינו מסנן שורות ואינו מוסיף אריח. שני אלה היו מזיזים
// את המספר שהאוכלוסייה (📐2) והפאג'ר (📐8) מצהירים עליו, והם מגיעים מהשרת בלבד.

import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'

// מפת הקבועים ש-`chart.label_source` רשאי לנקוב בהם. **טבלה ולא `if`** — מקור חדש הוא שורה.
const LABEL_SOURCES = { CUSTOMER_TYPE_LABELS }

/**
 * מפרט ארבעת המשטחים של הלשונית — **דאטה, לא קוד**, וזו הסיבה שיש כאן רכיב אחד ולא ארבעה:
 * ארבעה רכיבים שכל אחד בונה את אותן חמש נקודות-הרחבה היו מפילים את jscpd (סף 3%) בדיוק
 * כפי שהאדנדום מזהיר. **ההבדל בין המשטחים הוא הנתונים שבטבלה הזו.**
 *
 * `hints` — מפתחות §⑩ של הכרטיס, לפי נקודת-ההרחבה שבה הם נמסרים.
 * `sort` — ר' `markSortedColumns`.
 * `dateColumns` — ר' `withDateFormats`.
 * `rowsOpenProject` — הכרעה 19: השורה **כולה** דלת לכרטיס-הפרויקט. ⚠️ המעטפת מעבירה
 *   `onDrill` לטבלה **רק** כש-`surface.drill`, ולכן משטח שאינו דוח-דריל מקבל כאן דגל
 *   והלשונית מוסרת ל-`ReportSurface` עותק של `surface` עם `drill: true` (הפירורים נשארים
 *   ריקים מעצמם — `payload.drill` הוא `null`, ו-`DrillCrumbs` מחזיר `null` מתחת לשתי רמות).
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
    dateColumns: ['sent_date', 'due_date'],
    rowsOpenProject: true,
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
    rowsOpenProject: true,
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
    dateColumns: ['sent_date', 'due_date'],
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

const DATE_FORMAT = 'date'

/**
 * 🔴 **עמודת-תאריך שהוכרזה `text` — הפגם, ולמה הוא מתוקן כאן ולא נבלע.**
 * ארבע עמודות בשני משטחים (`sent_date` · `due_date`) מוכרזות `format: 'text'`, וערכן
 * `YYYY-MM-DD`. ⇒ המסך היה מציג **2025-01-14**, בעוד המוקאפ המאושר מצייר **14/01/2025**
 * *(שורה 675 של `approved/03_tab_finance_approved.html`)* ו-`reportsFormat` כבר נושא `date`.
 * **הייצוא לאקסל נושא את אותו פגם** — `cellFor` מטפל ב-`date` ומפיל `text` לגלם.
 * ⚠️ **התיקון הנכון יושב ב-RPC** (`format` הוא שדה של C8), ולכן ההחלה כאן **מותנית**:
 * היא נוגעת רק בעמודה שהוכרזה `text`, ומתבטלת מעצמה ברגע שהשרת יכריז `date`.
 */
function withDateFormats(columns, dateColumns) {
  if (!dateColumns?.length || !columns?.length) return columns
  const fixable = (c) => dateColumns.includes(c.key) && c.format === 'text'
  if (!columns.some(fixable)) return columns
  return columns.map((c) => (fixable(c) ? { ...c, format: DATE_FORMAT } : c))
}

/**
 * 🔴 **חצי-ההשוואה (📐1) ירד למסך כמספר גולמי — וזה נמדד, לא הונח.**
 * `KpiTile` מעצב את ערך-ההשוואה ב-`formatByType(compare.value, compare.format)`, ו**אף אחד
 * מ-17 אריחי-הכספים אינו מחזיר `compare.format`** (נמדד חי 16/09/2026) ⇒ `format` הוא
 * `undefined`, הפורמטר נופל ל-`text`, והשורה הציגה **206002** במקום **206,382 ₪** —
 * כלומר 📐4 ("₪ בלי אגורות בכל מקום · אחוז בספרה אחת") נשבר בדיוק בחצי שנועד להשוות.
 * ✅ **וההשלמה אינה המצאה:** חצי-ההשוואה הוא **אותו מדד** של האריח בהגדרת 📐1, ולכן הוא
 * יורש את `tile.format` — ורק כשה-payload לא הכריז אחרת.
 * ⚠️ **התיקון הרוחבי הנכון הוא שורה אחת ב-`KpiTile`** (`compare.format ?? tile.format`),
 * שהייתה סוגרת את זה לכל שישה-עשר המשטחים; כאן הוא מוחל על הלשונית הזו בלבד, ומדווח.
 */
function withCompareFormat(tiles) {
  if (!tiles?.length) return tiles
  const needsFormat = (t) => t.compare && t.compare.format === undefined && t.format
  if (!tiles.some(needsFormat)) return tiles
  return tiles.map((t) =>
    needsFormat(t) ? { ...t, compare: { ...t.compare, format: t.format } } : t,
  )
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
  const labelled = mapChartLabels(payload)
  const fixed = {
    ...labelled,
    tiles: withCompareFormat(labelled.tiles),
    columns: withDateFormats(labelled.columns, spec.dateColumns),
  }
  return markSortedColumns(fixed, spec.sort)
}
