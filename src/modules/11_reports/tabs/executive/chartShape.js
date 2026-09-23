// 🧭 **שתי טרנספורמציות-גרף שנשארו ללשונית "הנהלה" — וכל השאר נמחק.**
//
// 🔴 **מה היה כאן עד 16/09 11:1X, ולמה אינו כאן יותר:** הקובץ נשא חמישה מעקפים שהלשונית
// בנתה סביב פערים ברכיבים המשותפים — ‏`withRowDoors` (שורה לחיצה) · `withTileSubRows`
// (‏`tiles[].sub` שלא רונדר) · `withCompareFormat` (‏📐4 על חצי-ההשוואה) · `useSurfaceDoors`
// (נתב-דלתות משלה). **השכבה המשותפת קלטה את חמשתם** (‏`KpiTile` · `ReportSurface` ·
// `ReportsPage`, קומיט `11f347a9`), ו**מעקף ששרד את הפער שיצר אותו הוא תצוגה כפולה**:
// שתי שורות-`sub` באריח, שתי שורות-תקרה מעל הטבלה, ושני נתבים עם שני כללי-ניווט שונים.
// ⇒ **נמחקו.** מה שנשאר כאן הוא רק מה שעדיין אין לו בית משותף.
//
import { isolateLtr } from '@/lib/reportsFormat'

// 🚫 **ואין כאן JSX ואין רכיב** — ‏`react-refresh/only-export-components` הוא שגיאה בשער,
// ולכן היגיון וקומפוננטות חיים בשני קבצים.

/**
 * מפעיל טרנספורמציה על גרף יחיד או על מערך-גרפים, **בלי לשנות את צורת `chart`** (C8):
 * אובייקט נשאר אובייקט, מערך נשאר מערך באותו אורך.
 */
export function withCharts(payload, transform) {
  const { chart } = payload
  if (!chart) return payload
  const next = Array.isArray(chart) ? chart.map(transform) : transform(chart, 0)
  return { ...payload, chart: next }
}

/** ‏`'2026-09-16'` ⇒ `16` · ‏`'2026-09-16'` ⇒ `'16/09'`. **נגזר מה-`window` שהשרת החזיר
 * ולעולם לא מ-`new Date()`** — מוקש-השעון של `src/CLAUDE.md`: מסך שנטען אחרי חצות היה
 * מצהיר אורך-תקופה שגוי. */
// 🚫 **לא מיוצא** — הצרכן היחיד הוא `withPartialMonth` שמתחתיו, ו-knip תופס ייצוא
// ספקולטיבי בצדק (התקדים: `isolatedShekels` ב-`src/lib/hostesses.js`).
function dayOfMonth(isoDate) {
  const day = Number(isoDate?.slice(8, 10))
  return Number.isFinite(day) && day > 0 ? day : null
}

/**
 * 🔴 **מקטע-זמן שאינו שווה לשאר מוצהר בשלושה ערוצים, בדיוק כמו במוקאפ המאושר:**
 * ‏① `is_today: true` על השורה ⇒ ‏`ChartCard.todayCellProps` מצייר את העמודה **חלולה
 *    ומקווקוות** בלי לשנות את הגוון (📐19) · ② **התווית** נושאת את אורך-החלון בפועל ·
 * ‏③ ו-`chart.note` אומר זאת במילים בתוך כרטיס-הגרף, במקום שבו `.chart-note` יושב במוקאפ.
 * 🔑 **עמודה אחרונה בגובה ⁦60%⁩ מקודמתה נקראת כירידה** — וזו בדיוק ההטעיה ש-📐20 קיים כדי
 * למנוע. **שלושת הערוצים ולא אחד**, כי כל אחד לבדו נעלם למישהו: הצורה לעיוור-צבעים,
 * התווית לסורק-מהיר, וההערה לקורא-המסך.
 *
 * ⚠️ **ו-`xKey` עובר ל-`label` תמיד** — התווית המוצהרת חייבת להיות זו שעל הציר, ולכן גם
 * השורות המלאות מקבלות `label` (מה-`label` שלהן אם יש, אחרת מערך-הציר עצמו).
 * 🚫 שום שורה אינה נמחקת ושום מפתח אינו יורד; `partial` נשאר במקומו.
 */
function withPartialSegment(chart, { labelOf, note }) {
  if (!chart.data?.some((row) => row.partial)) return chart
  const data = chart.data.map((row) => {
    const label = row.label ?? String(row[chart.xKey])
    return row.partial ? { ...row, is_today: true, label: labelOf(row, label) } : { ...row, label }
  })
  return { ...chart, data, xKey: 'label', note }
}

/**
 * 📐20 · **חודש חלקי** — הצורה שמ2 (גרף-החודשים) ומ3 ברמת-הדריל הראשונה חולקים מילה-במילה.
 * ‏🔴 **ולכן היא כאן ולא פעמיים:** ‏jscpd מדד את שני העותקים (6 שורות · 58 טוקנים) ברגע
 * שהשני נכתב, ו-§2ב C6 קובע שהסף הזה הוא מבנה ולא משמעת.
 */
export function withPartialMonth(chart, windowTo) {
  const days = dayOfMonth(windowTo)
  if (!days) return chart
  return withPartialSegment(chart, {
    labelOf: (row, label) => `${label} (${isolateLtr(String(days))} ימים)`,
    // ✏️ 23/09/2026 (פזה ב׳) — קוצר מ-~150 תווים: הערוץ השלישי של 📐20 צריך לומר **למה העמודה
    // נמוכה**, לא לתאר את הציור (כ7: הצדקה-לחריגה נשארת, הצהרת-ציות יורדת).
    note: `החודש האחרון חלקי — ${isolateLtr(String(days))} ימים בלבד, ולכן העמודה שלו נמוכה.`,
  })
}
