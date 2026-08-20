// הלוגיקה הטהורה של לשונית "לוגיסטיקה ומוצרים" (מודול 6 · משטח 3) — כלל 14: כל משפט,
// מיון, טון וחשבון של הלשונית נולד כאן עם בדיקת-יחידה לצידו; הקומפוננטה רק מרנדרת.
// **טהור** — בלי Supabase, בלי DOM; "עכשיו" מוזרק כפרמטר (המוסכמה של hostesses.js).
//
// 🔴 קובץ חדש בכוונה, לא הרחבה של projects.js — שני סשנים בונים במקביל על אותו ענף,
// ו-projects.js הוא שטח משותף שהצד השני עלול לגעת בו (הנחיית-הסשן: lib חדש, לא קיים).

import { logisticsTileSub } from '@/lib/projects'
import { computeScopeChangeMoney } from '@/lib/projectChanges'
import { formatShekelCents } from '@/lib/pricing'

// ── אוצר-המילים של שלושת מצבי-הפריט (schema.sql: CHECK על שלושה ערכים בלבד) ──
// התוויות מילוליות מהמוקאפ המאושר; "טרם החל" הוא ברירת-המחדל שבה השורה נולדה —
// לא "מישהו לא התחיל לעבוד" (כרטיס-המסך §⑥).
export const LOGISTICS_STATUS_LABELS = {
  not_started: 'טרם החל',
  ordered: 'הוזמן',
  ready: 'מוכן',
}

// טונים ממופתחים לפי התווית המוצגת (הדפוס של StatusTag): "טרם החל" muted כפי שהמוקאפ
// מצייר; "הוזמן"/"מוכן" אינם מצוירים באף מוקאפ ⇒ נגזרו מתקדים: הוזמן=teal (בתנועה,
// כמו "אישרה זמינות"), מוכן=ok (עובדה שהושלמה, כמו "אושרה סופית"). `הנחתי` — מדווח.
const LOGISTICS_STATUS_TONES = {
  'טרם החל': 'muted',
  הוזמן: 'teal',
  מוכן: 'ok',
}

// שכבת-הדיווח של שומר ①: תווית לא-ממופה נופלת ב-StatusTag ל-muted בשקט — כאן היא צועקת.
// אותו דפוס בדיוק כמו resolveProjectTone (src/lib/projects.js).
export function resolveLogisticsTone(label) {
  const tone = LOGISTICS_STATUS_TONES[label]
  if (!tone) throw new Error(`תווית מצב-פריט לא ממופה: "${label}"`)
  return tone
}

// ── המחרוזות הנעולות של הלשונית (מדריך-המיקרו §3.7 + הכרטיס המאושר) ──────────
// שלושת המצבים חייבים להיקרא שונה זה מזה — "ריק" ו"חסום" שנראים זהים הם הכשל השקט
// המסוכן של המודול (S-26). הבדיקות נועלות שהמשפטים שונים.
export const LEGAL_EMPTY_TITLE = 'לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד.'
export const LEGAL_EMPTY_DETAIL = 'מצב תקין. פרויקט בלי פריטי לוגיסטיקה נספר כמוכן לוגיסטית.'
export const NO_PERMISSION_SENTENCE =
  'אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין.'
export const BROKEN_EMPTY_DETAIL =
  'להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין.'
export const LOAD_FAILURE_DETAIL = 'נתוני הלוגיסטיקה של הפרויקט לא נטענו.'
// השלמה של הבסיס הנעול "אין לך הרשאה לצפות ב…" לשלושת אתרי-הכסף (as-built 3.3③:
// עמודת-ההיסטוריה, משפט-הסיכום והאריח — `—` עם הסבר, לעולם לא מקף חשוף בלי מילה).
export const MONEY_HIDDEN_SENTENCE = 'אין לך הרשאה לצפות בנתונים כספיים.'
export const SORT_LINE = 'ממוין: מה שרחוק ביותר ממוכן — תחילה'
export const HISTORY_LEAD =
  'ההצעה עצמה נעולה ואינה משתנה. כל שינוי נרשם כאן עם סיבה, ומעדכן את הכמות המתוכננת בטבלה שלמעלה.'
export const FROZEN_PRICE_SENTENCE = 'המחיר ליחידה נלקח מההצעה המקורית ואינו מחושב מחדש.'

// ── מיון: "מה שרחוק ביותר ממוכן — תחילה" ─────────────────────────────────────
// הסדר הוא ערוץ-מידע (⑧): not_started לפני ordered לפני ready. שובר-שוויון יציב —
// sku ואז serial_number (סדר-השאילתה), כדי ששתי שורות באותו מצב לא יתחלפו בין רענונים.
const STATUS_RANK = { not_started: 0, ordered: 1, ready: 2 }

export function sortLogisticsRows(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    const rank = (STATUS_RANK[a.item_status] ?? 9) - (STATUS_RANK[b.item_status] ?? 9)
    if (rank !== 0) return rank
    const skuDiff = String(a.sku ?? '').localeCompare(String(b.sku ?? ''))
    if (skuDiff !== 0) return skuDiff
    return Number(a.serial_number ?? 0) - Number(b.serial_number ?? 0)
  })
}

// ── הספירה של המדד: רק ready נספר (§1.3) ─────────────────────────────────────
// מונה אחד לשני הצרכנים — שורת "N מתוך M" של האריח ושורת-המשנה שלו — כדי ששניהם
// לעולם לא יסטו זה מזה (כלל 14: הספירה חיה פעם אחת, לא משוכפלת בקומפוננטה).
export function readyItemsCount(rows) {
  return (rows ?? []).filter((row) => row.item_status === 'ready').length
}

// ── מתי המדד חסום ומציג '—' ──────────────────────────────────────────────────
// noPermission: הטבלה לא-קריאה ⇒ "אפס שורות" אינו עובדה. broken: להצעה יש שורות-מוצר
// והרשימה ריקה ⇒ תקלה — '0 מתוך 0' עם '✓' היה בדיוק השקר של S-26 ("300 תגים = מוכן")
// מעל פאנל-השגיאה עצמו. שני המצבים חסומים; 'legal' לבדו מציג "✓ אין פריטים".
export function readinessMetricBlocked(emptyKind) {
  return emptyKind === 'noPermission' || emptyKind === 'broken'
}

// ── שורת-המשנה של אריח "פריטים מוכנים" ───────────────────────────────────────
// רק ready נספר במדד (§1.3) — אבל בלשונית הזאת יש לנו item_status מלא לכל שורה, ולכן
// "טרם הוזמן אף פריט" (המוקאפ) כאן **ניתן לאימות**, בשונה ממבט-העל שסטה ממנו בהכרח.
// טון: hint (ענבר) לחוסר, done לעובדה סגורה.
export function readinessTileSub(rows) {
  const list = rows ?? []
  const total = list.length
  if (total === 0) return { text: '✓ אין פריטים', tone: 'done' }
  const ready = readyItemsCount(list)
  if (ready === total) return { text: '✓ מוכן', tone: 'done' }
  const anyTouched = list.some((row) => row.item_status !== 'not_started')
  if (!anyTouched) return { text: 'טרם הוזמן אף פריט', tone: 'hint' }
  // נוסח "N פריטים טרם מוכנים" — מיובא ממבט-העל (אותו משפט בשני המסכים, לא עותק).
  return { text: logisticsTileSub({ count: 1, itemsNotReady: total - ready }), tone: 'hint' }
}

// ── שורת-המשנה של אריח "שינויי תכולה" ("האחרון היום, 09:15") ─────────────────
// ההשוואה "היום" נעשית בשעון ישראל — המסד שומר UTC, ושינוי שנרשם ב-01:10 בלילה
// רשום שם כאתמול (המוקש של formatTimestamp ב-dates.js).
function jerusalemParts(iso) {
  // ⚠️ new Date(null) הוא epoch-0 ולא Invalid Date — בלי הגנה, קלט חסר היה מוצג "01/01".
  if (iso == null || iso === '') return null
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const at = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return {
    date: `${at('year')}-${at('month')}-${at('day')}`,
    dayMonth: `${at('day')}/${at('month')}`,
    time: `${at('hour')}:${at('minute')}`,
  }
}

export function changesTileSub(lastChangeIso, nowIso) {
  const change = jerusalemParts(lastChangeIso)
  const now = jerusalemParts(nowIso)
  if (!change || !now) return null
  return change.date === now.date
    ? { prefix: 'האחרון היום, ', value: change.time }
    : { prefix: 'האחרון ב-', value: change.dayMonth }
}

// ── סכום חתום: "+85.00 ₪" / "−300.00 ₪" ─────────────────────────────────────
// הסימן נבנה מהערך והגודל מ-formatShekelCents (הפורמט הקנוני של המודול) — לא סומכים
// על toLocaleString לסימן-שלילי, כי צורת המינוס שלו תלוית-לוקאל; המוקאפ מצייר U+2212.
// הקורא עוטף ב-<Ltr> — סכום חתום בתוך עברית בלי בידוד מתהפך (מופע 7 של המשפחה).
export function signedShekelCents(amount) {
  // ⚠️ Number(null) הוא 0 ולא NaN (המלכודת המתועדת של optionalNumber) — ערך חסר היה
  // מוצג "0.00 ₪", שהוא בדיוק השקר של S-2.
  if (amount === null || amount === undefined || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const magnitude = formatShekelCents(Math.abs(n))
  if (n > 0) return `+${magnitude}`
  if (n < 0) return `−${magnitude}`
  return magnitude
}

// ── "+80" / "−50" — דלתא חתומה בלי ₪ (עמודת "השינוי" היא כמות, לא כסף) ────────
// אותו עקרון-סימן כמו signedShekelCents: מינוס U+2212 (צורת-המוקאפ), לא toLocaleString.
// הקורא עוטף ב-<Ltr> — דלתא חתומה בתוך עברית בלי בידוד מתהפכת.
export function signedDelta(deltaQty) {
  const n = Number(deltaQty)
  if (!Number.isFinite(n)) return '—'
  if (n > 0) return `+${n}`
  if (n < 0) return `−${Math.abs(n)}`
  return String(n)
}

// ── דגל-הכסף: money_visible הוא המבחין, לעולם לא price === null ───────────────
// (מדריך-המיקרו 2.5⓪: NULL-אמיתי ו-NULL-חסום בלתי-ניתנים-להבחנה בלי הדגל.)
export function moneyHidden(changes) {
  return (changes ?? []).some((change) => change?.money_visible === false)
}

// ── "הוגדל מ-300 · 11/08" — ההפרש מול שורת-השינוי האחרונה על אותו פריט ────────
// הכרטיס §③: planned_qty הנוכחי מול (planned_qty − delta_qty) של השינוי האחרון בלבד;
// ההיסטוריה המלאה בטבלה למטה. הגדלה=ענבר (יוצרת חוסר) · הקטנה=אפור (עובדה) — תקציב-הצבע.
export function lastLogisticsChangeBySku(changes) {
  const map = new Map()
  // ה-RPC מחזיר created_at desc ⇒ הראשון שנפגש לכל sku הוא האחרון בזמן.
  for (const change of changes ?? []) {
    if (change?.change_target !== 'logistics' || !change?.sku) continue
    if (!map.has(change.sku)) map.set(change.sku, change)
  }
  return map
}

export function plannedChangeNote(plannedQty, change) {
  const planned = Number(plannedQty)
  const delta = Number(change?.delta_qty)
  if (!Number.isFinite(planned) || !Number.isFinite(delta) || delta === 0) return null
  const previous = planned - delta
  const parts = jerusalemParts(change.created_at)
  return {
    text: delta > 0 ? 'הוגדל מ-' : 'הוקטן מ-',
    previous,
    dayMonth: parts?.dayMonth ?? null,
    tone: delta > 0 ? 'hint' : 'calm',
  }
}

// ── "300 → 380" לכל שורת-היסטוריה — שחזור לאחור מהערך הנוכחי ─────────────────
// ה-DB אינו שומר from/to, רק delta; הולכים מהחדש לישן: היעד של השינוי האחרון הוא הערך
// הנוכחי, והמקור שלו הוא היעד של השינוי שלפניו. שורה שהפריט שלה אינו קריא (למשל שורת
// לוגיסטיקה שנמחקה מהקריאה) מחזירה null-ים והמסך מציג את הדלתא בלבד.
export function changeRowsWithRanges(changes, { plannedBySku, currentRequired } = {}) {
  const running = new Map()
  return (changes ?? []).map((change) => {
    const isHostess = change?.change_target === 'hostess_count'
    const key = isHostess ? '@hostess_count' : `sku:${change?.sku}`
    const current = running.has(key)
      ? running.get(key)
      : isHostess
        ? Number(currentRequired)
        : Number(plannedBySku?.get?.(change?.sku))
    const delta = Number(change?.delta_qty)
    const to = Number.isFinite(current) ? current : null
    const from = to !== null && Number.isFinite(delta) ? to - delta : null
    if (from !== null) running.set(key, from)
    return { change, from, to }
  })
}

// ── משפט-הסיכום של ההיסטוריה + האריח השלישי — חשבון 2.2, לא חשבון חדש ────────
// revenue_delta של ה-RPC הוא טרום-הנחה וטרום-מע"מ (as-built 2.2③) ⇒ ההנחה מוחלת כאן
// בצד-הלקוח, דרך computeScopeChangeMoney (אותו סכום→הנחה באגורות שלמות; מע"מ 0 —
// הלשונית מציגה עד "אחרי הנחה", והמע"מ אינו על המסך הזה בכוונה: כרטיס §③ "ואין על
// המסך: מע"מ · סה"כ הפרויקט · רווח").
export function changesMoneySummary(changes, quoteMeta) {
  const lines = (changes ?? []).map((change) => ({
    deltaQty: change?.delta_qty,
    unitPriceSnapshot: change?.unit_price_snapshot,
  }))
  const money = computeScopeChangeMoney(
    lines,
    quoteMeta?.applied_customer_discount,
    quoteMeta?.manual_discount,
    0,
  )
  return {
    preDiscount: money.changeAmount,
    discountPercent: money.discountPercent,
    afterDiscount: money.preVat,
  }
}

// ── המבחין של מצב-הריק: "האם להצעה יש שורות-מוצר?" ──────────────────────────
// null ⇒ ההצעה עצמה אינה קריאה (חסימת 'הצעות מחיר') — שני מצבים אינם יכולים לבטא
// שלוש סיטואציות, וזה הסימן ל-noPermission. מק"ט שאינו בקטלוג נספר כמוצר בכוונה —
// טעות לכיוון "תקלה" ולא לכיוון "מצב תקין" (השקר המסוכן הוא "רשימה ריקה כדין" כוזב).
export function countProductLines(quote, products) {
  if (!quote) return null
  const bySku = new Map((products ?? []).map((product) => [product.sku, product]))
  return (quote.quote_services ?? []).filter((line) => {
    const category = bySku.get(line.sku)?.category
    return category !== 'hostess'
  }).length
}
