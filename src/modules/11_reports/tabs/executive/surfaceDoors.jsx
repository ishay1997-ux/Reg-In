// 🧭 **הניתוב והטרנספורמציות של ארבעת משטחי "הנהלה".**
//
// 🔴 **למה קובץ נפרד מ-`surfaceKit.jsx`, וזו אינה חלוקה אסתטית:** ‏`react-refresh/
// only-export-components` הוא **שגיאה** בשער של הריפו — קובץ שמייצא גם רכיב וגם פונקציה
// מאבד רענון-חם, והכלל נאכף ולא מומלץ. ⇒ **הקובץ הזה מייצא פונקציות בלבד** (אפס רכיבים
// מיוצאים, ולכן הכלל אינו חל), והרכיבים יושבים ב-`surfaceKit.jsx`.
//
// 🔑 **ומה שאינו כאן בכוונה:** אין כאן ידע על משטח מסוים — לא מספר, לא שם-דוח, לא מפתח-רמז.
// המשטח יודע מה הוא מציג; הקובץ הזה יודע **איך** הלחיצה והמטען מתורגמים.

import { useNavigate, useSearchParams } from 'react-router-dom'
import { REPORT_TABS } from '../../reportsCatalog'

// ── דלתות (הכרעה 33 · הכרעה 19) ──────────────────────────────────────────────

// 🔑 **מיפוי ולא גזירה:** ‏`tiles[].target` נוקב ב-`{tab: '<תווית עברית>', report: '<שם ה-RPC>'}`
// (C8), בעוד הכתובת נושאת `tab=<key>` ו-`report=<slug>`. הצמד נשלף מהקטלוג — שם-RPC שנגזר
// לפי תבנית היה נשבר בשקט ביום שבו משטח ייקרא אחרת.
function locateTarget(target) {
  for (const tab of REPORT_TABS) {
    if (tab.label !== target.tab) continue
    const surface = tab.surfaces.find((s) => s.rpc === target.report)
    if (surface) return { tabKey: tab.key, slug: surface.slug }
  }
  return null
}

/**
 * מנתב-הלחיצות היחיד של הלשונית — עוטף את `onDrill` של המעטפת ומפריד בין **שלוש** משמעויות
 * שכולן מגיעות דרך אותו callback:
 * ‏① `tiles[].target` — **דלת לדף אחר** (הכרעה 33), גם חוצת-לשונית ⇒ כותב `tab`/`report`
 *    בכתובת. ⚠️ ‏`onDrill` של המעטפת כותב **רק** `drill`, ולכן יעד-אריח שהיה נמסר לו היה
 *    נוחת ב-`p_drill` של אותו דוח ומחזיר תשובה על פרמטר-זבל. **זו הסיבה לעטיפה.**
 * ‏② `drill_key` של שורה שמצביעה על **מסך אחר** (`project`/`quote`) ⇒ ניווט אמיתי.
 * ‏③ כל השאר (`year`/`month`/`tier`/פירור/`null`) ⇒ מצב-הדוח, כלומר `onDrill` המקורי.
 *
 * 🔴 **הכתובת היא מקור-האמת** (📐13④ · S-18), ולכן הכתיבה כאן היא לאותה כתובת שהמעטפת
 * קוראת — ולא קריאה פנימה אל `ReportsPage`.
 */
export function useSurfaceDoors(onDrill) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()

  function openReport({ tabKey, slug }) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tabKey)
        next.set('report', slug)
        // מעבר-דף מאפס רמה ועמוד — רמת-דריל של דוח אחד אינה קיימת בדוח אחר.
        next.delete('drill')
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return (next) => {
    if (!next) return onDrill(null)
    if (next.tab) {
      const found = locateTarget(next)
      // יעד שאינו בקטלוג (דוח נדחה, למשל) — **לא מנווטים לשום מקום** ולא זורקים.
      if (found) openReport(found)
      return
    }
    if (next.kind === 'project' && next.id) return navigate(`/projects/${next.id}`)
    if (next.kind === 'quote' && next.id) return navigate(`/quotes/${next.id}/edit`)
    return onDrill(next)
  }
}

/**
 * 🔴 **הכרעה 19 — "השורה כולה לחיצה" — חלה על כל משטח שיש לשורותיו `drill_key`, ולא רק על
 * דוח-דריל.** ‏`ReportSurface` מוסר ל-`ReportTable` את `onDrill` **רק כש-`surface.drill`**,
 * ו-`surface.drill` מסמן ב-C8 משהו אחר לגמרי: **רמות-קידוח היררכיות** (📐13). ⇒ בשלושת
 * המשטחים שאינם דוח-דריל (מ2 · מ4 · מ6) השורות היו יוצאות בלתי-לחיצות, בעוד ה-RPC מחזיר
 * להן `drill_key` לכרטיס-האירוע/להצעה.
 * **העטיפה כאן היא מה שהלשונית יכולה לעשות בלי לגעת ברכיב משותף**; הפירורים אינם מושפעים,
 * כי `DrillCrumbs` מחזיר `null` בפחות משתי רמות ו-`payload.drill` של השלושה הוא `null`.
 * 📄 **התיקון הנכון, לדיווח:** ‏`ReportSurface` ימסור `onDrill` תמיד — ‏`ReportTable.Row` כבר
 * בודק בעצמו `Boolean(onDrill && row.drill_key)`.
 */
export function withRowDoors(surface) {
  return { ...surface, drill: true }
}

// ── טרנספורמציות-מטען (C8 ⇒ מה שהרכיבים המשותפים באמת מרנדרים) ───────────────

/**
 * 🔴 **`tiles[].sub` ו-`tiles[].compare.note` הם שדות-C8 מאושרים ש-`KpiTile` אינו מרנדר.**
 * ‏C8 (תיקון 16/09) כותב עליהם *"Tab builders render them when present"*, והם נושאים את
 * **המכנה הגלוי** של 📑ב — *"‏1,150,574 ₪ רווח מתוך 1,962,981 ₪ הכנסה"*, *"305 אירועים"*.
 * בלעדיהם אריח מציג אחוז בלי לומר על מה הוא נמדד, וזה בדיוק מה ש-📑ב נולד למנוע.
 * ⇒ **הם מקופלים לשתי השורות שהאריח כן מרנדר**: `sub` לשורת-החלון (📐3), ו-`note` לתווית
 * ההשוואה. 🚫 **שום מפתח אינו נמחק** — ‏`sub`/`note` נשארים במטען כפי שהיו.
 * 📄 **התיקון הנכון, לדיווח:** ‏`KpiTile` ירנדר את שניהם כשורות משלהם.
 */
function foldTileSubRows(tile) {
  const lines = [tile.compare?.note, tile.window, tile.sub].filter(Boolean)
  const compare = tile.compare ? withCompareFormat(tile.compare, tile.format) : tile.compare
  return { ...tile, window: lines.length ? tileSubLines(lines) : null, compare }
}

/**
 * 🔴 **חצי-ההשוואה של 📐1 נמדד בדפדפן כשובר את 📐4 — וזה פגם אמיתי, לא טעם.**
 * ‏`CompareLine` מעצב דרך `formatByType(compare.value, compare.format)`, אבל **C8 אינו
 * מגדיר `format` בתוך `compare`** ⇒ הוא `undefined`, `formatByType` נופל ל-`text`,
 * והמסך הציג *"‏2025 באותו טווח: 1425658.65"* ו-*"55.9443559648728"* במקום
 * *"‏1,425,659 ₪"* ו-*"55.9%"* **(נמדד בצילום-מסך חי, 16/09/2026)**.
 * ⇒ **ההשוואה היא אותו מדד כמו האריח בהגדרתה**, ולכן היא יורשת את `tile.format`.
 * 📄 **התיקון הנכון, לדיווח:** או ש-C8 יוסיף `compare.format`, או ש-`KpiTile` ייפול
 * ל-`tile.format` בעצמו — שניהם מחוץ לבעלות של הלשונית הזו.
 */
function withCompareFormat(compare, tileFormat) {
  return compare.format ? compare : { ...compare, format: tileFormat }
}

/**
 * 🔴 **שלוש שורות ולא מחרוזת אחת ארוכה — וזו מדידה, לא טעם.** הגרסה הראשונה שרשרה את
 * `window`, `sub` ו-`compare.note` למחרוזת אחת, **ונמדד בדפדפן (1280px, 16/09/2026):**
 * רצועת-האריחים של מ2 תפחה ל-**שלוש שורות** ולאריחים ברוחב ⁦248⁩–⁦535⁩px, בעוד ⑩ של
 * הכרטיס מודד *"ארבעת האריחים על שורה אחת"* וגובה-רצועה ⁦192⁩px. ⇒ **הטקסט נשבר לשורות
 * ורוחבו חסום**, והאריח חוזר לרוחב המוכר.
 * ⚠️ ‏`KpiTile` מרנדר את `tile.window` כילד, ולכן צומת עובדת כאן בדיוק כמו מחרוזת.
 * 📄 **התיקון הנכון, לדיווח:** ‏`KpiTile` ירנדר `sub`/`compare.note` כשורות משלו עם
 * אותה חסימת-רוחב, ואז הלשונית תמסור מחרוזות בלבד.
 */
function tileSubLines(lines) {
  return (
    <span className="block max-w-[210px]">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  )
}

export function withTileSubRows(payload) {
  return { ...payload, tiles: payload.tiles.map(foldTileSubRows) }
}

/** מפעיל טרנספורמציה על גרף יחיד או על מערך-גרפים, **בלי לשנות את צורת `chart`** (C8). */
export function withCharts(payload, transform) {
  const { chart } = payload
  if (!chart) return payload
  const next = Array.isArray(chart) ? chart.map(transform) : transform(chart, 0)
  return { ...payload, chart: next }
}

/**
 * מחליף את ציר-הקטגוריה למפתח שנושא תווית עברית. ‏`xKey` שמצביע על מזהה גולמי
 * (`month: '2026-01-01'` · `tier: '1-5'`) מצייר ציר שקריא רק למי שכתב את השאילתה,
 * בעוד אותה שורה כבר נושאת `label` עברי. **מיפוי-תוויות הוא תפקיד מוצהר של `transformPayload`.**
 */
export function withLabelAxis(chart, labelKey = 'label') {
  if (chart.xKey === labelKey) return chart
  if (!chart.data?.length || !Object.hasOwn(chart.data[0], labelKey)) return chart
  return { ...chart, xKey: labelKey }
}
