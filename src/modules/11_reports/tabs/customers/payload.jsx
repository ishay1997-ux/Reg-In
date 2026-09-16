// עיצוב-המטען של לשונית "לקוחות" — **`transformPayload` של ארבעת המשטחים, במקום אחד.**
//
// 🔑 **מה מותר כאן ומה אסור** (`ReportSurface` · חוזה נקודות-ההרחבה): הפונקציות מקבלות
// מטען בצורת C8 ומחזירות **אותה צורה** — לעולם לא מוחקות מפתח ולעולם לא ממציאות מספר.
// כל מה שהן עושות הוא **מיפוי-תצוגה שהשרת אינו יכול לעשות**: תווית עברית לאנום, איחוד
// שם-וטלפון לתא אחד, ומיסוך לפי הרשאת-מודול אחר.
//
// 🚫 **ואין כאן חישוב עסקי אחד.** כל מספר מגיע גמור מה-RPC (כלל-ברזל 14 · §2ב C5);
// הקובץ הזה אינו מחשב חציון, אחוז או סכום, וגם לא "מתקן" מספר שנראה מוזר.
//
// ✂️ **מה שהיה כאן ונמחק בסבב-היישור של 16/09 11:1X, כי המקור פתר אותו:**
// ‏① הזרקת `columns[].sorted` — מיגרציה **G2-6** מצהירה אותה בארבעת המשטחים (נמדד על
//    המטען החי: `revenue_12m/descending` · `feedback_score/ascending` · `revenue_12m` ·
//    `red_flag/descending`). **והמחיקה אינה ניקיון:** ההזרקה שלי כיוונה את מ22 ל-
//    `final_event_date`, והשרת ממיין בפועל לפי `red_flag` — הצהרה שלי הייתה **משקרת**.
// ‏② מילוי `meta.export_blocked_reason` — **G2-2** מחזירה אותו בארבעתן.
// ‏③ סגירת דלת שיעדה ממוסך — עברה לנתב-הדלתות של המעטפת (`ReportsPage.openDoor`).
//    ⚠️ **וזו אינה אותה התנהגות, ומדווח:** הכרטיס ⑧19.2 ממליץ (א) *"הנתון נשאר, הדלת
//    נעלמת"*, והמעטפת מממשת *"הדלת נשארת ואינה עושה דבר"*. **הכרעת-ישי פתוחה.**

import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'
import { MASKED_TEXT } from '@/lib/dashboard'
import { isolateLtr } from '@/lib/reportsFormat'

// 🔴 **עמודות-התאריך עדיין מוכרזות `text` בארבעת ה-RPC של הלשונית** — נמדד מחדש על
// המטען החי **אחרי** מיגרציות G2 ו-H2 (‏16/09/2026 11:2X): `last_event` · `next_event` ·
// `final_event_date`, כולן `format: "text"` ⇒ `formatByType` היה מדפיס `2026-09-15`.
// ‏H2 יישרה שבעה RPC אחרים ולא את אלה. הפורמט `date` כבר קיים גם ב-`reportsFormat` וגם
// ב-`reportsExport`, ולכן זו **הכרזה מתוקנת ולא פורמטר שני**. ⚠️ מדווח — התיקון הנכון
// יושב ב-SQL, וכאן הוא הגשר עד שיגיע.
const DATE_COLUMNS = new Set(['last_event', 'next_event', 'final_event_date'])

// 🔤 שני נוסחים שהכרטיס נועל, ושניהם **תא ולא ריק** — תא ריק נקרא כתקלת-נתונים.
// מ20 ⑦: *"ריק ⇒ '— ללא הערה', לא תא ריק"* · מ21 ⑦: *"אין ראשי ⇒ 'אין איש קשר ראשי'"*.
const NO_NOTE = '— ללא הערה'
const NO_CONTACT = 'אין איש קשר ראשי'
// 🔤 `red_flag` חוזר מהמסד כבוליאני (נמדד: `true`); `true` על המסך הוא **אנגלית**, ו-C8
// קובע שדבר באנגלית אינו מגיע למסך פרט למפתחות. `false` הופך ל-`null` ⇒ `—` (אין דגל),
// ולא ל-"לא" — אין תווית חיובית לעובדה טובה (🔒).
const RED_FLAG_YES = 'כן'

/** הכרזת-פורמט מתוקנת לעמודות-תאריך. 🚫 **אינה נוגעת ב-`sorted`** — ר' הערת-הכותרת. */
function fixDateColumns(columns) {
  return (columns ?? []).map((column) =>
    DATE_COLUMNS.has(column.key) ? { ...column, format: 'date' } : column,
  )
}

// רשימה קצרה (מערך-טקסט מהמסד) ⇒ מחרוזת אחת; ריקה ⇒ `null`, שמתורגם ל-`—`.
function listText(value) {
  if (!Array.isArray(value)) return value ?? null
  const items = value.filter(Boolean)
  return items.length ? items.join(' · ') : null
}

/**
 * מ19 · מבט-על לקוחות — עמודת `סוג הלקוח` חוזרת כאנום אנגלי (`private_company`) והמטען
 * מצהיר `label_source: 'CUSTOMER_TYPE_LABELS'`. **התווית היא SSOT של `src/lib/customers.js`**
 * (‏C8: *"A legend showing `private_company` is the failure this line prevents"*).
 * 🔑 המיפוי **אידמפוטנטי** — ערך שכבר בעברית עובר דרך ה-`??` ונשאר.
 */
function overviewPayload(payload) {
  return {
    ...payload,
    columns: fixDateColumns(payload.columns),
    rows: payload.rows.map((row) => ({
      ...row,
      customer_type: CUSTOMER_TYPE_LABELS[row.customer_type] ?? row.customer_type,
    })),
  }
}

/** מ20 · שביעות רצון — מערך-סיבות לתא אחד, והערה ריקה שאינה תא ריק. */
function satisfactionPayload(payload) {
  return {
    ...payload,
    columns: fixDateColumns(payload.columns),
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
//
// 🔴 **והמקף אינו ASCII — זה תיקון של פגם שנמדד בדפדפן, לא קוסמטיקה** (מעבר-הדפדפן,
// ‏16/09/2026, ‏1280px): התא צר, והדפדפן שבר את המספר **בתוך המקף** ⇒ על המסך נראה
// *"ענבר אשכנזי · -055"* בשורה אחת ו-*"1794584"* בשורה הבאה — מספר-טלפון שאי-אפשר לחייג
// ממנו, בדוח שכל כולו אומר *"להתקשר"*. ‏`U+2011` (מקף בלתי-שביר) נראה זהה ואינו נקודת-שבירה.
// 🚫 **ולא תו בלתי-נראה** (ר' המופע השביעי ב-`src/CLAUDE.md`: `U+200F` נסתר ששיבש ספירה):
// הוא נקוב בשם, נראה לעין, ונבדק בבדיקת-יחידה.
const NB_HYPHEN = '‑'

function contactCell(row) {
  const name = row.contact_name || NO_CONTACT
  if (!row.contact_phone) return name
  return `${name} · ${isolateLtr(String(row.contact_phone).replaceAll('-', NB_HYPHEN))}`
}

// 🔒 מיסוך-הכסף של מ21 — **הרשאת-הסכום היא של מודול 'כספים', לא 'לקוחות'** (הכרטיס ⑤,
// ו-`meta.notes` של ה-RPC אומר במפורש *"המיסוך מתבצע בלשונית"*). ‏`MASKED_TEXT` ולא `—`:
// *"לא זמין בתפקידך"* ו*"אין לי את הנתון"* אינם אותו דבר.
// 🔴 **ושורת-המשנה היא דליפה חדשה שנפתחה ב-16/09:** מאז ש-`KpiTile` מרנדר `tiles[].sub`,
// האריח *"נתפסים רק בקצב האישי"* — שאינו אריח-כסף (`format: 'int'`) ולכן אינו ממוסך —
// נושא בשורת-המשנה שלו *"⁦161,009 ₪⁩ בשנה האחרונה"*. ‏`KpiTile` מסתיר `sub` באריח ממוסך
// בלבד, ולכן הסכום הזה **היה מוצג למי שאסור לה לראות סכומים**. ⇒ שורת-משנה שיש בה ₪
// יורדת גם מאריח שאינו ממוסך.
const SHEKEL = '₪'

function maskTile(tile) {
  if (tile.format === 'money') return { ...tile, masked: true }
  if (typeof tile.sub === 'string' && tile.sub.includes(SHEKEL)) return { ...tile, sub: null }
  return tile
}

function maskMoney(payload, rows) {
  const columns = fixDateColumns(payload.columns).map((column) =>
    column.format === 'money' ? { ...column, format: 'text', align: 'start' } : column,
  )
  return {
    ...payload,
    tiles: payload.tiles.map(maskTile),
    // ⑧21.4 (🔵 פתוח) — **המלצת-הכרטיס מיושמת:** המיון הראשוני הוא עמודה שאינה על המסך
    // שלה, ולכן הטבלה נופלת ל**מיון המשני** (פי-כמה-מהקצב) — אחרת 📐7 היה שקר עבורה.
    // 🔑 ההצהרה `sorted` מוזזת יחד עם המיון, כי אחרת `aria-sort` היה מצביע על עמודה ממוסכת.
    columns: columns.map((column) => {
      if (column.key === 'ratio') return { ...column, sorted: 'descending' }
      return column.sorted ? { ...column, sorted: undefined } : column
    }),
    rows: [...rows]
      .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
      .map((row) => ({ ...row, revenue_12m: MASKED_TEXT })),
  }
}

/** מ21 · לקוחות מתרחקים. */
function driftingPayload(payload, { canSeeMoney }) {
  const rows = payload.rows.map((row) => ({ ...row, contact_name: contactCell(row) }))
  if (!canSeeMoney) return maskMoney(payload, rows)
  return { ...payload, columns: fixDateColumns(payload.columns), rows }
}

/** האם יש ריצת-ניתוח **מאושרת** — השאלה שקובעת את כל דף מ22 (ת2 · 📑#20). */
export function hasApprovedRun(payload) {
  return Boolean(payload?.meta?.run?.approved_at)
}

/** מ22 · ניתוח הערות — בוליאני ומערך שאינם מגיעים למסך כמות שהם. */
function notesPayload(payload) {
  return {
    ...payload,
    columns: fixDateColumns(payload.columns),
    rows: payload.rows.map((row) => ({
      ...row,
      model_topics: listText(row.model_topics),
      red_flag: row.red_flag ? RED_FLAG_YES : null,
    })),
  }
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
 * 🔴 **הזהות חייבת להיות יציבה** (‏`ReportSurface` ממומואיזי על `[rawPayload,
 * transformPayload]`), ולכן הקורא עוטף ב-`useMemo` על פרימיטיבים בלבד.
 * @param {string} surfaceId מזהה-המשטח מהקטלוג (`מ19`…`מ22`)
 * @param {{canSeeMoney: boolean}} context
 */
export function customersTransform(surfaceId, context) {
  const fn = BY_SURFACE[surfaceId]
  return fn ? (payload) => fn(payload, context) : undefined
}
