// לוגיקת-החישוב הטהורה של לשונית "לקוחות" בדוחות (מ19 · מ20 · מ21 · מ22).
// 🚫 טהור לחלוטין — בלי Supabase, בלי שעון, בלי DOM. אותה מוסכמה כמו כל `src/lib/`.
//
// 🔑 **למה הקובץ קיים, ומה מעמדו:** ארבע פונקציות-השרת של הלשונית
// (`report_m19_customers_overview` · `report_m20_satisfaction` · `report_m21_drifting` ·
// `report_m22_notes`, במיגרציה `*_module11_g_rpcs_customers.sql`) מחשבות את אותם מדדים
// ב-SQL, כי המספרים חייבים להגיע גמורים מהשרת (`assert_module_permission` בשורה
// הראשונה, ת8). **הקובץ הזה הוא האורקל שמולו ה-SQL נבדק** — הבדיקות שלידו נכתבו לפני
// שהיה קוד, מתוך `signoff-baseline-2026-09-10.md` ומתוך §③ של כרטיסי-המסך.
// ⇒ **כשהשניים נחלקים, ה-SQL הוא החשוד.**
//
// 🔴 **ומה שאין כאן במכוון, כי הוא כבר חי במקום אחר** (כלל-ברזל 14):
// · `medianOf` — נקראת מ-`./reportsHostesses`; חציון אחד למודול, לא שניים.
// · `CUSTOMER_TYPE_LABELS` — נקראת מ-`./customers`; תווית-סוג-לקוח אינה נכתבת שוב.
// · `FEEDBACK_NEGATIVE_REASONS` / `FEEDBACK_POSITIVE_REASONS` — נקראות מ-`./feedback`,
//   והן **אותן חמש** שיושבות ב-CHECK של `projects` ושל `feedback_ai_insights`. זו בדיוק
//   הסיבה שהשוואת אדם↔מודל אפשרית (ת2: "הטקסונומיה אינה מתעדכנת מהמודל").
// · `isCustomerDormant` — כלל-120-הימים חי ב-`./customerProjects` ועובד על שורות-פרויקט
//   מלאות; כאן הדגל מגיע מוכן מה-RPC, והקובץ הזה רק מנסח אותו.

import { medianOf } from './reportsHostesses'
import { CUSTOMER_TYPE_LABELS } from './customers'
import { FEEDBACK_NEGATIVE_REASONS, FEEDBACK_POSITIVE_REASONS } from './feedback'

// ── עזר פנימי ────────────────────────────────────────────────────────────────

// why: `Number(null)`/`Number('')`/`Number('  ')` הם כולם 0, ולכן הפסילה קודמת להמרה.
// ערך שאינו מספר סופי הוא **חוסר**, ואסור שייקרא כאפס.
function finiteNumber(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// why: `new Date('YYYY-MM-DD')` נקרא כחצות UTC, ולכן הפרש שני תאריכים כאלה הוא מספר
// שלם של ימים בלי מלכודת-שעון-קיץ. **לא** `new Date(y, m, d)`, שהוא זמן מקומי.
const DAY_MS = 86_400_000

function toUtcDay(isoDate) {
  if (typeof isoDate !== 'string' || isoDate.length < 10) return null
  const ms = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`)
  return Number.isFinite(ms) ? ms : null
}

function daysBetween(fromIso, toIso) {
  const from = toUtcDay(fromIso)
  const to = toUtcDay(toIso)
  if (from === null || to === null) return null
  return Math.round((to - from) / DAY_MS)
}

// ── הקצב האישי (מ21 · §🧾ח7) ─────────────────────────────────────────────────

/**
 * המרווחים בימים בין אירועים עוקבים של אותו לקוח, בסדר עולה של תאריך.
 *
 * 🔑 **המיון הוא חלק מההגדרה ולא ניקיון:** סדר-ההגעה מהמסד אינו מובטח, ומרווח שלילי
 * אחד היה מזיז את החציון ומכבה את הדגל בשקט.
 *
 * @param {string[]} eventDates תאריכי `YYYY-MM-DD` של אירועים **שהתקיימו ולא בוטלו**
 * @returns {number[]} `n−1` מרווחים; פחות משני אירועים ⇒ `[]`
 */
export function consecutiveGaps(eventDates) {
  const days = (eventDates ?? []).map(toUtcDay).filter((value) => value !== null)
  days.sort((a, b) => a - b)
  const gaps = []
  for (let i = 1; i < days.length; i += 1) {
    gaps.push(Math.round((days[i] - days[i - 1]) / DAY_MS))
  }
  return gaps
}

/**
 * "הקצב שלו" — **חציון** המרווחים, לא ממוצע.
 *
 * 🔴 **החציון הוא ההכרעה** (`cards-customers.md` ⑥ מ21): אירוע חד-פעמי אחרי שנתיים
 * שקט היה מותח ממוצע ומכבה את הדגל אצל לקוחה שמזמינה כל חודש — כלומר בדיוק אצל מי
 * שהדוח קיים בשבילה.
 *
 * @returns {number|null} `null` כשאין ולו מרווח אחד — **לעולם לא 0**, שנקרא כ"מזמין כל יום"
 */
export function personalCadence(eventDates) {
  const gaps = consecutiveGaps(eventDates)
  if (gaps.length === 0) return null
  return medianOf(gaps)
}

/**
 * הסיווג של §🧾ח7 — **שני תנאים יחד**: אין אירוע עתידי, **וגם** השתיקה ארוכה מפי
 * `multiplier` מהקצב האישי; ובנוסף רצפת-אוכלוסייה של `minEvents` אירועים שהתקיימו.
 *
 * 🔴 **המכפיל מגיע מבחוץ ואין לו ברירת-מחדל** (`מכפיל_מרווח_מתרחק`, ת6 · C5): שורה
 * חסרה ב-`params` מחזירה `drifting: null` — *"חסר פרמטר מערכת"* ולא `false`, שהיה
 * נקרא על המסך כ"אין לקוחות מתרחקים".
 *
 * ⚠️ **חציון-מרווח 0** (שני אירועים באותו יום) ⇒ היחס `null` והלקוח **אינו** מסומן;
 * הוא נשפט בכלל-הרדום בלבד (`cards-customers.md` ⑦ מ21). בלי הסייג הזה `days > 1.5 × 0`
 * היה מסמן כמעט כל לקוח.
 *
 * @returns {{eligible: boolean, drifting: boolean|null, reason: string|null,
 *   cadence: number|null, daysSince: number|null, ratio: number|null,
 *   missedByFixedThreshold: boolean|null}}
 */
export function classifyDrifting({
  heldEventDates,
  hasFutureEvent,
  todayIso,
  multiplier,
  minEvents = 3,
  fixedThresholdDays = 120,
}) {
  const held = (heldEventDates ?? []).filter((value) => toUtcDay(value) !== null)
  const cadence = personalCadence(held)
  const lastEvent = held.length ? held.slice().sort()[held.length - 1] : null
  const daysSince = lastEvent ? daysBetween(lastEvent, todayIso) : null
  const ratio = cadence ? daysSince / cadence : null
  const base = { eligible: held.length >= minEvents, cadence, daysSince, ratio }

  if (!base.eligible)
    return { ...base, drifting: false, reason: 'belowMinEvents', missedByFixedThreshold: null }
  if (hasFutureEvent)
    return { ...base, drifting: false, reason: 'hasFutureEvent', missedByFixedThreshold: null }

  const factor = finiteNumber(multiplier)
  if (factor === null)
    return { ...base, drifting: null, reason: 'missingMultiplier', missedByFixedThreshold: null }
  if (!cadence || daysSince === null)
    return { ...base, drifting: false, reason: 'noCadence', missedByFixedThreshold: null }

  const drifting = daysSince > factor * cadence
  return {
    ...base,
    drifting,
    reason: null,
    // "נתפס **רק** בקצב האישי": מסומן כאן, ובכל זאת מתחת לסף האחיד שכבר במערכת.
    missedByFixedThreshold: drifting ? daysSince <= fixedThresholdDays : false,
  }
}

/**
 * עמודת-הדגל, **בטקסט ולא בצבע בלבד** (📐19 · 📑ב#18 · `cards-customers.md` ① מ21).
 * `null` = אין דגל, ואז התא ריק ולא "תקין" — אין תווית חיובית לעובדה טובה (🔒).
 */
export function driftingFlagLabel({ drifting, dormant }) {
  if (drifting && dormant) return 'מתרחק · גם רדום'
  if (drifting) return 'מתרחק בלבד'
  if (dormant) return 'רדום'
  return null
}

// ── שביעות-רצון (מ19 · מ20) ──────────────────────────────────────────────────

/**
 * חתך-**הלקוחות** של מ19: ממוצע הציונים של אותו לקוח ⇒ `4.5+` · `3.5–4.4` · מתחת ל-3.5.
 *
 * ⚠️ **זהו חתך של לקוחות ואינו "שיעור המרוצים"** (הכרעת-ישי 10/09/2026): שיעור-המרוצים
 * סופר **משובים** בציון 4–5. אותה מילה, שני מונים — ולכן שתי פונקציות ושני שמות.
 * 🔴 **סף-המדגם חל כאן** (📐12): מתחת ל-`minSample` משובים הלקוח **אינו בדלי** ונספר
 * במונה-החוץ הגלוי; `null` ולא "לא-מרוצה".
 */
export function satisfactionBucket(averageScore, feedbackCount, minSample) {
  const average = finiteNumber(averageScore)
  const count = finiteNumber(feedbackCount)
  const floor = finiteNumber(minSample)
  if (average === null || count === null || floor === null || count < floor) return null
  if (average >= 4.5) return 'satisfied'
  if (average >= 3.5) return 'middle'
  return 'unsatisfied'
}

/**
 * "שיעור המרוצים (4–5)" — **מדד ההחלטה** של מ20 (📑ב#17), באחוזים.
 * מכנה אפס ⇒ `null`: *"אין משובים"* אינו *"אף אחד לא מרוצה"*.
 */
export function satisfiedShare({ satisfiedCount, completedCount }) {
  const satisfied = finiteNumber(satisfiedCount)
  const completed = finiteNumber(completedCount)
  if (satisfied === null || !completed) return null
  return (satisfied / completed) * 100
}

/**
 * "שיעור המענה למשוב" (§🧾ח8-6) — מילאו ÷ (מילאו + נשלחו-ולא-נענו), באחוזים.
 * 🔴 **`not_sent` אינו במכנה** — אוכלוסייה אחרת מזו של שיעור-המרוצים, וזה כתוב על המסך.
 */
export function responseRate({ completedCount, noResponseCount }) {
  const completed = finiteNumber(completedCount)
  const noResponse = finiteNumber(noResponseCount)
  if (completed === null || noResponse === null) return null
  const denominator = completed + noResponse
  if (!denominator) return null
  return (completed / denominator) * 100
}

// ── היסטוגרמת-הקצב (מ21) ─────────────────────────────────────────────────────

/**
 * דליי-המרווחים של מ21 — **רוחב מוצהר** (📑ב#18), והדלי האחרון פתוח.
 *
 * 🔑 **הגבול שייך לדלי התחתון** — `(lo, hi]`: מרווח של 30 יום יושב בדלי `0–30`, לא
 * בדלי `31–60`. זו הקונבנציה שמשחזרת את המדידה הרשומה (‏401 · 98 · 61 · 36 · 20 · 16 · 44
 * על 676 מרווחים, `cards-customers.md` §③ מ21); חלוקה ב-`floor` מחזירה 399 · 96 · 64 ·
 * 35 · 20 · 17 · 45 — אותו סך, דליים אחרים.
 * ⚠️ **ומרווח 0** (שני אירועים באותו יום, קיים בדאטה) נספר בדלי הראשון.
 */
export function cadenceHistogram(gaps, { bucketWidth = 30, bucketCount = 7 } = {}) {
  const buckets = []
  for (let i = 0; i < bucketCount; i += 1) {
    const from = i === 0 ? 0 : i * bucketWidth + 1
    const last = i === bucketCount - 1
    buckets.push({
      index: i,
      from,
      to: last ? null : (i + 1) * bucketWidth,
      open: last,
      label: last ? `${from}+` : `${from}–${(i + 1) * bucketWidth}`,
      count: 0,
    })
  }
  for (const value of gaps ?? []) {
    const gap = finiteNumber(value)
    if (gap === null || gap < 0) continue
    const raw = gap <= 0 ? 0 : Math.ceil(gap / bucketWidth) - 1
    buckets[Math.min(raw, bucketCount - 1)].count += 1
  }
  return buckets
}

// ── מטריצת ההסכמה אדם↔מודל (מ22 · ת2) ────────────────────────────────────────

const REASONS_BY_SIDE = {
  negative: FEEDBACK_NEGATIVE_REASONS,
  positive: FEEDBACK_POSITIVE_REASONS,
}

/**
 * "מה הלקוח תייג מול מה המודל מצא" — שורה לכל תגית-לקוח, עמודה לכל נושא-מודל.
 *
 * 🔴 **צד אחד בכל קריאה, ובכוונה** (מיגרציה A, הערת-הטבלה): `'אחר'` קיים **בשתי**
 * הרשימות, ומטריצה אחת לשני הצדדים לא יכולה לומר אם "אחר" היה תלונה או מחמאה — וזו
 * בדיוק ההשוואה שהדף קיים בשבילה.
 * 🚫 **תגית שאינה ברשימה הסגורה אינה מייצרת שורה** — הטקסונומיה אינה מתעדכנת מהמודל (§4.5).
 * 📐7 — מיון לפי הספירה יורד, **ו-"אחר" אחרון תמיד**, גם כשהוא הגדול.
 *
 * @param {{humanTags?: string[], modelTopics?: string[], unclassifiable?: boolean}[]} rows
 */
export function agreementMatrix(rows, { side = 'negative' } = {}) {
  const reasons = REASONS_BY_SIDE[side] ?? []
  const byTag = new Map()

  for (const row of rows ?? []) {
    const topics = (row?.modelTopics ?? []).filter((topic) => reasons.includes(topic))
    for (const tag of row?.humanTags ?? []) {
      if (!reasons.includes(tag)) continue
      if (!byTag.has(tag)) {
        byTag.set(tag, { humanTag: tag, total: 0, agreed: 0, unclassifiable: 0, byTopic: {} })
      }
      const entry = byTag.get(tag)
      entry.total += 1
      if (row?.unclassifiable) entry.unclassifiable += 1
      if (topics.includes(tag)) entry.agreed += 1
      for (const topic of topics) {
        entry.byTopic[topic] = (entry.byTopic[topic] ?? 0) + 1
      }
    }
  }

  return [...byTag.values()].sort((a, b) => {
    if ((a.humanTag === 'אחר') !== (b.humanTag === 'אחר')) return a.humanTag === 'אחר' ? 1 : -1
    return b.total - a.total
  })
}

// ── קצב-התשלום לפי סוג-לקוח (מ19 אריח ④) ─────────────────────────────────────

/**
 * שורות אריח "קצב-התשלום תלוי בסוג הלקוח", ממוינות לפי המדד המוצג — **האיטי ראשון** (📐7).
 *
 * 🔑 **ה-RPC מחזיר את המפתח (`government`) ולא את התווית** — התווית היא SSOT של
 * `src/lib/customers.js`, ומחרוזת-עברית שנכתבת גם ב-SQL הייתה נפרדת ביום שהמילון ישתנה.
 * 🚫 **סוג בלי חשבוניות ששולמו אינו בשורה** (`cards-customers.md` ① מ19) — "—" כאן היה
 * נקרא כ"משלמים מיד".
 */
export function paymentCadenceRows(rows) {
  return (rows ?? [])
    .map((row) => ({
      customerType: row?.customer_type ?? null,
      label: CUSTOMER_TYPE_LABELS[row?.customer_type] ?? row?.customer_type ?? null,
      medianDays: finiteNumber(row?.median_days),
      invoiceCount: finiteNumber(row?.invoice_count),
      customerCount: finiteNumber(row?.customer_count),
    }))
    .filter((row) => row.medianDays !== null)
    .sort(
      (a, b) => b.medianDays - a.medianDays || String(a.label).localeCompare(String(b.label), 'he'),
    )
}
