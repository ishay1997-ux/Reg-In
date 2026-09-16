// עיצוב-המטען של לשונית "לקוחות" — **`transformPayload` של ארבעת המשטחים, במקום אחד.**
//
// 🔑 **מה מותר כאן ומה אסור** (`ReportSurface` · תוספת-החוזה 16/09): הפונקציות מקבלות
// מטען בצורת C8 ומחזירות **אותה צורה** — לעולם לא מוחקות מפתח ולעולם לא ממציאות מספר.
// כל מה שהן עושות הוא **מיפוי-תצוגה שהשרת אינו יכול לעשות**: תווית עברית לאנום, מיסוך
// לפי הרשאת-הלשונית, וחיווי-מיון שה-RPC כבר מימש בסדר-השורות אך לא הצהיר עליו.
//
// 🚫 **ואין כאן חישוב עסקי אחד.** כל מספר מגיע גמור מה-RPC (כלל-ברזל 14 · §2ב C5);
// הקובץ הזה אינו מחשב חציון, אחוז או סכום, וגם לא "מתקן" מספר שנראה מוזר.

import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'
import { MASKED_TEXT } from '@/lib/dashboard'
import { EXPORT_NO_APPROVED_RUN } from '@/lib/reportsExport'
import { isolateLtr } from '@/lib/reportsFormat'

// 🔴 **עמודות-תאריך מוכרזות `text` ב-ארבעת ה-RPC של הלשונית** (נמדד על המטען החי,
// 16/09/2026) ⇒ `formatByType` היה מדפיס `2026-09-15` במקום `15/09/2026`. הפורמט `date`
// כבר קיים גם ב-`reportsFormat` וגם ב-`reportsExport`, ולכן זו **הכרזה מתוקנת ולא
// פורמטר שני**. ⚠️ מדווח כממצא — התיקון הנכון יושב ב-SQL, וכאן הוא הגשר עד שיגיע.
const DATE_COLUMNS = new Set(['last_event', 'next_event', 'final_event_date'])

// 🔤 שני נוסחים שהכרטיס נועל, ושניהם **תא ולא ריק** — תא ריק נקרא כתקלת-נתונים.
// מ20 ⑦: *"ריק ⇒ '— ללא הערה', לא תא ריק"* · מ21 ⑦: *"אין ראשי ⇒ 'אין איש קשר ראשי'"*.
const NO_NOTE = '— ללא הערה'
const NO_CONTACT = 'אין איש קשר ראשי'
// 🔤 `red_flag` חוזר מהמסד כבוליאני; `true` על המסך הוא **אנגלית**, ו-C8 קובע שדבר
// באנגלית אינו מגיע למסך פרט למפתחות. `false` הופך ל-`null` ⇒ `—` (אין דגל), ולא
// ל-"לא" — אין תווית חיובית לעובדה טובה (🔒).
const RED_FLAG_YES = 'כן'

/**
 * 📐9 — `aria-sort` על העמודה הממוינת. ‏**ה-RPC לא סימן את העמודה** (נמדד 16/09/2026 על
 * המטען החי: אפס `columns[].sorted` בארבעת המשטחים), ולכן ההצהרה מוזרקת כאן לפי המיון
 * ש-§③ של הכרטיס נועל — **ואומתה מול סדר-השורות בפועל**, לא הונחה.
 * 🔴 **והיא נסוגה ברגע שהשרת כן מצהיר** (מיגרציית-התיקון G2-6 מוסיפה בדיוק את המפתח הזה):
 * ‏`ReportSurface` גוזר `aria-sort` מהמפתח הזה, ושתי הצהרות סותרות היו הופכות את
 * הכיוון בשקט. **המטען גובר — תמיד.**
 * ⚠️ אותה פונקציה גם מתקנת את הכרזת-הפורמט של עמודות-התאריך.
 */
function declareColumns(columns, sortedKey, direction = 'descending') {
  const serverDeclared = (columns ?? []).some((column) => column.sorted)
  return (columns ?? []).map((column) => {
    const fixed = DATE_COLUMNS.has(column.key) ? { ...column, format: 'date' } : column
    if (serverDeclared || fixed.key !== sortedKey) return fixed
    return { ...fixed, sorted: direction }
  })
}

// רשימה קצרה (מערך-טקסט מהמסד) ⇒ מחרוזת אחת; ריקה ⇒ `null`, שמתורגם ל-`—`.
function listText(value) {
  if (!Array.isArray(value)) return value ?? null
  const items = value.filter(Boolean)
  return items.length ? items.join(' · ') : null
}

/**
 * מ19 · מבט-על לקוחות.
 * ① עמודת `סוג הלקוח` חוזרת כאנום אנגלי (`private_company`) — התווית היא SSOT של
 *    `src/lib/customers.js` (‏C8: *"A legend showing `private_company` is the failure this
 *    line prevents"*).
 * ② 🔴 **דלת שמובילה ללשונית ממוסכת נסגרת** — פריט ⑧19.2, ושלוש האפשרויות שבו;
 *    **ההמלצה בכרטיס היא (א): הנתון נשאר, הדלת נעלמת.** בלי זה, מנהלת-פרויקטים
 *    (`view` על 'לקוחות', חסומה על 'כספים') לוחצת על אריח ④ ונוחתת בשקט על דף אחר,
 *    כי המעטפת מפילה לשונית-לא-מורשית ללשונית הראשונה הפתוחה.
 */
function overviewPayload(payload, { canOpenTargetTab }) {
  return {
    ...payload,
    tiles: payload.tiles.map((tile) =>
      tile.target && !canOpenTargetTab(tile.target.tab) ? { ...tile, target: null } : tile,
    ),
    columns: declareColumns(payload.columns, 'revenue_12m'),
    rows: payload.rows.map((row) => ({
      ...row,
      customer_type: CUSTOMER_TYPE_LABELS[row.customer_type] ?? row.customer_type,
    })),
  }
}

/** מ20 · שביעות רצון — מיון ברירת-מחדל **ציון עולה** (⑧20.1 · 📐7: הנמוך ראשון). */
function satisfactionPayload(payload) {
  return {
    ...payload,
    columns: declareColumns(payload.columns, 'feedback_score', 'ascending'),
    rows: payload.rows.map((row) => ({
      ...row,
      reasons: listText(row.reasons),
      feedback_notes: row.feedback_notes ?? NO_NOTE,
    })),
  }
}

// 📐18 — שם **ומספר** של איש-הקשר, כפי שהמוקאפ המאושר מצייר את התא (שורה שנייה בתא).
// ⚠️ **שורה אחת ולא שתיים:** `ReportTable` פולט ערך-מעוצב אחד לתא ואינו רכיב שלי;
// המספר מבודד ב-LRI…PDI כדי שלא ינדוד לצד השני של השם בתוך תא RTL.
function contactCell(row) {
  const name = row.contact_name || NO_CONTACT
  return row.contact_phone ? `${name} · ${isolateLtr(row.contact_phone)}` : name
}

// 🔒 מיסוך-הכסף של מ21 — **הרשאת-הסכום היא של מודול 'כספים', לא 'לקוחות'** (הכרטיס ⑤,
// ו-`meta.notes` של ה-RPC אומר במפורש *"המיסוך מתבצע בלשונית"*). ‏`MASKED_TEXT` ולא `—`:
// *"לא זמין בתפקידך"* ו*"אין לי את הנתון"* אינם אותו דבר.
function maskMoney(payload, rows) {
  const columns = (payload.columns ?? []).map((column) =>
    column.format === 'money' ? { ...column, format: 'text', align: 'start' } : column,
  )
  return {
    ...payload,
    tiles: payload.tiles.map((tile) =>
      tile.format === 'money' ? { ...tile, masked: true } : tile,
    ),
    // ⑧21.4 (🔵 פתוח) — **המלצת-הכרטיס מיושמת:** המיון הראשוני הוא עמודה שאינה על המסך
    // שלה, ולכן הטבלה נופלת ל**מיון המשני** (פי-כמה-מהקצב) — אחרת 📐7 היה שקר עבורה.
    columns: declareColumns(columns, 'ratio'),
    rows: [...rows]
      .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
      .map((row) => ({ ...row, revenue_12m: MASKED_TEXT })),
  }
}

/** מ21 · לקוחות מתרחקים. */
function driftingPayload(payload, { canSeeMoney }) {
  const rows = payload.rows.map((row) => ({ ...row, contact_name: contactCell(row) }))
  if (!canSeeMoney) return maskMoney(payload, rows)
  return { ...payload, columns: declareColumns(payload.columns, 'revenue_12m'), rows }
}

/** האם יש ריצת-ניתוח **מאושרת** — השאלה שקובעת את כל דף מ22 (ת2 · 📑#20). */
export function hasApprovedRun(payload) {
  return Boolean(payload?.meta?.run?.approved_at)
}

/**
 * מ22 · ניתוח הערות.
 * 🔴 **הנוסח הנעול של הייצוא מוזרק כאן**: `G-ל8` נועל *"אין שורות לייצא — טרם אושרה
 * ריצת-ניתוח"* מילה-במילה, והמעטפת מעבירה אותו דרך `meta.export_blocked_reason` —
 * **וה-RPC לא החזיר את המפתח הזה כלל** (נמדד 16/09/2026). בלעדיו הכפתור אומר
 * *"אין שורות לייצא"* סתם, וזה בדיוק הנוסח שהכרטיס הרחיב **בסיבה** כדי שלא ייקרא כתקלה.
 * 🚫 המחרוזת מיובאת מ-`reportsExport` ואינה נכתבת כאן שוב.
 * 🔴 **והיא נסוגה ברגע שהשרת כן מצהיר** (G2-2 מוסיפה את המפתח): אותו נוסח בדיוק, ושני
 * מקורות לאותה מחרוזת הם בדיוק מה שמתפצל ביום שהיא תשתנה.
 */
function notesPayload(payload) {
  const rows = payload.rows.map((row) => ({
    ...row,
    model_topics: listText(row.model_topics),
    red_flag: row.red_flag ? RED_FLAG_YES : null,
  }))
  const blocked = payload.meta?.export_blocked_reason
  const meta =
    hasApprovedRun(payload) || blocked
      ? payload.meta
      : { ...payload.meta, export_blocked_reason: EXPORT_NO_APPROVED_RUN }
  return { ...payload, columns: declareColumns(payload.columns, 'final_event_date'), rows, meta }
}

const BY_SURFACE = {
  מ19: overviewPayload,
  מ20: satisfactionPayload,
  מ21: driftingPayload,
  מ22: notesPayload,
}

/**
 * ‏`transformPayload` של המשטח — או `undefined` למשטח שאין לו (ואז `ReportSurface` מצייר
 * את המטען כמות שהוא).
 * @param {string} surfaceId מזהה-המשטח מהקטלוג (`מ19`…`מ22`)
 * @param {{canOpenTargetTab: (tabLabel: string) => boolean, canSeeMoney: boolean}} context
 */
export function customersTransform(surfaceId, context) {
  const fn = BY_SURFACE[surfaceId]
  return fn ? (payload) => fn(payload, context) : undefined
}
