// כרטיס שני פרמטרי-התמחור (§7.84) — מע"מ ויחס אורחים-לדיילת בלבד, לא כל טבלת params
// (מסך-הפרמטרים המלא הוא מודול 9, §7.70).
//
// ⚠️ מה שהמסך הזה **לא** עושה, ובכוונה: הוא לא נוגע בהצעות קיימות. `vat_rate_snapshot`
// מוקפא בכל הצעה באישורה (§7.51) והמחירים מוקפאים בשורות (§7.28) — כלומר שינוי כאן משפיע
// על חישובים חדשים בלבד. ההערה מתחת לשדה אומרת את זה למשתמש, כי זו בדיוק ההנחה שקל לטעות בה.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingOrError from '@/components/LoadingOrError'
import { PRICING_PARAM_NAMES } from '@/lib/pricing'
import { isValidGuestsRatio, isValidVatPercent } from '@/lib/validators'
import { getPricingParams, updatePricingParam } from '@/modules/01_auth/pricesApi'
import { cn } from '@/lib/utils'

const FIELDS = [
  {
    key: 'vat',
    paramName: PRICING_PARAM_NAMES.VAT_PERCENT,
    label: 'אחוז מע"מ',
    hint: 'משפיע על הצעות חדשות בלבד',
    isValid: isValidVatPercent,
    error: 'מספר בין 0 ל-100',
    testId: 'param-vat',
  },
  {
    key: 'ratio',
    paramName: PRICING_PARAM_NAMES.GUESTS_PER_HOSTESS_RATIO,
    label: 'יחס אורחים לדיילת',
    hint: 'בסיס ההמלצה במסך בניית ההצעה — ניתן לשינוי בכל הצעה בנפרד',
    isValid: isValidGuestsRatio,
    error: 'מספר גדול מאפס',
    testId: 'param-ratio',
  },
]

export default function PricingParamsCard({ canEdit }) {
  const [values, setValues] = useState({ vat: '', ratio: '' })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getPricingParams()
        if (cancelled) return
        const byName = Object.fromEntries(rows.map((r) => [r.param_name, r.param_value]))
        setValues({
          vat: byName[PRICING_PARAM_NAMES.VAT_PERCENT] ?? '',
          ratio: byName[PRICING_PARAM_NAMES.GUESTS_PER_HOSTESS_RATIO] ?? '',
        })
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'טעינת פרמטרי התמחור נכשלה.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function setValue(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
    setSavedOk(false)
  }

  async function handleSave() {
    setFormError('')
    const nextErrors = Object.fromEntries(
      FIELDS.map((f) => [f.key, f.isValid(values[f.key]) ? '' : f.error]),
    )
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSaving(true)
    try {
      // שני upsert-ים עוקבים ולא מקבילים: אם השני נכשל, הראשון כבר נשמר — והמשתמש רואה
      // שגיאה מול ערכים שחלקם נכתב. רצף מבטיח שהודעת-השגיאה מתייחסת לשדה שבאמת נכשל.
      for (const f of FIELDS) {
        await updatePricingParam(f.paramName, String(values[f.key]).trim())
      }
      setSavedOk(true)
    } catch (err) {
      setFormError(err.message || 'שמירת הפרמטרים נכשלה.')
    } finally {
      setSaving(false)
    }
  }

  // ⚠️ התנאי נשאר כאן ואינו נדחף לתוך LoadingOrError: ענף-השגיאה שלו הוא return **בלי
  // תנאי**, ולכן קריאה לא-שמורה הייתה פולטת <p> אדום **ריק** בכל רינדור תקין. כל שמונת
  // הצרכנים בפרויקט שומרים עליו מבחוץ — זו מוסכמת-הבית, לא פרט-מימוש.
  if (loading || loadError) {
    return <LoadingOrError loading={loading} error={loadError} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-700" htmlFor={`pricing-${f.key}`}>
              {f.label}
            </label>
            <Input
              id={`pricing-${f.key}`}
              type="number"
              min="0"
              step="1"
              dir="ltr"
              disabled={!canEdit}
              value={values[f.key]}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setValue(f.key, e.target.value)}
              className={cn(
                'h-auto w-32 p-3 rounded-lg border-slate-300',
                errors[f.key] && 'border-red-500 focus-visible:ring-red-300',
                !canEdit && 'disabled:opacity-60',
              )}
              data-testid={f.testId}
            />
            {errors[f.key] ? (
              <p className="text-red-600 text-sm" data-testid={`${f.testId}-error`}>
                {errors[f.key]}
              </p>
            ) : (
              <p className="text-xs text-slate-500">{f.hint}</p>
            )}
          </div>
        ))}
      </div>

      {formError && (
        <p className="text-red-600 text-sm" role="alert" data-testid="params-form-error">
          {formError}
        </p>
      )}

      {canEdit && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
            data-testid="params-save"
          >
            {saving ? 'שומר...' : 'שמירת הפרמטרים'}
          </Button>
          {savedOk && (
            <span className="text-green-700 text-sm font-medium" data-testid="params-save-success">
              הנתונים נשמרו בהצלחה
            </span>
          )}
        </div>
      )}
    </div>
  )
}
