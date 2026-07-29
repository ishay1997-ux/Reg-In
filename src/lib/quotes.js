// לוגיקה עסקית של מודול 3 שאיננה חישוב-כסף (הכסף חי ב-src/lib/pricing.js — כלל 14).
// כאן: תוויות מחזור-החיים, כללי-הטופס, המרה בין צורת-המסך לצורת-ה-DB, ורווחיות.
// טהור לחלוטין — בלי Supabase ובלי שעון (התאריך "היום" מוזרם פנימה) — כדי שהבדיקות
// יוכיחו את הכללים ולא את הסביבה.

import { computeLineTotal, recommendHostessCount } from '@/lib/pricing'

// quotes.quote_status — שלושת הערכים של CHECK quotes_quote_status_check.
export const QUOTE_STATUS_LABELS = {
  in_progress: 'בתהליך',
  approved: 'מאושרת',
  rejected: 'נדחתה',
}

// quotes.rejection_reason — 7 הערכים של CHECK quotes_rejection_reason_check (§7.82/F2).
// 'פג תוקף' נכתב על-ידי עבודת-הרקע היומית ואינו נבחר ידנית במסך הדחייה.
export const REJECTION_REASONS = [
  'מחיר',
  'חוסר זמינות/לו"ז',
  'נבחר מתחרה',
  'תקציב לקוח',
  'האירוע בוטל אצל הלקוח',
  'פג תוקף',
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
