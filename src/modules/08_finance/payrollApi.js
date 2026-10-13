// שכבת ה-API של דוח השכר החדש (מודול 8, 13/10/2026) — חוזה `payroll-contract.md` §4.2.
//
// 🔴 **מה הקובץ הזה אינו עושה: הוא אינו מחשב שכר.** כל מספר נולד במסד (`payroll_collect`)
// ומגיע לכאן מוכן. כאן יש רק: קריאה, אימות צורה, ותרגום שגיאה לקוד יציב.
//
// **מוסכמת השגיאות (חוזה §4.2):** כל עוטף זורק `PayrollError` עם `code` יציב —
//   · `error.details` שמתחיל ב-`PAYROLL:` ⇒ הקוד שאחרי הנקודתיים (D7);
//   · `42501` ⇒ `PERMISSION_DENIED`;
//   · תשובת `{ok:false, code}` ⇒ אותו `code`;
//   · כשל רשת לפני תשובה ⇒ `NETWORK` בקריאה, ו-`RESULT_UNKNOWN` בפעולת-שרת כותבת (ייתכן
//     שהפעולה בוצעה — המסך שואל סטטוס ואינו מניח כישלון).
// ההודעה העברית מגיעה מ-`payrollErrorMessage` (`payroll/payrollModel.js`), לא מהשרת: הודעה
// אחת לכל קוד, בניסוח של מדריך ה-UX.
//
// 🔴 **הכרעה: פעולות-השרת (edge) זורקות גם על פסק-זמן, ולא מחזירות `{code}`.** החוזה כותב
// "return {code:'RESULT_UNKNOWN'}"; זריקה עם אותו קוד היא אותו מידע, ומאפשרת למסך מסלול
// שגיאה אחד לכל העוטפים. הפיך — שורה אחת לכל עוטף.

import { supabase } from '@/supabaseClient'
import { assertFinanceShape } from '@/lib/projectFinance'

export const PAYROLL_EDGE_TIMEOUT_MS = 90_000

// ── שדות-חובה לכל צורה (חוזה §4.3) — שינוי בצורת ה-RPC מחייב עדכון כאן באותו קומיט. ──
const PAYROLL_PREVIEW_FIELDS = [
  'period',
  'period_end',
  'kind',
  'original_report_id',
  'month_state',
  'captured_at',
  'version',
  'totals',
  'lines',
  'pending_closure',
  'blockers',
  'warnings',
  'accountant',
  'active_review',
  'active_operation',
]
const PAYROLL_REVIEW_FIELDS = ['review', 'recipients', 'cases', 'readiness']
const PAYROLL_READINESS_FIELDS = ['ready', 'blockers', 'counts']
const PAYROLL_OPERATION_FIELDS = [
  'operation_id',
  'state',
  'failure_code',
  'report_id',
  'accountant_attempt',
  'next_action',
]
const PAYROLL_REPORT_LIST_FIELDS = [
  'report_id',
  'period',
  'report_kind',
  'original_report_id',
  'supplement_seq',
  'total_amount',
  'line_count',
  'issued_at',
  'delivery_state',
  'legacy',
  'artifact_available',
  'artifact_filename',
  'last_attempt',
  'open_post_issue_cases',
]
const PAYROLL_REPORT_DETAIL_FIELDS = [
  'lines',
  'attempts',
  'artifact',
  'review',
  'supplements',
  'original',
  'post_issue_cases',
]
const PAYROLL_DISTRIBUTION_FIELDS = ['processed', 'skipped', 'remaining']

export class PayrollError extends Error {
  constructor(code, { cause, hint, data } = {}) {
    super(code)
    this.name = 'PayrollError'
    this.code = code
    this.cause = cause
    // הקשר בטוח מהשרת: `hint` (JSON של D7) או שדות `{ok:false,…}` — למשל `report_id`, `blockers`.
    this.hint = hint ?? null
    this.data = data ?? null
  }
}

function parseHint(raw) {
  if (!raw || typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    // רמז שאינו JSON הוא טקסט חופשי — שומרים אותו כפי שהוא, לא מאבדים אותו.
    return { text: raw }
  }
}

// טהורה — נבדקת ביחידה. `error` הוא אובייקט-השגיאה של supabase-js.
export function payrollCodeOf(error) {
  const details = typeof error?.details === 'string' ? error.details : ''
  if (details.startsWith('PAYROLL:')) return details.slice('PAYROLL:'.length).trim()
  if (error?.code === '42501') return 'PERMISSION_DENIED'
  if (!error?.code) return 'NETWORK'
  return 'UNEXPECTED'
}

function rpcFailure(error) {
  return new PayrollError(payrollCodeOf(error), { cause: error, hint: parseHint(error?.hint) })
}

function okOrThrow(data) {
  if (data && data.ok === false) {
    throw new PayrollError(data.code || 'UNEXPECTED', { data })
  }
  return data
}

async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw rpcFailure(error)
  return okOrThrow(data)
}

function shaped(data, fields, context) {
  try {
    return assertFinanceShape(data, fields, context)
  } catch (cause) {
    throw new PayrollError('SHAPE', { cause })
  }
}

// ── קריאה לפונקציית השרת `payroll` ───────────────────────────────────────────────
// 401/403 ⇒ PERMISSION_DENIED. כל כשל אחר אחרי שהבקשה יצאה ⇒ RESULT_UNKNOWN: ייתכן שהשרת
// כבר ביצע (הפקה, שליחה). המסך שואל סטטוס לפני שהוא מציע פעולה נוספת (חוזה §3.2).
async function edgeFailure(error) {
  const status = error?.context?.status
  if (status === 401 || status === 403) return new PayrollError('PERMISSION_DENIED')
  if (typeof error?.context?.json === 'function') {
    try {
      const body = await error.context.json()
      if (body?.code) return new PayrollError(body.code, { data: body })
    } catch {
      // גוף שאינו JSON — נופלים לקוד הכללי שמתחת, לא בולעים.
      return new PayrollError('RESULT_UNKNOWN', { cause: error })
    }
  }
  return new PayrollError('RESULT_UNKNOWN', { cause: error })
}

async function edge(action, body) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new PayrollError('RESULT_UNKNOWN')), PAYROLL_EDGE_TIMEOUT_MS)
  })
  try {
    const { data, error } = await Promise.race([
      supabase.functions.invoke('payroll', { body: { action, ...body } }),
      timeout,
    ])
    if (error) throw await edgeFailure(error)
    return okOrThrow(data)
  } catch (err) {
    if (err instanceof PayrollError) throw err
    throw new PayrollError('RESULT_UNKNOWN', { cause: err })
  } finally {
    clearTimeout(timer)
  }
}

function appOrigin() {
  return typeof window === 'undefined' ? '' : window.location.origin
}

// ── תצוגה מקדימה והיסטוריה ──────────────────────────────────────────────────────

export async function getPayrollPreview({ period, kind = 'regular', originalReportId = null }) {
  const data = await rpc('payroll_preview', {
    p_period: period,
    p_kind: kind,
    p_original_report_id: originalReportId,
  })
  return shaped(data, PAYROLL_PREVIEW_FIELDS, 'נתוני התצוגה המקדימה')
}

export async function listPayrollReports() {
  const data = await rpc('payroll_report_list')
  const items = Array.isArray(data) ? data : data?.reports
  if (!Array.isArray(items)) throw new PayrollError('SHAPE')
  return items.map((item) => shaped(item, PAYROLL_REPORT_LIST_FIELDS, 'רשימת הדוחות'))
}

export async function getPayrollReportDetail(reportId) {
  const data = await rpc('payroll_report_detail', { p_report_id: reportId })
  return shaped(data, PAYROLL_REPORT_DETAIL_FIELDS, 'פרטי הדוח')
}

// הורדת קובץ שהופק: קישור חתום ל-60 שניות, עם שם-הקובץ המקורי. ארבעה כשלים נפרדים
// (חוזה §4.1 סעיף 5): אין הפניה · הקובץ לא נמצא · אין הרשאה · תקלת רשת.
export async function getPayrollFileUrl(key, filename) {
  if (!key) throw new PayrollError('ARTIFACT_REFERENCE_MISSING')
  let result
  try {
    result = await supabase.storage
      .from('finance')
      .createSignedUrl(key, 60, filename ? { download: filename } : undefined)
  } catch (cause) {
    throw new PayrollError('NETWORK', { cause })
  }
  const { data, error } = result
  if (error) throw new PayrollError(storageCodeOf(error), { cause: error })
  if (!data?.signedUrl) throw new PayrollError('ARTIFACT_NOT_FOUND')
  return data.signedUrl
}

export function storageCodeOf(error) {
  const status = Number(error?.statusCode ?? error?.status)
  const message = String(error?.message ?? '').toLowerCase()
  if (status === 404 || message.includes('not found')) return 'ARTIFACT_NOT_FOUND'
  if (status === 401 || status === 403 || message.includes('denied')) return 'PERMISSION_DENIED'
  if (!status && (message.includes('fetch') || message.includes('network'))) return 'NETWORK'
  return 'ARTIFACT_NOT_FOUND'
}

export async function getDeliveryAddress(intended) {
  return rpc('payroll_delivery_address', { p_intended: intended })
}

// ── מחזור הבדיקה ─────────────────────────────────────────────────────────────────

export async function createPayrollReview({ period, kind, originalReportId, version }) {
  return rpc('payroll_review_create', {
    p_period: period,
    p_kind: kind,
    p_original_report_id: originalReportId,
    p_expected_version: version,
  })
}

export async function getPayrollReview(reviewId) {
  const data = await rpc('payroll_review_get', { p_review_id: reviewId })
  return shaped(data, PAYROLL_REVIEW_FIELDS, 'נתוני מעקב הבדיקה')
}

export async function findPayrollReview({ period, kind, originalReportId }) {
  const data = await rpc('payroll_review_find', {
    p_period: period,
    p_kind: kind,
    p_original: originalReportId,
  })
  if (data === null || data?.review === null) return null
  return shaped(data, PAYROLL_REVIEW_FIELDS, 'נתוני מעקב הבדיקה')
}

export async function refreshPayrollReview({ reviewId, expectedRevision }) {
  return rpc('payroll_review_refresh', {
    p_review_id: reviewId,
    p_expected_revision: expectedRevision,
  })
}

export async function getPayrollReviewReadiness(reviewId) {
  const data = await rpc('payroll_review_readiness', { p_review_id: reviewId })
  return shaped(data, PAYROLL_READINESS_FIELDS, 'נתוני המוכנות להפקה')
}

export async function approvePayrollDraft({ reviewId, expectedRevision, version }) {
  return rpc('payroll_review_manager_approve', {
    p_review_id: reviewId,
    p_expected_revision: expectedRevision,
    p_version: version,
  })
}

export async function setPayrollReviewDeadline({ reviewId, expectedRevision, deadline, reason }) {
  return rpc('payroll_review_set_deadline', {
    p_review_id: reviewId,
    p_expected_revision: expectedRevision,
    p_deadline: deadline,
    p_reason: reason ?? null,
  })
}

export async function distributePayrollReview({
  reviewId,
  expectedRevision,
  recipientIds = null,
  mode = 'initial',
  requestId,
}) {
  const data = await edge('distribute', {
    review_id: reviewId,
    expected_revision: expectedRevision,
    recipient_ids: recipientIds,
    mode,
    request_id: requestId,
    app_origin: appOrigin(),
  })
  return shaped(data, PAYROLL_DISTRIBUTION_FIELDS, 'תוצאת השליחה')
}

export async function continuePayrollDistribution({ reviewId }) {
  const data = await edge('distribute_continue', { review_id: reviewId, app_origin: appOrigin() })
  return shaped(data, PAYROLL_DISTRIBUTION_FIELDS, 'תוצאת השליחה')
}

export async function resendPayrollReviewMail({
  recipientId,
  priorAttemptId,
  acknowledgeUnknown = false,
}) {
  return edge('resend_review', {
    recipient_id: recipientId,
    prior_attempt_id: priorAttemptId,
    acknowledge_unknown: acknowledgeUnknown,
    app_origin: appOrigin(),
  })
}

export async function getPayrollCaseDetail(caseId) {
  return rpc('payroll_review_case_detail', { p_case_id: caseId })
}

export async function resolvePayrollCase({
  caseId,
  expectedCaseRevision,
  outcome,
  reason,
  evidence = null,
}) {
  return rpc('payroll_review_resolve_case', {
    p_case_id: caseId,
    p_expected_case_revision: expectedCaseRevision,
    p_outcome: outcome,
    p_reason: reason,
    p_evidence: evidence,
  })
}

export async function approvePayrollNoResponse({
  recipientId,
  expectedDigest,
  reason,
  evidence,
  contactNote = null,
}) {
  return rpc('payroll_review_approve_no_response', {
    p_recipient_id: recipientId,
    p_expected_digest: expectedDigest,
    p_reason: reason,
    p_evidence: evidence,
    p_contact_note: contactNote,
  })
}

export async function correctUnclaimedAssignment({
  projectId,
  hostessId,
  assignmentNumber,
  field,
  expectedValue,
  newValue,
  reason,
  caseId = null,
}) {
  return rpc('correct_unclaimed_assignment', {
    p_project_id: projectId,
    p_hostess_id: hostessId,
    p_assignment_number: assignmentNumber,
    p_field: field,
    p_expected_value: expectedValue,
    p_new_value: newValue,
    p_reason: reason,
    p_case_id: caseId,
  })
}

export async function cancelPayrollReview({ reviewId, reason }) {
  return rpc('payroll_review_cancel', { p_review_id: reviewId, p_reason: reason })
}

// ── הפקה סופית ושליחה לרואה החשבון ──────────────────────────────────────────────

export async function issuePayrollReport({
  operationId,
  reviewId,
  expectedVersion,
  period,
  kind,
  originalReportId,
}) {
  return edge('issue', {
    operation_id: operationId,
    review_id: reviewId,
    expected_version: expectedVersion,
    period,
    kind,
    original_report_id: originalReportId,
  })
}

export async function resumePayrollOperation(operationId) {
  return edge('resume', { operation_id: operationId })
}

export async function getPayrollOperationStatus(operationId) {
  const data = await rpc('payroll_operation_status', { p_operation_id: operationId })
  return shaped(data, PAYROLL_OPERATION_FIELDS, 'מצב ההפקה')
}

export async function abandonPayrollOperation(operationId) {
  return rpc('payroll_operation_abandon', { p_operation_id: operationId })
}

export async function retryAccountantSend({
  reportId,
  priorAttemptId,
  confirmedRecipient,
  acknowledgeUnknown = false,
}) {
  return edge('retry_accountant', {
    report_id: reportId,
    prior_attempt_id: priorAttemptId,
    confirmed_recipient: confirmedRecipient,
    acknowledge_unknown: acknowledgeUnknown,
  })
}
