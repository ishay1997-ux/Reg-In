// חשבון-הכסף והמסמן "שינוי מאוחר" של דיאלוג-שינוי-התכולה (משטח 6, מודול 6). **טהור** —
// בלי Supabase, בלי DOM. השעון נכנס כפרמטר (כמו בכל `src/lib/`, ר' `shiftInvite.js`) כדי
// שהמסך הזה יהיה בדיקה בלי לזייף שעון גלובלי.
//
// 🔴 **הקובץ בונה סביב `apply_scope_change`, לא מעליו (`docs/micro_guides/module-6.md`
// step 2.2 as-built).** ה-RPC מקבל `target_qty` (היעד) ומחשב את ה-delta בעצמו; אלה כאן
// הן פונקציות-תצוגה שמראות למשתמשת **לפני** השליחה בדיוק את מה שהשרת יחשב, לא מקור-אמת שני.
//
// ⚠️ **הנחה מוצהרת (`הנחתי`):** `computeScopeChangeMoney` **אינה** מייבאת ישירות את
// `toAgorot`/`lineAgorot` הפרטיים של `pricing.js` — הם אינם מיוצאים משם, ובכוונה: `pricing.js`
// בונה הצעת-מחיר חדשה, וכל כמות בה חייבת להיות **חיובית** (`lineAgorot` מאפסת `qty ≤ 0` —
// זו אינה החלטה אקראית, זו האינווריאנטה של בניית-הצעה). כאן ה-`delta_qty` חייב להיות **חתום**
// (הפחתה = שלילי, ㉒ ב-processes-approved: *"positive = addition / negative = reduction"*),
// ולכן לא ניתן לקרוא ל-`pricing.js` על השורות עצמן בלי לאבד הפחתות בשקט. מה שכן מיובא בפועל:
// `resolveUnitPrice` ל-`tierCrossingNotice` (השוואת-מחיר בין מדרגות, לא מחייבת חתימה) ו-**אותו
// סדר-פעולות ואותו חשבון-אגורות-שלמות** כמו `computeQuoteTotals` (`pricing.js:106-132`) —
// סכום → הנחה → לפני-מע"מ → מע"מ → סה"כ, בעיגול-אגורה בכל שלב, לא float.
import { weekdayOf } from '@/lib/dates'
import { resolveUnitPrice } from '@/lib/pricing'

// ── עבודה באגורות, כמו ב-pricing.js (§7.25+§7.74) ───────────────────────────
// עותק מקומי במכוון, ולא ייבוא: `toAgorot`/`toShekels` הפרטיים של `pricing.js` אינם מיוצאים
// (ר' ההערה למעלה) — ההכפלה כאן היא שתי שורות טריוויאליות, לא לוגיקה עסקית שיכולה לסטות.
function toAgorot(shekels) {
  const n = Number(shekels)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
function toShekels(agorot) {
  return agorot / 100
}
function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// ── delta_qty וסכום-שורה ──────────────────────────────────────────────────

// היעד פחות המתוכנן. **התצוגה בלבד** — `p_lines` שנשלח לשרת נושא `target_qty`, לא את זה
// (as-built ①: "‏THE TARGET, NOT THE DELTA"); זו הפונקציה שמראה למשתמשת את ההפרש לפני שהיא שולחת.
export function computeDeltaQty(plannedQty, targetQty) {
  const planned = toFiniteNumber(plannedQty)
  const target = toFiniteNumber(targetQty)
  if (planned === null || target === null) return null
  return target - planned
}

// סכום-שורה בשקלים, מדויק לאגורה — תואם בייט-בבייט ל-`revenue_delta` שה-RPC מחזיר
// (as-built ③: `round(delta_qty × unit_price_snapshot, 2)`). 🔴 **בכוונה לא מאפס `delta_qty`
// שלילי** (בניגוד ל-`pricing.js:lineAgorot`) — הפחתה היא סכום-שורה שלילי לגיטימי, לא שורה
// חסרת-משמעות כמו כמות-אפס בהצעה חדשה.
export function lineChangeAmount(deltaQty, unitPriceSnapshot) {
  const qty = toFiniteNumber(deltaQty)
  const price = toFiniteNumber(unitPriceSnapshot)
  if (qty === null || price === null) return 0
  return toShekels(Math.round(qty) * toAgorot(price))
}

// ── פאנל-הכסף של הדיאלוג ─────────────────────────────────────────────────

// `lines`: `[{ deltaQty, unitPriceSnapshot }]`. מחזיר את חמש השורות בדיוק לפי סדר-התצוגה
// המאושר: סכום-השינוי ⇒ הנחה ⇒ לפני-מע"מ ⇒ מע"מ ⇒ תוספת-לחיוב — **אותו סדר ואותו חשבון-
// אגורות-שלמות כמו `computeQuoteTotals` (`pricing.js:106-132`)**, על סכום שיכול להיות שלילי.
// 🚫 **לעולם לא `revenue_delta_total` של ה-RPC בתור `תוספת לחיוב`** — זה מדלג על ההנחה
// ועל המע"מ (as-built ③); הפונקציה הזו היא ה"ארבע השורות שנשארות חשבון של הצעד הזה".
export function computeScopeChangeMoney(
  lines,
  appliedDiscountPercent,
  manualDiscountPercent,
  vatRate,
) {
  const applied = toFiniteNumber(appliedDiscountPercent) ?? 0
  const manual = toFiniteNumber(manualDiscountPercent) ?? 0
  const vat = toFiniteNumber(vatRate) ?? 0
  const discountPercent = applied + manual

  const changeAgorot = (lines ?? []).reduce((sum, line) => {
    const qty = toFiniteNumber(line?.deltaQty)
    const price = toFiniteNumber(line?.unitPriceSnapshot)
    if (qty === null || price === null) return sum
    return sum + Math.round(qty) * toAgorot(price)
  }, 0)

  // §7.26/F7: ההנחות **מתחברות**, לא משורשרות — 5%+10% הן 15% מסכום-השינוי, לא 10% מהיתרה
  // שאחרי ה-5%. שרשור נותן מספר אחר, קטן מספיק כדי לעבור בקריאה וגדול מספיק לשבור דוח.
  const discountAgorot = Math.round((changeAgorot * discountPercent) / 100)
  const preVatAgorot = changeAgorot - discountAgorot
  const vatAgorot = Math.round((preVatAgorot * vat) / 100)

  return {
    changeAmount: toShekels(changeAgorot),
    discountPercent,
    discountAmount: toShekels(discountAgorot),
    preVat: toShekels(preVatAgorot),
    vatPercent: vat,
    vatAmount: toShekels(vatAgorot),
    total: toShekels(preVatAgorot + vatAgorot),
  }
}

// ── בלוק-ההשלכה של הדיאלוג (משטח 6) ─────────────────────────────────────────

// שורת-הצוות: הפער הישן והחדש מול המאושרות-סופית, והמוכנות לפי ≥ (§7.43 / 🔄4 —
// over-staffed הוא "מוכן"; `===` היה מחריג אותו בשקט). חי כאן ולא ב-JSX (כלל 14):
// המספרים האלה הם מה שהמשתמשת מאשרת לפי, וסטייה בהם היא סטיית-מוצר, לא סטיית-רינדור.
// הפערים לעולם אינם שליליים — "יחסרו −2 דיילות" הוא משפט שקרי על המסך.
export function staffingConsequence({ confirmed, currentTarget, newTarget }) {
  const confirmedCount = toFiniteNumber(confirmed) ?? 0
  const current = toFiniteNumber(currentTarget) ?? 0
  const target = toFiniteNumber(newTarget) ?? 0
  return {
    oldGap: Math.max(current - confirmedCount, 0),
    newGap: Math.max(target - confirmedCount, 0),
    ready: confirmedCount >= target,
  }
}

// שורת-"חיוב": סה"כ לפרויקט אחרי השינוי = סך-ההצעה המקורי + "תוספת לחיוב" — בחיבור-
// אגורות, לא `+` על float ב-JSX (אותו חשבון-אגורות-שלמות כמו כל הקובץ). צד לא-קריא
// (הצעה חסומה / אין שינוי) ⇒ null ⇒ המסך מציג '—', לעולם לא 0.
export function projectTotalAfterChange(quoteTotal, changeTotal) {
  const quote = toFiniteNumber(quoteTotal)
  const change = toFiniteNumber(changeTotal)
  if (quote === null || change === null) return null
  return toShekels(toAgorot(quote) + toAgorot(change))
}

// ── המסמן "שינוי מאוחר" (⑯, as-built 14/08/2026 סעיף ד) ─────────────────────

// 🔴 **ממיר "שעון-קיר" בישראל (Asia/Jerusalem) לרגע-UTC בלי ספריית-אזורי-זמן.** ישראל
// עוברת בין UTC+2 (חורף) ל-UTC+3 (קיץ) ולכן ההיסט אינו קבוע. הטריק הסטנדרטי: מנחשים רגע-UTC
// מהספרות המקומיות, בודקים איך הניחוש הזה **נראה** כשמציגים אותו בישראל, ומתקנים בהפרש —
// אותה שיטה שכבר בשימוש ב-`formatTimestamp` (`dates.js`) לכיוון ההפוך (UTC ⇒ תצוגה-ישראל).
function jerusalemWallClockToUtcMs(year, month, day, hour, minute) {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(guess))
  const get = (type) => Number(parts.find((part) => part.type === type)?.value)
  const localAsIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
  )
  return guess - (localAsIfUtc - guess)
}

// תאריך `YYYY-MM-DD` של "עכשיו" בשעון ישראל — נקודת-הפתיחה לספירת ימי-העסקים.
function todayIsoInJerusalem(now) {
  const instant = now instanceof Date ? now : new Date(now)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// שעות עד האירוע, floor — **אותו עוגן בדיוק כמו ה-RPC** (as-built ①, `pg_get_functiondef`):
// `floor(epoch((final_event_date + coalesce(final_start_time,'00:00')) at time zone
// 'Asia/Jerusalem' − now())/3600)`. 🔴 חייב שעת-התחלה, לא רק תאריך — ומחייב את אזור-הזמן
// של ישראל, לא של הדפדפן/הריצה; שתי הסטיות האלה יכולות לתת מספר שונה מהשרת ביום שלם.
export function hoursUntilEvent(eventDate, startTime, now) {
  const [year, month, day] = String(eventDate).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  const [hour, minute] = String(startTime ?? '00:00')
    .split(':')
    .map(Number)
  const eventUtcMs = jerusalemWallClockToUtcMs(year, month, day, hour || 0, minute || 0)
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime()
  if (!Number.isFinite(nowMs)) return null
  return Math.floor((eventUtcMs - nowMs) / 3_600_000)
}

// ימי-עסקים בישראל (א׳-ה׳; שישי-שבת הם הסופ"ש כאן) בין `fromIsoDate` (לא כולל) ל-`toIsoDate`
// (כולל). 🔴 **לא `days > 3` על הפרש-לוח** — רביעי→ראשון הוא הפרש-לוח של 4 ימים אך רק 2
// מהם ימי-עסקים (חמישי וראשון; שישי-שבת מדולגים), טעות של שתיים בדיוק בגבול הזה.
export function businessDaysUntil(fromIsoDate, toIsoDate) {
  const [fy, fm, fd] = String(fromIsoDate).split('-').map(Number)
  const [ty, tm, td] = String(toIsoDate).split('-').map(Number)
  if (![fy, fm, fd, ty, tm, td].every(Number.isInteger)) return null

  const DAY_MS = 86_400_000
  const fromMs = Date.UTC(fy, fm - 1, fd)
  const toMs = Date.UTC(ty, tm - 1, td)

  let count = 0
  for (let ms = fromMs + DAY_MS; ms <= toMs; ms += DAY_MS) {
    const cursor = new Date(ms)
    const iso = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(
      cursor.getUTCDate(),
    ).padStart(2, '0')}`
    const weekday = weekdayOf(iso)
    if (weekday !== 'שישי' && weekday !== 'שבת') count += 1
  }
  return count
}

// 🔴 **↳ as-built 14/08/2026, סעיף ד (הכרעת-ישי) — מותנה, לא כללי.** מסומן **רק**: שורת
// כמות-דיילות מתחת ל-24 שעות · שורת-לוגיסטיקה (טובין מודפסים) מתחת ל-3 ימי-עסקים.
// **הפחתה (`deltaQty` שלילי) לעולם אינה מסומנת, בכל טווח.** כל שאר המקרים ⇒ `false`,
// בלי באנר בכלל. 🚫 **זו אינה חסימה** — ⑯ אוסרת שעון-חוסם; זה רק קובע אם משפט מוצג.
export function isLateChange(line, eventDate, startTime, now) {
  const deltaQty = toFiniteNumber(line?.deltaQty)
  if (deltaQty === null || deltaQty <= 0) return false

  if (line?.target === 'hostess_count') {
    const hours = hoursUntilEvent(eventDate, startTime, now)
    return hours !== null && hours < 24
  }
  if (line?.target === 'logistics') {
    const from = todayIsoInJerusalem(now)
    const businessDays = businessDaysUntil(from, eventDate)
    return businessDays !== null && businessDays < 3
  }
  return false
}

// הנוסח המאושר, מילה-במילה (⑯) — שלוש המשפטים תמיד יחד, ורק מספר-השעות משתנה.
// 🔴 **לא נבנה שונה לפי דיילות/לוגיסטיקה** — אותו באנר בדיוק לשתי הקטגוריות; רק התנאי
// שמחליט אם להציג אותו (`isLateChange`) שונה ביניהן.
export function lateChangeBanner(hoursUntilEventValue) {
  return (
    `⚠ שינוי ${hoursUntilEventValue} שעות לפני האירוע. ` +
    'דיילת נוספת כמעט אינה ניתנת לגיוס בטווח כזה, ותגים מודפסים דורשים ימים. ' +
    'הרימי טלפון — אל תסתמכי על מייל.'
  )
}

// ── הודעת-חציית-מדרגה (③ↄ) ───────────────────────────────────────────────

// מוצגת **רק** כשהכמות-החדשה נכנסת למדרגת-מחיר זולה יותר מזו של הכמות-המתוכננת. `product`
// ו-`tiers` באותה צורה בדיוק כמו `pricing.js:resolveUnitPrice` — **מיובאת, לא משוכפלת**,
// כדי שהשוואת-המדרגות כאן לעולם לא תסטה ממנה שבונה את ההצעה המקורית.
// 🚫 **בלי סכום ₪ בטקסט** — התוספת מחויבת לפי מחיר-ההצעה הקפוא, לא לפי מחיר-הקטלוג של היום,
// וספרה כאן הייתה עלולה להתפרש כמחיר-הקטלוג.
export function tierCrossingNotice(product, tiers, plannedQty, targetQty) {
  const oldPrice = resolveUnitPrice(product, tiers, plannedQty)
  const newPrice = resolveUnitPrice(product, tiers, targetQty)
  if (newPrice >= oldPrice) return null
  return (
    `${targetQty} יחידות נכנסות בקטלוג למדרגת מחיר זולה יותר. ` +
    'התוספת מחויבת לפי המחיר שאושר בהצעה — לא לפי מחיר הקטלוג של היום.'
  )
}
