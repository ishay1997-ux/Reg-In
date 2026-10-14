// @vitest-environment node
// דוח-שכר במסלול הישן של send-email (חוזה §3.3): מותר רק כשהכותב הישן פעיל והדוח ישן.
import { describe, it, expect } from 'vitest'
import { LEGACY_PAYROLL_SEND_DISABLED, legacyPayrollSendRefusal } from './payrollGate.ts'

const LEGACY_OK = {
  configRead: true,
  legacyWriter: 'enabled',
  reportFound: true,
  operationId: null,
}

describe('legacyPayrollSendRefusal', () => {
  it('כותב ישן פעיל + דוח בלי operation ⇒ מותר', () => {
    expect(legacyPayrollSendRefusal(LEGACY_OK)).toBeNull()
  })

  it.each([
    ['כותב ישן כובה', { legacyWriter: 'disabled' }],
    ['דוח של התהליך החדש', { operationId: '6f1d0c1e-0000-4000-8000-000000000001' }],
    ['ההגדרות לא נקראו', { configRead: false }],
    ['ערך הגדרה לא מוכר', { legacyWriter: null }],
    ['הדוח לא נמצא', { reportFound: false }],
  ])('%s ⇒ 409 LEGACY_PAYROLL_SEND_DISABLED', (_label, patch) => {
    expect(legacyPayrollSendRefusal({ ...LEGACY_OK, ...patch })).toBe(LEGACY_PAYROLL_SEND_DISABLED)
  })
})
