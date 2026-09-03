// בדיקות ה-hook של טיוטת-ההגדרות (צעד 3.1).
//
// מה נעול כאן: מונה-השינויים · ולידציה פר-קינד דרך המרשם · שני כללי-הרוחב (סכום-משקולות,
// סדר-המרחקים) · **הסינון לשורות שמותר לערוך לפני הכתיבה הראשונה (V-9)** · והתנהגות-הכשל
// שהיא הלב של §2.8 — שורה שנכשלה עוצרת את הרצף, המסך נוקב בשמה, **והטיוטות של שאר
// השדות נשארות בדיוק כפי שהוקלדו** (C5 §5.6.17.4).
//
// ‏`updateParams` ממוקק; אין רשת ואין Supabase. מוק-הלקוח נדרש כי `vi.mock('../api')`
// טוען את המודול האמיתי, שמייבא את `@/supabaseClient` בזמן-הייבוא — וב-CI אין
// `VITE_SUPABASE_*` (אותו לקח בדיוק כמו ב-`08_finance/FinancePage.test.jsx`).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useParamsForm, {
  WEIGHTS_SUM_ERROR,
  DISTANCE_ORDER_ERROR,
  CANCELLATION_ORDER_ERROR,
  EXPIRY_WARNING_ORDER_ERROR,
  saveFailedMessage,
} from './useParamsForm'
import { updateParams } from '@/modules/09_settings/api'
import { RLS_DENIED_CODE } from '@/lib/apiError'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('@/modules/09_settings/api', async () => {
  const actual = await vi.importActual('@/modules/09_settings/api')
  return { ...actual, updateParams: vi.fn() }
})

const CEO_ROLE = 1
const FINANCE_ROLE = 3

function row(name, value, type, ownerRoleId = null) {
  return { param_name: name, param_value: value, param_type: type, owner_role_id: ownerRoleId }
}

const PRICING_ROWS = [
  row('אחוז_מעמ', '18', 'pricing_timing', FINANCE_ROLE),
  row('תנאי_תשלום_ימים', '30', 'pricing_timing', FINANCE_ROLE),
]

const WEIGHT_ROWS = [
  row('משקולת_היענות', '0.40', 'smart_match'),
  row('משקולת_אמינות', '0.35', 'smart_match'),
  row('משקולת_קרבה', '0.25', 'smart_match'),
]

const DISTANCE_ROWS = [
  row('שער_מרחק_קמ', '80', 'smart_match'),
  row('גולפוסט_מרחק_קמ', '40', 'smart_match'),
]

const COMPENSATION_ROWS = [
  row('שעות_פיצוי_ביטול_מלא', '24', 'control_alerts'),
  row('שעות_פיצוי_ביטול_חלקי', '72', 'control_alerts'),
]
const EXPIRY_ROWS = [
  row('ימי_אזהרה_הצעה_פגה', '7', 'pricing_timing'),
  row('ימי_תוקף_הצעה', '30', 'pricing_timing'),
]

function setup(rows, options = {}) {
  return renderHook(() =>
    useParamsForm({ rows, roleId: options.roleId ?? CEO_ROLE, canEditAll: options.canEditAll }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  updateParams.mockResolvedValue(['ok'])
})

describe('useParamsForm — טיוטות ומונה-שינויים', () => {
  it('מתחיל בלי שינויים ומציג את הערכים השמורים', () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    expect(result.current.dirtyNames).toEqual([])
    expect(result.current.values['אחוז_מעמ']).toBe('18')
  })

  it('סופר שינוי אחד, ומפסיק לספור כשהערך חוזר למקורי', () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => result.current.setValue('אחוז_מעמ', '17'))
    expect(result.current.dirtyNames).toEqual(['אחוז_מעמ'])
    act(() => result.current.setValue('אחוז_מעמ', '18'))
    expect(result.current.dirtyNames).toEqual([])
  })

  it('ביטול מוחק את הטיוטות של השמות שנמסרו בלבד', () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => {
      result.current.setValue('אחוז_מעמ', '17')
      result.current.setValue('תנאי_תשלום_ימים', '45')
    })
    act(() => result.current.reset(['אחוז_מעמ']))
    expect(result.current.values['אחוז_מעמ']).toBe('18')
    expect(result.current.values['תנאי_תשלום_ימים']).toBe('45')
  })
})

describe('useParamsForm — ולידציה', () => {
  it('ערך ריק אינו 0 — הוא שגיאה (A-4), וההודעה אומרת "חסר ערך" ולא טווח (C6)', () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => result.current.setValue('אחוז_מעמ', ''))
    expect(result.current.errors['אחוז_מעמ']).toBe('יש למלא ערך — שדה ריק אינו 0')
  })

  it('ערך מחוץ-לטווח מקבל את הודעת-הטווח של השורה עצמה', () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => result.current.setValue('אחוז_מעמ', '150'))
    expect(result.current.errors['אחוז_מעמ']).toBe(
      'ערך חוקי: מספר בין 0 ל-100, עד שתי ספרות אחרי הנקודה',
    )
  })

  it('שורה שלא נגעו בה אינה מקבלת שגיאה גם אם ערכה ההיסטורי פסול', () => {
    const { result } = setup([row('אחוז_מעמ', '999', 'pricing_timing')], { canEditAll: true })
    expect(result.current.errors).toEqual({})
  })

  it('סכום-משקולות שאינו 1.00 נחסם — ורק אחרי שנגעו במשקולת', () => {
    const { result } = setup(WEIGHT_ROWS, { canEditAll: true })
    expect(result.current.crossFieldErrors).toEqual([])
    act(() => result.current.setValue('משקולת_היענות', '0.50'))
    expect(result.current.crossFieldErrors).toContain(WEIGHTS_SUM_ERROR)
    act(() => result.current.setValue('משקולת_קרבה', '0.15'))
    expect(result.current.crossFieldErrors).toEqual([])
  })

  it('גולפוסט גדול משער-הפסילה נחסם', () => {
    const { result } = setup(DISTANCE_ROWS, { canEditAll: true })
    act(() => result.current.setValue('גולפוסט_מרחק_קמ', '90'))
    expect(result.current.crossFieldErrors).toContain(DISTANCE_ORDER_ERROR)
  })

  // 🔴 שני הכללים שנוספו באודיט-הסגירה (03/09/2026). הראשון הוא **באג-כסף**: היפוך המדרגות
  // מוחק את מדרגת ה-50% בשקט, וביטול 50 שעות לפני אירוע מחויב ב-100%. הנימוק המלא ליד
  // `cancellationOrderOk` ב-`paramsRegistry.js`; כאן נבדק שהשער **באמת נורה**, ולא רק שהתקין עובר.
  it('מדרגות דמי-ביטול הפוכות נחסמות — ורק אחרי שנגעו באחת מהן', () => {
    const { result } = setup(COMPENSATION_ROWS, { canEditAll: true })
    expect(result.current.crossFieldErrors).toEqual([])
    act(() => result.current.setValue('שעות_פיצוי_ביטול_מלא', '100'))
    expect(result.current.crossFieldErrors).toContain(CANCELLATION_ORDER_ERROR)
    act(() => result.current.setValue('שעות_פיצוי_ביטול_מלא', '24'))
    expect(result.current.crossFieldErrors).toEqual([])
  })

  it('ימי-אזהרה ארוכים מימי-התוקף נחסמים', () => {
    const { result } = setup(EXPIRY_ROWS, { canEditAll: true })
    act(() => result.current.setValue('ימי_אזהרה_הצעה_פגה', '40'))
    expect(result.current.crossFieldErrors).toContain(EXPIRY_WARNING_ORDER_ERROR)
  })

  it('ערך פסול אינו נשלח בכלל', async () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => result.current.setValue('אחוז_מעמ', ''))
    let outcome
    await act(async () => {
      outcome = await result.current.submit(['אחוז_מעמ'])
    })
    expect(updateParams).not.toHaveBeenCalled()
    expect(outcome).toEqual({ ok: false, written: [] })
  })
})

describe('useParamsForm — הרשאות (§4.4 / V-9)', () => {
  it('בעלת השורה יכולה לערוך אותה גם בלי עריכה על המודול', () => {
    const { result } = setup(PRICING_ROWS, { roleId: FINANCE_ROLE, canEditAll: false })
    expect(result.current.canEditRow(PRICING_ROWS[0])).toBe(true)
  })

  it('שורה ללא בעלים אינה נחשבת "שלי" גם כשאין roleId', () => {
    const orphan = row('משקולת_קרבה', '0.25', 'smart_match', null)
    const { result } = setup([orphan], { roleId: null, canEditAll: false })
    expect(result.current.canEditRow(orphan)).toBe(false)
  })

  it('אצווה מעורבת לעולם אינה נשלחת — רק השורות שמותר לערוך יוצאות', async () => {
    const rows = [
      row('אחוז_מעמ', '18', 'pricing_timing', FINANCE_ROLE),
      row('משקולת_קרבה', '0.25', 'smart_match', 9),
    ]
    const { result } = setup(rows, { roleId: FINANCE_ROLE, canEditAll: false })
    act(() => {
      result.current.setValue('אחוז_מעמ', '17')
      result.current.setValue('משקולת_קרבה', '0.30')
    })
    await act(async () => {
      await result.current.submit(['אחוז_מעמ', 'משקולת_קרבה'])
    })
    expect(updateParams).toHaveBeenCalledTimes(1)
    expect(updateParams).toHaveBeenCalledWith(
      [{ name: 'אחוז_מעמ', value: '17', ownerRoleId: FINANCE_ROLE }],
      { roleId: FINANCE_ROLE, canEditAll: false },
    )
  })
})

describe('useParamsForm — שמירה וכשל', () => {
  it('שמירה מוצלחת מנקה את מונה-השינויים ומחזירה את השמות שנכתבו', async () => {
    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => result.current.setValue('אחוז_מעמ', '17'))
    let outcome
    await act(async () => {
      outcome = await result.current.submit(['אחוז_מעמ', 'תנאי_תשלום_ימים'])
    })
    expect(outcome).toEqual({ ok: true, written: ['אחוז_מעמ'] })
    expect(result.current.dirtyNames).toEqual([])
    expect(result.current.values['אחוז_מעמ']).toBe('17')
  })

  it('כשל נוקב בשם השדה — והטיוטה של השדה הבא נשארת בדיוק כפי שהוקלדה', async () => {
    const denied = Object.assign(new Error('הפרמטר "אחוז_מעמ" לא עודכן.'), {
      code: RLS_DENIED_CODE,
    })
    updateParams.mockRejectedValueOnce(denied)

    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => {
      result.current.setValue('אחוז_מעמ', '19')
      result.current.setValue('תנאי_תשלום_ימים', '45')
    })
    let outcome
    await act(async () => {
      outcome = await result.current.submit(['אחוז_מעמ', 'תנאי_תשלום_ימים'])
    })

    expect(outcome).toEqual({ ok: false, written: [] })
    expect(result.current.saveError).toBe(
      saveFailedMessage('אחוז מע"מ', 'ייתכן שאין לך הרשאה לשנות אותה'),
    )
    // 🔴 הלב של C5 §5.6.17.4 — שני הערכים שהוקלדו עדיין על המסך.
    expect(result.current.values['אחוז_מעמ']).toBe('19')
    expect(result.current.values['תנאי_תשלום_ימים']).toBe('45')
    // והשורה השנייה מעולם לא נשלחה — הרצף נעצר בכשל הראשון.
    expect(updateParams).toHaveBeenCalledTimes(1)
  })

  it('שורה שכן נכתבה לפני הכשל מפסיקה להיספר כ"שונתה"', async () => {
    updateParams.mockResolvedValueOnce(['אחוז_מעמ'])
    updateParams.mockRejectedValueOnce(new Error('נפילת רשת'))

    const { result } = setup(PRICING_ROWS, { canEditAll: true })
    act(() => {
      result.current.setValue('אחוז_מעמ', '17')
      result.current.setValue('תנאי_תשלום_ימים', '45')
    })
    let outcome
    await act(async () => {
      outcome = await result.current.submit(['אחוז_מעמ', 'תנאי_תשלום_ימים'])
    })

    expect(outcome).toEqual({ ok: false, written: ['אחוז_מעמ'] })
    expect(result.current.dirtyNames).toEqual(['תנאי_תשלום_ימים'])
    expect(result.current.saveError).toBe(saveFailedMessage('תנאי תשלום', 'נפילת רשת'))
  })
})
