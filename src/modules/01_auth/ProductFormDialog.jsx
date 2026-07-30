// דיאלוג הוספה/עריכה של מוצר בקטלוג (§7.84, צעד 3.6). מחקה בדיוק את CustomerFormDialog:
// ולידציה דו-שכבתית (blur + פרה-סאבמיט), FieldError פר-שדה, שדות-מספר כמחרוזת ב-state
// והמרה רק בשמירה. איפוס-הטופס נעשה ב-remount דרך key מהעמוד-האב, לא ב-effect-סנכרון.
//
// שני שדות מוסרים במכוון מהטופס:
//   • sku — מפתח-טבעי (§7.64) שהצעות קיימות מפנות אליו; נעול בעריכה, פתוח ביצירה בלבד.
//   • status — עובר רק דרך ה-<Select> בשורת-הטבלה, כמו setCustomerStatus במודול 2.
//     ‏updateProduct מסיר את שניהם הגנתית גם אם ישלחו, כך שהמסך וה-API מסכימים.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_UNITS } from '@/lib/catalog'
import { isValidNonNegativePrice, isValidSku } from '@/lib/validators'
import { createProduct, updateProduct } from '@/modules/01_auth/pricesApi'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  sku: '',
  item_name: '',
  description: '',
  category: '',
  unit: '',
  base_price: '',
  cost: '',
  image_url: '',
}

// כלל react-hooks/static-components: קומפוננטה שמוגדרת בתוך render מאבדת state בכל רינדור.
function FieldError({ name, message }) {
  if (!message) return null
  return (
    <p className="text-red-600 text-sm" data-testid={`product-field-error-${name}`}>
      {message}
    </p>
  )
}

// הכללים עצמם קצרים ומקומיים לטופס הזה (בניגוד ללקוחות, שם הם חיים ב-src/lib/customers.js
// כי גם מסכים אחרים מוודאים לקוח). כאן אין צרכן שני — המרכיבים הכלליים (SKU/מחיר) כן
// מיובאים מ-validators.js ולא נכתבים מחדש.
function validateProductField(name, value) {
  const text = String(value ?? '').trim()
  switch (name) {
    case 'sku':
      if (text === '') return 'שדה חובה'
      return isValidSku(text) ? '' : 'אותיות גדולות, ספרות ומקפים בלבד (לא בתחילת המק"ט)'
    case 'item_name':
      return text === '' ? 'שדה חובה' : ''
    case 'category':
      return text === '' ? 'יש לבחור קטגוריה' : ''
    case 'unit':
      return text === '' ? 'יש לבחור יחידת מכירה' : ''
    case 'base_price':
      return isValidNonNegativePrice(text) ? '' : 'מחיר במספרים, אפס ומעלה'
    case 'cost':
      return isValidNonNegativePrice(text) ? '' : 'עלות במספרים, אפס ומעלה'
    default:
      return ''
  }
}

function validateProductForm(form) {
  return Object.fromEntries(
    Object.keys(form).map((name) => [name, validateProductField(name, form[name])]),
  )
}

export default function ProductFormDialog({ open, onOpenChange, editingProduct, onSaved }) {
  const isEdit = !!editingProduct

  const [form, setForm] = useState(() =>
    editingProduct
      ? {
          sku: editingProduct.sku ?? '',
          item_name: editingProduct.item_name ?? '',
          description: editingProduct.description ?? '',
          category: editingProduct.category ?? '',
          unit: editingProduct.unit ?? '',
          base_price: String(editingProduct.base_price ?? ''),
          cost: String(editingProduct.cost ?? ''),
          image_url: editingProduct.image_url ?? '',
        }
      : EMPTY_FORM,
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  function handleBlur(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: validateProductField(name, form[name]) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validateProductForm(form)
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setSaving(true)
    try {
      const payload = {
        item_name: form.item_name.trim(),
        // ⚠️ '' ולא null: products.description הוא NOT NULL בלי ברירת-מחדל. שליחת null על
        // תיאור ריק נכשלה ב-23502 עוד לפני בדיקת-הכפילות — כלומר "מוצר חדש בלי תיאור"
        // לא היה נוצר לעולם, עם הודעה גנרית (נתפס בסבב-הפערים 30/07, אותה משפחה כמו
        // באג-הפרמטרים: הנחה על המסד במקום בדיקה מולו).
        description: form.description.trim(),
        category: form.category,
        unit: form.unit,
        base_price: Number(form.base_price),
        cost: Number(form.cost),
        image_url: form.image_url.trim() || null,
      }
      const saved = isEdit
        ? await updateProduct(editingProduct.sku, payload)
        : await createProduct({ ...payload, sku: form.sku.trim() })

      setSavedOk(true)
      setTimeout(() => {
        onOpenChange(false)
        onSaved?.(saved)
      }, 900)
    } catch (err) {
      if (err.code === '23505') {
        // המק"ט הוא PK טבעי — כפילות מגיעה כ-23505, בדיוק כמו ח"פ במודול 2.
        setFormError(`המק"ט ${form.sku.trim()} כבר קיים בקטלוג. בחרו מק"ט אחר.`)
      } else {
        setFormError(err.message || 'שמירה נכשלה. נסו שוב.')
      }
    } finally {
      setSaving(false)
    }
  }

  function fieldClass(name) {
    return cn(
      'h-auto p-3 text-right rounded-lg border-slate-300',
      fieldErrors[name] && 'border-red-500 focus-visible:ring-red-300',
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle data-testid="product-dialog-title">
            {isEdit ? `עריכת מוצר: ${editingProduct.item_name}` : 'מוצר חדש'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'עדכון פרטי המוצר. המק"ט קבוע ואינו ניתן לשינוי.'
              : 'המוצר יתווסף לקטלוג ויהיה זמין לבחירה בהצעות מחיר חדשות.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">מק"ט</label>
              {/* dir="ltr" — מק"ט לטיני בתוך טופס עברי מתהפך בלי הבידוד הזה (src/CLAUDE.md) */}
              <Input
                value={form.sku}
                disabled={isEdit}
                dir="ltr"
                onChange={(e) => setField('sku', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('sku')}
                placeholder="B-REG-TAG"
                className={cn(
                  'h-auto p-3 rounded-lg border-slate-300',
                  fieldErrors.sku && 'border-red-500 focus-visible:ring-red-300',
                  isEdit && 'disabled:opacity-60',
                )}
                data-testid="product-form-sku"
              />
              <FieldError name="sku" message={fieldErrors.sku} />
              {isEdit && <p className="text-xs text-slate-500">לא ניתן לשינוי לאחר יצירה</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">קטגוריה</label>
              <Select value={form.category} onValueChange={(v) => setField('category', v)}>
                <SelectTrigger
                  className={cn(
                    'w-full h-auto p-3 rounded-lg border-slate-300',
                    fieldErrors.category && 'border-red-500',
                  )}
                  data-testid="product-form-category"
                >
                  <SelectValue placeholder="בחרו קטגוריה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="category" message={fieldErrors.category} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">שם הפריט</label>
            <Input
              value={form.item_name}
              onChange={(e) => setField('item_name', e.target.value)}
              onBlur={() => handleBlur('item_name')}
              placeholder="תג שם רגיל - ממותג"
              className={fieldClass('item_name')}
              data-testid="product-form-name"
            />
            <FieldError name="item_name" message={fieldErrors.item_name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700">תיאור (רשות)</label>
            {/* אין Textarea ב-shadcn של הפרויקט — textarea טבעי מעוצב, כמו בהערות-השיווק */}
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="rounded-lg border border-slate-300 p-3 text-right text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              data-testid="product-form-description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">יחידת מכירה</label>
              {/* רשימה סגורה מ-PRODUCT_UNITS — ה-DB אוכף CHECK על ארבעת הערכים האלה, וטקסט
                  חופשי (כפי שהוצע ב-design-notes) היה נדחה בשמירה אחרי round-trip. */}
              <Select value={form.unit} onValueChange={(v) => setField('unit', v)}>
                <SelectTrigger
                  className={cn(
                    'w-full h-auto p-3 rounded-lg border-slate-300',
                    fieldErrors.unit && 'border-red-500',
                  )}
                  data-testid="product-form-unit"
                >
                  <SelectValue placeholder="בחרו יחידה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="unit" message={fieldErrors.unit} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">קישור לתמונה (רשות)</label>
              <Input
                value={form.image_url}
                dir="ltr"
                onChange={(e) => setField('image_url', e.target.value)}
                placeholder="https://..."
                className="h-auto p-3 rounded-lg border-slate-300"
                data-testid="product-form-image"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">מחיר בסיס (₪)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={form.base_price}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setField('base_price', e.target.value)}
                onBlur={() => handleBlur('base_price')}
                className={cn(
                  'h-auto p-3 rounded-lg border-slate-300',
                  fieldErrors.base_price && 'border-red-500 focus-visible:ring-red-300',
                )}
                data-testid="product-form-base-price"
              />
              <FieldError name="base_price" message={fieldErrors.base_price} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-700">עלות (₪)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={form.cost}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setField('cost', e.target.value)}
                onBlur={() => handleBlur('cost')}
                className={cn(
                  'h-auto p-3 rounded-lg border-slate-300',
                  fieldErrors.cost && 'border-red-500 focus-visible:ring-red-300',
                )}
                data-testid="product-form-cost"
              />
              <FieldError name="cost" message={fieldErrors.cost} />
            </div>
          </div>

          {formError && (
            <p className="text-red-600 text-sm" role="alert" data-testid="product-form-error">
              {formError}
            </p>
          )}

          {savedOk && (
            <p
              className="rounded-lg bg-green-100 text-green-700 text-sm font-medium p-3 text-center"
              data-testid="product-save-success"
            >
              הנתונים נשמרו בהצלחה
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={saving || savedOk}
              className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
              data-testid="product-form-submit"
            >
              {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף מוצר'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
