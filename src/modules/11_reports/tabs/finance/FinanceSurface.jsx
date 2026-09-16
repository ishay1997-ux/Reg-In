// 🧱 **משטח-כספים אחד, ארבע פעמים** — ההפרש בין מ7 · מ8 · מ9 · מ12 הוא שורה ב-
// `FINANCE_SURFACE_SPECS` (`financePayload.jsx`) ולא רכיב נוסף.
//
// 🔴 **למה זה נכתב ככה ואינו "אלגנטיות":** האדנדום §2 מזהיר במפורש ש**ארבעה משטחים שכל
// אחד בונה את אותן חמש נקודות-הרחבה יפילו את jscpd (סף 3%)** — וההפרש ביניהם באמת הוא
// דאטה: אילו מפתחות-רמז, איזו עמודה ממוינת, והאם יש אריח-צד או דלת. ⇒ **רכיב אחד.**
//
// 🔑 **ומה שהוא בכוונה אינו עושה:** אינו מצייר אריח · גרף · טבלה · ייצוא · מעטפת. כל אלה
// שייכים ל-`ReportSurface` ולרכיבים המשותפים (§2ב C6 — **הדרך היחידה**), והרכיב הזה רק
// ממלא את חמש נקודות-ההרחבה שלהם.

import { useCallback, useMemo } from 'react'
import Hint from '@/components/Hint'
import Ltr from '@/components/Ltr'
import KpiTile from '../../components/KpiTile'
import ReportSurface from '../../components/ReportSurface'
import { transformFinancePayload } from './financePayload'

// 🚪 יעד-הדלת של הקישור "כל N החשבוניות הפתוחות →" (מ7 ⇐ מ9, 📑ב).
// שם-ה-RPC מועתק מ-`reportsCatalog.js` ואינו נבנה מתבנית — שם שנגזר נשבר בשקט.
const AGING_TARGET = Object.freeze({ tab: 'כספים', report: 'report_m09_aging', drill: null })

// 🔤 שתי המחרוזות היחידות שהרכיב כותב, ושתיהן **מועתקות מה-payload של אותו דף**:
// `window: "נכון להיום"` ו-`compare.label: "לפני חודש"` חוזרות באריחי מ9 מילה-במילה.
const AS_OF_TODAY = 'נכון להיום'
const PREVIOUS_MONTH = 'לפני חודש'

function HintRow({ ids }) {
  if (!ids?.length) return null
  return ids.map((id) => <Hint key={id} id={id} />)
}

// 📐1 — כיוון החץ בלבד; **הצבע אינו משתנה** (`KpiTile` אוכף זאת), ואין ירוק לעובדה-טובה.
function compareDirection(value, previous) {
  if (typeof value !== 'number' || typeof previous !== 'number') return 'flat'
  if (value > previous) return 'up'
  if (value < previous) return 'down'
  return 'flat'
}

/**
 * מ9 · אריח **"שוטף — עוד לא באיחור"**, צמוד לגרף ולא בשורת-האריחים.
 *
 * 🔑 **למה הוא מגיע מ-`meta.current_tile` ולא מ-`tiles`:** הכרעת-ישי 07/09/2026 הוציאה את
 * "שוטף" **מהגרף** (הוא אינו חוב באיחור, והדף שואל *"את מי לגבות השבוע?"*) — אבל **הוא נשאר
 * מדרג לכל דבר בדריל-דאון**, ולכן האריח לחיץ. ה-RPC מחזיר אותו בנפרד בדיוק מהסיבה הזו.
 * ⚠️ **כל מספר כאן מגיע מה-payload**; מה שנגזר הוא כיוון-החץ בלבד (📐1).
 */
function CurrentBucketTile({ currentTile, onOpen }) {
  if (!currentTile) return null
  const tile = {
    key: 'current_bucket',
    label: currentTile.label,
    value: currentTile.value,
    format: 'money',
    window: AS_OF_TODAY,
    compare:
      currentTile.compare_value == null
        ? null
        : {
            label: PREVIOUS_MONTH,
            value: currentTile.compare_value,
            format: 'money',
            direction: compareDirection(currentTile.value, currentTile.compare_value),
          },
    target: currentTile.drill ?? null,
  }
  return (
    <div className="mb-3 flex flex-wrap gap-3" data-testid="aging-current-tile">
      <KpiTile tile={tile} onOpenTarget={onOpen} />
    </div>
  )
}

/**
 * מ7 · **הצהרת-הקיצוץ + הדלת לדוח-הגיול** — 📑ב: במבט-על מציגים את ארבע החשבוניות הישנות
 * ביותר ואז קישור *"כל N החשבוניות הפתוחות →"*.
 *
 * 🔴 **למה ההצהרה חייבת להיות כאן, ולמה היא נקראת מ-`meta.open_invoice_count`:** הטבלה
 * הזו היא **היחידה בארבעת משטחי-הכספים שמקוצצת** — ה-RPC מחזיר `limit 4` מתוך 35 חשבוניות
 * פתוחות. ‏📐8 קובע שהפאג'ר סופר את מה שמוצג, ולכן הוא אומר *"1–4 מתוך 4"* — נכון, אבל
 * לבדו הוא נקרא כאילו יש **ארבע** חשבוניות פתוחות בעולם. ⇒ המספר האמיתי חייב להיאמר בקול.
 * ⚠️ **והמפתח אינו `meta.row_total`:** ארבעת משטחי-הכספים אינם מחזירים אותו כלל *(נמדד חי
 * 16/09/2026 — לשונית-ההנהלה כן, וזה אותו רעיון בשני מפתחות)*; מ7 מצהיר את הסך שלו
 * ב-`meta.open_invoice_count`. **שני המספרים מגיעים מה-payload ואף אחד אינו מוקלד.**
 * 🔤 החץ `→` הוא תקדים-קוד חי (`CustomerDetailsPage.jsx:1332`, *"לכרטיס →"*) ולא בחירה.
 */
function RowCapAndDoor({ shown, total, onOpen }) {
  if (!total) return null
  return (
    <p className="mt-1 text-[12.5px] text-slate-500" data-testid="finance-row-cap">
      {/* ⚠️ המשפט נאמר **רק כשבאמת קוצץ**. אילו הטבלה הציגה את כל החשבוניות, *"אלה 35 מתוך
          35"* היה רעש — ו"אין צורך להציג למשתמש אובר מידע" (‏ishay-visual-taste, 01/08). */}
      {shown < total && (
        <>
          אלה <Ltr>{shown}</Ltr> החשבוניות הישנות ביותר מתוך <Ltr>{total}</Ltr> הפתוחות.{' '}
        </>
      )}
      <button
        type="button"
        onClick={() => onOpen(AGING_TARGET)}
        className="font-semibold text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        data-testid="finance-open-invoices-door"
      >
        כל <Ltr>{total}</Ltr> החשבוניות הפתוחות →
      </button>
    </p>
  )
}

export default function FinanceSurface({ surface, spec, filters, drill, onDrill, onWindow }) {
  // הכרעה 19 — ר' `rowsOpenProject` ב-`FINANCE_SURFACE_SPECS`. **עותק ולא מוטציה**:
  // `REPORT_TABS` קפוא, והמעטפת ממשיכה להחזיק את המקור.
  const effectiveSurface = useMemo(
    () => (spec.rowsOpenProject ? { ...surface, drill: true } : surface),
    [surface, spec.rowsOpenProject],
  )
  const transformPayload = useCallback((payload) => transformFinancePayload(payload, spec), [spec])

  return (
    <ReportSurface
      surface={effectiveSurface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      transformPayload={transformPayload}
      renderTop={() => <HintRow ids={spec.hints.top} />}
      renderBeforeChart={(payload) => (
        <>
          <HintRow ids={spec.hints.chart} />
          {spec.currentBucketTile && (
            <CurrentBucketTile currentTile={payload.meta?.current_tile} onOpen={onDrill} />
          )}
        </>
      )}
      renderBeforeTable={() => <HintRow ids={spec.hints.table} />}
      renderExtras={(payload) => (
        <>
          {spec.openInvoicesDoor && (
            <RowCapAndDoor
              shown={payload.rows?.length ?? 0}
              total={payload.meta?.open_invoice_count ?? payload.population?.n}
              onOpen={onDrill}
            />
          )}
          <HintRow ids={spec.hints.extras} />
        </>
      )}
    />
  )
}
