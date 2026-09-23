// 🧱 **המרנדר המשותף של משטח-דוח — הדרך היחידה שבה שישה-עשר המשטחים מציירים.**
//
// 🔴 **למה זה קיים, וזה לא "נוחות":** §2ב C6 קובע שהרכיבים המשותפים הם **הדרך היחידה**
// שבה אריח/גרף/טבלה/ייצוא מרונדרים, כי **jscpd נופל ב-3%** ושישה-עשר משטחים דומים יפילו
// אותו ברגע שקוד יועתק בין דפים. מרנדר אחד שנגזר מ**חוזה-ה-RPC (§2ב C8)** הופך את זה
// ממשמעת-שצריך-לזכור למבנה.
//
// 🔑 **החוזה הוא המבנה:** ‏`population · window · tiles · chart · columns · rows · so_what ·
// definitions · drill · meta` — כל מפתח מצויר כאן פעם אחת, במקום הנכון לפי 📐:
// ‏📐2 הצהרת-אוכלוסייה · 📐1/📐3 אריחים · 📐5/📐6 גרף · 📐7/📐8/📐9 טבלה · 📐23 "אז מה" ·
// 📐16 הגדרות-מדדים · 📐13 פירורים · ת4 ייצוא.
//
// ⏳ **ומה שאינו קיים עדיין, במפורש:** שש-עשרה פונקציות-השרת נבנות בפזה 1–2. עד אז כל
// משטח מחזיר שגיאת-"פונקציה לא נמצאה", והמסך מציג את **מצב-התקלה** עם *"נסי שוב"* —
// 🔴 **ולעולם לא "אין נתונים"**, שהוא בדיוק מצג-השווא שמדריך-המיקרו §4.3 אוסר.

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Disclosure from '@/components/Disclosure'
import FilterPill from '@/components/FilterPill'
import { formatByType } from '@/lib/reportsFormat'
import { missingReportParamsMessage } from '@/lib/reportsParams'
import { DRILL_INTENT, ROW_DOOR_KINDS, callReport, normalizeCharts } from '../api'
import ChartCard from './ChartCard'
import DrillCrumbs from './DrillCrumbs'
import Envelope from './Envelope'
import { EMPTY_AFTER_CUSTOMER_FILTER, EMPTY_AFTER_FILTER } from './reportsCopy'
import ExportBar from './ExportBar'
import KpiTile from './KpiTile'
import ReportTable from './ReportTable'
import { ReportsShellContext } from './reportsShellContext'

// 🔒 הודעות-מסד ידועות ⇒ **נוסח משלנו**, לעולם לא המחרוזת הגולמית. אותה תבנית בדיוק כמו
// `SERVER_MESSAGE_RULES` במ7, ומאותו נימוק: מחרוזת-מסד נושאת אנגלית ושמות-פונקציה, ושניהם
// אסורים על המסך (`docs/plans/ui-copy-styleguide.md` §2א/§3ג).
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883'])
const NOT_BUILT_YET = 'הדוח הזה עדיין לא זמין במערכת.'

// 🔤 §⑥ · גלריית-המצבים, מצב 4 — נוסח-הבסיס הנעול, מושלם בשם-הדוח.
const noPermissionSentence = (name) => `אין לך הרשאה לצפות ב${name}`

function toScreenError(err) {
  // `42501` הוא `insufficient_privilege` הכללי של Postgres — ולא רק ה-raise העברי של
  // `assert_module_permission`. ⇒ מסך-הרשאה **בלי** הודעת-שרת, שאחרת הייתה מדליפה
  // `permission denied for function report_m09_aging` באנגלית לכותרת. (תקדים: מ7, מ8.)
  if (err?.code === '42501') return { kind: 'noPermission' }
  if (MISSING_FUNCTION_CODES.has(err?.code)) return { kind: 'error', detail: NOT_BUILT_YET }
  return { kind: 'error' }
}

// 🔤 נוסח-השבב כשהשרת אינו מוסר `population.summary`. ✏️ 23/09/2026: מיגרציית-הטקסט L1 הוסיפה
// אותו ל-13 פונקציות; נשארו בלעדיו רק מ3/מ4/מ6 — שיוחלפו בדוחות-החלטה (הכרעת-ישי 23/09).
const SCOPE_FALLBACK = 'מי נכלל בדוח'

/**
 * 📐2 + 📐16 — **שבב-ההיקף: מי נכלל, ואיך כל מדד נמדד.**
 * ✏️ **הכרעת-ישי א׳, 17/09/2026 — בוצע 23/09 (פזה ב׳ שלב 4):** עד כאן שורת-האוכלוסייה עמדה
 * גלויה בראש כל דף, ושורת-ההגדרות בתחתיתו — יחד ~500 תווים בכל משטח במצב 0. עכשיו: **שבב אחד
 * עם ההיקף** (*"246 אירועים שהסתיימו · מתוך 837"* — `population.summary` מהשרת), וההצהרה המלאה
 * + ההגדרות נפתחות בלחיצה. 🔑 **הנימוק המקורי של 📐2 נשמר** — *"דוח שמחריג בשקט מדבר על עולם
 * אחר"* — כי ה-`n` מתוך ה-`N` נשאר גלוי; רק **הפירוט** מתקפל (`onboarding-layer-contract.md §3`).
 * ⚠️ `data-testid` הישנים נשמרים על הפסקאות שבפנים — התוכן ב-DOM גם כשהשבב סגור.
 */
function ScopeLine({ population, definitions }) {
  if (!population?.label && !definitions) return null
  return (
    <Disclosure summary={population?.summary ?? SCOPE_FALLBACK} testId="report-scope">
      {population?.label && <p data-testid="report-population">{population.label}</p>}
      {definitions && <p data-testid="report-definitions">{definitions}</p>}
    </Disclosure>
  )
}

function Tiles({ tiles, onOpenTarget }) {
  if (!tiles?.length) return null
  return (
    // `flex flex-wrap` ולעולם לא `grid` — הכרעת-ישי 08/08, מתועדת ב-`StatTile.jsx`:
    // אריחים עוטפים ואינם נמתחים.
    <div className="mb-4 flex flex-wrap gap-3" data-testid="report-tiles">
      {tiles.map((tile) => (
        // 📏 **תיבת-האריח של המוקאפ, מילה-במילה** (`.tile { min-width:210px; flex:1 1 210px;
        // max-width:340px }`) — הקוד לא הציב גבולות כלל, ומשפט-השוואה הארוך של מ19
        // ניפח אריח אחד ושבר את השורה ל-2+2 ב-1280px (נמדד).
        // ✅ `flex-wrap` נשמר — הכרעת-ישי 08/08 (*"פלקס ולעולם לא grid"*) אינה נגועת.
        <div
          key={tile.key}
          // ✏️ 17/09/2026 — `h-full` נוסף: העוטף כבר נמתח לגובה אחיד *(ברירת `align-items: stretch`)*,
          // אבל הכרטיס עצמו מילא רק רוחב ⇒ ארבעה כרטיסים באותה שורה בארבעה גבהים.
          // ‏📏 נמדד: הפרש 17px לפני הגדלת הכתב, **39px אחריה** — הכתב הגדול שובר שורות-משנה
          // ליותר שורות ומגדיל את הפער. ‏🔑 ו-`flex flex-wrap` נשמר — הכרעת-ישי 08/08 אינה נגועה.
          // ✏️ 23/09/2026 (תקן-הכרטיס) — 210 ⇒ 180: שישה אריחים (מ17) לא נכנסו בשורה ב-1536 והשישי
          // נפל לבד לשורה שנייה. עם שורה-אחת-מתחת-לערך, 180 מספיק לתווית ולמספר.
          className="flex min-w-[180px] max-w-[340px] grow basis-[180px] [&>*]:h-full [&>*]:w-full"
        >
          <KpiTile tile={tile} masked={tile.masked} onOpenTarget={onOpenTarget} />
        </div>
      ))}
    </div>
  )
}

function MissingParamsBanner({ names }) {
  // 🔴 §7.83 — שורת-`params` חסרה **מוצהרת על המסך** ולעולם אינה מקבלת ברירת-מחדל שקטה.
  // הצורה מועתקת מ-`missingDashboardParamsMessage` (מ7), כולל ה-`role="alert"`.
  // ✏️ **והמשפט עצמו הוא של `missingReportParamsMessage` (‏T10, 17/09/2026):** הפונקציה
  // נכתבה בדיוק בשבילו ולא היה לה ולו צרכן-ייצור אחד, בזמן שכאן הודפס **שם-הפרמטר
  // החשוף**. ההבדל אינו נוסחי — היא אומרת גם **מה לא עובד עכשיו** וגם **מה לעשות**.
  // 🔑 **המפה ריקה בכוונה:** ה-RPC כבר הכריע מי חסר (`meta.missing_params`), והמסך אינו
  // קורא `params` בעצמו — מפה ריקה + הרשימה המפורשת מייצרת בדיוק את המשפט לאותם שמות.
  if (!names?.length) return null
  return (
    <p
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
      role="alert"
      data-testid="report-missing-params"
    >
      {missingReportParamsMessage({}, names)}
    </p>
  )
}

function Footers({ notes }) {
  // ✏️ 23/09/2026 — שורת-ההגדרות עברה לשבב-ההיקף (`ScopeLine`). ‏**הסייגים נשארים גלויים:**
  // `meta.notes` הם סייג-דאטה שהכרטיס מחייב על המסך (*"נמדד על N שורות מתוך M"*), לא הגדרה.
  if (!notes?.length) return null
  return (
    <p className="mt-2 text-xs text-slate-500" data-testid="report-meta-notes">
      {notes.join(' · ')}
    </p>
  )
}

// 📐9 — `aria-sort` על העמודה הממוינת: ה-RPC מסמן `columns[].sorted` (C8, תוספת 16/09);
// ‏`meta.sort` הישן נשמר כעדיפות ראשונה כדי לא לשבור payload שכבר נבדק.
function sortFromColumns(columns) {
  const column = (columns ?? []).find((c) => c.sorted)
  if (!column) return undefined
  const direction = column.sorted === 'ascending' ? 'ascending' : 'descending'
  return { key: column.key, direction }
}

/**
 * 🚪 **הכרעה 19 — "השורה **כולה** לחיצה, בכל מקום שיש בו דלת"**, ולא רק בדפי-דריל.
 * 🔴 **נמדד 16/09/2026 וזה היה פגם בכל שישה-עשר המשטחים:** ‏`onDrill` נמסר ל-`ReportTable`
 * **רק** כש-`surface.drill`, כלומר בשני משטחים מתוך 16 — בעוד **כל** המשטחים מחזירים
 * `drill_key` פר-שורה (נמדד: 16/16, מ-3 ועד 386 שורות-דלת לכל מטען). ⇒ בארבעה-עשר
 * משטחים השורה נשאה דלת שאי-אפשר היה לפתוח, והמסך לא נראה שבור ולו לרגע.
 * ⚠️ **ופירורי-הלחם נשארים דריל-בלבד** (📐13①): הם ניווט-בין-רמות, לא דלת.
 *
 * 🔑 **ולמה רשימת-`kind` ולא "כל `drill_key` פותח":** ר' `ROW_DOOR_KINDS` ב-`api.js` —
 * דלת נמדדת לפי היעד שקיים לה, ו**אותה רשימה בדיוק** היא זו שהמעטפת מנתבת לפיה.
 */
const hasRowDoor = (rows) =>
  (rows ?? []).some((row) => ROW_DOOR_KINDS.includes(row.drill_key?.kind))

// C8 `meta.extra_tables` — משטח שצריך יותר מטבלה אחת (מ12: בלוק-ההזמנות ושורות ㉗ · מ15:
// אי-הגעה לפי דירוג) — כל טבלה נוספת עם כותרת משלה ופאג'ר משלה, **דרך אותו `ReportTable`**.
// ‏`table.sort` (אם ה-RPC נתן) קודם ל-`columns[].sorted` — אותו סדר-עדיפות כמו בטבלה הראשית (נמצא באימות-הדיילות 16/09).
function ExtraTable({ table, onDrill }) {
  const [page, setPage] = useState(1)
  return (
    <section className="mb-4" data-testid="report-extra-table">
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">{table.title}</h3>
      <ReportTable
        columns={table.columns}
        rows={table.rows}
        page={page}
        onPage={setPage}
        sort={table.sort ?? sortFromColumns(table.columns)}
        // הכרעה 19 חלה גם על טבלה נוספת — דלת היא דלת, ולא משנה באיזו טבלה היא יושבת.
        onDrill={hasRowDoor(table.rows) ? onDrill : undefined}
        caption={table.title}
      />
    </section>
  )
}

/**
 * 📐8 · **תקרת-השורות של השרת, מוצהרת על המסך.**
 * ‏`meta.row_total` (תוספת C8) הוא ספירת-האוכלוסייה המלאה, בעוד `rows` מוגבל ע"י ה-RPC
 * (נמדד: מ2 ⁦8⁩ מתוך ⁦236⁩ · מ4 ⁦50⁩ מתוך ⁦731⁩ · מ6 ⁦50⁩ מתוך ⁦135⁩).
 * 🔴 **והפאג'ר **אינו** משנה את המונה שלו** — 📐8 קובע שהוא סופר **את מה שהטבלה מציגה**,
 * ושתילת `row_total` בתוכו הייתה מבטיחה עמודים שאין להם שורות. ⇒ ההצהרה היא שורה נפרדת,
 * בדיוק כפי ש-📐2 דורש לכל החרגה: **כתובה, לא שקטה.**
 *
 * 🔤 **הנוסח הוא זה שנקבע ב-§9 D-25 (16/09/2026 10:0X), מילה-במילה** — *"מוצגות N מתוך M
 * שורות"* — ו**ההכרעה גם קובעת שזו שורה אחת בלבד במעטפת המשותפת**, כלומר העותק המקומי של
 * `tabs/executive/surfaceKit.jsx` נמחק.
 * ⚠️ **ומה שמדווח ולא הוכרע כאן:** בונה-ההנהלה מדד ש-`row_total` נושא **שתי משמעויות** —
 * תקרה אמיתית (מ4: ⁦50⁩ מתוך ⁦731⁩) מול **רשימת-שיא שהשרת מחזיר בשלמותה** (מ2: ⁦8⁩ מתוך ⁦241⁩) —
 * וניסח *"שנמדדו"* כדי לא להבטיח עמוד נוסף שאינו קיים. **זו שאלת-ניסוח לשולחן-הבוקר**,
 * ולא סיבה לסטות מהכרעה רשומה (C7).
 */
function RowCapNote({ rowTotal, shown }) {
  if (rowTotal == null || rowTotal <= shown) return null
  return (
    <p className="mb-1.5 text-xs leading-relaxed text-slate-500" data-testid="report-row-cap">
      {`מוצגות ${formatByType(shown, 'int')} מתוך ${formatByType(rowTotal, 'int')} שורות`}
    </p>
  )
}

/**
 * 🏷️ **כותרת-כנה לרשימת-שיא** (הכרעת-ישי 4, 17/09/2026 — בוצע 23/09, פזה ב׳ שלב 4):
 * *"8 האירועים הגדולים · מתוך 246"* — במקום פאג'ר שאומר *"1–8 מתוך 8"* ושורה שאומרת *"מוצגות 8
 * מתוך 246 שורות"*, כלומר שני מונים שסותרים זה את זה על אותה טבלה. ⚠️ **רק כשהרשימה באמת
 * קטנה מהאוכלוסייה** — לקוח מסונן עם 3 אירועים אינו "8 האירועים הגדולים".
 */
function TopNTitle({ label, rowTotal, shown }) {
  if (rowTotal == null || rowTotal <= shown) return null
  return (
    <h3 className="mb-1.5 text-sm font-semibold text-slate-700" data-testid="report-topn-title">
      {`${label} · מתוך ${formatByType(rowTotal, 'int')}`}
    </h3>
  )
}

/**
 * 📐6/📐9 · **מפתח-הסינון-הצולב של גרף — ואיך הוא נקבע, לפי סדר:**
 * ‏① `chart.filter_key === false` ⇒ **כבוי מפורשות** (משטח שהכרטיס שלו אומר *"לא לחיץ"*
 *    — מ2 · מ8 · מ12 · הפיזור של מ6 — מוסר זאת מהשרת או מה-`transformPayload` של הלשונית) ·
 * ‏② `chart.filter_key` מחרוזת ⇒ **הצהרת-השרת**, והיא גוברת תמיד (תוספת C8 16/09) ·
 * ‏③ אחרת — **זיהוי-אוטומטי**: `chart.xKey` שהוא גם מפתח של `columns[]` או של השורות.
 *
 * 🔴 **ושלב-האימות שבסוף אינו "ליתר ביטחון" — הוא תפס פגם אמיתי בשני משטחים:** במ9
 * העמודה מחזיקה `bucket: "1–30"` (**תווית**) והשורות `bucket: "d1_30"` (**מפתח**); במ8
 * הגרף מצייר את ⁦15⁩ הסטיות הגדולות והטבלה שורות אחרות לגמרי. בשני המקרים השם תואם
 * והערכים אינם נפגשים — כלומר לחיצה הייתה מסננת ל**אפס שורות** בלי שגיאה ובלי רמז.
 * ⇒ המפתח מאומת מול הדאטה: אין ולו שורה אחת שנפגשת עם דאטום ⇒ **אין קרוס-פילטר.**
 */
function autoFilterKey(chart, columns, rows) {
  const xKey = chart?.xKey
  if (!xKey) return null
  const inColumns = (columns ?? []).some((column) => column.key === xKey)
  const inRows = (rows ?? []).some((row) => Object.hasOwn(row, xKey))
  if (!inColumns && !inRows) return null
  const xValues = new Set((chart.data ?? []).map((datum) => String(datum[xKey])))
  return (rows ?? []).some((row) => xValues.has(String(row[xKey]))) ? xKey : null
}

function chartFilterKey(chart, columns, rows, allowAuto) {
  if (chart?.filter_key === false) return null
  if (typeof chart?.filter_key === 'string') return chart.filter_key
  return allowAuto ? autoFilterKey(chart, columns, rows) : null
}

// 🔤 **נוסח האזור-החי, מילה-במילה מ-📐9:** *"מסונן למדרג 61–90; ⁦2⁩ שורות"*.
// ⚠️ **ובלי תווי-בידוד, ובכוונה:** האזור הוא `sr-only`, ונימוק-הבידוד בריפו הזה הוא
// **חזותי** במפורש (`src/CLAUDE.md`: ה-₪ נודד שמאלה לעין) — תו בלתי-נראה בטקסט שאיש
// אינו רואה אינו מוסיף דבר, ויש קוראי-מסך שמכריזים אותו.
function announceSelection(label, count) {
  const rows = count === 0 ? 'אין שורות' : count === 1 ? 'שורה אחת' : `${count} שורות`
  return `מסונן ל${label}; ${rows}`
}

// התווית שהמשתמשת רואה על הציר: `label` של הדאטום אם ה-RPC נתן אחת, אחרת ערך-ה-`xKey`.
const datumLabel = (datum, xKey) => String(datum?.label ?? datum?.[xKey] ?? '')

/**
 * 🚪 **הדלת של עמודה בגרף היא ה-`drill_key` של הדאטום — אותו שדה בדיוק שהשורה בטבלה נושאת.**
 * ✏️ **תוקן 23/09/2026 (פזה ב׳ שלב 8, תוכנית-הטיפוגרפיה §6ב):** עד כאן הגרף חיפש מוסכמת-שם
 * משלו — `"<xKey>_key"` — ובמ3 הוא חיפש `year_key`, שאינו קיים: המטען נושא `drill_key` בלבד
 * (`'drill_key', jsonb_build_object('kind','year','year',yr)` ב-`…j3….sql`). ⇒ **שלוש עמודות-השנים
 * בדף "מגמות רב-שנתיות" היו מתות לגמרי**, והשורות שמתחתן עבדו. שני מנגנונים לאותה התנהגות
 * הם בדיוק מחלקת-הפגם של D-30: ביום שהם נפרדו, איש לא ידע איזה מהם קובע.
 * ✏️ **23/09/2026 — הגיבוי למוסכמה הישנה (`<xKey>_key`, מ9 בלבד) נמחק:** מיגרציית-הטקסט L1 הוסיפה
 * `drill_key` לדאטום של מ9, ונמדד מהמסד שהוא שם. דאטום בלי `drill_key` אינו דלת.
 */
function datumDrillKey(datum) {
  return datum?.drill_key && typeof datum.drill_key === 'object' ? datum.drill_key : null
}

/** האם מפתח-הדאטום הוא הרמה הפתוחה — השוואה על הממדים בלבד; `kind` הוא סוג, לא ממד. */
const isOpenLevel = (key, drill) => {
  const dims = Object.keys(key ?? {}).filter((dim) => dim !== 'kind')
  return dims.length > 0 && dims.every((dim) => String(key[dim]) === String(drill?.[dim]))
}

/**
 * ‏`onSelect` של דף-דריל — **ירידת-רמה**, לא סינון. `null` כשאין לגרף מפתח-דריל בדאטה,
 * ‏🚫 **ואז הגרף נשאר בדיוק כפי שהיה** (בלי סמן, בלי כפתורים בטבלת-קורא-המסך): עמודה
 * שנראית לחיצה ואינה מורידה רמה גרועה מעמודה שאינה מתיימרת.
 */
function chartDrill(chart, onDrillLevel) {
  if (!onDrillLevel) return null
  // ⚠️ אין ולו דאטום אחד שנושא מפתח ⇒ אין דלת. מפתח ריק היה נכתב לכתובת כ-`{}` ומחזיר
  // את הדף לשורש בלי שאיש יבין למה.
  const usable = (chart?.data ?? []).some((datum) => datumDrillKey(datum) != null)
  if (!usable) return null
  return (datum) => {
    const key = datumDrillKey(datum)
    if (key) onDrillLevel(key)
  }
}

// 🔤 **שורת-היכולת של גרף — פזה ב׳ שלב 8.** עד היום לא הייתה אף מילה על המסך שאומרת שאפשר
// ללחוץ על גרף (לטבלה יש `ROW_ACTION`), ולכן היכולת הייתה בלתי-נראית גם היכן שעבדה.
// המשטח מוסר נוסח ירידת-רמה משלו (`chartAction`); הסינון הוא אותו משפט בכל משטח.
// ⚠️ **שם-האלמנט נגזר מסוג-הגרף** — נמדד על המסך: "לחיצה על עמודה" מעל גרף-קווים הוא הוראה
// לדבר שאינו קיים.
const CLICK_NOUN = Object.freeze({ line: 'נקודה', scatter: 'נקודה', pie: 'פלח' })
const clickNoun = (chart) => CLICK_NOUN[chart?.type] ?? 'עמודה'
const crossFilterAction = (chart) => `לחיצה על ${clickNoun(chart)} מסננת את הטבלה`
const drillActionFallback = (chart) => `לחיצה על ${clickNoun(chart)} בגרף פותחת את הפירוט`

/**
 * 🚪 **בדף-דריל שיש לו רמה נוספת, לחיצה היא ירידת-רמה — ולא דלת-ישות.**
 * 🔴 **נמדד ע"י סוכן-ה-E2E 16/09/2026:** ברמת-הדלי של מ9 השורות נושאות
 * `{ kind: 'customer', bucket: 'd90p', customer_id: 401 }` — ‏`kind` שנמצא ברשימת-הדלתות,
 * עם המזהה תחת `customer_id`. היום זה **יורד רמה נכון רק במקרה**, כי `id` חסר; ביום
 * שה-RPC יוסיף `id` אותה לחיצה תנווט למסך-הלקוח, **בלי שאף בדיקה תאדים**.
 * ⇒ המשטח מצהיר את הכוונה ב**ארגומנט שלישי** (`DRILL_INTENT`, ר' `api.js`), והמנתב בודק
 * אותה לפני ענף-הדלת — **בלי לגעת באובייקט** שנכתב לכתובת ונשלח כ-`p_drill`.
 * ⚠️ **ורק כשיש רמה נוספת**: ברמה האחרונה הדלת היא **הישות עצמה**, וזו ההתנהגות הנכונה.
 */
const isLevelKey = (drillKey, drill) =>
  Boolean(drill) && Object.keys(drill).some((dimension) => drillKey?.[dimension] !== undefined)

function drillHandlers(surface, payload, onDrill, drill) {
  const levels = payload.drill?.levels?.length ?? 0
  const hasFurtherLevel = Boolean(surface.drill) && (payload.drill?.level ?? 0) < levels - 1
  if (!hasFurtherLevel) return { drillSurface: null, rowDrill: onDrill }
  return {
    drillSurface: (next) => onDrill(next, null, DRILL_INTENT),
    // ✏️ **הסימן לפי מפתח-השורה, לא לפי המשטח — תוקן 17/09/2026 (פריט [E1]).**
    // 🔴 **הפגם שהיה כאן, נמדד פעמיים כ-E2E אדום:** הסימן נמסר ל**כל** שורה במשטח שיש לו
    // רמה נוספת, ולכן שורת-השורש של מ9 — `{kind:'project', id:1040}`, דלת מוצהרת של
    // הכרעה 19 — ירדה רמה במקום לנווט לכרטיס-הפרויקט.
    // 🔑 **המבחן שמפריד, והוא מדוד:** ברמת-הדלי השורה נושאת `{kind:'customer',
    // bucket:'d90p', customer_id:401}` — היא **חוזרת על הממד של הרמה הפתוחה** (`bucket`,
    // שהוא בדיוק המפתח שיושב ב-`?drill=`). בשורש `drill` הוא `null` ⇒ אין ממד לחזור עליו
    // ⇒ מפתח עם `id` הוא דלת. ⚠️ **וזה עובד גם ביום שה-RPC יוסיף `id` לשורת-הדלי**:
    // החזרה-על-הממד שורדת את התוספת, בעוד המבחן הישן (*"אין `id`"*) היה נשבר בשקט.
    rowDrill: (drillKey, row) =>
      onDrill(drillKey, row, isLevelKey(drillKey, drill) ? DRILL_INTENT : null),
  }
}

/** הדאטום של הרמה **הפתוחה** — כדי שהעמודה שנפתחה תישאר מסומנת (15-ד) גם אחרי הירידה. */
function activeDrillLabel(chart, drill) {
  if (!drill) return undefined
  const datum = (chart?.data ?? []).find((row) => isOpenLevel(datumDrillKey(row), drill))
  return datum ? datum[chart.xKey] : undefined
}

/**
 * 🎨 **רשימת-הגרפים כרכיב נפרד — ולא כמיפוי בתוך `ReportSurface`.**
 * 🔑 **וזה לא סגנון:** ‏SonarJS מדד את המשטח ב-39 מול תקרת-20 ברגע שהוסף לו ענף-הדריל,
 * כלומר **גלאי-הספגטי של הריפו זיהה נכון** שהפונקציה מחזיקה יותר מדי החלטות בבת-אחת.
 * כאן חיות שלוש ההחלטות של גרף יחיד: **מה לחיצה עושה** (ירידת-רמה / סינון / כלום),
 * **מה מסומן** (הרמה הפתוחה / הבחירה), ו**מה נשתל בו** (אריח-צד · כיתוב-תחתון).
 */
function SurfaceCharts({
  charts,
  payload,
  allowAutoFilter,
  isDrill,
  drillSurface,
  drill,
  selection,
  onToggle,
  renderChartAside,
  renderChartFooter,
  chartAction,
  emptyText,
}) {
  return charts.map((chart, index) => {
    const key = chartFilterKey(chart, payload.columns, payload.rows, allowAutoFilter)
    // 🚪 **בדף-דריל לחיצה על עמודה היא ירידת-רמה, לא סינון** (הכרעה הנדסית 16/09/2026 על
    // החוסם של מ9): הכרטיס קובע שעמודת-המדרג היא **פקד-הקידוח** של הדף (📐13), ועד עכשיו
    // העמודות היו **מתות לגמרי** — זיהוי-אוטומטי כבוי בדפי-דריל וה-RPC אינו מצהיר
    // `chart.filter_key` ⇒ `onSelect === undefined`.
    // ⚠️ המפתח נלקח מהדאטום עצמו (`bucket_key`): העמודה מציגה **תווית** (`"1–30"`) והשרת
    // מצפה ל**מפתח** (`"d1_30"`), והפער הזה הוא בדיוק מה ש-D-30① מתעד.
    // 🔑 המגן על עמודת-אפס ונתיב-המקלדת מגיעים מ-`ChartCard` בלי שינוי.
    const drillFromChart = chartDrill(chart, drillSurface)
    const onSelect = drillFromChart ?? selectHandler(key, chart, index, onToggle)
    const actionHint = drillFromChart
      ? (chartAction?.(payload, index) ?? drillActionFallback(chart))
      : onSelect
        ? crossFilterAction(chart)
        : null
    return (
      <ChartCard
        key={chart.title ?? index}
        chart={chart}
        // 🚫 **`onSelect` נמסר רק כשיש מפתח** — אחרת הגרף היה מקבל `cursor:pointer` וכפתורים
        // בטבלת-קורא-המסך על אינטראקציה שאינה קיימת (📐14ב③).
        onSelect={onSelect}
        actionHint={actionHint}
        // 15-ד — הגוון אומר **איפה** נבחר; הצ'יפ אומר **מה**. רק הגרף שהבחירה שייכת לו.
        // ➕ **ובדף-דריל — הרמה הפתוחה**: הדלי שנפתח נשאר טורקיז והשאר מעומעמים, אחרת
        // המשתמשת יורדת רמה והגרף נראה בדיוק כמו קודם.
        // ⚠️ **הסימון מותנה בהיותו דף-דריל ולא בקיום רמה נוספת** — ברמה האחרונה אין לאן
        // לרדת, אבל **יש מה לסמן**: הדלי שהמשתמשת נמצאת בתוכו.
        selected={isDrill ? activeDrillLabel(chart, drill) : selectedValue(selection, index)}
        aside={renderChartAside?.(payload, index)}
        footer={renderChartFooter?.(payload, index)}
        emptyText={emptyText}
      />
    )
  })
}

const selectHandler = (key, chart, index, onToggle) =>
  key ? (datum) => onToggle(index, key, chart, datum) : undefined

const selectedValue = (selection, index) =>
  selection?.chartIndex === index ? selection.value : undefined

/**
 * 🔴 **מהי "ריק" — הכרעה 16/09/2026, וזה היה מצב שלא היה ניתן להגיע אליו:**
 * המבחן הקודם היה `tiles.length || charts.length || rows.length`, וכל שישה-עשר ה-RPC מחזירים
 * אריחים **תמיד** (מערך-ליטרל קבוע בשרת) ⇒ התנאי **לעולם לא התקיים**, ומצב 2 של 📐10
 * (*"ריק-אחרי-סינון"* + *"נקי מסננים"*) היה **קוד-מת בכל המודול**.
 * ✅ **המבחן הוא האוכלוסייה עצמה** (הכרעת-המתזייר 16/09): אפס שורות **ו** `population.n = 0`.
 *
 * ✏️ **ותנאי שני, שנוסף 17/09/2026 (פריט [9]):** ‏`rows = 0` **ולקוח מסונן** ⇒ גם זה מצב 2,
 * יהיה `population.n` אשר יהיה.
 * 🔴 **הפגם שנמדד על מ21 (`probe-filters.log` 12–16):** בחירת *"אופק ביטוח ופיננסים"* הותירה
 * טבלה עם **שורת-כותרת בלבד** — בלי שורות, בלי פאג'ר ובלי משפט — בעוד שורת-האוכלוסייה,
 * שורת-"אז מה" וארבעת האריחים נשארו **זהים בתו** למסך הלא-מסונן. הסימן היחיד לכך שהבחירה
 * לא מצאה דבר היה כיתוב-הייצוא המנוטרל.
 * 🔑 **ולמה זה נכון גם כשהאוכלוסייה גדולה:** `population.n` של מ21 אינו מסונן ללקוח (זו הפאה
 * שב-RPC, מדווחת ולא מתוקנת כאן) — ולכן התנאי הקודם, ששאל **גם** על `n`, לעולם לא התקיים שם.
 * ✅ **וכלל D-34② נשמר במלואו למקרה שאין סינון**: טבלה ריקה מול אוכלוסייה גדולה בלי מסנן
 * (רשימת-חריגים בלי חריגים) היא **תשובה אמיתית** ולא מסך ריק.
 */
const isEmptyAfterLoad = (payload, customerId) =>
  payload.rows.length === 0 && ((payload.population?.n ?? 0) === 0 || Boolean(customerId))

/**
 * ‏§⑥ מצבים 2 · 3 — ריק-אחרי-סינון מול ריק-לגמרי. ‏`isFiltered` נגזר במעטפת, ר' שם.
 *
 * ✏️ **ושורת-הייצוא נשארת על המסך גם כאן (17/09/2026)** — ‏`rows` ריק, ולכן הכיתוב הוא
 * הנוסח הנעול *"אין שורות לייצא"* והכפתור מנוטרל.
 * 🔴 **וזה אינו קישוט:** ת4 מציב את ההבטחה-שלפני-הלחיצה **בשורת-המסננים של המעטפת**, ופקד
 * שנעלם ממנה במצב אחד מתוך חמישה משאיר את המשתמשת בלי לדעת אם היכולת נעלמה או שהיא בין שני
 * מסכים. ‏`e2e/reports.spec.js` (*"משטח שהסינון רוקן"*) בודק בדיוק את הצירוף: כפתור מנוטרל
 * **ועליו** הנוסח הנעול.
 */
function EmptyPage({
  surface,
  isFiltered,
  clearFilters,
  customerId,
  exportSlot,
  exportBar,
  missingParams,
}) {
  return (
    <>
      {exportSlot ? createPortal(exportBar, exportSlot) : null}
      {/* 🔴 **הבאנר קודם למצב-הריק, ואינו נבלע בו** (‏T3 · ממצא F-13, 17/09/2026):
          החזרת-הריק המוקדמת דילגה על `MissingParamsBanner` לגמרי, ולכן מטען עם אפס
          שורות **וגם** `missing_params` אמר *"אין נתונים"* — כלומר **טענה על הדאטה**
          במקום ההודאה שחסרה שורת-מערכת. זו בדיוק ברירת-המחדל השקטה ש-§7.83 אוסר,
          והמצב הזה הוא המסוכן שבהם: המסך נראה תקין לחלוטין. */}
      <MissingParamsBanner names={missingParams} />
      <Envelope
        state={isFiltered ? 'empty' : 'blank'}
        testId={`report-${surface.slug}`}
        onClearFilters={isFiltered ? clearFilters : undefined}
        // 🔤 **המשפט נוקב במסנן שבאמת רוקן** (כ17 · פריט [5], 17/09/2026): לקוח נבחר ⇒
        // נוסח-הלקוח, אחרת נוסח-התקופה. ‏🔴 **הלקוח גובר גם כשגם התקופה מסוננת**, וזו
        // הכרעה ולא סדר-מקרי: התקופה **תמיד** מסוננת (ברירת-המחדל אינה `all`), ולכן
        // "שני מסננים פעילים" הוא המצב הרגיל ולא מקרה-קצה — המסנן שהמשתמשת בחרה
        // עכשיו במו ידיה הוא הלקוח, והוא זה שהשתנה לפני שהטבלה התרוקנה.
        title={customerId ? EMPTY_AFTER_CUSTOMER_FILTER : undefined}
      />
    </>
  )
}

/**
 * ‏`surface` · `filters` · `drill` · `onDrill` — חוזה-הפרופס של רכיב-לשונית (ר' `tabs/ExecutiveTab.jsx`).
 *
 * 🔌 **חמש נקודות-ההרחבה של בונה-הלשונית — והן הדרך היחידה להוסיף, בלי לשכפל את השלד:**
 * ‏`transformPayload(payload) ⇒ payload'` — סינון-לקוח (למשל שבב *"רק בלי דירוג"* במ16 —
 *   הפאג'ר סופר את מה שמוצג, 📐8) · מיפוי תוויות (`chart.label_source` ⇒ הקבוע העברי) ·
 *   מיסוך-אריח. **מקבל ומחזיר את צורת C8; לעולם לא מוחק מפתח.**
 *   🔴 **וחייב להיות יציב-זהות** — פונקציה ברמת-מודול או `useCallback`, **לא חץ-אינליין**:
 *   התוצאה ממומואיזית על `[rawPayload, transformPayload]`, ופונקציה חדשה בכל רינדור מבטלת
 *   את המימוא. ‏**נמדד 16/09/2026:** הפיזור של מ6 (⁦717⁩ נקודות) נבנה מחדש בכל הקלדה
 *   במסנן-הלקוח ⇒ `chart` בזהות חדשה ⇒ Recharts מרנדר את כל הגרף מחדש.
 * ‏`renderTop(payload)` — מעל שורת-האוכלוסייה: רמז-ה-`purpose`/`whyAndFirst` של §⑩, שבבים.
 * ‏`renderBeforeChart(payload)` · `renderBeforeTable(payload)` — רמזי "איך לקרוא את הגרף/הטבלה".
 * ‏`renderExtras(payload)` — בתחתית: מה שייחודי למשטח *(פס-האישור של מ25 בדף 20, רמזי-מונחים)*.
 *
 * ✏️ **שלוש נקודות נוספות (16/09/2026), וכל אחת נולדה מעוגן-כרטיס שלא היה לו מקום:**
 * ‏`renderAfterSoWhat(payload)` — **בין שורת-"אז מה" לאריחים**. 🔴 שם הכרטיסים מעגנים את
 *   רמז-ה-`why` של §⑩ (*"מתחת ל-.so-what, מעל .tiles"* — נמדד במוקאפ: 470 < 476 < 482),
 *   ובלעדיה ארבע הלשוניות שתלו אותו ב-`renderTop`, כלומר **מעל שורת-האוכלוסייה**.
 * ‏`renderChartAside(payload, index)` — **לצד** הגרף (אריח-הצד *"שוטף — עוד לא באיחור"*
 *   של מ9, שהכרטיס מעגן *"בתוך .chart-card"* ושנמדד בפועל ברוחב-דף מלא **מעל** הגרף).
 * ‏`renderChartFooter(payload, index)` — **מתחת** לגרף, בתוך הכרטיס (רמזי-⑩ שהכרטיס מעגן
 *   *"מתחת ל-.legend/.barkey"*).
 * ⚠️ שתי האחרונות מקבלות גם את **מספר הגרף** — משטח עם שני גרפים צריך לבחור לאיזה מהם.
 * ‏`chartAction(payload, index)` *(23/09/2026)* — נוסח שורת-היכולת של גרף שיורד רמה
 *   (*"לחיצה על עמודה יורדת לחודשים של אותה שנה"*). בלעדיה — ניסוח כללי.
 *
 * כל השבע מקבלות את ה-payload **אחרי** `transformPayload`.
 */
export default function ReportSurface({
  surface,
  filters,
  drill,
  onDrill,
  onWindow,
  transformPayload,
  renderTop,
  renderAfterSoWhat,
  renderBeforeChart,
  renderChartAside,
  renderChartFooter,
  renderBeforeTable,
  renderExtras,
  chartAction,
}) {
  // 🚪 המעטפת יודעת מה ממוסך ואיפה יושבת שורת-המסננים; המשטח אינו יודע אף אחד מהשניים.
  const shell = useContext(ReportsShellContext)
  const [reloadTick, setReloadTick] = useState(0)

  const {
    from,
    to,
    customerId,
    windowLabel,
    isFiltered,
    clearFilters,
    reloadTick: outerTick,
  } = filters

  // 🔑 **זהות-הבקשה כמחרוזת אחת** — כל מה שמשנה *איזה* דוח מוצג. היא גם מפתח-ה-deps וגם
  // מה שמפריד בין "נטען" ל"נטען משהו אחר".
  const drillKey = drill ? JSON.stringify(drill) : ''
  const filterKey = `${surface.rpc}|${from ?? ''}|${to ?? ''}|${customerId ?? ''}|${drillKey}`
  const requestKey = `${filterKey}|${reloadTick}|${outerTick ?? 0}`

  // 🔴 **תוצאה אחת, ולא שלושה `useState` נפרדים** — וזה לא סגנון:
  // ① `payload`/`error`/`loading` כשלושה מצבים נפרדים יכולים להיות לא-עקביים לרגע
  //    (דאטה ישנה לצד שגיאה חדשה), וזה בדיוק מה שמייצר מסך שמציג מספרים של תקופה אחרת.
  // ② ‏`loading` **נגזר** מהשוואת-מפתחות ואינו נכתב ב-effect — ‏`react-hooks/set-state-in-effect`
  //    חוסם setState סינכרוני בגוף effect, ובצדק: הוא יוצר רינדור מדורג.
  // ⚠️ **מצב תלת-ערכי נשמר במלואו** (§4 של `CLAUDE.md`): `payload: null` = טרם ידוע/כשל ·
  // אובייקט = נטען. **כשל לעולם אינו הופך ל-`{}`** — זה מצג-השווא של "אין נתונים".
  const [result, setResult] = useState({ key: null, payload: null, error: null })
  const loading = result.key !== requestKey

  // 🔴 **ה-effect תלוי בפרימיטיבים בלבד.** `drill` הוא אובייקט שנפרס מהכתובת בכל רינדור
  // ו-`onWindow` היא פונקציה — שניהם מקבלים זהות חדשה בלי שהבקשה השתנתה, וברשימת-התלויות
  // הם היו מפעילים שליפה חוזרת (ובמקרה הרע לולאה: השליפה קוראת ל-`onWindow`, המעטפת
  // מתרנדרת, הפונקציה מתחלפת, השליפה חוזרת). לכן: `drill` נבנה מחדש מ-`drillKey` בתוך
  // ה-effect, ו-`onWindow` נקראת דרך ref שמתעדכן בכל רינדור (נמצא בביקורת-המסירה 16/09).
  const onWindowRef = useRef(onWindow)
  useEffect(() => {
    onWindowRef.current = onWindow
  })

  useEffect(() => {
    let cancelled = false
    const drillArg = drillKey ? JSON.parse(drillKey) : null
    callReport(surface.rpc, { from, to, customerId, drill: drillArg })
      .then((data) => {
        if (cancelled) return
        setResult({ key: requestKey, payload: data, error: null })
        // 🔴 **מכאן המעטפת לומדת מה "היום" בשעון-ישראל** — ולעולם לא מ-`new Date()` בדפדפן.
        // אותו דפוס בדיוק כמו מ7, שמחזיר `today`/`month_start` בגוף התשובה מהסיבה הזו
        // (מסך שנטען אחרי חצות היה מציג חודש שגוי). בלי זה, גלולות-התקופה היו משנות את
        // הכתובת ושולחות `null` בכל מקרה — מסנן שנראה עובד ואינו מסנן דבר.
        // ✏️ **גם `meta` וגם שם-ה-RPC נמסרים למעטפת** (17/09/2026): שם חיים הדגלים
        // שקובעים אם המסננים בכלל חלים על הדף (`readScope` ב-`ReportsPage`), והמעטפת
        // חייבת לדעת **של איזה משטח** הם — אחרת דגל של דוח קודם חל על דוח שעוד נטען.
        // ⚠️ **ומ-`data` הגולמי ולא מ-`payload` המותמר**: הדגלים הם הצהרת-שרת, והטרנספורם
        // של הלשונית הוא שכבת-תצוגה שאין לה רשות לשנות אותם.
        onWindowRef.current?.(data.window, data.meta, surface.rpc)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(`report ${surface.rpc} failed:`, err)
        setResult({ key: requestKey, payload: null, error: toScreenError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, surface.rpc, from, to, customerId, drillKey])

  // 📐6/📐9 · **הבחירה-בגרף.** ‏`{ chartIndex, filterKey, value, label }` או `null`.
  // 🔑 **נגזרת מול `requestKey`, בדיוק כמו העמוד** — שינוי-מסנן/תקופה/דריל מאפס אותה
  // **בזמן הרינדור** ולא ב-effect: בחירה של תקופה אחת אינה קיימת בהכרח באחרת, ובחירה
  // ששרדה מסנן הייתה מסננת את הטבלה לערך שאינו על הגרף.
  const [selectionState, setSelectionState] = useState({ key: null, selection: null })
  const selection = selectionState.key === requestKey ? selectionState.selection : null

  // 📐8 · עמוד — **נגזר ולא מאופס ב-effect.** כל שינוי-מסנן מחזיר לעמוד 1 (עמוד 3 של
  // תקופה אחת אינו קיים בהכרח באחרת), וההשוואה מול `filterKey` עושה זאת **בזמן הרינדור**
  // ולא בסבב שני. ⚠️ `reloadTick` בכוונה **אינו** ב-`filterKey`: "נסי שוב" אינו שינוי-סינון
  // ואינו אמור לזרוק את המשתמשת לתחילת הטבלה. ➕ **והבחירה-בגרף כן בפנים**: טבלה שהתכווצה
  // לשתי שורות בעוד הפאג'ר עומד בעמוד 3 מציגה ריק שנראה כמו "אין נתונים".
  const selectionKey = selection ? `${selection.chartIndex}:${selection.value}` : ''
  const pageKey = `${filterKey}|${selectionKey}`
  const [pageState, setPageState] = useState({ key: pageKey, page: 1 })
  const page = pageState.key === pageKey ? pageState.page : 1
  const setPage = (next) => setPageState({ key: pageKey, page: next })

  const { payload: rawPayload, error } = result
  // הטרנספורמציה של הלשונית רצה על payload שנטען בלבד — `null` (כשל/טרם) נשאר `null`.
  // 🔴 **ממומואיזית** — ר' הערת-הפרופ: בלי זה כל הקלדה במסנן בונה מחדש מטען שלם, ואיתו
  // `chart` בזהות חדשה שמכריחה את Recharts לרנדר את הגרף כולו מחדש.
  const payload = useMemo(
    () => (rawPayload && transformPayload ? transformPayload(rawPayload) : rawPayload),
    [rawPayload, transformPayload],
  )

  if (loading) return <Envelope state="loading" testId={`report-${surface.slug}`} />
  if (error?.kind === 'noPermission') {
    return (
      <Envelope
        state="noPermission"
        title={noPermissionSentence(surface.name)}
        testId={`report-${surface.slug}`}
      />
    )
  }
  if (error) {
    return (
      <Envelope
        state="error"
        detail={error.detail}
        onRetry={() => setReloadTick((t) => t + 1)}
        testId={`report-${surface.slug}`}
      />
    )
  }
  if (!payload) return <Envelope state="blank" testId={`report-${surface.slug}`} />

  const charts = normalizeCharts(payload.chart)
  // ר' `isEmptyAfterLoad` למעלה — שני התנאים והנימוק המלא של כל אחד.
  const isEmptyPage = isEmptyAfterLoad(payload, customerId)

  const crumbs = payload.drill?.crumbs ?? []
  const drillLabel = crumbs.length > 1 ? crumbs[crumbs.length - 1].label : null

  // 🚪 הכרעה 19 — הדלת נפתחת בכל משטח שיש בו `drill_key`, לא רק בשני משטחי-הדריל.
  const rowDoors = surface.drill || hasRowDoor(payload.rows)

  const { drillSurface, rowDrill } = drillHandlers(surface, payload, onDrill, drill)

  // 📐6 — **זיהוי-אוטומטי מושבת בדפי-דריל, והצהרת-שרת מפורשת עדיין עובדת בכולם.**
  // 🔴 **הנימוק מדוד ולא זהיר-סתם:** ‏📐13 מקצה לארבעת דפי-הדריל **קידוח** ולשאר
  // **סינון-צולב**, וכרטיס-מ9 (שורה 6) קובע מפורשות שלחיצה על עמודת-מדרג **יורדת רמה**.
  // קרוס-פילטר אוטומטי שם היה מחליף את הדלת שהכרטיס מכריז עליה בסינון-לקוח שקט.
  const allowAutoFilter = !surface.drill
  const selectedRows = selection
    ? payload.rows.filter((row) => String(row[selection.filterKey]) === String(selection.value))
    : payload.rows
  const announcement = selection
    ? announceSelection(selection.label, selectedRows.length)
    : undefined

  const exportBar = (
    <ExportBar
      reportName={surface.name}
      windowLabel={payload.window?.label ?? windowLabel}
      drillLabel={[drillLabel, selection?.label].filter(Boolean).join(' ') || null}
      columns={payload.columns}
      rows={selectedRows}
      blockedReason={payload.meta?.export_blocked_reason}
    />
  )

  if (isEmptyPage) {
    return (
      <EmptyPage
        surface={surface}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
        customerId={customerId}
        exportSlot={shell?.exportSlot}
        exportBar={exportBar}
        missingParams={payload.meta?.missing_params}
      />
    )
  }

  function toggleSelection(chartIndex, key, chart, datum) {
    const value = datum?.[chart.xKey]
    if (value === undefined || value === null) return
    const same = selection?.chartIndex === chartIndex && String(selection.value) === String(value)
    setSelectionState({
      key: requestKey,
      selection: same
        ? null
        : { chartIndex, filterKey: key, value, label: datumLabel(datum, chart.xKey) },
    })
  }

  return (
    <div data-testid={`report-${surface.slug}`}>
      {/* 🔤 שורת-המסננים היא של המעטפת, ולכן הייצוא נשתל לתוכה ב-`createPortal` ולא מורם
          כ-state. ר' `reportsShellContext.js` לנימוק המלא (לולאת-רינדור על `rows`). */}
      {shell?.exportSlot ? createPortal(exportBar, shell.exportSlot) : null}
      {/* 📐13① — פירורים **רק** בדפי-הדריל, ורק כשיש יותר מרמה אחת. */}
      {surface.drill && <DrillCrumbs crumbs={crumbs} onNavigate={(next) => onDrill(next)} />}
      {renderTop?.(payload)}
      <ScopeLine population={payload.population} definitions={payload.definitions} />
      <MissingParamsBanner names={payload.meta?.missing_params} />

      {/* ת4 — *"בדיוק מה שעל המסך"*: הייצוא מקבל את השורות **אחרי** הבחירה-בגרף, ותווית
          הבחירה נכנסת לשם-הקובץ לצד רמת-הדריל (*"גיול-חובות_2026_61-90.xlsx"*).
          ⚠️ ובחירה שלא הותירה שורות ⇒ הכפתור מנוטרל עם *"אין שורות לייצא"* — הנוסח הנעול
          של `reportsExport.js`, בלי לגעת בו.
          ✏️ **והוא מצויר לתוך שורת-המסננים של המעטפת** (16/09/2026) — שם המוקאפ המאושר
          מציב אותו, ר' `reportsShellContext.js`. בלי מעטפת הוא נשאר כאן, במקומו הישן. */}
      {shell?.exportSlot ? null : exportBar}

      {/* 📐23 · הכרעה 15-ג — שורת-"אז מה", פעולה קודמת לעובדה.
          🔴 **מעל האריחים, ולא מתחתיהם — נמדד ולא הונח (16/09/2026):** בכל **⁦19⁩ דפי-הדוח**
          שבארבעת המוקאפים המאושרים (`docs/mockups/management-report-screen/approved/`)
          `.so-what` מופיע **לפני** `.tiles` בסדר-המסמך, ⁦19⁩ מתוך ⁦19⁩ בלי יוצא-דופן; וכך גם
          שלד-ה-HTML של `design-contract §⑥`. ‏✅4 קובע *"סדר ⇐ המוקאפ"*, והקוד עקב אחרי
          הסדר ההפוך עד כאן. */}
      {payload.so_what && (
        <p
          className="mb-4 border-r-[3px] border-teal-600 px-3.5 py-1.5 text-sm font-semibold text-teal-700"
          data-testid="report-so-what"
        >
          {payload.so_what}
        </p>
      )}

      {/* ✏️ ⑩א — **בין "אז מה" לאריחים**, בדיוק במקום שהכרטיסים מעגנים בו את רמז-ה-`why`. */}
      {renderAfterSoWhat?.(payload)}

      <Tiles tiles={payload.tiles} onOpenTarget={(target) => onDrill(target)} />

      {charts.length > 0 && renderBeforeChart?.(payload)}
      <SurfaceCharts
        charts={charts}
        payload={payload}
        allowAutoFilter={allowAutoFilter}
        isDrill={Boolean(surface.drill)}
        drillSurface={drillSurface}
        drill={drill}
        selection={selection}
        onToggle={toggleSelection}
        renderChartAside={renderChartAside}
        renderChartFooter={renderChartFooter}
        chartAction={chartAction}
        // ✏️ 17/09/2026 — הגרף אומר את אותו משפט-ריקות שהמעטפת אומרת: לפי המסנן שרוקן (כ17).
        emptyText={customerId ? EMPTY_AFTER_CUSTOMER_FILTER : EMPTY_AFTER_FILTER}
      />

      {/* 🔤 *"× נקי בחירה"* — ✏️ **הוכרע 16/09/2026:** ‏`spec.md §1.5` נועל **ציווי בנקבה**
          (וכך גם S-28), והמוקאפ המאושר כותב את המילה הזו בשורה 897. הנוסח *"נקה"* שעמד כאן
          הועתק מהכרעה 15-ד, ו**כלל-ניסוח כתוב גובר על ציטוט-נוסח** (C2: שינוי-תווית מותר
          בדיוק כשכלל-ניסוח כתוב יורה עליו).
          📍 **המיקום:** ‏15-ד מציבה אותה בשורת-המסננים ו-`cards-management.md` #7 בשורת-הפאג'ר;
          כאן היא צמודה לטבלה שהיא מנקה — הקרוב מבין השניים שנמצא בתוך המשטח.
          **פער-מיקום מדווח, לא הוכרע כאן.** */}
      {selection && (
        <div className="mb-2 flex items-center gap-2">
          <FilterPill
            on={false}
            onClick={() => setSelectionState({ key: requestKey, selection: null })}
            testId="report-clear-crossfilter"
          >
            × נקי בחירה
          </FilterPill>
          <span className="text-xs text-slate-500" data-testid="report-crossfilter-label">
            {selection.label}
          </span>
        </div>
      )}

      {/* 🏷️ הכותרת קודמת לשורת-הפעולה ולרמז — נמדד בצילום: שורת "לחיצה על שורה…" מעל
          הכותרת נקראה כאילו היא הכותרת. */}
      {!selection && surface.topN && (
        <TopNTitle
          label={surface.topN}
          rowTotal={payload.meta?.row_total}
          shown={rawPayload?.rows?.length ?? payload.rows.length}
        />
      )}
      {payload.columns?.length > 0 && renderBeforeTable?.(payload)}
      {/* 🔴 **והשורה נעלמת בזמן סינון-צולב — נמדד 16/09/2026, וזה היה שקר על המסך:**
          ‏`RowCapNote` נמדד תמיד מול `payload.rows.length` (התקרה שהשרת החזיר), בעוד הטבלה
          שמתחתיו מציגה את `selectedRows`. ⇒ לחיצה על עמודה שהותירה ⁦2⁩ שורות השאירה מעליה
          *"מוצגות ⁦50⁩ מתוך ⁦731⁩ שורות"*. 🔑 **ולמה להסתיר ולא לעדכן את המונה:** ההכרזה
          החיה (📐9) כבר אומרת *"מסונן ל…; ⁦2⁩ שורות"*, ושני מונים שונים לאותה טבלה הם בדיוק
          הכפילות ש-D-25 נולד כדי למחוק. הצ'יפ *"× נקי בחירה"* מחזיר את השורה. */}
      {/* ✏️ **והמונה נמדד מול השורות ה*גולמיות*, לפני הטרנספורם של הלשונית (16/09/2026):**
          🔴 נמדד במ16 — המטען מחזיר `rows=50` ו-`row_total=50` (כלומר **אין תקרה**), אבל
          שבב-הלקוח *"רק בלי דירוג"* מצמצם ל-⁦17⁩ ⇒ השורה הופיעה ואמרה *"מוצגות ⁦17⁩ מתוך ⁦50⁩
          שורות"* מעל פאג'ר שאומר *"1–17 מתוך 17"*. **צמצום-לקוח נקרא כתקרת-שרת**, והוא
          בדיוק ההפך: השרת מסר הכול. ⇒ המונה הוא `rawPayload.rows.length`, וסינון-לקוח
          פשוט מכבה את השורה. */}
      {!selection && !surface.topN && (
        <RowCapNote
          rowTotal={payload.meta?.row_total}
          shown={rawPayload?.rows?.length ?? payload.rows.length}
        />
      )}
      <ReportTable
        hidePager={Boolean(surface.topN)}
        columns={payload.columns}
        rows={selectedRows}
        page={page}
        onPage={setPage}
        sort={payload.meta?.sort ?? sortFromColumns(payload.columns)}
        onDrill={rowDoors ? rowDrill : undefined}
        announcement={announcement}
        caption={surface.name}
      />
      {payload.meta?.extra_tables?.map((table) => (
        <ExtraTable key={table.title} table={table} onDrill={rowDrill} />
      ))}

      <Footers notes={payload.meta?.notes} />
      {renderExtras?.(payload)}
    </div>
  )
}
