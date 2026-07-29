// לוגיקה עסקית של מודול 3 שאיננה חישוב-כסף (הכסף חי ב-src/lib/pricing.js — כלל 14).
// כאן: תוויות מחזור-החיים, כללי-הטופס, המרה בין צורת-המסך לצורת-ה-DB, ורווחיות.
// טהור לחלוטין — בלי Supabase ובלי שעון (התאריך "היום" מוזרם פנימה) — כדי שהבדיקות
// יוכיחו את הכללים ולא את הסביבה.

import {
  computeLineTotal,
  computeQuoteTotals,
  recommendHostessCount,
  PRICING_PARAM_NAMES,
} from '@/lib/pricing'

// quotes.quote_status — שלושת הערכים של CHECK quotes_quote_status_check.
export const QUOTE_STATUS_LABELS = {
  in_progress: 'בתהליך',
  approved: 'מאושרת',
  rejected: 'נדחתה',
}

// quotes.rejection_reason — 8 הערכים של CHECK quotes_rejection_reason_check.
// §7.82/F2 קבע 7; ישי תיקן את הכרעתו-שלו 29/07/2026 והוסיף את 'נפתחה בטעות'
// (מיגרציה 20260729191557). 'פג תוקף' נכתב על-ידי עבודת-הרקע היומית ואינו נבחר ידנית.
export const REJECTION_REASONS = [
  'מחיר',
  'חוסר זמינות/לו"ז',
  'נבחר מתחרה',
  'תקציב לקוח',
  'האירוע בוטל אצל הלקוח',
  'פג תוקף',
  'נפתחה בטעות',
  'אחר',
]

// §7.41 + הכרעת-ישי 29/07/2026: בחירת-צבע מוצגת **רק** לתגים ולשרוכים (category='product').
// לשירותי-דיילות ולהקמת-אתר אין צבע, ושדה חסר-משמעות בשורה הוא רעש שמבלבל.
export function isColorApplicable(product) {
  return product?.category === 'product'
}

// שורות-המסך → הצורה הקנונית של pricing.js. המרה במקום אחד, כדי שלא ייווצר מיפוי שני שיסטה.
export function linesToPricingShape(lines) {
  return (lines ?? []).map((line) => ({ qty: line?.qty, unitPrice: line?.unitPrice }))
}

// סך-דיילות בפועל בהצעה (סכום הכמויות בשורות מקטגוריית hostess). ה-RPC של האישור מחשב
// בדיוק את אותו סכום כדי לקבוע required_hostess_count בפרויקט (F22) — הערך המוצג במסך
// חייב להיות אותו ערך, אחרת המשתמש רואה מספר אחד ומקבל פרויקט עם אחר.
export function sumHostessQty(lines) {
  return (lines ?? [])
    .filter((line) => line?.category === 'hostess')
    .reduce((sum, line) => sum + (Number(line?.qty) || 0), 0)
}

// ── רווחיות (§7.28 + הכרעת-ישי 29/07: מוצג לבעלי הרשאת-עריכה, לעולם לא ב-PDF ללקוח) ──
// לפני האישור העלות עדיין לא קפואה, ולכן מחושבת מ-products.cost החי; ברגע האישור ה-RPC
// מקפיא אותה ב-closing_unit_cost. לכן זו **הערכה** ולא מספר סופי, וכך היא גם מוצגת.
export function computeLinesCost(lines) {
  return (lines ?? []).reduce((sum, line) => sum + computeLineTotal(line?.qty, line?.unitCost), 0)
}

// רווח גולמי מחושב מול הסכום **לפני מע"מ** — המע"מ אינו הכנסה של החברה אלא כסף שעובר
// לרשויות, וכלילתו הייתה מנפחת את שיעור-הרווח בכ-18% מלאכותיים.
export function deriveProfitability(preVat, cost) {
  const revenue = Number(preVat) || 0
  const totalCost = Number(cost) || 0
  const grossProfit = revenue - totalCost
  return {
    cost: totalCost,
    grossProfit,
    // אין הכנסה ⇒ null ולא 0: "0% רווח" על הצעה ריקה הוא מספר שקרי.
    marginPercent: revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : null,
  }
}

// ── מפתחות ה-jsonb ל-RPC — SSOT יחיד ──────────────────────────────────────────
// ⚠️ ה-RPC קורא את ה-header/lines עם ->>'key'. מפתח שהוקלד לא-נכון **אינו נכשל**: הוא
// הופך ל-NULL בשרת, ולעמודות עם coalesce(...,0) — כמו manual_discount — הוא הופך בשקט
// ל-0, כלומר הצעה שנשמרת בלי ההנחה שהוזנה. לכן שמות-המפתחות נכתבים כאן פעם אחת בלבד.
export function buildQuoteHeader(form) {
  return {
    customer_id: form.customerId,
    event_name: form.eventName?.trim(),
    // הכרעת-ישי 29/07/2026: כמות-הדיילות **ניתנת לעריכה ידנית** ישירות, ולא רק דרך שינוי
    // היחס ("לא רוצה לחשב בראש איזה יחס ייתן 7"). לכן נשמר הערך שבטופס, ולא בהכרח המלצת
    // הנוסחה. השדה אינו משתתף בתמחור ואינו זה שקובע את הפרויקט — ה-RPC של האישור סוכם את
    // כמויות שורות-הדיילות בפועל (F22) — ולכן דריסה כאן בטוחה לחלוטין.
    recommended_hostess_count:
      Number(form.hostessCount) || recommendHostessCount(form.guests, form.ratio),
    estimated_guests: Number(form.guests),
    estimated_event_date: form.eventDate,
    estimated_location: form.location?.trim(),
    estimated_start_time: form.startTime,
    estimated_end_time: form.endTime,
    applied_customer_discount: Number(form.appliedDiscount),
    manual_discount: Number(form.manualDiscount) || 0,
    notes: form.notes?.trim() ?? '',
  }
}

// line_number ו-closing_unit_cost נקבעים בשרת (ordinality + products.cost) — שליחתם מכאן
// היא no-op, ולכן הן לא נכללות: שדה שנשלח ונזרק מטעה את מי שקורא את הקוד.
export function buildQuoteLines(lines) {
  return (lines ?? []).map((line) => ({
    sku: line.sku,
    qty: Number(line.qty),
    closing_unit_price: Number(line.unitPrice),
    color: line.color ?? '',
    notes: line.notes?.trim() ?? '',
  }))
}

// ── ולידציה ────────────────────────────────────────────────────────────────
// מחזירה מפת-שגיאות { field: 'הודעה' }; ריקה = תקין. todayIso מוזרם מבחוץ (בלי שעון כאן).
// כל כלל כאן מקביל לאילוץ ב-DB — ה-DB הוא החומה, זו שכבת-הסבר ידידותית לפניה.
function isPositiveQty(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

export function validateQuoteForm(form, lines, todayIso) {
  const errors = {}

  if (!form.customerId) errors.customerId = 'יש לבחור לקוח.'
  if (!form.eventName?.trim()) errors.eventName = 'יש להזין שם אירוע.'
  if (!form.location?.trim()) errors.location = 'יש להזין מיקום.'
  if (!form.startTime) errors.startTime = 'יש להזין שעת התחלה.'
  if (!form.endTime) errors.endTime = 'יש להזין שעת סיום.'

  // הכרעת-ישי 29/07/2026: תאריך-עבר **נחסם כבר ביצירה** (ולא רק באישור, כפי שה-RPC אוכף)
  // — הצעה לתאריך שחלף לא תוכל להפוך לפרויקט לעולם, ועדיף לומר זאת מיד.
  if (!form.eventDate) {
    errors.eventDate = 'יש להזין תאריך אירוע.'
  } else if (todayIso && form.eventDate < todayIso) {
    errors.eventDate = 'תאריך האירוע כבר עבר — לא ניתן ליצור הצעה לתאריך שחלף.'
  }

  const guests = Number(form.guests)
  if (!Number.isFinite(guests) || guests <= 0) errors.guests = 'כמות אורחים חייבת להיות גדולה מ-0.'

  const ratio = Number(form.ratio)
  if (!Number.isFinite(ratio) || ratio <= 0) errors.ratio = 'יחס אורחים לדיילת חייב להיות גדול מ-0.'

  // CHECK quotes_recommended_hostess_count_check דורש > 0. מאז שהשדה נערך ידנית, משתמש
  // יכול לרוקן אותו — וריק היה מגיע לשרת כ-NULL ומפיל את ה-INSERT בשגיאה לא-קריאה.
  if (!isPositiveQty(form.hostessCount)) {
    errors.hostessCount = 'כמות הדיילות חייבת להיות גדולה מ-0.'
  }

  // ⚠️ הבחנה שנתפסה בבדיקה 29/07/2026 ושווה להסביר, כי היא נראית כמו סתירה למלכודת
  // המתועדת ב-pricing.js ("ריק אינו 0"): שם מדובר ב**פרמטר-מערכת** שלא נטען (מע"מ ריק אינו
  // מע"מ 0%, זו תקלה שחייבת לצעוק). כאן מדובר ב**שדה-קלט אופציונלי**: "הנחה נוספת" שנשארה
  // ריקה פירושה בפירוש "בלי הנחה נוספת" = 0. מה שאסור הוא שטקסט לא-מספרי יהפוך בשקט ל-0 —
  // ולכן ריק מנורמל ל-0 במפורש, וכל שאר הקלטים חייבים להיות מספר תקין.
  const manualRaw = form.manualDiscount
  const manual =
    manualRaw === '' || manualRaw === null || manualRaw === undefined ? 0 : Number(manualRaw)
  if (!Number.isFinite(manual) || manual < 0 || manual > 100) {
    errors.manualDiscount = 'הנחה ידנית חייבת להיות בין 0 ל-100.'
  } else if (Number(form.appliedDiscount) + manual > 100) {
    errors.manualDiscount = 'סכום ההנחות חורג מ-100%.'
  }

  if (!lines?.length) {
    errors.lines = 'יש להוסיף לפחות פריט אחד להצעה.'
    // ⚠️ ‏NaN <= 0 הוא **false** — בדיקת-טווח לבדה הייתה מכשירה כמות לא-מספרית. לכן
    // תקינוּת המספר נבדקת במפורש לפני ההשוואה.
  } else if (lines.some((line) => !line.sku || !isPositiveQty(line.qty))) {
    errors.lines = 'לכל פריט חייבים להיות מוצר וכמות גדולה מ-0.'
  } else if (sumHostessQty(lines) <= 0) {
    // §7.53: אין אירוע בלי דיילות. ה-RPC של האישור חוסם את זה ממילא — חסימה כבר כאן
    // מונעת הצעה שנשמרת ואז מסרבת להפוך לפרויקט, בלי שהמשתמש מבין למה.
    errors.lines = 'הצעה חייבת לכלול לפחות שורת דיילות אחת.'
  }

  return errors
}

// ── טעינת הצעה קיימת למסך העריכה ────────────────────────────────────────────
// ⚠️ applied_customer_discount נקרא **מההצעה** ולא מכרטיס-הלקוח (F12): ההנחה מוקפאת
// ברגע היצירה, ולקוח שהנחתו שונתה מאז אינו משנה הצעה קיימת.
export function quoteToFormState(quote, productsBySku, defaultRatio) {
  const lines = (quote?.quote_services ?? [])
    .slice()
    .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0))
    .map((row) => {
      const product = productsBySku?.[row.sku]
      return {
        key: `line-${row.line_id}`,
        sku: row.sku,
        itemName: product?.item_name ?? row.sku,
        category: product?.category ?? null,
        qty: Number(row.qty),
        unitPrice: Number(row.closing_unit_price),
        unitCost: Number(product?.cost ?? row.closing_unit_cost ?? 0),
        color: row.color ?? '',
        notes: row.notes ?? '',
      }
    })

  return {
    form: {
      customerId: quote?.customer_id ?? null,
      eventName: quote?.event_name ?? '',
      eventDate: quote?.estimated_event_date ?? '',
      location: quote?.estimated_location ?? '',
      startTime: (quote?.estimated_start_time ?? '').slice(0, 5),
      endTime: (quote?.estimated_end_time ?? '').slice(0, 5),
      guests: quote?.estimated_guests ?? '',
      // היחס אינו נשמר בהצעה (F20 — ערך חולף); בעריכה חוזרים לברירת-המחדל מההגדרות.
      ratio: defaultRatio ?? '',
      // כמות-הדיילות **כן** נשמרת, ולכן נטענת מההצעה — גם אם היא נדרסה ידנית ואינה
      // שווה למה שהנוסחה הייתה מחזירה עכשיו.
      hostessCount: quote?.recommended_hostess_count ?? '',
      appliedDiscount: Number(quote?.applied_customer_discount ?? 0),
      manualDiscount: Number(quote?.manual_discount ?? 0),
      notes: quote?.notes ?? '',
    },
    lines,
  }
}

// משך האירוע לתצוגה: הפרש-השעות עם גלגול-חוצה-חצות (+24), זהה לעמודה המחושבת
// estimated_hours ב-DB (LOCAL-2). מוצג בשלמים כשאין שארית — "4 שעות", לא "4.00 שעות".
export function computeEventHours(startTime, endTime) {
  if (!startTime || !endTime) return null
  const toMinutes = (t) => {
    const [h, m] = String(t).split(':').map(Number)
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
  }
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (start === null || end === null) return null
  const diff = end > start ? end - start : end - start + 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

// אירוע שחוצה חצות — רמז-UI בלבד (LOCAL-2), לא שגיאה: אירוע לילה הוא תקין לחלוטין.
export function crossesMidnight(startTime, endTime) {
  if (!startTime || !endTime) return false
  return String(endTime) <= String(startTime)
}

// ── מסך ניהול ההצעות (צעד 3.3) ────────────────────────────────────────────────
// כל מה שכאן פועל על **שורות-DB גולמיות** כפי שהן חוזרות מ-listQuotes() — כלומר
// quotes.* + quote_services(*) + customers(...). ‏listQuotes() אינה מקבלת מסננים
// (סטייה מהבלופרינט, מתועדת ב-api.js): הטאבים, המונים, המסננים והמיון כולם כאן.

// LOCAL-4 (הכרעת-ישי 15/07): "פג בקרוב" = 7 ימים או פחות לתפוגה. זה **לא** אותו מספר
// כמו ימי-התוקף עצמם (פרמטר `ימי_תוקף_הצעה`=30) ולא כמו חלון-האירוע (`ימי_אזהרה_קדם_אירוע`=14).
export const EXPIRING_SOON_DAYS = 7

// שמות-הפרמטרים שמסך-הניהול קורא מ-params. שתי המחרוזות החדשות חייבות להיות זהות-בייט
// לשורות ה-Seed (מיגרציה 20260723112000); המע"מ **אינו נכתב כאן שוב** אלא נשאב מ-pricing.js,
// שהוא ה-SSOT למחרוזת הזו — שכפולה היה מאפשר לשתי העתקות להתפצל בשקט בהקלדה.
export const QUOTE_SCREEN_PARAM_NAMES = {
  vatPercent: PRICING_PARAM_NAMES.VAT_PERCENT,
  validityDays: 'ימי_תוקף_הצעה',
  eventWarningDays: 'ימי_אזהרה_קדם_אירוע',
}

// סיבות-דחייה שאינן "הפסד" ולכן יוצאות מהמכנה של שיעור-האישור (הכרעת-ישי 29/07/2026).
// הצעה שנפתחה בטעות מעולם לא הוצעה ללקוח — ספירתה כהפסד הופכת את שיעור-האישור למדד
// של טעויות-הקלדה. ⚠️ ההחרגה חיה כאן ולא ב-DB: זו שאלת-תצוגה, וה-DB אינו מחשב מדדים.
export const NON_LOSS_REJECTION_REASONS = ['נפתחה בטעות']

// מה שמוצע בתפריט חלון-הדחייה. 'פג תוקף' נגרע: עבודת-הרקע היומית היא זו שכותבת אותו
// (§7.41/§7.42), ובחירה ידנית בו הייתה מייצרת "פג תוקף" להצעה שבפועל לא פגה.
export const MANUAL_REJECTION_REASONS = REJECTION_REASONS.filter((r) => r !== 'פג תוקף')

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ⚠️ ‏Number(null) הוא 0, וגם Number(''). פרמטר-מערכת שלא נטען חייב להיפסל **לפני** ההמרה,
// אחרת "לא נטען" הופך בשקט ל-0 — כלומר "פג היום" או "מע"מ 0%". מספרים אמינים למראה הם
// הכשל המסוכן ביותר במודול הזה. (הבחנה: שדה-קלט אופציונלי שנשאר ריק **כן** מתנרמל ל-0 —
// ר' validateQuoteForm; שם ריק פירושו "בלי הנחה", כאן פירושו "לא ידוע".)
function paramNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// 'YYYY-MM-DD' ⇒ חותמת UTC. עבודה בחלקי-תאריך של UTC (ולא בשעון המקומי) היא מכוונת:
// היא היחידה שנותנת אותו מספר-ימים בכל אזור-זמן, וכך בדיקה שעברה כאן תעבור גם אצל ישי.
function toUtcDayStart(dateLike) {
  if (!dateLike) return null
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return null
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function toIsoDate(utcMs) {
  return new Date(utcMs).toISOString().slice(0, 10)
}

// מספר הימים השלמים מ-todayIso ועד dateLike. שלילי = כבר עבר. null = קלט לא-תקין.
// פנימי בכוונה: המסך אינו סופר ימים בעצמו אלא שואל שאלה עסקית ("פג בקרוב?" / "אירוע קרוב?"),
// ושתי הפונקציות שעונות עליה נמצאות מתחת. ייצוא היה מזמין חישוב-סף מקביל במסך.
function daysUntil(dateLike, todayIso) {
  const target = toUtcDayStart(dateLike)
  const today = toUtcDayStart(todayIso)
  if (target === null || today === null) return null
  return Math.round((target - today) / MS_PER_DAY)
}

// סכום ההצעה כפי שהוא מוצג בשורת-הטבלה. מחושב מ-pricing.js על שורות-ה-DB, ולעולם
// לא נשמר בעמודה — כך שהמסך, ה-PDF וכרטיס-הלקוח לא יכולים להציג שלושה מספרים שונים (F26).
// ⚠️ המע"מ: הצעה מאושרת נושאת vat_rate_snapshot קפוא (§7.51) והוא גובר. הצעה פתוחה
// משתמשת במע"מ החי מ-params. מע"מ שלא נטען כלל ⇒ total null — "ריק אינו 0", וסכום
// בלי מע"מ נראה אמין לגמרי ולכן מסוכן במיוחד.
export function deriveQuoteAmount(quote, defaultVatRate) {
  const applied = Number(quote?.applied_customer_discount) || 0
  const manual = Number(quote?.manual_discount) || 0
  // §7.26/F7: ההנחות מתחברות בחיבור. 5% ו-10% הם 15% — לא 14.5% של שרשור.
  const discountPercent = applied + manual

  const vatRate = paramNumber(quote?.vat_rate_snapshot) ?? paramNumber(defaultVatRate)
  if (vatRate === null) return { total: null, discountPercent }

  const lines = (quote?.quote_services ?? []).map((row) => ({
    qty: row.qty,
    unitPrice: row.closing_unit_price,
  }))
  return { total: computeQuoteTotals(lines, applied, manual, vatRate).total, discountPercent }
}

// "פג בעוד N יום" — F4: השעון נספר מ-updated_at (עריכה = מחיר חדש = 30 יום חדשים),
// ומספר-הימים מגיע מהפרמטר `ימי_תוקף_הצעה` ולא מקבוע בקוד.
// מחזיר null להצעה שאינה in_progress: הצעה סגורה כבר לא פגה, ו"פג בעוד -12 יום" הוא רעש.
// ⚠️ הפרש-מותר של עד יממה מול עבודת-הרקע: היא משווה חותמות-זמן מלאות, כאן משווים תאריכים.
// זה מכוון — המשתמש חושב בימים, לא בשעות.
export function deriveQuoteExpiry(quote, validityDays, todayIso) {
  if (quote?.quote_status !== 'in_progress') return null
  const days = paramNumber(validityDays)
  if (days === null) return null

  const updated = toUtcDayStart(quote?.updated_at)
  if (updated === null) return null

  const expiryMs = updated + days * MS_PER_DAY
  const expiryDate = toIsoDate(expiryMs)
  const daysLeft = daysUntil(expiryDate, todayIso)
  if (daysLeft === null) return null

  return { expiryDate, daysLeft, isExpiringSoon: daysLeft <= EXPIRING_SOON_DAYS }
}

// "אירועים קרובים" — אירוע שמתקיים בתוך חלון-האזהרה (`ימי_אזהרה_קדם_אירוע`=14).
// ⚠️ מדד שונה לחלוטין מ"פג בקרוב": שם מזדקן **המסמך שלנו**, כאן מתקרב **המועד של הלקוח**.
// הצעה יכולה להיות טרייה לגמרי ועדיין דחופה, כי אין עוד זמן לאייש את האירוע.
export function isEventSoon(quote, warningDays, todayIso) {
  const days = paramNumber(warningDays)
  if (days === null) return false
  const left = daysUntil(quote?.estimated_event_date, todayIso)
  return left !== null && left >= 0 && left <= days
}

// שני המדדים שליד כותרת-המסך (הכרעת-ישי 29/07: בדיוק שניים).
// שיעור-האישור מחושב מתוך ה**סגורות בלבד** — הצעה שעדיין בתהליך לא הפסידה ולא ניצחה,
// וספירתה במכנה הייתה מציגה שיעור נמוך-כזב שיורד ככל שנפתחות הצעות חדשות.
export function deriveQuoteMetrics(
  quotes,
  defaultVatRate,
  nonLossReasons = NON_LOSS_REJECTION_REASONS,
) {
  const rows = quotes ?? []
  const open = rows.filter((q) => q.quote_status === 'in_progress')
  const approved = rows.filter((q) => q.quote_status === 'approved')
  const lost = rows.filter(
    (q) => q.quote_status === 'rejected' && !nonLossReasons.includes(q.rejection_reason),
  )

  const openValue = open.reduce(
    (sum, q) => sum + (deriveQuoteAmount(q, defaultVatRate).total ?? 0),
    0,
  )
  const closedCount = approved.length + lost.length

  return {
    openValue,
    openCount: open.length,
    approvedCount: approved.length,
    closedCount,
    // אין סגורות ⇒ null ולא 0%: "0% אישור" על מדגם ריק הוא מספר שקרי, לא מספר נמוך.
    approvalRate: closedCount > 0 ? Math.round((approved.length / closedCount) * 1000) / 10 : null,
  }
}

// פילוח סיבות-הדחייה בלשונית "נדחו" (§7.82). מהשכיח לנדיר; שוויון נשבר לפי סדר
// הרשימה הקנונית, כדי שאותה דאטה תמיד תיתן אותה תצוגה.
export function countRejectionReasons(quotes) {
  const counts = new Map()
  for (const q of quotes ?? []) {
    if (q.quote_status !== 'rejected' || !q.rejection_reason) continue
    counts.set(q.rejection_reason, (counts.get(q.rejection_reason) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        REJECTION_REASONS.indexOf(a.reason) - REJECTION_REASONS.indexOf(b.reason),
    )
}

// חיפוש סלחני: מתעלם מרווחים כפולים ומאותיות-רישיות, ובודק את שם-האירוע ואת שם-הלקוח —
// בדיוק שני הדברים שתיבת-החיפוש מבטיחה במסך ("חיפוש לפי לקוח או שם אירוע").
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesQuoteFilters(quote, filters = {}, ctx = {}) {
  const text = normalize(filters.text)
  if (text) {
    const haystack = [quote?.event_name, quote?.customers?.company_name].map(normalize).join(' | ')
    if (!haystack.includes(text)) return false
  }

  if (filters.customerId != null && quote?.customer_id !== filters.customerId) return false

  const eventDate = quote?.estimated_event_date
  if (filters.eventDateFrom && (!eventDate || eventDate < filters.eventDateFrom)) return false
  if (filters.eventDateTo && (!eventDate || eventDate > filters.eventDateTo)) return false

  if (filters.expiringSoon) {
    const expiry = deriveQuoteExpiry(quote, ctx.validityDays, ctx.todayIso)
    if (!expiry?.isExpiringSoon) return false
  }

  if (filters.eventSoon && !isEventSoon(quote, ctx.eventWarningDays, ctx.todayIso)) return false

  return true
}

// שורת-DB ⇒ ה-view-model ש-quotePdf.jsx מצפה לו. ההמרה חיה כאן ולא בתוך מנוע ה-PDF,
// כדי שהמנוע יישאר טהור מ-schema (§7.12↳: engine עצמאי, מ10 מרים אותו לשרת).
// ⚠️ שם-המוצר אינו נשמר ב-quote_services — רק המק"ט. הוא נשלף מהקטלוג החי, ולכן מוצר
// שנמחק/שונה-שם משנה את המסמך של הצעה ישנה. זו התנהגות מקובלת (הקטלוג הוא המילון),
// אבל מק"ט שאינו בקטלוג נופל חזרה למק"ט עצמו — שורה בלי שם במסמך ללקוח היא מביכה.
export function quoteToPdfModel(quote, productsBySku, defaultVatRate, validityDays) {
  const vatRate = paramNumber(quote?.vat_rate_snapshot) ?? paramNumber(defaultVatRate)
  const days = paramNumber(validityDays)
  const updated = toUtcDayStart(quote?.updated_at)

  return {
    quoteId: quote?.quote_id,
    issueDate: quote?.issue_date,
    // תוקף ההצעה נספר מ-updated_at ולא מ-issue_date (F4) — אותו שעון שהמסך מציג
    // ושעבודת-הרקע פועלת לפיו, אחרת המסמך ללקוח היה נוקב בתאריך אחר מהמערכת.
    validUntil: days !== null && updated !== null ? toIsoDate(updated + days * MS_PER_DAY) : null,
    customer: {
      companyName: quote?.customers?.company_name,
      companyNumber: quote?.customers?.company_number,
      contactName: quote?.customers?.contact_name,
      phone: quote?.customers?.phone,
    },
    event: {
      name: quote?.event_name,
      date: quote?.estimated_event_date,
      location: quote?.estimated_location,
      // ה-DB מחזיר time כ-'HH:MM:SS'; המסמך מציג שעות בלבד.
      startTime: (quote?.estimated_start_time ?? '').slice(0, 5),
      endTime: (quote?.estimated_end_time ?? '').slice(0, 5),
    },
    lines: (quote?.quote_services ?? [])
      .slice()
      .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0))
      .map((row) => ({
        sku: row.sku,
        itemName: productsBySku?.[row.sku]?.item_name ?? row.sku,
        qty: Number(row.qty),
        unitPrice: Number(row.closing_unit_price),
        color: row.color ?? '',
        notes: row.notes ?? '',
      })),
    appliedCustomerDiscount: Number(quote?.applied_customer_discount) || 0,
    manualDiscount: Number(quote?.manual_discount) || 0,
    vatRate,
    notes: quote?.notes ?? '',
  }
}

// שלושת המיונים שהוכרעו (29/07). 'expiry' הוא ברירת-המחדל: הצעה פגה בדיוק
// `ימי_תוקף_הצעה` אחרי updated_at, ולכן "הקרוב לפוג ראשון" הוא בדיוק updated_at עולה —
// אותו סדר לכל הסטטוסים, בלי לוגיקה נפרדת להצעות סגורות (שאצלן זה "הישן ביותר ראשון").
// ⚠️ עותק — לא ממיין את המערך המקורי, כי הוא מגיע היישר מה-state של המסך.
export function sortQuotes(quotes, sortKey, ctx = {}) {
  const rows = [...(quotes ?? [])]
  const byAmount = (q) => deriveQuoteAmount(q, ctx.defaultVatRate).total ?? 0

  switch (sortKey) {
    case 'amount':
      return rows.sort((a, b) => byAmount(b) - byAmount(a))
    case 'eventDate':
      return rows.sort((a, b) =>
        String(a.estimated_event_date ?? '').localeCompare(String(b.estimated_event_date ?? '')),
      )
    default:
      return rows.sort((a, b) =>
        String(a.updated_at ?? '').localeCompare(String(b.updated_at ?? '')),
      )
  }
}
