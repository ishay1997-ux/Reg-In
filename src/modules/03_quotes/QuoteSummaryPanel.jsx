// פאנל הסיכום הפיננסי של מסך בניית ההצעה — נדבק למסך בגלילה, כדי שהסכום הסופי והכפתורים
// יישארו מול העיניים לאורך מילוי הטופס (הכרעת-ישי 29/07: קבוצת-כפתורים אחת בלבד, כאן,
// צמודה לסכום — ולא גם בראש העמוד).
//
// ⚠️ כל המספרים כאן מגיעים מ-computeQuoteTotals (pricing.js). אין כאן ולו חיבור אחד —
// אותם סכומים נדפסים ב-PDF שנשלח ללקוח, וחישוב מקומי היה יוצר מסך שסותר את המסמך.

import Money from '@/components/Money'
import { Button } from '@/components/ui/button'

function Row({ label, amount, negative }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-sm text-slate-600">
      <span>{label}</span>
      {/* רוחב-מינימום + יישור-לקצה: כך סימני ה-₪ מסתדרים בעמודה אחת ישרה, כמו בכל מסמך
          כספי. בלי זה 964 ו-6,300 מתחילים באותה נקודה ונגמרים במקומות שונים. */}
      <Money
        amount={amount}
        className={
          negative
            ? 'min-w-[5.5rem] text-right text-red-700'
            : 'min-w-[5.5rem] text-right text-slate-700'
        }
      />
    </div>
  )
}

export default function QuoteSummaryPanel({
  totals,
  appliedDiscount,
  manualDiscount,
  vatRate,
  profitability,
  missingCostProducts = [],
  showProfitability,
  onSave,
  onCancel,
  saving,
  saveLabel,
}) {
  // ההנחות מוצגות כשתי שורות נפרדות (F10) — כך הלקוח רואה גם את ההנחה הקבועה שלו וגם את
  // ההנחה הנוספת שניתנה לו, ולא סכום מאוחד שמסתיר את אחת מהן.
  const appliedAmount = (totals.subtotal * Number(appliedDiscount || 0)) / 100
  const manualAmount = totals.discountAmount - appliedAmount

  return (
    <div className="sticky top-4 flex flex-col gap-3">
      <div className="rounded-2xl bg-white p-5 shadow-md" data-testid="quote-summary">
        <h2 className="mb-2 text-sm font-bold text-slate-700">סיכום פיננסי</h2>
        <Row label="סכום ביניים" amount={totals.subtotal} />
        <Row
          label={`הנחת לקוח (${Number(appliedDiscount || 0)}%)`}
          amount={-appliedAmount}
          negative
        />
        <Row
          label={`הנחה ידנית (${Number(manualDiscount || 0)}%)`}
          amount={-manualAmount}
          negative
        />
        <div className="my-1 h-px bg-slate-200" />
        <Row label={'סה"כ לפני מע"מ'} amount={totals.preVat} />
        <Row label={`מע"מ (${Number(vatRate)}%)`} amount={totals.vatAmount} />
        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2.5">
          <span className="text-sm font-semibold text-slate-700">{'סה"כ לתשלום'}</span>
          <Money
            amount={totals.total}
            className="text-2xl font-bold text-slate-800"
            data-testid="quote-total"
          />
        </div>
      </div>

      {/* רווחיות — הכרעת-ישי 29/07: מוצגת למי שרשאי לערוך הצעות. לעולם לא ב-PDF ללקוח. */}
      {showProfitability && (
        <div className="rounded-2xl bg-white p-5 shadow-md" data-testid="quote-profitability">
          <h2 className="mb-2 text-sm font-bold text-slate-700">רווחיות ההצעה</h2>
          <Row label="עלות משוערת" amount={profitability.cost} />
          <Row label="רווח גולמי" amount={profitability.grossProfit} />
          <div className="mt-1 flex items-baseline justify-between border-t border-slate-200 pt-2 text-sm text-slate-600">
            <span>שיעור רווח</span>
            <span dir="ltr" className="min-w-[5.5rem] text-right text-base font-bold text-teal-700">
              {profitability.marginPercent === null ? '—' : `${profitability.marginPercent}%`}
            </span>
          </div>
          {/* הכרעת-ישי 01/08/2026: כשעלות חסרה — מקפים בכל השדות **ולצידם שם המוצר האשם**.
              בלי השם המנכ"ל רואה שלושה מקפים ואין לו דרך לדעת מה לתקן; רווחיות-חלקית
              נפסלה במפורש, כי מספר שחושב מעלות חלקית שקרי בדיוק כמו רווח מנופח. */}
          {missingCostProducts.length > 0 && (
            <p
              className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
              data-testid="quote-cost-unknown"
            >
              {/* נוסח עם נקודתיים ולא תחילית "ל-": שמות-המוצרים עצמם מכילים מקף
                  ("תג שם רגיל - ממותג"), ו"ל-תג שם רגיל - ממותג" נקרא כשני מקפים
                  שעושים דברים שונים. נתפס בצילום-מסך, לא בבדיקה. */}
              לא ניתן לחשב רווחיות — חסרה עלות רכש{' '}
              {missingCostProducts.length > 1 ? 'למוצרים' : 'למוצר'}:{' '}
              {missingCostProducts.join(' · ')}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">פנימי — לא מופיע בהצעה ללקוח.</p>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-md">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-auto w-full rounded-lg bg-teal-600 py-2 font-semibold text-white hover:bg-teal-700"
          data-testid="quote-save"
        >
          {saving ? 'שומר...' : saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="h-auto w-full rounded-lg border-slate-300 py-2 text-slate-700"
          data-testid="quote-cancel"
        >
          ביטול
        </Button>
      </div>
    </div>
  )
}
