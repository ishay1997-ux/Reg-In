// עיצוב-המטען של לשונית "לקוחות" — **`transformPayload` של ארבעת המשטחים, במקום אחד.**
//
// 🔑 **מה מותר כאן ומה אסור** (`ReportSurface` · חוזה נקודות-ההרחבה): הפונקציות מקבלות
// מטען בצורת C8 ומחזירות **אותה צורה** — לעולם לא מוחקות מפתח ולעולם לא ממציאות מספר.
// כל מה שהן עושות הוא **מיפוי-תצוגה שהשרת אינו יכול לעשות**: תווית עברית לאנום, איחוד
// שם-וטלפון לתא אחד, ו**מיסוך לפי הרשאת-מודול אחר** — שהיא הסיבה שהקובץ הזה קיים בכלל.
//
// 🚫 **ואין כאן חישוב עסקי אחד.** כל מספר מגיע גמור מה-RPC (כלל-ברזל 14 · §2ב C5);
// הקובץ הזה אינו מחשב חציון, אחוז או סכום, וגם לא "מתקן" מספר שנראה מוזר.
//
// ✂️ **מה שהיה כאן ונמחק, כי המקור פתר אותו** (סבבי-היישור 16/09):
// ‏① הזרקת `columns[].sorted` — **G2-6** מצהירה אותה · ② מילוי `meta.export_blocked_reason`
// — **G2-2** מחזירה אותו · ③ סגירת דלת שיעדה ממוסך — עברה לנתב של המעטפת ·
// ‏④ **תיקון הכרזת-הפורמט של עמודות-התאריך** — **I1** מכריזה `format: "date"` על
// ‏`last_event` · `next_event` · `final_event_date` בארבעת המשטחים (נמדד על המטען החי
// ‏16/09 12:0X). הגשר היה חי בדיוק כל עוד היה צריך, ונמחק ברגע שנמדד מיותר.

import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'
import { MASKED_TEXT } from '@/lib/dashboard'
import { isolateLtr } from '@/lib/reportsFormat'

// 🔤 שני נוסחים שהכרטיס נועל, ושניהם **תא ולא ריק** — תא ריק נקרא כתקלת-נתונים.
// מ20 ⑦: *"ריק ⇒ '— ללא הערה', לא תא ריק"* · מ21 ⑦: *"אין ראשי ⇒ 'אין איש קשר ראשי'"*.
const NO_NOTE = '— ללא הערה'
const NO_CONTACT = 'אין איש קשר ראשי'
// 🔤 `red_flag` חוזר מהמסד כבוליאני (נמדד: `true`); `true` על המסך הוא **אנגלית**, ו-C8
// קובע שדבר באנגלית אינו מגיע למסך פרט למפתחות. `false` הופך ל-`null` ⇒ `—` (אין דגל),
// ולא ל-"לא" — אין תווית חיובית לעובדה טובה (🔒).
const RED_FLAG_YES = 'כן'

// רשימה קצרה (מערך-טקסט מהמסד) ⇒ מחרוזת אחת; ריקה ⇒ `null`, שמתורגם ל-`—`.
function listText(value) {
  if (!Array.isArray(value)) return value ?? null
  const items = value.filter(Boolean)
  return items.length ? items.join(' · ') : null
}

// ─────────────────────────── 🔒 מיסוך-הכסף ────────────────────────────────────
//
// **הרשאת-הסכום היא של מודול 'כספים', לא של 'לקוחות'** — הכרטיס ⑤ של מ21 (שורות 408–409),
// ו-`meta.notes` של ה-RPC אומר זאת במפורש: *"עמודות ואריחי ה-₪ בדף זה כפופים להרשאת מודול
// כספים; המיסוך מתבצע בלשונית"*. **השרת מחזיר את הסכומים תמיד** ומאציל את ההסתרה לכאן.
//
// 🔴 **ולמה זה חל גם על מ19 — הכרעת-המתזמר 16/09/2026, ושני המקורות שהיא מיישבת:**
// ‏`cards-customers.md` ⑤ של **מ19** (204–215) מונה הרשאות **בלי** חריג-כסף, ו-⑤ של **מ21**
// (408–409) נפתח במילים *"זהות למ19"* ו**מוסיף** את חריג-הכסף. שני מקורות חיים, ואותה
// עמודה בדיוק (`revenue_12m`, *"הכנסת 12 החודשים"*) הופיעה ממוסכת בדף אחד וגלויה בשני
// **לאותה זהות**. ⇒ **החריג של מ21 חל על מ19 באותה מידה**, והמיסוך אחיד בשני הדפים.
//
// 🔴 **והכשל שסבב-הביקורת תפס, והוא הסיבה שהמיסוך אינו נגמר באריחים ובעמודות:**
// שורת-"אז מה" של מ21 הדפיסה *"…יחד ⁦122,124 ₪⁩ בשנה האחרונה…"* **מעל** אריחים ממוסכים —
// כלומר הדף הסתיר את הסכום בשלושה מקומות והדליף אותו במקום רביעי. ⇒ **כל טקסט-שרת** שיש
// בו סכום עובר את אותו מסנן: `so_what` · `definitions` · `meta.notes` · `tiles[].sub` ·
// `compare.label`.
//
// 🔑 **התבנית תופסת *סכום* ולא את הסימן:** ‏`₪` לבדו (*"סכומים ב-₪ שלמים"* בשורת-ההגדרות,
// *"עמודות ואריחי ה-₪"* ב-`meta.notes`) הוא **משפט-מדיניות** ולא נתון, והוא נשאר על המסך.
// מה שמוסתר הוא רצף-ספרות שצמוד ל-₪ — בין שהוא עטוף בבידוד-כיווניות ובין שאינו.
const MONEY_RUN = /⁦[^⁦⁩]*₪[^⁦⁩]*⁩|\d[\d,.]*\s?₪/g
// 🔤 **אין כאן ניסוח חדש:** ‏`MASKED_TEXT` הוא המחרוזת הנעולה של `src/lib/dashboard.js`,
// והסוגריים הם **סימון-השמטה** ולא מילים — בתוך משפט זורם הם אומרים "כאן היה נתון".
const MASKED_AMOUNT = `(${MASKED_TEXT})`

function maskSentence(text) {
  if (typeof text !== 'string' || !text.includes('₪')) return text
  return text.replace(MONEY_RUN, MASKED_AMOUNT)
}

// אריח-כסף נחסם כולו (‏`KpiTile` מסתיר גם `sub` וגם את חצי-ההשוואה); אריח שאינו אריח-כסף
// אך נושא סכום בשורת-המשנה או בהשוואה — הסכום לבדו מוסתר, והמשפט נשאר.
function maskTile(tile) {
  if (tile.format === 'money') return { ...tile, masked: true }
  const sub = maskSentence(tile.sub)
  const compare = tile.compare ? { ...tile.compare, label: maskSentence(tile.compare.label) } : null
  if (sub === tile.sub && compare?.label === tile.compare?.label) return tile
  return { ...tile, sub, compare }
}

/**
 * ‏`fallbackSortKey` — 📐7 מחייב שהטבלה תהיה ממוינת **לפי המדד המוצג**, ועמודת-המיון של
 * שני הדפים היא `revenue_12m` — שממוסכת. ‏**מ21:** ⑧21.4 (🔵 פתוח) ממליץ ליפול למיון
 * המשני (*"פי כמה מהקצב"*), וזה מיושם. ‏**מ19:** אין לו מיון משני מוגדר בשום מקור ⇒
 * ההצהרה `aria-sort` **יורדת** מהעמודה הממוסכת ולא מוזזת למקום שאיש לא הכריע עליו —
 * טבלה שמצהירה שהיא ממוינת לפי מספר שאינו על המסך גרועה מטבלה שאינה מצהירה דבר.
 */
function maskMoney(payload, rows, { fallbackSortKey = null } = {}) {
  const moneyKeys = new Set(
    (payload.columns ?? []).filter((column) => column.format === 'money').map((c) => c.key),
  )
  const columns = (payload.columns ?? []).map((column) => {
    if (moneyKeys.has(column.key)) {
      return { ...column, format: 'text', align: 'start', sorted: undefined }
    }
    return column.key === fallbackSortKey ? { ...column, sorted: 'descending' } : column
  })
  const ordered = fallbackSortKey
    ? [...rows].sort((a, b) => (b[fallbackSortKey] ?? 0) - (a[fallbackSortKey] ?? 0))
    : rows
  return {
    ...payload,
    tiles: payload.tiles.map(maskTile),
    columns,
    rows: ordered.map((row) => {
      const masked = { ...row }
      for (const key of moneyKeys) masked[key] = MASKED_TEXT
      return masked
    }),
    so_what: maskSentence(payload.so_what),
    definitions: maskSentence(payload.definitions),
    meta: { ...payload.meta, notes: (payload.meta?.notes ?? []).map(maskSentence) },
  }
}

// ─────────────────────────── ארבעת המשטחים ───────────────────────────────────

/**
 * מ19 · מבט-על לקוחות — עמודת `סוג הלקוח` חוזרת כאנום אנגלי (`private_company`) והמטען
 * מצהיר `label_source: 'CUSTOMER_TYPE_LABELS'`. **התווית היא SSOT של `src/lib/customers.js`**
 * (‏C8: *"A legend showing `private_company` is the failure this line prevents"*).
 * 🔑 המיפוי **אידמפוטנטי** — ערך שכבר בעברית עובר דרך ה-`??` ונשאר.
 */
function overviewPayload(payload, { canSeeMoney }) {
  const rows = payload.rows.map((row) => ({
    ...row,
    customer_type: CUSTOMER_TYPE_LABELS[row.customer_type] ?? row.customer_type,
  }))
  return canSeeMoney ? { ...payload, rows } : maskMoney(payload, rows)
}

/** מ20 · שביעות רצון — מערך-סיבות לתא אחד, והערה ריקה שאינה תא ריק. */
function satisfactionPayload(payload) {
  return {
    ...payload,
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

/** מ21 · לקוחות מתרחקים. */
function driftingPayload(payload, { canSeeMoney }) {
  const rows = payload.rows.map((row) => ({ ...row, contact_name: contactCell(row) }))
  if (canSeeMoney) return { ...payload, rows }
  return maskMoney(payload, rows, { fallbackSortKey: 'ratio' })
}

/** האם יש ריצת-ניתוח **מאושרת** — השאלה שקובעת את כל דף מ22 (ת2 · 📑#20). */
export function hasApprovedRun(payload) {
  return Boolean(payload?.meta?.run?.approved_at)
}

/** מ22 · ניתוח הערות — בוליאני ומערך שאינם מגיעים למסך כמות שהם. */
function notesPayload(payload) {
  return {
    ...payload,
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
