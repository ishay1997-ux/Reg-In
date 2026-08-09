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
// מנוע-המיילים המשותף (כלל 14 — הלוגיקה שאינה ייחודית להצעות-מחיר חיה שם פעם אחת,
// ומודולים 4/8/11 יצרכו את אותו קוד ואת אותן בדיקות).
import { buildEmailPayload, fillEmailTemplate, findUnknownPlaceholders } from '@/lib/email'

// quotes.quote_status — שלושת הערכים של CHECK quotes_quote_status_check.
export const QUOTE_STATUS_LABELS = {
  in_progress: 'בתהליך',
  approved: 'מאושרת',
  rejected: 'נדחתה',
}

// ארבע פעולות-השורה, זהות במסך-הניהול (QuotesPage) ובעמוד-הלקוח (CustomerDetailsPage) —
// שני מסכים שמציגים את אותה שורת-הצעה עם אותן פעולות. אוחדו כאן 31/07/2026 (סבב-ניקוי E)
// אחרי שהיו מוקלדות פעמיים.
// 🧨 **המחרוזות האלה הן חוזה E2E** (`src/CLAUDE.md`): הבדיקות מאתרות את הכפתורים לפי
// תכונת ה-`title`. שינוי-נוסח כאן אינו קוסמטי — הוא שובר בדיקות בשני מסכים בבת-אחת.
// ⚠️ **רק המחרוזות אוחדו.** ההחלטה שלא לחלץ רכיב-עטיפה משותף לשני המסכים נבדקה שוב
// ואומתה כנכונה (`module-3.md` §9) — הם חולקים תוויות, לא פריסה.
export const QUOTE_ACTION_LABELS = {
  view: 'צפייה במסמך',
  edit: 'עריכת ההצעה',
  approve: 'אישור ההצעה',
  reject: 'דחיית ההצעה',
}

// שני הטוסטים שאחרי הפעולה — גם הם היו כפולים בין שני המסכים.
// האישור נושא את שם-האירוע כי הוא מאשר **מה בדיוק** קרה: הצעה הפכה לפרויקט חי (§7.49).
export const QUOTE_REJECTED_TOAST = 'ההצעה נדחתה.'

export function quoteApprovedToast(eventName) {
  return `ההצעה אושרה ונפתח פרויקט חדש עבור "${eventName}".`
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
// לפני האישור העלות עדיין לא קפואה, ולכן מחושבת מהעלות החיה — מאז סבב G (31/07) היא יושבת
// ב-`product_costs` ולא ב-`products` (§7.83↳), ומגיעה לכאן שטוחה כ-`line.unitCost`. ברגע
// האישור ה-RPC מקפיא אותה ב-closing_unit_cost. לכן זו **הערכה** ולא מספר סופי, וכך גם מוצגת.
// ⚠️ מי שאין לו הרשאת-עלות מקבל `null` מהצירוף — והוא ממילא אינו רואה את הפאנל (הוא נשען
// על `canEdit` על 'הצעות מחיר', בדיוק קבוצת-הקוראים של הטבלה החדשה).
// ⚠️ **עלות לא-ידועה מחזירה `null`, לא 0** (הכרעת-ישי 01/08/2026, סבב-התיקון פריט 2).
// ‏`flattenProductCost` מקפיד להחזיר `cost: null` כשאין הרשאת-עלות או כשלמוצר אין שורה
// ב-`product_costs` — ו-`?? 0` כאן היה מבטל את ההקפדה הזו ואומר למסך "המוצר לא עולה
// כלום": רווח = **כל** ההכנסה, שיעור 100%, בלי שום שגיאה. שורה **בלי מק"ט** (שורה חדשה
// שטרם נבחר בה מוצר) אינה "לא ידועה" — היא פשוט לא תורמת, בדיוק כמו שאינה תורמת להכנסה.
function hasUnknownCost(line) {
  return Boolean(line?.sku) && (line.unitCost === null || line.unitCost === undefined)
}

export function computeLinesCost(lines) {
  const list = lines ?? []
  if (list.some(hasUnknownCost)) return null
  return list.reduce((sum, line) => sum + computeLineTotal(line?.qty, line?.unitCost), 0)
}

// שמות המוצרים שאין להם עלות ידועה. המסך מציג אותם בהודעה — מקפים בלי לומר **איזה**
// מוצר אשם משאירים את המנכ"ל בלי דרך לתקן. נופל למק"ט כשאין שם (מוצר שנעלם מהקטלוג).
export function linesMissingCost(lines) {
  return (lines ?? []).filter(hasUnknownCost).map((line) => line.itemName || line.sku)
}

// רווח גולמי מחושב מול הסכום **לפני מע"מ** — המע"מ אינו הכנסה של החברה אלא כסף שעובר
// לרשויות, וכלילתו הייתה מנפחת את שיעור-הרווח בכ-18% מלאכותיים.
// ⚠️ ‏`cost === null` ⇒ **שלושת השדות null**, ולא רווחיות חלקית (הכרעת-ישי 01/08/2026):
// רווח שחושב מעלות חלקית הוא מספר שקרי בדיוק כמו "0% רווח" על הצעה ריקה. אותה דוקטרינה
// כמו `deriveQuoteMetrics.openValue` שמחזיר null כשהמע"מ אינו ידוע.
export function deriveProfitability(preVat, cost) {
  if (cost === null || cost === undefined) {
    return { cost: null, grossProfit: null, marginPercent: null }
  }
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

// ── השוואת-שינוי ל"עדכן ושלח" (הכרעת-ישי 01/08/2026) ────────────────────────
// **הבעיה:** ל-`handleSave` לא הייתה בדיקת-שינוי, ולכן לחיצה על "עדכן ושלח" בלי לגעת בכלום
// הריצה `update` מלא — וטריגר `moddatetime` הקפיץ את `updated_at`. **והתפוגה נגזרת מ-
// `updated_at`** ⇒ הצעה שנותרו לה יומיים חזרה בשקט ל-30 יום. (הרציונל המקורי, `quotes.js`
// למטה: "עריכה = מחיר חדש = 30 יום חדשים" — כלומר השעון מתחדש בגלל **המחיר**. לא נגעת
// במחיר ⇒ אין עילה לשעון חדש.)
//
// 🔴 **כיוון-הטעות אינו סימטרי, וזה מה שמכתיב את כל המימוש כאן.** טעות לכיוון "כן השתנה"
// עולה שמירה מיותרת — בדיוק מה שקורה היום ממילא. טעות לכיוון "לא השתנה" **בולעת עבודה
// אמיתית של המשתמש.** לכן: **כל ספק ⇒ "השתנה"** — ערך שלא ניתן לפרסר, מבנה לא-צפוי,
// צילום-מצב חסר, או חריגה כלשהי. אין ולו מסלול-ספק אחד שמוביל ל"לא השתנה".
//
// ⚠️ משווים **טופס מול צילום-הטופס שנטען**, ולא טופס מול שורת-DB: שני הצדדים עוברים דרך
// אותה `quoteToFormState`, ולכן אין אסימטריית-המרה. השוואה מול ה-DB הייתה מחזירה בדיוק את
// הפערים ('10:00:00' מול '10:00', null מול '') שהנרמול כאן קיים כדי לנטרל.

// זורקת על ערך שאינו מספר תקין — הקורא תופס והופך ל"השתנה". ריק נשאר '' ולא 0, כדי
// ששדה שרוקן ייחשב שינוי (הכיוון הבטוח) ולא ישווה בטעות ל-0 השמור.
function numOrEmpty(value) {
  if (value === '' || value === null || value === undefined) return ''
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error('unparseable number')
  return n
}

// ⚠️ **מה מוחרג במכוון:** `key` (מזהה-רינדור בלבד) · `itemName`/`category`/`unitCost` —
// נגזרים מהקטלוג ולא נערכים ע"י המשתמש; אילו נכללו, שינוי-מחירון בין שתי טעינות היה
// נספר כ"המשתמש ערך". ‏`unitPrice` **כן** נכלל — הוא מה שנשמר כ-`closing_unit_price`.
function normalizeQuoteForCompare(form, lines) {
  return JSON.stringify({
    customerId: form.customerId ?? null,
    eventName: String(form.eventName ?? '').trim(),
    eventDate: String(form.eventDate ?? '').trim(),
    location: String(form.location ?? '').trim(),
    // '10:00:00' מה-DB מול '10:00' מהטופס — אותו רגע, ייצוג אחר.
    startTime: String(form.startTime ?? '').slice(0, 5),
    endTime: String(form.endTime ?? '').slice(0, 5),
    guests: numOrEmpty(form.guests),
    ratio: numOrEmpty(form.ratio),
    hostessCount: numOrEmpty(form.hostessCount),
    appliedDiscount: numOrEmpty(form.appliedDiscount),
    manualDiscount: numOrEmpty(form.manualDiscount),
    notes: String(form.notes ?? '').trim(),
    // סדר-השורות משמעותי: אין ממשק לשינוי-סדר, ולכן סדר שונה = הוספה/מחיקה = שינוי.
    lines: lines.map((line) => [
      String(line.sku ?? ''),
      numOrEmpty(line.qty),
      numOrEmpty(line.unitPrice),
      String(line.color ?? ''),
      String(line.notes ?? '').trim(),
    ]),
  })
}

// ⚠️ **מקור-רעש ידוע ומקובל:** `hostessCount` נדרס אוטומטית מ-`recommendHostessCount` בכל
// שינוי אורחים/יחס. אם פרמטר `יחס_אורחים_לדיילת` השתנה מאז השמירה, הטופס עלול להיפתח עם
// ערך שונה מהשמור ⇒ "השתנה" בלי שהמשתמש נגע. התוצאה היא **שמירה מיותרת בלבד** — הכיוון
// הבטוח — ולכן לא מנוטרל במכוון (הכרעת-מנהל 01/08/2026).
// ⚠️ הנוסח אומר **שני** דברים, ושניהם נדרשים כדי שההחלטה תהיה מיודעת: שלא בוצע שינוי,
// ו**שהתוקף לא יתאפס**. הכרעת-ישי 01/08/2026 (אחרי שהועלה שהניסוח ההפוך — "השליחה מאפסת
// את התוקף" — היה נעשה **שקרי** ברגע שמדלגים על השמירה: התוקף נגזר מ-`updated_at`,
// והשליחה אינה כותבת ל-`quotes` כלל).
export const NO_CHANGES_SEND_CONFIRM =
  'לא בוצע שינוי בהצעה. היא תישלח שוב כפי שהיא, והתוקף לא יתאפס. להמשיך לשליחה?'

export function hasQuoteChanged(form, lines, initialForm, initialLines) {
  if (!form || !initialForm) return true
  if (!Array.isArray(lines) || !Array.isArray(initialLines)) return true
  try {
    return (
      normalizeQuoteForCompare(form, lines) !== normalizeQuoteForCompare(initialForm, initialLines)
    )
  } catch {
    // ערך שלא ניתן לנרמל — לא מנחשים. "השתנה" עולה שמירה, "לא השתנה" עולה עבודה.
    return true
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

// line_number ו-closing_unit_cost נקבעים בשרת (ordinality + `product_costs.cost`) — שליחתם מכאן
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

// ── הודעות-הכשל של המסד ⇒ עברית שאומרת מה לעשות (סבב-תיקונים D, 31/07/2026) ──
//
// **הבעיה שזה פותר:** `toError` (api.js) בונה Error עם הודעת-fallback אחת ומשאיר את הודעת
// המסד ב-`e.cause` — שאיש אינו מרנדר. כלומר שישה מסלולי-כשל שונים באישור/עריכה הגיעו
// למנהלת-הפרויקטים כ"אישור ההצעה נכשל." אחד, ואי-אפשר היה להבין ממנו מה לעשות.
//
// ⚠️ **חוזה-מחרוזות מול המסד — הצד הזה של החוזה.** ההבחנה נשענת על תחילית ההודעה העברית
// שה-RAISE במסד פולט, כי ה-SQLSTATE אינו מספיק: הוא מבחין **שלוש** מחלקות בלבד —
// `42501` (הרשאה, אתר אחד) · `P0002` (הצעה לא נמצאה, 2 אתרים) · `P0001` (**9 אתרים**).
// כל ההבחנה בתוך P0001 היא על הטקסט.
// 🔗 **המקור הפעיל — נמדד חי 31/07/2026 מ-`pg_get_functiondef`, לא נקרא מקובץ:**
// ‏`approve_quote_and_create_project` (7 אתרים) · `create_quote` (1) · `replace_quote_lines` (3)
// חיים כולם ב-**`20260731155511_round_g_db_hardening.sql`** (סבב G שכתב את שלושתם מחדש);
// טריגר-הנעילה `enforce_quote_in_progress_lock` (1) חי ב-`20260723115000_module3_lock_and_conversion_rpc.sql`.
// ⛔ **מיגרציה עתידית שתשכתב ניסוח של RAISE חייבת לעדכן את התחיליות כאן** — אחרת המיפוי חוזר
// בשקט ל-fallback ואף בדיקה לא תיפול. ⚠️ **וההערה הזו עצמה כבר התיישנה פעם אחת:** עד 31/07
// היא הפנתה ל-`20260731085335` ודיברה על 11 אתרי-P0001 — שניהם נכונים היו לסבב A בבוקר,
// ושניהם שגו אחרי סבב G. **הפניה לקובץ-מיגרציה מתיישנת; מדידה מהמסד לא.**
// שורת-האזהרה המקבילה בצד-המסד: `docs/db_roadmap.md` §6 (quotes).
const QUOTE_STATUS_IN_MESSAGE = {
  approved: 'אושרה',
  rejected: 'נדחתה',
  in_progress: 'הוחזרה לטיפול',
}

// התחיליות מועתקות מילולית מה-RAISE. נבדקות כ-startsWith ולא כשוויון, כי חלקן נושאות
// ערך מוזרק (`%`) בסופן — וערך-enum באנגלית בתוך מחרוזת עברית הוא בדיוק מה שאסור להציג.
const SERVER_MESSAGE_RULES = [
  {
    prefix: 'ההצעה כבר טופלה (סטטוס ',
    // הסטטוס נחלץ מהמחרוזת הגולמית ומתורגם — "(סטטוס approved)" על המסך הוא דליפה של
    // ערך-DB למשתמשת. לא נמצא סטטוס מוכר ⇒ נוסח כללי, לעולם לא המחרוזת הגולמית.
    build: (raw) => {
      const match = /\(סטטוס ([a-z_]+)\)/.exec(raw)
      const label = QUOTE_STATUS_IN_MESSAGE[match?.[1]]
      return label
        ? `ההצעה כבר ${label} בינתיים — יש לרענן את המסך כדי לראות את מצבה העדכני.`
        : 'ההצעה כבר טופלה בינתיים — יש לרענן את המסך כדי לראות את מצבה העדכני.'
    },
  },
  {
    prefix: 'לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר',
    build: () => 'תאריך האירוע של ההצעה כבר עבר — יש לעדכן את התאריך בעריכת ההצעה לפני האישור.',
  },
  {
    prefix: 'לא ניתן לאשר הצעה ללא שורות-דיילות',
    build: () =>
      'להצעה אין שורת דיילות — יש להוסיף שורת דיילות בעריכת ההצעה לפני האישור (אין אירוע בלי דיילות).',
  },
  {
    prefix: 'לא ניתן לערוך הצעה שאינה בתהליך',
    build: () => 'ההצעה כבר אינה בסטטוס "בתהליך" ולכן אינה ניתנת לעריכה — יש לרענן את המסך.',
  },
  {
    prefix: 'הצעה נעולה:',
    build: () =>
      'ההצעה נעולה לשינויים — רק הצעה בסטטוס "בתהליך" ניתנת לעריכה או לדחייה. יש לרענן את המסך.',
  },
  // שתי הודעות-המע"מ כבר עברית נקייה עם שם-הפרמטר המדויק לחיפוש בהגדרות (סבב A) —
  // עוברות כמו-שהן. זה **כן** מיפוי מפורש ולא "נפילה ל-else": כך שינוי ניסוח שם ייתפס כאן.
  { prefix: 'שיעור המע"מ אינו מוגדר בהגדרות המערכת', build: (raw) => raw },
  { prefix: 'שיעור המע"מ שבהגדרות המערכת אינו חוקי', build: (raw) => raw },
  // סבב G (31/07): `products.cost` עבר ל-`product_costs`, ומק"ט בלי שורת-עלות היה נוחת
  // כ-23502 גולמי על `closing_unit_cost` (NOT NULL). ה-RPCs זורקים במקום זה הודעה שנוקבת
  // ב**שם-המוצר** (לא במק"ט — §7.34: המק"ט אינו מוצג במסך), והיא עוברת כמות-שהיא.
  { prefix: 'לא מוגדרת עלות למוצר', build: (raw) => raw },
]

// מחזירה ניסוח-מסך לשגיאת-מסד מוכרת, או `null` כשהיא אינה מוכרת — ואז הקורא נשאר עם
// הודעת-ה-fallback שלו. **null ולא ניחוש:** מחרוזת-מסד שלא מופתה עלולה לשאת ערכי-enum,
// שמות-עמודות או אנגלית, וכולם גרועים יותר מ"אישור ההצעה נכשל." הכללי.
export function quoteServerErrorMessage(error) {
  const code = error?.code
  if (code === '42501') {
    return 'אין לך הרשאת עריכה על "הצעות מחיר" — יש לפנות למנכ"ל להרחבת ההרשאה.'
  }
  if (code === 'P0002') {
    return 'ההצעה לא נמצאה — ייתכן שנמחקה או שאין לך הרשאה אליה. יש לרענן את רשימת ההצעות.'
  }

  const raw = typeof error?.message === 'string' ? error.message.trim() : ''
  if (!raw) return null
  return SERVER_MESSAGE_RULES.find((rule) => raw.startsWith(rule.prefix))?.build(raw) ?? null
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
        // ⚠️ **בלי `?? 0`** — עלות שאינה ידועה (אין הרשאה / אין שורת-עלות) נשארת null
        // ומגיעה ככזו לפאנל-הרווחיות. ‏0 כאן היה מציג רווח = כל ההכנסה, בלי שגיאה.
        unitCost: paramNumber(product?.cost ?? row.closing_unit_cost),
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
  // גוף מייל-ההצעה (צעד 3.4). נטען יחד עם השאר כי `getQuoteScreenParams` שולפת
  // בדיוק את הערכים שכאן — הוספת שם כאן היא כל מה שנדרש כדי שהמסך יקבל אותו.
  quoteEmailTemplate: 'תבנית_מייל_הצעת_מחיר',
}

// סיבות-דחייה שאינן "הפסד" ולכן יוצאות מהמכנה של שיעור-האישור (הכרעת-ישי 29/07/2026).
// הצעה שנפתחה בטעות מעולם לא הוצעה ללקוח — ספירתה כהפסד הופכת את שיעור-האישור למדד
// של טעויות-הקלדה. ⚠️ ההחרגה חיה כאן ולא ב-DB: זו שאלת-תצוגה, וה-DB אינו מחשב מדדים.
export const NON_LOSS_REJECTION_REASONS = ['נפתחה בטעות']

// מה שמוצע בתפריט חלון-הדחייה. 'פג תוקף' נגרע: עבודת-הרקע היומית היא זו שכותבת אותו
// (§7.41/§7.42), ובחירה ידנית בו הייתה מייצרת "פג תוקף" להצעה שבפועל לא פגה.
export const MANUAL_REJECTION_REASONS = REJECTION_REASONS.filter((r) => r !== 'פג תוקף')

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ההמרה המשותפת של "לא ידוע ≠ אפס" בקובץ הזה — משמשת גם פרמטרי-מערכת וגם **עלות-רכש**
// (‏01/08/2026: אוחדה במקום עותק שני זהה, `sonarjs/no-identical-functions` תפס).
// ⚠️ ‏Number(null) הוא 0, וגם Number(''). ערך שלא נטען חייב להיפסל **לפני** ההמרה,
// אחרת "לא נטען" הופך בשקט ל-0 — כלומר "פג היום", "מע"מ 0%", או "המוצר לא עולה כלום".
// מספרים אמינים למראה הם הכשל המסוכן ביותר במודול הזה. (הבחנה: שדה-קלט אופציונלי
// שנשאר ריק **כן** מתנרמל ל-0 — ר' validateQuoteForm; שם ריק פירושו "בלי הנחה".)
function paramNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// שורת-האזהרה שמסך-ההצעות מציג כששורת-פרמטר תמחור חסרה מ-`params` (הכרעת-ישי 31/07/2026).
// ⚠️ **למה בכלל צריך אותה:** שני הפרמטרים האלה נכשלים בשקט כשהם חסרים, כל אחד בדרכו —
// המע"מ חוסם הפקת מסמך (המשתמש כן יראה זאת בחלון), אבל `ימי_תוקף_הצעה` חסר מפיל את
// **עבודת-הלילה** שמסמנת הצעות שפג תוקפן. העבודה זורקת שגיאה ורצה נכשלת, אך היומן
// שלה (`cron.job_run_details`) הוא מקום שאיש אינו פותח — ובלי סימן במסך, "נכשל ברעש"
// שקול ל"נכשל בשקט". כאן זה נאמר במקום שבו המשתמש ממילא נמצא.
// מחזירה '' כשהכול תקין, כדי שהקורא יוכל לכתוב `{message && <banner/>}`.
export function missingPricingParamsMessage({ vatRate, validityDays } = {}) {
  const missing = []
  if (paramNumber(vatRate) === null) missing.push(QUOTE_SCREEN_PARAM_NAMES.vatPercent)
  if (paramNumber(validityDays) === null) missing.push(QUOTE_SCREEN_PARAM_NAMES.validityDays)
  if (missing.length === 0) return ''

  // ההשלכה נאמרת פר-פרמטר ולא כמשפט כללי: המשתמש צריך לדעת מה **לא עובד עכשיו**,
  // לא רק שחסרה שורה. שם-הפרמטר מודפס כלשונו — זה מה שמחפשים ב-Table Editor.
  const effects = []
  if (missing.includes(QUOTE_SCREEN_PARAM_NAMES.vatPercent)) {
    effects.push('לא ניתן להפיק מסמכים ללקוחות')
  }
  if (missing.includes(QUOTE_SCREEN_PARAM_NAMES.validityDays)) {
    effects.push('הצעות אינן פגות אוטומטית')
  }
  // התאמת מין ומספר — תווית שאומרת "השורות" על שורה אחת נקראת כמו טקסט מתורגם.
  const label = missing.length === 1 ? 'חסר פרמטר מערכת' : 'חסרים פרמטרי מערכת'
  const action = missing.length === 1 ? 'יש להוסיף את השורה' : 'יש להוסיף את השורות'
  return `${label}: ${missing.join(', ')} — ${effects.join(', ')}. ${action} בהגדרות המערכת.`
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

  // ⚠️ **"ריק אינו 0" חל גם על אריח-מדד** (תוקן 31/07/2026, סבב-התיקונים A). קודם עמד כאן
  // ‏`?? 0`, ולכן מע"מ שלא נטען הציג **"שווי הצעות פתוחות: 0 ₪"** — מספר אמין-למראה ושקרי,
  // ובדיוק מתחת לשורת-האזהרה שאומרת שאי-אפשר לתמחר. סכום שאינו ידוע מוצג "—"
  // (‏`formatShekelWhole(null)`), אותה מוסכמה כמו `approvalRate` שמתחת.
  const openTotals = open.map((q) => deriveQuoteAmount(q, defaultVatRate).total)
  const openValue = openTotals.some((t) => t === null)
    ? null
    : openTotals.reduce((sum, t) => sum + t, 0)
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

// ── שליחת ההצעה במייל (צעד 3.4) ─────────────────────────────────────────────
// גוף המייל **אינו כתוב בקוד** — הוא חי בפרמטר `תבנית_מייל_הצעת_מחיר` ב-params.
// למה: ניסוח מול לקוח משתנה בלי לגעת בקוד (וכבר השתנה — מיגרציה 7 הסירה את
// "והתנעת הפרויקט" בהכרעת-ישי), וזה גם אותו ערך שמודול 10 יצרוך בשליחה האוטומטית
// (🚧 מ10 ב-PROJECT_MASTER §6) — כלומר מקור-אמת אחד לשני המימושים.

// ── שני נוסחים שישבו במנוע הגנרי עד 09/08/2026, ועברו לכאן בפזה 0 של מודול 4 ──────
// שניהם מדברים על **הצעת-מחיר** בעוד `src/lib/email.js` משרת גם זימון-משמרת, חשבונית
// ודוח-שכר. "אין לך הרשאה לשלוח הצעות" הוא פשוט לא-נכון למנהלת הגיוס, ו"הורד את הקובץ
// ושלח ידנית" מפנה לקובץ שלזימון-משמרת אין. המנוע מחזיק ברירות-מחדל גנריות; הנוסח
// הספציפי הוא ידיעה של המודול השולח, ולכן הוא כאן — בדיוק כמו ה-placeholders והנושא.
export const QUOTE_SEND_NO_PERMISSION_REASON = 'אין לך הרשאה לשלוח הצעות'
export const QUOTE_SEND_FAILED_MESSAGE =
  'ההצעה לא נשלחה. לחץ "שליחת ההצעה במייל" שוב, או הורד את הקובץ ושלח ידנית.'

// ארבעת השדות שתבנית `תבנית_מייל_הצעת_מחיר` מכירה. **רשימה אחת** שממנה נגזרים גם המילוי
// וגם בדיקת-השדות-הלא-מוכרים — שתי רשימות היו מתפצלות בשקט בדיוק ברגע שמוסיפים שדה.
const QUOTE_EMAIL_PLACEHOLDERS = ['[שם_איש_קשר]', '[שם_פרויקט]', '[תאריך_אירוע]', '[חתימת_שולח]']

// שדות שהתבנית שבמסד מכילה והקוד אינו מכיר. מוחזרים בשמם כדי שהמסך יוכל לומר **מה**
// לתקן. ⚠️ הבדיקה על התבנית ולא על התוצאה — ר' ההסבר ב-`src/lib/email.js`.
export function findUnknownQuoteEmailPlaceholders(template) {
  return findUnknownPlaceholders(
    template,
    Object.fromEntries(QUOTE_EMAIL_PLACEHOLDERS.map((token) => [token, ''])),
  )
}

// ⚠️ שמות ה-placeholders הם **חוזה מול הערך שבמסד**. שינוי שם בתבנית בלי שינוי כאן
// מותיר סוגריים מרובעים בגוף שנשלח ללקוח — ולכן המנוע **מסרב לשלוח** במקרה כזה.
// המנגנון עצמו (איך מחליפים, מה קורה בתבנית חסרה) חי ב-`src/lib/email.js` ומשותף לכל
// המודולים; כאן רק **אילו** placeholders יש לתבנית של הצעת-מחיר.
export function fillQuoteEmailTemplate(template, values) {
  // שם-הנמען הוא תנאי-סף ולא "נחמד-שיהיה": "שלום ," הוא פתיחה שבורה במסמך שיוצא
  // ללקוח. עדיף לא לשלוח בכלל מלשלוח מייל שנראה מקולקל, ולכן ריק ⇒ ריק.
  const recipientName = values?.contactName?.trim() || values?.companyName?.trim() || ''
  if (!recipientName) return ''

  return fillEmailTemplate(template, {
    '[שם_איש_קשר]': recipientName,
    '[שם_פרויקט]': values?.eventName ?? '',
    // התאריך מגיע **מפורמט מבחוץ** (`formatDate` של quotePdf) ולא מעוצב כאן, כדי
    // שהמייל והמסמך המצורף יציגו את אותו תאריך באותו פורמט בדיוק.
    '[תאריך_אירוע]': values?.eventDate ?? '',
    // מיגרציה 9: החתימה מוזרקת כבלוק אחד שהקוד הרכיב (ר' buildSenderSignature).
    '[חתימת_שולח]': buildSenderSignature(values?.sender),
  })
}

// חתימת השולח בגוף המייל (הכרעת-ישי 30/07/2026, מיגרציה 9 — ה-placeholder `[חתימת_שולח]`).
//
// למה **מי ששלח** ולא פרטים קבועים של מנהלת-הפרויקטים: הרשאת-שליחה על 'הצעות מחיר' יש גם
// למנהלת-פרויקטים וגם למנכ"ל (אומת מול המסד 30/07). פרטים קבועים היו שולחים את הלקוח
// לאדם שלא מכיר את השיחה; המערכת ממילא יודעת מי לחץ, אז היא חותמת בשמו.
//
// ⚠️ ההרכבה כאן ולא בתבנית **בגלל שורת-הטלפון**: לשני משתמשי-מנכ"ל אין טלפון במסד, ומייל
// שכתוב בו "טלפון:" בלי מספר גרוע ממייל בלי טלפון. תבנית-טקסט אינה יכולה להשמיט שורה
// בתנאי — לכן יש placeholder **אחד** שהקוד מרכיב, ולא שלושה.
// ⚠️ בלי שם — מחזיר ריק: חתימה בלי שם היא חתימה שבורה, ועדיף בלעדיה.
export function buildSenderSignature(sender) {
  const name = sender?.fullName?.trim()
  if (!name) return ''

  const role = sender?.roleName?.trim()
  const lines = [role ? `${name} | ${role}, REG-IN` : `${name} | REG-IN`]
  const phone = sender?.phone?.trim()
  if (phone) lines.push(`טלפון: ${phone}`)
  const email = sender?.email?.trim()
  if (email) lines.push(`מייל: ${email}`)
  return lines.join('\n')
}

const QUOTE_EMAIL_SUBJECT = 'הצעת מחיר מ-REG-IN'

// הנושא אינו חלק מהתבנית שבמסד (היא מגדירה גוף בלבד) — ולכן נוסח כאן, באישור-ישי 30/07.
export function quoteEmailSubject(quote) {
  const eventName = quote?.event_name?.trim()
  return eventName ? `${QUOTE_EMAIL_SUBJECT} — ${eventName}` : QUOTE_EMAIL_SUBJECT
}

// הכרעת-ישי 29/07: שליחה רק מהצעה **בתהליך**. הצעה שאושרה או נדחתה — המסמך שלה
// כבר נשלח והוכרע, ושליחה חוזרת ממנה מבלבלת את הלקוח יותר משהיא עוזרת.
export function isQuoteSendable(quote) {
  return quote?.quote_status === 'in_progress'
}

// ⚠️ המנוע (חוזה-השדות, תקרת-הגודל, סיבת-ההשבתה, שלושת מצבי-התוצאה) חי ב-`src/lib/email.js`
// ומשותף לכל המודולים ששולחים מייל. כאן נשאר **רק** מה שייחודי להצעת-מחיר: מי הנמען
// (איש-הקשר הראשי, §6 מ3) ואילו שדות ממלאים את התבנית.
export function buildQuoteEmailPayload({
  quote,
  template,
  eventDate,
  filename,
  pdfBase64,
  sender,
} = {}) {
  return buildEmailPayload({
    // איש-הקשר הראשי בלבד (§6 מ3, אושר מחדש 30/07 — `customer_contacts` ריקה בפועל).
    to: quote?.customers?.email,
    subject: quoteEmailSubject(quote),
    body: fillQuoteEmailTemplate(template, {
      contactName: quote?.customers?.contact_name,
      companyName: quote?.customers?.company_name,
      eventName: quote?.event_name,
      eventDate,
      // מי ששלח — מגיע מהמשתמש המחובר (AuthContext), לא מהמסד בשאילתה נוספת.
      sender,
    }),
    filename,
    attachmentBase64: pdfBase64,
  })
}

// ── תצוגת המסמך ממסך-הבנייה (צעד 3.4) ───────────────────────────────────────
// המסמך נבנה ממה שעל המסך **עכשיו** ולא מהשורה השמורה. למה זה חשוב: המשתמש פותח
// הצעה לעריכה, משנה כמות, ולוחץ "צפייה במסמך" — מסמך שמציג את הגרסה השמורה היה
// מראה לו מספר אחר ממה שהוא רואה, וזה בדיוק מצב שבו נשלח ללקוח מסמך שגוי.
// שלושת השדות שאין להם מקור בטופס (מספר ההצעה, תאריך ההנפקה, updated_at לחישוב
// התוקף) מגיעים מהשורה השמורה — ולכן הכפתור מוצג רק במצב עריכה, שבו הם קיימים.
// ⚠️ `customer` מוזרם מבחוץ: `getQuote()` אינה מצרפת את `customers`, ובלעדיו
// המסמך היה יוצא בלי "לכבוד" ובלי ח"פ.
export function formToPreviewQuote({ form, lines, savedQuote, customer } = {}) {
  return {
    ...buildQuoteHeader(form ?? {}),
    quote_id: savedQuote?.quote_id,
    issue_date: savedQuote?.issue_date,
    updated_at: savedQuote?.updated_at,
    vat_rate_snapshot: savedQuote?.vat_rate_snapshot ?? null,
    customers: customer ?? savedQuote?.customers ?? null,
    // המספור כאן הוא **תצוגתי בלבד** — המספור המחייב נקבע בשרת ב-RPC (with ordinality).
    quote_services: buildQuoteLines(lines).map((line, index) => ({
      ...line,
      line_number: index + 1,
    })),
  }
}

// תוויות-כמות לרצועת-ההדגשים בעמוד הלקוח. ⚠️ **המספר 1 אינו מקבל את אותו ניסוח כמו 3**:
// עד סקירת 3.7 הוצג "מ-1 הצעות שאושרו" ו-"1 ממתינות להחלטה" — עברית שבורה בדיוק במקרה
// הנפוץ ביותר (לקוח עם עסקה אחת). הכלל כאן חי ב-lib ולא ב-JSX כדי שכל מסך עתידי שיציג
// ספירת-הצעות יקבל את אותה עברית — הצורה הזו כבר תשוכפל אחרת (כלל 14).
export function approvedQuotesLabel(count) {
  return count === 1 ? 'מהצעה אחת שאושרה' : `מ-${count} הצעות שאושרו`
}

export function pendingQuotesLabel(count) {
  // אפס מקבל ניסוח משלו: "0 הצעות ממתינות" קריא, אבל המסך כבר מציג 0 ₪ מעליו,
  // ומשפט שלילי אחד ברור יותר משני אפסים זה מעל זה.
  if (count === 0) return 'אין הצעות שממתינות להחלטה'
  return count === 1 ? 'הצעה אחת ממתינה להחלטה' : `${count} הצעות ממתינות להחלטה`
}
