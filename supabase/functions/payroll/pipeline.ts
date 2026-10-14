// תזמור פונקציית-השרת `payroll` — כל הצעדים, בלי שום תלות ישירה ב-Deno, ב-Supabase או ברשת.
//
// 🔑 **למה התלויות מוזרקות:** אין לנו שרת-Supabase מקומי (חוזה §9.1 — אין Docker), ולכן כל נקודת
// קריסה בטבלה §3.2 נבדקת ב-Vitest מול זיופים (`pipeline.test.js`). `index.ts` רק מחבר את התלויות
// האמיתיות ומעביר אליהן.
//
// 🔒 **מי מחליט מה מותר:** המסד. כל פעולה מתחילה בקריאה בזהות המשתמשת (`userRpc`) לפונקציה שבודקת
// הרשאה; רק אחריה יש קריאות בשירות (`adminRpc`), ותמיד עם `p_actor_email` מהזהות המאומתת — והמסד
// בודק שוב שלמשתמשת יש 'כספים' עריכה. הקוד כאן אינו שער-הרשאה שני.
//
// 🔑 **שלושה מצבי שליחה, ולא שניים:** נשלח · נכשל (בוודאות לא יצא) · לא ידוע (ייתכן שיצא). כל
// כשל **לפני** שהבקשה ל-Make יצאה (קובץ, תבנית, שומר) הוא "נכשל"; כל כשל אחריה הוא "לא ידוע".

import {
  buildSalaryReportDocument,
  displayDate,
  reportPeriodLabel,
  SalaryReportError,
  type SalaryDocument,
} from './document.ts'
import { formatTimestampFull } from './dates.ts'
import { GuardError, guardRecipient } from './guard.ts'
import type { GuardResult } from './guard.ts'
import {
  isAttachmentTooLarge,
  plainTextToEmailHtml,
  renderAccountantText,
  renderReviewText,
  TemplateError,
} from './mail.ts'
import { TRANSPORT_TIMEOUT_MS, type TransportOutcome, type TransportPayload } from './transport.ts'

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024

// כמה מיילים אישיים בקריאה אחת (חוזה §3.1, W0-CHECK 4: 8). ⚠️ ועוד תקציב-זמן: 8 × 25 שניות
// במקרה הגרוע הן 200 שניות, יותר ממגבלת זמן-הקיר של פונקציית-שרת (ממצא-רשות 10 של בודק 1).
// לכן לא מתחילים ניסיון חדש אם הוא עלול לחרוג מהתקציב; מה שלא התחיל נשאר בתור, והמסך ממשיך
// ב-`distribute_continue`.
export const DISTRIBUTE_BATCH = 8
export const WALL_BUDGET_MS = 120_000
const SEND_MARGIN_MS = 10_000

// ── צורות ─────────────────────────────────────────────────────────────────────

export interface RpcError {
  message?: string
  code?: string
  details?: string
  hint?: string
}
export interface RpcResult {
  data: unknown
  error: RpcError | null
}
type Rpc = (name: string, args: Record<string, unknown>) => Promise<RpcResult>

export interface PayrollDeps {
  actorEmail: string
  userRpc: Rpc
  adminRpc: Rpc
  uploadArtifact(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<{ error: string | null }>
  downloadArtifact(key: string): Promise<{ bytes: Uint8Array | null; error: string | null }>
  readTemplate(name: string): Promise<{ text: string | null; error: string | null }>
  buildXlsx(doc: SalaryDocument): Promise<Uint8Array>
  sha256Hex(bytes: Uint8Array): Promise<string>
  toBase64(bytes: Uint8Array): string
  transport(payload: TransportPayload): Promise<TransportOutcome>
  now(): number
}

export interface Failure {
  ok: false
  code: string
  message: string
  retryable: boolean
  httpStatus?: number
  extra?: Record<string, unknown>
}
type Result<T> = { ok: true; data: T } | Failure

type Json = Record<string, unknown>

export interface AttemptReport {
  attempt_id: number
  recipient_id: number | null
  state: 'sent' | 'failed' | 'unknown' | 'skipped' | 'not_started'
  delivered_recipient: string | null
  redirected: boolean | null
  code?: string
}

// ── הודעות ────────────────────────────────────────────────────────────────────
// הודעות של קודים שנולדים כאן. קודים שנולדים במסד נושאים את ההודעה העברית שלו.
const EDGE_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: 'הבקשה אינה תקינה. יש לרענן את הדף ולנסות שוב.',
  ORIGIN_NOT_ALLOWED: 'כתובת האפליקציה אינה מורשית לשליחת קישורי בדיקה.',
  PERMISSION_DENIED: 'אין לך הרשאה לבצע את הפעולה.',
  RPC_ERROR: 'אירעה תקלה בשרת. אפשר לבדוק את הסטטוס ולהמשיך מאותה נקודה.',
  ARTIFACT_TOO_LARGE: 'קובץ הדוח גדול מדי לשליחה במייל — הדוח לא הופק.',
  XLSX_BUILD_FAILED: 'בניית קובץ הדוח נכשלה — הדוח לא הופק.',
  STORAGE_UPLOAD_FAILED: 'שמירת קובץ הדוח נכשלה — הדוח לא הופק.',
  OPERATION_STATE: 'הפעולה כבר אינה פעילה. יש לפתוח את הדוח מחדש.',
}

function fail(code: string, extra?: Json, message?: string): Failure {
  const retryable = ['RPC_ERROR', 'PAYROLL_BUSY', 'REVIEW_NOT_READY'].includes(code)
  const out: Failure = {
    ok: false,
    code,
    message: message ?? EDGE_MESSAGES[code] ?? 'הפעולה לא הושלמה.',
    retryable,
  }
  if (code === 'PERMISSION_DENIED') out.httpStatus = 403
  if (extra) out.extra = extra
  return out
}

// שגיאת-מסד ⇒ קוד יציב (חוזה D7): `detail = 'PAYROLL:<CODE>'` · `42501` ⇒ PERMISSION_DENIED ·
// ותשובה `{ok:false, code}` (snapshot ו-commit מחזירים כך, כדי שהכשל יישמר ולא יגולגל אחורה).
// ⚠️ שגיאה לא-מזוהה **אינה** מוצגת כלשונה (עלולה לחשוף פרטי-מסד) — היא נרשמת ללוג בלבד.
export function normalizeRpc<T = Json>(name: string, res: RpcResult): Result<T> {
  const error = res.error
  if (error) {
    const details = typeof error.details === 'string' ? error.details : ''
    if (details.startsWith('PAYROLL:')) {
      const code = details.slice('PAYROLL:'.length)
      const extra = parseHint(error.hint)
      return fail(code, extra, error.message || undefined)
    }
    if (error.code === '42501') return fail('PERMISSION_DENIED')
    console.error(`payroll rpc ${name} failed:`, error.code ?? '', error.message ?? '')
    return fail('RPC_ERROR')
  }
  const data = res.data
  if (data && typeof data === 'object' && (data as Json).ok === false) {
    const d = data as Json
    const code = typeof d.code === 'string' ? d.code : 'RPC_ERROR'
    const { ok: _ok, code: _code, message, ...rest } = d
    return fail(code, rest, typeof message === 'string' ? message : undefined)
  }
  return { ok: true, data: data as T }
}

function parseHint(hint: unknown): Json | undefined {
  if (typeof hint !== 'string' || !hint.startsWith('{')) return undefined
  try {
    const parsed = JSON.parse(hint)
    return parsed && typeof parsed === 'object' ? (parsed as Json) : undefined
  } catch {
    // רמז שאינו JSON אינו מידע שימושי ללקוח; ההודעה והקוד כבר נמסרו.
    return undefined
  }
}

// פרטי-שגיאה נשמרים ב-`payroll_mail_attempts.error_detail` — עד 500 תווים ובלי כתובות URL
// (הודעת-רשת עלולה לכלול את כתובת ה-webhook הסודית, או קישור עם טוקן).
export function sanitizeDetail(detail: unknown): string | null {
  if (detail === null || detail === undefined) return null
  const text = String(detail).replace(/https?:\/\/\S+/gi, '[url]')
  return text.slice(0, 500)
}

// ── אימות בקשה ────────────────────────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PERIOD = /^\d{4}-\d{2}(-01)?$/

const isPositiveInt = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0
const isNonEmpty = (v: unknown, max = 200): v is string =>
  typeof v === 'string' && v.trim() !== '' && v.length <= max

function optionalOriginal(v: unknown): boolean {
  return v === null || v === undefined || isPositiveInt(v)
}

export type PayrollRequest =
  | {
      action: 'issue'
      operation_id: string
      review_id: number
      expected_version: string
      period: string
      kind: 'regular' | 'supplement'
      original_report_id: number | null
    }
  | { action: 'resume'; operation_id: string }
  | {
      action: 'distribute'
      review_id: number
      expected_revision: number
      recipient_ids: number[] | null
      mode: 'initial' | 'reminder'
      request_id: string
      app_origin: string
    }
  | { action: 'distribute_continue'; review_id: number; app_origin: string }
  | {
      action: 'resend_review'
      recipient_id: number
      prior_attempt_id: number
      acknowledge_unknown: boolean
      app_origin: string
    }
  | {
      action: 'retry_accountant'
      report_id: number
      prior_attempt_id: number
      confirmed_recipient: string
      acknowledge_unknown: boolean
    }

function validIssue(b: Json): boolean {
  const kindOk = b.kind === 'regular' || b.kind === 'supplement'
  return (
    typeof b.operation_id === 'string' &&
    UUID.test(b.operation_id) &&
    isPositiveInt(b.review_id) &&
    isNonEmpty(b.expected_version) &&
    typeof b.period === 'string' &&
    PERIOD.test(b.period) &&
    kindOk &&
    optionalOriginal(b.original_report_id)
  )
}

function validDistribute(b: Json): boolean {
  const ids = b.recipient_ids
  const idsOk =
    ids === null ||
    ids === undefined ||
    (Array.isArray(ids) && ids.length > 0 && ids.length <= 500 && ids.every(isPositiveInt))
  return (
    isPositiveInt(b.review_id) &&
    Number.isInteger(b.expected_revision) &&
    idsOk &&
    (b.mode === 'initial' || b.mode === 'reminder') &&
    typeof b.request_id === 'string' &&
    UUID.test(b.request_id)
  )
}

function validResendReview(b: Json): boolean {
  return (
    isPositiveInt(b.recipient_id) &&
    isPositiveInt(b.prior_attempt_id) &&
    typeof (b.acknowledge_unknown ?? false) === 'boolean'
  )
}

function validRetryAccountant(b: Json): boolean {
  return (
    isPositiveInt(b.report_id) &&
    isPositiveInt(b.prior_attempt_id) &&
    isNonEmpty(b.confirmed_recipient, 320) &&
    typeof (b.acknowledge_unknown ?? false) === 'boolean'
  )
}

const VALIDATORS: Record<string, (b: Json) => boolean> = {
  issue: validIssue,
  resume: (b) => typeof b.operation_id === 'string' && UUID.test(b.operation_id),
  distribute: validDistribute,
  distribute_continue: (b) => isPositiveInt(b.review_id),
  resend_review: validResendReview,
  retry_accountant: validRetryAccountant,
}

export function parseRequest(body: unknown): PayrollRequest | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const b = body as Json
  const validate = typeof b.action === 'string' ? VALIDATORS[b.action] : undefined
  if (!validate || !validate(b)) return null
  return {
    ...b,
    original_report_id: b.original_report_id ?? null,
    recipient_ids: b.recipient_ids ?? null,
    acknowledge_unknown: b.acknowledge_unknown === true,
  } as unknown as PayrollRequest
}

// `app_origin` מגיע מהדפדפן, ולכן הוא נבדק מול רשימה סגורה מההגדרות (`PAYROLL_ALLOWED_ORIGINS`).
// בלי הבדיקה, מי שמחזיק הרשאת-כספים היה יכול לשלוח לדיילות קישור לאתר זר. רשימה ריקה = אין
// קישורים כלל (נעילה, לא פתיחה).
// ברירת המחדל כשאין הגדרה בסביבה: כתובת האתר בייצור ושרת הפיתוח המקומי. מקודד בקוד, כמו שומר
// הנמענים — רשימה סגורה, בלי צעד ידני בלוח הבקרה (הסגן, 14.10: ישי ביקש לא להעמיס עליו צעד ידיים).
// הגדרה בסביבה, כשקיימת ואינה ריקה, גוברת.
export const DEFAULT_ALLOWED_ORIGINS = 'https://reg-in-umber.vercel.app,http://localhost:5173'

export function resolveAllowedOrigins(fromEnv: string | undefined): string {
  return fromEnv && fromEnv.trim() ? fromEnv : DEFAULT_ALLOWED_ORIGINS
}

export function originAllowed(origin: unknown, allowedCsv: string | undefined): string | null {
  if (typeof origin !== 'string') return null
  const normalized = origin.trim().replace(/\/+$/, '')
  const allowed = (allowedCsv ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  return allowed.includes(normalized) ? normalized : null
}

// ── הפקה: runOperation (חוזה §3.1, §3.2) ──────────────────────────────────────

function actorArgs(deps: PayrollDeps, extra: Json): Json {
  return { ...extra, p_actor_email: deps.actorEmail }
}

async function failOperation(
  deps: PayrollDeps,
  operationId: string,
  failure: Failure,
  detail?: string,
): Promise<Failure> {
  const res = normalizeRpc(
    'payroll_operation_fail',
    await deps.adminRpc(
      'payroll_operation_fail',
      actorArgs(deps, {
        p_operation_id: operationId,
        p_code: failure.code,
        p_detail: sanitizeDetail(detail ?? failure.message),
      }),
    ),
  )
  // אם גם הרישום נכשל — הפעולה נשארת `preparing`, ו"המשך" יבנה אותה מחדש עם מפתח קובץ חדש.
  if (!res.ok) console.error('payroll_operation_fail failed:', res.code)
  return failure
}

// צעדים 1–5: תמונת-מצב ⇒ מסמך ⇒ בדיקת גודל ⇒ העלאה ⇒ רישום הקובץ. מחזיר `ok` או כשל.
async function prepareArtifact(deps: PayrollDeps, operationId: string): Promise<Result<null>> {
  const snap = normalizeRpc<Json>(
    'payroll_operation_snapshot',
    await deps.adminRpc(
      'payroll_operation_snapshot',
      actorArgs(deps, { p_operation_id: operationId }),
    ),
  )
  if (!snap.ok) return snap
  const snapshot = snap.data

  let doc: SalaryDocument
  try {
    // ⚠️ חותמת-ההפקה היא `generated_at` שהמסד קבע בפעם הראשונה — לא השעון של השרת הזה. כך
    // "המשך" אחרי קריסה בונה מסמך עם אותה חותמת.
    doc = buildSalaryReportDocument(snapshot, { generatedAt: snapshot.generated_at })
  } catch (err) {
    const code = err instanceof SalaryReportError ? err.code : 'XLSX_BUILD_FAILED'
    const message = err instanceof Error ? err.message : undefined
    return failOperation(deps, operationId, fail(code, undefined, message))
  }
  // F12: הרו"ח מחשב שעות נוספות לפי יום, ולכן בקובץ הסופי לכל שורה מוצגת חייב להיות תאריך.
  // (בונה המסמך מציג `—` לתאריך חסר — זה נכון לשחזור של דוח ישן, לא לדוח שמופק עכשיו.)
  if (doc.lines.some((line) => line.showInFile && !displayDate(line.eventDate))) {
    return failOperation(
      deps,
      operationId,
      fail('SALARY_LINE_DATE_MISSING', undefined, 'לשורה בדוח חסר תאריך משמרת — הדוח לא הופק.'),
    )
  }

  let bytes: Uint8Array
  try {
    bytes = await deps.buildXlsx(doc)
  } catch (err) {
    return failOperation(deps, operationId, fail('XLSX_BUILD_FAILED'), String(err))
  }

  const base64Length = Math.ceil(bytes.length / 3) * 4
  if (bytes.length > MAX_ARTIFACT_BYTES || isAttachmentTooLarge(base64Length)) {
    return failOperation(deps, operationId, fail('ARTIFACT_TOO_LARGE'), `${bytes.length} bytes`)
  }

  const prefix = snapshot.artifact_key_prefix
  if (typeof prefix !== 'string' || !prefix.startsWith('payroll/') || !prefix.endsWith('/')) {
    return failOperation(deps, operationId, fail('STORAGE_UPLOAD_FAILED'), 'bad key prefix')
  }
  // מפתח חדש בכל ניסיון הכנה (`prepare_attempt`) ו-`upsert:false`: קובץ לעולם אינו נדרס.
  // קובץ יתום מניסיון שקרס אינו מוצבע מאף שורה ואינו נמחק כאן.
  const key = `${prefix}${snapshot.prepare_attempt}_${doc.fileName}`
  const upload = await deps.uploadArtifact(key, bytes, XLSX_MIME)
  if (upload.error) {
    return failOperation(deps, operationId, fail('STORAGE_UPLOAD_FAILED'), upload.error)
  }
  const sha256 = await deps.sha256Hex(bytes)

  const recorded = normalizeRpc(
    'payroll_operation_record_artifact',
    await deps.adminRpc(
      'payroll_operation_record_artifact',
      actorArgs(deps, {
        p_operation_id: operationId,
        p_key: key,
        p_sha256: sha256,
        p_size: bytes.length,
        p_mime: XLSX_MIME,
        p_filename: doc.fileName,
      }),
    ),
  )
  if (!recorded.ok) return recorded
  return { ok: true, data: null }
}

function withOperation(failure: Failure, operationId: string): Failure {
  return { ...failure, extra: { ...(failure.extra ?? {}), operation_id: operationId } }
}

// ממשיך פעולה מהמצב השמור שלה. אותה פונקציה משרתת "הפק" (אחרי begin) ו"המשך" (אחרי קריסה).
export async function runOperation(
  deps: PayrollDeps,
  operationId: string,
): Promise<Json | Failure> {
  const status = normalizeRpc<Json>(
    'payroll_operation_status',
    await deps.userRpc('payroll_operation_status', { p_operation_id: operationId }),
  )
  if (!status.ok) return withOperation(status, operationId)
  const state = status.data.state

  if (state === 'failed' || state === 'superseded') {
    const code =
      typeof status.data.failure_code === 'string' ? status.data.failure_code : 'OPERATION_STATE'
    return withOperation(fail(code), operationId)
  }
  if (state !== 'preparing' && state !== 'prepared' && state !== 'committed') {
    return withOperation(fail('OPERATION_STATE'), operationId)
  }

  if (state === 'preparing') {
    const prepared = await prepareArtifact(deps, operationId)
    if (!prepared.ok) return withOperation(prepared, operationId)
  }

  // commit אידמפוטנטי: על פעולה שכבר נחתמה הוא מחזיר את התוצאה השמורה. `REVIEW_NOT_READY`
  // ו-`PAYROLL_BUSY` משאירים את הפעולה `prepared` — הקובץ עדיין תקף, ו"המשך" ינסה שוב.
  const committed = normalizeRpc<Json>(
    'payroll_commit',
    await deps.adminRpc('payroll_commit', actorArgs(deps, { p_operation_id: operationId })),
  )
  if (!committed.ok) return withOperation(committed, operationId)

  const attemptId = committed.data.attempt_id
  const attempt = isPositiveInt(attemptId) ? await dispatchAccountant(deps, attemptId) : null
  return {
    ok: true,
    operation_id: operationId,
    report_id: committed.data.report_id ?? null,
    total_amount: committed.data.total_amount ?? null,
    line_count: committed.data.line_count ?? null,
    attempt,
  }
}

// ── שליחה: ניסיון אחד (חוזה §3.1 dispatchAccountant / processQueued) ─────────

interface PreparedMail {
  text: string
  subject: string
  filename: string
  base64: string
  templateSha256: string | null
}

class DispatchError extends Error {
  code: string
  constructor(code: string, detail?: string) {
    super(detail ?? code)
    this.code = code
  }
}

async function loadTemplate(
  deps: PayrollDeps,
  name: unknown,
): Promise<{ text: string; sha: string }> {
  if (typeof name !== 'string' || !name)
    throw new DispatchError('TEMPLATE_INVALID', 'no template name')
  const t = await deps.readTemplate(name)
  if (t.error || !t.text || !t.text.trim())
    throw new DispatchError('TEMPLATE_INVALID', t.error ?? 'empty')
  return { text: t.text, sha: await deps.sha256Hex(new TextEncoder().encode(t.text)) }
}

function claimLabel(claim: Json): string {
  const seq = claim.report_kind === 'supplement' ? (claim.supplement_seq as number) : null
  return reportPeriodLabel(claim.period, seq)
}

async function prepareAccountantMail(deps: PayrollDeps, claim: Json): Promise<PreparedMail> {
  const artifact = claim.artifact as Json | null
  if (!artifact || typeof artifact.key !== 'string' || typeof artifact.sha256 !== 'string') {
    throw new DispatchError('ARTIFACT_UNAVAILABLE', 'no artifact in claim')
  }
  const download = await deps.downloadArtifact(artifact.key)
  if (download.error || !download.bytes) {
    throw new DispatchError('ARTIFACT_UNAVAILABLE', download.error ?? 'empty')
  }
  // הקובץ שנשלח הוא בדיוק הקובץ שנחתם: גיבוב מחדש מול מה שנרשם ב-commit.
  if ((await deps.sha256Hex(download.bytes)) !== artifact.sha256) {
    throw new DispatchError('ARTIFACT_HASH_MISMATCH')
  }
  const base64 = deps.toBase64(download.bytes)
  if (isAttachmentTooLarge(base64.length)) throw new DispatchError('ARTIFACT_TOO_LARGE')

  const template = await loadTemplate(deps, claim.template_name)
  const rendered = renderAccountantText(template.text, claimLabel(claim))
  return {
    text: rendered.text,
    subject: rendered.subject,
    filename: typeof artifact.filename === 'string' ? artifact.filename : '',
    base64,
    templateSha256: template.sha,
  }
}

async function prepareReviewMail(
  deps: PayrollDeps,
  claim: Json,
  attemptId: number,
  appOrigin: string | null,
): Promise<PreparedMail> {
  if (!appOrigin) throw new DispatchError('ORIGIN_NOT_ALLOWED')
  const hostessName = typeof claim.hostess_name === 'string' ? claim.hostess_name.trim() : ''
  const deadline = formatTimestampFull(claim.response_deadline)
  if (!hostessName || !deadline || !isPositiveInt(claim.recipient_id)) {
    throw new DispatchError('CLAIM_INCOMPLETE')
  }
  const template = await loadTemplate(deps, claim.template_name)
  const minted = normalizeRpc<unknown>(
    'payroll_review_mint_token',
    await deps.adminRpc(
      'payroll_review_mint_token',
      actorArgs(deps, { p_recipient_id: claim.recipient_id, p_attempt_id: attemptId }),
    ),
  )
  if (!minted.ok) throw new DispatchError(minted.code)
  const token = minted.data
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new DispatchError('TOKEN_INVALID')
  }
  const rendered = renderReviewText(template.text, {
    hostessName,
    periodLabel: claimLabel(claim),
    link: `${appOrigin}/payroll-review/${token}`,
    deadline,
  })
  return {
    text: rendered.text,
    subject: rendered.subject,
    filename: '',
    base64: '',
    templateSha256: template.sha,
  }
}

function errorCodeOf(err: unknown): string {
  if (err instanceof DispatchError || err instanceof GuardError || err instanceof TemplateError) {
    return err.code
  }
  return 'DISPATCH_FAILED'
}

interface Completion {
  outcome: 'sent' | 'failed' | 'unknown'
  guard: GuardResult | null
  templateSha256: string | null
  subject: string | null
  httpStatus: number | null
  errorCode: string | null
  errorDetail: string | null
}

async function complete(deps: PayrollDeps, attemptId: number, c: Completion): Promise<boolean> {
  const res = normalizeRpc(
    'payroll_attempt_complete',
    await deps.adminRpc(
      'payroll_attempt_complete',
      actorArgs(deps, {
        p_attempt_id: attemptId,
        p_outcome: c.outcome,
        p_delivered: c.guard?.delivered ?? null,
        p_redirected: c.guard?.redirected ?? null,
        p_template_sha256: c.templateSha256,
        p_subject: c.subject,
        p_http_status: c.httpStatus,
        p_error_code: c.errorCode,
        p_error_detail: sanitizeDetail(c.errorDetail),
      }),
    ),
  )
  if (!res.ok) console.error('payroll_attempt_complete failed:', attemptId, res.code)
  return res.ok
}

type Preparer = (claim: Json) => Promise<PreparedMail>

// ניסיון אחד: claim ⇒ הכנה ⇒ שומר ⇒ שליחה ⇒ complete. אותו מסלול לרו"ח ולדיילת.
async function deliverAttempt(
  deps: PayrollDeps,
  attemptId: number,
  prepare: Preparer,
): Promise<AttemptReport> {
  const base = {
    attempt_id: attemptId,
    recipient_id: null,
    delivered_recipient: null,
    redirected: null,
  }
  const claimed = normalizeRpc<Json>(
    'payroll_attempt_claim',
    await deps.adminRpc('payroll_attempt_claim', actorArgs(deps, { p_attempt_id: attemptId })),
  )
  if (!claimed.ok) {
    // NOT_CLAIMABLE = מישהו אחר כבר שולח את הניסיון הזה (או שכבר הסתיים) ⇒ מדלגים, לא שולחים.
    const state = claimed.code === 'NOT_CLAIMABLE' ? 'skipped' : 'not_started'
    return { ...base, state, code: claimed.code }
  }
  const claim = claimed.data
  const recipientId = isPositiveInt(claim.recipient_id) ? claim.recipient_id : null

  // שלב א: כל מה שיכול להיכשל **לפני** שהבקשה יוצאת ⇒ "נכשל" בוודאות.
  let mail: PreparedMail
  let guard: GuardResult
  try {
    mail = await prepare(claim)
    guard = guardRecipient(String(claim.intended_recipient ?? ''))
  } catch (err) {
    const code = errorCodeOf(err)
    const recorded = await complete(deps, attemptId, {
      outcome: 'failed',
      guard: null,
      templateSha256: null,
      subject: null,
      httpStatus: null,
      errorCode: code,
      errorDetail: err instanceof Error ? err.message : null,
    })
    return { ...base, recipient_id: recipientId, state: recorded ? 'failed' : 'unknown', code }
  }

  // F13: ההפניה משנה רק את ה-To. נושא וגוף זהים למייל שהיה יוצא לנמען המקורי.
  const subject = mail.subject
  // שלב ב: היציאה ל-Make.
  const sent = await deps.transport({
    to: guard.delivered,
    subject,
    body: plainTextToEmailHtml(mail.text),
    filename: mail.filename,
    pdf_base64: mail.base64,
  })
  const recorded = await complete(deps, attemptId, {
    outcome: sent.outcome,
    guard,
    templateSha256: mail.templateSha256,
    subject,
    httpStatus: sent.httpStatus,
    errorCode: sent.outcome === 'sent' ? null : sent.errorCode,
    errorDetail: sent.outcome === 'unknown' ? sent.detail : null,
  })
  // complete שנכשל משאיר את הניסיון `sending`, והמסד יראה אותו "לא ידוע" כשהחכירה תפוג.
  // זו גם התשובה הכנה ללקוח: המצב השמור הוא שקובע.
  return {
    attempt_id: attemptId,
    recipient_id: recipientId,
    state: recorded ? sent.outcome : 'unknown',
    delivered_recipient: guard.delivered,
    redirected: guard.redirected,
    ...(sent.outcome === 'sent' ? {} : { code: sent.errorCode }),
  }
}

export function dispatchAccountant(deps: PayrollDeps, attemptId: number): Promise<AttemptReport> {
  return deliverAttempt(deps, attemptId, (claim) => prepareAccountantMail(deps, claim))
}

export function dispatchReview(
  deps: PayrollDeps,
  attemptId: number,
  appOrigin: string | null,
): Promise<AttemptReport> {
  return deliverAttempt(deps, attemptId, (claim) =>
    prepareReviewMail(deps, claim, attemptId, appOrigin),
  )
}

function queuedAttemptIds(data: unknown): number[] | null {
  const list = Array.isArray(data) ? data : (data as Json | null)?.attempts
  if (!Array.isArray(list)) return null
  return list.map((row) => (row as Json)?.attempt_id).filter(isPositiveInt)
}

// עד 8 ניסיונות בתור לביקורת אחת, בתוך תקציב-הזמן. `remaining` = מה שנשאר בתור ולא התחיל.
export async function processQueued(
  deps: PayrollDeps,
  reviewId: number,
  appOrigin: string,
  startedAt: number,
): Promise<Result<{ processed: AttemptReport[]; remaining: number }>> {
  const queued = normalizeRpc<unknown>(
    'payroll_review_queued_attempts',
    await deps.userRpc('payroll_review_queued_attempts', { p_review_id: reviewId, p_limit: 1000 }),
  )
  if (!queued.ok) return queued
  const ids = queuedAttemptIds(queued.data)
  if (!ids) return fail('RPC_ERROR')

  const processed: AttemptReport[] = []
  for (const id of ids.slice(0, DISTRIBUTE_BATCH)) {
    const elapsed = deps.now() - startedAt
    if (elapsed + TRANSPORT_TIMEOUT_MS + SEND_MARGIN_MS > WALL_BUDGET_MS) break
    processed.push(await dispatchReview(deps, id, appOrigin))
  }
  return { ok: true, data: { processed, remaining: Math.max(0, ids.length - processed.length) } }
}

// ── נתב הפעולות (חוזה §3.1) ───────────────────────────────────────────────────

export interface HandleContext {
  allowedOrigins: string | undefined
}

async function handleDistribute(
  deps: PayrollDeps,
  req: Extract<PayrollRequest, { action: 'distribute' }>,
  origin: string,
): Promise<Json | Failure> {
  const startedAt = deps.now()
  const begun = normalizeRpc<Json>(
    'payroll_review_distribute_begin',
    await deps.userRpc('payroll_review_distribute_begin', {
      p_review_id: req.review_id,
      p_expected_revision: req.expected_revision,
      p_recipient_ids: req.recipient_ids,
      p_mode: req.mode,
      p_request_id: req.request_id,
    }),
  )
  if (!begun.ok) return begun
  const run = await processQueued(deps, req.review_id, origin, startedAt)
  if (!run.ok) return run
  const skipped = Array.isArray(begun.data.skipped) ? begun.data.skipped : []
  return { ok: true, processed: run.data.processed, skipped, remaining: run.data.remaining }
}

async function handleContinue(
  deps: PayrollDeps,
  reviewId: number,
  origin: string,
): Promise<Json | Failure> {
  const run = await processQueued(deps, reviewId, origin, deps.now())
  if (!run.ok) return run
  return { ok: true, processed: run.data.processed, skipped: [], remaining: run.data.remaining }
}

async function handleResendReview(
  deps: PayrollDeps,
  req: Extract<PayrollRequest, { action: 'resend_review' }>,
  origin: string,
): Promise<Json | Failure> {
  const reserved = normalizeRpc<Json>(
    'payroll_review_resend_reserve',
    await deps.userRpc('payroll_review_resend_reserve', {
      p_recipient_id: req.recipient_id,
      p_prior_attempt_id: req.prior_attempt_id,
      p_acknowledge_unknown: req.acknowledge_unknown,
    }),
  )
  if (!reserved.ok) return reserved
  if (!isPositiveInt(reserved.data.attempt_id)) return fail('RPC_ERROR')
  return { ok: true, attempt: await dispatchReview(deps, reserved.data.attempt_id, origin) }
}

async function handleRetryAccountant(
  deps: PayrollDeps,
  req: Extract<PayrollRequest, { action: 'retry_accountant' }>,
): Promise<Json | Failure> {
  const reserved = normalizeRpc<Json>(
    'payroll_accountant_retry_reserve',
    await deps.userRpc('payroll_accountant_retry_reserve', {
      p_report_id: req.report_id,
      p_prior_attempt_id: req.prior_attempt_id,
      p_confirmed_recipient: req.confirmed_recipient,
      p_acknowledge_unknown: req.acknowledge_unknown,
    }),
  )
  if (!reserved.ok)
    return { ...reserved, extra: { ...(reserved.extra ?? {}), report_id: req.report_id } }
  if (!isPositiveInt(reserved.data.attempt_id)) return fail('RPC_ERROR')
  return {
    ok: true,
    report_id: req.report_id,
    attempt: await dispatchAccountant(deps, reserved.data.attempt_id),
  }
}

async function handleIssue(
  deps: PayrollDeps,
  req: Extract<PayrollRequest, { action: 'issue' }>,
): Promise<Json | Failure> {
  const begun = normalizeRpc<Json>(
    'payroll_operation_begin',
    await deps.userRpc('payroll_operation_begin', {
      p_operation_id: req.operation_id,
      p_review_id: req.review_id,
      p_expected_version: req.expected_version,
      p_period: req.period.length === 7 ? `${req.period}-01` : req.period,
      p_kind: req.kind,
      p_original_report_id: req.original_report_id,
    }),
  )
  if (!begun.ok) return withOperation(begun, req.operation_id)
  // פעולה פעילה קיימת עם אותה גרסה (לשונית שנייה, לחיצה כפולה) ⇒ ממשיכים אותה, לא פותחים חדשה.
  const opId =
    typeof begun.data.operation_id === 'string' ? begun.data.operation_id : req.operation_id
  return runOperation(deps, opId)
}

const LINK_ACTIONS = new Set(['distribute', 'distribute_continue', 'resend_review'])

export async function handleRequest(
  deps: PayrollDeps,
  body: unknown,
  ctx: HandleContext,
): Promise<Json | Failure> {
  const req = parseRequest(body)
  if (!req) return fail('INVALID_REQUEST')
  let origin: string | null = null
  if (LINK_ACTIONS.has(req.action)) {
    origin = originAllowed((body as Json).app_origin, ctx.allowedOrigins)
    if (!origin) return fail('ORIGIN_NOT_ALLOWED')
  }
  switch (req.action) {
    case 'issue':
      return handleIssue(deps, req)
    case 'resume':
      return runOperation(deps, req.operation_id)
    case 'distribute':
      return handleDistribute(deps, req, origin as string)
    case 'distribute_continue':
      return handleContinue(deps, req.review_id, origin as string)
    case 'resend_review':
      return handleResendReview(deps, req, origin as string)
    case 'retry_accountant':
      return handleRetryAccountant(deps, req)
  }
}

// כשל ⇒ גוף התשובה ללקוח (חוזה §3 "Response convention"): 200 עם `{ok:false, code, message,
// retryable, ...}`; 403 רק להרשאה.
export function failureBody(f: Failure): { status: number; body: Json } {
  return {
    status: f.httpStatus ?? 200,
    body: {
      ok: false,
      code: f.code,
      message: f.message,
      retryable: f.retryable,
      ...(f.extra ?? {}),
    },
  }
}
