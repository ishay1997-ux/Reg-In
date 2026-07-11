// כרטיס לקוח (מסך 5.6.3 "כרטיס לקוח") — נפתח בלחיצה על שורה. מציג פרטים, היסטוריית פרויקטים ומדדים.
// why-first: הכרטיס קורא getCustomer(id) **טרי** ולא נשען על ה-state של הרשימה — משתמש אחר אולי ערך
// את הלקוח מאז הטעינה, והכרטיס הוא נקודת-ההסתכלות-לעומק שבה נכון להראות את המצב העדכני ביותר.
// היסטוריית הפרויקטים והמדדים ריקים במודול 2 (quotes/projects עדיין deny-all; feedback/מחיר במ3/מ6/מ8) —
// מוצגים כמצבי-ריק "אין נתונים עדיין", לא מושמטים (כלל: לא מסתירים יכולת עתידית, מסמנים אותה).

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CUSTOMER_TYPE_LABELS, deriveCustomerMetrics } from '@/lib/customers'
import { getCustomer, getCustomerProjects, listCustomerContacts } from '@/modules/02_customers/api'

// שורת פרט בכרטיס (תווית + ערך) — קומפוננטה עליונה (react-hooks/static-components).
function DetailRow({ label, value, ltr }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-slate-700" dir={ltr ? 'ltr' : undefined}>
        {value || '—'}
      </span>
    </div>
  )
}

// כרטיס-מדד (5 מדדים ממוקדי-מנהלת-לקוחות). value=null ⇒ "אין נתונים עדיין" (מ3/מ6/מ8).
function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      {value == null ? (
        <span className="text-sm text-slate-400">אין נתונים עדיין</span>
      ) : (
        <span className="text-lg font-bold text-slate-800">{value}</span>
      )}
    </div>
  )
}

export default function CustomerDetailsCard({ open, onOpenChange, customerId }) {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [projects, setProjects] = useState([])
  const [contacts, setContacts] = useState([]) // אנשי-קשר נוספים (§7.81)
  const [error, setError] = useState('')

  // טעינה טרייה בכל פתיחה של לקוח (getCustomer + getCustomerProjects). כל ה-setState קורים בתוך
  // ה-async (אחרי await = בתגובה למערכת החיצונית, כלל react-hooks/set-state-in-effect); דגל cancelled
  // מונע כתיבת-state אחרי סגירה/החלפת-לקוח באמצע טעינה. העמוד-האב נותן key=customerId ⇒ remount טרי.
  useEffect(() => {
    if (!open || customerId == null) return
    let cancelled = false
    ;(async () => {
      try {
        const [c, p, cc] = await Promise.all([
          getCustomer(customerId),
          getCustomerProjects(customerId),
          listCustomerContacts(customerId),
        ])
        if (!cancelled) {
          setCustomer(c)
          setProjects(p)
          setContacts(cc)
          setError('')
        }
      } catch {
        if (!cancelled) setError('שגיאה בטעינת כרטיס הלקוח.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, customerId])

  // המדדים מ-SSOT (deriveCustomerMetrics): totalRevenue/grossProfit=null במכוון (מ3/מ8), avgFeedback
  // נגזר מהפרויקטים כשיש. §7.79: רווח גולמי מצטבר מוצג כ-placeholder — לא מושמט (מ8 יחבר את הנוסחה).
  const metrics = deriveCustomerMetrics(projects)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto" data-testid="customer-card">
        <DialogHeader>
          <DialogTitle>
            {customer ? `כרטיס לקוח: ${customer.company_name}` : 'כרטיס לקוח'}
          </DialogTitle>
          <DialogDescription>פרטי הלקוח, היסטוריית פרויקטים ומדדים מצטברים.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-slate-500 py-6">טוען...</p>
        ) : error ? (
          <p className="text-red-600 py-6" data-testid="customer-card-error">
            {error}
          </p>
        ) : !customer ? (
          <p className="text-slate-500 py-6">הלקוח לא נמצא.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* פרטי הלקוח */}
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label={'ח"פ'} value={customer.company_number} ltr />
              <DetailRow
                label="סוג לקוח"
                value={CUSTOMER_TYPE_LABELS[customer.customer_type] ?? customer.customer_type}
              />
              <DetailRow label="איש קשר" value={customer.contact_name} />
              <DetailRow label="טלפון" value={customer.phone} ltr />
              <DetailRow label="אימייל" value={customer.email} ltr />
              <DetailRow label="אחוז הנחה" value={`${Number(customer.discount_percent ?? 0)}%`} />
              <DetailRow label="מאושר לדיוור" value={customer.marketing_consent ? 'כן' : 'לא'} />
              <DetailRow label="סטטוס" value={customer.status === 'active' ? 'פעיל' : 'לא פעיל'} />
            </div>

            {/* אנשי-קשר נוספים (§7.81) — הראשי מוצג למעלה; כאן הנוספים אם קיימים (אופציה C) */}
            {contacts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">אנשי קשר נוספים</h3>
                <div className="flex flex-col gap-2">
                  {contacts.map((cc) => (
                    <div
                      key={cc.contact_id}
                      className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                      data-testid={`customer-card-contact-${cc.contact_id}`}
                    >
                      <span className="font-medium text-slate-700">{cc.contact_name}</span>
                      <span className="text-slate-600" dir="ltr">
                        {cc.phone || '—'}
                      </span>
                      <span className="text-slate-600" dir="ltr">
                        {cc.email || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5 מדדים ממוקדי-מנהלת-לקוחות (הכרעת-ישי 11/07) — כולם "אין נתונים עדיין" במ2, נחווטים
                ממ3/מ6/מ8. רווח-גולמי אינו כאן (החלטת-פרסונה — יעדו מסך-הכספים מ8/דו"ח-הניהול מ11;
                הסטייה מ-C6 §2.4.1 רשומה ב-§9 של מדריך-המיקרו). */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">מדדים</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label={'סה"כ הכנסות'} value={metrics.totalRevenue} />
                <MetricCard label="מספר אירועים" value={metrics.projectCount} />
                {/* מ6 יחבר תאריך-אירוע-אחרון (וכשיהיה — סימון "רדום" ללקוח בלי אירוע תקופה); עד אז placeholder */}
                <MetricCard label="אירוע אחרון" value={metrics.lastEventDate} />
                <MetricCard label="גודל עסקה ממוצע" value={metrics.avgDealSize} />
                <MetricCard label="ממוצע משוב" value={metrics.avgFeedback} />
              </div>
            </div>

            {/* היסטוריית פרויקטים — ריקה עד שמ3/מ6 יוסיפו policies+דאטה */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">היסטוריית פרויקטים</h3>
              {projects.length === 0 ? (
                <p className="text-sm text-slate-400" data-testid="customer-card-no-projects">
                  אין פרויקטים עדיין
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {projects.map((p) => (
                    <li key={p.project_id} className="text-sm text-slate-700">
                      {p.project_name ?? `פרויקט #${p.project_id}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
