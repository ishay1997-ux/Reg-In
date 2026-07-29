// חלון דחיית הצעה (§7.82/F2+F3+F16) — אדום, כי זו פעולה שסוגרת הצעה ואינה הפיכה מהממשק:
// טריגר-הנעילה (§7.50) חוסם כל UPDATE על הצעה שאינה in_progress, ולכן "לבטל דחייה" לא קיים.
//
// שני האילוצים כאן מקבילים ל-CHECK-ים ב-DB, וזו שכבת-הסבר ידידותית לפני החומה:
//   • סיבה חובה  — CHECK quotes_rejected_iff_reason (status='rejected' ⇔ reason NOT NULL)
//   • 'אחר' דורש פירוט — נאכף גם ב-DB; בלעדיו סיבת-הדחייה "אחר" חסרת-ערך בפילוח
//
// ⚠️ 'פג תוקף' אינו ברשימה: עבודת-הרקע היומית היא שכותבת אותו (§7.41/§7.42). בחירה ידנית
// בו הייתה מסמנת "פג תוקף" להצעה שבפועל בתוקף — ומזהמת את הפילוח בלשונית "נדחו".

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { MANUAL_REJECTION_REASONS } from '@/lib/quotes'
import { cn } from '@/lib/utils'
import QuoteActionDialog from '@/modules/03_quotes/QuoteActionDialog'

const OTHER_REASON = 'אחר'

export default function RejectQuoteDialog({ open, onOpenChange, quote, onConfirm }) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const needsNotes = reason === OTHER_REASON

  // הוולידציה זורקת, והמעטפת המשותפת מציגה את ההודעה — אותו מקום ואותו מראה שבו תוצג
  // גם שגיאת-שרת ("אין הרשאה לדחות הצעה זו"), כך שהמשתמש לא לומד שני דפוסי-שגיאה.
  async function handleConfirm() {
    if (!reason) throw new Error('יש לבחור סיבת דחייה.')
    if (needsNotes && !notes.trim()) throw new Error('בבחירת "אחר" יש לפרט את הסיבה.')
    await onConfirm(reason, needsNotes ? notes.trim() : null)
  }

  return (
    <QuoteActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="reject"
      title={`דחיית הצעה ${quote?.quote_id ?? ''}`}
      description={`${quote?.event_name ?? ''} · ${quote?.customers?.company_name ?? ''}. ההצעה תיסגר ולא ניתן יהיה לערוך אותה שוב.`}
      confirmLabel="דחיית ההצעה"
      savingLabel="דוחה..."
      fallbackError="דחיית ההצעה נכשלה."
      onConfirm={handleConfirm}
      titleTestId="reject-dialog-title"
      confirmTestId="reject-confirm"
    >
      {({ clearError }) => (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700 mb-2">סיבת דחייה *</legend>
            {MANUAL_REJECTION_REASONS.map((option) => (
              <label
                key={option}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer',
                  reason === option
                    ? 'border-red-300 bg-red-50 text-red-800 font-medium'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                )}
              >
                <input
                  type="radio"
                  name="rejection-reason"
                  value={option}
                  checked={reason === option}
                  onChange={(e) => {
                    setReason(e.target.value)
                    clearError()
                  }}
                  className="accent-red-600"
                />
                {option}
              </label>
            ))}
          </fieldset>

          {needsNotes && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rejection-notes" className="text-sm font-medium text-slate-700">
                פירוט *
              </label>
              <Input
                id="rejection-notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  clearError()
                }}
                placeholder="מה הייתה הסיבה?"
                className="h-auto py-2 px-3 text-right rounded-lg border-slate-300"
                data-testid="reject-notes"
              />
            </div>
          )}
        </>
      )}
    </QuoteActionDialog>
  )
}
