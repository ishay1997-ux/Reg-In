// גזירות-התצוגה של מודול 8 (כספים) — **טהור**: בלי Supabase, בלי שעון, בלי DOM.
//
// 🔴 **מה הקובץ הזה במפורש *אינו* עושה: הוא אינו מחשב כסף.** מקור-האמת היחיד לכסף הוא
// `finance_project_money` במסד (מיגרציה E1, `20260827144459_module8_finance_money_ssot_and_readers.sql`)
// — פונקציה **פנימית** (‏`revoke ... from authenticated`) שאף מסך אינו יכול לעקוף. הכנסות ·
// סחורה · עבודה · נסיעות · רווח-גולמי · סטיית-תקציב · שעות-מתוכננות · דמי-הביטול התלת-רכיביים
// — כולם נולדים שם ומגיעים לכאן כ**עובדות**. הכותרת של אותה מיגרציה אומרת את חלוקת-העבודה
// במילים: *"מחזיר **עובדות**; הגזירות לתצוגה (מועד-פירעון, ימי-איחור, %, תגית-ציון) חיות
// ב-`src/lib/projectFinance.js`"* — וארבע הגזירות האלה הן בדיוק מה שיש כאן, לא יותר.
// **למה זה נאכף ולא רק מומלץ:** שני מסכים שגוזרים רווח לעצמם מייצרים שני מספרי-רווח לאותו
// פרויקט, וזה הכשל ש-F16/R1-4 קיימים כדי למנוע. חשבונית קטנה מדי היא באג שקט, לא קריסה.
//
// ⚠️ **`deriveProfitability` (‏"רווח הצעה", `src/lib/quotes.js`) היא ישות אחרת לגמרי** — רווח
// *מתוכנן של הצעת-מחיר* מול רווח *של פרויקט מבוצע*. לא לייבא, לא למזג (R1-4).
//
// 🔴 **מספרים מגיעים מ-PostgREST כמחרוזות.** ‏`numeric` של Postgres עובר ב-JSON כטקסט:
// נמדד חי 27/08/2026 ש-`budget_deviation` של פרויקט 12 חוזר `"202.5000000000000000"`
// ו-`gross_profit` חוזר `"207.40"`. לכן כל קלט כאן עובר `toFinanceNumber` ולא `+value`.
//
// 🔴 **`null` ו-`undefined` אינם אותו דבר כאן, וזו כל הדוקטרינה של המודול:**
// ‏`null` = חוסר-נתון **שנמדד** (שעות-סופיות חסרות ⇒ סטיית-תקציב NULL, ‏T7) ⇒ המסך מציג `—`.
// ‏`undefined` = השדה לא הגיע כלל ⇒ **צורת-הנתון השתנתה** ⇒ זריקה רועשת. אפס שקט במקום
// אחד מהשניים הוא החטא המרכזי של המודול (‏§4.3 במדריך-המיקרו — "silent-zero doctrine").
//
// ⚠️ **ואיפה בדיוק עובר הקו — כי משפט-דוקטרינה גורף שאינו נאכף בכל פונקציה הוא תיעוד שקרי.**
// **‏(א) קלט שהוא עמודה מוצהרת של ה-RPC ⇒ `undefined` זורק:** ‏`toFinanceNumber` ·
// ‏`deriveExpectedProfit` (‏`gross_profit`/`budget_deviation`) · ‏`deriveDueDate`
// (‏`invoice_sent_at`/`payment_terms_days`) · `assertFinanceShape` על השורה כולה.
// **‏(ב) קלט שהוא ערך-תצוגה כבר-גזור ⇒ `undefined` מתנהג כ-`null` ומגיע ל-`—`:**
// ‏`derivePercent` ו-`formatPercent`, שמקבלות את הפלט של גזירה אחרת ולא שדה מהשרת.
// **‏(ג) והחריג היחיד מסוג-א', מוצהר ולא מנומק-בדיעבד: `scoreTag(undefined)` ⇒ `null`**
// (נעוץ בבדיקה, "אין ציון ⇒ null"). ‏`feedback_score` הוא כן עמודה מוצהרת, ולכן זהו המקום
// היחיד בקובץ שבו היעלמות-עמודה תיראה כמו "טרם ענו". **מסומן במפורש כדי שלא ייקרא כתקדים.**
//
// 🔴 **ו-(א) אינו מספיק לבדו: הוא תופס רק שדה שהגזירה נוגעת בו.** שער-הצורה של השורה
// (`assertFinanceShape`) הוא מה שתופס עמודה שנעלמה **ואיש לא קרא לה** — והוא ייקרא
// מאתרי-הקריאה של S1/S2 בשלב-3. **נכון להיום אין לו ולו אתר-קריאה אחד בייצור.**

import { toAgorot, toShekels } from '@/lib/pricing'

// שגיאה מוטיפסת (R4-F9) כדי שאתר-הקריאה יוכל להבדיל בין "המסד ענה משהו מוזר" לבין
// שגיאת-רשת רגילה, ולהציג את מסך-התקלה במקום להמשיך עם סכום חלקי.
export class FinanceShapeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FinanceShapeError'
  }
}

// ממיר ערך-כסף/מספר שהגיע מה-RPC למספר. ‏`null` עובר כ-`null` (חוסר-נתון שנמדד);
// ‏`undefined` או טקסט לא-מספרי זורקים — הם אומרים שהחוזה נשבר, ובליעתם כ-0 היא בדיוק
// הדרך שבה רווח מנופח מגיע למסך בלי שאיש ישים לב.
export function toFinanceNumber(value, fieldName = 'ערך') {
  if (value === null) return null
  if (value === undefined) {
    throw new FinanceShapeError(`חסר שדה "${fieldName}" בנתוני הכספים שהתקבלו מהשרת.`)
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) {
    throw new FinanceShapeError(`השדה "${fieldName}" אינו מספר תקין (התקבל: ${value}).`)
  }
  return n
}

// שומר-הצורה של שורה שחזרה מ-`get_finance_overview` / `get_project_finance_detail`.
// ⚠️ **הוא בודק נוכחות-מפתח, לא ערך** — ‏`null` הוא תשובה לגיטימית (עדיין אין תשלום,
// אין שעות-סופיות), ו-`undefined` הוא שדה שנעלם. `Object.hasOwn` ולא `row[f] === undefined`
// כי שדה שקיים במפורש עם `undefined` הוא עדיין דריפט-צורה.
export function assertFinanceShape(row, requiredFields, context = 'נתוני הכספים') {
  if (row === null || row === undefined || typeof row !== 'object') {
    throw new FinanceShapeError(`לא התקבלו ${context} מהשרת.`)
  }
  const missing = (requiredFields ?? []).filter(
    (field) => !Object.hasOwn(row, field) || row[field] === undefined,
  )
  if (missing.length > 0) {
    throw new FinanceShapeError(`חסרים שדות ב${context}: ${missing.join(', ')}.`)
  }
  return row
}

// ── מועד-פירעון וימי-איחור (§7.20א · כרטיס-S1 §③) ────────────────────────────

// חילוץ תאריך-הלוח **בשעון ישראל** מתוך חותמת-זמן. ⚠️ לא לחתוך את עשרת התווים
// הראשונים של ה-ISO: המסד שומר ב-UTC, וחשבונית שנשלחה ב-00:30 בישראל רשומה שם
// כ-21:30 של **אתמול** — כלומר מועד-הפירעון היה זז יום אחורה וימי-האיחור היו עולים ב-1.
// אותו טיפול-אזור-זמן שכבר חי ב-`src/lib/dates.js` (`formatTimestamp`).
function israelCalendarDate(value) {
  if (value === null || value === undefined || value === '') return null
  // תאריך-בלבד (`YYYY-MM-DD`) אינו נושא שעה, ולכן אין מה להמיר — הוא כבר יום-לוח.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [y, m, d] = value.trim().split('-').map(Number)
    return { year: y, month: m, day: d }
  }
  const instant = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(instant.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value)
  return { year: pick('year'), month: pick('month'), day: pick('day') }
}

// מספר-הימים המוחלט של יום-לוח, לחישוב הפרשים בלי DST. ‏`Date.UTC` מקבל חודש 0-בסיס.
function dayNumber({ year, month, day }) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

function dayNumberToIso(n) {
  const d = new Date(n * 86400000)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/**
 * מועד-פירעון = תאריך-שליחת-החשבונית + `תנאי_תשלום_ימים` ("שוטף+30", §7.20א).
 * מחזיר `YYYY-MM-DD` או `null`.
 *
 * 🔴 **ערך `null` באחד מהשניים ⇒ `null`, לעולם לא ברירת-מחדל.** ‏`get_finance_overview` מחזיר
 * את `payment_terms_days` כ-nullable במפורש (כותרת מיגרציית E1: *"עד אז מועד-הפירעון אינו ניתן
 * לחישוב, והמסך יציג `—` — לעולם לא '0 ימי איחור', שהוא שקר שנראה כמו עובדה"*). ‏30 מוקשח
 * כאן היה הופך פרמטר-מערכת חסר למספר שנראה מדוד.
 *
 * ⚠️ **ו-`undefined` אינו `null` כאן — הוא זורק.** שני הקלטים הם עמודות **מוצהרות** בטבלת
 * ההחזרה של `get_finance_overview` (`invoice_sent_at timestamptz` · `payment_terms_days
 * integer`), כלומר המפתח מגיע תמיד והערך הוא שיכול להיות `null`. שדה שנעלם = שם-עמודה
 * השתנה, וזה חייב להיראות — אחרת **כל** שורה במסך מציגה `—` ימי-איחור, מנהלת-הכספים אינה
 * רודפת אחרי אף חוב, ואין שום סימן על המסך. *(עד `27/08/2026` היה כאן `termsDays ?? null`,
 * שהמיר בשקט את סימן-הדריפט לחוסר-נתון-מדוד — הפוך מכותרת הקובץ.)*
 */
export function deriveDueDate(invoiceSentAt, termsDays) {
  if (invoiceSentAt === undefined) {
    throw new FinanceShapeError('חסר שדה "invoice_sent_at" בנתוני הכספים שהתקבלו מהשרת.')
  }
  const sent = israelCalendarDate(invoiceSentAt)
  const terms = toFinanceNumber(termsDays, 'payment_terms_days')
  if (sent === null || terms === null || !Number.isInteger(terms) || terms < 0) return null
  return dayNumberToIso(dayNumber(sent) + terms)
}

/**
 * ימי-איחור = היום − מועד-הפירעון, **כשחיובי** (כרטיס-S1 §③, 🔗 מראת §7.20א).
 *
 * · אי-אפשר לחשב (אין חשבונית שנשלחה / אין פרמטר תנאי-תשלום / תאריך פסול) ⇒ `null` ⇒ `—`.
 * · אפשר לחשב והמועד טרם חלף ⇒ `0`. **זה מספר אמיתי ולא חוסר-נתון** — ולכן 0 ולא `null`;
 *   ההבחנה היא בדיוק ה-`—`-מול-`0` של §4.3. המסך מציג את המונה רק כשהוא > 0.
 * · `today` מתקבל כפרמטר ולא נקרא מהשעון: `Date.now()` בגוף render הוא שגיאת-ESLint קשיחה
 *   בקונפיג הזה (`react-hooks/purity`, `src/CLAUDE.md`), והבדיקות צריכות "היום" קבוע.
 */
export function deriveDaysOverdue(invoiceSentAt, termsDays, today) {
  const due = deriveDueDate(invoiceSentAt, termsDays)
  const now = israelCalendarDate(today)
  if (due === null || now === null) return null
  const diff = dayNumber(now) - dayNumber(israelCalendarDate(due))
  return diff > 0 ? diff : 0
}

// ── רווח-צפוי (ה27) ──────────────────────────────────────────────────────────

/**
 * רווח-צפוי = `gross_profit + budget_deviation` — שני שדות שהמסד כבר החזיר.
 *
 * 🔑 **למה החיבור הזה *הוא* נוסחת-ה27, ולא קיצור-דרך:** ‏`gross_profit` של המסד גוזר את
 * העבודה מ**שעות-בפועל**, בעוד ה27 ("רווח-צפוי") גוזר אותה מ**שעות-מתוכננות**;
 * ‏`budget_deviation` (ה18) מוגדר בדיוק כהפרש בין השניים — ‏`עבודה-בפועל − עבודה-מתוכננת`.
 * לכן `gross + deviation` = הכנסות − סחורה − נסיעות − עבודה-**מתוכננת**, שזו לשון ה27.
 * ‏**זו הסיבה שאין כאן חישוב-רווח שני:** המסד סיפק את שני הרכיבים; כאן רק חיבור.
 *
 * 🔴 **סטיית-תקציב `null` (‏T7 — אין שעות-סופיות לפרויקט) ⇒ רווח-צפוי `null`.** ‏**לא**
 * להחזיר את `gross_profit` לבדו: זה היה מדווח את מספר-העבודה-בפועל כתחזית, בשקט, בדיוק
 * על הפרויקטים שאין להם שעות. `—` על המסך הוא התשובה הנכונה.
 *
 * חישוב באגורות-שלמות (כמו `src/lib/pricing.js`) — ‏207.40 + 202.50 בנקודה-צפה מחזיר
 * 409.90000000000003, וזה מספר-כסף שמוצג למנהלת.
 */
export function deriveExpectedProfit(grossProfit, budgetDeviation) {
  const gross = toFinanceNumber(grossProfit, 'gross_profit')
  const deviation = toFinanceNumber(budgetDeviation, 'budget_deviation')
  if (gross === null || deviation === null) return null
  return toShekels(toAgorot(gross) + toAgorot(deviation))
}

// ── תגית-ציון (ה16, סוגר §7.80) ──────────────────────────────────────────────

// ‏5=מצוין · 4=טוב · 3=בינוני · 1–2=טעון בירור. הצבעים: ירוק 4–5 · צהוב 3 · אדום <3.
// ⚠️ ‏`danger` **אינו** מששת הטונים של `StatusTag` היום — הוא הרחבה שהמוקאפ המאושר
// `02_closing_window_approved.html` הכריז עליה במפורש (`.tag.danger`, ובנספח "מה הכרעתי
// לבד" ④). הוספת הטון עצמו לרכיב היא עבודת שלב-3; כאן נקבע רק **איזה** טון מגיע לאיזה ציון.
const SCORE_TAGS = [
  { min: 4, label: null, tone: 'ok' }, // התווית נקבעת פר-ציון למטה (מצוין/טוב)
  { min: 3, label: 'בינוני', tone: 'warn' },
  { min: 1, label: 'טעון בירור', tone: 'danger' },
]

const SCORE_LABELS = { 5: 'מצוין', 4: 'טוב', 3: 'בינוני', 2: 'טעון בירור', 1: 'טעון בירור' }

/**
 * ציון-משוב ⇒ ‏`{ score, label, tone }`, או `null` כשאין ציון (טרם ענו / `no_response`).
 *
 * 🔴 **ציון מחוץ ל-1–5 זורק** ולא נופל בשקט לאפור. ‏`projects_feedback_score_check` במסד
 * מגביל ל-1–5, ולכן ערך אחר אינו קלט-משתמש אלא באג — אותה החלטה בדיוק כמו
 * `resolveProjectTone` ב-`src/lib/projects.js`, שצועקת במקום להאפיר.
 */
export function scoreTag(score) {
  const n = toFinanceNumber(score ?? null, 'feedback_score')
  if (n === null) return null
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new FinanceShapeError(`ציון משוב לא חוקי: ${score} (מותר 1–5 בלבד).`)
  }
  const band = SCORE_TAGS.find((entry) => n >= entry.min)
  return { score: n, label: band.label ?? SCORE_LABELS[n], tone: band.tone }
}

/**
 * הטקסט שעל התג — **תווית בלבד, בכל משטח, בלי מספר בתוך התג.**
 *
 * 🔴 **פורמט אחד ויחיד, ולא שניים** (‏`screens-approved.md`, החלטה חוצת-משטחים #4,
 * נפתרה 26/08/2026): *"קנוני = פורמט **S1** ("טוב" בלבד, בלי מספר בתוך התג). **בבנייה:
 * פורמט-התג כ-S1.** … התג הנוכחי ב-S2 (`"ציון X — תיאור"` / `"X — תיאור"`) הוא
 * **ייצוג-מוקאפ בלבד, לא חוזה-פורמט"*. אותו דבר ב-§3.7 של מדריך-המיקרו:
 * *"S1 format: label only, no number inside the tag"*.
 * ⇒ **הצורה הממוספרת פרשה ואין אליה דרך מכאן.** ‏S2 (צעד 3.2) קורא לאותה פונקציה
 * ומקבל את אותה תווית; מי שיצטרך את הציון עצמו לוקח אותו מ-`scoreTag(score).score`
 * ומציג אותו **ליד** התג, לא בתוכו.
 */
export function scoreTagText(score) {
  const tag = scoreTag(score)
  if (tag === null) return null
  return tag.label
}

// ── אחוזים לתצוגה (§7.52 — ‏₪ נשמר, % תמיד נגזר) ─────────────────────────────

/**
 * אחוז לתצוגה, מעוגל לשלם. מכנה 0/שלילי/חסר ⇒ `null` ⇒ המסך מציג `—`, **לעולם לא
 * `NaN`/`∞`/`0%`**. ‏זה נוגע בפועל: ביטול שוויתרו על דמי-הביטול שלו מגיע עם הכנסה 0,
 * ו-"0% רווח" שם היה נקרא כעובדה מדודה.
 *
 * העיגול לשלם הוא מה שהמוקאפ המאושר מצייר — ‏3,650 / 5,300 = 68.87% ⇒ **69%** (עוגן-היד
 * הרביעי, spec §③3). מונה שלילי מותר ומוצג כשלילי: הפסד חייב להיראות כהפסד.
 *
 * ⚠️ **כאן `undefined` אינו זורק — וזה מכוון (סעיף (ב) בכותרת-הקובץ).** שני הקלטים אינם
 * שמות-עמודות אלא **ערכים כבר-גזורים** (רווח-צפוי מול הכנסה, למשל), ו-`deriveExpectedProfit`
 * מחזירה `null` לגיטימי; דריפט-צורה נתפס במעלה-הזרם, על השדה הגולמי עצמו.
 */
export function derivePercent(part, whole) {
  const numerator = toFinanceNumber(part ?? null, 'מונה')
  const denominator = toFinanceNumber(whole ?? null, 'מכנה')
  if (numerator === null || denominator === null || denominator <= 0) return null
  // ⚠️ המכנה נבדק **אחרי** ההמרה לאגורות ולא רק לפניה: הכנסה של 0.004 ₪ היא חיובית
  // ומתעגלת ל-0 אגורות, וחלוקה בה הייתה מחזירה ∞ במקום `—`.
  const denominatorAgorot = toAgorot(denominator)
  if (denominatorAgorot <= 0) return null
  return Math.round((toAgorot(numerator) / denominatorAgorot) * 100)
}

/** ‏`69` ⇒ `"69%"` · `null` ⇒ `"—"`. המקף הוא התשובה על "אין נתון", לא `0%`. */
export function formatPercent(percent) {
  const n = toFinanceNumber(percent ?? null, 'אחוז')
  if (n === null) return '—'
  return `${n}%`
}
