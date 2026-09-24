// משטח-דוח של לשונית "לקוחות" — **חיווט נקודות-ההרחבה של `ReportSurface`, פעם אחת
// לארבעת המשטחים.**
//
// 🔑 **למה רכיב אחד ולא ארבעה קבצים:** ‏`jscpd` נופל ב-3%, וארבעה קבצים שכל אחד בונה
// `<ReportSurface transformPayload renderTop renderBeforeChart renderBeforeTable
// renderExtras>` היו ארבעה עותקים של אותו שלד. **מה ששונה בין המשטחים הוא דאטה** (מפתחות
// ההטמעה) **ושלושה בלוקי-בסיס** — ולכן זה טבלה ותנאים, לא העתקה.
//
// 🔴 **מה שנמצא כאן הוא *בסיס* ולא שכבת-הטמעה** (מבחן-המחיקה של §⑩): בלוק "טרם אושרה ריצת-ניתוח" של מ22 חייב להיות גלוי **ברמה 0** — הכרטיס אומר
// זאת במפורש (*"הורדת ה-`basebanner` לשכבה תשבור את המבחן"*). הרמזים, ורק הם, יושבים
// ב-`<Hint>` ונעלמים ברמה 0.
//
// 🚫 **ושני סלוטים שהלשונית הזו אינה משתמשת בהם, במכוון:** ‏`renderChartAside` (אריח-צד
// לצד גרף) — אין בארבעת הכרטיסים אריח כזה · `renderChartFooter` (הערה בתוך כרטיס-הגרף) —
// הערות-הגרף של מ20 (*"הסולם כאן עצמאי"*) מגיעות מ-`chart.note` של השרת מאז i2, וכפילות
// בין שני מקורות לאותה הערה הייתה מדפיסה אותה פעמיים.
//
// ✂️ **נמחק בסבב-היישור 16/09 11:1X:** רינדור הגרפים שמעבר לתקרת-המעטפת. ‏`CHART_CAP`
// עלה מ-2 ל-4 (‏§9 D-28), והמוקאפ המאושר של מ20 מצייר בדיוק ארבעה ⇒ המעטפת מציירת את
// כולם, ושתי אתרי-רינדור לאותו גרף היו הופכים להכפלה ביום שהתקרה תזוז שוב.

import Hint from '@/components/Hint'
import { paymentCadenceRows } from '@/lib/reportsCustomers'
import { formatByType, formatIsraelDate, isolateLtr } from '@/lib/reportsFormat'
import ReportSurface from '../../components/ReportSurface'
import AnalysisRunBar from './AnalysisRunBar'
import { hasApprovedRun } from './payload'

// 🔒 **שמות-המפתחות מועתקים מטבלאות §⑩ של `cards-customers.md`** — ולא מה-HTML של המוקאפ,
// ששם הם יושבים ב-`data-hint` בקונבנציה שאינה מגיעה לייצור. **מפתח שגוי מרנדר `null`
// בשקט בייצור**, ולכן הם מרוכזים כאן בטבלה אחת שאפשר לבדוק מולה.
const HINTS = {
  מ19: {
    why: 'reports.customersOverview.why',
    basis: 'reports.customersOverview.tilesBasis',
    table: 'reports.customersOverview.tableSort',
  },
  מ20: {
    why: 'reports.satisfaction.why',
    basis: 'reports.satisfaction.reasonsBasis',
    table: 'reports.satisfaction.tableSort',
  },
  מ21: {
    why: 'reports.drifting.why',
    basis: 'reports.drifting.revenueBasis',
    table: 'reports.drifting.tableSort',
  },
  // מ22 · האות ג יושבת **בענף המצב-הריק בלבד** (⑩ג) ⇒ `emptyTiles` ולא `basis`.
  מ22: {
    why: 'reports.notes.why',
    gate: 'reports.notes.runGate',
    emptyTiles: 'reports.notes.tilesBasis',
  },
}

const findTile = (payload, key) => (payload.tiles ?? []).find((tile) => tile.key === key) ?? null

// ✂️ **באנר שתי-השיטות של מ21 נמחק (23/09/2026, תקן-הכרטיס — התוכנית §4ד #5).** הוא היה הסבר
// צהוב במצב 0, בעוד ישי קבע: *"מצב 0 זה מצב מוצר הייטק בוגר… כל ההסברים יהיו שם"* (בשכבה).
// 🔑 **ושום דבר לא אבד:** שלושת המספרים שלו גלויים עכשיו בכרטיסים (*"לקוחות מתרחקים"* · *"כלל
// «רדום» לבדו מוצא"* · *"נתפסים רק בקצב האישי"* — מיגרציית-הטקסט L5; ✏️ 25/09 `20260925000100`: עד
// אז ההשוואה נשאה את ערך-האריח עצמו והמסך אמר "ללא שינוי"), וההסבר עצמו — למה "מתרחק" ולא
// "רדום" — הוא רמז `reports.drifting.why` במצב 2.

/**
 * מ19 · אריח ④ — `tiles[].detail` **כגילוי (disclosure) ולא כאריח שני** (C8, תוספת
 * הלשונית הזו). ארבעת חציוני-התשלום הם מה שהופך את האריח לטענה; בלעדיהם נשאר מספר יחיד.
 * 🔑 **התוויות דרך `paymentCadenceRows`** (`src/lib/reportsCustomers.js`) — הוא ה-SSOT
 * שממפה `government` ⇐ *"חברה ממשלתית"* וממיין את האיטי ראשון (📐7).
 */
function PaymentCadenceDetails({ payload }) {
  const tile = findTile(payload, 'payment_cadence_by_type')
  const rows = paymentCadenceRows(tile?.detail?.rows)
  if (rows.length === 0) return null
  return (
    <details
      className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
      data-testid="m19-payment-detail"
    >
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        {tile.label} — הפילוח המלא
      </summary>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        {rows.map((row) => (
          <li key={row.customerType}>
            {row.label}: {formatByType(row.medianDays, 'days')} · על{' '}
            {isolateLtr(String(row.invoiceCount))} חשבוניות ששולמו, אצל{' '}
            {isolateLtr(String(row.customerCount))} לקוחות
          </li>
        ))}
      </ul>
    </details>
  )
}

// 🔤 נוסח-הריק של ת2(ה), מהמוקאפ המאושר. ⚠️ **המשפט *"אין עדיין אף ריצה במערכת"* לא
// הועתק**: הוא טענת-דאטה, וה-RPC מחזיר אך ורק ריצות **מאושרות** — ייתכנו ריצות שלא
// אושרו, ומשפט כזה היה אומר משהו שהמטען אינו יודע. מדווח.
function NoApprovedRun({ payload, hintId }) {
  const quotes = findTile(payload, 'other_tagged_notes')?.detail?.sample_quotes ?? []
  return (
    <section className="mb-4" data-testid="m22-no-run">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-base font-semibold text-slate-800">טרם אושרה ריצת-ניתוח</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          הדוח הזה מציג רק תוצאות של ריצה שאושרה להצגה, כדי שלא יוצג על המסך סיווג שאיש לא בדק.
          להרצה יש שני שלבים: הרצה, ואז בדיקה של {isolateLtr('20')} דוגמאות ואישור.
        </p>
      </div>
      {hintId && <Hint id={hintId} />}
      {quotes.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            מה כבר אפשר לקרוא בלי המודל — דוגמאות מההערות שתויגו &quot;אחר&quot;
          </summary>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
            {quotes.map((quote) => (
              <li key={quote.project_id}>
                <b>{quote.company_name}</b> · {isolateLtr(formatIsraelDate(quote.final_event_date))}{' '}
                · ציון {isolateLtr(String(quote.feedback_score))} — {quote.feedback_notes}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

/**
 * ‏`surface` · `filters` · `drill` · `onDrill` · `onWindow` — חוזה-הפרופס של המעטפת.
 * ‏`canEdit` — `edit` על 'דו"חות' (מ25 בלבד) · `onChanged()` — טעינה-מחדש אחרי אישור.
 */
export default function CustomerSurface({
  surface,
  filters,
  drill,
  onDrill,
  onWindow,
  transformPayload,
  canEdit,
  onChanged,
}) {
  const hints = HINTS[surface.id] ?? {}
  const isNotes = surface.id === 'מ22'

  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      transformPayload={transformPayload}
      // ⑩א — הרמז שמסביר **למה הדוח קיים ומה לעשות בו קודם**.
      // ✅ **עבר מ-`renderTop` ל-`renderAfterSoWhat` ברגע שהסלוט נולד (HEAD fb7bcd26).**
      // ארבעת הכרטיסים מעגנים אותו *"מתחת לשורת-אז-מה, מעל האריחים"*, ו-`renderTop` יושב
      // **מעל שורת-האוכלוסייה** — כלומר לפני שני הדברים שהרמז מתייחס אליהם. זה היה הפער
      // היחיד בעוגני-ההטמעה של הלשונית, והוא דווח בשני סבבים כ"ממתין לסלוט".
      // 🔑 **וגם פס-הניתוח (מ25) נוסע איתו:** המוקאפ של דף מ22 מסדר
      // `so-what → רמז א → runbar → רמז ב`, ולכן שלושתם יורדים יחד לאותו סלוט.
      renderAfterSoWhat={(payload) => (
        <>
          <Hint id={hints.why} />
          {isNotes && (
            <>
              <AnalysisRunBar payload={payload} canEdit={canEdit} onChanged={onChanged} />
              <Hint id={hints.gate} />
            </>
          )}
        </>
      )}
      renderBeforeChart={() => (hints.basis ? <Hint id={hints.basis} /> : null)}
      // 🔴 **בלוק "טרם אושרה ריצת-ניתוח" עבר לכאן מ-`renderExtras`** (סבב-ביקורת 16/09,
      // ממצא 16): ‏`renderExtras` מרונדר **אחרון** — אחרי הטבלה, שורת-ההגדרות
      // ו-`meta.notes` — ולכן ההסבר על *למה* הדף ריק נחת מתחת לטבלה הריקה שהוא מסביר.
      // המוקאפ מציב את ה-`basebanner` **מעל** הטבלה (`05_tab_customers_approved.html:1593`
      // מול ~1608). ‏`report_m22_notes` מחזיר את שמונה העמודות גם בלי ריצה מאושרת (נמדד
      // בגוף ה-SQL), ולכן הסלוט הזה **כן** נורה שם.
      renderBeforeTable={(payload) => (
        <>
          {isNotes && !hasApprovedRun(payload) && (
            <NoApprovedRun payload={payload} hintId={hints.emptyTiles} />
          )}
          {hints.table && <Hint id={hints.table} />}
        </>
      )}
      renderExtras={(payload) =>
        surface.id === 'מ19' ? <PaymentCadenceDetails payload={payload} /> : null
      }
    />
  )
}
