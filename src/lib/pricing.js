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

// ⚠️ הייבוא היחיד של הקובץ, ובכוונה: `validators.js` טהור אף הוא (בלי Supabase/Date/DOM),
// ולכן הוא אינו מפר את האינווריאנטה שלמעלה. הוא הבית של כללי-החוקיות שנאכפים ב-
// validateTierRows בתחתית הקובץ.
import { isValidPositiveInt, isValidPositivePrice } from '@/lib/validators'

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

// מחיר-קטלוג באגורות מלאות. why-first: F18 מעגל **סכומי-הצעה** לשקל שלם כדי שסכום השורות
// יתחבר לסה"כ — אבל מסך תחזוקת-המחירים מציג את **המחיר עצמו**, ושם עיגול הוא שקר: עלות של
// 2.50 ₪ שמוצגת "3 ₪" מסתירה בדיוק את הנתון שהמנכ"ל בא לבדוק. אפסים מיותרים נחתכים (6 ₪,
// לא 6.00 ₪) כי טור-מחירים עם ".00" חוזר קשה יותר לסריקה בעין.
export function formatShekelExact(amount) {
  const n = toFiniteNumber(amount)
  if (n === null) return '—'
  const rounded = Math.round(n * 100) / 100
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString('he-IL')
    : rounded.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${text} ₪`
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

// ── מסך המחירים (צעד 3.6) ──────────────────────────────────────────────────

// שולי-רווח באחוזים מתוך מחיר-המכירה — (מחיר − עלות) / מחיר. why-first: שני הנתונים כבר
// שמורים בכל שורת-מוצר, כך שהעמודה חינמית; המנכ"ל רואה מיד אילו פריטים משתלמים בלי לחשב
// בראש. **מחזיר מספר שלילי כשהמחיר מתחת לעלות** ולא 0 — הפסד חייב להיראות כהפסד.
// מחיר 0 או נתון חסר ⇒ null: אין מרווח מוגדר, והמסך מציג מקף ולא NaN.
export function computeMarginPercent(basePrice, cost) {
  const price = toFiniteNumber(basePrice)
  const c = toFiniteNumber(cost)
  if (price === null || c === null || price <= 0) return null
  return Math.round(((price - c) / price) * 100)
}

// ולידציית עורך-המדרגות. why-first: המסד אוכף כל אילוץ כאן (min_qty שלם-חיובי, מחיר > 0,
// PK משולב על (sku,min_qty)) — אבל כישלון-שמירה מוחזר כשגיאת-23505 גולמית אחרי round-trip,
// והמשתמש לא יודע איזו שורה אשמה. הבדיקה כאן מקדימה את המסד ומצביעה על השדה עצמו.
//
// מבנה-ההחזרה מפריד **שגיאה מאזהרה** במכוון: שגיאה חוסמת שמירה (המסד ידחה ממילא),
// אזהרה לא (מחיר מתחת לעלות עשוי להיות מכוון — מבצע, חיסול מלאי). ר' §7.27: ‏max_qty אינו
// משתתף בבחירת-המדרגה, ולכן חפיפה בין טווחים אינה שגיאה — רק min_qty כפול היא.
export function validateTierRows(rows, product = {}) {
  const list = rows ?? []
  const rowErrors = list.map(() => ({}))
  const warnings = list.map(() => ({}))
  const cost = toFiniteNumber(product?.cost)

  // ספירת-הופעות מראש: min_qty כפול מסמן את **כל** השורות שמשתתפות בו, כי המשתמש
  // לא יכול לדעת איזו מהן "המקורית" — סימון אחת בלבד היה נראה שרירותי.
  const minQtyCounts = new Map()
  list.forEach((row) => {
    const key = String(row?.min_qty ?? '').trim()
    if (key !== '') minQtyCounts.set(key, (minQtyCounts.get(key) ?? 0) + 1)
  })

  list.forEach((row, i) => {
    const minRaw = String(row?.min_qty ?? '').trim()
    const maxRaw = String(row?.max_qty ?? '').trim()
    const priceRaw = String(row?.special_price ?? '').trim()
    const min = toFiniteNumber(minRaw)
    const max = toFiniteNumber(maxRaw)
    const price = toFiniteNumber(priceRaw)

    // ⚠️ כללי-החוקיות עצמם מיובאים מ-validators.js ולא נכתבים כאן מחדש (אוחד 31/07/2026,
    // סבב-ניקוי E): עד אז אותו כלל בדיוק היה כתוב פעמיים — נבדק שם, נאכף כאן — ושתי
    // הגרסאות יכלו לסטות בשקט. הניסוח של ההודעה נשאר כאן, כי הוא של המסך ולא של הכלל.
    if (!isValidPositiveInt(minRaw)) {
      rowErrors[i].min_qty = 'מספר שלם גדול מאפס'
    } else if (minQtyCounts.get(minRaw) > 1) {
      rowErrors[i].min_qty = 'כמות זו מופיעה כבר במדרגה אחרת'
    }

    // ריק = "ללא הגבלה", וזה חוקי לגמרי (כך נראית המדרגה העליונה בכל מוצר בקטלוג).
    if (maxRaw !== '') {
      if (!isValidPositiveInt(maxRaw)) {
        rowErrors[i].max_qty = 'מספר שלם גדול מאפס, או ריק לללא הגבלה'
      } else if (min !== null && max < min) {
        rowErrors[i].max_qty = 'לא יכול להיות קטן מ"מכמות"'
      }
    }

    if (!isValidPositivePrice(priceRaw)) {
      rowErrors[i].special_price = 'מחיר גדול מאפס'
    } else if (cost !== null && price < cost) {
      warnings[i].special_price = `מתחת לעלות (${cost} ₪)`
    }
  })

  const isValid = rowErrors.every((e) => Object.keys(e).length === 0)
  return { isValid, rowErrors, warnings, formError: null }
}
