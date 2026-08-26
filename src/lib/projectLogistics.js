// הלוגיקה הטהורה של לשונית "לוגיסטיקה ומוצרים" (מודול 6 · משטח 3) — כלל 14: כל משפט,
// מיון, טון וחשבון של הלשונית נולד כאן עם בדיקת-יחידה לצידו; הקומפוננטה רק מרנדרת.
// **טהור** — בלי Supabase, בלי DOM; "עכשיו" מוזרק כפרמטר (המוסכמה של hostesses.js).
//
// 🔴 קובץ חדש בכוונה, לא הרחבה של projects.js — שני סשנים בונים במקביל על אותו ענף,
// ו-projects.js הוא שטח משותף שהצד השני עלול לגעת בו (הנחיית-הסשן: lib חדש, לא קיים).

import { ACTIVE_PROJECT_STATUSES, eventDaysFromToday, logisticsTileSub } from '@/lib/projects'
import { computeScopeChangeMoney } from '@/lib/projectChanges'
import { formatShekelCents } from '@/lib/pricing'
import { weekdayOf } from '@/lib/dates'

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
// 🔴 **האבר שחסר במשפחה — נוסף 26/08/2026.** שלושת המשפטים כאן מבחינים לפי **מה חסום**, ועד
// היום היה מבחין אחד בלבד: ההצעה. ⇒ מי שחסומה על **לוגיסטיקה** אך רואה הצעות (מנהלת הכספים)
// קיבלה `BROKEN_EMPTY_DETAIL` — כלומר **"תקלה במערכת"** על חסימת-הרשאה תקינה לגמרי; ובכיוון
// ההפוך, מנהלת הלוגיסטיקה על אירוע דיילות-בלבד קיבלה את המשפט שלמעלה, שאומר לה שאין לה
// הרשאה **להצעה** — נכון עובדתית, ומטעה לגמרי לגבי הרשימה שהיא כן רשאית לראות והיא ריקה כדין.
// 🔒 **הנוסח נגזר מהעוגן ולא הומצא:** זהו `QUEUE_NO_PERMISSION_SENTENCE` שאושר ע"י ישי (S-2,
// 25/08) עם שם-המשטח שלו — *"הרשימה"* במקום *"התור"*, בדיוק כפי שאותם שני משפטים כבר נבדלים.
export const TAB_NO_PERMISSION_SENTENCE =
  'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין.'
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
// 🔴 נוסף 26/08/2026: `noPermissionLogistics` — חסימה על **הלוגיסטיקה עצמה**. השמטתו כאן
// הייתה מייצרת בדיוק את השקר של S-26 בדלת האחורית: אריח שמכריז `0 מתוך 0` ו-`✓` על טבלה
// שהמשתמשת כלל אינה רשאית לקרוא. **סט אחד לשלושת המצבים החסומים** — כלל 14.
export function readinessMetricBlocked(emptyKind) {
  return (
    emptyKind === 'noPermission' || emptyKind === 'noPermissionLogistics' || emptyKind === 'broken'
  )
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

// ═════════════════════════════════════════════════════════════════════════════
// משטח 1 — תור-העבודה של מנהלת הלוגיסטיקה (מודול 5, צעד 2.1)
//
// 🔴 **הכול טהור, וה"היום" מוזרק כ-`todayIso`** — כמו בכל הקובץ. גם `businessDaysUntil`
// מוזרקת כפרמטר ולא מיובאת כאן: היא לוח-שנה, והזרקתה היא מה שמונע לוח-שנה שני
// (⑳/㉓ מורות מפורשות *"אין להמציא חישוב שני"*).
// ═════════════════════════════════════════════════════════════════════════════

// ── המחרוזות הנעולות של המשטח (S-2 · S-3 · S-5, מדריך-המיקרו §3.7) ──────────
// מועתקות בייט-בבייט מהאישור. 🚫 לא לנסח מחדש ולא "לשפר".
export const QUEUE_NO_PERMISSION_SENTENCE =
  'אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין.'
export const EMPTY_OUTBOUND_SENTENCE = 'אין אירוע שיוצא עד יום העסקים הבא.'
export const WRITE_FAILURE_SENTENCE = 'העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב.'
// 🔴 **העתק-בייט של ה-`raise` בשרת** — `supabase/migrations/20260826002447_module5_checklist_rpc.sql`
// (עוגן-גריפ: `אינה יכולה להיות שלילית`). כלל-הבית AR-9: שני הצדדים משתנים יחד, אחרת
// המשתמשת רואה נוסח אחד לפני השליחה ונוסח אחר אחריה. כאן זהו **שומר טרום-שליחה**;
// העברת ה-`raise` עצמו למסך היא של צעד 2.2.
export const NEGATIVE_QTY_SENTENCE = 'כמות בפועל אינה יכולה להיות שלילית.'
// ‏S-3. 🚫 **לא `SORT_LINE`** — זה ממיין *פריטים* בצ'קליסט, וזה מסך של *פרויקטים*.
export const QUEUE_SORT_LINE = 'ממוין: לפי קרבת האירוע'
// שורת-הנימוק של פרויקט שהכול בו מוכן בסעיף-היציאה — מצוירת מילה-במילה במוקאפ המאושר
// (שורת `#105`). טון רגוע: עובדה טובה אינה צבועה.
export const OUTBOUND_READY_REASON = 'הכול מוכן — לוודא שהסחורה יוצאת'
// ✅ **O-1 — אושר על-ידי ישי 26/08/2026 10:29 ("מאשר את הכל", סבב דלת-פזה-3;
// מדריך-המיקרו §3.5/§3.7).** מוגדר כתבנית אחת כדי ששינוי-נוסח ישנה שורה אחת
// ולא שבעה אתרי-קריאה.
const LATE_ARRIVAL_TEMPLATE = { prefix: 'ההגעה מתעכבת — הובטח ל-', suffix: ' וטרם הגיע' }

// ── כלל-האוכלוסייה: פעיל *וגם* בעל שורות ────────────────────────────────────
// 🔴 **זה הכלל שאם שוברים אותו כל מונה במסך זז בשקט.** פרויקט פעיל בלי ולו שורת-לוגיסטיקה
// אחת (המקרה של `#11`) **נספר מוכן לוגיסטית מרגע היווצרותו ולכן אינו מגיע אליה לעולם —
// לא לתור ולא לאף גלולה, כולל `הכול`** (`data-set.md`, עוגן-גריפ `לא מגיע אליה לעולם`).
// בלי הסייג הזה `הכול` היה 6 במקום 5, ואף בדיקה לא הייתה נופלת.
// ‏`ACTIVE_PROJECT_STATUSES` מיובא ממודול 6 ולעולם לא מוגדר כאן מחדש (`🚧 מ5 ← מ6` #3).
export function queueBaseProjects(projects, logisticsRows) {
  const rowsByProject = new Map()
  for (const row of logisticsRows ?? []) {
    const list = rowsByProject.get(row?.project_id)
    if (list) list.push(row)
    else rowsByProject.set(row?.project_id, [row])
  }
  return (projects ?? [])
    .filter((project) => ACTIVE_PROJECT_STATUSES.includes(project?.project_status))
    .map((project) => ({ project, rows: rowsByProject.get(project.project_id) ?? [] }))
    .filter((entry) => entry.rows.length > 0)
}

// ── שלוש הגלולות (㉙ · ㉛ · ⑲) ───────────────────────────────────────────────
// מצב-העבודה של פרויקט, לא סטטוס-פרויקט: `דורש טיפול` = יש מה להזמין ·
// `ממתין למשלוח` = **לא נשאר מה להזמין ולא הכול הגיע** (㉛ — הנוסח הזה, ולא "כלום עוד
// לא הגיע", הוא שסוגר את החור ש-`#106` נפל לתוכו: יש בו פריט שכבר הגיע) ·
// `ready` = הכול הגיע, ונראה רק תחת `הכול` (⑲).
export function pillOf(rows) {
  const list = rows ?? []
  if (list.length === 0) return null
  if (list.some((row) => row.item_status === 'not_started')) return 'needsAction'
  if (list.some((row) => row.item_status === 'ordered')) return 'awaitingDelivery'
  return 'ready'
}

// `all` אינה מצב אלא **הבסיס כולו** — ולכן היא נבדקת כאן ולא ב-pillOf.
export function filterQueueByPill(entries, pill) {
  const list = entries ?? []
  if (pill === 'all') return [...list]
  return list.filter((entry) => pillOf(entry.rows) === pill)
}

// המונים שבתוך הגלולות. 🔴 **נספרים על אותה רשימה שנשלפה** — לא שאילתה שנייה
// (כרטיס-המסך §③), אחרת המונה והטבלה יכולים לסתור זה את זה בין רענונים.
export function queuePillCounts(entries) {
  const list = entries ?? []
  return {
    needsAction: filterQueueByPill(list, 'needsAction').length,
    awaitingDelivery: filterQueueByPill(list, 'awaitingDelivery').length,
    all: list.length,
  }
}

// ── סימון-הענבר (⑳ + הטריגר השני של ㊶) ─────────────────────────────────────
// **פריט פיזי** = כל מק"ט פרט לקטגוריית `site` (`01WEB` — הקמת אתר רישום). הסף נגזר
// מזמן-ייצור של דפוס, ואתר אינו מודפס (⑧ · `🎓⑳`). 🔴 **מק"ט שאינו בקטלוג נספר כפיזי** —
// אותו כיוון-טעות בדיוק כמו ב-countProductLines: מוטב אזעקת-שווא מאשר שקט שקרי.
function isPhysical(row, bySku) {
  return bySku.get(row?.sku)?.category !== 'site'
}

// ‏⑳ — 10 ימי-עסקים, לא "שבועיים קלנדריים": היחידה שבה הקוד כבר מודד (`businessDaysUntil`),
// וכך שני הספים של המערכת (3 ימי-עסקים ב-isLateChange · 10 כאן) ברי-השוואה במקום סותרים.
const AMBER_BUSINESS_DAYS = 10

// 🔴 **שומר-העבר, והוא נושא-משקל:** `businessDaysUntil` מחזירה **0** על תאריך שעבר
// (הלולאה שלה פשוט אינה רצה) ⇒ בלי הבדיקה הזאת פרויקט פעיל שתאריכו חלף היה נדלק בענבר
// לנצח, ו-`0 ≤ 10` היה נראה כמו "האירוע מחר". מחזירה את מספר ימי-העסקים, או `null`
// כשהאירוע בעבר / התאריך אינו נקרא.
function businessDaysToEvent(eventDate, todayIso, businessDaysUntil) {
  const daysFromToday = eventDaysFromToday(eventDate, todayIso)
  if (daysFromToday === null || daysFromToday < 0) return null
  const businessDays = businessDaysUntil(todayIso, eventDate)
  return businessDays === null ? null : businessDays
}

// ‏㊶'s טריגר שני: פריט `הוזמן` שהתאריך שהובטח לו כבר עבר והוא טרם הגיע. **עומד בפני
// עצמו** — אינו תלוי בקרבת-האירוע, כי איחור-ספק הוא עובדה גם כשהאירוע רחוק.
// השוואת-מחרוזות על `YYYY-MM-DD` תקפה לקסיקוגרפית ואינה מפרסרת תאריך (הימנעות ממלכודת
// ה-`new Date` המקומי שב-`dates.js`).
function findLateArrivalRow(rows, todayIso) {
  return (
    (rows ?? []).find(
      (row) =>
        row?.item_status === 'ordered' &&
        typeof row?.expected_arrival_date === 'string' &&
        row.expected_arrival_date < todayIso &&
        !row?.actual_arrival_date,
    ) ?? null
  )
}

// מחזירה **גם את הטריגרים שנדלקו** — המסך צריך לדעת איזו שורת-נימוק לכתוב (⑳ מול O-1),
// ובלי זה הקורא היה מחשב את אותו תנאי פעם שנייה בעצמו.
export function amberMark(rows, products, eventDate, todayIso, businessDaysUntil) {
  const list = rows ?? []
  const bySku = new Map((products ?? []).map((product) => [product.sku, product]))
  const businessDays = businessDaysToEvent(eventDate, todayIso, businessDaysUntil)
  const triggers = []
  if (
    businessDays !== null &&
    businessDays <= AMBER_BUSINESS_DAYS &&
    list.some((row) => row.item_status === 'not_started' && isPhysical(row, bySku))
  ) {
    triggers.push('physicalNotStarted')
  }
  const lateRow = findLateArrivalRow(list, todayIso)
  if (lateRow) triggers.push('lateArrival')
  return { amber: triggers.length > 0, triggers, businessDays, lateRow }
}

// ── חלון-היציאה (㉓) ────────────────────────────────────────────────────────
// *"מהיום ועד יום-העסקים הבא **בכלל**"* — ‏🚫 לא "היום ומחר". ביום חמישי החלון מגיע עד
// ראשון, כי שישי-שבת אינם ימי-עבודה (הכרעת-ישי: *"שישי שבת לא עובדים"*) — וזה בדיוק
// היום שבו הכלל הנפסל היה מפספס סחורה שצריכה לצאת לפני סוף-השבוע.
// 🔴 **אותו שומר-עבר של הענבר** — בלעדיו אירוע שחלף היה נכנס לחלון עם 0 ימי-עסקים.
export function outboundMembership(eventDate, todayIso, businessDaysUntil) {
  const daysFromToday = eventDaysFromToday(eventDate, todayIso)
  if (daysFromToday === null || daysFromToday < 0) return false
  const businessDays = businessDaysUntil(todayIso, eventDate)
  return businessDays !== null && businessDays <= 1
}

// ── מיון-התור (S-3) ─────────────────────────────────────────────────────────
// **מרחק מוחלט מהיום** — אותה נגזרת בדיוק כמו sortOverviewProjects (מודול 6): אירוע
// שעבר לפני 5 ימים קרוב יותר מאירוע בעוד 12. 🚫 **אין מימד-מיון שני** — הגלולה כבר עשתה
// את מה ש"חסרים תחילה" עושה שם. שובר-שוויון יציב: `project_id`, סדר-הקליטה ולא אקראי.
export function sortQueueProjects(entries, todayIso) {
  return [...(entries ?? [])].sort((a, b) => {
    const distA = Math.abs(eventDaysFromToday(a.project?.final_event_date, todayIso) ?? Infinity)
    const distB = Math.abs(eventDaysFromToday(b.project?.final_event_date, todayIso) ?? Infinity)
    if (distA !== distB) return distA - distB
    return (a.project?.project_id ?? 0) - (b.project?.project_id ?? 0)
  })
}

// ── המבחין של ענף-הריק (AR-3) ───────────────────────────────────────────────
// 🔴 **`logistics` נושאת RLS פעיל, וקריאה שנחסמה מחזירה אפס שורות עם `error: null`** —
// זהה-בייט ל"התור ריק". המסך אינו נכשל; הוא משקר. **המבחין הזמין הוא שני השערים:**
// ‏`projects` (שער `'פרויקטים'`) מול `logistics` (שער `'לוגיסטיקה'`).
// ⚠️ **שני המקרים שהכרטיס מונה מתלכדים לתנאי אחד:** *"projects החזירה שורות ולוגיסטיקה
// אפס"* ו*"שתיהן ריקות"* שניהם ⇒ `noPermission` — הענף הבטוח הוא "אולי חסומה" ולא
// "הכול תקין" (כרטיס §④). ⇒ אפס שורות-לוגיסטיקה = חסימה, נקודה. חוסר-הרשאה **תמיד
// הענף הראשון** (תקדים מודול 4).
export function resolveQueueBranch(projectsRows, logisticsRows) {
  return (logisticsRows ?? []).length === 0 ? 'noPermission' : 'normal'
}

// ── שורות-הנימוק ────────────────────────────────────────────────────────────
// 🔤 **הצורה היא חלקים, לא מחרוזת שטוחה** — כל משפט חוזר כ-`{prefix, value, suffix, tone}`
// כשה-`value` הוא הערך היחיד שחייב בידוד-כיווניות (`<Ltr>`), ו-`null` כשאין ערך כזה.
// זה התאום של `changesTileSub` שבקובץ הזה, וזו המשפחה עם תשעה מופעים מדודים
// (`src/CLAUDE.md §🔤`): מספר שנכתב בתוך עברית בלי בידוד נוחת בצד הלא-נכון.
const plainReason = (text, tone) => ({ prefix: text, value: null, suffix: '', tone })

// לשון-יחיד · הצורה הכפולה המצוירת · ספרה מבודדת מ-3 ומעלה. הכפולה ("שני פריטים")
// מצוירת מילה-במילה בשורת `#107` שבמוקאפ; היחיד והרבים נגזרו בדפוס של logisticsTileSub.
function notOrderedReason(count) {
  if (count === 1) return plainReason('פריט אחד טרם הוזמן', 'hint')
  if (count === 2) return plainReason('שני פריטים טרם הוזמנו', 'hint')
  return { prefix: '', value: String(count), suffix: ' פריטים טרם הוזמנו', tone: 'hint' }
}

// כמה יחידות עדיין בדרך = Σ(מתוכנן − בפועל) על שורות `הוזמן` בלבד. **הקיזוז פר-שורה
// לא-שלילי**: שורה שהגיעה בעודף אינה "מינוס בדרך" (‏`actual_qty > planned_qty` חוקי —
// ה-RPC מתיר אותו במפורש). סכום 0 ⇒ **אין משפט**: היא כבר רשמה שהכול הגיע וטרם סימנה
// `מוכן`, ו-"0 יחידות עדיין בדרך" היה שקר קטן על המסך ("לא בכוח").
function inTransitReason(rows) {
  const missing = rows
    .filter((row) => row.item_status === 'ordered')
    .reduce(
      (sum, row) =>
        sum + Math.max((Number(row.planned_qty) || 0) - (Number(row.actual_qty) || 0), 0),
      0,
    )
  if (missing <= 0) return null
  if (missing === 1) return plainReason('יחידה אחת עדיין בדרך', 'hint')
  return { prefix: '', value: String(missing), suffix: ' יחידות עדיין בדרך', tone: 'hint' }
}

// שורת-הנימוק של שורת-התור. שני קצוות-הסקאלה — *"טרם הוזמן אף פריט"* ו-*"✓ מוכן"* —
// **נלקחים מ-readinessTileSub ולא נכתבים כאן שוב**: הם כבר נעולים שם, וליטרל שני היה
// סוטה ממנו בשקט ביום שבו מישהו יערוך אחד מהם (התקדים המדוד: `formatDate` · `StatTile`).
export function queueReason(rows) {
  const list = rows ?? []
  if (list.length === 0) return null
  const notStarted = list.filter((row) => row.item_status === 'not_started').length
  if (notStarted === list.length || readyItemsCount(list) === list.length) {
    const sub = readinessTileSub(list)
    return plainReason(sub.text, sub.tone)
  }
  if (notStarted > 0) return notOrderedReason(notStarted)
  return inTransitReason(list)
}

// "יוצא היום" / "יוצא ביום ראשון" — שם-היום דרך `weekdayOf` מ-`dates.js`, שהוא
// **מקור-האמת היחיד למערך שמות-הימים**; חישוב-יום מקומי אסור שם בהערה של הקובץ עצמו.
function outboundLead(eventDate, todayIso) {
  return eventDaysFromToday(eventDate, todayIso) === 0
    ? 'יוצא היום — '
    : `יוצא ביום ${weekdayOf(eventDate)} — `
}

// שורת-הנימוק של סעיף-היציאה. פרויקט שהכול בו מוכן מקבל את הנוסח הרגוע הנעול; כל השאר
// מקבלים את אותו נימוק של התור, בקידומת "מתי הוא יוצא" ובטון ענבר — כי שם זה **חוסר
// לפני יציאה**, לא סטטוס שקט (כרטיס §⑧-12: ⑳ צובע רקע-שורה, הסעיף צובע טקסט בלבד).
export function outboundReason(rows, eventDate, todayIso) {
  const list = rows ?? []
  if (list.length > 0 && readyItemsCount(list) === list.length) {
    return plainReason(OUTBOUND_READY_REASON, 'calm')
  }
  const base = queueReason(list)
  if (!base) return null
  return { ...base, prefix: `${outboundLead(eventDate, todayIso)}${base.prefix}`, tone: 'hint' }
}

// ‏DD/MM מתאריך-בלבד. 🚫 **לא `formatDate`** (היא מחזירה גם שנה) ו🚫 **לא `new Date`** —
// הפענוח המקומי מזיז את התאריך סביב חצות בחלק מהתאריכים בלבד (המוקש המתועד ב-`dates.js`).
function dayMonthOf(isoDate) {
  const [year, month, day] = String(isoDate ?? '').split('-')
  if (!/^\d{4}$/.test(year ?? '') || !/^\d{2}$/.test(month ?? '') || !/^\d{2}$/.test(day ?? '')) {
    return null
  }
  return `${day}/${month}`
}

// ✅ **O-1** (אושר 26/08/2026) — שורת-הנימוק של הטריגר השני (㊶). התאריך מבודד כ-`value`, כי DD/MM בתוך
// עברית הוא בדיוק המשפחה של תשעת המופעים.
export function lateArrivalReason(expectedArrivalDate) {
  const dayMonth = dayMonthOf(expectedArrivalDate)
  if (!dayMonth) return null
  return { ...LATE_ARRIVAL_TEMPLATE, value: dayMonth, tone: 'hint' }
}
