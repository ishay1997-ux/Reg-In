// בדיקות `payrollApi.js` — מיפוי שגיאות לקוד יציב (חוזה §4.2), שערי-צורה, ופסק-זמן.
// 🔴 `@/supabaseClient` ממוקק: בלעדיו הקובץ נופל ב-CI (אין `VITE_SUPABASE_*` שם).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), functions: { invoke: vi.fn() }, storage: { from: vi.fn() } },
}))

import { supabase } from '@/supabaseClient'
import {
  PAYROLL_EDGE_TIMEOUT_MS,
  PayrollError,
  approvePayrollNoResponse,
  correctUnclaimedAssignment,
  distributePayrollReview,
  findPayrollReview,
  getPayrollFileUrl,
  getPayrollOperationStatus,
  getPayrollPreview,
  issuePayrollReport,
  listPayrollReports,
  payrollCodeOf,
  retryAccountantSend,
  storageCodeOf,
} from './payrollApi'
import { makePreview, makeReview, opStatus, reportItem } from './payroll/testFixtures'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('payrollCodeOf — שגיאת RPC ⇒ קוד', () => {
  it('detail "PAYROLL:<CODE>" ⇒ הקוד', () => {
    expect(payrollCodeOf({ code: 'P0001', details: 'PAYROLL:PREVIEW_CHANGED' })).toBe(
      'PREVIEW_CHANGED',
    )
  })
  it('42501 ⇒ PERMISSION_DENIED', () => {
    expect(payrollCodeOf({ code: '42501', message: 'denied' })).toBe('PERMISSION_DENIED')
  })
  it('בלי קוד (תקלת רשת) ⇒ NETWORK; קוד זר ⇒ UNEXPECTED', () => {
    expect(payrollCodeOf({ message: 'Failed to fetch' })).toBe('NETWORK')
    expect(payrollCodeOf({ code: '23505' })).toBe('UNEXPECTED')
  })
})

describe('getPayrollPreview', () => {
  it('שולח את שלושת מפתחות-הזהות ומחזיר את התשובה', async () => {
    supabase.rpc.mockResolvedValue({ data: makePreview(), error: null })
    const preview = await getPayrollPreview({ period: '2026-07-01' })
    expect(supabase.rpc).toHaveBeenCalledWith('payroll_preview', {
      p_period: '2026-07-01',
      p_kind: 'regular',
      p_original_report_id: null,
    })
    expect(preview.totals.line_count).toBe(2)
  })

  it('שדה חסר בתשובה ⇒ SHAPE (לא מציגים חצי-נתון)', async () => {
    const broken = makePreview()
    delete broken.version
    supabase.rpc.mockResolvedValue({ data: broken, error: null })
    await expect(getPayrollPreview({ period: '2026-07-01' })).rejects.toMatchObject({
      code: 'SHAPE',
    })
  })

  it('שגיאה עם רמז JSON ⇒ הרמז נשמר (למשל report_id של דוח קיים)', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', details: 'PAYROLL:PERIOD_EXISTS', hint: '{"report_id":15}' },
    })
    await expect(getPayrollPreview({ period: '2026-08-01' })).rejects.toMatchObject({
      code: 'PERIOD_EXISTS',
      hint: { report_id: 15 },
    })
  })
})

describe('תשובת {ok:false} ⇒ זריקה עם הקוד', () => {
  it('approvePayrollNoResponse', async () => {
    supabase.rpc.mockResolvedValue({
      data: { ok: false, code: 'DEADLINE_NOT_PASSED' },
      error: null,
    })
    await expect(
      approvePayrollNoResponse({ recipientId: 1, expectedDigest: 'd', reason: 'r', evidence: 'e' }),
    ).rejects.toMatchObject({ code: 'DEADLINE_NOT_PASSED' })
  })

  it('correctUnclaimedAssignment מעביר את כל הפרמטרים בשמות החוזה', async () => {
    supabase.rpc.mockResolvedValue({ data: { ok: true, correction_id: 1 }, error: null })
    await correctUnclaimedAssignment({
      projectId: 5,
      hostessId: 6,
      assignmentNumber: 1,
      field: 'actual_hours',
      expectedValue: 6,
      newValue: 7,
      reason: 'דוח שעות',
      caseId: 9,
    })
    expect(supabase.rpc).toHaveBeenCalledWith('correct_unclaimed_assignment', {
      p_project_id: 5,
      p_hostess_id: 6,
      p_assignment_number: 1,
      p_field: 'actual_hours',
      p_expected_value: 6,
      p_new_value: 7,
      p_reason: 'דוח שעות',
      p_case_id: 9,
    })
  })
})

describe('findPayrollReview', () => {
  it('אין בדיקה פעילה ⇒ null', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null })
    expect(await findPayrollReview({ period: '2026-07-01', kind: 'regular' })).toBeNull()
  })
  it('יש ⇒ הצורה המלאה', async () => {
    supabase.rpc.mockResolvedValue({ data: makeReview(), error: null })
    const review = await findPayrollReview({ period: '2026-07-01', kind: 'regular' })
    expect(review.recipients).toHaveLength(2)
  })
})

describe('listPayrollReports', () => {
  it('פריט בלי open_post_issue_cases (F6) ⇒ SHAPE', async () => {
    const item = reportItem()
    delete item.open_post_issue_cases
    supabase.rpc.mockResolvedValue({ data: [item], error: null })
    await expect(listPayrollReports()).rejects.toMatchObject({ code: 'SHAPE' })
  })
})

describe('פונקציית השרת payroll', () => {
  it('issue שולח action ומזהה-הפעולה', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { ok: true, operation_id: 'x' },
      error: null,
    })
    await issuePayrollReport({
      operationId: 'x',
      reviewId: 1,
      expectedVersion: 'v1:a',
      period: '2026-07-01',
      kind: 'regular',
      originalReportId: null,
    })
    expect(supabase.functions.invoke).toHaveBeenCalledWith('payroll', {
      body: {
        action: 'issue',
        operation_id: 'x',
        review_id: 1,
        expected_version: 'v1:a',
        period: '2026-07-01',
        kind: 'regular',
        original_report_id: null,
      },
    })
  })

  it('{ok:false, code} ⇒ זריקה עם הקוד והנתונים (למשל חוסמים)', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        ok: false,
        code: 'REVIEW_NOT_READY',
        blockers: [{ code: 'OBJECTION_OPEN', count: 1 }],
      },
      error: null,
    })
    await expect(
      issuePayrollReport({ operationId: 'x', reviewId: 1, expectedVersion: 'v', period: 'p' }),
    ).rejects.toMatchObject({
      code: 'REVIEW_NOT_READY',
      data: { blockers: [{ code: 'OBJECTION_OPEN', count: 1 }] },
    })
  })

  it('401/403 ⇒ PERMISSION_DENIED', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: { context: { status: 403 } } })
    await expect(
      retryAccountantSend({ reportId: 1, priorAttemptId: 2, confirmedRecipient: 'a@b.c' }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('גוף שגיאה עם code ⇒ אותו קוד', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 409, json: async () => ({ code: 'DELIVERY_ACTIVE' }) } },
    })
    await expect(
      retryAccountantSend({ reportId: 1, priorAttemptId: 2, confirmedRecipient: 'a@b.c' }),
    ).rejects.toMatchObject({ code: 'DELIVERY_ACTIVE' })
  })

  it('כשל רשת אחרי שהבקשה יצאה ⇒ RESULT_UNKNOWN (לא "נכשל")', async () => {
    supabase.functions.invoke.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(
      issuePayrollReport({ operationId: 'x', reviewId: 1, expectedVersion: 'v', period: 'p' }),
    ).rejects.toMatchObject({ code: 'RESULT_UNKNOWN' })
  })

  it('distribute מוסיף app_origin ובודק צורת תוצאה', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { ok: true, processed: [], skipped: [], remaining: 0 },
      error: null,
    })
    await distributePayrollReview({ reviewId: 1, expectedRevision: 2, requestId: 'r' })
    const body = supabase.functions.invoke.mock.calls[0][1].body
    expect(body).toMatchObject({ action: 'distribute', mode: 'initial', recipient_ids: null })
    expect(body.app_origin).toBe(window.location.origin)
  })

  describe('פסק-זמן של 90 שניות', () => {
    afterEach(() => vi.useRealTimers())
    it('אין תשובה ⇒ RESULT_UNKNOWN', async () => {
      vi.useFakeTimers()
      supabase.functions.invoke.mockReturnValue(new Promise(() => {}))
      const pending = issuePayrollReport({
        operationId: 'x',
        reviewId: 1,
        expectedVersion: 'v',
        period: 'p',
      })
      const assertion = expect(pending).rejects.toMatchObject({ code: 'RESULT_UNKNOWN' })
      await vi.advanceTimersByTimeAsync(PAYROLL_EDGE_TIMEOUT_MS)
      await assertion
    })
  })
})

describe('getPayrollOperationStatus', () => {
  it('מחזיר את המצב השמור', async () => {
    supabase.rpc.mockResolvedValue({ data: opStatus(), error: null })
    expect((await getPayrollOperationStatus('x')).state).toBe('committed')
  })
})

describe('getPayrollFileUrl — ארבעה כשלים נפרדים', () => {
  function storageReturns(result) {
    supabase.storage.from.mockReturnValue({ createSignedUrl: vi.fn().mockResolvedValue(result) })
  }

  it('בלי הפניה ⇒ ARTIFACT_REFERENCE_MISSING, בלי לפנות לאחסון', async () => {
    await expect(getPayrollFileUrl(null, 'f.xlsx')).rejects.toMatchObject({
      code: 'ARTIFACT_REFERENCE_MISSING',
    })
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('קישור חתום ל-60 שניות עם שם-הקובץ המקורי', async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://x' }, error: null })
    supabase.storage.from.mockReturnValue({ createSignedUrl })
    expect(await getPayrollFileUrl('payroll/k.xlsx', '07_2026_Payroll_Report.xlsx')).toBe(
      'https://x',
    )
    expect(supabase.storage.from).toHaveBeenCalledWith('finance')
    expect(createSignedUrl).toHaveBeenCalledWith('payroll/k.xlsx', 60, {
      download: '07_2026_Payroll_Report.xlsx',
    })
  })

  it('לא נמצא / אין הרשאה / רשת', async () => {
    storageReturns({ data: null, error: { statusCode: '404', message: 'Object not found' } })
    await expect(getPayrollFileUrl('k', 'f')).rejects.toMatchObject({ code: 'ARTIFACT_NOT_FOUND' })
    storageReturns({ data: null, error: { statusCode: '403', message: 'denied' } })
    await expect(getPayrollFileUrl('k', 'f')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
    supabase.storage.from.mockReturnValue({
      createSignedUrl: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    })
    await expect(getPayrollFileUrl('k', 'f')).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('storageCodeOf: הודעת רשת בלי סטטוס ⇒ NETWORK', () => {
    expect(storageCodeOf({ message: 'Failed to fetch' })).toBe('NETWORK')
  })

  it('PayrollError נושא את הקוד', () => {
    expect(new PayrollError('X').code).toBe('X')
  })
})
