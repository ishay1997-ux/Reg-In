// משטח-דוח של לשונית "לקוחות" — **חיווט נקודות-ההרחבה של `ReportSurface`, פעם אחת
// לארבעת המשטחים.**
//
// 🔑 **למה רכיב אחד ולא ארבעה קבצים:** ‏`jscpd` נופל ב-3%, וארבעה קבצים שכל אחד בונה
// `<ReportSurface transformPayload renderTop renderBeforeChart renderBeforeTable
// renderExtras>` היו ארבעה עותקים של אותו שלד. **מה ששונה בין המשטחים הוא דאטה** (מפתחות
// ההטמעה) **ושלושה בלוקי-בסיס** — ולכן זה טבלה ותנאים, לא העתקה.
//
// 🔴 **מה שנמצא כאן הוא *בסיס* ולא שכבת-הטמעה** (מבחן-המחיקה של §⑩): באנר שתי-השיטות של
// מ21 ובלוק "טרם אושרה ריצת-ניתוח" של מ22 חייבים להיות גלויים **ברמה 0** — הכרטיס אומר
// זאת במפורש (*"הורדת ה-`basebanner` לשכבה תשבור את המבחן"*). הרמזים, ורק הם, יושבים
// ב-`<Hint>` ונעלמים ברמה 0.
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

/**
 * מ21 · **באנר שתי-השיטות — בסיס, לא רמז** (⑩א: *"`div.basebanner` מציג את ההשוואה
 * המלאה… הורדתו לשכבה תשבור את המבחן"*): בלי ההשוואה, המילה *"מתרחק"* בעמודת-הדגל היא
 * מונח בלי הגדרה על המסך.
 * 🔴 **כל שלושת המספרים נגזרים מהמטען בכל טעינה** ואינם מוקלדים — זה בדיוק ההבדל בין
 * *"ארבעה מתוך שנים-עשר"* שנכתב פעם ורקב (נמדד 16/09: שלושה, לא ארבעה) לבין מספר חי.
 * ההגדרה המספרית של שתי השיטות יושבת בשורת-ההגדרות (📐16) שבתחתית הדף, ולכן אינה נכפלת כאן.
 */
function TwoMethodsBanner({ payload }) {
  const drifting = findTile(payload, 'drifting_count')
  const personal = findTile(payload, 'only_personal_cadence')
  if (!drifting || !personal) return null
  const dormant = personal.detail?.dormant_rule_finds
  return (
    <p
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12.5px] leading-relaxed text-slate-700"
      data-testid="drifting-two-methods"
    >
      <b>שתי שיטות לאותה שאלה, וההפרש הוא הדף הזה.</b> <b>&quot;רדום&quot;</b> — הדגל שכבר קיים
      במערכת — שואל את אותה שאלה על כל הלקוחות. <b>&quot;מתרחק&quot;</b> שואל כל לקוח ביחס לקצב של
      עצמו. המדידה היום: {isolateLtr(String(drifting.value))} מתרחקים מול{' '}
      {isolateLtr(String(dormant ?? 0))} רדומים, ו-{isolateLtr(String(personal.value))} לקוחות נראים
      רק בשיטה האישית.
    </p>
  )
}

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
      <summary className="cursor-pointer text-[12.5px] font-semibold text-slate-700">
        {tile.label} — הפילוח המלא
      </summary>
      <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
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
        <p className="text-[15px] font-semibold text-slate-800">טרם אושרה ריצת-ניתוח</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
          הדוח הזה מציג רק תוצאות של ריצה שאושרה להצגה, כדי שלא יוצג על המסך סיווג שאיש לא בדק.
          להרצה יש שני שלבים: הרצה, ואז בדיקה של {isolateLtr('20')} דוגמאות ואישור.
        </p>
      </div>
      {hintId && <Hint id={hintId} />}
      {quotes.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-slate-700">
            מה כבר אפשר לקרוא בלי המודל — דוגמאות מההערות שתויגו &quot;אחר&quot;
          </summary>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-600">
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
  const isDrifting = surface.id === 'מ21'

  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      transformPayload={transformPayload}
      // ⑩א — הרמז שמסביר **למה הדוח קיים ומה לעשות בו קודם**, מעל הדף.
      // מ22: פס-הניתוח (מ25) יושב בין הרמז הזה לרמז ⑩ב, בדיוק כסדר המוקאפ.
      renderTop={(payload) => (
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
      renderBeforeChart={(payload) => (
        <>
          {hints.basis && <Hint id={hints.basis} />}
          {isDrifting && <TwoMethodsBanner payload={payload} />}
        </>
      )}
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
