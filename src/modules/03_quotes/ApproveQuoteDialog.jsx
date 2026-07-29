// חלון אישור הצעה (§7.49/F22) — ירוק, כי זו הפעולה שבשבילה המודול קיים: הצעה מאושרת
// הופכת **בבת אחת** לפרויקט מלא עם שורות לוגיסטיקה ומספר-דיילות נדרש.
//
// ⚠️ החלון מסביר מה עומד לקרות, ולא רק שואל "בטוח?" — האישור אינו הפיך מהממשק:
// טריגר-הנעילה (§7.50) חוסם כל עריכה של הצעה מאושרת, והפרויקט שנולד הוא כבר ישות חיה.
//
// שלוש חסימות **נאכפות בשרת** ולא כאן (הכלל: ה-DB הוא החומה, החלון הוא ההסבר):
//   • תאריך-אירוע שעבר (§7.32) — ה-RPC דוחה, וההודעה שלו מוצגת כמו-שהיא
//   • הרשאת-עריכה על 'הצעות מחיר' — ה-RPC בודק בעצמו למרות SECURITY DEFINER (F1)
//   • לחיצה כפולה — projects.quote_id הוא UNIQUE, ולכן הפרויקט השני פשוט לא נולד

import Money from '@/components/Money'
import { formatDate } from '@/modules/03_quotes/quotePdf'
import QuoteActionDialog from '@/modules/03_quotes/QuoteActionDialog'

function Row({ label, children }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  )
}

export default function ApproveQuoteDialog({ open, onOpenChange, quote, amount, onConfirm }) {
  return (
    <QuoteActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="approve"
      title={`אישור הצעה ${quote?.quote_id ?? ''}`}
      description="עם האישור ייפתח פרויקט חדש, וההצעה תינעל לעריכה."
      confirmLabel="אישור ופתיחת פרויקט"
      savingLabel="מאשר..."
      fallbackError="אישור ההצעה נכשל."
      onConfirm={onConfirm}
      titleTestId="approve-dialog-title"
      confirmTestId="approve-confirm"
    >
      <dl className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm">
        <Row label="לקוח">{quote?.customers?.company_name}</Row>
        <Row label="אירוע">{quote?.event_name}</Row>
        {/* תווית עברית מול ערך בכיוון הפוך — הערך יושב בתא משלו ולא משורשר למחרוזת עברית,
            אחרת אלגוריתם הכיווניות מסדר מחדש את הספרות (המוקש של quotePdf.jsx). */}
        <Row label="תאריך האירוע">
          <span dir="ltr" className="inline-block">
            {formatDate(quote?.estimated_event_date)}
          </span>
        </Row>
        <Row label="דיילות נדרשות">
          <span dir="ltr" className="inline-block">
            {quote?.recommended_hostess_count}
          </span>
        </Row>
        <Row label="סכום כולל">
          <Money amount={amount} className="font-bold" />
        </Row>
      </dl>
    </QuoteActionDialog>
  )
}
