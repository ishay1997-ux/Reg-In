// מרשם-הפרמטרים של מודול 9 — תווית עברית, הסבר, סוג-ולידציה, יחידה, קבוצה ו"משפיע-על"
// לכל אחת מ-43 שורות ה-`params`. **בית יחיד לידע-התצוגה** (§2.8, V-6): הבעלות
// (`owner_role_id`) חיה ב-DB, אבל התווית/הקבוצה/הולידציה חיות כאן בקוד — כי אין עמודת-תיאור
// ב-`params` (החלטת-Seed #7) והולידציה חייבת להיות ניתנת-לבדיקת-יחידה.
//
// 🚫 טהור לחלוטין (בלי Supabase, בלי שעון, בלי DOM) — אותה מוסכמה כמו כל `src/lib/`.
//
// **Validators compose, never fork** (§2.8): כל סוג-ולידציה קיים כבר ב-`validators.js`
// ומיובא כאן; שלושת הפרדיקטים החדשים היחידים (משקל 0–1 · בוליאני · URL עם https) לא היו
// קיימים בשום מקום ולכן נכתבים כאן, לא משוכפלים ממקום אחר.

import {
  isValidVatPercent,
  isValidPositiveInt,
  isValidNonNegativePrice,
  EMAIL_REGEX,
} from './validators'
import { optionalNumber } from './hostesses'

// ── קבוצות — `param_type` ⇐ תווית עברית נעולה (§3.7, לא ממציאים) ───────────
const GROUP_LABELS = {
  pricing_timing: 'תמחור ותזמון',
  control_alerts: 'בקרה והתראות',
  shift_invites: 'שיבוץ וזימונים',
  templates: 'תבניות מייל',
  smart_match: 'התאמת דיילות',
  integration_tech: 'טכני',
}

// 🔧 **סדר-התצוגה כאן הוא הכרעה טכנית של הבונה, לא הכרעת-ישי** (מדווח ב-`הנחתי`): המדריך
// לא קבע סדר לרשימת-הסוגים (המוקאפ צויר לפני ש-`shift_invites` נוסף). הסדר שנבחר מקבץ את
// שלושת סוגי-הספים-הזמניים יחד (תמחור·בקרה·זימונים), אחר-כך תוכן (תבניות), אחר-כך האלגוריתם
// (התאמה), וטכני אחרון (שורה אחת). קל לשנות בעתיד — אינו חלק מחוזה שום קורא.
export const PARAM_GROUPS = [
  { type: 'pricing_timing', label: GROUP_LABELS.pricing_timing },
  { type: 'control_alerts', label: GROUP_LABELS.control_alerts },
  { type: 'shift_invites', label: GROUP_LABELS.shift_invites },
  { type: 'templates', label: GROUP_LABELS.templates },
  { type: 'smart_match', label: GROUP_LABELS.smart_match },
  { type: 'integration_tech', label: GROUP_LABELS.integration_tech },
]

// ── פרדיקטים חדשים (§2.8 — "שלושת אלה בלבד") ────────────────────────────────

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

// משקל-שקלול: 0–1. משמש גם למשקולות עצמן (שסכומן נבדק בנפרד ב-weightsSumOk) וגם
// לשיעור-בונוס-ההוגנות (0.02) — שניהם "שבר בין 0 ל-1", ואין ביניהם הבדל-ולידציה.
function isValidWeight(value) {
  if (isBlank(value)) return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 1
}

function isValidBooleanText(value) {
  if (typeof value === 'boolean') return true
  if (typeof value !== 'string') return false
  const raw = value.trim().toLowerCase()
  return raw === 'true' || raw === 'false'
}

// עותק מקומי ומינימלי של פענוח-בוליאני, במתכוון: `smartMatch.js` מחזיקה פונקציה זהה
// (`paramBoolean`) אבל אינה מייצאת אותה — היא קובץ-אלגוריתם טהור של מודול 4, ומרשם-הפרמטרים
// של מודול 9 לא אמור להיצמד אליו כדי לפענח "true"/"false". 4 שורות; jscpd לא אמור לתפוס.
function paramBoolean(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : value
  if (raw === 'true' || raw === true) return true
  if (raw === 'false' || raw === false) return false
  return null
}

// קישור https תקין. אף שורה חיה מבין ה-43 אינה מסוג `url` נכון לרגע זה (הפרמטר היחיד
// שהיה זקוק לו, `קישור_בסיס_סקר_לקוחות`, נמחק ב-Q-2) — אבל §2.8 דורש את הפרדיקט כחלק
// מהחוזה (שורת-URL עתידית לא תדרוש קובץ שני), ולכן הוא מחובר ב-KIND_RULES למטה.
function isValidHttpsUrl(value) {
  if (isBlank(value)) return false
  try {
    return new URL(String(value).trim()).protocol === 'https:'
  } catch {
    return false
  }
}

// ── ולידציה לפי קינד — ההודעה תמיד אומרת מה כן תקין (§2.8) ─────────────────
//
// 🔴 **ההודעה נבנית מאותם מספרים שנאכפים בפועל — וזה תיקון של פגם שנמדד** (03/09/2026,
// סקירת-UX בהקשר-טרי): עד לתיקון היו ההודעות **מחרוזות קבועות** שהבטיחו כלל ש**שום קוד
// לא אכף**, כי `min`/`max`/`decimals` שבשורת-המרשם מעולם לא נקראו. שלוש מדידות:
// ‏`אחוז מע"מ = 17.555` התקבל בעוד ההודעה מבטיחה "עד שתי ספרות אחרי הנקודה" ·
// ‏`משקולת קרבה = 0.333333` התקבל · `סף שביעות רצון = 99` התקבל אף שהשורה מכריזה
// ‏`min: 1, max: 5`. **הודעה שמבטיחה כלל שאינו נאכף גרועה מהיעדר-הודעה** — היא מלמדת את
// המשתמשת חוק שקרי. ⇒ מקור אחד: `boundsFor(entry)` מייצר גם את האכיפה וגם את הנוסח.
const BLANK_NUMERIC_ERROR = 'יש למלא ערך — שדה ריק אינו 0'

// ברירות-המחדל של הקינד = בדיוק מה שהפרדיקט המורכב כבר אוכף (`isValidVatPercent` = 0–100,
// ‏`isValidPositiveInt` = שלם ≥1, `isValidNonNegativePrice` = ≥0, `isValidWeight` = 0–1).
// שורת-מרשם שמכריזה `min`/`max`/`decimals` **מצרה** מהם; היא לעולם אינה מרחיבה.
const KIND_RULES = {
  percent: { test: isValidVatPercent, base: 'מספר', min: 0, max: 100, decimals: 2 },
  int: { test: isValidPositiveInt, base: 'מספר שלם', min: 1, decimals: 0, integer: true },
  decimal: { test: isValidNonNegativePrice, base: 'מספר', min: 0, decimals: 2 },
  weight: { test: isValidWeight, base: 'מספר', min: 0, max: 1, decimals: 2 },
  boolean: { test: isValidBooleanText, message: 'ערך חוקי: כן או לא בלבד' },
  email: {
    test: (value) => !isBlank(value) && EMAIL_REGEX.test(String(value).trim()),
    message: 'ערך חוקי: כתובת מייל תקינה',
  },
  url: { test: isValidHttpsUrl, message: 'ערך חוקי: קישור המתחיל ב-https://' },
  // 'templates' אינו מאומת כאן בכלל — §2.8: "Blank ⇒ invalid for every non-template kind".
  // גוף-התבנית מאומת ב-emailTemplates.js (templateSaveVerdict, צעד 2.2) — לא כפילות-חוזה.
}

function boundsFor(entry, rule) {
  return {
    base: rule.base,
    integer: Boolean(rule.integer),
    min: entry?.min ?? rule.min ?? null,
    max: entry?.max ?? rule.max ?? null,
    decimals: entry?.decimals ?? rule.decimals ?? null,
  }
}

function rangePhrase({ min, max, integer }) {
  if (min != null && max != null) return `בין ${min} ל-${max}`
  // 🔒 "שלם עם רצפה 1" ו-"שלם חיובי" הם אותה עובדה בדיוק, והנוסח השני הוא זה שכבר נעול
  // בבדיקת-E2E (`e2e/prices.spec.js`, יחס-אורחים) — אין סיבה לשבור אותו כדי לומר מספר.
  if (min != null) return integer && min === 1 ? 'חיובי' : `${min} ומעלה`
  if (max != null) return `עד ${max}`
  return ''
}

// צורות-הריבוי בעברית אינן נגזרות ממספר, ולכן שתי הצורות הנפוצות כתובות במפורש.
function decimalsPhrase(decimals) {
  if (decimals === 1) return 'עד ספרה אחת אחרי הנקודה'
  if (decimals === 2) return 'עד שתי ספרות אחרי הנקודה'
  return `עד ${decimals} ספרות אחרי הנקודה`
}

function numericMessage(bounds) {
  const range = rangePhrase(bounds)
  const head = range ? `${bounds.base} ${range}` : bounds.base
  // `decimals: 0` (קינד שלם) אינו נאמר — "מספר שלם" כבר אומר זאת, ומשפט כפול מבלבל.
  return bounds.decimals
    ? `ערך חוקי: ${head}, ${decimalsPhrase(bounds.decimals)}`
    : `ערך חוקי: ${head}`
}

// ספירת ספרות-אחרי-הנקודה מהטקסט ולא מהמספר: `Number('17.550')` הוא 17.55, ומי שהקליד
// שלוש ספרות צריך לראות את ההודעה על מה שהקליד.
function decimalPlaces(value) {
  const text = String(value).trim()
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

// { ok:true } | { ok:false, message } — ההודעה תמיד חיובית ("מה כן תקין"), לא רק "לא תקין".
export function validateParamValue(entry, value) {
  const rule = KIND_RULES[entry?.kind]
  if (!rule) return { ok: true }
  if (!rule.base) return rule.test(value) ? { ok: true } : { ok: false, message: rule.message }

  // A-4 / C6: ריק אינו 0 — וההודעה עליו אומרת "חסר ערך", לא טווח. משתמשת שמחקה שדה
  // וקיבלה "ערך חוקי: מספר בין 1 ל-5" חושבת שהמספר שלה פסול, ולא שהשדה ריק.
  if (isBlank(value)) return { ok: false, message: BLANK_NUMERIC_ERROR }

  const bounds = boundsFor(entry, rule)
  const message = numericMessage(bounds)
  if (!rule.test(value)) return { ok: false, message }

  const n = Number(value)
  if (bounds.min != null && n < bounds.min) return { ok: false, message }
  if (bounds.max != null && n > bounds.max) return { ok: false, message }
  if (bounds.decimals != null && decimalPlaces(value) > bounds.decimals) {
    return { ok: false, message }
  }
  return { ok: true }
}

// ── כללי-רוחב (§2.8 "Cross-field") — לא חלק מ-validateParamValue של שדה בודד ──

const WEIGHT_SUM_TOLERANCE = 0.005

// שלוש משקולות ה-Smart Match חייבות לסכום ל-1.00 (±0.005 — סבילות-עיגול, לא סבילות-מוצר).
export function weightsSumOk(values) {
  const sum = (values ?? []).reduce((total, value) => {
    const n = Number(value)
    return total + (Number.isFinite(n) ? n : 0)
  }, 0)
  return Math.abs(sum - 1) <= WEIGHT_SUM_TOLERANCE
}

// גולפוסט (ציון⇒0) חייב להיות ≤ שער (פסילה) — אחרת דיילת הייתה נפסלת לפני שהציון שלה
// בכלל הגיע ל-0, וזה הפוך מהכוונה. ⚠️ ערך חסר/לא-תקין משני הצדדים ⇒ `true` (אין מה לפסול —
// כל שדה בודד כבר נחסם ע"י הולידציה של ה-kind שלו לפני שהשוואה כזו מוצגת בכלל).
export function distanceOrderOk(goalpostKm, gateKm) {
  const goalpost = Number(goalpostKm)
  const gate = Number(gateKm)
  if (!Number.isFinite(goalpost) || !Number.isFinite(gate)) return true
  return goalpost <= gate
}

// חיפוש בשני השמות (§2.8, A-6, מוקש-המוקאפ ①): תווית ידידותית **וגם** שם-המסד הגולמי —
// מי שמחפש "שער_מרחק_קמ" חייב למצוא, לא רק מי שמחפש "מרחק".
export function matchesParamSearch(entry, query) {
  const q = String(query ?? '')
    .trim()
    .toLowerCase()
  if (!q) return true
  return (
    String(entry?.label ?? '')
      .toLowerCase()
      .includes(q) ||
    String(entry?.name ?? '')
      .toLowerCase()
      .includes(q)
  )
}

// `params.param_value` הוא `text` לכל סוג (§2.9) — פענוח-לתצוגה עובר תמיד כאן, לא ב-`Number(...)`
// ישיר בקומפוננטה (מלכודת ה-`Number('')===0`, מתועדת ב-`hostesses.js`).
export function parseForDisplay(entry, rawText) {
  switch (entry?.kind) {
    case 'percent':
    case 'int':
    case 'decimal':
    case 'weight':
      return optionalNumber(rawText)
    case 'boolean':
      return paramBoolean(rawText)
    default:
      return rawText ?? ''
  }
}

// ── המרשם עצמו — 43 שורות ────────────────────────────────────────────────
// כל שורה: { name, label, hint, kind, unit?, min?, max?, decimals?, group, affects? }.
// `group` הוא ה-`type` (מפתח ל-PARAM_GROUPS), לא התווית — מקור-אמת יחיד לתווית.
// `affects` (§2.8, §3.7): משפט-עברי-יחיד שמשמעותו "השינוי הזה נראה במסך של תפקיד אחר" —
// מופיע רק בשורות שנבדקו בפועל כחוצות-תפקיד (רשימה מלאה בדוח-הבנייה, לא כאן).

export const PARAM_REGISTRY = [
  // ── תמחור ותזמון (7) ──
  {
    name: 'אחוז_מעמ',
    label: 'אחוז מע"מ',
    hint: 'אחוז המע"מ שמתווסף לכל הצעת מחיר חדשה',
    kind: 'percent',
    unit: '%',
    min: 0,
    max: 100,
    decimals: 2,
    group: 'pricing_timing',
    affects: 'משנה את סכום המע"מ בהצעות מחיר חדשות — מסך בניית ההצעה יציג את הערך החדש מיד',
  },
  {
    name: 'יחס_אורחים_לדיילת',
    label: 'יחס אורחים לדיילת',
    hint: 'כמה אורחים לכל דיילת אחת — משמש להמלצת המערכת על כמות הדיילות הנדרשת',
    kind: 'int',
    unit: 'אורחים',
    min: 1,
    group: 'pricing_timing',
  },
  {
    name: 'ימי_תוקף_הצעה',
    label: 'תוקף הצעת מחיר',
    hint: 'כמה ימים הצעת מחיר תקפה לפני שהיא נחשבת פגה',
    kind: 'int',
    unit: 'ימים',
    min: 1,
    group: 'pricing_timing',
    affects: 'משנה מתי הצעת מחיר נחשבת פגה — משפיע על מסך ההצעות ועל הסינון בו',
  },
  {
    name: 'סכום_נסיעות_למשמרת',
    label: 'סכום נסיעות למשמרת',
    hint: 'התוספת הקבועה שמשולמת לדיילת עבור נסיעות במשמרת',
    kind: 'decimal',
    unit: '₪',
    min: 0,
    decimals: 2,
    group: 'pricing_timing',
  },
  {
    name: 'שכר_מינימום_שעתי',
    label: 'שכר מינימום שעתי',
    hint: 'התעריף המינימלי לשעת-עבודה של דיילת — משמש לבדיקת תעריפים ולרשימת דיילות מתחת לרף',
    kind: 'decimal',
    unit: '₪',
    min: 0,
    decimals: 2,
    group: 'pricing_timing',
    affects: 'משנה את רשימת הדיילות שמתחת לשכר המינימום, ואת בדיקת התעריפים במודול הדיילות',
  },
  {
    name: 'תנאי_תשלום_ימים',
    label: 'תנאי תשלום',
    hint: 'כמה ימים אחרי הפקת חשבונית היא נחשבת באיחור',
    kind: 'int',
    unit: 'ימים',
    min: 1,
    group: 'pricing_timing',
  },
  {
    name: 'ימי_אזהרה_הצעה_פגה',
    label: 'ימי אזהרה לפני שהצעה פגה',
    hint: 'כמה ימים לפני שהצעת מחיר פגה מוצגת אזהרה במסך ההצעות',
    kind: 'int',
    unit: 'ימים',
    min: 1,
    group: 'pricing_timing',
  },

  // ── בקרה והתראות (8) ──
  {
    name: 'אחוז_פיצוי_ביטול_חלקי',
    label: 'אחוז פיצוי בביטול חלקי',
    hint: 'אחוז מהתשלום לדיילת המשולם כפיצוי בביטול פרויקט בטווח-הביניים',
    kind: 'percent',
    unit: '%',
    min: 0,
    max: 100,
    decimals: 2,
    group: 'control_alerts',
  },
  {
    name: 'ימי_אזהרה_קדם_אירוע',
    label: 'ימי אזהרה לפני אירוע',
    hint: 'כמה ימים לפני האירוע הפרויקט מסומן "אדום" במסכי הניהול',
    kind: 'int',
    unit: 'ימים',
    min: 1,
    group: 'control_alerts',
  },
  {
    name: 'סף_לקוח_רדום_ימים',
    label: 'סף לקוח רדום',
    hint: 'כמה ימים בלי אירוע עתידי הופכים לקוח ל"רדום"',
    kind: 'int',
    unit: 'ימים',
    min: 1,
    group: 'control_alerts',
  },
  {
    name: 'שעות_פיצוי_ביטול_חלקי',
    label: 'שעות פיצוי חלקי מהאירוע',
    hint: 'מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי חלקי',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'control_alerts',
  },
  {
    name: 'שעות_פיצוי_ביטול_מלא',
    label: 'שעות פיצוי מלא מהאירוע',
    hint: 'מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי מלא',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'control_alerts',
  },
  {
    name: 'שעות_תזכורת_לדיילת',
    label: 'שעות לתזכורת לדיילת',
    hint: 'כמה שעות לפני המשמרת נשלחת לדיילת תזכורת אוטומטית',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'control_alerts',
  },
  {
    name: 'סף_שביעות_רצון',
    label: 'סף שביעות רצון',
    hint: 'ציון משוב שמתחתיו נדרשת סיבה ובירור טלפוני; לקוח שממוצע-המשוב שלו נמוך מהסף מסומן "טעון בירור"',
    kind: 'int',
    unit: '★',
    min: 1,
    max: 5,
    group: 'control_alerts',
    affects: 'מעלה את הרף שבו נדרשת סיבה למשוב — מסך הכספים ידרוש אותה',
  },
  {
    name: 'סף_לוגיסטיקה_ימי_עסקים',
    label: 'סף אזהרת לוגיסטיקה',
    hint: 'כמה ימי-עסקים לפני האירוע פריט לוגיסטי שלא הוחל מסומן בענבר',
    kind: 'int',
    unit: 'ימי עסקים',
    min: 1,
    group: 'control_alerts',
  },

  // ── שיבוץ וזימונים (3) ──
  {
    name: 'שעות_סף_זימון_לפני_אירוע',
    label: 'סף זימון לפני אירוע',
    hint: 'מספר השעות לפני האירוע שמתחתיו זימון-משמרת נחשב "ליום האחרון"',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'shift_invites',
  },
  {
    name: 'שעות_תוקף_זימון',
    label: 'תוקף זימון-משמרת',
    hint: 'כמה שעות מרגע השליחה יש לדיילת לאשר או לדחות זימון לפני שהוא פג',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'shift_invites',
    affects: 'משנה מתי זימון-משמרת נחשב פג — משפיע גם על מסך הצוות בפרויקט (מודול 6)',
  },
  {
    name: 'שעות_אירוע_דחוף',
    label: 'סף אירוע דחוף',
    hint: 'מספר השעות עד האירוע שמתחתיו הוא מסומן "דחוף" במבט-העל ובמיון',
    kind: 'int',
    unit: 'שעות',
    min: 1,
    group: 'shift_invites',
  },

  // ── תבניות מייל (11) — הולידציה האמיתית ב-emailTemplates.js, לא כאן ──
  {
    name: 'תבנית_זימון_משמרת',
    label: 'זימון משמרת',
    hint: 'המייל שיוצא לדיילת כשהיא מועמדת למשמרת חדשה',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_אישור_סופי_שיבוץ',
    label: 'אישור סופי שיבוץ',
    hint: 'המייל שיוצא לדיילת כששיבוצה נסגר סופית',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_ביטול_משמרת',
    label: 'ביטול משמרת',
    hint: 'המייל שיוצא לדיילת כששיבוץ שלה בוטל, בעוד האירוע עצמו ממשיך',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_תזכורת_משמרת',
    label: 'תזכורת משמרת',
    hint: 'המייל האוטומטי שיוצא לדיילת לפני המשמרת (טריגר: שעות_תזכורת_לדיילת)',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_שחרור_משמרת',
    label: 'שחרור ממשמרת',
    hint: 'המייל שיוצא לדיילת כשהיא משוחררת ממשמרת שמעולם לא אושרה',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_הצעת_מחיר',
    label: 'הצעת מחיר',
    hint: 'המייל שמלווה הצעת-מחיר בשליחתה ללקוח',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_חשבונית_מס',
    label: 'חשבונית מס',
    hint: 'המייל שמלווה חשבונית-מס בשליחתה ללקוח',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_דוח_שכר',
    label: 'דוח שכר',
    hint: 'המייל שמלווה את דוח-השכר החודשי בשליחתו לרואה-החשבון',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_משוב_לקוח',
    label: 'משוב לקוח',
    hint: 'המייל שמבקש מהלקוח למלא סקר שביעות-רצון אחרי סגירת אירוע',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_אירוע_בוטל',
    label: 'האירוע בוטל',
    hint: 'המייל שיוצא לכל דיילת ששובצה, כשהאירוע כולו מבוטל',
    kind: 'templates',
    group: 'templates',
  },
  {
    name: 'תבנית_מייל_פרטי_האירוע_השתנו',
    label: 'פרטי האירוע השתנו',
    hint: 'המייל שיוצא לדיילת כשמיקום או שעות האירוע שלה השתנו',
    kind: 'templates',
    group: 'templates',
  },

  // ── התאמת דיילות (13) ──
  {
    name: 'משקולת_היענות',
    label: 'משקולת היענות',
    hint: 'כמה מהציון נקבע לפי היענות לזימונים',
    kind: 'weight',
    min: 0,
    max: 1,
    decimals: 2,
    group: 'smart_match',
    affects: 'משנה את סדר המועמדות שמנהלת השיבוץ תראה מחר במסך ההתאמה',
  },
  {
    name: 'משקולת_אמינות',
    label: 'משקולת אמינות',
    hint: 'כמה מהציון נקבע לפי נוכחות בפועל במשמרות קודמות (הגעה מול אי-הגעה)',
    kind: 'weight',
    min: 0,
    max: 1,
    decimals: 2,
    group: 'smart_match',
    affects: 'משנה את סדר המועמדות שמנהלת השיבוץ תראה מחר במסך ההתאמה',
  },
  {
    name: 'משקולת_קרבה',
    label: 'משקולת קרבה',
    hint: 'כמה מהציון נקבע לפי מרחק מהאירוע',
    kind: 'weight',
    min: 0,
    max: 1,
    decimals: 2,
    group: 'smart_match',
    affects: 'משנה את סדר המועמדות שמנהלת השיבוץ תראה מחר במסך ההתאמה',
  },
  {
    // ⚠️ V-4: תווית-המוקאפ המקורית לשורה הזו הייתה שגויה. התווית כאן מתוקנת (§3.7).
    name: 'שער_מרחק_קמ',
    label: 'מרחק שמעבר לו הדיילת נפסלת',
    hint: 'דיילת שמרחקה מהאירוע גדול מהערך הזה לא מוצגת כמועמדת כלל',
    kind: 'int',
    unit: 'ק"מ',
    min: 1,
    group: 'smart_match',
  },
  {
    // התווית כאן היא תווית-המוקאפ המקורית (§3.7: "the mockup's own label for this one").
    name: 'גולפוסט_מרחק_קמ',
    label: 'מרחק שבו ציון-הקרבה מגיע ל-0',
    hint: 'חייב להיות קטן או שווה למרחק-הפסילה',
    kind: 'int',
    unit: 'ק"מ',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'קבוע_ריסון_m',
    label: 'משקל ממוצע-החברה',
    hint: 'כמה "תשובות דמיוניות" ממוצע-החברה שוקל בציון של דיילת עם מעט היסטוריה — מונע קפיצה מדירוג אחד או שניים',
    kind: 'int',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'חלון_חישוב_חודשים',
    label: 'טווח חישוב',
    hint: 'כמה חודשים אחורה נספרים לחישוב ציוני היענות ואמינות',
    kind: 'int',
    unit: 'חודשים',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'חלון_חישוב_מורחב_חודשים',
    label: 'טווח חישוב מורחב',
    hint: 'החלון המורחב שנפתח כשלדיילת אין מספיק תשובות בחלון הרגיל',
    kind: 'int',
    unit: 'חודשים',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'מינימום_תשובות_להצגת_ציון',
    label: 'מינימום תשובות להצגת ציון',
    hint: 'כמה תשובות נדרשות לפני שמוצג ציון — פחות מזה מוצג "טרם נצבר מידע"',
    kind: 'int',
    unit: 'תשובות',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'שיעור_בונוס_הוגנות_לשבוע',
    label: 'שיעור בונוס הוגנות לשבוע',
    hint: 'כמה הציון גדל לכל שבוע שדיילת לא עבדה — מנוף קטן וחסום, לא תחליף לדירוג',
    kind: 'weight',
    min: 0,
    max: 1,
    decimals: 2,
    group: 'smart_match',
  },
  {
    name: 'תקרת_שבועות_הוגנות',
    label: 'תקרת שבועות להוגנות',
    hint: 'מספר השבועות המרבי שנספר לבונוס ההוגנות',
    kind: 'int',
    unit: 'שבועות',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'לא_ענתה_ל_N',
    label: 'רצף אי-מענה',
    hint: 'כמה זימונים רצופים בלי מענה הופכים לתגית "לא ענתה" בכרטיס הדיילת',
    kind: 'int',
    unit: 'זימונים',
    min: 1,
    group: 'smart_match',
  },
  {
    name: 'מרכיב_אמינות_פעיל',
    label: 'מרכיב האמינות פעיל',
    hint: 'מדליק או מכבה את שקלול מרכיב-האמינות בציון ההתאמה',
    kind: 'boolean',
    group: 'smart_match',
    affects: 'מדליק את שקלול מרכיב-האמינות בדירוג — הסדר שמנהלת השיבוץ תראה עשוי להשתנות',
  },

  // ── טכני (1) ──
  {
    name: 'מייל_משרד_רואי_חשבון',
    label: 'מייל משרד רואי החשבון',
    hint: 'כתובת היעד למשלוח אוטומטי של דוח-השכר החודשי',
    kind: 'email',
    group: 'integration_tech',
  },
]

const REGISTRY_BY_NAME = new Map(PARAM_REGISTRY.map((entry) => [entry.name, entry]))

// שורת-`params` חיה שאין לה שורה במרשם (מוצר חדש שנזרע ולפני שהתווית נכתבה, או מוקש-שינוי-שם)
// **לעולם לא מוסתרת** — מוצגת גולמית + הערה מפורשת (§2.8).
export function getParamEntry(name) {
  return (
    REGISTRY_BY_NAME.get(name) ?? {
      name,
      label: name,
      hint: 'הגדרה ללא הגדרת-תצוגה',
      kind: 'text',
      group: null,
    }
  )
}
