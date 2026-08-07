// עורך מדרגות-המחיר של מוצר יחיד (§7.84, צעד 3.6). הקבוצה כולה נערכת כיחידה ונשמרת
// דרך replacePriceTiers — **upsert ואז מחיקת-הנגרעות**, ובשום אופן לא מחיקה-ואז-הכנסה.
// ⛔ הסדר אינו סגנון: מחיקה-ואז-הכנסה מחקה בפועל את כל 5 המדרגות של B-REG-TAG מהמסד החי
// (30/07/2026) כשהדפדפן נסגר בין שתי הבקשות. הנימוק המלא יושב על הפונקציה עצמה
// (pricesApi.js), וכאן רק כדי שלא "ייושר" מכאן בחזרה. אותו לקח הוחל גם על
// replaceCustomerContacts במודול 2 — שם בצורת קריאת-מזהים ← הכנסה ← מחיקת-הישנים,
// כי לאיש-קשר אין מפתח-טבעי לעגון בו upsert.
//
// ⚠️ אותה מלכודת אובדן-נתונים שתוקנה במודול 2 (11/07): כשל-טעינה שקט היה משאיר rows=[]
// והשמירה הייתה **מוחקת את כל המדרגות הקיימות**. ‏loaded נשאר false עד שליפה מוצלחת,
// והשמירה חסומה עד אז.

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingOrError from '@/components/LoadingOrError'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { validateTierRows } from '@/lib/pricing'
import { listPriceTiers, replacePriceTiers } from '@/modules/01_auth/pricesApi'
import { cn } from '@/lib/utils'

// מפתח-שורה יציב: index-key שובר את ה-reconciliation של React בהסרת-שורה (אותו לקח כמו
// אנשי-הקשר במודול 2). מוגדל ב-handler בלבד ולכן לא מפר react-hooks/purity.
let nextTierRowKey = 1

function emptyRow() {
  return { _rk: nextTierRowKey++, min_qty: '', max_qty: '', special_price: '' }
}

export default function PriceTiersDialog({ open, onOpenChange, product, onSaved }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [validation, setValidation] = useState({ rowErrors: [], warnings: [] })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // טעינת המדרגות הקיימות. remount-דרך-key בעמוד-האב מריץ את זה פעם אחת לכל פתיחה.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listPriceTiers(product.sku)
        if (cancelled) return
        setRows(
          data.map((t) => ({
            _rk: nextTierRowKey++,
            min_qty: String(t.min_qty ?? ''),
            max_qty: t.max_qty === null || t.max_qty === undefined ? '' : String(t.max_qty),
            special_price: String(t.special_price ?? ''),
          })),
        )
        setLoaded(true)
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'טעינת מדרגות המחיר נכשלה.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [product.sku])

  function updateRow(rk, field, value) {
    setRows((prev) => prev.map((r) => (r._rk === rk ? { ...r, [field]: value } : r)))
    // ניקוי הוולידציה תוך-כדי הקלדה — המשוב הבא יגיע בשמירה, כך ששדה שתוקן לא נשאר אדום.
    setValidation({ rowErrors: [], warnings: [] })
    setFormError('')
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(rk) {
    setRows((prev) => prev.filter((r) => r._rk !== rk))
    setValidation({ rowErrors: [], warnings: [] })
  }

  async function handleSave() {
    setFormError('')
    const result = validateTierRows(rows, product)
    setValidation(result)
    if (!result.isValid) return

    setSaving(true)
    try {
      await replacePriceTiers(
        product.sku,
        rows.map((r) => ({
          min_qty: Number(r.min_qty),
          max_qty: String(r.max_qty).trim() === '' ? null : Number(r.max_qty),
          special_price: Number(r.special_price),
        })),
      )
      setSavedOk(true)
      setTimeout(() => {
        onOpenChange(false)
        onSaved?.()
      }, 900)
    } catch (err) {
      setFormError(err.message || 'שמירת מדרגות המחיר נכשלה.')
    } finally {
      setSaving(false)
    }
  }

  const rowError = (i, field) => validation.rowErrors?.[i]?.[field]
  const rowWarning = (i, field) => validation.warnings?.[i]?.[field]

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle data-testid="tiers-dialog-title">
            מדרגות מחיר — {product.item_name}
          </DialogTitle>
          <DialogDescription>
            המדרגה שכמות-המינימום שלה היא הגבוהה ביותר מבין אלה שאינן עולות על הכמות בהצעה — היא
            שקובעת את המחיר. ללא מדרגות, ההצעה מתומחרת לפי מחיר הבסיס.
          </DialogDescription>
        </DialogHeader>

        {/* ⚠️ הטרנרי נשאר: LoadingOrError מחזיר את ענף-השגיאה בלי תנאי, ולכן רינדור
            לא-שמור שלו היה מוסיף <p> אדום ריק לדיאלוג התקין. */}
        {loading || loadError ? (
          <LoadingOrError loading={loading} error={loadError} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 text-xs text-slate-500">
              <span>מכמות</span>
              <span>עד כמות</span>
              <span>מחיר ליחידה (₪)</span>
              <span />
            </div>

            {rows.length === 0 && (
              <p className="text-slate-500 text-sm" data-testid="tiers-empty">
                אין מדרגות למוצר זה — הוא מתומחר לפי מחיר הבסיס.
              </p>
            )}

            {rows.map((r, i) => (
              <div key={r._rk} className="flex flex-col gap-1" data-testid="tier-row">
                <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 items-center">
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    value={r.min_qty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateRow(r._rk, 'min_qty', e.target.value)}
                    aria-invalid={!!rowError(i, 'min_qty') || undefined}
                    className={cn(
                      'h-auto p-2 rounded-lg border-slate-300',
                      rowError(i, 'min_qty') && 'border-red-500',
                    )}
                    data-testid="tier-min-qty"
                  />
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    value={r.max_qty}
                    placeholder="ללא הגבלה"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateRow(r._rk, 'max_qty', e.target.value)}
                    aria-invalid={!!rowError(i, 'max_qty') || undefined}
                    className={cn(
                      'h-auto p-2 rounded-lg border-slate-300',
                      rowError(i, 'max_qty') && 'border-red-500',
                    )}
                    data-testid="tier-max-qty"
                  />
                  <Input
                    dir="ltr"
                    inputMode="decimal"
                    value={r.special_price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateRow(r._rk, 'special_price', e.target.value)}
                    aria-invalid={!!rowError(i, 'special_price') || undefined}
                    className={cn(
                      'h-auto p-2 rounded-lg border-slate-300',
                      rowError(i, 'special_price') && 'border-red-500',
                    )}
                    data-testid="tier-price"
                  />
                  {/* פח = הסרת שורה מטופס שטרם נשמר — מותר לפי המוסכמה (שונה מארכוב רשומה) */}
                  <Button
                    type="button"
                    variant="link"
                    title="הסר מדרגה"
                    aria-label={`הסר מדרגה ${i + 1}`}
                    onClick={() => removeRow(r._rk)}
                    className="h-auto p-0 text-red-600 hover:text-red-700"
                    data-testid="tier-remove"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {['min_qty', 'max_qty', 'special_price'].map(
                  (f) =>
                    rowError(i, f) && (
                      <p key={f} className="text-red-600 text-xs" data-testid="tier-row-error">
                        {rowError(i, f)}
                      </p>
                    ),
                )}
                {/* אזהרה (לא שגיאה): מחיר מתחת לעלות עשוי להיות מכוון — מבצע, חיסול מלאי */}
                {rowWarning(i, 'special_price') && (
                  <p className="text-amber-700 text-xs" data-testid="tier-row-warning">
                    {rowWarning(i, 'special_price')}
                  </p>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="link"
              onClick={addRow}
              className="h-auto gap-1 p-0 self-start text-teal-600 hover:text-teal-700"
              data-testid="tier-add-row"
            >
              <Plus className="size-4" />
              הוספת מדרגה
            </Button>

            {formError && (
              <p className="text-red-600 text-sm" role="alert" data-testid="tiers-form-error">
                {formError}
              </p>
            )}

            {savedOk && (
              <p
                className="rounded-lg bg-green-100 text-green-700 text-sm font-medium p-3 text-center"
                data-testid="tiers-save-success"
              >
                הנתונים נשמרו בהצלחה
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || savedOk || !loaded}
            className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
            data-testid="tiers-save"
          >
            {saving ? 'שומר...' : 'שמירת המדרגות'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
