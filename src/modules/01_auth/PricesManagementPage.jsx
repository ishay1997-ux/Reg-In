// לשונית "מחירים" ב-/system (§7.84, צעד 3.6) — תחזוקה שוטפת של קטלוג-המוצרים, מדרגות-המחיר
// ושני פרמטרי-התמחור. ה-Seed הנעול (11 מוצרים, 40 מדרגות) עדיין רץ ראשון דרך מיגרציה; המסך
// מתחזק מכאן ואילך.
//
// הרשאה: כתיבה למנכ"ל בלבד לפי הרשאת-המודול 'הגדרות מערכת' (§7.83). ‏canEdit הוא **נוחות** —
// הקיר האמיתי הוא ה-RLS, ו-pricesApi זורק RLS_DENIED כשכתיבה מחזירה 0 שורות (כלל 9).
// אושר-מחדש 30/07/2026 שהמסך נשאר מנכ"ל-בלבד (§7.84↳ + Ledger LOCAL-21).
//
// שני קטעים מוערמים ולא תת-לשוניות: אין Tabs primitive ב-shadcn של הפרויקט, והלשוניות
// של /system כבר תופסות את רמת-הניווט הזו — רמה שנייה של לשוניות הייתה מבלבלת.

import { useCallback, useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LoadingOrError from '@/components/LoadingOrError'
import Money from '@/components/Money'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from '@/lib/catalog'
import { computeMarginPercent } from '@/lib/pricing'
import { listProducts, listPriceTiers, setProductStatus } from '@/modules/01_auth/pricesApi'
import ProductFormDialog from '@/modules/01_auth/ProductFormDialog'
import PriceTiersDialog from '@/modules/01_auth/PriceTiersDialog'
import PricingParamsCard from '@/modules/01_auth/PricingParamsCard'

export default function PricesManagementPage() {
  const { permissions } = useAuth()
  const canEdit = permissions['הגדרות מערכת'] === 'edit'

  const [products, setProducts] = useState([])
  const [tierCounts, setTierCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rowError, setRowError] = useState('')
  // dialogSeq משתתף ב-key של הדיאלוגים: הגדלתו מאלצת remount ולכן איפוס-טופס, בלי
  // effect-סנכרון (הדפוס הקנוני בפרויקט — ר' CustomerFormDialog).
  const [dialogSeq, setDialogSeq] = useState(0)
  const [productDialog, setProductDialog] = useState(null) // {product|null}
  const [tiersDialog, setTiersDialog] = useState(null) // {product}

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const rows = await listProducts()
      setProducts(rows)
      // מונה-המדרגות פר-מוצר. השאילתה היא שליפה אחת לכל מוצר בטעינה — 11 שורות בקטלוג
      // ו-`price_tiers` פתוחה-לקריאה, כך שזה זול; אם הקטלוג יגדל משמעותית, המקום הנכון
      // לשנות הוא pricesApi (שליפה אחת עם קיבוץ), לא כאן.
      const counts = await Promise.all(
        rows.map(async (p) => [p.sku, (await listPriceTiers(p.sku)).length]),
      )
      setTierCounts(Object.fromEntries(counts))
    } catch (err) {
      setLoadError(err.message || 'שגיאה בטעינת קטלוג המוצרים.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת הקטלוג בעלייה; loadData מדליק setLoading כחיווי טעינה (מכוון, אותו דפוס כמו PermissionsMatrixPage).
    loadData()
  }, [loadData])

  // עדכון-סטטוס אופטימי עם גלגול-אחורה (דפוס PermissionsMatrixPage): המסך מגיב מיד,
  // וכשל — כולל חסימת-RLS שמגיעה כ-0 שורות ולא כשגיאה — מחזיר את הערך הקודם ומודיע.
  async function handleStatusChange(sku, nextStatus) {
    setRowError('')
    const previous = products.find((p) => p.sku === sku)?.status
    setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, status: nextStatus } : p)))
    try {
      await setProductStatus(sku, nextStatus)
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, status: previous } : p)))
      setRowError(err.message || 'שינוי הסטטוס לא נשמר.')
    }
  }

  function openProductDialog(product) {
    setDialogSeq((n) => n + 1)
    setProductDialog({ product })
  }

  function openTiersDialog(product) {
    setDialogSeq((n) => n + 1)
    setTiersDialog({ product })
  }

  if (loading || loadError) {
    return (
      <LoadingOrError
        loading={loading}
        error={loadError}
        onRetry={loadData}
        retryTestId="prices-retry"
      />
    )
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">קטלוג מוצרים ושירותים</h2>
          {canEdit && (
            <Button
              type="button"
              onClick={() => openProductDialog(null)}
              className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              data-testid="prices-add-product"
            >
              + מוצר חדש
            </Button>
          )}
        </div>

        {rowError && (
          <p className="text-red-600 text-sm mb-3" role="alert" data-testid="prices-row-error">
            {rowError}
          </p>
        )}

        {/* עטיפת-גלילה אופקית: 9 עמודות גולשות במסך צר — min-w שומר על רוחב קריא במקום לרסק */}
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[60rem] text-right border-collapse"
            data-testid="prices-table"
          >
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-2 font-medium">מק"ט</th>
                <th className="py-2 font-medium">שם הפריט</th>
                <th className="py-2 font-medium">קטגוריה</th>
                <th className="py-2 font-medium">יחידה</th>
                <th className="py-2 font-medium">מחיר בסיס</th>
                <th className="py-2 font-medium">עלות</th>
                <th className="py-2 font-medium">שולי רווח</th>
                <th className="py-2 font-medium">מדרגות מחיר</th>
                <th className="py-2 font-medium">סטטוס</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const margin = computeMarginPercent(p.base_price, p.cost)
                const tiers = tierCounts[p.sku] ?? 0
                return (
                  <tr
                    key={p.sku}
                    className="border-b border-slate-100 text-sm"
                    data-testid="prices-row"
                  >
                    {/* מק"ט לטיני מבודד — בלי dir הוא מתהפך בתוך טבלה עברית */}
                    <td className="py-2.5 font-mono text-xs text-slate-600" dir="ltr">
                      <span className="inline-block [unicode-bidi:isolate]">{p.sku}</span>
                    </td>
                    <td className="py-2.5 text-slate-800">{p.item_name}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        {PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{p.unit}</td>
                    {/* exact — במסך תחזוקת-מחירים עלות של 2.50 ₪ שמוצגת "3 ₪" מסתירה את הנתון */}
                    <td className="py-2.5 text-slate-800">
                      <Money amount={p.base_price} exact />
                    </td>
                    <td className="py-2.5 text-slate-600">
                      <Money amount={p.cost} exact />
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {margin === null ? (
                        '—'
                      ) : (
                        // מרווח שלילי נצבע אדום: מוצר שנמכר מתחת לעלות צריך לקפוץ לעין
                        <span
                          dir="ltr"
                          className={margin < 0 ? 'text-red-600 font-semibold' : undefined}
                        >{`${margin}%`}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openTiersDialog(p)}
                        className="h-auto py-1 px-2.5 rounded-lg border-teal-200 text-teal-700 text-xs"
                        data-testid="prices-tiers-button"
                      >
                        {tiers > 0 ? `${tiers} מדרגות` : 'ללא מדרגות'}
                      </Button>
                    </td>
                    <td className="py-2.5">
                      <Select
                        value={p.status}
                        disabled={!canEdit}
                        onValueChange={(v) => handleStatusChange(p.sku, v)}
                      >
                        <SelectTrigger
                          className="h-auto w-32 py-1 px-2 rounded-lg border-slate-300 text-xs"
                          data-testid="prices-status-select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2.5">
                      {canEdit && (
                        <Button
                          type="button"
                          variant="link"
                          title="עריכת מוצר"
                          aria-label={`עריכת ${p.item_name}`}
                          onClick={() => openProductDialog(p)}
                          className="h-auto p-0 text-teal-700 hover:text-teal-800"
                          data-testid="prices-edit-product"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">פרמטרי תמחור</h2>
        <PricingParamsCard canEdit={canEdit} />
      </section>

      {productDialog && (
        <ProductFormDialog
          key={`product-${dialogSeq}-${productDialog.product?.sku ?? 'new'}`}
          open
          onOpenChange={(o) => !o && setProductDialog(null)}
          editingProduct={productDialog.product}
          onSaved={loadData}
        />
      )}

      {tiersDialog && (
        <PriceTiersDialog
          key={`tiers-${dialogSeq}-${tiersDialog.product.sku}`}
          open
          onOpenChange={(o) => !o && setTiersDialog(null)}
          product={tiersDialog.product}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
