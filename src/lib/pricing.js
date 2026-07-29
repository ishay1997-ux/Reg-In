// מקור-האמת היחיד לכסף במודול 3 (כלל 14). כל מקום שמציג סכום — מסך-ההצעה, ה-PDF שנשלח
// ללקוח, ומדדי-ההכנסות בכרטיס-הלקוח — מייבא מכאן ולעולם לא מחשב בעצמו. הסיבה מעשית: אותו
// סכום מופיע בשלושה מקומות, ותיקון שנשכח באחד מהם מייצר PDF שלא תואם למסך.
//
// ⚠️ F26 (הכרעת-ישי 14/07, אחרי llm-council) — האינווריאנטה של הקובץ הזה:
// המנוע מכיר **פריט × כמות × מחיר-יחידה בלבד**. לעולם לא "משמרת", לא "שעה", ולא שום
// סמנטיקה של זמן. מודל-התמחור הוא חבילות: "דיילת 4 שעות" הוא פריט בקטלוג עם מחיר, לא
// חישוב של שעות × תעריף. אל תוסיפו כאן לוגיקת-זמן — היא שייכת לקטלוג, לא למנוע.
//
// טהור לחלוטין: בלי Supabase, בלי Date, בלי קריאה לגלובלים — כדי שהבדיקות יוכיחו את
// החישוב עצמו, ולא את הסביבה שסביבו.

// שמות הפרמטרים ב-params — SSOT למחרוזת, כדי ש-'אחוז_מעמ' לא ישוכפל בכמה קבצים ויתפצל
// בשקט בהקלדה. חייבים להיות זהים בית-בבית לשורות ה-Seed (מיגרציה 20260723112000).
export const PRICING_PARAM_NAMES = {
  VAT_PERCENT: 'אחוז_מעמ',
  GUESTS_PER_HOSTESS_RATIO: 'יחס_אורחים_לדיילת',
}

// ── עבודה באגורות (§7.25 + §7.74) ──────────────────────────────────────────
// כל החישוב הפנימי נעשה במספרים **שלמים** של אגורות, ולא בשקלים עשרוניים. why-first:
// ב-JavaScript ‏0.1+0.2 אינו 0.3, ובחישוב כסף זה בדיוק ההפרש בין 6,318.90 ל-6,318.89.
// מספרים שלמים אין להם את הבעיה הזו. ההמרה חזרה לשקלים קורית רק בשורת ה-return.
// מקביל ל-numeric(12,2) של ה-DB: שתי ספרות, לא יותר.
function toAgorot(shekels) {
  const n = Number(shekels)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

function toShekels(agorot) {
  return agorot / 100
}

// ⚠️ ‏Number(null) ו-Number('') מחזירים **0**, לא NaN — לכן ריק נפסל במפורש לפני ההמרה.
// בלי זה "מע"מ שלא נטען מה-DB" היה מתחזה בשקט למע"מ 0% ומייצר הצעה בלי מע"מ.
function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// אחוז חוקי 0–100. זורק (ולא מחזיר ברירת-מחדל) כי ערך פסול שהגיע עד לכאן הוא באג בטופס,
// לא קלט-משתמש: המסך חוסם קודם (isValidDiscountPercent). עדיף להתפוצץ מאשר להמציא סכום.
function requirePercent(value, label) {
  const n = toFiniteNumber(value)
  if (n === null || n < 0 || n > 100) {
    throw new Error(`${label} חייב להיות מספר בין 0 ל-100 (התקבל: ${value}).`)
  }
  return n
}

function lineAgorot(qty, unitPrice) {
  const q = toFiniteNumber(qty)
  if (q === null || q <= 0) return 0
  return Math.round(q) * toAgorot(unitPrice)
}

// ── מדרגות-מחיר ────────────────────────────────────────────────────────────

// §7.27 (הכרעת-ישי 07/07): **המדרגה הגבוהה ביותר שה-min_qty שלה ≤ הכמות מנצחת.**
// ‏max_qty הוא תצוגה בלבד ואינו משתתף בבחירה — אין עליו אילוץ ב-DB, ולכן הסתמכות עליו
// הייתה הופכת שגיאת-נתונים במחירון לשגיאת-תמחור שקטה.
// אין מדרגות מתאימות (או אין מדרגות בכלל, כמו בשירותי-דיילות — החלטת-Seed #3) ⇒ base_price.
// הסינון לפי sku מכוון: מותר להעביר לכאן את **כל** קטלוג-המדרגות בלי לסנן קודם.
// המדרגה הזוכה עצמה (או null אם אין). מיוצאת כדי שמסך-הבנייה יוכל להסביר למשתמש **למה**
// המחיר הוא 5 ₪ ולא 6 ₪ ("מדרגה 201–400") — בלי לשכפל את כלל-הבחירה במקום שני שיסטה ממנו.
export function findMatchingTier(product, tiers, qty) {
  const q = toFiniteNumber(qty)
  if (q === null) return null

  const candidates = (tiers ?? []).filter(
    (t) => t && (t.sku == null || t.sku === product?.sku) && (toFiniteNumber(t.min_qty) ?? 0) <= q,
  )
  if (candidates.length === 0) return null

  return candidates.reduce((best, t) =>
    (toFiniteNumber(t.min_qty) ?? 0) > (toFiniteNumber(best.min_qty) ?? 0) ? t : best,
  )
}

export function resolveUnitPrice(product, tiers, qty) {
  const basePrice = toFiniteNumber(product?.base_price) ?? 0
  const winner = findMatchingTier(product, tiers, qty)
  if (winner === null) return basePrice
  return toFiniteNumber(winner.special_price) ?? basePrice
}

// סך-שורה בשקלים, מדויק לאגורה. כמות/מחיר לא-תקינים ⇒ 0 (שורה חצי-מלאה במסך-הבנייה
// לא אמורה להפיל את הסיכום החי בזמן שהמשתמש עדיין מקליד).
export function computeLineTotal(qty, unitPrice) {
  return toShekels(lineAgorot(qty, unitPrice))
}

// ── סיכום ההצעה ────────────────────────────────────────────────────────────

// lines = [{ qty, unitPrice }] — הצורה הקנונית. שורות שמגיעות מה-DB
// (‏closing_unit_price) ממופות לצורה הזו בשכבת ה-api, לא כאן.
//
// §7.26 + F7 (הכרעת-ישי 07/07): ההנחות **מתחברות בחיבור ולא בשרשור** — 5% ו-10% הן 15%
// מסכום-הביניים, ולא 10% מהיתרה שאחרי ה-5%. (שרשור היה נותן 14.5% ו-6,313 ₪ במקום 6,319.)
export function computeQuoteTotals(lines, appliedDiscount, manualDiscount, vatRate) {
  const applied = requirePercent(appliedDiscount, 'הנחת הלקוח')
  const manual = requirePercent(manualDiscount, 'ההנחה הידנית')
  const vat = requirePercent(vatRate, 'שיעור המע"מ')

  // ההשוואה במאיות-שלמות ולא ב-float: 33.33+66.67 שווה 100 בדיוק ב-numeric של ה-DB, אבל
  // 100.00000000000001 ב-float — והצעה חוקית לגמרי הייתה נדחית כאן ומתקבלת שם.
  if (Math.round(applied * 100) + Math.round(manual * 100) > 10000) {
    throw new Error(`סכום ההנחות (${applied}% + ${manual}%) חורג מ-100%.`)
  }

  const subtotal = (lines ?? []).reduce(
    (sum, line) => sum + lineAgorot(line?.qty, line?.unitPrice),
    0,
  )
  const discount = Math.round((subtotal * (applied + manual)) / 100)
  const preVat = subtotal - discount
  const vatAmount = Math.round((preVat * vat) / 100)

  return {
    subtotal: toShekels(subtotal),
    discountAmount: toShekels(discount),
    preVat: toShekels(preVat),
    vatAmount: toShekels(vatAmount),
    total: toShekels(preVat + vatAmount),
  }
}

// F14: המלצת מספר-הדיילות מעוגלת תמיד **כלפי מעלה** — 301 אורחים ביחס 50 הם 7 דיילות,
// לא 6.02. עיגול-למטה היה משאיר אורחים בלי מענה בשטח.
// קלט חסר ⇒ 0 ולא שגיאה: השדה מחושב חי תוך-כדי הקלדה, והטופס הוא זה שחוסם שמירה
// (ב-DB יש CHECK ‏recommended_hostess_count > 0).
export function recommendHostessCount(guests, ratio) {
  const g = toFiniteNumber(guests)
  const r = toFiniteNumber(ratio)
  if (g === null || r === null || g <= 0 || r <= 0) return 0
  return Math.ceil(g / r)
}

// F18: התצוגה מעוגלת לשקל שלם — הסכומים המדויקים (963.90) חיים בחישוב ובאחסון, והעיגול
// קורה **רק כאן**. כך סכום השורות המוצגות תמיד מתחבר לסה"כ המוצג.
export function formatShekelWhole(amount) {
  const n = toFiniteNumber(amount)
  if (n === null) return '—'
  return `${Math.round(n).toLocaleString('he-IL')} ₪`
}

// פענוח ערכי params (נשמרים כטקסט ב-DB). מחזירים null — ולא ברירת-מחדל שקטה — כדי
// שהקורא ייאלץ להחליט מה לעשות כשהפרמטר חסר, במקום לתמחר לפי מספר מומצא.
export function parseVatPercent(paramValueText) {
  const n = toFiniteNumber(paramValueText)
  return n !== null && n >= 0 && n <= 100 ? n : null
}

export function parseGuestsRatio(paramValueText) {
  const n = toFiniteNumber(paramValueText)
  return n !== null && n > 0 ? n : null
}
