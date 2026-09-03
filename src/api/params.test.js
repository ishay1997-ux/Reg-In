// בדיקות ל-`src/api/params.js`. הקובץ נוצר בצעד 2.3 של מודול 9, ביחד עם המעבר של ששת
// הספים הקשיחים ל-`params`; מה שנבדק כאן הוא **החוזה** שכל אותם מסכים נשענים עליו —
// שם שלא חזר זורק בעברית ונוקב בשמו, ולעולם אין ברירת-מחדל.
//
// מוק ל-`@/supabaseClient` חובה (התבנית הקיימת בכל api.test.js בריפו): `supabaseClient.js`
// קורא ל-`createClient(import.meta.env.VITE_SUPABASE_URL, …)` בזמן-טעינה ונכשל בלי `.env.local`.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/supabaseClient', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '@/supabaseClient'
import { getParamValues } from './params'

// בילדר-שרשרתי מזערי: `from('params').select(...).in(...)` — קריאה אחת בכל בדיקה,
// ולכן די בלכידת הארגומנטים של `in` ובהחזרת התוצאה שהבדיקה הכינה.
function mockParams(result) {
  const captured = {}
  const builder = {
    select: vi.fn(() => builder),
    in: vi.fn((column, values) => {
      captured.column = column
      captured.values = values
      return Promise.resolve(result)
    }),
  }
  supabase.from.mockReturnValue(builder)
  return captured
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getParamValues — הקורא המשותף של params', () => {
  it('מחזיר מפה של שם ⇐ ערך גולמי (טקסט, בלי פענוח)', async () => {
    mockParams({
      data: [
        { param_name: 'שעות_תוקף_זימון', param_value: '48' },
        { param_name: 'סף_שביעות_רצון', param_value: '3' },
      ],
      error: null,
    })

    const values = await getParamValues(['שעות_תוקף_זימון', 'סף_שביעות_רצון'])

    // ⚠️ הערך נשאר **מחרוזת** — הפענוח הוא של הקורא (`optionalNumber`/`paramBoolean`).
    expect(values).toEqual({ שעות_תוקף_זימון: '48', סף_שביעות_רצון: '3' })
  })

  it('שולף בשאילתה אחת, ומסנן שמות כפולים לפני היציאה למסד', async () => {
    const captured = mockParams({
      data: [{ param_name: 'שעות_אירוע_דחוף', param_value: '72' }],
      error: null,
    })

    await getParamValues(['שעות_אירוע_דחוף', 'שעות_אירוע_דחוף'])

    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(captured.column).toBe('param_name')
    expect(captured.values).toEqual(['שעות_אירוע_דחוף'])
  })

  it('רשימה ריקה ⇐ מפה ריקה בלי לגעת במסד', async () => {
    mockParams({ data: [], error: null })

    await expect(getParamValues([])).resolves.toEqual({})
    await expect(getParamValues(undefined)).resolves.toEqual({})
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('🔴 שם שלא חזר — זורק ונוקב בשמו, ולעולם לא ברירת-מחדל', async () => {
    mockParams({ data: [{ param_name: 'שעות_תוקף_זימון', param_value: '48' }], error: null })

    await expect(getParamValues(['שעות_תוקף_זימון', 'סף_שביעות_רצון'])).rejects.toThrow(
      'הפרמטר "סף_שביעות_רצון" חסר בהגדרות המערכת.',
    )
  })

  it('🔴 שני שמות חסרים — שניהם בהודעה אחת, בלשון רבים', async () => {
    mockParams({ data: [], error: null })

    await expect(getParamValues(['סף_שביעות_רצון', 'סף_לוגיסטיקה_ימי_עסקים'])).rejects.toThrow(
      'הפרמטרים "סף_שביעות_רצון", "סף_לוגיסטיקה_ימי_עסקים" חסרים בהגדרות המערכת.',
    )
  })

  it('🚨 שורה שחזרה עם ערך ריק/רווחים נחשבת חסרה — `Number("  ")` הוא 0', async () => {
    mockParams({
      data: [
        { param_name: 'סף_שביעות_רצון', param_value: '   ' },
        { param_name: 'שעות_תוקף_זימון', param_value: null },
      ],
      error: null,
    })

    await expect(getParamValues(['סף_שביעות_רצון', 'שעות_תוקף_זימון'])).rejects.toThrow(
      'הפרמטרים "סף_שביעות_רצון", "שעות_תוקף_זימון" חסרים בהגדרות המערכת.',
    )
  })

  it('🚨 "הצלחה ריקה" של RLS (אפס שורות, error:null) נשמעת ואינה נבלעת', async () => {
    mockParams({ data: null, error: null })

    await expect(getParamValues(['סף_לוגיסטיקה_ימי_עסקים'])).rejects.toThrow(
      'הפרמטר "סף_לוגיסטיקה_ימי_עסקים" חסר בהגדרות המערכת.',
    )
  })

  it('שגיאת-מסד נעטפת בעברית ושומרת את הקוד המקורי', async () => {
    mockParams({ data: null, error: { code: '42501', message: 'permission denied' } })

    await expect(getParamValues(['סף_שביעות_רצון'])).rejects.toMatchObject({
      message: 'שגיאה בטעינת הגדרות המערכת.',
      code: '42501',
    })
  })
})
