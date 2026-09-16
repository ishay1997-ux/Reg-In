// בדיקות שכבת-ה-API של מודול 11. 🔴 **הן קיימות בשביל כשל אחד שאין לו סימפטום:** טבלה עם
// RLS דלוק ואפס policies מחזירה **אפס שורות עם `error: null`**, ותשובה חלקית מ-RPC נראית
// בדיוק כמו דוח ריק. שער-הצורה הוא מה שהופך "המסך משקר" ל"המסך נכשל בקול".

import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: (...args) => rpc(...args) } }))

import {
  REPORT_REQUIRED_KEYS,
  REPORT_SHAPE_DRIFT_CODE,
  approveFeedbackAiRun,
  assertReportShape,
  callReport,
  normalizeCharts,
} from './api'

// מטען-מינימום תקין לפי C8 — כל עשרת המפתחות, עם הערכים הריקים שהחוזה מתיר.
const validPayload = (over = {}) => ({
  population: { n: 215, label: 'אוכלוסייה: …', excluded: {} },
  window: { from: '2026-01-01', to: '2026-09-06', label: '2026' },
  tiles: [],
  chart: null,
  columns: [],
  rows: [],
  so_what: null,
  definitions: '',
  drill: null,
  meta: { measured_at: '2026-09-16T00:00:00Z', missing_params: [], notes: [] },
  ...over,
})

beforeEach(() => {
  rpc.mockReset()
})

describe('assertReportShape — שער-הצורה של C8', () => {
  it('מטען תקין עובר ומוחזר כפי-שהוא', () => {
    const payload = validPayload()
    expect(assertReportShape(payload)).toBe(payload)
  })

  // 🔑 ההבחנה שכל השער נשען עליה: **מפתח שנעדר** = חוזה שנשבר · **מפתח עם `null`** =
  // תשובה לגיטימית ("אין מה לומר"). ‏`Object.hasOwn` ולא `=== undefined` לבדו.
  it('כל אחד מעשרת המפתחות חסר ⇒ זריקה עם הקוד שלנו', () => {
    for (const key of REPORT_REQUIRED_KEYS) {
      const broken = validPayload()
      delete broken[key]
      let thrown = null
      try {
        assertReportShape(broken)
      } catch (err) {
        thrown = err
      }
      expect(thrown, `המפתח "${key}" לא נאכף`).not.toBeNull()
      expect(thrown.code).toBe(REPORT_SHAPE_DRIFT_CODE)
    }
  })

  it('מפתח שקיים עם null מותר היכן שהחוזה מתיר, ואסור היכן שלא', () => {
    expect(() => assertReportShape(validPayload({ chart: null, so_what: null }))).not.toThrow()
    expect(() => assertReportShape(validPayload({ population: null }))).toThrow()
    expect(() => assertReportShape(validPayload({ meta: null }))).toThrow()
  })

  it('טיפוס שגוי במפתח-מערך נתפס — `rows` שאינו מערך אינו "שורה אחת"', () => {
    expect(() => assertReportShape(validPayload({ rows: { a: 1 } }))).toThrow()
    expect(() => assertReportShape(validPayload({ tiles: null }))).toThrow()
  })

  // 🔴 שלושת אלה הם בדיוק מה ש"אפס שורות עם `error: null`" מייצר, ושהמסך היה מרנדר כ"ריק".
  it('null · undefined · מערך ⇒ זריקה, ולא מסך ריק', () => {
    expect(() => assertReportShape(null)).toThrow()
    expect(() => assertReportShape(undefined)).toThrow()
    expect(() => assertReportShape([])).toThrow()
  })

  it('ההודעה אינה נוקבת בשם-שדה — שם-מפתח הוא ז׳רגון-בנאים ואסור על המסך', () => {
    try {
      assertReportShape(validPayload({ rows: undefined }))
    } catch (err) {
      expect(err.message).toBe('יש תקלה בנתונים.')
      expect(err.message).not.toContain('rows')
    }
  })
})

describe('callReport', () => {
  it('שולח את ארבעת הפרמטרים תמיד, גם כשהם ריקים', async () => {
    rpc.mockResolvedValue({ data: validPayload(), error: null })
    await callReport('report_m09_aging', {})
    expect(rpc).toHaveBeenCalledWith('report_m09_aging', {
      p_from: null,
      p_to: null,
      p_customer_id: null,
      p_drill: null,
    })
  })

  it('מעביר ערכים שנמסרו, כולל מצב-דריל', async () => {
    rpc.mockResolvedValue({ data: validPayload(), error: null })
    await callReport('report_m09_aging', {
      from: '2026-01-01',
      to: '2026-09-06',
      customerId: '42',
      drill: { level: 1, bucket: '61-90' },
    })
    expect(rpc.mock.calls[0][1]).toEqual({
      p_from: '2026-01-01',
      p_to: '2026-09-06',
      p_customer_id: '42',
      p_drill: { level: 1, bucket: '61-90' },
    })
  })

  it('שגיאת-מסד נזרקת עם הקוד שלה — המסך מבחין בין 42501 לשאר', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } })
    await expect(callReport('report_m09_aging', {})).rejects.toMatchObject({ code: '42501' })
  })

  it('תשובה בצורה שגויה נזרקת ואינה מוחזרת כדוח', async () => {
    rpc.mockResolvedValue({ data: { rows: [] }, error: null })
    await expect(callReport('report_m09_aging', {})).rejects.toMatchObject({
      code: REPORT_SHAPE_DRIFT_CODE,
    })
  })
})

describe('approveFeedbackAiRun — הכתיבה היחידה של המודול', () => {
  it('מאשרת רק כש-ok === true', async () => {
    rpc.mockResolvedValue({ data: { ok: true, run_id: 7 }, error: null })
    await expect(approveFeedbackAiRun(7)).resolves.toEqual({ ok: true, run_id: 7 })
    expect(rpc).toHaveBeenCalledWith('approve_feedback_ai_run', { p_run_id: 7 })
  })

  // 🔴 תשובה בלי הדגל אינה "הצלחה חלקית" — היא חוזה שנשבר, ובמודול שמפרסם דוח למנכ"ל
  // אסור לה לעבור בשקט.
  it('תשובה בלי ok ⇒ זריקה, ולא "אושר"', async () => {
    rpc.mockResolvedValue({ data: { run_id: 7 }, error: null })
    await expect(approveFeedbackAiRun(7)).rejects.toThrow(/תשובת השרת לא הייתה תקינה/)
  })

  it('שגיאת-מסד ⇒ זריקה', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } })
    await expect(approveFeedbackAiRun(7)).rejects.toMatchObject({ code: '42501' })
  })
})

describe('normalizeCharts — תקרת שני גרפים לדף (C8)', () => {
  it('אובייקט יחיד ⇒ מערך בן אחד · null ⇒ ריק', () => {
    expect(normalizeCharts({ type: 'bar' })).toEqual([{ type: 'bar' }])
    expect(normalizeCharts(null)).toEqual([])
  })

  it('מערך נחתך לשניים — גרף שלישי היה נראה תקין לחלוטין', () => {
    expect(normalizeCharts([{ type: 'bar' }, { type: 'line' }, { type: 'scatter' }])).toHaveLength(
      2,
    )
  })
})
