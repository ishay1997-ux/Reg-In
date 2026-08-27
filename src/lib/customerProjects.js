// לוגיקה טהורה של לשונית-הפרויקטים בכרטיס-הלקוח (משטח 8, מודול 6 · על מסך מודול 2) —
// כלל 14: כל חישוב/משפט כאן, עם בדיקת-יחידה לצידו; הקומפוננטות (CustomerDetailsPage ·
// CustomersPage) רק מרנדרות. קובץ נפרד מ-src/lib/customers.js כי התלות כאן היא בנתוני-
// פרויקטים (מודול 6), לא בשדות-לקוח גרידא — ושני המסכים (כרטיס-לקוח + רשימת-לקוחות)
// צריכים בדיוק את אותה נוסחת-"רדום" ואת אותה נוסחת-"מבוטלים" (⑨: "אם נוסחה תיכתב
// פעמיים היא תסטה").

import { deriveQuoteAmount } from '@/lib/quotes'
// חשבון "התוספת לחיוב" של שינוי-תכולה — אותו קובץ שדיאלוג-שינוי-התכולה של מ6 משתמש בו,
// כדי שכרטיס-הלקוח והדיאלוג לא יוכלו להציג שני מספרים לאותו שינוי (כלל 14 · RC-6).
import { computeScopeChangeMoney, projectTotalAfterChange } from '@/lib/projectChanges'
import { eventDaysFromToday } from '@/lib/projects'
import { formatTimestampFull } from '@/lib/dates'
import { CANCEL_TYPE_LABELS } from '@/lib/projectCard'

// שם-פרמטר קבוע (🟢 RULED 120, שורש A6) — לעולם לא ערך מוקלד. משמש גם את אריח "אירוע
// אחרון" בכרטיס-הלקוח וגם את מסננת "רדומים" ברשימת-הלקוחות (A3) — מקום אחד לשם.
export const DORMANT_THRESHOLD_PARAM_NAME = 'סף_לקוח_רדום_ימים'

// "מתקרב" (⑥): תאריך טרם עבר (כולל היום עצמו) וגם לא בוטל. אותה הגדרה בדיוק משרתת גם
// את פיצול-הקטעים בלשונית וגם את תנאי (א) של "רדום" — הוצאה החוצה כדי ששתי הבדיקות
// לא יוכלו לסטות זו מזו.
function isUpcoming(project, todayIso) {
  return project.project_status !== 'cancelled' && project.final_event_date >= todayIso
}

// "התקיים" (⑥): בוטל — בלי קשר ללוח-השנה (㊲, ר' תיעוד-המוקאפ) — או שהתאריך עבר.
function isHappened(project, todayIso) {
  return project.project_status === 'cancelled' || project.final_event_date < todayIso
}

// שובר-שוויון יציב (project_id) בכל מיון — אותה מוסכמה כמו שאר המערכת (sortOverviewProjects
// וכו'), כדי שסדר-שווה לא יהיה תלוי בסדר-הגעה מהמסד.
function byDateThenId(dir) {
  return (a, b) => {
    if (a.final_event_date !== b.final_event_date) {
      return dir * (a.final_event_date < b.final_event_date ? -1 : 1)
    }
    return (a.project_id ?? 0) - (b.project_id ?? 0)
  }
}

// שני קטעי-הלשונית (⑥): מתקרבים — הקרוב ראשון; התקיימו — האחרון ראשון, **והמבוטלים
// תמיד בסוף הקטע** (גם אם תאריכם עתידי, כמו "ערב לקוחות VIP" במוקאפ — הסטטוס גובר).
export function splitCustomerProjectsByTimeline(projects, todayIso) {
  const list = projects ?? []
  const upcoming = list.filter((p) => isUpcoming(p, todayIso)).sort(byDateThenId(1))
  const happened = list.filter((p) => isHappened(p, todayIso))
  const notCancelled = happened
    .filter((p) => p.project_status !== 'cancelled')
    .sort(byDateThenId(-1))
  const cancelled = happened.filter((p) => p.project_status === 'cancelled').sort(byDateThenId(-1))
  return { upcoming, happened: [...notCancelled, ...cancelled] }
}

// אריח "מספר אירועים" (③.2): כל הפרויקטים כולל מבוטלים (⑧ item ב), עם כמה מהם בוטלו בנפרד.
export function eventCountSummary(projects) {
  const list = projects ?? []
  return {
    count: list.length,
    cancelledCount: list.filter((p) => p.project_status === 'cancelled').length,
  }
}

// שורת-המשנה המשותפת ל"מספר אירועים" ול-E3 ("סה"כ הצעות מאושרות", מונה-הביטולים ליד
// התווית) — לשון-יחיד/רבים כמו בכל המערכת. 0 ⇒ אין שורה כלל ("לא בכוח": שום דבר
// יוצא-דופן לא קרה, אין מה לדווח).
export function cancelledCountNote(count) {
  if (!count) return null
  return count === 1 ? 'אחד מהם בוטל' : `${count} מהם בוטלו`
}

// האירוע-האחרון (③.2): MAX(final_event_date) מבין הפרויקטים שתאריכם עבר ואינם מבוטלים.
function lastEventDate(projects, todayIso) {
  const past = projects.filter(
    (p) => p.project_status !== 'cancelled' && p.final_event_date < todayIso,
  )
  if (past.length === 0) return null
  return past.reduce(
    (max, p) => (p.final_event_date > max ? p.final_event_date : max),
    past[0].final_event_date,
  )
}

// "רדום" (③.2 ↳, שני תנאים ולא אחד): (א) אין ולו פרויקט-עתיד אחד — לקוח עם אירוע מתוכנן
// אינו רדום לא משנה מתי היה הקודם · וגם (ב) עברו יותר מ-הסף ימים מהאירוע-האחרון.
// הפונקציה הזו היא ה-SSOT: גם אריח "אירוע אחרון" בכרטיס-הלקוח וגם מסננת "רדומים"
// ברשימת-הלקוחות (A3) קוראים לה, כדי שההגדרה לא תיכתב פעמיים ותסטה.
export function isCustomerDormant(projects, todayIso, thresholdDays) {
  const list = projects ?? []
  if (list.some((p) => isUpcoming(p, todayIso))) return false
  const last = lastEventDate(list, todayIso)
  if (last == null || !Number.isFinite(thresholdDays)) return false
  const daysSince = -eventDaysFromToday(last, todayIso)
  return daysSince > thresholdDays
}

// שלושת מצבי אריח "אירוע אחרון" (③.2 + נספח ⑥ של המוקאפ): תאריך (רגיל/רדום) ·
// טרם-התקיים-אירוע (עם/בלי "הראשון מתוכנן ל-").
export function lastEventTileState(projects, todayIso, thresholdDays) {
  const list = projects ?? []
  const last = lastEventDate(list, todayIso)
  if (last == null) {
    const upcoming = list.filter((p) => isUpcoming(p, todayIso)).sort(byDateThenId(1))
    return { kind: 'neverHeld', nextDate: upcoming[0]?.final_event_date ?? null }
  }
  const daysAgo = -eventDaysFromToday(last, todayIso)
  return {
    kind: 'date',
    date: last,
    daysAgo,
    dormant: isCustomerDormant(list, todayIso, thresholdDays),
  }
}

// "בעוד N ימים" / "לפני N ימים" (③.3) — הצורה הקצרה שמצוירת במוקאפ של המשטח הזה.
// 🔴 בכוונה **שונה** מ-`eventPassedSentence`/`proximitySentence` שב-src/lib/projects.js:
// אלה נועלות "התקיים לפני N ימים" הארוך לשתי לשוניות-מבט-העל של מודול 6 עצמו (§3.7,
// שיקול "עמודה צרה" של אותו מסך) — משטח 8 יושב על עמוד של מודול 2 ומצייר את הצורה
// הקצרה במפורש (`08_customer_projects_tab_approved.html:373,418`), ואינו "אותה עמודה".
export function projectDaySentence(days) {
  if (days == null) return ''
  if (days === 0) return 'היום'
  if (days === 1) return 'מחר'
  if (days === -1) return 'אתמול'
  if (days > 0) return `בעוד ${days} ימים`
  return `לפני ${-days} ימים`
}

// שורת-המשנה של פרויקט מבוטל בטבלה: "בוטל <תאריך> · <סוג-ביטול> · "<סיבה>"".
// `cancelled_at` הוא `timestamptz` — formatTimestamp*Full כבר פותרת UTC⇔ישראל נכון (ר'
// src/lib/dates.js); לוקחים ממנה רק את חלק-התאריך כדי לא לשכפל את ההמרה.
export function cancellationSubLabel(project) {
  const full = formatTimestampFull(project?.cancelled_at)
  const dateLabel = full ? full.split(' ')[0] : ''
  const typeLabel = CANCEL_TYPE_LABELS[project?.cancel_type] ?? project?.cancel_type ?? ''
  const reason = project?.cancel_reason ? `"${project.cancel_reason}"` : ''
  return [dateLabel && `בוטל ${dateLabel}`, typeLabel, reason].filter(Boolean).join(' · ')
}

// סכום-השורה (③.3): ההצעה הקפואה דרך ה-SSOT (`deriveQuoteAmount`, src/lib/quotes.js)
// **ועוד "התוספת לחיוב" של שינויי-התכולה** (RC-6 / ה2, מודול 8 · צעד 4.2, 28/08/2026).
//
// 🔴 מגן על מלכודת-ה"0 ₪" (S-2): `project.quotes` (ה-embed) הוא `null` גם כש"אין הצעה"
// וגם כש-RLS חוסם את 'הצעות מחיר' — ובשני המקרים total חייב להיות `null` (⇒ '—' על
// המסך), לא 0 מחושב על `quote_services=[]`. בלי השומר הזה `deriveQuoteAmount(null, vat)`
// היה מחזיר total=0 (שורות ריקות ⇒ סכום-ביניים 0), שקר-בביטחון על עמודת-כסף.
//
// 🆕 **למה שינויי-התכולה חייבים להיכנס** (‏`screens-approved.md` של מ6, ③.3): *"ברגע
// ש-`project_changes` תיווצר, 'סכום' חייב להיות `הצעה + Σ שינויי-תכולה` — אחרת פרויקט
// שגדל ב-2,000 ₪ יוצג בכרטיס-הלקוח בסכום הישן"*. הטבלה קיימת מ-14/08 ⇒ התנאי התקיים.
//
// 🔑 **ואיזו נוסחה — לא נכתבה כאן שנייה:** ‏`computeScopeChangeMoney` + `projectTotalAfterChange`
// (‏`src/lib/projectChanges.js`) הן **בדיוק** החשבון שדיאלוג-שינוי-התכולה של מ6 מציג למנהלת
// לפני שהיא מאשרת ("התוספת לחיוב": סכום-השינוי ⇒ הנחת-ההצעה ⇒ לפני-מע"מ ⇒ מע"מ). העמודה
// הזו היא עמודת-**חיוב** ("הסכום הקפוא של ההצעה, **כולל מע"מ**"), ולכן היא חייבת להראות
// את אותו מספר שהוצג ואושר — לא חשבון שני. ⚠️ **וזה שונה מ-`revenue_delta` הגולמי של ה-RPC**,
// שהוא טרום-הנחה וטרום-מע"מ (‏`list_project_changes`) — ר' האזהרה ב-`ScopeChangeDialog.jsx:633`.
//
// ⚠️ **חוזה-הקלט של `project.project_changes` — שלושה מצבים, ואף אחד מהם אינו 0 שקט:**
//   מערך  ⇒ שורות `list_project_changes` (ריק = אין שינויים ⇒ סכום-ההצעה כמות-שהוא)
//   `null` ⇒ **לא ידוע** (קריאת-ה-RPC נכשלה) ⇒ הסכום כולו `null` ⇒ '—' על המסך
//   חסר    ⇒ אותו דין כמו `null`. **במכוון**: שורה שלא עברה דרך `getCustomerProjects`
//            אינה יודעת אם יש שינויים, וסכום-הצעה-בלבד היה נראה נכון לחלוטין ושקרי.
export function projectAmount(project, vatRate) {
  if (!project?.quotes) return null
  const { total } = deriveQuoteAmount(project.quotes, vatRate)
  const changes = project.project_changes
  if (!Array.isArray(changes)) return null
  if (changes.length === 0) return total
  // כסף ממוסך (‏`money_visible=false`) מגיע כ-null. זה **אמור** להיות בלתי-אפשרי כאן —
  // אותו שער 'הצעות מחיר' בדיוק חוסם גם את ה-embed `quotes` ⇒ יצאנו כבר למעלה — אבל
  // בלי הבדיקה הזו `computeScopeChangeMoney` הייתה **מדלגת** על השורה ומחזירה תוספת 0.
  if (changes.some((row) => row?.unit_price_snapshot == null || row?.delta_qty == null)) return null
  const money = computeScopeChangeMoney(
    changes.map((row) => ({
      deltaQty: row.delta_qty,
      unitPriceSnapshot: row.unit_price_snapshot,
    })),
    // ההנחות מגיעות מההצעה הקפואה עצמה — אותו מקור שהדיאלוג של מ6 קורא ממנו.
    project.quotes.applied_customer_discount,
    project.quotes.manual_discount,
    // המע"מ הקפוא גובר על החי — אותה קדימות בדיוק כמו ב-`deriveQuoteAmount` (§7.51).
    project.quotes.vat_rate_snapshot ?? vatRate,
  )
  return projectTotalAfterChange(total, money.total)
}

// חיפוש-הטבלה (⑦): שם-אירוע בלבד, סלחני, בלי אורך-מינימום ובלי ולידציה — כל מחרוזת
// חוקית כולל ריקה (= בלי סינון).
export function matchesProjectSearch(project, text) {
  const q = String(text ?? '')
    .trim()
    .toLowerCase()
  if (q === '') return true
  return String(project?.event_name ?? '')
    .toLowerCase()
    .includes(q)
}
